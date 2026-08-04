/**
 * Production SDK — content production pipeline.
 *
 * Resolves the phantom `api.productionSdk.getProductionDashboard` reference
 * used by ProductionDashboard. Backed by the existing `productionTasks`
 * table (schema/metadata.ts). Task statuses (assigned/in_progress/review/
 * approved/published/rejected) map onto the dashboard's pipeline stages.
 *
 * PATCH-ERP-001 (Phase 9): added listProductionTasks / createProductionTask /
 * updateProductionTaskStatus so the Production module can be operated end to
 * end from the UI. No new schema — reuses the existing `productionTasks`
 * table and its indexes (by_status, by_task_type, by_assigned, by_created).
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents } from "./withScopeAndEvents";
import { Events } from "./eventRegistry";

// ─── Enterprise Pipeline Config ─────────────────────────────────
// Every production mutation routes through withScopeAndEvents() so
// production changes emit audit, timeline, event-bus, notification-matrix,
// workflow, automation, search-index and dashboard-refresh signals.
//
// getUserId returns undefined intentionally: production mutations are called
// by the production SDK and portals that pass performer strings rather than
// a reliable Convex user id, so scope enforcement stays a no-op here while
// the event pipeline is fully wired.
const productionPipeline = {
  module: "production",
  getUserId: () => undefined,
  getEntityCompanyId: () => undefined,
  getEntityBranchId: () => undefined,
  triggerWorkflow: true,
  triggerAutomation: true,
  registerSearch: true,
  signalDashboard: true,
} as const;

/** Production pipeline KPIs for the dashboard. */
export const getProductionDashboard = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("productionTasks").collect();
    const by = (st: string) => tasks.filter((t: any) => t.status === st).length;
    return {
      total: tasks.length,
      draft: by("assigned"),
      inProgress: by("in_progress"),
      review: by("review"),
      approved: by("approved"),
      published: by("published"),
      rejected: by("rejected"),
    };
  },
});

/** List production tasks with optional status / type / assignee filters. */
export const listProductionTasks = query({
  args: {
    status: v.optional(v.string()),
    taskType: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("productionTasks") as any;
    if (args.status) q = q.filter((f: any) => f.eq(f.field("status"), args.status));
    if (args.taskType) q = q.filter((f: any) => f.eq(f.field("taskType"), args.taskType));
    if (args.assignedTo) q = q.filter((f: any) => f.eq(f.field("assignedTo"), args.assignedTo));
    return q.order("desc").collect();
  },
});

/** Create a production task in the existing productionTasks table. */
export const createProductionTask = mutation({
  args: {
    title: v.string(),
    taskType: v.union(
      v.literal("content_writing"), v.literal("video_production"),
      v.literal("graphic_design"), v.literal("question_bank"),
      v.literal("review"), v.literal("publishing"),
      v.literal("recording"), v.literal("editing"),
    ),
    status: v.optional(v.union(
      v.literal("assigned"), v.literal("in_progress"),
      v.literal("review"), v.literal("approved"),
      v.literal("published"), v.literal("rejected"),
    )),
    assignedTo: v.optional(v.string()),
    courseId: v.optional(v.id("courses")),
    dueDate: v.optional(v.number()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    description: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      ...productionPipeline,
      operation: "create",
      entity: "production_task",
      eventType: Events.PRODUCTION.TASK_CREATED,
      title: "Production Task Created",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const now = Date.now();
    return await ctx.db.insert("productionTasks", {
      title: args.title,
      taskType: args.taskType,
      status: args.status || "assigned",
      assignedTo: args.assignedTo,
      courseId: args.courseId,
      dueDate: args.dueDate,
      priority: args.priority,
      description: args.description,
      createdAt: now,
      updatedAt: now,
    });
    }
  ),
});

/** Advance (or move) a production task to another pipeline stage. */
export const updateProductionTaskStatus = mutation({
  args: {
    taskId: v.id("productionTasks"),
    status: v.union(
      v.literal("assigned"), v.literal("in_progress"),
      v.literal("review"), v.literal("approved"),
      v.literal("published"), v.literal("rejected"),
    ),
  },
  handler: withScopeAndEvents(
    {
      ...productionPipeline,
      operation: "update",
      entity: "production_task",
      eventType: "production.task.status.updated",
      title: "Production Task Status Updated",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Production task not found");
    await ctx.db.patch(args.taskId, { status: args.status, updatedAt: Date.now() });
    return args.taskId;
    }
  ),
});
