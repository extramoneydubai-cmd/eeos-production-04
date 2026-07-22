import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================
// NOTIFICATIONS
// ============================

export const listNotifications = query({
  args: {
    userId: v.id("users"),
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let notifications;
    if (args.unreadOnly) {
      notifications = await ctx.db.query("notifications").withIndex("userId_isRead", (q) => q.eq("userId", args.userId).eq("isRead", false)).collect();
    } else {
      notifications = await ctx.db.query("notifications").withIndex("userId", (q) => q.eq("userId", args.userId)).collect();
    }
    notifications = notifications.sort((a, b) => b.createdAt - a.createdAt);
    if (args.limit) {
      notifications = notifications.slice(0, args.limit);
    }
    return notifications;
  },
});

export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unread = await ctx.db.query("notifications").withIndex("userId_isRead", (q) => q.eq("userId", args.userId).eq("isRead", false)).collect();
    return unread.length;
  },
});

export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    referenceId: v.optional(v.string()),
    referenceType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type as any,
      title: args.title,
      message: args.message,
      referenceId: args.referenceId,
      referenceType: args.referenceType,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

export const markAllAsRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unread = await ctx.db.query("notifications").withIndex("userId_isRead", (q) => q.eq("userId", args.userId).eq("isRead", false)).collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { isRead: true });
    }
  },
});

export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId);
  },
});
