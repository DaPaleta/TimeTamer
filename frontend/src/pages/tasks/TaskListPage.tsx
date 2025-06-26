import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { TaskCard } from '../../components/tasks/TaskCard';
import NewTaskDialog from '../../components/tasks/NewTaskDialog';

type SortOption = 'deadline' | 'priority' | 'status';
type FilterOption = 'all' | 'todo' | 'in_progress' | 'completed' | 'blocked';

// Mock data - to be replaced with actual API data
const mockTasks = [
  {
    id: '1',
    title: 'Complete Project Proposal',
    description: 'Draft and finalize the Q2 project proposal for client review',
    priority: 'high',
    status: 'in_progress',
    estimatedDuration: 120,
    environment: 'office',
    deadline: new Date('2024-06-01'),
    category: {
      name: 'Work',
      color: '#3B82F6',
    },
  },
  {
    id: '2',
    title: 'Weekly Team Meeting',
    description: 'Review sprint progress and discuss blockers',
    priority: 'medium',
    status: 'todo',
    estimatedDuration: 60,
    environment: 'hybrid',
    deadline: new Date('2024-05-30'),
    category: {
      name: 'Meetings',
      color: '#8B5CF6',
    },
  },
  // Add more mock tasks as needed
] as const;

export const TaskListPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('deadline');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreateTask = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleTaskCreated = (task: unknown) => {
    console.log('Task created:', task);
    setDialogOpen(false);
    // Optionally, refresh the task list here
  };

  const handleEditTask = (taskId: string) => {
    // To be implemented - show task edit modal
    console.log('Edit task:', taskId);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4" component="h1">
            Tasks
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateTask}
          >
            Create Task
          </Button>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 6}}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3}}>
            <TextField
              select
              fullWidth
              variant="outlined"
              label="Sort by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <MenuItem value="deadline">Deadline</MenuItem>
              <MenuItem value="priority">Priority</MenuItem>
              <MenuItem value="status">Status</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 3}}>
            <TextField
              select
              fullWidth
              variant="outlined"
              label="Filter by"
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            >
              <MenuItem value="all">All Tasks</MenuItem>
              <MenuItem value="todo">To Do</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="blocked">Blocked</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={2}>
        {mockTasks.map((task) => (
          <Grid size={{ xs: 12, md: 6, lg: 4}} key={task.id}>
            <TaskCard task={task} onEdit={handleEditTask} />
          </Grid>
        ))}
      </Grid>

      {mockTasks.length === 0 && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <Typography variant="body1" color="text.secondary">
            No tasks found. Create a new task to get started.
          </Typography>
        </Box>
      )}

      <NewTaskDialog open={dialogOpen} onClose={handleDialogClose} onTaskCreated={handleTaskCreated} />
    </Container>
  );
}; 