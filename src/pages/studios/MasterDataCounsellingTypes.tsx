import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
  BookOpen, Briefcase, Heart, DollarSign, Monitor, Building, Video, Phone,
  DoorOpen, Users, MessageCircle, Headphones, Clock, Calendar, Pen,
  Presentation, Globe, Star, UserCheck, Sparkles,
} from "lucide-react";

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "BookOpen", label: "Academic", icon: BookOpen },
  { value: "Briefcase", label: "Career", icon: Briefcase },
  { value: "Heart", label: "Parent", icon: Heart },
  { value: "DollarSign", label: "Fee", icon: DollarSign },
  { value: "Monitor", label: "Online", icon: Monitor },
  { value: "Building", label: "Offline", icon: Building },
  { value: "Video", label: "Video", icon: Video },
  { value: "Phone", label: "Phone", icon: Phone },
  { value: "DoorOpen", label: "Walk-in", icon: DoorOpen },
  { value: "Users", label: "Group", icon: Users },
  { value: "MessageCircle", label: "Chat", icon: MessageCircle },
  { value: "Headphones", label: "Support", icon: Headphones },
  { value: "Clock", label: "Timely", icon: Clock },
  { value: "Calendar", label: "Schedule", icon: Calendar },
  { value: "Pen", label: "Guidance", icon: Pen },
  { value: "Presentation", label: "Session", icon: Presentation },
  { value: "Globe", label: "Remote", icon: Globe },
  { value: "Star", label: "Top", icon: Star },
  { value: "UserCheck", label: "Advisor", icon: UserCheck },
  { value: "Sparkles", label: "Premium", icon: Sparkles },
];

const COLOR_PRESETS = [
  "#1a73e8", "#34a853", "#ea4335", "#fbbc04", "#a855f7",
  "#e91e63", "#4f46e5", "#0d9488", "#e8710a", "#06b6d4",
  "#5f6368", "#4285f4", "#1877F2", "#25D366", "#d4a017",
  "#f43f5e", "#14b8a6", "#f97316", "#8b5cf6", "#22c55e",
];

const COUNSELLING_MODES = [
  { value: "Academic", label: "Academic" },
  { value: "Career", label: "Career" },
  { value: "Parent", label: "Parent" },
  { value: "Finance", label: "Finance" },
  { value: "Online", label: "Online" },
  { value: "Offline", label: "Offline" },
];

const MODE_COLORS: Record<string, string> = {
  Academic: "#1a73e8",
  Career: "#34a853",
  Parent: "#a855f7",
  Finance: "#d4a017",
  Online: "#4285f4",
  Offline: "#e8710a",
};

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || BookOpen;
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Counselling Types",
  subtitle: "Manage counselling session types and configurations across the CRM.",
  entityName: "CounsellingType",
  entityNamePlural: "Counselling Types",
  backRoute: "/studios/master-data/crm",
  backLabel: "Back to CRM Masters",

  apiModule: {
    list: api.crmCounsellingTypes.listCounsellingTypes,
    get: api.crmCounsellingTypes.getCounsellingType,
    create: api.crmCounsellingTypes.createCounsellingType,
    update: api.crmCounsellingTypes.updateCounsellingType,
    delete: api.crmCounsellingTypes.deleteCounsellingType,
    duplicate: api.crmCounsellingTypes.duplicateCounsellingType,
    reorder: api.crmCounsellingTypes.reorderCounsellingTypes,
    seedDefault: api.crmCounsellingTypes.seedDefault,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.active);
    const online = items.filter((s: any) => s.counsellingMode === "Online");
    const offline = items.filter((s: any) => s.counsellingMode === "Offline");
    const modes = new Set(items.map((s: any) => s.counsellingMode));
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Online", value: online.length, valueColor: "#4285f4" },
      { label: "Offline", value: offline.length, valueColor: "#e8710a" },
      { label: "Modes", value: modes.size, valueColor: "#a855f7" },
      { label: "Recently Updated", value: sortedByUpdated[0] ? formatDate(sortedByUpdated[0].updatedAt) : "—" },
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
      width: "w-20",
      cell: (item: any) => (
        <span className="text-[11px] font-mono font-medium text-[#5f6368] bg-[#f1f3f4] px-1.5 py-0.5 rounded">
          {item.code}
        </span>
      ),
    },
    {
      header: "Mode",
      width: "w-24",
      cell: (item: any) => {
        const modeColor = MODE_COLORS[item.counsellingMode] || "#9aa0a6";
        return (
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: modeColor + "18", color: modeColor }}
          >
            {item.counsellingMode}
          </span>
        );
      },
    },
    {
      header: "Min",
      width: "w-16",
      cell: (item: any) => (
        item.durationMinutes
          ? <span className="text-[11px] text-[#5f6368] font-medium">{item.durationMinutes}m</span>
          : <span className="text-[11px] text-[#9aa0a6]">—</span>
      ),
    },
  ],

  getDefaultFormExtra: () => ({ code: "", counsellingMode: "Academic", durationMinutes: 30, description: "" }),
  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    counsellingMode: item.counsellingMode || "Academic",
    durationMinutes: item.durationMinutes ?? 30,
    description: item.description || "",
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Counselling type code is required.";
    if (extra.durationMinutes && extra.durationMinutes < 1) return "Duration must be at least 1 minute.";
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
          <code className="h-3 w-3 inline mr-1 text-[10px]">&lt;/&gt;</code> Counselling Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. ACADEMIC"
        />
      </div>

      {/* Counselling Mode */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Headphones className="h-3 w-3 inline mr-1" /> Counselling Mode
        </label>
        <select
          value={formExtra.counsellingMode || "Academic"}
          onChange={(e) => setFormExtra("counsellingMode", e.target.value)}
          className="w-full h-8 text-[12px] px-2.5 rounded-lg border border-[#e8eaed] bg-white focus:outline-none focus:border-[#1a1a2e]"
        >
          {COUNSELLING_MODES.map((mode) => (
            <option key={mode.value} value={mode.value}>{mode.label}</option>
          ))}
        </select>
      </div>

      {/* Duration Minutes */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Clock className="h-3 w-3 inline mr-1" /> Duration (Minutes)
        </label>
        <Input
          type="number"
          min={1}
          value={formExtra.durationMinutes ?? ""}
          onChange={(e) => setFormExtra("durationMinutes", e.target.value ? parseInt(e.target.value) : undefined)}
          className="h-8 text-[12px]"
          placeholder="e.g. 30"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <span className="h-3 w-3 inline mr-1 text-[10px]">&#x2709;</span> Description
        </label>
        <textarea
          value={formExtra.description || ""}
          onChange={(e) => setFormExtra("description", e.target.value)}
          placeholder="Brief description of this counselling type..."
          className="w-full min-h-[50px] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]"
          rows={2}
        />
      </div>

      {/* Color */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <span className="h-3 w-3 inline mr-1 rounded-full border border-[#e8eaed]" style={{ backgroundColor: formColor }} /> Color
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

export default function MasterDataCounsellingTypes() {
  return <MasterDataTable config={config} />;
}
