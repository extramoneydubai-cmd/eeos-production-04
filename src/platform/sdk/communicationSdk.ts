/**
 * Communication SDK — Enterprise Communication Service
 *
 * Every business module MUST use this SDK for messaging and communication.
 * No module may directly query communication tables.
 *
 * Usage:
 *   import { communicationSdk } from "@/platform/sdk/communicationSdk";
 *   await communicationSdk.sendMessage(ctx, { channelId, senderId, content: ... });
 */

import { v } from "convex/values";
import { mutation, query } from "../../convex/_generated/server";
import { Id } from "../../convex/_generated/dataModel";

// ─── SDK Methods ─────────────────────────────────────────────────────────

/**
 * Send a message to a channel.
 */
export const sendMessage = mutation({
  args: {
    channelId: v.id("channels"),
    senderId: v.id("users"),
    content: v.string(),
    messageType: v.optional(v.string()),
    parentId: v.optional(v.id("messages")),
    attachments: v.optional(v.array(v.id("documents"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      channelId: args.channelId,
      senderId: args.senderId,
      content: args.content,
      messageType: args.messageType || "text",
      parentId: args.parentId,
      attachments: args.attachments,
      isPinned: false,
      isAnnouncement: false,
      createdAt: now,
      updatedAt: now,
    });

    // Update channel's last activity
    await ctx.db.patch(args.channelId, { lastActivityAt: now });

    return { messageId };
  },
});

/**
 * Get messages from a channel (paginated).
 */
export const getMessages = query({
  args: {
    channelId: v.id("channels"),
    limit: v.optional(v.number()),
    before: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("messages")
      .withIndex("channelId", (q) => q.eq("channelId", args.channelId))
      .collect();

    let sorted = all.sort((a, b) => b.createdAt - a.createdAt);
    if (args.before) sorted = sorted.filter((m) => m.createdAt < args.before!);
    return sorted.slice(0, args.limit || 50);
  },
});

/**
 * Send an announcement to a channel.
 */
export const sendAnnouncement = mutation({
  args: {
    channelId: v.id("channels"),
    senderId: v.id("users"),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("messages", {
      channelId: args.channelId,
      senderId: args.senderId,
      content: args.content,
      messageType: "announcement",
      isPinned: true,
      isAnnouncement: true,
      title: args.title,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Get channels available to a user.
 */
export const getUserChannels = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("channelMembers")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();

    const channels = [];
    for (const m of memberships) {
      const channel = await ctx.db.get(m.channelId);
      if (channel) channels.push(channel);
    }
    return channels;
  },
});

/**
 * Create a new channel.
 */
export const createChannel = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    channelType: v.string(),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("channels", {
      name: args.name,
      description: args.description,
      channelType: args.channelType,
      companyId: args.companyId,
      branchId: args.branchId,
      lastActivityAt: now,
      createdBy: args.createdBy,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Add a member to a channel.
 */
export const addMember = mutation({
  args: {
    channelId: v.id("channels"),
    userId: v.id("users"),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("channelMembers")
      .withIndex("channelId_userId", (q) =>
        q.eq("channelId", args.channelId).eq("userId", args.userId)
      )
      .first();

    if (existing) return existing._id;

    return ctx.db.insert("channelMembers", {
      channelId: args.channelId,
      userId: args.userId,
      role: args.role || "member",
      createdAt: Date.now(),
    });
  },
});

/**
 * Get unread message count for a user across all channels.
 */
export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("channelMembers")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();

    let total = 0;
    for (const m of memberships) {
      const channel = await ctx.db.get(m.channelId);
      if (!channel) continue;

      const messages = await ctx.db
        .query("messages")
        .withIndex("channelId", (q) => q.eq("channelId", m.channelId))
        .collect();

      const lastRead = m.lastReadAt || 0;
      total += messages.filter((msg) => msg.createdAt > lastRead).length;
    }
    return total;
  },
});

/**
 * Mark channel as read for a user.
 */
export const markAsRead = mutation({
  args: {
    channelId: v.id("channels"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("channelMembers")
      .withIndex("channelId_userId", (q) =>
        q.eq("channelId", args.channelId).eq("userId", args.userId)
      )
      .first();

    if (membership) {
      await ctx.db.patch(membership._id, { lastReadAt: Date.now() });
    }
    return { success: true };
  },
});
