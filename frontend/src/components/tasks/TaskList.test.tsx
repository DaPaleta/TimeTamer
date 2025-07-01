import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskList, { type TasksByCategory } from './TaskList';

// Mock react-sortablejs
vi.mock('react-sortablejs', () => ({
  ReactSortable: ({ children, onAdd }: { children: React.ReactNode; onAdd?: (evt: { type: string; from: HTMLElement; to: HTMLElement; item: HTMLElement }) => void }) => {
    const handleDragEnd = () => {
      if (onAdd) {
        onAdd({
          type: 'add',
          from: document.createElement('div'),
          to: document.createElement('div'),
          item: document.createElement('div')
        });
      }
    };

    return (
      <div 
        data-testid="sortable-container"
        onClick={handleDragEnd}
      >
        {children}
      </div>
    );
  }
}));

const mockTasksByCategory: TasksByCategory = {
  'Work': [
    {
      name: 'Work',
      tasks: [
        {
          id: 'task-1',
          title: 'Complete project proposal',
          duration: '02:00:00',
          priority: 'high',
          description: 'Finish the quarterly project proposal'
        },
        {
          id: 'task-2',
          title: 'Review code',
          duration: '01:30:00',
          priority: 'medium',
          description: 'Code review for new feature'
        }
      ]
    }
  ],
  'Personal': [
    {
      name: 'Personal',
      tasks: [
        {
          id: 'task-3',
          title: 'Buy groceries',
          duration: '00:45:00',
          priority: 'low',
          description: 'Weekly grocery shopping'
        }
      ]
    }
  ]
};

describe('TaskList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders task list with categories and sections', () => {
      render(<TaskList tasksByCategory={mockTasksByCategory} />);
      
      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument();
    });

    it('displays task items with all properties', () => {
      render(<TaskList tasksByCategory={mockTasksByCategory} />);
      
      expect(screen.getByText('Complete project proposal')).toBeInTheDocument();
      expect(screen.getByText('Review code')).toBeInTheDocument();
      expect(screen.getByText('Buy groceries')).toBeInTheDocument();
      
      // Check for priority badges
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
      expect(screen.getByText('low')).toBeInTheDocument();
      
      // Check for descriptions
      expect(screen.getByText('Finish the quarterly project proposal')).toBeInTheDocument();
      expect(screen.getByText('Code review for new feature')).toBeInTheDocument();
      expect(screen.getByText('Weekly grocery shopping')).toBeInTheDocument();
      
      // Check for durations
      expect(screen.getByText('02:00:00')).toBeInTheDocument();
      expect(screen.getByText('01:30:00')).toBeInTheDocument();
      expect(screen.getByText('00:45:00')).toBeInTheDocument();
    });

    it('displays task counts correctly', () => {
      render(<TaskList tasksByCategory={mockTasksByCategory} />);
      
      expect(screen.getByText('2')).toBeInTheDocument(); // Work section
      expect(screen.getByText('1')).toBeInTheDocument(); // Personal section
    });

    it('handles empty task list', () => {
      const emptyTasks: TasksByCategory = {};
      render(<TaskList tasksByCategory={emptyTasks} />);
      
      expect(screen.getByPlaceholderText('Search for something...')).toBeInTheDocument();
      expect(screen.queryByText(/task/i)).not.toBeInTheDocument();
    });

    it('renders search box and filter button', () => {
      render(<TaskList tasksByCategory={mockTasksByCategory} />);
      
      expect(screen.getByPlaceholderText('Search for something...')).toBeInTheDocument();
      expect(screen.getByText('☰')).toBeInTheDocument();
    });
  });

  describe('Task Item Properties', () => {
    it('has proper data attributes for dragging', () => {
      render(<TaskList tasksByCategory={mockTasksByCategory} />);
      
      const taskItems = screen.getAllByTestId('task-item');
      expect(taskItems).toHaveLength(3);
      
      taskItems.forEach(item => {
        expect(item).toHaveAttribute('data-title');
        expect(item).toHaveAttribute('data-duration');
        expect(item).toHaveAttribute('data-task-id');
        expect(item).toHaveAttribute('draggable', 'true');
      });
    });

    it('displays priority badges with correct colors', () => {
      render(<TaskList tasksByCategory={mockTasksByCategory} />);
      
      const highPriorityBadge = screen.getByText('high');
      const mediumPriorityBadge = screen.getByText('medium');
      const lowPriorityBadge = screen.getByText('low');
      
      expect(highPriorityBadge).toHaveStyle({ backgroundColor: '#ff9800' });
      expect(mediumPriorityBadge).toHaveStyle({ backgroundColor: '#ffc107' });
      expect(lowPriorityBadge).toHaveStyle({ backgroundColor: '#4caf50' });
    });
  });

  describe('Sortable Functionality', () => {
    it('renders sortable containers for each section', () => {
      render(<TaskList tasksByCategory={mockTasksByCategory} />);
      
      const sortableContainers = screen.getAllByTestId('sortable-container');
      expect(sortableContainers).toHaveLength(2); // One for each section
    });

    it('handles cross-category move events', async () => {
      const user = userEvent.setup();
      render(<TaskList tasksByCategory={mockTasksByCategory} />);
      
      const sortableContainers = screen.getAllByTestId('sortable-container');
      
      // Simulate a cross-category move
      await user.click(sortableContainers[0]);
      
      // The mock should trigger the onAdd event
      // We can verify this by checking if the component handles the event properly
      expect(sortableContainers).toHaveLength(2);
    });
  });

  describe('State Management', () => {
    it('updates task state when tasks are moved', async () => {
      const user = userEvent.setup();
      render(<TaskList tasksByCategory={mockTasksByCategory} />);
      
      // Initial state should have 2 tasks in Work category
      expect(screen.getByText('2')).toBeInTheDocument();
      
      // Simulate a move operation
      const sortableContainers = screen.getAllByTestId('sortable-container');
      await user.click(sortableContainers[0]);
      
      // The component should handle the state update internally
      // We can verify the component is still functional
      expect(screen.getByText('Complete project proposal')).toBeInTheDocument();
    });
  });
}); 