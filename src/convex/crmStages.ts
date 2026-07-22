import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DEFAULT_STAGES = [
  { name: "New", color: "#9aa0a6", icon: "CircleDot", probability: 10, description: "New lead created", sequence: 1 },
  { name: "Contacted", color: "#4285f4", icon: "Phone", probability: 20, description: "Lead has been contacted", sequence: 2 },
  { name: "Interested", color: "#34a853", icon: "ThumbsUp", probability: 35, description: "Lead expressed interest", sequence: 3 },
  { name: "Demo Scheduled", color: "#fbbc04", icon: "Calendar", probability: 50, description: "Demo meeting scheduled", sequence: 4 },
  { name: "Demo Attended", color: "#a855f7", icon: "Monitor", probability: 60, description: "Demo completed", sequence: 5 },
  { name: "Negotiation", color: "#e8710a", icon: "Handshake", probability: 70, description: "Price negotiation in progress", sequence: 6 },
  { name: "Payment Pending", color: "#1a73e8", icon: "DollarSign", probability: 85, description: "Awaiting payment", sequence: 7 },
  { name: "Converted", color: "#0d652d", icon: "CheckCircle2", probability: 100, description: "Lead successfully converted", sequence: 8 },
  { name: "Lost", color: "#5f6368", icon: "XCircle", probability: 0, description: "Lead lost", sequence: 9 },
];

export const listStages = query({
  args: {},
  handler: async (ctx) => {
    const stages = await ctx.db.query("crmStages").collect();
    return stages.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getStage = query({
  args: { stageId: v.id("crmStages") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.stageId);
  },
});

export const createStage = mutation({
  args: {
    name: v.string(),
    color: v.string(),
    icon: v.string(),
    probability: v.number(),
    description: v.optional(v.string()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const allStages = await ctx.db.query("crmStages").collect();
    const maxSeq = allStages.reduce((max, s) => Math.max(max, s.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("crmStages", {
      name: args.name,
      color: args.color,
      icon: args.icon,
      probability: args.probability,
      description: args.description,
      sequence: maxSeq + 1,
      active: args.active,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateStage = mutation({
  args: {
    stageId: v.id("crmStages"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    probability: v.optional(v.number()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { stageId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(stageId, updates);
  },
});

export const deleteStage = mutation({
  args: { stageId: v.id("crmStages") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.stageId);
  },
});

export const duplicateStage = mutation({
  args: { stageId: v.id("crmStages") },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.stageId);
    if (!original) throw new Error("Stage not found");
    const allStages = await ctx.db.query("crmStages").collect();
    const maxSeq = allStages.reduce((max, s) => Math.max(max, s.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("crmStages", {
      name: `${original.name} (Copy)`,
      color: original.color,
      icon: original.icon,
      probability: original.probability,
      description: original.description,
      sequence: maxSeq + 1,
      active: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const reorderStages = mutation({
  args: {
    stageIds: v.array(v.id("crmStages")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.stageIds.length; i++) {
      await ctx.db.patch(args.stageIds[i], { sequence: i + 1, updatedAt: now });
    }
  },
});

export const seedDefaultStages = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("crmStages").collect();
    if (existing.length > 0) return { seeded: 0, message: "Stages already exist" };

    const now = Date.now();
    for (const stage of DEFAULT_STAGES) {
      await ctx.db.insert("crmStages", {
        ...stage,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: DEFAULT_STAGES.length, message: "Default stages created" };
  },
});
