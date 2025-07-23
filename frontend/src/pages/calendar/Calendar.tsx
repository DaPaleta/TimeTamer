import React, { useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useCalendarContext } from '../../context/CalendarContext'
import type {
  ViewContentArg,
  DatesSetArg,
  EventDropArg,
  EventApi,
  EventContentArg,
  EventInput,
} from '@fullcalendar/core'
import type { CalendarView } from '../../context/CalendarContext'
import { updateTask } from '../../api/tasks'
import { useDayContextEventSource } from '../../components/calendar/DayContextEventSource'
import DailyOverrideDialog from '../../components/calendar/DailyOverrideDialog'
import TaskDetailsDialog from '../../components/calendar/TaskDetailsDialog'
import { updateCalendarDay, createCalendarDay } from '../../api/calendar'
import type { FocusSlot } from '../../api/calendar'
import '../../styles/dayContextEvents.css'
import '../../styles/dailyOverrideDialog.css'

interface EventReceiveInfo {
  event: {
    title: string
    start: Date | null
    end: Date | null
    extendedProps: Record<string, unknown>
  }
}

// Tooltip component for invalid events
const InvalidEventWithTooltip: React.FC<{
  reasons: string[]
  children: React.ReactNode
}> = ({ reasons, children }) => {
  const [showTooltip, setShowTooltip] = React.useState(false)
  return (
    <span
      style={{
        color: '#e74c3c',
        marginLeft: 4,
        position: 'relative',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip((v) => !v)}
    >
      {children}
      {showTooltip && (
        <div
          style={{
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
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          <b>Invalid slot:</b>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {reasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </span>
  )
}

export const MyCalendar = () => {
  const calendarRef = useRef<FullCalendar>(null)
  const {
    view,
    setView,
    setDateRange,
    dateRange,
    fetchAndStoreCalendarData,
    invalidateCalendarCache,
    scheduledEvents,
    calendarContext,
  } = useCalendarContext()

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'work_environment' | 'focus_slot' | null>(null)
  const [dialogData, setDialogData] = useState<{
    date: string
    environment?: string
    source?: string
    slot?: FocusSlot
    slotIndex?: number
  } | null>(null)

  // Task details dialog state
  const [taskDetailsDialogOpen, setTaskDetailsDialogOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  // Dialog handlers
  const handleDialogSave = async (
    type: 'work_environment' | 'focus_slot',
    data: Record<string, unknown>
  ) => {
    console.log(`Saving ${type} override:`, data)

    try {
      const date = data.date as string
      const currentDay = calendarContext.find((day) => day.date === date)
      if (!currentDay) {
        throw new Error('Day not found in context')
      }

      if (type === 'work_environment') {
        const environment = data.environment as string
        try {
          await updateCalendarDay(date, { work_environment: environment })
        } catch (updateError) {
          console.log('Update failed, creating new day:', updateError)
          // If update fails, create the day
          await createCalendarDay({
            date,
            work_environment: environment,
            focus_slots: currentDay.focus_slots,
            availability_slots: currentDay.availability_slots,
          })
        }
      } else if (type === 'focus_slot') {
        const slotIndex = data.slotIndex as number
        const updatedSlot = data.slot as FocusSlot

        // Create updated focus slots
        const updatedFocusSlots = [...currentDay.focus_slots]
        updatedFocusSlots[slotIndex] = updatedSlot

        try {
          await updateCalendarDay(date, { focus_slots: updatedFocusSlots })
        } catch (updateError) {
          console.log('Update failed, creating new day:', updateError)
          // If update fails, create the day
          await createCalendarDay({
            date,
            work_environment: currentDay.work_environment,
            focus_slots: updatedFocusSlots,
            availability_slots: currentDay.availability_slots,
          })
        }
      }

      // Invalidate cache and reload data
      invalidateCalendarCache()
      await fetchAndStoreCalendarData(dateRange)

      setDialogOpen(false)
      setDialogType(null)
      setDialogData(null)
    } catch (error) {
      console.error('Failed to save override:', error)
      alert('Failed to save override. Please try again.')
    }
  }

  const handleDialogDelete = async (type: 'focus_slot', data: Record<string, unknown>) => {
    console.log(`Deleting ${type} override:`, data)

    try {
      const date = data.date as string
      const slotIndex = data.slotIndex as number

      // Get current day context
      const currentDay = calendarContext.find((day) => day.date === date)
      if (!currentDay) {
        throw new Error('Day not found in context')
      }

      // Remove the focus slot
      const updatedFocusSlots = currentDay.focus_slots.filter((_, index) => index !== slotIndex)

      try {
        await updateCalendarDay(date, { focus_slots: updatedFocusSlots })
      } catch (updateError) {
        console.log('Update failed, creating new day:', updateError)
        // If update fails, create the day
        await createCalendarDay({
          date,
          work_environment: currentDay.work_environment,
          focus_slots: updatedFocusSlots,
          availability_slots: currentDay.availability_slots,
        })
      }

      // Invalidate cache and reload data
      invalidateCalendarCache()
      await fetchAndStoreCalendarData(dateRange)

      setDialogOpen(false)
      setDialogType(null)
      setDialogData(null)
    } catch (error) {
      console.error('Failed to delete focus slot:', error)
      alert('Failed to delete focus slot. Please try again.')
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setDialogType(null)
    setDialogData(null)
  }

  // Task details dialog handlers
  const handleTaskDetailsClose = () => {
    setTaskDetailsDialogOpen(false)
    setSelectedTaskId(null)
  }

  const handleTaskUpdated = () => {
    // Refresh calendar data when task is updated
    fetchAndStoreCalendarData(dateRange)
  }

  const handleTaskUnscheduled = () => {
    // Invalidate cache and refresh calendar data when task is unscheduled
    invalidateCalendarCache()
    fetchAndStoreCalendarData(dateRange)
  }

  // Handle FullCalendar event clicks
  const handleEventClick = (clickInfo: { event: { extendedProps: Record<string, unknown> } }) => {
    const event = clickInfo.event
    const extendedProps = event.extendedProps
    const eventType = extendedProps.type as string
    const eventDate = extendedProps.date as string
    const eventSource = extendedProps.source as string

    // Check if this is a day context event
    if (eventType === 'work_environment') {
      const environment = extendedProps.work_environment as string
      console.log(`Work environment clicked: ${eventDate} - ${environment} (${eventSource})`)
      setDialogType('work_environment')
      setDialogData({ date: eventDate, environment, source: eventSource })
      setDialogOpen(true)
      return
    }

    // Check if this is a scheduled task event
    const taskId = (extendedProps.taskId as string) || (extendedProps.task_id as string)
    if (taskId) {
      console.log(`Scheduled task clicked: ${taskId}`)
      setSelectedTaskId(taskId)
      setTaskDetailsDialogOpen(true)
      return
    }

    // Focus slots are handled via right-click in eventContent
  }

  // Generate day context events from calendarContext
  const dayContextEventSource = useDayContextEventSource({
    dayContexts: Array.isArray(calendarContext) ? calendarContext : [],
  })

  // Legacy background events (keeping for compatibility)
  const backgroundEvents = React.useMemo(() => {
    const events: Partial<EventInput>[] = []
    // Note: Focus and availability are now handled by day context events
    return events
  }, [])

  const handleEventReceive = async (info: EventReceiveInfo) => {
    console.log('Event received:', info.event)
    // Extract dropped taskId and times
    const taskId =
      (info.event.extendedProps.taskId as string) || (info.event.extendedProps.task_id as string)
    const start = info.event.start
    const end = info.event.end
    if (!taskId || !start || !end) {
      alert(
        `Could not schedule task: missing data\n\tEvent: ${info.event}\n\tTask ID: ${taskId}\n\tStart: ${start}\n\tEnd: ${end}`
      )
      return
    }
    // Format times as ISO strings
    const startTime = start.toISOString()
    const endTime = end.toISOString()
    // Add scheduled slot to the task
    try {
      await updateTask(taskId, {
        scheduled_slots: [{ start_time: startTime, end_time: endTime, calendar_day_id: null }],
      })
      // Refresh calendar data and unscheduled tasks
      fetchAndStoreCalendarData(dateRange)
    } catch {
      alert('Failed to schedule task.')
    }
  }

  // Called when the user changes the view (week/day)
  const handleViewDidMount = (arg: ViewContentArg) => {
    setView(arg.view.type as CalendarView)
  }

  // Called when the user navigates (prev/next/today)
  const handleDatesSet = (arg: DatesSetArg) => {
    const newRange = {
      start: arg.startStr,
      end: arg.endStr,
    }
    if (dateRange.start !== newRange.start || dateRange.end !== newRange.end) {
      setDateRange(newRange)
    }
  }

  // Handle event drag-and-drop within the calendar
  const handleEventDrop = async (info: EventDropArg) => {
    const event = info.event
    const taskId = (event.extendedProps.taskId as string) || (event.extendedProps.task_id as string)
    const start = event.start
    const end = event.end
    if (!taskId || !start || !end) {
      alert(
        `Could not schedule task: missing data\n\tEvent: ${event}\n\tTask ID: ${taskId}\n\tStart: ${start}\n\tEnd: ${end}`
      )
      info.revert()
      return
    }
    try {
      await updateTask(taskId, {
        scheduled_slots: [
          {
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            calendar_day_id: null,
          },
        ],
      })
      fetchAndStoreCalendarData(dateRange)
    } catch {
      alert('Failed to update scheduled task.')
      info.revert()
    }
  }

  // Handle event resize within the calendar (see FullCalendar eventResize signature)
  const handleEventResize = async (info: { event: EventApi; revert: () => void }) => {
    const event = info.event
    const taskId = (event.extendedProps.taskId as string) || (event.extendedProps.task_id as string)
    const start = event.start
    const end = event.end
    if (!taskId || !start || !end) {
      alert(
        `Could not resize scheduled task: missing data\n\tEvent: ${event}\n\tTask ID: ${taskId}\n\tStart: ${start}\n\tEnd: ${end}`
      )
      info.revert()
      return
    }
    try {
      await updateTask(taskId, {
        scheduled_slots: [
          {
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            calendar_day_id: null,
          },
        ],
      })
      fetchAndStoreCalendarData(dateRange)
    } catch {
      alert('Failed to update scheduled task.')
      info.revert()
    }
  }

  // Custom rendering for events to show validation feedback and handle right-clicks
  const renderEventContent = (arg: EventContentArg) => {
    const { event, timeText } = arg
    const validation = event.extendedProps.validation
    const isInvalid = validation && validation.valid === false
    const reasons = (validation && validation.reasons) || []

    // Check if this is a day context event
    const extendedProps = event.extendedProps as Record<string, unknown>
    const eventType = extendedProps.type as string
    const eventDate = extendedProps.date as string
    const eventSource = extendedProps.source as string
    const isDayContextEvent = eventType === 'work_environment' || eventType === 'focus_slot'

    const handleRightClick = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (eventType === 'focus_slot') {
        // Find the original slot data
        const dayContext = calendarContext.find((day) => day.date === eventDate)
        const slotIndex = parseInt(event.id.split('-').pop() || '0')
        const slot = dayContext?.focus_slots[slotIndex]

        if (slot) {
          console.log(
            `Focus slot right-clicked: ${eventDate} - ${slot.focus_level} (${eventSource})`
          )
          setDialogType('focus_slot')
          setDialogData({
            date: eventDate,
            slot,
            slotIndex,
            source: eventSource,
          })
          setDialogOpen(true)
        }
      }
    }

    return (
      <div
        style={{
          border: isInvalid ? '2px solid #e74c3c' : undefined,
          background: isInvalid ? 'rgba(231,76,60,0.1)' : undefined,
          borderRadius: 4,
          padding: 2,
          position: 'relative',
        }}
        onContextMenu={isDayContextEvent ? handleRightClick : undefined}
      >
        <b>{timeText}</b> <span>{event.title}</span>
        {isInvalid && <InvalidEventWithTooltip reasons={reasons}>&#9888;</InvalidEventWithTooltip>}
      </div>
    )
  }

  return (
    <>
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView={view}
        firstDay={0}
        weekends={true}
        hiddenDays={[5, 6]}
        businessHours={[
          {
            daysOfWeek: [0, 2, 4],
            startTime: '09:45',
            endTime: '18:00',
          },
          {
            daysOfWeek: [1, 3],
            startTime: '09:00',
            endTime: '18:00',
          },
        ]}
        nowIndicator={true}
        scrollTime={'09:00:00'}
        headerToolbar={{
          left: 'prev,next',
          center: 'title',
          right: 'timeGridWeek,timeGridDay',
        }}
        editable={true}
        droppable={true}
        // selectable={true}
        // selectMirror={true}
        eventSources={[
          { events: scheduledEvents },
          { events: backgroundEvents },
          dayContextEventSource,
        ]}
        eventReceive={handleEventReceive}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        eventClick={handleEventClick}
        viewDidMount={handleViewDidMount}
        datesSet={handleDatesSet}
        eventContent={renderEventContent}
      />

      <DailyOverrideDialog
        isOpen={dialogOpen}
        type={dialogType}
        data={dialogData}
        onSave={handleDialogSave}
        onDelete={handleDialogDelete}
        onClose={handleDialogClose}
      />

      <TaskDetailsDialog
        isOpen={taskDetailsDialogOpen}
        taskId={selectedTaskId}
        onClose={handleTaskDetailsClose}
        onTaskUpdated={handleTaskUpdated}
        onTaskUnscheduled={handleTaskUnscheduled}
      />
    </>
  )
}
