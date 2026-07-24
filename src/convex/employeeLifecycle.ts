import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ─── Valid Transitions ───────────────────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  onboarding: ["active", "probation", "archived", "terminated"],
  probation: ["active", "suspended", "terminated", "resigned", "archived"],
  active: ["suspended", "resigned", "terminated", "retired", "archived"],
  suspended: ["active", "probation", "terminated", "resigned", "archived"],
  resigned: ["relieved", "archived"],
  relieved: ["archived"],
  terminated: ["archived"],
  retired: ["archived"],
  archived: ["active"],
};

// ─── Helper ──────────────────────────────────────────────────────

async function createTimelineEvent(
  ctx: { db: { insert: (table: string, doc: any) => Promise<Id<any>> } },
  employeeId: Id<"employeeMaster">,
  eventType: string,
  eventName: string,
  changedBy: Id<"employeeMaster">,
  details?: { oldValue?: string; newValue?: string; remarks?: string }
) {
  await ctx.db.insert("employeeHistory", {
    employeeId,
    eventType,
    eventName,
    oldValue: details?.oldValue,
    newValue: details?.newValue,
    changedBy,
    remarks: details?.remarks,
    changedAt: Date.now(),
    createdAt: Date.now(),
  });
}

async function transitionStatus(
  ctx: { db: { get: (id: Id<"employeeMaster">) => Promise<Doc<"employeeMaster"> | null>; patch: (id: Id<"employeeMaster">, doc: any) => Promise<void>; insert: (table: string, doc: any) => Promise<Id<any>> } },
  employeeId: Id<"employeeMaster">,
  newStatus: string,
  changedBy: Id<"employeeMaster">,
  remarks?: string
) {
  const employee = await ctx.db.get(employeeId);
  if (!employee) throw new Error("Employee not found");

  const allowed = VALID_TRANSITIONS[employee.status];
  if (!allowed || !allowed.includes(newStatus)) {
    throw new Error(
      `Invalid status transition: ${employee.status} → ${newStatus}. Allowed: ${allowed?.join(", ") || "none"}`
    );
  }

  await ctx.db.patch(employeeId, { status: newStatus as any, updatedAt: Date.now() });

  await createTimelineEvent(
    ctx,
    employeeId,
    "status_change",
    `Status changed: ${employee.status} → ${newStatus}`,
    changedBy,
    { oldValue: employee.status, newValue: newStatus, remarks }
  );
}

// ─── Onboard ─────────────────────────────────────────────────────

export const onboardEmployee = mutation({
  args: {
    employeeId: v.id("employeeMaster"),
    joiningDate: v.optional(v.number()),
    probationEndDate: v.optional(v.number()),
    changedBy: v.id("employeeMaster"),
  },
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) throw new Error("Employee not found");

    await ctx.db.patch(args.employeeId, {
      status: "onboarding",
      joiningDate: args.joiningDate || employee.joiningDate,
      probationEndDate: args.probationEndDate,
      updatedAt: Date.now(),
    });

    await createTimelineEvent(
      ctx, args.employeeId, "onboarding", "Employee Onboarding Started", args.changedBy,
      { newValue: "onboarding", remarks: `Joined on ${new Date(args.joiningDate || Date.now()).toLocaleDateString()}` }
    );

    return { success: true };
  },
});

// ─── Confirm Employee (Probation → Active) ───────────────────────

export const confirmEmployee = mutation({
  args: {
    employeeId: v.id("employeeMaster"),
    confirmationDate: v.optional(v.number()),
    changedBy: v.id("employeeMaster"),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await transitionStatus(ctx, args.employeeId, "active", args.changedBy, args.remarks || "Probation confirmed");

    await ctx.db.patch(args.employeeId, {
      confirmationDate: args.confirmationDate || Date.now(),
      updatedAt: Date.now(),
    });

    await createTimelineEvent(
      ctx, args.employeeId, "confirmed", "Employee Confirmed (Probation Completed)", args.changedBy,
      { newValue: "active", remarks: args.remarks }
    );

    return { success: true };
  },
});

// ─── Transfer Employee ───────────────────────────────────────────

export const transferEmployee = mutation({
  args: {
    employeeId: v.id("employeeMaster"),
    newBranchId: v.optional(v.id("branches")),
    newDepartmentId: v.optional(v.id("departments")),
    newCompanyId: v.optional(v.id("companies")),
    effectiveDate: v.optional(v.number()),
    changedBy: v.id("employeeMaster"),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) throw new Error("Employee not found");

    const changes: { field: string; oldVal: string; newVal: string }[] = [];
    if (args.newBranchId && args.newBranchId !== employee.branchId) {
      changes.push({ field: "Branch", oldVal: employee.branchId || "", newVal: args.newBranchId });
    }
    if (args.newDepartmentId && args.newDepartmentId !== employee.departmentId) {
      changes.push({ field: "Department", oldVal: employee.departmentId || "", newVal: args.newDepartmentId });
    }
    if (args.newCompanyId && args.newCompanyId !== employee.companyId) {
      changes.push({ field: "Company", oldVal: employee.companyId || "", newVal: args.newCompanyId });
    }

    await ctx.db.patch(args.employeeId, {
      branchId: args.newBranchId ?? employee.branchId,
      departmentId: args.newDepartmentId ?? employee.departmentId,
      companyId: args.newCompanyId ?? employee.companyId,
      updatedAt: Date.now(),
    });

    for (const change of changes) {
      await createTimelineEvent(
        ctx, args.employeeId, "transfer", `${change.field} Transfer`, args.changedBy,
        { oldValue: change.oldVal, newValue: change.newVal, remarks: args.remarks }
      );
    }

    return { success: true, changes: changes.length };
  },
});

// ─── Promote Employee ────────────────────────────────────────────

export const promoteEmployee = mutation({
  args: {
    employeeId: v.id("employeeMaster"),
    newDesignationId: v.id("designations"),
    newPrimaryRole: v.optional(v.union(
      v.literal("super_admin"), v.literal("ceo"), v.literal("coo"),
      v.literal("cto"), v.literal("department_head"),
      v.literal("manager"), v.literal("employee"),
    )),
    changedBy: v.id("employeeMaster"),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) throw new Error("Employee not found");

    const oldDesignation = employee.designationId;
    const oldRole = employee.primaryRole;

    await ctx.db.patch(args.employeeId, {
      designationId: args.newDesignationId,
      primaryRole: args.newPrimaryRole ?? employee.primaryRole,
      updatedAt: Date.now(),
    });

    await createTimelineEvent(
      ctx, args.employeeId, "promotion", "Employee Promoted", args.changedBy,
      {
        oldValue: `Designation: ${oldDesignation} | Role: ${oldRole}`,
        newValue: `Designation: ${args.newDesignationId} | Role: ${args.newPrimaryRole || oldRole}`,
        remarks: args.remarks,
      }
    );

    return { success: true };
  },
});

// ─── Change Department ───────────────────────────────────────────

export const changeDepartment = mutation({
  args: {
    employeeId: v.id("employeeMaster"),
    newDepartmentId: v.id("departments"),
    changedBy: v.id("employeeMaster"),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) throw new Error("Employee not found");

    const oldDept = employee.departmentId;

    await ctx.db.patch(args.employeeId, {
      departmentId: args.newDepartmentId,
      updatedAt: Date.now(),
    });

    await createTimelineEvent(
      ctx, args.employeeId, "department_change", "Department Changed", args.changedBy,
      { oldValue: oldDept || "", newValue: args.newDepartmentId, remarks: args.remarks }
    );

    return { success: true };
  },
});

// ─── Assign Manager ──────────────────────────────────────────────

export const assignManager = mutation({
  args: {
    employeeId: v.id("employeeMaster"),
    managerId: v.id("employeeMaster"),
    changedBy: v.id("employeeMaster"),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.employeeId === args.managerId) {
      throw new Error("Employee cannot report to themselves");
    }

    const employee = await ctx.db.get(args.employeeId);
    if (!employee) throw new Error("Employee not found");

    const manager = await ctx.db.get(args.managerId);
    if (!manager) throw new Error("Manager not found");

    // Prevent circular reporting (simple depth check)
    let currentManagerId = manager.reportingManagerId;
    while (currentManagerId) {
      if (currentManagerId === args.employeeId) {
        throw new Error("Circular reporting hierarchy detected");
      }
      const currentMgr = await ctx.db.get(currentManagerId);
      currentManagerId = currentMgr?.reportingManagerId || null;
    }

    const oldManager = employee.reportingManagerId;

    await ctx.db.patch(args.employeeId, {
      reportingManagerId: args.managerId,
      updatedAt: Date.now(),
    });

    await createTimelineEvent(
      ctx, args.employeeId, "manager_change", "Reporting Manager Changed", args.changedBy,
      { oldValue: oldManager || "", newValue: args.managerId, remarks: args.remarks }
    );

    return { success: true };
  },
});

// ─── Suspend ─────────────────────────────────────────────────────

export const suspendEmployee = mutation({
  args: {
    employeeId: v.id("employeeMaster"),
    changedBy: v.id("employeeMaster"),
    remarks: v.string(),
  },
  handler: async (ctx, args) => {
    await transitionStatus(ctx, args.employeeId, "suspended", args.changedBy, args.remarks);
    return { success: true };
  },
});

// ─── Reinstate ───────────────────────────────────────────────────

export const reinstateEmployee = mutation({
  args: {
    employeeId: v.id("employeeMaster"),
    changedBy: v.id("employeeMaster"),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await transitionStatus(ctx, args.employeeId, "active", args.changedBy, args.remarks || "Reinstated");
    return { success: true };
  },
});

// ─── Resign ──────────────────────────────────────────────────────

export const resignEmployee = mutation({
  args: {
    employeeId: v.id("employeeMaster"),
    resignationDate: v.number(),
    changedBy: v.id("employeeMaster"),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await transitionStatus(ctx, args.employeeId, "resigned", args.changedBy, args.remarks || "Resignation submitted");

    await ctx.db.patch(args.employeeId, {
      resignationDate: args.resignationDate,
      updatedAt: Date.now(),
    });

    await createTimelineEvent(
      ctx, args.employeeId, "resignation", "Employee Resigned", args.changedBy,
      { newValue: "resigned", remarks: args.remarks || `Resignation effective ${new Date(args.resignationDate).toLocaleDateString()}` }
    );

    return { success: true };
  },
});

// ─── Relieve ─────────────────────────────────────────────────────

export const relieveEmployee = mutation({
  args: {
    employeeId: v.id("employeeMaster"),
    relievingDate: v.number(),
    changedBy: v.id("employeeMaster"),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await transitionStatus(ctx, args.employeeId, "relieved", args.changedBy, args.remarks || "Employee relieved");

    await ctx.db.patch(args.employeeId, {
      relievingDate: args.relievingDate,
      updatedAt: Date.now(),
    });

    await createTimelineEvent(
      ctx, args.employeeId, "relieving", "Employee Relieved", args.changedBy,
      { newValue: "relieved", remarks: args.remarks || `Relieved on ${new Date(args.relievingDate).toLocaleDateString()}` }
    );

    return { success: true };
  },
});

// ─── Terminate ───────────────────────────────────────────────────

export const terminateEmployee = mutation({
  args: {
    employeeId: v.id("employeeMaster"),
    changedBy: v.id("employeeMaster"),
    remarks: v.string(),
    relievingDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await transitionStatus(ctx, args.employeeId, "terminated", args.changedBy, args.remarks);

    if (args.relievingDate) {
      await ctx.db.patch(args.employeeId, {
        relievingDate: args.relievingDate,
        updatedAt: Date.now(),
      });
    }

    await createTimelineEvent(
      ctx, args.employeeId, "termination", "Employee Terminated", args.changedBy,
      { newValue: "terminated", remarks: args.remarks }
    );

    return { success: true };
  },
});

// ─── Retire ──────────────────────────────────────────────────────

export const retireEmployee = mutation({
  args: {
    employeeId: v.id("employeeMaster"),
    retirementDate: v.optional(v.number()),
    changedBy: v.id("employeeMaster"),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await transitionStatus(ctx, args.employeeId, "retired", args.changedBy, args.remarks || "Retirement");

    await ctx.db.patch(args.employeeId, {
      relievingDate: args.retirementDate,
      updatedAt: Date.now(),
    });

    await createTimelineEvent(
      ctx, args.employeeId, "retirement", "Employee Retired", args.changedBy,
      { newValue: "retired", remarks: args.remarks || `Retired on ${args.retirementDate ? new Date(args.retirementDate).toLocaleDateString() : 'N/A'}` }
    );

    return { success: true };
  },
});

// ─── Query: Get History ──────────────────────────────────────────

export const getEmployeeHistory = query({
  args: { employeeId: v.id("employeeMaster") },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("employeeHistory")
      .withIndex("employeeId_changedAt", (q) => q.eq("employeeId", args.employeeId))
      .order("desc")
      .collect();

    return history;
  },
});

// ─── Query: Get Timeline ─────────────────────────────────────────

export const getEmployeeTimeline = query({
  args: { employeeId: v.id("employeeMaster") },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("employeeHistory")
      .withIndex("employeeId_changedAt", (q) => q.eq("employeeId", args.employeeId))
      .order("desc")
      .collect();

    // Enrich with performer names
    const enriched = await Promise.all(
      history.map(async (event) => {
        let performerName = "System";
        try {
          const performer = await ctx.db.get(event.changedBy);
          if (performer) {
            const person = await ctx.db.get(performer.personId);
            performerName = person?.displayName || performer.employeeCode;
          }
        } catch {}
        return { ...event, performerName };
      })
    );

    return enriched;
  },
});
