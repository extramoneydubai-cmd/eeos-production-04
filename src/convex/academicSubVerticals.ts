import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const SEED_DATA: Array<{
  verticalCode: string;
  name: string;
  code: string;
  color: string;
  icon: string;
  description: string;
}> = [
  // Competitive Exams
  { verticalCode: "COMPETITIVE", name: "JEE", code: "JEE", color: "#4285f4", icon: "Brain", description: "Joint Entrance Examination for engineering programmes." },
  { verticalCode: "COMPETITIVE", name: "NEET", code: "NEET", color: "#34a853", icon: "HeartPulse", description: "National Eligibility cum Entrance Test for medical programmes." },
  { verticalCode: "COMPETITIVE", name: "CUET", code: "CUET", color: "#ea4335", icon: "BookOpen", description: "Common University Entrance Test for undergraduate admissions." },
  { verticalCode: "COMPETITIVE", name: "CLAT", code: "CLAT", color: "#fbbc04", icon: "Scale", description: "Common Law Admission Test for law programmes." },
  { verticalCode: "COMPETITIVE", name: "CA", code: "CA", color: "#a855f7", icon: "Calculator", description: "Chartered Accountancy examination." },
  { verticalCode: "COMPETITIVE", name: "CMA", code: "CMA", color: "#e8710a", icon: "ChartNoAxesColumnIncreasing", description: "Certified Management Accountant examination." },
  { verticalCode: "COMPETITIVE", name: "CS", code: "CS", color: "#06b6d4", icon: "FileText", description: "Company Secretary examination." },
  { verticalCode: "COMPETITIVE", name: "UPSC", code: "UPSC", color: "#0d9488", icon: "Landmark", description: "Union Public Service Commission civil services examination." },
  { verticalCode: "COMPETITIVE", name: "SSC", code: "SSC", color: "#f43f5e", icon: "Users", description: "Staff Selection Commission examinations." },
  { verticalCode: "COMPETITIVE", name: "Banking", code: "BANKING", color: "#4f46e5", icon: "Building2", description: "Banking sector competitive examinations (IBPS, SBI, RBI)." },
  { verticalCode: "COMPETITIVE", name: "Railways", code: "RAILWAYS", color: "#10b981", icon: "Train", description: "Railway recruitment board examinations." },

  // School Education
  { verticalCode: "SCHOOL", name: "CBSE", code: "CBSE", color: "#4285f4", icon: "School", description: "Central Board of Secondary Education curriculum." },
  { verticalCode: "SCHOOL", name: "ICSE", code: "ICSE", color: "#34a853", icon: "BookOpen", description: "Indian Certificate of Secondary Education curriculum." },
  { verticalCode: "SCHOOL", name: "State Board", code: "STATE_BOARD", color: "#ea4335", icon: "Landmark", description: "State-level education board curriculum." },
  { verticalCode: "SCHOOL", name: "IB", code: "IB", color: "#a855f7", icon: "Globe", description: "International Baccalaureate curriculum." },
  { verticalCode: "SCHOOL", name: "IGCSE", code: "IGCSE", color: "#fbbc04", icon: "GraduationCap", description: "International General Certificate of Secondary Education." },

  // College Education
  { verticalCode: "COLLEGE", name: "Engineering", code: "ENGINEERING", color: "#4285f4", icon: "Cpu", description: "Bachelor's and Master's degree programmes in engineering." },
  { verticalCode: "COLLEGE", name: "Medical", code: "MEDICAL", color: "#34a853", icon: "Stethoscope", description: "MBBS, BDS, nursing and allied medical science programmes." },
  { verticalCode: "COLLEGE", name: "Commerce", code: "COMMERCE", color: "#ea4335", icon: "BarChart3", description: "BCom, MCom, BBA and other commerce programmes." },
  { verticalCode: "COLLEGE", name: "Arts", code: "ARTS", color: "#a855f7", icon: "Palette", description: "BA, MA, BFA and other liberal arts programmes." },
  { verticalCode: "COLLEGE", name: "Science", code: "SCIENCE", color: "#fbbc04", icon: "FlaskConical", description: "BSc, MSc and other pure and applied science programmes." },

  // Professional Courses
  { verticalCode: "PROFESSIONAL", name: "Digital Marketing", code: "DIGITAL_MARKETING", color: "#4285f4", icon: "Monitor", description: "Digital marketing certification and diploma programmes." },
  { verticalCode: "PROFESSIONAL", name: "Programming", code: "PROGRAMMING", color: "#34a853", icon: "Code", description: "Full-stack, backend, frontend and mobile development programmes." },
  { verticalCode: "PROFESSIONAL", name: "AI", code: "AI", color: "#ea4335", icon: "Bot", description: "Artificial intelligence, ML and data science programmes." },
  { verticalCode: "PROFESSIONAL", name: "Accounting", code: "ACCOUNTING", color: "#a855f7", icon: "Calculator", description: "Practical accounting, Tally, GST and taxation programmes." },
  { verticalCode: "PROFESSIONAL", name: "Tally", code: "TALLY", color: "#fbbc04", icon: "FileSpreadsheet", description: "Tally ERP certification and accounting software training." },

  // Corporate Training
  { verticalCode: "CORPORATE", name: "HR Training", code: "HR_TRAINING", color: "#4285f4", icon: "Users", description: "Human resources management, recruitment and payroll training." },
  { verticalCode: "CORPORATE", name: "Leadership", code: "LEADERSHIP", color: "#34a853", icon: "Crown", description: "Executive leadership and management development programmes." },
  { verticalCode: "CORPORATE", name: "Sales", code: "SALES", color: "#ea4335", icon: "TrendingUp", description: "Sales enablement, negotiation and account management training." },
  { verticalCode: "CORPORATE", name: "Customer Service", code: "CUSTOMER_SERVICE", color: "#a855f7", icon: "Headphones", description: "Customer service excellence and support skills training." },
];

export const listAcademicSubVerticals = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("academicSubVerticals").collect();
    return items.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

export const getAcademicSubVertical = query({
  args: { subVerticalId: v.id("academicSubVerticals") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.subVerticalId);
  },
});

export const createAcademicSubVertical = mutation({
  args: {
    verticalId: v.id("academicVerticals"),
    name: v.string(),
    code: v.string(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const allItems = await ctx.db.query("academicSubVerticals").collect();
    const maxSeq = allItems.reduce((max, s) => Math.max(max, s.displayOrder), 0);
    const now = Date.now();
    return await ctx.db.insert("academicSubVerticals", {
      verticalId: args.verticalId,
      name: args.name,
      code: args.code,
      color: args.color,
      icon: args.icon,
      description: args.description,
      displayOrder: maxSeq + 1,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateAcademicSubVertical = mutation({
  args: {
    subVerticalId: v.id("academicSubVerticals"),
    verticalId: v.optional(v.id("academicVerticals")),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { subVerticalId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(subVerticalId, updates);
  },
});

export const deleteAcademicSubVertical = mutation({
  args: { subVerticalId: v.id("academicSubVerticals") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.subVerticalId);
  },
});

export const duplicateAcademicSubVertical = mutation({
  args: { subVerticalId: v.id("academicSubVerticals") },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.subVerticalId);
    if (!original) throw new Error("Academic sub-vertical not found");
    const allItems = await ctx.db.query("academicSubVerticals").collect();
    const maxSeq = allItems.reduce((max, s) => Math.max(max, s.displayOrder), 0);
    const now = Date.now();
    await ctx.db.insert("academicSubVerticals", {
      verticalId: original.verticalId,
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
      color: original.color,
      icon: original.icon,
      description: original.description,
      displayOrder: maxSeq + 1,
      isActive: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const reorderAcademicSubVerticals = mutation({
  args: {
    subVerticalIds: v.array(v.id("academicSubVerticals")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.subVerticalIds.length; i++) {
      await ctx.db.patch(args.subVerticalIds[i], { displayOrder: i + 1, updatedAt: now });
    }
  },
});

export const seedDefaultAcademicSubVerticals = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("academicSubVerticals").collect();
    if (existing.length > 0) return { seeded: 0, message: "Academic sub-verticals already exist" };

    // Look up verticals by code
    const verticals = await ctx.db.query("academicVerticals").collect();
    const verticalByCode: Record<string, typeof verticals[0]> = {};
    for (const v of verticals) {
      verticalByCode[v.code] = v;
    }

    const now = Date.now();
    let idx = 0;
    for (const seed of SEED_DATA) {
      const vertical = verticalByCode[seed.verticalCode];
      if (!vertical) continue;
      idx++;
      await ctx.db.insert("academicSubVerticals", {
        verticalId: vertical._id,
        name: seed.name,
        code: seed.code,
        color: seed.color,
        icon: seed.icon,
        description: seed.description,
        displayOrder: idx,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: idx, message: "Default academic sub-verticals created" };
  },
});
