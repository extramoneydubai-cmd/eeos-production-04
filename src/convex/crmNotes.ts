import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { logActivity } from "./crmHelpers";

// ============================
// LEAD NOTES
// ============================

export const getLeadNotes = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => (await ctx.db.query("leadNotes").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect()).sort((a, b) => b.createdAt - a.createdAt),
});

export const addLeadNote = mutation({
  args: { leadId: v.id("leadMaster"), content: v.string(), type: v.optional(v.string()), userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.insert("leadNotes", { leadId: args.leadId, content: args.content, createdBy: args.userId, type: args.type, createdAt: Date.now() });
    await logActivity(ctx, args.leadId, "note_added", `note added${args.type ? ` (${args.type})` : ""}`, args.userId);
  },
});

export const deleteLeadNote = mutation({
  args: { noteId: v.id("leadNotes") },
  handler: async (ctx, args) => { await ctx.db.delete(args.noteId); },
});
