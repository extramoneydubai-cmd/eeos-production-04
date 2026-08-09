import {
  Building2, Database, Shield, Workflow, ListChecks,
  Users, LineChart, GraduationCap, UserPlus, BookOpen,
  PiggyBank, UsersRound, Megaphone, Building, Monitor,
  MessageSquare, BarChart3, Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Module status for feature flagging */
export type ModuleStatus = "enabled" | "disabled" | "beta" | "coming-soon" | "hidden";

/** A single Studio definition */
export interface StudioDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
  status: ModuleStatus;
  /** Which group in the sidebar this studio belongs to */
  group: "studio" | "module" | "system";
  /** Route group name for the route registry */
  routeGroup: string;
  /** Permission scope needed to access this studio */
  permissionScope?: string;
  /** Order within its group */
  order: number;
}

/**
 * EEOS Studio Registry
 * Every studio and business module is defined here.
 * Feature flags, status, permissions, and navigation all consume this.
 */
export const studios: StudioDefinition[] = [
  // ── Studios ──────────────────────────────────────────────────
  {
    id: "org",
    name: "Organization",
    description: "Manage companies, branches, departments, and teams",
    icon: Building2,
    href: "/studio/org",
    status: "enabled",
    group: "studio",
    routeGroup: "Studios",
    order: 1,
  },
  {
    id: "master-data",
    name: "Master Data",
    description: "Central configuration repository for all modules",
    icon: Database,
    href: "/studio/master-data",
    status: "enabled",
    group: "studio",
    routeGroup: "Studios",
    order: 2,
  },
  {
    id: "access-control",
    name: "Access Control",
    description: "Roles, permissions, and security policies",
    icon: Shield,
    href: "/studio/access",
    status: "enabled",
    group: "studio",
    routeGroup: "Studios",
    order: 3,
  },
  {
    id: "workflow",
    name: "Workflow Engine",
    description: "Automate business processes and approvals",
    icon: Workflow,
    href: "/studio/workflow",
    status: "enabled",
    group: "studio",
    routeGroup: "Studios",
    order: 4,
  },
  {
    id: "tasks",
    name: "Task Management",
    description: "Track and manage tasks across teams",
    icon: ListChecks,
    href: "/studio/tasks",
    status: "enabled",
    group: "studio",
    routeGroup: "Studios",
    order: 5,
  },

  // ── Business Modules ─────────────────────────────────────────
  {
    id: "crm",
    name: "CRM",
    description: "Customer relationship and lead management",
    icon: Users,
    href: "/studio/crm",
    status: "coming-soon",
    group: "module",
    routeGroup: "Business Modules",
    order: 1,
  },
  {
    id: "sales",
    name: "Sales",
    description: "Pipeline tracking and revenue forecasting",
    icon: LineChart,
    href: "/studio/sales",
    status: "coming-soon",
    group: "module",
    routeGroup: "Business Modules",
    order: 2,
  },
  {
    id: "admissions",
    name: "Admissions",
    description: "Student registration and enrollment management",
    icon: UserPlus,
    href: "/admissions",
    status: "coming-soon",
    group: "module",
    routeGroup: "Business Modules",
    order: 3,
  },
  {
    id: "student",
    name: "Student",
    description: "Student 360° profiles and academic history",
    icon: GraduationCap,
    href: "/studio/student",
    status: "coming-soon",
    group: "module",
    routeGroup: "Business Modules",
    order: 4,
  },
  {
    id: "academic",
    name: "Academic",
    description: "Programs, batches, attendance, and examinations",
    icon: BookOpen,
    href: "/studio/academic",
    status: "coming-soon",
    group: "module",
    routeGroup: "Business Modules",
    order: 5,
  },
  {
    id: "finance",
    name: "Finance",
    description: "Fee structures, invoices, collections, and payments",
    icon: PiggyBank,
    href: "/studio/finance",
    status: "coming-soon",
    group: "module",
    routeGroup: "Business Modules",
    order: 6,
  },
  {
    id: "hr",
    name: "HR",
    description: "Employee lifecycle, attendance, and payroll",
    icon: UsersRound,
    href: "/studio/hr",
    status: "coming-soon",
    group: "module",
    routeGroup: "Business Modules",
    order: 7,
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "Campaigns, sources, and demand generation",
    icon: Megaphone,
    href: "/studio/marketing",
    status: "coming-soon",
    group: "module",
    routeGroup: "Business Modules",
    order: 8,
  },
  {
    id: "administration",
    name: "Administration",
    description: "Facilities, assets, and operations",
    icon: Building,
    href: "/studio/administration",
    status: "coming-soon",
    group: "module",
    routeGroup: "Business Modules",
    order: 9,
  },
  {
    id: "technology",
    name: "Technology",
    description: "IT assets, licenses, and subscriptions",
    icon: Monitor,
    href: "/studio/technology",
    status: "coming-soon",
    group: "module",
    routeGroup: "Business Modules",
    order: 10,
  },
  {
    id: "communication",
    name: "Communication",
    description: "WhatsApp, SMS, email, and notifications",
    icon: MessageSquare,
    href: "/studio/communication",
    status: "coming-soon",
    group: "module",
    routeGroup: "Business Modules",
    order: 11,
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "Reports, dashboards, and business intelligence",
    icon: BarChart3,
    href: "/studio/analytics",
    status: "coming-soon",
    group: "module",
    routeGroup: "Business Modules",
    order: 12,
  },

  // ── System ───────────────────────────────────────────────────
  {
    id: "settings",
    name: "Settings",
    description: "Application configuration and preferences",
    icon: Settings,
    href: "/settings",
    status: "coming-soon",
    group: "system",
    routeGroup: "System",
    order: 1,
  },
];

/** Get active studios for a given group */
export function getStudiosByGroup(group: StudioDefinition["group"]): StudioDefinition[] {
  return studios
    .filter((s) => s.group === group)
    .sort((a, b) => a.order - b.order);
}

/** Get a studio by ID */
export function getStudio(id: string): StudioDefinition | undefined {
  return studios.find((s) => s.id === id);
}

/** Check if a module is available (enabled or beta) */
export function isModuleAvailable(id: string): boolean {
  const s = getStudio(id);
  if (!s) return false;
  return s.status === "enabled" || s.status === "beta";
}

/** Get the sidebar badge label for a studio */
export function getStatusBadge(status: ModuleStatus): string | null {
  switch (status) {
    case "beta": return "Beta";
    case "coming-soon": return "Soon";
    case "enabled": return null;
    case "disabled": return "Off";
    case "hidden": return null;
  }
}
