import React, { useCallback, useMemo } from 'react'
import type { EventClickArg } from '@fullcalendar/core'
import { transformDayContextToEvents, type DayContextEvent } from '../../utils/dayContextEvents'
import type { CalendarDayContext } from '../../api/calendar'

interface DayContextEventSourceProps {
  dayContexts: CalendarDayContext[]
  onEventClick?: (event: DayContextEvent, clickInfo: EventClickArg) => void
}

export const useDayContextEventSource = ({
  dayContexts,
  onEventClick,
}: DayContextEventSourceProps) => {
  const events = useMemo(() => {
    return transformDayContextToEvents(dayContexts)
  }, [dayContexts])

  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      if (onEventClick) {
        onEventClick(clickInfo.event as unknown as DayContextEvent, clickInfo)
      }
    },
    [onEventClick]
  )

  const eventClassNames = useCallback(
    (arg: { event: { extendedProps: DayContextEvent['extendedProps'] } }) => {
      const classes: string[] = []
      const extendedProps = arg.event.extendedProps

      // Add source indicator class
      classes.push(`source-${extendedProps.source}`)

      return classes
    },
    []
  )

  return {
    events,
    eventClick: handleEventClick,
    eventClassNames,
  }
}

// Hook for managing day context events
export const useDayContextEvents = (dayContexts: CalendarDayContext[]) => {
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null)
  const [selectedEventType, setSelectedEventType] = React.useState<
    'work_environment' | 'focus_slot' | null
  >(null)
  const [selectedEventData, setSelectedEventData] = React.useState<Record<string, unknown> | null>(
    null
  )

  const clearSelection = useCallback(() => {
    setSelectedDate(null)
    setSelectedEventType(null)
    setSelectedEventData(null)
  }, [])

  const eventSource = useDayContextEventSource({
    dayContexts,
  })

  return {
    eventSource,
    selectedDate,
    selectedEventType,
    selectedEventData,
    clearSelection,
  }
}
