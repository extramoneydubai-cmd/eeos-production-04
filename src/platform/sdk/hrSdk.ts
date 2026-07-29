/**
 * HR SDK — Enterprise Human Resources Data Layer
 *
 * Every business module MUST use this SDK to access employee/HR data.
 * No module may directly query employees, offers, or recruitments.
 *
 * Usage:
 *   import { hrSdk } from "@/platform/sdk/hrSdk";
 *   const employee = await hrSdk.get(ctx, { employeeId });
 *   const list = await hrSdk.list(ctx, { ...filters });
 */

import { v } from "convex/values";
import { mutation, query } from "../../convex/_generated/server";
import { Id } from "../../convex/_generated/dataModel";

// ─── SDK Queries — Employee Engine ───────────────────────────────────────

/**
 * Get a single employee with all related data.
 */
export const get = query({
  args: { employeeId: v.id("employees") },
  handler: async (ctx, args) => {
    const { getEmployee } = await import("../../convex/employeeEngine");
    return getEmployee.handler(ctx, args);
  },
});

/**
 * List employees with pagination and filters.
 */
export const list = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    departmentId: v.optional(v.id("departments")),
    status: v.optional(v.string()),
    employmentType: v.optional(v.string()),
    searchTerm: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { listEmployees } = await import("../../convex/employeeEngine");
    return listEmployees.handler(ctx, args);
  },
});

/**
 * Search employees by name, code, or email.
 */
export const search = query({
  args: {
    searchTerm: v.string(),
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { searchEmployees } = await import("../../convex/employeeSearch");
    return searchEmployees.handler(ctx, args);
  },
});

/**
 * Quick autocomplete search for employees.
 */
export const quickSearch = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { quickEmployeeSearch } = await import("../../convex/employeeSearch");
    return quickEmployeeSearch.handler(ctx, args);
  },
});

/**
 * Find employee by employee code.
 */
export const findByCode = query({
  args: { employeeCode: v.string() },
  handler: async (ctx, args) => {
    const { findByEmployeeCode } = await import("../../convex/employeeSearch");
    return findByEmployeeCode.handler(ctx, args);
  },
});

/**
 * Get employee summary (all related data).
 */
export const getSummary = query({
  args: { employeeId: v.id("employees") },
  handler: async (ctx, args) => {
    const { getEmployeeSummary } = await import("../../convex/employeeSearch");
    return getEmployeeSummary.handler(ctx, args);
  },
});

/**
 * Get employee statistics.
 */
export const getStats = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const { getEmployeeStats } = await import("../../convex/employeeEngine");
    return getEmployeeStats.handler(ctx, args);
  },
});

/**
 * Get employee timeline/history.
 */
export const getTimeline = query({
  args: { employeeId: v.id("employees") },
  handler: async (ctx, args) => {
    const { getEmployeeTimeline } = await import("../../convex/employeeLifecycle");
    return getEmployeeTimeline.handler(ctx, args);
  },
});

// ─── SDK Mutations — Employee Engine ─────────────────────────────────────

/**
 * Create a new employee.
 */
export const create = mutation({
  args: {
    firstName: v.string(),
    middleName: v.optional(v.string()),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    dateOfBirth: v.optional(v.number()),
    gender: v.optional(v.string()),
    employeeCode: v.optional(v.string()),
    employmentType: v.optional(v.string()),
    departmentId: v.optional(v.id("departments")),
    designationId: v.optional(v.id("designations")),
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    reportingTo: v.optional(v.id("employees")),
    dateOfJoining: v.optional(v.number()),
    salary: v.optional(v.number()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    pincode: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    emergencyPhone: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { createEmployee } = await import("../../convex/employeeEngine");
    return createEmployee.handler(ctx, args as any);
  },
});

/**
 * Update an existing employee.
 */
export const update = mutation({
  args: {
    employeeId: v.id("employees"),
    updates: v.object({
      firstName: v.optional(v.string()),
      middleName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      departmentId: v.optional(v.id("departments")),
      designationId: v.optional(v.id("designations")),
      reportingTo: v.optional(v.id("employees")),
      salary: v.optional(v.number()),
      address: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      pincode: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { updateEmployee } = await import("../../convex/employeeEngine");
    return updateEmployee.handler(ctx, args as any);
  },
});

/**
 * Archive an employee.
 */
export const archive = mutation({
  args: {
    employeeId: v.id("employees"),
    reason: v.optional(v.string()),
    performedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { archiveEmployee } = await import("../../convex/employeeEngine");
    return archiveEmployee.handler(ctx, args);
  },
});

/**
 * Restore an archived employee.
 */
export const restore = mutation({
  args: {
    employeeId: v.id("employees"),
    performedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { restoreEmployee } = await import("../../convex/employeeEngine");
    return restoreEmployee.handler(ctx, args);
  },
});

// ─── Employee Lifecycle Mutations ────────────────────────────────────────

/**
 * Onboard a new employee.
 */
export const onboard = mutation({
  args: {
    employeeId: v.id("employees"),
    performedBy: v.id("users"),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { onboardEmployee } = await import("../../convex/employeeLifecycle");
    return onboardEmployee.handler(ctx, args);
  },
});

/**
 * Confirm employee (after probation).
 */
export const confirm = mutation({
  args: {
    employeeId: v.id("employees"),
    performedBy: v.id("users"),
    effectiveDate: v.number(),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { confirmEmployee } = await import("../../convex/employeeLifecycle");
    return confirmEmployee.handler(ctx, args);
  },
});

/**
 * Transfer employee to another department/branch.
 */
export const transfer = mutation({
  args: {
    employeeId: v.id("employees"),
    toDepartmentId: v.optional(v.id("departments")),
    toBranchId: v.optional(v.id("branches")),
    effectiveDate: v.number(),
    performedBy: v.id("users"),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { transferEmployee } = await import("../../convex/employeeLifecycle");
    return transferEmployee.handler(ctx, args as any);
  },
});

/**
 * Promote employee.
 */
export const promote = mutation({
  args: {
    employeeId: v.id("employees"),
    newDesignationId: v.optional(v.id("designations")),
    newSalary: v.optional(v.number()),
    effectiveDate: v.number(),
    performedBy: v.id("users"),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { promoteEmployee } = await import("../../convex/employeeLifecycle");
    return promoteEmployee.handler(ctx, args as any);
  },
});

// ─── Offer & Recruitment ─────────────────────────────────────────────────

/**
 * Get recruitment analytics.
 */
export const getRecruitmentAnalytics = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const { getRecruitmentAnalytics } = await import("../../convex/recruitmentEngine");
    return getRecruitmentAnalytics.handler(ctx, args);
  },
});

/**
 * Get offer stats.
 */
export const getOfferStats = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    const { getOfferStats } = await import("../../convex/offerEngine");
    return getOfferStats.handler(ctx, args);
  },
});
