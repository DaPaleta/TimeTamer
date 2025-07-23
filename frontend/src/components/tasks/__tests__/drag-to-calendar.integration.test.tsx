import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { CalendarPage } from '../../../pages/calendar/CalendarPage'
import { fetchTasks } from '../../../api/tasks'
import type { Task } from '../../../api/tasks'

// Mock the API
vi.mock('../../../api/tasks', () => ({
  fetchTasks: vi.fn(),
}))

// Mock the Calendar component
vi.mock('../../../pages/calendar/Calendar', () => ({
  MyCalendar: () => (
    <div data-testid="calendar" data-droppable="true">
      Calendar Component
    </div>
  ),
}))

// Fix for Vitest hoisting: define mocks inside the factory and expose them via __mocks
vi.mock('@fullcalendar/interaction', () => {
  const mockDestroy = vi.fn()
  const mockThirdPartyDraggable = vi.fn().mockImplementation(() => ({
    destroy: mockDestroy,
  }))
  return {
    ThirdPartyDraggable: mockThirdPartyDraggable,
    __mocks: { mockDestroy, mockThirdPartyDraggable },
  }
})

// Import the mocks from the module
import * as fullcalendarInteraction from '@fullcalendar/interaction'
const { mockDestroy, mockThirdPartyDraggable } = (fullcalendarInteraction as any).__mocks

const mockTasks: Task[] = [
  {
    task_id: 'task-1',
    user_id: 'user-1',
    title: 'Test Task',
    description: 'A test task for dragging',
    category_id: 'cat-1',
    category: {
      category_id: 'cat-1',
      name: 'Test Category',
      color_hex: '#3B82F6',
    },
    priority: 'high',
    estimated_duration_minutes: 60,
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
    updated_at: '2024-01-01T00:00:00Z',
  },
]

describe('Drag to Calendar Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchTasks).mockResolvedValue({
      tasks: mockTasks,
      total: 1,
      page: 1,
      limit: 10,
    })
  })

  describe('ThirdPartyDraggable Initialization', () => {
    it('initializes ThirdPartyDraggable when tasks are loaded', async () => {
      render(<CalendarPage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument()
      })

      // Check that ThirdPartyDraggable was initialized
      expect(mockThirdPartyDraggable).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          itemSelector: '.task-item',
          eventData: expect.any(Function),
        })
      )
    })

    it('does not initialize ThirdPartyDraggable when no tasks are loaded', async () => {
      vi.mocked(fetchTasks).mockResolvedValue({
        tasks: [],
        total: 0,
        page: 1,
        limit: 10,
      })

      render(<CalendarPage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument()
      })

      // Should not initialize ThirdPartyDraggable for empty task list
      expect(mockThirdPartyDraggable).not.toHaveBeenCalled()
    })

    it('re-initializes ThirdPartyDraggable when tasks change', async () => {
      const { unmount } = render(<CalendarPage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument()
      })

      // Should be called once initially
      expect(mockThirdPartyDraggable).toHaveBeenCalledTimes(1)

      // Clear mocks and rerender with new tasks
      vi.clearAllMocks()

      const newTasks = [
        {
          ...mockTasks[0],
          task_id: 'task-2',
          title: 'New Task',
        },
      ]

      vi.mocked(fetchTasks).mockResolvedValue({
        tasks: newTasks,
        total: 1,
        page: 1,
        limit: 10,
      })

      unmount()
      render(<CalendarPage />)

      await waitFor(() => {
        expect(screen.getByText('New Task')).toBeInTheDocument()
      })

      // Should be called again for new tasks
      expect(mockThirdPartyDraggable).toHaveBeenCalledTimes(1)
    })
  })

  describe('Event Data Extraction', () => {
    it('extracts correct event data from task elements', async () => {
      render(<CalendarPage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument()
      })

      // Get the eventData function that was passed to ThirdPartyDraggable
      const thirdPartyDraggableCall = mockThirdPartyDraggable.mock.calls[0]
      const eventDataFunction = thirdPartyDraggableCall[1].eventData

      // Create a mock task element
      const mockTaskElement = document.createElement('div')
      mockTaskElement.setAttribute('data-title', 'Test Task')
      mockTaskElement.setAttribute('data-duration', '01:00:00')
      mockTaskElement.setAttribute('data-task-id', 'task-1')

      // Call the eventData function
      const eventData = eventDataFunction(mockTaskElement)

      expect(eventData).toEqual({
        title: 'Test Task',
        duration: '01:00:00',
        taskId: 'task-1',
      })
    })

    it('handles missing data attributes gracefully', async () => {
      render(<CalendarPage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument()
      })

      const thirdPartyDraggableCall = mockThirdPartyDraggable.mock.calls[0]
      const eventDataFunction = thirdPartyDraggableCall[1].eventData

      // Create a mock task element with missing attributes
      const mockTaskElement = document.createElement('div')

      const eventData = eventDataFunction(mockTaskElement)

      expect(eventData).toEqual({
        title: null,
        duration: null,
        taskId: null,
      })
    })
  })

  describe('Task Element Properties', () => {
    it('renders task elements with correct data attributes', async () => {
      render(<CalendarPage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument()
      })

      const taskItem = screen.getByTestId('task-item')

      expect(taskItem).toHaveAttribute('data-title', 'Test Task')
      expect(taskItem).toHaveAttribute('data-duration', '01:00:00')
      expect(taskItem).toHaveAttribute('data-task-id', 'task-1')
      expect(taskItem).toHaveAttribute('draggable', 'true')
    })
  })

  describe('Cleanup', () => {
    it('destroys ThirdPartyDraggable on unmount', async () => {
      const { unmount } = render(<CalendarPage />)

      await waitFor(() => {
        expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument()
      })

      unmount()

      // Should call destroy on unmount
      expect(mockDestroy).toHaveBeenCalled()
    })
  })

  describe('Error Scenarios', () => {
    it('handles ThirdPartyDraggable initialization errors gracefully', async () => {
      // Re-assign the mock to throw an error for this test
      mockThirdPartyDraggable.mockImplementation(() => {
        throw new Error('ThirdPartyDraggable initialization failed')
      })

      // Should not crash the component
      expect(() => {
        render(<CalendarPage />)
      }).not.toThrow()
    })
  })
})
