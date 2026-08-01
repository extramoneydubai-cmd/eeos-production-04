/**
 * Task SDK — Enterprise Task Service
 *
 * Every business module MUST use this SDK for task management.
 *
 * Usage:
 *   import { taskSdk } from "@/platform/sdk/taskSdk";
 *   const taskId = await taskSdk.create(ctx, { title, assignedTo, ... });
 */

import { v } from "convex/values";
import { mutation, query } from "../../convex/_generated/server";
import { Id } from "../../convex/_generated/dataModel";

// ─── SDK Methods ─────────────────────────────────────────────────────────

/**
 * Create a new task.
 */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    taskType: v.optional(v.string()),
    priority: v.optional(v.string()),
    status: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
    assignedTo: v.optional(v.id("users")),
    assignedToRole: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      taskType: args.taskType || "general",
      priority: args.priority || "medium",
      status: args.status || "open",
      ownerId: args.ownerId || args.createdBy,
      assignedTo: args.assignedTo,
      assignedToRole: args.assignedToRole,
      dueDate: args.dueDate,
      entityType: args.entityType,
      entityId: args.entityId,
      companyId: args.companyId,
      branchId: args.branchId,
      departmentId: args.departmentId,
      createdBy: args.createdBy,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Get a task by ID.
 */
export const get = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.taskId);
  },
});

/**
 * Update a task.
 */
export const update = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.string()),
    status: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { taskId, ...fields } = args;
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(taskId, updates);
    return { success: true };
  },
});

/**
 * List tasks for a user.
 */
export const listForUser = query({
  args: {
    userId: v.id("users"),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let tasks = await ctx.db
      .query("tasks")
      .withIndex("assignedTo", (q) => q.eq("assignedTo", args.userId))
      .collect();

    if (args.status) tasks = tasks.filter((t) => t.status === args.status);
    if (args.priority) tasks = tasks.filter((t) => t.priority === args.priority);

    return tasks.sort((a, b) => b.createdAt - a.createdAt).slice(0, args.limit || 50);
  },
});

/**
 * List tasks for an entity.
 */
export const listForEntity = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("entityType_entityId", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .collect();

    return tasks.sort((a, b) => b.createdAt - a.createdAt).slice(0, args.limit || 20);
  },
});

/**
 * Delete a task.
 */
export const remove = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.taskId);
    return { success: true };
  },
});

/**
 * Get task stats for a user.
 */
export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("assignedTo", (q) => q.eq("assignedTo", args.userId))
      .collect();

    return {
      total: tasks.length,
      open: tasks.filter((t) => t.status === "open" || t.status === "pending").length,
      inProgress: tasks.filter((t) => t.status === "in_progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      overdue: tasks.filter((t) => t.dueDate && t.dueDate < Date.now() && t.status !== "completed").length,
    };
  },
});
