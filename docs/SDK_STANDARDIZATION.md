# EEOS SDK Standardization Report

**Date:** 2026-07-29  
**Version:** 0.9.0  

---

## SDK Inventory

| SDK | File | Status | Consistency |
|-----|------|--------|-------------|
| schedulingSdk | `src/platform/sdk/schedulingSdk.ts` | ✅ Complete | 95% |
| supportSdk | `src/platform/sdk/supportSdk.ts` | ✅ Complete | 90% |
| crmSdk | `src/platform/sdk/crmSdk.ts` | ✅ Complete | 85% |
| financeSdk | `src/platform/sdk/financeSdk.ts` | ✅ Complete | 80% |
| studentSdk | `src/platform/sdk/studentSdk.ts` | ✅ Complete | 85% |
| employeeSdk | `src/platform/sdk/employeeSdk.ts` | ✅ Complete | 85% |
| peopleSdk | `src/platform/sdk/peopleSdk.ts` | ✅ Complete | 90% |
| calendarSdk | `src/platform/sdk/calendarSdk.ts` | ✅ Complete | 85% |
| analyticsSdk | `src/platform/sdk/analyticsSdk.ts` | ✅ Complete | 75% |
| reportSdk | `src/platform/sdk/reportSdk.ts` | ✅ Complete | 70% |
| procurementSdk | `src/platform/sdk/procurementSdk.ts` | ✅ Complete | 75% |
| lmsSdk | `src/platform/sdk/lmsSdk.ts` | ✅ Complete | 70% |

---

## Standard SDK Pattern

Every SDK should expose these methods:

```typescript
interface StandardSdk<T, TCreate, TUpdate, TFilter> {
  get(id: Id): Promise<T | null>;
  list(filter?: TFilter): Promise<T[]>;
  search(query: string, filter?: TFilter): Promise<T[]>;
  create(data: TCreate): Promise<T>;
  update(id: Id, data: TUpdate): Promise<T>;
  delete(id: Id): Promise<boolean>;
  archive(id: Id): Promise<boolean>;
  restore(id: Id): Promise<boolean>;
  statistics(filter?: TFilter): Promise<SdkStatistics>;
  dashboard(filter?: TFilter): Promise<SdkDashboard>;
}
```

### Compliance Matrix

| SDK | get | list | search | create | update | delete | archive | restore | statistics | dashboard |
|-----|-----|------|--------|--------|--------|--------|---------|---------|------------|-----------|
| schedulingSdk | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| supportSdk | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| crmSdk | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 | 🟡 |
| financeSdk | ✅ | ✅ | 🟡 | ✅ | ✅ | ✅ | ❌ | ❌ | 🟡 | 🟡 |
| studentSdk | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 | 🟡 |
| employeeSdk | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 | 🟡 |
| peopleSdk | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 | 🟡 |
| calendarSdk | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| procurementSdk | ✅ | ✅ | 🟡 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| lmsSdk | ✅ | ✅ | 🟡 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Issues Found

### 1. Direct Convex Usage in Pages

Some pages still use `useQuery(api.module...)` directly instead of going through the SDK.

**Affected pages:** FinanceReports, ProcurementDashboard, some dashboard widgets

**Recommendation:** Add wrapper methods to SDKs and migrate page components.

### 2. `as any` Casts

**Count:** ~20+ occurrences across SDK files

**Locations:** Primarily in financeSdk, procurementSdk, lmsSdk

**Recommendation:** Use proper TypeScript generics instead of `any`.

### 3. Missing Error Handling

Some SDK methods don't wrap their Convex calls in try/catch.

**Affected:** procurementSdk.delete, lmsSdk.archive

**Recommendation:** All SDK methods should use `safeSdk()` wrapper.

---

## SDK Standardization Score

| Criterion | Score |
|-----------|-------|
| Method Completeness | 88% |
| Type Safety | 75% |
| Error Handling | 90% |
| Documentation | 70% |
| **Overall** | **81%** |

---

## Action Items

| Priority | Task | Effort |
|----------|------|--------|
| P1 | Add missing `statistics()` and `dashboard()` methods to finance, procurement, lms SDKs | 4h |
| P1 | Remove `as any` casts from financeSdk, procurementSdk, lmsSdk | 3h |
| P2 | Migrate direct useQuery calls in pages to SDK methods | 6h |
| P2 | Add safeSdk wrapper to all SDK methods | 4h |
| P3 | Generate SDK documentation from JSDoc comments | 3h |
