import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── KPI DEFINITIONS CRUD ─────────────────────────

export const createKpiDefinition = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    module: v.union(
      v.literal("crm"), v.literal("admissions"), v.literal("students"),
      v.literal("employees"), v.literal("academics"), v.literal("finance"),
      v.literal("examinations"), v.literal("lms"), v.literal("inventory"),
      v.literal("hr"), v.literal("support"), v.literal("procurement"),
    ),
    dataSource: v.string(),
    aggregation: v.union(
      v.literal("count"), v.literal("sum"), v.literal("avg"),
      v.literal("min"), v.literal("max"), v.literal("rate"),
      v.literal("percentage"), v.literal("ratio"),
    ),
    targetValue: v.optional(v.number()),
    unit: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    displayOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const { aggregation, targetValue, ...rest } = args;
    return ctx.db.insert("kpiDefinitions", {
      ...rest,
      category: rest.module,
      frequency: "daily",
      formula: aggregation,
      target: targetValue,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any);
  },
});

export const listKpiDefinitions = query({
  args: {
    module: v.optional(v.union(
      v.literal("crm"), v.literal("admissions"), v.literal("students"),
      v.literal("employees"), v.literal("academics"), v.literal("finance"),
      v.literal("examinations"), v.literal("lms"), v.literal("inventory"),
      v.literal("hr"), v.literal("support"), v.literal("procurement"),
    )),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("kpiDefinitions");
    if (args.module) query = query.filter((q: any) => q.eq(q.field("module"), args.module));
    if (args.isActive !== undefined) query = query.filter((q: any) => q.eq(q.field("isActive"), args.isActive));
    return query.collect();
  },
});

// ─── KPI VALUE CALCULATION ──────────────────────

export const calculateKpi = mutation({
  args: {
    kpiId: v.id("kpiDefinitions"),
    period: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const kpi = await ctx.db.get(args.kpiId);
    if (!kpi) throw new Error("KPI not found");

    const value = await computeKpiValue(ctx, (kpi as any).dataSource, (kpi as any).aggregation, args.periodStart, args.periodEnd);

    const snapshotId = await ctx.db.insert("kpiSnapshots", {
      kpiId: args.kpiId,
      value,
      period: args.period,
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      createdAt: Date.now(),
    });

    return { snapshotId, value };
  },
});

async function computeKpiValue(ctx: any, dataSource: string, aggregation: string, periodStart: number, periodEnd: number): Promise<number> {
  let data: any[] = [];

  switch (dataSource) {
    case "crm.total_leads": {
      data = await ctx.db.query("leadMaster").collect();
      data = data.filter((d: any) => d.createdAt >= periodStart && d.createdAt <= periodEnd);
      break;
    }
    case "crm.converted_leads": {
      data = await ctx.db.query("leadMaster").collect();
      data = data.filter((d: any) => d.status === "converted" && d.createdAt >= periodStart && d.createdAt <= periodEnd);
      break;
    }
    case "crm.conversion_rate": {
      const total = await ctx.db.query("leadMaster").collect();
      const totalFiltered = total.filter((d: any) => d.createdAt >= periodStart && d.createdAt <= periodEnd);
      const converted = totalFiltered.filter((d: any) => d.status === "converted");
      return totalFiltered.length > 0 ? Math.round((converted.length / totalFiltered.length) * 100) : 0;
    }
    case "crm.active_leads": {
      data = await ctx.db.query("leadMaster").collect();
      data = data.filter((d: any) => d.status === "active");
      break;
    }

    case "finance.total_revenue": {
      const payments = await ctx.db.query("paymentTransactions").collect();
      data = payments.filter((p: any) => (p.status === "verified" || p.status === "completed") && p.paymentDate >= periodStart && p.paymentDate <= periodEnd);
      return aggregation === "sum" ? data.reduce((s: number, p: any) => s + p.amount, 0) : data.length;
    }
    case "finance.total_outstanding": {
      const accounts = await ctx.db.query("studentFeeAccounts").collect();
      return accounts.reduce((s: number, a: any) => s + a.outstandingBalance, 0);
    }
    case "finance.collection_rate": {
      const accounts = await ctx.db.query("studentFeeAccounts").collect();
      const totalFee = accounts.reduce((s: number, a: any) => s + a.totalFee, 0);
      const totalPaid = accounts.reduce((s: number, a: any) => s + a.totalPaid, 0);
      return totalFee > 0 ? Math.round((totalPaid / totalFee) * 100) : 0;
    }

    case "students.total": {
      data = await ctx.db.query("studentMaster").collect();
      break;
    }
    case "students.active": {
      data = await ctx.db.query("studentMaster").collect();
      data = data.filter((s: any) => s.status === "active");
      break;
    }

    case "employees.total": {
      data = await ctx.db.query("employeeMaster").collect();
      break;
    }
    case "employees.active": {
      data = await ctx.db.query("employeeMaster").collect();
      data = data.filter((e: any) => e.status === "active");
      break;
    }

    case "exams.total_sessions": {
      data = await ctx.db.query("examSessions").collect();
      data = data.filter((e: any) => e.createdAt >= periodStart && e.createdAt <= periodEnd);
      break;
    }
    case "exams.pass_rate": {
      const results = await ctx.db.query("examResults").collect();
      const filtered = results.filter((r: any) => r.calculatedAt >= periodStart && r.calculatedAt <= periodEnd);
      const passed = filtered.filter((r: any) => r.passFail === "pass").length;
      return filtered.length > 0 ? Math.round((passed / filtered.length) * 100) : 0;
    }

    case "lms.total_courses": {
      data = await ctx.db.query("lmsCourses").collect();
      break;
    }
    case "lms.total_enrollments": {
      data = await ctx.db.query("lmsEnrollments").collect();
      break;
    }
    case "lms.completion_rate": {
      const enrollments = await ctx.db.query("lmsEnrollments").collect();
      const completed = enrollments.filter((e: any) => e.status === "completed").length;
      return enrollments.length > 0 ? Math.round((completed / enrollments.length) * 100) : 0;
    }

    case "inventory.total_items": {
      data = await ctx.db.query("inventoryItems").collect();
      break;
    }
    case "inventory.low_stock": {
      data = await ctx.db.query("inventoryItems").collect();
      data = data.filter((i: any) => i.currentStock <= i.reorderLevel);
      break;
    }
    case "inventory.total_value": {
      const items = await ctx.db.query("inventoryItems").collect();
      return items.reduce((s: number, i: any) => s + (i.currentStock * i.unitPrice), 0);
    }

    case "tasks.total": {
      data = await ctx.db.query("tasks").collect();
      break;
    }
    case "tasks.pending": {
      data = await ctx.db.query("tasks").collect();
      data = data.filter((t: any) => t.status !== "done");
      break;
    }
    case "tasks.overdue": {
      data = await ctx.db.query("tasks").collect();
      data = data.filter((t: any) => t.status !== "done" && t.dueDate && t.dueDate < Date.now());
      break;
    }

    case "procurement.total_pos": {
      data = await ctx.db.query("purchaseOrders").collect();
      break;
    }
    case "procurement.active_vendors": {
      data = await ctx.db.query("vendorMaster").collect();
      data = data.filter((v: any) => v.status === "active");
      break;
    }

    default: {
      return 0;
    }
  }

  switch (aggregation) {
    case "count": return data.length;
    case "sum": return data.reduce((s: number, d: any) => s + (d.amount || d.value || 0), 0);
    case "avg": return data.length > 0 ? Math.round(data.reduce((s: number, d: any) => s + (d.amount || d.value || 0), 0) / data.length) : 0;
    default: return data.length;
  }
}

// ─── GET KPI SNAPSHOTS (time-series) ────────────

export const getKpiTimeSeries = query({
  args: {
    kpiId: v.id("kpiDefinitions"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const snapshots = await ctx.db.query("kpiSnapshots")
      .withIndex("kpiId", (q: any) => q.eq("kpiId", args.kpiId))
      .order("desc")
      .collect();

    return args.limit ? snapshots.slice(0, args.limit).reverse() : snapshots.reverse();
  },
});

// ─── GET KPI DASHBOARD CARDS ─────────────────────

export const getKpiDashboardCards = query({
  args: {
    modules: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    let kpis: any[] = [];

    if (args.modules && args.modules.length > 0) {
      for (const mod of args.modules) {
        const modKpis = await ctx.db.query("kpiDefinitions")
          .filter((q: any) => q.eq(q.field("module"), mod))
          .filter((q: any) => q.eq(q.field("isActive"), true))
          .collect();
        kpis.push(...modKpis);
      }
    } else {
      kpis = await ctx.db.query("kpiDefinitions")
        .filter((q: any) => q.eq(q.field("isActive"), true))
        .collect();
    }

    // Get latest snapshot for each KPI
    const enriched = await Promise.all(kpis.map(async (kpi: any) => {
      const latestSnapshot = await ctx.db.query("kpiSnapshots")
        .withIndex("kpiId", (q: any) => q.eq("kpiId", kpi._id))
        .order("desc")
        .first();

      return {
        ...kpi,
        currentValue: latestSnapshot ? latestSnapshot.value : 0,
        lastUpdated: latestSnapshot ? latestSnapshot.createdAt : null,
        period: latestSnapshot ? latestSnapshot.period : null,
        trend: latestSnapshot ? latestSnapshot.value : 0,
        achievedTarget: kpi.targetValue ? (latestSnapshot ? latestSnapshot.value >= kpi.targetValue : false) : null,
      };
    }));

    return enriched.sort((a: any, b: any) => a.displayOrder - b.displayOrder);
  },
});

// ─── BULK GENERATE ALL KPI SNAPSHOTS ────────────

export const generateAllKpiSnapshots = mutation({
  args: {
    period: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const kpis = await ctx.db.query("kpiDefinitions")
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .collect();

    const results: any[] = [];
    for (const kpi of kpis) {
      const value = await computeKpiValue(ctx, (kpi as any).dataSource, (kpi as any).aggregation, args.periodStart, args.periodEnd);

      await ctx.db.insert("kpiSnapshots", {
        kpiId: kpi._id,
        value,
        period: args.period,
        periodStart: args.periodStart,
        periodEnd: args.periodEnd,
        createdAt: Date.now(),
      });

      results.push({ kpiId: kpi._id, name: (kpi as any).name, value });
    }

    return results;
  },
});

// ─── MODULE-SPECIFIC DASHBOARD AGGREGATORS ──────

export const getModuleDashboardData = query({
  args: {
    module: v.union(
      v.literal("crm"), v.literal("admissions"), v.literal("students"),
      v.literal("employees"), v.literal("academics"), v.literal("finance"),
      v.literal("examinations"), v.literal("lms"), v.literal("inventory"),
      v.literal("hr"), v.literal("support"), v.literal("procurement"),
    ),
  },
  handler: async (ctx, args) => {
    switch (args.module as string) {
      case "crm": {
        const leads = await ctx.db.query("leadMaster").collect();
        return {
          total: leads.length,
          active: leads.filter((l: any) => l.status === "active").length,
          converted: leads.filter((l: any) => l.status === "converted").length,
          lost: leads.filter((l: any) => l.status === "lost").length,
          conversionRate: leads.length > 0 ? Math.round((leads.filter((l: any) => l.status === "converted").length / leads.length) * 100) : 0,
        };
      }
      case "finance": {
        const payments = await ctx.db.query("paymentTransactions").collect();
        const accounts = await ctx.db.query("studentFeeAccounts").collect();
        const invoices = await ctx.db.query("feeInvoices").collect();
        return {
          totalCollected: payments.filter((p: any) => p.status === "verified" || p.status === "completed").reduce((s: number, p: any) => s + p.amount, 0),
          totalOutstanding: accounts.reduce((s: number, a: any) => s + a.outstandingBalance, 0),
          totalInvoiced: invoices.reduce((s: number, i: any) => s + i.totalAmount, 0),
          pendingInvoices: invoices.filter((i: any) => i.status === "pending").length,
          overdueInvoices: invoices.filter((i: any) => i.status === "overdue").length,
        };
      }
      case "students": {
        const students = await ctx.db.query("studentMaster").collect();
        return {
          total: students.length,
          active: students.filter((s: any) => s.status === "active").length,
          inactive: students.filter((s: any) => s.status === "inactive" || s.status === "archived").length,
        };
      }
      case "examinations": {
        const sessions = await ctx.db.query("examSessions").collect();
        const results = await ctx.db.query("examResults").collect();
        return {
          totalSessions: sessions.length,
          inProgress: sessions.filter((s: any) => s.status === "in_progress").length,
          completed: sessions.filter((s: any) => s.status === "completed" || s.status === "published").length,
          totalResults: results.length,
          passed: results.filter((r: any) => r.passFail === "pass").length,
        };
      }
      case "lms": {
        const courses = await ctx.db.query("lmsCourses").collect();
        const enrollments = await ctx.db.query("lmsEnrollments").collect();
        return {
          totalCourses: courses.length,
          publishedCourses: courses.filter((c: any) => c.status === "published").length,
          totalEnrollments: enrollments.length,
          completed: enrollments.filter((e: any) => e.status === "completed").length,
        };
      }
      case "inventory": {
        const items = await ctx.db.query("inventoryItems").collect();
        return {
          totalItems: items.filter((i: any) => i.isActive).length,
          lowStock: items.filter((i: any) => i.currentStock <= i.reorderLevel).length,
          outOfStock: items.filter((i: any) => i.currentStock <= 0).length,
          totalValue: items.reduce((s: number, i: any) => s + (i.currentStock * i.unitPrice), 0),
        };
      }
      case "hr":
      case "employees": {
        const employees = await ctx.db.query("employeeMaster").collect();
        return {
          total: employees.length,
          active: employees.filter((e: any) => e.status === "active").length,
          onProbation: employees.filter((e: any) => e.status === "probation").length,
          resigned: employees.filter((e: any) => e.status === "resigned" || e.status === "terminated").length,
        };
      }
      case "procurement": {
        const pos = await ctx.db.query("purchaseOrders").collect();
        const vendors = await ctx.db.query("vendorMaster").collect();
        return {
          totalPOs: pos.length,
          pendingPOs: pos.filter((p: any) => p.status === "draft" || p.status === "pending_approval" || p.status === "approved").length,
          totalValue: pos.reduce((s: number, p: any) => s + p.totalAmount, 0),
          activeVendors: vendors.filter((v: any) => v.status === "active").length,
        };
      }
      case "tasks": {
        const tasks = await ctx.db.query("tasks").collect();
        return {
          total: tasks.length,
          todo: tasks.filter((t: any) => t.status === "todo").length,
          inProgress: tasks.filter((t: any) => t.status === "in_progress").length,
          completed: tasks.filter((t: any) => t.status === "done" || t.status === "review").length,
          overdue: tasks.filter((t: any) => t.status !== "done" && t.dueDate && t.dueDate < Date.now()).length,
        };
      }
      default:
        return { total: 0 };
    }
  },
});
