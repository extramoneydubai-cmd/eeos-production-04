import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ─── Enterprise Pipeline Config ─────────────────────────────────
// Every task mutation routes through withScopeAndEvents() so tasks
// emit audit, timeline, event-bus, notification-matrix, workflow,
// automation, search-index and dashboard-refresh signals.
//
// getUserId returns undefined intentionally (consistent with the
// adopted support/messenger/marketing/adminOps engines): task
// mutations carry no reliable performer id for scope enforcement
// today, so scope checks stay no-ops while the pipeline is fully
// wired. Each handler returns its entity id so the pipeline can
// attach timeline/event-bus records to the task.
const taskPipeline = {
  module: "tasks",
  getUserId: () => undefined,
  getEntityCompanyId: () => undefined,
  getEntityBranchId: () => undefined,
  triggerWorkflow: true,
  triggerAutomation: true,
  registerSearch: true,
  signalDashboard: true,
} as const;

// ============================
// TASKS
// ============================

export const listTasks = query({
  args: {
    status: v.optional(v.string()),
    departmentId: v.optional(v.id("departments")),
    teamId: v.optional(v.id("teams")),
    assignedTo: v.optional(v.id("users")),
    ownerId: v.optional(v.id("users")),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let tasks;
    if (args.status) {
      tasks = await ctx.db.query("tasks").withIndex("status", (q) => q.eq("status", args.status as any)).collect();
    } else {
      tasks = await ctx.db.query("tasks").collect();
    }

    if (args.departmentId) {
      tasks = tasks.filter((t) => t.departmentId === args.departmentId);
    }
    if (args.teamId) {
      tasks = tasks.filter((t) => t.teamId === args.teamId);
    }
    if (args.assignedTo) {
      tasks = tasks.filter((t) => t.assignedTo === args.assignedTo);
    }
    if (args.ownerId) {
      tasks = tasks.filter((t) => t.ownerId === args.ownerId);
    }
    if (args.entityType) {
      tasks = tasks.filter((t) => (t as any).entityType === args.entityType);
    }
    if (args.entityId) {
      tasks = tasks.filter((t) => (t as any).entityId === args.entityId);
    }

    return tasks.filter((t) => !t.isArchived).sort((a, b) => a.order - b.order);
  },
});

export const getTaskById = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  },
});

export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    priority: v.string(),
    ownerId: v.id("users"),
    assignedTo: v.optional(v.id("users")),
    departmentId: v.optional(v.id("departments")),
    teamId: v.optional(v.id("teams")),
    dueDate: v.optional(v.number()),
    approvalRequired: v.optional(v.boolean()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      ...taskPipeline,
      operation: "create",
      entity: "task",
      eventType: "tasks.task.created",
      title: "Task Created",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
      const now = Date.now();
      const existingTasks = await ctx.db.query("tasks").withIndex("status", (q: any) => q.eq("status", args.status as any)).collect();
      const maxOrder = existingTasks.reduce((max: number, t: any) => Math.max(max, t.order), -1);

      const taskId = await ctx.db.insert("tasks", {
        title: args.title,
        description: args.description,
        status: args.status as any,
        priority: args.priority as any,
        ownerId: args.ownerId,
        assignedTo: args.assignedTo,
        departmentId: args.departmentId,
        teamId: args.teamId,
        dueDate: args.dueDate,
        approvalRequired: args.approvalRequired,
        entityType: args.entityType,
        entityId: args.entityId,
        order: maxOrder + 1,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("taskParticipants", {
        taskId,
        userId: args.ownerId,
        role: "owner",
        createdAt: now,
      });

      if (args.assignedTo && args.assignedTo !== args.ownerId) {
        await ctx.db.insert("taskParticipants", {
          taskId,
          userId: args.assignedTo,
          role: "assignee",
          createdAt: now,
        });
      }

      return taskId;
    },
  ),
});

export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
    approvalRequired: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: withScopeAndEvents(
    {
      ...taskPipeline,
      operation: "update",
      entity: "task",
      eventType: "tasks.task.updated",
      title: "Task Updated",
      notifyViaMatrix: false,
    },
    async (ctx, args) => {
      const { taskId, ...fields } = args;
      const updates: Record<string, any> = { updatedAt: Date.now() };
      if (fields.title !== undefined) updates.title = fields.title;
      if (fields.description !== undefined) updates.description = fields.description;
      if (fields.status !== undefined) updates.status = fields.status;
      if (fields.priority !== undefined) updates.priority = fields.priority;
      if (fields.assignedTo !== undefined) updates.assignedTo = fields.assignedTo;
      if (fields.dueDate !== undefined) updates.dueDate = fields.dueDate;
      if (fields.approvalRequired !== undefined) updates.approvalRequired = fields.approvalRequired;
      if (fields.order !== undefined) updates.order = fields.order;
      await ctx.db.patch(taskId, updates);
      return taskId;
    },
  ),
});

export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.string(),
    order: v.optional(v.number()),
  },
  handler: withScopeAndEvents(
    {
      ...taskPipeline,
      operation: "update",
      entity: "task",
      eventType: "tasks.task.status_changed",
      title: "Task Status Changed",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
      const updates: Record<string, any> = { status: args.status as any, updatedAt: Date.now() };
      if (args.order !== undefined) updates.order = args.order;
      await ctx.db.patch(args.taskId, updates);
      return args.taskId;
    },
  ),
});

export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: withScopeAndEvents(
    {
      ...taskPipeline,
      operation: "delete",
      entity: "task",
      eventType: "tasks.task.deleted",
      title: "Task Deleted",
      notifyViaMatrix: false,
      registerSearch: false,
    },
    async (ctx, args) => {
      const participants = await ctx.db.query("taskParticipants").withIndex("taskId", (q: any) => q.eq("taskId", args.taskId)).collect();
      for (const p of participants) await ctx.db.delete(p._id);

      const checklistItems = await ctx.db.query("taskChecklistItems").withIndex("taskId", (q: any) => q.eq("taskId", args.taskId)).collect();
      for (const c of checklistItems) await ctx.db.delete(c._id);

      const comments = await ctx.db.query("taskComments").withIndex("taskId", (q: any) => q.eq("taskId", args.taskId)).collect();
      for (const c of comments) await ctx.db.delete(c._id);

      await ctx.db.delete(args.taskId);
      return args.taskId;
    },
  ),
});

// ============================
// TASK PARTICIPANTS
// ============================

export const getTaskParticipants = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.query("taskParticipants").withIndex("taskId", (q) => q.eq("taskId", args.taskId)).collect();
  },
});

export const addTaskParticipant = mutation({
  args: {
    taskId: v.id("tasks"),
    userId: v.id("users"),
    role: v.string(),
  },
  handler: withScopeAndEvents(
    {
      ...taskPipeline,
      operation: "update",
      entity: "task_participant",
      eventType: "tasks.task.participant_added",
      title: "Participant Added",
      notifyViaMatrix: true,
      registerSearch: false,
      signalDashboard: false,
    },
    async (ctx, args) => {
      await ctx.db.insert("taskParticipants", {
        taskId: args.taskId,
        userId: args.userId,
        role: args.role,
        createdAt: Date.now(),
      });
      return args.taskId;
    },
  ),
});

export const removeTaskParticipant = mutation({
  args: { participantId: v.id("taskParticipants") },
  handler: withScopeAndEvents(
    {
      ...taskPipeline,
      operation: "update",
      entity: "task_participant",
      eventType: "tasks.task.participant_removed",
      title: "Participant Removed",
      notifyViaMatrix: false,
      registerSearch: false,
      signalDashboard: false,
    },
    async (ctx, args) => {
      await ctx.db.delete(args.participantId);
      return args.participantId;
    },
  ),
});

// ============================
// CHECKLIST
// ============================

export const getTaskChecklist = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.query("taskChecklistItems").withIndex("taskId", (q) => q.eq("taskId", args.taskId)).collect();
  },
});

export const addChecklistItem = mutation({
  args: {
    taskId: v.id("tasks"),
    text: v.string(),
  },
  handler: withScopeAndEvents(
    {
      ...taskPipeline,
      operation: "create",
      entity: "task_checklist_item",
      eventType: "tasks.task.checklist_added",
      title: "Checklist Item Added",
      notifyViaMatrix: false,
      registerSearch: false,
      signalDashboard: false,
    },
    async (ctx, args) => {
      const existing = await ctx.db.query("taskChecklistItems").withIndex("taskId", (q: any) => q.eq("taskId", args.taskId)).collect();
      const maxOrder = existing.reduce((max: number, i: any) => Math.max(max, i.order), -1);
      await ctx.db.insert("taskChecklistItems", {
        taskId: args.taskId,
        text: args.text,
        completed: false,
        order: maxOrder + 1,
        createdAt: Date.now(),
      });
      return args.taskId;
    },
  ),
});

export const toggleChecklistItem = mutation({
  args: {
    itemId: v.id("taskChecklistItems"),
    completed: v.boolean(),
  },
  handler: withScopeAndEvents(
    {
      ...taskPipeline,
      operation: "update",
      entity: "task_checklist_item",
      eventType: "tasks.task.checklist_toggled",
      title: "Checklist Item Toggled",
      notifyViaMatrix: false,
      registerSearch: false,
      signalDashboard: false,
    },
    async (ctx, args) => {
      const now = Date.now();
      await ctx.db.patch(args.itemId, {
        completed: args.completed,
        completedAt: args.completed ? now : undefined,
      });
      return args.itemId;
    },
  ),
});

export const deleteChecklistItem = mutation({
  args: { itemId: v.id("taskChecklistItems") },
  handler: withScopeAndEvents(
    {
      ...taskPipeline,
      operation: "delete",
      entity: "task_checklist_item",
      eventType: "tasks.task.checklist_deleted",
      title: "Checklist Item Deleted",
      notifyViaMatrix: false,
      registerSearch: false,
      signalDashboard: false,
    },
    async (ctx, args) => {
      await ctx.db.delete(args.itemId);
      return args.itemId;
    },
  ),
});

// ============================
// COMMENTS
// ============================

export const getTaskComments = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const comments = await ctx.db.query("taskComments").withIndex("taskId", (q) => q.eq("taskId", args.taskId)).collect();
    return comments.sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const addComment = mutation({
  args: {
    taskId: v.id("tasks"),
    userId: v.id("users"),
    content: v.string(),
    isInternal: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents(
    {
      ...taskPipeline,
      operation: "create",
      entity: "task_comment",
      eventType: "tasks.task.commented",
      title: "Comment Added",
      notifyViaMatrix: true,
      registerSearch: false,
      signalDashboard: false,
    },
    async (ctx, args) => {
      await ctx.db.insert("taskComments", {
        taskId: args.taskId,
        userId: args.userId,
        content: args.content,
        isInternal: args.isInternal,
        createdAt: Date.now(),
      });
      return args.taskId;
    },
  ),
});

export const deleteComment = mutation({
  args: { commentId: v.id("taskComments") },
  handler: withScopeAndEvents(
    {
      ...taskPipeline,
      operation: "delete",
      entity: "task_comment",
      eventType: "tasks.task.comment_deleted",
      title: "Comment Deleted",
      notifyViaMatrix: false,
      registerSearch: false,
      signalDashboard: false,
    },
    async (ctx, args) => {
      await ctx.db.delete(args.commentId);
      return args.commentId;
    },
  ),
});
