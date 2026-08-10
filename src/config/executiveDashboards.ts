/**
 * Executive Dashboards Configuration
 *
 * Single source of truth for all role-based executive dashboards.
 * Every dashboard is a configuration of reusable widgets.
 *
 * Architecture:
 *   ExecutiveDashboard (renderer)
 *        ↓
 *   Dashboard Config (this file)
 *        ↓
 *   Widget Config → KPI Card | Chart | Table | Activity | Calendar
 *        ↓
 *   Analytics Platform (dashboardProviders)
 *        ↓
 *   Platform SDK
 */

import type { LucideIcon } from "lucide-react";
import {
  BarChart3, TrendingUp, DollarSign, Users, GraduationCap,
  Building, FileCheck, BookOpen, Package, Truck, Target,
  Activity, Calendar, Bell, ListChecks, Clock,
  CheckCircle2, UserPlus, Zap, ShoppingCart,
  LineChart, PieChart, Megaphone,
  Monitor, Settings, Shield, Database, LayoutDashboard,
  Sparkles,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

export type WidgetSize = "small" | "medium" | "large" | "full";

export type WidgetType =
  | "kpi_card"
  | "chart_bar"
  | "chart_pie"
  | "chart_line"
  | "chart_area"
  | "chart_donut"
  | "recent_activity"
  | "tasks"
  | "notifications"
  | "calendar"
  | "timeline"
  | "leaderboard"
  | "quick_actions"
  | "insights"
  | "top_performers"
  | "distribution"
  | "trend"
  | "system_health";

export interface WidgetDefinition {
  type: WidgetType;
  label: string;
  icon: LucideIcon;
  sizes: WidgetSize[];
  description: string;
  category: "metrics" | "charts" | "activity" | "productivity" | "system" | "insights";
  defaultSize: WidgetSize;
  /** Module data source this widget consumes */
  dataSource?: string;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  dataSource?: string;
  config?: Record<string, unknown>;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  color: string;
  description: string;
}

export interface DashboardConfig {
  id: string;
  role: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  widgets: DashboardWidget[];
  quickActions: QuickAction[];
  landingRoute?: string;
  permissionScope: string;
}

// ─── Widget Registry ─────────────────────────────────────────────

export const WIDGET_REGISTRY: Record<WidgetType, WidgetDefinition> = {
  kpi_card: { type: "kpi_card", label: "KPI Card", icon: Target, sizes: ["small", "medium"], description: "Single metric with trend indicator", category: "metrics", defaultSize: "small" },
  chart_bar: { type: "chart_bar", label: "Bar Chart", icon: BarChart3, sizes: ["medium", "large"], description: "Comparison bar chart", category: "charts", defaultSize: "medium" },
  chart_pie: { type: "chart_pie", label: "Pie Chart", icon: PieChart, sizes: ["medium", "large"], description: "Distribution pie/donut chart", category: "charts", defaultSize: "medium" },
  chart_line: { type: "chart_line", label: "Line Chart", icon: TrendingUp, sizes: ["medium", "large"], description: "Trend line chart", category: "charts", defaultSize: "medium" },
  chart_area: { type: "chart_area", label: "Area Chart", icon: LineChart, sizes: ["medium", "large", "full"], description: "Area trend chart with fill", category: "charts", defaultSize: "medium" },
  chart_donut: { type: "chart_donut", label: "Donut Chart", icon: PieChart, sizes: ["medium", "large"], description: "Donut distribution chart", category: "charts", defaultSize: "medium" },
  recent_activity: { type: "recent_activity", label: "Recent Activity", icon: Activity, sizes: ["medium", "large", "full"], description: "Live platform activity feed", category: "activity", defaultSize: "medium" },
  tasks: { type: "tasks", label: "Tasks", icon: ListChecks, sizes: ["small", "medium", "large"], description: "Task list with status", category: "productivity", defaultSize: "medium" },
  notifications: { type: "notifications", label: "Notifications", icon: Bell, sizes: ["small", "medium"], description: "Recent notifications", category: "activity", defaultSize: "small" },
  calendar: { type: "calendar", label: "Calendar", icon: Calendar, sizes: ["medium", "large"], description: "Upcoming events and schedule", category: "productivity", defaultSize: "medium" },
  timeline: { type: "timeline", label: "Timeline", icon: Clock, sizes: ["medium", "large", "full"], description: "Event timeline stream", category: "activity", defaultSize: "medium" },
  leaderboard: { type: "leaderboard", label: "Top Performers", icon: TrendingUp, sizes: ["small", "medium"], description: "Ranked performance list", category: "insights", defaultSize: "small" },
  quick_actions: { type: "quick_actions", label: "Quick Actions", icon: Zap, sizes: ["small", "medium"], description: "Frequent actions toolbar", category: "productivity", defaultSize: "small" },
  insights: { type: "insights", label: "Insights", icon: Sparkles, sizes: ["medium", "large"], description: "AI-ready insight cards", category: "insights", defaultSize: "medium" },
  top_performers: { type: "top_performers", label: "Top Performers", icon: TrendingUp, sizes: ["small", "medium"], description: "Ranked top entities", category: "insights", defaultSize: "small" },
  distribution: { type: "distribution", label: "Distribution", icon: PieChart, sizes: ["medium", "large"], description: "Data distribution grid", category: "charts", defaultSize: "medium" },
  trend: { type: "trend", label: "Trend", icon: TrendingUp, sizes: ["small", "medium"], description: "Compact trend with growth %", category: "charts", defaultSize: "small" },
  system_health: { type: "system_health", label: "System Health", icon: Monitor, sizes: ["medium", "large"], description: "Platform status and health", category: "system", defaultSize: "medium" },
};

// ─── Dashboard Configurations ────────────────────────────────────

/** CEO Dashboard — Full enterprise command center */
export const CEO_DASHBOARD: DashboardConfig = {
  id: "ceo",
  role: "super_admin",
  title: "CEO Command Center",
  subtitle: "Enterprise-wide performance overview and strategic insights",
  icon: LayoutDashboard,
  color: "bg-[#1a1a2e]",
  permissionScope: "super_admin",
  landingRoute: "/control",
  quickActions: [
    { id: "platform-studio", label: "Platform Studio", icon: Settings, href: "/platform-studio", color: "bg-[#1a73e8]", description: "Developer intelligence" },
    { id: "org-studio", label: "Organization", icon: Building, href: "/studio/org", color: "bg-[#34a853]", description: "Hierarchy management" },
    { id: "analytics", label: "Analytics", icon: BarChart3, href: "/analytics", color: "bg-[#a855f7]", description: "Deep insights" },
    { id: "people", label: "People", icon: Users, href: "/people", color: "bg-[#4285f4]", description: "Registry" },
    { id: "approvals", label: "Approvals", icon: CheckCircle2, href: "/approvals", color: "bg-[#e8710a]", description: "Pending approvals" },
    { id: "broadcast", label: "Broadcast", icon: Megaphone, href: "/control", color: "bg-[#ea4335]", description: "Announcement" },
  ],
  widgets: [
    // Row 1: Executive KPIs
    { id: "w-revenue", type: "kpi_card", title: "Revenue (AED)", size: "small", dataSource: "finance" },
    { id: "w-collections", type: "kpi_card", title: "Collections", size: "small", dataSource: "finance" },
    { id: "w-students", type: "kpi_card", title: "Students", size: "small", dataSource: "students" },
    { id: "w-leads", type: "kpi_card", title: "Leads", size: "small", dataSource: "crm" },
    { id: "w-employees", type: "kpi_card", title: "Employees", size: "small", dataSource: "hr" },
    { id: "w-attendance", type: "kpi_card", title: "Attendance %", size: "small", dataSource: "students" },
    { id: "w-exams", type: "kpi_card", title: "Exams", size: "small", dataSource: "examinations" },
    { id: "w-courses", type: "kpi_card", title: "LMS Courses", size: "small", dataSource: "lms" },
    // Row 2: Charts + Activity
    { id: "w-revenue-chart", type: "chart_bar", title: "Revenue Trend", size: "medium", dataSource: "finance" },
    { id: "w-lead-chart", type: "chart_pie", title: "Lead Distribution", size: "medium", dataSource: "crm" },
    { id: "w-activity", type: "recent_activity", title: "Platform Activity", size: "large", dataSource: "events" },
    // Row 3: More charts + lists
    { id: "w-attendance-chart", type: "chart_line", title: "Attendance Trend", size: "medium", dataSource: "students" },
    { id: "w-exam-chart", type: "chart_bar", title: "Exam Results", size: "medium", dataSource: "examinations" },
    { id: "w-tasks", type: "tasks", title: "Pending Tasks", size: "medium", dataSource: "tasks" },
    { id: "w-notifications", type: "notifications", title: "Notifications", size: "small", dataSource: "notifications" },
    { id: "w-insights", type: "insights", title: "Executive Insights", size: "medium", dataSource: "analytics" },
    // Row 4: System + timeline
    { id: "w-system-health", type: "system_health", title: "System Health", size: "medium" },
    { id: "w-timeline", type: "timeline", title: "Event Timeline", size: "medium", dataSource: "timeline" },
    { id: "w-top-performers", type: "top_performers", title: "Top Branches", size: "small", dataSource: "analytics" },
  ],
};

/** COO Dashboard — Operations focus */
export const COO_DASHBOARD: DashboardConfig = {
  id: "coo",
  role: "coo",
  title: "COO Operations Dashboard",
  subtitle: "Daily operations, branch performance, and task completion",
  icon: Activity,
  color: "bg-[#e8710a]",
  permissionScope: "admin",
  landingRoute: "/executive/coo",
  quickActions: [
    { id: "tasks", label: "All Tasks", icon: ListChecks, href: "/tasks", color: "bg-[#1a73e8]", description: "Task management" },
    { id: "calendar", label: "Calendar", icon: Calendar, href: "/calendar", color: "bg-[#fbbc04]", description: "Schedule" },
    { id: "students", label: "Students", icon: GraduationCap, href: "/students", color: "bg-[#a855f7]", description: "Student database" },
    { id: "employees", label: "Employees", icon: Users, href: "/employees", color: "bg-[#34a853]", description: "Employee database" },
  ],
  widgets: [
    { id: "w-attendance-kpi", type: "kpi_card", title: "Attendance %", size: "small", dataSource: "students" },
    { id: "w-tasks-kpi", type: "kpi_card", title: "Pending Tasks", size: "small", dataSource: "tasks" },
    { id: "w-students-kpi", type: "kpi_card", title: "Active Students", size: "small", dataSource: "students" },
    { id: "w-branches-kpi", type: "kpi_card", title: "Branches", size: "small", dataSource: "organization" },
    { id: "w-branch-chart", type: "chart_bar", title: "Branch Performance", size: "medium", dataSource: "analytics" },
    { id: "w-attendance-chart", type: "chart_line", title: "Attendance Trend", size: "medium", dataSource: "students" },
    { id: "w-activity-feed", type: "recent_activity", title: "Operations Activity", size: "large" },
    { id: "w-calendar", type: "calendar", title: "Upcoming Schedule", size: "medium" },
    { id: "w-tasks-list", type: "tasks", title: "Department Tasks", size: "medium", dataSource: "tasks" },
    { id: "w-notifications", type: "notifications", title: "Alerts", size: "small", dataSource: "notifications" },
    { id: "w-trend", type: "trend", title: "Operations Trend", size: "small", dataSource: "analytics" },
  ],
};

/** CFO Dashboard — Finance & accounting */
export const CFO_DASHBOARD: DashboardConfig = {
  id: "cfo",
  role: "cfo",
  title: "CFO Financial Dashboard",
  subtitle: "Revenue, cash flow, expenses, and financial health",
  icon: DollarSign,
  color: "bg-[#34a853]",
  permissionScope: "admin",
  landingRoute: "/executive/cfo",
  quickActions: [
    { id: "finance", label: "Finance", icon: DollarSign, href: "/finance", color: "bg-[#34a853]", description: "Finance dashboard" },
    { id: "invoices", label: "Invoices", icon: FileCheck, href: "/finance", color: "bg-[#4285f4]", description: "Invoice management" },
    { id: "reports", label: "Reports", icon: BarChart3, href: "/finance/reports", color: "bg-[#a855f7]", description: "Financial reports" },
    { id: "budget", label: "Budget", icon: Target, href: "/finance", color: "bg-[#e8710a]", description: "Budget tracking" },
  ],
  widgets: [
    { id: "w-revenue", type: "kpi_card", title: "Total Revenue", size: "small", dataSource: "finance" },
    { id: "w-collected", type: "kpi_card", title: "Collected", size: "small", dataSource: "finance" },
    { id: "w-outstanding", type: "kpi_card", title: "Outstanding", size: "small", dataSource: "finance" },
    { id: "w-expenses", type: "kpi_card", title: "Expenses", size: "small", dataSource: "finance" },
    { id: "w-profit", type: "kpi_card", title: "Net Profit", size: "small", dataSource: "finance" },
    { id: "w-pending-invoices", type: "kpi_card", title: "Pending Invoices", size: "small", dataSource: "finance" },
    { id: "w-revenue-chart", type: "chart_area", title: "Revenue Trend", size: "large", dataSource: "finance" },
    { id: "w-expense-chart", type: "chart_bar", title: "Expense Breakdown", size: "medium", dataSource: "finance" },
    { id: "w-cashflow", type: "chart_line", title: "Cash Flow", size: "medium", dataSource: "finance" },
    { id: "w-budget-chart", type: "chart_donut", title: "Budget Utilization", size: "medium", dataSource: "finance" },
    { id: "w-recent-transactions", type: "recent_activity", title: "Recent Transactions", size: "medium", dataSource: "finance" },
    { id: "w-alerts", type: "notifications", title: "Financial Alerts", size: "small", dataSource: "notifications" },
    { id: "w-financial-insights", type: "insights", title: "Financial Insights", size: "medium", dataSource: "analytics" },
  ],
};

/** CTO Dashboard — Technology & platform */
export const CTO_DASHBOARD: DashboardConfig = {
  id: "cto",
  role: "cto",
  title: "CTO Technology Dashboard",
  subtitle: "Platform health, security, and infrastructure monitoring",
  icon: Monitor,
  color: "bg-[#1a73e8]",
  permissionScope: "admin",
  landingRoute: "/executive/cto",
  quickActions: [
    { id: "platform", label: "Platform Studio", icon: Settings, href: "/platform-studio", color: "bg-[#1a73e8]", description: "Developer tools" },
    { id: "access", label: "Access Control", icon: Shield, href: "/studio/access", color: "bg-[#5f6368]", description: "Security" },
    { id: "audit", label: "Audit Log", icon: Database, href: "/access", color: "bg-[#34a853]", description: "Audit trail" },
    { id: "users", label: "Users", icon: Users, href: "/users", color: "bg-[#4285f4]", description: "User management" },
  ],
  widgets: [
    { id: "w-system", type: "system_health", title: "System Status", size: "large" },
    { id: "w-users", type: "kpi_card", title: "Active Users", size: "small", dataSource: "users" },
    { id: "w-storage", type: "kpi_card", title: "Storage Used", size: "small", dataSource: "system" },
    { id: "w-api", type: "kpi_card", title: "API Calls (24h)", size: "small", dataSource: "system" },
    { id: "w-errors", type: "kpi_card", title: "Errors (24h)", size: "small", dataSource: "system" },
    { id: "w-usage-chart", type: "chart_area", title: "Platform Usage", size: "medium", dataSource: "analytics" },
    { id: "w-logs", type: "recent_activity", title: "System Events", size: "medium", dataSource: "audit" },
    { id: "w-security", type: "notifications", title: "Security Alerts", size: "small", dataSource: "security" },
    { id: "w-deployments", type: "timeline", title: "Deployment History", size: "medium" },
    { id: "w-integrations", type: "insights", title: "Integration Health", size: "medium" },
  ],
};

/** CMO Dashboard — Marketing & campaigns */
export const CMO_DASHBOARD: DashboardConfig = {
  id: "cmo",
  role: "cmo",
  title: "CMO Marketing Dashboard",
  subtitle: "Campaign performance, lead generation, and marketing ROI",
  icon: Megaphone,
  color: "bg-[#e8710a]",
  permissionScope: "admin",
  landingRoute: "/executive/cmo",
  quickActions: [
    { id: "marketing", label: "Marketing", icon: Megaphone, href: "/communication-marketing", color: "bg-[#e8710a]", description: "Marketing hub" },
    { id: "campaigns", label: "Campaigns", icon: Target, href: "/communication-marketing", color: "bg-[#4285f4]", description: "Campaigns" },
    { id: "leads", label: "Leads", icon: Users, href: "/crm/leads", color: "bg-[#34a853]", description: "Lead database" },
    { id: "analytics", label: "Analytics", icon: BarChart3, href: "/analytics", color: "bg-[#a855f7]", description: "Detailed analytics" },
  ],
  widgets: [
    { id: "w-leads", type: "kpi_card", title: "Total Leads", size: "small", dataSource: "crm" },
    { id: "w-conversions", type: "kpi_card", title: "Conversion Rate", size: "small", dataSource: "crm" },
    { id: "w-campaigns", type: "kpi_card", title: "Active Campaigns", size: "small", dataSource: "marketing" },
    { id: "w-roi", type: "kpi_card", title: "Marketing ROI", size: "small", dataSource: "marketing" },
    { id: "w-lead-sources", type: "chart_pie", title: "Lead Sources", size: "medium", dataSource: "crm" },
    { id: "w-campaign-chart", type: "chart_bar", title: "Campaign Performance", size: "medium", dataSource: "marketing" },
    { id: "w-conversion-trend", type: "chart_line", title: "Conversion Trend", size: "medium", dataSource: "crm" },
    { id: "w-recent-leads", type: "recent_activity", title: "Recent Leads", size: "medium", dataSource: "crm" },
    { id: "w-channel-dist", type: "distribution", title: "Channel Distribution", size: "medium", dataSource: "marketing" },
    { id: "w-top-campaigns", type: "top_performers", title: "Top Campaigns", size: "small", dataSource: "marketing" },
    { id: "w-marketing-insights", type: "insights", title: "Marketing Insights", size: "medium" },
  ],
};

/** CHRO Dashboard — HR & people */
export const CHRO_DASHBOARD: DashboardConfig = {
  id: "chro",
  role: "hr",
  title: "CHRO People Dashboard",
  subtitle: "Workforce analytics, recruitment, and employee engagement",
  icon: Users,
  color: "bg-[#ec407a]",
  permissionScope: "admin",
  landingRoute: "/executive/chro",
  quickActions: [
    { id: "employees", label: "Employees", icon: Users, href: "/employees", color: "bg-[#ec407a]", description: "Employee database" },
    { id: "recruiting", label: "Recruiting", icon: UserPlus, href: "/recruiting", color: "bg-[#4285f4]", description: "Open positions" },
    { id: "people", label: "People", icon: Users, href: "/people", color: "bg-[#34a853]", description: "People registry" },
    { id: "calendar", label: "Calendar", icon: Calendar, href: "/calendar", color: "bg-[#fbbc04]", description: "Leave calendar" },
  ],
  widgets: [
    { id: "w-employees", type: "kpi_card", title: "Total Employees", size: "small", dataSource: "hr" },
    { id: "w-active", type: "kpi_card", title: "Active", size: "small", dataSource: "hr" },
    { id: "w-onboarding", type: "kpi_card", title: "Onboarding", size: "small", dataSource: "hr" },
    { id: "w-recruitment", type: "kpi_card", title: "Open Positions", size: "small", dataSource: "recruitment" },
    { id: "w-dept-chart", type: "chart_bar", title: "Department Headcount", size: "medium", dataSource: "hr" },
    { id: "w-attendance-chart", type: "chart_line", title: "Attendance Trend", size: "medium", dataSource: "hr" },
    { id: "w-recruitment-chart", type: "chart_pie", title: "Recruitment Funnel", size: "medium", dataSource: "recruitment" },
    { id: "w-recent-hires", type: "recent_activity", title: "Recent Hires", size: "medium", dataSource: "hr" },
    { id: "w-birthdays", type: "calendar", title: "Upcoming Birthdays", size: "medium" },
    { id: "w-top-performers", type: "top_performers", title: "Top Performers", size: "small", dataSource: "hr" },
    { id: "w-hr-insights", type: "insights", title: "People Insights", size: "medium" },
  ],
};

/** CKO Dashboard — Knowledge & academic */
export const CKO_DASHBOARD: DashboardConfig = {
  id: "cko",
  role: "cko",
  title: "CKO Academic Dashboard",
  subtitle: "Academic performance, LMS engagement, and examination insights",
  icon: BookOpen,
  color: "bg-[#a855f7]",
  permissionScope: "admin",
  landingRoute: "/executive/cko",
  quickActions: [
    { id: "academic", label: "Academic", icon: BookOpen, href: "/academic", color: "bg-[#a855f7]", description: "Academic hub" },
    { id: "students", label: "Students", icon: GraduationCap, href: "/students", color: "bg-[#4285f4]", description: "Student database" },
    { id: "lms", label: "LMS", icon: BookOpen, href: "/lms", color: "bg-[#1a73e8]", description: "Learning platform" },
    { id: "exams", label: "Exams", icon: FileCheck, href: "/examinations", color: "bg-[#e8710a]", description: "Examination hub" },
  ],
  widgets: [
    { id: "w-students", type: "kpi_card", title: "Total Students", size: "small", dataSource: "students" },
    { id: "w-courses", type: "kpi_card", title: "Active Courses", size: "small", dataSource: "lms" },
    { id: "w-pass-rate", type: "kpi_card", title: "Pass Rate", size: "small", dataSource: "examinations" },
    { id: "w-faculty", type: "kpi_card", title: "Faculty", size: "small", dataSource: "hr" },
    { id: "w-enrollment-chart", type: "chart_area", title: "Enrollment Trend", size: "medium", dataSource: "students" },
    { id: "w-course-chart", type: "chart_bar", title: "Course Completion", size: "medium", dataSource: "lms" },
    { id: "w-exam-chart", type: "chart_pie", title: "Exam Grade Distribution", size: "medium", dataSource: "examinations" },
    { id: "w-recent-activity", type: "recent_activity", title: "Academic Activity", size: "medium", dataSource: "academic" },
    { id: "w-lms-progress", type: "trend", title: "LMS Engagement Trend", size: "small", dataSource: "lms" },
    { id: "w-academic-insights", type: "insights", title: "Academic Insights", size: "medium" },
    { id: "w-top-students", type: "top_performers", title: "Top Students", size: "small", dataSource: "students" },
  ],
};

/** CPO Dashboard — Procurement & inventory */
export const CPO_DASHBOARD: DashboardConfig = {
  id: "cpo",
  role: "cpo",
  title: "CPO Procurement Dashboard",
  subtitle: "Vendor management, inventory levels, and purchase orders",
  icon: ShoppingCart,
  color: "bg-[#5f6368]",
  permissionScope: "admin",
  landingRoute: "/executive/cpo",
  quickActions: [
    { id: "procurement", label: "Procurement", icon: ShoppingCart, href: "/procurement", color: "bg-[#5f6368]", description: "Procurement hub" },
    { id: "inventory", label: "Inventory", icon: Package, href: "/procurement/inventory", color: "bg-[#fbbc04]", description: "Stock management" },
    { id: "vendors", label: "Vendors", icon: Truck, href: "/procurement/vendors", color: "bg-[#34a853]", description: "Vendor directory" },
    { id: "assets", label: "Assets", icon: Monitor, href: "/procurement/assets", color: "bg-[#4285f4]", description: "Asset register" },
  ],
  widgets: [
    { id: "w-vendors", type: "kpi_card", title: "Active Vendors", size: "small", dataSource: "procurement" },
    { id: "w-pos", type: "kpi_card", title: "Pending POs", size: "small", dataSource: "procurement" },
    { id: "w-inventory", type: "kpi_card", title: "Inventory Value", size: "small", dataSource: "inventory" },
    { id: "w-low-stock", type: "kpi_card", title: "Low Stock Items", size: "small", dataSource: "inventory" },
    { id: "w-po-chart", type: "chart_bar", title: "Purchase Orders by Month", size: "medium", dataSource: "procurement" },
    { id: "w-inventory-chart", type: "chart_pie", title: "Inventory by Category", size: "medium", dataSource: "inventory" },
    { id: "w-spend-chart", type: "chart_line", title: "Procurement Spend", size: "medium", dataSource: "procurement" },
    { id: "w-recent-pos", type: "recent_activity", title: "Recent Orders", size: "medium", dataSource: "procurement" },
    { id: "w-warehouse", type: "distribution", title: "Warehouse Stock", size: "medium", dataSource: "inventory" },
    { id: "w-top-vendors", type: "top_performers", title: "Top Vendors", size: "small", dataSource: "procurement" },
    { id: "w-procurement-insights", type: "insights", title: "Procurement Insights", size: "medium" },
  ],
};

// ─── Dashboard Registry ──────────────────────────────────────────

export const EXECUTIVE_DASHBOARDS: Record<string, DashboardConfig> = {
  ceo: CEO_DASHBOARD,
  coo: COO_DASHBOARD,
  cfo: CFO_DASHBOARD,
  cto: CTO_DASHBOARD,
  cmo: CMO_DASHBOARD,
  chro: CHRO_DASHBOARD,
  cko: CKO_DASHBOARD,
  cpo: CPO_DASHBOARD,
};

export const EXECUTIVE_ROLES = [
  { id: "ceo", label: "CEO", color: "bg-[#1a1a2e]", route: "/executive/ceo" },
  { id: "coo", label: "COO", color: "bg-[#e8710a]", route: "/executive/coo" },
  { id: "cfo", label: "CFO", color: "bg-[#34a853]", route: "/executive/cfo" },
  { id: "cto", label: "CTO", color: "bg-[#1a73e8]", route: "/executive/cto" },
  { id: "cmo", label: "CMO", color: "bg-[#e8710a]", route: "/executive/cmo" },
  { id: "chro", label: "CHRO", color: "bg-[#ec407a]", route: "/executive/chro" },
  { id: "cko", label: "CKO", color: "bg-[#a855f7]", route: "/executive/cko" },
  { id: "cpo", label: "CPO", color: "bg-[#5f6368]", route: "/executive/cpo" },
];

/** Get a dashboard config by role ID */
export function getDashboardConfig(roleId: string): DashboardConfig | undefined {
  return EXECUTIVE_DASHBOARDS[roleId];
}

/** Get all dashboard configs */
export function getAllDashboardConfigs(): DashboardConfig[] {
  return Object.values(EXECUTIVE_DASHBOARDS);
}

/** Get widget definition */
export function getWidgetDef(type: WidgetType): WidgetDefinition | undefined {
  return WIDGET_REGISTRY[type];
}
