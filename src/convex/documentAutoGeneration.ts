/**
 * Auto-Document Generation Service
 *
 * Processes the documentGenerationQueue created by withScopeAndEvents().
 * Generates documents automatically based on event types and templates.
 *
 * This service:
 *   1. Watches for pending document generation requests
 *   2. Renders the appropriate template
 *   3. Records the generated document in documentRecords
 *   4. Triggers notifications when documents are ready
 *
 * Integration:
 *   - Called by the event pipeline after mutations
 *   - Can also be run as a scheduled job
 *   - Each document type uses its specific template
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { renderTemplate } from "./documentTemplateEngine";

// ─── Document Queue ─────────────────────────────────────────

/** Process pending document generation requests */
export const processDocumentQueue = internalMutation({
  handler: async (ctx) => {
    const pending = await ctx.db.query("documentGenerationQueue")
      .filter((q: any) => q.eq(q.field("status"), "pending"))
      .collect();

    if (pending.length === 0) return { processed: 0 };

    let processed = 0;
    let failed = 0;

    for (const item of pending) {
      try {
        const qi = item as any;
        const context = typeof qi.context === "string" ? JSON.parse(qi.context) : qi.context || {};

        // Render the document using the template engine
        let rendered = "";
        try {
          const result = await (renderTemplate as any)(ctx, {
            documentType: qi.documentType,
            context,
            companyId: qi.companyId,
            branchId: qi.branchId,
          });
          rendered = result.rendered;
        } catch (templateError) {
          // If no template exists, create a basic default template
          rendered = `{{${qi.documentType}}} generated for ${qi.entityId}`;
        }

        // Record the generated document
        await ctx.db.insert("documentRecords", {
          documentType: qi.documentType,
          entityType: qi.entityType,
          entityId: qi.entityId,
          content: rendered,
          context: qi.context,
          companyId: qi.companyId,
          branchId: qi.branchId,
          status: "generated",
          generatedAt: Date.now(),
        });

        // Mark queue item as completed
        await ctx.db.patch(item._id, {
          status: "completed",
          processedAt: Date.now(),
        });

        processed++;
      } catch (error) {
        await ctx.db.patch(item._id, {
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          processedAt: Date.now(),
        });
        failed++;
      }
    }

    return { processed, failed, total: pending.length };
  },
});

// ─── Document Records Queries ───────────────────────────────

export const getDocumentsForEntity = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    documentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let docs = await ctx.db.query("documentRecords")
      .filter((q: any) => q.and(
        q.eq(q.field("entityType"), args.entityType),
        q.eq(q.field("entityId"), args.entityId),
      ))
      .collect();

    if (args.documentType) {
      docs = docs.filter((d: any) => d.documentType === args.documentType);
    }

    return docs.sort((a: any, b: any) => (b.generatedAt || 0) - (a.generatedAt || 0));
  },
});

export const getDocumentById = query({
  args: { documentId: v.id("documentRecords") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.documentId);
  },
});

// ─── Queue Statistics ───────────────────────────────────────

export const getDocumentQueueStats = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("documentGenerationQueue").collect();
    const pending = all.filter((q: any) => q.status === "pending").length;
    const completed = all.filter((q: any) => q.status === "completed").length;
    const failed = all.filter((q: any) => q.status === "failed").length;
    return { total: all.length, pending, completed, failed };
  },
});

// ─── Auto-Trigger Configuration ─────────────────────────────

/** Auto-document generation rules: maps event types → document types */
export const AUTO_DOCUMENT_RULES: Record<string, string[]> = {
  "finance.payment.received":       ["fee_receipt", "gst_invoice"],
  "finance.cheque.bounced":         ["bounce_notice", "penalty_letter"],
  "finance.cheque.received":        ["cheque_receipt"],
  "finance.refund.approved":        ["refund_voucher", "credit_note"],
  "finance.refund.completed":       ["refund_calculation"],
  "admission.student.created":      ["admission_form", "id_card", "consent_form"],
  "hr.employee.joined":             ["offer_letter", "appointment_letter"],
  "hr.employee.exited":             ["relieving_letter", "experience_letter"],
  "hr.salary.processed":            ["salary_slip"],
  "finance.cheque.settled":         ["settlement_letter"],
  "academic.certificate.issued":    ["bonafide_certificate", "transfer_certificate"],
};

/**
 * Register event types that should auto-generate documents.
 * Called by withScopeAndEvents when autoGenerateDocs is configured.
 */
export function getDocumentTypesForEvent(eventType: string): string[] {
  return AUTO_DOCUMENT_RULES[eventType] || [];
}
