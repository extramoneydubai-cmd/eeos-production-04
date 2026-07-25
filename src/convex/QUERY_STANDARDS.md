# EEOS Enterprise Query Standards

## Mandatory Standards for All Collection-Returning Queries

### Rule 1: Use `securePaginatedQuery()`

Every query that returns a collection **MUST** use the `securePaginatedQuery()` wrapper from `queryPlatform.ts`.

```ts
// ✅ CORRECT — Secure, paginated, visible-scoped
export const list = securePaginatedQuery({
  table: "leadMaster",
  visibility: { category: "lead", module: "crm", requireDiscover: true },
  searchFields: ["firstName", "lastName", "email", "phone"],
  buildIndexQuery: (ctx, args, sec) => (q) =>
    q.withIndex("by_createdAt").order("desc"),
});

// ❌ WRONG — No auth, no visibility, no pagination
export const list = query({
  handler: async (ctx) => {
    return ctx.db.query("leadMaster").collect();
  },
});
```

### Rule 2: Never Expose Unrestricted Data

- All queries require a valid `token` parameter
- Unauthenticated requests return empty results immediately
- User scope is automatically applied (staff see own records, managers see branch, admins see all)
- Visibility Engine is respected for category-based permissions

### Rule 3: Use Indexed Queries First

Always use `.withIndex()` for the primary query path. Never use `.filter()` as the first operation.

```ts
// ✅ CORRECT — Uses index
q.withIndex("by_owner", (iq) => iq.eq("ownerId", ownerId))

// ❌ WRONG — Full scan
q.filter((q) => q.eq(q.field("ownerId"), ownerId))
```

### Rule 4: Use Batch Loading

Replace N+1 query patterns with `batchGet()`.

```ts
// ✅ CORRECT — Batch load
const users = await batchGet(ctx, userIds);
const userMap = new Map(users.filter(Boolean).map((u) => [u._id, u]));

// ❌ WRONG — N+1 (one query per user)
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

- Check `requireDiscover` for category-based access
- Apply field-level masking when returning sensitive data
- Respect section-level permissions for detail views

### Rule 10: Dashboard Queries Are Not Exempt

Dashboard widget queries must also:
- Use `secureCount()` or `secureDashboardQuery()`
- Apply scope filters (a branch manager sees only their branch counts)
- Use `dashboardCounts()` for parallel aggregate queries

---

## Migration Checklist

When migrating an existing query to the secure standard:

- [ ] Replace `query({...})` with `securePaginatedQuery({...})`
- [ ] Add `token: v.string()` to args
- [ ] Set `visibility.category` for discover checks
- [ ] Set `searchFields` for text search
- [ ] Move index building to `buildIndexQuery`
- [ ] Move business-specific filters to `postFilter`
- [ ] Move enrichment to `enrich` callback
- [ ] Remove manual authentication code
- [ ] Remove manual scope filtering
- [ ] Remove manual pagination code
- [ ] Verify TypeScript compiles cleanly
- [ ] Verify no broken imports in dependent files
