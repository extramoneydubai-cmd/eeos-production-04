/**
 * Student SDK — Enterprise Student Data Access Layer
 *
 * Every business module MUST use this SDK to access student data.
 * No module may directly query the "studentMaster" table.
 *
 * Integrates with:
 * - People SDK (person data)
 * - Calendar SDK (student events)
 * - Dashboard SDK (KPIs, charts)
 * - Query Platform (secure pagination)
 * - Event Pipeline (writes audit/timeline)
 *
 * Usage:
 *   import { studentSdk } from "@/platform/sdk/studentSdk";
 *   const student = await studentSdk.get(ctx, { studentId });
 *   const list = await studentSdk.list(ctx, { ...filters });
 */

import { v } from "convex/values";
import { mutation, query } from "../../convex/_generated/server";
import { Id } from "../../convex/_generated/dataModel";

// ─── Student KPI Definitions ──────────────────────────────────────
export const STUDENT_KPIS = [
  { label: "Total Students", key: "total", icon: "GraduationCap", color: "blue" },
  { label: "Active", key: "activeCount", icon: "UserCheck", color: "green" },
  { label: "Admitted", key: "admittedCount", icon: "UserPlus", color: "violet" },
  { label: "Alumni", key: "alumniCount", icon: "Award", color: "indigo" },
] as const;

// ─── Student Status Colors ────────────────────────────────────────
export const STUDENT_STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500",
  admitted: "bg-blue-500",
  lead: "bg-amber-500",
  qualified: "bg-violet-500",
  trial: "bg-cyan-500",
  enquiry: "bg-slate-400",
  completed: "bg-green-700",
  alumni: "bg-indigo-500",
  cancelled: "bg-rose-500",
  suspended: "bg-orange-500",
};

// ─── Valid Status Transitions ─────────────────────────────────────
export const STUDENT_STATUS_TRANSITIONS: Record<string, string[]> = {
  enquiry: ["lead", "qualified", "cancelled"],
  lead: ["qualified", "trial", "admitted", "cancelled"],
  qualified: ["trial", "admitted", "cancelled"],
  trial: ["admitted", "active", "qualified", "cancelled"],
  admitted: ["active", "cancelled"],
  active: ["completed", "suspended", "cancelled"],
  suspended: ["active", "cancelled"],
  completed: ["alumni"],
  alumni: [],
};

// ─── SDK Queries ──────────────────────────────────────────────────

/**
 * Get a student with full data (person, contacts, academic profile, etc.)
 * Delegates to studentEngine.getStudent.
 */
export const get = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    const { getStudent } = await import("../../convex/studentEngine");
    return getStudent.handler(ctx, args);
  },
});

/**
 * List students with pagination and filters.
 */
export const list = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    status: v.optional(v.string()),
    academicYearId: v.optional(v.id("academicSessions")),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { listStudents } = await import("../../convex/studentEngine");
    return listStudents.handler(ctx, args);
  },
});

/**
 * Search students by name, code, admission number.
 */
export const search = query({
  args: {
    searchTerm: v.string(),
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { searchStudents } = await import("../../convex/studentSearch");
    return searchStudents.handler(ctx, args);
  },
});

/**
 * Quick autocomplete search.
 */
export const quickSearch = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { quickStudentSearch } = await import("../../convex/studentSearch");
    return quickStudentSearch.handler(ctx, args);
  },
});

/**
 * Get enrollment statistics.
 */
export const getStats = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const { getEnrollmentStats } = await import("../../convex/studentLifecycle");
    return getEnrollmentStats.handler(ctx, args);
  },
});

/**
 * Find by admission number.
 */
export const findByAdmissionNumber = query({
  args: { admissionNumber: v.string() },
  handler: async (ctx, args) => {
    const { findByAdmissionNumber } = await import("../../convex/studentSearch");
    return findByAdmissionNumber.handler(ctx, args);
  },
});

/**
 * Find by student code.
 */
export const findByStudentCode = query({
  args: { studentCode: v.string() },
  handler: async (ctx, args) => {
    const { findByStudentCode } = await import("../../convex/studentSearch");
    return findByStudentCode.handler(ctx, args);
  },
});

/**
 * Get full student summary (all related data).
 */
export const getSummary = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    const { getStudentSummary } = await import("../../convex/studentSearch");
    return getStudentSummary.handler(ctx, args);
  },
});

/**
 * Get student timeline.
 */
export const getTimeline = query({
  args: { studentId: v.id("studentMaster"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { getStudentTimeline } = await import("../../convex/studentLifecycle");
    return getStudentTimeline.handler(ctx, args);
  },
});

/**
 * Get student academic history.
 */
export const getAcademicHistory = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    const { getStudentAcademicHistory } = await import("../../convex/studentLifecycle");
    return getStudentAcademicHistory.handler(ctx, args);
  },
});

/**
 * Get status history.
 */
export const getStatusHistory = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    const { getStudentStatusHistory } = await import("../../convex/studentLifecycle");
    return getStudentStatusHistory.handler(ctx, args);
  },
});

// ─── SDK Mutations ────────────────────────────────────────────────

/**
 * Create student (creates Person + Student + QR + Profile).
 */
export const create = mutation({
  args: {
    firstName: v.string(),
    middleName: v.optional(v.string()),
    lastName: v.string(),
    dateOfBirth: v.optional(v.number()),
    gender: v.optional(v.string()),
    nationality: v.optional(v.string()),
    phone: v.string(),
    email: v.optional(v.string()),
    leadId: v.optional(v.id("leadMaster")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    organizationId: v.optional(v.id("organizations")),
    academicYearId: v.optional(v.id("academicSessions")),
    academicProfile: v.optional(
      v.object({
        verticalId: v.optional(v.id("verticals")),
        subVerticalId: v.optional(v.id("subVerticals")),
        boardId: v.optional(v.id("boards")),
        courseId: v.optional(v.id("courses")),
        batchId: v.optional(v.id("academicBatches")),
        sectionId: v.optional(v.id("academicSections")),
        semesterId: v.optional(v.id("academicSemesters")),
        termId: v.optional(v.id("academicTerms")),
      })
    ),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { createStudent } = await import("../../convex/studentEngine");
    return createStudent.handler(ctx, args as any);
  },
});

/**
 * Admit student.
 */
export const admit = mutation({
  args: {
    studentId: v.id("studentMaster"),
    performedBy: v.id("users"),
    admissionType: v.optional(v.string()),
    courseId: v.optional(v.id("courses")),
    batchId: v.optional(v.id("academicBatches")),
    totalFee: v.optional(v.number()),
    discountAmount: v.optional(v.number()),
    finalFee: v.optional(v.number()),
    installmentCount: v.optional(v.number()),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { admitStudent } = await import("../../convex/studentLifecycle");
    return admitStudent.handler(ctx, args as any);
  },
});

/**
 * Enroll student (activate after admission).
 */
export const enroll = mutation({
  args: {
    studentId: v.id("studentMaster"),
    performedBy: v.id("users"),
    academicProfile: v.optional(
      v.object({
        verticalId: v.optional(v.id("verticals")),
        subVerticalId: v.optional(v.id("subVerticals")),
        boardId: v.optional(v.id("boards")),
        courseId: v.optional(v.id("courses")),
        batchId: v.optional(v.id("academicBatches")),
        sectionId: v.optional(v.id("academicSections")),
        semesterId: v.optional(v.id("academicSemesters")),
        termId: v.optional(v.id("academicTerms")),
      })
    ),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { enrollStudent } = await import("../../convex/studentLifecycle");
    return enrollStudent.handler(ctx, args as any);
  },
});

/**
 * Promote student to next year.
 */
export const promote = mutation({
  args: {
    studentId: v.id("studentMaster"),
    performedBy: v.id("users"),
    nextYear: v.number(),
    nextAcademicProfile: v.optional(
      v.object({
        verticalId: v.optional(v.id("verticals")),
        subVerticalId: v.optional(v.id("subVerticals")),
        boardId: v.optional(v.id("boards")),
        courseId: v.optional(v.id("courses")),
        batchId: v.optional(v.id("academicBatches")),
        sectionId: v.optional(v.id("academicSections")),
        semesterId: v.optional(v.id("academicSemesters")),
        termId: v.optional(v.id("academicTerms")),
      })
    ),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { promoteStudent } = await import("../../convex/studentLifecycle");
    return promoteStudent.handler(ctx, args as any);
  },
});

/**
 * Transfer student to another branch/company.
 */
export const transfer = mutation({
  args: {
    studentId: v.id("studentMaster"),
    performedBy: v.id("users"),
    toBranchId: v.optional(v.id("branches")),
    toCompanyId: v.optional(v.id("companies")),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { transferStudent } = await import("../../convex/studentLifecycle");
    return transferStudent.handler(ctx, args as any);
  },
});

/**
 * Suspend student.
 */
export const suspend = mutation({
  args: {
    studentId: v.id("studentMaster"),
    performedBy: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { suspendStudent } = await import("../../convex/studentLifecycle");
    return suspendStudent.handler(ctx, args as any);
  },
});

/**
 * Archive student.
 */
export const archive = mutation({
  args: {
    studentId: v.id("studentMaster"),
    reason: v.optional(v.string()),
    performedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { archiveStudent } = await import("../../convex/studentEngine");
    return archiveStudent.handler(ctx, args as any);
  },
});

/**
 * Graduate student.
 */
export const graduate = mutation({
  args: {
    studentId: v.id("studentMaster"),
    performedBy: v.id("users"),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { graduateStudent } = await import("../../convex/studentLifecycle");
    return graduateStudent.handler(ctx, args as any);
  },
});
