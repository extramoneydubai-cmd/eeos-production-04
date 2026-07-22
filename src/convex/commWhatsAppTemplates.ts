import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  { name: "Greeting", code: "GREETING", templateCategory: "Greeting", bodyPreview: "Hello {{name}}! Welcome to {{org}}. How can we help?", description: "Initial WhatsApp greeting", color: "#25D366", icon: "MessageCircle" },
  { name: "Follow Up", code: "FOLLOWUP", templateCategory: "Follow-up", bodyPreview: "Hi {{name}}, just checking in on your enquiry.", description: "Follow-up message for leads", color: "#4285f4", icon: "MessageCircle" },
  { name: "Payment Reminder", code: "PAY_REM", templateCategory: "Reminder", bodyPreview: "Reminder: Payment of {{amount}} is due on {{date}}.", description: "WhatsApp payment reminder", color: "#f59e0b", icon: "MessageCircle" },
  { name: "Offer Alert", code: "OFFER", templateCategory: "Promotional", bodyPreview: "Special offer! Get {{discount}} off on {{program}}.", description: "Promotional offer broadcast", color: "#ea4335", icon: "MessageCircle" },
  { name: "Admission Update", code: "ADM_UPD", templateCategory: "Alert", bodyPreview: "Your application {{id}} status has changed to {{status}}.", description: "Admission status update", color: "#34a853", icon: "MessageCircle" },
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
      .query("commWhatsAppTemplates")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (const data of SEED_DATA) {
      await ctx.db.insert("commWhatsAppTemplates", baseFields(data, count));
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
    bodyPreview: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("commWhatsAppTemplates")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("commWhatsAppTemplates", {
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
    id: v.id("commWhatsAppTemplates"),
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
    if (!existing) throw new Error("WhatsAppTemplate not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("commWhatsAppTemplates") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("WhatsAppTemplate not found");
    await ctx.db.delete(args.id);
  },
});

export const duplicate = mutation({
  args: { id: v.id("commWhatsAppTemplates") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("WhatsAppTemplate not found");
    const all = await ctx.db
      .query("commWhatsAppTemplates")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("commWhatsAppTemplates", {
      name: `${source.name} (Copy)`,
      code: `${source.code}_COPY`,      sequence: maxSeq + 1,
      active: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const reorder = mutation({
  args: { orderedIds: v.array(v.id("commWhatsAppTemplates")) },
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
    return ctx.db.query("commWhatsAppTemplates").withIndex("sequence").collect();
  },
});

export const get = query({
  args: { id: v.id("commWhatsAppTemplates") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
