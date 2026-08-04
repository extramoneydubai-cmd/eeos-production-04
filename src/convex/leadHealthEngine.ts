import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { withScopeAndEvents } from "./withScopeAndEvents";

/* ────────────
   HEALTH SCORE CONSTANTS
   ──────────── */

const HEALTH_TIERS = ["hot", "warm", "cool", "cold"] as const;

/* ────────────
   HEALTH SCORE HISTORY
   ──────────── */

export const getHealthScoreHistory = query({
  args: {
    leadId: v.id("leadMaster"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("leadHealthScores")
      .withIndex("leadId_calculatedAt", (q) => q.eq("leadId", args.leadId))
      .order("desc")
      .take(args.limit || 10);
  },
});

export const getLeadHealthSummary = query({
  args: {
    tier: v.optional(v.union(...HEALTH_TIERS.map((t) => v.literal(t)))),
  },
  handler: async (ctx, args) => {
    const allScores = await ctx.db.query("leadHealthScores").collect();

    // Get the latest score per lead
    const latestPerLead = new Map<Id<"leadMaster">, typeof allScores[number]>();
    for (const score of allScores) {
      const existing = latestPerLead.get(score.leadId);
      if (!existing || score.calculatedAt > existing.calculatedAt) {
        latestPerLead.set(score.leadId, score);
      }
    }

    let scores = Array.from(latestPerLead.values());
    if (args.tier) {
      scores = scores.filter((s) => s.tier === args.tier);
    }

    const total = scores.length;
    const hot = scores.filter((s) => s.tier === "hot").length;
    const warm = scores.filter((s) => s.tier === "warm").length;
    const cool = scores.filter((s) => s.tier === "cool").length;
    const cold = scores.filter((s) => s.tier === "cold").length;
    const avgScore = total > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / total)
      : 0;

    return {
      total,
      hot,
      warm,
      cool,
      cold,
      averageScore: avgScore,
      averageMaxScore: 100,
      leads: scores.sort((a, b) => b.score - a.score).slice(0, 20),
    };
  },
});

/* ────────────
   FOLLOW-UP RULES CRUD
   Schema: leadFollowUpRules
     name, description?, leadStage?, leadStatus?,
     daysAfterCreation?, daysAfterLastActivity?, daysAfterNextAction?,
     actionTemplate, priority, assignedTo, createTask, sendNotification, isActive
   ──────────── */

export const listFollowUpRules = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("leadFollowUpRules").collect();
  },
});

export const createFollowUpRule = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    leadStage: v.optional(v.string()),
    leadStatus: v.optional(v.string()),
    daysAfterCreation: v.optional(v.number()),
    daysAfterLastActivity: v.optional(v.number()),
    daysAfterNextAction: v.optional(v.number()),
    actionTemplate: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    assignedTo: v.union(v.literal("owner"), v.literal("manager"), v.literal("team"), v.literal("round_robin")),
    createTask: v.boolean(),
    sendNotification: v.boolean(),
  },
  handler: withScopeAndEvents(
    {
      operation: "create",
      module: "crm",
      entity: "leadFollowUpRule",
      eventType: "crm.lead_followup_rule.created",
      title: "Follow-up rule created",
      getUserId: () => undefined,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: () => undefined,
      notifyViaMatrix: false,
    },
    async (ctx: any, args: any) => {
    return ctx.db.insert("leadFollowUpRules", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    }
  ),
});

export const updateFollowUpRule = mutation({
  args: {
    ruleId: v.id("leadFollowUpRules"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    leadStage: v.optional(v.string()),
    leadStatus: v.optional(v.string()),
    daysAfterCreation: v.optional(v.number()),
    daysAfterLastActivity: v.optional(v.number()),
    daysAfterNextAction: v.optional(v.number()),
    actionTemplate: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
    assignedTo: v.optional(v.union(v.literal("owner"), v.literal("manager"), v.literal("team"), v.literal("round_robin"))),
    createTask: v.optional(v.boolean()),
    sendNotification: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents(
    {
      operation: "update",
      module: "crm",
      entity: "leadFollowUpRule",
      eventType: "crm.lead_followup_rule.updated",
      title: "Follow-up rule updated",
      getUserId: () => undefined,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: () => undefined,
      notifyViaMatrix: false,
    },
    async (ctx: any, args: any) => {
    const { ruleId, ...fields } = args;
    const existing = await ctx.db.get(ruleId);
    if (!existing) throw new Error("Follow-up rule not found");
    await ctx.db.patch(ruleId, { ...fields, updatedAt: Date.now() });
    return ruleId;
    }
  ),
});

export const deleteFollowUpRule = mutation({
  args: { ruleId: v.id("leadFollowUpRules") },
  handler: withScopeAndEvents(
    {
      operation: "delete",
      module: "crm",
      entity: "leadFollowUpRule",
      eventType: "crm.lead_followup_rule.deleted",
      title: "Follow-up rule deleted",
      getUserId: () => undefined,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: () => undefined,
      notifyViaMatrix: false,
    },
    async (ctx: any, args: any) => {
    const existing = await ctx.db.get(args.ruleId);
    if (!existing) throw new Error("Follow-up rule not found");
    await ctx.db.delete(args.ruleId);
    return args.ruleId;
    }
  ),
});

/* ────────────
   STATUS ENGINE RULES CRUD
   Schema: leadStatusEngine
     fromStatus, toStatus, allowed,
     requiresPayment, requiresApproval, irreversible,
     triggerWorkflowId?
   ──────────── */

export const listStatusEngineRules = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("leadStatusEngine").collect();
  },
});

export const createStatusEngineRule = mutation({
  args: {
    fromStatus: v.string(),
    toStatus: v.string(),
    allowed: v.boolean(),
    requiresPayment: v.optional(v.boolean()),
    requiresApproval: v.optional(v.boolean()),
    irreversible: v.optional(v.boolean()),
    triggerWorkflowId: v.optional(v.id("workflows")),
  },
  handler: withScopeAndEvents(
    {
      operation: "create",
      module: "crm",
      entity: "leadStatusEngineRule",
      eventType: "crm.lead_status_rule.created",
      title: "Status engine rule created",
      getUserId: () => undefined,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: () => undefined,
      notifyViaMatrix: false,
    },
    async (ctx: any, args: any) => {
    return ctx.db.insert("leadStatusEngine", {
      fromStatus: args.fromStatus,
      toStatus: args.toStatus,
      allowed: args.allowed,
      requiresPayment: args.requiresPayment ?? false,
      requiresApproval: args.requiresApproval ?? false,
      irreversible: args.irreversible ?? false,
      triggerWorkflowId: args.triggerWorkflowId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    }
  ),
});

export const updateStatusEngineRule = mutation({
  args: {
    ruleId: v.id("leadStatusEngine"),
    allowed: v.optional(v.boolean()),
    requiresPayment: v.optional(v.boolean()),
    requiresApproval: v.optional(v.boolean()),
    irreversible: v.optional(v.boolean()),
    triggerWorkflowId: v.optional(v.id("workflows")),
  },
  handler: withScopeAndEvents(
    {
      operation: "update",
      module: "crm",
      entity: "leadStatusEngineRule",
      eventType: "crm.lead_status_rule.updated",
      title: "Status engine rule updated",
      getUserId: () => undefined,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: () => undefined,
      notifyViaMatrix: false,
    },
    async (ctx: any, args: any) => {
    const { ruleId, ...fields } = args;
    const existing = await ctx.db.get(ruleId);
    if (!existing) throw new Error("Status engine rule not found");
    await ctx.db.patch(ruleId, { ...fields, updatedAt: Date.now() });
    return ruleId;
    }
  ),
});

export const deleteStatusEngineRule = mutation({
  args: { ruleId: v.id("leadStatusEngine") },
  handler: withScopeAndEvents(
    {
      operation: "delete",
      module: "crm",
      entity: "leadStatusEngineRule",
      eventType: "crm.lead_status_rule.deleted",
      title: "Status engine rule deleted",
      getUserId: () => undefined,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: () => undefined,
      notifyViaMatrix: false,
    },
    async (ctx: any, args: any) => {
    const existing = await ctx.db.get(args.ruleId);
    if (!existing) throw new Error("Status engine rule not found");
    await ctx.db.delete(args.ruleId);
    return args.ruleId;
    }
  ),
});

/* ────────────
   BATCH HEALTH SCORE LOOKUP (for Lead Database)
   ──────────── */

export const getBatchHealthScores = query({
  args: {
    leadIds: v.array(v.id("leadMaster")),
  },
  handler: async (ctx, args) => {
    const allScores = await ctx.db.query("leadHealthScores").collect();

    // Latest score per lead
    const latestPerLead = new Map<Id<"leadMaster">, typeof allScores[number]>();
    for (const score of allScores) {
      const existing = latestPerLead.get(score.leadId);
      if (!existing || score.calculatedAt > existing.calculatedAt) {
        latestPerLead.set(score.leadId, score);
      }
    }

    const result: Record<string, { score: number; tier: string; maxScore: number } | null> = {};
    for (const leadId of args.leadIds) {
      const score = latestPerLead.get(leadId);
      result[leadId] = score
        ? { score: score.score, tier: score.tier, maxScore: score.maxScore }
        : null;
    }

    return result;
  },
});

/* ────────────
   HEALTH SCORE ANALYTICS DASHBOARD
   ──────────── */

export const getHealthDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const allScores = await ctx.db.query("leadHealthScores").collect();

    // Latest score per lead
    const latestPerLead = new Map<Id<"leadMaster">, typeof allScores[number]>();
    for (const score of allScores) {
      const existing = latestPerLead.get(score.leadId);
      if (!existing || score.calculatedAt > existing.calculatedAt) {
        latestPerLead.set(score.leadId, score);
      }
    }

    const scores = Array.from(latestPerLead.values());

    // Aggregate dimensions across all leads (latest scores)
    const dimensionTotals: Record<string, { totalScore: number; totalMax: number; count: number }> = {};

    for (const score of scores) {
      try {
        const dims = JSON.parse(score.dimensions);
        for (const [key, dim] of Object.entries(dims)) {
          const d = dim as { score: number; max: number; label: string };
          if (!dimensionTotals[key]) {
            dimensionTotals[key] = { totalScore: 0, totalMax: 0, count: 0 };
          }
          dimensionTotals[key].totalScore += d.score;
          dimensionTotals[key].totalMax += d.max;
          dimensionTotals[key].count++;
        }
      } catch {
        // Skip malformed dimensions
      }
    }

    const dimensionAverages = Object.entries(dimensionTotals).map(([key, val]) => ({
      key,
      label: key,
      averageScore: val.count > 0 ? val.totalScore / val.count : 0,
      averageMax: val.count > 0 ? val.totalMax / val.count : 0,
      averagePct: val.totalMax > 0 ? Math.round((val.totalScore / val.totalMax) * 100) : 0,
      leadCount: val.count,
    }));

    const tierBreakdown = {
      hot: scores.filter((s) => s.tier === "hot").length,
      warm: scores.filter((s) => s.tier === "warm").length,
      cool: scores.filter((s) => s.tier === "cool").length,
      cold: scores.filter((s) => s.tier === "cold").length,
    };

    const totalScored = scores.length;
    const avgPct = totalScored > 0
      ? Math.round(
          scores.reduce((sum, s) => sum + (s.maxScore > 0 ? (s.score / s.maxScore) * 100 : 0), 0) /
            totalScored,
        )
      : 0;

    return {
      totalScored,
      averageScorePct: avgPct,
      tierBreakdown,
      dimensionAverages,
    };
  },
});
