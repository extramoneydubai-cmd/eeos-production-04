import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── CREATE REFUND REQUEST ───────────────────────────────

export const createRefundRequest = mutation({
  args: {
    studentId: v.optional(v.id("studentMaster")),
    transactionId: v.optional(v.id("paymentTransactions")),
    invoiceId: v.optional(v.id("feeInvoices")),
    amount: v.number(),
    reason: v.string(),
    reasonCategory: v.union(v.literal("academic"), v.literal("administrative"), v.literal("financial"), v.literal("withdrawal"), v.literal("other")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const id = await ctx.db.insert("refundRequests", {
      ...args,
      status: "draft",
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return id;
  },
});

// ─── SUBMIT FOR APPROVAL ─────────────────────────────────

export const submitRefundForApproval = mutation({
  args: { id: v.id("refundRequests") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const request = await ctx.db.get(args.id);
    if (!request) throw new Error("Refund request not found");
    if (request.status !== "draft") throw new Error("Only draft refunds can be submitted");

    await ctx.db.patch(args.id, {
      status: "pending",
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// ─── APPROVE / REJECT ────────────────────────────────────

export const approveRefund = mutation({
  args: {
    id: v.id("refundRequests"),
    approve: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const request = await ctx.db.get(args.id);
    if (!request) throw new Error("Refund request not found");
    if (request.status !== "pending") throw new Error("Refund is not pending approval");

    await ctx.db.patch(args.id, {
      status: args.approve ? "approved" : "rejected",
      approvedBy: userId,
      approvedAt: Date.now(),
      notes: args.notes || request.notes,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// ─── PROCESS REFUND ──────────────────────────────────────

export const processRefund = mutation({
  args: {
    id: v.id("refundRequests"),
    refundMethod: v.string(),
    refundReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const request = await ctx.db.get(args.id);
    if (!request) throw new Error("Refund request not found");
    if (request.status !== "approved") throw new Error("Refund must be approved before processing");

    await ctx.db.patch(args.id, {
      status: "processing",
      refundMethod: args.refundMethod,
      refundReference: args.refundReference,
      processedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// ─── COMPLETE REFUND ─────────────────────────────────────

export const completeRefund = mutation({
  args: {
    id: v.id("refundRequests"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const request = await ctx.db.get(args.id);
    if (!request) throw new Error("Refund request not found");

    await ctx.db.patch(args.id, {
      status: "completed",
      notes: args.notes || request.notes,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// ─── QUERIES ─────────────────────────────────────────────

export const listRefundRequests = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("processing"), v.literal("completed"))),
    studentId: v.optional(v.id("studentMaster")),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("refundRequests");

    if (args.studentId) {
      query = query.withIndex("studentId", (q: any) => q.eq("studentId", args.studentId));
    }
    if (args.status) {
      query = query.filter((q: any) => q.eq(q.field("status"), args.status));
    }

    return query.order("desc").collect();
  },
});

export const getRefundRequest = query({
  args: { id: v.id("refundRequests") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

export const getRefundSummary = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let requests = await ctx.db.query("refundRequests").collect();

    if (args.startDate) {
      requests = requests.filter((r: any) => r.createdAt >= args.startDate!);
    }
    if (args.endDate) {
      requests = requests.filter((r: any) => r.createdAt <= args.endDate!);
    }

    const totalRequested = requests.reduce((s: number, r: any) => s + r.amount, 0);
    const totalApproved = requests
      .filter((r: any) => r.status === "approved" || r.status === "processing" || r.status === "completed")
      .reduce((s: number, r: any) => s + r.amount, 0);
    const totalCompleted = requests
      .filter((r: any) => r.status === "completed")
      .reduce((s: number, r: any) => s + r.amount, 0);
    const totalRejected = requests
      .filter((r: any) => r.status === "rejected")
      .reduce((s: number, r: any) => s + r.amount, 0);

    return {
      totalCount: requests.length,
      totalRequested,
      totalApproved,
      totalCompleted,
      totalRejected,
      pendingCount: requests.filter((r: any) => r.status === "pending").length,
      approvedCount: requests.filter((r: any) => r.status === "approved" || r.status === "processing" || r.status === "completed").length,
      completedCount: requests.filter((r: any) => r.status === "completed").length,
    };
  },
});
