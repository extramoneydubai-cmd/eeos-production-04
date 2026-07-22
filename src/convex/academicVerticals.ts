import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DEFAULT_VERTICALS = [
  {
    name: "School Education",
    code: "SCHOOL",
    color: "#4285f4",
    icon: "School",
    educationCategory: "School",
    description: "Academic vertical covering primary and secondary school curricula across all boards.",
    minimumAge: 5,
    maximumAge: 18,
  },
  {
    name: "College Education",
    code: "COLLEGE",
    color: "#34a853",
    icon: "University",
    educationCategory: "College",
    description: "Undergraduate and postgraduate college degree programmes across disciplines.",
    minimumAge: 17,
    maximumAge: 30,
  },
  {
    name: "Competitive Exams",
    code: "COMPETITIVE",
    color: "#ea4335",
    icon: "Award",
    educationCategory: "Competitive",
    description: "Coaching and preparation for competitive entrance examinations (JEE, NEET, UPSC, etc.).",
    minimumAge: 15,
    maximumAge: 35,
  },
  {
    name: "Professional Courses",
    code: "PROFESSIONAL",
    color: "#fbbc04",
    icon: "Briefcase",
    educationCategory: "Professional",
    description: "Professional certification and career-oriented programmes (ACCA, CFA, CMA, PMP).",
    minimumAge: 18,
    maximumAge: 60,
  },
  {
    name: "Skill Development",
    code: "SKILL",
    color: "#a855f7",
    icon: "Zap",
    educationCategory: "Professional",
    description: "Vocational and employability skill programmes — communication, digital literacy, soft skills.",
    minimumAge: 14,
    maximumAge: 60,
  },
  {
    name: "Corporate Training",
    code: "CORPORATE",
    color: "#e8710a",
    icon: "Building2",
    educationCategory: "Corporate",
    description: "Bespoke corporate training and executive development programmes for organisations.",
    minimumAge: 20,
    maximumAge: 65,
  },
  {
    name: "Online Learning",
    code: "ONLINE",
    color: "#06b6d4",
    icon: "Monitor",
    educationCategory: "Online",
    description: "Digital and remote learning vertical — MOOCs, live virtual classrooms, and hybrid programmes.",
    minimumAge: 5,
    maximumAge: 80,
  },
  {
    name: "Distance Education",
    code: "DISTANCE",
    color: "#0d9488",
    icon: "Globe",
    educationCategory: "Online",
    description: "Correspondence and distance learning programmes with flexible scheduling and study materials.",
    minimumAge: 16,
    maximumAge: 70,
  },
];

export const listAcademicVerticals = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("academicVerticals").collect();
    return items.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

export const getAcademicVertical = query({
  args: { verticalId: v.id("academicVerticals") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.verticalId);
  },
});

export const createAcademicVertical = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    color: v.string(),
    icon: v.string(),
    educationCategory: v.string(),
    description: v.optional(v.string()),
    minimumAge: v.optional(v.number()),
    maximumAge: v.optional(v.number()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const allItems = await ctx.db.query("academicVerticals").collect();
    const maxSeq = allItems.reduce((max, v) => Math.max(max, v.displayOrder), 0);
    const now = Date.now();
    return await ctx.db.insert("academicVerticals", {
      name: args.name,
      code: args.code,
      color: args.color,
      icon: args.icon,
      educationCategory: args.educationCategory,
      description: args.description,
      minimumAge: args.minimumAge,
      maximumAge: args.maximumAge,
      displayOrder: maxSeq + 1,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateAcademicVertical = mutation({
  args: {
    verticalId: v.id("academicVerticals"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    educationCategory: v.optional(v.string()),
    description: v.optional(v.string()),
    minimumAge: v.optional(v.number()),
    maximumAge: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { verticalId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(verticalId, updates);
  },
});

export const deleteAcademicVertical = mutation({
  args: { verticalId: v.id("academicVerticals") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.verticalId);
  },
});

export const duplicateAcademicVertical = mutation({
  args: { verticalId: v.id("academicVerticals") },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.verticalId);
    if (!original) throw new Error("Academic vertical not found");
    const allItems = await ctx.db.query("academicVerticals").collect();
    const maxSeq = allItems.reduce((max, v) => Math.max(max, v.displayOrder), 0);
    const now = Date.now();
    await ctx.db.insert("academicVerticals", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
      color: original.color,
      icon: original.icon,
      educationCategory: original.educationCategory,
      description: original.description,
      minimumAge: original.minimumAge,
      maximumAge: original.maximumAge,
      displayOrder: maxSeq + 1,
      isActive: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const reorderAcademicVerticals = mutation({
  args: {
    verticalIds: v.array(v.id("academicVerticals")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.verticalIds.length; i++) {
      await ctx.db.patch(args.verticalIds[i], { displayOrder: i + 1, updatedAt: now });
    }
  },
});

export const seedDefaultAcademicVerticals = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("academicVerticals").collect();
    if (existing.length > 0) return { seeded: 0, message: "Academic verticals already exist" };

    const now = Date.now();
    for (let i = 0; i < DEFAULT_VERTICALS.length; i++) {
      const item = DEFAULT_VERTICALS[i];
      await ctx.db.insert("academicVerticals", {
        ...item,
        description: item.description,
        displayOrder: i + 1,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: DEFAULT_VERTICALS.length, message: "Default academic verticals created" };
  },
});
