import React, { useState } from 'react'
import type { FocusSlot } from '../../api/calendar'

interface WorkEnvironmentOverrideProps {
  date: string
  currentEnvironment: string
  source: string
  onSave: (date: string, environment: string) => void
  onCancel: () => void
}

interface FocusSlotOverrideProps {
  date: string
  slot: FocusSlot
  slotIndex: number
  source: string
  onSave: (date: string, slotIndex: number, updatedSlot: FocusSlot) => void
  onDelete: (date: string, slotIndex: number) => void
  onCancel: () => void
}

const WorkEnvironmentOverride: React.FC<WorkEnvironmentOverrideProps> = ({
  date,
  currentEnvironment,
  source,
  onSave,
  onCancel,
}) => {
  const [selectedEnvironment, setSelectedEnvironment] = useState(currentEnvironment)

  const environments = [
    { value: 'home', label: '🏠 Home' },
    { value: 'office', label: '🏢 Office' },
    { value: 'outdoors', label: '🌳 Outdoors' },
    { value: 'hybrid', label: '🔄 Hybrid' },
  ]

  const handleSave = () => {
    onSave(date, selectedEnvironment)
  }

  return (
    <div className="override-dialog">
      <div className="override-dialog-header">
        <h3>Override Work Environment</h3>
        <button className="close-button" onClick={onCancel}>
          ×
        </button>
      </div>

      <div className="override-dialog-content">
        <div className="date-info">
          <strong>Date:</strong> {new Date(date).toLocaleDateString()}
        </div>

        <div className="source-info">
          <strong>Current Source:</strong> {source}
        </div>

        <div className="current-value">
          <strong>Current:</strong>{' '}
          {environments.find((e) => e.value === currentEnvironment)?.label}
        </div>

        <div className="form-group">
          <label htmlFor="environment-select">New Work Environment:</label>
          <select
            id="environment-select"
            value={selectedEnvironment}
            onChange={(e) => setSelectedEnvironment(e.target.value)}
          >
            {environments.map((env) => (
              <option key={env.value} value={env.value}>
                {env.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="override-dialog-actions">
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={selectedEnvironment === currentEnvironment}
        >
          Save Override
        </button>
      </div>
    </div>
  )
}

const FocusSlotOverride: React.FC<FocusSlotOverrideProps> = ({
  date,
  slot,
  slotIndex,
  source,
  onSave,
  onDelete,
  onCancel,
}) => {
  const [startTime, setStartTime] = useState(slot.start_time)
  const [endTime, setEndTime] = useState(slot.end_time)
  const [focusLevel, setFocusLevel] = useState(slot.focus_level)

  const focusLevels = [
    { value: 'high', label: '🔴 High Focus' },
    { value: 'medium', label: '🟠 Medium Focus' },
    { value: 'low', label: '🟢 Low Focus' },
  ]

  const handleSave = () => {
    const updatedSlot: FocusSlot = {
      start_time: startTime,
      end_time: endTime,
      focus_level: focusLevel,
    }
    onSave(date, slotIndex, updatedSlot)
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this focus time?')) {
      onDelete(date, slotIndex)
    }
  }

  const hasChanges =
    startTime !== slot.start_time || endTime !== slot.end_time || focusLevel !== slot.focus_level

  return (
    <div className="override-dialog">
      <div className="override-dialog-header">
        <h3>Override Focus Time</h3>
        <button className="close-button" onClick={onCancel}>
          ×
        </button>
      </div>

      <div className="override-dialog-content">
        <div className="date-info">
          <strong>Date:</strong> {new Date(date).toLocaleDateString()}
        </div>

        <div className="source-info">
          <strong>Current Source:</strong> {source}
        </div>

        <div className="form-group">
          <label htmlFor="start-time">Start Time:</label>
          <input
            id="start-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="end-time">End Time:</label>
          <input
            id="end-time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="focus-level">Focus Level:</label>
          <select
            id="focus-level"
            value={focusLevel}
            onChange={(e) => setFocusLevel(e.target.value as 'high' | 'medium' | 'low')}
          >
            {focusLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="override-dialog-actions">
        <button className="btn btn-danger" onClick={handleDelete}>
          Delete Focus Time
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={!hasChanges}>
          Save Changes
        </button>
      </div>
    </div>
  )
}

interface DailyOverrideDialogProps {
  isOpen: boolean
  type: 'work_environment' | 'focus_slot' | null
  data: {
    date: string
    environment?: string
    source?: string
    slot?: FocusSlot
    slotIndex?: number
  } | null
  onSave: (type: 'work_environment' | 'focus_slot', data: Record<string, unknown>) => void
  onDelete?: (type: 'focus_slot', data: Record<string, unknown>) => void
  onClose: () => void
}

const DailyOverrideDialog: React.FC<DailyOverrideDialogProps> = ({
  isOpen,
  type,
  data,
  onSave,
  onDelete,
  onClose,
}) => {
  if (!isOpen || !type || !data) return null

  const handleWorkEnvironmentSave = (date: string, environment: string) => {
    onSave('work_environment', { date, environment })
  }

  const handleFocusSlotSave = (date: string, slotIndex: number, updatedSlot: FocusSlot) => {
    onSave('focus_slot', { date, slotIndex, slot: updatedSlot })
  }

  const handleFocusSlotDelete = (date: string, slotIndex: number) => {
    if (onDelete) {
      onDelete('focus_slot', { date, slotIndex })
    }
  }

  return (
    <div className="override-dialog-overlay" onClick={onClose}>
      <div className="override-dialog-container" onClick={(e) => e.stopPropagation()}>
        {type === 'work_environment' && data.environment && data.source && (
          <WorkEnvironmentOverride
            date={data.date}
            currentEnvironment={data.environment}
            source={data.source}
            onSave={handleWorkEnvironmentSave}
            onCancel={onClose}
          />
        )}

        {type === 'focus_slot' && data.slot && data.slotIndex !== undefined && data.source && (
          <FocusSlotOverride
            date={data.date}
            slot={data.slot}
            slotIndex={data.slotIndex}
            source={data.source}
            onSave={handleFocusSlotSave}
            onDelete={handleFocusSlotDelete}
            onCancel={onClose}
          />
        )}
      </div>
    </div>
  )
}

export default DailyOverrideDialog
