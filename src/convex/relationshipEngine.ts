/**
 * Enterprise 360° Relationship Engine (Phase 2 — Unified Views)
 *
 * Provides comprehensive cross-module entity views:
 *   Student360, Employee360, Parent360, Faculty360, Vendor360
 *
 * Every entity exposes ALL its related data across every module.
 * Used by Customer360 page, entity workspaces, and relationship maps.
 *
 * Integration:
 *   Pages call get360View({ entityType, entityId }) to get
 *   the complete unified profile for any entity.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ─── 360° View Types ───────────────────────────────────────

interface ModuleSection {
  module: string;
  label: string;
  count: number;
  data: any[];
  summary?: Record<string, any>;
}

interface Entity360 {
  entity: any;
  sections: ModuleSection[];
}

// ─── Student360 ─────────────────────────────────────────────

async function buildStudent360(ctx: any, studentId: Id<"studentMaster">): Promise<Entity360> {
  const student = await ctx.db.get(studentId);
  if (!student) return { entity: null, sections: [] };

  const person = student.personId ? await ctx.db.get(student.personId) : null;
  const sections: ModuleSection[] = [];

  // Admission & Academic Profile
  const academicProfile = await ctx.db.query("studentAcademicProfile")
    .withIndex("studentId", (q: any) => q.eq("studentId", studentId))
    .filter((q: any) => q.eq(q.field("isCurrent"), true))
    .first();
  sections.push({
    module: "academic",
    label: "Academic Profile",
    count: academicProfile ? 1 : 0,
    data: academicProfile ? [academicProfile] : [],
  });

  // Attendance
  const attendance = await ctx.db.query("attendanceRecords")
    .withIndex("entityType_entityId", (q: any) => q.eq("entityType", "student").eq("entityId", studentId))
    .collect();
  sections.push({
    module: "attendance",
    label: "Attendance",
    count: attendance.length,
    data: attendance.slice(0, 50),
    summary: {
      present: attendance.filter((a: any) => a.status === "present").length,
      absent: attendance.filter((a: any) => a.status === "absent").length,
      total: attendance.length,
    },
  });

  // Fee Account
  const feeAccount = await ctx.db.query("studentFeeAccounts")
    .withIndex("studentId", (q: any) => q.eq("studentId", studentId))
    .first();
  const installments = feeAccount ? await ctx.db.query("feeInstallments")
    .withIndex("studentId", (q: any) => q.eq("studentId", studentId))
    .collect() : [];
  sections.push({
    module: "finance",
    label: "Fee Account",
    count: installments.length,
    data: installments,
    summary: {
      totalFee: feeAccount?.totalFee || 0,
      totalPaid: feeAccount?.totalPaid || 0,
      outstanding: feeAccount?.outstandingBalance || 0,
      overdueCount: installments.filter((i: any) => i.status === "overdue").length,
    },
  });

  // Receipts
  const receipts = await ctx.db.query("receiptHistory")
    .withIndex("studentId", (q: any) => q.eq("studentId", studentId))
    .collect();
  sections.push({
    module: "receipts",
    label: "Receipts",
    count: receipts.length,
    data: receipts.slice(0, 50),
    summary: { totalAmount: receipts.reduce((s: number, r: any) => s + (r.amount || 0), 0) },
  });

  // Refunds
  const refunds = await ctx.db.query("refundRequests")
    .filter((q: any) => q.eq(q.field("studentId"), studentId))
    .collect();
  sections.push({
    module: "refund",
    label: "Refunds",
    count: refunds.length,
    data: refunds,
    summary: { totalRefunded: refunds.filter((r: any) => r.status === "completed").reduce((s: number, r: any) => s + (r.amount || 0), 0) },
  });

  // PDC Cheques
  const leadId = student.leadId;
  const pdcs = leadId ? await ctx.db.query("payment_pdcs")
    .withIndex("leadId", (q: any) => q.eq("leadId", leadId))
    .collect() : [];
  sections.push({
    module: "pdc",
    label: "PDC Cheques",
    count: pdcs.length,
    data: pdcs,
    summary: {
      bounced: pdcs.filter((p: any) => p.status === "bounced").length,
      cleared: pdcs.filter((p: any) => p.status === "cleared").length,
      active: pdcs.filter((p: any) => p.status === "scheduled" || p.status === "deposited").length,
    },
  });

  // Exams & Results
  const marks = await ctx.db.query("marks")
    .withIndex("studentId", (q: any) => q.eq("studentId", studentId))
    .collect();
  sections.push({
    module: "exam",
    label: "Exams & Results",
    count: marks.length,
    data: marks.slice(0, 50),
  });

  // Certificates
  const certs = await ctx.db.query("certificates")
    .filter((q: any) => q.eq(q.field("studentId"), studentId))
    .collect();
  sections.push({
    module: "certificate",
    label: "Certificates",
    count: certs.length,
    data: certs,
  });

  // Support Tickets
  const tickets = await ctx.db.query("ticketMaster")
    .filter((q: any) => q.eq(q.field("studentId"), studentId))
    .collect();
  sections.push({
    module: "support",
    label: "Support Tickets",
    count: tickets.length,
    data: tickets.slice(0, 20),
  });

  // Timeline
  const timeline = await ctx.db.query("studentTimeline")
    .withIndex("studentId_createdAt", (q: any) => q.eq("studentId", studentId))
    .order("desc")
    .take(50);
  sections.push({
    module: "timeline",
    label: "Activity Timeline",
    count: timeline.length,
    data: timeline,
  });

  // Documents (consent forms, etc.)
  const consents = await ctx.db.query("consentRecords")
    .filter((q: any) => q.eq(q.field("studentId"), studentId))
    .collect();
  sections.push({
    module: "documents",
    label: "Documents & Consent",
    count: consents.length,
    data: consents,
  });

  return {
    entity: { ...student, person },
    sections,
  };
}

// ─── Employee360 ────────────────────────────────────────────

async function buildEmployee360(ctx: any, employeeId: Id<"employeeMaster">): Promise<Entity360> {
  const employee = await ctx.db.get(employeeId);
  if (!employee) return { entity: null, sections: [] };

  const person = employee.personId ? await ctx.db.get(employee.personId) : null;
  const sections: ModuleSection[] = [];

  // Department, Designation, Branch, Company
  const department = employee.departmentId ? await ctx.db.get(employee.departmentId) : null;
  const designation = employee.designationId ? await ctx.db.get(employee.designationId) : null;
  const branch = employee.branchId ? await ctx.db.get(employee.branchId) : null;
  const company = employee.companyId ? await ctx.db.get(employee.companyId) : null;
  sections.push({
    module: "organization",
    label: "Organization",
    count: 1,
    data: [{ department, designation, branch, company }],
  });

  // Attendance
  const attendance = await ctx.db.query("attendanceRecords")
    .withIndex("entityType_entityId", (q: any) => q.eq("entityType", "employee").eq("entityId", employeeId))
    .collect();
  sections.push({
    module: "attendance",
    label: "Attendance",
    count: attendance.length,
    data: attendance.slice(0, 50),
  });

  // Leave Applications
  const leaves = await ctx.db.query("leaveApplications")
    .filter((q: any) => q.eq(q.field("employeeId"), employeeId))
    .collect();
  sections.push({
    module: "leave",
    label: "Leave Applications",
    count: leaves.length,
    data: leaves,
    summary: { approved: leaves.filter((l: any) => l.status === "approved").length, pending: leaves.filter((l: any) => l.status === "pending").length },
  });

  // Payslips
  const payslips = await ctx.db.query("payslips")
    .filter((q: any) => q.eq(q.field("employeeId"), employeeId))
    .collect();
  sections.push({
    module: "payroll",
    label: "Payslips",
    count: payslips.length,
    data: payslips.slice(0, 12),
  });

  // Performance Reviews
  const reviews = await ctx.db.query("performanceReviews")
    .filter((q: any) => q.eq(q.field("employeeId"), employeeId))
    .collect();
  sections.push({
    module: "performance",
    label: "Performance Reviews",
    count: reviews.length,
    data: reviews,
  });

  // Assets allocated
  const assets = await ctx.db.query("assetAllocations")
    .filter((q: any) => q.eq(q.field("allocatedTo"), employeeId))
    .collect();
  sections.push({
    module: "assets",
    label: "Assets",
    count: assets.length,
    data: assets,
  });

  // Exit records
  const exits = await ctx.db.query("exitRecords")
    .filter((q: any) => q.eq(q.field("employeeId"), employeeId))
    .collect();
  sections.push({
    module: "exit",
    label: "Exit Management",
    count: exits.length,
    data: exits,
  });

  return {
    entity: { ...employee, person },
    sections,
  };
}

// ─── Parent360 ──────────────────────────────────────────────

async function buildParent360(ctx: any, userId: Id<"users">): Promise<Entity360> {
  const user = await ctx.db.get(userId);
  if (!user) return { entity: null, sections: [] };

  const sections: ModuleSection[] = [];

  // Find all students linked to this parent
  const students = await ctx.db.query("studentMaster")
    .filter((q: any) => {
      // Look up via parent links on the user
      if ((user as any).studentIds) return q.eq(q.field("_id"), (user as any).studentIds[0]);
      return q.eq(q.field("createdBy"), userId);
    })
    .collect();

  sections.push({
    module: "student",
    label: "Children",
    count: students.length,
    data: students,
  });

  // Fee summary for all children
  const allFeeAccounts: any[] = [];
  for (const student of students) {
    const fa = await ctx.db.query("studentFeeAccounts")
      .withIndex("studentId", (q: any) => q.eq("studentId", student._id))
      .first();
    if (fa) allFeeAccounts.push(fa);
  }
  sections.push({
    module: "finance",
    label: "Fee Summary (All Children)",
    count: allFeeAccounts.length,
    data: allFeeAccounts,
    summary: { totalOutstanding: allFeeAccounts.reduce((s: number, f: any) => s + (f.outstandingBalance || 0), 0) },
  });

  // Support tickets
  const tickets = await ctx.db.query("ticketMaster")
    .filter((q: any) => q.eq(q.field("createdBy"), userId))
    .collect();
  sections.push({
    module: "support",
    label: "Support Tickets",
    count: tickets.length,
    data: tickets.slice(0, 20),
  });

  return { entity: user, sections };
}

// ─── Faculty360 ─────────────────────────────────────────────

async function buildFaculty360(ctx: any, userId: Id<"users">): Promise<Entity360> {
  const user = await ctx.db.get(userId);
  if (!user) return { entity: null, sections: [] };
  const sections: ModuleSection[] = [];

  // Classes assigned
  const classes = await ctx.db.query("classSchedules")
    .filter((q: any) => q.eq(q.field("facultyId"), userId))
    .collect();
  sections.push({
    module: "scheduling",
    label: "Assigned Classes",
    count: classes.length,
    data: classes.slice(0, 50),
    summary: { upcoming: classes.filter((c: any) => c.startTime > Date.now()).length },
  });

  // Homework assigned
  const homework = await ctx.db.query("homeworkAssignments")
    .filter((q: any) => q.eq(q.field("assignedBy"), userId))
    .collect();
  sections.push({
    module: "academic",
    label: "Homework Assigned",
    count: homework.length,
    data: homework.slice(0, 50),
  });

  return { entity: user, sections };
}

// ─── Vendor360 ──────────────────────────────────────────────

async function buildVendor360(ctx: any, vendorId: string): Promise<Entity360> {
  const vendor = await ctx.db.get(vendorId as any);
  if (!vendor) return { entity: null, sections: [] };
  const sections: ModuleSection[] = [];

  // Purchase Orders
  const pos = await ctx.db.query("purchaseOrders")
    .filter((q: any) => q.eq(q.field("vendorId"), vendorId))
    .collect();
  sections.push({
    module: "procurement",
    label: "Purchase Orders",
    count: pos.length,
    data: pos,
  });

  // Invoices
  const invoices = await ctx.db.query("vendorInvoices")
    .filter((q: any) => q.eq(q.field("vendorId"), vendorId))
    .collect();
  sections.push({
    module: "finance",
    label: "Invoices",
    count: invoices.length,
    data: invoices,
    summary: { totalAmount: invoices.reduce((s: number, i: any) => s + (i.amount || 0), 0) },
  });

  return { entity: vendor, sections };
}

// ─── Unified 360° Query ────────────────────────────────────

export const get360View = query({
  args: {
    entityType: v.union(
      v.literal("student"), v.literal("employee"),
      v.literal("parent"), v.literal("faculty"), v.literal("vendor"),
    ),
    entityId: v.string(),
  },
  handler: async (ctx, args): Promise<Entity360> => {
    switch (args.entityType) {
      case "student":
        return buildStudent360(ctx, args.entityId as Id<"studentMaster">);
      case "employee":
        return buildEmployee360(ctx, args.entityId as Id<"employeeMaster">);
      case "parent":
        return buildParent360(ctx, args.entityId as Id<"users">);
      case "faculty":
        return buildFaculty360(ctx, args.entityId as Id<"users">);
      case "vendor":
        return buildVendor360(ctx, args.entityId);
      default:
        return { entity: null, sections: [] };
    }
  },
});

/** Convenience query that returns just the section summary counts */
export const get360Summary = query({
  args: {
    entityType: v.union(v.literal("student"), v.literal("employee"), v.literal("parent"), v.literal("faculty"), v.literal("vendor")),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const view = await get360View.handler(ctx, args);
    return {
      entityType: args.entityType,
      entityId: args.entityId,
      totalSections: view.sections.length,
      sections: view.sections.map((s) => ({ module: s.module, label: s.label, count: s.count, summary: s.summary })),
    };
  },
});

// ─── Person↔Person Relationship Links ────────────────────────

/**
 * Link two persons with a relationship type (e.g. family, guardian, colleague).
 */
export const linkPersons = mutation({
  args: {
    personA: v.id("personMaster"),
    personB: v.id("personMaster"),
    relationshipType: v.string(),
    notes: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const a = await ctx.db.get(args.personA);
    const b = await ctx.db.get(args.personB);
    if (!a || a.status === "archived" || !b || b.status === "archived") {
      throw new Error("One or both persons not found or archived");
    }
    // Prevent duplicates
    const existing = await ctx.db
      .query("relationships")
      .filter((q) =>
        (q.eq(q.field("personA"), args.personA) && q.eq(q.field("personB"), args.personB)) ||
        (q.eq(q.field("personA"), args.personB) && q.eq(q.field("personB"), args.personA))
      )
      .first();
    if (existing) {
      if (!existing.isActive) {
        await ctx.db.patch(existing._id, { isActive: true, updatedAt: now });
      }
      return existing._id;
    }
    return ctx.db.insert("relationships", {
      personA: args.personA,
      personB: args.personB,
      relationshipType: args.relationshipType,
      notes: args.notes,
      isActive: true,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Unlink a person relationship (soft-remove by setting isActive = false).
 */
export const unlinkPersons = mutation({
  args: { relationshipId: v.id("relationships") },
  handler: async (ctx, args) => {
    const rel = await ctx.db.get(args.relationshipId);
    if (!rel) throw new Error("Relationship not found");
    await ctx.db.patch(args.relationshipId, { isActive: false, updatedAt: Date.now() });
    return args.relationshipId;
  },
});

/**
 * Get all relationships for a person (both directions), joined with display names.
 */
export const getPersonRelationships = query({
  args: { personId: v.id("personMaster") },
  handler: async (ctx, args) => {
    const rels = await ctx.db
      .query("relationships")
      .filter((q) =>
        q.eq(q.field("personA"), args.personId) || q.eq(q.field("personB"), args.personId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const results: any[] = [];
    for (const rel of rels) {
      const otherId = rel.personA === args.personId ? rel.personB : rel.personA;
      const other = await ctx.db.get(otherId);
      results.push({
        ...rel,
        otherPersonId: otherId,
        otherPersonName: other
          ? other.displayName || `${other.firstName} ${other.lastName || ""}`.trim()
          : "Unknown",
      });
    }
    return results;
  },
});
