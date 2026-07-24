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

const schema = defineSchema({
  ...authTables,

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
    .index("role", ["role"])
    .index("employeeId", ["employeeId"])
    .index("reportingManagerId", ["reportingManagerId"])
    .index("employmentType", ["employmentType"]),

  designations: defineTable({
    name: v.string(),
    code: v.string(),
    reportsTo: v.optional(v.id("designations")),
    status: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("code", ["code"]),

  departments: defineTable({
    name: v.string(),
    code: v.string(),
    parentType: v.optional(v.union(v.literal("group"), v.literal("company"))),
    parentId: v.optional(v.string()),
    branchId: v.optional(v.id("branches")),
    managerId: v.optional(v.id("users")),
    isActive: v.optional(v.boolean()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_branch", ["branchId"])
    .index("parentType_parentId", ["parentType", "parentId"]),

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
  })
    .index("code", ["code"])
    .index("departmentId", ["departmentId"]),

  branches: defineTable({
    name: v.string(),
    code: v.string(),
    parentType: v.optional(v.union(v.literal("group"), v.literal("company"))),
    parentId: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    isActive: v.boolean(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_organization", ["organizationId"])
    .index("parentType_parentId", ["parentType", "parentId"]),

  teams: defineTable({
    name: v.string(),
    code: v.string(),
    departmentId: v.id("departments"),
    description: v.optional(v.string()),
    leadId: v.optional(v.id("users")),
    isActive: v.optional(v.boolean()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_department", ["departmentId"]),

  organizations: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    taxId: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_code", ["code"]),

  verticals: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("code", ["code"]),

  subVerticals: defineTable({
    name: v.string(),
    code: v.string(),
    verticalId: v.id("verticals"),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("code", ["code"])
    .index("verticalId", ["verticalId"]),

  boards: defineTable({
    name: v.string(),
    code: v.string(),
    subVerticalId: v.optional(v.id("subVerticals")),
    verticalId: v.optional(v.id("verticals")),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("code", ["code"])
    .index("subVerticalId", ["subVerticalId"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    lastActiveAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("userId", ["userId"])
    .index("token", ["token"]),

  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: taskStatusValidator,
    priority: priorityValidator,
    ownerId: v.id("users"),
    assignedTo: v.optional(v.id("users")),
    departmentId: v.optional(v.id("departments")),
    teamId: v.optional(v.id("teams")),
    dueDate: v.optional(v.number()),
    order: v.number(),
    approvalRequired: v.optional(v.boolean()),
    approvalStatus: v.optional(approvalStatusValidator),
    approvalRequestId: v.optional(v.id("approvalRequests")),
    isArchived: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("status", ["status"])
    .index("ownerId", ["ownerId"])
    .index("assignedTo", ["assignedTo"])
    .index("departmentId", ["departmentId"])
    .index("teamId", ["teamId"])
    .index("approvalStatus", ["approvalStatus"]),

  taskParticipants: defineTable({
    taskId: v.id("tasks"),
    userId: v.id("users"),
    role: v.string(),
    createdAt: v.number(),
  })
    .index("taskId", ["taskId"])
    .index("userId", ["userId"]),

  taskChecklistItems: defineTable({
    taskId: v.id("tasks"),
    text: v.string(),
    completed: v.boolean(),
    completedBy: v.optional(v.id("users")),
    completedAt: v.optional(v.number()),
    order: v.number(),
    createdAt: v.number(),
  })
    .index("taskId", ["taskId"])
    .index("completed", ["completed"]),

  taskComments: defineTable({
    taskId: v.id("tasks"),
    userId: v.id("users"),
    content: v.string(),
    isInternal: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("taskId", ["taskId"])
    .index("userId", ["userId"]),

  approvalTemplates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    mode: approvalModeValidator,
    phases: v.array(
      v.object({
        name: v.string(),
        order: v.number(),
        requiredApprovers: v.number(),
      })
    ),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("isActive", ["isActive"]),

  approvalRequests: defineTable({
    templateId: v.optional(v.id("approvalTemplates")),
    taskId: v.optional(v.id("tasks")),
    requesterId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    mode: approvalModeValidator,
    status: approvalStatusValidator,
    currentPhase: v.optional(v.number()),
    totalPhases: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("requesterId", ["requesterId"])
    .index("status", ["status"])
    .index("taskId", ["taskId"]),

  approvalRequestApprovers: defineTable({
    requestId: v.id("approvalRequests"),
    userId: v.id("users"),
    phaseIndex: v.number(),
    status: approvalStatusValidator,
    comment: v.optional(v.string()),
    decidedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("requestId", ["requestId"])
    .index("userId", ["userId"]),

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
  })
    .index("userId", ["userId"])
    .index("userId_isRead", ["userId", "isRead"])
    .index("createdAt", ["createdAt"]),

  channels: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("channel"), v.literal("announcement")),
    createdBy: v.id("users"),
    isArchived: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("type", ["type"])
    .index("createdBy", ["createdBy"]),

  channelMembers: defineTable({
    channelId: v.id("channels"),
    userId: v.id("users"),
    joinedAt: v.number(),
    lastReadAt: v.optional(v.number()),
  })
    .index("channelId", ["channelId"])
    .index("userId", ["userId"]),

  messages: defineTable({
    channelId: v.id("channels"),
    senderId: v.id("users"),
    content: v.string(),
    parentId: v.optional(v.id("messages")),
    isPinned: v.optional(v.boolean()),
    mentions: v.optional(v.array(v.id("users"))),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("channelId", ["channelId"])
    .index("senderId", ["senderId"])
    .index("channelId_createdAt", ["channelId", "createdAt"]),

  directMessages: defineTable({
    senderId: v.id("users"),
    receiverId: v.id("users"),
    content: v.string(),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("senderId", ["senderId"])
    .index("receiverId", ["receiverId"])
    .index("participants", ["senderId", "receiverId"]),

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
  })
    .index("userId", ["userId"]),

  // ─── Sales Opportunities ───
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

  opportunityStageHistory: defineTable({
    opportunityId: v.id("opportunities"),
    fromStageId: v.optional(v.id("salesOpportunityStages")),
    toStageId: v.id("salesOpportunityStages"),
    changedBy: v.id("users"),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("opportunityId", ["opportunityId"])
    .index("opportunityId_createdAt", ["opportunityId", "createdAt"]),

  // ─── Quotations ───
  quotations: defineTable({
    opportunityId: v.id("opportunities"),
    leadId: v.id("leadMaster"),
    quoteNumber: v.string(),
    status: v.union(v.literal("draft"), v.literal("sent"), v.literal("accepted"), v.literal("rejected"), v.literal("expired"), v.literal("revised")),
    issuedDate: v.number(),
    expiryDate: v.optional(v.number()),
    subtotal: v.number(),
    discountPercent: v.optional(v.number()),
    discountAmount: v.optional(v.number()),
    gstPercent: v.optional(v.number()),
    gstAmount: v.optional(v.number()),
    total: v.number(),
    currency: v.optional(v.string()),
    notes: v.optional(v.string()),
    terms: v.optional(v.string()),
    validUntil: v.optional(v.number()),
    createdBy: v.id("users"),
    approvedBy: v.optional(v.id("users")),
    pdfUrl: v.optional(v.string()),
    isActive: v.boolean(),
    version: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("opportunityId", ["opportunityId"])
    .index("leadId", ["leadId"])
    .index("status", ["status"]),

  quotationLineItems: defineTable({
    quotationId: v.id("quotations"),
    description: v.string(),
    quantity: v.number(),
    unitPrice: v.number(),
    discountPercent: v.optional(v.number()),
    discountAmount: v.optional(v.number()),
    taxPercent: v.optional(v.number()),
    taxAmount: v.optional(v.number()),
    total: v.number(),
    sortOrder: v.number(),
    createdAt: v.number(),
  })
    .index("quotationId", ["quotationId"]),

  quotationVersions: defineTable({
    quotationId: v.id("quotations"),
    version: v.number(),
    data: v.string(),
    changedBy: v.id("users"),
    changeNotes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("quotationId", ["quotationId"])
    .index("quotationId_version", ["quotationId", "version"]),

  // ============================
  // CRM - Lead Management
  // ============================

  leadMaster: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    dob: v.optional(v.number()),
    gender: v.optional(v.string()),
    location: v.optional(v.string()),
    verticalId: v.optional(v.id("verticals")),
    subVerticalId: v.optional(v.id("subVerticals")),
    boardId: v.optional(v.id("boards")),
    courseInterest: v.optional(v.string()),
    branchInterestId: v.optional(v.id("branches")),
    academicDetails: v.optional(v.string()),
    stage: v.string(),
    ownerId: v.optional(v.id("users")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    probability: v.optional(v.number()),
    expectedRevenue: v.optional(v.number()),
    expectedJoining: v.optional(v.number()),
    nextAction: v.optional(v.string()),
    nextActionDate: v.optional(v.number()),
    standardAmount: v.optional(v.number()),
    discountAmount: v.optional(v.number()),
    waiverAmount: v.optional(v.number()),
    finalPayable: v.optional(v.number()),
    source: v.optional(v.string()),
    campaign: v.optional(v.string()),
    utm: v.optional(v.string()),
    channel: v.optional(v.string()),
    whatsappUsername: v.optional(v.string()),
    whatsappPin: v.optional(v.string()),
    referralId: v.optional(v.id("users")),
    status: v.union(v.literal("active"), v.literal("converted"), v.literal("lost"), v.literal("archived")),
    tags: v.optional(v.array(v.string())),
    createdBy: v.id("users"),
    parentLeadId: v.optional(v.id("leadMaster")),
    duplicateOf: v.optional(v.id("leadMaster")),
    mergeCandidate: v.optional(v.id("leadMaster")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("stage", ["stage"])
    .index("ownerId", ["ownerId"])
    .index("priority", ["priority"])
    .index("status", ["status"])
    .index("verticalId", ["verticalId"])
    .index("branchInterestId", ["branchInterestId"])
    .index("ownerId_stage", ["ownerId", "stage"])
    .index("nextActionDate", ["nextActionDate"])
    .index("createdAt", ["createdAt"]),

  leadStageHistory: defineTable({
    leadId: v.id("leadMaster"),
    fromStage: v.optional(v.string()),
    toStage: v.string(),
    changedBy: v.id("users"),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("leadId", ["leadId"])
    .index("leadId_createdAt", ["leadId", "createdAt"]),

  leadAssignments: defineTable({
    leadId: v.id("leadMaster"),
    fromUserId: v.optional(v.id("users")),
    toUserId: v.id("users"),
    assignedBy: v.id("users"),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("leadId", ["leadId"])
    .index("toUserId", ["toUserId"]),

  leadTasks: defineTable({
    leadId: v.id("leadMaster"),
    title: v.string(),
    description: v.optional(v.string()),
    ownerId: v.id("users"),
    assignedTo: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"), v.literal("cancelled")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    isApproved: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("leadId", ["leadId"])
    .index("ownerId", ["ownerId"])
    .index("assignedTo", ["assignedTo"])
    .index("status", ["status"]),

  leadNotes: defineTable({
    leadId: v.id("leadMaster"),
    content: v.string(),
    createdBy: v.id("users"),
    type: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("leadId", ["leadId"])
    .index("leadId_createdAt", ["leadId", "createdAt"]),

  leadDocuments: defineTable({
    leadId: v.id("leadMaster"),
    name: v.string(),
    url: v.string(),
    type: v.optional(v.string()),
    size: v.optional(v.number()),
    uploadedBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("leadId", ["leadId"]),

  callLogs: defineTable({
    leadId: v.id("leadMaster"),
    callType: v.string(),
    outcome: v.string(),
    callDate: v.number(),
    durationMinutes: v.optional(v.number()),
    durationSeconds: v.optional(v.number()),
    notes: v.optional(v.string()),
    followupDate: v.optional(v.number()),
    createFollowupTask: v.boolean(),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("leadId", ["leadId"]),

  leadActivity: defineTable({
    leadId: v.id("leadMaster"),
    action: v.string(),
    description: v.string(),
    userId: v.id("users"),
    metadata: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("leadId", ["leadId"])
    .index("leadId_createdAt", ["leadId", "createdAt"])
    .index("userId", ["userId"]),

  // ============================
  // Course Studio
  // ============================

  courses: defineTable({
    courseCode: v.string(),
    courseName: v.string(),
    verticalId: v.optional(v.id("verticals")),
    subVerticalId: v.optional(v.id("subVerticals")),
    boardId: v.optional(v.id("boards")),
    baseFee: v.number(),
    description: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("archived"), v.literal("draft")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("courseCode", ["courseCode"])
    .index("verticalId", ["verticalId"])
    .index("status", ["status"]),

  leadCourses: defineTable({
    leadId: v.id("leadMaster"),
    courseId: v.id("courses"),
    addedBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("leadId", ["leadId"])
    .index("courseId", ["courseId"])
    .index("leadId_courseId", ["leadId", "courseId"]),

  // ============================
  // CRM - Discounts & Waivers
  // ============================

  leadDiscounts: defineTable({
    leadId: v.id("leadMaster"),
    category: v.union(v.literal("scholarship"), v.literal("discount"), v.literal("waiver"), v.literal("adjustment")),
    reason: v.string(),
    amount: v.number(),
    percentage: v.optional(v.number()),
    standardAmount: v.optional(v.number()),
    previousAmount: v.optional(v.number()),
    newAmount: v.optional(v.number()),
    status: v.union(v.literal("draft"), v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("cancelled")),
    approvalRequestId: v.optional(v.id("approvalRequests")),
    requestedBy: v.id("users"),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    remarks: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("leadId", ["leadId"])
    .index("status", ["status"])
    .index("leadId_status", ["leadId", "status"]),

  // ============================
  // CRM - WhatsApp Messages
  // ============================

  leadWhatsAppMessages: defineTable({
    leadId: v.id("leadMaster"),
    templateName: v.optional(v.string()),
    message: v.string(),
    whatsappUrl: v.string(),
    sentBy: v.id("users"),
    status: v.union(v.literal("sent"), v.literal("opened"), v.literal("clicked"), v.literal("replied"), v.literal("failed")),
    template: v.optional(v.union(
      v.literal("greeting"), v.literal("followup"), v.literal("reminder"),
      v.literal("offer"), v.literal("approval"), v.literal("conversion"), v.literal("manual")
    )),
    createdAt: v.number(),
  })
    .index("leadId", ["leadId"])
    .index("leadId_createdAt", ["leadId", "createdAt"]),

  // ============================
  // CRM - Lead Approvals
  // ============================

  leadApprovals: defineTable({
    leadId: v.id("leadMaster"),
    title: v.string(),
    type: v.union(v.literal("discount"), v.literal("waiver"), v.literal("scholarship"), v.literal("admission"), v.literal("special_pricing"), v.literal("manual")),
    amount: v.number(),
    reason: v.string(),
    approverIds: v.array(v.id("users")),
    mode: v.union(v.literal("any_one"), v.literal("all_required"), v.literal("sequential"), v.literal("parallel")),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("returned")),
    currentApproverIndex: v.number(),
    requestedBy: v.id("users"),
    fallbackApproverId: v.optional(v.id("users")),
    deadline: v.optional(v.number()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    discountId: v.optional(v.id("leadDiscounts")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("leadId", ["leadId"])
    .index("status", ["status"])
    .index("approverIds", ["approverIds"]),

  leadApprovalDecisions: defineTable({
    approvalId: v.id("leadApprovals"),
    userId: v.id("users"),
    status: v.union(v.literal("approved"), v.literal("rejected"), v.literal("returned")),
    comment: v.optional(v.string()),
    decidedAt: v.number(),
    createdAt: v.number(),
  })
    .index("approvalId", ["approvalId"])
    .index("userId", ["userId"]),

  // ============================
  // Academic Sub-Verticals (Master Data Studio)
  // ============================

  academicSubVerticals: defineTable({
    verticalId: v.id("academicVerticals"),
    name: v.string(),
    code: v.string(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    displayOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("displayOrder", ["displayOrder"])
    .index("verticalId", ["verticalId"]),

  // ============================
  // Academic Batches (Master Data Studio)
  // ============================

  academicBatches: defineTable({
    name: v.string(),
    code: v.string(),
    programId: v.id("academicPrograms"),
    batchTypeId: v.id("academicBatchTypes"),
    academicSessionId: v.id("academicSessions"),
    capacity: v.optional(v.number()),
    minStrength: v.optional(v.number()),
    maxStrength: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    description: v.optional(v.string()),
    sequence: v.number(),
    color: v.string(),
    icon: v.string(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("sequence", ["sequence"])
    .index("programId", ["programId"])
    .index("batchTypeId", ["batchTypeId"])
    .index("academicSessionId", ["academicSessionId"]),

  // ============================
  // Academic Batch Types (Master Data Studio)
  // ============================

  academicBatchTypes: defineTable({
    name: v.string(),
    code: v.string(),
    deliveryMode: v.string(),
    timingCategory: v.string(),
    description: v.optional(v.string()),
    displayOrder: v.number(),
    color: v.string(),
    icon: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("displayOrder", ["displayOrder"]),

  // ============================
  // Academic Subjects (Master Data Studio)
  // ============================

  academicSubjects: defineTable({
    name: v.string(),
    code: v.string(),
    category: v.string(),
    subjectType: v.string(),
    description: v.optional(v.string()),
    displayOrder: v.number(),
    color: v.string(),
    icon: v.string(),
    isTheory: v.boolean(),
    isPractical: v.boolean(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("displayOrder", ["displayOrder"])
    .index("category", ["category"]),

  // ============================
  // Academic Programs (Master Data Studio)
  // ============================

  academicPrograms: defineTable({
    subVerticalId: v.id("academicSubVerticals"),
    name: v.string(),
    code: v.string(),
    programType: v.string(),
    duration: v.number(),
    durationUnit: v.string(),
    deliveryMode: v.string(),
    description: v.optional(v.string()),
    displayOrder: v.number(),
    color: v.string(),
    icon: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("displayOrder", ["displayOrder"])
    .index("subVerticalId", ["subVerticalId"]),

  // ============================
  // Academic Verticals (Master Data Studio)
  // ============================

  academicVerticals: defineTable({
    name: v.string(),
    code: v.string(),
    color: v.string(),
    icon: v.string(),
    educationCategory: v.string(),
    description: v.optional(v.string()),
    minimumAge: v.optional(v.number()),
    maximumAge: v.optional(v.number()),
    displayOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("displayOrder", ["displayOrder"]),

  // ============================
  // Academic Boards (Master Data Studio)
  // ============================

  academicBoards: defineTable({
    name: v.string(),
    code: v.string(),
    shortName: v.string(),
    color: v.string(),
    icon: v.string(),
    country: v.string(),
    educationLevel: v.string(),
    website: v.optional(v.string()),
    description: v.optional(v.string()),
    displayOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("displayOrder", ["displayOrder"]),

  // ============================
  // Academic Terms (Master Data Studio)
  // ============================

  academicTerms: defineTable({
    name: v.string(),
    code: v.string(),
    academicSessionId: v.id("academicSessions"),
    termNumber: v.number(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("sequence", ["sequence"])
    .index("academicSessionId", ["academicSessionId"]),

  // ============================
  // Academic Semesters (Master Data Studio)
  // ============================

  academicSemesters: defineTable({
    name: v.string(),
    code: v.string(),
    academicSessionId: v.id("academicSessions"),
    semesterNumber: v.number(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("sequence", ["sequence"])
    .index("academicSessionId", ["academicSessionId"]),

  // ============================
  // Academic Streams (Master Data Studio)
  // ============================

  academicStreams: defineTable({
    name: v.string(),
    code: v.string(),
    educationLevel: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // Academic Languages (Master Data Studio)
  // ============================

  academicLanguages: defineTable({
    name: v.string(),
    code: v.string(),
    isoCode: v.string(),
    nativeName: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    isRTL: v.boolean(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // Academic Mediums (Master Data Studio)
  // ============================

  academicMediums: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // Academic Sections (Master Data Studio)
  // ============================

  academicSections: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // Academic Sessions (Master Data Studio)
  // ============================

  academicSessions: defineTable({
    name: v.string(),
    code: v.string(),
    academicYear: v.string(),
    color: v.string(),
    icon: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    admissionStartDate: v.optional(v.number()),
    admissionEndDate: v.optional(v.number()),
    description: v.optional(v.string()),
    sequence: v.number(),
    isCurrent: v.boolean(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // Academic — Classrooms (Master Data Studio)
  // ============================

  academicClassrooms: defineTable({
    name: v.string(),
    code: v.string(),
    building: v.optional(v.string()),
    floor: v.optional(v.number()),
    roomNumber: v.optional(v.string()),
    capacity: v.optional(v.number()),
    hasMultimedia: v.boolean(),
    hasAirConditioning: v.boolean(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // Communication — Notification Types (Master Data Studio)
  // ============================

  commNotificationTypes: defineTable({
    name: v.string(),
    code: v.string(),
    channelType: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // Communication — Email Templates (Master Data Studio)
  // ============================

  commEmailTemplates: defineTable({
    name: v.string(),
    code: v.string(),
    templateCategory: v.string(),
    subject: v.string(),
    bodyPreview: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // Communication — SMS Templates (Master Data Studio)
  // ============================

  commSmsTemplates: defineTable({
    name: v.string(),
    code: v.string(),
    templateCategory: v.string(),
    bodyPreview: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // Communication — WhatsApp Templates (Master Data Studio)
  // ============================

  commWhatsAppTemplates: defineTable({
    name: v.string(),
    code: v.string(),
    templateCategory: v.string(),
    bodyPreview: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // Organization - Companies (Master Data Studio)
  // ============================

  orgCompanies: defineTable({
    name: v.string(),
    code: v.string(),
    color: v.string(),
    icon: v.string(),
    legalName: v.optional(v.string()),
    registrationNumber: v.optional(v.string()),
    taxNumber: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    country: v.string(),
    logoUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    displayOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("displayOrder", ["displayOrder"]),

  // ============================
  // Organization - Branches (Master Data Studio)
  // ============================

  orgBranches: defineTable({
    name: v.string(),
    code: v.string(),
    color: v.string(),
    icon: v.string(),
    city: v.string(),
    state: v.string(),
    country: v.string(),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    managerName: v.optional(v.string()),
    displayOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("displayOrder", ["displayOrder"]),

  // ============================
  // Organization - Teams (Master Data Studio)
  // ============================

  orgTeams: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // Organization - Departments (Master Data Studio)
  // ============================

  orgDepartments: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // Organization - Designations (Master Data Studio)
  // ============================

  orgDesignations: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // CRM - Stage Studio
  // ============================

  crmStages: defineTable({
    name: v.string(),
    color: v.string(),
    icon: v.string(),
    probability: v.number(),
    sequence: v.number(),
    description: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // CRM - Source Studio
  // ============================

  crmSources: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // CRM - Lost Reason Studio
  // ============================

  crmLostReasons: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // CRM - Tag Studio
  // ============================

  crmTags: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // CRM - Priority Studio
  // ============================

  crmPriorities: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // CRM - Campaign Channels (Master Data Studio)
  // ============================

  crmCampaignChannels: defineTable({
    name: v.string(),
    code: v.string(),
    channelCategory: v.string(),
    isDigital: v.boolean(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // CRM - Counselling Outcomes (Master Data Studio)
  // ============================

  crmCounsellingOutcomes: defineTable({
    name: v.string(),
    code: v.string(),
    outcomeCategory: v.string(),
    recommendedAction: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // CRM - Counselling Types (Master Data Studio)
  // ============================

  crmCounsellingTypes: defineTable({
    name: v.string(),
    code: v.string(),
    counsellingMode: v.string(),
    durationMinutes: v.optional(v.number()),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // CRM - Enquiry Types (Master Data Studio)
  // ============================

  crmEnquiryTypes: defineTable({
    name: v.string(),
    code: v.string(),
    educationCategory: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // CRM - Referral Sources (Master Data Studio)
  // ============================

  crmReferralSources: defineTable({
    name: v.string(),
    code: v.string(),
    referralCategory: v.string(),
    rewardEligible: v.boolean(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // CRM - Follow-up Outcomes (Master Data Studio)
  // ============================

  crmFollowUpOutcomes: defineTable({
    name: v.string(),
    code: v.string(),
    outcomeCategory: v.string(),
    movesPipeline: v.boolean(),
    isPositive: v.boolean(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // CRM - Follow-up Types (Master Data Studio)
  // ============================

  crmFollowUpTypes: defineTable({
    name: v.string(),
    code: v.string(),
    followUpCategory: v.string(),
    requiresReminder: v.boolean(),
    defaultReminderDays: v.optional(v.number()),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // CRM - UTM Campaigns (Master Data Studio)
  // ============================

  crmUtmCampaigns: defineTable({
    name: v.string(),
    code: v.string(),
    campaignTypeId: v.id("crmCampaignTypes"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("sequence", ["sequence"])
    .index("campaignTypeId", ["campaignTypeId"]),

  // ============================
  // CRM - UTM Mediums (Master Data Studio)
  // ============================

  crmUtmMediums: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // CRM - UTM Sources (Master Data Studio)
  // ============================

  crmUtmSources: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // CRM - Lead Qualification (Master Data Studio)
  // ============================

  crmLeadQualification: defineTable({
    name: v.string(),
    code: v.string(),
    minimumScore: v.optional(v.number()),
    maximumScore: v.optional(v.number()),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // CRM - Lead Scoring Rules (Master Data Studio)
  // ============================

  crmLeadScoringRules: defineTable({
    name: v.string(),
    code: v.string(),
    scoreValue: v.number(),
    ruleCategory: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // Sales - Opportunity Stages (Master Data Studio)
  // ============================

  salesOpportunityStages: defineTable({
    name: v.string(),
    code: v.string(),
    stageOrder: v.number(),
    probability: v.number(),
    isClosed: v.boolean(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ─── Sales: Opportunity Types ───
  salesOpportunityTypes: defineTable({
    name: v.string(),
    code: v.string(),
    opportunityCategory: v.optional(v.string()),
    sequence: v.number(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ─── Sales: Quotation Statuses ───
  salesQuotationStatuses: defineTable({
    name: v.string(),
    code: v.string(),
    statusCategory: v.optional(v.string()),
    sequence: v.number(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ─── Sales: Territories ───
  salesTerritories: defineTable({
    name: v.string(),
    code: v.string(),
    territoryType: v.optional(v.string()),
    sequence: v.number(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ─── Sales: Payment Statuses ───
  salesPaymentStatuses: defineTable({
    name: v.string(),
    code: v.string(),
    statusCategory: v.optional(v.string()),
    sequence: v.number(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ─── Sales: Invoice Types ───
  salesInvoiceTypes: defineTable({
    name: v.string(),
    code: v.string(),
    invoiceCategory: v.optional(v.string()),
    sequence: v.number(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ─── Sales: Tax Slabs ───
  salesTaxSlabs: defineTable({
    name: v.string(),
    code: v.string(),
    slabType: v.optional(v.string()),
    fromAmount: v.optional(v.number()),
    toAmount: v.optional(v.number()),
    taxRate: v.number(),
    sequence: v.number(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // CRM - Lead Categories (Master Data Studio)
  // ============================

  crmLeadCategories: defineTable({
    name: v.string(),
    code: v.string(),
    categoryType: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // CRM — Industries (Master Data Studio)
  // ============================

  crmIndustries: defineTable({
    name: v.string(),
    code: v.string(),
    sector: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // CRM - Marketing Channels (Master Data Studio)
  // ============================

  crmMarketingChannels: defineTable({
    name: v.string(),
    code: v.string(),
    marketingType: v.string(),
    isOnline: v.boolean(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // CRM - Campaign Types (Master Data Studio)
  // ============================

  crmCampaignTypes: defineTable({
    name: v.string(),
    code: v.string(),
    campaignCategory: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // CRM - Payments
  // ============================

  leadPayments: defineTable({
    leadId: v.id("leadMaster"),
    amount: v.number(),
    mode: v.union(v.literal("cash"), v.literal("upi"), v.literal("bank"), v.literal("card"), v.literal("cheque"), v.literal("online")),
    reference: v.optional(v.string()),
    receiptUrl: v.optional(v.string()),
    enteredBy: v.id("users"),
    verifiedBy: v.optional(v.id("users")),
    verifiedAt: v.optional(v.number()),
    status: v.union(v.literal("pending"), v.literal("verified"), v.literal("rejected")),
    rejectionReason: v.optional(v.string()),
    notes: v.optional(v.string()),
    verificationRequestId: v.optional(v.id("verification_requests")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("leadId", ["leadId"])
    .index("status", ["status"])
    .index("leadId_status", ["leadId", "status"]),

  // ============================
  // LEAD LIFECYCLE — Health Scores
  // ============================

  leadHealthScores: defineTable({
    leadId: v.id("leadMaster"),
    score: v.number(),
    maxScore: v.number(),
    dimensions: v.string(),
    tier: v.string(),
    calculatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("leadId", ["leadId"])
    .index("tier", ["tier"])
    .index("leadId_calculatedAt", ["leadId", "calculatedAt"]),

  // ============================
  // LEAD LIFECYCLE — Follow-up Rules
  // ============================

  leadFollowUpRules: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    leadStage: v.optional(v.string()),
    leadStatus: v.optional(v.string()),
    daysAfterCreation: v.optional(v.number()),
    daysAfterLastActivity: v.optional(v.number()),
    daysAfterNextAction: v.optional(v.number()),
    actionTemplate: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    assignedTo: v.union(v.literal("owner"), v.literal("manager"), v.literal("team"), v.literal("round_robin")),
    createTask: v.boolean(),
    sendNotification: v.boolean(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("isActive", ["isActive"])
    .index("leadStage", ["leadStage"]),

  // ============================
  // LEAD LIFECYCLE — Conversion Pipeline
  // ============================

  leadConversionPipeline: defineTable({
    leadId: v.id("leadMaster"),
    pipelineType: v.union(v.literal("trial"), v.literal("direct_conversion"), v.literal("installment")),
    trialStartDate: v.optional(v.number()),
    trialEndDate: v.optional(v.number()),
    trialPhase: v.optional(v.union(v.literal("not_started"), v.literal("in_progress"), v.literal("extended"), v.literal("completed"), v.literal("cancelled"))),
    conversionDate: v.optional(v.number()),
    convertedBy: v.optional(v.id("users")),
    revenueAmount: v.optional(v.number()),
    revenueCollected: v.optional(v.number()),
    conversionNotes: v.optional(v.string()),
    paymentPlan: v.optional(v.string()),
    installmentCount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("leadId", ["leadId"])
    .index("pipelineType", ["pipelineType"])
    .index("trialPhase", ["trialPhase"]),

  // ============================
  // LEAD LIFECYCLE — Status Engine
  // ============================

  leadStatusEngine: defineTable({
    fromStatus: v.string(),
    toStatus: v.string(),
    allowed: v.boolean(),
    requiresPayment: v.boolean(),
    requiresApproval: v.boolean(),
    irreversible: v.boolean(),
    triggerWorkflowId: v.optional(v.id("workflows")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("fromStatus_toStatus", ["fromStatus", "toStatus"]),

  // ============================
  // Universal Verification Engine
  // ============================

  verification_requests: defineTable({
    entityType: v.string(),
    entityId: v.string(),
    requesterId: v.id("users"),
    assignedUserIds: v.array(v.id("users")),
    mode: v.union(v.literal("any_one"), v.literal("all_required"), v.literal("sequential"), v.literal("round_robin")),
    status: v.union(v.literal("pending"), v.literal("verified"), v.literal("rejected"), v.literal("returned")),
    metadata: v.optional(v.string()),
    remarks: v.optional(v.string()),
    decidedBy: v.optional(v.id("users")),
    decidedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("entityType", ["entityType"])
    .index("entityId", ["entityId"])
    .index("status", ["status"])
    .index("assignedUserIds", ["assignedUserIds"])
    .index("entityType_status", ["entityType", "status"]),

  verification_rules: defineTable({
    entity: v.string(),
    departmentId: v.optional(v.id("departments")),
    teamId: v.optional(v.id("teams")),
    verifierIds: v.array(v.id("users")),
    mode: v.union(v.literal("any_one"), v.literal("all_required"), v.literal("sequential"), v.literal("round_robin")),
    priority: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("entity", ["entity"])
    .index("isActive", ["isActive"]),

  verification_decisions: defineTable({
    requestId: v.id("verification_requests"),
    userId: v.id("users"),
    status: v.union(v.literal("verified"), v.literal("rejected"), v.literal("returned"), v.literal("request_proof")),
    comment: v.optional(v.string()),
    decidedAt: v.number(),
    createdAt: v.number(),
  })
    .index("requestId", ["requestId"])
    .index("userId", ["userId"]),

  // ============================
  // HR — Employee Statuses (Master Data Studio)
  // ============================

  hrEmploymentStatuses: defineTable({
    name: v.string(),
    code: v.string(),
    statusCategory: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // HR — Employee Types (Master Data Studio)
  // ============================

  hrEmployeeTypes: defineTable({
    name: v.string(),
    code: v.string(),
    employmentCategory: v.string(),
    isPayrollEligible: v.boolean(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // HR — Employee Categories (Master Data Studio)
  // ============================

  hrEmployeeCategories: defineTable({
    name: v.string(),
    code: v.string(),
    categoryType: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // HR — Work Locations (Master Data Studio)
  // ============================

  hrWorkLocations: defineTable({
    name: v.string(),
    code: v.string(),
    locationType: v.string(),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // HR — Skills (Master Data Studio)
  // ============================

  hrSkills: defineTable({
    name: v.string(),
    code: v.string(),
    skillCategory: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // HR — Experience Levels (Master Data Studio)
  // ============================

  hrExperienceLevels: defineTable({
    name: v.string(),
    code: v.string(),
    minYears: v.number(),
    maxYears: v.optional(v.number()),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // HR — Document Types (Master Data Studio)
  // ============================

  hrDocumentTypes: defineTable({
    name: v.string(),
    code: v.string(),
    documentCategory: v.string(),
    isMandatory: v.boolean(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // Finance — Payment Modes (Master Data Studio)
  // ============================

  financePaymentModes: defineTable({
    name: v.string(),
    code: v.string(),
    modeCategory: v.string(),
    isDigital: v.boolean(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // Finance — Bank Accounts (Master Data Studio)
  // ============================

  financeBankAccounts: defineTable({
    name: v.string(),
    code: v.string(),
    accountNumber: v.string(),
    bankName: v.string(),
    branchName: v.optional(v.string()),
    ifscCode: v.optional(v.string()),
    swiftCode: v.optional(v.string()),
    accountType: v.string(),
    isDefault: v.boolean(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // Finance — Tax Types (Master Data Studio)
  // ============================

  financeTaxTypes: defineTable({
    name: v.string(),
    code: v.string(),
    taxCategory: v.string(),
    taxRate: v.number(),
    isCompound: v.boolean(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // Finance — GST Rates (Master Data Studio)
  // ============================

  financeGstRates: defineTable({
    name: v.string(),
    code: v.string(),
    gstType: v.string(),
    cgstRate: v.number(),
    sgstRate: v.number(),
    igstRate: v.optional(v.number()),
    totalRate: v.number(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // Finance — Expense Categories (Master Data Studio)
  // ============================

  financeExpenseCategories: defineTable({
    name: v.string(),
    code: v.string(),
    expenseType: v.string(),
    budgetable: v.boolean(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // Finance — Income Categories (Master Data Studio)
  // ============================

  financeIncomeCategories: defineTable({
    name: v.string(),
    code: v.string(),
    incomeType: v.string(),
    isTaxable: v.boolean(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // Finance — Fee Categories (Master Data Studio)
  // ============================

  financeFeeCategories: defineTable({
    name: v.string(),
    code: v.string(),
    feeType: v.string(),
    isRecurring: v.boolean(),
    isOptional: v.boolean(),
    isRefundable: v.boolean(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // Finance — Discount Categories (Master Data Studio)
  // ============================

  financeDiscountCategories: defineTable({
    name: v.string(),
    code: v.string(),
    discountType: v.string(),
    isPercentage: v.boolean(),
    maxValue: v.optional(v.number()),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // Finance — Currencies (Master Data Studio)
  // ============================

  financeCurrencies: defineTable({
    name: v.string(),
    code: v.string(),
    symbol: v.string(),
    isoCode: v.string(),
    isBase: v.boolean(),
    exchangeRate: v.optional(v.number()),
    decimalPlaces: v.number(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ============================
  // Finance — Financial Years (Master Data Studio)
  // ============================

  financeFinancialYears: defineTable({
    name: v.string(),
    code: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    isCurrent: v.boolean(),
    isClosed: v.boolean(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  payment_plans: defineTable({
    leadId: v.id("leadMaster"),
    totalAmount: v.number(),
    installmentCount: v.number(),
    installmentAmount: v.number(),
    frequency: v.union(v.literal("weekly"), v.literal("monthly"), v.literal("quarterly"), v.literal("custom")),
    startDate: v.number(),
    graceDays: v.number(),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("cancelled")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("leadId", ["leadId"])
    .index("status", ["status"]),

  payment_installments: defineTable({
    planId: v.id("payment_plans"),
    leadId: v.id("leadMaster"),
    installmentNumber: v.number(),
    amount: v.number(),
    dueDate: v.number(),
    status: v.union(v.literal("planned"), v.literal("due"), v.literal("paid"), v.literal("overdue"), v.literal("cancelled")),
    paymentId: v.optional(v.id("leadPayments")),
    paidAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("planId", ["planId"])
    .index("leadId", ["leadId"])
    .index("status", ["status"])
    .index("dueDate", ["dueDate"]),

  payment_pdcs: defineTable({
    leadId: v.id("leadMaster"),
    chequeNumber: v.string(),
    bank: v.string(),
    chequeDate: v.number(),
    amount: v.number(),
    attachment: v.optional(v.string()),
    depositDate: v.optional(v.number()),
    status: v.union(v.literal("scheduled"), v.literal("deposited"), v.literal("cleared"), v.literal("bounced"), v.literal("cancelled")),
    linkedPaymentId: v.optional(v.id("leadPayments")),
    createdBy: v.id("users"),
    depositedBy: v.optional(v.id("users")),
    bouncedAt: v.optional(v.number()),
    bounceReason: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("leadId", ["leadId"])
    .index("status", ["status"])
    .index("depositDate", ["depositDate"]),

  payment_commitments: defineTable({
    leadId: v.id("leadMaster"),
    amount: v.number(),
    commitDate: v.number(),
    reason: v.optional(v.string()),
    confidence: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    ownerId: v.id("users"),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("expired"), v.literal("cancelled")),
    paymentId: v.optional(v.id("leadPayments")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("leadId", ["leadId"])
    .index("ownerId", ["ownerId"])
    .index("status", ["status"])
    .index("commitDate", ["commitDate"]),

  // ============================
  // Demo Environment Tables
  // ============================

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

  demoDepartments: defineTable({
    name: v.string(),
    code: v.string(),
    organizationId: v.optional(v.id("demoOrganizations")),
    displayOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("code", ["code"]),

  demoTeams: defineTable({
    name: v.string(),
    code: v.string(),
    departmentId: v.optional(v.id("demoDepartments")),
    displayOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("code", ["code"]),

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
    .index("by_order", ["displayOrder"]),

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
    .index("by_role", ["assignedToRole"]),

  demoNotifications: defineTable({
    title: v.string(),
    message: v.string(),
    type: v.optional(v.string()),
    userId: v.optional(v.id("demoProfiles")),
    role: v.optional(v.string()),
    isRead: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_role", ["role"]),

  demoActivities: defineTable({
    action: v.string(),
    entity: v.optional(v.string()),
    userName: v.optional(v.string()),
    userRole: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_created", ["createdAt"]),

  demoAttachments: defineTable({
    name: v.string(),
    type: v.string(),
    size: v.optional(v.number()),
    url: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    createdAt: v.number(),
  })
    .index("entityType", ["entityType"]),

  demoComments: defineTable({
    content: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    userName: v.optional(v.string()),
    userRole: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("entityType", ["entityType"]),

  demoTimelineEvents: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    eventType: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    userName: v.string(),
    createdAt: v.number(),
  })
    .index("entityType", ["entityType"]),

  demoAuditRecords: defineTable({
    action: v.string(),
    entity: v.string(),
    userId: v.optional(v.id("demoProfiles")),
    userName: v.optional(v.string()),
    userRole: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("action", ["action"]),

  // ============================
  // FORM STUDIO — Universal Intake Engine
  // ============================

  forms: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    status: formStatusValidator,
    version: v.number(),
    ownerId: v.optional(v.id("users")),
    createdBy: v.optional(v.id("users")),
    isPublic: v.boolean(),
    requiresAuth: v.boolean(),
    allowAnonymous: v.boolean(),
    enableQr: v.boolean(),
    publicUrl: v.optional(v.string()),
    expiryDate: v.optional(v.number()),
    submissionLimit: v.optional(v.number()),
    autoSaveDraft: v.boolean(),
    theme: v.optional(v.string()),
    successMessage: v.optional(v.string()),
    redirectUrl: v.optional(v.string()),
    isArchived: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("code", ["code"])
    .index("status", ["status"])
    .index("ownerId", ["ownerId"])
    .index("category", ["category"]),

  formVersions: defineTable({
    formId: v.id("forms"),
    version: v.number(),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    schemaData: v.string(),
    publishedAt: v.optional(v.number()),
    publishedBy: v.optional(v.id("users")),
    changeNotes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("formId", ["formId"])
    .index("formId_version", ["formId", "version"]),

  formFields: defineTable({
    formId: v.id("forms"),
    version: v.number(),
    fieldCode: v.string(),
    fieldType: fieldTypeValidator,
    label: v.string(),
    placeholder: v.optional(v.string()),
    description: v.optional(v.string()),
    required: v.boolean(),
    unique: v.boolean(),
    readOnly: v.boolean(),
    hidden: v.boolean(),
    defaultValue: v.optional(v.string()),
    validationRegex: v.optional(v.string()),
    minValue: v.optional(v.number()),
    maxValue: v.optional(v.number()),
    options: v.optional(v.array(v.string())),
    conditionalVisibility: v.optional(v.string()),
    conditionalRequired: v.optional(v.string()),
    calculated: v.optional(v.string()),
    lookupSource: v.optional(v.string()),
    dependentField: v.optional(v.string()),
    width: v.optional(v.string()),
    displayOrder: v.number(),
    sectionId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("formId", ["formId"])
    .index("formId_fieldCode", ["formId", "fieldCode"])
    .index("formId_version", ["formId", "version"]),

  formSubmissions: defineTable({
    formId: v.id("forms"),
    formVersion: v.number(),
    payload: v.string(),
    status: submissionStatusValidator,
    submittedBy: v.optional(v.id("users")),
    source: v.optional(v.string()),
    device: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    browser: v.optional(v.string()),
    notes: v.optional(v.string()),
    validationState: v.optional(v.string()),
    duplicateState: v.optional(v.string()),
    routingState: v.optional(v.string()),
    processingState: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("formId", ["formId"])
    .index("status", ["status"])
    .index("formId_status", ["formId", "status"])
    .index("submittedBy", ["submittedBy"]),

  // ============================
  // UNIVERSAL INTAKE ENGINE
  // ============================

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
    .index("processingStatus_createdAt", ["processingStatus", "createdAt"]),

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
    .index("action", ["action"]),

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
    .index("action", ["action"]),

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
    .index("isActive", ["isActive"]),

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
    .index("priority", ["priority"]),

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
    .index("status", ["status"]),


  // ============================
  // WORKFLOW & AUTOMATION ENGINE
  // ============================

  workflows: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    module: v.string(),
    status: v.string(),
    version: v.number(),
    isActive: v.boolean(),
    tag: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("code", ["code"])
    .index("module", ["module"])
    .index("status", ["status"])
    .index("isActive", ["isActive"]),

  workflowNodes: defineTable({
    workflowId: v.id("workflows"),
    nodeType: v.string(),
    label: v.string(),
    positionX: v.number(),
    positionY: v.number(),
    config: v.optional(v.string()),
    configSchema: v.optional(v.string()),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("workflowId", ["workflowId"])
    .index("nodeType", ["nodeType"]),

  workflowEdges: defineTable({
    workflowId: v.id("workflows"),
    sourceNodeId: v.id("workflowNodes"),
    targetNodeId: v.id("workflowNodes"),
    label: v.optional(v.string()),
    condition: v.optional(v.string()),
    displayOrder: v.number(),
    createdAt: v.number(),
  })
    .index("workflowId", ["workflowId"])
    .index("sourceNodeId", ["sourceNodeId"])
    .index("targetNodeId", ["targetNodeId"]),

  workflowInstances: defineTable({
    workflowId: v.id("workflows"),
    workflowVersion: v.number(),
    status: v.string(),
    currentStepId: v.optional(v.id("workflowNodes")),
    triggerSource: v.string(),
    triggerEntityId: v.optional(v.string()),
    triggerPayload: v.optional(v.string()),
    context: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    assignedTeam: v.optional(v.id("organizationTeams")),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    retryCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("workflowId", ["workflowId"])
    .index("status", ["status"])
    .index("currentStepId", ["currentStepId"])
    .index("assignedTo", ["assignedTo"]),

  workflowLogs: defineTable({
    instanceId: v.id("workflowInstances"),
    workflowId: v.id("workflows"),
    nodeId: v.optional(v.id("workflowNodes")),
    action: v.string(),
    status: v.string(),
    details: v.optional(v.string()),
    metadata: v.optional(v.string()),
    performedBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("instanceId", ["instanceId"])
    .index("workflowId", ["workflowId"])
    .index("action", ["action"])
    .index("createdAt", ["createdAt"]),


  // ============================
  // LEAD ACTIVITY & COMMUNICATION ENGINE
  // ============================

  leadTimeline: defineTable({
    leadId: v.id("leadMaster"),
    organizationId: v.optional(v.id("organization")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    eventType: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    metadata: v.optional(v.string()),
    performedBy: v.optional(v.id("users")),
    performedAt: v.number(),
    createdAt: v.number(),
  })
    .index("leadId", ["leadId"])
    .index("leadId_performedAt", ["leadId", "performedAt"])
    .index("eventType", ["eventType"]),

  leadCommunications: defineTable({
    leadId: v.id("leadMaster"),
    type: v.union(
      v.literal("Call"), v.literal("WhatsApp"),
      v.literal("Email"), v.literal("SMS"),
    ),
    direction: v.union(v.literal("Inbound"), v.literal("Outbound")),
    subject: v.optional(v.string()),
    message: v.optional(v.string()),
    duration: v.optional(v.number()),
    status: v.optional(v.string()),
    metadata: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("leadId", ["leadId"])
    .index("leadId_type", ["leadId", "type"]),

  leadMeetings: defineTable({
    leadId: v.id("leadMaster"),
    meetingType: v.string(),
    meetingDate: v.number(),
    duration: v.optional(v.number()),
    location: v.optional(v.string()),
    meetingLink: v.optional(v.string()),
    attendees: v.optional(v.array(v.id("users"))),
    status: v.union(
      v.literal("scheduled"), v.literal("completed"),
      v.literal("cancelled"), v.literal("rescheduled"),
    ),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("leadId", ["leadId"])
    .index("leadId_meetingDate", ["leadId", "meetingDate"])
    .index("status", ["status"]),

  leadAttachments: defineTable({
    leadId: v.id("leadMaster"),
    fileName: v.string(),
    fileUrl: v.string(),
    fileSize: v.optional(v.number()),
    uploadedBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("leadId", ["leadId"]),

  // ============================
  // ANALYTICS & FORECASTING ENGINE
  // ============================

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
    .index("period", ["period"]),

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
    .index("score", ["score"]),

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
    .index("period", ["period"]),

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

  // ============================
  // STUDENT INFORMATION SYSTEM (SIS)
  // ============================

  studentMaster: defineTable({
    studentCode: v.string(),
    personId: v.id("personMaster"),
    leadId: v.optional(v.id("leadMaster")),
    admissionNumber: v.string(),
    rollNumber: v.optional(v.string()),
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
    .index("academicYearId", ["academicYearId"]),

  studentAdmissions: defineTable({
    studentId: v.id("studentMaster"),
    leadId: v.optional(v.id("leadMaster")),
    admissionNumber: v.string(),
    admissionType: v.optional(v.string()),
    courseId: v.optional(v.id("courses")),
    batchId: v.optional(v.id("academicBatches")),
    totalFee: v.optional(v.number()),
    discountAmount: v.optional(v.number()),
    finalFee: v.optional(v.number()),
    installmentCount: v.optional(v.number()),
    admittedBy: v.id("users"),
    status: v.string(),
    decisionDate: v.optional(v.number()),
    remarks: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("studentId", ["studentId"])
    .index("admissionNumber", ["admissionNumber"])
    .index("status", ["status"]),

  studentAcademicProfile: defineTable({
    studentId: v.id("studentMaster"),
    verticalId: v.optional(v.id("verticals")),
    subVerticalId: v.optional(v.id("subVerticals")),
    boardId: v.optional(v.id("boards")),
    courseId: v.optional(v.id("courses")),
    batchId: v.optional(v.id("academicBatches")),
    sectionId: v.optional(v.id("academicSections")),
    semesterId: v.optional(v.id("academicSemesters")),
    termId: v.optional(v.id("academicTerms")),
    currentYear: v.optional(v.number()),
    currentTerm: v.optional(v.string()),
    isCurrent: v.boolean(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("studentId", ["studentId"])
    .index("batchId", ["batchId"])
    .index("courseId", ["courseId"])
    .index("isCurrent", ["isCurrent"]),

  studentStatusHistory: defineTable({
    studentId: v.id("studentMaster"),
    fromStatus: v.optional(v.string()),
    toStatus: v.string(),
    remarks: v.optional(v.string()),
    changedBy: v.id("users"),
    changedAt: v.number(),
    createdAt: v.number(),
  })
    .index("studentId", ["studentId"])
    .index("studentId_changedAt", ["studentId", "changedAt"]),

  studentMedicalProfile: defineTable({
    studentId: v.id("studentMaster"),
    allergies: v.optional(v.string()),
    medicalConditions: v.optional(v.string()),
    bloodGroup: v.optional(v.string()),
    doctorName: v.optional(v.string()),
    doctorContact: v.optional(v.string()),
    insuranceInfo: v.optional(v.string()),
    emergencyNotes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("studentId", ["studentId"]),

  studentAchievements: defineTable({
    studentId: v.id("studentMaster"),
    title: v.string(),
    category: v.string(),
    description: v.optional(v.string()),
    issuedBy: v.optional(v.string()),
    issueDate: v.optional(v.number()),
    certificateUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("studentId", ["studentId"])
    .index("category", ["category"]),

  studentDisciplinaryRecords: defineTable({
    studentId: v.id("studentMaster"),
    incident: v.string(),
    actionTaken: v.string(),
    status: v.union(v.literal("open"), v.literal("resolved"), v.literal("appealed"), v.literal("closed")),
    incidentDate: v.optional(v.number()),
    reportedBy: v.optional(v.id("users")),
    resolutionDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("studentId", ["studentId"])
    .index("status", ["status"]),

  studentTimeline: defineTable({
    studentId: v.id("studentMaster"),
    eventType: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    metadata: v.optional(v.string()),
    performedBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("studentId", ["studentId"])
    .index("studentId_createdAt", ["studentId", "createdAt"]),

    

  // ============================
  // COMMUNICATION HUB
  // ============================

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
    .index("isActive", ["isActive"]),

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
    .index("createdAt", ["createdAt"]),

  communicationLogs: defineTable({
    queueId: v.id("communicationQueue"),
    action: v.string(),
    status: v.string(),
    details: v.optional(v.string()),
    metadata: v.optional(v.string()),
    performedAt: v.number(),
  })
    .index("queueId", ["queueId"])
    .index("queueId_performedAt", ["queueId", "performedAt"]),

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
    .index("entityType", ["entityType"]),

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
    .index("userId", ["userId"])
    .index("userId_isRead", ["userId", "isRead"])
    .index("userId_isArchived", ["userId", "isArchived"])
    .index("category", ["category"])
    .index("priority", ["priority"])
    .index("createdAt", ["createdAt"]),

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

  messageCampaigns: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    channel: v.union(v.literal("email"), v.literal("whatsapp"), v.literal("sms"), v.literal("push")),
    templateId: v.optional(v.id("communicationTemplates")),
    targetType: v.string(),
    targetFilter: v.optional(v.string()),
    totalRecipients: v.number(),
    sentCount: v.number(),
    deliveredCount: v.number(),
    readCount: v.number(),
    failedCount: v.number(),
    status: v.union(v.literal("draft"), v.literal("scheduled"), v.literal("running"), v.literal("completed"), v.literal("paused"), v.literal("cancelled"), v.literal("failed")),
    scheduledAt: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("status", ["status"])
    .index("channel", ["channel"])
    .index("scheduledAt", ["scheduledAt"])
    .index("createdAt", ["createdAt"]),



  // ============================
  // CEO CONTROL CENTER & ENTERPRISE DASHBOARDS
  // ============================

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
    .index("isActive", ["isActive"]),

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
    .index("role", ["role"]),
    

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
    .index("isActive", ["isActive"]),

  // ============================
  // GLOBAL PEOPLE REGISTRY
  // ============================

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
    .index("personId", ["personId"])
    .index("profileType", ["profileType"])
    .index("personId_profileType", ["personId", "profileType"]),

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
    .index("type_value", ["type", "value"]),

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
    .index("addressType", ["addressType"]),

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

  socialLinks: defineTable({
    personId: v.id("personMaster"),
    platform: v.string(),
    url: v.string(),
    username: v.optional(v.string()),
    verified: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("personId", ["personId"])
    .index("platform", ["platform"]),

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
    .index("documentType", ["documentType"]),

  personQRCode: defineTable({
    personId: v.id("personMaster"),
    qrToken: v.string(),
    deepLink: v.string(),
    qrImage: v.optional(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("personId", ["personId"])
    .index("qrToken", ["qrToken"]),



  // ============================
  // DATA VISIBILITY & ACCESS ENGINE
  // ============================

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
    .index("designationId_category", ["designationId", "category"]),

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
    .index("designationId_module", ["designationId", "module"]),

  sectionPermissions: defineTable({
    designationId: v.id("designations"),
    module: v.string(),
    sectionName: v.string(),
    visible: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("designationId", ["designationId"])
    .index("module", ["module"])
    .index("designationId_module", ["designationId", "module"]),

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
    .index("designationId_module_action", ["designationId", "module", "action"]),

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
    .index("module", ["module"])
    .index("recordId", ["recordId"])
    .index("module_recordId", ["module", "recordId"])
    .index("ownerUserId", ["ownerUserId"])
    .index("departmentId", ["departmentId"]),

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
    .index("userId_timestamp", ["userId", "timestamp"]),}, {


  // ============================
  // EMPLOYEE INFORMATION SYSTEM (EIS)
  // ============================

  // @ts-expect-error - employeeMaster table
  employeeMaster: defineTable({
    employeeCode: v.string(),
    personId: v.id("personMaster"),
    organizationId: v.optional(v.id("organizations")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    designationId: v.optional(v.id("designations")),
    reportingManagerId: v.optional(v.id("employeeMaster")),
    employmentType: v.union(
      v.literal("permanent"), v.literal("contract"),
      v.literal("part_time"), v.literal("intern"),
      v.literal("freelancer"), v.literal("consultant"),
    ),
    joiningDate: v.optional(v.number()),
    confirmationDate: v.optional(v.number()),
    resignationDate: v.optional(v.number()),
    relievingDate: v.optional(v.number()),
    probationEndDate: v.optional(v.number()),
    primaryRole: v.union(
      v.literal("super_admin"), v.literal("ceo"), v.literal("coo"),
      v.literal("cto"), v.literal("department_head"),
      v.literal("manager"), v.literal("employee"),
    ),
    employeeCategoryId: v.optional(v.id("hrEmployeeCategories")),
    workLocation: v.optional(v.string()),
    experienceLevel: v.optional(v.string()),
    status: v.union(
      v.literal("active"), v.literal("onboarding"),
      v.literal("probation"), v.literal("suspended"),
      v.literal("resigned"), v.literal("terminated"),
      v.literal("retired"), v.literal("archived"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("employeeCode", ["employeeCode"])
    .index("personId", ["personId"])
    .index("status", ["status"])
    .index("departmentId", ["departmentId"])
    .index("branchId", ["branchId"])
    .index("companyId", ["companyId"])
    .index("reportingManagerId", ["reportingManagerId"])
    .index("employmentType", ["employmentType"])
    .index("departmentId_status", ["departmentId", "status"]),

  employeeEmployment: defineTable({
    employeeId: v.id("employeeMaster"),
    shiftPolicyId: v.optional(v.id("shiftPolicies")),
    leavePolicyId: v.optional(v.id("leavePolicies")),
    holidayCalendarId: v.optional(v.id("holidayCalendars")),
    attendancePolicyId: v.optional(v.id("attendancePolicies")),
    payrollProfileId: v.optional(v.id("payrollProfiles")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("employeeId", ["employeeId"]),

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
    .index("eventType", ["eventType"]),

  employeeDocuments: defineTable({
    employeeId: v.id("employeeMaster"),
    documentType: v.string(),
    documentName: v.optional(v.string()),
    fileReference: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    verificationStatus: v.union(
      v.literal("pending"), v.literal("verified"),
      v.literal("rejected"), v.literal("expired"),
    ),
    expiryDate: v.optional(v.number()),
    uploadedAt: v.number(),
  })
    .index("employeeId", ["employeeId"])
    .index("verificationStatus", ["verificationStatus"]),

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
    .index("skill", ["skill"]),

  employeeQualifications: defineTable({
    employeeId: v.id("employeeMaster"),
    qualification: v.string(),
    institute: v.optional(v.string()),
    year: v.optional(v.number()),
    grade: v.optional(v.string()),
    fieldOfStudy: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("employeeId", ["employeeId"]),

  employeeAssets: defineTable({
    employeeId: v.id("employeeMaster"),
    assetName: v.string(),
    assetType: v.optional(v.string()),
    assetTag: v.optional(v.string()),
    assignedDate: v.number(),
    returnDate: v.optional(v.number()),
    status: v.union(
      v.literal("assigned"), v.literal("returned"),
      v.literal("lost"), v.literal("damaged"),
    ),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("employeeId", ["employeeId"])
    .index("status", ["status"]),

  // ─── RECRUITMENT & ATS ─────────────────────────────────────

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
    .index("status", ["status"]),

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
    .index("status", ["status"]),

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
    .index("status", ["status"]),

  interviewRounds: defineTable({
    candidateId: v.id("candidates"),
    roundName: v.string(),
    interviewerIds: v.array(v.id("users")),
    schedule: v.number(),
    mode: v.union(
      v.literal("online"), v.literal("offline"),
      v.literal("phone"),
    ),
    duration: v.optional(v.number()),
    result: v.optional(v.union(
      v.literal("pending"), v.literal("passed"),
      v.literal("failed"), v.literal("rescheduled"),
    )),
    score: v.optional(v.number()),
    remarks: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("candidateId", ["candidateId"])
    .index("schedule", ["schedule"]),

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
    .index("evaluator", ["evaluator"]),

  offers: defineTable({
    candidateId: v.id("candidates"),
    offeredSalary: v.number(),
    joiningDate: v.number(),
    offerLetter: v.optional(v.string()),
    status: v.union(
      v.literal("pending"), v.literal("approved"),
      v.literal("rejected"), v.literal("accepted"),
      v.literal("declined"), v.literal("withdrawn"),
    ),
    approvedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("candidateId", ["candidateId"])
    .index("status", ["status"]),

  onboardingTasks: defineTable({
    employeeId: v.optional(v.id("employeeMaster")),
    candidateId: v.id("candidates"),
    checklistItem: v.string(),
    assignedTo: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("candidateId", ["candidateId"])
    .index("employeeId", ["employeeId"])
    .index("assignedTo", ["assignedTo"]),

});
export default schema;
