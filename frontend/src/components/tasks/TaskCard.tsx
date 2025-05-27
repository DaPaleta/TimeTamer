import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditIcon from '@mui/icons-material/Edit';
import { format } from 'date-fns';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
    estimatedDuration: number; // in minutes
    environment: 'home' | 'office' | 'outdoors' | 'hybrid';
    deadline?: Date;
    category?: {
      name: string;
      color: string;
    };
  };
  onEdit?: (id: string) => void;
}

const priorityColors = {
  low: '#60A5FA',
  medium: '#F59E0B',
  high: '#EF4444',
  urgent: '#DC2626',
};

const statusLabels = {
  todo: 'To Do',
  in_progress: 'In Progress',
  completed: 'Completed',
  blocked: 'Blocked',
  cancelled: 'Cancelled',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit }) => {
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0
      ? `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`
      : `${minutes}m`;
  };

  return (
    <Card
      sx={{
        position: 'relative',
        '&:hover': {
          boxShadow: 2,
        },
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="h6" component="h3" gutterBottom>
            {task.title}
          </Typography>
          {onEdit && (
            <Tooltip title="Edit task">
              <IconButton
                size="small"
                onClick={() => onEdit(task.id)}
                sx={{ ml: 1 }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {task.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
            component="p"
          >
            {task.description}
          </Typography>
        )}

        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
          <Chip
            label={statusLabels[task.status]}
            size="small"
            color={task.status === 'completed' ? 'success' : 'default'}
          />
          <Chip
            label={task.priority}
            size="small"
            sx={{
              bgcolor: priorityColors[task.priority] + '20',
              color: priorityColors[task.priority],
              borderColor: priorityColors[task.priority],
            }}
            variant="outlined"
          />
          {task.category && (
            <Chip
              label={task.category.name}
              size="small"
              sx={{
                bgcolor: task.category.color + '20',
                color: task.category.color,
                borderColor: task.category.color,
              }}
              variant="outlined"
            />
          )}
        </Box>

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={1}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Box display="flex" alignItems="center">
              <AccessTimeIcon
                fontSize="small"
                sx={{ mr: 0.5, color: 'text.secondary' }}
              />
              <Typography variant="body2" color="text.secondary">
                {formatDuration(task.estimatedDuration)}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <LocationOnIcon
                fontSize="small"
                sx={{ mr: 0.5, color: 'text.secondary' }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                {task.environment}
              </Typography>
            </Box>
          </Box>

          {task.deadline && (
            <Typography variant="body2" color="text.secondary">
              Due {format(task.deadline, 'MMM d, yyyy')}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}; 