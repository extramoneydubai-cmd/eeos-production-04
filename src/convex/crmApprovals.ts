import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { logActivity, createNotification, recalculatePayable } from "./crmHelpers";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ─── Helper: Find users by role (for auto-routing approval rules) ───
async function findUsersByRole(ctx: any, role: string) {
  const users = await ctx.db.query("users").withIndex("role", (q: any) => q.eq("role", role)).collect();
  return users;
}

export const requestDiscountWithApproval = mutation({
  args: { token: v.optional(v.string()),
    leadId: v.id("leadMaster"),
    category: v.union(v.literal("discount"), v.literal("waiver"), v.literal("scholarship"), v.literal("adjustment")),
    amount: v.number(),
    reason: v.string(),
    percentage: v.optional(v.number()),
    standardAmount: v.optional(v.number()),
    requestedBy: v.id("users"),
  },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmApprovals" }, async (ctx, args) => {
    const now = Date.now();
    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");
    const stdAmount = args.standardAmount || lead.standardAmount || lead.expectedRevenue || 0;
    const discountId = await ctx.db.insert("leadDiscounts", {
      leadId: args.leadId, category: args.category, reason: args.reason,
      amount: args.amount, percentage: args.percentage || undefined,
      standardAmount: stdAmount, status: "pending",
      requestedBy: args.requestedBy, createdAt: now, updatedAt: now,
    });
    let approverIds: string[] = [];
    const isWaiver = args.category === "waiver";
    if (isWaiver) {
      if (args.amount <= 10000) {
        const coos = await findUsersByRole(ctx, "admin");
        approverIds = coos.map((u: any) => u._id);
      } else {
        const ceos = await findUsersByRole(ctx, "super_admin");
        approverIds = ceos.map((u: any) => u._id);
      }
    } else {
      if (args.amount <= 5000) {
        const managers = await findUsersByRole(ctx, "manager");
        approverIds = managers.map((u: any) => u._id);
      } else if (args.amount <= 20000) {
        const admins = await findUsersByRole(ctx, "admin");
        approverIds = admins.map((u: any) => u._id);
      } else {
        const ceos = await findUsersByRole(ctx, "super_admin");
        approverIds = ceos.map((u: any) => u._id);
      }
    }
    if (approverIds.length === 0) {
      const superAdmins = await findUsersByRole(ctx, "super_admin");
      approverIds = superAdmins.map((u: any) => u._id);
    }
    const catLabel = args.category.charAt(0).toUpperCase() + args.category.slice(1);
    const approvalTitle = `${catLabel} Request — ${lead.firstName} ${lead.lastName}`;
    const typedApproverIds = approverIds.length > 0 ? approverIds.slice(0, 5) as any : [];
    const approvalId = await ctx.db.insert("leadApprovals", {
      leadId: args.leadId, title: approvalTitle, type: isWaiver ? "waiver" : "discount",
      amount: args.amount, reason: args.reason, approverIds: typedApproverIds,
      mode: "any_one", status: "pending", currentApproverIndex: 0,
      requestedBy: args.requestedBy, priority: args.amount > 20000 ? "high" : args.amount > 5000 ? "medium" : "low",
      discountId: discountId, createdAt: now, updatedAt: now,
    });
    const requestType = isWaiver ? "Waiver" : "Discount";
    await logActivity(ctx, args.leadId, "discount_requested",
      `${requestType} requested: ₹${args.amount}${args.percentage ? ` (${args.percentage}%)` : ""} — ${args.reason}`, args.requestedBy);
    await logActivity(ctx, args.leadId, "approval_requested",
      `${requestType} approval sent to ${approverIds.length} approver(s) — routed by amount rule`, args.requestedBy);
    for (const approverId of approverIds) {
      await createNotification(ctx, approverId, "approval",
        `${requestType} Approval Needed`,
        `${lead.firstName} ${lead.lastName}: ₹${args.amount} ${requestType.toLowerCase()} — ${args.reason}`, approvalId, "lead_approval");
    }
    await createNotification(ctx, args.requestedBy, "approval",
      `${requestType} Request Submitted`,
      `Your ${requestType.toLowerCase()} request for ₹${args.amount} has been submitted for approval`, approvalId, "lead_approval");
    return { discountId, approvalId };
  }),
});

export const getLeadApprovals = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => await ctx.db.query("leadApprovals").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect(),
});

export const getLeadApprovalDecisions = query({
  args: { approvalId: v.id("leadApprovals") },
  handler: async (ctx, args) => await ctx.db.query("leadApprovalDecisions").withIndex("approvalId", (q) => q.eq("approvalId", args.approvalId)).collect(),
});

export const getAllPendingApprovals = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const pending = await ctx.db.query("leadApprovals").filter((q) => q.eq(q.field("status"), "pending")).collect();
    return pending.filter((a) => a.approverIds.includes(args.userId));
  },
});

export const getAllCrmApprovals = query({
  args: {
    userId: v.id("users"),
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("returned"))),
    assignedToMe: v.optional(v.boolean()),
    requestedByMe: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let approvals = await ctx.db.query("leadApprovals").collect();
    if (args.status) approvals = approvals.filter((a) => a.status === args.status);
    if (args.assignedToMe) approvals = approvals.filter((a) => a.approverIds.includes(args.userId));
    if (args.requestedByMe) approvals = approvals.filter((a) => a.requestedBy === args.userId);
    return approvals.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return b.createdAt - a.createdAt;
    });
  },
});

export const createLeadApproval = mutation({
  args: { token: v.optional(v.string()), leadId: v.id("leadMaster"), title: v.string(), type: v.union(v.literal("discount"), v.literal("waiver"), v.literal("scholarship"), v.literal("admission"), v.literal("special_pricing"), v.literal("manual")), amount: v.number(), reason: v.string(), approverIds: v.array(v.id("users")), mode: v.union(v.literal("any_one"), v.literal("all_required"), v.literal("sequential"), v.literal("parallel")), fallbackApproverId: v.optional(v.id("users")), deadline: v.optional(v.number()), priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))), discountId: v.optional(v.id("leadDiscounts")), requestedBy: v.id("users") },
  handler: withScopeAndEvents({ operation: "create", module: "crm", entity: "crmApprovals" }, async (ctx, args) => {
    const now = Date.now();
    const approvalId = await ctx.db.insert("leadApprovals", { leadId: args.leadId, title: args.title, type: args.type, amount: args.amount, reason: args.reason, approverIds: args.approverIds, mode: args.mode, status: "pending", currentApproverIndex: 0, requestedBy: args.requestedBy, fallbackApproverId: args.fallbackApproverId, deadline: args.deadline, priority: args.priority || "medium", discountId: args.discountId, createdAt: now, updatedAt: now });
    const typeLabel = args.type.replace("_", " ").replace(/\b\w/g, (c: any) => c.toUpperCase());
    await logActivity(ctx, args.leadId, "approval_requested", `${typeLabel} approval requested: ₹${args.amount} — ${args.reason}`, args.requestedBy);
    for (const approverId of args.approverIds) {
      await createNotification(ctx, approverId, "approval", "Approval Requested", `${args.title}: ₹${args.amount} — ${args.reason}`, approvalId, "lead_approval");
    }
    return approvalId;
  }),
});

export const decideOnApproval = mutation({
  args: { token: v.optional(v.string()), approvalId: v.id("leadApprovals"), userId: v.id("users"), decision: v.union(v.literal("approved"), v.literal("rejected"), v.literal("returned")), comment: v.optional(v.string()) },
  handler: withScopeAndEvents({ operation: "update", module: "crm", entity: "crmApprovals" }, async (ctx, args) => {
    const approval = await ctx.db.get(args.approvalId);
    if (!approval || approval.status !== "pending") throw new Error("Approval not found or already decided");
    const now = Date.now();
    const user = await ctx.db.get(args.userId);
    await ctx.db.insert("leadApprovalDecisions", { approvalId: args.approvalId, userId: args.userId, status: args.decision, comment: args.comment, decidedAt: now, createdAt: now });
    if (args.decision === "rejected" || args.decision === "returned") {
      await ctx.db.patch(args.approvalId, { status: args.decision, updatedAt: now });
      await logActivity(ctx, approval.leadId, "approval_decided", `${args.decision} by ${user?.name || args.userId}${args.comment ? `: ${args.comment}` : ""}`, args.userId);
      await createNotification(ctx, approval.requestedBy, "approval", `Approval ${args.decision}`, `${approval.title} was ${args.decision}${args.comment ? `: ${args.comment}` : ""}`, approval.leadId, "lead");
      return;
    }
    let shouldFinalize = false;
    if (approval.mode === "any_one") { shouldFinalize = true; }
    else if (approval.mode === "sequential") {
      const nextIdx = approval.currentApproverIndex + 1;
      if (nextIdx >= approval.approverIds.length) { shouldFinalize = true; }
      else { await ctx.db.patch(args.approvalId, { currentApproverIndex: nextIdx, updatedAt: now }); }
    } else {
      const allDecisions = await ctx.db.query("leadApprovalDecisions").withIndex("approvalId", (q: any) => q.eq("approvalId", args.approvalId)).collect();
      const approvedCount = allDecisions.filter((d: any) => d.status === "approved").length;
      if (approvedCount >= approval.approverIds.length) { shouldFinalize = true; }
    }
    if (shouldFinalize) {
      await ctx.db.patch(args.approvalId, { status: "approved", updatedAt: now });
      await logActivity(ctx, approval.leadId, "approval_decided", `approved by ${user?.name || args.userId}`, args.userId);
      await createNotification(ctx, approval.requestedBy, "approval", "Approval Approved", `${approval.title} was approved`, approval.leadId, "lead");
      if (approval.discountId) {
        await ctx.db.patch(approval.discountId, { status: "approved", approvedBy: args.userId, approvedAt: now, updatedAt: now });
        const allApproved = (await ctx.db.query("leadDiscounts").withIndex("leadId", (q: any) => q.eq("leadId", approval.leadId)).collect()).filter((d: any) => d.status === "approved");
        const lead = await ctx.db.get(approval.leadId);
        const std = lead?.standardAmount || lead?.expectedRevenue || 0;
        const { discountAmount, waiverAmount, finalPayable } = recalculatePayable(std, allApproved);
        await ctx.db.patch(approval.leadId, { discountAmount, waiverAmount, finalPayable, updatedAt: now });
      }
    }
  }),
});
