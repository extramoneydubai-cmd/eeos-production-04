import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

const DEFAULT_TEAMS = [
  { name: "Admissions Team A", code: "ADM_A", color: "#4285f4", icon: "Users", description: "Primary admissions processing team", sequence: 1 },
  { name: "Admissions Team B", code: "ADM_B", color: "#34a853", icon: "UserPlus", description: "Secondary admissions and support team", sequence: 2 },
  { name: "Sales Team", code: "SALES", color: "#ea4335", icon: "TrendingUp", description: "Sales and lead conversion team", sequence: 3 },
  { name: "Recovery Team", code: "RECOVERY", color: "#fbbc04", icon: "Phone", description: "Payment recovery and follow-up team", sequence: 4 },
  { name: "Telecalling Team", code: "TCALL", color: "#a855f7", icon: "Headphones", description: "Outbound telecalling and lead qualification", sequence: 5 },
  { name: "Digital Marketing", code: "DIGI_MKTG", color: "#e8710a", icon: "Megaphone", description: "Digital and online marketing campaigns", sequence: 6 },
  { name: "Performance Marketing", code: "PERF_MKTG", color: "#1a73e8", icon: "BarChart3", description: "Paid ads and performance marketing", sequence: 7 },
  { name: "Creative Team", code: "CREATIVE", color: "#5f6368", icon: "PaletteIcon", description: "Content creation and design team", sequence: 8 },
  { name: "Finance Operations", code: "FIN_OPS", color: "#0d652d", icon: "DollarSign", description: "Financial operations and planning", sequence: 9 },
  { name: "Accounts Team", code: "ACCT", color: "#1a1a2e", icon: "Calculator", description: "Day-to-day accounting operations", sequence: 10 },
  { name: "HR Operations", code: "HR_OPS", color: "#06b6d4", icon: "UserCheck", description: "HR operations and employee management", sequence: 11 },
  { name: "Academic Operations", code: "ACAD_OPS", color: "#4f46e5", icon: "GraduationCap", description: "Academic program coordination", sequence: 12 },
  { name: "Technology Development", code: "TECH_DEV", color: "#0d9488", icon: "Monitor", description: "Software and technology development", sequence: 13 },
  { name: "Infrastructure Team", code: "INFRA", color: "#f43f5e", icon: "Wrench", description: "IT infrastructure and systems maintenance", sequence: 14 },
  { name: "Customer Success", code: "CSAT", color: "#10b981", icon: "Award", description: "Student success and retention management", sequence: 15 },
  { name: "Corporate Relations", code: "CORP_REL", color: "#f59e0b", icon: "Handshake", description: "Corporate partnerships and B2B relations", sequence: 16 },
  { name: "Management Office", code: "MGMT", color: "#9aa0a6", icon: "Briefcase", description: "Executive management support team", sequence: 17 },
  { name: "Support Team", code: "SUPPORT", color: "#e8f0fe", icon: "LifeBuoy", description: "General administrative and operational support", sequence: 18 },
];

export const listTeams = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("orgTeams").collect();
    return items.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getTeam = query({
  args: { teamId: v.id("orgTeams") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.teamId);
  },
});

export const createTeam = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "organization", entity: "organizationTeams" }, async (ctx, args) => {
    const allItems = await ctx.db.query("orgTeams").collect();
    const maxSeq = allItems.reduce((max: any, t: any) => Math.max(max, t.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("orgTeams", {
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

export const updateTeam = mutation({
  args: { token: v.optional(v.string()),
    teamId: v.id("orgTeams"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "organization", entity: "organizationTeams" }, async (ctx, args) => {
    const { token: _token, teamId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(teamId, updates);
  }),
});

export const deleteTeam = mutation({
  args: { token: v.optional(v.string()), teamId: v.id("orgTeams") },
  handler: withScopeAndEvents({ operation: "delete", module: "organization", entity: "organizationTeams" }, async (ctx, args) => {
    await ctx.db.delete(args.teamId);
  }),
});

export const duplicateTeam = mutation({
  args: { token: v.optional(v.string()), teamId: v.id("orgTeams") },
  handler: withScopeAndEvents({ operation: "create", module: "organization", entity: "organizationTeams" }, async (ctx, args) => {
    const original = await ctx.db.get(args.teamId);
    if (!original) throw new Error("Team not found");
    const allItems = await ctx.db.query("orgTeams").collect();
    const maxSeq = allItems.reduce((max: any, t: any) => Math.max(max, t.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("orgTeams", {
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

export const reorderTeams = mutation({
  args: { token: v.optional(v.string()),
    teamIds: v.array(v.id("orgTeams")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "organization", entity: "organizationTeams" }, async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.teamIds.length; i++) {
      await ctx.db.patch(args.teamIds[i], { sequence: i + 1, updatedAt: now });
    }
  }),
});

export const seedDefaultTeams = mutation({
  args: { token: v.optional(v.string()),},
  handler: withScopeAndEvents({ operation: "create", module: "organization", entity: "organizationTeams" }, async (ctx) => {
    const existing = await ctx.db.query("orgTeams").collect();
    if (existing.length > 0) return { seeded: 0, message: "Teams already exist" };

    const now = Date.now();
    for (const item of DEFAULT_TEAMS) {
      await ctx.db.insert("orgTeams", {
        ...item,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: DEFAULT_TEAMS.length, message: "Default teams created" };
  }),
});
