import { v } from "convex/values";
import { query } from "./_generated/server";

// ============================
// ACTIVITY / TIMELINE
// ============================

export const getLeadActivity = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => (await ctx.db.query("leadActivity").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect()).sort((a, b) => b.createdAt - a.createdAt),
});

export const getLeadStageHistory = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => (await ctx.db.query("leadStageHistory").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect()).sort((a, b) => a.createdAt - b.createdAt),
});
