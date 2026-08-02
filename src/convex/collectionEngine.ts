/**
 * Collection Engine — Enterprise-integrated Collection Management
 *
 * Every mutation uses withScopeAndEvents() for:
 *   - ScopeEngine authorization
 *   - Event Pipeline (finance.payment.received, finance.cheque.bounced, etc.)
 *   - Timeline auto-recording
 *   - Audit auto-logging
 *   - Notification Matrix (payment, PDC reminders, bounce notifications)
 *   - Auto-document generation (bounce_notice on cheque.bounced)
 *
 * Manual logActivity / createNotification helpers replaced by
 * automated event pipeline in withScopeAndEvents.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { withScopeAndEvents, docOnPayment, docOnBounce } from "./withScopeAndEvents";
import { Events } from "./eventRegistry";

// ─── Helpers ──────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

async function queueCommunication(
  ctx: any,
  channel: "email" | "sms" | "whatsapp",
  recipientAddress: string,
  subject: string,
  body: string,
  scheduledAt?: number,
) {
  const now = Date.now();
  await ctx.db.insert("communicationQueue", {
    channel,
    recipientAddress,
    subject,
    body,
    status: "queued",
    scheduledAt: scheduledAt ?? now,
    retryCount: 0,
    maxRetries: 3,
    createdAt: now,
    updatedAt: now,
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
  handler: withScopeAndEvents(
    {
      operation: "create",
      module: "finance",
      entity: "payment_plan",
      eventType: Events.FINANCE.FEE_STRUCTURE_CREATED,
      title: "Payment Plan Created",
      getUserId: (args) => args.createdBy,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: () => undefined,
      notifyViaMatrix: true, // Notify collections + finance
    },
    async (ctx, args) => {
      const now = Date.now();
      const installmentAmount = Math.round(args.totalAmount / args.installmentCount);
      const dayMs = 86400000;
      const freqMap: Record<string, number> = { weekly: 7, monthly: 30, quarterly: 91, custom: 30 };
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
        const st = dueDate <= now ? "due" as any : "planned" as any;
        await ctx.db.insert("payment_installments", {
          planId: planId as any, leadId: args.leadId, installmentNumber: i + 1, amount: amt,
          dueDate, status: st, createdAt: now, updatedAt: now,
        });
        await ctx.db.insert("leadTasks", {
          leadId: args.leadId, title: `Installment #${i + 1} Due — ${formatCurrency(amt)}`,
          description: `Auto-generated from payment plan (${args.frequency})`,
          ownerId: args.createdBy, assignedTo: args.createdBy,
          dueDate: dueDate - args.graceDays * dayMs, status: "pending", priority: "medium",
          isApproved: false, createdAt: now, updatedAt: now,
        });
      }

      return planId;
    }
  ),
});

export const cancelPaymentPlan = mutation({
  args: { planId: v.id("payment_plans"), userId: v.id("users") },
  handler: withScopeAndEvents(
    {
      operation: "delete",
      module: "finance",
      entity: "payment_plan",
      getUserId: (args) => args.userId,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: () => undefined,
      notifyViaMatrix: false,
    },
    async (ctx, args) => {
      const now = Date.now();
      await ctx.db.patch(args.planId, { status: "cancelled", updatedAt: now } as any);
      const installments = await ctx.db.query("payment_installments").withIndex("planId", (q: any) => q.eq("planId", args.planId)).collect();
      for (const inst of installments) {
        if (inst.status === "planned" || inst.status === "due") {
          await ctx.db.patch(inst._id, { status: "cancelled", updatedAt: now } as any);
        }
      }
    }
  ),
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
  handler: withScopeAndEvents(
    {
      operation: "update",
      module: "finance",
      entity: "installment",
      eventType: Events.FINANCE.PAYMENT_RECEIVED,
      title: "Installment Paid",
      getUserId: (args) => args.userId,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: () => undefined,
      notifyViaMatrix: true, // Notify student + parent + finance
      autoGenerateDocs: [
        {
          documentType: "fee_receipt",
          contextBuilder: (args: any) => ({
            installmentId: args.installmentId,
            paymentId: args.paymentId,
            generatedAt: new Date().toISOString(),
          }),
        },
      ],
    },
    async (ctx, args) => {
      const now = Date.now();
      await ctx.db.patch(args.installmentId, { status: "paid", paymentId: args.paymentId, paidAt: now, updatedAt: now } as any);
      return args.installmentId;
    }
  ),
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
  handler: withScopeAndEvents(
    {
      operation: "create",
      module: "finance",
      entity: "pdc",
      eventType: Events.FINANCE.CHEQUE_RECEIVED,
      title: "PDC Created",
      getUserId: (args) => args.createdBy,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: () => undefined,
      notifyViaMatrix: true, // Notify parent, counsellor, collections, finance
    },
    async (ctx, args) => {
      const now = Date.now();
      const dayMs = 86400000;
      const pdcId = await ctx.db.insert("payment_pdcs", {
        leadId: args.leadId, chequeNumber: args.chequeNumber, bank: args.bank,
        chequeDate: args.chequeDate, amount: args.amount, attachment: args.attachment,
        status: "scheduled", createdBy: args.createdBy, createdAt: now, updatedAt: now,
      });

      // Create deposit task for collection team
      await ctx.db.insert("leadTasks", {
        leadId: args.leadId, title: `Deposit PDC — ${args.bank} #${args.chequeNumber} (${formatCurrency(args.amount)})`,
        description: `PDC scheduled for deposit. Cheque date: ${new Date(args.chequeDate).toLocaleDateString()}. Bank: ${args.bank}. Amount: ${formatCurrency(args.amount)}`,
        ownerId: args.createdBy, assignedTo: args.createdBy, dueDate: args.chequeDate,
        status: "pending", priority: "high", isApproved: false, createdAt: now, updatedAt: now,
      });

      // Fetch lead contact info for communications
      const lead = await ctx.db.get(args.leadId);
      const leadPhone = lead?.phone || "";
      const leadEmail = lead?.email || "";

      // Create scheduled reminder notifications at T-7, T-3, T-1, Today
      const milestones = [
        { label: "PDC Due in 7 Days", daysBefore: 7 },
        { label: "PDC Due in 3 Days", daysBefore: 3 },
        { label: "PDC Due Tomorrow", daysBefore: 1 },
        { label: "PDC Due Today", daysBefore: 0 },
      ];
      for (const ms of milestones) {
        const reminderDate = args.chequeDate - ms.daysBefore * dayMs;
        if (reminderDate > now) {
          await ctx.db.insert("notifications", {
            userId: args.createdBy,
            type: "payment" as any,
            title: ms.label,
            message: `${args.bank} #${args.chequeNumber} — ${formatCurrency(args.amount)} — Cheque Date: ${new Date(args.chequeDate).toLocaleDateString()}`,
            referenceId: pdcId,
            referenceType: "pdc",
            isRead: false,
            createdAt: now,
          });

          if (leadEmail) {
            await queueCommunication(ctx, "email", leadEmail,
              `PDC Reminder: ${ms.label} — ${args.bank} #${args.chequeNumber}`,
              `Dear ${lead?.firstName || "Customer"},\n\nPDC Reminder:\n  Bank: ${args.bank}\n  Cheque Number: ${args.chequeNumber}\n  Amount: ${formatCurrency(args.amount)}\n  Cheque Date: ${new Date(args.chequeDate).toLocaleDateString()}\n  Reminder: ${ms.label}\n\nPlease ensure sufficient funds.\n\n- EEOS Collections Team`,
              reminderDate);
          }
          if (leadPhone) {
            await queueCommunication(ctx, "sms", leadPhone, "",
              `PDC Reminder: ${ms.label}\n${args.bank} #${args.chequeNumber}\nAmount: ${formatCurrency(args.amount)}\nDate: ${new Date(args.chequeDate).toLocaleDateString()}`,
              reminderDate);
          }
        }
      }

      return pdcId;
    }
  ),
});

export const updatePDCStatus = mutation({
  args: {
    pdcId: v.id("payment_pdcs"),
    status: v.union(v.literal("deposited"), v.literal("cleared"), v.literal("bounced"), v.literal("cancelled")),
    userId: v.id("users"), bounceReason: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      operation: "update",
      module: "finance",
      entity: "pdc",
      eventType: Events.FINANCE.CHEQUE_BOUNCED,
      title: "PDC Status Updated",
      getUserId: (args) => args.userId,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: () => undefined,
      notifyViaMatrix: true, // The notification matrix will check event type
      autoGenerateDocs: [
        {
          documentType: "bounce_notice" as const,
          contextBuilder: (args: any) => ({
            chequeNumber: args.chequeNumber,
            bank: "",
            bounceReason: args.bounceReason || "",
            generatedAt: new Date().toISOString(),
          }),
        },
      ],
    },
    async (ctx, args) => {
      const now = Date.now();
      const pdc = await ctx.db.get(args.pdcId);
      if (!pdc) throw new Error("PDC not found");

      const patch: Record<string, any> = { status: args.status, updatedAt: now };
      if (args.status === "deposited") { patch.depositDate = now; patch.depositedBy = args.userId; }
      if (args.status === "bounced") { patch.bouncedAt = now; patch.bounceReason = args.bounceReason; }

      if (args.status === "cleared") {
        if (!pdc.linkedPaymentId) {
          const paymentId = await ctx.db.insert("leadPayments", {
            leadId: pdc.leadId,
            amount: pdc.amount,
            mode: "cheque",
            reference: `${pdc.bank} #${pdc.chequeNumber}`,
            notes: `Auto-created from cleared PDC — ${pdc.bank} #${pdc.chequeNumber}`,
            enteredBy: args.userId, verifiedBy: args.userId, verifiedAt: now,
            status: "verified", createdAt: now, updatedAt: now,
          });
          patch.linkedPaymentId = paymentId;
        }
      }

      await ctx.db.patch(args.pdcId, patch);
      return args.pdcId;
    }
  ),
});

// ─── Queries (no enterprise integration needed — read-only) ─

export const getUpcomingPDCReminders = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const dayMs = 86400000;
    const allPdcs = await ctx.db.query("payment_pdcs").collect();
    const nowDays = Math.floor(now / dayMs);
    const activePdcs = allPdcs.filter((p) => p.status === "scheduled" || p.status === "deposited");

    return activePdcs.map((pdc) => {
      const chequeDays = Math.floor(pdc.chequeDate / dayMs);
      const daysToCheque = chequeDays - nowDays;
      let reminderLevel: "critical" | "warning" | "info" = "info";
      let milestone = "";
      if (daysToCheque === 7) { reminderLevel = "info"; milestone = "Due in 7 Days"; }
      else if (daysToCheque === 3) { reminderLevel = "warning"; milestone = "Due in 3 Days"; }
      else if (daysToCheque === 1) { reminderLevel = "warning"; milestone = "Due Tomorrow"; }
      else if (daysToCheque === 0) { reminderLevel = "critical"; milestone = "Due Today"; }
      else if (daysToCheque < 0) { reminderLevel = "critical"; milestone = `Overdue by ${Math.abs(daysToCheque)}d`; }
      else return null;
      return { pdcId: pdc._id, chequeNumber: pdc.chequeNumber, bank: pdc.bank, amount: pdc.amount, chequeDate: pdc.chequeDate, status: pdc.status, daysToChequeDate: daysToCheque, reminderLevel, milestone };
    }).filter(Boolean);
  },
});

export const sendPDCReminders = mutation({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const dayMs = 86400000;
    const nowDays = Math.floor(now / dayMs);

    const allPdcs = await ctx.db.query("payment_pdcs").collect();
    const activePdcs = allPdcs.filter((p) => p.status === "scheduled" || p.status === "deposited");
    const allNotifs = await ctx.db.query("notifications").collect();
    const existingNotifications = allNotifs.filter((n) => n.referenceType === "pdc");

    const leadIds = [...new Set(activePdcs.map((p) => p.leadId))];
    const leadDocs = (await Promise.all(leadIds.map((id) => ctx.db.get(id)))).filter((l): l is NonNullable<typeof l> => l != null);
    const leadMap = new Map(leadDocs.map((l) => [l._id, l]));

    let sent = 0, emailsQueued = 0, smsQueued = 0;
    for (const pdc of activePdcs) {
      const chequeDays = Math.floor(pdc.chequeDate / dayMs);
      const daysTo = chequeDays - nowDays;

      let milestone: string | null = null;
      if (daysTo === 7) milestone = "PDC Due in 7 Days";
      else if (daysTo === 3) milestone = "PDC Due in 3 Days";
      else if (daysTo === 1) milestone = "PDC Due Tomorrow";
      else if (daysTo === 0) milestone = "PDC Due Today";
      else if (daysTo < 0 && daysTo > -30) milestone = `PDC Overdue by ${Math.abs(daysTo)} days`;

      if (!milestone) continue;
      if (existingNotifications.some((n) => n.referenceId === pdc._id && n.title === milestone)) continue;

      await ctx.db.insert("notifications", {
        userId: args.userId || pdc.createdBy, type: "payment" as any, title: milestone,
        message: `${pdc.bank} #${pdc.chequeNumber} — ${formatCurrency(pdc.amount)}`,
        referenceId: pdc._id, referenceType: "pdc", isRead: false, createdAt: now,
      });
      sent++;

      const lead = leadMap.get(pdc.leadId);
      if (lead?.email) {
        await queueCommunication(ctx, "email", lead.email,
          `PDC Reminder: ${milestone} — ${pdc.bank} #${pdc.chequeNumber}`,
          `PDC Reminder: ${milestone}\nBank: ${pdc.bank}\nCheque #: ${pdc.chequeNumber}\nAmount: ${formatCurrency(pdc.amount)}`);
        emailsQueued++;
      }
      if (lead?.phone) {
        await queueCommunication(ctx, "sms", lead.phone, "",
          `${milestone}\n${pdc.bank} #${pdc.chequeNumber}\n${formatCurrency(pdc.amount)}`);
        smsQueued++;
      }
    }
    return { sent, emailsQueued, smsQueued };
  },
});

// ─── PDC & Collection Dashboards (Read-only queries) ─────

export const getPDCByStatus = query({
  args: { status: v.union(v.literal("scheduled"), v.literal("deposited"), v.literal("cleared"), v.literal("bounced"), v.literal("cancelled")) },
  handler: async (ctx, args) => {
    const allPdcs = await ctx.db.query("payment_pdcs").collect();
    const filtered = allPdcs.filter((p) => p.status === args.status);
    const leadIds = [...new Set(filtered.map((p) => p.leadId))];
    const leadDocs = (await Promise.all(leadIds.map((id) => ctx.db.get(id)))).filter((l): l is NonNullable<typeof l> => l != null);
    const leadMap = new Map(leadDocs.map((l) => [l._id, l]));

    return filtered.map((pdc) => {
      const lead = leadMap.get(pdc.leadId);
      return {
        pdcId: pdc._id, leadId: pdc.leadId,
        leadName: lead ? `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "Unknown" : "Unknown",
        leadPhone: lead?.phone || "", leadEmail: lead?.email || "",
        chequeNumber: pdc.chequeNumber, bank: pdc.bank, chequeDate: pdc.chequeDate,
        amount: pdc.amount, status: pdc.status, createdBy: pdc.createdBy, createdAt: pdc.createdAt,
      };
    });
  },
});

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

    return {
      total: allPdcs.length, active: scheduled.length + deposited.length,
      scheduled: scheduled.length, scheduledTotal: scheduled.reduce((s, p) => s + p.amount, 0),
      deposited: deposited.length, depositedTotal: deposited.reduce((s, p) => s + p.amount, 0),
      cleared: cleared.length, clearedTotal: cleared.reduce((s, p) => s + p.amount, 0),
      bounced: bounced.length, bouncedTotal: bounced.reduce((s, p) => s + p.amount, 0),
      cancelled: cancelled.length,
      dueToday: scheduled.filter((p) => Math.floor(p.chequeDate / dayMs) === nowDays).length,
      dueThisWeek: scheduled.filter((p) => { const d = Math.floor(p.chequeDate / dayMs); return d >= nowDays && d <= nowDays + 7; }).length,
      overdue: scheduled.filter((p) => Math.floor(p.chequeDate / dayMs) < nowDays).length,
      bounceRate: cleared.length + bounced.length > 0 ? Math.round((bounced.length / (cleared.length + bounced.length)) * 100) : 0,
    };
  },
});

// ─── Commitments ───────────────────────────────────────────

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
  handler: withScopeAndEvents(
    {
      operation: "create",
      module: "finance",
      entity: "commitment",
      getUserId: (args) => args.ownerId,
      getEntityCompanyId: () => undefined,
      getEntityBranchId: () => undefined,
      notifyViaMatrix: false,
    },
    async (ctx, args) => {
      const now = Date.now();
      const cmtId = await ctx.db.insert("payment_commitments", {
        leadId: args.leadId, amount: args.amount, commitDate: args.commitDate,
        reason: args.reason, confidence: args.confidence, ownerId: args.ownerId,
        status: "active", createdAt: now, updatedAt: now,
      });
      await ctx.db.insert("leadTasks", {
        leadId: args.leadId, title: `Payment Commitment Followup — ${formatCurrency(args.amount)}`,
        description: args.reason || "Follow up on payment commitment",
        ownerId: args.ownerId, assignedTo: args.ownerId, dueDate: args.commitDate,
        status: "pending", priority: "medium", isApproved: false, createdAt: now, updatedAt: now,
      });
      return cmtId;
    }
  ),
});

// ─── Collection Queries ────────────────────────────────────

export const getCollectionSummary = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => {
    const payments = await ctx.db.query("leadPayments").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect();
    const verifiedTotal = payments.filter((p) => p.status === "verified").reduce((s, p) => s + p.amount, 0);
    const pendingTotal = payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
    const installments = await ctx.db.query("payment_installments").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect();
    const upcomingPdcs = (await ctx.db.query("payment_pdcs").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect())
      .filter((p) => p.status === "scheduled" || p.status === "deposited");
    const commitments = (await ctx.db.query("payment_commitments").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect())
      .filter((c) => c.status === "active");

    return {
      collected: verifiedTotal, outstanding: pendingTotal,
      upcomingInstallments: installments.filter((i) => i.status === "planned" || i.status === "due").reduce((s, i) => s + i.amount, 0),
      overdueInstallments: installments.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0),
      pdcExposure: upcomingPdcs.reduce((s, p) => s + p.amount, 0),
      commitmentTotal: commitments.reduce((s, c) => s + c.amount, 0),
    };
  },
});

export const getCollectionDashboard = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const dayMs = 86400000;
    const nowDays = Math.floor(now / dayMs);

    const allPdcs = await ctx.db.query("payment_pdcs").collect();
    const allInstallments = await ctx.db.query("payment_installments").collect();
    const allPayments = await ctx.db.query("leadPayments").collect();

    const scheduled = allPdcs.filter((p) => p.status === "scheduled");
    const bounced = allPdcs.filter((p) => p.status === "bounced");
    const cleared = allPdcs.filter((p) => p.status === "cleared");

    return {
      pdcScheduled: scheduled.length, pdcScheduledTotal: scheduled.reduce((s, p) => s + p.amount, 0),
      pdcBounced: bounced.length, pdcBouncedTotal: bounced.reduce((s, p) => s + p.amount, 0),
      pdcCleared: cleared.length, pdcClearedTotal: cleared.reduce((s, p) => s + p.amount, 0),
      pdcBounceRate: cleared.length + bounced.length > 0 ? Math.round((bounced.length / (cleared.length + bounced.length)) * 100) : 0,
      pdcDueToday: scheduled.filter((p) => Math.floor(p.chequeDate / dayMs) === nowDays).length,
      pdcDueThisWeek: scheduled.filter((p) => { const d = Math.floor(p.chequeDate / dayMs); return d >= nowDays && d <= nowDays + 7; }).length,
      pdcOverdue: scheduled.filter((p) => Math.floor(p.chequeDate / dayMs) < nowDays).length,
      installmentOverdue: allInstallments.filter((i) => i.status === "overdue").length,
      totalCollected: allPayments.filter((p) => p.status === "verified").reduce((s, p) => s + p.amount, 0),
    };
  },
});

export const getCollectionCenter = query({
  args: {},
  handler: async (ctx) => {
    const [leads, allPayments, allPlans, allInstallments, allPDCs, allCommitments] = await Promise.all([
      ctx.db.query("leadMaster").collect(),
      ctx.db.query("leadPayments").collect(),
      ctx.db.query("payment_plans").collect(),
      ctx.db.query("payment_installments").collect(),
      ctx.db.query("payment_pdcs").collect(),
      ctx.db.query("payment_commitments").collect(),
    ]);

    const activeLeads = leads.filter((l) => l.status !== "archived");
    const now = Date.now();

    return activeLeads.map((lead) => {
      const leadPayments = allPayments.filter((p) => p.leadId === lead._id);
      const verifiedPayments = leadPayments.filter((p) => p.status === "verified");
      const totalPaid = verifiedPayments.reduce((s, p) => s + p.amount, 0);
      const grossFees = lead.standardAmount || lead.expectedRevenue || 0;
      const discountAmt = lead.discountAmount || 0;
      const waiverAmt = lead.waiverAmount || 0;
      const netPayable = lead.finalPayable || Math.max(0, grossFees - discountAmt - waiverAmt);
      const balanceDue = Math.max(0, netPayable - totalPaid);

      const plans = allPlans.filter((p) => p.leadId === lead._id);
      const installments = allInstallments.filter((i) => plans.some((p) => p._id === i.planId));
      const overdueInsts = installments.filter((i) => i.status === "overdue" || (i.status === "due" && i.dueDate < now));
      const activePDCs = allPDCs.filter((p) => p.leadId === lead._id && (p.status === "scheduled" || p.status === "deposited"));
      const activeCommitments = allCommitments.filter((c) => c.leadId === lead._id && c.status === "active");

      const health = balanceDue <= 0 ? "healthy"
        : overdueInsts.length > 0 || activePDCs.some((p) => p.chequeDate < now) ? "critical"
          : balanceDue <= netPayable * 0.3 ? "good" : "attention";

      return {
        leadId: lead._id, firstName: lead.firstName, lastName: lead.lastName,
        phone: lead.phone, stage: lead.stage,
        grossFees, discountAmount: discountAmt, waiverAmount: waiverAmt,
        netPayable, totalCollected: totalPaid, balanceDue,
        overdueInstallments: overdueInsts.length,
        activePDCs: activePDCs.length, pdcAmount: activePDCs.reduce((s, p) => s + p.amount, 0),
        activeCommitments: activeCommitments.length,
        daysOutstanding: netPayable > 0 ? Math.floor((now - lead.createdAt) / 86400000) : 0,
        collectionHealth: health,
      };
    });
  },
});

/** Move a payment commitment through its lifecycle. */
export const updateCommitmentStatus = mutation({
  args: {
    commitmentId: v.id("payment_commitments"),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("expired"),
      v.literal("cancelled"),
    ),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const commitment = await ctx.db.get(args.commitmentId);
    if (!commitment) throw new Error("Commitment not found");
    await ctx.db.patch(args.commitmentId, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return args.commitmentId;
  },
});

/** Run the daily collection automation: overdue installments + PDC reminders. */
export const dailyCollectionAutomation = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const dayMs = 86400000;
    const installments = await ctx.db.query("payment_installments").collect();
    let overdueInstallments = 0;
    let installmentsWarned = 0;
    const warnedLeads = new Set<string>();
    for (const inst of installments) {
      if ((inst.status === "due" || inst.status === "planned") && inst.dueDate < now - dayMs) {
        await ctx.db.patch(inst._id, { status: "overdue", updatedAt: now });
        overdueInstallments++;
        if (!warnedLeads.has(inst.leadId)) {
          warnedLeads.add(inst.leadId);
          const lead = await ctx.db.get(inst.leadId);
          const leadUserId = (lead as any)?.userId;
          if (leadUserId) {
            await ctx.db.insert("notifications", {
              userId: leadUserId,
              type: "collection",
              title: "Installment overdue",
              message: `Installment #${inst.installmentNumber} of ${inst.amount} is overdue.`,
              referenceId: inst._id,
              referenceType: "installment",
              isRead: false,
              createdAt: now,
            });
            installmentsWarned++;
          }
        }
      }
    }
    const pdcs = await ctx.db.query("payment_pdcs").collect();
    let pdcRemindersSent = 0;
    for (const p of pdcs) {
      if (p.status === "scheduled" && p.chequeDate && p.chequeDate > now && p.chequeDate - now <= 3 * dayMs) {
        await ctx.db.insert("notifications", {
          userId: p.createdBy,
          type: "payment",
          title: "PDC reminder",
          message: `${p.bank} #${p.chequeNumber} — ${p.amount} — Cheque Date: ${new Date(p.chequeDate).toLocaleDateString()}`,
          referenceId: p._id,
          referenceType: "pdc",
          isRead: false,
          createdAt: now,
        });
        pdcRemindersSent++;
      }
    }
    return { overdueInstallments, installmentsWarned, pdcRemindersSent };
  },
});
