import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  { name: "New Admission", code: "OT_NEW_ADM", opportunityCategory: "Admission", description: "New student admission", color: "#4285f4", icon: "GraduationCap" },
  { name: "Existing Student Upsell", code: "OT_UPSELL", opportunityCategory: "Upsell", description: "Upsell to existing students", color: "#4f46e5", icon: "TrendingUp" },
  { name: "Corporate Training", code: "OT_CORP", opportunityCategory: "Corporate", description: "Corporate training programs", color: "#a855f7", icon: "Building2" },
  { name: "Franchise", code: "OT_FRANCHISE", opportunityCategory: "Partnership", description: "New franchise opportunity", color: "#f59e0b", icon: "Handshake" },
  { name: "Partnership", code: "OT_PARTNER", opportunityCategory: "Partnership", description: "Strategic partnership opportunity", color: "#0d9488", icon: "HeartHandshake" },
  { name: "Institutional", code: "OT_INST", opportunityCategory: "Institutional", description: "Institutional collaboration", color: "#06b6d4", icon: "Landmark" },
  { name: "Government", code: "OT_GOVT", opportunityCategory: "Government", description: "Government project or tender", color: "#34a853", icon: "ShieldCheck" },
  { name: "Renewal", code: "OT_RENEW", opportunityCategory: "Retention", description: "Student or contract renewal", color: "#e8710a", icon: "RefreshCw" },
  { name: "Cross Sell", code: "OT_CROSS", opportunityCategory: "Upsell", description: "Cross-sell additional products/services", color: "#d4a017", icon: "GitPullRequest" },
  { name: "Premium Upgrade", code: "OT_PREMIUM", opportunityCategory: "Upsell", description: "Upgrade to premium tier", color: "#e91e63", icon: "Award" },
];

/* ────────────
   HELPERS
   ──────────── */

function baseFields(data: (typeof SEED_DATA)[number], sequence: number) {
  return {
    name: data.name,
    code: data.code,
    opportunityCategory: data.opportunityCategory,
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
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("salesOpportunityTypes")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (let i = 0; i < SEED_DATA.length; i++) {
      await ctx.db.insert("salesOpportunityTypes", baseFields(SEED_DATA[i], i));
      count++;
    }
    return { seeded: count };
  },
});

export const createOpportunityType = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    opportunityCategory: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("salesOpportunityTypes")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("salesOpportunityTypes", {
      ...args,
      description: args.description ?? "",
      sequence: maxSeq + 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateOpportunityType = mutation({
  args: {
    id: v.id("salesOpportunityTypes"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    opportunityCategory: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Opportunity type not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const deleteOpportunityType = mutation({
  args: { id: v.id("salesOpportunityTypes") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Opportunity type not found");
    await ctx.db.delete(args.id);
  },
});

export const duplicateOpportunityType = mutation({
  args: { id: v.id("salesOpportunityTypes") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("Opportunity type not found");
    const all = await ctx.db
      .query("salesOpportunityTypes")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("salesOpportunityTypes", {
      name: `${source.name} (Copy)`,
      code: `${source.code}_COPY`,
      opportunityCategory: source.opportunityCategory,
      description: source.description,
      color: source.color,
      icon: source.icon,
      sequence: maxSeq + 1,
      active: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const reorderOpportunityTypes = mutation({
  args: { orderedIds: v.array(v.id("salesOpportunityTypes")) },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { sequence: i, updatedAt: Date.now() });
    }
  },
});

/* ────────────
   QUERIES
   ──────────── */

export const listOpportunityTypes = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("salesOpportunityTypes").withIndex("sequence").collect();
  },
});

export const getOpportunityType = query({
  args: { id: v.id("salesOpportunityTypes") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
