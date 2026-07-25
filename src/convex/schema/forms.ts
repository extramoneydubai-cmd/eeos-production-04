import { defineTable } from "convex/server";
import { v } from "convex/values";
import { formStatusValidator, fieldTypeValidator, submissionStatusValidator } from "./shared";

export const formsTables = {
  formFields: defineTable({
    formId: v.id("forms"),
    version: v.number(),
    fieldCode: v.string(),
    fieldType: fieldTypeValidator,
    label: v.string(),
    placeholder: v.optional(v.string()),
    description: v.optional(v.string()),
    required: v.boolean(),
    unique: v.boolean(),
    readOnly: v.boolean(),
    hidden: v.boolean(),
    defaultValue: v.optional(v.string()),
    validationRegex: v.optional(v.string()),
    minValue: v.optional(v.number()),
    maxValue: v.optional(v.number()),
    options: v.optional(v.array(v.string())),
    conditionalVisibility: v.optional(v.string()),
    conditionalRequired: v.optional(v.string()),
    calculated: v.optional(v.string()),
    lookupSource: v.optional(v.string()),
    dependentField: v.optional(v.string()),
    width: v.optional(v.string()),
    displayOrder: v.number(),
    sectionId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("formId", ["formId"])
    .index("formId_fieldCode", ["formId", "fieldCode"])
    .index("formId_version", ["formId", "version"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  formSubmissions: defineTable({
    formId: v.id("forms"),
    formVersion: v.number(),
    payload: v.string(),
    status: submissionStatusValidator,
    submittedBy: v.optional(v.id("users")),
    source: v.optional(v.string()),
    device: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    browser: v.optional(v.string()),
    notes: v.optional(v.string()),
    validationState: v.optional(v.string()),
    duplicateState: v.optional(v.string()),
    routingState: v.optional(v.string()),
    processingState: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("formId", ["formId"])
    .index("status", ["status"])
    .index("formId_status", ["formId", "status"])
    .index("submittedBy", ["submittedBy"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  formVersions: defineTable({
    formId: v.id("forms"),
    version: v.number(),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    schemaData: v.string(),
    publishedAt: v.optional(v.number()),
    publishedBy: v.optional(v.id("users")),
    changeNotes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("formId", ["formId"])
    .index("formId_version", ["formId", "version"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),
  forms: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    status: formStatusValidator,
    version: v.number(),
    ownerId: v.optional(v.id("users")),
    createdBy: v.optional(v.id("users")),
    isPublic: v.boolean(),
    requiresAuth: v.boolean(),
    allowAnonymous: v.boolean(),
    enableQr: v.boolean(),
    publicUrl: v.optional(v.string()),
    expiryDate: v.optional(v.number()),
    submissionLimit: v.optional(v.number()),
    autoSaveDraft: v.boolean(),
    theme: v.optional(v.string()),
    successMessage: v.optional(v.string()),
    redirectUrl: v.optional(v.string()),
    isArchived: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("code", ["code"])
    .index("status", ["status"])
    .index("ownerId", ["ownerId"])
    .index("category", ["category"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
};