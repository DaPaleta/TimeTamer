import React, { useRef } from 'react'
import { MyCalendar } from './Calendar'
import { CalendarProvider, useCalendarContext } from '../../context/CalendarContext'
import { fetchTasks } from '../../api/tasks'
import type { Task } from '../../api/tasks'
import TaskList from '../../components/tasks/TaskList'
import { ThirdPartyDraggable } from '@fullcalendar/interaction/index.js'
import './CalendarPage.css'

const CalendarPage = () => {
  const taskListRef = useRef<HTMLDivElement>(null)
  const { loading, error, dateRange, fetchAndStoreCalendarData, scheduledEvents } =
    useCalendarContext()
  const [unscheduledTasks, setUnscheduledTasks] = React.useState<Task[]>([])
  const [unscheduledLoading, setUnscheduledLoading] = React.useState(false)
  const [unscheduledError, setUnscheduledError] = React.useState<string | null>(null)

  // Ref to store the draggable instance for cleanup
  const draggableRef = React.useRef<ThirdPartyDraggable | null>(null)

  // Fetch calendar data when dateRange changes
  React.useEffect(() => {
    if (dateRange.start && dateRange.end) {
      fetchAndStoreCalendarData(dateRange)
    }
  }, [dateRange.start, dateRange.end, fetchAndStoreCalendarData])

  // Fetch unscheduled tasks on mount and when scheduledEvents change
  React.useEffect(() => {
    setUnscheduledLoading(true)
    setUnscheduledError(null)
    fetchTasks()
      .then((res) => {
        // Filter tasks with no scheduled_slots or empty scheduled_slots array
        const unscheduled = res.tasks.filter(
          (task) => !task.scheduled_slots || task.scheduled_slots.length === 0
        )
        setUnscheduledTasks(unscheduled)
      })
      .catch(() => {
        setUnscheduledError('Failed to load unscheduled tasks.')
      })
      .finally(() => setUnscheduledLoading(false))
  }, [scheduledEvents])

  // Initialize ThirdPartyDraggable for the task list after unscheduled tasks are loaded
  React.useEffect(() => {
    if (taskListRef.current && unscheduledTasks.length > 0) {
      // Destroy previous instance if exists
      if (draggableRef.current) {
        draggableRef.current.destroy()
      }
      // See: https://fullcalendar.io/docs/third-party-dragging-libraries
      draggableRef.current = new ThirdPartyDraggable(taskListRef.current, {
        itemSelector: '.task-item',
        eventData: function (eventEl) {
          return {
            title: eventEl.getAttribute('data-title'),
            duration: eventEl.getAttribute('data-duration'),
            taskId: eventEl.getAttribute('data-task-id'),
            color: eventEl.getAttribute('data-color'),
          }
        },
      })
    }
    // Cleanup on unmount
    return () => {
      if (draggableRef.current) {
        draggableRef.current.destroy()
        draggableRef.current = null
      }
    }
  }, [unscheduledTasks])

  // Group unscheduled tasks by category for TaskList
  const unscheduledTasksBySortingKey = React.useMemo(() => {
    const grouped: { [sectionName: string]: Task[] } = {}
    unscheduledTasks.forEach((task) => {
      const displayName = (task.category && task.category.name) || 'Uncategorized'
      if (!grouped[displayName]) grouped[displayName] = []
      grouped[displayName].push(task)
    })
    return grouped
  }, [unscheduledTasks])

  // Error toast state
  const [showError, setShowError] = React.useState(true)

  // Show spinner overlay if either calendar or unscheduled tasks are loading
  const showSpinner = loading || unscheduledLoading

  // Show error toast for either calendar or unscheduled task errors
  const errorMessage = error || unscheduledError || ''

  return (
    <>
      <SpinnerOverlay show={showSpinner} />
      <ErrorToast
        message={errorMessage && showError ? errorMessage : ''}
        onClose={() => setShowError(false)}
      />
      <div className="calendar-page-layout">
        <div className="calendar-container">
          <h2>Calendar</h2>
          <div className="calendar-wrapper">
            <MyCalendar />
          </div>
        </div>
        <div className="task-list-wrapper" ref={taskListRef}>
          <h2>Unscheduled Tasks</h2>
          <div className="task-list-content">
            {unscheduledTasks.length === 0 && !unscheduledLoading ? (
              <div className="no-tasks-message">No unscheduled tasks.</div>
            ) : (
              <TaskList tasksBySortingKey={unscheduledTasksBySortingKey} />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Wrap the page in the provider
const CalendarPageWithProvider = () => (
  <CalendarProvider>
    <CalendarPage />
  </CalendarProvider>
)

// Simple loading spinner overlay
const SpinnerOverlay = ({ show }: { show: boolean }) =>
  show ? (
    <div className="spinner-overlay">
      <div className="spinner" />
    </div>
  ) : null

// Simple error toast
const ErrorToast = ({ message, onClose }: { message: string; onClose: () => void }) =>
  message ? (
    <div className="error-toast">
      <span>{message}</span>
      <button onClick={onClose} className="error-toast-close">
        ×
      </button>
    </div>
  ) : null

export default CalendarPageWithProvider
