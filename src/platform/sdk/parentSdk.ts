/**
 * Parent SDK — Parent Portal & Communication Hub
 *
 * Every parent-facing page MUST use this SDK.
 * Provides student progress tracking, fee management, attendance,
 * homework, results, support ticketing, and communication.
 */

import { v } from "convex/values";
import { mutation, query } from "../convex/_generated/server";
import { Id } from "../convex/_generated/dataModel";

// ─── Student Lookup ──────────────────────────────────────────

export const getStudentByParentId = query({
  args: { parentId: v.id("users") },
  handler: async (ctx, args) => {
    const students = await ctx.db.query("studentMaster")
      .filter((q: any) => q.eq(q.field("parentUserId"), args.parentId))
      .collect();
    return students;
  },
});

// ─── Fees & Receipts ─────────────────────────────────────────

export const getStudentFees = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    const invoices = await ctx.db.query("feeInvoices")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .collect();
    const receipts = await ctx.db.query("receiptHistory")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .collect();

    const totalFee = invoices.reduce((s: number, i: any) => s + (i.totalAmount || i.amount || 0), 0);
    const totalPaid = receipts
      .filter((r: any) => r.receiptType === "payment")
      .reduce((s: number, r: any) => s + r.amount, 0);
    const totalDue = totalFee - totalPaid;

    return { invoices, receipts, totalFee, totalPaid, totalDue, pendingInvoices: invoices.filter((i: any) => i.status !== "paid") };
  },
});

// ─── Attendance ──────────────────────────────────────────────

export const getStudentAttendance = query({
  args: { studentId: v.id("studentMaster"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const records = await ctx.db.query("attendance")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .order("desc")
      .collect();
    const total = records.length;
    const present = records.filter((r: any) => r.status === "present").length;
    return {
      records: records.slice(0, args.limit || 30),
      total,
      present,
      absent: total - present,
      percentage: total > 0 ? Math.round((present / total) * 100) : 100,
    };
  },
});

// ─── Homework ────────────────────────────────────────────────

export const getStudentHomework = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    const homework = await ctx.db.query("homework")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .order("desc")
      .collect();
    return homework;
  },
});

// ─── Results ─────────────────────────────────────────────────

export const getStudentResults = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    const marks = await ctx.db.query("marks")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .collect();
    return marks;
  },
});

// ─── Support Tickets ─────────────────────────────────────────

export const createParentTicket = mutation({
  args: {
    subject: v.string(),
    description: v.string(),
    category: v.optional(v.string()),
    studentId: v.optional(v.id("studentMaster")),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("ticketMaster", {
      subject: args.subject,
      description: args.description,
      category: args.category,
      studentId: args.studentId,
      status: "open",
      priority: "medium",
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// ─── Parent Dashboard ────────────────────────────────────────

export const getParentDashboard = query({
  args: { parentId: v.id("users") },
  handler: async (ctx, args) => {
    const students = await ctx.db.query("studentMaster")
      .filter((q: any) => q.eq(q.field("parentUserId"), args.parentId))
      .collect();

    const dashboardData = await Promise.all(students.map(async (s: any) => {
      const fees = await ctx.db.query("feeInvoices")
        .withIndex("studentId", (q: any) => q.eq("studentId", s._id))
        .collect();
      const totalFee = fees.reduce((sum: number, f: any) => sum + (f.totalAmount || f.amount || 0), 0);
      const paid = fees.filter((f: any) => f.status === "paid").reduce((sum: number, f: any) => sum + (f.paidAmount || 0), 0);

      return {
        student: { id: s._id, name: `${(s as any).firstName} ${(s as any).lastName}`, admissionNumber: (s as any).admissionNumber },
        totalFee,
        paid,
        due: totalFee - paid,
      };
    }));

    const allNotifs = await ctx.db.query("notifications")
      .filter((q: any) => q.eq(q.field("userId"), args.parentId))
      .order("desc")
      .collect();

    return {
      students: dashboardData,
      notifications: allNotifs.slice(0, 10),
      unreadNotifications: allNotifs.filter((n: any) => !n.isRead).length,
    };
  },
});
