/**
 * Governance Engine — Branch-aware Organization Scope Enforcement
 *
 * Centralized service that enforces the org hierarchy across all modules.
 * Group → Departments → Companies → Branches → Teams → Users
 *
 * Every query/mutation should call scope.enforce() to verify the user
 * has access to the requested entity within their org scope.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── Scope Resolution ────────────────────────────────────────

export const resolveUserScope = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const companyId = (user as any).companyId;
    const branchId = (user as any).branchId;
    const departmentId = (user as any).departmentId;
    const teamId = (user as any).teamId;
    const role = (user as any).role || "employee";

    // Resolve names
    const company = companyId ? await ctx.db.get(companyId) : null;
    const branch = branchId ? await ctx.db.get(branchId) : null;
    const department = departmentId ? await ctx.db.get(departmentId) : null;
    const team = teamId ? await ctx.db.get(teamId) : null;

    // Determine scope level
    let scopeLevel: "global" | "company" | "branch" | "department" | "team" | "self" = "self";
    if (role === "super_admin") scopeLevel = "global";
    else if (role === "company_admin" || role === "ceo") scopeLevel = "company";
    else if (role === "branch_manager") scopeLevel = "branch";
    else if (role === "department_head") scopeLevel = "department";
    else if (role === "team_lead") scopeLevel = "team";

    return {
      userId: args.userId,
      role,
      scopeLevel,
      companyId: companyId || null,
      branchId: branchId || null,
      departmentId: departmentId || null,
      teamId: teamId || null,
      companyName: company ? (company as any).name : null,
      branchName: branch ? (branch as any).name : null,
      departmentName: department ? (department as any).name : null,
      teamName: team ? (team as any).name : null,
    };
  },
});

// ─── Scope Enforcement Helper ────────────────────────────────

export const canAccessEntity = query({
  args: {
    userId: v.id("users"),
    entityCompanyId: v.optional(v.id("companies")),
    entityBranchId: v.optional(v.id("branches")),
    entityDepartmentId: v.optional(v.id("departments")),
    requiredRole: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const scope = await resolveUserScope.handler(ctx, { userId: args.userId });
    if (!scope) return { allowed: false, reason: "User not found" };

    // Super admin can access everything
    if (scope.scopeLevel === "global") return { allowed: true, scope };

    // Role check
    if (args.requiredRole && scope.role !== args.requiredRole && scope.role !== "super_admin") {
      return { allowed: false, reason: `Requires role: ${args.requiredRole}` };
    }

    // Company scope
    if (scope.scopeLevel === "company") {
      if (args.entityCompanyId && args.entityCompanyId !== scope.companyId) {
        return { allowed: false, reason: "Cannot access other companies" };
      }
      return { allowed: true, scope };
    }

    // Branch scope
    if (scope.scopeLevel === "branch") {
      if (args.entityCompanyId && args.entityCompanyId !== scope.companyId) return { allowed: false, reason: "Cannot access other companies" };
      if (args.entityBranchId && args.entityBranchId !== scope.branchId) return { allowed: false, reason: "Cannot access other branches" };
      return { allowed: true, scope };
    }

    // Department scope
    if (scope.scopeLevel === "department") {
      if (args.entityCompanyId && args.entityCompanyId !== scope.companyId) return { allowed: false, reason: "Cannot access other companies" };
      if (args.entityBranchId && args.entityBranchId !== scope.branchId) return { allowed: false, reason: "Cannot access other branches" };
      if (args.entityDepartmentId && args.entityDepartmentId !== scope.departmentId) return { allowed: false, reason: "Cannot access other departments" };
      return { allowed: true, scope };
    }

    // Default: self access only
    return { allowed: false, reason: "Insufficient permissions" };
  },
});

// ─── Scoped Queries ──────────────────────────────────────────
// These return filtered results based on user's org scope.

export const listUsersByScope = query({
  args: { viewerUserId: v.id("users") },
  handler: async (ctx, args) => {
    const scope = await resolveUserScope.handler(ctx, { userId: args.viewerUserId });
    if (!scope) return [];

    const allUsers = await ctx.db.query("users").collect();

    switch (scope.scopeLevel) {
      case "global": return allUsers;
      case "company": return allUsers.filter((u: any) => u.companyId === scope.companyId);
      case "branch": return allUsers.filter((u: any) => u.branchId === scope.branchId);
      case "department": return allUsers.filter((u: any) => u.departmentId === scope.departmentId);
      case "team": return allUsers.filter((u: any) => u.teamId === scope.teamId);
      default: return allUsers.filter((u: any) => u._id === args.viewerUserId);
    }
  },
});

export const listBranchesByScope = query({
  args: { viewerUserId: v.id("users"), companyId: v.optional(v.id("companies")) },
  handler: async (ctx, args) => {
    const scope = await resolveUserScope.handler(ctx, { userId: args.viewerUserId });
    if (!scope) return [];

    const allBranches = await ctx.db.query("branches").collect();

    let filtered = allBranches;
    if (scope.scopeLevel === "company") filtered = allBranches.filter((b: any) => b.companyId === scope.companyId);
    if (scope.scopeLevel === "branch") filtered = allBranches.filter((b: any) => b._id === scope.branchId);
    if (args.companyId) filtered = filtered.filter((b: any) => (b as any).companyId === args.companyId);

    return filtered;
  },
});

// ─── Org Hierarchy ──────────────────────────────────────────

export const getOrgHierarchy = query({
  handler: async (ctx) => {
    const companies = await ctx.db.query("companies").collect();
    const branches = await ctx.db.query("branches").collect();
    const departments = await ctx.db.query("departments").collect();
    const teams = await ctx.db.query("teams").collect();

    return companies.map((c: any) => ({
      id: c._id,
      name: c.name,
      code: (c as any).code,
      branches: branches.filter((b: any) => (b as any).companyId === c._id).map((b: any) => ({
        id: b._id,
        name: b.name,
        departments: departments.filter((d: any) => (d as any).branchId === b._id).map((d: any) => ({
          id: d._id,
          name: d.name,
          teams: teams.filter((t: any) => (t as any).departmentId === d._id).map((t: any) => ({
            id: t._id,
            name: t.name,
          })),
        })),
      })),
    }));
  },
});

// ─── Approval Routing ────────────────────────────────────────

export const getApprovalRoute = query({
  args: { module: v.string(), amount: v.optional(v.number()), companyId: v.optional(v.id("companies")), branchId: v.optional(v.id("branches")) },
  handler: async (ctx, args) => {
    // Default approval hierarchy
    const route = [
      { level: 1, role: "branch_manager", label: "Branch Manager", requiredAmount: 0 },
      { level: 2, role: "regional_manager", label: "Regional Manager", requiredAmount: 50000 },
      { level: 3, role: "head_office", label: "Head Office", requiredAmount: 200000 },
      { level: 4, role: "director", label: "Director", requiredAmount: 500000 },
      { level: 5, role: "ceo", label: "CEO", requiredAmount: 1000000 },
    ];

    // Check if there are custom rules
    const rules = await ctx.db.query("businessRules")
      .withIndex("domain_key", (q: any) => q.eq("domain", "approval_chain").eq("key", args.module))
      .first();

    if (rules) return (rules as any).value;

    // Filter by amount
    if (args.amount) {
      return route.filter((r) => r.requiredAmount <= args.amount!);
    }

    return route;
  },
});
