import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  { name: "Welcome Email", code: "WELCOME", templateCategory: "Onboarding", subject: "Welcome to {{organization_name}}!", bodyPreview: "Dear {{name}}, welcome aboard...", description: "Welcome email for new users", color: "#4285f4", icon: "Mail" },
  { name: "Payment Receipt", code: "RECEIPT", templateCategory: "Transactional", subject: "Payment Receipt - {{invoice_number}}", bodyPreview: "Thank you for your payment of {{amount}}...", description: "Payment confirmation receipt", color: "#34a853", icon: "Mail" },
  { name: "Fee Reminder", code: "FEE_REM", templateCategory: "Reminder", subject: "Fee Payment Reminder - {{due_date}}", bodyPreview: "This is a reminder that your fee payment...", description: "Fee due date reminder", color: "#f59e0b", icon: "Mail" },
  { name: "Admission Offer", code: "ADM_OFFER", templateCategory: "Notification", subject: "Admission Offer - {{program_name}}", bodyPreview: "Congratulations! We are pleased to offer you admission...", description: "Admission offer letter", color: "#a855f7", icon: "Mail" },
  { name: "Newsletter", code: "NEWS", templateCategory: "Newsletter", subject: "{{org}} Newsletter - {{month}}", bodyPreview: "Here's what's happening...", description: "Monthly newsletter", color: "#0d9488", icon: "Mail" },
  { name: "Follow Up", code: "FOLLOWUP", templateCategory: "Follow-up", subject: "Following up on your enquiry", bodyPreview: "We noticed you recently enquired...", description: "Lead follow-up email", color: "#06b6d4", icon: "Mail" },
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
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("commEmailTemplates")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (const data of SEED_DATA) {
      await ctx.db.insert("commEmailTemplates", baseFields(data, count));
      count++;
    }
    return { seeded: count };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    templateCategory: v.string(),
    subject: v.string(),
    bodyPreview: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("commEmailTemplates")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("commEmailTemplates", {
      ...args,
      description: args.description ?? "",
      sequence: maxSeq + 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("commEmailTemplates"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("EmailTemplate not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("commEmailTemplates") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("EmailTemplate not found");
    await ctx.db.delete(args.id);
  },
});

export const duplicate = mutation({
  args: { id: v.id("commEmailTemplates") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("EmailTemplate not found");
    const all = await ctx.db
      .query("commEmailTemplates")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("commEmailTemplates", {
      name: `${source.name} (Copy)`,
      code: `${source.code}_COPY`,
      color: source.color,
      icon: source.icon,
      templateCategory: source.templateCategory,
      subject: source.subject,
      bodyPreview: source.bodyPreview,
      description: source.description,
      sequence: maxSeq + 1,
      active: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const reorder = mutation({
  args: { orderedIds: v.array(v.id("commEmailTemplates")) },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { sequence: i, updatedAt: Date.now() });
    }
  },
});

/* ────────────
   QUERIES
   ──────────── */

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("commEmailTemplates").withIndex("sequence").collect();
  },
});

export const get = query({
  args: { id: v.id("commEmailTemplates") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
