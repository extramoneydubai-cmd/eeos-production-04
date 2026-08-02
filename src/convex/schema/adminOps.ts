/**
 * Administration Operations Schema — PATCH-ERP-003 Phase 3
 *
 * Persistence for the Administration Workspace. These tables did not exist
 * anywhere in the platform — genuine persistence, so the workspace is fully
 * functional rather than a mock. All reads/writes flow through
 * `adminOpsEngine`.
 *
 * Tables:
 *   visitors         — visitor passes with QR + approval workflow
 *   meetingRooms     — bookable meeting/training rooms
 *   officeAssets     — office equipment register
 *   stationery       — stationery inventory (stock + reorder level)
 *   housekeepingTasks— daily/periodic housekeeping schedule
 *   securityChecks   — security round/check register
 *   utilityBills     — electricity/water/internet/gas bill tracking
 *   amcContracts     — annual maintenance contracts
 *   vendorVisits     — vendor entry/exit register
 *   incidentRegister — facilities/operations incident log
 */
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const adminOpsTables = {
  visitors: defineTable({
    name: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    company: v.optional(v.string()),
    purpose: v.optional(v.string()),
    hostUserId: v.optional(v.id("users")),
    hostName: v.optional(v.string()),
    qrToken: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("denied"),
      v.literal("checked_in"),
      v.literal("checked_out")
    ),
    checkIn: v.optional(v.number()),
    checkOut: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_qrToken", ["qrToken"])
    .index("by_createdAt", ["createdAt"]),

  meetingRooms: defineTable({
    name: v.string(),
    code: v.optional(v.string()),
    capacity: v.optional(v.number()),
    location: v.optional(v.string()),
    amenities: v.optional(v.array(v.string())),
    status: v.union(
      v.literal("available"),
      v.literal("booked"),
      v.literal("maintenance")
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"]),

  officeAssets: defineTable({
    name: v.string(),
    assetCode: v.optional(v.string()),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    status: v.union(
      v.literal("active"),
      v.literal("in_use"),
      v.literal("maintenance"),
      v.literal("retired")
    ),
    purchaseDate: v.optional(v.number()),
    value: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_category", ["category"]),

  stationery: defineTable({
    name: v.string(),
    sku: v.optional(v.string()),
    unit: v.optional(v.string()),
    quantity: v.number(),
    minStock: v.optional(v.number()),
    supplier: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  housekeepingTasks: defineTable({
    taskName: v.string(),
    area: v.optional(v.string()),
    assignee: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
    scheduledDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"]),

  securityChecks: defineTable({
    checkName: v.string(),
    area: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("passed"),
      v.literal("failed")
    ),
    performedBy: v.optional(v.string()),
    checkedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"]),

  utilityBills: defineTable({
    utilityType: v.union(
      v.literal("electricity"),
      v.literal("water"),
      v.literal("internet"),
      v.literal("gas"),
      v.literal("other")
    ),
    billNumber: v.optional(v.string()),
    amount: v.number(),
    dueDate: v.optional(v.number()),
    paidDate: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("overdue")
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"]),

  amcContracts: defineTable({
    vendor: v.string(),
    assetType: v.optional(v.string()),
    contractNumber: v.optional(v.string()),
    amount: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: v.union(
      v.literal("active"),
      v.literal("expiring"),
      v.literal("expired")
    ),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  vendorVisits: defineTable({
    vendorName: v.string(),
    purpose: v.optional(v.string()),
    hostUserId: v.optional(v.id("users")),
    hostName: v.optional(v.string()),
    checkIn: v.optional(v.number()),
    checkOut: v.optional(v.number()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("checked_in"),
      v.literal("checked_out"),
      v.literal("cancelled")
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"]),

  incidentRegister: defineTable({
    incidentType: v.string(),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    description: v.string(),
    location: v.optional(v.string()),
    reportedBy: v.optional(v.id("users")),
    status: v.union(
      v.literal("open"),
      v.literal("investigating"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    resolution: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_severity", ["severity"]),
};
