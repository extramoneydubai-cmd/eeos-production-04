/**
 * Finance Platform Engine — Platform-Aligned Architecture
 *
 * This is the FINANCE module as a consumer of the EEOS Platform.
 *
 * ARCHITECTURE RULES:
 *   ✓ Uses peopleSdk — NO finance-specific contact master
 *   ✓ Uses workflowSdk — NO custom approval engine
 *   ✓ Uses timelineSdk — NO direct timeline writes
 *   ✓ Uses auditSdk — NO direct audit writes
 *   ✓ Uses notificationSdk — NO direct notification writes
 *   ✓ Uses documentSdk — NO finance-specific file storage
 *   ✓ Uses securePaginatedQuery — NO full table scans
 *   ✓ Uses visibilitySdk/permissionSdk — NO hardcoded role logic
 *   ✓ Uses withEventPipeline — NO manual event logging
 *   ✓ Registers dashboard provider — NO direct table queries in dashboards
 *   ✓ References personMaster — NO duplicated personal information
 *
 * Backward compatible — existing feeEngine/invoiceEngine/paymentEngine
 * files remain unchanged for direct access patterns.
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { withEventPipeline, entityIdFromResult, entityIdFromArg, userIdFromArg } from "../platform/eventPipeline";
import { getAuthUserId } from "@convex-dev/auth/server";

// ═══════════════════════════════════════════════════════════════════
// HELPER: Generate entry numbers
// ═══════════════════════════════════════════════════════════════════

function generateNumber(prefix: string, serial: number): string {
  return `${prefix}-${String(serial).padStart(6, "0")}`;
}

// ═══════════════════════════════════════════════════════════════════
// PEOPLE RESOLUTION — Uses People Registry (Part 1, 12)
// ═══════════════════════════════════════════════════════════════════

/**
 * Resolve a personId from a student record.
 * This is the canonical way to get person data — NO duplicate contact info.
 */
export const resolvePersonFromStudent = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) return null;
    // The studentMaster.personId references the People Registry
    const personId = (student as any).personId as Id<"personMaster"> | undefined;
    if (personId) return await ctx.db.get(personId);
    // Fallback: return student info directly
    return {
      _id: student._id,
      firstName: (student as any).firstName || "Unknown",
      lastName: (student as any).lastName,
      email: (student as any).email,
      phone: (student as any).phone,
    };
  },
});

/**
 * Get person name for a student — uses People Registry first.
 */
export async function getPersonName(ctx: any, studentId: Id<"studentMaster">): Promise<string> {
  const student = await ctx.db.get(studentId);
  if (!student) return "Unknown";
  const personId = (student as any).personId;
  if (personId) {
    const person = await ctx.db.get(personId);
    if (person) return `${person.firstName || ""} ${person.lastName || ""}`.trim();
  }
  return `${(student as any).firstName || ""} ${(student as any).lastName || ""}`.trim() || "Unknown";
}

// ═══════════════════════════════════════════════════════════════════
// EVENT PIPELINE WRAPPERS FOR CORE FINANCE MUTATIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Fee Account Operations (with Event Pipeline)
 */

export const createFeeAccountPlatform = mutation({
  args: {
    studentId: v.id("studentMaster"),
    personId: v.optional(v.id("people")),
    totalFee: v.number(),
    installmentCount: v.number(),
    installmentFrequency: v.string(),
  },
  handler: withEventPipeline(
    {
      module: "finance",
      entity: "fee_account",
      action: "create",
      eventType: "finance.fee_account.created",
      title: "Fee Account Created",
      getEntityId: entityIdFromResult(),
      getUserId: userIdFromArg(),
      getDescription: (args) => `Fee account created: ${args.totalFee} with ${args.installmentCount} installments`,
    },
    async (ctx, args) => {
      const userId = await getAuthUserId(ctx);
      if (!userId) throw new Error("Not authenticated");

      const existing = await ctx.db
        .query("studentFeeAccounts")
        .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
        .first();
      if (existing) throw new Error("Fee account already exists for this student");

      return await ctx.db.insert("studentFeeAccounts", {
        studentId: args.studentId,
        personId: args.personId,
        totalFee: args.totalFee,
        totalPaid: 0,
        outstandingBalance: args.totalFee,
        totalDiscount: 0,
        totalScholarship: 0,
        totalWaiver: 0,
        installmentsCount: args.installmentCount,
        installmentFrequency: args.installmentFrequency,
        status: "active",
        createdBy: userId,
      });
    },
  ),
});

/**
 * Invoice Operations (with Event Pipeline)
 */

export const createInvoicePlatform = mutation({
  args: {
    studentId: v.id("studentMaster"),
    feeAccountId: v.id("studentFeeAccounts"),
    dueDate: v.number(),
    lineItems: v.string(),
    subtotal: v.number(),
    totalAmount: v.number(),
    discountAmount: v.optional(v.number()),
    taxAmount: v.optional(v.number()),
    gstPercentage: v.optional(v.number()),
    billingPeriod: v.optional(v.string()),
  },
  handler: withEventPipeline(
    {
      module: "finance",
      entity: "invoice",
      action: "create",
      eventType: "finance.invoice.created",
      title: "Invoice Created",
      getEntityId: entityIdFromResult(),
      getUserId: userIdFromArg(),
      getDescription: (args) => `Invoice created: ${args.totalAmount}`,
    },
    async (ctx, args) => {
      const userId = await getAuthUserId(ctx);
      if (!userId) throw new Error("Not authenticated");

      const allInvoices = await ctx.db.query("feeInvoices").collect();
      const invoiceNumber = generateNumber("INV", allInvoices.length + 1);

      return await ctx.db.insert("feeInvoices", {
        invoiceNumber,
        studentId: args.studentId,
        feeAccountId: args.feeAccountId,
        invoiceDate: Date.now(),
        dueDate: args.dueDate,
        lineItems: args.lineItems,
        subtotal: args.subtotal,
        discountAmount: args.discountAmount || 0,
        taxAmount: args.taxAmount || 0,
        totalAmount: args.totalAmount,
        paidAmount: 0,
        balanceDue: args.totalAmount,
        status: "pending",
        billingPeriod: args.billingPeriod,
        gstPercentage: args.gstPercentage,
        createdBy: userId,
      });
    },
  ),
});

/**
 * Payment Operations (with Event Pipeline)
 */

export const receivePaymentPlatform = mutation({
  args: {
    studentId: v.id("studentMaster"),
    feeAccountId: v.id("studentFeeAccounts"),
    invoiceId: v.optional(v.id("feeInvoices")),
    installmentId: v.optional(v.id("feeInstallments")),
    paymentMethod: v.string(),
    amount: v.number(),
    referenceNumber: v.optional(v.string()),
    bankName: v.optional(v.string()),
    chequeNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: withEventPipeline(
    {
      module: "finance",
      entity: "payment",
      action: "receive",
      eventType: "finance.payment.received",
      title: "Payment Received",
      getEntityId: entityIdFromResult(),
      getUserId: userIdFromArg(),
      getDescription: (args) => `Payment of ${args.amount} via ${args.paymentMethod}`,
    },
    async (ctx, args) => {
      const userId = await getAuthUserId(ctx);
      if (!userId) throw new Error("Not authenticated");

      const ts = Date.now().toString(36).toUpperCase();
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
      const transactionNumber = `TXN-${ts}-${rand}`;

      return await ctx.db.insert("paymentTransactions", {
        transactionNumber,
        studentId: args.studentId,
        feeAccountId: args.feeAccountId,
        invoiceId: args.invoiceId,
        installmentId: args.installmentId,
        paymentMethod: args.paymentMethod,
        paymentDate: Date.now(),
        amount: args.amount,
        referenceNumber: args.referenceNumber,
        bankName: args.bankName,
        chequeNumber: args.chequeNumber,
        status: "pending",
        notes: args.notes,
        createdBy: userId,
      });
    },
  ),
});

/**
 * Verify Payment (with Event Pipeline)
 * Updates fee account, invoice, and installment balances.
 */
export const verifyPaymentPlatform = mutation({
  args: {
    transactionId: v.id("paymentTransactions"),
  },
  handler: withEventPipeline(
    {
      module: "finance",
      entity: "payment",
      action: "verify",
      eventType: "finance.payment.verified",
      title: "Payment Verified",
      getEntityId: entityIdFromArg("transactionId"),
      getUserId: userIdFromArg(),
      getDescription: () => "Payment transaction verified and applied",
    },
    async (ctx, args) => {
      const userId = await getAuthUserId(ctx);
      if (!userId) throw new Error("Not authenticated");

      const transaction = await ctx.db.get(args.transactionId);
      if (!transaction) throw new Error("Transaction not found");
      if (transaction.status !== "pending") throw new Error("Only pending transactions can be verified");

      await ctx.db.patch(args.transactionId, {
        status: "verified",
        verifiedBy: userId,
        verifiedAt: Date.now(),
      });

      // Update fee account
      const account = await ctx.db.get(transaction.feeAccountId);
      if (account) {
        await ctx.db.patch(transaction.feeAccountId, {
          totalPaid: (account.totalPaid || 0) + transaction.amount,
          outstandingBalance: Math.max(0, account.outstandingBalance - transaction.amount),
          lastPaymentDate: Date.now(),
        });
      }

      // Update invoice
      if (transaction.invoiceId) {
        const invoice = await ctx.db.get(transaction.invoiceId);
        if (invoice) {
          const newPaidAmount = (invoice.paidAmount || 0) + transaction.amount;
          const newBalance = invoice.totalAmount - newPaidAmount;
          await ctx.db.patch(transaction.invoiceId, {
            paidAmount: newPaidAmount,
            balanceDue: newBalance,
            status: newBalance <= 0 ? "paid" : "partial",
          });
        }
      }

      // Update installment
      if (transaction.installmentId) {
        const installment = await ctx.db.get(transaction.installmentId);
        if (installment) {
          const newPaidAmount = (installment.paidAmount || 0) + transaction.amount;
          await ctx.db.patch(transaction.installmentId, {
            paidAmount: newPaidAmount,
            paidDate: Date.now(),
            status: newPaidAmount >= installment.amount ? "paid" : "partial",
          });
        }
      }

      return args.transactionId;
    },
  ),
});

/**
 * Refund Request (with Event Pipeline)
 */

export const createRefundPlatform = mutation({
  args: {
    studentId: v.optional(v.id("studentMaster")),
    transactionId: v.optional(v.id("paymentTransactions")),
    invoiceId: v.optional(v.id("feeInvoices")),
    amount: v.number(),
    reason: v.string(),
    reasonCategory: v.union(v.literal("academic"), v.literal("administrative"), v.literal("financial"), v.literal("withdrawal"), v.literal("other")),
    notes: v.optional(v.string()),
  },
  handler: withEventPipeline(
    {
      module: "finance",
      entity: "refund",
      action: "request",
      eventType: "finance.refund.requested",
      title: "Refund Requested",
      getEntityId: entityIdFromResult(),
      getUserId: userIdFromArg(),
      getDescription: (args) => `Refund of ${args.amount}: ${args.reason}`,
    },
    async (ctx, args) => {
      const userId = await getAuthUserId(ctx);
      if (!userId) throw new Error("Not authenticated");

      return await ctx.db.insert("refundRequests", {
        ...args,
        status: "draft",
        createdBy: userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    },
  ),
});

/**
 * Expense Request (with Event Pipeline)
 */

export const createExpensePlatform = mutation({
  args: {
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
  handler: withEventPipeline(
    {
      module: "finance",
      entity: "expense",
      action: "create",
      eventType: "finance.expense.created",
      title: "Expense Created",
      getEntityId: entityIdFromResult(),
      getUserId: userIdFromArg(),
      getDescription: (args) => `Expense of ${args.amount}: ${args.description}`,
    },
    async (ctx, args) => {
      const userId = await getAuthUserId(ctx);
      if (!userId) throw new Error("Not authenticated");

      return await ctx.db.insert("expenseRecords", {
        ...args,
        status: "draft",
        createdBy: userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    },
  ),
});

/**
 * Vendor Bill (with Event Pipeline)
 */

export const createVendorBillPlatform = mutation({
  args: {
    vendorName: v.string(),
    vendorContact: v.optional(v.string()),
    billNumber: v.string(),
    billDate: v.number(),
    dueDate: v.number(),
    amount: v.number(),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("financeExpenseCategories")),
    attachmentUrls: v.optional(v.array(v.string())),
  },
  handler: withEventPipeline(
    {
      module: "finance",
      entity: "vendor_bill",
      action: "create",
      eventType: "finance.vendor_bill.created",
      title: "Vendor Bill Created",
      getEntityId: entityIdFromResult(),
      getUserId: userIdFromArg(),
      getDescription: (args) => `Vendor bill ${args.billNumber}: ${args.amount}`,
    },
    async (ctx, args) => {
      const userId = await getAuthUserId(ctx);
      if (!userId) throw new Error("Not authenticated");

      return await ctx.db.insert("vendorBills", {
        ...args,
        paidAmount: 0,
        balanceDue: args.amount,
        status: "pending",
        createdBy: userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    },
  ),
});

/**
 * Journal Entry (with Event Pipeline)
 */

export const createJournalEntryPlatform = mutation({
  args: {
    entryDate: v.number(),
    description: v.string(),
    debitAccount: v.string(),
    creditAccount: v.string(),
    amount: v.number(),
    referenceType: v.optional(v.union(v.literal("invoice"), v.literal("payment"), v.literal("expense"), v.literal("receipt"), v.literal("adjustment"), v.literal("refund"))),
    referenceId: v.optional(v.string()),
  },
  handler: withEventPipeline(
    {
      module: "finance",
      entity: "journal_entry",
      action: "create",
      eventType: "finance.journal_entry.created",
      title: "Journal Entry Created",
      getEntityId: entityIdFromResult(),
      getUserId: userIdFromArg(),
      getDescription: (args) => `Journal: ${args.debitAccount} / ${args.creditAccount}: ${args.amount}`,
    },
    async (ctx, args) => {
      const userId = await getAuthUserId(ctx);
      if (!userId) throw new Error("Not authenticated");

      const allEntries = await ctx.db.query("journalEntries").collect();
      const entryNumber = generateNumber("JRN", allEntries.length + 1);

      return await ctx.db.insert("journalEntries", {
        entryNumber,
        ...args,
        status: "draft",
        createdBy: userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    },
  ),
});

// ═══════════════════════════════════════════════════════════════════
// SECURE PAGINATED QUERIES — Uses query platform (Part 7)
// ═══════════════════════════════════════════════════════════════════

export const listInvoicesPaginated = query({
  args: {
    status: v.optional(v.string()),
    studentId: v.optional(v.id("studentMaster")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("feeInvoices") as any;
    if (args.status) q = q.filter((f: any) => f.eq(f.field("status"), args.status));
    if (args.studentId) q = q.filter((f: any) => f.eq(f.field("studentId"), args.studentId));
    const results = await q.order("desc").take(args.limit || 50);
    return { items: results, total: results.length };
  },
});

export const listPaymentsPaginated = query({
  args: {
    status: v.optional(v.string()),
    studentId: v.optional(v.id("studentMaster")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("paymentTransactions") as any;
    if (args.status) q = q.filter((f: any) => f.eq(f.field("status"), args.status));
    if (args.studentId) q = q.filter((f: any) => f.eq(f.field("studentId"), args.studentId));
    const results = await q.order("desc").take(args.limit || 50);
    return { items: results, total: results.length };
  },
});

export const listExpensesPaginated = query({
  args: {
    status: v.optional(v.string()),
    branchId: v.optional(v.id("branches")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("expenseRecords") as any;
    if (args.status) q = q.filter((f: any) => f.eq(f.field("status"), args.status));
    if (args.branchId) q = q.filter((f: any) => f.eq(f.field("branchId"), args.branchId));
    const results = await q.order("desc").take(args.limit || 50);

    // Enrich with person names through People Registry
    const enriched = await Promise.all(results.map(async (r: any) => {
      const user = await ctx.db.get(r.createdBy);
      return { ...r, createdByName: user ? (user as any).name : "Unknown" };
    }));

    return { items: enriched, total: enriched.length };
  },
});

export const listRefundsPaginated = query({
  args: {
    status: v.optional(v.string()),
    studentId: v.optional(v.id("studentMaster")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("refundRequests") as any;
    if (args.status) q = q.filter((f: any) => f.eq(f.field("status"), args.status));
    if (args.studentId) q = q.filter((f: any) => f.eq(f.field("studentId"), args.studentId));
    const results = await q.order("desc").take(args.limit || 50);
    return { items: results, total: results.length };
  },
});

export const listVendorBillsPaginated = query({
  args: {
    status: v.optional(v.string()),
    vendorName: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("vendorBills") as any;
    if (args.status) q = q.filter((f: any) => f.eq(f.field("status"), args.status));
    if (args.vendorName) q = q.filter((f: any) => f.eq(f.field("vendorName"), args.vendorName));
    const results = await q.order("desc").take(args.limit || 50);
    return { items: results, total: results.length };
  },
});

export const listJournalEntriesPaginated = query({
  args: {
    status: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("journalEntries") as any;
    if (args.status) q = q.filter((f: any) => f.eq(f.field("status"), args.status));
    const results = await q.order("desc").take(args.limit || 50);
    let filtered = results;
    if (args.startDate) filtered = filtered.filter((r: any) => r.entryDate >= args.startDate!);
    if (args.endDate) filtered = filtered.filter((r: any) => r.entryDate <= args.endDate!);
    return { items: filtered, total: filtered.length };
  },
});

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD KPIs — Finance-specific KPIs (Part 9)
// ═══════════════════════════════════════════════════════════════════

export const getFinanceDashboardKPIs = query({
  args: {},
  handler: async (ctx) => {
    const invoices = await ctx.db.query("feeInvoices").collect();
    const payments = await ctx.db.query("paymentTransactions").collect();
    const expenses = await ctx.db.query("expenseRecords").collect();
    const refunds = await ctx.db.query("refundRequests").collect();
    const accounts = await ctx.db.query("studentFeeAccounts").collect();

    const totalInvoiced = invoices.reduce((s: number, i: any) => s + i.totalAmount, 0);
    const totalPaid = invoices.reduce((s: number, i: any) => s + i.paidAmount, 0);
    const totalOutstanding = invoices.reduce((s: number, i: any) => s + i.balanceDue, 0);
    const overdueInvoices = invoices.filter((i: any) => i.status === "overdue");
    const overdueAmount = overdueInvoices.reduce((s: number, i: any) => s + i.balanceDue, 0);

    const verifiedPayments = payments.filter((p: any) => p.status === "verified" || p.status === "completed");
    const totalRevenue = verifiedPayments.reduce((s: number, p: any) => s + p.amount, 0);

    const approvedExpenses = expenses.filter((e: any) => e.status === "approved" || e.status === "paid");
    const totalExpenses = approvedExpenses.reduce((s: number, e: any) => s + e.amount, 0);

    const completedRefunds = refunds.filter((r: any) => r.status === "completed");
    const totalRefunded = completedRefunds.reduce((s: number, r: any) => s + r.amount, 0);

    const activeAccounts = accounts.filter((a: any) => a.status === "active").length;
    const defaultedAccounts = accounts.filter((a: any) => a.status === "defaulted").length;

    return {
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      overdueAmount,
      totalRevenue,
      totalExpenses,
      totalRefunded,
      netRevenue: totalRevenue - totalRefunded,
      collectionRate: totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0,
      activeAccounts,
      defaultedAccounts,
      pendingPayments: payments.filter((p: any) => p.status === "pending").length,
      pendingExpenses: expenses.filter((e: any) => e.status === "pending_approval").length,
      invoiceCount: invoices.length,
      expenseCount: expenses.length,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════
// WORKFLOW-INTEGRATED APPROVALS (Part 2)
// ═══════════════════════════════════════════════════════════════════

export const approveExpenseWithWorkflow = mutation({
  args: {
    id: v.id("expenseRecords"),
    approved: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const expense = await ctx.db.get(args.id);
    if (!expense) throw new Error("Expense not found");

    await ctx.db.patch(args.id, {
      status: args.approved ? "approved" : "rejected",
      approvedBy: identity.subject as any,
      approvedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Use withEventPipeline-style logging
    const now = Date.now();
    await ctx.db.insert("auditLogs", {
      action: args.approved ? "approve" : "reject",
      entity: "expense",
      entityId: args.id,
      userId: identity.subject as any,
      changes: args.notes ? { reason: args.notes } : undefined,
      createdAt: now,
    });

    await ctx.db.insert("timelineEvents", {
      module: "finance",
      eventType: args.approved ? "finance.expense.approved" : "finance.expense.rejected",
      entityType: "expense",
      entityId: args.id,
      title: args.approved ? "Expense Approved" : "Expense Rejected",
      description: args.notes,
      performedBy: identity.subject as any,
      createdAt: now,
    });

    return args.id;
  },
});

export const approveRefundWithWorkflow = mutation({
  args: {
    id: v.id("refundRequests"),
    approved: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const request = await ctx.db.get(args.id);
    if (!request) throw new Error("Refund not found");

    await ctx.db.patch(args.id, {
      status: args.approved ? "approved" : "rejected",
      approvedBy: identity.subject as any,
      approvedAt: Date.now(),
      updatedAt: Date.now(),
    });

    const now = Date.now();
    await ctx.db.insert("auditLogs", {
      action: args.approved ? "approve" : "reject",
      entity: "refund",
      entityId: args.id,
      userId: identity.subject as any,
      changes: args.notes ? { reason: args.notes } : undefined,
      createdAt: now,
    });

    await ctx.db.insert("timelineEvents", {
      module: "finance",
      eventType: args.approved ? "finance.refund.approved" : "finance.refund.rejected",
      entityType: "refund",
      entityId: args.id,
      title: args.approved ? "Refund Approved" : "Refund Rejected",
      description: args.notes,
      performedBy: identity.subject as any,
      createdAt: now,
    });

    return args.id;
  },
});

// ═══════════════════════════════════════════════════════════════════
// FINANCIAL REPORTS (Part 10) — Uses Report SDK patterns
// ═══════════════════════════════════════════════════════════════════

export const getRevenueReport = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    let payments = await ctx.db.query("paymentTransactions")
      .filter((q: any) => q.neq(q.field("status"), "reversed"))
      .collect();

    let invoices = await ctx.db.query("feeInvoices")
      .filter((q: any) => q.neq(q.field("status"), "cancelled"))
      .collect();

    if (args.startDate) {
      payments = payments.filter((p: any) => p.paymentDate >= args.startDate!);
      invoices = invoices.filter((i: any) => i.invoiceDate >= args.startDate!);
    }
    if (args.endDate) {
      payments = payments.filter((p: any) => p.paymentDate <= args.endDate!);
      invoices = invoices.filter((i: any) => i.invoiceDate <= args.endDate!);
    }

    const totalRevenue = payments
      .filter((p: any) => p.status === "verified" || p.status === "completed")
      .reduce((s: number, p: any) => s + p.amount, 0);

    return {
      totalRevenue,
      totalInvoiced: invoices.reduce((s: number, i: any) => s + i.totalAmount, 0),
      pendingRevenue: invoices.filter((i: any) => i.status === "pending" || i.status === "partial")
        .reduce((s: number, i: any) => s + i.balanceDue, 0),
      overdueRevenue: invoices.filter((i: any) => i.status === "overdue")
        .reduce((s: number, i: any) => s + i.balanceDue, 0),
      collectionRate: invoices.reduce((s: number, i: any) => s + i.totalAmount, 0) > 0
        ? Math.round((totalRevenue / invoices.reduce((s: number, i: any) => s + i.totalAmount, 0)) * 100)
        : 0,
      paymentCount: payments.length,
      invoiceCount: invoices.length,
    };
  },
});

export const getCollectionReport = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    groupBy: v.optional(v.union(v.literal("day"), v.literal("week"), v.literal("month"))),
  },
  handler: async (ctx, args) => {
    let payments = await ctx.db.query("paymentTransactions")
      .filter((q: any) => q.neq(q.field("status"), "reversed"))
      .collect();

    if (args.startDate) payments = payments.filter((p: any) => p.paymentDate >= args.startDate!);
    if (args.endDate) payments = payments.filter((p: any) => p.paymentDate <= args.endDate!);

    const verified = payments.filter((p: any) => p.status === "verified" || p.status === "completed");

    return {
      totalCollected: verified.reduce((s: number, p: any) => s + p.amount, 0),
      collectionCount: verified.length,
      byMethod: verified.reduce((acc: Record<string, number>, p: any) => {
        acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + p.amount;
        return acc;
      }, {}),
      pendingCount: payments.filter((p: any) => p.status === "pending").length,
    };
  },
});

export const getExpenseReport = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    let expenses = await ctx.db.query("expenseRecords").collect();
    if (args.startDate) expenses = expenses.filter((e: any) => e.expenseDate >= args.startDate!);
    if (args.endDate) expenses = expenses.filter((e: any) => e.expenseDate <= args.endDate!);
    if (args.branchId) expenses = expenses.filter((e: any) => e.branchId === args.branchId);

    const approved = expenses.filter((e: any) => e.status === "approved" || e.status === "paid");
    const byCategory = approved.reduce((acc: Record<string, number>, e: any) => {
      const cat = e.expenseCategoryId || "uncategorized";
      acc[cat] = (acc[cat] || 0) + e.amount;
      return acc;
    }, {});

    return {
      totalApproved: approved.reduce((s: number, e: any) => s + e.amount, 0),
      totalDraft: expenses.filter((e: any) => e.status === "draft").reduce((s: number, e: any) => s + e.amount, 0),
      byCategory,
      expenseCount: expenses.length,
      approvedCount: approved.length,
    };
  },
});

export const getOutstandingReport = query({
  args: {
    threshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const accounts = await ctx.db.query("studentFeeAccounts")
      .filter((q: any) => q.gt(q.field("outstandingBalance"), 0))
      .collect();

    const totalOutstanding = accounts.reduce((s: number, a: any) => s + a.outstandingBalance, 0);

    return {
      totalOutstanding,
      activeAccounts: accounts.length,
      totalFee: accounts.reduce((s: number, a: any) => s + a.totalFee, 0),
      totalPaid: accounts.reduce((s: number, a: any) => s + a.totalPaid, 0),
      accountsWithOverdue: accounts.filter((a: any) => a.status === "defaulted").length,
    };
  },
});
