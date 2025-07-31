import React, { useState } from 'react'
import './ConditionBuilder.css'

interface ConditionBuilderProps {
  conditions: any[]
  onChange: (conditions: any[]) => void
}

interface Condition {
  source: string
  field: string
  operator: string
  value: any
}

const ConditionBuilder: React.FC<ConditionBuilderProps> = ({ conditions, onChange }) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const availableSources = [
    { value: 'task_property', label: 'Task Property' },
    { value: 'calendar_day', label: 'Calendar Day' },
    { value: 'time_slot', label: 'Time Slot' },
  ]

  const availableFields = {
    task_property: [
      { value: 'priority', label: 'Priority' },
      { value: 'requires_focus', label: 'Requires Focus' },
      { value: 'estimated_duration_minutes', label: 'Duration (minutes)' },
      { value: 'category_id', label: 'Category' },
    ],
    calendar_day: [
      { value: 'work_environment', label: 'Work Environment' },
      { value: 'has_focus_slots', label: 'Has Focus Slots' },
    ],
    time_slot: [
      { value: 'is_focus_time', label: 'Is Focus Time' },
      { value: 'is_available', label: 'Is Available' },
      { value: 'hour_of_day', label: 'Hour of Day' },
    ],
  }

  const availableOperators = {
    priority: [
      { value: 'equals', label: 'equals' },
      { value: 'not_equals', label: 'not equals' },
    ],
    requires_focus: [
      { value: 'equals', label: 'equals' },
      { value: 'not_equals', label: 'not equals' },
    ],
    estimated_duration_minutes: [
      { value: 'equals', label: 'equals' },
      { value: 'greater_than', label: 'greater than' },
      { value: 'less_than', label: 'less than' },
    ],
    work_environment: [
      { value: 'equals', label: 'equals' },
      { value: 'not_equals', label: 'not equals' },
    ],
    has_focus_slots: [
      { value: 'equals', label: 'equals' },
      { value: 'not_equals', label: 'not equals' },
    ],
    is_focus_time: [
      { value: 'equals', label: 'equals' },
      { value: 'not_equals', label: 'not equals' },
    ],
    is_available: [
      { value: 'equals', label: 'equals' },
      { value: 'not_equals', label: 'not equals' },
    ],
    hour_of_day: [
      { value: 'equals', label: 'equals' },
      { value: 'greater_than', label: 'greater than' },
      { value: 'less_than', label: 'less than' },
    ],
  }

  const getValueOptions = (source: string, field: string) => {
    if (source === 'task_property' && field === 'priority') {
      return [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' },
      ]
    }
    if (source === 'task_property' && field === 'requires_focus') {
      return [
        { value: true, label: 'Yes' },
        { value: false, label: 'No' },
      ]
    }
    if (source === 'calendar_day' && field === 'work_environment') {
      return [
        { value: 'home', label: 'Home' },
        { value: 'office', label: 'Office' },
        { value: 'outdoors', label: 'Outdoors' },
      ]
    }
    if (source === 'calendar_day' && field === 'has_focus_slots') {
      return [
        { value: true, label: 'Yes' },
        { value: false, label: 'No' },
      ]
    }
    if (source === 'time_slot' && field === 'is_focus_time') {
      return [
        { value: true, label: 'Yes' },
        { value: false, label: 'No' },
      ]
    }
    if (source === 'time_slot' && field === 'is_available') {
      return [
        { value: true, label: 'Yes' },
        { value: false, label: 'No' },
      ]
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

  const updateCondition = (index: number, field: keyof Condition, value: any) => {
    const updatedConditions = [...conditions]
    updatedConditions[index] = { ...updatedConditions[index], [field]: value }

    // Reset dependent fields when source or field changes
    if (field === 'source' || field === 'field') {
      updatedConditions[index].operator =
        availableOperators[value as keyof typeof availableOperators]?.[0]?.value || 'equals'
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
          value={condition.value}
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
          value={condition.value}
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
        value={condition.value}
        onChange={(e) => updateCondition(index, 'value', e.target.value)}
        className="condition-value-input"
        placeholder="Enter value..."
      />
    )
  }

  return (
    <div className="condition-builder">
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
                  {availableFields[condition.source as keyof typeof availableFields]?.map(
                    (field) => (
                      <option key={field.value} value={field.value}>
                        {field.label}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                  className="condition-operator-select"
                >
                  {availableOperators[condition.field as keyof typeof availableOperators]?.map(
                    (operator) => (
                      <option key={operator.value} value={operator.value}>
                        {operator.label}
                      </option>
                    )
                  )}
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
            <strong>Tip:</strong> Drag conditions to reorder them. All conditions must be true for
            the rule to trigger.
          </small>
        </div>
      )}
    </div>
  )
}

export default ConditionBuilder
