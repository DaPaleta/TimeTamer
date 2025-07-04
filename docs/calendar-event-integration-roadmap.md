# Calendar Event Integration Roadmap

## Overview
This document outlines the implementation plan for integrating scheduled task events with the calendar UI, ensuring clarity, performance, and scalability. It covers both backend and frontend responsibilities, including calendar initialization and data pulling triggers. Each step includes a clear Definition of Done (DoD).

---

## Phase 0: Calendar Initialization & Data Fetching Triggers

### 0.1. Calendar Initialization (Frontend)
- **Action:**
  - On app/page load, initialize the calendar component (e.g., FullCalendar) with the default view (e.g., week or month) and the current date.
  - Set up state to track the current visible date range and view mode (day/week/month).
- **DoD:**
  - Calendar displays with the correct initial view and date.
  - State management (e.g., React context/store) holds the current view and date range.

### 0.2. Data Pulling Triggers
- **Action:**
  - Trigger data fetch for both scheduled events and calendar context whenever:
    - The calendar view changes (e.g., user switches from week to month).
    - The visible date range changes (e.g., user navigates to next/previous week/month).
    - The user logs in or switches accounts.
    - A task is created, updated, or deleted (to keep the calendar in sync).
    - CalendarDay context is updated (e.g., user changes work environment or focus slots).
- **DoD:**
  - Data is always up-to-date with the current calendar view and user actions.
  - No unnecessary or duplicate API calls (debounce/throttle as needed).

### 0.3. Data Fetching Logic
- **Action:**
  - On each trigger, fetch:
    - **Scheduled events:**
      - Call `/api/v1/tasks/scheduled?start=YYYY-MM-DD&end=YYYY-MM-DD` for the current visible range.
    - **Calendar context:**
      - Call `/api/v1/calendar/days?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` for the same range.
  - Store results in state for fast access and rendering.
- **DoD:**
  - Both events and context are fetched and available in state.
  - Calendar and task list update immediately after data is received.

---

## Phase 1: Backend – Scheduled Slots API

### 1.1. Scheduled Slots Data Model Review
- **Action:**
  - Review and, if needed, refine the `scheduled_slots` field on the `tasks` table/schema.
  - Ensure each slot includes: `start_time`, `end_time`, `calendar_day_id`.
- **DoD:**
  - Schema supports multiple scheduled slots per task, with all required fields present.

### 1.2. Efficient Event Query Endpoint
- **Action:**
  - Implement a new API endpoint:
    - `GET /api/v1/tasks/scheduled?start=YYYY-MM-DD&end=YYYY-MM-DD`
  - Returns all scheduled slots (with task info) for the user in the given date range.
  - Ensure efficient querying and proper indexing.
- **DoD:**
  - Endpoint returns all scheduled events for a date range in <200ms for typical user data.
  - Includes all info needed for calendar display (task title, slot times, category, etc.).
  - Covered by automated tests.

### 1.3. Scheduling Validation
- **Action:**
  - Ensure scheduling logic validates against the relevant `CalendarDay` (availability, focus, environment).
- **DoD:**
  - Scheduling API rejects invalid slots and returns clear error messages.
  - Validation logic is unit tested.

---

## Phase 2: Frontend – Calendar Event Rendering

### 2.1. Fetch Scheduled Events
- **Action:**
  - Update frontend to call the new `/tasks/scheduled` endpoint for the current calendar view's date range.
- **DoD:**
  - API is called when the calendar view changes.
  - Data is loaded and available in state.

### 2.2. Map Scheduled Slots to Calendar Events
- **Action:**
  - For each scheduled slot, create a FullCalendar event object.
  - Include task title, category color, and any relevant metadata.
- **DoD:**
  - All scheduled tasks appear as events on the calendar.
  - Unscheduled tasks remain in the task list.

### 2.3. Drag-and-Drop Scheduling
- **Action:**
  - Enable drag-and-drop of tasks onto the calendar.
  - On drop, call backend to update the task's `scheduled_slots`.
- **DoD:**
  - User can drag a task to the calendar, and it appears as an event.
  - Backend is updated and changes persist on reload.

---

## Phase 3: Calendar Context Integration

### 3.1. Fetch CalendarDay Context
- **Action:**
  - Fetch `/calendar/days` for the current view's date range.
  - Use this data for background coloring, focus/availability overlays, etc.
- **DoD:**
  - Calendar visually reflects work environment, focus, and availability for each day.

### 3.2. Scheduling Validation Feedback
- **Action:**
  - When scheduling a task, show warnings/errors if the slot conflicts with the day's context (e.g., outside focus time).
- **DoD:**
  - User receives immediate, clear feedback on scheduling conflicts.

---

## Additional Implementation Details

### A. State Management
- Use a global state (e.g., React Context, Redux, Zustand) to store:
  - Current calendar view and date range
  - Fetched scheduled events
  - Fetched calendar context (CalendarDay)
- **DoD:**
  - State updates trigger re-render of calendar and task list.

### B. Loading & Error Handling
- Show loading indicators while fetching data.
- Display error messages if API calls fail.
- **DoD:**
  - User always knows when data is loading or if something went wrong.

### C. Performance Optimizations
- Debounce rapid view/date changes to avoid excessive API calls.
- Cache results for recently viewed date ranges if appropriate.
- **DoD:**
  - No redundant network requests; smooth user experience.

---

## Definitions of Done (DoD) – Summary Table

| Step                        | DoD (Definition of Done)                                                                 |
|-----------------------------|-----------------------------------------------------------------------------------------|
| Calendar initialization     | Calendar shows correct initial view/date; state is set                                  |
| Data pulling triggers       | Data fetches on view/date/user changes, task/context updates; no redundant calls        |
| Data fetching logic         | Both events and context fetched for visible range; stored in state                      |
| Scheduled slots model       | Schema supports multiple slots per task, all required fields present                    |
| Scheduled events endpoint   | Returns all events for date range, performant, tested                                   |
| Scheduling validation       | Rejects invalid slots, clear errors, tested                                             |
| Fetch events (frontend)     | API called on view change, data in state                                                |
| Map to calendar events      | All scheduled tasks appear on calendar, unscheduled in list                             |
| Drag-and-drop scheduling    | User can drag tasks to calendar, backend updates, persists                              |
| Fetch calendar context      | CalendarDay data fetched and used for background/context                                |
| Scheduling feedback         | User sees warnings/errors for invalid scheduling                                        |
| State management            | State updates trigger UI updates                                                        |
| Loading/error handling      | User sees loading indicators and error messages as needed                               |
| Performance                 | Debounced/throttled API calls; no unnecessary requests                                  |

---

## Summary for Developers
- On calendar load or navigation:
  - Fetch both scheduled events and calendar context for the visible range.
- On any relevant user action (task or context change):
  - Re-fetch affected data to keep UI in sync.
- Keep state and UI tightly coupled:
  - Any change in state (from API or user) should immediately reflect in the calendar and task list.

---

**This plan ensures the calendar is always accurate, responsive, and efficient, providing a seamless experience for users and a clear structure for developers.** 