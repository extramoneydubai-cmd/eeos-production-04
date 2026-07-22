import { v } from "convex/values";
import { query } from "./_generated/server";
import { calcTrend, computeKpis, computeFunnel, computeCounselorPerformance, buildTimeline, computeNeedsAttention, computeBranchPerformance } from "./salesPerformance";

// ============================
// SALES PERFORMANCE DASHBOARD
// ============================

export const getSalesPerformanceDashboard = query({
  args: {
    userId: v.id("users"),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    branchId: v.optional(v.id("branches")),
    courseId: v.optional(v.id("courses")),
    counselorId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const day = 86400000;
    const todayStart = new Date(new Date(now).toDateString()).getTime();
    const todayEnd = todayStart + day;
    const thisWeekStart = todayStart - new Date().getDay() * day;
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const lastWeekStart = thisWeekStart - 7 * day;
    const lastWeekEnd = thisWeekStart;
    const yesterdayStart = todayStart - day;
    const yesterdayEnd = todayStart;
    const df = args.dateFrom || 0;
    const dt = args.dateTo || now;

    const [allLeads, allPayments, allCallLogs, allLeadTasks, allActivity,
      allUsers, allCourses, allLeadCourses, allBranches, allInstallments, allStageHistory] = await Promise.all([
      ctx.db.query("leadMaster").collect(),
      ctx.db.query("leadPayments").collect(),
      ctx.db.query("callLogs").collect(),
      ctx.db.query("leadTasks").collect(),
      ctx.db.query("leadActivity").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("courses").collect(),
      ctx.db.query("leadCourses").collect(),
      ctx.db.query("branches").collect(),
      ctx.db.query("payment_installments").collect(),
      ctx.db.query("leadStageHistory").collect(),
    ]);

    const userMap = new Map(allUsers.map((u: any) => [u._id, u]));
    const demoStages = ["follow_up", "negotiation", "counselling", "interested"];

    let filteredLeads = allLeads.filter((l: any) => l.status !== "archived");
    if (df) filteredLeads = filteredLeads.filter((l: any) => l.createdAt >= df);
    if (dt) filteredLeads = filteredLeads.filter((l: any) => l.createdAt <= dt);
    if (args.branchId) filteredLeads = filteredLeads.filter((l: any) => l.branchInterestId === args.branchId);
    if (args.courseId) {
      const courseLeadIds = new Set(allLeadCourses.filter((lc: any) => lc.courseId === args.courseId).map((lc: any) => lc.leadId));
      filteredLeads = filteredLeads.filter((l: any) => courseLeadIds.has(l._id));
    }
    if (args.counselorId) filteredLeads = filteredLeads.filter((l: any) => l.ownerId === args.counselorId);

    const activeLeads = filteredLeads.filter((l: any) => l.status === "active");
    const convertedLeads = filteredLeads.filter((l: any) => l.status === "converted");

    const kpiResult = computeKpis({
      activeLeads, convertedLeads, allPayments, allCallLogs,
      allLeadTasks, allActivity, allInstallments,
      todayStart, todayEnd, thisWeekStart, thisMonthStart, now, day,
      yesterdayStart, yesterdayEnd, lastWeekStart, lastWeekEnd, demoStages,
    });
    const { kpi, verifiedPayments, pendingPayments, totalCollected, totalNetPayable, recoveryPct,
      completedTasksToday, totalOutstanding, admissionsMonth, prevWeekAdmissions, prevCallsToday, prevWeekCollected } = kpiResult;

    const { funnel, funnelDropoff, totalInFunnel } = computeFunnel(filteredLeads, activeLeads);
    const { counselorPerformance, leaderboard } = computeCounselorPerformance(filteredLeads, allCallLogs, verifiedPayments, allLeads, demoStages);
    const timeline = buildTimeline(allActivity, verifiedPayments, allStageHistory, userMap, allLeads, now, day);
    const needsAttentionLeads = computeNeedsAttention(activeLeads, verifiedPayments, allActivity, now, day);
    const branchPerformance = computeBranchPerformance(allBranches, filteredLeads, verifiedPayments);

    const followupDueToday = activeLeads.filter((l: any) => l.nextActionDate && l.nextActionDate >= todayStart && l.nextActionDate <= todayEnd).length;
    const followupDueTomorrow = activeLeads.filter((l: any) => l.nextActionDate && l.nextActionDate >= todayEnd && l.nextActionDate <= todayEnd + day).length;
    const followupOverdueCount = activeLeads.filter((l: any) => l.nextActionDate && l.nextActionDate < now).length;
    const followupCompletedToday = completedTasksToday.length;

    const leadsWithOutstanding = [...activeLeads, ...convertedLeads]
      .map((lead: any) => {
        const gross = lead.standardAmount || lead.expectedRevenue || 0;
        if (gross <= 0) return null;
        const netPayable = lead.finalPayable || Math.max(0, gross - (lead.discountAmount || 0) - (lead.waiverAmount || 0));
        const collected = verifiedPayments.filter((p: any) => p.leadId === lead._id).reduce((s: number, p: any) => s + p.amount, 0);
        const balance = Math.max(0, netPayable - collected);
        return { leadId: lead._id, firstName: lead.firstName, lastName: lead.lastName, phone: lead.phone, netPayable, collected, balance, ownerId: lead.ownerId };
      })
      .filter((l: any): l is NonNullable<typeof l> => l !== null && l.balance > 0)
      .sort((a: any, b: any) => b.balance - a.balance)
      .slice(0, 10);

    return {
      filters: {
        branches: allBranches.map((b: any) => ({ _id: b._id, name: b.name })),
        users: allUsers.map((u: any) => ({ _id: u._id, name: u.name, image: u.image })),
        courses: allCourses.map((c: any) => ({ _id: c._id, courseName: c.courseName })),
      },
      kpi,
      funnel: { stages: funnel, dropoff: funnelDropoff, total: totalInFunnel },
      counselorPerformance,
      leaderboard,
      timeline,
      collectionSnapshot: {
        outstanding: totalOutstanding, collected: totalCollected, recoveryPct,
        pendingVerification: pendingPayments.length, totalNetPayable, topDefaulters: leadsWithOutstanding,
      },
      followupHealth: { dueToday: followupDueToday, dueTomorrow: followupDueTomorrow, overdue: followupOverdueCount, completedToday: followupCompletedToday },
      branchPerformance,
      multipleBranches: branchPerformance.length > 1,
      needsAttention: needsAttentionLeads,
      trends: {
        admissionsWeekOverWeek: calcTrend(admissionsMonth.length, prevWeekAdmissions),
        callsDayOverDay: calcTrend(kpi.calls.today, prevCallsToday),
        revenueTrend: calcTrend(totalCollected, prevWeekCollected),
      },
      meta: { todayStart, todayEnd, now },
    };
  },
});
