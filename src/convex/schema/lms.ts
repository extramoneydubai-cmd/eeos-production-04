import { defineTable } from "convex/server";
import { v } from "convex/values";

export const lmsTables = {
  lmsAnnouncements: defineTable({
    courseId: v.id("lmsCourses"),
    title: v.string(),
    content: v.string(),
    createdBy: v.id("users"),
    priority: v.union(v.literal("normal"), v.literal("important"), v.literal("urgent")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("courseId", ["courseId"])
    .index("createdAt", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  lmsAssignments: defineTable({
    lessonId: v.id("lmsLessons"),
    courseId: v.id("lmsCourses"),
    title: v.string(),
    description: v.string(),
    maxScore: v.number(),
    passingScore: v.number(),
    dueDate: v.optional(v.number()),
    attachmentUrl: v.optional(v.string()),
    instructions: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("closed")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("lessonId", ["lessonId"])
    .index("courseId", ["courseId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  lmsCertificates: defineTable({
    courseId: v.id("lmsCourses"),
    studentId: v.id("studentMaster"),
    enrollmentId: v.id("lmsEnrollments"),
    certificateNumber: v.string(),
    issuedAt: v.number(),
    pdfUrl: v.optional(v.string()),
    metadata: v.optional(v.string()),
  })
    .index("courseId", ["courseId"])
    .index("studentId", ["studentId"])
    .index("certificateNumber", ["certificateNumber"]),
  lmsCourses: defineTable({
    title: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    academicSubjectId: v.optional(v.id("academicSubjects")),
    academicBatchId: v.optional(v.id("academicBatches")),
    academicSessionId: v.optional(v.id("academicSessions")),
    instructorId: v.id("users"),
    duration: v.optional(v.number()),
    difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    totalLessons: v.number(),
    totalDuration: v.optional(v.number()),
    enrolledCount: v.number(),
    completionRate: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("code", ["code"])
    .index("instructorId", ["instructorId"])
    .index("status", ["status"])
    .index("academicSubjectId", ["academicSubjectId"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  lmsDiscussions: defineTable({
    courseId: v.id("lmsCourses"),
    lessonId: v.optional(v.id("lmsLessons")),
    authorId: v.id("users"),
    content: v.string(),
    parentId: v.optional(v.id("lmsDiscussions")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("courseId", ["courseId"])
    .index("lessonId", ["lessonId"])
    .index("authorId", ["authorId"])
    .index("parentId", ["parentId"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  lmsEnrollments: defineTable({
    courseId: v.id("lmsCourses"),
    studentId: v.id("studentMaster"),
    enrolledAt: v.number(),
    completedAt: v.optional(v.number()),
    progress: v.number(),
    lastAccessedAt: v.optional(v.number()),
    status: v.union(
      v.literal("enrolled"), v.literal("in_progress"),
      v.literal("completed"), v.literal("dropped"),
    ),
  })
    .index("courseId", ["courseId"])
    .index("studentId", ["studentId"])
    .index("studentId_courseId", ["studentId", "courseId"])
    .index("status", ["status"]),
  lmsLessonProgress: defineTable({
    lessonId: v.id("lmsLessons"),
    courseId: v.id("lmsCourses"),
    studentId: v.id("studentMaster"),
    watchedDuration: v.optional(v.number()),
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    lastAccessedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("lessonId", ["lessonId"])
    .index("studentId", ["studentId"])
    .index("courseId", ["courseId"])
    .index("studentId_lessonId", ["studentId", "lessonId"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  lmsLessons: defineTable({
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
    isPublished: v.boolean(),
    publishedAt: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("courseId", ["courseId"])
    .index("courseId_orderIndex", ["courseId", "orderIndex"])
    .index("isPublished", ["isPublished"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  lmsQuizAttempts: defineTable({
    quizId: v.id("lmsQuizzes"),
    studentId: v.id("studentMaster"),
    attemptNumber: v.number(),
    answers: v.string(),
    score: v.number(),
    totalPoints: v.number(),
    percentage: v.number(),
    passed: v.boolean(),
    startedAt: v.number(),
    completedAt: v.number(),
    createdAt: v.number(),
  })
    .index("quizId", ["quizId"])
    .index("studentId", ["studentId"])
    .index("studentId_quizId", ["studentId", "quizId"])
    .index("by_created", ["createdAt"]),
  lmsQuizQuestions: defineTable({
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
    createdAt: v.number(),
  })
    .index("quizId", ["quizId"])
    .index("quizId_orderIndex", ["quizId", "orderIndex"])
    .index("by_created", ["createdAt"]),
  lmsQuizzes: defineTable({
    lessonId: v.id("lmsLessons"),
    courseId: v.id("lmsCourses"),
    title: v.string(),
    description: v.optional(v.string()),
    passingPercentage: v.number(),
    maxAttempts: v.optional(v.number()),
    timeLimit: v.optional(v.number()),
    shuffleQuestions: v.boolean(),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("closed")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("lessonId", ["lessonId"])
    .index("courseId", ["courseId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  lmsSubmissions: defineTable({
    assignmentId: v.id("lmsAssignments"),
    studentId: v.id("studentMaster"),
    submissionUrl: v.optional(v.string()),
    submissionData: v.optional(v.string()),
    score: v.optional(v.number()),
    percentage: v.optional(v.number()),
    feedback: v.optional(v.string()),
    evaluatedBy: v.optional(v.id("users")),
    evaluatedAt: v.optional(v.number()),
    status: v.union(
      v.literal("submitted"), v.literal("evaluated"),
      v.literal("resubmitted"), v.literal("passed"), v.literal("failed"),
    ),
    submittedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("assignmentId", ["assignmentId"])
    .index("studentId", ["studentId"])
    .index("status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  lmsTopics: defineTable({
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("lessonId", ["lessonId"])
    .index("lessonId_orderIndex", ["lessonId", "orderIndex"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
};