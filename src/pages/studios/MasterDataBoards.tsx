import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
  GraduationCap, BookOpen, Landmark, Globe, Globe2,
  BookMarked, University, DoorOpen, Library, Award,
  BookOpenCheck, School, ScrollText, Medal, BookCopy,
  Palette, AlignLeft, Code, Hash, Link, MapPin, Layers,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "GraduationCap", label: "Graduate", icon: GraduationCap },
  { value: "BookOpen", label: "Book", icon: BookOpen },
  { value: "Landmark", label: "Landmark", icon: Landmark },
  { value: "Globe", label: "Globe", icon: Globe },
  { value: "Globe2", label: "World", icon: Globe2 },
  { value: "BookMarked", label: "Bookmarked", icon: BookMarked },
  { value: "University", label: "University", icon: University },
  { value: "DoorOpen", label: "Open Door", icon: DoorOpen },
  { value: "Library", label: "Library", icon: Library },
  { value: "Award", label: "Award", icon: Award },
  { value: "BookOpenCheck", label: "Checked", icon: BookOpenCheck },
  { value: "School", label: "School", icon: School },
  { value: "ScrollText", label: "Scroll", icon: ScrollText },
  { value: "Medal", label: "Medal", icon: Medal },
  { value: "BookCopy", label: "Copy", icon: BookCopy },
];

const COLOR_PRESETS = [
  "#4285f4", "#34a853", "#ea4335", "#fbbc04", "#a855f7",
  "#e8710a", "#06b6d4", "#0d9488", "#1a1a2e", "#f43f5e",
  "#1a73e8", "#5f6368", "#0d652d", "#4f46e5", "#10b981",
  "#f59e0b", "#9aa0a6", "#e8f0fe", "#fce8e6", "#f3e8ff",
];

const EDUCATION_LEVELS = [
  "School",
  "Higher Secondary",
  "College",
  "University",
  "Professional",
];

const COUNTRIES = [
  "India",
  "International",
  "UAE",
  "UK",
  "USA",
  "Singapore",
  "Australia",
  "Canada",
];

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || GraduationCap;
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Boards",
  subtitle: "Configure academic governing boards under which courses and programs operate.",
  entityName: "Board",
  entityNamePlural: "Boards",
  backRoute: "/studios/master-data/academic",
  backLabel: "Back to Academic Masters",

  apiModule: {
    list: api.academicBoards.listAcademicBoards,
    get: api.academicBoards.getAcademicBoard,
    create: api.academicBoards.createAcademicBoard,
    update: api.academicBoards.updateAcademicBoard,
    delete: api.academicBoards.deleteAcademicBoard,
    duplicate: api.academicBoards.duplicateAcademicBoard,
    reorder: api.academicBoards.reorderAcademicBoards,
    seedDefault: api.academicBoards.seedDefaultAcademicBoards,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.isActive);
    const countries = new Set(items.map((s: any) => s.country));
    const levels = new Set(items.map((s: any) => s.educationLevel));
    const international = items.filter((s: any) => s.country === "International");
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Countries", value: countries.size },
      { label: "Education Levels", value: levels.size },
      { label: "International", value: international.length, valueColor: "#1a73e8" },
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
      width: "w-20",
      cell: (item: any) => (
        <span className="text-[11px] font-mono font-medium text-[#5f6368] bg-[#f1f3f4] px-1.5 py-0.5 rounded">
          {item.code}
        </span>
      ),
    },
    {
      header: "Country",
      width: "w-24",
      cell: (item: any) => (
        <span className="text-[11px] text-[#5f6368]">{item.country}</span>
      ),
    },
    {
      header: "Level",
      width: "w-24",
      cell: (item: any) => (
        <span className="text-[11px] text-[#5f6368] bg-[#f8f9fa] px-1.5 py-0.5 rounded">
          {item.educationLevel}
        </span>
      ),
    },
  ],

  getDefaultFormExtra: () => ({
    code: "",
    description: "",
    shortName: "",
    country: "India",
    educationLevel: "Higher Secondary",
    website: "",
  }),

  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    description: item.description || "",
    shortName: item.shortName || "",
    country: item.country || "India",
    educationLevel: item.educationLevel || "Higher Secondary",
    website: item.website || "",
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Board code is required.";
    if (!extra.shortName || !extra.shortName.trim()) return "Short name is required.";
    if (!extra.country || !extra.country.trim()) return "Country is required.";
    if (!extra.educationLevel || !extra.educationLevel.trim()) return "Education level is required.";
    return null;
  },

  renderFormFields: ({
    formExtra, setFormExtra, formColor, setFormColor, formIcon, setFormIcon,
    showColorPicker, setShowColorPicker,
  }) => (
    <>
      {/* Board Code */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Code className="h-3 w-3 inline mr-1" /> Board Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. CBSE"
        />
      </div>

      {/* Short Name */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Hash className="h-3 w-3 inline mr-1" /> Short Name *
        </label>
        <Input
          value={formExtra.shortName || ""}
          onChange={(e) => setFormExtra("shortName", e.target.value)}
          className="h-8 text-[12px]"
          placeholder="e.g. CBSE"
        />
      </div>

      {/* Country */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <MapPin className="h-3 w-3 inline mr-1" /> Country *
        </label>
        <Select
          value={formExtra.country || ""}
          onValueChange={(val) => setFormExtra("country", val)}
        >
          <SelectTrigger className="h-8 text-[12px]">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c} value={c} className="text-[12px]">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Education Level */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Layers className="h-3 w-3 inline mr-1" /> Education Level *
        </label>
        <Select
          value={formExtra.educationLevel || ""}
          onValueChange={(val) => setFormExtra("educationLevel", val)}
        >
          <SelectTrigger className="h-8 text-[12px]">
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent>
            {EDUCATION_LEVELS.map((l) => (
              <SelectItem key={l} value={l} className="text-[12px]">{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Website */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Link className="h-3 w-3 inline mr-1" /> Website
        </label>
        <Input
          value={formExtra.website || ""}
          onChange={(e) => setFormExtra("website", e.target.value)}
          className="h-8 text-[12px]"
          placeholder="e.g. https://www.cbse.gov.in"
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
          placeholder="Brief description of this board and its curriculum..."
          className="w-full min-h-[50px] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]"
          rows={2}
        />
      </div>

      {/* Color */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Palette className="h-3 w-3 inline mr-1" /> Board Color
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

export default function MasterDataBoards() {
  return <MasterDataTable config={config} />;
}
