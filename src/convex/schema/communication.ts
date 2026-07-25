import { defineTable } from "convex/server";
import { v } from "convex/values";

export const communicationTables = {
  channelMembers: defineTable({
    channelId: v.id("channels"),
    userId: v.id("users"),
    joinedAt: v.number(),
    lastReadAt: v.optional(v.number()),
  })
    .index("channelId", ["channelId"])
    .index("userId", ["userId"]),
  channels: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("channel"), v.literal("announcement")),
    createdBy: v.id("users"),
    isArchived: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("type", ["type"])
    .index("createdBy", ["createdBy"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  commEmailTemplates: defineTable({
    name: v.string(),
    code: v.string(),
    templateCategory: v.string(),
    subject: v.string(),
    bodyPreview: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  commNotificationTypes: defineTable({
    name: v.string(),
    code: v.string(),
    channelType: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  commSmsTemplates: defineTable({
    name: v.string(),
    code: v.string(),
    templateCategory: v.string(),
    bodyPreview: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  commWhatsAppTemplates: defineTable({
    name: v.string(),
    code: v.string(),
    templateCategory: v.string(),
    bodyPreview: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  directMessages: defineTable({
    senderId: v.id("users"),
    receiverId: v.id("users"),
    content: v.string(),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("senderId", ["senderId"])
    .index("receiverId", ["receiverId"])
    .index("participants", ["senderId", "receiverId"])
    .index("by_created", ["createdAt"]),
  messages: defineTable({
    channelId: v.id("channels"),
    senderId: v.id("users"),
    content: v.string(),
    parentId: v.optional(v.id("messages")),
    isPinned: v.optional(v.boolean()),
    mentions: v.optional(v.array(v.id("users"))),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("channelId", ["channelId"])
    .index("senderId", ["senderId"])
    .index("channelId_createdAt", ["channelId", "createdAt"])
    .index("by_updated", ["updatedAt"]),

  // ─── Comment Engine (universal entity-scoped discussion) ────────

  comments: defineTable({
    body: v.string(),
    bodyHtml: v.optional(v.string()),
    entityType: v.string(),
    entityId: v.string(),
    userId: v.id("users"),
    organizationId: v.optional(v.id("organizations")),
    parentId: v.optional(v.id("comments")),
    rootId: v.optional(v.id("comments")),
    mentions: v.optional(v.array(v.id("users"))),
    reactions: v.array(v.object({ emoji: v.string(), userId: v.id("users") })),
    attachmentIds: v.optional(v.array(v.id("attachments"))),
    isEdited: v.boolean(),
    editedAt: v.optional(v.number()),
    isResolved: v.boolean(),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.id("users")),
    isPinned: v.boolean(),
    visibility: v.union(v.literal("public"), v.literal("internal"), v.literal("private")),
    createdAt: v.number(),
  })
    .index("by_entity_date", ["entityType", "entityId"])
    .index("by_pinned", ["entityType", "entityId", "isPinned"])
    .index("by_root", ["rootId"])
    .index("by_user", ["userId"])
    .index("by_created", ["createdAt"]),
};