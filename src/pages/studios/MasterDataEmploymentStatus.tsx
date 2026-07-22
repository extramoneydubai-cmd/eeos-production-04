import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BadgeCheck, Clock, Bell, LogOut, Ban, Heart,
  CalendarOff, ShieldAlert, UserX, UserMinus,
  CircleDot, AlertTriangle, CheckCircle2, XCircle, PauseCircle,
  Palette as PaletteIcon, AlignLeft, Code,
} from "lucide-react";

/* ─── Constants ─── */

const STATUS_CATEGORIES = [
  "Active",
  "Inactive",
  "Transition",
  "Termination",
  "Leave",
];

const CATEGORY_COLORS: Record<string, string> = {
  Active: "bg-[#e6f4ea] text-[#34a853]",
  Inactive: "bg-[#f1f3f4] text-[#9aa0a6]",
  Transition: "bg-[#fef7e0] text-[#e8710a]",
  Termination: "bg-[#fce8e6] text-[#ea4335]",
  Leave: "bg-[#e8f0fe] text-[#4285f4]",
};

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "BadgeCheck", label: "Verified", icon: BadgeCheck },
  { value: "Clock", label: "Clock", icon: Clock },
  { value: "Bell", label: "Notice", icon: Bell },
  { value: "LogOut", label: "Exit", icon: LogOut },
  { value: "Ban", label: "Banned", icon: Ban },
  { value: "Heart", label: "Retired", icon: Heart },
  { value: "CalendarOff", label: "Leave", icon: CalendarOff },
  { value: "ShieldAlert", label: "Suspended", icon: ShieldAlert },
  { value: "UserX", label: "Removed", icon: UserX },
  { value: "UserMinus", label: "Inactive", icon: UserMinus },
  { value: "CircleDot", label: "Active", icon: CircleDot },
  { value: "AlertTriangle", label: "Warning", icon: AlertTriangle },
  { value: "CheckCircle2", label: "Complete", icon: CheckCircle2 },
  { value: "XCircle", label: "Failed", icon: XCircle },
  { value: "PauseCircle", label: "Paused", icon: PauseCircle },
];

const COLOR_PRESETS = [
  "#4285f4", "#34a853", "#ea4335", "#fbbc04", "#a855f7",
  "#e8710a", "#06b6d4", "#0d9488", "#1a1a2e", "#f43f5e",
  "#4f46e5", "#5f6368", "#0d652d", "#10b981", "#f59e0b",
  "#9aa0a6", "#d93025", "#e8f0fe", "#fce8e6", "#f3e8ff",
];

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || BadgeCheck;
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Employment Statuses",
  subtitle: "Define employment statuses — track employee lifecycle stages, attendance, and separation.",
  entityName: "Employment Status",
  entityNamePlural: "Employment Statuses",
  backRoute: "/studios/master-data/hr",
  backLabel: "Back to HR Masters",

  apiModule: {
    list: api.hrEmploymentStatuses.listEmploymentStatuses,
    get: api.hrEmploymentStatuses.getEmploymentStatus,
    create: api.hrEmploymentStatuses.createEmploymentStatus,
    update: api.hrEmploymentStatuses.updateEmploymentStatus,
    delete: api.hrEmploymentStatuses.deleteEmploymentStatus,
    duplicate: api.hrEmploymentStatuses.duplicateEmploymentStatus,
    reorder: api.hrEmploymentStatuses.reorderEmploymentStatuses,
    seedDefault: api.hrEmploymentStatuses.seedDefaultEmploymentStatuses,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((t: any) => t.active);
    const categories = new Set(items.map((t: any) => t.statusCategory));
    const termination = items.filter((t: any) => t.statusCategory === "Termination");
    const leave = items.filter((t: any) => t.statusCategory === "Leave");
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Categories", value: categories.size, valueColor: "#a855f7" },
      { label: "Termination", value: termination.length, valueColor: "#ea4335" },
      { label: "On Leave", value: leave.length, valueColor: "#4285f4" },
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
      header: "Code",
      width: "w-28",
      cell: (item: any) => (
        <span className="text-[11px] font-mono font-medium text-[#5f6368] bg-[#f1f3f4] px-1.5 py-0.5 rounded">
          {item.code}
        </span>
      ),
    },
    {
      header: "Category",
      width: "w-28",
      cell: (item: any) => (
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${CATEGORY_COLORS[item.statusCategory] || "bg-[#f1f3f4] text-[#5f6368]"}`}>
          {item.statusCategory}
        </span>
      ),
    },
  ],

  getDefaultFormExtra: () => ({
    code: "",
    statusCategory: "Active",
    description: "",
  }),

  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    statusCategory: item.statusCategory || "Active",
    description: item.description || "",
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Status code is required.";
    return null;
  },

  renderFormFields: ({
    formExtra, setFormExtra, formColor, setFormColor, formIcon, setFormIcon,
    showColorPicker, setShowColorPicker,
  }) => (
    <>
      {/* Code */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Code className="h-3 w-3 inline mr-1" /> Status Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. ACTIVE, RESIGNED, ON_LEAVE"
        />
      </div>

      {/* Status Category */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <CircleDot className="h-3 w-3 inline mr-1" /> Status Category
        </label>
        <Select
          value={formExtra.statusCategory || "Active"}
          onValueChange={(val) => setFormExtra("statusCategory", val)}
        >
          <SelectTrigger className="h-8 text-[12px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat} className="text-[12px]">{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <AlignLeft className="h-3 w-3 inline mr-1" /> Description
        </label>
        <textarea
          value={formExtra.description || ""}
          onChange={(e) => setFormExtra("description", e.target.value)}
          placeholder="Brief description of this employment status..."
          className="w-full min-h-[50px] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]"
          rows={2}
        />
      </div>

      {/* Color */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <PaletteIcon className="h-3 w-3 inline mr-1" /> Color
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
  ),
};

/* ─── Page ─── */

export default function MasterDataEmploymentStatus() {
  return <MasterDataTable config={config} />;
}
