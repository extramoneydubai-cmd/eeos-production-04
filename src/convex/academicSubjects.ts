import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

export const CATEGORIES = [
  "Science",
  "Commerce",
  "Arts",
  "Languages",
  "Competitive",
  "Professional",
  "Corporate",
  "General",
] as const;

export const SUBJECT_TYPES = [
  "Core",
  "Elective",
  "Optional",
  "Skill",
  "Lab",
  "Workshop",
] as const;

const SEED_DATA: Array<{
  name: string;
  code: string;
  category: string;
  subjectType: string;
  isTheory: boolean;
  isPractical: boolean;
  color: string;
  icon: string;
  description: string;
}> = [
  // ── Science ──
  { name: "Physics", code: "PHYSICS", category: "Science", subjectType: "Core", isTheory: true, isPractical: true, color: "#4285f4", icon: "Atom", description: "Study of matter, energy, and fundamental forces." },
  { name: "Chemistry", code: "CHEMISTRY", category: "Science", subjectType: "Core", isTheory: true, isPractical: true, color: "#34a853", icon: "FlaskConical", description: "Study of substances, their properties and reactions." },
  { name: "Biology", code: "BIOLOGY", category: "Science", subjectType: "Core", isTheory: true, isPractical: true, color: "#ea4335", icon: "HeartPulse", description: "Study of living organisms and life processes." },
  { name: "Mathematics", code: "MATHS", category: "Science", subjectType: "Core", isTheory: true, isPractical: false, color: "#fbbc04", icon: "Calculator", description: "Study of numbers, quantities, shapes and patterns." },
  { name: "Computer Science", code: "CS", category: "Science", subjectType: "Core", isTheory: true, isPractical: true, color: "#a855f7", icon: "Monitor", description: "Study of computation, algorithms and programming." },

  // ── Commerce ──
  { name: "Accountancy", code: "ACCOUNTANCY", category: "Commerce", subjectType: "Core", isTheory: true, isPractical: false, color: "#e8710a", icon: "Calculator", description: "Principles and practices of financial accounting." },
  { name: "Economics", code: "ECONOMICS", category: "Commerce", subjectType: "Core", isTheory: true, isPractical: false, color: "#06b6d4", icon: "TrendingUp", description: "Study of production, consumption and transfer of wealth." },
  { name: "Business Studies", code: "BUSINESS_STUDIES", category: "Commerce", subjectType: "Core", isTheory: true, isPractical: false, color: "#0d9488", icon: "Building2", description: "Study of business organisation and management principles." },
  { name: "Statistics", code: "STATISTICS", category: "Commerce", subjectType: "Elective", isTheory: true, isPractical: true, color: "#4f46e5", icon: "BarChart3", description: "Collection, analysis and interpretation of data." },

  // ── Arts ──
  { name: "History", code: "HISTORY", category: "Arts", subjectType: "Core", isTheory: true, isPractical: false, color: "#f43f5e", icon: "Landmark", description: "Study of past events, civilizations and historical developments." },
  { name: "Political Science", code: "POLITICAL_SCIENCE", category: "Arts", subjectType: "Core", isTheory: true, isPractical: false, color: "#10b981", icon: "Scale", description: "Study of political systems, governance and public policy." },
  { name: "Geography", code: "GEOGRAPHY", category: "Arts", subjectType: "Core", isTheory: true, isPractical: false, color: "#4285f4", icon: "Globe", description: "Study of Earth's landscapes, environments and human interactions." },
  { name: "Psychology", code: "PSYCHOLOGY", category: "Arts", subjectType: "Elective", isTheory: true, isPractical: false, color: "#a855f7", icon: "Brain", description: "Study of mind, behaviour and mental processes." },

  // ── Languages ──
  { name: "English", code: "ENGLISH", category: "Languages", subjectType: "Core", isTheory: true, isPractical: false, color: "#4285f4", icon: "BookOpen", description: "English language, literature and communication." },
  { name: "Hindi", code: "HINDI", category: "Languages", subjectType: "Core", isTheory: true, isPractical: false, color: "#ea4335", icon: "BookOpen", description: "Hindi language, literature and composition." },
  { name: "Arabic", code: "ARABIC", category: "Languages", subjectType: "Elective", isTheory: true, isPractical: false, color: "#34a853", icon: "Globe", description: "Arabic language, grammar and conversation." },
  { name: "French", code: "FRENCH", category: "Languages", subjectType: "Elective", isTheory: true, isPractical: false, color: "#a855f7", icon: "Globe", description: "French language, literature and cultural studies." },

  // ── Competitive ──
  { name: "Logical Reasoning", code: "LOGICAL_REASONING", category: "Competitive", subjectType: "Skill", isTheory: true, isPractical: false, color: "#e8710a", icon: "Brain", description: "Analytical and logical reasoning for competitive exams." },
  { name: "Quantitative Aptitude", code: "QUANT_APTITUDE", category: "Competitive", subjectType: "Skill", isTheory: true, isPractical: false, color: "#06b6d4", icon: "Calculator", description: "Numerical ability and quantitative problem solving." },
  { name: "General Knowledge", code: "GK", category: "Competitive", subjectType: "Skill", isTheory: true, isPractical: false, color: "#0d9488", icon: "FileText", description: "Current events, static GK and general awareness." },
  { name: "Current Affairs", code: "CURRENT_AFFAIRS", category: "Competitive", subjectType: "Skill", isTheory: true, isPractical: false, color: "#4f46e5", icon: "Newspaper", description: "Weekly and monthly current affairs coverage." },

  // ── Professional ──
  { name: "Python Programming", code: "PYTHON", category: "Professional", subjectType: "Skill", isTheory: true, isPractical: true, color: "#4285f4", icon: "Code", description: "Python programming from basics to advanced applications." },
  { name: "Java Programming", code: "JAVA", category: "Professional", subjectType: "Skill", isTheory: true, isPractical: true, color: "#ea4335", icon: "Cpu", description: "Core Java, OOP and enterprise application development." },
  { name: "Digital Marketing", code: "DIGITAL_MARKETING", category: "Professional", subjectType: "Skill", isTheory: true, isPractical: true, color: "#34a853", icon: "Monitor", description: "SEO, SEM, social media and content marketing." },
  { name: "Excel", code: "EXCEL", category: "Professional", subjectType: "Skill", isTheory: true, isPractical: true, color: "#10b981", icon: "FileSpreadsheet", description: "Microsoft Excel from fundamentals to advanced analytics." },
  { name: "Accounting", code: "ACCOUNTING", category: "Professional", subjectType: "Skill", isTheory: true, isPractical: true, color: "#a855f7", icon: "Calculator", description: "Practical accounting, Tally, GST and taxation." },

  // ── Corporate ──
  { name: "Leadership", code: "LEADERSHIP", category: "Corporate", subjectType: "Workshop", isTheory: true, isPractical: true, color: "#e8710a", icon: "Crown", description: "Leadership skills, team management and decision making." },
  { name: "Communication", code: "COMMUNICATION", category: "Corporate", subjectType: "Workshop", isTheory: true, isPractical: true, color: "#06b6d4", icon: "Headphones", description: "Business communication, presentation and interpersonal skills." },
  { name: "Sales", code: "SALES", category: "Corporate", subjectType: "Workshop", isTheory: true, isPractical: true, color: "#0d9488", icon: "TrendingUp", description: "Sales techniques, negotiation and client management." },
  { name: "Customer Service", code: "CUSTOMER_SERVICE", category: "Corporate", subjectType: "Workshop", isTheory: true, isPractical: true, color: "#4f46e5", icon: "Users", description: "Customer service excellence, support and complaint handling." },
];

export const listAcademicSubjects = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("academicSubjects").collect();
    return items.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

export const getAcademicSubject = query({
  args: { subjectId: v.id("academicSubjects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.subjectId);
  },
});

export const createAcademicSubject = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    category: v.string(),
    subjectType: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    isTheory: v.boolean(),
    isPractical: v.boolean(),
    isActive: v.boolean(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "academic", entity: "academicSubjects" }, async (ctx, args) => {
    const allItems = await ctx.db.query("academicSubjects").collect();
    const maxSeq = allItems.reduce((max: any, s: any) => Math.max(max, s.displayOrder), 0);
    const now = Date.now();
    return await ctx.db.insert("academicSubjects", {
      name: args.name,
      code: args.code,
      category: args.category,
      subjectType: args.subjectType,
      description: args.description,
      color: args.color,
      icon: args.icon,
      isTheory: args.isTheory,
      isPractical: args.isPractical,
      displayOrder: maxSeq + 1,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const updateAcademicSubject = mutation({
  args: { token: v.optional(v.string()),
    subjectId: v.id("academicSubjects"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    category: v.optional(v.string()),
    subjectType: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    isTheory: v.optional(v.boolean()),
    isPractical: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "academicSubjects" }, async (ctx, args) => {
    const { token: _token, subjectId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(subjectId, updates);
  }),
});

export const deleteAcademicSubject = mutation({
  args: { token: v.optional(v.string()), subjectId: v.id("academicSubjects") },
  handler: withScopeAndEvents({ operation: "delete", module: "academic", entity: "academicSubjects" }, async (ctx, args) => {
    await ctx.db.delete(args.subjectId);
  }),
});

export const duplicateAcademicSubject = mutation({
  args: { token: v.optional(v.string()), subjectId: v.id("academicSubjects") },
  handler: withScopeAndEvents({ operation: "create", module: "academic", entity: "academicSubjects" }, async (ctx, args) => {
    const original = await ctx.db.get(args.subjectId);
    if (!original) throw new Error("Academic subject not found");
    const allItems = await ctx.db.query("academicSubjects").collect();
    const maxSeq = allItems.reduce((max: any, s: any) => Math.max(max, s.displayOrder), 0);
    const now = Date.now();
    await ctx.db.insert("academicSubjects", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
      category: original.category,
      subjectType: original.subjectType,
      description: original.description,
      color: original.color,
      icon: original.icon,
      isTheory: original.isTheory,
      isPractical: original.isPractical,
      displayOrder: maxSeq + 1,
      isActive: false,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const reorderAcademicSubjects = mutation({
  args: { token: v.optional(v.string()),
    subjectIds: v.array(v.id("academicSubjects")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "academic", entity: "academicSubjects" }, async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.subjectIds.length; i++) {
      await ctx.db.patch(args.subjectIds[i], { displayOrder: i + 1, updatedAt: now });
    }
  }),
});

export const seedDefaultAcademicSubjects = mutation({
  args: { token: v.optional(v.string()),},
  handler: withScopeAndEvents({ operation: "create", module: "academic", entity: "academicSubjects" }, async (ctx) => {
    const existing = await ctx.db.query("academicSubjects").collect();
    if (existing.length > 0) return { seeded: 0, message: "Academic subjects already exist" };

    const now = Date.now();
    for (let i = 0; i < SEED_DATA.length; i++) {
      const seed = SEED_DATA[i];
      await ctx.db.insert("academicSubjects", {
        name: seed.name,
        code: seed.code,
        category: seed.category,
        subjectType: seed.subjectType,
        description: seed.description,
        color: seed.color,
        icon: seed.icon,
        isTheory: seed.isTheory,
        isPractical: seed.isPractical,
        displayOrder: i + 1,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: SEED_DATA.length, message: "Default academic subjects created" };
  }),
});
