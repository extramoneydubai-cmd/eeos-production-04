// @ts-nocheck — This file is type-checked by `npx convex dev`, not by the frontend `tsc`.

/**
 * EEOS Activity Engine (P0)
 *
 * Universal activity timeline for every module in the platform.
 * No module should maintain its own activity log — they all consume this engine.
 *
 * DOC-22 reference: Activity Engine
 * DOC-23 reference: Engine Standards, Naming Standards
 *
 * Features:
 * - Action types: 24 standard actions + custom
 * - Entity-scoped timelines (entityType + entityId)
 * - User-scoped timelines
 * - Organization-scoped timelines
 * - Module-scoped timelines
 * - Severity levels (info, warning, error)
 * - Visibility scopes (public, internal, private)
 * - Before/after snapshots for audit
 * - Search and filter support
 */

import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

const ACTIVITY_ACTIONS = [
  "created", "updated", "deleted", "assigned", "approved", "rejected",
  "converted", "uploaded", "downloaded", "commented", "mentioned",
  "completed", "cancelled", "paid", "refunded", "promoted", "transferred",
  "archived", "restored", "login", "logout", "password_changed",
  "permission_changed", "custom",
] as const;

const SEVERITIES = ["info", "warning", "error"] as const;
const VISIBILITIES = ["public", "internal", "private"] as const;

// ─── Mutations ─────────────────────────────────────────────────

/** Log a new activity entry. This is the core API every module uses. */
export const log = mutation({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    module: v.string(),
    action: v.union(...ACTIVITY_ACTIONS.map((a) => v.literal(a))),
    title: v.string(),
    description: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    teamId: v.optional(v.id("teams")),
    metadata: v.optional(v.any()),
    beforeSnapshot: v.optional(v.any()),
    afterSnapshot: v.optional(v.any()),
    severity: v.optional(v.union(v.literal("info"), v.literal("warning"), v.literal("error"))),
    visibility: v.optional(v.union(v.literal("public"), v.literal("internal"), v.literal("private"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("activity_logs", {
      entityType: args.entityType,
      entityId: args.entityId,
      module: args.module,
      action: args.action,
      title: args.title,
      description: args.description,
      userId,
      organizationId: args.organizationId,
      branchId: args.branchId,
      departmentId: args.departmentId,
      teamId: args.teamId,
      metadata: args.metadata,
      beforeSnapshot: args.beforeSnapshot,
      afterSnapshot: args.afterSnapshot,
      severity: args.severity || "info",
      visibility: args.visibility || "public",
      createdAt: Date.now(),
    });
  },
});

/** Log an activity with system context (used for automated/system actions). */
export const logSystem = mutation({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    module: v.string(),
    action: v.union(...ACTIVITY_ACTIONS.map((a) => v.literal(a))),
    title: v.string(),
    description: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
    metadata: v.optional(v.any()),
    beforeSnapshot: v.optional(v.any()),
    afterSnapshot: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const systemUserIds = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", "system@eeos.internal")).first();
    return await ctx.db.insert("activity_logs", {
      entityType: args.entityType,
      entityId: args.entityId,
      module: args.module,
      action: args.action,
      title: args.title,
      description: args.description,
      userId: systemUserIds?._id || (await ctx.db.query("users").first())?._id || "unknown",
      organizationId: args.organizationId,
      severity: "info",
      visibility: "internal",
      metadata: args.metadata,
      beforeSnapshot: args.beforeSnapshot,
      afterSnapshot: args.afterSnapshot,
      createdAt: Date.now(),
    });
  },
});

// ─── Queries ───────────────────────────────────────────────────

/** Get the global activity feed (latest across all modules). */
export const getGlobalFeed = query({
  args: {
    limit: v.optional(v.number()),
    severity: v.optional(v.union(v.literal("info"), v.literal("warning"), v.literal("error"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 20;

    if (args.severity) {
      return await ctx.db
        .query("activity_logs")
        .withIndex("by_severity", (q) => q.eq("severity", args.severity))
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("activity_logs")
      .withIndex("by_global_date")
      .order("desc")
      .take(limit);
  },
});

/** Get the activity timeline for a specific entity. */
export const getEntityTimeline = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 50;

    return await ctx.db
      .query("activity_logs")
      .withIndex("by_entity_date", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId),
      )
      .order("desc")
      .take(limit);
  },
});

/** Get the activity timeline for a specific user. */
export const getUserTimeline = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    const limit = args.limit || 50;

    return await ctx.db
      .query("activity_logs")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

/** Get the activity timeline for an organization. */
export const getOrganizationTimeline = query({
  args: {
    organizationId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 50;

    return await ctx.db
      .query("activity_logs")
      .withIndex("by_organization_date", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .take(limit);
  },
});

/** Get activities filtered by module. */
export const getByModule = query({
  args: {
    module: v.string(),
    limit: v.optional(v.number()),
    action: v.optional(v.union(...ACTIVITY_ACTIONS.map((a) => v.literal(a)))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 50;

    let activities;
    if (args.action) {
      activities = await ctx.db
        .query("activity_logs")
        .withIndex("by_module", (q) => q.eq("module", args.module))
        .filter((q) => q.eq(q.field("action"), args.action))
        .order("desc")
        .take(limit);
    } else {
      activities = await ctx.db
        .query("activity_logs")
        .withIndex("by_module", (q) => q.eq("module", args.module))
        .order("desc")
        .take(limit);
    }

    return activities;
  },
});

/** Search activities by title/description text. */
export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 50;
    const q = args.query.toLowerCase();

    const results = await ctx.db
      .query("activity_logs")
      .withIndex("by_global_date")
      .order("desc")
      .take(200);

    return results.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.description || "").toLowerCase().includes(q) ||
        a.entityType.toLowerCase().includes(q) ||
        a.module.toLowerCase().includes(q),
    ).slice(0, limit);
  },
});

/** Get aggregate activity stats. */
export const getStats = query({
  args: {
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let activities;
    if (args.organizationId) {
      activities = await ctx.db
        .query("activity_logs")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
        .collect();
    } else {
      activities = await ctx.db
        .query("activity_logs")
        .withIndex("by_global_date")
        .order("desc")
        .take(1000);
    }

    const now = Date.now();
    const today = activities.filter((a) => a.createdAt > now - 86400000).length;
    const thisWeek = activities.filter((a) => a.createdAt > now - 604800000).length;
    const errors = activities.filter((a) => a.severity === "error").length;
    const warnings = activities.filter((a) => a.severity === "warning").length;

    // Top modules by activity count
    const moduleCounts: Record<string, number> = {};
    for (const a of activities) {
      moduleCounts[a.module] = (moduleCounts[a.module] || 0) + 1;
    }
    const topModules = Object.entries(moduleCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([module, count]) => ({ module, count }));

    return { total: activities.length, today, thisWeek, errors, warnings, topModules };
  },
});

/** Get recent activity with user + entity context for the dashboard. */
export const getRecentForDashboard = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 10;

    const activities = await ctx.db
      .query("activity_logs")
      .withIndex("by_global_date")
      .order("desc")
      .take(limit);

    // Enrich with user information
    const enriched = await Promise.all(
      activities.map(async (a) => {
        const user = a.userId ? await ctx.db.get(a.userId) : null;
        return {
          ...a,
          userName: user?.name || "Unknown",
          userImage: user?.image || null,
        };
      }),
    );

    return enriched;
  },
});
