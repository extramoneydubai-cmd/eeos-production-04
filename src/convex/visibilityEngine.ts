import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ─── Types ────────────────────────────────────────────────

type Category =
  | "lead" | "student" | "employee" | "faculty" | "parent"
  | "guardian" | "vendor" | "applicant" | "visitor" | "partner"
  | "company" | "document" | "asset" | "finance";

type SecurityLevel =
  | "public" | "internal" | "confidential"
  | "highly_confidential" | "executive" | "legal_hold";

// ─── Audit Helper ─────────────────────────────────────────

async function logAccessAttempt(
  ctx: any,
  userId: Id<"users"> | undefined,
  module: string,
  action: string,
  result: "granted" | "denied",
  recordId?: string,
  reason?: string,
) {
  const now = Date.now();
  await ctx.db.insert("accessAuditLogs", {
    userId: userId || ("" as any),
    module,
    recordId,
    action,
    result,
    reason,
    timestamp: now,
    createdAt: now,
  });
}

// ─── Core Visibility API ──────────────────────────────────

/**
 * Check if a user can discover records of a given module/category.
 * Discovery = appears in search results, autocomplete, lists, exports.
 */
export const canDiscover = query({
  args: {
    userId: v.id("users"),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.isDisabled) {
      await logAccessAttempt(ctx, args.userId, args.category, "discover", "denied", undefined, "User disabled or not found");
      return false;
    }

    // Super admins can discover everything
    if (user.role === "super_admin") return true;

    // Admins can discover most things
    if (user.role === "admin") return true;

    // Check category-level permissions
    if (user.designationId) {
      const categoryPerm = await ctx.db
        .query("categoryPermissions")
        .withIndex("designationId_category", (q) =>
          q.eq("designationId", user.designationId).eq("category", args.category)
        )
        .first();

      if (categoryPerm) {
        await logAccessAttempt(ctx, args.userId, args.category, "discover", categoryPerm.canDiscover ? "granted" : "denied");
        return categoryPerm.canDiscover;
      }
    }

    // Default deny for non-admin roles
    await logAccessAttempt(ctx, args.userId, args.category, "discover", "denied", undefined, "No explicit discover permission");
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
    if (!user || user.isDisabled) {
      await logAccessAttempt(ctx, args.userId, args.module, "open", "denied", args.recordId, "User disabled");
      return false;
    }

    // Super admins can open everything
    if (user.role === "super_admin") return true;

    // Check category permissions
    if (user.designationId) {
      const categoryPerm = await ctx.db
        .query("categoryPermissions")
        .withIndex("designationId_category", (q) =>
          q.eq("designationId", user.designationId).eq("category", args.category)
        )
        .first();

      if (categoryPerm && !categoryPerm.canOpen) {
        await logAccessAttempt(ctx, args.userId, args.module, "open", "denied", args.recordId, "Category open denied");
        return false;
      }
    }

    // If no recordId, just check category
    if (!args.recordId) {
      await logAccessAttempt(ctx, args.userId, args.module, "open", "granted", args.recordId);
      return true;
    }

    // Check record-level policies
    const recordPolicy = await ctx.db
      .query("recordPolicies")
      .withIndex("module_recordId", (q) =>
        q.eq("module", args.module).eq("recordId", args.recordId)
      )
      .first();

    if (recordPolicy) {
      // Check ownership
      if (recordPolicy.ownerUserId === args.userId) {
        await logAccessAttempt(ctx, args.userId, args.module, "open", "granted", args.recordId, "Record owner");
        return true;
      }

      // Check organization scope
      if (recordPolicy.departmentId && user.departmentId === recordPolicy.departmentId) {
        await logAccessAttempt(ctx, args.userId, args.module, "open", "granted", args.recordId, "Same department");
        return true;
      }
      if (recordPolicy.branchId && user.branchId === recordPolicy.branchId) {
        await logAccessAttempt(ctx, args.userId, args.module, "open", "granted", args.recordId, "Same branch");
        return true;
      }
      if (recordPolicy.companyId && user.companyId === recordPolicy.companyId) {
        await logAccessAttempt(ctx, args.userId, args.module, "open", "granted", args.recordId, "Same company");
        return true;
      }

      // Check policy's security level
      if (recordPolicy.policyId) {
        const policy = await ctx.db.get(recordPolicy.policyId);
        if (policy) {
          if (policy.securityLevel === "executive" && user.role !== "super_admin" && user.role !== "admin") {
            await logAccessAttempt(ctx, args.userId, args.module, "open", "denied", args.recordId, "Executive level policy");
            return false;
          }
          if (policy.securityLevel === "highly_confidential" && user.role === "staff") {
            await logAccessAttempt(ctx, args.userId, args.module, "open", "denied", args.recordId, "Highly confidential");
            return false;
          }
        }
      }
    }

    // Admin can open by default for most records
    if (user.role === "admin" || user.role === "manager") {
      await logAccessAttempt(ctx, args.userId, args.module, "open", "granted", args.recordId);
      return true;
    }

    // Default: staff can open if they have category permission
    if (user.role === "staff") {
      const categoryPerm = await ctx.db
        .query("categoryPermissions")
        .withIndex("designationId_category", (q) =>
          q.eq("designationId", user.designationId).eq("category", args.category)
        )
        .first();

      if (categoryPerm && categoryPerm.canOpen) {
        await logAccessAttempt(ctx, args.userId, args.module, "open", "granted", args.recordId);
        return true;
      }
    }

    await logAccessAttempt(ctx, args.userId, args.module, "open", "denied", args.recordId, "Default deny");
    return false;
  },
});

/**
 * Filter a list of records based on a user's visibility scope.
 * Used by list queries to ensure users only see what they should.
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

    // Super admin sees all
    if (user.role === "super_admin") return args.recordIds;

    // Admin sees all
    if (user.role === "admin") return args.recordIds;

    // Check category discover
    if (args.category) {
      const canDisc = await (canDiscover as any)(ctx, { userId: args.userId, category: args.category });
      if (!canDisc) return [];
    }

    // Check record-level policies for each record
    const allowed: string[] = [];
    for (const recordId of args.recordIds) {
      const recordPolicy = await ctx.db
        .query("recordPolicies")
        .withIndex("module_recordId", (q) =>
          q.eq("module", args.module).eq("recordId", recordId)
        )
        .first();

      if (!recordPolicy) {
        // No policy = default allow for manager+
        if (user.role === "manager") {
          allowed.push(recordId);
        }
        continue;
      }

      // Check ownership
      if (recordPolicy.ownerUserId === args.userId) {
        allowed.push(recordId);
        continue;
      }

      // Check organization scope
      const scopeMatch =
        (recordPolicy.departmentId && user.departmentId === recordPolicy.departmentId) ||
        (recordPolicy.branchId && user.branchId === recordPolicy.branchId) ||
        (recordPolicy.companyId && user.companyId === recordPolicy.companyId);

      if (scopeMatch) {
        allowed.push(recordId);
      }
    }

    return allowed;
  },
});

/**
 * Get visible fields for a user in a given module.
 * Returns field-level permissions including masking rules.
 */
export const filterFields = query({
  args: {
    userId: v.id("users"),
    module: v.string(),
    fieldNames: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.isDisabled) return {};

    // Super admin sees all fields unmasked
    if (user.role === "super_admin") {
      const result: Record<string, { visible: boolean; editable: boolean; masked: boolean }> = {};
      if (args.fieldNames) {
        for (const f of args.fieldNames) {
          result[f] = { visible: true, editable: true, masked: false };
        }
      }
      return result;
    }

    // Get field permissions for this user's designation
    const fieldPerms = await ctx.db
      .query("fieldPermissions")
      .withIndex("designationId_module", (q) =>
        q.eq("designationId", user.designationId).eq("module", args.module)
      )
      .collect();

    const permMap = new Map<string, { visible: boolean; editable: boolean; masked: boolean }>();
    for (const fp of fieldPerms) {
      permMap.set(fp.fieldName, { visible: fp.visible, editable: fp.editable, masked: fp.masked });
    }

    if (args.fieldNames) {
      const result: Record<string, { visible: boolean; editable: boolean; masked: boolean }> = {};
      for (const f of args.fieldNames) {
        const perm = permMap.get(f);
        result[f] = perm || { visible: true, editable: true, masked: false };
      }
      return result;
    }

    // Return all permissions
    const result: Record<string, { visible: boolean; editable: boolean; masked: boolean }> = {};
    for (const [fieldName, perm] of permMap) {
      result[fieldName] = perm;
    }
    return result;
  },
});

/**
 * Apply field masking to a data object.
 * Masks sensitive values according to field permissions.
 */
export function applyFieldMasking(
  data: Record<string, any>,
  fieldPerms: Record<string, { visible: boolean; editable: boolean; masked: boolean }>,
): Record<string, any> {
  const result = { ...data };
  for (const [field, perm] of Object.entries(fieldPerms)) {
    if (!perm.visible) {
      delete result[field];
    } else if (perm.masked && result[field] !== undefined && result[field] !== null) {
      const value = String(result[field]);
      if (value.length <= 4) {
        result[field] = "****";
      } else {
        // Keep first 2 and last 4 chars, mask the rest
        result[field] = value.substring(0, 2) + "*".repeat(Math.min(value.length - 6, 6)) + value.substring(value.length - 4);
      }
    }
  }
  return result;
}

/**
 * Get visible sections for a user in a given module.
 * Filters out sections the user cannot see (e.g., Salary, Medical).
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

    // Super admin sees all
    if (user.role === "super_admin") return args.sectionNames;

    // Get section permissions
    const sectionPerms = await ctx.db
      .query("sectionPermissions")
      .withIndex("designationId_module", (q) =>
        q.eq("designationId", user.designationId).eq("module", args.module)
      )
      .collect();

    const hiddenSections = new Set(
      sectionPerms.filter((sp) => !sp.visible).map((sp) => sp.sectionName)
    );

    return args.sectionNames.filter((s) => !hiddenSections.has(s));
  },
});

/**
 * Check if a user can perform a specific action.
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
    if (!user || user.isDisabled) {
      await logAccessAttempt(ctx, args.userId, args.module, args.action, "denied", args.recordId, "User disabled");
      return false;
    }

    // Super admin can do everything
    if (user.role === "super_admin") return true;

    // Admin can do most actions
    if (user.role === "admin") {
      const restrictedActions = ["delete", "export_all"];
      if (restrictedActions.includes(args.action)) {
        // Check if admin has explicit permission
        if (user.designationId) {
          const actionPerm = await ctx.db
            .query("actionPermissions")
            .withIndex("designationId_module_action", (q) =>
              q.eq("designationId", user.designationId)
                .eq("module", args.module)
                .eq("action", args.action)
            )
            .first();
          if (actionPerm && !actionPerm.allowed) {
            await logAccessAttempt(ctx, args.userId, args.module, args.action, "denied", args.recordId);
            return false;
          }
        }
        return true;
      }
      return true;
    }

    // Check action permissions
    if (user.designationId) {
      const actionPerm = await ctx.db
        .query("actionPermissions")
        .withIndex("designationId_module_action", (q) =>
          q.eq("designationId", user.designationId)
            .eq("module", args.module)
            .eq("action", args.action)
        )
        .first();

      if (actionPerm) {
        await logAccessAttempt(ctx, args.userId, args.module, args.action, actionPerm.allowed ? "granted" : "denied", args.recordId);
        return actionPerm.allowed;
      }
    }

    // Default: deny
    await logAccessAttempt(ctx, args.userId, args.module, args.action, "denied", args.recordId, "No explicit permission");
    return false;
  },
});

/**
 * Get all effective permissions for a user across all modules/categories.
 * Used by Permission Simulator and Access Control Studio.
 */
export const getEffectivePermissions = query({
  args: {
    userId: v.id("users"),
    module: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const result: {
      user: Doc<"users"> | null;
      role: string | undefined;
      designationId: string | undefined;
      categories: Record<string, { canDiscover: boolean; canOpen: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean; canExport: boolean; canPrint: boolean }>;
      fields: Record<string, { visible: boolean; editable: boolean; masked: boolean }[]>;
      sections: string[];
      actions: string[];
    } = {
      user,
      role: user.role,
      designationId: user.designationId,
      categories: {},
      fields: {},
      sections: [],
      actions: [],
    };

    // Get category permissions
    const allCatPerms = await ctx.db.query("categoryPermissions").collect();
    const userCatPerms = allCatPerms.filter((cp) => cp.designationId === user.designationId);
    for (const cp of userCatPerms) {
      result.categories[cp.category] = {
        canDiscover: cp.canDiscover,
        canOpen: cp.canOpen,
        canCreate: cp.canCreate,
        canEdit: cp.canEdit,
        canDelete: cp.canDelete,
        canExport: cp.canExport,
        canPrint: cp.canPrint,
      };
    }

    // Get field permissions
    if (args.module) {
      const fieldPerms = await ctx.db
        .query("fieldPermissions")
        .withIndex("designationId_module", (q) =>
          q.eq("designationId", user.designationId).eq("module", args.module)
        )
        .collect();
      result.fields[args.module] = fieldPerms.map((fp) => ({
        visible: fp.visible,
        editable: fp.editable,
        masked: fp.masked,
        ...(fp as any),
      }));

      // Get section permissions
      const sectionPerms = await ctx.db
        .query("sectionPermissions")
        .withIndex("designationId_module", (q) =>
          q.eq("designationId", user.designationId).eq("module", args.module)
        )
        .collect();
      result.sections = sectionPerms.filter((sp) => sp.visible).map((sp) => sp.sectionName);

      // Get action permissions
      const actionPerms = await ctx.db
        .query("actionPermissions")
        .withIndex("designationId_module_action", (q) =>
          q.eq("designationId", user.designationId).eq("module", args.module)
        )
        .collect();
      result.actions = actionPerms.filter((ap) => ap.allowed).map((ap) => ap.action);
    }

    return result;
  },
});

/**
 * Evaluate full visibility for a user on a specific record.
 * Returns comprehensive access information.
 */
export const evaluateVisibility = query({
  args: {
    userId: v.id("users"),
    module: v.string(),
    recordId: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const canAccess = await (canOpen as any)(ctx, {
      userId: args.userId,
      module: args.module,
      recordId: args.recordId,
      category: args.category || args.module,
    });

    if (!canAccess) {
      return {
        allowed: false,
        reason: "Access denied",
        visibleSections: [],
        visibleFields: {},
        allowedActions: [],
      };
    }

    // Get section visibility
    const allSections: string[] = [
      "overview", "timeline", "documents", "communication",
      "emergency_contacts", "social_media", "relationships",
      "medical", "salary", "finance", "notes",
    ];

    const visibleSections = await (filterSections as any)(ctx, {
      userId: args.userId,
      module: args.module,
      sectionNames: allSections,
    });

    // Get field visibility
    const fieldPerms = await (filterFields as any)(ctx, {
      userId: args.userId,
      module: args.module,
    });

    // Check actions
    const actions = [
      "call", "whatsapp", "email", "download", "export",
      "print", "merge", "delete", "archive", "restore",
      "assign", "share_qr", "generate_qr", "approve", "reject",
    ];

    const allowedActions: string[] = [];
    for (const action of actions) {
      const allowed = await (canPerformAction as any)(ctx, {
        userId: args.userId,
        module: args.module,
        action,
        recordId: args.recordId,
      });
      if (allowed) allowedActions.push(action);
    }

    return {
      allowed: true,
      visibleSections,
      visibleFields: fieldPerms,
      allowedActions,
    };
  },
});
