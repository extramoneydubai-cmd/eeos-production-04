import { v } from "convex/values";
import { query } from "./_generated/server";
import { LEAD_PIPELINE_STAGES } from "./crmHelpers";

// ============================
// CRM DASHBOARD
// ============================

export const getCrmDashboardData = query({
  args: {
    userId: v.id("users"),
    dateFilter: v.optional(v.union(v.literal("all"), v.literal("today"), v.literal("weekly"), v.literal("monthly"), v.literal("yearly"))),
    filterMode: v.optional(v.union(v.literal("createdDate"), v.literal("activityDate"))),
  },
  handler: async (ctx, args) => {
    const allLeads = await ctx.db.query("leadMaster").collect();
    const user = await ctx.db.get(args.userId);
    const isCEO = user?.role === "super_admin";
    const now = Date.now(), day = 86400000;
    let dateFrom = 0;
    const df = args.dateFilter || "all";
    if (df === "today") dateFrom = now - day;
    else if (df === "weekly") dateFrom = now - 7 * day;
    else if (df === "monthly") dateFrom = now - 30 * day;
    else if (df === "yearly") dateFrom = now - 365 * day;
    const filterMode = args.filterMode || "activityDate";
    let activityLeadIds: Set<string> | null = null;
    if (dateFrom > 0 && filterMode === "activityDate") {
      activityLeadIds = new Set<string>();
      const [allActivity, allLeadTasks, allStageChanges, allApprovals, allLeadPayments] = await Promise.all([
        ctx.db.query("leadActivity").collect(),
        ctx.db.query("leadTasks").collect(),
        ctx.db.query("leadStageHistory").collect(),
        ctx.db.query("leadApprovals").collect(),
        ctx.db.query("leadPayments").collect(),
      ]);
      for (const a of allActivity) if (a.createdAt >= dateFrom) activityLeadIds.add(a.leadId);
      for (const t of allLeadTasks) if (t.createdAt >= dateFrom || (t.updatedAt && t.updatedAt >= dateFrom)) activityLeadIds.add(t.leadId);
      for (const s of allStageChanges) if (s.createdAt >= dateFrom) activityLeadIds.add(s.leadId);
      for (const a of allApprovals) if (a.createdAt >= dateFrom || (a.updatedAt && a.updatedAt >= dateFrom)) activityLeadIds.add(a.leadId);
      for (const p of allLeadPayments) if (p.createdAt >= dateFrom || (p.updatedAt && p.updatedAt >= dateFrom)) activityLeadIds.add(p.leadId);
    }
    const dateFilteredLeads = dateFrom > 0
      ? allLeads.filter((l) => filterMode === "createdDate" ? l.createdAt >= dateFrom : l.createdAt >= dateFrom || l.updatedAt >= dateFrom || (l.nextActionDate != null && l.nextActionDate >= dateFrom) || (activityLeadIds != null && activityLeadIds.has(l._id)))
      : allLeads;
    const activeLeads = dateFilteredLeads.filter((l) => l.status === "active");
    const convertedLeads = dateFilteredLeads.filter((l) => l.status === "converted");
    const pipelineTotalBase = activeLeads.length + convertedLeads.length;
    const myLeads = activeLeads.filter((l) => l.ownerId === args.userId);
    const pipeline: Record<string, number> = {};
    for (const stage of LEAD_PIPELINE_STAGES) pipeline[stage] = activeLeads.filter((l) => l.stage === stage).length;
    const totalExpectedRevenue = activeLeads.reduce((s, l) => s + (l.standardAmount || l.expectedRevenue || 0), 0);
    const totalDiscountAmount = activeLeads.reduce((s, l) => s + (l.discountAmount || 0), 0);
    const totalWaiverAmount = activeLeads.reduce((s, l) => s + (l.waiverAmount || 0), 0);
    const myFollowups = myLeads.filter((l) => l.nextActionDate && l.nextActionDate <= now + 3 * day);
    const myOverdue = myLeads.filter((l) => l.nextActionDate && l.nextActionDate < now);
    const todayFollowups = activeLeads.filter((l) => l.nextActionDate && l.nextActionDate >= now && l.nextActionDate <= now + day && l.status === "active");
    const myTasksPending = await ctx.db.query("leadTasks").withIndex("ownerId", (q) => q.eq("ownerId", args.userId)).collect();
    const myPendingTasksCount = myTasksPending.filter((t) => t.status !== "completed" && t.status !== "cancelled").length;
    const recentActivity = (await ctx.db.query("leadActivity").collect()).sort((a, b) => b.createdAt - a.createdAt);
    const upcomingFollowups = myLeads.filter((l) => l.nextActionDate && l.nextActionDate > now && l.nextActionDate <= now + 7 * day);
    const allPendingApprovals = await ctx.db.query("leadApprovals").filter((q) => q.eq(q.field("status"), "pending")).collect();
    const myPendingApprovals = allPendingApprovals.filter((a) => a.approverIds.includes(args.userId));
    const totalApprovedDiscount = (await ctx.db.query("leadDiscounts").filter((q) => q.eq(q.field("status"), "approved")).collect()).reduce((s, d) => s + d.amount, 0);
    const allPayments = await ctx.db.query("leadPayments").collect();
    const pendingPayments = allPayments.filter((p) => p.status === "pending");
    const verifiedPayments = allPayments.filter((p) => p.status === "verified");
    let pendingPaymentsTotal = 0;
    for (const lead of dateFilteredLeads) {
      if (lead.status === "lost") continue;
      const grossFees = lead.standardAmount || lead.expectedRevenue || 0;
      if (grossFees <= 0) continue;
      const effectiveFees = Math.max(0, grossFees - (lead.discountAmount || 0) - (lead.waiverAmount || 0));
      const verifiedForLead = verifiedPayments.filter((p) => p.leadId === lead._id);
      const collected = verifiedForLead.reduce((s, p) => s + p.amount, 0);
      pendingPaymentsTotal += Math.max(0, effectiveFees - collected);
    }
    const leadVelocity = allLeads.filter((l) => l.createdAt >= now - 30 * day).length;
    const allApprovalDecisions = await ctx.db.query("leadApprovalDecisions").collect();
    const approvalTimes: number[] = [];
    for (const ad of allApprovalDecisions) {
      if (ad.decidedAt && ad.createdAt) approvalTimes.push(ad.decidedAt - ad.createdAt);
    }
    const avgApprovalTime = approvalTimes.length > 0 ? Math.round(approvalTimes.reduce((s, t) => s + t, 0) / approvalTimes.length / 3600000) : 0;
    const newLeads = dateFrom > 0 ? allLeads.filter((l) => l.createdAt >= dateFrom) : allLeads;
    let workingLeads: typeof allLeads;
    if (dateFrom === 0) {
      workingLeads = activeLeads;
    } else if (filterMode === "createdDate") {
      workingLeads = activeLeads;
    } else {
      workingLeads = activeLeads.filter((l) =>
        l.createdAt >= dateFrom || l.updatedAt >= dateFrom || (l.nextActionDate != null && l.nextActionDate >= dateFrom) || (activityLeadIds != null && activityLeadIds.has(l._id))
      );
    }
    const allLeadCourses = await ctx.db.query("leadCourses").collect();
    const enrolledLeadIds = new Set(allLeadCourses.map((lc) => lc.leadId));
    const paidLeadIds = new Set(verifiedPayments.map((p) => p.leadId));
    const filterPeriodPayments = dateFrom > 0 ? allPayments.filter((p) => p.createdAt >= dateFrom && p.status === "verified") : verifiedPayments;
    const collectionsTotal = filterPeriodPayments.reduce((s, p) => s + p.amount, 0);
    return {
      totalLeads: activeLeads.length, activeLeads: activeLeads.length, convertedLeads: convertedLeads.length,
      lostLeads: allLeads.filter((l) => l.status === "lost").length,
      conversionRate: pipelineTotalBase > 0 ? Math.round((convertedLeads.length / pipelineTotalBase) * 100) : 0,
      pipeline, totalExpectedRevenue, totalDiscountAmount, totalWaiverAmount,
      myLeads: myLeads.length, myFollowups: myFollowups.length, myOverdue: myOverdue.length,
      myPendingTasks: myPendingTasksCount, todayFollowupsCount: todayFollowups.length,
      upcomingFollowupsCount: upcomingFollowups.length, isCEO,
      recentActivity: recentActivity.slice(0, 10), pendingApprovalsCount: myPendingApprovals.length,
      totalApprovedDiscount, pendingPaymentsCount: pendingPayments.length, pendingPaymentsTotal,
      verifiedPaymentsCount: verifiedPayments.length,
      totalPaid: verifiedPayments.reduce((s: number, p: { amount: number }) => s + p.amount, 0),
      leadVelocity, avgApprovalTimeHours: avgApprovalTime, totalWaiverExposure: totalWaiverAmount,
      totalDiscountExposure: totalDiscountAmount, newLeadsCount: newLeads.length,
      workingLeadsCount: workingLeads.length, enrolledLeadsCount: enrolledLeadIds.size,
      paidLeadsCount: paidLeadIds.size, collectionsTotal, filterMode,
    };
  },
});
