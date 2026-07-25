import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ═══════════════════════════════════════════════════════════════════
// REPORT CARD QUERIES (Part 5)
// ═══════════════════════════════════════════════════════════════════

export const listReportCards = query({
  args: {
    examSessionId: v.optional(v.id("examSessions")),
    studentId: v.optional(v.id("personMaster")),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("examReportCards");
    if (args.examSessionId) q = q.filter((eq) => eq.eq(eq.field("examSessionId"), args.examSessionId));
    const all = await q.order("desc").collect();
    if (args.studentId) return all.filter((r) => r.studentId === args.studentId);
    return all;
  },
});

export const getReportCard = query({
  args: { id: v.id("examReportCards") },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.id);
    if (!card) return null;
    const person = await ctx.db.get(card.studentId);
    return {
      ...card,
      studentName: person ? `${person.firstName} ${person.lastName || ""}`.trim() : "Unknown",
    };
  },
});

export const getStudentReportCards = query({
  args: { studentId: v.id("personMaster") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("examReportCards")
      .filter((q) => q.eq(q.field("studentId"), args.studentId))
      .order("desc")
      .collect();
  },
});

// ═══════════════════════════════════════════════════════════════════
// REPORT CARD MUTATIONS
// ═══════════════════════════════════════════════════════════════════

export const generateReportCard = mutation({
  args: {
    examSessionId: v.id("examSessions"),
    studentId: v.id("personMaster"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const session = await ctx.db.get(args.examSessionId);
    if (!session) throw new Error("Session not found");

    // Get the result
    const result = await ctx.db
      .query("examResults")
      .filter((q) => q.and(
        q.eq(q.field("examSessionId"), args.examSessionId),
        q.eq(q.field("studentId"), args.studentId),
      ))
      .first();
    if (!result) throw new Error("Result not found for student");

    // Get all subjects and marks
    const subjects = await ctx.db
      .query("examSubjects")
      .filter((q) => q.eq(q.field("examSessionId"), args.examSessionId))
      .collect();

    const marks = await ctx.db
      .query("examMarks")
      .filter((q) => q.and(
        q.eq(q.field("examSessionId"), args.examSessionId),
        q.eq(q.field("studentId"), args.studentId),
      ))
      .collect();

    // Get attendance
    const attendance = await ctx.db
      .query("examAttendance")
      .filter((q) => q.and(
        q.eq(q.field("examSessionId"), args.examSessionId),
        q.eq(q.field("studentId"), args.studentId),
      ))
      .collect();

    // Enrich subject names
    const subjectDetails = await Promise.all(
      subjects.map(async (s) => {
        let name = s.subjectId;
        try {
          const acadSubj = await ctx.db.get(s.subjectId);
          if (acadSubj) name = (acadSubj as any).name || acadSubj._id;
        } catch { /* ignore */ }
        const mark = marks.find((m) => m.examSubjectId === s._id);
        const att = attendance.find((a) => a.subjectId === s._id);
        return {
          subjectId: s._id,
          subjectName: name,
          maxMarks: s.maxMarks,
          marksObtained: mark?.marksObtained ?? 0,
          moderatedMarks: mark?.moderatedMarks,
          graceMarks: mark?.graceMarks ?? 0,
          percentage: mark?.percentage ?? 0,
          attendance: att?.status ?? "absent",
          grade: calculateGradeFromPct(mark?.percentage ?? 0),
        };
      }),
    );

    // Build report data
    const reportData = {
      sessionName: session.name,
      sessionStatus: session.status,
      generatedAt: now,
      overall: {
        totalMarks: result.totalMarks,
        marksObtained: result.marksObtained,
        percentage: result.percentage,
        grade: result.grade,
        cgpa: result.cgpa,
        division: result.division,
        passFail: result.passFail,
        rank: result.rank,
      },
      subjects: subjectDetails,
      summary: {
        totalSubjects: subjects.length,
        passed: subjectDetails.filter((s) => {
          const subj = subjects.find((sub) => sub._id === s.subjectId);
          const passPct = subj?.passPercentage ?? 33;
          return s.percentage >= passPct;
        }).length,
        attendance: {
          present: attendance.filter((a) => a.status === "present").length,
          absent: attendance.filter((a) => a.status === "absent").length,
          medical: attendance.filter((a) => a.status === "medical").length,
        },
      },
    };

    // Check for existing card
    const existing = await ctx.db
      .query("examReportCards")
      .filter((q) => q.and(
        q.eq(q.field("examSessionId"), args.examSessionId),
        q.eq(q.field("studentId"), args.studentId),
      ))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        reportData: JSON.stringify(reportData),
        generatedAt: now,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("examReportCards", {
      examSessionId: args.examSessionId,
      studentId: args.studentId,
      resultId: result._id,
      reportData: JSON.stringify(reportData),
      generatedAt: now,
      downloadCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const bulkGenerateReportCards = mutation({
  args: { examSessionId: v.id("examSessions") },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("examResults")
      .filter((q) => q.eq(q.field("examSessionId"), args.examSessionId))
      .collect();

    let count = 0;
    for (const result of results) {
      try {
        const existing = await ctx.db
          .query("examReportCards")
          .filter((q) => q.and(
            q.eq(q.field("examSessionId"), args.examSessionId),
            q.eq(q.field("studentId"), result.studentId),
          ))
          .first();
        if (!existing) count++;
      } catch { /* skip */ }
    }
    return { total: results.length, toGenerate: count };
  },
});

export const recordReportCardDownload = mutation({
  args: { id: v.id("examReportCards") },
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.id);
    if (!card) throw new Error("Report card not found");
    await ctx.db.patch(args.id, {
      downloadedAt: Date.now(),
      downloadCount: (card.downloadCount ?? 0) + 1,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

function calculateGradeFromPct(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C+";
  if (percentage >= 40) return "C";
  if (percentage >= 33) return "D";
  return "F";
}

// ═══════════════════════════════════════════════════════════════════
// TRANSCRIPT GENERATION
// ═══════════════════════════════════════════════════════════════════

export const getStudentTranscript = query({
  args: { studentId: v.id("personMaster") },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("examResults")
      .filter((q) => q.eq(q.field("studentId"), args.studentId))
      .order("desc")
      .collect();

    const enriched = await Promise.all(
      results.map(async (r) => {
        const session = await ctx.db.get(r.examSessionId);
        return {
          ...r,
          sessionName: session?.name ?? "Unknown",
          sessionDate: session?.startDate,
        };
      }),
    );

    const totalCgpa = enriched.length > 0
      ? enriched.reduce((sum, r) => sum + (r.cgpa ?? 0), 0) / enriched.length
      : 0;

    return {
      transcript: enriched,
      overallCgpa: Math.round(totalCgpa * 100) / 100,
      totalExams: enriched.length,
      passed: enriched.filter((r) => r.passFail === "pass").length,
    };
  },
});
