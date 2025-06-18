import React from "react";
import { MyCalendar } from "./Calendar";
import TaskList from "../../components/tasks/TaskList";

export const CalendarPage = () => {
  return (
    <div>
      <h2>Calendar Page</h2>
      <MyCalendar />
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
  );
};
