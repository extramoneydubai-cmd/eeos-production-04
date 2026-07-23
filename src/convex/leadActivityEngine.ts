import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { logActivity, createNotification } from "./crmHelpers";

/* ────────────
   TIMELINE EVENT TYPES
   Every operation creates an immutable timeline entry
   ──────────── */

const EVENT_TYPES = [
  "LeadCreated", "LeadAssigned", "LeadUpdated", "StageChanged",
  "StatusChanged", "HealthCalculated", "FollowUpScheduled",
  "FollowUpCompleted", "CallLogged", "WhatsAppSent", "EmailSent",
  "SMSSent", "MeetingScheduled", "MeetingCompleted", "TaskCreated",
  "TaskCompleted", "NoteAdded", "AttachmentUploaded", "TrialStarted",
  "TrialExtended", "TrialCompleted", "Converted", "Lost", "Reopened",
  "Archived", "Merged", "PaymentReceived",
] as const;

/* ────────────
   INTERNAL: Create Timeline Event
   Every mutation in this file MUST call this
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
   PUBLIC: Create Timeline Event
   ──────────── */

export const addTimelineEvent = mutation({
  args: {
    leadId: v.id("leadMaster"),
    eventType: v.union(...EVENT_TYPES.map((t) => v.literal(t))),
    title: v.string(),
    description: v.optional(v.string()),
    metadata: v.optional(v.string()),
    performedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return createTimelineEvent(ctx, args);
  },
});

/* ────────────
   NOTES
   ──────────── */

export const getNotes = query({
  args: {
    leadId: v.id("leadMaster"),
    includePinned: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("leadNotes")
      .withIndex("leadId_createdAt", (q) => q.eq("leadId", args.leadId))
      .order("desc")
      .collect();

    if (args.includePinned) {
      const pinned = notes.filter((n) => (n as any).pinned);
      const unpinned = notes.filter((n) => !(n as any).pinned);
      return [...pinned, ...unpinned];
    }
    return notes;
  },
});

export const addNote = mutation({
  args: {
    leadId: v.id("leadMaster"),
    content: v.string(),
    mentions: v.optional(v.array(v.id("users"))),
    tags: v.optional(v.array(v.string())),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const noteId = await ctx.db.insert("leadNotes", {
      leadId: args.leadId,
      content: args.content,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    // Timeline event
    await createTimelineEvent(ctx, {
      leadId: args.leadId,
      eventType: "NoteAdded",
      title: "Note added",
      description: args.content.substring(0, 200),
      metadata: JSON.stringify({ noteId, mentions: args.mentions, tags: args.tags }),
      performedBy: args.createdBy,
    });

    // Also log to legacy activity
    await logActivity(ctx, args.leadId, "note_added", `added a note`, args.createdBy);

    return noteId;
  },
});

export const pinNote = mutation({
  args: {
    noteId: v.id("leadNotes"),
    pinned: v.boolean(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (!note) throw new Error("Note not found");
    await ctx.db.patch(args.noteId, { pinned: args.pinned, updatedAt: Date.now() } as any);
  },
});

export const deleteNote = mutation({
  args: {
    noteId: v.id("leadNotes"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (!note) throw new Error("Note not found");
    await ctx.db.delete(args.noteId);
  },
});

/* ────────────
   TASKS
   ──────────── */

export const getTasks = query({
  args: {
    leadId: v.id("leadMaster"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("leadTasks")
      .withIndex("leadId", (q) => q.eq("leadId", args.leadId));

    if (args.status) {
      q = q.filter((r) => r.eq(r.field("status"), args.status!));
    }

    return q.collect();
  },
});

export const createTask = mutation({
  args: {
    leadId: v.id("leadMaster"),
    title: v.string(),
    description: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
    priority: v.optional(v.union(
      v.literal("low"), v.literal("medium"),
      v.literal("high"), v.literal("critical"),
    )),
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const taskId = await ctx.db.insert("leadTasks", {
      leadId: args.leadId,
      title: args.title,
      description: args.description,
      ownerId: args.ownerId,
      assignedTo: args.assignedTo,
      dueDate: args.dueDate,
      status: "pending",
      priority: args.priority || "medium",
      createdAt: now,
      updatedAt: now,
    });

    // Timeline event
    await createTimelineEvent(ctx, {
      leadId: args.leadId,
      eventType: "TaskCreated",
      title: `Task created: ${args.title}`,
      description: args.description,
      metadata: JSON.stringify({ taskId, assignedTo: args.assignedTo, priority: args.priority }),
      performedBy: args.ownerId,
    });

    await logActivity(ctx, args.leadId, "task_created", `task created: ${args.title}`, args.ownerId);

    return taskId;
  },
});

export const completeTask = mutation({
  args: {
    taskId: v.id("leadTasks"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    await ctx.db.patch(args.taskId, {
      status: "completed",
      updatedAt: Date.now(),
    });

    // Timeline event
    await createTimelineEvent(ctx, {
      leadId: task.leadId,
      eventType: "TaskCompleted",
      title: `Task completed: ${task.title}`,
      performedBy: args.userId,
    });

    await logActivity(ctx, task.leadId, "task_completed", `completed task: ${task.title}`, args.userId);
  },
});

/* ────────────
   ATTACHMENTS
   ──────────── */

export const getAttachments = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("leadAttachments")
      .withIndex("leadId", (q) => q.eq("leadId", args.leadId))
      .order("desc")
      .collect();
  },
});

export const uploadAttachment = mutation({
  args: {
    leadId: v.id("leadMaster"),
    fileName: v.string(),
    fileUrl: v.string(),
    fileSize: v.optional(v.number()),
    uploadedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const attId = await ctx.db.insert("leadAttachments", {
      leadId: args.leadId,
      fileName: args.fileName,
      fileUrl: args.fileUrl,
      fileSize: args.fileSize,
      uploadedBy: args.uploadedBy,
      createdAt: now,
    });

    // Timeline event
    await createTimelineEvent(ctx, {
      leadId: args.leadId,
      eventType: "AttachmentUploaded",
      title: `File uploaded: ${args.fileName}`,
      metadata: JSON.stringify({ attachmentId: attId, fileSize: args.fileSize }),
      performedBy: args.uploadedBy,
    });

    // Legacy activity
    await logActivity(ctx, args.leadId, "document_added", `uploaded document: ${args.fileName}`, args.uploadedBy);

    return attId;
  },
});

export const deleteAttachment = mutation({
  args: {
    attachmentId: v.id("leadAttachments"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const att = await ctx.db.get(args.attachmentId);
    if (!att) throw new Error("Attachment not found");
    await ctx.db.delete(args.attachmentId);
  },
});

/* ────────────
   TIMELINE QUERIES
   ──────────── */

export const getTimeline = query({
  args: {
    leadId: v.id("leadMaster"),
    eventTypes: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 25, 100);
    let events = await ctx.db
      .query("leadTimeline")
      .withIndex("leadId_performedAt", (q) => q.eq("leadId", args.leadId))
      .order("desc")
      .take(args.cursor ? limit + 1 : limit);

    // Cursor-based pagination
    let nextCursor: number | null = null;
    if (args.cursor) {
      events = events.filter((e) => e.performedAt < args.cursor!);
      if (events.length > limit) {
        events = events.slice(0, limit);
        nextCursor = events[events.length - 1]?.performedAt || null;
      }
    }

    // Filter by event types
    if (args.eventTypes && args.eventTypes.length > 0) {
      events = events.filter((e) => args.eventTypes!.includes(e.eventType));
    }

    return { events, nextCursor };
  },
});

/* ────────────
   BATCH QUERIES (for Lead Database)
   ──────────── */

export const getBatchActivityIndicators = query({
  args: {
    leadIds: v.array(v.id("leadMaster")),
  },
  handler: async (ctx, args) => {
    if (args.leadIds.length === 0) return {};

    const result: Record<string, {
      taskCount: number;
      lastActivityAt: number | null;
      lastActivityTitle: string | null;
      meetingScheduled: boolean;
      communicationCount: number;
    }> = {};

    // Initialize all leads
    for (const leadId of args.leadIds) {
      result[leadId] = {
        taskCount: 0,
        lastActivityAt: null,
        lastActivityTitle: null,
        meetingScheduled: false,
        communicationCount: 0,
      };
    }

    // Batch: get task counts per lead
    const allTasks = await ctx.db.query("leadTasks").collect();
    for (const task of allTasks) {
      if (result[task.leadId]) {
        if (task.status !== "completed") {
          result[task.leadId].taskCount++;
        }
      }
    }

    // Batch: get last timeline event per lead
    const allTimeline = await ctx.db.query("leadTimeline").collect();
    for (const event of allTimeline) {
      if (result[event.leadId]) {
        const existing = result[event.leadId];
        if (!existing.lastActivityAt || event.performedAt > existing.lastActivityAt) {
          existing.lastActivityAt = event.performedAt;
          existing.lastActivityTitle = event.title;
        }
      }
    }

    // Batch: get meetings per lead
    const allMeetings = await ctx.db.query("leadMeetings").collect();
    for (const meeting of allMeetings) {
      if (result[meeting.leadId] && meeting.status === "scheduled") {
        result[meeting.leadId].meetingScheduled = true;
      }
    }

    // Batch: get communication count per lead
    const allComms = await ctx.db.query("leadCommunications").collect();
    for (const comm of allComms) {
      if (result[comm.leadId]) {
        result[comm.leadId].communicationCount++;
      }
    }

    return result;
  },
});

export const getBatchTaskCounts = query({
  args: {
    leadIds: v.array(v.id("leadMaster")),
  },
  handler: async (ctx, args) => {
    if (args.leadIds.length === 0) return {};

    const result: Record<string, number> = {};
    for (const id of args.leadIds) result[id] = 0;

    const allTasks = await ctx.db.query("leadTasks").collect();
    for (const task of allTasks) {
      if (result[task.leadId] !== undefined && task.status !== "completed") {
        result[task.leadId]++;
      }
    }

    return result;
  },
});
