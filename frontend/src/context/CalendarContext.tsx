import React, { createContext, useContext, useState, useCallback } from 'react';
import { fetchScheduledEvents } from '../api/tasks';
import { fetchCalendarContext, type CalendarDayContext } from '../api/calendar';

// Types for calendar view and date range
export type CalendarView = 'timeGridWeek' | 'timeGridDay';
export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

// Types for scheduled events
export interface ScheduledEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  category?: string;
  task_id?: string;
  validation?: {
    valid: boolean;
    reasons: string[];
  };
  // ...other fields as needed
}

interface CalendarContextType {
  view: CalendarView;
  setView: (view: CalendarView) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  scheduledEvents: ScheduledEvent[];
  setScheduledEvents: (events: ScheduledEvent[]) => void;
  calendarContext: CalendarDayContext[];
  setCalendarContext: (ctx: CalendarDayContext[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (err: string | null) => void;
  fetchAndStoreCalendarData: (range: DateRange) => Promise<void>;
  invalidateCalendarCache: () => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

// Simple in-memory cache for recently viewed date ranges
const calendarDataCache = new Map<string, { events: ScheduledEvent[]; context: CalendarDayContext[] }>();

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<CalendarView>('timeGridWeek');
  const [dateRange, setDateRange] = useState<DateRange>({ start: '', end: '' });
  const [scheduledEvents, setScheduledEvents] = useState<ScheduledEvent[]>([]);
  const [calendarContext, setCalendarContext] = useState<CalendarDayContext[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAndStoreCalendarData = useCallback(async (range: DateRange) => {
    console.log('[CalendarContext] fetchAndStoreCalendarData called with', range);
    setLoading(true);
    setError(null);
    const cacheKey = `${range.start}_${range.end}`;
    if (calendarDataCache.has(cacheKey)) {
      const cached = calendarDataCache.get(cacheKey)!;
      setScheduledEvents(cached.events);
      setCalendarContext(cached.context);
      setLoading(false);
      return;
    }
    try {
      const [events, contextResponse] = await Promise.all([
        fetchScheduledEvents(range.start, range.end),
        fetchCalendarContext(range.start, range.end),
      ]);
      console.log('[CalendarContext] setScheduledEvents', events);
      setScheduledEvents(events);
      setCalendarContext(contextResponse.days);
      calendarDataCache.set(cacheKey, { events, context: contextResponse.days });
    } catch (err) {
      let message = 'Failed to load calendar data.';
      if (err instanceof Error) message += ` ${err.message}`;
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const invalidateCalendarCache = useCallback(() => {
    console.log('[CalendarContext] Invalidating calendar cache');
    calendarDataCache.clear();
  }, []);

  const setDateRangeLogged = (range: DateRange) => {
    console.log('[CalendarContext] setDateRange', range);
    setDateRange(range);
  };

  return (
    <CalendarContext.Provider value={{
      view, setView,
      dateRange, setDateRange: setDateRangeLogged,
      scheduledEvents, setScheduledEvents,
      calendarContext, setCalendarContext,
      loading, setLoading,
      error, setError,
      fetchAndStoreCalendarData,
      invalidateCalendarCache
    }}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendarContext = () => {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error('useCalendarContext must be used within a CalendarProvider');
  return ctx;
}; 