import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const EMPLOYMENT_CATEGORIES = [
  "Full-Time",
  "Part-Time",
  "Contract",
  "Temporary",
  "Internship",
  "Freelance",
] as const;

const SEED_DATA: Array<{
  name: string;
  code: string;
  employmentCategory: string;
  isPayrollEligible: boolean;
  color: string;
  icon: string;
  description: string;
}> = [
  {
    name: "Permanent",
    code: "PERMANENT",
    employmentCategory: "Full-Time",
    isPayrollEligible: true,
    color: "#1a73e8",
    icon: "BadgeCheck",
    description: "Regular full-time employee with confirmed permanent status and all benefits.",
  },
  {
    name: "Probation",
    code: "PROBATION",
    employmentCategory: "Full-Time",
    isPayrollEligible: true,
    color: "#f59e0b",
    icon: "Clock",
    description: "Employee under probationary period pending permanent confirmation.",
  },
  {
    name: "Contract",
    code: "CONTRACT",
    employmentCategory: "Contract",
    isPayrollEligible: true,
    color: "#ea4335",
    icon: "FileText",
    description: "Employee hired on a fixed-term contract with defined start and end dates.",
  },
  {
    name: "Part Time",
    code: "PART_TIME",
    employmentCategory: "Part-Time",
    isPayrollEligible: true,
    color: "#34a853",
    icon: "Clock",
    description: "Employee working reduced hours compared to full-time schedule.",
  },
  {
    name: "Intern",
    code: "INTERN",
    employmentCategory: "Internship",
    isPayrollEligible: false,
    color: "#a855f7",
    icon: "GraduationCap",
    description: "Trainee or apprentice undergoing practical training for a fixed duration.",
  },
  {
    name: "Consultant",
    code: "CONSULTANT",
    employmentCategory: "Contract",
    isPayrollEligible: false,
    color: "#4f46e5",
    icon: "Briefcase",
    description: "External specialist engaged for advisory or project-based work.",
  },
  {
    name: "Freelancer",
    code: "FREELANCER",
    employmentCategory: "Freelance",
    isPayrollEligible: false,
    color: "#06b6d4",
    icon: "Laptop",
    description: "Independent contractor providing services on a per-task or per-project basis.",
  },
  {
    name: "Visiting Faculty",
    code: "VISITING_FACULTY",
    employmentCategory: "Part-Time",
    isPayrollEligible: true,
    color: "#e8710a",
    icon: "UserRound",
    description: "Academic staff invited to teach specific courses on a part-time basis.",
  },
  {
    name: "Guest Lecturer",
    code: "GUEST_LECTURER",
    employmentCategory: "Freelance",
    isPayrollEligible: false,
    color: "#0d9488",
    icon: "Speech",
    description: "Subject matter expert invited for occasional guest lectures or seminars.",
  },
  {
    name: "Volunteer",
    code: "VOLUNTEER",
    employmentCategory: "Temporary",
    isPayrollEligible: false,
    color: "#5f6368",
    icon: "HeartHandshake",
    description: "Unpaid volunteer contributing to organizational activities and events.",
  },
];

export const listEmployeeTypes = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("hrEmployeeTypes").collect();
    return items.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getEmployeeType = query({
  args: { employeeTypeId: v.id("hrEmployeeTypes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.employeeTypeId);
  },
});

export const createEmployeeType = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    employmentCategory: v.string(),
    isPayrollEligible: v.boolean(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const allItems = await ctx.db.query("hrEmployeeTypes").collect();
    const maxSeq = allItems.reduce((max, t) => Math.max(max, t.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("hrEmployeeTypes", {
      name: args.name,
      code: args.code,
      employmentCategory: args.employmentCategory,
      isPayrollEligible: args.isPayrollEligible,
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

export const updateEmployeeType = mutation({
  args: {
    employeeTypeId: v.id("hrEmployeeTypes"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    employmentCategory: v.optional(v.string()),
    isPayrollEligible: v.optional(v.boolean()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { employeeTypeId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(employeeTypeId, updates);
  },
});

export const deleteEmployeeType = mutation({
  args: { employeeTypeId: v.id("hrEmployeeTypes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.employeeTypeId);
  },
});

export const duplicateEmployeeType = mutation({
  args: { employeeTypeId: v.id("hrEmployeeTypes") },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.employeeTypeId);
    if (!original) throw new Error("Employee type not found");
    const allItems = await ctx.db.query("hrEmployeeTypes").collect();
    const maxSeq = allItems.reduce((max, t) => Math.max(max, t.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("hrEmployeeTypes", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
      employmentCategory: original.employmentCategory,
      isPayrollEligible: original.isPayrollEligible,
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

export const reorderEmployeeTypes = mutation({
  args: {
    employeeTypeIds: v.array(v.id("hrEmployeeTypes")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.employeeTypeIds.length; i++) {
      await ctx.db.patch(args.employeeTypeIds[i], { sequence: i + 1, updatedAt: now });
    }
  },
});

export const seedDefaultEmployeeTypes = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("hrEmployeeTypes").collect();
    if (existing.length > 0) return { seeded: 0, message: "Employee types already exist" };

    const now = Date.now();
    for (let i = 0; i < SEED_DATA.length; i++) {
      const seed = SEED_DATA[i];
      await ctx.db.insert("hrEmployeeTypes", {
        name: seed.name,
        code: seed.code,
        employmentCategory: seed.employmentCategory,
        isPayrollEligible: seed.isPayrollEligible,
        description: seed.description,
        color: seed.color,
        icon: seed.icon,
        sequence: i + 1,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: SEED_DATA.length, message: "Default employee types created" };
  },
});
