import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  { name: "FY 2023-24", code: "FY2324", startDate: 1680307200000, endDate: 1711843199000, isCurrent: false, isClosed: true, description: "Financial year April 2023 - March 2024", color: "#9aa0a6", icon: "Calendar" },
  { name: "FY 2024-25", code: "FY2425", startDate: 1711843200000, endDate: 1743379199000, isCurrent: false, isClosed: true, description: "Financial year April 2024 - March 2025", color: "#4285f4", icon: "Calendar" },
  { name: "FY 2025-26", code: "FY2526", startDate: 1743379200000, endDate: 1774915199000, isCurrent: true, isClosed: false, description: "Current financial year", color: "#34a853", icon: "Calendar" },
  { name: "FY 2026-27", code: "FY2627", startDate: 1774915200000, endDate: 1806451199000, isCurrent: false, isClosed: false, description: "Next financial year", color: "#a855f7", icon: "Calendar" },
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
      .query("financeFinancialYears")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (const data of SEED_DATA) {
      await ctx.db.insert("financeFinancialYears", baseFields(data, count));
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
    startDate: v.number(),
    endDate: v.number(),
    isCurrent: v.boolean(),
    isClosed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("financeFinancialYears")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("financeFinancialYears", {
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
    id: v.id("financeFinancialYears"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    isCurrent: v.optional(v.boolean()),
    isClosed: v.optional(v.boolean()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("FinancialYear not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("financeFinancialYears") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("FinancialYear not found");
    await ctx.db.delete(args.id);
  },
});

export const duplicate = mutation({
  args: { id: v.id("financeFinancialYears") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("FinancialYear not found");
    const all = await ctx.db
      .query("financeFinancialYears")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("financeFinancialYears", {
      name: `${source.name} (Copy)`,
      code: `${source.code}_COPY`,
      startDate: source.startDate,
      endDate: source.endDate,
      isCurrent: source.isCurrent,
      isClosed: source.isClosed,
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
  args: { orderedIds: v.array(v.id("financeFinancialYears")) },
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
    return ctx.db.query("financeFinancialYears").withIndex("sequence").collect();
  },
});

export const get = query({
  args: { id: v.id("financeFinancialYears") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
