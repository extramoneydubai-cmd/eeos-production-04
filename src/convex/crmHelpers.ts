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

export async function checkAutoConversion(ctx: any, leadId: string) {
  try {
    const lead = await ctx.db.get(leadId);
    if (!lead || lead.status === "converted" || lead.status === "lost") return;
    const payments = await ctx.db.query("leadPayments").withIndex("leadId", (q: any) => q.eq("leadId", leadId)).collect();
    const verifiedPayments = payments.filter((p: { status: string }) => p.status === "verified");
    if (verifiedPayments.length === 0) return;
    const totalPaid = verifiedPayments.reduce((s: number, p: { amount: number }) => s + p.amount, 0);
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
    await logActivity(ctx, leadId, "stage_changed", `auto-converted after payment verification (₹${totalPaid} paid)`, ownerId);
    // Notify both owner and creator if they differ
    const notifiedUsers = new Set<string>();
    if (lead.ownerId && !notifiedUsers.has(lead.ownerId)) {
      notifiedUsers.add(lead.ownerId);
      await createNotification(ctx, lead.ownerId, "conversion", "Lead Converted",
        `${lead.firstName} ${lead.lastName} auto-converted after ₹${totalPaid} payment`, leadId, "lead");
    }
    if (lead.createdBy && !notifiedUsers.has(lead.createdBy)) {
      await createNotification(ctx, lead.createdBy, "conversion", "Lead Converted",
        `${lead.firstName} ${lead.lastName} auto-converted after ₹${totalPaid} payment`, leadId, "lead");
    }
  } catch (error) {
    console.error("[checkAutoConversion] Error:", error);
  }
}
