/**
 * LMS Platform — Enterprise Pipeline Integration
 *
 * All mutations use withScopeAndEvents for complete enterprise adoption:
 *   ✓ ScopeEngine authorization    ✓ Event Pipeline
 *   ✓ Timeline auto-recording     ✓ Auto-document generation
 *   ✓ Notification Matrix routing  ✓ Search indexing
 *   ✓ Dashboard refresh signals    ✓ Workflow + Automation triggers
 *
 * No manual audit/timeline/notification logic in business code.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents, type ScopeAndEventsConfig } from "./withScopeAndEvents";
import { Id } from "./_generated/dataModel";

// ─── Enterprise Handler Factory ───────────────────────────────────────
// Wraps ctx-based auth extraction for withScopeAndEvents integration.
// When a session token is supplied the withScopeAndEvents wrapper resolves
// the REAL performer from the sessions table; getAuthUserId (Convex auth
// headers) only applies to legacy flows.

function withLms<P = any, R = any>(
  operation: ScopeAndEventsConfig<P, R>["operation"],
  entity: string,
  getScope: (args: P) => { companyId?: string; branchId?: string; departmentId?: string },
  handler: (ctx: any, args: P, userId: Id<"users">) => Promise<R>,
) {
  return async (ctx: any, args: P) => {
    const raw = args as any;
    const hasToken = typeof raw?.token === "string" && raw.token.length > 0;
    let userId: Id<"users"> | undefined;
    if (!hasToken) {
      userId = (await getAuthUserId(ctx)) as Id<"users"> | undefined;
    }

    const scope = getScope(args);
    const wrappedHandler = withScopeAndEvents<P, R>(
      {
        operation,
        module: "lms",
        entity,
        getEntityCompanyId: () => scope.companyId,
        getEntityBranchId: () => scope.branchId,
        getEntityDepartmentId: () => scope.departmentId,
        getUserId: () => userId as Id<"users">,
        notifyViaMatrix: true,
        triggerWorkflow: true,
        triggerAutomation: true,
        registerSearch: true,
        signalDashboard: true,
      },
      (ctx2, args2) => handler(ctx2, args2, userId as Id<"users">),
    );
    return wrappedHandler(ctx, args);
  };
}

// ═════════════════════════════════════════════════════════════════════
//  QUESTION BANK
// ═════════════════════════════════════════════════════════════════════

export const createQuestionBankItem = mutation({
  args: {
    token: v.optional(v.string()),
    courseId: v.id("lmsCourses"),
    question: v.string(),
    questionType: v.union(
      v.literal("multiple_choice"), v.literal("true_false"),
      v.literal("short_answer"), v.literal("essay"),
    ),
    options: v.optional(v.array(v.string())),
    correctAnswer: v.optional(v.string()),
    points: v.number(),
    difficulty: v.optional(v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))),
    tags: v.optional(v.array(v.string())),
  },
  handler: withLms("create", "question_bank", () => ({}), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    const id = await ctx.db.insert("lmsQuestionBank", {
      ...args,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return id;
  }),
});

export const updateQuestionBankItem = mutation({
  args: {
    token: v.optional(v.string()),
    id: v.id("lmsQuestionBank"),
    question: v.optional(v.string()),
    questionType: v.optional(v.union(
      v.literal("multiple_choice"), v.literal("true_false"),
      v.literal("short_answer"), v.literal("essay"),
    )),
    options: v.optional(v.array(v.string())),
    correctAnswer: v.optional(v.string()),
    points: v.optional(v.number()),
    difficulty: v.optional(v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))),
    tags: v.optional(v.array(v.string())),
  },
  handler: withLms("update", "question_bank", () => ({}), async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    return id;
  }),
});

export const deleteQuestionBankItem = mutation({
  args: { token: v.optional(v.string()), id: v.id("lmsQuestionBank") },
  handler: withLms("delete", "question_bank", () => ({}), async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  }),
});

export const listQuestionBank = query({
  args: {
    courseId: v.id("lmsCourses"),
    questionType: v.optional(v.union(
      v.literal("multiple_choice"), v.literal("true_false"),
      v.literal("short_answer"), v.literal("essay"),
    )),
    difficulty: v.optional(v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    let items = await ctx.db.query("lmsQuestionBank")
      .withIndex("courseId", (q: any) => q.eq("courseId", args.courseId))
      .collect();

    if (args.questionType) items = items.filter((i: any) => i.questionType === args.questionType);
    if (args.difficulty) items = items.filter((i: any) => i.difficulty === args.difficulty);
    if (args.tags?.length) items = items.filter((i: any) => i.tags?.some((t: string) => args.tags!.includes(t)));

    return items;
  },
});

export const importQuestionsFromBank = mutation({
  args: {
    token: v.optional(v.string()),
    quizId: v.id("lmsQuizzes"),
    questionIds: v.array(v.id("lmsQuestionBank")),
  },
  handler: withLms("create", "quiz", () => ({}), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    let orderIndex = 0;
    const existing = await ctx.db.query("lmsQuizQuestions")
      .withIndex("quizId", (q: any) => q.eq("quizId", args.quizId))
      .collect();
    if (existing.length > 0) {
      orderIndex = Math.max(...existing.map((e: any) => e.orderIndex)) + 1;
    }

    const imported: any[] = [];
    for (const qid of args.questionIds) {
      const source = await ctx.db.get(qid);
      if (!source) continue;

      const newId = await ctx.db.insert("lmsQuizQuestions", {
        quizId: args.quizId,
        question: (source as any).question,
        questionType: (source as any).questionType,
        options: (source as any).options,
        correctAnswer: (source as any).correctAnswer,
        points: (source as any).points,
        orderIndex: orderIndex++,
        createdAt: Date.now(),
      });
      imported.push(newId);
    }

    return imported;
  }),
});

// ═════════════════════════════════════════════════════════════════════
//  CERTIFICATE MANAGEMENT
// ═════════════════════════════════════════════════════════════════════

export const issueCertificate = mutation({
  args: {
    token: v.optional(v.string()),
    courseId: v.id("lmsCourses"),
    studentId: v.id("studentMaster"),
    enrollmentId: v.id("lmsEnrollments"),
    pdfUrl: v.optional(v.string()),
    metadata: v.optional(v.string()),
  },
  handler: withLms("create", "certificate", () => ({}), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    // Check for existing certificate
    const existing = await ctx.db.query("lmsCertificates")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .filter((q: any) => q.eq(q.field("courseId"), args.courseId))
      .first();
    if (existing) throw new Error("Certificate already issued for this course and student");

    const allCerts = await ctx.db.query("lmsCertificates").collect();
    const certNumber = `CERT-${String(allCerts.length + 1).padStart(6, "0")}`;

    const id = await ctx.db.insert("lmsCertificates", {
      courseId: args.courseId,
      studentId: args.studentId,
      enrollmentId: args.enrollmentId,
      certificateNumber: certNumber,
      issuedAt: Date.now(),
      pdfUrl: args.pdfUrl,
      metadata: args.metadata,
    });

    return { id, certificateNumber: certNumber };
  }),
});

export const listCertificates = query({
  args: {
    courseId: v.optional(v.id("lmsCourses")),
    studentId: v.optional(v.id("studentMaster")),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("lmsCertificates");

    if (args.courseId) {
      query = query.withIndex("courseId", (q: any) => q.eq("courseId", args.courseId));
    } else if (args.studentId) {
      query = query.withIndex("studentId", (q: any) => q.eq("studentId", args.studentId));
    }

    return query.order("desc").collect();
  },
});

// ═════════════════════════════════════════════════════════════════════
//  CONTENT UPLOAD MANAGEMENT
// ═════════════════════════════════════════════════════════════════════

export const recordContentUpload = mutation({
  args: {
    token: v.optional(v.string()),
    courseId: v.id("lmsCourses"),
    lessonId: v.optional(v.id("lmsLessons")),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    fileUrl: v.string(),
    description: v.optional(v.string()),
  },
  handler: withLms("create", "content_upload", () => ({}), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    const id = await ctx.db.insert("lmsContentUploads", {
      ...args,
      uploadedBy: userId,
      createdAt: Date.now(),
    });

    return id;
  }),
});

export const listContentUploads = query({
  args: {
    courseId: v.id("lmsCourses"),
    lessonId: v.optional(v.id("lmsLessons")),
  },
  handler: async (ctx, args) => {
    let items = await ctx.db.query("lmsContentUploads")
      .withIndex("courseId", (q: any) => q.eq("courseId", args.courseId))
      .order("desc")
      .collect();

    if (args.lessonId) {
      items = items.filter((i: any) => i.lessonId === args.lessonId);
    }

    return items;
  },
});

export const deleteContentUpload = mutation({
  args: { token: v.optional(v.string()), id: v.id("lmsContentUploads") },
  handler: withLms("delete", "content_upload", () => ({}), async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  }),
});

// ═════════════════════════════════════════════════════════════════════
//  EVENT-PIPELINE-WIRED MUTATIONS (Course/Lesson)
// ═════════════════════════════════════════════════════════════════════

export const createCourse = mutation({
  args: {
    token: v.optional(v.string()),
    title: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    academicSubjectId: v.optional(v.id("academicSubjects")),
    academicBatchId: v.optional(v.id("academicBatches")),
    academicSessionId: v.optional(v.id("academicSessions")),
    duration: v.optional(v.number()),
    difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    tags: v.optional(v.array(v.string())),
  },
  handler: withLms("create", "course", () => ({}), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    const id = await ctx.db.insert("lmsCourses", {
      ...args,
      instructorId: userId,
      status: "draft",
      totalLessons: 0,
      enrolledCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return id;
  }),
});

export const publishCourse = mutation({
  args: { token: v.optional(v.string()), id: v.id("lmsCourses") },
  handler: withLms("update", "course", () => ({}), async (ctx, args) => {
    const course = await ctx.db.get(args.id);
    if (!course) throw new Error("Course not found");
    if ((course as any).totalLessons === 0) throw new Error("Cannot publish a course with no lessons");

    await ctx.db.patch(args.id, { status: "published", updatedAt: Date.now() });
    return args.id;
  }),
});

export const createLesson = mutation({
  args: {
    token: v.optional(v.string()),
    courseId: v.id("lmsCourses"),
    title: v.string(),
    description: v.optional(v.string()),
    orderIndex: v.number(),
    contentType: v.union(
      v.literal("video"), v.literal("pdf"), v.literal("slides"),
      v.literal("text"), v.literal("quiz"), v.literal("assignment"),
    ),
    contentUrl: v.optional(v.string()),
    contentData: v.optional(v.string()),
    duration: v.optional(v.number()),
  },
  handler: withLms("create", "lesson", () => ({}), async (ctx, args, userId) => {
    if (!userId) throw new Error("Not authenticated");

    const id = await ctx.db.insert("lmsLessons", {
      ...args,
      isPublished: false,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const allLessons = await ctx.db.query("lmsLessons")
      .withIndex("courseId", (q: any) => q.eq("courseId", args.courseId))
      .collect();
    await ctx.db.patch(args.courseId, { totalLessons: allLessons.length, updatedAt: Date.now() });

    return id;
  }),
});

export const publishLesson = mutation({
  args: { token: v.optional(v.string()), id: v.id("lmsLessons") },
  handler: withLms("update", "lesson", () => ({}), async (ctx, args) => {
    const lesson = await ctx.db.get(args.id);
    if (!lesson) throw new Error("Lesson not found");

    await ctx.db.patch(args.id, {
      isPublished: true,
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return args.id;
  }),
});

// ═════════════════════════════════════════════════════════════════════
//  STUDENT ENROLLMENT (Event Wired)
// ═════════════════════════════════════════════════════════════════════

export const enrollStudent = mutation({
  args: {
    token: v.optional(v.string()),
    courseId: v.id("lmsCourses"),
    studentId: v.id("studentMaster"),
  },
  handler: withLms("create", "enrollment", () => ({}), async (ctx, args) => {
    const existing = await ctx.db.query("lmsEnrollments")
      .withIndex("studentId_courseId", (q: any) =>
        q.eq("studentId", args.studentId).eq("courseId", args.courseId)
      )
      .first();
    if (existing) throw new Error("Student is already enrolled in this course");

    const id = await ctx.db.insert("lmsEnrollments", {
      courseId: args.courseId,
      studentId: args.studentId,
      enrolledAt: Date.now(),
      progress: 0,
      status: "enrolled",
    });

    const enrollments = await ctx.db.query("lmsEnrollments")
      .withIndex("courseId", (q: any) => q.eq("courseId", args.courseId))
      .collect();
    await ctx.db.patch(args.courseId, { enrolledCount: enrollments.length });

    return id;
  }),
});

// ═════════════════════════════════════════════════════════════════════
//  ANALYTICS / DASHBOARD
// ═════════════════════════════════════════════════════════════════════

export const getLmsAnalytics = query({
  handler: async (ctx) => {
    const courses = await ctx.db.query("lmsCourses").collect();
    const lessons = await ctx.db.query("lmsLessons").collect();
    const enrollments = await ctx.db.query("lmsEnrollments").collect();
    const submissions = await ctx.db.query("lmsSubmissions").collect();
    const quizAttempts = await ctx.db.query("lmsQuizAttempts").collect();
    const progress = await ctx.db.query("lmsLessonProgress").collect();
    const certificates = await ctx.db.query("lmsCertificates").collect();

    const publishedCourses = courses.filter((c: any) => c.status === "published");
    const draftCourses = courses.filter((c: any) => c.status === "draft");
    const publishedLessons = lessons.filter((l: any) => l.isPublished);

    const totalEnrolled = enrollments.length;
    const completedCourses = enrollments.filter((e: any) => e.status === "completed").length;
    const inProgress = enrollments.filter((e: any) => e.status === "in_progress").length;
    const dropped = enrollments.filter((e: any) => e.status === "dropped").length;

    const avgProgress = totalEnrolled > 0
      ? Math.round(enrollments.reduce((s: number, e: any) => s + e.progress, 0) / totalEnrolled)
      : 0;

    const completionRate = totalEnrolled > 0
      ? Math.round((completedCourses / totalEnrolled) * 100)
      : 0;

    const pendingEval = submissions.filter((s: any) =>
      s.status === "submitted" || s.status === "resubmitted"
    ).length;

    const totalQuizAttempts = quizAttempts.length;
    const quizPassed = quizAttempts.filter((a: any) => a.passed).length;
    const quizPassRate = totalQuizAttempts > 0 ? Math.round((quizPassed / totalQuizAttempts) * 100) : 0;

    // Course-level analytics
    const courseAnalytics = publishedCourses.map((c: any) => {
      const courseEnrollments = enrollments.filter((e: any) => e.courseId === c._id);
      const courseLessons = lessons.filter((l: any) => l.courseId === c._id);
      const publishedInCourse = courseLessons.filter((l: any) => l.isPublished).length;
      const completed = courseEnrollments.filter((e: any) => e.status === "completed").length;
      return {
        courseId: c._id,
        title: c.title,
        enrolledCount: c.enrolledCount,
        lessonCount: courseLessons.length,
        publishedLessons: publishedInCourse,
        completedStudents: completed,
        completionPct: c.enrolledCount > 0 ? Math.round((completed / c.enrolledCount) * 100) : 0,
      };
    });

    // Top lessons by activity
    const lessonViewCounts: Record<string, number> = {};
    for (const lp of progress) {
      lessonViewCounts[(lp as any).lessonId] = (lessonViewCounts[(lp as any).lessonId] || 0) + 1;
    }
    const topLessons = Object.entries(lessonViewCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([lessonId, views]) => ({ lessonId, views }));

    return {
      totalCourses: courses.length,
      publishedCourses: publishedCourses.length,
      draftCourses: draftCourses.length,
      totalLessons: lessons.length,
      publishedLessons: publishedLessons.length,
      totalEnrolled,
      completedCourses,
      inProgress,
      dropped,
      completionRate,
      averageProgress: avgProgress,
      pendingEvaluations: pendingEval,
      totalQuizAttempts,
      quizPassRate,
      certificatesIssued: certificates.length,
      courseAnalytics,
      topLessons,
    };
  },
});

export const getFacultyCourseAnalytics = query({
  args: { facultyId: v.id("users") },
  handler: async (ctx, args) => {
    const courses = await ctx.db.query("lmsCourses")
      .filter((q: any) => q.eq(q.field("instructorId"), args.facultyId))
      .collect();

    const courseIds = courses.map((c: any) => c._id);
    const lessons = await ctx.db.query("lmsLessons").collect();
    const courseLessons = lessons.filter((l: any) => courseIds.includes(l.courseId));

    const enrollments = await ctx.db.query("lmsEnrollments").collect();
    const courseEnrollments = enrollments.filter((e: any) => courseIds.includes(e.courseId));

    const assignments = await ctx.db.query("lmsAssignments").collect();
    const courseAssignments = assignments.filter((a: any) => courseIds.includes(a.courseId));
    const assignmentIds = courseAssignments.map((a: any) => a._id);

    const submissions = await ctx.db.query("lmsSubmissions").collect();
    const courseSubmissions = submissions.filter((s: any) => assignmentIds.includes(s.assignmentId));

    return {
      totalCourses: courses.length,
      totalLessons: courseLessons.length,
      publishedLessons: courseLessons.filter((l: any) => l.isPublished).length,
      totalEnrollments: courseEnrollments.length,
      activeStudents: courseEnrollments.filter((e: any) => e.status !== "dropped" && e.status !== "completed").length,
      completedStudents: courseEnrollments.filter((e: any) => e.status === "completed").length,
      pendingEvaluations: courseSubmissions.filter((s: any) => s.status === "submitted" || s.status === "resubmitted").length,
      totalAssignments: courseAssignments.length,
      publishedAssignments: courseAssignments.filter((a: any) => a.status === "published").length,
    };
  },
});
