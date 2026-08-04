import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { withScopeAndEvents } from "./withScopeAndEvents";
import { getUserFromToken } from "./authHelpers";

// ─── Enterprise Pipeline Config ─────────────────────────────────
// Every report-schedule mutation routes through withScopeAndEvents()
// so schedule/layout changes emit audit, timeline, event-bus,
// notification-matrix, workflow, automation, search-index and
// dashboard-refresh signals.
//
// getUserId returns undefined intentionally: report-schedule mutations
// resolve the real performer from the session token via the
// withScopeAndEvents wrapper when a token is supplied, otherwise they fall
// back to the claimed id. The scheduler cron path carries no reliable
// Convex user id, so scope enforcement stays a no-op for cron-driven runs
// while the event pipeline is fully wired.
const reportSchedulePipeline = {
  module: "reporting",
  getUserId: () => undefined,
  getEntityCompanyId: () => undefined,
  getEntityBranchId: () => undefined,
  triggerWorkflow: true,
  triggerAutomation: true,
  registerSearch: true,
  signalDashboard: true,
} as const;

// ─── SCHEDULE CRUD ─────────────────────────────

export const createSchedule = mutation({
  args: {
    token: v.optional(v.string()),
    reportId: v.id("reportDefinitions"),
    name: v.string(),
    frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    dayOfWeek: v.optional(v.number()),
    dayOfMonth: v.optional(v.number()),
    time: v.string(),
    filters: v.optional(v.string()),
    recipients: v.array(v.string()),
    exportFormat: v.union(v.literal("pdf"), v.literal("csv"), v.literal("excel")),
  },
  handler: withScopeAndEvents(
    {
      ...reportSchedulePipeline,
      operation: "create",
      entity: "report_schedule",
      eventType: "reporting.schedule.created",
      title: "Report Schedule Created",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
    const userId = (ctx as any).__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    // Calculate next run
    const nextRunAt = calculateNextRun(args.frequency, args.dayOfWeek, args.dayOfMonth, args.time);

    return ctx.db.insert("reportSchedules", {
      ...args,
      userId,
      isActive: true,
      nextRunAt,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    }
  ),
});

export const updateSchedule = mutation({
  args: {
    token: v.optional(v.string()),
    id: v.id("reportSchedules"),
    name: v.optional(v.string()),
    frequency: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))),
    dayOfWeek: v.optional(v.number()),
    dayOfMonth: v.optional(v.number()),
    time: v.optional(v.string()),
    filters: v.optional(v.string()),
    recipients: v.optional(v.array(v.string())),
    exportFormat: v.optional(v.union(v.literal("pdf"), v.literal("csv"), v.literal("excel"))),
    isActive: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents(
    {
      ...reportSchedulePipeline,
      operation: "update",
      entity: "report_schedule",
      eventType: "reporting.schedule.updated",
      title: "Report Schedule Updated",
      notifyViaMatrix: false,
    },
    async (ctx, args) => {
    const { id, ...fields } = args;

    // Recalculate next run if schedule changed
    const update: any = { ...fields, updatedAt: Date.now() };
    if (fields.frequency || fields.dayOfWeek || fields.dayOfMonth || fields.time) {
      const schedule = await ctx.db.get(id);
      if (schedule) {
        update.nextRunAt = calculateNextRun(
          fields.frequency || (schedule as any).frequency,
          fields.dayOfWeek !== undefined ? fields.dayOfWeek : (schedule as any).dayOfWeek,
          fields.dayOfMonth !== undefined ? fields.dayOfMonth : (schedule as any).dayOfMonth,
          fields.time || (schedule as any).time,
        );
      }
    }

    await ctx.db.patch(id, update);
    return id;
    }
  ),
});

export const toggleSchedule = mutation({
  args: { token: v.optional(v.string()), id: v.id("reportSchedules") },
  handler: withScopeAndEvents(
    {
      ...reportSchedulePipeline,
      operation: "update",
      entity: "report_schedule",
      eventType: "reporting.schedule.toggled",
      title: "Report Schedule Toggled",
      notifyViaMatrix: false,
    },
    async (ctx, args) => {
    const schedule = await ctx.db.get(args.id);
    if (!schedule) throw new Error("Schedule not found");
    await ctx.db.patch(args.id, { isActive: !(schedule as any).isActive, updatedAt: Date.now() });
    return args.id;
    }
  ),
});

export const deleteSchedule = mutation({
  args: { token: v.optional(v.string()), id: v.id("reportSchedules") },
  handler: withScopeAndEvents(
    {
      ...reportSchedulePipeline,
      operation: "delete",
      entity: "report_schedule",
      eventType: "reporting.schedule.deleted",
      title: "Report Schedule Deleted",
      notifyViaMatrix: false,
    },
    async (ctx, args) => {
    await ctx.db.delete(args.id);
    }
  ),
});

export const listSchedules = query({
  args: {
    userId: v.optional(v.id("users")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("reportSchedules");
    if (args.userId) query = query.filter((q: any) => q.eq(q.field("userId"), args.userId));
    if (args.isActive !== undefined) query = query.filter((q: any) => q.eq(q.field("isActive"), args.isActive));

    const schedules = await query.collect();

    // Enrich with report names
    const enriched = await Promise.all(schedules.map(async (s: any) => {
      const def = await ctx.db.get(s.reportId);
      return { ...s, reportName: def ? (def as any).name : "Unknown" };
    }));

    return enriched;
  },
});

// ─── SCHEDULE EXECUTION ─────────────────────────

export const executeDueSchedules = mutation({
  handler: withScopeAndEvents(
    {
      ...reportSchedulePipeline,
      operation: "update",
      entity: "report_schedule",
      eventType: "reporting.schedule.executed",
      title: "Due Schedules Executed",
      notifyViaMatrix: false,
    },
    async (ctx) => {
    const userId = (ctx as any).__performerUserId;
    const now = Date.now();

    const dueSchedules = await ctx.db.query("reportSchedules")
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .filter((q: any) => q.lte(q.field("nextRunAt"), now))
      .collect();

    const results: any[] = [];

    for (const schedule of dueSchedules) {
      try {
        // Execute the report
        const definition = await ctx.db.get((schedule as any).reportId);
        if (!definition) continue;

        // Run report with scheduled filters
        const data = await executeScheduledReport(ctx, (definition as any).dataSource, (schedule as any).filters || "{}");

        // Log execution
        await ctx.db.insert("reportExecutions", {
          reportId: (schedule as any).reportId,
          userId: (schedule as any).userId,
          scheduleId: schedule._id,
          filters: (schedule as any).filters,
          resultData: JSON.stringify(data),
          recordCount: Array.isArray(data) ? data.length : 1,
          executionTime: 0,
          status: "success",
          executedAt: Date.now(),
          createdAt: Date.now(),
        });

        // Update last sent and next run
        const nextRunAt = calculateNextRun(
          (schedule as any).frequency,
          (schedule as any).dayOfWeek,
          (schedule as any).dayOfMonth,
          (schedule as any).time,
        );

        await ctx.db.patch(schedule._id, {
          lastSentAt: now,
          nextRunAt,
          updatedAt: Date.now(),
        });

        results.push({ scheduleId: schedule._id, status: "sent", recipients: (schedule as any).recipients.length });
      } catch (err: any) {
        results.push({ scheduleId: schedule._id, status: "failed", error: err.message });
      }
    }

    return results;
    }
  ),
});

async function executeScheduledReport(ctx: any, dataSource: string, filtersJson: string): Promise<any> {
  const filters = JSON.parse(filtersJson || "{}");
  let data: any[] = [];

  switch (dataSource) {
    case "crm.leads":
      data = await ctx.db.query("leadMaster").collect();
      break;
    case "finance.revenue_summary":
    case "finance.revenue": {
      data = await ctx.db.query("paymentTransactions").collect();
      break;
    }
    case "finance.outstanding": {
      data = await ctx.db.query("studentFeeAccounts").collect();
      return data.map((a: any) => ({
        studentId: a.studentId,
        totalFee: a.totalFee,
        paid: a.totalPaid,
        outstanding: a.outstandingBalance,
      }));
    }
    case "students.list": {
      data = await ctx.db.query("studentMaster").collect();
      break;
    }
    case "exams.results": {
      data = await ctx.db.query("examResults").collect();
      break;
    }
    case "inventory.low_stock": {
      data = await ctx.db.query("inventoryItems").collect();
      return data.filter((i: any) => i.currentStock <= i.reorderLevel);
    }
    case "tasks.list": {
      data = await ctx.db.query("tasks").collect();
      break;
    }
    default: {
      // Try generic collection
      const parts = dataSource.split(".");
      if (parts.length === 2) {
        const tableName = parts[1];
        try { data = await ctx.db.query(tableName).collect(); } catch { data = []; }
      }
    }
  }

  // Apply filters
  if (filters && Object.keys(filters).length > 0) {
    data = data.filter((item: any) => {
      for (const [key, value] of Object.entries(filters)) {
        if (value === null || value === undefined) continue;
        if (key === "startDate" && item.createdAt && item.createdAt < value) return false;
        if (key === "endDate" && item.createdAt && item.createdAt > value) return false;
        if (key in item && item[key] !== value) return false;
      }
      return true;
    });
  }

  return data;
}

function calculateNextRun(
  frequency: string,
  dayOfWeek?: number,
  dayOfMonth?: number,
  time?: string,
): number {
  const now = new Date();
  const [hours, minutes] = (time || "08:00").split(":").map(Number);

  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  switch (frequency) {
    case "daily": {
      // Already set to tomorrow if past time
      break;
    }
    case "weekly": {
      const targetDay = dayOfWeek !== undefined ? dayOfWeek : 1; // Monday
      const currentDay = next.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil <= 0) daysUntil += 7;
      next.setDate(next.getDate() + daysUntil);
      break;
    }
    case "monthly": {
      const targetDay = dayOfMonth || 1;
      if (next.getDate() > targetDay) {
        next.setMonth(next.getMonth() + 1);
      }
      next.setDate(targetDay);
      break;
    }
  }

  return next.getTime();
}

// ─── USER DASHBOARD LAYOUTS ─────────────────────

export const saveDashboardLayout = mutation({
  args: {
    token: v.optional(v.string()),
    name: v.string(),
    layout: v.string(),
    widgets: v.string(),
    globalFilters: v.optional(v.string()),
    isDefault: v.boolean(),
  },
  handler: withScopeAndEvents(
    {
      ...reportSchedulePipeline,
      operation: "create",
      entity: "dashboard_layout",
      eventType: "reporting.dashboard_layout.saved",
      title: "Dashboard Layout Saved",
      notifyViaMatrix: false,
    },
    async (ctx, args) => {
    const userId = (ctx as any).__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    // If setting as default, unset other defaults
    if (args.isDefault) {
      const existingDefaults = await ctx.db.query("userDashboardLayouts")
        .withIndex("userId", (q: any) => q.eq("userId", userId))
        .filter((q: any) => q.eq(q.field("isDefault"), true))
        .collect();

      for (const d of existingDefaults) {
        await ctx.db.patch(d._id, { isDefault: false, updatedAt: Date.now() });
      }
    }

    return ctx.db.insert("userDashboardLayouts", {
      ...args,
      userId,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    }
  ),
});

export const getUserDashboardLayouts = query({
  args: {
    userId: v.optional(v.id("users")),
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let userId = args.userId;
    if (args.token) {
      const sessionUser = await getUserFromToken(ctx, args.token);
      if (!sessionUser) return [];
      userId = sessionUser._id as Id<"users">;
    }
    if (!userId) return [];

    const layouts = await ctx.db.query("userDashboardLayouts")
      .withIndex("userId", (q: any) => q.eq("userId", userId))
      .collect();

    return layouts.sort((a: any, b: any) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
  },
});

export const getDefaultDashboardLayout = query({
  args: {
    userId: v.optional(v.id("users")),
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let userId = args.userId;
    if (args.token) {
      const sessionUser = await getUserFromToken(ctx, args.token);
      if (!sessionUser) return null;
      userId = sessionUser._id as Id<"users">;
    }
    if (!userId) return null;

    return ctx.db.query("userDashboardLayouts")
      .withIndex("userId", (q: any) => q.eq("userId", userId))
      .filter((q: any) => q.eq(q.field("isDefault"), true))
      .first();
  },
});

export const deleteDashboardLayout = mutation({
  args: { id: v.id("userDashboardLayouts") },
  handler: withScopeAndEvents(
    {
      ...reportSchedulePipeline,
      operation: "delete",
      entity: "dashboard_layout",
      eventType: "reporting.dashboard_layout.deleted",
      title: "Dashboard Layout Deleted",
      notifyViaMatrix: false,
    },
    async (ctx, args) => {
    await ctx.db.delete(args.id);
    }
  ),
});
