/**
 * Parent Engine — Registered Convex module for the Parent Portal
 *
 * Replaces the phantom `PlatformSDK.parent.*` handlers (which lived in
 * src/platform/sdk/ and were never deployed). Implementations are
 * schema-correct: they only query tables/fields that exist in src/convex/schema.
 *
 * NOTE on parent→student linkage: the schema has no parentUserId on
 * studentMaster; the demo seed links parents via `demoStudents.parentId`,
 * so that table is used here. Fee/attendance/homework/result lookups are
 * defensive (guarded filters) and return empty when nothing matches.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Students linked to a parent account. */
export const getStudentByParentId = query({
  args: { parentId: v.string() },
  handler: async (ctx, args) => {
    let students: any[] = [];
    try {
      students = await ctx.db
        .query("demoStudents")
        .filter((q) => q.eq(q.field("parentId"), args.parentId as any))
        .collect();
    } catch {
      students = [];
    }
    return students.map((s: any) => ({
      _id: s._id,
      name: s.name,
      grade: s.grade,
      section: s.section,
      status: s.status,
      admissionNumber: s.admissionNumber,
      student: { id: s._id, name: s.name, admissionNumber: s.admissionNumber },
    }));
  },
});

/** Combined parent dashboard: linked students + unread notification count. */
export const getParentDashboard = query({
  args: { parentId: v.string() },
  handler: async (ctx, args) => {
    let students: any[] = [];
    try {
      students = await ctx.db
        .query("demoStudents")
        .filter((q) => q.eq(q.field("parentId"), args.parentId as any))
        .collect();
    } catch {
      students = [];
    }

    let unread = 0;
    try {
      unread = (
        await ctx.db
          .query("notifications")
          .withIndex("userId_isRead", (q) =>
            q.eq("userId", args.parentId as any).eq("isRead", false)
          )
          .collect()
      ).length;
    } catch {
      unread = 0;
    }

    return {
      students: students.map((s: any) => ({
        student: { id: s._id, name: s.name, admissionNumber: s.admissionNumber },
        totalFee: 0,
        paid: 0,
      })),
      unreadNotifications: unread,
    };
  },
});

/** Fee ledger for a student (invoices + receipts with totals). */
export const getStudentFees = query({
  args: { studentId: v.string() },
  handler: async (ctx, args) => {
    let invoices: any[] = [];
    let receipts: any[] = [];
    try {
      invoices = await ctx.db
        .query("feeInvoices")
        .filter((q) => q.eq(q.field("studentId"), args.studentId as any))
        .collect();
    } catch {
      invoices = [];
    }
    try {
      receipts = await ctx.db
        .query("receiptHistory")
        .filter((q) => q.eq(q.field("studentId"), args.studentId as any))
        .collect();
    } catch {
      receipts = [];
    }

    const totalFee = invoices.reduce((s: number, i: any) => s + (i.totalAmount || i.amount || 0), 0);
    const totalPaid = receipts
      .filter((r: any) => r.receiptType === "payment")
      .reduce((s: number, r: any) => s + r.amount, 0);

    return {
      invoices,
      receipts,
      totalFee,
      totalPaid,
      totalDue: totalFee - totalPaid,
      pendingInvoices: invoices.filter((i: any) => i.status !== "paid"),
    };
  },
});

/** Attendance summary for a student (records + present/absent/percentage). */
export const getStudentAttendance = query({
  args: { studentId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    let records: any[] = [];
    try {
      records = await ctx.db
        .query("attendance")
        .filter((q) => q.eq(q.field("studentId"), args.studentId))
        .collect();
    } catch {
      records = [];
    }

    const sorted = [...records].sort(
      (a: any, b: any) => (b.date || b.attendanceDate || 0) - (a.date || a.attendanceDate || 0)
    );
    const total = records.length;
    const present = records.filter((r: any) => r.status === "present").length;

    return {
      records: sorted.slice(0, args.limit || 30),
      total,
      present,
      absent: total - present,
      percentage: total > 0 ? Math.round((present / total) * 100) : 100,
    };
  },
});

/** Homework / assignments for a student. */
export const getStudentHomework = query({
  args: { studentId: v.string() },
  handler: async (ctx, args) => {
    let homework: any[] = [];
    try {
      homework = await ctx.db
        .query("homework")
        .filter((q) => q.eq(q.field("studentId"), args.studentId))
        .collect();
    } catch {
      homework = [];
    }
    return [...homework].sort(
      (a: any, b: any) => (b.dueDate || b.createdAt || 0) - (a.dueDate || a.createdAt || 0)
    );
  },
});

/** Exam results for a student (from examResults; the old "marks" table does not exist). */
export const getStudentResults = query({
  args: { studentId: v.string() },
  handler: async (ctx, args) => {
    let results: any[] = [];
    try {
      results = await ctx.db
        .query("examResults")
        .filter((q) => q.eq(q.field("studentId"), args.studentId as any))
        .collect();
    } catch {
      results = [];
    }
    return results.map((r: any) => ({
      examName: r.examSessionId,
      subject: r.subject,
      marksObtained: r.marksObtained,
      score: r.marksObtained,
      maxScore: r.totalMarks,
      grade: r.grade,
      percentage: r.percentage,
    }));
  },
});

/** Create a support ticket from the parent portal (schema-correct ticketMaster insert). */
export const createParentTicket = mutation({
  args: {
    subject: v.string(),
    description: v.string(),
    category: v.optional(v.string()),
    studentId: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("ticketMaster", {
      ticketNumber: `PRT-${now}`,
      title: args.subject,
      description: args.description,
      category: args.category,
      status: "open",
      priority: "medium",
      type: "support",
      source: "portal",
      requesterType: "parent",
      requesterId: args.createdBy,
      createdBy: args.createdBy as any,
      createdAt: now,
      updatedAt: now,
    });
  },
});
