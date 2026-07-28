/**
 * ScheduleTemplates — Enterprise Schedule Template Registry
 *
 * Pre-built templates for common scheduling scenarios.
 * Users can create, clone, share, and favorite templates.
 */

export type TemplateCategory =
  | "meeting" | "lecture" | "exam" | "interview" | "training"
  | "counseling" | "maintenance" | "site_visit" | "vendor_meeting"
  | "demo_session" | "parent_meeting" | "board_meeting" | "interview_panel"
  | "holiday" | "custom";

export interface ScheduleTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  defaultDurationMinutes: number;
  defaultPriority: string;
  defaultApprovalRequired: boolean;
  suggestedResources: string[];
  icon: string;
  color: string;
  tags: string[];
  isSystem: boolean;
}

const SYSTEM_TEMPLATES: ScheduleTemplate[] = [
  {
    id: "meeting",
    name: "Meeting",
    category: "meeting",
    description: "Standard team or department meeting",
    defaultDurationMinutes: 60,
    defaultPriority: "medium",
    defaultApprovalRequired: false,
    suggestedResources: ["meeting_room", "conference_room"],
    icon: "Users",
    color: "#4285f4",
    tags: ["meeting", "internal"],
    isSystem: true,
  },
  {
    id: "lecture",
    name: "Lecture",
    category: "lecture",
    description: "Academic lecture or class session",
    defaultDurationMinutes: 45,
    defaultPriority: "high",
    defaultApprovalRequired: false,
    suggestedResources: ["classroom", "lab"],
    icon: "BookOpen",
    color: "#a855f7",
    tags: ["academic", "teaching"],
    isSystem: true,
  },
  {
    id: "exam",
    name: "Examination",
    category: "exam",
    description: "Scheduled examination or test",
    defaultDurationMinutes: 180,
    defaultPriority: "urgent",
    defaultApprovalRequired: true,
    suggestedResources: ["classroom", "lab", "hall"],
    icon: "FileCheck",
    color: "#ea4335",
    tags: ["academic", "examination"],
    isSystem: true,
  },
  {
    id: "interview",
    name: "Interview",
    category: "interview",
    description: "Candidate or employee interview",
    defaultDurationMinutes: 30,
    defaultPriority: "high",
    defaultApprovalRequired: false,
    suggestedResources: ["meeting_room", "conference_room"],
    icon: "Briefcase",
    color: "#34a853",
    tags: ["hr", "recruitment"],
    isSystem: true,
  },
  {
    id: "training",
    name: "Training Session",
    category: "training",
    description: "Employee or student training session",
    defaultDurationMinutes: 120,
    defaultPriority: "medium",
    defaultApprovalRequired: false,
    suggestedResources: ["classroom", "lab", "studio"],
    icon: "GraduationCap",
    color: "#06b6d4",
    tags: ["hr", "academic", "training"],
    isSystem: true,
  },
  {
    id: "counseling",
    name: "Counseling Session",
    category: "counseling",
    description: "Student or employee counseling session",
    defaultDurationMinutes: 45,
    defaultPriority: "medium",
    defaultApprovalRequired: false,
    suggestedResources: ["meeting_room"],
    icon: "Heart",
    color: "#ec4899",
    tags: ["student", "hr", "wellness"],
    isSystem: true,
  },
  {
    id: "maintenance",
    name: "Maintenance",
    category: "maintenance",
    description: "Facility or equipment maintenance window",
    defaultDurationMinutes: 240,
    defaultPriority: "high",
    defaultApprovalRequired: true,
    suggestedResources: ["classroom", "lab", "equipment"],
    icon: "Wrench",
    color: "#f59e0b",
    tags: ["operations", "facility"],
    isSystem: true,
  },
  {
    id: "site_visit",
    name: "Site Visit",
    category: "site_visit",
    description: "On-site visit by prospect, vendor, or inspector",
    defaultDurationMinutes: 120,
    defaultPriority: "high",
    defaultApprovalRequired: true,
    suggestedResources: ["meeting_room"],
    icon: "MapPin",
    color: "#0d9488",
    tags: ["crm", "operations"],
    isSystem: true,
  },
  {
    id: "vendor_meeting",
    name: "Vendor Meeting",
    category: "vendor_meeting",
    description: "Meeting with vendor or supplier",
    defaultDurationMinutes: 60,
    defaultPriority: "medium",
    defaultApprovalRequired: false,
    suggestedResources: ["meeting_room", "conference_room"],
    icon: "Store",
    color: "#6366f1",
    tags: ["procurement", "vendor"],
    isSystem: true,
  },
  {
    id: "demo_session",
    name: "Demo Session",
    category: "demo_session",
    description: "Product or service demonstration",
    defaultDurationMinutes: 60,
    defaultPriority: "high",
    defaultApprovalRequired: false,
    suggestedResources: ["meeting_room", "studio", "lab"],
    icon: "Presentation",
    color: "#8b5cf6",
    tags: ["crm", "marketing"],
    isSystem: true,
  },
  {
    id: "parent_meeting",
    name: "Parent Meeting",
    category: "parent_meeting",
    description: "Student-parent-teacher meeting",
    defaultDurationMinutes: 30,
    defaultPriority: "high",
    defaultApprovalRequired: false,
    suggestedResources: ["meeting_room"],
    icon: "Users",
    color: "#14b8a6",
    tags: ["student", "academic"],
    isSystem: true,
  },
  {
    id: "board_meeting",
    name: "Board Meeting",
    category: "board_meeting",
    description: "Board of directors or executive meeting",
    defaultDurationMinutes: 120,
    defaultPriority: "urgent",
    defaultApprovalRequired: true,
    suggestedResources: ["conference_room"],
    icon: "Building",
    color: "#1e293b",
    tags: ["executive", "governance"],
    isSystem: true,
  },
  {
    id: "interview_panel",
    name: "Interview Panel",
    category: "interview_panel",
    description: "Panel interview with multiple interviewers",
    defaultDurationMinutes: 60,
    defaultPriority: "high",
    defaultApprovalRequired: false,
    suggestedResources: ["conference_room", "meeting_room"],
    icon: "Users",
    color: "#0ea5e9",
    tags: ["hr", "recruitment"],
    isSystem: true,
  },
  {
    id: "holiday",
    name: "Holiday / Closure",
    category: "holiday",
    description: "Public holiday or institutional closure",
    defaultDurationMinutes: 1440,
    defaultPriority: "low",
    defaultApprovalRequired: true,
    suggestedResources: [],
    icon: "Sun",
    color: "#f97316",
    tags: ["calendar", "operations"],
    isSystem: true,
  },
];

class ScheduleTemplatesImpl {
  private customTemplates: Map<string, ScheduleTemplate> = new Map();

  /** Get all templates (system + custom) */
  getAll(): ScheduleTemplate[] {
    return [...SYSTEM_TEMPLATES, ...Array.from(this.customTemplates.values())];
  }

  /** Get templates by category */
  getByCategory(category: TemplateCategory): ScheduleTemplate[] {
    return this.getAll().filter((t) => t.category === category);
  }

  /** Get a template by ID */
  get(id: string): ScheduleTemplate | undefined {
    return this.getAll().find((t) => t.id === id);
  }

  /** Add a custom template */
  add(template: ScheduleTemplate): void {
    this.customTemplates.set(template.id, template);
  }

  /** Remove a custom template */
  remove(id: string): void {
    this.customTemplates.delete(id);
  }

  /** Get system templates only */
  getSystemTemplates(): ScheduleTemplate[] {
    return SYSTEM_TEMPLATES;
  }

  /** Get default duration for a template */
  getDefaultDuration(templateId: string): number {
    return this.get(templateId)?.defaultDurationMinutes || 60;
  }
}

export const scheduleTemplates = new ScheduleTemplatesImpl();
