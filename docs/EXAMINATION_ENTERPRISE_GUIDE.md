# EEOS Examination Enterprise Guide

## Overview

The Examination Engine provides enterprise exam management integrated with the EEOS platform.

## Architecture

```
Examination Engine (examEngine.ts)
├── Exam Templates
├── Exam Sessions
├── Subjects & Timetable
├── Hall Allocation
├── Marks Entry & Verification
├── Results & Report Cards
├── Grade Rules
├── Incidents
├── Revaluation & Supplementary
├── Promotion Engine
└── Analytics

Integrations:
├── People Registry (students)
├── Academic (courses, batches, subjects)
├── Communication (notifications)
├── Dashboard Providers
├── Query Platform
├── Event Pipeline
└── SDK (timelineSdk, auditSdk)
```

## Routes

| Route | Page | Description |
|-------|------|-------------|
| `/examinations` | ExamDashboard | Executive dashboard with KPIs, sessions, templates |
| `/examinations/:sessionId` | ExamSessionWorkspace | Session detail with 7 tabs |

## ExamSessionWorkspace Tabs

| Tab | Description |
|-----|-------------|
| **Overview** | 6 KPI stat cards, session details, workflow actions |
| **Subjects** | Subject list with marks/pass config |
| **Timetable** | Date/time schedule per subject |
| **Marks** | Marks entry dashboard with present/absent stats |
| **Results** | Divisions, subject pass %, calculate/publish results |
| **Incidents** | Incident stats and list |
| **Timeline** | Full session event history |

## Backend APIs

### Exam Sessions
- `examEngine.getExamDashboardStats` — KPI dashboard
- `examEngine.listExamSessions` — Filterable session list
- `examEngine.getExamSessionDetail` — Full detail with subjects, timetable, marks, results, timeline
- `examEngine.createExamSession`, `examEngine.updateExamSessionStatus`

### Marks
- `marksEngine.listExamMarks`, `marksEngine.enterMarks`
- `marksEngine.verifyMarks`, `marksEngine.moderateMarks`

### Results
- `resultEngine.listExamResults`, `resultEngine.getResultStats`
- `resultEngine.calculateResults`, `resultEngine.publishResults`
- `resultEngine.getTopPerformers`, `resultEngine.getStudentResultCard`

### Analytics
- `examEnterpriseAnalytics.getExamKPIs`
- `examEnterpriseAnalytics.getSubjectPerformanceAnalytics`
- `examEnterpriseAnalytics.getGradeDistribution`
- `examEnterpriseAnalytics.getTrendAnalysis`

### Incidents
- `examIncidentEngine.listIncidents`, `examIncidentEngine.reportIncident`

### Promotions
- `promotionEngine.listPromotions`, `promotionEngine.bulkPromote`

## UI Coverage

| Feature | Status |
|---------|--------|
| Exam Dashboard | ✅ Complete |
| Exam Session Workspace | ✅ New |
| Marks Entry View | ✅ Within Workspace |
| Results & Analytics | ✅ Within Workspace |
| Incidents | ✅ Within Workspace |
| Timeline | ✅ Within Workspace |
| Question Paper UI | 🔶 Planned |
| Promotion UI | 🔶 Planned |
| Report Cards | 🔶 Planned |
| Mobile Ready | 🔶 APIs exist |
