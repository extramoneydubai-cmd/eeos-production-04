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
  Monitor as MonitorIcon,
  Megaphone as MegaphoneIcon,
  Users as UsersIcon,
  ShoppingCart as ShoppingCartIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** A single navigation/route entry */
export interface RouteEntry {
  label: string;
  href: string;
  icon: LucideIcon;
  /** If true, the module is not yet implemented — shows "Coming Soon" */
  isPlaceholder?: boolean;
  /** Group this route belongs to (for sidebar grouping) */
  group: string;
  /** Whether this route is visible in navigation */
  visible: boolean;
}

const placeholder = true as const;
const visible = true as const;
const hidden = false as const;

/**
 * Complete EEOS route registry.
 * Every path lives here. Sidebar, breadcrumbs, and navigation all consume this.
 */
export const routes: RouteEntry[] = [
  // ── Overview ────────────────────────────────────────────────
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    group: "Overview",
    visible,
  },

  // ── Studios ─────────────────────────────────────────────────
  {
    label: "Organization",
    href: "/org",
    icon: Building2,
    group: "Studios",
    visible,
  },
  {
    label: "Master Data",
    href: "/studios/master-data",
    icon: Database,
    group: "Studios",
    visible,
  },
  {
    label: "Access Control",
    href: "/access",
    icon: Shield,
    group: "Studios",
    visible,
  },
  {
    label: "Dashboards",
    href: "/studio/dashboards",
    icon: LayoutDashboard,
    group: "Studios",
    visible,
  },
  {
    label: "Workflow",
    href: "/studios/workflows",
    icon: Workflow,
    group: "Studios",
    visible,
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: ListChecks,
    group: "Studios",
    visible,
  },

  // ── Business Modules ────────────────────────────────────────
  {
    label: "Calendar",
    href: "/calendar",
    icon: Calendar,
    group: "Business Modules",
    visible,
  },
  {
    label: "CRM",
    href: "/crm",
    icon: Users,
    group: "Business Modules",
    visible,
  },
  {
    label: "Sales",
    href: "/crm/sales",
    icon: LineChart,
    group: "Business Modules",
    visible,
  },
  {
    label: "Opportunities",
    href: "/crm/sales/opportunities",
    icon: Target,
    group: "Business Modules",
    visible,
  },
  {
    label: "Admissions",
    href: "/studio/admissions",
    icon: UserPlus,
    group: "Business Modules",
    visible,
    isPlaceholder: placeholder,
  },
  {
    label: "Students",
    href: "/students",
    icon: GraduationCap,
    group: "Business Modules",
    visible,
  },
  {
    label: "Academic",
    href: "/academic",
    icon: BookOpen,
    group: "Business Modules",
    visible,
  },
  {
    label: "Finance",
    href: "/finance",
    icon: PiggyBank,
    group: "Business Modules",
    visible,
  },
  {
    label: "People",
    href: "/people",
    icon: CircleUser,
    group: "Business Modules",
    visible,
  },
  {
    label: "Employees",
    href: "/employees",
    icon: UsersRound,
    group: "Business Modules",
    visible,
  },
  {
    label: "Marketing",
    href: "/communication-marketing",
    icon: Megaphone,
    group: "Business Modules",
    visible,
  },
  {
    label: "Administration",
    href: "/administration",
    icon: Building,
    group: "Business Modules",
    visible,
  },
  {
    label: "Procurement",
    href: "/procurement",
    icon: ShoppingCart,
    group: "Business Modules",
    visible,
  },
  {
    label: "LMS",
    href: "/lms",
    icon: BookOpen,
    group: "Business Modules",
    visible,
  },
  {
    label: "Technology",
    href: "/studio/technology",
    icon: Monitor,
    group: "Business Modules",
    visible,
    isPlaceholder: placeholder,
  },
  {
    label: "Communication",
    href: "/communication-marketing",
    icon: MessageSquare,
    group: "Business Modules",
    visible,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    group: "Business Modules",
    visible,
  },
  {
    label: "Documents",
    href: "/documents",
    icon: FileText,
    group: "Business Modules",
    visible,
  },
  {
    label: "Recruiting",
    href: "/recruiting",
    icon: ContactRound,
    group: "Business Modules",
    visible,
  },
  {
    label: "Examinations",
    href: "/examinations",
    icon: FileCheck,
    group: "Business Modules",
    visible,
  },
  {
    label: "System Analytics",
    href: "/analytics",
    icon: BarChart3,
    group: "System",
    visible,
  },
  // ── Executive Dashboards ─────────────────────────────────────
  {
    label: "Executive",
    href: "/control",
    icon: Crown,
    group: "Business Modules",
    visible,
  },
  {
    label: "Governance",
    href: "/governance",
    icon: Shield,
    group: "System",
    visible,
  },
  {
    label: "Configuration",
    href: "/configuration",
    icon: Settings,
    group: "System",
    visible,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    group: "System",
    visible,
    isPlaceholder: placeholder,
  },
];

/** Groups for sidebar rendering — preserves order */
export const routeGroups = [
  "Overview",
  "Studios",
  "Business Modules",
  "System",
] as const;

/** Get a route entry by label */
export function getRoute(label: string): RouteEntry | undefined {
  return routes.find((r) => r.label === label);
}

/** Get routes by group */
export function getRoutesByGroup(group: string): RouteEntry[] {
  return routes.filter((r) => r.group === group && r.visible);
}

/** Generate breadcrumb items from a pathname */
export function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href?: string }[] = [];

  // Build up the path progressively
  let accumulated = "";
  for (const part of parts) {
    accumulated += `/${part}`;

    // Try to find a matching route
    const route = routes.find((r) => r.href === accumulated);
    if (route) {
      crumbs.push({ label: route.label, href: accumulated });
    } else {
      // Fallback: humanize the path segment
      crumbs.push({
        label: part.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        href: accumulated,
      });
    }
  }

  // Last item is always the current page (no href)
  if (crumbs.length > 0) {
    crumbs[crumbs.length - 1].href = undefined;
  }

  return crumbs;
}
