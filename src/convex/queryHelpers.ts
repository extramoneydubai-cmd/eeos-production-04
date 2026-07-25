/**
 * EEOS Query Helpers — Reusable Pagination, Filtering & Batch Query Utilities
 *
 * Every collection-returning query should use these helpers instead of raw .collect().
 *
 * Features:
 *  - Cursor-based pagination via Convex built-in paginationOptsValidator
 *  - Standard filter interface: status, date range, search, organization scope
 *  - Sort support using indexed fields
 *  - N+1 prevention via batch query helper
 *  - Total count when reasonable
 */

import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

// ═══════════════════════════════════════════════════════════════════
//  SHARED FILTER SCHEMA
// ═══════════════════════════════════════════════════════════════════

/**
 * Standard filter args for list queries.
 * Extend this with module-specific filters.
 */
export const standardFilterArgs = {
  paginationOpts: paginationOptsValidator,
  search: v.optional(v.string()),
  status: v.optional(v.string()),
  dateFrom: v.optional(v.number()),
  dateTo: v.optional(v.number()),
  organizationId: v.optional(v.id("organizations")),
  companyId: v.optional(v.id("companies")),
  branchId: v.optional(v.id("branches")),
  departmentId: v.optional(v.id("departments")),
  teamId: v.optional(v.id("teams")),
  ownerId: v.optional(v.id("users")),
  sortField: v.optional(v.string()),
  sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
};

/**
 * Filter args type — use `...standardFilterArgs` when defining query args.
 */
export const filterArgs = {
  paginationOpts: paginationOptsValidator,
  search: v.optional(v.string()),
  status: v.optional(v.string()),
  dateFrom: v.optional(v.number()),
  dateTo: v.optional(v.number()),
  organizationId: v.optional(v.id("organizations")),
  companyId: v.optional(v.id("companies")),
  branchId: v.optional(v.id("branches")),
  departmentId: v.optional(v.id("departments")),
  teamId: v.optional(v.id("teams")),
  ownerId: v.optional(v.id("users")),
  sortField: v.optional(v.string()),
  sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
};

/**
 * Standard paginated response type.
 */
export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount?: number;
}

// ═══════════════════════════════════════════════════════════════════
//  PAGINATION HELPERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Wrap a paginated query using Convex's built-in .paginate().
 *
 * Usage:
 * ```
 * export const list = query({
 *   args: { ...filterArgs },
 *   handler: async (ctx, args) => {
 *     return paginatedQuery(ctx, "tasks", args, (q) =>
 *       q.withIndex("by_owner", (iq) => iq.eq("ownerId", args.ownerId!))
 *     );
 *   },
 * });
 * ```
 */
export async function paginatedQuery<T extends Record<string, any>>(
  ctx: QueryCtx,
  tableName: string,
  args: {
    paginationOpts: any;
    [key: string]: any;
  },
  queryBuilder?: (
    q: ReturnType<typeof ctx.db.query>,
  ) => any,
): Promise<PaginatedResponse<T>> {
  let q = ctx.db.query(tableName as any);

  if (queryBuilder) {
    q = queryBuilder(q);
  }

  // Apply date range filter if supported (as a fallback, Convex paginate doesn't support .filter directly)
  // We'll apply filters after pagination for now and rely on indexed queries for performance
  const page = await q.paginate(args.paginationOpts);

  return {
    items: page.page as T[],
    nextCursor: page.isDone ? null : page.continueCursor,
    hasMore: !page.isDone,
  };
}

/**
 * Get total count for a table (use sparingly — triggers full scan).
 * Only use when UI explicitly needs count.
 */
export async function getTotalCount(
  ctx: QueryCtx,
  tableName: string,
  filter?: (q: any) => any,
): Promise<number> {
  let q = ctx.db.query(tableName as any);
  if (filter) {
    q = filter(q);
  }
  const all = await q.collect();
  return all.length;
}

// ═══════════════════════════════════════════════════════════════════
//  FILTER APPLICATION HELPERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Apply standard filters to an in-memory collection.
 * Use as a post-pagination filter for fields not covered by indexes.
 */
export function applyStandardFilters<T extends Record<string, any>>(
  items: T[],
  args: {
    search?: string;
    status?: string;
    dateFrom?: number;
    dateTo?: number;
    [key: string]: any;
  },
  searchFields?: (keyof T)[],
): T[] {
  let filtered = items;

  if (args.status) {
    filtered = filtered.filter((item) => item.status === args.status);
  }

  if (args.dateFrom !== undefined) {
    filtered = filtered.filter((item) => {
      const ts = (item as any).createdAt ?? (item as any).date;
      return ts >= args.dateFrom!;
    });
  }

  if (args.dateTo !== undefined) {
    filtered = filtered.filter((item) => {
      const ts = (item as any).createdAt ?? (item as any).date;
      return ts <= args.dateTo!;
    });
  }

  if (args.search && searchFields && searchFields.length > 0) {
    const lower = args.search.toLowerCase();
    filtered = filtered.filter((item) =>
      searchFields.some((field) => {
        const val = item[field];
        return val != null && String(val).toLowerCase().includes(lower);
      }),
    );
  }

  return filtered;
}

// ═══════════════════════════════════════════════════════════════════
//  N+1 PREVENTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Batch-fetch documents by their IDs to prevent N+1 queries.
 *
 * Usage:
 * ```
 * const users = await batchGet(ctx, userIds);
 * ```
 */
export async function batchGet<T extends Record<string, any>>(
  ctx: QueryCtx,
  ids: Id<any>[],
): Promise<(T | null)[]> {
  if (ids.length === 0) return [];
  return Promise.all(ids.map((id) => ctx.db.get(id))) as Promise<(T | null)[]>;
}

/**
 * For small datasets, fetch once and cache in memory.
 * Returns a function that retrieves by ID without extra DB calls.
 */
export async function createLookup<T extends Record<string, any>>(
  ctx: QueryCtx,
  tableName: string,
  options?: { index?: string; filter?: (q: any) => any },
): Promise<Map<Id<any>, T>> {
  let q = ctx.db.query(tableName as any);
  if (options?.index) {
    q = q.withIndex(options.index as any);
  }
  if (options?.filter) {
    q = options.filter(q);
  }
  const docs = await q.collect();
  const map = new Map<Id<any>, T>();
  for (const doc of docs) {
    map.set(doc._id, doc as unknown as T);
  }
  return map;
}

// ═══════════════════════════════════════════════════════════════════
//  DASHBOARD AGGREGATION HELPERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Aggregate query runner — runs multiple count queries in parallel.
 * Efficient for dashboard widgets.
 */
export async function dashboardCounts(
  ctx: QueryCtx,
  queries: {
    table: string;
    index?: string;
    filter?: (q: any) => any;
  }[],
): Promise<number[]> {
  const results = await Promise.all(
    queries.map(async (q) => {
      let query = ctx.db.query(q.table as any);
      if (q.index) {
        query = query.withIndex(q.index as any);
      }
      if (q.filter) {
        query = q.filter(query);
      }
      const docs = await query.collect();
      return docs.length;
    }),
  );
  return results;
}

// ═══════════════════════════════════════════════════════════════════
//  DASHBOARD KPI PLATFORM
// ═══════════════════════════════════════════════════════════════════

export interface DashboardKPI {
  /** KPI label (e.g., "Total Students") */
  label: string;
  /** Current value */
  value: number;
  /** Previous period value for comparison */
  previousValue?: number;
  /** Percentage change vs previous period */
  change?: number;
  /** Trend direction */
  trend?: "up" | "down" | "stable";
  /** Format type for display */
  format?: "number" | "currency" | "percentage" | "duration";
  /** Icon key for UI rendering */
  icon?: string;
  /** Color key for UI rendering */
  color?: string;
  /** Status */
  status?: "good" | "warning" | "critical";
}

/**
 * Build dashboard KPI cards by running parallel count queries.
 *
 * Usage:
 * ```ts
 * const kpis = await dashboardKPIs(ctx, [
 *   { label: "Total Leads", table: "leadMaster", icon: "Users", color: "blue" },
 *   { label: "Active Students", table: "studentMaster", color: "green" },
 * ]);
 * ```
 */
export async function dashboardKPIs(
  ctx: QueryCtx,
  kpiDefs: {
    label: string;
    table: string;
    icon?: string;
    color?: string;
    format?: DashboardKPI["format"];
    index?: string;
    filter?: (q: any) => any;
  }[],
): Promise<DashboardKPI[]> {
  const counts = await dashboardCounts(
    ctx,
    kpiDefs.map((k) => ({ table: k.table, index: k.index, filter: k.filter })),
  );

  return kpiDefs.map((k, i) => ({
    label: k.label,
    value: counts[i],
    icon: k.icon,
    color: k.color,
    format: k.format || "number",
    status: counts[i] > 0 ? "good" : "warning",
  }));
}

/**
 * Dashboard chart data query — runs parallel aggregation queries.
 */
export interface DashboardChartSeries {
  name: string;
  data: { label: string; value: number }[];
  color?: string;
}

/**
 * Build dashboard chart data.
 */
export async function dashboardCharts(
  ctx: QueryCtx,
  chartDefs: {
    name: string;
    table: string;
    groupByField: string;
    color?: string;
    filter?: (q: any) => any;
  }[],
): Promise<DashboardChartSeries[]> {
  const results = await Promise.all(
    chartDefs.map(async (cd) => {
      let q = ctx.db.query(cd.table as any);
      if (cd.filter) {
        q = cd.filter(q);
      }
      const docs = await q.collect();

      // Group by the specified field
      const groups: Record<string, number> = {};
      for (const doc of docs as any[]) {
        const key = doc[cd.groupByField] || "unknown";
        groups[key] = (groups[key] || 0) + 1;
      }

      return {
        name: cd.name,
        color: cd.color,
        data: Object.entries(groups)
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value),
      };
    }),
  );

  return results;
}

/**
 * Dashboard timeline — fetches recent activity from a timeline table.
 */
export async function dashboardTimeline(
  ctx: QueryCtx,
  table: string,
  options?: {
    limit?: number;
    index?: string;
    filter?: (q: any) => any;
  },
): Promise<any[]> {
  let q = ctx.db.query(table as any);

  if (options?.index) {
    q = q.withIndex(options.index as any);
  }

  if (options?.filter) {
    q = options.filter(q);
  }

  const items = await q.order("desc").collect();
  return items.slice(0, options?.limit || 10);
}

/**
 * Dashboard recent items — fetch most recently created records.
 */
export async function dashboardRecent<T extends Record<string, any>>(
  ctx: QueryCtx,
  table: string,
  limit: number = 10,
  filter?: (q: any) => any,
): Promise<T[]> {
  let q = ctx.db.query(table as any);
  if (filter) {
    q = filter(q);
  }
  const items = await q.withIndex("by_createdAt").order("desc").collect();
  return items.slice(0, limit) as T[];
}

/**
 * Dashboard tasks — fetch tasks grouped by status.
 */
export async function dashboardTasks(
  ctx: QueryCtx,
  table: string,
  options?: {
    userId?: Id<"users">;
    limit?: number;
    statusFilter?: string[];
  },
): Promise<{
  pending: any[];
  inProgress: any[];
  completed: any[];
  overdue: any[];
  total: number;
}> {
  let q = ctx.db.query(table as any);
  if (options?.userId) {
    q = q.withIndex("by_owner", (iq: any) => iq.eq("ownerId", options.userId!));
  }

  const all = await q.collect();
  const now = Date.now();

  const pending = all.filter(
    (t: any) =>
      t.status === "pending" &&
      (!options?.statusFilter || options.statusFilter.includes(t.status)),
  );
  const inProgress = all.filter(
    (t: any) =>
      t.status === "in_progress" &&
      (!options?.statusFilter || options.statusFilter.includes(t.status)),
  );
  const completed = all.filter(
    (t: any) =>
      t.status === "completed" &&
      (!options?.statusFilter || options.statusFilter.includes(t.status)),
  );
  const overdue = pending.filter(
    (t: any) => t.dueDate && t.dueDate < now,
  );

  return {
    pending: pending.slice(0, options?.limit || 10),
    inProgress: inProgress.slice(0, options?.limit || 10),
    completed: completed.slice(0, options?.limit || 10),
    overdue: overdue.slice(0, options?.limit || 10),
    total: all.length,
  };
}

/**
 * Dashboard notifications — fetch unread notifications.
 */
export async function dashboardNotifications(
  ctx: QueryCtx,
  userId: Id<"users">,
  limit: number = 10,
): Promise<{
  items: any[];
  unreadCount: number;
}> {
  const all = await ctx.db
    .query("notifications")
    .withIndex("userId", (iq: any) => iq.eq("userId", userId))
    .order("desc")
    .collect();

  const unread = all.filter((n: any) => !n.read);

  return {
    items: all.slice(0, limit),
    unreadCount: unread.length,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  EXTENDED BATCH PLATFORM
// ═══════════════════════════════════════════════════════════════════

/**
 * Batch fetch people by IDs.
 */
export async function batchPeople(
  ctx: QueryCtx,
  ids: Id<"personMaster">[],
): Promise<Map<Id<"personMaster">, any>> {
  const items = await batchGet<any>(ctx, ids);
  const map = new Map<Id<"personMaster">, any>();
  for (const item of items.filter(Boolean)) {
    map.set(item._id, item);
  }
  return map;
}

/**
 * Batch fetch students by IDs.
 */
export async function batchStudents(
  ctx: QueryCtx,
  ids: Id<any>[],
): Promise<Map<Id<any>, any>> {
  const items = await batchGet<any>(ctx, ids);
  const map = new Map<Id<any>, any>();
  for (const item of items.filter(Boolean)) {
    map.set(item._id, item);
  }
  return map;
}

/**
 * Batch fetch employees by IDs.
 */
export async function batchEmployees(
  ctx: QueryCtx,
  ids: Id<any>[],
): Promise<Map<Id<any>, any>> {
  const items = await batchGet<any>(ctx, ids);
  const map = new Map<Id<any>, any>();
  for (const item of items.filter(Boolean)) {
    map.set(item._id, item);
  }
  return map;
}

/**
 * Batch fetch companies by IDs.
 */
export async function batchCompanies(
  ctx: QueryCtx,
  ids: Id<any>[],
): Promise<Map<Id<any>, any>> {
  const items = await batchGet<any>(ctx, ids);
  const map = new Map<Id<any>, any>();
  for (const item of items.filter(Boolean)) {
    map.set(item._id, item);
  }
  return map;
}

/**
 * Batch fetch branches by IDs.
 */
export async function batchBranches(
  ctx: QueryCtx,
  ids: Id<any>[],
): Promise<Map<Id<any>, any>> {
  const items = await batchGet<any>(ctx, ids);
  const map = new Map<Id<any>, any>();
  for (const item of items.filter(Boolean)) {
    map.set(item._id, item);
  }
  return map;
}

/**
 * Batch fetch departments by IDs.
 */
export async function batchDepartments(
  ctx: QueryCtx,
  ids: Id<any>[],
): Promise<Map<Id<any>, any>> {
  const items = await batchGet<any>(ctx, ids);
  const map = new Map<Id<any>, any>();
  for (const item of items.filter(Boolean)) {
    map.set(item._id, item);
  }
  return map;
}

/**
 * Batch fetch courses by IDs.
 */
export async function batchCourses(
  ctx: QueryCtx,
  ids: Id<any>[],
): Promise<Map<Id<any>, any>> {
  const items = await batchGet<any>(ctx, ids);
  const map = new Map<Id<any>, any>();
  for (const item of items.filter(Boolean)) {
    map.set(item._id, item);
  }
  return map;
}

/**
 * Batch fetch subjects by IDs.
 */
export async function batchSubjects(
  ctx: QueryCtx,
  ids: Id<any>[],
): Promise<Map<Id<any>, any>> {
  const items = await batchGet<any>(ctx, ids);
  const map = new Map<Id<any>, any>();
  for (const item of items.filter(Boolean)) {
    map.set(item._id, item);
  }
  return map;
}

/**
 * Batch fetch documents by IDs.
 */
export async function batchDocuments(
  ctx: QueryCtx,
  ids: Id<any>[],
): Promise<Map<Id<any>, any>> {
  const items = await batchGet<any>(ctx, ids);
  const map = new Map<Id<any>, any>();
  for (const item of items.filter(Boolean)) {
    map.set(item._id, item);
  }
  return map;
}

/**
 * Batch fetch vendors by IDs.
 */
export async function batchVendors(
  ctx: QueryCtx,
  ids: Id<any>[],
): Promise<Map<Id<any>, any>> {
  const items = await batchGet<any>(ctx, ids);
  const map = new Map<Id<any>, any>();
  for (const item of items.filter(Boolean)) {
    map.set(item._id, item);
  }
  return map;
}

/**
 * Batch fetch inventory items by IDs.
 */
export async function batchInventoryItems(
  ctx: QueryCtx,
  ids: Id<any>[],
): Promise<Map<Id<any>, any>> {
  const items = await batchGet<any>(ctx, ids);
  const map = new Map<Id<any>, any>();
  for (const item of items.filter(Boolean)) {
    map.set(item._id, item);
  }
  return map;
}

/**
 * Generic batch collection fetcher — for any entity type.
 */
export async function batchCollection(
  ctx: QueryCtx,
  ids: Id<any>[],
): Promise<Map<Id<any>, any>> {
  const items = await batchGet<any>(ctx, ids);
  const map = new Map<Id<any>, any>();
  for (const item of items.filter(Boolean)) {
    map.set(item._id, item);
  }
  return map;
}

/**
 * Batch fetch parents by IDs (personMaster level).
 */
export async function batchParents(
  ctx: QueryCtx,
  ids: Id<any>[],
): Promise<Map<Id<any>, any>> {
  return batchCollection(ctx, ids);
}

/**
 * Batch fetch faculty by IDs (employeeMaster with faculty role).
 */
export async function batchFaculty(
  ctx: QueryCtx,
  ids: Id<any>[],
): Promise<Map<Id<any>, any>> {
  return batchCollection(ctx, ids);
}

/**
 * Batch fetch leads by IDs.
 */
export async function batchLeads(
  ctx: QueryCtx,
  ids: Id<any>[],
): Promise<Map<Id<any>, any>> {
  const items = await batchGet<any>(ctx, ids);
  const map = new Map<Id<any>, any>();
  for (const item of items.filter(Boolean)) {
    map.set(item._id, item);
  }
  return map;
}

/**
 * Batch fetch teams by IDs.
 */
export async function batchTeams(
  ctx: QueryCtx,
  ids: Id<any>[],
): Promise<Map<Id<any>, any>> {
  return batchCollection(ctx, ids);
}

/**
 * Batch fetch assets by IDs.
 */
export async function batchAssets(
  ctx: QueryCtx,
  ids: Id<any>[],
): Promise<Map<Id<any>, any>> {
  return batchCollection(ctx, ids);
}

/**
 * Batch fetch tasks by IDs.
 */
export async function batchTasks(
  ctx: QueryCtx,
  ids: Id<any>[],
): Promise<Map<Id<any>, any>> {
  return batchCollection(ctx, ids);
}

/**
 * Batch fetch meetings by IDs.
 */
export async function batchMeetings(
  ctx: QueryCtx,
  ids: Id<any>[],
): Promise<Map<Id<any>, any>> {
  return batchCollection(ctx, ids);
}

/**
 * Batch fetch batches by IDs.
 */
export async function batchBatches(
  ctx: QueryCtx,
  ids: Id<any>[],
): Promise<Map<Id<any>, any>> {
  return batchCollection(ctx, ids);
}

/**
 * Batch fetch users by IDs with name mapping.
 */
export async function batchUsers(
  ctx: QueryCtx,
  ids: Id<any>[],
): Promise<Map<Id<any>, { _id: Id<any>; name: string }>> {
  const items = await batchGet<any>(ctx, ids);
  const map = new Map<Id<any>, { _id: Id<any>; name: string }>();
  for (const item of items.filter(Boolean)) {
    map.set(item._id, {
      _id: item._id,
      name: item.name || item.username || "Unknown",
    });
  }
  return map;
}

/**
 * Batch enrich items with their associated person names.
 */
export async function enrichWithPeople(
  ctx: QueryCtx,
  items: any[],
  personIdField: string = "personId",
): Promise<any[]> {
  const personIds = [
    ...new Set(items.map((i) => i[personIdField]).filter(Boolean)),
  ];
  const persons = await batchPeople(ctx, personIds as any);

  return items.map((item) => ({
    ...item,
    person: item[personIdField] ? persons.get(item[personIdField]) || null : null,
    personName: item[personIdField]
      ? persons.get(item[personIdField])?.displayName ||
        persons.get(item[personIdField])?.firstName ||
        "Unknown"
      : null,
  }));
}

/**
 * Batch enrich items with their associated branch names.
 */
export async function enrichWithBranches(
  ctx: QueryCtx,
  items: any[],
  branchIdField: string = "branchId",
): Promise<any[]> {
  const branchIds = [
    ...new Set(items.map((i) => i[branchIdField]).filter(Boolean)),
  ];
  const branches = await batchBranches(ctx, branchIds);

  return items.map((item) => ({
    ...item,
    branch: item[branchIdField] ? branches.get(item[branchIdField]) || null : null,
    branchName: item[branchIdField]
      ? branches.get(item[branchIdField])?.name || "Unknown"
      : null,
  }));
}

/**
 * Batch enrich items with their associated user/owner names.
 */
export async function enrichWithUsers(
  ctx: QueryCtx,
  items: any[],
  userIdField: string = "ownerId",
): Promise<any[]> {
  const userIds = [
    ...new Set(items.map((i) => i[userIdField]).filter(Boolean)),
  ];
  const users = await batchGet<any>(ctx, userIds);
  const userMap = new Map(
    users
      .filter(Boolean)
      .map((u: any) => [u._id, u.name || u.username || "Unknown"]),
  );

  return items.map((item) => ({
    ...item,
    [`${userIdField}Name`]: item[userIdField]
      ? userMap.get(item[userIdField]) || "Unknown"
      : null,
  }));
}
