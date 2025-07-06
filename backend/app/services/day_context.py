from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..db.models import User, UserCalendarDay, UserDaySettings
from ..schemas.calendar import BaseDayContext, CalendarDayResponse, RecurrencePattern
import json


class DayContextService:
    """Service for generating day contexts by merging different configuration layers"""
    
    @staticmethod
    def get_base_day_context() -> BaseDayContext:
        """Get system default day context"""
        return BaseDayContext()
    
    @staticmethod
    def is_date_in_pattern(date: str, pattern: RecurrencePattern) -> bool:
        """Check if a date matches a recurrence pattern"""
        target_date = datetime.strptime(date, "%Y-%m-%d")
        start_date = datetime.strptime(pattern.start_date, "%Y-%m-%d")
        
        # Check if date is before start date
        if target_date < start_date:
            return False
        
        # Check if date is after end date (if specified)
        if pattern.end_date:
            end_date = datetime.strptime(pattern.end_date, "%Y-%m-%d")
            if target_date > end_date:
                return False
        
        # Check pattern type
        if pattern.pattern_type == "daily":
            days_diff = (target_date - start_date).days
            return days_diff % pattern.interval == 0
        
        elif pattern.pattern_type == "weekly":
            if not pattern.days_of_week:
                return False
            
            # Check if the day of week matches
            day_of_week = target_date.weekday()  # 0=Monday, 6=Sunday
            if day_of_week not in pattern.days_of_week:
                return False
            
            # Check if it's the right week interval
            weeks_diff = (target_date - start_date).days // 7
            return weeks_diff % pattern.interval == 0
        
        elif pattern.pattern_type == "monthly":
            # Check if it's the right month interval
            months_diff = (target_date.year - start_date.year) * 12 + target_date.month - start_date.month
            return months_diff % pattern.interval == 0
        
        elif pattern.pattern_type == "custom":
            # For custom patterns, check days of week
            if not pattern.days_of_week:
                return False
            
            day_of_week = target_date.weekday()
            return day_of_week in pattern.days_of_week
        
        return False
    
    @staticmethod
    def get_user_settings_for_date(user_id: str, date: str, db: Session) -> Dict[str, Any]:
        """Get user settings that apply to a specific date"""
        settings = db.query(UserDaySettings).filter(
            UserDaySettings.user_id == user_id,
            UserDaySettings.is_active == True
        ).all()
        
        result = {}
        
        for setting in settings:
            try:
                pattern = RecurrencePattern(**setting.recurrence_pattern)
                if DayContextService.is_date_in_pattern(date, pattern):
                    result[setting.setting_type] = setting.value
            except Exception:
                # Skip invalid patterns
                continue
        
        return result
    
    @staticmethod
    def merge_day_contexts(
        base_context: BaseDayContext,
        user_settings: Dict[str, Any],
        daily_override: Optional[Dict[str, Any]] = None,
        date: str = ""
    ) -> CalendarDayResponse:
        """Merge different layers of day context configuration"""
        
        # Start with base context
        merged = {
            "date": date,
            "work_environment": base_context.work_environment,
            "focus_slots": base_context.focus_slots,
            "availability_slots": base_context.availability_slots,
            "source": "default"
        }
        
        # Apply user settings (overrides base)
        if user_settings:
            if "work_environment" in user_settings:
                # Extract the actual work environment value from the dictionary
                work_env_value = user_settings["work_environment"]
                if isinstance(work_env_value, dict) and "work_environment" in work_env_value:
                    merged["work_environment"] = work_env_value["work_environment"]
                else:
                    merged["work_environment"] = work_env_value
                merged["source"] = "user_settings"
            
            if "focus_slots" in user_settings:
                focus_value = user_settings["focus_slots"]
                if isinstance(focus_value, dict) and "focus_slots" in focus_value:
                    merged["focus_slots"] = focus_value["focus_slots"]
                else:
                    merged["focus_slots"] = focus_value
                merged["source"] = "user_settings"
            
            if "availability_slots" in user_settings:
                avail_value = user_settings["availability_slots"]
                if isinstance(avail_value, dict) and "availability_slots" in avail_value:
                    merged["availability_slots"] = avail_value["availability_slots"]
                else:
                    merged["availability_slots"] = avail_value
                merged["source"] = "user_settings"
        
        # Apply daily override (overrides everything)
        if daily_override:
            if "work_environment" in daily_override:
                merged["work_environment"] = daily_override["work_environment"]
                merged["source"] = "daily_override"
            
            if "focus_slots" in daily_override:
                merged["focus_slots"] = daily_override["focus_slots"]
                merged["source"] = "daily_override"
            
            if "availability_slots" in daily_override:
                merged["availability_slots"] = daily_override["availability_slots"]
                merged["source"] = "daily_override"
        
        return CalendarDayResponse(**merged)
    
    @staticmethod
    def generate_day_contexts_for_range(
        user_id: str,
        start_date: str,
        end_date: str,
        db: Session
    ) -> List[CalendarDayResponse]:
        """Generate day contexts for a date range"""
        
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        
        base_context = DayContextService.get_base_day_context()
        day_contexts = []
        
        current_date = start
        while current_date <= end:
            date_str = current_date.strftime("%Y-%m-%d")
            
            # Get user settings for this date
            user_settings = DayContextService.get_user_settings_for_date(user_id, date_str, db)
            
            # Get daily override (if exists)
            daily_override = None
            calendar_day = db.query(UserCalendarDay).filter(
                UserCalendarDay.user_id == user_id,
                UserCalendarDay.date == date_str
            ).first()
            
            if calendar_day:
                daily_override = {
                    "work_environment": calendar_day.work_environment.value,
                    "focus_slots": calendar_day.focus_slots,
                    "availability_slots": calendar_day.availability_slots
                }
            
            # Merge all layers
            day_context = DayContextService.merge_day_contexts(
                base_context, user_settings, daily_override, date_str
            )
            
            # Add database fields if it's a daily override
            if calendar_day:
                day_context.calendar_day_id = calendar_day.calendar_day_id
                day_context.user_id = calendar_day.user_id
                day_context.created_at = calendar_day.created_at
                day_context.updated_at = calendar_day.updated_at
            
            day_contexts.append(day_context)
            current_date += timedelta(days=1)
        
        return day_contexts 