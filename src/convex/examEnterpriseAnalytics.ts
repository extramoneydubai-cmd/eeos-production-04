import { v } from "convex/values";
import { query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ═══════════════════════════════════════════════════════════════════
// ENTERPRISE EXAM ANALYTICS (Part 12)
// ═══════════════════════════════════════════════════════════════════

export const getExamKPIs = query({
  args: {
    branchId: v.optional(v.id("orgBranches")),
    companyId: v.optional(v.id("orgCompanies")),
    academicSessionId: v.optional(v.id("academicSessions")),
  },
  handler: async (ctx, args) => {
    let sessions = await ctx.db.query("examSessions").collect();
    if (args.branchId) sessions = sessions.filter((s) => s.branchId === args.branchId);
    if (args.academicSessionId) sessions = sessions.filter((s) => s.academicSessionId === args.academicSessionId);

    const totalSessions = sessions.length;
    const activeSessions = sessions.filter((s) => s.status === "in_progress" || s.status === "scheduled");
    const completed = sessions.filter((s) => s.status === "completed");
    const published = sessions.filter((s) => s.status === "published");

    // Aggregate results from published sessions
    let totalResults = 0;
    let passed = 0;
    let failed = 0;
    let supplementary = 0;

    for (const session of published) {
      const results = await ctx.db
        .query("examResults")
        .filter((q) => q.eq(q.field("examSessionId"), session._id))
        .collect();
      totalResults += results.length;
      passed += results.filter((r) => r.passFail === "pass").length;
      failed += results.filter((r) => r.passFail === "fail").length;
      supplementary += results.filter((r) => r.passFail === "supplementary").length;
    }

    const passPercentage = totalResults > 0 ? Math.round((passed / totalResults) * 10000) / 100 : 0;

    // Pending evaluations
    let pendingMarks = 0;
    for (const session of sessions.filter((s) => s.status === "in_progress" || s.status === "completed")) {
      const marks = await ctx.db
        .query("examMarks")
        .filter((q) => q.eq(q.field("examSessionId"), session._id))
        .collect();
      const subjects = await ctx.db
        .query("examSubjects")
        .filter((q) => q.eq(q.field("examSessionId"), session._id))
        .collect();
      const uniqueSubjectsWithMarks = new Set(marks.map((m) => m.examSubjectId?.toString()));
      pendingMarks += subjects.length - uniqueSubjectsWithMarks.size;
    }

    return {
      totalSessions,
      activeSessions: activeSessions.length,
      completedSessions: completed.length,
      publishedSessions: published.length,
      totalResults,
      passed,
      failed,
      supplementary,
      passPercentage,
      pendingMarks,
      averagePassPercentage: passPercentage,
    };
  },
});

export const getSubjectPerformanceAnalytics = query({
  args: { examSessionId: v.id("examSessions") },
  handler: async (ctx, args) => {
    const subjects = await ctx.db
      .query("examSubjects")
      .filter((q) => q.eq(q.field("examSessionId"), args.examSessionId))
      .collect();
    const marks = await ctx.db
      .query("examMarks")
      .filter((q) => q.eq(q.field("examSessionId"), args.examSessionId))
      .collect();
    const results = await ctx.db
      .query("examResults")
      .filter((q) => q.eq(q.field("examSessionId"), args.examSessionId))
      .collect();

    const subjectAnalysis = await Promise.all(
      subjects.map(async (s) => {
        const subjectMarks = marks.filter((m) => m.examSubjectId === s._id && m.attendance === "present");
        const marksValues = subjectMarks.map((m) => Math.min((m.marksObtained ?? 0) + (m.graceMarks ?? 0), m.totalMarks));

        // Get subject name
        let subjectName = s.subjectId;
        try {
          const acadSubj = await ctx.db.get(s.subjectId);
          if (acadSubj) subjectName = (acadSubj as any).name || acadSubj._id;
        } catch { /* ignore */ }

        const avg = marksValues.length > 0 ? Math.round(marksValues.reduce((a, b) => a + b, 0) / marksValues.length * 100) / 100 : 0;
        const highest = marksValues.length > 0 ? Math.max(...marksValues) : 0;
        const lowest = marksValues.length > 0 ? Math.min(...marksValues) : 0;
        const passPct = s.passPercentage ?? 33;
        const passedCount = marksValues.filter((m) => (m / s.maxMarks * 100) >= passPct).length;

        return {
          subjectId: s._id,
          subjectName,
          maxMarks: s.maxMarks,
          avgMarks: avg,
          highestMarks: highest,
          lowestMarks: lowest,
          totalStudents: subjectMarks.length,
          passedCount,
          failCount: subjectMarks.length - passedCount,
          passPercentage: subjectMarks.length > 0
            ? Math.round((passedCount / subjectMarks.length) * 10000) / 100
            : 0,
          weightage: s.weightage,
        };
      }),
    );

    return { subjects: subjectAnalysis, totalSubjects: subjects.length };
  },
});

export const getFacultyPerformanceAnalytics = query({
  args: { examSessionId: v.id("examSessions") },
  handler: async (ctx, args) => {
    const timetable = await ctx.db
      .query("examTimetable")
      .filter((q) => q.eq(q.field("examSessionId"), args.examSessionId))
      .collect();
    const marks = await ctx.db
      .query("examMarks")
      .filter((q) => q.eq(q.field("examSessionId"), args.examSessionId))
      .collect();
    const subjects = await ctx.db
      .query("examSubjects")
      .filter((q) => q.eq(q.field("examSessionId"), args.examSessionId))
      .collect();

    const facultyMap = new Map<string, {
      facultyId: string; facultyName: string;
      subjectsHandled: number; totalStudents: number;
      avgMarks: number; passCount: number;
    }>();

    for (const entry of timetable) {
      if (!entry.facultyId) continue;
      const fId = entry.facultyId;
      if (!facultyMap.has(fId)) {
        let name = "Unknown";
        try {
          const user = await ctx.db.get(fId);
          if (user) name = (user as any).name || user._id;
        } catch { /* ignore */ }
        facultyMap.set(fId, { facultyId: fId, facultyName: name, subjectsHandled: 0, totalStudents: 0, avgMarks: 0, passCount: 0 });
      }

      const f = facultyMap.get(fId)!;
      f.subjectsHandled++;

      const subjMarks = marks.filter((m) => (m.examSubjectId as any) === (entry.subjectId as any) && m.attendance === "present");
      const marksValues = subjMarks.map((m) => Math.min((m.marksObtained ?? 0) + (m.graceMarks ?? 0), m.totalMarks));
      f.totalStudents += marksValues.length;

      const entryPassPct = entry.passPercentage ?? 33;
      f.passCount += marksValues.filter((m) => (m / entry.maxMarks * 100) >= entryPassPct).length;
    }

    const facultyArray = Array.from(facultyMap.values());
    for (const f of facultyArray) {
      f.avgMarks = f.totalStudents > 0 ? Math.round(f.avgMarks / f.totalStudents * 100) / 100 : 0;
    }

    return facultyArray;
  },
});

export const getTrendAnalysis = query({
  args: {
    branchId: v.optional(v.id("orgBranches")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allSessions = await ctx.db.query("examSessions")
      .filter((q) => q.eq(q.field("status"), "published"))
      .order("desc")
      .take(args.limit || 12);

    const sessions = args.branchId
      ? allSessions.filter((s) => s.branchId === args.branchId)
      : allSessions;

    const trends = await Promise.all(
      sessions.map(async (s) => {
        const results = await ctx.db
          .query("examResults")
          .filter((q) => q.eq(q.field("examSessionId"), s._id))
          .collect();
        const passed = results.filter((r) => r.passFail === "pass").length;
        const total = results.length;
        return {
          sessionId: s._id,
          sessionName: s.name,
          startDate: s.startDate,
          totalStudents: total,
          passed,
          passPercentage: total > 0 ? Math.round((passed / total) * 10000) / 100 : 0,
          averagePercentage: total > 0
            ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / total * 100) / 100
            : 0,
        };
      }),
    );

    return trends;
  },
});

export const getBranchComparison = query({
  args: {
    academicSessionId: v.optional(v.id("academicSessions")),
  },
  handler: async (ctx, args) => {
    const allSessions = args.academicSessionId
      ? await ctx.db.query("examSessions")
          .filter((q) => q.eq(q.field("academicSessionId"), args.academicSessionId!))
          .filter((q) => q.eq(q.field("status"), "published"))
          .collect()
      : await ctx.db.query("examSessions")
          .filter((q) => q.eq(q.field("status"), "published"))
          .collect();

    const branchMap = new Map<string, {
      branchId: string; branchName: string;
      examCount: number; totalStudents: number;
      passed: number; totalPercentage: number;
    }>();

    for (const session of allSessions) {
      const bId = session.branchId;
      if (!branchMap.has(bId)) {
        let branchName = "Unknown";
        try {
          const branch = await ctx.db.get(bId);
          if (branch) branchName = (branch as any).name || branch._id;
        } catch { /* ignore */ }
        branchMap.set(bId, { branchId: bId, branchName, examCount: 0, totalStudents: 0, passed: 0, totalPercentage: 0 });
      }

      const b = branchMap.get(bId)!;
      b.examCount++;

      const results = await ctx.db
        .query("examResults")
        .filter((q) => q.eq(q.field("examSessionId"), session._id))
        .collect();

      b.totalStudents += results.length;
      b.passed += results.filter((r) => r.passFail === "pass").length;
      b.totalPercentage += results.length > 0
        ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length
        : 0;
    }

    const branches = Array.from(branchMap.values()).map((b) => ({
      ...b,
      avgPassPercentage: b.examCount > 0 ? Math.round((b.passed / Math.max(b.totalStudents, 1)) * 10000) / 100 : 0,
      avgPercentage: b.examCount > 0 ? Math.round((b.totalPercentage / b.examCount) * 100) / 100 : 0,
    }));

    return branches;
  },
});

export const getWeakStudents = query({
  args: {
    examSessionId: v.id("examSessions"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("examResults")
      .filter((q) => q.and(
        q.eq(q.field("examSessionId"), args.examSessionId),
        q.neq(q.field("passFail"), "pass"),
      ))
      .order("asc")
      .take(args.limit || 20);

    const enriched = await Promise.all(
      results.map(async (r) => {
        const person = await ctx.db.get(r.studentId);
        return {
          ...r,
          studentName: person ? `${person.firstName} ${person.lastName || ""}`.trim() : "Unknown",
        };
      }),
    );

    return enriched;
  },
});

export const getModerationQueue = query({
  args: { examSessionId: v.id("examSessions") },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query("examMarks")
      .filter((q) => q.and(
        q.eq(q.field("examSessionId"), args.examSessionId),
        q.eq(q.field("moderatedBy"), undefined),
      ))
      .collect();

    const enriched = await Promise.all(
      marks.map(async (m) => {
        const person = await ctx.db.get(m.studentId);
        return {
          ...m,
          studentName: person ? `${person.firstName} ${person.lastName || ""}`.trim() : "Unknown",
        };
      }),
    );

    return { total: enriched.length, entries: enriched.slice(0, 100) };
  },
});

export const getGradeDistribution = query({
  args: { examSessionId: v.id("examSessions") },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("examResults")
      .filter((q) => q.eq(q.field("examSessionId"), args.examSessionId))
      .collect();

    const distribution: Record<string, number> = {};
    for (const r of results) {
      const grade = r.grade ?? "unknown";
      distribution[grade] = (distribution[grade] ?? 0) + 1;
    }

    return {
      total: results.length,
      distribution,
      gradeCounts: Object.entries(distribution).map(([grade, count]) => ({ grade, count })),
    };
  },
});
