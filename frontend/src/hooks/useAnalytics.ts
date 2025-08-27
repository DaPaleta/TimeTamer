import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { analyticsApi } from '../api/analytics'

// Query keys for consistent caching
export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: (period: string) => [...analyticsKeys.all, 'dashboard', period] as const,
  quickStats: (dateRange: string) => [...analyticsKeys.all, 'quickStats', dateRange] as const,
  trends: (period: string) => [...analyticsKeys.all, 'trends', period] as const,
  categories: (period: string) => [...analyticsKeys.all, 'categories', period] as const,
}

// Hook for fetching dashboard data
export const useDashboard = (period: 'weekly' | 'monthly' = 'monthly') => {
  return useQuery({
    queryKey: analyticsKeys.dashboard(period),
    queryFn: () => analyticsApi.getDashboard(period),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false
      }
      return failureCount < 3
    },
  })
}

// Hook for fetching quick stats
export const useQuickStats = (dateRange: string = '7d') => {
  return useQuery({
    queryKey: analyticsKeys.quickStats(dateRange),
    queryFn: () => analyticsApi.getQuickStats(dateRange),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false
      }
      return failureCount < 2
    },
  })
}

// Hook for fetching trends data
export const useTrends = (period: string = 'weekly') => {
  return useQuery({
    queryKey: analyticsKeys.trends(period),
    queryFn: () => analyticsApi.getDashboard(period).then((data) => data.trend),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook for fetching category data
export const useCategories = (period: string = 'weekly') => {
  return useQuery({
    queryKey: analyticsKeys.categories(period),
    queryFn: () => analyticsApi.getDashboard(period).then((data) => data.category_minutes),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook for exporting analytics data
export const useExportAnalytics = () => {
  return useMutation({
    mutationFn: ({ startDate, endDate }: { startDate: string; endDate: string }) =>
      analyticsApi.exportCsv(startDate, endDate),
    onSuccess: (blob, { startDate, endDate }) => {
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${startDate}-to-${endDate}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    },
    onError: (error) => {
      console.error('Failed to export analytics:', error)
    },
  })
}

// Hook for prefetching analytics data
export const usePrefetchAnalytics = () => {
  const queryClient = useQueryClient()

  return {
    prefetchDashboard: (period: 'weekly' | 'monthly' = 'monthly') => {
      queryClient.prefetchQuery({
        queryKey: analyticsKeys.dashboard(period),
        queryFn: () => analyticsApi.getDashboard(period),
        staleTime: 2 * 60 * 1000,
      })
    },
    prefetchQuickStats: (dateRange: string = '7d') => {
      queryClient.prefetchQuery({
        queryKey: analyticsKeys.quickStats(dateRange),
        queryFn: () => analyticsApi.getQuickStats(dateRange),
        staleTime: 1 * 60 * 1000,
      })
    },
  }
}

// Hook for invalidating analytics cache
export const useInvalidateAnalytics = () => {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: analyticsKeys.all })
  }
}
