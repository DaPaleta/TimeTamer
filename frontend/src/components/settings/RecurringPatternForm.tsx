import React, { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button,
  Grid,
  Typography,
  Chip,
  Stack,
  FormGroup,
} from '@mui/material'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { format, parse } from 'date-fns'
import type {
  UserDaySetting,
  UserDaySettingCreate,
  UserDaySettingUpdate,
  RecurrencePattern,
} from '../../api/calendar'

interface RecurringPatternFormProps {
  initialData: UserDaySetting | null
  onSave: (data: UserDaySettingCreate | UserDaySettingUpdate) => void
  onCancel: () => void
  saving: boolean
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Monday' },
  { value: 1, label: 'Tuesday' },
  { value: 2, label: 'Wednesday' },
  { value: 3, label: 'Thursday' },
  { value: 4, label: 'Friday' },
  { value: 5, label: 'Saturday' },
  { value: 6, label: 'Sunday' },
]

const WORK_ENVIRONMENTS = [
  { value: 'home', label: 'Home' },
  { value: 'office', label: 'Office' },
  { value: 'outdoors', label: 'Outdoors' },
  { value: 'hybrid', label: 'Hybrid' },
]

const FOCUS_LEVELS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const AVAILABILITY_STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'tentative', label: 'Tentative' },
]

export const RecurringPatternForm: React.FC<RecurringPatternFormProps> = ({
  initialData,
  onSave,
  onCancel,
  saving,
}) => {
  const [settingType, setSettingType] = useState<
    'work_environment' | 'focus_slots' | 'availability_slots'
  >(initialData?.setting_type || 'work_environment')

  // Recurrence pattern
  const [patternType, setPatternType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>(
    initialData?.recurrence_pattern.pattern_type || 'daily'
  )
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    initialData?.recurrence_pattern.days_of_week || []
  )
  const [startDate, setStartDate] = useState(
    initialData?.recurrence_pattern.start_date || format(new Date(), 'yyyy-MM-dd')
  )
  const [endDate, setEndDate] = useState(initialData?.recurrence_pattern.end_date || '')
  const [interval, setInterval] = useState(initialData?.recurrence_pattern.interval || 1)

  // Setting values
  const [workEnvironment, setWorkEnvironment] = useState<'home' | 'office' | 'outdoors' | 'hybrid'>(
    (initialData?.value as any)?.work_environment || 'home'
  )

  const [focusSlots, setFocusSlots] = useState<
    Array<{
      start_time: string
      end_time: string
      focus_level: 'high' | 'medium' | 'low'
    }>
  >(
    (initialData?.value as any)?.focus_slots || [
      { start_time: '09:00', end_time: '11:00', focus_level: 'high' },
    ]
  )

  const [availabilitySlots, setAvailabilitySlots] = useState<
    Array<{
      start_time: string
      end_time: string
      status: 'available' | 'busy' | 'tentative'
    }>
  >(
    (initialData?.value as any)?.availability_slots || [
      { start_time: '09:00', end_time: '17:00', status: 'available' },
    ]
  )

  const handleSave = () => {
    const recurrencePattern: RecurrencePattern = {
      pattern_type: patternType,
      days_of_week: daysOfWeek,
      start_date: startDate,
      end_date: endDate || undefined,
      interval: patternType === 'custom' ? 1 : interval,
    }

    let value: any
    switch (settingType) {
      case 'work_environment':
        value = { work_environment: workEnvironment }
        break
      case 'focus_slots':
        value = { focus_slots: focusSlots }
        break
      case 'availability_slots':
        value = { availability_slots: availabilitySlots }
        break
    }

    if (initialData) {
      onSave({
        setting_type: settingType,
        value,
        recurrence_pattern: recurrencePattern,
      } as UserDaySettingUpdate)
    } else {
      onSave({
        setting_type: settingType,
        value,
        recurrence_pattern: recurrencePattern,
      } as UserDaySettingCreate)
    }
  }

  const addFocusSlot = () => {
    setFocusSlots([...focusSlots, { start_time: '09:00', end_time: '11:00', focus_level: 'high' }])
  }

  const removeFocusSlot = (index: number) => {
    setFocusSlots(focusSlots.filter((_, i) => i !== index))
  }

  const updateFocusSlot = (index: number, field: string, value: string) => {
    const newSlots = [...focusSlots]
    newSlots[index] = { ...newSlots[index], [field]: value }
    setFocusSlots(newSlots)
  }

  const addAvailabilitySlot = () => {
    setAvailabilitySlots([
      ...availabilitySlots,
      { start_time: '09:00', end_time: '17:00', status: 'available' },
    ])
  }

  const removeAvailabilitySlot = (index: number) => {
    setAvailabilitySlots(availabilitySlots.filter((_, i) => i !== index))
  }

  const updateAvailabilitySlot = (index: number, field: string, value: string) => {
    const newSlots = [...availabilitySlots]
    newSlots[index] = { ...newSlots[index], [field]: value }
    setAvailabilitySlots(newSlots)
  }

  const toggleDayOfWeek = (day: number) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter((d) => d !== day))
    } else {
      setDaysOfWeek([...daysOfWeek, day])
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 2 }}>
        <Grid container spacing={3}>
          {/* Setting Type */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Setting Type</InputLabel>
              <Select
                value={settingType}
                onChange={(e) => setSettingType(e.target.value as any)}
                label="Setting Type"
              >
                <MenuItem value="work_environment">Work Environment</MenuItem>
                <MenuItem value="focus_slots">Focus Times</MenuItem>
                <MenuItem value="availability_slots">Availability</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Pattern Type */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Pattern Type</InputLabel>
              <Select
                value={patternType}
                onChange={(e) => setPatternType(e.target.value as any)}
                label="Pattern Type"
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Interval */}
          {patternType !== 'custom' && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Interval"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                inputProps={{ min: 1 }}
                helperText={`Every ${interval} ${patternType === 'daily' ? 'day(s)' : patternType === 'weekly' ? 'week(s)' : 'month(s)'}`}
              />
            </Grid>
          )}

          {/* Days of Week */}
          {(patternType === 'weekly' || patternType === 'custom') && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Days of Week
              </Typography>
              <FormGroup row>
                {DAYS_OF_WEEK.map((day) => (
                  <FormControlLabel
                    key={day.value}
                    control={
                      <Checkbox
                        checked={daysOfWeek.includes(day.value)}
                        onChange={() => toggleDayOfWeek(day.value)}
                      />
                    }
                    label={day.label}
                  />
                ))}
              </FormGroup>
            </Grid>
          )}

          {/* Date Range */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="End Date (Optional)"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Setting Values */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Configuration
            </Typography>
          </Grid>

          {settingType === 'work_environment' && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Work Environment</InputLabel>
                <Select
                  value={workEnvironment}
                  onChange={(e) => setWorkEnvironment(e.target.value as any)}
                  label="Work Environment"
                >
                  {WORK_ENVIRONMENTS.map((env) => (
                    <MenuItem key={env.value} value={env.value}>
                      {env.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {settingType === 'focus_slots' && (
            <Grid item xs={12}>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle1">Focus Time Slots</Typography>
                  <Button onClick={addFocusSlot} size="small">
                    Add Slot
                  </Button>
                </Box>
                <Stack spacing={2}>
                  {focusSlots.map((slot, index) => (
                    <Box key={index} display="flex" gap={2} alignItems="center">
                      <TextField
                        type="time"
                        label="Start Time"
                        value={slot.start_time}
                        onChange={(e) => updateFocusSlot(index, 'start_time', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        type="time"
                        label="End Time"
                        value={slot.end_time}
                        onChange={(e) => updateFocusSlot(index, 'end_time', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                      <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel>Focus Level</InputLabel>
                        <Select
                          value={slot.focus_level}
                          onChange={(e) => updateFocusSlot(index, 'focus_level', e.target.value)}
                          label="Focus Level"
                        >
                          {FOCUS_LEVELS.map((level) => (
                            <MenuItem key={level.value} value={level.value}>
                              {level.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Button
                        onClick={() => removeFocusSlot(index)}
                        color="error"
                        size="small"
                        disabled={focusSlots.length === 1}
                      >
                        Remove
                      </Button>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Grid>
          )}

          {settingType === 'availability_slots' && (
            <Grid item xs={12}>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle1">Availability Slots</Typography>
                  <Button onClick={addAvailabilitySlot} size="small">
                    Add Slot
                  </Button>
                </Box>
                <Stack spacing={2}>
                  {availabilitySlots.map((slot, index) => (
                    <Box key={index} display="flex" gap={2} alignItems="center">
                      <TextField
                        type="time"
                        label="Start Time"
                        value={slot.start_time}
                        onChange={(e) =>
                          updateAvailabilitySlot(index, 'start_time', e.target.value)
                        }
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        type="time"
                        label="End Time"
                        value={slot.end_time}
                        onChange={(e) => updateAvailabilitySlot(index, 'end_time', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                      <FormControl sx={{ minWidth: 120 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={slot.status}
                          onChange={(e) => updateAvailabilitySlot(index, 'status', e.target.value)}
                          label="Status"
                        >
                          {AVAILABILITY_STATUSES.map((status) => (
                            <MenuItem key={status.value} value={status.value}>
                              {status.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Button
                        onClick={() => removeAvailabilitySlot(index)}
                        color="error"
                        size="small"
                        disabled={availabilitySlots.length === 1}
                      >
                        Remove
                      </Button>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Grid>
          )}

          {/* Actions */}
          <Grid item xs={12}>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button onClick={onCancel} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} variant="contained" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  )
}
