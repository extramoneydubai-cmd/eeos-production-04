import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ─── QUERIES ──────────────────────────────────────────────────────

export const listExamTemplates = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
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
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listExamSessions = query({
  args: {
    status: v.optional(v.string()),
    branchId: v.optional(v.id("orgBranches")),
    academicSessionId: v.optional(v.id("academicSessions")),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("examSessions");
    if (args.status) {
      q = q.filter((eq) => eq.eq(eq.field("status"), args.status));
    }
    if (args.branchId) {
      q = q.filter((eq) => eq.eq(eq.field("branchId"), args.branchId));
    }
    if (args.academicSessionId) {
      q = q.filter((eq) =>
        eq.eq(eq.field("academicSessionId"), args.academicSessionId),
      );
    }
    return await q.order("desc").collect();
  },
});

export const getExamSession = query({
  args: { id: v.id("examSessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

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

export const listExamSubjects = query({
  args: { examSessionId: v.id("examSessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("examSubjects")
      .filter((q) => q.eq(q.field("examSessionId"), args.examSessionId))
      .collect();
  },
});

export const listInvigilators = query({
  args: { timetableId: v.id("examTimetable") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("examInvigilators")
      .filter((q) => q.eq(q.field("timetableId"), args.timetableId))
      .collect();
  },
});

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

export const getExamDashboardStats = query({
  args: { branchId: v.optional(v.id("orgBranches")) },
  handler: async (ctx, args) => {
    let sessions = ctx.db.query("examSessions");
    if (args.branchId) {
      sessions = sessions.filter((q) =>
        q.eq(q.field("branchId"), args.branchId),
      );
    }
    const allSessions = await sessions.collect();

    const upcoming = allSessions.filter(
      (s) => s.status === "scheduled" || s.status === "in_progress",
    ).length;
    const completed = allSessions.filter((s) => s.status === "completed").length;
    const published = allSessions.filter((s) => s.status === "published").length;
    const draft = allSessions.filter((s) => s.status === "draft").length;

    const totalStudents = allSessions.reduce(
      (sum, s) => sum + (s.totalStudents || 0),
      0,
    );

    return {
      totalSessions: allSessions.length,
      upcoming,
      completed,
      published,
      draft,
      totalStudents,
    };
  },
});

// ─── MUTATIONS ────────────────────────────────────────────────────

export const createExamTemplate = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    examType: v.union(
      v.literal("unit_test"),
      v.literal("weekly_test"),
      v.literal("monthly_test"),
      v.literal("mid_term"),
      v.literal("final_exam"),
      v.literal("practical"),
      v.literal("viva"),
      v.literal("mock_test"),
      v.literal("custom"),
    ),
    description: v.optional(v.string()),
    duration: v.optional(v.number()),
    maxMarks: v.number(),
    passPercentage: v.number(),
    weightage: v.optional(v.number()),
    gradeScheme: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const id = await ctx.db.insert("examTemplates", {
      ...args,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

export const updateExamTemplate = mutation({
  args: {
    id: v.id("examTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    duration: v.optional(v.number()),
    maxMarks: v.optional(v.number()),
    passPercentage: v.optional(v.number()),
    weightage: v.optional(v.number()),
    gradeScheme: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
    return id;
  },
});

export const createExamSession = mutation({
  args: {
    templateId: v.id("examTemplates"),
    academicSessionId: v.id("academicSessions"),
    branchId: v.id("orgBranches"),
    courseId: v.optional(v.id("courses")),
    batchId: v.optional(v.id("academicBatches")),
    sectionId: v.optional(v.id("academicSections")),
    programId: v.optional(v.id("academicPrograms")),
    semesterId: v.optional(v.id("academicSemesters")),
    termId: v.optional(v.id("academicTerms")),
    name: v.string(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    coordinatorId: v.optional(v.id("users")),
    totalStudents: v.optional(v.number()),
    instructions: v.optional(v.string()),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const id = await ctx.db.insert("examSessions", {
      ...args,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });

    // Create timeline event
    await ctx.db.insert("examTimeline", {
      examSessionId: id,
      eventType: "exam_created",
      description: `Exam session "${args.name}" created`,
      userId: identity.subject as any,
      createdAt: now,
    });

    return id;
  },
});

export const updateExamSessionStatus = mutation({
  args: {
    id: v.id("examSessions"),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("published"),
      v.literal("archived"),
    ),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const { id, remarks, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });

    const session = await ctx.db.get(id);
    if (session) {
      // Create publish log entry for workflow transitions
      await ctx.db.insert("examPublishLog", {
        examSessionId: id,
        action: args.status as any,
        performedBy: identity.subject as any,
        remarks: remarks,
        createdAt: Date.now(),
      });
    }

    return id;
  },
});

export const createTimetableEntry = mutation({
  args: {
    examSessionId: v.id("examSessions"),
    subjectId: v.id("academicSubjects"),
    facultyId: v.optional(v.id("users")),
    roomId: v.optional(v.id("academicClassrooms")),
    examDate: v.number(),
    startTime: v.number(),
    endTime: v.number(),
    duration: v.optional(v.number()),
    maxMarks: v.number(),
    passPercentage: v.optional(v.number()),
    instructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const id = await ctx.db.insert("examTimetable", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });

    // Create timeline event
    await ctx.db.insert("examTimeline", {
      examSessionId: args.examSessionId,
      eventType: "timetable_updated",
      description: `Timetable entry added for subject`,
      userId: identity.subject as any,
      createdAt: now,
    });

    return id;
  },
});

export const assignInvigilator = mutation({
  args: {
    timetableId: v.id("examTimetable"),
    invigilatorId: v.id("users"),
    role: v.union(v.literal("chief"), v.literal("assistant"), v.literal("alternate")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const id = await ctx.db.insert("examInvigilators", {
      ...args,
      assignedAt: now,
      createdAt: now,
    });
    return id;
  },
});

export const addExamSubject = mutation({
  args: {
    examSessionId: v.id("examSessions"),
    subjectId: v.id("academicSubjects"),
    maxMarks: v.number(),
    passPercentage: v.optional(v.number()),
    weightage: v.optional(v.number()),
    examDate: v.optional(v.number()),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const id = await ctx.db.insert("examSubjects", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

export const completeExamSession = mutation({
  args: { id: v.id("examSessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(args.id, {
      status: "completed",
      updatedAt: Date.now(),
    });

    await ctx.db.insert("examTimeline", {
      examSessionId: args.id,
      eventType: "exam_completed",
      description: "Exam session completed",
      userId: identity.subject as any,
      createdAt: Date.now(),
    });

    return args.id;
  },
});
