/**
 * Dashboard Live Refresh Engine
 *
 * Provides event-driven dashboard data refreshing.
 * Instead of polling, dashboards subscribe to a 'dashboards' table
 * where mutations publish their update signals.
 *
 * Every mutation that affects dashboard data calls:
 *   await signalDashboardRefresh(ctx, { module: "finance", companyId, branchId });
 *
 * Every dashboard component uses:
 *   const lastUpdate = useQuery(api.dashboardLiveRefresh.getLastRefresh, {
 *     module: "finance", companyId, branchId
 *   });
 *
 * When lastUpdate changes, the dashboard refetches its live data.
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ─── Signal a Dashboard Refresh ─────────────────────────────

/** Signal that a module's dashboard data has changed. Dashboards subscribe to this. */
export const signalDashboardRefresh = mutation({
  args: {
    module: v.string(),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    metric: v.optional(v.string()),  // Which specific metric changed
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    // Create a unique key per module + scope
    const scopeKey = [
      args.module,
      args.companyId || "global",
      args.branchId || "all",
      args.metric || "all",
    ].join(":");

    const existing = await ctx.db.query("dashboardRefreshSignals")
      .filter((q: any) => q.eq(q.field("scopeKey"), scopeKey))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastRefreshedAt: now,
        refreshCount: ((existing as any).refreshCount || 0) + 1,
        entityType: args.entityType || (existing as any).entityType,
        entityId: args.entityId || (existing as any).entityId,
        metric: args.metric || (existing as any).metric,
      });
    } else {
      await ctx.db.insert("dashboardRefreshSignals", {
        module: args.module,
        scopeKey,
        companyId: args.companyId,
        branchId: args.branchId,
        entityType: args.entityType,
        entityId: args.entityId,
        metric: args.metric,
        lastRefreshedAt: now,
        refreshCount: 1,
      });
    }
  },
});

// ─── Query: Get Last Refresh Timestamp ──────────────────────

/** Get the last refresh timestamp for a dashboard module + scope. Dashboards use this as a reactive dependency. */
export const getLastRefresh = query({
  args: {
    module: v.string(),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    metric: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const scopeKey = [
      args.module,
      args.companyId || "global",
      args.branchId || "all",
      args.metric || "all",
    ].join(":");

    const signal = await ctx.db.query("dashboardRefreshSignals")
      .filter((q: any) => q.eq(q.field("scopeKey"), scopeKey))
      .first();

    return signal ? (signal as any).lastRefreshedAt : 0;
  },
});

// ─── Query: Get All Active Dashboard Signals ────────────────

export const getAllRefreshSignals = query({
  args: {
    module: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    let signals = await ctx.db.query("dashboardRefreshSignals").collect();

    if (args.module) signals = signals.filter((s: any) => s.module === args.module);
    if (args.companyId) signals = signals.filter((s: any) => !s.companyId || (s as any).companyId === args.companyId);
    if (args.branchId) signals = signals.filter((s: any) => !s.branchId || (s as any).branchId === args.branchId);

    return signals.sort((a: any, b: any) => b.lastRefreshedAt - a.lastRefreshedAt);
  },
});

// ─── Cleanup Old Signals ────────────────────────────────────

export const cleanupOldSignals = internalMutation({
  handler: async (ctx) => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const old = await ctx.db.query("dashboardRefreshSignals")
      .filter((q: any) => q.lt(q.field("lastRefreshedAt"), weekAgo))
      .collect();

    for (const item of old) {
      await ctx.db.delete(item._id);
    }

    return { cleaned: old.length };
  },
});

// ─── Dashboard Module Registry ──────────────────────────────

export const DASHBOARD_MODULES = [
  { module: "crm",       label: "CRM",           route: "/crm-dashboard" },
  { module: "finance",   label: "Finance",       route: "/finance" },
  { module: "student",   label: "Student",       route: "/students" },
  { module: "hr",        label: "HR",            route: "/hr" },
  { module: "academic",  label: "Academic",      route: "/academic" },
  { module: "marketing", label: "Marketing",     route: "/marketing" },
  { module: "production",label: "Production",    route: "/production" },
  { module: "support",   label: "Support",       route: "/support" },
  { module: "scheduling",label: "Scheduling",    route: "/scheduler" },
  { module: "procurement",label: "Procurement",  route: "/procurement" },
  { module: "inventory", label: "Inventory",     route: "/inventory" },
  { module: "collections",label: "Collections",  route: "/collections" },
  { module: "admissions",label: "Admissions",    route: "/admissions" },
  { module: "operations",label: "Operations",    route: "/operations" },
  { module: "ceo",       label: "CEO",           route: "/ceo-dashboard" },
  { module: "coo",       label: "COO",           route: "/coo-dashboard" },
] as const;

/** Get all registered dashboard modules */
export const getDashboardModules = query({
  args: {},
  handler: async () => {
    return DASHBOARD_MODULES;
  },
});
