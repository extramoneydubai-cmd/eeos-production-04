import { defineTable } from "convex/server";
import { v } from "convex/values";

export const documentsTables = {
  documentFolders: defineTable({
    name: v.string(),
    parentId: v.optional(v.id("documentFolders")),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("parentId", ["parentId"])
    .index("isActive", ["isActive"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  documentPermissions: defineTable({
    documentId: v.id("documents"),
    permissionType: v.union(v.literal("user"), v.literal("role"), v.literal("department"), v.literal("public")),
    targetId: v.string(),
    canView: v.boolean(),
    canDownload: v.boolean(),
    canEdit: v.boolean(),
    canDelete: v.boolean(),
    canShare: v.boolean(),
    grantedBy: v.id("users"),
    grantedAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("documentId", ["documentId"])
    .index("permissionType_targetId", ["permissionType", "targetId"]),
  documentTags: defineTable({
    name: v.string(),
    color: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("name", ["name"])
    .index("isActive", ["isActive"])
    .index("by_created", ["createdAt"]),
  documentTimeline: defineTable({
    documentId: v.id("documents"),
    eventType: v.union(
      v.literal("uploaded"), v.literal("updated"), v.literal("downloaded"),
      v.literal("deleted"), v.literal("restored"), v.literal("expired"),
      v.literal("shared"), v.literal("approved"), v.literal("reviewed"),
      v.literal("version_created"), v.literal("tagged"), v.literal("moved"),
    ),
    description: v.string(),
    performedBy: v.id("users"),
    metadata: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("documentId", ["documentId"])
    .index("documentId_createdAt", ["documentId", "createdAt"])
    .index("eventType", ["eventType"]),
  documentVersions: defineTable({
    documentId: v.id("documents"),
    versionNumber: v.number(),
    fileUrl: v.string(),
    fileSize: v.number(),
    fileHash: v.optional(v.string()),
    changeNotes: v.optional(v.string()),
    uploadedBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("documentId", ["documentId"])
    .index("documentId_version", ["documentId", "versionNumber"])
    .index("by_created", ["createdAt"]),
  documents: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    fileUrl: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    fileHash: v.optional(v.string()),
    version: v.number(),
    folderId: v.optional(v.id("documentFolders")),
    tags: v.optional(v.array(v.id("documentTags"))),
    referenceType: v.optional(v.union(
      v.literal("person"), v.literal("student"), v.literal("employee"),
      v.literal("lead"), v.literal("invoice"), v.literal("task"),
      v.literal("exam"), v.literal("course"), v.literal("vendor"),
      v.literal("asset"), v.literal("workflow"), v.literal("project"),
      v.literal("procurement"), v.literal("general"),
    )),
    referenceId: v.optional(v.string()),
    expiryDate: v.optional(v.number()),
    isArchived: v.boolean(),
    digitalSignature: v.optional(v.string()),
    ocrData: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    checksum: v.optional(v.string()),
    uploadedBy: v.id("users"),
    downloadCount: v.number(),
    lastDownloadedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("folderId", ["folderId"])
    .index("referenceType_referenceId", ["referenceType", "referenceId"])
    .index("uploadedBy", ["uploadedBy"])
    .index("fileType", ["fileType"])
    .index("createdAt", ["createdAt"])
    .index("isArchived", ["isArchived"])
    .index("by_updated", ["updatedAt"]),

  // ─── Attachment Engine (entity-scoped, provider-agnostic storage) ───

  attachments: defineTable({
    fileName: v.string(),
    originalName: v.string(),
    size: v.number(),
    extension: v.string(),
    mimeType: v.string(),
    storageId: v.string(),
    storageProvider: v.union(v.literal("local"), v.literal("s3"), v.literal("azure"), v.literal("gcs")),
    category: v.union(
      v.literal("identity"), v.literal("academic"), v.literal("finance"),
      v.literal("hr"), v.literal("medical"), v.literal("legal"),
      v.literal("communication"), v.literal("marketing"), v.literal("general"), v.literal("custom"),
    ),
    entityType: v.string(),
    entityId: v.string(),
    organizationId: v.optional(v.id("organizations")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    teamId: v.optional(v.id("teams")),
    tags: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    thumbnailId: v.optional(v.string()),
    hash: v.optional(v.string()),
    currentVersion: v.number(),
    status: v.union(v.literal("active"), v.literal("archived"), v.literal("deleted")),
    uploadedBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_entity_date", ["entityType", "entityId"])
    .index("by_organization", ["organizationId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),

  attachment_versions: defineTable({
    attachmentId: v.id("attachments"),
    versionNumber: v.number(),
    fileName: v.string(),
    originalName: v.string(),
    size: v.number(),
    extension: v.string(),
    mimeType: v.string(),
    storageId: v.string(),
    hash: v.optional(v.string()),
    uploadedBy: v.id("users"),
    changeNote: v.string(),
    createdAt: v.number(),
  })
    .index("by_attachment_version", ["attachmentId"])
    .index("by_created", ["createdAt"]),
};