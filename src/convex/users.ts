import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query, QueryCtx } from "./_generated/server";
import { paginatedQuery, applyStandardFilters, type PaginatedResponse } from "./queryHelpers";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (user === null) return null;
    return user;
  },
});

export const getCurrentUser = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  return await ctx.db.get(userId);
};

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// ── listUsers returns a plain array for backward compatibility ──
// Use listUsersPaginated for cursor-based pagination.
export const listUsers = query({
  args: {
    search: v.optional(v.string()),
    departmentId: v.optional(v.id("departments")),
    teamId: v.optional(v.id("teams")),
    isDisabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("users").order("desc").collect();
    let filtered: any[] = all;
    if (args.departmentId) filtered = filtered.filter((u: any) => u.departmentId === args.departmentId);
    if (args.teamId) filtered = filtered.filter((u: any) => u.teamIds?.includes(args.teamId));
    if (args.isDisabled !== undefined) filtered = filtered.filter((u: any) => u.isDisabled === args.isDisabled);
    if (args.search) {
      const q = args.search.toLowerCase();
      filtered = filtered.filter((u: any) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)),
      );
    }
    return filtered;
  },
});

export const listUsersPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    departmentId: v.optional(v.id("departments")),
    teamId: v.optional(v.id("teams")),
    isDisabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<PaginatedResponse<any>> => {
    const result = await paginatedQuery<any>(ctx, "users", args, (q) =>
      q.withIndex("by_createdAt").order("desc"),
    );
    let filtered = result.items;
    if (args.departmentId) filtered = filtered.filter((u: any) => u.departmentId === args.departmentId);
    if (args.teamId) filtered = filtered.filter((u: any) => u.teamIds?.includes(args.teamId));
    if (args.isDisabled !== undefined) filtered = filtered.filter((u: any) => u.isDisabled === args.isDisabled);
    if (args.search) {
      const q = args.search.toLowerCase();
      filtered = filtered.filter((u: any) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)),
      );
    }
    return { items: filtered, nextCursor: result.nextCursor, hasMore: result.hasMore };
  },
});

// ── listActiveUsers returns a plain array for backward compatibility ──
export const listActiveUsers = query({
  args: {
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("users").order("desc").collect();
    let filtered = all.filter((u: any) => !u.isDisabled);
    if (args.search) {
      const q = args.search.toLowerCase();
      filtered = filtered.filter((u: any) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)),
      );
    }
    return filtered;
  },
});

export const getUsersByDepartment = query({
  args: {
    departmentId: v.id("departments"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args): Promise<PaginatedResponse<any>> => {
    const result = await paginatedQuery<any>(ctx, "users", args, (q) =>
      q.withIndex("by_department", (iq) => iq.eq("departmentId", args.departmentId)),
    );
    return {
      items: result.items.filter((u: any) => !u.isDisabled),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  },
});

export const getUsersByTeam = query({
  args: {
    teamId: v.id("teams"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args): Promise<PaginatedResponse<any>> => {
    const result = await paginatedQuery<any>(ctx, "users", args, (q) =>
      q.withIndex("by_createdAt").order("desc"),
    );
    return {
      items: result.items.filter((u: any) => u.teamIds?.includes(args.teamId) && !u.isDisabled),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  },
});
