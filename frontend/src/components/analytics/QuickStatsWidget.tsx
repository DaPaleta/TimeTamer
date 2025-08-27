import React from 'react'
import { Card, CardContent, Typography, Box, Alert } from '@mui/material'
import { useQuickStats } from '../../hooks/useAnalytics'
import { QuickStatsSkeleton } from '../common/SkeletonLoader'

const numberFmt = (n: number) => new Intl.NumberFormat().format(n)

export const QuickStatsWidget: React.FC<{ dateRange?: string }> = ({ dateRange = '7d' }) => {
  const { data, isLoading: loading, error } = useQuickStats(dateRange)

  if (loading) return <QuickStatsSkeleton />
  if (error)
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error instanceof Error ? error.message : 'Failed to load quick stats'}
      </Alert>
    )
  if (!data) return null

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Quick Stats
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' },
            gap: 2,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary" gutterBottom>
              {numberFmt(data.total_scheduled_minutes)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Scheduled (min)
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary" gutterBottom>
              {numberFmt(data.completed_tasks_count)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completed Tasks
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary" gutterBottom>
              {Math.round(data.focus_time_utilization * 100)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Focus Utilization
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary" gutterBottom>
              {data.top_category ? numberFmt(data.top_category.minutes) : '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {data.top_category ? data.top_category.name : 'Top Category'}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary" gutterBottom>
              {numberFmt(data.streak_days_completed)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Day Streak
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default QuickStatsWidget
