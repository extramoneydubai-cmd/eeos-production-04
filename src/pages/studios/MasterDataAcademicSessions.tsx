import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Calendar, CalendarCheck, CalendarPlus, CalendarRange, CalendarDays,
  CalendarClock, CalendarX, Clock, BookOpen, GraduationCap,
  School, Timer, AlarmClock, Hourglass, Sun,
  Palette, AlignLeft, Code, Hash, CalendarIcon,
} from "lucide-react";

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "Calendar", label: "Calendar", icon: Calendar },
  { value: "CalendarCheck", label: "Check", icon: CalendarCheck },
  { value: "CalendarPlus", label: "Add", icon: CalendarPlus },
  { value: "CalendarRange", label: "Range", icon: CalendarRange },
  { value: "CalendarDays", label: "Days", icon: CalendarDays },
  { value: "CalendarClock", label: "Clock", icon: CalendarClock },
  { value: "CalendarX", label: "Cancel", icon: CalendarX },
  { value: "Clock", label: "Time", icon: Clock },
  { value: "BookOpen", label: "Books", icon: BookOpen },
  { value: "GraduationCap", label: "Graduate", icon: GraduationCap },
  { value: "School", label: "School", icon: School },
  { value: "Timer", label: "Timer", icon: Timer },
  { value: "AlarmClock", label: "Alarm", icon: AlarmClock },
  { value: "Hourglass", label: "Hourglass", icon: Hourglass },
  { value: "Sun", label: "Summer", icon: Sun },
];

const COLOR_PRESETS = [
  "#1a73e8", "#34a853", "#ea4335", "#fbbc04", "#a855f7",
  "#e8710a", "#1a1a2e", "#5f6368", "#0d652d", "#06b6d4",
  "#4f46e5", "#0d9488", "#f43f5e", "#10b981", "#f59e0b",
  "#9aa0a6", "#e8f0fe", "#fce8e6", "#f3e8ff", "#e6f4ea",
];

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || Calendar;
}

/* ─── Helpers ─── */

function formatTimestamp(ts: number | undefined): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Academic Sessions",
  subtitle: "Manage academic calendar sessions — the root entity for all academic activities.",
  entityName: "Session",
  entityNamePlural: "Academic Sessions",
  backRoute: "/studios/master-data/academic",
  backLabel: "Back to Academic Masters",

  apiModule: {
    list: api.academicSessions.listAcademicSessions,
    get: api.academicSessions.getAcademicSession,
    create: api.academicSessions.createAcademicSession,
    update: api.academicSessions.updateAcademicSession,
    delete: api.academicSessions.deleteAcademicSession,
    duplicate: api.academicSessions.duplicateAcademicSession,
    reorder: api.academicSessions.reorderAcademicSessions,
    seedDefault: api.academicSessions.seedDefaultAcademicSessions,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.active);
    const current = items.filter((s: any) => s.isCurrent);
    const now = Date.now();
    const upcoming = items.filter((s: any) => s.startDate > now && s.isActive);
    const completed = items.filter((s: any) => s.endDate < now && s.isActive);
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      {
        label: "Current Session",
        value: current.length > 0 ? current[0].name.slice(-5) : "—",
        valueColor: "#1a73e8",
      },
      { label: "Upcoming", value: upcoming.length, valueColor: "#fbbc04" },
      { label: "Completed", value: completed.length, valueColor: "#9aa0a6" },
      {
        label: "Recently Updated",
        value: sortedByUpdated[0] ? formatDate(sortedByUpdated[0].updatedAt) : "—",
      },
    ];
  },

  getIconComponent,
  iconOptions: ICON_OPTIONS,
  colorPresets: COLOR_PRESETS,
  hasSeed: true,
  requiredRole: "super_admin",

  extraColumns: [
    {
      header: "Academic Year",
      width: "w-28",
      cell: (item: any) => (
        <span className="text-[11px] font-medium text-[#5f6368]">
          {item.academicYear}
        </span>
      ),
    },
    {
      header: "Code",
      width: "w-24",
      cell: (item: any) => (
        <span className="text-[11px] font-mono font-medium text-[#5f6368] bg-[#f1f3f4] px-1.5 py-0.5 rounded">
          {item.code}
        </span>
      ),
    },
    {
      header: "Current",
      width: "w-16",
      cell: (item: any) =>
        item.isCurrent ? (
          <span className="text-[10px] font-semibold text-[#1a73e8] bg-[#e8f0fe] px-1.5 py-0.5 rounded">
            Active
          </span>
        ) : null,
    },
  ],

  getDefaultFormExtra: () => ({
    code: "",
    description: "",
    academicYear: "",
    startDate: null,
    endDate: null,
    admissionStartDate: null,
    admissionEndDate: null,
    isCurrent: false,
  }),

  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    description: item.description || "",
    academicYear: item.academicYear || "",
    startDate: item.startDate || null,
    endDate: item.endDate || null,
    admissionStartDate: item.admissionStartDate || null,
    admissionEndDate: item.admissionEndDate || null,
    isCurrent: item.isCurrent || false,
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Session code is required.";
    if (!extra.academicYear || !extra.academicYear.trim()) return "Academic year is required.";
    if (!extra.startDate) return "Start date is required.";
    if (!extra.endDate) return "End date is required.";
    if (extra.startDate && extra.endDate && extra.endDate <= extra.startDate) {
      return "End date must be after start date.";
    }
    return null;
  },

  renderFormFields: ({
    formExtra, setFormExtra, formColor, setFormColor, formIcon, setFormIcon,
    showColorPicker, setShowColorPicker,
  }) => {
    function dateToInput(ts: number | null): string {
      if (!ts) return "";
      const d = new Date(ts);
      return d.toISOString().split("T")[0];
    }
    function inputToDate(val: string): number | null {
      if (!val) return null;
      const d = new Date(val + "T00:00:00Z");
      return d.getTime();
    }

    return (
      <>
        {/* Session Code */}
        <div>
          <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
            <Code className="h-3 w-3 inline mr-1" /> Session Code *
          </label>
          <Input
            value={formExtra.code || ""}
            onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
            className="h-8 text-[12px] font-mono"
            placeholder="e.g. AY2526"
          />
        </div>

        {/* Academic Year */}
        <div>
          <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
            <Hash className="h-3 w-3 inline mr-1" /> Academic Year *
          </label>
          <Input
            value={formExtra.academicYear || ""}
            onChange={(e) => setFormExtra("academicYear", e.target.value)}
            className="h-8 text-[12px]"
            placeholder="e.g. 2025–26"
          />
        </div>

        {/* Start Date */}
        <div>
          <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
            <CalendarIcon className="h-3 w-3 inline mr-1" /> Start Date *
          </label>
          <Input
            type="date"
            value={dateToInput(formExtra.startDate)}
            onChange={(e) => setFormExtra("startDate", inputToDate(e.target.value))}
            className="h-8 text-[12px]"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
            <CalendarIcon className="h-3 w-3 inline mr-1" /> End Date *
          </label>
          <Input
            type="date"
            value={dateToInput(formExtra.endDate)}
            onChange={(e) => setFormExtra("endDate", inputToDate(e.target.value))}
            className="h-8 text-[12px]"
          />
        </div>

        {/* Admission Start */}
        <div>
          <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
            <CalendarIcon className="h-3 w-3 inline mr-1" /> Admission Start
          </label>
          <Input
            type="date"
            value={dateToInput(formExtra.admissionStartDate)}
            onChange={(e) => setFormExtra("admissionStartDate", inputToDate(e.target.value))}
            className="h-8 text-[12px]"
          />
        </div>

        {/* Admission End */}
        <div>
          <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
            <CalendarIcon className="h-3 w-3 inline mr-1" /> Admission End
          </label>
          <Input
            type="date"
            value={dateToInput(formExtra.admissionEndDate)}
            onChange={(e) => setFormExtra("admissionEndDate", inputToDate(e.target.value))}
            className="h-8 text-[12px]"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
            <AlignLeft className="h-3 w-3 inline mr-1" /> Description
          </label>
          <textarea
            value={formExtra.description || ""}
            onChange={(e) => setFormExtra("description", e.target.value)}
            placeholder="Brief description of this academic session..."
            className="w-full min-h-[50px] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]"
            rows={2}
          />
        </div>

        {/* Current Session Toggle */}
        <div className="flex items-center justify-between py-1">
          <label className="text-[10px] text-[#5f6368] font-medium">
            Mark as Current Session
          </label>
          <Switch
            checked={formExtra.isCurrent || false}
            onCheckedChange={(val) => setFormExtra("isCurrent", val)}
          />
        </div>
        {formExtra.isCurrent && (
          <p className="text-[10px] text-[#1a73e8] -mt-1">
            ✓ This will be set as the active academic session. Previous current session will be unmarked automatically.
          </p>
        )}

        {/* Color */}
        <div>
          <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
            <Palette className="h-3 w-3 inline mr-1" /> Session Color
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-8 h-8 rounded-md border border-[#e8eaed] flex items-center justify-center hover:border-[#1a1a2e] transition-colors"
              style={{ backgroundColor: formColor }}
            >
              <span className="text-[8px] text-white font-bold" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                {formColor.replace("#", "")}
              </span>
            </button>
            <Input
              value={formColor}
              onChange={(e) => setFormColor(e.target.value)}
              className="h-8 text-[11px] font-mono w-28"
              placeholder="#000000"
            />
          </div>
          {showColorPicker && (
            <div className="flex flex-wrap gap-1.5 mt-2 p-2 rounded-lg bg-[#f8f9fa] border border-[#e8eaed]">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => { setFormColor(c); setShowColorPicker(false); }}
                  className={`w-7 h-7 rounded-md border-2 transition-all ${
                    formColor === c ? "border-[#1a1a2e] scale-110" : "border-transparent hover:border-[#9aa0a6]"
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
              <input
                type="color"
                value={formColor}
                onChange={(e) => setFormColor(e.target.value)}
                className="w-7 h-7 rounded-md border-2 border-dashed border-[#e8eaed] cursor-pointer"
                title="Custom color"
              />
            </div>
          )}
        </div>

        {/* Icon */}
        <div>
          <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">Icon</label>
          <div className="grid grid-cols-5 gap-1.5">
            {ICON_OPTIONS.map((opt) => {
              const IconComp = opt.icon;
              const isSelected = formIcon === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setFormIcon(opt.value)}
                  className={`flex flex-col items-center gap-0.5 p-1.5 rounded-md border transition-all ${
                    isSelected
                      ? "border-[#1a1a2e] bg-[#f1f3f4]"
                      : "border-[#e8eaed] hover:bg-[#f8f9fa] hover:border-[#9aa0a6]"
                  }`}
                >
                  <IconComp className="h-4 w-4 text-[#5f6368]" />
                  <span className="text-[7px] text-[#9aa0a6] leading-tight text-center">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </>
    );
  },
};

/* ─── Page ─── */

export default function MasterDataAcademicSessions() {
  return <MasterDataTable config={config} />;
}
