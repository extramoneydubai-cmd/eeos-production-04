/**
 * Shared schedule → module taxonomy.
 *
 * Schedules carry free-form `scheduleType` values (class, meeting, exam,
 * workshop, interview, ...) from the scheduling runtime. This module maps them
 * into the enterprise module taxonomy so module-scoped views — the Org Calendar
 * and the Scheduler workspace — stay consistent with each other.
 */

export const SCHEDULE_MODULES = [
  { id: "academic", label: "Academic", color: "#a855f7" },
  { id: "hr", label: "HR", color: "#4285f4" },
  { id: "finance", label: "Finance", color: "#22c55e" },
  { id: "marketing", label: "Marketing", color: "#f59e0b" },
  { id: "sales", label: "Sales", color: "#ec4899" },
  { id: "operations", label: "Operations", color: "#f97316" },
  { id: "exams", label: "Exams", color: "#ef4444" },
  { id: "training", label: "Training", color: "#06b6d4" },
  { id: "facility", label: "Facility", color: "#6366f1" },
] as const;

export const MODULE_COLORS: Record<string, string> = {};
export const MODULE_LABELS: Record<string, string> = {};
export const MODULE_BADGE_CLASSES: Record<string, string> = {};

// Literal class strings so Tailwind's JIT picks them up; hex colors are kept
// for inline styles (calendar dots, legend swatches).
MODULE_BADGE_CLASSES.academic = "bg-[#a855f7]";
MODULE_BADGE_CLASSES.hr = "bg-[#4285f4]";
MODULE_BADGE_CLASSES.finance = "bg-[#22c55e]";
MODULE_BADGE_CLASSES.marketing = "bg-[#f59e0b]";
MODULE_BADGE_CLASSES.sales = "bg-[#ec4899]";
MODULE_BADGE_CLASSES.operations = "bg-[#f97316]";
MODULE_BADGE_CLASSES.exams = "bg-[#ef4444]";
MODULE_BADGE_CLASSES.training = "bg-[#06b6d4]";
MODULE_BADGE_CLASSES.facility = "bg-[#6366f1]";

for (const m of SCHEDULE_MODULES) {
  MODULE_COLORS[m.id] = m.color;
  MODULE_LABELS[m.id] = m.label;
}

/** Free-form schedule types → module ids (from the scheduling runtime). */
export const SCHEDULE_TYPE_TO_MODULE: Record<string, string> = {
  class: "academic",
  lecture: "academic",
  lab: "academic",
  exam: "exams",
  exam_duty: "exams",
  training: "training",
  workshop: "training",
  interview: "hr",
  holiday: "hr",
  office_hours: "hr",
  counseling: "sales",
  meeting: "operations",
  maintenance: "facility",
  payment_run: "finance",
  budget_review: "finance",
  invoice_deadline: "finance",
  campaign: "marketing",
  event: "marketing",
  other: "operations",
};

/** Human-readable labels for schedule types. */
export const SCHEDULE_TYPE_LABELS: Record<string, string> = {
  class: "Class",
  lecture: "Lecture",
  lab: "Lab",
  exam: "Exam",
  exam_duty: "Exam Duty",
  training: "Training",
  workshop: "Workshop",
  interview: "Interview",
  holiday: "Holiday",
  office_hours: "Office Hours",
  counseling: "Counseling",
  meeting: "Meeting",
  maintenance: "Maintenance",
  payment_run: "Payment Run",
  budget_review: "Budget Review",
  invoice_deadline: "Invoice Deadline",
  campaign: "Campaign",
  event: "Event",
  other: "Other",
};

/**
 * Resolve the module id for a schedule type. Known types map into the module
 * taxonomy; a value that is already a module id passes through; anything else
 * stays as-is (still visible under "All Modules" and in module counts).
 */
export function moduleForScheduleType(type: string | undefined | null): string {
  if (!type) return "operations";
  const t = type.toLowerCase();
  return SCHEDULE_TYPE_TO_MODULE[t] || t;
}

export interface ScheduleTypeLegendItem {
  type: string;
  label: string;
  module: string;
  moduleLabel: string;
  moduleColor: string;
}

/** Legend rows: schedule type → module, colored by module. */
export const SCHEDULE_TYPE_LEGEND: ScheduleTypeLegendItem[] = Object.keys(SCHEDULE_TYPE_TO_MODULE).map((type) => {
  const module = SCHEDULE_TYPE_TO_MODULE[type];
  return {
    type,
    label: SCHEDULE_TYPE_LABELS[type] || type,
    module,
    moduleLabel: MODULE_LABELS[module] || module,
    moduleColor: MODULE_COLORS[module] || "#9aa0a6",
  };
});
