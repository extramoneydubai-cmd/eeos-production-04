/**
 * Alumni Engine — Alumni Management & Engagement
 *
 * Manages alumni records, networking, events, and engagement tracking.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createAlumniRecord = mutation({
  args: {
    studentId: v.id("studentMaster"),
    graduationYear: v.number(),
    currentOccupation: v.optional(v.string()),
    currentCompany: v.optional(v.string()),
    currentLocation: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    willingToMentor: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Update student status to alumni
    await ctx.db.patch(args.studentId, { status: "alumni", updatedAt: Date.now() });

    return ctx.db.insert("alumniRecords", {
      ...args,
      engagementScore: 0,
      lastContactDate: Date.now(),
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const listAlumni = query({
  args: {
    graduationYear: v.optional(v.number()),
    willingToMentor: v.optional(v.boolean()),
    currentCompany: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("alumniRecords");
    if (args.graduationYear) q = q.filter((q2: any) => q2.eq(q2.field("graduationYear"), args.graduationYear));
    if (args.willingToMentor) q = q.filter((q2: any) => q2.eq(q2.field("willingToMentor"), args.willingToMentor));
    if (args.currentCompany) q = q.filter((q2: any) => q2.eq(q2.field("currentCompany"), args.currentCompany));
    return q.order("desc").collect();
  },
});

export const updateAlumniEngagement = mutation({
  args: {
    id: v.id("alumniRecords"),
    engagementScore: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      engagementScore: args.engagementScore,
      lastContactDate: Date.now(),
      notes: args.notes,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const getAlumniDashboard = query({
  handler: async (ctx) => {
    const alumni = await ctx.db.query("alumniRecords").collect();
    return {
      total: alumni.length,
      willingToMentor: alumni.filter((a: any) => a.willingToMentor).length,
      avgEngagementScore: alumni.length > 0
        ? Math.round(alumni.reduce((s: number, a: any) => s + (a.engagementScore || 0), 0) / alumni.length)
        : 0,
      byGraduationYear: alumni.reduce((acc: Record<string, number>, a: any) => {
        const year = a.graduationYear?.toString() || "unknown";
        acc[year] = (acc[year] || 0) + 1;
        return acc;
      }, {}),
    };
  },
});
