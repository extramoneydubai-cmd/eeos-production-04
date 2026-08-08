/**
 * PDC Legal Engine — Legal Tracking, Settlement, Bounce Notices & Restrictions
 *
 * Extends chequeEngine with legal follow-up status, bounce notices,
 * second bounce restrictions, and settlement tracking.
 *
 * All mutations use withScopeAndEvents for complete enterprise adoption:
 *   ✓ ScopeEngine authorization    ✓ Event Pipeline
 *   ✓ Timeline auto-recording     ✓ Notification Matrix routing
 *   ✓ Search indexing             ✓ Dashboard refresh signals
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents, type ScopeAndEventsConfig } from "./withScopeAndEvents";
import { Id } from "./_generated/dataModel";

// ─── Enterprise Handler Factory ───────────────────────────────────────
// Wraps ctx-based auth extraction for withScopeAndEvents integration.
// When a session token is supplied the withScopeAndEvents wrapper resolves
// the REAL performer from the sessions table; getAuthUserId (Convex auth
// headers) only applies to legacy flows.

function withPdc<P = any, R = any>(
  operation: ScopeAndEventsConfig<P, R>["operation"],
  entity: string,
  handler: (ctx: any, args: P) => Promise<R>,
) {
  return async (ctx: any, args: P) => {
    const raw = args as any;
    const hasToken = typeof raw?.token === "string" && raw.token.length > 0;
    let userId: Id<"users"> | undefined;
    if (!hasToken) {
      userId = (await getAuthUserId(ctx)) as Id<"users"> | undefined;
    }

    const wrappedHandler = withScopeAndEvents<P, R>(
      {
        operation,
        module: "pdc",
        entity,
        getEntityCompanyId: () => undefined,
        getEntityBranchId: () => undefined,
        getEntityDepartmentId: () => undefined,
        getUserId: () => userId as Id<"users">,
        notifyViaMatrix: true,
        triggerWorkflow: true,
        triggerAutomation: true,
        registerSearch: true,
        signalDashboard: true,
      },
      (ctx2, args2) => handler(ctx2, args2),
    );
    return wrappedHandler(ctx, args);
  };
}

export const updatePDCLegalStatus = mutation({
  args: {
    token: v.optional(v.string()),
    chequeId: v.id("chequeEntries"),
    legalStatus: v.union(v.literal("none"), v.literal("notice_sent"), v.literal("follow_up"), v.literal("legal_notice"), v.literal("settlement"), v.literal("closed")),
    legalNotes: v.optional(v.string()),
    settlementAmount: v.optional(v.number()),
    settlementDate: v.optional(v.number()),
  },
  handler: withPdc("update", "cheque", async (ctx, args) => {
    const update: Record<string, any> = { legalStatus: args.legalStatus, updatedAt: Date.now() };
    if (args.legalNotes) update.legalNotes = args.legalNotes;
    if (args.settlementAmount) update.settlementAmount = args.settlementAmount;
    if (args.settlementDate) update.settlementDate = args.settlementDate;
    if (args.legalStatus === "settlement" || args.legalStatus === "closed") {
      update.status = args.legalStatus === "settlement" ? "settled" : "closed";
    }
    await ctx.db.patch(args.chequeId, update);
    return args.chequeId;
  }),
});

export const restrictFutureCheques = mutation({
  args: {
    token: v.optional(v.string()),
    studentId: v.id("studentMaster"),
    restricted: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: withPdc("update", "student", async (ctx, args) => {
    await ctx.db.patch(args.studentId, {
      chequeRestricted: args.restricted,
      updatedAt: Date.now(),
    });
    return args.studentId;
  }),
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
      nachRegistered: cheques.filter((c: any) => c.nachRegistered).length,
      courtActive: cheques.filter((c: any) => c.courtStatus && c.courtStatus !== "none" && c.courtStatus !== "decree").length,
      recovered: cheques.filter((c: any) => c.recoveryStatus === "recovered").length,
      blacklisted: cheques.filter((c: any) => c.status === "blacklisted" || c.riskLevel === "critical").length,
      writeOff: cheques.filter((c: any) => c.recoveryStatus === "write_off").length,
    };
  },
});

// ─── Enterprise PDC Lifecycle (PATCH-ENTERPRISE-020) ─────────

export const registerNACH = mutation({
  args: {
    token: v.optional(v.string()),
    chequeId: v.id("chequeEntries"),
    mandateRef: v.string(),
  },
  handler: withPdc("update", "cheque", async (ctx, args) => {
    await ctx.db.patch(args.chequeId, {
      nachRegistered: true,
      nachMandateRef: args.mandateRef,
      updatedAt: Date.now(),
    });
    return args.chequeId;
  }),
});

export const assignLawyer = mutation({
  args: {
    token: v.optional(v.string()),
    chequeId: v.id("chequeEntries"),
    lawyerId: v.id("users"),
    lawyerName: v.optional(v.string()),
    caseNumber: v.optional(v.string()),
  },
  handler: withPdc("update", "cheque", async (ctx, args) => {
    const update: Record<string, any> = { lawyerId: args.lawyerId, updatedAt: Date.now() };
    if (args.lawyerName) update.lawyerName = args.lawyerName;
    if (args.caseNumber) update.courtCaseNumber = args.caseNumber;
    await ctx.db.patch(args.chequeId, update);
    return args.chequeId;
  }),
});

export const updateCourtStatus = mutation({
  args: {
    token: v.optional(v.string()),
    chequeId: v.id("chequeEntries"),
    courtStatus: v.union(v.literal("none"), v.literal("filed"), v.literal("hearing"), v.literal("judgment"), v.literal("decree"), v.literal("execution")),
    caseNumber: v.optional(v.string()),
    courtNotes: v.optional(v.string()),
  },
  handler: withPdc("update", "cheque", async (ctx, args) => {
    const update: Record<string, any> = { courtStatus: args.courtStatus, updatedAt: Date.now() };
    if (args.caseNumber) update.courtCaseNumber = args.caseNumber;
    if (args.courtNotes) update.legalNotes = args.courtNotes;
    if (args.courtStatus === "decree" || args.courtStatus === "execution") {
      update.recoveryStatus = "legal_action";
    }
    await ctx.db.patch(args.chequeId, update);
    return args.chequeId;
  }),
});

export const computeRiskScore = mutation({
  args: { token: v.optional(v.string()), chequeId: v.id("chequeEntries") },
  handler: withPdc("update", "cheque", async (ctx, args) => {
    const cheque = await ctx.db.get(args.chequeId);
    if (!cheque) return null;
    const c = cheque as any;
    let score = 0;
    if ((c.bounceCount || 0) > 0) score += 30;
    if ((c.bounceCount || 0) > 1) score += 25;
    if (c.recoveryStatus === "none" || !c.recoveryStatus) score += 10;
    if (c.nachRegistered) score -= 15;
    if (c.courtStatus && c.courtStatus !== "none") score += 15;
    if (c.legalStatus === "legal_notice") score += 10;
    if ((c.settlementAmount || 0) > 0) score -= 10;
    if (c.status === "blacklisted") score += 25;
    const clamped = Math.max(0, Math.min(100, score));
    const level = clamped >= 75 ? "critical" : clamped >= 50 ? "high" : clamped >= 25 ? "medium" : "low";
    await ctx.db.patch(args.chequeId, { riskScore: clamped, riskLevel: level, updatedAt: Date.now() });
    return { riskScore: clamped, riskLevel: level, factors: { bounceCount: c.bounceCount || 0, legalStatus: c.legalStatus, courtActive: !!(c.courtStatus && c.courtStatus !== "none") } };
  }),
});

export const blacklistStudentCheques = mutation({
  args: {
    token: v.optional(v.string()),
    studentId: v.id("studentMaster"),
    reason: v.string(),
    maxBounceCount: v.optional(v.number()),
  },
  handler: withPdc("update", "cheque", async (ctx, args) => {
    const cheques = await ctx.db.query("chequeEntries")
      .filter((q: any) => q.eq(q.field("studentId"), args.studentId))
      .collect();
    const now = Date.now();
    let updated = 0;
    for (const cheque of cheques) {
      const c = cheque as any;
      const bounceCount = c.bounceCount || 0;
      const threshold = args.maxBounceCount ?? 2;
      if (bounceCount >= threshold || args.reason) {
        await ctx.db.patch(cheque._id, { status: "blacklisted", riskLevel: "critical", riskScore: 100, legalNotes: args.reason, updatedAt: now });
        updated++;
      }
    }
    // Restrict future cheques for this student
    await ctx.db.patch(args.studentId, { chequeRestricted: true, chequeRestrictionReason: args.reason, updatedAt: now } as any);
    return { updatedCheques: updated, studentRestricted: true };
  }),
});

export const recordSettlement = mutation({
  args: {
    token: v.optional(v.string()),
    chequeId: v.id("chequeEntries"),
    settlementAmount: v.number(),
    settlementDate: v.number(),
    recoveryStatus: v.optional(v.union(v.literal("none"), v.literal("demand_letter"), v.literal("negotiation"), v.literal("legal_action"), v.literal("recovered"), v.literal("write_off"))),
  },
  handler: withPdc("update", "cheque", async (ctx, args) => {
    await ctx.db.patch(args.chequeId, {
      settlementAmount: args.settlementAmount,
      settlementDate: args.settlementDate,
      legalStatus: "settlement",
      status: "settled",
      recoveryStatus: args.recoveryStatus || "recovered",
      riskLevel: "low",
      riskScore: 0,
      updatedAt: Date.now(),
    });
    return args.chequeId;
  }),
});

export const writeOffCheque = mutation({
  args: {
    token: v.optional(v.string()),
    chequeId: v.id("chequeEntries"),
    reason: v.string(),
  },
  handler: withPdc("update", "cheque", async (ctx, args) => {
    await ctx.db.patch(args.chequeId, {
      recoveryStatus: "write_off",
      legalStatus: "closed",
      status: "closed",
      legalNotes: args.reason,
      updatedAt: Date.now(),
    });
    return args.chequeId;
  }),
});

export const getRecoveryDashboard = query({
  handler: async (ctx) => {
    const cheques = await ctx.db.query("chequeEntries").collect();
    return {
      total: cheques.length,
      bounced: cheques.filter((c: any) => c.status === "bounced").length,
      inNegotiation: cheques.filter((c: any) => c.recoveryStatus === "negotiation" || c.recoveryStatus === "demand_letter").length,
      legalAction: cheques.filter((c: any) => c.recoveryStatus === "legal_action" || c.courtStatus === "filed").length,
      recovered: cheques.filter((c: any) => c.recoveryStatus === "recovered" || c.status === "settled").length,
      writeOff: cheques.filter((c: any) => c.recoveryStatus === "write_off").length,
      blacklisted: cheques.filter((c: any) => c.status === "blacklisted").length,
      highRisk: cheques.filter((c: any) => c.riskLevel === "high" || c.riskLevel === "critical").length,
      totalOutstanding: cheques.filter((c: any) => c.status === "bounced" || c.recoveryStatus === "negotiation" || c.recoveryStatus === "legal_action")
        .reduce((sum, c: any) => sum + (c.amount || 0), 0),
      recoveryRate: (() => {
        const bouncedOrLegal = cheques.filter((c: any) => c.status === "bounced" || c.courtStatus === "filed" || c.recoveryStatus === "legal_action").length;
        const recovered = cheques.filter((c: any) => c.recoveryStatus === "recovered" || c.status === "settled").length;
        return bouncedOrLegal > 0 ? Math.round((recovered / bouncedOrLegal) * 100) : 0;
      })(),
    };
  },
});
