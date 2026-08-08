import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { logActivity, createNotification } from "./crmHelpers";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ============================
// CALL ACTIVITY LOGGING
// ============================

export const logCallActivity = mutation({
  args: { token: v.optional(v.string()),
    leadId: v.id("leadMaster"), callType: v.string(), outcome: v.string(), callDate: v.number(),
    durationMinutes: v.optional(v.number()), durationSeconds: v.optional(v.number()),
    notes: v.optional(v.string()), followupDate: v.optional(v.number()),
    createFollowupTask: v.boolean(), userId: v.id("users"),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmCalls" }, async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");
    const outcomeLabels: Record<string, string> = {
      connected: "Connected", no_answer: "No Answer", busy: "Busy",
      wrong_number: "Wrong Number", callback_needed: "Callback Needed", converted: "Converted",
    };
    const label = outcomeLabels[args.outcome] || args.outcome;
    const now = Date.now();
    await ctx.db.insert("callLogs", {
      leadId: args.leadId, callType: args.callType, outcome: args.outcome, callDate: args.callDate,
      durationMinutes: args.durationMinutes, durationSeconds: args.durationSeconds,
      notes: args.notes, followupDate: args.followupDate, createFollowupTask: args.createFollowupTask,
      userId: args.userId, createdAt: now,
    });
    const durationStr = args.durationMinutes || args.durationSeconds ? ` (${args.durationMinutes || 0}m ${args.durationSeconds || 0}s)` : "";
    const desc = `${args.callType} call to ${lead.firstName} ${lead.lastName} — ${label}${durationStr}${args.notes ? `. ${args.notes}` : ""}`;
    await logActivity(ctx, args.leadId, "call_made", desc, args.userId);
    if (args.createFollowupTask && args.followupDate) {
      await ctx.db.insert("leadTasks", { leadId: args.leadId, title: `Follow-up — ${lead.firstName} ${lead.lastName}`, ownerId: args.userId, assignedTo: args.userId, dueDate: args.followupDate, status: "pending", priority: "high", createdAt: now, updatedAt: now });
      await logActivity(ctx, args.leadId, "task_created", `Follow-up task created for ${lead.firstName} ${lead.lastName}`, args.userId);
    }
    if (args.outcome === "callback_needed" && lead.ownerId) {
      await createNotification(ctx, lead.ownerId, "followup", "Callback Needed", `Callback needed for ${lead.firstName} ${lead.lastName}${args.notes ? ` — ${args.notes}` : ""}`, args.leadId, "lead");
    }
  }),
});

export const getCallLogs = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => (await ctx.db.query("callLogs").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect()).sort((a, b) => b.createdAt - a.createdAt),
});
