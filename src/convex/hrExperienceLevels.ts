import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  { name: "Entry Level", code: "ENTRY", minYears: 0, maxYears: 1, description: "Less than 1 year of experience", color: "#34a853", icon: "TrendingUp" },
  { name: "Junior", code: "JR", minYears: 1, maxYears: 3, description: "1-3 years of experience", color: "#4285f4", icon: "TrendingUp" },
  { name: "Mid Level", code: "MID", minYears: 3, maxYears: 5, description: "3-5 years of experience", color: "#f59e0b", icon: "TrendingUp" },
  { name: "Senior", code: "SR", minYears: 5, maxYears: 8, description: "5-8 years of experience", color: "#e8710a", icon: "Award" },
  { name: "Lead", code: "LEAD", minYears: 8, maxYears: 12, description: "8-12 years of experience", color: "#a855f7", icon: "Award" },
  { name: "Principal", code: "PRIN", minYears: 12, maxYears: 15, description: "12-15 years of experience", color: "#4f46e5", icon: "Award" },
  { name: "Executive", code: "EXEC", minYears: 15, maxYears: 0, description: "15+ years of experience", color: "#d4a017", icon: "Star" },
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
      .query("hrExperienceLevels")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (const data of SEED_DATA) {
      await ctx.db.insert("hrExperienceLevels", baseFields(data, count));
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
    minYears: v.number(),
    maxYears: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("hrExperienceLevels")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("hrExperienceLevels", {
      ...args,
      description: args.description ?? "",
      minYears: source.minYears,
      maxYears: source.maxYears,

      sequence: maxSeq + 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("hrExperienceLevels"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    minYears: v.optional(v.number()),
    maxYears: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("ExperienceLevel not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("hrExperienceLevels") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("ExperienceLevel not found");
    await ctx.db.delete(args.id);
  },
});

export const duplicate = mutation({
  args: { id: v.id("hrExperienceLevels") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("ExperienceLevel not found");
    const all = await ctx.db
      .query("hrExperienceLevels")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("hrExperienceLevels", {
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
  args: { orderedIds: v.array(v.id("hrExperienceLevels")) },
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
    return ctx.db.query("hrExperienceLevels").withIndex("sequence").collect();
  },
});

export const get = query({
  args: { id: v.id("hrExperienceLevels") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
