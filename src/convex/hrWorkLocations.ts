import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  { name: "Head Office", code: "HO", locationType: "Office", city: "Dubai", country: "UAE", description: "Main headquarters", color: "#4285f4", icon: "Building" },
  { name: "Campus A", code: "CAMP_A", locationType: "Campus", city: "Dubai", country: "UAE", description: "Primary academic campus", color: "#34a853", icon: "School" },
  { name: "Branch Office", code: "BO", locationType: "Office", city: "Abu Dhabi", country: "UAE", description: "Regional branch office", color: "#a855f7", icon: "Building2" },
  { name: "Remote", code: "REMOTE", locationType: "Remote", city: "", country: "", description: "Remote work location", color: "#f59e0b", icon: "Wifi" },
  { name: "Client Site", code: "CLIENT", locationType: "Client Site", city: "", country: "", description: "On-site at client location", color: "#e8710a", icon: "Briefcase" },
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
      .query("hrWorkLocations")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (const data of SEED_DATA) {
      await ctx.db.insert("hrWorkLocations", baseFields(data, count));
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
    locationType: v.string(),
    city: v.string(),
    country: v.string(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("hrWorkLocations")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("hrWorkLocations", {
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
    id: v.id("hrWorkLocations"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    locationType: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("WorkLocation not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("hrWorkLocations") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("WorkLocation not found");
    await ctx.db.delete(args.id);
  },
});

export const duplicate = mutation({
  args: { id: v.id("hrWorkLocations") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("WorkLocation not found");
    const all = await ctx.db
      .query("hrWorkLocations")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("hrWorkLocations", {
      name: `${source.name} (Copy)`,
      code: `${source.code}_COPY`,      sequence: maxSeq + 1,
      active: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const reorder = mutation({
  args: { orderedIds: v.array(v.id("hrWorkLocations")) },
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
    return ctx.db.query("hrWorkLocations").withIndex("sequence").collect();
  },
});

export const get = query({
  args: { id: v.id("hrWorkLocations") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
