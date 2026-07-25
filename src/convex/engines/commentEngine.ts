// @ts-nocheck — This file is type-checked by `npx convex dev`, not by the frontend `tsc`.

/**
 * EEOS Comment Engine (P0)
 *
 * Universal discussion system for every module in the platform.
 * No module should maintain its own comment system.
 *
 * DOC-22 reference: Comment Engine
 * DOC-23 reference: Engine Standards, Naming Standards
 *
 * Features:
 * - Entity-scoped comments (any entity type + entityId)
 * - Threaded replies (parentId + rootId)
 * - Mentions (@user references)
 * - Emoji reactions
 * - Edit, soft-delete, resolve, pin
 * - Visibility scopes (public, internal, private)
 * - Attachment support (via Attachment Engine)
 * - Search and filter
 */

import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "../_generated/server";

const VISIBILITIES = ["public", "internal", "private"] as const;
const SORT_ORDERS = ["newest", "oldest"] as const;

// ─── Mutations ─────────────────────────────────────────────────

/** Create a new top-level comment on an entity. */
export const create = mutation({
  args: {
    body: v.string(),
    bodyHtml: v.optional(v.string()),
    entityType: v.string(),
    entityId: v.string(),
    organizationId: v.optional(v.id("organizations")),
    mentions: v.optional(v.array(v.id("users"))),
    attachmentIds: v.optional(v.array(v.id("attachments"))),
    visibility: v.optional(v.union(v.literal("public"), v.literal("internal"), v.literal("private"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (!args.body.trim()) throw new Error("Comment body cannot be empty");

    const commentId = await ctx.db.insert("comments", {
      body: args.body.trim(),
      bodyHtml: args.bodyHtml,
      entityType: args.entityType,
      entityId: args.entityId,
      userId,
      organizationId: args.organizationId,
      mentions: args.mentions,
      reactions: [],
      attachmentIds: args.attachmentIds,
      isEdited: false,
      isResolved: false,
      isPinned: false,
      visibility: args.visibility || "public",
      createdAt: Date.now(),
    });

    return commentId;
  },
});

/** Reply to an existing comment (threaded). */
export const reply = mutation({
  args: {
    body: v.string(),
    bodyHtml: v.optional(v.string()),
    parentId: v.id("comments"),
    organizationId: v.optional(v.id("organizations")),
    mentions: v.optional(v.array(v.id("users"))),
    attachmentIds: v.optional(v.array(v.id("attachments"))),
    visibility: v.optional(v.union(v.literal("public"), v.literal("internal"), v.literal("private"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (!args.body.trim()) throw new Error("Comment body cannot be empty");

    const parent = await ctx.db.get(args.parentId);
    if (!parent) throw new Error("Parent comment not found");

    // Determine rootId: if parent has a rootId, use it; otherwise use parent's own ID
    const rootId = parent.rootId || parent._id;

    const commentId = await ctx.db.insert("comments", {
      body: args.body.trim(),
      bodyHtml: args.bodyHtml,
      entityType: parent.entityType,
      entityId: parent.entityId,
      parentId: args.parentId,
      rootId,
      userId,
      organizationId: args.organizationId || parent.organizationId,
      mentions: args.mentions,
      reactions: [],
      attachmentIds: args.attachmentIds,
      isEdited: false,
      isResolved: false,
      isPinned: false,
      visibility: args.visibility || parent.visibility,
      createdAt: Date.now(),
    });

    return commentId;
  },
});

/** Edit an existing comment's body. */
export const edit = mutation({
  args: {
    commentId: v.id("comments"),
    body: v.string(),
    bodyHtml: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");
    if (comment.userId !== userId) throw new Error("Not authorized to edit this comment");

    if (!args.body.trim()) throw new Error("Comment body cannot be empty");

    await ctx.db.patch(args.commentId, {
      body: args.body.trim(),
      bodyHtml: args.bodyHtml,
      isEdited: true,
      editedAt: Date.now(),
    });

    return args.commentId;
  },
});

/** Soft-delete a comment (set body to [deleted]). */
export const remove = mutation({
  args: {
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");
    if (comment.userId !== userId) throw new Error("Not authorized to delete this comment");

    await ctx.db.patch(args.commentId, {
      body: "[deleted]",
      bodyHtml: undefined,
      isEdited: true,
      editedAt: Date.now(),
      mentions: undefined,
      reactions: [],
      attachmentIds: undefined,
    });

    return args.commentId;
  },
});

/** Resolve a comment (mark as resolved). */
export const resolve = mutation({
  args: {
    commentId: v.id("comments"),
    resolved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    await ctx.db.patch(args.commentId, {
      isResolved: args.resolved,
      resolvedAt: args.resolved ? Date.now() : undefined,
      resolvedBy: args.resolved ? userId : undefined,
    });

    return args.commentId;
  },
});

/** Pin or unpin a comment. */
export const pin = mutation({
  args: {
    commentId: v.id("comments"),
    pinned: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    await ctx.db.patch(args.commentId, { isPinned: args.pinned });
    return args.commentId;
  },
});

/** Add or remove a reaction emoji on a comment. */
export const toggleReaction = mutation({
  args: {
    commentId: v.id("comments"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    const reactions = comment.reactions || [];
    const existingIndex = reactions.findIndex(
      (r) => r.emoji === args.emoji && r.userId === userId,
    );

    if (existingIndex >= 0) {
      reactions.splice(existingIndex, 1);
    } else {
      reactions.push({ emoji: args.emoji, userId });
    }

    await ctx.db.patch(args.commentId, { reactions });
    return args.commentId;
  },
});

// ─── Queries ───────────────────────────────────────────────────

/** List top-level comments for an entity (with reply counts). */
export const listByEntity = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    limit: v.optional(v.number()),
    pinnedOnly: v.optional(v.boolean()),
    sort: v.optional(v.union(v.literal("newest"), v.literal("oldest"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 50;
    const sort = args.sort || "newest";

    let comments;
    if (args.pinnedOnly) {
      comments = await ctx.db
        .query("comments")
        .withIndex("by_pinned", (q) =>
          q.eq("entityType", args.entityType).eq("entityId", args.entityId).eq("isPinned", true),
        )
        .order("desc")
        .take(limit);
    } else {
      comments = await ctx.db
        .query("comments")
        .withIndex("by_entity_date", (q) =>
          q.eq("entityType", args.entityType).eq("entityId", args.entityId),
        )
        .order(sort === "newest" ? "desc" : "asc")
        .take(limit);
    }

    // Only top-level comments (no parentId)
    const topLevel = comments.filter((c) => !c.parentId);

    // Enrich with reply counts from the full result
    const enriched = await Promise.all(
      topLevel.map(async (comment) => {
        const replies = await ctx.db
          .query("comments")
          .withIndex("by_root", (q) => q.eq("rootId", comment._id))
          .collect();

        const user = comment.userId ? await ctx.db.get(comment.userId) : null;

        return {
          ...comment,
          replyCount: replies.length,
          userName: user?.name || "Unknown",
          userImage: user?.image || null,
        };
      }),
    );

    return enriched;
  },
});

/** Get replies for a specific comment (thread). */
export const getReplies = query({
  args: {
    rootId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const replies = await ctx.db
      .query("comments")
      .withIndex("by_root", (q) => q.eq("rootId", args.rootId))
      .order("asc")
      .collect();

    // Enrich with user info
    const enriched = await Promise.all(
      replies.map(async (reply) => {
        const user = reply.userId ? await ctx.db.get(reply.userId) : null;
        return {
          ...reply,
          userName: user?.name || "Unknown",
          userImage: user?.image || null,
        };
      }),
    );

    return enriched;
  },
});

/** Search comments by body text. */
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
        .query("comments")
        .withIndex("by_entity", (qIdx) =>
          qIdx.eq("entityType", args.entityType).eq("entityId", args.entityId),
        )
        .collect();
    } else {
      results = await ctx.db.query("comments").collect();
    }

    return results
      .filter((c) => c.body.toLowerCase().includes(q) && c.body !== "[deleted]")
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },
});

/** Get comment stats for an entity. */
export const getEntityStats = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const all = await ctx.db
      .query("comments").withIndex("by_entity_date", (q) =>
          q.eq("entityType", args.entityType).eq("entityId", args.entityId),
      )
      .collect();

    const topLevel = all.filter((c) => !c.parentId);
    const replies = all.filter((c) => !!c.parentId);
    const resolved = all.filter((c) => c.isResolved);
    const pinned = all.filter((c) => c.isPinned);
    const active = all.filter((c) => c.body !== "[deleted]");

    return {
      total: all.length,
      topLevel: topLevel.length,
      replies: replies.length,
      resolved: resolved.length,
      pinned: pinned.length,
      active: active.length,
    };
  },
});
