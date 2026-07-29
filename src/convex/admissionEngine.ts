/**
 * Admission Engine — Lead-to-Student Admission Pipeline
 *
 * Manages the complete admission workflow from lead conversion
 * through enrolment, document collection, and student creation.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

function generateAdmissionNumber(serial: number): string {
  return `ADM-${new Date().getFullYear()}-${String(serial).padStart(4, "0")}`;
}

// ─── Create Admission Record ─────────────────────────────────

export const createAdmission = mutation({
  args: {
    leadId: v.optional(v.id("leadMaster")),
    studentId: v.id("studentMaster"),
    academicSessionId: v.id("academicSessions"),
    programId: v.id("academicPrograms"),
    batchId: v.id("academicBatches"),
    sectionId: v.optional(v.id("academicSections")),
    admissionDate: v.number(),
    admissionType: v.union(v.literal("fresh"), v.literal("transfer"), v.literal("re_admission")),
    feePlanId: v.optional(v.id("feePlans")),
    documents: v.optional(v.array(v.object({
      documentType: v.string(),
      documentUrl: v.string(),
      verified: v.optional(v.boolean()),
    }))),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const allAdmissions = await ctx.db.query("admissions").collect();
    const admissionNumber = generateAdmissionNumber(allAdmissions.length + 1);

    const admissionId = await ctx.db.insert("admissions", {
      admissionNumber,
      leadId: args.leadId,
      studentId: args.studentId,
      academicSessionId: args.academicSessionId,
      programId: args.programId,
      batchId: args.batchId,
      sectionId: args.sectionId,
      admissionDate: args.admissionDate,
      admissionType: args.admissionType,
      feePlanId: args.feePlanId,
      status: "enrolled",
      documents: args.documents,
      notes: args.notes,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update student with batch and admission info
    await ctx.db.patch(args.studentId, {
      batchId: args.batchId,
      programId: args.programId,
      sectionId: args.sectionId,
      admissionNumber,
      status: "active",
      updatedAt: Date.now(),
    });

    // If lead ID exists, mark lead as admitted
    if (args.leadId) {
      await ctx.db.patch(args.leadId, { status: "admitted", updatedAt: Date.now() });
    }

    return { id: admissionId, admissionNumber };
  },
});

// ─── List Admissions ─────────────────────────────────────────

export const listAdmissions = query({
  args: {
    status: v.optional(v.union(v.literal("enrolled"), v.literal("withdrawn"), v.literal("completed"), v.literal("cancelled"))),
    academicSessionId: v.optional(v.id("academicSessions")),
    programId: v.optional(v.id("academicPrograms")),
    batchId: v.optional(v.id("academicBatches")),
  },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("admissions");
    if (args.status) q = q.filter((q2: any) => q2.eq(q2.field("status"), args.status));
    if (args.academicSessionId) q = q.filter((q2: any) => q2.eq(q2.field("academicSessionId"), args.academicSessionId));
    if (args.programId) q = q.filter((q2: any) => q2.eq(q2.field("programId"), args.programId));
    if (args.batchId) q = q.filter((q2: any) => q2.eq(q2.field("batchId"), args.batchId));
    return q.order("desc").collect();
  },
});

export const getAdmission = query({
  args: { id: v.id("admissions") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

// ─── Update Admission Status ─────────────────────────────────

export const updateAdmissionStatus = mutation({
  args: {
    id: v.id("admissions"),
    status: v.union(v.literal("enrolled"), v.literal("withdrawn"), v.literal("completed"), v.literal("cancelled")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status, notes: args.reason, updatedAt: Date.now() });
    return args.id;
  },
});

// ─── Admission Dashboard Stats ───────────────────────────────

export const getAdmissionDashboard = query({
  args: { academicSessionId: v.optional(v.id("academicSessions")) },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("admissions");
    if (args.academicSessionId) q = q.filter((q2: any) => q2.eq(q2.field("academicSessionId"), args.academicSessionId));
    const admissions = await q.collect();

    return {
      total: admissions.length,
      enrolled: admissions.filter((a: any) => a.status === "enrolled").length,
      withdrawn: admissions.filter((a: any) => a.status === "withdrawn").length,
      completed: admissions.filter((a: any) => a.status === "completed").length,
      cancelled: admissions.filter((a: any) => a.status === "cancelled").length,
    };
  },
});
