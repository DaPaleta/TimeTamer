# Phase 3 Development Plan: Analytics & Goals

**Version:** 1.0  
**Date:** August 11, 2025  
**Status:** Ready for Implementation  
**Phase:** 3 of 4  
**Duration:** 4 weeks (Weeks 9-12)

## Executive Summary

Phase 3 adds data-driven analytics and goal tracking on top of the intelligent scheduling from Phase 2. Users will create measurable goals (minutes, percentage of scheduled time, task counts) across daily/weekly/monthly periods and track progress in real time. The system delivers actionable insights with quick stats in primary views and a dashboard for trends and category distributions. This plan aligns with current architecture (FastAPI, SQLAlchemy, PostgreSQL, React, JWT) and reuses scheduling concepts and calendar context.

## Objectives

- Allow users to create, edit, and delete goals with clear targets and periods.
- Provide accurate goal progress and quick stats for the selected date range.
- Deliver a dashboard with category distributions, trend charts, completion rates, and focus time utilization.
- CSV export of analytics for a specified date range.

## Success Criteria

- Users can set and track goals by day/week/month with correct progress math.
- Quick stats P95 latency: warm cache < 150 ms, cold < 400 ms for 7–30 days.
- Dashboard visuals reflect backend aggregates; filters work consistently.
- Export endpoint streams CSV for 90-day ranges in < 3 seconds.
- Accurate focus time utilization across time zones, including DST boundaries.

---

## Backend Plan

### Data Model Additions (Alembic migrations)

Create tables optimized for analytics queries and periodic rollups.

- goals (already specified in architecture)
- goal_progress_snapshots
  ```sql
  CREATE TABLE goal_progress_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES goals(goal_id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    achieved_value INTEGER NOT NULL DEFAULT 0,
    target_value INTEGER NOT NULL,
    percent_complete NUMERIC(5,2) NOT NULL,
    taken_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (goal_id, period_start, period_end)
  );
  CREATE INDEX idx_goal_progress_user_period ON goal_progress_snapshots(user_id, period_start, period_end);
  ```
- analytics_daily_metrics
  ```sql
  CREATE TABLE analytics_daily_metrics (
    metrics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_scheduled_minutes INTEGER NOT NULL DEFAULT 0,
    completed_tasks_count INTEGER NOT NULL DEFAULT 0,
    focus_minutes INTEGER NOT NULL DEFAULT 0,
    category_minutes JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, date)
  );
  CREATE INDEX idx_analytics_daily_user_date ON analytics_daily_metrics(user_id, date);
  ```

Notes:

- Compute analytics from `tasks.scheduled_slots`, `tasks.completed_at`, and `user_calendar_days.focus_slots`.
- Focus utilization is overlap of scheduled slots and focus slots for each day.

### Services

Create `backend/app/services/analytics_engine.py` with methods:

```python
class AnalyticsEngine:
    def calculate_quick_stats(self, user_id: str, date_range: tuple) -> QuickStats: ...
    def generate_dashboard_data(self, user_id: str, period: str) -> DashboardData: ...
    def track_goal_progress(self, user_id: str) -> GoalProgressReport: ...
    def compute_productivity_insights(self, user_id: str) -> ProductivityInsights: ...  # stretch
```

Implementation details:

- QuickStats: aggregate from `analytics_daily_metrics` for requested range; on cache miss, compute on-the-fly and backfill.
- DashboardData: aggregates for category minutes, completion rates, trend lines from `analytics_daily_metrics`.
- Goal progress: for each active goal, compute achieved vs target for the current period window; write to `goal_progress_snapshots`.
- Respect `users.timezone` when slicing days and periods.

### Schemas

Create `backend/app/schemas/analytics.py`:

- `QuickStats`, `DashboardData`, `GoalCreate`, `GoalUpdate`, `Goal`, `GoalProgress`, `ExportRequest`
- Enums mirror DB constraints for `target_type` and `time_period`.

### APIs

Add `backend/app/api/v1/goals.py` and `backend/app/api/v1/analytics.py`, then include in `backend/app/api/v1/router.py`.

- Goals
  - `GET /api/v1/goals`
  - `POST /api/v1/goals`
  - `PUT /api/v1/goals/{goal_id}`
  - `DELETE /api/v1/goals/{goal_id}`
  - `GET /api/v1/goals/progress?period=weekly&start_date=YYYY-MM-DD`

- Analytics
  - `GET /api/v1/analytics/quick-stats?view_context=calendar&date_range=7d`
  - `GET /api/v1/analytics/dashboard?period=monthly&category_id=uuid`
  - `GET /api/v1/analytics/export?format=csv&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`

Example responses:

```json
{
  "total_scheduled_minutes": 1260,
  "completed_tasks_count": 18,
  "focus_time_utilization": 0.72,
  "top_category": { "category_id": "uuid", "name": "Work", "minutes": 840 },
  "streak_days_completed": 5
}
```

```json
[
  {
    "goal_id": "uuid",
    "name": "Deep Work",
    "target_type": "minutes",
    "target_value": 600,
    "period": { "start": "2025-05-26", "end": "2025-06-01" },
    "achieved_value": 480,
    "percent_complete": 80.0,
    "status": "on_track"
  }
]
```

### Background Jobs and Caching

- Celery + Redis:
  - Nightly: compute `analytics_daily_metrics` for the previous day per user.
  - Hourly: refresh quick stats caches for active users.
  - Event-driven: on `task.scheduled`, `task.updated`, `calendar.updated`, enqueue recomputation for the affected day.
- Caching keys (TTL):
  - `analytics:quick:{user_id}:{start}:{end}` (10 min)
  - `analytics:dashboard:{user_id}:{period}:{category_id?}` (30 min)
  - Invalidate on writes affecting date ranges.

### Implementation Notes

- Minutes calculation:
  - Scheduled minutes = sum of durations in `tasks.scheduled_slots` overlapping the day window.
  - Completed tasks count = tasks with `completed_at` in day window.
  - Focus minutes = overlap of scheduled_slots with `focus_slots`.
  - Category minutes = attribute scheduled minutes to `tasks.category_id`.
- Indexes:
  - Ensure `tasks(user_id, status)`, `tasks(user_id, completed_at)`, `tasks(user_id, category_id)`.
  - `user_calendar_days(user_id, date)`.
- Security:
  - User scoping in all queries; validate `target_value > 0`; `time_period ∈ {daily, weekly, monthly}`.

### Testing (Backend)

- Unit tests:
  - Overlap utilities, category aggregation, goal progress per `target_type`.
  - DST boundaries, missing focus slots, empty schedules.
- Integration tests:
  - Endpoints return correct shapes/values; OpenAPI docs accurate.
  - Export streams CSV with correct headers and row counts.
- Performance tests:
  - Warm cache < 50 ms; cold path < 400 ms P95 (30-day range).

### Definition of Done (Backend)

- Migrations applied; new tables exist.
- New endpoints documented and pass integration tests.
- Nightly Celery job runs locally/staging and writes daily metrics.
- Cache keys populated and invalidated correctly.
- ≥80% unit test coverage for analytics service; no linter errors.

---

## Frontend Plan

### Libraries

- React 18, TypeScript
- Data fetching: TanStack Query
- Charts: Chart.js via `react-chartjs-2`
- Date utilities: `date-fns`

### State

Extend global `analytics` slice:

```ts
{
  analytics: {
    quickStats: { data, status, lastUpdated },
    dashboardData: { data, status, filters },
    goalProgress: { data, status }
  }
}
```

### API Clients

Create:

- `frontend/src/api/goals.ts`: `getGoals`, `createGoal`, `updateGoal`, `deleteGoal`, `getGoalProgress`
- `frontend/src/api/analytics.ts`: `getQuickStats`, `getDashboard`, `exportAnalytics`

### UI/Pages

- Goals
  - `GoalCreation.tsx`: validated form
  - `GoalList.tsx`: list with edit/delete and status badges
  - `GoalProgress.tsx`: progress bars for current period
  - Page: `frontend/src/pages/goals/GoalsPage.tsx`
- Quick Stats Widget
  - `components/analytics/QuickStatsWidget.tsx`: embed in calendar and task pages; shows total minutes, completed count, top category, focus utilization
- Dashboard
  - `pages/analytics/DashboardPage.tsx` composed of:
    - Category distribution (doughnut)
    - Trend charts (line: scheduled minutes, focus minutes, completed count)
    - Goal progress cards
    - Filters: period (weekly/monthly), category
- Export
  - CSV export button on dashboard; toast and download handling

### UX/Validation

- Goal form inline validation and short helptext for target types.
- Accessible charts (titles/aria), empty states, skeleton loaders, and error toasts.

### Testing (Frontend)

- Component tests: `GoalCreation`, `QuickStatsWidget`, `ProductivityDashboard` with mocked data.
- API client tests with MSW.
- E2E (Playwright/Cypress): create goal → view progress → quick stats on calendar → dashboard → export CSV.

### Definition of Done (Frontend)

- Goals CRUD works E2E with validation and toasts.
- Quick stats widget visible on calendar and task pages; updates on date changes.
- Dashboard charts correct; filters update consistently; CSV export works.
- No ESLint/TypeScript errors; unit tests passing.

---

## Week-by-Week Timeline

### Week 9: Backend foundations

- Alembic migrations for `goal_progress_snapshots`, `analytics_daily_metrics`.
- `analytics_engine.py` core overlap and aggregation logic.
- `schemas/analytics.py` models and enums.
- Celery tasks: nightly daily-metrics job; stub quick-stats refresher.
- Tests: unit tests for overlap and aggregations.
- DoD: migrations applied; engine returns correct values in unit tests; nightly job runs manually and writes rows.

### Week 10: APIs and caching

- Implement `/goals` and `/analytics` endpoints.
- Redis caching for quick stats and dashboard.
- Cache invalidation on `task.scheduled`, `task.updated`, `calendar.updated`.
- Export CSV endpoint.
- Integration tests and OpenAPI docs.
- DoD: endpoints live with docs; caches verified; export works.

### Week 11: Frontend goals and quick stats

- API clients (`goals.ts`, `analytics.ts`).
- Goals pages and components.
- QuickStatsWidget integrated into calendar and task views.
- Component tests.
- DoD: create a goal and see progress; quick stats render and update with date changes.

### Week 12: Dashboard, polish, and UAT

- Dashboard page with charts and filters; CSV export UI.
- Accessibility pass, empty states, skeletons, error handling.
- E2E tests; performance checks; bug fixes.
- DoD: charts correct; export works from UI; E2E green; P95 performance targets met.

---

## Acceptance Checklists

- Goals
  - Create/update/delete with validation
  - Correct progress for all `target_type`s across periods
- Quick Stats
  - Displays total minutes, completed count, top category, focus utilization
  - Updates on date navigation; warm responses < 150 ms after cache warm-up
- Dashboard
  - Category doughnut sums equal category minutes
  - Trend lines match `analytics_daily_metrics`
  - Filters update charts and quick stats consistently
- Export
  - CSV columns: date, total_scheduled_minutes, focus_minutes, completed_tasks_count, category_minutes JSON
  - 90-day export completes < 3 seconds

---

## Risks & Mitigations

- Complex overlap math on JSONB `scheduled_slots`: extract robust overlap utilities with unit tests.
- Time zones/DST: normalize to user timezone for day slicing; add DST-focused tests.
- Data growth: nightly compaction in `analytics_daily_metrics`; later consider partitioning or monthly aggregations.
- Cache staleness: short TTLs plus event-based invalidation on writes.

## DevOps

- Add Celery worker and beat schedules to deployment (Procfile/manifests).
- Redis sizing and `volatile-lru` eviction for analytics keys.
- APM dashboards for endpoint latency; alerts on nightly job failures.

## File Structure (new/modified)

- Backend
  - `backend/app/services/analytics_engine.py`
  - `backend/app/schemas/analytics.py`
  - `backend/app/api/v1/analytics.py`
  - `backend/app/api/v1/goals.py`
  - `backend/app/api/v1/router.py` (include new routers)
  - `backend/app/celery/tasks/analytics.py`
  - `backend/alembic/versions/*_phase3_analytics.py`
  - Tests: `backend/tests/test_analytics_engine.py`, `backend/tests/test_analytics_api.py`, `backend/tests/test_goals_api.py`
- Frontend
  - `frontend/src/api/analytics.ts`, `frontend/src/api/goals.ts`
  - `frontend/src/components/analytics/QuickStatsWidget.tsx`
  - `frontend/src/pages/analytics/DashboardPage.tsx`
  - `frontend/src/pages/goals/GoalsPage.tsx`
  - Tests under `frontend/src/components/**/__tests__`

## Global Definitions of Done

- Code compiles without linter/type errors.
- Unit, integration, and E2E tests pass; coverage meets project thresholds.
- OpenAPI documentation updated and accurate.
- Performance targets met (as specified above).
- Feature flags off-by-default until UAT signoff; then enabled for production.
