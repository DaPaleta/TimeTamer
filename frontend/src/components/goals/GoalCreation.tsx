import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Typography,
  Alert,
} from '@mui/material'
import { goalsApi, type GoalCreate } from '../../api/goals'

interface GoalCreationProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const GoalCreation: React.FC<GoalCreationProps> = ({ open, onClose, onSuccess }) => {
  const [form, setForm] = useState<GoalCreate>({
    name: '',
    target_type: 'minutes',
    target_value: 300,
    time_period: 'weekly',
    is_active: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.name.trim()) {
      newErrors.name = 'Goal name is required'
    } else if (form.name.length > 100) {
      newErrors.name = 'Goal name must be less than 100 characters'
    }

    if (form.target_value <= 0) {
      newErrors.target_value = 'Target value must be greater than 0'
    }

    if (form.target_type === 'percentage_of_scheduled_time' && form.target_value > 100) {
      newErrors.target_value = 'Percentage cannot exceed 100%'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    setSubmitError(null)

    try {
      await goalsApi.create(form)
      setForm({
        name: '',
        target_type: 'minutes',
        target_value: 300,
        time_period: 'weekly',
        is_active: true,
      })
      setErrors({})
      onSuccess()
      onClose()
    } catch (error: any) {
      setSubmitError(error?.response?.data?.detail || 'Failed to create goal')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setForm({
        name: '',
        target_type: 'minutes',
        target_value: 300,
        time_period: 'weekly',
        is_active: true,
      })
      setErrors({})
      setSubmitError(null)
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Goal</DialogTitle>
      <DialogContent>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Goal Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            required
          />

          <FormControl fullWidth error={!!errors.target_type}>
            <InputLabel>Target Type</InputLabel>
            <Select
              value={form.target_type}
              onChange={(e) => setForm({ ...form, target_type: e.target.value as any })}
              label="Target Type"
            >
              <MenuItem value="minutes">Minutes</MenuItem>
              <MenuItem value="percentage_of_scheduled_time">% of Scheduled Time</MenuItem>
              <MenuItem value="task_completion_count">Tasks Completed</MenuItem>
            </Select>
            {errors.target_type && <FormHelperText>{errors.target_type}</FormHelperText>}
          </FormControl>

          <TextField
            label="Target Value"
            type="number"
            value={form.target_value}
            onChange={(e) => setForm({ ...form, target_value: parseInt(e.target.value, 10) || 0 })}
            error={!!errors.target_value}
            helperText={
              errors.target_value ||
              (form.target_type === 'percentage_of_scheduled_time'
                ? 'Enter percentage (1-100)'
                : 'Enter target value')
            }
            fullWidth
            required
            inputProps={{
              min: 1,
              max: form.target_type === 'percentage_of_scheduled_time' ? 100 : undefined,
            }}
          />

          <FormControl fullWidth>
            <InputLabel>Time Period</InputLabel>
            <Select
              value={form.time_period}
              onChange={(e) => setForm({ ...form, time_period: e.target.value as any })}
              label="Time Period"
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>

          <Box>
            <Typography variant="body2" color="text.secondary">
              <strong>Examples:</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • "Complete 300 minutes of deep work weekly"
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • "Spend 80% of scheduled time on work tasks daily"
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • "Complete 15 tasks monthly"
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || !form.name.trim()}>
          {loading ? 'Creating...' : 'Create Goal'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default GoalCreation
