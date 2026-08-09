import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ─── WIDGET CRUD ───────────────────────────────────────────

export const createWidget = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    widgetType: v.string(),
    dataSource: v.optional(v.string()),
    defaultConfig: v.optional(v.string()),
    defaultSize: v.optional(v.string()),
    allowedRoles: v.optional(v.array(v.string())),
    isSystem: v.optional(v.boolean()),
    category: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
  },
  handler: withScopeAndEvents({ operation: "create", module: "platform", entity: "dashboardEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    return ctx.db.insert("dashboardWidgets", {
      name: args.name,
      code: args.code,
      description: args.description,
      widgetType: args.widgetType,
      dataSource: args.dataSource,
      defaultConfig: args.defaultConfig,
      defaultSize: args.defaultSize,
      allowedRoles: args.allowedRoles,
      isSystem: args.isSystem || false,
      isActive: true,
      displayOrder: args.displayOrder || 0,
      category: args.category,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const listWidgets = query({
  args: {
    category: v.optional(v.string()),
    widgetType: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("dashboardWidgets");
    if (args.category) {
      query = query.withIndex("category", (q: any) => q.eq("category", args.category));
    }
    if (args.isActive !== undefined) {
      query = query.filter((q: any) => q.eq(q.field("isActive"), args.isActive));
    }
    let results = await query.collect();
    if (args.widgetType) {
      results = results.filter((w: any) => w.widgetType === args.widgetType);
    }
    return results.sort((a: any, b: any) => a.displayOrder - b.displayOrder);
  },
});

// ─── LAYOUT CRUD ───────────────────────────────────────────

export const saveLayout = mutation({
  args: { token: v.optional(v.string()),
    name: v.string(),
    userId: v.optional(v.id("users")),
    role: v.optional(v.string()),
    isDefault: v.boolean(),
    widgets: v.string(),
    layoutConfig: v.optional(v.string()),
    filters: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "platform", entity: "dashboardEngine" }, async (ctx, args) => {
    const userId = ctx.__performerUserId;
    if (!userId) throw new Error("Not authenticated");

    // If setting as default, unset any existing defaults for this user/role
    if (args.isDefault) {
      const existingDefaults = await ctx.db.query("dashboardLayouts")
        .filter((q: any) => q.and(
          q.eq(q.field("isDefault"), true),
          args.userId ? q.eq(q.field("userId"), args.userId) : q.eq(q.field("role"), args.role),
        ))
        .collect();
      for (const layout of existingDefaults) {
        await ctx.db.patch(layout._id, { isDefault: false });
      }
    }

    return ctx.db.insert("dashboardLayouts", {
      name: args.name,
      userId: args.userId,
      role: args.role,
      isDefault: args.isDefault,
      widgets: args.widgets,
      layoutConfig: args.layoutConfig,
      filters: args.filters,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const getMyLayout = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Try user-specific layout first, then fall back to role-based default
    const userLayout = await ctx.db.query("dashboardLayouts")
      .withIndex("userId", (q: any) => q.eq("userId", args.userId))
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .order("desc")
      .first();

    if (userLayout) return userLayout;

    // Fall back to role-based default
    const user = await ctx.db.get(args.userId);
    if (user?.role) {
      return ctx.db.query("dashboardLayouts")
        .withIndex("role", (q: any) => q.eq("role", user.role))
        .filter((q: any) => q.and(
          q.eq(q.field("isActive"), true),
          q.eq(q.field("isDefault"), true),
        ))
        .first();
    }

    return null;
  },
});

export const listLayouts = query({
  args: { userId: v.optional(v.id("users")), role: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("dashboardLayouts");
    if (args.userId) {
      query = query.withIndex("userId", (q: any) => q.eq("userId", args.userId));
    }
    if (args.role) {
      query = query.filter((q: any) => q.eq(q.field("role"), args.role));
    }
    const results = await query.collect();
    return results.filter((l: any) => l.isActive);
  },
});

export const deleteLayout = mutation({
  args: { token: v.optional(v.string()), layoutId: v.id("dashboardLayouts") },
  handler: withScopeAndEvents({ operation: "delete", module: "platform", entity: "dashboardEngine" }, async (ctx, args) => {
    await ctx.db.delete(args.layoutId);
    return args.layoutId;
  }),
});

// ─── ENTERPRISE OVERVIEW ───────────────────────────────────

export const getEnterpriseOverview = query({
  args: {
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    dateRange: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const companies = await ctx.db.query("companies").collect();
    const branches = await ctx.db.query("branches").collect();
    const users = await ctx.db.query("users").collect();
    const students = await ctx.db.query("studentMaster").collect();
    const leads = await ctx.db.query("leadMaster").collect();
    const feeAccounts = await ctx.db.query("studentFeeAccounts").collect();
    const invoices = await ctx.db.query("feeInvoices").collect();
    const payments = await ctx.db.query("paymentTransactions").collect();

    let filteredStudents = students;
    let filteredLeads = leads;
    let filteredFeeAccounts = feeAccounts;
    let filteredInvoices = invoices;
    let filteredPayments = payments;

    // Apply company/branch filters
    if (args.companyId) {
      const companyBranches = branches.filter((b: any) => b.parentType === "company" && b.parentId === args.companyId);
      const branchIds = new Set(companyBranches.map((b: any) => b._id.toString()));
      filteredStudents = students.filter((s: any) => s.companyId === args.companyId || branchIds.has(s.branchId));
    }
    if (args.branchId) {
      filteredStudents = students.filter((s: any) => s.branchId === args.branchId);
      filteredLeads = leads.filter((l: any) => l.branchInterestId === args.branchId);
    }

    const totalRevenue = filteredPayments
      .filter((p: any) => p.status === "verified" || p.status === "completed")
      .reduce((s: number, p: any) => s + p.amount, 0);

    const totalOutstanding = filteredInvoices
      .reduce((s: number, i: any) => s + i.balanceDue, 0);

    return {
      companies: companies.length,
      branches: branches.length,
      activeUsers: users.filter((u: any) => !u.isDisabled).length,
      totalStudents: filteredStudents.length,
      activeStudents: filteredStudents.filter((s: any) => s.status === "active" || s.status === "admitted").length,
      totalLeads: filteredLeads.length,
      activeLeads: filteredLeads.filter((l: any) => l.status === "active").length,
      admissions: filteredStudents.filter((s: any) => s.status === "admitted" || s.status === "active").length,
      totalRevenue,
      outstandingFees: totalOutstanding,
      totalInvoiced: filteredInvoices.reduce((s: number, i: any) => s + i.totalAmount, 0),
      collectionRate: totalRevenue + totalOutstanding > 0
        ? Math.round((totalRevenue / (totalRevenue + totalOutstanding)) * 100) : 0,
    };
  },
});

// ─── PERIOD KPIs ───────────────────────────────────────────

/**
 * Period-filtered enterprise KPIs for the CEO dashboard matrix.
 * Computes revenue, collections, outstanding, new students/leads and
 * task activity within today / this month / this quarter.
 */
export const getPeriodKpis = query({
  args: {
    period: v.union(v.literal("today"), v.literal("month"), v.literal("quarter")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    let start: number;
    if (args.period === "today") {
      start = startOfDay.getTime();
    } else if (args.period === "month") {
      start = startOfMonth.getTime();
    } else {
      // quarter: start of current quarter
      const q = Math.floor(new Date().getMonth() / 3);
      start = new Date(new Date().getFullYear(), q * 3, 1).getTime();
    }

    const inPeriod = (ts?: number | null, fallback?: number) => {
      const t = ts ?? fallback ?? 0;
      return t >= start && t <= now;
    };

    const payments = await ctx.db.query("paymentTransactions").collect();
    const invoices = await ctx.db.query("feeInvoices").collect();
    const expenses = await ctx.db.query("expenseRecords").collect();
    const refunds = await ctx.db.query("refundRequests").collect();
    const leads = await ctx.db.query("leadMaster").collect();
    const students = await ctx.db.query("studentMaster").collect();
    const tasks = await ctx.db.query("tasks").collect();

    const periodPayments = payments.filter((p: any) =>
      inPeriod(p.paymentDate, (p as any)._creationTime)
    );
    const verifiedPayments = periodPayments.filter((p: any) =>
      p.status === "verified" || p.status === "completed"
    );
    const revenue = verifiedPayments.reduce((s: number, p: any) => s + p.amount, 0);

    const periodInvoices = invoices.filter((i: any) =>
      inPeriod(i.invoiceDate, (i as any)._creationTime)
    );
    const totalInvoiced = periodInvoices.reduce((s: number, i: any) => s + i.totalAmount, 0);
    const collected = periodInvoices.reduce((s: number, i: any) => s + i.paidAmount, 0);
    const outstanding = periodInvoices.reduce((s: number, i: any) => s + i.balanceDue, 0);
    const overdueAmount = periodInvoices
      .filter((i: any) => i.status === "overdue")
      .reduce((s: number, i: any) => s + i.balanceDue, 0);

    const periodExpenses = expenses.filter((e: any) =>
      inPeriod(e.expenseDate, (e as any)._creationTime)
    );
    const totalExpenses = periodExpenses
      .filter((e: any) => e.status === "approved" || e.status === "paid")
      .reduce((s: number, e: any) => s + e.amount, 0);

    const periodRefunds = refunds.filter((r: any) =>
      inPeriod((r as any).processedAt || (r as any).createdAt, (r as any)._creationTime)
    );
    const totalRefunded = periodRefunds
      .filter((r: any) => r.status === "completed")
      .reduce((s: number, r: any) => s + r.amount, 0);

    const newStudents = students.filter((s: any) =>
      inPeriod(s.enrollmentDate, (s as any)._creationTime)
    ).length;
    const newLeads = leads.filter((l: any) =>
      inPeriod(l.createdAt, (l as any)._creationTime)
    ).length;
    const newTasks = tasks.filter((t: any) => t.createdAt >= start && t.createdAt <= now).length;
    const openTasks = tasks.filter(
      (t: any) =>
        t.createdAt >= start &&
        t.createdAt <= now &&
        !["done", "completed", "cancelled", "archived"].includes(t.status)
    ).length;

    return {
      period: args.period,
      revenue,
      collected,
      totalInvoiced,
      outstanding,
      overdueAmount,
      collectionRate: totalInvoiced > 0 ? Math.round((collected / totalInvoiced) * 100) : 0,
      totalExpenses,
      totalRefunded,
      netRevenue: revenue - totalRefunded,
      newStudents,
      newLeads,
      newTasks,
      openTasks,
      invoiceCount: periodInvoices.length,
    };
  },
});

// ─── CRM WIDGET ────────────────────────────────────────────

export const getCrmWidget = query({
  args: {
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    dateRange: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let leads = await ctx.db.query("leadMaster").collect();

    if (args.branchId) {
      leads = leads.filter((l: any) => l.branchInterestId === args.branchId);
    }

    const newLeads = leads.filter((l: any) => l.stage === "new" || l.stage === "inquiry");
    const qualifiedLeads = leads.filter((l: any) => l.stage === "qualified");
    const trialLeads = leads.filter((l: any) => l.stage === "trial");
    const converted = leads.filter((l: any) => l.status === "converted");
    const activeLeads = leads.filter((l: any) => l.status === "active");

    const pipelineValue = leads
      .filter((l: any) => l.standardAmount)
      .reduce((s: number, l: any) => s + (l.standardAmount || 0), 0);

    const conversionRate = leads.length > 0
      ? Math.round((converted.length / leads.length) * 100)
      : 0;

    // Counselor performance
    const leadAssignments = await ctx.db.query("leadAssignments").collect();
    const counselorMap: Record<string, { assigned: number; converted: number }> = {};
    for (const a of leadAssignments) {
      if (!counselorMap[a.toUserId]) counselorMap[a.toUserId] = { assigned: 0, converted: 0 };
      counselorMap[a.toUserId].assigned++;
    }
    for (const l of converted) {
      if (l.ownerId && counselorMap[l.ownerId]) counselorMap[l.ownerId].converted++;
    }

    return {
      newLeads: newLeads.length,
      qualifiedLeads: qualifiedLeads.length,
      trialLeads: trialLeads.length,
      admissions: converted.length,
      conversionRate,
      pipelineValue,
      activeLeads: activeLeads.length,
      totalLeads: leads.length,
      counselorCount: Object.keys(counselorMap).length,
      stageDistribution: {
        new: newLeads.length,
        qualified: qualifiedLeads.length,
        trial: trialLeads.length,
        converted: converted.length,
        other: activeLeads.length - newLeads.length - qualifiedLeads.length - trialLeads.length,
      },
    };
  },
});

// ─── FINANCE WIDGET ────────────────────────────────────────

export const getFinanceWidget = query({
  args: {
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    dateRange: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const accounts = await ctx.db.query("studentFeeAccounts").collect();
    const invoices = await ctx.db.query("feeInvoices").collect();
    const payments = await ctx.db.query("paymentTransactions").collect();
    const refunds = await ctx.db.query("feeRefunds").collect();

    const totalRevenue = payments
      .filter((p: any) => p.status === "verified" || p.status === "completed")
      .reduce((s: number, p: any) => s + p.amount, 0);

    const totalOutstanding = accounts.reduce((s: number, a: any) => s + a.outstandingBalance, 0);
    const totalRefunded = refunds
      .filter((r: any) => r.status === "completed")
      .reduce((s: number, r: any) => s + r.refundAmount, 0);

    const paidInvoices = invoices.filter((i: any) => i.status === "paid").length;
    const overdueInvoices = invoices.filter((i: any) => i.status === "overdue").length;
    const pendingInvoices = invoices.filter((i: any) => i.status === "pending").length;

    return {
      totalRevenue,
      outstandingFees: totalOutstanding,
      totalRefunded,
      netRevenue: totalRevenue - totalRefunded,
      cashFlow: totalRevenue - totalRefunded,
      invoices: {
        total: invoices.length,
        paid: paidInvoices,
        overdue: overdueInvoices,
        pending: pendingInvoices,
        collectionRate: invoices.length > 0
          ? Math.round((paidInvoices / invoices.length) * 100)
          : 0,
      },
      averageOutstanding: accounts.length > 0
        ? Math.round(totalOutstanding / accounts.length)
        : 0,
    };
  },
});

// ─── ACADEMIC WIDGET ───────────────────────────────────────

export const getAcademicWidget = query({
  args: {
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    verticalId: v.optional(v.id("verticals")),
  },
  handler: async (ctx, args) => {
    const students = await ctx.db.query("studentMaster").collect();
    const courses = await ctx.db.query("courses").collect();
    const batches = await ctx.db.query("academicBatches").collect();
    const allocations = await ctx.db.query("studentAcademicAllocation").collect();

    let filteredStudents = students;
    if (args.branchId) {
      filteredStudents = students.filter((s: any) => s.branchId === args.branchId);
    }
    if (args.verticalId) {
      filteredStudents = students.filter((s: any) => s.verticalId === args.verticalId);
    }

    const activeCourses = courses.filter((c: any) => c.status === "active").length;
    const activeBatches = batches.filter((b: any) => b.isActive !== false).length;
    const currentAllocations = allocations.filter((a: any) => a.isCurrent).length;

    return {
      totalStudents: filteredStudents.length,
      activeStudents: filteredStudents.filter((s: any) => s.status === "active").length,
      admittedStudents: filteredStudents.filter((s: any) => s.status === "admitted").length,
      completedStudents: filteredStudents.filter((s: any) => s.status === "completed").length,
      alumniCount: filteredStudents.filter((s: any) => s.status === "alumni").length,
      activeCourses,
      activeBatches,
      currentAllocations,
      courseUtilization: courses.length > 0
        ? Math.round((currentAllocations / (activeCourses * activeBatches || 1)) * 100)
        : 0,
    };
  },
});

// ─── HR WIDGET ─────────────────────────────────────────────

export const getHrWidget = query({
  args: {
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();

    let filtered = users;
    if (args.companyId) {
      filtered = users.filter((u: any) => u.companyId === args.companyId);
    }
    if (args.branchId) {
      filtered = users.filter((u: any) => u.branchId === args.branchId);
    }

    const activeUsers = filtered.filter((u: any) => !u.isDisabled);
    const now = Date.now();
    const today = new Date();

    // Birthdays this month
    const birthdaysThisMonth = filtered.filter((u: any) => {
      // Users with joiningDate or some date field — simplified check
      return false; // Birthday data not directly stored in user schema
    });

    // Work anniversaries this month
    const anniversaryThisMonth = filtered.filter((u: any) => {
      if (!u.joiningDate) return false;
      const joinDate = new Date(u.joiningDate);
      return joinDate.getMonth() === today.getMonth();
    });

    const employeesByRole: Record<string, number> = {};
    for (const u of activeUsers) {
      const role = u.role || "unassigned";
      employeesByRole[role] = (employeesByRole[role] || 0) + 1;
    }

    return {
      totalEmployees: filtered.length,
      activeEmployees: activeUsers.length,
      disabledEmployees: filtered.filter((u: any) => u.isDisabled).length,
      employeesByRole,
      employmentTypes: {
        permanent: filtered.filter((u: any) => u.employmentType === "permanent").length,
        contract: filtered.filter((u: any) => u.employmentType === "contract").length,
        partTime: filtered.filter((u: any) => u.employmentType === "part_time").length,
        intern: filtered.filter((u: any) => u.employmentType === "intern").length,
        consultant: filtered.filter((u: any) => u.employmentType === "consultant").length,
        other: filtered.filter((u: any) => u.employmentType && !["permanent", "contract", "part_time", "intern", "consultant"].includes(u.employmentType)).length,
        unassigned: filtered.filter((u: any) => !u.employmentType).length,
      },
      anniversaryThisMonth: anniversaryThisMonth.length,
      birthdaysThisMonth: birthdaysThisMonth.length,
    };
  },
});

// ─── OPERATIONS WIDGET ─────────────────────────────────────

export const getOperationsWidget = query({
  args: {
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db.query("tasks").collect();
    const workflows = await ctx.db.query("workflowInstances").collect();
    const approvals = await ctx.db.query("approvalRequests").collect();
    const escalations = await ctx.db.query("leadEscalations").collect();
    const slaViolations = await ctx.db.query("slaViolations").collect();

    return {
      tasks: {
        total: tasks.length,
        pending: tasks.filter((t: any) => t.status !== "done" && !t.isArchived).length,
        overdue: tasks.filter((t: any) =>
          t.status !== "done" && t.dueDate && t.dueDate < Date.now()
        ).length,
        completed: tasks.filter((t: any) => t.status === "done").length,
      },
      workflows: {
        total: workflows.length,
        running: workflows.filter((w: any) => w.status === "running" || w.status === "active").length,
        failed: workflows.filter((w: any) => w.status === "failed").length,
        completed: workflows.filter((w: any) => w.status === "completed").length,
        bottleneckCount: workflows.filter((w: any) =>
          w.status === "running" && w.startedAt && (Date.now() - w.startedAt) > 24 * 60 * 60 * 1000
        ).length,
      },
      approvals: {
        total: approvals.length,
        pending: approvals.filter((a: any) => a.status === "pending").length,
        approved: approvals.filter((a: any) => a.status === "approved").length,
        rejected: approvals.filter((a: any) => a.status === "rejected").length,
      },
      sla: {
        totalViolations: slaViolations.length,
        openViolations: slaViolations.filter((v: any) => v.status === "open" || v.status === "pending").length,
        resolvedViolations: slaViolations.filter((v: any) => v.status === "resolved").length,
      },
      escalations: {
        total: escalations.length,
        open: escalations.filter((e: any) => e.status === "open" || e.status === "pending").length,
        resolved: escalations.filter((e: any) => e.status === "resolved").length,
        level1: escalations.filter((e: any) => e.level === 1).length,
        level2: escalations.filter((e: any) => e.level === 2).length,
        level3: escalations.filter((e: any) => e.level === 3).length,
      },
    };
  },
});

// ─── COMMUNICATION WIDGET ──────────────────────────────────

export const getCommunicationWidget = query({
  args: {},
  handler: async (ctx) => {
    const queue = await ctx.db.query("communicationQueue").collect();

    const channels = ["email", "whatsapp", "sms", "push", "in_app"] as const;
    const channelStats: Record<string, any> = {};

    for (const ch of channels) {
      const chMessages = queue.filter((m: any) => m.channel === ch);
      channelStats[ch] = {
        total: chMessages.length,
        sent: chMessages.filter((m: any) => m.status === "sent").length,
        delivered: chMessages.filter((m: any) => m.status === "delivered").length,
        failed: chMessages.filter((m: any) => m.status === "failed").length,
        queued: chMessages.filter((m: any) => m.status === "queued").length,
      };
    }

    const campaigns = await ctx.db.query("messageCampaigns").collect();
    const activeCampaigns = campaigns.filter((c: any) => c.status === "running" || c.status === "scheduled");

    return {
      totalSent: queue.filter((m: any) => m.status === "sent").length,
      totalDelivered: queue.filter((m: any) => m.status === "delivered").length,
      totalFailed: queue.filter((m: any) => m.status === "failed").length,
      totalQueued: queue.filter((m: any) => m.status === "queued").length,
      channelStats,
      campaigns: {
        total: campaigns.length,
        active: activeCampaigns.length,
        completed: campaigns.filter((c: any) => c.status === "completed").length,
        failed: campaigns.filter((c: any) => c.status === "failed").length,
      },
      deliveryRate: queue.filter((m: any) => ["sent", "delivered", "read"].includes(m.status)).length > 0
        ? Math.round((queue.filter((m: any) => ["delivered", "read"].includes(m.status)).length /
            queue.filter((m: any) => ["sent", "delivered", "read"].includes(m.status)).length) * 100)
        : 0,
    };
  },
});

// ─── CROSS-COMPANY / CROSS-BRANCH REPORTING ────────────────

export const getBranchComparison = query({
  args: {
    metricType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const branches = await ctx.db.query("branches").collect();
    const students = await ctx.db.query("studentMaster").collect();
    const leads = await ctx.db.query("leadMaster").collect();
    const accounts = await ctx.db.query("studentFeeAccounts").collect();
    const payments = await ctx.db.query("paymentTransactions").collect();

    const branchData: any[] = [];

    for (const branch of branches) {
      const branchStudents = students.filter((s: any) => s.branchId === branch._id.toString());
      const branchLeads = leads.filter((l: any) => l.branchInterestId === branch._id.toString());
      const branchAccounts = accounts.filter((a: any) =>
        branchStudents.some((s: any) => s._id.toString() === a.studentId)
      );
      const branchPayments = payments.filter((p: any) =>
        branchStudents.some((s: any) => s._id.toString() === p.studentId)
      );

      branchData.push({
        branchId: branch._id,
        branchName: branch.name,
        branchCode: branch.code,
        metrics: {
          studentCount: branchStudents.length,
          leadCount: branchLeads.length,
          activeLeads: branchLeads.filter((l: any) => l.status === "active").length,
          admissions: branchStudents.filter((s: any) =>
            ["admitted", "active", "completed"].includes(s.status)
          ).length,
          revenue: branchPayments
            .filter((p: any) => p.status === "verified" || p.status === "completed")
            .reduce((s: number, p: any) => s + p.amount, 0),
          outstanding: branchAccounts.reduce((s: number, a: any) => s + a.outstandingBalance, 0),
        },
      });
    }

    return {
      branches: branchData,
      totalBranches: branches.length,
      avgStudents: Math.round(
        branchData.reduce((s: number, b: any) => s + b.metrics.studentCount, 0) /
        (branches.length || 1)
      ),
      avgRevenue: Math.round(
        branchData.reduce((s: number, b: any) => s + b.metrics.revenue, 0) /
        (branches.length || 1)
      ),
    };
  },
});

export const getCompanyComparison = query({
  args: {},
  handler: async (ctx) => {
    const companies = await ctx.db.query("companies").collect();
    const branches = await ctx.db.query("branches").collect();
    const students = await ctx.db.query("studentMaster").collect();
    const leads = await ctx.db.query("leadMaster").collect();
    const payments = await ctx.db.query("paymentTransactions").collect();

    const companyData: any[] = [];

    for (const company of companies) {
      const companyBranches = branches.filter((b: any) =>
        b.parentType === "company" && b.parentId === company._id.toString()
      );
      const branchIds = new Set(companyBranches.map((b: any) => b._id.toString()));
      const companyStudents = students.filter((s: any) =>
        s.companyId === company._id.toString() || branchIds.has(s.branchId)
      );
      const companyLeads = leads.filter((l: any) =>
        companyBranches.some((b: any) => b._id.toString() === l.branchInterestId)
      );

      const studentIds = new Set(companyStudents.map((s: any) => s._id.toString()));
      const companyPayments = payments.filter((p: any) => studentIds.has(p.studentId));

      companyData.push({
        companyId: company._id,
        companyName: company.name,
        companyCode: company.code,
        branchCount: companyBranches.length,
        metrics: {
          studentCount: companyStudents.length,
          leadCount: companyLeads.length,
          revenue: companyPayments
            .filter((p: any) => p.status === "verified" || p.status === "completed")
            .reduce((s: number, p: any) => s + p.amount, 0),
          branchCount: companyBranches.length,
        },
      });
    }

    return companyData;
  },
});

// ─── EXAMINATION WIDGET ───────────────────────────────────

export const getExaminationWidget = query({
  args: {
    branchId: v.optional(v.id("branches")),
    academicSessionId: v.optional(v.id("academicSessions")),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db.query("examSessions").collect();
    const results = await ctx.db.query("examResults").collect();
    const marks = await ctx.db.query("examMarks").collect();

    let filteredSessions = sessions;
    if (args.branchId) filteredSessions = sessions.filter((s: any) => s.branchId === args.branchId);
    if (args.academicSessionId) filteredSessions = sessions.filter((s: any) => s.academicSessionId === args.academicSessionId);

    const sessionIds = new Set(filteredSessions.map((s: any) => s._id.toString()));
    const filteredResults = results.filter((r: any) => sessionIds.has(r.examSessionId));
    const filteredMarks = marks.filter((m: any) => sessionIds.has(m.examSessionId));

    const passed = filteredResults.filter((r: any) => r.passFail === "pass").length;
    const failed = filteredResults.filter((r: any) => r.passFail === "fail").length;

    return {
      totalSessions: filteredSessions.length,
      draftSessions: filteredSessions.filter((s: any) => s.status === "draft").length,
      scheduledSessions: filteredSessions.filter((s: any) => s.status === "scheduled").length,
      inProgressSessions: filteredSessions.filter((s: any) => s.status === "in_progress").length,
      completedSessions: filteredSessions.filter((s: any) => s.status === "completed" || s.status === "published").length,
      totalResults: filteredResults.length,
      passCount: passed,
      failCount: failed,
      passRate: filteredResults.length > 0 ? Math.round((passed / filteredResults.length) * 100) : 0,
      totalMarksEntered: filteredMarks.length,
      absentCount: filteredMarks.filter((m: any) => m.attendance === "absent").length,
    };
  },
});

// ─── LMS WIDGET ───────────────────────────────────────────

export const getLmsWidget = query({
  args: {
    instructorId: v.optional(v.id("users")),
    academicSubjectId: v.optional(v.id("academicSubjects")),
  },
  handler: async (ctx, args) => {
    const courses = await ctx.db.query("lmsCourses").collect();
    let filteredCourses = courses;
    if (args.instructorId) filteredCourses = courses.filter((c: any) => c.instructorId === args.instructorId);
    if (args.academicSubjectId) filteredCourses = courses.filter((c: any) => c.academicSubjectId === args.academicSubjectId);

    const courseIds = filteredCourses.map((c: any) => c._id.toString());
    const allLessons = await ctx.db.query("lmsLessons").collect();
    const lessons = allLessons.filter((l: any) => courseIds.includes(l.courseId));
    const allEnrollments = await ctx.db.query("lmsEnrollments").collect();
    const enrollments = allEnrollments.filter((e: any) => courseIds.includes(e.courseId));
    const allSubmissions = await ctx.db.query("lmsSubmissions").collect();

    return {
      totalCourses: filteredCourses.length,
      publishedCourses: filteredCourses.filter((c: any) => c.status === "published").length,
      draftCourses: filteredCourses.filter((c: any) => c.status === "draft").length,
      totalLessons: lessons.length,
      publishedLessons: lessons.filter((l: any) => l.isPublished).length,
      totalEnrollments: enrollments.length,
      completedEnrollments: enrollments.filter((e: any) => e.status === "completed").length,
      inProgressEnrollments: enrollments.filter((e: any) => e.status === "in_progress").length,
      completionRate: enrollments.length > 0
        ? Math.round((enrollments.filter((e: any) => e.status === "completed").length / enrollments.length) * 100) : 0,
      totalSubmissions: allSubmissions.length,
      pendingEvaluations: allSubmissions.filter((s: any) => s.status === "submitted" || s.status === "resubmitted").length,
    };
  },
});

// ─── INVENTORY WIDGET ─────────────────────────────────────

export const getInventoryWidget = query({
  args: {
    branchId: v.optional(v.id("branches")),
    warehouseId: v.optional(v.id("warehouses")),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db.query("inventoryItems").collect();
    let filteredItems = items;

    if (args.warehouseId) {
      filteredItems = items.filter((i: any) => i.warehouseId === args.warehouseId);
    }

    const movements = await ctx.db.query("stockMovements").collect();

    const totalValue = filteredItems.reduce((s: number, i: any) => s + (i.currentStock * i.unitPrice), 0);
    const lowStockItems = filteredItems.filter((i: any) => i.currentStock <= i.reorderLevel);
    const outOfStock = filteredItems.filter((i: any) => i.currentStock <= 0);

    const recentMovements = movements
      .sort((a: any, b: any) => b.createdAt - a.createdAt)
      .slice(0, 10);

    return {
      totalItems: filteredItems.length,
      activeItems: filteredItems.filter((i: any) => i.isActive).length,
      totalValue,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStock.length,
      stockHealth: filteredItems.length > 0
        ? Math.round(((filteredItems.length - lowStockItems.length - outOfStock.length) / filteredItems.length) * 100) : 0,
      recentMovements: recentMovements.length,
    };
  },
});

// ─── TASKS WIDGET ─────────────────────────────────────────

export const getTasksWidget = query({
  args: {
    userId: v.optional(v.id("users")),
    departmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    let tasks = await ctx.db.query("tasks").collect();

    if (args.userId) {
      tasks = tasks.filter((t: any) => t.ownerId === args.userId || t.assignedTo === args.userId);
    }
    if (args.departmentId) {
      tasks = tasks.filter((t: any) => t.departmentId === args.departmentId);
    }

    const now = Date.now();
    const overdue = tasks.filter((t: any) => t.status !== "done" && !t.isArchived && t.dueDate && t.dueDate < now);

    return {
      total: tasks.length,
      backlog: tasks.filter((t: any) => t.status === "backlog").length,
      todo: tasks.filter((t: any) => t.status === "todo").length,
      inProgress: tasks.filter((t: any) => t.status === "in_progress").length,
      review: tasks.filter((t: any) => t.status === "review").length,
      done: tasks.filter((t: any) => t.status === "done").length,
      overdue: overdue.length,
      overdueHigh: overdue.filter((t: any) => t.priority === "high" || t.priority === "critical").length,
      completionRate: tasks.length > 0
        ? Math.round((tasks.filter((t: any) => t.status === "done").length / tasks.length) * 100) : 0,
    };
  },
});

// ─── RECENT ACTIVITY WIDGET ───────────────────────────────

export const getRecentActivityWidget = query({
  args: {
    module: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const activities: any[] = [];

    // Lead activity
    const leadActivity = await ctx.db.query("leadActivity")
      .order("desc")
      .collect();
    for (const a of leadActivity.slice(0, limit)) {
      activities.push({
        type: "lead",
        action: (a as any).action,
        description: (a as any).description,
        timestamp: (a as any).createdAt,
        userId: (a as any).userId,
      });
    }

    // Call logs
    const callLogs = await ctx.db.query("callLogs")
      .order("desc")
      .collect();
    for (const c of callLogs.slice(0, limit)) {
      activities.push({
        type: "call",
        action: `Call - ${(c as any).callType}`,
        description: (c as any).notes || "No notes",
        timestamp: (c as any).callDate,
        userId: (c as any).userId,
      });
    }

    // Task comments
    const comments = await ctx.db.query("taskComments")
      .order("desc")
      .collect();
    for (const c of comments.slice(0, limit)) {
      activities.push({
        type: "comment",
        action: "Task Comment",
        description: (c as any).content?.substring(0, 100),
        timestamp: (c as any).createdAt,
        userId: (c as any).userId,
      });
    }

    // Payment activity
    const payments = await ctx.db.query("paymentTransactions")
      .order("desc")
      .collect();
    for (const p of payments.slice(0, limit)) {
      activities.push({
        type: "payment",
        action: `Payment ${(p as any).status}`,
        description: `${(p as any).amount} via ${(p as any).paymentMethod}`,
        timestamp: (p as any).paymentDate,
        userId: (p as any).createdBy,
      });
    }

    // Filter by module
    let filtered = activities;
    if (args.module) {
      filtered = activities.filter((a: any) => a.type === args.module);
    }

    // Sort by timestamp descending and limit
    filtered.sort((a: any, b: any) => b.timestamp - a.timestamp);

    return filtered.slice(0, limit);
  },
});

// ─── NOTIFICATIONS WIDGET ────────────────────────────────

export const getNotificationsWidget = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const notifications = await ctx.db.query("notifications")
      .withIndex("userId", (q: any) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    const unread = notifications.filter((n: any) => !n.isRead);

    return {
      notifications: notifications.slice(0, limit),
      unreadCount: unread.length,
      totalCount: notifications.length,
      byType: {
        task: unread.filter((n: any) => n.type === "task").length,
        approval: unread.filter((n: any) => n.type === "approval").length,
        message: unread.filter((n: any) => n.type === "message").length,
        payment: unread.filter((n: any) => n.type === "payment").length,
        announcement: unread.filter((n: any) => n.type === "announcement").length,
        mention: unread.filter((n: any) => n.type === "mention").length,
      },
    };
  },
});

// ─── LEADERBOARD WIDGET ───────────────────────────────────

export const getLeaderboardWidget = query({
  args: {
    metric: v.optional(v.union(v.literal("leads_converted"), v.literal("revenue"), v.literal("tasks_completed"), v.literal("calls_made"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const users = await ctx.db.query("users").collect();
    const leaderboard: any[] = [];

    for (const user of users) {
      if ((user as any).isDisabled) continue;
      const userId = user._id.toString();

      let score = 0;
      let label = "";

      switch (args.metric) {
        case "leads_converted": {
          const leads = await ctx.db.query("leadMaster")
            .filter((q: any) => q.eq(q.field("ownerId"), userId))
            .collect();
          score = leads.filter((l: any) => l.status === "converted").length;
          label = "Leads Converted";
          break;
        }
        case "revenue": {
          const leads = await ctx.db.query("leadMaster")
            .filter((q: any) => q.eq(q.field("ownerId"), userId))
            .collect();
          const leadIds = leads.map((l: any) => l._id.toString());
          const payments = await ctx.db.query("paymentTransactions").collect();
          score = payments
            .filter((p: any) => leadIds.includes(p.studentId))
            .reduce((s: number, p: any) => s + p.amount, 0);
          label = "Revenue (₹)";
          break;
        }
        case "tasks_completed": {
          const tasks = await ctx.db.query("tasks")
            .filter((q: any) => q.eq(q.field("ownerId"), userId))
            .collect();
          score = tasks.filter((t: any) => t.status === "done").length;
          label = "Tasks Completed";
          break;
        }
        case "calls_made":
        default: {
          const calls = await ctx.db.query("callLogs")
            .filter((q: any) => q.eq(q.field("userId"), userId))
            .collect();
          score = calls.length;
          label = "Calls Made";
          break;
        }
      }

      leaderboard.push({
        userId: user._id,
        name: (user as any).name || "Unknown",
        score,
        label,
      });
    }

    return leaderboard
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, limit);
  },
});

// ─── QUICK ACTIONS ────────────────────────────────────────

export const getQuickActions = query({
  args: { role: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const actions = [
      { id: "create-lead", label: "Create Lead", icon: "UserPlus", href: "/crm/leads", roles: ["super_admin", "admin", "manager", "staff"] },
      { id: "record-payment", label: "Record Payment", icon: "Banknote", href: "/collections", roles: ["super_admin", "admin", "manager", "staff"] },
      { id: "create-task", label: "Create Task", icon: "ListChecks", href: "/tasks", roles: ["super_admin", "admin", "manager", "staff"] },
      { id: "new-requisition", label: "New Requisition", icon: "ClipboardList", href: "/studio/procurement", roles: ["super_admin", "admin", "manager"] },
      { id: "create-course", label: "Create Course", icon: "BookOpen", href: "/studio/lms", roles: ["super_admin", "admin", "faculty"] },
      { id: "view-reports", label: "View Reports", icon: "BarChart3", href: "/analytics", roles: ["super_admin", "admin", "manager"] },
      { id: "new-user", label: "Create User", icon: "UserPlus", href: "/users", roles: ["super_admin", "admin"] },
      { id: "broadcast", label: "Broadcast Message", icon: "Megaphone", href: "/messenger", roles: ["super_admin", "admin"] },
      { id: "add-expense", label: "Add Expense", icon: "Receipt", href: "/studio/finance", roles: ["super_admin", "admin", "finance"] },
      { id: "schedule-exam", label: "Schedule Exam", icon: "FileCheck", href: "/examinations", roles: ["super_admin", "admin", "faculty"] },
    ];

    if (args.role) {
      return actions.filter((a: any) => a.roles.includes(args.role));
    }

    return actions;
  },
});

// ─── DRILL-DOWN ────────────────────────────────────────────

export const drillDownByBranch = query({
  args: { branchId: v.id("branches") },
  handler: async (ctx, args) => {
    const branch = await ctx.db.get(args.branchId);
    if (!branch) throw new Error("Branch not found");

    const students = await ctx.db.query("studentMaster")
      .filter((q: any) => q.eq(q.field("branchId"), args.branchId))
      .collect();

    const leads = await ctx.db.query("leadMaster")
      .filter((q: any) => q.eq(q.field("branchInterestId"), args.branchId))
      .collect();

    const user = await ctx.db.query("users")
      .filter((q: any) => q.eq(q.field("branchId"), args.branchId))
      .collect();

    return {
      branch: { id: branch._id, name: branch.name, code: branch.code },
      students: {
        total: students.length,
        active: students.filter((s: any) => s.status === "active").length,
        admitted: students.filter((s: any) => s.status === "admitted").length,
        completed: students.filter((s: any) => s.status === "completed").length,
      },
      leads: {
        total: leads.length,
        active: leads.filter((l: any) => l.status === "active").length,
        converted: leads.filter((l: any) => l.status === "converted").length,
        stages: {
          new: leads.filter((l: any) => l.stage === "new" || l.stage === "inquiry").length,
          qualified: leads.filter((l: any) => l.stage === "qualified").length,
          trial: leads.filter((l: any) => l.stage === "trial").length,
        },
      },
      employees: user.length,
      departments: await ctx.db.query("departments")
        .filter((q: any) => q.eq(q.field("branchId"), args.branchId))
        .collect()
        .then((deps: any[]) => deps.length),
    };
  },
});

export const drillDownByCompany = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.companyId);
    if (!company) throw new Error("Company not found");

    const branches = await ctx.db.query("branches")
      .filter((q: any) => q.and(
        q.eq(q.field("parentType"), "company"),
        q.eq(q.field("parentId"), args.companyId),
      ))
      .collect();

    const branchIds = branches.map((b: any) => b._id.toString());
    const students = await ctx.db.query("studentMaster").collect();
    const companyStudents = students.filter((s: any) =>
      s.companyId === args.companyId || branchIds.includes(s.branchId)
    );

    return {
      company: { id: company._id, name: company.name, code: company.code },
      branches: branches.map((b: any) => ({ id: b._id, name: b.name, code: b.code })),
      totalStudents: companyStudents.length,
      departments: await ctx.db.query("departments")
        .filter((q: any) => q.and(
          q.eq(q.field("parentType"), "company"),
          q.eq(q.field("parentId"), args.companyId),
        ))
        .collect(),
    };
  },
});
