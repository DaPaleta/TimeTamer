import React, { useState, useEffect } from 'react'
import { getRuleBuilderConfig, type RuleBuilderConfig } from '../../api/scheduling'
import './ConditionBuilder.css'

interface ConditionBuilderProps {
  conditions: Condition[]
  onChange: (conditions: Condition[]) => void
}

interface Condition {
  source: string
  field: string
  operator: string
  value: string | number | boolean
}

const ConditionBuilder: React.FC<ConditionBuilderProps> = ({ conditions, onChange }) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [config, setConfig] = useState<RuleBuilderConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const ruleConfig = await getRuleBuilderConfig()
      setConfig(ruleConfig)
    } catch (error) {
      console.error('Failed to load rule builder config:', error)
    } finally {
      setLoading(false)
    }
  }

  const availableSources = [
    { value: 'task_property', label: 'Task Property' },
    { value: 'calendar_day', label: 'Calendar Day' },
    { value: 'time_slot', label: 'Time Slot' },
  ]

  const getAvailableFields = (source: string) => {
    if (!config) return []

    switch (source) {
      case 'task_property':
        return config.task_properties
      case 'calendar_day':
        return config.calendar_day_properties
      case 'time_slot':
        return config.time_slot_properties
      default:
        return []
    }
  }

  const getAvailableOperators = (field: string) => {
    if (!config) return []
    return config.operators[field] || []
  }

  const getValueOptions = (source: string, field: string) => {
    if (!config) return []

    if (source === 'task_property') {
      if (field === 'priority') {
        return config.task_priorities
      }
      if (field === 'requires_focus' || field === 'category_id') {
        return field === 'requires_focus' ? config.boolean_options : config.categories
      }
    }

    if (source === 'calendar_day') {
      if (field === 'work_environment') {
        return config.work_environments
      }
      if (field === 'has_focus_slots') {
        return config.boolean_options
      }
    }

    if (source === 'time_slot') {
      if (field === 'is_focus_time') {
        return config.time_slot_focus_levels
      }
      if (field === 'is_available') {
        return config.boolean_options
      }
    }

    return []
  }

  const addCondition = () => {
    const newCondition: Condition = {
      source: 'task_property',
      field: 'priority',
      operator: 'equals',
      value: '',
    }
    onChange([...conditions, newCondition])
  }

  const updateCondition = (
    index: number,
    field: keyof Condition,
    value: string | number | boolean
  ) => {
    const updatedConditions = [...conditions]
    updatedConditions[index] = { ...updatedConditions[index], [field]: value }

    // Reset dependent fields when source or field changes
    if (field === 'source' || field === 'field') {
      updatedConditions[index].operator =
        getAvailableOperators(value as string)?.[0]?.value || 'equals'
      updatedConditions[index].value = ''
    }

    onChange(updatedConditions)
  }

  const removeCondition = (index: number) => {
    const updatedConditions = conditions.filter((_, i) => i !== index)
    onChange(updatedConditions)
  }

  const moveCondition = (fromIndex: number, toIndex: number) => {
    const updatedConditions = [...conditions]
    const [movedCondition] = updatedConditions.splice(fromIndex, 1)
    updatedConditions.splice(toIndex, 0, movedCondition)
    onChange(updatedConditions)
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveCondition(draggedIndex, dropIndex)
    }
    setDraggedIndex(null)
  }

  const renderValueInput = (condition: Condition, index: number) => {
    const valueOptions = getValueOptions(condition.source, condition.field)

    if (valueOptions.length > 0) {
      return (
        <select
          value={String(condition.value)}
          onChange={(e) => updateCondition(index, 'value', e.target.value)}
          className="condition-value-select"
        >
          <option value="">Select value...</option>
          {valueOptions.map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
      )
    }

    // For numeric fields
    if (condition.field === 'estimated_duration_minutes' || condition.field === 'hour_of_day') {
      return (
        <input
          type="number"
          value={String(condition.value)}
          onChange={(e) => updateCondition(index, 'value', parseInt(e.target.value) || 0)}
          className="condition-value-input"
          placeholder="Enter value..."
        />
      )
    }

    // For text fields
    return (
      <input
        type="text"
        value={String(condition.value)}
        onChange={(e) => updateCondition(index, 'value', e.target.value)}
        className="condition-value-input"
        placeholder="Enter value..."
      />
    )
  }

  return (
    <div className="condition-builder">
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading rule builder configuration...</p>
        </div>
      ) : !config ? (
        <div className="error-container">
          <p>Failed to load rule builder configuration. Please try again.</p>
          <button onClick={loadConfig} className="retry-button">
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="condition-list">
            {conditions.map((condition, index) => (
              <div
                key={index}
                className={`condition-item ${draggedIndex === index ? 'dragging' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
              >
                <div className="condition-drag-handle">⋮⋮</div>

                <div className="condition-content">
                  <div className="condition-row">
                    <select
                      value={condition.source}
                      onChange={(e) => updateCondition(index, 'source', e.target.value)}
                      className="condition-source-select"
                    >
                      {availableSources.map((source) => (
                        <option key={source.value} value={source.value}>
                          {source.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={condition.field}
                      onChange={(e) => updateCondition(index, 'field', e.target.value)}
                      className="condition-field-select"
                    >
                      {getAvailableFields(condition.source)?.map((field) => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={condition.operator}
                      onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                      className="condition-operator-select"
                    >
                      {getAvailableOperators(condition.field)?.map((operator) => (
                        <option key={operator.value} value={operator.value}>
                          {operator.label}
                        </option>
                      ))}
                    </select>

                    {renderValueInput(condition, index)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeCondition(index)}
                  className="remove-condition-button"
                  title="Remove condition"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={addCondition} className="add-condition-button">
            + Add Condition
          </button>

          {conditions.length > 0 && (
            <div className="condition-help">
              <small>
                <strong>Tip:</strong> Drag conditions to reorder them. All conditions must be true
                for the rule to trigger.
              </small>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ConditionBuilder
