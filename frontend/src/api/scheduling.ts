import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers = config.headers || {}
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// TypeScript interfaces matching our backend schemas
export interface ValidationResult {
  is_valid: boolean
  validation_result: string
  warnings: string[]
  block_reasons: string[]
  suggestions: SuggestionSlot[]
  rule_evaluations: RuleEvaluationResult[]
}

export interface SuggestionSlot {
  start_time: string
  end_time: string
  score: number
  reason: string
  calendar_day_id?: string
}

export interface RuleEvaluationResult {
  rule_id: string
  rule_name: string
  action: 'allow' | 'block' | 'warn' | 'suggest_alternative'
  triggered: boolean
  message?: string
  severity: string
}

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'in'
  | 'not_in'

export interface RuleCondition {
  source: 'task_property' | 'calendar_day' | 'time_slot'
  field: string
  operator: ConditionOperator
  value: string | number | boolean | string[]
}

export interface AutoScheduleResult {
  scheduled_tasks: Array<{ task_id: string; title: string; scheduled_time: string; score: number }>
  failed_tasks: Array<{ task_id: string; title: string; reason: string; errors?: string[] }>
}

export interface SchedulingRule {
  rule_id: string
  name: string
  description?: string
  conditions: RuleCondition[]
  action: 'allow' | 'block' | 'warn' | 'suggest_alternative'
  alert_message?: string
  priority_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ValidationRequest {
  task_id: string
  proposed_start_time: string
  proposed_end_time: string
}

export interface SuggestionRequest {
  task_id: string
  start_date: string
  end_date: string
}

export interface AutoScheduleRequest {
  task_ids: string[]
  start_date: string
  end_date: string
}

export interface RuleBuilderConfig {
  categories: Array<{ value: string; label: string }>
  work_environments: Array<{ value: string; label: string }>
  focus_levels: Array<{ value: string; label: string }>
  time_slot_focus_levels: Array<{ value: string; label: string }>
  task_priorities: Array<{ value: string; label: string }>
  boolean_options: Array<{ value: boolean; label: string }>
  task_properties: Array<{ value: string; label: string }>
  calendar_day_properties: Array<{ value: string; label: string }>
  time_slot_properties: Array<{ value: string; label: string }>
  operators: Record<string, Array<{ value: string; label: string }>>
}

// API functions
export async function validatePlacement(
  taskId: string,
  startTime: string,
  endTime: string
): Promise<ValidationResult> {
  const response = await api.post('/scheduling/validate', {
    task_id: taskId,
    proposed_start_time: startTime,
    proposed_end_time: endTime,
  })
  return response.data
}

export async function suggestSlots(
  taskId: string,
  startDate: string,
  endDate: string
): Promise<SuggestionSlot[]> {
  const response = await api.post('/scheduling/suggest', {
    task_id: taskId,
    start_date: startDate,
    end_date: endDate,
  })
  return response.data
}

export async function autoScheduleTasks(
  taskIds: string[],
  startDate: string,
  endDate: string
): Promise<AutoScheduleResult> {
  const response = await api.post('/scheduling/auto-schedule', {
    task_ids: taskIds,
    start_date: startDate,
    end_date: endDate,
  })
  return response.data
}

export async function getRuleBuilderConfig(): Promise<RuleBuilderConfig> {
  const response = await api.get('/scheduling/rule-builder-config')
  return response.data
}

export async function getSchedulingRules(): Promise<SchedulingRule[]> {
  const response = await api.get('/scheduling/rules')
  return response.data
}

export async function createSchedulingRule(
  rule: Omit<SchedulingRule, 'rule_id' | 'created_at' | 'updated_at'>
): Promise<SchedulingRule> {
  const response = await api.post('/scheduling/rules', rule)
  return response.data
}

export async function updateSchedulingRule(
  ruleId: string,
  rule: Partial<SchedulingRule>
): Promise<SchedulingRule> {
  const response = await api.put(`/scheduling/rules/${ruleId}`, rule)
  return response.data
}

export async function deleteSchedulingRule(ruleId: string): Promise<void> {
  await api.delete(`/scheduling/rules/${ruleId}`)
}
