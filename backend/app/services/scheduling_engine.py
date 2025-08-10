from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import uuid

from ..db.models import Task, UserCalendarDay, SchedulingRule, User
from ..schemas.scheduling import ValidationResult, SuggestionSlot, RuleEvaluationResult, ValidationResultEnum, ActionEnum
from ..services.day_context import DayContextService


class SchedulingEngine:
    def __init__(self, db: Session):
        self.db = db
    
    def validate_placement(
        self, 
        task_id: str, 
        start_time: datetime, 
        end_time: datetime,
        user_id: str
    ) -> ValidationResult:
        """Validate if a task can be scheduled at the proposed time"""
        try:
            # Get the task
            task = self.db.query(Task).filter(
                and_(Task.task_id == uuid.UUID(task_id), Task.user_id == uuid.UUID(user_id))
            ).first()
            
            if not task:
                return ValidationResult(
                    is_valid=False,
                    validation_result=ValidationResultEnum.BLOCKED,
                    block_reasons=["Task not found"]
                )
            
            # Get the calendar day for the proposed date
            date_str = start_time.strftime("%Y-%m-%d")

            # Use DayContextService to get the proper day context
            day_contexts = DayContextService.generate_day_contexts_for_range(
                user_id, date_str, date_str, self.db
            )

            if day_contexts:
                calendar_day = day_contexts[0]  # Get the first (and only) day context
            else:
                # Fallback to user's default work environment
                user = self.db.query(User).filter(User.user_id == uuid.UUID(user_id)).first()
                default_env = user.default_work_environment.value if user and user.default_work_environment else "home"
                
                calendar_day = UserCalendarDay(
                    user_id=uuid.UUID(user_id),
                    date=date_str,
                    work_environment=default_env,
                    focus_slots=[],
                    availability_slots=[]
                )
            
            # Basic validation checks
            warnings = []
            block_reasons = []
            
            # Check environment compatibility
            if task.fitting_environments:
                # Handle both UserCalendarDay (WorkEnvironmentEnum) and CalendarDayResponse (string)
                if hasattr(calendar_day.work_environment, 'value'):  # WorkEnvironmentEnum
                    day_env = calendar_day.work_environment.value
                else:  # String
                    day_env = calendar_day.work_environment
                
                # Convert task environments to values for comparison
                task_envs = [env.value if hasattr(env, 'value') else env for env in task.fitting_environments]
                
                if day_env not in task_envs:
                    block_reasons.append(f"Task requires environments: {task_envs}, but day is set to: {day_env}")
            
            # Check focus requirements
            if task.requires_focus:
                if not self._is_within_focus_time(start_time, end_time, calendar_day):
                    warnings.append("Task requires focus but scheduled outside focus time")
            
            # Check availability
            if not self._is_within_availability(start_time, end_time, calendar_day):
                block_reasons.append("Proposed time is outside available hours")
            
            # Evaluate scheduling rules
            rule_evaluations = self._evaluate_rules(task, calendar_day, start_time, end_time, user_id)
            
            # Determine final validation result
            if block_reasons:
                validation_result = ValidationResultEnum.BLOCKED
                is_valid = False
            elif warnings or any(eval.action == ActionEnum.WARN and eval.triggered for eval in rule_evaluations):
                validation_result = ValidationResultEnum.WARNED
                is_valid = True
            else:
                validation_result = ValidationResultEnum.ALLOWED
                is_valid = True
            
            return ValidationResult(
                is_valid=is_valid,
                validation_result=validation_result,
                warnings=warnings,
                block_reasons=block_reasons,
                rule_evaluations=rule_evaluations
            )
            
        except Exception as e:
            return ValidationResult(
                is_valid=False,
                validation_result=ValidationResultEnum.BLOCKED,
                block_reasons=[f"Validation error: {str(e)}"]
            )
    
    def _is_within_focus_time(self, start_time: datetime, end_time: datetime, calendar_day) -> bool:
        """Check if the proposed time is within focus time slots"""
        if not calendar_day.focus_slots:
            return False
        
        start_time_str = start_time.strftime("%H:%M")
        end_time_str = end_time.strftime("%H:%M")
        
        for slot in calendar_day.focus_slots:
            # Handle both dictionary slots (UserCalendarDay) and Pydantic model slots (CalendarDayResponse)
            if hasattr(slot, 'start_time'):  # Pydantic model
                slot_start = slot.start_time
                slot_end = slot.end_time
            else:  # Dictionary
                slot_start = slot.get("start_time", "")
                slot_end = slot.get("end_time", "")
            
            if slot_start <= start_time_str and end_time_str <= slot_end:
                return True
        
        return False
    
    def _is_within_availability(self, start_time: datetime, end_time: datetime, calendar_day) -> bool:
        """Check if the proposed time is within available hours"""
        if not calendar_day.availability_slots:
            return True  # If no availability slots defined, assume always available
        
        start_time_str = start_time.strftime("%H:%M")
        end_time_str = end_time.strftime("%H:%M")
        
        for slot in calendar_day.availability_slots:
            # Handle both dictionary slots (UserCalendarDay) and Pydantic model slots (CalendarDayResponse)
            if hasattr(slot, 'status'):  # Pydantic model
                if slot.status == "available":
                    slot_start = slot.start_time
                    slot_end = slot.end_time
                else:
                    continue
            else:  # Dictionary
                if slot.get("status") == "available":
                    slot_start = slot.get("start_time", "")
                    slot_end = slot.get("end_time", "")
                else:
                    continue
            
            print(f"DEBUG::slot_start: {slot_start}, start_time_str: {start_time_str}, slot_end: {slot_end}, end_time_str: {end_time_str}")
            if slot_start <= start_time_str and end_time_str <= slot_end:
                return True
        
        return False
    
    def _evaluate_rules(
        self, 
        task: Task, 
        calendar_day, 
        start_time: datetime, 
        end_time: datetime,
        user_id: str
    ) -> List[RuleEvaluationResult]:
        """Evaluate all applicable scheduling rules"""
        rules = self.db.query(SchedulingRule).filter(
            and_(
                SchedulingRule.user_id == uuid.UUID(user_id),
                SchedulingRule.is_active == True
            )
        ).order_by(SchedulingRule.priority_order).all()
        
        evaluations = []
        
        for rule in rules:
            triggered = self._evaluate_rule_conditions(rule, task, calendar_day, start_time, end_time)
            
            evaluation = RuleEvaluationResult(
                rule_id=str(rule.rule_id),
                rule_name=rule.name,
                action=rule.action,
                triggered=triggered,
                message=rule.alert_message if triggered else None,
                severity="warning" if rule.action == ActionEnum.WARN and triggered else "info"
            )
            
            evaluations.append(evaluation)
        
        return evaluations
    
    def _evaluate_rule_conditions(
        self, 
        rule: SchedulingRule, 
        task: Task, 
        calendar_day, 
        start_time: datetime, 
        end_time: datetime
    ) -> bool:
        """Evaluate if a rule's conditions are met"""
        if not rule.conditions:
            return False
        
        # For now, implement basic condition evaluation
        # This will be expanded in future iterations
        for condition in rule.conditions:
            source = condition.get("source")
            field = condition.get("field")
            operator = condition.get("operator")
            value = condition.get("value")
            
            if source == "task_property":
                if not self._evaluate_task_property_condition(task, field, operator, value):
                    return False
        
        return True
    
    def _evaluate_task_property_condition(self, task: Task, field: str, operator: str, value: Any) -> bool:
        """Evaluate a condition against task properties"""
        if field == "priority":
            task_value = task.priority.value if task.priority else None
        elif field == "requires_focus":
            task_value = task.requires_focus
        elif field == "estimated_duration_minutes":
            task_value = task.estimated_duration_minutes
        else:
            return True  # Unknown field, skip condition
        
        if operator == "equals":
            return task_value == value
        elif operator == "not_equals":
            return task_value != value
        elif operator == "greater_than":
            return task_value > value
        elif operator == "less_than":
            return task_value < value
        
        return True  # Unknown operator, skip condition
    
    def suggest_slots(
        self, 
        task_id: str, 
        date_range: Tuple[datetime, datetime],
        user_id: str
    ) -> List[SuggestionSlot]:
        """Find optimal scheduling slots for a task"""
        try:
            # Get the task
            task = self.db.query(Task).filter(
                and_(Task.task_id == uuid.UUID(task_id), Task.user_id == uuid.UUID(user_id))
            ).first()
            
            if not task:
                return []
            
            suggestions = []
            current_date = date_range[0]
            
            # Look for slots in the date range
            while current_date <= date_range[1]:
                date_str = current_date.strftime("%Y-%m-%d")
                
                # Use DayContextService to get the proper day context
                day_contexts = DayContextService.generate_day_contexts_for_range(
                    user_id, date_str, date_str, self.db
                )
                
                if day_contexts:
                    calendar_day = day_contexts[0]  # Get the first (and only) day context
                    # Generate suggestions for this day
                    day_suggestions = self._generate_day_suggestions(task, calendar_day, current_date)
                    suggestions.extend(day_suggestions)
                else:
                    # Fallback to user's default work environment
                    user = self.db.query(User).filter(User.user_id == uuid.UUID(user_id)).first()
                    default_env = user.default_work_environment.value if user and user.default_work_environment else "home"
                    
                    default_calendar_day = UserCalendarDay(
                        user_id=uuid.UUID(user_id),
                        date=date_str,
                        work_environment=default_env,
                        focus_slots=[],
                        availability_slots=[]
                    )
                    day_suggestions = self._generate_day_suggestions(task, default_calendar_day, current_date)
                    suggestions.extend(day_suggestions)
                
                current_date += timedelta(days=1)
            
            # Sort suggestions by score (highest first)
            suggestions.sort(key=lambda x: x.score, reverse=True)
            
            return suggestions[:5]  # Return top 5 suggestions
            
        except Exception as e:
            print(f"Error generating suggestions: {e}")
            return []
    
    def _generate_day_suggestions(
        self, 
        task: Task, 
        calendar_day, 
        date: datetime
    ) -> List[SuggestionSlot]:
        """Generate suggestions for a specific day"""
        suggestions = []
        
        # Check if task fits the environment
        if task.fitting_environments:
            # Handle both UserCalendarDay (WorkEnvironmentEnum) and CalendarDayResponse (string)
            if hasattr(calendar_day.work_environment, 'value'):  # WorkEnvironmentEnum
                day_env = calendar_day.work_environment.value
            else:  # String
                day_env = calendar_day.work_environment
            
            # Convert task environments to values for comparison
            task_envs = [env.value if hasattr(env, 'value') else env for env in task.fitting_environments]
            
            if day_env not in task_envs:
                return suggestions
        
        # Generate suggestions based on focus slots
        if calendar_day.focus_slots and task.requires_focus:
            for slot in calendar_day.focus_slots:
                # Handle both dictionary slots (UserCalendarDay) and Pydantic model slots (CalendarDayResponse)
                if hasattr(slot, 'start_time'):  # Pydantic model
                    slot_start = slot.start_time
                    slot_end = slot.end_time
                else:  # Dictionary
                    slot_start = slot.get("start_time", "")
                    slot_end = slot.get("end_time", "")
                
                if slot_start and slot_end:
                    # Create suggestion for this focus slot
                    start_time = datetime.strptime(f"{date.strftime('%Y-%m-%d')} {slot_start}", "%Y-%m-%d %H:%M")
                    end_time = datetime.strptime(f"{date.strftime('%Y-%m-%d')} {slot_end}", "%Y-%m-%d %H:%M")
                    
                    # Adjust for task duration
                    task_duration = timedelta(minutes=task.estimated_duration_minutes)
                    if (end_time - start_time) >= task_duration:
                        # Calculate score based on multiple factors
                        score = self._calculate_slot_score(task, calendar_day, start_time, end_time)
                        
                        suggestion = SuggestionSlot(
                            start_time=start_time,
                            end_time=start_time + task_duration,
                            score=score,
                            reason=f"Focus time slot ({slot_start}-{slot_end})",
                            calendar_day_id=str(calendar_day.calendar_day_id) if hasattr(calendar_day, 'calendar_day_id') else None
                        )
                        suggestions.append(suggestion)
        
        # Generate suggestions based on availability slots
        if calendar_day.availability_slots:
            for slot in calendar_day.availability_slots:
                # Handle both dictionary slots (UserCalendarDay) and Pydantic model slots (CalendarDayResponse)
                if hasattr(slot, 'status'):  # Pydantic model
                    if slot.status == "available":
                        slot_start = slot.start_time
                        slot_end = slot.end_time
                    else:
                        continue
                else:  # Dictionary
                    if slot.get("status") == "available":
                        slot_start = slot.get("start_time", "")
                        slot_end = slot.get("end_time", "")
                    else:
                        continue
                
                if slot_start and slot_end:
                    start_time = datetime.strptime(f"{date.strftime('%Y-%m-%d')} {slot_start}", "%Y-%m-%d %H:%M")
                    end_time = datetime.strptime(f"{date.strftime('%Y-%m-%d')} {slot_end}", "%Y-%m-%d %H:%M")
                    
                    task_duration = timedelta(minutes=task.estimated_duration_minutes)
                    if (end_time - start_time) >= task_duration:
                        score = self._calculate_slot_score(task, calendar_day, start_time, end_time)
                        
                        suggestion = SuggestionSlot(
                            start_time=start_time,
                            end_time=start_time + task_duration,
                            score=score,
                            reason=f"Available time ({slot_start}-{slot_end})",
                            calendar_day_id=str(calendar_day.calendar_day_id) if hasattr(calendar_day, 'calendar_day_id') else None
                        )
                        suggestions.append(suggestion)
        else:
            # If no availability slots defined, create a default suggestion for business hours
            # Default business hours: 9 AM to 5 PM
            default_start = datetime.strptime(f"{date.strftime('%Y-%m-%d')} 09:00", "%Y-%m-%d %H:%M")
            default_end = datetime.strptime(f"{date.strftime('%Y-%m-%d')} 17:00", "%Y-%m-%d %H:%M")
            
            task_duration = timedelta(minutes=task.estimated_duration_minutes)
            if (default_end - default_start) >= task_duration:
                score = self._calculate_slot_score(task, calendar_day, default_start, default_end)
                
                suggestion = SuggestionSlot(
                    start_time=default_start,
                    end_time=default_start + task_duration,
                    score=score,
                    reason="Default business hours (9 AM - 5 PM)",
                    calendar_day_id=None  # No specific calendar day ID for default
                )
                suggestions.append(suggestion)
        
        return suggestions
    
    def _calculate_slot_score(
        self, 
        task: Task, 
        calendar_day, 
        start_time: datetime, 
        end_time: datetime
    ) -> float:
        """Calculate a score (0.0-1.0) for a potential slot"""
        score = 0.5  # Base score
        
        # Bonus for focus time if task requires focus
        if task.requires_focus and self._is_within_focus_time(start_time, end_time, calendar_day):
            score += 0.3
        
        # Bonus for environment match
        if task.fitting_environments:
            # Handle both UserCalendarDay (WorkEnvironmentEnum) and CalendarDayResponse (string)
            if hasattr(calendar_day.work_environment, 'value'):  # WorkEnvironmentEnum
                day_env = calendar_day.work_environment.value
            else:  # String
                day_env = calendar_day.work_environment
            
            # Convert task environments to values for comparison
            task_envs = [env.value if hasattr(env, 'value') else env for env in task.fitting_environments]
            
            if day_env in task_envs:
                score += 0.2
        
        # Bonus for priority alignment (higher priority tasks get better slots)
        if task.priority:
            if task.priority.value == "urgent":
                score += 0.2
            elif task.priority.value == "high":
                score += 0.1
        
        # Penalty for deadline proximity
        if task.deadline:
            days_until_deadline = (task.deadline - start_time).days
            if days_until_deadline <= 1:
                score += 0.2
            elif days_until_deadline <= 3:
                score += 0.1
        
        return min(score, 1.0)  # Cap at 1.0
    
    def auto_schedule_tasks(
        self, 
        task_ids: List[str], 
        date_range: Tuple[datetime, datetime],
        user_id: str
    ) -> Dict[str, Any]:
        """Automatically schedule multiple tasks optimally"""
        try:
            scheduled_tasks = []
            failed_tasks = []
            
            # Get all tasks
            tasks = self.db.query(Task).filter(
                and_(Task.task_id.in_([uuid.UUID(tid) for tid in task_ids]), Task.user_id == uuid.UUID(user_id))
            ).order_by(Task.priority.desc(), Task.deadline.asc()).all()
            
            for task in tasks:
                # Get suggestions for this task
                suggestions = self.suggest_slots(str(task.task_id), date_range, user_id)
                
                if suggestions:
                    # Use the best suggestion
                    best_suggestion = suggestions[0]
                    
                    # Validate the placement
                    validation = self.validate_placement(
                        str(task.task_id),
                        best_suggestion.start_time,
                        best_suggestion.end_time,
                        user_id
                    )
                    
                    if validation.is_valid:
                        # Schedule the task
                        task.scheduled_slots = [{
                            "start_time": best_suggestion.start_time.isoformat(),
                            "end_time": best_suggestion.end_time.isoformat(),
                            "calendar_day_id": best_suggestion.calendar_day_id
                        }]
                        
                        self.db.commit()
                        scheduled_tasks.append({
                            "task_id": str(task.task_id),
                            "title": task.title,
                            "scheduled_time": best_suggestion.start_time.isoformat(),
                            "score": best_suggestion.score
                        })
                    else:
                        failed_tasks.append({
                            "task_id": str(task.task_id),
                            "title": task.title,
                            "reason": "Validation failed",
                            "errors": validation.block_reasons
                        })
                else:
                    failed_tasks.append({
                        "task_id": str(task.task_id),
                        "title": task.title,
                        "reason": "No suitable slots found"
                    })
            
            return {
                "scheduled": scheduled_tasks,
                "failed": failed_tasks,
                "total_tasks": len(task_ids),
                "success_rate": len(scheduled_tasks) / len(task_ids) if task_ids else 0
            }
            
        except Exception as e:
            print(f"Error in auto-scheduling: {e}")
            return {
                "scheduled": [],
                "failed": [{"error": str(e)}],
                "total_tasks": len(task_ids),
                "success_rate": 0
            } 