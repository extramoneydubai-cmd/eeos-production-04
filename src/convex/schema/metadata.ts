import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Metadata Registry & Zero-Hardcode Validator schema tables.
 */
export const metadataTables = {
  // ─── Metadata Registry ──────────────────────────────────────
  metadataRegistry: defineTable({
    entityType: v.union(
      v.literal("module"), v.literal("form"), v.literal("field"),
      v.literal("dashboard"), v.literal("menu"), v.literal("workflow"),
      v.literal("notification"), v.literal("document"), v.literal("api"),
      v.literal("report"), v.literal("policy"), v.literal("automation"),
      v.literal("integration"), v.literal("extension"),
    ),
    entityId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    version: v.number(),
    status: v.union(
      v.literal("draft"), v.literal("testing"),
      v.literal("published"), v.literal("archived"),
      v.literal("deprecated"),
    ),
    owner: v.optional(v.string()),
    dependencies: v.optional(v.array(v.string())),
    usageCount: v.number(),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_entity", ["entityType", "entityId"])
    .index("by_entity_type", ["entityType"])
    .index("by_status", ["status"])
    .index("by_usage", ["usageCount"])
    .index("by_updated", ["updatedAt"]),

  // ─── White Label Config ──────────────────────────────────────
  whiteLabelConfig: defineTable({
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    companyName: v.optional(v.string()),
    config: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_branch", ["branchId"]),

  // ─── Metadata Version History ───────────────────────────────
  metadataHistory: defineTable({
    entityType: v.union(
      v.literal("module"), v.literal("form"), v.literal("field"),
      v.literal("dashboard"), v.literal("menu"), v.literal("workflow"),
      v.literal("notification"), v.literal("document"), v.literal("api"),
      v.literal("report"), v.literal("policy"), v.literal("automation"),
      v.literal("integration"), v.literal("extension"),
    ),
    entityId: v.string(),
    metadata: v.any(),
    version: v.number(),
    createdAt: v.number(),
  })
    .index("by_entity_history", ["entityType", "entityId"])
    .index("by_created", ["createdAt"]),

  // ─── Enterprise Health Metrics ──────────────────────────────
  healthMetrics: defineTable({
    metric: v.string(),
    value: v.number(),
    unit: v.string(),
    status: v.union(
      v.literal("healthy"), v.literal("warning"),
      v.literal("critical"), v.literal("unknown"),
    ),
    source: v.string(),
    metadata: v.optional(v.any()),
    recordedAt: v.number(),
  })
    .index("by_metric", ["metric"])
    .index("by_status", ["status"])
    .index("by_recorded", ["recordedAt"])
    .index("by_metric_recorded", ["metric", "recordedAt"]),

  // ─── Data Retention Policies ────────────────────────────────
  dataRetentionPolicies: defineTable({
    module: v.string(),
    entityType: v.string(),
    retentionDays: v.number(),
    softDelete: v.boolean(),
    archivalEnabled: v.boolean(),
    legalHold: v.boolean(),
    gdprExportable: v.boolean(),
    auditRetentionDays: v.optional(v.number()),
    backupRetentionDays: v.optional(v.number()),
    isActive: v.boolean(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_module", ["module"])
    .index("by_entity", ["entityType"])
    .index("by_active", ["isActive"]),

  // ─── Integration Connectors ─────────────────────────────────
  integrationConnectors: defineTable({
    connectorType: v.union(
      v.literal("whatsapp"), v.literal("sms"), v.literal("email"),
      v.literal("google"), v.literal("microsoft"), v.literal("zoom"), v.literal("teams"),
      v.literal("accounting"), v.literal("payment_gateway"),
      v.literal("biometric"), v.literal("face_recognition"),
      v.literal("rest"), v.literal("webhook"), v.literal("ftp"), v.literal("sftp"),
      v.literal("mqtt"), v.literal("graphql"),
      v.literal("lms"), v.literal("moodle"),
      v.literal("custom"),
    ),
    name: v.string(),
    config: v.any(),
    isActive: v.boolean(),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    lastTestedAt: v.optional(v.number()),
    lastUsedAt: v.optional(v.number()),
    errorCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_connector_type", ["connectorType"])
    .index("by_company", ["companyId"])
    .index("by_branch", ["branchId"])
    .index("by_active", ["isActive"]),

  // ─── Production Tasks ───────────────────────────────────────
  productionTasks: defineTable({
    title: v.string(),
    taskType: v.union(
      v.literal("content_writing"), v.literal("video_production"),
      v.literal("graphic_design"), v.literal("question_bank"),
      v.literal("review"), v.literal("publishing"),
      v.literal("recording"), v.literal("editing"),
    ),
    status: v.union(
      v.literal("assigned"), v.literal("in_progress"),
      v.literal("review"), v.literal("approved"),
      v.literal("published"), v.literal("rejected"),
    ),
    assignedTo: v.optional(v.string()),
    courseId: v.optional(v.id("courses")),
    dueDate: v.optional(v.number()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_task_type", ["taskType"])
    .index("by_assigned", ["assignedTo"])
    .index("by_created", ["createdAt"]),

  // ─── Attendance Records ─────────────────────────────────────
  // Universal shape: supports student (studentId) AND generic entities
  // (entityType/entityId) used by attendanceEngine, payrollEngine, attendanceSdk.
  attendanceRecords: defineTable({
    studentId: v.optional(v.id("personMaster")),
    studentName: v.optional(v.string()),
    batchId: v.optional(v.id("academicBatches")),
    entityType: v.optional(
      v.union(
        v.literal("student"), v.literal("employee"), v.literal("faculty"),
        v.literal("visitor"), v.literal("vendor"), v.literal("support"),
      ),
    ),
    entityId: v.optional(v.string()),
    date: v.number(),
    status: v.union(
      v.literal("present"), v.literal("absent"),
      v.literal("late"), v.literal("half_day"), v.literal("holiday"),
      v.literal("on_leave"),
    ),
    checkIn: v.optional(v.number()),
    checkOut: v.optional(v.number()),
    mode: v.optional(
      v.union(
        v.literal("manual"), v.literal("qr"), v.literal("face_recognition"),
        v.literal("biometric"), v.literal("gps"), v.literal("nfc"), v.literal("rfid"),
        v.literal("bulk_import"), v.literal("offline_sync"), v.literal("selfie"),
        v.literal("otp"), v.literal("api"), v.literal("webhook"),
      ),
    ),
    notes: v.optional(v.string()),
    branchId: v.optional(v.id("branches")),
    markedBy: v.optional(v.id("users")),
    remarks: v.optional(v.string()),
    // ─── Enterprise attendance fields (PATCH-ENTERPRISE-020) ─────
    shiftType: v.optional(v.union(v.literal("morning"), v.literal("evening"), v.literal("night"), v.literal("split"), v.literal("rotational"), v.literal("flexible"), v.literal("wfh"), v.literal("hybrid"))),
    shiftId: v.optional(v.string()),
    dutyType: v.optional(v.union(v.literal("office"), v.literal("field"), v.literal("remote"), v.literal("teaching"), v.literal("research"), v.literal("meeting"), v.literal("delivery"), v.literal("installation"), v.literal("repair"))),
    checkInLocation: v.optional(v.string()),
    checkOutLocation: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    geofenceVerified: v.optional(v.boolean()),
    geofenceDistanceM: v.optional(v.number()),
    deviceId: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    selfieUrl: v.optional(v.string()),
    otpVerified: v.optional(v.boolean()),
    hostApprovedBy: v.optional(v.id("users")),
    gatePassNumber: v.optional(v.string()),
    overtimeMinutes: v.optional(v.number()),
    breakMinutes: v.optional(v.number()),
    lectureTaken: v.optional(v.boolean()),
    substituteFor: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_batch", ["batchId"])
    .index("by_date", ["date"])
    .index("by_status", ["status"])
    .index("by_branch", ["branchId"])
    .index("by_shift", ["shiftType"])
    .index("by_duty", ["dutyType"])
    .index("by_batch_date", ["batchId", "date"])
    .index("entityType_entityId", ["entityType", "entityId"])
    .index("entityType_entityId_date", ["entityType", "entityId", "date"]),

  // ─── Attendance QR Tokens (PATCH-ATTENDANCE-VERIFY-001) ──────
  // One-time-use signed tokens issued per entity+date for QR verification.
  attendanceQrTokens: defineTable({
    token: v.string(),
    entityType: v.union(
      v.literal("student"), v.literal("employee"), v.literal("faculty"),
      v.literal("visitor"), v.literal("vendor"), v.literal("support"),
    ),
    entityId: v.string(),
    date: v.number(),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("entityType_entityId_date", ["entityType", "entityId", "date"]),

  // ─── Face Registrations (PATCH-ATTENDANCE-VERIFY-001) ────────
  // Reference photos used to verify face-based attendance marks.
  faceRegistrations: defineTable({
    entityType: v.union(
      v.literal("student"), v.literal("employee"), v.literal("faculty"),
      v.literal("visitor"), v.literal("vendor"), v.literal("support"),
    ),
    entityId: v.string(),
    photoStorageId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("entityType_entityId", ["entityType", "entityId"]),

  // ─── Branch Geofences (PATCH-ATTENDANCE-VERIFY-001) ──────────
  // GPS radius per branch used to verify in-location attendance.
  geofences: defineTable({
    branchId: v.id("branches"),
    name: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    radiusM: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_branch", ["branchId"])
    .index("by_active", ["isActive"]),
};
