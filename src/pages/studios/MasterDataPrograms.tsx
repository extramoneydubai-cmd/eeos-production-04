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
  Target, Zap, Calendar, Award, Microchip,
  Clock, Timer, MapPin,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "convex/react";

/* ─── Constants ─── */

const PROGRAM_TYPES = [
  "Regular",
  "Foundation",
  "Crash",
  "Weekend",
  "Online",
  "Hybrid",
  "Corporate",
  "Certification",
];

const DELIVERY_MODES = [
  "Offline",
  "Online",
  "Hybrid",
];

const DURATION_UNITS = [
  "Days",
  "Weeks",
  "Months",
  "Years",
];

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
  { value: "Target", label: "Target", icon: Target },
  { value: "Zap", label: "Crash", icon: Zap },
  { value: "Calendar", label: "Calendar", icon: Calendar },
  { value: "Award", label: "Award", icon: Award },
  { value: "Microchip", label: "Microchip", icon: Microchip },
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

/* ─── Helpers ─── */

function SubVerticalCell({ subVerticalId }: { subVerticalId: string }) {
  const subVerticals = useQuery(api.academicSubVerticals.listAcademicSubVerticals);
  const verticals = useQuery(api.academicVerticals.listAcademicVerticals);
  const sv = subVerticals?.find((s: any) => s._id === subVerticalId);
  const vertical = sv ? verticals?.find((v: any) => v._id === sv.verticalId) : null;
  if (!sv) {
    return <span className="text-[11px] text-[#9aa0a6]">Unknown</span>;
  }
  const IconComp = getIconComponent(sv.icon);
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        <div className="w-3.5 h-3.5 rounded flex items-center justify-center" style={{ backgroundColor: sv.color }}>
          <IconComp className="h-2 w-2 text-white" />
        </div>
        <span className="text-[11px] font-medium text-[#5f6368]">{sv.name}</span>
      </div>
      {vertical && (
        <span className="text-[10px] text-[#9aa0a6] pl-5">{vertical.name}</span>
      )}
    </div>
  );
}

function SubVerticalDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const subVerticals = useQuery(api.academicSubVerticals.listAcademicSubVerticals);
  const verticals = useQuery(api.academicVerticals.listAcademicVerticals);
  const verticalMap = new Map(verticals?.map((v: any) => [v._id, v]) || []);
  return (
    <div>
      <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
        <Layers className="h-3 w-3 inline mr-1" /> Sub Vertical *
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-[12px]">
          <SelectValue placeholder="Select sub-vertical" />
        </SelectTrigger>
        <SelectContent>
          {subVerticals?.map((sv: any) => {
            const IconComp = getIconComponent(sv.icon);
            const vert = verticalMap.get(sv.verticalId);
            return (
              <SelectItem key={sv._id} value={sv._id} className="text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: sv.color }}>
                    <IconComp className="h-2.5 w-2.5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span>{sv.name}</span>
                    {vert && <span className="text-[10px] text-[#9aa0a6]">{vert.name}</span>}
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Academic Programs",
  subtitle: "Define the programs and course offerings available under each sub-vertical.",
  entityName: "Program",
  entityNamePlural: "Programs",
  backRoute: "/studios/master-data/academic",
  backLabel: "Back to Academic Masters",

  apiModule: {
    list: api.academicPrograms.listAcademicPrograms,
    get: api.academicPrograms.getAcademicProgram,
    create: api.academicPrograms.createAcademicProgram,
    update: api.academicPrograms.updateAcademicProgram,
    delete: api.academicPrograms.deleteAcademicProgram,
    duplicate: api.academicPrograms.duplicateAcademicProgram,
    reorder: api.academicPrograms.reorderAcademicPrograms,
    seedDefault: api.academicPrograms.seedDefaultAcademicPrograms,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.isActive);
    const programTypes = new Set(items.map((s: any) => s.programType));
    const deliveryModes = new Set(items.map((s: any) => s.deliveryMode));
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Program Types", value: programTypes.size, valueColor: "#1a73e8" },
      { label: "Delivery Modes", value: deliveryModes.size, valueColor: "#e8710a" },
      { label: "Recently Updated", value: sortedByUpdated[0] ? formatDate(sortedByUpdated[0].updatedAt) : "—" },
      { label: "Sub Verticals", value: new Set(items.map((s: any) => s.subVerticalId)).size },
    ];
  },

  getIconComponent,
  iconOptions: ICON_OPTIONS,
  colorPresets: COLOR_PRESETS,
  hasSeed: true,
  requiredRole: "super_admin",

  extraColumns: [
    {
      header: "Sub Vertical",
      width: "w-44",
      cell: (item: any) => <SubVerticalCell subVerticalId={item.subVerticalId} />,
    },
    {
      header: "Type",
      width: "w-20",
      cell: (item: any) => (
        <span className="text-[11px] text-[#5f6368] bg-[#f8f9fa] px-1.5 py-0.5 rounded font-medium">
          {item.programType}
        </span>
      ),
    },
    {
      header: "Duration",
      width: "w-24",
      cell: (item: any) => (
        <span className="text-[11px] text-[#5f6368]">
          {item.duration} {item.durationUnit}
        </span>
      ),
    },
    {
      header: "Delivery",
      width: "w-20",
      cell: (item: any) => {
        const colorMap: Record<string, string> = {
          Offline: "bg-[#e8f0fe] text-[#1a73e8]",
          Online: "bg-[#e6f4ea] text-[#34a853]",
          Hybrid: "bg-[#fef7e0] text-[#e8710a]",
        };
        return (
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${colorMap[item.deliveryMode] || "bg-[#f1f3f4] text-[#5f6368]"}`}>
            {item.deliveryMode}
          </span>
        );
      },
    },
  ],

  getDefaultFormExtra: () => ({
    subVerticalId: "",
    code: "",
    programType: "Regular",
    duration: 1,
    durationUnit: "Months",
    deliveryMode: "Offline",
    description: "",
  }),

  getFormExtraFromItem: (item: any) => ({
    subVerticalId: item.subVerticalId || "",
    code: item.code || "",
    programType: item.programType || "Regular",
    duration: item.duration ?? 1,
    durationUnit: item.durationUnit || "Months",
    deliveryMode: item.deliveryMode || "Offline",
    description: item.description || "",
  }),

  validateExtra: (extra) => {
    if (!extra.subVerticalId) return "Sub-vertical is required.";
    if (!extra.code || !extra.code.trim()) return "Program code is required.";
    if (!extra.duration || extra.duration < 1) return "Duration must be at least 1.";
    return null;
  },

  renderFormFields: ({
    formExtra, setFormExtra, formColor, setFormColor, formIcon, setFormIcon,
    showColorPicker, setShowColorPicker,
  }) => (
    <>
      {/* Sub Vertical */}
      <SubVerticalDropdown value={formExtra.subVerticalId || ""} onChange={(val) => setFormExtra("subVerticalId", val)} />

      {/* Program Code */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Code className="h-3 w-3 inline mr-1" /> Program Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. JEE_FOUNDATION"
        />
      </div>

      {/* Program Type */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Target className="h-3 w-3 inline mr-1" /> Program Type
        </label>
        <Select value={formExtra.programType || "Regular"} onValueChange={(val) => setFormExtra("programType", val)}>
          <SelectTrigger className="h-8 text-[12px]">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {PROGRAM_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-[12px]">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Duration + Unit */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
            <Clock className="h-3 w-3 inline mr-1" /> Duration *
          </label>
          <Input
            type="number"
            min={1}
            max={100}
            value={formExtra.duration ?? 1}
            onChange={(e) => setFormExtra("duration", Math.max(1, parseInt(e.target.value) || 1))}
            className="h-8 text-[12px]"
          />
        </div>
        <div>
          <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
            <Timer className="h-3 w-3 inline mr-1" /> Unit
          </label>
          <Select value={formExtra.durationUnit || "Months"} onValueChange={(val) => setFormExtra("durationUnit", val)}>
            <SelectTrigger className="h-8 text-[12px]">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {DURATION_UNITS.map((u) => (
                <SelectItem key={u} value={u} className="text-[12px]">{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Delivery Mode */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <MapPin className="h-3 w-3 inline mr-1" /> Delivery Mode
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

      {/* Description */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <AlignLeft className="h-3 w-3 inline mr-1" /> Description
        </label>
        <textarea
          value={formExtra.description || ""}
          onChange={(e) => setFormExtra("description", e.target.value)}
          placeholder="Brief description of this program..."
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

export default function MasterDataPrograms() {
  return <MasterDataTable config={config} />;
}
