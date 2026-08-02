import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withEventPipeline, entityIdFromResult, entityIdFromArg, userIdFromArg } from "../platform/eventPipeline";

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
  handler: withEventPipeline(
    {
      module: "tasks",
      entity: "task",
      action: "create",
      getEntityId: entityIdFromResult(),
      getUserId: userIdFromArg("ownerId"),
      title: "Task created",
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
  handler: async (ctx, args) => {
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
  },
});

export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.string(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, any> = { status: args.status as any, updatedAt: Date.now() };
    if (args.order !== undefined) updates.order = args.order;
    await ctx.db.patch(args.taskId, updates);
  },
});

export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: withEventPipeline(
    {
      module: "tasks",
      entity: "task",
      action: "delete",
      getEntityId: entityIdFromArg("taskId"),
      title: "Task deleted",
    },
    async (ctx, args) => {
      const participants = await ctx.db.query("taskParticipants").withIndex("taskId", (q: any) => q.eq("taskId", args.taskId)).collect();
      for (const p of participants) await ctx.db.delete(p._id);

      const checklistItems = await ctx.db.query("taskChecklistItems").withIndex("taskId", (q: any) => q.eq("taskId", args.taskId)).collect();
      for (const c of checklistItems) await ctx.db.delete(c._id);

      const comments = await ctx.db.query("taskComments").withIndex("taskId", (q: any) => q.eq("taskId", args.taskId)).collect();
      for (const c of comments) await ctx.db.delete(c._id);

      await ctx.db.delete(args.taskId);
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
  handler: async (ctx, args) => {
    await ctx.db.insert("taskParticipants", {
      taskId: args.taskId,
      userId: args.userId,
      role: args.role,
      createdAt: Date.now(),
    });
  },
});

export const removeTaskParticipant = mutation({
  args: { participantId: v.id("taskParticipants") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.participantId);
  },
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
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("taskChecklistItems").withIndex("taskId", (q) => q.eq("taskId", args.taskId)).collect();
    const maxOrder = existing.reduce((max, i) => Math.max(max, i.order), -1);
    await ctx.db.insert("taskChecklistItems", {
      taskId: args.taskId,
      text: args.text,
      completed: false,
      order: maxOrder + 1,
      createdAt: Date.now(),
    });
  },
});

export const toggleChecklistItem = mutation({
  args: {
    itemId: v.id("taskChecklistItems"),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.itemId, {
      completed: args.completed,
      completedAt: args.completed ? now : undefined,
    });
  },
});

export const deleteChecklistItem = mutation({
  args: { itemId: v.id("taskChecklistItems") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.itemId);
  },
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
  handler: async (ctx, args) => {
    await ctx.db.insert("taskComments", {
      taskId: args.taskId,
      userId: args.userId,
      content: args.content,
      isInternal: args.isInternal,
      createdAt: Date.now(),
    });
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("taskComments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.commentId);
  },
});
