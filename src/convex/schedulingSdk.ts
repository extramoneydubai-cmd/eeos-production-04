/**
 * Scheduling SDK — schedules, resources & bookings.
 *
 * Resolves the phantom `api.schedulingSdk.*` references used across the
 * scheduling components/pages. Backed by the existing `schedules`,
 * `schedulingResources` and `schedulingBookings` tables (schema/scheduling.ts).
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";
import { Events } from "./eventRegistry";

// ─── Enterprise Pipeline Config ─────────────────────────────────
// Every scheduling mutation routes through withScopeAndEvents() so
// schedule changes emit audit, timeline, event-bus, notification-matrix,
// workflow, automation, search-index and dashboard-refresh signals.
//
// getUserId returns undefined intentionally: scheduling mutations are
// called by the scheduling SDK and portals that pass performer/createdBy
// strings rather than a reliable Convex user id, so scope enforcement
// stays a no-op here while the event pipeline is fully wired. Where the
// args carry company/branch/department scope it is still recorded on
// audit, timeline and event rows.
const schedulePipeline = {
  module: "scheduling",
  getUserId: () => undefined,
  getEntityCompanyId: (args: { companyId?: any }) => args.companyId,
  getEntityBranchId: (args: { branchId?: any }) => args.branchId,
  getEntityDepartmentId: (args: { departmentId?: any }) => args.departmentId,
  triggerWorkflow: true,
  triggerAutomation: true,
  registerSearch: true,
  signalDashboard: true,
} as const;

const DAY_MS = 86_400_000;

const scoped = (s: any[], companyId?: string, branchId?: string) =>
  s.filter(
    (x: any) =>
      (!companyId || x.companyId === companyId) &&
      (!branchId || x.branchId === branchId),
  );

/** Schedules whose start falls on today. */
export const getToday = query({
  args: {
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + DAY_MS;
    const all = await ctx.db.query("schedules").collect();
    return scoped(all, args.companyId as any, args.branchId as any)
      .filter((s: any) => s.start >= startOfDay && s.start < endOfDay)
      .sort((a: any, b: any) => a.start - b.start);
  },
});

/** Schedules starting within the next N days. */
export const getUpcoming = query({
  args: {
    days: v.optional(v.number()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const horizon = now + (args.days ?? 7) * DAY_MS;
    const all = await ctx.db.query("schedules").collect();
    return scoped(all, args.companyId as any, args.branchId as any)
      .filter((s: any) => s.start >= now && s.start <= horizon && s.status !== "cancelled")
      .sort((a: any, b: any) => a.start - b.start);
  },
});

/** Schedules within a time range, optionally scoped to an entity. */
export const getByDateRange = query({
  args: {
    start: v.number(),
    end: v.number(),
    limit: v.optional(v.number()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("schedules").collect();
    return scoped(all, args.companyId as any, args.branchId as any)
      .filter(
        (s: any) =>
          s.start >= args.start &&
          s.start <= args.end &&
          s.status !== "cancelled" &&
          (!args.entityType || s.entityType === args.entityType) &&
          (!args.entityId || s.entityId === args.entityId),
      )
      .sort((a: any, b: any) => a.start - b.start)
      .slice(0, args.limit ?? 500);
  },
});

/** Schedule counts by status for dashboards. */
export const getCounts = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("schedules").collect();
    const by = (st: string) => all.filter((s: any) => s.status === st).length;
    return {
      total: all.length,
      scheduled: by("scheduled"),
      confirmed: by("confirmed"),
      pendingApproval: by("pending_approval"),
      pending: by("pending_approval"),
      completed: by("completed"),
      cancelled: by("cancelled"),
    };
  },
});

/** All scheduling resources. */
export const listResources = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("schedulingResources").collect();
    return all.sort((a: any, b: any) => a.name.localeCompare(b.name));
  },
});

/** A single scheduling resource. */
export const getResource = query({
  args: { resourceId: v.id("schedulingResources") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.resourceId);
  },
});

/** Schedules filtered by status/scope. Returns { items, total } for approval center. */
export const list = query({
  args: {
    status: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("schedules").collect();
    const items = scoped(all, args.companyId as any, args.branchId as any)
      .filter((s: any) => !args.status || s.status === args.status)
      .sort((a: any, b: any) => a.start - b.start);
    return { items, total: items.length };
  },
});

/** All schedules (calendar/reports views). */
export const listSchedules = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("schedules").collect();
    return all
      .filter((s: any) => s.status !== "cancelled")
      .sort((a: any, b: any) => a.start - b.start)
      .slice(0, args.limit ?? 500);
  },
});

/** Bookings for a schedule. */
export const getBookings = query({
  args: { scheduleId: v.id("schedules") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("schedulingBookings")
      .withIndex("scheduleId", (q) => q.eq("scheduleId", args.scheduleId))
      .collect();
  },
});

/** A single schedule. */
export const get = query({
  args: { scheduleId: v.id("schedules") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.scheduleId);
  },
});

/** Create a schedule. Returns the new schedule id. */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    scheduleType: v.string(),
    start: v.number(),
    end: v.number(),
    priority: v.optional(v.string()),
    status: v.optional(v.string()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    createdBy: v.optional(v.id("users")),
    owner: v.optional(v.id("users")),
  },
  handler: withScopeAndEvents(
    {
      ...schedulePipeline,
      operation: "create",
      entity: "schedule",
      eventType: Events.SCHEDULING.CREATED,
      title: "Schedule Created",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("schedules", {
      title: args.title,
      description: args.description,
      scheduleType: args.scheduleType,
      start: args.start,
      end: args.end,
      priority: args.priority ?? "medium",
      status: args.status ?? "scheduled",
      entityType: args.entityType,
      entityId: args.entityId,
      companyId: args.companyId,
      branchId: args.branchId,
      departmentId: args.departmentId,
      createdBy: args.createdBy,
      owner: args.owner,
      createdAt: now,
      updatedAt: now,
    });
    }
  ),
});

/** Confirm a pending schedule. */
export const confirm = mutation({
  args: {
    scheduleId: v.id("schedules"),
    approvedBy: v.optional(v.id("users")),
  },
  handler: withScopeAndEvents(
    {
      ...schedulePipeline,
      operation: "update",
      entity: "schedule",
      eventType: Events.SCHEDULING.CONFIRMED,
      title: "Schedule Confirmed",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule) throw new Error("Schedule not found");
    await ctx.db.patch(args.scheduleId, {
      status: "confirmed",
      approvedBy: args.approvedBy,
      approvedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return args.scheduleId;
    }
  ),
});

/** Cancel a schedule. */
export const cancel = mutation({
  args: {
    scheduleId: v.id("schedules"),
    reason: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      ...schedulePipeline,
      operation: "update",
      entity: "schedule",
      eventType: Events.SCHEDULING.CANCELLED,
      title: "Schedule Cancelled",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule) throw new Error("Schedule not found");
    await ctx.db.patch(args.scheduleId, {
      status: "cancelled",
      cancelReason: args.reason,
      cancelledAt: Date.now(),
      updatedAt: Date.now(),
    });
    return args.scheduleId;
    }
  ),
});

/** Complete a schedule. */
export const complete = mutation({
  args: { scheduleId: v.id("schedules") },
  handler: withScopeAndEvents(
    {
      ...schedulePipeline,
      operation: "update",
      entity: "schedule",
      eventType: Events.SCHEDULING.COMPLETED,
      title: "Schedule Completed",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule) throw new Error("Schedule not found");
    await ctx.db.patch(args.scheduleId, {
      status: "completed",
      completedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return args.scheduleId;
    }
  ),
});

/** Hard-delete a schedule. */
export const remove = mutation({
  args: { scheduleId: v.id("schedules") },
  handler: withScopeAndEvents(
    {
      ...schedulePipeline,
      operation: "delete",
      entity: "schedule",
      eventType: "scheduling.removed",
      title: "Schedule Removed",
      notifyViaMatrix: false,
    },
    async (ctx, args) => {
    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule) throw new Error("Schedule not found");
    await ctx.db.delete(args.scheduleId);
    return args.scheduleId;
    }
  ),
});
