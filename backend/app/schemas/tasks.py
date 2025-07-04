from pydantic import BaseModel, Field, validator, field_validator
from typing import Optional, List
from datetime import datetime
import uuid


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Category name")
    color_hex: str = Field(default="#3B82F6", pattern="^#[0-9A-Fa-f]{6}$", description="Hex color code")


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color_hex: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")


class CategoryResponse(CategoryBase):
    category_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Task title")
    description: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    priority: str = Field(default="medium", pattern="^(low|medium|high|urgent)$")
    estimated_duration_minutes: int = Field(..., gt=0, description="Duration in minutes")
    deadline: Optional[datetime] = None
    jira_link: Optional[str] = Field(None, max_length=500)
    fitting_environments: List[str] = Field(default=["home"])
    parent_task_id: Optional[uuid.UUID] = None
    
    # Task Properties
    requires_focus: bool = False
    requires_deep_work: bool = False
    can_be_interrupted: bool = True
    requires_meeting: bool = False
    is_endless: bool = False
    is_recurring: bool = False
    
    # Recurring Pattern
    recurring_pattern: Optional[dict] = None

    @field_validator('priority')
    def uppercase_priority(cls, v):
        if v:
            return v.upper()
        return v

    @field_validator('fitting_environments')
    def validate_environments(cls, v):
        valid_envs = ["home", "office", "outdoors", "hybrid"]
        v_upper = []
        for env in v:
            env_lower = env.lower()
            if env_lower not in valid_envs:
                raise ValueError(f"Invalid environment: {env}. Must be one of {valid_envs}")
            v_upper.append(env.upper())
        return v_upper


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|urgent)$")
    estimated_duration_minutes: Optional[int] = Field(None, gt=0)
    deadline: Optional[datetime] = None
    status: Optional[str] = Field(None, pattern="^(todo|in_progress|completed|blocked|cancelled)$")
    jira_link: Optional[str] = Field(None, max_length=500)
    fitting_environments: Optional[List[str]] = None
    parent_task_id: Optional[uuid.UUID] = None
    
    # Task Properties
    requires_focus: Optional[bool] = None
    requires_deep_work: Optional[bool] = None
    can_be_interrupted: Optional[bool] = None
    requires_meeting: Optional[bool] = None
    is_endless: Optional[bool] = None
    is_recurring: Optional[bool] = None
    
    # Recurring Pattern
    recurring_pattern: Optional[dict] = None
    scheduled_slots: Optional[List[dict]] = None

    @field_validator('priority')
    def uppercase_priority(cls, v):
        if v:
            return v.upper()
        return v

    @field_validator('status')
    def uppercase_status(cls, v):
        if v:
            return v.upper()
        return v


class TaskResponse(TaskBase):
    task_id: uuid.UUID
    user_id: uuid.UUID
    status: str
    completed_at: Optional[datetime] = None
    scheduled_slots: List[dict] = []
    current_alerts: List[str] = []
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None

    model_config = {"from_attributes": True}

    @field_validator('status')
    def uppercase_status(cls, v):
        if v:
            return v.upper()
        return v


class TaskListResponse(BaseModel):
    tasks: List[TaskResponse]
    total: int
    page: int
    limit: int
    has_next: bool
    has_prev: bool


class TaskCommentBase(BaseModel):
    content: str = Field(..., min_length=1, description="Comment content")


class TaskCommentCreate(TaskCommentBase):
    pass


class TaskCommentUpdate(BaseModel):
    content: str = Field(..., min_length=1)


class TaskCommentResponse(TaskCommentBase):
    comment_id: uuid.UUID
    task_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TaskScheduleRequest(BaseModel):
    start_time: datetime
    end_time: datetime
    calendar_day_id: Optional[uuid.UUID] = None

    @field_validator('end_time')
    def validate_time_range(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('End time must be after start time')
        return v


class TaskScheduleResponse(BaseModel):
    task_id: uuid.UUID
    scheduled_slots: List[dict]
    validation_result: dict 