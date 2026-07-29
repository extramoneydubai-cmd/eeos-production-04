/**
 * Performance Engine — Employee Performance Management
 *
 * Manages reviews, appraisals, goals, KPIs, and feedback.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createReview = mutation({
  args: {
    employeeId: v.id("users"),
    reviewerId: v.id("users"),
    reviewPeriod: v.string(),
    reviewType: v.union(v.literal("quarterly"), v.literal("half_yearly"), v.literal("annual"), v.literal("probation"), v.literal("project")),
    ratings: v.optional(v.array(v.object({ category: v.string(), score: v.number(), comment: v.optional(v.string()) }))),
    overallComments: v.optional(v.string()),
    goals: v.optional(v.array(v.object({ title: v.string(), description: v.optional(v.string()), targetDate: v.optional(v.number()), status: v.optional(v.string()) }))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const reviewId = await ctx.db.insert("performanceReviews", {
      employeeId: args.employeeId,
      reviewerId: args.reviewerId,
      reviewPeriod: args.reviewPeriod,
      reviewType: args.reviewType,
      ratings: args.ratings,
      overallRating: args.ratings
        ? Math.round(args.ratings.reduce((s: number, r) => s + r.score, 0) / args.ratings.length)
        : 0,
      overallComments: args.overallComments,
      status: "draft",
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    if (args.goals) {
      for (const goal of args.goals) {
        await ctx.db.insert("performanceGoals", {
          reviewId,
          employeeId: args.employeeId,
          title: goal.title,
          description: goal.description,
          targetDate: goal.targetDate,
          status: goal.status || "pending",
          createdAt: Date.now(),
        });
      }
    }

    return reviewId;
  },
});

export const submitReview = mutation({
  args: { id: v.id("performanceReviews") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "submitted", submittedAt: Date.now(), updatedAt: Date.now() });
    return args.id;
  },
});

export const acknowledgeReview = mutation({
  args: { id: v.id("performanceReviews"), comments: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "acknowledged", employeeComments: args.comments, updatedAt: Date.now() });
    return args.id;
  },
});

export const listReviews = query({
  args: {
    employeeId: v.optional(v.id("users")),
    reviewerId: v.optional(v.id("users")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("performanceReviews");
    if (args.employeeId) q = q.filter((q2: any) => q2.eq(q2.field("employeeId"), args.employeeId));
    if (args.reviewerId) q = q.filter((q2: any) => q2.eq(q2.field("reviewerId"), args.reviewerId));
    if (args.status) q = q.filter((q2: any) => q2.eq(q2.field("status"), args.status));
    return q.order("desc").collect();
  },
});

export const getPerformanceSummary = query({
  args: { employeeId: v.id("users") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db.query("performanceReviews")
      .filter((q: any) => q.eq(q.field("employeeId"), args.employeeId))
      .collect();

    const completed = reviews.filter((r: any) => r.status === "acknowledged");
    const avgRating = completed.length > 0
      ? Math.round(completed.reduce((s: number, r: any) => s + (r.overallRating || 0), 0) / completed.length)
      : 0;

    return {
      totalReviews: reviews.length,
      completedReviews: completed.length,
      pendingReviews: reviews.filter((r: any) => r.status !== "acknowledged").length,
      averageRating: avgRating,
    };
  },
});
