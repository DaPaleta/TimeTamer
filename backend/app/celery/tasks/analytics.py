from datetime import datetime, timedelta

from app.celery import celery_app
from app.db.session import SessionLocal
from app.services.analytics_engine import AnalyticsEngine


@celery_app.task(name="analytics.test_task")
def test_task(message: str):
    """Test task for verifying Celery setup."""
    return f"Celery is working! Message: {message}"


@celery_app.task(name="analytics.compute_daily_metrics")
def compute_daily_metrics(user_id: str, date_str: str | None = None):
    """Compute analytics_daily_metrics for a single user and date."""
    db = SessionLocal()
    try:
        engine = AnalyticsEngine(db)
        date = datetime.strptime(date_str, "%Y-%m-%d") if date_str else datetime.utcnow()
        engine._backfill_metrics(user_id, date.date(), date.date())
    finally:
        db.close()


@celery_app.task(name="analytics.nightly_backfill_all_users")
def nightly_backfill_all_users():
    """Backfill yesterday's metrics for all users."""
    db = SessionLocal()
    try:
        from app.db.models import User
        users = db.query(User).all()
        yesterday = (datetime.utcnow() - timedelta(days=1)).date()
        for u in users:
            engine = AnalyticsEngine(db)
            engine._backfill_metrics(str(u.user_id), yesterday, yesterday)
    finally:
        db.close()


