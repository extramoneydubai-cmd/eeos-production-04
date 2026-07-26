import { defineTable } from "convex/server";
import { v } from "convex/values";

export const calendarTables = {
  calendarEvents: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    eventType: v.string(),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    allDay: v.boolean(),
    location: v.optional(v.string()),
    color: v.optional(v.string()),
    recurrence: v.optional(v.string()),
    recurrenceEnd: v.optional(v.number()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
    assignedTo: v.optional(v.id("users")),
    participants: v.optional(v.array(v.id("users"))),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    status: v.string(),
    reminderMinutes: v.optional(v.number()),
    attachmentIds: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("startTime", ["startTime"])
    .index("ownerId", ["ownerId"])
    .index("assignedTo", ["assignedTo"])
    .index("eventType", ["eventType"])
    .index("status", ["status"])
    .index("entityType_entityId", ["entityType", "entityId"])
    .index("by_company", ["companyId", "startTime"])
    .index("by_branch", ["branchId", "startTime"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
};
