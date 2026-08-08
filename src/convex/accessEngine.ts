/**
 * AccessEngine — Unified Enterprise Governance Layer
 *
 * Combines ScopeEngine, GovernanceEngine, VisibilityEngine,
 * FieldSecurity, RecordScope, and accessControlEngine into ONE API.
 *
 * Every query/mutation/dashboard/report/export in the platform
 * must call the appropriate AccessEngine method.
 *
 * Nothing bypasses this engine.
 */

import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { ScopeEngine } from "./scopeEngine";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ─── Scope Types ───────────────────────────────────────────────

export type AccessScope =
  | "platform" | "group" | "department" | "company" | "branch"
  | "team" | "user" | "vertical" | "subVertical" | "board"
  | "course" | "batch" | "class" | "section" | "academicSession"
  | "subject";

export type AccessAction =
  | "create" | "read" | "update" | "delete" | "approve" | "reject"
  | "export" | "print" | "share" | "assign" | "transfer" | "merge"
  | "restore" | "archive" | "import" | "sync" | "duplicate"
  | "lock" | "unlock" | "viewAnalytics" | "viewFinancial"
  | "viewReports" | "viewAudit" | "viewDocuments" | "viewTimeline"
  | "viewNotifications" | "manage";

export interface AccessCheckResult {
  granted: boolean;
  scope: AccessScope;
  level: "none" | "view" | "edit" | "admin";
  reason?: string;
}

// ─── Module Definitions ────────────────────────────────────────

export const ALL_MODULES = [
  "crm", "students", "faculty", "finance", "hr", "academic",
  "examinations", "admissions", "marketing", "support",
  "procurement", "inventory", "lms", "scheduling", "analytics",
  "reports", "documents", "settings", "dashboard",
  "communications", "workflow", "automation", "search",
  "security", "admin",
] as const;

export const ALL_ACTIONS: readonly AccessAction[] = [
  "create", "read", "update", "delete", "approve", "reject",
  "export", "print", "share", "assign", "transfer", "merge",
  "restore", "archive", "import", "sync", "duplicate",
  "lock", "unlock", "viewAnalytics", "viewFinancial",
  "viewReports", "viewAudit", "viewDocuments", "viewTimeline",
  "viewNotifications", "manage",
] as const;

export const ALL_SCOPES: readonly AccessScope[] = [
  "platform", "group", "department", "company", "branch",
  "team", "user", "vertical", "subVertical", "board",
  "course", "batch", "class", "section", "academicSession", "subject",
] as const;

// ─── Effective Permission Result ───────────────────────────────

export interface EffectivePermission {
  module: string;
  actions: Record<string, boolean>;
  scope: AccessScope;
  source: "role" | "inherited" | "designation" | "subscription" | "default";
}

export interface EffectivePermissionsResult {
  userId: Id<"users">;
  user: Doc<"users"> | null;
  roles: string[];
  permissions: EffectivePermission[];
  scopeLevel: string;
  companyId?: string;
  branchId?: string;
  departmentId?: string;
  summary: {
    totalGranted: number;
    totalDenied: number;
    modulesWithAccess: number;
  };
}

// ─── AccessEngine Class ────────────────────────────────────────

export class AccessEngine {
  private ctx: QueryCtx;
  private userId: Id<"users">;
  private user: Doc<"users"> | null = null;
  private scope: Awaited<ReturnType<typeof ScopeEngine.forUser>> | null = null;

  private constructor(ctx: QueryCtx, userId: Id<"users">) {
    this.ctx = ctx;
    this.userId = userId;
  }

  static async create(ctx: QueryCtx, userId: Id<"users">): Promise<AccessEngine> {
    const engine = new AccessEngine(ctx, userId);
    engine.user = await ctx.db.get(userId);
    engine.scope = await ScopeEngine.forUser(ctx, userId);
    return engine;
  }

  // ─── Primary Permission Checks ───────────────────────────────

  async canAccess(module: string, action: AccessAction, entity?: Record<string, string>): Promise<AccessCheckResult> {
    if (!this.user || this.scope === null) {
      return { granted: false, scope: "user", level: "none", reason: "User not found" };
    }

    const userAny = this.user as any;
    if (userAny.role === "super_admin") {
      return { granted: true, scope: "platform", level: "admin", reason: "Super admin" };
    }

    // Check role-based permissions from accessControlEngine
    try {
      const rolePerms = await this.ctx.db.query("rolePermissions")
        .filter((q: any) => q.eq(q.field("granted"), true))
        .collect();

      // Get user's roles
      const userRoles = await this.ctx.db.query("userRoles")
        .filter((q: any) => q.eq(q.field("userId"), this.userId))
        .filter((q: any) => q.eq(q.field("isActive"), true))
        .collect();

      const roleIds = userRoles.map((ur: any) => ur.roleId);

      // Check each role's permissions
      for (const rp of rolePerms) {
        if (!roleIds.includes(rp.roleId)) continue;
        const perm = await this.ctx.db.get(rp.permissionId);
        if (!perm) continue;
        if (perm.module === module && perm.action === action) {
          return {
            granted: rp.granted,
            scope: rp.scope as AccessScope,
            level: rp.granted ? "edit" : "none",
            reason: rp.granted ? "Role permission granted" : "Role permission denied",
          };
        }
      }
    } catch { /* Table may not exist yet */ }

    // Fallback: check ScopeEngine
    const scopeCheck = this.scope!.accessLevel(entity || {});
    return {
      granted: scopeCheck !== "none",
      scope: (this.scope!.getScope()?.scopeLevel || "user") as AccessScope,
      level: scopeCheck,
      reason: scopeCheck === "none" ? "Scope denied" : "Scope granted",
    };
  }

  async canRead(entity: Record<string, string>): Promise<AccessCheckResult> {
    if (!this.scope) return { granted: false, scope: "user", level: "none", reason: "No scope" };
    return { granted: this.scope.canRead(entity), scope: "branch", level: this.scope.canDelete(entity) ? "admin" : "view", reason: "ScopeEngine" };
  }

  async canWrite(entity: Record<string, string>): Promise<AccessCheckResult> {
    if (!this.scope) return { granted: false, scope: "user", level: "none", reason: "No scope" };
    return { granted: this.scope.canWrite(entity), scope: "branch", level: "edit", reason: "ScopeEngine" };
  }

  async canApprove(entity: Record<string, string>): Promise<AccessCheckResult> {
    if (!this.scope) return { granted: false, scope: "user", level: "none", reason: "No scope" };
    return { granted: this.scope.canApprove(entity), scope: "company", level: "admin", reason: "ScopeEngine" };
  }

  async canDelete(entity: Record<string, string>): Promise<AccessCheckResult> {
    if (!this.scope) return { granted: false, scope: "user", level: "none", reason: "No scope" };
    return { granted: this.scope.canDelete(entity), scope: "company", level: "admin", reason: "ScopeEngine" };
  }

  async canViewDashboard(dashboardId: string): Promise<AccessCheckResult> {
    return this.canAccess("dashboard", "read", { dashboardId });
  }

  async canViewReports(module: string): Promise<AccessCheckResult> {
    return this.canAccess(module, "viewReports");
  }

  async canViewField(module: string, field: string): Promise<{ visible: boolean; editable: boolean; masked: boolean }> {
    try {
      const fieldPerms = await this.ctx.db.query("fieldPermissions")
        .withIndex("designationId_module", (q: any) =>
          q.eq("designationId", (this.user as any)?.designationId || "").eq("module", module)
        )
        .filter((q: any) => q.eq(q.field("fieldName"), field))
        .first();
      if (fieldPerms) {
        return { visible: fieldPerms.visible, editable: fieldPerms.editable, masked: fieldPerms.masked };
      }
    } catch { /* skip */ }
    return { visible: true, editable: true, masked: false };
  }

  async canExecuteWorkflow(workflowId: string): Promise<AccessCheckResult> {
    return this.canAccess("workflow", "manage", { workflowId });
  }

  // ─── Effective Permissions ───────────────────────────────────

  async getEffectivePermissions(): Promise<EffectivePermissionsResult> {
    const modulesWithAccess: string[] = [];
    const permissions: EffectivePermission[] = [];

    for (const module of ALL_MODULES) {
      const modulePerms: Record<string, boolean> = {};
      let grantedCount = 0;

      for (const action of ALL_ACTIONS) {
        const result = await this.canAccess(module, action);
        modulePerms[action] = result.granted;
        if (result.granted) grantedCount++;
      }

      if (grantedCount > 0) modulesWithAccess.push(module);

      permissions.push({
        module,
        actions: modulePerms,
        scope: "company",
        source: "role",
      });
    }

    const userAny = this.user as any;

    return {
      userId: this.userId,
      user: this.user,
      roles: userAny.role ? [userAny.role] : [],
      permissions,
      scopeLevel: this.scope?.getScope()?.scopeLevel || "self",
      companyId: userAny.companyId,
      branchId: userAny.branchId,
      departmentId: userAny.departmentId,
      summary: {
        totalGranted: permissions.reduce((s, p) => s + Object.values(p.actions).filter(Boolean).length, 0),
        totalDenied: permissions.reduce((s, p) => s + Object.values(p.actions).filter(a => !a).length, 0),
        modulesWithAccess: modulesWithAccess.length,
      },
    };
  }

  // ─── Conflict Detection ──────────────────────────────────────

  async detectConflicts(): Promise<{
    duplicates: number;
    circularPermissions: number;
    invalidScopes: number;
    missingDependencies: number;
    details: string[];
  }> {
    const details: string[] = [];
    let duplicates = 0, circularPermissions = 0, invalidScopes = 0, missingDependencies = 0;

    try {
      // Check duplicate role-permission assignments
      const rps = await this.ctx.db.query("rolePermissions").collect();
      const seen = new Set<string>();
      for (const rp of rps) {
        const key = `${rp.roleId}:${rp.permissionId}`;
        if (seen.has(key)) { duplicates++; details.push(`Duplicate: role=${rp.roleId}, permission=${rp.permissionId}`); }
        seen.add(key);
      }

      // Check for invalid scopes
      const validScopes = new Set(ALL_SCOPES);
      for (const rp of rps) {
        if (!validScopes.has(rp.scope as AccessScope)) {
          invalidScopes++; details.push(`Invalid scope: ${rp.scope} on permission=${rp.permissionId}`);
        }
      }

      // Check user roles without matching role definitions
      const userRoles = await this.ctx.db.query("userRoles").collect();
      const roles = await this.ctx.db.query("roles").collect();
      const roleIds = new Set(roles.map((r: any) => r._id));
      for (const ur of userRoles) {
        if (!roleIds.has(ur.roleId)) {
          missingDependencies++; details.push(`Orphan user_role: userId=${ur.userId}, roleId=${ur.roleId} (role missing)`);
        }
      }

      // Check role_permissions without matching permission definitions
      const perms = await this.ctx.db.query("permissions").collect();
      const permIds = new Set(perms.map((p: any) => p._id));
      for (const rp of rps) {
        if (!permIds.has(rp.permissionId)) {
          missingDependencies++; details.push(`Orphan role_permission: role=${rp.roleId}, permission=${rp.permissionId} (perm missing)`);
        }
      }
    } catch { /* Tables may not exist yet */ }

    return { duplicates, circularPermissions, invalidScopes, missingDependencies, details };
  }
}

// ═══════════════════════════════════════════════════════════════
//  CONVEX API — Wraps AccessEngine for frontend consumption
// ═══════════════════════════════════════════════════════════════

export const checkModuleAccess = query({
  args: { userId: v.id("users"), module: v.string(), action: v.union(...ALL_ACTIONS.map(a => v.literal(a))) },
  handler: async (ctx, args) => {
    const engine = await AccessEngine.create(ctx, args.userId);
    return engine.canAccess(args.module, args.action);
  },
});

export const checkRead = query({
  args: { userId: v.id("users"), companyId: v.optional(v.string()), branchId: v.optional(v.string()), departmentId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const engine = await AccessEngine.create(ctx, args.userId);
    return engine.canRead(args);
  },
});

export const getEffectivePermissions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const engine = await AccessEngine.create(ctx, args.userId);
    return engine.getEffectivePermissions();
  },
});

export const detectConflicts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const engine = await AccessEngine.create(ctx, args.userId);
    return engine.detectConflicts();
  },
});

export const getOrganizationTree = query({
  args: {},
  handler: async (ctx) => {
    const companies = await ctx.db.query("companies").collect();
    const branches = await ctx.db.query("branches").collect();
    const departments = await ctx.db.query("departments").collect();
    const teams = await ctx.db.query("teams").collect();

    return companies.map((c: any) => ({
      id: c._id,
      type: "company" as const,
      name: c.name,
      code: c.code,
      children: branches
        .filter((b: any) => (b as any).companyId === c._id)
        .map((b: any) => ({
          id: b._id,
          type: "branch" as const,
          name: b.name,
          children: departments
            .filter((d: any) => (d as any).branchId === b._id)
            .map((d: any) => ({
              id: d._id,
              type: "department" as const,
              name: d.name,
              children: teams
                .filter((t: any) => (t as any).departmentId === d._id)
                .map((t: any) => ({
                  id: t._id,
                  type: "team" as const,
                  name: t.name,
                })),
            })),
        })),
    }));
  },
});

export const getAcademicTree = query({
  args: {},
  handler: async (ctx) => {
    const verticals = await ctx.db.query("academicVerticals").collect();
    const programs = await ctx.db.query("academicPrograms").collect();
    const batches = await ctx.db.query("academicBatches").collect();

    return verticals.map((v: any) => ({
      id: v._id,
      type: "vertical" as const,
      name: v.name,
      children: programs
        .filter((p: any) => (p as any).verticalId === v._id)
        .map((p: any) => ({
          id: p._id,
          type: "program" as const,
          name: p.name,
          children: batches
            .filter((b: any) => (b as any).programId === p._id)
            .map((b: any) => ({
              id: b._id,
              type: "batch" as const,
              name: b.name,
            })),
        })),
    }));
  },
});

export const simulateLogin = mutation({
  args: { token: v.optional(v.string()),
    adminUserId: v.id("users"),
    targetUserId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "platform", entity: "accessEngine" }, async (ctx, args) => {
    const admin = await ctx.db.get(args.adminUserId);
    if (!admin) throw new Error("Admin not found");
    if ((admin as any).role !== "super_admin" && (admin as any).role !== "admin") {
      throw new Error("Only super admin can impersonate");
    }

    const target = await ctx.db.get(args.targetUserId);
    if (!target) throw new Error("Target user not found");

    // Record impersonation in audit log
    await ctx.db.insert("permissionAuditLogs", {
      action: "login_as",
      entityType: "users",
      entityId: args.targetUserId,
      userId: args.adminUserId,
      targetUserId: args.targetUserId,
      oldValue: null,
      newValue: { impersonatedUser: (target as any).name, reason: args.reason },
      metadata: { simulation: true, timestamp: Date.now() },
      createdAt: Date.now(),
    });

    return {
      success: true,
      message: `Logged in as ${(target as any).name}`,
      targetUser: {
        id: args.targetUserId,
        name: (target as any).name,
        email: (target as any).email,
        role: (target as any).role,
      },
    };
  }),
});

export const getAccessAnalytics = query({
  args: {},
  handler: async (ctx) => {
    let totalRoles = 0, totalPermissions = 0, totalUserRoles = 0, totalFeatureFlags = 0;
    let totalRolePerms = 0;

    try {
      totalRoles = (await ctx.db.query("roles").collect()).length;
      totalPermissions = (await ctx.db.query("permissions").collect()).length;
      totalUserRoles = (await ctx.db.query("userRoles").filter((q: any) => q.eq(q.field("isActive"), true)).collect()).length;
      totalFeatureFlags = (await ctx.db.query("featureFlags").filter((q: any) => q.eq(q.field("isActive"), true)).collect()).length;
      totalRolePerms = (await ctx.db.query("rolePermissions").collect()).length;
    } catch { /* Tables may not exist yet */ }

    let totalUsers = 0, activeUsers = 0;
    try {
      const users = await ctx.db.query("users").collect();
      totalUsers = users.length;
      activeUsers = users.filter((u: any) => u.isActive !== false).length;
    } catch { /* skip */ }

    const inactiveUsers = totalUsers - activeUsers;

    // Most privileged roles (by permission count)
    const mostPrivileged: { roleName: string; permissionCount: number }[] = [];
    try {
      const roles = await ctx.db.query("roles").collect();
      for (const role of roles as any[]) {
        const count = (await ctx.db.query("rolePermissions")
          .filter((q: any) => q.eq(q.field("roleId"), role._id))
          .collect()).length;
        mostPrivileged.push({ roleName: role.name, permissionCount: count });
      }
      mostPrivileged.sort((a, b) => b.permissionCount - a.permissionCount);
    } catch { /* skip */ }

    return {
      totalRoles,
      totalPermissions,
      totalUserRoles,
      totalFeatureFlags,
      totalRolePerms,
      totalUsers,
      activeUsers,
      inactiveUsers,
      mostPrivileged: mostPrivileged.slice(0, 5),
    };
  },
});
