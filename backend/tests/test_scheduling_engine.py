import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.services.scheduling_engine import SchedulingEngine
from app.db.models import User, Task, Category, SchedulingRule, UserCalendarDay, WorkEnvironmentEnum, PriorityEnum
from app.schemas.scheduling import ActionEnum


class TestSchedulingEngine:
    def test_validate_placement_with_rules(self, db_session: Session, test_user: User):
        """Test rule evaluation during task placement validation"""
        # Create a category
        category = Category(
            user_id=test_user.user_id,
            name="Work",
            color_hex="#3B82F6"
        )
        db_session.add(category)
        db_session.commit()

        # Create a task
        task = Task(
            user_id=test_user.user_id,
            title="Test Task",
            priority=PriorityEnum.HIGH,
            estimated_duration_minutes=60,
            requires_focus=True,
            category_id=category.category_id
        )
        db_session.add(task)
        db_session.commit()

        # Create a calendar day with focus slots
        calendar_day = UserCalendarDay(
            user_id=test_user.user_id,
            date="2025-01-02",
            work_environment=WorkEnvironmentEnum.HOME,
            focus_slots=[{"start_time": "09:00", "end_time": "11:00", "focus_level": "high"}],
            availability_slots=[{"start_time": "09:00", "end_time": "17:00", "status": "available"}]
        )
        db_session.add(calendar_day)
        db_session.commit()

        # Create a scheduling rule that blocks high priority tasks outside focus time
        rule = SchedulingRule(
            user_id=test_user.user_id,
            name="Block high priority outside focus",
            description="Prevent high priority tasks from being scheduled outside focus time",
            conditions=[
                {
                    "source": "task_property",
                    "field": "priority",
                    "operator": "equals",
                    "value": "high"
                },
                {
                    "source": "time_slot",
                    "field": "is_focus_time",
                    "operator": "equals",
                    "value": False
                }
            ],
            action=ActionEnum.BLOCK,
            alert_message="High priority tasks must be scheduled during focus time",
            priority_order=1,
            is_active=True
        )
        db_session.add(rule)
        db_session.commit()

        # Test validation
        engine = SchedulingEngine(db_session)
        
        # Test within focus time (should pass)
        result = engine.validate_placement(
            str(task.task_id),
            datetime(2025, 1, 2, 9, 30),  # Within focus time
            datetime(2025, 1, 2, 10, 30),
            str(test_user.user_id)
        )
        assert result.is_valid == True

        # Test outside focus time (should be blocked by rule)
        result2 = engine.validate_placement(
            str(task.task_id),
            datetime(2025, 1, 2, 14, 0),  # Outside focus time
            datetime(2025, 1, 2, 15, 0),
            str(test_user.user_id)
        )
        assert result2.is_valid == False
        assert any("Block high priority outside focus" in reason for reason in result2.block_reasons)

    def test_rule_evaluation_with_categories(self, db_session: Session, test_user: User):
        """Test rule evaluation with category-based conditions"""
        # Create categories
        work_category = Category(
            user_id=test_user.user_id,
            name="Work",
            color_hex="#3B82F6"
        )
        personal_category = Category(
            user_id=test_user.user_id,
            name="Personal",
            color_hex="#10B981"
        )
        db_session.add_all([work_category, personal_category])
        db_session.commit()

        # Create tasks
        work_task = Task(
            user_id=test_user.user_id,
            title="Work Task",
            priority=PriorityEnum.MEDIUM,
            estimated_duration_minutes=30,
            category_id=work_category.category_id
        )
        personal_task = Task(
            user_id=test_user.user_id,
            title="Personal Task",
            priority=PriorityEnum.LOW,
            estimated_duration_minutes=30,
            category_id=personal_category.category_id
        )
        db_session.add_all([work_task, personal_task])
        db_session.commit()

        # Create calendar day
        calendar_day = UserCalendarDay(
            user_id=test_user.user_id,
            date="2025-01-02",
            work_environment=WorkEnvironmentEnum.HOME,
            focus_slots=[],
            availability_slots=[{"start_time": "09:00", "end_time": "17:00", "status": "available"}]
        )
        db_session.add(calendar_day)
        db_session.commit()

        # Create rule that blocks personal tasks during work hours
        rule = SchedulingRule(
            user_id=test_user.user_id,
            name="No personal tasks during work hours",
            conditions=[
                {
                    "source": "task_property",
                    "field": "category_id",
                    "operator": "equals",
                    "value": str(personal_category.category_id)
                },
                {
                    "source": "time_slot",
                    "field": "hour_of_day",
                    "operator": "greater_than",
                    "value": 8
                },
                {
                    "source": "time_slot",
                    "field": "hour_of_day",
                    "operator": "less_than",
                    "value": 17
                }
            ],
            action=ActionEnum.WARN,
            alert_message="Personal tasks should be scheduled outside work hours",
            priority_order=1,
            is_active=True
        )
        db_session.add(rule)
        db_session.commit()

        # Test validation
        engine = SchedulingEngine(db_session)
        
        # Test personal task during work hours (should warn)
        result = engine.validate_placement(
            str(personal_task.task_id),
            datetime(2025, 1, 2, 10, 0),  # During work hours
            datetime(2025, 1, 2, 10, 30),
            str(test_user.user_id)
        )
        assert result.is_valid == True
        assert any("No personal tasks during work hours" in warning for warning in result.warnings)

        # Test work task during work hours (should pass without warnings)
        result2 = engine.validate_placement(
            str(work_task.task_id),
            datetime(2025, 1, 2, 10, 0),  # During work hours
            datetime(2025, 1, 2, 10, 30),
            str(test_user.user_id)
        )
        assert result2.is_valid == True
        assert len(result2.warnings) == 0

    def test_rule_evaluation_with_work_environment(self, db_session: Session, test_user: User):
        """Test rule evaluation with work environment conditions"""
        # Create a task
        task = Task(
            user_id=test_user.user_id,
            title="Office Task",
            priority=PriorityEnum.MEDIUM,
            estimated_duration_minutes=60,
            fitting_environments=[WorkEnvironmentEnum.OFFICE]
        )
        db_session.add(task)
        db_session.commit()

        # Create calendar day with office environment
        calendar_day = UserCalendarDay(
            user_id=test_user.user_id,
            date="2025-01-02",
            work_environment=WorkEnvironmentEnum.OFFICE,
            focus_slots=[],
            availability_slots=[{"start_time": "09:00", "end_time": "17:00", "status": "available"}]
        )
        db_session.add(calendar_day)
        db_session.commit()

        # Create rule that requires office environment for certain tasks
        rule = SchedulingRule(
            user_id=test_user.user_id,
            name="Office tasks only in office",
            conditions=[
                {
                    "source": "calendar_day",
                    "field": "work_environment",
                    "operator": "not_equals",
                    "value": "office"
                }
            ],
            action=ActionEnum.BLOCK,
            alert_message="This task requires office environment",
            priority_order=1,
            is_active=True
        )
        db_session.add(rule)
        db_session.commit()

        # Test validation
        engine = SchedulingEngine(db_session)
        
        # Test in office environment (should pass)
        result = engine.validate_placement(
            str(task.task_id),
            datetime(2025, 1, 2, 10, 0),
            datetime(2025, 1, 2, 11, 0),
            str(test_user.user_id)
        )
        assert result.is_valid == True

        # Change calendar day to home environment
        calendar_day.work_environment = WorkEnvironmentEnum.HOME
        db_session.commit()

        # Test in home environment (should be blocked)
        result2 = engine.validate_placement(
            str(task.task_id),
            datetime(2025, 1, 2, 10, 0),
            datetime(2025, 1, 2, 11, 0),
            str(test_user.user_id)
        )
        assert result2.is_valid == False
        assert any("Office tasks only in office" in reason for reason in result2.block_reasons)
