/**
 * Financial Closing Engine (Part 11)
 *
 * Month, quarter, and year closing.
 * Lock periods, unlock workflow, closing checklist, audit trail.
 * No manual period overrides.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ═══════════════════════════════════════════════════════════════════
// FINANCIAL YEARS & PERIODS
// ═══════════════════════════════════════════════════════════════════

export const listFinancialYears = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("financeFinancialYears") as any;
    if (args.activeOnly) q = q.filter((f: any) => f.eq(f.field("active"), true));
    return await q.collect();
  },
});

export const getCurrentFinancialYear = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("financeFinancialYears")
      .filter((q: any) => q.eq(q.field("isCurrent"), true))
      .first();
  },
});

export const createFinancialYear = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(), code: v.string(),
    startDate: v.number(), endDate: v.number(),
    isCurrent: v.boolean(),
    description: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "create", module: "finance", entity: "financialClosingEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");
    const now = Date.now();
    return await ctx.db.insert("financeFinancialYears", {
      ...args, isClosed: false,
      active: true, sequence: 0,
      color: "#3b82f6", icon: "Calendar",
      createdAt: now, updatedAt: now,
    });
  }),
});

export const setCurrentFinancialYear = mutation({
  args: { token: v.optional(v.string()), id: v.id("financeFinancialYears") },
  handler: withScopeAndEvents({ operation: "update", module: "finance", entity: "financialClosingEngine" }, async (ctx, args) => {
    const all = await ctx.db.query("financeFinancialYears").collect();
    for (const fy of all) {
      await ctx.db.patch(fy._id, { isCurrent: fy._id === args.id });
    }
    return args.id;
  }),
});

// ═══════════════════════════════════════════════════════════════════
// CLOSING PERIODS
// ═══════════════════════════════════════════════════════════════════

export const listClosingPeriods = query({
  args: {
    periodType: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("financialClosings") as any;
    if (args.periodType) q = q.filter((f: any) => f.eq(f.field("periodType"), args.periodType));
    if (args.status) q = q.filter((f: any) => f.eq(f.field("status"), args.status));
    return await q.order("desc").collect();
  },
});

export const initiateClosing = mutation({
  args: { token: v.optional(v.string()),
    periodType: v.union(v.literal("month"), v.literal("quarter"), v.literal("year")),
    periodLabel: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    financialYearId: v.optional(v.id("financeFinancialYears")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "finance", entity: "financialClosingEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");
    const now = Date.now();

    // Check if period already closed
    const existing = await ctx.db
      .query("financialClosings")
      .filter((q: any) => q.and(
        q.eq(q.field("periodType"), args.periodType),
        q.eq(q.field("periodLabel"), args.periodLabel),
        q.eq(q.field("status"), "closed"),
      ))
      .first();

    if (existing) throw new Error("Period already closed");

    return await ctx.db.insert("financialClosings", {
      periodType: args.periodType,
      periodLabel: args.periodLabel,
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      financialYearId: args.financialYearId,
      status: "in_progress",
      checklistItems: JSON.stringify([
        { task: "Verify all transactions posted", completed: false },
        { task: "Reconcile bank accounts", completed: false },
        { task: "Verify journal entries balanced", completed: false },
        { task: "Review outstanding invoices", completed: false },
        { task: "Calculate and post depreciation", completed: false },
        { task: "Verify tax filings", completed: false },
        { task: "Generate closing reports", completed: false },
      ]),
      closedBy: userId,
      closedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const completeClosing = mutation({
  args: { token: v.optional(v.string()),
    id: v.id("financialClosings"),
    remarks: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "finance", entity: "financialClosingEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");
    const now = Date.now();

    await ctx.db.patch(args.id, {
      status: "closed",
      closedBy: userId,
      closedAt: now,
      remarks: args.remarks,
      updatedAt: now,
    });

    // Lock period — prevent further transactions in this period
    // (Convex-level enforcement would check closing status)

    return args.id;
  }),
});

export const reopenPeriod = mutation({
  args: { token: v.optional(v.string()),
    id: v.id("financialClosings"),
    reason: v.string(),
  },
  handler: withScopeAndEvents({ operation: "update", module: "finance", entity: "financialClosingEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    const closing = await ctx.db.get(args.id);
    if (!closing) throw new Error("Closing not found");
    if ((closing as any).status !== "closed") throw new Error("Period is not closed");

    await ctx.db.patch(args.id, {
      status: "reopened",
      remarks: `Reopened: ${args.reason}`,
      updatedAt: Date.now(),
    });

    return args.id;
  }),
});

export const updateClosingChecklist = mutation({
  args: { token: v.optional(v.string()),
    id: v.id("financialClosings"),
    checklistItems: v.string(),
  },
  handler: withScopeAndEvents({ operation: "update", module: "finance", entity: "financialClosingEngine" }, async (ctx, args) => {
    await ctx.db.patch(args.id, {
      checklistItems: args.checklistItems,
      updatedAt: Date.now(),
    });
    return args.id;
  }),
});

// ═══════════════════════════════════════════════════════════════════
// VENDOR FINANCE (Part 7)
// ═══════════════════════════════════════════════════════════════════

export const getVendorLedger = query({
  args: { vendorName: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const bills = await ctx.db
      .query("vendorBills")
      .filter((q: any) => q.eq(q.field("vendorName"), args.vendorName))
      .order("desc")
      .take(args.limit || 50);

    const totalBilled = bills.reduce((s: number, b: any) => s + b.amount, 0);
    const totalPaid = bills.reduce((s: number, b: any) => s + (b.paidAmount || 0), 0);

    return {
      vendorName: args.vendorName,
      bills,
      summary: {
        totalBills: bills.length,
        totalBilled,
        totalPaid,
        outstanding: totalBilled - totalPaid,
        paidBills: bills.filter((b: any) => b.status === "paid").length,
        pendingBills: bills.filter((b: any) => b.status === "pending" || b.status === "partial").length,
        overdueBills: bills.filter((b: any) => b.status === "overdue").length,
      },
    };
  },
});

// ═══════════════════════════════════════════════════════════════════
// HR FINANCE (Part 8)
// ═══════════════════════════════════════════════════════════════════

export const listSalaryComponents = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("hrSalaryComponents") as any;
    if (args.activeOnly) q = q.filter((f: any) => f.eq(f.field("isActive"), true));
    return await q.collect();
  },
});

export const createSalaryComponent = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(), code: v.string(),
    componentType: v.union(v.literal("earning"), v.literal("deduction"), v.literal("employer_contribution")),
    calculationType: v.union(v.literal("fixed"), v.literal("percentage"), v.literal("formula")),
    value: v.optional(v.number()),
    isTaxable: v.boolean(),
    description: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "create", module: "finance", entity: "financialClosingEngine" }, async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("hrSalaryComponents", {
      ...args, isActive: true, createdAt: now, updatedAt: now,
    });
  }),
});

export const createEmployeeAdvance = mutation({
  args: { token: v.optional(v.string()),
    employeeId: v.id("users"),
    amount: v.number(),
    reason: v.string(),
    repaymentType: v.union(v.literal("one_time"), v.literal("installment")),
    installmentCount: v.optional(v.number()),
    installmentAmount: v.optional(v.number()),
  },
  handler: withScopeAndEvents({ operation: "create", module: "finance", entity: "financialClosingEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");
    const now = Date.now();
    return await ctx.db.insert("employeeAdvances", {
      ...args,
      repaidAmount: 0,
      balanceDue: args.amount,
      status: "approved",
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const listEmployeeAdvances = query({
  args: { employeeId: v.optional(v.id("users")), status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("employeeAdvances") as any;
    if (args.employeeId) q = q.filter((f: any) => f.eq(f.field("employeeId"), args.employeeId));
    if (args.status) q = q.filter((f: any) => f.eq(f.field("status"), args.status));
    return await q.order("desc").collect();
  },
});

export const repayEmployeeAdvance = mutation({
  args: { token: v.optional(v.string()),
    id: v.id("employeeAdvances"),
    amount: v.number(),
  },
  handler: withScopeAndEvents({ operation: "update", module: "finance", entity: "financialClosingEngine" }, async (ctx, args) => {
    const advance = await ctx.db.get(args.id);
    if (!advance) throw new Error("Advance not found");
    const advanceData = advance as any;
    const newRepaid = (advanceData.repaidAmount || 0) + args.amount;
    const newBalance = Math.max(0, advanceData.balanceDue - args.amount);

    await ctx.db.patch(args.id, {
      repaidAmount: newRepaid,
      balanceDue: newBalance,
      status: newBalance <= 0 ? "repaid" : advanceData.status,
      updatedAt: Date.now(),
    });

    return args.id;
  }),
});
