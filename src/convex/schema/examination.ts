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
    duration: v.optional(v.number()),
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
    // Migration state: legacy rows reference orgBranches, new seed uses branches.
    branchId: v.union(v.id("branches"), v.id("orgBranches")),
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

  // ─── Exam Subjects ─────────────────────────────────────────────────
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
    building: v.optional(v.string()),
    floor: v.optional(v.number()),
    block: v.optional(v.string()),
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
    rules: v.string(),
    defaultPassPercentage: v.number(),
    applicableTo: v.optional(v.array(v.string())),
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
    subjectResults: v.optional(v.string()),
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
    reportData: v.string(),
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

  // ═══════════════════════════════════════════════════════════════════
  // ENTERPRISE TABLES (PATCH-EEOS-013A)
  // ═══════════════════════════════════════════════════════════════════

  // ─── Configurable Assessment Types (Part 1) ───────────────────────
  assessmentTypes: defineTable({
    name: v.string(),
    code: v.string(),
    category: v.union(
      v.literal("unit_test"), v.literal("weekly_test"),
      v.literal("monthly_test"), v.literal("quarterly"),
      v.literal("half_yearly"), v.literal("annual"),
      v.literal("mock_test"), v.literal("assignment"),
      v.literal("practical"), v.literal("lab"),
      v.literal("project"), v.literal("viva"),
      v.literal("internal_assessment"), v.literal("external_assessment"),
      v.literal("skill_assessment"), v.literal("olympiad"),
      v.literal("entrance_test"), v.literal("custom"),
    ),
    description: v.optional(v.string()),
    maxMarks: v.number(),
    passingMarks: v.optional(v.number()),
    weightage: v.optional(v.number()),
    gradingScheme: v.optional(v.string()),
    evaluationModel: v.union(
      v.literal("marks"), v.literal("grades"),
      v.literal("percentage"), v.literal("gpa"),
      v.literal("cgpa"), v.literal("pass_fail"),
      v.literal("rubric"), v.literal("competency"),
      v.literal("narrative"), v.literal("custom_formula"),
    ),
    attendanceRequired: v.optional(v.boolean()),
    isActive: v.boolean(),
    metadata: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("code", ["code"])
    .index("category", ["category"])
    .index("by_active", ["isActive"])
    .index("by_created", ["createdAt"]),

  // ─── Board/University Rule Profiles (Part 3) ──────────────────────
  boardRules: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    boardType: v.union(
      v.literal("cbse"), v.literal("icse"),
      v.literal("state_board"), v.literal("ib"),
      v.literal("cambridge"), v.literal("university"),
      v.literal("coaching"), v.literal("corporate"),
      v.literal("custom"),
    ),
    passingPercentage: v.number(),
    graceRules: v.optional(v.string()),       // JSON
    moderationRules: v.optional(v.string()),   // JSON
    internalWeightage: v.optional(v.number()),
    externalWeightage: v.optional(v.number()),
    attendanceEligibility: v.optional(v.number()),
    promotionRules: v.optional(v.string()),     // JSON
    rankingRules: v.optional(v.string()),       // JSON
    supplementaryRules: v.optional(v.string()),  // JSON
    isActive: v.boolean(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("code", ["code"])
    .index("boardType", ["boardType"])
    .index("by_active", ["isActive"])
    .index("by_created", ["createdAt"]),

  // ─── Question Paper Management (Part 9) ───────────────────────────
  examQuestionPapers: defineTable({
    examSessionId: v.id("examSessions"),
    examSubjectId: v.id("examSubjects"),
    title: v.string(),
    version: v.number(),
    status: v.union(
      v.literal("draft"), v.literal("review"),
      v.literal("approved"), v.literal("locked"),
      v.literal("released"), v.literal("archived"),
    ),
    blueprint: v.optional(v.string()),        // JSON
    fileUrl: v.optional(v.string()),
    totalMarks: v.number(),
    duration: v.optional(v.number()),
    instructions: v.optional(v.string()),
    sections: v.optional(v.string()),          // JSON
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    releasedAt: v.optional(v.number()),
    releasedBy: v.optional(v.id("users")),
    printCount: v.optional(v.number()),
    lastPrintedAt: v.optional(v.number()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("examSessionId", ["examSessionId"])
    .index("examSubjectId", ["examSubjectId"])
    .index("status", ["status"])
    .index("by_created", ["createdAt"]),

  // ─── Examination Incidents (Part 8) ───────────────────────────────
  examIncidents: defineTable({
    examSessionId: v.id("examSessions"),
    timetableId: v.optional(v.id("examTimetable")),
    incidentType: v.union(
      v.literal("cheating"), v.literal("malpractice"),
      v.literal("mobile_usage"), v.literal("misconduct"),
      v.literal("late_arrival"), v.literal("medical_emergency"),
      v.literal("paper_leak"), v.literal("technical_issue"),
      v.literal("room_issue"), v.literal("other"),
    ),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    description: v.string(),
    reportedBy: v.id("users"),
    reportedAt: v.number(),
    studentIds: v.optional(v.array(v.id("personMaster"))),
    invigilatorId: v.optional(v.id("users")),
    status: v.union(
      v.literal("reported"), v.literal("under_review"),
      v.literal("committee_review"), v.literal("resolved"),
      v.literal("appealed"), v.literal("closed"),
    ),
    committeeMembers: v.optional(v.array(v.id("users"))),
    actionTaken: v.optional(v.string()),
    penalty: v.optional(v.string()),
    resolution: v.optional(v.string()),
    resolvedBy: v.optional(v.id("users")),
    resolvedAt: v.optional(v.number()),
    appealDetails: v.optional(v.string()),
    appealStatus: v.optional(v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected"))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("examSessionId", ["examSessionId"])
    .index("incidentType", ["incidentType"])
    .index("severity", ["severity"])
    .index("status", ["status"])
    .index("reportedBy", ["reportedBy"])
    .index("by_created", ["createdAt"]),

  // ─── Revaluation & Supplementary (Part 4) ─────────────────────────
  examRevaluation: defineTable({
    examSessionId: v.id("examSessions"),
    studentId: v.id("personMaster"),
    examSubjectId: v.id("examSubjects"),
    revaluationType: v.union(
      v.literal("rechecking"), v.literal("revaluation"),
      v.literal("grace_marks"), v.literal("improvement"),
      v.literal("supplementary"), v.literal("backlog"),
      v.literal("carry_forward"),
    ),
    originalMarks: v.number(),
    requestedMarks: v.optional(v.number()),
    revisedMarks: v.optional(v.number()),
    fee: v.optional(v.number()),
    status: v.union(
      v.literal("requested"), v.literal("under_review"),
      v.literal("approved"), v.literal("rejected"),
      v.literal("completed"),
    ),
    remarks: v.optional(v.string()),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    resultAfterReval: v.optional(v.string()),    // JSON
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("examSessionId", ["examSessionId"])
    .index("studentId", ["studentId"])
    .index("examSubjectId", ["examSubjectId"])
    .index("status", ["status"])
    .index("revaluationType", ["revaluationType"])
    .index("by_created", ["createdAt"]),

  // ─── Academic Promotions (Part 10) ────────────────────────────────
  examPromotions: defineTable({
    studentId: v.id("personMaster"),
    fromCourseId: v.optional(v.id("courses")),
    fromBatchId: v.optional(v.id("academicBatches")),
    fromSemesterId: v.optional(v.id("academicSemesters")),
    fromAcademicSessionId: v.optional(v.id("academicSessions")),
    toCourseId: v.optional(v.id("courses")),
    toBatchId: v.optional(v.id("academicBatches")),
    toSemesterId: v.optional(v.id("academicSemesters")),
    toAcademicSessionId: v.optional(v.id("academicSessions")),
    promotionType: v.union(
      v.literal("promote"), v.literal("detain"),
      v.literal("conditional"), v.literal("supplementary_required"),
      v.literal("improvement_required"), v.literal("repeat_semester"),
      v.literal("repeat_course"), v.literal("transfer"),
      v.literal("withdraw"),
    ),
    examSessionId: v.optional(v.id("examSessions")),
    percentage: v.optional(v.number()),
    grade: v.optional(v.string()),
    decision: v.string(),
    approvedBy: v.id("users"),
    approvedAt: v.number(),
    remarks: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("studentId", ["studentId"])
    .index("examSessionId", ["examSessionId"])
    .index("promotionType", ["promotionType"])
    .index("by_created", ["createdAt"]),

  // ─── Certificates (Part 11) ───────────────────────────────────────
  examCertificates: defineTable({
    studentId: v.id("personMaster"),
    examSessionId: v.id("examSessions"),
    certificateType: v.union(
      v.literal("marksheet"), v.literal("passing_certificate"),
      v.literal("merit_certificate"), v.literal("rank_certificate"),
      v.literal("participation"), v.literal("custom"),
    ),
    certificateNumber: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    digitalVerificationId: v.optional(v.string()),
    qrCodeUrl: v.optional(v.string()),
    issuedDate: v.number(),
    issuedBy: v.id("users"),
    metadata: v.optional(v.string()),
    expiryDate: v.optional(v.number()),
    isVerified: v.optional(v.boolean()),
    downloadCount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("studentId", ["studentId"])
    .index("examSessionId", ["examSessionId"])
    .index("certificateType", ["certificateType"])
    .index("certificateNumber", ["certificateNumber"])
    .index("by_issued", ["issuedDate"]),
};
