import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── COURSE LIBRARY ───────────────────────────────────

export const createCourse = mutation({
  args: {
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
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db.insert("lmsCourses", {
      ...args,
      instructorId: userId,
      status: "draft",
      totalLessons: 0,
      enrolledCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateCourse = mutation({
  args: {
    id: v.id("lmsCourses"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    difficulty: v.optional(v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    return id;
  },
});

export const publishCourse = mutation({
  args: { id: v.id("lmsCourses") },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.id);
    if (!course) throw new Error("Course not found");
    if ((course as any).totalLessons === 0) throw new Error("Cannot publish a course with no lessons");

    await ctx.db.patch(args.id, {
      status: "published",
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const listCourses = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
    instructorId: v.optional(v.id("users")),
    academicSubjectId: v.optional(v.id("academicSubjects")),
    difficulty: v.optional(v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("lmsCourses");

    if (args.status) query = query.filter((q: any) => q.eq(q.field("status"), args.status));
    if (args.instructorId) query = query.filter((q: any) => q.eq(q.field("instructorId"), args.instructorId));
    if (args.difficulty) query = query.filter((q: any) => q.eq(q.field("difficulty"), args.difficulty));

    let courses = await query.collect();

    if (args.academicSubjectId) {
      courses = courses.filter((c: any) => c.academicSubjectId === args.academicSubjectId);
    }

    // Enrich with lesson count
    const enriched = await Promise.all(courses.map(async (c: any) => {
      const lessons = await ctx.db.query("lmsLessons")
        .withIndex("courseId", (q: any) => q.eq("courseId", c._id))
        .collect();
      return { ...c, lessonCount: lessons.length, publishedLessons: lessons.filter((l: any) => l.isPublished).length };
    }));

    return enriched;
  },
});

export const getCourse = query({
  args: { id: v.id("lmsCourses") },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.id);
    if (!course) return null;

    const lessons = await ctx.db.query("lmsLessons")
      .withIndex("courseId_orderIndex", (q: any) => q.eq("courseId", args.id))
      .collect();

    return { ...course, lessons };
  },
});

// ─── LESSONS ──────────────────────────────────────────

export const createLesson = mutation({
  args: {
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
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const id = await ctx.db.insert("lmsLessons", {
      ...args,
      isPublished: false,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update course lesson count
    const allLessons = await ctx.db.query("lmsLessons")
      .withIndex("courseId", (q: any) => q.eq("courseId", args.courseId))
      .collect();
    await ctx.db.patch(args.courseId, { totalLessons: allLessons.length, updatedAt: Date.now() });

    return id;
  },
});

export const updateLesson = mutation({
  args: {
    id: v.id("lmsLessons"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    contentType: v.optional(v.union(
      v.literal("video"), v.literal("pdf"), v.literal("slides"),
      v.literal("text"), v.literal("quiz"), v.literal("assignment"),
    )),
    contentUrl: v.optional(v.string()),
    contentData: v.optional(v.string()),
    duration: v.optional(v.number()),
    orderIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    return id;
  },
});

export const publishLesson = mutation({
  args: { id: v.id("lmsLessons") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const lesson = await ctx.db.get(args.id);
    if (!lesson) throw new Error("Lesson not found");

    await ctx.db.patch(args.id, {
      isPublished: true,
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create timeline event
    await ctx.db.insert("examTimeline", {
      examSessionId: (lesson as any).courseId,
      eventType: "exam_created",
      description: `Lesson published: ${(lesson as any).title}`,
      userId: userId || "",
      metadata: JSON.stringify({ lessonId: args.id }),
      createdAt: Date.now(),
    } as any);

    return args.id;
  },
});

export const listLessons = query({
  args: {
    courseId: v.id("lmsCourses"),
    onlyPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("lmsLessons")
      .withIndex("courseId_orderIndex", (q: any) => q.eq("courseId", args.courseId));

    if (args.onlyPublished) {
      query = query.filter((q: any) => q.eq(q.field("isPublished"), true));
    }

    const lessons = await query.collect();

    // Attach topics, assignments, quizzes
    const enriched = await Promise.all(lessons.map(async (lesson: any) => {
      const topics = await ctx.db.query("lmsTopics")
        .withIndex("lessonId_orderIndex", (q: any) => q.eq("lessonId", lesson._id))
        .collect();
      return { ...lesson, topics };
    }));

    return enriched;
  },
});

export const getLesson = query({
  args: { id: v.id("lmsLessons") },
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.id);
    if (!lesson) return null;

    const topics = await ctx.db.query("lmsTopics")
      .withIndex("lessonId_orderIndex", (q: any) => q.eq("lessonId", args.id))
      .collect();

    const assignments = await ctx.db.query("lmsAssignments")
      .withIndex("lessonId", (q: any) => q.eq("lessonId", args.id))
      .collect();

    const quizzes = await ctx.db.query("lmsQuizzes")
      .withIndex("lessonId", (q: any) => q.eq("lessonId", args.id))
      .collect();

    return { ...lesson, topics, assignments, quizzes };
  },
});

// ─── TOPICS ───────────────────────────────────────────

export const createTopic = mutation({
  args: {
    lessonId: v.id("lmsLessons"),
    title: v.string(),
    orderIndex: v.number(),
    contentType: v.union(
      v.literal("text"), v.literal("video"), v.literal("pdf"),
      v.literal("image"), v.literal("embed"), v.literal("code"),
    ),
    contentUrl: v.optional(v.string()),
    contentData: v.optional(v.string()),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("lmsTopics", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateTopic = mutation({
  args: {
    id: v.id("lmsTopics"),
    title: v.optional(v.string()),
    contentUrl: v.optional(v.string()),
    contentData: v.optional(v.string()),
    duration: v.optional(v.number()),
    orderIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    return id;
  },
});

// ─── ANNOUNCEMENTS ────────────────────────────────────

export const createAnnouncement = mutation({
  args: {
    courseId: v.id("lmsCourses"),
    title: v.string(),
    content: v.string(),
    priority: v.union(v.literal("normal"), v.literal("important"), v.literal("urgent")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db.insert("lmsAnnouncements", {
      ...args,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const listAnnouncements = query({
  args: { courseId: v.id("lmsCourses") },
  handler: async (ctx, args) => {
    return ctx.db.query("lmsAnnouncements")
      .withIndex("courseId", (q: any) => q.eq("courseId", args.courseId))
      .order("desc")
      .collect();
  },
});

// ─── DISCUSSIONS ──────────────────────────────────────

export const createDiscussion = mutation({
  args: {
    courseId: v.id("lmsCourses"),
    lessonId: v.optional(v.id("lmsLessons")),
    content: v.string(),
    parentId: v.optional(v.id("lmsDiscussions")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db.insert("lmsDiscussions", {
      ...args,
      authorId: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const listDiscussions = query({
  args: {
    courseId: v.id("lmsCourses"),
    lessonId: v.optional(v.id("lmsLessons")),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("lmsDiscussions")
      .withIndex("courseId", (q: any) => q.eq("courseId", args.courseId));

    const discussions = await query.order("desc").collect();

    if (args.lessonId) {
      return discussions.filter((d: any) => d.lessonId === args.lessonId);
    }

    return discussions;
  },
});

// ─── LMS DASHBOARD ────────────────────────────────────

export const getLMSDashboard = query({
  handler: async (ctx) => {
    const courses = await ctx.db.query("lmsCourses").collect();
    const lessons = await ctx.db.query("lmsLessons").collect();
    const enrollments = await ctx.db.query("lmsEnrollments").collect();

    const publishedCourses = courses.filter((c: any) => c.status === "published").length;
    const draftCourses = courses.filter((c: any) => c.status === "draft").length;
    const publishedLessons = lessons.filter((l: any) => l.isPublished).length;
    const totalEnrolled = enrollments.length;
    const completedCourses = enrollments.filter((e: any) => e.status === "completed").length;
    const inProgress = enrollments.filter((e: any) => e.status === "in_progress").length;

    // Most viewed lessons
    const lessonProgress = await ctx.db.query("lmsLessonProgress").collect();
    const lessonViewCounts: Record<string, number> = {};
    for (const lp of lessonProgress) {
      lessonViewCounts[(lp as any).lessonId] = (lessonViewCounts[(lp as any).lessonId] || 0) + 1;
    }

    const topLessons = Object.entries(lessonViewCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([lessonId, views]) => ({ lessonId, views }));

    return {
      totalCourses: courses.length,
      publishedCourses,
      draftCourses,
      totalLessons: lessons.length,
      publishedLessons,
      totalEnrolled,
      completedCourses,
      inProgress,
      completionRate: totalEnrolled > 0 ? Math.round((completedCourses / totalEnrolled) * 100) : 0,
      topLessons,
    };
  },
});
