import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  { name: "Income Tax", code: "IT", taxCategory: "Direct", taxRate: 0, isCompound: false, description: "Corporate income tax", color: "#ea4335", icon: "Percent" },
  { name: "VAT", code: "VAT", taxCategory: "Indirect", taxRate: 5, isCompound: false, description: "Value Added Tax at 5%", color: "#4285f4", icon: "Percent" },
  { name: "GST", code: "GST", taxCategory: "Indirect", taxRate: 18, isCompound: false, description: "Goods and Services Tax", color: "#34a853", icon: "Percent" },
  { name: "Withholding Tax", code: "WHT", taxCategory: "Withholding", taxRate: 10, isCompound: false, description: "Withholding tax on payments", color: "#a855f7", icon: "Percent" },
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
      .query("financeTaxTypes")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (const data of SEED_DATA) {
      await ctx.db.insert("financeTaxTypes", baseFields(data, count));
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
    taxCategory: v.string(),
    taxRate: v.number(),
    isCompound: v.boolean(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("financeTaxTypes")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("financeTaxTypes", {
      ...args,
      description: args.description ?? "",
      taxCategory: source.taxCategory,
      taxRate: source.taxRate,
      isCompound: source.isCompound,

      sequence: maxSeq + 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("financeTaxTypes"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    taxCategory: v.optional(v.string()),
    taxRate: v.optional(v.number()),
    isCompound: v.optional(v.boolean()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("TaxType not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("financeTaxTypes") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("TaxType not found");
    await ctx.db.delete(args.id);
  },
});

export const duplicate = mutation({
  args: { id: v.id("financeTaxTypes") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("TaxType not found");
    const all = await ctx.db
      .query("financeTaxTypes")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("financeTaxTypes", {
      name: `${source.name} (Copy)`,
      code: `${source.code}_COPY`,
      color: source.color,
      icon: source.icon,
      description: source.description,
      sequence: maxSeq + 1,
      active: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const reorder = mutation({
  args: { orderedIds: v.array(v.id("financeTaxTypes")) },
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
    return ctx.db.query("financeTaxTypes").withIndex("sequence").collect();
  },
});

export const get = query({
  args: { id: v.id("financeTaxTypes") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
