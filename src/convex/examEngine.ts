import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { withEventPipeline, entityIdFromResult, entityIdFromArg, userIdFromArg } from "@/platform/eventPipeline";

// ═══════════════════════════════════════════════════════════════════
// EXAM TEMPLATES
// ═══════════════════════════════════════════════════════════════════

export const listExamTemplates = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      return await ctx.db
        .query("examTemplates")
        .filter((q) => q.eq(q.field("isActive"), true))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("examTemplates").order("desc").collect();
  },
});

export const getExamTemplate = query({
  args: { id: v.id("examTemplates") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const createExamTemplate = mutation({
  args: {
    name: v.string(), code: v.string(),
    examType: v.union(v.literal("unit_test"), v.literal("weekly_test"), v.literal("monthly_test"), v.literal("mid_term"), v.literal("final_exam"), v.literal("practical"), v.literal("viva"), v.literal("mock_test"), v.literal("custom")),
    description: v.optional(v.string()), duration: v.optional(v.number()),
    maxMarks: v.number(), passPercentage: v.number(), weightage: v.optional(v.number()),
    gradeScheme: v.optional(v.string()),
  },
  handler: withEventPipeline(
    { module: "exam", entity: "template", action: "create", getEntityId: entityIdFromResult(), title: "Exam template created" },
    async (ctx, args) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Not authenticated");
      const now = Date.now();
      return await ctx.db.insert("examTemplates", {
        ...args, isActive: true, createdBy: identity.subject as any, createdAt: now, updatedAt: now,
      });
    },
  ),
});

export const updateExamTemplate = mutation({
  args: {
    id: v.id("examTemplates"), name: v.optional(v.string()), description: v.optional(v.string()),
    duration: v.optional(v.number()), maxMarks: v.optional(v.number()),
    passPercentage: v.optional(v.number()), weightage: v.optional(v.number()),
    gradeScheme: v.optional(v.string()), isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
    return id;
  },
});

// ═══════════════════════════════════════════════════════════════════
// EXAM SESSIONS
// ═══════════════════════════════════════════════════════════════════

export const listExamSessions = query({
  args: {
    status: v.optional(v.string()), branchId: v.optional(v.id("orgBranches")),
    academicSessionId: v.optional(v.id("academicSessions")), courseId: v.optional(v.id("courses")),
    batchId: v.optional(v.id("academicBatches")), coordinatorId: v.optional(v.id("users")),
    fromDate: v.optional(v.number()), toDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("examSessions");
    if (args.status) q = q.filter((eq) => eq.eq(eq.field("status"), args.status));
    if (args.branchId) q = q.filter((eq) => eq.eq(eq.field("branchId"), args.branchId));
    if (args.academicSessionId) q = q.filter((eq) => eq.eq(eq.field("academicSessionId"), args.academicSessionId));
    if (args.courseId) q = q.filter((eq) => eq.eq(eq.field("courseId"), args.courseId));
    if (args.batchId) q = q.filter((eq) => eq.eq(eq.field("batchId"), args.batchId));
    if (args.coordinatorId) q = q.filter((eq) => eq.eq(eq.field("coordinatorId"), args.coordinatorId));
    const all = await q.order("desc").collect();
    let filtered = all;
    if (args.fromDate) filtered = filtered.filter((s) => s.startDate >= args.fromDate!);
    if (args.toDate) filtered = filtered.filter((s) => s.startDate <= args.toDate!);
    return filtered.slice(0, args.limit || 100);
  },
});

export const getExamSession = query({
  args: { id: v.id("examSessions") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const getExamSessionDetail = query({
  args: { id: v.id("examSessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) return null;

    const [template, subjects, timetable, marks, results, timeline, publishLogs] = await Promise.all([
      ctx.db.get(session.templateId),
      ctx.db.query("examSubjects").filter((q) => q.eq(q.field("examSessionId"), args.id)).collect(),
      ctx.db.query("examTimetable").filter((q) => q.eq(q.field("examSessionId"), args.id)).order("asc").collect(),
      ctx.db.query("examMarks").filter((q) => q.eq(q.field("examSessionId"), args.id)).collect(),
      ctx.db.query("examResults").filter((q) => q.eq(q.field("examSessionId"), args.id)).collect(),
      ctx.db.query("examTimeline").filter((q) => q.eq(q.field("examSessionId"), args.id)).order("desc").take(50),
      ctx.db.query("examPublishLog").filter((q) => q.eq(q.field("examSessionId"), args.id)).order("desc").collect(),
    ]);

    const marksSubmitted = marks.length;
    const resultsCalculated = results.length;
    const passed = results.filter((r) => r.passFail === "pass").length;
    const passPercent = results.length > 0 ? Math.round((passed / results.length) * 100) : 0;

    return {
      session,
      template,
      subjects,
      timetable,
      timeline,
      publishLogs,
      stats: {
        totalSubjects: subjects.length,
        totalTimetable: timetable.length,
        marksSubmitted,
        resultsCalculated,
        passed,
        passPercent,
      },
    };
  },
});

export const createExamSession = mutation({
  args: {
    templateId: v.id("examTemplates"), academicSessionId: v.id("academicSessions"),
    branchId: v.id("orgBranches"), courseId: v.optional(v.id("courses")),
    batchId: v.optional(v.id("academicBatches")), sectionId: v.optional(v.id("academicSections")),
    programId: v.optional(v.id("academicPrograms")), semesterId: v.optional(v.id("academicSemesters")),
    termId: v.optional(v.id("academicTerms")), name: v.string(),
    startDate: v.number(), endDate: v.optional(v.number()),
    coordinatorId: v.optional(v.id("users")), totalStudents: v.optional(v.number()),
    instructions: v.optional(v.string()), metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const now = Date.now();
    const id = await ctx.db.insert("examSessions", { ...args, status: "draft", createdAt: now, updatedAt: now });

    await ctx.db.insert("examTimeline", {
      examSessionId: id, eventType: "exam_created",
      description: `Exam session "${args.name}" created`, userId: identity.subject as any, createdAt: now,
    });
    await ctx.db.insert("examPublishLog", {
      examSessionId: id, action: "draft", performedBy: identity.subject as any, createdAt: now,
    });
    return id;
  },
});

export const updateExamSessionStatus = mutation({
  args: {
    id: v.id("examSessions"),
    status: v.union(v.literal("draft"), v.literal("scheduled"), v.literal("in_progress"), v.literal("completed"), v.literal("published"), v.literal("archived")),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const { id, remarks, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });

    await ctx.db.insert("examPublishLog", {
      examSessionId: id, action: args.status, performedBy: identity.subject as any, remarks, createdAt: Date.now(),
    });
    await ctx.db.insert("examTimeline", {
      examSessionId: id, eventType: `session_${args.status}`,
      description: `Session status changed to ${args.status}`, userId: identity.subject as any, createdAt: Date.now(),
    });
    return id;
  },
});

// ═══════════════════════════════════════════════════════════════════
// EXAM SUBJECTS
// ═══════════════════════════════════════════════════════════════════

export const listExamSubjects = query({
  args: { examSessionId: v.id("examSessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("examSubjects")
      .filter((q) => q.eq(q.field("examSessionId"), args.examSessionId))
      .collect();
  },
});

export const addExamSubject = mutation({
  args: {
    examSessionId: v.id("examSessions"), subjectId: v.id("academicSubjects"),
    maxMarks: v.number(), passPercentage: v.optional(v.number()),
    weightage: v.optional(v.number()), examDate: v.optional(v.number()),
    duration: v.optional(v.number()), isCompulsory: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("examSubjects", { ...args, createdAt: now, updatedAt: now });
  },
});

export const removeExamSubject = mutation({
  args: { id: v.id("examSubjects") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ═══════════════════════════════════════════════════════════════════
// EXAM TIMETABLE
// ═══════════════════════════════════════════════════════════════════

export const listExamTimetable = query({
  args: { examSessionId: v.id("examSessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("examTimetable")
      .filter((q) => q.eq(q.field("examSessionId"), args.examSessionId))
      .order("asc")
      .collect();
  },
});

export const createTimetableEntry = mutation({
  args: {
    examSessionId: v.id("examSessions"), subjectId: v.id("examSubjects"),
    facultyId: v.optional(v.id("users")), roomId: v.optional(v.id("academicClassrooms")),
    examDate: v.number(), startTime: v.number(), endTime: v.number(),
    duration: v.optional(v.number()), maxMarks: v.number(),
    passPercentage: v.optional(v.number()), instructions: v.optional(v.string()),
    hallCapacity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("examTimetable", { ...args, createdAt: now, updatedAt: now });

    await ctx.db.insert("examTimeline", {
      examSessionId: args.examSessionId, eventType: "timetable_updated",
      description: "Timetable entry added", createdAt: now,
    });
    return id;
  },
});

export const updateTimetableEntry = mutation({
  args: {
    id: v.id("examTimetable"), facultyId: v.optional(v.id("users")),
    roomId: v.optional(v.id("academicClassrooms")), examDate: v.optional(v.number()),
    startTime: v.optional(v.number()), endTime: v.optional(v.number()),
    duration: v.optional(v.number()), instructions: v.optional(v.string()),
    hallCapacity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
    return id;
  },
});

export const deleteTimetableEntry = mutation({
  args: { id: v.id("examTimetable") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ═══════════════════════════════════════════════════════════════════
// HALL ALLOCATION
// ═══════════════════════════════════════════════════════════════════

export const listHallAllocations = query({
  args: {
    examSessionId: v.id("examSessions"), timetableId: v.optional(v.id("examTimetable")),
    roomId: v.optional(v.id("academicClassrooms")),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("examHallAllocation").filter((eq) => eq.eq(eq.field("examSessionId"), args.examSessionId));
    if (args.timetableId) q = q.filter((eq) => eq.eq(eq.field("timetableId"), args.timetableId));
    if (args.roomId) q = q.filter((eq) => eq.eq(eq.field("roomId"), args.roomId));
    return await q.collect();
  },
});

export const allocateSeat = mutation({
  args: {
    timetableId: v.id("examTimetable"), examSessionId: v.id("examSessions"),
    roomId: v.id("academicClassrooms"), studentId: v.id("personMaster"),
    seatNumber: v.optional(v.string()), benchNumber: v.optional(v.string()),
    column: v.optional(v.number()), row: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if already allocated
    const existing = await ctx.db
      .query("examHallAllocation")
      .filter((q) => q.and(
        q.eq(q.field("examSessionId"), args.examSessionId),
        q.eq(q.field("studentId"), args.studentId),
        q.eq(q.field("timetableId"), args.timetableId),
      ))
      .first();
    if (existing) return existing._id;

    const now = Date.now();
    return await ctx.db.insert("examHallAllocation", { ...args, createdAt: now, updatedAt: now });
  },
});

export const bulkAllocateSeats = mutation({
  args: {
    timetableId: v.id("examTimetable"), examSessionId: v.id("examSessions"),
    roomId: v.id("academicClassrooms"),
    allocations: v.array(v.object({
      studentId: v.id("personMaster"), seatNumber: v.optional(v.string()),
      benchNumber: v.optional(v.string()), column: v.optional(v.number()), row: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const results: Id<"examHallAllocation">[] = [];
    for (const a of args.allocations) {
      const existing = await ctx.db
        .query("examHallAllocation")
        .filter((q) => q.and(
          q.eq(q.field("examSessionId"), args.examSessionId),
          q.eq(q.field("studentId"), a.studentId),
          q.eq(q.field("timetableId"), args.timetableId),
        ))
        .first();
      if (!existing) {
        const id = await ctx.db.insert("examHallAllocation", {
          timetableId: args.timetableId, examSessionId: args.examSessionId,
          roomId: args.roomId, ...a, createdAt: now, updatedAt: now,
        });
        results.push(id);
      }
    }
    return { allocated: results.length };
  },
});

export const removeSeatAllocation = mutation({
  args: { id: v.id("examHallAllocation") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const getSeatPlan = query({
  args: { timetableId: v.id("examTimetable") },
  handler: async (ctx, args) => {
    const timetable = await ctx.db.get(args.timetableId);
    if (!timetable) return null;

    const allocations = await ctx.db
      .query("examHallAllocation")
      .filter((q) => q.eq(q.field("timetableId"), args.timetableId))
      .collect();

    // Enrich with student names
    const enriched = await Promise.all(
      allocations.map(async (a) => {
        const person = await ctx.db.get(a.studentId);
        return {
          ...a,
          studentName: person ? `${person.firstName} ${person.lastName || ""}`.trim() : "Unknown",
        };
      }),
    );

    return { timetable, allocations: enriched };
  },
});

// ═══════════════════════════════════════════════════════════════════
// GRADE RULES
// ═══════════════════════════════════════════════════════════════════

export const listGradeRules = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      return await ctx.db.query("examGradeRules").filter((q) => q.eq(q.field("isActive"), true)).collect();
    }
    return await ctx.db.query("examGradeRules").collect();
  },
});

export const getGradeRule = query({
  args: { id: v.id("examGradeRules") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const getDefaultGradeRules = query({
  handler: async (ctx) => {
    return getDefaultGradeRulesData();
  },
});

export const createGradeRules = mutation({
  args: {
    name: v.string(), code: v.string(), description: v.optional(v.string()),
    rules: v.string(), defaultPassPercentage: v.number(),
    applicableTo: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("examGradeRules", { ...args, isActive: true, createdAt: now, updatedAt: now });
  },
});

export const updateGradeRules = mutation({
  args: {
    id: v.id("examGradeRules"), name: v.optional(v.string()),
    description: v.optional(v.string()), rules: v.optional(v.string()),
    defaultPassPercentage: v.optional(v.number()), isActive: v.optional(v.boolean()),
    applicableTo: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
    return id;
  },
});

export const deleteGradeRules = mutation({
  args: { id: v.id("examGradeRules") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ═══════════════════════════════════════════════════════════════════
// INVIGILATORS
// ═══════════════════════════════════════════════════════════════════

export const listInvigilators = query({
  args: { timetableId: v.id("examTimetable") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("examInvigilators")
      .filter((q) => q.eq(q.field("timetableId"), args.timetableId))
      .collect();
  },
});

export const assignInvigilator = mutation({
  args: {
    timetableId: v.id("examTimetable"), invigilatorId: v.id("users"),
    role: v.union(v.literal("chief"), v.literal("assistant"), v.literal("alternate")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("examInvigilators", { ...args, assignedAt: now, createdAt: now });
  },
});

export const removeInvigilator = mutation({
  args: { id: v.id("examInvigilators") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ═══════════════════════════════════════════════════════════════════
// EXAM TIMELINE
// ═══════════════════════════════════════════════════════════════════

export const getExamTimeline = query({
  args: { examSessionId: v.id("examSessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("examTimeline")
      .filter((q) => q.eq(q.field("examSessionId"), args.examSessionId))
      .order("desc")
      .collect();
  },
});

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD & ANALYTICS
// ═══════════════════════════════════════════════════════════════════

export const getExamDashboardStats = query({
  args: { branchId: v.optional(v.id("orgBranches")) },
  handler: async (ctx, args) => {
    let sessions = ctx.db.query("examSessions");
    if (args.branchId) sessions = sessions.filter((q) => q.eq(q.field("branchId"), args.branchId));
    const allSessions = await sessions.collect();

    const now = Date.now();
    const upcoming = allSessions.filter((s) => s.status === "scheduled" || s.status === "draft");
    const inProgress = allSessions.filter((s) => s.status === "in_progress");
    const completed = allSessions.filter((s) => s.status === "completed");
    const published = allSessions.filter((s) => s.status === "published");

    return {
      totalSessions: allSessions.length,
      upcoming: upcoming.length,
      inProgress: inProgress.length,
      completed: completed.length,
      published: published.length,
      draft: allSessions.filter((s) => s.status === "draft").length,
      sessionsThisMonth: allSessions.filter((s) => s.startDate >= now - 30 * 24 * 3600 * 1000).length,
    };
  },
});

export const getUpcomingExams = query({
  args: {
    branchId: v.optional(v.id("orgBranches")), batchId: v.optional(v.id("academicBatches")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let sessions = await ctx.db.query("examSessions").filter((q) =>
      q.and(
        q.neq(q.field("status"), "archived"),
        q.gte(q.field("startDate"), now),
      ),
    ).order("asc").take(args.limit || 20);

    if (args.branchId) sessions = sessions.filter((s) => s.branchId === args.branchId);
    if (args.batchId) sessions = sessions.filter((s) => s.batchId === args.batchId);

    return sessions;
  },
});

export const getPendingMarksSessions = query({
  args: { branchId: v.optional(v.id("orgBranches")), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const allSessions = await ctx.db.query("examSessions")
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    let filtered = allSessions;
    if (args.branchId) filtered = filtered.filter((s) => s.branchId === args.branchId);

    // Check which sessions have pending marks
    const sessionsWithPending: Array<{ session: Doc<"examSessions">; pendingSubjects: number }> = [];
    for (const session of filtered.slice(0, args.limit || 10)) {
      const subjects = await ctx.db.query("examSubjects")
        .filter((q) => q.eq(q.field("examSessionId"), session._id)).collect();
      const marks = await ctx.db.query("examMarks")
        .filter((q) => q.eq(q.field("examSessionId"), session._id)).collect();
      const uniqueSubjectsWithMarks = new Set(marks.map((m) => m.examSubjectId?.toString()));
      const pending = subjects.length - uniqueSubjectsWithMarks.size;
      if (pending > 0) sessionsWithPending.push({ session, pendingSubjects: pending });
    }

    return sessionsWithPending;
  },
});

/**
 * Get default grade rules data (used when no custom rules are configured).
 */
export function getDefaultGradeRulesData() {
  return {
    name: "Standard Grade Scheme",
    code: "STANDARD",
    defaultPassPercentage: 33,
    rules: [
      { minPct: 90, maxPct: 100, grade: "A+", gradePoint: 10, division: "distinction" },
      { minPct: 80, maxPct: 89, grade: "A", gradePoint: 9, division: "distinction" },
      { minPct: 70, maxPct: 79, grade: "B+", gradePoint: 8, division: "first" },
      { minPct: 60, maxPct: 69, grade: "B", gradePoint: 7, division: "first" },
      { minPct: 50, maxPct: 59, grade: "C+", gradePoint: 6, division: "second" },
      { minPct: 40, maxPct: 49, grade: "C", gradePoint: 5, division: "third" },
      { minPct: 33, maxPct: 39, grade: "D", gradePoint: 4, division: "third" },
      { minPct: 0, maxPct: 32, grade: "F", gradePoint: 0, division: "fail" },
    ],
  };
}
