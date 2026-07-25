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
