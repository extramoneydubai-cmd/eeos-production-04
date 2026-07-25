import { defineTable } from "convex/server";
import { v } from "convex/values";

export const admissionsTables = {
  intakeDuplicateRules: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    matchFields: v.array(v.string()),
    matchType: v.union(v.literal("any"), v.literal("all"), v.literal("custom")),
    action: v.union(v.literal("ignore"), v.literal("merge"), v.literal("keep_both"), v.literal("review")),
    targetFormIds: v.optional(v.array(v.id("forms"))),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  intakeEvents: defineTable({
    submissionId: v.id("intakeSubmissions"),
    eventType: v.string(),
    status: v.string(),
    payload: v.optional(v.string()),
    processedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("eventType", ["eventType"])
    .index("status", ["status"]),
  intakeRoutingRules: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    targetModule: v.string(),
    conditionField: v.optional(v.string()),
    conditionValue: v.optional(v.string()),
    conditionOperator: v.optional(v.string()),
    sourceFormIds: v.optional(v.array(v.id("forms"))),
    defaultRoute: v.boolean(),
    priority: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("priority", ["priority"]),
  intakeSubmissions: defineTable({
    submissionNumber: v.string(),
    formId: v.optional(v.id("forms")),
    formCode: v.optional(v.string()),
    formVersion: v.optional(v.number()),
    source: v.string(),
    payload: v.string(),
    createdBy: v.optional(v.id("users")),
    submittedBy: v.optional(v.string()),
    submissionDate: v.number(),
    ipAddress: v.optional(v.string()),
    browser: v.optional(v.string()),
    device: v.optional(v.string()),
    processingStatus: v.string(),
    validationStatus: v.optional(v.string()),
    verificationStatus: v.optional(v.string()),
    duplicateStatus: v.optional(v.string()),
    routingStatus: v.optional(v.string()),
    targetModule: v.optional(v.string()),
    targetEntityId: v.optional(v.string()),
    retryCount: v.optional(v.number()),
    processingTime: v.optional(v.number()),
    validationReport: v.optional(v.string()),
    duplicateReason: v.optional(v.string()),
    systemNotes: v.optional(v.string()),
    metadata: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("submissionNumber", ["submissionNumber"])
    .index("source", ["source"])
    .index("processingStatus", ["processingStatus"])
    .index("formId", ["formId"])
    .index("createdAt", ["createdAt"])
    .index("processingStatus_createdAt", ["processingStatus", "createdAt"]),
  intakeTimeline: defineTable({
    submissionId: v.id("intakeSubmissions"),
    action: v.string(),
    status: v.string(),
    details: v.optional(v.string()),
    performedBy: v.optional(v.id("users")),
    metadata: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("submissionId_createdAt", ["submissionId", "createdAt"]),
  intakeTransformMappings: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    sourceField: v.string(),
    targetField: v.string(),
    targetModule: v.string(),
    transformation: v.optional(v.string()),
    defaultValue: v.optional(v.string()),
    isRequired: v.boolean(),
    sourceFormIds: v.optional(v.array(v.id("forms"))),
    isActive: v.boolean(),
    displayOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
};