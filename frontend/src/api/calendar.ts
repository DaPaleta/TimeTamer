import api from './tasks';

export interface CalendarDayContext {
  date: string;
  focus: boolean;
  available: boolean;
  // ...other fields as needed
}

export async function fetchCalendarContext(start_date: string, end_date: string): Promise<CalendarDayContext[]> {
  // Always send only YYYY-MM-DD to the backend
  const start = start_date.slice(0, 10);
  const end = end_date.slice(0, 10);
  const response = await api.get('/calendar/days', { params: { start_date: start, end_date: end } });
  return response.data;
} 