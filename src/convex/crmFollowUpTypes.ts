import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

const DEFAULT_TYPES = [
  { name: "Phone Call", code: "PHONE", category: "Call", reminder: true, days: 1, color: "#4285f4", icon: "Phone", description: "Standard phone call follow-up" },
  { name: "WhatsApp", code: "WA", category: "Messaging", reminder: true, days: 2, color: "#25D366", icon: "MessageCircle", description: "WhatsApp message follow-up" },
  { name: "Email", code: "EMAIL", category: "Messaging", reminder: true, days: 3, color: "#ea4335", icon: "Mail", description: "Email-based follow-up communication" },
  { name: "SMS", code: "SMS", category: "Messaging", reminder: true, days: 2, color: "#34a853", icon: "MessageSquare", description: "SMS text message follow-up" },
  { name: "Video Call", code: "VIDEO", category: "Call", reminder: true, days: 1, color: "#a855f7", icon: "Video", description: "Video conference call follow-up" },
  { name: "Office Visit", code: "OFFICE", category: "Visit", reminder: true, days: 1, color: "#0d9488", icon: "Building", description: "In-person visit to the office" },
  { name: "Home Visit", code: "HOME", category: "Visit", reminder: true, days: 1, color: "#e8710a", icon: "Home", description: "Field visit to the lead's home" },
  { name: "Demo Session", code: "DEMO", category: "Session", reminder: true, days: 1, color: "#fbbc04", icon: "Monitor", description: "Product or service demo session" },
  { name: "Counselling", code: "COUNSEL", category: "Session", reminder: true, days: 1, color: "#4f46e5", icon: "HeartHandshake", description: "Academic or career counselling session" },
  { name: "Document Collection", code: "DOCS", category: "Admin", reminder: false, days: undefined, color: "#5f6368", icon: "FileText", description: "Collect required documents from lead" },
  { name: "Fee Discussion", code: "FEE", category: "Finance", reminder: true, days: 1, color: "#d4a017", icon: "DollarSign", description: "Fee structure and payment discussion" },
  { name: "Parent Meeting", code: "PARENT", category: "Meeting", reminder: true, days: 2, color: "#1a73e8", icon: "Users", description: "Meeting with parent or guardian" },
  { name: "Follow-up Meeting", code: "FUM", category: "Meeting", reminder: true, days: 3, color: "#0d652d", icon: "Calendar", description: "General follow-up meeting" },
  { name: "Presentation", code: "PRES", category: "Session", reminder: true, days: 1, color: "#e91e63", icon: "Presentation", description: "Detailed presentation or proposal walkthrough" },
  { name: "Other", code: "OTHER", category: "General", reminder: false, days: undefined, color: "#9aa0a6", icon: "Ellipsis", description: "Any other type of follow-up not listed above" },
];

export const listFollowUpTypes = query({
  args: {},
  handler: async (ctx) => {
    const types = await ctx.db.query("crmFollowUpTypes").collect();
    return types.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getFollowUpType = query({
  args: { followUpTypeId: v.id("crmFollowUpTypes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.followUpTypeId);
  },
});

export const createFollowUpType = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    followUpCategory: v.string(),
    requiresReminder: v.boolean(),
    defaultReminderDays: v.optional(v.number()),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmFollowUpTypes" }, async (ctx, args) => {
    const all = await ctx.db.query("crmFollowUpTypes").collect();
    const maxSeq = all.reduce((max: any, t: any) => Math.max(max, t.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("crmFollowUpTypes", {
      name: args.name,
      code: args.code,
      followUpCategory: args.followUpCategory,
      requiresReminder: args.requiresReminder,
      defaultReminderDays: args.defaultReminderDays,
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

export const updateFollowUpType = mutation({
  args: { token: v.optional(v.string()),
    followUpTypeId: v.id("crmFollowUpTypes"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    followUpCategory: v.optional(v.string()),
    requiresReminder: v.optional(v.boolean()),
    defaultReminderDays: v.optional(v.number()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmFollowUpTypes" }, async (ctx, args) => {
    const { token: _token, followUpTypeId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(followUpTypeId, updates);
  }),
});

export const deleteFollowUpType = mutation({
  args: { token: v.optional(v.string()), followUpTypeId: v.id("crmFollowUpTypes") },
  handler: withScopeAndEvents({ operation: "delete", module: "crm", entity: "crmFollowUpTypes" }, async (ctx, args) => {
    await ctx.db.delete(args.followUpTypeId);
  }),
});

export const duplicateFollowUpType = mutation({
  args: { token: v.optional(v.string()), followUpTypeId: v.id("crmFollowUpTypes") },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmFollowUpTypes" }, async (ctx, args) => {
    const original = await ctx.db.get(args.followUpTypeId);
    if (!original) throw new Error("Follow-up type not found");
    const all = await ctx.db.query("crmFollowUpTypes").collect();
    const maxSeq = all.reduce((max: any, t: any) => Math.max(max, t.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("crmFollowUpTypes", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
      followUpCategory: original.followUpCategory,
      requiresReminder: original.requiresReminder,
      defaultReminderDays: original.defaultReminderDays,
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

export const reorderFollowUpTypes = mutation({
  args: { token: v.optional(v.string()),
    followUpTypeIds: v.array(v.id("crmFollowUpTypes")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmFollowUpTypes" }, async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.followUpTypeIds.length; i++) {
      await ctx.db.patch(args.followUpTypeIds[i], { sequence: i + 1, updatedAt: now });
    }
  }),
});

export const seedDefaultFollowUpTypes = mutation({
  args: { token: v.optional(v.string()),},
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmFollowUpTypes" }, async (ctx) => {
    const existing = await ctx.db.query("crmFollowUpTypes").collect();
    if (existing.length > 0) return { seeded: 0, message: "Follow-up types already exist" };

    const now = Date.now();
    for (const t of DEFAULT_TYPES) {
      await ctx.db.insert("crmFollowUpTypes", {
        name: t.name,
        code: t.code,
        followUpCategory: t.category,
        requiresReminder: t.reminder,
        defaultReminderDays: t.days,
        color: t.color,
        icon: t.icon,
        description: t.description,
        sequence: DEFAULT_TYPES.indexOf(t) + 1,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: DEFAULT_TYPES.length, message: "Default follow-up types created" };
  }),
});
