import { defineTable } from "convex/server";
import { v } from "convex/values";

export const peopleTables = {
  personDocuments: defineTable({
    personId: v.id("personMaster"),
    documentType: v.string(),
    documentName: v.optional(v.string()),
    fileReference: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    expiryDate: v.optional(v.number()),
    verified: v.boolean(),
    verifiedBy: v.optional(v.id("users")),
    verifiedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("personId", ["personId"])
    .index("documentType", ["documentType"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  personMaster: defineTable({
    firstName: v.string(),
    middleName: v.optional(v.string()),
    lastName: v.string(),
    displayName: v.optional(v.string()),
    preferredName: v.optional(v.string()),
    profilePhoto: v.optional(v.string()),
    gender: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()),
    nationality: v.optional(v.string()),
    maritalStatus: v.optional(v.string()),
    bloodGroup: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),
    timezone: v.optional(v.string()),
    status: v.string(),
    notes: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("displayName", ["displayName"])
    .index("status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
};