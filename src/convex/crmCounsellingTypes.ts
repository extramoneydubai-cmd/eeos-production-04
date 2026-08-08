import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA = [
  {
    name: "Academic Counselling",
    code: "ACADEMIC",
    counsellingMode: "Academic",
    durationMinutes: 30,
    description: "Guidance on academic programs, course selection, and learning paths",
    color: "#1a73e8",
    icon: "BookOpen",
  },
  {
    name: "Career Counselling",
    code: "CAREER",
    counsellingMode: "Career",
    durationMinutes: 45,
    description: "Career guidance and future planning for students",
    color: "#34a853",
    icon: "Briefcase",
  },
  {
    name: "Parent Counselling",
    code: "PARENT",
    counsellingMode: "Parent",
    durationMinutes: 30,
    description: "Counselling sessions designed for parents of prospective students",
    color: "#a855f7",
    icon: "Heart",
  },
  {
    name: "Fee Counselling",
    code: "FEE",
    counsellingMode: "Finance",
    durationMinutes: 20,
    description: "Detailed fee structure explanation and financial planning",
    color: "#d4a017",
    icon: "DollarSign",
  },
  {
    name: "Online Counselling",
    code: "ONLINE",
    counsellingMode: "Online",
    durationMinutes: 30,
    description: "Virtual counselling conducted via online platforms",
    color: "#4285f4",
    icon: "Monitor",
  },
  {
    name: "Offline Counselling",
    code: "OFFLINE",
    counsellingMode: "Offline",
    durationMinutes: 30,
    description: "In-person counselling conducted at the campus or office",
    color: "#e8710a",
    icon: "Building",
  },
  {
    name: "Video Counselling",
    code: "VIDEO",
    counsellingMode: "Online",
    durationMinutes: 30,
    description: "Counselling conducted via video call platforms",
    color: "#4f46e5",
    icon: "Video",
  },
  {
    name: "Phone Counselling",
    code: "PHONE",
    counsellingMode: "Online",
    durationMinutes: 15,
    description: "Counselling conducted over a phone call",
    color: "#0d9488",
    icon: "Phone",
  },
  {
    name: "Walk-in Counselling",
    code: "WALKIN",
    counsellingMode: "Offline",
    durationMinutes: 20,
    description: "Unscheduled counselling for walk-in visitors",
    color: "#5f6368",
    icon: "DoorOpen",
  },
  {
    name: "Group Counselling",
    code: "GROUP",
    counsellingMode: "Offline",
    durationMinutes: 60,
    description: "Counselling session conducted for a group of prospects",
    color: "#e91e63",
    icon: "Users",
  },
];

/* ────────────
   HELPERS
   ──────────── */

function baseFields(data: (typeof SEED_DATA)[number], sequence: number) {
  return {
    name: data.name,
    code: data.code,
    counsellingMode: data.counsellingMode,
    durationMinutes: data.durationMinutes,
    description: data.description,
    color: data.color,
    icon: data.icon,
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
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmCounsellingTypes" }, async (ctx) => {
    const existing = await ctx.db
      .query("crmCounsellingTypes")
      .withIndex("sequence")
      .collect();

    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };

    let count = 0;
    for (let i = 0; i < SEED_DATA.length; i++) {
      await ctx.db.insert("crmCounsellingTypes", baseFields(SEED_DATA[i], i));
      count++;
    }
    return { seeded: count };
  }),
});

export const createCounsellingType = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    counsellingMode: v.string(),
    durationMinutes: v.optional(v.number()),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmCounsellingTypes" }, async (ctx, args) => {
    const all = await ctx.db
      .query("crmCounsellingTypes")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m: any, r: any) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("crmCounsellingTypes", {
      ...args,
      description: args.description ?? "",
      sequence: maxSeq + 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const updateCounsellingType = mutation({
  args: { token: v.optional(v.string()),
    id: v.id("crmCounsellingTypes"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    counsellingMode: v.optional(v.string()),
    durationMinutes: v.optional(v.number()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmCounsellingTypes" }, async (ctx, args) => {
    const { token: _token, id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Counselling type not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  }),
});

export const deleteCounsellingType = mutation({
  args: { token: v.optional(v.string()), id: v.id("crmCounsellingTypes") },
  handler: withScopeAndEvents({ operation: "delete", module: "crm", entity: "crmCounsellingTypes" }, async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Counselling type not found");
    await ctx.db.delete(args.id);
  }),
});

export const duplicateCounsellingType = mutation({
  args: { token: v.optional(v.string()), id: v.id("crmCounsellingTypes") },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmCounsellingTypes" }, async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("Counselling type not found");
    const all = await ctx.db
      .query("crmCounsellingTypes")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m: any, r: any) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("crmCounsellingTypes", {
      name: `${source.name} (Copy)`,
      code: `${source.code}_COPY`,
      counsellingMode: source.counsellingMode,
      durationMinutes: source.durationMinutes,
      description: source.description,
      color: source.color,
      icon: source.icon,
      sequence: maxSeq + 1,
      active: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const reorderCounsellingTypes = mutation({
  args: { token: v.optional(v.string()),
    orderedIds: v.array(v.id("crmCounsellingTypes")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmCounsellingTypes" }, async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], {
        sequence: i,
        updatedAt: Date.now(),
      });
    }
  }),
});

/* ────────────
   QUERIES
   ──────────── */

export const listCounsellingTypes = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("crmCounsellingTypes")
      .withIndex("sequence")
      .collect();
  },
});

export const getCounsellingType = query({
  args: { id: v.id("crmCounsellingTypes") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
