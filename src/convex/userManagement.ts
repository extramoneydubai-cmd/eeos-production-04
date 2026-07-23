import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================
// EMPLOYEE ID GENERATION
// ============================

async function getNextEmployeeId(ctx: any): Promise<string> {
  const users = await ctx.db.query("users").collect();
  let maxNum = 0;
  for (const u of users) {
    if (u.employeeId && u.employeeId.startsWith("EMP-")) {
      const num = parseInt(u.employeeId.replace("EMP-", ""), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }
  const next = maxNum + 1;
  return `EMP-${String(next).padStart(5, "0")}`;
}

export const getNextEmployeeIdQuery = query({
  args: {},
  handler: async (ctx) => {
    return await getNextEmployeeId(ctx);
  },
});

// ============================
// CREATE USER
// ============================

export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    username: v.string(),
    role: v.string(),
    // Organization assignment
    designationId: v.optional(v.id("designations")),
    departmentId: v.optional(v.id("departments")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    verticalId: v.optional(v.id("verticals")),
    teamIds: v.optional(v.array(v.id("teams"))),
    // Contact
    phone: v.optional(v.string()),
    // Employee info
    employeeId: v.optional(v.string()),
    employmentType: v.optional(v.string()),
    joiningDate: v.optional(v.number()),
    probationEndDate: v.optional(v.number()),
    reportingManagerId: v.optional(v.id("users")),
    employeeCategoryId: v.optional(v.id("hrEmployeeCategories")),
    workLocationId: v.optional(v.id("hrWorkLocations")),
    skillIds: v.optional(v.array(v.id("hrSkills"))),
    experienceLevelId: v.optional(v.id("hrExperienceLevels")),
    employmentStatus: v.optional(v.string()),
    employeeCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userRole = args.role as "super_admin" | "admin" | "manager" | "staff";

    // Auto-generate employee ID if not provided
    let employeeId = args.employeeId;
    if (!employeeId) {
      employeeId = await getNextEmployeeId(ctx);
    }

    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      username: args.username,
      role: userRole,
      isDisabled: false,
      designationId: args.designationId,
      departmentId: args.departmentId,
      companyId: args.companyId,
      branchId: args.branchId,
      verticalId: args.verticalId,
      teamIds: args.teamIds,
      phone: args.phone,
      employeeCode: args.employeeCode,
      employeeId,
      employmentType: args.employmentType,
      joiningDate: args.joiningDate,
      probationEndDate: args.probationEndDate,
      reportingManagerId: args.reportingManagerId,
      employeeCategoryId: args.employeeCategoryId,
      workLocationId: args.workLocationId,
      skillIds: args.skillIds,
      experienceLevelId: args.experienceLevelId,
      employmentStatus: args.employmentStatus || "active",
      profileCompletion: 15, // starts with basic info
    });

    // Create default user scope
    const now = Date.now();
    await ctx.db.insert("userScopes", {
      userId,
      canAccessDashboard: true,
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});

// ============================
// UPDATE USER
// ============================

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(v.string()),
    // Organization
    designationId: v.optional(v.id("designations")),
    departmentId: v.optional(v.id("departments")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    verticalId: v.optional(v.id("verticals")),
    teamIds: v.optional(v.array(v.id("teams"))),
    // Contact
    phone: v.optional(v.string()),
    // Employee info
    employeeId: v.optional(v.string()),
    employmentType: v.optional(v.string()),
    joiningDate: v.optional(v.number()),
    probationEndDate: v.optional(v.number()),
    reportingManagerId: v.optional(v.id("users")),
    employeeCategoryId: v.optional(v.id("hrEmployeeCategories")),
    workLocationId: v.optional(v.id("hrWorkLocations")),
    skillIds: v.optional(v.array(v.id("hrSkills"))),
    experienceLevelId: v.optional(v.id("hrExperienceLevels")),
    employmentStatus: v.optional(v.string()),
    employeeCode: v.optional(v.string()),
    isDisabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, ...fields } = args;
    const updates: Record<string, any> = {};

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }

    // Recalculate profile completion
    if (Object.keys(updates).length > 0) {
      const user = await ctx.db.get(userId);
      if (user) {
        const completion = calculateProfileCompletion(user, updates);
        updates.profileCompletion = completion;
      }
    }

    await ctx.db.patch(userId, updates);
  },
});

function calculateProfileCompletion(existing: any, updates: Record<string, any>): number {
  const fields = [
    { key: "name", weight: 10 },
    { key: "email", weight: 10 },
    { key: "phone", weight: 10 },
    { key: "employeeId", weight: 5 },
    { key: "designationId", weight: 10 },
    { key: "departmentId", weight: 10 },
    { key: "branchId", weight: 10 },
    { key: "companyId", weight: 5 },
    { key: "reportingManagerId", weight: 10 },
    { key: "employmentType", weight: 5 },
    { key: "joiningDate", weight: 5 },
    { key: "workLocationId", weight: 5 },
    { key: "skillIds", weight: 5 },
  ];

  let score = 0;
  for (const f of fields) {
    const value = f.key in updates ? updates[f.key] : (existing as any)[f.key];
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value) && value.length === 0) continue;
      score += f.weight;
    }
  }

  return Math.min(score, 100);
}

// ============================
// DISABLE / ENABLE
// ============================

export const disableUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { isDisabled: true, employmentStatus: "suspended" });
  },
});

export const enableUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { isDisabled: false, employmentStatus: "active" });
  },
});

// ============================
// PASSWORD RESET
// ============================

export const resetPassword = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Auth system handles password reset via setPassword mutation
  },
});

// ============================
// TEAMS
// ============================

export const updateUserTeams = mutation({
  args: {
    userId: v.id("users"),
    teamIds: v.array(v.id("teams")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { teamIds: args.teamIds });
  },
});

// ============================
// CLONE ACCESS
// ============================

export const cloneUserAccess = mutation({
  args: {
    sourceUserId: v.id("users"),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.sourceUserId);
    if (!source) throw new Error("Source user not found");
    await ctx.db.patch(args.targetUserId, {
      departmentId: source.departmentId,
      companyId: source.companyId,
      branchId: source.branchId,
      verticalId: source.verticalId,
      teamIds: source.teamIds,
    });
  },
});

// ============================
// TRANSFER ACCESS
// ============================

export const transferUserAccess = mutation({
  args: {
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    transferTeams: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const fromUser = await ctx.db.get(args.fromUserId);
    if (!fromUser) throw new Error("Source user not found");

    if (args.transferTeams && fromUser.teamIds) {
      const toUser = await ctx.db.get(args.toUserId);
      if (toUser) {
        const mergedTeams = [...new Set([...(toUser.teamIds || []), ...fromUser.teamIds])];
        await ctx.db.patch(args.toUserId, { teamIds: mergedTeams });
      }
    }
  },
});

// ============================
// EMPLOYEE TRANSFER
// ============================

export const transferEmployee = mutation({
  args: {
    userId: v.id("users"),
    newDepartmentId: v.optional(v.id("departments")),
    newCompanyId: v.optional(v.id("companies")),
    newBranchId: v.optional(v.id("branches")),
    newDesignationId: v.optional(v.id("designations")),
    newTeamIds: v.optional(v.array(v.id("teams"))),
  },
  handler: async (ctx, args) => {
    const { userId, ...transfers } = args;
    const updates: Record<string, any> = {};
    if (transfers.newDepartmentId !== undefined) updates.departmentId = transfers.newDepartmentId;
    if (transfers.newCompanyId !== undefined) updates.companyId = transfers.newCompanyId;
    if (transfers.newBranchId !== undefined) updates.branchId = transfers.newBranchId;
    if (transfers.newDesignationId !== undefined) updates.designationId = transfers.newDesignationId;
    if (transfers.newTeamIds !== undefined) updates.teamIds = transfers.newTeamIds;
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(userId, updates);
    }
  },
});

// ============================
// CHANGE REPORTING MANAGER
// ============================

export const changeReportingManager = mutation({
  args: {
    userId: v.id("users"),
    newManagerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (args.newManagerId === args.userId) {
      throw new Error("Cannot report to self");
    }

    // Check for circular hierarchy
    if (args.newManagerId) {
      let current = await ctx.db.get(args.newManagerId);
      while (current && current.reportingManagerId) {
        if (current.reportingManagerId === args.userId) {
          throw new Error("Circular reporting hierarchy detected");
        }
        const next = await ctx.db.get(current.reportingManagerId);
        if (!next) break;
        current = next;
      }
    }

    await ctx.db.patch(args.userId, {
      reportingManagerId: args.newManagerId,
    });
  },
});

// ============================
// UPDATE EMPLOYMENT STATUS
// ============================

export const updateEmploymentStatus = mutation({
  args: {
    userId: v.id("users"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      employmentStatus: args.status,
      isDisabled: args.status === "suspended" || args.status === "terminated",
    });
  },
});

// ============================
// PROMOTE EMPLOYEE
// ============================

export const promoteEmployee = mutation({
  args: {
    userId: v.id("users"),
    newDesignationId: v.id("designations"),
    newRole: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, any> = {
      designationId: args.newDesignationId,
    };
    if (args.newRole) {
      updates.role = args.newRole as "super_admin" | "admin" | "manager" | "staff";
    }
    await ctx.db.patch(args.userId, updates);
  },
});

// ============================
// QUERIES
// ============================

export const listUsersByManager = query({
  args: { managerId: v.id("users") },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    return users.filter((u) => u.reportingManagerId === args.managerId && !u.isDisabled);
  },
});

export const getEmployeeHierarchy = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const chain: { userId: string; name?: string; designationId?: string }[] = [];
    let current = await ctx.db.get(args.userId);
    while (current && current.reportingManagerId) {
      const manager = await ctx.db.get(current.reportingManagerId);
      if (manager) {
        chain.push({
          userId: manager._id,
          name: manager.name,
          designationId: manager.designationId,
        });
        current = manager;
      } else {
        break;
      }
    }
    return chain;
  },
});

export const getReportingTree = query({
  args: { managerId: v.id("users") },
  handler: async (ctx, args) => {
    const allUsers = await ctx.db.query("users").collect();
    const directReports = allUsers.filter((u) => u.reportingManagerId === args.managerId && !u.isDisabled);

    // Build tree recursively (max depth 3)
    async function buildTree(userIds: string[], depth: number): Promise<any[]> {
      if (depth >= 3) return [];
      const result: any[] = [];
      for (const uid of userIds) {
        const u = allUsers.find((x) => x._id === uid);
        if (!u) continue;
        const reports = allUsers.filter((x) => x.reportingManagerId === uid && !x.isDisabled);
        const children = await buildTree(reports.map((r) => r._id), depth + 1);
        result.push({
          _id: u._id,
          name: u.name,
          designationId: u.designationId,
          children,
        });
      }
      return result;
    }

    return buildTree(directReports.map((r) => r._id), 0);
  },
});

// ============================
// USER SCOPES
// ============================

export const getUserScope = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const scopes = await ctx.db.query("userScopes").withIndex("userId", (q) => q.eq("userId", args.userId)).collect();
    return scopes[0] || null;
  },
});

export const updateUserScope = mutation({
  args: {
    userId: v.id("users"),
    companyIds: v.optional(v.array(v.id("companies"))),
    departmentIds: v.optional(v.array(v.id("departments"))),
    branchIds: v.optional(v.array(v.id("branches"))),
    teamIds: v.optional(v.array(v.id("teams"))),
    verticalIds: v.optional(v.array(v.id("verticals"))),
    canAccessDashboard: v.optional(v.boolean()),
    canAccessCrm: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, ...scopeData } = args;
    const existing = await ctx.db.query("userScopes").withIndex("userId", (q) => q.eq("userId", userId)).collect();
    const now = Date.now();
    if (existing.length > 0) {
      await ctx.db.patch(existing[0]._id, { ...scopeData, updatedAt: now });
    } else {
      await ctx.db.insert("userScopes", { userId, ...scopeData, createdAt: now, updatedAt: now });
    }
  },
});
