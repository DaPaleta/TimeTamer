import React, { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useCalendarContext } from '../../context/CalendarContext';
import type { ViewContentArg, DatesSetArg, EventDropArg, EventApi, EventContentArg, EventInput } from '@fullcalendar/core';
import type { CalendarView } from '../../context/CalendarContext';
import { updateTask } from '../../api/tasks';
import { backgroundEvents as staticBackgroundEvents } from './backgroundEvents';

interface EventReceiveInfo {
    event: {
        title: string;
        start: Date | null;
        end: Date | null;
        extendedProps: Record<string, unknown>;
    };
}

// Tooltip component for invalid events
const InvalidEventWithTooltip: React.FC<{ reasons: string[]; children: React.ReactNode }> = ({ reasons, children }) => {
    const [showTooltip, setShowTooltip] = React.useState(false);
    return (
        <span
            style={{ color: '#e74c3c', marginLeft: 4, position: 'relative', cursor: 'pointer' }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip(v => !v)}
        >
            {children}
            {showTooltip && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    background: '#fff',
                    color: '#e74c3c',
                    border: '1px solid #e74c3c',
                    borderRadius: 4,
                    padding: '8px 12px',
                    zIndex: 100,
                    minWidth: 180,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                }}>
                    <b>Invalid slot:</b>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {reasons.map((reason, i) => (
                            <li key={i}>{reason}</li>
                        ))}
                    </ul>
                </div>
            )}
        </span>
    );
};

export const MyCalendar = () => {
    const calendarRef = useRef<FullCalendar>(null);
    const { view, setView, setDateRange, dateRange, fetchAndStoreCalendarData, scheduledEvents, calendarContext } = useCalendarContext();

    // Generate background events for overlays (focus, availability) from calendarContext
    const backgroundEvents = React.useMemo(() => {
        const events: Partial<EventInput>[] = [];
        (Array.isArray(calendarContext) ? calendarContext : []).forEach(day => {
            // Focus overlay
            if (day.focus) {
                events.push({
                    start: day.date + 'T00:00:00',
                    end: day.date + 'T23:59:59',
                    display: 'background',
                    color: 'rgba(52, 152, 219, 0.15)', // blue for focus
                    id: `focus-${day.date}`
                });
            }
            // Availability overlay (if not available, show red background)
            if (!day.available) {
                events.push({
                    start: day.date + 'T00:00:00',
                    end: day.date + 'T23:59:59',
                    display: 'background',
                    color: 'rgba(231, 76, 60, 0.10)', // red for unavailable
                    id: `unavailable-${day.date}`
                });
            }
        });
        return events;
    }, [calendarContext]);

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

    // Custom rendering for events to show validation feedback
    const renderEventContent = (arg: EventContentArg) => {
        const { event, timeText } = arg;
        const validation = event.extendedProps.validation;
        const isInvalid = validation && validation.valid === false;
        const reasons = (validation && validation.reasons) || [];
        return (
            <div
                style={{
                    border: isInvalid ? '2px solid #e74c3c' : undefined,
                    background: isInvalid ? 'rgba(231,76,60,0.1)' : undefined,
                    borderRadius: 4,
                    padding: 2,
                    position: 'relative',
                }}
            >
                <b>{timeText}</b> <span>{event.title}</span>
                {isInvalid && (
                    <InvalidEventWithTooltip reasons={reasons}>
                        &#9888;
                    </InvalidEventWithTooltip>
                )}
            </div>
        );
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
              { events: staticBackgroundEvents },
              { events: backgroundEvents }
            ]}
            eventReceive={handleEventReceive}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            viewDidMount={handleViewDidMount}
            datesSet={handleDatesSet}
            eventContent={renderEventContent}
        />
    )
}