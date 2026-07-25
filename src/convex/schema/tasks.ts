import { defineTable } from "convex/server";
import { v } from "convex/values";
import { approvalStatusValidator, taskStatusValidator, priorityValidator } from "./shared";

export const tasksTables = {
  taskChecklistItems: defineTable({
    taskId: v.id("tasks"),
    text: v.string(),
    completed: v.boolean(),
    completedBy: v.optional(v.id("users")),
    completedAt: v.optional(v.number()),
    order: v.number(),
    createdAt: v.number(),
  })
    .index("taskId", ["taskId"])
    .index("completed", ["completed"])
    .index("by_created", ["createdAt"]),
  taskComments: defineTable({
    taskId: v.id("tasks"),
    userId: v.id("users"),
    content: v.string(),
    isInternal: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("taskId", ["taskId"])
    .index("userId", ["userId"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  taskParticipants: defineTable({
    taskId: v.id("tasks"),
    userId: v.id("users"),
    role: v.string(),
    createdAt: v.number(),
  })
    .index("taskId", ["taskId"])
    .index("userId", ["userId"])
    .index("by_created", ["createdAt"]),
  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: taskStatusValidator,
    priority: priorityValidator,
    ownerId: v.id("users"),
    assignedTo: v.optional(v.id("users")),
    departmentId: v.optional(v.id("departments")),
    teamId: v.optional(v.id("teams")),
    dueDate: v.optional(v.number()),
    order: v.number(),
    approvalRequired: v.optional(v.boolean()),
    approvalStatus: v.optional(approvalStatusValidator),
    approvalRequestId: v.optional(v.id("approvalRequests")),
    isArchived: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("status", ["status"])
    .index("ownerId", ["ownerId"])
    .index("assignedTo", ["assignedTo"])
    .index("departmentId", ["departmentId"])
    .index("teamId", ["teamId"])
    .index("approvalStatus", ["approvalStatus"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
};