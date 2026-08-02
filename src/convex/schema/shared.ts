import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.SUPER_ADMIN),
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.MANAGER),
  v.literal(ROLES.STAFF),
);

export const TASK_STATUS = {
  BACKLOG: "backlog",
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  REVIEW: "review",
  DONE: "done",
} as const;

export const taskStatusValidator = v.union(
  v.literal(TASK_STATUS.BACKLOG),
  v.literal(TASK_STATUS.TODO),
  v.literal(TASK_STATUS.IN_PROGRESS),
  v.literal(TASK_STATUS.REVIEW),
  v.literal(TASK_STATUS.DONE),
);

export const PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;

export const priorityValidator = v.union(
  v.literal(PRIORITY.LOW),
  v.literal(PRIORITY.MEDIUM),
  v.literal(PRIORITY.HIGH),
  v.literal(PRIORITY.CRITICAL),
);

export const APPROVAL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
} as const;

export const approvalStatusValidator = v.union(
  v.literal(APPROVAL_STATUS.PENDING),
  v.literal(APPROVAL_STATUS.APPROVED),
  v.literal(APPROVAL_STATUS.REJECTED),
  v.literal(APPROVAL_STATUS.CANCELLED),
);

export const NOTIFICATION_TYPE = {
  TASK: "task",
  APPROVAL: "approval",
  MESSAGE: "message",
  MENTION: "mention",
  ANNOUNCEMENT: "announcement",
  PAYMENT: "payment",
  CONVERSION: "conversion",
  LEAD: "lead",
} as const;

export const notificationTypeValidator = v.union(
  v.literal(NOTIFICATION_TYPE.TASK),
  v.literal(NOTIFICATION_TYPE.APPROVAL),
  v.literal(NOTIFICATION_TYPE.MESSAGE),
  v.literal(NOTIFICATION_TYPE.MENTION),
  v.literal(NOTIFICATION_TYPE.ANNOUNCEMENT),
  v.literal(NOTIFICATION_TYPE.PAYMENT),
  v.literal(NOTIFICATION_TYPE.CONVERSION),
  v.literal(NOTIFICATION_TYPE.LEAD),
);

export const APPROVAL_MODE = {
  MANUAL: "manual",
  SEQUENTIAL: "sequential",
  PARALLEL: "parallel",
  HIERARCHY: "hierarchy",
} as const;

export const approvalModeValidator = v.union(
  v.literal(APPROVAL_MODE.MANUAL),
  v.literal(APPROVAL_MODE.SEQUENTIAL),
  v.literal(APPROVAL_MODE.PARALLEL),
  v.literal(APPROVAL_MODE.HIERARCHY),
);

// ─── Form Field Types ─────────────────────────────────────────────

export const FORM_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
  DEACTIVATED: "deactivated",
} as const;

export const formStatusValidator = v.union(
  v.literal(FORM_STATUS.DRAFT),
  v.literal(FORM_STATUS.PUBLISHED),
  v.literal(FORM_STATUS.ARCHIVED),
  v.literal(FORM_STATUS.DEACTIVATED),
);

export const FIELD_TYPES = [
  "text", "textarea", "number", "currency", "date", "time", "datetime",
  "email", "phone", "whatsapp", "url", "password",
  "dropdown", "multi_select", "radio", "checkbox", "toggle",
  "file_upload", "image_upload", "signature", "qr_scanner", "barcode",
  "lookup", "branch_lookup", "department_lookup", "course_lookup",
  "employee_lookup", "user_lookup", "student_lookup", "parent_lookup",
  "table_grid", "section", "divider", "heading", "html", "label", "hidden",
  "formula", "auto_number", "system_field",
] as const;

export const fieldTypeValidator = v.union(
  ...FIELD_TYPES.map((t) => v.literal(t)),
);

export const SUBMISSION_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  VALIDATED: "validated",
  DUPLICATE: "duplicate",
  ROUTING: "routing",
  COMPLETED: "completed",
  REJECTED: "rejected",
} as const;

export const submissionStatusValidator = v.union(
  v.literal(SUBMISSION_STATUS.DRAFT),
  v.literal(SUBMISSION_STATUS.SUBMITTED),
  v.literal(SUBMISSION_STATUS.VALIDATED),
  v.literal(SUBMISSION_STATUS.DUPLICATE),
  v.literal(SUBMISSION_STATUS.ROUTING),
  v.literal(SUBMISSION_STATUS.COMPLETED),
  v.literal(SUBMISSION_STATUS.REJECTED),
);

export const sharedTables = {
  accessAuditLogs: defineTable({
    userId: v.id("users"),
    module: v.string(),
    recordId: v.optional(v.string()),
    action: v.string(),
    result: v.union(v.literal("granted"), v.literal("denied")),
    reason: v.optional(v.string()),
    timestamp: v.number(),
    createdAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("module", ["module"])
    .index("timestamp", ["timestamp"])
    .index("userId_timestamp", ["userId", "timestamp"])
    .index("by_created", ["createdAt"]),
  actionPermissions: defineTable({
    designationId: v.id("designations"),
    module: v.string(),
    action: v.string(),
    allowed: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("designationId", ["designationId"])
    .index("module", ["module"])
    .index("designationId_module_action", ["designationId", "module", "action"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  addresses: defineTable({
    personId: v.id("personMaster"),
    addressType: v.union(v.literal("home"), v.literal("office"), v.literal("billing"), v.literal("shipping"), v.literal("permanent"), v.literal("current"), v.literal("emergency")),
    line1: v.optional(v.string()),
    line2: v.optional(v.string()),
    area: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    isPrimary: v.boolean(),
    label: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("personId", ["personId"])
    .index("addressType", ["addressType"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  analyticsSnapshots: defineTable({
    snapshotType: v.string(),
    period: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    data: v.string(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("snapshotType_period", ["snapshotType", "period"])
    .index("createdAt", ["createdAt"]),
  assessments: defineTable({
    candidateId: v.id("candidates"),
    assessmentType: v.string(),
    score: v.optional(v.number()),
    maxScore: v.optional(v.number()),
    evaluator: v.id("users"),
    result: v.union(
      v.literal("pending"), v.literal("pass"),
      v.literal("fail"),
    ),
    remarks: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("candidateId", ["candidateId"])
    .index("evaluator", ["evaluator"])
    .index("by_created", ["createdAt"]),
  branchMetrics: defineTable({
    branchId: v.id("branches"),
    period: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    newLeads: v.number(),
    activeLeads: v.number(),
    demoRate: v.number(),
    trialRate: v.number(),
    admissionRate: v.number(),
    revenue: v.number(),
    pendingFollowups: v.number(),
    slaCompliance: v.number(),
    counselorCount: v.number(),
    createdAt: v.number(),
  })
    .index("branchId", ["branchId"])
    .index("period", ["period"])
    .index("by_created", ["createdAt"]),
  candidates: defineTable({
    personId: v.id("personMaster"),
    jobPostingId: v.optional(v.id("jobPostings")),
    source: v.string(),
    appliedPosition: v.string(),
    expectedSalary: v.optional(v.number()),
    currentSalary: v.optional(v.number()),
    noticePeriod: v.optional(v.number()),
    experience: v.optional(v.number()),
    resumeUrl: v.optional(v.string()),
    status: v.union(
      v.literal("applied"), v.literal("screening"),
      v.literal("shortlisted"), v.literal("interview_scheduled"),
      v.literal("interview_completed"), v.literal("assessment"),
      v.literal("offer_pending"), v.literal("offer_accepted"),
      v.literal("hired"), v.literal("employee_created"),
      v.literal("rejected"), v.literal("archived"),
    ),
    rejectionReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("personId", ["personId"])
    .index("jobPostingId", ["jobPostingId"])
    .index("status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  categoryPermissions: defineTable({
    designationId: v.id("designations"),
    category: v.string(),
    canDiscover: v.boolean(),
    canOpen: v.boolean(),
    canCreate: v.boolean(),
    canEdit: v.boolean(),
    canDelete: v.boolean(),
    canExport: v.boolean(),
    canPrint: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("designationId", ["designationId"])
    .index("category", ["category"])
    .index("designationId_category", ["designationId", "category"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  communicationLogs: defineTable({
    queueId: v.id("communicationQueue"),
    action: v.string(),
    status: v.string(),
    details: v.optional(v.string()),
    metadata: v.optional(v.string()),
    performedAt: v.number(),
  })
    .index("queueId", ["queueId"])
    .index("queueId_performedAt", ["queueId", "performedAt"])
    .index("by_status", ["status"]),
  communicationPreferences: defineTable({
    userId: v.optional(v.id("users")),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    channel: v.union(v.literal("email"), v.literal("whatsapp"), v.literal("sms"), v.literal("push"), v.literal("in_app")),
    category: v.string(),
    enabled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("userId_category", ["userId", "category"])
    .index("entityType", ["entityType"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  communicationQueue: defineTable({
    templateId: v.optional(v.id("communicationTemplates")),
    channel: v.union(v.literal("email"), v.literal("whatsapp"), v.literal("sms"), v.literal("push"), v.literal("in_app")),
    recipientId: v.optional(v.string()),
    recipientType: v.optional(v.string()),
    recipientAddress: v.string(),
    recipientName: v.optional(v.string()),
    subject: v.optional(v.string()),
    body: v.string(),
    variables: v.optional(v.string()),
    status: v.union(
      v.literal("queued"), v.literal("processing"),
      v.literal("sent"), v.literal("delivered"),
      v.literal("read"), v.literal("failed"),
      v.literal("retrying"), v.literal("cancelled"),
    ),
    priority: v.union(v.literal("low"), v.literal("normal"), v.literal("high"), v.literal("urgent")),
    scheduledAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    readAt: v.optional(v.number()),
    failedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    retryCount: v.number(),
    maxRetries: v.number(),
    campaignId: v.optional(v.id("messageCampaigns")),
    referenceType: v.optional(v.string()),
    referenceId: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("status", ["status"])
    .index("channel", ["channel"])
    .index("recipientId", ["recipientId"])
    .index("scheduledAt", ["scheduledAt"])
    .index("campaignId", ["campaignId"])
    .index("referenceType", ["referenceType"])
    .index("createdAt", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  communicationTemplates: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    channel: v.union(v.literal("email"), v.literal("whatsapp"), v.literal("sms"), v.literal("push"), v.literal("in_app")),
    subject: v.optional(v.string()),
    body: v.string(),
    variables: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    isActive: v.boolean(),
    isSystem: v.boolean(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("code", ["code"])
    .index("channel", ["channel"])
    .index("category", ["category"])
    .index("isActive", ["isActive"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  contactMethods: defineTable({
    personId: v.id("personMaster"),
    type: v.string(),
    label: v.optional(v.string()),
    value: v.string(),
    countryCode: v.optional(v.string()),
    preferred: v.boolean(),
    verified: v.boolean(),
    verifiedAt: v.optional(v.number()),
    visibility: v.union(v.literal("public"), v.literal("organization"), v.literal("department"), v.literal("private"), v.literal("emergency_only")),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("personId", ["personId"])
    .index("type", ["type"])
    .index("value", ["value"])
    .index("personId_type", ["personId", "type"])
    .index("type_value", ["type", "value"])
    .index("by_active", ["isActive"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  conversionFunnels: defineTable({
    period: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    totalInquiries: v.number(),
    stageBreakdown: v.string(),
    dropOffRates: v.string(),
    conversionRate: v.number(),
    createdAt: v.number(),
  })
    .index("period", ["period"])
    .index("by_created", ["createdAt"]),
  counselorMetrics: defineTable({
    userId: v.id("users"),
    period: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    assignedLeads: v.number(),
    callsMade: v.number(),
    meetingsHeld: v.number(),
    followupsCompleted: v.number(),
    conversions: v.number(),
    lostLeads: v.number(),
    revenueGenerated: v.number(),
    avgResponseTime: v.number(),
    winRate: v.number(),
    score: v.number(),
    createdAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("period", ["period"])
    .index("score", ["score"])
    .index("by_created", ["createdAt"]),
  dashboardLayouts: defineTable({
    name: v.string(),
    userId: v.optional(v.id("users")),
    role: v.optional(v.string()),
    isDefault: v.boolean(),
    widgets: v.string(),
    layoutConfig: v.optional(v.string()),
    filters: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("role", ["role"])
    .index("by_active", ["isActive"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  dashboardWidgets: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    widgetType: v.string(),
    dataSource: v.optional(v.string()),
    defaultConfig: v.optional(v.string()),
    defaultSize: v.optional(v.string()),
    allowedRoles: v.optional(v.array(v.string())),
    isSystem: v.boolean(),
    isActive: v.boolean(),
    displayOrder: v.number(),
    category: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("code", ["code"])
    .index("widgetType", ["widgetType"])
    .index("category", ["category"])
    .index("isActive", ["isActive"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  deliveryStatus: defineTable({
    queueId: v.id("communicationQueue"),
    provider: v.string(),
    providerMessageId: v.optional(v.string()),
    status: v.string(),
    timestamp: v.number(),
    details: v.optional(v.string()),
    errorCode: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  })
    .index("queueId", ["queueId"])
    .index("status", ["status"])
    .index("providerMessageId", ["providerMessageId"]),
  demoActivities: defineTable({
    action: v.string(),
    entity: v.optional(v.string()),
    userName: v.optional(v.string()),
    userRole: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_created", ["createdAt"]),
  demoAdmissions: defineTable({
    studentName: v.string(),
    studentEmail: v.optional(v.string()),
    program: v.optional(v.string()),
    grade: v.optional(v.string()),
    status: v.string(),
    assignedTo: v.optional(v.id("demoProfiles")),
    assignedToRole: v.optional(v.string()),
    feeQuoted: v.optional(v.number()),
    feePaid: v.optional(v.number()),
    source: v.optional(v.string()),
    followUpDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  demoAttachments: defineTable({
    name: v.string(),
    type: v.string(),
    size: v.optional(v.number()),
    url: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    createdAt: v.number(),
  })
    .index("entityType", ["entityType"])
    .index("by_created", ["createdAt"]),
  demoAuditRecords: defineTable({
    action: v.string(),
    entity: v.string(),
    userId: v.optional(v.id("demoProfiles")),
    userName: v.optional(v.string()),
    userRole: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("action", ["action"])
    .index("by_user", ["userId"])
    .index("by_created", ["createdAt"]),
  demoComments: defineTable({
    content: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    userName: v.optional(v.string()),
    userRole: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("entityType", ["entityType"])
    .index("by_created", ["createdAt"]),
  demoDepartments: defineTable({
    name: v.string(),
    code: v.string(),
    organizationId: v.optional(v.id("demoOrganizations")),
    displayOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("code", ["code"])
    .index("by_org", ["organizationId"])
    .index("by_active", ["isActive"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  demoLeads: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    source: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    assignedTo: v.optional(v.id("demoProfiles")),
    assignedToRole: v.optional(v.string()),
    score: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_assigned", ["assignedTo"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  demoNotifications: defineTable({
    title: v.string(),
    message: v.string(),
    type: v.optional(v.string()),
    userId: v.optional(v.id("demoProfiles")),
    role: v.optional(v.string()),
    isRead: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_role", ["role"])
    .index("by_user", ["userId"])
    .index("by_created", ["createdAt"]),
  demoOrganizations: defineTable({
    name: v.string(),
    code: v.string(),
    type: v.optional(v.string()),
    parentId: v.optional(v.id("demoOrganizations")),
    address: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("type", ["type"])
    .index("by_active", ["isActive"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  demoProfiles: defineTable({
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    employeeId: v.optional(v.string()),
    designation: v.optional(v.string()),
    demoRole: v.optional(v.string()),
    departmentId: v.optional(v.id("demoDepartments")),
    teamIds: v.optional(v.array(v.id("demoTeams"))),
    branchId: v.optional(v.id("demoOrganizations")),
    userId: v.optional(v.id("users")),
    status: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
    displayOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_role", ["demoRole"])
    .index("by_order", ["displayOrder"])
    .index("by_branch", ["branchId"])
    .index("by_dept", ["departmentId"])
    .index("by_employee", ["employeeId"])
    .index("by_status", ["status"])
    .index("by_active", ["isActive"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  demoStudents: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    grade: v.optional(v.string()),
    section: v.optional(v.string()),
    parentId: v.optional(v.id("demoProfiles")),
    parentName: v.optional(v.string()),
    parentEmail: v.optional(v.string()),
    parentPhone: v.optional(v.string()),
    enrollmentDate: v.optional(v.number()),
    status: v.optional(v.string()),
    attendance: v.number(),
    performance: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  demoTasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    taskType: v.optional(v.string()),
    priority: v.optional(v.string()),
    status: v.optional(v.string()),
    assignedTo: v.optional(v.id("demoProfiles")),
    assignedToRole: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_role", ["assignedToRole"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  demoTeams: defineTable({
    name: v.string(),
    code: v.string(),
    departmentId: v.optional(v.id("demoDepartments")),
    displayOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("code", ["code"])
    .index("by_dept", ["departmentId"])
    .index("by_active", ["isActive"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  demoTimelineEvents: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    eventType: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    userName: v.string(),
    createdAt: v.number(),
  })
    .index("entityType", ["entityType"])
    .index("by_created", ["createdAt"]),
  emergencyContacts: defineTable({
    ownerPersonId: v.id("personMaster"),
    contactPersonId: v.id("personMaster"),
    relationship: v.string(),
    priority: v.number(),
    notes: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("ownerPersonId", ["ownerPersonId"])
    .index("contactPersonId", ["contactPersonId"])
    .index("ownerPersonId_priority", ["ownerPersonId", "priority"])
    .index("by_active", ["isActive"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  employeeHistory: defineTable({
    employeeId: v.id("employeeMaster"),
    eventType: v.string(),
    eventName: v.optional(v.string()),
    oldValue: v.optional(v.string()),
    newValue: v.optional(v.string()),
    changedBy: v.id("employeeMaster"),
    remarks: v.optional(v.string()),
    metadata: v.optional(v.string()),
    changedAt: v.number(),
    createdAt: v.number(),
  })
    .index("employeeId", ["employeeId"])
    .index("employeeId_changedAt", ["employeeId", "changedAt"])
    .index("eventType", ["eventType"])
    .index("by_created", ["createdAt"]),
  employeeQualifications: defineTable({
    employeeId: v.id("employeeMaster"),
    qualification: v.string(),
    institute: v.optional(v.string()),
    year: v.optional(v.number()),
    grade: v.optional(v.string()),
    fieldOfStudy: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("employeeId", ["employeeId"])
    .index("by_created", ["createdAt"]),
  employeeSkills: defineTable({
    employeeId: v.id("employeeMaster"),
    skill: v.string(),
    proficiency: v.union(
      v.literal("beginner"), v.literal("intermediate"),
      v.literal("advanced"), v.literal("expert"),
    ),
    certification: v.optional(v.string()),
    experienceYears: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("employeeId", ["employeeId"])
    .index("skill", ["skill"])
    .index("by_created", ["createdAt"]),
  examMarks: defineTable({
    examSessionId: v.id("examSessions"),
    examSubjectId: v.optional(v.id("examSubjects")),
    studentId: v.id("personMaster"),
    marksObtained: v.optional(v.number()),
    totalMarks: v.number(),
    percentage: v.optional(v.number()),
    grade: v.optional(v.string()),
    gradePoint: v.optional(v.number()),
    attendance: v.union(
      v.literal("present"), v.literal("absent"),
      v.literal("medical"), v.literal("leave"),
    ),
    graceMarks: v.optional(v.number()),
    moderatedMarks: v.optional(v.number()),
    moderatedBy: v.optional(v.id("users")),
    moderatedAt: v.optional(v.number()),
    moderationNotes: v.optional(v.string()),
    remarks: v.optional(v.string()),
    enteredBy: v.optional(v.id("users")),
    enteredAt: v.optional(v.number()),
    verifiedBy: v.optional(v.id("users")),
    verifiedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("examSessionId", ["examSessionId"])
    .index("examSubjectId", ["examSubjectId"])
    .index("studentId", ["studentId"])
    .index("enteredBy", ["enteredBy"])
    .index("examSessionId_studentId", ["examSessionId", "studentId"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  examPublishLog: defineTable({
    examSessionId: v.id("examSessions"),
    action: v.string(),
    performedBy: v.id("users"),
    remarks: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("examSessionId", ["examSessionId"])
        .index("action", ["action"])
    .index("by_created", ["createdAt"]),
  examReportCards: defineTable({
    examSessionId: v.id("examSessions"),
    studentId: v.id("personMaster"),
    resultId: v.id("examResults"),
    reportData: v.string(),
    pdfUrl: v.optional(v.string()),
    generatedAt: v.number(),
    downloadedAt: v.optional(v.number()),
    downloadCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("examSessionId", ["examSessionId"])
    .index("studentId", ["studentId"])
    .index("resultId", ["resultId"])
    .index("generatedAt", ["generatedAt"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  examResults: defineTable({
    examSessionId: v.id("examSessions"),
    studentId: v.id("personMaster"),
    totalMarks: v.number(),
    marksObtained: v.number(),
    percentage: v.number(),
    cgpa: v.optional(v.number()),
    grade: v.optional(v.string()),
    rank: v.optional(v.number()),
    division: v.union(
      v.literal("distinction"), v.literal("first"),
      v.literal("second"), v.literal("third"),
      v.literal("fail"),
    ),
    passFail: v.union(v.literal("pass"), v.literal("fail"), v.literal("supplementary")),
    subjectResults: v.optional(v.string()),
    calculatedAt: v.number(),
    publishedAt: v.optional(v.number()),
    publishedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("examSessionId", ["examSessionId"])
    .index("studentId", ["studentId"])
    .index("passFail", ["passFail"])
    .index("rank", ["rank"])
    .index("examSessionId_studentId", ["examSessionId", "studentId"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  examSubjects: defineTable({
    examSessionId: v.id("examSessions"),
    subjectId: v.id("academicSubjects"),
    maxMarks: v.number(),
    passPercentage: v.optional(v.number()),
    weightage: v.optional(v.number()),
    examDate: v.optional(v.number()),
    duration: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("examSessionId", ["examSessionId"])
    .index("subjectId", ["subjectId"])
    .index("examSessionId_subjectId", ["examSessionId", "subjectId"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  examTimeline: defineTable({
    examSessionId: v.id("examSessions"),
    eventType: v.string(),
    description: v.string(),
    userId: v.optional(v.id("users")),
    metadata: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("examSessionId", ["examSessionId"])
    .index("eventType", ["eventType"])
    .index("examSessionId_createdAt", ["examSessionId", "createdAt"])
    .index("by_user", ["userId"]),
  examTimetable: defineTable({
    examSessionId: v.id("examSessions"),
    subjectId: v.id("academicSubjects"),
    facultyId: v.optional(v.id("users")),
    roomId: v.optional(v.id("academicClassrooms")),
    examDate: v.number(),
    startTime: v.number(),
    endTime: v.number(),
    duration: v.optional(v.number()),
    maxMarks: v.number(),
    passPercentage: v.optional(v.number()),
    instructions: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("examSessionId", ["examSessionId"])
    .index("subjectId", ["subjectId"])
    .index("examDate", ["examDate"])
    .index("facultyId", ["facultyId"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  fieldPermissions: defineTable({
    designationId: v.id("designations"),
    module: v.string(),
    fieldName: v.string(),
    visible: v.boolean(),
    editable: v.boolean(),
    masked: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("designationId", ["designationId"])
    .index("module", ["module"])
    .index("designationId_module", ["designationId", "module"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  forecastSnapshots: defineTable({
    forecastType: v.string(),
    period: v.string(),
    forecastDate: v.number(),
    predictedAdmissions: v.number(),
    predictedRevenue: v.number(),
    confidenceInterval: v.optional(v.string()),
    actualAdmissions: v.optional(v.number()),
    actualRevenue: v.optional(v.number()),
    accuracy: v.optional(v.number()),
    methodology: v.string(),
    data: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("forecastType_period", ["forecastType", "period"])
    .index("forecastDate", ["forecastDate"])
    .index("by_created", ["createdAt"]),
  intakeDuplicateRules: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    matchFields: v.array(v.string()),
    matchType: v.union(v.literal("any"), v.literal("all"), v.literal("custom")),
    action: v.union(v.literal("ignore"), v.literal("merge"), v.literal("keep_both"), v.literal("review")),
    targetFormIds: v.optional(v.array(v.id("forms"))),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("isActive", ["isActive"])
    .index("action", ["action"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  intakeEvents: defineTable({
    submissionId: v.id("intakeSubmissions"),
    eventType: v.string(),
    status: v.string(),
    payload: v.optional(v.string()),
    processedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("submissionId", ["submissionId"])
    .index("eventType", ["eventType"])
    .index("status", ["status"])
    .index("by_created", ["createdAt"]),
  intakeRoutingRules: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    targetModule: v.string(),
    conditionField: v.optional(v.string()),
    conditionValue: v.optional(v.string()),
    conditionOperator: v.optional(v.string()),
    sourceFormIds: v.optional(v.array(v.id("forms"))),
    defaultRoute: v.boolean(),
    priority: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("targetModule", ["targetModule"])
    .index("isActive", ["isActive"])
    .index("priority", ["priority"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  intakeSubmissions: defineTable({
    submissionNumber: v.string(),
    formId: v.optional(v.id("forms")),
    formCode: v.optional(v.string()),
    formVersion: v.optional(v.number()),
    source: v.string(),
    payload: v.string(),
    createdBy: v.optional(v.id("users")),
    submittedBy: v.optional(v.string()),
    submissionDate: v.number(),
    ipAddress: v.optional(v.string()),
    browser: v.optional(v.string()),
    device: v.optional(v.string()),
    processingStatus: v.string(),
    validationStatus: v.optional(v.string()),
    verificationStatus: v.optional(v.string()),
    duplicateStatus: v.optional(v.string()),
    routingStatus: v.optional(v.string()),
    targetModule: v.optional(v.string()),
    targetEntityId: v.optional(v.string()),
    retryCount: v.optional(v.number()),
    processingTime: v.optional(v.number()),
    validationReport: v.optional(v.string()),
    duplicateReason: v.optional(v.string()),
    systemNotes: v.optional(v.string()),
    metadata: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("submissionNumber", ["submissionNumber"])
    .index("source", ["source"])
    .index("processingStatus", ["processingStatus"])
    .index("targetModule", ["targetModule"])
    .index("formId", ["formId"])
    .index("createdAt", ["createdAt"])
    .index("processingStatus_createdAt", ["processingStatus", "createdAt"])
    .index("by_updated", ["updatedAt"]),
  intakeTimeline: defineTable({
    submissionId: v.id("intakeSubmissions"),
    action: v.string(),
    status: v.string(),
    details: v.optional(v.string()),
    performedBy: v.optional(v.id("users")),
    metadata: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("submissionId", ["submissionId"])
    .index("submissionId_createdAt", ["submissionId", "createdAt"])
    .index("action", ["action"])
    .index("by_status", ["status"]),
  intakeTransformMappings: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    sourceField: v.string(),
    targetField: v.string(),
    targetModule: v.string(),
    transformation: v.optional(v.string()),
    defaultValue: v.optional(v.string()),
    isRequired: v.boolean(),
    sourceFormIds: v.optional(v.array(v.id("forms"))),
    isActive: v.boolean(),
    displayOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("targetModule", ["targetModule"])
    .index("isActive", ["isActive"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  interviewRounds: defineTable({
    candidateId: v.id("candidates"),
    roundName: v.string(),
    interviewerIds: v.array(v.id("users")),
    schedule: v.number(),
    mode: v.union(
      v.literal("online"), v.literal("offline"),
      v.literal("phone"), v.literal("video"),
      v.literal("in_person"),
    ),
    duration: v.optional(v.number()),
    result: v.optional(v.union(
      v.literal("pending"), v.literal("passed"),
      v.literal("failed"), v.literal("rescheduled"),
      v.literal("scheduled"), v.literal("completed"),
    )),
    score: v.optional(v.number()),
    remarks: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("candidateId", ["candidateId"])
    .index("schedule", ["schedule"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  jobPostings: defineTable({
    requisitionId: v.id("jobRequisitions"),
    title: v.string(),
    description: v.optional(v.string()),
    skills: v.array(v.string()),
    locations: v.array(v.string()),
    applicationDeadline: v.optional(v.number()),
    status: v.union(
      v.literal("draft"), v.literal("published"),
      v.literal("closed"), v.literal("cancelled"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("requisitionId", ["requisitionId"])
    .index("status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  jobRequisitions: defineTable({
    departmentId: v.id("organizationDepartments"),
    designationId: v.optional(v.id("organizationDesignations")),
    companyId: v.optional(v.id("organizationCompanies")),
    branchId: v.optional(v.id("organizationBranches")),
    requestedBy: v.id("users"),
    vacancies: v.number(),
    employmentType: v.string(),
    salaryRange: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("draft"), v.literal("pending_approval"),
      v.literal("approved"), v.literal("rejected"),
      v.literal("filled"), v.literal("cancelled"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("departmentId", ["departmentId"])
    .index("requestedBy", ["requestedBy"])
    .index("status", ["status"])
    .index("by_company", ["companyId"])
    .index("by_branch", ["branchId"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  kpiDefinitions: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    unit: v.optional(v.string()),
    formula: v.optional(v.string()),
    target: v.optional(v.number()),
    minimum: v.optional(v.number()),
    maximum: v.optional(v.number()),
    frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("quarterly"), v.literal("yearly")),
    dataSource: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("code", ["code"])
    .index("category", ["category"])
    .index("isActive", ["isActive"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),

  // ─── Notifications ────────────────────────────────────────
  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    referenceId: v.optional(v.string()),
    referenceType: v.optional(v.string()),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("userId_isRead", ["userId", "isRead"])
    .index("by_created", ["createdAt"]),
};