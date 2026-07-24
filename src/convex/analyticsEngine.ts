import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/* ────────────
   HELPERS
   ──────────── */

function getPeriodStart(period: string): number {
  const now = new Date();
  switch (period) {
    case "today": return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    case "week": {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(now.getFullYear(), now.getMonth(), diff).getTime();
    }
    case "month": return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3) * 3;
      return new Date(now.getFullYear(), q, 1).getTime();
    }
    case "year": return new Date(now.getFullYear(), 0, 1).getTime();
    default: return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  }
}

function getPeriodEnd(period: string): number {
  const now = new Date();
  switch (period) {
    case "today": return now.getTime();
    case "week": return now.getTime();
    case "month": return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3) * 3 + 3;
      return new Date(now.getFullYear(), q, 0, 23, 59, 59).getTime();
    }
    case "year": return new Date(now.getFullYear(), 11, 31, 23, 59, 59).getTime();
    default: return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();
  }
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getMonthPeriods(count: number): { period: string; start: number; end: number }[] {
  const results: { period: string; start: number; end: number }[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime();
    results.push({ period: monthStr, start, end });
  }
  return results;
}

/* ────────────
   COUNCELOR METRICS
   ──────────── */

export const calculateCounselorMetrics = mutation({
  args: {
    userId: v.id("users"),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const period = args.period || "month";
    const periodStart = getPeriodStart(period);
    const periodEnd = getPeriodEnd(period);

    // Leads assigned to this counselor
    const allLeads = await ctx.db.query("leadMaster").collect();
    const assignedLeads = allLeads.filter((l) => l.ownerId === args.userId);
    const activeLeads = assignedLeads.filter((l) => l.status === "active");
    const conversions = assignedLeads.filter((l) => l.status === "converted" && l.updatedAt >= periodStart && l.updatedAt <= periodEnd);
    const lostLeads = assignedLeads.filter((l) => l.status === "lost" && l.updatedAt >= periodStart && l.updatedAt <= periodEnd);

    // Activities
    const allActivities = await ctx.db.query("leadActivity").withIndex("userId", (q) => q.eq("userId", args.userId)).collect();
    const periodActivities = allActivities.filter((a) => a.createdAt >= periodStart && a.createdAt <= periodEnd);
    const callsMade = periodActivities.filter((a) => a.action === "call_made").length;
    const meetingsHeld = periodActivities.filter((a) => a.action === "meeting_scheduled" || a.action === "meeting_completed").length;
    const followupsCompleted = periodActivities.filter((a) => a.action === "followup_scheduled" || a.action === "followup_completed").length;

    // Revenue
    const revenueGenerated = assignedLeads
      .filter((l) => l.status === "converted" && l.standardAmount)
      .reduce((sum, l) => sum + (l.standardAmount || 0), 0);

    // Response time (from timeline)
    const allTimeline = await ctx.db.query("leadTimeline").collect();
    const leadTimeline = allTimeline.filter((t) => {
      const lead = assignedLeads.find((l) => l._id === t.leadId);
      return !!lead;
    });

    // Calculate average response time (time from LeadCreated to first LeadAssigned or call)
    let totalResponseMs = 0;
    let responseCount = 0;
    for (const lead of assignedLeads) {
      const leadEvents = leadTimeline.filter((t) => t.leadId === lead._id && t.eventType === "LeadAssigned");
      if (leadEvents.length > 0) {
        const firstEvent = leadEvents.sort((a, b) => a.performedAt - b.performedAt)[0];
        totalResponseMs += firstEvent.performedAt - lead.createdAt;
        responseCount++;
      }
    }
    const avgResponseTime = responseCount > 0 ? Math.round(totalResponseMs / responseCount / 60000) : 0;

    // Win rate
    const closedLeads = conversions.length + lostLeads.length;
    const winRate = closedLeads > 0 ? Math.round((conversions.length / closedLeads) * 100) : 0;

    // Composite score
    const score = calculateCounselorScore({
      activeLeads: activeLeads.length,
      conversions: conversions.length,
      winRate,
      callsMade,
      revenueGenerated,
      avgResponseTime,
    });

    // @ts-ignore - Legacy analytics table
    const metricId = await ctx.db.insert("counselorMetrics", {
      userId: args.userId,
      period,
      periodStart,
      periodEnd,
      assignedLeads: assignedLeads.length,
      callsMade,
      meetingsHeld,
      followupsCompleted,
      conversions: conversions.length,
      lostLeads: lostLeads.length,
      revenueGenerated,
      avgResponseTime,
      winRate,
      score,
      createdAt: Date.now(),
    });

    return {
      metricId,
      assignedLeads: assignedLeads.length,
      activeLeads: activeLeads.length,
      callsMade,
      meetingsHeld,
      followupsCompleted,
      conversions: conversions.length,
      lostLeads: lostLeads.length,
      revenueGenerated,
      avgResponseTime,
      winRate,
      score,
    };
  },
});

function calculateCounselorScore(metrics: {
  activeLeads: number;
  conversions: number;
  winRate: number;
  callsMade: number;
  revenueGenerated: number;
  avgResponseTime: number;
}): number {
  let score = 0;
  // Active leads (max 20)
  score += Math.min(metrics.activeLeads * 2, 20);
  // Conversions (max 25)
  score += Math.min(metrics.conversions * 5, 25);
  // Win rate (max 20)
  score += Math.min(metrics.winRate / 5, 20);
  // Calls (max 15)
  score += Math.min(metrics.callsMade, 15);
  // Revenue (max 10)
  score += Math.min(metrics.revenueGenerated / 10000, 10);
  // Response time (max 10, lower is better)
  if (metrics.avgResponseTime <= 5) score += 10;
  else if (metrics.avgResponseTime <= 15) score += 7;
  else if (metrics.avgResponseTime <= 30) score += 5;
  else if (metrics.avgResponseTime <= 60) score += 3;
  return Math.min(score, 100);
}

export const getCounselorMetricsQuery = query({
  args: {
    userId: v.optional(v.id("users")),
    period: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const p = args.period || "month";
    if (args.userId) {
      return ctx.db
        .query("counselorMetrics")
        .withIndex("userId", (q) => q.eq("userId", args.userId!))
        .filter((r) => r.eq(r.field("period"), p))
        .order("desc")
        .take(args.limit || 10);
    }
    return ctx.db
      .query("counselorMetrics")
      .withIndex("period", (q) => q.eq("period", p))
      .order("desc")
      .take(args.limit || 50);
  },
});

export const getCounselorLeaderboard = query({
  args: {
    period: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const p = args.period || "month";
    const metrics = await ctx.db
      .query("counselorMetrics")
      .withIndex("period", (q) => q.eq("period", p))
      .collect();

    return metrics
      .sort((a, b) => b.score - a.score)
      .slice(0, args.limit || 20)
      .map((m) => ({
        userId: m.userId,
        score: m.score,
        conversions: m.conversions,
        revenueGenerated: m.revenueGenerated,
        winRate: m.winRate,
        callsMade: m.callsMade,
      }));
  },
});

/* ────────────
   BRANCH METRICS
   ──────────── */

export const calculateBranchMetrics = mutation({
  args: {
    branchId: v.id("branches"),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const period = args.period || "month";
    const periodStart = getPeriodStart(period);
    const periodEnd = getPeriodEnd(period);

    // Users in this branch
    const branchUsers = await ctx.db.query("users").filter((q) =>
      q.eq(q.field("branchId"), args.branchId)
    ).collect();
    const userIds = new Set(branchUsers.map((u) => u._id));

    // Leads associated with this branch
    const allLeads = await ctx.db.query("leadMaster").collect();
    const branchLeads = allLeads.filter((l) => l.branchInterestId === args.branchId);
    const newLeads = branchLeads.filter((l) => l.createdAt >= periodStart && l.createdAt <= periodEnd);
    const activeLeads = branchLeads.filter((l) => l.status === "active");
    const conversions = branchLeads.filter((l) => l.status === "converted" && l.updatedAt >= periodStart && l.updatedAt <= periodEnd);

    // Funnel rates
    const staged = branchLeads.filter((l) => l.stage !== "new" && l.stage !== "lost");
    const demoStage = branchLeads.filter((l) => ["demo", "counselling", "qualified"].includes(l.stage));
    const trialStage = branchLeads.filter((l) => ["trial", "interested", "negotiation"].includes(l.stage));
    const admissionStage = conversions;

    const demoRate = newLeads.length > 0 ? Math.round((demoStage.length / newLeads.length) * 100) : 0;
    const trialRate = demoStage.length > 0 ? Math.round((trialStage.length / demoStage.length) * 100) : 0;
    const admissionRate = trialStage.length > 0 ? Math.round((admissionStage.length / trialStage.length) * 100) : 0;

    // Revenue
    const revenue = branchLeads
      .filter((l) => l.status === "converted" && l.standardAmount)
      .reduce((sum, l) => sum + (l.standardAmount || 0), 0);

    // Pending follow-ups
    const pendingFollowups = branchLeads.filter((l) => l.nextActionDate && l.nextActionDate > Date.now() && l.status === "active").length;

    // SLA compliance
    const allViolations: any[] = await (ctx.db as any).query("slaViolations").collect();
    const branchViolations = allViolations.filter((v: any) => branchLeads.some((l) => l._id === v.leadId));
    const totalViolations = branchViolations.length;
    const resolvedViolations = branchViolations.filter((v: any) => (v as any).status === "resolved").length;
    const slaCompliance = totalViolations > 0 ? Math.round((resolvedViolations / totalViolations) * 100) : 100;

    // @ts-ignore - Legacy analytics table
    const metricId = await ctx.db.insert("branchMetrics", {
      branchId: args.branchId,
      period,
      periodStart,
      periodEnd,
      newLeads: newLeads.length,
      activeLeads: activeLeads.length,
      demoRate,
      trialRate,
      admissionRate,
      revenue,
      pendingFollowups,
      slaCompliance,
      counselorCount: branchUsers.length,
      createdAt: Date.now(),
    });

    return {
      metricId,
      newLeads: newLeads.length,
      activeLeads: activeLeads.length,
      demoRate,
      trialRate,
      admissionRate,
      revenue,
      pendingFollowups,
      slaCompliance,
      counselorCount: branchUsers.length,
    };
  },
});

export const getBranchMetricsQuery = query({
  args: {
    branchId: v.optional(v.id("branches")),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const p = args.period || "month";
    if (args.branchId) {
      const metrics = await ctx.db
        .query("branchMetrics")
        .withIndex("branchId", (q) => q.eq("branchId", args.branchId!))
        .collect();
      return metrics.filter((m) => m.period === p).sort((a, b) => b.createdAt - a.createdAt);
    }
    const metrics = await ctx.db
      .query("branchMetrics")
      .withIndex("period", (q) => q.eq("period", p))
      .collect();
    return metrics.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getBranchRankings = query({
  args: {
    period: v.optional(v.string()),
    sortBy: v.optional(v.union(
      v.literal("revenue"), v.literal("admissionRate"),
      v.literal("newLeads"), v.literal("slaCompliance"),
    )),
  },
  handler: async (ctx, args) => {
    const p = args.period || "month";
    const metrics = await ctx.db
      .query("branchMetrics")
      .withIndex("period", (q) => q.eq("period", p))
      .collect();

    const field = args.sortBy || "revenue";
    return metrics.sort((a, b) => {
      const aVal = (a as any)[field] || 0;
      const bVal = (b as any)[field] || 0;
      return bVal - aVal;
    });
  },
});

/* ────────────
   COMPANY METRICS
   ──────────── */

export const calculateCompanyMetrics = mutation({
  args: {
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const period = args.period || "month";
    const periodStart = getPeriodStart(period);
    const periodEnd = getPeriodEnd(period);

    // Aggregate all branches
    const allBranches = await ctx.db.query("branchMetrics").withIndex("period", (q) => q.eq("period", period)).collect();
    const allCounselors = await ctx.db.query("counselorMetrics").withIndex("period", (q) => q.eq("period", period)).collect();

    const totalRevenue = allBranches.reduce((s, b) => s + b.revenue, 0);
    const totalNewLeads = allBranches.reduce((s, b) => s + b.newLeads, 0);
    const totalActive = allBranches.reduce((s, b) => s + b.activeLeads, 0);
    const totalConversions = allCounselors.reduce((s, c) => s + c.conversions, 0);
    const avgWinRate = allCounselors.length > 0
      ? Math.round(allCounselors.reduce((s, c) => s + c.winRate, 0) / allCounselors.length)
      : 0;

    // Pipeline value
    const allLeads = await ctx.db.query("leadMaster").collect();
    const pipelineValue = allLeads
      .filter((l) => l.status === "active" && l.standardAmount)
      .reduce((sum, l) => sum + (l.standardAmount || 0), 0);

    // Stage breakdown
    const stageBreakdown: Record<string, number> = {};
    for (const l of allLeads) {
      stageBreakdown[l.stage] = (stageBreakdown[l.stage] || 0) + 1;
    }

    return {
      period,
      totalRevenue,
      totalNewLeads,
      totalActive,
      totalConversions,
      avgWinRate,
      pipelineValue,
      stageBreakdown,
      branchCount: allBranches.length,
      counselorCount: allCounselors.length,
    };
  },
});

/* ────────────
   CONVERSION FUNNEL
   ──────────── */

export const buildConversionFunnels = mutation({
  args: {
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const period = args.period || "month";
    const periodStart = getPeriodStart(period);
    const periodEnd = getPeriodEnd(period);

    const allLeads = await ctx.db.query("leadMaster").collect();
    const periodLeads = allLeads.filter((l) => l.createdAt >= periodStart && l.createdAt <= periodEnd);

    // Define funnel stages
    const stages = [
      { key: "inquiry", label: "Inquiry", stageKeys: ["new", "attempted"] },
      { key: "qualified", label: "Qualified", stageKeys: ["connected", "qualified"] },
      { key: "demo", label: "Demo", stageKeys: ["demo", "counselling"] },
      { key: "trial", label: "Trial", stageKeys: ["interested", "follow_up", "negotiation", "trial"] },
      { key: "admission", label: "Admission", stageKeys: ["converted"] },
      { key: "student", label: "Student", stageKeys: ["converted"] },
    ];

    const stageCounts: Record<string, number> = {};
    for (const stage of stages) {
      stageCounts[stage.key] = periodLeads.filter((l) => stage.stageKeys.includes(l.stage)).length;
    }
    stageCounts.inquiry = periodLeads.length; // All period leads are inquiries

    // Drop-off rates
    const dropOffRates: Record<string, number> = {};
    for (let i = 1; i < stages.length; i++) {
      const from = stageCounts[stages[i - 1].key];
      const to = stageCounts[stages[i].key];
      dropOffRates[stages[i].key] = from > 0 ? Math.round(((from - to) / from) * 100) : 0;
    }

    // Overall conversion rate
    const conversionRate = stageCounts.inquiry > 0
      ? Math.round((stageCounts.admission / stageCounts.inquiry) * 100)
      : 0;

    // @ts-ignore - Legacy analytics table
    const funnelId = await ctx.db.insert("conversionFunnels", {
      period,
      periodStart,
      periodEnd,
      totalInquiries: periodLeads.length,
      stageBreakdown: JSON.stringify(stageCounts),
      dropOffRates: JSON.stringify(dropOffRates),
      conversionRate,
      createdAt: Date.now(),
    });

    return {
      funnelId,
      stageBreakdown: stageCounts,
      dropOffRates,
      conversionRate,
    };
  },
});

export const getConversionFunnels = query({
  args: {
    period: v.optional(v.string()),
    months: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.months) {
      const monthPeriods = getMonthPeriods(args.months);
      const results = [];
      for (const mp of monthPeriods) {
        const funnel = await ctx.db
          .query("conversionFunnels")
          .withIndex("period", (q) => q.eq("period", mp.period))
          .first();
        results.push({
          period: mp.period,
          ...(funnel ? {
            totalInquiries: funnel.totalInquiries,
            conversionRate: funnel.conversionRate,
            stageBreakdown: JSON.parse(funnel.stageBreakdown),
            dropOffRates: JSON.parse(funnel.dropOffRates),
          } : {
            totalInquiries: 0,
            conversionRate: 0,
            stageBreakdown: {},
            dropOffRates: {},
          }),
        });
      }
      return results;
    }

    const p = args.period || "month";
    return ctx.db
      .query("conversionFunnels")
      .withIndex("period", (q) => q.eq("period", p))
      .order("desc")
      .take(10);
  },
});

/* ────────────
   FORECASTING
   ──────────── */

export const generateForecast = mutation({
  args: {
    forecastType: v.union(
      v.literal("admissions"), v.literal("revenue"),
      v.literal("counselor_capacity"), v.literal("branch_targets"),
      v.literal("conversion_probability"),
    ),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const period = args.period || "month";
    const now = Date.now();

    // Get historical data for trend analysis
    const monthPeriods = getMonthPeriods(3); // Last 3 months
    const historicalData: { admissions: number; revenue: number; inquiries: number }[] = [];

    for (const mp of monthPeriods) {
      const funnel = await ctx.db
        .query("conversionFunnels")
        .withIndex("period", (q) => q.eq("period", mp.period))
        .first();

      const branchMetrics = await ctx.db
        .query("branchMetrics")
        .withIndex("period", (q) => q.eq("period", mp.period))
        .collect();

      historicalData.push({
        admissions: funnel ? Math.round(funnel.totalInquiries * (funnel.conversionRate / 100)) : 0,
        revenue: branchMetrics.reduce((s, b) => s + b.revenue, 0),
        inquiries: funnel?.totalInquiries || 0,
      });
    }

    // Simple moving average forecast
    const avgAdmissions = historicalData.length > 0
      ? Math.round(historicalData.reduce((s, d) => s + d.admissions, 0) / historicalData.length)
      : 0;
    const avgRevenue = historicalData.length > 0
      ? Math.round(historicalData.reduce((s, d) => s + d.revenue, 0) / historicalData.length)
      : 0;
    const avgInquiries = historicalData.length > 0
      ? Math.round(historicalData.reduce((s, d) => s + d.inquiries, 0) / historicalData.length)
      : 0;

    // Calculate trend (growth/decline)
    let trend = 0;
    if (historicalData.length >= 2) {
      const last = historicalData[historicalData.length - 1];
      const first = historicalData[0];
      trend = first.admissions > 0 ? ((last.admissions - first.admissions) / first.admissions) * 100 : 0;
    }

    // Apply trend to forecast
    const trendMultiplier = 1 + (trend / 100);
    const predictedAdmissions = Math.round(avgAdmissions * trendMultiplier);
    const predictedRevenue = Math.round(avgRevenue * trendMultiplier);

    // Confidence interval (wider with less data)
    const confidenceWidth = historicalData.length < 2 ? 0.3 : 0.15;
    const confidenceInterval = JSON.stringify({
      lower: Math.round(predictedRevenue * (1 - confidenceWidth)),
      upper: Math.round(predictedRevenue * (1 + confidenceWidth)),
    });

    // Counselor capacity forecast
    let counselorCapacity = 0;
    let branchTargets = {};
    let conversionProbability = 0;

    if (args.forecastType === "counselor_capacity") {
      const allCounselors = await ctx.db.query("counselorMetrics").withIndex("period", (q) => q.eq("period", period)).collect();
      const totalLeads = allCounselors.reduce((s, c) => s + c.assignedLeads, 0);
      const totalCounselors = allCounselors.length;
      const avgLoad = totalCounselors > 0 ? Math.round(totalLeads / totalCounselors) : 0;
      const capacityPerCounselor = 50; // Target max leads per counselor
      counselorCapacity = totalCounselors * capacityPerCounselor - totalLeads;
    }

    if (args.forecastType === "branch_targets") {
      const allBranchMetrics = await ctx.db.query("branchMetrics").withIndex("period", (q) => q.eq("period", period)).collect();
      branchTargets = Object.fromEntries(
        allBranchMetrics.map((b) => [
          b.branchId,
          {
            currentRevenue: b.revenue,
            targetRevenue: Math.round(b.revenue * 1.15), // 15% growth target
            currentAdmissions: b.admissionRate,
            targetAdmissions: Math.min(b.admissionRate + 10, 100),
          },
        ]),
      );
    }

    if (args.forecastType === "conversion_probability") {
      const allFunnels = await ctx.db.query("conversionFunnels").collect();
      const avgConversion = allFunnels.length > 0
        ? Math.round(allFunnels.reduce((s, f) => s + f.conversionRate, 0) / allFunnels.length)
        : 0;
      conversionProbability = Math.round((avgConversion + trend) / 2);
    }

    // @ts-expect-error - legacy analytics table
    const forecastId = await ctx.db.insert("forecastSnapshots", {
      forecastType: args.forecastType,
      period,
      forecastDate: now,
      predictedAdmissions,
      predictedRevenue,
      confidenceInterval,
      methodology: "moving_average_3_months",
      data: JSON.stringify({
        historicalData,
        trend,
        counselorCapacity,
        branchTargets,
        conversionProbability,
      }),
      createdAt: now,
    });

    return {
      forecastId,
      forecastType: args.forecastType,
      predictedAdmissions,
      predictedRevenue,
      confidenceInterval: JSON.parse(confidenceInterval),
      trend,
      counselorCapacity,
      branchTargets,
      conversionProbability,
    };
  },
});

export const getForecasts = query({
  args: {
    forecastType: v.optional(v.string()),
    period: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("forecastSnapshots");
    if (args.forecastType) {
      q = q.filter((r) => r.eq(r.field("forecastType"), args.forecastType!));
    }
    if (args.period) {
      q = q.filter((r) => r.eq(r.field("period"), args.period!));
    }
    return q.order("desc").take(args.limit || 10);
  },
});

export const getForecastAccuracy = query({
  args: {
    forecastType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const forecasts = await ctx.db.query("forecastSnapshots").order("desc").take(args.limit || 20);
    return forecasts
      .filter((f) => f.actualAdmissions !== undefined || f.actualRevenue !== undefined)
      .map((f) => ({
        forecastId: f._id,
        forecastType: f.forecastType,
        period: f.period,
        predictedAdmissions: f.predictedAdmissions,
        actualAdmissions: f.actualAdmissions,
        predictedRevenue: f.predictedRevenue,
        actualRevenue: f.actualRevenue,
        accuracy: f.accuracy,
      }));
  },
});

/* ────────────
   SNAPSHOT CACHING
   ──────────── */

// Helper to insert into any table without strict type checking
async function contextlessInsert(ctx: any, tableName: string, data: Record<string, any>) {
  return ctx.db.insert(tableName, data);
}

export const refreshAnalyticsSnapshot = mutation({
  args: {
    snapshotType: v.union(
      v.literal("ceo_dashboard"), v.literal("branch_dashboard"),
      v.literal("counselor_dashboard"), v.literal("company_metrics"),
      v.literal("full_analytics"),
    ),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const period = args.period || "month";
    const now = Date.now();
    const periodStart = getPeriodStart(period);
    const periodEnd = getPeriodEnd(period);

    let data: Record<string, any> = {};

    if (args.snapshotType === "ceo_dashboard") {
      // CEO dashboard: aggregate everything (inline to avoid mutation chaining)
      const allBranchesForCeo = await ctx.db.query("branchMetrics").withIndex("period", (q) => q.eq("period", period)).collect();
      const allCounselorsForCeo = await ctx.db.query("counselorMetrics").withIndex("period", (q) => q.eq("period", period)).collect();
      const funnels = await (ctx.db as any).query("conversionFunnels").withIndex("period", (q) => q.eq("period", period)).collect();

      const totalRevenue = allBranchesForCeo.reduce((s: number, b: any) => s + b.revenue, 0);
      const totalNewLeads = allBranchesForCeo.reduce((s: number, b: any) => s + b.newLeads, 0);
      const totalActive = allBranchesForCeo.reduce((s: number, b: any) => s + b.activeLeads, 0);
      const totalConversions = allCounselorsForCeo.reduce((s: number, c: any) => s + c.conversions, 0);

      data = {
        totalRevenue,
        totalNewLeads,
        totalActive,
        totalConversions,
        currentFunnel: funnels[0] || null,
        branchRankings: allBranchesForCeo.sort((a: any, b: any) => b.revenue - a.revenue),
        counselorLeaderboard: allCounselorsForCeo.sort((a: any, b: any) => b.score - a.score).slice(0, 10),
        snapshotTime: now,
      };
    } else if (args.snapshotType === "full_analytics") {
      // Full analytics: inline all metric calculations
      // Inline branch metric collection
      const allBranches = await ctx.db.query("branches").collect();
      for (const branch of allBranches) {
        const periodStartB = getPeriodStart(period);
        const periodEndB = getPeriodEnd(period);
        const branchUsers = await ctx.db.query("users").filter((q: any) =>
          q.eq(q.field("branchId"), branch._id)
        ).collect();
        const allLeadsB = await ctx.db.query("leadMaster").collect();
        const branchLeadsB = allLeadsB.filter((l) => l.branchInterestId === branch._id);
        const newLeadsB = branchLeadsB.filter((l) => l.createdAt >= periodStartB && l.createdAt <= periodEndB);
        await contextlessInsert(ctx, "branchMetrics", {
          branchId: branch._id, period, periodStart: periodStartB, periodEnd: periodEndB,
          newLeads: newLeadsB.length, activeLeads: branchLeadsB.filter((l) => l.status === "active").length,
          demoRate: 0, trialRate: 0, admissionRate: 0,
          revenue: branchLeadsB.filter((l) => l.status === "converted" && l.standardAmount).reduce((s: number, l: any) => s + (l.standardAmount || 0), 0),
          pendingFollowups: branchLeadsB.filter((l) => l.nextActionDate && l.nextActionDate > Date.now() && l.status === "active").length,
          slaCompliance: 100, counselorCount: branchUsers.length, createdAt: Date.now(),
        });
      }

      const allCounselors = await ctx.db.query("users").filter((q: any) =>
        q.and(q.neq(q.field("role"), undefined), q.neq(q.field("isDisabled"), true))
      ).collect();
      for (const counselor of allCounselors) {
        const periodStartC = getPeriodStart(period);
        const periodEndC = getPeriodEnd(period);
        const allLeadsC = await ctx.db.query("leadMaster").collect();
        const assignedLeadsC = allLeadsC.filter((l) => l.ownerId === counselor._id);
        const conversionsC = assignedLeadsC.filter((l) => l.status === "converted" && l.updatedAt >= periodStartC && l.updatedAt <= periodEndC);
        await contextlessInsert(ctx, "counselorMetrics", {
          userId: counselor._id, period, periodStart: periodStartC, periodEnd: periodEndC,
          assignedLeads: assignedLeadsC.length, callsMade: 0, meetingsHeld: 0, followupsCompleted: 0,
          conversions: conversionsC.length, lostLeads: assignedLeadsC.filter((l) => l.status === "lost").length,
          revenueGenerated: assignedLeadsC.filter((l) => l.status === "converted" && l.standardAmount).reduce((s: number, l: any) => s + (l.standardAmount || 0), 0),
          avgResponseTime: 0, winRate: 0, score: 0, createdAt: Date.now(),
        });
      }

      data = {
        fullRefresh: true,
        branchesCalculated: allBranches.length,
        counselorsCalculated: allCounselors.length,
        snapshotTime: now,
      };
    }

    // @ts-expect-error - legacy analytics table
    const snapshotId = await ctx.db.insert("analyticsSnapshots", {
      snapshotType: args.snapshotType,
      period,
      periodStart,
      periodEnd,
      data: JSON.stringify(data),
      createdAt: now,
    });

    return { snapshotId, data };
  },
});

export const getAnalyticsSnapshot = query({
  args: {
    snapshotType: v.union(
      v.literal("ceo_dashboard"), v.literal("branch_dashboard"),
      v.literal("counselor_dashboard"), v.literal("company_metrics"),
      v.literal("full_analytics"),
    ),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const p = args.period || "month";
    const snapshot = await ctx.db
      .query("analyticsSnapshots")
      .withIndex("snapshotType_period", (q) => q.eq("snapshotType", args.snapshotType).eq("period", p))
      .order("desc")
      .first();

    if (!snapshot) return null;
    return {
      ...snapshot,
      data: JSON.parse(snapshot.data),
    };
  },
});

/* ────────────
   QUICK DASHBOARD QUERIES (no caching, real-time)
   ──────────── */

export const getCeoDashboard = query({
  args: {},
  handler: async (ctx) => {
    const allLeads = await ctx.db.query("leadMaster").collect();
    const now = Date.now();

    const totalLeads = allLeads.length;
    const qualified = allLeads.filter((l) => ["qualified", "counselling", "interested"].includes(l.stage)).length;
    const trials = allLeads.filter((l) => ["interested", "follow_up", "negotiation"].includes(l.stage)).length;
    const admissions = allLeads.filter((l) => l.status === "converted").length;
    const revenue = allLeads.filter((l) => l.status === "converted" && l.standardAmount)
      .reduce((s, l) => s + (l.standardAmount || 0), 0);
    const conversionRate = totalLeads > 0 ? Math.round((admissions / totalLeads) * 100) : 0;
    const pipelineValue = allLeads.filter((l) => l.status === "active" && l.standardAmount)
      .reduce((s, l) => s + (l.standardAmount || 0), 0);

    // Stage breakdown
    const stageBreakdown: Record<string, number> = {};
    for (const l of allLeads) {
      stageBreakdown[l.stage] = (stageBreakdown[l.stage] || 0) + 1;
    }

    return {
      totalLeads,
      qualified,
      trials,
      admissions,
      revenue,
      conversionRate,
      pipelineValue,
      stageBreakdown,
    };
  },
});
