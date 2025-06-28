import React, { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { backgroundEvents } from './backgroundEvents';

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

    const handleEventReceive = (info: EventReceiveInfo) => {
        console.log('Event received:', info.event);
        // Handle the dropped task here
        // You can add logic to save the task to the calendar
    };

    return (
        <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            firstDay={0}
            weekends={true}
            hiddenDays={[5,6]}
            businessHours= {[ // specify an array instead
              {
                daysOfWeek: [ 0, 2, 4 ], // Monday, Tuesday, Wednesday
                startTime: '09:45', // 8am
                endTime: '18:00' // 6pm
              },
              {
                daysOfWeek: [ 1, 3 ], // Thursday, Friday
                startTime: '09:00', // 10am
                endTime: '18:00' // 4pm
              }
            ]}
            nowIndicator={true}
            scrollTime={'09:00:00'}
            headerToolbar= {{
              left: 'prev,next',
              center: 'title',
              right: 'timeGridWeek,timeGridDay' // user can switch between the two
            }}
            editable={true}
            droppable={true}
            selectable={true}
            selectMirror={true}
            events={[]}
            eventSources={[
              backgroundEvents
            ]}
            eventReceive={handleEventReceive}
        />
    )
}