# EEOS Component Standardization Report

**Date:** 2026-07-29  
**Version:** 0.9.0  

---

## Duplicate Component Audit

### Stat/Metric Cards

| Component | Files Using | Status |
|-----------|-------------|--------|
| StatCard (inline in CourseWorkspace) | 1 | Duplicate |
| KpiCard (various dashboards) | 8+ | Duplicate |
| MetricCard (Finance) | 2 | Duplicate |

**Recommendation:** Create shared `StatCard` component in `src/components/ui/stat-card.tsx`

### Table Components

| Component | Files Using | Status |
|-----------|-------------|--------|
| DataTable (shared) | 5+ | ✅ Shared |
| Inline table renders | 10+ | Duplicate |
| Table with sorting (inline) | 3 | Duplicate |

**Recommendation:** Extend DataTable with sorting, filtering, and pagination props

### Empty States

| Component | Files Using | Status |
|-----------|-------------|--------|
| `@/components/ui/empty.tsx` | 1 | Exists but unused |
| Inline empty state divs | 30+ | Every page has its own |

**Recommendation:** Use shared EmptyState component everywhere

### Loading States

| Component | Files Using | Status |
|-----------|-------------|--------|
| PageLoadingFallback | All routes | ✅ Shared |
| FullPageLoading | Boot | ✅ Shared |
| Skeleton (shadcn) | 15+ | ✅ Shared |
| Inline loading spinners | 8+ | Duplicate |

**Recommendation:** Create a shared `LoadingCard` / `LoadingTable` component

---

## Component Library Inventory

### Shared Components (src/components/)

| Category | Components | Status |
|----------|-----------|--------|
| System | CrashScreen, PageLoadingFallback, FullPageLoading, HealthMonitor, RuntimeOverlay, ReportIssueDialog, ProductionRecoveryScreen | ✅ |
| UI (shadcn) | Button, Card, Badge, Tabs, Dialog, etc. | ✅ |
| Error | RouteErrorBoundary, GlobalErrorBoundary | ✅ |
| Debug | DebugPanel | ✅ |
| Layout | AppLayout | ✅ |
| Scheduling | QuickSchedulerProvider, ScheduleWidget, SchedulingPlanner | ✅ |

### Missing Shared Components

| Component | Current Status | Recommendation |
|-----------|---------------|---------------|
| StatCard | 8+ inline implementations | Create shared component |
| EmptyState | 30+ inline implementations | Reuse @/components/ui/empty.tsx |
| LoadingTable | 10+ inline implementations | Create shared skeleton table |
| PermissionGate | 5+ inline role checks | Create shared component |
| SearchToolbar | 12+ inline implementations | Create shared component |
| FilterBar | 8+ inline implementations | Create shared component |
| ConfirmDialog | 6+ inline implementations | Create shared component |

---

## Component Reuse Score

| Criterion | Score |
|-----------|-------|
| Page-level components reuse | 90% |
| Widget-level components reuse | 60% |
| Form-level components reuse | 40% |
| Data display components reuse | 55% |
| **Overall** | **61%** |

---

## Action Items

| Priority | Task | Effort |
|----------|------|--------|
| P1 | Create shared StatCard component | 1h |
| P1 | Create shared ConfirmDialog component | 1h |
| P2 | Replace inline empty states with EmptyState | 4h |
| P2 | Create shared SearchToolbar component | 2h |
| P2 | Create shared FilterBar component | 2h |
| P3 | Migrate all inline stat cards to StatCard | 6h |
| P3 | Create shared LoadingTable skeleton | 1h |
