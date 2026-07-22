import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  { name: "Tuition Fee", code: "TUITION", feeType: "Tuition", isRecurring: true, isOptional: false, isRefundable: false, description: "Standard tuition fee per term", color: "#4285f4", icon: "GraduationCap" },
  { name: "Admission Fee", code: "ADMISSION", feeType: "Admission", isRecurring: false, isOptional: false, isRefundable: false, description: "One-time admission processing fee", color: "#34a853", icon: "FileText" },
  { name: "Hostel Fee", code: "HOSTEL", feeType: "Hostel", isRecurring: true, isOptional: true, isRefundable: false, description: "Hostel accommodation fee", color: "#a855f7", icon: "Home" },
  { name: "Transport Fee", code: "TRANSPORT", feeType: "Transport", isRecurring: true, isOptional: true, isRefundable: false, description: "Transport service fee", color: "#f59e0b", icon: "Bus" },
  { name: "Library Fee", code: "LIBRARY", feeType: "Library", isRecurring: true, isOptional: false, isRefundable: false, description: "Library and learning resource fee", color: "#0d9488", icon: "BookOpen" },
  { name: "Sports Fee", code: "SPORTS", feeType: "Sports", isRecurring: true, isOptional: true, isRefundable: false, description: "Sports and recreation fee", color: "#06b6d4", icon: "Award" },
  { name: "Development Fee", code: "DEV", feeType: "Development", isRecurring: false, isOptional: false, isRefundable: false, description: "Infrastructure development fee", color: "#4f46e5", icon: "Building" },
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
      .query("financeFeeCategories")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (const data of SEED_DATA) {
      await ctx.db.insert("financeFeeCategories", baseFields(data, count));
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
    feeType: v.string(),
    isRecurring: v.boolean(),
    isOptional: v.boolean(),
    isRefundable: v.boolean(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("financeFeeCategories")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("financeFeeCategories", {
      ...args,
      description: args.description ?? "",
      feeType: source.feeType,
      isRecurring: source.isRecurring,
      isOptional: source.isOptional,
      isRefundable: source.isRefundable,

      sequence: maxSeq + 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("financeFeeCategories"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    feeType: v.optional(v.string()),
    isRecurring: v.optional(v.boolean()),
    isOptional: v.optional(v.boolean()),
    isRefundable: v.optional(v.boolean()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("FeeCategory not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("financeFeeCategories") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("FeeCategory not found");
    await ctx.db.delete(args.id);
  },
});

export const duplicate = mutation({
  args: { id: v.id("financeFeeCategories") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("FeeCategory not found");
    const all = await ctx.db
      .query("financeFeeCategories")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("financeFeeCategories", {
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
  args: { orderedIds: v.array(v.id("financeFeeCategories")) },
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
    return ctx.db.query("financeFeeCategories").withIndex("sequence").collect();
  },
});

export const get = query({
  args: { id: v.id("financeFeeCategories") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
