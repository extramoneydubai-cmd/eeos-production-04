import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { logActivity, createNotification } from "./crmHelpers";
import { withScopeAndEvents } from "./withScopeAndEvents";

/* ────────────
   INTERNAL: Create Timeline Event
   ──────────── */

async function createTimelineEvent(
  ctx: any,
  args: {
    leadId: Id<"leadMaster">;
    eventType: string;
    title: string;
    description?: string;
    metadata?: string;
    performedBy?: Id<"users">;
  },
) {
  const now = Date.now();
  return ctx.db.insert("leadTimeline", {
    leadId: args.leadId,
    eventType: args.eventType,
    title: args.title,
    description: args.description,
    metadata: args.metadata,
    performedBy: args.performedBy,
    performedAt: now,
    createdAt: now,
  });
}

/* ────────────
   CALL LOGGING
   ──────────── */

export const logCall = mutation({
  args: {
    leadId: v.id("leadMaster"),
    callType: v.union(v.literal("incoming"), v.literal("outgoing"), v.literal("missed")),
    outcome: v.optional(v.string()),
    callDate: v.number(),
    durationMinutes: v.optional(v.number()),
    durationSeconds: v.optional(v.number()),
    notes: v.optional(v.string()),
    followupDate: v.optional(v.number()),
    createFollowupTask: v.optional(v.boolean()),
    userId: v.id("users"),
  },
  handler: withScopeAndEvents(
    {
      operation: "create",
      module: "crm",
      entity: "leadCommunication",
      eventType: "crm.lead.call_logged",
      title: "Lead call logged",
      getUserId: (args: any) => args.userId,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: (args: any) => (args as any).branchInterestId || undefined,
      notifyViaMatrix: false,
    },
    async (ctx: any, args: any) => {
    const now = Date.now();

    // Save to leadCommunications
    const commId = await ctx.db.insert("leadCommunications", {
      leadId: args.leadId,
      type: "Call",
      direction: args.callType === "incoming" ? "Inbound" : "Outbound",
      subject: `Call: ${args.callType}`,
      message: args.notes,
      duration: (args.durationMinutes || 0) * 60 + (args.durationSeconds || 0),
      status: args.outcome || "completed",
      metadata: JSON.stringify({
        callType: args.callType,
        outcome: args.outcome,
        createFollowupTask: args.createFollowupTask,
      }),
      createdBy: args.userId,
      createdAt: now,
    });

    // Timeline event
    await createTimelineEvent(ctx, {
      leadId: args.leadId,
      eventType: "CallLogged",
      title: `${args.callType.charAt(0).toUpperCase() + args.callType.slice(1)} call logged`,
      description: args.outcome ? `Outcome: ${args.outcome}` : undefined,
      metadata: JSON.stringify({ commId, duration: args.durationMinutes, outcome: args.outcome }),
      performedBy: args.userId,
    });

    // Legacy activity
    await logActivity(ctx, args.leadId, "call_made", args.outcome || "call logged", args.userId);

    // Create follow-up task if requested
    if (args.followupDate && args.createFollowupTask) {
      await ctx.db.insert("leadTasks", {
        leadId: args.leadId,
        title: `Follow-up: ${args.outcome || "Call"}`,
        ownerId: args.userId,
        assignedTo: args.userId,
        dueDate: args.followupDate,
        status: "pending",
        priority: "medium",
        createdAt: now,
        updatedAt: now,
      });

      await createTimelineEvent(ctx, {
        leadId: args.leadId,
        eventType: "FollowUpScheduled",
        title: "Follow-up scheduled from call",
        metadata: JSON.stringify({ dueDate: args.followupDate }),
        performedBy: args.userId,
      });

      await logActivity(ctx, args.leadId, "followup_scheduled", `followup scheduled after call`, args.userId);
    }

    return commId;
    }
  ),
});

/* ────────────
   WHATSAPP
   ──────────── */

export const sendWhatsApp = mutation({
  args: {
    leadId: v.id("leadMaster"),
    message: v.string(),
    template: v.optional(v.string()),
    sentBy: v.id("users"),
  },
  handler: withScopeAndEvents(
    {
      operation: "create",
      module: "crm",
      entity: "leadCommunication",
      eventType: "crm.lead.whatsapp_sent",
      title: "WhatsApp message sent",
      getUserId: (args: any) => args.sentBy,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: (args: any) => (args as any).branchInterestId || undefined,
      notifyViaMatrix: false,
    },
    async (ctx: any, args: any) => {
    const now = Date.now();
    const identifier = ""; // Will be resolved from lead in UI
    const url = `https://wa.me/?text=${encodeURIComponent(args.message)}`;

    // Save to leadCommunications
    const commId = await ctx.db.insert("leadCommunications", {
      leadId: args.leadId,
      type: "WhatsApp",
      direction: "Outbound",
      subject: args.template ? `Template: ${args.template}` : "WhatsApp Message",
      message: args.message,
      status: "sent",
      metadata: JSON.stringify({ template: args.template, whatsappUrl: url }),
      createdBy: args.sentBy,
      createdAt: now,
    });

    // Save to legacy table
    await ctx.db.insert("leadWhatsAppMessages", {
      leadId: args.leadId,
      message: args.message,
      whatsappUrl: url,
      sentBy: args.sentBy,
      status: "sent",
      template: (args.template as any) || undefined,
      createdAt: now,
    });

    // Timeline event
    await createTimelineEvent(ctx, {
      leadId: args.leadId,
      eventType: "WhatsAppSent",
      title: `WhatsApp message sent${args.template ? ` (${args.template})` : ""}`,
      description: args.message.substring(0, 200),
      metadata: JSON.stringify({ commId, template: args.template }),
      performedBy: args.sentBy,
    });

    await logActivity(ctx, args.leadId, "whatsapp_sent", `sent WhatsApp message`, args.sentBy);

    return commId;
    }
  ),
});

/* ────────────
   EMAIL
   ──────────── */

export const sendEmail = mutation({
  args: {
    leadId: v.id("leadMaster"),
    subject: v.string(),
    message: v.string(),
    sentBy: v.id("users"),
  },
  handler: withScopeAndEvents(
    {
      operation: "create",
      module: "crm",
      entity: "leadCommunication",
      eventType: "crm.lead.email_sent",
      title: "Email sent",
      getUserId: (args: any) => args.sentBy,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: (args: any) => (args as any).branchInterestId || undefined,
      notifyViaMatrix: false,
    },
    async (ctx: any, args: any) => {
    const now = Date.now();

    const commId = await ctx.db.insert("leadCommunications", {
      leadId: args.leadId,
      type: "Email",
      direction: "Outbound",
      subject: args.subject,
      message: args.message,
      status: "sent",
      createdBy: args.sentBy,
      createdAt: now,
    });

    await createTimelineEvent(ctx, {
      leadId: args.leadId,
      eventType: "EmailSent",
      title: `Email sent: ${args.subject}`,
      description: args.message.substring(0, 200),
      metadata: JSON.stringify({ commId }),
      performedBy: args.sentBy,
    });

    return commId;
    }
  ),
});

/* ────────────
   SMS
   ──────────── */

export const sendSMS = mutation({
  args: {
    leadId: v.id("leadMaster"),
    message: v.string(),
    sentBy: v.id("users"),
  },
  handler: withScopeAndEvents(
    {
      operation: "create",
      module: "crm",
      entity: "leadCommunication",
      eventType: "crm.lead.sms_sent",
      title: "SMS sent",
      getUserId: (args: any) => args.sentBy,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: (args: any) => (args as any).branchInterestId || undefined,
      notifyViaMatrix: false,
    },
    async (ctx: any, args: any) => {
    const now = Date.now();

    const commId = await ctx.db.insert("leadCommunications", {
      leadId: args.leadId,
      type: "SMS",
      direction: "Outbound",
      message: args.message,
      status: "sent",
      createdBy: args.sentBy,
      createdAt: now,
    });

    await createTimelineEvent(ctx, {
      leadId: args.leadId,
      eventType: "SMSSent",
      title: "SMS sent",
      description: args.message.substring(0, 200),
      metadata: JSON.stringify({ commId }),
      performedBy: args.sentBy,
    });

    return commId;
    }
  ),
});

/* ────────────
   MARK COMMUNICATION AS READ
   ──────────── */

export const markCommunicationRead = mutation({
  args: {
    commId: v.id("leadCommunications"),
    userId: v.id("users"),
    leadId: v.id("leadMaster"),
  },
  handler: withScopeAndEvents(
    {
      operation: "update",
      module: "crm",
      entity: "leadCommunication",
      eventType: "crm.lead.communication_read",
      title: "Communication marked read",
      getUserId: (args: any) => args.userId,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: (args: any) => (args as any).branchInterestId || undefined,
      notifyViaMatrix: false,
    },
    async (ctx: any, args: any) => {
    await ctx.db.patch(args.commId, { status: "read" } as any);
    return args.commId;
    }
  ),
});

/* ────────────
   QUERIES
   ──────────── */

export const getCommunications = query({
  args: {
    leadId: v.id("leadMaster"),
    type: v.optional(v.union(
      v.literal("Call"), v.literal("WhatsApp"),
      v.literal("Email"), v.literal("SMS"),
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 50, 100);
    let q = ctx.db
      .query("leadCommunications")
      .withIndex("leadId_type", (q) => q.eq("leadId", args.leadId));

    if (args.type) {
      q = q.filter((r) => r.eq(r.field("type"), args.type!));
    }

    return q.order("desc").take(limit);
  },
});

export const getCommunicationSummary = query({
  args: {
    leadId: v.id("leadMaster"),
  },
  handler: async (ctx, args) => {
    const allComms = await ctx.db
      .query("leadCommunications")
      .withIndex("leadId_type", (q) => q.eq("leadId", args.leadId))
      .collect();

    const calls = allComms.filter((c) => c.type === "Call");
    const whatsapp = allComms.filter((c) => c.type === "WhatsApp");
    const emails = allComms.filter((c) => c.type === "Email");
    const sms = allComms.filter((c) => c.type === "SMS");

    return {
      total: allComms.length,
      calls: calls.length,
      whatsapp: whatsapp.length,
      emails: emails.length,
      sms: sms.length,
      lastCall: calls.length > 0 ? calls.sort((a, b) => b.createdAt - a.createdAt)[0] : null,
      lastWhatsApp: whatsapp.length > 0 ? whatsapp.sort((a, b) => b.createdAt - a.createdAt)[0] : null,
    };
  },
});
