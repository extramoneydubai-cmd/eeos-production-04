# DOC-13 — HR & Employee Lifecycle Engine Bible

> **Status:** Architecture Blueprint (Draft)  
> **Domain:** Human Resources & Employee Management  
> **Owner:** EEOS Architecture Team  
> **Version:** 1.0  
> **Last Updated:** 2026-07-08  
> **Predecessor:** DOC-09 — Communication Engine, DOC-10 — Workflow & Automation, DOC-12 — Collection Center  
> **Existing Tables:** `users`, `designations`, `departments`, `companies`, `branches`, `teams`, `verticals`, `subVerticals`, `boards`, `sessions`, `userScopes`, `notifications`, `tasks`, `approvalRequests`, `channels`, `channelMembers`, `messages`

---

## Table of Contents

1. [HR Philosophy](#1-hr-philosophy)
2. [Employee Lifecycle](#2-employee-lifecycle)
3. [Employee Master](#3-employee-master)
4. [Recruitment Engine](#4-recruitment-engine)
5. [Onboarding](#5-onboarding)
6. [Attendance Engine](#6-attendance-engine)
7. [Leave Management](#7-leave-management)
8. [Payroll Relationship](#8-payroll-relationship)
9. [Performance Management](#9-performance-management)
10. [Training & Learning](#10-training--learning)
11. [Asset Management](#11-asset-management)
12. [Employee Documents](#12-employee-documents)
13. [Transfer & Promotion](#13-transfer--promotion)
14. [Exit Management](#14-exit-management)
15. [Employee Portal](#15-employee-portal)
16. [HR Dashboard](#16-hr-dashboard)
17. [Cross-Module Integration](#17-cross-module-integration)
18. [AI Opportunities](#18-ai-opportunities)
19. [Reports](#19-reports)
20. [Implementation Roadmap](#20-implementation-roadmap)
21. [Golden Rules](#21-golden-rules)

---

## 1. HR Philosophy

### Purpose

The HR & Employee Lifecycle Engine is the **people management backbone** of EEOS. It manages the complete employee journey — from recruitment and joining through performance, promotions, payroll, and eventual exit — while integrating with every other module that involves people.

### Core Principle

**Every module has one responsibility.**

| Module | Responsibility |
|--------|---------------|
| **Organization** | Owns the structural hierarchy (departments, designations, teams, branches) |
| **HR** | Owns people (employees, candidates, contractors, alumni) |
| **Technology** | Owns devices and IT assets (laptops, phones, licenses) |
| **Finance** | Owns salary, payroll, reimbursements, and tax deductions |
| **Workflow** | Owns approvals (leave, expenses, travel, promotion) |
| **Communication** | Owns notifications (announcements, reminders, alerts) |

### Business Rules

1. **Organization owns hierarchy.** The department/team/designation tree is maintained by Organization, not HR. HR references it.
2. **HR owns employees.** Every person who works for the organization has exactly one master record managed by HR.
3. **Technology owns devices.** Laptops, phones, SIM cards, software licenses are tracked by IT/Admin, not by HR.
4. **Finance owns salary.** Payroll, salary structure, tax deductions, reimbursements — all owned by Finance. HR reads but never modifies.
5. **Workflow owns approvals.** Leave requests, expense claims, travel requests all go through DOC-10.
6. **Communication owns notifications.** Announcements, alerts, reminders go through DOC-09.
7. **One employee, one master record.** No duplicate employee records across modules.
8. **Employee status is progressive.** Candidate → Probation → Confirmed → Notice → Exited → Alumni.
9. **Employment type is distinct.** Full-time, part-time, contract, intern, consultant — each with different rules.
10. **Everything is auditable.** Complete lifecycle history from joining to exit.

### The Employee Golden Flow

```
Organization Structure (Departments / Designations / Teams / Branches)
       │
       ▼
Recruitment ──► Offer ──► Joining ──► Onboarding ──► Probation
                                                         │
                                                    ┌────┴────┐
                                                    │         │
                                              Confirmed    Extended / Terminated
                                                    │
                                          ┌─────────┼─────────┐
                                          │         │         │
                                     Attendance  Payroll  Performance
                                          │         │         │
                                          └─────────┼─────────┘
                                                    │
                                          ┌─────────┼─────────┐
                                          │         │         │
                                     Promotion  Transfer  Training
                                                    │
                                               Notice Period
                                                    │
                                          ┌─────────┴─────────┐
                                          │                   │
                                        Exit              Alumni
```

### Existing Implementation

The current system already implements several foundational HR components:

| Component | Existing Implementation | Status |
|-----------|------------------------|--------|
| **User/Employee Master** | `users` table with name, email, role, departmentId, designationId, branchId, teamIds, phone, employeeCode, isDisabled | ✅ Existing |
| **User CRUD** | `createUser`, `updateUser`, `disableUser`, `enableUser`, `resetPassword` | ✅ Existing |
| **User Queries** | `currentUser`, `listUsers`, `listActiveUsers`, `getUsersByDepartment`, `getUsersByTeam` | ✅ Existing |
| **Organization Structure** | `departments`, `designations`, `companies`, `branches`, `teams`, `verticals` tables | ✅ Existing |
| **Organization CRUD** | Full CRUD for departments, designations, companies, branches, teams, verticals, subVerticals, boards | ✅ Existing |
| **User Scopes** | `userScopes` table + `getUserScope` + `updateUserScope` | ✅ Existing |
| **Clone/Transfer Access** | `cloneUserAccess`, `transferUserAccess` mutations | ✅ Existing |
| **Profile Page** | User profile with designation, department, branch, teams | ✅ Existing |
| **User Management UI** | Create users, set passwords, disable/enable | ✅ Existing |
| **Task Management** | `tasks` table with status, priority, assignment, due dates | ✅ Existing |
| **Approval Engine** | `approvalRequests`, `approvalRequestApprovers`, `approvalTemplates` | ✅ Existing |
| **Internal Communication** | `channels`, `channelMembers`, `messages`, `directMessages` | ✅ Existing |
| **Notifications** | `notifications` table with types (task, approval, message, mention, announcement) | ✅ Existing |

### DOC-13 Extensions Needed

| Feature | Description |
|---------|-------------|
| **Employee Master Enhancement** | Extend `users` table with DOB, gender, blood group, marital status, date of joining, PAN, Aadhaar, bank details, emergency contact |
| **Recruitment** | Job requisitions, interviews, offers, acceptance tracking |
| **Onboarding** | Checklist, document collection, ID card generation, biometric enrollment |
| **Attendance** | Daily check-in/check-out, biometric integration, QR/barcode scanning, GPS tracking |
| **Leave Management** | Leave types, balances, calendar, approval workflow |
| **Payroll Integration** | Salary structure, earnings, deductions, payslip generation (Finance owned) |
| **Performance Management** | KPI/KRA tracking, reviews, 360 feedback, goals |
| **Training & Learning** | Induction, skill training, certifications, completion tracking |
| **Asset Management** | Device assignment, return tracking, damage reporting |
| **Exit Management** | Notice period tracking, clearance, final settlement, relieving letter |

---

## 2. Employee Lifecycle

### Complete Employee Journey

```
                              EMPLOYEE LIFECYCLE
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   Candidate                                                             │
│      │                                                                  │
│      ▼                                                                  │
│   Interview ───► Rejected                                               │
│      │                                                                  │
│      ▼                                                                  │
│   Selected ───► Offer Letter ───► Accepted                              │
│                                        │                                │
│                                        ▼                                │
│                                   Joining Day                           │
│                                        │                                │
│                                        ▼                                │
│                                  Onboarding                             │
│                                        │                                │
│                                        ▼                                │
│                                  Probation                              │
│                                        │                                │
│                              ┌─────────┴─────────┐                      │
│                              │                   │                      │
│                         Confirmed          Probation Extended           │
│                              │                   │                      │
│                              │                   └──► Terminated        │
│                              │                                          │
│                 ┌────────────┼────────────┬────────────┐                │
│                 │            │            │            │                │
│            Attendance    Payroll    Performance    Training              │
│                 │            │            │            │                │
│                 └────────────┼────────────┼────────────┘                │
│                              │            │                            │
│                 ┌────────────┼────────────┼────────────┐                │
│                 │            │            │            │                │
│            Promotion    Transfer    Appraisal    Resignation            │
│                                                           │             │
│                                                           ▼             │
│                                                     Notice Period       │
│                                                           │             │
│                              ┌────────────────────────────┼──┐          │
│                              │                            │  │          │
│                         Exit (Resigned / Retired /      Clearance       │
│                               Terminated)                    │          │
│                              │                            │             │
│                              ▼                            ▼             │
│                         Employee Alumni             Final Settlement    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Lifecycle States

| State | Definition | Owner | Duration |
|-------|-----------|-------|----------|
| **Candidate** | Applied but not yet hired | Recruitment | Variable |
| **Onboarding** | Joined but not yet active in systems | HR | 1-7 days |
| **Probation** | Trial period with performance review | HR + Manager | 1-6 months |
| **Confirmed** | Permanent employee with full benefits | HR | Indefinite |
| **Notice** | Has resigned or been terminated, serving notice period | HR + Manager | 1-3 months |
| **Exited** | Employment ended, awaiting clearance | HR + Finance + IT | 1-30 days |
| **Alumni** | Former employee (network maintained) | Alumni Relations | Ongoing |

### Employment Types

| Type | Description | Benefits | Contract Required |
|------|-------------|----------|-------------------|
| **Full-Time** | Permanent employee, 40+ hrs/week | Full | Yes |
| **Part-Time** | Permanent employee, reduced hours | Pro-rated | Yes |
| **Contract** | Fixed-term engagement | Limited | Yes |
| **Intern** | Temporary training period | Stipend | Yes |
| **Consultant** | Project-based engagement | By project | Yes |
| **Probation** | Trial period, pending confirmation | Limited | Yes |

---

## 3. Employee Master

### Purpose

The Employee Master is the **single source of truth** for all employee information. Every module references this record. No module duplicates employee data.

### Current Implementation (`users` table)

The `users` table in `schema.ts` already contains:

| Field | Type | Purpose |
|-------|------|---------|
| `_id` | `id("users")` | Unique user identifier |
| `name` | `optional(string)` | Full name |
| `image` | `optional(string)` | Profile photo |
| `email` | `optional(string)` | Email address |
| `emailVerificationTime` | `optional(number)` | When email was verified |
| `isAnonymous` | `optional(boolean)` | Anonymous user flag |
| `role` | `optional(roleValidator)` | Platform role (super_admin, admin, manager, staff) |
| `username` | `optional(string)` | Login username |
| `passwordHash` | `optional(string)` | Auth password hash |
| `isDisabled` | `optional(boolean)` | Account disabled flag |
| `designationId` | `optional(id("designations"))` | Designation reference |
| `departmentId` | `optional(id("departments"))` | Department reference |
| `companyId` | `optional(id("companies"))` | Company reference |
| `branchId` | `optional(id("branches"))` | Branch reference |
| `verticalId` | `optional(id("verticals"))` | Vertical reference |
| `teamIds` | `optional(array(id("teams")))` | Team memberships |
| `phone` | `optional(string)` | Phone number |
| `employeeCode` | `optional(string)` | Employee code |
| `lastLoginAt` | `optional(number)` | Last login timestamp |

### DOC-13 Extensions

| Field | Type | Purpose |
|-------|------|---------|
| `employeeId` | `string` | Auto-generated unique employee number (EEOS-EMP-YYYY-SSSS) |
| `dateOfJoining` | `optional(number)` | Joining date |
| `dateOfBirth` | `optional(number)` | Date of birth |
| `gender` | `optional(string)` | Male / Female / Other |
| `bloodGroup` | `optional(string)` | Blood group (A+, A-, B+, B-, O+, O-, AB+, AB-) |
| `maritalStatus` | `optional(string)` | Single / Married / Divorced / Widowed |
| `employmentType` | `optional(string)` | FullTime / PartTime / Contract / Intern / Consultant |
| `employmentStatus` | `optional(string)` | Probation / Confirmed / Notice / Exited / Alumni |
| `probationEndDate` | `optional(number)` | End of probation period |
| `confirmationDate` | `optional(number)` | Date of confirmation |
| `noticePeriodDays` | `optional(number)` | Notice period in days |
| `reportingManagerId` | `optional(id("users"))` | Direct reporting manager |
| `panNumber` | `optional(string)` | PAN card number |
| `aadhaarNumber` | `optional(string)` | Aadhaar number |
| `uanNumber` | `optional(string)` | PF/UAN number |
| `bankAccountNumber` | `optional(string)` | Bank account number |
| `bankName` | `optional(string)` | Bank name |
| `ifscCode` | `optional(string)` | IFSC code |
| `emergencyContactName` | `optional(string)` | Emergency contact person |
| `emergencyContactPhone` | `optional(string)` | Emergency contact phone |
| `emergencyContactRelation` | `optional(string)` | Relationship |
| `currentAddress` | `optional(string)` | Current residential address |
| `permanentAddress` | `optional(string)` | Permanent address |
| `highestQualification` | `optional(string)` | Highest educational qualification |
| `previousExperience` | `optional(number)` | Years of previous experience |
| `skills` | `optional(array(string))` | Skill tags |
| `resumeUrl` | `optional(string)` | Resume/CV document URL |
| `offerLetterUrl` | `optional(string)` | Offer letter document URL |
| `joiningLetterUrl` | `optional(string)` | Joining letter document URL |
| `idCardUrl` | `optional(string)` | Employee ID card URL |
| `profilePhoto` | `optional(string)` | Employee photograph |
| `exitDate` | `optional(number)` | Date of exit |
| `exitReason` | `optional(string)` | Reason for exit |
| `exitType` | `optional(string)` | Resigned / Retired / Terminated / Transferred |

### Employee Number Format

```
EEOS-EMP-{Year}-{Sequence}

Example: EEOS-EMP-2026-0042
```

### Employee Status Lifecycle

```
Probation ──► Confirmed ──► Notice ──► Exited ──► Alumni
     │                           │
     └──► Terminated             │
                                 │
                    ┌────────────┴────────────┐
                    │                         │
               Resigned                   Retired
                    │                         │
                    └──────────┬──────────────┘
                               │
                              Exited
                               │
                               ▼
                             Alumni
```

### Master Data References

| Reference | Table | Purpose |
|-----------|-------|---------|
| `designationId` | `designations` | Employee's position in hierarchy |
| `departmentId` | `departments` | Functional department |
| `companyId` | `companies` | Legal entity/company |
| `branchId` | `branches` | Physical branch/location |
| `verticalId` | `verticals` | Business vertical |
| `teamIds` | `teams` | Team memberships (many-to-many) |
| `reportingManagerId` | `users` | Reporting manager (self-referencing) |

### Role Hierarchy

```
Super Admin ─── System-wide access
    │
Admin ─── Org-wide administration
    │
Manager ─── Department/Team-level management
    │
Staff ─── Operational access
```

---

## 4. Recruitment Engine

### Purpose

The Recruitment Engine manages the entire hiring pipeline — from job requisition to offer acceptance. It ensures a structured, auditable hiring process.

### Recruitment Lifecycle

```
Job Requisition
    │
    ├── Approval (if required)
    │
    ▼
Job Posting (Internal / External)
    │
    ▼
Application Collection
    │
    ├── Resume Screening (AI-assisted)
    ├── Shortlisting
    │
    ▼
Interview Scheduling
    │
    ├── Round 1 (Technical / Aptitude)
    ├── Round 2 (HR / Manager)
    ├── Round 3 (Panel / Director)
    │
    ▼
Assessment & Scoring
    │
    ├── Pass → Offer Preparation
    └── Fail → Rejection → Talent Pool
    │
    ▼
Offer Letter
    │
    ├── Accepted → Pre-Joining Onboarding
    ├── Declined → Talent Pool
    └── Negotiation → Revised Offer
```

### Job Requisition Entity

| Field | Type | Purpose |
|-------|------|---------|
| `jobRequisitionId` | `id("jobRequisitions")` | Unique ID |
| `title` | `string` | Job title |
| `departmentId` | `id("departments")` | Department reference |
| `designationId` | `id("designations")` | Designation reference |
| `branchId` | `id("branches")` | Branch reference |
| `vacancies` | `number` | Number of positions |
| `employmentType` | `string` | FullTime / PartTime / Contract / Intern |
| `minExperience` | `optional(number)` | Minimum years of experience |
| `maxExperience` | `optional(number)` | Maximum years of experience |
| `minSalary` | `optional(number)` | Minimum salary budget |
| `maxSalary` | `optional(number)` | Maximum salary budget |
| `skills` | `optional(array(string))` | Required skills |
| `qualification` | `optional(string)` | Required qualification |
| `description` | `optional(string)` | Job description |
| `status` | `string` | Draft / Open / InProgress / Filled / Cancelled |
| `requestedBy` | `id("users")` | Requester |
| `approvedBy` | `optional(id("users"))` | Approver |
| `filledAt` | `optional(number)` | When all positions were filled |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Candidate Entity

| Field | Type | Purpose |
|-------|------|---------|
| `candidateId` | `id("candidates")` | Unique ID |
| `requisitionId` | `id("jobRequisitions")` | Linked job |
| `firstName` | `string` | First name |
| `lastName` | `string` | Last name |
| `email` | `string` | Email |
| `phone` | `string` | Phone |
| `resumeUrl` | `optional(string)` | Resume URL |
| `source` | `string` | Referral / JobPortal / Campus / Agency / LinkedIn / Walkin |
| `referralId` | `optional(id("users"))` | Referring employee |
| `currentCompany` | `optional(string)` | Current employer |
| `currentDesignation` | `optional(string)` | Current designation |
| `totalExperience` | `optional(number)` | Total years of experience |
| `currentSalary` | `optional(number)` | Current salary |
| `expectedSalary` | `optional(number)` | Expected salary |
| `noticePeriod` | `optional(number)` | Notice period in days |
| `qualification` | `optional(string)` | Highest qualification |
| `skills` | `optional(array(string))` | Skill tags |
| `status` | `string` | Applied / Shortlisted / Interview / Offered / Accepted / Rejected / Hold |
| `score` | `optional(number)` | Overall assessment score |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Interview Entity

| Field | Type | Purpose |
|-------|------|---------|
| `interviewId` | `id("interviews")` | Unique ID |
| `candidateId` | `id("candidates")` | Candidate reference |
| `round` | `number` | Round number (1, 2, 3, etc.) |
| `type` | `string` | Technical / HR / Manager / Panel / Practical |
| `mode` | `string` | Online / Offline / Telephonic |
| `scheduledDate` | `number` | Interview date |
| `startTime` | `number` | Start time |
| `endTime` | `number` | End time |
| `interviewerIds` | `array(id("users"))` | Interviewers |
| `venue` | `optional(string)` | Location / meeting link |
| `score` | `optional(number)` | Score out of 100 |
| `feedback` | `optional(string)` | Interviewer feedback |
| `result` | `string` | Pass / Fail / Hold / Reschedule |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Offer Letter Entity

| Field | Type | Purpose |
|-------|------|---------|
| `offerId` | `id("offers")` | Unique ID |
| `candidateId` | `id("candidates")` | Candidate reference |
| `requisitionId` | `id("jobRequisitions")` | Job reference |
| `designation` | `string` | Offered designation |
| `department` | `string` | Offered department |
| `branch` | `string` | Offered branch |
| `ctc` | `number` | Total cost to company |
| `baseSalary` | `number` | Base salary |
| `allowances` | `optional(string)` | Allowance breakdown |
| `joiningDate` | `number` | Expected joining date |
| `status` | `string` | Draft / Sent / Accepted / Declined / Negotiation / Expired |
| `sentAt` | `optional(number)` | When offer was sent |
| `respondedAt` | `optional(number)` | When candidate responded |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Recruitment Sources

| Source | Description | Cost |
|--------|-------------|------|
| **Referral** | Employee referral | Incentive payment |
| **Job Portal** | Naukri, Indeed, LinkedIn | Paid listing |
| **Campus** | College placement drives | No cost (relationship) |
| **Agency** | Recruitment agency | Commission-based |
| **LinkedIn** | Direct LinkedIn sourcing | Premium account |
| **Walk-in** | Walk-in interviews | No cost |
| **Company Website** | Careers page | No cost |
| **Social Media** | Facebook, Twitter, Instagram | Low cost |

### Recruitment Dashboard

```text
┌─────────────────────────────────────────────────────────────────────┐
│  📋 RECRUITMENT DASHBOARD — October 2026                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Open     │ │ Applied  │ │ Interview│ │ Offers   │ │ Time to  │ │
│  │ Positions│ │ This Mo. │ │ This Mo. │ │ This Mo. │ │ Hire     │ │
│  │    5     │ │    42    │ │    28    │ │    8     │ │ 18 days  │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│                                                                     │
│  RECRUITMENT FUNNEL (This Month)                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Applied      ████████████████████████████████████████  42    │  │
│  │ Shortlisted  ██████████████████████████████            32    │  │
│  │ Interviewed  ██████████████████████████                 28    │  │
│  │ Passed       ██████████████                            14    │  │
│  │ Offered      ████████                                   8    │  │
│  │ Accepted     ██████                                     6    │  │
│  │ Joined       ████                                       4    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Conversion Rate: 14.2% (Applied → Joined)                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Onboarding

### Purpose

Onboarding transforms a **new joiner** into a **productive employee** by ensuring all accounts, documents, equipment, and training are in place before or on day one.

### Onboarding Stages

```
Pre-Joining (Before Day 1)
    │
    ├── Welcome email sent (DOC-09)
    ├── Document collection (scanned copies)
    ├── Background verification initiated
    ├── Offer acceptance confirmation
    └── Pre-joining training materials shared
    │
    ▼
Day 1 — Joining
    │
    ├── Welcome kit distribution
    ├── ID card issuance
    ├── Account creation (email, systems)
    ├── Laptop/equipment assignment
    ├── Biometric enrollment (fingerprint / face)
    ├── Introduction to team
    └── Onboarding orientation
    │
    ▼
Week 1 — Foundation
    │
    ├── HR policy familiarization
    ├── Timesheet/attendance system training
    ├── Benefits enrollment
    ├── Bank details verification
    └── Initial task assignment
    │
    ▼
Month 1 — Integration
    │
    ├── First performance check-in
    ├── Project/team role clarification
    ├── Training needs assessment
    └── Mentorship assignment
```

### Onboarding Checklist

| Item | Category | Owner | Due |
|------|----------|-------|-----|
| Welcome Email Sent | Communication | HR | T-7 days |
| Document Collection | Documents | Employee | T-3 days |
| Background Verification | Verification | HR | T-0 days |
| Email Account Created | IT | IT | T-1 day |
| Laptop Assigned | Assets | IT | T-1 day |
| ID Card Printed | Admin | HR | T-0 days |
| Biometric Enrolled | Attendance | IT | Day 1 |
| Welcome Kit Ready | Admin | HR | T-0 days |
| Desk/Workspace Assigned | Admin | Admin | T-1 day |
| System Access Granted | IT | IT | T-0 days |
| Benefits Enrollment | HR | HR | Day 1-7 |
| Bank Details Collected | Finance | Employee | Day 1-3 |
| Mentor Assigned | HR | Manager | Week 1 |
| Training Plan Created | L&D | HR | Week 1 |

### Onboarding Task Creation (via DOC-10)

When a candidate accepts an offer and a joining date is confirmed, DOC-10 triggers an automated onboarding workflow:

```yaml
Trigger: offer.accepted
  └── Actions:
      ├── Create Task: "Send Welcome Email" (HR) → Due: T-7
      ├── Create Task: "Prepare Laptop" (IT) → Due: T-1
      ├── Create Task: "Create Email Account" (IT) → Due: T-1
      ├── Create Task: "Print ID Card" (HR) → Due: T-0
      ├── Create Task: "Setup Desk" (Admin) → Due: T-1
      ├── Create Task: "Enroll Biometric" (IT) → Due: Day 1
      └── Send Notification: "New joiner arriving on {date}" to Manager + Team
```

---

## 6. Attendance Engine

### Purpose

The Attendance Engine tracks **employee check-in and check-out** across multiple modalities and integrates with leave, payroll, and performance modules.

### Current Status

**No attendance infrastructure exists in the codebase yet.** This section defines the future architecture.

### Attendance Methods

| Method | Description | Hardware Needed | Best For |
|--------|-------------|----------------|----------|
| **Biometric (Fingerprint)** | Fingerprint scan at device | Biometric device | Office employees |
| **Face Recognition** | Facial scan via camera | Camera + software | All employees |
| **QR/Barcode** | Scan QR at entrance | QR reader + card | All employees |
| **GPS/Location** | Mobile GPS check-in | Smartphone | Field staff |
| **Mobile Check-in** | App-based manual check-in | Smartphone | Remote employees |
| **Manual Entry** | HR/admin enters attendance | None | Exceptions/corrections |

### Attendance Entity

| Field | Type | Purpose |
|-------|------|---------|
| `attendanceId` | `id("attendance")` | Unique ID |
| `employeeId` | `id("users")` | Employee reference |
| `date` | `number` | Attendance date (start of day) |
| `checkIn` | `optional(number)` | Check-in timestamp |
| `checkOut` | `optional(number)` | Check-out timestamp |
| `method` | `string` | Biometric / Face / QR / GPS / Mobile / Manual |
| `deviceId` | `optional(string)` | Device identifier |
| `location` | `optional(string)` | GPS coordinates (lat/lng) |
| `status` | `string` | Present / Absent / HalfDay / Late / EarlyExit / Holiday / Leave |
| `lateMinutes` | `optional(number)` | Minutes late |
| `earlyExitMinutes` | `optional(number)` | Minutes early exit |
| `overtimeMinutes` | `optional(number)` | Overtime minutes |
| `correctionRequested` | `optional(boolean)` | Is correction pending |
| `correctionReason` | `optional(string)` | Reason for correction |
| `approvedBy` | `optional(id("users"))` | Approver for corrections |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Shift Entity

| Field | Type | Purpose |
|-------|------|---------|
| `shiftId` | `id("shifts")` | Unique ID |
| `name` | `string` | Shift name (e.g., "General", "Night", "Flexible") |
| `startTime` | `string` | Shift start (HH:mm) |
| `endTime` | `string` | Shift end (HH:mm) |
| `graceLateMinutes` | `number` | Grace period for late arrival |
| `graceEarlyMinutes` | `number` | Grace period for early exit |
| `halfDayAfter` | `number` | Hours after which half-day applies |
| `fullDayAfter` | `number` | Hours after which full-day credited |
| `isNightShift` | `boolean` | Night shift flag |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Attendance Rules

```yaml
General Rules:
  - Check-in before shift start + grace period → "Present"
  - Check-in after grace period → "Late" (counts late minutes)
  - Check-in after halfDayAfter → "HalfDay"
  - No check-in → "Absent"
  - Check-out before shift end - grace → "EarlyExit"
  - Total hours >= fullDayAfter → Full day credit
  - Total hours >= halfDayAfter but < fullDayAfter → Half day credit

Overtime:
  - Hours worked beyond shift end → Overtime
  - Overtime requires manager approval
  - Overtime can be compensated as time-off or pay

Corrections:
  - Employee can request attendance correction
  - Requires manager/HR approval
  - Correction logs the original entry and corrected entry
```

### Attendance Dashboard

```text
┌─────────────────────────────────────────────────────────────────────┐
│  📊 ATTENDANCE DASHBOARD — 15-Oct-2026                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Present  │ │ Absent   │ │ Late     │ │ Half Day │ │ Holiday  │ │
│  │   142    │ │    8     │ │    12    │ │    3     │ │  No     │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│                                                                     │
│  Attendance % Today: 85.5%    This Month Avg: 88.3%                │
│                                                                     │
│  LATE ARRIVALS (Today)                                              │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ 🟡 Ananya Sharma — 15 min late — Shift: 9:00 AM          │      │
│  │ 🟡 Rajesh Patel — 22 min late — Shift: 9:00 AM           │      │
│  │ 🟡 Priya Singh — 10 min late — Shift: 9:00 AM            │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                     │
│  DEPARTMENTS WITH LOW ATTENDANCE (< 80%)                            │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ 🔴 Sales — 72% | 12 absent, 8 late this month            │      │
│  │ 🟡 Operations — 78% | 6 absent, 4 late this month        │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Short Attendance Alerts

When an employee's attendance percentage drops below a threshold, automated alerts are triggered via DOC-09:

```yaml
Trigger: attendance.belowThreshold (e.g., < 75%)
  └── Actions:
      ├── Notify Employee (WhatsApp): "Your attendance is at 72%. Please maintain minimum 75%."
      ├── Notify Manager (WhatsApp): "{Employee} has low attendance ({percent}%). Please counsel."
      ├── Create HR Task: "Counsel employee about low attendance"
      └── If below 65% for 3 consecutive months → Escalate to HR Manager
```

---

## 7. Leave Management

### Purpose

The Leave Management system handles **leave applications, approvals, balance tracking, and calendar integration** for all employees.

### Current Status

**No leave infrastructure exists in the codebase yet.** This section defines the future architecture.

### Leave Types

| Leave Type | Code | Days/Year | Carry Forward | Encashable | Approval Required |
|------------|------|-----------|---------------|------------|-------------------|
| **Casual Leave** | CL | 12 | No | No | Manager |
| **Sick Leave** | SL | 12 | No | No | Manager |
| **Earned Leave** | EL | 18 | Yes (max 45) | Yes | Manager |
| **Maternity Leave** | ML | 180 | No | No | HR |
| **Paternity Leave** | PL | 15 | No | No | HR |
| **Bereavement Leave** | BL | 5 | No | No | Manager |
| **Marriage Leave** | ML | 3 | No | No | Manager |
| **Compensatory Off** | CO | Variable | No | No | Manager |
| **Loss of Pay** | LOP | Unlimited | — | — | Manager |
| **Work From Home** | WFH | 30 | No | No | Manager |

### Leave Balance Entity

| Field | Type | Purpose |
|-------|------|---------|
| `balanceId` | `id("leaveBalances")` | Unique ID |
| `employeeId` | `id("users")` | Employee reference |
| `year` | `number` | Leave year (e.g., 2026) |
| `leaveType` | `string` | CL / SL / EL / ML / PL / CO / WFH |
| `totalDays` | `number` | Total allocated |
| `usedDays` | `number` | Days used |
| `pendingDays` | `number` | Days in pending requests |
| `carriedDays` | `number` | Carried forward from previous year |
| `remainingDays` | `number` | Available balance |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Leave Request Entity

| Field | Type | Purpose |
|-------|------|---------|
| `leaveRequestId` | `id("leaveRequests")` | Unique ID |
| `employeeId` | `id("users")` | Employee reference |
| `leaveType` | `string` | CL / SL / EL / ML / PL / CO / WFH / LOP |
| `startDate` | `number` | Leave start date |
| `endDate` | `number` | Leave end date |
| `totalDays` | `number` | Total days requested |
| `reason` | `optional(string)` | Reason for leave |
| `status` | `string` | Pending / Approved / Rejected / Cancelled |
| `approvedBy` | `optional(id("users"))` | Approver |
| `approvedAt` | `optional(number)` | Approval timestamp |
| `rejectionReason` | `optional(string)` | Rejection reason |
| `isHalfDay` | `optional(boolean)` | Half-day leave flag |
| `emergencyContact` | `optional(string)` | Emergency contact during leave |
| `handoverNotes` | `optional(string)` | Work handover notes |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Leave Approval Workflow (via DOC-10)

```yaml
Trigger: leave.requested
  └── Condition: balance >= requested days
        ├── Yes → Route to manager for approval
        │     ├── Approved → Balance deducted, calendar updated, employee notified
        │     └── Rejected → Balance released, employee notified with reason
        └── No → Reject with "Insufficient balance" notification

Escalation:
  - If leave > 3 days → Auto-route to HR after manager approval
  - If manager doesn't respond in 48h → Escalate to department head
  - If employee has history of leave abuse → Flag for HR review
```

### Leave Calendar

```text
┌─────────────────────────────────────────────────────────────────────┐
│  📅 LEAVE CALENDAR — October 2026                                    │
├─────────────────────────────────────────────────────────────────────┤
│  Mon  │ Tue  │ Wed  │ Thu  │ Fri  │ Sat  │ Sun  │                  │
│───────┼──────┼──────┼──────┼──────┼──────┼──────┤                  │
│       │      │  1   │  2   │  3   │  4   │  5   │                  │
│       │      │      │      │  🏖️  │      │      │                  │
│       │      │      │      │ Raj  │      │      │                  │
│───────┼──────┼──────┼──────┼──────┼──────┼──────┤                  │
│  6    │  7   │  8   │  9   │  10  │  11  │  12  │                  │
│      │      │  🏖️ │  🏖️ │  🏖️ │      │      │                  │
│      │      │ Priya│ Priya│ Priya│      │      │                  │
│───────┼──────┼──────┼──────┼──────┼──────┼──────┤                  │
│  13   │  14  │  15  │  16  │  17  │  18  │  19  │                  │
│      │      │      │      │      │      │      │                  │
│───────┼──────┼──────┼──────┼──────┼──────┼──────┤                  │
│  20   │  21  │  22  │  23  │  24  │  25  │  26  │                  │
│      │      │      │      │      │      │      │                  │
│───────┼──────┼──────┼──────┼──────┼──────┼──────┤                  │
│  27   │  28  │  29  │  30  │  31  │      │      │                  │
│      │      │      │      │      │      │      │                  │
│─────────────────────────────────────────────────────┤                  │
│  Legend: 🏖️ Leave  🏥 Sick  🏠 WFH  🎉 Holiday  │                  │
│  Department Strength: 25/30 today (5 on leave)      │                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. Payroll Relationship

### Core Principle

**Finance owns salary. HR reads but never modifies.**

The Payroll module is owned by **Finance** (DOC-08). The HR Engine only:
- Provides employee master data (name, department, bank details, PAN)
- Tracks attendance and leave (for salary computation)
- Initiates salary revisions (promotions, increments)
- Displays payslips in employee portal

### What Finance Owns

| Component | Description | Owned By |
|-----------|-------------|----------|
| Salary Structure | Base, allowances, deductions | Finance |
| Payroll Run | Monthly payroll processing | Finance |
| Tax Calculation | TDS, professional tax | Finance |
| PF/ESI Calculation | Provident fund, insurance | Finance |
| Bonus & Incentives | Performance bonus, annual bonus | Finance |
| Reimbursements | Travel, medical, telephone | Finance |
| Loans & Advances | Salary advance, loan deduction | Finance |
| Payslip Generation | Monthly payslip creation | Finance |
| Bank File Generation | Salary transfer file | Finance |
| Form 16 | Annual tax certificate | Finance |

### What HR Provides to Finance

| Data | Source | Frequency |
|------|--------|-----------|
| Employee Master | `users` table | Updated on change |
| Bank Details | Employee master | On joining/update |
| PAN Number | Employee master | On joining |
| Attendance Summary | Attendance engine | Monthly |
| Leave Balance | Leave management | Monthly |
| New Joiners | Onboarding | Monthly |
| Exits | Exit management | Monthly |
| Promotions/Increments | Performance | On approval |

### Salary Revision Flow

```
Manager recommends promotion/increment
       │
       ▼
Approval via DOC-10 (Workflow)
       │
       ├── Approved → HR updates employee master (designation, salary)
       │     │
       │     ▼
       │   Finance creates revised salary structure
       │     │
       │     ▼
       │   Payslip reflects new salary from effective date
       │
       └── Rejected → Employee notified via DOC-09
```

---

## 9. Performance Management

### Purpose

The Performance Management system tracks **employee goals, KPIs, reviews, and feedback** to drive performance improvement, promotion decisions, and training needs.

### Performance Cycle

```
Goal Setting (Start of Year)
    │
    ├── Employee sets KRAs with manager
    ├── KPIs defined with measurable targets
    ├── Personal development goals
    │
    ▼
Mid-Year Review (6 Months)
    │
    ├── Progress check on goals
    ├── Course correction if needed
    ├── Interim feedback collection
    │
    ▼
Annual Review (Year End)
    │
    ├── Self-assessment
    ├── Manager assessment
    ├── 360-degree feedback (peers, subordinates, stakeholders)
    ├── Final rating and score
    ├── Promotion recommendation
    ├── Bonus/increment determination
    │
    ▼
Review Meeting
    │
    ├── Score shared with employee
    ├── Development plan created
    ├── New goals for next cycle
```

### Performance Entity

| Field | Type | Purpose |
|-------|------|---------|
| `performanceId` | `id("performance")` | Unique ID |
| `employeeId` | `id("users")` | Employee reference |
| `reviewPeriod` | `string` | e.g., "H1 2026", "Annual 2025-26" |
| `selfRating` | `optional(number)` | Self-rating (1-5) |
| `managerRating` | `optional(number)` | Manager rating (1-5) |
| `finalRating` | `optional(number)` | Final rating |
| `status` | `string` | Draft / SelfReview / ManagerReview / Completed |
| `goals` | `optional(string)` | JSON of goals and KPIs |
| `achievements` | `optional(string)` | Key achievements |
| `areasOfImprovement` | `optional(string)` | Improvement areas |
| `trainingNeeds` | `optional(string)` | Recommended training |
| `promotionRecommended` | `optional(boolean)` | Promotion flag |
| `newDesignationId` | `optional(id("designations"))` | Recommended designation |
| `salaryRevision` | `optional(number)` | Recommended increment % |
| `reviewedBy` | `optional(id("users"))` | Reviewer (manager) |
| `reviewedAt` | `optional(number)` | Review completion date |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### 360 Feedback Entity

| Field | Type | Purpose |
|-------|------|---------|
| `feedbackId` | `id("feedback")` | Unique ID |
| `employeeId` | `id("users")` | Employee being reviewed |
| `reviewerId` | `id("users")` | Person giving feedback |
| `relationship` | `string` | Manager / Peer / Subordinate / Stakeholder |
| `rating` | `number` | Rating (1-5) |
| `strengths` | `optional(string)` | Strengths identified |
| `improvements` | `optional(string)` | Areas to improve |
| `comments` | `optional(string)` | Additional comments |
| `isAnonymous` | `boolean` | Anonymous flag |
| `status` | `string` | Pending / Submitted |
| `createdAt` | `number` | Timestamp |

### Performance Scorecard

```text
┌─────────────────────────────────────────────────────────────────────┐
│  📊 EMPLOYEE PERFORMANCE SCORECARD — Ananya Sharma                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Overall Rating: 4.2 / 5.0                                         │
│                                                                     │
│  KRAs                                                                 │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ KRA                      │ Target │ Actual │ Score       │      │
│  ├──────────────────────────────────────────────────────────┤      │
│  │ Admission Conversion %   │ 35%    │ 38%    │ 🟢 4.5/5   │      │
│  │ Revenue Collection       │ ₹4L    │ ₹4.2L  │ 🟢 4.5/5   │      │
│  │ Lead Response Time       │ <30m   │ 22m    │ 🟢 5.0/5   │      │
│  │ Customer Satisfaction    │ 4.0    │ 4.3    │ 🟢 4.0/5   │      │
│  │ Team Collaboration       │ —      │ —      │ 🟡 3.0/5   │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                     │
│  360 Feedback Summary (8 responses):                               │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ Manager:   ⭐⭐⭐⭐⭐ "Top performer, great with leads"       │      │
│  │ Peers:     ⭐⭐⭐⭐⭐ "Collaborative and helpful"              │      │
│  │ Team:      ⭐⭐⭐⭐ "Good mentor, sometimes micromanages"     │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                     │
│  Recommendations: Promoted to Senior Counsellor                    │
│  Salary Revision: +15%                                              │
│  Training Need: Leadership Development Program                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 10. Training & Learning

### Purpose

The Training & Learning module manages **employee skill development** through structured training programs, certifications, and learning paths.

### Training Types

| Type | Description | Duration | Mode |
|------|-------------|----------|------|
| **Induction** | New joiner orientation | 1-3 days | In-person |
| **Compliance** | Mandatory statutory training | Half day | Online |
| **Skill Training** | Technical/professional skills | 1-5 days | Hybrid |
| **Soft Skills** | Communication, leadership, teamwork | 1-3 days | Workshop |
| **Certification** | External certification program | Variable | External |
| **Learning Path** | Curated multi-course journey | Weeks/Months | Online |

### Training Entity

| Field | Type | Purpose |
|-------|------|---------|
| `trainingId` | `id("training")` | Unique ID |
| `name` | `string` | Training name |
| `type` | `string` | Induction / Compliance / Skill / SoftSkill / Certification |
| `mode` | `string` | Online / Offline / Hybrid |
| `trainer` | `optional(string)` | Internal/external trainer |
| `duration` | `number` | Duration in hours |
| `startDate` | `optional(number)` | Start date |
| `endDate` | `optional(number)` | End date |
| `departmentId` | `optional(id("departments"))` | Target department |
| `skillsCovered` | `optional(array(string))` | Skills covered |
| `completionCriteria` | `optional(string)` | How completion is measured |
| `status` | `string` | Planned / Ongoing / Completed |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Training Enrollment Entity

| Field | Type | Purpose |
|-------|------|---------|
| `enrollmentId` | `id("trainingEnrollments")` | Unique ID |
| `trainingId` | `id("training")` | Training reference |
| `employeeId` | `id("users")` | Employee reference |
| `status` | `string` | Enrolled / InProgress / Completed / Dropped |
| `score` | `optional(number)` | Assessment score |
| `certificateUrl` | `optional(string)` | Certificate URL |
| `completedAt` | `optional(number)` | Completion date |
| `feedback` | `optional(string)` | Participant feedback |
| `createdAt` | `number` | Timestamp |

---

## 11. Asset Management

### Purpose

The Asset Management module tracks **company-owned equipment** assigned to employees — from laptops and phones to software licenses and furniture.

### Current Status

**No asset management infrastructure exists in the codebase yet.** This section defines the future architecture.

### Asset Types

| Category | Examples |
|----------|----------|
| **IT Equipment** | Laptop, Desktop, Monitor, Keyboard, Mouse, Headset, Webcam |
| **Mobile** | Phone, SIM Card, Dongle, Tablet |
| **Access** | ID Card, Biometric Card, Access Fob, Keys |
| **Software** | OS License, Office License, Adobe, IDE, VPN, Antivirus |
| **Furniture** | Chair, Desk, Cabinet |
| **Vehicle** | Company car, Bike, Fuel Card |

### Asset Entity

| Field | Type | Purpose |
|-------|------|---------|
| `assetId` | `id("assets")` | Unique ID |
| `assetCode` | `string` | Asset tag number |
| `name` | `string` | Asset name |
| `category` | `string` | IT / Mobile / Access / Software / Furniture / Vehicle |
| `brand` | `optional(string)` | Brand |
| `model` | `optional(string)` | Model number |
| `serialNumber` | `optional(string)` | Manufacturer serial number |
| `purchaseDate` | `optional(number)` | Purchase date |
| `purchaseAmount` | `optional(number)` | Purchase cost |
| `warrantyExpiry` | `optional(number)` | Warranty end date |
| `status` | `string` | Available / Assigned / UnderRepair / Damaged / Disposed |
| `assignedTo` | `optional(id("users"))` | Currently assigned employee |
| `assignedAt` | `optional(number)` | Assignment date |
| `returnedAt` | `optional(number)` | Return date |
| `location` | `optional(string)` | Physical location |
| `notes` | `optional(string)` | Additional notes |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Asset Assignment Flow

```
Asset purchased → Status: Available
       │
       ▼
Employee requests asset / IT assigns asset
       │
       ▼
Asset status → Assigned
       │
       ▼
Employee acknowledges receipt
       │
       ▼
Asset tracked in employee's asset list
       │
       │
       ├── Employee returns → Asset status → Available
       ├── Employee exits → Auto-return triggered in clearance
       ├── Damaged → Status → UnderRepair
       └── Lost → Status → Damaged (write-off)
```

### Employee Asset Dashboard

```text
┌─────────────────────────────────────────────────────────────────────┐
│  💻 MY ASSETS — Ananya Sharma                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐          │
│  │ Asset    │ Code     │ Assigned │ Status   │ Warranty │          │
│  ├──────────┼──────────┼──────────┼──────────┼──────────┤          │
│  │ 💻 Laptop│ AST-0042 │ 15-Jan   │ ✅ Good  │ Dec 2027 │          │
│  │ 📱 Phone │ AST-0043 │ 15-Jan   │ ✅ Good  │ Dec 2027 │          │
│  │ 🪪 ID Card│ AST-0044│ 15-Jan   │ ✅ Active│ —        │          │
│  │ 🎧 Headset│ AST-0045│ 20-Feb   │ ⚠️ Damage│ —        │          │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 12. Employee Documents

### Purpose

The Employee Documents module stores and manages **all employee-related documents** throughout the employment lifecycle.

### Document Categories

| Category | Documents |
|----------|-----------|
| **Identity** | Aadhaar, PAN, Passport, Voter ID, Driving License |
| **Education** | Marksheets (10th, 12th, Graduation), Degree Certificates |
| **Employment** | Previous offer letters, experience letters, salary slips |
| **Joining** | Offer letter, joining letter, appointment letter |
| **HR** | Policy acknowledgments, NDAs, code of conduct |
| **Payroll** | Form 16, investment declarations, bank proof |
| **Medical** | Medical certificate, insurance enrollment |
| **Exit** | Resignation letter, clearance certificate, experience letter, relieving letter |

### Document Entity

| Field | Type | Purpose |
|-------|------|---------|
| `documentId` | `id("employeeDocuments")` | Unique ID |
| `employeeId` | `id("users")` | Employee reference |
| `name` | `string` | Document name |
| `category` | `string` | Identity / Education / Employment / Joining / HR / Payroll / Medical / Exit |
| `type` | `string` | PDF / Image / Document / Spreadsheet |
| `url` | `string` | Document storage URL |
| `verified` | `optional(boolean)` | HR verification status |
| `verifiedBy` | `optional(id("users"))` | Verifier |
| `verifiedAt` | `optional(number)` | Verification date |
| `expiryDate` | `optional(number)` | Expiry date (for identity docs) |
| `uploadedBy` | `id("users")` | Who uploaded |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

---

## 13. Transfer & Promotion

### Purpose

The Transfer & Promotion module tracks **employee movements** — changes in designation, department, branch, team, or salary.

### Change Types

| Change Type | Description | Requires Approval |
|-------------|-------------|-------------------|
| **Promotion** | Designation upgrade, salary revision | Yes (Multiple levels) |
| **Branch Transfer** | Change of physical branch | Yes (Manager + HR) |
| **Department Transfer** | Move to different department | Yes (Both managers) |
| **Team Transfer** | Move to different team | Yes (Team leads) |
| **Designation Change** | Lateral designation change | Yes (HR) |
| **Salary Revision** | Increment without promotion | Yes (Finance) |
| **Reporting Manager Change** | New reporting line | Yes (HR) |

### Change Request Entity

| Field | Type | Purpose |
|-------|------|---------|
| `changeRequestId` | `id("changeRequests")` | Unique ID |
| `employeeId` | `id("users")` | Employee reference |
| `changeType` | `string` | Promotion / BranchTransfer / DeptTransfer / TeamTransfer / SalaryRevision / ManagerChange |
| `previousDesignationId` | `optional(id("designations"))` | Before |
| `newDesignationId` | `optional(id("designations"))` | After |
| `previousDepartmentId` | `optional(id("departments"))` | Before |
| `newDepartmentId` | `optional(id("departments"))` | After |
| `previousBranchId` | `optional(id("branches"))` | Before |
| `newBranchId` | `optional(id("branches"))` | After |
| `previousSalary` | `optional(number)` | Before |
| `newSalary` | `optional(number)` | After |
| `effectiveDate` | `number` | Change effective date |
| `reason` | `optional(string)` | Reason for change |
| `status` | `string` | Pending / Approved / Rejected / Implemented |
| `approvedBy` | `optional(id("users"))` | Approver |
| `implementedAt` | `optional(number)` | When change was actioned |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Promotion Workflow (via DOC-10)

```yaml
Trigger: promotion.recommended (from Performance Review)
  └── Actions:
      ├── Create Approval: Manager → HR → Finance → Director
      ├── If Approved:
      │     ├── Update employee designationId
      │     ├── Update employee salary (Finance)
      │     ├── Send notification to employee (DOC-09)
      │     ├── Post promotion letter to employee documents
      │     └── Log to employee timeline
      └── If Rejected:
            ├── Send notification to employee with reason
            ├── Log to employee timeline
            └── Create HR task: "Discuss development plan with employee"
```

---

## 14. Exit Management

### Purpose

The Exit Management module ensures a **smooth and complete offboarding** process — from resignation acceptance to final settlement and alumni transition.

### Exit Lifecycle

```
Employee submits resignation
       │
       ▼
Manager notified → Exit interview scheduled
       │
       ├── Retention attempt (counter-offer, discussion)
       │
       ▼
Resignation accepted / rejected
       │
       ▼
Notice period begins
       │
       ├── Knowledge transfer (KT) documents created
       ├── Handover tasks assigned
       │
       ▼
Clearance Process (Last 3 days)
       │
       ├── IT Clearance: Laptop, email, access revoked
       ├── Finance Clearance: Salary dues, loan recovery
       ├── HR Clearance: Documents, ID card, exit interview
       ├── Admin Clearance: Furniture, keys, access cards
       │
       ▼
Final Settlement
       │
       ├── Calculate dues (salary, unused leave encashment)
       ├── Deduct pending amounts
       ├── Generate final settlement letter
       │
       ▼
Exit Documents
       │
       ├── Experience Letter
       ├── Relieving Letter
       └── Form 16 (tax certificate)
       │
       ▼
Employee Alumni
       │
       ├── Alumni network registration
       └── Alumni communication preferences
```

### Exit Request Entity

| Field | Type | Purpose |
|-------|------|---------|
| `exitRequestId` | `id("exitRequests")` | Unique ID |
| `employeeId` | `id("users")` | Employee reference |
| `resignationDate` | `number` | Date of resignation |
| `lastWorkingDay` | `number` | Last working day |
| `reason` | `string` | Reason for leaving |
| `type` | `string` | Resigned / Retired / Terminated / Mutual |
| `noticePeriodDays` | `number` | Contractual notice period |
| `noticeServedDays` | `number` | Actual notice served |
| `isWaived` | `boolean` | Notice period waived |
| `status` | `string` | Submitted / Accepted / NoticePeriod / Clearance / Settled / Completed |
| `eligibleForRehire` | `optional(boolean)` | Rehire eligibility |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

### Clearance Checklist

| Item | Department | Cleared By | Status |
|------|------------|------------|--------|
| Laptop return | IT | IT Team | ⬜ |
| Email access revoked | IT | IT Team | ⬜ |
| System access revoked | IT | IT Team | ⬜ |
| ID card return | HR | HR Team | ⬜ |
| Documents returned | HR | HR Team | ⬜ |
| Exit interview completed | HR | HR Team | ⬜ |
| Salary dues settled | Finance | Finance Team | ⬜ |
| Loan recovery completed | Finance | Finance Team | ⬜ |
| Furniture returned | Admin | Admin Team | ⬜ |
| Keys returned | Admin | Admin Team | ⬜ |
| KT documents handed over | Manager | Manager | ⬜ |

---

## 15. Employee Portal

### Purpose

The Employee Portal is the **self-service dashboard** for every employee to manage their profile, attendance, leave, tasks, documents, and payslips.

### Portal Sections

| Section | Content | Actions |
|---------|---------|---------|
| **Profile** | Personal info, designation, department, branch, teams | View, Edit limited fields |
| **Attendance** | Daily check-in/out, monthly calendar, attendance % | View, Request correction |
| **Leave** | Leave balance, request leave, leave calendar, history | Apply, View, Cancel |
| **Tasks** | Assigned tasks, task status, approvals | View, Update, Complete |
| **Payslips** | Monthly salary slips, annual statements | View, Download |
| **Documents** | All employee documents | View, Upload, Download |
| **Assets** | Assigned company assets | View, Report issue |
| **Training** | Enrolled and completed training | View, Enroll |
| **Performance** | Goals, KRAs, reviews, feedback | View, Self-assess |
| **Approvals** | Pending and historical approvals | View, Approve/Reject |
| **Announcements** | Company announcements | View |
| **Team** | Team members, org chart | View |

### Employee Portal Dashboard

```text
┌─────────────────────────────────────────────────────────────────────┐
│  👤 Welcome, Ananya Sharma                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ Today    │ │ Leave    │ │ Pending  │ │ My Team  │              │
│  │ ✅ In    │ │ Balance  │ │ Tasks    │ │  5 mem.  │              │
│  │ 9:02 AM  │ │ CL: 8/12 │ │    3     │ │          │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
│                                                                     │
│  QUICK ACTIONS                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ Apply    │ │ View     │ │ View     │ │ Request  │              │
│  │ Leave    │ │ Payslip  │ │ Tasks    │ │ Asset    │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
│                                                                     │
│  RECENT ACTIVITY                                                    │
│  ├── Today — Checked in at 9:02 AM                                 │
│  ├── Yesterday — Leave approved (Oct 25)                           │
│  ├── 2 days ago — Task completed: Follow-up with Raj Patel         │
│  └── 3 days ago — Payslip for September 2026 generated             │
│                                                                     │
│  UPCOMING                                                           │
│  ├── 📅 Oct 25 — Leave (1 day)                                     │
│  ├── 📄 Nov 5 — Performance review due                             │
│  └── 🎓 Nov 15 — Training: Leadership Development                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 16. HR Dashboard

### Purpose

The HR Dashboard provides **organization-wide visibility** into headcount, attendance, leave, attrition, and other HR metrics.

### Dashboard KPIs

```text
┌─────────────────────────────────────────────────────────────────────┐
│  📊 HR DASHBOARD — 15-Oct-2026                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │Headcount │ │ New      │ │Attrition │ │ Attendance│ │ Open     │ │
│  │  150     │ │ Joiners  │ │ 12% YTD  │ │ 88% Avg  │ │ Positions│ │
│  │  📈 +5  │ │  3 this  │ │  📊 -2%  │ │  This Mo.│ │    5     │ │
│  │          │ │  month   │ │          │ │          │ │          │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│                                                                     │
│  HEADCOUNT BY DEPARTMENT                                            │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ Sales          ████████████████████████    45             │      │
│  │ Academics      ████████████████████        35             │      │
│  │ Operations     ████████████                22             │      │
│  │ Technology     ██████████                  20             │      │
│  │ HR             ██████                       8             │      │
│  │ Finance        █████                        6             │      │
│  │ Marketing      █████                        5             │      │
│  │ Admin          ████                         4             │      │
│  │ Total          ──────────────────────────  150            │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                     │
│  ATTENDANCE % THIS MONTH                                            │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ Week 1  ████████████████████████████████████████  92%    │      │
│  │ Week 2  ██████████████████████████████████████    88%    │      │
│  │ Week 3  ████████████████████████████████████████  90%    │      │
│  │ Week 4  ██████████████████████████████████        82%    │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                     │
│  LEAVE SUMMARY (This Month)                                         │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ Casual Leave     ████████████    24 days / 12 emp        │      │
│  │ Sick Leave       ██████          12 days / 8 emp         │      │
│  │ Earned Leave     ████████████████ 30 days / 6 emp        │      │
│  │ Work From Home   ██████          10 days / 5 emp         │      │
│  │ LOP              ██               4 days / 2 emp         │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                     │
│  UPCOMING EVENTS                                                    │
│  ├── 🎂 Birthday: Raj Patel (Oct 18)                               │
│  ├── 🎉 Work Anniversary: Priya Singh (Oct 20 — 3 years)           │
│  └── 📅 Holiday: Diwali (Oct 31)                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 17. Cross-Module Integration

### Purpose

The HR Engine integrates with nearly every module in EEOS because **people are everywhere**.

### Integration Map

```text
┌─────────────────────────────────────────────────────────────────────┐
│                     HR ENGINE INTEGRATIONS                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Organization (Existing)          Workflow (DOC-10)                 │
│  ┌────────────────────┐          ┌────────────────────┐             │
│  │  departments       │          │  Leave approvals    │             │
│  │  designations      │          │  Expense approvals  │             │
│  │  companies         │          │  Travel approvals   │             │
│  │  branches          │          │  Promotion approvals│             │
│  │  teams             │          │  Recruitment WF     │             │
│  │  verticals         │          └────────────────────┘             │
│  └────────┬───────────┘                                            │
│           │                                                         │
│           │                                                         │
│  Communication (DOC-09)          Finance (DOC-08)                  │
│  ┌────────────────────┐          ┌────────────────────┐             │
│  │  Announcements      │          │  Salary master      │             │
│  │  Attendance alerts  │          │  Payroll processing │             │
│  │  Leave notifications│          │  Reimbursements     │             │
│  │  Birthday reminders  │          │  Loans & advances   │             │
│  │  HR policy updates  │          │  Tax deductions     │             │
│  └────────────────────┘          └────────────────────┘             │
│                                                                      │
│  Tasks (Existing)                Channel/Messenger                  │
│  ┌────────────────────┐          ┌────────────────────┐             │
│  │  HR tasks           │          │  HR announcements   │             │
│  │  Onboarding tasks   │          │  Team channels      │             │
│  │  Exit tasks         │          │  Direct messages    │             │
│  │  Training tasks     │          │  HR bot             │             │
│  └────────────────────┘          └────────────────────┘             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Ownership Boundaries

| Module | Owns | Shares With HR | Read-Only From HR |
|--------|------|----------------|-------------------|
| **Organization** | Department, designation, team, branch hierarchy | Structure definitions | Employee assignments |
| **HR** | Employee master, recruitment, attendance, leave, performance, training | Employee data, attendance, leave | Salary data, device inventory |
| **Finance** | Salary, payroll, reimbursements, taxes | Payslips, salary structure | Employee master, attendance, leave |
| **IT/Admin** | Devices, software licenses, system access | Asset inventory | Employee master for assignments |
| **Workflow** | Approval rules, automation | Approval flows | Employee data for routing |
| **Communication** | Notifications, templates | Announcements, alerts | Employee contact info |

---

## 18. AI Opportunities

### 1. Resume Screening

```text
AI automatically screens and scores resumes against job requirements.

Input:
  - Job description with required skills, experience, qualification
  - Candidate's resume document
  - Past hiring patterns

Output:
  Candidate: Priya Sharma — Python Developer
  🤖 Resume Score: 88/100
  
  Match Analysis:
    ✅ Python (5 years) — Matches requirement (+25)
    ✅ Django — Matches requirement (+20)
    ✅ Cloud (AWS) — Bonus skill (+15)
    ✅ B.Tech CS — Qualification matches (+10)
    ⚠️ React — Not required but present
    ❌ Kubernetes — Missing (preferred skill, -5)
  
  Recommendation: Shortlist for interview
```

### 2. Interview Scoring

```text
AI analyzes interview transcripts/notes and provides unbiased scoring.

Input:
  - Interviewer's notes and ratings
  - Candidate's responses
  - Skill assessment results

Output:
  Candidate: Raj Patel — Sales Counsellor
  🤖 Interview Score: 82/100
  
  Round 1 (Technical): 75/100 — Good product knowledge
  Round 2 (HR): 88/100 — Excellent communication, cultural fit
  Round 3 (Panel): 82/100 — Strong presentation
  
  Overall: Strong candidate, recommend hire at ₹4.5-5L
```

### 3. Attrition Prediction

```text
AI predicts which employees are at risk of leaving.

Input:
  - Attendance patterns (increasing absences)
  - Performance trends (declining scores)
  - Engagement metrics (task completion, communication activity)
  - Leave patterns (frequent sick leave)
  - External factors (market conditions)

Output:
  Employee: Amit Singh — Senior Counsellor
  🤖 Attrition Risk: 78% (HIGH)
  
  Signals Detected:
    🔴 Attendance dropped from 92% to 78% in 3 months
    🔴 Performance score declined from 4.2 to 3.5
    🔴 No training completed in last 6 months
    ⚠️ Applied for 3 leaves this month (unusual)
    ⚠️ Has been in same role for 4 years without promotion
  
  Recommended Actions:
    → Manager 1:1 discussion
    → Promotion review
    → Career development plan
```

### 4. Leave Prediction

```text
AI predicts leave demand to help with workforce planning.

Input:
  - Historical leave patterns (by department, season)
  - Upcoming holidays and events
  - Known events (marriages, exams)

Output:
  December 2026 Leave Forecast:
  ┌────────────┬────────┬──────────┐
  │ Department │ Predicted│ Available│
  ├────────────┼────────┼──────────┤
  │ Sales      │ 45%    │ 60%      │ ⚠️ Tight
  │ Academics  │ 30%    │ 55%      │ ✅ OK
  │ Operations │ 25%    │ 50%      │ ✅ OK
  │ Technology │ 20%    │ 45%      │ ✅ OK
  └────────────┴────────┴──────────┘
  
  Peak leave predicted: Dec 25-31 (holiday season)
  Ensure minimum 40% staffing in Sales during this period
```

### 5. Performance Insights

```text
AI provides actionable insights from performance data.

Input:
  - Performance scores across periods
  - Goal completion rates
  - 360 feedback patterns
  - Training completion data

Output:
  Employee Performance Analysis:
  
  🟢 Strengths:
    - Consistent top performer in admissions conversion
    - Excellent team player (peer feedback 4.5/5)
    - Completed all training programs (100%)
  
  🟡 Areas to Develop:
    - Leadership skills (rating 3.0/5)
    - Strategic thinking (needs mentoring)
  
  📈 Trend: Improving (3.8 → 4.2 → 4.5 over 3 reviews)
  
  🎯 Recommendation: Fast-track for senior role
```

### 6. Training Recommendation

```text
AI recommends training programs based on skill gaps and career path.

Input:
  - Employee's current skills and role
  - Performance review feedback
  - Career aspirations
  - Industry trends

Output:
  Recommended Training for Ananya Sharma (Senior Counsellor):
  
  Priority 1: Leadership Development Program
    └── Why: Ready for promotion to Team Lead
    └── Duration: 3 days (in-person)
  
  Priority 2: Advanced Negotiation Skills
    └── Why: Feedback suggests improvement area
    └── Duration: 2 days (workshop)
  
  Priority 3: Data Analytics for Sales
    └── Why: Industry trend, future requirement
    └── Duration: 4 weeks (online)
```

### 7. Promotion Recommendation

```text
AI recommends employees ready for promotion based on performance, tenure, and skills.

Input:
  - Performance history (last 3 reviews)
  - Current designation and tenure
  - Skill assessments
  - 360 feedback

Output:
  Ready for Promotion:
  
  🥇 Ananya Sharma — Counsellor → Senior Counsellor
    Match: 92% | Tenure: 2.5 yrs | Rating: 4.5
  
  🥈 Rajesh Patel — Jr. Counsellor → Counsellor
    Match: 85% | Tenure: 1.5 yrs | Rating: 4.2
  
  🥉 Priya Singh — Sr. Counsellor → Team Lead
    Match: 78% | Tenure: 3.5 yrs | Rating: 4.0
    ⚠️ Needs leadership training first
```

### 8. Workload Balancing

```text
AI analyzes workload across team members and recommends rebalancing.

Input:
  - Task assignments per employee
  - Hours logged
  - Task completion rate
  - Overtime patterns

Output:
  ⚠️ Workload Imbalance Detected — Sales Team
  
  Ananya: 45 tasks (overloaded) ⚠️
  Rajesh: 38 tasks (optimal)
  Priya: 52 tasks (overloaded) 🔴
  Amit: 22 tasks (underutilized) ⚠️
  
  Recommendation:
  → Transfer 8 tasks from Priya to Amit (balanced workload)
  → Ananya needs backup — consider hiring or redistributing
```

---

## 19. Reports

### Report Catalog

| Report | Frequency | Owner | Purpose |
|--------|-----------|-------|---------|
| **Employee Master** | Weekly | HR | Complete employee list with all details |
| **Headcount Report** | Weekly | HR | Headcount by department, branch, designation |
| **Attendance Summary** | Daily | HR | Attendance %, late arrivals, absentees |
| **Leave Report** | Monthly | HR | Leave utilization by type and department |
| **Payroll Summary** | Monthly | Finance | Total salary, deductions, net pay |
| **Attrition Report** | Monthly | HR | Leavers, attrition rate, reasons |
| **Recruitment Funnel** | Weekly | HR | Application → Offer → Join conversion |
| **Performance Summary** | Quarterly | HR | Ratings distribution, top performers |
| **Training Completion** | Monthly | HR | Training enrollment, completion rate |
| **Asset Allocation** | Monthly | Admin | Assets by employee, category, status |
| **Employee Birthday** | Weekly | HR | Upcoming birthdays and anniversaries |
| **Organization Chart** | On demand | HR | Reporting hierarchy visualization |

### Sample Reports

#### Headcount Report

```text
┌─────────────────────────────────────────────────────────────────────┐
│  📋 HEADCOUNT REPORT — October 2026                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Total: 150 (📈 +5 this month)                                      │
│                                                                     │
│  ┌──────────────┬──────┬──────┬──────┬──────┬────────┐            │
│  │ Department   │ Total│ Male │ Female│ Joins│ Exits  │            │
│  ├──────────────┼──────┼──────┼──────┼──────┼────────┤            │
│  │ Sales        │ 45   │ 28   │ 17   │ 2    │ 1      │            │
│  │ Academics    │ 35   │ 18   │ 17   │ 1    │ 0      │            │
│  │ Operations   │ 22   │ 12   │ 10   │ 1    │ 1      │            │
│  │ Technology   │ 20   │ 16   │ 4    │ 1    │ 0      │            │
│  │ HR           │ 8    │ 3    │ 5    │ 0    │ 0      │            │
│  │ Finance      │ 6    │ 3    │ 3    │ 0    │ 0      │            │
│  │ Marketing    │ 5    │ 2    │ 3    │ 0    │ 0      │            │
│  │ Admin        │ 4    │ 2    │ 2    │ 0    │ 0      │            │
│  │ Management   │ 5    │ 4    │ 1    │ 0    │ 0      │            │
│  └──────────────┴──────┴──────┴──────┴──────┴────────┘            │
│                                                                     │
│  Employment Type: Full-Time 138 | Part-Time 5 | Contract 7         │
│  Avg Tenure: 2.8 years                                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Attrition Report

```text
┌─────────────────────────────────────────────────────────────────────┐
│  📋 ATTRITION REPORT — Q3 2026 (Jul-Sep)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Voluntary Attrition Rate: 12% (18 leavers)                         │
│  Involuntary Attrition Rate: 2% (3 leavers)                         │
│                                                                     │
│  TOP REASONS FOR LEAVING                                            │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ Better opportunity elsewhere     ████████████████  8     │      │
│  │ Career growth limited            ██████████        5     │      │
│  │ Relocation                       ████              2     │      │
│  │ Compensation                     ████              2     │      │
│  │ Personal/Family                  ██                1     │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                     │
│  ATTRITION BY DEPARTMENT                                            │
│  ┌──────────────┬────────┬──────────┐                              │
│  │ Department   │ Leavers│ Rate     │                              │
│  ├──────────────┼────────┼──────────┤                              │
│  │ Sales        │ 8      │ 18%      │ 🔴 High                      │
│  │ Operations   │ 4      │ 18%      │ 🔴 High                      │
│  │ Technology   │ 3      │ 15%      │ 🟡 Medium                     │
│  │ Academics    │ 2      │ 6%       │ 🟢 Low                        │
│  │ Admin        │ 1      │ 25%      │ 🔴 High (small team)          │
│  └──────────────┴────────┴──────────┘                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 20. Implementation Roadmap

### Phase 1 — Employee Master Enhancement (P1)

**Estimated effort:** 5-6 days  
**Dependencies:** Existing `users` table

**Tasks:**
- [ ] Extend `users` table with HR fields (DOB, gender, blood group, marital status, joining date, PAN, Aadhaar, bank details, emergency contact)
- [ ] Create employee number auto-generation (EEOS-EMP-YYYY-SSSS)
- [ ] Add employment type and status fields
- [ ] Add reporting manager self-reference
- [ ] Create HR-specific queries (`listEmployees`, `getEmployeeById`, `getEmployeesByManager`)
- [ ] Create employee profile form in Employee Portal

### Phase 2 — Recruitment Engine (P1)

**Estimated effort:** 5-7 days  
**Dependencies:** Phase 1, Organization structure

**Tasks:**
- [ ] Create `jobRequisitions` table
- [ ] Create `candidates` table
- [ ] Create `interviews` table
- [ ] Create `offers` table
- [ ] Job requisition approval workflow (via DOC-10)
- [ ] Interview scheduling UI
- [ ] Offer letter generation
- [ ] Recruitment dashboard

### Phase 3 — Onboarding (P1)

**Estimated effort:** 4-5 days  
**Dependencies:** Phase 1, DOC-10 (Workflow), DOC-09 (Communication)

**Tasks:**
- [ ] Onboarding checklist template system
- [ ] Auto-create tasks on joining (IT, HR, Admin)
- [ ] Pre-joining communication sequence
- [ ] Onboarding progress dashboard
- [ ] Welcome kit management

### Phase 4 — Attendance (P2)

**Estimated effort:** 6-8 days  
**Dependencies:** Phase 1

**Tasks:**
- [ ] Create `attendance` table
- [ ] Create `shifts` table
- [ ] Manual check-in/check-out UI
- [ ] Shift assignment per employee
- [ ] Late/early/overtime calculation
- [ ] Attendance correction workflow
- [ ] Attendance dashboard

### Phase 5 — Leave Management (P2)

**Estimated effort:** 5-6 days  
**Dependencies:** Phase 1, DOC-10 (Workflow), DOC-09 (Communication)

**Tasks:**
- [ ] Create `leaveBalances` table
- [ ] Create `leaveRequests` table
- [ ] Leave balance calculation engine
- [ ] Leave application UI
- [ ] Leave approval workflow (via DOC-10)
- [ ] Leave calendar view
- [ ] Balance auto-accrual (monthly/yearly)
- [ ] Holiday calendar integration

### Phase 6 — Asset Management (P2)

**Estimated effort:** 4-5 days  
**Dependencies:** Phase 1

**Tasks:**
- [ ] Create `assets` table
- [ ] Asset CRUD UI
- [ ] Asset assignment/return flow
- [ ] Employee asset dashboard
- [ ] Asset status tracking (available, assigned, repair, disposed)

### Phase 7 — Performance Management (P2)

**Estimated effort:** 6-8 days  
**Dependencies:** Phase 1

**Tasks:**
- [ ] Create `performance` table
- [ ] Create `feedback` table (360)
- [ ] Goal/KRA setting UI
- [ ] Self-review form
- [ ] Manager review form
- [ ] 360 feedback collection
- [ ] Performance scorecard
- [ ] Promotion recommendation workflow

### Phase 8 — Exit Management (P2)

**Estimated effort:** 4-5 days  
**Dependencies:** Phases 1, 4, 5, 6 (clearance checks)

**Tasks:**
- [ ] Create `exitRequests` table
- [ ] Resignation submission UI
- [ ] Clearance checklist (auto-verify with IT, Finance, Admin)
- [ ] Notice period tracking
- [ ] Final settlement calculation
- [ ] Experience letter generation
- [ ] Relieving letter generation
- [ ] Alumni transition

### Phase 9 — Employee Portal (P3)

**Estimated effort:** 8-10 days  
**Dependencies:** Phases 1-8

**Tasks:**
- [ ] Unified employee dashboard
- [ ] Profile management
- [ ] Attendance card
- [ ] Leave management card
- [ ] Payslip viewer (from Finance)
- [ ] Task dashboard
- [ ] Document viewer
- [ ] Asset dashboard
- [ ] Training view
- [ ] Quick actions (apply leave, view payslip, request asset)

### Phase 10 — AI HR (P3)

**Estimated effort:** 10-14 days  
**Dependencies:** Phases 1-9, AI Infrastructure

**Tasks:**
- [ ] Resume screening model
- [ ] Attrition prediction model
- [ ] Leave prediction model
- [ ] Performance insights engine
- [ ] Training recommendation engine
- [ ] Promotion recommendation engine
- [ ] Workload balancing model

### Priority Matrix

| Phase | Priority | Effort | Risk | Impact |
|-------|----------|--------|------|--------|
| 1. Employee Master Enhancement | P1 | 6d | Low | Critical |
| 2. Recruitment Engine | P1 | 7d | Medium | High |
| 3. Onboarding | P1 | 5d | Low | High |
| 4. Attendance | P2 | 8d | Medium | High |
| 5. Leave Management | P2 | 6d | Medium | High |
| 6. Asset Management | P2 | 5d | Low | Medium |
| 7. Performance Management | P2 | 8d | Medium | High |
| 8. Exit Management | P2 | 5d | Medium | High |
| 9. Employee Portal | P3 | 10d | Medium | High |
| 10. AI HR | P3 | 14d | High | High |

---

## 21. Golden Rules

```text
╔══════════════════════════════════════════════════════════════╗
║              HR & EMPLOYEE GOLDEN RULES                       ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  1.  Organization owns hierarchy.                            ║
║      └── HR references departments, designations, teams,     ║
║      and branches — never creates or modifies them.          ║
║                                                              ║
║  2.  HR owns employees.                                     ║
║      └── Every person has exactly one master record.         ║
║                                                              ║
║  3.  Technology owns devices.                                ║
║      └── IT/Admin manages asset inventory and assignments.    ║
║                                                              ║
║  4.  Finance owns salary.                                    ║
║      └── HR provides data; Finance processes payroll.        ║
║                                                              ║
║  5.  Workflow owns approvals.                                ║
║      └── Leave, expense, promotion approvals via DOC-10.     ║
║                                                              ║
║  6.  Communication owns notifications.                       ║
║      └── Announcements, alerts, reminders via DOC-09.        ║
║                                                              ║
║  7.  One employee, one master record.                        ║
║      └── No duplicate records across modules.                ║
║                                                              ║
║  8.  Everything is referenced.                               ║
║      └── All modules reference employee by ID — never copy   ║
║      employee data into their own tables.                    ║
║                                                              ║
║  9.  Everything is auditable.                                ║
║      └── Promotion, transfer, salary change — all logged.    ║
║                                                              ║
║ 10.  Employee status is progressive.                         ║
║      └── Probation → Confirmed → Notice → Exited → Alumni.  ║
║                                                              ║
║ 11.  Employment type has distinct rules.                     ║
║      └── Full-time, part-time, contract, intern — each with  ║
║      different attendance, leave, and payroll policies.      ║
║                                                              ║
║ 12.  Exit is not the end.                                    ║
║      └── Every ex-employee becomes part of Alumni network.   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Appendix A: Entity Summary

| Entity | Table Name | Status | Phase | Belongs To |
|--------|-----------|--------|-------|-----------|
| Employee Master | `users` | ✅ Existing (extend) | Phase 1 | HR |
| User Scopes | `userScopes` | ✅ Existing | Phase 1 | HR |
| Designation | `designations` | ✅ Existing | N/A | Organization |
| Department | `departments` | ✅ Existing | N/A | Organization |
| Company | `companies` | ✅ Existing | N/A | Organization |
| Branch | `branches` | ✅ Existing | N/A | Organization |
| Team | `teams` | ✅ Existing | N/A | Organization |
| Vertical | `verticals` | ✅ Existing | N/A | Organization |
| Session | `sessions` | ✅ Existing | N/A | Auth |
| Job Requisition | `jobRequisitions` | 🔶 New | Phase 2 | Recruitment |
| Candidate | `candidates` | 🔶 New | Phase 2 | Recruitment |
| Interview | `interviews` | 🔶 New | Phase 2 | Recruitment |
| Offer | `offers` | 🔶 New | Phase 2 | Recruitment |
| Attendance | `attendance` | 🔶 New | Phase 4 | HR |
| Shift | `shifts` | 🔶 New | Phase 4 | HR |
| Leave Balance | `leaveBalances` | 🔶 New | Phase 5 | HR |
| Leave Request | `leaveRequests` | 🔶 New | Phase 5 | HR |
| Asset | `assets` | 🔶 New | Phase 6 | Admin |
| Performance | `performance` | 🔶 New | Phase 7 | HR |
| 360 Feedback | `feedback` | 🔶 New | Phase 7 | HR |
| Training | `training` | 🔶 New | Phase 7 | HR |
| Training Enrollment | `trainingEnrollments` | 🔶 New | Phase 7 | HR |
| Employee Document | `employeeDocuments` | 🔶 New | Phase 1 | HR |
| Change Request | `changeRequests` | 🔶 New | Phase 1 | HR |
| Exit Request | `exitRequests` | 🔶 New | Phase 8 | HR |
| Notification | `notifications` | ✅ Existing | N/A | Communication |
| Task | `tasks` | ✅ Existing | N/A | Task Management |
| Approval Request | `approvalRequests` | ✅ Existing | N/A | Workflow |

## Appendix B: Existing Code Integration Points

| Existing File | What It Does | DOC-13 Integration |
|---------------|-------------|-------------------|
| `schema.ts` (users table) | User/employee master with organization references | Phase 1 — Extend with HR fields |
| `users.ts` | User queries (currentUser, listUsers, getUsersByDepartment, getUsersByTeam) | Phase 1 — Add HR-specific queries |
| `userManagement.ts` | User CRUD (create, update, disable, enable, clone, transfer) | Phase 1 — Extend with HR fields |
| `organization.ts` | Department, designation, company, branch, team, vertical CRUD | Phase 1 — HR references these |
| `organizationDepartments.ts` | Department master data (Master Data Studio) | Phase 1 — Reference |
| `organizationDesignations.ts` | Designation master data (Master Data Studio) | Phase 1 — Reference |
| `organizationBranches.ts` | Branch master data (Master Data Studio) | Phase 1 — Reference |
| `organizationCompanies.ts` | Company master data (Master Data Studio) | Phase 1 — Reference |
| `organizationTeams.ts` | Team master data (Master Data Studio) | Phase 1 — Reference |
| `tasks.ts` | Task management with status, priority, assignment | Phase 3 — Onboarding tasks, Phase 8 — Exit tasks |
| `approvals.ts` | Approval templates, requests, approvers | Phase 5 — Leave approvals, Phase 7 — Promotion approvals |
| `notifications.ts` | In-app notifications | Phase 5 — Leave alerts, Phase 4 — Attendance alerts |
| `users.ts` (pages) | User management UI | Phase 1 — Extend with HR fields |
| `ProfilePage.tsx` | User profile with department, branch, team, scope | Phase 9 — Extend with full employee portal |

## Appendix C: Employee Number Auto-Generation

```text
Format: EEOS-EMP-{Year}-{Sequence}

Generation Logic:
  1. Get current year (e.g., 2026)
  2. Query existing employees for max sequence in this year
  3. Increment sequence + 1
  4. Format: EEOS-EMP-2026-0042

Examples:
  EEOS-EMP-2026-0001 — First employee of 2026
  EEOS-EMP-2026-0042 — 42nd employee of 2026
  EEOS-EMP-2027-0001 — First employee of 2027
```

---

*End of DOC-13 — HR & Employee Lifecycle Engine Bible*
