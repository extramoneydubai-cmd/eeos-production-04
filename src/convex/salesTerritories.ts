import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  { name: "Dubai", code: "TER_DXB", territoryType: "City", description: "Dubai and surrounding areas", color: "#ea4335", icon: "MapPin" },
  { name: "Abu Dhabi", code: "TER_AUH", territoryType: "City", description: "Abu Dhabi and Al Gharbia", color: "#4285f4", icon: "MapPin" },
  { name: "Sharjah", code: "TER_SHJ", territoryType: "Emirate", description: "Sharjah emirate", color: "#34a853", icon: "MapPin" },
  { name: "Ajman", code: "TER_AJM", territoryType: "Emirate", description: "Ajman emirate", color: "#f59e0b", icon: "MapPin" },
  { name: "Al Ain", code: "TER_AIN", territoryType: "City", description: "Al Ain region", color: "#a855f7", icon: "MapPin" },
  { name: "Northern Emirates", code: "TER_NORTH", territoryType: "Region", description: "RAK, Fujairah, Umm Al Quwain", color: "#0d9488", icon: "Map" },
  { name: "India", code: "TER_IND", territoryType: "Country", description: "India market", color: "#1a73e8", icon: "Globe" },
  { name: "International", code: "TER_INTL", territoryType: "International", description: "International markets outside UAE/India", color: "#4f46e5", icon: "Globe" },
  { name: "Online", code: "TER_ONLINE", territoryType: "Digital", description: "Online and virtual sales", color: "#06b6d4", icon: "Wifi" },
  { name: "Corporate", code: "TER_CORP", territoryType: "Corporate", description: "Corporate and B2B accounts", color: "#5f6368", icon: "Building2" },
];

/* ────────────
   HELPERS
   ──────────── */

function baseFields(data: (typeof SEED_DATA)[number], sequence: number) {
  return {
    name: data.name,
    code: data.code,
    territoryType: data.territoryType,
    description: data.description,
    color: data.color,
    icon: data.icon,
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
  args: { token: v.optional(v.string()),},
  handler: withScopeAndEvents({ operation: "create", module: "sales", entity: "salesTerritories" }, async (ctx) => {
    const existing = await ctx.db
      .query("salesTerritories")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (let i = 0; i < SEED_DATA.length; i++) {
      await ctx.db.insert("salesTerritories", baseFields(SEED_DATA[i], i));
      count++;
    }
    return { seeded: count };
  }),
});

export const createTerritory = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    territoryType: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "sales", entity: "salesTerritories" }, async (ctx, args) => {
    const all = await ctx.db
      .query("salesTerritories")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m: any, r: any) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("salesTerritories", {
      ...args,
      description: args.description ?? "",
      sequence: maxSeq + 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const updateTerritory = mutation({
  args: { token: v.optional(v.string()),
    id: v.id("salesTerritories"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    territoryType: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "sales", entity: "salesTerritories" }, async (ctx, args) => {
    const { token: _token, id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Territory not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  }),
});

export const deleteTerritory = mutation({
  args: { token: v.optional(v.string()), id: v.id("salesTerritories") },
  handler: withScopeAndEvents({ operation: "delete", module: "sales", entity: "salesTerritories" }, async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Territory not found");
    await ctx.db.delete(args.id);
  }),
});

export const duplicateTerritory = mutation({
  args: { token: v.optional(v.string()), id: v.id("salesTerritories") },
  handler: withScopeAndEvents({ operation: "create", module: "sales", entity: "salesTerritories" }, async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("Territory not found");
    const all = await ctx.db
      .query("salesTerritories")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m: any, r: any) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("salesTerritories", {
      name: `${source.name} (Copy)`,
      code: `${source.code}_COPY`,
      territoryType: source.territoryType,
      description: source.description,
      color: source.color,
      icon: source.icon,
      sequence: maxSeq + 1,
      active: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const reorderTerritories = mutation({
  args: { token: v.optional(v.string()), orderedIds: v.array(v.id("salesTerritories")) },
  handler: withScopeAndEvents({ operation: "update", module: "sales", entity: "salesTerritories" }, async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { sequence: i, updatedAt: Date.now() });
    }
  }),
});

/* ────────────
   QUERIES
   ──────────── */

export const listTerritories = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("salesTerritories").withIndex("sequence").collect();
  },
});

export const getTerritory = query({
  args: { id: v.id("salesTerritories") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
