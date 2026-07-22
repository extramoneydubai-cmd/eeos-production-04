# ARCH-04: EEOS Master Entity Relationship Blueprint

> **Document Type:** Architecture Blueprint  
> **Status:** Frozen (v1.0)  
> **Author:** Enterprise ERP Architecture Analysis  
> **Date:** July 2026  
> **Source:** Full project analysis of all Convex tables, backend modules, frontend pages, routing, and existing documentation.

---

## Table of Contents

1. [Entity Inventory by Domain](#1-entity-inventory-by-domain)
2. [Relationship Map](#2-relationship-map)
3. [Master Dependency Matrix](#3-master-dependency-matrix)
4. [Duplicate Entity Audit](#4-duplicate-entity-audit)
5. [Missing Entity Audit](#5-missing-entity-audit)
6. [Development Priority](#6-development-priority)
7. [Architecture Health Score](#7-architecture-health-score)

---

## 1. Entity Inventory by Domain

### 01 Organization

| # | Entity Name | Purpose | Owner Module | PK Type | Expected Size (Current / Future) | Lifecycle | Dependencies | Future Relationships | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Organization** | Legal entity / business umbrella | Organization Studio | — | 1 / 1–5 | Active | — | → Companies | **Missing** |
| 2 | **orgCompanies** | Registered companies under the organization | Master Data Studio | `Id("orgCompanies")` | 3 / 50 | Active | — | → Branches, → Departments, → Users | **Existing** |
| 3 | **companies** (legacy) | Org companies for user access control | Organization Studio | `Id("companies")` | — / 50 | Active | → Departments | → Users | **Existing (duplicate)** |
| 4 | **orgBranches** | Physical/online branches/campuses | Master Data Studio | `Id("orgBranches")` | 5 / 200 | Active | — | → Users, → Leads | **Existing** |
| 5 | **branches** (legacy) | Branches for user access & CRM | Organization Studio | `Id("branches")` | 4 / 200 | Active | — | → Users, → Leads | **Existing (duplicate)** |
| 6 | **orgDepartments** | Functional departments | Master Data Studio | `Id("orgDepartments")` | 18 / 50 | Active | — | → Users, → Teams | **Existing** |
| 7 | **departments** (legacy) | Departments for user access & tasks | Organization Studio | `Id("departments")` | 7 / 50 | Active | — | → Companies, → Teams, → Users | **Existing (duplicate)** |
| 8 | **orgTeams** | Operational teams | Master Data Studio | `Id("orgTeams")` | 18 / 100 | Active | — | → Users | **Existing** |
| 9 | **teams** (legacy) | Teams for task management & user access | Organization Studio | `Id("teams")` | 6 / 100 | Active | → Departments | → Users | **Existing (duplicate)** |
| 10 | **orgDesignations** | Job titles/roles hierarchy | Master Data Studio | `Id("orgDesignations")` | 21 / 50 | Active | — | → Users | **Existing** |
| 11 | **designations** (legacy) | Designations for user profile & reporting | Organization Studio | `Id("designations")` | 8 / 50 | Active | — (has `reportsTo` FK) | → Users | **Existing (duplicate)** |
| 12 | **verticals** (legacy) | Business verticals (CRM/Course scope) | Organization Studio | `Id("verticals")` | 4 / 20 | Active | — | → SubVerticals, → Leads, → Courses | **Existing** |
| 13 | **subVerticals** (legacy) | Sub-verticals within CRM verticals | Organization Studio | `Id("subVerticals")` | — / 50 | Active | → Verticals | → Boards, → Leads, → Courses | **Existing** |
| 14 | **boards** (legacy) | Education boards within CRM | Organization Studio | `Id("boards")` | — / 20 | Active | → SubVerticals, → Verticals | → Leads, → Courses | **Existing** |
| 15 | **Holiday** | Public/org holidays | — | — | — / — | Planned | → Branch | → Attendance | **Missing** |
| 16 | **Shift** | Work shift definitions | — | — | — / — | Planned | → Branch | → Attendance | **Missing** |
| 17 | **Leave** | Leave types and balances | — | — | — / — | Planned | → User, → Designation | → Attendance | **Missing** |

---

### 02 Authentication & Users

| # | Entity Name | Purpose | Owner Module | PK Type | Expected Size | Lifecycle | Dependencies | Future Relationships | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **users** | System users with roles, org mapping | Auth / Users | `Id("users")` | 8 / 10,000 | Active | → Designation, → Department, → Company, → Branch, → Vertical, → Teams | → Role, → Permission, → Employee | **Existing** |
| 2 | **sessions** | Auth session tokens (custom auth) | Auth | `Id("sessions")` | — / — | Active | → Users | — | **Existing** |
| 3 | **userScopes** | Fine-grained access scopes per user | User Management | `Id("userScopes")` | 8 / 10,000 | Active | → Users | → Permission | **Existing** |
| 4 | **auth accounts** | Convex Auth provider accounts | Auth (Convex) | auto | — / — | Active | → Users | — | **Existing (Convex-managed)** |
| 5 | **Role** | System roles & permissions | — | — | — / — | Conceptual | — | → Users, → Permission | **Missing** |
| 6 | **Permission** | Granular permission definitions | — | — | — / — | Conceptual | → Role | → Users | **Missing** |
| 7 | **Employee** | Extended employee profile (PF, bank, docs) | — | — | — / — | Planned | → Users | → Payroll | **Missing** |
| 8 | **Payroll** | Salary, deductions, payslips | — | — | — / — | Future | → Employee | → Finance | **Missing** |

---

### 03 CRM — Lead Management

| # | Entity Name | Purpose | Owner Module | PK Type | Expected Size | Lifecycle | Dependencies | Future Relationships | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **leadMaster** | Core lead/enquiry record | CRM | `Id("leadMaster")` | 25 / 500,000 | Active | → Verticals, → SubVerticals, → Boards, → Branches, → Users | → Family, → Student, → Admission | **Existing** |
| 2 | **leadStageHistory** | Stage change audit trail | CRM | `Id("leadStageHistory")` | 25 / 2,000,000 | Active | → LeadMaster | → Timeline | **Existing** |
| 3 | **leadAssignments** | Lead ownership transfer log | CRM | `Id("leadAssignments")` | — / 500,000 | Active | → LeadMaster, → Users | — | **Existing** |
| 4 | **leadTasks** | Task items scoped to a lead | CRM | `Id("leadTasks")` | — / 2,000,000 | Active | → LeadMaster, → Users | → Task Management | **Existing** |
| 5 | **leadNotes** | Free-text notes on a lead | CRM | `Id("leadNotes")` | — / 1,000,000 | Active | → LeadMaster, → Users | — | **Existing** |
| 6 | **leadDocuments** | Uploaded documents for a lead | CRM | `Id("leadDocuments")` | — / 500,000 | Active | → LeadMaster, → Users | → Document Management | **Existing** |
| 7 | **callLogs** | Call activity records | CRM | `Id("callLogs")` | — / 2,000,000 | Active | → LeadMaster, → Users | → Timeline | **Existing** |
| 8 | **leadActivity** | Activity/timeline feed | CRM | `Id("leadActivity")` | — / 10,000,000 | Active | → LeadMaster, → Users | → Timeline | **Existing** |

---

### 03B CRM — Financial & Approval

| # | Entity Name | Purpose | Owner Module | PK Type | Expected Size | Lifecycle | Dependencies | Future Relationships | Status |
|---|---|---|---|---|---|---|---|---|---|
| 9 | **leadPayments** | Payment records | CRM Finance | `Id("leadPayments")` | — / 2,000,000 | Active | → LeadMaster, → Users, → Verification | → Collection Engine | **Existing** |
| 10 | **leadDiscounts** | Discounts, waivers, scholarships | CRM Finance | `Id("leadDiscounts")` | — / 500,000 | Active | → LeadMaster, → Users, → Approval | → Finance | **Existing** |
| 11 | **leadApprovals** | Approval requests for discounts/waivers | CRM Approval | `Id("leadApprovals")` | — / 500,000 | Active | → LeadMaster, → Users, → LeadDiscounts | → Workflow | **Existing** |
| 12 | **leadApprovalDecisions** | Individual approver decisions | CRM Approval | `Id("leadApprovalDecisions")` | — / 2,000,000 | Active | → LeadApprovals, → Users | → Workflow | **Existing** |
| 13 | **leadWhatsAppMessages** | WhatsApp communication log | CRM Comm | `Id("leadWhatsAppMessages")` | — / 2,000,000 | Active | → LeadMaster, → Users | → Communication | **Existing** |
| 14 | **leadCourses** | Course-to-lead association | CRM Course | `Id("leadCourses")` | — / 1,000,000 | Active | → LeadMaster, → Courses | — | **Existing** |
| 15 | **crmStages** | Configurable lead pipeline stages | CRM Config | `Id("crmStages")` | 9 / 20 | Active | — | → LeadMaster | **Existing** |
| 16 | **crmSources** | Lead source definitions | CRM Config | `Id("crmSources")` | 12 / 30 | Active | — | → LeadMaster | **Existing** |
| 17 | **crmPriorities** | Priority level definitions | CRM Config | `Id("crmPriorities")` | 5 / 10 | Active | — | → LeadMaster | **Existing** |
| 18 | **crmTags** | Tag definitions for leads | CRM Config | `Id("crmTags")` | 15 / 50 | Active | — | → LeadMaster | **Existing** |
| 19 | **crmLostReasons** | Lost reason definitions | CRM Config | `Id("crmLostReasons")` | 15 / 30 | Active | — | → LeadMaster | **Existing** |
| 20 | **courses** | Course catalog (CRM/Course Studio) | Course Studio | `Id("courses")` | 17 / 500 | Active | → Verticals, → SubVerticals, → Boards | → Academic Foundation | **Existing** |

---

### 04 Academic Foundation (Master Data Studio)

| # | Entity Name | Purpose | Owner Module | PK Type | Expected Size | Lifecycle | Dependencies | Future Relationships | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **academicSessions** | Academic years/terms | Academic MD | `Id("academicSessions")` | 4 / 20 | Active | — | → Programs, → Batches, → Admissions | **Existing** |
| 2 | **academicBoards** | Education boards (CBSE, ICSE, IB…) | Academic MD | `Id("academicBoards")` | 10 / 20 | Active | — | → Programs | **Existing** |
| 3 | **academicVerticals** | Academic categories (School, College, etc.) | Academic MD | `Id("academicVerticals")` | 8 / 15 | Active | — | → SubVerticals | **Existing** |
| 4 | **academicSubVerticals** | Sub-categories (JEE, NEET, CBSE…) | Academic MD | `Id("academicSubVerticals")` | 32 / 100 | Active | → AcademicVerticals | → Programs | **Existing** |
| 5 | **academicPrograms** | Programme offerings (JEE Foundation, etc.) | Academic MD | `Id("academicPrograms")` | 41 / 500 | Active | → AcademicSubVerticals | → Courses, → Batches, → Fee | **Existing** |
| 6 | **academicSubjects** | Subject catalog (Physics, Maths…) | Academic MD | `Id("academicSubjects")` | 30 / 200 | Active | — | → Programs, → Timetable, → Faculty | **Existing** |
| 7 | **academicBatchTypes** | Batch type classification | Academic MD | `Id("academicBatchTypes")` | 10 / 20 | Active | — | → Batches | **Existing** |
| 8 | **ProgramSubjects** | Subject-to-program mapping | — | — | — / — | Conceptual | → Programs, → Subjects | → Timetable | **Missing** |
| 9 | **Batch** | Actual batch instances | — | — | — / — | Conceptual | → Programs, → BatchTypes, → Sessions | → Student, → Timetable, → Faculty | **Missing** |
| 10 | **Classroom** | Physical/virtual room resources | — | — | — / — | Conceptual | → Branch | → Timetable | **Missing** |

---

### 05 Student & Admission

| # | Entity Name | Purpose | Owner Module | PK Type | Expected Size | Lifecycle | Dependencies | Future Relationships | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Student** | Enrolled student profile | — | — | — / 50,000 | Planned | → Admission, → Users, → LeadMaster | → All academic entities | **Missing** |
| 2 | **Admission / Enrollment** | Enrollment record linking lead to program | — | — | — / 50,000 | Planned | → LeadMaster, → Program, → Batch, → Session | → Student, → Finance | **Missing** |
| 3 | **StudentProfile** | Extended student info (medical, transport…) | — | — | — / 50,000 | Planned | → Student | → Hostel, → Library, → Transport | **Missing** |
| 4 | **Family** | Family/guardian group | — | — | — / 30,000 | Planned | → LeadMaster / → Student | → All communications | **Missing** |
| 5 | **Parent** | Parent/guardian individual | — | — | — / 50,000 | Planned | → Family | → Communication, → Approval | **Missing** |
| 6 | **Sibling** | Sibling tracking within family | — | — | — / 20,000 | Planned | → Family, → Student | → Discount/Rebate | **Missing** |
| 7 | **EmergencyContact** | Emergency contact details | — | — | — / 50,000 | Planned | → Student | — | **Missing** |
| 8 | **AcademicHistory** | Prior academic records | — | — | — / 50,000 | Planned | → Student, → Board | → Admission | **Missing** |
| 9 | **Medical** | Health records | — | — | — / 50,000 | Future | → Student | → Attendance | **Missing** |
| 10 | **Transport** | Bus route/stop allocation | — | — | — / — | Future | → Student, → Branch | — | **Missing** |
| 11 | **Hostel** | Hostel accommodation | — | — | — / — | Future | → Student, → Branch | → Finance | **Missing** |
| 12 | **Library** | Book/card management | — | — | — / — | Future | → Student | — | **Missing** |
| 13 | **Certificate** | Certificates & achievements | — | — | — / — | Future | → Student | → Document | **Missing** |

---

### 06 Finance (Core ERP)

| # | Entity Name | Purpose | Owner Module | PK Type | Expected Size | Lifecycle | Dependencies | Future Relationships | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **FeeStructure** | Program-wise fee components | — | — | — / 1,000 | Planned | → Program | → FeePlan, → Invoice | **Missing** |
| 2 | **FeePlan** | Installment plan template | — | — | — / 500 | Planned | → FeeStructure | → Installment | **Missing** |
| 3 | **Invoice** | Billing/invoice document | — | — | — / 500,000 | Planned | → Student/Lead, → FeePlan | → Payment, → Receipt | **Missing** |
| 4 | **Receipt** | Official payment receipt | — | — | — / 500,000 | Planned | → Payment | — | **Missing** |
| 5 | **Scholarship** | Scholarship definitions & awards | — | — | — / 200 | Planned | → Program | → LeadDiscounts | **Missing** |
| 6 | **Ledger** | Student/lead account ledger | — | — | — / 2,000,000 | Planned | → Student/Lead | → All financial entities | **Missing** |
| 7 | **Refund** | Payment refund management | — | — | — / 50,000 | Planned | → Payment | → Ledger | **Missing** |
| 8 | **Collection** | Collection agent/field collections | — | — | — / 100,000 | Planned | → Lead/Student | → Collection Engine | **Missing** |
| 9 | **Expense** | Organizational expense tracking | — | — | — / 100,000 | Future | → Branch, → Department | → Finance Dashboard | **Missing** |
| 10 | **Vendor** | Vendor/supplier management | — | — | — / 500 | Future | — | → Purchase, → Expense | **Missing** |
| 11 | **Purchase** | Procurement/purchase orders | — | — | — / 50,000 | Future | → Vendor, → Branch | → Expense | **Missing** |

---

### 07 Collection Engine (Existing)

| # | Entity Name | Purpose | Owner Module | PK Type | Expected Size | Lifecycle | Dependencies | Future Relationships | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **payment_plans** | Installment payment plan definitions | Collections | `Id("payment_plans")` | — / 100,000 | Active | → LeadMaster, → Users | → FeePlan | **Existing** |
| 2 | **payment_installments** | Individual installment schedule | Collections | `Id("payment_installments")` | — / 2,000,000 | Active | → PaymentPlans, → LeadMaster | → FeePlan | **Existing** |
| 3 | **payment_pdcs** | Post-dated cheque management | Collections | `Id("payment_pdcs")` | — / 100,000 | Active | → LeadMaster, → Users | → Payment | **Existing** |
| 4 | **payment_commitments** | Verbal payment commitment tracking | Collections | `Id("payment_commitments")` | — / 200,000 | Active | → LeadMaster, → Users | → Payment | **Existing** |

---

### 08 Universal Verification Engine

| # | Entity Name | Purpose | Owner Module | PK Type | Expected Size | Lifecycle | Dependencies | Future Relationships | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **verification_requests** | Generic verification request | Verification | `Id("verification_requests")` | — / 500,000 | Active | → Users | → Any entity | **Existing** |
| 2 | **verification_rules** | Auto-routing rules for verification | Verification | `Id("verification_rules")` | — / 100 | Active | → Departments, → Teams, → Users | → Workflow | **Existing** |
| 3 | **verification_decisions** | Individual verifier decisions | Verification | `Id("verification_decisions")` | — / 1,000,000 | Active | → VerificationRequests, → Users | — | **Existing** |

---

### 09 Task Management

| # | Entity Name | Purpose | Owner Module | PK Type | Expected Size | Lifecycle | Dependencies | Future Relationships | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **tasks** | General task items (Kanban) | Tasks | `Id("tasks")` | 1 / 100,000 | Active | → Users, → Departments, → Teams | → Approval, → Workflow | **Existing** |
| 2 | **taskParticipants** | Task members/assignees | Tasks | `Id("taskParticipants")` | — / 300,000 | Active | → Tasks, → Users | — | **Existing** |
| 3 | **taskChecklistItems** | Checklist within a task | Tasks | `Id("taskChecklistItems")` | — / 500,000 | Active | → Tasks, → Users | — | **Existing** |
| 4 | **taskComments** | Comments/discussion on task | Tasks | `Id("taskComments")` | — / 1,000,000 | Active | → Tasks, → Users | → Communication | **Existing** |

---

### 10 Approval System

| # | Entity Name | Purpose | Owner Module | PK Type | Expected Size | Lifecycle | Dependencies | Future Relationships | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **approvalTemplates** | Reusable approval flow templates | Approvals | `Id("approvalTemplates")` | 2 / 50 | Active | — | → Workflow | **Existing** |
| 2 | **approvalRequests** | Approval request instances | Approvals | `Id("approvalRequests")` | — / 100,000 | Active | → Users, → Tasks | → Workflow | **Existing** |
| 3 | **approvalRequestApprovers** | Individual approver decisions (gen.) | Approvals | `Id("approvalRequestApprovers")` | — / 500,000 | Active | → ApprovalRequests, → Users | → Workflow | **Existing** |

---

### 11 Communication

| # | Entity Name | Purpose | Owner Module | PK Type | Expected Size | Lifecycle | Dependencies | Future Relationships | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **channels** | Group chat channels | Messenger | `Id("channels")` | 3 / 1,000 | Active | → Users | — | **Existing** |
| 2 | **channelMembers** | User membership in channels | Messenger | `Id("channelMembers")` | — / 50,000 | Active | → Channels, → Users | — | **Existing** |
| 3 | **messages** | Channel messages | Messenger | `Id("messages")` | — / 5,000,000 | Active | → Channels, → Users | — | **Existing** |
| 4 | **directMessages** | 1:1 direct messages | Messenger | `Id("directMessages")` | — / 10,000,000 | Active | → Users | — | **Existing** |
| 5 | **notifications** | User notification records | Notifications | `Id("notifications")` | — / 20,000,000 | Active | → Users | → Any entity | **Existing** |
| 6 | **SMS** | SMS message log | — | — | — / — | Future | → Lead/Student | → Communication | **Missing** |
| 7 | **Email** | Email message log | — | — | — / — | Future | → Lead/Student | → Communication | **Missing** |
| 8 | **Template** | Message/notification templates | — | — | — / — | Future | — | → All comm channels | **Missing** |
| 9 | **Announcement** | Broadcast announcement records | — | — | — / — | Future | → Users | → Messenger | **Missing** |

---

### 12 Workflow & Automation

| # | Entity Name | Purpose | Owner Module | PK Type | Expected Size | Lifecycle | Dependencies | Future Relationships | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Workflow** | Configurable workflow definitions | — | — | — / — | Conceptual | — | → Approval, → Tasks, → Automation | **Missing** |
| 2 | **AutomationRule** | Event-triggered automation rules | — | — | — / — | Conceptual | → Workflow | → Trigger, → Action | **Missing** |
| 3 | **Trigger** | Event types that start automation | — | — | — / — | Conceptual | → AutomationRule | — | **Missing** |
| 4 | **Action** | Automated action definitions | — | — | — / — | Conceptual | → AutomationRule | — | **Missing** |
| 5 | **Reminder** | Scheduled reminder configurations | — | — | — / — | Conceptual | → Any entity | → Notification | **Missing** |
| 6 | **CalendarEvent** | Calendar/event management | — | — | — / — | Conceptual | → Any entity | → Timetable | **Missing** |

---

### 13 Timetable & Attendance

| # | Entity Name | Purpose | Owner Module | PK Type | Expected Size | Lifecycle | Dependencies | Future Relationships | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Timetable** | Class schedule | — | — | — / — | Future | → Batch, → Classroom, → Faculty | → Attendance | **Missing** |
| 2 | **LessonPlan** | Lesson/session plans | — | — | — / — | Future | → Timetable, → Subject | → LMS | **Missing** |
| 3 | **Assignment** | Student assignments/homework | — | — | — / — | Future | → Batch, → Subject, → Student | → LMS | **Missing** |
| 4 | **Attendance** | Student attendance records | — | — | — / 100,000,000 | Future | → Student, → Batch, → Timetable | → Reports | **Missing** |
| 5 | **Exam** | Exam definitions and schedules | — | — | — / — | Future | → Batch, → Subject | → Result | **Missing** |
| 6 | **Result** | Exam/assessment results | — | — | — / 10,000,000 | Future | → Exam, → Student | → Reports | **Missing** |
| 7 | **Faculty** | Teacher/faculty profile | — | — | — / — | Future | → Users | → Timetable, → Attendance | **Missing** |
| 8 | **FacultyAllocation** | Faculty-to-subject/batch mapping | — | — | — / — | Future | → Faculty, → Batch, → Subject | → Timetable | **Missing** |
| 9 | **StudentAllocation** | Student-to-batch membership | — | — | — / — | Future | → Student, → Batch | → Timetable, → Attendance | **Missing** |

---

### 14 Face Attendance (Planned)

| # | Entity Name | Purpose | Owner Module | PK Type | Expected Size | Lifecycle | Dependencies | Future Relationships | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Device** | Face recognition device registry | — | — | — / — | Future | → Branch | → Attendance | **Missing** |
| 2 | **FaceProfile** | Student/staff face biometrics | — | — | — / — | Future | → Student/User | → Attendance | **Missing** |
| 3 | **AttendanceRecord** | Face-scan attendance log | — | — | — / — | Future | → Device, → FaceProfile | → Attendance | **Missing** |
| 4 | **RecognitionLog** | Raw recognition events | — | — | — / — | Future | → Device | → AttendanceRecord | **Missing** |
| 5 | **Camera** | Camera configuration | — | — | — / — | Future | → Device, → Branch | — | **Missing** |
| 6 | **ShiftMapping** | Shift-to-attendance mapping | — | — | — / — | Future | → Shift, → Device | → Attendance | **Missing** |

---

### 15 Analytics & AI (Future)

| # | Entity Name | Purpose | Owner Module | PK Type | Expected Size | Lifecycle | Dependencies | Future Relationships | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Dashboard** | Saved dashboard configurations | — | — | — / — | Future | → Users | — | **Missing** |
| 2 | **Widget** | Dashboard widget definitions | — | — | — / — | Future | → Dashboard | → Any KPI | **Missing** |
| 3 | **SavedReport** | User saved report instances | — | — | — / — | Future | → Users | → ReportTemplate | **Missing** |
| 4 | **ReportTemplate** | Report definition templates | — | — | — / — | Future | — | → SavedReport | **Missing** |
| 5 | **KPIs** | KPI definitions & targets | — | — | — / — | Future | — | → Dashboard | **Missing** |
| 6 | **Metrics** | Metric calculation configurations | — | — | — / — | Future | → KPIs | → Dashboard | **Missing** |
| 7 | **AuditLogs** | System-wide audit trail | — | — | — / — | Future | → Any entity | → Compliance | **Missing** |
| 8 | **AIPrompt** | AI prompt templates | — | — | — / — | Future | — | → AI Features | **Missing** |
| 9 | **AIMemory** | AI context/memory storage | — | — | — / — | Future | → Users | → AI Features | **Missing** |
| 10 | **Conversation** | AI chat/conversation logs | — | — | — / — | Future | → Users | → AI Features | **Missing** |
| 11 | **AIRecommendation** | AI-generated recommendations | — | — | — / — | Future | → Leads/Students | → Various | **Missing** |
| 12 | **Prediction** | ML prediction results | — | — | — / — | Future | → Lead/Student | → Dashboard | **Missing** |
| 13 | **RiskScore** | Computed risk scores | — | — | — / — | Future | → Lead/Student | → CRM | **Missing** |
| 14 | **LeadScore** | Lead scoring model output | — | — | — / — | Future | → LeadMaster | → CRM | **Missing** |
| 15 | **StudentScore** | Student performance scoring | — | — | — / — | Future | → Student | → Analytics | **Missing** |

---

### 16 Document Management (Future)

| # | Entity Name | Purpose | Owner Module | PK Type | Expected Size | Lifecycle | Dependencies | Future Relationships | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Document** | Central document registry | — | — | — / — | Future | → Any entity | → All modules | **Missing** |
| 2 | **DocumentCategory** | Document type/classification | — | — | — / — | Future | — | → Document | **Missing** |
| 3 | **DocumentVersion** | Document version control | — | — | — / — | Future | → Document | → Verification | **Missing** |
| 4 | **DigitalSignature** | E-signature records | — | — | — / — | Future | → Document | → Verification | **Missing** |

---

## 2. Relationship Map

### 2.1 Organization Hierarchy

```
Organization (Missing)
│
├── orgCompanies / companies
│   └── orgBranches / branches
│
├── orgDepartments / departments
│   ├── orgTeams / teams
│   └── orgDesignations / designations (reportsTo self-ref)
│
└── verticals (legacy CRM scope)
    └── subVerticals
        └── boards
```

### 2.2 Lead-to-Enrollment Journey

```
Lead Master (leadMaster)
│
├── Lead Stage History (audit trail)
├── Lead Assignments (ownership transfers)
├── Lead Tasks (action items)
├── Lead Notes (free-text)
├── Lead Documents (uploads)
├── Call Logs (call tracking)
├── Lead Activity (timeline feed)
├── Lead Courses (course selection)
├── Lead Discounts (pricing adjustments)
├── Lead WhatsApp Messages (comm history)
├── Lead Approvals (approval requests)
├── Lead Payments (collections)
│
├── Payment Plans
│   └── Payment Installments
├── Payment PDCs (post-dated cheques)
└── Payment Commitments (verbal promises)
    │
    └── [FUTURE] → Admission / Enrollment
        └── [FUTURE] → Student Profile
            ├── [FUTURE] → Academic History
            ├── [FUTURE] → Medical
            ├── [FUTURE] → Transport
            ├── [FUTURE] → Hostel
            └── [FUTURE] → Alumni (future)
```

### 2.3 Academic Foundation Hierarchy

```
Academic Sessions
│
Academic Boards (CBSE, ICSE, IB…)
│
Academic Verticals
│   └── Academic Sub Verticals
│       └── Academic Programs
│
Academic Subjects (standalone catalog)
│
Academic Batch Types (classification only)
│
[FUTURE] → ProgramSubjects (bridge table)
    └── [FUTURE] → Batch
        ├── [FUTURE] → Faculty Allocation
        ├── [FUTURE] → Student Allocation
        ├── [FUTURE] → Timetable
        ├── [FUTURE] → Attendance
        └── [FUTURE] → Exam → Result
```

### 2.4 Finance & Collection

```
Lead Payments
├── Payment Plans → Payment Installments
├── Payment PDCs
└── Payment Commitments
    │
    └── [FUTURE] → Fee Structure → Fee Plan
        └── [FUTURE] → Invoice → Receipt
            └── [FUTURE] → Ledger → Refund
```

### 2.5 Verification & Approval

```
Verification Requests ↔ Verification Decisions
    └── Linked to any entity (e.g., Payment)
    └── Auto-routed via Verification Rules

Approval Templates → Approval Requests → Approval Request Approvers
    └── Lead Approvals → Lead Approval Decisions
```

### 2.6 Task Management

```
Tasks
├── Task Participants (owners, assignees, watchers)
├── Task Checklist Items
├── Task Comments
└── [OPTIONAL] → Approval Requests (task-linked approvals)
```

### 2.7 Messenger & Communication

```
Channels → Channel Members → Messages
Direct Messages (1:1)
Notifications (system-wide, any-entity reference)
```

---

## 3. Master Dependency Matrix

### 3.1 Entity Dependencies

| Entity | Depends On | Also Depends On | Future Dependencies |
|--------|-----------|-----------------|---------------------|
| leadMaster | verticals, subVerticals, boards, branches, users, crmStages | crmSources, crmPriorities, crmTags | family, student, admission |
| leadPayments | leadMaster, users | verification_requests | feeStructure, invoice, ledger |
| leadDiscounts | leadMaster, users | leadApprovals | scholarship, feeStructure |
| leadApprovals | leadMaster, users | leadDiscounts | workflow |
| courses | verticals, subVerticals, boards, users | — | academicPrograms |
| academicPrograms | academicSubVerticals | — | courses, batches |
| academicSubVerticals | academicVerticals | — | — |
| tasks | users | departments, teams | approval, workflow |
| approvalRequests | users | approvalTemplates, tasks | workflow |
| verification_requests | users | — | workflow |
| payment_plans | leadMaster, users | — | feePlan |
| payment_installments | payment_plans, leadMaster | — | feePlan |
| notifications | users | — | any entity |
| users | designations, departments, companies, branches | verticals, teams | employee |

### 3.2 Cross-Domain Dependencies

```
CRM → Academic Foundation: leadMaster references legacy verticals/subVerticals/boards
CRM → Course Studio: courses table links to same legacy verticals/subVerticals/boards
CRM → Organization: leads reference branches via branchInterestId
CRM → Collection Engine: leadPayments, payment_plans/pdcs/commitments reference leadMaster
CRM → Verification Engine: leadPayments reference verification_requests via verification_requests FK
CRM → Task Management: leadTasks are separate from the tasks table (no integration)
Approval System → CRM: leadApprovals are separate from approvalRequests table (no integration)
Academic Foundation → CRM: No current integration (by design, config-only)
Academic Foundation ↔ Courses: No current integration (academicPrograms vs courses are separate)
```

---

## 4. Duplicate Entity Audit

### 4.1 Identified Duplicate Tables

| Table Set A | Table Set B | Purpose Overlap | Recommendation | Migration Difficulty | Risk |
|------------|------------|----------------|---------------|---------------------|------|
| `verticals` (legacy) | `academicVerticals` | Both represent educational verticals | **Should Merge** — academicVerticals is richer (educationCategory, age range). Legacy verticals used by CRM/Courses need migration. | **High** — affects leadMaster, courses, boards, subVerticals | **High** |
| `subVerticals` (legacy) | `academicSubVerticals` | Both represent sub-categories | **Should Merge** — academicSubVerticals is richer (color, icon, displayOrder). Legacy used by CRM. | **High** — affects leadMaster, courses, boards | **High** |
| `boards` (legacy) | `academicBoards` | Both represent education boards | **Should Merge** — academicBoards has richer fields (shortName, country, educationLevel, website). Legacy used by CRM. | **Medium** — affects leadMaster, courses | **Medium** |
| `designations` (legacy) | `orgDesignations` | Both represent job titles | **Should Merge** — orgDesignations has richer fields (color, icon, sequence, active). Legacy used by users, seed.ts. | **High** — affects users table FK, seed.ts | **High** |
| `departments` (legacy) | `orgDepartments` | Both represent departments | **Should Merge** — orgDepartments has richer fields. Legacy used by users, teams, companies, tasks, seed.ts. | **High** — affects users, teams, companies, tasks, seed.ts | **High** |
| `companies` (legacy) | `orgCompanies` | Both represent legal companies | **Should Merge** — orgCompanies has richer fields. Legacy used by users, seed.ts. | **Medium** — affects users FK, seed.ts | **Medium** |
| `branches` (legacy) | `orgBranches` | Both represent branches | **Should Merge** — orgBranches has richer fields. Legacy used by users, leadMaster, seed.ts. | **High** — affects users, leadMaster, seed.ts | **High** |
| `teams` (legacy) | `orgTeams` | Both represent operational teams | **Should Merge** — orgTeams has richer fields. Legacy used by users, tasks, seed.ts. | **Medium** — affects users FK array, tasks | **Medium** |
| `leadDiscounts.discountId` | `leadApprovals.discountId` | Bi-directional link creating two join paths | **Keep as-is** — intentional design with separate concerns. | **None** | **Low** |
| `crmStages` | LEAD_PIPELINE_STAGES constant | Stage enum defined in code AND in DB | **Refactor** — DB-driven stages should be the single source of truth. Code enum should read from DB. | **Low** | **Low** |

### 4.2 Merge Strategy

**Phase 1 (Low Risk):**
- Merge `verticals` → `academicVerticals`: Add migration path for CRM/Courses to reference academicVerticals instead
- Merge `boards` → `academicBoards`: Add migration path for CRM/Courses

**Phase 2 (High Risk):**
- Merge `branches` → `orgBranches`: Requires updating leadMaster, users, and seed.ts
- Merge `departments` → `orgDepartments`: Widespread impact across users, teams, tasks, companies, seed.ts
- Merge `designations` → `orgDesignations`: Requires updating users FK
- Merge `teams` → `orgTeams`: Requires updating users.teamIds array

**Phase 3 (Cleanup):**
- Merge `companies` → `orgCompanies`: Lowerest impact
- Refactor `crmStages` to be single source of truth (remove hardcoded LEAD_PIPELINE_STAGES)

### 4.3 Possible Future Duplication Risks

- **CRM Tasks vs General Tasks**: `leadTasks` and `tasks` tables serve similar purposes. Future consolidation may be needed.
- **CRM Approvals vs General Approvals**: `leadApprovals` / `leadApprovalDecisions` and `approvalRequests` / `approvalRequestApprovers` overlap. Future merge into a single approval engine recommended.
- **Courses vs Academic Programs**: `courses` (CRM) vs `academicPrograms` (Academic MD) — these could merge when CRM academic config is migrated to Academic Foundation.

---

## 5. Missing Entity Audit

### 5.1 Critical Missing Entities (P0 — Required Before Beta)

| Entity | Why Critical | Impact |
|--------|-------------|--------|
| **Student / Student Profile** | No enrolled student data model exists | Cannot track actual students post-admission |
| **Admission / Enrollment** | No bridge between lead conversion and student lifecycle | Lead → Student pipeline is broken |
| **Family** | No family/guardian grouping | Cannot manage sibling discounts, parent communication |
| **Parent** | No parent profile with communication consent | Cannot contact parents systematically |
| **Batch** | No actual batch instances | Cannot manage classrooms, schedules, or section allocations |
| **ProgramSubjects** | No subject-to-program mapping | Cannot define which subjects belong to which program |
| **FacultyAllocation** | No teacher-to-batch-subject mapping | Cannot build timetables or track faculty workload |
| **StudentAllocation** | No student-to-batch membership | Cannot track which student is in which batch/section |

### 5.2 Required Entities (P1)

| Entity | Why Needed |
|--------|-----------|
| **FeeStructure** | Program-wise fee components (tuition, lab, sports, etc.) with valid-from dates |
| **FeePlan** | Pre-defined installment plan templates by program/category |
| **Invoice** | Formal billing document generation |
| **Receipt** | Official payment acknowledgment |
| **Ledger** | Student/lead account running balance (all transactions) |
| **Scholarship** | Scholarship definitions, eligibility, award amounts |
| **Document** | Central document registry (not scoped to lead) |
| **DocumentCategory** | Document type classification |
| **Role / Permission** | Fine-grained RBAC beyond role field |
| **Shift** | Work shift definitions for faculty & staff |
| **Timetable** | Class scheduling infrastructure |
| **Attendance** | Student attendance (depends on Timetable) |
| **Exam** | Exam/assessment scheduling |
| **Result** | Exam scores and grades |
| **LessonPlan** | Structured session plans |

### 5.3 Recommended Entities (P2)

| Entity | Domain |
|--------|--------|
| AcademicHistory | Student |
| Medical / HealthRecord | Student |
| EmergencyContact | Student/Family |
| TransportRoute / Stop | Student |
| Hostel / Room | Student |
| Library / Membership | Student |
| Certificate / Achievement | Student |
| Refund | Finance |
| Collection | Finance |
| Expense | Finance |
| Vendor | Finance |
| Purchase | Finance |
| Template (Comm) | Communication |
| SMSLog | Communication |
| EmailLog | Communication |
| AuditLog | System |
| Holiday | Organization |
| Leave | Organization |
| Employee (Extended Profile) | Organization |
| Payroll | Organization |

### 5.4 Future Entities (P3)

| Entity | Domain |
|--------|--------|
| FaceProfile | Face Attendance |
| Device | Face Attendance |
| AttendanceRecord | Face Attendance |
| RecognitionLog | Face Attendance |
| Camera | Face Attendance |
| AIPrompt | AI |
| AIMemory | AI |
| Conversation | AI |
| AIRecommendation | AI |
| Prediction | AI/ML |
| RiskScore | AI/ML |
| LeadScore | AI/ML |
| StudentScore | AI/ML |
| Dashboard / Widget | Analytics |
| SavedReport / ReportTemplate | Analytics |
| KPI / Metric | Analytics |
| CalendarEvent | Workflow |
| Reminder | Workflow |
| Workflow | Workflow |
| AutomationRule / Trigger / Action | Workflow |
| DocumentVersion | Document Management |
| DigitalSignature | Document Management |
| Alumni | Student |

---

## 6. Development Priority

### P0 — Critical Before Beta

| Entity | Domain | Effort Estimate | Notes |
|--------|--------|---------------|-------|
| Student Profile | Student | Medium | Core entity needed for enrollment |
| Admission / Enrollment | Student | Medium | Bridge between CRM → Student |
| Family | Family | Medium | Parent/guardian grouping |
| Parent | Family | Medium | Individual guardian profile |
| Batch | Academic | Medium | Links programs to students & timetable |
| ProgramSubjects | Academic | Low | Bridge table |
| FeeStructure | Finance | Medium | Required for Invoice generation |
| Invoice | Finance | Medium | Billing |
| Receipt | Finance | Low | Payment acknowledgment |
| Ledger | Finance | Medium | Running account balance |
| Duplicate Merge (Branches) | Organization | High | Unify legacy + MD tables |
| Duplicate Merge (Verticals) | Academic | High | Unify legacy + academic tables |

### P1 — Required

| Entity | Domain | Effort Estimate |
|--------|--------|---------------|
| FacultyAllocation | Academic | Medium |
| StudentAllocation | Academic | Low |
| Timetable | Academic | High |
| Attendance | Academic | High |
| Exam | Academic | Medium |
| Result | Academic | Medium |
| FeePlan | Finance | Low |
| Scholarship | Finance | Low |
| Document | Document | Medium |
| DocumentCategory | Document | Low |
| Role / Permission | Auth | High |
| Shift | Organization | Low |
| Duplicate Merge (Departments) | Organization | High |
| Duplicate Merge (Designations) | Organization | Medium |
| Duplicate Merge (Teams) | Organization | Medium |
| Duplicate Merge (Companies) | Organization | Low |

### P2 — Recommended

| Entity | Domain | Effort Estimate |
|--------|--------|---------------|
| AcademicHistory | Student | Medium |
| Medical / Health | Student | Medium |
| EmergencyContact | Student/Family | Low |
| Transport | Student | Medium |
| Hostel | Student | Medium |
| Refund | Finance | Medium |
| Collection | Finance | Medium |
| Expense | Finance | Medium |
| Vendor | Finance | Low |
| Purchase | Finance | Medium |
| Template (Communication) | Communication | Low |
| SMSLog | Communication | Low |
| EmailLog | Communication | Low |
| AuditLog | System | Medium |
| Holiday | Organization | Low |
| Leave | Organization | Medium |
| LessonPlan | Academic | Medium |
| Merge crmStages → DB-only | CRM | Low |

### P3 — Future

| Entity | Domain | Notes |
|--------|--------|-------|
| Employee (Extended) | Organization | After core HR |
| Payroll | Organization | After Employee |
| Face Attendance entities | Face Attendance | Hardware-dependent |
| AI entities (Prompt, Memory, Conversation…) | AI | Post MVP |
| Analytics entities | Analytics | Requires data volume |
| Workflow / Automation | Workflow | Requires mature entities |
| DocumentVersion / DigitalSignature | Document | After Document |
| Alumni | Student | After Student lifecycle |
| CalendarEvent | Workflow | After Timetable |
| Reminder | Workflow | After Notification engine |

---

## 7. Architecture Health Score

### Current State Assessment

| Metric | Score | Notes |
|--------|-------|-------|
| **Entity Coverage** | 42% | 37 entities exist out of ~87 total needed for full ERP |
| **Duplicate Risk** | 45% | 8 duplicate table pairs identified, 2 approval & 2 task systems duplicate |
| **Refactor Risk** | **High** | 7 legacy → MD table merges needed; high risk due to FK dependencies |
| **Beta Readiness** | 35% | CRM, Auth, Tasks, Messenger, Org structures are solid; Student/Academic/Finance foundations are missing |
| **Scalability Score** | **85%** | Convex serverless backend, proper indexes, pagination patterns, lazy-loaded routes |
| **Technical Debt Score** | **Moderate (55/100)** | Legacy table duplication is the largest debt; custom auth vs Convex Auth; some inconsistent patterns (LEAD_PIPELINE_STAGES enum vs DB-driven stages) |

### Detailed Breakdown

| Factor | Positive | Negative |
|--------|---------|---------|
| **Backend Architecture** | Clear module separation, consistent CRUD patterns, good use of Convex indexes | Duplicate tables for same concepts, two approval systems, two task systems |
| **Frontend Architecture** | Beautiful component library (shadcn/ui), consistent MasterDataTable pattern, lazy routing | Some pages have complex logic in page files (could extract to hooks) |
| **Data Model** | Well-normalized lead management, comprehensive CRM | Legacy tables fragmented across old Organization Studio and new Master Data Studio |
| **Auth** | Custom SHA-256 auth with session management | Convex Auth integration is minimal (providers: []); manual password hashing |
| **UI/UX** | Consistent design system, good dark/light theme variables | Some duplicated navigation patterns (sidebar logic mixed with layout) |
| **Code Quality** | Consistent naming, barrel exports, good comments | Inline complex logic in some queries (crmLeads.ts → 300+ line filter function) |

### Improvement Roadmap (Ordered by Impact)

1. **Entity Coverage → 100%**: Build Student, Admission, Family, Batch, Fee modules (P0 blockers)
2. **Duplicate Risk → 10%**: Merge legacy tables into MD tables (high effort, high reward)
3. **Refactor Risk → Low**: Complete migration of all references to use unified tables
4. **Beta Readiness → 80%**: Finish Student lifecycle + Finance core + Academic operations
5. **Technical Debt → 30/100**: Merge approval engines, merge task systems, refactor stages enums

---

## Appendix A: Complete Existing Entity List

```
═══════════════════════════════════════════════════════════════
EXISTING TABLES (37 total in Convex schema)
═══════════════════════════════════════════════════════════════

AUTH & USERS:
  - users
  - sessions
  - userScopes

ORGANIZATION (Legacy):
  - designations
  - departments
  - companies
  - branches
  - teams
  - verticals
  - subVerticals
  - boards

ORGANIZATION (Master Data Studio):
  - orgCompanies
  - orgBranches
  - orgDepartments
  - orgTeams
  - orgDesignations

CRM CORE:
  - leadMaster
  - leadStageHistory
  - leadAssignments
  - leadTasks
  - leadNotes
  - leadDocuments
  - callLogs
  - leadActivity

CRM FINANCIAL:
  - leadPayments
  - leadDiscounts

CRM APPROVAL:
  - leadApprovals
  - leadApprovalDecisions

CRM COMMUNICATION:
  - leadWhatsAppMessages

CRM CONFIG:
  - crmStages
  - crmSources
  - crmPriorities
  - crmTags
  - crmLostReasons

COURSE STUDIO:
  - courses
  - leadCourses

ACADEMIC FOUNDATION (Master Data Studio):
  - academicVerticals
  - academicSubVerticals
  - academicPrograms
  - academicSubjects
  - academicBatchTypes
  - academicBoards
  - academicSessions

COLLECTION ENGINE:
  - payment_plans
  - payment_installments
  - payment_pdcs
  - payment_commitments

UNIVERSAL VERIFICATION:
  - verification_requests
  - verification_rules
  - verification_decisions

TASK MANAGEMENT:
  - tasks
  - taskParticipants
  - taskChecklistItems
  - taskComments

APPROVAL SYSTEM:
  - approvalTemplates
  - approvalRequests
  - approvalRequestApprovers

COMMUNICATION:
  - channels
  - channelMembers
  - messages
  - directMessages
  - notifications

═══════════════════════════════════════════════════════════════
```

## Appendix B: Core Non-Table Data Structures

| Structure | Type | Purpose | Location |
|-----------|------|---------|----------|
| LEAD_PIPELINE_STAGES | Array constant | Pipeline stage order definition | crmHelpers.ts |
| LEAD_STAGES | Array constant | Alias for pipeline stages | crmHelpers.ts |
| ROLES | Object constant | System role definitions | schema.ts |
| TASK_STATUS | Object constant | Task Kanban status values | schema.ts |
| PRIORITY | Object constant | Priority level definitions | schema.ts |
| APPROVAL_STATUS | Object constant | Approval lifecycle statuses | schema.ts |
| NOTIFICATION_TYPE | Object constant | Notification type categories | schema.ts |
| APPROVAL_MODE | Object constant | Approval routing modes | schema.ts |
| PROGRAM_TYPES | Array constant | Academic program categories | academicPrograms.ts |
| DELIVERY_MODES | Array constant | Program delivery classifications | academicPrograms.ts |
| DURATION_UNITS | Array constant | Program duration units | academicPrograms.ts |
| CATEGORIES | Array constant | Academic subject categories | academicSubjects.ts |
| SUBJECT_TYPES | Array constant | Subject classification types | academicSubjects.ts |
| TIMING_CATEGORIES | Array constant | Batch timing categories | academicBatchTypes.ts |

---

*End of ARCH-04: EEOS Master Entity Relationship Blueprint*

*This document is frozen as the master source of truth for all EEOS database architecture.*
*All future development must reference this blueprint before creating new tables or modifying existing ones.*
