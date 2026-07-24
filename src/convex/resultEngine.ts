import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ─── QUERIES ──────────────────────────────────────────────────────

export const listExamResults = query({
  args: {
    examSessionId: v.id("examSessions"),
    passFail: v.optional(v.union(v.literal("pass"), v.literal("fail"), v.literal("supplementary"))),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("examResults")
      .filter((eq) => eq.eq(eq.field("examSessionId"), args.examSessionId));
    if (args.passFail) {
      q = q.filter((eq) => eq.eq(eq.field("passFail"), args.passFail));
    }
    return await q.order("asc").collect();
  },
});

export const getStudentResult = query({
  args: {
    examSessionId: v.id("examSessions"),
    studentId: v.id("personMaster"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("examResults")
      .filter((q) =>
        q.and(
          q.eq(q.field("examSessionId"), args.examSessionId),
          q.eq(q.field("studentId"), args.studentId),
        ),
      )
      .first();
  },
});

export const getExamResultStats = query({
  args: { examSessionId: v.id("examSessions") },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("examResults")
      .filter((q) => q.eq(q.field("examSessionId"), args.examSessionId))
      .collect();

    const total = results.length;
    const passed = results.filter((r) => r.passFail === "pass").length;
    const failed = results.filter((r) => r.passFail === "fail").length;
    const supplementary = results.filter(
      (r) => r.passFail === "supplementary",
    ).length;

    const passPercentage = total > 0
      ? Math.round((passed / total) * 10000) / 100
      : 0;

    const topPerformers = results
      .filter((r) => r.passFail === "pass")
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10);

    const avgPercentage =
      total > 0
        ? Math.round(
            results.reduce((sum, r) => sum + r.percentage, 0) / total * 100,
          ) / 100
        : 0;

    return {
      total,
      passed,
      failed,
      supplementary,
      passPercentage,
      avgPercentage,
      topPerformers,
    };
  },
});

export const getStudentResultCard = query({
  args: {
    examSessionId: v.id("examSessions"),
    studentId: v.id("personMaster"),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("examResults")
      .filter((q) =>
        q.and(
          q.eq(q.field("examSessionId"), args.examSessionId),
          q.eq(q.field("studentId"), args.studentId),
        ),
      )
      .first();

    if (!result) return null;

    const reportCard = await ctx.db
      .query("examReportCards")
      .filter((q) =>
        q.and(
          q.eq(q.field("examSessionId"), args.examSessionId),
          q.eq(q.field("studentId"), args.studentId),
        ),
      )
      .first();

    return {
      result,
      reportCard,
    };
  },
});

// ─── MUTATIONS ────────────────────────────────────────────────────

export const calculateResults = mutation({
  args: {
    examSessionId: v.id("examSessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const subjectIds = await ctx.db
      .query("examSubjects")
      .filter((q) => q.eq(q.field("examSessionId"), args.examSessionId))
      .collect();

    const allMarks = await ctx.db
      .query("examMarks")
      .filter((q) => q.eq(q.field("examSessionId"), args.examSessionId))
      .collect();

    // Group marks by student
    const studentMarksMap = new Map<string, typeof allMarks>();
    for (const mark of allMarks) {
      const key = mark.studentId.toString();
      const existing = studentMarksMap.get(key) || [];
      existing.push(mark);
      studentMarksMap.set(key, existing);
    }

    const now = Date.now();
    const resultIds: Id<"examResults">[] = [];

    for (const [studentIdStr, marks] of studentMarksMap) {
      const studentId = studentIdStr as Id<"personMaster">;
      let totalObtained = 0;
      let totalMax = 0;
      let totalSubjects = 0;
      const subjectResults: Array<{
        subjectId: string;
        marksObtained: number;
        totalMarks: number;
        percentage: number;
        grade: string;
        gradePoint: number;
      }> = [];

      for (const mark of marks) {
        if (mark.attendance === "absent") continue;
        const obtained = (mark.marksObtained ?? 0) + (mark.graceMarks ?? 0);
        totalObtained += Math.min(obtained, mark.totalMarks);
        totalMax += mark.totalMarks;
        totalSubjects++;

        const pct = mark.totalMarks > 0
          ? Math.round((Math.min(obtained, mark.totalMarks) / mark.totalMarks) * 10000) / 100
          : 0;

        subjectResults.push({
          subjectId: mark.examSubjectId?.toString() || "",
          marksObtained: Math.min(obtained, mark.totalMarks),
          totalMarks: mark.totalMarks,
          percentage: pct,
          grade: calculateGrade(pct).grade,
          gradePoint: calculateGrade(pct).gradePoint,
        });
      }

      const overallPercentage = totalMax > 0
        ? Math.round((totalObtained / totalMax) * 10000) / 100
        : 0;

      const { grade, gradePoint, division } = calculateGrade(overallPercentage);

      const gradePoints = subjectResults.map((s) => s.gradePoint);
      const cgpa = calculateCgpa(gradePoints);

      const passFail = overallPercentage >= 33 ? "pass" : "fail";

      // Delete existing result for this student + session if exists
      const existing = await ctx.db
        .query("examResults")
        .filter((q) =>
          q.and(
            q.eq(q.field("examSessionId"), args.examSessionId),
            q.eq(q.field("studentId"), studentId),
          ),
        )
        .first();
      if (existing) {
        await ctx.db.delete(existing._id);
      }

      const resultId = await ctx.db.insert("examResults", {
        examSessionId: args.examSessionId,
        studentId,
        totalMarks: totalMax,
        marksObtained: totalObtained,
        percentage: overallPercentage,
        cgpa,
        grade,
        division: division as any,
        passFail: passFail as any,
        subjectResults: JSON.stringify(subjectResults),
        calculatedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      resultIds.push(resultId);

      // Generate report card
      const reportData = {
        studentId: studentId.toString(),
        examSessionId: args.examSessionId.toString(),
        totalMarks: totalMax,
        marksObtained: totalObtained,
        percentage: overallPercentage,
        cgpa,
        grade,
        division,
        passFail,
        subjects: subjectResults,
        calculatedAt: now,
      };

      const existingReport = await ctx.db
        .query("examReportCards")
        .filter((q) =>
          q.and(
            q.eq(q.field("examSessionId"), args.examSessionId),
            q.eq(q.field("studentId"), studentId),
          ),
        )
        .first();
      if (existingReport) {
        await ctx.db.patch(existingReport._id, {
          resultId,
          reportData: JSON.stringify(reportData),
          generatedAt: now,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("examReportCards", {
          examSessionId: args.examSessionId,
          studentId,
          resultId,
          reportData: JSON.stringify(reportData),
          generatedAt: now,
          downloadCount: 0,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // Create timeline event
    await ctx.db.insert("examTimeline", {
      examSessionId: args.examSessionId,
      eventType: "result_calculated",
      description: `Results calculated for ${resultIds.length} students`,
      userId: identity.subject as any,
      createdAt: now,
    });

    return {
      resultCount: resultIds.length,
      message: `Results calculated for ${resultIds.length} students`,
    };
  },
});

export const publishResults = mutation({
  args: {
    examSessionId: v.id("examSessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();

    // Update all results with publish info
    const results = await ctx.db
      .query("examResults")
      .filter((q) => q.eq(q.field("examSessionId"), args.examSessionId))
      .collect();

    for (const result of results) {
      await ctx.db.patch(result._id, {
        publishedAt: now,
        publishedBy: identity.subject as any,
        updatedAt: now,
      });
    }

    // Update session status
    await ctx.db.patch(args.examSessionId, {
      status: "published",
      updatedAt: now,
    });

    // Create timeline event
    await ctx.db.insert("examTimeline", {
      examSessionId: args.examSessionId,
      eventType: "result_published",
      description: `Results published for ${results.length} students`,
      userId: identity.subject as any,
      createdAt: now,
    });

    // Publish log
    await ctx.db.insert("examPublishLog", {
      examSessionId: args.examSessionId,
      action: "published",
      performedBy: identity.subject as any,
      createdAt: now,
    });

    return {
      publishedCount: results.length,
      message: `Results published for ${results.length} students`,
    };
  },
});

export const trackReportDownload = mutation({
  args: {
    reportCardId: v.id("examReportCards"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const report = await ctx.db.get(args.reportCardId);
    if (!report) throw new Error("Report card not found");

    await ctx.db.patch(args.reportCardId, {
      downloadedAt: Date.now(),
      downloadCount: (report.downloadCount || 0) + 1,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("examTimeline", {
      examSessionId: report.examSessionId,
      eventType: "report_downloaded",
      description: `Report card downloaded for student`,
      userId: identity.subject as any,
      createdAt: Date.now(),
    });

    return args.reportCardId;
  },
});

export const getTopPerformers = query({
  args: {
    examSessionId: v.id("examSessions"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const results = await ctx.db
      .query("examResults")
      .filter((q) =>
        q.and(
          q.eq(q.field("examSessionId"), args.examSessionId),
          q.eq(q.field("passFail"), "pass"),
        ),
      )
      .order("desc")
      .collect();

    return results
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, limit);
  },
});

// ─── INTERNAL HELPERS ────────────────────────────────────────────

function calculateGrade(percentage: number): {
  grade: string;
  gradePoint: number;
  division: string;
} {
  if (percentage >= 90) return { grade: "A+", gradePoint: 10, division: "distinction" };
  if (percentage >= 80) return { grade: "A", gradePoint: 9, division: "distinction" };
  if (percentage >= 70) return { grade: "B+", gradePoint: 8, division: "first" };
  if (percentage >= 60) return { grade: "B", gradePoint: 7, division: "first" };
  if (percentage >= 50) return { grade: "C+", gradePoint: 6, division: "second" };
  if (percentage >= 40) return { grade: "C", gradePoint: 5, division: "third" };
  if (percentage >= 33) return { grade: "D", gradePoint: 4, division: "third" };
  return { grade: "F", gradePoint: 0, division: "fail" };
}

function calculateCgpa(gradePoints: number[]): number {
  if (gradePoints.length === 0) return 0;
  const sum = gradePoints.reduce((a, b) => a + b, 0);
  return Math.round((sum / gradePoints.length) * 100) / 100;
}
