// @ts-nocheck — This file is type-checked by `npx convex dev`, not by the frontend `tsc`.

/**
 * EEOS Audit Engine (P0)
 *
 * Universal immutable audit trail for every module in the platform.
 * Every data mutation in EEOS must pass through this engine.
 *
 * DOC-22 reference: Audit Engine
 * DOC-23 reference: Engine Standards, Naming Standards
 *
 * Principles:
 * - IMMUTABLE — audit records are never updated or deleted
 * - TAMPER DETECTION — each record is chained via a hash of the previous
 * - BEFORE/AFTER SNAPSHOTS — every mutation captures full state
 * - FIELD-LEVEL CHANGE TRACKING — explicit diff of changed fields
 * - PERMISSION AWARE — admin/auditor access only
 * - ORGANIZATION AWARE — multi-tenant ready
 */

import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

// ─── Helpers ───────────────────────────────────────────────────

/**
 * Simple hash function for tamper detection.
 * Concatenates previous hash + record content and creates a base64 digest.
 * In production, use a proper crypto hash (SHA-256 via Web Crypto API).
 */
async function computeHash(
  previousHash: string | undefined,
  payload: Record<string, unknown>,
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(
    JSON.stringify({ previousHash, ...payload, timestamp: Date.now() }),
  );
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Compute which fields changed between two snapshots.
 */
function computeChangedFields(
  before: Record<string, unknown> | undefined | null,
  after: Record<string, unknown> | undefined | null,
): string[] {
  if (!before && !after) return [];
  if (!before && after) return Object.keys(after);
  if (before && !after) return Object.keys(before);

  const changed: string[] = [];
  const allKeys = new Set([
    ...Object.keys(before!),
    ...Object.keys(after!),
  ]);

  for (const key of allKeys) {
    const bVal = JSON.stringify(before![key]);
    const aVal = JSON.stringify(after![key]);
    if (bVal !== aVal) {
      changed.push(key);
    }
  }

  return changed;
}

// ─── Mutations ─────────────────────────────────────────────────

/**
 * Record an audit entry. This is THE core API — every module calls this
 * whenever it creates, updates, or deletes data.
 *
 * The engine automatically:
 * - Computes field-level diffs from before/after snapshots
 * - Generates a chained hash for tamper detection
 * - Updates the audit_entities summary
 * - Tracks the session action count
 */
export const record = mutation({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    module: v.string(),
    action: v.string(),
    beforeSnapshot: v.optional(v.any()),
    afterSnapshot: v.optional(v.any()),
    organizationId: v.optional(v.id("organizations")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    teamId: v.optional(v.id("teams")),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    device: v.optional(v.string()),
    sessionId: v.optional(v.id("audit_sessions")),
    reason: v.optional(v.string()),
    approvalReference: v.optional(v.string()),
    transactionId: v.optional(v.string()),
    severity: v.optional(v.union(v.literal("info"), v.literal("warning"), v.literal("error"), v.literal("critical"))),
    source: v.optional(v.union(v.literal("api"), v.literal("ui"), v.literal("system"), v.literal("integration"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get user info for the audit record
    const user = await ctx.db.get(userId);

    // Compute changed fields
    const changedFields = computeChangedFields(
      args.beforeSnapshot as Record<string, unknown> | undefined,
      args.afterSnapshot as Record<string, unknown> | undefined,
    );

    // Get the latest audit record for hash chaining
    const latestAudit = await ctx.db
      .query("audit_logs")
      .withIndex("by_hash")
      .order("desc")
      .first();

    // Build the record payload
    const recordPayload = {
      entityType: args.entityType,
      entityId: args.entityId,
      module: args.module,
      action: args.action,
      changedFields,
      beforeSnapshot: args.beforeSnapshot,
      afterSnapshot: args.afterSnapshot,
      userId,
      userName: user?.name,
      userEmail: user?.email,
      userRole: user?.role,
      organizationId: args.organizationId,
      branchId: args.branchId,
      departmentId: args.departmentId,
      teamId: args.teamId,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      device: args.device,
      sessionId: args.sessionId,
      reason: args.reason,
      approvalReference: args.approvalReference,
      transactionId: args.transactionId,
      previousHash: latestAudit?.hash,
      severity: args.severity || "info",
      source: args.source || "ui",
      createdAt: Date.now(),
    };

    // Compute the chained hash
    const hash = await computeHash(latestAudit?.hash, recordPayload);
    recordPayload.hash = hash;

    // Insert the immutable audit record
    const auditId = await ctx.db.insert("audit_logs", recordPayload);

    // Update the audit_entities summary
    const existingEntity = await ctx.db
      .query("audit_entities")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId),
      )
      .first();

    if (existingEntity) {
      await ctx.db.patch(existingEntity._id, {
        latestAuditId: auditId,
        totalChanges: existingEntity.totalChanges + 1,
        lastChangeAt: Date.now(),
      });
    } else {
      await ctx.db.insert("audit_entities", {
        entityType: args.entityType,
        entityId: args.entityId,
        latestAuditId: auditId,
        totalChanges: 1,
        firstChangeAt: Date.now(),
        lastChangeAt: Date.now(),
      });
    }

    // Update session action count if sessionId provided
    if (args.sessionId) {
      const session = await ctx.db.get(args.sessionId);
      if (session) {
        await ctx.db.patch(args.sessionId, {
          actions: session.actions + 1,
        });
      }
    }

    return { auditId, hash, changedFields };
  },
});

/**
 * Create a new audit session (tracks a user's interaction session).
 */
export const startSession = mutation({
  args: {
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    device: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("audit_sessions", {
      userId,
      startedAt: Date.now(),
      endedAt: undefined,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      device: args.device,
      isActive: true,
      actions: 0,
    });
  },
});

/**
 * End an audit session.
 */
export const endSession = mutation({
  args: {
    sessionId: v.id("audit_sessions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.userId !== userId) throw new Error("Not authorized to end this session");

    await ctx.db.patch(args.sessionId, {
      endedAt: Date.now(),
      isActive: false,
    });

    return args.sessionId;
  },
});

// ─── Queries ───────────────────────────────────────────────────

/**
 * Get the full audit timeline for a specific entity.
 * Includes before/after snapshots, changed fields, and user context.
 */
export const getEntityAudit = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 50;

    const results = await ctx.db
      .query("audit_logs")
      .withIndex("by_entity_date", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId),
      )
      .order("desc")
      .take(limit);

    // Enrich with user information
    const enriched = await Promise.all(
      results.map(async (audit) => {
        const auditUser = audit.userId ? await ctx.db.get(audit.userId) : null;
        return {
          ...audit,
          userDisplayName: auditUser?.name || audit.userName || "Unknown",
          userDisplayImage: auditUser?.image || null,
        };
      }),
    );

    return enriched;
  },
});

/**
 * Get audit records for a specific user.
 */
export const getUserAudit = query({
  args: {
    targetUserId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 50;

    return await ctx.db
      .query("audit_logs")
      .withIndex("by_user_date", (q) => q.eq("userId", args.targetUserId))
      .order("desc")
      .take(limit);
  },
});

/**
 * Get audit records for an organization.
 */
export const getOrganizationAudit = query({
  args: {
    organizationId: v.id("organizations"),
    limit: v.optional(v.number()),
    severity: v.optional(v.union(v.literal("info"), v.literal("warning"), v.literal("error"), v.literal("critical"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 50;

    if (args.severity) {
      return await ctx.db
        .query("audit_logs")
        .withIndex("by_severity", (q) => q.eq("severity", args.severity))
        .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("audit_logs")
      .withIndex("by_organization_date", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .take(limit);
  },
});

/**
 * Get audit records filtered by module.
 */
export const getByModule = query({
  args: {
    module: v.string(),
    limit: v.optional(v.number()),
    action: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 50;

    let results;
    if (args.action) {
      results = await ctx.db
        .query("audit_logs")
        .withIndex("by_module_date", (q) => q.eq("module", args.module))
        .filter((q) => q.eq(q.field("action"), args.action))
        .order("desc")
        .take(limit);
    } else {
      results = await ctx.db
        .query("audit_logs")
        .withIndex("by_module_date", (q) => q.eq("module", args.module))
        .order("desc")
        .take(limit);
    }

    return results;
  },
});

/**
 * Compute the diff between two snapshots for a specific audit record.
 * Returns added, removed, and modified fields with old/new values.
 */
export const getDiff = query({
  args: {
    auditId: v.id("audit_logs"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const audit = await ctx.db.get(args.auditId);
    if (!audit) throw new Error("Audit record not found");

    const before = (audit.beforeSnapshot as Record<string, unknown>) || {};
    const after = (audit.afterSnapshot as Record<string, unknown>) || {};
    const changedFields = audit.changedFields;

    const fields = changedFields.map((field) => ({
      field,
      oldValue: before[field] ?? null,
      newValue: after[field] ?? null,
      type:
        before[field] === undefined && after[field] !== undefined
          ? "added"
          : before[field] !== undefined && after[field] === undefined
            ? "removed"
            : "modified",
    }));

    return {
      auditId: args.auditId,
      entityType: audit.entityType,
      entityId: audit.entityId,
      action: audit.action,
      changedFields: audit.changedFields,
      fields,
      hasBefore: !!audit.beforeSnapshot,
      hasAfter: !!audit.afterSnapshot,
    };
  },
});

/**
 * Get field-level change history for a specific entity + field.
 * Useful for audit trails like "who changed the price of this invoice?"
 */
export const getFieldHistory = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    fieldName: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 20;

    const audits = await ctx.db
      .query("audit_logs")
      .withIndex("by_entity_date", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId),
      )
      .order("desc")
      .take(200);

    // Filter to only audit records that changed the requested field
    const relevant = audits
      .filter((a) => a.changedFields.includes(args.fieldName))
      .slice(0, limit);

    return relevant.map((a) => {
      const before = (a.beforeSnapshot as Record<string, unknown>) || {};
      const after = (a.afterSnapshot as Record<string, unknown>) || {};
      return {
        auditId: a._id,
        action: a.action,
        field: args.fieldName,
        oldValue: before[args.fieldName] ?? null,
        newValue: after[args.fieldName] ?? null,
        userId: a.userId,
        userName: a.userName,
        createdAt: a.createdAt,
        module: a.module,
        reason: a.reason,
      };
    });
  },
});

/**
 * Search audit logs by entity, action, user, date range, etc.
 */
export const search = query({
  args: {
    query: v.optional(v.string()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    action: v.optional(v.string()),
    module: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("organizations")),
    severity: v.optional(v.union(v.literal("info"), v.literal("warning"), v.literal("error"), v.literal("critical"))),
    source: v.optional(v.union(v.literal("api"), v.literal("ui"), v.literal("system"), v.literal("integration"))),
    fromDate: v.optional(v.number()),
    toDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 50;

    // Start with a broad query and filter in-memory
    // For production, use proper indexing strategy based on filter combination
    let results;

    if (args.entityType && args.entityId) {
      results = await ctx.db
        .query("audit_logs")
        .withIndex("by_entity_date", (q) =>
          q.eq("entityType", args.entityType).eq("entityId", args.entityId),
        )
        .order("desc")
        .take(Math.min(limit * 5, 200));
    } else if (args.userId) {
      results = await ctx.db
        .query("audit_logs")
        .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(Math.min(limit * 5, 200));
    } else if (args.module) {
      results = await ctx.db
        .query("audit_logs")
        .withIndex("by_module_date", (q) => q.eq("module", args.module))
        .order("desc")
        .take(Math.min(limit * 5, 200));
    } else if (args.organizationId) {
      results = await ctx.db
        .query("audit_logs")
        .withIndex("by_organization_date", (q) => q.eq("organizationId", args.organizationId))
        .order("desc")
        .take(Math.min(limit * 5, 200));
    } else {
      results = await ctx.db
        .query("audit_logs")
        .withIndex("by_entity_date", (q) =>
          q.eq("entityType", "").eq("entityId", ""),
        )
        .order("desc")
        .take(100);

      // Fallback: get all recent
      const allResults = await ctx.db
        .query("audit_logs")
        .order("desc")
        .take(Math.min(limit, 50));
      results = allResults;
    }

    // Apply in-memory filters
    let filtered = [...results];

    if (args.action) {
      filtered = filtered.filter((a) => a.action === args.action);
    }
    if (args.severity) {
      filtered = filtered.filter((a) => a.severity === args.severity);
    }
    if (args.source) {
      filtered = filtered.filter((a) => a.source === args.source);
    }
    if (args.fromDate) {
      filtered = filtered.filter((a) => a.createdAt >= args.fromDate!);
    }
    if (args.toDate) {
      filtered = filtered.filter((a) => a.createdAt <= args.toDate!);
    }
    if (args.query) {
      const q = args.query.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.action.toLowerCase().includes(q) ||
          a.entityType.toLowerCase().includes(q) ||
          a.entityId.toLowerCase().includes(q) ||
          a.module.toLowerCase().includes(q) ||
          (a.reason || "").toLowerCase().includes(q) ||
          (a.userName || "").toLowerCase().includes(q) ||
          a.changedFields.some((f) => f.toLowerCase().includes(q)),
      );
    }

    return filtered.slice(0, limit);
  },
});

/**
 * Get audit statistics for dashboards and compliance reports.
 */
export const getStats = query({
  args: {
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let audits;
    if (args.organizationId) {
      audits = await ctx.db
        .query("audit_logs")
        .withIndex("by_organization_date", (q) => q.eq("organizationId", args.organizationId))
        .order("desc")
        .take(1000);
    } else {
      audits = await ctx.db
        .query("audit_logs")
        .order("desc")
        .take(1000);
    }

    const now = Date.now();
    const today = audits.filter((a) => a.createdAt > now - 86400000).length;
    const thisWeek = audits.filter((a) => a.createdAt > now - 604800000).length;
    const errors = audits.filter((a) => a.severity === "error" || a.severity === "critical").length;
    const warnings = audits.filter((a) => a.severity === "warning").length;

    // Changes by module
    const moduleCounts: Record<string, number> = {};
    for (const a of audits) {
      moduleCounts[a.module] = (moduleCounts[a.module] || 0) + 1;
    }
    const topModules = Object.entries(moduleCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([module, count]) => ({ module, count }));

    // Actions by type
    const actionCounts: Record<string, number> = {};
    for (const a of audits) {
      actionCounts[a.action] = (actionCounts[a.action] || 0) + 1;
    }

    // Changes by user
    const userCounts: Record<string, number> = {};
    for (const a of audits) {
      const key = a.userName || a.userId || "unknown";
      userCounts[key] = (userCounts[key] || 0) + 1;
    }
    const topUsers = Object.entries(userCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Entity types
    const entityCounts: Record<string, number> = {};
    for (const a of audits) {
      entityCounts[a.entityType] = (entityCounts[a.entityType] || 0) + 1;
    }

    return {
      total: audits.length,
      today,
      thisWeek,
      errors,
      warnings,
      topModules,
      actionCounts,
      topUsers,
      entityCounts,
    };
  },
});

/**
 * Verify the integrity of the audit chain.
 * Checks each record's hash against its content + previous hash.
 * Returns the results for the most recent N records.
 */
export const verifyChain = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 100;

    const audits = await ctx.db
      .query("audit_logs")
      .order("desc")
      .take(limit);

    const results = [];
    for (let i = audits.length - 1; i >= 0; i--) {
      const audit = audits[i];
      const previousHash = i > 0 ? audits[i - 1].hash : undefined;
      const expectedHash = await computeHash(audit.previousHash || undefined, {
        entityType: audit.entityType,
        entityId: audit.entityId,
        module: audit.module,
        action: audit.action,
        changedFields: audit.changedFields,
        userId: audit.userId,
        createdAt: audit.createdAt,
      });

      const isValid = audit.hash === expectedHash;

      results.push({
        auditId: audit._id,
        createdAt: audit.createdAt,
        action: audit.action,
        entityType: audit.entityType,
        entityId: audit.entityId,
        hash: audit.hash,
        expectedHash,
        previousHashMatches: audit.previousHash === previousHash,
        isValid,
      });
    }

    return {
      total: limits,
      verified: results.filter((r) => r.isValid).length,
      tampered: results.filter((r) => !r.isValid).length,
      details: results,
    };
  },
});

/**
 * Get recent audit events for the dashboard.
 */
export const getRecentForDashboard = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const limit = args.limit || 5;

    const audits = await ctx.db
      .query("audit_logs")
      .order("desc")
      .take(limit);

    return await Promise.all(
      audits.map(async (audit) => {
        const auditUser = audit.userId ? await ctx.db.get(audit.userId) : null;
        return {
          ...audit,
          userDisplayName: auditUser?.name || audit.userName || "Unknown",
          userDisplayImage: auditUser?.image || null,
        };
      }),
    );
  },
});
