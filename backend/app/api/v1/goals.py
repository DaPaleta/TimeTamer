from typing import List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db  # existing dependency
from app.db.models import Goal, User
from app.schemas.analytics import GoalCreate, GoalUpdate, Goal as GoalSchema, GoalProgress
from app.services.analytics_engine import AnalyticsEngine
from app.api.v1.auth import get_current_user


router = APIRouter(prefix="/goals", tags=["goals"])


@router.get("/", response_model=List[GoalSchema])
def list_goals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goals = db.query(Goal).filter(Goal.user_id == current_user.user_id).all()
    return [
        GoalSchema(
            goal_id=str(g.goal_id),
            user_id=str(g.user_id),
            name=g.name,
            category_id=str(g.category_id) if g.category_id else None,
            target_type=g.target_type,
            target_value=g.target_value,
            time_period=g.time_period,
            start_date=g.start_date,
            end_date=g.end_date,
            is_active=g.is_active,
            created_at=g.created_at.isoformat() if g.created_at else None,
        )
        for g in goals
    ]


@router.post("/", response_model=GoalSchema, status_code=201)
def create_goal(
    body: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = Goal(
        user_id=current_user.user_id,
        name=body.name,
        category_id=body.category_id,
        target_type=body.target_type,
        target_value=body.target_value,
        time_period=body.time_period,
        start_date=body.start_date,
        end_date=body.end_date,
        is_active=body.is_active if body.is_active is not None else True,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return GoalSchema(
        goal_id=str(goal.goal_id),
        user_id=str(goal.user_id),
        name=goal.name,
        category_id=str(goal.category_id) if goal.category_id else None,
        target_type=goal.target_type,
        target_value=goal.target_value,
        time_period=goal.time_period,
        start_date=goal.start_date,
        end_date=goal.end_date,
        is_active=goal.is_active,
        created_at=goal.created_at.isoformat() if goal.created_at else None,
    )


@router.put("/{goal_id}", response_model=GoalSchema)
def update_goal(
    goal_id: str,
    body: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal: Goal | None = db.query(Goal).filter(Goal.goal_id == goal_id, Goal.user_id == current_user.user_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(goal, field, value)
    db.commit()
    db.refresh(goal)
    return GoalSchema(
        goal_id=str(goal.goal_id),
        user_id=str(goal.user_id),
        name=goal.name,
        category_id=str(goal.category_id) if goal.category_id else None,
        target_type=goal.target_type,
        target_value=goal.target_value,
        time_period=goal.time_period,
        start_date=goal.start_date,
        end_date=goal.end_date,
        is_active=goal.is_active,
        created_at=goal.created_at.isoformat() if goal.created_at else None,
    )


@router.delete("/{goal_id}", status_code=204)
def delete_goal(goal_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal: Goal | None = db.query(Goal).filter(Goal.goal_id == goal_id, Goal.user_id == current_user.user_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return None


@router.get("/progress", response_model=List[GoalProgress])
def goals_progress(
    period: str = Query(default="weekly"),
    start_date: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    engine = AnalyticsEngine(db)
    # Initial implementation returns current period progress for all active goals
    return engine.track_goal_progress(str(current_user.user_id))


