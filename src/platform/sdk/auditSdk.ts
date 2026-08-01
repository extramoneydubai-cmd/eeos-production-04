/**
 * Audit SDK — Enterprise Audit Trail Service
 *
 * Every business module MUST use this SDK to record audit logs.
 * No module may directly call ctx.db.insert("auditLogs", ...).
 *
 * Usage:
 *   import { auditSdk } from "@/platform/sdk/auditSdk";
 *   await auditSdk.record(ctx, { action: "update", entity: "lead", ... });
 */

import { v } from "convex/values";
import { mutation, query } from "../../convex/_generated/server";
import { Id } from "../../convex/_generated/dataModel";

// ─── Types ───────────────────────────────────────────────────────────────

export interface AuditEntry {
  action: string;
  entity: string;
  entityId?: string;
  userId?: Id<"users">;
  companyId?: Id<"companies">;
  branchId?: Id<"branches">;
  departmentId?: Id<"departments">;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// ─── SDK Methods ─────────────────────────────────────────────────────────

/**
 * Record an audit log entry.
 * Single entry point for ALL audit logging across the platform.
 */
export const record = mutation({
  args: {
    action: v.string(),
    entity: v.string(),
    entityId: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    changes: v.optional(v.string()),
    metadata: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("auditLogs", {
      action: args.action,
      entity: args.entity,
      entityId: args.entityId,
      userId: args.userId,
      companyId: args.companyId,
      branchId: args.branchId,
      departmentId: args.departmentId,
      changes: args.changes ? JSON.parse(args.changes) : undefined,
      metadata: args.metadata ? JSON.parse(args.metadata) : undefined,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      createdAt: now,
    });
  },
});

/**
 * Get audit logs for a specific entity.
 */
export const getEntityLogs = query({
  args: {
    entity: v.string(),
    entityId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("entity_entityId", (q) =>
        q.eq("entity", args.entity).eq("entityId", args.entityId)
      )
      .collect();

    return logs.sort((a, b) => b.createdAt - a.createdAt).slice(0, args.limit || 100);
  },
});

/**
 * Get audit logs for a user.
 */
export const getUserLogs = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();

    return logs.sort((a, b) => b.createdAt - a.createdAt).slice(0, args.limit || 50);
  },
});

/**
 * Convenience: record a CREATE action.
 */
export const recordCreate = mutation({
  args: {
    entity: v.string(),
    entityId: v.string(),
    userId: v.optional(v.id("users")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    await record(ctx, {
      action: "create",
      entity: args.entity,
      entityId: args.entityId,
      userId: args.userId,
      companyId: args.companyId,
      branchId: args.branchId,
      departmentId: args.departmentId,
    });
  },
});

/**
 * Convenience: record an UPDATE action with change diff.
 */
export const recordUpdate = mutation({
  args: {
    entity: v.string(),
    entityId: v.string(),
    changes: v.string(),
    userId: v.optional(v.id("users")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    await record(ctx, {
      action: "update",
      entity: args.entity,
      entityId: args.entityId,
      changes: JSON.parse(args.changes),
      userId: args.userId,
      companyId: args.companyId,
      branchId: args.branchId,
      departmentId: args.departmentId,
    });
  },
});

/**
 * Convenience: record a DELETE action.
 */
export const recordDelete = mutation({
  args: {
    entity: v.string(),
    entityId: v.string(),
    userId: v.optional(v.id("users")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    await record(ctx, {
      action: "delete",
      entity: args.entity,
      entityId: args.entityId,
      userId: args.userId,
      companyId: args.companyId,
      branchId: args.branchId,
      departmentId: args.departmentId,
    });
  },
});

/**
 * Search audit logs with filters.
 */
export const searchLogs = query({
  args: {
    action: v.optional(v.string()),
    entity: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    fromDate: v.optional(v.number()),
    toDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let logs = await ctx.db.query("auditLogs").collect();

    if (args.action) logs = logs.filter((l) => l.action === args.action);
    if (args.entity) logs = logs.filter((l) => l.entity === args.entity);
    if (args.userId) logs = logs.filter((l) => l.userId === args.userId);
    if (args.fromDate) logs = logs.filter((l) => l.createdAt >= args.fromDate!);
    if (args.toDate) logs = logs.filter((l) => l.createdAt <= args.toDate!);

    return logs.sort((a, b) => b.createdAt - a.createdAt).slice(0, args.limit || 100);
  },
});
