import React from 'react'
import { Skeleton, Box, Card, CardContent, Stack } from '@mui/material'

interface SkeletonLoaderProps {
  variant?: 'card' | 'list' | 'table' | 'chart' | 'form' | 'custom'
  count?: number
  height?: number | string
  width?: number | string
  animation?: 'pulse' | 'wave'
  className?: string
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'card',
  count = 1,
  height,
  width,
  animation = 'wave',
  className,
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <Card>
            <CardContent>
              <Skeleton variant="text" width="60%" height={32} animation={animation} />
              <Skeleton variant="text" width="40%" height={24} animation={animation} />
              <Skeleton variant="rectangular" height={120} animation={animation} />
            </CardContent>
          </Card>
        )

      case 'list':
        return (
          <Stack spacing={2}>
            {Array.from({ length: count }).map((_, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="circular" width={40} height={40} animation={animation} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="70%" height={24} animation={animation} />
                  <Skeleton variant="text" width="50%" height={20} animation={animation} />
                </Box>
                <Skeleton variant="rectangular" width={60} height={32} animation={animation} />
              </Box>
            ))}
          </Stack>
        )

      case 'table':
        return (
          <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton
                  key={index}
                  variant="text"
                  width="25%"
                  height={32}
                  animation={animation}
                />
              ))}
            </Box>
            {/* Rows */}
            {Array.from({ length: count }).map((_, rowIndex) => (
              <Box key={rowIndex} sx={{ display: 'flex', gap: 2, mb: 1 }}>
                {Array.from({ length: 4 }).map((_, colIndex) => (
                  <Skeleton
                    key={colIndex}
                    variant="text"
                    width="25%"
                    height={24}
                    animation={animation}
                  />
                ))}
              </Box>
            ))}
          </Box>
        )

      case 'chart':
        return (
          <Card>
            <CardContent>
              <Skeleton variant="text" width="40%" height={32} animation={animation} />
              <Skeleton variant="rectangular" height={300} animation={animation} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Skeleton variant="text" width="20%" height={20} animation={animation} />
                <Skeleton variant="text" width="20%" height={20} animation={animation} />
                <Skeleton variant="text" width="20%" height={20} animation={animation} />
              </Box>
            </CardContent>
          </Card>
        )

      case 'form':
        return (
          <Stack spacing={3}>
            <Skeleton variant="text" width="30%" height={32} animation={animation} />
            <Skeleton variant="rectangular" height={56} animation={animation} />
            <Skeleton variant="rectangular" height={56} animation={animation} />
            <Skeleton variant="rectangular" height={120} animation={animation} />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Skeleton variant="rectangular" width={80} height={36} animation={animation} />
              <Skeleton variant="rectangular" width={80} height={36} animation={animation} />
            </Box>
          </Stack>
        )

      case 'custom':
      default:
        return (
          <Skeleton
            variant="rectangular"
            height={height || 200}
            width={width || '100%'}
            animation={animation}
            className={className}
          />
        )
    }
  }

  if (variant === 'list' || variant === 'table') {
    return renderSkeleton()
  }

  return (
    <Stack spacing={2}>
      {Array.from({ length: count }).map((_, index) => (
        <Box key={index}>{renderSkeleton()}</Box>
      ))}
    </Stack>
  )
}

// Specialized skeleton components
export const GoalCardSkeleton: React.FC = () => (
  <Card>
    <CardContent>
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
      >
        <Skeleton variant="text" width="60%" height={28} />
        <Skeleton variant="circular" width={24} height={24} />
      </Box>
      <Skeleton variant="text" width="40%" height={20} />
      <Box sx={{ mt: 2 }}>
        <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 1 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Skeleton variant="text" width="30%" height={16} />
          <Skeleton variant="text" width="20%" height={16} />
        </Box>
      </Box>
    </CardContent>
  </Card>
)

export const DashboardSkeleton: React.FC = () => (
  <Box>
    {/* Header */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Skeleton variant="text" width="300px" height={40} />
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Skeleton variant="rectangular" width={120} height={40} />
        <Skeleton variant="rectangular" width={100} height={40} />
      </Box>
    </Box>

    {/* Metrics Cards */}
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
      <Card>
        <CardContent>
          <Skeleton variant="text" width="50%" height={24} />
          <Skeleton variant="text" width="30%" height={48} />
          <Skeleton variant="text" width="80%" height={20} />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Skeleton variant="text" width="50%" height={24} />
          <Skeleton variant="text" width="30%" height={48} />
          <Skeleton variant="text" width="80%" height={20} />
        </CardContent>
      </Card>
    </Box>

    {/* Charts */}
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
      <Skeleton variant="rectangular" height={300} />
      <Skeleton variant="rectangular" height={300} />
    </Box>
    <Skeleton variant="rectangular" height={400} />
  </Box>
)

export const QuickStatsSkeleton: React.FC = () => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 2,
        }}
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <Box key={index} sx={{ textAlign: 'center' }}>
            <Skeleton variant="text" width="100%" height={32} />
            <Skeleton variant="text" width="60%" height={16} />
          </Box>
        ))}
      </Box>
    </CardContent>
  </Card>
)
