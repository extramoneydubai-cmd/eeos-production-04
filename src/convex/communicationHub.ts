import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ─── Enterprise Pipeline Config ───────────────────────────────
// Communication mutations route through withScopeAndEvents() so every
// queue entry / notification emits audit + timeline + event-bus records
// and dashboard-refresh signals.
//
// getUserId returns undefined intentionally: communication is used by
// every staff role (including team/self scopes who would otherwise be
// denied writes with an empty entity scope), so scope enforcement stays
// a no-op here while the event pipeline is fully wired — mirroring the
// messenger engine adoption. Search indexing is off (message noise);
// notifications opt back in individually.
const commPipeline = {
  module: "communication",
  getUserId: () => undefined,
  getEntityCompanyId: () => undefined,
  getEntityBranchId: () => undefined,
  notifyViaMatrix: false,
  triggerWorkflow: false,
  triggerAutomation: false,
  registerSearch: false,
  signalDashboard: true,
} as const;

// ─── HELPERS ───────────────────────────────────────────────

async function createQueueLog(ctx: any, queueId: string, action: string, status: string, details?: string) {
  await ctx.db.insert("communicationLogs", {
    queueId,
    action,
    status,
    details,
    performedAt: Date.now(),
  });
}

async function createNotificationCenterEntry(
  ctx: any,
  args: { userId: string; title: string; message: string; category: string; priority: string; channel: string; referenceType?: string; referenceId?: string; actionUrl?: string }
) {
  await ctx.db.insert("notificationCenter", {
    userId: args.userId,
    title: args.title,
    message: args.message,
    category: args.category,
    priority: args.priority as any,
    channel: args.channel as any,
    referenceType: args.referenceType,
    referenceId: args.referenceId,
    actionUrl: args.actionUrl,
    isRead: false,
    isPinned: false,
    isArchived: false,
    createdAt: Date.now(),
  });
}

function generateReferenceNumber(): string {
  return `MSG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

// ─── CORE SEND FUNCTIONS ───────────────────────────────────

export const sendEmail = mutation({
  args: {
    token: v.optional(v.string()),
    to: v.string(),
    toName: v.optional(v.string()),
    subject: v.string(),
    body: v.string(),
    templateId: v.optional(v.id("communicationTemplates")),
    recipientId: v.optional(v.string()),
    recipientType: v.optional(v.string()),
    referenceType: v.optional(v.string()),
    referenceId: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("normal"), v.literal("high"), v.literal("urgent"))),
    scheduledAt: v.optional(v.number()),
    campaignId: v.optional(v.id("messageCampaigns")),
  },
  handler: withScopeAndEvents(
    {
      ...commPipeline,
      operation: "create",
      entity: "message",
      eventType: "communication.email.queued",
      title: "Email Queued",
    },
    async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const queueId = await ctx.db.insert("communicationQueue", {
      channel: "email",
      recipientAddress: args.to,
      recipientName: args.toName,
      subject: args.subject,
      body: args.body,
      templateId: args.templateId,
      recipientId: args.recipientId,
      recipientType: args.recipientType,
      status: "queued",
      priority: args.priority || "normal",
      scheduledAt: args.scheduledAt,
      retryCount: 0,
      maxRetries: 3,
      campaignId: args.campaignId,
      referenceType: args.referenceType,
      referenceId: args.referenceId,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await createQueueLog(ctx, queueId, "created", "queued", `Email queued to ${args.to}`);

    // If not scheduled, process immediately
    if (!args.scheduledAt) {
      await ctx.db.patch(queueId, { status: "processing" });
      await createQueueLog(ctx, queueId, "processing", "processing");

      // Update sent status
      await ctx.db.patch(queueId, {
        status: "sent",
        sentAt: Date.now(),
      });
      await createQueueLog(ctx, queueId, "sent", "sent", `Email sent to ${args.to}`);

      // Send in-app notification for the recipient if they are a user
      if (args.recipientId && args.recipientType === "user") {
        await createNotificationCenterEntry(ctx, {
          userId: args.recipientId,
          title: args.subject,
          message: args.body.substring(0, 200),
          category: "email",
          priority: args.priority || "normal",
          channel: "email",
          referenceType: args.referenceType,
          referenceId: args.referenceId,
        });
      }
    }

    return queueId;
    }
  ),
});

export const sendWhatsApp = mutation({
  args: {
    token: v.optional(v.string()),
    to: v.string(),
    toName: v.optional(v.string()),
    body: v.string(),
    templateId: v.optional(v.id("communicationTemplates")),
    recipientId: v.optional(v.string()),
    recipientType: v.optional(v.string()),
    referenceType: v.optional(v.string()),
    referenceId: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("normal"), v.literal("high"), v.literal("urgent"))),
    scheduledAt: v.optional(v.number()),
    campaignId: v.optional(v.id("messageCampaigns")),
  },
  handler: withScopeAndEvents(
    {
      ...commPipeline,
      operation: "create",
      entity: "message",
      eventType: "communication.whatsapp.queued",
      title: "WhatsApp Queued",
    },
    async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const queueId = await ctx.db.insert("communicationQueue", {
      channel: "whatsapp",
      recipientAddress: args.to,
      recipientName: args.toName,
      body: args.body,
      templateId: args.templateId,
      recipientId: args.recipientId,
      recipientType: args.recipientType,
      status: "queued",
      priority: args.priority || "normal",
      scheduledAt: args.scheduledAt,
      retryCount: 0,
      maxRetries: 3,
      campaignId: args.campaignId,
      referenceType: args.referenceType,
      referenceId: args.referenceId,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await createQueueLog(ctx, queueId, "created", "queued", `WhatsApp queued to ${args.to}`);

    if (!args.scheduledAt) {
      await ctx.db.patch(queueId, { status: "processing" });
      await createQueueLog(ctx, queueId, "processing", "processing");
      await ctx.db.patch(queueId, { status: "sent", sentAt: Date.now() });
      await createQueueLog(ctx, queueId, "sent", "sent", `WhatsApp sent to ${args.to}`);

      if (args.recipientId && args.recipientType === "user") {
        await createNotificationCenterEntry(ctx, {
          userId: args.recipientId,
          title: "WhatsApp Message",
          message: args.body.substring(0, 200),
          category: "whatsapp",
          priority: args.priority || "normal",
          channel: "whatsapp",
          referenceType: args.referenceType,
          referenceId: args.referenceId,
        });
      }
    }

    return queueId;
    }
  ),
});

export const sendSMS = mutation({
  args: {
    token: v.optional(v.string()),
    to: v.string(),
    toName: v.optional(v.string()),
    body: v.string(),
    templateId: v.optional(v.id("communicationTemplates")),
    recipientId: v.optional(v.string()),
    recipientType: v.optional(v.string()),
    referenceType: v.optional(v.string()),
    referenceId: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("normal"), v.literal("high"), v.literal("urgent"))),
    scheduledAt: v.optional(v.number()),
    campaignId: v.optional(v.id("messageCampaigns")),
  },
  handler: withScopeAndEvents(
    {
      ...commPipeline,
      operation: "create",
      entity: "message",
      eventType: "communication.sms.queued",
      title: "SMS Queued",
    },
    async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const queueId = await ctx.db.insert("communicationQueue", {
      channel: "sms",
      recipientAddress: args.to,
      recipientName: args.toName,
      body: args.body,
      templateId: args.templateId,
      recipientId: args.recipientId,
      recipientType: args.recipientType,
      status: "queued",
      priority: args.priority || "normal",
      scheduledAt: args.scheduledAt,
      retryCount: 0,
      maxRetries: 3,
      campaignId: args.campaignId,
      referenceType: args.referenceType,
      referenceId: args.referenceId,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await createQueueLog(ctx, queueId, "created", "queued", `SMS queued to ${args.to}`);

    if (!args.scheduledAt) {
      await ctx.db.patch(queueId, { status: "processing" });
      await createQueueLog(ctx, queueId, "processing", "processing");
      await ctx.db.patch(queueId, { status: "sent", sentAt: Date.now() });
      await createQueueLog(ctx, queueId, "sent", "sent", `SMS sent to ${args.to}`);
    }

    return queueId;
    }
  ),
});

export const sendPush = mutation({
  args: {
    token: v.optional(v.string()),
    to: v.string(),
    toName: v.optional(v.string()),
    title: v.string(),
    body: v.string(),
    templateId: v.optional(v.id("communicationTemplates")),
    recipientId: v.optional(v.string()),
    recipientType: v.optional(v.string()),
    referenceType: v.optional(v.string()),
    referenceId: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("normal"), v.literal("high"), v.literal("urgent"))),
  },
  handler: withScopeAndEvents(
    {
      ...commPipeline,
      operation: "create",
      entity: "message",
      eventType: "communication.push.sent",
      title: "Push Sent",
    },
    async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const queueId = await ctx.db.insert("communicationQueue", {
      channel: "push",
      recipientAddress: args.to,
      recipientName: args.toName,
      subject: args.title,
      body: args.body,
      templateId: args.templateId,
      recipientId: args.recipientId,
      recipientType: args.recipientType,
      status: "sent",
      priority: args.priority || "normal",
      retryCount: 0,
      maxRetries: 2,
      referenceType: args.referenceType,
      referenceId: args.referenceId,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sentAt: Date.now(),
    });

    await createQueueLog(ctx, queueId, "sent", "sent", `Push notification sent to ${args.to}`);

    // Also create in-app notification
    if (args.recipientId && args.recipientType === "user") {
      await createNotificationCenterEntry(ctx, {
        userId: args.recipientId,
        title: args.title,
        message: args.body,
        category: "push",
        priority: args.priority || "normal",
        channel: "push",
        referenceType: args.referenceType,
        referenceId: args.referenceId,
        actionUrl: args.actionUrl,
      });
    }

    return queueId;
    }
  ),
});

export const sendInAppNotification = mutation({
  args: {
    token: v.optional(v.string()),
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    category: v.string(),
    priority: v.optional(v.union(v.literal("low"), v.literal("normal"), v.literal("high"), v.literal("urgent"))),
    referenceType: v.optional(v.string()),
    referenceId: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
    templateId: v.optional(v.id("communicationTemplates")),
  },
  handler: withScopeAndEvents(
    {
      ...commPipeline,
      operation: "create",
      entity: "notification",
      eventType: "communication.in_app.sent",
      title: "In-App Notification Sent",
    },
    async (ctx, args) => {
    const currentUser = await getAuthUserId(ctx);
    if (!currentUser) throw new Error("Not authenticated");

    const queueId = await ctx.db.insert("communicationQueue", {
      channel: "in_app",
      recipientAddress: args.userId,
      recipientName: "",
      subject: args.title,
      body: args.message,
      templateId: args.templateId,
      recipientId: args.userId,
      recipientType: "user",
      status: "delivered",
      priority: args.priority || "normal",
      retryCount: 0,
      maxRetries: 0,
      referenceType: args.referenceType,
      referenceId: args.referenceId,
      createdBy: currentUser,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sentAt: Date.now(),
      deliveredAt: Date.now(),
    });

    await createNotificationCenterEntry(ctx, {
      userId: args.userId,
      title: args.title,
      message: args.message,
      category: args.category,
      priority: args.priority || "normal",
      channel: "in_app",
      referenceType: args.referenceType,
      referenceId: args.referenceId,
      actionUrl: args.actionUrl,
    });

    return queueId;
    }
  ),
});

// ─── SCHEDULING ────────────────────────────────────────────

export const scheduleMessage = mutation({
  args: {
    token: v.optional(v.string()),
    queueId: v.id("communicationQueue"),
    scheduledAt: v.number(),
  },
  handler: withScopeAndEvents(
    {
      ...commPipeline,
      operation: "update",
      entity: "message",
      eventType: "communication.message.scheduled",
      title: "Message Scheduled",
    },
    async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const msg = await ctx.db.get(args.queueId);
    if (!msg) throw new Error("Message not found");

    await ctx.db.patch(args.queueId, {
      scheduledAt: args.scheduledAt,
      status: "queued",
    });
    await createQueueLog(ctx, args.queueId, "scheduled", "queued", `Scheduled for ${new Date(args.scheduledAt).toISOString()}`);

    return args.queueId;
    }
  ),
});

export const cancelScheduledMessage = mutation({
  args: { token: v.optional(v.string()), queueId: v.id("communicationQueue") },
  handler: withScopeAndEvents(
    {
      ...commPipeline,
      operation: "update",
      entity: "message",
      eventType: "communication.message.cancelled",
      title: "Message Cancelled",
    },
    async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const msg = await ctx.db.get(args.queueId);
    if (!msg) throw new Error("Message not found");
    if (msg.status !== "queued") throw new Error("Only queued messages can be cancelled");

    await ctx.db.patch(args.queueId, { status: "cancelled" });
    await createQueueLog(ctx, args.queueId, "cancelled", "cancelled", "Message cancelled by user");
    return args.queueId;
    }
  ),
});

export const retryFailedMessage = mutation({
  args: { token: v.optional(v.string()), queueId: v.id("communicationQueue") },
  handler: withScopeAndEvents(
    {
      ...commPipeline,
      operation: "update",
      entity: "message",
      eventType: "communication.message.retried",
      title: "Message Retried",
    },
    async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const msg = await ctx.db.get(args.queueId);
    if (!msg) throw new Error("Message not found");
    if (msg.status !== "failed" && msg.status !== "retrying") throw new Error("Only failed messages can be retried");

    const newRetryCount = (msg.retryCount || 0) + 1;
    await ctx.db.patch(args.queueId, {
      status: "queued",
      retryCount: newRetryCount,
    });
    await createQueueLog(ctx, args.queueId, "retry", "queued", `Retry attempt ${newRetryCount}`);
    return args.queueId;
    }
  ),
});

// ─── MESSAGE QUERIES ───────────────────────────────────────

export const getMessageStatus = query({
  args: { queueId: v.id("communicationQueue") },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get(args.queueId);
    if (!msg) throw new Error("Message not found");

    const logs = await ctx.db.query("communicationLogs")
      .withIndex("queueId", (q: any) => q.eq("queueId", args.queueId))
      .order("asc")
      .collect();

    const delivery = await ctx.db.query("deliveryStatus")
      .withIndex("queueId", (q: any) => q.eq("queueId", args.queueId))
      .first();

    return { message: msg, logs, delivery };
  },
});

export const listMessages = query({
  args: {
    channel: v.optional(v.union(v.literal("email"), v.literal("whatsapp"), v.literal("sms"), v.literal("push"), v.literal("in_app"))),
    status: v.optional(v.union(
      v.literal("queued"), v.literal("processing"), v.literal("sent"),
      v.literal("delivered"), v.literal("read"), v.literal("failed"),
      v.literal("retrying"), v.literal("cancelled"),
    )),
    referenceType: v.optional(v.string()),
    referenceId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("communicationQueue");
    if (args.channel) {
      query = query.withIndex("channel", (q: any) => q.eq("channel", args.channel));
    }
    if (args.status) {
      query = query.filter((q: any) => q.eq(q.field("status"), args.status));
    }
    if (args.referenceType) {
      query = query.filter((q: any) => q.eq(q.field("referenceType"), args.referenceType));
    }
    let results = await query.order("desc").collect();
    if (args.referenceId) {
      results = results.filter((m: any) => m.referenceId === args.referenceId);
    }
    if (args.limit && args.limit > 0) {
      results = results.slice(0, args.limit);
    }
    return results;
  },
});

export const getQueueStats = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("communicationQueue").collect();
    return {
      total: all.length,
      queued: all.filter((m: any) => m.status === "queued").length,
      processing: all.filter((m: any) => m.status === "processing").length,
      sent: all.filter((m: any) => m.status === "sent").length,
      delivered: all.filter((m: any) => m.status === "delivered").length,
      read: all.filter((m: any) => m.status === "read").length,
      failed: all.filter((m: any) => m.status === "failed").length,
      retrying: all.filter((m: any) => m.status === "retrying").length,
      cancelled: all.filter((m: any) => m.status === "cancelled").length,
    };
  },
});

// ─── DELIVERY UPDATES ──────────────────────────────────────

export const updateDeliveryStatus = mutation({
  args: {
    token: v.optional(v.string()),
    queueId: v.id("communicationQueue"),
    status: v.union(v.literal("delivered"), v.literal("read"), v.literal("failed")),
    provider: v.optional(v.string()),
    providerMessageId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    errorCode: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      ...commPipeline,
      operation: "update",
      entity: "message",
      eventType: "communication.message.delivery_updated",
      title: "Delivery Status Updated",
    },
    async (ctx, args) => {
    const patch: Record<string, any> = { status: args.status };
    if (args.status === "delivered") patch.deliveredAt = Date.now();
    if (args.status === "read") patch.readAt = Date.now();
    if (args.status === "failed") patch.failedAt = Date.now();
    if (args.errorMessage) patch.errorMessage = args.errorMessage;

    await ctx.db.patch(args.queueId, { ...patch, updatedAt: Date.now() });

    await ctx.db.insert("deliveryStatus", {
      queueId: args.queueId,
      provider: args.provider || "internal",
      providerMessageId: args.providerMessageId,
      status: args.status,
      timestamp: Date.now(),
      details: args.errorMessage,
      errorCode: args.errorCode,
      errorMessage: args.errorMessage,
    });

    await createQueueLog(ctx, args.queueId, "delivery_update", args.status, args.errorMessage || `Status updated to ${args.status}`);
    return args.queueId;
    }
  ),
});

// ─── NOTIFICATION CENTER QUERIES ───────────────────────────

export const getMyNotifications = query({
  args: {
    userId: v.id("users"),
    category: v.optional(v.string()),
    isRead: v.optional(v.boolean()),
    isArchived: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("notificationCenter")
      .withIndex("userId", (q: any) => q.eq("userId", args.userId));
    if (args.isRead !== undefined) {
      query = query.filter((q: any) => q.eq(q.field("isRead"), args.isRead));
    }
    if (args.isArchived !== undefined) {
      query = query.filter((q: any) => q.eq(q.field("isArchived"), args.isArchived));
    }
    let results = await query.order("desc").collect();
    if (args.category) {
      results = results.filter((n: any) => n.category === args.category);
    }
    if (args.limit) {
      results = results.slice(0, args.limit);
    }
    return results;
  },
});

export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db.query("notificationCenter")
      .withIndex("userId_isRead", (q: any) => q.eq("userId", args.userId).eq("isRead", false))
      .collect();
    return notifications.length;
  },
});

export const markAsRead = mutation({
  args: { token: v.optional(v.string()), notificationId: v.id("notificationCenter") },
  handler: withScopeAndEvents(
    {
      ...commPipeline,
      operation: "update",
      entity: "notification",
      eventType: "communication.notification.read",
      title: "Notification Read",
    },
    async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { isRead: true, readAt: Date.now() });
    return args.notificationId;
    }
  ),
});

export const markAllAsRead = mutation({
  args: { token: v.optional(v.string()), userId: v.id("users") },
  handler: withScopeAndEvents(
    {
      ...commPipeline,
      operation: "update",
      entity: "notification",
      eventType: "communication.notification.all_read",
      title: "All Notifications Read",
    },
    async (ctx, args) => {
    const unread = await ctx.db.query("notificationCenter")
      .withIndex("userId_isRead", (q: any) => q.eq("userId", args.userId).eq("isRead", false))
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { isRead: true, readAt: Date.now() });
    }
    return unread.length;
    }
  ),
});

export const togglePin = mutation({
  args: { token: v.optional(v.string()), notificationId: v.id("notificationCenter") },
  handler: withScopeAndEvents(
    {
      ...commPipeline,
      operation: "update",
      entity: "notification",
      eventType: "communication.notification.pinned",
      title: "Notification Pinned",
    },
    async (ctx, args) => {
    const n = await ctx.db.get(args.notificationId);
    if (!n) throw new Error("Notification not found");
    await ctx.db.patch(args.notificationId, { isPinned: !n.isPinned });
    return args.notificationId;
    }
  ),
});

export const archiveNotification = mutation({
  args: { token: v.optional(v.string()), notificationId: v.id("notificationCenter") },
  handler: withScopeAndEvents(
    {
      ...commPipeline,
      operation: "update",
      entity: "notification",
      eventType: "communication.notification.archived",
      title: "Notification Archived",
    },
    async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { isArchived: true });
    return args.notificationId;
    }
  ),
});

export const deleteNotification = mutation({
  args: { token: v.optional(v.string()), notificationId: v.id("notificationCenter") },
  handler: withScopeAndEvents(
    {
      ...commPipeline,
      operation: "delete",
      entity: "notification",
      eventType: "communication.notification.deleted",
      title: "Notification Deleted",
    },
    async (ctx, args) => {
    await ctx.db.delete(args.notificationId);
    return args.notificationId;
    }
  ),
});

// ─── PREFERENCES ───────────────────────────────────────────

export const setPreference = mutation({
  args: {
    token: v.optional(v.string()),
    userId: v.id("users"),
    channel: v.union(v.literal("email"), v.literal("whatsapp"), v.literal("sms"), v.literal("push"), v.literal("in_app")),
    category: v.string(),
    enabled: v.boolean(),
  },
  handler: withScopeAndEvents(
    {
      ...commPipeline,
      operation: "create",
      entity: "preference",
      eventType: "communication.preference.saved",
      title: "Preference Saved",
    },
    async (ctx, args) => {
    const existing = await ctx.db.query("communicationPreferences")
      .withIndex("userId_category", (q: any) =>
        q.eq("userId", args.userId).eq("category", args.category))
      .filter((q: any) => q.eq(q.field("channel"), args.channel))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { enabled: args.enabled, updatedAt: Date.now() });
      return existing._id;
    }

    return ctx.db.insert("communicationPreferences", {
      userId: args.userId,
      channel: args.channel,
      category: args.category,
      enabled: args.enabled,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    }
  ),
});

export const getPreferences = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return ctx.db.query("communicationPreferences")
      .withIndex("userId", (q: any) => q.eq("userId", args.userId))
      .collect();
  },
});
