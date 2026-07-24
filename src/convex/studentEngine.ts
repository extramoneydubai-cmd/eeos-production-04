import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ─── Helpers ──────────────────────────────────────────────

async function generateStudentCode(ctx: { db: { query: (name: string) => any } }): Promise<string> {
  const existing = await ctx.db.query("studentMaster").collect();
  const count = existing.length + 1;
  return `STD-${String(count).padStart(6, "0")}`;
}

async function generateAdmissionNumber(ctx: { db: { query: (name: string) => any } }): Promise<string> {
  const existing = await ctx.db.query("studentMaster").collect();
  const count = existing.length + 1;
  return `ADM-${new Date().getFullYear()}-${String(count).padStart(4, "0")}`;
}

async function createTimelineEvent(
  ctx: { db: { insert: (table: string, doc: any) => Promise<any> } },
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

// ─── Student CRUD ────────────────────────────────────────

export const createStudent = mutation({
  args: {
    // Person fields (for People Registry)
    firstName: v.string(),
    middleName: v.optional(v.string()),
    lastName: v.string(),
    dateOfBirth: v.optional(v.number()),
    gender: v.optional(v.string()),
    nationality: v.optional(v.string()),
    phone: v.string(),
    email: v.optional(v.string()),
    // Student-specific fields
    leadId: v.optional(v.id("leadMaster")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    organizationId: v.optional(v.id("organizations")),
    academicYearId: v.optional(v.id("academicSessions")),
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
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const { academicProfile, academicYearId, leadId, companyId, branchId, organizationId, createdBy, ...personFields } = args;

    // Step 1: Create Person in Global People Registry
    const personId = await ctx.db.insert("personMaster", {
      firstName: personFields.firstName,
      middleName: personFields.middleName,
      lastName: personFields.lastName,
      displayName: `${personFields.firstName} ${personFields.lastName}`,
      gender: personFields.gender,
      dateOfBirth: personFields.dateOfBirth,
      nationality: personFields.nationality,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    // Step 2: Add contact methods to People Registry
    await ctx.db.insert("contactMethods", {
      personId,
      type: "mobile",
      value: personFields.phone,
      preferred: true,
      verified: false,
      visibility: "organization",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    if (personFields.email) {
      await ctx.db.insert("contactMethods", {
        personId,
        type: "email",
        value: personFields.email,
        preferred: true,
        verified: false,
        visibility: "organization",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Step 3: Add Student profile to People Registry
    await ctx.db.insert("personProfiles", {
      personId,
      profileType: "student",
      active: true,
      primaryProfile: true,
      displayLabel: "Student",
      createdAt: now,
      updatedAt: now,
    });

    // Step 4: Auto-generate QR code for the person
    const raw = `${personId}-${now}-${Math.random().toString(36).substring(2, 10)}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(raw);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const qrToken = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").substring(0, 32);

    await ctx.db.insert("personQRCode", {
      personId,
      qrToken,
      deepLink: `eeos://person/${personId}`,
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    // Step 5: Generate student code and admission number
    const studentCode = await generateStudentCode(ctx);
    const admissionNumber = await generateAdmissionNumber(ctx);

    // Step 6: Create Student Master record
    const studentId = await ctx.db.insert("studentMaster", {
      studentCode,
      personId,
      leadId,
      admissionNumber,
      enrollmentDate: now,
      currentStatus: leadId ? "lead" : "enquiry",
      companyId,
      branchId,
      organizationId,
      academicYearId,
      createdBy,
      createdAt: now,
      updatedAt: now,
    });

    // Step 7: Create initial status history
    await ctx.db.insert("studentStatusHistory", {
      studentId,
      fromStatus: undefined,
      toStatus: leadId ? "lead" : "enquiry",
      remarks: "Student created",
      changedBy: createdBy,
      changedAt: now,
      createdAt: now,
    });

    // Step 8: Create academic profile if provided
    if (academicProfile) {
      await ctx.db.insert("studentAcademicProfile", {
        studentId,
        verticalId: academicProfile.verticalId,
        subVerticalId: academicProfile.subVerticalId,
        boardId: academicProfile.boardId,
        courseId: academicProfile.courseId,
        batchId: academicProfile.batchId,
        sectionId: academicProfile.sectionId,
        semesterId: academicProfile.semesterId,
        termId: academicProfile.termId,
        currentYear: 1,
        isCurrent: true,
        startDate: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Step 9: Create timeline event
    await createTimelineEvent(ctx, studentId, "student_created", "Student Created", `Student ${studentCode} enrolled`, createdBy);

    return { studentId, personId, studentCode, admissionNumber };
  },
});

export const getStudent = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) return null;

    // Load person data from People Registry
    const person = await ctx.db.get(student.personId);
    if (!person || person.status === "archived") return null;

    // Load contacts from People Registry
    const contacts = await ctx.db
      .query("contactMethods")
      .withIndex("personId", (q) => q.eq("personId", student.personId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Load addresses from People Registry
    const addresses = await ctx.db
      .query("addresses")
      .withIndex("personId", (q) => q.eq("personId", student.personId))
      .collect();

    // Load profiles from People Registry
    const profiles = await ctx.db
      .query("personProfiles")
      .withIndex("personId", (q) => q.eq("personId", student.personId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    // Load QR code
    const qrCode = await ctx.db
      .query("personQRCode")
      .withIndex("personId", (q) => q.eq("personId", student.personId))
      .filter((q) => q.eq(q.field("active"), true))
      .first();

    // Load student-specific data
    const academicProfile = await ctx.db
      .query("studentAcademicProfile")
      .withIndex("studentId", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.eq(q.field("isCurrent"), true))
      .first();

    const admissions = await ctx.db
      .query("studentAdmissions")
      .withIndex("studentId", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .take(1);

    const medical = await ctx.db
      .query("studentMedicalProfile")
      .withIndex("studentId", (q) => q.eq("studentId", args.studentId))
      .first();

    const recentTimeline = await ctx.db
      .query("studentTimeline")
      .withIndex("studentId_createdAt", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .take(20);

    return {
      student,
      person,
      contacts,
      addresses,
      profiles,
      qrCode,
      academicProfile,
      latestAdmission: admissions[0] || null,
      medical,
      recentTimeline,
    };
  },
});

export const updateStudent = mutation({
  args: {
    studentId: v.id("studentMaster"),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    organizationId: v.optional(v.id("organizations")),
    academicYearId: v.optional(v.id("academicSessions")),
    rollNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { studentId, ...fields } = args;
    const existing = await ctx.db.get(studentId);
    if (!existing) throw new Error("Student not found");

    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(studentId, updates);
    return studentId;
  },
});

export const archiveStudent = mutation({
  args: {
    studentId: v.id("studentMaster"),
    reason: v.optional(v.string()),
    performedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");

    const now = Date.now();
    await ctx.db.patch(args.studentId, { currentStatus: "cancelled" as any, updatedAt: now });

    await ctx.db.insert("studentStatusHistory", {
      studentId: args.studentId,
      fromStatus: student.currentStatus,
      toStatus: "cancelled",
      remarks: args.reason || "Student archived",
      changedBy: args.performedBy,
      changedAt: now,
      createdAt: now,
    });

    await createTimelineEvent(
      ctx,
      args.studentId,
      "student_archived",
      "Student Archived",
      args.reason || "Student record archived",
      args.performedBy,
    );

    return args.studentId;
  },
});

export const restoreStudent = mutation({
  args: {
    studentId: v.id("studentMaster"),
    performedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");

    const now = Date.now();
    await ctx.db.patch(args.studentId, { currentStatus: "active" as any, updatedAt: now });

    await ctx.db.insert("studentStatusHistory", {
      studentId: args.studentId,
      fromStatus: student.currentStatus,
      toStatus: "active",
      remarks: "Student restored",
      changedBy: args.performedBy,
      changedAt: now,
      createdAt: now,
    });

    await createTimelineEvent(ctx, args.studentId, "student_restored", "Student Restored", "Student record reactivated", args.performedBy);
    return args.studentId;
  },
});

export const listStudents = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    status: v.optional(v.string()),
    academicYearId: v.optional(v.id("academicSessions")),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    let baseQuery = ctx.db.query("studentMaster");

    if (args.status) {
      baseQuery = baseQuery.filter((q) => q.eq(q.field("currentStatus"), args.status));
    }
    if (args.branchId) {
      baseQuery = baseQuery.filter((q) => q.eq(q.field("branchId"), args.branchId));
    }
    if (args.companyId) {
      baseQuery = baseQuery.filter((q) => q.eq(q.field("companyId"), args.companyId));
    }
    if (args.academicYearId) {
      baseQuery = baseQuery.filter((q) => q.eq(q.field("academicYearId"), args.academicYearId));
    }

    const results = await baseQuery.order("desc").take(limit + 1);
    const hasMore = results.length > limit;
    const items = results.slice(0, limit);

    // Enrich with person names
    const enriched = await Promise.all(
      items.map(async (s) => {
        const person = await ctx.db.get(s.personId);
        return {
          ...s,
          personName: person ? person.displayName || `${person.firstName} ${person.lastName}` : "Unknown",
          personPhoto: person?.profilePhoto,
        };
      })
    );

    return {
      items: enriched,
      hasMore,
      cursor: hasMore ? items[items.length - 1]._id : undefined,
    };
  },
});

export const getStudentByPersonId = query({
  args: { personId: v.id("personMaster") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("studentMaster")
      .withIndex("personId", (q) => q.eq("personId", args.personId))
      .first();
  },
});
