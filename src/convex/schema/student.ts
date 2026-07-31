import { defineTable } from "convex/server";
import { v } from "convex/values";

export const studentTables = {
  studentMaster: defineTable({
    studentCode: v.string(),
    personId: v.id("personMaster"),
    leadId: v.optional(v.id("leadMaster")),
    admissionNumber: v.string(),
    rollNumber: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    status: v.optional(v.string()),
    batchId: v.optional(v.id("academicBatches")),
    courseId: v.optional(v.id("courses")),
    verticalId: v.optional(v.id("verticals")),
    chequeRestricted: v.optional(v.boolean()),
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
    .index("admissionNumber", ["admissionNumber"])
    .index("rollNumber", ["rollNumber"])
    .index("leadId", ["leadId"])
    .index("currentStatus", ["currentStatus"])
    .index("branchId", ["branchId"])
    .index("academicYearId", ["academicYearId"])
    .index("by_org", ["organizationId"])
    .index("by_company", ["companyId"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
};