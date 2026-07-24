import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── ASSIGNMENTS ─────────────────────────────────────

export const createAssignment = mutation({
  args: {
    lessonId: v.id("lmsLessons"),
    courseId: v.id("lmsCourses"),
    title: v.string(),
    description: v.string(),
    maxScore: v.number(),
    passingScore: v.number(),
    dueDate: v.optional(v.number()),
    attachmentUrl: v.optional(v.string()),
    instructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db.insert("lmsAssignments", {
      ...args,
      status: "draft",
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const publishAssignment = mutation({
  args: { id: v.id("lmsAssignments") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "published", updatedAt: Date.now() });
    return args.id;
  },
});

export const listAssignments = query({
  args: {
    courseId: v.id("lmsCourses"),
    lessonId: v.optional(v.id("lmsLessons")),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("lmsAssignments")
      .withIndex("courseId", (q: any) => q.eq("courseId", args.courseId));

    let assignments = await query.collect();

    if (args.lessonId) {
      assignments = assignments.filter((a: any) => a.lessonId === args.lessonId);
    }

    return assignments;
  },
});

// ─── EVALUATION ──────────────────────────────────────

export const evaluateSubmission = mutation({
  args: {
    submissionId: v.id("lmsSubmissions"),
    score: v.number(),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");

    const assignment = await ctx.db.get((submission as any).assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    const maxScore = (assignment as any).maxScore;
    const percentage = maxScore > 0 ? Math.round((args.score / maxScore) * 100) : 0;
    const passed = percentage >= (assignment as any).passingScore;
    const status = passed ? "passed" : "failed";

    await ctx.db.patch(args.submissionId, {
      score: args.score,
      percentage,
      feedback: args.feedback,
      evaluatedBy: userId,
      evaluatedAt: Date.now(),
      status,
      updatedAt: Date.now(),
    });

    return args.submissionId;
  },
});

export const listSubmissions = query({
  args: {
    assignmentId: v.id("lmsAssignments"),
    status: v.optional(v.union(
      v.literal("submitted"), v.literal("evaluated"),
      v.literal("resubmitted"), v.literal("passed"), v.literal("failed"),
    )),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("lmsSubmissions")
      .withIndex("assignmentId", (q: any) => q.eq("assignmentId", args.assignmentId));

    if (args.status) {
      query = query.filter((q: any) => q.eq(q.field("status"), args.status));
    }

    const submissions = await query.collect();

    // Enrich with student names
    const enriched = await Promise.all(submissions.map(async (s: any) => {
      const student = await ctx.db.get(s.studentId);
      return {
        ...s,
        studentName: student ? `${(student as any).firstName} ${(student as any).lastName}` : "Unknown",
      };
    }));

    return enriched;
  },
});

// ─── QUIZZES ─────────────────────────────────────────

export const createQuiz = mutation({
  args: {
    lessonId: v.id("lmsLessons"),
    courseId: v.id("lmsCourses"),
    title: v.string(),
    description: v.optional(v.string()),
    passingPercentage: v.number(),
    maxAttempts: v.optional(v.number()),
    timeLimit: v.optional(v.number()),
    shuffleQuestions: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db.insert("lmsQuizzes", {
      ...args,
      status: "draft",
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const addQuizQuestion = mutation({
  args: {
    quizId: v.id("lmsQuizzes"),
    question: v.string(),
    questionType: v.union(
      v.literal("multiple_choice"), v.literal("true_false"),
      v.literal("short_answer"), v.literal("essay"),
    ),
    options: v.optional(v.array(v.string())),
    correctAnswer: v.optional(v.string()),
    points: v.number(),
    orderIndex: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("lmsQuizQuestions", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const publishQuiz = mutation({
  args: { id: v.id("lmsQuizzes") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "published", updatedAt: Date.now() });
    return args.id;
  },
});

export const getQuizWithQuestions = query({
  args: { id: v.id("lmsQuizzes") },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.id);
    if (!quiz) return null;

    const questions = await ctx.db.query("lmsQuizQuestions")
      .withIndex("quizId_orderIndex", (q: any) => q.eq("quizId", args.id))
      .collect();

    return { ...quiz, questions };
  },
});

export const listQuizzes = query({
  args: {
    courseId: v.id("lmsCourses"),
    lessonId: v.optional(v.id("lmsLessons")),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("lmsQuizzes")
      .withIndex("courseId", (q: any) => q.eq("courseId", args.courseId));

    let quizzes = await query.collect();

    if (args.lessonId) {
      quizzes = quizzes.filter((q: any) => q.lessonId === args.lessonId);
    }

    return quizzes;
  },
});

// ─── FACULTY DASHBOARD ───────────────────────────────

export const getFacultyDashboard = query({
  args: { facultyId: v.id("users") },
  handler: async (ctx, args) => {
    const courses = await ctx.db.query("lmsCourses")
      .filter((q: any) => q.eq(q.field("instructorId"), args.facultyId))
      .collect();

    const courseIds = courses.map((c: any) => c._id);

    // Pending evaluations
    const assignments = await ctx.db.query("lmsAssignments").collect();
    const courseAssignments = assignments.filter((a: any) => courseIds.includes(a.courseId));
    const assignmentIds = courseAssignments.map((a: any) => a._id);

    let pendingEval = 0;
    for (const aid of assignmentIds) {
      const subs = await ctx.db.query("lmsSubmissions")
        .withIndex("assignmentId", (q: any) => q.eq("assignmentId", aid))
        .filter((q: any) => q.neq(q.field("status"), "passed"))
        .filter((q: any) => q.neq(q.field("status"), "failed"))
        .collect();
      pendingEval += subs.length;
    }

    const totalStudents = courses.reduce((s: number, c: any) => s + (c.enrolledCount || 0), 0);

    return {
      totalCourses: courses.length,
      publishedCourses: courses.filter((c: any) => c.status === "published").length,
      draftCourses: courses.filter((c: any) => c.status === "draft").length,
      totalStudents,
      pendingEvaluations: pendingEval,
      totalAssignments: courseAssignments.filter((a: any) => a.status === "published").length,
    };
  },
});
