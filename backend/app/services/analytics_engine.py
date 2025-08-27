from __future__ import annotations

from typing import Dict, List, Tuple
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.db.models import (
    Task,
    User,
    UserCalendarDay,
    Category,
    AnalyticsDailyMetric,
    Goal,
)
from app.schemas.analytics import QuickStats, DashboardData, TrendPoint, GoalProgress, Period


class AnalyticsEngine:
    def __init__(self, db: Session):
        self.db = db

    # Public API
    def calculate_quick_stats(self, user_id: str, date_range: Tuple[datetime, datetime]) -> QuickStats:
        start_date, end_date = self._normalize_range(user_id, date_range)
        metrics = self._get_or_compute_daily_metrics(user_id, start_date, end_date)

        total_minutes = sum(m.total_scheduled_minutes for m in metrics)
        completed = sum(m.completed_tasks_count for m in metrics)
        focus_minutes = sum(m.focus_minutes for m in metrics)
        total_focus_available = self._estimate_available_focus_minutes(user_id, start_date, end_date)
        focus_util = float(focus_minutes / max(total_focus_available, 1)) if total_focus_available else 0.0

        # Top category by summed minutes
        category_totals: Dict[str, int] = {}
        for m in metrics:
            for cat_id, minutes in (m.category_minutes or {}).items():
                category_totals[cat_id] = category_totals.get(cat_id, 0) + int(minutes)
        top_category = None
        if category_totals:
            top_id = max(category_totals, key=category_totals.get)
            top_minutes = category_totals[top_id]
            top_category = {"category_id": top_id, "name": self._get_category_name(top_id), "minutes": top_minutes}

        streak = self._compute_completion_streak(metrics)

        return QuickStats(
            total_scheduled_minutes=total_minutes,
            completed_tasks_count=completed,
            focus_time_utilization=round(min(focus_util, 1.0), 2),
            top_category=top_category,
            streak_days_completed=streak,
        )

    def generate_dashboard_data(self, user_id: str, period: str) -> DashboardData:
        end = datetime.utcnow().date()
        if period == "weekly":
            start = end - timedelta(days=6)
        elif period == "monthly":
            start = end - timedelta(days=29)
        else:
            start = end - timedelta(days=6)

        metrics = self._get_or_compute_daily_metrics(user_id, start, end)
        category_totals: Dict[str, int] = {}
        trend: List[TrendPoint] = []
        total_minutes = 0
        focus_minutes = 0
        completed = 0

        for m in metrics:
            total_minutes += m.total_scheduled_minutes
            focus_minutes += m.focus_minutes
            completed += m.completed_tasks_count
            trend.append(
                TrendPoint(
                    date=m.date,
                    total_scheduled_minutes=m.total_scheduled_minutes,
                    focus_minutes=m.focus_minutes,
                    completed_tasks_count=m.completed_tasks_count,
                )
            )

            for cat_id, minutes in (m.category_minutes or {}).items():
                category_totals[cat_id] = category_totals.get(cat_id, 0) + int(minutes)

        days = max(len(metrics), 1)
        completion_rate = float(completed / max(days, 1)) / 10.0 if days else 0.0  # placeholder normalization
        focus_utilization = float(focus_minutes / max(total_minutes, 1)) if total_minutes else 0.0

        return DashboardData(
            category_minutes=category_totals,
            trend=trend,
            completion_rate=round(min(completion_rate, 1.0), 2),
            focus_utilization=round(min(focus_utilization, 1.0), 2),
        )

    def track_goal_progress(self, user_id: str) -> List[GoalProgress]:
        today = datetime.utcnow().date()
        goals: List[Goal] = (
            self.db.query(Goal).filter(Goal.user_id == user_id, Goal.is_active == True).all()
        )
        reports: List[GoalProgress] = []
        for g in goals:
            start, end = self._period_bounds(g.time_period, today)
            achieved = self._compute_goal_achievement(user_id, g, start, end)
            percent = float(achieved / max(g.target_value, 1))
            status = "on_track" if percent >= 0.8 else "behind"
            reports.append(
                GoalProgress(
                    goal_id=str(g.goal_id),
                    name=g.name,
                    target_type=g.target_type,
                    target_value=g.target_value,
                    period=Period(start=start.strftime("%Y-%m-%d"), end=end.strftime("%Y-%m-%d")),
                    achieved_value=int(achieved),
                    percent_complete=round(percent * 100.0, 2),
                    status=status,
                )
            )
        return reports

    # Internal helpers
    def _get_or_compute_daily_metrics(self, user_id: str, start, end) -> List[AnalyticsDailyMetric]:
        start_s = start.strftime("%Y-%m-%d") if hasattr(start, 'strftime') else str(start)
        end_s = end.strftime("%Y-%m-%d") if hasattr(end, 'strftime') else str(end)
        rows = (
            self.db.query(AnalyticsDailyMetric)
            .filter(AnalyticsDailyMetric.user_id == user_id)
            .filter(AnalyticsDailyMetric.date >= start_s)
            .filter(AnalyticsDailyMetric.date <= end_s)
            .order_by(AnalyticsDailyMetric.date.asc())
            .all()
        )
        # Backfill missing days on the fly
        if not rows or len(rows) < (end - start).days + 1:
            self._backfill_metrics(user_id, start, end)
            rows = (
                self.db.query(AnalyticsDailyMetric)
                .filter(AnalyticsDailyMetric.user_id == user_id)
                .filter(AnalyticsDailyMetric.date >= start_s)
                .filter(AnalyticsDailyMetric.date <= end_s)
                .order_by(AnalyticsDailyMetric.date.asc())
                .all()
            )
        return rows

    def _backfill_metrics(self, user_id: str, start, end) -> None:
        cur = start
        while cur <= end:
            date_str = cur.strftime("%Y-%m-%d")
            existing = (
                self.db.query(AnalyticsDailyMetric)
                .filter(AnalyticsDailyMetric.user_id == user_id, AnalyticsDailyMetric.date == date_str)
                .first()
            )
            if existing:
                cur += timedelta(days=1)
                continue
            totals = self._compute_daily_metrics(user_id, cur)
            m = AnalyticsDailyMetric(
                user_id=user_id,
                date=date_str,
                total_scheduled_minutes=totals["total_minutes"],
                completed_tasks_count=totals["completed_count"],
                focus_minutes=totals["focus_minutes"],
                category_minutes=totals["category_minutes"],
            )
            self.db.add(m)
            cur += timedelta(days=1)
        self.db.commit()

    def _compute_daily_metrics(self, user_id: str, date) -> Dict[str, int]:
        date_str = date.strftime("%Y-%m-%d")
        tasks: List[Task] = self.db.query(Task).filter(Task.user_id == user_id).all()
        calendar_day: UserCalendarDay | None = (
            self.db.query(UserCalendarDay)
            .filter(UserCalendarDay.user_id == user_id, UserCalendarDay.date == date_str)
            .first()
        )
        total_minutes = 0
        completed_count = 0
        focus_minutes = 0
        category_minutes: Dict[str, int] = {}

        # Sum scheduled minutes and category minutes
        for t in tasks:
            # Completed today?
            if t.completed_at and t.completed_at.strftime("%Y-%m-%d") == date_str:
                completed_count += 1
            # Scheduled overlap on this day
            for slot in (t.scheduled_slots or []):
                start = slot.get("start_time")
                end = slot.get("end_time")
                if not start or not end:
                    continue
                try:
                    s_dt = datetime.fromisoformat(start.replace("Z", "+00:00"))
                    e_dt = datetime.fromisoformat(end.replace("Z", "+00:00"))
                except Exception:
                    continue
                if s_dt.date().strftime("%Y-%m-%d") != date_str and e_dt.date().strftime("%Y-%m-%d") != date_str:
                    # basic same-day heuristic; multi-day spans not handled yet
                    continue
                minutes = int((e_dt - s_dt).total_seconds() // 60)
                if minutes <= 0:
                    continue
                total_minutes += minutes
                if t.category_id:
                    key = str(t.category_id)
                    category_minutes[key] = category_minutes.get(key, 0) + minutes
                # Focus overlap
                if calendar_day and calendar_day.focus_slots:
                    focus_minutes += self._overlap_with_focus_minutes(s_dt, e_dt, calendar_day)

        return {
            "total_minutes": total_minutes,
            "completed_count": completed_count,
            "focus_minutes": focus_minutes,
            "category_minutes": category_minutes,
        }

    def _overlap_with_focus_minutes(self, s_dt: datetime, e_dt: datetime, day: UserCalendarDay) -> int:
        total = 0
        s_day = s_dt.strftime("%H:%M")
        e_day = e_dt.strftime("%H:%M")
        for slot in (day.focus_slots or []):
            slot_start = slot.get("start_time")
            slot_end = slot.get("end_time")
            if not slot_start or not slot_end:
                continue
            # compute overlap in minutes using HH:MM string boundaries on same day
            overlap_minutes = self._overlap_minutes(s_day, e_day, slot_start, slot_end)
            total += overlap_minutes
        return total

    @staticmethod
    def _overlap_minutes(a_start: str, a_end: str, b_start: str, b_end: str) -> int:
        a_s = int(a_start[:2]) * 60 + int(a_start[3:])
        a_e = int(a_end[:2]) * 60 + int(a_end[3:])
        b_s = int(b_start[:2]) * 60 + int(b_start[3:])
        b_e = int(b_end[:2]) * 60 + int(b_end[3:])
        start = max(a_s, b_s)
        end = min(a_e, b_e)
        return max(0, end - start)

    def _estimate_available_focus_minutes(self, user_id: str, start, end) -> int:
        total = 0
        cur = start
        while cur <= end:
            date_str = cur.strftime("%Y-%m-%d")
            day = (
                self.db.query(UserCalendarDay)
                .filter(UserCalendarDay.user_id == user_id, UserCalendarDay.date == date_str)
                .first()
            )
            if day and day.focus_slots:
                for slot in day.focus_slots:
                    s = slot.get("start_time")
                    e = slot.get("end_time")
                    if s and e:
                        total += self._overlap_minutes(s, e, s, e)
            cur += timedelta(days=1)
        return total

    def _get_category_name(self, category_id: str) -> str:
        cat = self.db.query(Category).filter(Category.category_id == category_id).first()
        return cat.name if cat else "Unknown"

    @staticmethod
    def _normalize_range(user_id: str, date_range: Tuple[datetime, datetime]):
        # For now, assume UTC; future: adjust by user.timezone
        return date_range

    @staticmethod
    def _period_bounds(period: str, today) -> Tuple[datetime, datetime]:
        if period == "daily":
            return today, today
        if period == "weekly":
            start = today - timedelta(days=today.weekday())
            end = start + timedelta(days=6)
            return start, end
        # monthly (simple 30-day window for MVP)
        start = today.replace(day=1)
        # naive month end
        end = (start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        return start, end

    def _compute_completion_streak(self, metrics: List[AnalyticsDailyMetric]) -> int:
        """Compute the current completion streak based on daily metrics."""
        if not metrics:
            return 0
        
        # Sort metrics by date in descending order
        sorted_metrics = sorted(metrics, key=lambda m: m.date, reverse=True)
        
        streak = 0
        current_date = datetime.utcnow().date()
        
        for metric in sorted_metrics:
            # Check if this day had any completed tasks
            if metric.completed_tasks_count > 0:
                streak += 1
            else:
                # Break streak if no tasks completed
                break
        
        return streak

    def _compute_goal_achievement(self, user_id: str, goal: Goal, start: datetime, end: datetime) -> int:
        """Compute how much of a goal has been achieved in the given period."""
        if goal.target_type == "minutes":
            # Sum focus minutes for the period
            metrics = self._get_or_compute_daily_metrics(user_id, start, end)
            return sum(m.focus_minutes for m in metrics)
        elif goal.target_type == "percentage_of_scheduled_time":
            # Calculate percentage of scheduled time spent in focus
            metrics = self._get_or_compute_daily_metrics(user_id, start, end)
            total_scheduled = sum(m.total_scheduled_minutes for m in metrics)
            total_focus = sum(m.focus_minutes for m in metrics)
            if total_scheduled > 0:
                return int((total_focus / total_scheduled) * 100)
            return 0
        elif goal.target_type == "task_completion_count":
            # Count completed tasks in the period
            metrics = self._get_or_compute_daily_metrics(user_id, start, end)
            return sum(m.completed_tasks_count for m in metrics)
        else:
            return 0


