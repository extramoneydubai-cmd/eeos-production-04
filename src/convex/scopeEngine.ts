/**
 * Enterprise Scope Engine (Phase 1 ⭐⭐⭐⭐⭐)
 *
 * Centralized scope resolution for every module.
 * Every record query must go through ScopeEngine to enforce
 * the organization governance hierarchy:
 *   Group → Department → Company → Branch → Team → User
 *
 * Academic hierarchy remains independent:
 *   Vertical → Sub Vertical → Board → Course → Batch
 *
 * Usage (from any mutation/query handler):
 *   const scope = await ScopeEngine.forUser(ctx, userId);
 *   scope.canRead(entity)        // boolean
 *   scope.canWrite(entity)       // boolean
 *   scope.canApprove(entity)     // boolean
 *   scope.canDelete(entity)      // boolean
 *   scope.visibleCompanies()     // Id<"companies">[]
 *   scope.visibleBranches()      // Id<"branches">[]
 *   scope.visibleDepartments()   // Id<"departments">[]
 *   scope.filterByScope(records) // filtered records
 */

import { QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ─── Scope Levels ───────────────────────────────────────────

export type ScopeLevel =
  | "super_admin"   // Everything
  | "global"        // All companies
  | "company"       // Single company
  | "branch"        // Single branch
  | "department"    // Single department
  | "team"          // Single team
  | "self";         // Own records only

export interface UserScope {
  userId: Id<"users">;
  role: string;
  scopeLevel: ScopeLevel;
  designationId?: Id<"designations">;
  companyId?: Id<"companies">;
  branchId?: Id<"branches">;
  departmentId?: Id<"departments">;
  teamId?: Id<"teams">;
  verticalIds?: string[];
  branchIds?: Id<"branches">[];
  companyIds?: Id<"companies">[];
}

// ─── Scope Engine ───────────────────────────────────────────

export class ScopeEngine {
  private ctx: QueryCtx;
  private scope: UserScope | null = null;
  private user: Doc<"users"> | null = null;

  private constructor(ctx: QueryCtx) {
    this.ctx = ctx;
  }

  /** Create a ScopeEngine for a specific user */
  static async forUser(ctx: QueryCtx, userId: Id<"users">): Promise<ScopeEngine> {
    const engine = new ScopeEngine(ctx);
    engine.user = await ctx.db.get(userId);
    if (engine.user) {
      engine.scope = await engine.resolveScope(engine.user);
    }
    return engine;
  }

  /** Get the resolved scope info */
  getScope(): UserScope | null {
    return this.scope;
  }

  // ─── Permission Checks ──────────────────────────────────

  /** Can the user READ this entity? */
  canRead(entity: { companyId?: string; branchId?: string; departmentId?: string }): boolean {
    return this.checkAccess(entity, "read");
  }

  /** Can the user WRITE (create/update) this entity? */
  canWrite(entity: { companyId?: string; branchId?: string; departmentId?: string }): boolean {
    return this.checkAccess(entity, "write");
  }

  /** Can the user APPROVE this entity? */
  canApprove(entity: { companyId?: string; branchId?: string; departmentId?: string }): boolean {
    if (!this.scope) return false;
    if (this.scope.scopeLevel === "super_admin" || this.scope.scopeLevel === "global") return true;
    // Approve requires at least branch-level scope over the entity
    if (entity.companyId && entity.companyId !== this.scope.companyId) return false;
    if (entity.branchId && entity.branchId !== this.scope.branchId) return false;
    return this.scope.scopeLevel === "company" || this.scope.scopeLevel === "branch";
  }

  /** Can the user DELETE this entity? */
  canDelete(entity: { companyId?: string; branchId?: string; departmentId?: string }): boolean {
    if (!this.scope) return false;
    if (this.scope.scopeLevel === "super_admin") return true;
    return this.canWrite(entity) && this.scope.scopeLevel !== "self" && this.scope.scopeLevel !== "team";
  }

  // ─── Visibility Queries ─────────────────────────────────

  /** Get all visible company IDs */
  async visibleCompanies(): Promise<Id<"companies">[]> {
    if (!this.scope) return [];
    if (this.scope.scopeLevel === "super_admin" || this.scope.scopeLevel === "global") {
      const all = await this.ctx.db.query("companies").collect();
      return all.map((c: any) => c._id);
    }
    if (this.scope.companyId) return [this.scope.companyId];
    return [];
  }

  /** Get all visible branch IDs */
  async visibleBranches(): Promise<Id<"branches">[]> {
    if (!this.scope) return [];
    if (this.scope.scopeLevel === "super_admin" || this.scope.scopeLevel === "global") {
      const all = await this.ctx.db.query("branches").collect();
      return all.map((b: any) => b._id);
    }
    if (this.scope.scopeLevel === "company" && this.scope.companyId) {
      const branches = await this.ctx.db.query("branches")
        .filter((q: any) => q.eq(q.field("companyId"), this.scope!.companyId))
        .collect();
      return branches.map((b: any) => b._id);
    }
    if (this.scope.branchId) return [this.scope.branchId];
    return [];
  }

  /** Get all visible department IDs */
  async visibleDepartments(): Promise<Id<"departments">[]> {
    if (!this.scope) return [];
    if (this.scope.scopeLevel === "super_admin" || this.scope.scopeLevel === "global") {
      const all = await this.ctx.db.query("departments").collect();
      return all.map((d: any) => d._id);
    }
    if (this.scope.departmentId) return [this.scope.departmentId];
    if (this.scope.branchId) {
      const depts = await this.ctx.db.query("departments")
        .filter((q: any) => q.eq(q.field("branchId"), this.scope!.branchId))
        .collect();
      return depts.map((d: any) => d._id);
    }
    return [];
  }

  /** Filter an array of records to only those visible to the user */
  filterByScope<T extends { companyId?: string; branchId?: string; departmentId?: string }>(records: T[]): T[] {
    if (!this.scope || this.scope.scopeLevel === "super_admin" || this.scope.scopeLevel === "global") {
      return records;
    }
    return records.filter((r) => this.canRead(r));
  }

  /**
   * Get a scope-filtered query. Optimized for Convex filters.
   * Returns a filter function that can be passed to `.filter()`.
   */
  getScopeFilter(): ((q: any) => any) | null {
    if (!this.scope) return null;
    if (this.scope.scopeLevel === "super_admin" || this.scope.scopeLevel === "global") return null;

    const { scopeLevel, companyId, branchId, departmentId } = this.scope;

    return (q: any) => {
      switch (scopeLevel) {
        case "company":
          return q.eq(q.field("companyId"), companyId);
        case "branch":
          return q.and(
            q.eq(q.field("companyId"), companyId),
            q.eq(q.field("branchId"), branchId),
          );
        case "department":
          return q.and(
            q.eq(q.field("companyId"), companyId),
            q.eq(q.field("branchId"), branchId),
            q.eq(q.field("departmentId"), departmentId),
          );
        default:
          // Team or Self — filter by owner/creator
          return q.eq(q.field("createdBy"), this.scope!.userId);
      }
    };
  }

  /** Resolve entity access level: "none" | "view" | "edit" | "admin" */
  accessLevel(entity: { companyId?: string; branchId?: string; departmentId?: string; createdBy?: string }): "none" | "view" | "edit" | "admin" {
    if (!this.scope) return "none";
    if (this.scope.scopeLevel === "super_admin") return "admin";
    if (!this.canRead(entity)) return "none";
    if (this.canDelete(entity)) return "admin";
    if (this.canWrite(entity)) return "edit";
    return "view";
  }

  // ─── Private Helpers ─────────────────────────────────────

  private checkAccess(entity: { companyId?: string; branchId?: string; departmentId?: string }, action: "read" | "write"): boolean {
    if (!this.scope) return false;
    if (this.scope.scopeLevel === "super_admin") return true;
    if (this.scope.scopeLevel === "global") return action === "read";

    switch (this.scope.scopeLevel) {
      case "company":
        return !entity.companyId || entity.companyId === this.scope!.companyId;
      case "branch":
        return (!entity.companyId || entity.companyId === this.scope!.companyId) &&
               (!entity.branchId || entity.branchId === this.scope!.branchId);
      case "department":
        return (!entity.companyId || entity.companyId === this.scope!.companyId) &&
               (!entity.branchId || entity.branchId === this.scope!.branchId) &&
               (!entity.departmentId || entity.departmentId === this.scope!.departmentId);
      case "team":
      case "self":
        return action === "read"; // Can read but not write entities outside their scope
      default:
        return false;
    }
  }

  private async resolveScope(user: Doc<"users">): Promise<UserScope> {
    const u = user as any;
    const role = u.role || "employee";

    let scopeLevel: ScopeLevel = "self";
    if (role === "super_admin") scopeLevel = "super_admin";
    else if (role === "ceo" || role === "company_admin") scopeLevel = "company";
    else if (role === "branch_manager") scopeLevel = "branch";
    else if (role === "department_head") scopeLevel = "department";
    else if (role === "team_lead") scopeLevel = "team";

    // If user has explicit branch list, extend scope
    let branchIds: Id<"branches">[] | undefined;
    if (u.branchIds && Array.isArray(u.branchIds) && u.branchIds.length > 1) {
      branchIds = u.branchIds;
      if (scopeLevel === "branch") scopeLevel = "company";
    }

    return {
      userId: user._id,
      role,
      scopeLevel,
      designationId: u.designationId,
      companyId: u.companyId,
      branchId: u.branchId,
      departmentId: u.departmentId,
      teamId: u.teamId,
      verticalIds: u.verticalIds,
      branchIds,
      companyIds: u.companyId ? [u.companyId] : undefined,
    };
  }
}

// ─── Convex Queries ─────────────────────────────────────────

import { query } from "./_generated/server";
import { v } from "convex/values";

export const resolveScope = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const engine = await ScopeEngine.forUser(ctx, args.userId);
    return engine.getScope();
  },
});

export const canAccess = query({
  args: {
    userId: v.id("users"),
    entityCompanyId: v.optional(v.id("companies")),
    entityBranchId: v.optional(v.id("branches")),
    entityDepartmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    const engine = await ScopeEngine.forUser(ctx, args.userId);
    return {
      canRead: engine.canRead(args),
      canWrite: engine.canWrite(args),
      canApprove: engine.canApprove(args),
      canDelete: engine.canDelete(args),
      accessLevel: engine.accessLevel(args),
    };
  },
});

export const getVisibleScope = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const engine = await ScopeEngine.forUser(ctx, args.userId);
    const [companies, branches, departments] = await Promise.all([
      engine.visibleCompanies(),
      engine.visibleBranches(),
      engine.visibleDepartments(),
    ]);
    return { companies, branches, departments, scope: engine.getScope() };
  },
});
