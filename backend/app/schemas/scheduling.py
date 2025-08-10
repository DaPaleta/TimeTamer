from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class ValidationResultEnum(str, Enum):
    ALLOWED = "allowed"
    BLOCKED = "blocked"
    WARNED = "warned"


class ActionEnum(str, Enum):
    ALLOW = "allow"
    BLOCK = "block"
    WARN = "warn"
    SUGGEST_ALTERNATIVE = "suggest_alternative"


class ValidationResult(BaseModel):
    is_valid: bool
    validation_result: ValidationResultEnum
    warnings: List[str] = []
    block_reasons: List[str] = []
    suggestions: List["SuggestionSlot"] = []
    rule_evaluations: List["RuleEvaluationResult"] = []


class SuggestionSlot(BaseModel):
    start_time: datetime
    end_time: datetime
    score: float = Field(..., ge=0.0, le=1.0)
    reason: str
    calendar_day_id: Optional[str] = None


class RuleEvaluationResult(BaseModel):
    rule_id: str
    rule_name: str
    action: ActionEnum
    triggered: bool
    message: Optional[str] = None
    severity: str = "info"


class SchedulingRuleCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    conditions: List[Dict[str, Any]]
    action: ActionEnum
    alert_message: Optional[str] = None
    priority_order: int = Field(default=100, ge=1, le=1000)
    is_active: bool = True


class SchedulingRuleResponse(SchedulingRuleCreate):
    rule_id: str
    created_at: datetime
    updated_at: datetime


class ValidationRequest(BaseModel):
    task_id: str
    proposed_start_time: str  # Local time string in format YYYY-MM-DDTHH:MM:SS
    proposed_end_time: str    # Local time string in format YYYY-MM-DDTHH:MM:SS

    @field_validator('proposed_start_time', 'proposed_end_time')
    @classmethod
    def parse_local_datetime(cls, v: str) -> datetime:
        """Parse local time string as datetime object (treating as local time, not UTC)"""
        try:
            # Parse the local time string as a naive datetime (no timezone info)
            return datetime.fromisoformat(v)
        except ValueError as e:
            raise ValueError(f"Invalid datetime format. Expected YYYY-MM-DDTHH:MM:SS, got: {v}") from e


class SuggestionRequest(BaseModel):
    task_id: str
    start_date: str  # YYYY-MM-DD
    end_date: str    # YYYY-MM-DD

class AutoScheduleRequest(BaseModel):
    task_ids: List[str]
    start_date: str  # YYYY-MM-DD
    end_date: str    # YYYY-MM-DD 