import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  { name: "Task Assignment", code: "TASK_ASSIGN", channelType: "In-App", description: "When a task is assigned to a user", color: "#4285f4", icon: "ClipboardList" },
  { name: "Approval Request", code: "APPROVAL", channelType: "In-App", description: "When approval is requested", color: "#a855f7", icon: "CheckCircle" },
  { name: "Payment Reminder", code: "PAY_REMIND", channelType: "SMS", description: "Payment due date reminders", color: "#f59e0b", icon: "Bell" },
  { name: "Welcome Email", code: "WELCOME", channelType: "Email", description: "New user welcome notifications", color: "#34a853", icon: "Mail" },
  { name: "WhatsApp Alert", code: "WA_ALERT", channelType: "WhatsApp", description: "Urgent WhatsApp notifications", color: "#25D366", icon: "MessageCircle" },
  { name: "System Alert", code: "SYS_ALERT", channelType: "All", description: "Critical system alerts via all channels", color: "#ea4335", icon: "AlertTriangle" },
  { name: "Follow-up Reminder", code: "FOLLOWUP", channelType: "In-App", description: "Reminders for pending follow-ups", color: "#0d9488", icon: "Bell" },
  { name: "Announcement", code: "ANNOUNCE", channelType: "Email", description: "General announcements and updates", color: "#06b6d4", icon: "Megaphone" },
];

/* ────────────
   HELPERS
   ──────────── */

function baseFields(data: (typeof SEED_DATA)[number], sequence: number) {
  return {
    ...data,
    sequence,
    active: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/* ────────────
   MUTATIONS
   ──────────── */

export const seedDefault = mutation({
  args: { token: v.optional(v.string()),},
  handler: withScopeAndEvents({ operation: "create", module: "communication", entity: "commNotificationTypes" }, async (ctx) => {
    const existing = await ctx.db
      .query("commNotificationTypes")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (const data of SEED_DATA) {
      await ctx.db.insert("commNotificationTypes", baseFields(data, count));
      count++;
    }
    return { seeded: count };
  }),
});

export const create = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    channelType: v.string(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "communication", entity: "commNotificationTypes" }, async (ctx, args) => {
    const all = await ctx.db
      .query("commNotificationTypes")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m: any, r: any) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("commNotificationTypes", {
      ...args,
      description: args.description ?? "",
      sequence: maxSeq + 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const update = mutation({
  args: { token: v.optional(v.string()),
    id: v.id("commNotificationTypes"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    channelType: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "communication", entity: "commNotificationTypes" }, async (ctx, args) => {
    const { token: _token, id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("NotificationType not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  }),
});

export const remove = mutation({
  args: { token: v.optional(v.string()), id: v.id("commNotificationTypes") },
  handler: withScopeAndEvents({ operation: "delete", module: "communication", entity: "commNotificationTypes" }, async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("NotificationType not found");
    await ctx.db.delete(args.id);
  }),
});

export const duplicate = mutation({
  args: { token: v.optional(v.string()), id: v.id("commNotificationTypes") },
  handler: withScopeAndEvents({ operation: "create", module: "communication", entity: "commNotificationTypes" }, async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("NotificationType not found");
    const all = await ctx.db
      .query("commNotificationTypes")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m: any, r: any) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("commNotificationTypes", {
      name: `${source.name} (Copy)`,
      code: `${source.code}_COPY`,
      color: source.color,
      icon: source.icon,
      channelType: source.channelType,
      description: source.description,
      sequence: maxSeq + 1,
      active: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const reorder = mutation({
  args: { token: v.optional(v.string()), orderedIds: v.array(v.id("commNotificationTypes")) },
  handler: withScopeAndEvents({ operation: "update", module: "communication", entity: "commNotificationTypes" }, async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { sequence: i, updatedAt: Date.now() });
    }
  }),
});

/* ────────────
   QUERIES
   ──────────── */

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("commNotificationTypes").withIndex("sequence").collect();
  },
});

export const get = query({
  args: { id: v.id("commNotificationTypes") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
