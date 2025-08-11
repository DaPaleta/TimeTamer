from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid
from sqlalchemy import and_
from zoneinfo import ZoneInfo

from ...core.auth import get_current_user
from ...db.session import get_db
from ...db.models import User, SchedulingRule, Category, WorkEnvironmentEnum
from ...schemas.scheduling import (
    ValidationResult, SuggestionSlot, SchedulingRuleCreate, 
    SchedulingRuleResponse, ValidationRequest, SuggestionRequest, AutoScheduleRequest
)
from ...services.scheduling_engine import SchedulingEngine
from ...services.day_context import DayContextService

router = APIRouter()


@router.post("/validate", response_model=ValidationResult)
async def validate_placement(
    request: ValidationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Validate if a task can be scheduled at the proposed time"""
    try:
        engine = SchedulingEngine(db)
        # Normalize proposed times to user's local timezone
        user_tz = ZoneInfo(current_user.timezone or "UTC")
        start_time = request.proposed_start_time
        end_time = request.proposed_end_time
        if start_time.tzinfo is None:
            start_time = start_time.replace(tzinfo=user_tz)
        else:
            start_time = start_time.astimezone(user_tz)
        if end_time.tzinfo is None:
            end_time = end_time.replace(tzinfo=user_tz)
        else:
            end_time = end_time.astimezone(user_tz)
        result = engine.validate_placement(
            task_id=request.task_id,
            start_time=start_time,
            end_time=end_time,
            user_id=str(current_user.user_id)
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")


@router.get("/rules", response_model=List[SchedulingRuleResponse])
async def get_scheduling_rules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all scheduling rules for the current user"""
    try:
        rules = db.query(SchedulingRule).filter(
            SchedulingRule.user_id == current_user.user_id
        ).order_by(SchedulingRule.priority_order).all()
        
        return [
            SchedulingRuleResponse(
                rule_id=str(rule.rule_id),
                name=rule.name,
                description=rule.description,
                conditions=rule.conditions,
                action=rule.action,
                alert_message=rule.alert_message,
                priority_order=rule.priority_order,
                is_active=rule.is_active,
                created_at=rule.created_at,
                updated_at=rule.updated_at
            )
            for rule in rules
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch rules: {str(e)}")


@router.post("/rules", response_model=SchedulingRuleResponse, status_code=201)
async def create_scheduling_rule(
    rule: SchedulingRuleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new scheduling rule"""
    try:
        db_rule = SchedulingRule(
            user_id=current_user.user_id,
            name=rule.name,
            description=rule.description,
            conditions=rule.conditions,
            action=rule.action,
            alert_message=rule.alert_message,
            priority_order=rule.priority_order,
            is_active=rule.is_active
        )
        
        db.add(db_rule)
        db.commit()
        db.refresh(db_rule)
        
        return SchedulingRuleResponse(
            rule_id=str(db_rule.rule_id),
            name=db_rule.name,
            description=db_rule.description,
            conditions=db_rule.conditions,
            action=db_rule.action,
            alert_message=db_rule.alert_message,
            priority_order=db_rule.priority_order,
            is_active=db_rule.is_active,
            created_at=db_rule.created_at,
            updated_at=db_rule.updated_at
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create rule: {str(e)}")


@router.put("/rules/{rule_id}", response_model=SchedulingRuleResponse)
async def update_scheduling_rule(
    rule_id: str,
    rule_update: SchedulingRuleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing scheduling rule"""
    try:
        db_rule = db.query(SchedulingRule).filter(
            and_(
                SchedulingRule.rule_id == uuid.UUID(rule_id),
                SchedulingRule.user_id == current_user.user_id
            )
        ).first()
        
        if not db_rule:
            raise HTTPException(status_code=404, detail="Rule not found")
        
        # Update fields
        db_rule.name = rule_update.name
        db_rule.description = rule_update.description
        db_rule.conditions = rule_update.conditions
        db_rule.action = rule_update.action
        db_rule.alert_message = rule_update.alert_message
        db_rule.priority_order = rule_update.priority_order
        db_rule.is_active = rule_update.is_active
        
        db.commit()
        db.refresh(db_rule)
        
        return SchedulingRuleResponse(
            rule_id=str(db_rule.rule_id),
            name=db_rule.name,
            description=db_rule.description,
            conditions=db_rule.conditions,
            action=db_rule.action,
            alert_message=db_rule.alert_message,
            priority_order=db_rule.priority_order,
            is_active=db_rule.is_active,
            created_at=db_rule.created_at,
            updated_at=db_rule.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update rule: {str(e)}")


@router.delete("/rules/{rule_id}", status_code=204)
async def delete_scheduling_rule(
    rule_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a scheduling rule"""
    try:
        db_rule = db.query(SchedulingRule).filter(
            and_(
                SchedulingRule.rule_id == uuid.UUID(rule_id),
                SchedulingRule.user_id == current_user.user_id
            )
        ).first()
        
        if not db_rule:
            raise HTTPException(status_code=404, detail="Rule not found")
        
        db.delete(db_rule)
        db.commit()
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete rule: {str(e)}") 


@router.post("/suggest", response_model=List[SuggestionSlot])
async def suggest_slots(
    request: SuggestionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Find optimal scheduling slots for a task"""
    try:
        engine = SchedulingEngine(db)
        start_date = datetime.strptime(request.start_date, "%Y-%m-%d")
        end_date = datetime.strptime(request.end_date, "%Y-%m-%d")
        
        suggestions = engine.suggest_slots(
            task_id=request.task_id,
            date_range=(start_date, end_date),
            user_id=str(current_user.user_id)
        )
        return suggestions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Suggestion generation failed: {str(e)}")


@router.post("/auto-schedule")
async def auto_schedule_tasks(
    request: AutoScheduleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Automatically schedule multiple tasks optimally"""
    try:
        engine = SchedulingEngine(db)
        start_date = datetime.strptime(request.start_date, "%Y-%m-%d")
        end_date = datetime.strptime(request.end_date, "%Y-%m-%d")
        
        result = engine.auto_schedule_tasks(
            task_ids=request.task_ids,
            date_range=(start_date, end_date),
            user_id=str(current_user.user_id)
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auto-scheduling failed: {str(e)}")


@router.get("/rule-builder-config")
async def get_rule_builder_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get configuration data for the rule builder UI"""
    try:
        # Get user's categories
        categories = db.query(Category).filter(
            Category.user_id == current_user.user_id
        ).all()
        
        # Get work environments from enum
        work_environments = [
            {"value": env.value, "label": env.value.replace("_", " ").title()}
            for env in WorkEnvironmentEnum
        ]
        
        # Get focus levels (for time slot and default contexts)
        focus_levels = [
            {"value": "high", "label": "High"},
            {"value": "medium", "label": "Medium"},
            {"value": "low", "label": "Low"}
        ]
        
        # For time slot 'is_focus_time', only expose top two focus levels
        time_slot_focus_levels = [
            {"value": "high", "label": "High"},
            {"value": "low", "label": "Low"}
        ]
        
        # Get task priorities
        task_priorities = [
            {"value": "low", "label": "Low"},
            {"value": "medium", "label": "Medium"},
            {"value": "high", "label": "High"},
            {"value": "urgent", "label": "Urgent"}
        ]
        
        # Get boolean options
        boolean_options = [
            {"value": True, "label": "Yes"},
            {"value": False, "label": "No"}
        ]
        
        return {
            "categories": [
                {"value": str(cat.category_id), "label": cat.name}
                for cat in categories
            ],
            "work_environments": work_environments,
            "focus_levels": focus_levels,
            "time_slot_focus_levels": time_slot_focus_levels,
            "task_priorities": task_priorities,
            "boolean_options": boolean_options,
            "task_properties": [
                {"value": "priority", "label": "Priority"},
                {"value": "requires_focus", "label": "Requires Focus"},
                {"value": "estimated_duration_minutes", "label": "Duration (minutes)"},
                {"value": "category_id", "label": "Category"}
            ],
            "calendar_day_properties": [
                {"value": "work_environment", "label": "Work Environment"},
                {"value": "has_focus_slots", "label": "Has Focus Slots"}
            ],
            "time_slot_properties": [
                {"value": "is_focus_time", "label": "Is Focus Time"},
                {"value": "is_available", "label": "Is Available"},
                {"value": "hour_of_day", "label": "Hour of Day"}
            ],
            "operators": {
                "priority": [
                    {"value": "equals", "label": "equals"},
                    {"value": "not_equals", "label": "not equals"}
                ],
                "requires_focus": [
                    {"value": "equals", "label": "equals"},
                    {"value": "not_equals", "label": "not equals"}
                ],
                "estimated_duration_minutes": [
                    {"value": "equals", "label": "equals"},
                    {"value": "greater_than", "label": "greater than"},
                    {"value": "less_than", "label": "less than"}
                ],
                "category_id": [
                    {"value": "equals", "label": "equals"},
                    {"value": "not_equals", "label": "not equals"}
                ],
                "work_environment": [
                    {"value": "equals", "label": "equals"},
                    {"value": "not_equals", "label": "not equals"},
                    {"value": "in", "label": "in"},
                    {"value": "not_in", "label": "not in"}
                ],
                "has_focus_slots": [
                    {"value": "equals", "label": "equals"},
                    {"value": "not_equals", "label": "not equals"}
                ],
                "is_focus_time": [
                    {"value": "equals", "label": "equals"},
                    {"value": "not_equals", "label": "not equals"},
                    {"value": "in", "label": "in"},
                    {"value": "not_in", "label": "not in"}
                ],
                "is_available": [
                    {"value": "equals", "label": "equals"},
                    {"value": "not_equals", "label": "not equals"}
                ],
                "hour_of_day": [
                    {"value": "equals", "label": "equals"},
                    {"value": "greater_than", "label": "greater than"},
                    {"value": "less_than", "label": "less than"}
                ]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get rule builder config: {str(e)}") 