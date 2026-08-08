import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { calculateGrade, calculateCgpa, GradeResult } from "./marksEngine";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ═══════════════════════════════════════════════════════════════════
// RESULT QUERIES
// ═══════════════════════════════════════════════════════════════════

export const listExamResults = query({
  args: {
    examSessionId: v.id("examSessions"),
    passFail: v.optional(v.union(v.literal("pass"), v.literal("fail"), v.literal("supplementary"))),
    division: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("examResults").filter((eq) => eq.eq(eq.field("examSessionId"), args.examSessionId));
    if (args.passFail) q = q.filter((eq) => eq.eq(eq.field("passFail"), args.passFail));
    if (args.division) q = q.filter((eq) => eq.eq(eq.field("division"), args.division));
    const results = await q.collect();
    // Enrich with student names
    const enriched = await Promise.all(
      results.slice(0, args.limit || 100).map(async (r) => {
        const person = await ctx.db.get(r.studentId);
        return { ...r, studentName: person ? `${person.firstName} ${person.lastName || ""}`.trim() : "Unknown" };
      }),
    );
    return enriched;
  },
});

export const getStudentResult = query({
  args: { examSessionId: v.id("examSessions"), studentId: v.id("personMaster") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("examResults")
      .filter((q) => q.and(q.eq(q.field("examSessionId"), args.examSessionId), q.eq(q.field("studentId"), args.studentId)))
      .first();
  },
});

export const getResultStats = query({
  args: { examSessionId: v.id("examSessions") },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("examResults").filter((q) => q.eq(q.field("examSessionId"), args.examSessionId)).collect();

    const total = results.length;
    const passed = results.filter((r) => r.passFail === "pass").length;
    const failed = results.filter((r) => r.passFail === "fail").length;
    const supplementary = results.filter((r) => r.passFail === "supplementary").length;
    const passPercentage = total > 0 ? Math.round((passed / total) * 10000) / 100 : 0;

    const withDistinction = results.filter((r) => r.division === "distinction").length;
    const firstDivision = results.filter((r) => r.division === "first").length;
    const secondDivision = results.filter((r) => r.division === "second").length;
    const thirdDivision = results.filter((r) => r.division === "third").length;

    const avgPercentage = total > 0
      ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / total * 100) / 100
      : 0;
    const maxPercentage = total > 0 ? Math.max(...results.map((r) => r.percentage)) : 0;
    const minPercentage = total > 0 ? Math.min(...results.map((r) => r.percentage)) : 0;

    const topPerformers = results
      .filter((r) => r.passFail === "pass")
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10);

    // Enrich top performers with names
    const enrichedTop = await Promise.all(
      topPerformers.map(async (r) => {
        const person = await ctx.db.get(r.studentId);
        return { ...r, studentName: person ? `${person.firstName} ${person.lastName || ""}`.trim() : "Unknown" };
      }),
    );

    return {
      total, passed, failed, supplementary, passPercentage,
      withDistinction, firstDivision, secondDivision, thirdDivision,
      avgPercentage, maxPercentage, minPercentage,
      topPerformers: enrichedTop,
    };
  },
});

export const getSubjectWiseAnalysis = query({
  args: { examSessionId: v.id("examSessions") },
  handler: async (ctx, args) => {
    const subjects = await ctx.db
      .query("examSubjects").filter((q) => q.eq(q.field("examSessionId"), args.examSessionId)).collect();
    const marks = await ctx.db
      .query("examMarks").filter((q) => q.eq(q.field("examSessionId"), args.examSessionId)).collect();

    const analysis: Array<{
      subjectId: string; subjectName: string; maxMarks: number;
      avgMarks: number; highestMarks: number; lowestMarks: number;
      passCount: number; failCount: number; totalStudents: number;
      passPercentage: number;
    }> = [];

    for (const subject of subjects) {
      const subjectMarks = marks.filter((m) => m.examSubjectId === subject._id && m.attendance === "present");
      const marksValues = subjectMarks.map((m) => Math.min((m.marksObtained ?? 0) + (m.graceMarks ?? 0), m.totalMarks));

      if (marksValues.length === 0) {
        analysis.push({
          subjectId: subject._id, subjectName: subject.subjectId, maxMarks: subject.maxMarks,
          avgMarks: 0, highestMarks: 0, lowestMarks: 0,
          passCount: 0, failCount: 0, totalStudents: subjectMarks.length, passPercentage: 0,
        });
        continue;
      }

      const avgMarks = Math.round(marksValues.reduce((a, b) => a + b, 0) / marksValues.length * 100) / 100;
      const highestMarks = Math.max(...marksValues);
      const lowestMarks = Math.min(...marksValues);
      const passPct = subject.passPercentage || 33;
      const passed = marksValues.filter((m) => (m / subject.maxMarks * 100) >= passPct).length;
      const failed = marksValues.length - passed;

      // Try to get subject name
      let subjectName = subject.subjectId;
      try {
        const acadSubj = await ctx.db.get(subject.subjectId);
        if (acadSubj) subjectName = (acadSubj as any).name || acadSubj._id;
      } catch { /* ignore */ }

      analysis.push({
        subjectId: subject._id, subjectName, maxMarks: subject.maxMarks,
        avgMarks, highestMarks, lowestMarks,
        passCount: passed, failCount: failed, totalStudents: subjectMarks.length,
        passPercentage: subjectMarks.length > 0 ? Math.round((passed / subjectMarks.length) * 10000) / 100 : 0,
      });
    }

    return analysis;
  },
});

export const getDivisionDistribution = query({
  args: { examSessionId: v.id("examSessions") },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("examResults").filter((q) => q.eq(q.field("examSessionId"), args.examSessionId)).collect();

    return {
      distinction: results.filter((r) => r.division === "distinction").length,
      first: results.filter((r) => r.division === "first").length,
      second: results.filter((r) => r.division === "second").length,
      third: results.filter((r) => r.division === "third").length,
      fail: results.filter((r) => r.division === "fail").length,
      supplementary: results.filter((r) => (r as any).division === "supplementary").length,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════
// RESULT CALCULATION
// ═══════════════════════════════════════════════════════════════════

export const calculateResults = mutation({
  args: { token: v.optional(v.string()), examSessionId: v.id("examSessions") },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "resultEngine" }, async (ctx, args) => {
    const identity = ctx.__performerUserId;
    if (!identity) throw new Error("Not authenticated");

    const subjectIds = await ctx.db
      .query("examSubjects").filter((q: any) => q.eq(q.field("examSessionId"), args.examSessionId)).collect();
    const allMarks = await ctx.db
      .query("examMarks").filter((q: any) => q.eq(q.field("examSessionId"), args.examSessionId)).collect();
    const session = await ctx.db.get(args.examSessionId);

    // Determine pass percentage from template or default
    let passPercentage = 33;
    if (session) {
      const template = await ctx.db.get(session.templateId);
      if (template) passPercentage = template.passPercentage;
    }

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
      const subjectResults: Array<{
        subjectId: string; marksObtained: number; totalMarks: number;
        percentage: number; grade: string; gradePoint: number;
      }> = [];

      for (const mark of marks) {
        if (mark.attendance === "absent") continue;
        // Use moderated marks if available, else raw marks
        const obtained = (mark.moderatedMarks ?? mark.marksObtained ?? 0) + (mark.graceMarks ?? 0);
        totalObtained += Math.min(obtained, mark.totalMarks);
        totalMax += mark.totalMarks;
        const pct = mark.totalMarks > 0
          ? Math.round((Math.min(obtained, mark.totalMarks) / mark.totalMarks) * 10000) / 100
          : 0;

        const { grade, gradePoint } = calculateGrade(pct);
        subjectResults.push({
          subjectId: mark.examSubjectId?.toString() || "",
          marksObtained: Math.min(obtained, mark.totalMarks),
          totalMarks: mark.totalMarks,
          percentage: pct,
          grade,
          gradePoint,
        });
      }

      const overallPercentage = totalMax > 0
        ? Math.round((totalObtained / totalMax) * 10000) / 100
        : 0;

      const { grade, gradePoint, division } = calculateGrade(overallPercentage);
      const gradePoints = subjectResults.map((s: any) => s.gradePoint);
      const cgpa = calculateCgpa(gradePoints);

      const passFail = overallPercentage >= passPercentage ? "pass" : "fail";

      // Delete existing result for this student + session
      const existing = await ctx.db
        .query("examResults")
        .filter((q: any) => q.and(q.eq(q.field("examSessionId"), args.examSessionId), q.eq(q.field("studentId"), studentId)))
        .first();
      if (existing) await ctx.db.delete(existing._id);

      const resultId = await ctx.db.insert("examResults", {
        examSessionId: args.examSessionId, studentId,
        totalMarks: totalMax, marksObtained: totalObtained,
        percentage: overallPercentage, cgpa, grade,
        division: division as any, passFail: passFail as any,
        subjectResults: JSON.stringify(subjectResults),
        calculatedAt: now, createdAt: now, updatedAt: now,
      });
      resultIds.push(resultId);

      // Generate report card
      const reportData = {
        studentId: studentId.toString(), examSessionId: args.examSessionId.toString(),
        totalMarks: totalMax, marksObtained: totalObtained,
        percentage: overallPercentage, cgpa, grade,
        division, passFail, subjects: subjectResults, calculatedAt: now,
      };

      const existingReport = await ctx.db
        .query("examReportCards")
        .filter((q: any) => q.and(q.eq(q.field("examSessionId"), args.examSessionId), q.eq(q.field("studentId"), studentId)))
        .first();
      if (existingReport) {
        await ctx.db.patch(existingReport._id, { resultId, reportData: JSON.stringify(reportData), generatedAt: now, updatedAt: now });
      } else {
        await ctx.db.insert("examReportCards", {
          examSessionId: args.examSessionId, studentId, resultId,
          reportData: JSON.stringify(reportData), generatedAt: now, downloadCount: 0, createdAt: now, updatedAt: now,
        });
      }
    }

    // Calculate ranks after all results are stored
    await calculateAndSetRanks(ctx, args.examSessionId);

    await ctx.db.insert("examTimeline", {
      examSessionId: args.examSessionId, eventType: "result_calculated",
      description: `Results calculated for ${resultIds.length} students`,
      userId: ctx.__performerUserId as any, createdAt: now,
    });

    return { resultCount: resultIds.length, message: `Results calculated for ${resultIds.length} students` };
  }),
});

// ═══════════════════════════════════════════════════════════════════
// RANK CALCULATION
// ═══════════════════════════════════════════════════════════════════

async function calculateAndSetRanks(ctx: any, examSessionId: Id<"examSessions">) {
  const results = await ctx.db
    .query("examResults").filter((q: any) => q.eq(q.field("examSessionId"), examSessionId)).collect();

  // Sort by percentage descending, then by marksObtained descending for tie-breaking
  const sorted = results.sort((a: any, b: any) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage;
    return b.marksObtained - a.marksObtained;
  });

  // Assign ranks (handle ties: same percentage = same rank)
  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].percentage < sorted[i - 1].percentage) {
      currentRank = i + 1;
    }
    await ctx.db.patch(sorted[i]._id, { rank: currentRank, updatedAt: Date.now() });
  }
}

export const calculateRanks = mutation({
  args: { token: v.optional(v.string()), examSessionId: v.id("examSessions") },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "resultEngine" }, async (ctx, args) => {
    await calculateAndSetRanks(ctx, args.examSessionId);
    await ctx.db.insert("examTimeline", {
      examSessionId: args.examSessionId, eventType: "ranks_calculated",
      description: "Ranks calculated", createdAt: Date.now(),
    });
    return { success: true };
  }),
});

export const getTopPerformers = query({
  args: { examSessionId: v.id("examSessions"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const results = await ctx.db
      .query("examResults")
      .filter((q) => q.and(q.eq(q.field("examSessionId"), args.examSessionId), q.eq(q.field("passFail"), "pass")))
      .collect();

    const sorted = results.sort((a, b) => (a.rank || 999) - (b.rank || 999)).slice(0, limit);

    return await Promise.all(
      sorted.map(async (r) => {
        const person = await ctx.db.get(r.studentId);
        return { ...r, studentName: person ? `${person.firstName} ${person.lastName || ""}`.trim() : "Unknown" };
      }),
    );
  },
});

// ═══════════════════════════════════════════════════════════════════
// PUBLISH RESULTS
// ═══════════════════════════════════════════════════════════════════

export const publishResults = mutation({
  args: { token: v.optional(v.string()), examSessionId: v.id("examSessions") },
  handler: withScopeAndEvents({ operation: "create", module: "academic", entity: "resultEngine" }, async (ctx, args) => {
    const identity = ctx.__performerUserId;
    if (!identity) throw new Error("Not authenticated");
    const now = Date.now();

    const results = await ctx.db
      .query("examResults").filter((q: any) => q.eq(q.field("examSessionId"), args.examSessionId)).collect();
    for (const result of results) {
      await ctx.db.patch(result._id, { publishedAt: now, publishedBy: ctx.__performerUserId as any, updatedAt: now });
    }

    await ctx.db.patch(args.examSessionId, { status: "published", updatedAt: now });
    await ctx.db.insert("examTimeline", {
      examSessionId: args.examSessionId, eventType: "result_published",
      description: `Results published for ${results.length} students`,
      userId: ctx.__performerUserId as any, createdAt: now,
    });
    await ctx.db.insert("examPublishLog", {
      examSessionId: args.examSessionId, action: "published",
      performedBy: ctx.__performerUserId as any, createdAt: now,
    });

    return { publishedCount: results.length, message: `Results published for ${results.length} students` };
  }),
});

// ═══════════════════════════════════════════════════════════════════
// REPORT CARDS
// ═══════════════════════════════════════════════════════════════════

export const getStudentResultCard = query({
  args: { examSessionId: v.id("examSessions"), studentId: v.id("personMaster") },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("examResults")
      .filter((q) => q.and(q.eq(q.field("examSessionId"), args.examSessionId), q.eq(q.field("studentId"), args.studentId)))
      .first();
    if (!result) return null;

    const reportCard = await ctx.db
      .query("examReportCards")
      .filter((q) => q.and(q.eq(q.field("examSessionId"), args.examSessionId), q.eq(q.field("studentId"), args.studentId)))
      .first();

    const person = await ctx.db.get(args.studentId);
    return {
      result,
      reportCard,
      studentName: person ? `${person.firstName} ${person.lastName || ""}`.trim() : "Unknown",
    };
  },
});

export const trackReportDownload = mutation({
  args: { token: v.optional(v.string()), reportCardId: v.id("examReportCards") },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "resultEngine" }, async (ctx, args) => {
    const identity = ctx.__performerUserId;
    if (!identity) throw new Error("Not authenticated");

    const report = await ctx.db.get(args.reportCardId);
    if (!report) throw new Error("Report card not found");

    await ctx.db.patch(args.reportCardId, {
      downloadedAt: Date.now(), downloadCount: (report.downloadCount || 0) + 1, updatedAt: Date.now(),
    });
    await ctx.db.insert("examTimeline", {
      examSessionId: report.examSessionId, eventType: "report_downloaded",
      description: "Report card downloaded", userId: ctx.__performerUserId as any, createdAt: Date.now(),
    });
    return args.reportCardId;
  }),
});

// ═══════════════════════════════════════════════════════════════════
// STUDENT PORTAL
// ═══════════════════════════════════════════════════════════════════

export const getStudentPortalResults = query({
  args: {
    personId: v.id("personMaster"),
    academicSessionId: v.optional(v.id("academicSessions")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("examResults")
      .filter((q) => q.eq(q.field("studentId"), args.personId))
      .collect();
    const published = results.filter((r) => r.publishedAt);

    // Enrich with exam session names
    const enriched = await Promise.all(
      published.slice(0, args.limit || 20).map(async (r) => {
        const session = await ctx.db.get(r.examSessionId);
        const reportCard = await ctx.db
          .query("examReportCards")
          .filter((q) => q.and(q.eq(q.field("examSessionId"), r.examSessionId), q.eq(q.field("studentId"), args.personId)))
          .first();
        return {
          ...r,
          sessionName: session?.name || "Unknown",
          reportCardId: reportCard?._id,
          subjectResults: r.subjectResults ? JSON.parse(r.subjectResults) : [],
        };
      }),
    );

    return enriched.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));
  },
});

export const getStudentUpcomingExams = query({
  args: { batchId: v.id("academicBatches"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sessions = await ctx.db.query("examSessions")
      .filter((q) => q.and(
        q.eq(q.field("batchId"), args.batchId),
        q.gte(q.field("startDate"), now),
        q.neq(q.field("status"), "archived"),
      ))
      .order("asc")
      .take(args.limit || 10);

    // Get timetable for each session
    return await Promise.all(
      sessions.map(async (s) => {
        const timetable = await ctx.db
          .query("examTimetable").filter((q) => q.eq(q.field("examSessionId"), s._id)).order("asc").collect();
        const template = await ctx.db.get(s.templateId);
        return { session: s, timetable, templateName: template?.name || "Unknown" };
      }),
    );
  },
});

// ═══════════════════════════════════════════════════════════════════
// PARENT PORTAL
// ═══════════════════════════════════════════════════════════════════

export const getParentPortalResults = query({
  args: {
    studentPersonId: v.id("personMaster"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("examResults")
      .filter((q) => q.and(
        q.eq(q.field("studentId"), args.studentPersonId),
        q.neq(q.field("publishedAt"), undefined),
      ))
      .collect();

    const enriched = await Promise.all(
      results.slice(0, args.limit || 10).map(async (r) => {
        const session = await ctx.db.get(r.examSessionId);
        const reportCard = await ctx.db
          .query("examReportCards")
          .filter((q) => q.and(q.eq(q.field("examSessionId"), r.examSessionId), q.eq(q.field("studentId"), args.studentPersonId)))
          .first();
        return {
          ...r, sessionName: session?.name || "Unknown",
          sessionStatus: session?.status,
          reportCardId: reportCard?._id,
          subjectResults: r.subjectResults ? JSON.parse(r.subjectResults) : [],
        };
      }),
    );

    return enriched.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));
  },
});

export const getParentPortalPerformance = query({
  args: { studentPersonId: v.id("personMaster") },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("examResults")
      .filter((q) => q.eq(q.field("studentId"), args.studentPersonId))
      .collect();
    const published = results.filter((r) => r.publishedAt);

    if (published.length === 0) return null;

    const latest = published.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0))[0];
    const allPercentages = published.map((r) => r.percentage);
    const avgPct = Math.round(allPercentages.reduce((a, b) => a + b, 0) / allPercentages.length * 100) / 100;

    return {
      totalExams: published.length,
      latestExam: {
        sessionId: latest.examSessionId,
        percentage: latest.percentage,
        grade: latest.grade,
        rank: latest.rank,
        division: latest.division,
      },
      averagePercentage: avgPct,
      bestPercentage: Math.max(...allPercentages),
    };
  },
});
