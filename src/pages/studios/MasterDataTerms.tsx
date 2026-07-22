import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "convex/react";
import {
  BookOpen, BookText, BookCheck, BookMarked, BookType,
  Calendar, CalendarDays, CalendarClock, CalendarRange,
  Milestone, Clock, ListOrdered, Hash, Layers,
  BookA, BookPlus, Library, Notebook, NotebookPen,
  NotebookTabs, GraduationCap, Award,
  Palette, AlignLeft, Code, CalendarIcon,
} from "lucide-react";

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "BookOpen", label: "Open Book", icon: BookOpen },
  { value: "BookText", label: "Textbook", icon: BookText },
  { value: "BookCheck", label: "Check", icon: BookCheck },
  { value: "BookMarked", label: "Bookmark", icon: BookMarked },
  { value: "BookType", label: "Book Type", icon: BookType },
  { value: "Calendar", label: "Calendar", icon: Calendar },
  { value: "CalendarDays", label: "Days", icon: CalendarDays },
  { value: "CalendarClock", label: "Schedule", icon: CalendarClock },
  { value: "CalendarRange", label: "Range", icon: CalendarRange },
  { value: "Milestone", label: "Milestone", icon: Milestone },
  { value: "Clock", label: "Clock", icon: Clock },
  { value: "ListOrdered", label: "Ordered", icon: ListOrdered },
  { value: "Hash", label: "Number", icon: Hash },
  { value: "BookA", label: "Book A", icon: BookA },
  { value: "BookPlus", label: "Add Book", icon: BookPlus },
  { value: "Library", label: "Library", icon: Library },
  { value: "Notebook", label: "Notebook", icon: Notebook },
  { value: "NotebookPen", label: "Notebook Pen", icon: NotebookPen },
  { value: "NotebookTabs", label: "Tabs", icon: NotebookTabs },
  { value: "GraduationCap", label: "Graduate", icon: GraduationCap },
  { value: "Award", label: "Award", icon: Award },
];

const COLOR_PRESETS = [
  "#4285f4", "#34a853", "#ea4335", "#fbbc04", "#a855f7",
  "#e8710a", "#06b6d4", "#0d9488", "#1a1a2e", "#f43f5e",
  "#4f46e5", "#5f6368", "#0d652d", "#10b981", "#f59e0b",
  "#9aa0a6", "#d4a017", "#e8f0fe", "#fce8e6", "#f3e8ff",
];

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || BookOpen;
}

/* ─── Sub-Components ─── */

function SessionCell({ sessionId }: { sessionId: string }) {
  const sessions = useQuery(api.academicSessions.listAcademicSessions);
  const session = sessions?.find((s: any) => s._id === sessionId);
  if (!session) return <span className="text-[11px] text-[#9aa0a6]">Unknown</span>;
  const IconComp = getIconComponent(session.icon);
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3.5 h-3.5 rounded flex items-center justify-center" style={{ backgroundColor: session.color }}>
        <IconComp className="h-2 w-2 text-white" />
      </div>
      <span className="text-[11px] text-[#5f6368]">{session.academicYear}</span>
      {session.isCurrent && (
        <span className="text-[10px] font-semibold text-[#1a73e8] bg-[#e8f0fe] px-1 py-0 rounded">Current</span>
      )}
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
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Academic Terms",
  subtitle: "Define academic terms — terms are subdivisions of semesters or school years linked to sessions.",
  entityName: "Term",
  entityNamePlural: "Terms",
  backRoute: "/studios/master-data/academic",
  backLabel: "Back to Academic Masters",

  apiModule: {
    list: api.academicTerms.listAcademicTerms,
    get: api.academicTerms.getAcademicTerm,
    create: api.academicTerms.createAcademicTerm,
    update: api.academicTerms.updateAcademicTerm,
    delete: api.academicTerms.deleteAcademicTerm,
    duplicate: api.academicTerms.duplicateAcademicTerm,
    reorder: api.academicTerms.reorderAcademicTerms,
    seedDefault: api.academicTerms.seedDefaultAcademicTerms,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.active);
    const sessionsCovered = new Set(items.map((s: any) => s.academicSessionId));
    const terms = items.filter((s: any) => s.code.startsWith("TERM"));
    const quarters = items.filter((s: any) => s.code.startsWith("Q"));
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Sessions Covered", value: sessionsCovered.size, valueColor: "#4285f4" },
      { label: "Terms", value: terms.length, valueColor: "#e8710a" },
      { label: "Quarters", value: quarters.length, valueColor: "#a855f7" },
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
      width: "w-16",
      cell: (item: any) => (
        <span className="text-[11px] font-mono font-medium text-[#5f6368] bg-[#f1f3f4] px-1.5 py-0.5 rounded">
          {item.code}
        </span>
      ),
    },
    {
      header: "Session",
      width: "w-28",
      cell: (item: any) => <SessionCell sessionId={item.academicSessionId} />,
    },
    {
      header: "#",
      width: "w-12",
      cell: (item: any) => (
        <span className="text-[11px] font-semibold text-[#5f6368]">{item.termNumber}</span>
      ),
    },
  ],

  getDefaultFormExtra: () => ({
    code: "",
    academicSessionId: "",
    termNumber: 1,
    startDate: undefined,
    endDate: undefined,
    description: "",
  }),

  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    academicSessionId: item.academicSessionId || "",
    termNumber: item.termNumber || 1,
    startDate: item.startDate,
    endDate: item.endDate,
    description: item.description || "",
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Term code is required.";
    if (!extra.academicSessionId) return "Academic session is required.";
    if (extra.termNumber < 1) return "Term number must be at least 1.";
    if (extra.startDate && extra.endDate && extra.endDate <= extra.startDate) {
      return "End date must be after start date.";
    }
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
        {/* Code */}
        <div>
          <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
            <Code className="h-3 w-3 inline mr-1" /> Term Code *
          </label>
          <Input
            value={formExtra.code || ""}
            onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
            className="h-8 text-[12px] font-mono"
            placeholder="e.g. TERM1, Q1"
          />
        </div>

        {/* Academic Session */}
        <SessionDropdown
          value={formExtra.academicSessionId || ""}
          onChange={(val) => setFormExtra("academicSessionId", val)}
        />

        {/* Term Number */}
        <div>
          <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
            <ListOrdered className="h-3 w-3 inline mr-1" /> Term Number *
          </label>
          <Input
            type="number"
            min={1}
            value={formExtra.termNumber ?? 1}
            onChange={(e) => setFormExtra("termNumber", parseInt(e.target.value) || 1)}
            className="h-8 text-[12px]"
            placeholder="e.g. 1"
          />
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
            placeholder="Brief description of this term..."
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

export default function MasterDataTerms() {
  return <MasterDataTable config={config} />;
}
