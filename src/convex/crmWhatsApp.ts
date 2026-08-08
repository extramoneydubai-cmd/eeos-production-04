import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { logActivity } from "./crmHelpers";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ============================
// WHATSAPP ENGINE
// ============================

export const getLeadWhatsAppMessages = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => await ctx.db.query("leadWhatsAppMessages").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect(),
});

export const sendWhatsAppMessage = mutation({
  args: { token: v.optional(v.string()), leadId: v.id("leadMaster"), message: v.string(), whatsappUrl: v.string(), template: v.optional(v.union(v.literal("greeting"), v.literal("followup"), v.literal("reminder"), v.literal("offer"), v.literal("approval"), v.literal("conversion"), v.literal("manual"))), sentBy: v.id("users") },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmWhatsApp" }, async (ctx, args) => {
    await ctx.db.insert("leadWhatsAppMessages", { leadId: args.leadId, message: args.message, whatsappUrl: args.whatsappUrl, template: args.template || "manual", sentBy: args.sentBy, status: "sent", createdAt: Date.now() });
    const templateLabel = args.template ? args.template.charAt(0).toUpperCase() + args.template.slice(1) : "Manual";
    await logActivity(ctx, args.leadId, "whatsapp_sent", `WhatsApp ${templateLabel} message sent`, args.sentBy);
  }),
});
