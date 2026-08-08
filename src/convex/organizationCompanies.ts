import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

const DEFAULT_COMPANIES = [
  {
    name: "Veda EdTech Pvt Ltd",
    code: "VEDA_MAIN",
    legalName: "Veda EdTech Private Limited",
    registrationNumber: "U80301KA2025PTC123456",
    taxNumber: "29AABCU1234D1ZV",
    color: "#1a1a2e",
    icon: "Building2",
    email: "corporate@vedaedtech.com",
    phone: "+971 4 800 8332",
    website: "https://www.vedaedtech.com",
    address: "Level 15, Business Bay, Sheikh Zayed Road",
    city: "Dubai",
    state: "Dubai",
    country: "UAE",
    logoUrl: "",
    displayOrder: 1,
  },
  {
    name: "Veda Skill Academy",
    code: "VEDA_SKILL",
    legalName: "Veda Skill Academy LLC",
    registrationNumber: "U80302KA2025PTC789012",
    taxNumber: "29AABCU5678E1ZW",
    color: "#1a73e8",
    icon: "GraduationCap",
    email: "academy@vedaedtech.com",
    phone: "+971 4 800 8333",
    website: "https://academy.vedaedtech.com",
    address: "Knowledge Park, Al Sufouh",
    city: "Dubai",
    state: "Dubai",
    country: "UAE",
    logoUrl: "",
    displayOrder: 2,
  },
  {
    name: "Veda Foundation",
    code: "VEDA_FOUND",
    legalName: "Veda Education Foundation",
    registrationNumber: "U80303KA2025NGO345678",
    taxNumber: "29AAECV9012H1ZP",
    color: "#34a853",
    icon: "Heart",
    email: "foundation@vedaedtech.com",
    phone: "+971 2 800 8334",
    website: "https://foundation.vedaedtech.com",
    address: "Al Maryah Island, Abu Dhabi",
    city: "Abu Dhabi",
    state: "Abu Dhabi",
    country: "UAE",
    logoUrl: "",
    displayOrder: 3,
  },
];

export const listCompanies = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("orgCompanies").collect();
    return items.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

export const getCompany = query({
  args: { companyId: v.id("orgCompanies") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.companyId);
  },
});

export const createCompany = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    color: v.string(),
    icon: v.string(),
    legalName: v.optional(v.string()),
    registrationNumber: v.optional(v.string()),
    taxNumber: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    country: v.string(),
    logoUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "organization", entity: "organizationCompanies" }, async (ctx, args) => {
    const allItems = await ctx.db.query("orgCompanies").collect();
    const maxSeq = allItems.reduce((max: any, c: any) => Math.max(max, c.displayOrder), 0);
    const now = Date.now();
    return await ctx.db.insert("orgCompanies", {
      name: args.name,
      code: args.code,
      color: args.color,
      icon: args.icon,
      legalName: args.legalName,
      registrationNumber: args.registrationNumber,
      taxNumber: args.taxNumber,
      email: args.email,
      phone: args.phone,
      website: args.website,
      address: args.address,
      city: args.city,
      state: args.state,
      country: args.country,
      logoUrl: args.logoUrl,
      description: args.description,
      displayOrder: maxSeq + 1,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const updateCompany = mutation({
  args: { token: v.optional(v.string()),
    companyId: v.id("orgCompanies"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    legalName: v.optional(v.string()),
    registrationNumber: v.optional(v.string()),
    taxNumber: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "organization", entity: "organizationCompanies" }, async (ctx, args) => {
    const { token: _token, companyId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(companyId, updates);
  }),
});

export const deleteCompany = mutation({
  args: { token: v.optional(v.string()), companyId: v.id("orgCompanies") },
  handler: withScopeAndEvents({ operation: "delete", module: "organization", entity: "organizationCompanies" }, async (ctx, args) => {
    await ctx.db.delete(args.companyId);
  }),
});

export const duplicateCompany = mutation({
  args: { token: v.optional(v.string()), companyId: v.id("orgCompanies") },
  handler: withScopeAndEvents({ operation: "create", module: "organization", entity: "organizationCompanies" }, async (ctx, args) => {
    const original = await ctx.db.get(args.companyId);
    if (!original) throw new Error("Company not found");
    const allItems = await ctx.db.query("orgCompanies").collect();
    const maxSeq = allItems.reduce((max: any, c: any) => Math.max(max, c.displayOrder), 0);
    const now = Date.now();
    await ctx.db.insert("orgCompanies", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_COPY`,
      color: original.color,
      icon: original.icon,
      legalName: original.legalName,
      registrationNumber: original.registrationNumber,
      taxNumber: original.taxNumber,
      email: original.email,
      phone: original.phone,
      website: original.website,
      address: original.address,
      city: original.city,
      state: original.state,
      country: original.country,
      logoUrl: original.logoUrl,
      description: original.description,
      displayOrder: maxSeq + 1,
      isActive: false,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const reorderCompanies = mutation({
  args: { token: v.optional(v.string()),
    companyIds: v.array(v.id("orgCompanies")),
  },
  handler: withScopeAndEvents({ operation: "update", module: "organization", entity: "organizationCompanies" }, async (ctx, args) => {
    const now = Date.now();
    for (let i = 0; i < args.companyIds.length; i++) {
      await ctx.db.patch(args.companyIds[i], { displayOrder: i + 1, updatedAt: now });
    }
  }),
});

export const seedDefaultCompanies = mutation({
  args: { token: v.optional(v.string()),},
  handler: withScopeAndEvents({ operation: "create", module: "organization", entity: "organizationCompanies" }, async (ctx) => {
    const existing = await ctx.db.query("orgCompanies").collect();
    if (existing.length > 0) return { seeded: 0, message: "Companies already exist" };

    const now = Date.now();
    for (const item of DEFAULT_COMPANIES) {
      await ctx.db.insert("orgCompanies", {
        ...item,
        description: item.name === "Veda EdTech Pvt Ltd"
          ? "Primary operating entity for EEOS — corporate headquarters and main business operations."
          : item.name === "Veda Skill Academy"
          ? "Specialized skill development and vocational training division."
          : "CSR and charitable initiatives focused on educational access and community development.",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { seeded: DEFAULT_COMPANIES.length, message: "Default companies created" };
  }),
});
