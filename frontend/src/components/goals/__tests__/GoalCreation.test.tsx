import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import GoalCreation from '../GoalCreation'
import { goalsApi } from '../../../api/goals'

// Mock the goals API
vi.mock('../../../api/goals', () => ({
  goalsApi: {
    create: vi.fn(),
  },
}))

const mockGoalsApi = goalsApi as jest.Mocked<typeof goalsApi>

describe('GoalCreation', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the dialog with form fields', () => {
    render(<GoalCreation open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

    expect(screen.getByText('Create New Goal')).toBeInTheDocument()
    expect(screen.getByLabelText('Goal Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Target Type')).toBeInTheDocument()
    expect(screen.getByLabelText('Target Value')).toBeInTheDocument()
    expect(screen.getByLabelText('Time Period')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<GoalCreation open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

    const createButton = screen.getByText('Create Goal')
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Goal name is required')).toBeInTheDocument()
    })
  })

  it('creates a goal successfully', async () => {
    mockGoalsApi.create.mockResolvedValue({
      goal_id: '1',
      user_id: 'user1',
      name: 'Test Goal',
      target_type: 'minutes',
      target_value: 300,
      time_period: 'weekly',
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
    })

    render(<GoalCreation open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Goal Name'), {
      target: { value: 'Test Goal' },
    })
    fireEvent.change(screen.getByLabelText('Target Value'), {
      target: { value: '300' },
    })

    // Submit the form
    const createButton = screen.getByText('Create Goal')
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(mockGoalsApi.create).toHaveBeenCalledWith({
        name: 'Test Goal',
        target_type: 'minutes',
        target_value: 300,
        time_period: 'weekly',
        is_active: true,
      })
      expect(mockOnSuccess).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('handles API errors', async () => {
    mockGoalsApi.create.mockRejectedValue(new Error('API Error'))

    render(<GoalCreation open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Goal Name'), {
      target: { value: 'Test Goal' },
    })

    // Submit the form
    const createButton = screen.getByText('Create Goal')
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument()
    })
  })

  it('validates percentage target value', async () => {
    render(<GoalCreation open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

    // Change target type to percentage
    fireEvent.mouseDown(screen.getByLabelText('Target Type'))
    fireEvent.click(screen.getByText('% of Scheduled Time'))

    // Enter invalid percentage
    fireEvent.change(screen.getByLabelText('Target Value'), {
      target: { value: '150' },
    })

    const createButton = screen.getByText('Create Goal')
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Percentage cannot exceed 100%')).toBeInTheDocument()
    })
  })

  it('closes dialog when cancel is clicked', () => {
    render(<GoalCreation open={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />)

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })
})
