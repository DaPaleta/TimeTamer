import React, { useMemo, useCallback, memo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import { Box, Card, CardContent, Typography, Skeleton } from '@mui/material'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
)

interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    borderColor?: string
    backgroundColor?: string | string[]
    tension?: number
    yAxisID?: string
  }>
}

interface ChartOptions {
  responsive?: boolean
  maintainAspectRatio?: boolean
  plugins?: {
    legend?: {
      position?: 'top' | 'bottom' | 'left' | 'right'
      display?: boolean
    }
    title?: {
      display?: boolean
      text?: string
    }
  }
  scales?: any
}

interface PerformanceChartProps {
  type: 'line' | 'doughnut' | 'bar'
  data: ChartData
  options?: ChartOptions
  title?: string
  height?: number | string
  loading?: boolean
  error?: string | null
  onChartClick?: (event: any, elements: any[]) => void
}

// Memoized chart options to prevent unnecessary re-renders
const createMemoizedOptions = (
  options: ChartOptions = {},
  onChartClick?: (event: any, elements: any[]) => void
) => {
  return useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          display: true,
          ...options.plugins?.legend,
        },
        title: {
          display: false,
          ...options.plugins?.title,
        },
      },
      scales: options.scales,
      onClick: onChartClick,
      ...options,
    }),
    [options, onChartClick]
  )
}

// Memoized chart data to prevent unnecessary re-renders
const createMemoizedData = (data: ChartData) => {
  return useMemo(() => data, [JSON.stringify(data)])
}

// Chart component with performance optimizations
const PerformanceChart: React.FC<PerformanceChartProps> = memo(
  ({
    type,
    data,
    options = {},
    title,
    height = 400,
    loading = false,
    error = null,
    onChartClick,
  }) => {
    const memoizedData = createMemoizedData(data)
    const memoizedOptions = createMemoizedOptions(options, onChartClick)

    const renderChart = useCallback(() => {
      if (loading) {
        return <Skeleton variant="rectangular" height={height} />
      }

      if (error) {
        return (
          <Box
            sx={{
              height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'error.main',
            }}
          >
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
        )
      }

      const chartProps = {
        data: memoizedData,
        options: memoizedOptions,
        height,
      }

      switch (type) {
        case 'line':
          return <Line {...chartProps} />
        case 'doughnut':
          return <Doughnut {...chartProps} />
        case 'bar':
          return <Bar {...chartProps} />
        default:
          return <Line {...chartProps} />
      }
    }, [type, memoizedData, memoizedOptions, height, loading, error])

    return (
      <Card>
        <CardContent>
          {title && (
            <Typography variant="h6" gutterBottom>
              {title}
            </Typography>
          )}
          <Box sx={{ height, position: 'relative' }}>{renderChart()}</Box>
        </CardContent>
      </Card>
    )
  }
)

PerformanceChart.displayName = 'PerformanceChart'

// Predefined chart configurations for common use cases
export const createTrendChart = (
  labels: string[],
  datasets: Array<{ label: string; data: number[]; color: string }>,
  title?: string
) => ({
  type: 'line' as const,
  data: {
    labels,
    datasets: datasets.map((dataset) => ({
      label: dataset.label,
      data: dataset.data,
      borderColor: dataset.color,
      backgroundColor: dataset.color + '20',
      tension: 0.1,
    })),
  },
  options: {
    plugins: {
      title: {
        display: !!title,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Value',
        },
      },
    },
  },
})

export const createCategoryChart = (labels: string[], data: number[], title?: string) => ({
  type: 'doughnut' as const,
  data: {
    labels,
    datasets: [
      {
        data,
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF6384',
          '#C9CBCF',
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  },
  options: {
    plugins: {
      title: {
        display: !!title,
        text: title,
      },
      legend: {
        position: 'bottom' as const,
      },
    },
  },
})

export const createBarChart = (
  labels: string[],
  datasets: Array<{ label: string; data: number[]; color: string }>,
  title?: string
) => ({
  type: 'bar' as const,
  data: {
    labels,
    datasets: datasets.map((dataset) => ({
      label: dataset.label,
      data: dataset.data,
      backgroundColor: dataset.color,
      borderColor: dataset.color,
      borderWidth: 1,
    })),
  },
  options: {
    plugins: {
      title: {
        display: !!title,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Value',
        },
      },
    },
  },
})

export default PerformanceChart
