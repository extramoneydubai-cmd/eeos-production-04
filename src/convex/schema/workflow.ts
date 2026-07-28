/**
 * Workflow Schema — Enterprise Workflow & Business Process Engine
 *
 * Tables:
 * - workflowDefinitions: Workflow templates/definitions (versioned)
 * - workflowVersions: Version history for each definition
 * - workflowExecutions: Running/completed workflow instances
 * - workflowTasks: Individual tasks within an execution
 * - workflowVariables: Runtime variables for each execution
 * - workflowAudit: Audit trail for all workflow actions
 * - workflowConditions: Reusable conditions/rules
 *
 * Indexes: organization, company, branch, status, type, version
 */

import { v } from "convex/values";
import { defineTable } from "convex/server";

export const workflowTables = {
  workflowDefinitions: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    category: v.string(),               // admission, finance, hr, procurement, etc.
    status: v.string(),                  // draft, active, archived, deprecated
    version: v.number(),                 // current version
    nodes: v.array(v.object({
      id: v.string(),
      type: v.string(),                 // start, end, approval, decision, condition, parallel, timer, notification, automation, webhook, script, merge, split
      label: v.string(),
      config: v.any(),                  // type-specific configuration
      position: v.optional(v.object({ x: v.number(), y: v.number() })),
      metadata: v.optional(v.any()),
    })),
    edges: v.array(v.object({
      id: v.string(),
      source: v.string(),
      target: v.string(),
      label: v.optional(v.string()),
      condition: v.optional(v.string()),
    })),
    triggers: v.optional(v.array(v.object({
      type: v.string(),                 // entity_created, entity_updated, status_changed, schedule, webhook, api, manual, cron, timer, pipeline_event
      config: v.any(),
      entityType: v.optional(v.string()),
      scheduleType: v.optional(v.string()),
    }))),
    timeout: v.optional(v.number()),    // max execution time in ms
    maxRetries: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    organizationId: v.optional(v.id("organizations")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    createdBy: v.optional(v.id("users")),
    updatedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category", "status"])
    .index("by_organization", ["organizationId", "status"])
    .index("by_company", ["companyId", "status"])
    .index("by_branch", ["branchId", "status"])
    .index("by_status", ["status"])
    .index("by_trigger", ["triggers"]),

  workflowVersions: defineTable({
    definitionId: v.id("workflowDefinitions"),
    version: v.number(),
    nodes: v.array(v.any()),
    edges: v.array(v.any()),
    changelog: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_definition", ["definitionId", "version"]),

  workflowExecutions: defineTable({
    definitionId: v.id("workflowDefinitions"),
    definitionVersion: v.number(),
    status: v.string(),                 // pending, running, paused, completed, failed, cancelled, blocked
    trigger: v.string(),                // how it was started
    entityType: v.optional(v.string()), // what entity this workflow is about
    entityId: v.optional(v.string()),
    currentNodes: v.array(v.string()),  // currently active node IDs
    completedNodes: v.array(v.string()),
    failedNodes: v.optional(v.array(v.string())),
    error: v.optional(v.string()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    duration: v.optional(v.number()),
    retryCount: v.optional(v.number()),
    priority: v.optional(v.string()),   // low, medium, high, critical
    slaDeadline: v.optional(v.number()),
    slaBreached: v.optional(v.boolean()),
    initiatedBy: v.optional(v.id("users")),
    assignedTo: v.optional(v.id("users")),
    organizationId: v.optional(v.id("organizations")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_definition", ["definitionId", "status"])
    .index("by_entity", ["entityType", "entityId"])
    .index("by_status", ["status"])
    .index("by_organization", ["organizationId", "status"])
    .index("by_company", ["companyId", "status"])
    .index("by_branch", ["branchId", "status"])
    .index("by_assigned", ["assignedTo", "status"])
    .index("by_sla", ["slaBreached", "status"]),

  workflowTasks: defineTable({
    executionId: v.id("workflowExecutions"),
    nodeId: v.string(),
    type: v.string(),                   // approval, decision, notification, automation, etc.
    status: v.string(),                 // pending, active, completed, failed, skipped, cancelled
    label: v.string(),
    assignedTo: v.optional(v.array(v.id("users"))),
    assignedRoles: v.optional(v.array(v.string())),
    completedBy: v.optional(v.id("users")),
    completedAt: v.optional(v.number()),
    action: v.optional(v.string()),     // approved, rejected, delegated, escalated
    comment: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    priority: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_execution", ["executionId", "status"])
    .index("by_assigned", ["assignedTo", "status"])
    .index("by_status", ["status", "type"])
    .index("by_due", ["dueDate", "status"]),

  workflowVariables: defineTable({
    executionId: v.id("workflowExecutions"),
    name: v.string(),
    value: v.any(),
    type: v.string(),                   // string, number, boolean, date, entity, array, object
    scope: v.optional(v.string()),      // global, node, local
    nodeId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_execution", ["executionId", "name"]),

  workflowAudit: defineTable({
    executionId: v.id("workflowExecutions"),
    nodeId: v.optional(v.string()),
    action: v.string(),                 // started, completed, failed, approved, rejected, delegated, escalated, timed_out, retried
    actor: v.optional(v.id("users")),
    before: v.optional(v.any()),
    after: v.optional(v.any()),
    comment: v.optional(v.string()),
    metadata: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_execution", ["executionId"])
    .index("by_actor", ["actor", "timestamp"])
    .index("by_action", ["action", "timestamp"])
    .index("by_timestamp", ["timestamp"]),

  workflowConditions: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(),                   // and, or, not, expression
    rules: v.array(v.object({
      field: v.string(),
      operator: v.string(),             // eq, neq, gt, gte, lt, lte, contains, starts_with, ends_with, in, not_in, between, is_empty, is_not_empty
      value: v.any(),
      valueType: v.optional(v.string()),
    })),
    category: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_organization", ["organizationId"])
    .index("by_company", ["companyId"]),
};
