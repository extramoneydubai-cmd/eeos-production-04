import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

async function logActivity(ctx: any, leadId: string, action: string, description: string, userId: string) {
  await ctx.db.insert("leadActivity", { leadId, action, description, userId, createdAt: Date.now() });
}

async function createNotification(ctx: any, userId: string, type: string, title: string, message: string, referenceId?: string, referenceType?: string) {
  await ctx.db.insert("notifications", {
    userId, type: type as any, title, message,
    referenceId, referenceType, isRead: false, createdAt: Date.now(),
  });
}

// ============================
// PAYMENT PLANS
// ============================

export const getPaymentPlans = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => {
    return await ctx.db.query("payment_plans").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect();
  },
});

export const createPaymentPlan = mutation({
  args: {
    leadId: v.id("leadMaster"),
    totalAmount: v.number(),
    installmentCount: v.number(),
    frequency: v.union(v.literal("weekly"), v.literal("monthly"), v.literal("quarterly"), v.literal("custom")),
    startDate: v.number(),
    graceDays: v.number(),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const installmentAmount = Math.round(args.totalAmount / args.installmentCount);
    const dayMs = 86400000;
    const freqMap = { weekly: 7, monthly: 30, quarterly: 91, custom: 30 };
    const freqDays = freqMap[args.frequency] || 30;

    const planId = await ctx.db.insert("payment_plans", {
      leadId: args.leadId, totalAmount: args.totalAmount, installmentCount: args.installmentCount,
      installmentAmount, frequency: args.frequency, startDate: args.startDate,
      graceDays: args.graceDays, status: "active", createdBy: args.createdBy,
      createdAt: now, updatedAt: now,
    });

    for (let i = 0; i < args.installmentCount; i++) {
      const dueDate = args.startDate + i * freqDays * dayMs;
      const amt = i === args.installmentCount - 1
        ? args.totalAmount - installmentAmount * (args.installmentCount - 1)
        : installmentAmount;
      const st = dueDate <= now ? "due" : "planned";
      await ctx.db.insert("payment_installments", {
        planId: planId as any, leadId: args.leadId, installmentNumber: i + 1, amount: amt,
        dueDate, status: st as any, createdAt: now, updatedAt: now,
      });
      await ctx.db.insert("leadTasks", {
        leadId: args.leadId, title: `Installment #${i + 1} Due — ₹${amt.toLocaleString()}`,
        description: `Auto-generated from payment plan (${args.frequency})`,
        ownerId: args.createdBy, assignedTo: args.createdBy,
        dueDate: dueDate - args.graceDays * dayMs, status: "pending", priority: "medium",
        isApproved: false, createdAt: now, updatedAt: now,
      });
    }

    await logActivity(ctx, args.leadId, "payment_plan_created",
      `Payment plan created: ${args.installmentCount} installments of ₹${installmentAmount.toLocaleString()} (${args.frequency})`,
      args.createdBy);
    return planId;
  },
});

export const cancelPaymentPlan = mutation({
  args: { planId: v.id("payment_plans"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.planId, { status: "cancelled", updatedAt: now });
    const installments = await ctx.db.query("payment_installments").withIndex("planId", (q) => q.eq("planId", args.planId)).collect();
    for (const inst of installments) {
      if (inst.status === "planned" || inst.status === "due") {
        await ctx.db.patch(inst._id, { status: "cancelled", updatedAt: now });
      }
    }
  },
});

// ============================
// INSTALLMENTS
// ============================

export const getInstallments = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => {
    const installments = await ctx.db.query("payment_installments").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect();
    return installments.sort((a, b) => a.installmentNumber - b.installmentNumber);
  },
});

export const markInstallmentPaid = mutation({
  args: { installmentId: v.id("payment_installments"), paymentId: v.id("leadPayments"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.installmentId, { status: "paid", paymentId: args.paymentId, paidAt: now, updatedAt: now });
    const inst = await ctx.db.get(args.installmentId);
    if (inst) {
      await logActivity(ctx, inst.leadId, "installment_paid",
        `Installment #${inst.installmentNumber} paid: ₹${inst.amount.toLocaleString()}`, args.userId);
    }
  },
});

// ============================
// PDC CHEQUES
// ============================

export const getLeadPDCs = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => {
    return await ctx.db.query("payment_pdcs").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect();
  },
});

export const createPDC = mutation({
  args: {
    leadId: v.id("leadMaster"), chequeNumber: v.string(), bank: v.string(),
    chequeDate: v.number(), amount: v.number(), attachment: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const dayMs = 86400000;
    const pdcId = await ctx.db.insert("payment_pdcs", {
      leadId: args.leadId, chequeNumber: args.chequeNumber, bank: args.bank,
      chequeDate: args.chequeDate, amount: args.amount, attachment: args.attachment,
      status: "scheduled", createdBy: args.createdBy, createdAt: now, updatedAt: now,
    });

    // Create deposit task for collection team
    await ctx.db.insert("leadTasks", {
      leadId: args.leadId, title: `Deposit PDC — ${args.bank} #${args.chequeNumber} (₹${args.amount.toLocaleString()})`,
      description: `PDC scheduled for deposit. Cheque date: ${new Date(args.chequeDate).toLocaleDateString()}. Bank: ${args.bank}. Amount: ₹${args.amount.toLocaleString()}`,
      ownerId: args.createdBy, assignedTo: args.createdBy, dueDate: args.chequeDate,
      status: "pending", priority: "high", isApproved: false, createdAt: now, updatedAt: now,
    });

    // Create scheduled reminder notifications at T-7, T-3, T-1, Today
    const milestones = [
      { label: "PDC Due in 7 Days", daysBefore: 7 },
      { label: "PDC Due in 3 Days", daysBefore: 3 },
      { label: "PDC Due Tomorrow", daysBefore: 1 },
      { label: "PDC Due Today", daysBefore: 0 },
    ];
    for (const ms of milestones) {
      const reminderDate = args.chequeDate - ms.daysBefore * dayMs;
      // Only create if the reminder date is in the future (not already past)
      if (reminderDate > now) {
        await ctx.db.insert("notifications", {
          userId: args.createdBy,
          type: "payment",
          title: ms.label,
          message: `${args.bank} #${args.chequeNumber} — ₹${args.amount.toLocaleString()} — Cheque Date: ${new Date(args.chequeDate).toLocaleDateString()}`,
          referenceId: pdcId,
          referenceType: "pdc",
          isRead: false,
          createdAt: now,
        });
      }
    }

    await logActivity(ctx, args.leadId, "pdc_created",
      `PDC created: ${args.bank} #${args.chequeNumber} for ₹${args.amount.toLocaleString()} with auto-reminders`, args.createdBy);
    return pdcId;
  },
});

/**
 * Get upcoming PDC reminders — computes which active PDCs have
 * reminders due today or within the next N days.
 */
export const getUpcomingPDCReminders = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const dayMs = 86400000;

    // Fetch all active PDCs assigned to this user
    const allPdcs = await ctx.db.query("payment_pdcs").collect();
    const nowDays = Math.floor(now / dayMs);

    // Filter to PDCs where user is the creator (or assigned — for now, check by whole dataset)
    // Since PDCs don't have direct userId assignment, we'll return all non-cancelled/cleared
    const activePdcs = allPdcs.filter((p) => p.status === "scheduled" || p.status === "deposited");

    const reminders: Array<{
      pdcId: string;
      chequeNumber: string;
      bank: string;
      amount: number;
      chequeDate: number;
      status: string;
      daysToChequeDate: number;
      reminderLevel: "critical" | "warning" | "info";
      milestone: string;
    }> = [];

    for (const pdc of activePdcs) {
      const chequeDays = Math.floor(pdc.chequeDate / dayMs);
      const daysToCheque = chequeDays - nowDays;

      if (daysToCheque === 7) {
        reminders.push({ pdcId: pdc._id, chequeNumber: pdc.chequeNumber, bank: pdc.bank, amount: pdc.amount, chequeDate: pdc.chequeDate, status: pdc.status, daysToChequeDate: daysToCheque, reminderLevel: "info", milestone: "Due in 7 Days" });
      } else if (daysToCheque === 3) {
        reminders.push({ pdcId: pdc._id, chequeNumber: pdc.chequeNumber, bank: pdc.bank, amount: pdc.amount, chequeDate: pdc.chequeDate, status: pdc.status, daysToChequeDate: daysToCheque, reminderLevel: "warning", milestone: "Due in 3 Days" });
      } else if (daysToCheque === 1) {
        reminders.push({ pdcId: pdc._id, chequeNumber: pdc.chequeNumber, bank: pdc.bank, amount: pdc.amount, chequeDate: pdc.chequeDate, status: pdc.status, daysToChequeDate: daysToCheque, reminderLevel: "warning", milestone: "Due Tomorrow" });
      } else if (daysToCheque <= 0 && daysToCheque > -1) {
        reminders.push({ pdcId: pdc._id, chequeNumber: pdc.chequeNumber, bank: pdc.bank, amount: pdc.amount, chequeDate: pdc.chequeDate, status: pdc.status, daysToChequeDate: daysToCheque, reminderLevel: "critical", milestone: "Due Today" });
      } else if (daysToCheque < 0) {
        reminders.push({ pdcId: pdc._id, chequeNumber: pdc.chequeNumber, bank: pdc.bank, amount: pdc.amount, chequeDate: pdc.chequeDate, status: pdc.status, daysToChequeDate: daysToCheque, reminderLevel: "critical", milestone: `Overdue by ${Math.abs(daysToCheque)} day${Math.abs(daysToCheque) === 1 ? "" : "s"}` });
      }
    }

    return reminders.sort((a, b) => a.daysToChequeDate - b.daysToChequeDate);
  },
});

/**
 * Send PDC reminder notifications — call this to generate notification records
 * for any PDCs with reminders due today (T-7, T-3, T-1, Today, Overdue).
 * Skips milestones that already have a notification sent.
 */
export const sendPDCReminders = mutation({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const dayMs = 86400000;
    const nowDays = Math.floor(now / dayMs);

    const allPdcs = await ctx.db.query("payment_pdcs").collect();
    const activePdcs = allPdcs.filter((p) => p.status === "scheduled" || p.status === "deposited");
    // Fetch existing pdc notifications to avoid duplicates
    const allNotifs = await ctx.db.query("notifications").collect();
    const existingNotifications = allNotifs.filter((n) => n.referenceType === "pdc");

    let sent = 0;
    for (const pdc of activePdcs) {
      const chequeDays = Math.floor(pdc.chequeDate / dayMs);
      const daysTo = chequeDays - nowDays;

      let milestone: string | null = null;
      if (daysTo === 7) milestone = "PDC Due in 7 Days";
      else if (daysTo === 3) milestone = "PDC Due in 3 Days";
      else if (daysTo === 1) milestone = "PDC Due Tomorrow";
      else if (daysTo === 0) milestone = "PDC Due Today";
      else if (daysTo < 0 && daysTo > -30) milestone = `PDC Overdue by ${Math.abs(daysTo)} days`;

      if (milestone) {
        // Dedup: skip if notification already exists for this PDC + milestone
        const alreadySent = existingNotifications.some(
          (n) => n.referenceId === pdc._id && n.title === milestone
        );
        if (alreadySent) continue;

        await ctx.db.insert("notifications", {
          userId: args.userId || pdc.createdBy,
          type: "payment",
          title: milestone,
          message: `${pdc.bank} #${pdc.chequeNumber} — ₹${pdc.amount.toLocaleString()} — Cheque Date: ${new Date(pdc.chequeDate).toLocaleDateString()}`,
          referenceId: pdc._id,
          referenceType: "pdc",
          isRead: false,
          createdAt: now,
        });
        sent++;
      }
    }
    return { sent };
  },
});

/**
 * Get PDC Dashboard — collection overview of all PDCs across the org.
 */
export const getPDCDashboard = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const dayMs = 86400000;
    const nowDays = Math.floor(now / dayMs);

    const allPdcs = await ctx.db.query("payment_pdcs").collect();

    const scheduled = allPdcs.filter((p) => p.status === "scheduled");
    const deposited = allPdcs.filter((p) => p.status === "deposited");
    const cleared = allPdcs.filter((p) => p.status === "cleared");
    const bounced = allPdcs.filter((p) => p.status === "bounced");
    const cancelled = allPdcs.filter((p) => p.status === "cancelled");

    const scheduledTotal = scheduled.reduce((s, p) => s + p.amount, 0);
    const depositedTotal = deposited.reduce((s, p) => s + p.amount, 0);
    const clearedTotal = cleared.reduce((s, p) => s + p.amount, 0);
    const bouncedTotal = bounced.reduce((s, p) => s + p.amount, 0);

    const dueThisWeek = scheduled.filter((p) => {
      const d = Math.floor(p.chequeDate / dayMs);
      return d >= nowDays && d <= nowDays + 7;
    });
    const overdue = scheduled.filter((p) => Math.floor(p.chequeDate / dayMs) < nowDays);
    const dueToday = scheduled.filter((p) => Math.floor(p.chequeDate / dayMs) === nowDays);

    return {
      total: allPdcs.length,
      active: scheduled.length + deposited.length,
      scheduled: scheduled.length, scheduledTotal,
      deposited: deposited.length, depositedTotal,
      cleared: cleared.length, clearedTotal,
      bounced: bounced.length, bouncedTotal,
      cancelled: cancelled.length,
      dueToday: dueToday.length, dueTodayTotal: dueToday.reduce((s, p) => s + p.amount, 0),
      dueThisWeek: dueThisWeek.length, dueThisWeekTotal: dueThisWeek.reduce((s, p) => s + p.amount, 0),
      overdue: overdue.length, overdueTotal: overdue.reduce((s, p) => s + p.amount, 0),
      bounceRate: cleared.length + bounced.length > 0
        ? Math.round((bounced.length / (cleared.length + bounced.length)) * 100)
        : 0,
    };
  },
});

export const updatePDCStatus = mutation({
  args: {
    pdcId: v.id("payment_pdcs"),
    status: v.union(v.literal("deposited"), v.literal("cleared"), v.literal("bounced"), v.literal("cancelled")),
    userId: v.id("users"), bounceReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const pdc = await ctx.db.get(args.pdcId);
    if (!pdc) throw new Error("PDC not found");

    const patch: Record<string, any> = { status: args.status, updatedAt: now };
    if (args.status === "deposited") { patch.depositDate = now; patch.depositedBy = args.userId; }
    if (args.status === "bounced") { patch.bouncedAt = now; patch.bounceReason = args.bounceReason; }

    // When a PDC clears (bank confirms the cheque), create a verified payment record
    // and link it to the PDC. This ensures cleared PDC amounts flow into payment
    // totals, CEO dashboard cards, and auto-conversion checks.
    if (args.status === "cleared") {
      // Guard: skip if a payment was already linked to this PDC (prevent duplicates)
      if (!pdc.linkedPaymentId) {
        const paymentId = await ctx.db.insert("leadPayments", {
          leadId: pdc.leadId,
          amount: pdc.amount,
          mode: "cheque",
          reference: `${pdc.bank} #${pdc.chequeNumber}`,
          notes: `Auto-created from cleared PDC — ${pdc.bank} #${pdc.chequeNumber} (cheque date: ${new Date(pdc.chequeDate).toLocaleDateString()})`,
          enteredBy: args.userId,
          verifiedBy: args.userId,
          verifiedAt: now,
          status: "verified",
          createdAt: now,
          updatedAt: now,
        });
        patch.linkedPaymentId = paymentId;
      }
    }

    await ctx.db.patch(args.pdcId, patch);

    if (pdc) {
      const actionMap: Record<string, string> = {
        deposited: "pdc_deposited",
        cleared: "pdc_cleared",
        bounced: "pdc_bounced",
        cancelled: "pdc_cancelled",
      };
      const action = actionMap[args.status] || "pdc_updated";
      const descMap: Record<string, string> = {
        deposited: `Deposited cheque #${pdc.chequeNumber} — ${pdc.bank}`,
        cleared: `Cheque cleared by bank — ${pdc.bank} #${pdc.chequeNumber} (₹${pdc.amount.toLocaleString()})`,
        bounced: `Cheque bounced — ${pdc.bank} #${pdc.chequeNumber}${args.bounceReason ? ` — ${args.bounceReason}` : ""}`,
        cancelled: `Cancelled PDC — ${pdc.bank} #${pdc.chequeNumber}`,
      };
      await logActivity(ctx, pdc.leadId, action,
        descMap[args.status] || `PDC ${args.status}: ${pdc.bank} #${pdc.chequeNumber}`,
        args.userId);
    }
  },
});

// ============================
// PAYMENT COMMITMENTS
// ============================

export const getLeadCommitments = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => {
    return await ctx.db.query("payment_commitments").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect();
  },
});

export const createCommitment = mutation({
  args: {
    leadId: v.id("leadMaster"), amount: v.number(), commitDate: v.number(),
    reason: v.optional(v.string()), confidence: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const cmtId = await ctx.db.insert("payment_commitments", {
      leadId: args.leadId, amount: args.amount, commitDate: args.commitDate,
      reason: args.reason, confidence: args.confidence, ownerId: args.ownerId,
      status: "active", createdAt: now, updatedAt: now,
    });
    await ctx.db.insert("leadTasks", {
      leadId: args.leadId, title: `Payment Commitment Followup — ₹${args.amount.toLocaleString()}`,
      description: args.reason || "Follow up on payment commitment",
      ownerId: args.ownerId, assignedTo: args.ownerId, dueDate: args.commitDate,
      status: "pending", priority: "medium", isApproved: false, createdAt: now, updatedAt: now,
    });
    await logActivity(ctx, args.leadId, "commitment_created",
      `Payment commitment: ₹${args.amount.toLocaleString()} by ${new Date(args.commitDate).toLocaleDateString()} (${args.confidence} confidence)`,
      args.ownerId);
    return cmtId;
  },
});

export const updateCommitmentStatus = mutation({
  args: {
    commitmentId: v.id("payment_commitments"),
    status: v.union(v.literal("completed"), v.literal("expired"), v.literal("cancelled")),
    paymentId: v.optional(v.id("leadPayments")), userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const patch: Record<string, any> = { status: args.status, updatedAt: now };
    if (args.paymentId) patch.paymentId = args.paymentId;
    await ctx.db.patch(args.commitmentId, patch);
    const cmt = await ctx.db.get(args.commitmentId);
    if (cmt) {
      await logActivity(ctx, cmt.leadId, "commitment_updated",
        `Commitment ${args.status}: ₹${cmt.amount.toLocaleString()}`, args.userId);
    }
  },
});

// ============================
// OVERDUE INSTALLMENT AUTOMATION
// ============================

/**
 * Process overdue installments — marks all planned/due installments
 * past their due date as overdue and sends notifications.
 * Returns counts of processed installments by severity.
 */
export const processOverdueInstallments = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let markedOverdue = 0;
    let warned = 0;

    const allInstallments = await ctx.db.query("payment_installments").collect();

    // Group by planId for efficient plan lookups
    const plansMap = new Map<string, any>();

    for (const inst of allInstallments) {
      if (inst.status !== "planned" && inst.status !== "due") continue;

      const daysOverdue = Math.floor((now - inst.dueDate) / 86400000);

      if (daysOverdue >= 1) {
        // Look up plan for creator info (cache to avoid redundant queries)
        if (!plansMap.has(inst.planId)) {
          const plan = await ctx.db.get(inst.planId);
          if (plan) plansMap.set(inst.planId, plan);
        }
        const plan = plansMap.get(inst.planId);
        // Skip if plan not found (shouldn't happen, but guard against orphan installments)
        if (!plan) continue;

        // Mark as overdue
        await ctx.db.patch(inst._id, { status: "overdue", updatedAt: now });

        // Create notification for plan creator
        await ctx.db.insert("notifications", {
          userId: plan.createdBy,
          type: "payment",
          title: `Installment #${inst.installmentNumber} Overdue`,
          message: `Installment of ₹${inst.amount.toLocaleString()} overdue by ${daysOverdue} day${daysOverdue === 1 ? "" : "s"} (due ${new Date(inst.dueDate).toLocaleDateString()})`,
          referenceId: inst._id,
          referenceType: "installment",
          isRead: false,
          createdAt: now,
        });

        // Log activity on the lead
        await ctx.db.insert("leadActivity", {
          leadId: inst.leadId,
          action: "installment_overdue",
          description: `Installment #${inst.installmentNumber} (₹${inst.amount.toLocaleString()}) marked overdue — ${daysOverdue} day${daysOverdue === 1 ? "" : "s"} past due`,
          userId: plan.createdBy,
          createdAt: now,
        });

        markedOverdue++;
      } else if (daysOverdue >= 0) {
        // Due today — warn by updating status to "due" if still "planned"
        if (inst.status === "planned") {
          await ctx.db.patch(inst._id, { status: "due", updatedAt: now });
          warned++;
        }
      }
    }

    return { markedOverdue, warned, processedAt: now };
  },
});

// ============================
// INSTALLMENT REMINDERS & QUICK PAY
// ============================

/**
 * Send a reminder notification for a specific overdue installment.
 * Creates a notification record for the user and logs a lead activity.
 */
export const sendInstallmentReminder = mutation({
  args: { installmentId: v.id("payment_installments"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const inst = await ctx.db.get(args.installmentId);
    if (!inst) throw new Error("Installment not found");

    const daysOverdue = Math.floor((now - inst.dueDate) / 86400000);

    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "payment",
      title: `Reminder: Installment #${inst.installmentNumber} Overdue`,
      message: `Installment of ₹${inst.amount.toLocaleString()} is overdue by ${daysOverdue} day${daysOverdue === 1 ? "" : "s"} (due ${new Date(inst.dueDate).toLocaleDateString()})`,
      referenceId: inst._id,
      referenceType: "installment",
      isRead: false,
      createdAt: now,
    });

    await ctx.db.insert("leadActivity", {
      leadId: inst.leadId,
      action: "installment_reminder_sent",
      description: `Reminder sent for Installment #${inst.installmentNumber} (₹${inst.amount.toLocaleString()}) — ${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue`,
      userId: args.userId,
      createdAt: now,
    });

    return { sent: true, daysOverdue };
  },
});

/**
 * Quick mark installment as paid — creates a payment record and
 * links it to the installment in a single mutation.
 */
export const quickMarkInstallmentPaid = mutation({
  args: {
    installmentId: v.id("payment_installments"),
    amount: v.number(),
    mode: v.union(v.literal("cash"), v.literal("upi"), v.literal("bank"), v.literal("card"), v.literal("cheque"), v.literal("online")),
    reference: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const inst = await ctx.db.get(args.installmentId);
    if (!inst) throw new Error("Installment not found");

    // Create a payment record
    const paymentId = await ctx.db.insert("leadPayments", {
      leadId: inst.leadId,
      amount: args.amount,
      mode: args.mode,
      reference: args.reference,
      notes: `Auto-linked to Installment #${inst.installmentNumber}`,
      status: "pending",
      enteredBy: args.userId,
      createdAt: now,
      updatedAt: now,
    });

    // Mark installment as paid linked to this payment
    await ctx.db.patch(args.installmentId, {
      status: "paid",
      paymentId: paymentId,
      paidAt: now,
      updatedAt: now,
    });

    // Log activity
    await ctx.db.insert("leadActivity", {
      leadId: inst.leadId,
      action: "installment_paid",
      description: `Installment #${inst.installmentNumber} paid: ₹${args.amount.toLocaleString()} (${args.mode})`,
      userId: args.userId,
      createdAt: now,
    });

    return { paymentId, installmentId: inst._id };
  },
});

// ============================
// DAILY COLLECTION AUTOMATION
// ============================

/**
 * Daily collection automation — runs all automated collection tasks.
 * Designed to be called from the Convex cron scheduler.
 * Composes processOverdueInstallments + sendPDCReminders via internal mutation calls.
 *
 * Currently disabled — returns { status: "disabled" } until
 * `bun convex dev --once` is run to deploy collectionEngine
 * functions and regenerate the Convex API types.
 */
export const dailyCollectionAutomation = mutation({
  args: {},
  handler: async (_ctx) => {
    // ═══════════════════════════════════════
    // DISABLED — waiting for Convex codegen
    // ═══════════════════════════════════════
    // Remove this early return and uncomment the
    // inlined logic after running `bun convex dev --once`.
    // The internal.runMutation calls require the generated
    // API to include collectionEngine module exports.
    return {
      status: "disabled",
      overdueInstallments: 0,
      installmentsWarned: 0,
      pdcRemindersSent: 0,
      processedAt: Date.now(),
    };
  },
});

// ============================
// COLLECTION SUMMARY
// ============================

export const getCollectionSummary = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => {
    const payments = await ctx.db.query("leadPayments").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect();
    const verifiedTotal = payments.filter((p) => p.status === "verified").reduce((s, p) => s + p.amount, 0);
    const pendingTotal = payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
    const installments = await ctx.db.query("payment_installments").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect();
    const upcomingInstallments = installments.filter((i) => i.status === "planned" || i.status === "due");
    const overdueInstallments = installments.filter((i) => i.status === "overdue");
    const upcomingPdcs = (await ctx.db.query("payment_pdcs").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect())
      .filter((p) => p.status === "scheduled" || p.status === "deposited");
    const commitments = (await ctx.db.query("payment_commitments").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect())
      .filter((c) => c.status === "active");
    return {
      collected: verifiedTotal, outstanding: pendingTotal,
      upcomingInstallments: upcomingInstallments.reduce((s, i) => s + i.amount, 0),
      overdueInstallments: overdueInstallments.reduce((s, i) => s + i.amount, 0),
      pdcExposure: upcomingPdcs.reduce((s, p) => s + p.amount, 0),
      commitmentTotal: commitments.reduce((s, c) => s + c.amount, 0),
      upcomingCount: upcomingInstallments.length, overdueCount: overdueInstallments.length,
      activePlans: (await ctx.db.query("payment_plans").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect())
        .filter((p) => p.status === "active").length,
      activeCommitments: commitments.length,
    };
  },
});

// ============================
// COLLECTION DASHBOARD (Org-wide)
// ============================

/**
 * Organization-wide collection dashboard — aggregates PDC stats,
 * overdue installment totals, and overall collection health.
 */
export const getCollectionDashboard = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const dayMs = 86400000;
    const nowDays = Math.floor(now / dayMs);

    // ── PDC Stats ──
    const allPdcs = await ctx.db.query("payment_pdcs").collect();
    const scheduled = allPdcs.filter((p) => p.status === "scheduled");
    const deposited = allPdcs.filter((p) => p.status === "deposited");
    const cleared = allPdcs.filter((p) => p.status === "cleared");
    const bounced = allPdcs.filter((p) => p.status === "bounced");
    const cancelled = allPdcs.filter((p) => p.status === "cancelled");

    const pdcDueToday = scheduled.filter((p) => Math.floor(p.chequeDate / dayMs) === nowDays);
    const pdcDueThisWeek = scheduled.filter((p) => {
      const d = Math.floor(p.chequeDate / dayMs);
      return d >= nowDays && d <= nowDays + 7;
    });
    const pdcOverdue = scheduled.filter((p) => Math.floor(p.chequeDate / dayMs) < nowDays);

    // ── Installment Stats ──
    const allInstallments = await ctx.db.query("payment_installments").collect();
    const planned = allInstallments.filter((i) => i.status === "planned");
    const due = allInstallments.filter((i) => i.status === "due");
    const overdue = allInstallments.filter((i) => i.status === "overdue");
    const paid = allInstallments.filter((i) => i.status === "paid");

    // ── Payment Stats ──
    const allPayments = await ctx.db.query("leadPayments").collect();
    const verifiedPayments = allPayments.filter((p) => p.status === "verified");
    const pendingPayments = allPayments.filter((p) => p.status === "pending");
    const totalCollected = verifiedPayments.reduce((s, p) => s + p.amount, 0);
    const totalPending = pendingPayments.reduce((s, p) => s + p.amount, 0);

    // ── Active Plans ──
    const allPlans = await ctx.db.query("payment_plans").collect();
    const activePlans = allPlans.filter((pl) => pl.status === "active");

    // ── Active Commitments ──
    const allCommitments = await ctx.db.query("payment_commitments").collect();
    const activeCommitments = allCommitments.filter((c) => c.status === "active");

    return {
      // PDC Overview
      pdcTotal: allPdcs.length,
      pdcScheduled: scheduled.length, pdcScheduledTotal: scheduled.reduce((s, p) => s + p.amount, 0),
      pdcDeposited: deposited.length, pdcDepositedTotal: deposited.reduce((s, p) => s + p.amount, 0),
      pdcCleared: cleared.length, pdcClearedTotal: cleared.reduce((s, p) => s + p.amount, 0),
      pdcBounced: bounced.length, pdcBouncedTotal: bounced.reduce((s, p) => s + p.amount, 0),
      pdcCancelled: cancelled.length,
      pdcDueToday: pdcDueToday.length, pdcDueTodayTotal: pdcDueToday.reduce((s, p) => s + p.amount, 0),
      pdcDueThisWeek: pdcDueThisWeek.length, pdcDueThisWeekTotal: pdcDueThisWeek.reduce((s, p) => s + p.amount, 0),
      pdcOverdue: pdcOverdue.length, pdcOverdueTotal: pdcOverdue.reduce((s, p) => s + p.amount, 0),
      pdcBounceRate: cleared.length + bounced.length > 0
        ? Math.round((bounced.length / (cleared.length + bounced.length)) * 100)
        : 0,

      // Installment Overview
      installmentPlanned: planned.length, installmentPlannedTotal: planned.reduce((s, i) => s + i.amount, 0),
      installmentDue: due.length, installmentDueTotal: due.reduce((s, i) => s + i.amount, 0),
      installmentOverdue: overdue.length, installmentOverdueTotal: overdue.reduce((s, i) => s + i.amount, 0),
      installmentPaid: paid.length, installmentPaidTotal: paid.reduce((s, i) => s + i.amount, 0),

      // Payment Overview
      totalCollected,
      totalPending,
      verifiedPaymentCount: verifiedPayments.length,
      pendingPaymentCount: pendingPayments.length,

      // Plans
      activePlanCount: activePlans.length,

      // Commitments
      activeCommitmentCount: activeCommitments.length,
      activeCommitmentTotal: activeCommitments.reduce((s, c) => s + c.amount, 0),
    };
  },
});

export const getCollectionCenter = query({
  args: {},
  handler: async (ctx) => {
    const [leads, allPayments, allPlans, allInstallments, allPDCs, allCommitments, allLeadCourses, allActivity] = await Promise.all([
      ctx.db.query("leadMaster").collect(),
      ctx.db.query("leadPayments").collect(),
      ctx.db.query("payment_plans").collect(),
      ctx.db.query("payment_installments").collect(),
      ctx.db.query("payment_pdcs").collect(),
      ctx.db.query("payment_commitments").collect(),
      ctx.db.query("leadCourses").collect(),
      ctx.db.query("leadActivity").collect(),
    ]);

    const activeLeads = leads.filter((l) => l.status !== "archived");
    const now = Date.now();

    // Build course name map
    const courseIds = [...new Set(allLeadCourses.map((lc) => lc.courseId))];
    const courseDocs = (await Promise.all(courseIds.map((id) => ctx.db.get(id)))).filter((c): c is NonNullable<typeof c> => c != null);
    const courseMap = new Map(courseDocs.map((c) => [c._id, c]));

    const leadCourseMap = new Map<string, string[]>();
    for (const lc of allLeadCourses) {
      const existing = leadCourseMap.get(lc.leadId) || [];
      const course = courseMap.get(lc.courseId);
      if (course) existing.push((course as any).courseName);
      leadCourseMap.set(lc.leadId, existing);
    }

    return activeLeads.map((lead) => {
      const leadPayments = allPayments.filter((p) => p.leadId === lead._id);
      const verifiedPayments = leadPayments.filter((p) => p.status === "verified");
      const pendingPayments = leadPayments.filter((p) => p.status === "pending");
      const totalPaid = verifiedPayments.reduce((s, p) => s + p.amount, 0);
      const totalPending = pendingPayments.reduce((s, p) => s + p.amount, 0);
      const grossFees = lead.standardAmount || lead.expectedRevenue || 0;
      const discountAmt = lead.discountAmount || 0;
      const waiverAmt = lead.waiverAmount || 0;
      const netPayable = lead.finalPayable || Math.max(0, grossFees - discountAmt - waiverAmt);
      const balanceDue = Math.max(0, netPayable - totalPaid);

      const plans = allPlans.filter((p) => p.leadId === lead._id);
      const installments = allInstallments.filter((i) => plans.some((p) => p._id === i.planId));
      const overdueInsts = installments.filter((i) => i.status === "overdue" || (i.status === "due" && i.dueDate < now));
      const pdcs = allPDCs.filter((p) => p.leadId === lead._id);
      const activePDCs = pdcs.filter((p) => p.status === "scheduled" || p.status === "deposited");
      const commitments = allCommitments.filter((c) => c.leadId === lead._id);
      const activeCommitments = commitments.filter((c) => c.status === "active");

      const lastPayment = leadPayments.length > 0 ? leadPayments.sort((a, b) => b.createdAt - a.createdAt)[0] : null;
      const lastActivity = allActivity.filter((a) => a.leadId === lead._id).sort((a, b) => b.createdAt - a.createdAt)[0];

      const daysOutstanding = netPayable > 0 && totalPaid > 0
        ? Math.floor((now - (lastPayment?.createdAt || lead.createdAt)) / 86400000)
        : netPayable > 0
          ? Math.floor((now - lead.createdAt) / 86400000) : 0;

      const health = balanceDue <= 0 ? "healthy"
        : overdueInsts.length > 0 || activePDCs.some((p) => p.chequeDate < now) ? "critical"
          : balanceDue <= netPayable * 0.3 ? "good" : "attention";

      return {
        leadId: lead._id,
        firstName: lead.firstName,
        lastName: lead.lastName,
        phone: lead.phone,
        whatsappUsername: lead.whatsappUsername,
        stage: lead.stage,
        courses: leadCourseMap.get(lead._id) || [],
        grossFees,
        discountAmount: discountAmt,
        waiverAmount: waiverAmt,
        netPayable,
        totalCollected: totalPaid,
        totalPending,
        balanceDue,
        paymentStatus: netPayable === 0 ? "no_fees" : totalPaid >= netPayable ? "paid" : totalPaid > 0 ? "partial" : "unpaid",
        verificationStatus: pendingPayments.length > 0 ? "pending" : "verified",
        installmentCount: installments.length,
        overdueInstallments: overdueInsts.length,
        activePDCs: activePDCs.length,
        pdcAmount: activePDCs.reduce((s, p) => s + p.amount, 0),
        activeCommitments: activeCommitments.length,
        commitmentAmount: activeCommitments.reduce((s, c) => s + c.amount, 0),
        lastPaymentAmount: lastPayment?.amount || 0,
        lastPaymentDate: lastPayment?.createdAt || null,
        lastContactDate: lastActivity?.createdAt || null,
        daysOutstanding,
        collectionHealth: health,
      };
    });
  },
});
