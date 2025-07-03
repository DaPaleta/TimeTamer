import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CalendarPage } from './CalendarPage';
import { fetchTasks } from '../../api/tasks';
import type { Task } from '../../api/tasks';

// Mock the API
vi.mock('../../api/tasks', () => ({
  fetchTasks: vi.fn()
}));

// Mock the Calendar component
vi.mock('./Calendar', () => ({
  MyCalendar: () => <div data-testid="calendar">Calendar Component</div>
}));

// Mock ThirdPartyDraggable
vi.mock('@fullcalendar/interaction', () => ({
  ThirdPartyDraggable: vi.fn().mockImplementation(() => ({
    destroy: vi.fn()
  }))
}));

const mockTasks: Task[] = [
  {
    task_id: 'task-1',
    user_id: 'user-1',
    title: 'Complete project proposal',
    description: 'Finish the quarterly project proposal',
    category_id: 'cat-1',
    category: {
      category_id: 'cat-1',
      name: 'Work',
      color_hex: '#3B82F6'
    },
    priority: 'high',
    estimated_duration_minutes: 120,
    status: 'todo',
    fitting_environments: ['home'],
    requires_focus: false,
    requires_deep_work: false,
    can_be_interrupted: true,
    requires_meeting: false,
    is_endless: false,
    is_recurring: false,
    scheduled_slots: [],
    current_alerts: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    task_id: 'task-2',
    user_id: 'user-1',
    title: 'Buy groceries',
    description: 'Weekly grocery shopping',
    category_id: 'cat-2',
    category: {
      category_id: 'cat-2',
      name: 'Personal',
      color_hex: '#10B981'
    },
    priority: 'low',
    estimated_duration_minutes: 45,
    status: 'todo',
    fitting_environments: ['home'],
    requires_focus: false,
    requires_deep_work: false,
    can_be_interrupted: true,
    requires_meeting: false,
    is_endless: false,
    is_recurring: false,
    scheduled_slots: [],
    current_alerts: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    task_id: 'task-3',
    user_id: 'user-1',
    title: 'Completed task',
    description: 'This task is already done',
    category_id: 'cat-1',
    category: {
      category_id: 'cat-1',
      name: 'Work',
      color_hex: '#3B82F6'
    },
    priority: 'medium',
    estimated_duration_minutes: 60,
    status: 'completed',
    fitting_environments: ['home'],
    requires_focus: false,
    requires_deep_work: false,
    can_be_interrupted: true,
    requires_meeting: false,
    is_endless: false,
    is_recurring: false,
    scheduled_slots: [],
    current_alerts: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

describe('CalendarPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading state initially', () => {
      vi.mocked(fetchTasks).mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<CalendarPage />);
      
      expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
      expect(screen.getByTestId('calendar')).toBeInTheDocument();
    });
  });

  describe('Successful Data Loading', () => {
    it('loads and displays tasks from server', async () => {
      vi.mocked(fetchTasks).mockResolvedValue({
        tasks: mockTasks,
        total: 3,
        page: 1,
        limit: 10
      });
      
      render(<CalendarPage />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
      });
      
      // Check that tasks are displayed
      expect(screen.getByText('Complete project proposal')).toBeInTheDocument();
      expect(screen.getByText('Buy groceries')).toBeInTheDocument();
      expect(screen.queryByText('Completed task')).not.toBeInTheDocument(); // Should be filtered out
      
      // Check categories
      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument();
      
      // Check priorities
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('low')).toBeInTheDocument();
    });

    it('groups tasks by category correctly', async () => {
      vi.mocked(fetchTasks).mockResolvedValue({
        tasks: mockTasks,
        total: 3,
        page: 1,
        limit: 10
      });
      
      render(<CalendarPage />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
      });
      
      // Check that tasks are grouped under their categories
      const workCategory = screen.getByText('Work').closest('.task-section');
      const personalCategory = screen.getByText('Personal').closest('.task-section');
      
      expect(workCategory).toBeInTheDocument();
      expect(personalCategory).toBeInTheDocument();
    });

    it('filters out completed and cancelled tasks', async () => {
      vi.mocked(fetchTasks).mockResolvedValue({
        tasks: mockTasks,
        total: 3,
        page: 1,
        limit: 10
      });
      
      render(<CalendarPage />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
      });
      
      // Should show active tasks
      expect(screen.getByText('Complete project proposal')).toBeInTheDocument();
      expect(screen.getByText('Buy groceries')).toBeInTheDocument();
      
      // Should not show completed tasks
      expect(screen.queryByText('Completed task')).not.toBeInTheDocument();
    });

    it('handles tasks without categories', async () => {
      const tasksWithoutCategory = [
        {
          ...mockTasks[0],
          category_id: undefined,
          category: undefined
        }
      ];
      
      vi.mocked(fetchTasks).mockResolvedValue({
        tasks: tasksWithoutCategory,
        total: 1,
        page: 1,
        limit: 10
      });
      
      render(<CalendarPage />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
      });
      
      expect(screen.getByText('Uncategorized')).toBeInTheDocument();
      expect(screen.getByText('Complete project proposal')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles network errors', async () => {
      vi.mocked(fetchTasks).mockRejectedValue(new Error('Network Error'));
      
      render(<CalendarPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Unable to connect to server. Please check your connection.')).toBeInTheDocument();
      });
    });

    it('handles authentication errors', async () => {
      const authError = new Error('Request failed with status code 401');
      vi.mocked(fetchTasks).mockRejectedValue(authError);
      
      render(<CalendarPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Authentication required. Please log in again.')).toBeInTheDocument();
      });
    });

    it('handles permission errors', async () => {
      const permissionError = new Error('Request failed with status code 403');
      vi.mocked(fetchTasks).mockRejectedValue(permissionError);
      
      render(<CalendarPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Access denied. You may not have permission to view tasks.')).toBeInTheDocument();
      });
    });

    it('handles server errors', async () => {
      const serverError = new Error('Request failed with status code 500');
      vi.mocked(fetchTasks).mockRejectedValue(serverError);
      
      render(<CalendarPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument();
      });
    });

    it('handles generic errors', async () => {
      vi.mocked(fetchTasks).mockRejectedValue(new Error('Unknown error'));
      
      render(<CalendarPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load tasks. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Duration Formatting', () => {
    it('formats duration correctly from minutes', async () => {
      const tasksWithDifferentDurations = [
        {
          ...mockTasks[0],
          estimated_duration_minutes: 90 // 1 hour 30 minutes
        },
        {
          ...mockTasks[1],
          estimated_duration_minutes: 30 // 30 minutes
        }
      ];
      
      vi.mocked(fetchTasks).mockResolvedValue({
        tasks: tasksWithDifferentDurations,
        total: 2,
        page: 1,
        limit: 10
      });
      
      render(<CalendarPage />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
      });
      
      expect(screen.getByText('01:30:00')).toBeInTheDocument();
      expect(screen.getByText('00:30:00')).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('renders calendar and task list side by side', async () => {
      vi.mocked(fetchTasks).mockResolvedValue({
        tasks: mockTasks,
        total: 3,
        page: 1,
        limit: 10
      });
      
      render(<CalendarPage />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
      });
      
      expect(screen.getByText('Calendar')).toBeInTheDocument();
      expect(screen.getByText('Tasks')).toBeInTheDocument();
      expect(screen.getByTestId('calendar')).toBeInTheDocument();
    });
  });
}); 