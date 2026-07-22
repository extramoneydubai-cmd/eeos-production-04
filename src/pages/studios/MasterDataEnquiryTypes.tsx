import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
  BookOpen, GraduationCap, DollarSign, Award, Monitor, Briefcase, Building2,
  Handshake, HelpCircle, AlertTriangle, Headphones, Palette, AlignLeft, Code,
  MessageCircle,
} from "lucide-react";

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "BookOpen", label: "Course", icon: BookOpen },
  { value: "GraduationCap", label: "Admission", icon: GraduationCap },
  { value: "DollarSign", label: "Fee", icon: DollarSign },
  { value: "Award", label: "Scholarship", icon: Award },
  { value: "Monitor", label: "Demo", icon: Monitor },
  { value: "Briefcase", label: "Corporate", icon: Briefcase },
  { value: "Building2", label: "Franchise", icon: Building2 },
  { value: "Handshake", label: "Partnership", icon: Handshake },
  { value: "HelpCircle", label: "General", icon: HelpCircle },
  { value: "AlertTriangle", label: "Complaint", icon: AlertTriangle },
  { value: "Headphones", label: "Support", icon: Headphones },
  { value: "MessageCircle", label: "Chat", icon: MessageCircle },
];

const COLOR_PRESETS = [
  "#4285f4", "#1a73e8", "#34a853", "#a855f7", "#fbbc04",
  "#5f6368", "#0d9488", "#4f46e5", "#e8710a", "#9aa0a6",
  "#ea4335", "#06b6d4", "#0d652d", "#d4a017", "#e91e63",
];

const CATEGORIES = [
  { value: "Academic", label: "Academic" },
  { value: "Finance", label: "Finance" },
  { value: "Corporate", label: "Corporate" },
  { value: "Business", label: "Business" },
  { value: "General", label: "General" },
  { value: "Support", label: "Support" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Academic": "#4285f4",
  "Finance": "#34a853",
  "Corporate": "#5f6368",
  "Business": "#0d9488",
  "General": "#9aa0a6",
  "Support": "#06b6d4",
};

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || HelpCircle;
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Enquiry Types",
  subtitle: "Configure enquiry type classifications used across the CRM.",
  entityName: "EnquiryType",
  entityNamePlural: "Enquiry Types",
  backRoute: "/studios/master-data/crm",
  backLabel: "Back to CRM Masters",

  apiModule: {
    list: api.crmEnquiryTypes.listEnquiryTypes,
    get: api.crmEnquiryTypes.getEnquiryType,
    create: api.crmEnquiryTypes.createEnquiryType,
    update: api.crmEnquiryTypes.updateEnquiryType,
    delete: api.crmEnquiryTypes.deleteEnquiryType,
    duplicate: api.crmEnquiryTypes.duplicateEnquiryType,
    reorder: api.crmEnquiryTypes.reorderEnquiryTypes,
    seedDefault: api.crmEnquiryTypes.seedDefaultEnquiryTypes,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.active);
    const categories = new Set(items.map((s: any) => s.educationCategory));
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total Types", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Categories", value: categories.size, valueColor: "#4285f4" },
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
      width: "w-24",
      cell: (item: any) => (
        <span className="text-[11px] font-mono font-medium text-[#5f6368] bg-[#f1f3f4] px-1.5 py-0.5 rounded">
          {item.code}
        </span>
      ),
    },
    {
      header: "Category",
      width: "w-24",
      cell: (item: any) => {
        const catColor = CATEGORY_COLORS[item.educationCategory] || "#9aa0a6";
        return (
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: catColor + "18", color: catColor }}
          >
            {item.educationCategory}
          </span>
        );
      },
    },
  ],

  getDefaultFormExtra: () => ({ code: "", educationCategory: "Academic", description: "" }),
  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    educationCategory: item.educationCategory || "Academic",
    description: item.description || "",
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Enquiry type code is required.";
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
          <Code className="h-3 w-3 inline mr-1" /> Type Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. COURSE"
        />
      </div>

      {/* Education Category */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <BookOpen className="h-3 w-3 inline mr-1" /> Education Category
        </label>
        <select
          value={formExtra.educationCategory || "Academic"}
          onChange={(e) => setFormExtra("educationCategory", e.target.value)}
          className="w-full h-8 text-[12px] px-2.5 rounded-lg border border-[#e8eaed] bg-white focus:outline-none focus:border-[#1a1a2e]"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <AlignLeft className="h-3 w-3 inline mr-1" /> Description
        </label>
        <textarea
          value={formExtra.description || ""}
          onChange={(e) => setFormExtra("description", e.target.value)}
          placeholder="Brief description of this enquiry type..."
          className="w-full min-h-[50px] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]"
          rows={2}
        />
      </div>

      {/* Color + Icon */}
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

export default function MasterDataEnquiryTypes() {
  return <MasterDataTable config={config} />;
}
