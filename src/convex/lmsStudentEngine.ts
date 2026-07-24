import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── STUDENT ENROLLMENT ─────────────────────────────

export const enrollStudent = mutation({
  args: {
    courseId: v.id("lmsCourses"),
    studentId: v.id("studentMaster"),
  },
  handler: async (ctx, args) => {
    // Check if already enrolled
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

    // Update course enrolled count
    const enrollments = await ctx.db.query("lmsEnrollments")
      .withIndex("courseId", (q: any) => q.eq("courseId", args.courseId))
      .collect();
    await ctx.db.patch(args.courseId, { enrolledCount: enrollments.length });

    return id;
  },
});

export const getStudentEnrollments = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    const enrollments = await ctx.db.query("lmsEnrollments")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .collect();

    // Enrich with course data
    const enriched = await Promise.all(enrollments.map(async (e: any) => {
      const course = await ctx.db.get(e.courseId);
      const completedLessons = await ctx.db.query("lmsLessonProgress")
        .withIndex("studentId_courseId", (q: any) =>
          q.eq("studentId", args.studentId).eq("courseId", e.courseId)
        )
        .filter((q: any) => q.eq(q.field("completed"), true))
        .collect();

      return {
        ...e,
        courseTitle: course ? (course as any).title : "Unknown",
        courseDifficulty: course ? (course as any).difficulty : null,
        completedLessonsCount: completedLessons.length,
      };
    }));

    return enriched;
  },
});

// ─── LESSON PROGRESS ────────────────────────────────

export const trackLessonProgress = mutation({
  args: {
    lessonId: v.id("lmsLessons"),
    courseId: v.id("lmsCourses"),
    studentId: v.id("studentMaster"),
    watchedDuration: v.optional(v.number()),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("lmsLessonProgress")
      .withIndex("studentId_lessonId", (q: any) =>
        q.eq("studentId", args.studentId).eq("lessonId", args.lessonId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        watchedDuration: args.watchedDuration,
        completed: args.completed || existing.completed,
        completedAt: args.completed ? Date.now() : existing.completedAt,
        lastAccessedAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("lmsLessonProgress", {
        lessonId: args.lessonId,
        courseId: args.courseId,
        studentId: args.studentId,
        watchedDuration: args.watchedDuration,
        completed: args.completed,
        completedAt: args.completed ? Date.now() : undefined,
        lastAccessedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Update course progress
    const totalLessons = await ctx.db.query("lmsLessons")
      .withIndex("courseId", (q: any) => q.eq("courseId", args.courseId))
      .filter((q: any) => q.eq(q.field("isPublished"), true))
      .collect();

    const completedLessons = await ctx.db.query("lmsLessonProgress")
      .withIndex("studentId_courseId", (q: any) =>
        q.eq("studentId", args.studentId).eq("courseId", args.courseId)
      )
      .filter((q: any) => q.eq(q.field("completed"), true))
      .collect();

    const progress = totalLessons.length > 0
      ? Math.round((completedLessons.length / totalLessons.length) * 100)
      : 0;

    const enrollment = await ctx.db.query("lmsEnrollments")
      .withIndex("studentId_courseId", (q: any) =>
        q.eq("studentId", args.studentId).eq("courseId", args.courseId)
      )
      .first();

    if (enrollment) {
      const status = progress >= 100 ? "completed" : "in_progress";
      await ctx.db.patch(enrollment._id, {
        progress,
        lastAccessedAt: Date.now(),
        completedAt: progress >= 100 ? Date.now() : enrollment.completedAt,
        status,
      });
    }

    return { progress, lessonTracked: true };
  },
});

export const getStudentProgress = query({
  args: {
    studentId: v.id("studentMaster"),
    courseId: v.id("lmsCourses"),
  },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.query("lmsEnrollments")
      .withIndex("studentId_courseId", (q: any) =>
        q.eq("studentId", args.studentId).eq("courseId", args.courseId)
      )
      .first();

    if (!enrollment) return null;

    const lessonProgress = await ctx.db.query("lmsLessonProgress")
      .withIndex("studentId_courseId", (q: any) =>
        q.eq("studentId", args.studentId).eq("courseId", args.courseId)
      )
      .collect();

    const lessons = await ctx.db.query("lmsLessons")
      .withIndex("courseId", (q: any) => q.eq("courseId", args.courseId))
      .collect();

    return {
      enrollment,
      lessonProgress,
      totalLessons: lessons.length,
      completedLessons: lessonProgress.filter((lp: any) => lp.completed).length,
      progress: enrollment.progress,
    };
  },
});

// ─── ASSIGNMENT SUBMISSION ──────────────────────────

export const submitAssignment = mutation({
  args: {
    assignmentId: v.id("lmsAssignments"),
    studentId: v.id("studentMaster"),
    submissionUrl: v.optional(v.string()),
    submissionData: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("lmsSubmissions")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .filter((q: any) => q.eq(q.field("assignmentId"), args.assignmentId))
      .first();

    const status = existing ? "resubmitted" : "submitted";

    if (existing) {
      await ctx.db.patch(existing._id, {
        submissionUrl: args.submissionUrl,
        submissionData: args.submissionData,
        status,
        submittedAt: Date.now(),
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return ctx.db.insert("lmsSubmissions", {
      ...args,
      status: "submitted",
      submittedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// ─── QUIZ ATTEMPTS ──────────────────────────────────

export const submitQuizAttempt = mutation({
  args: {
    quizId: v.id("lmsQuizzes"),
    studentId: v.id("studentMaster"),
    answers: v.string(),
    attemptNumber: v.number(),
    score: v.number(),
    totalPoints: v.number(),
    startedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const percentage = args.totalPoints > 0 ? Math.round((args.score / args.totalPoints) * 100) : 0;
    const passed = percentage >= 60; // Default passing

    const id = await ctx.db.insert("lmsQuizAttempts", {
      quizId: args.quizId,
      studentId: args.studentId,
      attemptNumber: args.attemptNumber,
      answers: args.answers,
      score: args.score,
      totalPoints: args.totalPoints,
      percentage,
      passed,
      startedAt: args.startedAt,
      completedAt: Date.now(),
      createdAt: Date.now(),
    });

    return { id, percentage, passed };
  },
});

export const getQuizAttempts = query({
  args: {
    quizId: v.id("lmsQuizzes"),
    studentId: v.id("studentMaster"),
  },
  handler: async (ctx, args) => {
    return ctx.db.query("lmsQuizAttempts")
      .withIndex("studentId_quizId", (q: any) =>
        q.eq("studentId", args.studentId).eq("quizId", args.quizId)
      )
      .order("desc")
      .collect();
  },
});

// ─── STUDENT DASHBOARD ──────────────────────────────

export const getStudentDashboard = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    const enrollments = await ctx.db.query("lmsEnrollments")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .collect();

    const completed = enrollments.filter((e: any) => e.status === "completed").length;
    const inProgress = enrollments.filter((e: any) => e.status === "in_progress").length;
    const pendingAssignments = await ctx.db.query("lmsSubmissions")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .filter((q: any) => q.neq(q.field("status"), "passed"))
      .filter((q: any) => q.neq(q.field("status"), "failed"))
      .collect();

    const totalProgress = enrollments.length > 0
      ? Math.round(enrollments.reduce((s: number, e: any) => s + e.progress, 0) / enrollments.length)
      : 0;

    return {
      totalEnrolled: enrollments.length,
      completedCourses: completed,
      inProgress: inProgress,
      completionRate: totalProgress,
      pendingSubmissions: pendingAssignments.length,
      averageProgress: totalProgress,
    };
  },
});
