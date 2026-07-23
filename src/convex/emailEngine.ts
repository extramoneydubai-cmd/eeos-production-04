import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── HELPERS ───────────────────────────────────────────────

function wrapHtmlBody(body: string, subject?: string): string {
  const escapedBody = body.replace(/\n/g, "<br/>");
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject || "EEOS Notification"}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: #1a1a2e; color: #fff; padding: 24px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 20px; }
    .body { padding: 24px; color: #333; line-height: 1.6; }
    .footer { padding: 16px 24px; background: #f9f9f9; border-top: 1px solid #eee; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${subject || "EEOS Notification"}</h1>
    </div>
    <div class="body">${escapedBody}</div>
    <div class="footer">
      <p>This is an automated message from EEOS. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── EMAIL QUEUE PROCESSING ────────────────────────────────

export const processEmailQueue = mutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 10;

    // Get queued emails that need processing
    const queued = await ctx.db.query("communicationQueue")
      .withIndex("status", (q: any) => q.eq("status", "queued"))
      .filter((q: any) => q.eq(q.field("channel"), "email"))
      .collect();

    // Also get scheduled emails whose time has come
    const now = Date.now();
    const scheduled = await ctx.db.query("communicationQueue")
      .withIndex("scheduledAt", (q: any) => q.lte("scheduledAt", now))
      .filter((q: any) => q.and(
        q.eq(q.field("channel"), "email"),
        q.eq(q.field("status"), "queued"),
        q.neq(q.field("scheduledAt"), undefined),
      ))
      .collect();

    const batch = [...queued, ...scheduled].slice(0, batchSize);
    const results: any[] = [];

    for (const msg of batch) {
      try {
        // Mark as processing
        await ctx.db.patch(msg._id, { status: "processing" });

        // Wrap body in HTML
        const htmlBody = wrapHtmlBody(msg.body, msg.subject);

        // Log the email details (in production, this would call SendGrid/SES/etc.)
        await ctx.db.insert("deliveryStatus", {
          queueId: msg._id,
          provider: "internal",
          providerMessageId: `email-${msg._id}-${Date.now()}`,
          status: "sent",
          timestamp: Date.now(),
        });

        // Mark as sent
        await ctx.db.patch(msg._id, {
          status: "sent",
          sentAt: Date.now(),
          updatedAt: Date.now(),
        });

        await ctx.db.insert("communicationLogs", {
          queueId: msg._id,
          action: "process_batch",
          status: "sent",
          details: `Email processed: to=${msg.recipientAddress}, subject=${msg.subject}`,
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
  },
});

// ─── EMAIL PROVIDER STATUS ─────────────────────────────────

export const getEmailStats = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("communicationQueue")
      .filter((q: any) => q.eq(q.field("channel"), "email"))
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
  args: {
    queueId: v.id("communicationQueue"),
    status: v.union(v.literal("delivered"), v.literal("read"), v.literal("failed"), v.literal("bounced"), v.literal("spam")),
    providerMessageId: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get(args.queueId);
    if (!msg) throw new Error("Message not found");

    const statusMap: Record<string, string> = {
      delivered: "delivered",
      read: "read",
      failed: "failed",
      bounced: "failed",
      spam: "failed",
    };

    const patch: Record<string, any> = { status: statusMap[args.status] || args.status };
    if (args.status === "delivered") patch.deliveredAt = Date.now();
    if (args.status === "read") patch.readAt = Date.now();
    if (args.status === "failed" || args.status === "bounced") patch.failedAt = Date.now();
    patch.updatedAt = Date.now();

    await ctx.db.patch(args.queueId, patch);

    await ctx.db.insert("deliveryStatus", {
      queueId: args.queueId,
      provider: "internal",
      providerMessageId: args.providerMessageId,
      status: args.status,
      timestamp: Date.now(),
      errorMessage: args.errorMessage,
    });

    return args.queueId;
  },
});
