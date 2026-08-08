import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

const DEFAULT_DESIGNATIONS = [
  { name: "CEO", code: "CEO", color: "#1a1a2e", icon: "Crown", description: "Chief Executive Officer — top-level leadership", sequence: 1 },
  { name: "COO", code: "COO", color: "#4285f4", icon: "Briefcase", description: "Chief Operating Officer — operations leadership", sequence: 2 },
  { name: "Principal", code: "PRINCIPAL", color: "#a855f7", icon: "GraduationCap", description: "Academic head of the institution", sequence: 3 },
  { name: "Vice Principal", code: "VP", color: "#7c3aed", icon: "BookOpen", description: "Deputy academic head", sequence: 4 },
  { name: "Branch Manager", code: "BRMGR", color: "#e8710a", icon: "Building2", description: "Branch-level operations manager", sequence: 5 },
  { name: "Center Manager", code: "CTRMGR", color: "#f59e0b", icon: "MapPin", description: "Center-level operations manager", sequence: 6 },
  { name: "Sales Manager", code: "SALESMGR", color: "#ea4335", icon: "TrendingUp", description: "Sales team lead and performance manager", sequence: 7 },
  { name: "Marketing Manager", code: "MKTGMGR", color: "#f43f5e", icon: "Megaphone", description: "Marketing strategy and campaigns lead", sequence: 8 },
  { name: "HR Manager", code: "HRMGR", color: "#06b6d4", icon: "Users", description: "Human resources department head", sequence: 9 },
  { name: "Finance Manager", code: "FINMGR", color: "#34a853", icon: "DollarSign", description: "Finance and accounts department head", sequence: 10 },
  { name: "Counselor", code: "COUNSELOR", color: "#0d9488", icon: "MessageCircle", description: "Student counselor and academic advisor", sequence: 11 },
  { name: "Telecaller", code: "TCALLER", color: "#5f6368", icon: "Phone", description: "Telecalling and lead follow-up executive", sequence: 12 },
  { name: "Receptionist", code: "RECEP", color: "#9aa0a6", icon: "PhoneCall", description: "Front desk and visitor management", sequence: 13 },
  { name: "Faculty", code: "FACULTY", color: "#4f46e5", icon: "Chalkboard", description: "Teaching faculty member", sequence: 14 },
  { name: "Office Assistant", code: "OFFICE", color: "#6b7280", icon: "ClipboardList", description: "General office administration support", sequence: 15 },
  { name: "Accountant", code: "ACCT", color: "#0d652d", icon: "Calculator", description: "Accounting and bookkeeping", sequence: 16 },
  { name: "HR Executive", code: "HREXEC", color: "#0891b2", icon: "UserCheck", description: "HR operations and recruitment executive", sequence: 17 },
  { name: "Marketing Executive", code: "MKTGEXEC", color: "#e11d48", icon: "Target", description: "Marketing campaign execution", sequence: 18 },
  { name: "Lab Assistant", code: "LAB", color: "#6366f1", icon: "FlaskConical", description: "Laboratory and practical session assistant", sequence: 19 },
  { name: "Office Boy", code: "OFFBOY", color: "#a1a1aa", icon: "ConciergeBell", description: "Office errands and upkeep support", sequence: 20 },
  { name: "Peon", code: "PEON", color: "#d4d4d8", icon: "HardHat", description: "General support staff", sequence: 21 },
];

export const listDesignations = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("orgDesignations").collect();
    return items.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getDesignation = query({
  args: { designationId: v.id("orgDesignations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.designationId);
  },
});

export const createDesignation = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "organization", entity: "organizationDesignations" }, async (ctx, args) => {
    const allItems = await ctx.db.query("orgDesignations").collect();
    const maxSeq = allItems.reduce((max: any, d: any) => Math.max(max, d.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("orgDesignations", {
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
  }),
});

export const updateDesignation = mutation({
  args: { token: v.optional(v.string()),
    designationId: v.id("orgDesignations"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "organization", entity: "organizationDesignations" }, async (ctx, args) => {
    const { token: _token, designationId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(designationId, updates);
  }),
});

export const deleteDesignation = mutation({
  args: { token: v.optional(v.string()), designationId: v.id("orgDesignations") },
  handler: withScopeAndEvents({ operation: "delete", module: "organization", entity: "organizationDesignations" }, async (ctx, args) => {
    await ctx.db.delete(args.designationId);
  }),
});

export const duplicateDesignation = mutation({
  args: { token: v.optional(v.string()), designationId: v.id("orgDesignations") },
  handler: withScopeAndEvents({ operation: "create", module: "organization", entity: "organizationDesignations" }, async (ctx, args) => {
    const original = await ctx.db.get(args.designationId);
    if (!original) throw new Error("Designation not found");
    const allItems = await ctx.db.query("orgDesignations").collect();
    const maxSeq = allItems.reduce((max: any, d: any) => Math.max(max, d.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("orgDesignations", {
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
  }),
});

export const reorderDesignations = mutation({
  args: { token: v.optional(v.string()),
    designationIds: v.array(v.id("orgDesignations")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "organization", entity: "organizationDesignations" }, async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.designationIds.length; i++) {
      await ctx.db.patch(args.designationIds[i], { sequence: i + 1, updatedAt: now });
    }
  }),
});

export const seedDefaultDesignations = mutation({
  args: { token: v.optional(v.string()),},
  handler: withScopeAndEvents({ operation: "create", module: "organization", entity: "organizationDesignations" }, async (ctx) => {
    const existing = await ctx.db.query("orgDesignations").collect();
    if (existing.length > 0) return { seeded: 0, message: "Designations already exist" };

    const now = Date.now();
    for (const item of DEFAULT_DESIGNATIONS) {
      await ctx.db.insert("orgDesignations", {
        ...item,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: DEFAULT_DESIGNATIONS.length, message: "Default designations created" };
  }),
});
