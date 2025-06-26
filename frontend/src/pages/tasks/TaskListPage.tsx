import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  InputAdornment,
  CircularProgress,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { TaskCard } from '../../components/tasks/TaskCard';
import NewTaskDialog from '../../components/tasks/NewTaskDialog';
import { fetchTasks, deleteTask, fetchCategories } from '../../api/tasks';
import type { Task, Category, FetchTasksParams } from '../../api/tasks';

const PAGE_SIZE = 9;

type SortOption = 'deadline' | 'priority' | 'status';
type StatusOption = 'all' | 'todo' | 'in_progress' | 'completed' | 'blocked';

type FilterOption = StatusOption;

type PriorityOption = 'all' | 'low' | 'medium' | 'high' | 'urgent';

export const TaskListPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('deadline');
  const [sortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityOption>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchTaskList(1);
    }, 400);
    return () => clearTimeout(handler);
    // eslint-disable-next-line
  }, [searchQuery]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    fetchTaskList(page);
    // eslint-disable-next-line
  }, [sortBy, sortOrder, filterBy, priorityFilter, categoryFilter, page]);

  const fetchTaskList = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);
    const params: FetchTasksParams = {
      page: pageNum,
      limit: PAGE_SIZE,
      sort_by: sortBy,
      sort_order: sortOrder,
      search: searchQuery || undefined,
    };
    if (filterBy !== 'all') params.status = filterBy;
    if (priorityFilter !== 'all') params.priority = priorityFilter;
    if (categoryFilter !== 'all') params.category_id = categoryFilter;
    try {
      const res = await fetchTasks(params);
      console.debug("Fetched tasks:", res)
      setTasks(res.tasks || []);
      setTotal(res.total ?? res.tasks.length ?? 0);
    } catch {
      setError('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder, filterBy, priorityFilter, categoryFilter, searchQuery]);

  const handleCreateTask = () => {
    setEditTask(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditTask(null);
  };

  const handleTaskCreated = () => {
    setDialogOpen(false);
    setEditTask(null);
    fetchTaskList(page);
  };

  const handleTaskUpdated = () => {
    setDialogOpen(false);
    setEditTask(null);
    fetchTaskList(page);
  };

  const handleEditTask = (taskId: string) => {
    const task = tasks.find((t) => t.task_id === taskId);
    if (task) {
      setEditTask(task);
      setDialogOpen(true);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setDeleteTaskId(taskId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!deleteTaskId) return;
    setLoading(true);
    try {
      await deleteTask(deleteTaskId);
      setDeleteDialogOpen(false);
      setDeleteTaskId(null);
      fetchTaskList(page);
    } catch {
      setError('Failed to delete task.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
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
          <Grid size={{xs: 12, md: 4}}>
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
          <Grid size={{xs: 12, md: 2}}>
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
          <Grid size={{xs: 12, md: 2}}>
            <TextField
              select
              fullWidth
              variant="outlined"
              label="Status"
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="todo">To Do</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="blocked">Blocked</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{xs: 12, md: 2}}>
            <TextField
              select
              fullWidth
              variant="outlined"
              label="Priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as PriorityOption)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{xs: 12, md: 2}}>
            <TextField
              select
              fullWidth
              variant="outlined"
              label="Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.category_id} value={cat.category_id}>{cat.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Typography color="error">{error}</Typography>
        </Box>
      ) : tasks.length === 0 ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Typography variant="body1" color="text.secondary">
            No tasks found. Create a new task to get started.
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            {tasks.map((task) => (
              <Grid size={{xs: 12, md: 6, lg: 4}} key={task.task_id}>
                <TaskCard
                  task={{
                    id: task.task_id,
                    title: task.title,
                    description: task.description,
                    priority: task.priority,
                    status: task.status,
                    estimatedDuration: task.estimated_duration_minutes,
                    environment: (task.fitting_environments && task.fitting_environments[0]) as 'home' | 'office' | 'outdoors' | 'hybrid' || 'home',
                    deadline: task.deadline ? new Date(task.deadline) : undefined,
                    category: task.category
                      ? { name: task.category.name, color: task.category.color_hex }
                      : undefined,
                  }}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                />
              </Grid>
            ))}
          </Grid>
          <Box display="flex" justifyContent="center" mt={4}>
            <Pagination
              count={Math.ceil((total || 0) / PAGE_SIZE)}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </>
      )}

      <NewTaskDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onTaskCreated={handleTaskCreated}
        onTaskUpdated={handleTaskUpdated}
        task={editTask || undefined}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this task?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={confirmDeleteTask} color="error" disabled={loading} variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}; 