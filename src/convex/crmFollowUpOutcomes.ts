import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

const DEFAULT_OUTCOMES = [
  { name: "Interested", code: "INT", category: "Positive", pipeline: true, positive: true, color: "#34a853", icon: "ThumbsUp", description: "Lead showed interest in the offering" },
  { name: "Very Interested", code: "VINT", category: "Positive", pipeline: true, positive: true, color: "#1a73e8", icon: "Zap", description: "Lead showed strong interest and intent" },
  { name: "Need Time", code: "TIME", category: "Neutral", pipeline: false, positive: false, color: "#fbbc04", icon: "Clock", description: "Lead needs time to think or discuss with family" },
  { name: "Call Back Later", code: "CBL", category: "Neutral", pipeline: false, positive: false, color: "#e8710a", icon: "CalendarClock", description: "Lead requested a follow-up call at a later time" },
  { name: "Not Reachable", code: "NR", category: "Negative", pipeline: false, positive: false, color: "#9aa0a6", icon: "PhoneOff", description: "Lead could not be reached on any contact number" },
  { name: "Busy", code: "BUSY", category: "Neutral", pipeline: false, positive: false, color: "#5f6368", icon: "Clock", description: "Lead was busy and requested to call later" },
  { name: "Meeting Scheduled", code: "MTG", category: "Positive", pipeline: true, positive: true, color: "#4285f4", icon: "Calendar", description: "In-person or virtual meeting has been scheduled" },
  { name: "Demo Scheduled", code: "DEMO", category: "Positive", pipeline: true, positive: true, color: "#a855f7", icon: "Monitor", description: "Product or service demo has been scheduled" },
  { name: "Documents Pending", code: "DOCS", category: "Neutral", pipeline: true, positive: true, color: "#e8710a", icon: "FileText", description: "Lead needs to submit required documents" },
  { name: "Fee Discussion", code: "FEE", category: "Positive", pipeline: true, positive: true, color: "#d4a017", icon: "DollarSign", description: "Fee structure discussion is in progress" },
  { name: "Converted", code: "CONV", category: "Positive", pipeline: true, positive: true, color: "#34a853", icon: "Award", description: "Lead has been successfully converted to enrollment" },
  { name: "Lost", code: "LOST", category: "Negative", pipeline: false, positive: false, color: "#ea4335", icon: "XCircle", description: "Lead has been lost to competition or other reasons" },
  { name: "Duplicate", code: "DUP", category: "Negative", pipeline: false, positive: false, color: "#5f6368", icon: "Copy", description: "Lead identified as a duplicate entry" },
  { name: "Invalid Number", code: "INV_NUM", category: "Negative", pipeline: false, positive: false, color: "#ea4335", icon: "PhoneOff", description: "Contact number is invalid or incorrect" },
  { name: "Wrong Person", code: "WRONG", category: "Negative", pipeline: false, positive: false, color: "#9aa0a6", icon: "UserX", description: "Contacted person is not the right decision-maker" },
];

export const listFollowUpOutcomes = query({
  args: {},
  handler: async (ctx) => {
    const outcomes = await ctx.db.query("crmFollowUpOutcomes").collect();
    return outcomes.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getFollowUpOutcome = query({
  args: { followUpOutcomeId: v.id("crmFollowUpOutcomes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.followUpOutcomeId);
  },
});

export const createFollowUpOutcome = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    outcomeCategory: v.string(),
    movesPipeline: v.boolean(),
    isPositive: v.boolean(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmFollowUpOutcomes" }, async (ctx, args) => {
    const all = await ctx.db.query("crmFollowUpOutcomes").collect();
    const maxSeq = all.reduce((max: any, o: any) => Math.max(max, o.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("crmFollowUpOutcomes", {
      name: args.name,
      code: args.code,
      outcomeCategory: args.outcomeCategory,
      movesPipeline: args.movesPipeline,
      isPositive: args.isPositive,
      color: args.color,
      icon: args.icon,
      description: args.description,
      sequence: maxSeq + 1,
      active: args.active,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const updateFollowUpOutcome = mutation({
  args: { token: v.optional(v.string()),
    followUpOutcomeId: v.id("crmFollowUpOutcomes"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    outcomeCategory: v.optional(v.string()),
    movesPipeline: v.optional(v.boolean()),
    isPositive: v.optional(v.boolean()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmFollowUpOutcomes" }, async (ctx, args) => {
    const { token: _token, followUpOutcomeId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(followUpOutcomeId, updates);
  }),
});

export const deleteFollowUpOutcome = mutation({
  args: { token: v.optional(v.string()), followUpOutcomeId: v.id("crmFollowUpOutcomes") },
  handler: withScopeAndEvents({ operation: "delete", module: "crm", entity: "crmFollowUpOutcomes" }, async (ctx, args) => {
    await ctx.db.delete(args.followUpOutcomeId);
  }),
});

export const duplicateFollowUpOutcome = mutation({
  args: { token: v.optional(v.string()), followUpOutcomeId: v.id("crmFollowUpOutcomes") },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmFollowUpOutcomes" }, async (ctx, args) => {
    const original = await ctx.db.get(args.followUpOutcomeId);
    if (!original) throw new Error("Follow-up outcome not found");
    const all = await ctx.db.query("crmFollowUpOutcomes").collect();
    const maxSeq = all.reduce((max: any, o: any) => Math.max(max, o.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("crmFollowUpOutcomes", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
      outcomeCategory: original.outcomeCategory,
      movesPipeline: original.movesPipeline,
      isPositive: original.isPositive,
      color: original.color,
      icon: original.icon,
      description: original.description,
      sequence: maxSeq + 1,
      active: false,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const reorderFollowUpOutcomes = mutation({
  args: { token: v.optional(v.string()),
    followUpOutcomeIds: v.array(v.id("crmFollowUpOutcomes")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmFollowUpOutcomes" }, async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.followUpOutcomeIds.length; i++) {
      await ctx.db.patch(args.followUpOutcomeIds[i], { sequence: i + 1, updatedAt: now });
    }
  }),
});

export const seedDefaultFollowUpOutcomes = mutation({
  args: { token: v.optional(v.string()),},
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmFollowUpOutcomes" }, async (ctx) => {
    const existing = await ctx.db.query("crmFollowUpOutcomes").collect();
    if (existing.length > 0) return { seeded: 0, message: "Follow-up outcomes already exist" };

    const now = Date.now();
    for (let i = 0; i < DEFAULT_OUTCOMES.length; i++) {
      const o = DEFAULT_OUTCOMES[i];
      await ctx.db.insert("crmFollowUpOutcomes", {
        name: o.name,
        code: o.code,
        outcomeCategory: o.category,
        movesPipeline: o.pipeline,
        isPositive: o.positive,
        color: o.color,
        icon: o.icon,
        description: o.description,
        sequence: i + 1,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: DEFAULT_OUTCOMES.length, message: "Default follow-up outcomes created" };
  }),
});
