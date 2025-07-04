from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from ...db.session import get_db
from ...db.models import User, UserCalendarDay, WorkEnvironmentEnum
from ...schemas.calendar import (
    CalendarDayCreate, CalendarDayUpdate, CalendarDayResponse,
    CalendarDayBulkUpdate, CalendarDayListResponse
)
from ...core.auth import get_current_user

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.get("/days", response_model=CalendarDayListResponse)
async def get_calendar_days(
    start_date: str = Query(..., pattern="^\d{4}-\d{2}-\d{2}$", description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., pattern="^\d{4}-\d{2}-\d{2}$", description="End date in YYYY-MM-DD format"),
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
    
    days = db.query(UserCalendarDay).filter(
        UserCalendarDay.user_id == current_user.user_id,
        UserCalendarDay.date >= start_date,
        UserCalendarDay.date <= end_date
    ).order_by(UserCalendarDay.date).all()
    
    total = len(days)
    
    return CalendarDayListResponse(
        days=[CalendarDayResponse.model_validate(day) for day in days],
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