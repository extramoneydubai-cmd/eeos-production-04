/**
 * Payroll Engine — Employee Payroll & Salary Management
 *
 * Manages salary structures, pay runs, deductions, and payslip generation.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── Salary Structure ────────────────────────────────────────

export const createSalaryStructure = mutation({
  args: {
    employeeId: v.id("users"),
    basicSalary: v.number(),
    hra: v.optional(v.number()),
    allowances: v.optional(v.array(v.object({ name: v.string(), amount: v.number() }))),
    deductions: v.optional(v.array(v.object({ name: v.string(), amount: v.number() }))),
    effectiveFrom: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const totalAllowances = (args.allowances || []).reduce((s: number, a) => s + a.amount, 0);
    const totalDeductions = (args.deductions || []).reduce((s: number, d) => s + d.amount, 0);
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
  },
});

// ─── Pay Run ─────────────────────────────────────────────────

export const processPayRun = mutation({
  args: {
    month: v.number(),
    year: v.number(),
    employeeIds: v.array(v.id("users")),
    processedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

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
  },
});

export const approvePayRun = mutation({
  args: {
    payslipIds: v.array(v.id("payslips")),
  },
  handler: async (ctx, args) => {
    for (const id of args.payslipIds) {
      await ctx.db.patch(id, { status: "approved", approvedAt: Date.now(), updatedAt: Date.now() });
    }
    return args.payslipIds;
  },
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
