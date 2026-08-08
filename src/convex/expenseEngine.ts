import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

function generateEntryNumber(prefix: string, serial: number): string {
  return `${prefix}-${String(serial).padStart(5, "0")}`;
}

// ─── CREATE EXPENSE ──────────────────────────────────────

export const createExpense = mutation({
  args: { token: v.optional(v.string()),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    expenseCategoryId: v.optional(v.id("financeExpenseCategories")),
    amount: v.number(),
    description: v.string(),
    expenseDate: v.number(),
    isRecurring: v.boolean(),
    recurringFrequency: v.optional(v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("yearly"))),
    vendorName: v.optional(v.string()),
    billReference: v.optional(v.string()),
    attachmentUrl: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "create", module: "finance", entity: "expenseEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    const allExpenses = await ctx.db.query("expenseRecords").collect();
    const entryNumber = generateEntryNumber("EXP", allExpenses.length + 1);

    const id = await ctx.db.insert("expenseRecords", {
      ...args,
      status: "draft",
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { id, entryNumber };
  }),
});

// ─── UPDATE EXPENSE ──────────────────────────────────────

export const updateExpense = mutation({
  args: { token: v.optional(v.string()),
    id: v.id("expenseRecords"),
    amount: v.optional(v.number()),
    description: v.optional(v.string()),
    expenseDate: v.optional(v.number()),
    isRecurring: v.optional(v.boolean()),
    recurringFrequency: v.optional(v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("yearly"))),
    vendorName: v.optional(v.string()),
    billReference: v.optional(v.string()),
    attachmentUrl: v.optional(v.string()),
    expenseCategoryId: v.optional(v.id("financeExpenseCategories")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "finance", entity: "expenseEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    const { token: _token, id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    return id;
  }),
});

// ─── SUBMIT FOR APPROVAL ─────────────────────────────────

export const submitForApproval = mutation({
  args: { token: v.optional(v.string()), id: v.id("expenseRecords") },
  handler: withScopeAndEvents({ operation: "create", module: "finance", entity: "expenseEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    const expense = await ctx.db.get(args.id);
    if (!expense) throw new Error("Expense not found");
    if (expense.status !== "draft") throw new Error("Only draft expenses can be submitted");

    await ctx.db.patch(args.id, {
      status: "pending_approval",
      updatedAt: Date.now(),
    });
    return args.id;
  }),
});

// ─── APPROVE / REJECT EXPENSE ────────────────────────────

export const approveExpense = mutation({
  args: { token: v.optional(v.string()),
    id: v.id("expenseRecords"),
    approve: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "approve", module: "finance", entity: "expenseEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    const expense = await ctx.db.get(args.id);
    if (!expense) throw new Error("Expense not found");
    if (expense.status !== "pending_approval") throw new Error("Expense is not pending approval");

    await ctx.db.patch(args.id, {
      status: args.approve ? "approved" : "rejected",
      approvedBy: userId,
      approvedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return args.id;
  }),
});

// ─── MARK AS PAID ────────────────────────────────────────

export const markExpensePaid = mutation({
  args: { token: v.optional(v.string()),
    id: v.id("expenseRecords"),
    paymentReference: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "finance", entity: "expenseEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    const expense = await ctx.db.get(args.id);
    if (!expense) throw new Error("Expense not found");
    if (expense.status !== "approved") throw new Error("Only approved expenses can be marked paid");

    await ctx.db.patch(args.id, {
      status: "paid",
      updatedAt: Date.now(),
    });
    return args.id;
  }),
});

// ─── QUERIES ─────────────────────────────────────────────

export const listExpenses = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("pending_approval"), v.literal("approved"), v.literal("rejected"), v.literal("paid"))),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    expenseCategoryId: v.optional(v.id("financeExpenseCategories")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("expenseRecords");

    if (args.status) {
      query = query.filter((q: any) => q.eq(q.field("status"), args.status));
    }
    if (args.branchId) {
      query = query.filter((q: any) => q.eq(q.field("branchId"), args.branchId));
    }
    if (args.departmentId) {
      query = query.filter((q: any) => q.eq(q.field("departmentId"), args.departmentId));
    }
    if (args.expenseCategoryId) {
      query = query.filter((q: any) => q.eq(q.field("expenseCategoryId"), args.expenseCategoryId));
    }

    let results = await query.order("desc").collect();

    if (args.startDate) {
      results = results.filter((r: any) => r.expenseDate >= args.startDate!);
    }
    if (args.endDate) {
      results = results.filter((r: any) => r.expenseDate <= args.endDate!);
    }

    return results;
  },
});

export const getExpense = query({
  args: { id: v.id("expenseRecords") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

export const getExpenseSummary = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    let expenses = await ctx.db.query("expenseRecords").collect();

    if (args.startDate) {
      expenses = expenses.filter((e: any) => e.expenseDate >= args.startDate!);
    }
    if (args.endDate) {
      expenses = expenses.filter((e: any) => e.expenseDate <= args.endDate!);
    }
    if (args.branchId) {
      expenses = expenses.filter((e: any) => e.branchId === args.branchId);
    }

    const totalApproved = expenses
      .filter((e: any) => e.status === "approved" || e.status === "paid")
      .reduce((s: number, e: any) => s + e.amount, 0);

    const totalPending = expenses
      .filter((e: any) => e.status === "pending_approval")
      .reduce((s: number, e: any) => s + e.amount, 0);

    const totalDraft = expenses
      .filter((e: any) => e.status === "draft")
      .reduce((s: number, e: any) => s + e.amount, 0);

    const totalPaid = expenses
      .filter((e: any) => e.status === "paid")
      .reduce((s: number, e: any) => s + e.amount, 0);

    return {
      totalCount: expenses.length,
      totalAmount: expenses.reduce((s: number, e: any) => s + e.amount, 0),
      totalApproved,
      totalPending,
      totalDraft,
      totalPaid,
      approvedCount: expenses.filter((e: any) => e.status === "approved" || e.status === "paid").length,
      pendingCount: expenses.filter((e: any) => e.status === "pending_approval").length,
      draftCount: expenses.filter((e: any) => e.status === "draft").length,
      paidCount: expenses.filter((e: any) => e.status === "paid").length,
    };
  },
});
