import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export interface Category {
  category_id: string;
  name: string;
  color_hex: string;
}

export interface RecurringPattern {
  frequency?: string;
  interval?: number;
  days_of_week?: string[];
  end_date?: string;
}

export interface TaskInput {
  title: string;
  description?: string;
  category_id?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  status?: "todo" | "in_progress" | "completed" | "blocked" | "cancelled";
  estimated_duration_minutes: number;
  deadline?: string;
  fitting_environments?: ("home" | "office" | "outdoors" | "hybrid")[];
  requires_focus?: boolean;
  requires_deep_work?: boolean;
  can_be_interrupted?: boolean;
  requires_meeting?: boolean;
  is_endless?: boolean;
  is_recurring?: boolean;
  recurring_pattern?: RecurringPattern;
  scheduled_slots?: { start_time: string; end_time: string; calendar_day_id: string | null }[];
}

export interface Task {
  task_id: string;
  user_id: string;
  title: string;
  description?: string;
  category_id?: string;
  category?: Category;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_duration_minutes: number;
  deadline?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
  completed_at?: string;
  fitting_environments?: string[];
  parent_task_id?: string;
  requires_focus?: boolean;
  requires_deep_work?: boolean;
  can_be_interrupted?: boolean;
  requires_meeting?: boolean;
  is_endless?: boolean;
  is_recurring?: boolean;
  recurring_pattern?: RecurringPattern;
  scheduled_slots?: { start_time: string; end_time: string; calendar_day_id: string }[];
  current_alerts?: string[];
  created_at: string;
  updated_at: string;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
}

export interface FetchTasksParams {
  status?: string;
  category_id?: string;
  priority?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
}

export type ScheduledEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  category?: string;
  task_id?: string;
  // ...other fields as needed
};

export async function createTask(task: TaskInput) {
  const response = await api.post("/tasks", task);
  return response.data;
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await api.get("/tasks/categories");
  return response.data;
}

export async function fetchTasks(params: FetchTasksParams = {}): Promise<TaskListResponse> {
  const response = await api.get('/tasks', { params });
  // If backend returns a flat array, wrap it for compatibility
  if (Array.isArray(response.data)) {
    return { tasks: response.data, total: response.data.length, page: 1, limit: response.data.length };
  }
  return response.data;
}

export async function fetchTaskById(task_id: string): Promise<Task> {
  const response = await api.get(`/tasks/${task_id}`);
  return response.data;
}

export async function updateTask(task_id: string, updates: Partial<TaskInput>): Promise<Task> {
  const response = await api.put(`/tasks/${task_id}`, updates);
  return response.data;
}

export async function deleteTask(task_id: string): Promise<void> {
  await api.delete(`/tasks/${task_id}`);
}

export async function fetchScheduledEvents(start: string, end: string): Promise<ScheduledEvent[]> {
  // Always send only YYYY-MM-DD to the backend
  const startDate = start.slice(0, 10);
  const endDate = end.slice(0, 10);
  const response = await api.get('/tasks/scheduled', { params: { start: startDate, end: endDate } });
  return response.data;
}

export default api; 