import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { logActivity, createNotification } from "./crmHelpers";
import { withScopeAndEvents, type ScopeAndEventsConfig } from "./withScopeAndEvents";

// ─── Enterprise Handler Factory ───────────────────────────────────────
// Wraps ctx-based auth extraction for withScopeAndEvents integration.
// When a session token is supplied the withScopeAndEvents wrapper resolves
// the REAL performer from the sessions table; getAuthUserId (Convex auth
// headers) only applies to legacy flows. The declared actor args (createdBy,
// startedBy, ...) remain the recorded actors, while authorization uses the
// verified performer.

function withSla<P = any, R = any>(
  operation: ScopeAndEventsConfig<P, R>["operation"],
  entity: string,
  handler: (ctx: any, args: P) => Promise<R>,
) {
  return async (ctx: any, args: P) => {
    const raw = args as any;
    const hasToken = typeof raw?.token === "string" && raw.token.length > 0;
    let userId: Id<"users"> | undefined;
    if (!hasToken) {
      userId = (await getAuthUserId(ctx)) as Id<"users"> | undefined;
    }

    const wrappedHandler = withScopeAndEvents<P, R>(
      {
        operation,
        module: "crm",
        entity,
        getEntityCompanyId: () => undefined,
        getEntityBranchId: () => undefined,
        getEntityDepartmentId: () => undefined,
        getUserId: () => userId as Id<"users">,
        notifyViaMatrix: true,
        triggerWorkflow: true,
        triggerAutomation: true,
        registerSearch: true,
        signalDashboard: true,
      },
      (ctx2, args2) => handler(ctx2, args2),
    );
    return wrappedHandler(ctx, args);
  };
}

/* ────────────
   INTERNAL HELPERS
   ──────────── */

async function createTimelineEvent(
  ctx: any,
  args: {
    leadId: Id<"leadMaster">;
    eventType: string;
    title: string;
    description?: string;
    metadata?: string;
    performedBy?: Id<"users">;
  },
) {
  const now = Date.now();
  return ctx.db.insert("leadTimeline", {
    leadId: args.leadId,
    eventType: args.eventType,
    title: args.title,
    description: args.description,
    metadata: args.metadata,
    performedBy: args.performedBy,
    performedAt: now,
    createdAt: now,
  });
}

function calculateDeadline(startTime: number, duration: number, unit: string): number {
  const multipliers: Record<string, number> = {
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    business_days: 24 * 60 * 60 * 1000,
  };
  const multiplier = multipliers[unit] || 24 * 60 * 60 * 1000;
  return startTime + duration * multiplier;
}

/* ────────────
   SLA POLICY CRUD
   ──────────── */

export const listSlaPolicies = query({
  args: {
    slaType: v.optional(v.union(
      v.literal("first_contact"), v.literal("demo"),
      v.literal("trial"), v.literal("admission"),
      v.literal("payment"), v.literal("follow_up"),
      v.literal("custom"),
    )),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("slaPolicies");
    if (args.slaType) {
      q = q.filter((r) => r.eq(r.field("slaType"), args.slaType!));
    }
    if (args.isActive !== undefined) {
      q = q.filter((r) => r.eq(r.field("isActive"), args.isActive!));
    }
    return q.collect();
  },
});

export const createSlaPolicy = mutation({
  args: {
    token: v.optional(v.string()),
    name: v.string(),
    description: v.optional(v.string()),
    slaType: v.union(
      v.literal("first_contact"), v.literal("demo"),
      v.literal("trial"), v.literal("admission"),
      v.literal("payment"), v.literal("follow_up"),
      v.literal("custom"),
    ),
    duration: v.number(),
    durationUnit: v.union(
      v.literal("minutes"), v.literal("hours"),
      v.literal("days"), v.literal("business_days"),
    ),
    reminderSchedule: v.optional(v.string()),
    escalationChain: v.optional(v.string()),
    reassignmentPolicy: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: withSla("create", "sla_policy", async (ctx, args) => {
    return ctx.db.insert("slaPolicies", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const updateSlaPolicy = mutation({
  args: {
    token: v.optional(v.string()),
    policyId: v.id("slaPolicies"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    duration: v.optional(v.number()),
    durationUnit: v.optional(v.union(
      v.literal("minutes"), v.literal("hours"),
      v.literal("days"), v.literal("business_days"),
    )),
    reminderSchedule: v.optional(v.string()),
    escalationChain: v.optional(v.string()),
    reassignmentPolicy: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: withSla("update", "sla_policy", async (ctx, args) => {
    const { policyId, ...fields } = args;
    const existing = await ctx.db.get(policyId);
    if (!existing) throw new Error("SLA policy not found");
    return ctx.db.patch(policyId, { ...fields, updatedAt: Date.now() });
  }),
});

export const deleteSlaPolicy = mutation({
  args: { token: v.optional(v.string()), policyId: v.id("slaPolicies") },
  handler: withSla("delete", "sla_policy", async (ctx, args) => {
    const existing = await ctx.db.get(args.policyId);
    if (!existing) throw new Error("SLA policy not found");
    await ctx.db.delete(args.policyId);
  }),
});

/* ────────────
   SLA LIFECYCLE
   ──────────── */

export const startSLA = mutation({
  args: {
    token: v.optional(v.string()),
    leadId: v.id("leadMaster"),
    slaPolicyId: v.id("slaPolicies"),
    startedBy: v.optional(v.id("users")),
  },
  handler: withSla("create", "sla", async (ctx, args) => {
    const policy = await ctx.db.get(args.slaPolicyId);
    if (!policy) throw new Error("SLA policy not found");
    if (!policy.isActive) throw new Error("SLA policy is not active");

    const now = Date.now();
    const deadline = calculateDeadline(now, policy.duration, policy.durationUnit);

    await createTimelineEvent(ctx, {
      leadId: args.leadId,
      eventType: "LeadUpdated",
      title: `SLA started: ${policy.name}`,
      description: `Deadline: ${new Date(deadline).toLocaleString()} (${policy.duration} ${policy.durationUnit})`,
      metadata: JSON.stringify({ slaPolicyId: args.slaPolicyId, deadline, slaType: policy.slaType }),
      performedBy: args.startedBy,
    });

    return { slaPolicyId: args.slaPolicyId, deadline, startedAt: now };
  }),
});

export const pauseSLA = mutation({
  args: {
    token: v.optional(v.string()),
    leadId: v.id("leadMaster"),
    slaPolicyId: v.id("slaPolicies"),
    pausedBy: v.optional(v.id("users")),
  },
  handler: withSla("update", "sla", async (ctx, args) => {
    await createTimelineEvent(ctx, {
      leadId: args.leadId,
      eventType: "LeadUpdated",
      title: "SLA paused",
      metadata: JSON.stringify({ slaPolicyId: args.slaPolicyId }),
      performedBy: args.pausedBy,
    });
  }),
});

export const resumeSLA = mutation({
  args: {
    token: v.optional(v.string()),
    leadId: v.id("leadMaster"),
    slaPolicyId: v.id("slaPolicies"),
    resumedBy: v.optional(v.id("users")),
  },
  handler: withSla("update", "sla", async (ctx, args) => {
    await createTimelineEvent(ctx, {
      leadId: args.leadId,
      eventType: "LeadUpdated",
      title: "SLA resumed",
      metadata: JSON.stringify({ slaPolicyId: args.slaPolicyId }),
      performedBy: args.resumedBy,
    });
  }),
});

export const completeSLA = mutation({
  args: {
    token: v.optional(v.string()),
    leadId: v.id("leadMaster"),
    slaPolicyId: v.id("slaPolicies"),
    completedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  },
  handler: withSla("update", "sla", async (ctx, args) => {
    // Resolve any violations for this SLA
    const violations = await ctx.db
      .query("slaViolations")
      .withIndex("leadId", (q: any) => q.eq("leadId", args.leadId))
      .filter((q: any) => q.and(
        q.eq(q.field("slaPolicyId"), args.slaPolicyId),
        q.eq(q.field("status"), "open"),
      ))
      .collect();

    for (const violation of violations) {
      await ctx.db.patch(violation._id, {
        status: "resolved",
        resolvedAt: Date.now(),
        resolvedBy: args.completedBy,
        notes: args.notes || "SLA completed",
      });
    }

    await createTimelineEvent(ctx, {
      leadId: args.leadId,
      eventType: "LeadUpdated",
      title: "SLA completed",
      metadata: JSON.stringify({ slaPolicyId: args.slaPolicyId }),
      performedBy: args.completedBy,
    });
  }),
});

export const violateSLA = mutation({
  args: {
    token: v.optional(v.string()),
    leadId: v.id("leadMaster"),
    slaPolicyId: v.id("slaPolicies"),
    slaStartedAt: v.number(),
    slaDeadlineAt: v.number(),
    notes: v.optional(v.string()),
  },
  handler: withSla("create", "sla_violation", async (ctx, args) => {
    const now = Date.now();

    const violationId = await ctx.db.insert("slaViolations", {
      leadId: args.leadId,
      slaPolicyId: args.slaPolicyId,
      slaStartedAt: args.slaStartedAt,
      slaDeadlineAt: args.slaDeadlineAt,
      violatedAt: now,
      status: "open",
      notes: args.notes,
      createdAt: now,
    });

    await createTimelineEvent(ctx, {
      leadId: args.leadId,
      eventType: "LeadUpdated",
      title: "SLA violated",
      description: args.notes,
      metadata: JSON.stringify({ slaPolicyId: args.slaPolicyId, violationId }),
    });

    // Auto-escalation: Level 1
    await escalateLead(ctx, args.leadId, 1, "sla_violation", `SLA violation: ${args.notes || "Deadline missed"}`, violationId);

    return violationId;
  }),
});

/* ────────────
   ESCALATION
   ──────────── */

async function escalateLead(
  ctx: any,
  leadId: Id<"leadMaster">,
  level: number,
  escalationType: string,
  reason: string,
  slaViolationId?: Id<"slaViolations">,
  escalatedBy?: Id<"users">,
) {
  const now = Date.now();
  const lead = await ctx.db.get(leadId);

  // Find who to escalate to based on level
  let escalatedTo: Id<"users"> | undefined;

  if (lead?.ownerId) {
    const currentOwner = await ctx.db.get(lead.ownerId);
    if (currentOwner?.reportingManagerId) {
      escalatedTo = currentOwner.reportingManagerId;
    }
  }

  const escalationId = await ctx.db.insert("leadEscalations", {
    leadId,
    level,
    escalationType: escalationType as any,
    escalatedTo,
    escalatedBy,
    reason,
    slaViolationId,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });

  await createTimelineEvent(ctx, {
    leadId,
    eventType: "LeadUpdated",
    title: `Escalation Level ${level}`,
    description: reason,
    metadata: JSON.stringify({ escalationId, level, type: escalationType }),
    performedBy: escalatedBy,
  });

  if (escalatedTo) {
    await createNotification(
      ctx, escalatedTo, "lead", `Escalation Level ${level}`,
      `${lead?.firstName || ""} ${lead?.lastName || ""} requires attention: ${reason}`,
      leadId, "lead",
    );
  }

  await logActivity(ctx, leadId, "escalation", `Escalation Level ${level}: ${reason}`, escalatedBy || escalatedTo || "");

  return escalationId;
}

export const escalateLeadMutation = mutation({
  args: {
    token: v.optional(v.string()),
    leadId: v.id("leadMaster"),
    level: v.number(),
    escalationType: v.union(
      v.literal("sla_violation"), v.literal("manual"),
      v.literal("auto_reassign"), v.literal("workflow"),
    ),
    reason: v.string(),
    slaViolationId: v.optional(v.id("slaViolations")),
    escalatedBy: v.optional(v.id("users")),
  },
  handler: withSla("create", "escalation", async (ctx, args) => {
    return escalateLead(ctx, args.leadId, args.level, args.escalationType, args.reason, args.slaViolationId, args.escalatedBy);
  }),
});

export const acknowledgeEscalation = mutation({
  args: {
    token: v.optional(v.string()),
    escalationId: v.id("leadEscalations"),
    userId: v.id("users"),
  },
  handler: withSla("update", "escalation", async (ctx, args) => {
    const escalation = await ctx.db.get(args.escalationId);
    if (!escalation) throw new Error("Escalation not found");

    await ctx.db.patch(args.escalationId, {
      status: "acknowledged",
      notes: `Acknowledged by ${args.userId}`,
      updatedAt: Date.now(),
    });
  }),
});

export const resolveEscalation = mutation({
  args: {
    token: v.optional(v.string()),
    escalationId: v.id("leadEscalations"),
    userId: v.id("users"),
    reassignTo: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  },
  handler: withSla("update", "escalation", async (ctx, args) => {
    const escalation = await ctx.db.get(args.escalationId);
    if (!escalation) throw new Error("Escalation not found");

    const now = Date.now();

    if (args.reassignTo) {
      // Reassign the lead
      await ctx.db.patch(escalation.leadId, { ownerId: args.reassignTo, updatedAt: now });

      await ctx.db.insert("leadAssignments", {
        leadId: escalation.leadId,
        toUserId: args.reassignTo,
        assignedBy: args.userId,
        note: "Auto-reassignment from escalation",
        createdAt: now,
      });
    }

    await ctx.db.patch(args.escalationId, {
      status: args.reassignTo ? "reassigned" : "resolved",
      notes: args.notes,
      resolvedAt: now,
      updatedAt: now,
    });

    // Also resolve linked SLA violation
    if (escalation.slaViolationId) {
      await ctx.db.patch(escalation.slaViolationId, {
        status: "resolved",
        resolvedAt: now,
        resolvedBy: args.userId,
      });
    }
  }),
});

/* ────────────
   ESCALATION QUERIES
   ──────────── */

export const getLeadEscalations = query({
  args: {
    leadId: v.id("leadMaster"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("leadEscalations")
      .withIndex("leadId", (q) => q.eq("leadId", args.leadId));

    if (args.status) {
      q = q.filter((r) => r.eq(r.field("status"), args.status!));
    }

    return q.order("desc").take(20);
  },
});

export const getPendingEscalations = query({
  args: {
    escalatedTo: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("leadEscalations")
      .withIndex("status", (q) => q.eq("status", "pending"));

    if (args.escalatedTo) {
      q = q.filter((r) => r.eq(r.field("escalatedTo"), args.escalatedTo!));
    }

    return q.order("desc").take(args.limit || 20);
  },
});

/* ────────────
   SLA VIOLATION QUERIES
   ──────────── */

export const getLeadSlaViolations = query({
  args: {
    leadId: v.id("leadMaster"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("slaViolations")
      .withIndex("leadId", (q) => q.eq("leadId", args.leadId));

    if (args.status) {
      q = q.filter((r) => r.eq(r.field("status"), args.status!));
    }

    return q.order("desc").take(20);
  },
});

export const getOpenSlaViolations = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("slaViolations")
      .withIndex("status", (q) => q.eq("status", "open"))
      .order("desc")
      .take(args.limit || 20);
  },
});

/* ────────────
   DASHBOARD KPIs
   ──────────── */

export const getSlaDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // All violations
    const allViolations = await ctx.db.query("slaViolations").collect();
    const openViolations = allViolations.filter((v) => v.status === "open");
    const todayViolations = allViolations.filter((v) => v.violatedAt >= todayStart.getTime());
    const resolvedViolations = allViolations.filter((v) => v.status === "resolved");

    // All policies
    const allPolicies = await ctx.db.query("slaPolicies").collect();
    const activePolicies = allPolicies.filter((p) => p.isActive);

    // Escalations
    const allEscalations = await ctx.db.query("leadEscalations").collect();
    const pendingEscalations = allEscalations.filter((e) => e.status === "pending");
    const resolvedEscalations = allEscalations.filter((e) => e.status === "resolved" || e.status === "reassigned");

    // SLA compliance rate
    const slaComplianceRate = allViolations.length > 0
      ? Math.round((resolvedViolations.length / allViolations.length) * 100)
      : 100;

    // Average response time (time from violation to resolution)
    const resolvedWithTimes = resolvedViolations.filter((v) => v.resolvedAt);
    const avgResponseTime = resolvedWithTimes.length > 0
      ? Math.round(
          resolvedWithTimes.reduce((sum, v) => sum + (v.resolvedAt! - v.violatedAt), 0) /
            resolvedWithTimes.length /
            60000,
        )
      : 0;

    return {
      slaComplianceRate,
      activePolicies: activePolicies.length,
      openViolations: openViolations.length,
      todayViolations: todayViolations.length,
      resolvedViolations: resolvedViolations.length,
      totalViolations: allViolations.length,
      pendingEscalations: pendingEscalations.length,
      resolvedEscalations: resolvedEscalations.length,
      avgResponseTimeMinutes: avgResponseTime,
    };
  },
});

export const getEscalationSummary = query({
  args: {},
  handler: async (ctx) => {
    const allEscalations = await ctx.db.query("leadEscalations").collect();

    const byLevel: Record<number, number> = {};
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const esc of allEscalations) {
      byLevel[esc.level] = (byLevel[esc.level] || 0) + 1;
      byType[(esc as any).escalationType] = (byType[(esc as any).escalationType] || 0) + 1;
      byStatus[(esc as any).status] = (byStatus[(esc as any).status] || 0) + 1;
    }

    return { byLevel, byType, byStatus, total: allEscalations.length };
  },
});
