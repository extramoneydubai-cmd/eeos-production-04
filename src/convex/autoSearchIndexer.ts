/**
 * Auto Search Indexer (Phase 7 — Complete)
 *
 * Every mutation should call indexEntity() to automatically register
 * search metadata. The withScopeAndEvents v2 pipeline calls this
 * automatically for every wrapped mutation when registerSearch is enabled.
 *
 * Supports ALL 22 entity types:
 *   Students, Parents, Employees, Faculty, Companies, Branches,
 *   Departments, Courses, Batches, Leads, Tickets, Receipts,
 *   Invoices, Refunds, PDCs, GST, Assets, Inventory, Purchase Orders,
 *   Campaigns, Knowledge Articles, Certificates
 */

import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ─── Index Entry ───────────────────────────────────────────

export interface IndexEntry {
  entityType: string;
  entityId: string;
  title: string;
  subtitle?: string;
  keywords?: string[];
  identifiers?: Record<string, string>;
  module: string;
  companyId?: string;
  branchId?: string;
  departmentId?: string;
  tags?: string[];
  createdBy?: string;
}

// ─── Core Indexer ──────────────────────────────────────────

export async function indexEntity(
  ctx: MutationCtx,
  entry: IndexEntry,
): Promise<void> {
  try {
    const now = Date.now();
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
    console.error(`[SearchIndexer] Failed to index ${entry.entityType} ${entry.entityId}:`, error);
  }
}

// ─── 22 Entity Type Convenience Indexers ───────────────────

type Scope = { companyId?: string; branchId?: string; departmentId?: string };

/** 1. Student */
export async function indexStudent(ctx: MutationCtx, id: string, data: { firstName: string; lastName: string; studentCode?: string; phone?: string; email?: string }, scope: Scope, createdBy?: string) {
  return indexEntity(ctx, { entityType: "student", entityId: id, title: `${data.firstName} ${data.lastName}`, subtitle: data.studentCode || "", keywords: [data.firstName, data.lastName, data.studentCode || "", data.phone || "", data.email || ""].filter(Boolean), identifiers: { studentCode: data.studentCode || "", phone: data.phone || "", email: data.email || "" }, module: "admission", ...scope, tags: ["student"], createdBy });
}

/** 2. Parent */
export async function indexParent(ctx: MutationCtx, id: string, data: { name: string; phone?: string; email?: string }, scope: Scope, createdBy?: string) {
  return indexEntity(ctx, { entityType: "parent", entityId: id, title: data.name, keywords: [data.name, data.phone || "", data.email || ""].filter(Boolean), identifiers: { phone: data.phone || "", email: data.email || "" }, module: "student", ...scope, tags: ["parent"], createdBy });
}

/** 3. Employee */
export async function indexEmployee(ctx: MutationCtx, id: string, data: { firstName: string; lastName: string; employeeCode?: string; mobile?: string; email?: string }, scope: Scope, createdBy?: string) {
  return indexEntity(ctx, { entityType: "employee", entityId: id, title: `${data.firstName} ${data.lastName}`, subtitle: data.employeeCode || "", keywords: [data.firstName, data.lastName, data.employeeCode || "", data.mobile || "", data.email || ""].filter(Boolean), identifiers: { employeeCode: data.employeeCode || "", mobile: data.mobile || "", email: data.email || "" }, module: "hr", ...scope, tags: ["employee"], createdBy });
}

/** 4. Faculty */
export async function indexFaculty(ctx: MutationCtx, id: string, data: { name: string; facultyCode?: string; department?: string }, scope: Scope, createdBy?: string) {
  return indexEntity(ctx, { entityType: "faculty", entityId: id, title: data.name, subtitle: data.facultyCode || "", keywords: [data.name, data.facultyCode || "", data.department || ""].filter(Boolean), identifiers: { facultyCode: data.facultyCode || "" }, module: "academic", ...scope, tags: ["faculty"], createdBy });
}

/** 5. Company */
export async function indexCompany(ctx: MutationCtx, id: string, data: { name: string; code?: string }, createdBy?: string) {
  return indexEntity(ctx, { entityType: "company", entityId: id, title: data.name, subtitle: data.code || "", keywords: [data.name, data.code || ""].filter(Boolean), identifiers: { code: data.code || "" }, module: "organization", tags: ["company"], createdBy });
}

/** 6. Branch */
export async function indexBranch(ctx: MutationCtx, id: string, data: { name: string; code?: string; companyName?: string }, scope: Scope, createdBy?: string) {
  return indexEntity(ctx, { entityType: "branch", entityId: id, title: data.name, subtitle: data.companyName || "", keywords: [data.name, data.code || "", data.companyName || ""].filter(Boolean), identifiers: { code: data.code || "" }, module: "organization", ...scope, tags: ["branch"], createdBy });
}

/** 7. Department */
export async function indexDepartment(ctx: MutationCtx, id: string, data: { name: string; code?: string }, scope: Scope, createdBy?: string) {
  return indexEntity(ctx, { entityType: "department", entityId: id, title: data.name, subtitle: data.code || "", keywords: [data.name, data.code || ""].filter(Boolean), module: "organization", ...scope, tags: ["department"], createdBy });
}

/** 8. Course */
export async function indexCourse(ctx: MutationCtx, id: string, data: { name: string; code?: string; duration?: string }, scope: Scope, createdBy?: string) {
  return indexEntity(ctx, { entityType: "course", entityId: id, title: data.name, subtitle: data.code || "", keywords: [data.name, data.code || "", data.duration || ""].filter(Boolean), module: "academic", ...scope, tags: ["course"], createdBy });
}

/** 9. Batch */
export async function indexBatch(ctx: MutationCtx, id: string, data: { name: string; courseName?: string; year?: string }, scope: Scope, createdBy?: string) {
  return indexEntity(ctx, { entityType: "batch", entityId: id, title: data.name, subtitle: data.courseName || "", keywords: [data.name, data.courseName || "", data.year || ""].filter(Boolean), module: "academic", ...scope, tags: ["batch"], createdBy });
}

/** 10. Lead */
export async function indexLead(ctx: MutationCtx, id: string, data: { firstName: string; lastName: string; phone?: string; email?: string; source?: string }, scope: Scope, createdBy?: string) {
  return indexEntity(ctx, { entityType: "lead", entityId: id, title: `${data.firstName} ${data.lastName}`, keywords: [data.firstName, data.lastName, data.phone || "", data.email || "", data.source || ""].filter(Boolean), identifiers: { phone: data.phone || "", email: data.email || "" }, module: "crm", ...scope, tags: ["lead"], createdBy });
}

/** 11. Ticket */
export async function indexTicket(ctx: MutationCtx, id: string, data: { ticketNumber: string; subject: string; category?: string }, scope: Scope, createdBy?: string) {
  return indexEntity(ctx, { entityType: "ticket", entityId: id, title: `#${data.ticketNumber}: ${data.subject}`, subtitle: data.category || "", keywords: [data.ticketNumber, data.subject, data.category || ""].filter(Boolean), identifiers: { ticketNumber: data.ticketNumber }, module: "support", ...scope, tags: ["ticket"], createdBy });
}

/** 12. Receipt */
export async function indexReceipt(ctx: MutationCtx, id: string, data: { receiptNumber: string; studentName?: string; amount?: number; paymentMode?: string }, scope: Scope, createdBy?: string) {
  return indexEntity(ctx, { entityType: "receipt", entityId: id, title: `Receipt #${data.receiptNumber}`, subtitle: data.studentName || "", keywords: [data.receiptNumber, data.studentName || "", String(data.amount || ""), data.paymentMode || ""].filter(Boolean), identifiers: { receiptNumber: data.receiptNumber }, module: "finance", ...scope, tags: ["receipt", "finance"], createdBy });
}

/** 13. Invoice */
export async function indexInvoice(ctx: MutationCtx, id: string, data: { invoiceNumber: string; studentName?: string; amount?: number }, scope: Scope, createdBy?: string) {
  return indexEntity(ctx, { entityType: "invoice", entityId: id, title: `Invoice #${data.invoiceNumber}`, subtitle: data.studentName || "", keywords: [data.invoiceNumber, data.studentName || "", String(data.amount || "")].filter(Boolean), identifiers: { invoiceNumber: data.invoiceNumber }, module: "finance", ...scope, tags: ["invoice", "gst"], createdBy });
}

/** 14. Refund */
export async function indexRefund(ctx: MutationCtx, id: string, data: { refundNumber: string; studentName?: string; amount?: number; status?: string }, scope: Scope, createdBy?: string) {
  return indexEntity(ctx, { entityType: "refund", entityId: id, title: `Refund #${data.refundNumber}`, subtitle: data.studentName || "", keywords: [data.refundNumber, data.studentName || "", String(data.amount || ""), data.status || ""].filter(Boolean), identifiers: { refundNumber: data.refundNumber }, module: "finance", ...scope, tags: ["refund", "finance"], createdBy });
}

/** 15. PDC/Cheque */
export async function indexCheque(ctx: MutationCtx, id: string, data: { chequeNumber: string; bank: string; amount?: number }, scope: Scope, createdBy?: string) {
  return indexEntity(ctx, { entityType: "cheque", entityId: id, title: `${data.bank} #${data.chequeNumber}`, subtitle: `${data.amount || 0}`, keywords: [data.chequeNumber, data.bank, String(data.amount || "")].filter(Boolean), identifiers: { chequeNumber: data.chequeNumber }, module: "finance", ...scope, tags: ["cheque", "pdc"], createdBy });
}

/** 16. GST Record */
export async function indexGST(ctx: MutationCtx, id: string, data: { gstNumber?: string; companyName?: string; amount?: number; period?: string }, scope: Scope, createdBy?: string) {
  return indexEntity(ctx, { entityType: "gst", entityId: id, title: `GST ${data.gstNumber || ""}`, subtitle: data.period || "", keywords: [data.gstNumber || "", data.companyName || "", String(data.amount || ""), data.period || ""].filter(Boolean), identifiers: { gstNumber: data.gstNumber || "" }, module: "finance", ...scope, tags: ["gst", "compliance"], createdBy });
}

/** 17. Asset */
export async function indexAsset(ctx: MutationCtx, id: string, data: { name: string; assetCode?: string; category?: string; assignedTo?: string }, scope: Scope, createdBy?: string) {
  return indexEntity(ctx, { entityType: "asset", entityId: id, title: data.name, subtitle: data.assetCode || "", keywords: [data.name, data.assetCode || "", data.category || "", data.assignedTo || ""].filter(Boolean), identifiers: { assetCode: data.assetCode || "" }, module: "inventory", ...scope, tags: ["asset"], createdBy });
}

/** 18. Inventory */
export async function indexInventory(ctx: MutationCtx, id: string, data: { name: string; sku?: string; category?: string; quantity?: number }, scope: Scope, createdBy?: string) {
  return indexEntity(ctx, { entityType: "inventory", entityId: id, title: data.name, subtitle: data.sku || "", keywords: [data.name, data.sku || "", data.category || ""].filter(Boolean), identifiers: { sku: data.sku || "" }, module: "inventory", ...scope, tags: ["inventory", "stock"], createdBy });
}

/** 19. Purchase Order */
export async function indexPurchaseOrder(ctx: MutationCtx, id: string, data: { poNumber: string; vendorName?: string; amount?: number; status?: string }, scope: Scope, createdBy?: string) {
  return indexEntity(ctx, { entityType: "purchase_order", entityId: id, title: `PO #${data.poNumber}`, subtitle: data.vendorName || "", keywords: [data.poNumber, data.vendorName || "", String(data.amount || ""), data.status || ""].filter(Boolean), identifiers: { poNumber: data.poNumber }, module: "procurement", ...scope, tags: ["procurement", "purchase"], createdBy });
}

/** 20. Campaign */
export async function indexCampaign(ctx: MutationCtx, id: string, data: { name: string; channel?: string; status?: string }, scope: Scope, createdBy?: string) {
  return indexEntity(ctx, { entityType: "campaign", entityId: id, title: data.name, keywords: [data.name, data.channel || "", data.status || ""].filter(Boolean), module: "marketing", ...scope, tags: ["marketing", "campaign"], createdBy });
}

/** 21. Knowledge Article */
export async function indexKnowledgeArticle(ctx: MutationCtx, id: string, data: { title: string; category?: string; tags?: string[] }, scope: Scope, createdBy?: string) {
  return indexEntity(ctx, { entityType: "knowledge", entityId: id, title: data.title, subtitle: data.category || "", keywords: [data.title, data.category || "", ...(data.tags || [])], module: "support", ...scope, tags: ["knowledge", "article"], createdBy });
}

/** 22. Certificate */
export async function indexCertificate(ctx: MutationCtx, id: string, data: { certificateNumber: string; studentName?: string; type?: string }, scope: Scope, createdBy?: string) {
  return indexEntity(ctx, { entityType: "certificate", entityId: id, title: `Certificate #${data.certificateNumber}`, subtitle: data.studentName || "", keywords: [data.certificateNumber, data.studentName || "", data.type || ""].filter(Boolean), identifiers: { certificateNumber: data.certificateNumber }, module: "academic", ...scope, tags: ["certificate", "academic"], createdBy });
}
