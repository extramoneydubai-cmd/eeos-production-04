# EEOS Enterprise Calendar & Scheduling Platform

**PATCH-UI-003** — Complete enterprise scheduling platform with Day, Week, Month, and Agenda views.

---

## Overview

The Calendar Platform provides centralized scheduling for all EEOS entities. Every module — CRM, HR, Student, Academics, Examinations, LMS, Finance — creates calendar events through the Calendar SDK.

### Features

| Feature | Description |
|---------|-------------|
| **Day View** | Hour-by-hour timeline with event blocks, click to create |
| **Week View** | 7-day grid with time slots, events per day/hour |
| **Month View** | Full monthly calendar grid with event dots, expand on click |
| **Agenda View** | Upcoming 90-day list grouped by date |
| **Event Types** | Meeting, Task, Follow-up, Lecture, Examination, Leave, Birthday, Appointment, Interview, Booking, Company Event, Custom |
| **Create Event** | Modal form with title, type, date/time, location, recurrence, reminders, color |
| **Edit/Delete** | Click any event to edit or delete |
| **Search** | Filter events by title |
| **Type Filter** | Filter by event type |
| **Date Navigation** | Previous/next, Today button, mini calendar sidebar |
| **Today Sidebar** | Quick view of today's events |
| **Recurrence** | Daily, Weekly, Monthly, Weekdays |
| **Reminders** | 5min, 15min, 30min, 1hr, 1 day before |
| **Color Coding** | Color per event type, customizable per event |

---

## Architecture

```
CalendarPage.tsx                 →  api.calendarSdk.*
  ├── DayView                    →  Hour timeline with events
  ├── WeekView                   →  7-column time grid
  ├── MonthView                  →  Calendar grid with event dots
  ├── AgendaView                 →  Upcoming event list
  ├── EventFormDialog            →  Create/edit form with recurrence
  ├── SideCalendar               →  Mini month picker
  └── TodaySidebar               →  Today's events summary
  
Schema:
  calendarEvents                  →  Table with full indexing
  api.calendarSdk.*               →  SDK-based CRUD operations
```

---

## Backend

### Schema Table: `calendarEvents`

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | Event title |
| `description` | `string?` | Event description |
| `eventType` | `string` | meeting, task, follow_up, lecture, examination, leave, birthday, appointment, interview, booking, company_event, other |
| `startTime` | `number` | Unix timestamp |
| `endTime` | `number?` | Unix timestamp |
| `allDay` | `boolean` | All-day event flag |
| `location` | `string?` | Room, link, or address |
| `color` | `string?` | Hex color code |
| `recurrence` | `string?` | daily, weekly, monthly, weekdays |
| `recurrenceEnd` | `number?` | Recurrence end date |
| `entityType` | `string?` | Related entity type (lead, student, etc.) |
| `entityId` | `string?` | Related entity ID |
| `ownerId` | `Id<"users">?` | Event owner |
| `assignedTo` | `Id<"users">?` | Assigned user |
| `participants` | `Id<"users">[]?` | Event participants |
| `companyId` | `Id<"companies">?` | Company scope |
| `branchId` | `Id<"branches">?` | Branch scope |
| `departmentId` | `Id<"departments">?` | Department scope |
| `status` | `string` | scheduled, completed, cancelled |
| `reminderMinutes` | `number?` | Minutes before to remind |
| `attachmentIds` | `string[]?` | Attached document IDs |

### Indexes

| Index | Fields | Purpose |
|-------|--------|---------|
| `startTime` | `startTime` | Date range queries |
| `ownerId` | `ownerId` | User's events |
| `assignedTo` | `assignedTo` | Assigned events |
| `eventType` | `eventType` | Type filtering |
| `status` | `status` | Status filtering |
| `entityType_entityId` | `entityType, entityId` | Entity-linked events |
| `by_company` | `companyId, startTime` | Company scope |
| `by_branch` | `branchId, startTime` | Branch scope |

### SDK Methods (via `calendarSdk.ts`)

| Method | Description |
|--------|-------------|
| `createEvent(args)` | Create a new calendar event |
| `getEventsInRange({ startTime, endTime, ... })` | Get events by date range with optional filters |
| `getEntityEvents({ entityType, entityId })` | Get events linked to an entity |
| `updateEvent({ eventId, ... })` | Update event fields |
| `removeEvent({ eventId })` | Delete an event |
| `getUpcoming({ userId, days })` | Get upcoming events for a user |
| `getTodayEvents({ userId })` | Get today's events for a user |

---

## Event Types & Colors

| Type | Color | Icon |
|------|-------|------|
| Meeting | `#4285f4` (Blue) | `Video` |
| Task | `#34a853` (Green) | `Check` |
| Follow-up | `#fbbc04` (Yellow) | `MessageSquare` |
| Lecture | `#a855f7` (Purple) | `BookOpen` |
| Examination | `#ea4335` (Red) | `FileCheck` |
| Leave | `#f59e0b` (Amber) | `Coffee` |
| Birthday | `#ec4899` (Pink) | `Cake` |
| Appointment | `#06b6d4` (Cyan) | `Stethoscope` |
| Interview | `#8b5cf6` (Violet) | `Users` |
| Booking | `#0d9488` (Teal) | `CalendarRange` |
| Company Event | `#6366f1` (Indigo) | `Star` |
| Other | `#9aa0a6` (Gray) | `CalendarIcon` |

---

## Route

| Path | Component | Sidebar |
|------|-----------|---------|
| `/calendar` | `CalendarPage.tsx` | ✅ Under "Business Modules" |

## File Inventory

| File | Type | Purpose |
|------|------|---------|
| `src/pages/CalendarPage.tsx` | Page | Full calendar with all views + event CRUD |
| `src/convex/schema/calendar.ts` | Schema | calendarEvents table definition |
| `src/convex/schema.ts` | Config | Barrel export for calendarTables |
| `src/platform/sdk/calendarSdk.ts` | SDK | Calendar SDK (pre-existing) |
| `src/main.tsx` | Config | Lazy import + route |
| `src/lib/routes.ts` | Config | Route + sidebar registration |
| `docs/CALENDAR_PLATFORM.md` | Doc | This document |

---

## Platform Integration

| SDK | Integration Status |
|-----|-------------------|
| calendarSdk | ✅ Directly consumed |
| notificationSdk | 🔄 Ready (reminders) |
| timelineSdk | 🔄 Ready (event timeline) |
| eventSdk | 🔄 Ready (platform events) |
| visibilitySdk | 🔄 Ready (permissioned views) |
| People Registry | 🔄 Ready (participants) |
