/**
 * Relationship Engine — Cross-Module Entity Relationships
 *
 * For any entity (student, employee, course, lead, etc.),
 * returns all related entities across modules.
 * Used by Customer 360, entity profiles, and relationship maps.
 */

import { v } from "convex/values";
import { query } from "./_generated/server";

export const getEntityRelationships = query({
  args: {
    entityType: v.union(
      v.literal("student"), v.literal("employee"), v.literal("course"),
      v.literal("lead"), v.literal("vendor"), v.literal("parent"), v.literal("user")
    ),
    entityId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const relationships: Array<{ type: string; id: string; title: string; subtitle: string; url: string; count?: number }> = [];

    switch (args.entityType) {
      case "student": {
        // Get fee invoices
        const invoices = await ctx.db.query("feeInvoices")
          .withIndex("studentId", (q: any) => q.eq("studentId", args.entityId))
          .collect();
        if (invoices.length > 0) relationships.push({ type: "invoices", id: "invoices", title: "Fee Invoices", subtitle: `${invoices.length} records`, url: `/finance?studentId=${args.entityId}`, count: invoices.length });

        // Get receipts
        const receipts = await ctx.db.query("receiptHistory")
          .withIndex("studentId", (q: any) => q.eq("studentId", args.entityId))
          .collect();
        if (receipts.length > 0) relationships.push({ type: "receipts", id: "receipts", title: "Receipts", subtitle: `${receipts.length} records`, url: `/finance?studentId=${args.entityId}`, count: receipts.length });

        // Get attendance
        const attendance = await ctx.db.query("attendanceRecords")
          .withIndex("entityType_entityId", (q: any) => q.eq("entityType", "student").eq("entityId", args.entityId))
          .collect();
        if (attendance.length > 0) relationships.push({ type: "attendance", id: "attendance", title: "Attendance", subtitle: `${attendance.length} records`, url: `/students/${args.entityId}` });

        // Get exams/marks
        const marks = await ctx.db.query("marks")
          .withIndex("studentId", (q: any) => q.eq("studentId", args.entityId))
          .collect();
        if (marks.length > 0) relationships.push({ type: "exams", id: "exams", title: "Exams & Results", subtitle: `${marks.length} entries`, url: `/students/${args.entityId}` });

        // Get certificates
        const certs = await ctx.db.query("certificates")
          .filter((q: any) => q.eq(q.field("studentId"), args.entityId))
          .collect();
        if (certs.length > 0) relationships.push({ type: "certificates", id: "certs", title: "Certificates", subtitle: `${certs.length} issued`, url: `/students/${args.entityId}`, count: certs.length });

        // Get refunds
        const refunds = await ctx.db.query("refundRequests")
          .filter((q: any) => q.eq(q.field("studentId"), args.entityId))
          .collect();
        if (refunds.length > 0) relationships.push({ type: "refunds", id: "refunds", title: "Refund Requests", subtitle: `${refunds.length} records`, url: `/finance`, count: refunds.length });

        // Get support tickets
        const tickets = await ctx.db.query("ticketMaster")
          .filter((q: any) => q.eq(q.field("studentId"), args.entityId))
          .collect();
        if (tickets.length > 0) relationships.push({ type: "tickets", id: "tickets", title: "Support Tickets", subtitle: `${tickets.length} tickets`, url: `/tickets?studentId=${args.entityId}`, count: tickets.length });

        break;
      }

      case "employee": {
        // Get leave applications
        const leaves = await ctx.db.query("leaveApplications")
          .filter((q: any) => q.eq(q.field("employeeId"), args.entityId))
          .collect();
        if (leaves.length > 0) relationships.push({ type: "leave", id: "leave", title: "Leave Applications", subtitle: `${leaves.length} records`, url: `/employees/${args.entityId}`, count: leaves.length });

        // Get payroll
        const payslips = await ctx.db.query("payslips")
          .filter((q: any) => q.eq(q.field("employeeId"), args.entityId))
          .collect();
        if (payslips.length > 0) relationships.push({ type: "payroll", id: "payroll", title: "Payslips", subtitle: `${payslips.length} generated`, url: `/employees/${args.entityId}`, count: payslips.length });

        // Get performance reviews
        const reviews = await ctx.db.query("performanceReviews")
          .filter((q: any) => q.eq(q.field("employeeId"), args.entityId))
          .collect();
        if (reviews.length > 0) relationships.push({ type: "performance", id: "perf", title: "Performance Reviews", subtitle: `${reviews.length} reviews`, url: `/employees/${args.entityId}`, count: reviews.length });

        // Get exit records
        const exits = await ctx.db.query("exitRecords")
          .filter((q: any) => q.eq(q.field("employeeId"), args.entityId))
          .collect();
        if (exits.length > 0) relationships.push({ type: "exit", id: "exit", title: "Exit Records", subtitle: `Status: ${exits[0].status}`, url: `/employees/${args.entityId}` });

        break;
      }

      case "course": {
        // Get course enrollments
        const enrollments = await ctx.db.query("studentMaster")
          .filter((q: any) => q.eq(q.field("courseId"), args.entityId))
          .collect();
        if (enrollments.length > 0) relationships.push({ type: "students", id: "students", title: "Enrolled Students", subtitle: `${enrollments.length} students`, url: `/students?courseId=${args.entityId}`, count: enrollments.length });

        // Get course lessons
        const lessons = await ctx.db.query("lessons")
          .filter((q: any) => q.eq(q.field("courseId"), args.entityId))
          .collect();
        if (lessons.length > 0) relationships.push({ type: "lessons", id: "lessons", title: "Lessons", subtitle: `${lessons.length} lessons`, url: `/lms/courses/${args.entityId}`, count: lessons.length });

        break;
      }

      case "lead": {
        // Get payments
        const payments = await ctx.db.query("leadPayments")
          .withIndex("leadId", (q: any) => q.eq("leadId", args.entityId))
          .collect();
        if (payments.length > 0) relationships.push({ type: "payments", id: "payments", title: "Payments", subtitle: `${payments.length} records`, url: `/crm/leads/${args.entityId}`, count: payments.length });

        // Get PDCs
        const pdcs = await ctx.db.query("payment_pdcs")
          .withIndex("leadId", (q: any) => q.eq("leadId", args.entityId))
          .collect();
        if (pdcs.length > 0) relationships.push({ type: "pdcs", id: "pdcs", title: "PDC Cheques", subtitle: `${pdcs.length} cheques`, url: `/crm/leads/${args.entityId}`, count: pdcs.length });

        // Get activity
        const activity = await ctx.db.query("leadActivity")
          .filter((q: any) => q.eq(q.field("leadId"), args.entityId))
          .collect();
        relationships.push({ type: "activity", id: "activity", title: "Activity Log", subtitle: `${activity.length} entries`, url: `/crm/leads/${args.entityId}`, count: activity.length });

        break;
      }
    }

    return relationships;
  },
});

export const getRelationshipSummary = query({
  args: { entityType: v.string(), entityId: v.id("users") },
  handler: async (ctx, args) => {
    const rels = await getEntityRelationships.handler(ctx, args as any);
    return {
      totalRelationships: rels.length,
      relationships: rels,
      summary: rels.map((r) => `${r.type}: ${r.count || "?"}`).join(", "),
    };
  },
});
