import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Globe, Languages, BookText, BookMarked, BookOpen,
  BookType, Flag, FlagTriangleRight, MessageSquare,
  MessageCircle, MessageSquareText, Speech, ScrollText,
  Pencil, PenLine, PenTool,
  Palette, AlignLeft, Code, Hash,
} from "lucide-react";

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "Globe", label: "Global", icon: Globe },
  { value: "Languages", label: "Languages", icon: Languages },
  { value: "BookText", label: "Book Text", icon: BookText },
  { value: "BookMarked", label: "Bookmarked", icon: BookMarked },
  { value: "BookOpen", label: "Book Open", icon: BookOpen },
  { value: "BookType", label: "Book Type", icon: BookType },
  { value: "Flag", label: "Flag", icon: Flag },
  { value: "FlagTriangleRight", label: "Flag Right", icon: FlagTriangleRight },
  { value: "MessageSquare", label: "Square", icon: MessageSquare },
  { value: "MessageCircle", label: "Circle", icon: MessageCircle },
  { value: "MessageSquareText", label: "Text Bubble", icon: MessageSquareText },
  { value: "Speech", label: "Speech", icon: Speech },
  { value: "ScrollText", label: "Scroll", icon: ScrollText },
  { value: "Pencil", label: "Pencil", icon: Pencil },
  { value: "PenLine", label: "Pen Line", icon: PenLine },
  { value: "PenTool", label: "Pen Tool", icon: PenTool },
];

const COLOR_PRESETS = [
  "#4285f4", "#34a853", "#ea4335", "#fbbc04", "#a855f7",
  "#e8710a", "#06b6d4", "#0d9488", "#1a1a2e", "#f43f5e",
  "#4f46e5", "#5f6368", "#0d652d", "#10b981", "#f59e0b",
  "#9aa0a6", "#d4a017", "#e8f0fe", "#fce8e6", "#f3e8ff",
];

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || Globe;
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Academic Languages",
  subtitle: "Define languages offered as subjects or used for communication — distinct from mediums of instruction.",
  entityName: "Language",
  entityNamePlural: "Languages",
  backRoute: "/studios/master-data/academic",
  backLabel: "Back to Academic Masters",

  apiModule: {
    list: api.academicLanguages.listAcademicLanguages,
    get: api.academicLanguages.getAcademicLanguage,
    create: api.academicLanguages.createAcademicLanguage,
    update: api.academicLanguages.updateAcademicLanguage,
    delete: api.academicLanguages.deleteAcademicLanguage,
    duplicate: api.academicLanguages.duplicateAcademicLanguage,
    reorder: api.academicLanguages.reorderAcademicLanguages,
    seedDefault: api.academicLanguages.seedDefaultAcademicLanguages,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.active);
    const rtl = items.filter((s: any) => s.isRTL);
    const international = items.filter((s: any) => ["en", "fr", "de", "es", "ar"].includes(s.isoCode));
    const indian = items.filter((s: any) => ["hi", "ur", "ta", "ml", "kn", "mr", "gu", "pa", "bn", "sa"].includes(s.isoCode));
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "RTL Languages", value: rtl.length, valueColor: "#e8710a" },
      { label: "International", value: international.length, valueColor: "#4285f4" },
      { label: "Indian Languages", value: indian.length, valueColor: "#a855f7" },
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
      header: "ISO",
      width: "w-16",
      cell: (item: any) => (
        <span className="text-[11px] font-mono text-[#9aa0a6]">
          {item.isoCode}
        </span>
      ),
    },
    {
      header: "Native Name",
      width: "w-28",
      cell: (item: any) => (
        <span className="text-[12px] text-[#5f6368]" style={{ fontFamily: item.isRTL ? "serif" : "inherit" }} dir={item.isRTL ? "rtl" : "ltr"}>
          {item.nativeName || "—"}
        </span>
      ),
    },
    {
      header: "RTL",
      width: "w-12",
      cell: (item: any) =>
        item.isRTL ? (
          <span className="text-[10px] font-semibold text-[#e8710a] bg-[#fef7e0] px-1.5 py-0.5 rounded">
            RTL
          </span>
        ) : null,
    },
  ],

  getDefaultFormExtra: () => ({
    code: "",
    isoCode: "",
    nativeName: "",
    description: "",
    isRTL: false,
  }),

  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    isoCode: item.isoCode || "",
    nativeName: item.nativeName || "",
    description: item.description || "",
    isRTL: item.isRTL || false,
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Language code is required.";
    if (!extra.isoCode || !extra.isoCode.trim()) return "ISO code is required.";
    return null;
  },

  renderFormFields: ({
    formExtra, setFormExtra, formColor, setFormColor, formIcon, setFormIcon,
    showColorPicker, setShowColorPicker,
  }) => (
    <>
      {/* Language Code */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Code className="h-3 w-3 inline mr-1" /> Language Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. EN, HI, AR"
        />
      </div>

      {/* ISO Code */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Hash className="h-3 w-3 inline mr-1" /> ISO Code *
        </label>
        <Input
          value={formExtra.isoCode || ""}
          onChange={(e) => setFormExtra("isoCode", e.target.value.toLowerCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. en, hi, ar"
        />
      </div>

      {/* Native Name */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Languages className="h-3 w-3 inline mr-1" /> Native Name
        </label>
        <Input
          value={formExtra.nativeName || ""}
          onChange={(e) => setFormExtra("nativeName", e.target.value)}
          className="h-8 text-[12px]"
          placeholder="e.g. English, हिन्दी, العربية"
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
          placeholder="Brief description of this language..."
          className="w-full min-h-[50px] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]"
          rows={2}
        />
      </div>

      {/* RTL Toggle */}
      <div className="flex items-center justify-between py-1">
        <label className="text-[10px] text-[#5f6368] font-medium">
          Right-to-Left (RTL) Language
        </label>
        <Switch
          checked={formExtra.isRTL || false}
          onCheckedChange={(val) => setFormExtra("isRTL", val)}
        />
      </div>
      {formExtra.isRTL && (
        <p className="text-[10px] text-[#e8710a] -mt-1">
          ✓ RTL scripts (e.g. Arabic, Urdu) will render with right-to-left alignment.
        </p>
      )}

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
        <div className="grid grid-cols-4 gap-1.5">
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

export default function MasterDataLanguages() {
  return <MasterDataTable config={config} />;
}
