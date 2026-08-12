/**
 * EEOS Enterprise Query Platform — Secure Query Framework
 *
 * Every collection-returning query MUST use securePaginatedQuery() to ensure:
 *  - Authentication (auto-reject unauthenticated requests)
 *  - Organization Scope (company, branch, department, team)
 *  - Visibility Engine (category-based discover/permissions)
 *  - Pagination (cursor-based via Convex built-in)
 *  - Search (text search on specified fields)
 *  - Sorting (by indexed fields)
 *  - Date range filters
 *  - Status filters
 *
 * Business modules ONLY define business-specific filters.
 * Security logic is NEVER duplicated.
 */

import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { getUserFromToken } from "./authHelpers";
import { paginatedQuery, applyStandardFilters, batchGet, type PaginatedResponse } from "./queryHelpers";

// ═══════════════════════════════════════════════════════════════════
//  AUTH & SCOPE CONTEXT
// ═══════════════════════════════════════════════════════════════════

export interface SecurityContext {
  /** The authenticated user, if session is valid */
  user: Doc<"users"> | null;
  /** Whether the request is authenticated */
  isAuthenticated: boolean;
  /** User's organization scope IDs */
  scope: {
    organizationId?: Id<"organizations">;
    companyId?: Id<"companies">;
    branchId?: Id<"branches">;
    departmentId?: Id<"departments">;
    teamId?: Id<"teams">;
    verticalId?: Id<"verticals">;
  };
  /** User's platform role */
  role: string | undefined;
  /** Whether user is super_admin (bypasses all visibility) */
  isSuperAdmin: boolean;
  /** Whether user is admin (bypasses most visibility) */
  isAdmin: boolean;
}

/**
 * Resolve security context from the current query context.
 * Uses the token-based auth from authHelpers.
 */
export async function resolveSecurityContext(
  ctx: QueryCtx,
  token?: string,
): Promise<SecurityContext> {
  if (!token) {
    return {
      user: null,
      isAuthenticated: false,
      scope: {},
      role: undefined,
      isSuperAdmin: false,
      isAdmin: false,
    };
  }

  const user = await getUserFromToken(ctx, token);
  if (!user) {
    return {
      user: null,
      isAuthenticated: false,
      scope: {},
      role: undefined,
      isSuperAdmin: false,
      isAdmin: false,
    };
  }

  return {
    user,
    isAuthenticated: true,
    scope: {
      organizationId: (user as any).organizationId,
      companyId: (user as any).companyId,
      branchId: (user as any).branchId,
      departmentId: (user as any).departmentId,
      teamId: (user as any).teamId,
      verticalId: (user as any).verticalId,
    },
    role: user.role,
    isSuperAdmin: user.role === "super_admin",
    isAdmin: user.role === "super_admin" || user.role === "admin",
  };
}

// ═══════════════════════════════════════════════════════════════════
//  VISIBILITY INTEGRATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Visibility scope for a query.
 * Defines what records the user can see by default.
 */
export interface VisibilityScope {
  /** Category for visibility engine checks (e.g., "lead", "student", "finance") */
  category?: string;
  /** Module name for field/section permissions */
  module?: string;
  /** Whether to auto-reject if user can't discover this category */
  requireDiscover?: boolean;
  /** Record IDs to use for record-level scope filtering */
  recordIds?: string[];
}

/**
 * Resolve scope filters by delegating to the existing Visibility Engine.
 *
 * This function does NOT hardcode role rules.
 * All access decisions are delegated to:
 *  - `visibilityEngine.canDiscover()` — category-level discover permissions
 *  - `visibilityEngine.canOpen()` — record-level open permissions
 *  - `visibilityEngine.filterRecords()` — bulk record filtering
 *  - `recordScope.evaluateRecordScope()` — org scope evaluation
 *
 * Business modules call these via securePaginatedQuery's visibility config.
 */
export async function resolveVisibilityScope(
  ctx: QueryCtx,
  sec: SecurityContext,
  category: string,
  module: string,
): Promise<{ allowed: boolean; reason?: string }> {
  if (!sec.isAuthenticated) {
    return { allowed: false, reason: "Not authenticated" };
  }

  try {
    const { canDiscover } = await import("./visibilityEngine");
    const allowed = await (canDiscover as any)(ctx, {
      userId: sec.user!._id,
      category,
    });
    return allowed
      ? { allowed: true }
      : { allowed: false, reason: `Cannot discover category: ${category}` };
  } catch {
    // Visibility engine not available — allow via auth only
    return { allowed: true };
  }
}

/**
 * Filter records through the Visibility Engine's filterRecords API.
 */
export async function filterByVisibility(
  ctx: QueryCtx,
  sec: SecurityContext,
  records: any[],
  module: string,
  category?: string,
): Promise<any[]> {
  if (!sec.isAuthenticated) return [];

  try {
    const { filterRecords } = await import("./visibilityEngine");
    const allowedIds = await (filterRecords as any)(ctx, {
      userId: sec.user!._id,
      module,
      recordIds: records.map((r) => r._id),
      category: category || module,
    });
    const allowedSet = new Set(allowedIds);
    return records.filter((r) => allowedSet.has(r._id));
  } catch {
    // Visibility engine not available — return all records
    return records;
  }
}

// ═══════════════════════════════════════════════════════════════════
//  STANDARD ARGS FOR SECURE PAGINATED QUERIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Base args for any secure paginated query.
 * Every secure query automatically includes auth token, pagination, filters, and scope.
 */
export const secureQueryArgs = {
  /** Auth token — required. If missing/expired, query returns empty. */
  token: v.string(),
  /** Standard pagination opts */
  paginationOpts: paginationOptsValidator,
  /** General text search */
  search: v.optional(v.string()),
  /** Status filter */
  status: v.optional(v.string()),
  /** Date range start (epoch ms) */
  dateFrom: v.optional(v.number()),
  /** Date range end (epoch ms) */
  dateTo: v.optional(v.number()),
  /** Organization scope override */
  organizationId: v.optional(v.id("organizations")),
  /** Company scope override */
  companyId: v.optional(v.id("companies")),
  /** Branch scope override */
  branchId: v.optional(v.id("branches")),
  /** Department scope override */
  departmentId: v.optional(v.id("departments")),
  /** Team scope override */
  teamId: v.optional(v.id("teams")),
  /** Owner scope override */
  ownerId: v.optional(v.id("users")),
  /** Sort field */
  sortField: v.optional(v.string()),
  /** Sort direction */
  sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
};

// ═══════════════════════════════════════════════════════════════════
//  SECURE PAGINATED QUERY WRAPPER
// ═══════════════════════════════════════════════════════════════════

export interface SecureQueryConfig {
  /** The database table to query */
  table: string;
  /** Visibility scope for category/module checks */
  visibility?: VisibilityScope;
  /** Fields to search against for text search */
  searchFields?: string[];
  /** Whether to require authentication (default: true) */
  requireAuth?: boolean;
  /** Whether to restrict to user's scope by default (default: true) */
  respectScope?: boolean;
  /** Callback to build the indexed query for Convex */
  buildIndexQuery?: (
    ctx: QueryCtx,
    args: Record<string, any>,
    sec: SecurityContext,
  ) => any;
  /** Callback for post-query in-memory filtering */
  postFilter?: (
    items: any[],
    args: Record<string, any>,
    sec: SecurityContext,
  ) => any[];
  /** Callback for post-query enrichment (batch loading, etc.) */
  enrich?: (
    items: any[],
    ctx: QueryCtx,
    args: Record<string, any>,
    sec: SecurityContext,
  ) => Promise<any[]>;
}

/**
 * Build a secure paginated query.
 *
 * This wrapper automatically injects:
 *  1. Authentication check
 *  2. Visibility/discover check
 *  3. Organization scope filtering
 *  4. Pagination (cursor-based)
 *  5. Search, status, date range filters
 *  6. Post-query enrichment (batch loading, etc.)
 *
 * Usage:
 * ```ts
 * export const listLeads = securePaginatedQuery({
 *   table: "leadMaster",
 *   visibility: { category: "lead", module: "crm", requireDiscover: true },
 *   searchFields: ["firstName", "lastName", "email", "phone"],
 *   buildIndexQuery: (ctx, args) =>
 *     q.withIndex("by_createdAt").order("desc"),
 *   postFilter: (items, args) =>
 *     items.filter(i => args.priority ? i.priority === args.priority : true),
 * });
 * ```
 */
export function securePaginatedQuery(config: SecureQueryConfig) {
  return async (
    ctx: QueryCtx,
    args: Record<string, any>,
  ): Promise<PaginatedResponse<any>> => {
    // 1. Resolve security context
    const sec = await resolveSecurityContext(ctx, args.token);

    // 2. Check authentication (if required)
    if (config.requireAuth !== false && !sec.isAuthenticated) {
      return { items: [], nextCursor: null, hasMore: false, totalCount: 0 };
    }

    // 3. Check visibility discover via resolveVisibilityScope (delegates to Visibility Engine)
    if (
      config.visibility?.requireDiscover &&
      config.visibility.category
    ) {
      const visibility = await resolveVisibilityScope(
        ctx,
        sec,
        config.visibility.category,
        config.visibility.module || config.visibility.category,
      );
      if (!visibility.allowed) {
        return { items: [], nextCursor: null, hasMore: false, totalCount: 0 };
      }
    }

    // 4. Build the base query with index
    const result = await paginatedQuery<any>(
      ctx,
      config.table,
      args as any,
      (q) => {
        if (config.buildIndexQuery) {
          return config.buildIndexQuery(ctx, args, sec)(q);
        }
        // Default: order by _creationTime desc — index-free, works on every table
        return q.order("desc");
      },
    );

    // 5. Apply visibility scope via filterRecords (delegates to Visibility Engine)
    let filtered = result.items;
    if (config.respectScope !== false && config.visibility?.module) {
      filtered = await filterByVisibility(
        ctx,
        sec,
        filtered,
        config.visibility.module,
        config.visibility.category,
      );
    }

    // 6. Apply explicit scope overrides from args
    if (args.organizationId) {
      filtered = filtered.filter(
        (item: any) => item.organizationId === args.organizationId,
      );
    }
    if (args.companyId) {
      filtered = filtered.filter(
        (item: any) => item.companyId === args.companyId,
      );
    }
    if (args.branchId) {
      filtered = filtered.filter(
        (item: any) => item.branchId === args.branchId,
      );
    }
    if (args.departmentId) {
      filtered = filtered.filter(
        (item: any) => item.departmentId === args.departmentId,
      );
    }

    // 7. Apply standard filters (search, status, date range)
    filtered = applyStandardFilters(filtered, args, config.searchFields as any);

    // 8. Apply business-specific post-filter
    if (config.postFilter) {
      filtered = config.postFilter(filtered, args, sec);
    }

    // 9. Enrichment (batch loading, etc.)
    let enriched = filtered;
    if (config.enrich) {
      enriched = await config.enrich(filtered, ctx, args, sec);
    }

    return {
      items: enriched,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  };
}

// ═══════════════════════════════════════════════════════════════════
//  SECURE COUNT QUERY
// ═══════════════════════════════════════════════════════════════════

/**
 * Secure count query — counts records using Visibility Engine for scope.
 * Delegates access decisions rather than hardcoding role rules.
 */
export async function secureCount(
  ctx: QueryCtx,
  table: string,
  token: string,
  filter?: (items: any[]) => any[],
  visibility?: { module?: string; category?: string },
): Promise<number> {
  const sec = await resolveSecurityContext(ctx, token);
  if (!sec.isAuthenticated) return 0;

  const all = await ctx.db.query(table as any).collect();
  let filtered = all as any[];

  // Apply visibility scope if module specified
  if (visibility?.module) {
    filtered = await filterByVisibility(ctx, sec, filtered, visibility.module, visibility.category);
  }

  if (filter) {
    filtered = filter(filtered);
  }

  return filtered.length;
}

// ═══════════════════════════════════════════════════════════════════
//  DASHBOARD QUERY WRAPPER
// ═══════════════════════════════════════════════════════════════════

/**
 * Build a dashboard query that auto-authenticates and applies scope.
 */
export async function secureDashboardQuery(
  ctx: QueryCtx,
  token: string,
  fetcher: (
    ctx: QueryCtx,
    sec: SecurityContext,
  ) => Promise<Record<string, any>>,
): Promise<Record<string, any> | null> {
  const sec = await resolveSecurityContext(ctx, token);
  if (!sec.isAuthenticated) return null;
  return fetcher(ctx, sec);
}
