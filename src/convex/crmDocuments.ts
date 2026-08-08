import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { logActivity } from "./crmHelpers";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ============================
// LEAD DOCUMENTS
// ============================

export const getLeadDocuments = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => await ctx.db.query("leadDocuments").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect(),
});

export const addLeadDocument = mutation({
  args: { token: v.optional(v.string()), leadId: v.id("leadMaster"), name: v.string(), url: v.string(), type: v.optional(v.string()), size: v.optional(v.number()), userId: v.id("users") },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmDocuments" }, async (ctx, args) => {
    await ctx.db.insert("leadDocuments", { leadId: args.leadId, name: args.name, url: args.url, type: args.type, size: args.size, uploadedBy: args.userId, createdAt: Date.now() });
    await logActivity(ctx, args.leadId, "document_added", `document added: ${args.name}`, args.userId);
  }),
});

export const deleteLeadDocument = mutation({
  args: { token: v.optional(v.string()), documentId: v.id("leadDocuments") },
  handler: withScopeAndEvents({ operation: "delete", module: "crm", entity: "crmDocuments" }, async (ctx, args) => { await ctx.db.delete(args.documentId); }),
});
