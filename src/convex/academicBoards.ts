import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

const DEFAULT_BOARDS = [
  {
    name: "CBSE",
    code: "CBSE",
    shortName: "CBSE",
    country: "India",
    educationLevel: "Higher Secondary",
    website: "https://www.cbse.gov.in",
    color: "#4285f4",
    icon: "GraduationCap",
    description: "Central Board of Secondary Education — India's national board for classes 10 and 12.",
  },
  {
    name: "ICSE",
    code: "ICSE",
    shortName: "ICSE",
    country: "India",
    educationLevel: "Higher Secondary",
    website: "https://www.cisce.org",
    color: "#34a853",
    icon: "BookOpen",
    description: "Indian Certificate of Secondary Education — CISCE national curriculum.",
  },
  {
    name: "State Board",
    code: "STATE",
    shortName: "State Board",
    country: "India",
    educationLevel: "Higher Secondary",
    website: "",
    color: "#fbbc04",
    icon: "Landmark",
    description: "State-level education boards — varies by state (Maharashtra, Karnataka, Tamil Nadu, etc.).",
  },
  {
    name: "International Baccalaureate",
    code: "IB",
    shortName: "IB",
    country: "International",
    educationLevel: "School",
    website: "https://www.ibo.org",
    color: "#ea4335",
    icon: "Globe",
    description: "International Baccalaureate — globally recognised diploma programme.",
  },
  {
    name: "IGCSE",
    code: "IGCSE",
    shortName: "IGCSE",
    country: "International",
    educationLevel: "School",
    website: "https://www.cambridgeinternational.org",
    color: "#a855f7",
    icon: "Globe2",
    description: "International General Certificate of Secondary Education — Cambridge assessment.",
  },
  {
    name: "NIOS",
    code: "NIOS",
    shortName: "NIOS",
    country: "India",
    educationLevel: "Higher Secondary",
    website: "https://www.nios.ac.in",
    color: "#e8710a",
    icon: "BookOpenText",
    description: "National Institute of Open Schooling — open and distance learning board.",
  },
  {
    name: "Cambridge International",
    code: "CAIE",
    shortName: "Cambridge",
    country: "International",
    educationLevel: "School",
    website: "https://www.cambridgeinternational.org",
    color: "#06b6d4",
    icon: "University",
    description: "Cambridge Assessment International Education — pre-University qualifications.",
  },
  {
    name: "Open School",
    code: "OPEN",
    shortName: "Open School",
    country: "International",
    educationLevel: "School",
    website: "",
    color: "#0d9488",
    icon: "DoorOpen",
    description: "Open schooling systems enabling flexible, accelerated, and correspondence education.",
  },
  {
    name: "University",
    code: "UNIV",
    shortName: "University",
    country: "International",
    educationLevel: "University",
    website: "",
    color: "#1a1a2e",
    icon: "Library",
    description: "University-level programmes including undergraduate and postgraduate degrees.",
  },
  {
    name: "Professional Certification",
    code: "PROF",
    shortName: "Professional",
    country: "International",
    educationLevel: "Professional",
    website: "",
    color: "#f43f5e",
    icon: "Award",
    description: "Professional certification programmes — ACCA, CFA, PMP, CMA, and industry credentials.",
  },
];

export const listAcademicBoards = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("academicBoards").collect();
    return items.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

export const getAcademicBoard = query({
  args: { boardId: v.id("academicBoards") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.boardId);
  },
});

export const createAcademicBoard = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    shortName: v.string(),
    color: v.string(),
    icon: v.string(),
    country: v.string(),
    educationLevel: v.string(),
    website: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "academic", entity: "academicBoards" }, async (ctx, args) => {
    const allItems = await ctx.db.query("academicBoards").collect();
    const maxSeq = allItems.reduce((max: any, b: any) => Math.max(max, b.displayOrder), 0);
    const now = Date.now();
    return await ctx.db.insert("academicBoards", {
      name: args.name,
      code: args.code,
      shortName: args.shortName,
      color: args.color,
      icon: args.icon,
      country: args.country,
      educationLevel: args.educationLevel,
      website: args.website,
      description: args.description,
      displayOrder: maxSeq + 1,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const updateAcademicBoard = mutation({
  args: { token: v.optional(v.string()),
    boardId: v.id("academicBoards"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    shortName: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    country: v.optional(v.string()),
    educationLevel: v.optional(v.string()),
    website: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "academicBoards" }, async (ctx, args) => {
    const { token: _token, boardId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(boardId, updates);
  }),
});

export const deleteAcademicBoard = mutation({
  args: { token: v.optional(v.string()), boardId: v.id("academicBoards") },
  handler: withScopeAndEvents({ operation: "delete", module: "academic", entity: "academicBoards" }, async (ctx, args) => {
    await ctx.db.delete(args.boardId);
  }),
});

export const duplicateAcademicBoard = mutation({
  args: { token: v.optional(v.string()), boardId: v.id("academicBoards") },
  handler: withScopeAndEvents({ operation: "create", module: "academic", entity: "academicBoards" }, async (ctx, args) => {
    const original = await ctx.db.get(args.boardId);
    if (!original) throw new Error("Academic board not found");
    const allItems = await ctx.db.query("academicBoards").collect();
    const maxSeq = allItems.reduce((max: any, b: any) => Math.max(max, b.displayOrder), 0);
    const now = Date.now();
    await ctx.db.insert("academicBoards", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
      shortName: original.shortName,
      color: original.color,
      icon: original.icon,
      country: original.country,
      educationLevel: original.educationLevel,
      website: original.website,
      description: original.description,
      displayOrder: maxSeq + 1,
      isActive: false,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const reorderAcademicBoards = mutation({
  args: { token: v.optional(v.string()),
    boardIds: v.array(v.id("academicBoards")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "academicBoards" }, async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.boardIds.length; i++) {
      await ctx.db.patch(args.boardIds[i], { displayOrder: i + 1, updatedAt: now });
    }
  }),
});

export const seedDefaultAcademicBoards = mutation({
  args: { token: v.optional(v.string()),},
  handler: withScopeAndEvents({ operation: "create", module: "academic", entity: "academicBoards" }, async (ctx) => {
    const existing = await ctx.db.query("academicBoards").collect();
    if (existing.length > 0) return { seeded: 0, message: "Academic boards already exist" };

    const now = Date.now();
    for (let i = 0; i < DEFAULT_BOARDS.length; i++) {
      const item = DEFAULT_BOARDS[i];
      await ctx.db.insert("academicBoards", {
        ...item,
        description: item.description,
        displayOrder: i + 1,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: DEFAULT_BOARDS.length, message: "Default academic boards created" };
  }),
});
