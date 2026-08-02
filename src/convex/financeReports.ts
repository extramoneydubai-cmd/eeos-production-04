import { v } from "convex/values";
import { query } from "./_generated/server";

// ─── DAILY COLLECTION REPORT ────────────────────────────

export const getDailyCollectionReport = query({
  args: { date: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const reportDate = args.date || Date.now();
    const startOfDay = new Date(reportDate).setHours(0, 0, 0, 0);
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

    const payments = await ctx.db.query("paymentTransactions").collect();
    const dayPayments = payments.filter(
      (p: any) => p.paymentDate >= startOfDay && p.paymentDate < endOfDay
    );

    const verifiedPayments = dayPayments.filter(
      (p: any) => p.status === "verified" || p.status === "completed"
    );

    const totalCollection = verifiedPayments.reduce((s: number, p: any) => s + p.amount, 0);

    // Group by payment method
    const byMethod: Record<string, number> = {};
    for (const p of verifiedPayments) {
      byMethod[p.paymentMethod] = (byMethod[p.paymentMethod] || 0) + p.amount;
    }

    return {
      date: reportDate,
      totalCollection,
      transactionCount: dayPayments.length,
      verifiedCount: verifiedPayments.length,
      pendingCount: dayPayments.filter((p: any) => p.status === "pending").length,
      byMethod: Object.entries(byMethod).map(([method, amount]) => ({ method, amount })),
    };
  },
});

// ─── OUTSTANDING FEES REPORT ─────────────────────────────

export const getOutstandingReport = query({
  args: { asOfDate: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const asOf = args.asOfDate || Date.now();

    const accounts = await ctx.db.query("studentFeeAccounts")
      .filter((q: any) => q.neq(q.field("status"), "closed"))
      .collect();

    let totalOutstanding = 0;
    let totalStudents = 0;
    let overdueCount = 0;
    let overdueAmount = 0;

    const now = Date.now();

    for (const account of accounts) {
      totalOutstanding += account.outstandingBalance;
      totalStudents++;

      const installments = await ctx.db.query("feeInstallments")
        .withIndex("studentId", (q: any) => q.eq("studentId", account.studentId))
        .filter((q: any) => q.eq(q.field("status"), "overdue"))
        .collect();

      if (installments.length > 0) {
        overdueCount++;
        overdueAmount += installments.reduce((s: number, i: any) => s + i.amount + i.lateFee, 0);
      }
    }

    return {
      asOf,
      totalOutstanding,
      totalStudentsWithBalance: totalStudents,
      overdueCount,
      overdueAmount,
      averageOutstanding: totalStudents > 0 ? Math.round(totalOutstanding / totalStudents) : 0,
      collectionRate: totalOutstanding > 0
        ? Math.round(((accounts.reduce((s: number, a: any) => s + a.totalPaid, 0)) /
            (accounts.reduce((s: number, a: any) => s + a.totalFee, 0) || 1)) * 100)
        : 0,
    };
  },
});

// ─── REVENUE REPORT ──────────────────────────────────────

export const getRevenueReport = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    groupBy: v.optional(v.union(v.literal("day"), v.literal("month"), v.literal("year"))),
  },
  handler: async (ctx, args) => {
    const start = args.startDate || 0;
    const end = args.endDate || Date.now();

    const payments = await ctx.db.query("paymentTransactions")
      .filter((q: any) => q.neq(q.field("status"), "reversed"))
      .filter((q: any) => q.neq(q.field("status"), "refunded"))
      .collect();

    const filtered = payments.filter(
      (p: any) => p.paymentDate >= start && p.paymentDate <= end
    );

    const totalRevenue = filtered
      .filter((p: any) => p.status === "verified" || p.status === "completed")
      .reduce((s: number, p: any) => s + p.amount, 0);

    // Revenue by period
    const byPeriod: Record<string, number> = {};
    for (const p of filtered) {
      const d = new Date(p.paymentDate);
      let key: string;
      if (args.groupBy === "year") {
        key = `${d.getFullYear()}`;
      } else if (args.groupBy === "month") {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      }
      byPeriod[key] = (byPeriod[key] || 0) + p.amount;
    }

    return {
      period: { start, end },
      totalRevenue,
      totalTransactions: filtered.length,
      verifiedAmount: filtered
        .filter((p: any) => p.status === "verified" || p.status === "completed")
        .reduce((s: number, p: any) => s + p.amount, 0),
      byPeriod: Object.entries(byPeriod).map(([period, amount]) => ({ period, amount })),
    };
  },
});

// ─── EXPENSE REPORT ──────────────────────────────────────

export const getExpenseReport = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const start = args.startDate || 0;
    const end = args.endDate || Date.now();

    const expenses = await ctx.db.query("expenseRecords").collect();
    const filtered = expenses.filter(
      (e: any) => e.expenseDate >= start && e.expenseDate <= end
    );

    const totalExpenses = filtered.reduce((s: number, e: any) => s + e.amount, 0);
    const approvedExpenses = filtered
      .filter((e: any) => e.status === "approved" || e.status === "paid")
      .reduce((s: number, e: any) => s + e.amount, 0);

    // Group by category
    const byCategory: Record<string, number> = {};
    for (const e of filtered) {
      const cat = e.expenseCategoryId || "uncategorized";
      byCategory[cat] = (byCategory[cat] || 0) + e.amount;
    }

    return {
      period: { start, end },
      totalExpenses,
      approvedExpenses,
      pendingExpenses: filtered
        .filter((e: any) => e.status === "pending_approval" || e.status === "draft")
        .reduce((s: number, e: any) => s + e.amount, 0),
      paidExpenses: filtered
        .filter((e: any) => e.status === "paid")
        .reduce((s: number, e: any) => s + e.amount, 0),
      expenseCount: filtered.length,
      byCategory,
    };
  },
});

// ─── PROFIT SUMMARY ──────────────────────────────────────

export const getProfitSummary = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const start = args.startDate || 0;
    const end = args.endDate || Date.now();

    // Revenue
    const payments = await ctx.db.query("paymentTransactions").collect();
    const revenuePayments = payments
      .filter((p: any) => (p.status === "verified" || p.status === "completed") && p.paymentDate >= start && p.paymentDate <= end);
    const totalRevenue = revenuePayments.reduce((s: number, p: any) => s + p.amount, 0);

    // Expenses
    const expenses = await ctx.db.query("expenseRecords").collect();
    const approvedExpenses = expenses
      .filter((e: any) => (e.status === "paid" || e.status === "approved") && e.expenseDate >= start && e.expenseDate <= end);
    const totalExpenses = approvedExpenses.reduce((s: number, e: any) => s + e.amount, 0);

    // Refunds
    const refunds = await ctx.db.query("refundRequests").collect();
    const completedRefunds = refunds
      .filter((r: any) => r.status === "completed" && r.createdAt >= start && r.createdAt <= end);
    const totalRefunds = completedRefunds.reduce((s: number, r: any) => s + r.amount, 0);

    return {
      period: { start, end },
      totalRevenue,
      totalExpenses,
      totalRefunds,
      netProfit: totalRevenue - totalExpenses - totalRefunds,
      profitMargin: totalRevenue > 0
        ? Math.round(((totalRevenue - totalExpenses - totalRefunds) / totalRevenue) * 100)
        : 0,
      expenseRatio: totalRevenue > 0 ? Math.round((totalExpenses / totalRevenue) * 100) : 0,
    };
  },
});

// ─── BRANCH COLLECTION REPORT ────────────────────────────

export const getBranchCollectionReport = query({
  args: {
    branchId: v.id("branches"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const start = args.startDate || 0;
    const end = args.endDate || Date.now();

    // Get students for this branch
    const students = await ctx.db.query("studentMaster")
      .filter((q: any) => q.eq(q.field("branchId"), args.branchId))
      .collect();

    const studentIds = students.map((s: any) => s._id);

    const accounts = await ctx.db.query("studentFeeAccounts").collect();
    const branchAccounts = accounts.filter((a: any) => studentIds.includes(a.studentId));

    const payments = await ctx.db.query("paymentTransactions").collect();
    const branchPayments = payments.filter(
      (p: any) => studentIds.includes(p.studentId) && p.paymentDate >= start && p.paymentDate <= end
    );

    const totalCollection = branchPayments
      .filter((p: any) => p.status === "verified" || p.status === "completed")
      .reduce((s: number, p: any) => s + p.amount, 0);

    const totalOutstanding = branchAccounts.reduce((s: number, a: any) => s + a.outstandingBalance, 0);

    return {
      branchId: args.branchId,
      totalStudents: students.length,
      totalCollection,
      totalOutstanding,
      transactionCount: branchPayments.length,
      studentCountWithBalance: branchAccounts.filter((a: any) => a.outstandingBalance > 0).length,
    };
  },
});

// ─── STUDENT LEDGER ──────────────────────────────────────

export const getStudentLedger = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    const account = await ctx.db.query("studentFeeAccounts")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .first();

    if (!account) return null;

    const installments = await ctx.db.query("feeInstallments")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .order("asc")
      .collect();

    const payments = await ctx.db.query("paymentTransactions")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .order("asc")
      .collect();

    const invoices = await ctx.db.query("feeInvoices")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .collect();

    // Build ledger entries
    const entries: any[] = [];

    for (const inst of installments) {
      entries.push({
        date: inst.dueDate,
        type: "installment",
        description: `Installment ${inst.installmentNumber} of ${inst.totalInstallments}`,
        debit: inst.amount,
        credit: 0,
        balance: 0, // calculated below
        status: inst.status,
        reference: inst._id,
      });
      if (inst.lateFee > 0) {
        entries.push({
          date: inst.dueDate,
          type: "late_fee",
          description: `Late fee - Installment ${inst.installmentNumber}`,
          debit: inst.lateFee,
          credit: 0,
          balance: 0,
          status: inst.status,
          reference: inst._id,
        });
      }
    }

    for (const p of payments) {
      entries.push({
        date: p.paymentDate,
        type: "payment",
        description: `Payment via ${p.paymentMethod} (${p.transactionNumber})`,
        debit: 0,
        credit: p.amount,
        balance: 0,
        status: p.status,
        reference: p._id,
      });
    }

    // Sort by date
    entries.sort((a: any, b: any) => a.date - b.date);

    // Calculate running balance
    let runningBalance = 0;
    for (const e of entries) {
      runningBalance += e.debit - e.credit;
      e.balance = runningBalance;
    }

    return {
      account,
      installments,
      payments,
      invoices,
      ledger: entries,
      summary: {
        totalFee: account.totalFee,
        totalPaid: account.totalPaid,
        outstanding: account.outstandingBalance,
        totalDiscount: account.totalDiscount,
        totalScholarship: account.totalScholarship,
        totalWaiver: account.totalWaiver,
        paymentCount: payments.length,
        invoiceCount: invoices.length,
      },
    };
  },
});

// ─── FINANCE DASHBOARD ───────────────────────────────────

export const getFinanceDashboard = query({
  handler: async (ctx) => {
    // Today's range
    const now = Date.now();
    const startOfDay = new Date(now).setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);
    const startOfMonthMs = startOfMonth.setHours(0, 0, 0, 0);

    // Payments
    const payments = await ctx.db.query("paymentTransactions").collect();
    const todayPayments = payments.filter((p: any) => p.paymentDate >= startOfDay);
    const todayCollection = todayPayments
      .filter((p: any) => p.status === "verified" || p.status === "completed")
      .reduce((s: number, p: any) => s + p.amount, 0);
    const todayPending = todayPayments
      .filter((p: any) => p.status === "pending")
      .reduce((s: number, p: any) => s + p.amount, 0);

    // Monthly revenue
    const monthPayments = payments.filter((p: any) => p.paymentDate >= startOfMonthMs);
    const monthlyRevenue = monthPayments
      .filter((p: any) => p.status === "verified" || p.status === "completed")
      .reduce((s: number, p: any) => s + p.amount, 0);

    // Fee accounts
    const accounts = await ctx.db.query("studentFeeAccounts").collect();
    const totalOutstanding = accounts.reduce((s: number, a: any) => s + a.outstandingBalance, 0);
    const overdueAccounts = accounts.filter((a: any) => a.outstandingBalance > a.totalFee * 0.5);
    const overdueAmount = overdueAccounts.reduce((s: number, a: any) => s + a.outstandingBalance, 0);

    // Expenses
    const expenses = await ctx.db.query("expenseRecords").collect();
    const monthExpenses = expenses.filter((e: any) => e.expenseDate >= startOfMonthMs);
    const monthlyExpense = monthExpenses
      .filter((e: any) => e.status === "paid" || e.status === "approved")
      .reduce((s: number, e: any) => s + e.amount, 0);

    // Invoices
    const invoices = await ctx.db.query("feeInvoices").collect();
    const pendingInvoices = invoices.filter((i: any) => i.status === "pending" || i.status === "partial");
    const pendingAmount = pendingInvoices.reduce((s: number, i: any) => s + i.balanceDue, 0);
    const overdueInvoices = invoices.filter((i: any) => i.status === "overdue");
    const overdueInvoiceAmount = overdueInvoices.reduce((s: number, i: any) => s + i.balanceDue, 0);

    // Cash balance
    const cashEntries = await ctx.db.query("cashBookEntries").collect();
    const totalCashIn = cashEntries
      .filter((e: any) => e.entryType === "debit")
      .reduce((s: number, e: any) => s + e.amount, 0);
    const totalCashOut = cashEntries
      .filter((e: any) => e.entryType === "credit")
      .reduce((s: number, e: any) => s + e.amount, 0);

    return {
      todayCollection,
      todayPending,
      todayCount: todayPayments.length,
      monthlyRevenue,
      monthlyExpense,
      monthlyNet: monthlyRevenue - monthlyExpense,
      totalOutstanding,
      overdueAmount,
      pendingInvoices: pendingInvoices.length,
      pendingInvoiceAmount: pendingAmount,
      overdueInvoices: overdueInvoices.length,
      overdueInvoiceAmount,
      totalAccounts: accounts.length,
      cashBalance: totalCashIn - totalCashOut,
      totalCashIn,
      totalCashOut,
    };
  },
});
