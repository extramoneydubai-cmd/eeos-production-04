import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { getCurrentUser } from "./users";

// ============================
// CHANNELS
// ============================

export const listChannels = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    if (args.userId) {
      const memberships = await ctx.db.query("channelMembers").withIndex("userId", (q) => q.eq("userId", args.userId!)).collect();
      const channelIds = memberships.map((m) => m.channelId);
      const channels = await ctx.db.query("channels").collect();
      return channels.filter((c) => channelIds.includes(c._id)).sort((a, b) => a.name.localeCompare(b.name));
    }
    return await ctx.db.query("channels").collect();
  },
});

export const createChannel = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(),
    createdBy: v.id("users"),
    memberIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const channelId = await ctx.db.insert("channels", {
      name: args.name,
      description: args.description,
      type: args.type as "channel" | "announcement",
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
    // Add creator as member
    await ctx.db.insert("channelMembers", {
      channelId,
      userId: args.createdBy,
      joinedAt: now,
      lastReadAt: now,
    });
    // Add other members
    if (args.memberIds) {
      for (const uid of args.memberIds) {
        if (uid !== args.createdBy) {
          await ctx.db.insert("channelMembers", {
            channelId,
            userId: uid,
            joinedAt: now,
            lastReadAt: now,
          });
        }
      }
    }
    return channelId;
  },
});

export const addChannelMember = mutation({
  args: {
    channelId: v.id("channels"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("channelMembers", {
      channelId: args.channelId,
      userId: args.userId,
      joinedAt: Date.now(),
      lastReadAt: Date.now(),
    });
  },
});

export const removeChannelMember = mutation({
  args: { membershipId: v.id("channelMembers") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.membershipId);
  },
});

export const getChannelMembers = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    return await ctx.db.query("channelMembers").withIndex("channelId", (q) => q.eq("channelId", args.channelId)).collect();
  },
});

// ============================
// MESSAGES
// ============================

export const listMessages = query({
  args: {
    channelId: v.id("channels"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db.query("messages")
      .withIndex("channelId_createdAt", (q) => q.eq("channelId", args.channelId))
      .collect();
    const sorted = messages.sort((a, b) => b.createdAt - a.createdAt);
    return args.limit ? sorted.slice(0, args.limit).reverse() : sorted.reverse();
  },
});

export const sendMessage = mutation({
  args: {
    channelId: v.id("channels"),
    senderId: v.id("users"),
    content: v.string(),
    mentions: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      channelId: args.channelId,
      senderId: args.senderId,
      content: args.content,
      mentions: args.mentions,
      createdAt: now,
    });
    // Create mention notifications
    if (args.mentions) {
      for (const mentionedUserId of args.mentions) {
        if (mentionedUserId !== args.senderId) {
          await ctx.db.insert("notifications", {
            userId: mentionedUserId,
            type: "mention",
            title: "You were mentioned",
            message: `You were mentioned in a message`,
            referenceId: args.channelId,
            referenceType: "channel",
            isRead: false,
            createdAt: now,
          });
        }
      }
    }
    return messageId;
  },
});

export const pinMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, { isPinned: true });
  },
});

export const unpinMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, { isPinned: false });
  },
});

// ============================
// ANNOUNCEMENTS
// ============================

/** List recent organization-wide announcements across announcement channels. */
export const listAnnouncements = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;
    const announcementChannels = await ctx.db
      .query("channels")
      .filter((q) =>
        q.or(
          q.eq(q.field("type"), "announcement"),
          q.eq(q.field("name"), "Announcements")
        )
      )
      .collect();

    const allMessages: Array<Doc<"messages">> = [];
    for (const channel of announcementChannels) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("channelId_createdAt", (q) => q.eq("channelId", channel._id))
        .collect();
      allMessages.push(...messages);
    }
    allMessages.sort((a, b) => b.createdAt - a.createdAt);

    const recent = allMessages.slice(0, limit);
    const users = await ctx.db.query("users").collect();
    const userMap = new Map(users.map((u) => [u._id, u]));

    return recent.map((m) => ({
      _id: m._id,
      content: m.content,
      createdAt: m.createdAt,
      senderId: m.senderId,
      senderName: userMap.get(m.senderId)?.name ?? "Unknown",
      channelId: m.channelId,
    }));
  },
});

// ============================
// DIRECT MESSAGES
// ============================

export const getDirectMessages = query({
  args: {
    userId1: v.id("users"),
    userId2: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db.query("directMessages").collect();
    const filtered = messages.filter(
      (m) =>
        (m.senderId === args.userId1 && m.receiverId === args.userId2) ||
        (m.senderId === args.userId2 && m.receiverId === args.userId1)
    );
    const sorted = filtered.sort((a, b) => b.createdAt - a.createdAt);
    return args.limit ? sorted.slice(0, args.limit).reverse() : sorted.reverse();
  },
});

export const sendDirectMessage = mutation({
  args: {
    senderId: v.id("users"),
    receiverId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("directMessages", {
      senderId: args.senderId,
      receiverId: args.receiverId,
      content: args.content,
      isRead: false,
      createdAt: now,
    });
    // Create notification for receiver
    await ctx.db.insert("notifications", {
      userId: args.receiverId,
      type: "message",
      title: "New Message",
      message: args.content.slice(0, 100),
      referenceId: args.senderId,
      referenceType: "direct_message",
      isRead: false,
      createdAt: now,
    });
  },
});

export const markDirectMessagesRead = mutation({
  args: {
    senderId: v.id("users"),
    receiverId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db.query("directMessages").collect();
    const unreadMessages = messages.filter(
      (m) => m.senderId === args.senderId && m.receiverId === args.receiverId && !m.isRead
    );
    for (const m of unreadMessages) {
      await ctx.db.patch(m._id, { isRead: true });
    }
  },
});

export const getUnreadDirectMessageCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const messages = await ctx.db.query("directMessages").collect();
    return messages.filter((m) => m.receiverId === args.userId && !m.isRead).length;
  },
});

// ============================
// ANNOUNCEMENTS
// ============================

export const createAnnouncement = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    senderId: v.id("users"),
    recipientIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    // Create announcement in the announcements channel
    const announcementsChannel = await ctx.db.query("channels").filter((q) => q.eq(q.field("name"), "Announcements")).first();
    if (announcementsChannel) {
      await ctx.db.insert("messages", {
        channelId: announcementsChannel._id,
        senderId: args.senderId,
        content: `**${args.title}**\n\n${args.content}`,
        createdAt: now,
      });
    }
    // Create notifications for all recipients
    for (const uid of args.recipientIds) {
      if (uid !== args.senderId) {
        await ctx.db.insert("notifications", {
          userId: uid,
          type: "announcement",
          title: args.title,
          message: args.content.slice(0, 150),
          referenceId: args.senderId,
          referenceType: "announcement",
          isRead: false,
          createdAt: now,
        });
      }
    }
  },
});

export const getUnreadChannelCounts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db.query("channelMembers").withIndex("userId", (q) => q.eq("userId", args.userId!)).collect();
    const counts: Record<string, number> = {};
    for (const m of memberships) {
      const messages = await ctx.db.query("messages")
        .withIndex("channelId_createdAt", (q) => q.eq("channelId", m.channelId))
        .collect();
      const unread = messages.filter((msg) => !m.lastReadAt || msg.createdAt > m.lastReadAt).length;
      if (unread > 0) {
        counts[m.channelId] = unread;
      }
    }
    return counts;
  },
});

export const markChannelRead = mutation({
  args: {
    channelId: v.id("channels"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const memberships = await ctx.db.query("channelMembers").withIndex("userId", (q) => q.eq("userId", args.userId!)).collect();
    const membership = memberships.find((m) => m.channelId === args.channelId);
    if (membership) {
      await ctx.db.patch(membership._id, { lastReadAt: Date.now() });
    }
  },
});
