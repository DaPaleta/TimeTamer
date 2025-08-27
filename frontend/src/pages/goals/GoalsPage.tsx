import React, { useState } from 'react'
import { Container, Typography, Button, Box, Tabs, Tab, Alert } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useGoals } from '../../hooks/useGoals'
import GoalCreation from '../../components/goals/GoalCreation'
import GoalList from '../../components/goals/GoalList'
import GoalProgress from '../../components/goals/GoalProgress'
import { GoalsEmptyState } from '../../components/common/EmptyState'
import { SkeletonLoader } from '../../components/common/SkeletonLoader'

const GoalsPage: React.FC = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  const { data: goals = [], isLoading: loading, error } = useGoals()

  const handleGoalCreated = () => {
    // Goals will be automatically refetched by React Query
  }

  const handleGoalUpdated = () => {
    // Goals will be automatically refetched by React Query
  }

  const handleGoalDeleted = () => {
    // Goals will be automatically refetched by React Query
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Goals
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Goal
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error instanceof Error ? error.message : 'Failed to load goals'}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="My Goals" />
          <Tab label="Progress" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <>
          {loading ? (
            <SkeletonLoader variant="card" count={3} />
          ) : goals.length === 0 ? (
            <GoalsEmptyState onCreateGoal={() => setCreateDialogOpen(true)} />
          ) : (
            <GoalList
              goals={goals}
              loading={loading}
              onGoalUpdated={handleGoalUpdated}
              onGoalDeleted={handleGoalDeleted}
            />
          )}
        </>
      )}

      {activeTab === 1 && <GoalProgress period="weekly" />}

      <GoalCreation
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleGoalCreated}
      />
    </Container>
  )
}

export default GoalsPage
