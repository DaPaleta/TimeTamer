from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel, Field


class QuickStats(BaseModel):
    total_scheduled_minutes: int
    completed_tasks_count: int
    focus_time_utilization: float = Field(ge=0.0, le=1.0)
    top_category: Optional[Dict[str, object]] = None
    streak_days_completed: int = 0


class TrendPoint(BaseModel):
    date: str  # YYYY-MM-DD
    total_scheduled_minutes: int
    focus_minutes: int
    completed_tasks_count: int


class DashboardData(BaseModel):
    category_minutes: Dict[str, int]
    trend: List[TrendPoint]
    completion_rate: float = Field(ge=0.0, le=1.0)
    focus_utilization: float = Field(ge=0.0, le=1.0)


class GoalBase(BaseModel):
    name: str
    category_id: Optional[str] = None
    target_type: str  # minutes | percentage_of_scheduled_time | task_completion_count
    target_value: int
    time_period: str  # daily | weekly | monthly
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_active: Optional[bool] = True


class GoalCreate(GoalBase):
    pass


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[str] = None
    target_type: Optional[str] = None
    target_value: Optional[int] = None
    time_period: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_active: Optional[bool] = None


class Goal(BaseModel):
    goal_id: str
    user_id: str
    name: str
    category_id: Optional[str] = None
    target_type: str
    target_value: int
    time_period: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_active: bool
    created_at: str


class Period(BaseModel):
    start: str
    end: str


class GoalProgress(BaseModel):
    goal_id: str
    name: str
    target_type: str
    target_value: int
    period: Period
    achieved_value: int
    percent_complete: float
    status: str


