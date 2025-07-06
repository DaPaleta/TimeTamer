from pydantic import BaseModel, Field, validator, field_validator
from typing import List, Optional
from datetime import datetime
import uuid


class FocusSlot(BaseModel):
    start_time: str = Field(..., pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$", description="Time in HH:MM format")
    end_time: str = Field(..., pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$", description="Time in HH:MM format")
    focus_level: str = Field(..., pattern="^(high|medium|low)$", description="Focus level")

    @field_validator('end_time')
    def validate_time_range(cls, v, info):
        start_time = info.data.get('start_time')
        if start_time and v <= start_time:
            raise ValueError('End time must be after start time')
        return v


class AvailabilitySlot(BaseModel):
    start_time: str = Field(..., pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$", description="Time in HH:MM format")
    end_time: str = Field(..., pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$", description="Time in HH:MM format")
    status: str = Field(..., pattern="^(available|busy|tentative)$", description="Availability status")

    @field_validator('end_time')
    def validate_time_range(cls, v, info):
        start_time = info.data.get('start_time')
        if start_time and v <= start_time:
            raise ValueError('End time must be after start time')
        return v


# Base day context with system defaults
class BaseDayContext(BaseModel):
    work_environment: str = Field(default="home", pattern="^(home|office|outdoors|hybrid)$")
    focus_slots: List[FocusSlot] = [
        FocusSlot(start_time="09:00", end_time="11:00", focus_level="high"),
        FocusSlot(start_time="14:00", end_time="16:00", focus_level="medium")
    ]
    availability_slots: List[AvailabilitySlot] = [
        AvailabilitySlot(start_time="09:00", end_time="17:00", status="available")
    ]


# Recurrence pattern for user settings
class RecurrencePattern(BaseModel):
    pattern_type: str = Field(..., pattern="^(daily|weekly|monthly|custom)$", description="Pattern type")
    days_of_week: List[int] = Field(default=[], description="Days of week (0=Monday, 6=Sunday)")
    start_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Start date in YYYY-MM-DD format")
    end_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$", description="End date in YYYY-MM-DD format")
    interval: int = Field(default=1, ge=1, description="Every X days/weeks/months")

    @field_validator('days_of_week')
    def validate_days_of_week(cls, v):
        if v and not all(0 <= day <= 6 for day in v):
            raise ValueError('Days of week must be between 0 (Monday) and 6 (Sunday)')
        return v


# User day settings for recurring patterns
class UserDaySettingsBase(BaseModel):
    setting_type: str = Field(..., pattern="^(work_environment|focus_slots|availability_slots)$", description="Type of setting")
    value: dict = Field(..., description="The actual configuration value")
    recurrence_pattern: RecurrencePattern


class UserDaySettingsCreate(UserDaySettingsBase):
    pass


class UserDaySettingsUpdate(BaseModel):
    setting_type: Optional[str] = Field(None, pattern="^(work_environment|focus_slots|availability_slots)$")
    value: Optional[dict] = None
    recurrence_pattern: Optional[RecurrencePattern] = None
    is_active: Optional[bool] = None


class UserDaySettingsResponse(UserDaySettingsBase):
    setting_id: uuid.UUID
    user_id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CalendarDayBase(BaseModel):
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Date in YYYY-MM-DD format")
    work_environment: str = Field(..., pattern="^(home|office|outdoors|hybrid)$", description="Work environment")
    focus_slots: List[FocusSlot] = []
    availability_slots: List[AvailabilitySlot] = []


class CalendarDayCreate(CalendarDayBase):
    pass


class CalendarDayUpdate(BaseModel):
    work_environment: Optional[str] = Field(None, pattern="^(home|office|outdoors|hybrid)$")
    focus_slots: Optional[List[FocusSlot]] = None
    availability_slots: Optional[List[AvailabilitySlot]] = None


class CalendarDayResponse(CalendarDayBase):
    calendar_day_id: Optional[uuid.UUID] = None
    user_id: Optional[uuid.UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    source: str = Field(default="default", description="Source: 'default', 'user_settings', or 'daily_override'")

    model_config = {"from_attributes": True}


class CalendarDayBulkUpdate(BaseModel):
    days: List[CalendarDayCreate]


class CalendarDayListResponse(BaseModel):
    days: List[CalendarDayResponse]
    total: int
    start_date: str
    end_date: str 