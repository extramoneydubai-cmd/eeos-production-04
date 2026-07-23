import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  { name: "Nil", code: "SLAB_NIL", slabType: "GST", fromAmount: 0, toAmount: 0, taxRate: 0, description: "Nil tax rate", color: "#9aa0a6", icon: "Percent" },
  { name: "5% GST", code: "SLAB_5", slabType: "GST", fromAmount: 0, toAmount: 999999, taxRate: 5, description: "5% GST on essential goods", color: "#4285f4", icon: "Percent" },
  { name: "12% GST", code: "SLAB_12", slabType: "GST", fromAmount: 0, toAmount: 999999, taxRate: 12, description: "12% GST on standard goods", color: "#a855f7", icon: "Percent" },
  { name: "18% GST", code: "SLAB_18", slabType: "GST", fromAmount: 0, toAmount: 999999, taxRate: 18, description: "18% GST on most services", color: "#f59e0b", icon: "Percent" },
  { name: "28% GST", code: "SLAB_28", slabType: "GST", fromAmount: 0, toAmount: 999999, taxRate: 28, description: "28% GST on luxury goods", color: "#ea4335", icon: "Percent" },
];

/* ────────────
   HELPERS
   ──────────── */

function baseFields(data: (typeof SEED_DATA)[number], sequence: number) {
  return {
    ...data,
    sequence,
    active: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/* ────────────
   MUTATIONS
   ──────────── */

export const seedDefault = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("salesTaxSlabs")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (const data of SEED_DATA) {
      await ctx.db.insert("salesTaxSlabs", baseFields(data, count));
      count++;
    }
    return { seeded: count };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    slabType: v.optional(v.string()),
    fromAmount: v.optional(v.number()),
    toAmount: v.optional(v.number()),
    taxRate: v.number(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("salesTaxSlabs")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("salesTaxSlabs", {
      ...args,
      description: args.description ?? "",


      sequence: maxSeq + 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("salesTaxSlabs"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("TaxSlab not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("salesTaxSlabs") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("TaxSlab not found");
    await ctx.db.delete(args.id);
  },
});

export const duplicate = mutation({
  args: { id: v.id("salesTaxSlabs") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("TaxSlab not found");
    const all = await ctx.db
      .query("salesTaxSlabs")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("salesTaxSlabs", {
      name: `${source.name} (Copy)`,
      code: `${source.code}_COPY`,
      slabType: source.slabType,
      fromAmount: source.fromAmount,
      toAmount: source.toAmount,
      taxRate: source.taxRate,
      color: source.color,
      icon: source.icon,
      sequence: maxSeq + 1,
      active: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const reorder = mutation({
  args: { orderedIds: v.array(v.id("salesTaxSlabs")) },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { sequence: i, updatedAt: Date.now() });
    }
  },
});

/* ────────────
   QUERIES
   ──────────── */

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("salesTaxSlabs").withIndex("sequence").collect();
  },
});

export const get = query({
  args: { id: v.id("salesTaxSlabs") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
