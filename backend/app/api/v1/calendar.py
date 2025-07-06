from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from ...db.session import get_db
from ...db.models import User, UserCalendarDay, WorkEnvironmentEnum, UserDaySettings
from ...schemas.calendar import (
    CalendarDayCreate, CalendarDayUpdate, CalendarDayResponse,
    CalendarDayBulkUpdate, CalendarDayListResponse,
    UserDaySettingsCreate, UserDaySettingsUpdate, UserDaySettingsResponse
)
from ...core.auth import get_current_user
from ...services.day_context import DayContextService

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.get("/days", response_model=CalendarDayListResponse)
async def get_calendar_days(
    start_date: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="End date in YYYY-MM-DD format"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get calendar days for a date range.
    
    - **start_date**: Start date in YYYY-MM-DD format
    - **end_date**: End date in YYYY-MM-DD format
    """
    # Validate date range
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date must be before or equal to end date"
        )
    
    # Generate day contexts using the service
    days = DayContextService.generate_day_contexts_for_range(
        str(current_user.user_id), start_date, end_date, db
    )
    
    total = len(days)
    
    return CalendarDayListResponse(
        days=days,
        total=total,
        start_date=start_date,
        end_date=end_date
    )


@router.get("/days/{date}", response_model=CalendarDayResponse)
async def get_calendar_day(
    date: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get calendar day configuration for a specific date.
    
    - **date**: Date in YYYY-MM-DD format
    """
    # Validate date format
    if not date or len(date) != 10 or date[4] != '-' or date[7] != '-':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    calendar_day = db.query(UserCalendarDay).filter(
        UserCalendarDay.user_id == current_user.user_id,
        UserCalendarDay.date == date
    ).first()
    
    if not calendar_day:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calendar day not found"
        )
    
    return calendar_day


@router.put("/days/{date}", response_model=CalendarDayResponse)
async def update_calendar_day(
    date: str,
    calendar_update: CalendarDayUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update calendar day configuration for a specific date.
    
    - **date**: Date in YYYY-MM-DD format
    """
    # Validate date format
    if not date or len(date) != 10 or date[4] != '-' or date[7] != '-':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    calendar_day = db.query(UserCalendarDay).filter(
        UserCalendarDay.user_id == current_user.user_id,
        UserCalendarDay.date == date
    ).first()
    
    if not calendar_day:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calendar day not found"
        )
    
    update_data = calendar_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        if field == 'work_environment' and value is not None:
            # Ensure work_environment is an Enum
            if not isinstance(value, WorkEnvironmentEnum):
                value = WorkEnvironmentEnum(value)
        setattr(calendar_day, field, value)
    
    try:
        db.commit()
        db.refresh(calendar_day)
        return calendar_day
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Calendar day update failed"
        )


@router.post("/days", response_model=CalendarDayResponse, status_code=status.HTTP_201_CREATED)
async def create_calendar_day(
    calendar_data: CalendarDayCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new calendar day configuration.
    """
    # Check if calendar day already exists for this user and date
    existing_day = db.query(UserCalendarDay).filter(
        UserCalendarDay.user_id == current_user.user_id,
        UserCalendarDay.date == calendar_data.date
    ).first()
    
    if existing_day:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Calendar day already exists for this date"
        )
    
    focus_slots = [slot.model_dump() if hasattr(slot, 'model_dump') else dict(slot) for slot in calendar_data.focus_slots]
    availability_slots = [slot.model_dump() if hasattr(slot, 'model_dump') else dict(slot) for slot in calendar_data.availability_slots]
    
    # Ensure work_environment is an Enum
    work_env = calendar_data.work_environment
    if not isinstance(work_env, WorkEnvironmentEnum):
        work_env = WorkEnvironmentEnum(work_env)
    db_calendar_day = UserCalendarDay(
        user_id=current_user.user_id,
        date=calendar_data.date,
        work_environment=work_env,
        focus_slots=focus_slots,
        availability_slots=availability_slots
    )
    
    try:
        db.add(db_calendar_day)
        db.commit()
        db.refresh(db_calendar_day)
        return db_calendar_day
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Calendar day creation failed"
        )


@router.post("/days/bulk-update", response_model=List[CalendarDayResponse])
async def bulk_update_calendar_days(
    bulk_update: CalendarDayBulkUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Bulk update calendar days.
    
    This endpoint will create new calendar days or update existing ones.
    """
    updated_days = []
    
    for day_data in bulk_update.days:
        # Check if calendar day already exists
        existing_day = db.query(UserCalendarDay).filter(
            UserCalendarDay.user_id == current_user.user_id,
            UserCalendarDay.date == day_data.date
        ).first()
        
        if existing_day:
            # Update existing day
            update_data = day_data.dict()
            for field, value in update_data.items():
                setattr(existing_day, field, value)
            updated_days.append(existing_day)
        else:
            # Create new day
            focus_slots = [slot.model_dump() if hasattr(slot, 'model_dump') else dict(slot) for slot in day_data.focus_slots]
            availability_slots = [slot.model_dump() if hasattr(slot, 'model_dump') else dict(slot) for slot in day_data.availability_slots]
            
            # Ensure work_environment is an Enum
            work_env = day_data.work_environment
            if not isinstance(work_env, WorkEnvironmentEnum):
                work_env = WorkEnvironmentEnum(work_env)
            db_calendar_day = UserCalendarDay(
                user_id=current_user.user_id,
                date=day_data.date,
                work_environment=work_env,
                focus_slots=focus_slots,
                availability_slots=availability_slots
            )
            db.add(db_calendar_day)
            updated_days.append(db_calendar_day)
    
    try:
        db.commit()
        # Refresh all updated days
        for day in updated_days:
            db.refresh(day)
        # Return as CalendarDayResponse models
        return [CalendarDayResponse.model_validate(day) for day in updated_days]
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bulk update failed"
        )


@router.delete("/days/{date}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_calendar_day(
    date: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete calendar day configuration for a specific date.
    
    - **date**: Date in YYYY-MM-DD format
    """
    # Validate date format
    if not date or len(date) != 10 or date[4] != '-' or date[7] != '-':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    calendar_day = db.query(UserCalendarDay).filter(
        UserCalendarDay.user_id == current_user.user_id,
        UserCalendarDay.date == date
    ).first()
    
    if not calendar_day:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calendar day not found"
        )
    
    try:
        db.delete(calendar_day)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete calendar day"
        )


# User Day Settings Endpoints

@router.get("/settings", response_model=List[UserDaySettingsResponse])
async def get_user_day_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all user day settings.
    """
    settings = db.query(UserDaySettings).filter(
        UserDaySettings.user_id == current_user.user_id
    ).order_by(UserDaySettings.created_at.desc()).all()
    
    return [UserDaySettingsResponse.model_validate(setting) for setting in settings]


@router.post("/settings", response_model=UserDaySettingsResponse, status_code=status.HTTP_201_CREATED)
async def create_user_day_setting(
    setting_data: UserDaySettingsCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new user day setting.
    """
    db_setting = UserDaySettings(
        user_id=current_user.user_id,
        setting_type=setting_data.setting_type,
        value=setting_data.value,
        recurrence_pattern=setting_data.recurrence_pattern.model_dump()
    )
    
    try:
        db.add(db_setting)
        db.commit()
        db.refresh(db_setting)
        return UserDaySettingsResponse.model_validate(db_setting)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create user day setting"
        )


@router.put("/settings/{setting_id}", response_model=UserDaySettingsResponse)
async def update_user_day_setting(
    setting_id: str,
    setting_update: UserDaySettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a user day setting.
    """
    setting = db.query(UserDaySettings).filter(
        UserDaySettings.setting_id == setting_id,
        UserDaySettings.user_id == current_user.user_id
    ).first()
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User day setting not found"
        )
    
    update_data = setting_update.dict(exclude_unset=True)
    
    # Handle recurrence_pattern separately
    if 'recurrence_pattern' in update_data:
        update_data['recurrence_pattern'] = update_data['recurrence_pattern'].model_dump()
    
    for field, value in update_data.items():
        setattr(setting, field, value)
    
    try:
        db.commit()
        db.refresh(setting)
        return UserDaySettingsResponse.model_validate(setting)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update user day setting"
        )


@router.delete("/settings/{setting_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_day_setting(
    setting_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a user day setting.
    """
    setting = db.query(UserDaySettings).filter(
        UserDaySettings.setting_id == setting_id,
        UserDaySettings.user_id == current_user.user_id
    ).first()
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User day setting not found"
        )
    
    try:
        db.delete(setting)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete user day setting"
        ) 