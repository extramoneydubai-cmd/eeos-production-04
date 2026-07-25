import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { withEventPipeline, entityIdFromResult, entityIdFromArg } from "@/platform/eventPipeline";

// ═══════════════════════════════════════════════════════════════════
// MARKS QUERIES
// ═══════════════════════════════════════════════════════════════════

export const listExamMarks = query({
  args: { examSessionId: v.id("examSessions"), examSubjectId: v.optional(v.id("examSubjects")) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("examMarks").filter((eq) => eq.eq(eq.field("examSessionId"), args.examSessionId));
    if (args.examSubjectId) q = q.filter((eq) => eq.eq(eq.field("examSubjectId"), args.examSubjectId));
    return await q.collect();
  },
});

export const getStudentMarks = query({
  args: { examSessionId: v.id("examSessions"), studentId: v.id("personMaster") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("examMarks")
      .filter((q) => q.and(q.eq(q.field("examSessionId"), args.examSessionId), q.eq(q.field("studentId"), args.studentId)))
      .collect();
  },
});

export const getSubjectMarks = query({
  args: { examSubjectId: v.id("examSubjects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("examMarks")
      .filter((q) => q.eq(q.field("examSubjectId"), args.examSubjectId))
      .collect();
  },
});

export const getPendingMarksCount = query({
  args: { examSessionId: v.id("examSessions") },
  handler: async (ctx, args) => {
    const subjects = await ctx.db
      .query("examSubjects").filter((q) => q.eq(q.field("examSessionId"), args.examSessionId)).collect();
    const marks = await ctx.db
      .query("examMarks").filter((q) => q.eq(q.field("examSessionId"), args.examSessionId)).collect();

    const uniqueSubjectsWithMarks = new Set(marks.map((m) => m.examSubjectId?.toString()));

    return {
      totalSubjects: subjects.length,
      subjectsWithMarks: uniqueSubjectsWithMarks.size,
      subjectsPending: subjects.length - uniqueSubjectsWithMarks.size,
      totalEntries: marks.length,
    };
  },
});

export const getMarksVerificationStatus = query({
  args: { examSessionId: v.id("examSessions") },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query("examMarks").filter((q) => q.eq(q.field("examSessionId"), args.examSessionId)).collect();

    const total = marks.length;
    const verified = marks.filter((m) => m.verifiedBy).length;
    const moderated = marks.filter((m) => m.moderatedBy).length;

    return { total, verified, moderated, pending: total - verified };
  },
});

// ═══════════════════════════════════════════════════════════════════
// MARKS ENTRY
// ═══════════════════════════════════════════════════════════════════

export const enterMarks = mutation({
  args: {
    examSessionId: v.id("examSessions"), examSubjectId: v.optional(v.id("examSubjects")),
    studentId: v.id("personMaster"), marksObtained: v.optional(v.number()),
    totalMarks: v.number(),
    attendance: v.union(v.literal("present"), v.literal("absent"), v.literal("medical"), v.literal("leave")),
    graceMarks: v.optional(v.number()), remarks: v.optional(v.string()),
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

    // Check for existing marks entry
    const existing = await ctx.db
      .query("examMarks")
      .filter((q) => q.and(
        q.eq(q.field("examSessionId"), args.examSessionId),
        q.eq(q.field("studentId"), args.studentId),
        args.examSubjectId ? q.eq(q.field("examSubjectId"), args.examSubjectId) : q.eq(q.field("totalMarks"), args.totalMarks),
      ))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        marksObtained: args.attendance === "absent" ? 0 : args.marksObtained,
        totalMarks: args.totalMarks, percentage, attendance: args.attendance,
        graceMarks: args.graceMarks, remarks: args.remarks,
        enteredBy: identity.subject as any, enteredAt: now, updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("examMarks", {
      examSessionId: args.examSessionId, examSubjectId: args.examSubjectId,
      studentId: args.studentId, marksObtained: args.attendance === "absent" ? 0 : args.marksObtained,
      totalMarks: args.totalMarks, percentage, attendance: args.attendance,
      graceMarks: args.graceMarks, remarks: args.remarks,
      enteredBy: identity.subject as any, enteredAt: now, createdAt: now, updatedAt: now,
    });
  },
});

export const bulkImportMarks = mutation({
  args: {
    examSessionId: v.id("examSessions"), examSubjectId: v.optional(v.id("examSubjects")),
    marks: v.array(v.object({
      studentId: v.id("personMaster"), marksObtained: v.optional(v.number()),
      totalMarks: v.number(), attendance: v.union(v.literal("present"), v.literal("absent"), v.literal("medical"), v.literal("leave")),
      graceMarks: v.optional(v.number()), remarks: v.optional(v.string()),
    })),
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
        ? Math.round((Math.min(totalWithGrace, mark.totalMarks) / mark.totalMarks) * 10000) / 100
        : 0;

      const id = await ctx.db.insert("examMarks", {
        examSessionId: args.examSessionId, examSubjectId: args.examSubjectId,
        studentId: mark.studentId, marksObtained: mark.attendance === "absent" ? 0 : mark.marksObtained,
        totalMarks: mark.totalMarks, percentage, attendance: mark.attendance,
        graceMarks: mark.graceMarks, remarks: mark.remarks,
        enteredBy: identity.subject as any, enteredAt: now, createdAt: now, updatedAt: now,
      });
      results.push(id);
    }

    await ctx.db.insert("examTimeline", {
      examSessionId: args.examSessionId, eventType: "marks_submitted",
      description: `${args.marks.length} marks imported`, userId: identity.subject as any, createdAt: now,
    });

    return results;
  },
});

export const updateMarks = mutation({
  args: {
    markId: v.id("examMarks"), marksObtained: v.optional(v.number()),
    totalMarks: v.optional(v.number()), attendance: v.optional(v.union(v.literal("present"), v.literal("absent"), v.literal("medical"), v.literal("leave"))),
    graceMarks: v.optional(v.number()), remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { markId, ...updates } = args;
    const existing = await ctx.db.get(markId);
    if (!existing) throw new Error("Marks entry not found");

    const now = Date.now();
    const patch: Record<string, any> = { updatedAt: now };
    if (updates.marksObtained !== undefined) patch.marksObtained = updates.marksObtained;
    if (updates.totalMarks !== undefined) patch.totalMarks = updates.totalMarks;
    if (updates.attendance !== undefined) patch.attendance = updates.attendance;
    if (updates.graceMarks !== undefined) patch.graceMarks = updates.graceMarks;
    if (updates.remarks !== undefined) patch.remarks = updates.remarks;

    // Recalculate percentage
    const marksValue = updates.marksObtained ?? existing.marksObtained ?? 0;
    const totalValue = updates.totalMarks ?? existing.totalMarks;
    const graceValue = updates.graceMarks ?? existing.graceMarks ?? 0;
    const effectiveMarks = Math.min(marksValue + graceValue, totalValue);
    patch.percentage = totalValue > 0 ? Math.round((effectiveMarks / totalValue) * 10000) / 100 : 0;

    await ctx.db.patch(markId, patch);
    return markId;
  },
});

// ═══════════════════════════════════════════════════════════════════
// MARKS VERIFICATION
// ═══════════════════════════════════════════════════════════════════

export const verifyMarks = mutation({
  args: { markIds: v.array(v.id("examMarks")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    for (const markId of args.markIds) {
      await ctx.db.patch(markId, { verifiedBy: identity.subject as any, verifiedAt: now, updatedAt: now });
    }

    const mark = await ctx.db.get(args.markIds[0]);
    if (mark) {
      await ctx.db.insert("examTimeline", {
        examSessionId: mark.examSessionId, eventType: "marks_verified",
        description: `${args.markIds.length} marks entries verified`, userId: identity.subject as any, createdAt: now,
      });
    }
    return args.markIds.length;
  },
});

// ═══════════════════════════════════════════════════════════════════
// MARKS MODERATION
// ═══════════════════════════════════════════════════════════════════

export const moderateMarks = mutation({
  args: {
    markId: v.id("examMarks"), moderatedMarks: v.number(),
    moderationNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    await ctx.db.patch(args.markId, {
      moderatedMarks: args.moderatedMarks,
      moderatedBy: identity.subject as any,
      moderatedAt: now,
      moderationNotes: args.moderationNotes,
      updatedAt: now,
    });

    const mark = await ctx.db.get(args.markId);
    if (mark) {
      await ctx.db.insert("examTimeline", {
        examSessionId: mark.examSessionId, eventType: "marks_moderated",
        description: "Marks entry moderated",
        userId: identity.subject as any, createdAt: now,
      });
    }

    return args.markId;
  },
});

export const bulkModerateMarks = mutation({
  args: {
    examSubjectId: v.id("examSubjects"),
    moderationType: v.union(v.literal("increase_all"), v.literal("decrease_all"), v.literal("set_common"), v.literal("custom")),
    adjustmentValue: v.optional(v.number()),
    moderationNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const marks = await ctx.db
      .query("examMarks")
      .filter((q) => q.eq(q.field("examSubjectId"), args.examSubjectId))
      .collect();

    const now = Date.now();
    let count = 0;
    for (const mark of marks) {
      let moderatedMarks = mark.marksObtained ?? 0;
      if (args.moderationType === "increase_all" && args.adjustmentValue) {
        moderatedMarks = Math.min(moderatedMarks + args.adjustmentValue, mark.totalMarks);
      } else if (args.moderationType === "decrease_all" && args.adjustmentValue) {
        moderatedMarks = Math.max(0, moderatedMarks - args.adjustmentValue);
      } else if (args.moderationType === "set_common" && args.adjustmentValue) {
        moderatedMarks = Math.min(args.adjustmentValue, mark.totalMarks);
      }

      if (moderatedMarks !== (mark.marksObtained ?? 0)) {
        await ctx.db.patch(mark._id, {
          moderatedMarks, moderatedBy: identity.subject as any, moderatedAt: now,
          moderationNotes: args.moderationNotes, updatedAt: now,
        });
        count++;
      }
    }

    return { count, message: `${count} marks entries moderated` };
  },
});

export const requestModeration = mutation({
  args: {
    examSessionId: v.id("examSessions"), remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.insert("examPublishLog", {
      examSessionId: args.examSessionId, action: "moderation_requested",
      performedBy: identity.subject as any, remarks: args.remarks, createdAt: Date.now(),
    });
    await ctx.db.insert("examTimeline", {
      examSessionId: args.examSessionId, eventType: "moderation_requested",
      description: "Moderation requested", userId: identity.subject as any, createdAt: Date.now(),
    });
    return { success: true };
  },
});

// ═══════════════════════════════════════════════════════════════════
// EXAM ATTENDANCE
// ═══════════════════════════════════════════════════════════════════

export const markAttendance = mutation({
  args: {
    examSessionId: v.id("examSessions"), timetableId: v.id("examTimetable"),
    studentId: v.id("personMaster"), subjectId: v.id("examSubjects"),
    status: v.union(v.literal("present"), v.literal("absent"), v.literal("medical"), v.literal("leave")),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const existing = await ctx.db
      .query("examAttendance")
      .filter((q) => q.and(
        q.eq(q.field("examSessionId"), args.examSessionId),
        q.eq(q.field("studentId"), args.studentId),
        q.eq(q.field("subjectId"), args.subjectId),
      ))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { status: args.status, markedBy: identity.subject as any, markedAt: now, remarks: args.remarks, updatedAt: now });
      return existing._id;
    }

    return await ctx.db.insert("examAttendance", {
      ...args, markedBy: identity.subject as any, markedAt: now, createdAt: now, updatedAt: now,
    });
  },
});

export const bulkMarkAttendance = mutation({
  args: {
    examSessionId: v.id("examSessions"), timetableId: v.id("examTimetable"),
    subjectId: v.id("examSubjects"),
    entries: v.array(v.object({
      studentId: v.id("personMaster"),
      status: v.union(v.literal("present"), v.literal("absent"), v.literal("medical"), v.literal("leave")),
      remarks: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    let count = 0;
    for (const entry of args.entries) {
      const existing = await ctx.db
        .query("examAttendance")
        .filter((q) => q.and(
          q.eq(q.field("examSessionId"), args.examSessionId),
          q.eq(q.field("studentId"), entry.studentId),
          q.eq(q.field("subjectId"), args.subjectId),
        ))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, { status: entry.status, markedBy: identity.subject as any, markedAt: now, remarks: entry.remarks, updatedAt: now });
      } else {
        await ctx.db.insert("examAttendance", {
          examSessionId: args.examSessionId, timetableId: args.timetableId,
          studentId: entry.studentId, subjectId: args.subjectId,
          status: entry.status, markedBy: identity.subject as any, markedAt: now,
          remarks: entry.remarks, createdAt: now, updatedAt: now,
        });
      }
      count++;
    }
    return { count };
  },
});

export const getAttendance = query({
  args: { examSessionId: v.id("examSessions"), subjectId: v.optional(v.id("examSubjects")) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("examAttendance").filter((eq) => eq.eq(eq.field("examSessionId"), args.examSessionId));
    if (args.subjectId) q = q.filter((eq) => eq.eq(eq.field("subjectId"), args.subjectId));
    return await q.collect();
  },
});

// ═══════════════════════════════════════════════════════════════════
// GRADE CALCULATION HELPERS (shared)
// ═══════════════════════════════════════════════════════════════════

export interface GradeResult {
  grade: string;
  gradePoint: number;
  division: "distinction" | "first" | "second" | "third" | "fail" | "supplementary";
}

/**
 * Calculate grade from percentage using configurable rules.
 * Falls back to standard rules if no rule set is provided.
 */
export function calculateGrade(
  percentage: number,
  rules?: Array<{ minPct: number; maxPct: number; grade: string; gradePoint: number; division: string }>,
): GradeResult {
  const gradeRules = rules || getDefaultRules();

  for (const rule of gradeRules) {
    if (percentage >= rule.minPct && percentage <= rule.maxPct) {
      return {
        grade: rule.grade,
        gradePoint: rule.gradePoint,
        division: rule.division as GradeResult["division"],
      };
    }
  }
  return { grade: "F", gradePoint: 0, division: "fail" };
}

export function calculateCgpa(gradePoints: number[]): number {
  if (gradePoints.length === 0) return 0;
  const sum = gradePoints.reduce((a, b) => a + b, 0);
  return Math.round((sum / gradePoints.length) * 100) / 100;
}

function getDefaultRules(): Array<{ minPct: number; maxPct: number; grade: string; gradePoint: number; division: string }> {
  return [
    { minPct: 90, maxPct: 100, grade: "A+", gradePoint: 10, division: "distinction" },
    { minPct: 80, maxPct: 89, grade: "A", gradePoint: 9, division: "distinction" },
    { minPct: 70, maxPct: 79, grade: "B+", gradePoint: 8, division: "first" },
    { minPct: 60, maxPct: 69, grade: "B", gradePoint: 7, division: "first" },
    { minPct: 50, maxPct: 59, grade: "C+", gradePoint: 6, division: "second" },
    { minPct: 40, maxPct: 49, grade: "C", gradePoint: 5, division: "third" },
    { minPct: 33, maxPct: 39, grade: "D", gradePoint: 4, division: "third" },
    { minPct: 0, maxPct: 32, grade: "F", gradePoint: 0, division: "fail" },
  ];
}
