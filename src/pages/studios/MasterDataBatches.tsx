import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
  BookOpen, GraduationCap, School, Users, BookOpenText,
  ClipboardList, Calendar, Clock, Notebook, Pencil,
  BookA, BookCheck, BookPlus, Library, NotebookPen,
  NotebookTabs, Sparkles,
  Sun, Moon, Target, Zap, Crown, Monitor, Globe,
  Code, Bot, Landmark, Building2, Cpu, Award, Code2,
  Palette, AlignLeft, CalendarIcon, Gauge, Layers,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "convex/react";

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "BookOpen", label: "Books", icon: BookOpen },
  { value: "GraduationCap", label: "Graduate", icon: GraduationCap },
  { value: "School", label: "School", icon: School },
  { value: "Users", label: "Students", icon: Users },
  { value: "BookOpenText", label: "Textbook", icon: BookOpenText },
  { value: "ClipboardList", label: "Roll Call", icon: ClipboardList },
  { value: "Calendar", label: "Calendar", icon: Calendar },
  { value: "Clock", label: "Clock", icon: Clock },
  { value: "Notebook", label: "Notebook", icon: Notebook },
  { value: "Pencil", label: "Pencil", icon: Pencil },
  { value: "BookA", label: "Book A", icon: BookA },
  { value: "BookCheck", label: "Check", icon: BookCheck },
  { value: "BookPlus", label: "Add Book", icon: BookPlus },
  { value: "Library", label: "Library", icon: Library },
  { value: "NotebookPen", label: "Notes", icon: NotebookPen },
  { value: "NotebookTabs", label: "Tabs", icon: NotebookTabs },
  { value: "Sparkles", label: "Featured", icon: Sparkles },
  { value: "Sun", label: "Morning", icon: Sun },
  { value: "Moon", label: "Evening", icon: Moon },
  { value: "Target", label: "Target", icon: Target },
  { value: "Zap", label: "Crash", icon: Zap },
  { value: "Crown", label: "Executive", icon: Crown },
  { value: "Monitor", label: "Online", icon: Monitor },
  { value: "Globe", label: "Hybrid", icon: Globe },
  { value: "Code", label: "Coding", icon: Code },
  { value: "Code2", label: "Python", icon: Code2 },
  { value: "Bot", label: "AI", icon: Bot },
  { value: "Landmark", label: "UPSC", icon: Landmark },
  { value: "Building2", label: "Banking", icon: Building2 },
  { value: "Cpu", label: "Engineering", icon: Cpu },
  { value: "Award", label: "Board", icon: Award },
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

function ProgramCell({ programId }: { programId: string }) {
  const programs = useQuery(api.academicPrograms.listAcademicPrograms);
  const subVerticals = useQuery(api.academicSubVerticals.listAcademicSubVerticals);
  const program = programs?.find((p: any) => p._id === programId);
  const sv = program ? (subVerticals as any[])?.find((s: any) => s._id === program.subVerticalId) : null as any;
  if (!program) return <span className="text-[11px] text-[#9aa0a6]">Unknown</span>;
  const IconComp = getIconComponent(program.icon);
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3.5 h-3.5 rounded flex items-center justify-center" style={{ backgroundColor: program.color }}>
        <IconComp className="h-2 w-2 text-white" />
      </div>
      <span className="text-[11px] font-medium text-[#5f6368]">{program.name}</span>
      {sv && <span className="text-[10px] text-[#9aa0a6]">({sv.name})</span>}
    </div>
  );
}

function BatchTypeCell({ batchTypeId }: { batchTypeId: string }) {
  const batchTypes = useQuery(api.academicBatchTypes.listAcademicBatchTypes);
  const bt = batchTypes?.find((b: any) => b._id === batchTypeId);
  if (!bt) return <span className="text-[11px] text-[#9aa0a6]">Unknown</span>;
  const IconComp = getIconComponent(bt.icon);
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3.5 h-3.5 rounded flex items-center justify-center" style={{ backgroundColor: bt.color }}>
        <IconComp className="h-2 w-2 text-white" />
      </div>
      <span className="text-[11px] text-[#5f6368]">{bt.name}</span>
      <span className="text-[10px] text-[#9aa0a6]">({bt.timingCategory})</span>
    </div>
  );
}

function SessionCell({ sessionId }: { sessionId: string }) {
  const sessions = useQuery(api.academicSessions.listAcademicSessions);
  const session = sessions?.find((s: any) => s._id === sessionId);
  if (!session) return <span className="text-[11px] text-[#9aa0a6]">Unknown</span>;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-medium text-[#5f6368]">{session.academicYear}</span>
      {session.isCurrent && (
        <span className="text-[10px] font-semibold text-[#1a73e8] bg-[#e8f0fe] px-1 py-0 rounded">Current</span>
      )}
    </div>
  );
}

function ProgramDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const programs = useQuery(api.academicPrograms.listAcademicPrograms);
  const subVerticals = useQuery(api.academicSubVerticals.listAcademicSubVerticals);
  const svMap = new Map(subVerticals?.map((sv: any) => [sv._id, sv]) || []);
  return (
    <div>
      <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
        <Layers className="h-3 w-3 inline mr-1" /> Program *
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-[12px]">
          <SelectValue placeholder="Select program" />
        </SelectTrigger>
        <SelectContent>
          {programs?.map((p: any) => {
            const IconComp = getIconComponent(p.icon);
            const sv = svMap.get(p.subVerticalId);
            return (
              <SelectItem key={p._id} value={p._id} className="text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: p.color }}>
                    <IconComp className="h-2.5 w-2.5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span>{p.name}</span>
                    {sv ? <span className="text-[10px] text-[#9aa0a6]">{(sv as any).name}</span> : null}
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

function BatchTypeDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const batchTypes = useQuery(api.academicBatchTypes.listAcademicBatchTypes);
  return (
    <div>
      <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
        <Gauge className="h-3 w-3 inline mr-1" /> Batch Type *
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-[12px]">
          <SelectValue placeholder="Select batch type" />
        </SelectTrigger>
        <SelectContent>
          {batchTypes?.map((bt: any) => {
            const IconComp = getIconComponent(bt.icon);
            return (
              <SelectItem key={bt._id} value={bt._id} className="text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: bt.color }}>
                    <IconComp className="h-2.5 w-2.5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span>{bt.name}</span>
                    <span className="text-[10px] text-[#9aa0a6]">{bt.deliveryMode} · {bt.timingCategory}</span>
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

function SessionDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const sessions = useQuery(api.academicSessions.listAcademicSessions);
  return (
    <div>
      <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
        <CalendarIcon className="h-3 w-3 inline mr-1" /> Academic Session *
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-[12px]">
          <SelectValue placeholder="Select session" />
        </SelectTrigger>
        <SelectContent>
          {sessions?.map((s: any) => {
            const IconComp = getIconComponent(s.icon);
            return (
              <SelectItem key={s._id} value={s._id} className="text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: s.color }}>
                    <IconComp className="h-2.5 w-2.5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span>{s.name}</span>
                    {s.isCurrent && <span className="text-[10px] font-semibold text-[#1a73e8]">Current</span>}
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

function formatTimestamp(ts: number | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Academic Batches",
  subtitle: "Define batch master data — program-specific batches with capacity, schedule and classification.",
  entityName: "Batch",
  entityNamePlural: "Batches",
  backRoute: "/studios/master-data/academic",
  backLabel: "Back to Academic Masters",

  apiModule: {
    list: api.academicBatches.listAcademicBatches,
    get: api.academicBatches.getAcademicBatch,
    create: api.academicBatches.createAcademicBatch,
    update: api.academicBatches.updateAcademicBatch,
    delete: api.academicBatches.deleteAcademicBatch,
    duplicate: api.academicBatches.duplicateAcademicBatch,
    reorder: api.academicBatches.reorderAcademicBatches,
    seedDefault: api.academicBatches.seedDefaultAcademicBatches,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.active);
    const programsCovered = new Set(items.map((s: any) => s.programId));
    const sessionsCovered = new Set(items.map((s: any) => s.academicSessionId));
    const avgCapacity = items.length > 0
      ? Math.round(items.reduce((sum: number, s: any) => sum + (s.capacity || 0), 0) / items.length)
      : 0;
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total Batches", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Programs", value: programsCovered.size, valueColor: "#1a73e8" },
      { label: "Sessions", value: sessionsCovered.size, valueColor: "#e8710a" },
      { label: "Avg Capacity", value: avgCapacity, valueColor: "#a855f7" },
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
      width: "w-28",
      cell: (item: any) => (
        <span className="text-[11px] font-mono font-medium text-[#5f6368] bg-[#f1f3f4] px-1.5 py-0.5 rounded">
          {item.code}
        </span>
      ),
    },
    {
      header: "Program",
      width: "w-52",
      cell: (item: any) => <ProgramCell programId={item.programId} />,
    },
    {
      header: "Batch Type",
      width: "w-40",
      cell: (item: any) => <BatchTypeCell batchTypeId={item.batchTypeId} />,
    },
    {
      header: "Session",
      width: "w-28",
      cell: (item: any) => <SessionCell sessionId={item.academicSessionId} />,
    },
    {
      header: "Capacity",
      width: "w-20",
      cell: (item: any) => {
        if (!item.capacity) return <span className="text-[11px] text-[#9aa0a6]">—</span>;
        return (
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold text-[#5f6368]">{item.capacity}</span>
            {item.minStrength && (
              <span className="text-[10px] text-[#9aa0a6]">(min {item.minStrength})</span>
            )}
          </div>
        );
      },
    },
  ],

  getDefaultFormExtra: () => ({
    code: "",
    programId: "",
    batchTypeId: "",
    academicSessionId: "",
    capacity: undefined,
    minStrength: undefined,
    maxStrength: undefined,
    startDate: undefined,
    endDate: undefined,
    description: "",
  }),

  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    programId: item.programId || "",
    batchTypeId: item.batchTypeId || "",
    academicSessionId: item.academicSessionId || "",
    capacity: item.capacity,
    minStrength: item.minStrength,
    maxStrength: item.maxStrength,
    startDate: item.startDate,
    endDate: item.endDate,
    description: item.description || "",
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Batch code is required.";
    if (!extra.programId) return "Program is required.";
    if (!extra.batchTypeId) return "Batch type is required.";
    if (!extra.academicSessionId) return "Academic session is required.";
    if (extra.maxStrength && extra.minStrength && extra.maxStrength < extra.minStrength) {
      return "Maximum strength cannot be less than minimum strength.";
    }
    if (extra.capacity && extra.capacity < 1) return "Capacity must be at least 1.";
    return null;
  },

  renderFormFields: ({
    formExtra, setFormExtra, formColor, setFormColor, formIcon, setFormIcon,
    showColorPicker, setShowColorPicker,
  }) => {
    function dateToInput(ts: number | undefined): string {
      if (!ts) return "";
      return new Date(ts).toISOString().split("T")[0];
    }
    function inputToDate(val: string): number | undefined {
      if (!val) return undefined;
      return new Date(val + "T00:00:00Z").getTime();
    }

    return (
      <>
        {/* Batch Code */}
        <div>
          <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
            <Code2 className="h-3 w-3 inline mr-1" /> Batch Code *
          </label>
          <Input
            value={formExtra.code || ""}
            onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
            className="h-8 text-[12px] font-mono"
            placeholder="e.g. JEE_FOUND_MORN_A"
          />
        </div>

        {/* Program */}
        <ProgramDropdown
          value={formExtra.programId || ""}
          onChange={(val) => setFormExtra("programId", val)}
        />

        {/* Batch Type */}
        <BatchTypeDropdown
          value={formExtra.batchTypeId || ""}
          onChange={(val) => setFormExtra("batchTypeId", val)}
        />

        {/* Academic Session */}
        <SessionDropdown
          value={formExtra.academicSessionId || ""}
          onChange={(val) => setFormExtra("academicSessionId", val)}
        />

        {/* Capacity + Strength grid */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
              <Users className="h-3 w-3 inline mr-1" /> Capacity
            </label>
            <Input
              type="number"
              min={1}
              value={formExtra.capacity ?? ""}
              onChange={(e) => setFormExtra("capacity", e.target.value ? parseInt(e.target.value) : undefined)}
              className="h-8 text-[12px]"
              placeholder="e.g. 60"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
              <Users className="h-3 w-3 inline mr-1" /> Min Strength
            </label>
            <Input
              type="number"
              min={1}
              value={formExtra.minStrength ?? ""}
              onChange={(e) => setFormExtra("minStrength", e.target.value ? parseInt(e.target.value) : undefined)}
              className="h-8 text-[12px]"
              placeholder="e.g. 20"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
              <Users className="h-3 w-3 inline mr-1" /> Max Strength
            </label>
            <Input
              type="number"
              min={1}
              value={formExtra.maxStrength ?? ""}
              onChange={(e) => setFormExtra("maxStrength", e.target.value ? parseInt(e.target.value) : undefined)}
              className="h-8 text-[12px]"
              placeholder="e.g. 65"
            />
          </div>
        </div>

        {/* Start Date + End Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
              <CalendarIcon className="h-3 w-3 inline mr-1" /> Start Date
            </label>
            <Input
              type="date"
              value={dateToInput(formExtra.startDate)}
              onChange={(e) => setFormExtra("startDate", inputToDate(e.target.value))}
              className="h-8 text-[12px]"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
              <CalendarIcon className="h-3 w-3 inline mr-1" /> End Date
            </label>
            <Input
              type="date"
              value={dateToInput(formExtra.endDate)}
              onChange={(e) => setFormExtra("endDate", inputToDate(e.target.value))}
              className="h-8 text-[12px]"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
            <AlignLeft className="h-3 w-3 inline mr-1" /> Description
          </label>
          <textarea
            value={formExtra.description || ""}
            onChange={(e) => setFormExtra("description", e.target.value)}
            placeholder="Brief description of this batch..."
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
    );
  },
};

/* ─── Page ─── */

export default function MasterDataBatches() {
  return <MasterDataTable config={config} />;
}
