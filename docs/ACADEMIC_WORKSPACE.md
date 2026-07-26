# Academic Workspace — EEOS Release 1.1

## Overview

The Academic Workspace is the operational center of the institute. It connects Programs, Batch Types, Batches, Subjects, Sections, Classrooms, and Sessions into a single unified interface.

## Architecture

```
src/pages/AcademicDatabase.tsx   →  List/dashboard page at /academic
src/pages/AcademicWorkspace.tsx  →  Detail workspace at /academic/:entityId
```

### Backend Dependencies

| Engine | API Prefix | Tables |
|--------|-----------|--------|
| `academicPrograms` | `api.academicPrograms.*` | `academicPrograms` |
| `academicBatchTypes` | `api.academicBatchTypes.*` | `academicBatchTypes` |
| `academicBatches` | `api.academicBatches.*` | `academicBatches` |
| `academicSubjects` | `api.academicSubjects.*` | `academicSubjects` |
| `academicSections` | `api.academicSections.*` | `academicSections` |
| `academicClassrooms` | `api.academicClassrooms.*` | `academicClassrooms` |
| `academicSessions` | `api.academicSessions.*` | `academicSessions` |

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/academic` | `AcademicDatabase` | Main academic dashboard with tabbed entity views |
| `/academic?programId=xxx` | `AcademicDatabase` | Detail workspace for a specific program |
| `/academic?batchId=xxx` | `AcademicDatabase` | Detail workspace for a specific batch |

## Database Page Features

- **4 KPI Stats Cards** — Programs, Batches, Subjects, Sections counts
- **7 Entity Tabs** — Programs, Batch Types, Batches, Subjects, Sections, Classrooms, Sessions
- **Global Search** — Filter by name or code across entities
- **Responsive Card Grid** — Entity cards with color coding, badges, metadata, descriptions
- **Navigation** — Click program/batch cards to open detail workspace

## Workspace Tabs

| Tab | Content | Status |
|-----|---------|--------|
| Overview | KPI cards (Subjects, Faculty, Students, Hours) + entity details | ✅ Live |
| Subjects | Subject mapping and faculty allocation | 🟡 Placeholder (next release) |
| Faculty | Faculty assignments, teaching load, schedules | 🟡 Placeholder (next release) |
| Students | Enrollment, strength, progress tracking | 🟡 Placeholder (next release) |
| Timetable | Weekly schedule, room allocation, faculty timings | 🟡 Placeholder (next release) |
| Examinations | Exam schedule, results, analytics | 🟡 Placeholder (next release) |
| LMS | Lessons, assignments, quizzes, progress | 🟡 Placeholder (next release) |
| Documents | Resources and documents | 🟡 Placeholder (next release) |

## Platform Integration

### ✅ Complete
- **WorkspaceShell** — All pages use the shared workspace framework
- **People Registry** — Programs reference `academicSubVerticals` and `academicVerticals`
- **Calendar** — Timetable tab reserves future calendar integration

### 🟡 Pending (Backend Dependent)
- **Student Engine** — Enrollment counts in KPI cards
- **Examination Engine** — Exam schedule and results
- **LMS Engine** — Course progress and assignments
- **Faculty Engine** — Teaching load and assignments

## Usage

```typescript
// Navigate to academic dashboard
navigate("/academic");

// Navigate to a specific program
navigate("/academic?programId=<program_id>");

// Navigate to a specific batch
navigate("/academic?batchId=<batch_id>");
```

## Extension Guide

To add a new tab to the workspace:
1. Add a new `WorkspaceTabConfig` entry in `AcademicWorkspace.tsx`
2. Reference data from the appropriate Convex engine
3. Update this document

To add a new entity to the database page:
1. Add a new `TabsTrigger` in `AcademicDatabase.tsx`
2. Add the corresponding query
3. Create a card grid for the entity type
