from datetime import datetime
from sqlalchemy.orm import Session

from app.services.analytics_engine import AnalyticsEngine
from app.db.models import User, Task, Category, UserCalendarDay, WorkEnvironmentEnum


def test_daily_metrics_overlap(db_session: Session):
    # Create user
    user = User(username="u1", email="u1@example.com", password_hash="x")
    db_session.add(user)
    db_session.commit()

    # Category
    cat = Category(user_id=user.user_id, name="Work")
    db_session.add(cat)
    db_session.commit()

    # Calendar day with focus slots
    day = UserCalendarDay(
        user_id=user.user_id,
        date="2025-01-02",
        work_environment=WorkEnvironmentEnum.HOME,
        focus_slots=[{"start_time": "09:00", "end_time": "11:00", "focus_level": "high"}],
        availability_slots=[{"start_time": "09:00", "end_time": "17:00", "status": "available"}],
    )
    db_session.add(day)

    # Task scheduled inside focus time
    task = Task(
        user_id=user.user_id,
        title="Deep Work",
        estimated_duration_minutes=60,
        category_id=cat.category_id,
        scheduled_slots=[
            {
                "start_time": "2025-01-02T09:30:00Z",
                "end_time": "2025-01-02T10:30:00Z",
            }
        ],
    )
    db_session.add(task)
    db_session.commit()

    engine = AnalyticsEngine(db_session)
    # Compute metrics for the day
    engine._backfill_metrics(str(user.user_id), datetime(2025, 1, 2).date(), datetime(2025, 1, 2).date())
    rows = engine._get_or_compute_daily_metrics(str(user.user_id), datetime(2025, 1, 2).date(), datetime(2025, 1, 2).date())
    assert len(rows) == 1
    m = rows[0]
    assert m.total_scheduled_minutes >= 60
    assert m.focus_minutes > 0
    assert str(cat.category_id) in (m.category_minutes or {})


