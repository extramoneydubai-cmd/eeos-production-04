# EEOS Recovery Plan

**Generated:** 2026-07-29  
**Based on:** Full project audit, route verification, technical debt assessment  

---

## Phase 1 — Immediate Fixes (1-2 days)

| # | Task | Type | File(s) | Est. Time |
|---|------|------|---------|-----------|
| 1 | Remove duplicate "Tools" header in sidebar | Bug | `AppLayout.tsx` | 5 min |
| 2 | Delete leftover automation scripts | Cleanup | `update-sales-hr-crm.mjs`, `fix-sales-backend.cjs` | 2 min |
| 3 | Remove `src/tmp/` directory | Cleanup | `tmp/` dir | 2 min |
| 4 | Set package.json version to 1.0.0-beta | Config | `package.json` | 1 min |
| 5 | Remove unused `next-themes` dependency | Dep cleanup | `package.json` | 5 min |
| 6 | Remove `typeof window` checks — use `useSyncExternalStore` where appropriate | Refactor | Multiple files | 2-3 hours |

**Total Phase 1:** ~3 hours

---

## Phase 2 — Testing Infrastructure (3-5 days)

| # | Task | Est. Time |
|---|------|-----------|
| 1 | Install vitest + React testing library | 30 min |
| 2 | Add Convex test helpers | 1 hour |
| 3 | Write smoke tests for all routes (loads without crashing) | 2 hours |
| 4 | Write auth flow tests (login, logout, protected routes) | 2 hours |
| 5 | Write tests for top 5 critical components (RouteErrorBoundary, AppLayout, Login) | 3 hours |
| 6 | Add typecheck to pre-commit hook | 30 min |

**Total Phase 2:** ~1 day

---

## Phase 3 — CI/CD Pipeline (2-3 days)

| # | Task | Est. Time |
|---|------|-----------|
| 1 | Create `.github/workflows/ci.yml` — typecheck + test + build | 2 hours |
| 2 | Create `.github/workflows/deploy-preview.yml` | 1 hour |
| 3 | Create `.github/workflows/deploy-production.yml` | 1 hour |
| 4 | Add environment validation step to build pipeline | 1 hour |

**Total Phase 3:** ~1 day

---

## Phase 4 — Engine Persistence (3-5 days)

| # | Task | Est. Time |
|---|------|-----------|
| 1 | Migrate SchedulingSLA from in-memory Map to Convex table | 4 hours |
| 2 | Migrate SchedulingAutomation from in-memory Map to Convex table | 4 hours |
| 3 | Migrate EscalationEngine from in-memory Map to Convex table | 2 hours |
| 4 | Migrate KnowledgeBaseEngine from in-memory Map to Convex table | 3 hours |
| 5 | Migrate SecurityEngine audit/events from in-memory + localStorage to Convex | 4 hours |
| 6 | Migrate RiskEngine from in-memory Map to Convex | 2 hours |

**Total Phase 4:** ~3 days

---

## Phase 5 — Component Optimization (2-3 days)

| # | Task | Est. Time |
|---|------|-----------|
| 1 | Extract sidebar navigation items from AppLayout into a separate config | 2 hours |
| 2 | Split main.tsx into smaller modules (AppBoot, RouteSyncer, RoutesConfig) | 3 hours |
| 3 | Audit all large components (>600 lines) and identify split points | 1 hour |
| 4 | Extract shared mock data into a single mock data layer | 2 hours |

**Total Phase 5:** ~1 day

---

## Phase 6 — Production Hardening (3-5 days)

| # | Task | Est. Time |
|---|------|-----------|
| 1 | Add Content Security Policy headers | 1 hour |
| 2 | Add rate limiting on auth endpoints | 2 hours |
| 3 | Add proper error monitoring (console → dedicated log service) | 3 hours |
| 4 | Add build version display in footer/settings | 1 hour |
| 5 | Add startup health checks (Convex connectivity, API availability) | 2 hours |
| 6 | Remove mock data from production routes | 2 hours |

**Total Phase 6:** ~2 days

---

## Total Recovery Effort

| Phase | Effort | Impact |
|-------|--------|--------|
| Phase 1 — Immediate | 3 hours | Quick wins, visible cleanup |
| Phase 2 — Testing | 1 day | Foundation for quality |
| Phase 3 — CI/CD | 1 day | Automated safety net |
| Phase 4 — Persistence | 3 days | Production data safety |
| Phase 5 — Refactoring | 1 day | Maintainability |
| Phase 6 — Hardening | 2 days | Production readiness |
| **Total** | **~8-10 days** | |

---

## Rollback Strategy

If any Phase introduces regressions:
1. All changes are small and scoped to specific files
2. TypeScript check (`bun tsc --noEmit`) catches type errors
3. Manual preview verification of Login → Dashboard → Critical modules
4. Phase 1 fixes are trivially revertible (single file changes)
