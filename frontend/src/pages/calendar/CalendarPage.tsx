import React, { useRef, useEffect, useState } from "react";
import { MyCalendar } from "./Calendar";
import TaskList from "../../components/tasks/TaskList";
import { ThirdPartyDraggable } from '@fullcalendar/interaction';
import { fetchTasks } from "../../api/tasks";
import type { Task } from "../../api/tasks";
import type { TasksByCategory } from "../../components/tasks/TaskList";

export const CalendarPage = () => {
  const taskListRef = useRef<HTMLDivElement>(null);
  const [tasksByCategory, setTasksByCategory] = useState<TasksByCategory>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch tasks from the server
        const tasksResponse = await fetchTasks(); // Remove status filter temporarily

        // Group tasks by category
        const groupedTasks: TasksByCategory = {};
        
        // Filter out completed tasks on the client side
        const activeTasks = tasksResponse.tasks.filter((task: Task) => 
          task.status !== 'completed' && task.status !== 'cancelled'
        );
        
        activeTasks.forEach((task: Task) => {
          const categoryName = task.category?.name || 'Uncategorized';
          
          if (!groupedTasks[categoryName]) {
            groupedTasks[categoryName] = [{
              name: categoryName,
              tasks: []
            }];
          }
          
          // Convert API task format to TaskList component format
          const taskItem = {
            id: task.task_id,
            title: task.title,
            duration: formatDuration(task.estimated_duration_minutes),
            priority: task.priority,
            description: task.description
          };
          
          groupedTasks[categoryName][0].tasks.push(taskItem);
        });
        
        setTasksByCategory(groupedTasks);
      } catch (err) {
        console.error('Error loading tasks:', err);
        let errorMessage = 'Failed to load tasks. Please try again.';
        
        if (err instanceof Error) {
          if (err.message.includes('Network Error')) {
            errorMessage = 'Unable to connect to server. Please check your connection.';
          } else if (err.message.includes('401')) {
            errorMessage = 'Authentication required. Please log in again.';
          } else if (err.message.includes('403')) {
            errorMessage = 'Access denied. You may not have permission to view tasks.';
          } else if (err.message.includes('500')) {
            errorMessage = 'Server error. Please try again later.';
          }
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  useEffect(() => {
    // Initialize ThirdPartyDraggable for the task list
    if (taskListRef.current && Object.keys(tasksByCategory).length > 0) {
      const draggable = new ThirdPartyDraggable(taskListRef.current, {
        itemSelector: '.task-item',
        eventData: function(eventEl) {
          return {
            title: eventEl.getAttribute('data-title'),
            duration: eventEl.getAttribute('data-duration'),
            taskId: eventEl.getAttribute('data-task-id'),
          };
        }
      });

      return () => draggable.destroy();
    }
  }, [tasksByCategory]); // Re-initialize when tasks are loaded

  // Helper function to format duration from minutes to HH:MM:SS
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: '1' }}>
          <h2>Calendar</h2>
          <MyCalendar />
        </div>
        <div style={{ flex: '0 0 300px' }}>
          <h2>Tasks</h2>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            Loading tasks...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: '1' }}>
          <h2>Calendar</h2>
          <MyCalendar />
        </div>
        <div style={{ flex: '0 0 300px' }}>
          <h2>Tasks</h2>
          <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      <div style={{ flex: '1' }}>
        <h2>Calendar</h2>
        <MyCalendar />
      </div>
      <div style={{ flex: '0 0 300px' }} ref={taskListRef}>
        <h2>Tasks</h2>
        <TaskList tasksByCategory={tasksByCategory} />
      </div>
    </div>
  );
};
