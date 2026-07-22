import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  { name: "Education", code: "EDU", sector: "Education", description: "Educational institutions and training", color: "#4285f4", icon: "GraduationCap" },
  { name: "Healthcare", code: "HEALTH", sector: "Healthcare", description: "Healthcare and medical services", color: "#34a853", icon: "Heart" },
  { name: "Technology", code: "TECH", sector: "Technology", description: "IT and technology companies", color: "#a855f7", icon: "Monitor" },
  { name: "Finance", code: "FIN", sector: "Finance", description: "Financial services and banking", color: "#f59e0b", icon: "Building2" },
  { name: "Manufacturing", code: "MFG", sector: "Manufacturing", description: "Industrial manufacturing", color: "#ea4335", icon: "Building" },
  { name: "Retail", code: "RETAIL", sector: "Retail", description: "Retail and e-commerce", color: "#0d9488", icon: "Globe" },
  { name: "Real Estate", code: "RE", sector: "Real Estate", description: "Real estate and property", color: "#06b6d4", icon: "Home" },
  { name: "Hospitality", code: "HOSP", sector: "Hospitality", description: "Hotels, restaurants, and tourism", color: "#4f46e5", icon: "Star" },
  { name: "Government", code: "GOV", sector: "Government", description: "Government agencies and public sector", color: "#5f6368", icon: "Shield" },
  { name: "Non-Profit", code: "NGO", sector: "Non-Profit", description: "Non-profit and charitable organizations", color: "#22c55e", icon: "HeartHandshake" },
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
      .query("crmIndustries")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (const data of SEED_DATA) {
      await ctx.db.insert("crmIndustries", baseFields(data, count));
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
    sector: v.string(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("crmIndustries")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("crmIndustries", {
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
    id: v.id("crmIndustries"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    sector: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Industry not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("crmIndustries") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Industry not found");
    await ctx.db.delete(args.id);
  },
});

export const duplicate = mutation({
  args: { id: v.id("crmIndustries") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("Industry not found");
    const all = await ctx.db
      .query("crmIndustries")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("crmIndustries", {
      name: `${source.name} (Copy)`,
      code: `${source.code}_COPY`,
      sector: source.sector,      sequence: maxSeq + 1,
      active: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const reorder = mutation({
  args: { orderedIds: v.array(v.id("crmIndustries")) },
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
    return ctx.db.query("crmIndustries").withIndex("sequence").collect();
  },
});

export const get = query({
  args: { id: v.id("crmIndustries") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
