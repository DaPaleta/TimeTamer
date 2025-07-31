import React, { useState, useEffect } from 'react'
import {
  createSchedulingRule,
  updateSchedulingRule,
  type SchedulingRule,
} from '../../api/scheduling'
import ConditionBuilder from './ConditionBuilder'
import './RuleBuilder.css'

interface RuleBuilderProps {
  rule?: SchedulingRule
  onSave: (rule: SchedulingRule) => void
  onCancel: () => void
  isOpen: boolean
}

interface RuleFormData {
  name: string
  description: string
  conditions: any[]
  action: 'allow' | 'block' | 'warn' | 'suggest_alternative'
  alert_message: string
  priority_order: number
  is_active: boolean
}

const RuleBuilder: React.FC<RuleBuilderProps> = ({ rule, onSave, onCancel, isOpen }) => {
  const [formData, setFormData] = useState<RuleFormData>({
    name: '',
    description: '',
    conditions: [],
    action: 'warn',
    alert_message: '',
    priority_order: 100,
    is_active: true,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form data when rule prop changes
  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        description: rule.description || '',
        conditions: rule.conditions,
        action: rule.action,
        alert_message: rule.alert_message || '',
        priority_order: rule.priority_order,
        is_active: rule.is_active,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        conditions: [],
        action: 'warn',
        alert_message: '',
        priority_order: 100,
        is_active: true,
      })
    }
    setErrors({})
  }, [rule])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Rule name is required'
    }

    if (formData.conditions.length === 0) {
      newErrors.conditions = 'At least one condition is required'
    }

    if (formData.priority_order < 1 || formData.priority_order > 1000) {
      newErrors.priority_order = 'Priority must be between 1 and 1000'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      let savedRule: SchedulingRule

      if (rule) {
        // Update existing rule
        savedRule = await updateSchedulingRule(rule.rule_id, formData)
      } else {
        // Create new rule
        savedRule = await createSchedulingRule(formData)
      }

      onSave(savedRule)
    } catch (error) {
      console.error('Failed to save rule:', error)
      setErrors({ submit: 'Failed to save rule. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConditionChange = (conditions: any[]) => {
    setFormData((prev) => ({ ...prev, conditions }))
    if (errors.conditions) {
      setErrors((prev) => ({ ...prev, conditions: '' }))
    }
  }

  const handleInputChange = (field: keyof RuleFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="rule-builder-overlay">
      <div className="rule-builder-modal">
        <div className="rule-builder-header">
          <h2>{rule ? 'Edit Rule' : 'Create New Rule'}</h2>
          <button className="close-button" onClick={onCancel} disabled={isLoading}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="rule-builder-form">
          <div className="form-section">
            <h3>Basic Information</h3>

            <div className="form-group">
              <label htmlFor="rule-name">Rule Name *</label>
              <input
                id="rule-name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Block urgent tasks outside focus time"
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="rule-description">Description</label>
              <textarea
                id="rule-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Optional description of what this rule does"
                rows={3}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Conditions</h3>
            <ConditionBuilder conditions={formData.conditions} onChange={handleConditionChange} />
            {errors.conditions && <span className="error-message">{errors.conditions}</span>}
          </div>

          <div className="form-section">
            <h3>Action</h3>

            <div className="form-group">
              <label htmlFor="rule-action">When conditions are met:</label>
              <select
                id="rule-action"
                value={formData.action}
                onChange={(e) => handleInputChange('action', e.target.value)}
              >
                <option value="allow">Allow scheduling</option>
                <option value="block">Block scheduling</option>
                <option value="warn">Show warning</option>
                <option value="suggest_alternative">Suggest alternative time</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="rule-message">Alert Message</label>
              <textarea
                id="rule-message"
                value={formData.alert_message}
                onChange={(e) => handleInputChange('alert_message', e.target.value)}
                placeholder="Message to show when rule is triggered"
                rows={2}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Settings</h3>

            <div className="form-group">
              <label htmlFor="rule-priority">Priority Order</label>
              <input
                id="rule-priority"
                type="number"
                min="1"
                max="1000"
                value={formData.priority_order}
                onChange={(e) => handleInputChange('priority_order', parseInt(e.target.value))}
                className={errors.priority_order ? 'error' : ''}
              />
              <small>Lower numbers = higher priority (1-1000)</small>
              {errors.priority_order && (
                <span className="error-message">{errors.priority_order}</span>
              )}
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                />
                Active
              </label>
              <small>Inactive rules are not evaluated</small>
            </div>
          </div>

          {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}

          <div className="form-actions">
            <button type="button" onClick={onCancel} disabled={isLoading} className="cancel-button">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="save-button">
              {isLoading ? 'Saving...' : rule ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RuleBuilder
