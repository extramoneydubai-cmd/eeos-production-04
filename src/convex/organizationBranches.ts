import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DEFAULT_BRANCHES = [
  {
    name: "Dubai Main Campus",
    code: "DXB_MAIN",
    color: "#4285f4",
    icon: "Building2",
    city: "Dubai",
    state: "Dubai",
    country: "UAE",
    address: "Sheikh Zayed Road, Trade Centre Area",
    phone: "+971 4 123 4567",
    email: "dubai.main@eeos.edu",
    managerName: "Ahmed Al Maktoum",
    displayOrder: 1,
  },
  {
    name: "Abu Dhabi Campus",
    code: "AUH",
    color: "#34a853",
    icon: "Landmark",
    city: "Abu Dhabi",
    state: "Abu Dhabi",
    country: "UAE",
    address: "Corniche Road, Al Maryah Island",
    phone: "+971 2 234 5678",
    email: "abudhabi@eeos.edu",
    managerName: "Fatima Al Nahyan",
    displayOrder: 2,
  },
  {
    name: "Sharjah Campus",
    code: "SHJ",
    color: "#fbbc04",
    icon: "University",
    city: "Sharjah",
    state: "Sharjah",
    country: "UAE",
    address: "Al Qasimia, University City Road",
    phone: "+971 6 345 6789",
    email: "sharjah@eeos.edu",
    managerName: "Saeed Al Qasimi",
    displayOrder: 3,
  },
  {
    name: "Ajman Campus",
    code: "AJM",
    color: "#a855f7",
    icon: "MapPin",
    city: "Ajman",
    state: "Ajman",
    country: "UAE",
    address: "Al Jurf Industrial Area, Sheikh Maktoum Road",
    phone: "+971 6 456 7890",
    email: "ajman@eeos.edu",
    managerName: "Noura Al Nuaimi",
    displayOrder: 4,
  },
  {
    name: "Al Ain Campus",
    code: "ALAIN",
    color: "#e8710a",
    icon: "Mountain",
    city: "Al Ain",
    state: "Abu Dhabi",
    country: "UAE",
    address: "Oasis Area, Al Jimi District",
    phone: "+971 3 567 8901",
    email: "alain@eeos.edu",
    managerName: "Khalid Al Dhaheri",
    displayOrder: 5,
  },
];

export const listBranches = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("orgBranches").collect();
    return items.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

export const getBranch = query({
  args: { branchId: v.id("orgBranches") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.branchId);
  },
});

export const createBranch = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    color: v.string(),
    icon: v.string(),
    city: v.string(),
    state: v.string(),
    country: v.string(),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    managerName: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const allItems = await ctx.db.query("orgBranches").collect();
    const maxSeq = allItems.reduce((max, b) => Math.max(max, b.displayOrder), 0);
    const now = Date.now();
    return await ctx.db.insert("orgBranches", {
      name: args.name,
      code: args.code,
      color: args.color,
      icon: args.icon,
      city: args.city,
      state: args.state,
      country: args.country,
      address: args.address,
      phone: args.phone,
      email: args.email,
      managerName: args.managerName,
      displayOrder: maxSeq + 1,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateBranch = mutation({
  args: {
    branchId: v.id("orgBranches"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    managerName: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { branchId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(branchId, updates);
  },
});

export const deleteBranch = mutation({
  args: { branchId: v.id("orgBranches") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.branchId);
  },
});

export const duplicateBranch = mutation({
  args: { branchId: v.id("orgBranches") },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.branchId);
    if (!original) throw new Error("Branch not found");
    const allItems = await ctx.db.query("orgBranches").collect();
    const maxSeq = allItems.reduce((max, b) => Math.max(max, b.displayOrder), 0);
    const now = Date.now();
    await ctx.db.insert("orgBranches", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
      color: original.color,
      icon: original.icon,
      city: original.city,
      state: original.state,
      country: original.country,
      address: original.address,
      phone: original.phone,
      email: original.email,
      managerName: original.managerName,
      displayOrder: maxSeq + 1,
      isActive: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const reorderBranches = mutation({
  args: {
    branchIds: v.array(v.id("orgBranches")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.branchIds.length; i++) {
      await ctx.db.patch(args.branchIds[i], { displayOrder: i + 1, updatedAt: now });
    }
  },
});

export const seedDefaultBranches = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("orgBranches").collect();
    if (existing.length > 0) return { seeded: 0, message: "Branches already exist" };

    const now = Date.now();
    for (const item of DEFAULT_BRANCHES) {
      await ctx.db.insert("orgBranches", {
        ...item,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: DEFAULT_BRANCHES.length, message: "Default branches created" };
  },
});
