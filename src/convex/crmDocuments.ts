import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { logActivity } from "./crmHelpers";

// ============================
// LEAD DOCUMENTS
// ============================

export const getLeadDocuments = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => await ctx.db.query("leadDocuments").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect(),
});

export const addLeadDocument = mutation({
  args: { leadId: v.id("leadMaster"), name: v.string(), url: v.string(), type: v.optional(v.string()), size: v.optional(v.number()), userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.insert("leadDocuments", { leadId: args.leadId, name: args.name, url: args.url, type: args.type, size: args.size, uploadedBy: args.userId, createdAt: Date.now() });
    await logActivity(ctx, args.leadId, "document_added", `document added: ${args.name}`, args.userId);
  },
});

export const deleteLeadDocument = mutation({
  args: { documentId: v.id("leadDocuments") },
  handler: async (ctx, args) => { await ctx.db.delete(args.documentId); },
});
