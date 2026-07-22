import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
  LetterText, Users, UserCircle, UsersRound, DoorOpen,
  LayoutGrid, Grid3x3, Columns3, Rows3, BookMarked,
  BookText, BookType, ClipboardList, ListChecks, Hash,
  Sun, Moon, Calendar, Award, Sigma, Trophy, Medal,
  Palette, AlignLeft, Code,
} from "lucide-react";

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "LetterText", label: "Letter", icon: LetterText },
  { value: "Users", label: "Users", icon: Users },
  { value: "UserCircle", label: "User", icon: UserCircle },
  { value: "UsersRound", label: "Group", icon: UsersRound },
  { value: "DoorOpen", label: "Door", icon: DoorOpen },
  { value: "LayoutGrid", label: "Grid", icon: LayoutGrid },
  { value: "Grid3x3", label: "Grid 3x3", icon: Grid3x3 },
  { value: "Columns3", label: "Columns", icon: Columns3 },
  { value: "Rows3", label: "Rows", icon: Rows3 },
  { value: "BookMarked", label: "Bookmarked", icon: BookMarked },
  { value: "BookText", label: "Book Text", icon: BookText },
  { value: "BookType", label: "Book Type", icon: BookType },
  { value: "ClipboardList", label: "List", icon: ClipboardList },
  { value: "ListChecks", label: "Checks", icon: ListChecks },
  { value: "Hash", label: "Hash", icon: Hash },
  { value: "Sun", label: "Sun", icon: Sun },
  { value: "Moon", label: "Moon", icon: Moon },
  { value: "Calendar", label: "Calendar", icon: Calendar },
  { value: "Award", label: "Award", icon: Award },
  { value: "Sigma", label: "Sigma", icon: Sigma },
  { value: "Trophy", label: "Trophy", icon: Trophy },
  { value: "Medal", label: "Medal", icon: Medal },
];

const COLOR_PRESETS = [
  "#4285f4", "#34a853", "#ea4335", "#fbbc04", "#a855f7",
  "#e8710a", "#06b6d4", "#0d9488", "#1a1a2e", "#f43f5e",
  "#4f46e5", "#5f6368", "#0d652d", "#10b981", "#f59e0b",
  "#9aa0a6", "#d4a017", "#e8f0fe", "#fce8e6", "#f3e8ff",
];

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || LetterText;
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Academic Sections",
  subtitle: "Define classroom divisions — sections represent classroom or batch divisions within programs.",
  entityName: "Section",
  entityNamePlural: "Sections",
  backRoute: "/studios/master-data/academic",
  backLabel: "Back to Academic Masters",

  apiModule: {
    list: api.academicSections.listAcademicSections,
    get: api.academicSections.getAcademicSection,
    create: api.academicSections.createAcademicSection,
    update: api.academicSections.updateAcademicSection,
    delete: api.academicSections.deleteAcademicSection,
    duplicate: api.academicSections.duplicateAcademicSection,
    reorder: api.academicSections.reorderAcademicSections,
    seedDefault: api.academicSections.seedDefaultAcademicSections,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.active);
    const inactive = items.filter((s: any) => !s.active);
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Inactive", value: inactive.length, valueColor: "#9aa0a6" },
      { label: "By Letter", value: items.filter((s: any) => /^[A-H]$/.test(s.code)).length, valueColor: "#4285f4" },
      { label: "By Name", value: items.filter((s: any) => !/^[A-H]$/.test(s.code)).length, valueColor: "#e8710a" },
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
      width: "w-20",
      cell: (item: any) => (
        <span className="text-[11px] font-mono font-medium text-[#5f6368] bg-[#f1f3f4] px-1.5 py-0.5 rounded">
          {item.code}
        </span>
      ),
    },
  ],

  getDefaultFormExtra: () => ({
    code: "",
    description: "",
  }),

  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    description: item.description || "",
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Section code is required.";
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
          <Code className="h-3 w-3 inline mr-1" /> Section Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. A, MORNING, ALPHA"
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
          placeholder="Brief description of this section..."
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

export default function MasterDataSections() {
  return <MasterDataTable config={config} />;
}
