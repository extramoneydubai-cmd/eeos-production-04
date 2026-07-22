# DOC-17 — Reports, Dashboards & Business Intelligence Engine Bible

> **Status:** Architecture Blueprint (Draft)  
> **Domain:** Analytics, BI & Reporting  
> **Owner:** EEOS Architecture Team  
> **Version:** 1.0  
> **Last Updated:** 2026-07-08  
> **Predecessor:** DOC-00 — EEOS Master Index, DOC-05 — Lead V2, DOC-07 — Student 360°, DOC-08 — Finance, DOC-09 — Communication, DOC-10 — Workflow, DOC-11 — Sales, DOC-12 — Collection, DOC-13 — HR, DOC-14 — Marketing, DOC-15 — Technology, DOC-16 — Administration  
> **Existing Infrastructure:** `crmDashboard.ts` (CRM KPI queries), `dashboard.ts` (main Dashboard KPI queries), `salesPerformance.ts` (sales analytics helpers), `collectionEngine.ts` (collection dashboards), `crmSales.ts` (sales performance dashboard), `chart.tsx` (recharts wrapper), `SalesPerformanceDashboard.tsx` (full BI page), `CrmDashboard.tsx` (CRM KPIs), `CollectionDashboard.tsx` (collection intelligence), `Dashboard.tsx` (main system dashboard), `SalesPaymentsDashboard.tsx` (payment tracking)

---

## Table of Contents

1. [Business Intelligence Philosophy](#1-business-intelligence-philosophy)
2. [Reporting Architecture](#2-reporting-architecture)
3. [Dashboard Hierarchy](#3-dashboard-hierarchy)
4. [Executive Dashboards](#4-executive-dashboards)
5. [CRM Reports](#5-crm-reports)
6. [Academic Reports](#6-academic-reports)
7. [Finance Reports](#7-finance-reports)
8. [Communication Reports](#8-communication-reports)
9. [HR Reports](#9-hr-reports)
10. [Technology Reports](#10-technology-reports)
11. [Administration Reports](#11-administration-reports)
12. [Collections Reports](#12-collections-reports)
13. [Marketing Reports](#13-marketing-reports)
14. [Cross Module KPIs](#14-cross-module-kpis)
15. [Analytics Engine](#15-analytics-engine)
16. [Visualization Standards](#16-visualization-standards)
17. [Drill Down Rules](#17-drill-down-rules)
18. [Scheduled Reports](#18-scheduled-reports)
19. [AI Opportunities](#19-ai-opportunities)
20. [Implementation Roadmap](#20-implementation-roadmap)
21. [Golden Rules](#21-golden-rules)

---

## 1. Business Intelligence Philosophy

### Purpose

The Reports, Dashboards & Business Intelligence Engine is the **decision-making layer** of EEOS. It transforms raw operational data from every module into actionable insights, historical reports, live operational dashboards, and predictive intelligence.

### Goals

| Goal | Description |
|------|-------------|
| **Visibility** | Every module contributes measurable data to a unified reporting layer |
| **Accountability** | Every KPI is attributed to a team, branch, or individual |
| **Speed** | Dashboards load in under 2 seconds with pre-aggregated data |
| **Trust** | Single source of truth — no two reports show different numbers for the same metric |
| **Actionability** | Every dashboard answers a specific business question |
| **Scalability** | Works for 10 leads or 10M leads with the same architecture |

### Reporting Principles

| Principle | Description |
|-----------|-------------|
| **Reports are historical** | Reports answer "What happened?" with immutable data snapshots |
| **Dashboards are live** | Dashboards answer "What is happening now?" with real-time queries |
| **Analytics explains why** | Analytics answers "Why did it happen?" through trends, comparisons, and drill-downs |
| **BI predicts what happens next** | BI answers "What will happen?" through forecasting and predictive models |
| **No duplicate KPIs** | Every metric has one canonical definition, one calculation, one owner |
| **Single source of truth** | All reports pull from the same underlying data layer and KPI definitions |
| **Everything drillable** | Every number on a dashboard can be clicked to reveal its underlying data |
| **Everything exportable** | Every report can be exported as PDF, Excel, CSV, or scheduled email |

### Decision Support Layers

```
┌─────────────────────────────────────────────────────┐
│              STRATEGIC INTELLIGENCE                  │
│            CEO / Board / Investors                   │
│  Annual trends, market analysis, growth forecasting  │
├─────────────────────────────────────────────────────┤
│              TACTICAL INTELLIGENCE                   │
│          Department Heads / Branch Managers          │
│  Monthly performance, variance analysis, KPIs        │
├─────────────────────────────────────────────────────┤
│              OPERATIONAL INTELLIGENCE                │
│          Team Leads / Counselors / Staff             │
│  Daily metrics, task tracking, live dashboards       │
├─────────────────────────────────────────────────────┤
│              TRANSACTIONAL DATA                      │
│          All Modules (Source of Truth)               │
│  Every action creates a data point                  │
└─────────────────────────────────────────────────────┘
```

### Operational vs Strategic Intelligence

| Dimension | Operational Intelligence | Strategic Intelligence |
|-----------|------------------------|----------------------|
| **Time Horizon** | Real-time to daily | Monthly to yearly |
| **Audience** | Frontline staff, team leads | Executives, board |
| **Granularity** | Individual actions | Aggregated trends |
| **Refresh** | Continuous (live) | Periodic (daily/weekly) |
| **Examples** | Today's calls, pending tasks, overdue followups | Revenue growth, market share, CLV trends |

---

## 2. Reporting Architecture

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                              │
│  Web Dashboards │ Mobile Dashboards │ Embedded Reports           │
│  Scheduled Emails │ PDF/Excel Export │ Custom BI Tools           │
├─────────────────────────────────────────────────────────────────┤
│                  ANALYTICS LAYER                                 │
│  KPI Engine │ Trend Analysis │ Forecasting │ Benchmarking        │
│  Drill-Down │ Filters │ Date Ranges │ Comparisons                │
├─────────────────────────────────────────────────────────────────┤
│                  AGGREGATION LAYER                               │
│  Materialized Views │ Pre-computed Aggregates │ Cache            │
│  Date-partitioned Tables │ Time-series Storage                   │
├─────────────────────────────────────────────────────────────────┤
│                  DATA LAYER (Convex / DB)                        │
│  Tasks │ Leads │ Payments │ Users │ Courses │ Activity          │
│  Approvals │ Messages │ Notifications │ All Entity Tables       │
└─────────────────────────────────────────────────────────────────┘
```

### Reporting Types

| Type | Description | Output | Existing Implementation |
|------|-------------|--------|------------------------|
| **Operational Report** | Day-to-day metrics for frontline staff | Card + Table + Mini Charts | `CrmDashboard.tsx`, `Dashboard.tsx` |
| **Management Report** | Weekly/monthly performance for managers | Table + Charts + Trends | `SalesPerformanceDashboard.tsx` |
| **Executive Dashboard** | Organization health for C-level | KPI Cards + Funnel + Health Metrics | `CrmDashboard.tsx` (CEO mode) |
| **Business Intelligence** | Cross-module analytics & insights | Scorecards + Forecast + Anomalies | Partial (future) |
| **Predictive Analytics** | AI-powered forecasts | Predictions + Recommendations + Alerts | Partial (future) |

### Existing Data Flow (Codebase Audit)

```
Lead Master ──────────────┐
Lead Activity ────────────┤
Lead Payments ────────────┤
Lead Tasks ───────────────┤
Call Logs ────────────────┤
Lead Stage History ───────┤
Users ────────────────────┤
Courses ──────────────────┤
Installments ─────────────┤
PDCs ─────────────────────┤
Commitments ──────────────┤
(all entity tables) ──────┤
                          ▼
                ┌─────────────────────┐
                │  Convex Query Layer  │
                │  (data computation)  │
                └──────────┬──────────┘
                           ▼
                ┌─────────────────────┐
                │  React UI Layer      │
                │  (recharts, cards)   │
                └──────────┬──────────┘
                           ▼
                ┌─────────────────────┐
                │  User sees dashboard │
                └─────────────────────┘
```

### Responsibilities of Each Layer

| Layer | Responsibility | Technology |
|-------|---------------|------------|
| **Data Layer** | Store all entity data with proper indexes | Convex DB (schema.ts) |
| **Aggregation Layer** | Pre-compute KPIs, cache results, materialize views | Convex queries with `useQuery` caching |
| **Analytics Layer** | Compute trends, comparisons, funnels, forecasts | `salesPerformance.ts` helpers |
| **Presentation Layer** | Render charts, cards, tables, export handlers | React + recharts + shadcn/ui |

---

## 3. Dashboard Hierarchy

### Role-Based Dashboard Access

Each role-level dashboard inherits all data from lower levels and adds higher-level aggregates.

```
Super Admin ─── Everything across all organizations
     │
CEO ─────────── Organization-wide executive KPIs
     │
COO ─────────── Operations metrics across all branches
     │
Principal ───── Institution-level academic + admin metrics
     │
Branch Manager ─ Branch-level sales, collection, operations
     │
Department Head ─ Department-specific KPIs (Sales, HR, Tech...)
     │
Manager ─────── Team-level performance metrics
     │
Faculty ─────── Class, attendance, academic performance
     │
Employee ────── Personal tasks, assigned leads, activities
```
```
Parent ──────── Student fees, attendance, communication
     │
Student ─────── Academic progress, assignments, schedule
```

### Dashboard Definition

Each dashboard is defined by:

```typescript
interface DashboardDefinition {
  id: string;
  title: string;
  role: "super_admin" | "admin" | "manager" | "staff" | "faculty" | "parent" | "student";
  sections: Array<{
    id: string;
    title: string;
    type: "kpi_cards" | "funnel" | "table" | "chart" | "timeline" | "list";
    dataSource: string;  // Convex query function name
    refreshInterval: number; // milliseconds, 0 = manual
    metrics: string[];   // KPI IDs to display
    drillDownRoute?: string;
  }>;
}
```

### Existing Dashboard Pages

| Dashboard | Role | File | KPIs |
|-----------|------|------|------|
| **Main Dashboard** | All users | `Dashboard.tsx` | Users, Tasks, Approvals, Notifications, Team structure |
| **CRM Dashboard** | Sales/counselors | `CrmDashboard.tsx` | Active leads, followups, pipeline, conversion, revenue, approvals |
| **Sales Performance** | Sales managers | `SalesPerformanceDashboard.tsx` | 8 KPI cards, funnel, leaderboard, counselor perf, branch perf, targets |
| **Collection Dashboard** | Collection team | `CollectionDashboard.tsx` | PDC pipeline, installment health, overdue, bounce rate, automation |
| **Payment Dashboard** | Finance team | `SalesPaymentsDashboard.tsx` | Collected, outstanding, discount, waiver, per-lead breakdown |

---

## 4. Executive Dashboards

### CEO Dashboard

The CEO Dashboard provides a single-pane-of-glass view of the entire organization.

**Existing Implementation:** `CrmDashboard.tsx` (CEO mode via `dashboard.isCEO`)

**KPI Cards (Row 1):**
| Card | Metric | Source |
|------|--------|--------|
| Total Leads | Active + converted leads | `crmDashboard.getCrmDashboardData` |
| Today's Followups | Follow-ups due today | Same |
| Conversion Rate | Converted / (Active + Converted) | Same |
| Pipeline Value | Sum of standard amounts | Same |

**Executive Cards (Row 2):**
| Card | Metric | Source |
|------|--------|--------|
| New Leads | Created in selected period | Same |
| Working Leads | Active with recent activity | Same |
| Converted | Total converted | Same |
| Total Collected | Verified payments in period | Same |
| Pending Approvals | Awaiting decision | Same |

**Revenue Overview:**
| Card | Color | Description |
|------|-------|-------------|
| Pipeline Value | Default | Sum of all standard amounts |
| Discount Given | Red | Total discount exposure |
| Waiver Given | Orange | Total waiver exposure |
| Total Collected | Green | Verified payment total |

**Pipeline Health:** Simplified stage view with 7 stages (New → Won/Lost) with count bars

**Funnel:** Lead → Enrolled → Paid → Converted conversion funnel with percentage drop-off

**Collection Intelligence Cards:**
| Card | Description |
|------|-------------|
| PDC Exposure | Total scheduled + deposited PDC amount |
| Overdue Installments | Count + amount |
| Collection Efficiency | Verified / (Verified + Pending) |
| PDC Bounce Rate | Bounced / (Cleared + Bounced) |

**Proposed Enhancements (Phase 1):**

| Enhancement | Description | Priority |
|-------------|-------------|----------|
| Revenue Trend Chart | 12-month revenue line chart with forecast | P1 |
| Branch Comparison | Side-by-side branch revenue + admissions bar chart | P1 |
| Weekly Trend Sparklines | Mini sparkline on each KPI card showing 4-week trend | P1 |
| Alert Panel | Top 5 alerts (overdue leads, pending verifications, bounced PDCs) | P1 |
| Quick Action Bar | Buttons for common navigation (Database, Sales, Collections) | P2 |

### COO Dashboard

**Purpose:** Operational oversight across all branches

**KPIs:**
| KPI | Description |
|-----|-------------|
| Branch Performance | Admissions, revenue, collection, conversion by branch |
| Staff Utilization | Active vs inactive counselors per branch |
| Operational Efficiency | Average time from lead → admission per branch |
| Facility Utilization | Classroom/lab usage % per campus |
| Compliance Rate | Document completion % for admissions |

### Principal Dashboard

**Purpose:** Institution-level academic + student oversight

**KPIs:**
| KPI | Description |
|-----|-------------|
| Total Enrollments | Current session enrollment |
| Attendance % | Overall institution attendance |
| Academic Performance | Average grade/score across programs |
| Faculty Strength | Active faculty count |
| Student Satisfaction | Survey score (future) |
| Graduation Rate | % of students completing programs |

---

## 5. CRM Reports

### Existing CRM Reports

| Report | Implementation | Metrics |
|--------|---------------|---------|
| **CRM Dashboard** | `crmDashboard.getCrmDashboardData` | Lead counts, pipeline distribution, conversion rate, followups, revenue, approvals, collections |
| **Sales Performance** | `crmSales.getSalesPerformanceDashboard` | 8 KPI groups, funnel stages, counselor perf, leaderboard, timeline, branch perf |
| **Collection Dashboard** | `collectionEngine.getCollectionDashboard` | PDC stats, installments, payments, plans, commitments, bounce rate |
| **Payment Dashboard** | `crm.getAllLeadsPayments` | Per-lead gross/discount/waiver/net/collected/balance |
| **PDC Dashboard** | `collectionEngine.getPDCDashboard` | PDC pipeline stats, due today/week, overdue, bounce rate |

### Proposed CRM Reports

| Report | Description | Source Tables |
|--------|-------------|---------------|
| **Lead Sources Report** | Lead volume and conversion by source | `leadMaster.source`, `crmSources` |
| **Lead Funnel Report** | Stage-by-stage funnel with drop-off rates | `leadMaster.stage`, `leadStageHistory` |
| **Campaign Performance** | Leads, conversion, revenue by campaign | `leadMaster.campaign`, `leadMaster.utm` |
| **Conversion Rate Report** | Conversion rate by counselor, branch, source, program | `leadMaster`, `leadCourses`, `users` |
| **Lost Leads Report** | Lost count by reason, counselor, source | `leadMaster.status`, `crmLostReasons` |
| **Follow-up Report** | Follow-up compliance, overdue %, response time | `leadMaster.nextActionDate`, `leadActivity` |
| **Counselor Performance** | Assigned, contacted, converted, revenue, collection by counselor | `salesPerformance.ts` helpers |
| **Sales Pipeline Report** | Pipeline value, stage distribution, expected revenue | `leadMaster` |

### Sample: Lead Sources Report

```
┌─────────────────────────────────────────────────────┐
│  LEAD SOURCES REPORT — Q3 2026                       │
│  Date Range: Apr 1 - Jun 30, 2026                    │
├────────────┬────────┬──────────┬─────────┬──────────┤
│ Source     │ Leads  │ Converted │ Conv %  │ Revenue  │
├────────────┼────────┼──────────┼─────────┼──────────┤
│ Website    │   245   │    38    │  15.5%  │₹76,00,000│
│ Referral   │   189   │    42    │  22.2%  │₹84,00,000│
│ Instagram  │   156   │    18    │  11.5%  │₹36,00,000│
│ Walk-in    │   112   │    31    │  27.7%  │₹62,00,000│
│ WhatsApp   │    98   │    22    │  22.4%  │₹44,00,000│
│ Facebook   │    87   │    12    │  13.8%  │₹24,00,000│
│ Google Ads │    76   │    16    │  21.1%  │₹32,00,000│
│ Seminar    │    54   │    19    │  35.2%  │₹38,00,000│
│ YouTube    │    45   │     8    │  17.8%  │₹16,00,000│
│ LinkedIn   │    23   │     5    │  21.7%  │₹10,00,000│
│ Other      │    67   │     9    │  13.4%  │₹18,00,000│
├────────────┼────────┼──────────┼─────────┼──────────┤
│ TOTAL      │  1152   │   220    │  19.1%  │₹4,40,00K │
└────────────┴────────┴──────────┴─────────┴──────────┘
```

### Sample: Sales Funnel Report

```
┌──────────────────────────────────────────┐
│  SALES FUNNEL — Current Pipeline          │
│  Total Active: 842 leads                  │
├────────────┬────────┬─────────┬──────────┤
│ Stage      │ Count  │ Pipeline │ Drop-off │
├────────────┼────────┼─────────┼──────────┤
│ New        │   245  │  29.1%  │    —     │
│ Attempted  │   189  │  22.4%  │  -22.9%  │
│ Connected  │   156  │  18.5%  │  -17.5%  │
│ Qualified  │   112  │  13.3%  │  -28.2%  │
│ Counselling│    87  │  10.3%  │  -22.3%  │
│ Interested │    54  │   6.4%  │  -37.9%  │
│ Follow Up  │    38  │   4.5%  │  -29.6%  │
│ Negotiation│    23  │   2.7%  │  -39.5%  │
│ Converted  │   220  │   —     │   —      │
│ Lost       │   345  │   —     │   —      │
└────────────┴────────┴─────────┴──────────┘
```

---

## 6. Academic Reports

### Proposed Reports

| Report | Description | Source Tables |
|--------|-------------|---------------|
| **Admissions Report** | Daily/weekly/monthly admission trends by program, batch, branch | Converted leads, courses |
| **Program Enrollment** | Enrollment count by program, batch type, session | `leadCourses`, `courses`, `academicPrograms` |
| **Batch Capacity Report** | Actual vs capacity by batch | Future batch tables |
| **Subject Performance** | Student scores by subject, exam type | Future academic tables |
| **Attendance Report** | Student attendance % by class, program, date range | Future attendance tables |
| **Exam Results** | Pass/fail distribution, grade analysis | Future exam tables |
| **Student Progress** | Stage-by-stage academic progress tracking | Future progress tables |
| **Graduation Report** | Graduation rates by cohort | Future graduation tables |

### Academic KPI Definitions

| KPI | Formula | Frequency |
|-----|---------|-----------|
| Enrollment Rate | (Enrolled / Applied) × 100 | Monthly |
| Retention Rate | (Continuing / Total Enrolled) × 100 | Semester |
| Attendance % | (Days Attended / Total Days) × 100 | Daily |
| Pass Rate | (Passed / Appeared) × 100 | Per exam |
| Average Score | Sum of scores / Total students | Per exam |
| Student-to-Faculty Ratio | Total Students / Total Faculty | Annual |

---

## 7. Finance Reports

### Proposed Reports

| Report | Description | Source Tables |
|--------|-------------|---------------|
| **Fee Collection Report** | Collected fees by program, branch, date range | `leadPayments`, `courses` |
| **Outstanding Report** | All outstanding amounts by lead, age | `leadPayments`, `leadMaster` |
| **Daily Cash Flow** | Daily collections, refunds, net cash position | `leadPayments` |
| **Monthly Revenue** | Revenue by month, program, branch | `leadPayments`, `leadMaster` |
| **Refund Report** | Refund amounts, reasons, approval status | Future refunds table |
| **Scholarship Report** | Scholarship amounts, categories, recipients | `leadDiscounts` |
| **Discount Report** | Discount by type, amount, approver | `leadDiscounts`, `leadApprovals` |
| **Receivables Report** | Ageing analysis of all receivables | `payment_installments`, `payment_pdcs` |

### Sample: Outstanding Report by Ageing

```
┌─────────────────────────────────────────────────┐
│  OUTSTANDING RECEIVABLES — Ageing Analysis       │
│  As of: Jul 08, 2026                             │
├──────────────────┬───────────┬───────────┬───────┤
│ Ageing Bucket    │ Count     │ Amount    │  %    │
├──────────────────┼───────────┼───────────┼───────┤
│ Current (0-7d)   │     456   │ ₹89,00,000│ 31.2% │
│ 8-15 Days        │     234   │ ₹52,00,000│ 18.2% │
│ 16-30 Days       │     167   │ ₹41,00,000│ 14.4% │
│ 31-60 Days       │      89   │ ₹28,00,000│  9.8% │
│ 61-90 Days       │      45   │ ₹16,00,000│  5.6% │
│ 90+ Days         │      23   │ ₹ 9,00,000│  3.2% │
├──────────────────┼───────────┼───────────┼───────┤
│ Total Receivables│    1014   │ ₹235,00K  │ 82.4% │
│ Already Paid     │      —    │ ₹ 50,00,000│ 17.6% │
│ Net Payable      │      —    │ ₹285,00K  │100.0% │
└──────────────────┴───────────┴───────────┴───────┘
```

### Financial KPI Definitions

| KPI | Formula | Frequency |
|-----|---------|-----------|
| Collection Efficiency | (Collected / Net Payable) × 100 | Daily |
| Recovery Rate | (Recovered / Overdue) × 100 | Weekly |
| Days Sales Outstanding (DSO) | (Avg Receivables / Revenue) × 365 | Monthly |
| Discount Rate | (Total Discount / Gross Fees) × 100 | Monthly |
| Fee Concession % | (Waiver + Discount) / Gross Fees × 100 | Monthly |
| Cash Conversion Cycle | DSO + DIO - DPO | Monthly |

---

## 8. Communication Reports

### Proposed Reports

| Report | Description | Source Tables |
|--------|-------------|---------------|
| **Email Delivery Report** | Sent, delivered, bounced, opened, clicked | Future comm analytics tables |
| **SMS Delivery Report** | Sent, delivered, failed SMS messages | Future SMS analytics |
| **WhatsApp Delivery Report** | Sent, delivered, read, replied messages | `leadWhatsAppMessages` |
| **Push Notification Report** | Sent, opened, actioned notifications | `notifications` |
| **Broadcast Analytics** | Performance of broadcast campaigns | Future broadcast tables |
| **Template Performance** | Template-wise delivery and response rates | Future template analytics |

### Existing Communication Metrics

The `leadWhatsAppMessages` table already tracks:
- Template name, message, status (sent/opened/clicked/replied/failed)
- Template type (greeting, followup, reminder, offer, approval, conversion, manual)
- Sent by user

### Communication KPI Definitions

| KPI | Formula | Frequency |
|-----|---------|-----------|
| Delivery Rate | (Delivered / Sent) × 100 | Per campaign |
| Open Rate | (Opened / Delivered) × 100 | Per campaign |
| Click Rate | (Clicked / Opened) × 100 | Per campaign |
| Reply Rate | (Replied / Sent) × 100 | Per campaign |
| Bounce Rate | (Bounced / Sent) × 100 | Per campaign |
| Conversion from Comm | (Converted / Contacted) × 100 | Monthly |

---

## 9. HR Reports

### Proposed Reports

| Report | Description | Source Tables |
|--------|-------------|---------------|
| **Headcount Report** | Total employees by department, branch, designation | `users`, `departments`, `branches` |
| **Attendance Report** | Daily/monthly attendance % by department | Future attendance tables |
| **Leave Report** | Leave balance, utilization, approvals by employee | Future leave tables |
| **Payroll Summary** | Salary summary by department, branch | Future payroll tables |
| **Performance Report** | Performance scores, ratings, promotions | Future performance tables |
| **Training Report** | Training completion, certifications by employee | Future training tables |
| **Recruitment Funnel** | Applicants → Interviewed → Offered → Joined | Future recruitment tables |
| **Attrition Report** | Voluntary/involuntary attrition by department | Future exit tables |

### Sample: Headcount Report

```
┌─────────────────────────────────────────────────────┐
│  HEADCOUNT REPORT — Jul 2026                         │
├────────────────────┬───────┬───────┬───────┬────────┤
│ Department         │ Total │ Active│ Inactive│ Vacant│
├────────────────────┼───────┼───────┼───────┼────────┤
│ Sales              │   45  │   42  │   3   │   2    │
│ Marketing          │   12  │   11  │   1   │   1    │
│ Technology         │   28  │   27  │   1   │   0    │
│ Finance            │   15  │   14  │   1   │   1    │
│ HR                 │    8  │    8  │   0   │   0    │
│ Administration     │   20  │   19  │   1   │   2    │
│ Academic           │   65  │   62  │   3   │   3    │
│ Collections        │   10  │    9  │   1   │   1    │
├────────────────────┼───────┼───────┼───────┼────────┤
│ TOTAL              │  203  │  192  │  11   │  10    │
└────────────────────┴───────┴───────┴───────┴────────┘
```

### HR KPI Definitions

| KPI | Formula | Frequency |
|-----|---------|-----------|
| Headcount | Total active employees | Daily |
| Attrition Rate | (Exits / Average Headcount) × 100 | Monthly |
| Absenteeism Rate | (Absent Days / Working Days) × 100 | Monthly |
| Leave Utilization | (Leave Taken / Leave Entitled) × 100 | Monthly |
| Time to Hire | Avg days from requisition to joining | Per hire |
| Training Hours/Employee | Total training hours / Headcount | Monthly |
| Promotion Rate | (Promoted / Eligible) × 100 | Annual |

---

## 10. Technology Reports

### Proposed Reports

| Report | Description | Source Tables |
|--------|-------------|---------------|
| **Asset Register** | All hardware assets by type, location, status | Future assets table |
| **Software License Report** | Licenses by software, expiry, seats used | Future software table |
| **Subscription Cost Report** | SaaS subscriptions by service, monthly cost | Future subscriptions table |
| **Infrastructure Health** | Server uptime, storage, CPU, memory status | Future monitoring table |
| **Incident Report** | Helpdesk incidents by type, priority, resolution time | Future helpdesk table |
| **Warranty Report** | Assets expiring within 3/6/12 months | Future assets table |
| **Renewal Report** | Upcoming renewals for domains, SSL, licenses | Future domains/subscriptions table |
| **Usage Report** | Platform usage by user, feature, time | Future analytics table |

### Technology KPI Definitions

| KPI | Formula | Frequency |
|-----|---------|-----------|
| Asset Utilization | (Assigned Assets / Total Assets) × 100 | Monthly |
| License Utilization | (Seats Used / Seats Purchased) × 100 | Monthly |
| SaaS Spend | Sum of all active subscription monthly costs | Monthly |
| Incident Response Time | Avg time from report → first response | Per incident |
| Mean Time to Resolve | Avg time from report → resolution | Per incident |
| System Uptime | (Uptime Hours / Total Hours) × 100 | Monthly |
| Warranty Expiry Risk | Assets expiring within 90 days | Daily |

---

## 11. Administration Reports

### Proposed Reports

| Report | Description | Source Tables |
|--------|-------------|---------------|
| **Visitor Report** | Visitor count, purpose, host, time spent | Future visitors table |
| **Inventory Report** | Stock levels, reorder points, consumption | Future inventory table |
| **Vendor Performance** | Vendor rating, on-time delivery, cost | Future vendors table |
| **Facility Utilization** | Room usage %, classroom occupancy | Future facility tables |
| **Maintenance Report** | Open vs resolved maintenance requests | Future maintenance table |
| **Utility Consumption** | Electricity, water, internet usage by month | Future utilities table |
| **Event Report** | Events held, attendance, budget vs actual | Future events table |
| **Transport Report** | Routes, vehicle usage, fuel consumption | Future transport table |

### Sample: Visitor Report

```
┌─────────────────────────────────────────────────────┐
│  VISITOR REPORT — This Week (Jul 01-07, 2026)       │
├───────────────────┬───────┬──────────┬──────────────┤
│ Day               │ Count │ Purpose   │ Avg Duration │
├───────────────────┼───────┼──────────┼──────────────┤
│ Monday            │   23  │ Meeting   │   45 min     │
│ Tuesday           │   18  │ Interview │   60 min     │
│ Wednesday         │   31  │ Tour      │   30 min     │
│ Thursday          │   15  │ Meeting   │   40 min     │
│ Friday            │   12  │ Meeting   │   35 min     │
│ Saturday          │    8  │ Event     │   90 min     │
│ Sunday            │    2  │ Security  │   10 min     │
├───────────────────┼───────┼──────────┼──────────────┤
│ TOTAL             │  109  │           │   45 min avg │
└───────────────────┴───────┴──────────┴──────────────┘
```

---

## 12. Collections Reports

### Existing Collection Reports

| Report | Implementation | Metrics |
|--------|---------------|---------|
| **Collection Dashboard** | `collectionEngine.getCollectionDashboard` | PDC, installments, payments, plans, commitments |
| **PDC Dashboard** | `collectionEngine.getPDCDashboard` | PDC status counts + totals, due this week, overdue, bounce rate |
| **Collection Center** | `collectionEngine.getCollectionCenter` | Per-lead collection details, fees, balance, health |
| **Collection Summary** | `collectionEngine.getCollectionSummary` | Per-lead collected, outstanding, upcoming, overdue, PDC exposure |

### Proposed Collection Reports

| Report | Description | Source Tables |
|--------|-------------|---------------|
| **Pending Fees Report** | All leads with outstanding, sorted by days outstanding | `collectionEngine.getCollectionCenter` |
| **Recovery Report** | Amount recovered, % recovery by collector, period | `leadPayments`, `users` |
| **Collector Performance** | Cases assigned, collected, recovery rate by collector | `leadPayments`, `leadMaster` |
| **PTP Report** | Commitments made, kept, broken by collector | `payment_commitments` |
| **Collections Funnel** | Invoice → Reminder → PTP → Payment → Closed | Multi-table funnel |
| **Ageing Analysis** | Outstanding by ageing bucket (7-15-30-60-90+) | `payment_installments` |
| **Recovery Rate Report** | Collected / Net Payable by program, branch, counselor | `leadPayments`, `leadMaster` |

### Sample: PTP Report

```
┌─────────────────────────────────────────────────────────────┐
│  PROMISE TO PAY REPORT — Jul 2026                            │
├────────────────────┬───────┬────────┬────────┬──────┬───────┤
│ Collector          │ Active│ Kept   │ Broken │ Kept%│ Amount│
├────────────────────┼───────┼────────┼────────┼──────┼───────┤
│ Rajesh Kumar       │   12  │   8    │   4    │ 66.7%│₹4,80K │
│ Priya Sharma       │   10  │   7    │   3    │ 70.0%│₹3,50K │
│ Amit Singh         │    8  │   4    │   4    │ 50.0%│₹2,40K │
│ Sneha Patel        │   15  │  12    │   3    │ 80.0%│₹6,00K │
│ Vikram Reddy       │    6  │   3    │   3    │ 50.0%│₹1,80K │
├────────────────────┼───────┼────────┼────────┼──────┼───────┤
│ TOTAL              │   51  │  34    │  17    │ 66.7%│₹18,50K│
└────────────────────┴───────┴────────┴────────┴──────┴───────┘
```

### Collection KPI Definitions

| KPI | Formula | Frequency |
|-----|---------|-----------|
| Recovery Rate | (Collected / Net Payable) × 100 | Daily |
| Collection Efficiency | (Collected / (Collected + Outstanding)) × 100 | Daily |
| PTP Kept Rate | (PTP Kept / PTP Made) × 100 | Weekly |
| PDC Clearance Rate | (Cleared / (Cleared + Bounced)) × 100 | Monthly |
| Bounce Rate | (Bounced / (Cleared + Bounced)) × 100 | Monthly |
| Average Days to Recover | Avg days from invoice → payment | Monthly |
| Collector Efficiency | (Recovered Amount / Cases Assigned) × 100 | Weekly |

---

## 13. Marketing Reports

### Proposed Reports

| Report | Description | Source Tables |
|--------|-------------|---------------|
| **Campaign ROI Report** | Spend, leads, conversion, revenue, ROI by campaign | `leadMaster.campaign`, `leadPayments` |
| **Cost Per Lead Report** | CPL by channel, campaign, source | Future campaign spend data |
| **ROAS Report** | Return on ad spend by channel | Future campaign data |
| **Referral Performance** | Referral volume, conversion, reward cost | `leadMaster.referralId`, `users` |
| **Landing Page Report** | Form submissions, conversion by landing page | `leadMaster.utm`, `leadMaster.source` |
| **Event Report** | Events held, registrations, attendance, leads generated | Future events table |
| **Audience Growth** | New leads by source, channel over time | `leadMaster.createdAt`, `leadMaster.source` |
| **Channel Performance** | CPL, conversion, revenue by marketing channel | `leadMaster.channel` |

### Marketing KPI Definitions

| KPI | Formula | Frequency |
|-----|---------|-----------|
| Cost Per Lead (CPL) | Total Spend / Total Leads | Per campaign |
| Cost Per Admission (CPA) | Total Spend / Total Admissions | Per campaign |
| Return on Ad Spend (ROAS) | Revenue / Ad Spend | Per campaign |
| Marketing ROI | (Revenue - Cost) / Cost × 100 | Per campaign |
| Lead-to-Admission Rate | (Admissions / Leads) × 100 | Per source |
| Referral Conversion | (Converted Referrals / Total Referrals) × 100 | Monthly |
| Channel Share | (Leads from Channel / Total Leads) × 100 | Monthly |

---

## 14. Cross Module KPIs

### Organization-Level KPIs

| KPI | Formula | Owner | Existing |
|-----|---------|-------|----------|
| **Total Revenue** | Sum of all verified payments | Finance | ✅ `crmDashboard` |
| **Total Admissions** | Count of converted leads | Sales | ✅ `crmDashboard` |
| **Conversion Rate** | (Converted / (Active + Converted)) × 100 | Sales | ✅ `crmDashboard` |
| **Collection %** | (Collected / Net Payable) × 100 | Collections | ✅ `salesPerformance` |
| **Average Revenue per Student** | Total Revenue / Total Admissions | Finance | Future |
| **Customer Lifetime Value** | Avg revenue per student over lifecycle | Finance | Future |
| **Retention Rate** | (Returning Students / Total Students) × 100 | Academic | Future |
| **Employee Productivity** | (Admissions / Counselor) × Revenue Factor | HR | ✅ `salesPerformance` |
| **Marketing ROI** | (Revenue - Marketing Cost) / Marketing Cost | Marketing | Future |
| **Technology Cost per Student** | Total SaaS Spend / Total Students | Technology | Future |
| **Operational Efficiency** | Revenue / Operating Cost | Admin | Future |

### Department-Level KPIs

| Department | Primary KPIs |
|-----------|-------------|
| **Sales** | Leads assigned, contacted %, conversion %, revenue, follow-up compliance |
| **Marketing** | CPL, ROAS, campaign ROI, lead share by channel |
| **Finance** | Collection %, DSO, discount rate, fee concession % |
| **Collections** | Recovery rate, PTP kept %, PDC clearance %, days to recover |
| **HR** | Headcount, attrition %, absenteeism %, time to hire |
| **Technology** | SaaS spend, uptime, incident resolution time, license utilization |
| **Administration** | Facility utilization, vendor performance, maintenance SLA |
| **Academic** | Enrollment rate, pass %, attendance %, student satisfaction |
| **Communication** | Delivery rate, open rate, reply rate, opt-out rate |

### KPI Registry (Proposed Schema)

```typescript
kpiRegistry: defineTable({
  code: v.string(),              // e.g. "CONVERSION_RATE"
  name: v.string(),              // e.g. "Lead Conversion Rate"
  description: v.string(),       // e.g. "Percentage of active leads that converted"
  category: v.string(),          // "sales" | "finance" | "hr" | "academic" | ...
  formula: v.string(),           // e.g. "(converted / (active + converted)) × 100"
  unit: v.string(),              // "percentage" | "count" | "currency" | "days" | "ratio"
  higherIsBetter: v.boolean(),   // true = green when ↑, false = green when ↓
  target: v.optional(v.number()),
  threshold: v.object({          // Color thresholds
    green: v.number(),           // >= green → good
    yellow: v.number(),          // >= yellow → warning
    red: v.number(),             // < red → critical
  }),
  refreshFrequency: v.string(),  // "realtime" | "hourly" | "daily" | "weekly" | "monthly"
  ownerModule: v.string(),       // Module that owns this KPI definition
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("code", ["code"])
  .index("category", ["category"]);
```

---

## 15. Analytics Engine

### Trend Analysis

| Type | Description | Example |
|------|-------------|---------|
| **Day-over-Day (DoD)** | Compare today vs yesterday | `calcTrend(current, previous)` in `salesPerformance.ts` |
| **Week-over-Week (WoW)** | Compare this week vs last week | `trendWeek` in KPI results |
| **Month-over-Month (MoM)** | Compare this month vs last month | Future |
| **Year-over-Year (YoY)** | Compare this year vs last year | Future |
| **Period-over-Period** | Custom date range comparison | Via date filters |

### Trend Calculation (Existing)

```typescript
// From salesPerformance.ts
function calcTrend(current: number, previous: number) {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return { direction: "up", pct: 100, label: "▲ New" };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return { direction: "up", pct, label: `▲ +${pct}%` };
  if (pct < 0) return { direction: "down", pct: Math.abs(pct), label: `▼ ${Math.abs(pct)}%` };
  return { direction: "flat", pct: 0, label: "◆ 0%" };
}
```

### Comparisons

| Type | Description |
|------|-------------|
| **Period Comparison** | Compare current period vs previous period |
| **Target Comparison** | Compare actual vs target/budget |
| **Benchmark Comparison** | Compare vs industry standard or internal best |
| **Peer Comparison** | Compare branch vs branch, counselor vs counselor |
| **YoY Comparison** | Compare same period last year |

### Forecasting Methods

| Method | Use Case | Data Required |
|--------|----------|---------------|
| **Linear Regression** | Steady growth trends (revenue, admissions) | 12+ months historical data |
| **Moving Average** | Smoothing noisy data (daily calls, daily leads) | 30+ days data |
| **Seasonal Decomposition** | Seasonal patterns (admissions before exam season) | 2+ years data |
| **Exponential Smoothing** | Short-term forecasts with trend | 3+ months data |
| **AI/ML Forecasting** | Complex multi-variable predictions | Historical + external data |

### Seasonality

| Pattern | Module | Example |
|---------|--------|---------|
| **Admission Season** | Sales/Academic | Peak: March-June, Sept-Nov |
| **Fee Collection** | Finance | Peak: April, July, October, January |
| **Exam Season** | Academic | Peak: Feb-March, Oct-Nov |
| **Holiday Effect** | All | Reduced activity: Dec-Jan, May-June |
| **Budget Cycle** | Finance | Annual planning: March |

### Growth Rate Calculations

| Metric | Formula |
|--------|---------|
| **Period Growth** | ((Current - Previous) / Previous) × 100 |
| **CAGR** | ((End Value / Start Value)^(1/Years) - 1) × 100 |
| **MoM Growth** | ((This Month - Last Month) / Last Month) × 100 |
| **Running Annual Total** | Sum of last 12 months of data |

### Variance Analysis

| Variance Type | Description |
|---------------|-------------|
| **Actual vs Budget** | How far from target |
| **Actual vs Last Period** | How much changed |
| **Actual vs Forecast** | How accurate was prediction |
| **Actual vs Industry** | How competitive are we |
| **Favorable vs Unfavorable** | Good variance (↑ revenue) vs Bad (↑ cost) |

### Benchmarking

| Benchmark | Source | Use |
|-----------|--------|-----|
| **Internal Best** | Top-performing branch/counselor | Set targets for others |
| **Historical Average** | Past 12-month average | Identify above/below average |
| **Department Average** | Cross-department comparison | Identify outliers |
| **Goal/Target** | Management-set targets | Track goal achievement |

---

## 16. Visualization Standards

### Standard Visualization Types

| Type | Use Case | Existing Implementation |
|------|----------|------------------------|
| **KPI Card** | Single metric with icon and trend | `StatCard` component (used across all dashboards) |
| **Data Table** | Row-based data with sort, search, pagination | Tables in `SalesPerformanceDashboard.tsx`, `SalesPaymentsDashboard.tsx` |
| **Bar Chart** | Compare values across categories | Via `chart.tsx` (recharts) |
| **Line Chart** | Trend over time | Via `chart.tsx` (recharts) |
| **Pie / Donut Chart** | Distribution of a whole | Via `chart.tsx` (recharts) |
| **Funnel** | Stage-by-stage conversion | Custom funnel in `CrmDashboard.tsx`, `SalesPerformanceDashboard.tsx` |
| **Progress Bar** | % completion toward a goal | Progress bars in `SalesPerformanceDashboard.tsx` (Daily Targets) |
| **Sparkline** | Mini trend inline with KPI card | Via recharts (future) |
| **Timeline** | Chronological activity stream | Timeline in `SalesPerformanceDashboard.tsx` |
| **Heat Map** | Density across two dimensions | Future |
| **Tree Map** | Hierarchical proportional view | Future |
| **Gauge** | Single metric against a target | Future |
| **Geo Map** | Geographic distribution | Future |

### Card Design Standards

```
┌────────────────────────────────────────────┐
│  Title (11px, #5f6368)                     │
│  Value (24px bold, #1a1a2e)               │
│  ▲ +12% vs yesterday (10px, green/red)     │
│  Description (10px, #9aa0a6)              │
│  [Icon in colored circle top-right]        │
└────────────────────────────────────────────┘
```

### Color System

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Dark | `#1a1a2e` | Text, primary buttons |
| Primary Blue | `#1a73e8` | Info, clickable |
| Success Green | `#34a853` | Positive trends, green zone |
| Warning Orange | `#e8710a` | Warning zone |
| Error Red | `#ea4335` | Negative trends, red zone |
| Neutral Gray | `#5f6368` | Secondary text |
| Muted Gray | `#9aa0a6` | Subtle text |
| Border | `#e8eaed` | Card/table borders |
| Background | `#ffffff` | Card backgrounds |
| Row Hover | `#f8f9fa` | Table row hover |

### Chart Configuration

```typescript
// From chart.tsx (existing recharts wrapper)
interface ChartConfig {
  [key: string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
    theme?: Record<string, string>;
  };
}

// Usage pattern
const chartConfig = {
  admissions: { label: "Admissions", color: "#34a853" },
  revenue: { label: "Revenue", color: "#1a73e8" },
  calls: { label: "Calls", color: "#fbbc04" },
} satisfies ChartConfig;
```

### Proposed Chart Components

| Component | Type | Data Shape |
|-----------|------|------------|
| `TrendLineChart` | Line chart | x: date, y: value, series: string |
| `ComparisonBarChart` | Grouped bar | x: category, y: value, group: string |
| `FunnelChart` | Funnel | stages: [{name, count, pct}] |
| `PieChartCard` | Donut | segments: [{name, value, color}] |
| `SparklineWidget` | Mini line | data: number[] |
| `ProgressWithGoal` | Progress bar | current, target, unit |
| `HeatMapGrid` | Heatmap | x: [], y: [], values: number[][] |
| `GaugeIndicator` | Gauge | value, min, max, zones |

---

## 17. Drill Down Rules

### Navigation Hierarchy

```
Organization Level
    │
    ▼
Company Level
    │
    ▼
Branch Level
    │
    ▼
Department Level
    │
    ▼
Team Level
    │
    ▼
Employee Level
```

### Drill-Down Behavior

| Action | Behavior | Route |
|--------|----------|-------|
| Click on pipeline stage count | Navigate to lead database filtered by stage | `/crm/leads?stage=<stage>` |
| Click on counselor name | Navigate to leads assigned to that counselor | `/crm/leads?owner=<userId>` |
| Click on branch KPI | Navigate to branch performance detail | `/crm/sales?branch=<branchId>` |
| Click on lead row | Navigate to lead workspace | `/crm/leads/<leadId>` |
| Click on payment count | Navigate to payment dashboard filtered | `/crm/sales/payments?status=<status>` |
| Click on task count | Navigate to task list filtered | `/tasks?status=<status>` |
| Click on notification count | Navigate to notifications page | `/notifications` |

### Existing Drill-Downs (Codebase Audit)

| Source | Click Action | Navigation |
|--------|-------------|------------|
| `CrmDashboard.tsx` | "Lead Database" button | `/crm/leads` |
| `CrmDashboard.tsx` | "Sales Center" button | `/crm/sales` |
| `CrmDashboard.tsx` | "View All" on approval widget | `/approvals?tab=crm` |
| `SalesPerformanceDashboard.tsx` | Counselor row click | `/crm/leads?owner=<userId>` |
| `SalesPerformanceDashboard.tsx` | Collection buttons | `/crm/sales/collections` |
| `Dashboard.tsx` | Card clicks | `/users`, `/tasks`, `/approvals`, `/notifications` |

### Proposed Deep Drill-Downs

| Level 1 | Level 2 | Level 3 | Level 4 |
|---------|---------|---------|---------|
| Total Revenue (CEO) | Revenue by Branch | Revenue by Counselor | Revenue by Lead |
| Total Admissions | Admissions by Program | Admissions by Source | Lead Detail |
| Conversion Rate | Rate by Branch | Rate by Counselor | Funnel by Stage |
| Pipeline Value | Value by Stage | Value by Source | Expected Close Date |
| Collection % | % by Collector | % by Branch | Promises vs Actual |

---

## 18. Scheduled Reports

### Schedule Frequencies

| Frequency | Use Case | Delivery |
|-----------|----------|----------|
| **Daily** | Operational metrics, yesterday's performance, today's alerts | 7:00 AM |
| **Weekly** | Weekly performance summary, top counselors, collection report | Monday 8:00 AM |
| **Monthly** | Monthly revenue, attrition, branch performance, budget vs actual | 1st of month 9:00 AM |
| **Quarterly** | Executive summary, board report, strategic KPIs | First week of quarter |
| **Yearly** | Annual report, growth metrics, year-end summary | Jan 5th |

### Scheduled Report Definition (Proposed Schema)

```typescript
scheduledReports: defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  dashboardId: v.string(),         // Links to dashboard definition
  format: v.union(
    v.literal("pdf"),
    v.literal("excel"),
    v.literal("csv"),
    v.literal("email_html"),
  ),
  schedule: v.object({
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly"),
    ),
    dayOfWeek: v.optional(v.number()),  // 0=Sun, 1=Mon, etc.
    dayOfMonth: v.optional(v.number()), // 1-31
    time: v.string(),                   // "08:00"
    timezone: v.string(),               // "Asia/Kolkata"
  }),
  recipients: v.array(v.object({
    email: v.string(),
    name: v.string(),
    role: v.string(),
  })),
  filters: v.optional(v.object({
    branchIds: v.optional(v.array(v.string())),
    departmentIds: v.optional(v.array(v.string())),
    dateRange: v.optional(v.union(
      v.literal("last_7_days"),
      v.literal("last_30_days"),
      v.literal("this_month"),
      v.literal("last_month"),
      v.literal("this_quarter"),
      v.literal("this_year"),
    )),
  })),
  lastSentAt: v.optional(v.number()),
  nextRunAt: v.optional(v.number()),
  isActive: v.boolean(),
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("isActive", ["isActive"])
  .index("nextRunAt", ["nextRunAt"])
  .index("createdBy", ["createdBy"]);
```

### Delivery Channels

| Channel | Status | Implementation |
|---------|--------|---------------|
| **In-App Notification** | ✅ Existing | `notifications` table |
| **Email** | 🔄 Future | Via DOC-09 Communication Engine |
| **WhatsApp** | 🔄 Future | Via DOC-09 + WhatsApp template |
| **PDF Download** | 🔄 Future | Server-side PDF generation |
| **Excel/CSV Export** | 🔄 Future | Client-side or server-side generation |

### Scheduled Report Templates

| Template | Frequency | Recipients | Content |
|----------|-----------|------------|---------|
| **Daily Sales Summary** | Daily | Sales managers | Yesterday's leads, calls, admissions, revenue |
| **Weekly Branch Report** | Weekly | Branch managers, COO | Branch KPIs, trends, rankings |
| **Monthly Revenue Report** | Monthly | CEO, Finance | Revenue by source, branch, program |
| **Monthly Collection Report** | Monthly | Collection manager | Recovery %, PTP report, ageing analysis |
| **Quarterly Executive Brief** | Quarterly | CEO, Board | All major KPIs, trends, forecasts |
| **Weekly Counselor Rankings** | Weekly | All counselors | Leaderboard, personal performance |

---

## 19. AI Opportunities

### AI Feature Catalog

| AI Feature | Description | Data Required | Priority |
|------------|-------------|---------------|----------|
| **Revenue Prediction** | Predict next month's revenue based on pipeline + trends | 12+ months historical revenue, pipeline value | P1 |
| **Admission Forecast** | Predict admissions for upcoming season | Historical admissions, lead velocity, seasonality | P1 |
| **Lead Volume Forecast** | Predict incoming lead volume by source/channel | 6+ months lead creation data, campaign spend | P2 |
| **Collection Prediction** | Predict recovery % and identify at-risk accounts | Payment history, ageing, PTP history | P1 |
| **Student Risk Prediction** | Identify students at risk of dropout | Attendance, grades, payment behavior, engagement | P2 |
| **Dropout Prediction** | Predict which leads will not convert | Lead behavior, response time, stage duration | P1 |
| **Employee Attrition** | Predict employees likely to leave | Attendance, performance, tenure, leave pattern | P3 |
| **Operational Insights** | Surface anomalies, bottlenecks, efficiency gaps | Cross-module operational data | P2 |
| **Natural Language Analytics** | Query data using natural language | All KPI definitions + data layer | P3 |
| **Executive AI Assistant** | Proactive insights delivered to CEO dashboard | All KPI data + anomaly detection | P3 |

### AI Data Boundary

```
┌─────────────────────────────────────────────────┐
│            AI DATA ACCESS LAYER                   │
│                                                   │
│  AI Features are permission-aware:                │
│    - CEO/Admin → All data                         │
│    - Manager → Team/Department data               │
│    - Staff → Own data only                        │
│                                                   │
│  AI Training Never Uses:                          │
│    - Private task content                         │
│    - HR disciplinary records                      │
│    - Salary / compensation data                   │
│    - Personally identifiable student info         │
│                                                   │
│  AI Outputs are always:                           │
│    - Explainable (why this prediction?)           │
│    - Auditable (who saw what prediction?)         │
│    - Overridable (human can override AI decision) │
└─────────────────────────────────────────────────┘
```

### AI Integration Points

| Integration | Description | Convex Action |
|-------------|-------------|---------------|
| **Forecast Data Preparation** | Aggregate historical data for model input | Scheduled Convex action |
| **Prediction Storage** | Store AI predictions alongside KPI data | Convex mutation |
| **Anomaly Detection** | Compare actual vs predicted in real-time | Convex query |
| **Natural Language Queries** | Convert NL to KPI query definitions | Convex action with LLM |
| **Automated Report Narration** | Generate executive summary text from data | Convex action with LLM |

---

## 20. Implementation Roadmap

### Phase 1: Core Dashboards (Current — Existing)

**Effort:** ✅ Already Implemented  
**Status:** Live  

| Dashboard | Status | Files |
|-----------|--------|-------|
| Main Dashboard | ✅ Live | `dashboard.ts`, `Dashboard.tsx` |
| CRM Dashboard | ✅ Live | `crmDashboard.ts`, `CrmDashboard.tsx` |
| Sales Performance Dashboard | ✅ Live | `crmSales.ts`, `salesPerformance.ts`, `SalesPerformanceDashboard.tsx` |
| Collection Dashboard | ✅ Live | `collectionEngine.ts`, `CollectionDashboard.tsx` |
| Payment Dashboard | ✅ Live | `SalesPaymentsDashboard.tsx` |

### Phase 2: Module Reports (Weeks 1-3)

**Effort:** 5-8 days  
**Risk:** Low  
**Dependencies:** Finance module, HR module

| Task | Description | Files |
|------|-------------|-------|
| KPI Registry CRUD | Create `kpiRegistry` table + master data UI | `schema.ts`, new page |
| Finance Reports | Outstanding, ageing, cash flow reports | New Convex queries + pages |
| HR Reports | Headcount, attendance, performance summaries | New queries + pages |
| Communication Reports | WhatsApp delivery, notification analytics | `crmWhatsApp.ts`, new queries |
| Academic Reports | Admissions, enrollment, batch reports | New queries + pages |
| Marketing Reports | Campaign ROI, CPL, source analysis | New queries + pages |

### Phase 3: Executive BI (Weeks 3-5)

**Effort:** 5-7 days  
**Risk:** Medium  
**Dependencies:** Phase 2

| Task | Description |
|------|-------------|
| CEO Dashboard enhancements | Revenue trend chart, branch comparison, sparklines, alert panel |
| COO Dashboard | Branch ops, staff utilization, efficiency metrics |
| Principal Dashboard | Academic KPIs, enrollment, faculty metrics |
| Cross-module performance scorecard | Single page with all department KPIs |
| BI drill-down framework | Standardized click-through navigation to entity pages |

### Phase 4: Scheduled Reports (Weeks 5-7)

**Effort:** 4-6 days  
**Risk:** Low  
**Dependencies:** Phase 2, DOC-09 Communication Engine

| Task | Description |
|------|-------------|
| Scheduled report CRUD | Create `scheduledReports` table + UI |
| Cron-based report generation | Convex cron to check schedules, generate reports |
| PDF/Excel generation | Server-side report rendering |
| Email delivery integration | Via DOC-09 or Convex HTTP action |
| In-app report notifications | Notify users when scheduled reports are ready |

### Phase 5: Predictive Analytics (Weeks 7-10)

**Effort:** 8-12 days  
**Risk:** High  
**Dependencies:** 12+ months of historical data

| Task | Description |
|------|-------------|
| Historical data aggregation pipeline | Pre-compute daily/monthly aggregates |
| Revenue forecast model | Linear regression on 12-month revenue |
| Admission forecast model | Seasonal decomposition + trend |
| Collection prediction model | ML-based recovery probability |
| Anomaly detection service | Statistical outlier detection |
| Forecast visualization | Line chart with predicted range |

### Phase 6: AI Dashboards (Weeks 10-14)

**Effort:** 10-15 days  
**Risk:** High  
**Dependencies:** Phase 5, LLM API integration

| Task | Description |
|------|-------------|
| Natural language query interface | Convert text questions to KPI queries |
| Executive AI assistant | Daily briefing, anomaly alerts, recommendations |
| Risk prediction widgets | Student risk, dropout risk, employee attrition |
| Operational insights engine | Bottleneck detection, efficiency recommendations |
| AI-powered report narration | Generate executive summaries from data |

### Priority Matrix

| Feature | Effort | Impact | Value | Phase |
|---------|--------|--------|-------|-------|
| Executive Dashboard enhancements | Medium | High | 📈 | P2-P3 |
| Finance Reports | Medium | High | 📈 | P2 |
| Drill-down framework | Medium | High | 📈 | P3 |
| Scheduled Reports | Medium | Medium | 📊 | P4 |
| Revenue Prediction | High | Very High | 🔮 | P5 |
| Collection Prediction | High | High | 🔮 | P5 |
| NL Analytics | Very High | Very High | 🤖 | P6 |
| AI Executive Assistant | Very High | Very High | 🤖 | P6 |

### Dependency Graph

```
Phase 1 ── Core Dashboards (DONE)
   │
   ▼
Phase 2 ── Module Reports
   │
   ├──► Phase 3 ── Executive BI
   │
   ├──► Phase 4 ── Scheduled Reports ← DOC-09
   │
   ▼
Phase 5 ── Predictive Analytics
   │
   ▼
Phase 6 ── AI Dashboards ← LLM API
```

---

## 21. Golden Rules

| # | Rule |
|---|------|
| 1 | **Every module contributes data.** No module exists outside the reporting layer. |
| 2 | **No duplicate KPIs.** One canonical definition per metric. |
| 3 | **Reports are historical.** They capture a point-in-time snapshot. |
| 4 | **Dashboards are live.** They reflect the current state. |
| 5 | **Analytics explains why.** Trends, comparisons, and drill-downs reveal root causes. |
| 6 | **BI predicts what happens next.** Forecasting turns hindsight into foresight. |
| 7 | **Single source of truth.** All reports pull from the same underlying data. |
| 8 | **Everything measurable.** If it exists in the system, it can be a KPI. |
| 9 | **Everything drillable.** Every number is clickable to its source. |
| 10 | **Everything exportable.** Every report supports PDF / Excel / CSV / Email. |
| 11 | **Permission-aware.** Users only see KPIs for data they can access. |
| 12 | **Trends over snapshots.** A KPI without a trend is just a number. |
| 13 | **Performance before beauty.** Dashboards must load in under 2 seconds. |
| 14 | **AI augments, not replaces.** AI insights are suggestions, not decisions. |
| 15 | **Always auditable.** Every dashboard view and report export is logged. |

---

## Appendix A: Standard KPI Definitions

### Sales KPIs

| Code | Name | Formula | Unit | Higher Is Better |
|------|------|---------|------|------------------|
| `LEADS_ASSIGNED_TODAY` | Leads Assigned Today | Count of active leads created today | Count | ✅ |
| `LEADS_CONTACTED_PCT` | Lead Contact Rate | (Contacted / Assigned) × 100 | Percentage | ✅ |
| `CONVERSION_RATE` | Lead Conversion Rate | (Converted / (Active + Converted)) × 100 | Percentage | ✅ |
| `ADMISSIONS_TODAY` | Admissions Today | Count of leads converted today | Count | ✅ |
| `PIPELINE_VALUE` | Total Pipeline Value | Sum of all active lead standard amounts | Currency | ✅ |
| `AVG_CONVERSION_TIME` | Avg Time to Convert | Average days from lead creation to conversion | Days | ❌ |
| `FOLLOWUP_COMPLIANCE` | Follow-up Compliance | (Completed Followups / Scheduled Followups) × 100 | Percentage | ✅ |
| `DEMO_CONVERSION` | Demo-to-Admission Rate | (Converted after Demo / Total Demos) × 100 | Percentage | ✅ |

### Finance KPIs

| Code | Name | Formula | Unit | Higher Is Better |
|------|------|---------|------|------------------|
| `REVENUE_COLLECTED` | Total Revenue Collected | Sum of all verified payments | Currency | ✅ |
| `REVENUE_PENDING` | Pending Revenue | Sum of all unverified payments | Currency | ❌ |
| `OUTSTANDING_AMOUNT` | Total Outstanding | Sum of (Net Payable - Collected) for all leads | Currency | ❌ |
| `RECOVERY_RATE` | Recovery Rate | (Collected / Net Payable) × 100 | Percentage | ✅ |
| `DISCOUNT_RATE` | Discount Rate | (Total Discount / Gross Fees) × 100 | Percentage | ❌ |
| `AVG_FEE_PER_STUDENT` | Average Fee Per Student | Total Revenue / Total Admissions | Currency | ✅ |

### Operations KPIs

| Code | Name | Formula | Unit | Higher Is Better |
|------|------|---------|------|------------------|
| `ACTIVE_USERS` | Active Users | Count of non-disabled users | Count | ✅ |
| `TOTAL_TASKS` | Total Active Tasks | Count of non-archived tasks | Count | — |
| `OVERDUE_TASKS` | Overdue Tasks | Count of past-due, incomplete tasks | Count | ❌ |
| `PENDING_APPROVALS` | Pending Approvals | Count of approval requests with status "pending" | Count | ❌ |
| `AVG_APPROVAL_TIME` | Avg Approval SLA | Average time (hours) from request → decision | Hours | ❌ |

---

## Appendix B: Dashboard Design Guidelines

### Layout Standards

| Element | Rule |
|---------|------|
| **Page margin** | `p-4 sm:p-6 lg:p-8` |
| **Section spacing** | `space-y-6` between sections |
| **KPI grid** | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3` |
| **2-column layout** | `grid-cols-1 lg:grid-cols-2 gap-4` |
| **3-column layout** | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3` |
| **Card padding** | `p-3.5` or `p-4` |
| **Table header** | `bg-[#f8f9fa] text-[10px] font-semibold uppercase text-[#5f6368]` |
| **Table cell** | `text-[12px] text-[#1a1a2e]` |

### Component Reuse

| Component | Reused In | Lines of Code Saved |
|-----------|-----------|---------------------|
| `StatCard` | `Dashboard.tsx`, `CrmDashboard.tsx`, `CollectionDashboard.tsx`, `SalesPerformanceDashboard.tsx` | ~200 lines each |
| `KpiCard` | `SalesPerformanceDashboard.tsx` | Specialty variant |
| `Badge` (status/priority) | All dashboards | ~50 lines each |
| `Skeleton` (loading) | All dashboards | ~30 lines each |

### Empty State Standards

Every dashboard section must handle:

1. **Loading state** — Skeleton shimmer while data loads
2. **Empty state** — User-friendly message with icon and optional CTA
3. **Error state** — Retry button with error description
4. **Data state** — Normal display

### Responsive Behavior

| Breakpoint | Column Count | Layout |
|-----------|--------------|--------|
| `< 640px` | 1 | Stacked cards, horizontal scroll tables |
| `640px - 1023px` | 2 | 2-column grid, scroll tables |
| `1024px - 1279px` | 3-4 | Full grid, no scroll |
| `1280px+` | 4-6 | Wide layout, side panels |

### Accessibility Standards

| Standard | Requirement |
|----------|-------------|
| Color contrast | All text meets WCAG AA (4.5:1 ratio) |
| Chart color-blindness | Use patterns + labels, not just color |
| Keyboard navigation | All dashboard cards are tabbable |
| Screen reader labels | `aria-label` on all stat cards |
| Focus indicators | Visible focus ring on all interactive elements |

---

## Appendix C: Report Naming Standards

### Report Code Format

```
REPORT-{MODULE}-{NNN}
```

Example: `REPORT-SALES-001`, `REPORT-FINANCE-012`

### Module Prefixes

| Module | Prefix | Example |
|--------|--------|---------|
| Sales | `SALES` | `REPORT-SALES-001` — Lead Funnel |
| Finance | `FIN` | `REPORT-FIN-001` — Outstanding Report |
| HR | `HR` | `REPORT-HR-001` — Headcount |
| Marketing | `MKT` | `REPORT-MKT-001` — Campaign ROI |
| Collections | `COL` | `REPORT-COL-001` — Ageing Analysis |
| Communication | `COMM` | `REPORT-COMM-001` — WhatsApp Delivery |
| Technology | `TECH` | `REPORT-TECH-001` — Asset Register |
| Administration | `ADMIN` | `REPORT-ADMIN-001` — Visitor Report |
| Academic | `ACAD` | `REPORT-ACAD-001` — Enrollment Report |
| Cross-Module | `BI` | `REPORT-BI-001` — Executive Summary |

### Dashboard Code Format

```
DASHBOARD-{ROLE}-{NAME}
```

Example: `DASHBOARD-CEO`, `DASHBOARD-BRANCH-MANAGER`, `DASHBOARD-COLLECTION`

---

## Appendix D: Future AI Reporting Vision

### Phase 6 Capabilities

```
┌─────────────────────────────────────────────────────────────┐
│                    AI REPORTING VISION                        │
│                                                              │
│  "Show me why admissions dropped this quarter"               │
│       │                                                      │
│       ▼                                                      │
│  AI analyzes:                                                │
│    • Lead volume by source (found: Instagram CPL up 40%)     │
│    • Conversion by stage (found: counselling→interested      │
│      drop-off increased 15%)                                 │
│    • Counselor performance (found: 2 counselors below avg)   │
│    • Seasonal patterns (found: typical Q3 dip of 12%)        │
│       │                                                      │
│       ▼                                                      │
│  AI Response:                                                │
│  "Admissions dropped 18% this quarter vs last.               │
│   Key driver: Instagram campaign CPL increased 40%          │
│   while conversion dropped. Recommend: pause Instagram       │
│   campaign and reallocate budget to referrals (+22% ROI).   │
│   Two counselors in Bangalore branch need retraining."      │
│                                                              │
│  [View Report] [Schedule This Analysis] [Share with Team]    │
└─────────────────────────────────────────────────────────────┘
```

### AI Integration Architecture

```
┌──────────────┐    ┌──────────────────┐    ┌───────────────┐
│  User Query   │───▶│  NL Processor    │───▶│  KPI Resolver  │
│  (Text/voice) │    │  (LLM)           │    │  (Query Builder)│
└──────────────┘    └──────────────────┘    └───────┬───────┘
                                                    │
                                                    ▼
┌──────────────┐    ┌──────────────────┐    ┌───────────────┐
│  AI Response  │◀───│  Insight Engine   │◀───│  Data Fetcher  │
│  (Summary)    │    │  (Analysis + Gen) │    │  (Convex Query) │
└──────────────┘    └──────────────────┘    └───────────────┘
```

### AI Model Roadmap

| Model | Data | Accuracy Goal | Timeline |
|-------|------|---------------|----------|
| Revenue Forecast | 12+ months revenue data | ±15% MAE | Phase 5 |
| Admission Forecast | 24+ months + seasonal factors | ±20% MAE | Phase 5 |
| Collection Prediction | Payment history + lead attributes | 85% precision | Phase 5 |
| Student Risk | Attendance + grades + payments | 90% recall | Phase 6 |
| NL Analytics | All KPI definitions + query patterns | 95% correct | Phase 6 |
| Executive Summary | All dashboards + anomaly data | Human-level | Phase 6 |

---

*End of DOC-17 — Reports, Dashboards & Business Intelligence Engine Bible*
