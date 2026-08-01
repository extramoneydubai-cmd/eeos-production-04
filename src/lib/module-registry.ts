/**
 * MODULE_REGISTRY — EEOS Single Source of Truth for Navigation (PATCH-UI-001, Phase 2)
 *
 * Enterprise ERP navigation model (SAP / Oracle Fusion / Dynamics / Salesforce style).
 * Every production module lives here ONCE. From this single array the app generates:
 *   - Sidebar sections          (getSidebarSections)  — 13 enterprise groups
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
  | "Home"
  | "Governance"
  | "Academics"
  | "CRM"
  | "Students"
  | "Finance"
  | "HR"
  | "Operations"
  | "Communication"
  | "Reports"
  | "AI"
  | "Integrations"
  | "Platform";

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

// ─── THE REGISTRY (enterprise ERP hierarchy) ────────────────────────────

export const MODULE_REGISTRY: ModuleDefinition[] = [
  // ══ HOME ══════════════════════════════════════════════════════════
  {
    id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard,
    group: "Home", keywords: ["home", "overview", "kpi", "widgets"],
    description: "Enterprise dashboard with KPIs, tasks, approvals and activity.",
  },
  {
    id: "command-center", label: "Command Center", href: "/command-center", icon: Radar,
    group: "Home", keywords: ["operations", "command", "queues", "runtime", "escalations"],
    description: "Converged operations command center — one screen for every queue.",
  },
  {
    id: "tasks", label: "Tasks", href: "/tasks", icon: ListChecks,
    group: "Home", keywords: ["my tasks", "kanban", "to do", "checklist", "assignments"],
    description: "My workspace — tasks, kanban boards and checklists.",
  },
  {
    id: "approvals", label: "Approvals", href: "/approvals", icon: CheckSquare,
    group: "Home", keywords: ["approvals", "approval requests", "templates", "phases", "my approvals"],
    description: "Approval requests, templates and phases.",
  },
  {
    id: "notifications", label: "Notifications", href: "/notifications", icon: Bell,
    group: "Home", keywords: ["notifications", "alerts", "unread", "badge"],
    description: "Your notifications and alerts.",
  },
  {
    id: "messenger", label: "Messenger", href: "/messenger", icon: MessageSquare,
    group: "Home", keywords: ["chat", "dm", "channels", "announcements", "messages"],
    description: "Direct messages, channels and announcements.",
  },
  {
    id: "calendar", label: "Calendar", href: "/calendar", icon: Calendar,
    group: "Home", keywords: ["calendar", "events", "meetings", "schedule view"],
    description: "Personal calendar and events.",
  },
  {
    id: "organization-calendar", label: "Organization Calendar", href: "/organization-calendar", icon: Calendar,
    group: "Home", keywords: ["org calendar", "institution calendar", "events", "holidays"],
    description: "Organization-wide calendar and events.",
  },
  {
    id: "profile", label: "Profile", href: "/profile", icon: UserCircle,
    group: "Home", keywords: ["profile", "account", "me", "settings"],
    description: "Your profile and preferences.",
  },

  // ══ GOVERNANCE ════════════════════════════════════════════════════
  {
    id: "executive", label: "Executive Dashboards", href: "/executive/ceo", icon: Crown,
    group: "Governance", keywords: ["ceo", "cfo", "coo", "cko", "cto", "cmo", "cpo", "chro", "executive"],
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
    id: "control", label: "CEO Control Center", href: "/control", icon: Crown,
    group: "Governance", keywords: ["admin", "control", "broadcast", "reset password"],
    description: "CEO operations control.",
    roles: ["super_admin"],
  },
  {
    id: "org", label: "Organization Studio", href: "/org", icon: Building2,
    group: "Governance", keywords: ["org", "departments", "branches", "companies", "teams", "verticals"],
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
    id: "access", label: "Access Studio", href: "/access", icon: Shield,
    group: "Governance", keywords: ["access control", "roles", "permissions", "scopes", "acl", "effective access"],
    description: "Access control, effective access and role visibility.",
    roles: ["super_admin", "admin"],
  },
  {
    id: "users", label: "User Management", href: "/users", icon: Users,
    group: "Governance", keywords: ["users", "accounts", "login", "sessions", "reset password"],
    description: "Create, manage and secure user accounts.",
    roles: ["super_admin", "admin"],
  },
  {
    id: "configuration", label: "Configuration Studio", href: "/configuration", icon: Settings,
    group: "Governance", keywords: ["configuration", "config", "settings", "feature flags", "platform config"],
    description: "Platform configuration and feature controls.",
  },
  {
    id: "governance", label: "Governance Dashboard", href: "/governance", icon: Shield,
    group: "Governance", keywords: ["governance", "policies", "compliance", "oversight"],
    description: "Governance, policy and compliance dashboard.",
  },
  {
    id: "audit", label: "Audit Center", href: "/audit", icon: FileText,
    group: "Governance", keywords: ["audit", "logs", "trail", "compliance", "activity"],
    description: "Audit trail and compliance.",
  },
  {
    id: "security", label: "Security Center", href: "/security", icon: Shield,
    group: "Governance", keywords: ["security", "risk", "threats", "hardening"],
    description: "Enterprise security center.",
  },
  {
    id: "admin-console", label: "Admin Console", href: "/admin", icon: Settings,
    group: "Governance", keywords: ["admin console", "system admin", "platform"],
    description: "Platform administration console.",
  },
  {
    id: "administration", label: "Administration", href: "/administration", icon: Building,
    group: "Governance", keywords: ["admin", "operations", "facilities"],
    description: "Administration dashboard.",
  },

  // ══ ACADEMICS ═════════════════════════════════════════════════════
  {
    id: "academic", label: "Academic Structure", href: "/academic", icon: BookOpen,
    group: "Academics", keywords: ["courses", "programs", "subjects", "batches", "academic", "classes", "faculty allocation"],
    description: "Academic structure: programs, subjects, batches, faculty allocation.",
    children: [
      { label: "Course Library", href: "/courses" },
      { label: "Academic Master Data", href: "/studios/master-data/academic" },
    ],
  },
  {
    id: "courses", label: "Courses", href: "/courses", icon: BookOpen,
    group: "Academics", keywords: ["courses", "course library", "curriculum"],
    description: "Course library and curriculum.",
  },
  {
    id: "scheduling", label: "Timetable", href: "/scheduling", icon: Calendar,
    group: "Academics", keywords: ["timetable", "schedule", "classes", "resources", "conflicts"],
    description: "Timetable, scheduling and resource booking.",
    children: [
      { label: "Scheduler Dashboard", href: "/scheduler" },
      { label: "Schedule Approvals", href: "/scheduling/approvals" },
      { label: "Scheduling Reports", href: "/scheduling/reports" },
    ],
  },
  {
    id: "scheduler", label: "Scheduler", href: "/scheduler", icon: Calendar, parent: "scheduling",
    group: "Academics", keywords: ["scheduler", "scheduler dashboard", "resources"],
    description: "Scheduler workspace and resource allocation.",
  },
  {
    id: "attendance", label: "Attendance", href: "/attendance", icon: CheckSquare,
    group: "Academics", keywords: ["attendance", "mark", "shift", "duty", "qr", "gps", "face", "present", "absent", "late"],
    description: "Attendance marking with QR, GPS and face verification.",
  },
  {
    id: "lms", label: "LMS", href: "/lms", icon: BookOpen,
    group: "Academics", keywords: ["learning", "courses", "lessons", "e-learning", "content", "lesson planner"],
    description: "Learning management system.",
    children: [
      { label: "Course Studio", href: "/lms/courses" },
    ],
  },
  {
    id: "examinations", label: "Exams", href: "/examinations", icon: FileCheck,
    group: "Academics", keywords: ["exams", "hall ticket", "results", "evaluation", "revaluation", "question bank", "assignments"],
    description: "Examination planning, results and revaluation.",
  },
  {
    id: "faculty-portal", label: "Faculty Portal", href: "/faculty", icon: BookOpen,
    group: "Academics", keywords: ["faculty portal", "my classes", "my schedule"],
    description: "Faculty self-service dashboard.",
    roles: ["faculty"],
  },

  // ══ CRM ═══════════════════════════════════════════════════════════
  {
    id: "crm", label: "Lead Center", href: "/crm", icon: Target,
    group: "CRM", keywords: ["leads", "customers", "opportunities", "pipeline", "follow up", "counselling"],
    description: "Lead, customer and opportunity pipeline.",
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
    id: "admissions", label: "Admissions", href: "/admissions", icon: UserPlus,
    group: "CRM", keywords: ["intake", "enquiry", "lead conversion", "enrollment", "enquiry forms"],
    description: "Admissions, intake and enrollment pipeline.",
    children: [{ label: "Intake Studio", href: "/studios/intake" }],
  },
  {
    id: "intake", label: "Intake Studio", href: "/studios/intake", icon: UserPlus, parent: "admissions",
    group: "CRM", keywords: ["intake", "admissions intake", "intake dashboard"],
    description: "Admissions intake and pipeline dashboard.",
  },
  {
    id: "customer360", label: "Customer 360", href: "/customer360", icon: ContactRound, parent: "crm",
    group: "CRM", keywords: ["customer 360", "customer profile", "crm", "360"],
    description: "Unified 360° customer profile.",
  },
  {
    id: "collection-center", label: "Collection Center", href: "/crm/sales/collections", icon: Banknote, parent: "crm",
    group: "CRM", keywords: ["collections", "crm collections", "sales collections"],
    description: "Collections within the CRM sales pipeline.",
  },

  // ══ STUDENTS ══════════════════════════════════════════════════════
  {
    id: "students", label: "Student Registry", href: "/students", icon: GraduationCap,
    group: "Students", keywords: ["student database", "enrollment", "student records", "parents"],
    description: "Student registry, records and enrollment.",
  },
  {
    id: "student-portal", label: "Student Portal", href: "/student", icon: GraduationCap,
    group: "Students", keywords: ["student portal", "my dashboard", "self service", "homework", "progress"],
    description: "Student self-service dashboard.",
    roles: ["student"],
  },
  {
    id: "parent-portal", label: "Parent Portal", href: "/parent", icon: UsersRound,
    group: "Students", keywords: ["parent portal", "my child", "fee status", "attendance"],
    description: "Parent self-service dashboard.",
    roles: ["parent"],
  },
  {
    id: "documents", label: "Documents", href: "/documents", icon: FolderOpen,
    group: "Students", keywords: ["files", "documents", "attachments", "certificates", "id cards"],
    description: "Document management and certificates.",
  },

  // ══ FINANCE ═══════════════════════════════════════════════════════
  {
    id: "finance", label: "Fee Center", href: "/finance", icon: PiggyBank,
    group: "Finance", keywords: ["fees", "invoices", "receipts", "payments", "collections", "revenue", "accounting", "gst", "payroll"],
    description: "Finance, fees, invoices, receipts and accounting.",
    children: [
      { label: "Collections", href: "/collections" },
      { label: "Finance Reports", href: "/finance/reports" },
      { label: "Finance Master Data", href: "/studios/master-data/finance" },
    ],
  },
  {
    id: "collections", label: "Collections", href: "/collections", icon: Banknote, parent: "finance",
    group: "Finance", keywords: ["collections", "fee collection", "payments", "receipts"],
    description: "Fee collections and payment receipts.",
    children: [{ label: "Collections Executive", href: "/collections-executive" }],
  },
  {
    id: "collections-executive", label: "Collections Executive", href: "/collections-executive", icon: BarChart3, parent: "collections",
    group: "Finance", keywords: ["collections executive", "collections kpi", "executive"],
    description: "Executive view of collections performance.",
  },
  {
    id: "refund", label: "Refunds", href: "/finance/refunds", icon: Undo2, parent: "finance",
    group: "Finance", keywords: ["refund center", "refund rules", "refund reports", "refund dashboard", "refund workflow", "refund analytics", "refund requests", "refund approval"],
    description: "Refund requests, approvals and processing.",
    children: [
      { label: "Refund Center", href: "/finance/refunds" },
      { label: "Refund Rules", href: "/studios/master-data/finance" },
      { label: "Refund Reports", href: "/finance/reports" },
    ],
  },
  {
    id: "pdc", label: "PDC & Cheques", href: "/finance/pdc", icon: Banknote, parent: "finance",
    group: "Finance", keywords: ["pdc", "cheques", "post dated", "bounce", "penalty", "reconciliation", "cheque management"],
    description: "Post-dated cheques, deposits, bounces and penalties.",
  },

  // ══ HR ════════════════════════════════════════════════════════════
  {
    id: "employees", label: "Employee Registry", href: "/employees", icon: UsersRound,
    group: "HR", keywords: ["hr", "staff", "employee records", "onboarding", "exit"],
    description: "Employee registry and lifecycle.",
  },
  {
    id: "recruiting", label: "Recruitment", href: "/recruiting", icon: UserPlus,
    group: "HR", keywords: ["recruiting", "hiring", "candidates", "jobs"],
    description: "Recruitment and hiring.",
  },
  {
    id: "hr", label: "HR Analytics", href: "/hr", icon: Users,
    group: "HR", keywords: ["human resources", "payroll", "leave", "attendance", "performance"],
    description: "HR analytics, payroll, leave and performance.",
    children: [
      { label: "Recruiting", href: "/recruiting" },
      { label: "HR Master Data", href: "/studios/master-data/hr" },
    ],
  },
  {
    id: "people", label: "People", href: "/people", icon: CircleUser,
    group: "HR", keywords: ["people registry", "contacts", "persons"],
    description: "Unified people registry.",
  },

  // ══ OPERATIONS ════════════════════════════════════════════════════
  {
    id: "procurement", label: "Procurement", href: "/procurement", icon: ShoppingCart,
    group: "Operations", keywords: ["vendors", "purchase", "requisition", "suppliers", "purchase orders", "grn"],
    description: "Procurement, purchase orders and vendor management.",
    children: [
      { label: "Vendors", href: "/procurement/vendors" },
      { label: "Assets", href: "/procurement/assets" },
    ],
  },
  {
    id: "inventory", label: "Inventory", href: "/procurement/inventory", icon: Boxes, parent: "procurement",
    group: "Operations", keywords: ["stock", "warehouse", "items", "low stock"],
    description: "Inventory and stock management.",
  },
  {
    id: "production", label: "Production", href: "/production", icon: Factory,
    group: "Operations", keywords: ["production tasks", "content", "manufacturing", "pipeline", "printing", "digital asset"],
    description: "Production task management.",
  },
  {
    id: "support", label: "Support", href: "/support", icon: Headphones,
    group: "Operations", keywords: ["tickets", "helpdesk", "sla", "knowledge base"],
    description: "Support, tickets and knowledge base.",
    children: [
      { label: "Tickets", href: "/tickets" },
      { label: "Agent Queue", href: "/support/agent" },
      { label: "Knowledge Base", href: "/knowledge" },
    ],
  },
  {
    id: "tickets", label: "Tickets", href: "/tickets", icon: Ticket, parent: "support",
    group: "Operations", keywords: ["tickets", "helpdesk", "sla", "issues"],
    description: "Support tickets and SLA tracking.",
  },
  {
    id: "knowledge", label: "Knowledge Base", href: "/knowledge", icon: Newspaper, parent: "support",
    group: "Operations", keywords: ["knowledge", "kb", "articles", "docs"],
    description: "Knowledge base and articles.",
  },
  {
    id: "transport", label: "Transport", href: "/scheduling", icon: Truck,
    group: "Operations", keywords: ["transport", "routes", "vehicles", "fleet", "visitor"],
    description: "Transport scheduling and fleet.",
  },
  {
    id: "operations", label: "Operations Center", href: "/operations", icon: Activity,
    group: "Operations", keywords: ["operations", "observability", "runtime", "monitoring"],
    description: "Operations observability platform.",
  },

  // ══ COMMUNICATION ═════════════════════════════════════════════════
  {
    id: "marketing", label: "Communication & Marketing", href: "/communication-marketing", icon: Megaphone,
    group: "Communication", keywords: ["campaigns", "communication", "email", "sms", "whatsapp", "announcements", "templates"],
    description: "Marketing campaigns, announcements and communications.",
    children: [
      { label: "Campaigns", href: "/marketing/campaigns" },
      { label: "Marketing Analytics", href: "/marketing/analytics" },
      { label: "Communication Master Data", href: "/studios/master-data/communication" },
    ],
  },

  // ══ REPORTS ═══════════════════════════════════════════════════════
  {
    id: "analytics", label: "Reports & Analytics", href: "/analytics", icon: BarChart3,
    group: "Reports", keywords: ["reports", "analytics", "charts", "dashboard", "insights", "bi", "kpi", "forecasting"],
    description: "Reports, analytics, BI and insights.",
    children: [
      { label: "Analytics", href: "/analytics" },
      { label: "Finance Reports", href: "/finance/reports" },
    ],
  },
  {
    id: "dashboards", label: "Dashboard Builder", href: "/studio/dashboards", icon: BarChart3,
    group: "Reports", keywords: ["dashboard studio", "widgets", "layouts", "kpis", "builder", "report designer"],
    description: "Design custom dashboards and report layouts.",
  },

  // ══ AI ════════════════════════════════════════════════════════════
  // (No AI studio pages exist yet — aiRuntimeEngine is backend-only. See audit.)

  // ══ INTEGRATIONS ══════════════════════════════════════════════════
  // (No integration studio pages exist yet — integrationEngine is backend-only. See audit.)

  // ══ PLATFORM ══════════════════════════════════════════════════════
  {
    id: "platform-studio", label: "Platform Studio", href: "/platform-studio", icon: Sparkles,
    group: "Platform", keywords: ["platform", "registry", "pages", "engines", "modules"],
    description: "Platform page and engine registry explorer.",
  },
  {
    id: "master-data", label: "Master Data Studio", href: "/studios/master-data", icon: Database,
    group: "Platform", keywords: ["masters", "config", "settings", "reference", "module activation"],
    description: "Central configuration repository for every module.",
  },
  {
    id: "workflow", label: "Workflow Studio", href: "/studios/workflows", icon: Workflow,
    group: "Platform", keywords: ["workflows", "automation", "triggers", "nodes"],
    description: "Design and monitor enterprise workflows.",
    children: [{ label: "Workflow Monitor", href: "/workflow-monitor" }],
  },
  {
    id: "workflow-monitor", label: "Workflow Monitor", href: "/workflow-monitor", icon: Activity, parent: "workflow",
    group: "Platform", keywords: ["workflow monitor", "executions", "runs", "monitor"],
    description: "Monitor live workflow executions and runs.",
  },
  {
    id: "forms", label: "Form Studio", href: "/studios/forms", icon: ClipboardList,
    group: "Platform", keywords: ["forms", "builder", "dynamic forms", "enquiry forms"],
    description: "Build and publish dynamic forms.",
  },
  {
    id: "deployment", label: "Deployment Center", href: "/deployment", icon: Monitor,
    group: "Platform", keywords: ["deployment", "releases", "environments", "ci cd", "backups", "logs"],
    description: "Deployment, releases and environments.",
  },
  {
    id: "release-health", label: "Release Health", href: "/release-health", icon: Activity,
    group: "Platform", keywords: ["release", "health", "readiness", "deployment"],
    description: "Release health and readiness.",
  },
  {
    id: "enterprise-health", label: "Platform Health", href: "/enterprise-health", icon: Activity,
    group: "Platform", keywords: ["enterprise health", "platform health", "runtime health", "health center"],
    description: "Enterprise platform and runtime health.",
  },
];

// ─── Helpers: sections (sidebar / mobile nav / studio launcher) ────────

export const MODULE_GROUPS: ModuleGroup[] = [
  "Home",
  "Governance",
  "Academics",
  "CRM",
  "Students",
  "Finance",
  "HR",
  "Operations",
  "Communication",
  "Reports",
  "AI",
  "Integrations",
  "Platform",
];

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

// ─── Helpers: breadcrumbs (automatic, no manual breadcrumbs) ───────────

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

// ─── Helpers: favorites (localStorage pinned modules) ──────────────────

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

// ─── Helpers: quick actions (permission-aware FAB) ─────────────────────

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

// ─── Helpers: dashboard shortcuts ───────────────────────────────────────

export function getDashboardShortcuts(role?: string): ModuleDefinition[] {
  return MODULE_REGISTRY
    .filter((m) => m.group !== "Home" && !m.isPlaceholder && (!m.roles || (role && m.roles.includes(role))))
    .slice(0, 12);
}

// ─── Helpers: module lookup ─────────────────────────────────────────────

export function getModuleById(id: string): ModuleDefinition | undefined {
  return MODULE_REGISTRY.find((m) => m.id === id);
}

export function getModuleByHref(href: string): ModuleDefinition | undefined {
  return MODULE_REGISTRY.find((m) => m.href === href);
}
