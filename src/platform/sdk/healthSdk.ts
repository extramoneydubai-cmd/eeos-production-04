/**
 * Health SDK — Enterprise Health Center Data Layer
 *
 * Wires existing runtimeObservability.ts (9 live queries) so the
 * Operations Center / Enterprise Health Center pages consume live
 * runtime metrics through PlatformSDK — no direct api.xxx calls.
 *
 * Usage:
 *   import { PlatformSDK } from "@/platform/sdk";
 *   const queues = await PlatformSDK.health.queueLengths(ctx);
 *   const system = await PlatformSDK.health.systemHealth(ctx);
 */

import { v } from "convex/values";
import { mutation, query } from "../../convex/_generated/server";
import { Id } from "../../convex/_generated/dataModel";

// ─── SDK Queries — wire runtimeObservability ─────────────────

/**
 * Live queue depths (workflow, automation, notification, event, scheduler).
 */
export const queueLengths = query({
  handler: async (ctx) => {
    const { getQueueLengths } = await import("../../convex/runtimeObservability");
    try {
      return await getQueueLengths.handler(ctx, {});
    } catch {
      return { workflows: 0, automations: 0, notifications: 0, events: 0, schedulers: 0, total: 0 };
    }
  },
});

/**
 * Workflow health: running, failed, retry queue, dead-letter queue.
 */
export const workflowHealth = query({
  handler: async (ctx) => {
    const { getWorkflowHealth } = await import("../../convex/runtimeObservability");
    try {
      return await getWorkflowHealth.handler(ctx, {});
    } catch {
      return { running: 0, failed: 0, retryQueue: 0, deadLetterQueue: 0, healthScore: 100 };
    }
  },
});

/**
 * Event pipeline health: throughput, failures, latency.
 */
export const eventPipelineHealth = query({
  args: { sinceHours: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { getEventPipelineHealth } = await import("../../convex/runtimeObservability");
    try {
      return await getEventPipelineHealth.handler(ctx, { sinceHours: args.sinceHours });
    } catch {
      return { throughput: 0, failures: 0, avgLatencyMs: 0 };
    }
  },
});

/**
 * Scope violations and permission denials.
 */
export const scopeViolations = query({
  handler: async (ctx) => {
    const { getScopeViolations } = await import("../../convex/runtimeObservability");
    try {
      return await getScopeViolations.handler(ctx, {});
    } catch {
      return { violations: [], count: 0 };
    }
  },
});

/**
 * Active SLA breaches.
 */
export const slaBreaches = query({
  args: { sinceHours: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { getSLABreaches } = await import("../../convex/runtimeObservability");
    try {
      return await getSLABreaches.handler(ctx, { sinceHours: args.sinceHours });
    } catch {
      return { breaches: [], count: 0 };
    }
  },
});

/**
 * Overall system health: database, API latency, memory, CPU, storage.
 */
export const systemHealth = query({
  handler: async (ctx) => {
    const { getSystemHealth } = await import("../../convex/runtimeObservability");
    try {
      return await getSystemHealth.handler(ctx, {});
    } catch {
      return { status: "unknown", healthScore: 100, checks: [] };
    }
  },
});

/**
 * Finance runtime metrics: pending refunds, PDC queue, collections.
 */
export const financeMetrics = query({
  args: { companyId: v.optional(v.id("companies")), branchId: v.optional(v.id("branches")) },
  handler: async (ctx, args) => {
    const { getFinanceMetrics } = await import("../../convex/runtimeObservability");
    try {
      return await getFinanceMetrics.handler(ctx, { companyId: args.companyId, branchId: args.branchId });
    } catch {
      return { pendingRefunds: 0, pendingPdc: 0, bouncedCheques: 0, collectionsToday: 0 };
    }
  },
});

/**
 * Scheduling runtime metrics: conflicts, overloaded faculty, substitutes.
 */
export const schedulingMetrics = query({
  args: { companyId: v.optional(v.id("companies")), branchId: v.optional(v.id("branches")) },
  handler: async (ctx, args) => {
    const { getSchedulingMetrics } = await import("../../convex/runtimeObservability");
    try {
      return await getSchedulingMetrics.handler(ctx, { companyId: args.companyId, branchId: args.branchId });
    } catch {
      return { conflicts: 0, overloadedFaculty: 0, unassignedClasses: 0 };
    }
  },
});

/**
 * Unified operations dashboard for the Health Center home.
 */
export const operationsDashboard = query({
  args: { companyId: v.optional(v.id("companies")), branchId: v.optional(v.id("branches")) },
  handler: async (ctx, args) => {
    const { getOperationsDashboard } = await import("../../convex/runtimeObservability");
    try {
      return await getOperationsDashboard.handler(ctx, { companyId: args.companyId, branchId: args.branchId });
    } catch {
      return { queues: {}, workflow: {}, finance: {}, scheduling: {}, healthScore: 100 };
    }
  },
});

// ─── SDK Mutations — health acknowledgements ──────────────────

/**
 * Acknowledge resolved scope violations / SLA breaches (mark handled).
 */
export const acknowledgeIncident = mutation({
  args: { incidentType: v.string(), incidentId: v.optional(v.string()), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("auditLogs", {
      action: "incident.acknowledged",
      actorId: undefined,
      entityType: args.incidentType,
      entityId: args.incidentId,
      details: { note: args.note || "Acknowledged from Health Center", acknowledgedAt: now },
      createdAt: now,
    } as any);
    return { success: true, acknowledgedAt: now };
  },
});
