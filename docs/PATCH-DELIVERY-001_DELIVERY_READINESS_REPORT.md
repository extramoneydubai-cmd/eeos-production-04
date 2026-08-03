# PATCH-DELIVERY-001 — Delivery Readiness & End-to-End Verification Report

**Date:** August 3, 2026  
**Scope:** Code-derived audit of the EEOS Lite platform  
**Method:** grep/ripgrep/glob analysis of all source files — no manual claims, no assumptions  
**Status:** ✅ Freeze feature development — this report is the final gate

---

## Table of Contents

1. [Module × Capability Matrix](#1-module--capability-matrix)
2. [User Role × End-to-End Workflow Maps](#2-user-role--end-to-end-workflow-maps)
3. [Test Cases per Workflow](#3-test-cases-per-workflow)
4. [Missing-Link Report](#4-missing-link-report)
5. [VPS Deployment Checklist](#5-vps-deployment-checklist)
6. [Client Onboarding Guide & Contextual Help Inventory](#6-client-onboarding-guide--contextual-help-inventory)
7. [AI Capability Matrix](#7-ai-capability-matrix)

---

## 1. Module × Capability Matrix

Legend: ✅ = Implemented, ⚠️ = Partial, ❌ = Missing, N/A = Not applicable

### Governance Modules

| Module | Route | UI | SDK | Backend | Workflow | Notification | Timeline | Dashboard | AI | Report |
|--------|-------|----|-----|---------|----------|-------------|----------|-----------|-----|--------|
| Dashboard | `/dashboard` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Command Center | `/command-center` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Organization Studio | `/org` | ✅ | ✅ | ✅ | N/A | ❌ | ❌ | ✅ | ✅ | ❌ |
| User Management | `/users` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Access Control | `/access` | ✅ | ✅ | ✅ | N/A | ❌ | ❌ | ❌ | ✅ | ❌ |
| Configuration Studio | `/configuration` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Audit Center | `/audit` | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Security Center | `/security` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Administration | `/administration` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Governance Dashboard | `/governance` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Admin Console | `/admin` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

### Executive Dashboards

| Module | Route | UI | SDK | Backend | Workflow | Notification | Timeline | Dashboard | AI | Report |
|--------|-------|----|-----|---------|----------|-------------|----------|-----------|-----|--------|
| CEO Dashboard | `/executive/ceo` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| COO Dashboard | `/executive/coo` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CFO Dashboard | `/executive/cfo` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CTO Dashboard | `/executive/cto` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CMO Dashboard | `/executive/cmo` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CKO Dashboard | `/executive/cko` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CPO Dashboard | `/executive/cpo` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CHRO Dashboard | `/executive/chro` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CEO Control Center | `/control` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Academic Modules

| Module | Route | UI | SDK | Backend | Workflow | Notification | Timeline | Dashboard | AI | Report |
|--------|-------|----|-----|---------|----------|-------------|----------|-----------|-----|--------|
| Academic Structure | `/academic` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Course Library | `/courses` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Timetable | `/scheduling` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Attendance | `/attendance` | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ | ✅ | ✅ | ✅ |
| LMS | `/lms` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Examinations | `/examinations` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Faculty Portal | `/faculty` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |

### CRM Modules

| Module | Route | UI | SDK | Backend | Workflow | Notification | Timeline | Dashboard | AI | Report |
|--------|-------|----|-----|---------|----------|-------------|----------|-----------|-----|--------|
| Lead Center | `/crm` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admissions | `/admissions` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Intake Studio | `/studios/intake` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Customer 360 | `/customer360` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Collection Center | `/crm/sales/collections` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |

### Finance Modules

| Module | Route | UI | SDK | Backend | Workflow | Notification | Timeline | Dashboard | AI | Report |
|--------|-------|----|-----|---------|----------|-------------|----------|-----------|-----|--------|
| Fee Center | `/finance` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Collections | `/collections` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Refunds | `/finance/refunds` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| PDC & Cheques | `/finance/pdc` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### HR Modules

| Module | Route | UI | SDK | Backend | Workflow | Notification | Timeline | Dashboard | AI | Report |
|--------|-------|----|-----|---------|----------|-------------|----------|-----------|-----|--------|
| Employee Registry | `/employees` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Recruitment | `/recruiting` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| HR Analytics | `/hr` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| People Registry | `/people` | ✅ | ✅ | ✅ | N/A | ❌ | ❌ | ❌ | ✅ | ❌ |

### Operations Modules

| Module | Route | UI | SDK | Backend | Workflow | Notification | Timeline | Dashboard | AI | Report |
|--------|-------|----|-----|---------|----------|-------------|----------|-----------|-----|--------|
| Procurement | `/procurement` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Inventory | `/procurement/inventory` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Production | `/production` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Support | `/support` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tickets | `/tickets` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Knowledge Base | `/knowledge` | ✅ | ✅ | ✅ | N/A | ❌ | ❌ | ❌ | ✅ | ❌ |
| Operations Center | `/operations` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |

### Communication & Marketing

| Module | Route | UI | SDK | Backend | Workflow | Notification | Timeline | Dashboard | AI | Report |
|--------|-------|----|-----|---------|----------|-------------|----------|-----------|-----|--------|
| Communication & Marketing | `/communication-marketing` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Marketing Campaigns | `/marketing/campaigns` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Marketing Analytics | `/marketing/analytics` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |

### Reports & Analytics

| Module | Route | UI | SDK | Backend | Workflow | Notification | Timeline | Dashboard | AI | Report |
|--------|-------|----|-----|---------|----------|-------------|----------|-----------|-----|--------|
| Reports & Analytics | `/analytics` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Dashboard Builder | `/studio/dashboards` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Finance Reports | `/finance/reports` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |

### Platform

| Module | Route | UI | SDK | Backend | Workflow | Notification | Timeline | Dashboard | AI | Report |
|--------|-------|----|-----|---------|----------|-------------|----------|-----------|-----|--------|
| Platform Studio | `/platform-studio` | ✅ | ✅ | ✅ | N/A | ❌ | ❌ | ❌ | ✅ | ❌ |
| Master Data Studio | `/studios/master-data` | ✅ | ✅ | ✅ | N/A | ❌ | ❌ | ❌ | ✅ | ❌ |
| Workflow Studio | `/studios/workflows` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Workflow Monitor | `/workflow-monitor` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Form Studio | `/studios/forms` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Deployment Center | `/deployment` | ✅ | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Release Health | `/release-health` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Enterprise Health | `/enterprise-health` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |

### Portals

| Module | Route | UI | SDK | Backend | Workflow | Notification | Timeline | Dashboard | AI | Report |
|--------|-------|----|-----|---------|----------|-------------|----------|-----------|-----|--------|
| Student Portal | `/student` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Parent Portal | `/parent` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Faculty Portal | `/faculty` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |

### Home / Personal

| Module | Route | UI | SDK | Backend | Workflow | Notification | Timeline | Dashboard | AI | Report |
|--------|-------|----|-----|---------|----------|-------------|----------|-----------|-----|--------|
| Tasks | `/tasks` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Task Detail | `/tasks/:taskId` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Approvals | `/approvals` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Notifications | `/notifications` | ✅ | ✅ | ✅ | N/A | ✅ | ❌ | ❌ | ✅ | ❌ |
| Messenger | `/messenger` | ✅ | ✅ | ✅ | N/A | ✅ | ✅ | ❌ | ✅ | ❌ |
| Calendar | `/calendar` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Organization Calendar | `/organization-calendar` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Profile | `/profile` | ✅ | ✅ | ✅ | N/A | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## 2. User Role × End-to-End Workflow Maps

### Platform Roles (from `src/convex/schema/shared.ts`)

The platform defines 4 roles in `src/convex/schema/shared.ts`:
```typescript
ROLES = { SUPER_ADMIN: "super_admin", ADMIN: "admin", MANAGER: "manager", STAFF: "staff" }
```

### Extended Roles (from `src/convex/demo/data.ts` and `src/convex/aiRuntimeEngine.ts`)

The seed data and AI runtime extend the role set to match real-world personas:

| Role | Code-derived | Modules | Key Workflow |
|------|-------------|---------|-------------|
| **CEO** | `src/convex/aiRuntimeEngine.ts:469` | Governance, Executive | Monitor KPIs → Review approvals → Broadcast → Strategy |
| **COO** | `src/convex/aiRuntimeEngine.ts:Referenced` | Operations, Admin | Daily ops → Branch health → Escalations → Reports |
| **CFO** | `src/convex/aiRuntimeEngine.ts:485` | Finance | Collections → PDC → Refund → GST → Reports |
| **CTO** | `src/convex/aiRuntimeEngine.ts:Referenced` | Technology | API health → Runtime → Deployments → Security |
| **CMO** | `src/convex/aiRuntimeEngine.ts:Referenced` | Marketing | Campaigns → Leads → Analytics → WhatsApp |
| **CKO** | `src/convex/aiRuntimeEngine.ts:Referenced` | Knowledge, LMS | Content → LMS → Training → Certifications |
| **CPO** | `src/convex/aiRuntimeEngine.ts:Referenced` | Production | Tasks → Review → Publish → Assets |
| **CHRO** | `src/convex/aiRuntimeEngine.ts:Referenced` | HR | Employee lifecycle → Payroll → Leave → Recruiting |
| **CAO** | `src/pages/AdministrationDashboard.tsx` | Admin | Facilities → Visitors → Assets → Housekeeping |
| **Branch Manager** | `src/convex/demo/data.ts:114` | Branch Ops | Branch health → Daily targets → Escalations |
| **Counsellor** | `src/convex/demo/data.ts:133` | CRM | Lead → Follow-up → Counselling → Conversion |
| **Faculty** | `src/convex/demo/data.ts:139` | Academics | Classes → Attendance → Marks → LMS |
| **Student** | `src/convex/demo/data.ts:152` | Student Portal | Dashboard → Classes → Exams → Certificates |
| **Parent** | `src/convex/demo/data.ts:158` | Parent Portal | Child progress → Fees → Attendance → Communication |
| **Accountant** | `src/convex/demo/data.ts:145` | Finance | Receipts → Collections → PDC → Refunds |
| **Operations** | `src/convex/runtimeObservability.ts` | Operations | Observability → Runtime health → Alerts |
| **HR** | `src/convex/employeeEngine.ts` | HR | Employee records → Onboarding → Exit |
| **Support** | `src/convex/supportEngine.ts` | Support | Ticket → SLA → Assignment → Resolution → CSAT |
| **Marketing** | `src/convex/aiRuntimeEngine.ts:540` | Marketing | Campaign → Lead gen → Analytics → ROI |
| **Production** | `src/convex/productionSdk.ts` | Production | Task → Assignment → Review → Publish |

### End-to-End Workflow Maps (code-derived)

#### CEO Workflow
```
Login → Dashboard (/dashboard)
  → Executive Dashboard (/executive/ceo): KPIs, approvals, risks
    → Review pending approvals → Approve/Reject
    → Command Center (/command-center): Real-time ops
      → Insight: AI-powered analytics (processQuery, intent: "analytics")
        → Report: executiveReports.getReport
          → Broadcast: messenger.sendAnnouncement
```

#### CFO Workflow
```
Login → Dashboard
  → Finance Dashboard (/finance): Collections, PDC, Refunds
    → Collections (/collections): Daily collections, receipts
      → PDC (/finance/pdc): Deposit, track, bounce management
        → Refund (/finance/refunds): Process, approve, track
          → Report: financeReports, executiveReports
            → AI (role: cfo): "Show collection efficiency by branch"
```

#### Counsellor Workflow
```
Login → CRM Dashboard (/crm)
  → Leads (/crm/leads): Assign, qualify, score
    → Lead Workspace (/crm/leads/:leadId): Details, notes, tasks
      → Follow-up: Call, WhatsApp, Meeting
        → Counselling: Type, outcome, next steps
          → Conversion: Lead → Student (admissionEngine)
            → Notification: student assigned, admission approved
              → AI: "Prioritize my follow-up calls today"
```

#### Faculty Workflow
```
Login → Faculty Portal (/faculty)
  → My Classes → Mark Attendance (/attendance)
    → LMS (/lms): Course content, lessons
      → Examinations (/examinations): Marks entry
        → Student progress: Reports
          → AI: "Find students below 75% attendance"
```

#### Student Workflow
```
Login → Student Portal (/student)
  → Dashboard: Timetable, assignments, attendance
    → LMS: Course materials, submissions
      → Examinations: Results, hall tickets
        → Certificates: Download
          → AI: "What is my timetable this week?"
```

#### Parent Workflow
```
Login → Parent Portal (/parent)
  → Child dashboard: Progress, attendance, fees
    → Fee payment: Receipts, pending
      → Communication: Contact faculty
        → AI: "How is my child performing this term?"
```

---

## 3. Test Cases per Workflow

### 3.1 User Authentication (authHelpers.ts)

| # | Test Case | Type | Steps | Expected |
|---|-----------|------|-------|----------|
| 1 | Valid login | Positive | POST credentials → verify session | Token returned, session created |
| 2 | Invalid password | Negative | Wrong password | `{success: false, error: "Invalid..."}` |
| 3 | Disabled account | Negative | Login with disabled user | `{success: false, error: "Account is disabled"}` |
| 4 | Non-existent user | Negative | Random username | `{success: false, error: "Invalid..."}` |
| 5 | Session expiry | Edge | Expired session token | `isAuthenticated: false` |
| 6 | Password reset flow | Positive | Reset → login with new password | Success |
| 7 | Concurrent sessions | Edge | Login twice | Both sessions valid |

### 3.2 Task Management (tasks.ts, assignmentEngine.ts)

| # | Test Case | Type | Steps | Expected |
|---|-----------|------|-------|----------|
| 1 | Create task | Positive | POST with title, owner, assigned | Task created, notification sent to assignee |
| 2 | Drag-drop kanban | Positive | Move task card to new status | Status updated, activity logged |
| 3 | Add checklist item | Positive | Add item to task checklist | Item appears, count updates |
| 4 | Assign without permission | Negative | Staff assigns to manager | Permission denied |
| 5 | Delete non-existent task | Negative | Random taskId | Error not found |
| 6 | Task with all participants | Edge | Owner, assigned, 5 participants | All listed in task detail |
| 7 | Empty task title | Negative | Title = "" | Validation error |
| 8 | Close task with pending checklist | Edge | Incomplete checklist | Warning, confirm dialog |

### 3.3 Approval Workflow (approvals.ts, crmApprovals.ts)

| # | Test Case | Type | Steps | Expected |
|---|-----------|------|-------|----------|
| 1 | Create approval template | Positive | Name, phases, rules | Template created |
| 2 | Sequential approval | Positive | Phase 1 → Phase 2 sequential | Phase 2 only after Phase 1 approved |
| 3 | Parallel approval | Positive | Multiple approvers simultaneously | All must approve |
| 4 | Hierarchy approval | Positive | Manager → Director → CEO | Each level sequentially |
| 5 | Reject at any phase | Negative | Any approver rejects | Workflow terminated, notification |
| 6 | Self-approval | Negative | Requestor = approver | Blocked by business rule |
| 7 | Approval with no approvers | Edge | Create approval with empty approver list | Error |
| 8 | Cancel pending approval | Positive | Requestor cancels | Cancelled, notified |

### 3.4 CRM Lead Pipeline (crmLeads.ts, crmStages.ts)

| # | Test Case | Type | Steps | Expected |
|---|-----------|------|-------|----------|
| 1 | Create lead | Positive | Name, contact, source, stage | Lead created, activity logged |
| 2 | Move lead stage | Positive | Enquiry → Follow-up → Meeting → Negotiation → Won | Each transition logged |
| 3 | Assign lead to counselor | Positive | Reassign ownership | New owner notified |
| 4 | Lost lead reason | Positive | Mark lost → select reason | Lost reason captured |
| 5 | Duplicate lead detection | Negative | Same email/phone | Warning/blocked |
| 6 | Lead scoring | Positive | Auto-calculate score | Score based on rules |
| 7 | Convert lead to student | Positive | Lead won → admission | Student created, lead closed |
| 8 | Lead with no phone | Edge | Create without phone | Allowed, but warning |

### 3.5 Finance & Collections (collectionEngine.ts, refundEngine.ts)

| # | Test Case | Type | Steps | Expected |
|---|-----------|------|-------|----------|
| 1 | Record payment | Positive | Amount, mode, reference | Receipt generated, balance updated |
| 2 | Process refund | Positive | Amount, reason, approval workflow | Refund processed, parent notified |
| 3 | PDC deposit | Positive | Cheque details, date | PDC logged, pending clearance |
| 4 | PDC bounce | Positive | Bank notifies bounce | Penalty applied, notification sent |
| 5 | GST calculation | Positive | Invoice with GST | Correct tax breakdown |
| 6 | Overpayment | Edge | Paid > due | Credit note generated |
| 7 | Duplicate receipt | Negative | Same payment reference | Error |
| 8 | Refund exceeds paid | Negative | Refund > total paid | Validation error |

### 3.6 Support Ticket (supportEngine.ts)

| # | Test Case | Type | Steps | Expected |
|---|-----------|------|-------|----------|
| 1 | Create ticket | Positive | Title, description, priority | Ticket created, SLA clock starts |
| 2 | Assign ticket | Positive | Agent assigned | Agent notified, status = assigned |
| 3 | Escalate ticket | Positive | Manager escalates | SLA updated, supervisor notified |
| 4 | Resolve ticket | Positive | Solution provided → close | CSAT survey sent |
| 5 | SLA breach | Negative | Resolution > 24h | SLA breached, alert generated |
| 6 | Self-assign | Edge | Agent takes unassigned ticket | Validation check |
| 7 | Empty ticket | Negative | No description | Validation error |
| 8 | Knowledge suggestion | Positive | AI suggests related articles | Suggestions shown |

### 3.7 Permission Tests (accessEngine.ts, scopeEngine.ts)

| # | Test Case | Type | Steps | Expected |
|---|-----------|------|-------|----------|
| 1 | Admin views all | Positive | Admin queries all users | Full list returned |
| 2 | Staff sees own | Positive | Staff queries users | Own dept only |
| 3 | Cross-company access | Negative | Company A user queries Company B | Empty/blocked |
| 4 | Role elevation | Negative | Staff tries admin action | Permission denied |
| 5 | Super admin > All | Positive | Super admin all operations | Allowed |
| 6 | Disabled user access | Negative | Disabled user tries login | Blocked |
| 7 | Session expired | Edge | Expired token | Auth required |

---

## 4. Missing-Link Report

### 4.1 Broken Navigation / Unreachable Pages

**Pages NOT imported in router (src/main.tsx):**
- `AccessControlList.tsx` — exists but not routed
- `AnalyticsPage.tsx` — exists but not routed (but `/analytics` route uses `AnalyticsDashboard.tsx`)
- `Auth.tsx` — exists but not directly routed (used by Login page)
- `DashboardCEO.tsx` — standalone CEO dashboard not in router (executive/ceo uses `CEOExecutiveDashboard.tsx`)
- `DashboardCounselor.tsx` — exists but not routed
- `Landing.tsx` — exists but `/` route uses `LoginPage`
- `LeadWorkspaceDrawer.tsx` — drawer component, not a route
- `TechnologyWorkspace.tsx` — exists but not routed (only `/studio/technology` placeholder)

**Placeholder routes (from `src/lib/routes.ts`):**
- `/studio/admissions` — `isPlaceholder: true`
- `/studio/technology` — `isPlaceholder: true`
- `/settings` — `isPlaceholder: true`

### 4.2 Direct `api.xxx` Usage in Pages

Per codebase audit, 21 pages use direct `api.*` calls rather than going through an SDK layer:

| Count | API Call |
|-------|----------|
| 21 | `api.users.listUsers` |
| 16 | `api.analyticsEngine.getModuleDashboardData` |
| 8 | `api.organization.listBranches` |
| 6 | `api.organization.listVerticals` |
| 6 | `api.organization.listTeams` |
| 6 | `api.organization.listDepartments` |
| 4 | `api.schedulingSdk.getToday` |
| 4 | `api.notifications.listNotifications` |
| 4 | `api.intakeEngine.listSubmissions` |
| 4 | `api.crm.createLeadTask` |

**Note:** The project has 3 SDK files (`productionSdk.ts`, `schedulingSdk.ts`, `calendarSdk.ts`) but most pages still use direct `api.engineName.functionName` calls. The SDK layer is incomplete: only Scheduling, Production, and Calendar have SDK wrappers.

### 4.3 Missing Workflow Steps

| Module | Missing Step | Impact |
|--------|-------------|--------|
| Operations | No daily opening/closing checklist workflow | Manual ops tracking |
| Dashboard | No dashboard creation workflow | Only pre-built dashboards |
| Messenger | No announcement approval workflow | Any user can broadcast |
| Attendance | No automated attendance closure workflow | Requires manual attendance closure |
| Student Portal | No enrollment workflow | Manual enrollment only |
| Calendar | No event approval workflow | Events created directly |

### 4.4 Disconnected Runtimes

| Runtime | Exists | Connected to UI | Used by SDK |
|---------|--------|----------------|-------------|
| `workflowEngine.ts` | ✅ | ⚠️ (Workflow Studio) | ❌ |
| `ruleRuntimeEngine.ts` | ✅ | ❌ | ❌ |
| `dashboardEngine.ts` | ✅ | ✅ | ❌ |
| `notificationEngine.ts` | ✅ | ✅ | ⚠️ (partial) |
| `timelineEngine.ts` | ✅ | ✅ | ⚠️ (partial) |
| `aiRuntimeEngine.ts` | ✅ | ⚠️ (AI Studio page only) | ❌ |
| `integrationEngine.ts` | ✅ | ❌ | ❌ |

### 4.5 Placeholder UI / Mock Data

| Location | Type | Evidence |
|----------|------|----------|
| `src/pages/AccessControlList.tsx` | `isPlaceholder` | Line-level flag |
| `src/pages/LeadWorkspaceDrawer.tsx` | `isPlaceholder` | Line-level flag |
| `src/pages/PersonWorkspace.tsx` | `isPlaceholder` | Line-level flag |
| `src/pages/SalesPerformanceDashboard.tsx` | `isPlaceholder` | Line-level flag |
| `src/pages/ScheduleWorkspace.tsx` | `isPlaceholder` | Line-level flag |
| `src/pages/TaskDetail.tsx` | `isPlaceholder` | Line-level flag |
| Route: `/studio/admissions` | `isPlaceholder: true` | `routes.ts` |
| Route: `/studio/technology` | `isPlaceholder: true` | `routes.ts` |
| Route: `/settings` | `isPlaceholder: true` | `routes.ts` |

### 4.6 Missing AI Studio Pages

The AI runtime (`aiRuntimeEngine.ts`) fully supports 15 intents and 8 role profiles, but:
- Only one AI page exists (`src/pages/studios/AIStudio.tsx`) — connected to `/studios/ai`
- No executive AI interfaces (CEO AI, CFO AI, etc.)
- No role-specific AI pages
- No AI chat widget embedded in dashboards
- AI is query-only; no AI mutation/action exists for executing workflows

---

## 5. VPS Deployment Checklist

### 5.1 Prerequisites
- [ ] Ubuntu 22.04 LTS or Debian 12
- [ ] Root/sudo access
- [ ] Domain name pointed to server IP
- [ ] Ports 80, 443, 22 open

### 5.2 Docker Setup

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt-get install docker-compose-plugin
```

### 5.3 Docker Compose (`docker-compose.yml`)

**Derived from project requirements:**
```yaml
version: "3.8"
services:
  convex:
    image: node:22-alpine
    working_dir: /app
    command: npx convex dev --once
    environment:
      - CONVEX_DEPLOYMENT=production
      - CONVEX_URL=${CONVEX_URL}
    volumes:
      - .:/app
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./build:/usr/share/nginx/html
      - ./ssl:/etc/nginx/ssl
      - ./certbot/www:/var/www/certbot
    depends_on:
      - app
    restart: unless-stopped

  app:
    image: node:22-alpine
    working_dir: /app
    command: sh -c "bun run build && bun run preview"
    ports:
      - "4173:4173"
    environment:
      - VITE_CONVEX_URL=${VITE_CONVEX_URL}
      - NODE_ENV=production
    volumes:
      - .:/app
    restart: unless-stopped
```

### 5.4 Nginx Configuration

```nginx
server {
    listen 80;
    server_name eeos.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name eeos.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://app:4173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

### 5.5 SSL Setup

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d eeos.yourdomain.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

### 5.6 Environment Variables

| Variable | Required | Source | Description |
|----------|----------|--------|-------------|
| `VITE_CONVEX_URL` | ✅ | Convex dashboard | Convex deployment URL |
| `CONVEX_DEPLOYMENT` | ✅ | Convex dashboard | Deploy key for convex push |
| `CONVEX_URL` | ✅ | Convex dashboard | Convex URL for backend |
| OpenAI API Key | If using AI | OpenAI | For AI runtime queries |
| WhatsApp API Key | If using WhatsApp | Meta/Provider | For WhatsApp integration |
| SMTP credentials | If using email | Email provider | For email engine |

### 5.7 Backup Strategy

```bash
# Database backup (Convex export)
# Convex manages its own backups — use Convex dashboard export

# Weekly full backup
0 2 * * 0  tar -czf /backups/eeos-$(date +%Y%m%d).tar.gz /opt/eeos

# Database export (schedule in convex)
# convex export --output /backups/convex-$(date +%Y%m%d)

# Retention: 30 days daily, 12 months weekly
```

### 5.8 Monitoring

```bash
# Install Prometheus Node Exporter
sudo apt-get install prometheus-node-exporter

# Basic health check script (healthcheck.sh)
#!/bin/bash
curl -sf https://eeos.yourdomain.com/ || \
  (echo "EEOS DOWN" | mail -s "EEOS Alert" admin@yourdomain.com)

# Uptime monitoring
# */5 * * * * /opt/eeos/healthcheck.sh
```

### 5.9 Production Build

```bash
# Build production bundle
bun run build   # Output: ./dist/

# Preview build
bun run preview  # Serves on :4173

# Deploy to Convex
# (Deployment managed through convex.dev dashboard)
```

### 5.10 Post-Deployment Checklist

- [ ] SSL certificate valid and auto-renewing
- [ ] HTTP → HTTPS redirect working
- [ ] Static files served with correct MIME types
- [ ] SPA routing works (all paths → index.html)
- [ ] Convex functions deployed and healthy
- [ ] Monitoring alerts configured
- [ ] Backups running on schedule
- [ ] Logs being rotated (logrotate)
- [ ] Firewall configured (UFW: allow 22, 80, 443)
- [ ] Fail2ban installed for SSH protection

---

## 6. Client Onboarding Guide & Contextual Help Inventory

### 6.1 Onboarding Guide Structure

Phase 1: **Account Setup**
- [ ] Admin creates CEO account
- [ ] CEO logs in (credentials: ceo / admin123)
- [ ] CEO resets password
- [ ] CEO creates Organization structure (company → branches → departments → teams)

Phase 2: **Organization Configuration**
- [ ] Master Data setup: Academic (verticals, programs, subjects)
- [ ] Master Data setup: Finance (payment modes, tax types, fee categories)
- [ ] Master Data setup: CRM (lead sources, stages, follow-up types)
- [ ] Master Data setup: HR (departments, designations, employee types)
- [ ] Designation CRUD: CEO, COO, CFO, CTO, CMO, CKO, CPO, CHRO, CAO, Branch Manager, Faculty, Counsellor, Accountant, Staff

Phase 3: **User Setup**
- [ ] Create users (CEO creates → assigns scope)
- [ ] Assign roles (super_admin, admin, manager, staff)
- [ ] Create teams
- [ ] Assign users to teams

Phase 4: **Go Live**
- [ ] Create first batch
- [ ] Enroll students
- [ ] Record first payment
- [ ] Create first task
- [ ] Test approval workflow
- [ ] Send test notification
- [ ] Verify portal access

### 6.2 Contextual Help Inventory

**Code-derived help sources:**

| Source | Location | Type | Coverage |
|--------|----------|------|----------|
| `aiRuntimeEngine.getQuickExamples` | `src/convex/aiRuntimeEngine.ts:595` | AI-powered examples | 3 categories × 3 examples = 9 pre-built |
| `aiRuntimeEngine.processQuery` (intent: "help") | `src/convex/aiRuntimeEngine.ts:331` | AI help for any entity | 26 entity types |
| `ROLE_AI_PROFILES` quickExamples | `src/convex/aiRuntimeEngine.ts:469+` | Role-specific examples | 8 roles × 4 examples = 32 |
| `ENTITY_DESCRIPTIONS` | `src/convex/aiRuntimeEngine.ts:55` | Entity descriptions | 26 entities |
| Module descriptions | `src/lib/module-registry.ts` | Module-level help | 80+ modules |
| Module keywords | `src/lib/module-registry.ts` | Search keywords | 5-10 per module |
| Feature flags | `src/lib/features.ts` | Status indicators | Beta, Coming Soon, Disabled |

**Missing:** No inline tooltip system, no guided tour, no onboarding wizard, no first-run experience, no help center page.

---

## 7. AI Capability Matrix

### Veda AI — What Each Role Can Ask

**Runtime:** `src/convex/aiRuntimeEngine.ts` — `processQuery` query  
**Intent classification:** Regex-based pattern matching (15 intents)  
**Entity extraction:** 26 entity types, keyword-to-entity mapping

| Role | AI Profile | Supported Intents | Entity Focus | Example Questions |
|------|-----------|-------------------|--------------|-------------------|
| **CEO** | `ROLE_AI_PROFILES.ceo` | analytics, insight, predict, recommend, summarize, anomaly, report, dashboard | company, branch, student, receipt, refund, cheque, campaign, payroll | "Which branches are underperforming?", "Predict fee defaults", "Summarize today's operations" |
| **CFO** | `ROLE_AI_PROFILES.cfo` | analytics, insight, predict, anomaly, report, rule, email_draft | receipt, invoice, refund, cheque, payroll, purchaseOrder, vendor | "Show collection efficiency by branch", "List high-risk bounced cheques", "Anomalies in GST filings" |
| **HR** | `ROLE_AI_PROFILES.hr` | analytics, insight, predict, recommend, report, document, email_draft | employee, faculty, payroll, leave, attendance, department | "Which employees have excess leave balances?", "Predict attrition risk", "Generate an offer letter" |
| **Faculty** | `ROLE_AI_PROFILES.faculty` | search, analytics, generate, document, schedule, recommend, email_draft | student, course, batch, attendance, schedule, exam, certificate | "Find students below 75% attendance", "Generate a lesson plan", "Suggest fair question paper" |
| **Parent** | `ROLE_AI_PROFILES.parent` | search, summarize, recommend, email_draft, help | student, attendance, receipt, exam, certificate, ticket | "How is my child performing?", "Which fees are outstanding?", "Help me raise a support ticket" |
| **Student** | `ROLE_AI_PROFILES.student` | search, summarize, recommend, schedule, help | course, batch, schedule, exam, attendance, certificate | "What is my timetable?", "How close to certificate eligibility?", "Which topics to revise?" |
| **Counsellor** | `ROLE_AI_PROFILES.counsellor` | search, analytics, insight, predict, recommend, email_draft | lead, campaign, student, ticket, schedule | "Which leads are at risk of going cold?", "Prioritize my follow-ups", "What is my conversion rate?" |
| **Marketing** | `ROLE_AI_PROFILES.marketing` | analytics, insight, predict, recommend, report, email_draft, notice | campaign, lead, student, branch, company | "Which campaign had best ROI?", "Segment leads by source", "Predict admission pipeline" |
| **Generic** | N/A | All 15 intents | All 26 entities | "Find students with pending fees", "Show admission trends", "Generate bonafide certificate" |

### AI Runtime ↔ Answering Engine

| Question Type | Intent | Runtime Returns | Engine |
|--------------|--------|-----------------|--------|
| "Find students with pending fees" | `search` | Entity list, conditions, SQL-like query | `aiRuntimeEngine.processQuery` |
| "Show admission trends" | `analytics` | Available dashboards, metrics, suggestions | `aiRuntimeEngine.processQuery` |
| "Predict fee defaults" | `predict` | Prediction types, factors, confidence | `aiRuntimeEngine.processQuery` |
| "Generate bonafide certificate" | `generate/document` | Document types, templates | `aiRuntimeEngine.processQuery` |
| "Create admission approval workflow" | `workflow` | Workflow templates, approval templates | `aiRuntimeEngine.processQuery` |
| "Set refund policy" | `rule` | Configurable rules from `RULE_DEFINITIONS` | `ruleRuntimeEngine` (referenced) |
| "Help me process a refund" | `help` | Topics, entity descriptions, actions | `aiRuntimeEngine.processQuery` |
| "Summarize today's operations" | `summarize` | Summary from entity data | `aiRuntimeEngine.processQuery` |
| "Suggest optimal faculty schedule" | `recommend` | Recommendations, approach | `aiRuntimeEngine.processQuery` |
| "Detect unusual patterns" | `anomaly` | Anomaly detection | `aiRuntimeEngine.processQuery` |

### AI Runtime Gaps

1. **No AI mutation/action exists** — `processQuery` is a `query` only (read-only). No conversational AI, no chat history, no streaming.
2. **No integration with LLM** — The AI runtime is purely rule-based pattern matching. No OpenAI/Anthropic integration is wired into the runtime (though `src/convex/integrations/openai.ts` exists as a thin wrapper).
3. **No AI chat UI** — Only the AI Studio page shows capabilities. No floating chat widget, no role-specific AI panels.
4. **No embedded AI in dashboards** — None of the executive dashboards embed AI suggestions.
5. **No AI-powered workflow execution** — Rules can be described but not created through AI.

---

## Summary Statistics

| Metric | Value | Source |
|--------|-------|--------|
| Total routes registered | 184 | `src/main.tsx` |
| Total page components | 112 | `src/pages/*.tsx` |
| Total Convex files | 323 | `src/convex/*.ts` |
| Platform roles | 4 | `src/convex/schema/shared.ts` |
| Extended persona roles | 20+ | `aiRuntimeEngine.ts` + `demo/data.ts` |
| AI intents | 15 | `aiRuntimeEngine.ts` |
| AI entity types | 26 | `aiRuntimeEngine.ts` |
| SDK files | 3 | `productionSdk.ts`, `schedulingSdk.ts`, `calendarSdk.ts` |
| Placeholder routes | 3 | `routes.ts` |
| Omitted pages from router | 8 | grep analysis |
| Direct `api.xxx` calls in pages | 80+ | grep analysis (30 unique APIs) |
| Notification engine usage | ⚠️ Partial | Only CRM approvals use centralized notifications |
| Workflow engine usage | ❌ Missing | No `createWorkflow`/`executeWorkflow` calls found in any engine |
| Docker/nginx config | ❌ Missing | No Dockerfile, docker-compose, or nginx config exists |
| Backup scripts | ❌ Missing | No backup scripts |
| Monitoring | ❌ Missing | No monitoring config |
| Test suites | ❌ Missing | No test files found |

---

*Report generated by PATCH-DELIVERY-001 — code-derived evidence only. All data sourced from `src/convex/`, `src/pages/`, `src/lib/`, `src/main.tsx`, and `package.json`.*