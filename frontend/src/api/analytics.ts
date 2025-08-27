import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers = config.headers || {}
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

export interface QuickStats {
  total_scheduled_minutes: number
  completed_tasks_count: number
  focus_time_utilization: number
  top_category?: { category_id: string; name: string; minutes: number }
  streak_days_completed: number
}

export interface TrendPoint {
  date: string
  total_scheduled_minutes: number
  focus_minutes: number
  completed_tasks_count: number
}

export interface DashboardData {
  category_minutes: Record<string, number>
  trend: TrendPoint[]
  completion_rate: number
  focus_utilization: number
}

export const analyticsApi = {
  getQuickStats: async (dateRange = '7d'): Promise<QuickStats> => {
    const { data } = await api.get('/analytics/quick-stats', { params: { date_range: dateRange } })
    return data
  },
  getDashboard: async (period = 'monthly'): Promise<DashboardData> => {
    const { data } = await api.get('/analytics/dashboard', { params: { period } })
    return data
  },
  exportCsv: async (startDate: string, endDate: string): Promise<Blob> => {
    const { data } = await api.get('/analytics/export', {
      params: { start_date: startDate, end_date: endDate },
      responseType: 'blob',
    })
    return data
  },
}

export default api
