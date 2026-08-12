/**
 * EEOS Enterprise Search Platform — Single Reusable Entity Search
 *
 * Per PATCH-CORE-002A spec:
 *  - ONE reusable searchEntity() function for ALL entities
 *  - No entity-specific search functions (no searchStudent, searchLead, etc.)
 *  - Entities register their searchable fields via the 'searchFields' parameter
 *  - All access decisions delegated to Visibility Engine
 *
 * API:
 *   searchEntity(table, searchFields, filters)
 *     └── table: name of the Convex table
 *     └── searchFields: which fields to text-search
 *     └── filters: status, tags, owner, company, branch, department, date range
 *     └── pagination + sorting
 *     └── visibility integration (via queryPlatform)
 */

import { v } from "convex/values";
import { query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import type { PaginatedResponse } from "./queryHelpers";
import { resolveSecurityContext } from "./queryPlatform";
import { paginatedQuery, applyStandardFilters } from "./queryHelpers";

// ═══════════════════════════════════════════════════════════════════
//  GENERIC ENTITY SEARCH — THE ONLY SEARCH FUNCTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Single reusable entity search.
 *
 * Usage:
 * ```ts
 * // Search leads
 * const results = await searchEntity(ctx, {
 *   token,
 *   table: "leadMaster",
 *   searchFields: ["firstName", "lastName", "phone", "email"],
 *   search: "john",
 *   status: "active",
 *   paginationOpts,
 * });
 *
 * // Search students
 * const results = await searchEntity(ctx, {
 *   token,
 *   table: "studentMaster",
 *   searchFields: ["firstName", "lastName", "studentCode"],
 *   branchId: "someBranchId",
 *   paginationOpts,
 * });
 * ```
 */
export const searchEntity = query({
  args: {
    token: v.string(),
    table: v.string(),
    searchFields: v.array(v.string()),
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
    tags: v.optional(v.array(v.string())),
    paginationOpts: paginationOptsValidator,
    sortField: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args): Promise<PaginatedResponse<any>> => {
    const sec = await resolveSecurityContext(ctx, args.token);
    if (!sec.isAuthenticated) {
      return { items: [], nextCursor: null, hasMore: false, totalCount: 0 };
    }

    const result = await paginatedQuery<any>(ctx, args.table, args, (q) =>
      q.order("desc"),
    );

    let filtered = result.items;

    // Apply explicit scope filters
    if (args.organizationId)
      filtered = filtered.filter((i: any) => i.organizationId === args.organizationId);
    if (args.companyId)
      filtered = filtered.filter((i: any) => i.companyId === args.companyId);
    if (args.branchId)
      filtered = filtered.filter((i: any) => i.branchId === args.branchId);
    if (args.departmentId)
      filtered = filtered.filter((i: any) => i.departmentId === args.departmentId);
    if (args.teamId)
      filtered = filtered.filter((i: any) => i.teamIds?.includes(args.teamId));
    if (args.ownerId)
      filtered = filtered.filter((i: any) => i.ownerId === args.ownerId);

    // Apply standard filters (search, status, date range)
    filtered = applyStandardFilters(filtered, args, args.searchFields as any);

    // Tag filtering
    if (args.tags && args.tags.length > 0) {
      filtered = filtered.filter((item: any) => {
        if (!item.tags || item.tags.length === 0) return false;
        return args.tags!.some((t) => item.tags.includes(t));
      });
    }

    return {
      items: filtered,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════
//  AUTOCOMPLETE (lightweight, for dropdowns/typeahead)
// ═══════════════════════════════════════════════════════════════════

/**
 * Generic autocomplete search for any entity table.
 */
export const autocompleteEntity = query({
  args: {
    token: v.string(),
    table: v.string(),
    search: v.string(),
    limit: v.optional(v.number()),
    displayFields: v.array(v.string()),
    statusFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sec = await resolveSecurityContext(ctx, args.token);
    if (!sec.isAuthenticated) return [];

    const all = await ctx.db.query(args.table as any).collect();
    const q = args.search.toLowerCase();
    const limit = args.limit || 20;

    let filtered = all.filter((item: any) => {
      if (args.statusFilter && item.status !== args.statusFilter) return false;
      return args.displayFields.some((field) => {
        const val = item[field];
        return val != null && String(val).toLowerCase().includes(q);
      });
    });

    return filtered.slice(0, limit).map((item: any) => ({
      _id: item._id,
      displayName: args.displayFields
        .map((f) => item[f])
        .filter(Boolean)
        .join(" "),
    }));
  },
});
