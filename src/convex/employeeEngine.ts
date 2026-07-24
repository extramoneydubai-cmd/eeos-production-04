import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ─── Helpers ─────────────────────────────────────────────────────

async function generateEmployeeCode(ctx: { db: { query: (table: string) => any } }): Promise<string> {
  const employees = await ctx.db.query("employeeMaster").collect();
  const count = employees.length + 1;
  return `EMP-${String(count).padStart(5, "0")}`;
}

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

// ─── Create Employee ─────────────────────────────────────────────

export const createEmployee = mutation({
  args: {
    // Person details (passed to People Registry)
    firstName: v.string(),
    lastName: v.string(),
    middleName: v.optional(v.string()),
    displayName: v.optional(v.string()),
    gender: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()),
    nationality: v.optional(v.string()),
    // Contact
    mobile: v.string(),
    email: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    // Employment
    employmentType: v.union(
      v.literal("permanent"), v.literal("contract"),
      v.literal("part_time"), v.literal("intern"),
      v.literal("freelancer"), v.literal("consultant"),
    ),
    primaryRole: v.union(
      v.literal("super_admin"), v.literal("ceo"), v.literal("coo"),
      v.literal("cto"), v.literal("department_head"),
      v.literal("manager"), v.literal("employee"),
    ),
    joiningDate: v.optional(v.number()),
    probationEndDate: v.optional(v.number()),
    // Organization
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    designationId: v.optional(v.id("designations")),
    reportingManagerId: v.optional(v.id("employeeMaster")),
    employeeCategoryId: v.optional(v.id("hrEmployeeCategories")),
    workLocation: v.optional(v.string()),
    experienceLevel: v.optional(v.string()),
    // Auth user
    createdByUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // 1. Create Person in People Registry
    const personId = await ctx.db.insert("personMaster", {
      firstName: args.firstName,
      middleName: args.middleName,
      lastName: args.lastName,
      displayName: args.displayName || `${args.firstName} ${args.lastName}`,
      gender: args.gender,
      dateOfBirth: args.dateOfBirth,
      nationality: args.nationality,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 2. Add contact methods
    await ctx.db.insert("contactMethods", {
      personId,
      type: "Mobile",
      label: "Personal",
      value: args.mobile,
      countryCode: args.countryCode || "91",
      preferred: true,
      verified: false,
      visibility: "organization",
      active: true,
    });

    if (args.email) {
      await ctx.db.insert("contactMethods", {
        personId,
        type: "Email",
        label: "Personal",
        value: args.email,
        preferred: true,
        verified: false,
        visibility: "organization",
        active: true,
      });
    }

    // 3. Create employee profile in People Registry
    const employeeCode = await generateEmployeeCode(ctx);

    await ctx.db.insert("personProfiles", {
      personId,
      profileType: "employee",
      profileReferenceId: employeeCode,
      active: true,
      primaryProfile: true,
    });

    // 4. Create Employee Master
    const employeeId = await ctx.db.insert("employeeMaster", {
      employeeCode,
      personId,
      employmentType: args.employmentType,
      primaryRole: args.primaryRole,
      joiningDate: args.joiningDate,
      probationEndDate: args.probationEndDate,
      companyId: args.companyId,
      branchId: args.branchId,
      departmentId: args.departmentId,
      designationId: args.designationId,
      reportingManagerId: args.reportingManagerId,
      employeeCategoryId: args.employeeCategoryId,
      workLocation: args.workLocation,
      experienceLevel: args.experienceLevel,
      status: "onboarding",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // 5. Create timeline event
    await createTimelineEvent(ctx, employeeId, "onboarding", "Employee Created", employeeId, {
      remarks: `Employee ${employeeCode} created with ${args.employmentType} type`,
    });

    return { employeeId, personId, employeeCode };
  },
});

// ─── Get Employee ────────────────────────────────────────────────

export const getEmployee = query({
  args: { employeeId: v.id("employeeMaster") },
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) return null;

    // Fetch person data from People Registry
    const person = await ctx.db.get(employee.personId);
    const contactMethods = await ctx.db
      .query("contactMethods")
      .withIndex("personId", (q) => q.eq("personId", employee.personId))
      .collect();
    const profiles = await ctx.db
      .query("personProfiles")
      .withIndex("personId", (q) => q.eq("personId", employee.personId))
      .collect();

    // Fetch org details
    const department = employee.departmentId ? await ctx.db.get(employee.departmentId) : null;
    const designation = employee.designationId ? await ctx.db.get(employee.designationId) : null;
    const branch = employee.branchId ? await ctx.db.get(employee.branchId) : null;
    const company = employee.companyId ? await ctx.db.get(employee.companyId) : null;

    // Fetch reporting manager
    let reportingManager: any = null;
    if (employee.reportingManagerId) {
      const mgr = await ctx.db.get(employee.reportingManagerId);
      if (mgr) {
        const mgrPerson = await ctx.db.get(mgr.personId);
        reportingManager = {
          employeeId: mgr._id,
          employeeCode: mgr.employeeCode,
          displayName: mgrPerson?.displayName || "Unknown",
        };
      }
    }

    return {
      ...employee,
      person,
      contactMethods,
      profiles,
      department,
      designation,
      branch,
      company,
      reportingManager,
    };
  },
});

// ─── Update Employee ─────────────────────────────────────────────

export const updateEmployee = mutation({
  args: {
    employeeId: v.id("employeeMaster"),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    designationId: v.optional(v.id("designations")),
    reportingManagerId: v.optional(v.id("employeeMaster")),
    employmentType: v.optional(v.union(
      v.literal("permanent"), v.literal("contract"),
      v.literal("part_time"), v.literal("intern"),
      v.literal("freelancer"), v.literal("consultant"),
    )),
    primaryRole: v.optional(v.union(
      v.literal("super_admin"), v.literal("ceo"), v.literal("coo"),
      v.literal("cto"), v.literal("department_head"),
      v.literal("manager"), v.literal("employee"),
    )),
    workLocation: v.optional(v.string()),
    experienceLevel: v.optional(v.string()),
    employeeCategoryId: v.optional(v.id("hrEmployeeCategories")),
    changedBy: v.id("employeeMaster"),
  },
  handler: async (ctx, args) => {
    const { employeeId, changedBy, ...updates } = args;
    const employee = await ctx.db.get(employeeId);
    if (!employee) throw new Error("Employee not found");

    const changes: { oldValue?: string; newValue?: string }[] = [];
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && (employee as any)[key] !== value) {
        changes.push({
          oldValue: String((employee as any)[key] || ""),
          newValue: String(value),
        });
      }
    }

    await ctx.db.patch(employeeId, {
      ...updates,
      updatedAt: Date.now(),
    });

    // Create timeline events for significant changes
    for (const change of changes) {
      await createTimelineEvent(ctx, employeeId, "update", "Employee Updated", changedBy, change);
    }

    return { success: true };
  },
});

// ─── Archive Employee ────────────────────────────────────────────

export const archiveEmployee = mutation({
  args: {
    employeeId: v.id("employeeMaster"),
    changedBy: v.id("employeeMaster"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) throw new Error("Employee not found");

    await ctx.db.patch(args.employeeId, {
      status: "archived",
      updatedAt: Date.now(),
    });

    await createTimelineEvent(ctx, args.employeeId, "archived", "Employee Archived", args.changedBy, {
      remarks: args.reason || "Archived",
    });

    return { success: true };
  },
});

// ─── Restore Employee ────────────────────────────────────────────

export const restoreEmployee = mutation({
  args: {
    employeeId: v.id("employeeMaster"),
    changedBy: v.id("employeeMaster"),
  },
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) throw new Error("Employee not found");

    await ctx.db.patch(args.employeeId, {
      status: "active",
      updatedAt: Date.now(),
    });

    await createTimelineEvent(ctx, args.employeeId, "restored", "Employee Restored", args.changedBy);
    return { success: true };
  },
});

// ─── List Employees ──────────────────────────────────────────────

export const listEmployees = query({
  args: {
    status: v.optional(v.union(
      v.literal("active"), v.literal("onboarding"),
      v.literal("probation"), v.literal("suspended"),
      v.literal("resigned"), v.literal("terminated"),
      v.literal("retired"), v.literal("archived"),
    )),
    departmentId: v.optional(v.id("departments")),
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    designationId: v.optional(v.id("designations")),
    employmentType: v.optional(v.union(
      v.literal("permanent"), v.literal("contract"),
      v.literal("part_time"), v.literal("intern"),
      v.literal("freelancer"), v.literal("consultant"),
    )),
    reportingManagerId: v.optional(v.id("employeeMaster")),
  },
  handler: async (ctx, args) => {
    let employees = await ctx.db.query("employeeMaster").collect();

    if (args.status) employees = employees.filter((e) => e.status === args.status);
    if (args.departmentId) employees = employees.filter((e) => e.departmentId === args.departmentId);
    if (args.branchId) employees = employees.filter((e) => e.branchId === args.branchId);
    if (args.companyId) employees = employees.filter((e) => e.companyId === args.companyId);
    if (args.designationId) employees = employees.filter((e) => e.designationId === args.designationId);
    if (args.employmentType) employees = employees.filter((e) => e.employmentType === args.employmentType);
    if (args.reportingManagerId) employees = employees.filter((e) => e.reportingManagerId === args.reportingManagerId);

    // Enrich with person names
    const enriched = await Promise.all(
      employees.map(async (emp) => {
        const person = emp.personId ? await ctx.db.get(emp.personId) : null;
        const dept = emp.departmentId ? await ctx.db.get(emp.departmentId) : null;
        const desig = emp.designationId ? await ctx.db.get(emp.designationId) : null;
        return {
          ...emp,
          personName: person?.displayName || `${person?.firstName || ""} ${person?.lastName || ""}`.trim() || "Unknown",
          departmentName: dept?.name || null,
          designationName: desig?.name || null,
        };
      })
    );

    return enriched;
  },
});

// ─── Get Employee Stats ──────────────────────────────────────────

export const getEmployeeStats = query({
  handler: async (ctx) => {
    const employees = await ctx.db.query("employeeMaster").collect();
    return {
      total: employees.length,
      active: employees.filter((e) => e.status === "active").length,
      onboarding: employees.filter((e) => e.status === "onboarding").length,
      probation: employees.filter((e) => e.status === "probation").length,
      suspended: employees.filter((e) => e.status === "suspended").length,
      resigned: employees.filter((e) => e.status === "resigned").length,
      terminated: employees.filter((e) => e.status === "terminated").length,
      retired: employees.filter((e) => e.status === "retired").length,
      archived: employees.filter((e) => e.status === "archived").length,
      permanent: employees.filter((e) => e.employmentType === "permanent").length,
      contract: employees.filter((e) => e.employmentType === "contract").length,
      partTime: employees.filter((e) => e.employmentType === "part_time").length,
      intern: employees.filter((e) => e.employmentType === "intern").length,
      freelancer: employees.filter((e) => e.employmentType === "freelancer").length,
      consultant: employees.filter((e) => e.employmentType === "consultant").length,
    };
  },
});
