import { v } from "convex/values";
import { query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ─── Global Student Search ───────────────────────────────

export const searchStudents = query({
  args: {
    searchTerm: v.string(),
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 30;
    const term = args.searchTerm.toLowerCase().trim();
    if (!term) return { items: [], totalCount: 0 };

    // Get all active students
    let students = await ctx.db.query("studentMaster").collect();

    // Apply filters
    if (args.status) {
      students = students.filter((s) => s.currentStatus === args.status);
    }
    if (args.branchId) {
      students = students.filter((s) => s.branchId === args.branchId);
    }
    if (args.companyId) {
      students = students.filter((s) => s.companyId === args.companyId);
    }

    // Score each match
    const scored: Array<{
      student: Doc<"studentMaster">;
      person: Doc<"personMaster"> | null;
      score: number;
      matchedField: string;
    }> = [];

    for (const student of students) {
      const person = await ctx.db.get(student.personId);
      if (!person || person.status === "archived") continue;

      let score = 0;
      let matchedField = "";

      const displayName = (person.displayName || "").toLowerCase();
      const firstName = (person.firstName || "").toLowerCase();
      const lastName = (person.lastName || "").toLowerCase();
      const studentCode = student.studentCode.toLowerCase();
      const admissionNumber = student.admissionNumber.toLowerCase();

      // Search by student-specific identifiers
      if (studentCode === term) { score = 100; matchedField = "studentCode"; }
      else if (admissionNumber === term) { score = 95; matchedField = "admissionNumber"; }
      else if (student.admissionNumber && student.admissionNumber.toLowerCase().includes(term)) { score = 80; matchedField = "admissionNumber"; }
      else if (studentCode.includes(term)) { score = 85; matchedField = "studentCode"; }
      else if (student.rollNumber && student.rollNumber.toLowerCase() === term) { score = 90; matchedField = "rollNumber"; }
      // Search by person name
      else if (displayName === term) { score = 75; matchedField = "displayName"; }
      else if (displayName.includes(term)) { score = 60; matchedField = "displayName"; }
      else if (firstName.includes(term) || lastName.includes(term)) { score = 50; matchedField = "name"; }
      else {
        const words = displayName.split(/\s+/);
        if (words.some((w) => w.startsWith(term))) { score = 30; matchedField = "partialName"; }
      }

      if (score > 0) {
        scored.push({ student, person, score, matchedField });
      }
    }

    // Also search contact methods (phone, email)
    const contacts = await ctx.db
      .query("contactMethods")
      .withIndex("value", (q) => q.eq("value", args.searchTerm))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    for (const contact of contacts) {
      const student = students.find((s) => s.personId === contact.personId);
      if (student && !scored.find((s) => s.student._id === student._id)) {
        const person = await ctx.db.get(student.personId);
        if (person && person.status !== "archived") {
          scored.push({
            student,
            person,
            score: 92,
            matchedField: contact.type === "email" ? "email" : "phone",
          });
        }
      }
    }

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Pagination
    const startIndex = args.cursor ? parseInt(args.cursor) : 0;
    const paginated = scored.slice(startIndex, startIndex + limit);

    return {
      items: paginated.map((s) => ({
        student: s.student,
        person: s.person,
        score: s.score,
        matchedField: s.matchedField,
      })),
      totalCount: scored.length,
      nextCursor: startIndex + limit < scored.length ? String(startIndex + limit) : undefined,
    };
  },
});

// ─── Quick Student Search (autocomplete) ─────────────────

export const quickStudentSearch = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const term = args.searchTerm.toLowerCase().trim();
    if (term.length < 2) return [];

    const students = await ctx.db.query("studentMaster").collect();
    const results: Array<{
      studentId: Id<"studentMaster">;
      studentCode: string;
      personName: string;
      admissionNumber: string;
      currentStatus: string;
      profilePhoto: string | undefined;
    }> = [];

    for (const student of students) {
      const person = await ctx.db.get(student.personId);
      if (!person || person.status === "archived") continue;

      const displayName = (person.displayName || "").toLowerCase();
      const firstName = (person.firstName || "").toLowerCase();
      const lastName = (person.lastName || "").toLowerCase();
      const studentCode = student.studentCode.toLowerCase();
      const admissionNumber = student.admissionNumber.toLowerCase();

      if (
        displayName.includes(term) ||
        firstName.includes(term) ||
        lastName.includes(term) ||
        studentCode.includes(term) ||
        admissionNumber.includes(term)
      ) {
        results.push({
          studentId: student._id,
          studentCode: student.studentCode,
          personName: person.displayName || `${person.firstName} ${person.lastName}`,
          admissionNumber: student.admissionNumber,
          currentStatus: student.currentStatus,
          profilePhoto: person.profilePhoto,
        });

        if (results.length >= limit) break;
      }
    }

    return results;
  },
});

// ─── Find by Identifier ──────────────────────────────────

export const findByAdmissionNumber = query({
  args: { admissionNumber: v.string() },
  handler: async (ctx, args) => {
    const student = await ctx.db
      .query("studentMaster")
      .withIndex("admissionNumber", (q) => q.eq("admissionNumber", args.admissionNumber))
      .first();

    if (!student) return null;

    const person = await ctx.db.get(student.personId);
    if (!person || person.status === "archived") return null;

    const contacts = await ctx.db
      .query("contactMethods")
      .withIndex("personId", (q) => q.eq("personId", student.personId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return { student, person, contacts };
  },
});

export const findByStudentCode = query({
  args: { studentCode: v.string() },
  handler: async (ctx, args) => {
    const student = await ctx.db
      .query("studentMaster")
      .withIndex("studentCode", (q) => q.eq("studentCode", args.studentCode))
      .first();

    if (!student) return null;

    const person = await ctx.db.get(student.personId);
    if (!person || person.status === "archived") return null;

    return { student, person };
  },
});

// ─── Student Summary ─────────────────────────────────────

export const getStudentSummary = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) return null;

    const person = await ctx.db.get(student.personId);
    if (!person || person.status === "archived") return null;

    const [academicProfile, admissions, medical, achievements, disciplinary, timeline, statusHistory] =
      await Promise.all([
        ctx.db
          .query("studentAcademicProfile")
          .withIndex("studentId", (q) => q.eq("studentId", args.studentId))
          .filter((q) => q.eq(q.field("isCurrent"), true))
          .first(),
        ctx.db
          .query("studentAdmissions")
          .withIndex("studentId", (q) => q.eq("studentId", args.studentId))
          .order("desc")
          .collect(),
        ctx.db
          .query("studentMedicalProfile")
          .withIndex("studentId", (q) => q.eq("studentId", args.studentId))
          .first(),
        ctx.db
          .query("studentAchievements")
          .withIndex("studentId", (q) => q.eq("studentId", args.studentId))
          .collect(),
        ctx.db
          .query("studentDisciplinaryRecords")
          .withIndex("studentId", (q) => q.eq("studentId", args.studentId))
          .collect(),
        ctx.db
          .query("studentTimeline")
          .withIndex("studentId_createdAt", (q) => q.eq("studentId", args.studentId))
          .order("desc")
          .take(20),
        ctx.db
          .query("studentStatusHistory")
          .withIndex("studentId_changedAt", (q) => q.eq("studentId", args.studentId))
          .order("desc")
          .collect(),
      ]);

    const contacts = await ctx.db
      .query("contactMethods")
      .withIndex("personId", (q) => q.eq("personId", student.personId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return {
      student,
      person,
      academicProfile,
      admissions,
      medical,
      achievements,
      disciplinary,
      timeline,
      statusHistory,
      contacts,
      summary: {
        admissionCount: admissions.length,
        achievementCount: achievements.length,
        disciplinaryCount: disciplinary.length,
        statusChanges: statusHistory.length,
        preferredEmail: contacts.find((c) => c.type === "email" && c.preferred)?.value,
        preferredPhone: contacts.find((c) => (c.type === "mobile" || c.type === "phone") && c.preferred)?.value,
      },
    };
  },
});
