// ─── Shared Constants ───
export const LEAD_PIPELINE_STAGES = [
  "new", "attempted", "connected", "qualified", "counselling",
  "interested", "follow_up", "negotiation", "converted", "lost",
] as const;

export const LEAD_STAGES = LEAD_PIPELINE_STAGES;

// ─── Shared Helpers ───

export async function logActivity(ctx: any, leadId: string, action: string, description: string, userId: string, metadata?: string) {
  await ctx.db.insert("leadActivity", { leadId, action, description, userId, metadata, createdAt: Date.now() });
}

export async function createNotification(ctx: any, userId: string, type: string, title: string, message: string, referenceId?: string, referenceType?: string) {
  await ctx.db.insert("notifications", {
    userId, type: type as any, title, message,
    referenceId, referenceType, isRead: false, createdAt: Date.now(),
  });
}

export function recalculatePayable(stdAmount: number, approvedDiscounts: { amount: number; category: string }[]) {
  const discAmount = approvedDiscounts.filter((d: { category: string }) => d.category !== "waiver").reduce((s: number, d: { amount: number }) => s + d.amount, 0);
  const waiveAmount = approvedDiscounts.filter((d: { category: string }) => d.category === "waiver").reduce((s: number, d: { amount: number }) => s + d.amount, 0);
  return { discountAmount: discAmount, waiverAmount: waiveAmount, finalPayable: Math.max(0, stdAmount - discAmount - waiveAmount) };
}

/**
 * Check if a lead should be auto-converted after payment verification.
 *
 * IMPORTANT (Convex transactional semantics): ctx.db.query() within a mutation
 * does NOT see pending ctx.db.patch() writes from the same mutation. Therefore
 * when called from verifyPayment or decideOnVerification (where the payment was
 * just patched to "verified"), callers MUST pass verifiedAmount directly.
 * When called externally (e.g. from a cron or webhook), omit verifiedAmount
 * and the function will re-query the payments table.
 */
export async function checkAutoConversion(ctx: any, leadId: string, verifiedAmount?: number) {
  try {
    const lead = await ctx.db.get(leadId);
    if (!lead || lead.status === "converted" || lead.status === "lost") return;

    let totalPaid = verifiedAmount ?? 0;

    // Only re-query payments when no amount was passed (external call path).
    // Inside a mutation ctx.db.query() cannot see ctx.db.patch() writes from
    // the same transaction, so we must accept the amount as a parameter when
    // the payment was just verified inline.
    if (verifiedAmount === undefined) {
      const payments = await ctx.db
        .query("leadPayments")
        .withIndex("leadId", (q: any) => q.eq("leadId", leadId))
        .collect();
      const verifiedPayments = payments.filter(
        (p: { status: string }) => p.status === "verified",
      );
      if (verifiedPayments.length === 0) return;
      totalPaid = verifiedPayments.reduce(
        (s: number, p: { amount: number }) => s + p.amount,
        0,
      );
    }

    if (totalPaid <= 0) return;

    const now = Date.now();
    const fromStage = lead.stage;
    const ownerId = lead.ownerId || lead.createdBy;

    await ctx.db.patch(leadId, {
      stage: "converted",
      status: "converted",
      updatedAt: now,
    });

    await ctx.db.insert("leadStageHistory", {
      leadId,
      fromStage,
      toStage: "converted",
      changedBy: ownerId,
      note: `Auto-converted after verified payment of ₹${totalPaid}`,
      createdAt: now,
    });

    await logActivity(
      ctx,
      leadId,
      "stage_changed",
      `auto-converted after payment verification (₹${totalPaid} paid)`,
      ownerId,
    );

    // Notify both owner and creator if they differ
    const notifiedUsers = new Set<string>();
    if (lead.ownerId && !notifiedUsers.has(lead.ownerId)) {
      notifiedUsers.add(lead.ownerId);
      await createNotification(
        ctx,
        lead.ownerId,
        "conversion",
        "Lead Converted",
        `${lead.firstName} ${lead.lastName} auto-converted after ₹${totalPaid} payment`,
        leadId,
        "lead",
      );
    }
    if (lead.createdBy && !notifiedUsers.has(lead.createdBy)) {
      await createNotification(
        ctx,
        lead.createdBy,
        "conversion",
        "Lead Converted",
        `${lead.firstName} ${lead.lastName} auto-converted after ₹${totalPaid} payment`,
        leadId,
        "lead",
      );
    }
  } catch (error) {
    console.error("[checkAutoConversion] Error:", error);
  }
}
