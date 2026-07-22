import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "../_generated/server";

// ─── Queries ───

export const listByBranch = query({
  args: {
    branchId: v.id("branches"),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let departments = await ctx.db
      .query("departments")
      .withIndex("by_branch", (q) => q.eq("branchId", args.branchId))
      .collect();

    if (args.search && args.search.trim()) {
      const q = args.search.toLowerCase();
      departments = departments.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.code.toLowerCase().includes(q),
      );
    }

    return departments.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getById = query({
  args: { id: v.id("departments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ─── Mutations ───

export const create = mutation({
  args: {
    branchId: v.id("branches"),
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    managerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("departments")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (existing) throw new Error(`Department code "${args.code}" already exists`);

    const now = Date.now();
    return await ctx.db.insert("departments", {
      branchId: args.branchId,
      name: args.name,
      code: args.code,
      description: args.description,
      managerId: args.managerId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("departments"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    managerId: v.optional(v.id("users")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Department not found");

    if (fields.code && fields.code !== existing.code) {
      const dup = await ctx.db
        .query("departments")
        .withIndex("by_code", (q) => q.eq("code", fields.code!))
        .first();
      if (dup) throw new Error(`Department code "${fields.code}" already exists`);
    }

    await ctx.db.patch(id, fields);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("departments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_department", (q) => q.eq("departmentId", args.id))
      .collect();
    if (teams.length > 0) {
      throw new Error("Cannot delete department with existing teams.");
    }

    await ctx.db.delete(args.id);
  },
});
