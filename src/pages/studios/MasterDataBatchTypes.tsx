import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
  Sun, Moon, Calendar, Layers, BookOpen, Zap, RefreshCw,
  Monitor, Globe, TrendingUp, Palette, AlignLeft, Code,
  Target, Sparkles, Clock,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/* ─── Constants ─── */

const DELIVERY_MODES = [
  "Offline",
  "Online",
  "Hybrid",
];

const TIMING_CATEGORIES = [
  "Morning",
  "Afternoon",
  "Evening",
  "Night",
  "Weekend",
  "Flexible",
];

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "Sun", label: "Morning", icon: Sun },
  { value: "Moon", label: "Evening", icon: Moon },
  { value: "Calendar", label: "Weekend", icon: Calendar },
  { value: "Layers", label: "Foundation", icon: Layers },
  { value: "BookOpen", label: "Regular", icon: BookOpen },
  { value: "Zap", label: "Crash", icon: Zap },
  { value: "RefreshCw", label: "Revision", icon: RefreshCw },
  { value: "Monitor", label: "Hybrid", icon: Monitor },
  { value: "Globe", label: "Online", icon: Globe },
  { value: "TrendingUp", label: "Fast Track", icon: TrendingUp },
  { value: "Target", label: "Target", icon: Target },
  { value: "Sparkles", label: "Featured", icon: Sparkles },
  { value: "Clock", label: "Timing", icon: Clock },
];

const COLOR_PRESETS = [
  "#4285f4", "#34a853", "#ea4335", "#fbbc04", "#a855f7",
  "#e8710a", "#06b6d4", "#0d9488", "#1a1a2e", "#f43f5e",
  "#1a73e8", "#5f6368", "#0d652d", "#4f46e5", "#10b981",
  "#f59e0b", "#9aa0a6", "#e8f0fe", "#fce8e6", "#f3e8ff",
];

const DELIVERY_COLORS: Record<string, string> = {
  Offline: "bg-[#e8f0fe] text-[#1a73e8]",
  Online: "bg-[#e6f4ea] text-[#34a853]",
  Hybrid: "bg-[#fef7e0] text-[#e8710a]",
};

const TIMING_COLORS: Record<string, string> = {
  Morning: "bg-[#fef7e0] text-[#e8710a]",
  Afternoon: "bg-[#fff3e0] text-[#f59e0b]",
  Evening: "bg-[#f3e8ff] text-[#a855f7]",
  Night: "bg-[#e8eaf6] text-[#4f46e5]",
  Weekend: "bg-[#e6f4ea] text-[#34a853]",
  Flexible: "bg-[#f1f3f4] text-[#5f6368]",
};

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || Layers;
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Batch Types",
  subtitle: "Define reusable batch types — actual batches will use these classifications later.",
  entityName: "BatchType",
  entityNamePlural: "Batch Types",
  backRoute: "/studios/master-data/academic",
  backLabel: "Back to Academic Masters",

  apiModule: {
    list: api.academicBatchTypes.listAcademicBatchTypes,
    get: api.academicBatchTypes.getAcademicBatchType,
    create: api.academicBatchTypes.createAcademicBatchType,
    update: api.academicBatchTypes.updateAcademicBatchType,
    delete: api.academicBatchTypes.deleteAcademicBatchType,
    duplicate: api.academicBatchTypes.duplicateAcademicBatchType,
    reorder: api.academicBatchTypes.reorderAcademicBatchTypes,
    seedDefault: api.academicBatchTypes.seedDefaultAcademicBatchTypes,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.isActive);
    const deliveryModes = new Set(items.map((s: any) => s.deliveryMode));
    const timingCategories = new Set(items.map((s: any) => s.timingCategory));
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Delivery Modes", value: deliveryModes.size, valueColor: "#1a73e8" },
      { label: "Timing Categories", value: timingCategories.size, valueColor: "#e8710a" },
      { label: "Recently Updated", value: sortedByUpdated[0] ? formatDate(sortedByUpdated[0].updatedAt) : "—" },
      { label: "Weekend Batches", value: items.filter((s: any) => s.timingCategory === "Weekend").length, valueColor: "#a855f7" },
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
      width: "w-24",
      cell: (item: any) => (
        <span className="text-[11px] font-mono font-medium text-[#5f6368] bg-[#f1f3f4] px-1.5 py-0.5 rounded">
          {item.code}
        </span>
      ),
    },
    {
      header: "Delivery",
      width: "w-20",
      cell: (item: any) => (
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${DELIVERY_COLORS[item.deliveryMode] || "bg-[#f1f3f4] text-[#5f6368]"}`}>
          {item.deliveryMode}
        </span>
      ),
    },
    {
      header: "Timing",
      width: "w-20",
      cell: (item: any) => (
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${TIMING_COLORS[item.timingCategory] || "bg-[#f1f3f4] text-[#5f6368]"}`}>
          {item.timingCategory}
        </span>
      ),
    },
  ],

  getDefaultFormExtra: () => ({
    code: "",
    deliveryMode: "Offline",
    timingCategory: "Morning",
    description: "",
  }),

  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    deliveryMode: item.deliveryMode || "Offline",
    timingCategory: item.timingCategory || "Morning",
    description: item.description || "",
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Batch type code is required.";
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
          <Code className="h-3 w-3 inline mr-1" /> Batch Type Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. MORNING"
        />
      </div>

      {/* Delivery Mode */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Target className="h-3 w-3 inline mr-1" /> Delivery Mode
        </label>
        <Select value={formExtra.deliveryMode || "Offline"} onValueChange={(val) => setFormExtra("deliveryMode", val)}>
          <SelectTrigger className="h-8 text-[12px]">
            <SelectValue placeholder="Select mode" />
          </SelectTrigger>
          <SelectContent>
            {DELIVERY_MODES.map((m) => (
              <SelectItem key={m} value={m} className="text-[12px]">{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timing Category */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Clock className="h-3 w-3 inline mr-1" /> Timing Category
        </label>
        <Select value={formExtra.timingCategory || "Morning"} onValueChange={(val) => setFormExtra("timingCategory", val)}>
          <SelectTrigger className="h-8 text-[12px]">
            <SelectValue placeholder="Select timing" />
          </SelectTrigger>
          <SelectContent>
            {TIMING_CATEGORIES.map((t) => (
              <SelectItem key={t} value={t} className="text-[12px]">{t}</SelectItem>
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
          placeholder="Brief description of this batch type..."
          className="w-full min-h-[50px] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]"
          rows={2}
        />
      </div>

      {/* Color */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Palette className="h-3 w-3 inline mr-1" /> Color
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

export default function MasterDataBatchTypes() {
  return <MasterDataTable config={config} />;
}
