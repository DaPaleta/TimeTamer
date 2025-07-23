import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import WorkIcon from '@mui/icons-material/Work'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import {
  fetchUserDaySettings,
  createUserDaySetting,
  updateUserDaySetting,
  deleteUserDaySetting,
  type UserDaySetting,
  type UserDaySettingCreate,
  type UserDaySettingUpdate,
  type RecurrencePattern,
} from '../../api/calendar'
import { RecurringPatternForm } from '../../components/settings/RecurringPatternForm'
import { useCalendarContext } from '../../context/CalendarContext'

const DayContextSettingsPage: React.FC = () => {
  const { invalidateCalendarCache } = useCalendarContext()
  const [settings, setSettings] = useState<UserDaySetting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSetting, setEditingSetting] = useState<UserDaySetting | null>(null)
  const [saving, setSaving] = useState(false)

  const loadSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchUserDaySettings()
      setSettings(data)
    } catch (err) {
      setError('Failed to load day context settings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleAdd = () => {
    setEditingSetting(null)
    setDialogOpen(true)
  }

  const handleEdit = (setting: UserDaySetting) => {
    setEditingSetting(setting)
    setDialogOpen(true)
  }

  const handleDelete = async (settingId: string) => {
    setError(null)
    try {
      await deleteUserDaySetting(settingId)
      loadSettings()
      // Invalidate calendar cache since day context settings have changed
      invalidateCalendarCache()
    } catch (err) {
      setError('Failed to delete setting.')
    }
  }

  const handleSave = async (settingData: UserDaySettingCreate | UserDaySettingUpdate) => {
    setSaving(true)
    setError(null)
    try {
      if (editingSetting) {
        await updateUserDaySetting(editingSetting.setting_id, settingData as UserDaySettingUpdate)
      } else {
        await createUserDaySetting(settingData as UserDaySettingCreate)
      }
      setDialogOpen(false)
      loadSettings()
      // Invalidate calendar cache since day context settings have changed
      invalidateCalendarCache()
    } catch (err) {
      setError('Failed to save setting.')
    } finally {
      setSaving(false)
    }
  }

  const getSettingIcon = (settingType: string) => {
    switch (settingType) {
      case 'work_environment':
        return <WorkIcon />
      case 'focus_slots':
        return <AccessTimeIcon />
      case 'availability_slots':
        return <EventAvailableIcon />
      default:
        return <WorkIcon />
    }
  }

  const getSettingTypeLabel = (settingType: string) => {
    switch (settingType) {
      case 'work_environment':
        return 'Work Environment'
      case 'focus_slots':
        return 'Focus Times'
      case 'availability_slots':
        return 'Availability'
      default:
        return settingType
    }
  }

  const getPatternDescription = (pattern: RecurrencePattern) => {
    switch (pattern.pattern_type) {
      case 'daily':
        return `Every ${pattern.interval} day(s)`
      case 'weekly':
        const days = pattern.days_of_week
          .map((d) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d])
          .join(', ')
        return `Every ${pattern.interval} week(s) on ${days}`
      case 'monthly':
        return `Every ${pattern.interval} month(s)`
      case 'custom':
        const customDays = pattern.days_of_week
          .map((d) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d])
          .join(', ')
        return `Custom: ${customDays}`
      default:
        return 'Unknown pattern'
    }
  }

  const getValueDescription = (setting: UserDaySetting) => {
    switch (setting.setting_type) {
      case 'work_environment':
        return `Work from ${(setting.value as any).work_environment}`
      case 'focus_slots':
        const slots = (setting.value as any).focus_slots
        return `${slots.length} focus slot(s)`
      case 'availability_slots':
        const availSlots = (setting.value as any).availability_slots
        return `${availSlots.length} availability slot(s)`
      default:
        return 'Unknown setting'
    }
  }

  const workEnvironmentSettings = settings.filter((s) => s.setting_type === 'work_environment')
  const focusSettings = settings.filter((s) => s.setting_type === 'focus_slots')
  const availabilitySettings = settings.filter((s) => s.setting_type === 'availability_slots')

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box maxWidth="lg" mx="auto" mt={4} p={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Day Context Settings</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Pattern
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Work Environment Section */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <WorkIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Work Environment</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Configure recurring work environment patterns
              </Typography>

              {workEnvironmentSettings.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No work environment patterns configured
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {workEnvironmentSettings.map((setting) => (
                    <Card key={setting.setting_id} variant="outlined" sx={{ p: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {getValueDescription(setting)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getPatternDescription(setting.recurrence_pattern)}
                      </Typography>
                      <Box display="flex" justifyContent="flex-end" mt={1}>
                        <IconButton size="small" onClick={() => handleEdit(setting)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(setting.setting_id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Card>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Focus Times Section */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AccessTimeIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Focus Times</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Configure recurring focus time patterns
              </Typography>

              {focusSettings.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No focus time patterns configured
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {focusSettings.map((setting) => (
                    <Card key={setting.setting_id} variant="outlined" sx={{ p: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {getValueDescription(setting)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getPatternDescription(setting.recurrence_pattern)}
                      </Typography>
                      <Box display="flex" justifyContent="flex-end" mt={1}>
                        <IconButton size="small" onClick={() => handleEdit(setting)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(setting.setting_id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Card>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Availability Section */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <EventAvailableIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Availability</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Configure recurring availability patterns
              </Typography>

              {availabilitySettings.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No availability patterns configured
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {availabilitySettings.map((setting) => (
                    <Card key={setting.setting_id} variant="outlined" sx={{ p: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {getValueDescription(setting)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getPatternDescription(setting.recurrence_pattern)}
                      </Typography>
                      <Box display="flex" justifyContent="flex-end" mt={1}>
                        <IconButton size="small" onClick={() => handleEdit(setting)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(setting.setting_id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Card>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pattern Configuration Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingSetting ? 'Edit Pattern' : 'Add New Pattern'}</DialogTitle>
        <DialogContent>
          <RecurringPatternForm
            initialData={editingSetting}
            onSave={handleSave}
            onCancel={() => setDialogOpen(false)}
            saving={saving}
          />
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default DayContextSettingsPage
