import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/* ────────────
   CONSTANTS
   ──────────── */

const TRIAL_PHASES = [
  "not_started",
  "in_progress",
  "extended",
  "completed",
  "cancelled",
] as const;

const CONVERSION_TYPES = [
  "trial",
  "direct_conversion",
  "installment",
] as const;

/* ────────────
   CONVERSION PIPELINE QUERIES
   ──────────── */

export const getConversionPipeline = query({
  args: {
    leadId: v.id("leadMaster"),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("leadConversionPipeline")
      .withIndex("leadId", (q) => q.eq("leadId", args.leadId))
      .first();
  },
});

export const listConversionPipelines = query({
  args: {
    pipelineType: v.optional(v.union(...CONVERSION_TYPES.map((t) => v.literal(t)))),
    trialPhase: v.optional(v.union(...TRIAL_PHASES.map((t) => v.literal(t)))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("leadConversionPipeline");

    if (args.pipelineType) {
      q = q.filter((r) => r.eq(r.field("pipelineType"), args.pipelineType!));
    }
    if (args.trialPhase) {
      q = q.filter((r) => r.eq(r.field("trialPhase"), args.trialPhase!));
    }

    return q.order("desc").take(args.limit || 50);
  },
});

/* ────────────
   TRIAL MANAGEMENT
   ──────────── */

export const getTrialsDueForExpiry = query({
  args: {
    withinHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const withinMs = (args.withinHours || 48) * 60 * 60 * 1000;
    const now = Date.now();
    const expiryThreshold = now + withinMs;

    const pipelines = await ctx.db
      .query("leadConversionPipeline")
      .withIndex("trialPhase", (q) => q.eq("trialPhase", "in_progress"))
      .collect();

    return pipelines.filter(
      (p) =>
        p.trialEndDate &&
        p.trialEndDate > now &&
        p.trialEndDate <= expiryThreshold,
    );
  },
});

/* ────────────
   CONVERSION ANALYTICS
   ──────────── */

export const getConversionAnalytics = query({
  args: {
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allPipelines = await ctx.db.query("leadConversionPipeline").collect();

    let filtered = allPipelines;
    if (args.dateFrom) {
      filtered = filtered.filter((p) => (p.conversionDate || p.createdAt) >= args.dateFrom!);
    }
    if (args.dateTo) {
      filtered = filtered.filter((p) => (p.conversionDate || p.createdAt) <= args.dateTo!);
    }

    const converted = filtered.filter((p) => p.conversionDate);
    const inTrial = filtered.filter((p) => p.trialPhase === "in_progress");
    const trialsCompleted = filtered.filter((p) => p.trialPhase === "completed");
    const trialsCancelled = filtered.filter((p) => p.trialPhase === "cancelled");

    const totalRevenue = converted.reduce(
      (sum, p) => sum + (p.revenueAmount || 0),
      0,
    );
    const totalCollected = converted.reduce(
      (sum, p) => sum + (p.revenueCollected || 0),
      0,
    );
    const totalInstallments = converted.reduce(
      (sum, p) => sum + (p.installmentCount || 0),
      0,
    );

    // Conversion by type
    const byType: Record<string, number> = {};
    for (const p of converted) {
      byType[p.pipelineType] = (byType[p.pipelineType] || 0) + 1;
    }

    // Revenue by type
    const revenueByType: Record<string, number> = {};
    for (const p of converted) {
      revenueByType[p.pipelineType] =
        (revenueByType[p.pipelineType] || 0) + (p.revenueAmount || 0);
    }

    return {
      totalPipelines: filtered.length,
      totalConverted: converted.length,
      inTrial: inTrial.length,
      trialsCompleted: trialsCompleted.length,
      trialsCancelled: trialsCancelled.length,
      totalRevenue,
      totalCollected,
      totalInstallments,
      collectionRate: totalRevenue > 0
        ? Math.round((totalCollected / totalRevenue) * 100)
        : 0,
      conversionRate: filtered.length > 0
        ? Math.round((converted.length / filtered.length) * 100)
        : 0,
      byType,
      revenueByType,
    };
  },
});

/* ────────────
   PIPELINE STATUS OVERVIEW
   ──────────── */

export const getPipelineOverview = query({
  args: {},
  handler: async (ctx) => {
    const allPipelines = await ctx.db.query("leadConversionPipeline").collect();
    const now = Date.now();

    const activeTrials = allPipelines.filter(
      (p) => p.trialPhase === "in_progress",
    );
    const expiringTrials = activeTrials.filter(
      (p) =>
        p.trialEndDate &&
        p.trialEndDate > now &&
        p.trialEndDate <= now + 48 * 60 * 60 * 1000,
    );
    const expiredTrials = activeTrials.filter(
      (p) => p.trialEndDate && p.trialEndDate <= now,
    );
    const recentConversions = allPipelines
      .filter((p) => p.conversionDate && p.conversionDate > now - 30 * 24 * 60 * 60 * 1000)
      .sort((a, b) => (b.conversionDate || 0) - (a.conversionDate || 0));

    // Payment plan breakdown
    const paymentPlans: Record<string, number> = {};
    for (const p of allPipelines) {
      if (p.paymentPlan) {
        paymentPlans[p.paymentPlan] = (paymentPlans[p.paymentPlan] || 0) + 1;
      }
    }

    return {
      activeTrials: activeTrials.length,
      expiringTrials: expiringTrials.length,
      expiredTrials: expiredTrials.length,
      recentConversions: recentConversions.length,
      paymentPlans,
    };
  },
});
