import React, { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Box,
  Chip,
  Stack,
  Skeleton,
  Alert,
} from '@mui/material'
import { goalsApi, type IGoalProgress } from '../../api/goals'

interface GoalProgressProps {
  period?: string
  startDate?: string
}

const GoalProgress: React.FC<GoalProgressProps> = ({ period = 'weekly', startDate }) => {
  const [progress, setProgress] = useState<IGoalProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProgress = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await goalsApi.progress(period, startDate)
        setProgress(data)
      } catch (err: any) {
        setError(err?.message || 'Failed to load goal progress')
      } finally {
        setLoading(false)
      }
    }

    loadProgress()
  }, [period, startDate])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'ahead':
        return 'success'
      case 'on_track':
        return 'primary'
      case 'behind':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'ahead':
        return 'Ahead'
      case 'on_track':
        return 'On Track'
      case 'behind':
        return 'Behind'
      default:
        return status
    }
  }

  const getTargetTypeLabel = (type: string) => {
    switch (type) {
      case 'minutes':
        return 'min'
      case 'percentage_of_scheduled_time':
        return '%'
      case 'task_completion_count':
        return 'tasks'
      default:
        return type
    }
  }

  const formatPeriod = (period: { start: string; end: string }) => {
    const start = new Date(period.start).toLocaleDateString()
    const end = new Date(period.end).toLocaleDateString()
    return `${start} - ${end}`
  }

  if (loading) {
    return (
      <Stack spacing={2}>
        {[1, 2, 3].map((i) => (
          <Card key={i} variant="outlined">
            <CardContent>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="40%" height={20} />
              <Skeleton variant="rectangular" width="100%" height={8} sx={{ mt: 1 }} />
              <Box sx={{ mt: 1 }}>
                <Skeleton variant="rectangular" width={80} height={24} />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )
  }

  if (progress.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No active goals
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create goals to see your progress here
        </Typography>
      </Box>
    )
  }

  return (
    <Stack spacing={2}>
      {progress.map((goal) => (
        <Card key={goal.goal_id} variant="outlined">
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 2,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {goal.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatPeriod(goal.period)}
                </Typography>
              </Box>
              <Chip
                label={getStatusLabel(goal.status)}
                color={getStatusColor(goal.status) as any}
                size="small"
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {goal.achieved_value} / {goal.target_value} {getTargetTypeLabel(goal.target_type)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(goal.percent_complete, 100)}
                sx={{ height: 8, borderRadius: 4 }}
                color={goal.percent_complete >= 100 ? 'success' : 'primary'}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" color="primary">
                {Math.round(goal.percent_complete)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {goal.target_type === 'percentage_of_scheduled_time'
                  ? 'of scheduled time'
                  : 'complete'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Stack>
  )
}

export default GoalProgress
