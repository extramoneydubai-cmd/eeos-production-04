/**
 * Permission SDK — Enterprise Permission Service
 *
 * Every business module MUST use this SDK for permission checks.
 * No module may bypass the permission engine.
 *
 * Usage:
 *   import { permissionSdk } from "@/platform/sdk/permissionSdk";
 *   const perms = await permissionSdk.getFieldPermissions(ctx, { designationId, module });
 */

import { v } from "convex/values";
import { mutation, query } from "../../convex/_generated/server";
import { Id } from "../../convex/_generated/dataModel";

// ─── SDK Methods ─────────────────────────────────────────────────────────

/**
 * Check if a user can perform a specific action in a module.
 */
export const canPerformAction = query({
  args: {
    userId: v.id("users"),
    module: v.string(),
    action: v.string(),
    recordId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.isDisabled) return false;
    if (user.role === "super_admin") return true;

    if (user.role === "admin") {
      if (["delete", "export_all"].includes(args.action)) {
        if (user.designationId) {
          const perm = await ctx.db
            .query("actionPermissions")
            .withIndex("designationId_module_action", (q) =>
              q.eq("designationId", user.designationId)
                .eq("module", args.module)
                .eq("action", args.action)
            )
            .first();
          if (perm && !perm.allowed) return false;
        }
      }
      return true;
    }

    if (user.designationId) {
      const perm = await ctx.db
        .query("actionPermissions")
        .withIndex("designationId_module_action", (q) =>
          q.eq("designationId", user.designationId)
            .eq("module", args.module)
            .eq("action", args.action)
        )
        .first();
      if (perm) return perm.allowed;
    }

    return false;
  },
});

/**
 * Get field-level permissions for a designation and module.
 */
export const getFieldPermissions = query({
  args: {
    designationId: v.id("designations"),
    module: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("fieldPermissions")
      .withIndex("designationId_module", (q) =>
        q.eq("designationId", args.designationId).eq("module", args.module)
      )
      .collect();
  },
});

/**
 * Apply field-level masking to a data record.
 */
export function applyFieldMasking(
  data: Record<string, unknown>,
  fieldPerms: Record<string, { visible: boolean; editable: boolean; masked: boolean }>,
): Record<string, unknown> {
  const result = { ...data };
  for (const [field, perm] of Object.entries(fieldPerms)) {
    if (!perm.visible) {
      delete result[field];
    } else if (perm.masked && result[field] !== undefined && result[field] !== null) {
      const value = String(result[field]);
      if (value.length <= 4) {
        result[field] = "****";
      } else {
        result[field] = value.substring(0, 2) + "*".repeat(Math.min(value.length - 6, 6)) + value.substring(value.length - 4);
      }
    }
  }
  return result;
}

/**
 * Set a field permission for a designation and module.
 */
export const setFieldPermission = mutation({
  args: {
    designationId: v.id("designations"),
    module: v.string(),
    fieldName: v.string(),
    visible: v.optional(v.boolean()),
    editable: v.optional(v.boolean()),
    masked: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("fieldPermissions")
      .withIndex("designationId_module", (q) =>
        q.eq("designationId", args.designationId).eq("module", args.module)
      )
      .filter((q) => q.eq(q.field("fieldName"), args.fieldName))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        visible: args.visible !== undefined ? args.visible : existing.visible,
        editable: args.editable !== undefined ? args.editable : existing.editable,
        masked: args.masked !== undefined ? args.masked : existing.masked,
        updatedAt: now,
      });
      return existing._id;
    }

    return ctx.db.insert("fieldPermissions", {
      designationId: args.designationId,
      module: args.module,
      fieldName: args.fieldName,
      visible: args.visible !== undefined ? args.visible : true,
      editable: args.editable !== undefined ? args.editable : true,
      masked: args.masked !== undefined ? args.masked : false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Get all section-level permissions for a designation and module.
 */
export const getSectionPermissions = query({
  args: {
    designationId: v.id("designations"),
    module: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("sectionPermissions")
      .withIndex("designationId_module", (q) =>
        q.eq("designationId", args.designationId).eq("module", args.module)
      )
      .collect();
  },
});

/**
 * Check which sections of a module are visible to a user.
 */
export const filterSections = query({
  args: {
    userId: v.id("users"),
    module: v.string(),
    sectionNames: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.isDisabled) return args.sectionNames;
    if (user.role === "super_admin") return args.sectionNames;

    const sectionPerms = await ctx.db
      .query("sectionPermissions")
      .withIndex("designationId_module", (q) =>
        q.eq("designationId", user.designationId).eq("module", args.module)
      )
      .collect();

    const hidden = new Set(sectionPerms.filter((sp) => !sp.visible).map((sp) => sp.sectionName));
    return args.sectionNames.filter((s) => !hidden.has(s));
  },
});

/**
 * Get all effective permissions for a user across all modules.
 * Used by Access Control Studio.
 */
export const getEffectivePermissions = query({
  args: {
    userId: v.id("users"),
    module: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const result: Record<string, unknown> = {
      userId: args.userId,
      role: user.role,
      designationId: user.designationId,
      categories: {},
    };

    const catPerms = await ctx.db.query("categoryPermissions").collect();
    const userCatPerms = catPerms.filter((cp) => cp.designationId === user.designationId);
    for (const cp of userCatPerms) {
      (result.categories as Record<string, unknown>)[cp.category] = {
        canDiscover: cp.canDiscover,
        canOpen: cp.canOpen,
        canCreate: cp.canCreate,
        canEdit: cp.canEdit,
        canDelete: cp.canDelete,
        canExport: cp.canExport,
        canPrint: cp.canPrint,
      };
    }

    if (args.module) {
      result.fieldPermissions = await getFieldPermissions(ctx, {
        designationId: user.designationId as Id<"designations">,
        module: args.module,
      });
    }

    return result;
  },
});

/**
 * Seed default field permissions for a new designation.
 */
export const seedDefaultPermissions = mutation({
  args: { designationId: v.id("designations") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sensitiveFields: Array<{
      module: string; fieldName: string; visible: boolean;
      editable: boolean; masked: boolean;
    }> = [
      { module: "person", fieldName: "phone", visible: true, editable: false, masked: true },
      { module: "person", fieldName: "email", visible: true, editable: false, masked: true },
      { module: "person", fieldName: "aadhaarNumber", visible: false, editable: false, masked: true },
      { module: "employee", fieldName: "salary", visible: false, editable: false, masked: true },
      { module: "employee", fieldName: "bankDetails", visible: false, editable: false, masked: true },
      { module: "employee", fieldName: "medicalInfo", visible: false, editable: false, masked: true },
      { module: "student", fieldName: "parentPhone", visible: false, editable: false, masked: true },
    ];

    for (const field of sensitiveFields) {
      await ctx.db.insert("fieldPermissions", {
        designationId: args.designationId,
        module: field.module,
        fieldName: field.fieldName,
        visible: field.visible,
        editable: field.editable,
        masked: field.masked,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});
