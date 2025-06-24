from pydantic import BaseModel, Field, validator, field_validator
from typing import List, Optional
from datetime import datetime
import uuid


class FocusSlot(BaseModel):
    start_time: str = Field(..., pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$", description="Time in HH:MM format")
    end_time: str = Field(..., pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$", description="Time in HH:MM format")
    focus_level: str = Field(..., pattern="^(high|medium|low)$", description="Focus level")

    @field_validator('end_time')
    def validate_time_range(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('End time must be after start time')
        return v


class AvailabilitySlot(BaseModel):
    start_time: str = Field(..., pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$", description="Time in HH:MM format")
    end_time: str = Field(..., pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$", description="Time in HH:MM format")
    status: str = Field(..., pattern="^(available|busy|tentative)$", description="Availability status")

    @field_validator('end_time')
    def validate_time_range(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('End time must be after start time')
        return v


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
    calendar_day_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CalendarDayBulkUpdate(BaseModel):
    days: List[CalendarDayCreate]


class CalendarDayListResponse(BaseModel):
    days: List[CalendarDayResponse]
    total: int
    start_date: str
    end_date: str 