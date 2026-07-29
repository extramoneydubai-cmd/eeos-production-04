/**
 * PDC Legal Engine — Legal Tracking, Settlement, Bounce Notices & Restrictions
 *
 * Extends chequeEngine with legal follow-up status, bounce notices,
 * second bounce restrictions, and settlement tracking.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const updatePDCLegalStatus = mutation({
  args: {
    chequeId: v.id("chequeEntries"),
    legalStatus: v.union(v.literal("none"), v.literal("notice_sent"), v.literal("follow_up"), v.literal("legal_notice"), v.literal("settlement"), v.literal("closed")),
    legalNotes: v.optional(v.string()),
    settlementAmount: v.optional(v.number()),
    settlementDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const update: Record<string, any> = { legalStatus: args.legalStatus, updatedAt: Date.now() };
    if (args.legalNotes) update.legalNotes = args.legalNotes;
    if (args.settlementAmount) update.settlementAmount = args.settlementAmount;
    if (args.settlementDate) update.settlementDate = args.settlementDate;
    if (args.legalStatus === "settlement" || args.legalStatus === "closed") {
      update.status = args.legalStatus === "settlement" ? "settled" : "closed";
    }
    await ctx.db.patch(args.chequeId, update);
    return args.chequeId;
  },
});

export const restrictFutureCheques = mutation({
  args: {
    studentId: v.id("studentMaster"),
    restricted: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.studentId, {
      chequeRestricted: args.restricted,
      chequeRestrictionReason: args.reason,
      updatedAt: Date.now(),
    });
    return args.studentId;
  },
});

export const getBounceNoticeData = query({
  args: { chequeId: v.id("chequeEntries") },
  handler: async (ctx, args) => {
    const cheque = await ctx.db.get(args.chequeId);
    if (!cheque) return null;
    const student = cheque.studentId ? await ctx.db.get(cheque.studentId) : null;
    return {
      cheque,
      studentName: student ? `${(student as any).firstName} ${(student as any).lastName}` : "Unknown",
      studentAddress: student ? (student as any).address : "",
      studentPhone: student ? (student as any).phone : "",
    };
  },
});

export const getLegalDashboard = query({
  handler: async (ctx) => {
    const cheques = await ctx.db.query("chequeEntries").collect();
    return {
      totalLegalCases: cheques.filter((c: any) => c.legalStatus && c.legalStatus !== "none").length,
      noticeSent: cheques.filter((c: any) => c.legalStatus === "notice_sent").length,
      followUp: cheques.filter((c: any) => c.legalStatus === "follow_up").length,
      legalNotice: cheques.filter((c: any) => c.legalStatus === "legal_notice").length,
      settled: cheques.filter((c: any) => c.legalStatus === "settlement" || c.status === "settled").length,
      closed: cheques.filter((c: any) => c.legalStatus === "closed").length,
    };
  },
});
