import { defineTable } from "convex/server";
import { v } from "convex/values";

export const schedulingTables = {
  schedules: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    scheduleType: v.string(),
    status: v.string(),
    priority: v.optional(v.string()),
    start: v.number(),
    end: v.number(),
    timezone: v.optional(v.string()),
    allDay: v.optional(v.boolean()),
    recurrence: v.optional(v.string()),
    recurrenceEnd: v.optional(v.number()),
    owner: v.optional(v.id("users")),
    participants: v.optional(v.array(v.id("users"))),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    resourceId: v.optional(v.id("schedulingResources")),
    capacity: v.optional(v.number()),
    currentBookings: v.optional(v.number()),
    approvalRequired: v.optional(v.boolean()),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    waitingList: v.optional(v.array(v.id("users"))),
    organizationId: v.optional(v.id("organizations")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    tags: v.optional(v.array(v.string())),
    templateId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdBy: v.optional(v.id("users")),
    updatedBy: v.optional(v.id("users")),
    completedAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    cancelReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("start", ["start"])
    .index("end", ["end"])
    .index("owner", ["owner"])
    .index("entity", ["entityType", "entityId"])
    .index("resource", ["resourceId"])
    .index("status", ["status"])
    .index("company", ["companyId", "start"])
    .index("branch", ["branchId", "start"])
    .index("department", ["departmentId", "start"])
    .index("scheduleType", ["scheduleType"])
    .index("templateId", ["templateId"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),

  schedulingResources: defineTable({
    name: v.string(),
    resourceType: v.string(),
    description: v.optional(v.string()),
    capacity: v.number(),
    location: v.optional(v.string()),
    status: v.string(),
    workingHours: v.optional(
      v.object({
        monday: v.optional(v.object({ start: v.string(), end: v.string() })),
        tuesday: v.optional(v.object({ start: v.string(), end: v.string() })),
        wednesday: v.optional(v.object({ start: v.string(), end: v.string() })),
        thursday: v.optional(v.object({ start: v.string(), end: v.string() })),
        friday: v.optional(v.object({ start: v.string(), end: v.string() })),
        saturday: v.optional(v.object({ start: v.string(), end: v.string() })),
        sunday: v.optional(v.object({ start: v.string(), end: v.string() })),
      })
    ),
    holidayCalendarId: v.optional(v.string()),
    approvalRequired: v.optional(v.boolean()),
    bookingRules: v.optional(v.any()),
    imageUrl: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("resourceType", ["resourceType"])
    .index("status", ["status"])
    .index("company", ["companyId"])
    .index("branch", ["branchId"])
    .index("department", ["departmentId"]),

  schedulingBookings: defineTable({
    scheduleId: v.id("schedules"),
    resourceId: v.optional(v.id("schedulingResources")),
    userId: v.optional(v.id("users")),
    status: v.string(),
    approvalStatus: v.optional(v.string()),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    attended: v.optional(v.boolean()),
    feedback: v.optional(v.string()),
    feedbackRating: v.optional(v.number()),
    waitingListPosition: v.optional(v.number()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("scheduleId", ["scheduleId"])
    .index("resourceId", ["resourceId"])
    .index("userId", ["userId"])
    .index("status", ["status"])
    .index("company", ["companyId"])
    .index("branch", ["branchId"]),
};
