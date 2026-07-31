/**
 * Finance SDK — Enterprise Finance & Collections Data Layer
 *
 * Every business module MUST use this SDK to access finance data.
 * No module may directly query feeAccounts, invoices, etc.
 *
 * Usage:
 *   import { financeSdk } from "@/platform/sdk/financeSdk";
 *   const account = await financeSdk.getStudentFeeAccount(ctx, { studentId });
 */

import { v } from "convex/values";
import { mutation, query } from "../../convex/_generated/server";
import { Id } from "../../convex/_generated/dataModel";

// ─── SDK Queries — Fee Engine ────────────────────────────────────────────

/**
 * Get student fee account with all installments.
 */
export const getStudentFeeAccount = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    const { getStudentFeeAccount } = await import("../../convex/feeEngine");
    return getStudentFeeAccount.handler(ctx, args);
  },
});

/**
 * List fee structures.
 */
export const listFeeStructures = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    courseId: v.optional(v.id("courses")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { listFeeStructures } = await import("../../convex/feeEngine");
    return listFeeStructures.handler(ctx, args);
  },
});

/**
 * Get a single fee structure.
 */
export const getFeeStructure = query({
  args: { feeStructureId: v.id("feeStructures") },
  handler: async (ctx, args) => {
    const { getFeeStructure } = await import("../../convex/feeEngine");
    return getFeeStructure.handler(ctx, args);
  },
});

/**
 * Calculate outstanding for a student.
 */
export const calculateOutstanding = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    const { calculateOutstanding } = await import("../../convex/feeEngine");
    return calculateOutstanding.handler(ctx, args);
  },
});

/**
 * List installments for a student.
 */
export const listInstallments = query({
  args: {
    studentId: v.id("studentMaster"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { listInstallments } = await import("../../convex/feeEngine");
    return listInstallments.handler(ctx, args);
  },
});

/**
 * List discounts.
 */
export const listDiscounts = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { listDiscounts } = await import("../../convex/feeEngine");
    return listDiscounts.handler(ctx, args);
  },
});

// ─── SDK Queries — Invoice Engine ────────────────────────────────────────

/**
 * List invoices with filters.
 */
export const listInvoices = query({
  args: {
    studentId: v.optional(v.id("studentMaster")),
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    status: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { listInvoices } = await import("../../convex/invoiceEngine");
    return listInvoices.handler(ctx, args);
  },
});

/**
 * Get invoice by ID.
 */
export const getInvoice = query({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    const { getInvoice } = await import("../../convex/invoiceEngine");
    return getInvoice.handler(ctx, args);
  },
});

// ─── SDK Queries — Payment Engine ────────────────────────────────────────

/**
 * List payments/receipts.
 */
export const listPayments = query({
  args: {
    studentId: v.optional(v.id("studentMaster")),
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    mode: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { listPayments } = await import("../../convex/paymentEngine");
    return listPayments.handler(ctx, args);
  },
});

// ─── SDK Queries — Collection Engine ─────────────────────────────────────

/**
 * List collections / overdue tracking.
 */
export const listCollections = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    status: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { listCollections } = await import("../../convex/collectionEngine");
    return listCollections.handler(ctx, args);
  },
});

/**
 * Get collection dashboard stats.
 */
export const getCollectionStats = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const { getCollectionStats } = await import("../../convex/collectionEngine");
    return getCollectionStats.handler(ctx, args);
  },
});

// ─── SDK Queries — Finance Engine (Journal, Cash Book, Vendors) ──────────

/**
 * List journal entries.
 */
export const listJournalEntries = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { listJournalEntries } = await import("../../convex/financeEngine");
    return listJournalEntries.handler(ctx, args);
  },
});

/**
 * Get journal entry by ID.
 */
export const getJournalEntry = query({
  args: { journalEntryId: v.id("journalEntries") },
  handler: async (ctx, args) => {
    const { getJournalEntry } = await import("../../convex/financeEngine");
    return getJournalEntry.handler(ctx, args);
  },
});

/**
 * List cash book entries.
 */
export const listCashBookEntries = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { listCashBookEntries } = await import("../../convex/financeEngine");
    return listCashBookEntries.handler(ctx, args);
  },
});

/**
 * Get cash book balance.
 */
export const getCashBookBalance = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const { getCashBookBalance } = await import("../../convex/financeEngine");
    return getCashBookBalance.handler(ctx, args);
  },
});

/**
 * List vendor bills.
 */
export const listVendorBills = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { listVendorBills } = await import("../../convex/financeEngine");
    return listVendorBills.handler(ctx, args);
  },
});

/**
 * List credit notes.
 */
export const listCreditNotes = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { listCreditNotes } = await import("../../convex/financeEngine");
    return listCreditNotes.handler(ctx, args);
  },
});

/**
 * List expenses.
 */
export const listExpenses = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    category: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { listExpenses } = await import("../../convex/expenseEngine");
    return listExpenses.handler(ctx, args);
  },
});

/**
 * List budgets.
 */
export const listBudgets = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    fiscalYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { listBudgets } = await import("../../convex/budgetEngine");
    return listBudgets.handler(ctx, args);
  },
});

// ─── SDK Mutations ───────────────────────────────────────────────────────

/**
 * Create fee structure.
 */
export const createFeeStructure = mutation({
  args: {
    name: v.string(),
    courseId: v.id("courses"),
    totalFee: v.number(),
    installmentCount: v.number(),
    downPayment: v.optional(v.number()),
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    isActive: v.optional(v.boolean()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { createFeeStructure } = await import("../../convex/feeEngine");
    return createFeeStructure.handler(ctx, args as any);
  },
});

/**
 * Generate installments for a student fee account.
 */
export const generateInstallments = mutation({
  args: {
    studentId: v.id("studentMaster"),
    feeStructureId: v.id("feeStructures"),
    performedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { generateInstallments } = await import("../../convex/feeEngine");
    return generateInstallments.handler(ctx, args);
  },
});

/**
 * Create a journal entry.
 */
export const createJournalEntry = mutation({
  args: {
    entryDate: v.number(),
    description: v.string(),
    debitAccount: v.string(),
    creditAccount: v.string(),
    amount: v.number(),
    referenceType: v.optional(v.string()),
    referenceId: v.optional(v.string()),
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { createJournalEntry } = await import("../../convex/financeEngine");
    return createJournalEntry.handler(ctx, args as any);
  },
});

/**
 * Create a vendor bill.
 */
export const createVendorBill = mutation({
  args: {
    vendorId: v.id("vendors"),
    billDate: v.number(),
    dueDate: v.number(),
    amount: v.number(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { createVendorBill } = await import("../../convex/financeEngine");
    return createVendorBill.handler(ctx, args as any);
  },
});

/**
 * Pay a vendor bill.
 */
export const payVendorBill = mutation({
  args: {
    billId: v.id("vendorBills"),
    paymentDate: v.number(),
    amount: v.number(),
    paymentMode: v.string(),
    reference: v.optional(v.string()),
    paidBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { payVendorBill } = await import("../../convex/financeEngine");
    return payVendorBill.handler(ctx, args as any);
  },
});

// ─── SDK Queries — Refund Engine ─────────────────────────────────────────

/**
 * List refund requests with optional status / student filters.
 */
export const listRefunds = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("processing"), v.literal("completed"))),
    studentId: v.optional(v.id("studentMaster")),
  },
  handler: async (ctx, args) => {
    const { listRefundRequests } = await import("../../convex/refundEngine");
    return listRefundRequests.handler(ctx, args);
  },
});

/**
 * Get a single refund request.
 */
export const getRefund = query({
  args: { id: v.id("refundRequests") },
  handler: async (ctx, args) => {
    const { getRefundRequest } = await import("../../convex/refundEngine");
    return getRefundRequest.handler(ctx, args);
  },
});

/**
 * Refund summary KPIs (counts per status).
 */
export const getRefundSummary = query({
  handler: async (ctx) => {
    const { getRefundSummary } = await import("../../convex/refundEngine");
    return getRefundSummary.handler(ctx, {});
  },
});

// ─── SDK Mutations — Refund Engine ───────────────────────────────────────

/**
 * Create a refund request.
 */
export const createRefundRequest = mutation({
  args: {
    studentId: v.optional(v.id("studentMaster")),
    transactionId: v.optional(v.id("paymentTransactions")),
    invoiceId: v.optional(v.id("feeInvoices")),
    amount: v.number(),
    reason: v.string(),
    reasonCategory: v.union(v.literal("academic"), v.literal("administrative"), v.literal("financial"), v.literal("withdrawal"), v.literal("other")),
    notes: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const { createRefundRequest } = await import("../../convex/refundEngine");
    return createRefundRequest.handler(ctx, args as any);
  },
});

/**
 * Submit a draft refund for approval.
 */
export const submitRefundForApproval = mutation({
  args: {
    id: v.id("refundRequests"),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const { submitRefundForApproval } = await import("../../convex/refundEngine");
    return submitRefundForApproval.handler(ctx, args);
  },
});

/**
 * Approve or reject a refund.
 */
export const approveRefund = mutation({
  args: {
    id: v.id("refundRequests"),
    approve: v.boolean(),
    notes: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const { approveRefund } = await import("../../convex/refundEngine");
    return approveRefund.handler(ctx, args as any);
  },
});

/**
 * Process an approved refund (initiate payment).
 */
export const processRefund = mutation({
  args: {
    id: v.id("refundRequests"),
    refundMethod: v.string(),
    refundReference: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const { processRefund } = await import("../../convex/refundEngine");
    return processRefund.handler(ctx, args);
  },
});

/**
 * Mark a refund as completed.
 */
export const completeRefund = mutation({
  args: {
    id: v.id("refundRequests"),
    notes: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const { completeRefund } = await import("../../convex/refundEngine");
    return completeRefund.handler(ctx, args);
  },
});

// ─── SDK Queries — Cheque / PDC Engine ───────────────────────────────────

/**
 * List cheques with status / student / bank filters.
 */
export const listCheques = query({
  args: {
    status: v.optional(v.union(v.literal("received"), v.literal("deposited"), v.literal("cleared"), v.literal("bounced"))),
    studentId: v.optional(v.id("studentMaster")),
    bankName: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { listCheques } = await import("../../convex/chequeEngine");
    return listCheques.handler(ctx, args);
  },
});

/**
 * Get a single cheque entry.
 */
export const getCheque = query({
  args: { id: v.id("chequeEntries") },
  handler: async (ctx, args) => {
    const { getCheque } = await import("../../convex/chequeEngine");
    return getCheque.handler(ctx, args);
  },
});

/**
 * Cheque dashboard stats (counts + values per status).
 */
export const getChequeDashboard = query({
  handler: async (ctx) => {
    const { getChequeDashboard } = await import("../../convex/chequeEngine");
    return getChequeDashboard.handler(ctx, {});
  },
});

/**
 * List penalty entries.
 */
export const listPenalties = query({
  args: {
    studentId: v.optional(v.id("studentMaster")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { listPenalties } = await import("../../convex/chequeEngine");
    return listPenalties.handler(ctx, args);
  },
});

// ─── SDK Mutations — Cheque / PDC Engine ─────────────────────────────────

/**
 * Create a new cheque entry (received).
 */
export const createChequeEntry = mutation({
  args: {
    studentId: v.optional(v.id("studentMaster")),
    invoiceId: v.optional(v.id("feeInvoices")),
    chequeNumber: v.string(),
    bankName: v.string(),
    bankBranch: v.optional(v.string()),
    chequeDate: v.number(),
    amount: v.number(),
    depositDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { createChequeEntry } = await import("../../convex/chequeEngine");
    return createChequeEntry.handler(ctx, args as any);
  },
});

/**
 * Deposit a cheque.
 */
export const depositCheque = mutation({
  args: { id: v.id("chequeEntries"), depositDate: v.number() },
  handler: async (ctx, args) => {
    const { depositCheque } = await import("../../convex/chequeEngine");
    return depositCheque.handler(ctx, args);
  },
});

/**
 * Mark a cheque as cleared.
 */
export const clearCheque = mutation({
  args: { id: v.id("chequeEntries"), clearanceDate: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { clearCheque } = await import("../../convex/chequeEngine");
    return clearCheque.handler(ctx, args);
  },
});

/**
 * Record a cheque bounce with optional penalty.
 */
export const bounceCheque = mutation({
  args: {
    id: v.id("chequeEntries"),
    bounceReason: v.string(),
    bounceDate: v.optional(v.number()),
    penaltyAmount: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { bounceCheque } = await import("../../convex/chequeEngine");
    return bounceCheque.handler(ctx, args as any);
  },
});

/**
 * Re-present a bounced cheque.
 */
export const rePresentCheque = mutation({
  args: { id: v.id("chequeEntries"), newDepositDate: v.number() },
  handler: async (ctx, args) => {
    const { rePresentCheque } = await import("../../convex/chequeEngine");
    return rePresentCheque.handler(ctx, args);
  },
});

/**
 * Waive a penalty.
 */
export const waivePenalty = mutation({
  args: { id: v.id("penaltyEntries"), notes: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { waivePenalty } = await import("../../convex/chequeEngine");
    return waivePenalty.handler(ctx, args);
  },
});

/**
 * Collect a penalty.
 */
export const collectPenalty = mutation({
  args: { id: v.id("penaltyEntries") },
  handler: async (ctx, args) => {
    const { collectPenalty } = await import("../../convex/chequeEngine");
    return collectPenalty.handler(ctx, args);
  },
});
