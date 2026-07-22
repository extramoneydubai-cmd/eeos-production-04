import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const EDUCATION_LEVELS = [
  "Secondary",
  "Higher Secondary",
  "Undergraduate",
  "Postgraduate",
  "Doctorate",
  "Diploma",
  "Certificate",
  "General",
] as const;

const SEED_DATA: Array<{
  name: string;
  code: string;
  educationLevel: string;
  color: string;
  icon: string;
  description: string;
}> = [
  { name: "Science", code: "SCIENCE", educationLevel: "Higher Secondary", color: "#1a73e8", icon: "FlaskConical", description: "Core science stream covering Physics, Chemistry, and Biology." },
  { name: "Commerce", code: "COMMERCE", educationLevel: "Higher Secondary", color: "#34a853", icon: "BarChart3", description: "Commerce stream covering Accountancy, Economics, and Business Studies." },
  { name: "Arts", code: "ARTS", educationLevel: "Higher Secondary", color: "#a855f7", icon: "Palette", description: "Arts stream covering Humanities, Social Sciences, and Creative Arts." },
  { name: "Humanities", code: "HUMANITIES", educationLevel: "Undergraduate", color: "#f59e0b", icon: "BookOpen", description: "Humanities specialization at undergraduate level." },
  { name: "Medical", code: "MEDICAL", educationLevel: "Undergraduate", color: "#ea4335", icon: "HeartPulse", description: "Medical and healthcare specialization path." },
  { name: "Non Medical", code: "NON_MEDICAL", educationLevel: "Higher Secondary", color: "#4285f4", icon: "Microscope", description: "Non-medical science stream with Mathematics and Computer Science focus." },
  { name: "Computer Science", code: "CS", educationLevel: "Undergraduate", color: "#4f46e5", icon: "Monitor", description: "Computer Science and IT specialization path." },
  { name: "Business", code: "BUSINESS", educationLevel: "Undergraduate", color: "#0d9488", icon: "Briefcase", description: "Business administration and management path." },
  { name: "Management", code: "MANAGEMENT", educationLevel: "Postgraduate", color: "#06b6d4", icon: "Users", description: "Postgraduate management and leadership path." },
  { name: "Engineering", code: "ENGINEERING", educationLevel: "Undergraduate", color: "#e8710a", icon: "Wrench", description: "Engineering and technology specialization path." },
  { name: "Law", code: "LAW", educationLevel: "Undergraduate", color: "#5f6368", icon: "Scale", description: "Legal studies and law specialization path." },
  { name: "Design", code: "DESIGN", educationLevel: "Undergraduate", color: "#f43f5e", icon: "Paintbrush", description: "Design, visual arts, and creative specialization path." },
  { name: "General", code: "GENERAL", educationLevel: "General", color: "#9aa0a6", icon: "Layers", description: "General stream for multi-disciplinary or flexible curriculum." },
];

export const listAcademicStreams = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("academicStreams").collect();
    return items.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getAcademicStream = query({
  args: { streamId: v.id("academicStreams") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.streamId);
  },
});

export const createAcademicStream = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    educationLevel: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const allItems = await ctx.db.query("academicStreams").collect();
    const maxSeq = allItems.reduce((max, s) => Math.max(max, s.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("academicStreams", {
      name: args.name,
      code: args.code,
      educationLevel: args.educationLevel,
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

export const updateAcademicStream = mutation({
  args: {
    streamId: v.id("academicStreams"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    educationLevel: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { streamId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(streamId, updates);
  },
});

export const deleteAcademicStream = mutation({
  args: { streamId: v.id("academicStreams") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.streamId);
  },
});

export const duplicateAcademicStream = mutation({
  args: { streamId: v.id("academicStreams") },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.streamId);
    if (!original) throw new Error("Academic stream not found");
    const allItems = await ctx.db.query("academicStreams").collect();
    const maxSeq = allItems.reduce((max, s) => Math.max(max, s.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("academicStreams", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
      educationLevel: original.educationLevel,
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

export const reorderAcademicStreams = mutation({
  args: {
    streamIds: v.array(v.id("academicStreams")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.streamIds.length; i++) {
      await ctx.db.patch(args.streamIds[i], { sequence: i + 1, updatedAt: now });
    }
  },
});

export const seedDefaultAcademicStreams = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("academicStreams").collect();
    if (existing.length > 0) return { seeded: 0, message: "Academic streams already exist" };

    const now = Date.now();
    for (let i = 0; i < SEED_DATA.length; i++) {
      const seed = SEED_DATA[i];
      await ctx.db.insert("academicStreams", {
        name: seed.name,
        code: seed.code,
        educationLevel: seed.educationLevel,
        description: seed.description,
        color: seed.color,
        icon: seed.icon,
        sequence: i + 1,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: SEED_DATA.length, message: "Default academic streams created" };
  },
});
