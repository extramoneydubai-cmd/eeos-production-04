import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const SEED_DATA: Array<{
  name: string;
  code: string;
  sessionCode: string;
  termNumber: number;
  startDate: Date;
  endDate: Date;
  description: string;
  color: string;
  icon: string;
}> = [
  {
    name: "Term 1", code: "TERM1", sessionCode: "AY2526", termNumber: 1,
    startDate: new Date("2025-04-01T00:00:00Z"), endDate: new Date("2025-06-30T23:59:59Z"),
    description: "First academic term — foundation modules and introductory curriculum.",
    color: "#4285f4", icon: "BookOpen",
  },
  {
    name: "Term 2", code: "TERM2", sessionCode: "AY2526", termNumber: 2,
    startDate: new Date("2025-07-01T00:00:00Z"), endDate: new Date("2025-09-30T23:59:59Z"),
    description: "Second academic term — core progression and mid-year assessments.",
    color: "#34a853", icon: "BookText",
  },
  {
    name: "Term 3", code: "TERM3", sessionCode: "AY2526", termNumber: 3,
    startDate: new Date("2025-10-01T00:00:00Z"), endDate: new Date("2026-03-31T23:59:59Z"),
    description: "Third academic term — advanced topics, final exams and year-end evaluation.",
    color: "#a855f7", icon: "BookCheck",
  },
  {
    name: "Quarter 1", code: "Q1", sessionCode: "AY2526", termNumber: 1,
    startDate: new Date("2025-04-01T00:00:00Z"), endDate: new Date("2025-06-30T23:59:59Z"),
    description: "First quarter — quarter-system introductory modules.",
    color: "#e8710a", icon: "Calendar",
  },
  {
    name: "Quarter 2", code: "Q2", sessionCode: "AY2526", termNumber: 2,
    startDate: new Date("2025-07-01T00:00:00Z"), endDate: new Date("2025-09-30T23:59:59Z"),
    description: "Second quarter — quarter-system core subjects and assessments.",
    color: "#06b6d4", icon: "CalendarDays",
  },
  {
    name: "Quarter 3", code: "Q3", sessionCode: "AY2526", termNumber: 3,
    startDate: new Date("2025-10-01T00:00:00Z"), endDate: new Date("2025-12-31T23:59:59Z"),
    description: "Third quarter — quarter-system advanced modules and projects.",
    color: "#10b981", icon: "CalendarClock",
  },
  {
    name: "Quarter 4", code: "Q4", sessionCode: "AY2526", termNumber: 4,
    startDate: new Date("2026-01-01T00:00:00Z"), endDate: new Date("2026-03-31T23:59:59Z"),
    description: "Fourth quarter — quarter-system final assessments and capstone.",
    color: "#4f46e5", icon: "Milestone",
  },
];

export const listAcademicTerms = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("academicTerms").collect();
    return items.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getAcademicTerm = query({
  args: { termId: v.id("academicTerms") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.termId);
  },
});

export const createAcademicTerm = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    academicSessionId: v.id("academicSessions"),
    termNumber: v.number(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const allItems = await ctx.db.query("academicTerms").collect();
    const maxSeq = allItems.reduce((max, t) => Math.max(max, t.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("academicTerms", {
      name: args.name,
      code: args.code,
      academicSessionId: args.academicSessionId,
      termNumber: args.termNumber,
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

export const updateAcademicTerm = mutation({
  args: {
    termId: v.id("academicTerms"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    academicSessionId: v.optional(v.id("academicSessions")),
    termNumber: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { termId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(termId, updates);
  },
});

export const deleteAcademicTerm = mutation({
  args: { termId: v.id("academicTerms") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.termId);
  },
});

export const duplicateAcademicTerm = mutation({
  args: { termId: v.id("academicTerms") },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.termId);
    if (!original) throw new Error("Academic term not found");
    const allItems = await ctx.db.query("academicTerms").collect();
    const maxSeq = allItems.reduce((max, t) => Math.max(max, t.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("academicTerms", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
      academicSessionId: original.academicSessionId,
      termNumber: original.termNumber,
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

export const reorderAcademicTerms = mutation({
  args: {
    termIds: v.array(v.id("academicTerms")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.termIds.length; i++) {
      await ctx.db.patch(args.termIds[i], { sequence: i + 1, updatedAt: now });
    }
  },
});

export const seedDefaultAcademicTerms = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("academicTerms").collect();
    if (existing.length > 0) return { seeded: 0, message: "Academic terms already exist" };

    const sessions = await ctx.db.query("academicSessions").collect();
    const sessionByCode: Record<string, typeof sessions[0]> = {};
    for (const s of sessions) sessionByCode[s.code] = s;

    const now = Date.now();
    let idx = 0;
    for (const seed of SEED_DATA) {
      const session = sessionByCode[seed.sessionCode];
      if (!session) continue;
      idx++;
      await ctx.db.insert("academicTerms", {
        name: seed.name,
        code: seed.code,
        academicSessionId: session._id,
        termNumber: seed.termNumber,
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
    return { seeded: idx, message: "Default academic terms created" };
  },
});
