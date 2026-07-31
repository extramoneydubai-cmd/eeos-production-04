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

// ─── Leave SDK — wires leaveEngine ───────────────────────────────────────

/**
 * Create a new leave type (policy definition).
 */
export const createLeaveType = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    annualAllowance: v.number(),
    carryForward: v.optional(v.boolean()),
    maxCarryForward: v.optional(v.number()),
    requiresApproval: v.optional(v.boolean()),
    genderSpecific: v.optional(v.union(v.literal("male"), v.literal("female"))),
  },
  handler: async (ctx, args) => {
    const { createLeaveType } = await import("../../convex/leaveEngine");
    return createLeaveType.handler(ctx, args);
  },
});

/**
 * List all leave types.
 */
export const listLeaveTypes = query({
  handler: async (ctx) => {
    const { listLeaveTypes } = await import("../../convex/leaveEngine");
    return listLeaveTypes.handler(ctx, {});
  },
});

/**
 * Apply for leave.
 */
export const applyLeave = mutation({
  args: {
    employeeId: v.id("users"),
    leaveTypeId: v.id("leaveTypes"),
    startDate: v.number(),
    endDate: v.number(),
    reason: v.string(),
    halfDay: v.optional(v.boolean()),
    contactDuringLeave: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { applyLeave } = await import("../../convex/leaveEngine");
    return applyLeave.handler(ctx, args);
  },
});

/**
 * Approve or reject a leave application.
 */
export const approveLeave = mutation({
  args: {
    id: v.id("leaveApplications"),
    approve: v.boolean(),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { approveLeave } = await import("../../convex/leaveEngine");
    return approveLeave.handler(ctx, args);
  },
});

/**
 * List leave applications with filters.
 */
export const listLeaveApplications = query({
  args: {
    employeeId: v.optional(v.id("users")),
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("cancelled"))),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { listLeaveApplications } = await import("../../convex/leaveEngine");
    return listLeaveApplications.handler(ctx, args);
  },
});

/**
 * Get leave balance for an employee.
 */
export const getLeaveBalance = query({
  args: { employeeId: v.id("users") },
  handler: async (ctx, args) => {
    const { getLeaveBalance } = await import("../../convex/leaveEngine");
    return getLeaveBalance.handler(ctx, args);
  },
});

// ─── Payroll SDK — wires payrollEngine ───────────────────────────────────

/**
 * Create a salary structure for an employee.
 */
export const createSalaryStructure = mutation({
  args: {
    employeeId: v.id("users"),
    basicSalary: v.number(),
    hra: v.optional(v.number()),
    allowances: v.optional(v.array(v.object({ name: v.string(), amount: v.number() }))),
    deductions: v.optional(v.array(v.object({ name: v.string(), amount: v.number() }))),
    effectiveFrom: v.number(),
  },
  handler: async (ctx, args) => {
    const { createSalaryStructure } = await import("../../convex/payrollEngine");
    return createSalaryStructure.handler(ctx, args);
  },
});

/**
 * Process a pay run for the given month/year (auto attendance-based deductions).
 */
export const processPayRun = mutation({
  args: {
    month: v.number(),
    year: v.number(),
    employeeIds: v.array(v.id("users")),
    processedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { processPayRun } = await import("../../convex/payrollEngine");
    return processPayRun.handler(ctx, args);
  },
});

/**
 * Approve generated payslips.
 */
export const approvePayRun = mutation({
  args: { payslipIds: v.array(v.id("payslips")) },
  handler: async (ctx, args) => {
    const { approvePayRun } = await import("../../convex/payrollEngine");
    return approvePayRun.handler(ctx, args);
  },
});

/**
 * List payslips with filters.
 */
export const listPayslips = query({
  args: {
    employeeId: v.optional(v.id("users")),
    month: v.optional(v.number()),
    year: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { listPayslips } = await import("../../convex/payrollEngine");
    return listPayslips.handler(ctx, args);
  },
});
