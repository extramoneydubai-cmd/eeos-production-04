import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── KPI DEFINITIONS ───────────────────────────────────────

export const createKpi = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    unit: v.optional(v.string()),
    formula: v.optional(v.string()),
    target: v.optional(v.number()),
    minimum: v.optional(v.number()),
    maximum: v.optional(v.number()),
    frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("quarterly"), v.literal("yearly")),
    dataSource: v.string(),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db.insert("kpiDefinitions", {
      name: args.name,
      code: args.code,
      description: args.description,
      category: args.category,
      unit: args.unit,
      formula: args.formula,
      target: args.target,
      minimum: args.minimum,
      maximum: args.maximum,
      frequency: args.frequency,
      dataSource: args.dataSource,
      isActive: args.isActive !== undefined ? args.isActive : true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateKpi = mutation({
  args: {
    id: v.id("kpiDefinitions"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    target: v.optional(v.number()),
    minimum: v.optional(v.number()),
    maximum: v.optional(v.number()),
    frequency: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("quarterly"), v.literal("yearly"))),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    return id;
  },
});

export const deleteKpi = mutation({
  args: { id: v.id("kpiDefinitions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const listKpis = query({
  args: {
    category: v.optional(v.string()),
    frequency: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("quarterly"), v.literal("yearly"))),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("kpiDefinitions");
    if (args.category) {
      query = query.filter((q: any) => q.eq(q.field("category"), args.category));
    }
    if (args.frequency) {
      query = query.filter((q: any) => q.eq(q.field("frequency"), args.frequency));
    }
    if (args.isActive !== undefined) {
      query = query.filter((q: any) => q.eq(q.field("isActive"), args.isActive));
    }
    return query.collect();
  },
});

export const getKpi = query({
  args: { id: v.id("kpiDefinitions") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

// ─── KPI VALUES (STORED IN ANALYTICS SNAPSHOTS) ────────────

export const recordKpiValue = mutation({
  args: {
    kpiCode: v.string(),
    period: v.string(),
    value: v.number(),
    actual: v.optional(v.number()),
    target: v.optional(v.number()),
    unit: v.optional(v.string()),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Store KPI values in analyticsSnapshots for consistency
    return ctx.db.insert("analyticsSnapshots", {
      snapshotType: `kpi_${args.kpiCode}`,
      period: args.period,
      periodStart: Date.now(),
      periodEnd: Date.now(),
      data: JSON.stringify({
        value: args.value,
        actual: args.actual || args.value,
        target: args.target,
        unit: args.unit,
        metadata: args.metadata,
      }),
      createdBy: userId,
      createdAt: Date.now(),
    });
  },
});

// ─── KPI CALCULATIONS ──────────────────────────────────────

export const calculateKpiValues = mutation({
  args: {
    period: v.string(),
    kpiCodes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const allKpis = await ctx.db.query("kpiDefinitions")
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .collect();

    const targetKpis = args.kpiCodes
      ? allKpis.filter((k: any) => args.kpiCodes!.includes(k.code))
      : allKpis;

    const results: any[] = [];

    for (const kpi of targetKpis) {
      try {
        const value = await computeKpiValue(ctx, kpi, args.period);
        const snapshotId = await ctx.db.insert("analyticsSnapshots", {
          snapshotType: `kpi_${kpi.code}`,
          period: args.period,
          periodStart: Date.now(),
          periodEnd: Date.now(),
          data: JSON.stringify({
            value: value.current,
            actual: value.current,
            target: kpi.target,
            minimum: kpi.minimum,
            maximum: kpi.maximum,
            unit: kpi.unit,
            category: kpi.category,
            trend: value.trend,
            previousValue: value.previous,
            changePercent: value.changePercent,
          }),
          createdBy: userId,
          createdAt: Date.now(),
        });
        results.push({ kpiCode: kpi.code, value: value.current, snapshotId });
      } catch (err: any) {
        results.push({ kpiCode: kpi.code, error: err.message });
      }
    }

    return { calculated: results.length, results };
  },
});

async function computeKpiValue(ctx: any, kpi: any, period: string): Promise<{
  current: number;
  previous: number;
  trend: "up" | "down" | "stable";
  changePercent: number;
}> {
  // Try to get from existing analytics snapshots first
  const existing = await ctx.db.query("analyticsSnapshots")
    .withIndex("snapshotType_period", (q: any) =>
      q.eq("snapshotType", `kpi_${kpi.code}`).eq("period", period))
    .first();

  if (existing) {
    const data = JSON.parse(existing.data);
    return {
      current: data.value,
      previous: data.previousValue || 0,
      trend: data.trend || "stable",
      changePercent: data.changePercent || 0,
    };
  }

  // Compute based on data source
  let current = 0;
  let previous = 0;

  switch (kpi.dataSource) {
    case "leads": {
      const leads = await ctx.db.query("leadMaster").collect();
      current = leads.length;
      break;
    }
    case "active_leads": {
      const leads = await ctx.db.query("leadMaster")
        .filter((q: any) => q.eq(q.field("status"), "active"))
        .collect();
      current = leads.length;
      break;
    }
    case "conversions": {
      const leads = await ctx.db.query("leadMaster")
        .filter((q: any) => q.eq(q.field("status"), "converted"))
        .collect();
      current = leads.length;
      break;
    }
    case "conversion_rate": {
      const all = await ctx.db.query("leadMaster").collect();
      const converted = all.filter((l: any) => l.status === "converted");
      current = all.length > 0 ? Math.round((converted.length / all.length) * 100) : 0;
      break;
    }
    case "students": {
      const students = await ctx.db.query("studentMaster").collect();
      current = students.length;
      break;
    }
    case "active_students": {
      const students = await ctx.db.query("studentMaster")
        .filter((q: any) => q.eq(q.field("status"), "active"))
        .collect();
      current = students.length;
      break;
    }
    case "revenue": {
      const payments = await ctx.db.query("paymentTransactions")
        .filter((q: any) => q.or(q.eq(q.field("status"), "verified"), q.eq(q.field("status"), "completed")))
        .collect();
      current = payments.reduce((s: number, p: any) => s + p.amount, 0);
      break;
    }
    case "outstanding": {
      const accounts = await ctx.db.query("studentFeeAccounts").collect();
      current = accounts.reduce((s: number, a: any) => s + a.outstandingBalance, 0);
      break;
    }
    case "users": {
      const users = await ctx.db.query("users").collect();
      current = users.filter((u: any) => !u.isDisabled).length;
      break;
    }
    case "tasks_completed": {
      const tasks = await ctx.db.query("tasks")
        .filter((q: any) => q.eq(q.field("status"), "done"))
        .collect();
      current = tasks.length;
      break;
    }
    case "pendings": {
      const tasks = await ctx.db.query("tasks")
        .filter((q: any) => q.and(
          q.neq(q.field("status"), "done"),
          q.neq(q.field("isArchived"), true),
        ))
        .collect();
      current = tasks.length;
      break;
    }
    case "sla_violations": {
      const violations = await ctx.db.query("slaViolations")
        .filter((q: any) => q.neq(q.field("status"), "resolved"))
        .collect();
      current = violations.length;
      break;
    }
    case "workflows_active": {
      const workflows = await ctx.db.query("workflowInstances")
        .filter((q: any) => q.eq(q.field("status"), "running"))
        .collect();
      current = workflows.length;
      break;
    }
    default: {
      current = 0;
    }
  }

  const trend: "up" | "down" | "stable" = current > previous ? "up" : current < previous ? "down" : "stable";
  const changePercent = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;

  return { current, previous, trend, changePercent };
}

// ─── KPI DASHBOARD ─────────────────────────────────────────

export const getKpiDashboard = query({
  args: {
    period: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const period = args.period || new Date().toISOString().substring(0, 7); // YYYY-MM

    const kpis = await ctx.db.query("kpiDefinitions")
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .collect();

    const filteredKpis = args.category
      ? kpis.filter((k: any) => k.category === args.category)
      : kpis;

    const kpiValues: any[] = [];

    for (const kpi of filteredKpis) {
      const snapshot = await ctx.db.query("analyticsSnapshots")
        .withIndex("snapshotType_period", (q: any) =>
          q.eq("snapshotType", `kpi_${kpi.code}`).eq("period", period))
        .first();

      let value = 0;
      let target = kpi.target;
      let trend: "up" | "down" | "stable" = "stable";
      let changePercent = 0;

      if (snapshot) {
        const data = JSON.parse(snapshot.data);
        value = data.value || data.actual || 0;
        trend = data.trend || "stable";
        changePercent = data.changePercent || 0;
        if (data.target) target = data.target;
      } else {
        // Compute on the fly
        const computed = await computeKpiValue(ctx, kpi, period);
        value = computed.current;
        trend = computed.trend;
        changePercent = computed.changePercent;
      }

      const status = target
        ? (value >= target ? "exceeded" : value >= (kpi.minimum || target * 0.8) ? "on_track" : "at_risk")
        : "no_target";

      kpiValues.push({
        kpiCode: kpi.code,
        kpiName: kpi.name,
        category: kpi.category,
        unit: kpi.unit,
        value,
        target,
        minimum: kpi.minimum,
        maximum: kpi.maximum,
        status,
        trend,
        changePercent,
        frequency: kpi.frequency,
      });
    }

    // Group by category
    const byCategory: Record<string, any[]> = {};
    for (const kv of kpiValues) {
      if (!byCategory[kv.category]) byCategory[kv.category] = [];
      byCategory[kv.category].push(kv);
    }

    return {
      period,
      totalKpis: filteredKpis.length,
      onTrack: kpiValues.filter((k: any) => k.status === "on_track" || k.status === "exceeded").length,
      atRisk: kpiValues.filter((k: any) => k.status === "at_risk").length,
      noTarget: kpiValues.filter((k: any) => k.status === "no_target").length,
      byCategory,
      kpiValues,
    };
  },
});

// ─── KPI SCORECARD ─────────────────────────────────────────

export const getExecutiveScorecard = query({
  args: {
    period: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const period = args.period || new Date().toISOString().substring(0, 7);

    // Core KPIs across all categories
    const kpis = await ctx.db.query("kpiDefinitions")
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .collect();

    const categories = [...new Set(kpis.map((k: any) => k.category))];
    const scorecard: Record<string, any> = {};
    let totalScore = 0;
    let totalKpis = 0;

    for (const category of categories) {
      const categoryKpis = kpis.filter((k: any) => k.category === category);
      let categoryScore = 0;
      let categoryTotal = 0;

      const metrics: any[] = [];
      for (const kpi of categoryKpis) {
        const computed = await computeKpiValue(ctx, kpi, period);
        const score = kpi.target
          ? Math.min(100, Math.round((computed.current / kpi.target) * 100))
          : 50; // Neutral score if no target

        metrics.push({
          kpi: kpi.name,
          code: kpi.code,
          value: computed.current,
          target: kpi.target,
          unit: kpi.unit,
          score,
          trend: computed.trend,
        });

        categoryScore += score;
        categoryTotal++;
      }

      const avgScore = categoryTotal > 0 ? Math.round(categoryScore / categoryTotal) : 0;
      scorecard[category] = { score: avgScore, metrics };
      totalScore += categoryScore;
      totalKpis += categoryTotal;
    }

    return {
      period,
      overallScore: totalKpis > 0 ? Math.round(totalScore / totalKpis) : 0,
      scorecard,
      gradedKpis: totalKpis,
    };
  },
});

// ─── KPI TRENDS ────────────────────────────────────────────

export const getKpiTrend = query({
  args: {
    kpiCode: v.string(),
    periods: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const numPeriods = args.periods || 6;

    const snapshots = await ctx.db.query("analyticsSnapshots")
      .filter((q: any) => q.eq(q.field("snapshotType"), `kpi_${args.kpiCode}`))
      .order("desc")
      .collect();

    const latestSnapshots = snapshots.slice(0, numPeriods);
    const trend = latestSnapshots.map((s: any) => {
      const data = JSON.parse(s.data);
      return {
        period: s.period,
        value: data.value || data.actual || 0,
        target: data.target,
        changePercent: data.changePercent || 0,
      };
    }).reverse();

    const values = trend.map((t: any) => t.value);
    const avg = values.length > 0
      ? Math.round(values.reduce((s: number, v: number) => s + v, 0) / values.length)
      : 0;

    return {
      kpiCode: args.kpiCode,
      periods: trend,
      average: avg,
      min: values.length > 0 ? Math.min(...values) : 0,
      max: values.length > 0 ? Math.max(...values) : 0,
      volatility: values.length > 1
        ? Math.round(values.reduce((s: number, v: number) => s + Math.abs(v - avg), 0) / values.length)
        : 0,
    };
  },
});
