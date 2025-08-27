import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import QuickStatsWidget from '../QuickStatsWidget'
import { analyticsApi } from '../../../api/analytics'

// Mock the analytics API
vi.mock('../../../api/analytics', () => ({
  analyticsApi: {
    getQuickStats: vi.fn(),
  },
}))

const mockAnalyticsApi = analyticsApi as jest.Mocked<typeof analyticsApi>

describe('QuickStatsWidget', () => {
  const mockQuickStats = {
    total_scheduled_minutes: 1260,
    completed_tasks_count: 18,
    focus_time_utilization: 0.72,
    top_category: { category_id: '1', name: 'Work', minutes: 840 },
    streak_days_completed: 5,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    mockAnalyticsApi.getQuickStats.mockResolvedValue(mockQuickStats)

    render(<QuickStatsWidget dateRange="7d" />)

    expect(screen.getByText('Loading quick stats…')).toBeInTheDocument()
  })

  it('renders quick stats when data is loaded', async () => {
    mockAnalyticsApi.getQuickStats.mockResolvedValue(mockQuickStats)

    render(<QuickStatsWidget dateRange="7d" />)

    await waitFor(() => {
      expect(screen.getByText('1,260 min')).toBeInTheDocument()
      expect(screen.getByText('18')).toBeInTheDocument()
      expect(screen.getByText('72%')).toBeInTheDocument()
      expect(screen.getByText('Work (840m)')).toBeInTheDocument()
      expect(screen.getByText('5 days')).toBeInTheDocument()
    })
  })

  it('renders error state when API call fails', async () => {
    mockAnalyticsApi.getQuickStats.mockRejectedValue(new Error('API Error'))

    render(<QuickStatsWidget dateRange="7d" />)

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument()
    })
  })

  it('handles missing top category gracefully', async () => {
    const statsWithoutTopCategory = {
      ...mockQuickStats,
      top_category: undefined,
    }
    mockAnalyticsApi.getQuickStats.mockResolvedValue(statsWithoutTopCategory)

    render(<QuickStatsWidget dateRange="7d" />)

    await waitFor(() => {
      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })

  it('calls API with correct date range', async () => {
    mockAnalyticsApi.getQuickStats.mockResolvedValue(mockQuickStats)

    render(<QuickStatsWidget dateRange="30d" />)

    await waitFor(() => {
      expect(mockAnalyticsApi.getQuickStats).toHaveBeenCalledWith('30d')
    })
  })
})
