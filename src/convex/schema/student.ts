import { defineTable } from "convex/server";
import { v } from "convex/values";

export const studentTables = {
  studentAcademicProfile: defineTable({
    studentId: v.id("studentMaster"),
    verticalId: v.optional(v.id("verticals")),
    subVerticalId: v.optional(v.id("subVerticals")),
    boardId: v.optional(v.id("boards")),
    courseId: v.optional(v.id("courses")),
    batchId: v.optional(v.id("academicBatches")),
    sectionId: v.optional(v.id("academicSections")),
    semesterId: v.optional(v.id("academicSemesters")),
    termId: v.optional(v.id("academicTerms")),
    currentYear: v.optional(v.number()),
    currentTerm: v.optional(v.string()),
    isCurrent: v.boolean(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("batchId", ["batchId"])
    .index("courseId", ["courseId"])
    .index("isCurrent", ["isCurrent"]),
  studentAchievements: defineTable({
    studentId: v.id("studentMaster"),
    title: v.string(),
    category: v.string(),
    description: v.optional(v.string()),
    issuedBy: v.optional(v.string()),
    issueDate: v.optional(v.number()),
    certificateUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("category", ["category"]),
  studentAdmissions: defineTable({
    studentId: v.id("studentMaster"),
    leadId: v.optional(v.id("leadMaster")),
    admissionNumber: v.string(),
    admissionType: v.optional(v.string()),
    courseId: v.optional(v.id("courses")),
    batchId: v.optional(v.id("academicBatches")),
    totalFee: v.optional(v.number()),
    discountAmount: v.optional(v.number()),
    finalFee: v.optional(v.number()),
    installmentCount: v.optional(v.number()),
    admittedBy: v.id("users"),
    status: v.string(),
    decisionDate: v.optional(v.number()),
    remarks: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  studentDisciplinaryRecords: defineTable({
    studentId: v.id("studentMaster"),
    incident: v.string(),
    actionTaken: v.string(),
    status: v.union(v.literal("open"), v.literal("resolved"), v.literal("appealed"), v.literal("closed")),
    incidentDate: v.optional(v.number()),
    reportedBy: v.optional(v.id("users")),
    resolutionDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  studentMaster: defineTable({
    studentCode: v.string(),
    personId: v.id("personMaster"),
    leadId: v.optional(v.id("leadMaster")),
    admissionNumber: v.string(),
    rollNumber: v.optional(v.string()),
    enrollmentDate: v.number(),
    currentStatus: v.union(
      v.literal("enquiry"), v.literal("lead"),
      v.literal("qualified"), v.literal("trial"),
      v.literal("admitted"), v.literal("active"),
      v.literal("completed"), v.literal("alumni"),
      v.literal("cancelled"),
    ),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    organizationId: v.optional(v.id("organizations")),
    academicYearId: v.optional(v.id("academicSessions")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("studentCode", ["studentCode"])
    .index("personId", ["personId"])
    .index("rollNumber", ["rollNumber"])
    .index("leadId", ["leadId"])
    .index("currentStatus", ["currentStatus"])
    .index("branchId", ["branchId"])
    .index("academicYearId", ["academicYearId"])
    .index("by_org", ["organizationId"])
    .index("by_company", ["companyId"]),
  studentMedicalProfile: defineTable({
    studentId: v.id("studentMaster"),
    allergies: v.optional(v.string()),
    medicalConditions: v.optional(v.string()),
    bloodGroup: v.optional(v.string()),
    doctorName: v.optional(v.string()),
    doctorContact: v.optional(v.string()),
    insuranceInfo: v.optional(v.string()),
    emergencyNotes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  studentStatusHistory: defineTable({
    studentId: v.id("studentMaster"),
    fromStatus: v.optional(v.string()),
    toStatus: v.string(),
    remarks: v.optional(v.string()),
    changedBy: v.id("users"),
    changedAt: v.number(),
    createdAt: v.number(),
  })
    .index("studentId_changedAt", ["studentId", "changedAt"]),
  studentTimeline: defineTable({
    studentId: v.id("studentMaster"),
    eventType: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    metadata: v.optional(v.string()),
    performedBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("studentId_createdAt", ["studentId", "createdAt"]),
};