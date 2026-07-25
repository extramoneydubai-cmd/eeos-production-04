// @ts-nocheck — This file is type-checked by `npx convex dev`, not by the frontend `tsc`.

/**
 * EEOS Attachment Engine (P0)
 *
 * Universal document management for every module in the platform.
 * No module should manage files independently.
 *
 * DOC-22 reference: Attachment Engine
 * DOC-23 reference: Engine Standards, Naming Standards
 *
 * Features:
 * - Entity-scoped attachments (any entity type + entityId can have files)
 * - Version management (replace + version history)
 * - Category system (identity, academic, finance, hr, medical, etc.)
 * - Soft delete with restore
 * - File metadata (name, size, mime, hash, thumbnail)
 * - Multi-provider storage architecture (local, S3, Azure, GCS)
 * - Search and filter
 * - Drag & drop ready
 */

import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "../_generated/server";

const STORAGE_PROVIDERS = ["local", "s3", "azure", "gcs"] as const;
const CATEGORIES = [
  "identity", "academic", "finance", "hr", "medical", "legal",
  "communication", "marketing", "general", "custom",
] as const;
const STATUSES = ["active", "archived", "deleted"] as const;

// ─── Mutations ─────────────────────────────────────────────────

/** Upload a new attachment for an entity. Core API every module uses. */
export const upload = mutation({
  args: {
    fileName: v.string(),
    originalName: v.string(),
    size: v.number(),
    extension: v.string(),
    mimeType: v.string(),
    storageId: v.string(),
    storageProvider: v.union(v.literal("local"), v.literal("s3"), v.literal("azure"), v.literal("gcs")),
    category: v.union(...CATEGORIES.map((c) => v.literal(c))),
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (args.size <= 0) throw new Error("File size must be positive");
    if (args.size > 104857600) throw new Error("File size exceeds 100 MB limit");

    const now = Date.now();
    const attachmentId = await ctx.db.insert("attachments", {
      fileName: args.fileName,
      originalName: args.originalName,
      size: args.size,
      extension: args.extension,
      mimeType: args.mimeType,
      storageId: args.storageId,
      storageProvider: args.storageProvider,
      category: args.category,
      entityType: args.entityType,
      entityId: args.entityId,
      organizationId: args.organizationId,
      branchId: args.branchId,
      departmentId: args.departmentId,
      teamId: args.teamId,
      tags: args.tags,
      description: args.description,
      thumbnailId: args.thumbnailId,
      hash: args.hash,
      currentVersion: 1,
      status: "active",
      uploadedBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Create initial version record
    await ctx.db.insert("attachment_versions", {
      attachmentId,
      versionNumber: 1,
      fileName: args.fileName,
      originalName: args.originalName,
      size: args.size,
      extension: args.extension,
      mimeType: args.mimeType,
      storageId: args.storageId,
      hash: args.hash,
      uploadedBy: userId,
      changeNote: "Initial upload",
      createdAt: now,
    });

    return attachmentId;
  },
});

/** Replace an attachment with a new version. */
export const replace = mutation({
  args: {
    attachmentId: v.id("attachments"),
    fileName: v.string(),
    originalName: v.string(),
    size: v.number(),
    extension: v.string(),
    mimeType: v.string(),
    storageId: v.string(),
    hash: v.optional(v.string()),
    changeNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const attachment = await ctx.db.get(args.attachmentId);
    if (!attachment) throw new Error("Attachment not found");
    if (attachment.status === "deleted") throw new Error("Cannot replace a deleted attachment");

    if (args.size <= 0) throw new Error("File size must be positive");
    if (args.size > 104857600) throw new Error("File size exceeds 100 MB limit");

    const newVersion = attachment.currentVersion + 1;
    const now = Date.now();

    // Update the attachment record with new file info
    await ctx.db.patch(args.attachmentId, {
      fileName: args.fileName,
      originalName: args.originalName,
      size: args.size,
      extension: args.extension,
      mimeType: args.mimeType,
      storageId: args.storageId,
      hash: args.hash,
      currentVersion: newVersion,
      updatedAt: now,
    });

    // Create version record
    await ctx.db.insert("attachment_versions", {
      attachmentId: args.attachmentId,
      versionNumber: newVersion,
      fileName: args.fileName,
      originalName: args.originalName,
      size: args.size,
      extension: args.extension,
      mimeType: args.mimeType,
      storageId: args.storageId,
      hash: args.hash,
      uploadedBy: userId,
      changeNote: args.changeNote || `Version ${newVersion}`,
      createdAt: now,
    });

    return { attachmentId: args.attachmentId, newVersion };
  },
});

/** Soft-delete an attachment (moves to deleted status). */
export const remove = mutation({
  args: {
    attachmentId: v.id("attachments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const attachment = await ctx.db.get(args.attachmentId);
    if (!attachment) throw new Error("Attachment not found");
    if (attachment.status === "deleted") throw new Error("Attachment is already deleted");

    await ctx.db.patch(args.attachmentId, {
      status: "deleted",
      updatedAt: Date.now(),
    });

    return args.attachmentId;
  },
});

/** Restore a soft-deleted attachment. */
export const restore = mutation({
  args: {
    attachmentId: v.id("attachments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const attachment = await ctx.db.get(args.attachmentId);
    if (!attachment) throw new Error("Attachment not found");
    if (attachment.status !== "deleted") throw new Error("Attachment is not deleted");

    await ctx.db.patch(args.attachmentId, {
      status: "active",
      updatedAt: Date.now(),
    });

    return args.attachmentId;
  },
});

/** Permanently archive an attachment (soft archive, not deleted). */
export const archive = mutation({
  args: {
    attachmentId: v.id("attachments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const attachment = await ctx.db.get(args.attachmentId);
    if (!attachment) throw new Error("Attachment not found");

    await ctx.db.patch(args.attachmentId, {
      status: "archived",
      updatedAt: Date.now(),
    });

    return args.attachmentId;
  },
});

/** Update attachment metadata (category, tags, description). */
export const updateMetadata = mutation({
  args: {
    attachmentId: v.id("attachments"),
    category: v.optional(v.union(...CATEGORIES.map((c) => v.literal(c)))),
    tags: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const attachment = await ctx.db.get(args.attachmentId);
    if (!attachment) throw new Error("Attachment not found");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.category !== undefined) updates.category = args.category;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.description !== undefined) updates.description = args.description;

    await ctx.db.patch(args.attachmentId, updates);
    return args.attachmentId;
  },
});

/** Bulk delete multiple attachments. */
export const bulkRemove = mutation({
  args: {
    attachmentIds: v.array(v.id("attachments")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    await Promise.all(
      args.attachmentIds.map(async (id) => {
        const attachment = await ctx.db.get(id);
        if (attachment && attachment.status !== "deleted") {
          await ctx.db.patch(id, { status: "deleted", updatedAt: now });
        }
      }),
    );

    return { removed: args.attachmentIds.length };
  },
});

// ─── Queries ───────────────────────────────────────────────────

/** List attachments for a specific entity. */
export const listByEntity = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    includeArchived: v.optional(v.boolean()),
    category: v.optional(v.union(...CATEGORIES.map((c) => v.literal(c)))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 50;
    const includeArchived = args.includeArchived || false;

    let results = await ctx.db
      .query("attachments")
      .withIndex("by_entity_date", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId),
      )
      .order("desc")
      .take(limit);

    if (!includeArchived) {
      results = results.filter((a) => a.status !== "archived");
    }
    // Always filter out deleted
    results = results.filter((a) => a.status !== "deleted");

    if (args.category) {
      results = results.filter((a) => a.category === args.category);
    }

    return results;
  },
});

/** Get a single attachment by ID. */
export const getById = query({
  args: {
    attachmentId: v.id("attachments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.get(args.attachmentId);
  },
});

/** Get version history for an attachment. */
export const getVersionHistory = query({
  args: {
    attachmentId: v.id("attachments"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 50;
    return await ctx.db
      .query("attachment_versions")
      .withIndex("by_attachment_version", (q) =>
        q.eq("attachmentId", args.attachmentId),
      )
      .order("desc")
      .take(limit);
  },
});

/** Search attachments by file name or original name. */
export const search = query({
  args: {
    query: v.string(),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 50;
    const q = args.query.toLowerCase();

    let results;
    if (args.entityType && args.entityId) {
      results = await ctx.db
        .query("attachments")
        .withIndex("by_entity_date", (q) =>
          q.eq("entityType", args.entityType).eq("entityId", args.entityId),
        )
        .collect();
    } else {
      results = await ctx.db.query("attachments").collect();
    }

    return results
      .filter(
        (a) =>
          a.status !== "deleted" &&
          (a.fileName.toLowerCase().includes(q) ||
            a.originalName.toLowerCase().includes(q) ||
            (a.description || "").toLowerCase().includes(q)),
      )
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },
});

/** Get attachment stats for a given entity. */
export const getEntityStats = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const attachments = await ctx.db
      .query("attachments")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId),
      )
      .collect();

    const active = attachments.filter((a) => a.status === "active");
    const totalSize = active.reduce((sum, a) => sum + a.size, 0);
    const byCategory: Record<string, number> = {};
    const byExtension: Record<string, number> = {};

    for (const a of active) {
      byCategory[a.category] = (byCategory[a.category] || 0) + 1;
      byExtension[a.extension] = (byExtension[a.extension] || 0) + 1;
    }

    return {
      total: attachments.length,
      active: active.length,
      totalSize,
      averageSize: active.length > 0 ? Math.round(totalSize / active.length) : 0,
      byCategory,
      byExtension,
    };
  },
});

/** Get global attachment stats (for dashboard). */
export const getStats = query({
  args: {
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let attachments;
    if (args.organizationId) {
      attachments = await ctx.db
        .query("attachments")
        .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
        .collect();
    } else {
      attachments = await ctx.db.query("attachments").collect();
    }

    const active = attachments.filter((a) => a.status === "active");
    const totalSize = active.reduce((sum, a) => sum + a.size, 0);
    const totalFiles = active.length;

    return {
      totalFiles,
      totalSize,
      averageSize: totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0,
      archived: attachments.filter((a) => a.status === "archived").length,
      deleted: attachments.filter((a) => a.status === "deleted").length,
    };
  },
});
