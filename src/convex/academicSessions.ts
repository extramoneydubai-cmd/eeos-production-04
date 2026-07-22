import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DEFAULT_SESSIONS = [
  {
    name: "Academic Session 2024–25",
    code: "AY2425",
    academicYear: "2024–25",
    startDate: new Date("2024-04-01T00:00:00Z").getTime(),
    endDate: new Date("2025-03-31T23:59:59Z").getTime(),
    admissionStartDate: new Date("2023-11-01T00:00:00Z").getTime(),
    admissionEndDate: new Date("2024-09-30T23:59:59Z").getTime(),
    color: "#9aa0a6",
    icon: "CalendarCheck",
    description: "Completed academic year — foundational session for curriculum rollout.",
    isCurrent: false,
  },
  {
    name: "Academic Session 2025–26",
    code: "AY2526",
    academicYear: "2025–26",
    startDate: new Date("2025-04-01T00:00:00Z").getTime(),
    endDate: new Date("2026-03-31T23:59:59Z").getTime(),
    admissionStartDate: new Date("2024-11-01T00:00:00Z").getTime(),
    admissionEndDate: new Date("2025-09-30T23:59:59Z").getTime(),
    color: "#1a73e8",
    icon: "Calendar",
    description: "Current academic session — active admissions and ongoing instruction.",
    isCurrent: true,
  },
  {
    name: "Academic Session 2026–27",
    code: "AY2627",
    academicYear: "2026–27",
    startDate: new Date("2026-04-01T00:00:00Z").getTime(),
    endDate: new Date("2027-03-31T23:59:59Z").getTime(),
    admissionStartDate: new Date("2025-11-01T00:00:00Z").getTime(),
    admissionEndDate: new Date("2026-09-30T23:59:59Z").getTime(),
    color: "#34a853",
    icon: "CalendarPlus",
    description: "Upcoming academic session — pre-admissions and planning phase.",
    isCurrent: false,
  },
  {
    name: "Academic Session 2027–28",
    code: "AY2728",
    academicYear: "2027–28",
    startDate: new Date("2027-04-01T00:00:00Z").getTime(),
    endDate: new Date("2028-03-31T23:59:59Z").getTime(),
    admissionStartDate: new Date("2026-11-01T00:00:00Z").getTime(),
    admissionEndDate: new Date("2027-09-30T23:59:59Z").getTime(),
    color: "#a855f7",
    icon: "CalendarRange",
    description: "Future academic session — long-term planning and resource allocation.",
    isCurrent: false,
  },
];

// Helper: unset isCurrent on all sessions, then set it on the specified one
async function setCurrentSession(ctx: any, currentId: string) {
  const allSessions = await ctx.db.query("academicSessions").collect();
  const now = Date.now();
  for (const session of allSessions) {
    if (session.isCurrent) {
      await ctx.db.patch(session._id, { isCurrent: false, updatedAt: now });
    }
  }
  await ctx.db.patch(currentId, { isCurrent: true, updatedAt: now });
}

export const listAcademicSessions = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("academicSessions").collect();
    return items.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getAcademicSession = query({
  args: { sessionId: v.id("academicSessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

export const createAcademicSession = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    academicYear: v.string(),
    color: v.string(),
    icon: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    admissionStartDate: v.optional(v.number()),
    admissionEndDate: v.optional(v.number()),
    description: v.optional(v.string()),
    isCurrent: v.boolean(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const allItems = await ctx.db.query("academicSessions").collect();
    const maxSeq = allItems.reduce((max, s) => Math.max(max, s.sequence), 0);
    const now = Date.now();

    // If marking as current, unset all others first
    if (args.isCurrent) {
      for (const session of allItems) {
        if (session.isCurrent) {
          await ctx.db.patch(session._id, { isCurrent: false, updatedAt: now });
        }
      }
    }

    return await ctx.db.insert("academicSessions", {
      name: args.name,
      code: args.code,
      academicYear: args.academicYear,
      color: args.color,
      icon: args.icon,
      startDate: args.startDate,
      endDate: args.endDate,
      admissionStartDate: args.admissionStartDate,
      admissionEndDate: args.admissionEndDate,
      description: args.description,
      sequence: maxSeq + 1,
      isCurrent: args.isCurrent,
      active: args.active,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateAcademicSession = mutation({
  args: {
    sessionId: v.id("academicSessions"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    admissionStartDate: v.optional(v.number()),
    admissionEndDate: v.optional(v.number()),
    description: v.optional(v.string()),
    isCurrent: v.optional(v.boolean()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { sessionId, ...fields } = args;
    const now = Date.now();

    // If marking as current, unset all others first
    if (fields.isCurrent === true) {
      await setCurrentSession(ctx, sessionId);
      // Remove isCurrent from the patch to avoid double-setting
      const { isCurrent: _, ...rest } = fields;
      const updates: Record<string, any> = { updatedAt: now };
      for (const [key, value] of Object.entries(rest)) {
        if (value !== undefined) updates[key] = value;
      }
      await ctx.db.patch(sessionId, updates);
    } else {
      const updates: Record<string, any> = { updatedAt: now };
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) updates[key] = value;
      }
      await ctx.db.patch(sessionId, updates);
    }
  },
});

export const deleteAcademicSession = mutation({
  args: { sessionId: v.id("academicSessions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.sessionId);
  },
});

export const duplicateAcademicSession = mutation({
  args: { sessionId: v.id("academicSessions") },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.sessionId);
    if (!original) throw new Error("Academic session not found");
    const allItems = await ctx.db.query("academicSessions").collect();
    const maxSeq = allItems.reduce((max, s) => Math.max(max, s.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("academicSessions", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
      academicYear: original.academicYear,
      color: original.color,
      icon: original.icon,
      startDate: original.startDate,
      endDate: original.endDate,
      admissionStartDate: original.admissionStartDate,
      admissionEndDate: original.admissionEndDate,
      description: original.description,
      sequence: maxSeq + 1,
      isCurrent: false,
      active: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const reorderAcademicSessions = mutation({
  args: {
    sessionIds: v.array(v.id("academicSessions")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.sessionIds.length; i++) {
      await ctx.db.patch(args.sessionIds[i], { sequence: i + 1, updatedAt: now });
    }
  },
});

export const seedDefaultAcademicSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("academicSessions").collect();
    if (existing.length > 0) return { seeded: 0, message: "Academic sessions already exist" };

    const now = Date.now();
    for (let i = 0; i < DEFAULT_SESSIONS.length; i++) {
      const item = DEFAULT_SESSIONS[i];
      await ctx.db.insert("academicSessions", {
        ...item,
        description: item.description,
        sequence: i + 1,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: DEFAULT_SESSIONS.length, message: "Default academic sessions created" };
  },
});
