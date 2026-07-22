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
  const lead = await ctx.db.get(leadId);
  if (!lead || lead.status === "converted" || lead.status === "lost") return;
  const payments = await ctx.db.query("leadPayments").withIndex("leadId", (q: any) => q.eq("leadId", leadId)).collect();
  const verifiedPayments = payments.filter((p: { status: string }) => p.status === "verified");
  if (verifiedPayments.length === 0) return;
  const totalPaid = verifiedPayments.reduce((s: number, p: { amount: number }) => s + p.amount, 0);
  await ctx.db.patch(leadId, { stage: "converted", status: "converted", updatedAt: Date.now() });
  await ctx.db.insert("leadStageHistory", { leadId, fromStage: lead.stage, toStage: "converted", changedBy: lead.createdBy, note: "Auto-converted after payment verification", createdAt: Date.now() });
  await logActivity(ctx, leadId, "stage_changed", `auto-converted after payment verification (₹${totalPaid} paid)`, lead.createdBy);
  if (lead.ownerId) {
    await createNotification(ctx, lead.ownerId, "conversion", "Lead Converted", `Lead ${lead.firstName} ${lead.lastName} auto-converted after payment`, leadId, "lead");
  }
}
