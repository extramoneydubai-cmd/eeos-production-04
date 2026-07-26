# Enterprise Analytics Platform

**Version:** 1.0.0  
**Status:** ✅ Live  
**Route:** `/analytics`  
**Framework:** Recharts + React + Convex

---

## Architecture

```
Dashboard Providers (per module)
          ↓
   Analytics Registry
          ↓
    Widget Registry
          ↓
 AnalyticsDashboard
          ↓
   Drill-down
          ↓
    Workspace
```

### Data Flow

1. Every EEOS business module publishes analytics through `dashboardProviders.ts`
2. `analyticsEngine.ts` aggregates provider data into a unified API
3. `AnalyticsDashboard.tsx` consumes the aggregated data via Convex queries
4. Charts render with Recharts (Bar, Pie, Donut, Line, Area)
5. Clicking a KPI or chart drills down to the corresponding module workspace

### Key Backend APIs

| API | Purpose |
|-----|---------|
| `dashboardProviders.getDashboardData` | Aggregated KPI/chart data from all modules |
| `analyticsEngine.getModuleDashboardData` | Module-specific analytics with totals/stats |
| `analyticsEngine.getKpiDashboardCards` | KPI definitions with current values and targets |
| `reportEngine.listReportDefinitions` | Available report configurations |
| `reportEngine.executeReport` | Run a report |
| `reportExportEngine.exportReport` | Export to CSV/Excel/PDF/JSON |
| `reportExportEngine.getExportHistory` | Past export records |
| `reportScheduleEngine.listSchedules` | Scheduled report configurations |
| `eventSdk.getRecentEvents` | Platform activity stream |

---

## Components

### Analytics Components (`src/components/analytics/`)

| Component | Purpose |
|-----------|---------|
| `KpiCard` | Compact KPI metric card with label, value, subtitle, trend indicator |
| `AnalyticsFilters` | Global filter bar — module selector, period presets, company/branch filters |
| `DistributionCard` | Horizontal bar distribution chart |
| `TopListCard` | Ranked list with numbered items (1-2-3) |
| `ActivityStream` | Live event feed with icons, timestamps, and click-to-navigate |
| `SectionCard` | Section wrapper with header, description, and content area |

### Inline Components (in `AnalyticsDashboard.tsx`)

| Component | Purpose |
|-----------|---------|
| `ExecutiveKpiCard` | Large KPI card with sparkline area chart background, trend %, drill-down |
| `ModuleAnalyticsSection` | Per-module section with KPI grid + inline charts + quick stats |
| `ChartWidget` | Rechart wrapper — bar, pie, donut, line, area chart types |
| `DistributionGrid` | Heatmap intensity grid for distribution data |
| `TopPerformersSection` | Ranked list with podium colors (gold/silver/bronze) |
| `TrendAnalysisCard` | Compact trend line with growth % calculation |
| `EmptyAnalytics` | Empty state with icon, message, and CTA button |

---

## Tabs

| Tab | Content |
|-----|---------|
| **Overview** | Cross-module KPI sections with inline charts and quick stats |
| **Charts & Trends** | Full Recharts visualizations + trend analysis with growth % |
| **Distribution** | Heatmap-style distribution grids + top performers |
| **Activity** | Live platform activity stream from eventSdk |
| **Reports** | Report library with execute, export (CSV/Excel/PDF/JSON), history |
| **KPIs** | KPI definitions grouped by module with target tracking |
| **Schedules** | Automated report schedule management |

---

## Global Filters

All filters are optional and per-user session:

- **Module:** Filter by business module (CRM, Finance, Students, etc.)
- **Period:** Today, This Week, This Month, This Quarter, This Year, Custom
- **Company:** Filter by organization company
- **Branch:** Filter by branch

---

## Chart Types

| Chart | Recharts Component | Use Case |
|-------|-------------------|----------|
| Bar | `<BarChart>` | Comparison across categories |
| Pie | `<PieChart>` | Distribution / proportions |
| Donut | `<PieChart innerRadius>` | Distribution with total in center |
| Line | `<LineChart>` | Trends over time |
| Area | `<AreaChart>` | Trends with gradient fill |
| Sparkline | `<AreaChart>` (small) | Inline trend preview in KPI cards |

---

## Drill-Down Paths

Every KPI card and chart supports click-to-navigate:

| Module | Route |
|--------|-------|
| CRM | `/crm` |
| Finance | `/finance` |
| Students | `/students` |
| HR | `/employees` |
| Examinations | `/examinations` |
| LMS | `/lms` |
| Inventory | `/procurement/inventory` |
| Procurement | `/procurement` |

---

## Report Export Formats

| Format | Description |
|--------|-------------|
| CSV | Comma-separated values |
| Excel | XLSX spreadsheet |
| PDF | Formatted document |
| JSON | Raw data export |

---

## Future-Readiness

- **AI Insights:** Executive summary cards and smart recommendations framework ready
- **Dashboard Builder:** Widget registry and drag-and-drop layout infrastructure ready
- **Custom Dashboards:** Per-user, per-role, per-company dashboard layouts planned
- **Forecasts:** Trend analysis placeholder ready for ML integration

---

## Integration Requirements

Every EEOS business module must:

1. Register a dashboard provider in `dashboardProviders.ts`
2. Expose KPIs, charts, timeline, and quickStats
3. Use `withEventPipeline()` for automatic analytics events
4. All module routes are registered for drill-down navigation

---

## Performance

- Lazy-loaded Recharts imports
- `React.memo` on all chart components
- `useMemo` for derived data
- Skeleton loading states during data fetch
- Suspense-ready architecture
