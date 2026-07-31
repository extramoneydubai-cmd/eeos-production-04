/**
 * LMS SDK — Enterprise Learning Management Data Layer
 *
 * Wires the four existing LMS engines into one SDK:
 *   - lmsEngine         (courses, lessons, topics, announcements, discussions)
 *   - lmsPlatform       (question bank, certificates, content uploads, analytics)
 *   - lmsStudentEngine  (enrollment, progress, assignments, quizzes, dashboard)
 *   - lmsFacultyEngine  (assignments, quizzes, evaluation, faculty dashboard)
 *
 * Media policy: EEOS stores metadata only (contentUrl / fileUrl / provider refs).
 * Videos live in the configured storage provider (S3, R2, Drive, etc.) via the
 * Integration Studio connector — never inside Convex.
 *
 * Usage:
 *   import { PlatformSDK } from "@/platform/sdk";
 *   const course = await PlatformSDK.lms.createCourse(ctx, { ... });
 */

import { v } from "convex/values";
import { mutation, query } from "../../convex/_generated/server";

// ─── Course SDK — lmsEngine ─────────────────────────────────────────────

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
    const { createCourse } = await import("../../convex/lmsEngine");
    return createCourse.handler(ctx, args);
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
    const { updateCourse } = await import("../../convex/lmsEngine");
    return updateCourse.handler(ctx, args);
  },
});

export const publishCourse = mutation({
  args: { id: v.id("lmsCourses") },
  handler: async (ctx, args) => {
    const { publishCourse } = await import("../../convex/lmsEngine");
    return publishCourse.handler(ctx, args);
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
    const { listCourses } = await import("../../convex/lmsEngine");
    return listCourses.handler(ctx, args);
  },
});

export const getCourse = query({
  args: { id: v.id("lmsCourses") },
  handler: async (ctx, args) => {
    const { getCourse } = await import("../../convex/lmsEngine");
    return getCourse.handler(ctx, args);
  },
});

// ─── Lesson SDK — lmsEngine ─────────────────────────────────────────────

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
    const { createLesson } = await import("../../convex/lmsEngine");
    return createLesson.handler(ctx, args);
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
    const { updateLesson } = await import("../../convex/lmsEngine");
    return updateLesson.handler(ctx, args);
  },
});

export const publishLesson = mutation({
  args: { id: v.id("lmsLessons") },
  handler: async (ctx, args) => {
    const { publishLesson } = await import("../../convex/lmsEngine");
    return publishLesson.handler(ctx, args);
  },
});

export const listLessons = query({
  args: {
    courseId: v.id("lmsCourses"),
    onlyPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { listLessons } = await import("../../convex/lmsEngine");
    return listLessons.handler(ctx, args);
  },
});

export const getLesson = query({
  args: { id: v.id("lmsLessons") },
  handler: async (ctx, args) => {
    const { getLesson } = await import("../../convex/lmsEngine");
    return getLesson.handler(ctx, args);
  },
});

// ─── Topic SDK — lmsEngine ──────────────────────────────────────────────

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
    const { createTopic } = await import("../../convex/lmsEngine");
    return createTopic.handler(ctx, args);
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
    const { updateTopic } = await import("../../convex/lmsEngine");
    return updateTopic.handler(ctx, args);
  },
});

// ─── Announcements & Discussions — lmsEngine ────────────────────────────

export const createAnnouncement = mutation({
  args: {
    courseId: v.id("lmsCourses"),
    title: v.string(),
    content: v.string(),
    priority: v.union(v.literal("normal"), v.literal("important"), v.literal("urgent")),
  },
  handler: async (ctx, args) => {
    const { createAnnouncement } = await import("../../convex/lmsEngine");
    return createAnnouncement.handler(ctx, args);
  },
});

export const listAnnouncements = query({
  args: { courseId: v.id("lmsCourses") },
  handler: async (ctx, args) => {
    const { listAnnouncements } = await import("../../convex/lmsEngine");
    return listAnnouncements.handler(ctx, args);
  },
});

export const createDiscussion = mutation({
  args: {
    courseId: v.id("lmsCourses"),
    lessonId: v.optional(v.id("lmsLessons")),
    content: v.string(),
    parentId: v.optional(v.id("lmsDiscussions")),
  },
  handler: async (ctx, args) => {
    const { createDiscussion } = await import("../../convex/lmsEngine");
    return createDiscussion.handler(ctx, args);
  },
});

export const listDiscussions = query({
  args: {
    courseId: v.id("lmsCourses"),
    lessonId: v.optional(v.id("lmsLessons")),
  },
  handler: async (ctx, args) => {
    const { listDiscussions } = await import("../../convex/lmsEngine");
    return listDiscussions.handler(ctx, args);
  },
});

export const getLMSDashboard = query({
  handler: async (ctx) => {
    const { getLMSDashboard } = await import("../../convex/lmsEngine");
    return getLMSDashboard.handler(ctx, {});
  },
});

// ─── Question Bank SDK — lmsPlatform ────────────────────────────────────

export const createQuestionBankItem = mutation({
  args: {
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
  handler: async (ctx, args) => {
    const { createQuestionBankItem } = await import("../../convex/lmsPlatform");
    return createQuestionBankItem.handler(ctx, args);
  },
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
    const { listQuestionBank } = await import("../../convex/lmsPlatform");
    return listQuestionBank.handler(ctx, args);
  },
});

// ─── Certificates SDK — lmsPlatform ─────────────────────────────────────

export const issueCertificate = mutation({
  args: {
    courseId: v.id("lmsCourses"),
    studentId: v.id("studentMaster"),
    enrollmentId: v.id("lmsEnrollments"),
    pdfUrl: v.optional(v.string()),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { issueCertificate } = await import("../../convex/lmsPlatform");
    return issueCertificate.handler(ctx, args);
  },
});

export const listCertificates = query({
  args: {
    studentId: v.optional(v.id("studentMaster")),
    courseId: v.optional(v.id("lmsCourses")),
  },
  handler: async (ctx, args) => {
    const { listCertificates } = await import("../../convex/lmsPlatform");
    return listCertificates.handler(ctx, args);
  },
});

// ─── Content Upload SDK (metadata only) — lmsPlatform ───────────────────

export const recordContentUpload = mutation({
  args: {
    courseId: v.id("lmsCourses"),
    lessonId: v.optional(v.id("lmsLessons")),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    fileUrl: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { recordContentUpload } = await import("../../convex/lmsPlatform");
    return recordContentUpload.handler(ctx, args);
  },
});

export const listContentUploads = query({
  args: {
    courseId: v.optional(v.id("lmsCourses")),
    lessonId: v.optional(v.id("lmsLessons")),
  },
  handler: async (ctx, args) => {
    const { listContentUploads } = await import("../../convex/lmsPlatform");
    return listContentUploads.handler(ctx, args);
  },
});

// ─── Video Metadata SDK (PATCH-ENTERPRISE-020) — media stays external ────

/**
 * Update video metadata for an upload — EEOS never stores the video itself,
 * only provider references, duration, thumbnail, captions, transcripts, DRM.
 */
export const updateVideoMetadata = mutation({
  args: {
    uploadId: v.id("lmsContentUploads"),
    storageProvider: v.optional(v.union(v.literal("aws_s3"), v.literal("cloudflare_r2"), v.literal("google_drive"), v.literal("azure_blob"), v.literal("dropbox"), v.literal("onedrive"), v.literal("minio"), v.literal("bunny_cdn"), v.literal("wasabi"), v.literal("vimeo"), v.literal("mux"), v.literal("youtube_private"), v.literal("custom"))),
    bucket: v.optional(v.string()),
    objectKey: v.optional(v.string()),
    playbackUrl: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    thumbnailUrl: v.optional(v.string()),
    captionsUrl: v.optional(v.string()),
    transcriptUrl: v.optional(v.string()),
    chapters: v.optional(v.array(v.object({ time: v.number(), title: v.string() }))),
    qualityProfiles: v.optional(v.array(v.string())),
    drmEnabled: v.optional(v.boolean()),
    watermarkEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { uploadId, ...fields } = args;
    const updates: Record<string, any> = {};
    (Object.keys(fields) as (keyof typeof fields)[]).forEach(k => {
      if (fields[k] !== undefined) updates[k] = fields[k];
    });
    await ctx.db.patch(uploadId, updates as any);
    return uploadId;
  },
});

/**
 * List content uploads by storage provider (capacity/usage per provider).
 */
export const listUploadsByProvider = query({
  args: { storageProvider: v.optional(v.string()) },
  handler: async (ctx, args) => {
    try {
      const all = await ctx.db.query("lmsContentUploads").collect();
      const filtered = args.storageProvider
        ? all.filter((u: any) => (u as any).storageProvider === args.storageProvider)
        : all;
      const byProvider: Record<string, { count: number; totalBytes: number }> = {};
      for (const u of filtered) {
        const provider = (u as any).storageProvider || "unassigned";
        if (!byProvider[provider]) byProvider[provider] = { count: 0, totalBytes: 0 };
        byProvider[provider].count++;
        byProvider[provider].totalBytes += (u as any).fileSize || 0;
      }
      return { total: filtered.length, byProvider };
    } catch {
      return { total: 0, byProvider: {} };
    }
  },
});

// ─── Enrollment & Progress SDK — lmsPlatform + lmsStudentEngine ─────────

export const enrollStudent = mutation({
  args: {
    courseId: v.id("lmsCourses"),
    studentId: v.id("studentMaster"),
  },
  handler: async (ctx, args) => {
    const { enrollStudent } = await import("../../convex/lmsStudentEngine");
    return enrollStudent.handler(ctx, args);
  },
});

export const getStudentEnrollments = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    const { getStudentEnrollments } = await import("../../convex/lmsStudentEngine");
    return getStudentEnrollments.handler(ctx, args);
  },
});

export const trackLessonProgress = mutation({
  args: {
    lessonId: v.id("lmsLessons"),
    courseId: v.id("lmsCourses"),
    studentId: v.id("studentMaster"),
    watchedDuration: v.optional(v.number()),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { trackLessonProgress } = await import("../../convex/lmsStudentEngine");
    return trackLessonProgress.handler(ctx, args);
  },
});

export const getStudentProgress = query({
  args: {
    studentId: v.id("studentMaster"),
    courseId: v.id("lmsCourses"),
  },
  handler: async (ctx, args) => {
    const { getStudentProgress } = await import("../../convex/lmsStudentEngine");
    return getStudentProgress.handler(ctx, args);
  },
});

export const submitAssignment = mutation({
  args: {
    assignmentId: v.id("lmsAssignments"),
    studentId: v.id("studentMaster"),
    submissionUrl: v.optional(v.string()),
    submissionData: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { submitAssignment } = await import("../../convex/lmsStudentEngine");
    return submitAssignment.handler(ctx, args);
  },
});

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
    const { submitQuizAttempt } = await import("../../convex/lmsStudentEngine");
    return submitQuizAttempt.handler(ctx, args);
  },
});

export const getStudentDashboard = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    const { getStudentDashboard } = await import("../../convex/lmsStudentEngine");
    return getStudentDashboard.handler(ctx, args);
  },
});

// ─── Faculty SDK — lmsFacultyEngine ─────────────────────────────────────

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
    const { createAssignment } = await import("../../convex/lmsFacultyEngine");
    return createAssignment.handler(ctx, args);
  },
});

export const publishAssignment = mutation({
  args: { id: v.id("lmsAssignments") },
  handler: async (ctx, args) => {
    const { publishAssignment } = await import("../../convex/lmsFacultyEngine");
    return publishAssignment.handler(ctx, args);
  },
});

export const listAssignments = query({
  args: {
    courseId: v.id("lmsCourses"),
    lessonId: v.optional(v.id("lmsLessons")),
  },
  handler: async (ctx, args) => {
    const { listAssignments } = await import("../../convex/lmsFacultyEngine");
    return listAssignments.handler(ctx, args);
  },
});

export const evaluateSubmission = mutation({
  args: {
    submissionId: v.id("lmsSubmissions"),
    score: v.number(),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { evaluateSubmission } = await import("../../convex/lmsFacultyEngine");
    return evaluateSubmission.handler(ctx, args);
  },
});

export const listSubmissions = query({
  args: { courseId: v.optional(v.id("lmsCourses")) },
  handler: async (ctx, args) => {
    const { listSubmissions } = await import("../../convex/lmsFacultyEngine");
    return listSubmissions.handler(ctx, args);
  },
});

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
    const { createQuiz } = await import("../../convex/lmsFacultyEngine");
    return createQuiz.handler(ctx, args);
  },
});

export const addQuizQuestion = mutation({
  args: {
    quizId: v.id("lmsQuizzes"),
    questionId: v.id("lmsQuestionBank"),
  },
  handler: async (ctx, args) => {
    const { addQuizQuestion } = await import("../../convex/lmsFacultyEngine");
    return addQuizQuestion.handler(ctx, args);
  },
});

export const publishQuiz = mutation({
  args: { id: v.id("lmsQuizzes") },
  handler: async (ctx, args) => {
    const { publishQuiz } = await import("../../convex/lmsFacultyEngine");
    return publishQuiz.handler(ctx, args);
  },
});

export const getQuizWithQuestions = query({
  args: { id: v.id("lmsQuizzes") },
  handler: async (ctx, args) => {
    const { getQuizWithQuestions } = await import("../../convex/lmsFacultyEngine");
    return getQuizWithQuestions.handler(ctx, args);
  },
});

export const listQuizzes = query({
  args: {
    courseId: v.optional(v.id("lmsCourses")),
    lessonId: v.optional(v.id("lmsLessons")),
  },
  handler: async (ctx, args) => {
    const { listQuizzes } = await import("../../convex/lmsFacultyEngine");
    return listQuizzes.handler(ctx, args);
  },
});

export const getFacultyDashboard = query({
  args: { facultyId: v.id("users") },
  handler: async (ctx, args) => {
    const { getFacultyDashboard } = await import("../../convex/lmsFacultyEngine");
    return getFacultyDashboard.handler(ctx, args);
  },
});

// ─── Analytics SDK — lmsPlatform ────────────────────────────────────────

export const getLmsAnalytics = query({
  handler: async (ctx) => {
    const { getLmsAnalytics } = await import("../../convex/lmsPlatform");
    return getLmsAnalytics.handler(ctx, {});
  },
});

export const getFacultyCourseAnalytics = query({
  args: { facultyId: v.id("users") },
  handler: async (ctx, args) => {
    const { getFacultyCourseAnalytics } = await import("../../convex/lmsPlatform");
    return getFacultyCourseAnalytics.handler(ctx, args);
  },
});
