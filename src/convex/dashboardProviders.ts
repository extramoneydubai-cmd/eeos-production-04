/**
 * EEOS Dashboard Provider Architecture
 *
 * Every business module provides a Dashboard Provider that exposes:
 *  - KPIs (key metrics with counts/trends)
 *  - Charts (grouped/aggregated data)
 *  - Timeline (recent activity events)
 *  - Recent Activity (latest records)
 *  - Quick Stats (summary numbers)
 *
 * Dashboard Studio consumes these providers and NEVER directly queries business tables.
 *
 * To add a new module's dashboard:
 *   1. Create a provider function following the DashboardProvider interface
 *   2. Register it in moduleProviders
 *   3. Dashboard Studio auto-discovers it
 */

import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import {
  dashboardKPIs,
  dashboardCharts,
  dashboardTimeline,
  dashboardRecent,
  dashboardTasks,
  dashboardNotifications,
  type DashboardKPI,
  type DashboardChartSeries,
} from "./queryHelpers";
import { resolveSecurityContext } from "./queryPlatform";

// ═══════════════════════════════════════════════════════════════════
//  PROVIDER INTERFACES
// ═══════════════════════════════════════════════════════════════════

export interface DashboardProviderResult {
  kpis: DashboardKPI[];
  charts: DashboardChartSeries[];
  timeline: any[];
  recentActivity: any[];
  quickStats: Record<string, number>;
  notifications?: { items: any[]; unreadCount: number };
  tasks?: any;
}

export interface DashboardProvider {
  /** Unique provider ID (e.g., "crm", "finance", "students") */
  id: string;
  /** Display label */
  label: string;
  /** Icon key for UI */
  icon: string;
  /** Provider function */
  getData: (
    ctx: QueryCtx,
    userId: Id<"users">,
    token: string,
  ) => Promise<DashboardProviderResult>;
}

// ═══════════════════════════════════════════════════════════════════
//  BUILT-IN PROVIDERS
// ═══════════════════════════════════════════════════════════════════

/**
 * CRM Dashboard Provider
 */
const crmProvider: DashboardProvider = {
  id: "crm",
  label: "CRM",
  icon: "Users",
  getData: async (ctx, userId, token) => {
    const kpis = await dashboardKPIs(ctx, [
      { label: "Total Leads", table: "leadMaster", icon: "Users", color: "blue" },
      { label: "Active Leads", table: "leadMaster", icon: "UserCheck", color: "green", filter: (q: any) => q.filter((f: any) => f.eq(f.field("status"), "active")) },
      { label: "Opportunities", table: "salesOpportunities", icon: "Target", color: "purple" },
      { label: "Pending Tasks", table: "leadTasks", icon: "ListTodo", color: "orange", filter: (q: any) => q.filter((f: any) => f.neq(f.field("status"), "completed")) },
    ]);

    const charts = await dashboardCharts(ctx, [
      { name: "Leads by Stage", table: "leadMaster", groupByField: "stage", color: "#3b82f6" },
      { name: "Leads by Source", table: "leadMaster", groupByField: "source", color: "#10b981" },
    ]);

    const timeline = await dashboardTimeline(ctx, "leadActivity", {
      limit: 10,
    });

    const recentActivity = await dashboardRecent(ctx, "leadMaster", 5);

    const tasks = await dashboardTasks(ctx, "leadTasks", { userId });

    return {
      kpis,
      charts,
      timeline,
      recentActivity,
      quickStats: { totalLeads: kpis[0]?.value || 0 },
      tasks,
    };
  },
};

/**
 * Student Dashboard Provider
 */
const studentProvider: DashboardProvider = {
  id: "students",
  label: "Students",
  icon: "GraduationCap",
  getData: async (ctx) => {
    const kpis = await dashboardKPIs(ctx, [
      { label: "Total Students", table: "studentMaster", icon: "GraduationCap", color: "blue" },
      { label: "Active Students", table: "studentMaster", icon: "UserCheck", color: "green", filter: (q: any) => q.filter((f: any) => f.eq(f.field("status"), "active")) },
      { label: "Enrollments", table: "studentEnrollments", icon: "FileText", color: "purple" },
      { label: "Batches", table: "batches", icon: "Layers", color: "orange" },
    ]);

    const charts = await dashboardCharts(ctx, [
      { name: "Students by Course", table: "studentEnrollments", groupByField: "courseId", color: "#3b82f6" },
      { name: "Students by Batch", table: "studentEnrollments", groupByField: "batchId", color: "#10b981" },
    ]);

    const recentActivity = await dashboardRecent(ctx, "studentMaster", 5);

    return {
      kpis,
      charts,
      timeline: [],
      recentActivity,
      quickStats: { totalStudents: kpis[0]?.value || 0 },
    };
  },
};

/**
 * Finance Dashboard Provider
 */
const financeProvider: DashboardProvider = {
  id: "finance",
  label: "Finance",
  icon: "DollarSign",
  getData: async (ctx) => {
    const kpis = await dashboardKPIs(ctx, [
      { label: "Invoices", table: "invoices", icon: "FileText", color: "blue" },
      { label: "Payments", table: "payments", icon: "CreditCard", color: "green" },
      { label: "Pending Dues", table: "invoices", icon: "Clock", color: "orange", filter: (q: any) => q.filter((f: any) => f.eq(f.field("status"), "pending")) },
      { label: "Expenses", table: "expenses", icon: "TrendingDown", color: "red" },
    ]);

    const charts = await dashboardCharts(ctx, [
      { name: "Payments by Mode", table: "payments", groupByField: "paymentMode", color: "#3b82f6" },
      { name: "Expenses by Category", table: "expenses", groupByField: "category", color: "#ef4444" },
    ]);

    const timeline = await dashboardTimeline(ctx, "financeTimeline", { limit: 10 });

    return {
      kpis,
      charts,
      timeline,
      recentActivity: [],
      quickStats: { totalInvoices: kpis[0]?.value || 0 },
    };
  },
};

/**
 * HR Dashboard Provider
 */
const hrProvider: DashboardProvider = {
  id: "hr",
  label: "HR",
  icon: "Building",
  getData: async (ctx) => {
    const kpis = await dashboardKPIs(ctx, [
      { label: "Total Employees", table: "employeeMaster", icon: "Users", color: "blue" },
      { label: "Active Employees", table: "employeeMaster", icon: "UserCheck", color: "green", filter: (q: any) => q.filter((f: any) => f.eq(f.field("status"), "active")) },
      { label: "Departments", table: "departments", icon: "Building", color: "purple" },
      { label: "Open Positions", table: "recruitments", icon: "Briefcase", color: "orange", filter: (q: any) => q.filter((f: any) => f.eq(f.field("status"), "open")) },
    ]);

    const charts = await dashboardCharts(ctx, [
      { name: "Employees by Department", table: "employeeMaster", groupByField: "departmentId", color: "#3b82f6" },
      { name: "Employees by Type", table: "employeeMaster", groupByField: "employmentType", color: "#10b981" },
    ]);

    const recentActivity = await dashboardRecent(ctx, "employeeMaster", 5);

    return {
      kpis,
      charts,
      timeline: [],
      recentActivity,
      quickStats: { totalEmployees: kpis[0]?.value || 0 },
    };
  },
};

/**
 * Exam Dashboard Provider
 */
const examProvider: DashboardProvider = {
  id: "exams",
  label: "Exams",
  icon: "FileCheck",
  getData: async (ctx) => {
    const kpis = await dashboardKPIs(ctx, [
      { label: "Upcoming Exams", table: "examSessions", icon: "Calendar", color: "blue", filter: (q: any) => q.filter((f: any) => f.eq(f.field("status"), "scheduled")) },
      { label: "Pending Marks", table: "examMarks", icon: "ListChecks", color: "orange", filter: (q: any) => q.filter((f: any) => f.eq(f.field("status"), "pending")) },
      { label: "Published Results", table: "examResults", icon: "Award", color: "green", filter: (q: any) => q.filter((f: any) => f.eq(f.field("status"), "published")) },
    ]);

    return {
      kpis,
      charts: [],
      timeline: [],
      recentActivity: [],
      quickStats: { upcomingExams: kpis[0]?.value || 0 },
    };
  },
};

/**
 * LMS Dashboard Provider
 */
const lmsProvider: DashboardProvider = {
  id: "lms",
  label: "LMS",
  icon: "BookOpen",
  getData: async (ctx) => {
    const kpis = await dashboardKPIs(ctx, [
      { label: "Courses", table: "lmsCourses", icon: "BookOpen", color: "blue" },
      { label: "Lessons", table: "lmsLessons", icon: "FileText", color: "green" },
      { label: "Enrollments", table: "lmsEnrollments", icon: "Users", color: "purple" },
      { label: "Assignments Pending", table: "lmsSubmissions", icon: "ListTodo", color: "orange", filter: (q: any) => q.filter((f: any) => f.eq(f.field("status"), "submitted")) },
      { label: "Certificates Issued", table: "lmsCertificates", icon: "Award", color: "yellow" },
    ]);

    const charts = await dashboardCharts(ctx, [
      { name: "Courses by Status", table: "lmsCourses", groupByField: "status", color: "#3b82f6" },
      { name: "Courses by Difficulty", table: "lmsCourses", groupByField: "difficulty", color: "#10b981" },
      { name: "Enrollments by Status", table: "lmsEnrollments", groupByField: "status", color: "#8b5cf6" },
    ]);

    const timeline = await dashboardTimeline(ctx, "timelineEvents", {
      limit: 10,
      filter: (q: any) => q.filter((f: any) => f.eq(f.field("module"), "lms")),
    });

    const recentActivity = await dashboardRecent(ctx, "lmsCourses", 5);

    return {
      kpis,
      charts,
      timeline,
      recentActivity,
      quickStats: { totalCourses: kpis[0]?.value || 0 },
    };
  },
};

/**
 * Procurement & Inventory Dashboard Provider
 */
const inventoryProvider: DashboardProvider = {
  id: "inventory",
  label: "Inventory",
  icon: "Package",
  getData: async (ctx) => {
    const kpis = await dashboardKPIs(ctx, [
      { label: "Inventory Items", table: "inventoryItems", icon: "Package", color: "blue" },
      { label: "Low Stock Items", table: "inventoryItems", icon: "AlertTriangle", color: "red", filter: (q: any) => q.filter((f: any) => f.lte(f.field("currentStock"), f.field("reorderLevel"))) },
      { label: "Active Vendors", table: "vendorMaster", icon: "Building", color: "green", filter: (q: any) => q.filter((f: any) => f.eq(f.field("status"), "active")) },
      { label: "Pending Orders", table: "purchaseOrders", icon: "ShoppingCart", color: "orange", filter: (q: any) => q.filter((f: any) => f.neq(f.field("status"), "received")) },
      { label: "Pending Approvals", table: "purchaseOrders", icon: "Clock", color: "yellow", filter: (q: any) => q.filter((f: any) => f.eq(f.field("status"), "pending_approval")) },
    ]);

    const charts = await dashboardCharts(ctx, [
      { name: "POs by Status", table: "purchaseOrders", groupByField: "status", color: "#3b82f6" },
      { name: "Items by Category", table: "inventoryItems", groupByField: "categoryId", color: "#10b981" },
    ]);

    const timeline = await dashboardTimeline(ctx, "timelineEvents", {
      limit: 10,
      filter: (q: any) => q.filter((f: any) => f.eq(f.field("module"), "procurement")),
    });

    const recentActivity = await dashboardRecent(ctx, "purchaseOrders", 5);

    return {
      kpis,
      charts,
      timeline,
      recentActivity,
      quickStats: { totalItems: kpis[0]?.value || 0 },
    };
  },
};

/**
 * Procurement Dashboard Provider (operations-focused)
 */
const procurementProvider: DashboardProvider = {
  id: "procurement",
  label: "Procurement",
  icon: "Truck",
  getData: async (ctx) => {
    const kpis = await dashboardKPIs(ctx, [
      { label: "Purchase Orders", table: "purchaseOrders", icon: "FileText", color: "blue" },
      { label: "Requisitions", table: "purchaseRequisitions", icon: "ListChecks", color: "purple" },
      { label: "Goods Receipts", table: "goodsReceipts", icon: "PackageCheck", color: "green" },
      { label: "Payment Requests", table: "paymentRequests", icon: "CreditCard", color: "orange", filter: (q: any) => q.filter((f: any) => f.eq(f.field("status"), "pending_approval")) },
      { label: "Pending Approvals", table: "purchaseOrders", icon: "Clock", color: "red", filter: (q: any) => q.filter((f: any) => f.eq(f.field("status"), "pending_approval")) },
    ]);

    const charts = await dashboardCharts(ctx, [
      { name: "Requisitions by Priority", table: "purchaseRequisitions", groupByField: "priority", color: "#f59e0b" },
      { name: "Vendors by Status", table: "vendorMaster", groupByField: "status", color: "#3b82f6" },
    ]);

    const recentActivity = await dashboardRecent(ctx, "purchaseRequisitions", 5);

    return {
      kpis,
      charts,
      timeline: [],
      recentActivity,
      quickStats: { totalPOs: kpis[0]?.value || 0 },
    };
  },
};

// ═══════════════════════════════════════════════════════════════════
//  PROVIDER REGISTRY
// ═══════════════════════════════════════════════════════════════════

/**
 * All registered dashboard providers.
 * Dashboard Studio iterates this registry — it NEVER queries business tables directly.
 */
export const moduleProviders: DashboardProvider[] = [
  crmProvider,
  studentProvider,
  financeProvider,
  hrProvider,
  examProvider,
  lmsProvider,
  inventoryProvider,
  procurementProvider,
];

// ═══════════════════════════════════════════════════════════════════
//  CONSUMER QUERY (for Dashboard Studio)
// ═══════════════════════════════════════════════════════════════════

/**
 * Dashboard Studio consumer query.
 * Returns data from requested providers.
 * Dashboard Studio NEVER queries business tables directly.
 */
export const getDashboardData = query({
  args: {
    token: v.string(),
    providerIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const sec = await resolveSecurityContext(ctx, args.token);
    if (!sec.isAuthenticated || !sec.user) return {};

    const providers = args.providerIds
      ? moduleProviders.filter((p) => args.providerIds!.includes(p.id))
      : moduleProviders;

    const results: Record<string, DashboardProviderResult> = {};

    await Promise.all(
      providers.map(async (provider) => {
        try {
          results[provider.id] = await provider.getData(
            ctx,
            sec.user!._id,
            args.token,
          );
        } catch (error) {
          results[provider.id] = {
            kpis: [],
            charts: [],
            timeline: [],
            recentActivity: [],
            quickStats: {},
          };
        }
      }),
    );

    return {
      providers: results,
      providerList: providers.map((p) => ({
        id: p.id,
        label: p.label,
        icon: p.icon,
      })),
    };
  },
});

/**
 * Get metadata about available dashboard providers (no data).
 */
export const listDashboardProviders = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const sec = await resolveSecurityContext(ctx, args.token);
    if (!sec.isAuthenticated) return [];

    return moduleProviders.map((p) => ({
      id: p.id,
      label: p.label,
      icon: p.icon,
    }));
  },
});
