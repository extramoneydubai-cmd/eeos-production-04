import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withEventPipeline, entityIdFromArg, userIdFromArg } from "../platform/eventPipeline";
import { Events } from "./eventRegistry";

// ============================
// APPROVAL TEMPLATES
// ============================

export const listApprovalTemplates = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("approvalTemplates").collect();
  },
});

export const createApprovalTemplate = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    mode: v.string(),
    phases: v.array(
      v.object({
        name: v.string(),
        order: v.number(),
        requiredApprovers: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("approvalTemplates", {
      name: args.name,
      description: args.description,
      mode: args.mode as any,
      phases: args.phases.map((p) => ({ ...p, order: p.order, requiredApprovers: p.requiredApprovers })),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateApprovalTemplate = mutation({
  args: {
    id: v.id("approvalTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    mode: v.optional(v.string()),
    phases: v.optional(
      v.array(
        v.object({
          name: v.string(),
          order: v.number(),
          requiredApprovers: v.number(),
        })
      )
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const patch: Record<string, any> = { updatedAt: Date.now() };
    if (fields.name !== undefined) patch.name = fields.name;
    if (fields.description !== undefined) patch.description = fields.description;
    if (fields.mode !== undefined) patch.mode = fields.mode;
    if (fields.phases !== undefined) patch.phases = fields.phases;
    if (fields.isActive !== undefined) patch.isActive = fields.isActive;
    await ctx.db.patch(id, patch);
  },
});

export const deleteApprovalTemplate = mutation({
  args: { id: v.id("approvalTemplates") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ============================
// APPROVAL REQUESTS
// ============================

export const listApprovalRequests = query({
  args: {
    status: v.optional(v.string()),
    requesterId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let requests;
    if (args.status) {
      requests = await ctx.db.query("approvalRequests").withIndex("status", (q) => q.eq("status", args.status as any)).collect();
    } else if (args.requesterId) {
      requests = await ctx.db.query("approvalRequests").withIndex("requesterId", (q) => q.eq("requesterId", args.requesterId!)).collect();
    } else {
      requests = await ctx.db.query("approvalRequests").collect();
    }
    return requests.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getApprovalRequest = query({
  args: { requestId: v.id("approvalRequests") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.requestId);
  },
});

export const createApprovalRequest = mutation({
  args: {
    templateId: v.optional(v.id("approvalTemplates")),
    taskId: v.optional(v.id("tasks")),
    requesterId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    mode: v.string(),
    totalPhases: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("approvalRequests", {
      templateId: args.templateId,
      taskId: args.taskId,
      requesterId: args.requesterId,
      title: args.title,
      description: args.description,
      mode: args.mode as any,
      status: "pending",
      currentPhase: 0,
      totalPhases: args.totalPhases,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const approveRequest = mutation({
  args: {
    requestId: v.id("approvalRequests"),
    userId: v.id("users"),
    phaseIndex: v.number(),
    comment: v.optional(v.string()),
  },
  handler: withEventPipeline(
    {
      module: "workflow",
      entity: "approval",
      action: "approve",
      eventType: Events.WORKFLOW.APPROVAL_COMPLETED,
      title: "Approval completed",
      getEntityId: entityIdFromArg("requestId"),
      getUserId: userIdFromArg("userId"),
    },
    async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Approval request not found");

    const now = Date.now();

    // Add approver decision
    await ctx.db.insert("approvalRequestApprovers", {
      requestId: args.requestId,
      userId: args.userId,
      phaseIndex: args.phaseIndex,
      status: "approved",
      comment: args.comment,
      decidedAt: now,
      createdAt: now,
    });

    // Check if all required approvers for this phase have approved
    const phaseApprovers = await ctx.db.query("approvalRequestApprovers")
      .withIndex("requestId", (q) => q.eq("requestId", args.requestId))
      .collect();
    const currentPhaseApprovers = phaseApprovers.filter((a) => a.phaseIndex === args.phaseIndex && a.status === "approved");

    // For now, move to next phase or complete
    const nextPhase = args.phaseIndex + 1;
    if (nextPhase >= request.totalPhases) {
      await ctx.db.patch(args.requestId, {
        status: "approved",
        currentPhase: nextPhase,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(args.requestId, {
        currentPhase: nextPhase,
        updatedAt: now,
      });
    }

    // If linked to a task, update task approval status
    if (request.taskId) {
      await ctx.db.patch(request.taskId, {
        approvalStatus: nextPhase >= request.totalPhases ? "approved" : "pending",
        updatedAt: now,
      });
    }
    },
  ),
});

export const rejectRequest = mutation({
  args: {
    requestId: v.id("approvalRequests"),
    userId: v.id("users"),
    phaseIndex: v.number(),
    comment: v.optional(v.string()),
  },
  handler: withEventPipeline(
    {
      module: "workflow",
      entity: "approval",
      action: "reject",
      eventType: Events.WORKFLOW.APPROVAL_REJECTED,
      title: "Approval rejected",
      getEntityId: entityIdFromArg("requestId"),
      getUserId: userIdFromArg("userId"),
    },
    async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Approval request not found");

    const now = Date.now();

    await ctx.db.insert("approvalRequestApprovers", {
      requestId: args.requestId,
      userId: args.userId,
      phaseIndex: args.phaseIndex,
      status: "rejected",
      comment: args.comment,
      decidedAt: now,
      createdAt: now,
    });

    await ctx.db.patch(args.requestId, {
      status: "rejected",
      updatedAt: now,
    });

    if (request.taskId) {
      await ctx.db.patch(request.taskId, {
        approvalStatus: "rejected",
        updatedAt: now,
      });
    }
    },
  ),
});

export const getRequestApprovers = query({
  args: { requestId: v.id("approvalRequests") },
  handler: async (ctx, args) => {
    return await ctx.db.query("approvalRequestApprovers").withIndex("requestId", (q) => q.eq("requestId", args.requestId)).collect();
  },
});

// ============================
// GLOBAL APPROVAL COUNTER (for sidebar badge + topbar)
// ============================

export const getGlobalApprovalCounts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();

    // 1. Approval Requests — pending requests not made by current user
    const allRequests = await ctx.db.query("approvalRequests").collect();
    const pendingRequests = allRequests.filter((r) => r.status === "pending" && r.requesterId !== args.userId);
    const requestCount = pendingRequests.length;

    // 2. CRM Approvals — pending approvals assigned to current user
    const allCrmApprovals = await ctx.db.query("leadApprovals").collect();
    const myPendingCrm = allCrmApprovals.filter((a) => a.status === "pending" && a.approverIds.includes(args.userId));
    const crmCount = myPendingCrm.length;

    // 3. Verification — pending verifications assigned to current user
    const allVerifications = await ctx.db.query("verification_requests").collect();
    const myPendingVerifications = allVerifications.filter((v) => v.status === "pending" && v.assignedUserIds.includes(args.userId));
    const verificationCount = myPendingVerifications.length;

    const total = requestCount + crmCount + verificationCount;

    return {
      requests: requestCount,
      crm: crmCount,
      verification: verificationCount,
      total,
    };
  },
});
