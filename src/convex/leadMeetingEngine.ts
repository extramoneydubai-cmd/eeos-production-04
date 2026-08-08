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
   SCHEDULE MEETING
   ──────────── */

export const scheduleMeeting = mutation({
  args: {
    token: v.optional(v.string()),
    leadId: v.id("leadMaster"),
    meetingType: v.string(),
    meetingDate: v.number(),
    duration: v.optional(v.number()),
    location: v.optional(v.string()),
    meetingLink: v.optional(v.string()),
    attendees: v.optional(v.array(v.id("users"))),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: withScopeAndEvents(
    {
      operation: "create",
      module: "crm",
      entity: "leadMeeting",
      eventType: "crm.lead.meeting_scheduled",
      title: "Meeting scheduled",
      getUserId: (args: any) => args.createdBy,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: (args: any) => (args as any).branchInterestId || undefined,
      notifyViaMatrix: false,
    },
    async (ctx: any, args: any) => {
    const now = Date.now();

    const meetingId = await ctx.db.insert("leadMeetings", {
      leadId: args.leadId,
      meetingType: args.meetingType,
      meetingDate: args.meetingDate,
      duration: args.duration,
      location: args.location,
      meetingLink: args.meetingLink,
      attendees: args.attendees,
      status: "scheduled",
      notes: args.notes,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    // Timeline event
    await createTimelineEvent(ctx, {
      leadId: args.leadId,
      eventType: "MeetingScheduled",
      title: `${args.meetingType} meeting scheduled`,
      description: args.meetingLink || args.location || undefined,
      metadata: JSON.stringify({
        meetingId,
        meetingDate: args.meetingDate,
        type: args.meetingType,
        attendees: args.attendees,
      }),
      performedBy: args.createdBy,
    });

    await logActivity(ctx, args.leadId, "meeting_scheduled", `${args.meetingType} meeting scheduled`, args.createdBy);

    // Notify attendees
    if (args.attendees && args.attendees.length > 0) {
      const lead = await ctx.db.get(args.leadId);
      const leadName = lead ? `${lead.firstName} ${lead.lastName}` : "Lead";
      for (const attendeeId of args.attendees) {
        if (attendeeId !== args.createdBy) {
          await createNotification(
            ctx, attendeeId, "meeting", "Meeting Scheduled",
            `${args.meetingType} meeting for ${leadName} on ${new Date(args.meetingDate).toLocaleDateString()}`,
            args.leadId, "lead",
          );
        }
      }
    }

    return meetingId;
    }
  ),
});

/* ────────────
   COMPLETE MEETING
   ──────────── */

export const completeMeeting = mutation({
  args: {
    token: v.optional(v.string()),
    meetingId: v.id("leadMeetings"),
    userId: v.id("users"),
    outcomeNotes: v.optional(v.string()),
    leadId: v.id("leadMaster"),
  },
  handler: withScopeAndEvents(
    {
      operation: "update",
      module: "crm",
      entity: "leadMeeting",
      eventType: "crm.lead.meeting_completed",
      title: "Meeting completed",
      getUserId: (args: any) => args.userId,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: (args: any) => (args as any).branchInterestId || undefined,
      notifyViaMatrix: false,
    },
    async (ctx: any, args: any) => {
    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) throw new Error("Meeting not found");

    const now = Date.now();
    await ctx.db.patch(args.meetingId, {
      status: "completed",
      notes: args.outcomeNotes,
      updatedAt: now,
    });

    // Timeline event
    await createTimelineEvent(ctx, {
      leadId: meeting.leadId,
      eventType: "MeetingCompleted",
      title: `${meeting.meetingType} meeting completed`,
      description: args.outcomeNotes,
      metadata: JSON.stringify({ meetingId: args.meetingId }),
      performedBy: args.userId,
    });

    await logActivity(ctx, meeting.leadId, "meeting_completed", `${meeting.meetingType} meeting completed`, args.userId);
    return args.meetingId;
    }
  ),
});

/* ────────────
   CANCEL MEETING
   ──────────── */

export const cancelMeeting = mutation({
  args: {
    token: v.optional(v.string()),
    meetingId: v.id("leadMeetings"),
    userId: v.id("users"),
    reason: v.optional(v.string()),
    leadId: v.id("leadMaster"),
  },
  handler: withScopeAndEvents(
    {
      operation: "update",
      module: "crm",
      entity: "leadMeeting",
      eventType: "crm.lead.meeting_cancelled",
      title: "Meeting cancelled",
      getUserId: (args: any) => args.userId,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: (args: any) => (args as any).branchInterestId || undefined,
      notifyViaMatrix: false,
    },
    async (ctx: any, args: any) => {
    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) throw new Error("Meeting not found");

    const now = Date.now();
    await ctx.db.patch(args.meetingId, {
      status: "cancelled",
      notes: args.reason,
      updatedAt: now,
    });

    await createTimelineEvent(ctx, {
      leadId: meeting.leadId,
      eventType: "MeetingCompleted", // Using MeetingCompleted as cancelled variant
      title: `${meeting.meetingType} meeting cancelled`,
      description: args.reason,
      metadata: JSON.stringify({ meetingId: args.meetingId, cancelled: true }),
      performedBy: args.userId,
    });

    await logActivity(ctx, meeting.leadId, "meeting_cancelled", `${meeting.meetingType} meeting cancelled`, args.userId);
    return args.meetingId;
    }
  ),
});

/* ────────────
   RESCHEDULE MEETING
   ──────────── */

export const rescheduleMeeting = mutation({
  args: {
    token: v.optional(v.string()),
    meetingId: v.id("leadMeetings"),
    newDate: v.number(),
    userId: v.id("users"),
    reason: v.optional(v.string()),
    leadId: v.id("leadMaster"),
  },
  handler: withScopeAndEvents(
    {
      operation: "update",
      module: "crm",
      entity: "leadMeeting",
      eventType: "crm.lead.meeting_rescheduled",
      title: "Meeting rescheduled",
      getUserId: (args: any) => args.userId,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: (args: any) => (args as any).branchInterestId || undefined,
      notifyViaMatrix: false,
    },
    async (ctx: any, args: any) => {
    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) throw new Error("Meeting not found");

    const now = Date.now();
    await ctx.db.patch(args.meetingId, {
      meetingDate: args.newDate,
      status: "rescheduled",
      updatedAt: now,
    });

    await createTimelineEvent(ctx, {
      leadId: meeting.leadId,
      eventType: "MeetingScheduled",
      title: `${meeting.meetingType} meeting rescheduled`,
      description: `Rescheduled to ${new Date(args.newDate).toLocaleDateString()}${args.reason ? `: ${args.reason}` : ""}`,
      metadata: JSON.stringify({ meetingId: args.meetingId, newDate: args.newDate, rescheduled: true }),
      performedBy: args.userId,
    });

    await logActivity(ctx, meeting.leadId, "meeting_rescheduled", `${meeting.meetingType} meeting rescheduled`, args.userId);
    return args.meetingId;
    }
  ),
});

/* ────────────
   QUERIES
   ──────────── */

export const getMeetings = query({
  args: {
    leadId: v.id("leadMaster"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("leadMeetings")
      .withIndex("leadId_meetingDate", (q) => q.eq("leadId", args.leadId));

    if (args.status) {
      q = q.filter((r) => r.eq(r.field("status"), args.status!));
    }

    return q.order("desc").take(50);
  },
});

export const getUpcomingMeetings = query({
  args: {
    leadId: v.id("leadMaster"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const meetings = await ctx.db
      .query("leadMeetings")
      .withIndex("leadId_meetingDate", (q) => q.eq("leadId", args.leadId))
      .filter((q) => q.and(
        q.eq(q.field("status"), "scheduled"),
        q.gte(q.field("meetingDate"), now),
      ))
      .take(args.limit || 10);

    return meetings;
  },
});
