import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "../_generated/server";

// ─── Queries ───

export const list = query({
  args: {
    search: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let orgs = await ctx.db.query("organizations").collect();

    if (args.isActive !== undefined) {
      orgs = orgs.filter((o) => o.isActive === args.isActive);
    }

    if (args.search && args.search.trim()) {
      const q = args.search.toLowerCase();
      orgs = orgs.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.code.toLowerCase().includes(q) ||
          (o.email && o.email.toLowerCase().includes(q)),
      );
    }

    return orgs.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getById = query({
  args: { id: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ─── Mutations ───

export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    taxId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (existing) throw new Error(`Organization code "${args.code}" already exists`);

    return await ctx.db.insert("organizations", {
      name: args.name,
      code: args.code,
      email: args.email,
      phone: args.phone,
      address: args.address,
      taxId: args.taxId,
      isActive: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("organizations"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    taxId: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Organization not found");

    if (fields.code && fields.code !== existing.code) {
      const dup = await ctx.db
        .query("organizations")
        .withIndex("by_code", (q) => q.eq("code", fields.code!))
        .first();
      if (dup) throw new Error(`Organization code "${fields.code}" already exists`);
    }

    await ctx.db.patch(id, fields);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("organizations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const branches = await ctx.db
      .query("branches")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.id))
      .collect();
    if (branches.length > 0) {
      throw new Error(
        "Cannot delete organization with existing branches. Remove branches first.",
      );
    }

    await ctx.db.delete(args.id);
  },
});
