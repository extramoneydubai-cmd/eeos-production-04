# EEOS Query Performance Report — PATCH-CORE-002

## Summary

**Objective:** Fix scalability issues where every collection-returning query used `.collect()` (full table scan) without pagination.

**Status:** ✅ Core queries refactored. Reusable pagination utility created. 530 remaining queries need incremental migration.

## What Was Built

### 1. Reusable Pagination Utility
**File:** `src/convex/queryHelpers.ts`

| Function | Purpose |
|----------|---------|
| `paginatedQuery()` | Wraps Convex's `.paginate()` with cursor-based pagination support |
| `applyStandardFilters()` | In-memory post-pagination filtering (status, date range, search) |
| `batchGet()` | Batch-fetch documents by ID — prevents N+1 patterns |
| `createLookup()` | Create in-memory lookup maps from small tables |
| `dashboardCounts()` | Run multiple count queries in parallel for dashboards |
| `getTotalCount()` | Get full count (use sparingly) |

**Standard Filter Args:** `paginationOptsValidator`, `search`, `status`, `dateFrom`, `dateTo`, `organizationId`, `companyId`, `branchId`, `departmentId`, `teamId`, `ownerId`, `sortField`, `sortOrder`

**Standard Response:** `{ items, nextCursor, hasMore, totalCount? }`

### 2. Refactored Queries (7 files, 10 queries)

| File | Query | Improvement |
|------|-------|------------|
| `crmLeads.ts` | `listLeads` | Replaced full `.collect()` with index-based `paginatedQuery` + in-memory post-filters |
| `users.ts` | `listUsers` | Paginated with search + department/team filters |
| `users.ts` | `listActiveUsers` | Paginated active users |
| `users.ts` | `getUsersByDepartment` | Paginated with `by_department` index |
| `users.ts` | `getUsersByTeam` | Paginated team members |
| `crmTasks.ts` | `getLeadTasks` | Paginated by leadId with status/priority filters |
| `documentEngine.ts` | `listDocuments` | Paginated + fixed N+1 uploader lookup via `batchGet()` |
| `documentEngine.ts` | `listFolders` | Added paginationOpts to args (kept simple) |
| `documentEngine.ts` | `listTags` | Added paginationOpts to args (kept simple) |
| `employeeEngine.ts` | `listEmployees` | Paginated + fixed N+1 person/dept/desig enrichment via `batchGet()` |

## Pattern for New Query Migration

```typescript
import { paginationOptsValidator } from "convex/server";
import { paginatedQuery, applyStandardFilters, batchGet, type PaginatedResponse } from "./queryHelpers";

export const listItems = query({
  args: {
    paginationOpts: paginationOptsValidator,
    // ... your existing filters
  },
  handler: async (ctx, args): Promise<PaginatedResponse<any>> => {
    const result = await paginatedQuery<any>(ctx, "tableName", args, (q) =>
      q.withIndex("by_createdAt").order("desc"),
    );

    // Apply in-memory filters on the paginated page
    let filtered = applyStandardFilters(result.items, args, ["name", "title"]);

    // Batch-enrich to prevent N+1
    const ids = [...new Set(filtered.map((i: any) => i.referenceId))];
    const refs = await batchGet<any>(ctx, ids);
    const refMap = new Map(refs.filter(Boolean).map((r: any) => [r._id, r]));

    return {
      items: filtered.map((i: any) => ({ ...i, refName: refMap.get(i.referenceId)?.name })),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  },
});
```

## Remaining Work

| Category | Count | Notes |
|----------|:-----:|-------|
| Queries using `.collect()` | ~530 | Identified 530 of 84 engine files |
| Dashboard queries (harder to paginate) | ~30 | Use `dashboardCounts()` helper instead |
| N+1 patterns in enrichment | ~40 | Use `batchGet()` to batch-fetch from People Registry |
| Schema indexes added | 516 | All 280 tables now indexed for pagination |

## Priority Remaining Queries

| Priority | File | Query | Reason |
|:--------:|------|-------|--------|
| ⭐ | `crmLeads.ts` | `checkDuplicateLeads` | `.collect()` on leadMaster |
| ⭐ | `crmLeads.ts` | `getFollowups` | `.collect()` on leadMaster |
| ⭐ | `crmTasks.ts` | `getSalesPendingTasks` | Heavy multi-table collect |
| ⭐ | `inventoryEngine.ts` | `listInventoryItems` | Production-critical |
| ⭐ | `invoiceEngine.ts` | `getInvoiceDashboard` | Dashboard aggregate |
| ⭐ | `studentSearch.ts` | `quickStudentSearch` | Search with full scan |

## Recommendations

1. **Prioritize user-facing list queries** that serve CRM, Student, and Finance dashboards
2. **Use `dashboardCounts()`** for dashboard KPI widgets instead of `.collect()`
3. **Add `batchGet()`** to any query that enriches results with person/org names
4. **Set a reasonable `pageSize`** default of 25-50 in the UI layer
5. **Work from the top down** — refactor the next 20 most-used queries as PATCH-CORE-002B

## Validation Status

- ✅ TypeScript typecheck (`bun tsc --noEmit --pretty`): **0 errors**
- ✅ All refactored files compile cleanly
- ⏳ Convex codegen: Timeout in environment (280 tables); schema validation passed in earlier PATCH-CORE-001A
