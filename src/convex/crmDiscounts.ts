import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { logActivity, recalculatePayable, createNotification } from "./crmHelpers";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ============================
// DISCOUNT / WAIVER ENGINE
// ============================

export const getLeadDiscounts = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => await ctx.db.query("leadDiscounts").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect(),
});

export const createDiscount = mutation({
  args: { token: v.optional(v.string()), leadId: v.id("leadMaster"), category: v.union(v.literal("scholarship"), v.literal("discount"), v.literal("waiver"), v.literal("adjustment")), reason: v.string(), amount: v.number(), percentage: v.optional(v.number()), standardAmount: v.optional(v.number()), requestedBy: v.id("users") },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmDiscounts" }, async (ctx, args) => {
    const now = Date.now();
    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");
    const stdAmount = args.standardAmount || lead.standardAmount || lead.expectedRevenue || 0;
    const discountId = await ctx.db.insert("leadDiscounts", { leadId: args.leadId, category: args.category, reason: args.reason, amount: args.amount, percentage: args.percentage || undefined, standardAmount: stdAmount, status: "pending", requestedBy: args.requestedBy, createdAt: now, updatedAt: now });
    const catLabel = args.category.charAt(0).toUpperCase() + args.category.slice(1);
    await logActivity(ctx, args.leadId, "discount_requested", `${catLabel} requested: ₹${args.amount}${args.percentage ? ` (${args.percentage}%)` : ""} — ${args.reason}`, args.requestedBy);
    return discountId;
  }),
});

export const approveDiscount = mutation({
  args: { token: v.optional(v.string()), discountId: v.id("leadDiscounts"), approvedBy: v.id("users"), remarks: v.optional(v.string()) },
  handler: withScopeAndEvents({ operation: "approve", module: "crm", entity: "crmDiscounts" }, async (ctx, args) => {
    const discount = await ctx.db.get(args.discountId);
    if (!discount) throw new Error("Discount not found");
    const now = Date.now();
    await ctx.db.patch(args.discountId, { status: "approved", approvedBy: args.approvedBy, approvedAt: now, remarks: args.remarks, updatedAt: now });
    const allApproved = (await ctx.db.query("leadDiscounts").withIndex("leadId", (q: any) => q.eq("leadId", discount.leadId)).collect()).filter((d: any) => d.status === "approved");
    const std = discount.standardAmount || 0;
    const { discountAmount, waiverAmount, finalPayable } = recalculatePayable(std, allApproved);
    await ctx.db.patch(discount.leadId, { discountAmount, waiverAmount, finalPayable, standardAmount: std, updatedAt: now });
    await logActivity(ctx, discount.leadId, "discount_approved", `Discount approved: ₹${discount.amount}`, args.approvedBy);
    const lead = await ctx.db.get(discount.leadId);
    if (lead?.ownerId) { await createNotification(ctx, lead.ownerId, "approval", "Discount Approved", `₹${discount.amount} discount approved for ${lead.firstName} ${lead.lastName}`, discount.leadId, "lead"); }
  }),
});

export const rejectDiscount = mutation({
  args: { token: v.optional(v.string()), discountId: v.id("leadDiscounts"), rejectedBy: v.id("users"), remarks: v.optional(v.string()) },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmDiscounts" }, async (ctx, args) => {
    await ctx.db.patch(args.discountId, { status: "rejected", remarks: args.remarks, updatedAt: Date.now() });
    const discount = await ctx.db.get(args.discountId);
    if (discount) await logActivity(ctx, discount.leadId, "discount_rejected", `Discount rejected: ${args.remarks || "No reason"}`, args.rejectedBy);
  }),
});

