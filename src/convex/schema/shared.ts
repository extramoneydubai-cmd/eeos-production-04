import { authTables } from "@convex-dev/auth/server";
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

import { defineTable } from "convex/server";
import { v } from "convex/values";

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
    .index("timestamp", ["timestamp"])
    .index("userId_timestamp", ["userId", "timestamp"]),
  actionPermissions: defineTable({
    designationId: v.id("designations"),
    module: v.string(),
    action: v.string(),
    allowed: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("designationId_module_action", ["designationId", "module", "action"]),
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
    .index("addressType", ["addressType"]),
  analyticsSnapshots: defineTable({
    snapshotType: v.string(),
    period: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    data: v.string(),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("snapshotType_period", ["snapshotType", "period"]),
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
    .index("designationId_category", ["designationId", "category"]),
  companies: defineTable({
    name: v.string(),
    code: v.string(),
    companyType: v.optional(v.string()),
    status: v.optional(v.string()),
    parentType: v.optional(v.union(v.literal("group"))),
    parentId: v.optional(v.string()),
    departmentId: v.optional(v.id("departments")),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
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
    .index("value", ["value"])
    .index("personId_type", ["personId", "type"])
    .index("type_value", ["type", "value"]),
  conversionFunnels: defineTable({
    period: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    totalInquiries: v.number(),
    stageBreakdown: v.string(),
    dropOffRates: v.string(),
    conversionRate: v.number(),
    createdAt: v.number(),
  }),
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
    .index("score", ["score"]),
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
  }),
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
    .index("widgetType", ["widgetType"]),
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
  }),
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
  }),
  demoAttachments: defineTable({
    name: v.string(),
    type: v.string(),
    size: v.optional(v.number()),
    url: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    createdAt: v.number(),
  }),
  demoAuditRecords: defineTable({
    action: v.string(),
    entity: v.string(),
    userId: v.optional(v.id("demoProfiles")),
    userName: v.optional(v.string()),
    userRole: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("action", ["action"]),
  demoComments: defineTable({
    content: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    userName: v.optional(v.string()),
    userRole: v.optional(v.string()),
    createdAt: v.number(),
  }),
  demoDepartments: defineTable({
    name: v.string(),
    code: v.string(),
    organizationId: v.optional(v.id("demoOrganizations")),
    displayOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("code", ["code"])
    .index("by_org", ["organizationId"]),
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
    .index("by_assigned", ["assignedTo"]),
  demoNotifications: defineTable({
    title: v.string(),
    message: v.string(),
    type: v.optional(v.string()),
    userId: v.optional(v.id("demoProfiles")),
    role: v.optional(v.string()),
    isRead: v.optional(v.boolean()),
    createdAt: v.number(),
  }),
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
  }).index("type", ["type"]),
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
    .index("by_order", ["displayOrder"]),
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
  }),
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
  }),
  demoTeams: defineTable({
    name: v.string(),
    code: v.string(),
    departmentId: v.optional(v.id("demoDepartments")),
    displayOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("code", ["code"]),
  demoTimelineEvents: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    eventType: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    userName: v.string(),
    createdAt: v.number(),
  }),
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
    .index("ownerPersonId_priority", ["ownerPersonId", "priority"]),
  fieldPermissions: defineTable({
    designationId: v.id("designations"),
    module: v.string(),
    fieldName: v.string(),
    visible: v.boolean(),
    editable: v.boolean(),
    masked: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
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
    .index("forecastDate", ["forecastDate"]),
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
  }),
  notificationCenter: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    category: v.string(),
    priority: v.union(v.literal("low"), v.literal("normal"), v.literal("high"), v.literal("urgent")),
    channel: v.union(v.literal("email"), v.literal("whatsapp"), v.literal("sms"), v.literal("push"), v.literal("in_app")),
    referenceType: v.optional(v.string()),
    referenceId: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
    isRead: v.boolean(),
    isPinned: v.boolean(),
    isArchived: v.boolean(),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("userId_isArchived", ["userId", "isArchived"])
    .index("priority", ["priority"]),
  notifications: defineTable({
    userId: v.id("users"),
    type: notificationTypeValidator,
    title: v.string(),
    message: v.string(),
    referenceId: v.optional(v.string()),
    referenceType: v.optional(v.string()),
    isRead: v.boolean(),
    isSoundPlayed: v.optional(v.boolean()),
    createdAt: v.number(),
  }),
  opportunities: defineTable({
    leadId: v.id("leadMaster"),
    ownerId: v.id("users"),
    title: v.string(),
    stageId: v.id("salesOpportunityStages"),
    probability: v.number(),
    expectedRevenue: v.optional(v.number()),
    actualRevenue: v.optional(v.number()),
    currency: v.optional(v.string()),
    expectedCloseDate: v.optional(v.number()),
    actualCloseDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    lostReasonId: v.optional(v.id("crmLostReasons")),
    competitiveInfo: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("leadId", ["leadId"])
    .index("ownerId", ["ownerId"])
    .index("stageId", ["stageId"]),
  recordPolicies: defineTable({
    module: v.string(),
    recordId: v.string(),
    policyId: v.optional(v.id("visibilityPolicies")),
    ownerUserId: v.optional(v.id("users")),
    departmentId: v.optional(v.id("departments")),
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("recordId", ["recordId"])
    .index("module_recordId", ["module", "recordId"])
    .index("ownerUserId", ["ownerUserId"]),
  relationships: defineTable({
    personA: v.id("personMaster"),
    personB: v.id("personMaster"),
    relationshipType: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    active: v.boolean(),
    metadata: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("personA", ["personA"])
    .index("personB", ["personB"])
    .index("relationshipType", ["relationshipType"])
    .index("personA_relationshipType", ["personA", "relationshipType"]),
  sectionPermissions: defineTable({
    designationId: v.id("designations"),
    module: v.string(),
    sectionName: v.string(),
    visible: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    lastActiveAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("token", ["token"]),
  socialLinks: defineTable({
    personId: v.id("personMaster"),
    platform: v.string(),
    url: v.string(),
    username: v.optional(v.string()),
    verified: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("platform", ["platform"]),
  userScopes: defineTable({
    userId: v.id("users"),
    companyIds: v.optional(v.array(v.id("companies"))),
    departmentIds: v.optional(v.array(v.id("departments"))),
    branchIds: v.optional(v.array(v.id("branches"))),
    teamIds: v.optional(v.array(v.id("teams"))),
    verticalIds: v.optional(v.array(v.id("verticals"))),
    canAccessDashboard: v.optional(v.boolean()),
    canAccessCrm: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(roleValidator),
    username: v.optional(v.string()),
    passwordHash: v.optional(v.string()),
    isDisabled: v.optional(v.boolean()),
    designationId: v.optional(v.id("designations")),
    departmentId: v.optional(v.id("departments")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    verticalId: v.optional(v.id("verticals")),
    teamIds: v.optional(v.array(v.id("teams"))),
    phone: v.optional(v.string()),
    employeeCode: v.optional(v.string()),
    employeeId: v.optional(v.string()),
    employmentType: v.optional(v.string()),
    joiningDate: v.optional(v.number()),
    probationEndDate: v.optional(v.number()),
    reportingManagerId: v.optional(v.id("users")),
    employeeCategoryId: v.optional(v.id("hrEmployeeCategories")),
    workLocationId: v.optional(v.id("hrWorkLocations")),
    skillIds: v.optional(v.array(v.id("hrSkills"))),
    experienceLevelId: v.optional(v.id("hrExperienceLevels")),
    employmentStatus: v.optional(v.string()),
    profileCompletion: v.optional(v.number()),
    lastLoginAt: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("username", ["username"])
    .index("employeeId", ["employeeId"])
    .index("reportingManagerId", ["reportingManagerId"])
    .index("employmentType", ["employmentType"]),
  visibilityPolicies: defineTable({
    policyName: v.string(),
    policyCode: v.string(),
    description: v.optional(v.string()),
    securityLevel: v.union(
      v.literal("public"), v.literal("internal"),
      v.literal("confidential"), v.literal("highly_confidential"),
      v.literal("executive"), v.literal("legal_hold"),
    ),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("policyCode", ["policyCode"])
    .index("securityLevel", ["securityLevel"])
    .index("active", ["active"]),
};