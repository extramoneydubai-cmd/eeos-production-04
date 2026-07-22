import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const PROGRAM_TYPES = [
  "Regular",
  "Foundation",
  "Crash",
  "Weekend",
  "Online",
  "Hybrid",
  "Corporate",
  "Certification",
] as const;

export const DELIVERY_MODES = [
  "Offline",
  "Online",
  "Hybrid",
] as const;

export const DURATION_UNITS = [
  "Days",
  "Weeks",
  "Months",
  "Years",
] as const;

const SEED_DATA: Array<{
  subVerticalCode: string;
  name: string;
  code: string;
  programType: string;
  duration: number;
  durationUnit: string;
  deliveryMode: string;
  color: string;
  icon: string;
  description: string;
}> = [
  // ── Competitive Exams → JEE ──
  { subVerticalCode: "JEE", name: "JEE Foundation (2 Years)", code: "JEE_FOUNDATION", programType: "Foundation", duration: 2, durationUnit: "Years", deliveryMode: "Offline", color: "#4285f4", icon: "Brain", description: "Comprehensive 2-year foundation programme for JEE Main & Advanced." },
  { subVerticalCode: "JEE", name: "JEE Target Batch", code: "JEE_TARGET", programType: "Regular", duration: 1, durationUnit: "Years", deliveryMode: "Offline", color: "#1a73e8", icon: "Target", description: "Intensive one-year target batch for JEE aspirants." },
  { subVerticalCode: "JEE", name: "JEE Crash Course", code: "JEE_CRASH", programType: "Crash", duration: 3, durationUnit: "Months", deliveryMode: "Hybrid", color: "#e8710a", icon: "Zap", description: "Quick revision and test series for last-minute preparation." },

  // ── Competitive Exams → NEET ──
  { subVerticalCode: "NEET", name: "NEET Foundation (2 Years)", code: "NEET_FOUNDATION", programType: "Foundation", duration: 2, durationUnit: "Years", deliveryMode: "Offline", color: "#34a853", icon: "HeartPulse", description: "Comprehensive 2-year foundation programme for NEET UG." },
  { subVerticalCode: "NEET", name: "NEET Target Batch", code: "NEET_TARGET", programType: "Regular", duration: 1, durationUnit: "Years", deliveryMode: "Offline", color: "#0d652d", icon: "Stethoscope", description: "One-year intensive batch for NEET aspirants." },
  { subVerticalCode: "NEET", name: "NEET Crash Course", code: "NEET_CRASH", programType: "Crash", duration: 3, durationUnit: "Months", deliveryMode: "Hybrid", color: "#f43f5e", icon: "Zap", description: "Rapid revision and mock test series for NEET." },

  // ── Competitive Exams → CUET ──
  { subVerticalCode: "CUET", name: "CUET Foundation", code: "CUET_FOUNDATION", programType: "Foundation", duration: 1, durationUnit: "Years", deliveryMode: "Hybrid", color: "#ea4335", icon: "BookOpen", description: "Foundation programme covering all CUET UG domains." },
  { subVerticalCode: "CUET", name: "CUET Crash Course", code: "CUET_CRASH", programType: "Crash", duration: 2, durationUnit: "Months", deliveryMode: "Online", color: "#fbbc04", icon: "Monitor", description: "Online crash course with live classes and mock tests." },

  // ── Competitive Exams → CLAT ──
  { subVerticalCode: "CLAT", name: "CLAT Foundation", code: "CLAT_FOUNDATION", programType: "Foundation", duration: 1, durationUnit: "Years", deliveryMode: "Offline", color: "#a855f7", icon: "Scale", description: "Comprehensive preparation for CLAT and other law entrance exams." },

  // ── Competitive Exams → Banking ──
  { subVerticalCode: "BANKING", name: "Banking Foundation", code: "BANKING_FOUNDATION", programType: "Foundation", duration: 1, durationUnit: "Years", deliveryMode: "Hybrid", color: "#4f46e5", icon: "Building2", description: "Complete preparation for IBPS PO, Clerk, SBI and RBI exams." },
  { subVerticalCode: "BANKING", name: "Banking Weekend Batch", code: "BANKING_WEEKEND", programType: "Weekend", duration: 6, durationUnit: "Months", deliveryMode: "Offline", color: "#06b6d4", icon: "Calendar", description: "Weekend-only batch for working professionals." },

  // ── Competitive Exams → UPSC ──
  { subVerticalCode: "UPSC", name: "UPSC Foundation", code: "UPSC_FOUNDATION", programType: "Foundation", duration: 1, durationUnit: "Years", deliveryMode: "Offline", color: "#0d9488", icon: "Landmark", description: "Comprehensive coverage of UPSC Civil Services Prelims & Mains." },

  // ── School → CBSE ──
  { subVerticalCode: "CBSE", name: "CBSE Class 8", code: "CBSE_CLASS_8", programType: "Regular", duration: 1, durationUnit: "Years", deliveryMode: "Offline", color: "#4285f4", icon: "School", description: "Full academic year programme for CBSE Class 8." },
  { subVerticalCode: "CBSE", name: "CBSE Class 9", code: "CBSE_CLASS_9", programType: "Regular", duration: 1, durationUnit: "Years", deliveryMode: "Offline", color: "#1a73e8", icon: "BookOpen", description: "Full academic year programme for CBSE Class 9." },
  { subVerticalCode: "CBSE", name: "CBSE Class 10", code: "CBSE_CLASS_10", programType: "Regular", duration: 1, durationUnit: "Years", deliveryMode: "Offline", color: "#34a853", icon: "GraduationCap", description: "Full academic year programme for CBSE Class 10 board preparation." },
  { subVerticalCode: "CBSE", name: "CBSE Class 11", code: "CBSE_CLASS_11", programType: "Regular", duration: 1, durationUnit: "Years", deliveryMode: "Offline", color: "#ea4335", icon: "Layers", description: "Full academic year programme for CBSE Class 11." },
  { subVerticalCode: "CBSE", name: "CBSE Class 12", code: "CBSE_CLASS_12", programType: "Regular", duration: 1, durationUnit: "Years", deliveryMode: "Offline", color: "#fbbc04", icon: "Award", description: "Full academic year programme for CBSE Class 12 board preparation." },

  // ── School → ICSE ──
  { subVerticalCode: "ICSE", name: "ICSE Class 9", code: "ICSE_CLASS_9", programType: "Regular", duration: 1, durationUnit: "Years", deliveryMode: "Offline", color: "#34a853", icon: "BookOpen", description: "Full academic year programme for ICSE Class 9." },
  { subVerticalCode: "ICSE", name: "ICSE Class 10", code: "ICSE_CLASS_10", programType: "Regular", duration: 1, durationUnit: "Years", deliveryMode: "Offline", color: "#0d652d", icon: "GraduationCap", description: "Full academic year programme for ICSE Class 10 board preparation." },

  // ── School → State Board ──
  { subVerticalCode: "STATE_BOARD", name: "State Board Class 10", code: "STATE_CLASS_10", programType: "Regular", duration: 1, durationUnit: "Years", deliveryMode: "Offline", color: "#ea4335", icon: "Landmark", description: "Full academic year programme for State Board Class 10." },
  { subVerticalCode: "STATE_BOARD", name: "State Board Class 12", code: "STATE_CLASS_12", programType: "Regular", duration: 1, durationUnit: "Years", deliveryMode: "Offline", color: "#f43f5e", icon: "GraduationCap", description: "Full academic year programme for State Board Class 12." },

  // ── College → Engineering ──
  { subVerticalCode: "ENGINEERING", name: "B.Tech Foundation", code: "BTECH_FOUNDATION", programType: "Foundation", duration: 4, durationUnit: "Years", deliveryMode: "Offline", color: "#4285f4", icon: "Cpu", description: "Four-year B.Tech degree programme across engineering disciplines." },
  { subVerticalCode: "ENGINEERING", name: "M.Tech Specialization", code: "MTECH_SPECIALIZATION", programType: "Regular", duration: 2, durationUnit: "Years", deliveryMode: "Offline", color: "#1a73e8", icon: "Microchip", description: "Postgraduate specialization in computer science, electronics, mechanical and civil." },
  { subVerticalCode: "ENGINEERING", name: "Online B.Tech", code: "BTECH_ONLINE", programType: "Online", duration: 4, durationUnit: "Years", deliveryMode: "Online", color: "#06b6d4", icon: "Monitor", description: "Fully online B.Tech degree with live virtual labs." },

  // ── College → Medical ──
  { subVerticalCode: "MEDICAL", name: "MBBS Foundation", code: "MBBS_FOUNDATION", programType: "Foundation", duration: 5.5, durationUnit: "Years", deliveryMode: "Offline", color: "#34a853", icon: "Stethoscope", description: "MBBS degree programme including internship." },
  { subVerticalCode: "MEDICAL", name: "PG Medical", code: "PG_MEDICAL", programType: "Regular", duration: 3, durationUnit: "Years", deliveryMode: "Offline", color: "#0d652d", icon: "HeartPulse", description: "Postgraduate medical specialization (MD/MS)." },

  // ── College → Commerce ──
  { subVerticalCode: "COMMERCE", name: "B.Com Foundation", code: "BCOM_FOUNDATION", programType: "Foundation", duration: 3, durationUnit: "Years", deliveryMode: "Offline", color: "#ea4335", icon: "BarChart3", description: "Three-year Bachelor of Commerce degree programme." },
  { subVerticalCode: "COMMERCE", name: "BBA Program", code: "BBA_PROGRAM", programType: "Regular", duration: 3, durationUnit: "Years", deliveryMode: "Offline", color: "#fbbc04", icon: "TrendingUp", description: "Bachelor of Business Administration degree." },

  // ── College → Arts ──
  { subVerticalCode: "ARTS", name: "BA Foundation", code: "BA_FOUNDATION", programType: "Foundation", duration: 3, durationUnit: "Years", deliveryMode: "Offline", color: "#a855f7", icon: "Palette", description: "Three-year Bachelor of Arts degree across humanities disciplines." },

  // ── College → Science ──
  { subVerticalCode: "SCIENCE", name: "B.Sc Foundation", code: "BSC_FOUNDATION", programType: "Foundation", duration: 3, durationUnit: "Years", deliveryMode: "Offline", color: "#fbbc04", icon: "FlaskConical", description: "Three-year Bachelor of Science degree programme." },

  // ── Professional → Digital Marketing ──
  { subVerticalCode: "DIGITAL_MARKETING", name: "Beginner Digital Marketing", code: "DM_BEGINNER", programType: "Regular", duration: 3, durationUnit: "Months", deliveryMode: "Online", color: "#4285f4", icon: "Monitor", description: "Foundational digital marketing course covering SEO, SEM and social media." },
  { subVerticalCode: "DIGITAL_MARKETING", name: "Advanced Digital Marketing", code: "DM_ADVANCED", programType: "Certification", duration: 6, durationUnit: "Months", deliveryMode: "Online", color: "#1a73e8", icon: "TrendingUp", description: "Advanced certification with analytics, automation and strategy." },
  { subVerticalCode: "DIGITAL_MARKETING", name: "Weekend Digital Marketing", code: "DM_WEEKEND", programType: "Weekend", duration: 2, durationUnit: "Months", deliveryMode: "Hybrid", color: "#e8710a", icon: "Calendar", description: "Weekend-only batch for working professionals." },

  // ── Professional → Programming ──
  { subVerticalCode: "PROGRAMMING", name: "Web Development Bootcamp", code: "WEB_BOOTCAMP", programType: "Crash", duration: 3, durationUnit: "Months", deliveryMode: "Hybrid", color: "#34a853", icon: "Code", description: "Intensive bootcamp covering HTML, CSS, JavaScript, React and Node.js." },
  { subVerticalCode: "PROGRAMMING", name: "Full Stack Program", code: "FULLSTACK", programType: "Certification", duration: 6, durationUnit: "Months", deliveryMode: "Hybrid", color: "#0d652d", icon: "Layers", description: "Comprehensive full-stack development certification programme." },

  // ── Professional → AI ──
  { subVerticalCode: "AI", name: "AI Bootcamp", code: "AI_BOOTCAMP", programType: "Crash", duration: 2, durationUnit: "Months", deliveryMode: "Online", color: "#ea4335", icon: "Bot", description: "Intensive bootcamp on machine learning, deep learning and generative AI." },
  { subVerticalCode: "AI", name: "Data Science Program", code: "DATA_SCIENCE", programType: "Certification", duration: 6, durationUnit: "Months", deliveryMode: "Hybrid", color: "#a855f7", icon: "ChartNoAxesColumnIncreasing", description: "Certification covering Python, statistics, ML and data visualization." },

  // ── Professional → Accounting ──
  { subVerticalCode: "ACCOUNTING", name: "Practical Accounting", code: "PRACTICAL_ACCOUNTING", programType: "Regular", duration: 3, durationUnit: "Months", deliveryMode: "Offline", color: "#a855f7", icon: "Calculator", description: "Hands-on accounting training with ledgers, trial balance and final accounts." },

  // ── Professional → Tally ──
  { subVerticalCode: "TALLY", name: "Tally ERP Certification", code: "TALLY_CERTIFICATION", programType: "Certification", duration: 2, durationUnit: "Months", deliveryMode: "Offline", color: "#fbbc04", icon: "FileSpreadsheet", description: "Certification programme for Tally ERP.9 with GST and payroll." },

  // ── Corporate → HR Training ──
  { subVerticalCode: "HR_TRAINING", name: "HR Excellence Program", code: "HR_EXCELLENCE", programType: "Corporate", duration: 3, durationUnit: "Months", deliveryMode: "Hybrid", color: "#4285f4", icon: "Users", description: "Corporate training programme covering recruitment, payroll and HR compliance." },

  // ── Corporate → Leadership ──
  { subVerticalCode: "LEADERSHIP", name: "Executive Leadership", code: "EXEC_LEADERSHIP", programType: "Corporate", duration: 6, durationUnit: "Months", deliveryMode: "Hybrid", color: "#34a853", icon: "Crown", description: "Executive leadership development for senior managers and directors." },
  { subVerticalCode: "LEADERSHIP", name: "Manager Development", code: "MANAGER_DEV", programType: "Corporate", duration: 3, durationUnit: "Months", deliveryMode: "Offline", color: "#0d652d", icon: "TrendingUp", description: "Middle management development programme focusing on leadership skills." },

  // ── Corporate → Sales ──
  { subVerticalCode: "SALES", name: "Sales Excellence", code: "SALES_EXCELLENCE", programType: "Corporate", duration: 2, durationUnit: "Months", deliveryMode: "Offline", color: "#ea4335", icon: "TrendingUp", description: "Corporate sales training covering negotiation, pipeline management and closing." },

  // ── Corporate → Customer Service ──
  { subVerticalCode: "CUSTOMER_SERVICE", name: "Customer Service Excellence", code: "CS_EXCELLENCE", programType: "Corporate", duration: 1, durationUnit: "Months", deliveryMode: "Offline", color: "#a855f7", icon: "Headphones", description: "Training programme for customer service teams covering communication and conflict resolution." },
];

export const listAcademicPrograms = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("academicPrograms").collect();
    return items.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

export const getAcademicProgram = query({
  args: { programId: v.id("academicPrograms") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.programId);
  },
});

export const createAcademicProgram = mutation({
  args: {
    subVerticalId: v.id("academicSubVerticals"),
    name: v.string(),
    code: v.string(),
    programType: v.string(),
    duration: v.number(),
    durationUnit: v.string(),
    deliveryMode: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const allItems = await ctx.db.query("academicPrograms").collect();
    const maxSeq = allItems.reduce((max, p) => Math.max(max, p.displayOrder), 0);
    const now = Date.now();
    return await ctx.db.insert("academicPrograms", {
      subVerticalId: args.subVerticalId,
      name: args.name,
      code: args.code,
      programType: args.programType,
      duration: args.duration,
      durationUnit: args.durationUnit,
      deliveryMode: args.deliveryMode,
      description: args.description,
      color: args.color,
      icon: args.icon,
      displayOrder: maxSeq + 1,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateAcademicProgram = mutation({
  args: {
    programId: v.id("academicPrograms"),
    subVerticalId: v.optional(v.id("academicSubVerticals")),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    programType: v.optional(v.string()),
    duration: v.optional(v.number()),
    durationUnit: v.optional(v.string()),
    deliveryMode: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { programId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(programId, updates);
  },
});

export const deleteAcademicProgram = mutation({
  args: { programId: v.id("academicPrograms") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.programId);
  },
});

export const duplicateAcademicProgram = mutation({
  args: { programId: v.id("academicPrograms") },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.programId);
    if (!original) throw new Error("Academic program not found");
    const allItems = await ctx.db.query("academicPrograms").collect();
    const maxSeq = allItems.reduce((max, p) => Math.max(max, p.displayOrder), 0);
    const now = Date.now();
    await ctx.db.insert("academicPrograms", {
      subVerticalId: original.subVerticalId,
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
      programType: original.programType,
      duration: original.duration,
      durationUnit: original.durationUnit,
      deliveryMode: original.deliveryMode,
      description: original.description,
      color: original.color,
      icon: original.icon,
      displayOrder: maxSeq + 1,
      isActive: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const reorderAcademicPrograms = mutation({
  args: {
    programIds: v.array(v.id("academicPrograms")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.programIds.length; i++) {
      await ctx.db.patch(args.programIds[i], { displayOrder: i + 1, updatedAt: now });
    }
  },
});

export const seedDefaultAcademicPrograms = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("academicPrograms").collect();
    if (existing.length > 0) return { seeded: 0, message: "Academic programs already exist" };

    // Look up sub-verticals by code
    const subVerticals = await ctx.db.query("academicSubVerticals").collect();
    const subVerticalByCode: Record<string, typeof subVerticals[0]> = {};
    for (const sv of subVerticals) {
      subVerticalByCode[sv.code] = sv;
    }

    const now = Date.now();
    let idx = 0;
    for (const seed of SEED_DATA) {
      const subVertical = subVerticalByCode[seed.subVerticalCode];
      if (!subVertical) continue;
      idx++;
      await ctx.db.insert("academicPrograms", {
        subVerticalId: subVertical._id,
        name: seed.name,
        code: seed.code,
        programType: seed.programType,
        duration: seed.duration,
        durationUnit: seed.durationUnit,
        deliveryMode: seed.deliveryMode,
        description: seed.description,
        color: seed.color,
        icon: seed.icon,
        displayOrder: idx,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: idx, message: "Default academic programs created" };
  },
});
