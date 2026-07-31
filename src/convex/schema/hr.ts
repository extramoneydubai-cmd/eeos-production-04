import { defineTable } from "convex/server";
import { v } from "convex/values";

export const hrTables = {
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
    .index("status", ["status"])
    .index("by_created", ["createdAt"]),
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
    .index("employeeId", ["employeeId"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
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
    .index("departmentId_status", ["departmentId", "status"])
    .index("by_org", ["organizationId"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
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
  }).index("sequence", ["sequence"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
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
  }).index("sequence", ["sequence"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
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
  }).index("sequence", ["sequence"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
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
  }).index("sequence", ["sequence"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
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
  }).index("sequence", ["sequence"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
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
  }).index("sequence", ["sequence"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
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
  }).index("sequence", ["sequence"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),

  // ─── Leave Management ──────────────────────────────────────
  leaveTypes: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    annualAllowance: v.number(),
    carryForward: v.optional(v.boolean()),
    maxCarryForward: v.optional(v.number()),
    requiresApproval: v.optional(v.boolean()),
    genderSpecific: v.optional(v.union(v.literal("male"), v.literal("female"))),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("code", ["code"])
    .index("by_active", ["isActive"]),

  leaveApplications: defineTable({
    employeeId: v.id("users"),
    leaveTypeId: v.id("leaveTypes"),
    startDate: v.number(),
    endDate: v.number(),
    days: v.number(),
    halfDay: v.optional(v.boolean()),
    reason: v.string(),
    contactDuringLeave: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("cancelled")),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    comments: v.optional(v.string()),
    appliedOn: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("employeeId", ["employeeId"])
    .index("leaveTypeId", ["leaveTypeId"])
    .index("status", ["status"])
    .index("by_applied", ["appliedOn"])
    .index("by_updated", ["updatedAt"]),

  leaveBalances: defineTable({
    employeeId: v.id("users"),
    leaveTypeId: v.id("leaveTypes"),
    balance: v.number(),
    used: v.number(),
    year: v.number(),
    createdAt: v.number(),
  })
    .index("employeeId", ["employeeId"])
    .index("leaveTypeId", ["leaveTypeId"])
    .index("employeeId_leaveTypeId", ["employeeId", "leaveTypeId"]),

  // ─── Payroll ───────────────────────────────────────────────
  salaryStructures: defineTable({
    employeeId: v.id("users"),
    basicSalary: v.number(),
    hra: v.optional(v.number()),
    allowances: v.optional(v.array(v.object({ name: v.string(), amount: v.number() }))),
    deductions: v.optional(v.array(v.object({ name: v.string(), amount: v.number() }))),
    grossSalary: v.number(),
    totalDeductions: v.number(),
    netSalary: v.number(),
    effectiveFrom: v.number(),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("employeeId", ["employeeId"])
    .index("by_active", ["isActive"])
    .index("by_effective", ["effectiveFrom"]),

  payslips: defineTable({
    employeeId: v.id("users"),
    month: v.number(),
    year: v.number(),
    grossSalary: v.number(),
    totalDeductions: v.number(),
    netPayable: v.number(),
    absenceDays: v.optional(v.number()),
    status: v.union(v.literal("processing"), v.literal("approved"), v.literal("paid")),
    approvedAt: v.optional(v.number()),
    processedBy: v.optional(v.id("users")),
    generatedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("employeeId", ["employeeId"])
    .index("month_year", ["month", "year"])
    .index("status", ["status"])
    .index("by_generated", ["generatedAt"]),
};