import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

const DEFAULT_UTM_SOURCES = [
  { name: "Google", code: "google", color: "#4285f4", icon: "Search", description: "UTM source for Google organic and paid traffic", sequence: 1 },
  { name: "Facebook", code: "facebook", color: "#1877F2", icon: "Facebook", description: "UTM source for Facebook traffic", sequence: 2 },
  { name: "Instagram", code: "instagram", color: "#E4405F", icon: "Instagram", description: "UTM source for Instagram traffic", sequence: 3 },
  { name: "LinkedIn", code: "linkedin", color: "#0A66C2", icon: "Linkedin", description: "UTM source for LinkedIn traffic", sequence: 4 },
  { name: "YouTube", code: "youtube", color: "#FF0000", icon: "Youtube", description: "UTM source for YouTube traffic", sequence: 5 },
  { name: "Newsletter", code: "newsletter", color: "#a855f7", icon: "Mail", description: "UTM source for email newsletter traffic", sequence: 6 },
  { name: "Email", code: "email", color: "#ea4335", icon: "Mail", description: "UTM source for general email traffic", sequence: 7 },
  { name: "WhatsApp", code: "whatsapp", color: "#25D366", icon: "MessageCircle", description: "UTM source for WhatsApp traffic", sequence: 8 },
  { name: "SMS", code: "sms", color: "#34a853", icon: "MessageSquare", description: "UTM source for SMS traffic", sequence: 9 },
  { name: "Referral", code: "referral", color: "#d4a017", icon: "UserPlus", description: "UTM source for referral traffic", sequence: 10 },
  { name: "Partner", code: "partner", color: "#4f46e5", icon: "Handshake", description: "UTM source for partner website traffic", sequence: 11 },
  { name: "Website", code: "website", color: "#0d9488", icon: "Globe", description: "UTM source for direct website traffic", sequence: 12 },
];

export const listUtmSources = query({
  args: {},
  handler: async (ctx) => {
    const sources = await ctx.db.query("crmUtmSources").collect();
    return sources.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getUtmSource = query({
  args: { utmSourceId: v.id("crmUtmSources") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.utmSourceId);
  },
});

export const createUtmSource = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmUtmSources" }, async (ctx, args) => {
    const all = await ctx.db.query("crmUtmSources").collect();
    const maxSeq = all.reduce((max: any, s: any) => Math.max(max, s.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("crmUtmSources", {
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

export const updateUtmSource = mutation({
  args: { token: v.optional(v.string()),
    utmSourceId: v.id("crmUtmSources"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmUtmSources" }, async (ctx, args) => {
    const { token: _token, utmSourceId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(utmSourceId, updates);
  }),
});

export const deleteUtmSource = mutation({
  args: { token: v.optional(v.string()), utmSourceId: v.id("crmUtmSources") },
  handler: withScopeAndEvents({ operation: "delete", module: "crm", entity: "crmUtmSources" }, async (ctx, args) => {
    await ctx.db.delete(args.utmSourceId);
  }),
});

export const duplicateUtmSource = mutation({
  args: { token: v.optional(v.string()), utmSourceId: v.id("crmUtmSources") },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmUtmSources" }, async (ctx, args) => {
    const original = await ctx.db.get(args.utmSourceId);
    if (!original) throw new Error("UTM source not found");
    const all = await ctx.db.query("crmUtmSources").collect();
    const maxSeq = all.reduce((max: any, s: any) => Math.max(max, s.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("crmUtmSources", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_copy`,
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

export const reorderUtmSources = mutation({
  args: { token: v.optional(v.string()),
    utmSourceIds: v.array(v.id("crmUtmSources")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmUtmSources" }, async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.utmSourceIds.length; i++) {
      await ctx.db.patch(args.utmSourceIds[i], { sequence: i + 1, updatedAt: now });
    }
  }),
});

export const seedDefaultUtmSources = mutation({
  args: { token: v.optional(v.string()),},
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmUtmSources" }, async (ctx) => {
    const existing = await ctx.db.query("crmUtmSources").collect();
    if (existing.length > 0) return { seeded: 0, message: "UTM sources already exist" };

    const now = Date.now();
    for (const source of DEFAULT_UTM_SOURCES) {
      await ctx.db.insert("crmUtmSources", {
        ...source,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: DEFAULT_UTM_SOURCES.length, message: "Default UTM sources created" };
  }),
});
