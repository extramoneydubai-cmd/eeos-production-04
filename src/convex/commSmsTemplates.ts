import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  { name: "OTP Verification", code: "OTP", templateCategory: "OTP", bodyPreview: "Your OTP for login is {{otp}}. Valid for 5 minutes.", description: "One-time password for authentication", color: "#4285f4", icon: "MessageSquare" },
  { name: "Payment Reminder", code: "PAY_REM", templateCategory: "Reminder", bodyPreview: "Dear {{name}}, your fee payment of {{amount}} is due on {{date}}.", description: "Payment due date SMS reminder", color: "#f59e0b", icon: "MessageSquare" },
  { name: "Admission Alert", code: "ADM_ALERT", templateCategory: "Alert", bodyPreview: "Admission update: Your application {{id}} status has been updated.", description: "Admission status alert", color: "#34a853", icon: "MessageSquare" },
  { name: "Welcome SMS", code: "WELCOME", templateCategory: "Transactional", bodyPreview: "Welcome to {{org}}! Your account has been created.", description: "Welcome SMS for new registrations", color: "#a855f7", icon: "MessageSquare" },
  { name: "Follow Up", code: "FOLLOWUP", templateCategory: "Follow-up", bodyPreview: "Hi {{name}}, this is {{org}}. We'd love to connect with you.", description: "Lead follow-up SMS", color: "#0d9488", icon: "MessageSquare" },
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
  handler: withScopeAndEvents({ operation: "create", module: "communication", entity: "commSmsTemplates" }, async (ctx) => {
    const existing = await ctx.db
      .query("commSmsTemplates")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (const data of SEED_DATA) {
      await ctx.db.insert("commSmsTemplates", baseFields(data, count));
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
    templateCategory: v.string(),
    bodyPreview: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "create", module: "communication", entity: "commSmsTemplates" }, async (ctx, args) => {
    const all = await ctx.db
      .query("commSmsTemplates")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m: any, r: any) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("commSmsTemplates", {
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
    id: v.id("commSmsTemplates"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "communication", entity: "commSmsTemplates" }, async (ctx, args) => {
    const { token: _token, id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("SmsTemplate not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  }),
});

export const remove = mutation({
  args: { token: v.optional(v.string()), id: v.id("commSmsTemplates") },
  handler: withScopeAndEvents({ operation: "delete", module: "communication", entity: "commSmsTemplates" }, async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("SmsTemplate not found");
    await ctx.db.delete(args.id);
  }),
});

export const duplicate = mutation({
  args: { token: v.optional(v.string()), id: v.id("commSmsTemplates") },
  handler: withScopeAndEvents({ operation: "create", module: "communication", entity: "commSmsTemplates" }, async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("SmsTemplate not found");
    const all = await ctx.db
      .query("commSmsTemplates")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m: any, r: any) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("commSmsTemplates", {
      name: `${source.name} (Copy)`,
      code: `${source.code}_COPY`,
      templateCategory: source.templateCategory,
      bodyPreview: source.bodyPreview,
      color: source.color,
      icon: source.icon,
      sequence: maxSeq + 1,
      active: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const reorder = mutation({
  args: { token: v.optional(v.string()), orderedIds: v.array(v.id("commSmsTemplates")) },
  handler: withScopeAndEvents({ operation: "update", module: "communication", entity: "commSmsTemplates" }, async (ctx, args) => {
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
    return ctx.db.query("commSmsTemplates").withIndex("sequence").collect();
  },
});

export const get = query({
  args: { id: v.id("commSmsTemplates") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
