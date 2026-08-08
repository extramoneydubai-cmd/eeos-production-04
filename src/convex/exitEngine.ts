/**
 * Exit Engine — Employee Offboarding & Exit Management
 *
 * Manages resignations, exit interviews, clearances,
 * F&F settlement, and experience letter generation.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

export const initiateExit = mutation({
  args: { token: v.optional(v.string()),
    employeeId: v.id("users"),
    resignationDate: v.number(),
    lastWorkingDay: v.number(),
    reason: v.string(),
    reasonCategory: v.union(v.literal("resignation"), v.literal("retirement"), v.literal("termination"), v.literal("mutual"), v.literal("end_of_contract")),
    comments: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "hr", entity: "exitEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    const exitId = await ctx.db.insert("exitRecords", {
      employeeId: args.employeeId,
      resignationDate: args.resignationDate,
      lastWorkingDay: args.lastWorkingDay,
      reason: args.reason,
      reasonCategory: args.reasonCategory,
      comments: args.comments,
      status: "initiated",
      initiatedBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create clearance checklist
    const clearanceItems = [
      "IT Assets Return", "ID Card Return", "Library Clearance",
      "Finance Clearance", "HR Clearance", "Department Clearance"
    ];
    for (const item of clearanceItems) {
      await ctx.db.insert("exitClearanceItems", {
        exitId,
        item,
        status: "pending",
        createdAt: Date.now(),
      });
    }

    return exitId;
  }),
});

export const updateClearanceItem = mutation({
  args: { token: v.optional(v.string()),
    id: v.id("exitClearanceItems"),
    status: v.union(v.literal("cleared"), v.literal("pending"), v.literal("waived")),
    clearedBy: v.optional(v.id("users")),
    comments: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "hr", entity: "exitEngine" }, async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      clearedBy: args.clearedBy,
      comments: args.comments,
      clearedAt: args.status === "cleared" ? Date.now() : undefined,
      updatedAt: Date.now(),
    });
    return args.id;
  }),
});

export const processFullFinal = mutation({
  args: { token: v.optional(v.string()),
    exitId: v.id("exitRecords"),
    salaryDues: v.number(),
    noticePeriodDeduction: v.optional(v.number()),
    otherDeductions: v.optional(v.array(v.object({ reason: v.string(), amount: v.number() }))),
    netPayable: v.number(),
    paymentReference: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "hr", entity: "exitEngine" }, async (ctx, args) => {
    await ctx.db.patch(args.exitId, {
      fullFinalAmount: args.netPayable,
      fullFinalStatus: "processed",
      paymentReference: args.paymentReference,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("fullFinalSettlements", {
      exitId: args.exitId,
      salaryDues: args.salaryDues,
      noticePeriodDeduction: args.noticePeriodDeduction || 0,
      otherDeductions: args.otherDeductions,
      totalDeductions: (args.noticePeriodDeduction || 0) + (args.otherDeductions || []).reduce((s: number, d: any) => s + d.amount, 0),
      netPayable: args.netPayable,
      paymentReference: args.paymentReference,
      status: "pending_payment",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return args.exitId;
  }),
});

export const completeExit = mutation({
  args: { token: v.optional(v.string()),
    exitId: v.id("exitRecords"),
    eligibleForExperienceLetter: v.optional(v.boolean()),
    feedbackScore: v.optional(v.number()),
    rehireEligible: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "hr", entity: "exitEngine" }, async (ctx, args) => {
    const exit = await ctx.db.get(args.exitId);
    if (!exit) throw new Error("Exit record not found");

    await ctx.db.patch(args.exitId, {
      status: "completed",
      completedAt: Date.now(),
      eligibleForExperienceLetter: args.eligibleForExperienceLetter ?? true,
      rehireEligible: args.rehireEligible ?? true,
      notes: args.notes,
      updatedAt: Date.now(),
    });

    // Update employee status
    await ctx.db.patch(exit.employeeId, { status: "exited", updatedAt: Date.now() });

    // Generate experience letter record if eligible
    if (args.eligibleForExperienceLetter !== false) {
      await ctx.db.insert("experienceLetters", {
        employeeId: exit.employeeId,
        exitId: args.exitId,
        issueDate: Date.now(),
        status: "generated",
        createdAt: Date.now(),
      });
    }

    return args.exitId;
  }),
});

export const listExitRecords = query({
  args: {
    status: v.optional(v.union(v.literal("initiated"), v.literal("clearance_pending"), v.literal("full_final_pending"), v.literal("completed"), v.literal("cancelled"))),
    employeeId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("exitRecords");
    if (args.status) q = q.filter((q2: any) => q2.eq(q2.field("status"), args.status));
    if (args.employeeId) q = q.filter((q2: any) => q2.eq(q2.field("employeeId"), args.employeeId));
    return q.order("desc").collect();
  },
});
