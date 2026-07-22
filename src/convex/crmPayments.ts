import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { logActivity, createNotification, checkAutoConversion } from "./crmHelpers";
import { insertVerificationRequest } from "./verification";

// ============================
// PAYMENT ENGINE
// ============================

export const getLeadPayments = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => (await ctx.db.query("leadPayments").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect()).sort((a, b) => b.createdAt - a.createdAt),
});

export const getAllLeadsPayments = query({
  args: {},
  handler: async (ctx) => {
    const [leads, allPayments] = await Promise.all([
      ctx.db.query("leadMaster").collect(),
      ctx.db.query("leadPayments").collect(),
    ]);
    const activeLeads = leads.filter((l) => l.status !== "archived");
    return activeLeads.map((lead) => {
      const verifiedPayments = allPayments.filter((p) => p.leadId === lead._id && p.status === "verified");
      const pendingPayments = allPayments.filter((p) => p.leadId === lead._id && p.status === "pending");
      const totalPaid = verifiedPayments.reduce((s, p) => s + p.amount, 0);
      const totalPending = pendingPayments.reduce((s, p) => s + p.amount, 0);
      const grossFees = lead.standardAmount || lead.expectedRevenue || 0;
      const discountAmt = lead.discountAmount || 0;
      const waiverAmt = lead.waiverAmount || 0;
      const netPayable = lead.finalPayable || Math.max(0, grossFees - discountAmt - waiverAmt);
      const balanceDue = Math.max(0, netPayable - totalPaid);
      return { leadId: lead._id, firstName: lead.firstName, lastName: lead.lastName, phone: lead.phone, stage: lead.stage, priority: lead.priority, ownerId: lead.ownerId, status: lead.status, grossFees, discountAmount: discountAmt, waiverAmount: waiverAmt, netPayable, totalPaid, totalPending, balanceDue };
    });
  },
});

export const addPayment = mutation({
  args: { leadId: v.id("leadMaster"), amount: v.number(), mode: v.union(v.literal("cash"), v.literal("upi"), v.literal("bank"), v.literal("card"), v.literal("cheque"), v.literal("online")), reference: v.optional(v.string()), receiptUrl: v.optional(v.string()), notes: v.optional(v.string()), enteredBy: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const paymentId = await ctx.db.insert("leadPayments", { leadId: args.leadId, amount: args.amount, mode: args.mode, reference: args.reference, receiptUrl: args.receiptUrl, enteredBy: args.enteredBy, status: "pending", notes: args.notes, createdAt: now, updatedAt: now });
    await logActivity(ctx, args.leadId, "payment_added", `Payment added: ₹${args.amount} via ${args.mode}`, args.enteredBy);
    try {
      const vreqId = await insertVerificationRequest(ctx, {
        entityType: "payment",
        entityId: paymentId,
        requesterId: args.enteredBy,
        metadata: JSON.stringify({ leadId: args.leadId, amount: args.amount, mode: args.mode, reference: args.reference }),
      });
      if (vreqId) {
        await ctx.db.patch(paymentId, { verificationRequestId: vreqId, updatedAt: now });
      }
    } catch (e) {}
    return paymentId;
  },
});

export const verifyPayment = mutation({
  args: { paymentId: v.id("leadPayments"), verifiedBy: v.id("users"), status: v.union(v.literal("verified"), v.literal("rejected")), rejectionReason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    if (!payment) throw new Error("Payment not found");
    const now = Date.now();
    await ctx.db.patch(args.paymentId, { status: args.status, verifiedBy: args.verifiedBy, verifiedAt: now, rejectionReason: args.rejectionReason, updatedAt: now });
    if (args.status === "verified") {
      await logActivity(ctx, payment.leadId, "payment_verified", `Payment verified: ₹${payment.amount} via ${payment.mode}`, args.verifiedBy);
      await createNotification(ctx, payment.enteredBy, "payment", "Payment Verified", `₹${payment.amount} payment verified for lead`, payment.leadId, "lead");
      await checkAutoConversion(ctx, payment.leadId);
    } else {
      await logActivity(ctx, payment.leadId, "payment_rejected", `Payment rejected: ${args.rejectionReason || "No reason"}`, args.verifiedBy);
    }
  },
});
