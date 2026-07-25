import { defineTable } from "convex/server";
import { v } from "convex/values";

export const examinationTables = {
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
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("code", ["code"])
    .index("by_active", ["isActive"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
};