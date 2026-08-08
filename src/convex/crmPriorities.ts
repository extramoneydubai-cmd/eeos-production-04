import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

const DEFAULT_PRIORITIES = [
  { name: "VIP", code: "VIP", color: "#a855f7", icon: "Crown", description: "Very important persons — immediate attention required", sequence: 1 },
  { name: "High", code: "HIGH", color: "#ea4335", icon: "ArrowUp", description: "High priority leads requiring urgent follow-up", sequence: 2 },
  { name: "Medium", code: "MED", color: "#e8710a", icon: "Minus", description: "Standard priority leads with regular follow-up schedule", sequence: 3 },
  { name: "Low", code: "LOW", color: "#4285f4", icon: "ArrowDown", description: "Low priority leads with flexible timelines", sequence: 4 },
  { name: "Cold", code: "COLD", color: "#5f6368", icon: "Snowflake", description: "Cold leads with no immediate action required", sequence: 5 },
];

export const listPriorities = query({
  args: {},
  handler: async (ctx) => {
    const priorities = await ctx.db.query("crmPriorities").collect();
    return priorities.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getPriority = query({
  args: { priorityId: v.id("crmPriorities") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.priorityId);
  },
});

export const createPriority = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmPriorities" }, async (ctx, args) => {
    const allPriorities = await ctx.db.query("crmPriorities").collect();
    const maxSeq = allPriorities.reduce((max: any, p: any) => Math.max(max, p.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("crmPriorities", {
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

export const updatePriority = mutation({
  args: { token: v.optional(v.string()),
    priorityId: v.id("crmPriorities"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmPriorities" }, async (ctx, args) => {
    const { token: _token, priorityId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(priorityId, updates);
  }),
});

export const deletePriority = mutation({
  args: { token: v.optional(v.string()), priorityId: v.id("crmPriorities") },
  handler: withScopeAndEvents({ operation: "delete", module: "crm", entity: "crmPriorities" }, async (ctx, args) => {
    await ctx.db.delete(args.priorityId);
  }),
});

export const duplicatePriority = mutation({
  args: { token: v.optional(v.string()), priorityId: v.id("crmPriorities") },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmPriorities" }, async (ctx, args) => {
    const original = await ctx.db.get(args.priorityId);
    if (!original) throw new Error("Priority not found");
    const allPriorities = await ctx.db.query("crmPriorities").collect();
    const maxSeq = allPriorities.reduce((max: any, p: any) => Math.max(max, p.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("crmPriorities", {
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

export const reorderPriorities = mutation({
  args: { token: v.optional(v.string()),
    priorityIds: v.array(v.id("crmPriorities")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmPriorities" }, async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.priorityIds.length; i++) {
      await ctx.db.patch(args.priorityIds[i], { sequence: i + 1, updatedAt: now });
    }
  }),
});

export const seedDefaultPriorities = mutation({
  args: { token: v.optional(v.string()),},
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmPriorities" }, async (ctx) => {
    const existing = await ctx.db.query("crmPriorities").collect();
    if (existing.length > 0) return { seeded: 0, message: "Priorities already exist" };

    const now = Date.now();
    for (const priority of DEFAULT_PRIORITIES) {
      await ctx.db.insert("crmPriorities", {
        ...priority,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: DEFAULT_PRIORITIES.length, message: "Default priorities created" };
  }),
});
