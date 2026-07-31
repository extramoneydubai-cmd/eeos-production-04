/**
 * White Label SDK — Per-Company Branding Runtime
 *
 * Wires the existing whiteLabelEngine. All branding is DB-driven:
 * logo, colors, typography, theme, document prefixes, portal copy —
 * inherited Platform → Company → Branch.
 *
 * Usage:
 *   import { PlatformSDK } from "@/platform/sdk";
 *   const branding = await PlatformSDK.whiteLabel.get(ctx, { companyId });
 */

import { v } from "convex/values";
import { mutation, query } from "../../convex/_generated/server";

/**
 * Get the effective white-label config for a company/branch (inherited).
 */
export const get = query({
  args: {
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const { getWhiteLabelConfig } = await import("../../convex/whiteLabelEngine");
    return getWhiteLabelConfig.handler(ctx, args);
  },
});

/**
 * List all configured white-label scopes (company/branch/global).
 */
export const list = query({
  handler: async (ctx) => {
    const { listWhiteLabelConfigs } = await import("../../convex/whiteLabelEngine");
    return listWhiteLabelConfigs.handler(ctx, {});
  },
});

/**
 * Set the white-label config for a scope (company, branch, or global).
 */
export const set = mutation({
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
    const { setWhiteLabelConfig } = await import("../../convex/whiteLabelEngine");
    return setWhiteLabelConfig.handler(ctx, args);
  },
});

/**
 * Get public branding for the login page (no auth required).
 */
export const getPublicBranding = query({
  args: { companyId: v.optional(v.id("companies")) },
  handler: async (ctx, args) => {
    const { getPublicBranding } = await import("../../convex/whiteLabelEngine");
    return getPublicBranding.handler(ctx, args);
  },
});
