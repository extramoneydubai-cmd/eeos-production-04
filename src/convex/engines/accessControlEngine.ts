// @ts-nocheck — This file is type-checked by `npx convex dev`, not by the frontend `tsc`.

/**
 * EEOS Access Control Engine (P1)
 *
 * Complete RBAC system for the entire platform.
 * Every screen, API, widget, menu, and action consumes this engine.
 *
 * Architecture:
 * - 10 database tables (roles, permissions, permission_groups, role_permissions,
 *   user_roles, feature_flags, studio_permissions, menu_permissions, scope_rules,
 *   designation_roles)
 * - Effective permission calculation (roles + scopes + inheritance)
 * - Scope engine (own → team → department → branch → company → organization → global)
 * - Integration with Activity, Audit, and Notification engines
 * - Feature flag system per role/org/branch
 * - Studio and menu-level access control
 */

import { v } from "convex/values";
import { getUserFromToken } from "../authHelpers";
import { mutation, query } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

// ─── Constants ─────────────────────────────────────────────────

const ACCESS_ACTIONS = [
  "create", "read", "update", "delete",
  "approve", "assign", "export", "import",
  "archive", "restore", "print", "share",
  "custom",
] as const;

const ACCESS_GROUPS = [
  "Platform", "Organization", "CRM", "Sales",
  "Admissions", "Students", "Academic", "Finance",
  "HR", "Tasks", "Workflow", "Reports",
  "Settings", "Technology", "Marketing", "Administration",
] as const;

const SCOPE_LEVELS = ["own", "team", "department", "branch", "company", "organization", "global"] as const;
const SCOPE_HIERARCHY: Record<string, number> = { own: 0, team: 1, department: 2, branch: 3, company: 4, organization: 5, global: 6 };
const FLAG_STATUSES = ["enabled", "disabled", "beta", "hidden", "coming_soon"] as const;
const MENU_VISIBILITIES = ["visible", "hidden", "disabled", "readonly"] as const;

// ─── Helper ────────────────────────────────────────────────────

// Resolve the acting user via the app's real auth (custom sessions table):
// a session token is authoritative when present; otherwise we accept the
// client-declared userId (matches withScopeAndEvents' fallback for SDK/system
// flows). Returns null only when neither is supplied.
async function requireAuth(
  ctx: any,
  args?: { token?: string; userId?: string }
): Promise<Id<"users"> | null> {
  const token = typeof args?.token === "string" && args.token.length > 0 ? args.token : undefined;
  if (token) {
    const user = await getUserFromToken(ctx, token);
    if (user) return user._id;
    throw new Error("Session expired or invalid — authentication required");
  }
  const declared = typeof args?.userId === "string" ? (args.userId as Id<"users">) : undefined;
  if (declared) return declared;
  return null;
}

function now(): number {
  return Date.now();
}

function logActivityAndNotify(ctx, args: {
  userId: Id<"users">;
  title: string;
  description?: string;
  module?: string;
  entityType?: string;
  entityId?: string;
  severity?: "info" | "warning" | "error";
  metadata?: any;
}): Promise<void> {
  // Fire-and-forget via ctx.scheduler.runAfter(0, ...)
  // For now, just inline the activity log
  return ctx.db.insert("activity_logs", {
    entityType: args.entityType || "access_control",
    entityId: args.entityId || "system",
    module: args.module || "access_control",
    action: "permission_changed",
    title: args.title,
    description: args.description,
    userId: args.userId,
    severity: args.severity || "info",
    visibility: "internal",
    metadata: args.metadata,
    createdAt: now(),
  });
}

// ═══════════════════════════════════════════════════════════════
//  ROLES
// ═══════════════════════════════════════════════════════════════

export const createRole = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
    isSystem: v.optional(v.boolean()),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, args);
    const id = await ctx.db.insert("roles", {
      name: args.name,
      code: args.code.toUpperCase().replace(/\s+/g, "_"),
      description: args.description,
      organizationId: args.organizationId,
      isSystem: args.isSystem || false,
      isActive: true,
      priority: args.priority || 0,
      createdBy: userId,
      createdAt: now(),
    });
    await logActivityAndNotify(ctx, { userId, title: `Role created: ${args.name}`, description: `Role code: ${args.code}`, metadata: { roleId: id } });
    return id;
  },
});

export const updateRole = mutation({
  args: {
    roleId: v.id("roles"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, args);
    const existing = await ctx.db.get(args.roleId);
    if (!existing) throw new Error("Role not found");
    const updates: Record<string, any> = { updatedAt: now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.priority !== undefined) updates.priority = args.priority;
    await ctx.db.patch(args.roleId, updates);
    await logActivityAndNotify(ctx, { userId, title: `Role updated: ${existing.name}`, metadata: { roleId: args.roleId, changes: updates } });
    return args.roleId;
  },
});

export const deleteRole = mutation({
  args: { roleId: v.id("roles") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, args);
    const role = await ctx.db.get(args.roleId);
    if (!role) throw new Error("Role not found");
    if (role.isSystem) throw new Error("Cannot delete system roles");
    // Remove all associated permissions, user_roles, etc.
    const rolePerms = await ctx.db.query("role_permissions").withIndex("by_role", (q) => q.eq("roleId", args.roleId)).collect();
    await Promise.all(rolePerms.map((rp) => ctx.db.delete(rp._id)));
    const userRoles = await ctx.db.query("user_roles").withIndex("by_role", (q) => q.eq("roleId", args.roleId)).collect();
    await Promise.all(userRoles.map((ur) => ctx.db.delete(ur._id)));
    await ctx.db.delete(args.roleId);
    await logActivityAndNotify(ctx, { userId, title: `Role deleted: ${role.name}` });
  },
});

export const listRoles = query({
  args: { organizationId: v.optional(v.id("organizations")), includeInactive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args);
    let roles;
    if (args.organizationId) {
      roles = await ctx.db.query("roles").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).collect();
    } else {
      roles = await ctx.db.query("roles").collect();
    }
    if (!args.includeInactive) roles = roles.filter((r) => r.isActive);
    return roles.sort((a, b) => a.priority - b.priority);
  },
});

export const getRole = query({
  args: { roleId: v.id("roles") },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args);
    return await ctx.db.get(args.roleId);
  },
});

// ═══════════════════════════════════════════════════════════════
//  PERMISSION GROUPS
// ═══════════════════════════════════════════════════════════════

export const createPermissionGroup = mutation({
  args: {
    name: v.union(...ACCESS_GROUPS.map((g) => v.literal(g))),
    description: v.optional(v.string()),
    order: v.number(),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, args);
    const id = await ctx.db.insert("permission_groups", {
      name: args.name,
      description: args.description,
      order: args.order,
      icon: args.icon,
      isActive: true,
      createdAt: now(),
    });
    await logActivityAndNotify(ctx, { userId, title: `Permission group created: ${args.name}` });
    return id;
  },
});

export const listPermissionGroups = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const groups = await ctx.db.query("permission_groups").collect();
    return groups.filter((g) => g.isActive).sort((a, b) => a.order - b.order);
  },
});

// ═══════════════════════════════════════════════════════════════
//  PERMISSIONS
// ═══════════════════════════════════════════════════════════════

export const createPermission = mutation({
  args: {
    module: v.string(),
    entity: v.string(),
    action: v.union(...ACCESS_ACTIONS.map((a) => v.literal(a))),
    name: v.string(),
    description: v.optional(v.string()),
    groupId: v.optional(v.id("permission_groups")),
    isSystem: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, args);
    const id = await ctx.db.insert("permissions", {
      module: args.module,
      entity: args.entity,
      action: args.action,
      name: args.name || `${args.module}:${args.entity}:${args.action}`,
      description: args.description,
      groupId: args.groupId,
      isSystem: args.isSystem || false,
      createdAt: now(),
    });
    return id;
  },
});

export const bulkCreatePermissions = mutation({
  args: {
    permissions: v.array(v.object({
      module: v.string(),
      entity: v.string(),
      action: v.union(...ACCESS_ACTIONS.map((a) => v.literal(a))),
      name: v.optional(v.string()),
      groupId: v.optional(v.id("permission_groups")),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, args);
    const ids = await Promise.all(
      args.permissions.map((p) =>
        ctx.db.insert("permissions", {
          module: p.module,
          entity: p.entity,
          action: p.action,
          name: p.name || `${p.module}:${p.entity}:${p.action}`,
          groupId: p.groupId,
          isSystem: true,
          createdAt: now(),
        }),
      ),
    );
    await logActivityAndNotify(ctx, { userId, title: `${ids.length} permissions created`, metadata: { count: ids.length } });
    return ids;
  },
});

export const listPermissions = query({
  args: {
    groupId: v.optional(v.id("permission_groups")),
    module: v.optional(v.string()),
    entity: v.optional(v.string()),
    action: v.optional(v.union(...ACCESS_ACTIONS.map((a) => v.literal(a)))),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args);
    let permissions;
    if (args.groupId) {
      permissions = await ctx.db.query("permissions").withIndex("by_group", (q) => q.eq("groupId", args.groupId)).collect();
    } else {
      permissions = await ctx.db.query("permissions").collect();
    }
    if (args.module) permissions = permissions.filter((p) => p.module === args.module);
    if (args.entity) permissions = permissions.filter((p) => p.entity === args.entity);
    if (args.action) permissions = permissions.filter((p) => p.action === args.action);
    return permissions;
  },
});

export const deletePermission = mutation({
  args: { permissionId: v.id("permissions") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, args);
    const perm = await ctx.db.get(args.permissionId);
    if (!perm) throw new Error("Permission not found");
    // Remove related role_permissions
    const rps = await ctx.db.query("role_permissions").withIndex("by_permission", (q) => q.eq("permissionId", args.permissionId)).collect();
    await Promise.all(rps.map((rp) => ctx.db.delete(rp._id)));
    await ctx.db.delete(args.permissionId);
    await logActivityAndNotify(ctx, { userId, title: `Permission deleted: ${perm.name}` });
  },
});

// ═══════════════════════════════════════════════════════════════
//  ROLE-PERMISSION ASSIGNMENT
// ═══════════════════════════════════════════════════════════════

export const assignPermissionToRole = mutation({
  args: {
    roleId: v.id("roles"),
    permissionId: v.id("permissions"),
    scope: v.optional(v.union(...SCOPE_LEVELS.map((s) => v.literal(s)))),
    granted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, args);
    const existing = await ctx.db.query("role_permissions")
      .withIndex("by_role_permission", (q) => q.eq("roleId", args.roleId).eq("permissionId", args.permissionId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { scope: args.scope || "own", granted: args.granted ?? true });
      return existing._id;
    }
    const id = await ctx.db.insert("role_permissions", {
      roleId: args.roleId,
      permissionId: args.permissionId,
      scope: args.scope || "own",
      granted: args.granted ?? true,
      createdBy: userId,
      createdAt: now(),
    });
    return id;
  },
});

export const removePermissionFromRole = mutation({
  args: { rolePermissionId: v.id("role_permissions") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, args);
    const rp = await ctx.db.get(args.rolePermissionId);
    if (!rp) throw new Error("Role-permission not found");
    await ctx.db.delete(args.rolePermissionId);
  },
});

export const listRolePermissions = query({
  args: { roleId: v.id("roles") },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args);
    const rps = await ctx.db.query("role_permissions").withIndex("by_role", (q) => q.eq("roleId", args.roleId)).collect();
    const permissionIds = rps.map((rp) => rp.permissionId);
    const permissions = await Promise.all(permissionIds.map((id) => ctx.db.get(id)));
    return rps.map((rp, i) => ({ ...rp, permission: permissions[i] }));
  },
});

export const bulkAssignPermissions = mutation({
  args: {
    roleId: v.id("roles"),
    permissionIds: v.array(v.id("permissions")),
    scope: v.optional(v.union(...SCOPE_LEVELS.map((s) => v.literal(s)))),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, args);
    let count = 0;
    for (const permId of args.permissionIds) {
      const existing = await ctx.db.query("role_permissions")
        .withIndex("by_role_permission", (q) => q.eq("roleId", args.roleId).eq("permissionId", permId))
        .first();
      if (!existing) {
        await ctx.db.insert("role_permissions", {
          roleId: args.roleId,
          permissionId: permId,
          scope: args.scope || "own",
          granted: true,
          createdBy: userId,
          createdAt: now(),
        });
        count++;
      }
    }
    await logActivityAndNotify(ctx, { userId, title: `${count} permissions assigned to role`, metadata: { roleId: args.roleId, count } });
    return { assigned: count };
  },
});

// ═══════════════════════════════════════════════════════════════
//  USER-ROLE ASSIGNMENT
// ═══════════════════════════════════════════════════════════════

export const assignRoleToUser = mutation({
  args: {
    userId: v.id("users"),
    roleId: v.id("roles"),
    organizationId: v.optional(v.id("organizations")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    teamId: v.optional(v.id("teams")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuth(ctx, args);
    const existing = await ctx.db.query("user_roles")
      .withIndex("by_user_role", (q) => q.eq("userId", args.userId).eq("roleId", args.roleId))
      .first();
    if (existing) return existing._id;
    const id = await ctx.db.insert("user_roles", {
      userId: args.userId,
      roleId: args.roleId,
      organizationId: args.organizationId,
      branchId: args.branchId,
      departmentId: args.departmentId,
      teamId: args.teamId,
      assignedBy: currentUserId,
      isActive: true,
      createdAt: now(),
    });
    const role = await ctx.db.get(args.roleId);
    await logActivityAndNotify(ctx, { userId: currentUserId, title: `Role "${role?.name}" assigned to user`, metadata: { targetUserId: args.userId, roleId: args.roleId } });
    return id;
  },
});

export const removeRoleFromUser = mutation({
  args: { userRoleId: v.id("user_roles") },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, args);
    await ctx.db.delete(args.userRoleId);
  },
});

export const listUserRoles = query({
  args: { userId: v.optional(v.id("users")), organizationId: v.optional(v.id("organizations")) },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args);
    let userRoles;
    if (args.userId) {
      userRoles = await ctx.db.query("user_roles").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    } else if (args.organizationId) {
      userRoles = await ctx.db.query("user_roles").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).collect();
    } else {
      userRoles = await ctx.db.query("user_roles").collect();
    }
    userRoles = userRoles.filter((ur) => ur.isActive);
    // Enrich with role info
    const enriched = await Promise.all(
      userRoles.map(async (ur) => {
        const role = await ctx.db.get(ur.roleId);
        const user = await ctx.db.get(ur.userId);
        return { ...ur, role, userName: user?.name, userEmail: user?.email };
      }),
    );
    return enriched;
  },
});

// ═══════════════════════════════════════════════════════════════
//  EFFECTIVE PERMISSION CALCULATION
// ═══════════════════════════════════════════════════════════════

export const getUserEffectivePermissions = query({
  args: { targetUserId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuth(ctx, args);
    const targetId = args.targetUserId || currentUserId;

    // Get user's roles
    const userRoles = await ctx.db.query("user_roles")
      .withIndex("by_user", (q) => q.eq("userId", targetId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get all role-permissions for these roles
    const roleIds = userRoles.map((ur) => ur.roleId);
    const allRolePerms: any[] = [];
    for (const roleId of roleIds) {
      const rps = await ctx.db.query("role_permissions")
        .withIndex("by_role", (q) => q.eq("roleId", roleId))
        .collect();
      allRolePerms.push(...rps);
    }

    // Enrich with permission details
    const enriched = await Promise.all(
      allRolePerms.map(async (rp) => {
        const perm = await ctx.db.get(rp.permissionId);
        return { ...rp, permission: perm };
      }),
    );

    // Calculate effective permissions (highest scope wins)
    const effectiveMap: Record<string, { permission: any; scope: string; granted: boolean }> = {};
    for (const item of enriched) {
      if (!item.permission) continue;
      const key = `${item.permission.module}:${item.permission.entity}:${item.permission.action}`;
      const existing = effectiveMap[key];
      if (!existing || SCOPE_HIERARCHY[item.scope] > SCOPE_HIERARCHY[existing.scope]) {
        effectiveMap[key] = { permission: item.permission, scope: item.scope, granted: item.granted };
      }
    }

    return {
      userId: targetId,
      roles: await Promise.all(roleIds.map((id) => ctx.db.get(id))),
      permissions: Object.entries(effectiveMap).map(([key, val]) => ({ key, ...val })),
    };
  },
});

export const checkPermission = query({
  args: {
    module: v.string(),
    entity: v.string(),
    action: v.union(...ACCESS_ACTIONS.map((a) => v.literal(a))),
    targetUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await requireAuth(ctx, args);
    const targetId = args.targetUserId || currentUserId;

    const effective = await getUserEffectivePermissions(ctx, { targetUserId: targetId });
    const key = `${args.module}:${args.entity}:${args.action}`;
    const match = effective.permissions.find((p) => p.key === key);
    return {
      granted: match ? match.granted : false,
      scope: match?.scope || "own",
      permission: match?.permission || null,
    };
  },
});

// ═══════════════════════════════════════════════════════════════
//  SCOPE RULES
// ═══════════════════════════════════════════════════════════════

export const setScopeRule = mutation({
  args: {
    roleId: v.id("roles"),
    entityType: v.string(),
    defaultScope: v.union(...SCOPE_LEVELS.map((s) => v.literal(s))),
    maxScope: v.optional(v.union(...SCOPE_LEVELS.map((s) => v.literal(s)))),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, args);
    const existing = await ctx.db.query("scope_rules")
      .withIndex("by_role_entity", (q) => q.eq("roleId", args.roleId).eq("entityType", args.entityType))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { defaultScope: args.defaultScope, maxScope: args.maxScope || args.defaultScope });
      return existing._id;
    }
    const id = await ctx.db.insert("scope_rules", {
      roleId: args.roleId,
      entityType: args.entityType,
      defaultScope: args.defaultScope,
      maxScope: args.maxScope || args.defaultScope,
      createdBy: userId,
      createdAt: now(),
    });
    return id;
  },
});

export const listScopeRules = query({
  args: { roleId: v.optional(v.id("roles")) },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args);
    if (args.roleId) {
      return await ctx.db.query("scope_rules").withIndex("by_role", (q) => q.eq("roleId", args.roleId)).collect();
    }
    return await ctx.db.query("scope_rules").collect();
  },
});

// ═══════════════════════════════════════════════════════════════
//  FEATURE FLAGS
// ═══════════════════════════════════════════════════════════════

export const createFeatureFlag = mutation({
  args: {
    key: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(...FLAG_STATUSES.map((s) => v.literal(s))),
    roleId: v.optional(v.id("roles")),
    organizationId: v.optional(v.id("organizations")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, args);
    const id = await ctx.db.insert("feature_flags", {
      key: args.key,
      name: args.name,
      description: args.description,
      status: args.status,
      roleId: args.roleId,
      organizationId: args.organizationId,
      branchId: args.branchId,
      isActive: true,
      createdBy: userId,
      createdAt: now(),
    });
    return id;
  },
});

export const updateFeatureFlag = mutation({
  args: {
    flagId: v.id("feature_flags"),
    status: v.optional(v.union(...FLAG_STATUSES.map((s) => v.literal(s)))),
    isActive: v.optional(v.boolean()),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, args);
    const existing = await ctx.db.get(args.flagId);
    if (!existing) throw new Error("Feature flag not found");
    const updates: Record<string, any> = { updatedAt: now() };
    if (args.status !== undefined) updates.status = args.status;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    await ctx.db.patch(args.flagId, updates);
    return args.flagId;
  },
});

export const deleteFeatureFlag = mutation({
  args: { flagId: v.id("feature_flags") },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args);
    await ctx.db.delete(args.flagId);
  },
});

export const listFeatureFlags = query({
  args: {
    roleId: v.optional(v.id("roles")),
    organizationId: v.optional(v.id("organizations")),
    status: v.optional(v.union(...FLAG_STATUSES.map((s) => v.literal(s)))),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args);
    let flags;
    if (args.roleId) {
      flags = await ctx.db.query("feature_flags").withIndex("by_role", (q) => q.eq("roleId", args.roleId)).collect();
    } else if (args.organizationId) {
      flags = await ctx.db.query("feature_flags").withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId)).collect();
    } else {
      flags = await ctx.db.query("feature_flags").collect();
    }
    if (args.status) flags = flags.filter((f) => f.status === args.status);
    return flags.filter((f) => f.isActive);
  },
});

export const checkFeatureFlag = query({
  args: {
    key: v.string(),
    roleId: v.optional(v.id("roles")),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args);
    let flags = await ctx.db.query("feature_flags").withIndex("by_key", (q) => q.eq("key", args.key)).collect();
    if (args.roleId) flags = flags.filter((f) => f.roleId === args.roleId || !f.roleId);
    if (args.organizationId) flags = flags.filter((f) => f.organizationId === args.organizationId || !f.organizationId);
    const activeFlag = flags.find((f) => f.isActive);
    if (!activeFlag) return { exists: false, status: "disabled" as const };
    return { exists: true, status: activeFlag.status };
  },
});

// ═══════════════════════════════════════════════════════════════
//  STUDIO PERMISSIONS
// ═══════════════════════════════════════════════════════════════

export const setStudioPermission = mutation({
  args: {
    studioId: v.string(),
    roleId: v.id("roles"),
    canAccess: v.boolean(),
    canConfigure: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, args);
    const existing = await ctx.db.query("studio_permissions")
      .withIndex("by_studio_role", (q) => q.eq("studioId", args.studioId).eq("roleId", args.roleId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { canAccess: args.canAccess, canConfigure: args.canConfigure ?? existing.canConfigure });
      return existing._id;
    }
    const id = await ctx.db.insert("studio_permissions", {
      studioId: args.studioId,
      roleId: args.roleId,
      canAccess: args.canAccess,
      canConfigure: args.canConfigure || false,
      createdBy: userId,
      createdAt: now(),
    });
    return id;
  },
});

export const listStudioPermissions = query({
  args: { roleId: v.optional(v.id("roles")) },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args);
    if (args.roleId) {
      return await ctx.db.query("studio_permissions").withIndex("by_role", (q) => q.eq("roleId", args.roleId)).collect();
    }
    return await ctx.db.query("studio_permissions").collect();
  },
});

export const checkStudioAccess = query({
  args: { studioId: v.string(), roleId: v.optional(v.id("roles")) },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args);
    const perm = await ctx.db.query("studio_permissions")
      .withIndex("by_studio", (q) => q.eq("studioId", args.studioId))
      .first();
    if (!perm) return { canAccess: true, canConfigure: false }; // Default: access allowed
    if (args.roleId && perm.roleId !== args.roleId) return { canAccess: true, canConfigure: false };
    return { canAccess: perm.canAccess, canConfigure: perm.canConfigure };
  },
});

// ═══════════════════════════════════════════════════════════════
//  MENU PERMISSIONS
// ═══════════════════════════════════════════════════════════════

export const setMenuPermission = mutation({
  args: {
    menuKey: v.string(),
    roleId: v.id("roles"),
    visibility: v.union(v.literal("visible"), v.literal("hidden"), v.literal("disabled"), v.literal("readonly")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, args);
    const existing = await ctx.db.query("menu_permissions")
      .withIndex("by_menu_role", (q) => q.eq("menuKey", args.menuKey).eq("roleId", args.roleId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { visibility: args.visibility });
      return existing._id;
    }
    const id = await ctx.db.insert("menu_permissions", {
      menuKey: args.menuKey,
      roleId: args.roleId,
      visibility: args.visibility,
      createdBy: userId,
      createdAt: now(),
    });
    return id;
  },
});

export const listMenuPermissions = query({
  args: { roleId: v.optional(v.id("roles")) },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args);
    if (args.roleId) {
      return await ctx.db.query("menu_permissions").withIndex("by_role", (q) => q.eq("roleId", args.roleId)).collect();
    }
    return await ctx.db.query("menu_permissions").collect();
  },
});

export const checkMenuVisibility = query({
  args: { menuKey: v.string(), roleId: v.id("roles") },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args);
    const perm = await ctx.db.query("menu_permissions")
      .withIndex("by_menu_role", (q) => q.eq("menuKey", args.menuKey).eq("roleId", args.roleId))
      .first();
    if (!perm) return { visibility: "visible" as const };
    return { visibility: perm.visibility };
  },
});

// ═══════════════════════════════════════════════════════════════
//  DESIGNATION-ROLE MAPPING
// ═══════════════════════════════════════════════════════════════

export const setDesignationRole = mutation({
  args: {
    designation: v.string(),
    roleId: v.id("roles"),
    organizationId: v.optional(v.id("organizations")),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx, args);
    const existing = await ctx.db.query("designation_roles")
      .withIndex("by_designation_org", (q) => q.eq("designation", args.designation).eq("organizationId", args.organizationId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { roleId: args.roleId, isDefault: args.isDefault ?? existing.isDefault });
      return existing._id;
    }
    const id = await ctx.db.insert("designation_roles", {
      designation: args.designation,
      roleId: args.roleId,
      organizationId: args.organizationId,
      isDefault: args.isDefault || false,
      createdBy: userId,
      createdAt: now(),
    });
    return id;
  },
});

export const listDesignationRoles = query({
  args: { designation: v.optional(v.string()), organizationId: v.optional(v.id("organizations")) },
  handler: async (ctx, args) => {
    await requireAuth(ctx, args);
    if (args.designation) {
      return await ctx.db.query("designation_roles").withIndex("by_designation", (q) => q.eq("designation", args.designation)).collect();
    }
    return await ctx.db.query("designation_roles").collect();
  },
});

// ═══════════════════════════════════════════════════════════════
//  DASHBOARD / STATS
// ═══════════════════════════════════════════════════════════════

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const roles = await ctx.db.query("roles").collect();
    const permissions = await ctx.db.query("permissions").collect();
    const userRoles = await ctx.db.query("user_roles").collect();
    const featureFlags = await ctx.db.query("feature_flags").collect();
    const groups = await ctx.db.query("permission_groups").collect();
    return {
      totalRoles: roles.filter((r) => r.isActive).length,
      totalPermissions: permissions.length,
      totalAssignments: userRoles.filter((r) => r.isActive).length,
      totalFeatureFlags: featureFlags.filter((f) => f.isActive).length,
      totalGroups: groups.filter((g) => g.isActive).length,
      systemRoles: roles.filter((r) => r.isSystem).length,
    };
  },
});
