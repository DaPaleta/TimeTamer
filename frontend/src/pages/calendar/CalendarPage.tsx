import React, { useRef } from "react";
import { MyCalendar } from "./Calendar";
import { CalendarProvider, useCalendarContext } from '../../context/CalendarContext';
import { fetchTasks } from '../../api/tasks';
import type { Task } from '../../api/tasks';
import TaskList from '../../components/tasks/TaskList';
import { ThirdPartyDraggable } from "@fullcalendar/interaction/index.js";

const CalendarPage = () => {
  const taskListRef = useRef<HTMLDivElement>(null);
  const { loading, error, dateRange, fetchAndStoreCalendarData, scheduledEvents } = useCalendarContext();
  const [unscheduledTasks, setUnscheduledTasks] = React.useState<Task[]>([]);
  const [unscheduledLoading, setUnscheduledLoading] = React.useState(false);
  const [unscheduledError, setUnscheduledError] = React.useState<string | null>(null);

  // Ref to store the draggable instance for cleanup
  const draggableRef = React.useRef<ThirdPartyDraggable | null>(null);

  // Fetch calendar data when dateRange changes
  React.useEffect(() => {
    if (dateRange.start && dateRange.end) {
      fetchAndStoreCalendarData(dateRange);
    }
  }, [dateRange.start, dateRange.end, fetchAndStoreCalendarData]);

  // Fetch unscheduled tasks on mount and when scheduledEvents change
  React.useEffect(() => {
    setUnscheduledLoading(true);
    setUnscheduledError(null);
    fetchTasks()
      .then(res => {
        // Filter tasks with no scheduled_slots or empty scheduled_slots array
        const unscheduled = res.tasks.filter(task => !task.scheduled_slots || task.scheduled_slots.length === 0);
        setUnscheduledTasks(unscheduled);
      })
      .catch(() => {
        setUnscheduledError('Failed to load unscheduled tasks.');
      })
      .finally(() => setUnscheduledLoading(false));
  }, [scheduledEvents]);

  // Initialize ThirdPartyDraggable for the task list after unscheduled tasks are loaded
  React.useEffect(() => {
    if (taskListRef.current && unscheduledTasks.length > 0) {
      // Destroy previous instance if exists
      if (draggableRef.current) {
        draggableRef.current.destroy();
      }
      // See: https://fullcalendar.io/docs/third-party-dragging-libraries
      draggableRef.current = new ThirdPartyDraggable(taskListRef.current, {
        itemSelector: ".task-item",
        eventData: function(eventEl) {
          return {
            title: eventEl.getAttribute("data-title"),
            duration: eventEl.getAttribute("data-duration"),
            taskId: eventEl.getAttribute("data-task-id"),
          };
        },
      });
    }
    // Cleanup on unmount
    return () => {
      if (draggableRef.current) {
        draggableRef.current.destroy();
        draggableRef.current = null;
      }
    };
  }, [unscheduledTasks]);

  // Group unscheduled tasks by category for TaskList
  const unscheduledTasksBySortingKey = React.useMemo(() => {
    const grouped: { [sectionName: string]: Task[] } = {};
    unscheduledTasks.forEach(task => {
      const displayName = (task.category && task.category.name) || 'Uncategorized';
      if (!grouped[displayName]) grouped[displayName] = [];
      grouped[displayName].push(task);
    });
    return grouped;
  }, [unscheduledTasks]);

  // Error toast state
  const [showError, setShowError] = React.useState(true);

  // Show spinner overlay if either calendar or unscheduled tasks are loading
  const showSpinner = loading || unscheduledLoading;

  // Show error toast for either calendar or unscheduled task errors
  const errorMessage = error || unscheduledError || '';

  return (
    <>
      <SpinnerOverlay show={showSpinner} />
      <ErrorToast message={errorMessage && showError ? errorMessage : ''} onClose={() => setShowError(false)} />
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: '1' }}>
          <h2>Calendar</h2>
          <MyCalendar />
        </div>
        <div style={{ flex: '0 0 300px' }} ref={taskListRef}>
          <h2>Unscheduled Tasks</h2>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            {unscheduledTasks.length === 0 && !unscheduledLoading ? (
              <div>No unscheduled tasks.</div>
            ) : (
              <TaskList tasksBySortingKey={unscheduledTasksBySortingKey} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// Wrap the page in the provider
const CalendarPageWithProvider = () => (
  <CalendarProvider>
    <CalendarPage />
  </CalendarProvider>
);

// Simple loading spinner overlay
const SpinnerOverlay = ({ show }: { show: boolean }) => show ? (
  <div style={{
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    background: 'rgba(255,255,255,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}>
    <div style={{ border: '4px solid #f3f3f3', borderRadius: '50%', borderTop: '4px solid #3498db', width: 40, height: 40, animation: 'spin 1s linear infinite' }} />
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
) : null;

// Simple error toast
const ErrorToast = ({ message, onClose }: { message: string, onClose: () => void }) => message ? (
  <div style={{ position: 'fixed', bottom: 30, right: 30, background: '#e74c3c', color: 'white', padding: '16px 24px', borderRadius: 8, zIndex: 10000, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
    <span>{message}</span>
    <button onClick={onClose} style={{ marginLeft: 16, background: 'none', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>×</button>
  </div>
) : null;

export default CalendarPageWithProvider;
