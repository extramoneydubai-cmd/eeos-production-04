/**
 * Enterprise Schema Restoration (PATCH-ENTERPRISE-021)
 *
 * These tables are referenced across engines (insert/query/patch/v.id) but were
 * never added to the modular schema — pre-existing schema drift that codegen's
 * typecheck had been masking (an empty @types/d3-shape dir caused tsc to abort
 * during config resolution, hiding all semantic errors).
 *
 * Per the "nothing may reference a missing collection" mandate, every
 * referenced table is now defined. Tables are declared with `v.any()`
 * documents — the same convention used by `extendedUsersTable` — so engine
 * documents with heterogeneous fields are never rejected by schema validation.
 * Indexes match the `.withIndex()` calls engines actually make.
 */
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const enterpriseTables = {
  // ─── Admissions / Alumni ───────────────────────────────────
  admissions: defineTable(v.any()),
  alumniRecords: defineTable(v.any()),

  // ─── Admin / Platform Ops ──────────────────────────────────
  apiKeys: defineTable(v.any()),
  authConfig: defineTable(v.any()),
  backupRecords: defineTable(v.any()),
  scheduledJobs: defineTable(v.any()),
  systemConfig: defineTable(v.any()),
  webhooks: defineTable(v.any()),

  // ─── Approval Runtime ──────────────────────────────────────
  approvalRequestApprovers: defineTable(v.any()).index("requestId", ["requestId"]),
  approvalRequests: defineTable(v.any())
    .index("requesterId", ["requesterId"])
    .index("status", ["status"])
    .index("userId_isRead", ["userId", "isRead"]),
  approvalTemplates: defineTable(v.any()),

  // ─── Rules / Business Config ───────────────────────────────
  assignmentRules: defineTable(v.any()).index("isActive", ["isActive"]),
  businessRules: defineTable(v.any())
    .index("by_type", ["ruleType"])
    .index("domain", ["domain"])
    .index("domain_key", ["domain", "key"]),
  refundPolicies: defineTable(v.any()),
  slaPolicies: defineTable(v.any()),

  // ─── Audit / Observability ─────────────────────────────────
  auditLogs: defineTable(v.any()).index("by_entity", ["entity", "entityId"]),
  dashboardRefreshSignals: defineTable(v.any()).index("module_entity", ["module", "entity"]),
  entityTimeline: defineTable(v.any()).index("by_entity", ["entityType", "entityId"]),
  events: defineTable(v.any()),
  integrationAuditRecords: defineTable(v.any()),
  timelineEvents: defineTable(v.any()),

  // ─── Campaigns / Communication ─────────────────────────────
  campaignSchedules: defineTable(v.any()),
  campaigns: defineTable(v.any()),
  commCampaigns: defineTable(v.any()),
  commTemplates: defineTable(v.any()),
  marketingCampaigns: defineTable(v.any()),
  messageCampaigns: defineTable(v.any()),
  notificationCenter: defineTable(v.any())
    .index("userId", ["userId"])
    .index("userId_isRead", ["userId", "isRead"]),

  // ─── Certificates / Documents ──────────────────────────────
  certificates: defineTable(v.any()).index("verificationUrl", ["verificationUrl"]),
  consentRecords: defineTable(v.any())
    .index("consentTemplateId", ["consentTemplateId"])
    .index("studentId", ["studentId"]),
  consentTemplates: defineTable(v.any()),
  documentGenerationQueue: defineTable(v.any()),
  documentRecords: defineTable(v.any()),
  documentTemplates: defineTable(v.any()),
  generatedDocuments: defineTable(v.any()),
  receiptTemplates: defineTable(v.any()),

  // ─── Counselling / CRM ─────────────────────────────────────
  counselorWorkloads: defineTable(v.any()).index("period", ["period"]),
  leadEscalations: defineTable(v.any())
    .index("leadId", ["leadId"])
    .index("status", ["status"]),

  // ─── Finance / Billing ─────────────────────────────────────
  feeAccounts: defineTable(v.any()).index("studentId", ["studentId"]),
  feeRefunds: defineTable(v.any()).index("studentId", ["studentId"]),
  gstRecords: defineTable(v.any()),
  payrollEntries: defineTable(v.any()),
  payrollRecords: defineTable(v.any()),
  receipts: defineTable(v.any()),
  refundTransactions: defineTable(v.any()),

  // ─── HR / Talent ───────────────────────────────────────────
  candidateTimeline: defineTable(v.any()),
  employees: defineTable(v.any()),
  exitClearanceItems: defineTable(v.any()),
  exitRecords: defineTable(v.any()),
  experienceLetters: defineTable(v.any()),
  fullFinalSettlements: defineTable(v.any()),
  onboardingTasks: defineTable(v.any())
    .index("assignedTo", ["assignedTo"])
    .index("candidateId", ["candidateId"]),
  offers: defineTable(v.any()).index("candidateId", ["candidateId"]),
  performanceGoals: defineTable(v.any()),
  performanceReviews: defineTable(v.any()),
  recruitmentTimeline: defineTable(v.any()),

  // ─── Inventory / Procurement ───────────────────────────────
  inventoryAudit: defineTable(v.any()),
  inventoryStock: defineTable(v.any()),
  transfers: defineTable(v.any()),

  // ─── Knowledge / LMS ───────────────────────────────────────
  homework: defineTable(v.any()),
  knowledgeArticleVersions: defineTable(v.any()).index("articleId", ["articleId"]),
  questionBank: defineTable(v.any()),

  // ─── People / Identity ─────────────────────────────────────
  personProfiles: defineTable(v.any())
    .index("personId", ["personId"])
    .index("personId_profileType", ["personId", "profileType"])
    .index("profileType", ["profileType"]),
  personQRCode: defineTable(v.any())
    .index("personId", ["personId"])
    .index("qrToken", ["qrToken"]),
  socialLinks: defineTable(v.any()).index("personId", ["personId"]),
  userPreferences: defineTable(v.any()).index("userId", ["userId"]),
  userScopes: defineTable(v.any()).index("userId", ["userId"]),

  // ─── Record / Section Permissions ──────────────────────────
  recordPolicies: defineTable(v.any()).index("module_recordId", ["module", "recordId"]),
  sectionPermissions: defineTable(v.any()).index("designationId_module", ["designationId", "module"]),
  visibilityPolicies: defineTable(v.any()).index("policyCode", ["policyCode"]),

  // ─── Search ────────────────────────────────────────────────
  searchIndex: defineTable(v.any()),

  // ─── SLA / Escalation ──────────────────────────────────────
  slaViolations: defineTable(v.any())
    .index("leadId", ["leadId"])
    .index("status", ["status"])
    .index("violatedAt", ["violatedAt"]),

  // ─── Student lifecycle ─────────────────────────────────────
  guardianDetails: defineTable(v.any())
    .index("studentId", ["studentId"])
    .index("studentId_createdAt", ["studentId", "createdAt"]),
  studentAcademicAllocation: defineTable(v.any()),
  studentAcademicProfile: defineTable(v.any()).index("studentId", ["studentId"]),
  studentAchievements: defineTable(v.any()).index("studentId", ["studentId"]),
  studentAdmissions: defineTable(v.any()).index("studentId", ["studentId"]),
  studentDisciplinaryRecords: defineTable(v.any())
    .index("studentId", ["studentId"])
    .index("studentId_createdAt", ["studentId", "createdAt"]),
  studentDocuments: defineTable(v.any()).index("studentId", ["studentId"]),
  studentEnrollmentHistory: defineTable(v.any()).index("studentId_createdAt", ["studentId", "createdAt"]),
  studentMedicalProfile: defineTable(v.any()).index("studentId", ["studentId"]),
  studentStatusHistory: defineTable(v.any()).index("studentId_changedAt", ["studentId", "changedAt"]),
  studentTimeline: defineTable(v.any()).index("studentId_createdAt", ["studentId", "createdAt"]),

  // ─── Support / Assets / Academic ───────────────────────────
  assets: defineTable(v.any()),
  attendance: defineTable(v.any()),
  exams: defineTable(v.any()),
  examMaster: defineTable(v.any()),
  facultyAssignments: defineTable(v.any()),
  leaves: defineTable(v.any()),
  tickets: defineTable(v.any()),
  vendors: defineTable(v.any()),
  discounts: defineTable(v.any()),

  // ─── Verification ──────────────────────────────────────────
  verification_decisions: defineTable(v.any()).index("requestId", ["requestId"]),
  verification_requests: defineTable(v.any()),

  // ─── Workflow Runtime ──────────────────────────────────────
  workflowEdges: defineTable(v.any())
    .index("sourceNodeId", ["sourceNodeId"])
    .index("workflowId", ["workflowId"]),
  workflowInstances: defineTable(v.any()),
  workflowLogs: defineTable(v.any()).index("instanceId", ["instanceId"]),
  workflowNodes: defineTable(v.any()).index("workflowId", ["workflowId"]),
  workflows: defineTable(v.any()).index("code", ["code"]),
};
