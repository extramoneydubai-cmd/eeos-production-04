# EEOS Examination Engine — Release 1.0

## Overview

The Examination Engine is a complete exam lifecycle management module integrated with the Academic Engine, Student Engine, People Registry, Workflow Engine, Timeline Engine, and Notification Engine.

## Domain Ownership

**Examination Engine owns:**
- Exam Templates & Types
- Exam Sessions & Scheduling
- Exam Timetable & Hall Allocation
- Invigilator Assignment
- Marks Entry & Moderation
- Grade Rules & Calculation
- Result Processing & Rank
- Report Cards
- Publish Workflow

**Does NOT duplicate:**
- Students (references `personMaster`)
- Faculty (references `users`)
- Subjects (references `academicSubjects`)
- Batches/Courses (references academic tables)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     EXAMINATION ENGINE                            │
│                                                                  │
│   examTemplates → examSessions → examSubjects                    │
│                                       │                          │
│                            ┌──────────┴──────────┐               │
│                            │                     │               │
│                     examTimetable         examHallAllocation      │
│                            │                                     │
│                     examAttendance                                │
│                            │                                     │
│                       examMarks                                   │
│                            │                                     │
│                    ┌───────┴────────┐                             │
│                    │                │                             │
│             examResults      examGradeRules                       │
│                    │                                              │
│             examReportCards                                       │
│                                                                  │
│   Cross-cutting: examTimeline, examPublishLog, examInvigilators  │
└─────────────────────────────────────────────────────────────────┘
```

## Database Tables (11)

| Table | Purpose | Key Indexes |
|-------|---------|-------------|
| `examTemplates` | Exam type definitions (Unit Test, Final, etc.) | code, isActive |
| `examSessions` | Exam instances linked to academic structure | branchId, batchId, status, startDate |
| `examSubjects` | Subjects within a session with max marks | examSessionId, subjectId |
| `examTimetable` | Scheduled exam slots with faculty, room, time | examSessionId, examDate, roomId |
| `examHallAllocation` | Student seat assignment per timetable | timetableId, studentId, roomId |
| `examAttendance` | Per-subject student attendance tracking | examSessionId, studentId, subjectId |
| `examMarks` | Marks with moderation support (moderatedMarks) | examSessionId, studentId, examSubjectId |
| `examGradeRules` | Configurable grade boundaries (JSON rules) | code, isActive |
| `examResults` | Calculated results with grade, CGPA, division, rank | examSessionId, studentId, rank |
| `examReportCards` | Cached report card data for student portal | examSessionId, studentId, resultId |
| `examPublishLog` | Workflow audit trail (draft→published→archived) | examSessionId, performedBy |
| `examTimeline` | Chronological event stream per session | examSessionId, eventType |
| `examInvigilators` | Invigilator assignments per timetable slot | timetableId, invigilatorId |

## Features

### 1. Exam Templates
- 9 types: Unit Test, Weekly Test, Monthly Test, Mid Term, Final Exam, Practical, Viva, Mock Test, Custom
- Configurable duration, max marks, pass percentage, weightage, grade scheme

### 2. Exam Sessions
- Links to Academic Session, Branch, Course, Batch, Section
- Status workflow: `draft → scheduled → in_progress → completed → published → archived`
- Coordinator assignment, instructions, metadata

### 3. Exam Timetable
- Subject, Faculty, Room (classroom), Date, Start/End Time, Duration
- Hall capacity tracking for allocation

### 4. Hall Allocation
- Per-timetable student seat assignment
- Supports bench/seat numbers, row/column grid
- Bulk allocation available
- Prevents duplicate allocation

### 5. Attendance
- Per-student, per-subject attendance: Present, Absent, Medical, Leave
- Bulk mark entry for entire classes
- Integrated with marks entry (absences auto-zero marks)

### 6. Marks Entry
- Manual single-entry and CSV-like bulk import
- Grace marks support
- Automatic percentage calculation
- Duplicate detection (updates existing entry)
- Recalculation on update

### 7. Moderation
- Individual mark moderation with moderatedMarks field
- Bulk moderation: increase all, decrease all, set common value
- Moderation notes for audit trail
- Moderation request/workflow via publish log

### 8. Grade Rules
- Fully configurable grade boundaries
- Default standard scheme: A+ (90+), A (80+), B+ (70+), B (60+), C+ (50+), C (40+), D (33+), F (<33)
- Custom rules applicable to specific templates or globally
- Grade point calculation for CGPA

### 9. Result Calculation
- Subject-wise grade and grade point calculation
- Overall percentage, CGPA, grade, division
- Division classification: Distinction, First, Second, Third, Fail
- Uses moderated marks when available

### 10. Rank Calculation
- Automatic rank assignment during result calculation
- Tie-breaking: same percentage = same rank
- Manual re-calculation available

### 11. Analytics
- Result stats: pass/fail counts, pass percentage, average percentage
- Subject-wise analysis: avg/highest/lowest marks per subject
- Division distribution chart data
- Top performers list with student names
- Upcoming exams list

### 12. Publish Workflow
- `draft → scheduled → in_progress → completed → published → archived`
- Full publish log with who did what and when
- Timeline events at every transition
- Results only visible to students/parents after `published`

### 13. Student Portal
- View all published results with subject breakdowns
- View upcoming exams with timetable
- Download report cards

### 14. Parent Portal
- View student's published results
- Performance trend (average, best)
- Latest exam summary

## API Reference

### examEngine.ts (18 exports)

| Function | Type | Description |
|----------|------|-------------|
| `listExamTemplates` | query | List with optional active-only filter |
| `getExamTemplate` | query | Get single template |
| `createExamTemplate` | mutation | Create with event pipeline |
| `updateExamTemplate` | mutation | Update with audit |
| `listExamSessions` | query | Filtered by status, branch, course, batch, date range |
| `getExamSession` | query | Single session |
| `getExamSessionDetail` | query | Full detail with subjects, timetable, marks, results, timeline |
| `createExamSession` | mutation | Creates with timeline + publish log entry |
| `updateExamSessionStatus` | mutation | Status transitions with audit |
| `listExamSubjects` | query | Subjects for a session |
| `addExamSubject` | mutation | Add subject to session |
| `removeExamSubject` | mutation | Remove subject |
| `listExamTimetable` | query | Timetable for session |
| `createTimetableEntry` | mutation | Add timetable slot |
| `updateTimetableEntry` | mutation | Update slot |
| `deleteTimetableEntry` | mutation | Delete slot |
| `listHallAllocations` | query | Seats for session/timetable/room |
| `allocateSeat` | mutation | Allocate a single seat (prevents duplicates) |
| `bulkAllocateSeats` | mutation | Allocate many seats at once |
| `removeSeatAllocation` | mutation | Remove a seat |
| `getSeatPlan` | query | Full seat plan with student names |
| `listGradeRules` | query | List grade rule sets |
| `getGradeRule` | query | Single grade rule set |
| `getDefaultGradeRules` | query | Default standard grade scheme |
| `createGradeRules` | mutation | Create custom grade rules |
| `updateGradeRules` | mutation | Update grade rules |
| `deleteGradeRules` | mutation | Delete grade rules |
| `listInvigilators` | query | Invigilators for timetable slot |
| `assignInvigilator` | mutation | Assign invigilator |
| `removeInvigilator` | mutation | Remove invigilator |
| `getExamTimeline` | query | Timeline for a session |
| `getExamDashboardStats` | query | Dashboard KPI counts |
| `getUpcomingExams` | query | Future exams for widget |
| `getPendingMarksSessions` | query | Sessions awaiting marks entry |

### marksEngine.ts (13 exports)

| Function | Type | Description |
|----------|------|-------------|
| `listExamMarks` | query | Marks for session/subject |
| `getStudentMarks` | query | Marks for a specific student |
| `getSubjectMarks` | query | Marks for a specific subject |
| `getPendingMarksCount` | query | Pending vs entered counts |
| `getMarksVerificationStatus` | query | Verified/moderated counts |
| `enterMarks` | mutation | Single marks entry (upserts) |
| `bulkImportMarks` | mutation | Bulk import |
| `updateMarks` | mutation | Update with auto-recalculation |
| `verifyMarks` | mutation | Mark entries as verified |
| `moderateMarks` | mutation | Moderate single marks entry |
| `bulkModerateMarks` | mutation | Bulk moderate (increase/decrease/set) |
| `requestModeration` | mutation | Request moderation workflow |
| `markAttendance` | mutation | Single attendance entry |
| `bulkMarkAttendance` | mutation | Bulk attendance entry |
| `getAttendance` | query | Attendance for session/subject |
| `calculateGrade` | helper | Grade from percentage (configurable rules) |
| `calculateCgpa` | helper | CGPA from grade points |

### resultEngine.ts (12 exports)

| Function | Type | Description |
|----------|------|-------------|
| `listExamResults` | query | Results with optional pass/fail/division filter |
| `getStudentResult` | query | Single student result |
| `getResultStats` | query | Stats: pass%, avg%, division distribution, top performers |
| `getSubjectWiseAnalysis` | query | Per-subject avg/high/low marks |
| `getDivisionDistribution` | query | Division counts for charts |
| `calculateResults` | mutation | Full result calculation with report cards |
| `calculateRanks` | mutation | Recalculate ranks only |
| `getTopPerformers` | query | Top N students by rank |
| `publishResults` | mutation | Publish with workflow audit |
| `getStudentResultCard` | query | Full result card with report data |
| `trackReportDownload` | mutation | Track report card downloads |
| `getStudentPortalResults` | query | Student's published results with subject breakdown |
| `getStudentUpcomingExams` | query | Student's upcoming exams with timetable |
| `getParentPortalResults` | query | Parent view of student results |
| `getParentPortalPerformance` | query | Performance trend for parent dashboard |

## Integrations

| Integration | Direction | How |
|-------------|-----------|-----|
| Academic Engine | Uses | courses, batches, sections, subjects, sessions |
| Student Engine | Uses | personMaster (studentId reference) |
| People Registry | Uses | personMaster for student names |
| Timeline Engine | Built-in | examTimeline table with event types |
| Notification Engine | Via SDK | On publish results, marks entered |
| Dashboard | Exposes | getExamDashboardStats, getUpcomingExams, getPendingMarksSessions |
| Reports | Exposes | getResultStats, getSubjectWiseAnalysis |

## Workflow States

```
draft ──→ scheduled ──→ in_progress ──→ completed ──→ published ──→ archived
                   ↕                      ↕              ↕
                                        moderation_requested
                                              ↕
                                        moderation_approved
                                              ↕
                                        moderation_rejected
```

## Seed Data

The engine includes demo data with:
- 6 exam templates (Unit Test, Mid Term, Final, Practical, Mock, Viva)
- 2 exam sessions (2025 Mid Term, 2025 Final)
- Standard grade rules
- Sample subjects mapped to academic structure
- Timeline events for demo visibility
