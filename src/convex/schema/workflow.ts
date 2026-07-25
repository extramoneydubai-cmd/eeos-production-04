import { defineTable } from "convex/server";
import { v } from "convex/values";
import { approvalStatusValidator, approvalModeValidator } from "./shared";

export const workflowTables = {
  approvalRequestApprovers: defineTable({
    requestId: v.id("approvalRequests"),
    userId: v.id("users"),
    phaseIndex: v.number(),
    status: approvalStatusValidator,
    comment: v.optional(v.string()),
    decidedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("requestId", ["requestId"])
    .index("userId", ["userId"])
    .index("by_created", ["createdAt"]),
  approvalRequests: defineTable({
    templateId: v.optional(v.id("approvalTemplates")),
    taskId: v.optional(v.id("tasks")),
    requesterId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    mode: approvalModeValidator,
    status: approvalStatusValidator,
    currentPhase: v.optional(v.number()),
    totalPhases: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("requesterId", ["requesterId"])
    .index("status", ["status"])
    .index("taskId", ["taskId"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  approvalTemplates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    mode: approvalModeValidator,
    phases: v.array(
      v.object({
        name: v.string(),
        order: v.number(),
        requiredApprovers: v.number(),
      })
    ),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("isActive", ["isActive"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  verification_decisions: defineTable({
    requestId: v.id("verification_requests"),
    userId: v.id("users"),
    status: v.union(v.literal("verified"), v.literal("rejected"), v.literal("returned"), v.literal("request_proof")),
    comment: v.optional(v.string()),
    decidedAt: v.number(),
    createdAt: v.number(),
  })
    .index("requestId", ["requestId"])
    .index("userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),
  verification_requests: defineTable({
    entityType: v.string(),
    entityId: v.string(),
    requesterId: v.id("users"),
    assignedUserIds: v.array(v.id("users")),
    mode: v.union(v.literal("any_one"), v.literal("all_required"), v.literal("sequential"), v.literal("round_robin")),
    status: v.union(v.literal("pending"), v.literal("verified"), v.literal("rejected"), v.literal("returned")),
    metadata: v.optional(v.string()),
    remarks: v.optional(v.string()),
    decidedBy: v.optional(v.id("users")),
    decidedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("entityType", ["entityType"])
    .index("entityId", ["entityId"])
    .index("status", ["status"])
    .index("assignedUserIds", ["assignedUserIds"])
    .index("entityType_status", ["entityType", "status"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  verification_rules: defineTable({
    entity: v.string(),
    departmentId: v.optional(v.id("departments")),
    teamId: v.optional(v.id("teams")),
    verifierIds: v.array(v.id("users")),
    mode: v.union(v.literal("any_one"), v.literal("all_required"), v.literal("sequential"), v.literal("round_robin")),
    priority: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("entity", ["entity"])
    .index("isActive", ["isActive"])
    .index("by_dept", ["departmentId"])
    .index("by_team", ["teamId"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  workflowEdges: defineTable({
    workflowId: v.id("workflows"),
    sourceNodeId: v.id("workflowNodes"),
    targetNodeId: v.id("workflowNodes"),
    label: v.optional(v.string()),
    condition: v.optional(v.string()),
    displayOrder: v.number(),
    createdAt: v.number(),
  })
    .index("workflowId", ["workflowId"])
    .index("sourceNodeId", ["sourceNodeId"])
    .index("targetNodeId", ["targetNodeId"])
    .index("by_created", ["createdAt"]),
  workflowInstances: defineTable({
    workflowId: v.id("workflows"),
    workflowVersion: v.number(),
    status: v.string(),
    currentStepId: v.optional(v.id("workflowNodes")),
    triggerSource: v.string(),
    triggerEntityId: v.optional(v.string()),
    triggerPayload: v.optional(v.string()),
    context: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    assignedTeam: v.optional(v.id("organizationTeams")),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    retryCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("workflowId", ["workflowId"])
    .index("status", ["status"])
    .index("currentStepId", ["currentStepId"])
    .index("assignedTo", ["assignedTo"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  workflowLogs: defineTable({
    instanceId: v.id("workflowInstances"),
    workflowId: v.id("workflows"),
    nodeId: v.optional(v.id("workflowNodes")),
    action: v.string(),
    status: v.string(),
    details: v.optional(v.string()),
    metadata: v.optional(v.string()),
    performedBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("instanceId", ["instanceId"])
    .index("workflowId", ["workflowId"])
    .index("action", ["action"])
    .index("createdAt", ["createdAt"])
    .index("by_status", ["status"]),
  workflowNodes: defineTable({
    workflowId: v.id("workflows"),
    nodeType: v.string(),
    label: v.string(),
    positionX: v.number(),
    positionY: v.number(),
    config: v.optional(v.string()),
    configSchema: v.optional(v.string()),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("workflowId", ["workflowId"])
    .index("nodeType", ["nodeType"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  workflows: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    module: v.string(),
    status: v.string(),
    version: v.number(),
    isActive: v.boolean(),
    tag: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("code", ["code"])
    .index("module", ["module"])
    .index("status", ["status"])
    .index("isActive", ["isActive"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
};