/**
 * Payroll Engine — Employee Payroll & Salary Management
 *
 * Manages salary structures, pay runs, deductions, and payslip generation.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

/**
 * Resolve the acting performer for payroll mutations.
 *
 * Real sessions resolve via withScopeAndEvents (ctx.__performerUserId).
 * Demo/local sessions (no valid session token) fall back to the first
 * super-admin user (the seeded CEO) so payroll operations still work
 * end-to-end instead of throwing "Not authenticated" — consistent with
 * the attendance engine's demo-mode behavior.
 */
async function resolvePerformer(ctx: any): Promise<string | undefined> {
  if (ctx.__performerUserId) return ctx.__performerUserId as string;
  try {
    const users = await ctx.db.query("users").collect();
    const admin = users.find(
      (u: any) => u.role === "super_admin" || u.username === "ceo"
    );
    return admin?._id as string | undefined;
  } catch {
    return undefined;
  }
}

// ─── Salary Structure ────────────────────────────────────────

export const createSalaryStructure = mutation({
  args: { token: v.optional(v.string()),
    employeeId: v.id("users"),
    basicSalary: v.number(),
    hra: v.optional(v.number()),
    allowances: v.optional(v.array(v.object({ name: v.string(), amount: v.number() }))),
    deductions: v.optional(v.array(v.object({ name: v.string(), amount: v.number() }))),
    effectiveFrom: v.number(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "hr", entity: "payrollEngine" }, async (ctx, args) => {
    const userId = (await resolvePerformer(ctx)) as any;

    const totalAllowances = (args.allowances || []).reduce((s: number, a: any) => s + a.amount, 0);
    const totalDeductions = (args.deductions || []).reduce((s: number, d: any) => s + d.amount, 0);
    const grossSalary = args.basicSalary + (args.hra || 0) + totalAllowances;
    const netSalary = grossSalary - totalDeductions;

    return ctx.db.insert("salaryStructures", {
      employeeId: args.employeeId,
      basicSalary: args.basicSalary,
      hra: args.hra,
      allowances: args.allowances,
      deductions: args.deductions,
      grossSalary,
      totalDeductions,
      netSalary,
      effectiveFrom: args.effectiveFrom,
      isActive: true,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

// ─── Pay Run ─────────────────────────────────────────────────

export const processPayRun = mutation({
  args: { token: v.optional(v.string()),
    month: v.number(),
    year: v.number(),
    employeeIds: v.array(v.id("users")),
    processedBy: v.optional(v.id("users")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "hr", entity: "payrollEngine" }, async (ctx, args) => {
    const userId = (await resolvePerformer(ctx)) as any;

    const payslips: any[] = [];
    for (const empId of args.employeeIds) {
      const salaryStructure = await ctx.db.query("salaryStructures")
        .withIndex("employeeId", (q: any) => q.eq("employeeId", empId))
        .filter((q: any) => q.eq(q.field("isActive"), true))
        .first();

      if (!salaryStructure) continue;

      // Calculate attendance-based deductions
      const startOfMonth = new Date(args.year, args.month - 1, 1).getTime();
      const endOfMonth = new Date(args.year, args.month, 0, 23, 59, 59).getTime();

      const attendance = await ctx.db.query("attendanceRecords")
        .withIndex("entityType_entityId", (q: any) =>
          q.eq("entityType", "employee").eq("entityId", empId))
        .collect();

      const absences = attendance.filter((a: any) =>
        a.date >= startOfMonth && a.date <= endOfMonth && a.status === "absent"
      );

      const workingDays = new Date(args.year, args.month, 0).getDate();
      const perDaySalary = salaryStructure.netSalary / workingDays;
      const deductionForAbsence = absences.length * perDaySalary;

      const netPayable = salaryStructure.netSalary - deductionForAbsence;

      const payslipId = await ctx.db.insert("payslips", {
        employeeId: empId,
        month: args.month,
        year: args.year,
        grossSalary: salaryStructure.grossSalary,
        totalDeductions: salaryStructure.totalDeductions + deductionForAbsence,
        netPayable: Math.max(0, netPayable),
        absenceDays: absences.length,
        status: "processing",
        processedBy: args.processedBy || userId,
        generatedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      payslips.push(payslipId);
    }

    return payslips;
  }),
});

export const listSalaryStructures = query({
  args: {
    employeeId: v.optional(v.id("users")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("salaryStructures");
    if (args.employeeId) q = q.filter((q2: any) => q2.eq(q2.field("employeeId"), args.employeeId));
    if (args.isActive !== undefined) q = q.filter((q2: any) => q2.eq(q2.field("isActive"), args.isActive));
    return q.order("desc").collect();
  },
});

export const approvePayRun = mutation({
  args: { token: v.optional(v.string()),
    payslipIds: v.array(v.id("payslips")),
  },
  handler: withScopeAndEvents({ operation: "approve", module: "hr", entity: "payrollEngine" }, async (ctx, args) => {
    for (const id of args.payslipIds) {
      await ctx.db.patch(id, { status: "approved", approvedAt: Date.now(), updatedAt: Date.now() });
    }
    return args.payslipIds;
  }),
});

export const listPayslips = query({
  args: {
    employeeId: v.optional(v.id("users")),
    month: v.optional(v.number()),
    year: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("payslips");
    if (args.employeeId) q = q.filter((q2: any) => q2.eq(q2.field("employeeId"), args.employeeId));
    if (args.month) q = q.filter((q2: any) => q2.eq(q2.field("month"), args.month));
    if (args.year) q = q.filter((q2: any) => q2.eq(q2.field("year"), args.year));
    if (args.status) q = q.filter((q2: any) => q2.eq(q2.field("status"), args.status));
    return q.order("desc").collect();
  },
});
