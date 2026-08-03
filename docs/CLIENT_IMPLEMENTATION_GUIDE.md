# CLIENT_IMPLEMENTATION_GUIDE.md — Client Implementation Guide

**Patch:** PATCH-FINAL-001 · Phase 10
**Method:** Every step references an actual screen (route), page component, and engine. Steps reference the seeded org: **Veda EdTech** (group) with departments Finance, Knowledge, Technology, Marketing, Production, Administration, HR & Culture; branches NP/OP/KL/PL; verticals School/College/Competitive/Professional (per original spec + `seed.ts`).
**Audience:** Implementation consultant onboarding an institute.

---

## Step 1 — Company (Group & Organization)

| Item | Screen | Page | Engine |
|---|---|---|---|
| Create group/company | Organization Studio `/org` → Companies | `OrganizationStudio.tsx`, `MasterDataCompanies.tsx` | `organizationCompanies.ts` |
| Fields | Company name, code, status | — | `companies` table |
| Screen reference | `/studios/master-data/organization/companies` | `MasterDataCompanies` | — |

## Step 2 — Branch

| Item | Screen | Page | Engine |
|---|---|---|---|
| Create branches (NP, OP, KL, PL) | Organization Studio → Branches | `MasterDataBranches.tsx` | `organizationBranches.ts` |
| Branch readiness | Operations dashboard | `OperationsCenter.tsx` | `runtimeObservability.getOperationsDashboard` |
| Screen reference | `/studios/master-data/organization/branches` | `MasterDataBranches` | — |

## Step 3 — Departments

| Item | Screen | Page | Engine |
|---|---|---|---|
| Create departments | Organization → Departments | `MasterDataDepartments.tsx` | `organizationDepartments.ts` |
| Independent departments (no forced hierarchy) | Department tree in `/org` | `OrganizationStudio` | `getOrganizationTree` (accessEngine) |
| Screen reference | `/studios/master-data/organization/departments` | `MasterDataDepartments` | — |

## Step 4 — Designations & Employees

| Item | Screen | Page | Engine |
|---|---|---|---|
| Designations CRUD (CEO, COO, CFO, CKO, CTO, CAO…) | Organization → Designations | `MasterDataDesignations.tsx` | `organizationDesignations.ts` |
| Create employees | `/employees` | `EmployeeDatabase.tsx`, `EmployeeWorkspace.tsx` | `employeeEngine.ts` (withScopeAndEvents) |
| Employee fields | name, code, designation, department, branch, reporting manager | — | `employeeMaster` |
| Screen reference | `/studios/master-data/organization/designations`, `/employees` | — | — |

## Step 5 — Users, Teams & Access

| Item | Screen | Page | Engine |
|---|---|---|---|
| Create users (username/password) | `/users` | `UsersPage.tsx` | `userManagement.createUser`, `authHelpers` |
| Reset password / disable | `/users` | `UsersPage` | `resetPassword`, `disableUser`, `enableUser` |
| Create teams | Organization → Teams | `MasterDataTeams.tsx` | `organizationTeams.ts` |
| Assign users to teams (multi-team) | `/users` (teamIds) | `UsersPage` | `updateUserTeams` |
| Role assignment | `/access` | `AccessControl.tsx` | `engines/accessControlEngine` (roles, permissions) |
| Scope (company/branch/department/team/vertical) | `/users` scope editor | `UsersPage` | `scopeEngine`, `updateUserScope` |
| Screen reference | `/users`, `/access`, `/studios/master-data/organization/teams` | — | — |

## Step 6 — Academic Structure

| Item | Screen | Page | Engine |
|---|---|---|---|
| Verticals (School/College/Competitive/Professional) | Master Data → Academic → Verticals | `MasterDataVerticals.tsx` | `academicVerticals.ts` |
| Sub-verticals / boards | Master Data → Academic | `MasterDataSubVerticals.tsx`, `MasterDataBoards.tsx` | `academicSubVerticals.ts`, `academicBoards.ts` |
| Academic sessions & terms | Master Data → Academic | `MasterDataAcademicSessions.tsx`, `MasterDataTerms.tsx` | `academicSessions.ts`, `academicTerms.ts` |
| Screen reference | `/studios/master-data/academic` + children | — | — |

## Step 7 — Programs, Courses & Subjects

| Item | Screen | Page | Engine |
|---|---|---|---|
| Programs | Master Data → Academic → Programs | `MasterDataPrograms.tsx` | `academicPrograms.ts` |
| Subjects | Master Data → Academic → Subjects | `MasterDataSubjects.tsx` | `academicSubjects.ts` |
| Classrooms / sections / mediums / languages / streams | Master Data → Academic | `MasterDataClassrooms`, `MasterDataSections`, `MasterDataMediums`, `MasterDataLanguages`, `MasterDataStreams` | respective engines |
| Course library | `/courses` + `/lms/courses` | `CourseStudio.tsx`, `CourseLibrary.tsx`, `CourseWorkspace.tsx` | `lmsEngine` |
| Screen reference | `/studios/master-data/academic`, `/courses`, `/lms/courses` | — | — |

## Step 8 — Batches & Faculty

| Item | Screen | Page | Engine |
|---|---|---|---|
| Batch types & batches | Master Data → Academic → Batches | `MasterDataBatchTypes.tsx`, `MasterDataBatches.tsx` | `academicBatchTypes.ts`, `academicBatches.ts` |
| Faculty allocation | `/academic` (faculty allocation) | `AcademicDatabase.tsx`, `AcademicWorkspace.tsx` | `academicBatches` + `facultyEngine` |
| Faculty portal | `/faculty` | `DashboardFaculty.tsx` | `facultyEngine` |
| Screen reference | `/academic`, `/faculty` | — | — |

## Step 9 — Admissions & Intake

| Item | Screen | Page | Engine |
|---|---|---|---|
| Intake form config | `/studios/intake` | `IntakeDashboard.tsx` | `intakeEngine` (routing rules, duplicate rules, transform mappings) |
| Admissions | `/admissions` | `AdmissionsDashboard.tsx` | `admissionEngine` |
| Lead capture | `/crm/leads` | `CrmDashboard.tsx`, `LeadDatabase.tsx` | `crmLeads` + `crmStages` |
| Screen reference | `/studios/intake`, `/admissions`, `/crm/leads` | — | — |

## Step 10 — Students

| Item | Screen | Page | Engine |
|---|---|---|---|
| Create students | `/students` | `StudentDatabase.tsx`, `StudentWorkspace.tsx` | `studentEngine` (withScopeAndEvents) |
| Enroll in batches | Student workspace | `StudentWorkspace` | `enrollmentEngine`, `lmsEnrollments` |
| Student portal | `/student` | `DashboardStudent.tsx` | `studentEngine`, `studentLifecycle` |
| Screen reference | `/students`, `/student` | — | — |

## Step 11 — Fees & Payments

| Item | Screen | Page | Engine |
|---|---|---|---|
| Fee structures | `/finance` | `FinanceDashboard.tsx` | `feeEngine` → `feeStructures`, `feeInvoices` |
| Payment modes / tax / GST | Master Data → Finance | `MasterDataPaymentModes`, `MasterDataTaxTypes`, `MasterDataGstRates` | `financePaymentModes`, `financeTaxTypes`, `financeGstRates` |
| Collections & receipts | `/collections`, `/crm/sales/collections` | `CollectionDashboard.tsx`, `CollectionCenter.tsx` | `collectionEngine`, `receiptEngine` |
| PDC & cheques | `/finance/pdc` | `PdcWorkspace.tsx` | `chequeEngine` |
| Refunds | `/finance/refunds` | `RefundCenter.tsx` | `refundEngine` |
| Screen reference | `/finance`, `/collections`, `/finance/pdc`, `/finance/refunds` | — | — |

## Step 12 — Attendance

| Item | Screen | Page | Engine |
|---|---|---|---|
| Attendance marking | `/attendance` | `AttendancePage.tsx` | `attendanceEngine.markAttendance`, `bulkMarkAttendance` |
| QR / GPS / Face verification | `/attendance` | `AttendancePage` | `attendanceVerificationEngine` (issueQrToken, markWithGps, registerFace, markWithFace, saveGeofence) |
| Screen reference | `/attendance` | — | — |

## Step 13 — Exams & Results

| Item | Screen | Page | Engine |
|---|---|---|---|
| Exam planning | `/examinations` | `ExamDashboard.tsx` | `examEngine` |
| Marks entry | Exam session workspace | `ExamSessionWorkspace.tsx` | `marksEngine` |
| Results & report cards | `/examinations` | `ExamDashboard` | `resultEngine`, `reportCardEngine` |
| Question bank | Master Data / exams | — | `questionPaperEngine` |
| Screen reference | `/examinations`, `/examinations/:sessionId` | — | — |

## Step 14 — Certificates

| Item | Screen | Page | Engine |
|---|---|---|---|
| Certificate issue | Student workspace / admissions | `StudentWorkspace.tsx` | `certificateEngine` → `certificates` |
| Document management | `/documents` | `DocumentManagement.tsx` | `documentEngine` (versions, permissions) |
| Screen reference | `/documents` | — | — |

## Step 15 — LMS

| Item | Screen | Page | Engine |
|---|---|---|---|
| Courses/lessons/topics | `/lms` | `LMSDashboard.tsx`, `CourseWorkspace.tsx`, `LessonWorkspace.tsx` | `lmsEngine`, `lmsStudentEngine`, `lmsFacultyEngine` |
| Quizzes/assignments | `/lms` | `LMSDashboard` | `lmsQuizzes`, `lmsAssignments` |
| Screen reference | `/lms` | — | — |

## Step 16 — Communication & Go Live

| Item | Screen | Page | Engine |
|---|---|---|---|
| Channels & announcements | `/messenger` | `MessengerPage.tsx` | `messenger.ts` |
| Campaigns | `/marketing/campaigns` | `MarketingCampaigns.tsx` | `communicationCampaignEngine` |
| Support onboarding | `/support` | `SupportDashboard.tsx`, `AgentDashboard.tsx` | `supportEngine`, `slaEngine` |
| User training | `GUIDED_ONBOARDING.md` (Phase 11) | — | — |
| Go-live smoke test | `EEOS_DELIVERY_READINESS.md` (Phase 13) | — | — |

---

## Implementation sequence with dependencies

```
Step 1 Company → Step 2 Branch → Step 3 Department → Step 4 Designations+Employees
  → Step 5 Users/Teams/Access → Step 6-7 Academic Structure + Courses
  → Step 8 Batches+Faculty → Step 9 Admissions → Step 10 Students
  → Step 11 Fees → Step 12 Attendance → Step 13 Exams → Step 14 Certificates
  → Step 15 LMS → Step 16 Communication & Go Live
```

**Dependency note (code-derived):** Students depend on admissions → batches → programs → verticals. Fees depend on students + finance master data. Attendance/exams depend on batches + faculty. All master-data steps must precede business steps.

*Client implementation guide generated by PATCH-FINAL-001 — route + engine references.*
