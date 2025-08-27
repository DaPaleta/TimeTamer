from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.db.session import get_db  # assuming existing dependency
from app.db.models import User
from app.schemas.analytics import QuickStats, DashboardData
from app.services.analytics_engine import AnalyticsEngine
from app.api.v1.auth import get_current_user  # assuming existing auth dep
from app.core.cache import cache_get_text, cache_set_text
import json


router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/quick-stats", response_model=QuickStats)
def quick_stats(
    view_context: Optional[str] = Query(default="calendar"),
    date_range: str = Query(default="7d"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()
    if date_range.endswith("d"):
        days = int(date_range[:-1])
        start = now - timedelta(days=days - 1)
    else:
        start = now - timedelta(days=6)
    cache_key = f"analytics:quick:{current_user.user_id}:{start.date()}:{now.date()}"
    cached = cache_get_text(cache_key)
    if cached:
        return QuickStats.model_validate_json(cached)
    engine = AnalyticsEngine(db)
    result = engine.calculate_quick_stats(str(current_user.user_id), (start, now))
    cache_set_text(cache_key, result.model_dump_json(), ttl_seconds=600)
    return result


@router.get("/dashboard", response_model=DashboardData)
def dashboard(
    period: str = Query(default="monthly"),
    category_id: Optional[str] = Query(default=None),  # reserved for filtering
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cache_key = f"analytics:dashboard:{current_user.user_id}:{period}:{category_id or 'all'}"
    cached = cache_get_text(cache_key)
    if cached:
        return DashboardData.model_validate_json(cached)
    engine = AnalyticsEngine(db)
    result = engine.generate_dashboard_data(str(current_user.user_id), period)
    cache_set_text(cache_key, result.model_dump_json(), ttl_seconds=1800)
    return result


@router.get("/export")
def export_csv(
    start_date: str = Query(..., description="YYYY-MM-DD"),
    end_date: str = Query(..., description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Build CSV from analytics_daily_metrics
    from io import StringIO
    import csv
    from app.db.models import AnalyticsDailyMetric

    rows = (
        db.query(AnalyticsDailyMetric)
        .filter(AnalyticsDailyMetric.user_id == str(current_user.user_id))
        .filter(AnalyticsDailyMetric.date >= start_date)
        .filter(AnalyticsDailyMetric.date <= end_date)
        .order_by(AnalyticsDailyMetric.date.asc())
        .all()
    )

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "date",
        "total_scheduled_minutes",
        "focus_minutes",
        "completed_tasks_count",
        "category_minutes_json",
    ])
    for r in rows:
        writer.writerow([
            r.date,
            r.total_scheduled_minutes,
            r.focus_minutes,
            r.completed_tasks_count,
            (r.category_minutes or {}),
        ])
    csv_data = output.getvalue()
    return Response(content=csv_data, media_type="text/csv")


