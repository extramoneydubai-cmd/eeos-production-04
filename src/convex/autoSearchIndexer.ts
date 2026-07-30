/**
 * Auto Search Indexer (Phase 3)
 *
 * Every mutation should call indexEntity() to automatically register
 * search metadata in the search engine.
 *
 * Usage:
 *   import { indexEntity } from "./autoSearchIndexer";
 *
 *   // After creating a student:
 *   await indexEntity(ctx, {
 *     entityType: "student",
 *     entityId: studentId,
 *     title: `${student.firstName} ${student.lastName}`,
 *     keywords: [student.studentCode, student.phone, student.email],
 *     companyId: student.companyId,
 *     branchId: student.branchId,
 *     module: "admission",
 *   });
 *
 * The searchEngineV2 will pick up these indexes automatically.
 */

import { mutation, MutationCtx, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ─── Index Entry ───────────────────────────────────────────

interface IndexEntry {
  entityType: string;
  entityId: string;
  title: string;
  subtitle?: string;
  keywords?: string[];
  identifiers?: Record<string, string>;  // e.g., { studentCode, admissionNumber, phone, email }
  module: string;
  companyId?: string;
  branchId?: string;
  departmentId?: string;
  tags?: string[];
  createdBy?: string;
  relatedEntities?: Array<{ type: string; id: string; label: string }>;
}

// ─── Index an Entity ───────────────────────────────────────

export async function indexEntity(
  ctx: MutationCtx,
  entry: IndexEntry,
): Promise<void> {
  try {
    const now = Date.now();

    // Insert into search index
    await ctx.db.insert("searchIndex", {
      entityType: entry.entityType,
      entityId: entry.entityId,
      title: entry.title,
      subtitle: entry.subtitle || "",
      keywords: (entry.keywords || []).join(","),
      identifiers: entry.identifiers ? JSON.stringify(entry.identifiers) : "",
      module: entry.module,
      companyId: entry.companyId,
      branchId: entry.branchId,
      departmentId: entry.departmentId,
      tags: (entry.tags || []).join(","),
      createdBy: entry.createdBy,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    // Index failure should never break the main operation
    console.error(`[AutoSearchIndexer] Failed to index ${entry.entityType} ${entry.entityId}:`, error);
  }
}

// ─── Convenience Indexers for Common Entity Types ──────────

export async function indexStudent(
  ctx: MutationCtx,
  studentId: string,
  student: { firstName: string; lastName: string; studentCode?: string; phone?: string; email?: string },
  scope: { companyId?: string; branchId?: string; departmentId?: string },
  createdBy?: string,
): Promise<void> {
  return indexEntity(ctx, {
    entityType: "student",
    entityId: studentId,
    title: `${student.firstName} ${student.lastName}`,
    subtitle: student.studentCode || "",
    keywords: [student.firstName, student.lastName, student.studentCode || "", student.phone || "", student.email || ""].filter(Boolean),
    identifiers: {
      studentCode: student.studentCode || "",
      phone: student.phone || "",
      email: student.email || "",
    },
    module: "admission",
    ...scope,
    tags: ["student", "active"],
    createdBy,
    relatedEntities: [],
  });
}

export async function indexEmployee(
  ctx: MutationCtx,
  employeeId: string,
  employee: { firstName: string; lastName: string; employeeCode?: string; mobile?: string; email?: string },
  scope: { companyId?: string; branchId?: string; departmentId?: string },
  createdBy?: string,
): Promise<void> {
  return indexEntity(ctx, {
    entityType: "employee",
    entityId: employeeId,
    title: `${employee.firstName} ${employee.lastName}`,
    subtitle: employee.employeeCode || "",
    keywords: [employee.firstName, employee.lastName, employee.employeeCode || "", employee.mobile || "", employee.email || ""].filter(Boolean),
    identifiers: {
      employeeCode: employee.employeeCode || "",
      mobile: employee.mobile || "",
      email: employee.email || "",
    },
    module: "hr",
    ...scope,
    tags: ["employee", "active"],
    createdBy,
  });
}

export async function indexReceipt(
  ctx: MutationCtx,
  receiptId: string,
  receipt: { receiptNumber: string; studentName?: string; amount?: number; paymentMode?: string },
  scope: { companyId?: string; branchId?: string },
  createdBy?: string,
): Promise<void> {
  return indexEntity(ctx, {
    entityType: "receipt",
    entityId: receiptId,
    title: `Receipt #${receipt.receiptNumber}`,
    subtitle: receipt.studentName || "",
    keywords: [receipt.receiptNumber, receipt.studentName || "", String(receipt.amount || ""), receipt.paymentMode || ""].filter(Boolean),
    identifiers: { receiptNumber: receipt.receiptNumber },
    module: "finance",
    ...scope,
    tags: ["receipt", "finance"],
    createdBy,
  });
}

export async function indexInvoice(
  ctx: MutationCtx,
  invoiceId: string,
  invoice: { invoiceNumber: string; studentName?: string; amount?: number },
  scope: { companyId?: string; branchId?: string },
  createdBy?: string,
): Promise<void> {
  return indexEntity(ctx, {
    entityType: "invoice",
    entityId: invoiceId,
    title: `Invoice #${invoice.invoiceNumber}`,
    subtitle: invoice.studentName || "",
    keywords: [invoice.invoiceNumber, invoice.studentName || "", String(invoice.amount || "")].filter(Boolean),
    identifiers: { invoiceNumber: invoice.invoiceNumber },
    module: "finance",
    ...scope,
    tags: ["invoice", "gst"],
    createdBy,
  });
}

export async function indexTicket(
  ctx: MutationCtx,
  ticketId: string,
  ticket: { ticketNumber: string; subject: string; category?: string },
  scope: { companyId?: string; branchId?: string },
  createdBy?: string,
): Promise<void> {
  return indexEntity(ctx, {
    entityType: "ticket",
    entityId: ticketId,
    title: `#${ticket.ticketNumber}: ${ticket.subject}`,
    subtitle: ticket.category || "",
    keywords: [ticket.ticketNumber, ticket.subject, ticket.category || ""].filter(Boolean),
    identifiers: { ticketNumber: ticket.ticketNumber },
    module: "support",
    ...scope,
    tags: ["ticket", "support"],
    createdBy,
  });
}

export async function indexCheque(
  ctx: MutationCtx,
  chequeId: string,
  cheque: { chequeNumber: string; bank: string; amount?: number },
  scope: { companyId?: string; branchId?: string },
  createdBy?: string,
): Promise<void> {
  return indexEntity(ctx, {
    entityType: "cheque",
    entityId: chequeId,
    title: `${cheque.bank} #${cheque.chequeNumber}`,
    subtitle: `${cheque.amount || 0}`,
    keywords: [cheque.chequeNumber, cheque.bank, String(cheque.amount || "")].filter(Boolean),
    identifiers: { chequeNumber: cheque.chequeNumber },
    module: "finance",
    ...scope,
    tags: ["cheque", "pdc"],
    createdBy,
  });
}
