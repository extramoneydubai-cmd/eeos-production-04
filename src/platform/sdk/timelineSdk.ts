/**
 * Timeline SDK — Enterprise Timeline Service
 *
 * Every business module MUST use this SDK to record timeline events.
 * No module may directly call ctx.db.insert("timelineEvents", ...).
 *
 * Usage:
 *   import { timelineSdk } from "@/platform/sdk/timelineSdk";
 *   await timelineSdk.recordEvent(ctx, { module: "crm", eventType: "lead_created", ... });
 */

import { v } from "convex/values";
import { mutation } from "../../convex/_generated/server";
import { Doc, Id } from "../../convex/_generated/dataModel";

// ─── Types ───────────────────────────────────────────────────────────────

export interface TimelineEventInput {
  module: string;
  eventType: string;
  entityType: string;
  entityId: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  performedBy?: Id<"users">;
  companyId?: Id<"companies">;
  branchId?: Id<"branches">;
  departmentId?: Id<"departments">;
}

// ─── SDK Methods ─────────────────────────────────────────────────────────

/**
 * Record a new timeline event.
 * Delegates to the timeline engine. All modules use this single entry point.
 */
export const recordEvent = mutation({
  args: {
    module: v.string(),
    eventType: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    metadata: v.optional(v.string()),
    performedBy: v.optional(v.id("users")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("timelineEvents", {
      module: args.module,
      eventType: args.eventType,
      entityType: args.entityType,
      entityId: args.entityId,
      title: args.title,
      description: args.description,
      metadata: args.metadata ? JSON.parse(args.metadata) : undefined,
      performedBy: args.performedBy,
      companyId: args.companyId,
      branchId: args.branchId,
      departmentId: args.departmentId,
      createdAt: now,
    });
  },
});

/**
 * Get timeline events for an entity.
 */
export const getEntityTimeline = mutation({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("timelineEvents")
      .withIndex("entityType_entityId", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .collect();

    return events
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, args.limit || 50);
  },
});

/**
 * Convenience: record a lead event.
 */
export const recordLeadEvent = mutation({
  args: {
    leadId: v.id("leads"),
    eventType: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    performedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("timelineEvents", {
      module: "crm",
      eventType: args.eventType,
      entityType: "lead",
      entityId: args.leadId,
      title: args.title,
      description: args.description,
      performedBy: args.performedBy,
      createdAt: Date.now(),
    });
  },
});

/**
 * Convenience: record a student event.
 */
export const recordStudentEvent = mutation({
  args: {
    studentId: v.id("students"),
    eventType: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    performedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("timelineEvents", {
      module: "student",
      eventType: args.eventType,
      entityType: "student",
      entityId: args.studentId,
      title: args.title,
      description: args.description,
      performedBy: args.performedBy,
      createdAt: Date.now(),
    });
  },
});

/**
 * Convenience: record a task event.
 */
export const recordTaskEvent = mutation({
  args: {
    taskId: v.id("tasks"),
    eventType: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    performedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("timelineEvents", {
      module: "tasks",
      eventType: args.eventType,
      entityType: "task",
      entityId: args.taskId,
      title: args.title,
      description: args.description,
      performedBy: args.performedBy,
      createdAt: Date.now(),
    });
  },
});
