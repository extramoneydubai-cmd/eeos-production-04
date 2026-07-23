import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── HELPERS ───────────────────────────────────────────────

function getPeriodDates(period: string, year?: number): { start: number; end: number } {
  const now = Date.now();
  const y = year || new Date().getFullYear();
  const monthMap: Record<string, number> = {
    "jan": 0, "feb": 1, "mar": 2, "apr": 3, "may": 4, "jun": 5,
    "jul": 6, "aug": 7, "sep": 8, "oct": 9, "nov": 10, "dec": 11,
  };

  switch (period) {
    case "daily": {
      const d = new Date();
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      return { start, end: now };
    }
    case "weekly": {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(d.getFullYear(), d.getMonth(), diff).getTime();
      return { start, end: now };
    }
    case "monthly": {
      const d = new Date();
      const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      return { start, end: now };
    }
    case "quarterly": {
      const d = new Date();
      const quarter = Math.floor(d.getMonth() / 3);
      const start = new Date(d.getFullYear(), quarter * 3, 1).getTime();
      return { start, end: now };
    }
    case "yearly": {
      const start = new Date(y, 0, 1).getTime();
      return { start, end: now };
    }
    default:
      return { start: now - 30 * 24 * 60 * 60 * 1000, end: now };
  }
}

async function storeReport(
  ctx: any,
  reportType: string,
  period: string,
  title: string,
  data: any,
  userId?: string
): Promise<string> {
  const id = await ctx.db.insert("analyticsSnapshots", {
    snapshotType: `report_${reportType}`,
    period,
    periodStart: Date.now(),
    periodEnd: Date.now(),
    data: JSON.stringify({
      title,
      generatedAt: new Date().toISOString(),
      ...data,
    }),
    createdBy: userId,
    createdAt: Date.now(),
  });
  return id;
}

// ─── DAILY EXECUTIVE SUMMARY ───────────────────────────────

export const generateDailySummary = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const leads = await ctx.db.query("leadMaster").collect();
    const students = await ctx.db.query("studentMaster").collect();
    const payments = await ctx.db.query("paymentTransactions").collect();
    const tasks = await ctx.db.query("tasks").collect();
    const users = await ctx.db.query("users").collect();
    const invoices = await ctx.db.query("feeInvoices").collect();

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay()).getTime();

    const todayLeads = leads.filter((l: any) => l.createdAt >= todayStart);
    const todayPayments = payments.filter((p: any) => p.paymentDate >= todayStart);
    const weekTasks = tasks.filter((t: any) => t.createdAt >= weekStart);
    const weekLeads = leads.filter((l: any) => l.createdAt >= weekStart);

    const report = {
      title: `Daily Executive Summary — ${today.toLocaleDateString()}`,
      generatedAt: today.toISOString(),
      period: "daily",
      highlights: {
        newLeadsToday: todayLeads.length,
        newLeadsThisWeek: weekLeads.length,
        totalActiveLeads: leads.filter((l: any) => l.status === "active").length,
        paymentsToday: todayPayments.length,
        revenueToday: todayPayments.reduce((s: number, p: any) => s + p.amount, 0),
        totalRevenue: payments
          .filter((p: any) => p.status === "verified" || p.status === "completed")
          .reduce((s: number, p: any) => s + p.amount, 0),
        activeStudents: students.filter((s: any) => s.status === "active").length,
        newStudentsToday: students.filter((s: any) => s.createdAt >= todayStart).length,
        pendingTasks: tasks.filter((t: any) => t.status !== "done" && !t.isArchived).length,
        completedTasksThisWeek: weekTasks.filter((t: any) => t.status === "done").length,
        overdueInvoices: invoices.filter((i: any) => i.status === "overdue").length,
        overdueAmount: invoices
          .filter((i: any) => i.status === "overdue")
          .reduce((s: number, i: any) => s + i.balanceDue, 0),
        activeUsers: users.filter((u: any) => !u.isDisabled).length,
      },
    };

    const id = await storeReport(ctx, "daily_summary", today.toISOString().substring(0, 10), report.title, report, userId);
    return { reportId: id, report };
  },
});

// ─── WEEKLY OPERATIONS REVIEW ──────────────────────────────

export const generateWeeklyReview = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const dates = getPeriodDates("weekly");
    const leads = await ctx.db.query("leadMaster").collect();
    const students = await ctx.db.query("studentMaster").collect();
    const payments = await ctx.db.query("paymentTransactions").collect();
    const tasks = await ctx.db.query("tasks").collect();
    const approvals = await ctx.db.query("approvalRequests").collect();
    const workflows = await ctx.db.query("workflowInstances").collect();
    const violations = await ctx.db.query("slaViolations").collect();
    const queue = await ctx.db.query("communicationQueue").collect();

    const weekLeads = leads.filter((l: any) => l.createdAt >= dates.start);
    const weekPayments = payments.filter((p: any) => p.paymentDate >= dates.start);
    const weekTasks = tasks.filter((t: any) => t.createdAt >= dates.start);

    const report = {
      title: `Weekly Operations Review — ${new Date().toLocaleDateString()}`,
      generatedAt: new Date().toISOString(),
      period: "weekly",
      periodStart: dates.start,
      periodEnd: dates.end,
      crm: {
        newLeads: weekLeads.length,
        qualifiedLead: weekLeads.filter((l: any) => l.stage === "qualified").length,
        trialLeads: weekLeads.filter((l: any) => l.stage === "trial").length,
        conversions: leads.filter((l: any) => l.status === "converted" && l.updatedAt >= dates.start).length,
        conversionRate: weekLeads.length > 0
          ? Math.round((leads.filter((l: any) => l.status === "converted" && l.updatedAt >= dates.start).length / weekLeads.length) * 100)
          : 0,
      },
      finance: {
        paymentsReceived: weekPayments.length,
        revenueCollected: weekPayments.reduce((s: number, p: any) => s + p.amount, 0),
        newInvoices: 0, // Would need invoice date filtering
        overdueCount: 0,
      },
      operations: {
        tasksCreated: weekTasks.length,
        tasksCompleted: weekTasks.filter((t: any) => t.status === "done").length,
        pendingApprovals: approvals.filter((a: any) => a.status === "pending").length,
        activeWorkflows: workflows.filter((w: any) => w.status === "running" || w.status === "active").length,
        slaViolations: violations.filter((v: any) => v.status !== "resolved").length,
      },
      communication: {
        messagesSent: queue.filter((m: any) => m.sentAt && m.sentAt >= dates.start).length,
        messagesDelivered: queue.filter((m: any) => m.deliveredAt && m.deliveredAt >= dates.start).length,
        failedMessages: queue.filter((m: any) => m.failedAt && m.failedAt >= dates.start).length,
      },
      highlights: [
        weekLeads.length > 0 ? `${weekLeads.length} new leads this week` : null,
        weekPayments.length > 0 ? `₹${weekPayments.reduce((s, p: any) => s + p.amount, 0)} revenue collected` : null,
        weekTasks.filter((t: any) => t.status === "done").length > 0
          ? `${weekTasks.filter((t: any) => t.status === "done").length} tasks completed` : null,
      ].filter(Boolean),
    };

    const id = await storeReport(ctx, "weekly_review", "weekly", report.title, report, userId);
    return { reportId: id, report };
  },
});

// ─── MONTHLY BUSINESS REVIEW ───────────────────────────────

export const generateMonthlyReview = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const dates = getPeriodDates("monthly");
    const leads = await ctx.db.query("leadMaster").collect();
    const students = await ctx.db.query("studentMaster").collect();
    const payments = await ctx.db.query("paymentTransactions").collect();
    const invoices = await ctx.db.query("feeInvoices").collect();
    const accounts = await ctx.db.query("studentFeeAccounts").collect();
    const tasks = await ctx.db.query("tasks").collect();
    const users = await ctx.db.query("users").collect();
    const assignments = await ctx.db.query("leadAssignments").collect();
    const queue = await ctx.db.query("communicationQueue").collect();
    const branches = await ctx.db.query("branches").collect();

    const monthLeads = leads.filter((l: any) => l.createdAt >= dates.start);
    const monthStudents = students.filter((s: any) => s.createdAt >= dates.start);
    const monthPayments = payments.filter((p: any) => p.paymentDate >= dates.start);

    const totalRevenue = payments
      .filter((p: any) => p.status === "verified" || p.status === "completed")
      .reduce((s: number, p: any) => s + p.amount, 0);

    const monthRevenue = monthPayments
      .filter((p: any) => p.status === "verified" || p.status === "completed")
      .reduce((s: number, p: any) => s + p.amount, 0);

    // Top performing branches
    const branchRevenue: Record<string, number> = {};
    for (const p of monthPayments) {
      if (branchRevenue[p.paymentMethod]) branchRevenue[p.paymentMethod] += p.amount;
      else branchRevenue[p.paymentMethod] = p.amount;
    }

    // Top performing counselors
    const counselorConversion: Record<string, { leads: number; conversions: number }> = {};
    for (const a of assignments) {
      if (!counselorConversion[a.toUserId]) counselorConversion[a.toUserId] = { leads: 0, conversions: 0 };
      counselorConversion[a.toUserId].leads++;
    }
    for (const l of leads.filter((l: any) => l.status === "converted")) {
      if (l.ownerId && counselorConversion[l.ownerId]) counselorConversion[l.ownerId].conversions++;
    }

    const report = {
      title: `Monthly Business Review — ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
      generatedAt: new Date().toISOString(),
      period: "monthly",
      periodStart: dates.start,
      periodEnd: dates.end,
      executiveSummary: {
        totalRevenue,
        monthRevenue,
        totalLeads: leads.length,
        newLeads: monthLeads.length,
        totalStudents: students.length,
        newStudents: monthStudents.length,
        totalEmployees: users.filter((u: any) => !u.isDisabled).length,
        branchCount: branches.length,
      },
      growth: {
        leadGrowth: leads.length > 0
          ? Math.round((monthLeads.length / leads.length) * 100) : 0,
        studentGrowth: students.length > 0
          ? Math.round((monthStudents.length / students.length) * 100) : 0,
        revenueGrowth: totalRevenue > 0
          ? Math.round((monthRevenue / totalRevenue) * 100) : 0,
      },
      crm: {
        totalLeads: leads.length,
        newLeads: monthLeads.length,
        qualifiedLeads: leads.filter((l: any) => l.stage === "qualified").length,
        trialLeads: leads.filter((l: any) => l.stage === "trial").length,
        converted: leads.filter((l: any) => l.status === "converted").length,
        conversionRate: leads.length > 0
          ? Math.round((leads.filter((l: any) => l.status === "converted").length / leads.length) * 100)
          : 0,
        pipelineValue: leads
          .filter((l: any) => l.standardAmount)
          .reduce((s: number, l: any) => s + (l.standardAmount || 0), 0),
      },
      finance: {
        totalRevenue,
        monthRevenue,
        outstanding: accounts.reduce((s: number, a: any) => s + a.outstandingBalance, 0),
        totalInvoiced: invoices.reduce((s: number, i: any) => s + i.totalAmount, 0),
        collectionRate: invoices.length > 0
          ? Math.round(
              (invoices.filter((i: any) => i.status === "paid").length / invoices.length) * 100
            ) : 0,
        overdueAmount: invoices
          .filter((i: any) => i.status === "overdue")
          .reduce((s: number, i: any) => s + i.balanceDue, 0),
      },
      academic: {
        totalStudents: students.length,
        activeStudents: students.filter((s: any) => s.status === "active").length,
        newAdmissions: monthStudents.filter((s: any) => s.status === "admitted").length,
        completedStudents: students.filter((s: any) => s.status === "completed").length,
        alumniCount: students.filter((s: any) => s.status === "alumni").length,
      },
      operations: {
        tasksCompleted: tasks.filter((t: any) => t.status === "done").length,
        tasksPending: tasks.filter((t: any) => t.status !== "done" && !t.isArchived).length,
        messagesSent: queue.length,
      },
      performance: {
        topCounselors: Object.entries(counselorConversion)
          .sort(([, a]: any, [, b]: any) => b.conversions - a.conversions)
          .slice(0, 5)
          .map(([userId, data]: [string, any]) => ({ userId, ...data })),
      },
    };

    const id = await storeReport(ctx, "monthly_review", new Date().toISOString().substring(0, 7), report.title, report, userId);
    return { reportId: id, report };
  },
});

// ─── QUARTERLY PERFORMANCE REVIEW ──────────────────────────

export const generateQuarterlyReview = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const dates = getPeriodDates("quarterly");
    const leads = await ctx.db.query("leadMaster").collect();
    const students = await ctx.db.query("studentMaster").collect();
    const payments = await ctx.db.query("paymentTransactions").collect();
    const invoices = await ctx.db.query("feeInvoices").collect();
    const accounts = await ctx.db.query("studentFeeAccounts").collect();
    const tasks = await ctx.db.query("tasks").collect();
    const workflows = await ctx.db.query("workflowInstances").collect();
    const companies = await ctx.db.query("companies").collect();
    const branchMetrics = await ctx.db.query("branchMetrics").collect();

    const quarterLeads = leads.filter((l: any) => l.createdAt >= dates.start);
    const quarterStudents = students.filter((s: any) => s.createdAt >= dates.start);
    const quarterRevenue = payments
      .filter((p: any) => (p.paymentDate >= dates.start) && (p.status === "verified" || p.status === "completed"))
      .reduce((s: number, p: any) => s + p.amount, 0);

    // Calculate KPI achievements
    const kpiSnapshot = await ctx.db.query("analyticsSnapshots")
      .filter((q: any) => q.eq(q.field("snapshotType"), "kpi_conversion_rate"))
      .order("desc")
      .first();

    const report = {
      title: `Quarterly Performance Review — Q${Math.floor(new Date().getMonth() / 3) + 1} ${new Date().getFullYear()}`,
      generatedAt: new Date().toISOString(),
      period: "quarterly",
      periodStart: dates.start,
      periodEnd: dates.end,
      executiveSummary: {
        companies: companies.length,
        totalStudents: students.length,
        newStudents: quarterStudents.length,
        studentGrowth: students.length > 0 ? Math.round((quarterStudents.length / students.length) * 100) : 0,
        totalLeads: leads.length,
        newLeads: quarterLeads.length,
        leadGrowth: leads.length > 0 ? Math.round((quarterLeads.length / leads.length) * 100) : 0,
        totalRevenue: payments
          .filter((p: any) => p.status === "verified" || p.status === "completed")
          .reduce((s: number, p: any) => s + p.amount, 0),
        quarterRevenue,
        revenueGrowth: payments.length > 0 ? Math.round((quarterRevenue / payments.reduce((s: number, p: any) => s + p.amount, 0)) * 100) : 0,
      },
      kpiSummary: {
        conversionRate: leads.length > 0
          ? `${Math.round((leads.filter((l: any) => l.status === "converted").length / leads.length) * 100)}%`
          : "N/A",
        collectionRate: invoices.length > 0
          ? `${Math.round((invoices.filter((i: any) => i.status === "paid").length / invoices.length) * 100)}%`
          : "N/A",
        studentRetention: students.filter((s: any) => s.status === "active" || s.status === "completed").length > 0
          ? `${Math.round((students.filter((s: any) => ["active", "completed"].includes(s.status)).length / students.length) * 100)}%`
          : "N/A",
        averageOutstanding: accounts.length > 0
          ? Math.round(accounts.reduce((s: number, a: any) => s + a.outstandingBalance, 0) / accounts.length)
          : 0,
      },
      departmental: {
        completedTasks: tasks.filter((t: any) => t.status === "done").length,
        activeWorkflows: workflows.filter((w: any) => w.status === "running").length,
        workflowCompletion: workflows.length > 0
          ? Math.round((workflows.filter((w: any) => w.status === "completed").length / workflows.length) * 100)
          : 0,
      },
    };

    const id = await storeReport(ctx, "quarterly_review", `Q${Math.floor(new Date().getMonth() / 3) + 1}_${new Date().getFullYear()}`, report.title, report, userId);
    return { reportId: id, report };
  },
});

// ─── ANNUAL GROWTH REPORT ──────────────────────────────────

export const generateAnnualReport = mutation({
  args: {
    year: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const year = args.year || new Date().getFullYear();
    const dates = getPeriodDates("yearly", year);

    const leads = await ctx.db.query("leadMaster").collect();
    const students = await ctx.db.query("studentMaster").collect();
    const payments = await ctx.db.query("paymentTransactions").collect();
    const invoices = await ctx.db.query("feeInvoices").collect();
    const accounts = await ctx.db.query("studentFeeAccounts").collect();
    const users = await ctx.db.query("users").collect();
    const branches = await ctx.db.query("branches").collect();
    const companies = await ctx.db.query("companies").collect();
    const tasks = await ctx.db.query("tasks").collect();

    const yearLeads = leads.filter((l: any) => l.createdAt >= dates.start);
    const yearStudents = students.filter((s: any) => s.createdAt >= dates.start);
    const yearRevenue = payments
      .filter((p: any) => (p.paymentDate >= dates.start) && (p.status === "verified" || p.status === "completed"))
      .reduce((s: number, p: any) => s + p.amount, 0);

    // Monthly breakdown for year
    const monthlyRevenue: number[] = new Array(12).fill(0);
    const monthlyLeads: number[] = new Array(12).fill(0);
    const monthlyAdmissions: number[] = new Array(12).fill(0);

    for (const p of payments) {
      if (p.status === "verified" || p.status === "completed") {
        const d = new Date(p.paymentDate);
        if (d.getFullYear() === year) {
          monthlyRevenue[d.getMonth()] += p.amount;
        }
      }
    }
    for (const l of leads) {
      const d = new Date(l.createdAt);
      if (d.getFullYear() === year) monthlyLeads[d.getMonth()]++;
    }
    for (const s of students) {
      const d = new Date(s.createdAt);
      if (d.getFullYear() === year && s.status === "admitted") monthlyAdmissions[d.getMonth()]++;
    }

    const report = {
      title: `Annual Growth Report — ${year}`,
      generatedAt: new Date().toISOString(),
      period: "yearly",
      year,
      organization: {
        companies: companies.length,
        branches: branches.length,
        employees: users.filter((u: any) => !u.isDisabled).length,
      },
      growth: {
        totalLeads: yearLeads.length,
        totalStudents: yearStudents.length,
        totalRevenue: yearRevenue,
        studentGrowth: students.length > 0 ? Math.round((yearStudents.length / students.length) * 100) : 0,
        revenueGrowth: payments.length > 0 ? Math.round((yearRevenue / payments.reduce((s: number, p: any) => s + p.amount, 0)) * 100) : 0,
      },
      financialSummary: {
        totalRevenue: yearRevenue,
        outstanding: accounts.reduce((s: number, a: any) => s + a.outstandingBalance, 0),
        totalInvoiced: invoices.reduce((s: number, i: any) => s + i.totalAmount, 0),
        collectionRate: invoices.length > 0
          ? Math.round((invoices.filter((i: any) => i.status === "paid").length / invoices.length) * 100)
          : 0,
        monthlyRevenue,
        averageMonthlyRevenue: Math.round(monthlyRevenue.reduce((s, v) => s + v, 0) / 12),
        bestMonth: monthlyRevenue.indexOf(Math.max(...monthlyRevenue)) + 1,
      },
      monthlyTrends: {
        leads: monthlyLeads,
        admissions: monthlyAdmissions,
        revenue: monthlyRevenue,
      },
      academicSummary: {
        totalStudents: students.length,
        activeStudents: students.filter((s: any) => s.status === "active").length,
        newAdmissions: yearStudents.filter((s: any) => s.status === "admitted").length,
        completedPrograms: students.filter((s: any) => s.status === "completed").length,
        alumniCount: students.filter((s: any) => s.status === "alumni").length,
      },
      operationsSummary: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t: any) => t.status === "done").length,
        tasksCreatedThisYear: tasks.filter((t: any) => t.createdAt >= dates.start).length,
        tasksCompletedThisYear: tasks.filter((t: any) => t.status === "done" && t.updatedAt >= dates.start).length,
      },
    };

    const id = await storeReport(ctx, "annual_report", String(year), report.title, report, userId);
    return { reportId: id, report };
  },
});

// ─── REPORT RETRIEVAL ──────────────────────────────────────

export const getReport = query({
  args: { reportId: v.id("analyticsSnapshots") },
  handler: async (ctx, args) => {
    const snapshot = await ctx.db.get(args.reportId);
    if (!snapshot) throw new Error("Report not found");
    return {
      id: snapshot._id,
      type: snapshot.snapshotType,
      period: snapshot.period,
      generatedAt: snapshot.createdAt,
      data: JSON.parse(snapshot.data),
    };
  },
});

export const listReports = query({
  args: {
    reportType: v.optional(v.string()),
    period: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("analyticsSnapshots");
    if (args.reportType) {
      query = query.filter((q: any) => q.eq(q.field("snapshotType"), `report_${args.reportType}`));
    }
    let results = await query.order("desc").collect();
    if (args.period) {
      results = results.filter((r: any) => r.period === args.period);
    }
    if (args.limit) {
      results = results.slice(0, args.limit);
    }
    return results.map((r: any) => ({
      id: r._id,
      type: r.snapshotType,
      period: r.period,
      generatedAt: r.createdAt,
      title: JSON.parse(r.data).title,
    }));
  },
});

// ─── GENERATE ALL EXECUTIVE REPORTS ────────────────────────

export const generateAllExecutiveReports = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Generate all report types in sequence
    const daily = await ctx.scheduler.runAfter(0, "executiveReports:generateDailySummary", {});
    const weekly = await ctx.scheduler.runAfter(100, "executiveReports:generateWeeklyReview", {});
    const monthly = await ctx.scheduler.runAfter(200, "executiveReports:generateMonthlyReview", {});
    const quarterly = await ctx.scheduler.runAfter(300, "executiveReports:generateQuarterlyReview", {});
    const annual = await ctx.scheduler.runAfter(400, "executiveReports:generateAnnualReport", { year: new Date().getFullYear() });

    return {
      scheduled: ["daily", "weekly", "monthly", "quarterly", "annual"],
      dailyId: daily,
      weeklyId: weekly,
      monthlyId: monthly,
      quarterlyId: quarterly,
      annualId: annual,
    };
  },
});
