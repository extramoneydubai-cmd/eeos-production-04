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
    href: "/studio/org",
    icon: Building2,
    group: "Studios",
    visible,
  },
  {
    label: "Master Data",
    href: "/studio/master-data",
    icon: Database,
    group: "Studios",
    visible,
  },
  {
    label: "Access Control",
    href: "/studio/access",
    icon: Shield,
    group: "Studios",
    visible,
  },
  {
    label: "Workflow",
    href: "/studio/workflow",
    icon: Workflow,
    group: "Studios",
    visible,
  },
  {
    label: "Task Management",
    href: "/studio/tasks",
    icon: ListChecks,
    group: "Studios",
    visible,
  },

  // ── Business Modules ────────────────────────────────────────
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
    label: "Student",
    href: "/studio/student",
    icon: GraduationCap,
    group: "Business Modules",
    visible,
    isPlaceholder: placeholder,
  },
  {
    label: "Academic",
    href: "/studio/academic",
    icon: BookOpen,
    group: "Business Modules",
    visible,
    isPlaceholder: placeholder,
  },
  {
    label: "Finance",
    href: "/studio/finance",
    icon: PiggyBank,
    group: "Business Modules",
    visible,
    isPlaceholder: placeholder,
  },
  {
    label: "HR",
    href: "/studio/hr",
    icon: UsersRound,
    group: "Business Modules",
    visible,
    isPlaceholder: placeholder,
  },
  {
    label: "Marketing",
    href: "/studio/marketing",
    icon: Megaphone,
    group: "Business Modules",
    visible,
    isPlaceholder: placeholder,
  },
  {
    label: "Administration",
    href: "/studio/administration",
    icon: Building,
    group: "Business Modules",
    visible,
    isPlaceholder: placeholder,
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
    href: "/studio/communication",
    icon: MessageSquare,
    group: "Business Modules",
    visible,
    isPlaceholder: placeholder,
  },
  {
    label: "Analytics",
    href: "/studio/analytics",
    icon: BarChart3,
    group: "Business Modules",
    visible,
    isPlaceholder: placeholder,
  },
  {
    label: "Recruiting",
    href: "/recruiting",
    icon: ContactRound,
    group: "Business Modules",
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
