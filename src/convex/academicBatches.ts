import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

const SEED_DATA: Array<{
  programCode: string;
  batchTypeCode: string;
  sessionCode: string;
  name: string;
  code: string;
  capacity: number;
  minStrength: number;
  maxStrength: number;
  startDate: Date;
  endDate: Date;
  description: string;
  color: string;
  icon: string;
}> = [
  // ── JEE Foundation Batches ──
  {
    programCode: "JEE_FOUNDATION", batchTypeCode: "MORNING", sessionCode: "AY2526",
    name: "JEE Foundation Morning A", code: "JEE_FOUND_MORN_A",
    capacity: 60, minStrength: 20, maxStrength: 65,
    startDate: new Date("2025-04-01T00:00:00Z"), endDate: new Date("2027-03-31T23:59:59Z"),
    description: "Morning batch for 2-year JEE Foundation programme with daily 6-9 AM classes.",
    color: "#4285f4", icon: "Sun",
  },
  {
    programCode: "JEE_FOUNDATION", batchTypeCode: "EVENING", sessionCode: "AY2526",
    name: "JEE Foundation Evening A", code: "JEE_FOUND_EVEN_A",
    capacity: 60, minStrength: 20, maxStrength: 65,
    startDate: new Date("2025-04-01T00:00:00Z"), endDate: new Date("2027-03-31T23:59:59Z"),
    description: "Evening batch for 2-year JEE Foundation with 4-7 PM classes for school students.",
    color: "#1a73e8", icon: "Moon",
  },
  {
    programCode: "JEE_FOUNDATION", batchTypeCode: "WEEKEND", sessionCode: "AY2526",
    name: "JEE Foundation Weekend", code: "JEE_FOUND_WEEKEND",
    capacity: 45, minStrength: 15, maxStrength: 50,
    startDate: new Date("2025-04-05T00:00:00Z"), endDate: new Date("2027-03-31T23:59:59Z"),
    description: "Weekend-only JEE Foundation batch for school students with Saturday-Sunday classes.",
    color: "#a855f7", icon: "Calendar",
  },

  // ── JEE Target Batches ──
  {
    programCode: "JEE_TARGET", batchTypeCode: "MORNING", sessionCode: "AY2526",
    name: "JEE Target Morning", code: "JEE_TARGET_MORN",
    capacity: 50, minStrength: 15, maxStrength: 55,
    startDate: new Date("2025-04-01T00:00:00Z"), endDate: new Date("2026-03-31T23:59:59Z"),
    description: "Intensive one-year JEE Target morning batch with daily practice sessions.",
    color: "#1a73e8", icon: "Target",
  },
  {
    programCode: "JEE_CRASH", batchTypeCode: "CRASH", sessionCode: "AY2526",
    name: "JEE Crash Course 2026", code: "JEE_CRASH_2026",
    capacity: 80, minStrength: 30, maxStrength: 90,
    startDate: new Date("2025-10-01T00:00:00Z"), endDate: new Date("2026-01-31T23:59:59Z"),
    description: "3-month intensive crash course with mock tests for JEE Main 2026.",
    color: "#e8710a", icon: "Zap",
  },

  // ── NEET Batches ──
  {
    programCode: "NEET_FOUNDATION", batchTypeCode: "MORNING", sessionCode: "AY2526",
    name: "NEET Foundation Morning", code: "NEET_FOUND_MORN",
    capacity: 55, minStrength: 20, maxStrength: 60,
    startDate: new Date("2025-04-01T00:00:00Z"), endDate: new Date("2027-03-31T23:59:59Z"),
    description: "2-year NEET Foundation morning batch covering Physics, Chemistry & Biology.",
    color: "#34a853", icon: "Sun",
  },
  {
    programCode: "NEET_TARGET", batchTypeCode: "EVENING", sessionCode: "AY2526",
    name: "NEET Target Evening", code: "NEET_TARGET_EVEN",
    capacity: 50, minStrength: 15, maxStrength: 55,
    startDate: new Date("2025-04-01T00:00:00Z"), endDate: new Date("2026-03-31T23:59:59Z"),
    description: "One-year NEET Target evening batch with intensive MCQs and test series.",
    color: "#0d652d", icon: "Moon",
  },
  {
    programCode: "NEET_CRASH", batchTypeCode: "CRASH", sessionCode: "AY2526",
    name: "NEET Crash Course 2026", code: "NEET_CRASH_2026",
    capacity: 75, minStrength: 25, maxStrength: 85,
    startDate: new Date("2025-11-01T00:00:00Z"), endDate: new Date("2026-02-28T23:59:59Z"),
    description: "Rapid revision and mock test series for NEET UG 2026 aspirants.",
    color: "#f43f5e", icon: "Zap",
  },

  // ── School Batches ──
  {
    programCode: "CBSE_CLASS_10", batchTypeCode: "REGULAR", sessionCode: "AY2526",
    name: "CBSE Class 10 A", code: "CBSE_10_A",
    capacity: 45, minStrength: 15, maxStrength: 50,
    startDate: new Date("2025-04-01T00:00:00Z"), endDate: new Date("2026-03-31T23:59:59Z"),
    description: "CBSE Class 10 batch A covering all subjects with board exam preparation.",
    color: "#34a853", icon: "GraduationCap",
  },
  {
    programCode: "CBSE_CLASS_10", batchTypeCode: "REGULAR", sessionCode: "AY2526",
    name: "CBSE Class 10 B", code: "CBSE_10_B",
    capacity: 45, minStrength: 15, maxStrength: 50,
    startDate: new Date("2025-04-01T00:00:00Z"), endDate: new Date("2026-03-31T23:59:59Z"),
    description: "CBSE Class 10 batch B for students with supplementary focus on Mathematics.",
    color: "#1a73e8", icon: "BookOpen",
  },
  {
    programCode: "CBSE_CLASS_9", batchTypeCode: "REGULAR", sessionCode: "AY2526",
    name: "CBSE Class 9 Morning", code: "CBSE_9_MORN",
    capacity: 40, minStrength: 12, maxStrength: 45,
    startDate: new Date("2025-04-01T00:00:00Z"), endDate: new Date("2026-03-31T23:59:59Z"),
    description: "CBSE Class 9 morning batch with foundational focus for higher classes.",
    color: "#4285f4", icon: "Sun",
  },
  {
    programCode: "CBSE_CLASS_12", batchTypeCode: "REGULAR", sessionCode: "AY2526",
    name: "CBSE Class 12 Science A", code: "CBSE_12_SCI_A",
    capacity: 40, minStrength: 12, maxStrength: 45,
    startDate: new Date("2025-04-01T00:00:00Z"), endDate: new Date("2026-03-31T23:59:59Z"),
    description: "CBSE Class 12 Science batch with Physics, Chemistry, Biology/Mathematics.",
    color: "#fbbc04", icon: "Award",
  },

  // ── CUET & Banking ──
  {
    programCode: "CUET_FOUNDATION", batchTypeCode: "REGULAR", sessionCode: "AY2526",
    name: "CUET Foundation Batch", code: "CUET_FOUND_BATCH",
    capacity: 50, minStrength: 15, maxStrength: 55,
    startDate: new Date("2025-06-01T00:00:00Z"), endDate: new Date("2026-03-31T23:59:59Z"),
    description: "CUET UG foundation batch covering domain subjects and general test.",
    color: "#ea4335", icon: "BookOpenText",
  },
  {
    programCode: "BANKING_WEEKEND", batchTypeCode: "WEEKEND", sessionCode: "AY2526",
    name: "Banking Weekend Crash", code: "BANKING_WEEKEND_CRASH",
    capacity: 35, minStrength: 10, maxStrength: 40,
    startDate: new Date("2025-07-05T00:00:00Z"), endDate: new Date("2026-01-05T23:59:59Z"),
    description: "Weekend crash course covering IBPS PO, Clerk and SBI exam syllabus.",
    color: "#06b6d4", icon: "Building2",
  },

  // ── UPSC ──
  {
    programCode: "UPSC_FOUNDATION", batchTypeCode: "MORNING", sessionCode: "AY2526",
    name: "UPSC Foundation Morning", code: "UPSC_FOUND_MORN",
    capacity: 40, minStrength: 12, maxStrength: 45,
    startDate: new Date("2025-04-01T00:00:00Z"), endDate: new Date("2026-03-31T23:59:59Z"),
    description: "UPSC Civil Services foundation batch covering Prelims and Mains syllabus.",
    color: "#0d9488", icon: "Landmark",
  },

  // ── Professional Batches ──
  {
    programCode: "DM_WEEKEND", batchTypeCode: "WEEKEND", sessionCode: "AY2526",
    name: "Digital Marketing Weekend", code: "DM_WEEKEND_BATCH",
    capacity: 30, minStrength: 8, maxStrength: 35,
    startDate: new Date("2025-05-03T00:00:00Z"), endDate: new Date("2025-07-05T23:59:59Z"),
    description: "Weekend digital marketing batch covering SEO, SEM, social media and analytics.",
    color: "#e8710a", icon: "Monitor",
  },
  {
    programCode: "FULLSTACK", batchTypeCode: "ONLINE", sessionCode: "AY2526",
    name: "Full Stack Web Dev Batch", code: "FULLSTACK_WEB_BATCH",
    capacity: 35, minStrength: 10, maxStrength: 40,
    startDate: new Date("2025-05-01T00:00:00Z"), endDate: new Date("2025-11-30T23:59:59Z"),
    description: "Online full stack web development batch with live classes and project mentoring.",
    color: "#34a853", icon: "Code",
  },
  {
    programCode: "FULLSTACK", batchTypeCode: "ONLINE", sessionCode: "AY2526",
    name: "Python Programming Online", code: "PYTHON_ONLINE_BATCH",
    capacity: 40, minStrength: 10, maxStrength: 45,
    startDate: new Date("2025-04-15T00:00:00Z"), endDate: new Date("2025-07-15T23:59:59Z"),
    description: "Online Python programming batch from fundamentals to advanced applications.",
    color: "#4285f4", icon: "Code2",
  },
  {
    programCode: "EXEC_LEADERSHIP", batchTypeCode: "HYBRID", sessionCode: "AY2526",
    name: "Executive Leadership 2025", code: "EXEC_LEADERSHIP_01",
    capacity: 25, minStrength: 8, maxStrength: 30,
    startDate: new Date("2025-06-01T00:00:00Z"), endDate: new Date("2025-12-31T23:59:59Z"),
    description: "Executive leadership development for senior managers — hybrid format with workshops.",
    color: "#0d652d", icon: "Crown",
  },
  {
    programCode: "AI_BOOTCAMP", batchTypeCode: "ONLINE", sessionCode: "AY2526",
    name: "AI & ML Bootcamp Online", code: "AI_ML_BOOTCAMP_01",
    capacity: 50, minStrength: 15, maxStrength: 60,
    startDate: new Date("2025-05-15T00:00:00Z"), endDate: new Date("2025-07-15T23:59:59Z"),
    description: "Intensive 2-month online bootcamp on machine learning, deep learning and generative AI.",
    color: "#ea4335", icon: "Bot",
  },
  {
    programCode: "BTECH_FOUNDATION", batchTypeCode: "REGULAR", sessionCode: "AY2526",
    name: "B.Tech Foundation Year", code: "BTECH_FOUND_YR_01",
    capacity: 120, minStrength: 40, maxStrength: 130,
    startDate: new Date("2025-07-01T00:00:00Z"), endDate: new Date("2026-06-30T23:59:59Z"),
    description: "First year B.Tech common foundation batch covering all engineering disciplines.",
    color: "#4285f4", icon: "Cpu",
  },
];

export const listAcademicBatches = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("academicBatches").collect();
    return items.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getAcademicBatch = query({
  args: { batchId: v.id("academicBatches") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.batchId);
  },
});

export const createAcademicBatch = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    programId: v.id("academicPrograms"),
    batchTypeId: v.id("academicBatchTypes"),
    academicSessionId: v.id("academicSessions"),
    capacity: v.optional(v.number()),
    minStrength: v.optional(v.number()),
    maxStrength: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    active: v.boolean(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "academic", entity: "academicBatches" }, async (ctx, args) => {
    const allItems = await ctx.db.query("academicBatches").collect();
    const maxSeq = allItems.reduce((max: any, b: any) => Math.max(max, b.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("academicBatches", {
      name: args.name,
      code: args.code,
      programId: args.programId,
      batchTypeId: args.batchTypeId,
      academicSessionId: args.academicSessionId,
      capacity: args.capacity,
      minStrength: args.minStrength,
      maxStrength: args.maxStrength,
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
  }),
});

export const updateAcademicBatch = mutation({
  args: { token: v.optional(v.string()),
    batchId: v.id("academicBatches"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    programId: v.optional(v.id("academicPrograms")),
    batchTypeId: v.optional(v.id("academicBatchTypes")),
    academicSessionId: v.optional(v.id("academicSessions")),
    capacity: v.optional(v.number()),
    minStrength: v.optional(v.number()),
    maxStrength: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "academicBatches" }, async (ctx, args) => {
    const { token: _token, batchId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(batchId, updates);
  }),
});

export const deleteAcademicBatch = mutation({
  args: { token: v.optional(v.string()), batchId: v.id("academicBatches") },
  handler: withScopeAndEvents({ operation: "delete", module: "academic", entity: "academicBatches" }, async (ctx, args) => {
    await ctx.db.delete(args.batchId);
  }),
});

export const duplicateAcademicBatch = mutation({
  args: { token: v.optional(v.string()), batchId: v.id("academicBatches") },
  handler: withScopeAndEvents({ operation: "create", module: "academic", entity: "academicBatches" }, async (ctx, args) => {
    const original = await ctx.db.get(args.batchId);
    if (!original) throw new Error("Academic batch not found");
    const allItems = await ctx.db.query("academicBatches").collect();
    const maxSeq = allItems.reduce((max: any, b: any) => Math.max(max, b.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("academicBatches", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
      programId: original.programId,
      batchTypeId: original.batchTypeId,
      academicSessionId: original.academicSessionId,
      capacity: original.capacity,
      minStrength: original.minStrength,
      maxStrength: original.maxStrength,
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
  }),
});

export const reorderAcademicBatches = mutation({
  args: { token: v.optional(v.string()),
    batchIds: v.array(v.id("academicBatches")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "academicBatches" }, async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.batchIds.length; i++) {
      await ctx.db.patch(args.batchIds[i], { sequence: i + 1, updatedAt: now });
    }
  }),
});

export const seedDefaultAcademicBatches = mutation({
  args: { token: v.optional(v.string()),},
  handler: withScopeAndEvents({ operation: "create", module: "academic", entity: "academicBatches" }, async (ctx) => {
    const existing = await ctx.db.query("academicBatches").collect();
    if (existing.length > 0) return { seeded: 0, message: "Academic batches already exist" };

    // Look up programs, batch types, and sessions by code
    const programs = await ctx.db.query("academicPrograms").collect();
    const batchTypes = await ctx.db.query("academicBatchTypes").collect();
    const sessions = await ctx.db.query("academicSessions").collect();

    const programByCode: Record<string, typeof programs[0]> = {};
    for (const p of programs) programByCode[p.code] = p;

    const batchTypeByCode: Record<string, typeof batchTypes[0]> = {};
    for (const bt of batchTypes) batchTypeByCode[bt.code] = bt;

    const sessionByCode: Record<string, typeof sessions[0]> = {};
    for (const s of sessions) sessionByCode[s.code] = s;

    const now = Date.now();
    let idx = 0;
    for (const seed of SEED_DATA) {
      const program = programByCode[seed.programCode];
      const batchType = batchTypeByCode[seed.batchTypeCode];
      const session = sessionByCode[seed.sessionCode];
      if (!program || !batchType || !session) continue;
      idx++;
      await ctx.db.insert("academicBatches", {
        name: seed.name,
        code: seed.code,
        programId: program._id,
        batchTypeId: batchType._id,
        academicSessionId: session._id,
        capacity: seed.capacity,
        minStrength: seed.minStrength,
        maxStrength: seed.maxStrength,
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
    return { seeded: idx, message: "Default academic batches created" };
  }),
});
