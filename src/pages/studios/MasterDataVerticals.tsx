import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
  School, University, Award, Briefcase, Zap,
  Building2, Monitor, Globe, BookOpen, GraduationCap,
  Layers, Palette, AlignLeft, Code, Hash, Users,
  Baby, User, Sparkles,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "School", label: "School", icon: School },
  { value: "University", label: "College", icon: University },
  { value: "Award", label: "Competitive", icon: Award },
  { value: "Briefcase", label: "Professional", icon: Briefcase },
  { value: "Zap", label: "Skills", icon: Zap },
  { value: "Building2", label: "Corporate", icon: Building2 },
  { value: "Monitor", label: "Online", icon: Monitor },
  { value: "Globe", label: "Distance", icon: Globe },
  { value: "BookOpen", label: "Books", icon: BookOpen },
  { value: "GraduationCap", label: "Graduate", icon: GraduationCap },
  { value: "Layers", label: "Multi", icon: Layers },
  { value: "Users", label: "Group", icon: Users },
  { value: "Baby", label: "Kids", icon: Baby },
  { value: "User", label: "Individual", icon: User },
  { value: "Sparkles", label: "Featured", icon: Sparkles },
];

const COLOR_PRESETS = [
  "#4285f4", "#34a853", "#ea4335", "#fbbc04", "#a855f7",
  "#e8710a", "#06b6d4", "#0d9488", "#1a1a2e", "#f43f5e",
  "#1a73e8", "#5f6368", "#0d652d", "#4f46e5", "#10b981",
  "#f59e0b", "#9aa0a6", "#e8f0fe", "#fce8e6", "#f3e8ff",
];

const EDUCATION_CATEGORIES = [
  "School",
  "College",
  "Competitive",
  "Professional",
  "Corporate",
  "Online",
];

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || School;
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Academic Verticals",
  subtitle: "Define the highest-level academic categories offered by the institute.",
  entityName: "Vertical",
  entityNamePlural: "Verticals",
  backRoute: "/studios/master-data/academic",
  backLabel: "Back to Academic Masters",

  apiModule: {
    list: api.academicVerticals.listAcademicVerticals,
    get: api.academicVerticals.getAcademicVertical,
    create: api.academicVerticals.createAcademicVertical,
    update: api.academicVerticals.updateAcademicVertical,
    delete: api.academicVerticals.deleteAcademicVertical,
    duplicate: api.academicVerticals.duplicateAcademicVertical,
    reorder: api.academicVerticals.reorderAcademicVerticals,
    seedDefault: api.academicVerticals.seedDefaultAcademicVerticals,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.isActive);
    const categories = new Set(items.map((s: any) => s.educationCategory));
    const categoryCounts: Record<string, number> = {};
    items.forEach((s: any) => {
      categoryCounts[s.educationCategory] = (categoryCounts[s.educationCategory] || 0) + 1;
    });
    const mostUsedCategory = Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "—";
    const sortedByCreated = [...items].sort((a: any, b: any) => a.createdAt - b.createdAt);
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Categories", value: categories.size },
      { label: "Most Used", value: mostUsedCategory, valueColor: "#1a73e8" },
      { label: "Recently Updated", value: sortedByUpdated[0] ? formatDate(sortedByUpdated[0].updatedAt) : "—" },
      { label: "Oldest", value: sortedByCreated[0] ? formatDate(sortedByCreated[0].createdAt) : "—" },
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
      width: "w-24",
      cell: (item: any) => (
        <span className="text-[11px] text-[#5f6368] bg-[#f8f9fa] px-1.5 py-0.5 rounded">
          {item.educationCategory}
        </span>
      ),
    },
    {
      header: "Ages",
      width: "w-20",
      cell: (item: any) => (
        <span className="text-[11px] text-[#9aa0a6]">
          {item.minimumAge ?? "—"}–{item.maximumAge ?? "—"}
        </span>
      ),
    },
  ],

  getDefaultFormExtra: () => ({
    code: "",
    description: "",
    educationCategory: "School",
    minimumAge: null,
    maximumAge: null,
  }),

  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    description: item.description || "",
    educationCategory: item.educationCategory || "School",
    minimumAge: item.minimumAge ?? null,
    maximumAge: item.maximumAge ?? null,
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Vertical code is required.";
    if (!extra.educationCategory || !extra.educationCategory.trim()) return "Education category is required.";
    return null;
  },

  renderFormFields: ({
    formExtra, setFormExtra, formColor, setFormColor, formIcon, setFormIcon,
    showColorPicker, setShowColorPicker,
  }) => (
    <>
      {/* Vertical Code */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Code className="h-3 w-3 inline mr-1" /> Vertical Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. SCHOOL"
        />
      </div>

      {/* Education Category */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Layers className="h-3 w-3 inline mr-1" /> Education Category *
        </label>
        <Select
          value={formExtra.educationCategory || ""}
          onValueChange={(val) => setFormExtra("educationCategory", val)}
        >
          <SelectTrigger className="h-8 text-[12px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {EDUCATION_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c} className="text-[12px]">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Minimum Age */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Baby className="h-3 w-3 inline mr-1" /> Minimum Age
        </label>
        <Input
          type="number"
          min={0}
          max={100}
          value={formExtra.minimumAge ?? ""}
          onChange={(e) => setFormExtra("minimumAge", e.target.value ? parseInt(e.target.value) : null)}
          className="h-8 text-[12px]"
          placeholder="e.g. 5"
        />
      </div>

      {/* Maximum Age */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <User className="h-3 w-3 inline mr-1" /> Maximum Age
        </label>
        <Input
          type="number"
          min={0}
          max={100}
          value={formExtra.maximumAge ?? ""}
          onChange={(e) => setFormExtra("maximumAge", e.target.value ? parseInt(e.target.value) : null)}
          className="h-8 text-[12px]"
          placeholder="e.g. 18"
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
          placeholder="Brief description of this academic vertical..."
          className="w-full min-h-[50px] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]"
          rows={2}
        />
      </div>

      {/* Color */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Palette className="h-3 w-3 inline mr-1" /> Vertical Color
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

export default function MasterDataVerticals() {
  return <MasterDataTable config={config} />;
}
