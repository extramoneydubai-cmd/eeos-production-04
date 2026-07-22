import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FlaskConical, BarChart3, Palette, BookOpen, HeartPulse,
  Microscope, Monitor, Briefcase, Users, Wrench, Scale,
  Paintbrush, Layers, GraduationCap, Target, TrendingUp,
  Atom, Beaker, BrainCircuit, Lightbulb, Compass, Rocket,
  Palette as PaletteIcon, AlignLeft, Code,
} from "lucide-react";

/* ─── Constants ─── */

const EDUCATION_LEVELS = [
  "Secondary",
  "Higher Secondary",
  "Undergraduate",
  "Postgraduate",
  "Doctorate",
  "Diploma",
  "Certificate",
  "General",
];

const LEVEL_COLORS: Record<string, string> = {
  Secondary: "bg-[#f1f3f4] text-[#5f6368]",
  "Higher Secondary": "bg-[#e8f0fe] text-[#1a73e8]",
  Undergraduate: "bg-[#e6f4ea] text-[#34a853]",
  Postgraduate: "bg-[#f3e8ff] text-[#a855f7]",
  Doctorate: "bg-[#fef7e0] text-[#e8710a]",
  Diploma: "bg-[#fce8e6] text-[#ea4335]",
  Certificate: "bg-[#e8eaf6] text-[#4f46e5]",
  General: "bg-[#f1f3f4] text-[#9aa0a6]",
};

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "FlaskConical", label: "Science", icon: FlaskConical },
  { value: "BarChart3", label: "Commerce", icon: BarChart3 },
  { value: "Palette", label: "Arts", icon: Palette },
  { value: "BookOpen", label: "Humanities", icon: BookOpen },
  { value: "HeartPulse", label: "Medical", icon: HeartPulse },
  { value: "Microscope", label: "Lab", icon: Microscope },
  { value: "Monitor", label: "CS", icon: Monitor },
  { value: "Briefcase", label: "Business", icon: Briefcase },
  { value: "Users", label: "Management", icon: Users },
  { value: "Wrench", label: "Engineering", icon: Wrench },
  { value: "Scale", label: "Law", icon: Scale },
  { value: "Paintbrush", label: "Design", icon: Paintbrush },
  { value: "Layers", label: "General", icon: Layers },
  { value: "GraduationCap", label: "Graduate", icon: GraduationCap },
  { value: "Target", label: "Target", icon: Target },
  { value: "TrendingUp", label: "Trending", icon: TrendingUp },
  { value: "Atom", label: "Atom", icon: Atom },
  { value: "Beaker", label: "Beaker", icon: Beaker },
  { value: "BrainCircuit", label: "Brain", icon: BrainCircuit },
  { value: "Lightbulb", label: "Idea", icon: Lightbulb },
  { value: "Compass", label: "Compass", icon: Compass },
  { value: "Rocket", label: "Rocket", icon: Rocket },
];

const COLOR_PRESETS = [
  "#4285f4", "#34a853", "#ea4335", "#fbbc04", "#a855f7",
  "#e8710a", "#06b6d4", "#0d9488", "#1a1a2e", "#f43f5e",
  "#4f46e5", "#5f6368", "#0d652d", "#10b981", "#f59e0b",
  "#9aa0a6", "#d4a017", "#e8f0fe", "#fce8e6", "#f3e8ff",
];

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || Layers;
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Academic Streams",
  subtitle: "Define specialization paths — streams represent academic disciplines and career tracks.",
  entityName: "Stream",
  entityNamePlural: "Streams",
  backRoute: "/studios/master-data/academic",
  backLabel: "Back to Academic Masters",

  apiModule: {
    list: api.academicStreams.listAcademicStreams,
    get: api.academicStreams.getAcademicStream,
    create: api.academicStreams.createAcademicStream,
    update: api.academicStreams.updateAcademicStream,
    delete: api.academicStreams.deleteAcademicStream,
    duplicate: api.academicStreams.duplicateAcademicStream,
    reorder: api.academicStreams.reorderAcademicStreams,
    seedDefault: api.academicStreams.seedDefaultAcademicStreams,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.active);
    const levels = new Set(items.map((s: any) => s.educationLevel));
    const undergrad = items.filter((s: any) => s.educationLevel === "Undergraduate");
    const hs = items.filter((s: any) => s.educationLevel === "Higher Secondary");
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Education Levels", value: levels.size, valueColor: "#4285f4" },
      { label: "Undergraduate", value: undergrad.length, valueColor: "#e8710a" },
      { label: "Higher Secondary", value: hs.length, valueColor: "#a855f7" },
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
      header: "Level",
      width: "w-28",
      cell: (item: any) => (
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${LEVEL_COLORS[item.educationLevel] || "bg-[#f1f3f4] text-[#5f6368]"}`}>
          {item.educationLevel}
        </span>
      ),
    },
  ],

  getDefaultFormExtra: () => ({
    code: "",
    educationLevel: "Higher Secondary",
    description: "",
  }),

  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    educationLevel: item.educationLevel || "Higher Secondary",
    description: item.description || "",
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Stream code is required.";
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
          <Code className="h-3 w-3 inline mr-1" /> Stream Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. SCIENCE, COMMERCE, CS"
        />
      </div>

      {/* Education Level */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <GraduationCap className="h-3 w-3 inline mr-1" /> Education Level
        </label>
        <Select value={formExtra.educationLevel || "Higher Secondary"} onValueChange={(val) => setFormExtra("educationLevel", val)}>
          <SelectTrigger className="h-8 text-[12px]">
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent>
            {EDUCATION_LEVELS.map((level) => (
              <SelectItem key={level} value={level} className="text-[12px]">{level}</SelectItem>
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
          placeholder="Brief description of this stream..."
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

export default function MasterDataStreams() {
  return <MasterDataTable config={config} />;
}
