import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
  Atom, FlaskConical, HeartPulse, Calculator, Monitor,
  TrendingUp, Building2, BarChart3, Landmark, Scale,
  Globe, Brain, BookOpen, Cpu, FileSpreadsheet,
  Crown, Headphones, Users, Target, Layers,
  Palette, AlignLeft, Code, Sparkles,
  FlaskConical as FlaskLab, Lightbulb, Wrench,
  Check, X,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/* ─── Constants ─── */

const CATEGORIES = [
  "Science",
  "Commerce",
  "Arts",
  "Languages",
  "Competitive",
  "Professional",
  "Corporate",
  "General",
];

const SUBJECT_TYPES = [
  "Core",
  "Elective",
  "Optional",
  "Skill",
  "Lab",
  "Workshop",
];

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "Atom", label: "Atom", icon: Atom },
  { value: "FlaskConical", label: "Chemistry", icon: FlaskConical },
  { value: "HeartPulse", label: "Biology", icon: HeartPulse },
  { value: "Calculator", label: "Maths", icon: Calculator },
  { value: "Monitor", label: "CS", icon: Monitor },
  { value: "TrendingUp", label: "Growth", icon: TrendingUp },
  { value: "Building2", label: "Business", icon: Building2 },
  { value: "BarChart3", label: "Stats", icon: BarChart3 },
  { value: "Landmark", label: "History", icon: Landmark },
  { value: "Scale", label: "Law", icon: Scale },
  { value: "Globe", label: "Global", icon: Globe },
  { value: "Brain", label: "Brain", icon: Brain },
  { value: "BookOpen", label: "Books", icon: BookOpen },
  { value: "Cpu", label: "Chip", icon: Cpu },
  { value: "FileSpreadsheet", label: "Sheet", icon: FileSpreadsheet },
  { value: "Crown", label: "Leader", icon: Crown },
  { value: "Headphones", label: "Support", icon: Headphones },
  { value: "Users", label: "Group", icon: Users },
  { value: "Target", label: "Target", icon: Target },
  { value: "Layers", label: "Multi", icon: Layers },
  { value: "Sparkles", label: "Featured", icon: Sparkles },
];

const COLOR_PRESETS = [
  "#4285f4", "#34a853", "#ea4335", "#fbbc04", "#a855f7",
  "#e8710a", "#06b6d4", "#0d9488", "#1a1a2e", "#f43f5e",
  "#1a73e8", "#5f6368", "#0d652d", "#4f46e5", "#10b981",
  "#f59e0b", "#9aa0a6", "#e8f0fe", "#fce8e6", "#f3e8ff",
];

const CATEGORY_COLORS: Record<string, string> = {
  Science: "bg-[#e6f4ea] text-[#34a853]",
  Commerce: "bg-[#fef7e0] text-[#e8710a]",
  Arts: "bg-[#f3e8ff] text-[#a855f7]",
  Languages: "bg-[#e8f0fe] text-[#1a73e8]",
  Competitive: "bg-[#fce8e6] text-[#ea4335]",
  Professional: "bg-[#e0f2fe] text-[#06b6d4]",
  Corporate: "bg-[#f1f3f4] text-[#5f6368]",
  General: "bg-[#f1f3f4] text-[#5f6368]",
};

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || Layers;
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Academic Subjects",
  subtitle: "Define reusable academic subjects that can be attached to programs, courses, batches, and timetable.",
  entityName: "Subject",
  entityNamePlural: "Subjects",
  backRoute: "/studios/master-data/academic",
  backLabel: "Back to Academic Masters",

  apiModule: {
    list: api.academicSubjects.listAcademicSubjects,
    get: api.academicSubjects.getAcademicSubject,
    create: api.academicSubjects.createAcademicSubject,
    update: api.academicSubjects.updateAcademicSubject,
    delete: api.academicSubjects.deleteAcademicSubject,
    duplicate: api.academicSubjects.duplicateAcademicSubject,
    reorder: api.academicSubjects.reorderAcademicSubjects,
    seedDefault: api.academicSubjects.seedDefaultAcademicSubjects,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.isActive);
    const categories = new Set(items.map((s: any) => s.category));
    const coreSubjects = items.filter((s: any) => s.subjectType === "Core");
    const practicalSubjects = items.filter((s: any) => s.isPractical);
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Categories", value: categories.size, valueColor: "#1a73e8" },
      { label: "Core Subjects", value: coreSubjects.length, valueColor: "#e8710a" },
      { label: "Practical", value: practicalSubjects.length, valueColor: "#a855f7" },
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
      header: "Category",
      width: "w-24",
      cell: (item: any) => (
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${CATEGORY_COLORS[item.category] || "bg-[#f1f3f4] text-[#5f6368]"}`}>
          {item.category}
        </span>
      ),
    },
    {
      header: "Type",
      width: "w-16",
      cell: (item: any) => (
        <span className="text-[10px] text-[#5f6368] bg-[#f1f3f4] px-1.5 py-0.5 rounded font-medium">
          {item.subjectType}
        </span>
      ),
    },
    {
      header: "Theory",
      width: "w-14",
      cell: (item: any) => (
        <span className={`inline-flex items-center gap-0.5 text-[10px] ${item.isTheory ? "text-[#34a853]" : "text-[#9aa0a6]"}`}>
          {item.isTheory ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
        </span>
      ),
    },
    {
      header: "Practical",
      width: "w-14",
      cell: (item: any) => (
        <span className={`inline-flex items-center gap-0.5 text-[10px] ${item.isPractical ? "text-[#34a853]" : "text-[#9aa0a6]"}`}>
          {item.isPractical ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
        </span>
      ),
    },
  ],

  getDefaultFormExtra: () => ({
    code: "",
    category: "Science",
    subjectType: "Core",
    isTheory: true,
    isPractical: false,
    description: "",
  }),

  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    category: item.category || "Science",
    subjectType: item.subjectType || "Core",
    isTheory: item.isTheory ?? true,
    isPractical: item.isPractical ?? false,
    description: item.description || "",
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Subject code is required.";
    return null;
  },

  renderFormFields: ({
    formExtra, setFormExtra, formColor, setFormColor, formIcon, setFormIcon,
    showColorPicker, setShowColorPicker, editingItem,
  }) => (
    <>
      {/* Code */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Code className="h-3 w-3 inline mr-1" /> Subject Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. PHYSICS"
        />
      </div>

      {/* Category */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Layers className="h-3 w-3 inline mr-1" /> Category
        </label>
        <Select value={formExtra.category || "Science"} onValueChange={(val) => setFormExtra("category", val)}>
          <SelectTrigger className="h-8 text-[12px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c} className="text-[12px]">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subject Type */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Target className="h-3 w-3 inline mr-1" /> Subject Type
        </label>
        <Select value={formExtra.subjectType || "Core"} onValueChange={(val) => setFormExtra("subjectType", val)}>
          <SelectTrigger className="h-8 text-[12px]">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {SUBJECT_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-[12px]">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Theory / Practical Toggles */}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-[#e8eaed] hover:border-[#dadce0] transition-colors">
          <input
            type="checkbox"
            checked={formExtra.isTheory ?? true}
            onChange={(e) => setFormExtra("isTheory", e.target.checked)}
            className="w-4 h-4 rounded border-[#e8eaed] accent-[#1a1a2e]"
          />
          <div>
            <span className="text-[11px] font-medium text-[#5f6368]">Theory</span>
            <p className="text-[9px] text-[#9aa0a6]">Classroom instruction</p>
          </div>
        </label>
        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-[#e8eaed] hover:border-[#dadce0] transition-colors">
          <input
            type="checkbox"
            checked={formExtra.isPractical ?? false}
            onChange={(e) => setFormExtra("isPractical", e.target.checked)}
            className="w-4 h-4 rounded border-[#e8eaed] accent-[#1a1a2e]"
          />
          <div>
            <span className="text-[11px] font-medium text-[#5f6368]">Practical</span>
            <p className="text-[9px] text-[#9aa0a6]">Lab / hands-on</p>
          </div>
        </label>
      </div>

      {/* Description */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <AlignLeft className="h-3 w-3 inline mr-1" /> Description
        </label>
        <textarea
          value={formExtra.description || ""}
          onChange={(e) => setFormExtra("description", e.target.value)}
          placeholder="Brief description of this subject..."
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

export default function MasterDataSubjects() {
  return <MasterDataTable config={config} />;
}
