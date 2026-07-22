import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DEFAULT_DEPARTMENTS = [
  { name: "Administration", code: "ADMIN", color: "#1a1a2e", icon: "Building2", description: "Central administration and governance", sequence: 1 },
  { name: "Admissions", code: "ADM", color: "#4285f4", icon: "UserPlus", description: "Student admissions and enrollment", sequence: 2 },
  { name: "Sales", code: "SALES", color: "#34a853", icon: "TrendingUp", description: "Sales and business development", sequence: 3 },
  { name: "Marketing", code: "MKTG", color: "#ea4335", icon: "Megaphone", description: "Marketing and brand promotion", sequence: 4 },
  { name: "Finance", code: "FIN", color: "#fbbc04", icon: "DollarSign", description: "Financial planning and management", sequence: 5 },
  { name: "Accounts", code: "ACCT", color: "#e8710a", icon: "Calculator", description: "Accounting and bookkeeping", sequence: 6 },
  { name: "Human Resources", code: "HR", color: "#a855f7", icon: "Users", description: "Human resources and talent management", sequence: 7 },
  { name: "Academics", code: "ACAD", color: "#1a73e8", icon: "GraduationCap", description: "Academic programs and curriculum", sequence: 8 },
  { name: "Operations", code: "OPS", color: "#5f6368", icon: "Settings", description: "Day-to-day operations management", sequence: 9 },
  { name: "Technology", code: "TECH", color: "#0d652d", icon: "Monitor", description: "IT infrastructure and technology", sequence: 10 },
  { name: "Production", code: "PROD", color: "#e8710a", icon: "Factory", description: "Content and material production", sequence: 11 },
  { name: "Customer Support", code: "SUPPORT", color: "#06b6d4", icon: "Headphones", description: "Customer service and support", sequence: 12 },
  { name: "Student Success", code: "STUDENT", color: "#34a853", icon: "Award", description: "Student success and retention", sequence: 13 },
  { name: "Legal", code: "LEGAL", color: "#4f46e5", icon: "Scale", description: "Legal and compliance affairs", sequence: 14 },
  { name: "Purchase & Procurement", code: "PROCURE", color: "#0d9488", icon: "Package", description: "Vendor management and procurement", sequence: 15 },
  { name: "Examinations", code: "EXAM", color: "#ea4335", icon: "ClipboardCheck", description: "Exam scheduling and results", sequence: 16 },
  { name: "Management", code: "MGMT", color: "#1a1a2e", icon: "Briefcase", description: "Executive management and strategy", sequence: 17 },
  { name: "Corporate Relations", code: "CORP", color: "#a855f7", icon: "Handshake", description: "Corporate partnerships and relations", sequence: 18 },
];

export const listDepartments = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("orgDepartments").collect();
    return items.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getDepartment = query({
  args: { departmentId: v.id("orgDepartments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.departmentId);
  },
});

export const createDepartment = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const allItems = await ctx.db.query("orgDepartments").collect();
    const maxSeq = allItems.reduce((max, d) => Math.max(max, d.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("orgDepartments", {
      name: args.name,
      code: args.code,
      color: args.color,
      icon: args.icon,
      description: args.description,
      sequence: maxSeq + 1,
      active: args.active,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateDepartment = mutation({
  args: {
    departmentId: v.id("orgDepartments"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { departmentId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(departmentId, updates);
  },
});

export const deleteDepartment = mutation({
  args: { departmentId: v.id("orgDepartments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.departmentId);
  },
});

export const duplicateDepartment = mutation({
  args: { departmentId: v.id("orgDepartments") },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.departmentId);
    if (!original) throw new Error("Department not found");
    const allItems = await ctx.db.query("orgDepartments").collect();
    const maxSeq = allItems.reduce((max, d) => Math.max(max, d.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("orgDepartments", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
      color: original.color,
      icon: original.icon,
      description: original.description,
      sequence: maxSeq + 1,
      active: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const reorderDepartments = mutation({
  args: {
    departmentIds: v.array(v.id("orgDepartments")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.departmentIds.length; i++) {
      await ctx.db.patch(args.departmentIds[i], { sequence: i + 1, updatedAt: now });
    }
  },
});

export const seedDefaultDepartments = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("orgDepartments").collect();
    if (existing.length > 0) return { seeded: 0, message: "Departments already exist" };

    const now = Date.now();
    for (const item of DEFAULT_DEPARTMENTS) {
      await ctx.db.insert("orgDepartments", {
        ...item,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: DEFAULT_DEPARTMENTS.length, message: "Default departments created" };
  },
});
