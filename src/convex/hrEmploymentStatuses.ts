import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

const STATUS_CATEGORIES = [
  "Active",
  "Inactive",
  "Transition",
  "Termination",
  "Leave",
] as const;

const SEED_DATA: Array<{
  name: string;
  code: string;
  statusCategory: string;
  color: string;
  icon: string;
  description: string;
}> = [
  {
    name: "Active",
    code: "ACTIVE",
    statusCategory: "Active",
    color: "#34a853",
    icon: "BadgeCheck",
    description: "Employee is currently active and performing duties.",
  },
  {
    name: "Probation",
    code: "PROBATION",
    statusCategory: "Active",
    color: "#f59e0b",
    icon: "Clock",
    description: "Employee is under probationary review period.",
  },
  {
    name: "Notice Period",
    code: "NOTICE",
    statusCategory: "Transition",
    color: "#e8710a",
    icon: "Bell",
    description: "Employee has resigned and is serving notice period.",
  },
  {
    name: "Resigned",
    code: "RESIGNED",
    statusCategory: "Termination",
    color: "#ea4335",
    icon: "LogOut",
    description: "Employee has voluntarily resigned from the organization.",
  },
  {
    name: "Terminated",
    code: "TERMINATED",
    statusCategory: "Termination",
    color: "#d93025",
    icon: "Ban",
    description: "Employment has been terminated by the organization.",
  },
  {
    name: "Retired",
    code: "RETIRED",
    statusCategory: "Termination",
    color: "#5f6368",
    icon: "Heart",
    description: "Employee has retired after completing service tenure.",
  },
  {
    name: "On Leave",
    code: "ON_LEAVE",
    statusCategory: "Leave",
    color: "#4285f4",
    icon: "CalendarOff",
    description: "Employee is currently on approved leave of absence.",
  },
  {
    name: "Suspended",
    code: "SUSPENDED",
    statusCategory: "Inactive",
    color: "#f43f5e",
    icon: "ShieldAlert",
    description: "Employee has been temporarily suspended pending investigation.",
  },
  {
    name: "Absconded",
    code: "ABSCONDED",
    statusCategory: "Inactive",
    color: "#dc2626",
    icon: "UserX",
    description: "Employee has been absent without notice for extended period.",
  },
  {
    name: "Inactive",
    code: "INACTIVE",
    statusCategory: "Inactive",
    color: "#9aa0a6",
    icon: "UserMinus",
    description: "Employee account is inactive or dormant.",
  },
];

export const listEmploymentStatuses = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("hrEmploymentStatuses").collect();
    return items.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getEmploymentStatus = query({
  args: { employmentStatusId: v.id("hrEmploymentStatuses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.employmentStatusId);
  },
});

export const createEmploymentStatus = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    statusCategory: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    active: v.boolean(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "hr", entity: "hrEmploymentStatuses" }, async (ctx, args) => {
    const allItems = await ctx.db.query("hrEmploymentStatuses").collect();
    const maxSeq = allItems.reduce((max: any, t: any) => Math.max(max, t.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("hrEmploymentStatuses", {
      name: args.name,
      code: args.code,
      statusCategory: args.statusCategory,
      description: args.description,
      color: args.color,
      icon: args.icon,
      sequence: maxSeq + 1,
      active: args.active,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const updateEmploymentStatus = mutation({
  args: { token: v.optional(v.string()),
    employmentStatusId: v.id("hrEmploymentStatuses"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    statusCategory: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "hr", entity: "hrEmploymentStatuses" }, async (ctx, args) => {
    const { token: _token, employmentStatusId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(employmentStatusId, updates);
  }),
});

export const deleteEmploymentStatus = mutation({
  args: { token: v.optional(v.string()), employmentStatusId: v.id("hrEmploymentStatuses") },
  handler: withScopeAndEvents({ operation: "delete", module: "hr", entity: "hrEmploymentStatuses" }, async (ctx, args) => {
    await ctx.db.delete(args.employmentStatusId);
  }),
});

export const duplicateEmploymentStatus = mutation({
  args: { token: v.optional(v.string()), employmentStatusId: v.id("hrEmploymentStatuses") },
  handler: withScopeAndEvents({ operation: "create", module: "hr", entity: "hrEmploymentStatuses" }, async (ctx, args) => {
    const original = await ctx.db.get(args.employmentStatusId);
    if (!original) throw new Error("Employment status not found");
    const allItems = await ctx.db.query("hrEmploymentStatuses").collect();
    const maxSeq = allItems.reduce((max: any, t: any) => Math.max(max, t.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("hrEmploymentStatuses", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
      statusCategory: original.statusCategory,
      description: original.description,
      color: original.color,
      icon: original.icon,
      sequence: maxSeq + 1,
      active: false,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const reorderEmploymentStatuses = mutation({
  args: { token: v.optional(v.string()),
    employmentStatusIds: v.array(v.id("hrEmploymentStatuses")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "hr", entity: "hrEmploymentStatuses" }, async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.employmentStatusIds.length; i++) {
      await ctx.db.patch(args.employmentStatusIds[i], { sequence: i + 1, updatedAt: now });
    }
  }),
});

export const seedDefaultEmploymentStatuses = mutation({
  args: { token: v.optional(v.string()),},
  handler: withScopeAndEvents({ operation: "create", module: "hr", entity: "hrEmploymentStatuses" }, async (ctx) => {
    const existing = await ctx.db.query("hrEmploymentStatuses").collect();
    if (existing.length > 0) return { seeded: 0, message: "Employment statuses already exist" };

    const now = Date.now();
    for (let i = 0; i < SEED_DATA.length; i++) {
      const seed = SEED_DATA[i];
      await ctx.db.insert("hrEmploymentStatuses", {
        name: seed.name,
        code: seed.code,
        statusCategory: seed.statusCategory,
        description: seed.description,
        color: seed.color,
        icon: seed.icon,
        sequence: i + 1,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: SEED_DATA.length, message: "Default employment statuses created" };
  }),
});
