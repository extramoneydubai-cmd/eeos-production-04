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

// ─── GST Compliance SDK — wires gstComplianceEngine ─────────────────────

/**
 * Create a GST debit note.
 */
export const createDebitNote = mutation({
  args: {
    invoiceId: v.optional(v.id("feeInvoices")),
    studentId: v.id("studentMaster"),
    amount: v.number(),
    gstRate: v.optional(v.number()),
    reason: v.string(),
    reasonCategory: v.union(v.literal("rate_difference"), v.literal("omission"), v.literal("correction"), v.literal("other")),
    originalInvoiceNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { createDebitNote } = await import("../../convex/gstComplianceEngine");
    return createDebitNote.handler(ctx, args);
  },
});

/**
 * Issue a draft debit note.
 */
export const issueDebitNote = mutation({
  args: { id: v.id("debitNotes") },
  handler: async (ctx, args) => {
    const { issueDebitNote } = await import("../../convex/gstComplianceEngine");
    return issueDebitNote.handler(ctx, args);
  },
});

/**
 * List GST debit notes.
 */
export const listDebitNotes = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("issued"), v.literal("applied"), v.literal("cancelled"))),
    studentId: v.optional(v.id("studentMaster")),
  },
  handler: async (ctx, args) => {
    const { listDebitNotes } = await import("../../convex/gstComplianceEngine");
    return listDebitNotes.handler(ctx, args);
  },
});

/**
 * List GST credit note register (enriched with student names).
 */
export const listCreditNoteRegister = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("issued"), v.literal("applied"), v.literal("cancelled"))),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { listCreditNoteRegister } = await import("../../convex/gstComplianceEngine");
    return listCreditNoteRegister.handler(ctx, args);
  },
});

/**
 * Export GSTR-1 return data.
 */
export const exportGSTR1 = query({
  args: { startDate: v.number(), endDate: v.number() },
  handler: async (ctx, args) => {
    const { exportGSTR1 } = await import("../../convex/gstComplianceEngine");
    return exportGSTR1.handler(ctx, args);
  },
});

/**
 * Export GSTR-3B return data.
 */
export const exportGSTR3B = query({
  args: { startDate: v.number(), endDate: v.number() },
  handler: async (ctx, args) => {
    const { exportGSTR3B } = await import("../../convex/gstComplianceEngine");
    return exportGSTR3B.handler(ctx, args);
  },
});

/**
 * Get GST compliance dashboard.
 */
export const getComplianceDashboard = query({
  handler: async (ctx) => {
    const { getComplianceDashboard } = await import("../../convex/gstComplianceEngine");
    return getComplianceDashboard.handler(ctx, {});
  },
});

// ─── Bank Reconciliation SDK — wires bankReconciliationEngine ────────────

/**
 * Import a bank statement with entries.
 */
export const importBankStatement = mutation({
  args: {
    bankName: v.string(),
    accountNumber: v.string(),
    statementPeriod: v.string(),
    entries: v.array(v.object({
      transactionDate: v.number(),
      description: v.string(),
      debit: v.optional(v.number()),
      credit: v.optional(v.number()),
      reference: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const { importBankStatement } = await import("../../convex/bankReconciliationEngine");
    return importBankStatement.handler(ctx, args);
  },
});

/**
 * Match a bank statement entry to an internal transaction.
 */
export const matchBankEntry = mutation({
  args: {
    bankEntryId: v.id("bankStatementEntries"),
    transactionId: v.id("paymentTransactions"),
  },
  handler: async (ctx, args) => {
    const { matchBankEntry } = await import("../../convex/bankReconciliationEngine");
    return matchBankEntry.handler(ctx, args);
  },
});

/**
 * Reconcile a bank statement.
 */
export const reconcileStatement = mutation({
  args: { statementId: v.id("bankStatements") },
  handler: async (ctx, args) => {
    const { reconcileStatement } = await import("../../convex/bankReconciliationEngine");
    return reconcileStatement.handler(ctx, args);
  },
});

/**
 * List bank statements.
 */
export const listBankStatements = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { listBankStatements } = await import("../../convex/bankReconciliationEngine");
    return listBankStatements.handler(ctx, args);
  },
});

/**
 * Get a bank statement with its entries.
 */
export const getBankStatement = query({
  args: { id: v.id("bankStatements") },
  handler: async (ctx, args) => {
    const { getBankStatement } = await import("../../convex/bankReconciliationEngine");
    return getBankStatement.handler(ctx, args);
  },
});

/**
 * Get bank reconciliation summary.
 */
export const getReconciliationSummary = query({
  handler: async (ctx) => {
    const { getReconciliationSummary } = await import("../../convex/bankReconciliationEngine");
    return getReconciliationSummary.handler(ctx, {});
  },
});

// ─── PDC Legal SDK — wires pdcLegalEngine ────────────────────────────────

/**
 * Update the legal status of a cheque (notice, follow-up, settlement, closed).
 */
export const updatePDCLegalStatus = mutation({
  args: {
    chequeId: v.id("chequeEntries"),
    legalStatus: v.union(v.literal("none"), v.literal("notice_sent"), v.literal("follow_up"), v.literal("legal_notice"), v.literal("settlement"), v.literal("closed")),
    legalNotes: v.optional(v.string()),
    settlementAmount: v.optional(v.number()),
    settlementDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { updatePDCLegalStatus } = await import("../../convex/pdcLegalEngine");
    return updatePDCLegalStatus.handler(ctx, args);
  },
});

/**
 * Restrict/allow future cheques for a student after bounce.
 */
export const restrictFutureCheques = mutation({
  args: {
    studentId: v.id("studentMaster"),
    restricted: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { restrictFutureCheques } = await import("../../convex/pdcLegalEngine");
    return restrictFutureCheques.handler(ctx, args);
  },
});

/**
 * Get bounce notice data for a cheque (student + address + phone).
 */
export const getBounceNoticeData = query({
  args: { chequeId: v.id("chequeEntries") },
  handler: async (ctx, args) => {
    const { getBounceNoticeData } = await import("../../convex/pdcLegalEngine");
    return getBounceNoticeData.handler(ctx, args);
  },
});

/**
 * Get PDC legal dashboard (cases by stage).
 */
export const getLegalDashboard = query({
  handler: async (ctx) => {
    const { getLegalDashboard } = await import("../../convex/pdcLegalEngine");
    return getLegalDashboard.handler(ctx, {});
  },
});

// ─── Enterprise PDC Lifecycle SDK (PATCH-ENTERPRISE-020) ────────────────

/**
 * Register a NACH mandate for a cheque (auto-debit recovery).
 */
export const registerNACH = mutation({
  args: {
    chequeId: v.id("chequeEntries"),
    mandateRef: v.string(),
  },
  handler: async (ctx, args) => {
    const { registerNACH } = await import("../../convex/pdcLegalEngine");
    return registerNACH.handler(ctx, args);
  },
});

/**
 * Assign a lawyer to a bounced-cheque legal case.
 */
export const assignLawyer = mutation({
  args: {
    chequeId: v.id("chequeEntries"),
    lawyerId: v.id("users"),
    lawyerName: v.optional(v.string()),
    caseNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { assignLawyer } = await import("../../convex/pdcLegalEngine");
    return assignLawyer.handler(ctx, args);
  },
});

/**
 * Update court status for a legal case (filed/hearing/judgment/decree/execution).
 */
export const updateCourtStatus = mutation({
  args: {
    chequeId: v.id("chequeEntries"),
    courtStatus: v.union(v.literal("none"), v.literal("filed"), v.literal("hearing"), v.literal("judgment"), v.literal("decree"), v.literal("execution")),
    caseNumber: v.optional(v.string()),
    courtNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { updateCourtStatus } = await import("../../convex/pdcLegalEngine");
    return updateCourtStatus.handler(ctx, args);
  },
});

/**
 * Compute and persist a risk score for a cheque (low/medium/high/critical).
 */
export const computeRiskScore = mutation({
  args: { chequeId: v.id("chequeEntries") },
  handler: async (ctx, args) => {
    const { computeRiskScore } = await import("../../convex/pdcLegalEngine");
    return computeRiskScore.handler(ctx, args);
  },
});

/**
 * Blacklist a student from future cheques after repeated bounces.
 */
export const blacklistStudentCheques = mutation({
  args: {
    studentId: v.id("studentMaster"),
    reason: v.string(),
    maxBounceCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { blacklistStudentCheques } = await import("../../convex/pdcLegalEngine");
    return blacklistStudentCheques.handler(ctx, args);
  },
});

/**
 * Record a settlement for a bounced cheque.
 */
export const recordSettlement = mutation({
  args: {
    chequeId: v.id("chequeEntries"),
    settlementAmount: v.number(),
    settlementDate: v.number(),
    recoveryStatus: v.optional(v.union(v.literal("none"), v.literal("demand_letter"), v.literal("negotiation"), v.literal("legal_action"), v.literal("recovered"), v.literal("write_off"))),
  },
  handler: async (ctx, args) => {
    const { recordSettlement } = await import("../../convex/pdcLegalEngine");
    return recordSettlement.handler(ctx, args);
  },
});

/**
 * Write off an unrecoverable bounced cheque.
 */
export const writeOffCheque = mutation({
  args: {
    chequeId: v.id("chequeEntries"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { writeOffCheque } = await import("../../convex/pdcLegalEngine");
    return writeOffCheque.handler(ctx, args);
  },
});

/**
 * Get the PDC recovery dashboard (bounced, negotiation, legal, recovered, write-off, risk).
 */
export const getRecoveryDashboard = query({
  handler: async (ctx) => {
    const { getRecoveryDashboard } = await import("../../convex/pdcLegalEngine");
    return getRecoveryDashboard.handler(ctx, {});
  },
});

// ─── Finance Report SDK — wires financePlatform + financeReports ─────────

/**
 * Get revenue report (total revenue, collection rate, overdue).
 */
export const getRevenueReport = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const { getRevenueReport } = await import("../../convex/financePlatform");
    return getRevenueReport.handler(ctx, args);
  },
});

/**
 * Get collection report (by payment method, totals, pending).
 */
export const getCollectionReport = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    groupBy: v.optional(v.union(v.literal("day"), v.literal("week"), v.literal("month"))),
  },
  handler: async (ctx, args) => {
    const { getCollectionReport } = await import("../../convex/financePlatform");
    return getCollectionReport.handler(ctx, args);
  },
});

/**
 * Get expense report (by category, approved totals).
 */
export const getExpenseReport = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const { getExpenseReport } = await import("../../convex/financePlatform");
    return getExpenseReport.handler(ctx, args);
  },
});

/**
 * Get outstanding report (total outstanding, active accounts, overdue).
 */
export const getOutstandingReport = query({
  args: { asOfDate: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { getOutstandingReport } = await import("../../convex/financeReports");
    return getOutstandingReport.handler(ctx, args);
  },
});

/**
 * Get finance dashboard KPIs (revenue, profit, cash in/out).
 */
export const getFinanceDashboard = query({
  handler: async (ctx) => {
    const { getFinanceDashboard } = await import("../../convex/financeReports");
    return getFinanceDashboard.handler(ctx, {});
  },
});

/**
 * Get finance dashboard KPIs from financePlatform (lightweight aggregate).
 */
export const getFinanceDashboardKPIs = query({
  handler: async (ctx) => {
    const { getFinanceDashboardKPIs } = await import("../../convex/financePlatform");
    return getFinanceDashboardKPIs.handler(ctx, {});
  },
});

/**
 * Get daily collection report.
 */
export const getDailyCollectionReport = query({
  args: { date: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { getDailyCollectionReport } = await import("../../convex/financeReports");
    return getDailyCollectionReport.handler(ctx, args);
  },
});

/**
 * Get profit summary.
 */
export const getProfitSummary = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { getProfitSummary } = await import("../../convex/financeReports");
    return getProfitSummary.handler(ctx, args);
  },
});

/**
 * Get student fee ledger.
 */
export const getStudentLedger = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    const { getStudentLedger } = await import("../../convex/financeReports");
    return getStudentLedger.handler(ctx, args);
  },
});

/**
 * Get branch collection report.
 */
export const getBranchCollectionReport = query({
  args: {
    branchId: v.id("branches"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { getBranchCollectionReport } = await import("../../convex/financeReports");
    return getBranchCollectionReport.handler(ctx, args);
  },
});
