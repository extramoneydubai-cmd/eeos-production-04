/**
 * Technology Engine — PATCH-ERP-003 Phase 2
 *
 * Powers the Technology Workspace (/studio/technology).
 *
 * Reuses (never duplicates):
 *   - adminEngine           → API keys, webhooks, scheduled jobs, backups, system health
 *   - runtimeObservability  → queue health, workflow health, event pipeline, SLA breaches,
 *                             scope violations, runtime system health
 *   - integrationEngine     → connector/integration dashboard
 *
 * New persistence (genuinely missing): deploymentHistory + techMetrics
 * (see schema/technology.ts).
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  getSystemHealth as getAdminSystemHealth,
  listApiKeys,
  listWebhooks,
  listScheduledJobs,
  listBackups,
} from "./adminEngine";
import {
  getQueueLengths,
  getWorkflowHealth,
  getEventPipelineHealth,
  getSLABreaches,
  getScopeViolations,
  getSystemHealth as getRuntimeSystemHealth,
} from "./runtimeObservability";
import { getIntegrationDashboard } from "./integrationEngine";

// ─── Deployment History ────────────────────────────────────

export const listDeployments = query({
  args: {
    limit: v.optional(v.number()),
    environment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let docs = await ctx.db.query("deploymentHistory").order("desc").take(args.limit || 50);
    if (args.environment) {
      docs = docs.filter((d: any) => d.environment === args.environment);
    }
    return docs;
  },
});

export const recordDeployment = mutation({
  args: {
    version: v.string(),
    environment: v.union(
      v.literal("production"),
      v.literal("staging"),
      v.literal("development")
    ),
    status: v.union(
      v.literal("success"),
      v.literal("failed"),
      v.literal("in_progress"),
      v.literal("rolled_back")
    ),
    trigger: v.string(),
    deployedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
    durationMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("deploymentHistory", {
      ...args,
      deployedAt: now,
      createdAt: now,
    });
  },
});

// ─── Tech Usage Metrics (AI / Storage / Licenses / Latency) ─

export const listTechMetrics = query({
  args: {
    metric: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let docs = await ctx.db.query("techMetrics").order("desc").take(args.limit || 50);
    if (args.metric) {
      docs = docs.filter((m: any) => m.metric === args.metric);
    }
    return docs;
  },
});

export const recordTechMetric = mutation({
  args: {
    metric: v.string(),
    value: v.number(),
    unit: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("techMetrics", {
      metric: args.metric,
      value: args.value,
      unit: args.unit,
      recordedAt: now,
    });
  },
});

// ─── Aggregate Technology Dashboard ────────────────────────
// Everything is runtime-driven: aggregates live queries from the existing
// engines + the two new tables. No mock widgets.

export const getTechnologyDashboard = query({
  handler: async (ctx) => {
    const [
      adminHealth,
      runtimeHealth,
      queues,
      workflow,
      eventPipeline,
      sla,
      scope,
      apiKeys,
      webhooks,
      jobs,
      backups,
      deployments,
      metrics,
      integrations,
    ] = await Promise.all([
      (getAdminSystemHealth as any)(ctx),
      (getRuntimeSystemHealth as any)(ctx),
      (getQueueLengths as any)(ctx),
      (getWorkflowHealth as any)(ctx),
      (getEventPipelineHealth as any)(ctx, { sinceHours: 24 }),
      (getSLABreaches as any)(ctx, { sinceHours: 24 }),
      (getScopeViolations as any)(ctx),
      (listApiKeys as any)(ctx),
      (listWebhooks as any)(ctx),
      (listScheduledJobs as any)(ctx),
      (listBackups as any)(ctx),
      ctx.db.query("deploymentHistory").order("desc").take(20),
      ctx.db.query("techMetrics").order("desc").take(200),
      (getIntegrationDashboard as any)(ctx),
    ]);

    // Latest value per tech metric (time-series → snapshot)
    const metricLatest: Record<string, { value: number; unit?: string; recordedAt: number }> = {};
    for (const m of metrics as any[]) {
      const key = (m as any).metric;
      if (!metricLatest[key]) {
        metricLatest[key] = {
          value: (m as any).value,
          unit: (m as any).unit,
          recordedAt: (m as any).recordedAt,
        };
      }
    }

    // Recent metric history grouped by metric (last 12 points each)
    const metricHistory: Record<string, { value: number; recordedAt: number }[]> = {};
    for (const m of metrics as any[]) {
      const key = (m as any).metric;
      (metricHistory[key] = metricHistory[key] || []).push({
        value: (m as any).value,
        recordedAt: (m as any).recordedAt,
      });
      if (metricHistory[key].length > 12) metricHistory[key].shift();
    }

    const failedJobs = (jobs as any[]).filter(
      (j: any) => j.lastRunStatus === "failed" || (j.status === "failed")
    );

    return {
      timestamp: Date.now(),
      systemHealth: runtimeHealth,
      adminHealth,
      queues,
      workflowHealth: workflow,
      eventPipeline,
      slaBreaches: sla,
      scopeViolations: scope,
      apiKeys: (apiKeys as any[]).length,
      activeApiKeys: (apiKeys as any[]).filter((k: any) => k.isActive !== false).length,
      webhooks: (webhooks as any[]).length,
      activeWebhooks: (webhooks as any[]).filter((w: any) => w.isActive !== false).length,
      scheduledJobs: jobs,
      failedJobsCount: failedJobs.length,
      backups: backups,
      deployments,
      metricLatest,
      metricHistory,
      integrations,
    };
  },
});
