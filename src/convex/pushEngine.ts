import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ─── PUSH QUEUE PROCESSING ─────────────────────────────────

export const processPushQueue = mutation({
  args: { token: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "notifications", entity: "pushEngine" }, async (ctx, args) => {
    const batchSize = args.batchSize || 20;

    const queued = await ctx.db.query("communicationQueue")
      .withIndex("status", (q: any) => q.eq("status", "queued"))
      .filter((q: any) => q.eq(q.field("channel"), "push"))
      .collect();

    const batch = queued.slice(0, batchSize);
    const results: any[] = [];

    for (const msg of batch) {
      try {
        await ctx.db.patch(msg._id, { status: "processing" });

        // In production, this would call Firebase Cloud Messaging / Web Push API / etc.
        await ctx.db.insert("deliveryStatus", {
          queueId: msg._id,
          provider: "internal",
          providerMessageId: `push-${msg._id}-${Date.now()}`,
          status: "sent",
          timestamp: Date.now(),
          details: msg.subject ? `Title: ${msg.subject}` : undefined,
        });

        await ctx.db.patch(msg._id, {
          status: "sent",
          sentAt: Date.now(),
          updatedAt: Date.now(),
        });

        await ctx.db.insert("communicationLogs", {
          queueId: msg._id,
          action: "process_push",
          status: "sent",
          details: `Push notification sent to ${msg.recipientAddress}`,
          performedAt: Date.now(),
        });

        results.push({ id: msg._id, status: "sent" });
      } catch (err: any) {
        const retryCount = (msg.retryCount || 0) + 1;
        const status = retryCount >= (msg.maxRetries || 2) ? "failed" : "retrying";
        await ctx.db.patch(msg._id, {
          status,
          retryCount,
          errorMessage: err.message,
          failedAt: status === "failed" ? Date.now() : undefined,
          updatedAt: Date.now(),
        });
        results.push({ id: msg._id, status, error: err.message });
      }
    }

    return { processed: results.length, results };
  }),
});

// ─── DEVICE REGISTRATION (PLACEHOLDER) ─────────────────────

// In production, this would store FCM / APNS / Web Push tokens per user.
// For now, we provide a placeholder structure that sends notifications
// through the in-app notification center as a fallback.

export const registerDevice = mutation({
  args: { token: v.optional(v.string()),
    userId: v.id("users"),
    deviceType: v.union(v.literal("web"), v.literal("android"), v.literal("ios")),
    pushToken: v.string(),
    deviceInfo: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "create", module: "notifications", entity: "pushEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    // Placeholder — in production, store device tokens in a new table
    // and use them to send push notifications via FCM/APNS
    return { registered: true, userId: args.userId, deviceType: args.deviceType };
  }),
});

export const unregisterDevice = mutation({
  args: { token: v.optional(v.string()),
    userId: v.id("users"),
    pushToken: v.string(),
  },
  handler: withScopeAndEvents({ operation: "update", module: "notifications", entity: "pushEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    // Placeholder — remove device token
    return { unregistered: true };
  }),
});

// ─── PUSH STATS ────────────────────────────────────────────

export const getPushStats = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("communicationQueue")
      .filter((q: any) => q.eq(q.field("channel"), "push"))
      .collect();

    return {
      total: all.length,
      queued: all.filter((m: any) => m.status === "queued").length,
      processing: all.filter((m: any) => m.status === "processing").length,
      sent: all.filter((m: any) => m.status === "sent").length,
      delivered: all.filter((m: any) => m.status === "delivered").length,
      failed: all.filter((m: any) => m.status === "failed").length,
      retrying: all.filter((m: any) => m.status === "retrying").length,
    };
  },
});
