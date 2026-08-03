/**
 * Leave Engine — Employee Leave Management
 *
 * Manages leave applications, approvals, balance tracking,
 * leave policies, and attendance integration.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents } from "./withScopeAndEvents";
import { Events } from "./eventRegistry";

// ─── Enterprise Pipeline Config ─────────────────────────────────
// Every leave mutation routes through withScopeAndEvents() so
// records emit audit, timeline, event-bus, notification-matrix,
// workflow, automation and dashboard-refresh signals. getUserId
// returns undefined intentionally (consistent with the adopted
// engines): leave args carry no reliable performer id for scope
// enforcement today, so scope checks stay no-ops while the pipeline
// is fully wired.
const leavePipeline = {
  module: "hr",
  getUserId: () => undefined,
  getEntityCompanyId: () => undefined,
  getEntityBranchId: () => undefined,
  triggerWorkflow: true,
  triggerAutomation: true,
  registerSearch: false,
  signalDashboard: true,
} as const;

// ─── Leave Types ─────────────────────────────────────────────

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
  handler: withScopeAndEvents(
    {
      ...leavePipeline,
      operation: "create",
      entity: "leave_type",
      eventType: "hr.leave_type.created",
      title: "Leave Type Created",
      notifyViaMatrix: false,
    },
    async (ctx, args) => {
      return ctx.db.insert("leaveTypes", {
        ...args,
        isActive: true,
        createdAt: Date.now(),
      });
    },
  ),
});

export const listLeaveTypes = query({
  handler: async (ctx) => ctx.db.query("leaveTypes").collect(),
});

// ─── Leave Applications ──────────────────────────────────────

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
  handler: withScopeAndEvents(
    {
      ...leavePipeline,
      operation: "create",
      entity: "leave_application",
      eventType: Events.HR.LEAVE_APPLIED,
      title: "Leave Applied",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
      const userId = await getAuthUserId(ctx);
      if (!userId) throw new Error("Not authenticated");

      // Calculate number of days
      const dayMs = 86400000;
      const days = Math.round((args.endDate - args.startDate) / dayMs) + 1;

      // Check balance
      const leaveType = await ctx.db.get(args.leaveTypeId);
      if (!leaveType) throw new Error("Leave type not found");

      const balance = await ctx.db.query("leaveBalances")
        .withIndex("employeeId_leaveTypeId", (q: any) =>
          q.eq("employeeId", args.employeeId).eq("leaveTypeId", args.leaveTypeId))
        .first();

      const availableBalance = balance ? (balance as any).balance : (leaveType as any).annualAllowance;
      if (days > availableBalance && (leaveType as any).requiresApproval !== false) {
        // Still allow applying, but mark as potential excess
      }

      return ctx.db.insert("leaveApplications", {
        employeeId: args.employeeId,
        leaveTypeId: args.leaveTypeId,
        startDate: args.startDate,
        endDate: args.endDate,
        days,
        halfDay: args.halfDay || false,
        reason: args.reason,
        contactDuringLeave: args.contactDuringLeave,
        status: "pending",
        appliedOn: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    },
  ),
});

export const approveLeave = mutation({
  args: {
    id: v.id("leaveApplications"),
    approve: v.boolean(),
    comments: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      ...leavePipeline,
      operation: "approve",
      entity: "leave_application",
      eventType: "hr.leave.decided",
      title: "Leave Decision",
      notifyViaMatrix: true,
    },
    async (ctx, args) => {
      const userId = await getAuthUserId(ctx);
      if (!userId) throw new Error("Not authenticated");

      const leave = await ctx.db.get(args.id);
      if (!leave) throw new Error("Leave not found");
      if (leave.status !== "pending") throw new Error("Leave is not pending");

      await ctx.db.patch(args.id, {
        status: args.approve ? "approved" : "rejected",
        approvedBy: userId,
        approvedAt: Date.now(),
        comments: args.comments,
        updatedAt: Date.now(),
      });

      // Update leave balance if approved
      if (args.approve) {
        const existing = await ctx.db.query("leaveBalances")
          .withIndex("employeeId_leaveTypeId", (q: any) =>
            q.eq("employeeId", leave.employeeId).eq("leaveTypeId", leave.leaveTypeId))
          .first();

        if (existing) {
          await ctx.db.patch(existing._id, {
            balance: (existing as any).balance - leave.days,
            used: (existing as any).used + leave.days,
          });
        } else {
          await ctx.db.insert("leaveBalances", {
            employeeId: leave.employeeId,
            leaveTypeId: (leave as any).leaveTypeId,
            balance: (((await ctx.db.get((leave as any).leaveTypeId)) as any)?.annualAllowance ?? 0) - leave.days,
            used: leave.days,
            year: new Date().getFullYear(),
            createdAt: Date.now(),
          });
        }
      }

      return args.id;
    },
  ),
});

export const listLeaveApplications = query({
  args: {
    employeeId: v.optional(v.id("users")),
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("cancelled"))),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("leaveApplications");
    if (args.employeeId) q = q.filter((q2: any) => q2.eq(q2.field("employeeId"), args.employeeId));
    if (args.status) q = q.filter((q2: any) => q2.eq(q2.field("status"), args.status));
    let results = await q.order("desc").collect();
    if (args.startDate) results = results.filter((r: any) => r.startDate >= args.startDate!);
    if (args.endDate) results = results.filter((r: any) => r.endDate <= args.endDate!);
    return results;
  },
});

export const getLeaveBalance = query({
  args: { employeeId: v.id("users") },
  handler: async (ctx, args) => {
    const balances = await ctx.db.query("leaveBalances")
      .withIndex("employeeId", (q: any) => q.eq("employeeId", args.employeeId))
      .collect();
    return balances;
  },
});
