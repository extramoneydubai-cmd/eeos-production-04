import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── REPORT DEFINITIONS CRUD ─────────────────────────

export const createReportDefinition = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    module: v.union(
      v.literal("crm"), v.literal("admissions"), v.literal("students"),
      v.literal("employees"), v.literal("academics"), v.literal("finance"),
      v.literal("examinations"), v.literal("lms"), v.literal("inventory"),
      v.literal("hr"), v.literal("support"), v.literal("procurement"),
      v.literal("custom"),
    ),
    reportType: v.union(
      v.literal("tabular"), v.literal("summary"), v.literal("chart"),
      v.literal("kpi"), v.literal("leaderboard"), v.literal("heatmap"),
      v.literal("timeline"), v.literal("progress"),
    ),
    dataSource: v.string(),
    config: v.string(),
    defaultFilters: v.optional(v.string()),
    allowedRoles: v.optional(v.array(v.string())),
    isSystem: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db.insert("reportDefinitions", {
      ...args,
      isActive: true,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateReportDefinition = mutation({
  args: {
    id: v.id("reportDefinitions"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    config: v.optional(v.string()),
    defaultFilters: v.optional(v.string()),
    allowedRoles: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    return id;
  },
});

export const listReportDefinitions = query({
  args: {
    module: v.optional(v.union(
      v.literal("crm"), v.literal("admissions"), v.literal("students"),
      v.literal("employees"), v.literal("academics"), v.literal("finance"),
      v.literal("examinations"), v.literal("lms"), v.literal("inventory"),
      v.literal("hr"), v.literal("support"), v.literal("procurement"),
      v.literal("custom"),
    )),
    reportType: v.optional(v.union(
      v.literal("tabular"), v.literal("summary"), v.literal("chart"),
      v.literal("kpi"), v.literal("leaderboard"), v.literal("heatmap"),
      v.literal("timeline"), v.literal("progress"),
    )),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("reportDefinitions");
    if (args.module) query = query.filter((q: any) => q.eq(q.field("module"), args.module));
    if (args.reportType) query = query.filter((q: any) => q.eq(q.field("reportType"), args.reportType));
    if (args.isActive !== undefined) query = query.filter((q: any) => q.eq(q.field("isActive"), args.isActive));
    return query.collect();
  },
});

export const getReportDefinition = query({
  args: { id: v.id("reportDefinitions") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

// ─── SAVED REPORTS ─────────────────────────────────

export const saveReport = mutation({
  args: {
    definitionId: v.id("reportDefinitions"),
    name: v.string(),
    filters: v.string(),
    chartConfig: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db.insert("savedReports", {
      ...args,
      userId,
      isFavorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const toggleFavoriteReport = mutation({
  args: { id: v.id("savedReports") },
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.id);
    if (!report) throw new Error("Saved report not found");
    await ctx.db.patch(args.id, { isFavorite: !(report as any).isFavorite, updatedAt: Date.now() });
    return args.id;
  },
});

export const deleteSavedReport = mutation({
  args: { id: v.id("savedReports") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const listSavedReports = query({
  args: {
    userId: v.id("users"),
    definitionId: v.optional(v.id("reportDefinitions")),
    favoritesOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("savedReports")
      .withIndex("userId", (q: any) => q.eq("userId", args.userId));

    let reports = await query.collect();

    if (args.definitionId) {
      reports = reports.filter((r: any) => r.definitionId === args.definitionId);
    }
    if (args.favoritesOnly) {
      reports = reports.filter((r: any) => r.isFavorite);
    }

    // Enrich with definition data
    const enriched = await Promise.all(reports.map(async (r: any) => {
      const def = await ctx.db.get(r.definitionId);
      return { ...r, definition: def ? { name: (def as any).name, module: (def as any).module, reportType: (def as any).reportType } : null };
    }));

    return enriched.sort((a: any, b: any) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
  },
});

// ─── REPORT EXECUTION ─────────────────────────────

export const executeReport = mutation({
  args: {
    reportId: v.id("reportDefinitions"),
    filters: v.optional(v.string()),
    savedReportId: v.optional(v.id("savedReports")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const definition = await ctx.db.get(args.reportId);
    if (!definition) throw new Error("Report definition not found");

    const startTime = Date.now();

    try {
      // Execute based on dataSource
      const data = await executeDataSource(ctx, (definition as any).dataSource, args.filters || (definition as any).defaultFilters || "{}");

      const executionTime = Date.now() - startTime;

      // Log execution
      await ctx.db.insert("reportExecutions", {
        reportId: args.reportId,
        userId,
        savedReportId: args.savedReportId,
        filters: args.filters,
        resultData: JSON.stringify(data),
        recordCount: Array.isArray(data) ? data.length : 1,
        executionTime,
        status: "success",
        executedAt: Date.now(),
        createdAt: Date.now(),
      });

      // Update last run on saved report
      if (args.savedReportId) {
        await ctx.db.patch(args.savedReportId, { lastRunAt: Date.now(), updatedAt: Date.now() });
      }

      return { data, executionTime, success: true };
    } catch (err: any) {
      await ctx.db.insert("reportExecutions", {
        reportId: args.reportId,
        userId,
        savedReportId: args.savedReportId,
        filters: args.filters,
        resultData: undefined,
        recordCount: 0,
        executionTime: Date.now() - startTime,
        status: "failed",
        errorMessage: err.message,
        executedAt: Date.now(),
        createdAt: Date.now(),
      });

      return { data: null, executionTime: Date.now() - startTime, success: false, error: err.message };
    }
  },
});

async function executeDataSource(ctx: any, dataSource: string, filtersJson: string): Promise<any> {
  const filters = JSON.parse(filtersJson || "{}");

  switch (dataSource) {
    // ─── CRM ──────────────────────────────────────
    case "crm.leads": {
      const leads = await ctx.db.query("leadMaster").collect();
      return applyFilters(leads, filters);
    }
    case "crm.leads_by_stage": {
      const leads = await ctx.db.query("leadMaster").collect();
      const filtered = applyFilters(leads, filters);
      const byStage: Record<string, number> = {};
      for (const l of filtered) {
        const stage = (l as any).stage || "unknown";
        byStage[stage] = (byStage[stage] || 0) + 1;
      }
      return Object.entries(byStage).map(([stage, count]) => ({ stage, count }));
    }
    case "crm.leads_by_source": {
      const leads = await ctx.db.query("leadMaster").collect();
      const filtered = applyFilters(leads, filters);
      const bySource: Record<string, number> = {};
      for (const l of filtered) {
        const source = (l as any).source || "unknown";
        bySource[source] = (bySource[source] || 0) + 1;
      }
      return Object.entries(bySource).map(([source, count]) => ({ source, count }));
    }
    case "crm.conversion_rate": {
      const leads = await ctx.db.query("leadMaster").collect();
      const filtered = applyFilters(leads, filters);
      const total = filtered.length;
      const converted = filtered.filter((l: any) => l.status === "converted").length;
      return [{ metric: "Conversion Rate", value: total > 0 ? Math.round((converted / total) * 100) : 0, total, converted }];
    }

    // ─── FINANCE ───────────────────────────────────
    case "finance.revenue": {
      const payments = await ctx.db.query("paymentTransactions").collect();
      const filtered = applyFilters(payments, filters);
      return filtered;
    }
    case "finance.revenue_summary": {
      const payments = await ctx.db.query("paymentTransactions").collect();
      const filtered = applyFilters(payments, filters);
      const total = filtered.reduce((s: number, p: any) => s + p.amount, 0);
      const verified = filtered.filter((p: any) => p.status === "verified" || p.status === "completed").reduce((s: number, p: any) => s + p.amount, 0);
      return [{ total, verified, pending: total - verified, count: filtered.length }];
    }
    case "finance.outstanding": {
      const accounts = await ctx.db.query("studentFeeAccounts").collect();
      const filtered = applyFilters(accounts, filters);
      return filtered.map((a: any) => ({ studentId: a.studentId, totalFee: a.totalFee, paid: a.totalPaid, outstanding: a.outstandingBalance }));
    }
    case "finance.expenses": {
      const expenses = await ctx.db.query("expenseRecords").collect();
      const filtered = applyFilters(expenses, filters);
      return filtered;
    }

    // ─── STUDENTS ──────────────────────────────────
    case "students.list": {
      const students = await ctx.db.query("studentMaster").collect();
      return applyFilters(students, filters);
    }
    case "students.by_batch": {
      const students = await ctx.db.query("studentMaster").collect();
      const filtered = applyFilters(students, filters);
      const byBatch: Record<string, number> = {};
      for (const s of filtered) {
        const batch = (s as any).batchId || "unknown";
        byBatch[batch] = (byBatch[batch] || 0) + 1;
      }
      return Object.entries(byBatch).map(([batchId, count]) => ({ batchId, count }));
    }

    // ─── EMPLOYEES ─────────────────────────────────
    case "employees.list": {
      const employees = await ctx.db.query("employeeMaster").collect();
      return applyFilters(employees, filters);
    }

    // ─── EXAMINATIONS ──────────────────────────────
    case "exams.results": {
      const results = await ctx.db.query("examResults").collect();
      return applyFilters(results, filters);
    }
    case "exams.pass_rate": {
      const results = await ctx.db.query("examResults").collect();
      const filtered = applyFilters(results, filters);
      const total = filtered.length;
      const passed = filtered.filter((r: any) => r.passFail === "pass").length;
      return [{ metric: "Pass Rate", value: total > 0 ? Math.round((passed / total) * 100) : 0, total, passed }];
    }

    // ─── LMS ───────────────────────────────────────
    case "lms.courses": {
      const courses = await ctx.db.query("lmsCourses").collect();
      return applyFilters(courses, filters);
    }
    case "lms.enrollments": {
      const enrollments = await ctx.db.query("lmsEnrollments").collect();
      return applyFilters(enrollments, filters);
    }
    case "lms.completion_rate": {
      const enrollments = await ctx.db.query("lmsEnrollments").collect();
      const filtered = applyFilters(enrollments, filters);
      const total = filtered.length;
      const completed = filtered.filter((e: any) => e.status === "completed").length;
      return [{ metric: "Completion Rate", value: total > 0 ? Math.round((completed / total) * 100) : 0, total, completed }];
    }

    // ─── INVENTORY ─────────────────────────────────
    case "inventory.items": {
      const items = await ctx.db.query("inventoryItems").collect();
      return applyFilters(items, filters);
    }
    case "inventory.low_stock": {
      const items = await ctx.db.query("inventoryItems").collect();
      const filtered = applyFilters(items, filters);
      return filtered.filter((i: any) => i.currentStock <= i.reorderLevel);
    }
    case "inventory.by_category": {
      const items = await ctx.db.query("inventoryItems").collect();
      const filtered = applyFilters(items, filters);
      const byCategory: Record<string, number> = {};
      for (const i of filtered) {
        const cat = (i as any).categoryId || "uncategorized";
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      }
      return Object.entries(byCategory).map(([categoryId, count]) => ({ categoryId, count }));
    }

    // ─── PROCUREMENT ───────────────────────────────
    case "procurement.pos": {
      const pos = await ctx.db.query("purchaseOrders").collect();
      return applyFilters(pos, filters);
    }
    case "procurement.vendors": {
      const vendors = await ctx.db.query("vendorMaster").collect();
      return applyFilters(vendors, filters);
    }

    // ─── TASKS ────────────────────────────────────
    case "tasks.list": {
      const tasks = await ctx.db.query("tasks").collect();
      return applyFilters(tasks, filters);
    }
    case "tasks.by_status": {
      const tasks = await ctx.db.query("tasks").collect();
      const filtered = applyFilters(tasks, filters);
      const byStatus: Record<string, number> = {};
      for (const t of filtered) {
        const status = (t as any).status || "unknown";
        byStatus[status] = (byStatus[status] || 0) + 1;
      }
      return Object.entries(byStatus).map(([status, count]) => ({ status, count }));
    }

    // ─── HR ───────────────────────────────────────
    case "hr.employees": {
      const employees = await ctx.db.query("employeeMaster").collect();
      return applyFilters(employees, filters);
    }
    case "hr.by_department": {
      const employees = await ctx.db.query("employeeMaster").collect();
      const filtered = applyFilters(employees, filters);
      const byDept: Record<string, number> = {};
      for (const e of filtered) {
        const dept = (e as any).departmentId || "unknown";
        byDept[dept] = (byDept[dept] || 0) + 1;
      }
      return Object.entries(byDept).map(([dept, count]) => ({ departmentId: dept, count }));
    }

    // ─── ADMISSIONS / INTAKE ────────────────────────
    case "admissions.intakes": {
      const intakes = await ctx.db.query("intakeSubmissions").collect();
      return applyFilters(intakes, filters);
    }

    default:
      throw new Error(`Unknown data source: ${dataSource}`);
  }
}

function applyFilters(data: any[], filters: Record<string, any>): any[] {
  if (!filters || Object.keys(filters).length === 0) return data;

  return data.filter((item: any) => {
    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined || value === "") continue;

      // Date range filter
      if (key === "startDate" && item.createdAt) {
        if (item.createdAt < value) return false;
        continue;
      }
      if (key === "endDate" && item.createdAt) {
        if (item.createdAt > value) return false;
        continue;
      }

      // Direct field match
      if (key in item) {
        const fieldVal = item[key];
        if (Array.isArray(value)) {
          if (!value.includes(fieldVal)) return false;
        } else if (typeof value === "string" && typeof fieldVal === "string") {
          if (!fieldVal.toLowerCase().includes(value.toLowerCase())) return false;
        } else if (fieldVal !== value) {
          return false;
        }
      }
    }
    return true;
  });
}

// ─── REPORT EXECUTION HISTORY ─────────────────────

export const getReportExecutionHistory = query({
  args: {
    reportId: v.id("reportDefinitions"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("reportExecutions")
      .withIndex("reportId", (q: any) => q.eq("reportId", args.reportId));

    const results = await query.order("desc").collect();
    return args.limit ? results.slice(0, args.limit) : results;
  },
});

// ─── REPORT BUILDER DATA ─────────────────────────

export const getAvailableDataSources = query({
  handler: async () => {
    return [
      { module: "crm", sources: ["crm.leads", "crm.leads_by_stage", "crm.leads_by_source", "crm.conversion_rate"] },
      { module: "finance", sources: ["finance.revenue", "finance.revenue_summary", "finance.outstanding", "finance.expenses"] },
      { module: "students", sources: ["students.list", "students.by_batch"] },
      { module: "employees", sources: ["employees.list"] },
      { module: "examinations", sources: ["exams.results", "exams.pass_rate"] },
      { module: "lms", sources: ["lms.courses", "lms.enrollments", "lms.completion_rate"] },
      { module: "inventory", sources: ["inventory.items", "inventory.low_stock", "inventory.by_category"] },
      { module: "procurement", sources: ["procurement.pos", "procurement.vendors"] },
      { module: "tasks", sources: ["tasks.list", "tasks.by_status"] },
      { module: "hr", sources: ["hr.employees", "hr.by_department"] },
      { module: "admissions", sources: ["admissions.intakes"] },
    ];
  },
});

// ─── GLOBAL FILTERS ─────────────────────────────

export const getGlobalFilterOptions = query({
  handler: async (ctx) => {
    const branches = await ctx.db.query("branches").collect();
    const departments = await ctx.db.query("departments").collect();
    const users = await ctx.db.query("users").collect();
    const verts = await ctx.db.query("verticals").collect();

    return {
      branches: branches.map((b: any) => ({ id: b._id, name: b.name })),
      departments: departments.map((d: any) => ({ id: d._id, name: d.name })),
      users: users.map((u: any) => ({ id: u._id, name: u.name })),
      verticals: verts.map((v: any) => ({ id: v._id, name: v.name })),
      statusOptions: ["active", "inactive", "pending", "completed", "cancelled"],
    };
  },
});
