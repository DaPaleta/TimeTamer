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

export interface Goal {
  goal_id: string
  user_id: string
  name: string
  category_id?: string
  target_type: 'minutes' | 'percentage_of_scheduled_time' | 'task_completion_count'
  target_value: number
  time_period: 'daily' | 'weekly' | 'monthly'
  start_date?: string
  end_date?: string
  is_active: boolean
  created_at: string
}

export interface GoalCreate extends Omit<Goal, 'goal_id' | 'user_id' | 'created_at'> {}
export type GoalUpdate = Partial<GoalCreate>

export interface IGoalProgress {
  goal_id: string
  name: string
  target_type: 'minutes' | 'percentage_of_scheduled_time' | 'task_completion_count'
  target_value: number
  period: {
    start: string
    end: string
  }
  achieved_value: number
  percent_complete: number
  status: 'on_track' | 'behind' | 'ahead' | 'completed'
}

export const goalsApi = {
  list: async (): Promise<Goal[]> => {
    const { data } = await api.get('/goals/')
    return data
  },
  create: async (payload: GoalCreate): Promise<Goal> => {
    const { data } = await api.post('/goals/', payload)
    return data
  },
  update: async (goalId: string, payload: GoalUpdate): Promise<Goal> => {
    const { data } = await api.put(`/goals/${goalId}`, payload)
    return data
  },
  delete: async (goalId: string): Promise<void> => {
    await api.delete(`/goals/${goalId}`)
  },
  progress: async (period = 'weekly', startDate?: string): Promise<IGoalProgress[]> => {
    const params: any = { period }
    if (startDate) params.start_date = startDate
    const { data } = await api.get('/goals/progress', { params })
    return data
  },
}

export default api
