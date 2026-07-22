// @ts-nocheck — This file is type-checked by `npx convex dev`, not by the frontend `tsc`.

/**
 * EEOS Timeline Engine (P0)
 *
 * Unified chronological history for any entity in the platform.
 * Consumes data from: Activity Engine, Comment Engine, Attachment Engine, Notification Engine.
 *
 * DOC-22 reference: Timeline Engine
 * DOC-23 reference: Engine Standards, Naming Standards
 *
 * Features:
 * - Merges multiple source types into a single sorted timeline
 * - Filter by source type (activity, comment, attachment, notification)
 * - Search across all sources
 * - Date-grouped results
 * - Per-entity user preferences
 * - Enriched with user names and metadata
 */

import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "../_generated/server";

const SOURCES = ["activity", "comment", "attachment", "notification"] as const;
type SourceType = (typeof SOURCES)[number];
type TimelineEvent = {
  id: string;
  source: SourceType;
  action: string;
  title: string;
  description?: string;
  userId: string;
  userName?: string;
  userImage?: string | null;
  severity?: string;
  module?: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
};

// ─── Queries ───────────────────────────────────────────────────

/** Get the unified timeline for an entity. Merges, sorts, and enriches events from all sources. */
export const getEntityTimeline = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    limit: v.optional(v.number()),
    sources: v.optional(v.array(v.union(v.literal("activity"), v.literal("comment"), v.literal("attachment"), v.literal("notification")))),
    searchQuery: v.optional(v.string()),
    compact: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 50;
    const activeSources = args.sources || ["activity", "comment", "attachment", "notification"];
    const q = args.searchQuery?.toLowerCase();
    const events: TimelineEvent[] = [];

    // ── Query Activity Engine ──
    if (activeSources.includes("activity")) {
      const activities = await ctx.db
        .query("activity_logs")
        .withIndex("by_entity_date", (idx) =>
          idx.eq("entityType", args.entityType).eq("entityId", args.entityId),
        )
        .order("desc")
        .take(limit);

      for (const a of activities) {
        const user = a.userId ? await ctx.db.get(a.userId) : null;
        const entry: TimelineEvent = {
          id: `activity-${a._id}`,
          source: "activity",
          action: a.action,
          title: a.title,
          description: a.description,
          userId: a.userId,
          userName: user?.name || "Unknown",
          userImage: user?.image,
          severity: a.severity,
          module: a.module,
          metadata: a.metadata as Record<string, unknown> | undefined,
          timestamp: a.createdAt,
        };
        if (!q || entry.title.toLowerCase().includes(q) || (entry.description || "").toLowerCase().includes(q)) {
          events.push(entry);
        }
      }
    }

    // ── Query Comments ──
    if (activeSources.includes("comment")) {
      const comments = await ctx.db
        .query("comments")
        .withIndex("by_entity_date", (idx) =>
          idx.eq("entityType", args.entityType).eq("entityId", args.entityId),
        )
        .order("desc")
        .take(limit);

      for (const c of comments) {
        if (c.body === "[deleted]") continue;
        const user = c.userId ? await ctx.db.get(c.userId) : null;
        const isReply = !!c.parentId;
        const entry: TimelineEvent = {
          id: `comment-${c._id}`,
          source: "comment",
          action: isReply ? "replied" : "commented",
          title: isReply ? "Replied to a comment" : "Added a comment",
          description: c.body.slice(0, 200),
          userId: c.userId,
          userName: user?.name || "Unknown",
          userImage: user?.image,
          metadata: { visibility: c.visibility, isEdited: c.isEdited, isResolved: c.isResolved } as Record<string, unknown>,
          timestamp: c.createdAt,
        };
        if (!q || entry.description?.toLowerCase().includes(q)) {
          events.push(entry);
        }
      }
    }

    // ── Query Attachments ──
    if (activeSources.includes("attachment")) {
      const attachments = await ctx.db
        .query("attachments")
        .withIndex("by_entity_date", (idx) =>
          idx.eq("entityType", args.entityType).eq("entityId", args.entityId),
        )
        .order("desc")
        .take(limit);

      for (const a of attachments) {
        if (a.status === "deleted") continue;
        const user = a.uploadedBy ? await ctx.db.get(a.uploadedBy) : null;
        const entry: TimelineEvent = {
          id: `attachment-${a._id}`,
          source: "attachment",
          action: "uploaded",
          title: `Uploaded ${a.originalName}`,
          description: a.description,
          userId: a.uploadedBy,
          userName: user?.name || "Unknown",
          userImage: user?.image,
          module: a.category,
          metadata: {
            fileName: a.fileName,
            size: a.size,
            extension: a.extension,
            mimeType: a.mimeType,
            category: a.category,
          } as Record<string, unknown>,
          timestamp: a.createdAt,
        };
        if (!q || entry.title.toLowerCase().includes(q) || (entry.description || "").toLowerCase().includes(q)) {
          events.push(entry);
        }
      }
    }

    // ── Query Notifications ──
    if (activeSources.includes("notification")) {
      const notifications = await ctx.db
        .query("notifications")
        .withIndex("by_entity", (idx) =>
          idx.eq("entityType", args.entityType).eq("entityId", args.entityId),
        )
        .order("desc")
        .take(limit);

      for (const n of notifications) {
        if (n.archived) continue;
        const user = n.createdBy ? await ctx.db.get(n.createdBy) : null;
        const entry: TimelineEvent = {
          id: `notification-${n._id}`,
          source: "notification",
          action: n.type,
          title: n.title,
          description: n.message,
          userId: n.createdBy || n.userId,
          userName: user?.name || "System",
          userImage: user?.image,
          severity: n.type === "error" ? "error" : n.type === "warning" ? "warning" : "info",
          module: n.module,
          metadata: { priority: n.priority, read: n.read, type: n.type } as Record<string, unknown>,
          timestamp: n.createdAt,
        };
        if (!q || entry.title.toLowerCase().includes(q) || (entry.description || "").toLowerCase().includes(q)) {
          events.push(entry);
        }
      }
    }

    // Sort by timestamp descending (newest first)
    events.sort((a, b) => b.timestamp - a.timestamp);

    return events.slice(0, limit);
  },
});

/** Get the count of timeline events by source type for an entity. */
export const getSourceCounts = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const [activities, comments, attachments, notifications] = await Promise.all([
      ctx.db
        .query("activity_logs")
        .withIndex("by_entity", (idx) => idx.eq("entityType", args.entityType).eq("entityId", args.entityId))
        .collect(),
      ctx.db
        .query("comments")
        .withIndex("by_entity", (idx) => idx.eq("entityType", args.entityType).eq("entityId", args.entityId))
        .collect(),
      ctx.db
        .query("attachments")
        .withIndex("by_entity", (idx) => idx.eq("entityType", args.entityType).eq("entityId", args.entityId))
        .collect(),
      ctx.db
        .query("notifications")
        .withIndex("by_entity", (idx) => idx.eq("entityType", args.entityType).eq("entityId", args.entityId))
        .collect(),
    ]);

    return {
      activity: activities.filter((a) => a.severity !== "error" || true).length,
      comment: comments.filter((c) => c.body !== "[deleted]").length,
      attachment: attachments.filter((a) => a.status !== "deleted").length,
      notification: notifications.filter((n) => !n.archived).length,
    };
  },
});

// ─── Preferences ─────────────────────────────────────────────

/** Get or create timeline preferences for the current user + entity. */
export const getPreferences = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const prefs = await ctx.db
      .query("timeline_preferences")
      .withIndex("by_entity_user", (idx) =>
        idx.eq("entityType", args.entityType).eq("entityId", args.entityId).eq("userId", userId),
      )
      .first();

    return prefs || { enabledSources: ["activity", "comment", "attachment"], compactView: false };
  },
});

/** Save timeline preferences for the current user + entity. */
export const savePreferences = mutation({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    enabledSources: v.optional(v.array(v.union(v.literal("activity"), v.literal("comment"), v.literal("attachment"), v.literal("notification")))),
    compactView: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("timeline_preferences")
      .withIndex("by_entity_user", (idx) =>
        idx.eq("entityType", args.entityType).eq("entityId", args.entityId).eq("userId", userId),
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        enabledSources: args.enabledSources,
        compactView: args.compactView,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("timeline_preferences", {
        entityType: args.entityType,
        entityId: args.entityId,
        userId,
        enabledSources: args.enabledSources || ["activity", "comment", "attachment"],
        compactView: args.compactView || false,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
