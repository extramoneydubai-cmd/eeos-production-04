// ─── Helper: compute KPI trends ───
function calcTrend(current: number, previous: number): { direction: "up" | "down" | "flat"; pct: number; label: string } | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return { direction: "up", pct: 100, label: "\u25b2 New" };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return { direction: "up", pct, label: `\u25b2 +${pct}%` };
  if (pct < 0) return { direction: "down", pct: Math.abs(pct), label: `\u25bc ${Math.abs(pct)}%` };
  return { direction: "flat", pct: 0, label: "\u25c6 0%" };
}

// ─── Helper: compute all KPI metrics ───
function computeKpis(params: {
  activeLeads: any[]; convertedLeads: any[]; allPayments: any[]; allCallLogs: any[];
  allLeadTasks: any[]; allActivity: any[]; allInstallments: any[];
  todayStart: number; todayEnd: number; thisWeekStart: number; thisMonthStart: number; now: number; day: number;
  yesterdayStart: number; yesterdayEnd: number; lastWeekStart: number; lastWeekEnd: number;
  demoStages: string[];
}) {
  const { activeLeads, convertedLeads, allPayments, allCallLogs, allLeadTasks, allActivity, allInstallments,
    todayStart, todayEnd, thisWeekStart, thisMonthStart, now, day,
    yesterdayStart, yesterdayEnd, lastWeekStart, lastWeekEnd, demoStages } = params;

  const leadsToday = activeLeads.filter((l: any) => l.createdAt >= todayStart && l.createdAt <= todayEnd);
  const leadsThisWeek = activeLeads.filter((l: any) => l.createdAt >= thisWeekStart);
  const leadsThisMonth = activeLeads.filter((l: any) => l.createdAt >= thisMonthStart);

  const contactedLeadIds = new Set<string>();
  for (const cl of allCallLogs) contactedLeadIds.add(cl.leadId);
  for (const act of allActivity) {
    if (act.action === "call_made" || act.action === "lead_created") contactedLeadIds.add(act.leadId);
  }
  const contactedCount = activeLeads.filter((l: any) => contactedLeadIds.has(l._id)).length;
  const contactedPct = activeLeads.length > 0 ? Math.round((contactedCount / activeLeads.length) * 100) : 0;

  const admissionsToday = convertedLeads.filter((l: any) => l.createdAt >= todayStart && l.createdAt <= todayEnd);
  const admissionsMonth = convertedLeads.filter((l: any) => l.createdAt >= thisMonthStart);

  const verifiedPayments = allPayments.filter((p: any) => p.status === "verified");
  const pendingPayments = allPayments.filter((p: any) => p.status === "pending");
  const totalCollected = verifiedPayments.reduce((s: number, p: any) => s + p.amount, 0);
  const totalPendingUnverified = pendingPayments.reduce((s: number, p: any) => s + p.amount, 0);
  let totalOutstanding = 0;
  for (const lead of [...activeLeads, ...convertedLeads]) {
    const gross = lead.standardAmount || lead.expectedRevenue || 0;
    if (gross <= 0) continue;
    const netPayable = lead.finalPayable || Math.max(0, gross - (lead.discountAmount || 0) - (lead.waiverAmount || 0));
    const collected = verifiedPayments.filter((p: any) => p.leadId === lead._id).reduce((s: number, p: any) => s + p.amount, 0);
    totalOutstanding += Math.max(0, netPayable - collected);
  }

  const allLeadsWithFees = [...activeLeads, ...convertedLeads].filter((l: any) => (l.standardAmount || l.expectedRevenue || 0) > 0);
  const totalNetPayable = allLeadsWithFees.reduce((s: number, l: any) => {
    const gross = l.standardAmount || l.expectedRevenue || 0;
    return s + (l.finalPayable || Math.max(0, gross - (l.discountAmount || 0) - (l.waiverAmount || 0)));
  }, 0);
  const recoveryPct = totalNetPayable > 0 ? Math.round((totalCollected / totalNetPayable) * 100) : 0;
  const overdueInstallments = allInstallments.filter((i: any) => i.status === "overdue");
  const overdueInstAmount = overdueInstallments.reduce((s: number, i: any) => s + i.amount, 0);
  const pendingCollectionAmount = totalPendingUnverified + totalOutstanding;

  const callsToday = allCallLogs.filter((cl: any) => cl.createdAt >= todayStart && cl.createdAt <= todayEnd);
  const callsTotalDuration = callsToday.reduce((s: number, c: any) => s + (c.durationMinutes || 0) * 60 + (c.durationSeconds || 0), 0);
  const avgDuration = callsToday.length > 0 ? Math.round(callsTotalDuration / callsToday.length) : 0;
  const connectedCalls = callsToday.filter((c: any) => c.outcome === "connected");
  const connectedPct = callsToday.length > 0 ? Math.round((connectedCalls.length / callsToday.length) * 100) : 0;

  const followupsToday = activeLeads.filter((l: any) => l.nextActionDate && l.nextActionDate >= todayStart && l.nextActionDate <= todayEnd);
  const followupsOverdue = activeLeads.filter((l: any) => l.nextActionDate && l.nextActionDate < now);
  const followupsUpcoming = activeLeads.filter((l: any) => l.nextActionDate && l.nextActionDate > todayEnd && l.nextActionDate <= now + 7 * day);
  const completedTasksToday = allLeadTasks.filter((t: any) => t.status === "completed" && t.updatedAt && t.updatedAt >= todayStart);

  const demoLeads = activeLeads.filter((l: any) => demoStages.includes(l.stage));
  const demoScheduled = demoLeads.filter((l: any) => l.nextActionDate && l.nextActionDate >= now);
  const demoAttended = demoLeads.filter((l: any) => {
    const leadCalls = allCallLogs.filter((cl: any) => cl.leadId === l._id && cl.outcome === "connected");
    return leadCalls.length > 0;
  });
  const demoMissed = demoLeads.filter((l: any) => {
    const leadCalls = allCallLogs.filter((cl: any) => cl.leadId === l._id);
    const lastCall = leadCalls.sort((a: any, b: any) => b.createdAt - a.createdAt)[0];
    return lastCall && lastCall.outcome !== "connected";
  });
  const demoConverted = demoLeads.filter((l: any) => l.stage === "converted");

  // Trends (previous period comparisons)
  const prevLeadsToday = activeLeads.filter((l: any) => l.createdAt >= yesterdayStart && l.createdAt < yesterdayEnd).length;
  const prevCallsToday = allCallLogs.filter((cl: any) => cl.createdAt >= yesterdayStart && cl.createdAt < yesterdayEnd).length;
  const prevAdmissionsToday = convertedLeads.filter((l: any) => l.createdAt >= yesterdayStart && l.createdAt < yesterdayEnd).length;
  const prevFollowupsToday = activeLeads.filter((l: any) => l.nextActionDate && l.nextActionDate >= yesterdayStart && l.nextActionDate < yesterdayEnd).length;
  const prevWeekLeads = activeLeads.filter((l: any) => l.createdAt >= lastWeekStart && l.createdAt < lastWeekEnd).length;
  const prevWeekAdmissions = convertedLeads.filter((l: any) => l.createdAt >= lastWeekStart && l.createdAt < lastWeekEnd).length;
  const prevWeekCalls = allCallLogs.filter((cl: any) => cl.createdAt >= lastWeekStart && cl.createdAt < lastWeekEnd).length;
  const prevWeekCollected = allPayments.filter((p: any) => p.status === "verified" && p.createdAt >= lastWeekStart && p.createdAt < lastWeekEnd).reduce((s: number, p: any) => s + p.amount, 0);

  return {
    kpi: {
      leadsAssigned: {
        today: leadsToday.length, week: leadsThisWeek.length, month: leadsThisMonth.length,
        trend: calcTrend(leadsToday.length, prevLeadsToday),
        trendWeek: calcTrend(leadsThisWeek.length, prevWeekLeads),
      },
      leadsContacted: { count: contactedCount, percentage: contactedPct, total: activeLeads.length },
      admissionsClosed: {
        today: admissionsToday.length, month: admissionsMonth.length,
        total: convertedLeads.length,
        conversionRate: activeLeads.length + convertedLeads.length > 0
          ? Math.round((convertedLeads.length / (activeLeads.length + convertedLeads.length)) * 100) : 0,
        trend: calcTrend(admissionsToday.length, prevAdmissionsToday),
        trendWeek: calcTrend(admissionsMonth.length, prevWeekAdmissions),
      },
      revenueGenerated: {
        collected: totalCollected, pending: totalPendingUnverified, outstanding: totalOutstanding,
        trend: calcTrend(totalCollected, prevWeekCollected),
      },
      collections: { recoveryPct, pendingCollections: pendingCollectionAmount, overdue: overdueInstAmount, totalNetPayable },
      calls: {
        today: callsToday.length, avgDuration, connectedPct, total: allCallLogs.length,
        trend: calcTrend(callsToday.length, prevCallsToday),
        trendWeek: calcTrend(allCallLogs.filter((cl: any) => cl.createdAt >= thisWeekStart).length, prevWeekCalls),
      },
      followups: {
        today: followupsToday.length, overdue: followupsOverdue.length,
        upcoming: followupsUpcoming.length, completedToday: completedTasksToday.length,
        trend: calcTrend(followupsToday.length, prevFollowupsToday),
      },
      demoPipeline: {
        scheduled: demoScheduled.length, attended: demoAttended.length,
        missed: demoMissed.length, converted: demoConverted.length, total: demoLeads.length,
      },
    },
    verifiedPayments, pendingPayments, totalCollected, totalNetPayable, recoveryPct,
    totalOutstanding, totalPendingUnverified, overdueInstAmount, callsToday,
    followupsToday, followupsOverdue, followupsUpcoming, completedTasksToday,
    demoLeads, demoScheduled, demoAttended, demoMissed, demoConverted, demoStages,
    admissionsMonth, prevWeekAdmissions, prevCallsToday, prevWeekCollected,
  };
}

// ─── Helper: compute funnel ───
function computeFunnel(filteredLeads: any[], activeLeads: any[]) {
  const funnelStages = ["new", "attempted", "connected", "qualified", "counselling", "interested", "follow_up", "negotiation", "converted", "lost"];
  const pipeline: Record<string, number> = {};
  for (const stage of funnelStages) {
    pipeline[stage] = filteredLeads.filter((l: any) => l.stage === stage).length;
  }
  const totalInFunnel = activeLeads.length;
  const funnel = funnelStages.filter((s) => s !== "lost").map((stage) => {
    const count = pipeline[stage] || 0;
    const pct = totalInFunnel > 0 ? Math.round((count / totalInFunnel) * 100) : 0;
    return { stage, count, pct, label: stage.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) };
  });
  const funnelDropoff: any[] = [];
  for (let i = 0; i < funnel.length - 1; i++) {
    const dropoff = funnel[i].count - funnel[i + 1].count;
    const dropoffPct = funnel[i].count > 0 ? Math.round((dropoff / funnel[i].count) * 100) : 0;
    funnelDropoff.push({ from: funnel[i].label, to: funnel[i + 1].label, dropoff, dropoffPct });
  }
  return { funnel, funnelDropoff, totalInFunnel };
}

// ─── Helper: compute counselor performance ───
function computeCounselorPerformance(
  filteredLeads: any[], allCallLogs: any[], verifiedPayments: any[], allLeads: any[], demoStages: string[]
) {
  const counselorMap = new Map<string, any>();
  for (const lead of filteredLeads) {
    const ownerId = lead.ownerId;
    if (!ownerId) continue;
    if (!counselorMap.has(ownerId)) {
      counselorMap.set(ownerId, { userId: ownerId, assigned: 0, calls: 0, followups: 0, demo: 0, admissions: 0, revenue: 0, collectionAmt: 0 });
    }
    const entry = counselorMap.get(ownerId)!;
    entry.assigned++;
    if (lead.status === "converted") { entry.admissions++; entry.revenue += (lead.standardAmount || lead.expectedRevenue || 0); }
  }
  for (const cl of allCallLogs) { const e = counselorMap.get(cl.userId); if (e) e.calls++; }
  for (const lead of filteredLeads) {
    if (!lead.ownerId) continue;
    const e = counselorMap.get(lead.ownerId);
    if (e && lead.nextActionDate) e.followups++;
    if (e && demoStages.includes(lead.stage)) e.demo++;
  }
  for (const payment of verifiedPayments) {
    const lead = allLeads.find((l: any) => l._id === payment.leadId);
    if (!lead || !lead.ownerId) continue;
    const e = counselorMap.get(lead.ownerId);
    if (e) e.collectionAmt += payment.amount;
  }
  const perf = Array.from(counselorMap.values()).map((c: any) => {
    const conversionPct = c.assigned > 0 ? Math.round((c.admissions / c.assigned) * 100) : 0;
    const totalExpected = filteredLeads.filter((l: any) => l.ownerId === c.userId).reduce((s: number, l: any) => s + (l.standardAmount || l.expectedRevenue || 0), 0);
    const collectionPct = totalExpected > 0 ? Math.round((c.collectionAmt / totalExpected) * 100) : 0;
    const score = Math.round(conversionPct * 0.3 + collectionPct * 0.2 + Math.min(c.calls, 100) * 0.2 + Math.min(c.followups, 50) * 0.15 + Math.min(c.admissions, 20) * 0.15);
    return { ...c, conversionPct, collectionPct: c.collectionAmt > 0 ? collectionPct : 0, score };
  });
  const sortedCounselors = perf.sort((a: any, b: any) => b.score - a.score).map((c: any, i: number) => ({ ...c, rank: i + 1 }));
  const leaderboardDaily = [...sortedCounselors].sort((a: any, b: any) => b.calls - a.calls).slice(0, 10);
  const leaderboardWeekly = [...sortedCounselors].sort((a: any, b: any) => b.admissions - a.admissions).slice(0, 10);
  const leaderboardMonthly = [...sortedCounselors].sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 10);
  return {
    counselorPerformance: sortedCounselors.map((c: any) => ({
      userId: c.userId, assigned: c.assigned, calls: c.calls, followups: c.followups, demo: c.demo,
      admissions: c.admissions, revenue: c.revenue, collectionPct: c.collectionPct,
      conversionPct: c.conversionPct, score: c.score, rank: c.rank,
    })),
    leaderboard: {
      daily: leaderboardDaily.map((c: any) => ({ userId: c.userId, score: c.calls, metric: c.calls, label: "calls" })),
      weekly: leaderboardWeekly.map((c: any) => ({ userId: c.userId, score: c.admissions, metric: c.admissions, label: "admissions" })),
      monthly: leaderboardMonthly.map((c: any) => ({ userId: c.userId, score: c.revenue, metric: c.revenue, label: "revenue" })),
    },
  };
}

// ─── Helper: build activity timeline ───
function buildTimeline(allActivity: any[], verifiedPayments: any[], allStageHistory: any[],
  userMap: Map<string, any>, allLeads: any[], now: number, day: number) {
  const twoDaysAgo = now - 2 * day;
  const items: any[] = [];
  const recentActivity = allActivity.filter((a: any) => a.createdAt >= twoDaysAgo);
  for (const act of recentActivity) {
    const actUser = userMap.get(act.userId);
    const lead = allLeads.find((l: any) => l._id === act.leadId);
    items.push({ id: act._id, time: act.createdAt, userName: actUser?.name || "System", userId: act.userId,
      action: act.action, description: act.description, leadName: lead ? `${lead.firstName} ${lead.lastName}` : undefined, type: "activity" });
  }
  const recentPayments = verifiedPayments.filter((p: any) => p.createdAt >= twoDaysAgo);
  for (const p of recentPayments) {
    const lead = allLeads.find((l: any) => l._id === p.leadId);
    const pUser = userMap.get(p.verifiedBy || p.enteredBy);
    items.push({ id: p._id, time: p.verifiedAt || p.createdAt, userName: pUser?.name || "System",
      userId: p.verifiedBy || p.enteredBy, action: "Payment Recorded",
      description: `₹${p.amount.toLocaleString()} via ${p.mode}`, amount: p.amount,
      leadName: lead ? `${lead.firstName} ${lead.lastName}` : undefined, type: "payment" });
  }
  const recentConversions = allStageHistory.filter((sh: any) => sh.toStage === "converted" && sh.createdAt >= twoDaysAgo);
  for (const sh of recentConversions) {
    const lead = allLeads.find((l: any) => l._id === sh.leadId);
    const shUser = userMap.get(sh.changedBy);
    items.push({ id: sh._id, time: sh.createdAt, userName: shUser?.name || "System", userId: sh.changedBy,
      action: "Admission Closed", description: lead ? `${lead.firstName} ${lead.lastName}` : "Unknown lead",
      leadName: lead ? `${lead.firstName} ${lead.lastName}` : undefined, type: "conversion" });
  }
  return items.sort((a, b) => b.time - a.time).slice(0, 50);
}

// ─── Helper: compute needs attention leads ───
function computeNeedsAttention(activeLeads: any[], verifiedPayments: any[], allActivity: any[], now: number, day: number) {
  return activeLeads
    .map((lead: any) => {
      const gross = lead.standardAmount || lead.expectedRevenue || 0;
      const netPayable = lead.finalPayable || Math.max(0, gross - (lead.discountAmount || 0) - (lead.waiverAmount || 0));
      const collected = verifiedPayments.filter((p: any) => p.leadId === lead._id).reduce((s: number, p: any) => s + p.amount, 0);
      const balance = Math.max(0, netPayable - collected);
      const lastActivity = allActivity.filter((a: any) => a.leadId === lead._id).sort((a: any, b: any) => b.createdAt - a.createdAt)[0];
      const isOverdue = lead.nextActionDate != null && lead.nextActionDate < now;
      const priorityScore = (balance > 0 ? Math.min(balance / 1000, 50) : 0) + (isOverdue ? 25 : 0)
        + (!lastActivity || lastActivity.createdAt < now - 7 * day ? 15 : 0)
        + (lead.stage === "negotiation" || lead.stage === "follow_up" ? 10 : 0);
      return { leadId: lead._id, firstName: lead.firstName, lastName: lead.lastName, phone: lead.phone,
        stage: lead.stage, ownerId: lead.ownerId, outstanding: balance,
        lastContact: lastActivity?.createdAt || null, nextAction: lead.nextAction,
        nextActionDate: lead.nextActionDate, priorityScore, isOverdue };
    })
    .filter((l: any) => l.priorityScore > 0)
    .sort((a: any, b: any) => b.priorityScore - a.priorityScore)
    .slice(0, 10);
}

// ─── Helper: compute branch performance ───
function computeBranchPerformance(allBranches: any[], filteredLeads: any[], verifiedPayments: any[]) {
  const result: any[] = [];
  if (allBranches.length <= 1) return result;
  for (const branch of allBranches) {
    const branchLeads = filteredLeads.filter((l: any) => l.branchInterestId === branch._id);
    if (branchLeads.length === 0) continue;
    const branchConverted = branchLeads.filter((l: any) => l.status === "converted");
    const branchRevenue = branchConverted.reduce((s: number, l: any) => s + (l.standardAmount || l.expectedRevenue || 0), 0);
    const branchCollected = verifiedPayments.filter((p: any) => branchLeads.some((l: any) => l._id === p.leadId)).reduce((s: number, p: any) => s + p.amount, 0);
    result.push({
      branchId: branch._id, branchName: branch.name, admissions: branchConverted.length, revenue: branchRevenue,
      collections: branchCollected, conversion: branchLeads.length > 0 ? Math.round((branchConverted.length / branchLeads.length) * 100) : 0, totalLeads: branchLeads.length,
    });
  }
  return result.sort((a, b) => b.revenue - a.revenue);
}

export { calcTrend, computeKpis, computeFunnel, computeCounselorPerformance, buildTimeline, computeNeedsAttention, computeBranchPerformance };
