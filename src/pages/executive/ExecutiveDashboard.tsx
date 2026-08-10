/**
 * ExecutiveDashboard — Standard premium executive dashboard template
 *
 * One template, driven by the role's dashboard config + live Convex data.
 * Every executive role (CEO, CFO, CTO, CMO, CKO, COO, CHRO, CPO) renders the
 * same premium layout, but each KPI tile, chart and insight is wired to
 * real engine data for that role.
 *
 * Layout:
 *   Header + persisted period selector (Today / This Month / This Quarter)
 *   + persisted trend window (3M / 6M / 12M)
 *   + persisted dimension split (Branch / Vertical — CFO charts)
 *   → KPI matrix (role KPIs, period-filtered where supported)
 *   → Trend chart (real time series per role, window-aware)
 *   → Bar + Donut charts (role distributions)
 *   → Derived insights (computed from real numbers)
 *   → Executive scorecard ring · Top performers leaderboard (metric filter) · Notifications
 *   → Open tasks · Recent activity
 *   → Quick actions (from the dashboard config)
 *   → Module navigator (role-specific deep links)
 */

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { useAuth } from "@/hooks/use-auth";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, DollarSign, TrendingUp, Users, GraduationCap,
  Activity, Bell, ListChecks, AlertCircle, CheckCircle2, Zap,
  Monitor, Shield, Database, ArrowUpRight, ArrowDownRight,
  ArrowRight, Sparkles, BookOpen,
  Megaphone, Award, Clock, Package, Target, Landmark, LayoutDashboard,
  Building2, Calendar, FileCheck, PiggyBank, UserPlus, ShoppingCart,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from "recharts";
import { getDashboardConfig } from "@/config/executiveDashboards";

// ─── Design tokens ───────────────────────────────────────────────
const PIE_COLORS = ["#4285f4", "#34a853", "#fbbc04", "#ea4335", "#a855f7", "#ec407a", "#e8710a", "#1a73e8", "#5f6368", "#14b8a6"];
const CHART_HEIGHT = 190;
const MEDAL_COLORS = ["bg-[#fbbc04]", "bg-[#9aa0a6]", "bg-[#e8710a]"];

// ─── Period types ────────────────────────────────────────────────
type PeriodKey = "today" | "month" | "quarter";
const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "month", label: "This Month" },
  { key: "quarter", label: "This Quarter" },
];
const periodStorageKey = (roleId: string) => `eeos_exec_${roleId}_period`;

function loadSavedPeriod(roleId: string): PeriodKey {
  try {
    const saved = window.localStorage.getItem(periodStorageKey(roleId));
    if (saved === "today" || saved === "month" || saved === "quarter") return saved;
  } catch {
    // storage unavailable — fall through to default
  }
  return "month";
}

// ─── Trend window types ──────────────────────────────────────────
type MonthKey = 3 | 6 | 12;
const MONTH_OPTIONS: { key: MonthKey; label: string }[] = [
  { key: 3, label: "3M" },
  { key: 6, label: "6M" },
  { key: 12, label: "12M" },
];
const monthsStorageKey = (roleId: string) => `eeos_exec_${roleId}_months`;

function loadSavedMonths(roleId: string): MonthKey {
  try {
    const saved = Number(window.localStorage.getItem(monthsStorageKey(roleId)));
    if (saved === 3 || saved === 6 || saved === 12) return saved as MonthKey;
  } catch {
    // storage unavailable — fall through to default
  }
  return 6;
}

// ─── Dimension split types (CFO charts: branch vs vertical) ───────
type DimensionKey = "branch" | "vertical";
const DIMENSION_OPTIONS: { key: DimensionKey; label: string }[] = [
  { key: "branch", label: "Branch" },
  { key: "vertical", label: "Vertical" },
];
const dimensionStorageKey = (roleId: string) => `eeos_exec_${roleId}_dimension`;

function loadSavedDimension(roleId: string): DimensionKey {
  try {
    const saved = window.localStorage.getItem(dimensionStorageKey(roleId));
    if (saved === "branch" || saved === "vertical") return saved;
  } catch {
    // storage unavailable — fall through to default
  }
  return "branch";
}

// ─── Leaderboard metric types ────────────────────────────────────
type LeaderMetric = "revenue" | "leads_converted" | "tasks_completed" | "calls_made";
const LEADER_METRICS: { key: LeaderMetric; label: string }[] = [
  { key: "revenue", label: "Revenue" },
  { key: "leads_converted", label: "Leads" },
  { key: "tasks_completed", label: "Tasks" },
  { key: "calls_made", label: "Calls" },
];
const DEFAULT_LEADER_METRIC: Record<string, LeaderMetric> = {
  cfo: "revenue",
  cmo: "leads_converted",
  cko: "tasks_completed",
  cto: "tasks_completed",
  coo: "tasks_completed",
  chro: "tasks_completed",
  cpo: "tasks_completed",
  ceo: "revenue",
};
const leaderStorageKey = (roleId: string) => `eeos_exec_${roleId}_leader`;

function loadSavedLeaderMetric(roleId: string): LeaderMetric {
  try {
    const saved = window.localStorage.getItem(leaderStorageKey(roleId));
    if (saved === "revenue" || saved === "leads_converted" || saved === "tasks_completed" || saved === "calls_made") {
      return saved;
    }
  } catch {
    // storage unavailable — fall through to default
  }
  return DEFAULT_LEADER_METRIC[roleId] ?? "tasks_completed";
}

function fmtMoney(n: number): string {
  if (!n || isNaN(n)) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString();
}

// ─── Data hook — one role bag ────────────────────────────────────
interface RoleData {
  overview: any;
  periodKpis: any;
  trends: any;
  branchCmp: any;
  tasks: any[];
  notifications: any[];
  activities: any[];
  scorecard: any;
  leaderboard: any[];
  finance: any;
  financeWidget: any;
  tech: any;
  sysHealth: any;
  marketing: any;
  crmWidget: any;
  comms: any;
  lms: any;
  knowledge: any;
  exam: any;
  ops: any;
  tasksW: any;
  hr: any;
  empStats: any;
  inv: any;
}

function useRoleData(roleId: string, period: PeriodKey, months: MonthKey, leaderMetric: LeaderMetric, dimension: DimensionKey): RoleData {
  const { user } = useAuth();
  const userId = user?._id as string | undefined;

  const overview = useQuery(api.dashboardEngine.getEnterpriseOverview, {});
  const periodKpis = useQuery(api.dashboardEngine.getPeriodKpis, { period });
  const trends = useQuery(api.dashboardEngine.getDashboardTrends, { months });
  const branchCmp = useQuery(api.dashboardEngine.getBranchComparison, { period, dimension } as any);
  const tasks = useQuery(api.tasks.listTasks, {}) ?? [];
  const notifications = useQuery(
    api.notifications.listNotifications,
    userId ? { userId: userId as any, limit: 20 } : "skip"
  ) ?? [];
  const activities = useQuery(api.timelineEngine.getRecentTimeline, { limit: 10 }) ?? [];
  const scorecard = useQuery(api.kpiEngine.getExecutiveScorecard, {});
  const leaderboard = useQuery(api.dashboardEngine.getLeaderboardWidget, { metric: leaderMetric, limit: 5 }) ?? [];

  // Role-specific queries — skipped for other roles (Convex "skip" pattern)
  const finance = useQuery(api.financePlatform.getFinanceDashboardKPIs, roleId === "cfo" ? {} : "skip");
  const financeWidget = useQuery(api.dashboardEngine.getFinanceWidget, roleId === "cfo" ? {} : "skip");
  const tech = useQuery(api.technologyEngine.getTechnologyDashboard, roleId === "cto" ? {} : "skip");
  const sysHealth = useQuery(api.adminEngine.getSystemHealth, roleId === "cto" ? {} : "skip");
  const marketing = useQuery(api.communicationCampaignEngine.getMarketingDashboard, roleId === "cmo" ? {} : "skip");
  const crmWidget = useQuery(api.dashboardEngine.getCrmWidget, roleId === "cmo" ? {} : "skip");
  const comms = useQuery(api.dashboardEngine.getCommunicationWidget, roleId === "cmo" ? {} : "skip");
  const lms = useQuery(api.lmsEngine.getLMSDashboard, roleId === "cko" ? {} : "skip");
  const knowledge = useQuery(api.knowledgeEngine.getKnowledgeDashboard, roleId === "cko" ? {} : "skip");
  const exam = useQuery(api.dashboardEngine.getExaminationWidget, roleId === "cko" ? {} : "skip");
  const ops = useQuery(api.dashboardEngine.getOperationsWidget, roleId === "coo" ? {} : "skip");
  const tasksW = useQuery(api.dashboardEngine.getTasksWidget, roleId === "coo" ? {} : "skip");
  const hr = useQuery(api.dashboardEngine.getHrWidget, roleId === "chro" ? {} : "skip");
  const empStats = useQuery(api.employeeEngine.getEmployeeStats, roleId === "chro" ? {} : "skip");
  const inv = useQuery(api.dashboardEngine.getInventoryWidget, roleId === "cpo" ? {} : "skip");

  return {
    overview, periodKpis, trends, branchCmp, tasks, notifications, activities,
    scorecard, leaderboard,
    finance, financeWidget, tech, sysHealth, marketing, crmWidget, comms,
    lms, knowledge, exam, ops, tasksW, hr, empStats, inv,
  };
}

// ─── KPI tiles per role ──────────────────────────────────────────
interface KpiTile {
  label: string;
  value: string;
  sub?: string;
  icon: typeof DollarSign;
  color: string;
  onClick?: string;
  trend?: number;
  trendUp?: boolean;
}

function buildKpis(roleId: string, d: RoleData, periodLabel: string): KpiTile[] {
  const k = d.periodKpis ?? {};
  switch (roleId) {
    case "cfo": {
      const f = d.finance ?? {};
      return [
        { label: `Revenue · ${periodLabel}`, value: fmtMoney(k.revenue ?? 0), sub: `${fmtMoney(k.collected ?? 0)} collected`, icon: DollarSign, color: "bg-gradient-to-br from-[#1a73e8] to-[#4285f4]", onClick: "/finance" },
        { label: "Collection Rate", value: `${k.collectionRate ?? f.collectionRate ?? 0}%`, sub: `${k.invoiceCount ?? f.invoiceCount ?? 0} invoices`, icon: TrendingUp, color: "bg-gradient-to-br from-[#34a853] to-[#0f9d58]", onClick: "/collections" },
        { label: `Outstanding · ${periodLabel}`, value: fmtMoney(k.outstanding ?? f.totalOutstanding ?? 0), sub: `${fmtMoney(k.overdueAmount ?? f.overdueAmount ?? 0)} overdue`, icon: AlertCircle, color: "bg-gradient-to-br from-[#ea4335] to-[#d93025]", onClick: "/finance" },
        { label: "Net Revenue", value: fmtMoney(k.netRevenue ?? f.netRevenue ?? 0), sub: `${fmtMoney(k.totalRefunded ?? f.totalRefunded ?? 0)} refunded`, icon: CheckCircle2, color: "bg-gradient-to-br from-[#a855f7] to-[#7c3aed]", onClick: "/finance/reports" },
        { label: `Expenses · ${periodLabel}`, value: fmtMoney(k.totalExpenses ?? f.totalExpenses ?? 0), sub: `${f.pendingExpenses ?? 0} pending approval`, icon: ArrowDownRight, color: "bg-gradient-to-br from-[#fbbc04] to-[#f29900]", onClick: "/finance" },
        { label: "Accounts", value: `${f.activeAccounts ?? 0}`, sub: `${f.defaultedAccounts ?? 0} defaulted`, icon: Landmark, color: "bg-gradient-to-br from-[#5f6368] to-[#3c4043]", onClick: "/finance" },
      ];
    }
    case "cto": {
      const t = d.tech ?? {};
      const jobs = t.scheduledJobs ?? [];
      return [
        { label: "System Status", value: String(t.systemHealth ?? d.sysHealth?.status ?? "—").toUpperCase(), sub: `DB ${d.sysHealth?.databaseStatus ?? "—"}`, icon: Monitor, color: "bg-gradient-to-br from-[#1a73e8] to-[#4285f4]", onClick: "/platform-studio" },
        { label: "Failed Jobs", value: `${t.failedJobsCount ?? 0}`, sub: `${jobs.length} scheduled jobs`, icon: AlertCircle, color: "bg-gradient-to-br from-[#ea4335] to-[#d93025]", onClick: "/release-health" },
        { label: "Active API Keys", value: `${t.activeApiKeys ?? 0}`, sub: `${t.apiKeys ?? 0} total keys`, icon: Database, color: "bg-gradient-to-br from-[#34a853] to-[#0f9d58]", onClick: "/platform-studio" },
        { label: "Active Webhooks", value: `${t.activeWebhooks ?? 0}`, sub: `${t.webhooks ?? 0} total`, icon: Zap, color: "bg-gradient-to-br from-[#a855f7] to-[#7c3aed]", onClick: "/platform-studio" },
        { label: "SLA Breaches", value: `${t.slaBreaches ?? 0}`, sub: `${t.scopeViolations ?? 0} scope violations`, icon: Shield, color: "bg-gradient-to-br from-[#fbbc04] to-[#f29900]", onClick: "/release-health" },
        { label: "Integrations", value: `${t.integrations ?? 0}`, sub: `${t.deployments ?? 0} deployments`, icon: Package, color: "bg-gradient-to-br from-[#5f6368] to-[#3c4043]", onClick: "/platform-studio" },
      ];
    }
    case "cmo": {
      const m = d.marketing ?? {};
      const c = d.crmWidget ?? {};
      const w = d.comms ?? {};
      return [
        { label: "Total Leads", value: `${m.totalLeads ?? c.totalLeads ?? 0}`, sub: `${c.activeLeads ?? 0} active`, icon: Users, color: "bg-gradient-to-br from-[#1a73e8] to-[#4285f4]", onClick: "/crm/leads" },
        { label: "Conversion Rate", value: `${c.conversionRate ?? m.conversionRate ?? 0}%`, sub: `${c.admissions ?? 0} admissions`, icon: TrendingUp, color: "bg-gradient-to-br from-[#34a853] to-[#0f9d58]", onClick: "/crm/leads" },
        { label: "Active Campaigns", value: `${m.activeCampaigns ?? 0}`, sub: `${m.totalCampaigns ?? 0} total`, icon: Megaphone, color: "bg-gradient-to-br from-[#e8710a] to-[#d96200]", onClick: "/communication-marketing" },
        { label: "Pipeline Value", value: fmtMoney(c.pipelineValue ?? 0), sub: `${c.counselorCount ?? 0} counsellors`, icon: DollarSign, color: "bg-gradient-to-br from-[#a855f7] to-[#7c3aed]", onClick: "/crm/leads" },
        { label: "Messages Sent", value: `${w.totalSent ?? 0}`, sub: `${w.totalDelivered ?? 0} delivered`, icon: Bell, color: "bg-gradient-to-br from-[#4285f4] to-[#1a73e8]", onClick: "/communication-marketing" },
        { label: "Delivery Rate", value: `${w.deliveryRate ?? 0}%`, sub: `${w.totalFailed ?? 0} failed`, icon: CheckCircle2, color: "bg-gradient-to-br from-[#5f6368] to-[#3c4043]", onClick: "/communication-marketing" },
      ];
    }
    case "cko": {
      const l = d.lms ?? {};
      const x = d.exam ?? {};
      const n = d.knowledge ?? {};
      return [
        { label: "Courses", value: `${l.totalCourses ?? 0}`, sub: `${l.publishedCourses ?? 0} published`, icon: BookOpen, color: "bg-gradient-to-br from-[#1a73e8] to-[#4285f4]", onClick: "/lms" },
        { label: "Enrollments", value: `${l.totalEnrolled ?? 0}`, sub: `${l.inProgress ?? 0} in progress`, icon: GraduationCap, color: "bg-gradient-to-br from-[#a855f7] to-[#7c3aed]", onClick: "/lms" },
        { label: "Completion Rate", value: `${l.completionRate ?? 0}%`, sub: `${l.completedCourses ?? 0} completed`, icon: CheckCircle2, color: "bg-gradient-to-br from-[#34a853] to-[#0f9d58]", onClick: "/lms" },
        { label: "Exam Pass Rate", value: `${x.passRate ?? 0}%`, sub: `${x.totalResults ?? 0} results`, icon: Award, color: "bg-gradient-to-br from-[#e8710a] to-[#d96200]", onClick: "/examinations" },
        { label: "Knowledge Articles", value: `${n.published ?? 0}`, sub: `${n.drafts ?? 0} drafts`, icon: BookOpen, color: "bg-gradient-to-br from-[#4285f4] to-[#1a73e8]", onClick: "/knowledge" },
        { label: "Knowledge Views", value: fmtMoney(n.totalViews ?? 0), sub: `${n.totalArticles ?? 0} total articles`, icon: Sparkles, color: "bg-gradient-to-br from-[#5f6368] to-[#3c4043]", onClick: "/knowledge" },
      ];
    }
    case "coo": {
      const o = d.ops ?? {};
      const t = d.tasksW ?? {};
      return [
        { label: "Pending Tasks", value: `${o.tasks?.pending ?? t.todo ?? 0}`, sub: `${o.tasks?.total ?? t.total ?? 0} total`, icon: ListChecks, color: "bg-gradient-to-br from-[#1a73e8] to-[#4285f4]", onClick: "/tasks" },
        { label: "Overdue Tasks", value: `${o.tasks?.overdue ?? t.overdue ?? 0}`, sub: `${t.overdueHigh ?? 0} high priority`, icon: AlertCircle, color: "bg-gradient-to-br from-[#ea4335] to-[#d93025]", onClick: "/tasks" },
        { label: "Running Workflows", value: `${o.workflows?.running ?? 0}`, sub: `${o.workflows?.failed ?? 0} failed`, icon: Zap, color: "bg-gradient-to-br from-[#a855f7] to-[#7c3aed]", onClick: "/workflow-monitor" },
        { label: "Pending Approvals", value: `${o.approvals?.pending ?? 0}`, sub: `${o.approvals?.total ?? 0} total`, icon: CheckCircle2, color: "bg-gradient-to-br from-[#34a853] to-[#0f9d58]", onClick: "/approvals" },
        { label: "Open SLA", value: `${o.sla?.openViolations ?? 0}`, sub: `${o.sla?.totalViolations ?? 0} total`, icon: Clock, color: "bg-gradient-to-br from-[#fbbc04] to-[#f29900]", onClick: "/workflow-monitor" },
        { label: "Open Escalations", value: `${o.escalations?.open ?? 0}`, sub: `L1 ${o.escalations?.level1 ?? 0} · L2 ${o.escalations?.level2 ?? 0}`, icon: Shield, color: "bg-gradient-to-br from-[#5f6368] to-[#3c4043]", onClick: "/crm/leads" },
      ];
    }
    case "chro": {
      const h = d.hr ?? {};
      const e = d.empStats ?? {};
      return [
        { label: "Employees", value: `${h.totalEmployees ?? 0}`, sub: `${h.activeEmployees ?? 0} active`, icon: Users, color: "bg-gradient-to-br from-[#ec407a] to-[#d81b60]", onClick: "/employees" },
        { label: "Onboarding", value: `${e.onboarding ?? 0}`, sub: `${h.anniversaryThisMonth ?? 0} anniversaries`, icon: Users, color: "bg-gradient-to-br from-[#1a73e8] to-[#4285f4]", onClick: "/employees" },
        { label: "Probation", value: `${e.probation ?? 0}`, sub: `${e.suspended ?? 0} suspended`, icon: Clock, color: "bg-gradient-to-br from-[#fbbc04] to-[#f29900]", onClick: "/employees" },
        { label: "Birthdays", value: `${h.birthdaysThisMonth ?? 0}`, sub: `this month`, icon: Sparkles, color: "bg-gradient-to-br from-[#a855f7] to-[#7c3aed]", onClick: "/calendar" },
        { label: "Permanent", value: `${e.permanent ?? 0}`, sub: `${e.contract ?? 0} contract`, icon: CheckCircle2, color: "bg-gradient-to-br from-[#34a853] to-[#0f9d58]", onClick: "/employees" },
        { label: "Disabled Users", value: `${h.disabledEmployees ?? 0}`, sub: `${e.archived ?? 0} archived`, icon: AlertCircle, color: "bg-gradient-to-br from-[#ea4335] to-[#d93025]", onClick: "/users" },
      ];
    }
    case "cpo": {
      const v = d.inv ?? {};
      return [
        { label: "Total Items", value: `${v.totalItems ?? 0}`, sub: `${v.activeItems ?? 0} active`, icon: Package, color: "bg-gradient-to-br from-[#1a73e8] to-[#4285f4]", onClick: "/procurement/inventory" },
        { label: "Low Stock", value: `${v.lowStockCount ?? 0}`, sub: `reorder soon`, icon: AlertCircle, color: "bg-gradient-to-br from-[#fbbc04] to-[#f29900]", onClick: "/procurement/inventory" },
        { label: "Out of Stock", value: `${v.outOfStockCount ?? 0}`, sub: `critical`, icon: AlertCircle, color: "bg-gradient-to-br from-[#ea4335] to-[#d93025]", onClick: "/procurement/inventory" },
        { label: "Stock Health", value: `${v.stockHealth ?? 0}%`, sub: `overall health`, icon: TrendingUp, color: "bg-gradient-to-br from-[#34a853] to-[#0f9d58]", onClick: "/procurement/inventory" },
        { label: "Recent Movements", value: `${v.recentMovements ?? 0}`, sub: `this period`, icon: Activity, color: "bg-gradient-to-br from-[#a855f7] to-[#7c3aed]", onClick: "/procurement/inventory" },
        { label: "Warehouses", value: `${v.totalWarehouses ?? 0}`, sub: `across branches`, icon: Landmark, color: "bg-gradient-to-br from-[#5f6368] to-[#3c4043]", onClick: "/procurement" },
      ];
    }
    default:
      return [];
  }
}

// ─── Charts per role ─────────────────────────────────────────────
interface ChartSeries { name: string; [k: string]: string | number }
interface DonutSlice { name: string; value: number }

function buildTrend(roleId: string, d: RoleData): { title: string; data: ChartSeries[]; keys: string[]; colors: string[] } {
  const tr = d.trends ?? {};
  switch (roleId) {
    case "cfo":
      return {
        title: "Revenue & Expenses",
        data: (tr.financeTrend ?? []).map((p: any) => ({ name: p.key, revenue: Math.round(p.revenue), expenses: Math.round(p.expenses) })),
        keys: ["revenue", "expenses"],
        colors: ["#4285f4", "#ea4335"],
      };
    case "cto": {
      const t = d.tech ?? {};
      const hist = t.metricHistory ?? {};
      const first = Object.keys(hist)[0];
      const series: ChartSeries[] = (first ? (hist[first] ?? []) : [])
        .sort((a: any, b: any) => a.recordedAt - b.recordedAt)
        .slice(-12)
        .map((p: any) => ({ name: new Date(p.recordedAt).toLocaleDateString("en", { month: "short", day: "numeric" }), value: Math.round(p.value) }));
      return {
        title: first ? `Metric: ${first.replace(/_/g, " ")}` : "Platform Metric Trend",
        data: series.length ? series : [{ name: "—", value: 0 }],
        keys: ["value"],
        colors: ["#1a73e8"],
      };
    }
    case "cmo":
      return {
        title: "Lead Generation Trend",
        data: (tr.leadTrend ?? []).map((p: any) => ({ name: p.key, leads: p.leads })),
        keys: ["leads"],
        colors: ["#e8710a"],
      };
    case "cko":
      return {
        title: "Enrollment Trend",
        data: (tr.studentTrend ?? []).map((p: any) => ({ name: p.key, students: p.students })),
        keys: ["students"],
        colors: ["#a855f7"],
      };
    case "coo":
    case "chro":
    case "cpo":
      return {
        title: roleId === "chro" ? "Workload Trend" : "Task Volume Trend",
        data: (tr.taskTrend ?? []).map((p: any) => ({ name: p.key, created: p.created, completed: p.completed })),
        keys: ["created", "completed"],
        colors: ["#4285f4", "#34a853"],
      };
    default:
      return { title: "Trend", data: [], keys: [], colors: [] };
  }
}

function buildBar(roleId: string, d: RoleData, dimension: DimensionKey): { title: string; data: ChartSeries[]; color: string } {
  switch (roleId) {
    case "cfo": {
      const rows = d.branchCmp?.branches ?? [];
      const isVertical = dimension === "vertical";
      return {
        title: isVertical ? "Revenue by Vertical" : "Revenue by Branch",
        data: rows.slice(0, 8).map((b: any) => ({ name: (b.branchCode || b.branchName || "—").slice(0, 8), revenue: Math.round((b.metrics?.revenue ?? 0) / 1000) })),
        color: "#34a853",
      };
    }
    case "cto": {
      const t = d.tech ?? {};
      const latest = t.metricLatest ?? {};
      const rows = Object.entries(latest)
        .map(([k, v]: any) => ({ name: k.replace(/_/g, " ").slice(0, 10), value: Math.round(v.value ?? 0) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 7);
      return { title: "Live Metrics", data: rows, color: "#1a73e8" };
    }
    case "cmo": {
      const w = d.comms ?? {};
      return {
        title: "Message Delivery",
        data: [
          { name: "Sent", value: w.totalSent ?? 0 },
          { name: "Delivered", value: w.totalDelivered ?? 0 },
          { name: "Failed", value: w.totalFailed ?? 0 },
          { name: "Queued", value: w.totalQueued ?? 0 },
        ],
        color: "#e8710a",
      };
    }
    case "cko": {
      const n = d.knowledge ?? {};
      const byType = n.byType ?? {};
      return {
        title: "Knowledge by Type",
        data: Object.entries(byType).map(([k, v]: any) => ({ name: k.charAt(0).toUpperCase() + k.slice(1, 6), value: v })),
        color: "#a855f7",
      };
    }
    case "coo": {
      const t = d.tasksW ?? {};
      return {
        title: "Task Pipeline",
        data: [
          { name: "Backlog", value: t.backlog ?? 0 },
          { name: "Todo", value: t.todo ?? 0 },
          { name: "In Progress", value: t.inProgress ?? 0 },
          { name: "Review", value: t.review ?? 0 },
          { name: "Done", value: t.done ?? 0 },
        ],
        color: "#4285f4",
      };
    }
    case "chro": {
      const e = d.empStats ?? {};
      return {
        title: "Employment Types",
        data: [
          { name: "Permanent", value: e.permanent ?? 0 },
          { name: "Contract", value: e.contract ?? 0 },
          { name: "Part-time", value: e.partTime ?? 0 },
          { name: "Intern", value: e.intern ?? 0 },
          { name: "Consultant", value: e.consultant ?? 0 },
        ],
        color: "#ec407a",
      };
    }
    case "cpo": {
      const v = d.inv ?? {};
      return {
        title: "Stock Status",
        data: [
          { name: "Healthy", value: Math.max((v.activeItems ?? 0) - (v.lowStockCount ?? 0) - (v.outOfStockCount ?? 0), 0) },
          { name: "Low", value: v.lowStockCount ?? 0 },
          { name: "Out", value: v.outOfStockCount ?? 0 },
        ],
        color: "#fbbc04",
      };
    }
    default:
      return { title: "Comparison", data: [], color: "#4285f4" };
  }
}

function buildDonut(roleId: string, d: RoleData, dimension: DimensionKey): { title: string; data: DonutSlice[] } {
  switch (roleId) {
    case "cfo": {
      const k = d.periodKpis ?? {};
      const rows = d.branchCmp?.branches ?? [];
      const isVertical = dimension === "vertical";
      // Top entities by outstanding — slices the same comparison data as the bar chart.
      const byOutstanding = rows
        .filter((b: any) => (b.metrics?.outstanding ?? 0) > 0)
        .sort((a: any, b: any) => (b.metrics?.outstanding ?? 0) - (a.metrics?.outstanding ?? 0))
        .slice(0, 6)
        .map((b: any) => ({ name: (b.branchCode || b.branchName || "—").slice(0, 8), value: Math.round(b.metrics?.outstanding ?? 0) }));
      // Fallback: global finance position when no per-entity outstanding exists.
      const fallback = [
        { name: "Collected", value: Math.round(k.collected ?? 0) },
        { name: "Outstanding", value: Math.round(k.outstanding ?? 0) },
        { name: "Expenses", value: Math.round(k.totalExpenses ?? 0) },
        { name: "Refunds", value: Math.round(k.totalRefunded ?? 0) },
      ];
      return {
        title: isVertical ? "Outstanding by Vertical" : "Outstanding by Branch",
        data: byOutstanding.length > 0 ? byOutstanding : fallback,
      };
    }
    case "cto": {
      const t = d.tech ?? {};
      return {
        title: "Platform Mix",
        data: [
          { name: "API Keys", value: t.activeApiKeys ?? 0 },
          { name: "Webhooks", value: t.activeWebhooks ?? 0 },
          { name: "Failed Jobs", value: t.failedJobsCount ?? 0 },
          { name: "SLA Breaches", value: t.slaBreaches ?? 0 },
        ],
      };
    }
    case "cmo": {
      const c = d.crmWidget ?? {};
      const s = c.stageDistribution ?? {};
      const data = [
        { name: "New", value: s.new ?? 0 },
        { name: "Qualified", value: s.qualified ?? 0 },
        { name: "Trial", value: s.trial ?? 0 },
        { name: "Converted", value: s.converted ?? 0 },
      ];
      return { title: "Lead Stages", data };
    }
    case "cko": {
      const x = d.exam ?? {};
      return {
        title: "Exam Sessions",
        data: [
          { name: "Draft", value: x.draftSessions ?? 0 },
          { name: "Scheduled", value: x.scheduledSessions ?? 0 },
          { name: "In Progress", value: x.inProgressSessions ?? 0 },
          { name: "Completed", value: x.completedSessions ?? 0 },
        ],
      };
    }
    case "coo": {
      const o = d.ops ?? {};
      const a = o.approvals ?? {};
      return {
        title: "Approval Status",
        data: [
          { name: "Pending", value: a.pending ?? 0 },
          { name: "Approved", value: a.approved ?? 0 },
          { name: "Rejected", value: a.rejected ?? 0 },
        ],
      };
    }
    case "chro": {
      const e = d.empStats ?? {};
      return {
        title: "Employee Status",
        data: [
          { name: "Onboarding", value: e.onboarding ?? 0 },
          { name: "Probation", value: e.probation ?? 0 },
          { name: "Suspended", value: e.suspended ?? 0 },
          { name: "Resigned", value: e.resigned ?? 0 },
          { name: "Terminated", value: e.terminated ?? 0 },
        ],
      };
    }
    case "cpo": {
      const v = d.inv ?? {};
      const healthy = Math.max((v.activeItems ?? 0) - (v.lowStockCount ?? 0) - (v.outOfStockCount ?? 0), 0);
      return {
        title: "Stock Mix",
        data: [
          { name: "Healthy", value: healthy },
          { name: "Low", value: v.lowStockCount ?? 0 },
          { name: "Out", value: v.outOfStockCount ?? 0 },
        ],
      };
    }
    default:
      return { title: "Distribution", data: [] };
  }
}

// ─── Insights per role (derived from real numbers) ──────────────
interface Insight { text: string; type: "positive" | "negative" | "warning" }

function buildInsights(roleId: string, d: RoleData): Insight[] {
  const k = d.periodKpis ?? {};
  const out: Insight[] = [];
  switch (roleId) {
    case "cfo": {
      const cr = k.collectionRate ?? d.finance?.collectionRate ?? 0;
      if (cr < 70) out.push({ text: `Collection rate at ${cr}% — below the 70% health line.`, type: "warning" });
      else if (cr >= 90) out.push({ text: `Collection rate ${cr}% — strong cash collection this period.`, type: "positive" });
      if ((k.overdueAmount ?? 0) > 0) out.push({ text: `${fmtMoney(k.overdueAmount)} overdue this period — prioritize follow-up.`, type: "negative" });
      if ((d.finance?.pendingExpenses ?? 0) > 0) out.push({ text: `${d.finance.pendingExpenses} expenses awaiting approval.`, type: "warning" });
      if ((k.netRevenue ?? 0) > 0) out.push({ text: `Net revenue ${fmtMoney(k.netRevenue)} after refunds.`, type: "positive" });
      break;
    }
    case "cto": {
      const t = d.tech ?? {};
      if ((t.failedJobsCount ?? 0) > 0) out.push({ text: `${t.failedJobsCount} background job(s) failed — check release health.`, type: "negative" });
      if ((t.slaBreaches ?? 0) > 0) out.push({ text: `${t.slaBreaches} SLA breaches recorded.`, type: "warning" });
      if ((t.scopeViolations ?? 0) > 0) out.push({ text: `${t.scopeViolations} scope violations — review access control.`, type: "warning" });
      if ((t.activeApiKeys ?? 0) > 0) out.push({ text: `${t.activeApiKeys} active API keys and ${t.activeWebhooks ?? 0} webhooks healthy.`, type: "positive" });
      break;
    }
    case "cmo": {
      const c = d.crmWidget ?? {};
      const w = d.comms ?? {};
      if ((c.conversionRate ?? 0) < 5) out.push({ text: `Conversion rate ${c.conversionRate ?? 0}% — below 5% target.`, type: "warning" });
      if ((w.totalFailed ?? 0) > 0) out.push({ text: `${w.totalFailed} messages failed to deliver.`, type: "negative" });
      if ((c.admissions ?? 0) > 0) out.push({ text: `${c.admissions} admissions from leads this period.`, type: "positive" });
      if ((d.marketing?.activeJourneys ?? 0) > 0) out.push({ text: `${d.marketing.activeJourneys} active lead journeys running.`, type: "positive" });
      break;
    }
    case "cko": {
      const x = d.exam ?? {};
      const l = d.lms ?? {};
      if ((x.passRate ?? 0) < 60 && (x.totalResults ?? 0) > 0) out.push({ text: `Exam pass rate ${x.passRate}% — below 60% line.`, type: "warning" });
      if ((l.completionRate ?? 0) < 40 && (l.totalEnrolled ?? 0) > 0) out.push({ text: `LMS completion at ${l.completionRate}% — engagement focus needed.`, type: "warning" });
      if ((d.knowledge?.totalViews ?? 0) > 0) out.push({ text: `${fmtMoney(d.knowledge.totalViews)} knowledge views across ${d.knowledge.totalArticles ?? 0} articles.`, type: "positive" });
      if ((d.knowledge?.drafts ?? 0) > 0) out.push({ text: `${d.knowledge.drafts} draft articles pending publish.`, type: "warning" });
      break;
    }
    case "coo": {
      const o = d.ops ?? {};
      if ((o.tasks?.overdue ?? 0) > 0) out.push({ text: `${o.tasks.overdue} overdue tasks need attention.`, type: "negative" });
      if ((o.workflows?.failed ?? 0) > 0) out.push({ text: `${o.workflows.failed} failed workflows — inspect workflow monitor.`, type: "negative" });
      if ((o.workflows?.bottleneckCount ?? 0) > 0) out.push({ text: `${o.workflows.bottleneckCount} workflow(s) stuck >24h.`, type: "warning" });
      if ((o.sla?.openViolations ?? 0) > 0) out.push({ text: `${o.sla.openViolations} open SLA violations.`, type: "warning" });
      else out.push({ text: `No open SLA violations — operations healthy.`, type: "positive" });
      break;
    }
    case "chro": {
      const e = d.empStats ?? {};
      if ((e.onboarding ?? 0) > 0) out.push({ text: `${e.onboarding} employees onboarding — keep them engaged.`, type: "warning" });
      if ((e.probation ?? 0) > 0) out.push({ text: `${e.probation} employees in probation period.`, type: "warning" });
      if ((e.resigned ?? 0) > 0) out.push({ text: `${e.resigned} resignations recorded — review retention.`, type: "negative" });
      else out.push({ text: `${d.hr?.activeEmployees ?? 0} active employees across departments.`, type: "positive" });
      break;
    }
    case "cpo": {
      const v = d.inv ?? {};
      if ((v.outOfStockCount ?? 0) > 0) out.push({ text: `${v.outOfStockCount} items out of stock — urgent reorder.`, type: "negative" });
      if ((v.lowStockCount ?? 0) > 0) out.push({ text: `${v.lowStockCount} items low on stock.`, type: "warning" });
      if ((v.stockHealth ?? 100) >= 80) out.push({ text: `Stock health ${v.stockHealth}% — inventory in good shape.`, type: "positive" });
      break;
    }
    default:
      break;
  }
  if (out.length === 0) out.push({ text: "All key indicators within normal range.", type: "positive" });
  return out.slice(0, 4);
}

// ─── Module navigator links per role ─────────────────────────────
interface ModuleLinkDef {
  icon: React.ElementType;
  label: string;
  desc: string;
  href: string;
  accent: string;
}

const MODULE_LINKS: Record<string, ModuleLinkDef[]> = {
  cfo: [
    { icon: PiggyBank, label: "Finance", desc: "Invoices, PDC, refunds", href: "/finance", accent: "bg-[#34a853]" },
    { icon: CheckCircle2, label: "Collections", desc: "Payments & follow-ups", href: "/collections", accent: "bg-[#1a73e8]" },
    { icon: BarChart3, label: "Reports", desc: "Financial reporting", href: "/finance/reports", accent: "bg-[#a855f7]" },
    { icon: FileCheck, label: "PDC", desc: "Post-dated cheques", href: "/finance/pdc", accent: "bg-[#fbbc04]" },
    { icon: ArrowDownRight, label: "Refunds", desc: "Refund center", href: "/finance/refunds", accent: "bg-[#ea4335]" },
    { icon: Package, label: "Procurement", desc: "Vendors & inventory", href: "/procurement", accent: "bg-[#5f6368]" },
  ],
  cto: [
    { icon: Monitor, label: "Platform Studio", desc: "Developer intelligence", href: "/platform-studio", accent: "bg-[#1a73e8]" },
    { icon: AlertCircle, label: "Release Health", desc: "Deployments & jobs", href: "/release-health", accent: "bg-[#ea4335]" },
    { icon: Shield, label: "Security", desc: "Access & policies", href: "/security", accent: "bg-[#fbbc04]" },
    { icon: Activity, label: "Enterprise Health", desc: "System status", href: "/enterprise-health", accent: "bg-[#34a853]" },
    { icon: Zap, label: "Workflow Monitor", desc: "Pipelines & SLA", href: "/workflow-monitor", accent: "bg-[#a855f7]" },
    { icon: Users, label: "Users", desc: "User management", href: "/users", accent: "bg-[#4285f4]" },
  ],
  cmo: [
    { icon: Megaphone, label: "Marketing Hub", desc: "Campaigns & journeys", href: "/communication-marketing", accent: "bg-[#e8710a]" },
    { icon: Target, label: "Campaigns", desc: "Campaign manager", href: "/marketing/campaigns", accent: "bg-[#f29900]" },
    { icon: Users, label: "Leads", desc: "Lead database", href: "/crm/leads", accent: "bg-[#1a73e8]" },
    { icon: TrendingUp, label: "Sales", desc: "Opportunities & quotes", href: "/crm/sales", accent: "bg-[#34a853]" },
    { icon: BarChart3, label: "Analytics", desc: "Marketing analytics", href: "/marketing/analytics", accent: "bg-[#a855f7]" },
    { icon: Activity, label: "Channel Report", desc: "Comms delivery", href: "/communication-marketing", accent: "bg-[#5f6368]" },
  ],
  cko: [
    { icon: BookOpen, label: "Academic", desc: "Programs & batches", href: "/academic", accent: "bg-[#a855f7]" },
    { icon: GraduationCap, label: "Students", desc: "Student database", href: "/students", accent: "bg-[#4285f4]" },
    { icon: BookOpen, label: "LMS", desc: "Courses & lessons", href: "/lms", accent: "bg-[#1a73e8]" },
    { icon: Award, label: "Examinations", desc: "Sessions & results", href: "/examinations", accent: "bg-[#e8710a]" },
    { icon: Sparkles, label: "Knowledge", desc: "Knowledge base", href: "/knowledge", accent: "bg-[#f29900]" },
    { icon: Clock, label: "Attendance", desc: "Daily attendance", href: "/attendance", accent: "bg-[#34a853]" },
  ],
  coo: [
    { icon: ListChecks, label: "Tasks", desc: "Task management", href: "/tasks", accent: "bg-[#1a73e8]" },
    { icon: CheckCircle2, label: "Approvals", desc: "Approval center", href: "/approvals", accent: "bg-[#34a853]" },
    { icon: Calendar, label: "Scheduling", desc: "Timetables & rooms", href: "/scheduling", accent: "bg-[#e8710a]" },
    { icon: Zap, label: "Workflows", desc: "Automation & SLA", href: "/workflow-monitor", accent: "bg-[#a855f7]" },
    { icon: Activity, label: "Operations", desc: "Ops command center", href: "/operations", accent: "bg-[#5f6368]" },
    { icon: Users, label: "Messenger", desc: "DM & channels", href: "/messenger", accent: "bg-[#4285f4]" },
  ],
  chro: [
    { icon: Users, label: "Employees", desc: "Employee database", href: "/employees", accent: "bg-[#ec407a]" },
    { icon: UserPlus, label: "Recruiting", desc: "Positions & pipeline", href: "/recruiting", accent: "bg-[#4285f4]" },
    { icon: Users, label: "People", desc: "People registry", href: "/people", accent: "bg-[#34a853]" },
    { icon: Clock, label: "Calendar", desc: "Leave & birthdays", href: "/calendar", accent: "bg-[#fbbc04]" },
    { icon: AlertCircle, label: "HR Hub", desc: "HR dashboards", href: "/hr", accent: "bg-[#ea4335]" },
    { icon: Shield, label: "Users", desc: "User management", href: "/users", accent: "bg-[#5f6368]" },
  ],
  cpo: [
    { icon: ShoppingCart, label: "Procurement", desc: "Procurement hub", href: "/procurement", accent: "bg-[#5f6368]" },
    { icon: Package, label: "Inventory", desc: "Stock management", href: "/procurement/inventory", accent: "bg-[#fbbc04]" },
    { icon: Target, label: "Vendors", desc: "Vendor directory", href: "/procurement/vendors", accent: "bg-[#34a853]" },
    { icon: Monitor, label: "Assets", desc: "Asset register", href: "/procurement/assets", accent: "bg-[#4285f4]" },
    { icon: BarChart3, label: "Reports", desc: "Procurement reports", href: "/procurement", accent: "bg-[#a855f7]" },
    { icon: FileCheck, label: "PDC", desc: "Cheque management", href: "/finance/pdc", accent: "bg-[#e8710a]" },
  ],
  ceo: [
    { icon: PiggyBank, label: "Finance", desc: "Invoices, PDC, refunds", href: "/finance", accent: "bg-[#34a853]" },
    { icon: Users, label: "CRM & Leads", desc: "Pipeline, follow-ups", href: "/crm/leads", accent: "bg-[#1a73e8]" },
    { icon: TrendingUp, label: "Sales", desc: "Opportunities, quotes", href: "/crm/sales", accent: "bg-[#fbbc04]" },
    { icon: GraduationCap, label: "Students", desc: "360° profiles", href: "/students", accent: "bg-[#a855f7]" },
    { icon: BookOpen, label: "Academic", desc: "Programs, batches", href: "/academic", accent: "bg-[#e8710a]" },
    { icon: Users, label: "People", desc: "Registry & profiles", href: "/people", accent: "bg-[#4285f4]" },
    { icon: Award, label: "Examinations", desc: "Sessions & results", href: "/examinations", accent: "bg-[#1a73e8]" },
    { icon: BookOpen, label: "LMS", desc: "Courses & lessons", href: "/lms", accent: "bg-[#7c3aed]" },
    { icon: Package, label: "Procurement", desc: "Vendors, inventory", href: "/procurement", accent: "bg-[#0f9d58]" },
    { icon: Megaphone, label: "Marketing", desc: "Campaigns", href: "/marketing/campaigns", accent: "bg-[#f29900]" },
    { icon: Calendar, label: "Scheduling", desc: "Timetables & rooms", href: "/scheduling", accent: "bg-[#5f6368]" },
    { icon: Shield, label: "Security", desc: "Access & policies", href: "/security", accent: "bg-[#ea4335]" },
  ],
};

// ─── Widgets ─────────────────────────────────────────────────────
function PanelHeader({ icon: Icon, title, action, actionHref }: { icon: typeof Activity; title: string; action?: string; actionHref?: string }) {
  const { navigate } = useAppNavigate();
  return (
    <div className="px-4 py-3 border-b border-[#f1f3f4] flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-[#f1f3f4]">
          <Icon className="h-3.5 w-3.5 text-[#5f6368]" />
        </div>
        <h3 className="text-[13px] font-semibold text-[#1a1a2e]">{title}</h3>
      </div>
      {action && actionHref && (
        <button
          onClick={() => navigate(actionHref)}
          className="text-[11px] font-medium text-[#1a73e8] hover:text-[#1557b0] flex items-center gap-0.5 transition-colors"
        >
          {action} <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function KpiCard({ tile }: { tile: KpiTile }) {
  const { navigate } = useAppNavigate();
  const Icon = tile.icon;
  return (
    <button
      onClick={() => tile.onClick && navigate(tile.onClick)}
      className="bg-white rounded-xl border border-[#e8eaed] p-4 shadow-sm hover:shadow-md hover:border-[#dadce0] hover:-translate-y-0.5 transition-all duration-200 text-left group"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-[#5f6368] truncate">{tile.label}</p>
          <p className="text-[22px] font-bold text-[#1a1a2e] mt-1 tracking-tight">{tile.value}</p>
          <div className="flex items-center gap-2 mt-1">
            {tile.sub && <p className="text-[10px] text-[#9aa0a6] truncate">{tile.sub}</p>}
            {tile.trend !== undefined && (
              <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${tile.trendUp ? "text-[#34a853]" : "text-[#ea4335]"}`}>
                {tile.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {tile.trend}%
              </span>
            )}
          </div>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${tile.color} group-hover:scale-105 transition-transform`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </button>
  );
}

function TrendChart({ trend }: { trend: ReturnType<typeof buildTrend> }) {
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white">
      <PanelHeader icon={Activity} title={trend.title} action="Trends" actionHref="/analytics" />
      <CardContent className="p-4">
        {trend.data.length > 1 ? (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <AreaChart data={trend.data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                {trend.keys.map((k, i) => (
                  <linearGradient key={k} id={`execTrend${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={trend.colors[i % trend.colors.length]} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={trend.colors[i % trend.colors.length]} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#9aa0a6" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#9aa0a6" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, border: "1px solid #e8eaed" }} />
              {trend.keys.map((k, i) => (
                <Area key={k} type="monotone" dataKey={k} stroke={trend.colors[i % trend.colors.length]} fill={`url(#execTrend${k})`} strokeWidth={2} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[190px] flex items-center justify-center text-[11px] text-[#9aa0a6]">No trend data yet</div>
        )}
      </CardContent>
    </Card>
  );
}

function BarChartPanel({ bar }: { bar: ReturnType<typeof buildBar> }) {
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white">
      <PanelHeader icon={BarChart3} title={bar.title} action="Details" actionHref="/analytics" />
      <CardContent className="p-4">
        {bar.data.length > 0 ? (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={bar.data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#9aa0a6" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#9aa0a6" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, border: "1px solid #e8eaed" }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} fill={bar.color} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[190px] flex items-center justify-center text-[11px] text-[#9aa0a6]">No comparison data yet</div>
        )}
      </CardContent>
    </Card>
  );
}

function DonutPanel({ donut }: { donut: ReturnType<typeof buildDonut> }) {
  const total = donut.data.reduce((s, d) => s + d.value, 0);
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white">
      <PanelHeader icon={Target} title={donut.title} action="Details" actionHref="/analytics" />
      <CardContent className="p-4">
        {total > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <PieChart>
                <Pie
                  data={donut.data}
                  cx="50%" cy="50%" innerRadius={48} outerRadius={74}
                  paddingAngle={2} dataKey="value"
                >
                  {donut.data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, border: "1px solid #e8eaed" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-1">
              {donut.data.filter((d) => d.value > 0).map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1.5 text-[#5f6368]">
                    <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {d.name}
                  </span>
                  <span className="font-semibold text-[#1a1a2e]">{d.value}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-[190px] flex items-center justify-center text-[11px] text-[#9aa0a6]">No distribution data yet</div>
        )}
      </CardContent>
    </Card>
  );
}

function InsightsPanel({ insights }: { insights: Insight[] }) {
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white">
      <PanelHeader icon={Sparkles} title="Derived Insights" action="AI" actionHref="/analytics" />
      <CardContent className="p-3 space-y-1.5">
        {insights.map((ins, i) => (
          <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${
            ins.type === "positive" ? "bg-[#e6f4ea]" : ins.type === "negative" ? "bg-[#fce8e6]" : "bg-[#fef7e0]"
          }`}>
            {ins.type === "positive"
              ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#34a853]" />
              : ins.type === "negative"
              ? <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[#ea4335]" />
              : <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[#fbbc04]" />}
            <p className="text-[10px] text-[#1a1a2e]">{ins.text}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ScoreRing({ score, size = 84 }: { score: number; size?: number }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(Math.max(score, 0), 100) / 100) * c;
  const color = score >= 75 ? "#34a853" : score >= 50 ? "#fbbc04" : "#ea4335";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f3f4" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[20px] font-bold text-[#1a1a2e] leading-none">{score}</span>
        <span className="text-[9px] text-[#9aa0a6] mt-0.5">Score</span>
      </div>
    </div>
  );
}

function ScorecardPanel({ scorecard }: { scorecard: any }) {
  const categories = useMemo(() => {
    if (!scorecard?.scorecard) return [];
    return Object.entries(scorecard.scorecard as Record<string, any>).map(([cat, val]: any) => ({
      category: cat,
      score: val?.score ?? 0,
      metricCount: val?.metrics?.length ?? 0,
    }));
  }, [scorecard]);

  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white">
      <PanelHeader icon={Award} title="Executive Scorecard" action="KPI Studio" actionHref="/studios/master-data" />
      <CardContent className="p-4">
        <div className="flex items-center gap-4 mb-3">
          <ScoreRing score={scorecard?.overallScore ?? 0} />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-[#5f6368]">
              Period:{" "}
              <span className="font-medium text-[#1a1a2e]">
                {scorecard?.period
                  ? new Date(scorecard.period + "-01").toLocaleDateString("en", { month: "short", year: "numeric" })
                  : "—"}
              </span>
            </p>
            <p className="text-[10px] text-[#9aa0a6] mt-1">
              {scorecard?.gradedKpis ?? 0} active KPIs graded across {categories.length} categories
            </p>
          </div>
        </div>
        <div className="space-y-2.5">
          {categories.slice(0, 4).map((c) => (
            <div key={c.category}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-[#5f6368] capitalize">{c.category}</span>
                <span className="text-[10px] font-semibold text-[#1a1a2e]">{c.score}</span>
              </div>
              <div className="h-1.5 bg-[#f1f3f4] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    c.score >= 75 ? "bg-[#34a853]" : c.score >= 50 ? "bg-[#fbbc04]" : "bg-[#ea4335]"
                  }`}
                  style={{ width: `${Math.min(c.score, 100)}%` }}
                />
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-[10px] text-[#9aa0a6] text-center py-3">No KPI categories configured yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LeaderboardPanel({
  leaderboard, metric, onMetricChange,
}: {
  leaderboard: any[];
  metric: LeaderMetric;
  onMetricChange: (m: LeaderMetric) => void;
}) {
  const { navigate } = useAppNavigate();
  const sorted = [...leaderboard].sort((a: any, b: any) => b.score - a.score);
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white">
      <PanelHeader icon={TrendingUp} title="Top Performers" action="People" actionHref="/people" />
      <CardContent className="p-3">
        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-[#f1f3f4] border border-[#e8eaed] mb-2.5">
          {LEADER_METRICS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => onMetricChange(opt.key)}
              className={`h-6 px-2.5 rounded-md text-[10px] font-medium transition-all duration-150 ${
                metric === opt.key ? "bg-white shadow-sm text-[#1a1a2e]" : "text-[#5f6368] hover:text-[#1a1a2e]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="divide-y divide-[#f1f3f4]">
          {sorted.length > 0 ? (
            sorted.slice(0, 5).map((p: any, i: number) => (
              <button
                key={i}
                onClick={() => navigate(`/people`)}
                className="w-full py-2 flex items-center gap-2.5 text-left hover:bg-[#f8f9fa] transition-colors rounded-md px-1"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                    MEDAL_COLORS[i] || "bg-[#f1f3f4] text-[#5f6368]"
                  }`}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-[#1a1a2e] truncate">{p.name}</p>
                  <p className="text-[9px] text-[#9aa0a6]">{p.label}</p>
                </div>
                <span className="text-[11px] font-bold text-[#1a1a2e]">{Math.round(p.score).toLocaleString()}</span>
              </button>
            ))
          ) : (
            <p className="text-[10px] text-[#9aa0a6] py-6 text-center">No performer data yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TasksPanel({ tasks, roleId }: { tasks: any[]; roleId: string }) {
  const { navigate } = useAppNavigate();
  const pending = tasks.filter((t: any) => !["done", "completed", "cancelled", "archived"].includes(t.status));
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white">
      <PanelHeader icon={ListChecks} title="Open Tasks" action="All Tasks" actionHref="/tasks" />
      <CardContent className="px-3 pb-3 max-h-[320px] overflow-y-auto divide-y divide-[#f1f3f4]">
        {pending.length > 0 ? pending.slice(0, 6).map((t, i) => (
          <button key={i} onClick={() => navigate(`/tasks/${t._id}`)} className="w-full py-2.5 flex items-start gap-2.5 hover:bg-[#f8f9fa] transition-colors text-left">
            <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
              ["in_progress", "open", "pending"].includes(t.status) ? "bg-[#fbbc04]" : t.priority === "high" || t.priority === "critical" ? "bg-[#ea4335]" : "bg-[#4285f4]"
            }`} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-[#1a1a2e] truncate">{t.title}</p>
              <p className="text-[9px] text-[#9aa0a6] mt-0.5 capitalize">
                {t.priority || "normal"}{t.dueDate ? ` · due ${new Date(t.dueDate).toLocaleDateString("en", { month: "short", day: "numeric" })}` : ""}
              </p>
            </div>
            <span className="text-[9px] text-[#9aa0a6] capitalize shrink-0">{t.status?.replace(/_/g, " ")}</span>
          </button>
        )) : (
          <p className="text-[10px] text-[#9aa0a6] py-6 text-center">No open tasks · {roleId.toUpperCase()} clear</p>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityPanel({ activities }: { activities: any[] }) {
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white">
      <PanelHeader icon={Activity} title="Recent Activity" action="Timeline" actionHref="/workflow-monitor" />
      <CardContent className="px-3 pb-3 max-h-[320px] overflow-y-auto divide-y divide-[#f1f3f4]">
        {activities.length > 0 ? activities.slice(0, 7).map((a: any, i: number) => (
          <div key={i} className="py-2.5 flex items-start gap-2.5">
            <div className="mt-1 w-5 h-5 rounded-full bg-[#e8f0fe] flex items-center justify-center shrink-0">
              <Activity className="h-2.5 w-2.5 text-[#1a73e8]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-[#1a1a2e] truncate">{a.description || a.eventType || a.action || "Activity"}</p>
              <p className="text-[9px] text-[#9aa0a6] mt-0.5">
                {a.createdAt ? new Date(a.createdAt).toLocaleString("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : ""}
              </p>
            </div>
          </div>
        )) : (
          <p className="text-[10px] text-[#9aa0a6] py-6 text-center">No recent activity</p>
        )}
      </CardContent>
    </Card>
  );
}

function NotificationsPanel({ notifications }: { notifications: any[] }) {
  const unread = notifications.filter((n: any) => !n.isRead);
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white">
      <PanelHeader icon={Bell} title="Notifications" action="View All" actionHref="/notifications" />
      <CardContent className="px-3 pb-3 max-h-[320px] overflow-y-auto divide-y divide-[#f1f3f4]">
        {unread.length > 0 ? unread.slice(0, 5).map((n, i) => (
          <div key={i} className="py-2.5 flex items-start gap-2.5">
            <div className="mt-0.5 w-2 h-2 rounded-full bg-[#ea4335] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-[#1a1a2e] truncate">{n.title}</p>
              <p className="text-[9px] text-[#9aa0a6] mt-0.5">{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ""}</p>
            </div>
          </div>
        )) : (
          <p className="text-[10px] text-[#9aa0a6] py-6 text-center">All caught up</p>
        )}
      </CardContent>
    </Card>
  );
}

function ModuleNavigator({ roleId }: { roleId: string }) {
  const { navigate } = useAppNavigate();
  const links = MODULE_LINKS[roleId] ?? MODULE_LINKS.ceo;
  return (
    <div className="bg-white rounded-xl border border-[#e8eaed] shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#f1f3f4]">
            <LayoutDashboard className="h-3.5 w-3.5 text-[#5f6368]" />
          </div>
          <h3 className="text-[13px] font-semibold text-[#1a1a2e]">Module Navigator</h3>
        </div>
        <span className="text-[10px] text-[#9aa0a6]">{roleId.toUpperCase()} quick access</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {links.map((link) => (
          <button
            key={link.label}
            onClick={() => navigate(link.href)}
            className="group flex items-center gap-3 p-3 rounded-xl border border-[#e8eaed] bg-white hover:shadow-md hover:border-[#dadce0] hover:-translate-y-0.5 transition-all duration-200 text-left"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${link.accent} group-hover:scale-105 transition-transform`}>
              <link.icon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-[#1a1a2e]">{link.label}</p>
              <p className="text-[10px] text-[#9aa0a6] truncate">{link.desc}</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#dadce0] group-hover:text-[#1a73e8] group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2"><div className="h-6 w-52 bg-[#f1f3f4] rounded-md animate-pulse" /><div className="h-4 w-72 bg-[#f1f3f4] rounded-md animate-pulse" /></div>
        <div className="h-8 w-64 bg-[#f1f3f4] rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[104px] bg-[#f1f3f4] rounded-xl animate-pulse" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-64 bg-[#f1f3f4] rounded-xl animate-pulse" /><div className="h-64 bg-[#f1f3f4] rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────
interface ExecutiveDashboardProps {
  dashboardId: string;
}

export default function ExecutiveDashboard({ dashboardId }: ExecutiveDashboardProps) {
  const { navigate } = useAppNavigate();
  const config = getDashboardConfig(dashboardId);

  const [period, setPeriod] = useState<PeriodKey>(() => loadSavedPeriod(dashboardId));
  const [months, setMonths] = useState<MonthKey>(() => loadSavedMonths(dashboardId));
  const [leaderMetric, setLeaderMetric] = useState<LeaderMetric>(() => loadSavedLeaderMetric(dashboardId));
  const [dimension, setDimension] = useState<DimensionKey>(() => loadSavedDimension(dashboardId));
  const periodLabel = PERIOD_OPTIONS.find((p) => p.key === period)?.label ?? "Period";
  const dimensionLabel = DIMENSION_OPTIONS.find((o) => o.key === dimension)?.label.toLowerCase() ?? "branch";

  // Persist the selected filters per role so they survive navigation and reloads
  useEffect(() => {
    try {
      window.localStorage.setItem(periodStorageKey(dashboardId), period);
      window.localStorage.setItem(monthsStorageKey(dashboardId), String(months));
      window.localStorage.setItem(leaderStorageKey(dashboardId), leaderMetric);
      window.localStorage.setItem(dimensionStorageKey(dashboardId), dimension);
    } catch {
      // storage unavailable — filters still work for this session
    }
  }, [period, months, leaderMetric, dimension, dashboardId]);

  const d = useRoleData(dashboardId, period, months, leaderMetric, dimension);

  const isLoading = !d.overview || !d.periodKpis || !d.trends;

  const kpis = useMemo(() => buildKpis(dashboardId, d, periodLabel), [dashboardId, d, periodLabel]);
  const trend = useMemo(() => buildTrend(dashboardId, d), [dashboardId, d]);
  const bar = useMemo(() => buildBar(dashboardId, d, dimension), [dashboardId, d, dimension]);
  const donut = useMemo(() => buildDonut(dashboardId, d, dimension), [dashboardId, d, dimension]);
  const insights = useMemo(() => buildInsights(dashboardId, d), [dashboardId, d]);

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <LayoutDashboard className="h-10 w-10 text-[#9aa0a6] mb-3" />
        <h2 className="text-base font-semibold text-[#1a1a2e]">Dashboard Not Found</h2>
        <p className="text-[13px] text-[#5f6368] mt-1">No configuration for role: {dashboardId}</p>
      </div>
    );
  }

  if (isLoading) return <DashboardSkeleton />;

  const unreadNotifs = d.notifications.filter((n: any) => !n.isRead).length;
  const pendingTasks = d.tasks.filter((t: any) => !["done", "completed", "cancelled", "archived"].includes(t.status)).length;

  const strip = [
    { icon: Landmark, label: "Companies", value: d.overview?.companies ?? 0, color: "bg-[#e8f0fe] text-[#1a73e8]" },
    { icon: Building2, label: "Branches", value: d.overview?.branches ?? 0, color: "bg-[#e6f4ea] text-[#34a853]" },
    { icon: Users, label: "Active Users", value: d.overview?.activeUsers ?? 0, color: "bg-[#f3e8ff] text-[#a855f7]" },
    { icon: Bell, label: "Unread Alerts", value: unreadNotifs, color: "bg-[#fce8e6] text-[#ea4335]" },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl shadow-sm ${config.color}`}>
            <config.icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-[#1a1a2e]">{config.title}</h1>
            <p className="text-[12px] text-[#5f6368] mt-0.5">
              {new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · {config.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-[#1a1a2e] text-[#1a1a2e] font-medium">
            {config.role.toUpperCase()} Access
          </Badge>
          <button
            onClick={() => navigate("/analytics")}
            className="h-8 px-3 rounded-lg border border-[#e8eaed] bg-white text-[#1a1a2e] text-[11px] font-medium hover:bg-[#f8f9fa] transition-colors flex items-center gap-1.5"
          >
            <BarChart3 className="h-3.5 w-3.5 text-[#1a73e8]" /> Full Analytics
          </button>
        </div>
      </div>

      {/* ─── Period + trend-window selectors ────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[13px] font-semibold text-[#1a1a2e]">Performance Matrix</h2>
          <p className="text-[11px] text-[#9aa0a6] mt-0.5">
            {config.role.toUpperCase()} KPIs for {periodLabel.toLowerCase()} · {months}-month trends{dashboardId === "cfo" ? ` · ${dimensionLabel} split` : ""} — switches in real time
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {dashboardId === "cfo" && (
            <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-[#f1f3f4] border border-[#e8eaed]">
              <span className="h-7 px-2 flex items-center text-[9px] font-semibold text-[#9aa0a6] uppercase tracking-wide">Split</span>
              {DIMENSION_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setDimension(opt.key)}
                  className={`h-7 px-3 rounded-md text-[11px] font-medium transition-all duration-150 ${
                    dimension === opt.key ? "bg-white shadow-sm text-[#1a1a2e]" : "text-[#5f6368] hover:text-[#1a1a2e]"
                  }`}
                  title={`Compare revenue & outstanding by ${opt.label.toLowerCase()}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-[#f1f3f4] border border-[#e8eaed]">
            {MONTH_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setMonths(opt.key)}
                className={`h-7 px-3 rounded-md text-[11px] font-medium transition-all duration-150 ${
                  months === opt.key ? "bg-white shadow-sm text-[#1a1a2e]" : "text-[#5f6368] hover:text-[#1a1a2e]"
                }`}
                title={`Show last ${opt.key} months in trend charts`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-[#f1f3f4] border border-[#e8eaed]">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setPeriod(opt.key)}
                className={`h-7 px-3 rounded-md text-[11px] font-medium transition-all duration-150 ${
                  period === opt.key ? "bg-white shadow-sm text-[#1a1a2e]" : "text-[#5f6368] hover:text-[#1a1a2e]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── KPI matrix ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((tile, i) => <KpiCard key={i} tile={tile} />)}
      </div>

      {/* ─── Secondary strip ────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {strip.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-[#e8eaed] p-3 flex items-center gap-3 shadow-sm">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[16px] font-bold text-[#1a1a2e] leading-none">{c.value}</p>
                <p className="text-[10px] text-[#5f6368] mt-0.5">{c.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Charts row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TrendChart trend={trend} />
        <BarChartPanel bar={bar} />
        <DonutPanel donut={donut} />
      </div>

      {/* ─── Insights + Tasks + Activity ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <InsightsPanel insights={insights} />
        <TasksPanel tasks={d.tasks} roleId={dashboardId} />
        <ActivityPanel activities={d.activities} />
      </div>

      {/* ─── Scorecard + Leaderboard + Notifications ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ScorecardPanel scorecard={d.scorecard} />
        <LeaderboardPanel leaderboard={d.leaderboard} metric={leaderMetric} onMetricChange={setLeaderMetric} />
        <NotificationsPanel notifications={d.notifications} />
      </div>

      {/* ─── Quick actions ──────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#e8eaed] shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#f1f3f4]">
              <Zap className="h-3.5 w-3.5 text-[#5f6368]" />
            </div>
            <h3 className="text-[13px] font-semibold text-[#1a1a2e]">Quick Actions</h3>
          </div>
          <span className="text-[10px] text-[#9aa0a6]">{pendingTasks} open tasks · {kpis.length} KPIs tracked</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {config.quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => navigate(action.href)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#e8eaed] bg-white hover:shadow-md hover:border-[#dadce0] hover:-translate-y-0.5 transition-all duration-200 text-left group"
            >
              <div className={`p-1.5 rounded-lg ${action.color} shrink-0`}>
                <action.icon className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-[#1a1a2e] truncate">{action.label}</p>
                {action.description && <p className="text-[9px] text-[#9aa0a6] truncate">{action.description}</p>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Module navigator ───────────────────────────────── */}
      <ModuleNavigator roleId={dashboardId} />
    </div>
  );
}
