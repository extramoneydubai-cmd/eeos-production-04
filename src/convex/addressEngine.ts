import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ─── Address CRUD ───────────────────────────────────────

export const addAddress = mutation({
  args: { token: v.optional(v.string()),
    personId: v.id("personMaster"),
    addressType: v.union(
      v.literal("home"),
      v.literal("office"),
      v.literal("billing"),
      v.literal("shipping"),
      v.literal("permanent"),
      v.literal("current"),
      v.literal("emergency"),
    ),
    line1: v.optional(v.string()),
    line2: v.optional(v.string()),
    area: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    isPrimary: v.optional(v.boolean()),
    label: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "create", module: "people", entity: "addressEngine" }, async (ctx, args) => {
    const now = Date.now();
    const isPrimary = args.isPrimary || false;

    // If setting as primary, unset others
    if (isPrimary) {
      const existing = await ctx.db
        .query("addresses")
        .withIndex("personId", (q: any) => q.eq("personId", args.personId))
        .collect();
      for (const addr of existing) {
        if (addr.isPrimary) {
          await ctx.db.patch(addr._id, { isPrimary: false, updatedAt: now });
        }
      }
    }

    return await ctx.db.insert("addresses", {
      personId: args.personId,
      addressType: args.addressType,
      line1: args.line1,
      line2: args.line2,
      area: args.area,
      city: args.city,
      state: args.state,
      country: args.country,
      postalCode: args.postalCode,
      latitude: args.latitude,
      longitude: args.longitude,
      isPrimary,
      label: args.label,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const updateAddress = mutation({
  args: { token: v.optional(v.string()),
    addressId: v.id("addresses"),
    addressType: v.optional(
      v.union(
        v.literal("home"),
        v.literal("office"),
        v.literal("billing"),
        v.literal("shipping"),
        v.literal("permanent"),
        v.literal("current"),
        v.literal("emergency"),
      )
    ),
    line1: v.optional(v.string()),
    line2: v.optional(v.string()),
    area: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    isPrimary: v.optional(v.boolean()),
    label: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "people", entity: "addressEngine" }, async (ctx, args) => {
    const { token: _token, addressId, ...fields } = args;
    const existing = await ctx.db.get(addressId);
    if (!existing) throw new Error("Address not found");

    const now = Date.now();
    const updates: Record<string, any> = { updatedAt: now };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }

    // If setting as primary, unset others
    if (args.isPrimary) {
      const allAddresses = await ctx.db
        .query("addresses")
        .withIndex("personId", (q: any) => q.eq("personId", existing.personId))
        .collect();
      for (const addr of allAddresses) {
        if (addr._id !== addressId && addr.isPrimary) {
          await ctx.db.patch(addr._id, { isPrimary: false, updatedAt: now });
        }
      }
    }

    await ctx.db.patch(addressId, updates);
    return addressId;
  }),
});

export const removeAddress = mutation({
  args: { token: v.optional(v.string()), addressId: v.id("addresses") },
  handler: withScopeAndEvents({ operation: "delete", module: "people", entity: "addressEngine" }, async (ctx, args) => {
    const existing = await ctx.db.get(args.addressId);
    if (!existing) throw new Error("Address not found");
    await ctx.db.delete(args.addressId);
    return args.addressId;
  }),
});

export const setPrimaryAddress = mutation({
  args: { token: v.optional(v.string()),
    personId: v.id("personMaster"),
    addressId: v.id("addresses"),
  },
  handler: withScopeAndEvents({ operation: "update", module: "people", entity: "addressEngine" }, async (ctx, args) => {
    const now = Date.now();
    const allAddresses = await ctx.db
      .query("addresses")
      .withIndex("personId", (q: any) => q.eq("personId", args.personId))
      .collect();

    for (const addr of allAddresses) {
      await ctx.db.patch(addr._id, {
        isPrimary: addr._id === args.addressId,
        updatedAt: now,
      });
    }
    return args.addressId;
  }),
});

// ─── Queries ────────────────────────────────────────────

export const listAddresses = query({
  args: {
    personId: v.id("personMaster"),
    addressType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("addresses")
      .withIndex("personId", (q) => q.eq("personId", args.personId));

    if (args.addressType) {
      query = query.filter((q) => q.eq(q.field("addressType"), args.addressType));
    }

    return await query.collect();
  },
});

export const getPrimaryAddress = query({
  args: { personId: v.id("personMaster") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("addresses")
      .withIndex("personId", (q) => q.eq("personId", args.personId))
      .filter((q) => q.eq(q.field("isPrimary"), true))
      .first();
  },
});
