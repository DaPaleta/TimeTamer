import api from './tasks';

export interface CalendarDayContext {
  date: string;
  focus: boolean;
  available: boolean;
  work_environment: 'home' | 'office' | 'outdoors' | 'hybrid'
  // ...other fields as needed
}

interface CalendarDaysResponse {
  days: CalendarDayContext[]
  start_date: string
  end_date: string
  total: number
}

// User Day Settings Types
export interface RecurrencePattern {
  pattern_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  days_of_week: number[]; // 0=Monday, 6=Sunday
  start_date: string;
  end_date?: string;
  interval: number;
}

// Value types for different setting types
export interface WorkEnvironmentValue {
  work_environment: 'home' | 'office' | 'outdoors' | 'hybrid';
}

export interface FocusSlotsValue {
  focus_slots: Array<{
    start_time: string;
    end_time: string;
    focus_level: 'high' | 'medium' | 'low';
  }>;
}

export interface AvailabilitySlotsValue {
  availability_slots: Array<{
    start_time: string;
    end_time: string;
    status: 'available' | 'busy' | 'tentative';
  }>;
}

export type SettingValue = WorkEnvironmentValue | FocusSlotsValue | AvailabilitySlotsValue;

export interface UserDaySetting {
  setting_id: string;
  user_id: string;
  setting_type: 'work_environment' | 'focus_slots' | 'availability_slots';
  value: SettingValue;
  recurrence_pattern: RecurrencePattern;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserDaySettingCreate {
  setting_type: 'work_environment' | 'focus_slots' | 'availability_slots';
  value: SettingValue;
  recurrence_pattern: RecurrencePattern;
}

export interface UserDaySettingUpdate {
  setting_type?: 'work_environment' | 'focus_slots' | 'availability_slots';
  value?: SettingValue;
  recurrence_pattern?: RecurrencePattern;
  is_active?: boolean;
}

export async function fetchCalendarContext(start_date: string, end_date: string): Promise<CalendarDaysResponse> {
  // Always send only YYYY-MM-DD to the backend
  const start = start_date.slice(0, 10);
  const end = end_date.slice(0, 10);
  const response = await api.get('/calendar/days', { params: { start_date: start, end_date: end } });
  const data = response.data
  console.debug('Calendar days response data:', data)
  return data;
}

// User Day Settings API functions
export async function fetchUserDaySettings(): Promise<UserDaySetting[]> {
  const response = await api.get('/calendar/settings');
  return response.data;
}

export async function createUserDaySetting(setting: UserDaySettingCreate): Promise<UserDaySetting> {
  const response = await api.post('/calendar/settings', setting);
  return response.data;
}

export async function updateUserDaySetting(settingId: string, setting: UserDaySettingUpdate): Promise<UserDaySetting> {
  const response = await api.put(`/calendar/settings/${settingId}`, setting);
  return response.data;
}

export async function deleteUserDaySetting(settingId: string): Promise<void> {
  await api.delete(`/calendar/settings/${settingId}`);
} 