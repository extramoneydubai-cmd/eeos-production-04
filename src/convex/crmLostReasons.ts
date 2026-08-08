import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

const DEFAULT_REASONS = [
  { name: "Joined Another Institute", code: "JOINED_OTHER", color: "#4285f4", icon: "ArrowRightFromLine", description: "Lead enrolled with a competitor institute", sequence: 1 },
  { name: "Fees Too High", code: "FEE_HIGH", color: "#ea4335", icon: "DollarSign", description: "Course fees exceeded the lead's budget", sequence: 2 },
  { name: "Parent Declined", code: "PARENT_DECLINED", color: "#e8710a", icon: "Users", description: "Parents did not approve the enrollment", sequence: 3 },
  { name: "Not Interested", code: "NOT_INTERESTED", color: "#9aa0a6", icon: "ThumbsDown", description: "Lead expressed no interest in the program", sequence: 4 },
  { name: "No Response", code: "NO_RESPONSE", color: "#fbbc04", icon: "BellOff", description: "Lead stopped responding to follow-ups", sequence: 5 },
  { name: "Wrong Number", code: "WRONG_NUM", color: "#5f6368", icon: "PhoneOff", description: "Contact number was incorrect or unreachable", sequence: 6 },
  { name: "Duplicate Enquiry", code: "DUPLICATE", color: "#a855f7", icon: "Copy", description: "Same lead created multiple enquiries", sequence: 7 },
  { name: "Course Not Available", code: "COURSE_NA", color: "#4f46e5", icon: "BookX", description: "Requested course is not offered", sequence: 8 },
  { name: "Batch Timing Issue", code: "BATCH_TIME", color: "#06b6d4", icon: "Clock", description: "Available batch timings did not suit the lead", sequence: 9 },
  { name: "Location Too Far", code: "LOC_FAR", color: "#0d9488", icon: "MapPinOff", description: "Center location was too far from the lead's residence", sequence: 10 },
  { name: "Financial Issue", code: "FINANCIAL", color: "#f43f5e", icon: "Banknote", description: "Lead faced financial constraints", sequence: 11 },
  { name: "Shifted to Another City", code: "SHIFTED", color: "#10b981", icon: "Truck", description: "Lead relocated to a different city", sequence: 12 },
  { name: "Admission Postponed", code: "POSTPONED", color: "#f59e0b", icon: "CalendarOff", description: "Lead decided to postpone admission to a later batch", sequence: 13 },
  { name: "Already Enrolled", code: "ALREADY_ENROLLED", color: "#34a853", icon: "CheckCircle2", description: "Lead was already enrolled in another program", sequence: 14 },
  { name: "Other", code: "OTHER", color: "#6b7280", icon: "Ellipsis", description: "Any other reason not listed above", sequence: 15 },
];

export const listLostReasons = query({
  args: {},
  handler: async (ctx) => {
    const reasons = await ctx.db.query("crmLostReasons").collect();
    return reasons.sort((a, b) => a.sequence - b.sequence);
  },
});

export const getLostReason = query({
  args: { reasonId: v.id("crmLostReasons") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.reasonId);
  },
});

export const createLostReason = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmLostReasons" }, async (ctx, args) => {
    const allReasons = await ctx.db.query("crmLostReasons").collect();
    const maxSeq = allReasons.reduce((max: any, r: any) => Math.max(max, r.sequence), 0);
    const now = Date.now();
    return await ctx.db.insert("crmLostReasons", {
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

export const updateLostReason = mutation({
  args: { token: v.optional(v.string()),
    reasonId: v.id("crmLostReasons"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmLostReasons" }, async (ctx, args) => {
    const { token: _token, reasonId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(reasonId, updates);
  }),
});

export const deleteLostReason = mutation({
  args: { token: v.optional(v.string()), reasonId: v.id("crmLostReasons") },
  handler: withScopeAndEvents({ operation: "delete", module: "crm", entity: "crmLostReasons" }, async (ctx, args) => {
    await ctx.db.delete(args.reasonId);
  }),
});

export const duplicateLostReason = mutation({
  args: { token: v.optional(v.string()), reasonId: v.id("crmLostReasons") },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmLostReasons" }, async (ctx, args) => {
    const original = await ctx.db.get(args.reasonId);
    if (!original) throw new Error("Lost reason not found");
    const allReasons = await ctx.db.query("crmLostReasons").collect();
    const maxSeq = allReasons.reduce((max: any, r: any) => Math.max(max, r.sequence), 0);
    const now = Date.now();
    await ctx.db.insert("crmLostReasons", {
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

export const reorderLostReasons = mutation({
  args: { token: v.optional(v.string()),
    reasonIds: v.array(v.id("crmLostReasons")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmLostReasons" }, async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.reasonIds.length; i++) {
      await ctx.db.patch(args.reasonIds[i], { sequence: i + 1, updatedAt: now });
    }
  }),
});

export const seedDefaultLostReasons = mutation({
  args: { token: v.optional(v.string()),},
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmLostReasons" }, async (ctx) => {
    const existing = await ctx.db.query("crmLostReasons").collect();
    if (existing.length > 0) return { seeded: 0, message: "Lost reasons already exist" };

    const now = Date.now();
    for (const reason of DEFAULT_REASONS) {
      await ctx.db.insert("crmLostReasons", {
        ...reason,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: DEFAULT_REASONS.length, message: "Default lost reasons created" };
  }),
});
