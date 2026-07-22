import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
  Brain, HeartPulse, BookOpen, Scale, Calculator,
  ChartNoAxesColumnIncreasing, FileText, Landmark, Users,
  Building2, Train, School, GraduationCap, Globe,
  Cpu, Stethoscope, BarChart3, Palette, FlaskConical,
  Monitor, Code, Bot, FileSpreadsheet, Crown, TrendingUp,
  Headphones, Layers, AlignLeft, Baby, User, Sparkles,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "convex/react";

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "School", label: "School", icon: School },
  { value: "GraduationCap", label: "Graduate", icon: GraduationCap },
  { value: "BookOpen", label: "Books", icon: BookOpen },
  { value: "Brain", label: "Brain", icon: Brain },
  { value: "HeartPulse", label: "Medical", icon: HeartPulse },
  { value: "Scale", label: "Law", icon: Scale },
  { value: "Calculator", label: "Calc", icon: Calculator },
  { value: "ChartNoAxesColumnIncreasing", label: "Growth", icon: ChartNoAxesColumnIncreasing },
  { value: "FileText", label: "Docs", icon: FileText },
  { value: "Landmark", label: "Govt", icon: Landmark },
  { value: "Users", label: "Group", icon: Users },
  { value: "Building2", label: "Corporate", icon: Building2 },
  { value: "Train", label: "Rail", icon: Train },
  { value: "Globe", label: "Global", icon: Globe },
  { value: "Cpu", label: "Tech", icon: Cpu },
  { value: "Stethoscope", label: "Health", icon: Stethoscope },
  { value: "BarChart3", label: "Stats", icon: BarChart3 },
  { value: "Palette", label: "Arts", icon: Palette },
  { value: "FlaskConical", label: "Science", icon: FlaskConical },
  { value: "Monitor", label: "Digital", icon: Monitor },
  { value: "Code", label: "Code", icon: Code },
  { value: "Bot", label: "AI", icon: Bot },
  { value: "FileSpreadsheet", label: "Sheet", icon: FileSpreadsheet },
  { value: "Crown", label: "Leader", icon: Crown },
  { value: "TrendingUp", label: "Sales", icon: TrendingUp },
  { value: "Headphones", label: "Support", icon: Headphones },
  { value: "Layers", label: "Multi", icon: Layers },
  { value: "Sparkles", label: "Featured", icon: Sparkles },
];

const COLOR_PRESETS = [
  "#4285f4", "#34a853", "#ea4335", "#fbbc04", "#a855f7",
  "#e8710a", "#06b6d4", "#0d9488", "#1a1a2e", "#f43f5e",
  "#1a73e8", "#5f6368", "#0d652d", "#4f46e5", "#10b981",
  "#f59e0b", "#9aa0a6", "#e8f0fe", "#fce8e6", "#f3e8ff",
];

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || Layers;
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Academic Sub Verticals",
  subtitle: "Define sub-categories under each academic vertical for fine-grained classification.",
  entityName: "SubVertical",
  entityNamePlural: "Sub Verticals",
  backRoute: "/studios/master-data/academic",
  backLabel: "Back to Academic Masters",

  apiModule: {
    list: api.academicSubVerticals.listAcademicSubVerticals,
    get: api.academicSubVerticals.getAcademicSubVertical,
    create: api.academicSubVerticals.createAcademicSubVertical,
    update: api.academicSubVerticals.updateAcademicSubVertical,
    delete: api.academicSubVerticals.deleteAcademicSubVertical,
    duplicate: api.academicSubVerticals.duplicateAcademicSubVertical,
    reorder: api.academicSubVerticals.reorderAcademicSubVerticals,
    seedDefault: api.academicSubVerticals.seedDefaultAcademicSubVerticals,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.isActive);
    const verticalIds = new Set(items.map((s: any) => s.verticalId));
    const verticalCounts: Record<string, number> = {};
    items.forEach((s: any) => {
      verticalCounts[s.verticalId] = (verticalCounts[s.verticalId] || 0) + 1;
    });
    const largestVerticalInfo = Object.entries(verticalCounts).sort(([, a], [, b]) => b - a)[0];
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Parent Verticals", value: verticalIds.size },
      { label: "Largest Vertical", value: largestVerticalInfo ? `${largestVerticalInfo[1]}` : "—", valueColor: "#1a73e8" },
      { label: "Recently Updated", value: sortedByUpdated[0] ? formatDate(sortedByUpdated[0].updatedAt) : "—" },
      { label: "Avg per Vertical", value: verticalIds.size > 0 ? Math.round(items.length / verticalIds.size) : 0 },
    ];
  },

  getIconComponent,
  iconOptions: ICON_OPTIONS,
  colorPresets: COLOR_PRESETS,
  hasSeed: true,
  requiredRole: "super_admin",

  extraColumns: [
    {
      header: "Vertical",
      width: "w-36",
      cell: (item: any) => <VerticalCell verticalId={item.verticalId} />,
    },
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
      header: "Description",
      width: "w-48",
      cell: (item: any) => (
        <span className="text-[11px] text-[#5f6368] line-clamp-1">{item.description || "—"}</span>
      ),
    },
  ],

  getDefaultFormExtra: () => ({
    verticalId: "",
    code: "",
    description: "",
  }),

  getFormExtraFromItem: (item: any) => ({
    verticalId: item.verticalId || "",
    code: item.code || "",
    description: item.description || "",
  }),

  validateExtra: (extra) => {
    if (!extra.verticalId) return "Parent vertical is required.";
    if (!extra.code || !extra.code.trim()) return "Sub-vertical code is required.";
    return null;
  },

  renderFormFields: ({
    formExtra, setFormExtra, formColor, setFormColor, formIcon, setFormIcon,
    showColorPicker, setShowColorPicker,
  }) => (
    <>
      {/* Parent Vertical */}
      <VerticalDropdown value={formExtra.verticalId || ""} onChange={(val) => setFormExtra("verticalId", val)} />

      {/* Sub Vertical Code */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Code className="h-3 w-3 inline mr-1" /> Sub Vertical Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. JEE"
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
          placeholder="Brief description of this sub-vertical..."
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

/* ─── Helpers ─── */

function VerticalCell({ verticalId }: { verticalId: string }) {
  const verticals = useQuery(api.academicVerticals.listAcademicVerticals);
  const vertical = verticals?.find((v: any) => v._id === verticalId);
  if (!vertical) {
    return <span className="text-[11px] text-[#9aa0a6]">Unknown</span>;
  }
  const IconComp = getIconComponent(vertical.icon);
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: vertical.color }}>
        <IconComp className="h-2.5 w-2.5 text-white" />
      </div>
      <span className="text-[11px] font-medium text-[#5f6368]">{vertical.name}</span>
    </div>
  );
}

function VerticalDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const verticals = useQuery(api.academicVerticals.listAcademicVerticals);
  return (
    <div>
      <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
        <Layers className="h-3 w-3 inline mr-1" /> Parent Vertical *
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-[12px]">
          <SelectValue placeholder="Select vertical" />
        </SelectTrigger>
        <SelectContent>
          {verticals?.map((v: any) => {
            const IconComp = getIconComponent(v.icon);
            return (
              <SelectItem key={v._id} value={v._id} className="text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: v.color }}>
                    <IconComp className="h-2.5 w-2.5 text-white" />
                  </div>
                  <span>{v.name}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ─── Page ─── */

export default function MasterDataSubVerticals() {
  return <MasterDataTable config={config} />;
}
