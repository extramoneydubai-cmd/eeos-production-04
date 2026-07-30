/**
 * White Label Platform — Per-Company Branding & Configuration
 *
 * Every company in the EEOS platform can independently configure:
 * - Logo, colors, fonts, theme
 * - Login page, portal URL
 * - Email/SMS/WhatsApp branding templates
 * - Receipt number series, certificate templates
 * - Language, currency, date format, timezone
 * - RTL/LTR layout
 * - Custom labels and terminology
 *
 * All behavior is driven from the whiteLabelConfig table — zero hardcoding.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Default Configuration ────────────────────────────────────

export const DEFAULT_WHITE_LABEL_CONFIG = {
  // Branding
  logo: "",
  favicon: "",
  primaryColor: "#6366f1",
  secondaryColor: "#8b5cf6",
  accentColor: "#06b6d4",
  fontFamily: "Inter, system-ui, sans-serif",
  borderRadius: "0.5rem",

  // Theme
  theme: "light" as "light" | "dark" | "auto",
  sidebarTheme: "dark" as "light" | "dark",
  layoutMode: "sidebar" as "sidebar" | "topbar" | "combined",

  // Localization
  language: "en",
  currency: "INR",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24h",
  timezone: "Asia/Kolkata",
  locale: "en-IN",

  // Login page
  loginTitle: "Sign in to your account",
  loginSubtitle: "Enterprise Education Operating System",
  loginBackgroundColor: "#0f172a",
  loginBackgroundImage: "",
  showPoweredBy: true,

  // Branding on documents/receipts
  documentLogo: "",
  documentPrimaryColor: "#1e293b",
  documentFooter: "This is a system-generated document.",

  // Portal
  portalTitle: "EEOS Portal",
  portalDescription: "Enterprise Education Operating System",

  // Feature visibility
  showHelpCenter: true,
  showWhatsAppButton: true,
  showMobileAppBanner: false,

  // Number series format
  receiptPrefix: "RCP",
  invoicePrefix: "INV",
  certificatePrefix: "CERT",
  ticketPrefix: "TKT",

  // Custom labels (per-module terminology)
  labels: {} as Record<string, string>,
};

export type WhiteLabelConfig = typeof DEFAULT_WHITE_LABEL_CONFIG;

// ─── Queries ───────────────────────────────────────────────────

export const getWhiteLabelConfig = query({
  args: {
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    // Try to find company-specific config
    if (args.companyId) {
      const config = await ctx.db.query("whiteLabelConfig")
        .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
        .first();
      if (config) return (config as any).config as WhiteLabelConfig;
    }

    // Try branch-specific config
    if (args.branchId) {
      const config = await ctx.db.query("whiteLabelConfig")
        .withIndex("by_branch", (q: any) => q.eq("branchId", args.branchId))
        .first();
      if (config) return (config as any).config as WhiteLabelConfig;
    }

    // Fallback to global default
    const globalConfig = await ctx.db.query("whiteLabelConfig")
      .withIndex("by_company", (q: any) => q.eq("companyId", undefined))
      .first();
    if (globalConfig) return (globalConfig as any).config as WhiteLabelConfig;

    return DEFAULT_WHITE_LABEL_CONFIG;
  },
});

export const listWhiteLabelConfigs = query({
  handler: async (ctx) => {
    const configs = await ctx.db.query("whiteLabelConfig").collect();
    return configs.map((c: any) => ({
      _id: c._id,
      companyId: c.companyId,
      branchId: c.branchId,
      companyName: c.companyName || "Global",
      updatedAt: c.updatedAt,
      config: {
        primaryColor: (c as any).config.primaryColor,
        theme: (c as any).config.theme,
        language: (c as any).config.language,
        currency: (c as any).config.currency,
      },
    }));
  },
});

// ─── Mutations ─────────────────────────────────────────────────

export const setWhiteLabelConfig = mutation({
  args: {
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    config: v.object({
      logo: v.optional(v.string()),
      favicon: v.optional(v.string()),
      primaryColor: v.optional(v.string()),
      secondaryColor: v.optional(v.string()),
      accentColor: v.optional(v.string()),
      fontFamily: v.optional(v.string()),
      borderRadius: v.optional(v.string()),
      theme: v.optional(v.union(v.literal("light"), v.literal("dark"), v.literal("auto"))),
      sidebarTheme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
      layoutMode: v.optional(v.union(v.literal("sidebar"), v.literal("topbar"), v.literal("combined"))),
      language: v.optional(v.string()),
      currency: v.optional(v.string()),
      dateFormat: v.optional(v.string()),
      timeFormat: v.optional(v.string()),
      timezone: v.optional(v.string()),
      locale: v.optional(v.string()),
      loginTitle: v.optional(v.string()),
      loginSubtitle: v.optional(v.string()),
      loginBackgroundColor: v.optional(v.string()),
      loginBackgroundImage: v.optional(v.string()),
      showPoweredBy: v.optional(v.boolean()),
      documentLogo: v.optional(v.string()),
      documentPrimaryColor: v.optional(v.string()),
      documentFooter: v.optional(v.string()),
      portalTitle: v.optional(v.string()),
      portalDescription: v.optional(v.string()),
      showHelpCenter: v.optional(v.boolean()),
      showWhatsAppButton: v.optional(v.boolean()),
      showMobileAppBanner: v.optional(v.boolean()),
      receiptPrefix: v.optional(v.string()),
      invoicePrefix: v.optional(v.string()),
      certificatePrefix: v.optional(v.string()),
      ticketPrefix: v.optional(v.string()),
      labels: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Determine scope for this config
    const scopeKey = args.companyId ? "companyId" : args.branchId ? "branchId" : "global";

    // Find existing config for this scope
    let existing: any = null;
    if (args.companyId) {
      existing = await ctx.db.query("whiteLabelConfig")
        .withIndex("by_company", (q: any) => q.eq("companyId", args.companyId))
        .first();
    } else if (args.branchId) {
      existing = await ctx.db.query("whiteLabelConfig")
        .withIndex("by_branch", (q: any) => q.eq("branchId", args.branchId))
        .first();
    } else {
      existing = await ctx.db.query("whiteLabelConfig")
        .withIndex("by_company", (q: any) => q.eq("companyId", undefined))
        .first();
    }

    // Merge with existing or defaults
    const currentConfig = existing
      ? (existing as any).config
      : { ...DEFAULT_WHITE_LABEL_CONFIG };

    const mergedConfig = { ...currentConfig, ...args.config };

    if (existing) {
      await ctx.db.patch(existing._id, {
        config: mergedConfig,
        updatedAt: now,
        companyName: args.companyId ? (await ctx.db.get(args.companyId))?.name : undefined,
      });
      return existing._id;
    }

    return ctx.db.insert("whiteLabelConfig", {
      companyId: args.companyId,
      branchId: args.branchId,
      companyName: args.companyId ? (await ctx.db.get(args.companyId))?.name : "Global",
      config: mergedConfig,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// ─── Branding Info for Public Access ──────────────────────────

export const getPublicBranding = query({
  args: { companyId: v.optional(v.id("companies")) },
  handler: async (ctx, args) => {
    const config = await getWhiteLabelConfig.handler(ctx, { companyId: args.companyId });

    return {
      logo: config.logo,
      favicon: config.favicon,
      primaryColor: config.primaryColor,
      theme: config.theme,
      fontFamily: config.fontFamily,
      portalTitle: config.portalTitle,
      portalDescription: config.portalDescription,
      loginTitle: config.loginTitle,
      loginBackgroundColor: config.loginBackgroundColor,
      showPoweredBy: config.showPoweredBy,
    };
  },
});
