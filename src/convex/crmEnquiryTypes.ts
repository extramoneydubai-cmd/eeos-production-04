import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

const DEFAULT_TYPES = [
  { name: "Course Enquiry", code: "COURSE", category: "Academic", color: "#4285f4", icon: "BookOpen", description: "Enquiry about course details, syllabus, and curriculum" },
  { name: "Admission Enquiry", code: "ADM", category: "Academic", color: "#1a73e8", icon: "GraduationCap", description: "Enquiry about admission process and eligibility" },
  { name: "Fee Enquiry", code: "FEE", category: "Finance", color: "#34a853", icon: "DollarSign", description: "Enquiry about fee structure and payment plans" },
  { name: "Scholarship", code: "SCHOLAR", category: "Finance", color: "#a855f7", icon: "Award", description: "Enquiry about scholarship programs and eligibility" },
  { name: "Demo Class", code: "DEMO", category: "Academic", color: "#fbbc04", icon: "Monitor", description: "Enquiry about demo or trial class scheduling" },
  { name: "Corporate Training", code: "CORP", category: "Corporate", color: "#5f6368", icon: "Briefcase", description: "Enquiry about corporate training programs" },
  { name: "Franchise", code: "FRAN", category: "Business", color: "#0d9488", icon: "Building2", description: "Enquiry about franchise opportunities" },
  { name: "Partnership", code: "PARTNER", category: "Business", color: "#4f46e5", icon: "Handshake", description: "Enquiry about partnership and collaboration" },
  { name: "Career", code: "CAREER", category: "General", color: "#e8710a", icon: "Briefcase", description: "Enquiry about career opportunities within the organization" },
  { name: "General", code: "GEN", category: "General", color: "#9aa0a6", icon: "HelpCircle", description: "General enquiry not fitting other categories" },
  { name: "Complaint", code: "COMP", category: "Support", color: "#ea4335", icon: "AlertTriangle", description: "Complaint or grievance submission" },
  { name: "Support", code: "SUPPORT", category: "Support", color: "#06b6d4", icon: "Headphones", description: "Technical or administrative support request" },
];

export const listEnquiryTypes = query({
  args: {},
  handler: async (ctx) => {
    const types = await ctx.db.query("crmEnquiryTypes").collect();
    return types.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getEnquiryType = query({
  args: { enquiryTypeId: v.id("crmEnquiryTypes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.enquiryTypeId);
  },
});

export const createEnquiryType = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    educationCategory: v.string(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmEnquiryTypes" }, async (ctx, args) => {
    const all = await ctx.db.query("crmEnquiryTypes").collect();
    const maxSeq = all.reduce((max: any, t: any) => Math.max(max, t.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("crmEnquiryTypes", {
      name: args.name,
      code: args.code,
      educationCategory: args.educationCategory,
      color: args.color,
      icon: args.icon,
      description: args.description,
      sequence: maxSeq + 1,
      active: args.active,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const updateEnquiryType = mutation({
  args: { token: v.optional(v.string()),
    enquiryTypeId: v.id("crmEnquiryTypes"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    educationCategory: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmEnquiryTypes" }, async (ctx, args) => {
    const { token: _token, enquiryTypeId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(enquiryTypeId, updates);
  }),
});

export const deleteEnquiryType = mutation({
  args: { token: v.optional(v.string()), enquiryTypeId: v.id("crmEnquiryTypes") },
  handler: withScopeAndEvents({ operation: "delete", module: "crm", entity: "crmEnquiryTypes" }, async (ctx, args) => {
    await ctx.db.delete(args.enquiryTypeId);
  }),
});

export const duplicateEnquiryType = mutation({
  args: { token: v.optional(v.string()), enquiryTypeId: v.id("crmEnquiryTypes") },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmEnquiryTypes" }, async (ctx, args) => {
    const original = await ctx.db.get(args.enquiryTypeId);
    if (!original) throw new Error("Enquiry type not found");
    const all = await ctx.db.query("crmEnquiryTypes").collect();
    const maxSeq = all.reduce((max: any, t: any) => Math.max(max, t.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("crmEnquiryTypes", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
      educationCategory: original.educationCategory,
      color: original.color,
      icon: original.icon,
      description: original.description,
      sequence: maxSeq + 1,
      active: false,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const reorderEnquiryTypes = mutation({
  args: { token: v.optional(v.string()),
    enquiryTypeIds: v.array(v.id("crmEnquiryTypes")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmEnquiryTypes" }, async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.enquiryTypeIds.length; i++) {
      await ctx.db.patch(args.enquiryTypeIds[i], { sequence: i + 1, updatedAt: now });
    }
  }),
});

export const seedDefaultEnquiryTypes = mutation({
  args: { token: v.optional(v.string()),},
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmEnquiryTypes" }, async (ctx) => {
    const existing = await ctx.db.query("crmEnquiryTypes").collect();
    if (existing.length > 0) return { seeded: 0, message: "Enquiry types already exist" };

    const now = Date.now();
    for (let i = 0; i < DEFAULT_TYPES.length; i++) {
      const t = DEFAULT_TYPES[i];
      await ctx.db.insert("crmEnquiryTypes", {
        name: t.name,
        code: t.code,
        educationCategory: t.category,
        color: t.color,
        icon: t.icon,
        description: t.description,
        sequence: i + 1,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: DEFAULT_TYPES.length, message: "Default enquiry types created" };
  }),
});
