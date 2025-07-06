import type { CalendarDayContext, FocusSlot } from '../api/calendar';

export interface DayContextEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  display?: 'background' | 'block' | 'list-item' | 'inverse-background' | 'none';
  className?: string | string[];
  extendedProps: {
    type: 'work_environment' | 'focus_slot';
    source: string;
    date: string;
    focus_level?: 'high' | 'medium' | 'low';
    work_environment?: 'home' | 'office' | 'outdoors' | 'hybrid';
  };
}

/**
 * Transform day contexts into FullCalendar events
 */
export const transformDayContextToEvents = (dayContexts: CalendarDayContext[]): DayContextEvent[] => {
  const events: DayContextEvent[] = [];
  
  dayContexts.forEach(day => {
    // Work Environment Event (allDay)
    events.push({
      id: `work-env-${day.date}`,
      title: `Work: ${day.work_environment}`,
      start: day.date,
      allDay: true,
      className: `work-env-${day.work_environment}`,
      extendedProps: {
        type: 'work_environment',
        source: day.source,
        date: day.date,
        work_environment: day.work_environment
      }
    });
    
    // Focus Time Events (background)
    day.focus_slots.forEach((slot: FocusSlot, index: number) => {
      events.push({
        id: `focus-${day.date}-${index}`,
        title: `Focus (${slot.focus_level})`,
        start: `${day.date}T${slot.start_time}`,
        end: `${day.date}T${slot.end_time}`,
        display: 'background',
        className: `focus-${slot.focus_level}`,
        extendedProps: {
          type: 'focus_slot',
          focus_level: slot.focus_level,
          source: day.source,
          date: day.date
        }
      });
    });
  });
  
  return events;
};

/**
 * Get CSS classes for different work environments
 */
export const getWorkEnvironmentClasses = (environment: string): string[] => {
  const baseClass = `work-env-${environment}`;
  const classes = [baseClass];
  
  switch (environment) {
    case 'home':
      classes.push('work-env-home');
      break;
    case 'office':
      classes.push('work-env-office');
      break;
    case 'outdoors':
      classes.push('work-env-outdoors');
      break;
    case 'hybrid':
      classes.push('work-env-hybrid');
      break;
  }
  
  return classes;
};

/**
 * Get CSS classes for different focus levels
 */
export const getFocusLevelClasses = (level: string): string[] => {
  const baseClass = `focus-${level}`;
  const classes = [baseClass];
  
  switch (level) {
    case 'high':
      classes.push('focus-high');
      break;
    case 'medium':
      classes.push('focus-medium');
      break;
    case 'low':
      classes.push('focus-low');
      break;
  }
  
  return classes;
};

/**
 * Get source indicator classes
 */
export const getSourceClasses = (source: string): string[] => {
  const classes = [];
  
  switch (source) {
    case 'user_settings':
      classes.push('source-user-settings');
      break;
    case 'daily_override':
      classes.push('source-daily-override');
      break;
    case 'default':
      classes.push('source-default');
      break;
  }
  
  return classes;
}; 