# DOC-07 — Student Lifecycle & Student 360° Bible

> **Status:** Architecture Blueprint (Draft)  
> **Domain:** Student Management  
> **Owner:** EEOS Architecture Team  
> **Version:** 1.0  
> **Last Updated:** 2026-07-08  
> **Predecessor:** DOC-05 — Lead V2 Architecture Bible, DOC-06 — Admission & Enrollment Engine Bible

---

## Table of Contents

1. [Student Philosophy](#1-student-philosophy)
2. [Student Lifecycle](#2-student-lifecycle)
3. [Student Master Entity](#3-student-master-entity)
4. [Student 360° Dashboard](#4-student-360-dashboard)
5. [Academic Profile](#5-academic-profile)
6. [Attendance](#6-attendance)
7. [Assessment & Examination](#7-assessment--examination)
8. [Fee Relationship](#8-fee-relationship)
9. [Communication](#9-communication)
10. [Documents](#10-documents)
11. [Medical Profile](#11-medical-profile)
12. [Transport](#12-transport)
13. [Hostel](#13-hostel)
14. [Library](#14-library)
15. [Certificates](#15-certificates)
16. [Placement](#16-placement)
17. [Student Timeline](#17-student-timeline)
18. [Student Analytics](#18-student-analytics)
19. [AI Opportunities](#19-ai-opportunities)
20. [Parent Portal View](#20-parent-portal-view)
21. [Student Mobile App](#21-student-mobile-app)
22. [Implementation Roadmap](#22-implementation-roadmap)
23. [Golden Rules](#23-golden-rules)

---

## 1. Student Philosophy

### Purpose

The Student is the **central operational entity** of EEOS. After admission is completed, the student record becomes the hub around which all academic, financial, and operational activities revolve.

The Student Management module is **not a silo** — it is a coordination layer that references and orchestrates data from other modules without duplicating it.

### Core Distinctions

| Term | Definition | When | Owner |
|------|-----------|------|-------|
| **Lead** | A potential customer showing interest | Before sale | CRM |
| **Admission** | The process of converting a lead | During sale | Admission Engine |
| **Student** | An enrolled individual with academic lifecycle | Post-sale | Student Management |
| **Enrollment** | Academic activation in a batch/program | Per session | Academics |
| **Alumni** | A former student who completed/graduated | After completion | Alumni Relations |

### Business Rules

1. **Student NEVER duplicates Lead data.** Student inherits from lead via admission — nothing is copied manually.
2. **Student NEVER duplicates Family data.** Family and FamilyContacts are reused from Lead V2.
3. **Finance owns ALL payments.** Student only displays fee status — never stores financial records.
4. **Academics owns learning.** Student references batches, subjects, and timetable — never duplicates them.
5. **Communication ALWAYS uses Family Contacts.** No phone numbers stored directly on student record.
6. **One family can have many students.** Siblings share the same family record.
7. **Student status is progressive.** Active → Inactive → Transferred → Graduated → Alumni.
8. **Student timeline is continuous.** Activity from lead stage continues seamlessly through student lifecycle.
9. **Every student has one active record.** Historical data is preserved through status changes.
10. **Student is the operational center.** All modules (Finance, Academics, Attendance, Communication) revolve around the student.

### The Student Ecosystem

```
                    ┌─────────────────────────┐
                    │     Family (Shared)      │
                    │  └── FamilyContacts      │
                    └───────────┬─────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Student 1    │     │    Student 2     │     │    Student N     │
│   Raj Patel    │     │   Priya Patel    │     │   (Siblings)     │
└───────┬───────┘     └────────┬────────┘     └─────────────────┘
        │                      │
        ▼                      ▼
┌─────────────────────────────────────────────────────────┐
│                 Shared Resources                         │
│                                                          │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌───────────────┐  │
│  │Finance │  │Academic│  │Attend. │  │ Communication │  │
│  │Invoices│  │Batches │  │Records │  │ (via Contacts) │  │
│  │Receipts│  │Subjects│  │Leaves  │  │ WhatsApp/SMS   │  │
│  │Fees    │  │Exams   │  │QR      │  │ Email/Portal   │  │
│  └────────┘  └────────┘  └────────┘  └───────────────┘  │
│                                                          │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌───────────────┐  │
│  │Medical │  │Document│  │Transport│  │  Library       │  │
│  │Records │  │Repo    │  │Routes   │  │  Books/Fines   │  │
│  └────────┘  └────────┘  └────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Student Lifecycle

The complete student journey from creation through alumni.

### Lifecycle Map

```
                    ┌──────────────────┐
                    │   Lead Created   │
                    │  (Marketing)     │
                    └────────┬─────────┘
                             │ Qualified
                             ▼
                    ┌──────────────────┐
                    │   Counselling    │
                    │  (CRM Process)   │
                    └────────┬─────────┘
                             │ Ready
                             ▼
                    ┌──────────────────┐
                    │   Admission      │
                    │  (Engine)        │
                    └────────┬─────────┘
                             │ Approved
                             ▼
              ╔══════════════════════════╗
              ║   STUDENT CREATED        ║
              ║   (Central Entity)       ║
              ╚══════════════════════════╝
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
      ┌────────────┐ ┌────────────┐ ┌────────────┐
      │   Batch    │ │  Parent    │ │  Welcome   │
      │ Allocation │ │  Portal    │ │  Kit       │
      └────────────┘ └────────────┘ └────────────┘
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                    ┌──────────────────┐
                    │  Classes Begin   │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
      ┌────────────┐ ┌────────────┐ ┌────────────┐
      │ Attendance │ │Assessment  │ │   Fees     │
      │ Daily/Lec  │ │Quizzes/Exams│ │ Invoices   │
      └────────────┘ └────────────┘ └────────────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌──────────────────┐
                    │  Course Progress │
                    │  (Ongoing)       │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
      ┌────────────┐ ┌────────────┐ ┌────────────┐
      │  Transfer  │ │  Dropout   │ │  Complete  │
      │(Rare)      │ │(Exception) │ │(Normal)    │
      └────────────┘ └────────────┘ └────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   Certificates   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   Placement      │
                    │  (If applicable) │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │     ALUMNI       │
                    │  (Lifelong)      │
                    └──────────────────┘
```

### Stage Detail

#### Stage 1: Lead Created
- **How it happens:** Marketing source captures inquiry
- **Owner:** CRM (Lead Master)
- **Data:** Name, phone, source, program interest
- **Documented in:** DOC-05 (Lead V2)

#### Stage 2: Counselling
- **How it happens:** Counsellor works with lead through pipeline stages
- **Owner:** CRM
- **Data:** Profile, family, course interest, demo
- **Documented in:** DOC-05 (Lead V2)

#### Stage 3: Admission
- **How it happens:** Counsellor clicks "Start Admission" → Admission Engine takes over
- **Owner:** Admission Engine
- **Data:** Documents, verification, payment, approval
- **Documented in:** DOC-06 (Admission Engine)

#### Stage 4: Student Created
- **How it happens:** System auto-generates student record when all admission checks pass
- **Owner:** System (automated)
- **Data:** Inherited from lead profile + admission form + family (reused)
- **Key principle:** Nothing duplicated — everything referenced

#### Stage 5: Batch Allocation
- **How it happens:** Academic Coordinator assigns student to a batch
- **Owner:** Academics
- **Data:** Batch, timetable, faculty
- **Student receives:** Student ID, Roll Number, class schedule

#### Stage 6: Parent Portal Activated
- **How it happens:** System sends activation link to eligible family contacts
- **Owner:** System (automated)
- **Data:** Portal credentials sent via WhatsApp/Email

#### Stage 7: Welcome Kit & Orientation
- **How it happens:** Admin dispatches kit, schedules orientation
- **Owner:** Admin / Marketing
- **Data:** Kit contents, orientation date

#### Stage 8: Classes Begin
- **How it happens:** First day of scheduled classes
- **Owner:** Academics
- **Data:** Attendance tracking starts, timetable active

#### Stage 9: Ongoing Academic Life
- **Daily:** Attendance tracking (QR/Face/Manual)
- **Weekly/Monthly:** Assessments, quizzes, assignments
- **Periodic:** Unit tests, mid-terms, finals
- **Ongoing:** Fee collection, communication, document updates

#### Stage 10: Course Completion
- **How it happens:** Program duration completed, all requirements met
- **Owner:** Academics
- **Data:** Final results, grade, rank

#### Stage 11: Certificates
- **How it happens:** System generates certificates after completion
- **Owner:** Admin / Academics
- **Types:** Course completion, participation, achievement

#### Stage 12: Placement (if applicable)
- **How it happens:** Student participates in placement process
- **Owner:** Placement Cell
- **Data:** Resume, interviews, offers, joining

#### Stage 13: Alumni
- **How it happens:** Student exits the institute after completion
- **Owner:** Alumni Relations
- **Data:** Alumni profile, engagement tracking

### Student Status Lifecycle

```
Active ──► Inactive (temporary — medical/leave)
  │
  ├──► Transferred (program or branch change)
  ├──► Suspended (disciplinary)
  ├──► Dropped Out (voluntary withdrawal)
  ├──► Completed (course finished successfully)
  │         │
  │         ▼
  │     Graduated
  │         │
  │         ▼
  │      Alumni
  │
  └──► Expelled (permanent removal)
```

| Status | Meaning | Can Reactivate? |
|--------|---------|----------------|
| **Active** | Currently attending classes | N/A — current state |
| **Inactive** | Temporarily not attending (leave, medical) | ✅ Yes |
| **Transferred** | Moved to different program/branch | ✅ Yes (new enrollment) |
| **Suspended** | Disciplinary suspension | ✅ Yes (after reinstatement) |
| **Dropped Out** | Voluntarily left | ⚠️ Via readmission process |
| **Completed** | Successfully finished program | N/A |
| **Graduated** | Formally graduated | N/A |
| **Alumni** | Former student | N/A |
| **Expelled** | Permanently removed | ❌ No |

---

## 3. Student Master Entity

### Purpose

The `students` table is the **master record** for every enrolled individual. It contains the minimum identifying information — everything else is connected through references.

### Fields

| Field | Type | Purpose | Source |
|-------|------|---------|--------|
| `studentId` | `string` | Auto-generated unique ID (EEOS-STU-2026-0001) | System |
| `rollNumber` | `optional(string)` | Roll number within batch | Academics |
| `enrollmentNumber` | `optional(string)` | University/school enrollment number | Academics |
| `firstName` | `string` | Student's given name | leadMaster |
| `lastName` | `string` | Student's surname | leadMaster |
| `phone` | `string` | Student's mobile number | leadMaster |
| `email` | `optional(string)` | Student's email address | leadMaster |
| `photoUrl` | `optional(string)` | Profile photo | Upload |
| `dob` | `optional(number)` | Date of birth | leadProfile |
| `gender` | `optional(string)` | Gender | leadProfile |
| `bloodGroup` | `optional(string)` | Blood group | Medical Profile |
| `admissionId` | `id(admissions)` | Source admission record | admissions |
| `familyId` | `id(families)` | Family record (shared) | families (reused) |
| `programId` | `id(academicPrograms)` | Current program | admissions |
| `branchId` | `id(orgBranches)` | Current branch | admissions |
| `academicSessionId` | `id(academicSessions)` | Current session | admissions |
| `boardId` | `optional(id(academicBoards))` | Board | leadProfile |
| `currentClass` | `optional(string)` | Current class/standard | leadProfile |
| `status` | `string` | Active/Inactive/Completed/Graduated/etc. | System |
| `enrolledAt` | `number` | When student was created | System |
| `graduatedAt` | `optional(number)` | When student graduated | System |
| `createdAt` | `number` | Timestamp | System |
| `updatedAt` | `number` | Timestamp | System |

### Student ID Format

```
EEOS-STU-YYYY-SSSS

Example: EEOS-STU-2026-0042
```

- Auto-generated sequential number per academic year
- Never reused — even inactive students keep their ID

### Relationship Diagram

```
        ┌──────────────────────────────────────────────────┐
        │                   STUDENT                         │
        │                                                   │
        │  ┌─────────────────────────────────────────┐      │
        │  │  Identity (name, phone, email, photo)   │      │
        │  │  Status (active/inactive/completed)     │      │
        │  │  References (admission, family, program)│      │
        │  └─────────────────────────────────────────┘      │
        └────┬──────┬──────┬──────┬──────┬──────┬──────┬───┘
             │      │      │      │      │      │      │
             ▼      ▼      ▼      ▼      ▼      ▼      ▼
        ┌────────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
        │ Family ││Admis-││Acad  ││Batch ││Fee   ││Attend││Other │
        │(reuse) ││sion  ││Profil││(enrl)││(view)││-ance ││modules│
        └────────┘└──────┘└──────┘└──────┘└──────┘└──────┘└──────┘
```

### Indexes

- `by_studentId` — Unique lookup
- `by_phone` — Contact lookup
- `by_familyId` — Sibling grouping
- `by_programId` — Program-based grouping
- `by_branchId` — Branch-based grouping
- `by_status` — Status filtering
- `by_academicSessionId` — Session-based reporting

### Design Rules

- Student ID is **never reassigned**
- Family data is **never stored** on student — always referenced via `familyId`
- Contact numbers are **never stored** — always retrieved via `familyId` → `familyContacts`
- Status changes are **logged** in the student timeline — never deleted
- Historical students (completed, dropped, transferred) remain in the system

---

## 4. Student 360° Dashboard

### Purpose

A single, unified dashboard that gives a complete view of a student. Every stakeholder (admin, faculty, counsellor, parent, student) sees role-appropriate data from this dashboard.

### Dashboard Sections

```
┌──────────────────────────────────────────────────────────────────┐
│  STUDENT 360° DASHBOARD                                          │
│  Raj Patel  |  EEOS-STU-2026-0042  |  JEE Foundation  |  Active │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ 📊 OVERVIEW  │ │ 📚 ACADEMICS │ │ 📋 ATTENDANCE│             │
│  │              │ │              │ │              │             │
│  │ Name: Raj    │ │ Program: JEE │ │ Overall: 92% │             │
│  │ ID: STU-0042 │ │ Batch: MornA │ │ This Month:  │             │
│  │ Program: JEE │ │ Subjects: 5  │ │ 88%           │             │
│  │ Batch: MornA │ │ Faculty: 3   │ │ Streak: 12d  │             │
│  │ Status: ✅   │ │ Progress: 45%│ │ Alerts: None │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
│                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ 💰 FEES      │ │ 📄 DOCUMENTS│ │ 💬 COMMUNIC. │             │
│  │              │ │              │ │              │             │
│  │ Total: ₹50K  │ │ Aadhar: ✅  │ │ Primary: Mom │             │
│  │ Paid: ₹35K   │ │ Marksheet:✅│ │ Fee: Dad     │             │
│  │ Due: ₹15K    │ │ TC: Pending │ │ Academic: Mom│             │
│  │ Next: 15-Oct │ │ Photo: ✅   │ │ Emergency:   │             │
│  │ Status: ✅   │ │ Updated: 2d │ │ Guardian     │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
│                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ 🎯 EXAMS    │ │ 🏆 PERFOR-   │ │ ⏱ TIMELINE  │             │
│  │             │ │   MANCE      │ │              │             │
│  │ Unit Test 1:│ │ Attendance: A│ │ 📅 Today     │             │
│  │   85/100 ✅ │ │ Academics: B+│ │  10:30 AM    │             │
│  │ Unit Test 2:│ │ Behaviour: A │ │  Attended    │             │
│  │   78/100 ✅ │ │ Engagement: A│ │  Physics     │             │
│  │ Mid Term:   │ │ Risk: Low    │ │  09:00 AM    │             │
│  │   Scheduled │ │ Rank: 12/60 │ │  Mathematics │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
│                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ 🚌 TRANSPORT│ │ 🏠 HOSTEL   │ │ 🤖 AI INSIGHTS│             │
│  │             │ │              │ │              │             │
│  │ Route: 7A   │ │ Room: 204   │ │ Risk Score:  │             │
│  │ Pickup: 7AM │ │ Building: B │ │ 12% (Low)    │             │
│  │ Drop: 1PM   │ │ Bed: 2B     │ │ Performance  │             │
│  │ Driver: Ram │ │ Mess: Veg   │ │ Trend: 📈    │             │
│  │ Vehicle: MH-│ │ Check-in:   │ │ Suggested:   │             │
│  │ 12-AB-1234  │ │ 01-Aug-2026 │ │ Focus Maths  │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  📊 STUDENT ANALYTICS                                    │    │
│  │                                                          │    │
│  │  Attendance %  ████████████████████░░  92%               │    │
│  │  Academic %    ██████████████████░░░░  78%               │    │
│  │  Fee Paid %    ██████████████████░░░░  70%               │    │
│  │  Behaviour     ██████████████████████░  95%               │    │
│  │  Engagement    ████████████████████░░  85%               │    │
│  │                                                          │    │
│  │  Overall Score: 84/100  │  Class Rank: 8/60             │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### Role-Based Access

| Role | Sections Visible |
|------|-----------------|
| **Admin** | All sections |
| **Faculty** | Overview, Academics, Attendance, Exams, Performance, Timeline |
| **Counsellor** | Overview, Fees, Documents, Communication, Timeline, AI Insights |
| **Parent** | Overview, Attendance, Fees, Exams, Documents, Communication, Transport, Certificates, Timetable |
| **Student** | Overview, Academics, Attendance, Exams, Performance, Library, Certificates, Timetable |

---

## 5. Academic Profile

### Purpose

Tracks the student's academic journey — current program, subjects, electives, and complete academic history from admission through all sessions.

### Student Academic Profile Fields

| Field | Type | Purpose | Source |
|-------|------|---------|--------|
| `studentId` | `id(students)` | Student reference | students |
| `boardId` | `optional(id(academicBoards))` | Board | leadProfile |
| `school` | `optional(string)` | Last school attended | leadProfile |
| `college` | `optional(string)` | Last college attended | leadProfile |
| `currentClass` | `optional(string)` | Current standard/class | leadProfile |
| `medium` | `optional(string)` | English / Hindi / Regional | leadProfile |
| `subjects` | `optional(array)` | Enrolled subjects | Enrollment |
| `electives` | `optional(array)` | Elective subjects | Enrollment |
| `previousQualifications` | `optional(string)` | JSON for prior academic records | leadProfile |
| `currentBatchId` | `optional(id(batches))` | Current batch | Enrollment |
| `currentSessionId` | `id(academicSessions)` | Current session | admissions |
| `academicHistory` | `optional(string)` | JSON for all session history | System (aggregated) |

### Subject Enrollment

```
Student: Raj Patel
Program: JEE Foundation
Session: 2026-27

Enrolled Subjects:
  🧪 Physics (Core) — Faculty: Dr. Sharma
  🧪 Chemistry (Core) — Faculty: Dr. Verma
  📐 Mathematics (Core) — Faculty: Mr. Gupta
  📖 English (Language) — Faculty: Ms. Singh
  💻 Computer Science (Elective) — Faculty: Mr. Joshi
```

### Academic History Across Sessions

```
Raj Patel — Academic History
┌──────────┬──────────────┬────────┬─────────┬──────────┐
│ Session  │ Program      │ Status │ Grade   │ Subjects │
├──────────┼──────────────┼────────┼─────────┼──────────┤
│ 2026-27  │ JEE Found.   │ Active │ —       │ Phy,Chem │
│ (Current)│              │        │         │ Math,Eng │
├──────────┼──────────────┼────────┼─────────┼──────────┤
│ Previous │ Class 10     │Completed│ 92%    │ All      │
│ School   │ CBSE Board   │        │ A+      │ Subjects │
└──────────┴──────────────┴────────┴─────────┴──────────┘
```

### Academic Status Flags

| Flag | Meaning | Set By |
|------|---------|--------|
| `isRegular` | Attending regularly | System |
| `isRepeater` | Repeating the same class/program | Academics |
| `isLateralEntry` | Joined mid-program (transfer) | Admission |
| `needsRemedial` | Requires extra help in specific subjects | Faculty |
| `isScholarship` | Receiving scholarship benefits | Finance |

### Design Rules

- Academic profile is updated **each session** — student can have multiple session records
- Previous qualifications are captured during admission — never re-entered
- Subject enrollment is managed by Academics module (not stored directly on student)

---

## 6. Attendance

### Purpose

Track student attendance across all classes. Attendance data feeds into performance analytics, parent notifications, and alerts.

### Architecture

```
Student
  │
  ▼
Enrollment ──► Batch ──► Timetable ──► Attendance Records
                                          │
                                          ├── Daily Summary
                                          ├── Lecture-wise Log
                                          ├── Leave Applications
                                          └── Holiday Calendar
```

### Attendance Record Fields

| Field | Type | Purpose |
|-------|------|---------|
| `studentId` | `id(students)` | Student reference |
| `batchId` | `id(batches)` | Batch reference |
| `subjectId` | `id(academicSubjects)` | Subject reference |
| `facultyId` | `id(users)` | Faculty reference |
| `date` | `number` | Date of class |
| `timeSlot` | `string` | Period/slot identifier |
| `status` | `string` | Present / Absent / Late / Leave / Holiday |
| `markingMethod` | `string` | QR / Face Recognition / Manual / Biometric |
| `markedBy` | `id(users)` | Who marked (or system for auto) |
| `remarks` | `optional(string)` | Late reason, leave note |
| `createdAt` | `number` | Timestamp |

### Attendance Marking Methods

| Method | Description | Use Case |
|--------|-------------|----------|
| **QR Code** | Student scans QR displayed in class | Daily classes |
| **Face Recognition** | Camera captures attendance | High-security / automated |
| **Manual** | Faculty marks in system | Backup / small classes |
| **Biometric** | Fingerprint scanner | Fixed classrooms |

### Attendance Features

#### Daily Summary

```
Student: Raj Patel — Date: 15-Oct-2026
  ┌─────────────────────────────────────────────┐
  │ Period │ Subject    │ Time   │ Status       │
  ├────────┼────────────┼────────┼──────────────┤
  │ 1      │ Physics    │ 8-9AM  │ ✅ Present   │
  │ 2      │ Chemistry  │ 9-10AM │ ✅ Present   │
  │ 3      │ Mathematics│ 10-11AM│ ⏰ Late (10m)│
  │ Break  │ —          │ 11-12PM│ —            │
  │ 4      │ English    │ 12-1PM │ ❌ Absent    │
  │ 5      │ CS (Elect) │ 1-2PM  │ ✅ Present   │
  ├────────┼────────────┼────────┼──────────────┤
  │ Total  │            │        │ 4/5 Present  │
  └─────────────────────────────────────────────┘
```

#### Monthly Attendance Report

```
Raj Patel — October 2026

  Mon  Tue  Wed  Thu  Fri  Sat
   1✅   2✅   3✅   4🔴   5✅   6✅
   8✅   9✅  10✅  11✅  12✅  13✅
  15✅  16✅  17✅  18✅  19🔴  20✅
  22✅  23✅  24✅  25✅  26✅  27✅
  29✅  30✅  31✅

  Total Days: 25
  Present: 23
  Absent: 2
  Late: 1
  Attendance %: 92%
  Status: ✅ Good
```

#### Short Attendance Alert

```
⚠️ ATTENDANCE ALERT

Student: Priya Patel — NEET Foundation
Current Attendance: 68%
Required Minimum: 75%

Action: Parent notified via WhatsApp
  → "Dear Rajesh Patel, your daughter Priya's 
     attendance is at 68%. Please ensure regular 
     attendance to meet the 75% requirement."

Consequence at 60%: Counselling session triggered
Consequence at 50%: Suspension of exam eligibility
```

#### Leave Management

| Leave Type | Approval Required | Max Duration |
|-----------|------------------|-------------|
| **Sick Leave** | Parent notification | 3 days (auto-approve) |
| **Medical** | Medical certificate | 15 days |
| **Emergency** | Parent call + document | 7 days |
| **Planned** | Prior approval | 5 days |
| **Event** | Prior approval | 3 days |

### Indexes

- `by_studentId_date` — Daily lookup
- `by_batchId_date` — Batch attendance
- `by_subjectId` — Subject-wise analysis
- `by_status` — Absent/present tracking

### Design Rules

- Attendance is recorded at the **lecture/period level**, not just daily
- Late arrivals are tracked separately (does not count as absent)
- Attendance percentage is calculated per subject and overall
- Short attendance triggers automatic notifications to `isPrimaryAcademicContact`
- Faculty can mark attendance up to 24 hours after the class

---

## 7. Assessment & Examination

### Purpose

Manage the complete assessment lifecycle — from daily quizzes to final examinations. Results feed into performance analytics, report cards, and progress tracking.

### Assessment Types

| Type | Frequency | Weightage | Grading |
|------|-----------|-----------|---------|
| **Quiz** | Weekly | 5% | Marks / 10 |
| **Assignment** | Weekly/Bi-weekly | 10% | Marks / 20 |
| **Unit Test** | Per unit (monthly) | 15% | Marks / 50 |
| **Practical** | Per subject | 10% | Marks / 30 |
| **Project** | Per term | 10% | Marks / 100 |
| **Mid Term** | Mid-session | 20% | Marks / 100 |
| **Final Exam** | End of session | 30% | Marks / 100 |

### Assessment Table (Subject-Level)

| Field | Type | Purpose |
|-------|------|---------|
| `studentId` | `id(students)` | Student reference |
| `subjectId` | `id(academicSubjects)` | Subject reference |
| `batchId` | `id(batches)` | Batch reference |
| `assessmentType` | `string` | Quiz / Assignment / UnitTest / MidTerm / Final / Practical / Project |
| `title` | `string` | Assessment title |
| `maxMarks` | `number` | Maximum marks |
| `obtainedMarks` | `number` | Marks obtained |
| `percentage` | `number` | Calculated percentage |
| `grade` | `optional(string)` | A+ / A / B+ / B / C / D / F |
| `rank` | `optional(number)` | Rank in batch/class |
| `conductedOn` | `number` | Date of assessment |
| `evaluatedBy` | `id(users)` | Faculty who evaluated |
| `remarks` | `optional(string)` | Faculty comments |
| `createdAt` | `number` | Timestamp |

### Report Card Structure

```
─────────────────────────────────────────────
        EEOS INSTITUTE — REPORT CARD
─────────────────────────────────────────────
Student: Raj Patel
Program: JEE Foundation (2026-27)
Batch: Morning A
Roll No: 42
─────────────────────────────────────────────
SUBJECT        QUIZ  ASGN  UT   MID  FINAL  TOTAL  GRADE
─────────────────────────────────────────────
Physics        8/10  16/20 38/50 72/100 —     134/180 B+
Chemistry      9/10  18/20 42/50 78/100 —     147/180 A
Mathematics    7/10  15/20 35/50 68/100 —     125/180 B
English        10/10 19/20 45/50 85/100 —     159/180 A+
CS (Elective)  9/10  17/20 40/50 75/100 —     141/180 A
─────────────────────────────────────────────
TOTAL          43/50 85/100 200/250 378/500 — 706/900
PERCENTAGE     86%   85%    80%    75.6%   —  78.4%
GRADE                                        
RANK: 12/60
─────────────────────────────────────────────
Attendance: 92%
Remarks: Good progress. Needs focus in Mathematics.
─────────────────────────────────────────────
```

### Grade Scale

| Percentage | Grade | Description |
|-----------|-------|-------------|
| 90-100% | A+ | Outstanding |
| 80-89% | A | Excellent |
| 70-79% | B+ | Very Good |
| 60-69% | B | Good |
| 50-59% | C | Satisfactory |
| 40-49% | D | Needs Improvement |
| Below 40% | F | Fail — Must Repeat |

### Design Rules

- All assessments are stored at the individual student-subject level
- Results are linked to the academic session for historical tracking
- Report cards are auto-generated from assessment data
- Failed assessments can be retaken (remedial exams)
- Final grades determine promotion to next session

---

## 8. Fee Relationship

### Core Principle

**Student NEVER stores fee information directly.** All financial data is owned by the Finance module. The student record only _displays_ fee status by querying finance tables.

### Integration Architecture

```
Student Dashboard (View Only)
       │
       ├── Total Fee: ₹50,000 ← Fee Structure (Finance)
       ├── Paid: ₹35,000     ← Receipts (Finance)
       ├── Due: ₹15,000      ← Calculated
       ├── Next Due: 15-Oct  ← Payment Plan (Finance)
       └── Scholarship: 10%  ← Discounts (Finance)

Finance Module (Owns All Data)
  ├── feeStructure (program-based)
  │     └── baseFee, discounts, scholarships
  ├── invoices
  │     └── studentId, amount, dueDate, status
  ├── receipts
  │     └── invoiceId, amount, date, mode
  ├── payment_plans
  │     └── installments, frequency, graceDays
  └── discounts
        └── category, amount, approvedBy
```

### What Student Dashboard Displays

| Display Field | Source Table | Notes |
|--------------|-------------|-------|
| Total Fee | Fee Structure (program-level) | Not stored on student |
| Base Amount | Fee Structure | Program-specific |
| Discount Applied | Discounts (Finance) | Scholarship/waiver |
| Net Payable | Calculated | Base − Discount |
| Amount Paid | Receipts (Finance) | Sum of verified receipts |
| Balance Due | Calculated | Net − Paid |
| Next Due Date | Payment Plan | Upcoming installment |
| Payment Status | System | UpToDate / Overdue / Pending |
| Last Payment | Receipts | Most recent receipt |

### Fee Timeline (Student View)

```
Raj Patel — Fee Timeline
═══════════════════════════════════════════════════════
Date       │ Description            │ Amount │ Status
═══════════════════════════════════════════════════════
01-Aug-26  │ Admission Fee (Invoice)│ ₹25,000│ ✅ Paid
05-Aug-26  │ Payment Received (UPI) │ ₹25,000│ ✅ Verified
───────────────────────────────────────────────────────
15-Sep-26  │ Installment 1 (Due)    │ ₹10,000│ ✅ Paid
18-Sep-26  │ Payment Received (Cash)│ ₹10,000│ ✅ Verified
───────────────────────────────────────────────────────
15-Oct-26  │ Installment 2 (Due)    │ ₹10,000│ ⏳ Pending
───────────────────────────────────────────────────────
15-Nov-26  │ Installment 3          │ ₹5,000 │ 🔮 Future
───────────────────────────────────────────────────────
           │ Total:                 │ ₹50,000│
           │ Paid:                  │ ₹35,000│
           │ Balance:               │ ₹15,000│
═══════════════════════════════════════════════════════
```

### Fee Status Flags (on Student Display)

| Flag | Meaning |
|------|---------|
| **UpToDate** | All dues paid on time |
| **Overdue** | One or more payments past due date |
| **Pending** | Payment due within 7 days |
| **Warning** | Overdue by 30+ days — collections notified |
| **Clear** | All fees fully paid (no future dues) |

### Design Rules

- Student record has **zero** fee amount fields — all data comes from Finance via queries
- Payment status is **refreshed on every dashboard load** — no caching
- Discounts and scholarships are applied at the Finance level
- Partial payments are supported and displayed correctly
- Fee receipts are accessible from the student document repository

---

## 9. Communication

### Architecture

All student communication uses the **same architecture** defined in DOC-05 (Lead V2). The `familyContacts` table is the single source of truth for all contact information.

```
Student
  │
  ▼
familyId ──► families
                │
                ▼
          familyContacts
                │
                ├── isPrimaryContact
                ├── isPrimaryAcademicContact
                ├── isPrimaryFeeContact
                ├── isEmergencyContact
                └── hasPortalAccess / hasAppAccess
                │
                ▼
          Communication Engine
                │
                ├── WhatsApp (leadWhatsAppMessages)
                ├── SMS (leadSmsMessages — future)
                ├── Email (leadEmailMessages — future)
                ├── Portal Notifications
                └── App Push Notifications
```

### Student-Specific Communication Templates

| Event | Template | Channel | Recipient |
|-------|----------|---------|-----------|
| **Daily Attendance** | `daily_attendance` | WhatsApp | Academic Contact |
| **Weekly Report** | `weekly_summary` | WhatsApp/Email | Primary Contact |
| **Fee Reminder** | `fee_reminder` | WhatsApp/SMS | Fee Contact |
| **Fee Overdue** | `fee_overdue` | WhatsApp | Fee Contact + Decision Maker |
| **Exam Schedule** | `exam_schedule` | WhatsApp | Primary Contact + Student |
| **Exam Results** | `exam_results` | WhatsApp | Primary Contact |
| **Holiday Notice** | `holiday_notice` | WhatsApp | All Contacts |
| **Event Invitation** | `event_invite` | WhatsApp/Email | Primary Contact |
| **Emergency Closure** | `emergency_closure` | WhatsApp/SMS | Emergency Contact + All |
| **Certificate Ready** | `certificate_ready` | WhatsApp | Student + Primary Contact |
| **Homework Reminder** | `homework_reminder` | WhatsApp | Student (if hasAppAccess) |
| **Parent-Teacher Meeting**| `ptm_invite` | WhatsApp/Email | Primary Contact + Decision Maker |
| **Transport Alert** | `transport_alert` | WhatsApp | Primary Contact |
| **Low Attendance Alert** | `attendance_alert` | WhatsApp | Academic Contact |

### Example: Weekly Summary

```
To: +91-9876543210
Contact: Sunita Patel (Mother)
Role: Primary Academic Contact
Template: weekly_summary

"Dear Sunita Patel,

Weekly Summary for Raj Patel (15-Oct to 21-Oct):

  ✅ Attendance: 5/6 days (83%)
  📚 Assignments Completed: 3/3
  📝 Upcoming: Unit Test in Mathematics on 25-Oct
  💰 Fee Status: Up to date
  📊 Performance: Good — consistent in Physics & Chemistry

  View full report: [Parent Portal Link]

  Regards,
  EEOS Institute"
```

### Communication Rules

1. **Every message references a `familyContactId`** — no phone numbers stored elsewhere
2. Templates are **context-aware** — student name, amounts, dates are auto-filled
3. Communication is **logged** in the unified student timeline
4. Opt-out is respected per contact per channel
5. Emergency messages override all opt-out preferences

---

## 10. Documents

### Purpose

A centralized document repository for all student-related files. Documents from the lead and admission stages are inherited — new documents are added during the student lifecycle.

### Document Categories

| Category | Examples | Source |
|----------|----------|--------|
| **Identity** | Aadhar Card, Passport, Birth Certificate | Inherited from Lead |
| **Academic** | Marksheets, Report Cards, Transfer Certificate | Inherited + New |
| **Admission** | Admission Form, Fee Receipt, ID Card | Inherited from Admission |
| **Medical** | Medical Certificate, Vaccination Record | Student Lifecycle |
| **Achievement** | Certificates, Awards, Participation | Student Lifecycle |
| **Disciplinary** | Warning Letters, Suspension Orders | Admin |
| **Miscellaneous** | Consent Forms, Undertakings, Agreements | Student Lifecycle |

### Document Repository

```
Raj Patel — Document Repository
═══════════════════════════════════════════════════════
Category     │ Document Name          │ Status     │ Added
═══════════════════════════════════════════════════════
📄 Identity  │ Aadhar Card            │ ✅ Verified │ Lead Stage
📄 Identity  │ Passport-size Photo    │ ✅ Verified │ Lead Stage
📄 Academic  │ Class 10 Marksheet     │ ✅ Verified │ Lead Stage
📄 Academic  │ Transfer Certificate   │ ✅ Verified │ Admission
📄 Admission │ Admission Form         │ ✅ Signed   │ Admission
📄 Admission │ Fee Receipt (Admission)│ ✅ Verified │ Admission
📄 Admission │ Student ID Card        │ ✅ Issued   │ Enrollment
📄 Medical   │ Medical Certificate    │ ✅ Verified │ Medical
📄 Medical   │ Vaccination Record     │ ✅ Verified │ Medical
📄 Achieve.  │ Science Olympiad Cert  │ ✅ Issued   │ 12-Oct-26
📄 Misc      │ Parent Consent Form    │ ✅ Signed   │ Admission
═══════════════════════════════════════════════════════
```

### Document Verification (Student Lifecycle)

Documents uploaded during the student lifecycle follow the same verification process as admission documents (see DOC-06 Section 7).

| Status | Meaning |
|--------|---------|
| **Uploaded** | File uploaded, pending review |
| **Pending** | Queued for verification |
| **Verified** | Authenticated and accepted |
| **Rejected** | Invalid or unreadable |
| **Resubmitted** | New version after rejection |
| **Not Required** | Optional for this student |

### Design Rules

- Documents from lead/admission stages are **inherited** — never re-uploaded
- Student documents live in a **separate table** (`studentDocuments`) linked to `studentId`
- Original `leadDocuments` remain in the lead record for audit purposes
- Verified documents are **watermarked** with verification details

---

## 11. Medical Profile

### Purpose

Store health-related information for emergency response and medical history tracking. This data is sensitive and has restricted access.

### Medical Profile Fields

| Field | Type | Purpose |
|-------|------|---------|
| `studentId` | `id(students)` | Student reference |
| `bloodGroup` | `optional(string)` | A+ / A- / B+ / B- / AB+ / AB- / O+ / O- |
| `height` | `optional(number)` | In cm |
| `weight` | `optional(number)` | In kg |
| `medicalConditions` | `optional(string)` | Asthma, diabetes, epilepsy, etc. |
| `allergies` | `optional(string)` | Drug allergies, food allergies |
| `medications` | `optional(string)` | Current medications |
| `emergencyNotes` | `optional(string)` | Any special instructions |
| `doctorName` | `optional(string)` | Family doctor / physician |
| `doctorPhone` | `optional(string)` | Doctor's contact |
| `insuranceProvider` | `optional(string)` | Insurance company |
| `insurancePolicyNumber` | `optional(string)` | Policy number |
| `insuranceValidUntil` | `optional(number)` | Expiry date |
| `emergencyContactId` | `optional(id(familyContacts))` | Emergency contact reference |
| `lastCheckupDate` | `optional(number)` | Last medical checkup |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Medical Alert System

```
⚠️ MEDICAL ALERT
Student: Raj Patel
──────────────────────────────────
Blood Group: A+
Allergies: Penicillin (Severe)
Condition: Nil
Emergency Contact: Sunita Patel (+91-9876543210)
Insurance: United Health — POL-2026-8942
──────────────────────────────────
⚠️ This student has a registered drug allergy.
   Ensure NO Penicillin-based medications.
```

### Access Control

| Role | Access Level |
|------|-------------|
| **Student** | View own medical profile |
| **Parent** | View + Edit (with consent) |
| **Admin** | Full access |
| **Faculty** | Emergency info only (blood group, allergies, emergency contact) |
| **Medical Staff** | Full access |
| **Counsellor** | View (non-medical notes only) |

### Design Rules

- Medical profile is **optional** — not required for enrollment
- Sensitive data has **restricted access** — only relevant roles can view
- Emergency information is displayed on the student dashboard header
- Insurance details are stored but never shared outside Admin/Finance

---

## 12. Transport

### Purpose

Manage student transport routes, pickup/drop points, vehicles, and GPS tracking.

### Transport Record Fields

| Field | Type | Purpose |
|-------|------|---------|
| `studentId` | `id(students)` | Student reference |
| `routeId` | `optional(string)` | Route identifier |
| `routeName` | `optional(string)` | Route description |
| `pickupPoint` | `optional(string)` | Pickup location |
| `dropPoint` | `optional(string)` | Drop location |
| `pickupTime` | `optional(string)` | Morning pickup time |
| `dropTime` | `optional(string)` | Afternoon/evening drop time |
| `vehicleNumber` | `optional(string)` | Vehicle registration |
| `vehicleType` | `optional(string)` | Bus / Van / Auto |
| `driverName` | `optional(string)` | Driver's name |
| `driverPhone` | `optional(string)` | Driver's contact |
| `attendantName` | `optional(string)` | Attendant (if any) |
| `gpsTrackingEnabled` | `boolean` | Whether GPS tracking is active |
| `status` | `string` | Active / Inactive / Suspended |
| `effectiveFrom` | `optional(number)` | Start date |
| `effectiveTo` | `optional(number)` | End date (if seasonal) |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Parent Transport View (Portal)

```
🚌 Transport Details — Raj Patel
═══════════════════════════════════════════════════════
Route: 7A — Andheri (W) to Institute
───────────────────────────────────────────────────────
Morning Pickup:
   7:00 AM  │ Andheri (W) — Bhakti Circle
   7:15 AM  │ Versova — Mhada Colony
   7:30 AM  │ Juhu — North Avenue
   7:45 AM  │ Vile Parle — Station Road
   8:00 AM  │ Arrive at Institute
───────────────────────────────────────────────────────
Evening Drop (Reverse):
   1:00 PM  │ Depart Institute
   1:15 PM  │ Vile Parle
   1:30 PM  │ Juhu
   1:45 PM  │ Versova
   2:00 PM  │ Andheri (W)
───────────────────────────────────────────────────────
Vehicle: MH-12-AB-1234 (Bus)
Driver: Ram Singh (+91-9876540099)
GPS: 🟢 Active — Track Now
───────────────────────────────────────────────────────
Status: ✅ Active (since 01-Aug-2026)
```

### Transport Attendance Sync

When a student scans their ID card on the vehicle's device:

```
Student boards bus → Scans QR/ID
  │
  ▼
Transport system records: Student ON BOARD
  │
  ▼
School attendance system notified: Student IN TRANSIT
  │
  ▼
Once student arrives and enters classroom:
  Attendance status = "Present" (with transit marker)
```

### Design Rules

- Transport is optional — configurable per student
- GPS tracking data is available to parents in real-time (portal)
- Transport attendance syncs with academic attendance
- Route changes require parent notification 48 hours in advance

---

## 13. Hostel

### Purpose

Manage hostel accommodation, room allocation, mess, and visitor tracking for residential students.

### Hostel Record Fields

| Field | Type | Purpose |
|-------|------|---------|
| `studentId` | `id(students)` | Student reference |
| `hostelName` | `string` | Hostel building name |
| `building` | `optional(string)` | Block/wing identifier |
| `floor` | `optional(string)` | Floor number |
| `roomNumber` | `string` | Room number |
| `bedNumber` | `optional(string)` | Bed identifier (shared rooms) |
| `roomType` | `string` | Single / Double / Triple / Dormitory |
| `checkInDate` | `number` | Move-in date |
| `checkOutDate` | `optional(number)` | Move-out date |
| `messType` | `string` | Vegetarian / Non-Vegetarian / Both |
| `messPlan` | `string` | Full (3 meals) / Half (2 meals) |
| `wardenName` | `optional(string)` | Warden name |
| `wardenPhone` | `optional(string)` | Warden contact |
| `status` | `string` | Active / CheckedOut / Suspended |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Roommate Management

```
Hostel: Boys Hostel — Building B
Room: 204 (Triple Sharing)

Occupants:
  🛏️ Bed 1: Raj Patel — JEE Foundation (Active)
  🛏️ Bed 2: Amit Singh — JEE Foundation (Active)
  🛏️ Bed 3: Vikram Joshi — NEET Foundation (Active)

Room Warden: Mr. Deshmukh (+91-9876540110)
```

### Visitor Log

| Field | Type | Purpose |
|-------|------|---------|
| `studentId` | `id(students)` | Student reference |
| `visitorName` | `string` | Visitor name |
| `visitorPhone` | `string` | Visitor contact |
| `relation` | `string` | Father / Mother / Guardian / Friend |
| `visitDate` | `number` | Date of visit |
| `checkIn` | `number` | Check-in time |
| `checkOut` | `optional(number)` | Check-out time |
| `purpose` | `optional(string)` | Visit purpose |
| `approvedBy` | `id(users)` | Warden approval |

### Design Rules

- Hostel accommodation is separate from admission — student can opt in/out
- Room changes are logged with history
- Visitor log is maintained for security
- Mess preferences can be changed per term
- Check-out process includes inventory verification

---

## 14. Library

### Purpose

Manage book borrowing, returns, fines, and digital library access for students.

### Library Record Fields

| Field | Type | Purpose |
|-------|------|---------|
| `studentId` | `id(students)` | Student reference |
| `bookId` | `string` | Book identifier (ISBN or library code) |
| `bookTitle` | `string` | Title of the book |
| `author` | `optional(string)` | Author name |
| `category` | `optional(string)` | Subject/genre |
| `issueDate` | `number` | When issued |
| `dueDate` | `number` | Return due date |
| `returnDate` | `optional(number)` | Actual return date |
| `status` | `string` | Issued / Returned / Overdue / Lost |
| `fine` | `optional(number)` | Late fee / Lost book charge |
| `finePaid` | `boolean` | Whether fine has been paid |
| `issuedBy` | `id(users)` | Librarian who issued |
| `createdAt` | `number` | Timestamp |

### Student Library Dashboard

```
📚 Library — Raj Patel
═══════════════════════════════════════════════════════
Currently Issued: 2 books
───────────────────────────────────────────────────────
Book                        │ Due Date   │ Status
───────────────────────────────────────────────────────
Physics for JEE (HC Verma)  │ 25-Oct-26  │ ✅ On Time
Organic Chemistry (Morrison)│ 20-Oct-26  │ ⚠️ Due in 5 days
───────────────────────────────────────────────────────
Previously Returned (Last 3):
Book                        │ Returned   │ Fine
───────────────────────────────────────────────────────
Mathematics (RD Sharma)     │ 10-Oct-26  │ ₹0  ✅
English Grammar (Wren & Martin)│ 05-Oct-26 │ ₹10 ⚠️ Late
Concepts of Physics Vol 1   │ 30-Sep-26  │ ₹0  ✅
───────────────────────────────────────────────────────
Total Fines Due: ₹10
───────────────────────────────────────────────────────
Digital Library Access: ✅ Active (15 books available)
```

### Library Rules

| Rule | Policy |
|------|--------|
| Max books per student | 3 (regular) / 5 (honors/research) |
| Loan period | 14 days (renewable once) |
| Late fine | ₹5 per day per book |
| Lost book | Replacement cost + ₹50 processing fee |
| Digital library | Unlimited access (30-day borrow) |
| Hold/reserve | Can reserve checked-out books |

### Design Rules

- Library system is linked to student ID — no separate library card needed
- Fines are tracked separately from tuition fees (Finance module)
- Lost books are flagged on student record until resolved
- Digital library access is granted automatically upon enrollment

---

## 15. Certificates

### Purpose

Generate, store, and distribute certificates for course completion, achievements, participation, and more.

### Certificate Types

| Type | Trigger | Authority | Format |
|------|---------|-----------|--------|
| **Course Completion** | Program completed successfully | Academics | Digital + Printed |
| **Grade/Marksheet** | Per session/term | Academics | Digital |
| **Participation** | Event/workshop attended | Admin | Digital |
| **Achievement** | Award/competition won | Admin/Faculty | Digital + Printed |
| **Sports** | Tournament participation/win | Sports Dept | Digital |
| **Internship** | Internship completed | Placement Cell | Digital |
| **Bonafide** | Request by student | Admin | Digital |
| **Transfer Certificate** | Student leaving | Admin | Digital + Printed |
| **Migration Certificate** | Board/program change | Admin | Digital + Printed |
| **Character Certificate** | Request by student | Admin | Digital |

### Certificate Record Fields

| Field | Type | Purpose |
|-------|------|---------|
| `studentId` | `id(students)` | Student reference |
| `certificateType` | `string` | Type of certificate |
| `certificateNumber` | `string` | Unique certificate ID |
| `title` | `string` | Certificate title |
| `description` | `optional(string)` | Details / reason |
| `issueDate` | `number` | Date issued |
| `issuedBy` | `id(users)` | Authority who issued |
| `signedBy` | `optional(string)` | Signatory name |
| `url` | `string` | PDF file URL |
| `isDigital` | `boolean` | Digitally signed |
| `verificationCode` | `optional(string)` | QR/Code for verification |
| `createdAt` | `number` | Timestamp |

### Certificate Verification System

Each certificate has a unique verification code and QR code:

```
┌────────────────────────────────────────────┐
│                                            │
│           EEOS INSTITUTE                    │
│     Course Completion Certificate           │
│                                            │
│  This certifies that                       │
│         RAJ PATEL                          │
│  has successfully completed                │
│    JEE Foundation Program (2026-27)        │
│                                            │
│  Grade: A  |  Percentage: 78.4%           │
│  Rank: 12/60                              │
│                                            │
│  Issue Date: 31-Mar-2027                  │
│  Certificate No: EEOS-CERT-2027-0042      │
│                                            │
│  ┌─────────────────────┐  ┌─────────────┐  │
│  │  [QR Code]          │  │ Digital     │  │
│  │                     │  │ Signature   │  │
│  │  Scan to verify     │  │ ✅ Verified │  │
│  └─────────────────────┘  └─────────────┘  │
│                                            │
│  Verify at: eeos.edu/verify/CERT0042      │
│                                            │
└────────────────────────────────────────────┘
```

### Design Rules

- All certificates are **digitally signed** for authenticity
- Certificates have **unique verification codes** — can be verified by third parties
- Course completion certificates are **auto-generated** when student status = "Completed"
- Request-based certificates (bonafide, character) require admin approval
- Certificates are available for download from student portal and parent portal

---

## 16. Placement

### Purpose

Manage the placement lifecycle for students in placement-track programs. Tracks resumes, interviews, offers, and final outcomes.

### Placement Record Fields

| Field | Type | Purpose |
|-------|------|---------|
| `studentId` | `id(students)` | Student reference |
| `resumeUrl` | `optional(string)` | Resume/CV file |
| `skills` | `optional(array)` | Skills/technologies |
| `preferredRoles` | `optional(array)` | Job roles interested in |
| `preferredCompanies` | `optional(array)` | Target companies |
| `expectedSalary` | `optional(number)` | Salary expectation |
| `placementStatus` | `string` | NotStarted / Preparing / Applying / Interviewing / Placed / NotPlaced |
| `placementCoordinatorId` | `optional(id(users))` | Assigned coordinator |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Placement Interview Tracking

| Field | Type | Purpose |
|-------|------|---------|
| `studentId` | `id(students)` | Student reference |
| `companyName` | `string` | Company name |
| `role` | `string` | Job role applied for |
| `applicationDate` | `number` | Applied date |
| `round` | `string` | Resume / Aptitude / Technical / HR / Final |
| `roundNumber` | `number` | Round sequence |
| `status` | `string` | Applied / Shortlisted / RoundCompleted / Selected / Rejected |
| `interviewDate` | `optional(number)` | Interview date |
| `interviewMode` | `optional(string)` | Online / Offline |
| `offerAmount` | `optional(number)` | Package offered |
| `offerDate` | `optional(number)` | Offer date |
| `offerStatus` | `optional(string)` | Accepted / Declined / Pending |
| `joiningDate` | `optional(number)` | Expected joining |
| `remarks` | `optional(string)` | Coordinator notes |
| `createdAt` | `number` | Timestamp |

### Placement Dashboard

```
🎯 Placement — Raj Patel
═══════════════════════════════════════════════════════
Status: 🟢 Actively Applying
Coordinator: Ms. Mehta (placement@eeos.edu)
───────────────────────────────────────────────────────
SKILLS: Python, Java, SQL, DSA, Machine Learning
RESUME: ✅ Uploaded (Last updated: 10-Oct-2026)
───────────────────────────────────────────────────────
APPLICATIONS:
Company          │ Role           │ Round      │ Status
───────────────────────────────────────────────────────
Google           │ SDE Intern     │ Technical  │ ⏳ Awaiting Result
Microsoft        │ SDE Intern     │ Aptitude   │ ✅ Cleared
Amazon           │ SDE Intern     │ Applied    │ 📤 Awaiting Shortlist
───────────────────────────────────────────────────────
OFFERS RECEIVED: 0
INTERVIEWS: 2
APPLICATIONS: 8
SHORTLISTED: 5
───────────────────────────────────────────────────────
Next Session: Mock Interview — 20-Oct-2026 (10 AM)
───────────────────────────────────────────────────────
```

### Placement Status Lifecycle

```
NotStarted ──► Preparing ──► Applying ──► Interviewing ──► Placed
                  │             │              │
                  ▼             ▼              ▼
             (Skill Dev)   (Resume       (Mock
                           Building)     Interviews)
```

### Design Rules

- Placement is **not applicable** for all programs — configurable per program
- Placement coordinator is assigned per batch/program
- Multiple interview rounds per company are tracked sequentially
- Once placed (`offerStatus = Accepted`), student moves to "Placed" status
- Placement data is **not visible** to other students (privacy)

---

## 17. Student Timeline

### Purpose

A unified, chronological activity feed for every student. The timeline seamlessly continues from the lead timeline — no history is lost.

### Activity Types

| Action | Module | Description |
|--------|--------|-------------|
| `lead_created` | CRM | Lead was created |
| `stage_changed` | CRM | Pipeline stage moved |
| `admission_started` | Admission | Admission process began |
| `document_verified` | Admission | Document verified |
| `admission_approved` | Admission | Admission approved |
| `student_created` | System | Student record auto-generated |
| `batch_allocated` | Academics | Batch assigned |
| `portal_activated` | System | Parent portal activated |
| `orientation_scheduled` | Admin | Orientation date set |
| `classes_began` | Academics | First class attended |
| `attendance_marked` | Attendance | Daily attendance recorded |
| `attendance_alert` | System | Short attendance alert |
| `fee_paid` | Finance | Payment received |
| `fee_overdue` | Finance | Payment overdue |
| `fee_reminder_sent` | Communication | Payment reminder sent |
| `assessment_completed` | Academics | Quiz/exam completed |
| `result_published` | Academics | Exam results published |
| `certificate_issued` | Admin | Certificate generated |
| `transport_assigned` | Admin | Transport route assigned |
| `hostel_assigned` | Admin | Hostel room allocated |
| `library_issued` | Library | Book issued |
| `library_returned` | Library | Book returned |
| `library_fine` | Library | Late fine applied |
| `medical_updated` | Student | Medical profile updated |
| `placement_applied` | Placement | Job application submitted |
| `placement_offer` | Placement | Offer received |
| `placement_joined` | Placement | Offer accepted |
| `counselling_note` | CRM | Counsellor added note |
| `communication_sent` | Communication | WhatsApp/SMS sent |
| `task_created` | Tasks | Task assigned to/following the student |
| `disciplinary` | Admin | Disciplinary action logged |
| `status_changed` | System | Student status changed |
| `graduated` | System | Student graduated |

### Timeline UI

```
Raj Patel — Student Timeline
═══════════════════════════════════════════════════════
TODAY
  🟢 10:30 AM  Attended Physics class (QR)
  📝 09:00 AM  Unit Test result published: Mathematics — 78%
  📤 08:00 AM  Arrived at Institute (Transport GPS)

YESTERDAY
  💰 03:00 PM  Fee payment received: ₹10,000 (Installment 1)
  🟢 10:30 AM  Attended Chemistry class (QR)
  📚 09:15 AM  Library book issued: Organic Chemistry (Morrison)
  ⚠️ 09:00 AM  Late arrival — Mathematics class (10 min)

3 DAYS AGO
  📝 All Day    Mid Term Examination — Physics
  🟢 08:00 AM   Attended Chemistry class (Face Recognition)

1 WEEK AGO
  🎓 10:00 AM   Orientation session attended
  🚌 08:30 AM   Transport route assigned: Route 7A
  🆕 08:00 AM   Batch allocated: JEE 2027 Morning A

2 WEEKS AGO
  🎉 System     Student created — EEOS-STU-2026-0042
  ✅ System     Admission approved
  📄 System     Document verified: Transfer Certificate
  📄 System     Document verified: Class 10 Marksheet

...CONTINUED FROM LEAD TIMELINE...

3 WEEKS AGO (Lead Stage)
  💬            WhatsApp: Fee structure shared with Sunita Patel
  📞            Call made (12 min) — Fee discussion
  📄            Document uploaded: Aadhar Card

1 MONTH AGO (Lead Stage)
  🆕            Lead created from Facebook Ads — JEE Foundation
═══════════════════════════════════════════════════════
```

### Design Rules

- Timeline is **never deleted** — complete history from lead to alumni
- Each event has an `action`, `description`, `userId`, and `metadata` (JSON)
- Timeline is **read-only** for all roles except System
- Timeline supports **infinite scroll** / pagination
- Filters by module (Finance, Academics, Attendance, Communication, etc.)

---

## 18. Student Analytics

### Purpose

Provide quantitative insights into every aspect of student performance, engagement, and risk.

### Analytics Dimensions

| Dimension | Metrics | Data Source |
|-----------|---------|-------------|
| **Attendance** | Overall %, Subject-wise %, Trend, Streak | Attendance table |
| **Academic** | Overall %, Subject-wise %, Grade, Rank | Assessments table |
| **Fee** | Paid %, Timeliness, Outstanding, Trend | Finance queries |
| **Behaviour** | Discipline flags, Late count, Warnings | Admin/Discipline |
| **Engagement** | Portal logins, Communication response, Activity | Various |
| **Risk** | Dropout probability, Fee default risk, Academic risk | AI (future) |

### Student Scorecard

```
Raj Patel — Analytics Scorecard
═══════════════════════════════════════════════════════
                     CURRENT    CLASS AVG    TREND
───────────────────────────────────────────────────────
📋 Attendance       92%         87%          📈 +2%
📚 Academic (Overall) 78.4%    71.2%         📈 +5%
💰 Fee Paid         70%         68%          📊 Same
📊 Behaviour        95/100      88/100        📈 Stable
⭐ Engagement       85%         72%           📈 +8%
───────────────────────────────────────────────────────
OVERALL SCORE       84/100      76/100        📈 Improving
CLASS RANK          8/60        —             —
───────────────────────────────────────────────────────
RISK ASSESSMENT
  Attendance Risk:  🟢 Low (92% > 75% threshold)
  Academic Risk:    🟢 Low (78.4% > 60% threshold)
  Fee Risk:         🟢 Low (Up to date)
  Dropout Risk:     🟢 Low (4% probability)
  Overall Risk:     🟢 Low (Score: 12/100)
───────────────────────────────────────────────────────
```

### Progress Graph (Text)

```
Raj Patel — Academic Progress (2026-27)
═══════════════════════════════════════════════════════

  100% │
       │
   80% │        ┌──┐        ┌──┐
       │   ┌──┐ │  │   ┌──┐ │  │
   60% │   │  │ │  │   │  │ │  │
       │   │  │ │  │ ┌─│  │ │  │
   40% │   │  │ │  │ │ │  │ │  │
       │   │  │ │  │ │ │  │ │  │
   20% │   │  │ │  │ │ │  │ │  │
       │   │  │ │  │ │ │  │ │  │
     0% └───┴──┴──┴──┴─┴──┴─┴──┴──
          Aug  Sep  Oct  Nov  Dec  Jan
          ── Physics  ── Chemistry
          ── Mathematics  ── Overall
```

### Analytics Alerts

| Alert | Trigger | Action |
|-------|---------|--------|
| **Attendance Drop** | Attendance falls below 75% | Notify Academic Contact + Counsellor |
| **Academic Decline** | Two consecutive assessments show decline | Flag for faculty attention |
| **Fee Overdue** | Payment overdue by 7+ days | Notify Fee Contact |
| **Behaviour Warning** | 3+ discipline flags in a month | Notify Admin + Counsellor |
| **Engagement Drop** | No portal login for 14 days | Notify Primary Contact |
| **Risk Score Increase** | Risk score crosses 50 | Schedule counselling |

### Design Rules

- Analytics are calculated **in real-time** on dashboard load
- Historical trends are stored as periodic snapshots (weekly/monthly)
- Risk score is a weighted composite of attendance, academic, fee, behaviour, and engagement scores
- AI-powered risk prediction is future scope (Phase 3)

---

## 19. AI Opportunities

### 1. Dropout Prediction

```
Student: Priya Sharma — NEET Foundation

AI Dropout Risk: 45% (Medium)

Risk Factors:
  ❌ Attendance dropped from 90% → 65% in last 30 days
  ❌ Two consecutive assessments below 50%
  ❌ Last parent portal login: 45 days ago
  ⚠️ Fee payment delayed by 15 days
  ⚠️ Primary decision maker never attended counselling

Recommendation:
  ➤ Immediate counselling session with decision maker
  ➤ Academic support plan for weak subjects
  ➤ Weekly check-in with academic contact
```

### 2. Attendance Risk Prediction

```
Student: Amit Singh — JEE Foundation

AI predicts: 78% probability of attendance falling
  below 75% in the next 30 days.

Pattern detected:
  Absences are concentrated on Monday mornings (Physics)
  → Possible difficulty in subject/teacher

Recommendation:
  ➤ Faculty check-in with student
  ➤ Offer remedial class option
  ➤ Wake-up call/reminder for Monday classes
```

### 3. Low Performance Detection

```
Student: Vikram Joshi — NEET Foundation

AI Performance Analysis:
  Physics: 72% (Stable ✅)
  Chemistry: 68% (Declining ⚠️)
  Biology: 45% (Critical ❌)

Alert: Biology score dropped 20% in last two assessments

Recommendation:
  ➤ Extra tutoring in Biology
  ➤ Study material recommendation
  ➤ Pair with high-performing peer for group study
```

### 4. Personalized Learning Recommendations

```
Student: Raj Patel — JEE Foundation

AI analyzes:
  Strengths: Physics (85%), Chemistry (82%)
  Weaknesses: Mathematics (65%) — Calculus, Trigonometry

Recommended resources:
  📖 "Calculus for JEE" by Amit Agarwal (Library)
  🎥 Khan Academy — Calculus playlist (Digital Library)
  👥 Join Mathematics study group (Batch Morn-B)
  📝 Practice test: Calculus Unit Test — Suggested Date: 25-Oct
```

### 5. Counselling Recommendation

```
Student: Priya Sharma — NEET Foundation

AI triggers counselling flag due to:
  ⚠️ Attendance declined 25% in 30 days
  ⚠️ Academic performance dropped
  ⚠️ Decision maker not engaged in 60 days

Suggested counselling focus areas:
  1. Academic difficulty (Biology)
  2. Motivation / Career goal clarity
  3. Home environment check
  4. Decision maker involvement
```

### 6. Fee Default Prediction

```
Student: Raj Patel — JEE Foundation

AI Fee Analysis:
  Payment history: 2 on-time, 0 late (Good record)
  Family income bracket: ₹4-6L/year (from admission data)
  Current balance: ₹15,000 (due 15-Oct)

Prediction: 92% probability of on-time payment
  → Low risk (No intervention needed)

Student: Vikram Joshi — NEET Foundation
  Payment history: 2 late payments in last 6 months
  Current balance: ₹25,000 (due 20-Oct)
  Previous default pattern: 10-15 day delays

Prediction: 65% probability of >15 day delay
  Recommendation: Send early reminder + offer installment plan
```

### 7. Placement Prediction

```
Student: Raj Patel — JEE Foundation

AI Placement Prediction (Career Track):
  Skills: Python (Advanced), Java (Intermediate), SQL (Intermediate)
  Academic: 78.4% (Good)
  Soft Skills: Communication A, Teamwork A (from assessments)

Predicted placement success: 85%
  Top matching roles: SDE Intern, Data Analyst
  Recommended preparation: DSA (Data Structures & Algorithms)
  
Suggested companies: Infosys, TCS, Accenture, Tech Mahindra
```

### 8. Career Recommendation

```
Student: Priya Sharma (NEET Foundation — Class 12)

AI Career Prediction:
  Academic strengths: Biology (85%), Chemistry (78%)
  Weaknesses: Physics (55%)
  Interest: Medical sciences (confirmed in counselling notes)

Recommended career paths:
  🥇 MBBS → Doctor
  🥈 BDS → Dentist
  🥉 B.Pharma → Pharmacist
  
Suggested next steps:
  1. Focus on Physics improvement (weakest subject)
  2. Register for NEET mock tests series
  3. Attend medical career counselling session
  4. Consider B.Sc. Nursing as alternative
```

---

## 20. Parent Portal View

### Purpose

The Parent Portal provides role-specific access for parents/guardians to track their child's progress. Built on the foundation defined in DOC-05 (Family Contacts role flags).

### What Parents Can See

| Section | Details | Role Required |
|---------|---------|---------------|
| **Dashboard** | Student overview, latest updates, alerts | `hasPortalAccess` |
| **Attendance** | Daily records, monthly summary, alerts | `isPrimaryAcademicContact` |
| **Homework** | Daily assignments, submission status | `isPrimaryAcademicContact` |
| **Fees** | Fee structure, payment history, dues, receipts | `isPrimaryFeeContact` |
| **Exams** | Schedule, results, report cards, rank | `isPrimaryAcademicContact` |
| **Documents** | Uploaded documents, verification status | `hasPortalAccess` |
| **Communication** | Message history, send message to counsellor | `isPrimaryContact` |
| **Transport** | Route, GPS tracking, driver details | `hasPortalAccess` |
| **Certificates** | Issued certificates, download | `hasPortalAccess` |
| **Timetable** | Class schedule, faculty names | `isPrimaryAcademicContact` |
| **Medical** | Medical profile, emergency info | `hasPortalAccess` |
| **Hostel** (if applicable) | Room, warden, mess, visitor log | `hasPortalAccess` |
| **Library** | Books issued, due dates, fines | `hasPortalAccess` |
| **Results** | Exam results, grade cards | `isPrimaryAcademicContact` |
| **Requests** | Leave application, document request, complaint | `isPrimaryContact` |

### Multi-Student Parent Dashboard (Same as DOC-06)

```
Welcome, Rajesh Patel
  ┌──────────────────────────────────────────────┐
  │           My Children                        │
  ├──────────────────────────────────────────────┤
  │  Raj Patel  │  JEE Foundation  │  Class 12   │
  │  Attendance: 92%  │  Next Fee: ₹5,000 (15 Oct)│
  │                                              │
  │  Priya Patel │  NEET Foundation │  Class 11  │
  │  Attendance: 88%  │  Next Fee: ₹4,500 (20 Oct)│
  └──────────────────────────────────────────────┘
```

### Parent Portal Features

| Feature | Description |
|---------|-------------|
| **Push Notifications** | Real-time alerts for attendance, fees, results |
| **Document Upload** | Upload medical certificates, consent forms |
| **Leave Application** | Apply for student leave with reason |
| **Fee Payment** | Pay fees online (redirect to payment gateway) |
| **Message Counsellor** | Send direct message to assigned counsellor |
| **Download Reports** | Download report cards, certificates, receipts |
| **Profile Update** | Update contact details, communication preferences |
| **Calendar View** | View academic calendar, holidays, events |
| **Consent Management** | Approve/reject field trips, activities |

### Design Rules

- Parent cannot see **other students' data** (only their own children)
- Parent cannot see **disciplinary logs** (admin/faculty only)
- Parent cannot **modify** academic data — can only update contact preferences
- Communication preferences (channel, language, time) are respected for all notifications

---

## 21. Student Mobile App

### Purpose

A mobile application for students to access their academic data, communicate, and manage their daily institute life.

### App Dashboard Sections

| Section | Features |
|---------|----------|
| **Dashboard** | Today's schedule, attendance %, upcoming exams, fee status |
| **Attendance** | Daily log, monthly calendar, subject-wise %, leave application |
| **Homework** | Daily assignments, submission, due dates, teacher remarks |
| **Timetable** | Weekly class schedule, faculty names, room numbers |
| **Assignments** | Upload assignments, view grades, feedback |
| **Exams** | Schedule, hall tickets, results, rank, report cards |
| **Fees** | Fee structure, payment history, due dates, pay now |
| **Library** | Search books, issued list, due dates, renew, digital library |
| **Certificates** | Download certificates, bonafide requests |
| **Profile** | Personal info, photo, medical info (view only), preferences |
| **Notifications** | All alerts: attendance, fees, exams, events |
| **Communication** | Chat with faculty, counsellor (limited), receive announcements |
| **Transport** (if applicable) | Route, GPS tracking, pickup alerts |
| **Hostel** (if applicable) | Room info, mess menu, visitor log, warden contact |

### App Notification Types

| Notification | Trigger | Action on Tap |
|-------------|---------|---------------|
| "Class starts in 15 mins" | Daily (before first period) | Opens timetable |
| "Homework: Mathematics" | Faculty assigns homework | Opens assignment |
| "Attendance marked absent" | Manual/facial attendance | Opens attendance |
| "Fee due in 3 days" | 3 days before due date | Opens fee section |
| "Exam schedule published" | Schedule released | Opens exam section |
| "Results published" | Results released | Opens result card |
| "Library book due tomorrow" | 1 day before return date | Opens library |
| "Institute closed tomorrow" | Holiday declared | Opens calendar |
| "Certificate ready" | Certificate issued | Opens certificates |
| "New message from faculty" | Faculty sends message | Opens chat |

### Design Rules

- App uses the same `familyContacts` role flags for access control
- `hasAppAccess = true` enables student app login
- No sensitive financial data is editable from the app
- Biometric/Face ID supported for quick login
- Offline mode: view cached timetable and attendance

---

## 22. Implementation Roadmap

### Phase 1 — Student Master (P0)

**Estimated effort:** 4-5 days  
**Dependencies:** DOC-06 Phase 6 (Student Creation Engine), Lead V2 Phase 1-3

**Tasks:**
- [ ] Create `students` table in schema
- [ ] Student ID auto-generation (EEOS-STU-YYYY-SSSS)
- [ ] Status lifecycle management (Active, Inactive, Completed, etc.)
- [ ] Student master CRUD (convex/students.ts)
- [ ] Student creation trigger from admission approval
- [ ] Family data reuse (link to families table)
- [ ] Student listing page with filters

### Phase 2 — Student 360° Dashboard (P0)

**Estimated effort:** 5-6 days  
**Dependencies:** Phase 1

**Tasks:**
- [ ] Dashboard layout with section cards
- [ ] Overview section (name, ID, program, batch, status)
- [ ] Data aggregation from multiple modules (attendance, fees, academics)
- [ ] Role-based section visibility
- [ ] Quick action buttons (send message, view report, pay fee)
- [ ] Student search and navigation

### Phase 3 — Attendance System (P1)

**Estimated effort:** 6-8 days  
**Dependencies:** Phase 1, Academic Batches, Timetable

**Tasks:**
- [ ] Create `attendanceRecords` table
- [ ] Mark attendance (QR / Face / Manual)
- [ ] QR code generation per batch/class
- [ ] Daily attendance summary
- [ ] Monthly attendance report
- [ ] Attendance percentage calculation
- [ ] Short attendance alerts (auto-trigger)
- [ ] Leave application workflow
- [ ] Parent notification integration

### Phase 4 — Assessment & Examination (P1)

**Estimated effort:** 6-8 days  
**Dependencies:** Phase 1, Academic Subjects

**Tasks:**
- [ ] Create `assessments` table
- [ ] Assessment types (Quiz, Assignment, Unit Test, etc.)
- [ ] Marks entry per student per subject
- [ ] Grade calculation
- [ ] Report card generation
- [ ] Rank calculation per batch
- [ ] Result publication workflow
- [ ] Parent notification on result publish

### Phase 5 — Document Repository (P1)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 1, Lead V2 Documents

**Tasks:**
- [ ] Create `studentDocuments` table
- [ ] Inherit documents from leadDocuments
- [ ] Document categories
- [ ] Upload new documents during student lifecycle
- [ ] Document verification status
- [ ] Document download/view UI

### Phase 6 — Fee Integration & Display (P1)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 1, Finance Module

**Tasks:**
- [ ] Fee status query integration with Finance
- [ ] Fee summary component on dashboard
- [ ] Fee history timeline
- [ ] Payment status flags (UpToDate, Overdue, etc.)
- [ ] Pay now redirect to payment gateway

### Phase 7 — Communication Integration (P1)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 1, Lead V2 Phase 4 (Communication Integration)

**Tasks:**
- [ ] Student-specific communication templates
- [ ] Attendance notification triggers
- [ ] Fee reminder triggers
- [ ] Exam/result notification triggers
- [ ] Academic calendar event notifications

### Phase 8 — Medical Profile (P2)

**Estimated effort:** 2-3 days  
**Dependencies:** Phase 1

**Tasks:**
- [ ] Create `studentMedicalProfiles` table
- [ ] Medical info form (blood group, allergies, conditions)
- [ ] Emergency contact linkage
- [ ] Medical alert display
- [ ] Role-based access control

### Phase 9 — Transport Management (P2)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 1

**Tasks:**
- [ ] Create `studentTransport` table
- [ ] Route management
- [ ] Pickup/drop point mapping
- [ ] GPS tracking integration (future)
- [ ] Transport attendance sync

### Phase 10 — Hostel Management (P2)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 1

**Tasks:**
- [ ] Create `studentHostel` table
- [ ] Room allocation
- [ ] Mess preference management
- [ ] Visitor log
- [ ] Check-in/check-out workflow

### Phase 11 — Library Integration (P2)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 1

**Tasks:**
- [ ] Create `libraryRecords` table
- [ ] Book issue/return workflow
- [ ] Due date tracking
- [ ] Fine calculation
- [ ] Digital library access

### Phase 12 — Certificates (P2)

**Estimated effort:** 3-4 days  
**Dependencies:** Phase 1, Phase 4 (Assessment)

**Tasks:**
- [ ] Create `certificates` table
- [ ] Auto-generate course completion certificate
- [ ] Certificate templates
- [ ] Digital signatures
- [ ] QR code verification
- [ ] Download and print

### Phase 13 — Placement (P2)

**Estimated effort:** 4-5 days  
**Dependencies:** Phase 1

**Tasks:**
- [ ] Create `placement` table
- [ ] Create `placementInterviews` table
- [ ] Resume upload
- [ ] Skills tracking
- [ ] Application management
- [ ] Interview round tracking
- [ ] Offer management

### Phase 14 — Student Timeline (P2)

**Estimated effort:** 2-3 days  
**Dependencies:** All Phases

**Tasks:**
- [ ] Unified timeline from lead + student events
- [ ] Activity type classification
- [ ] Module-based filters
- [ ] Infinite scroll / pagination

### Phase 15 — Student Analytics (P2)

**Estimated effort:** 4-5 days  
**Dependencies:** All Phases

**Tasks:**
- [ ] Attendance analytics
- [ ] Academic performance analytics
- [ ] Fee compliance analytics
- [ ] Behaviour score
- [ ] Engagement score
- [ ] Risk score (basic, non-AI)
- [ ] Scorecard component
- [ ] Progress graphs

### Phase 16 — Parent Portal (P2)

**Estimated effort:** 5-7 days  
**Dependencies:** Phase 1-15, Lead V2 Phase 3 (Family Contacts)

**Tasks:**
- [ ] Parent portal UI (web)
- [ ] Role-based views per section
- [ ] Multi-student dashboard
- [ ] Communication with counsellor
- [ ] Leave application
- [ ] Document upload
- [ ] Report card download
- [ ] Fee payment

### Phase 17 — Student Mobile App (P3)

**Estimated effort:** 10-15 days  
**Dependencies:** Phase 1-15

**Tasks:**
- [ ] Mobile app UI (React Native / Flutter)
- [ ] Student login (hasAppAccess)
- [ ] Dashboard
- [ ] Attendance view
- [ ] Timetable
- [ ] Homework
- [ ] Exams/Results
- [ ] Fees
- [ ] Library
- [ ] Notifications
- [ ] Profile
- [ ] Offline mode

### Phase 18 — AI Features (P3)

**Estimated effort:** 10-15 days  
**Dependencies:** Phase 1-17

**Tasks:**
- [ ] Dropout prediction model
- [ ] Attendance risk prediction
- [ ] Low performance detection
- [ ] Personalized learning recommendations
- [ ] Counselling recommendation engine
- [ ] Fee default prediction
- [ ] Placement prediction
- [ ] Career recommendation

### Priority Matrix

| Phase | Priority | Effort | Risk | Impact |
|-------|----------|--------|------|--------|
| 1. Student Master | P0 | 5d | Medium | Critical |
| 2. Student 360° Dashboard | P0 | 6d | Medium | Critical |
| 3. Attendance | P1 | 8d | Medium | High |
| 4. Assessment & Exam | P1 | 8d | Medium | High |
| 5. Document Repository | P1 | 4d | Low | High |
| 6. Fee Integration | P1 | 4d | Low | High |
| 7. Communication Integration | P1 | 4d | Low | High |
| 8. Medical Profile | P2 | 3d | Low | Medium |
| 9. Transport Management | P2 | 4d | Low | Medium |
| 10. Hostel Management | P2 | 4d | Low | Medium |
| 11. Library Integration | P2 | 4d | Low | Medium |
| 12. Certificates | P2 | 4d | Low | High |
| 13. Placement | P2 | 5d | Medium | Medium |
| 14. Student Timeline | P2 | 3d | Low | High |
| 15. Student Analytics | P2 | 5d | Medium | High |
| 16. Parent Portal | P2 | 7d | Medium | High |
| 17. Student Mobile App | P3 | 15d | High | High |
| 18. AI Features | P3 | 15d | High | High |

### Domain Ownership Matrix

| Module | Owns | Does NOT Own |
|--------|------|-------------|
| **Student Management** | Student record, Medical, Transport, Hostel, Certificates | Admissions, Payments |
| **CRM (Lead V2)** | Lead, Profile, Family, Contacts, Documents | Students, Academics |
| **Admission Engine** | Admission, Checklist, Verification, Seat | Students, Payments |
| **Finance** | Invoices, Receipts, Refunds, Payment Verification | Student data |
| **Academics** | Batches, Timetable, Faculty, Subjects, Attendance | Student records |
| **Attendance** | Attendance logs, Leave management | Student profile |
| **Assessment** | Quizzes, Exams, Results, Report cards | Student records |
| **Library** | Books, Issues, Returns, Fines | Student data |
| **Communication** | Message templates, Delivery, Routing | Contact data (uses familyContacts) |
| **Parent Portal** | Portal UI, Role-based access, Notifications | Student data (displays only) |
| **Student App** | Mobile UI, Push notifications | Backend data (reads only) |

---

## 23. Golden Rules

```text
╔══════════════════════════════════════════════════════════════╗
║           STUDENT LIFECYCLE & 360° GOLDEN RULES              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1.  Student NEVER duplicates Lead data.                     ║
║      └── Inherits from lead via admission, never copies.     ║
║                                                              ║
║  2.  Student NEVER duplicates Family data.                   ║
║      └── Family and FamilyContacts are shared and reused.    ║
║                                                              ║
║  3.  Finance owns ALL payments.                              ║
║      └── Student only displays fee status — never stores     ║
║      financial records.                                      ║
║                                                              ║
║  4.  Academics owns learning.                                ║
║      └── Batches, subjects, timetable, attendance are        ║
║      owned by Academic module.                               ║
║                                                              ║
║  5.  Communication ALWAYS uses Family Contacts.              ║
║      └── No phone numbers or emails stored on student        ║
║      record.                                                 ║
║                                                              ║
║  6.  One Family → Many Students.                             ║
║      └── Siblings share the same family record and           ║
║      contacts.                                               ║
║                                                              ║
║  7.  Everything connected through IDs.                       ║
║      └── studentId, admissionId, familyId — no data          ║
║      duplication.                                            ║
║                                                              ║
║  8.  Student is the operational center of EEOS.              ║
║      └── All modules (Finance, Academics, Communication,     ║
║      Attendance) revolve around the student record.          ║
║                                                              ║
║  9.  Never delete — always preserve history.                  ║
║      └── Dropped out, transferred, and graduated students    ║
║      remain in the system with their status recorded.        ║
║                                                              ║
║ 10.  Timeline is continuous from Lead to Alumni.             ║
║      └── No history is lost — every event from lead          ║
║      creation through graduation is preserved.               ║
║                                                              ║
║ 11.  Progressive data collection.                             ║
║      └── Medical, transport, hostel data is collected        ║
║      when needed — never required for enrollment.            ║
║                                                              ║
║ 12.  Every stakeholder sees what they need.                  ║
║      └── Role-based access ensures parents, faculty,         ║
║      admins, and students see appropriate data.              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Appendix A: Entity Summary

| Entity | Table Name | Status | Phase | Belongs To |
|--------|-----------|--------|-------|-----------|
| Student Master | `students` | 🔶 New | Phase 1 | Student Management |
| Academic Profile | `studentAcademicProfiles` | 🔶 New | Phase 1 | Student Management |
| Attendance Record | `attendanceRecords` | 🔶 New | Phase 3 | Attendance |
| Leave Application | `leaveApplications` | 🔶 New | Phase 3 | Attendance |
| Assessment | `assessments` | 🔶 New | Phase 4 | Assessment |
| Report Card | `reportCards` | 🔶 New | Phase 4 | Assessment |
| Student Document | `studentDocuments` | 🔶 New | Phase 5 | Student Management |
| Medical Profile | `studentMedicalProfiles` | 🔶 New | Phase 8 | Student Management |
| Transport Record | `studentTransport` | 🔶 New | Phase 9 | Student Management |
| Hostel Record | `studentHostel` | 🔶 New | Phase 10 | Student Management |
| Library Record | `libraryRecords` | 🔶 New | Phase 11 | Library |
| Certificate | `certificates` | 🔶 New | Phase 12 | Student Management |
| Placement | `placement` | 🔶 New | Phase 13 | Placement |
| Placement Interview | `placementInterviews` | 🔶 New | Phase 13 | Placement |
| Student Timeline Event | `studentTimeline` | 🔶 New | Phase 14 | System |
| Parent Portal Account | `parentPortalAccounts` | 🔶 New | Phase 16 | Parent Portal |

## Appendix B: Full Entity Relationship Diagram

```
leadMaster (CRM - DOC-05)
  │
  ├──1:1──► leadProfile (DOC-05 Phase 1)
  ├──1:1──► families (DOC-05 Phase 2)
  │           │
  │           ├──1:N──► familyContacts (DOC-05 Phase 3)
  │           └──1:N──► siblings (DOC-05 Phase 5)
  │
  └──1:1──► admissions (DOC-06 Phase 1)
               │
               ├──1:N──► admissionChecklistItems (DOC-06 Phase 2)
               ├──1:N──► admissionDocumentVerification (DOC-06 Phase 3)
               ├──1:0..1──► seatReservations (DOC-06 Phase 5)
               │
               └──1:1──► students (DOC-07 Phase 1)
                            │
                            ├──1:1──► studentAcademicProfiles (Phase 1)
                            ├──1:N──► attendanceRecords (Phase 3)
                            ├──1:N──► leaveApplications (Phase 3)
                            ├──1:N──► assessments (Phase 4)
                            ├──1:N──► reportCards (Phase 4)
                            ├──1:N──► studentDocuments (Phase 5)
                            ├──1:0..1──► studentMedicalProfiles (Phase 8)
                            ├──1:0..1──► studentTransport (Phase 9)
                            ├──1:0..1──► studentHostel (Phase 10)
                            ├──1:N──► libraryRecords (Phase 11)
                            ├──1:N──► certificates (Phase 12)
                            ├──1:0..1──► placement (Phase 13)
                            │              │
                            │              └──1:N──► placementInterviews
                            │
                            ├──1:N──► studentTimeline (Phase 14)
                            │
                            ├──► families (REUSED — DOC-05)
                            ├──► familyContacts (REUSED — DOC-05)
                            ├──► leadDocuments (INHERITED)
                            ├──► leadActivity (CONTINUED)
                            └──► leadPayments (CONTINUED)

Finance Module (Existing)
  └──► invoices ──► receipts
       └──► student (paymentStatus DISPLAY only)

Academic Studio (Existing - Master Data)
  ├──► academicVerticals
  ├──► academicSubVerticals
  ├──► academicPrograms
  ├──► academicSubjects
  ├──► academicBatchTypes
  ├──► academicSessions
  └──► batches (Future — Phase 7 of DOC-07)
       └──► student (via enrollment)

Parent Portal (DOC-07 Phase 16)
  └──► familyContacts (role flags — DOC-05 Phase 3)
       └──► student (display only)

Student Mobile App (DOC-07 Phase 17)
  └──► familyContacts (hasAppAccess role flag)
       └──► student (display + notifications)
```

## Appendix C: The Complete Data Journey — Lead to Alumni

```
Step 1:  Marketing Source → leadMaster
Step 2:  Counselling → leadProfile, families, familyContacts
Step 3:  Admission Engine → admissions, checklist, verification, seat
Step 4:  STUDENT CREATED ← System (auto, when all checks pass)
Step 5:  Student Master → students record
Step 6:  Academic Profile → studentAcademicProfiles
Step 7:  Batch Allocated → enrollments + batches
Step 8:  Parent Portal Activated → portal accounts
Step 9:  Documents Inherited → leadDocuments → studentDocuments
Step 10: Classes Begin → attendanceTracking starts
Step 11: Daily: Attendance marked, fee tracked, communication sent
Step 12: Weekly: Quizzes, assignments, homework
Step 13: Monthly: Unit tests, attendance reports, fee reminders
Step 14: Term: Mid terms, report cards, parent meetings
Step 15: Session: Final exams, results, promotion or completion
Step 16: Completion → certificates issued
Step 17: Placement (if applicable) → interviews, offers, joining
Step 18: GRADUATION → status = "Graduated"
Step 19: ALUMNI → status = "Alumni" (continued engagement)
```

---

*End of DOC-07 — Student Lifecycle & Student 360° Bible*
