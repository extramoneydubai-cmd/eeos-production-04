import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ─── HELPERS ───────────────────────────────────────────────

function countSmsSegments(text: string): number {
  // GSM 03.38 encoding: 160 chars per segment, 153 for multi-part
  const gsmChars = text.length;
  if (gsmChars <= 160) return 1;
  return Math.ceil(gsmChars / 153);
}

// ─── SMS QUEUE PROCESSING ──────────────────────────────────

export const processSmsQueue = mutation({
  args: { token: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "communication", entity: "smsEngine" }, async (ctx, args) => {
    const batchSize = args.batchSize || 20;

    const queued = await ctx.db.query("communicationQueue")
      .withIndex("status", (q: any) => q.eq("status", "queued"))
      .filter((q: any) => q.eq(q.field("channel"), "sms"))
      .collect();

    const now = Date.now();
    const scheduled = await ctx.db.query("communicationQueue")
      .withIndex("scheduledAt", (q: any) => q.lte("scheduledAt", now))
      .filter((q: any) => q.and(
        q.eq(q.field("channel"), "sms"),
        q.eq(q.field("status"), "queued"),
        q.neq(q.field("scheduledAt"), undefined),
      ))
      .collect();

    const batch = [...queued, ...scheduled].slice(0, batchSize);
    const results: any[] = [];

    for (const msg of batch) {
      try {
        await ctx.db.patch(msg._id, { status: "processing" });

        const segments = countSmsSegments(msg.body);

        // In production, this would call Twilio / AWS SNS / etc.
        await ctx.db.insert("deliveryStatus", {
          queueId: msg._id,
          provider: "internal",
          providerMessageId: `sms-${msg._id}-${Date.now()}`,
          status: "sent",
          timestamp: Date.now(),
          details: `${segments} segment(s)`,
        });

        await ctx.db.patch(msg._id, {
          status: "sent",
          sentAt: Date.now(),
          updatedAt: Date.now(),
        });

        await ctx.db.insert("communicationLogs", {
          queueId: msg._id,
          action: "process_sms",
          status: "sent",
          details: `SMS sent to ${msg.recipientAddress} (${segments} segment(s))`,
          performedAt: Date.now(),
        });

        results.push({ id: msg._id, status: "sent", segments });
      } catch (err: any) {
        const retryCount = (msg.retryCount || 0) + 1;
        const status = retryCount >= msg.maxRetries ? "failed" : "retrying";
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

// ─── SMS STATS ─────────────────────────────────────────────

export const getSmsStats = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("communicationQueue")
      .filter((q: any) => q.eq(q.field("channel"), "sms"))
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

// ─── PROVIDER CALLBACK (WEBHOOK RECEIVER PLACEHOLDER) ──────

export const handleProviderCallback = mutation({
  args: { token: v.optional(v.string()),
    queueId: v.id("communicationQueue"),
    status: v.union(v.literal("delivered"), v.literal("failed")),
    providerMessageId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "communication", entity: "smsEngine" }, async (ctx, args) => {
    const msg = await ctx.db.get(args.queueId);
    if (!msg) throw new Error("Message not found");

    const patch: Record<string, any> = { status: args.status };
    if (args.status === "delivered") patch.deliveredAt = Date.now();
    if (args.status === "failed") patch.failedAt = Date.now();
    patch.updatedAt = Date.now();

    await ctx.db.patch(args.queueId, patch);

    await ctx.db.insert("deliveryStatus", {
      queueId: args.queueId,
      provider: "sms_provider",
      providerMessageId: args.providerMessageId,
      status: args.status,
      timestamp: Date.now(),
      errorMessage: args.errorMessage,
    });

    return args.queueId;
  }),
});
