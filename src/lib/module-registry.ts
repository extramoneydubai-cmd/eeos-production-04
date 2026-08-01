/**
 * MODULE_REGISTRY — EEOS Single Source of Truth for Navigation (PATCH-UI-001, Phase 2)
 *
 * Every production module lives here ONCE. From this single array the app generates:
 *   - Sidebar sections          (getSidebarSections)
 *   - Global search             (searchModules)
 *   - Breadcrumbs               (getBreadcrumbTrail)
 *   - Favorites                 (toggleFavorite / isFavorite)
 *   - Quick Actions FAB         (getQuickActionsForRole)
 *   - Dashboard shortcuts       (getDashboardShortcuts)
 *   - Mobile navigation / studio launcher (same sections, reused)
 *   - Permission filtering      (roles field)
 *
 * No component hardcodes menu items. If a route exists, it is registered here.
 * If a module is registered here, sidebar/search/breadcrumbs/dashboard all pick it up.
 */

import {
  LayoutDashboard,
  Building2,
  Database,
  Shield,
  Workflow,
  ListChecks,
  Users,
  LineChart,
  GraduationCap,
  UserPlus,
  BookOpen,
  PiggyBank,
  UsersRound,
  Megaphone,
  Building,
  Monitor,
  MessageSquare,
  BarChart3,
  Settings,
  Target,
  ContactRound,
  FileCheck,
  ShoppingCart,
  CircleUser,
  Calendar,
  Crown,
  Activity,
  DollarSign,
  FileText,
  Undo2,
  Banknote,
  CheckSquare,
  Bell,
  UserCircle,
  Newspaper,
  Ticket,
  ClipboardList,
  Factory,
  Package,
  Truck,
  Headphones,
  FolderOpen,
  Sparkles,
  Radar,
  Boxes,
  Receipt,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────

export type ModuleGroup =
  | "Overview"
  | "Studios"
  | "Business Modules"
  | "System"
  | "Tools";

export interface ModuleDefinition {
  /** Stable unique id (used for favorites, breadcrumbs, permissions) */
  id: string;
  /** Display label */
  label: string;
  /** Primary route */
  href: string;
  icon: LucideIcon;
  group: ModuleGroup;
  /** Parent module id — builds breadcrumb trails automatically */
  parent?: string;
  /** Search keywords/aliases (module names, features, pages) */
  keywords: string[];
  /** Optional role gating: omit = everyone */
  roles?: string[];
  /** Short description for search + dashboard shortcuts */
  description: string;
  /** Extra related routes surfaced in search + breadcrumbs */
  children?: { label: string; href: string }[];
  /** Whether the route is a placeholder stub */
  isPlaceholder?: boolean;
}

// ─── THE REGISTRY ───────────────────────────────────────────────────────

export const MODULE_REGISTRY: ModuleDefinition[] = [
  // ── Overview ────────────────────────────────────────────────
  {
    id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard,
    group: "Overview", keywords: ["home", "overview", "kpi", "widgets"],
    description: "Enterprise dashboard with KPIs, tasks, approvals and activity.",
  },
  {
    id: "command-center", label: "Command Center", href: "/command-center", icon: Radar,
    group: "Overview", keywords: ["operations", "command", "queues", "runtime", "escalations"],
    description: "Converged operations command center — one screen for every queue.",
  },
  {
    id: "executive", label: "Executive Dashboards", href: "/executive/ceo", icon: Crown,
    group: "Overview", keywords: ["ceo", "cfo", "coo", "cko", "cto", "cmo", "cpo", "chro", "executive"],
    description: "Role-specific executive dashboards for the C-suite.",
    children: [
      { label: "CEO Dashboard", href: "/executive/ceo" },
      { label: "CFO Dashboard", href: "/executive/cfo" },
      { label: "COO Dashboard", href: "/executive/coo" },
      { label: "CKO Dashboard", href: "/executive/cko" },
      { label: "CTO Dashboard", href: "/executive/cto" },
      { label: "CMO Dashboard", href: "/executive/cmo" },
      { label: "CPO Dashboard", href: "/executive/cpo" },
      { label: "CHRO Dashboard", href: "/executive/chro" },
    ],
  },
  {
    id: "student-portal", label: "Student Portal", href: "/student", icon: GraduationCap,
    group: "Overview", keywords: ["student portal", "my dashboard", "self service"],
    description: "Student self-service dashboard.",
    roles: ["student"],
  },
  {
    id: "parent-portal", label: "Parent Portal", href: "/parent", icon: UsersRound,
    group: "Overview", keywords: ["parent portal", "my child", "fee status"],
    description: "Parent self-service dashboard.",
    roles: ["parent"],
  },
  {
    id: "faculty-portal", label: "Faculty Portal", href: "/faculty", icon: BookOpen,
    group: "Overview", keywords: ["faculty portal", "my classes", "my schedule"],
    description: "Faculty self-service dashboard.",
    roles: ["faculty"],
  },

  // ── Studios ──────────────────────────────────────────────────
  {
    id: "org", label: "Organization Studio", href: "/org", icon: Building2,
    group: "Studios", keywords: ["org", "departments", "branches", "companies", "teams", "verticals"],
    description: "Organization structure: departments, companies, branches, teams.",
    children: [
      { label: "Companies", href: "/studios/master-data/organization/companies" },
      { label: "Branches", href: "/studios/master-data/organization/branches" },
      { label: "Departments", href: "/studios/master-data/organization/departments" },
      { label: "Teams", href: "/studios/master-data/organization/teams" },
      { label: "Designations", href: "/studios/master-data/organization/designations" },
    ],
  },
  {
    id: "master-data", label: "Master Data Studio", href: "/studios/master-data", icon: Database,
    group: "Studios", keywords: ["masters", "config", "settings", "reference"],
    description: "Central configuration repository for every module.",
  },
  {
    id: "access", label: "Access Studio", href: "/access", icon: Shield,
    group: "Studios", keywords: ["access control", "roles", "permissions", "scopes", "acl"],
    description: "Access control, effective access and role visibility.",
    roles: ["super_admin", "admin"],
  },
  {
    id: "workflow", label: "Workflow Studio", href: "/studios/workflows", icon: Workflow,
    group: "Studios", keywords: ["workflows", "automation", "triggers", "nodes"],
    description: "Design and monitor enterprise workflows.",
    children: [{ label: "Workflow Monitor", href: "/workflow-monitor" }],
  },
  {
    id: "workflow-monitor", label: "Workflow Monitor", href: "/workflow-monitor", icon: Activity, parent: "workflow",
    group: "Studios", keywords: ["workflow monitor", "executions", "runs", "monitor"],
    description: "Monitor live workflow executions and runs.",
  },
  {
    id: "forms", label: "Form Studio", href: "/studios/forms", icon: ClipboardList,
    group: "Studios", keywords: ["forms", "builder", "dynamic forms"],
    description: "Build and publish dynamic forms.",
  },
  {
    id: "dashboards", label: "Dashboard Studio", href: "/studio/dashboards", icon: BarChart3,
    group: "Studios", keywords: ["dashboard studio", "widgets", "layouts", "kpis"],
    description: "Design custom dashboards and widget layouts.",
  },
  {
    id: "platform-studio", label: "Platform Studio", href: "/platform-studio", icon: Sparkles,
    group: "Studios", keywords: ["platform", "registry", "pages", "engines"],
    description: "Platform page and engine registry explorer.",
  },

  // ── Business Modules ─────────────────────────────────────────
  {
    id: "crm", label: "CRM", href: "/crm", icon: Target,
    group: "Business Modules", keywords: ["leads", "customers", "opportunities", "pipeline", "follow up"],
    description: "Lead and customer relationship management.",
    children: [
      { label: "Leads", href: "/crm/leads" },
      { label: "Sales Center", href: "/crm/sales" },
      { label: "Opportunities", href: "/crm/sales/opportunities" },
      { label: "Sales Tasks", href: "/crm/sales/tasks" },
      { label: "Sales Payments", href: "/crm/sales/payments" },
      { label: "Sales Performance", href: "/crm/sales/performance" },
      { label: "Collection Center", href: "/crm/sales/collections" },
      { label: "Customer 360", href: "/customer360" },
      { label: "Lead Stages", href: "/crm/settings/stages" },
    ],
  },
  {
    id: "customer360", label: "Customer 360", href: "/customer360", icon: ContactRound, parent: "crm",
    group: "Business Modules", keywords: ["customer 360", "customer profile", "crm", "360"],
    description: "Unified 360° customer profile.",
  },
  {
    id: "collection-center", label: "Collection Center", href: "/crm/sales/collections", icon: Banknote, parent: "crm",
    group: "Business Modules", keywords: ["collections", "crm collections", "sales collections"],
    description: "Collections within the CRM sales pipeline.",
  },
  {
    id: "admissions", label: "Admissions", href: "/admissions", icon: UserPlus,
    group: "Business Modules", keywords: ["intake", "enquiry", "lead conversion", "enrollment"],
    description: "Admissions, intake and enrollment pipeline.",
    children: [{ label: "Intake Studio", href: "/studios/intake" }],
  },
  {
    id: "intake", label: "Intake Studio", href: "/studios/intake", icon: UserPlus, parent: "admissions",
    group: "Business Modules", keywords: ["intake", "admissions intake", "intake dashboard"],
    description: "Admissions intake and pipeline dashboard.",
  },
  {
    id: "students", label: "Students", href: "/students", icon: GraduationCap,
    group: "Business Modules", keywords: ["student database", "enrollment", "student records"],
    description: "Student database and records.",
  },
  {
    id: "academic", label: "Academic", href: "/academic", icon: BookOpen,
    group: "Business Modules", keywords: ["courses", "batches", "academic", "classes"],
    description: "Academic structure: courses, batches, sessions.",
    children: [
      { label: "Course Library", href: "/courses" },
      { label: "Academic Master Data", href: "/studios/master-data/academic" },
    ],
  },
  {
    id: "collections", label: "Collections", href: "/collections", icon: Banknote, parent: "finance",
    group: "Business Modules", keywords: ["collections", "fee collection", "payments", "receipts"],
    description: "Fee collections and payment receipts.",
    children: [{ label: "Collections Executive", href: "/collections-executive" }],
  },
  {
    id: "collections-executive", label: "Collections Executive", href: "/collections-executive", icon: BarChart3, parent: "collections",
    group: "Business Modules", keywords: ["collections executive", "collections kpi", "executive"],
    description: "Executive view of collections performance.",
  },
  {
    id: "finance", label: "Finance", href: "/finance", icon: PiggyBank,
    group: "Business Modules", keywords: ["fees", "invoices", "payments", "collections", "revenue", "accounting"],
    description: "Finance, fees, invoices and collections.",
    children: [
      { label: "Collections", href: "/collections" },
      { label: "Finance Reports", href: "/finance/reports" },
      { label: "Finance Master Data", href: "/studios/master-data/finance" },
    ],
  },
  {
    id: "refund", label: "Refunds", href: "/finance/refunds", icon: Undo2, parent: "finance",
    group: "Business Modules", keywords: ["refund center", "refund rules", "refund reports", "refund dashboard", "refund workflow", "refund analytics", "refund requests", "refund approval"],
    description: "Refund requests, approvals and processing.",
    children: [
      { label: "Refund Center", href: "/finance/refunds" },
      { label: "Refund Rules", href: "/studios/master-data/finance" },
      { label: "Refund Reports", href: "/finance/reports" },
    ],
  },
  {
    id: "pdc", label: "PDC & Cheques", href: "/finance/pdc", icon: Banknote, parent: "finance",
    group: "Business Modules", keywords: ["pdc", "cheques", "post dated", "bounce", "penalty", "reconciliation"],
    description: "Post-dated cheques, deposits, bounces and penalties.",
  },
  {
    id: "people", label: "People", href: "/people", icon: CircleUser,
    group: "Business Modules", keywords: ["people registry", "contacts", "persons"],
    description: "Unified people registry.",
  },
  {
    id: "employees", label: "Employees", href: "/employees", icon: UsersRound,
    group: "Business Modules", keywords: ["hr", "staff", "employee records", "onboarding"],
    description: "Employee database and lifecycle.",
  },
  {
    id: "hr", label: "HR", href: "/hr", icon: Users,
    group: "Business Modules", keywords: ["human resources", "payroll", "leave", "attendance", "recruiting"],
    description: "HR, payroll, leave and recruiting.",
    children: [
      { label: "Recruiting", href: "/recruiting" },
      { label: "HR Master Data", href: "/studios/master-data/hr" },
    ],
  },
  {
    id: "marketing", label: "Marketing", href: "/communication-marketing", icon: Megaphone,
    group: "Business Modules", keywords: ["campaigns", "communication", "email", "sms", "whatsapp"],
    description: "Marketing campaigns and communications.",
    children: [
      { label: "Campaigns", href: "/marketing/campaigns" },
      { label: "Marketing Analytics", href: "/marketing/analytics" },
      { label: "Communication Master Data", href: "/studios/master-data/communication" },
    ],
  },
  {
    id: "administration", label: "Administration", href: "/administration", icon: Building,
    group: "Business Modules", keywords: ["admin", "operations"],
    description: "Administration dashboard.",
  },
  {
    id: "procurement", label: "Procurement", href: "/procurement", icon: ShoppingCart,
    group: "Business Modules", keywords: ["vendors", "purchase", "requisition", "suppliers"],
    description: "Procurement and vendor management.",
    children: [
      { label: "Vendors", href: "/procurement/vendors" },
      { label: "Assets", href: "/procurement/assets" },
    ],
  },
  {
    id: "inventory", label: "Inventory", href: "/procurement/inventory", icon: Boxes, parent: "procurement",
    group: "Business Modules", keywords: ["stock", "warehouse", "items", "low stock"],
    description: "Inventory and stock management.",
  },
  {
    id: "production", label: "Production", href: "/production", icon: Factory,
    group: "Business Modules", keywords: ["production tasks", "content", "manufacturing", "pipeline"],
    description: "Production task management.",
  },
  {
    id: "lms", label: "LMS", href: "/lms", icon: BookOpen,
    group: "Business Modules", keywords: ["learning", "courses", "lessons", "e-learning", "content"],
    description: "Learning management system.",
    children: [
      { label: "Course Studio", href: "/lms/courses" },
    ],
  },
  {
    id: "attendance", label: "Attendance", href: "/attendance", icon: CheckSquare,
    group: "Business Modules", keywords: ["attendance", "mark", "shift", "duty", "qr", "gps", "face", "present", "absent", "late"],
    description: "Attendance marking with QR, GPS and face verification.",
  },
  {
    id: "examinations", label: "Examinations", href: "/examinations", icon: FileCheck,
    group: "Business Modules", keywords: ["exams", "hall ticket", "results", "evaluation", "revaluation"],
    description: "Examination planning, results and revaluation.",
  },
  {
    id: "transport", label: "Transport", href: "/scheduling", icon: Truck,
    group: "Business Modules", keywords: ["transport", "routes", "vehicles", "fleet"],
    description: "Transport scheduling and fleet.",
  },
  {
    id: "scheduling", label: "Scheduling", href: "/scheduling", icon: Calendar,
    group: "Business Modules", keywords: ["schedule", "timetable", "classes", "resources", "conflicts"],
    description: "Scheduling, timetable and resource booking.",
    children: [
      { label: "Scheduler Dashboard", href: "/scheduler" },
      { label: "Schedule Approvals", href: "/scheduling/approvals" },
      { label: "Scheduling Reports", href: "/scheduling/reports" },
    ],
  },
  {
    id: "scheduler", label: "Scheduler", href: "/scheduler", icon: Calendar, parent: "scheduling",
    group: "Business Modules", keywords: ["scheduler", "scheduler dashboard", "resources"],
    description: "Scheduler workspace and resource allocation.",
  },
  {
    id: "support", label: "Support", href: "/support", icon: Headphones,
    group: "Business Modules", keywords: ["tickets", "helpdesk", "sla", "knowledge base"],
    description: "Support, tickets and knowledge base.",
    children: [
      { label: "Tickets", href: "/tickets" },
      { label: "Agent Queue", href: "/support/agent" },
      { label: "Knowledge Base", href: "/knowledge" },
    ],
  },
  {
    id: "analytics", label: "Reports & Analytics", href: "/analytics", icon: BarChart3,
    group: "Business Modules", keywords: ["reports", "analytics", "charts", "dashboard", "insights"],
    description: "Reports, analytics and insights.",
    children: [
      { label: "Analytics", href: "/analytics" },
      { label: "Finance Reports", href: "/finance/reports" },
    ],
  },
  {
    id: "documents", label: "Documents", href: "/documents", icon: FolderOpen,
    group: "Business Modules", keywords: ["files", "documents", "attachments", "certificates"],
    description: "Document management and certificates.",
  },

  // ── System ───────────────────────────────────────────────────
  {
    id: "users", label: "User Management", href: "/users", icon: Users,
    group: "System", keywords: ["users", "accounts", "login", "sessions"],
    description: "Create, manage and secure user accounts.",
    roles: ["super_admin", "admin"],
  },
  {
    id: "approvals", label: "Approval Center", href: "/approvals", icon: CheckSquare,
    group: "System", keywords: ["approvals", "approval requests", "templates", "phases"],
    description: "Approval requests, templates and phases.",
  },
  {
    id: "notifications", label: "Notifications", href: "/notifications", icon: Bell,
    group: "Tools", keywords: ["notifications", "alerts", "unread"],
    description: "Your notifications and alerts.",
  },
  {
    id: "calendar", label: "Calendar", href: "/calendar", icon: Calendar,
    group: "Tools", keywords: ["calendar", "events", "meetings", "schedule view"],
    description: "Personal calendar and events.",
  },
  {
    id: "organization-calendar", label: "Organization Calendar", href: "/organization-calendar", icon: Calendar,
    group: "Tools", keywords: ["org calendar", "institution calendar", "events", "holidays"],
    description: "Organization-wide calendar and events.",
  },
  {
    id: "messenger", label: "Messenger", href: "/messenger", icon: MessageSquare,
    group: "Tools", keywords: ["chat", "dm", "channels", "announcements", "messages"],
    description: "Direct messages, channels and announcements.",
  },
  {
    id: "control", label: "Control Center", href: "/control", icon: Crown,
    group: "System", keywords: ["admin", "control", "broadcast", "reset password"],
    description: "CEO operations control.",
    roles: ["super_admin"],
  },
  {
    id: "security", label: "Security Center", href: "/security", icon: Shield,
    group: "System", keywords: ["security", "risk", "threats", "hardening"],
    description: "Enterprise security center.",
  },
  {
    id: "audit", label: "Audit Center", href: "/audit", icon: FileText,
    group: "System", keywords: ["audit", "logs", "trail", "compliance"],
    description: "Audit trail and compliance.",
  },
  {
    id: "admin-console", label: "Admin Console", href: "/admin", icon: Settings,
    group: "System", keywords: ["admin console", "system admin", "platform"],
    description: "Platform administration console.",
  },
  {
    id: "deployment", label: "Deployment Center", href: "/deployment", icon: Monitor,
    group: "System", keywords: ["deployment", "releases", "environments", "ci cd"],
    description: "Deployment, releases and environments.",
  },
  {
    id: "operations", label: "Operations", href: "/operations", icon: Activity,
    group: "System", keywords: ["operations", "observability", "runtime", "monitoring"],
    description: "Operations observability platform.",
  },
  {
    id: "release-health", label: "Release Health", href: "/release-health", icon: Activity,
    group: "System", keywords: ["release", "health", "readiness", "deployment"],
    description: "Release health and readiness.",
  },
  {
    id: "profile", label: "Profile", href: "/profile", icon: UserCircle,
    group: "System", keywords: ["profile", "account", "me"],
    description: "Your profile and preferences.",
  },
];

// ─── Helpers: sections (sidebar / mobile nav / studio launcher) ────────

export const MODULE_GROUPS: ModuleGroup[] = ["Overview", "Studios", "Business Modules", "System", "Tools"];

export function getModulesByGroup(group: ModuleGroup): ModuleDefinition[] {
  return MODULE_REGISTRY.filter((m) => m.group === group && !m.isPlaceholder);
}

export function getSidebarSections(role?: string): { group: ModuleGroup; items: ModuleDefinition[] }[] {
  return MODULE_GROUPS
    .map((group) => ({
      group,
      items: getModulesByGroup(group).filter((m) => !m.roles || (role && m.roles.includes(role))),
    }))
    .filter((s) => s.items.length > 0);
}

// ─── Helpers: search (global search + command palette) ─────────────────

export function searchModules(query: string, limit = 8): ModuleDefinition[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return MODULE_REGISTRY
    .filter((m) =>
      m.label.toLowerCase().includes(q) ||
      m.keywords.some((k) => k.toLowerCase().includes(q)) ||
      m.description.toLowerCase().includes(q)
    )
    .slice(0, limit);
}

/** Flatten module children for search (e.g. "Refund Reports" → route) */
export function searchModulePages(query: string, limit = 8): { label: string; href: string; module: string }[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const hits: { label: string; href: string; module: string }[] = [];
  for (const m of MODULE_REGISTRY) {
    for (const c of m.children ?? []) {
      if (c.label.toLowerCase().includes(q)) {
        hits.push({ label: `${m.label} — ${c.label}`, href: c.href, module: m.label });
      }
    }
  }
  return hits.slice(0, limit);
}

// ─── Helpers: breadcrumbs (Phase 7 — automatic, no manual breadcrumbs) ─

export function getBreadcrumbTrail(pathname: string): { label: string; href?: string }[] {
  // Exact module match first
  const exact = MODULE_REGISTRY.find((m) => m.href === pathname);
  if (exact) {
    const trail: { label: string; href?: string }[] = [{ label: "Home", href: "/dashboard" }];
    // Walk parents
    const chain: ModuleDefinition[] = [];
    let cur: ModuleDefinition | undefined = exact;
    while (cur) {
      chain.unshift(cur);
      cur = cur.parent ? MODULE_REGISTRY.find((m) => m.id === cur!.parent) : undefined;
    }
    for (const c of chain) {
      trail.push({ label: c.label, href: c.href });
    }
    trail[trail.length - 1].href = undefined;
    return trail;
  }

  // Child page match (e.g. /finance/refunds/XYZ or master-data pages)
  const parts = pathname.split("/").filter(Boolean);
  const trail: { label: string; href?: string }[] = [{ label: "Home", href: "/dashboard" }];
  let accumulated = "";
  for (let i = 0; i < parts.length; i++) {
    accumulated += `/${parts[i]}`;
    const mod = MODULE_REGISTRY.find((m) => m.href === accumulated);
    if (mod) {
      trail.push({ label: mod.label, href: accumulated });
    } else {
      trail.push({
        label: parts[i].replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        href: accumulated,
      });
    }
  }
  if (trail.length > 1) trail[trail.length - 1].href = undefined;
  return trail;
}

// ─── Helpers: favorites (Phase 6 — localStorage pinned modules) ────────

const FAVORITES_KEY = "eeos_favorite_modules";

export function getFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function isFavorite(id: string): boolean {
  return getFavorites().includes(id);
}

export function toggleFavorite(id: string): string[] {
  const favs = getFavorites();
  const next = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id];
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
  return next;
}

export function getFavoriteModules(): ModuleDefinition[] {
  const favs = getFavorites();
  return MODULE_REGISTRY.filter((m) => favs.includes(m.id));
}

// ─── Helpers: quick actions (Phase 4 — permission-aware FAB) ───────────

export interface QuickAction {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
  accent: string; // tailwind icon chip classes
}

export const QUICK_ACTIONS: QuickAction[] = [
  { id: "new-student", label: "New Student", href: "/students", icon: GraduationCap, roles: ["super_admin", "admin", "manager"], accent: "bg-blue-50 text-blue-600" },
  { id: "new-lead", label: "New Lead", href: "/crm/leads", icon: Target, accent: "bg-purple-50 text-purple-600" },
  { id: "new-employee", label: "New Employee", href: "/employees", icon: UsersRound, roles: ["super_admin", "admin"], accent: "bg-green-50 text-green-600" },
  { id: "new-invoice", label: "New Invoice", href: "/finance", icon: FileText, roles: ["super_admin", "admin", "manager"], accent: "bg-emerald-50 text-emerald-600" },
  { id: "new-refund", label: "New Refund", href: "/finance/refunds", icon: Undo2, roles: ["super_admin", "admin", "manager"], accent: "bg-amber-50 text-amber-600" },
  { id: "new-task", label: "New Task", href: "/tasks", icon: ListChecks, accent: "bg-indigo-50 text-indigo-600" },
  { id: "new-ticket", label: "New Ticket", href: "/tickets", icon: Ticket, accent: "bg-rose-50 text-rose-600" },
  { id: "new-meeting", label: "New Meeting", href: "/scheduling", icon: Calendar, roles: ["super_admin", "admin", "manager"], accent: "bg-cyan-50 text-cyan-600" },
  { id: "announcement", label: "Announcement", href: "/messenger", icon: Megaphone, roles: ["super_admin", "admin"], accent: "bg-orange-50 text-orange-600" },
  { id: "new-document", label: "New Document", href: "/documents", icon: FolderOpen, accent: "bg-slate-50 text-slate-600" },
  { id: "new-course", label: "New Course", href: "/lms/courses", icon: BookOpen, roles: ["super_admin", "admin"], accent: "bg-teal-50 text-teal-600" },
  { id: "new-batch", label: "New Batch", href: "/academic", icon: Building2, roles: ["super_admin", "admin"], accent: "bg-violet-50 text-violet-600" },
  { id: "mark-attendance", label: "Mark Attendance", href: "/attendance", icon: CheckSquare, accent: "bg-lime-50 text-lime-600" },
  { id: "record-payment", label: "Record Payment", href: "/collections", icon: Banknote, roles: ["super_admin", "admin", "manager"], accent: "bg-yellow-50 text-yellow-600" },
];

export function getQuickActionsForRole(role?: string): QuickAction[] {
  return QUICK_ACTIONS.filter((a) => !a.roles || (role && a.roles.includes(role)));
}

// ─── Helpers: dashboard shortcuts (Phase 3) ─────────────────────────────

export function getDashboardShortcuts(role?: string): ModuleDefinition[] {
  return MODULE_REGISTRY
    .filter((m) => m.group !== "Tools" && !m.isPlaceholder && (!m.roles || (role && m.roles.includes(role))))
    .slice(0, 12);
}

// ─── Helpers: module lookup ─────────────────────────────────────────────

export function getModuleById(id: string): ModuleDefinition | undefined {
  return MODULE_REGISTRY.find((m) => m.id === id);
}

export function getModuleByHref(href: string): ModuleDefinition | undefined {
  return MODULE_REGISTRY.find((m) => m.href === href);
}
