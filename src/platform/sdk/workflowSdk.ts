/**
 * Workflow SDK — Enterprise Workflow Service
 *
 * Every business module MUST use this SDK to interact with workflows.
 * No module may directly call ctx.db.insert("workflowInstances", ...).
 *
 * Usage:
 *   import { workflowSdk } from "@/platform/sdk/workflowSdk";
 *   const { instanceId } = await workflowSdk.start(ctx, { workflowId, triggerSource: ... });
 */

import { v } from "convex/values";
import { mutation, query } from "../../convex/_generated/server";
import { Id } from "../../convex/_generated/dataModel";

// ─── Types ───────────────────────────────────────────────────────────────

export interface WorkflowStartInput {
  workflowId: Id<"workflows">;
  triggerSource: string;
  triggerEntityId?: string;
  triggerPayload?: Record<string, unknown>;
  initiatedBy?: Id<"users">;
}

export interface ApprovalInput {
  instanceId: Id<"workflowInstances">;
  approved: boolean;
  performedBy?: Id<"users">;
  notes?: string;
}

// ─── SDK Methods ─────────────────────────────────────────────────────────

/**
 * Start a workflow instance.
 * Single entry point for starting ALL workflows.
 */
export const start = mutation({
  args: {
    workflowId: v.id("workflows"),
    triggerSource: v.string(),
    triggerEntityId: v.optional(v.string()),
    triggerPayload: v.optional(v.string()),
    initiatedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) throw new Error("Workflow not found");
    if (workflow.status !== "published") {
      throw new Error("Workflow must be published to start");
    }

    const startNode = await ctx.db
      .query("workflowNodes")
      .withIndex("workflowId", (q) => q.eq("workflowId", args.workflowId))
      .filter((q) => q.eq(q.field("nodeType"), "start"))
      .first();

    if (!startNode) throw new Error("No Start node found");

    const now = Date.now();
    const instanceId = await ctx.db.insert("workflowInstances", {
      workflowId: args.workflowId,
      workflowVersion: workflow.version,
      status: "started",
      currentStepId: startNode._id,
      triggerSource: args.triggerSource,
      triggerEntityId: args.triggerEntityId,
      triggerPayload: args.triggerPayload,
      startedAt: now,
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Log the start
    await ctx.db.insert("workflowLogs", {
      instanceId,
      workflowId: args.workflowId,
      nodeId: startNode._id,
      action: "started",
      status: "success",
      details: `Workflow started via ${args.triggerSource}`,
      performedBy: args.initiatedBy,
      createdAt: now,
    });

    return { instanceId };
  },
});

/**
 * Approve or reject a workflow step.
 */
export const approve = mutation({
  args: {
    instanceId: v.id("workflowInstances"),
    approved: v.boolean(),
    performedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) throw new Error("Instance not found");

    if (args.approved) {
      await ctx.db.patch(args.instanceId, {
        status: "in_progress",
        updatedAt: Date.now(),
      });

      await ctx.db.insert("workflowLogs", {
        instanceId: args.instanceId,
        workflowId: instance.workflowId,
        action: "approved",
        status: "success",
        details: `Approved by ${args.performedBy}`,
        metadata: args.notes,
        performedBy: args.performedBy,
        createdAt: Date.now(),
      });
    } else {
      await ctx.db.patch(args.instanceId, {
        status: "cancelled",
        updatedAt: Date.now(),
      });

      await ctx.db.insert("workflowLogs", {
        instanceId: args.instanceId,
        workflowId: instance.workflowId,
        action: "rejected",
        status: "cancelled",
        details: `Rejected by ${args.performedBy}: ${args.notes}`,
        performedBy: args.performedBy,
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Get workflow instances for an entity.
 */
export const getEntityInstances = query({
  args: {
    triggerEntityId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const instances = await ctx.db
      .query("workflowInstances")
      .withIndex("triggerEntityId", (q) => q.eq("triggerEntityId", args.triggerEntityId))
      .collect();

    return instances.sort((a, b) => b.createdAt - a.createdAt).slice(0, args.limit || 10);
  },
});

/**
 * Get workflow logs for an instance.
 */
export const getInstanceLogs = query({
  args: { instanceId: v.id("workflowInstances") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("workflowLogs")
      .withIndex("instanceId", (q) => q.eq("instanceId", args.instanceId))
      .collect()
      .then((logs) => logs.sort((a, b) => b.createdAt - a.createdAt));
  },
});

/**
 * Cancel a workflow instance.
 */
export const cancel = mutation({
  args: {
    instanceId: v.id("workflowInstances"),
    reason: v.optional(v.string()),
    cancelledBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) throw new Error("Instance not found");

    await ctx.db.patch(args.instanceId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });

    await ctx.db.insert("workflowLogs", {
      instanceId: args.instanceId,
      workflowId: instance.workflowId,
      action: "cancelled",
      status: "cancelled",
      details: args.reason,
      performedBy: args.cancelledBy,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Create a new workflow definition (for admin use).
 */
export const createWorkflow = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    module: v.string(),
    tag: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const workflowId = await ctx.db.insert("workflows", {
      name: args.name,
      code: args.code,
      description: args.description,
      module: args.module,
      status: "draft",
      version: 1,
      isActive: false,
      tag: args.tag,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    // Create default Start and End nodes
    await ctx.db.insert("workflowNodes", {
      workflowId,
      nodeType: "start",
      label: "Start",
      positionX: 50,
      positionY: 250,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("workflowNodes", {
      workflowId,
      nodeType: "end",
      label: "End",
      positionX: 700,
      positionY: 250,
      createdAt: now,
      updatedAt: now,
    });

    return { workflowId };
  },
});

/**
 * Publish a workflow definition.
 */
export const publishWorkflow = mutation({
  args: { workflowId: v.id("workflows") },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) throw new Error("Workflow not found");

    await ctx.db.patch(args.workflowId, {
      status: "published",
      version: workflow.version + 1,
      isActive: true,
      updatedAt: Date.now(),
    });

    return { success: true, version: workflow.version + 1 };
  },
});

/**
 * Get dashboard stats for workflow instances.
 */
export const getDashboardStats = query({
  handler: async (ctx) => {
    const instances = await ctx.db.query("workflowInstances").collect();
    const total = instances.length;
    const active = instances.filter((i) =>
      i.status === "started" || i.status === "in_progress"
    ).length;
    const completed = instances.filter((i) => i.status === "completed").length;
    const failed = instances.filter((i) => i.status === "failed").length;
    const paused = instances.filter((i) => i.status === "paused").length;
    return { total, active, completed, failed, paused };
  },
});
