/**
 * Production SDK — Enterprise Production Management
 *
 * Handles content writing, video production, recording, editing,
 * review, publishing, course packaging, and digital asset library.
 */

import { v } from "convex/values";
import { mutation, query } from "../convex/_generated/server";
import { Id } from "../convex/_generated/dataModel";

// ─── Production Tasks ────────────────────────────────────────

export const createProductionTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    productionType: v.union(v.literal("content_writing"), v.literal("video_production"), v.literal("recording"), v.literal("editing"), v.literal("graphic_design"), v.literal("course_packaging"), v.literal("other")),
    assignedTo: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
    courseId: v.optional(v.id("courses")),
    lessonId: v.optional(v.id("lessons")),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("productionTasks", {
      title: args.title,
      description: args.description,
      productionType: args.productionType,
      assignedTo: args.assignedTo,
      dueDate: args.dueDate,
      priority: args.priority || "medium",
      courseId: args.courseId,
      lessonId: args.lessonId,
      status: "draft",
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateProductionTaskStatus = mutation({
  args: {
    id: v.id("productionTasks"),
    status: v.union(v.literal("draft"), v.literal("in_progress"), v.literal("review"), v.literal("approved"), v.literal("published"), v.literal("rejected"), v.literal("archived")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status, updatedAt: Date.now() });
    return args.id;
  },
});

export const listProductionTasks = query({
  args: {
    status: v.optional(v.string()),
    productionType: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    courseId: v.optional(v.id("courses")),
  },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("productionTasks");
    if (args.status) q = q.filter((q2: any) => q2.eq(q2.field("status"), args.status));
    if (args.productionType) q = q.filter((q2: any) => q2.eq(q2.field("productionType"), args.productionType));
    if (args.assignedTo) q = q.filter((q2: any) => q2.eq(q2.field("assignedTo"), args.assignedTo));
    if (args.courseId) q = q.filter((q2: any) => q2.eq(q2.field("courseId"), args.courseId));
    return q.order("desc").collect();
  },
});

export const getProductionTask = query({
  args: { id: v.id("productionTasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) return null;
    const comments = await ctx.db.query("productionTaskComments")
      .withIndex("taskId", (q: any) => q.eq("taskId", args.id))
      .collect();
    return { ...task, comments };
  },
});

export const addProductionComment = mutation({
  args: {
    taskId: v.id("productionTasks"),
    content: v.string(),
    authorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("productionTaskComments", {
      taskId: args.taskId,
      content: args.content,
      authorId: args.authorId,
      createdAt: Date.now(),
    });
  },
});

// ─── Digital Asset Library ──────────────────────────────────

export const uploadAsset = mutation({
  args: {
    name: v.string(),
    assetType: v.union(v.literal("video"), v.literal("audio"), v.literal("document"), v.literal("image"), v.literal("graphic"), v.literal("other")),
    fileUrl: v.string(),
    fileSize: v.optional(v.number()),
    mimeType: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    courseId: v.optional(v.id("courses")),
    lessonId: v.optional(v.id("lessons")),
    uploadedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("digitalAssets", {
      name: args.name,
      assetType: args.assetType,
      fileUrl: args.fileUrl,
      fileSize: args.fileSize,
      mimeType: args.mimeType,
      tags: args.tags,
      courseId: args.courseId,
      lessonId: args.lessonId,
      uploadedBy: args.uploadedBy,
      createdAt: Date.now(),
    });
  },
});

export const listAssets = query({
  args: {
    assetType: v.optional(v.string()),
    courseId: v.optional(v.id("courses")),
    tag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("digitalAssets");
    if (args.assetType) q = q.filter((q2: any) => q2.eq(q2.field("assetType"), args.assetType));
    if (args.courseId) q = q.filter((q2: any) => q2.eq(q2.field("courseId"), args.courseId));
    if (args.tag) q = q.filter((q2: any) => q2.eq(q2.field("tags"), args.tag));
    return q.order("desc").collect();
  },
});

// ─── Production Dashboard ────────────────────────────────────

export const getProductionDashboard = query({
  handler: async (ctx) => {
    const tasks = await ctx.db.query("productionTasks").collect();
    return {
      total: tasks.length,
      draft: tasks.filter((t: any) => t.status === "draft").length,
      inProgress: tasks.filter((t: any) => t.status === "in_progress").length,
      review: tasks.filter((t: any) => t.status === "review").length,
      approved: tasks.filter((t: any) => t.status === "approved").length,
      published: tasks.filter((t: any) => t.status === "published").length,
      rejected: tasks.filter((t: any) => t.status === "rejected").length,
    };
  },
});
