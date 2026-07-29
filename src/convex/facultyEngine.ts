/**
 * Faculty Engine — Faculty Portal & Classroom Management
 *
 * Manages faculty schedule, classes, attendance, homework, exams,
 * question bank, and student performance tracking.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── Faculty Schedule ──────────────────────────────────────

export const getFacultySchedule = query({
  args: { facultyId: v.id("users"), startDate: v.number(), endDate: v.number() },
  handler: async (ctx, args) => {
    const schedules = await ctx.db.query("schedules")
      .filter((q: any) => q.eq(q.field("owner"), args.facultyId))
      .collect();
    return schedules.filter((s: any) => s.start >= args.startDate && s.start <= args.endDate);
  },
});

// ─── Class Management ──────────────────────────────────────

export const getFacultyClasses = query({
  args: { facultyId: v.id("users") },
  handler: async (ctx, args) => {
    const batches = await ctx.db.query("academicBatches").collect();
    const sections = await ctx.db.query("academicSections").collect();
    return { batches, sections };
  },
});

// ─── Homework Management ───────────────────────────────────

export const createHomework = mutation({
  args: { title: v.string(), description: v.string(), batchId: v.id("academicBatches"), subjectId: v.id("academicSubjects"), dueDate: v.number(), attachments: v.optional(v.array(v.string())), createdBy: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("homework", {
      title: args.title, description: args.description, batchId: args.batchId,
      subjectId: args.subjectId, dueDate: args.dueDate, attachments: args.attachments,
      status: "assigned", createdBy: args.createdBy, createdAt: now, updatedAt: now,
    });
  },
});

export const listHomework = query({
  args: { batchId: v.optional(v.id("academicBatches")), facultyId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let items = await ctx.db.query("homework").collect();
    if (args.batchId) items = items.filter((h: any) => h.batchId === args.batchId);
    if (args.facultyId) items = items.filter((h: any) => h.createdBy === args.facultyId);
    return items.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ─── Question Bank ─────────────────────────────────────────

export const createQuestion = mutation({
  args: { question: v.string(), questionType: v.union(v.literal("mcq"), v.literal("true_false"), v.literal("short_answer"), v.literal("long_answer"), v.literal("numerical")), options: v.optional(v.array(v.string())), correctAnswer: v.optional(v.string()), marks: v.number(), subjectId: v.id("academicSubjects"), difficulty: v.optional(v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))), tags: v.optional(v.array(v.string())), createdBy: v.id("users") },
  handler: async (ctx, args) => {
    return ctx.db.insert("questionBank", { ...args, createdAt: Date.now(), updatedAt: Date.now() });
  },
});

export const listQuestions = query({
  args: { subjectId: v.optional(v.id("academicSubjects")), difficulty: v.optional(v.string()), questionType: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let qs = await ctx.db.query("questionBank").collect();
    if (args.subjectId) qs = qs.filter((q: any) => q.subjectId === args.subjectId);
    if (args.difficulty) qs = qs.filter((q: any) => q.difficulty === args.difficulty);
    if (args.questionType) qs = qs.filter((q: any) => q.questionType === args.questionType);
    return qs;
  },
});

// ─── Exam Creation ─────────────────────────────────────────

export const createExam = mutation({
  args: { title: v.string(), batchId: v.id("academicBatches"), subjectId: v.id("academicSubjects"), examDate: v.number(), duration: v.number(), totalMarks: v.number(), passingMarks: v.number(), questionIds: v.optional(v.array(v.id("questionBank"))), instructions: v.optional(v.string()), createdBy: v.id("users") },
  handler: async (ctx, args) => {
    return ctx.db.insert("exams", { ...args, status: "draft", createdAt: Date.now(), updatedAt: Date.now() });
  },
});

export const publishExam = mutation({
  args: { id: v.id("exams") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: "published", publishedAt: Date.now(), updatedAt: Date.now() });
    return args.id;
  },
});

export const listExams = query({
  args: { batchId: v.optional(v.id("academicBatches")), facultyId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let exams = await ctx.db.query("exams").collect();
    if (args.batchId) exams = exams.filter((e: any) => e.batchId === args.batchId);
    if (args.facultyId) exams = exams.filter((e: any) => e.createdBy === args.facultyId);
    return exams.sort((a, b) => b.examDate - a.examDate);
  },
});

// ─── Faculty Dashboard ─────────────────────────────────────

export const getFacultyDashboard = query({
  args: { facultyId: v.id("users") },
  handler: async (ctx, args) => {
    const classes = await ctx.db.query("schedules").filter((q: any) => q.eq(q.field("owner"), args.facultyId)).collect();
    const today = classes.filter((c: any) => {
      const d = new Date(c.start);
      return d.toDateString() === new Date().toDateString();
    });
    const homework = await ctx.db.query("homework").filter((q: any) => q.eq(q.field("createdBy"), args.facultyId)).collect();
    const exams = await ctx.db.query("exams").filter((q: any) => q.eq(q.field("createdBy"), args.facultyId)).collect();

    return {
      todayClasses: today.length,
      totalClasses: classes.length,
      pendingHomework: homework.filter((h: any) => h.status === "assigned").length,
      upcomingExams: exams.filter((e: any) => e.status === "draft").length,
      publishedExams: exams.filter((e: any) => e.status === "published").length,
    };
  },
});
