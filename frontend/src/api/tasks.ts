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
  estimated_duration_minutes: number;
  deadline?: string;
  fitting_environments?: ("home" | "office" | "outdoors" | "hybrid" | "any")[];
  requires_focus?: boolean;
  requires_deep_work?: boolean;
  can_be_interrupted?: boolean;
  requires_meeting?: boolean;
  is_endless?: boolean;
  is_recurring?: boolean;
  recurring_pattern?: RecurringPattern;
}

export async function createTask(task: TaskInput) {
  const response = await api.post("/tasks", task);
  return response.data;
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await api.get("/tasks/categories");
  return response.data;
}

export default api; 