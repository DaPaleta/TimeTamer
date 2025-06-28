import React, { useRef, useEffect } from "react";
import { MyCalendar } from "./Calendar";
import TaskList from "../../components/tasks/TaskList";
import { ThirdPartyDraggable } from '@fullcalendar/interaction';

export const CalendarPage = () => {
  const taskListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize ThirdPartyDraggable for the task list
    if (taskListRef.current) {
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
  }, []);

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      <div style={{ flex: '1' }}>
        <h2>Calendar</h2>
        <MyCalendar />
      </div>
      <div style={{ flex: '0 0 300px' }} ref={taskListRef}>
        <h2>Tasks</h2>
        <TaskList tasksByCategory={{
          important: [
            {
              name: 'important',
              tasks: [
                {
                  id: 'hello',
                  title: 'sir',
                  duration: '01:30:00'
                },
                {
                  id: 'world',
                  title: 'madam',
                  duration: '00:30:00'
                }
              ]
            }
          ],
          critical: [
            {
              name: 'critical',
              tasks: [
                {
                  id: 'helloo',
                  title: 'sirr',
                  duration: '01:15:00'
                },
                {
                  id: 'worldd',
                  title: 'madamm',
                  duration: '00:45:00'
                }
              ]
            }
          ]
        }
        }/>
      </div>
    </div>
  );
};
