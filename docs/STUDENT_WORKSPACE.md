# EEOS Student Workspace — Enterprise Student Management

## Overview

The Student Workspace is the central interface for managing student records within EEOS. Built on the **WorkspaceShell** framework from [PATCH-UI-001](WORKSPACE_FRAMEWORK.md), it provides a consistent, tab-driven experience for viewing and managing all student-related data.

### Architecture

```
StudentDatabase (list/search/filter)
      │
      ▼
StudentWorkspace (WorkspaceShell)
      │
      ├── Overview       → Student + Person data, contacts, academic profile
      ├── Enrollment     → Admission timeline, course allocation, batch assignment
      ├── Academic       → Academic history, subjects, credits
      ├── Attendance     → Attendance tracking (future)
      ├── Fees           → Fee structure, outstanding, payments
      ├── Examinations   → Exam schedules, results, marks (future)
      ├── LMS            → Courses, assignments, progress (future)
      ├── Documents      → Upload/view/delete (reuses WorkspaceDocumentsTab)
      ├── Timeline       → Activity timeline (reuses WorkspaceTimelineTab)
      ├── Tasks          → Task CRUD (reuses WorkspaceTasksTab)
      ├── Notes          → Comments & notes (reuses WorkspaceNotesTab)
      └── Activity       → Activity log (reuses WorkspaceActivityTab)
```

### Backend Integration

| Feature | Convex API | Table |
|---------|-----------|-------|
| Student CRUD | `studentEngine.getStudent`, `.createStudent`, `.updateStudent`, `.archiveStudent`, `.restoreStudent` | `studentMaster` |
| Student List | `studentEngine.listStudents` | `studentMaster` |
| Student Search | `studentSearch.searchStudents`, `.quickStudentSearch`, `.findByAdmissionNumber`, `.findByStudentCode` | `studentMaster` |
| Lifecycle | `studentLifecycle.admitStudent`, `.enrollStudent`, `.promoteStudent`, `.transferStudent`, `.suspendStudent`, `.reinstateStudent`, `.graduateStudent`, `.convertToAlumni` | `studentMaster`, `studentStatusHistory`, `studentTimeline` |
| Academic | `studentLifecycle.getStudentAcademicHistory` | `studentAcademicProfile` |
| Enrollment | `enrollmentEngine.createStudentFromLead`, `.allocateCourse`, `.assignBatch`, `.assignRollNumber`, `.completeAdmission`, `.cancelAdmission` | `studentMaster`, `studentAdmissions` |
| People Registry | `personEngine.getPerson`, `.searchPeople` | `personMaster`, `contactMethods`, `addresses` |
| Statistics | `studentLifecycle.getEnrollmentStats` | — (aggregated) |

### People Registry Integration

Students are **not standalone records**. Every student has a corresponding Person record in the Global People Registry (`personMaster`). Contact methods, addresses, profiles, and QR codes are all stored in People Registry tables, referenced by `personId`.

The `studentEngine.createStudent` mutation:
1. Creates a `personMaster` record
2. Creates `contactMethods` for phone/email
3. Creates a `personProfiles` record with profileType="student"
4. Generates a QR code in `personQRCode`
5. Creates the `studentMaster` record
6. Creates initial `studentStatusHistory` and `studentTimeline` events
7. Creates `studentAcademicProfile` if academic data is provided

### Routes

| Route | Page | Description |
|-------|------|-------------|
| `/students` | `StudentDatabase.tsx` | List, search, filter, create students |
| `/students/:studentId` | `StudentWorkspace.tsx` | Full student workspace with 12 tabs |

### Sidebar Navigation

The "Students" route is registered under **Business Modules** in the sidebar with a `GraduationCap` icon. It replaces the previous placeholder at `/studio/student`.

### Actions

The WorkspaceShell's SmartActionBar provides:

| Action | API | Status |
|--------|-----|--------|
| Promote | `studentLifecycle.promoteStudent` | 🔲 Available (not wired) |
| Transfer | `studentLifecycle.transferStudent` | 🔲 Available (not wired) |
| Suspend | `studentLifecycle.suspendStudent` | 🔲 Available (not wired) |
| Archive | `studentEngine.archiveStudent` | ✅ Wired |
| QR Code | `personEngine.generateQRCode` | 🔲 Available (not wired) |
| Certificate | `reportEngine.generateCertificate` | 🔲 Future |

### UI Components

| File | Purpose |
|------|---------|
| `src/pages/StudentDatabase.tsx` | Student list with search, status/branch filters, stats cards, create dialog |
| `src/pages/StudentWorkspace.tsx` | Student workspace with 12 tabs using WorkspaceShell |
| `src/components/workspace/WorkspaceShell.tsx` | Universal workspace shell |
| `src/components/workspace/WorkspaceOverviewTab.tsx` | Overview tab plugin |
| `src/components/workspace/WorkspaceTimelineTab.tsx` | Timeline tab plugin |
| `src/components/workspace/WorkspaceTasksTab.tsx` | Tasks tab plugin |
| `src/components/workspace/WorkspaceDocumentsTab.tsx` | Documents tab plugin |
| `src/components/workspace/WorkspaceNotesTab.tsx` | Notes tab plugin |
| `src/components/workspace/WorkspaceActivityTab.tsx` | Activity tab plugin |

### Acceptance Criteria

- [x] Student list with search, filter, pagination
- [x] Quick statistics (total, active, admitted, alumni)
- [x] Create student with People Registry integration
- [x] Student workspace with WorkspaceShell
- [x] 12 tabs covering all student domains
- [x] Person data from People Registry
- [x] Enrollment timeline
- [x] Academic history
- [x] Reusable shared tabs (Documents, Timeline, Tasks, Notes, Activity)
- [x] Route registered in sidebar (no longer placeholder)
- [x] Workspace actions (with Archive wired)
- [x] TypeScript clean
- [x] Lazy-loaded routes

### Future Enhancements

- [ ] Wire Promote, Transfer, Suspend actions to SmartActionBar
- [ ] Detailed Fee Ledger with invoices, receipts, outstanding
- [ ] Examination results, marks, rank display
- [ ] LMS courses, assignments, progress tracking
- [ ] Attendance records with calendar view
- [ ] Certificate generation (bonafide, TC, ID card)
- [ ] Batch operations (bulk promote, bulk archive)
- [ ] Export to PDF/CSV
