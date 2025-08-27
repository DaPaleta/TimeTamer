import React, { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Skeleton,
  Stack,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { goalsApi, type Goal, type GoalUpdate } from '../../api/goals'

interface GoalListProps {
  goals: Goal[]
  loading: boolean
  onGoalUpdated: () => void
  onGoalDeleted: () => void
}

const GoalList: React.FC<GoalListProps> = ({ goals, loading, onGoalUpdated, onGoalDeleted }) => {
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [editForm, setEditForm] = useState<GoalUpdate>({})
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setEditForm({
      name: goal.name,
      target_type: goal.target_type,
      target_value: goal.target_value,
      time_period: goal.time_period,
      is_active: goal.is_active,
    })
    setEditError(null)
  }

  const handleEditSubmit = async () => {
    if (!editingGoal) return

    setEditLoading(true)
    setEditError(null)

    try {
      await goalsApi.update(editingGoal.goal_id, editForm)
      setEditingGoal(null)
      setEditForm({})
      onGoalUpdated()
    } catch (error: any) {
      setEditError(error?.response?.data?.detail || 'Failed to update goal')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async (goalId: string) => {
    setDeleteLoading(true)
    try {
      await goalsApi.delete(goalId)
      setDeleteConfirm(null)
      onGoalDeleted()
    } catch (error: any) {
      console.error('Failed to delete goal:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  const getTargetTypeLabel = (type: string) => {
    switch (type) {
      case 'minutes':
        return 'Minutes'
      case 'percentage_of_scheduled_time':
        return '% of Time'
      case 'task_completion_count':
        return 'Tasks'
      default:
        return type
    }
  }

  const getTimePeriodLabel = (period: string) => {
    switch (period) {
      case 'daily':
        return 'Daily'
      case 'weekly':
        return 'Weekly'
      case 'monthly':
        return 'Monthly'
      default:
        return period
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'default'
  }

  if (loading) {
    return (
      <Stack spacing={2}>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="40%" height={20} />
              <Box sx={{ mt: 1 }}>
                <Skeleton variant="rectangular" width={100} height={32} />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    )
  }

  if (goals.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No goals yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create your first goal to start tracking your progress
        </Typography>
      </Box>
    )
  }

  return (
    <>
      <Stack spacing={2}>
        {goals.map((goal) => (
          <Card key={goal.goal_id} variant="outlined">
            <CardContent>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {goal.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Target: {goal.target_value} {getTargetTypeLabel(goal.target_type)} (
                    {getTimePeriodLabel(goal.time_period)})
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={goal.is_active ? 'Active' : 'Inactive'}
                      color={getStatusColor(goal.is_active)}
                      size="small"
                    />
                  </Box>
                </Box>
                <Box>
                  <IconButton size="small" onClick={() => handleEdit(goal)} aria-label="Edit goal">
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setDeleteConfirm(goal.goal_id)}
                    aria-label="Delete goal"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Edit Dialog */}
      <Dialog open={!!editingGoal} onClose={() => setEditingGoal(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Goal</DialogTitle>
        <DialogContent>
          {editError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {editError}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Goal Name"
              value={editForm.name || ''}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Target Type</InputLabel>
              <Select
                value={editForm.target_type || ''}
                onChange={(e) => setEditForm({ ...editForm, target_type: e.target.value as any })}
                label="Target Type"
              >
                <MenuItem value="minutes">Minutes</MenuItem>
                <MenuItem value="percentage_of_scheduled_time">% of Scheduled Time</MenuItem>
                <MenuItem value="task_completion_count">Tasks Completed</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Target Value"
              type="number"
              value={editForm.target_value || ''}
              onChange={(e) =>
                setEditForm({ ...editForm, target_value: parseInt(e.target.value, 10) || 0 })
              }
              fullWidth
              inputProps={{ min: 1 }}
            />

            <FormControl fullWidth>
              <InputLabel>Time Period</InputLabel>
              <Select
                value={editForm.time_period || ''}
                onChange={(e) => setEditForm({ ...editForm, time_period: e.target.value as any })}
                label="Time Period"
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingGoal(null)} disabled={editLoading}>
            Cancel
          </Button>
          <Button onClick={handleEditSubmit} variant="contained" disabled={editLoading}>
            {editLoading ? 'Updating...' : 'Update Goal'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Goal</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this goal? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            variant="contained"
            color="error"
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default GoalList
