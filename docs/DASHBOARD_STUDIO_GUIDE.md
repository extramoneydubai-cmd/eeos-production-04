# Dashboard Studio — Enterprise Guide

## Overview

Dashboard Studio is a configurable, metadata-driven dashboard system. No dashboard is hardcoded. Users can build dashboards using widgets, save layouts, and configure role-based permissions.

**Architecture Principle:** Dashboard Studio must never directly query business tables. All data comes through registered **Dashboard Providers** or dedicated **Widget Queries**.

## Architecture

```
Dashboard Studio
│
├── Widget System (20+ Widget Types)
│   ├── Enterprise Overview  → getEnterpriseOverview()
│   ├── CRM Widget           → getCrmWidget()
│   ├── Finance Widget       → getFinanceWidget()
│   ├── Academic Widget      → getAcademicWidget()
│   ├── HR Widget            → getHrWidget()
│   ├── Operations Widget    → getOperationsWidget()
│   ├── Communication Widget → getCommunicationWidget()
│   ├── Examination Widget   → getExaminationWidget()
│   ├── LMS Widget           → getLmsWidget()
│   ├── Inventory Widget     → getInventoryWidget()
│   ├── Tasks Widget         → getTasksWidget()
│   ├── KPI Cards            → getKpiDashboardCards()
│   ├── Recent Activity      → getRecentActivityWidget()
│   ├── Notifications        → getNotificationsWidget()
│   ├── Leaderboard          → getLeaderboardWidget()
│   ├── Quick Actions        → getQuickActions()
│   ├── Branch Comparison    → getBranchComparison()
│   ├── Company Comparison   → getCompanyComparison()
│   └── Drill-Down           → drillDownByBranch() / drillDownByCompany()
│
├── Layout System
│   ├── dashboardLayouts       → User/role-based layouts with widget config
│   ├── userDashboardLayouts   → Per-user saved layouts
│   └── getMyLayout()         → Intelligent layout resolution (user → role → default)
│
├── Widget Registry
│   ├── dashboardWidgets       → System-defined and custom widgets
│   ├── createWidget()         → Custom widget creation
│   └── listWidgets()          → Filtered widget catalog
│
├── Dashboard Providers
│   ├── 8 Registered Providers (CRM, Students, Finance, HR, Exams, LMS, Inventory, Procurement)
│   ├── KPIs                   → Key metrics with counts/trends
│   ├── Charts                 → Grouped/aggregated data series
│   ├── Timeline               → Recent activity events
│   └── Quick Stats            → Summary numbers
│
└── Role-Based Access
    ├── getQuickActions(role)  → Role-specific action menu
    ├── dashboardWidgets.allowedRoles → Widget-level permission
    ├── dashboardLayouts.userId/role  → Layout ownership
    └── Widget Permissions     → Configurable per-role visibility
```

## Widget Types (20+)

| Widget | Query | Description | Data Sources |
|--------|-------|-------------|--------------|
| Enterprise Overview | `getEnterpriseOverview()` | Cross-company/branch KPIs | companies, branches, users, students, leads, payments |
| CRM | `getCrmWidget()` | Lead pipeline, conversion, counselor performance | leads, leadAssignments |
| Finance | `getFinanceWidget()` | Revenue, outstanding, refunds, invoices | feeAccounts, invoices, payments, refunds |
| Academic | `getAcademicWidget()` | Students, courses, batches, utilization | students, courses, academicBatches |
| HR | `getHrWidget()` | Employees by role/type, anniversaries | users |
| Operations | `getOperationsWidget()` | Tasks, workflows, approvals, SLA, escalations | tasks, workflows, approvals, slaViolations |
| Communication | `getCommunicationWidget()` | Channel stats, campaigns, delivery rate | communicationQueue, campaigns |
| Examination | `getExaminationWidget()` | Sessions, results, pass rate, marks | examSessions, examResults, examMarks |
| LMS | `getLmsWidget()` | Courses, lessons, enrollments, completion | lmsCourses, lmsLessons, lmsEnrollments |
| Inventory | `getInventoryWidget()` | Items, value, low stock, movements | inventoryItems, stockMovements |
| Tasks | `getTasksWidget()` | Tasks by status, overdue, completion rate | tasks |
| KPI Cards | `getKpiDashboardCards()` | Configurable KPI cards with snapshots | kpiDefinitions, kpiSnapshots |
| Recent Activity | `getRecentActivityWidget()` | Unified activity feed | leadActivity, callLogs, taskComments, payments |
| Notifications | `getNotificationsWidget()` | Unread count, by-type breakdown | notifications |
| Leaderboard | `getLeaderboardWidget()` | Performance rankings | leads, tasks, callLogs |
| Quick Actions | `getQuickActions()` | Role-based action buttons | Static definition |
| Branch Comparison | `getBranchComparison()` | Cross-branch metrics comparison | branches, students, leads, accounts, payments |
| Company Comparison | `getCompanyComparison()` | Cross-company metrics | companies, branches, students, leads, payments |
| Drill-Down Branch | `drillDownByBranch()` | Branch-level detail | students, leads, users, departments |
| Drill-Down Company | `drillDownByCompany()` | Company-level detail | branches, students, departments |

## Layout System

### Layout Resolution (Priority Order)
1. **User-specific active layout** — `dashboardLayouts` with matching `userId`
2. **Role-based default layout** — `dashboardLayouts` with matching `role` + `isDefault: true`
3. **System default** — Fallback to system-provided template

### Layout Properties
- `userId` — Optional user assignment
- `role` — Optional role assignment (e.g., "super_admin", "manager", "staff")
- `widgets` — JSON string of widget IDs + positions
- `layoutConfig` — Grid configuration (columns, spacing, breakpoints)
- `filters` — Global filter configuration
- `isDefault` — Whether this is the default layout for the user/role

## Dashboard Providers

### Registered Providers (8)
| Provider | ID | KPIs | Charts |
|----------|----|------|--------|
| CRM | `crm` | Total/Active Leads, Opportunities, Pending Tasks | Leads by Stage, Leads by Source |
| Students | `students` | Total/Active Students, Enrollments, Batches | Students by Course, Students by Batch |
| Finance | `finance` | Invoices, Payments, Pending Dues, Expenses | Payments by Mode, Expenses by Category |
| HR | `hr` | Total/Active Employees, Departments, Positions | Employees by Department, Employees by Type |
| Exams | `exams` | Upcoming Exams, Pending Marks, Published Results | — |
| LMS | `lms` | Courses, Lessons, Enrollments, Pending Assignments, Certificates | Courses by Status/Difficulty, Enrollments by Status |
| Inventory | `inventory` | Items, Low Stock, Active Vendors, Pending Orders | POs by Status, Items by Category |
| Procurement | `procurement` | POs, Requisitions, GRNs, Payment Requests | Requisitions by Priority, Vendors by Status |

## Quick Actions (Role-Based)

| Action | super_admin | admin | manager | staff | faculty |
|--------|:-----------:|:-----:|:-------:|:-----:|:-------:|
| Create Lead | ✅ | ✅ | ✅ | ✅ | — |
| Record Payment | ✅ | ✅ | ✅ | ✅ | — |
| Create Task | ✅ | ✅ | ✅ | ✅ | — |
| New Requisition | ✅ | ✅ | ✅ | — | — |
| Create Course | ✅ | ✅ | — | — | ✅ |
| View Reports | ✅ | ✅ | ✅ | — | — |
| Create User | ✅ | ✅ | — | — | — |
| Broadcast Message | ✅ | ✅ | — | — | — |
| Add Expense | ✅ | ✅ | — | — | — |
| Schedule Exam | ✅ | ✅ | — | — | ✅ |

## API Reference

### Widget Management (`dashboardEngine.ts`)

| Query/Mutation | Description |
|----------------|-------------|
| `createWidget(args)` | Create a new widget definition |
| `listWidgets(filter)` | List widgets by category/type/active |
| `saveLayout(args)` | Save a dashboard layout |
| `getMyLayout({ userId })` | Get user's layout (user→role→default) |
| `listLayouts(filter)` | List layouts by user/role |
| `deleteLayout({ layoutId })` | Delete a layout |

### Widget Queries (`dashboardEngine.ts`)

| Query | Description |
|-------|-------------|
| `getEnterpriseOverview(filter)` | Enterprise-wide KPIs |
| `getCrmWidget(filter)` | CRM pipeline and conversion |
| `getFinanceWidget(filter)` | Financial metrics |
| `getAcademicWidget(filter)` | Academic structure metrics |
| `getHrWidget(filter)` | HR metrics |
| `getOperationsWidget(filter)` | Operations KPIs |
| `getCommunicationWidget()` | Communication channel stats |
| `getExaminationWidget(filter)` | Exam session and result metrics |
| `getLmsWidget(filter)` | LMS course and enrollment metrics |
| `getInventoryWidget(filter)` | Inventory and stock metrics |
| `getTasksWidget(filter)` | Task pipeline metrics |
| `getRecentActivityWidget(filter)` | Unified activity feed |
| `getNotificationsWidget(filter)` | Notification stats |
| `getLeaderboardWidget(filter)` | Performance leaderboard |
| `getQuickActions({ role })` | Role-based quick actions |
| `getBranchComparison(filter)` | Cross-branch comparison |
| `getCompanyComparison()` | Cross-company comparison |
| `drillDownByBranch({ branchId })` | Branch-level drill-down |
| `drillDownByCompany({ companyId })` | Company-level drill-down |

### Dashboard Providers (`dashboardProviders.ts`)

| Query | Description |
|-------|-------------|
| `getDashboardData({ token, providerIds })` | Get data from requested providers |
| `listDashboardProviders({ token })` | List available providers |
| `moduleProviders` | Registry of all 8 providers |

## Schema Tables

| Table | Location | Purpose |
|-------|----------|---------|
| `dashboardLayouts` | `schema/shared.ts` | User/role-based dashboard layouts |
| `dashboardWidgets` | `schema/shared.ts` | Widget definitions with type/size/roles |
| `userDashboardLayouts` | `schema/analytics.ts` | Per-user layout persistence |
| `kpiDefinitions` | `schema/shared.ts` | KPI metric templates |
| `kpiSnapshots` | `schema/analytics.ts` | KPI time-series values |

## Database Tables

| Table | Table Name | Key Fields |
|-------|-----------|------------|
| Layouts | `dashboardLayouts` | name, userId, role, widgets, layoutConfig, isDefault |
| Widgets | `dashboardWidgets` | name, code, widgetType, dataSource, defaultConfig, allowedRoles |
| User Layouts | `userDashboardLayouts` | userId, name, layout, widgets, globalFilters, isDefault |
| KPI Definitions | `kpiDefinitions` | name, code, category, formula, target, frequency |
| KPI Snapshots | `kpiSnapshots` | kpiId, value, period, periodStart, periodEnd |

## Role-Based Permissions

Dashboard Studio respects these permission layers:

1. **Widget Visibility** — `dashboardWidgets.allowedRoles` restricts which roles can see/add a widget
2. **Layout Ownership** — Layouts are owned by `userId` or `role`
3. **Provider Access** — Dashboard Providers filter data based on user's visibility scope
4. **Quick Actions** — Role-filtered action menu
5. **Drill-Down** — Respects branch/company scope

## Integration Points

| Integration | Connected Via |
|-------------|-------------|
| CRM Widget | `leadMaster`, `leadAssignments` |
| Finance Widget | `feeInvoices`, `paymentTransactions`, `studentFeeAccounts` |
| Academic Widget | `studentMaster`, `courses`, `academicBatches` |
| HR Widget | `users` |
| Operations Widget | `tasks`, `workflowInstances`, `approvalRequests` |
| Examination Widget | `examSessions`, `examResults`, `examMarks` |
| LMS Widget | `lmsCourses`, `lmsLessons`, `lmsEnrollments` |
| Inventory Widget | `inventoryItems`, `stockMovements` |
| Communication Widget | `communicationQueue`, `messageCampaigns` |
| Dashboard Providers | 8 module-specific provider registrations |
| KPI Engine | `kpiDefinitions`, `kpiSnapshots` from Analytics Engine |
