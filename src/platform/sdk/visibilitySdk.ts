/**
 * Visibility SDK — Enterprise Visibility Service
 *
 * Every business module MUST use this SDK for visibility checks.
 * No module may bypass the visibility engine by querying without scope.
 *
 * Usage:
 *   import { visibilitySdk } from "@/platform/sdk/visibilitySdk";
 *   const allowed = await visibilitySdk.canDiscover(ctx, { userId, category: "lead" });
 */

import { v } from "convex/values";
import { mutation, query } from "../../convex/_generated/server";
import { Id } from "../../convex/_generated/dataModel";

// ─── Types ───────────────────────────────────────────────────────────────

export type VisibilityCategory =
  | "lead" | "student" | "employee" | "faculty" | "parent"
  | "guardian" | "vendor" | "applicant" | "visitor" | "partner"
  | "company" | "document" | "asset" | "finance" | "task"
  | "course" | "batch" | "exam" | "inventory" | "expense";

// ─── SDK Methods ─────────────────────────────────────────────────────────

/**
 * Check if a user can discover records of a given category.
 */
export const canDiscover = query({
  args: {
    userId: v.id("users"),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.isDisabled) return false;
    if (user.role === "super_admin" || user.role === "admin") return true;

    if (user.designationId) {
      const perm = await ctx.db
        .query("categoryPermissions")
        .withIndex("designationId_category", (q) =>
          q.eq("designationId", user.designationId).eq("category", args.category)
        )
        .first();
      if (perm) return perm.canDiscover;
    }

    return false;
  },
});

/**
 * Check if a user can open/view a specific record.
 */
export const canOpen = query({
  args: {
    userId: v.id("users"),
    module: v.string(),
    recordId: v.optional(v.string()),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.isDisabled) return false;
    if (user.role === "super_admin") return true;

    // Check category open permission
    if (user.designationId) {
      const catPerm = await ctx.db
        .query("categoryPermissions")
        .withIndex("designationId_category", (q) =>
          q.eq("designationId", user.designationId).eq("category", args.category)
        )
        .first();
      if (catPerm && !catPerm.canOpen) return false;
    }

    if (!args.recordId) return true;

    // Check record policy
    const policy = await ctx.db
      .query("recordPolicies")
      .withIndex("module_recordId", (q) =>
        q.eq("module", args.module).eq("recordId", args.recordId)
      )
      .first();

    if (!policy) return user.role === "admin" || user.role === "manager";
    if (policy.ownerUserId === args.userId) return true;

    const scopeMatch =
      (policy.departmentId && user.departmentId === policy.departmentId) ||
      (policy.branchId && user.branchId === policy.branchId) ||
      (policy.companyId && user.companyId === policy.companyId);

    return !!scopeMatch;
  },
});

/**
 * Filter record IDs based on user's visibility scope.
 */
export const filterRecords = query({
  args: {
    userId: v.id("users"),
    module: v.string(),
    recordIds: v.array(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.isDisabled) return [];
    if (user.role === "super_admin" || user.role === "admin") return args.recordIds;

    if (args.category) {
      const disc = await canDiscover(ctx, { userId: args.userId, category: args.category });
      if (!disc) return [];
    }

    const allowed: string[] = [];
    for (const recordId of args.recordIds) {
      const policy = await ctx.db
        .query("recordPolicies")
        .withIndex("module_recordId", (q) =>
          q.eq("module", args.module).eq("recordId", recordId)
        )
        .first();

      if (!policy) {
        if (user.role === "manager") allowed.push(recordId);
        continue;
      }

      if (policy.ownerUserId === args.userId) {
        allowed.push(recordId);
        continue;
      }

      const scopeMatch =
        (policy.departmentId && user.departmentId === policy.departmentId) ||
        (policy.branchId && user.branchId === policy.branchId) ||
        (policy.companyId && user.companyId === policy.companyId);

      if (scopeMatch) allowed.push(recordId);
    }

    return allowed;
  },
});

/**
 * Get scope-based record IDs for a user.
 * Returns record IDs from the recordPolicies table that match the user's org scope.
 */
export const getScopeRecordIds = query({
  args: {
    userId: v.id("users"),
    module: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return [];

    const policies = await ctx.db
      .query("recordPolicies")
      .withIndex("module", (q) => q.eq("module", args.module))
      .collect();

    return policies
      .filter((p) => {
        if (p.ownerUserId === args.userId) return true;
        if (p.departmentId && user.departmentId === p.departmentId) return true;
        if (p.branchId && user.branchId === p.branchId) return true;
        if (p.companyId && user.companyId === p.companyId) return true;
        return false;
      })
      .map((p) => p.recordId);
  },
});

/**
 * Get default scope filters for a user based on their role.
 * Returns org hierarchy IDs the user should be scoped to.
 */
export const getDefaultScope = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    if (user.role === "super_admin") {
      return { scope: "global" as const };
    }

    return {
      scope: "scoped" as const,
      companyId: user.companyId,
      branchId: user.branchId,
      departmentId: user.departmentId,
    };
  },
});
