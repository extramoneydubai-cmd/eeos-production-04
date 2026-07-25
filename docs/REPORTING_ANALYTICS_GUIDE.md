# Reporting & Analytics Platform — Enterprise Guide

## Overview

The Reporting & Analytics Platform is a centralized, reusable reporting system shared by every module in EEOS. It provides report builder, saved reports, dashboard widgets, global filters, export, scheduling, drill-down, charts, and KPI cards.

**Architecture Principle:** This is NOT module-specific reporting. It is a reusable platform consumed by every business module. No module should build its own reporting logic.

## Architecture

```
Reporting & Analytics Platform
│
├── Report Builder
│   ├── reportDefinitions  → Configurable report templates (tabular, summary, chart, KPI, etc.)
│   ├── savedReports       → User-saved reports with custom filters
│   └── reportExecutions   → Execution history with performance tracking
│
├── Data Sources (20+ across all modules)
│   ├── CRM                → leads, leads_by_stage, leads_by_source, conversion_rate
│   ├── Finance            → revenue, revenue_summary, outstanding, expenses
│   ├── Students           → list, by_batch
│   ├── Employees          → list
│   ├── Examinations       → results, pass_rate
│   ├── LMS                → courses, enrollments, completion_rate
│   ├── Inventory          → items, low_stock, by_category
│   ├── Procurement        → pos, vendors
│   ├── Tasks              → list, by_status
│   ├── HR                 → employees, by_department
│   └── Admissions         → intakes
│
├── Export Engine
│   ├── reportExports      → PDF, CSV, Excel, JSON export
│   └── Format Helpers     → CSV generator, HTML table, JSON formatter
│
├── Schedule Engine
│   ├── reportSchedules    → Daily, weekly, monthly schedules
│   ├── executeDueSchedules → Automated execution cron
│   └── Next Run Calculator → Intelligent scheduling
│
├── KPI Engine
│   ├── kpiDefinitions     → Configurable KPI metrics per module
│   ├── kpiSnapshots       → Time-series KPI values
│   └── kpiDashboardCards  → Enriched KPI display cards
│
├── Dashboard Studio
│   ├── dashboardLayouts   → User-customizable layouts
│   ├── dashboardWidgets   → Configurable widget library
│   ├── userDashboardLayouts → Per-user layout persistence
│   └── dashboardProviders → Module-provided KPI/chart/timeline data
│
└── Global Filters
    ├── Branches
    ├── Departments
    ├── Users
    ├── Verticals
    ├── Status Options
    └── Date Range
```

## Database Tables (7)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `reportDefinitions` | Report templates | name, module, reportType, dataSource, config, defaultFilters |
| `savedReports` | User-saved instances | definitionId, userId, filters, chartConfig, isFavorite |
| `reportExecutions` | Execution audit trail | reportId, userId, recordCount, executionTime, status, resultData |
| `reportExports` | Export records | reportId, userId, format, fileUrl, status |
| `reportSchedules` | Scheduled reports | reportId, frequency, time, recipients, nextRunAt |
| `userDashboardLayouts` | Per-user dashboard | userId, layout, widgets, globalFilters, isDefault |
| `kpiSnapshots` | KPI time-series | kpiId, value, period, periodStart, periodEnd |
| `kpiDefinitions` | KPI templates | name, code, category, formula, target, frequency, dataSource |

## Data Sources (Complete Reference)

### CRM
| Data Source | Type | Description |
|-------------|------|-------------|
| `crm.leads` | Tabular | All leads with filters |
| `crm.leads_by_stage` | Summary | Lead count grouped by stage |
| `crm.leads_by_source` | Summary | Lead count grouped by source |
| `crm.conversion_rate` | KPI | Conversion rate percentage |

### Finance
| Data Source | Type | Description |
|-------------|------|-------------|
| `finance.revenue` | Tabular | Payment transactions |
| `finance.revenue_summary` | KPI | Total, verified, pending amounts |
| `finance.outstanding` | Tabular | Outstanding fee balances |
| `finance.expenses` | Tabular | Expense records |

### Students
| Data Source | Type | Description |
|-------------|------|-------------|
| `students.list` | Tabular | Student records |
| `students.by_batch` | Summary | Students grouped by batch |

### Examinations
| Data Source | Type | Description |
|-------------|------|-------------|
| `exams.results` | Tabular | Exam results |
| `exams.pass_rate` | KPI | Pass rate percentage |

### LMS
| Data Source | Type | Description |
|-------------|------|-------------|
| `lms.courses` | Tabular | Course records |
| `lms.enrollments` | Tabular | Enrollment records |
| `lms.completion_rate` | KPI | Course completion percentage |

### Inventory
| Data Source | Type | Description |
|-------------|------|-------------|
| `inventory.items` | Tabular | Inventory items |
| `inventory.low_stock` | Tabular | Low stock alerts |
| `inventory.by_category` | Summary | Items grouped by category |

### Procurement
| Data Source | Type | Description |
|-------------|------|-------------|
| `procurement.pos` | Tabular | Purchase orders |
| `procurement.vendors` | Tabular | Vendor records |

### Tasks
| Data Source | Type | Description |
|-------------|------|-------------|
| `tasks.list` | Tabular | All tasks |
| `tasks.by_status` | Summary | Tasks grouped by status |

### HR
| Data Source | Type | Description |
|-------------|------|-------------|
| `hr.employees` | Tabular | Employee records |
| `hr.by_department` | Summary | Employees grouped by department |

## API Reference

### Report Builder (`reportEngine.ts`)

| Query/Mutation | Description |
|----------------|-------------|
| `createReportDefinition(args)` | Create a report template |
| `updateReportDefinition(args)` | Update a report template |
| `listReportDefinitions(filter)` | List report definitions by module/type |
| `getReportDefinition({ id })` | Get a report definition |
| `saveReport(args)` | Save a report with user filters |
| `toggleFavoriteReport({ id })` | Toggle favorite status |
| `deleteSavedReport({ id })` | Delete a saved report |
| `listSavedReports(filter)` | List user's saved reports |
| `executeReport(args)` | Execute a report definition with filters |
| `getReportExecutionHistory(filter)` | Get execution history |
| `getAvailableDataSources()` | List all available data sources |
| `getGlobalFilterOptions()` | Get branch/department/user options |

### Export Engine (`reportExportEngine.ts`)

| Query/Mutation | Description |
|----------------|-------------|
| `exportReport(args)` | Export report in PDF/CSV/Excel/JSON |
| `getExportHistory({ limit? })` | Get user's export history |
| `getExport({ id })` | Get export details |
| `formatReportData(args)` | Format data as CSV/JSON/HTML |

### Schedule Engine (`reportScheduleEngine.ts`)

| Query/Mutation | Description |
|----------------|-------------|
| `createSchedule(args)` | Create a scheduled report |
| `updateSchedule(args)` | Update schedule config |
| `toggleSchedule({ id })` | Activate/deactivate |
| `deleteSchedule({ id })` | Delete schedule |
| `listSchedules(filter)` | List schedules |
| `executeDueSchedules()` | Execute all due schedules |
| `saveDashboardLayout(args)` | Save user dashboard layout |
| `getUserDashboardLayouts()` | Get user's layouts |
| `getDefaultDashboardLayout()` | Get default layout |

### KPI Engine (`analyticsEngine.ts`)

| Query/Mutation | Description |
|----------------|-------------|
| `createKpiDefinition(args)` | Create a KPI metric |
| `listKpiDefinitions(filter)` | List KPI definitions |
| `calculateKpi(args)` | Calculate KPI value for a period |
| `getKpiTimeSeries(filter)` | Get KPI history |
| `getKpiDashboardCards(filter)` | Get enriched KPI cards |
| `generateAllKpiSnapshots(args)` | Bulk generate all KPI snapshots |
| `getModuleDashboardData({ module })` | Get module-specific dashboard data |

## Global Filters

All reports support these global filters:
- **Branches** — Filter by organization branch
- **Departments** — Filter by department
- **Users** — Filter by user/owner
- **Verticals** — Filter by academic vertical
- **Status Options** — active, inactive, pending, completed, cancelled
- **Date Range** — startDate, endDate (applied to createdAt)

## Export Formats

| Format | Description | Implementation |
|--------|-------------|----------------|
| CSV | Comma-separated values | `generateCsvData()` |
| JSON | Raw JSON data | Direct JSON serialization |
| HTML/PDF | HTML table representation | `generateHtmlTable()` — printable |
| Excel | CSV-based fallback | Delegates to CSV generator |

## Scheduled Reports

| Frequency | Config |
|-----------|--------|
| Daily | Runs every day at specified time |
| Weekly | Runs on specified day of week (0=Sun, 6=Sat) |
| Monthly | Runs on specified day of month |

Scheduled reports can be exported as PDF, CSV, or Excel and sent to email recipients.

## Dashboard Studio Integration

Dashboard Studio consumes:
- **Dashboard Providers** — Module-registered KPI, chart, and timeline providers
- **Dashboard Layouts** — User-customizable widget layouts
- **Dashboard Widgets** — System-defined and custom widgets

Each module registers a `DashboardProvider` that exposes KPIs, charts, timeline, and recent activity without querying business tables directly.

## KPI Engine

KPI definitions support these aggregations:
- **count** — Total record count
- **sum** — Sum of amount/value fields
- **avg** — Average of amount/value fields
- **rate** — Rate calculation
- **percentage** — Percentage calculation
- **ratio** — Ratio between two values

Available KPI data sources span CRM, Finance, Students, Employees, Exams, LMS, Inventory, Tasks, and Procurement.

## Acceptance Criteria

| Feature | Status |
|---------|:------:|
| Report Builder | ✅ Complete |
| Saved Reports | ✅ Complete |
| Dashboard Widgets | ✅ Complete (shared.ts) |
| Global Filters | ✅ Complete |
| Export (PDF/CSV/Excel/JSON) | ✅ Complete |
| Scheduled Reports | ✅ Complete |
| Drill-down | 🟡 Via execution detail query |
| Charts | ✅ Complete (via data sources + Chart Studio) |
| KPI Cards | ✅ Complete |
| Filter Engine | ✅ Complete (`applyFilters`) |
| Dashboard Providers | ✅ Complete (8 registered) |
