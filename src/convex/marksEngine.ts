import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ─── QUERIES ──────────────────────────────────────────────────────

export const listExamMarks = query({
  args: {
    examSessionId: v.id("examSessions"),
    examSubjectId: v.optional(v.id("examSubjects")),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("examMarks")
      .filter((eq) => eq.eq(eq.field("examSessionId"), args.examSessionId));
    if (args.examSubjectId) {
      q = q.filter((eq) => eq.eq(eq.field("examSubjectId"), args.examSubjectId));
    }
    return await q.collect();
  },
});

export const getStudentMarks = query({
  args: {
    examSessionId: v.id("examSessions"),
    studentId: v.id("personMaster"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("examMarks")
      .filter((q) =>
        q.and(
          q.eq(q.field("examSessionId"), args.examSessionId),
          q.eq(q.field("studentId"), args.studentId),
        ),
      )
      .collect();
  },
});

export const getPendingMarksCount = query({
  args: { examSessionId: v.id("examSessions") },
  handler: async (ctx, args) => {
    const subjects = await ctx.db
      .query("examSubjects")
      .filter((q) => q.eq(q.field("examSessionId"), args.examSessionId))
      .collect();

    const students = await ctx.db
      .query("examMarks")
      .filter((q) => q.eq(q.field("examSessionId"), args.examSessionId))
      .collect();

    const enrolledStudentIds = new Set(
      students.map((m) => m.studentId.toString()),
    );

    return {
      totalSubjects: subjects.length,
      totalEntries: students.length,
      uniqueStudents: enrolledStudentIds.size,
    };
  },
});

// ─── MUTATIONS ────────────────────────────────────────────────────

export const enterMarks = mutation({
  args: {
    examSessionId: v.id("examSessions"),
    examSubjectId: v.optional(v.id("examSubjects")),
    studentId: v.id("personMaster"),
    marksObtained: v.optional(v.number()),
    totalMarks: v.number(),
    attendance: v.union(
      v.literal("present"),
      v.literal("absent"),
      v.literal("medical"),
      v.literal("leave"),
    ),
    graceMarks: v.optional(v.number()),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const effectiveMarks = args.attendance === "present" ? (args.marksObtained ?? 0) : 0;
    const totalWithGrace = effectiveMarks + (args.graceMarks ?? 0);
    const percentage = args.totalMarks > 0
      ? Math.round((Math.min(totalWithGrace, args.totalMarks) / args.totalMarks) * 10000) / 100
      : 0;

    // Check if marks already exist for this student + session + subject
    const existing = await ctx.db
      .query("examMarks")
      .filter((q) =>
        q.and(
          q.eq(q.field("examSessionId"), args.examSessionId),
          q.eq(q.field("studentId"), args.studentId),
          args.examSubjectId
            ? q.eq(q.field("examSubjectId"), args.examSubjectId)
            : q.eq(q.field("totalMarks"), args.totalMarks),
        ),
      )
      .first();

    if (existing) {
      // Update existing marks
      await ctx.db.patch(existing._id, {
        marksObtained: args.attendance === "absent" ? 0 : args.marksObtained,
        totalMarks: args.totalMarks,
        percentage,
        attendance: args.attendance,
        graceMarks: args.graceMarks,
        remarks: args.remarks,
        enteredBy: identity.subject as any,
        enteredAt: now,
        updatedAt: now,
      });
      return existing._id;
    }

    const id = await ctx.db.insert("examMarks", {
      examSessionId: args.examSessionId,
      examSubjectId: args.examSubjectId,
      studentId: args.studentId,
      marksObtained: args.attendance === "absent" ? 0 : args.marksObtained,
      totalMarks: args.totalMarks,
      percentage,
      attendance: args.attendance,
      graceMarks: args.graceMarks,
      remarks: args.remarks,
      enteredBy: identity.subject as any,
      enteredAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

export const verifyMarks = mutation({
  args: {
    markIds: v.array(v.id("examMarks")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    for (const markId of args.markIds) {
      await ctx.db.patch(markId, {
        verifiedBy: identity.subject as any,
        verifiedAt: now,
        updatedAt: now,
      });
    }

    // Create timeline events
    const mark = await ctx.db.get(args.markIds[0]);
    if (mark) {
      await ctx.db.insert("examTimeline", {
        examSessionId: mark.examSessionId,
        eventType: "marks_verified",
        description: `${args.markIds.length} marks entries verified`,
        userId: identity.subject as any,
        createdAt: now,
      });
    }

    return args.markIds.length;
  },
});

export const bulkImportMarks = mutation({
  args: {
    examSessionId: v.id("examSessions"),
    examSubjectId: v.optional(v.id("examSubjects")),
    marks: v.array(
      v.object({
        studentId: v.id("personMaster"),
        marksObtained: v.optional(v.number()),
        totalMarks: v.number(),
        attendance: v.union(
          v.literal("present"),
          v.literal("absent"),
          v.literal("medical"),
          v.literal("leave"),
        ),
        graceMarks: v.optional(v.number()),
        remarks: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const results: Id<"examMarks">[] = [];

    for (const mark of args.marks) {
      const marksObtained = mark.attendance === "present" ? (mark.marksObtained ?? 0) : 0;
      const totalWithGrace = marksObtained + (mark.graceMarks ?? 0);
      const percentage = mark.totalMarks > 0
        ? Math.round(
            (Math.min(totalWithGrace, mark.totalMarks) / mark.totalMarks) * 10000,
          ) / 100
        : 0;

      const id = await ctx.db.insert("examMarks", {
        examSessionId: args.examSessionId,
        examSubjectId: args.examSubjectId,
        studentId: mark.studentId,
        marksObtained: mark.attendance === "absent" ? 0 : mark.marksObtained,
        totalMarks: mark.totalMarks,
        percentage,
        attendance: mark.attendance,
        graceMarks: mark.graceMarks,
        remarks: mark.remarks,
        enteredBy: identity.subject as any,
        enteredAt: now,
        createdAt: now,
        updatedAt: now,
      });
      results.push(id);
    }

    // Create timeline event
    await ctx.db.insert("examTimeline", {
      examSessionId: args.examSessionId,
      eventType: "marks_submitted",
      description: `${args.marks.length} marks entries imported`,
      userId: identity.subject as any,
      createdAt: now,
    });

    return results;
  },
});

// ─── GRADE CALCULATION HELPERS ───────────────────────────────────

export const calculateGrade = (percentage: number): { grade: string; gradePoint: number; division: string } => {
  if (percentage >= 90) return { grade: "A+", gradePoint: 10, division: "distinction" };
  if (percentage >= 80) return { grade: "A", gradePoint: 9, division: "distinction" };
  if (percentage >= 70) return { grade: "B+", gradePoint: 8, division: "first" };
  if (percentage >= 60) return { grade: "B", gradePoint: 7, division: "first" };
  if (percentage >= 50) return { grade: "C+", gradePoint: 6, division: "second" };
  if (percentage >= 40) return { grade: "C", gradePoint: 5, division: "third" };
  if (percentage >= 33) return { grade: "D", gradePoint: 4, division: "third" };
  return { grade: "F", gradePoint: 0, division: "fail" };
};

export const calculateCgpa = (gradePoints: number[]): number => {
  if (gradePoints.length === 0) return 0;
  const sum = gradePoints.reduce((a, b) => a + b, 0);
  return Math.round((sum / gradePoints.length) * 100) / 100;
};
