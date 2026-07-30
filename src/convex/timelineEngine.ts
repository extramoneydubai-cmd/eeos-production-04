/**
 * Enterprise Timeline Queries (Phase 5)
 *
 * Dedicated timeline query endpoints per entity type.
 * The event pipeline creates timelineEvents automatically.
 * This module provides queries to retrieve them.
 *
 * Every timeline event recorded by withEventPipeline() is
 * queryable here.
 */

import { v } from "convex/values";
import { query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";

// ─── Timeline Queries ───────────────────────────────────────

/** Get timeline for a specific entity (student, lead, invoice, ticket, etc.) */
export const getEntityTimeline = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db.query("timelineEvents")
      .filter((q: any) => q.and(
        q.eq(q.field("entityType"), args.entityType),
        q.eq(q.field("entityId"), args.entityId),
      ))
      .order("desc")
      .collect();

    return events.slice(0, args.limit || 50);
  },
});

/** Get timeline for a specific user (all their associated entity events) */
export const getUserTimeline = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    module: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const allEvents = await ctx.db.query("timelineEvents")
      .filter((q: any) => q.eq(q.field("performedBy"), args.userId))
      .order("desc")
      .collect();

    let filtered = allEvents;
    if (args.module) {
      filtered = filtered.filter((e: any) => e.module === args.module);
    }

    return filtered.slice(0, args.limit || 50);
  },
});

/** Get timeline for a specific module */
export const getModuleTimeline = query({
  args: {
    module: v.string(),
    limit: v.optional(v.number()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    let events = await ctx.db.query("timelineEvents")
      .filter((q: any) => q.eq(q.field("module"), args.module))
      .order("desc")
      .collect();

    if (args.companyId) {
      events = events.filter((e: any) => e.companyId === args.companyId);
    }
    if (args.branchId) {
      events = events.filter((e: any) => e.branchId === args.branchId);
    }

    return events.slice(0, args.limit || 100);
  },
});

/** Get all recent timeline events (global view, for Operations Center) */
export const getRecentTimeline = query({
  args: {
    limit: v.optional(v.number()),
    modules: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("timelineEvents")
      .order("desc")
      .collect();

    let filtered = all;
    if (args.modules && args.modules.length > 0) {
      filtered = filtered.filter((e: any) => args.modules!.includes(e.module));
    }

    return filtered.slice(0, args.limit || 50);
  },
});

/** Get student timeline (convenience wrapper) */
export const getStudentTimeline = query({
  args: {
    studentId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return getEntityTimeline.handler(ctx, {
      entityType: "student",
      entityId: args.studentId,
      limit: args.limit,
    });
  },
});

/** Get employee timeline (convenience wrapper) */
export const getEmployeeTimeline = query({
  args: {
    employeeId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return getEntityTimeline.handler(ctx, {
      entityType: "employee",
      entityId: args.employeeId,
      limit: args.limit,
    });
  },
});

/** Get lead timeline (convenience wrapper) */
export const getLeadTimeline = query({
  args: {
    leadId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return getEntityTimeline.handler(ctx, {
      entityType: "lead",
      entityId: args.leadId,
      limit: args.limit,
    });
  },
});

/** Get invoice/transaction timeline (convenience wrapper) */
export const getTransactionTimeline = query({
  args: {
    transactionId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return getEntityTimeline.handler(ctx, {
      entityType: "invoice",
      entityId: args.transactionId,
      limit: args.limit,
    });
  },
});

/** Get ticket timeline (convenience wrapper) */
export const getTicketTimeline = query({
  args: {
    ticketId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return getEntityTimeline.handler(ctx, {
      entityType: "ticket",
      entityId: args.ticketId,
      limit: args.limit,
    });
  },
});

/** Timeline summary — counts per module for dashboard */
export const getTimelineSummary = query({
  args: {
    sinceTimestamp: v.optional(v.number()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const since = args.sinceTimestamp || (Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

    let events = await ctx.db.query("timelineEvents")
      .filter((q: any) => q.gte(q.field("createdAt"), since))
      .collect();

    if (args.companyId) {
      events = events.filter((e: any) => e.companyId === args.companyId);
    }
    if (args.branchId) {
      events = events.filter((e: any) => e.branchId === args.branchId);
    }

    // Count by module
    const byModule: Record<string, number> = {};
    for (const e of events) {
      const mod = (e as any).module || "unknown";
      byModule[mod] = (byModule[mod] || 0) + 1;
    }

    // Count by date
    const byDate: Record<string, number> = {};
    for (const e of events) {
      const date = new Date((e as any).createdAt).toISOString().substring(0, 10);
      byDate[date] = (byDate[date] || 0) + 1;
    }

    return {
      totalEvents: events.length,
      byModule: Object.entries(byModule).map(([module, count]) => ({ module, count })),
      byDate: Object.entries(byDate).map(([date, count]) => ({ date, count })),
      since,
    };
  },
});
