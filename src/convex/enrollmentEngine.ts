import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { logActivity, createNotification } from "./crmHelpers";

/* ────────────
   HELPERS
   ──────────── */

let admissionCounter = 0;

function generateAdmissionNumber(prefix = "ADM"): string {
  admissionCounter++;
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  const seq = String(admissionCounter % 10000).padStart(4, "0");
  return `${prefix}-${ts}-${seq}`;
}

function generateRollNumber(batchCode: string, sequence: number): string {
  return `${batchCode}-${String(sequence).padStart(4, "0")}`;
}

async function createEnrollmentHistory(
  ctx: any,
  studentId: Id<"studentMaster">,
  eventType: string,
  title: string,
  description?: string,
  metadata?: string,
  performedBy?: Id<"users">,
) {
  await ctx.db.insert("studentEnrollmentHistory", {
    studentId,
    eventType,
    title,
    description,
    metadata,
    performedBy: performedBy || "",
    createdAt: Date.now(),
  });
}

/* ────────────
   STEP 1 — CREATE STUDENT FROM LEAD
   One-click conversion with full data migration
   ──────────── */

export const createStudentFromLead = mutation({
  args: {
    leadId: v.id("leadMaster"),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");
    if (lead.status !== "active") throw new Error("Lead is not in active status. Must be converted first.");

    const now = Date.now();
    const admissionNumber = generateAdmissionNumber();

    // Create student record from lead data
    const studentId = await ctx.db.insert("studentMaster", {
      studentCode: `STU-${admissionNumber}`,
      personId: ((lead as any).personId || ("" as any)) as any,
      firstName: lead.firstName,
      lastName: lead.lastName,
      phone: lead.phone,
      leadId: args.leadId,
      admissionNumber,
      verticalId: lead.verticalId,
      branchId: lead.branchInterestId,
      status: "admitted",
      currentStatus: "admitted",
      enrollmentDate: now,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    // Create admission record
    const admId = await ctx.db.insert("studentAdmissions", {
      studentId,
      leadId: args.leadId,
      admissionNumber,
      admissionDate: now,
      admissionType: "fresh",
      courseId: "" as any, // Will be updated when allocateCourse is called
      totalFee: lead.standardAmount || 0,
      discountAmount: (lead.discountAmount || 0) + (lead.waiverAmount || 0),
      finalFee: lead.finalPayable || lead.standardAmount || 0,
      installmentCount: 1,
      status: "pending",
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    // Mark lead as converted
    await ctx.db.patch(args.leadId, {
      status: "converted",
      stage: "converted",
      updatedAt: now,
    });

    await ctx.db.insert("leadStageHistory", {
      leadId: args.leadId,
      fromStage: lead.stage,
      toStage: "converted",
      changedBy: args.createdBy,
      note: "Converted to student via Enrollment Engine",
      createdAt: now,
    });

    // Timeline events
    await createEnrollmentHistory(ctx, studentId, "student_created", "Student record created", `From lead ${lead.firstName} ${lead.lastName}`, JSON.stringify({ leadId: args.leadId }), args.createdBy);
    await createEnrollmentHistory(ctx, studentId, "admission_created", "Admission record created", `Admission #${admissionNumber}`, undefined, args.createdBy);

    await logActivity(ctx, args.leadId, "converted", `converted to student (${admissionNumber})`, args.createdBy);

    // Notifications
    await createNotification(ctx, args.createdBy, "lead", "Student Created", `${lead.firstName} ${lead.lastName} enrolled as ${admissionNumber}`, studentId, "student");

    return {
      studentId,
      admissionId: admId,
      admissionNumber,
    };
  },
});

/* ────────────
   STEP 2 — ALLOCATE COURSE
   ──────────── */

export const allocateCourse = mutation({
  args: {
    studentId: v.id("studentMaster"),
    courseId: v.id("courses"),
    verticalId: v.optional(v.id("verticals")),
    subVerticalId: v.optional(v.id("subVerticals")),
    boardId: v.optional(v.id("boards")),
    batchId: v.optional(v.id("academicBatches")),
    academicYearId: v.optional(v.id("academicSessions")),
    allocatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");

    const now = Date.now();

    // Update student master
    await ctx.db.patch(args.studentId, {
      courseId: args.courseId,
      verticalId: args.verticalId || student.verticalId,
      batchId: args.batchId,
      academicYearId: args.academicYearId,
      updatedAt: now,
    });

    // Create academic allocation record
    await ctx.db.insert("studentAcademicAllocation", {
      studentId: args.studentId,
      academicYearId: args.academicYearId,
      verticalId: args.verticalId,
      subVerticalId: args.subVerticalId,
      boardId: args.boardId,
      courseId: args.courseId,
      batchId: args.batchId,
      isCurrent: true,
      allocatedAt: now,
      allocatedBy: args.allocatedBy,
      createdAt: now,
    });

    await createEnrollmentHistory(ctx, args.studentId, "course_allocated", "Course allocated", `Course ID: ${args.courseId}`, JSON.stringify({ courseId: args.courseId }), args.allocatedBy);

    return { allocated: true };
  },
});

/* ────────────
   STEP 3 — ASSIGN BATCH & ROLL NUMBER
   ──────────── */

let rollCounter = 0;

export const assignBatch = mutation({
  args: {
    studentId: v.id("studentMaster"),
    batchId: v.id("academicBatches"),
    academicYearId: v.optional(v.id("academicSessions")),
    assignedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const batch = await ctx.db.get(args.batchId);
    if (!batch) throw new Error("Batch not found");

    const now = Date.now();
    rollCounter++;

    // Get batch code for roll number generation
    const batchCode = (batch as any).code || batch._id.slice(-4);
    const rollNumber = generateRollNumber(batchCode, rollCounter);

    // Update student
    await ctx.db.patch(args.studentId, {
      batchId: args.batchId,
      academicYearId: args.academicYearId,
      rollNumber,
      updatedAt: now,
    });

    await createEnrollmentHistory(ctx, args.studentId, "batch_assigned", `Batch assigned: ${batchCode}`, `Roll #${rollNumber}`, JSON.stringify({ batchId: args.batchId, rollNumber }), args.assignedBy);

    return { batchId: args.batchId, rollNumber };
  },
});

export const assignRollNumber = mutation({
  args: {
    studentId: v.id("studentMaster"),
    rollNumber: v.string(),
    assignedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check uniqueness
    const existing = await ctx.db.query("studentMaster").withIndex("rollNumber", (q) => q.eq("rollNumber", args.rollNumber)).first();
    if (existing && existing._id !== args.studentId) {
      throw new Error(`Roll number ${args.rollNumber} is already assigned`);
    }

    await ctx.db.patch(args.studentId, { rollNumber: args.rollNumber, updatedAt: Date.now() });
    await createEnrollmentHistory(ctx, args.studentId, "roll_number_assigned", `Roll number assigned: ${args.rollNumber}`, undefined, undefined, args.assignedBy);

    return { rollNumber: args.rollNumber };
  },
});

/* ────────────
   STEP 4 — DOCUMENT COLLECTION
   ──────────── */

export const collectDocument = mutation({
  args: {
    studentId: v.id("studentMaster"),
    documentType: v.union(
      v.literal("aadhaar"), v.literal("passport"),
      v.literal("photo"), v.literal("transfer_certificate"),
      v.literal("marksheet"), v.literal("parent_id"),
      v.literal("birth_certificate"), v.literal("address_proof"),
      v.literal("other"),
    ),
    fileName: v.string(),
    fileUrl: v.string(),
    fileSize: v.optional(v.number()),
    uploadedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const docId = await ctx.db.insert("studentDocuments", {
      studentId: args.studentId,
      documentType: args.documentType,
      fileName: args.fileName,
      fileUrl: args.fileUrl,
      fileSize: args.fileSize,
      isVerified: false,
      uploadedBy: args.uploadedBy,
      createdAt: Date.now(),
    });

    await createEnrollmentHistory(ctx, args.studentId, "document_uploaded", `Document uploaded: ${args.documentType}`, args.fileName, undefined, args.uploadedBy);

    return docId;
  },
});

export const verifyDocument = mutation({
  args: {
    docId: v.id("studentDocuments"),
    verifiedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc) throw new Error("Document not found");

    await ctx.db.patch(args.docId, {
      isVerified: true,
      verifiedBy: args.verifiedBy,
      verifiedAt: Date.now(),
    });

    return { verified: true };
  },
});

/* ────────────
   STEP 5 — COMPLETE ADMISSION
   ──────────── */

export const completeAdmission = mutation({
  args: {
    studentId: v.id("studentMaster"),
    approvedBy: v.id("users"),
    remarks: v.optional(v.string()),
    totalFee: v.optional(v.number()),
    discountAmount: v.optional(v.number()),
    installmentCount: v.optional(v.number()),
    paymentPlan: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");

    const now = Date.now();

    // Update student status
    await ctx.db.patch(args.studentId, {
      status: "active",
      updatedAt: now,
    });

    // Get or create admission record
    const admissions = await ctx.db.query("studentAdmissions").withIndex("studentId", (q) => q.eq("studentId", args.studentId)).collect();
    const admission = admissions[0];
    if (admission) {
      await ctx.db.patch(admission._id, {
        status: "approved",
        totalFee: args.totalFee || admission.totalFee,
        discountAmount: args.discountAmount || admission.discountAmount,
        finalFee: (args.totalFee || admission.totalFee) - (args.discountAmount || admission.discountAmount),
        installmentCount: args.installmentCount || admission.installmentCount,
        paymentPlan: args.paymentPlan || admission.paymentPlan,
        approvedBy: args.approvedBy,
        approvedAt: now,
        remarks: args.remarks,
        updatedAt: now,
      });
    }

    await createEnrollmentHistory(ctx, args.studentId, "admission_completed", "Admission completed", `Student ${student.firstName} ${student.lastName} is now active`, JSON.stringify({ approvedBy: args.approvedBy }), args.approvedBy);

    // Notify relevant parties
    await createNotification(ctx, args.approvedBy, "conversion", "Admission Completed", `Student ${student.firstName} ${student.lastName} admitted successfully`, args.studentId, "student");

    return { completed: true, status: "active" };
  },
});

/* ────────────
   STEP 6 — CANCEL ADMISSION
   ──────────── */

export const cancelAdmission = mutation({
  args: {
    studentId: v.id("studentMaster"),
    cancelledBy: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");

    const now = Date.now();

    await ctx.db.patch(args.studentId, {
      status: "cancelled",
      updatedAt: now,
    });

    // Update admission record
    const admissions = await ctx.db.query("studentAdmissions").withIndex("studentId", (q) => q.eq("studentId", args.studentId)).collect();
    for (const adm of admissions) {
      await ctx.db.patch(adm._id, { status: "cancelled", remarks: args.reason, updatedAt: now });
    }

    await createEnrollmentHistory(ctx, args.studentId, "admission_cancelled", "Admission cancelled", args.reason, undefined, args.cancelledBy);

    return { cancelled: true };
  },
});

/* ────────────
   QUERIES
   ──────────── */

export const getStudent = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => ctx.db.get(args.studentId),
});

export const listStudents = query({
  args: {
    status: v.optional(v.string()),
    batchId: v.optional(v.id("academicBatches")),
    courseId: v.optional(v.id("courses")),
    branchId: v.optional(v.id("branches")),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db.query("studentMaster").order("desc").take(args.limit || 50);

    if (args.status) results = results.filter((s) => s.status === args.status);
    if (args.batchId) results = results.filter((s) => s.batchId === args.batchId);
    if (args.courseId) results = results.filter((s) => s.courseId === args.courseId);
    if (args.branchId) results = results.filter((s) => s.branchId === args.branchId);
    if (args.search) {
      const q = args.search.toLowerCase();
      results = results.filter((s) =>
        (s.firstName || "").toLowerCase().includes(q) ||
        (s.lastName || "").toLowerCase().includes(q) ||
        (s.phone || "").includes(q) ||
        s.admissionNumber.toLowerCase().includes(q) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q)),
      );
    }

    return results;
  },
});

export const getStudentDocuments = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    return ctx.db.query("studentDocuments").withIndex("studentId", (q) => q.eq("studentId", args.studentId)).collect();
  },
});

export const getGuardians = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    return ctx.db.query("guardianDetails").withIndex("studentId", (q) => q.eq("studentId", args.studentId)).collect();
  },
});

export const getEnrollmentHistory = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    return ctx.db.query("studentEnrollmentHistory").withIndex("studentId_createdAt", (q) => q.eq("studentId", args.studentId)).order("desc").take(50);
  },
});
