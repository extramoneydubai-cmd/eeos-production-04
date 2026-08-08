import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  { name: "Qualified", code: "STG_QLFD", stageOrder: 1, probability: 10, isClosed: false, description: "Lead has been qualified and moved to sales pipeline", color: "#4285f4", icon: "BadgeCheck" },
  { name: "Needs Analysis", code: "STG_NEEDS", stageOrder: 2, probability: 20, isClosed: false, description: "Understanding the lead's specific requirements and pain points", color: "#4f46e5", icon: "Search" },
  { name: "Proposal", code: "STG_PROP", stageOrder: 3, probability: 40, isClosed: false, description: "Proposal or quotation has been presented to the lead", color: "#a855f7", icon: "FileText" },
  { name: "Negotiation", code: "STG_NEG", stageOrder: 4, probability: 60, isClosed: false, description: "Negotiating terms, pricing, and conditions", color: "#f59e0b", icon: "Handshake" },
  { name: "Fee Discussion", code: "STG_FEE", stageOrder: 5, probability: 70, isClosed: false, description: "Discussing fee structure, payment plans, and discounts", color: "#0d9488", icon: "DollarSign" },
  { name: "Approval Pending", code: "STG_APPROVAL", stageOrder: 6, probability: 85, isClosed: false, description: "Awaiting internal approval or management sign-off", color: "#06b6d4", icon: "Clock" },
  { name: "Won", code: "STG_WON", stageOrder: 7, probability: 100, isClosed: true, description: "Deal successfully closed and converted", color: "#34a853", icon: "Award" },
  { name: "Lost", code: "STG_LOST", stageOrder: 8, probability: 0, isClosed: true, description: "Deal lost to competitor or lead not interested", color: "#ea4335", icon: "XCircle" },
  { name: "On Hold", code: "STG_HOLD", stageOrder: 9, probability: 50, isClosed: false, description: "Deal paused — lead may resume at a later date", color: "#f97316", icon: "PauseCircle" },
  { name: "Cancelled", code: "STG_CANCEL", stageOrder: 10, probability: 0, isClosed: true, description: "Deal cancelled by lead or internal decision", color: "#5f6368", icon: "Ban" },
];

/* ────────────
   HELPERS
   ──────────── */

function baseFields(data: (typeof SEED_DATA)[number], sequence: number) {
  return {
    name: data.name,
    code: data.code,
    stageOrder: data.stageOrder,
    probability: data.probability,
    isClosed: data.isClosed,
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
  handler: withScopeAndEvents({ operation: "create", module: "sales", entity: "salesOpportunityStages" }, async (ctx) => {
    const existing = await ctx.db
      .query("salesOpportunityStages")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (let i = 0; i < SEED_DATA.length; i++) {
      await ctx.db.insert("salesOpportunityStages", baseFields(SEED_DATA[i], i));
      count++;
    }
    return { seeded: count };
  }),
});

export const createOpportunityStage = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    stageOrder: v.number(),
    probability: v.number(),
    isClosed: v.boolean(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "sales", entity: "salesOpportunityStages" }, async (ctx, args) => {
    const all = await ctx.db
      .query("salesOpportunityStages")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m: any, r: any) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("salesOpportunityStages", {
      ...args,
      description: args.description ?? "",
      sequence: maxSeq + 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const updateOpportunityStage = mutation({
  args: { token: v.optional(v.string()),
    id: v.id("salesOpportunityStages"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    stageOrder: v.optional(v.number()),
    probability: v.optional(v.number()),
    isClosed: v.optional(v.boolean()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "sales", entity: "salesOpportunityStages" }, async (ctx, args) => {
    const { token: _token, id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Opportunity stage not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  }),
});

export const deleteOpportunityStage = mutation({
  args: { token: v.optional(v.string()), id: v.id("salesOpportunityStages") },
  handler: withScopeAndEvents({ operation: "delete", module: "sales", entity: "salesOpportunityStages" }, async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Opportunity stage not found");
    await ctx.db.delete(args.id);
  }),
});

export const duplicateOpportunityStage = mutation({
  args: { token: v.optional(v.string()), id: v.id("salesOpportunityStages") },
  handler: withScopeAndEvents({ operation: "create", module: "sales", entity: "salesOpportunityStages" }, async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("Opportunity stage not found");
    const all = await ctx.db
      .query("salesOpportunityStages")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m: any, r: any) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("salesOpportunityStages", {
      name: `${source.name} (Copy)`,
      code: `${source.code}_COPY`,
      stageOrder: source.stageOrder,
      probability: source.probability,
      isClosed: source.isClosed,
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

export const reorderOpportunityStages = mutation({
  args: { token: v.optional(v.string()), orderedIds: v.array(v.id("salesOpportunityStages")) },
  handler: withScopeAndEvents({ operation: "update", module: "sales", entity: "salesOpportunityStages" }, async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { sequence: i, updatedAt: Date.now() });
    }
  }),
});

/* ────────────
   QUERIES
   ──────────── */

export const listOpportunityStages = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("salesOpportunityStages").withIndex("sequence").collect();
  },
});

export const getOpportunityStage = query({
  args: { id: v.id("salesOpportunityStages") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
