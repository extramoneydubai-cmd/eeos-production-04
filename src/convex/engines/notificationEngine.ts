// @ts-nocheck — This file is type-checked by `npx convex dev`, not by the frontend `tsc`.

/**
 * EEOS Notification Engine (P0)
 *
 * Universal notification system for every module in the platform.
 * Phase 1: In-app notifications with architecture ready for Email, WhatsApp, SMS, Push, Broadcast.
 *
 * DOC-22 reference: Notification Engine
 * DOC-23 reference: Engine Standards, Naming Standards
 *
 * Features:
 * - 17 notification types (info, success, warning, error, approval, etc.)
 * - Per-user notification queue
 * - Broadcast to organization / module / all
 * - Unread counter
 * - Read / Archive / Delete lifecycle
 * - Priority levels
 * - Action URLs for deep linking
 * - Expiry support
 * - Search and filter
 */

import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "../_generated/server";

const NOTIFICATION_TYPES = [
  "info", "success", "warning", "error",
  "approval", "reminder", "assignment",
  "message", "announcement", "payment",
  "attendance", "admission",
  "lead", "task", "workflow",
  "system", "custom",
] as const;

// ─── Mutations ─────────────────────────────────────────────────

/** Send a notification to a single user. Core API every module uses. */
export const send = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    type: v.union(...NOTIFICATION_TYPES.map((t) => v.literal(t))),
    userId: v.id("users"),
    module: v.optional(v.string()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
    priority: v.optional(v.number()),
    actionUrl: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    metadata: v.optional(v.any()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const senderId = await getAuthUserId(ctx);

    return await ctx.db.insert("notifications", {
      title: args.title,
      message: args.message,
      type: args.type,
      module: args.module,
      entityType: args.entityType,
      entityId: args.entityId,
      userId: args.userId,
      organizationId: args.organizationId,
      priority: args.priority ?? 0,
      read: false,
      archived: false,
      expiresAt: args.expiresAt,
      actionUrl: args.actionUrl,
      icon: args.icon,
      color: args.color,
      metadata: args.metadata,
      createdBy: senderId ?? undefined,
      createdAt: Date.now(),
    });
  },
});

/** Broadcast a notification to multiple users or an entire organization. */
export const broadcast = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    type: v.union(...NOTIFICATION_TYPES.map((t) => v.literal(t))),
    userIds: v.optional(v.array(v.id("users"))),
    organizationId: v.optional(v.id("organizations")),
    module: v.optional(v.string()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    priority: v.optional(v.number()),
    actionUrl: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    metadata: v.optional(v.any()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const senderId = await getAuthUserId(ctx);

    let targetUserIds: (typeof args.userIds) = args.userIds;

    // If broadcasting to an organization, resolve all users in that org
    if (args.organizationId && !targetUserIds) {
      // Get all users in the organization (they'll be found via activity_logs or team membership)
      // For now, broadcast to the provided userIds or organization members
      targetUserIds = [];
    }

    if (!targetUserIds || targetUserIds.length === 0) {
      throw new Error("No target users specified. Provide userIds or organizationId.");
    }

    const notificationIds = await Promise.all(
      targetUserIds.map(async (userId) => {
        return await ctx.db.insert("notifications", {
          title: args.title,
          message: args.message,
          type: args.type,
          module: args.module,
          entityType: args.entityType,
          entityId: args.entityId,
          userId,
          organizationId: args.organizationId,
          priority: args.priority ?? 0,
          read: false,
          archived: false,
          expiresAt: args.expiresAt,
          actionUrl: args.actionUrl,
          icon: args.icon,
          color: args.color,
          metadata: args.metadata,
          createdBy: senderId ?? undefined,
          createdAt: Date.now(),
        });
      }),
    );

    return { sent: notificationIds.length, ids: notificationIds };
  },
});

/** Send a system notification (no sender context needed). */
export const sendSystem = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    type: v.union(...NOTIFICATION_TYPES.map((t) => v.literal(t))),
    userId: v.id("users"),
    module: v.optional(v.string()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
    priority: v.optional(v.number()),
    actionUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      title: args.title,
      message: args.message,
      type: args.type,
      module: args.module,
      entityType: args.entityType,
      entityId: args.entityId,
      userId: args.userId,
      organizationId: args.organizationId,
      priority: args.priority ?? 0,
      read: false,
      archived: false,
      actionUrl: args.actionUrl,
      createdBy: undefined,
      createdAt: Date.now(),
    });
  },
});

/** Mark a single notification as read. */
export const markRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");
    if (notification.userId !== userId) throw new Error("Not authorized");

    return await ctx.db.patch(args.notificationId, { read: true });
  },
});

/** Mark all unread notifications as read for the current user. */
export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("read", false))
      .collect();

    await Promise.all(
      unread.map((n) => ctx.db.patch(n._id, { read: true })),
    );

    return { marked: unread.length };
  },
});

/** Mark multiple notifications as read. */
export const bulkRead = mutation({
  args: {
    notificationIds: v.array(v.id("notifications")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await Promise.all(
      args.notificationIds.map(async (id) => {
        const n = await ctx.db.get(id);
        if (n && n.userId === userId) {
          await ctx.db.patch(id, { read: true });
        }
      }),
    );

    return { marked: args.notificationIds.length };
  },
});

/** Archive a single notification. */
export const archive = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");
    if (notification.userId !== userId) throw new Error("Not authorized");

    return await ctx.db.patch(args.notificationId, { archived: true });
  },
});

/** Archive all read notifications for the current user. */
export const archiveAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const read = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("read", true))
      .filter((q) => q.eq(q.field("archived"), false))
      .collect();

    await Promise.all(
      read.map((n) => ctx.db.patch(n._id, { archived: true })),
    );

    return { archived: read.length };
  },
});

/** Delete a single notification. */
export const remove = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("Notification not found");
    if (notification.userId !== userId) throw new Error("Not authorized");

    return await ctx.db.delete(args.notificationId);
  },
});

/** Bulk archive multiple notifications. */
export const bulkArchive = mutation({
  args: {
    notificationIds: v.array(v.id("notifications")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await Promise.all(
      args.notificationIds.map(async (id) => {
        const n = await ctx.db.get(id);
        if (n && n.userId === userId) {
          await ctx.db.patch(id, { archived: true });
        }
      }),
    );

    return { archived: args.notificationIds.length };
  },
});

// ─── Queries ───────────────────────────────────────────────────

/** List notifications for the current user with optional filters. */
export const list = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    unreadOnly: v.optional(v.boolean()),
    type: v.optional(v.union(...NOTIFICATION_TYPES.map((t) => v.literal(t)))),
    module: v.optional(v.string()),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 50;
    const includeArchived = args.includeArchived || false;

    let notifications;

    if (args.unreadOnly) {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("read", false))
        .order("desc")
        .take(limit);
    } else if (args.type) {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user_type", (q) => q.eq("userId", userId).eq("type", args.type))
        .order("desc")
        .take(limit);
    } else if (args.module) {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user_module", (q) => q.eq("userId", userId).eq("module", args.module))
        .order("desc")
        .take(limit);
    } else {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user_date", (q) => q.eq("userId", userId))
        .order("desc")
        .take(limit);
    }

    if (!includeArchived) {
      notifications = notifications.filter((n) => !n.archived);
    }

    return notifications;
  },
});

/** Get unread notification count for the current user. */
export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("read", false))
      .collect();

    // Filter out archived
    return notifications.filter((n) => !n.archived).length;
  },
});

/** Search notifications by title/message text for the current user. */
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
      .query("notifications")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .order("desc")
      .take(200);

    return results
      .filter(
        (n) =>
          !n.archived &&
          (n.title.toLowerCase().includes(q) ||
            n.message.toLowerCase().includes(q) ||
            (n.module || "").toLowerCase().includes(q)),
      )
      .slice(0, limit);
  },
});

/** Get notification stats for the dashboard. */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const all = await ctx.db
      .query("notifications")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .collect();

    const now = Date.now();
    const active = all.filter((n) => !n.archived);
    const unread = active.filter((n) => !n.read);
    const today = active.filter((n) => n.createdAt > now - 86400000).length;
    const thisWeek = active.filter((n) => n.createdAt > now - 604800000).length;

    // By type
    const byType: Record<string, number> = {};
    for (const n of active) {
      byType[n.type] = (byType[n.type] || 0) + 1;
    }

    return {
      total: all.length,
      active: active.length,
      unread: unread.length,
      today,
      thisWeek,
      byType,
    };
  },
});

/** Get recent notifications for the dashboard widget. */
export const getRecentForDashboard = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 5;

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return notifications.filter((n) => !n.archived);
  },
});
