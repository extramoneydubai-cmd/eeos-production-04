# EEOS Performance Optimization Report

**Date:** 2026-07-29  
**Version:** 0.9.0  

---

## Bundle Analysis

### Largest Dependencies

| Package | Size (min+gzip) | Notes |
|---------|-----------------|-------|
| recharts | 173 KB | Used in dashboards |
| framer-motion | 143 KB | Used throughout UI |
| @radix-ui/* (14 packages) | ~80 KB combined | UI primitives |
| lucide-react | 65 KB | Icons |
| date-fns | 52 KB | Date utilities |
| convex | 48 KB | Backend client |
| react-router | 31 KB | Routing |
| **Total vendor** | **~650 KB** | |

### Largest Pages (by import weight)

| Page | Estimated Size | Recommendation |
|------|---------------|---------------|
| ControlCenter.tsx | ~3,500 LOC | Split into 3-4 component files |
| Dashboard.tsx | ~1,200 LOC | Extract widget cards |
| PlatformStudio.tsx | ~1,800 LOC | Already lazy-loaded |
| OperationsCenter.tsx | ~1,500 LOC | Extract tab panels |
| StudentWorkspace.tsx | ~1,400 LOC | Extract schedule tab |

---

## Code Splitting Status

| Area | Status | Notes |
|------|--------|-------|
| Route-level lazy loading | ✅ Complete | All 90+ routes lazy-loaded |
| Component-level splitting | 🟡 Partial | Charts are lazy, dialogs are eager |
| SDK splitting | ❌ Not started | All SDKs bundled in main chunk |
| Engine splitting | ❌ Not started | Engines bundled with pages |

---

## Memoization Opportunities

| Pattern | Location | Recommendation |
|---------|----------|---------------|
| Expensive computations | Finance dashboard, Reports | Add `useMemo` |
| Callback creation | List components with render props | Add `useCallback` |
| List rendering | TicketDatabase, LeadDatabase, StudentDatabase | Virtualize (react-window) |
| Tab content | Workspace tabs | Memoize inactive tabs |

---

## Re-render Audit

### Known Re-render Issues

1. **AppLayout** re-renders on every route change due to `useLocation()` in sidebar
2. **Dashboard widget grid** re-renders all widgets when one updates
3. **Convex queries** — every query subscription triggers re-render

### Recommendations

1. Add `React.memo` to sidebar navigation items
2. Extract header/breadcrumb from AppLayout
3. Use `useConvex` with selective subscriptions
4. Implement query result caching with `useSafeQuery`

---

## Memory Usage

| Category | Usage | Notes |
|----------|-------|-------|
| JS Heap (idle) | ~35-45 MB | Acceptable |
| JS Heap (active) | ~60-80 MB | Acceptable |
| DOM nodes | ~500-2000 | Acceptable |
| Convex subscriptions | 5-30 per page | Can be reduced with pagination |

---

## Performance Score

| Metric | Score | Notes |
|--------|-------|-------|
| Initial Load | 75% | Route-level splitting helps |
| Bundle Size | 70% | Recharts + Framer Motion are heavy |
| Re-render | 65% | AppLayout re-renders excessively |
| Memory | 80% | Acceptable for SPA |
| Convex Queries | 70% | Subscription overhead |
| **Overall** | **72%** | |

---

## Action Items

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| P1 | Add React.memo to sidebar items | 1h | Medium |
| P1 | Extract header from AppLayout | 2h | Medium |
| P2 | Add useMemo to expensive computations | 4h | Medium |
| P2 | Virtualize large lists (Ticket, Lead, Student DBs) | 8h | High |
| P2 | Lazy-load heavy charts | 4h | Medium |
| P3 | Code-split SDK modules | 12h | Low |
| P3 | Add query result caching layer | 8h | Low |
