# EEOS Technical Debt Report

**Generated:** 2026-07-29  

---

## 1. Code Quality Issues

### 1.1 Leftover Utility Scripts

| File | Type | Action |
|------|------|--------|
| `/update-sales-hr-crm.mjs` | One-time migration script | Should be removed |
| `/fix-sales-backend.cjs` | One-time fix script | Should be removed |

### 1.2 Temp Directory

| Path | Contents | Action |
|------|----------|--------|
| `src/tmp/` | `defined_tables_crm.txt`, `defined_tables.txt`, `query_tables.txt`, `schema_tables.txt` | Should be removed |

### 1.3 Duplicate Sidebar Section

**Location:** `src/components/AppLayout.tsx` lines 316-365 and 361-365  
**Issue:** The "Tools" section header `<div>` is rendered twice  
**Impact:** Minor visual duplication, no functional impact  

### 1.4 Package.json Version

**File:** `/package.json`  
**Current:** `"version": "0.0.0"`  
**Recommendation:** Set to `"1.0.0-beta"` or actual version  

### 1.5 Unused/Questionable Dependencies

| Dependency | Reason to Question | Action |
|------------|-------------------|--------|
| `next-themes` | Caused prior runtime errors (useContext null). Dark mode disabled in config. | Consider removing |
| `preact` | Only used by `@auth/core` as a peer dependency | Bundled implicitly, not a concern |
| `adm-zip` | Package for ZIP handling | May be used, verify |
| `octokit` | GitHub API client | May be used for GitHub integration |
| `universal-github-app-jwt` | GitHub JWT auth | Used with octokit |

---

## 2. Architecture Concerns

### 2.1 Component Size

Estimated large components (>600 lines that could benefit from splitting):

| File | Est. Lines | Concern |
|------|-----------|---------|
| `src/main.tsx` | ~400+ | Very large due to all lazy imports + AppBoot + RouteSyncer |
| `src/components/AppLayout.tsx` | ~600 | Sidebar + header + nav items all in one component |
| `src/pages/PlatformStudio.tsx` | ~500+ | 14-tab developer intelligence dashboard |
| `src/pages/OperationsCenter.tsx` | ~500+ | Multiple dashboard sections |
| `src/pages/ControlCenter.tsx` | ~400+ | Executive dashboard + admin controls |

### 2.2 In-Memory Engine State

Some engines use in-memory Maps instead of Convex persistence:

| Engine | State Location | Risk |
|--------|---------------|------|
| `SchedulingSLA` | In-memory Map | Lost on page refresh |
| `SchedulingAutomation` | In-memory Map | Lost on page refresh |
| `EscalationEngine` | In-memory Map | Lost on page refresh |
| `KnowledgeBaseEngine` | In-memory Map | Lost on page refresh |
| `SecurityEngine` | In-memory + localStorage | Partially persistent |
| `RiskEngine` | In-memory Map | Lost on page refresh |

**Recommendation:** These should be backed by Convex tables for production.

### 2.3 Demo/Hardcoded Values

| Location | Value | Issue |
|----------|-------|-------|
| `Login.tsx` (approx) | `local_ceo` | Hardcoded demo user ID |
| Dashboard pages | Mock data arrays | Many pages use static/mock data instead of live Convex queries |

### 2.4 Circular Import Risk

No circular imports detected by TypeScript. However, some platform engines import each other:

```
SecurityEngine ← RiskEngine ← (SecurityEngine callbacks)
ObservabilityEngine ← RuntimeSupervisor ← multiple monitors
```

These are not circular, but create tight coupling.

---

## 3. Testing Debt

| Area | Status |
|------|--------|
| Unit tests | ❌ None |
| Integration tests | ❌ None |
| E2E tests | ❌ None |
| Test framework | Not configured |
| Test directory | Not found |

---

## 4. CI/CD Debt

| Area | Status |
|------|--------|
| GitHub Actions | ❌ Not configured |
| Automated typecheck | ❌ Not configured |
| Automated build | ❌ Not configured |
| Automated deploy | ❌ Not configured |
| Preview deployments | ❌ Not configured |

---

## 5. Performance Debt

| Area | Finding |
|------|---------|
| Bundle size | 401MB node_modules — large, but tree-shaken at build time |
| Code splitting | ✅ All routes lazy-loaded |
| Duplicate imports | Not detected (TypeScript clean) |
| Unused exports | Not analyzed (no tree-shaking tool run) |
| Heavy libraries | Framer Motion, Recharts, d3 (victory vendor) — expected for enterprise app |

---

## 6. Documentation Debt

| Area | Status |
|------|--------|
| API documentation | ✅ docs/ directory has extensive coverage |
| Architecture docs | ✅ Multiple architecture docs exist |
| Component documentation | ❌ No Storybook or component docs |
| Code comments | Mixed — some files well-documented, others minimal |
| README.md | ✅ Exists but minimal |

---

## 7. Security Debt

| Area | Status |
|------|--------|
| CSRF protection | ✅ Handled by Convex |
| XSS protection | ✅ React's built-in escaping |
| Auth tokens | ✅ Convex auth handles this |
| API key management | ⚡ SecurityEngine has API key manager (in-memory only) |
| Audit logging | ⚡ SecurityEngine has audit system (in-memory only) |
| Rate limiting | ❌ Not implemented |
| Input validation | ⚡ Zod available but not consistently used on frontend |
| Content Security Policy | ❌ Not configured |

---

## 8. Summary

| Category | Items | Priority |
|----------|-------|----------|
| **High** | Add test suite, CI/CD pipeline, persist engines to Convex | P1 |
| **Medium** | Remove temp scripts, fix duplicate "Tools" header, set proper version | P2 |
| **Low** | Clean up unused dependencies, audit mock data, add CSP headers | P3 |

---

**Estimated effort to clear all debt:** 3-4 weeks for a single developer
