import React, { useEffect, useState } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  Alert,
  Button,
} from '@mui/material'
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
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import DownloadIcon from '@mui/icons-material/Download'
import { analyticsApi, type DashboardData } from '../../api/analytics'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const numberFmt = (n: number) => new Intl.NumberFormat().format(n)

const DashboardPage: React.FC = () => {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('monthly')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    analyticsApi
      .getDashboard(period)
      .then(setData)
      .catch((e) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [period])

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const blob = await analyticsApi.exportCsv(startDate, endDate)

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${startDate}-to-${endDate}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExportLoading(false)
    }
  }

  const trendData = data
    ? {
        labels: data.trend.map((p) => p.date),
        datasets: [
          {
            label: 'Scheduled Minutes',
            data: data.trend.map((p) => p.total_scheduled_minutes),
            borderColor: 'rgb(53, 162, 235)',
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            tension: 0.1,
          },
          {
            label: 'Focus Minutes',
            data: data.trend.map((p) => p.focus_minutes),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            tension: 0.1,
          },
          {
            label: 'Completed Tasks',
            data: data.trend.map((p) => p.completed_tasks_count),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.1,
            yAxisID: 'y1',
          },
        ],
      }
    : null

  const categoryData = data
    ? {
        labels: Object.keys(data.category_minutes),
        datasets: [
          {
            data: Object.values(data.category_minutes),
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
      }
    : null

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Productivity Trends',
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Minutes',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Task Count',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Category Distribution',
      },
    },
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Productivity Dashboard
          </Typography>
          <Skeleton variant="rectangular" width={120} height={40} />
        </Box>
        <Box
          sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}
        >
          <Skeleton variant="rectangular" height={300} />
          <Skeleton variant="rectangular" height={300} />
        </Box>
        <Skeleton variant="rectangular" height={400} />
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Productivity Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={period}
              label="Period"
              onChange={(e) => setPeriod(e.target.value as 'weekly' | 'monthly')}
            >
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={exportLoading}
          >
            {exportLoading ? 'Exporting...' : 'Export CSV'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {data && (
        <>
          {/* Key Metrics */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
              mb: 4,
            }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Focus Utilization
                </Typography>
                <Typography variant="h3" color="primary">
                  {Math.round(data.focus_utilization * 100)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Percentage of scheduled time spent in focus mode
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Completion Rate
                </Typography>
                <Typography variant="h3" color="primary">
                  {Math.round(data.completion_rate * 100)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Percentage of scheduled tasks completed
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Charts */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
              mb: 3,
            }}
          >
            <Card>
              <CardContent>
                {categoryData && <Doughnut data={categoryData} options={doughnutOptions} />}
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Category Breakdown
                </Typography>
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {Object.entries(data.category_minutes).map(([catId, minutes]) => (
                    <Box
                      key={catId}
                      sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}
                    >
                      <Typography variant="body2">{catId}</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {numberFmt(minutes)} min
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>
          <Card>
            <CardContent>
              {trendData && <Line data={trendData} options={chartOptions} />}
            </CardContent>
          </Card>
        </>
      )}
    </Container>
  )
}

export default DashboardPage
