/**
 * Notification SDK — Enterprise Notification Service
 *
 * Every business module MUST use this SDK to send notifications.
 * No module may directly call ctx.db.insert("notifications", ...).
 *
 * Usage:
 *   import { notificationSdk } from "@/platform/sdk/notificationSdk";
 *   await notificationSdk.send(ctx, { userId, type: "task_assigned", ... });
 */

import { v } from "convex/values";
import { mutation, query } from "../../convex/_generated/server";
import { Id } from "../../convex/_generated/dataModel";

// ─── Types ───────────────────────────────────────────────────────────────

export interface NotificationInput {
  userId: Id<"users">;
  type: string;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: string;
  companyId?: Id<"companies">;
  branchId?: Id<"branches">;
}

// ─── SDK Methods ─────────────────────────────────────────────────────────

/**
 * Send a notification to a single user.
 * Single entry point for ALL notifications across the platform.
 */
export const send = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    referenceId: v.optional(v.string()),
    referenceType: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      referenceId: args.referenceId,
      referenceType: args.referenceType,
      isRead: false,
      companyId: args.companyId,
      branchId: args.branchId,
      createdAt: Date.now(),
    });
  },
});

/**
 * Send a notification to multiple users (batch).
 */
export const sendBatch = mutation({
  args: {
    userIds: v.array(v.id("users")),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    referenceId: v.optional(v.string()),
    referenceType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const userId of args.userIds) {
      await ctx.db.insert("notifications", {
        userId,
        type: args.type,
        title: args.title,
        message: args.message,
        referenceId: args.referenceId,
        referenceType: args.referenceType,
        isRead: false,
        createdAt: now,
      });
    }
  },
});

/**
 * Send a notification to all users in a department.
 */
export const sendToDepartment = mutation({
  args: {
    departmentId: v.id("departments"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    referenceId: v.optional(v.string()),
    referenceType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("departmentId", (q) => q.eq("departmentId", args.departmentId))
      .collect();

    const now = Date.now();
    for (const user of users) {
      if (!user.isDisabled) {
        await ctx.db.insert("notifications", {
          userId: user._id,
          type: args.type,
          title: args.title,
          message: args.message,
          referenceId: args.referenceId,
          referenceType: args.referenceType,
          isRead: false,
          createdAt: now,
        });
      }
    }
  },
});

/**
 * Send a notification to all users in a branch.
 */
export const sendToBranch = mutation({
  args: {
    branchId: v.id("branches"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    referenceId: v.optional(v.string()),
    referenceType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("branchId", (q) => q.eq("branchId", args.branchId))
      .collect();

    const now = Date.now();
    for (const user of users) {
      if (!user.isDisabled) {
        await ctx.db.insert("notifications", {
          userId: user._id,
          type: args.type,
          title: args.title,
          message: args.message,
          referenceId: args.referenceId,
          referenceType: args.referenceType,
          isRead: false,
          createdAt: now,
        });
      }
    }
  },
});

/**
 * Get unread notifications for a user.
 */
export const getUnread = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("userId_isRead", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    return notifications.sort((a, b) => b.createdAt - a.createdAt).slice(0, args.limit || 20);
  },
});

/**
 * Get unread notification count for a user.
 */
export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("userId_isRead", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    return unread.length;
  },
});

/**
 * Get all notifications for a user (paginated).
 */
export const list = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let notifications;
    if (args.unreadOnly) {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("userId_isRead", (q) =>
          q.eq("userId", args.userId).eq("isRead", false)
        )
        .collect();
    } else {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("userId", (q) => q.eq("userId", args.userId))
        .collect();
    }

    return notifications.sort((a, b) => b.createdAt - a.createdAt).slice(0, args.limit || 50);
  },
});

/**
 * Mark a notification as read.
 */
export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

/**
 * Mark all notifications as read for a user.
 */
export const markAllAsRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("userId_isRead", (q) =>
        q.eq("userId", args.userId).eq("isRead", false)
      )
      .collect();

    for (const n of unread) {
      await ctx.db.patch(n._id, { isRead: true });
    }
  },
});

/**
 * Delete a notification.
 */
export const remove = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId);
  },
});
