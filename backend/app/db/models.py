from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Text, 
    ForeignKey, Enum, JSON, ARRAY, CheckConstraint, Index
)
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from enum import Enum as PyEnum

Base = declarative_base()


class WorkEnvironmentEnum(PyEnum):
    HOME = "home"
    OFFICE = "office"
    OUTDOORS = "outdoors"
    HYBRID = "hybrid"


class PriorityEnum(PyEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TaskStatusEnum(PyEnum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"
    CANCELLED = "cancelled"


class FocusLevelEnum(PyEnum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class User(Base):
    __tablename__ = "users"
    
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    default_work_environment = Column(
        ENUM(WorkEnvironmentEnum), 
        default=WorkEnvironmentEnum.HOME
    )
    focus_times = Column(JSON, default=list)
    timezone = Column(String(50), default="UTC")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    calendar_days = relationship("UserCalendarDay", back_populates="user", cascade="all, delete-orphan")
    scheduling_rules = relationship("SchedulingRule", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")


class UserCalendarDay(Base):
    __tablename__ = "user_calendar_days"
    
    calendar_day_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    date = Column(String(10), nullable=False)  # YYYY-MM-DD format
    work_environment = Column(ENUM(WorkEnvironmentEnum), nullable=False)
    focus_slots = Column(JSON, default=list)
    availability_slots = Column(JSON, default=list)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="calendar_days")
    
    # Constraints
    __table_args__ = (
        Index('idx_user_date', 'user_id', 'date', unique=True),
    )


class Category(Base):
    __tablename__ = "categories"
    
    category_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    name = Column(String(100), nullable=False)
    color_hex = Column(String(7), default="#3B82F6")
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="categories")
    tasks = relationship("Task", back_populates="category")
    goals = relationship("Goal", back_populates="category")
    
    # Constraints
    __table_args__ = (
        Index('idx_user_category_name', 'user_id', 'name', unique=True),
    )


class Task(Base):
    __tablename__ = "tasks"
    
    task_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.category_id"))
    priority = Column(ENUM(PriorityEnum), default=PriorityEnum.MEDIUM)
    estimated_duration_minutes = Column(Integer, nullable=False)
    deadline = Column(DateTime)
    status = Column(ENUM(TaskStatusEnum), default=TaskStatusEnum.TODO)
    completed_at = Column(DateTime)
    jira_link = Column(String(500))
    fitting_environments = Column(ARRAY(ENUM(WorkEnvironmentEnum)), default=["any"])
    parent_task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.task_id"))
    
    # Task Properties (Boolean flags)
    requires_focus = Column(Boolean, default=False)
    requires_deep_work = Column(Boolean, default=False)
    can_be_interrupted = Column(Boolean, default=True)
    requires_meeting = Column(Boolean, default=False)
    is_endless = Column(Boolean, default=False)
    is_recurring = Column(Boolean, default=False)
    
    # Recurring Pattern
    recurring_pattern = Column(JSON)
    
    # Scheduling Information
    scheduled_slots = Column(JSON, default=list)
    current_alerts = Column(ARRAY(Text), default=list)
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="tasks")
    category = relationship("Category", back_populates="tasks")
    comments = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan")
    parent_task = relationship("Task", remote_side=[task_id])
    subtasks = relationship("Task", back_populates="parent_task")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('estimated_duration_minutes > 0', name='positive_duration'),
        Index('idx_tasks_user_status', 'user_id', 'status'),
        Index('idx_tasks_user_deadline', 'user_id', 'deadline'),
        Index('idx_tasks_user_category', 'user_id', 'category_id'),
    )


class TaskComment(Base):
    __tablename__ = "task_comments"
    
    comment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.task_id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    task = relationship("Task", back_populates="comments")
    user = relationship("User")


class SchedulingRule(Base):
    __tablename__ = "scheduling_rules"
    
    rule_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    conditions = Column(JSON, nullable=False)
    action = Column(String(20), nullable=False)
    alert_message = Column(Text)
    priority_order = Column(Integer, default=100)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="scheduling_rules")
    
    # Constraints
    __table_args__ = (
        CheckConstraint("action IN ('allow', 'block', 'warn', 'suggest_alternative')", name='valid_action'),
    )


class Goal(Base):
    __tablename__ = "goals"
    
    goal_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    name = Column(String(100), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.category_id"))
    target_type = Column(String(30), nullable=False)
    target_value = Column(Integer, nullable=False)
    time_period = Column(String(10), nullable=False)
    start_date = Column(String(10), default=func.current_date())  # YYYY-MM-DD format
    end_date = Column(String(10))  # YYYY-MM-DD format
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="goals")
    category = relationship("Category", back_populates="goals")
    
    # Constraints
    __table_args__ = (
        CheckConstraint("target_type IN ('minutes', 'percentage_of_scheduled_time', 'task_completion_count')", name='valid_target_type'),
        CheckConstraint("time_period IN ('daily', 'weekly', 'monthly')", name='valid_time_period'),
        CheckConstraint('target_value > 0', name='positive_target_value'),
    ) 