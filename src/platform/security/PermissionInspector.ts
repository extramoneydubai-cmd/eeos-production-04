/**
 * PermissionInspector — Enterprise Permission Resolution & Inspection
 *
 * Resolves effective permissions for any user/role, traces
 * permission sources, and provides permission tree inspection.
 *
 * Integrates with SecurityEngine, Platform SDK permission systems,
 * and field security policies.
 */

import { securityEngine } from "./SecurityEngine";

export interface EffectivePermission {
  resource: string;
  action: string;
  allowed: boolean;
  source: string;
  inheritedFrom?: string;
  conditions?: string[];
  field?: string;
}

export interface PermissionSource {
  type: "role" | "inherited_role" | "policy" | "direct" | "organization" | "company" | "branch" | "department";
  name: string;
  permissions: string[];
}

export interface ResolvedPermission {
  permission: string;
  allowed: boolean;
  sources: PermissionSource[];
  explanation: string;
}

export interface UserPermissionProfile {
  userId: string;
  userName?: string;
  roles: string[];
  inheritedRoles: string[];
  organizationId?: string;
  companyId?: string;
  branchId?: string;
  departmentId?: string;
  effectivePermissions: EffectivePermission[];
  permissionSources: PermissionSource[];
}

class PermissionInspectorClass {
  private initialized = false;

  // Predefined permission matrix
  private readonly PERMISSION_MATRIX: Record<string, string[]> = {
    admin: ["*"],
    manager: [
      "people:read", "people:write",
      "student:read", "student:write",
      "employee:read", "employee:write",
      "finance:read", "finance:write",
      "reports:read",
      "calendar:read", "calendar:write",
      "tasks:read", "tasks:write",
    ],
    faculty: [
      "people:read",
      "student:read",
      "academic:read", "academic:write",
      "attendance:read", "attendance:write",
      "examination:read", "examination:write",
      "lms:read", "lms:write",
      "calendar:read",
      "tasks:read", "tasks:write",
    ],
    staff: [
      "people:read",
      "student:read",
      "employee:read",
      "finance:read",
      "calendar:read",
      "tasks:read", "tasks:write",
      "reports:read",
    ],
    student: [
      "people:read",
      "academic:read",
      "attendance:read",
      "examination:read",
      "lms:read",
      "calendar:read",
      "tasks:read",
    ],
    parent: [
      "people:read",
      "student:read",
      "attendance:read",
      "examination:read",
    ],
  };

  private readonly ROLE_HIERARCHY: Record<string, string[]> = {
    admin: ["manager", "staff", "faculty", "student"],
    manager: ["staff", "faculty"],
    faculty: ["student"],
    staff: [],
    student: [],
    parent: [],
  };

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
  }

  resolvePermissions(
    userId: string,
    roles: string[],
    context?: {
      organizationId?: string;
      companyId?: string;
      branchId?: string;
      departmentId?: string;
    }
  ): UserPermissionProfile {
    const allRoles = this.getAllRoles(roles);
    const sources: PermissionSource[] = [];
    const effectivePermissions: EffectivePermission[] = [];

    // Track direct role permissions
    roles.forEach((role) => {
      const normalizedRole = role.toLowerCase();
      const perms = this.PERMISSION_MATRIX[normalizedRole] || [];
      sources.push({
        type: "role",
        name: normalizedRole,
        permissions: perms,
      });
    });

    // Track inherited role permissions
    const inheritedRoles = allRoles.filter((r) => !roles.includes(r));
    inheritedRoles.forEach((role) => {
      const perms = this.PERMISSION_MATRIX[role] || [];
      sources.push({
        type: "inherited_role",
        name: role,
        permissions: perms,
      });
    });

    // Build effective permission map
    const allPermissions = new Map<string, { allowed: boolean; source: string }>();

    // Add inherited permissions first (lower priority)
    inheritedRoles.forEach((role) => {
      const perms = this.PERMISSION_MATRIX[role] || [];
      perms.forEach((perm) => {
        if (!allPermissions.has(perm)) {
          allPermissions.set(perm, { allowed: true, source: `inherited from ${role}` });
        }
      });
    });

    // Add direct role permissions (higher priority — overrides inherited)
    roles.forEach((role) => {
      const perms = this.PERMISSION_MATRIX[role.toLowerCase()] || [];
      perms.forEach((perm) => {
        const isWildcard = perm === "*";
        allPermissions.set(isWildcard ? "*" : perm, {
          allowed: true,
          source: isWildcard ? `role: ${role} (wildcard)` : `role: ${role}`,
        });
      });
    });

    // Convert to effective permissions list
    allPermissions.forEach((value, key) => {
      if (key === "*") {
        // Wildcard generates all permissions
        Object.keys(this.PERMISSION_MATRIX).forEach((r) => {
          this.PERMISSION_MATRIX[r].forEach((perm) => {
            if (!effectivePermissions.find((ep) => ep.resource === perm)) {
              const [resource, action] = perm.split(":");
              effectivePermissions.push({
                resource,
                action: action || "read",
                allowed: true,
                source: value.source,
              });
            }
          });
        });
      } else {
        const [resource, action] = key.split(":");
        effectivePermissions.push({
          resource,
          action: action || "read",
          allowed: true,
          source: value.source,
        });
      }
    });

    return {
      userId,
      roles,
      inheritedRoles,
      organizationId: context?.organizationId,
      companyId: context?.companyId,
      branchId: context?.branchId,
      departmentId: context?.departmentId,
      effectivePermissions,
      permissionSources: sources,
    };
  }

  private getAllRoles(roles: string[]): string[] {
    const allRoles = new Set<string>();
    roles.forEach((role) => {
      allRoles.add(role.toLowerCase());
      const inherited = this.ROLE_HIERARCHY[role.toLowerCase()] || [];
      inherited.forEach((r) => allRoles.add(r));
    });
    return Array.from(allRoles);
  }

  checkPermission(
    userId: string,
    roles: string[],
    resource: string,
    action: string,
    context?: {
      organizationId?: string;
      companyId?: string;
      branchId?: string;
      departmentId?: string;
      field?: string;
    }
  ): ResolvedPermission {
    const profile = this.resolvePermissions(userId, roles, context);

    // Check explicit permission
    const explicitPerm = profile.effectivePermissions.find(
      (ep) => ep.resource === resource && ep.action === action
    );

    // Check wildcard
    const wildcardPerm = profile.effectivePermissions.find(
      (ep) => ep.resource === "*"
    );

    const effectivePerm = explicitPerm || wildcardPerm;

    if (effectivePerm) {
      return {
        permission: `${resource}:${action}`,
        allowed: true,
        sources: profile.permissionSources,
        explanation: `Permission granted via ${effectivePerm.source}`,
      };
    }

    // Check if user has read permission for write action
    if (action === "write") {
      const readPerm = profile.effectivePermissions.find(
        (ep) => ep.resource === resource && ep.action === "read"
      );
      if (readPerm) {
        return {
          permission: `${resource}:${action}`,
          allowed: false,
          sources: profile.permissionSources,
          explanation: `User has read-only access to ${resource}. Write access denied.`,
        };
      }
    }

    return {
      permission: `${resource}:${action}`,
      allowed: false,
      sources: profile.permissionSources,
      explanation: `No permission found for ${resource}:${action}. Contact administrator.`,
    };
  }

  getPermissionTree(): Record<string, string[]> {
    return this.PERMISSION_MATRIX;
  }

  getRoleHierarchy(): Record<string, string[]> {
    return this.ROLE_HIERARCHY;
  }

  getExplanation(permission: string, profile: UserPermissionProfile): string {
    const [resource, action] = permission.split(":");
    const perm = profile.effectivePermissions.find(
      (ep) => ep.resource === resource && ep.action === action
    );

    if (perm) {
      return `Permission '${permission}' is ${perm.allowed ? "**GRANTED**" : "**DENIED**"}. Source: ${perm.source}.`;
    }

    return `Permission '${permission}' is **NOT FOUND** in any role or inherited role.`;
  }

  getScopeExplanation(profile: UserPermissionProfile): string {
    const scopes: string[] = [];
    if (profile.organizationId) scopes.push("Organization-wide");
    if (profile.companyId) scopes.push("Company-specific");
    if (profile.branchId) scopes.push("Branch-specific");
    if (profile.departmentId) scopes.push("Department-specific");
    return scopes.length > 0 ? scopes.join(", ") : "No scope restrictions";
  }

  getHealth(): { status: string; roles: number; permissions: number } {
    return {
      status: this.initialized ? "healthy" : "uninitialized",
      roles: Object.keys(this.PERMISSION_MATRIX).length,
      permissions: Object.values(this.PERMISSION_MATRIX).reduce((sum, perms) => sum + perms.length, 0),
    };
  }
}

export const permissionInspector = new PermissionInspectorClass();
