import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const SEED_DATA: Array<{
  name: string;
  code: string;
  sessionCode: string;
  semesterNumber: number;
  startDate: Date;
  endDate: Date;
  description: string;
  color: string;
  icon: string;
}> = [
  // ── Semester 1–8 (linked to AY2526) ──
  {
    name: "Semester 1", code: "SEM1", sessionCode: "AY2526", semesterNumber: 1,
    startDate: new Date("2025-04-01T00:00:00Z"), endDate: new Date("2025-06-30T23:59:59Z"),
    description: "First semester — foundation courses and introductory modules.",
    color: "#4285f4", icon: "BookOpen",
  },
  {
    name: "Semester 2", code: "SEM2", sessionCode: "AY2526", semesterNumber: 2,
    startDate: new Date("2025-07-01T00:00:00Z"), endDate: new Date("2025-09-30T23:59:59Z"),
    description: "Second semester — core subject progression and practical labs.",
    color: "#34a853", icon: "BookText",
  },
  {
    name: "Semester 3", code: "SEM3", sessionCode: "AY2526", semesterNumber: 3,
    startDate: new Date("2025-10-01T00:00:00Z"), endDate: new Date("2025-12-31T23:59:59Z"),
    description: "Third semester — advanced modules and elective introductions.",
    color: "#a855f7", icon: "BookMarked",
  },
  {
    name: "Semester 4", code: "SEM4", sessionCode: "AY2526", semesterNumber: 4,
    startDate: new Date("2026-01-01T00:00:00Z"), endDate: new Date("2026-03-31T23:59:59Z"),
    description: "Fourth semester — mid-program assessments and specialization start.",
    color: "#fbbc04", icon: "BookType",
  },
  {
    name: "Semester 5", code: "SEM5", sessionCode: "AY2627", semesterNumber: 5,
    startDate: new Date("2026-04-01T00:00:00Z"), endDate: new Date("2026-06-30T23:59:59Z"),
    description: "Fifth semester — advanced specialization and industry exposure.",
    color: "#e8710a", icon: "BookOpen",
  },
  {
    name: "Semester 6", code: "SEM6", sessionCode: "AY2627", semesterNumber: 6,
    startDate: new Date("2026-07-01T00:00:00Z"), endDate: new Date("2026-09-30T23:59:59Z"),
    description: "Sixth semester — research projects and internship integration.",
    color: "#06b6d4", icon: "BookText",
  },
  {
    name: "Semester 7", code: "SEM7", sessionCode: "AY2627", semesterNumber: 7,
    startDate: new Date("2026-10-01T00:00:00Z"), endDate: new Date("2026-12-31T23:59:59Z"),
    description: "Seventh semester — capstone preparation and elective deep dive.",
    color: "#4f46e5", icon: "BookMarked",
  },
  {
    name: "Semester 8", code: "SEM8", sessionCode: "AY2627", semesterNumber: 8,
    startDate: new Date("2027-01-01T00:00:00Z"), endDate: new Date("2027-03-31T23:59:59Z"),
    description: "Eighth semester — capstone submission and final assessments.",
    color: "#f43f5e", icon: "Award",
  },

  // ── Trimester 1–3 (linked to AY2526) ──
  {
    name: "Trimester 1", code: "TRI1", sessionCode: "AY2526", semesterNumber: 1,
    startDate: new Date("2025-04-01T00:00:00Z"), endDate: new Date("2025-07-31T23:59:59Z"),
    description: "First trimester — intensive modules with faster pace for trimester system.",
    color: "#0d9488", icon: "Notebook",
  },
  {
    name: "Trimester 2", code: "TRI2", sessionCode: "AY2526", semesterNumber: 2,
    startDate: new Date("2025-08-01T00:00:00Z"), endDate: new Date("2025-11-30T23:59:59Z"),
    description: "Second trimester — mid-term evaluations and practical applications.",
    color: "#10b981", icon: "NotebookPen",
  },
  {
    name: "Trimester 3", code: "TRI3", sessionCode: "AY2526", semesterNumber: 3,
    startDate: new Date("2025-12-01T00:00:00Z"), endDate: new Date("2026-03-31T23:59:59Z"),
    description: "Third trimester — final assessments, projects and year-end evaluations.",
    color: "#f59e0b", icon: "NotebookTabs",
  },
];

export const listAcademicSemesters = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("academicSemesters").collect();
    return items.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getAcademicSemester = query({
  args: { semesterId: v.id("academicSemesters") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.semesterId);
  },
});

export const createAcademicSemester = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    academicSessionId: v.id("academicSessions"),
    semesterNumber: v.number(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const allItems = await ctx.db.query("academicSemesters").collect();
    const maxSeq = allItems.reduce((max, s) => Math.max(max, s.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("academicSemesters", {
      name: args.name,
      code: args.code,
      academicSessionId: args.academicSessionId,
      semesterNumber: args.semesterNumber,
      startDate: args.startDate,
      endDate: args.endDate,
      description: args.description,
      color: args.color,
      icon: args.icon,
      sequence: maxSeq + 1,
      active: args.active,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateAcademicSemester = mutation({
  args: {
    semesterId: v.id("academicSemesters"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    academicSessionId: v.optional(v.id("academicSessions")),
    semesterNumber: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { semesterId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(semesterId, updates);
  },
});

export const deleteAcademicSemester = mutation({
  args: { semesterId: v.id("academicSemesters") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.semesterId);
  },
});

export const duplicateAcademicSemester = mutation({
  args: { semesterId: v.id("academicSemesters") },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.semesterId);
    if (!original) throw new Error("Academic semester not found");
    const allItems = await ctx.db.query("academicSemesters").collect();
    const maxSeq = allItems.reduce((max, s) => Math.max(max, s.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("academicSemesters", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
      academicSessionId: original.academicSessionId,
      semesterNumber: original.semesterNumber,
      startDate: original.startDate,
      endDate: original.endDate,
      description: original.description,
      color: original.color,
      icon: original.icon,
      sequence: maxSeq + 1,
      active: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const reorderAcademicSemesters = mutation({
  args: {
    semesterIds: v.array(v.id("academicSemesters")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.semesterIds.length; i++) {
      await ctx.db.patch(args.semesterIds[i], { sequence: i + 1, updatedAt: now });
    }
  },
});

export const seedDefaultAcademicSemesters = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("academicSemesters").collect();
    if (existing.length > 0) return { seeded: 0, message: "Academic semesters already exist" };

    const sessions = await ctx.db.query("academicSessions").collect();
    const sessionByCode: Record<string, typeof sessions[0]> = {};
    for (const s of sessions) sessionByCode[s.code] = s;

    const now = Date.now();
    let idx = 0;
    for (const seed of SEED_DATA) {
      const session = sessionByCode[seed.sessionCode];
      if (!session) continue;
      idx++;
      await ctx.db.insert("academicSemesters", {
        name: seed.name,
        code: seed.code,
        academicSessionId: session._id,
        semesterNumber: seed.semesterNumber,
        startDate: seed.startDate.getTime(),
        endDate: seed.endDate.getTime(),
        description: seed.description,
        color: seed.color,
        icon: seed.icon,
        sequence: idx,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: idx, message: "Default academic semesters created" };
  },
});
