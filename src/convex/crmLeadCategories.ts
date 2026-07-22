import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const SEED_DATA = [
  { name: "Student", code: "STUDENT", categoryType: "Individual", description: "Prospective or current student", color: "#1a73e8", icon: "GraduationCap" },
  { name: "Parent", code: "PARENT", categoryType: "Individual", description: "Parent or guardian of a prospect", color: "#34a853", icon: "Heart" },
  { name: "Corporate", code: "CORPORATE", categoryType: "Organization", description: "Corporate entity or business organization", color: "#0d9488", icon: "Building" },
  { name: "School", code: "SCHOOL", categoryType: "Institution", description: "School referring or sending students", color: "#e8710a", icon: "School" },
  { name: "College", code: "COLLEGE", categoryType: "Institution", description: "College or higher education institution", color: "#4285f4", icon: "BookOpen" },
  { name: "Franchise", code: "FRANCHISE", categoryType: "Business", description: "Franchise partner or operator", color: "#4f46e5", icon: "Building2" },
  { name: "Partner", code: "PARTNER", categoryType: "Business", description: "Strategic business partner", color: "#a855f7", icon: "Handshake" },
  { name: "Institution", code: "INSTITUTION", categoryType: "Institution", description: "Educational or training institution", color: "#06b6d4", icon: "Landmark" },
  { name: "Government", code: "GOVT", categoryType: "Government", description: "Government agency or department", color: "#5f6368", icon: "Shield" },
  { name: "NGO", code: "NGO", categoryType: "Organization", description: "Non-governmental organization", color: "#22c55e", icon: "HeartHandshake" },
  { name: "International", code: "INTL", categoryType: "Individual", description: "International student or prospect", color: "#f59e0b", icon: "Globe" },
  { name: "VIP", code: "VIP", categoryType: "Individual", description: "Very important person or high-value lead", color: "#d4a017", icon: "Star" },
];

function baseFields(data: (typeof SEED_DATA)[number], sequence: number) {
  return {
    name: data.name,
    code: data.code,
    categoryType: data.categoryType,
    description: data.description,
    color: data.color,
    icon: data.icon,
    sequence,
    active: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export const seedDefault = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("crmLeadCategories").withIndex("sequence").collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (let i = 0; i < SEED_DATA.length; i++) {
      await ctx.db.insert("crmLeadCategories", baseFields(SEED_DATA[i], i));
      count++;
    }
    return { seeded: count };
  },
});

export const createLeadCategory = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    categoryType: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("crmLeadCategories").withIndex("sequence").collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("crmLeadCategories", {
      ...args,
      description: args.description ?? "",
      sequence: maxSeq + 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateLeadCategory = mutation({
  args: {
    id: v.id("crmLeadCategories"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    categoryType: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Lead category not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const deleteLeadCategory = mutation({
  args: { id: v.id("crmLeadCategories") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Lead category not found");
    await ctx.db.delete(args.id);
  },
});

export const duplicateLeadCategory = mutation({
  args: { id: v.id("crmLeadCategories") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("Lead category not found");
    const all = await ctx.db.query("crmLeadCategories").withIndex("sequence").collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("crmLeadCategories", {
      name: `${source.name} (Copy)`,
      code: `${source.code}_COPY`,
      categoryType: source.categoryType,
      description: source.description,
      color: source.color,
      icon: source.icon,
      sequence: maxSeq + 1,
      active: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const reorderLeadCategories = mutation({
  args: { orderedIds: v.array(v.id("crmLeadCategories")) },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { sequence: i, updatedAt: Date.now() });
    }
  },
});

export const listLeadCategories = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("crmLeadCategories").withIndex("sequence").collect();
  },
});

export const getLeadCategory = query({
  args: { id: v.id("crmLeadCategories") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
