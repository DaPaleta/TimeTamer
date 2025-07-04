import React, { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { backgroundEvents } from './backgroundEvents';
import { useCalendarContext } from '../../context/CalendarContext';
import type { ViewContentArg, DatesSetArg, EventDropArg, EventApi } from '@fullcalendar/core';
import type { CalendarView } from '../../context/CalendarContext';
import { updateTask } from '../../api/tasks';

interface EventReceiveInfo {
    event: {
        title: string;
        start: Date | null;
        end: Date | null;
        extendedProps: Record<string, unknown>;
    };
}

export const MyCalendar = () => {
    const calendarRef = useRef<FullCalendar>(null);
    const { view, setView, setDateRange, dateRange, fetchAndStoreCalendarData, scheduledEvents } = useCalendarContext();

    const handleEventReceive = async (info: EventReceiveInfo) => {
        console.log('Event received:', info.event);
        // Extract dropped taskId and times
        const taskId = (info.event.extendedProps.taskId as string) || (info.event.extendedProps.task_id as string);
        const start = info.event.start;
        const end = info.event.end;
        if (!taskId || !start || !end) {
            alert(`Could not schedule task: missing data\n\tEvent: ${info.event}\n\tTask ID: ${taskId}\n\tStart: ${start}\n\tEnd: ${end}`);
            return;
        }
        // Format times as ISO strings
        const startTime = start.toISOString();
        const endTime = end.toISOString();
        // Add scheduled slot to the task
        try {
            await updateTask(taskId, {
                scheduled_slots: [{ start_time: startTime, end_time: endTime, calendar_day_id: null }]
            });
            // Refresh calendar data and unscheduled tasks
            fetchAndStoreCalendarData(dateRange);
        } catch {
            alert('Failed to schedule task.');
        }
    };

    // Called when the user changes the view (week/day)
    const handleViewDidMount = (arg: ViewContentArg) => {
        setView(arg.view.type as CalendarView);
    };

    // Called when the user navigates (prev/next/today)
    const handleDatesSet = (arg: DatesSetArg) => {
        const newRange = {
            start: arg.startStr,
            end: arg.endStr,
        };
        if (dateRange.start !== newRange.start || dateRange.end !== newRange.end) {
            setDateRange(newRange);
        }
    };

    // Handle event drag-and-drop within the calendar
    const handleEventDrop = async (info: EventDropArg) => {
        const event = info.event;
        const taskId = (event.extendedProps.taskId as string) || (event.extendedProps.task_id as string);
        const start = event.start;
        const end = event.end;
        if (!taskId || !start || !end) {
            alert(`Could not schedule task: missing data\n\tEvent: ${event}\n\tTask ID: ${taskId}\n\tStart: ${start}\n\tEnd: ${end}`);
            info.revert();
            return;
        }
        try {
            await updateTask(taskId, {
                scheduled_slots: [{ start_time: start.toISOString(), end_time: end.toISOString(), calendar_day_id: null }]
            });
            fetchAndStoreCalendarData(dateRange);
        } catch {
            alert('Failed to update scheduled task.');
            info.revert();
        }
    };

    // Handle event resize within the calendar (see FullCalendar eventResize signature)
    const handleEventResize = async (info: { event: EventApi; revert: () => void }) => {
        const event = info.event;
        const taskId = (event.extendedProps.taskId as string) || (event.extendedProps.task_id as string);
        const start = event.start;
        const end = event.end;
        if (!taskId || !start || !end) {
            alert(`Could not resize scheduled task: missing data\n\tEvent: ${event}\n\tTask ID: ${taskId}\n\tStart: ${start}\n\tEnd: ${end}`);
            info.revert();
            return;
        }
        try {
            await updateTask(taskId, {
                scheduled_slots: [{ start_time: start.toISOString(), end_time: end.toISOString(), calendar_day_id: null }]
            });
            fetchAndStoreCalendarData(dateRange);
        } catch {
            alert('Failed to update scheduled task.');
            info.revert();
        }
    };

    return (
        <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView={view}
            firstDay={0}
            weekends={true}
            hiddenDays={[5,6]}
            businessHours={[
              {
                daysOfWeek: [ 0, 2, 4 ],
                startTime: '09:45',
                endTime: '18:00'
              },
              {
                daysOfWeek: [ 1, 3 ],
                startTime: '09:00',
                endTime: '18:00'
              }
            ]}
            nowIndicator={true}
            scrollTime={'09:00:00'}
            headerToolbar={{
              left: 'prev,next',
              center: 'title',
              right: 'timeGridWeek,timeGridDay'
            }}
            editable={true}
            droppable={true}
            selectable={true}
            selectMirror={true}
            eventSources={[
              { events: scheduledEvents },
              { events: backgroundEvents }
            ]}
            eventReceive={handleEventReceive}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            viewDidMount={handleViewDidMount}
            datesSet={handleDatesSet}
        />
    )
}