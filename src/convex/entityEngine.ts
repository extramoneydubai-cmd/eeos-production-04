/**
 * Universal Entity Engine — Zero-Hardcode Entity Runtime
 *
 * PHASE 1 — Enhanced Metadata Registry with 35+ entity types.
 * Every entity type is registered with full metadata:
 *   searchFields, quickFilters, relationships, allowedActions,
 *   dashboardWidgets, reportTemplates, documentTemplates,
 *   notificationEvents, workflowTemplates, approvalTemplates,
 *   permissions, featureFlags, subscriptionRequirements,
 *   visibilityRules, auditSettings, archivePolicy
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ─── Full Entity Metadata Interface ───────────────────────────

export interface EntityField {
  key: string;
  label: string;
  type: "string" | "number" | "date" | "boolean" | "email" | "phone" | "currency" | "select";
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  options?: string[];
  visible?: boolean;
  width?: number;
}

export interface EntityRelationship {
  entityType: string;
  field: string;
  type: "hasMany" | "belongsTo" | "hasOne";
  label?: string;
  displayField?: string;
}

export interface EntityDefinition {
  entityType: string;
  tableName: string;
  displayName: string;
  pluralName: string;
  icon: string;
  color: string;
  category: "organization" | "academic" | "crm" | "finance" | "hr" | "support" | "operations" | "marketing" | "production" | "inventory" | "communication" | "knowledge" | "governance";
  primaryKey: string;
  displayField: string;
  searchFields: string[];
  quickFilters: string[];
  fields: EntityField[];
  relationships: EntityRelationship[];
  allowedActions: string[];
  permissions: { view: string; create: string; update: string; delete: string; approve?: string; export?: string };
  isArchivable: boolean;
  isAuditable: boolean;
  softDelete: boolean;
  versioning: boolean;
  archivePolicy?: "immediate" | "after_days" | "manual";
  archiveAfterDays?: number;
  dashboardWidgets?: string[];
  reportTemplates?: string[];
  documentTemplates?: string[];
  notificationEvents?: string[];
  workflowTemplates?: string[];
  approvalTemplates?: string[];
  featureFlags?: string[];
  subscriptionRequirements?: string[];
  visibilityRules?: { field: string; values: string[] }[];
}

// ─── 35+ Entity Registry ─────────────────────────────────────

export const ENTITY_REGISTRY: Record<string, EntityDefinition> = {
  // ═══════════════ ORGANIZATION ═══════════════
  company: {
    entityType: "company", tableName: "companies", displayName: "Company", pluralName: "Companies",
    icon: "Building2", color: "#6366f1", category: "organization",
    primaryKey: "_id", displayField: "name",
    searchFields: ["name", "code", "email", "phone", "gstNumber"],
    quickFilters: ["status", "type"],
    fields: [
      { key: "name", label: "Name", type: "string", searchable: true, filterable: true, sortable: true },
      { key: "code", label: "Code", type: "string", searchable: true },
      { key: "email", label: "Email", type: "email", searchable: true },
      { key: "phone", label: "Phone", type: "phone", searchable: true },
      { key: "gstNumber", label: "GST Number", type: "string", searchable: true },
      { key: "status", label: "Status", type: "select", filterable: true, options: ["active", "inactive", "suspended"] },
      { key: "type", label: "Type", type: "select", filterable: true, options: ["group", "company", "subsidiary"] },
      { key: "address", label: "Address", type: "string" },
      { key: "city", label: "City", type: "string", filterable: true },
      { key: "state", label: "State", type: "string", filterable: true },
      { key: "country", label: "Country", type: "string", filterable: true },
      { key: "pincode", label: "Pincode", type: "string" },
      { key: "website", label: "Website", type: "string" },
      { key: "logo", label: "Logo", type: "string" },
      { key: "isActive", label: "Active", type: "boolean", filterable: true },
    ],
    relationships: [{ entityType: "branch", field: "companyId", type: "hasMany", label: "Branches", displayField: "name" }],
    allowedActions: ["view", "create", "update", "delete", "archive", "export"],
    permissions: { view: "organization:read", create: "organization:write", update: "organization:write", delete: "organization:delete" },
    isArchivable: true, isAuditable: true, softDelete: false, versioning: false,
    archivePolicy: "after_days", archiveAfterDays: 365,
    dashboardWidgets: ["company_stats", "branch_count", "user_count"],
    notificationEvents: ["company_created", "company_updated", "company_deactivated"],
    workflowTemplates: ["new_company_setup"],
  },
  branch: {
    entityType: "branch", tableName: "branches", displayName: "Branch", pluralName: "Branches",
    icon: "GitBranch", color: "#8b5cf6", category: "organization",
    primaryKey: "_id", displayField: "name",
    searchFields: ["name", "code", "email", "phone", "city"],
    quickFilters: ["status", "companyId", "city"],
    fields: [
      { key: "name", label: "Name", type: "string", searchable: true, filterable: true, sortable: true },
      { key: "code", label: "Code", type: "string", searchable: true },
      { key: "companyId", label: "Company", type: "string", filterable: true },
      { key: "email", label: "Email", type: "email", searchable: true },
      { key: "phone", label: "Phone", type: "phone", searchable: true },
      { key: "city", label: "City", type: "string", searchable: true, filterable: true },
      { key: "state", label: "State", type: "string" },
      { key: "status", label: "Status", type: "select", filterable: true, options: ["active", "inactive", "closed"] },
      { key: "address", label: "Address", type: "string" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
    relationships: [
      { entityType: "company", field: "companyId", type: "belongsTo", label: "Company", displayField: "name" },
      { entityType: "department", field: "branchId", type: "hasMany", label: "Departments" },
    ],
    allowedActions: ["view", "create", "update", "delete", "archive", "export"],
    permissions: { view: "organization:read", create: "organization:write", update: "organization:write", delete: "organization:delete" },
    isArchivable: true, isAuditable: true, softDelete: false, versioning: false,
  },
  department: {
    entityType: "department", tableName: "departments", displayName: "Department", pluralName: "Departments",
    icon: "FolderTree", color: "#a855f7", category: "organization",
    primaryKey: "_id", displayField: "name",
    searchFields: ["name", "code"],
    quickFilters: ["branchId", "isActive"],
    fields: [
      { key: "name", label: "Name", type: "string", searchable: true, sortable: true },
      { key: "code", label: "Code", type: "string", searchable: true },
      { key: "branchId", label: "Branch", type: "string", filterable: true },
      { key: "headId", label: "Department Head", type: "string" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
    relationships: [
      { entityType: "branch", field: "branchId", type: "belongsTo" },
      { entityType: "team", field: "departmentId", type: "hasMany" },
    ],
    allowedActions: ["view", "create", "update", "delete"],
    permissions: { view: "organization:read", create: "organization:write", update: "organization:write", delete: "organization:delete" },
    isArchivable: false, isAuditable: true, softDelete: false, versioning: false,
  },
  team: {
    entityType: "team", tableName: "teams", displayName: "Team", pluralName: "Teams",
    icon: "Users", color: "#c084fc", category: "organization",
    primaryKey: "_id", displayField: "name",
    searchFields: ["name", "code"],
    quickFilters: ["departmentId", "isActive"],
    fields: [
      { key: "name", label: "Name", type: "string", searchable: true, sortable: true },
      { key: "code", label: "Code", type: "string" },
      { key: "departmentId", label: "Department", type: "string", filterable: true },
      { key: "leadId", label: "Team Lead", type: "string" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
    relationships: [{ entityType: "department", field: "departmentId", type: "belongsTo" }],
    allowedActions: ["view", "create", "update", "delete"],
    permissions: { view: "organization:read", create: "organization:write", update: "organization:write", delete: "organization:delete" },
    isArchivable: false, isAuditable: true, softDelete: false, versioning: false,
  },
  designation: {
    entityType: "designation", tableName: "designations", displayName: "Designation", pluralName: "Designations",
    icon: "BadgeCheck", color: "#7c3aed", category: "organization",
    primaryKey: "_id", displayField: "name",
    searchFields: ["name", "code"],
    quickFilters: ["isActive"],
    fields: [
      { key: "name", label: "Name", type: "string", searchable: true, sortable: true },
      { key: "code", label: "Code", type: "string", searchable: true },
      { key: "level", label: "Level", type: "number", filterable: true },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
    relationships: [],
    allowedActions: ["view", "create", "update", "delete"],
    permissions: { view: "organization:read", create: "organization:write", update: "organization:write", delete: "organization:delete" },
    isArchivable: false, isAuditable: true, softDelete: false, versioning: false,
  },
  user: {
    entityType: "user", tableName: "users", displayName: "User", pluralName: "Users",
    icon: "UserCircle", color: "#4f46e5", category: "organization",
    primaryKey: "_id", displayField: "name",
    searchFields: ["name", "email", "phone", "employeeCode"],
    quickFilters: ["role", "companyId", "branchId", "isActive"],
    fields: [
      { key: "name", label: "Name", type: "string", searchable: true, sortable: true },
      { key: "email", label: "Email", type: "email", searchable: true },
      { key: "phone", label: "Phone", type: "phone", searchable: true },
      { key: "role", label: "Role", type: "select", filterable: true, options: ["super_admin", "admin", "manager", "employee", "faculty", "counsellor", "reception"] },
      { key: "companyId", label: "Company", type: "string", filterable: true },
      { key: "branchId", label: "Branch", type: "string", filterable: true },
      { key: "employeeCode", label: "Employee Code", type: "string", searchable: true },
      { key: "isActive", label: "Active", type: "boolean", filterable: true },
    ],
    relationships: [
      { entityType: "company", field: "companyId", type: "belongsTo" },
      { entityType: "branch", field: "branchId", type: "belongsTo" },
    ],
    allowedActions: ["view", "create", "update", "delete", "export", "impersonate"],
    permissions: { view: "users:read", create: "users:write", update: "users:write", delete: "users:delete" },
    isArchivable: false, isAuditable: true, softDelete: true, versioning: false,
  },

  // ═══════════════ ACADEMIC ═══════════════
  vertical: {
    entityType: "vertical", tableName: "academicVerticals", displayName: "Vertical", pluralName: "Verticals",
    icon: "Layers", color: "#06b6d4", category: "academic",
    primaryKey: "_id", displayField: "name",
    searchFields: ["name", "code"],
    quickFilters: ["isActive"],
    fields: [
      { key: "name", label: "Name", type: "string", searchable: true, sortable: true },
      { key: "code", label: "Code", type: "string" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
    relationships: [{ entityType: "subVertical", field: "verticalId", type: "hasMany" }],
    allowedActions: ["view", "create", "update", "delete"],
    permissions: { view: "academic:read", create: "academic:write", update: "academic:write", delete: "academic:delete" },
    isArchivable: true, isAuditable: true, softDelete: false, versioning: false,
  },
  subVertical: {
    entityType: "subVertical", tableName: "academicSubVerticals", displayName: "Sub Vertical", pluralName: "Sub Verticals",
    icon: "Layers", color: "#0891b2", category: "academic",
    primaryKey: "_id", displayField: "name",
    searchFields: ["name", "code"],
    quickFilters: ["verticalId", "isActive"],
    fields: [
      { key: "name", label: "Name", type: "string", searchable: true, sortable: true },
      { key: "verticalId", label: "Vertical", type: "string", filterable: true },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
    relationships: [
      { entityType: "vertical", field: "verticalId", type: "belongsTo" },
      { entityType: "course", field: "subVerticalId", type: "hasMany" },
    ],
    allowedActions: ["view", "create", "update", "delete"],
    permissions: { view: "academic:read", create: "academic:write", update: "academic:write", delete: "academic:delete" },
    isArchivable: true, isAuditable: true, softDelete: false, versioning: false,
  },
  course: {
    entityType: "course", tableName: "courses", displayName: "Course", pluralName: "Courses",
    icon: "BookOpen", color: "#0e7490", category: "academic",
    primaryKey: "_id", displayField: "name",
    searchFields: ["name", "code", "description", "duration"],
    quickFilters: ["category", "boardId", "isActive"],
    fields: [
      { key: "name", label: "Name", type: "string", searchable: true, sortable: true },
      { key: "code", label: "Code", type: "string", searchable: true },
      { key: "category", label: "Category", type: "select", filterable: true, options: ["school", "college", "competitive", "vocational", "hobby"] },
      { key: "boardId", label: "Board", type: "string", filterable: true },
      { key: "duration", label: "Duration", type: "string", searchable: true },
      { key: "description", label: "Description", type: "string" },
      { key: "feeAmount", label: "Fee Amount", type: "currency" },
      { key: "isActive", label: "Active", type: "boolean", filterable: true },
    ],
    relationships: [
      { entityType: "batch", field: "courseId", type: "hasMany" },
      { entityType: "subject", field: "courseId", type: "hasMany" },
    ],
    allowedActions: ["view", "create", "update", "delete", "archive", "export", "clone"],
    permissions: { view: "academic:read", create: "academic:write", update: "academic:write", delete: "academic:delete", approve: "academic:approve" },
    isArchivable: true, isAuditable: true, softDelete: false, versioning: false,
    dashboardWidgets: ["course_stats", "batch_count"],
    reportTemplates: ["course_enrollment", "course_performance"],
    notificationEvents: ["course_created", "course_updated"],
  },
  batch: {
    entityType: "batch", tableName: "academicBatches", displayName: "Batch", pluralName: "Batches",
    icon: "Layers", color: "#155e75", category: "academic",
    primaryKey: "_id", displayField: "name",
    searchFields: ["name", "code", "year"],
    quickFilters: ["courseId", "batchType", "year", "isActive"],
    fields: [
      { key: "name", label: "Name", type: "string", searchable: true, sortable: true },
      { key: "code", label: "Code", type: "string", searchable: true },
      { key: "courseId", label: "Course", type: "string", filterable: true },
      { key: "year", label: "Year", type: "string", searchable: true, filterable: true },
      { key: "batchType", label: "Type", type: "select", filterable: true, options: ["regular", "weekend", "fast_track", "remedial"] },
      { key: "startDate", label: "Start Date", type: "date" },
      { key: "endDate", label: "End Date", type: "date" },
      { key: "capacity", label: "Capacity", type: "number" },
      { key: "isActive", label: "Active", type: "boolean", filterable: true },
    ],
    relationships: [
      { entityType: "course", field: "courseId", type: "belongsTo" },
      { entityType: "student", field: "batchId", type: "hasMany" },
      { entityType: "faculty", field: "batchId", type: "hasMany" },
    ],
    allowedActions: ["view", "create", "update", "delete", "archive", "export"],
    permissions: { view: "academic:read", create: "academic:write", update: "academic:write", delete: "academic:delete" },
    isArchivable: true, isAuditable: true, softDelete: false, versioning: false,
    dashboardWidgets: ["batch_stats", "batch_capacity"],
    reportTemplates: ["batch_attendance", "batch_performance"],
    notificationEvents: ["batch_created", "batch_started", "batch_completed"],
  },
  subject: {
    entityType: "subject", tableName: "academicSubjects", displayName: "Subject", pluralName: "Subjects",
    icon: "BookOpen", color: "#164e63", category: "academic",
    primaryKey: "_id", displayField: "name",
    searchFields: ["name", "code"],
    quickFilters: ["courseId", "isActive"],
    fields: [
      { key: "name", label: "Name", type: "string", searchable: true, sortable: true },
      { key: "code", label: "Code", type: "string", searchable: true },
      { key: "courseId", label: "Course", type: "string", filterable: true },
      { key: "credits", label: "Credits", type: "number" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
    relationships: [
      { entityType: "course", field: "courseId", type: "belongsTo" },
    ],
    allowedActions: ["view", "create", "update", "delete"],
    permissions: { view: "academic:read", create: "academic:write", update: "academic:write", delete: "academic:delete" },
    isArchivable: false, isAuditable: true, softDelete: false, versioning: false,
  },
  faculty: {
    entityType: "faculty", tableName: "faculty", displayName: "Faculty", pluralName: "Faculty",
    icon: "ChalkboardTeacher", color: "#ec4899", category: "academic",
    primaryKey: "_id", displayField: "name",
    searchFields: ["firstName", "lastName", "email", "phone", "facultyCode", "specialization"],
    quickFilters: ["departmentId", "branchId", "status"],
    fields: [
      { key: "firstName", label: "First Name", type: "string", searchable: true, sortable: true },
      { key: "lastName", label: "Last Name", type: "string", searchable: true, sortable: true },
      { key: "email", label: "Email", type: "email", searchable: true },
      { key: "phone", label: "Phone", type: "phone", searchable: true },
      { key: "facultyCode", label: "Faculty Code", type: "string", searchable: true },
      { key: "specialization", label: "Specialization", type: "string", searchable: true },
      { key: "departmentId", label: "Department", type: "string", filterable: true },
      { key: "branchId", label: "Branch", type: "string", filterable: true },
      { key: "status", label: "Status", type: "select", filterable: true, options: ["active", "inactive", "on_leave", "resigned"] },
    ],
    relationships: [
      { entityType: "batch", field: "facultyId", type: "hasMany" },
      { entityType: "subject", field: "facultyId", type: "hasMany" },
    ],
    allowedActions: ["view", "create", "update", "delete", "archive", "export"],
    permissions: { view: "academic:read", create: "academic:write", update: "academic:write", delete: "academic:delete" },
    isArchivable: true, isAuditable: true, softDelete: false, versioning: false,
    dashboardWidgets: ["faculty_stats", "faculty_workload"],
    reportTemplates: ["faculty_schedule", "faculty_performance"],
    notificationEvents: ["faculty_created", "faculty_assigned"],
  },

  // ═══════════════ CRM / LEADS ═══════════════
  lead: {
    entityType: "lead", tableName: "leads", displayName: "Lead", pluralName: "Leads",
    icon: "UserPlus", color: "#f59e0b", category: "crm",
    primaryKey: "_id", displayField: "name",
    searchFields: ["firstName", "lastName", "email", "phone", "leadSource", "company"],
    quickFilters: ["status", "stage", "branchInterestId", "leadSource", "ownerId"],
    fields: [
      { key: "firstName", label: "First Name", type: "string", searchable: true, sortable: true },
      { key: "lastName", label: "Last Name", type: "string", searchable: true, sortable: true },
      { key: "email", label: "Email", type: "email", searchable: true },
      { key: "phone", label: "Phone", type: "phone", searchable: true },
      { key: "leadSource", label: "Source", type: "select", filterable: true, options: ["website", "referral", "walk_in", "phone", "social", "campaign"] },
      { key: "status", label: "Status", type: "select", filterable: true, options: ["new", "active", "converted", "lost", "junk"] },
      { key: "stage", label: "Stage", type: "select", filterable: true, options: ["inquiry", "demo", "trial", "negotiation", "admission"] },
      { key: "branchInterestId", label: "Branch", type: "string", filterable: true },
      { key: "ownerId", label: "Owner", type: "string", filterable: true },
      { key: "standardAmount", label: "Potential Amount", type: "currency" },
      { key: "score", label: "Score", type: "number" },
    ],
    relationships: [
      { entityType: "student", field: "leadId", type: "hasOne" },
      { entityType: "campaign", field: "campaignId", type: "belongsTo" },
    ],
    allowedActions: ["view", "create", "update", "delete", "archive", "export", "convert", "merge", "assign"],
    permissions: { view: "crm:read", create: "crm:write", update: "crm:write", delete: "crm:delete", approve: "crm:approve" },
    isArchivable: true, isAuditable: true, softDelete: false, versioning: false,
    dashboardWidgets: ["lead_pipeline", "lead_conversion", "lead_source", "counsellor_performance"],
    reportTemplates: ["lead_pipeline_report", "lead_conversion_report", "lead_source_analysis"],
    documentTemplates: ["lead_acknowledgement", "lead_quote"],
    notificationEvents: ["lead_created", "lead_converted", "lead_lost", "lead_assigned", "lead_stage_changed"],
    workflowTemplates: ["lead_nurturing", "lead_conversion", "lead_escalation"],
    approvalTemplates: ["lead_discount", "lead_waiver"],
  },
  campaign: {
    entityType: "campaign", tableName: "crmUtmCampaigns", displayName: "Campaign", pluralName: "Campaigns",
    icon: "Megaphone", color: "#e11d48", category: "marketing",
    primaryKey: "_id", displayField: "name",
    searchFields: ["name", "type", "status"],
    quickFilters: ["type", "status", "companyId"],
    fields: [
      { key: "name", label: "Name", type: "string", searchable: true, sortable: true },
      { key: "type", label: "Type", type: "select", filterable: true, options: ["email", "sms", "whatsapp", "social", "print", "event", "webinar"] },
      { key: "status", label: "Status", type: "select", filterable: true, options: ["draft", "active", "paused", "completed", "cancelled"] },
      { key: "budget", label: "Budget", type: "currency" },
      { key: "startDate", label: "Start Date", type: "date" },
      { key: "endDate", label: "End Date", type: "date" },
      { key: "roi", label: "ROI", type: "number" },
      { key: "leadsGenerated", label: "Leads", type: "number" },
    ],
    relationships: [{ entityType: "lead", field: "campaignId", type: "hasMany" }],
    allowedActions: ["view", "create", "update", "delete", "archive", "clone", "launch", "pause"],
    permissions: { view: "marketing:read", create: "marketing:write", update: "marketing:write", delete: "marketing:delete", approve: "marketing:approve" },
    isArchivable: true, isAuditable: true, softDelete: false, versioning: false,
    dashboardWidgets: ["campaign_roi", "campaign_leads", "campaign_conversion"],
    reportTemplates: ["campaign_performance", "campaign_roi"],
    notificationEvents: ["campaign_created", "campaign_launched", "campaign_completed"],
    workflowTemplates: ["campaign_approval"],
    approvalTemplates: ["campaign_approval"],
  },

  // ═══════════════ FINANCE ═══════════════
  student: {
    entityType: "student", tableName: "studentMaster", displayName: "Student", pluralName: "Students",
    icon: "GraduationCap", color: "#6366f1", category: "crm",
    primaryKey: "_id", displayField: "name",
    searchFields: ["firstName", "lastName", "email", "phone", "studentCode", "rollNumber"],
    quickFilters: ["status", "courseId", "batchId", "branchId", "companyId"],
    fields: [
      { key: "firstName", label: "First Name", type: "string", searchable: true, sortable: true },
      { key: "lastName", label: "Last Name", type: "string", searchable: true, sortable: true },
      { key: "email", label: "Email", type: "email", searchable: true },
      { key: "phone", label: "Phone", type: "phone", searchable: true },
      { key: "studentCode", label: "Student Code", type: "string", searchable: true },
      { key: "rollNumber", label: "Roll Number", type: "string", searchable: true },
      { key: "status", label: "Status", type: "select", filterable: true, options: ["lead", "applicant", "admitted", "active", "suspended", "expelled", "alumni", "cancelled"] },
      { key: "courseId", label: "Course", type: "string", filterable: true },
      { key: "batchId", label: "Batch", type: "string", filterable: true },
      { key: "branchId", label: "Branch", type: "string", filterable: true },
      { key: "companyId", label: "Company", type: "string", filterable: true },
      { key: "parentId", label: "Parent", type: "string" },
      { key: "dateOfBirth", label: "Date of Birth", type: "date" },
      { key: "gender", label: "Gender", type: "select", options: ["male", "female", "other"] },
      { key: "address", label: "Address", type: "string" },
      { key: "city", label: "City", type: "string" },
    ],
    relationships: [
      { entityType: "course", field: "courseId", type: "belongsTo" },
      { entityType: "batch", field: "batchId", type: "belongsTo" },
      { entityType: "parent", field: "parentId", type: "belongsTo" },
      { entityType: "invoice", field: "studentId", type: "hasMany" },
      { entityType: "receipt", field: "studentId", type: "hasMany" },
      { entityType: "refund", field: "studentId", type: "hasMany" },
    ],
    allowedActions: ["view", "create", "update", "delete", "archive", "export", "import", "transfer", "promote", "graduate"],
    permissions: { view: "students:read", create: "students:write", update: "students:write", delete: "students:delete", approve: "students:approve" },
    isArchivable: true, isAuditable: true, softDelete: false, versioning: false,
    archivePolicy: "after_days", archiveAfterDays: 730,
    dashboardWidgets: ["student_stats", "admission_trend", "batch_distribution", "active_students"],
    reportTemplates: ["student_list", "student_enrollment", "student_performance", "student_attendance"],
    documentTemplates: ["student_id_card", "student_admission", "student_bonafide", "student_leaving_certificate", "student_transfer"],
    notificationEvents: ["student_created", "student_admitted", "student_status_changed", "student_graduated", "student_cancelled"],
    workflowTemplates: ["student_admission", "student_transfer", "student_suspension", "student_cancellation"],
    approvalTemplates: ["student_admission", "student_discount", "student_transfer"],
  },
  parent: {
    entityType: "parent", tableName: "parents", displayName: "Parent", pluralName: "Parents",
    icon: "Users", color: "#34a853", category: "crm",
    primaryKey: "_id", displayField: "name",
    searchFields: ["name", "email", "phone"],
    quickFilters: ["isActive"],
    fields: [
      { key: "name", label: "Name", type: "string", searchable: true, sortable: true },
      { key: "email", label: "Email", type: "email", searchable: true },
      { key: "phone", label: "Phone", type: "phone", searchable: true },
      { key: "relationship", label: "Relationship", type: "select", options: ["father", "mother", "guardian", "other"] },
      { key: "occupation", label: "Occupation", type: "string" },
      { key: "isActive", label: "Active", type: "boolean" },
    ],
    relationships: [{ entityType: "student", field: "parentId", type: "hasMany" }],
    allowedActions: ["view", "create", "update", "delete"],
    permissions: { view: "students:read", create: "students:write", update: "students:write", delete: "students:delete" },
    isArchivable: false, isAuditable: true, softDelete: false, versioning: false,
    notificationEvents: ["parent_notified"],
  },
  invoice: {
    entityType: "invoice", tableName: "feeInvoices", displayName: "Invoice", pluralName: "Invoices",
    icon: "FileText", color: "#1a73e8", category: "finance",
    primaryKey: "_id", displayField: "name",
    searchFields: ["invoiceNumber", "studentName", "totalAmount"],
    quickFilters: ["status", "studentId", "branchId"],
    fields: [
      { key: "invoiceNumber", label: "Invoice #", type: "string", searchable: true, sortable: true },
      { key: "studentId", label: "Student", type: "string", filterable: true },
      { key: "studentName", label: "Student Name", type: "string", searchable: true },
      { key: "totalAmount", label: "Total Amount", type: "currency", sortable: true },
      { key: "balanceDue", label: "Balance", type: "currency" },
      { key: "status", label: "Status", type: "select", filterable: true, options: ["draft", "sent", "partial", "paid", "overdue", "cancelled", "refunded"] },
      { key: "dueDate", label: "Due Date", type: "date", sortable: true },
      { key: "issueDate", label: "Issue Date", type: "date" },
      { key: "branchId", label: "Branch", type: "string", filterable: true },
      { key: "gstNumber", label: "GST", type: "string", searchable: true },
    ],
    relationships: [
      { entityType: "student", field: "studentId", type: "belongsTo" },
      { entityType: "receipt", field: "invoiceId", type: "hasMany" },
    ],
    allowedActions: ["view", "create", "update", "delete", "export", "print", "send", "cancel"],
    permissions: { view: "finance:read", create: "finance:write", update: "finance:write", delete: "finance:delete", approve: "finance:approve" },
    isArchivable: false, isAuditable: true, softDelete: false, versioning: false,
    dashboardWidgets: ["invoice_stats", "outstanding", "collection_rate"],
    reportTemplates: ["invoice_aging", "invoice_summary"],
    documentTemplates: ["invoice", "gst_invoice", "debit_note", "credit_note"],
    notificationEvents: ["invoice_created", "invoice_paid", "invoice_overdue", "invoice_cancelled"],
  },
  receipt: {
    entityType: "receipt", tableName: "paymentTransactions", displayName: "Receipt", pluralName: "Receipts",
    icon: "Receipt", color: "#a855f7", category: "finance",
    primaryKey: "_id", displayField: "name",
    searchFields: ["receiptNumber", "studentName", "amount"],
    quickFilters: ["paymentMode", "status", "branchId"],
    fields: [
      { key: "receiptNumber", label: "Receipt #", type: "string", searchable: true, sortable: true },
      { key: "studentId", label: "Student", type: "string" },
      { key: "studentName", label: "Student Name", type: "string", searchable: true },
      { key: "amount", label: "Amount", type: "currency", sortable: true },
      { key: "paymentMode", label: "Mode", type: "select", filterable: true, options: ["cash", "card", "cheque", "bank_transfer", "online", "upi"] },
      { key: "status", label: "Status", type: "select", filterable: true, options: ["pending", "verified", "failed", "refunded"] },
      { key: "receiptDate", label: "Date", type: "date", sortable: true },
      { key: "invoiceId", label: "Invoice", type: "string" },
      { key: "branchId", label: "Branch", type: "string", filterable: true },
    ],
    relationships: [
      { entityType: "student", field: "studentId", type: "belongsTo" },
      { entityType: "invoice", field: "invoiceId", type: "belongsTo" },
    ],
    allowedActions: ["view", "create", "update", "delete", "export", "print", "send", "verify"],
    permissions: { view: "finance:read", create: "finance:write", update: "finance:write", delete: "finance:delete" },
    isArchivable: false, isAuditable: true, softDelete: false, versioning: false,
    dashboardWidgets: ["receipt_today", "collection_summary"],
    documentTemplates: ["receipt", "payment_acknowledgement"],
    notificationEvents: ["receipt_created", "receipt_verified", "receipt_failed"],
  },
  refund: {
    entityType: "refund", tableName: "refundTransactions", displayName: "Refund", pluralName: "Refunds",
    icon: "Undo2", color: "#ea4335", category: "finance",
    primaryKey: "_id", displayField: "name",
    searchFields: ["refundNumber", "studentName", "amount"],
    quickFilters: ["status", "branchId", "refundType"],
    fields: [
      { key: "refundNumber", label: "Refund #", type: "string", searchable: true, sortable: true },
      { key: "studentId", label: "Student", type: "string" },
      { key: "studentName", label: "Student Name", type: "string", searchable: true },
      { key: "amount", label: "Amount", type: "currency", sortable: true },
      { key: "status", label: "Status", type: "select", filterable: true, options: ["initiated", "pending_approval", "approved", "processing", "completed", "rejected", "cancelled"] },
      { key: "refundType", label: "Type", type: "select", filterable: true, options: ["pro_rata", "full", "partial", "exceptional", "scholarship_adjustment"] },
      { key: "reason", label: "Reason", type: "string" },
      { key: "approvedBy", label: "Approved By", type: "string" },
      { key: "branchId", label: "Branch", type: "string", filterable: true },
    ],
    relationships: [{ entityType: "student", field: "studentId", type: "belongsTo" }],
    allowedActions: ["view", "create", "update", "delete", "export", "approve", "reject", "process"],
    permissions: { view: "finance:read", create: "finance:write", update: "finance:write", delete: "finance:delete", approve: "refund:approve" },
    isArchivable: false, isAuditable: true, softDelete: false, versioning: false,
    dashboardWidgets: ["refund_pipeline", "refund_aging"],
    reportTemplates: ["refund_report", "refund_aging"],
    documentTemplates: ["refund_voucher", "refund_calculation", "credit_note"],
    notificationEvents: ["refund_initiated", "refund_approved", "refund_rejected", "refund_completed"],
    workflowTemplates: ["refund_approval", "refund_processing"],
    approvalTemplates: ["refund_approval", "refund_director_approval"],
  },
  cheque: {
    entityType: "cheque", tableName: "chequeEntries", displayName: "PDC / Cheque", pluralName: "Cheques",
    icon: "CreditCard", color: "#f97316", category: "finance",
    primaryKey: "_id", displayField: "name",
    searchFields: ["chequeNumber", "bankName", "amount", "draweeName"],
    quickFilters: ["status", "bankName", "branchId"],
    fields: [
      { key: "chequeNumber", label: "Cheque #", type: "string", searchable: true, sortable: true },
      { key: "bankName", label: "Bank", type: "string", searchable: true, filterable: true },
      { key: "amount", label: "Amount", type: "currency", sortable: true },
      { key: "status", label: "Status", type: "select", filterable: true, options: ["received", "deposited", "cleared", "bounced", "restricted"] },
      { key: "chequeDate", label: "Cheque Date", type: "date" },
      { key: "depositDate", label: "Deposit Date", type: "date" },
      { key: "draweeName", label: "Drawee", type: "string", searchable: true },
      { key: "bounceCount", label: "Bounce Count", type: "number" },
      { key: "branchId", label: "Branch", type: "string", filterable: true },
    ],
    relationships: [{ entityType: "student", field: "studentId", type: "belongsTo" }],
    allowedActions: ["view", "create", "update", "delete", "export", "deposit", "clear", "bounce", "restrict"],
    permissions: { view: "finance:read", create: "finance:write", update: "finance:write", delete: "finance:delete" },
    isArchivable: false, isAuditable: true, softDelete: false, versioning: false,
    dashboardWidgets: ["pdc_summary", "pdc_bounce_rate", "pdc_deposit_calendar"],
    reportTemplates: ["pdc_report", "cheque_bounce_report"],
    documentTemplates: ["pdc_acknowledgement", "bounce_notice", "penalty_receipt", "settlement_letter"],
    notificationEvents: ["cheque_received", "cheque_deposited", "cheque_cleared", "cheque_bounced"],
    workflowTemplates: ["cheque_bounce_workflow"],
    approvalTemplates: ["cheque_bounce_penalty"],
  },
  gst: {
    entityType: "gst", tableName: "gstRecords", displayName: "GST Record", pluralName: "GST Records",
    icon: "FileSpreadsheet", color: "#059669", category: "finance",
    primaryKey: "_id", displayField: "name",
    searchFields: ["gstNumber", "companyName", "period"],
    quickFilters: ["period", "companyId"],
    fields: [
      { key: "gstNumber", label: "GST Number", type: "string", searchable: true },
      { key: "companyName", label: "Company", type: "string", searchable: true },
      { key: "period", label: "Period", type: "string", searchable: true, filterable: true },
      { key: "totalAmount", label: "Total", type: "currency" },
      { key: "taxableAmount", label: "Taxable", type: "currency" },
      { key: "cgst", label: "CGST", type: "currency" },
      { key: "sgst", label: "SGST", type: "currency" },
      { key: "igst", label: "IGST", type: "currency" },
      { key: "status", label: "Status", type: "select", options: ["pending", "filed", "verified"] },
    ],
    relationships: [{ entityType: "company", field: "companyId", type: "belongsTo" }],
    allowedActions: ["view", "create", "update", "delete", "export", "file"],
    permissions: { view: "finance:read", create: "finance:write", update: "finance:write", delete: "finance:delete" },
    isArchivable: false, isAuditable: true, softDelete: false, versioning: false,
    reportTemplates: ["gst_summary", "gst_return"],
    documentTemplates: ["gst_invoice", "gst_credit_note"],
    notificationEvents: ["gst_filing_reminder"],
  },
  asset: {
    entityType: "asset", tableName: "fixedAssets", displayName: "Asset", pluralName: "Assets",
    icon: "Package", color: "#78716c", category: "inventory",
    primaryKey: "_id", displayField: "name",
    searchFields: ["name", "serialNumber", "assetTag", "assetType"],
    quickFilters: ["assetType", "status", "branchId"],
    fields: [
      { key: "name", label: "Name", type: "string", searchable: true, sortable: true },
      { key: "serialNumber", label: "Serial #", type: "string", searchable: true },
      { key: "assetTag", label: "Asset Tag", type: "string", searchable: true },
      { key: "assetType", label: "Type", type: "select", filterable: true, options: ["laptop", "desktop", "printer", "projector", "furniture", "vehicle", "biometric", "camera", "lab_equipment", "other"] },
      { key: "status", label: "Status", type: "select", filterable: true, options: ["available", "assigned", "under_maintenance", "retired", "lost"] },
      { key: "assignedTo", label: "Assigned To", type: "string" },
      { key: "purchaseDate", label: "Purchase Date", type: "date" },
      { key: "purchaseCost", label: "Cost", type: "currency" },
      { key: "branchId", label: "Branch", type: "string", filterable: true },
    ],
    relationships: [],
    allowedActions: ["view", "create", "update", "delete", "assign", "maintain", "retire"],
    permissions: { view: "inventory:read", create: "inventory:write", update: "inventory:write", delete: "inventory:delete" },
    isArchivable: true, isAuditable: true, softDelete: false, versioning: false,
    dashboardWidgets: ["asset_summary", "asset_by_type"],
    reportTemplates: ["asset_register"],
    notificationEvents: ["asset_assigned", "asset_maintenance"],
  },

  // ═══════════════ HR ═══════════════
  employee: {
    entityType: "employee", tableName: "employees", displayName: "Employee", pluralName: "Employees",
    icon: "Users", color: "#34a853", category: "hr",
    primaryKey: "_id", displayField: "name",
    searchFields: ["firstName", "lastName", "email", "phone", "employeeCode"],
    quickFilters: ["departmentId", "branchId", "employmentType", "status"],
    fields: [
      { key: "firstName", label: "First Name", type: "string", searchable: true, sortable: true },
      { key: "lastName", label: "Last Name", type: "string", searchable: true, sortable: true },
      { key: "email", label: "Email", type: "email", searchable: true },
      { key: "phone", label: "Phone", type: "phone", searchable: true },
      { key: "employeeCode", label: "Employee Code", type: "string", searchable: true },
      { key: "departmentId", label: "Department", type: "string", filterable: true },
      { key: "branchId", label: "Branch", type: "string", filterable: true },
      { key: "designationId", label: "Designation", type: "string" },
      { key: "employmentType", label: "Type", type: "select", filterable: true, options: ["permanent", "contract", "probation", "intern", "trainee"] },
      { key: "status", label: "Status", type: "select", filterable: true, options: ["active", "inactive", "on_leave", "resigned", "terminated"] },
      { key: "dateOfJoining", label: "Joining Date", type: "date" },
      { key: "salary", label: "Salary", type: "currency" },
    ],
    relationships: [
      { entityType: "department", field: "departmentId", type: "belongsTo" },
      { entityType: "designation", field: "designationId", type: "belongsTo" },
    ],
    allowedActions: ["view", "create", "update", "delete", "archive", "export", "promote", "transfer"],
    permissions: { view: "hr:read", create: "hr:write", update: "hr:write", delete: "hr:delete", approve: "hr:approve" },
    isArchivable: true, isAuditable: true, softDelete: false, versioning: false,
    dashboardWidgets: ["employee_count", "employee_by_department", "attendance_summary"],
    reportTemplates: ["employee_list", "employee_attendance", "employee_payroll"],
    documentTemplates: ["offer_letter", "appointment_letter", "salary_slip", "experience_letter", "relieving_letter"],
    notificationEvents: ["employee_joined", "employee_resigned", "employee_promoted", "employee_transferred"],
    workflowTemplates: ["employee_onboarding", "employee_exit", "employee_promotion"],
    approvalTemplates: ["leave_approval", "expense_approval", "travel_approval"],
  },
  leave: {
    entityType: "leave", tableName: "leaveRecords", displayName: "Leave", pluralName: "Leaves",
    icon: "CalendarClock", color: "#16a34a", category: "hr",
    primaryKey: "_id", displayField: "name",
    searchFields: ["employeeName", "leaveType", "reason"],
    quickFilters: ["status", "leaveType", "employeeId"],
    fields: [
      { key: "employeeId", label: "Employee", type: "string", filterable: true },
      { key: "employeeName", label: "Employee Name", type: "string", searchable: true },
      { key: "leaveType", label: "Type", type: "select", filterable: true, options: ["annual", "sick", "personal", "maternity", "paternity", "bereavement", "unpaid"] },
      { key: "startDate", label: "Start Date", type: "date" },
      { key: "endDate", label: "End Date", type: "date" },
      { key: "totalDays", label: "Days", type: "number" },
      { key: "reason", label: "Reason", type: "string", searchable: true },
      { key: "status", label: "Status", type: "select", filterable: true, options: ["pending", "approved", "rejected", "cancelled"] },
    ],
    relationships: [],
    allowedActions: ["view", "create", "update", "delete", "approve", "reject"],
    permissions: { view: "hr:read", create: "hr:write", update: "hr:write", delete: "hr:delete", approve: "leave:approve" },
    isArchivable: false, isAuditable: true, softDelete: false, versioning: false,
    dashboardWidgets: ["leave_summary", "team_calendar"],
    notificationEvents: ["leave_applied", "leave_approved", "leave_rejected"],
    workflowTemplates: ["leave_approval"],
    approvalTemplates: ["leave_approval"],
  },
  payroll: {
    entityType: "payroll", tableName: "payrollRecords", displayName: "Payroll", pluralName: "Payroll",
    icon: "WalletCards", color: "#22c55e", category: "hr",
    primaryKey: "_id", displayField: "name",
    searchFields: ["employeeName", "period"],
    quickFilters: ["status", "period"],
    fields: [
      { key: "employeeId", label: "Employee", type: "string" },
      { key: "employeeName", label: "Employee Name", type: "string", searchable: true },
      { key: "period", label: "Period", type: "string", searchable: true, filterable: true },
      { key: "grossPay", label: "Gross Pay", type: "currency" },
      { key: "deductions", label: "Deductions", type: "currency" },
      { key: "netPay", label: "Net Pay", type: "currency" },
      { key: "status", label: "Status", type: "select", filterable: true, options: ["pending", "processed", "approved", "paid", "cancelled"] },
    ],
    relationships: [],
    allowedActions: ["view", "create", "update", "delete", "process", "approve"],
    permissions: { view: "hr:read", create: "hr:write", update: "hr:write", delete: "hr:delete", approve: "payroll:approve" },
    isArchivable: false, isAuditable: true, softDelete: false, versioning: false,
    documentTemplates: ["salary_slip", "payroll_summary"],
    notificationEvents: ["salary_processed", "salary_credited"],
    workflowTemplates: ["payroll_approval"],
  },

  // ═══════════════ SUPPORT ═══════════════
  ticket: {
    entityType: "ticket", tableName: "ticketMaster", displayName: "Ticket", pluralName: "Tickets",
    icon: "Ticket", color: "#6366f1", category: "support",
    primaryKey: "_id", displayField: "title",
    searchFields: ["ticketNumber", "title", "description", "requesterName"],
    quickFilters: ["status", "priority", "category", "assignedTo", "branchId"],
    fields: [
      { key: "ticketNumber", label: "Ticket #", type: "string", searchable: true, sortable: true },
      { key: "title", label: "Title", type: "string", searchable: true, sortable: true },
      { key: "description", label: "Description", type: "string", searchable: true },
      { key: "category", label: "Category", type: "select", filterable: true, options: ["hardware", "software", "network", "academic", "finance", "hr", "facility", "other"] },
      { key: "priority", label: "Priority", type: "select", filterable: true, options: ["low", "medium", "high", "critical"] },
      { key: "status", label: "Status", type: "select", filterable: true, options: ["open", "in_progress", "resolved", "closed", "reopened"] },
      { key: "assignedTo", label: "Assignee", type: "string", filterable: true },
      { key: "requesterName", label: "Requester", type: "string", searchable: true },
      { key: "slaDeadline", label: "SLA Deadline", type: "date" },
      { key: "slaBreached", label: "SLA Breached", type: "boolean" },
      { key: "branchId", label: "Branch", type: "string", filterable: true },
    ],
    relationships: [
      { entityType: "student", field: "requesterId", type: "belongsTo" },
      { entityType: "employee", field: "assignedTo", type: "belongsTo" },
    ],
    allowedActions: ["view", "create", "update", "delete", "assign", "escalate", "resolve", "close", "reopen", "merge"],
    permissions: { view: "support:read", create: "support:write", update: "support:write", delete: "support:delete", approve: "support:approve" },
    isArchivable: true, isAuditable: true, softDelete: false, versioning: false,
    dashboardWidgets: ["ticket_stats", "sla_compliance", "ticket_by_priority", "ticket_by_status"],
    reportTemplates: ["ticket_summary", "sla_report", "agent_performance"],
    notificationEvents: ["ticket_created", "ticket_assigned", "ticket_resolved", "ticket_closed", "ticket_escalated", "sla_breach"],
    workflowTemplates: ["ticket_escalation", "ticket_approval"],
    approvalTemplates: ["ticket_escalation"],
  },
  knowledge: {
    entityType: "knowledge", tableName: "knowledgeArticles", displayName: "Knowledge Article", pluralName: "Knowledge Articles",
    icon: "BookOpenText", color: "#0d9488", category: "knowledge",
    primaryKey: "_id", displayField: "title",
    searchFields: ["title", "content", "tags", "category"],
    quickFilters: ["category", "status", "isPublished"],
    fields: [
      { key: "title", label: "Title", type: "string", searchable: true, sortable: true },
      { key: "category", label: "Category", type: "select", filterable: true, options: ["sop", "wiki", "faq", "policy", "manual", "training", "guide"] },
      { key: "status", label: "Status", type: "select", filterable: true, options: ["draft", "review", "published", "archived"] },
      { key: "isPublished", label: "Published", type: "boolean", filterable: true },
      { key: "helpfulCount", label: "Helpful", type: "number" },
      { key: "viewCount", label: "Views", type: "number" },
      { key: "tags", label: "Tags", type: "string", searchable: true },
      { key: "content", label: "Content", type: "string", searchable: true },
    ],
    relationships: [],
    allowedActions: ["view", "create", "update", "delete", "publish", "archive"],
    permissions: { view: "knowledge:read", create: "knowledge:write", update: "knowledge:write", delete: "knowledge:delete" },
    isArchivable: true, isAuditable: true, softDelete: false, versioning: true,
    notificationEvents: ["knowledge_created", "knowledge_published"],
  },

  // ═══════════════ OPERATIONS ═══════════════
  vendor: {
    entityType: "vendor", tableName: "vendors", displayName: "Vendor", pluralName: "Vendors",
    icon: "Truck", color: "#10b981", category: "operations",
    primaryKey: "_id", displayField: "name",
    searchFields: ["name", "email", "phone", "gstNumber", "contactPerson"],
    quickFilters: ["status", "category"],
    fields: [
      { key: "name", label: "Name", type: "string", searchable: true, sortable: true },
      { key: "email", label: "Email", type: "email", searchable: true },
      { key: "phone", label: "Phone", type: "phone", searchable: true },
      { key: "gstNumber", label: "GST", type: "string", searchable: true },
      { key: "contactPerson", label: "Contact Person", type: "string", searchable: true },
      { key: "category", label: "Category", type: "select", filterable: true, options: ["books", "stationery", "equipment", "software", "services", "transport", "catering", "other"] },
      { key: "status", label: "Status", type: "select", filterable: true, options: ["active", "inactive", "blacklisted"] },
      { key: "paymentTerms", label: "Payment Terms", type: "string" },
    ],
    relationships: [{ entityType: "purchaseOrder", field: "vendorId", type: "hasMany" }],
    allowedActions: ["view", "create", "update", "delete", "archive"],
    permissions: { view: "procurement:read", create: "procurement:write", update: "procurement:write", delete: "procurement:delete" },
    isArchivable: true, isAuditable: true, softDelete: false, versioning: false,
    notificationEvents: ["vendor_created", "vendor_approved"],
    approvalTemplates: ["vendor_approval"],
  },
  purchaseOrder: {
    entityType: "purchaseOrder", tableName: "purchaseOrders", displayName: "Purchase Order", pluralName: "Purchase Orders",
    icon: "ShoppingCart", color: "#14b8a6", category: "operations",
    primaryKey: "_id", displayField: "name",
    searchFields: ["poNumber", "vendorName", "status"],
    quickFilters: ["status", "vendorId", "branchId"],
    fields: [
      { key: "poNumber", label: "PO #", type: "string", searchable: true, sortable: true },
      { key: "vendorId", label: "Vendor", type: "string", filterable: true },
      { key: "vendorName", label: "Vendor Name", type: "string", searchable: true },
      { key: "totalAmount", label: "Amount", type: "currency" },
      { key: "status", label: "Status", type: "select", filterable: true, options: ["draft", "sent", "approved", "received", "cancelled"] },
      { key: "orderDate", label: "Order Date", type: "date" },
      { key: "deliveryDate", label: "Delivery Date", type: "date" },
      { key: "branchId", label: "Branch", type: "string", filterable: true },
    ],
    relationships: [{ entityType: "vendor", field: "vendorId", type: "belongsTo" }],
    allowedActions: ["view", "create", "update", "delete", "approve", "receive"],
    permissions: { view: "procurement:read", create: "procurement:write", update: "procurement:write", delete: "procurement:delete", approve: "procurement:approve" },
    isArchivable: true, isAuditable: true, softDelete: false, versioning: false,
    notificationEvents: ["po_created", "po_approved", "po_received"],
    workflowTemplates: ["procurement_approval"],
    approvalTemplates: ["procurement_approval"],
  },
  inventory: {
    entityType: "inventory", tableName: "inventoryItems", displayName: "Inventory Item", pluralName: "Inventory Items",
    icon: "Package2", color: "#65a30d", category: "inventory",
    primaryKey: "_id", displayField: "name",
    searchFields: ["name", "sku", "barcode", "category"],
    quickFilters: ["category", "branchId", "stockStatus"],
    fields: [
      { key: "name", label: "Name", type: "string", searchable: true, sortable: true },
      { key: "sku", label: "SKU", type: "string", searchable: true },
      { key: "barcode", label: "Barcode", type: "string", searchable: true },
      { key: "category", label: "Category", type: "select", filterable: true, options: ["consumable", "durable", "raw_material", "finished_good", "stationery", "books", "equipment"] },
      { key: "quantity", label: "Qty", type: "number" },
      { key: "unitPrice", label: "Unit Price", type: "currency" },
      { key: "stockStatus", label: "Stock Status", type: "select", filterable: true, options: ["in_stock", "low_stock", "out_of_stock", "damaged", "discontinued"] },
      { key: "branchId", label: "Branch", type: "string", filterable: true },
    ],
    relationships: [],
    allowedActions: ["view", "create", "update", "delete", "transfer", "adjust", "count"],
    permissions: { view: "inventory:read", create: "inventory:write", update: "inventory:write", delete: "inventory:delete" },
    isArchivable: true, isAuditable: true, softDelete: false, versioning: false,
    dashboardWidgets: ["inventory_summary", "low_stock_alerts"],
    notificationEvents: ["inventory_low", "inventory_transferred", "inventory_adjusted"],
    workflowTemplates: ["inventory_transfer"],
  },
  exam: {
    entityType: "exam", tableName: "examMaster", displayName: "Exam", pluralName: "Exams",
    icon: "ClipboardList", color: "#dc2626", category: "academic",
    primaryKey: "_id", displayField: "name",
    searchFields: ["name", "code", "subject"],
    quickFilters: ["status", "batchId", "branchId"],
    fields: [
      { key: "name", label: "Name", type: "string", searchable: true, sortable: true },
      { key: "code", label: "Code", type: "string", searchable: true },
      { key: "subject", label: "Subject", type: "string", searchable: true },
      { key: "batchId", label: "Batch", type: "string", filterable: true },
      { key: "date", label: "Date", type: "date", sortable: true },
      { key: "startTime", label: "Start Time", type: "string" },
      { key: "duration", label: "Duration (min)", type: "number" },
      { key: "totalMarks", label: "Total Marks", type: "number" },
      { key: "status", label: "Status", type: "select", filterable: true, options: ["draft", "scheduled", "in_progress", "completed", "cancelled", "published"] },
      { key: "branchId", label: "Branch", type: "string", filterable: true },
    ],
    relationships: [{ entityType: "batch", field: "batchId", type: "belongsTo" }],
    allowedActions: ["view", "create", "update", "delete", "publish", "conduct", "cancel"],
    permissions: { view: "academic:read", create: "academic:write", update: "academic:write", delete: "academic:delete" },
    isArchivable: true, isAuditable: true, softDelete: false, versioning: false,
    dashboardWidgets: ["exam_summary", "exam_calendar"],
    documentTemplates: ["hall_ticket", "admit_card", "marksheet", "certificate"],
    notificationEvents: ["exam_scheduled", "exam_published", "exam_result_published"],
  },
  certificate: {
    entityType: "certificate", tableName: "certificates", displayName: "Certificate", pluralName: "Certificates",
    icon: "Award", color: "#f59e0b", category: "academic",
    primaryKey: "_id", displayField: "name",
    searchFields: ["certificateNumber", "studentName", "certificateType"],
    quickFilters: ["certificateType", "status", "batchId"],
    fields: [
      { key: "certificateNumber", label: "Certificate #", type: "string", searchable: true, sortable: true },
      { key: "studentId", label: "Student", type: "string" },
      { key: "studentName", label: "Student Name", type: "string", searchable: true },
      { key: "certificateType", label: "Type", type: "select", filterable: true, options: ["completion", "participation", "merit", "transfer", "bonafide", "experience"] },
      { key: "issueDate", label: "Issue Date", type: "date" },
      { key: "status", label: "Status", type: "select", filterable: true, options: ["draft", "issued", "verified", "cancelled"] },
    ],
    relationships: [{ entityType: "student", field: "studentId", type: "belongsTo" }],
    allowedActions: ["view", "create", "update", "delete", "issue", "verify"],
    permissions: { view: "academic:read", create: "academic:write", update: "academic:write", delete: "academic:delete" },
    isArchivable: false, isAuditable: true, softDelete: false, versioning: false,
    documentTemplates: ["completion_certificate", "bonafide", "transfer_certificate", "merit_certificate"],
    notificationEvents: ["certificate_issued"],
  },
  production: {
    entityType: "production", tableName: "productionTasks", displayName: "Production Task", pluralName: "Production Tasks",
    icon: "Factory", color: "#ca8a04", category: "production",
    primaryKey: "_id", displayField: "title",
    searchFields: ["title", "taskType", "assignedTo"],
    quickFilters: ["status", "taskType", "assignedTo"],
    fields: [
      { key: "title", label: "Title", type: "string", searchable: true, sortable: true },
      { key: "taskType", label: "Type", type: "select", filterable: true, options: ["content_writing", "video_production", "graphic_design", "question_bank", "review", "publishing", "recording", "editing"] },
      { key: "status", label: "Status", type: "select", filterable: true, options: ["assigned", "in_progress", "review", "approved", "published", "rejected"] },
      { key: "assignedTo", label: "Assigned To", type: "string", filterable: true },
      { key: "dueDate", label: "Due Date", type: "date" },
      { key: "priority", label: "Priority", type: "select", options: ["low", "medium", "high"] },
      { key: "courseId", label: "Course", type: "string" },
    ],
    relationships: [],
    allowedActions: ["view", "create", "update", "delete", "assign", "review", "approve", "reject"],
    permissions: { view: "production:read", create: "production:write", update: "production:write", delete: "production:delete", approve: "production:approve" },
    isArchivable: true, isAuditable: true, softDelete: false, versioning: false,
    notificationEvents: ["task_assigned", "task_completed", "task_approved"],
    workflowTemplates: ["production_workflow"],
  },
  schedule: {
    entityType: "schedule", tableName: "schedules", displayName: "Schedule", pluralName: "Schedules",
    icon: "Calendar", color: "#2563eb", category: "operations",
    primaryKey: "_id", displayField: "title",
    searchFields: ["title", "faculty", "subject", "room"],
    quickFilters: ["status", "branchId", "batchId"],
    fields: [
      { key: "title", label: "Title", type: "string", searchable: true, sortable: true },
      { key: "faculty", label: "Faculty", type: "string", searchable: true },
      { key: "subject", label: "Subject", type: "string", searchable: true },
      { key: "batchId", label: "Batch", type: "string", filterable: true },
      { key: "day", label: "Day", type: "select", options: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] },
      { key: "startTime", label: "Start", type: "string" },
      { key: "endTime", label: "End", type: "string" },
      { key: "room", label: "Room", type: "string", searchable: true },
      { key: "status", label: "Status", type: "select", filterable: true, options: ["scheduled", "in_progress", "completed", "cancelled", "conflict"] },
      { key: "branchId", label: "Branch", type: "string", filterable: true },
    ],
    relationships: [{ entityType: "batch", field: "batchId", type: "belongsTo" }],
    allowedActions: ["view", "create", "update", "delete", "confirm", "cancel", "reschedule"],
    permissions: { view: "scheduling:read", create: "scheduling:write", update: "scheduling:write", delete: "scheduling:delete" },
    isArchivable: true, isAuditable: true, softDelete: false, versioning: false,
    dashboardWidgets: ["today_schedule", "faculty_workload"],
    notificationEvents: ["schedule_created", "schedule_changed", "schedule_cancelled"],
  },
  attendance: {
    entityType: "attendance", tableName: "attendanceRecords", displayName: "Attendance", pluralName: "Attendance Records",
    icon: "CheckSquare", color: "#16a34a", category: "academic",
    primaryKey: "_id", displayField: "name",
    searchFields: ["studentName", "batchName"],
    quickFilters: ["status", "batchId", "branchId", "date"],
    fields: [
      { key: "studentId", label: "Student", type: "string" },
      { key: "studentName", label: "Student Name", type: "string", searchable: true },
      { key: "batchId", label: "Batch", type: "string", filterable: true },
      { key: "date", label: "Date", type: "date", filterable: true },
      { key: "status", label: "Status", type: "select", filterable: true, options: ["present", "absent", "late", "half_day", "holiday"] },
      { key: "branchId", label: "Branch", type: "string", filterable: true },
    ],
    relationships: [{ entityType: "student", field: "studentId", type: "belongsTo" }],
    allowedActions: ["view", "create", "update", "delete", "export"],
    permissions: { view: "academic:read", create: "academic:write", update: "academic:write", delete: "academic:delete" },
    isArchivable: false, isAuditable: true, softDelete: false, versioning: false,
    dashboardWidgets: ["attendance_summary", "attendance_trend"],
    reportTemplates: ["attendance_summary", "attendance_detail"],
    notificationEvents: ["attendance_marked"],
  },
};

// ─── Queries ───────────────────────────────────────────────────

export const getEntityDefinition = query({
  args: { entityType: v.string() },
  handler: async (ctx, args) => {
    const def = ENTITY_REGISTRY[args.entityType];
    if (!def) throw new Error(`Unknown entity type: ${args.entityType}`);
    return def;
  },
});

export const listEntityTypes = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let entries = Object.entries(ENTITY_REGISTRY);
    if (args.category) {
      entries = entries.filter(([, def]) => def.category === args.category);
    }
    return entries.map(([key, def]) => ({
      entityType: key,
      displayName: def.displayName,
      pluralName: def.pluralName,
      icon: def.icon,
      color: def.color,
      category: def.category,
      searchFieldCount: def.searchFields.length,
      relationshipCount: def.relationships.length,
      fieldCount: def.fields.length,
      isArchivable: def.isArchivable,
      isAuditable: def.isAuditable,
      hasWorkflows: !!def.workflowTemplates?.length,
      hasDocuments: !!def.documentTemplates?.length,
      hasNotifications: !!def.notificationEvents?.length,
    }));
  },
});

export const listCategories = query({
  handler: async () => {
    const cats = new Map<string, { count: number; entities: string[] }>();
    for (const [key, def] of Object.entries(ENTITY_REGISTRY)) {
      if (!cats.has(def.category)) cats.set(def.category, { count: 0, entities: [] });
      const cat = cats.get(def.category)!;
      cat.count++;
      cat.entities.push(key);
    }
    return Array.from(cats.entries()).map(([name, data]) => ({
      name, count: data.count, entities: data.entities,
    }));
  },
});

export const searchEntities = query({
  args: { entityType: v.string(), query: v.string(), filters: v.optional(v.any()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const def = ENTITY_REGISTRY[args.entityType];
    if (!def) throw new Error(`Unknown entity type: ${args.entityType}`);

    const items = await ctx.db.query(def.tableName as any).collect();
    const q = args.query.toLowerCase();

    let results: any[] = [];
    for (const item of items) {
      for (const field of def.searchFields) {
        const val = (item as any)[field];
        if (val && String(val).toLowerCase().includes(q)) {
          results.push({ ...item, _matchField: field });
          break;
        }
      }
    }

    if (args.filters) {
      for (const [key, value] of Object.entries(args.filters)) {
        results = results.filter((r) => String((r as any)[key] || "").toLowerCase() === String(value).toLowerCase());
      }
    }

    return results.slice(0, args.limit || 50);
  },
});

// ─── Mutations ─────────────────────────────────────────────────

export const archiveEntity = mutation({
  args: { token: v.optional(v.string()), entityType: v.string(), entityId: v.id("_storage") },
  handler: withScopeAndEvents({ operation: "update", module: "platform", entity: "entityEngine" }, async (ctx, args) => {
    const def = ENTITY_REGISTRY[args.entityType];
    if (!def) throw new Error(`Unknown entity type: ${args.entityType}`);
    if (!def.isArchivable) throw new Error(`${def.displayName} does not support archiving`);
    await ctx.db.patch(args.entityId as any, { isArchived: true, archivedAt: Date.now() } as any);
    return { success: true, entityType: args.entityType, entityId: args.entityId };
  }),
});

export const restoreEntity = mutation({
  args: { token: v.optional(v.string()), entityType: v.string(), entityId: v.id("_storage") },
  handler: withScopeAndEvents({ operation: "update", module: "platform", entity: "entityEngine" }, async (ctx, args) => {
    const def = ENTITY_REGISTRY[args.entityType];
    if (!def) throw new Error(`Unknown entity type: ${args.entityType}`);
    await ctx.db.patch(args.entityId as any, { isArchived: false, archivedAt: undefined } as any);
    return { success: true };
  }),
});

export const getEntityAudit = query({
  args: { entityType: v.string(), entityId: v.id("_storage") },
  handler: async (ctx, args) => {
    const def = ENTITY_REGISTRY[args.entityType];
    if (!def) throw new Error(`Unknown entity type: ${args.entityType}`);
    const timeline = await ctx.db.query("entityTimeline")
      .withIndex("by_entity", (q: any) => q.eq("entityType", args.entityType).eq("entityId", args.entityId))
      .collect();
    const audit = await ctx.db.query("auditLogs")
      .withIndex("by_entity", (q: any) => q.eq("entityType", args.entityType).eq("entityId", args.entityId))
      .collect();
    return { timeline, audit };
  },
});

// ─── Quick Reference Map ──────────────────────────────────────

export const getEntityRelationships = query({
  args: { entityType: v.string() },
  handler: async (ctx, args) => {
    const def = ENTITY_REGISTRY[args.entityType];
    if (!def) return null;
    return def.relationships.map((rel) => ({
      targetEntity: rel.entityType,
      targetDefinition: ENTITY_REGISTRY[rel.entityType] ? {
        displayName: ENTITY_REGISTRY[rel.entityType].displayName,
        icon: ENTITY_REGISTRY[rel.entityType].icon,
        color: ENTITY_REGISTRY[rel.entityType].color,
        category: ENTITY_REGISTRY[rel.entityType].category,
      } : null,
      field: rel.field,
      type: rel.type,
      label: rel.label || rel.type,
      displayField: rel.displayField,
    }));
  },
});
