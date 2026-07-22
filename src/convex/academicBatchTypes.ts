import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const DELIVERY_MODES = [
  "Offline",
  "Online",
  "Hybrid",
] as const;

export const TIMING_CATEGORIES = [
  "Morning",
  "Afternoon",
  "Evening",
  "Night",
  "Weekend",
  "Flexible",
] as const;

const SEED_DATA: Array<{
  name: string;
  code: string;
  deliveryMode: string;
  timingCategory: string;
  color: string;
  icon: string;
  description: string;
}> = [
  { name: "Morning Batch", code: "MORNING", deliveryMode: "Offline", timingCategory: "Morning", color: "#fbbc04", icon: "Sun", description: "Regular morning batch starting early in the day." },
  { name: "Evening Batch", code: "EVENING", deliveryMode: "Offline", timingCategory: "Evening", color: "#e8710a", icon: "Moon", description: "Regular evening batch after school or work hours." },
  { name: "Weekend Batch", code: "WEEKEND", deliveryMode: "Offline", timingCategory: "Weekend", color: "#a855f7", icon: "Calendar", description: "Batch conducted on Saturdays and Sundays only." },
  { name: "Foundation Batch", code: "FOUNDATION", deliveryMode: "Offline", timingCategory: "Morning", color: "#4285f4", icon: "Layers", description: "Long-duration foundation programme with comprehensive coverage." },
  { name: "Regular Batch", code: "REGULAR", deliveryMode: "Offline", timingCategory: "Morning", color: "#34a853", icon: "BookOpen", description: "Standard batch following the regular academic schedule." },
  { name: "Crash Batch", code: "CRASH", deliveryMode: "Offline", timingCategory: "Morning", color: "#ea4335", icon: "Zap", description: "Intensive short-duration batch for rapid revision." },
  { name: "Revision Batch", code: "REVISION", deliveryMode: "Offline", timingCategory: "Evening", color: "#06b6d4", icon: "RefreshCw", description: "Focused revision and practice batch before exams." },
  { name: "Hybrid Batch", code: "HYBRID", deliveryMode: "Hybrid", timingCategory: "Morning", color: "#0d9488", icon: "Monitor", description: "Combined offline and online attendance option." },
  { name: "Online Batch", code: "ONLINE", deliveryMode: "Online", timingCategory: "Flexible", color: "#4f46e5", icon: "Globe", description: "Fully online batch with live and recorded sessions." },
  { name: "Fast Track Batch", code: "FAST_TRACK", deliveryMode: "Hybrid", timingCategory: "Evening", color: "#f43f5e", icon: "TrendingUp", description: "Accelerated batch for advanced learners with condensed curriculum." },
];

export const listAcademicBatchTypes = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("academicBatchTypes").collect();
    return items.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

export const getAcademicBatchType = query({
  args: { batchTypeId: v.id("academicBatchTypes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.batchTypeId);
  },
});

export const createAcademicBatchType = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    deliveryMode: v.string(),
    timingCategory: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const allItems = await ctx.db.query("academicBatchTypes").collect();
    const maxSeq = allItems.reduce((max, b) => Math.max(max, b.displayOrder), 0);
    const now = Date.now();
    return await ctx.db.insert("academicBatchTypes", {
      name: args.name,
      code: args.code,
      deliveryMode: args.deliveryMode,
      timingCategory: args.timingCategory,
      description: args.description,
      color: args.color,
      icon: args.icon,
      displayOrder: maxSeq + 1,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateAcademicBatchType = mutation({
  args: {
    batchTypeId: v.id("academicBatchTypes"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    deliveryMode: v.optional(v.string()),
    timingCategory: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { batchTypeId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(batchTypeId, updates);
  },
});

export const deleteAcademicBatchType = mutation({
  args: { batchTypeId: v.id("academicBatchTypes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.batchTypeId);
  },
});

export const duplicateAcademicBatchType = mutation({
  args: { batchTypeId: v.id("academicBatchTypes") },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.batchTypeId);
    if (!original) throw new Error("Academic batch type not found");
    const allItems = await ctx.db.query("academicBatchTypes").collect();
    const maxSeq = allItems.reduce((max, b) => Math.max(max, b.displayOrder), 0);
    const now = Date.now();
    await ctx.db.insert("academicBatchTypes", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
      deliveryMode: original.deliveryMode,
      timingCategory: original.timingCategory,
      description: original.description,
      color: original.color,
      icon: original.icon,
      displayOrder: maxSeq + 1,
      isActive: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const reorderAcademicBatchTypes = mutation({
  args: {
    batchTypeIds: v.array(v.id("academicBatchTypes")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.batchTypeIds.length; i++) {
      await ctx.db.patch(args.batchTypeIds[i], { displayOrder: i + 1, updatedAt: now });
    }
  },
});

export const seedDefaultAcademicBatchTypes = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("academicBatchTypes").collect();
    if (existing.length > 0) return { seeded: 0, message: "Academic batch types already exist" };

    const now = Date.now();
    for (let i = 0; i < SEED_DATA.length; i++) {
      const seed = SEED_DATA[i];
      await ctx.db.insert("academicBatchTypes", {
        name: seed.name,
        code: seed.code,
        deliveryMode: seed.deliveryMode,
        timingCategory: seed.timingCategory,
        description: seed.description,
        color: seed.color,
        icon: seed.icon,
        displayOrder: i + 1,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: SEED_DATA.length, message: "Default academic batch types created" };
  },
});
