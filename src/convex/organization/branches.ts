import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "../_generated/server";

// ─── Queries ───

export const listByOrganization = query({
  args: {
    organizationId: v.id("organizations"),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let branches = await ctx.db
      .query("branches")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    if (args.search && args.search.trim()) {
      const q = args.search.toLowerCase();
      branches = branches.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.code.toLowerCase().includes(q),
      );
    }

    return branches.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getById = query({
  args: { id: v.id("branches") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ─── Mutations ───

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    code: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("branches")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (existing) throw new Error(`Branch code "${args.code}" already exists`);

    const now = Date.now();
    return await ctx.db.insert("branches", {
      organizationId: args.organizationId,
      name: args.name,
      code: args.code,
      email: args.email,
      phone: args.phone,
      address: args.address,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("branches"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Branch not found");

    if (fields.code && fields.code !== existing.code) {
      const dup = await ctx.db
        .query("branches")
        .withIndex("by_code", (q) => q.eq("code", fields.code!))
        .first();
      if (dup) throw new Error(`Branch code "${fields.code}" already exists`);
    }

    await ctx.db.patch(id, fields);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("branches") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const departments = await ctx.db
      .query("departments")
      .withIndex("by_branch", (q) => q.eq("branchId", args.id))
      .collect();
    if (departments.length > 0) {
      throw new Error("Cannot delete branch with existing departments.");
    }

    await ctx.db.delete(args.id);
  },
});
