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
    .index("documentType", ["documentType"]),
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
    .index("status", ["status"]),
  personProfiles: defineTable({
    personId: v.id("personMaster"),
    profileType: v.string(),
    profileReferenceId: v.optional(v.string()),
    active: v.boolean(),
    primaryProfile: v.boolean(),
    displayLabel: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    metadata: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("profileType", ["profileType"])
    .index("personId_profileType", ["personId", "profileType"]),
  personQRCode: defineTable({
    personId: v.id("personMaster"),
    qrToken: v.string(),
    deepLink: v.string(),
    qrImage: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("qrToken", ["qrToken"]),
};