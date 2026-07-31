/**
 * Refund Calculation Engine — Pro-rata, Non-refundable, Penalty & GST Adjustment
 *
 * Automatically determines refund amounts based on fee structure,
 * time elapsed, non-refundable components, and penalties.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── Refund Calculation ─────────────────────────────────────

export const calculateRefund = query({
  args: {
    studentId: v.id("studentMaster"),
    feeStructureId: v.optional(v.id("feeStructures")),
    withdrawalDate: v.number(),
    reasonCategory: v.union(v.literal("academic"), v.literal("administrative"), v.literal("financial"), v.literal("withdrawal"), v.literal("other")),
  },
  handler: async (ctx, args) => {
    // Get student fee account
    const feeAccounts = await ctx.db.query("feeAccounts")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .collect();
    const feeAccount = feeAccounts[0];

    if (!feeAccount) {
      return { error: "No fee account found for student" };
    }

    const totalFee = (feeAccount as any).totalFee || 0;
    const totalPaid = (feeAccount as any).totalPaid || 0;
    const dueDate = (feeAccount as any).createdAt || Date.now();

    // Calculate days since enrollment
    const daysSinceEnrollment = Math.floor((args.withdrawalDate - dueDate) / 86400000);
    const totalCourseDays = 365; // Default course duration in days

    // 1. Determine non-refundable component
    //    Typically admission fees, registration, etc.
    const nonRefundableFee = totalFee * 0.1; // 10% non-refundable (can be overridden by policy)

    // Get associated refund policy if any
    const refundPolicies = await ctx.db.query("refundPolicies").collect();
    const activePolicy = refundPolicies.find((p: any) => p.isActive);

    let nonRefundableAmount = nonRefundableFee;
    let refundPercentage = 100;

    if (activePolicy) {
      const policy = activePolicy as any;
      nonRefundableAmount = policy.nonRefundableAmount || nonRefundableFee;

      // Find applicable slab based on days since enrollment
      const slabs = policy.slabs || [];
      for (const slab of slabs.sort((a: any, b: any) => b.daysFrom - a.daysFrom)) {
        if (daysSinceEnrollment >= slab.daysFrom) {
          refundPercentage = slab.refundPercent;
          break;
        }
      }
    } else {
      // Default pro-rata calculation
      if (daysSinceEnrollment <= 7) refundPercentage = 90;
      else if (daysSinceEnrollment <= 30) refundPercentage = 75;
      else if (daysSinceEnrollment <= 90) refundPercentage = 50;
      else if (daysSinceEnrollment <= 180) refundPercentage = 25;
      else refundPercentage = 0;
    }

    // 2. Calculate refundable amount
    const adjustedFee = totalFee - nonRefundableAmount;
    const grossRefund = (adjustedFee * refundPercentage) / 100;

    // 3. Apply penalties
    const penalties = await ctx.db.query("penaltyEntries")
      .filter((q: any) => q.eq(q.field("studentId"), args.studentId))
      .filter((q: any) => q.eq(q.field("status"), "pending"))
      .collect();

    const totalPenalty = penalties.reduce((s: number, p: any) => s + p.amount, 0);
    const afterPenalty = Math.max(0, grossRefund - totalPenalty);

    // 4. GST adjustment
    const gstRate = (feeAccount as any).gstRate || 0;
    const gstOnRefund = gstRate > 0 ? (afterPenalty * gstRate) / (100 + gstRate) : 0;
    const netRefund = afterPenalty - gstOnRefund;

    // 5. Scholarship/discount adjustment
    const discounts = await ctx.db.query("discounts")
      .filter((q: any) => q.eq(q.field("studentId"), args.studentId))
      .collect();
    const totalDiscount = discounts.reduce((s: number, d: any) => s + d.amount, 0);

    return {
      calculationDetails: {
        totalFee,
        totalPaid,
        outstandingBalance: totalFee - totalPaid,
        daysSinceEnrollment,
        nonRefundableAmount,
        refundPercentage,
        adjustedFee,
        grossRefund,
        totalPenalty,
        afterPenalty,
        gstOnRefund,
        totalDiscount,
        netRefund: Math.round(netRefund * 100) / 100,
      },
      breakdown: {
        refundableAmount: Math.round(grossRefund * 100) / 100,
        nonRefundableAmount: Math.round(nonRefundableAmount * 100) / 100,
        penaltyDeduction: Math.round(totalPenalty * 100) / 100,
        gstAdjustment: Math.round(gstOnRefund * 100) / 100,
        discountAdjustment: Math.round(totalDiscount * 100) / 100,
        finalPayable: Math.round(Math.max(0, netRefund) * 100) / 100,
      },
      policyApplied: activePolicy ? (activePolicy as any).name : "default_pro_rata",
      refundEligible: netRefund > 0,
    };
  },
});

// ─── Refund Policy Management ──────────────────────────────

export const createRefundPolicy = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    nonRefundableAmount: v.optional(v.number()),
    nonRefundablePercent: v.optional(v.number()),
    slabs: v.array(v.object({
      daysFrom: v.number(),
      daysTo: v.optional(v.number()),
      refundPercent: v.number(),
    })),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.isDefault) {
      // Deactivate all other policies
      const existing = await ctx.db.query("refundPolicies").collect();
      for (const policy of existing) {
        await ctx.db.patch(policy._id, { isActive: false, updatedAt: Date.now() });
      }
    }
    return ctx.db.insert("refundPolicies", {
      name: args.name,
      description: args.description,
      nonRefundableAmount: args.nonRefundableAmount,
      nonRefundablePercent: args.nonRefundablePercent,
      slabs: args.slabs,
      isActive: args.isDefault || false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const listRefundPolicies = query({
  handler: async (ctx) => ctx.db.query("refundPolicies").collect(),
});

// ─── Create Refund with Auto-Calculation ────────────────────

export const createCalculatedRefund = mutation({
  args: {
    studentId: v.id("studentMaster"),
    withdrawalDate: v.number(),
    reasonCategory: v.union(v.literal("academic"), v.literal("administrative"), v.literal("financial"), v.literal("withdrawal"), v.literal("other")),
    reason: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Calculate refund
    const calculation = await (calculateRefund as any)(ctx, {
      studentId: args.studentId,
      withdrawalDate: args.withdrawalDate,
      reasonCategory: args.reasonCategory,
    });

    if (!calculation.refundEligible) {
      throw new Error("No refund eligible based on current policy");
    }

    // Create refund request with pre-calculated amounts
    const refundId = await ctx.db.insert("refundRequests", {
      studentId: args.studentId,
      amount: calculation.breakdown.finalPayable,
      reason: args.reason,
      reasonCategory: args.reasonCategory,
      notes: args.notes,
      calculationData: JSON.stringify(calculation),
      status: "draft",
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      refundId,
      calculation,
    };
  },
});
