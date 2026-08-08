import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  {
    name: "Hot",
    code: "HOT",
    minimumScore: 80,
    maximumScore: 100,
    description: "High-intent lead ready for immediate conversion",
    color: "#ea4335",
    icon: "Flame",
  },
  {
    name: "Warm",
    code: "WARM",
    minimumScore: 50,
    maximumScore: 79,
    description: "Interested lead requiring nurturing and follow-up",
    color: "#fbbc04",
    icon: "Sun",
  },
  {
    name: "Cold",
    code: "COLD",
    minimumScore: 0,
    maximumScore: 49,
    description: "Low-intent lead requiring further engagement",
    color: "#4285f4",
    icon: "Snowflake",
  },
  {
    name: "Qualified",
    code: "QUALIFIED",
    minimumScore: 60,
    maximumScore: 100,
    description: "Lead has met the basic qualification criteria",
    color: "#34a853",
    icon: "BadgeCheck",
  },
  {
    name: "Marketing Qualified Lead",
    code: "MQL",
    minimumScore: 40,
    maximumScore: 69,
    description: "Lead identified by marketing as having potential",
    color: "#a855f7",
    icon: "Megaphone",
  },
  {
    name: "Sales Qualified Lead",
    code: "SQL",
    minimumScore: 70,
    maximumScore: 100,
    description: "Lead vetted by sales team as ready for engagement",
    color: "#4f46e5",
    icon: "Briefcase",
  },
  {
    name: "Opportunity",
    code: "OPPORTUNITY",
    minimumScore: 85,
    maximumScore: 100,
    description: "High-value lead with strong conversion potential",
    color: "#0d9488",
    icon: "Target",
  },
  {
    name: "Converted",
    code: "CONVERTED",
    minimumScore: 100,
    maximumScore: 100,
    description: "Lead has been successfully converted to enrollment",
    color: "#1a73e8",
    icon: "Award",
  },
];

/* ────────────
   HELPERS
   ──────────── */

function baseFields(data: (typeof SEED_DATA)[number], sequence: number) {
  return {
    name: data.name,
    code: data.code,
    minimumScore: data.minimumScore,
    maximumScore: data.maximumScore,
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
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmLeadQualification" }, async (ctx) => {
    const existing = await ctx.db
      .query("crmLeadQualification")
      .withIndex("sequence")
      .collect();

    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };

    let count = 0;
    for (let i = 0; i < SEED_DATA.length; i++) {
      await ctx.db.insert("crmLeadQualification", baseFields(SEED_DATA[i], i));
      count++;
    }
    return { seeded: count };
  }),
});

export const createLeadQualification = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    minimumScore: v.optional(v.number()),
    maximumScore: v.optional(v.number()),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmLeadQualification" }, async (ctx, args) => {
    const all = await ctx.db
      .query("crmLeadQualification")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m: any, r: any) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("crmLeadQualification", {
      ...args,
      description: args.description ?? "",
      sequence: maxSeq + 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const updateLeadQualification = mutation({
  args: { token: v.optional(v.string()),
    id: v.id("crmLeadQualification"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    minimumScore: v.optional(v.number()),
    maximumScore: v.optional(v.number()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmLeadQualification" }, async (ctx, args) => {
    const { token: _token, id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Lead qualification not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  }),
});

export const deleteLeadQualification = mutation({
  args: { token: v.optional(v.string()), id: v.id("crmLeadQualification") },
  handler: withScopeAndEvents({ operation: "delete", module: "crm", entity: "crmLeadQualification" }, async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Lead qualification not found");
    await ctx.db.delete(args.id);
  }),
});

export const duplicateLeadQualification = mutation({
  args: { token: v.optional(v.string()), id: v.id("crmLeadQualification") },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmLeadQualification" }, async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("Lead qualification not found");
    const all = await ctx.db
      .query("crmLeadQualification")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m: any, r: any) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("crmLeadQualification", {
      name: `${source.name} (Copy)`,
      code: `${source.code}_COPY`,
      minimumScore: source.minimumScore,
      maximumScore: source.maximumScore,
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

export const reorderLeadQualifications = mutation({
  args: { token: v.optional(v.string()),
    orderedIds: v.array(v.id("crmLeadQualification")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmLeadQualification" }, async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], {
        sequence: i,
        updatedAt: Date.now(),
      });
    }
  }),
});

/* ────────────
   QUERIES
   ──────────── */

export const listLeadQualifications = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("crmLeadQualification")
      .withIndex("sequence")
      .collect();
  },
});

export const getLeadQualification = query({
  args: { id: v.id("crmLeadQualification") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
