import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { logActivity, createNotification } from "./crmHelpers";

/* ────────────
   CONSTANTS
   ──────────── */

const STUDENT_STATUS_TRANSITIONS: Record<string, string[]> = {
  enquiry: ["lead", "cancelled"],
  lead: ["qualified", "cancelled"],
  qualified: ["trial", "cancelled"],
  trial: ["admitted", "cancelled"],
  admitted: ["active", "cancelled"],
  active: ["completed", "cancelled", "alumni"],
  completed: ["alumni"],
  alumni: [],
  cancelled: ["enquiry", "lead"],
};

/* ────────────
   UPDATE STUDENT STATUS
   Validates lifecycle transitions with timeline events
   ──────────── */

export const updateStudentStatus = mutation({
  args: {
    studentId: v.id("studentMaster"),
    newStatus: v.union(
      v.literal("enquiry"), v.literal("lead"),
      v.literal("qualified"), v.literal("trial"),
      v.literal("admitted"), v.literal("active"),
      v.literal("completed"), v.literal("alumni"),
      v.literal("cancelled"),
    ),
    changedBy: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");

    if (student.status === args.newStatus) {
      return { status: student.status, changed: false };
    }

    // Validate transition
    const allowedNext = STUDENT_STATUS_TRANSITIONS[student.status];
    if (!allowedNext || !allowedNext.includes(args.newStatus)) {
      throw new Error(`Cannot transition from '${student.status}' to '${args.newStatus}'`);
    }

    const now = Date.now();
    await ctx.db.patch(args.studentId, { status: args.newStatus, updatedAt: now });

    // Enrollment history
    await ctx.db.insert("studentEnrollmentHistory", {
      studentId: args.studentId,
      eventType: "status_changed",
      title: `Status changed: ${student.status} → ${args.newStatus}`,
      description: args.reason,
      performedBy: args.changedBy,
      createdAt: now,
    });

    // Lead link — sync with CRM if linked
    if (student.leadId) {
      const lead = await ctx.db.get(student.leadId);
      if (lead) {
        await logActivity(ctx, student.leadId, "student_status_changed", `Student status: ${args.newStatus}${args.reason ? ` — ${args.reason}` : ""}`, args.changedBy);
      }
    }

    return { status: args.newStatus, changed: true };
  },
});

/* ────────────
   ADD GUARDIAN
   ──────────── */

export const addGuardian = mutation({
  args: {
    studentId: v.id("studentMaster"),
    relationship: v.union(
      v.literal("father"), v.literal("mother"),
      v.literal("guardian"), v.literal("sibling"),
      v.literal("spouse"), v.literal("other"),
    ),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    occupation: v.optional(v.string()),
    income: v.optional(v.number()),
    address: v.optional(v.string()),
    isPrimary: v.boolean(),
    addedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const guardianId = await ctx.db.insert("guardianDetails", {
      studentId: args.studentId,
      relationship: args.relationship,
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      email: args.email,
      occupation: args.occupation,
      income: args.income,
      address: args.address,
      isPrimary: args.isPrimary,
      createdAt: Date.now(),
    });

    await ctx.db.insert("studentEnrollmentHistory", {
      studentId: args.studentId,
      eventType: "guardian_added",
      title: `${args.relationship} added: ${args.firstName} ${args.lastName}`,
      performedBy: args.addedBy,
      createdAt: Date.now(),
    });

    return guardianId;
  },
});

/* ────────────
   ACADEMIC YEAR PROGRESSION
   ──────────── */

export const progressAcademicYear = mutation({
  args: {
    studentId: v.id("studentMaster"),
    newAcademicYearId: v.id("academicSessions"),
    newBatchId: v.optional(v.id("academicBatches")),
    newCourseId: v.optional(v.id("courses")),
    progressedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");

    const now = Date.now();

    // Mark current allocation as not current
    const currentAllocations = await ctx.db
      .query("studentAcademicAllocation")
      .withIndex("studentId", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.eq(q.field("isCurrent"), true))
      .collect();

    for (const alloc of currentAllocations) {
      await ctx.db.patch(alloc._id, { isCurrent: false });
    }

    // Create new allocation
    await ctx.db.insert("studentAcademicAllocation", {
      studentId: args.studentId,
      academicYearId: args.newAcademicYearId,
      batchId: args.newBatchId || student.batchId,
      courseId: args.newCourseId || student.courseId,
      verticalId: student.verticalId,
      subVerticalId: student.subVerticalId,
      boardId: student.boardId,
      isCurrent: true,
      allocatedAt: now,
      allocatedBy: args.progressedBy,
      createdAt: now,
    });

    // Update student master
    await ctx.db.patch(args.studentId, {
      academicYearId: args.newAcademicYearId,
      batchId: args.newBatchId || student.batchId,
      courseId: args.newCourseId || student.courseId,
      updatedAt: now,
    });

    await ctx.db.insert("studentEnrollmentHistory", {
      studentId: args.studentId,
      eventType: "academic_year_progressed",
      title: "Academic year progressed",
      metadata: JSON.stringify({ newAcademicYearId: args.newAcademicYearId }),
      performedBy: args.progressedBy,
      createdAt: now,
    });

    return { progressed: true };
  },
});

/* ────────────
   STUDENT COMPLETION & ALUMNI
   ──────────── */

export const completeStudent = mutation({
  args: {
    studentId: v.id("studentMaster"),
    completedBy: v.id("users"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");
    if (student.status !== "active") throw new Error("Student must be in active status to complete");

    const now = Date.now();
    await ctx.db.patch(args.studentId, { status: "completed", updatedAt: now });

    await ctx.db.insert("studentEnrollmentHistory", {
      studentId: args.studentId,
      eventType: "completed",
      title: "Course completed",
      description: args.notes,
      performedBy: args.completedBy,
      createdAt: now,
    });

    return { completed: true };
  },
});

export const markAsAlumni = mutation({
  args: {
    studentId: v.id("studentMaster"),
    alumniBy: v.id("users"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");
    if (student.status !== "completed") throw new Error("Student must be in completed status to mark as alumni");

    const now = Date.now();
    await ctx.db.patch(args.studentId, { status: "alumni", updatedAt: now });

    await ctx.db.insert("studentEnrollmentHistory", {
      studentId: args.studentId,
      eventType: "alumni",
      title: "Marked as alumni",
      description: args.notes,
      performedBy: args.alumniBy,
      createdAt: now,
    });

    return { alumni: true };
  },
});

/* ────────────
   QUERIES
   ──────────── */

export const getStudentSummary = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) return null;

    const admissions = await ctx.db.query("studentAdmissions").withIndex("studentId", (q) => q.eq("studentId", args.studentId)).collect();
    const allocations = await ctx.db.query("studentAcademicAllocation").withIndex("studentId", (q) => q.eq("studentId", args.studentId)).order("desc").take(5);
    const guardians = await ctx.db.query("guardianDetails").withIndex("studentId", (q) => q.eq("studentId", args.studentId)).collect();
    const documents = await ctx.db.query("studentDocuments").withIndex("studentId", (q) => q.eq("studentId", args.studentId)).collect();
    const history = await ctx.db.query("studentEnrollmentHistory").withIndex("studentId_createdAt", (q) => q.eq("studentId", args.studentId)).order("desc").take(20);

    return {
      student,
      admission: admissions[0] || null,
      currentAllocation: allocations.find((a) => a.isCurrent) || null,
      allocations,
      guardians,
      documents,
      history,
    };
  },
});

export const searchStudents = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("studentMaster").order("desc").take(200);
    const q = args.query.toLowerCase();
    return all
      .filter((s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.admissionNumber.toLowerCase().includes(q) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q)),
      )
      .slice(0, args.limit || 20);
  },
});

export const getEnrollmentStats = query({
  args: {
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const allStudents = await ctx.db.query("studentMaster").collect();
    let filtered = allStudents;

    if (args.branchId) {
      filtered = filtered.filter((s) => s.branchId === args.branchId);
    }

    return {
      total: filtered.length,
      enquiry: filtered.filter((s) => s.status === "enquiry").length,
      lead: filtered.filter((s) => s.status === "lead").length,
      qualified: filtered.filter((s) => s.status === "qualified").length,
      trial: filtered.filter((s) => s.status === "trial").length,
      admitted: filtered.filter((s) => s.status === "admitted").length,
      active: filtered.filter((s) => s.status === "active").length,
      completed: filtered.filter((s) => s.status === "completed").length,
      alumni: filtered.filter((s) => s.status === "alumni").length,
      cancelled: filtered.filter((s) => s.status === "cancelled").length,
    };
  },
});
