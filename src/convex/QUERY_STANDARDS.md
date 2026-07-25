# EEOS Enterprise Query Standards

## Mandatory Standards for All Collection-Returning Queries

### Rule 1: Use `securePaginatedQuery()`

Every query that returns a collection **MUST** use the `securePaginatedQuery()` wrapper from `queryPlatform.ts`.

```ts
// CORRECT — Secure, paginated, visible-scoped
export const list = securePaginatedQuery({
  table: "leadMaster",
  visibility: { category: "lead", module: "crm", requireDiscover: true },
  searchFields: ["firstName", "lastName", "email", "phone"],
  buildIndexQuery: (ctx, args, sec) => (q) =>
    q.withIndex("by_createdAt").order("desc"),
});

// WRONG — No auth, no visibility, no pagination
export const list = query({
  handler: async (ctx) => {
    return ctx.db.query("leadMaster").collect();
  },
});
```

### Rule 2: Never Expose Unrestricted Data

- All queries require a valid `token` parameter
- Unauthenticated requests return empty results immediately
- Scope is applied via `resolveVisibilityScope()` + `filterByVisibility()` — delegates to Visibility Engine
- Never hardcode "CEO sees everything" or "Staff sees own records" — let Visibility Engine decide

### Rule 3: Use Indexed Queries First

Always use `.withIndex()` for the primary query path. Never use `.filter()` as the first operation.

```ts
// CORRECT — Uses index
q.withIndex("by_owner", (iq) => iq.eq("ownerId", ownerId))

// WRONG — Full scan
q.filter((q) => q.eq(q.field("ownerId"), ownerId))
```

### Rule 4: Use Batch Loading

Replace N+1 query patterns with `batchGet()` or the entity-specific batch functions.

```ts
// CORRECT — Batch load
const users = await batchGet(ctx, userIds);
const userMap = new Map(users.filter(Boolean).map((u) => [u._id, u]));

// WRONG — N+1 (one query per user)
for (const id of userIds) {
  const user = await ctx.db.get(id);
}
```

### Rule 5: Always Support Pagination

- Every collection query accepts `paginationOpts`
- Never use `.collect()` for lists that could exceed 100 records
- Response must include `{ items, nextCursor, hasMore }`

### Rule 6: Always Support Search

- Every collection query accepts `search: v.optional(v.string())`
- Search text is matched against configured `searchFields`
- Use `applyStandardFilters()` for consistent search/filter behavior

### Rule 7: Always Support Filters

Accept at minimum:
- `status` — status filter
- `dateFrom` / `dateTo` — date range
- `organizationId`, `companyId`, `branchId`, `departmentId` — scope filters
- `ownerId` — ownership filter

### Rule 8: Always Support Sorting

Accept `sortField` and `sortOrder` parameters. Default to `by_createdAt` descending.

### Rule 9: Respect Visibility Engine

- Check `requireDiscover` for category-based access via `resolveVisibilityScope()`
- Apply `filterByVisibility()` for record-level scope after pagination
- Apply `filterFields()` + `applyFieldMasking()` when returning sensitive data
- Apply `filterSections()` for section-level visibility in detail views

### Rule 10: Respect Permission Engine

Never hardcode role-based rules like "CEO can delete" or "Staff can only view".

Delegate ALL access decisions to the existing Visibility Engine permissions:

- `canDiscover()` — category-level discover permission
- `canOpen()` — record-level open permission
- `canPerformAction()` — action-level permission (create, read, update, delete, export, print)
- `filterFields()` — field-level visibility and masking
- `filterSections()` — section-level visibility
- `evaluateVisibility()` — full visibility evaluation

### Rule 11: Dashboard Queries Must Use Providers

Dashboard Widget **MUST** use `dashboardProviders.ts` provider functions.
Dashboard Studio must **NEVER** directly query business tables.

```ts
// CORRECT — Uses provider
const data = await getDashboardData(ctx, { token, providerIds: ["crm"] });

// WRONG — Direct table query
const leads = await ctx.db.query("leadMaster").collect();
```

### Rule 12: Use `searchEntity()` for All Search

All entity search must use the single `searchEntity()` function. Do NOT create entity-specific search functions.

```ts
// CORRECT — Single generic function
searchEntity(ctx, { token, table: "leadMaster", searchFields: [...], ... });

// WRONG — Entity-specific
searchLeads(ctx, { token, ... });  // Never create this
searchStudents(ctx, { token, ... });  // Never create this
```

---

## Migration Checklist

When migrating an existing query to the secure standard:

- [ ] Replace `query({...})` with `securePaginatedQuery({...})`
- [ ] Add `token: v.string()` to args
- [ ] Set `visibility.category` for Visibility Engine discover checks
- [ ] Set `visibility.module` for record-level scope filtering
- [ ] Set `searchFields` for text search
- [ ] Move index building to `buildIndexQuery`
- [ ] Move business-specific filters to `postFilter`
- [ ] Move enrichment to `enrich` callback
- [ ] Remove manual authentication code
- [ ] Remove manual scope/role filtering (delegate to Visibility Engine)
- [ ] Remove manual pagination code
- [ ] Verify TypeScript compiles cleanly
- [ ] Verify no broken imports in dependent files
