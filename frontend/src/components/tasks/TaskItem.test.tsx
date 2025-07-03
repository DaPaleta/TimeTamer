import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TaskItem from './TaskItem';
import type { Task } from "../../api/tasks";


const mockTask: Task & { duration: string } = {
  task_id: 'task-1',
  title: 'Complete project proposal',
  estimated_duration_minutes: 120,
  priority: 'high',
  description: 'Finish the quarterly project proposal',
  user_id: 'user-1',
  status: 'todo',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  duration: '02:00:00'
};

const mockTaskWithoutOptional: Task & { duration: string } = {
  task_id: 'task-2',
  title: 'Simple task',
  estimated_duration_minutes: 60,
  user_id: 'user-2',
  status: 'todo',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  duration: '01:00:00',
  priority: 'low'
};

describe('TaskItem Component', () => {
  describe('Rendering', () => {
    it('renders task with all properties', () => {
      render(<TaskItem task={mockTask} />);
      
      expect(screen.getByText('Complete project proposal')).toBeInTheDocument();
      expect(screen.getByText('Finish the quarterly project proposal')).toBeInTheDocument();
      expect(screen.getByText('02:00:00')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
    });

    it('renders task without optional properties', () => {
      render(<TaskItem task={mockTaskWithoutOptional} />);
      
      expect(screen.getByText('Simple task')).toBeInTheDocument();
      expect(screen.getByText('01:00:00')).toBeInTheDocument();
      expect(screen.queryByText('description')).not.toBeInTheDocument();
      expect(screen.queryByText(/priority/i)).not.toBeInTheDocument();
    });

    it('renders task without duration', () => {
      const taskWithoutDuration: Task & { duration: string } = {
        task_id: 'task-3',
        title: 'Task without dura tion',
        estimated_duration_minutes: 0,
        user_id: 'user-3',
        status: 'todo',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        duration: '00:00:00',
        priority: 'low'
      };
      
      render(<TaskItem task={{ ...taskWithoutDuration, duration: '00:00:00' }} />);
      
      expect(screen.getByText('Task without dura tion')).toBeInTheDocument();
      expect(screen.queryByText(/duration/i)).not.toBeInTheDocument();
    });
  });

  describe('Data Attributes', () => {
    it('has correct data attributes for dragging', () => {
      render(<TaskItem task={mockTask} />);
      
      const taskItem = screen.getByTestId('task-item');
      expect(taskItem).toHaveAttribute('data-title', 'Complete project proposal');
      expect(taskItem).toHaveAttribute('data-duration', '02:00:00');
      expect(taskItem).toHaveAttribute('data-task-id', 'task-1');
      expect(taskItem).toHaveAttribute('draggable', 'true');
    });

    it('has correct data attributes without optional properties', () => {
      render(<TaskItem task={mockTaskWithoutOptional} />);
      
      const taskItem = screen.getByTestId('task-item');
      expect(taskItem).toHaveAttribute('data-title', 'Simple task');
      expect(taskItem).toHaveAttribute('data-duration', '01:00:00');
      expect(taskItem).toHaveAttribute('data-task-id', 'task-2');
      expect(taskItem).toHaveAttribute('draggable', 'true');
    });
  });

  describe('Priority Badge', () => {
    it('displays priority badge with correct color for urgent', () => {
      const urgentTask: Task & { duration: string } = {
        ...mockTask,
        priority: 'urgent',
        duration: '02:00:00'
      };
      
      render(<TaskItem task={urgentTask} />);
      
      const badge = screen.getByText('urgent');
      expect(badge).toHaveStyle({ backgroundColor: '#f44336' });
    });

    it('displays priority badge with correct color for high', () => {
      render(<TaskItem task={mockTask} />);
      
      const badge = screen.getByText('high');
      expect(badge).toHaveStyle({ backgroundColor: '#ff9800' });
    });

    it('displays priority badge with correct color for medium', () => {
      const mediumTask: Task & { duration: string } = {
        ...mockTask,
        priority: 'medium',
        duration: '02:00:00'
      };
      
      render(<TaskItem task={mediumTask} />);
      
      const badge = screen.getByText('medium');
      expect(badge).toHaveStyle({ backgroundColor: '#ffc107' });
    });

    it('displays priority badge with correct color for low', () => {
      const lowTask: Task & { duration: string } = {
        ...mockTask,
        priority: 'low',
        duration: '02:00:00'
      };
      
      render(<TaskItem task={lowTask} />);
      
      const badge = screen.getByText('low');
      expect(badge).toHaveStyle({ backgroundColor: '#4caf50' });
    });

    it('displays priority badge with default color for unknown priority', () => {
      const unknownTask: Task & { duration: string } = {
        ...mockTask,
        priority: 'unknown' as 'urgent' | 'high' | 'medium' | 'low',
        duration: '02:00:00'
      };
      
      render(<TaskItem task={unknownTask} />);
      
      const badge = screen.getByText('unknown');
      expect(badge).toHaveStyle({ backgroundColor: '#9e9e9e' });
    });

    it('does not display priority badge when priority is not provided', () => {
      render(<TaskItem task={mockTaskWithoutOptional} />);
      
      expect(screen.queryByText(/priority/i)).not.toBeInTheDocument();
    });
  });

  describe('Description', () => {
    it('displays description when provided', () => {
      render(<TaskItem task={mockTask} />);
      
      expect(screen.getByText('Finish the quarterly project proposal')).toBeInTheDocument();
    });

    it('does not display description when not provided', () => {
      render(<TaskItem task={mockTaskWithoutOptional} />);
      
      expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
    });
  });

  describe('Duration', () => {
    it('displays duration when provided', () => {
      render(<TaskItem task={mockTask} />);
      
      expect(screen.getByText('02:00:00')).toBeInTheDocument();
    });

    it('does not display duration when not provided', () => {
      const taskWithoutDuration: Task & { duration?: string } = {
        task_id: 'task-3',
        title: 'Task without dura tion',
        estimated_duration_minutes: 0,
        user_id: 'user-3',
        status: 'todo',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        duration: '00:00:00',
        priority: 'low'
      };
      
      render(<TaskItem task={{ ...taskWithoutDuration, duration: '00:00:00' }} />);
      
      expect(screen.queryByText(/duration/i)).not.toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('has correct CSS classes for styling', () => {
      render(<TaskItem task={mockTask} />);
      
      const taskItem = screen.getByTestId('task-item');
      expect(taskItem).toHaveClass('task-item');
      
      const taskContent = screen.getByTestId('task-content');
      expect(taskContent).toHaveClass('task-content');
      
      const taskHeader = screen.getByTestId('task-header');
      expect(taskHeader).toHaveClass('task-header');
      
      const taskFooter = screen.getByTestId('task-footer');
      expect(taskFooter).toHaveClass('task-footer');
    });
  });
}); 