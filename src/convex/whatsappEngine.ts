import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ─── WHATSAPP QUEUE PROCESSING ─────────────────────────────

export const processWhatsAppQueue = mutation({
  args: { token: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "communication", entity: "whatsappEngine" }, async (ctx, args) => {
    const batchSize = args.batchSize || 10;

    const queued = await ctx.db.query("communicationQueue")
      .withIndex("status", (q: any) => q.eq("status", "queued"))
      .filter((q: any) => q.eq(q.field("channel"), "whatsapp"))
      .collect();

    const now = Date.now();
    const scheduled = await ctx.db.query("communicationQueue")
      .withIndex("scheduledAt", (q: any) => q.lte("scheduledAt", now))
      .filter((q: any) => q.and(
        q.eq(q.field("channel"), "whatsapp"),
        q.eq(q.field("status"), "queued"),
        q.neq(q.field("scheduledAt"), undefined),
      ))
      .collect();

    const batch = [...queued, ...scheduled].slice(0, batchSize);
    const results: any[] = [];

    for (const msg of batch) {
      try {
        await ctx.db.patch(msg._id, { status: "processing" });

        // Check if this is a template message (for WhatsApp Business API)
        const isTemplate = !!msg.templateId;

        // In production, this would call WhatsApp Business API / Twilio / etc.
        await ctx.db.insert("deliveryStatus", {
          queueId: msg._id,
          provider: "internal",
          providerMessageId: `wa-${msg._id}-${Date.now()}`,
          status: "sent",
          timestamp: Date.now(),
          details: isTemplate ? "Template message sent" : "Plain message sent",
        });

        await ctx.db.patch(msg._id, {
          status: "sent",
          sentAt: Date.now(),
          updatedAt: Date.now(),
        });

        await ctx.db.insert("communicationLogs", {
          queueId: msg._id,
          action: "process_whatsapp",
          status: "sent",
          details: `WhatsApp sent to ${msg.recipientAddress}${isTemplate ? " (template)" : ""}`,
          performedAt: Date.now(),
        });

        results.push({ id: msg._id, status: "sent" });
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

// ─── WHATSAPP MESSAGE VALIDATION ───────────────────────────

export const validateWhatsAppNumber = query({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    // Basic validation — in production, would check via WhatsApp API
    const cleaned = args.phoneNumber.replace(/[\s\-\(\)]/g, "");
    const isValid = cleaned.length >= 10 && cleaned.length <= 15 && /^\d+$/.test(cleaned);
    return {
      isValid,
      formattedNumber: cleaned,
      message: isValid ? "Valid WhatsApp number" : "Invalid number format (must be 10-15 digits)",
    };
  },
});

// ─── WHATSAPP STATS ────────────────────────────────────────

export const getWhatsAppStats = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("communicationQueue")
      .filter((q: any) => q.eq(q.field("channel"), "whatsapp"))
      .collect();

    return {
      total: all.length,
      queued: all.filter((m: any) => m.status === "queued").length,
      processing: all.filter((m: any) => m.status === "processing").length,
      sent: all.filter((m: any) => m.status === "sent").length,
      delivered: all.filter((m: any) => m.status === "delivered").length,
      read: all.filter((m: any) => m.status === "read").length,
      failed: all.filter((m: any) => m.status === "failed").length,
      retrying: all.filter((m: any) => m.status === "retrying").length,
    };
  },
});

// ─── PROVIDER CALLBACK (WEBHOOK RECEIVER PLACEHOLDER) ──────

export const handleProviderCallback = mutation({
  args: { token: v.optional(v.string()),
    queueId: v.id("communicationQueue"),
    status: v.union(v.literal("delivered"), v.literal("read"), v.literal("failed")),
    providerMessageId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "communication", entity: "whatsappEngine" }, async (ctx, args) => {
    const msg = await ctx.db.get(args.queueId);
    if (!msg) throw new Error("Message not found");

    const patch: Record<string, any> = { status: args.status };
    if (args.status === "delivered") patch.deliveredAt = Date.now();
    if (args.status === "read") patch.readAt = Date.now();
    if (args.status === "failed") patch.failedAt = Date.now();
    patch.updatedAt = Date.now();

    await ctx.db.patch(args.queueId, patch);

    await ctx.db.insert("deliveryStatus", {
      queueId: args.queueId,
      provider: "whatsapp_provider",
      providerMessageId: args.providerMessageId,
      status: args.status,
      timestamp: Date.now(),
      errorMessage: args.errorMessage,
    });

    return args.queueId;
  }),
});
