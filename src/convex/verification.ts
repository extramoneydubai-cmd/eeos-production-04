import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

async function logActivity(ctx: any, leadId: string, action: string, description: string, userId: string) {
  await ctx.db.insert("leadActivity", { leadId, action, description, userId, createdAt: Date.now() });
}

async function createNotification(ctx: any, userId: string, type: string, title: string, message: string, referenceId?: string, referenceType?: string) {
  await ctx.db.insert("notifications", {
    userId, type: type as any, title, message,
    referenceId, referenceType, isRead: false, createdAt: Date.now(),
  });
}

/**
 * Auto-conversion check (mirrored from crmHelpers to avoid circular imports).
 *
 * CRITICAL: ctx.db.query() within a Convex mutation does NOT see pending
 * ctx.db.patch() writes from the same transaction. When called from within
 * decideOnVerification (where the payment was just patched to "verified"),
 * callers MUST pass verifiedAmount directly. Without it, the re-query for
 * verified payments would return empty and conversion would silently skip.
 */
async function checkAutoConversion(ctx: any, leadId: string, verifiedAmount?: number) {
  try {
    const lead = await ctx.db.get(leadId);
    if (!lead || lead.status === "converted" || lead.status === "lost") return;

    let totalPaid = verifiedAmount ?? 0;

    // Only re-query payments when no amount was passed (external call path).
    if (verifiedAmount === undefined) {
      const payments = await ctx.db.query("leadPayments").withIndex("leadId", (q: any) => q.eq("leadId", leadId)).collect();
      const verifiedPayments = payments.filter((p: { status: string }) => p.status === "verified");
      if (verifiedPayments.length === 0) return;
      totalPaid = verifiedPayments.reduce((s: number, p: { amount: number }) => s + p.amount, 0);
    }

    if (totalPaid <= 0) return;
    const now = Date.now();
    const fromStage = lead.stage;
    const ownerId = lead.ownerId || lead.createdBy;
    await ctx.db.patch(leadId, { stage: "converted", status: "converted", updatedAt: now });
    await ctx.db.insert("leadStageHistory", {
      leadId, fromStage, toStage: "converted",
      changedBy: ownerId,
      note: `Auto-converted after verified payment of ₹${totalPaid}`,
      createdAt: now,
    });
    await ctx.db.insert("leadActivity", {
      leadId, action: "stage_changed",
      description: `auto-converted after payment verification (₹${totalPaid} paid)`,
      userId: ownerId, createdAt: now,
    });
    // Notify both owner and creator if they differ
    const notifiedUsers = new Set<string>();
    if (lead.ownerId && !notifiedUsers.has(lead.ownerId)) {
      notifiedUsers.add(lead.ownerId);
      await ctx.db.insert("notifications", {
        userId: lead.ownerId, type: "conversion", title: "Lead Converted",
        message: `${lead.firstName} ${lead.lastName} auto-converted after ₹${totalPaid} payment`,
        referenceId: leadId, referenceType: "lead", isRead: false, createdAt: now,
      });
    }
    if (lead.createdBy && !notifiedUsers.has(lead.createdBy)) {
      await ctx.db.insert("notifications", {
        userId: lead.createdBy, type: "conversion", title: "Lead Converted",
        message: `${lead.firstName} ${lead.lastName} auto-converted after ₹${totalPaid} payment`,
        referenceId: leadId, referenceType: "lead", isRead: false, createdAt: now,
      });
    }
  } catch (error) {
    console.error("[checkAutoConversion] Error:", error);
  }
}

// Auto-route verification: find finance/admin users as verifiers
async function findVerifiers(ctx: any, entityType: string) {
  const users = await ctx.db.query("users").collect();
  // For payments, route to admin/super_admin roles (finance team)
  const financeUsers = (users as any[]).filter((u: any) =>
    (u.role === "admin" || u.role === "super_admin") && !u.isDisabled
  );
  return financeUsers.map((u: any) => u._id);
}

// Shared helper: called from both the mutation and from crm.ts addPayment
// This is a plain async function, NOT a Convex mutation, so it can be imported directly
export async function insertVerificationRequest(ctx: any, args: {
  entityType: string;
  entityId: string;
  requesterId: string;
  metadata?: string;
}) {
  const now = Date.now();
  const assignedUserIds = await findVerifiers(ctx, args.entityType);

  const requestId = await ctx.db.insert("verification_requests", {
    entityType: args.entityType,
    entityId: args.entityId,
    requesterId: args.requesterId,
    assignedUserIds,
    mode: "any_one",
    status: "pending",
    metadata: args.metadata,
    createdAt: now,
    updatedAt: now,
  });

  for (const verifierId of assignedUserIds) {
    await ctx.db.insert("notifications", {
      userId: verifierId,
      type: "approval",
      title: "Verification Needed",
      message: `A ${args.entityType} record requires your verification`,
      referenceId: requestId,
      referenceType: "verification",
      isRead: false,
      createdAt: now,
    });
  }

  await ctx.db.insert("notifications", {
    userId: args.requesterId,
    type: "approval",
    title: "Verification Submitted",
    message: `Your ${args.entityType} has been submitted for verification`,
    referenceId: requestId,
    referenceType: "verification",
    isRead: false,
    createdAt: now,
  });

  return requestId;
}

// ============================
// VERIFICATION REQUESTS
// ============================

export const getVerificationRequests = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("rejected"),
      v.literal("returned")
    )),
    entityType: v.optional(v.string()),
    assignedToMe: v.optional(v.boolean()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    let requests = await ctx.db.query("verification_requests").collect();

    if (args.status) {
      requests = requests.filter((r) => r.status === args.status);
    }
    if (args.entityType) {
      requests = requests.filter((r) => r.entityType === args.entityType);
    }
    if (args.assignedToMe) {
      requests = requests.filter((r) => r.assignedUserIds.includes(args.userId));
    }

    return requests.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getVerificationRequestById = query({
  args: { requestId: v.id("verification_requests") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.requestId);
  },
});

export const getVerificationDecisions = query({
  args: { requestId: v.id("verification_requests") },
  handler: async (ctx, args) => {
    return await ctx.db.query("verification_decisions")
      .withIndex("requestId", (q) => q.eq("requestId", args.requestId))
      .collect();
  },
});

export const createVerificationRequest = mutation({
  args: { token: v.optional(v.string()),
    entityType: v.string(),
    entityId: v.string(),
    requesterId: v.id("users"),
    metadata: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "verification" }, async (ctx, args) => {
    return await insertVerificationRequest(ctx, args);
  }),
});

export const decideOnVerification = mutation({
  args: { token: v.optional(v.string()),
    requestId: v.id("verification_requests"),
    userId: v.id("users"),
    decision: v.union(
      v.literal("verified"),
      v.literal("rejected"),
      v.literal("returned"),
      v.literal("request_proof")
    ),
    comment: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "verification" }, async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Verification request not found");
    if (request.status !== "pending") throw new Error("Request already decided");

    const now = Date.now();

    // Record the decision
    await ctx.db.insert("verification_decisions", {
      requestId: args.requestId,
      userId: args.userId,
      status: args.decision,
      comment: args.comment,
      decidedAt: now,
      createdAt: now,
    });

    // Compute new status as a simple string to avoid TypeScript narrowing issues
    let newStatus: string = request.status;

    if (args.decision === "rejected" || args.decision === "returned") {
      newStatus = args.decision;
    } else if (args.decision === "verified") {
      if (request.mode === "any_one") {
        newStatus = "verified";
      } else {
        // For other modes, check if all required verifiers have approved
        const allDecisions = await ctx.db.query("verification_decisions")
          .withIndex("requestId", (q: any) => q.eq("requestId", args.requestId))
          .collect();
        const approvedCount = allDecisions.filter((d: any) => d.status === "verified").length;
        if (approvedCount >= (request as any).assignedUserIds.length) {
          newStatus = "verified";
        }
      }
    } else if (args.decision === "request_proof") {
      newStatus = "returned";
    }

    await ctx.db.patch(args.requestId, {
      status: newStatus,
      decidedBy: args.decision === "verified" || args.decision === "rejected" ? args.userId : undefined,
      decidedAt: newStatus !== "pending" ? now : undefined,
      remarks: args.comment,
      updatedAt: now,
    } as any);

    // Notify requester - use createNotification helper
    const requester = request.requesterId;
    await ctx.db.insert("notifications", {
      userId: requester,
      type: "approval",
      title: `Verification ${newStatus}`,
      message: `Your ${request.entityType} verification was ${newStatus}${args.comment ? `: ${args.comment}` : ""}`,
      referenceId: request.entityId,
      referenceType: request.entityType,
      isRead: false,
      createdAt: now,
    });

    // If entity is a payment, update payment status
    if (request.entityType === "payment") {
      const paymentId = request.entityId;
      const payment: any = await ctx.db.get(paymentId as any);
      if (payment) {
        if (newStatus === "verified") {
          await ctx.db.patch(paymentId as any, {
            status: "verified",
            verifiedBy: args.userId,
            verifiedAt: now,
            updatedAt: now,
          });
          await ctx.db.insert("leadActivity", {
            leadId: payment.leadId, action: "payment_verified",
            description: `Payment verified: ₹${payment.amount} via ${payment.mode}`,
            userId: args.userId, createdAt: now,
          });
          await ctx.db.insert("notifications", {
            userId: payment.enteredBy, type: "payment",
            title: "Payment Verified",
            message: `₹${payment.amount} payment verified for lead`,
            referenceId: payment.leadId, referenceType: "lead",
            isRead: false, createdAt: now,
          });
          // Pass amount directly — ctx.db.query() cannot see ctx.db.patch()
          // writes from the same mutation (Convex snapshot isolation)
          await checkAutoConversion(ctx, payment.leadId, payment.amount);
        } else if (newStatus === "rejected" || newStatus === "returned") {
          await ctx.db.patch(paymentId as any, {
            status: "rejected",
            rejectionReason: args.comment,
            updatedAt: now,
          });
          await ctx.db.insert("leadActivity", {
            leadId: payment.leadId, action: "payment_rejected",
            description: `Payment ${newStatus} by ${(await ctx.db.get(args.userId))?.name || "Verifier"}: ${args.comment || "No reason"}`,
            userId: args.userId, createdAt: now,
          });
        }
      }
    }
  }),
});

export const getVerificationCounts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("verification_requests").collect();
    return {
      pending: all.filter((r: any) => r.status === "pending" && r.assignedUserIds.includes(args.userId)).length,
      totalPending: all.filter((r: any) => r.status === "pending").length,
      verified: all.filter((r: any) => r.status === "verified").length,
      rejected: all.filter((r: any) => r.status === "rejected" || r.status === "returned").length,
    };
  },
});

// ============================
// VERIFICATION DETAIL (for payment drawer)
// ============================

export const getVerificationWithDecisions = query({
  args: { requestId: v.id("verification_requests") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) return null;

    const decisions = await ctx.db.query("verification_decisions")
      .withIndex("requestId", (q) => q.eq("requestId", args.requestId))
      .collect();

    // Fetch linked payment if entity is payment
    let payment: any = null;
    let lead: any = null;
    if (request.entityType === "payment") {
      payment = await ctx.db.get(request.entityId as any);
      if (payment) {
        lead = await ctx.db.get(payment.leadId);
      }
    }

    return {
      request,
      decisions: decisions.sort((a, b) => a.createdAt - b.createdAt),
      payment,
      lead,
    };
  },
});
