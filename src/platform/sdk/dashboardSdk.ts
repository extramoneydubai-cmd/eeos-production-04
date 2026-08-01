/**
 * Dashboard SDK — Enterprise Dashboard Service
 *
 * Dashboard Studio consumes this SDK to render widgets.
 * No widget may directly query business tables.
 *
 * Usage:
 *   import { dashboardSdk } from "@/platform/sdk/dashboardSdk";
 *   const kpis = await dashboardSdk.getKPIs(ctx, { module: "crm", ... });
 */

import { v } from "convex/values";
import { mutation, query } from "../../convex/_generated/server";
import { Id } from "../../convex/_generated/dataModel";

// ─── SDK Methods ─────────────────────────────────────────────────────────

/**
 * Get KPI data for a module.
 * Each module registers its KPI providers via the Dashboard Provider architecture.
 */
export const getKPIs = query({
  args: {
    module: v.string(),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Module-specific KPI logic would be registered here
    // For now return a structured response that providers can fill
    return {
      module: args.module,
      filters: {
        companyId: args.companyId,
        branchId: args.branchId,
        departmentId: args.departmentId,
      },
      updatedAt: Date.now(),
    };
  },
});

/**
 * Get chart data for a module.
 */
export const getChartData = query({
  args: {
    module: v.string(),
    chartType: v.string(),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return {
      module: args.module,
      chartType: args.chartType,
      labels: [],
      datasets: [],
      updatedAt: Date.now(),
    };
  },
});

/**
 * Get recent activity for a module.
 */
export const getRecentActivity = query({
  args: {
    module: v.string(),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("timelineEvents")
      .withIndex("module", (q) => q.eq("module", args.module))
      .collect();

    let filtered = events;
    if (args.companyId) filtered = filtered.filter((e) => (e as { companyId?: string }).companyId === args.companyId);
    if (args.branchId) filtered = filtered.filter((e) => (e as { branchId?: string }).branchId === args.branchId);

    return filtered.sort((a, b) => b.createdAt - a.createdAt).slice(0, args.limit || 10);
  },
});

/**
 * Get task summary for a user's dashboard.
 */
export const getTaskSummary = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("assignedTo", (q) => q.eq("assignedTo", args.userId))
      .collect();

    return {
      total: tasks.length,
      open: tasks.filter((t) => t.status === "open" || t.status === "pending").length,
      inProgress: tasks.filter((t) => t.status === "in_progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      overdue: tasks.filter(
        (t) => t.dueDate && t.dueDate < Date.now() && t.status !== "completed"
      ).length,
    };
  },
});

/**
 * Get notification summary for a user's dashboard.
 */
export const getNotificationSummary = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("userId_isRead", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    return {
      unreadCount: unread.length,
      recent: unread.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5),
    };
  },
});

/**
 * Get quick stats for a CEO dashboard.
 * Aggregates across all modules.
 */
export const getCEOQuickStats = query({
  args: {
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const [allUsers, allLeads, allStudents, allTasks, allNotifications] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("leads").collect(),
      ctx.db.query("students").collect(),
      ctx.db.query("tasks").collect(),
      ctx.db.query("notifications").collect(),
    ]);

    const filterByScope = <T extends { companyId?: unknown; branchId?: unknown }>(items: T[]) => {
      let filtered = items;
      if (args.companyId) filtered = filtered.filter((i) => i.companyId === args.companyId);
      if (args.branchId) filtered = filtered.filter((i) => i.branchId === args.branchId);
      return filtered;
    };

    return {
      totalUsers: filterByScope(allUsers).length,
      activeUsers: filterByScope(allUsers).filter((u: any) => !u.isDisabled).length,
      totalLeads: filterByScope(allLeads).length,
      totalStudents: filterByScope(allStudents).length,
      pendingTasks: filterByScope(allTasks).filter((t: any) => t.status !== "completed").length,
      unreadNotifications: filterByScope(allNotifications).filter((n: any) => !n.isRead).length,
    };
  },
});

/**
 * Get quick actions available for a user based on their role.
 */
export const getQuickActions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return [];

    const actions: Array<{ label: string; href: string; icon: string }> = [];

    if (user.role === "super_admin" || user.role === "admin") {
      actions.push({ label: "Create User", href: "/users/new", icon: "UserPlus" });
      actions.push({ label: "Create Team", href: "/organization/teams/new", icon: "Users" });
      actions.push({ label: "New Broadcast", href: "/communication/broadcast", icon: "Megaphone" });
    }

    actions.push({ label: "Create Task", href: "/tasks/new", icon: "CheckSquare" });
    actions.push({ label: "New Lead", href: "/crm/leads/new", icon: "Target" });

    return actions;
  },
});
