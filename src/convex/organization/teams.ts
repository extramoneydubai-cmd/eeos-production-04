import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "../_generated/server";

// ─── Queries ───

export const listByDepartment = query({
  args: {
    departmentId: v.id("departments"),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let teams = await ctx.db
      .query("teams")
      .withIndex("by_department", (q) => q.eq("departmentId", args.departmentId))
      .collect();

    if (args.search && args.search.trim()) {
      const q = args.search.toLowerCase();
      teams = teams.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q),
      );
    }

    return teams.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getById = query({
  args: { id: v.id("teams") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ─── Mutations ───

export const create = mutation({
  args: {
    departmentId: v.id("departments"),
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    leadId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("teams")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (existing) throw new Error(`Team code "${args.code}" already exists`);

    const now = Date.now();
    return await ctx.db.insert("teams", {
      departmentId: args.departmentId,
      name: args.name,
      code: args.code,
      description: args.description,
      leadId: args.leadId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("teams"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    leadId: v.optional(v.id("users")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Team not found");

    if (fields.code && fields.code !== existing.code) {
      const dup = await ctx.db
        .query("teams")
        .withIndex("by_code", (q) => q.eq("code", fields.code!))
        .first();
      if (dup) throw new Error(`Team code "${fields.code}" already exists`);
    }

    await ctx.db.patch(id, fields);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("teams") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.delete(args.id);
  },
});
