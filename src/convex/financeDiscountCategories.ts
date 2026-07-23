import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  { name: "Merit Scholarship", code: "MERIT", discountType: "Merit Discount", isPercentage: true, maxValue: 50, description: "Academic merit-based scholarship", color: "#4285f4", icon: "Award" },
  { name: "Need-based Waiver", code: "NEED", discountType: "Need-based Waiver", isPercentage: true, maxValue: 100, description: "Financial need-based fee waiver", color: "#34a853", icon: "Heart" },
  { name: "Sibling Discount", code: "SIBLING", discountType: "Sibling Discount", isPercentage: true, maxValue: 25, description: "Discount for siblings enrolled", color: "#a855f7", icon: "Users" },
  { name: "Early Bird", code: "EARLY", discountType: "Early Bird", isPercentage: true, maxValue: 15, description: "Early enrollment discount", color: "#f59e0b", icon: "Clock" },
  { name: "Corporate Discount", code: "CORP", discountType: "Corporate Discount", isPercentage: true, maxValue: 20, description: "Corporate partner employee discount", color: "#0d9488", icon: "Building2" },
  { name: "Staff Discount", code: "STAFF", discountType: "Staff Discount", isPercentage: true, maxValue: 30, description: "Employee family discount", color: "#06b6d4", icon: "UserCheck" },
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
      .query("financeDiscountCategories")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (const data of SEED_DATA) {
      await ctx.db.insert("financeDiscountCategories", baseFields(data, count));
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
    discountType: v.string(),
    isPercentage: v.boolean(),
    maxValue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("financeDiscountCategories")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("financeDiscountCategories", {
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
    id: v.id("financeDiscountCategories"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    discountType: v.optional(v.string()),
    isPercentage: v.optional(v.boolean()),
    maxValue: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("DiscountCategory not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("financeDiscountCategories") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("DiscountCategory not found");
    await ctx.db.delete(args.id);
  },
});

export const duplicate = mutation({
  args: { id: v.id("financeDiscountCategories") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("DiscountCategory not found");
    const all = await ctx.db
      .query("financeDiscountCategories")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("financeDiscountCategories", {
      name: `${source.name} (Copy)`,
      code: `${source.code}_COPY`,
      discountType: source.discountType,
      isPercentage: source.isPercentage,
      maxValue: source.maxValue,
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
  args: { orderedIds: v.array(v.id("financeDiscountCategories")) },
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
    return ctx.db.query("financeDiscountCategories").withIndex("sequence").collect();
  },
});

export const get = query({
  args: { id: v.id("financeDiscountCategories") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
