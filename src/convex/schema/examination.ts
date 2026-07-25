import { defineTable } from "convex/server";
import { v } from "convex/values";

export const examinationTables = {
  // ─── Exam Templates ────────────────────────────────────────────────
  examTemplates: defineTable({
    name: v.string(),
    code: v.string(),
    examType: v.union(
      v.literal("unit_test"), v.literal("weekly_test"),
      v.literal("monthly_test"), v.literal("mid_term"),
      v.literal("final_exam"), v.literal("practical"),
      v.literal("viva"), v.literal("mock_test"),
      v.literal("custom"),
    ),
    description: v.optional(v.string()),
    duration: v.optional(v.number()),          // minutes
    maxMarks: v.number(),
    passPercentage: v.number(),
    weightage: v.optional(v.number()),
    gradeScheme: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("code", ["code"])
    .index("by_active", ["isActive"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),

  // ─── Exam Sessions ─────────────────────────────────────────────────
  examSessions: defineTable({
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
    status: v.union(
      v.literal("draft"), v.literal("scheduled"),
      v.literal("in_progress"), v.literal("completed"),
      v.literal("published"), v.literal("archived"),
    ),
    instructions: v.optional(v.string()),
    metadata: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("templateId", ["templateId"])
    .index("academicSessionId", ["academicSessionId"])
    .index("branchId", ["branchId"])
    .index("batchId", ["batchId"])
    .index("status", ["status"])
    .index("startDate", ["startDate"])
    .index("by_course", ["courseId"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),

  // ─── Exam Subjects (subjects within a session) ────────────────────
  examSubjects: defineTable({
    examSessionId: v.id("examSessions"),
    subjectId: v.id("academicSubjects"),
    maxMarks: v.number(),
    passPercentage: v.optional(v.number()),
    weightage: v.optional(v.number()),
    examDate: v.optional(v.number()),
    duration: v.optional(v.number()),
    isCompulsory: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("examSessionId", ["examSessionId"])
    .index("subjectId", ["subjectId"])
    .index("by_exam_subject", ["examSessionId", "subjectId"]),

  // ─── Exam Timetable ───────────────────────────────────────────────
  examTimetable: defineTable({
    examSessionId: v.id("examSessions"),
    subjectId: v.id("examSubjects"),
    facultyId: v.optional(v.id("users")),
    roomId: v.optional(v.id("academicClassrooms")),
    examDate: v.number(),
    startTime: v.number(),
    endTime: v.number(),
    duration: v.optional(v.number()),
    maxMarks: v.number(),
    passPercentage: v.optional(v.number()),
    instructions: v.optional(v.string()),
    hallAllocated: v.optional(v.boolean()),
    hallCapacity: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("examSessionId", ["examSessionId"])
    .index("subjectId", ["subjectId"])
    .index("roomId", ["roomId"])
    .index("examDate", ["examDate"])
    .index("facultyId", ["facultyId"])
    .index("by_session_date", ["examSessionId", "examDate"]),

  // ─── Hall Allocation ──────────────────────────────────────────────
  examHallAllocation: defineTable({
    timetableId: v.id("examTimetable"),
    examSessionId: v.id("examSessions"),
    roomId: v.id("academicClassrooms"),
    studentId: v.id("personMaster"),
    seatNumber: v.optional(v.string()),
    benchNumber: v.optional(v.string()),
    column: v.optional(v.number()),
    row: v.optional(v.number()),
    additionalInfo: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("timetableId", ["timetableId"])
    .index("examSessionId", ["examSessionId"])
    .index("studentId", ["studentId"])
    .index("roomId", ["roomId"])
    .index("by_session_student", ["examSessionId", "studentId"]),

  // ─── Exam Attendance ─────────────────────────────────────────────
  examAttendance: defineTable({
    examSessionId: v.id("examSessions"),
    timetableId: v.id("examTimetable"),
    studentId: v.id("personMaster"),
    subjectId: v.id("examSubjects"),
    status: v.union(
      v.literal("present"), v.literal("absent"),
      v.literal("medical"), v.literal("leave"),
    ),
    markedBy: v.optional(v.id("users")),
    markedAt: v.optional(v.number()),
    remarks: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("examSessionId", ["examSessionId"])
    .index("timetableId", ["timetableId"])
    .index("studentId", ["studentId"])
    .index("subjectId", ["subjectId"])
    .index("by_session_student", ["examSessionId", "studentId"]),

  // ─── Exam Marks ───────────────────────────────────────────────────
  examMarks: defineTable({
    examSessionId: v.id("examSessions"),
    examSubjectId: v.optional(v.id("examSubjects")),
    studentId: v.id("personMaster"),
    marksObtained: v.optional(v.number()),
    totalMarks: v.number(),
    percentage: v.optional(v.number()),
    attendance: v.union(
      v.literal("present"), v.literal("absent"),
      v.literal("medical"), v.literal("leave"),
    ),
    graceMarks: v.optional(v.number()),
    // Moderation fields
    moderatedMarks: v.optional(v.number()),
    moderatedBy: v.optional(v.id("users")),
    moderatedAt: v.optional(v.number()),
    moderationNotes: v.optional(v.string()),
    remarks: v.optional(v.string()),
    enteredBy: v.optional(v.id("users")),
    enteredAt: v.optional(v.number()),
    verifiedBy: v.optional(v.id("users")),
    verifiedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("examSessionId", ["examSessionId"])
    .index("examSubjectId", ["examSubjectId"])
    .index("studentId", ["studentId"])
    .index("by_session_student", ["examSessionId", "studentId"])
    .index("by_session_subject", ["examSessionId", "examSubjectId"])
    .index("by_entered", ["enteredBy"])
    .index("by_verified", ["verifiedBy"]),

  // ─── Configurable Grade Rules ─────────────────────────────────────
  examGradeRules: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    // Rules stored as JSON array of { minPct, maxPct, grade, gradePoint, division }
    rules: v.string(),
    defaultPassPercentage: v.number(),
    applicableTo: v.optional(v.array(v.string())), // template IDs or "all"
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("code", ["code"])
    .index("by_active", ["isActive"])
    .index("by_created", ["createdAt"]),

  // ─── Exam Results ─────────────────────────────────────────────────
  examResults: defineTable({
    examSessionId: v.id("examSessions"),
    studentId: v.id("personMaster"),
    totalMarks: v.number(),
    marksObtained: v.number(),
    percentage: v.number(),
    cgpa: v.optional(v.number()),
    grade: v.string(),
    division: v.union(
      v.literal("distinction"), v.literal("first"),
      v.literal("second"), v.literal("third"),
      v.literal("fail"), v.literal("supplementary"),
    ),
    passFail: v.union(
      v.literal("pass"), v.literal("fail"),
      v.literal("supplementary"),
    ),
    rank: v.optional(v.number()),
    subjectResults: v.optional(v.string()), // JSON string of per-subject results
    calculatedAt: v.number(),
    publishedAt: v.optional(v.number()),
    publishedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("examSessionId", ["examSessionId"])
    .index("studentId", ["studentId"])
    .index("by_session_student", ["examSessionId", "studentId"])
    .index("rank", ["rank"])
    .index("passFail", ["passFail"])
    .index("publishedAt", ["publishedAt"]),

  // ─── Report Cards ─────────────────────────────────────────────────
  examReportCards: defineTable({
    examSessionId: v.id("examSessions"),
    studentId: v.id("personMaster"),
    resultId: v.id("examResults"),
    reportData: v.string(),          // Full JSON report data
    generatedAt: v.number(),
    downloadedAt: v.optional(v.number()),
    downloadCount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("examSessionId", ["examSessionId"])
    .index("studentId", ["studentId"])
    .index("resultId", ["resultId"])
    .index("by_session_student", ["examSessionId", "studentId"]),

  // ─── Publish Log / Workflow ───────────────────────────────────────
  examPublishLog: defineTable({
    examSessionId: v.id("examSessions"),
    action: v.union(
      v.literal("draft"), v.literal("scheduled"),
      v.literal("in_progress"), v.literal("completed"),
      v.literal("published"), v.literal("archived"),
      v.literal("moderation_requested"), v.literal("moderation_approved"),
      v.literal("moderation_rejected"),
    ),
    performedBy: v.id("users"),
    remarks: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("examSessionId", ["examSessionId"])
    .index("performedBy", ["performedBy"])
    .index("by_created", ["createdAt"]),

  // ─── Exam Timeline ────────────────────────────────────────────────
  examTimeline: defineTable({
    examSessionId: v.id("examSessions"),
    eventType: v.string(),
    description: v.optional(v.string()),
    metadata: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("examSessionId", ["examSessionId"])
    .index("by_type", ["eventType"])
    .index("by_created", ["createdAt"]),

  // ─── Invigilators ─────────────────────────────────────────────────
  examInvigilators: defineTable({
    timetableId: v.id("examTimetable"),
    invigilatorId: v.id("users"),
    role: v.union(v.literal("chief"), v.literal("assistant"), v.literal("alternate")),
    assignedAt: v.number(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("timetableId", ["timetableId"])
    .index("invigilatorId", ["invigilatorId"])
    .index("by_created", ["createdAt"]),
};
