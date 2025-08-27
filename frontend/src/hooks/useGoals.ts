import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { goalsApi, type GoalCreate, type GoalUpdate } from '../api/goals'

// Query keys for consistent caching
export const goalKeys = {
  all: ['goals'] as const,
  lists: () => [...goalKeys.all, 'list'] as const,
  list: (filters: string) => [...goalKeys.lists(), { filters }] as const,
  details: () => [...goalKeys.all, 'detail'] as const,
  detail: (id: string) => [...goalKeys.details(), id] as const,
  progress: (period: string) => [...goalKeys.all, 'progress', period] as const,
}

// Hook for fetching goals list
export const useGoals = (filters?: string) => {
  return useQuery({
    queryKey: goalKeys.list(filters || 'all'),
    queryFn: () => goalsApi.list(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for fetching goal progress
export const useGoalProgress = (period: string = 'weekly', startDate?: string) => {
  return useQuery({
    queryKey: goalKeys.progress(period),
    queryFn: () => goalsApi.progress(period, startDate),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
  })
}

// Hook for creating a goal
export const useCreateGoal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (goal: GoalCreate) => goalsApi.create(goal),
    onSuccess: () => {
      // Invalidate and refetch goals list
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() })
      // Invalidate progress data
      queryClient.invalidateQueries({ queryKey: goalKeys.all })
    },
    onError: (error) => {
      console.error('Failed to create goal:', error)
    },
  })
}

// Hook for updating a goal
export const useUpdateGoal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, goal }: { id: string; goal: GoalUpdate }) => goalsApi.update(id, goal),
    onSuccess: (updatedGoal) => {
      // Update the specific goal in cache
      queryClient.setQueryData(goalKeys.detail(updatedGoal.goal_id), updatedGoal)
      // Invalidate and refetch goals list
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() })
      // Invalidate progress data
      queryClient.invalidateQueries({ queryKey: goalKeys.all })
    },
    onError: (error) => {
      console.error('Failed to update goal:', error)
    },
  })
}

// Hook for deleting a goal
export const useDeleteGoal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => goalsApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove the goal from cache
      queryClient.removeQueries({ queryKey: goalKeys.detail(deletedId) })
      // Invalidate and refetch goals list
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() })
      // Invalidate progress data
      queryClient.invalidateQueries({ queryKey: goalKeys.all })
    },
    onError: (error) => {
      console.error('Failed to delete goal:', error)
    },
  })
}

// Hook for prefetching goals (useful for navigation)
export const usePrefetchGoals = () => {
  const queryClient = useQueryClient()

  return () => {
    queryClient.prefetchQuery({
      queryKey: goalKeys.lists(),
      queryFn: () => goalsApi.list(),
      staleTime: 2 * 60 * 1000,
    })
  }
}
