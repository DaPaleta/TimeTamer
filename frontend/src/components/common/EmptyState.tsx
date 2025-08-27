import React from 'react'
import { Box, Card, CardContent, Typography, Button } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import AssignmentIcon from '@mui/icons-material/Assignment'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'

interface EmptyStateProps {
  variant?: 'goals' | 'tasks' | 'analytics' | 'calendar' | 'search' | 'custom'
  title?: string
  description?: string
  icon?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
  showAction?: boolean
  size?: 'small' | 'medium' | 'large'
}

const getDefaultContent = (variant: string) => {
  switch (variant) {
    case 'goals':
      return {
        title: 'No Goals Yet',
        description: 'Start setting productivity goals to track your progress and stay motivated.',
        icon: <EmojiEventsIcon sx={{ fontSize: 64, color: 'primary.main' }} />,
        actionLabel: 'Create Your First Goal',
        showAction: true,
      }
    case 'tasks':
      return {
        title: 'No Tasks Found',
        description:
          'Create your first task to start organizing your work and boosting productivity.',
        icon: <AssignmentIcon sx={{ fontSize: 64, color: 'primary.main' }} />,
        actionLabel: 'Add New Task',
        showAction: true,
      }
    case 'analytics':
      return {
        title: 'No Data Available',
        description: 'Complete some tasks and schedule time to see your productivity analytics.',
        icon: <TrendingUpIcon sx={{ fontSize: 64, color: 'primary.main' }} />,
        actionLabel: 'View Tasks',
        showAction: true,
      }
    case 'calendar':
      return {
        title: 'Calendar is Empty',
        description: 'Schedule tasks and events to see them appear in your calendar view.',
        icon: <CalendarTodayIcon sx={{ fontSize: 64, color: 'primary.main' }} />,
        actionLabel: 'Schedule Tasks',
        showAction: true,
      }
    case 'search':
      return {
        title: 'No Results Found',
        description: "Try adjusting your search terms or filters to find what you're looking for.",
        icon: <SearchIcon sx={{ fontSize: 64, color: 'text.secondary' }} />,
        actionLabel: 'Clear Filters',
        showAction: true,
      }
    default:
      return {
        title: 'Nothing Here',
        description: 'This area is empty. Add some content to get started.',
        icon: <AddIcon sx={{ fontSize: 64, color: 'text.secondary' }} />,
        actionLabel: 'Get Started',
        showAction: true,
      }
  }
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'custom',
  title,
  description,
  icon,
  actionLabel,
  onAction,
  showAction = true,
  size = 'medium',
}) => {
  const defaultContent = getDefaultContent(variant)

  const finalTitle = title || defaultContent.title
  const finalDescription = description || defaultContent.description
  const finalIcon = icon || defaultContent.icon
  const finalActionLabel = actionLabel || defaultContent.actionLabel
  const finalShowAction = showAction && defaultContent.showAction

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          py: 2,
          iconSize: 48,
          titleVariant: 'h6' as const,
          descriptionVariant: 'body2' as const,
        }
      case 'large':
        return {
          py: 6,
          iconSize: 96,
          titleVariant: 'h4' as const,
          descriptionVariant: 'body1' as const,
        }
      default:
        return {
          py: 4,
          iconSize: 64,
          titleVariant: 'h5' as const,
          descriptionVariant: 'body1' as const,
        }
    }
  }

  const sizeStyles = getSizeStyles()

  return (
    <Card>
      <CardContent sx={{ textAlign: 'center', py: sizeStyles.py }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ fontSize: sizeStyles.iconSize, color: 'primary.main' }}>{finalIcon}</Box>
        </Box>

        <Typography variant={sizeStyles.titleVariant} gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
          {finalTitle}
        </Typography>

        <Typography
          variant={sizeStyles.descriptionVariant}
          color="text.secondary"
          sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}
        >
          {finalDescription}
        </Typography>

        {finalShowAction && onAction && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAction}
            size={size === 'small' ? 'small' : 'medium'}
          >
            {finalActionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Specialized empty state components
export const GoalsEmptyState: React.FC<{ onCreateGoal: () => void }> = ({ onCreateGoal }) => (
  <EmptyState variant="goals" onAction={onCreateGoal} />
)

export const TasksEmptyState: React.FC<{ onAddTask: () => void }> = ({ onAddTask }) => (
  <EmptyState variant="tasks" onAction={onAddTask} />
)

export const AnalyticsEmptyState: React.FC<{ onViewTasks: () => void }> = ({ onViewTasks }) => (
  <EmptyState variant="analytics" onAction={onViewTasks} />
)

export const SearchEmptyState: React.FC<{ onClearFilters: () => void }> = ({ onClearFilters }) => (
  <EmptyState variant="search" onAction={onClearFilters} />
)
