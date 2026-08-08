import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents, type ScopeAndEventsConfig } from "./withScopeAndEvents";

// ─── Enterprise Handler Factory ───────────────────────────────────
// Wraps ctx-based auth extraction for withScopeAndEvents integration.
// When a session token is supplied the withScopeAndEvents wrapper resolves
// the REAL performer from the sessions table; getAuthUserId (Convex auth
// headers) only applies to legacy flows. Declared actor args remain the
// recorded actors, while authorization uses the verified performer.

function withPayment<P = any, R = any>(
  operation: ScopeAndEventsConfig<P, R>["operation"],
  entity: string,
  handler: (ctx: any, args: P) => Promise<R>,
) {
  return async (ctx: any, args: P) => {
    const raw = args as any;
    const hasToken = typeof raw?.token === "string" && raw.token.length > 0;
    let userId: Id<"users"> | undefined;
    if (!hasToken) {
      userId = (await getAuthUserId(ctx)) as Id<"users"> | undefined;
    }

    const wrappedHandler = withScopeAndEvents<P, R>(
      {
        operation,
        module: "finance",
        entity,
        getEntityCompanyId: () => undefined,
        getEntityBranchId: () => undefined,
        getEntityDepartmentId: () => undefined,
        getUserId: () => userId as Id<"users">,
        notifyViaMatrix: true,
        triggerWorkflow: true,
        triggerAutomation: true,
        registerSearch: true,
        signalDashboard: true,
      },
      (ctx2, args2) => handler(ctx2, args2),
    );
    return wrappedHandler(ctx, args);
  };
}

// ─── HELPERS ───────────────────────────────────────────────

async function createTimelineEvent(
  ctx: any,
  args: { studentId: string; eventType: string; title: string; description?: string; metadata?: string; performedBy?: string }
) {
  const performedBy = args.performedBy || (ctx as any).__performerUserId;
  await ctx.db.insert("studentEnrollmentHistory", {
    studentId: args.studentId,
    eventType: args.eventType,
    title: args.title,
    description: args.description,
    metadata: args.metadata,
    performedBy: performedBy,
    createdAt: Date.now(),
  });
}

function generateTransactionNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TXN-${ts}-${rand}`;
}

// ─── PAYMENT METHODS CRUD ──────────────────────────────────

export const createPaymentMethod = mutation({
  args: {
    token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    type: v.union(
      v.literal("cash"), v.literal("bank_transfer"), v.literal("credit_card"),
      v.literal("debit_card"), v.literal("upi"), v.literal("online_gateway"),
      v.literal("wallet"), v.literal("cheque"), v.literal("pdc"),
    ),
    requiresReference: v.boolean(),
    processingFee: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: withPayment("create", "payment_method", async (ctx, args) => {
    const userId = (ctx as any).__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    return ctx.db.insert("paymentMethods", {
      ...args,
      isActive: true,
    });
  }),
});

export const listPaymentMethods = query({
  args: { isActive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("paymentMethods");
    if (args.isActive !== undefined) {
      query = query.filter((q: any) => q.eq(q.field("isActive"), args.isActive));
    }
    return query.collect();
  },
});

// ─── TAX RULES CRUD ────────────────────────────────────────

export const createTaxRule = mutation({
  args: {
    token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    taxType: v.union(v.literal("gst"), v.literal("vat"), v.literal("service_tax"), v.literal("custom")),
    rate: v.number(),
    applicableToVerticals: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
  },
  handler: withPayment("create", "tax_rule", async (ctx, args) => {
    const userId = (ctx as any).__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    return ctx.db.insert("taxRules", {
      ...args,
      isActive: true,
    });
  }),
});

export const listTaxRules = query({
  args: { isActive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("taxRules");
    if (args.isActive !== undefined) {
      query = query.filter((q: any) => q.eq(q.field("isActive"), args.isActive));
    }
    return query.collect();
  },
});

// ─── PAYMENT TRANSACTIONS ──────────────────────────────────

export const receivePayment = mutation({
  args: {
    token: v.optional(v.string()),
    studentId: v.id("studentMaster"),
    feeAccountId: v.id("studentFeeAccounts"),
    invoiceId: v.optional(v.id("feeInvoices")),
    installmentId: v.optional(v.id("feeInstallments")),
    paymentMethod: v.string(),
    amount: v.number(),
    referenceNumber: v.optional(v.string()),
    gatewayTransactionId: v.optional(v.string()),
    bankName: v.optional(v.string()),
    chequeNumber: v.optional(v.string()),
    chequeDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: withPayment("create", "payment", async (ctx, args) => {
    const userId = (ctx as any).__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    const transactionNumber = generateTransactionNumber();

    const id = await ctx.db.insert("paymentTransactions", {
      transactionNumber,
      studentId: args.studentId,
      feeAccountId: args.feeAccountId,
      invoiceId: args.invoiceId,
      installmentId: args.installmentId,
      paymentMethod: args.paymentMethod,
      paymentDate: Date.now(),
      amount: args.amount,
      referenceNumber: args.referenceNumber,
      gatewayTransactionId: args.gatewayTransactionId,
      bankName: args.bankName,
      chequeNumber: args.chequeNumber,
      chequeDate: args.chequeDate,
      status: "pending",
      notes: args.notes,
      createdBy: userId,
    });

    await createTimelineEvent(ctx, {
      studentId: args.studentId,
      eventType: "PaymentReceived",
      title: "Payment Received",
      description: `${args.amount} via ${args.paymentMethod} (${transactionNumber})`,
      metadata: JSON.stringify({ transactionId: id, transactionNumber, amount: args.amount, method: args.paymentMethod }),
      performedBy: userId,
    });

    return { id, transactionNumber };
  }),
});

export const verifyPayment = mutation({
  args: {
    token: v.optional(v.string()),
    transactionId: v.id("paymentTransactions"),
  },
  handler: withPayment("update", "payment", async (ctx, args) => {
    const userId = (ctx as any).__performerUserId;
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
      const newTotalPaid = (account.totalPaid || 0) + transaction.amount;
      const newOutstanding = Math.max(0, account.outstandingBalance - transaction.amount);
      await ctx.db.patch(transaction.feeAccountId, {
        totalPaid: newTotalPaid,
        outstandingBalance: newOutstanding,
        lastPaymentDate: Date.now(),
      });
    }

    // Update invoice
    if (transaction.invoiceId) {
      const invoice = await ctx.db.get(transaction.invoiceId);
      if (invoice) {
        const newPaidAmount = (invoice.paidAmount || 0) + transaction.amount;
        const newBalance = invoice.totalAmount - newPaidAmount;
        const newStatus = newBalance <= 0 ? "paid" : "partial";
        await ctx.db.patch(transaction.invoiceId, {
          paidAmount: newPaidAmount,
          balanceDue: newBalance,
          status: newStatus,
        });
      }
    }

    // Update installment
    if (transaction.installmentId) {
      const installment = await ctx.db.get(transaction.installmentId);
      if (installment) {
        const newPaidAmount = (installment.paidAmount || 0) + transaction.amount;
        const newStatus = newPaidAmount >= installment.amount ? "paid" : "partial";
        await ctx.db.patch(transaction.installmentId, {
          paidAmount: newPaidAmount,
          paidDate: Date.now(),
          status: newStatus,
        });
      }
    }

    await createTimelineEvent(ctx, {
      studentId: transaction.studentId,
      eventType: "PaymentVerified",
      title: "Payment Verified",
      description: `Transaction ${transaction.transactionNumber} verified`,
      metadata: JSON.stringify({ transactionId: args.transactionId }),
      performedBy: userId,
    });

    return args.transactionId;
  }),
});

export const reversePayment = mutation({
  args: {
    token: v.optional(v.string()),
    transactionId: v.id("paymentTransactions"),
    reason: v.string(),
  },
  handler: withPayment("update", "payment", async (ctx, args) => {
    const userId = (ctx as any).__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) throw new Error("Transaction not found");
    if (transaction.status === "reversed" || transaction.status === "refunded") {
      throw new Error("Transaction already reversed or refunded");
    }

    await ctx.db.patch(args.transactionId, {
      status: "reversed",
      notes: `${transaction.notes || ""} Reversed: ${args.reason}`.trim(),
    });

    // Reverse fee account
    const account = await ctx.db.get(transaction.feeAccountId);
    if (account && transaction.status === "verified") {
      const newTotalPaid = Math.max(0, (account.totalPaid || 0) - transaction.amount);
      const newOutstanding = account.outstandingBalance + transaction.amount;
      await ctx.db.patch(transaction.feeAccountId, {
        totalPaid: newTotalPaid,
        outstandingBalance: newOutstanding,
      });
    }

    // Reverse invoice
    if (transaction.invoiceId && transaction.status === "verified") {
      const invoice = await ctx.db.get(transaction.invoiceId);
      if (invoice) {
        const newPaidAmount = Math.max(0, (invoice.paidAmount || 0) - transaction.amount);
        const newBalance = invoice.totalAmount - newPaidAmount;
        await ctx.db.patch(transaction.invoiceId, {
          paidAmount: newPaidAmount,
          balanceDue: newBalance,
          status: newBalance >= invoice.totalAmount ? "pending" : "partial",
        });
      }
    }

    await createTimelineEvent(ctx, {
      studentId: transaction.studentId,
      eventType: "PaymentReversed",
      title: "Payment Reversed",
      description: `Transaction ${transaction.transactionNumber} reversed: ${args.reason}`,
      performedBy: userId,
    });

    return args.transactionId;
  }),
});

export const refundPayment = mutation({
  args: {
    token: v.optional(v.string()),
    transactionId: v.id("paymentTransactions"),
    studentId: v.id("studentMaster"),
    feeAccountId: v.id("studentFeeAccounts"),
    refundAmount: v.optional(v.number()),
  },
  handler: withPayment("update", "payment", async (ctx, args) => {
    const userId = (ctx as any).__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) throw new Error("Transaction not found");

    const refundAmount = args.refundAmount || transaction.amount;

    await ctx.db.patch(args.transactionId, {
      status: "refunded",
      notes: `${transaction.notes || ""} Refunded: ${refundAmount}`.trim(),
    });

    // Create refund record via billingEngine's issueRefund logic
    await createTimelineEvent(ctx, {
      studentId: args.studentId,
      eventType: "PaymentRefunded",
      title: "Payment Refunded",
      description: `Transaction ${transaction.transactionNumber} refunded: ${refundAmount}`,
      metadata: JSON.stringify({ transactionId: args.transactionId, refundAmount }),
      performedBy: userId,
    });

    return args.transactionId;
  }),
});

export const reconcilePayments = mutation({
  args: {
    token: v.optional(v.string()),
    transactionIds: v.array(v.id("paymentTransactions")),
  },
  handler: withPayment("update", "payment", async (ctx, args) => {
    const userId = (ctx as any).__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    const results: any[] = [];
    for (const id of args.transactionIds) {
      const tx = await ctx.db.get(id);
      if (tx && tx.status === "verified") {
        await ctx.db.patch(id, { reconciledAt: Date.now() });
        results.push({ id, reconciled: true });
      } else {
        results.push({ id, reconciled: false, reason: tx ? `Status: ${tx.status}` : "Not found" });
      }
    }

    return results;
  }),
});

export const listPayments = query({
  args: {
    studentId: v.optional(v.id("studentMaster")),
    invoiceId: v.optional(v.id("feeInvoices")),
    status: v.optional(v.union(
      v.literal("pending"), v.literal("verified"), v.literal("completed"),
      v.literal("failed"), v.literal("reversed"), v.literal("refunded")
    )),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("paymentTransactions");
    if (args.studentId) {
      query = query.withIndex("studentId", (q: any) => q.eq("studentId", args.studentId));
    }
    if (args.invoiceId) {
      query = query.filter((q: any) => q.eq(q.field("invoiceId"), args.invoiceId));
    }
    if (args.status) {
      query = query.filter((q: any) => q.eq(q.field("status"), args.status));
    }
    return query.order("desc").collect();
  },
});

export const getPayment = query({
  args: { id: v.id("paymentTransactions") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

// ─── PAYMENT DASHBOARD ─────────────────────────────────────

export const getPaymentDashboard = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    const payments = await ctx.db.query("paymentTransactions")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .collect();

    const account = await ctx.db.query("studentFeeAccounts")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .first();

    const invoices = await ctx.db.query("feeInvoices")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .collect();

    const installments = await ctx.db.query("feeInstallments")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .collect();

    return {
      totalCollected: payments
        .filter((p: any) => p.status === "verified" || p.status === "completed")
        .reduce((s: number, p: any) => s + p.amount, 0),
      pendingCount: payments.filter((p: any) => p.status === "pending").length,
      verifiedCount: payments.filter((p: any) => p.status === "verified").length,
      failedCount: payments.filter((p: any) => p.status === "failed").length,
      reversedCount: payments.filter((p: any) => p.status === "reversed" || p.status === "refunded").length,
      account,
      invoiceSummary: {
        total: invoices.length,
        paid: invoices.filter((i: any) => i.status === "paid").length,
        pending: invoices.filter((i: any) => i.status === "pending").length,
        overdue: invoices.filter((i: any) => i.status === "overdue").length,
        totalDue: invoices.reduce((s: number, i: any) => s + i.balanceDue, 0),
      },
      installmentSummary: {
        total: installments.length,
        paid: installments.filter((i: any) => i.status === "paid").length,
        overdue: installments.filter((i: any) => i.status === "overdue").length,
        nextDue: installments.find((i: any) => i.status === "pending" || i.status === "partial"),
      },
    };
  },
});
