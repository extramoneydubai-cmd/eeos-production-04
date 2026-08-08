import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ─── Valid Status Transitions ────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  enquiry: ["lead", "qualified", "cancelled"],
  lead: ["qualified", "trial", "admitted", "cancelled"],
  qualified: ["trial", "admitted", "cancelled"],
  trial: ["admitted", "active", "qualified", "cancelled"],
  admitted: ["active", "cancelled"],
  active: ["completed", "suspended", "cancelled"],
  suspended: ["active", "cancelled"],
  completed: ["alumni"],
  alumni: [],
};

// ─── Helper ──────────────────────────────────────────────

async function createTimelineEvent(
  ctx: any,
  studentId: Id<"studentMaster">,
  eventType: string,
  title: string,
  description?: string,
  performedBy?: Id<"users">,
  metadata?: string,
) {
  await ctx.db.insert("studentTimeline", {
    studentId,
    eventType,
    title,
    description,
    metadata,
    performedBy,
    createdAt: Date.now(),
  });
}

async function transitionStatus(
  ctx: any,
  studentId: Id<"studentMaster">,
  toStatus: string,
  performedBy: Id<"users">,
  remarks?: string,
): Promise<void> {
  const student = await ctx.db.get(studentId);
  if (!student) throw new Error("Student not found");

  const currentStatus = student.currentStatus;
  const allowed = VALID_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(toStatus)) {
    throw new Error(
      `Invalid transition: ${currentStatus} → ${toStatus}. Allowed: ${allowed.join(", ") || "none"}`
    );
  }

  const now = Date.now();

  await ctx.db.patch(studentId, { currentStatus: toStatus as any, updatedAt: now });

  await ctx.db.insert("studentStatusHistory", {
    studentId,
    fromStatus: currentStatus,
    toStatus,
    remarks: remarks || `Status changed from ${currentStatus} to ${toStatus}`,
    changedBy: performedBy,
    changedAt: now,
    createdAt: now,
  });
}

// ─── Lifecycle Mutations ─────────────────────────────────

export const admitStudent = mutation({
  args: {
    token: v.optional(v.string()),
    studentId: v.id("studentMaster"),
    performedBy: v.id("users"),
    admissionType: v.optional(v.string()),
    courseId: v.optional(v.id("courses")),
    batchId: v.optional(v.id("academicBatches")),
    totalFee: v.optional(v.number()),
    discountAmount: v.optional(v.number()),
    finalFee: v.optional(v.number()),
    installmentCount: v.optional(v.number()),
    remarks: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      operation: "update",
      module: "admission",
      entity: "student",
      eventType: "admission.student.admitted",
      title: "Student Admitted",
      getUserId: (args: any) => args.performedBy,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: () => undefined,
      notifyViaMatrix: true,
    },
    async (ctx: any, args: any) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");

    const now = Date.now();
    const allowedFrom = ["lead", "qualified", "trial"];
    if (!allowedFrom.includes(student.currentStatus)) {
      throw new Error(`Cannot admit student from status: ${student.currentStatus}`);
    }

    // Update status
    await ctx.db.patch(args.studentId, { currentStatus: "admitted" as any, updatedAt: now });

    // Create admission record
    const admissionNumber = student.admissionNumber;
    await ctx.db.insert("studentAdmissions", {
      studentId: args.studentId,
      leadId: student.leadId,
      admissionNumber,
      admissionType: args.admissionType || "regular",
      courseId: args.courseId,
      batchId: args.batchId,
      totalFee: args.totalFee,
      discountAmount: args.discountAmount,
      finalFee: args.finalFee,
      installmentCount: args.installmentCount,
      admittedBy: args.performedBy,
      status: "admitted",
      decisionDate: now,
      remarks: args.remarks,
      createdAt: now,
      updatedAt: now,
    });

    // Status history
    await ctx.db.insert("studentStatusHistory", {
      studentId: args.studentId,
      fromStatus: student.currentStatus,
      toStatus: "admitted",
      remarks: args.remarks || "Student admitted",
      changedBy: args.performedBy,
      changedAt: now,
      createdAt: now,
    });

    // Timeline event
    await createTimelineEvent(
      ctx, args.studentId, "student_admitted", "Student Admitted",
      `Admission completed: ${admissionNumber}`, args.performedBy,
    );

    return { studentId: args.studentId, admissionNumber };
    }
  ),
});

export const enrollStudent = mutation({
  args: {
    token: v.optional(v.string()),
    studentId: v.id("studentMaster"),
    performedBy: v.id("users"),
    academicProfile: v.optional(
      v.object({
        verticalId: v.optional(v.id("verticals")),
        subVerticalId: v.optional(v.id("subVerticals")),
        boardId: v.optional(v.id("boards")),
        courseId: v.optional(v.id("courses")),
        batchId: v.optional(v.id("academicBatches")),
        sectionId: v.optional(v.id("academicSections")),
        semesterId: v.optional(v.id("academicSemesters")),
        termId: v.optional(v.id("academicTerms")),
      })
    ),
    remarks: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      operation: "update",
      module: "admission",
      entity: "student",
      eventType: "admission.student.enrolled",
      title: "Student Enrolled",
      getUserId: (args: any) => args.performedBy,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: () => undefined,
      notifyViaMatrix: true,
    },
    async (ctx: any, args: any) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");

    const now = Date.now();

    // Active can only come from admitted
    await transitionStatus(ctx, args.studentId, "active", args.performedBy, args.remarks || "Student enrolled");

    // Create academic profile if provided
    if (args.academicProfile) {
      // Deactivate existing profiles
      const existingProfiles = await ctx.db
        .query("studentAcademicProfile")
        .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
        .collect();
      for (const p of existingProfiles) {
        await ctx.db.patch(p._id, { isCurrent: false, endDate: now, updatedAt: now });
      }

      await ctx.db.insert("studentAcademicProfile", {
        studentId: args.studentId,
        verticalId: args.academicProfile.verticalId,
        subVerticalId: args.academicProfile.subVerticalId,
        boardId: args.academicProfile.boardId,
        courseId: args.academicProfile.courseId,
        batchId: args.academicProfile.batchId,
        sectionId: args.academicProfile.sectionId,
        semesterId: args.academicProfile.semesterId,
        termId: args.academicProfile.termId,
        currentYear: 1,
        currentTerm: "1",
        isCurrent: true,
        startDate: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    await createTimelineEvent(ctx, args.studentId, "student_enrolled", "Student Enrolled", "Student started active enrollment", args.performedBy);
    return args.studentId;
    }
  ),
});

export const promoteStudent = mutation({
  args: {
    token: v.optional(v.string()),
    studentId: v.id("studentMaster"),
    performedBy: v.id("users"),
    nextYear: v.number(),
    nextAcademicProfile: v.optional(
      v.object({
        verticalId: v.optional(v.id("verticals")),
        subVerticalId: v.optional(v.id("subVerticals")),
        boardId: v.optional(v.id("boards")),
        courseId: v.optional(v.id("courses")),
        batchId: v.optional(v.id("academicBatches")),
        sectionId: v.optional(v.id("academicSections")),
        semesterId: v.optional(v.id("academicSemesters")),
        termId: v.optional(v.id("academicTerms")),
      })
    ),
    remarks: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      operation: "update",
      module: "admission",
      entity: "student",
      eventType: "admission.student.promoted",
      title: "Student Promoted",
      getUserId: (args: any) => args.performedBy,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: () => undefined,
      notifyViaMatrix: true,
    },
    async (ctx: any, args: any) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");

    if (student.currentStatus !== "active") {
      throw new Error("Only active students can be promoted");
    }

    const now = Date.now();

    // Deactivate current academic profile
    const currentProfile = await ctx.db
      .query("studentAcademicProfile")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .filter((q: any) => q.eq(q.field("isCurrent"), true))
      .first();

    if (currentProfile) {
      await ctx.db.patch(currentProfile._id, { isCurrent: false, endDate: now, updatedAt: now });
    }

    // Create new academic profile
    const profileData = args.nextAcademicProfile || {};
    await ctx.db.insert("studentAcademicProfile", {
      studentId: args.studentId,
      verticalId: profileData.verticalId,
      subVerticalId: profileData.subVerticalId,
      boardId: profileData.boardId,
      courseId: profileData.courseId,
      batchId: profileData.batchId,
      sectionId: profileData.sectionId,
      semesterId: profileData.semesterId,
      termId: profileData.termId,
      currentYear: args.nextYear,
      currentTerm: "1",
      isCurrent: true,
      startDate: now,
      createdAt: now,
      updatedAt: now,
    });

    // Status history
    await ctx.db.insert("studentStatusHistory", {
      studentId: args.studentId,
      fromStatus: student.currentStatus,
      toStatus: student.currentStatus,
      remarks: args.remarks || `Promoted to year ${args.nextYear}`,
      changedBy: args.performedBy,
      changedAt: now,
      createdAt: now,
    });

    await createTimelineEvent(ctx, args.studentId, "student_promoted", "Student Promoted", `Promoted to academic year ${args.nextYear}`, args.performedBy);
    return args.studentId;
    }
  ),
});

export const transferStudent = mutation({
  args: {
    token: v.optional(v.string()),
    studentId: v.id("studentMaster"),
    performedBy: v.id("users"),
    toBranchId: v.optional(v.id("branches")),
    toCompanyId: v.optional(v.id("companies")),
    remarks: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      operation: "update",
      module: "admission",
      entity: "student",
      eventType: "admission.student.transferred",
      title: "Student Transferred",
      getUserId: (args: any) => args.performedBy,
      getEntityCompanyId: (args: any) => (args as any).toCompanyId || undefined,
      getEntityBranchId: (args: any) => (args as any).toBranchId || undefined,
      notifyViaMatrix: true,
    },
    async (ctx: any, args: any) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");

    const now = Date.now();
    const updates: Record<string, any> = { updatedAt: now };
    if (args.toBranchId) updates.branchId = args.toBranchId;
    if (args.toCompanyId) updates.companyId = args.toCompanyId;

    await ctx.db.patch(args.studentId, updates);

    await ctx.db.insert("studentStatusHistory", {
      studentId: args.studentId,
      fromStatus: student.currentStatus,
      toStatus: student.currentStatus,
      remarks: args.remarks || "Student transferred",
      changedBy: args.performedBy,
      changedAt: now,
      createdAt: now,
    });

    await createTimelineEvent(ctx, args.studentId, "student_transferred", "Student Transferred", args.remarks || "Branch/Company transfer", args.performedBy);
    return args.studentId;
    }
  ),
});

export const suspendStudent = mutation({
  args: {
    token: v.optional(v.string()),
    studentId: v.id("studentMaster"),
    performedBy: v.id("users"),
    reason: v.string(),
  },
  handler: withScopeAndEvents(
    {
      operation: "update",
      module: "admission",
      entity: "student",
      eventType: "admission.student.suspended",
      title: "Student Suspended",
      getUserId: (args: any) => args.performedBy,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: () => undefined,
      notifyViaMatrix: true,
    },
    async (ctx: any, args: any) => {
    await transitionStatus(ctx, args.studentId, "suspended", args.performedBy, args.reason);
    await createTimelineEvent(ctx, args.studentId, "student_suspended", "Student Suspended", args.reason, args.performedBy);
    return args.studentId;
    }
  ),
});

export const reinstateStudent = mutation({
  args: {
    token: v.optional(v.string()),
    studentId: v.id("studentMaster"),
    performedBy: v.id("users"),
    remarks: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      operation: "update",
      module: "admission",
      entity: "student",
      eventType: "admission.student.reinstated",
      title: "Student Reinstated",
      getUserId: (args: any) => args.performedBy,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: () => undefined,
      notifyViaMatrix: true,
    },
    async (ctx: any, args: any) => {
    await transitionStatus(ctx, args.studentId, "active", args.performedBy, args.remarks || "Student reinstated");
    await createTimelineEvent(ctx, args.studentId, "student_reinstated", "Student Reinstated", args.remarks || "Suspension lifted", args.performedBy);
    return args.studentId;
    }
  ),
});

export const graduateStudent = mutation({
  args: {
    token: v.optional(v.string()),
    studentId: v.id("studentMaster"),
    performedBy: v.id("users"),
    remarks: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      operation: "update",
      module: "admission",
      entity: "student",
      eventType: "admission.student.graduated",
      title: "Student Graduated",
      getUserId: (args: any) => args.performedBy,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: () => undefined,
      notifyViaMatrix: true,
    },
    async (ctx: any, args: any) => {
    await transitionStatus(ctx, args.studentId, "completed", args.performedBy, args.remarks || "Student graduated");

    const now = Date.now();
    const currentProfile = await ctx.db
      .query("studentAcademicProfile")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .filter((q: any) => q.eq(q.field("isCurrent"), true))
      .first();
    if (currentProfile) {
      await ctx.db.patch(currentProfile._id, { isCurrent: false, endDate: now, updatedAt: now });
    }

    await createTimelineEvent(ctx, args.studentId, "student_graduated", "Student Graduated", args.remarks || "Course completed", args.performedBy);
    return args.studentId;
    }
  ),
});

export const convertToAlumni = mutation({
  args: {
    token: v.optional(v.string()),
    studentId: v.id("studentMaster"),
    performedBy: v.id("users"),
    remarks: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      operation: "update",
      module: "admission",
      entity: "student",
      eventType: "admission.student.alumni",
      title: "Student Converted to Alumni",
      getUserId: (args: any) => args.performedBy,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: () => undefined,
      notifyViaMatrix: true,
    },
    async (ctx: any, args: any) => {
    await transitionStatus(ctx, args.studentId, "alumni", args.performedBy, args.remarks || "Converted to alumni");

    // Update People Registry profile
    const student = await ctx.db.get(args.studentId);
    if (student) {
      const existingProfile = await ctx.db
        .query("personProfiles")
        .withIndex("personId_profileType", (q: any) =>
          q.eq("personId", student.personId).eq("profileType", "alumni")
        )
        .first();

      if (!existingProfile) {
        await ctx.db.insert("personProfiles", {
          personId: student.personId,
          profileType: "alumni",
          active: true,
          primaryProfile: false,
          displayLabel: "Alumni",
          startDate: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    await createTimelineEvent(ctx, args.studentId, "student_alumni", "Converted to Alumni", args.remarks || "Alumni status granted", args.performedBy);
    return args.studentId;
    }
  ),
});

// ─── Queries ────────────────────────────────────────────

export const getStudentStatusHistory = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("studentStatusHistory")
      .withIndex("studentId_changedAt", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .collect();
  },
});

export const getStudentTimeline = query({
  args: {
    studentId: v.id("studentMaster"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("studentTimeline")
      .withIndex("studentId_createdAt", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .take(limit);
  },
});

export const getStudentAcademicHistory = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("studentAcademicProfile")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .order("desc")
      .collect();
  },
});

export const getEnrollmentStats = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    let students = await ctx.db.query("studentMaster").collect();

    if (args.branchId) {
      students = students.filter((s) => s.branchId === args.branchId);
    }
    if (args.companyId) {
      students = students.filter((s) => s.companyId === args.companyId);
    }

    const stats: Record<string, number> = {};
    for (const s of students) {
      stats[s.currentStatus] = (stats[s.currentStatus] || 0) + 1;
    }

    return {
      total: students.length,
      byStatus: stats,
      activeCount: students.filter((s) => s.currentStatus === "active").length,
      admittedCount: students.filter((s) => s.currentStatus === "admitted").length,
      alumniCount: students.filter((s) => s.currentStatus === "alumni").length,
    };
  },
});
