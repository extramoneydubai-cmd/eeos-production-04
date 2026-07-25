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

export const listUsers = query({
  args: {
    paginationOpts: v.optional(paginationOptsValidator),
    search: v.optional(v.string()),
    departmentId: v.optional(v.id("departments")),
    teamId: v.optional(v.id("teams")),
    isDisabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<PaginatedResponse<any>> => {
    const paginationOpts = args.paginationOpts || { cursor: null as string | null, numItems: 10000 };
    const queryArgs = { ...args, paginationOpts };
    const result = await paginatedQuery<any>(ctx, "users", queryArgs, (q) =>
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

export const listActiveUsers = query({
  args: {
    paginationOpts: v.optional(paginationOptsValidator),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<PaginatedResponse<any>> => {
    const paginationOpts = args.paginationOpts || { cursor: null as string | null, numItems: 10000 };
    const queryArgs = { ...args, paginationOpts };
    const result = await paginatedQuery<any>(ctx, "users", queryArgs, (q) =>
      q.withIndex("by_createdAt").order("desc"),
    );
    const filtered = result.items.filter((u: any) => !u.isDisabled);
    return { items: filtered, nextCursor: result.nextCursor, hasMore: result.hasMore };
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
