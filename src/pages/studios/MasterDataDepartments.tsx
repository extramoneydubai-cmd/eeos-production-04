import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
  Building2, UserPlus, TrendingUp, Megaphone, DollarSign, Calculator,
  Users, GraduationCap, Settings, Monitor, Factory, Headphones, Award,
  Scale, Package, ClipboardCheck, Briefcase, Handshake,
  Palette, AlignLeft, Code,
} from "lucide-react";

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "Building2", label: "Admin", icon: Building2 },
  { value: "UserPlus", label: "Admissions", icon: UserPlus },
  { value: "TrendingUp", label: "Sales", icon: TrendingUp },
  { value: "Megaphone", label: "Marketing", icon: Megaphone },
  { value: "DollarSign", label: "Finance", icon: DollarSign },
  { value: "Calculator", label: "Accounts", icon: Calculator },
  { value: "Users", label: "HR", icon: Users },
  { value: "GraduationCap", label: "Academics", icon: GraduationCap },
  { value: "Settings", label: "Operations", icon: Settings },
  { value: "Monitor", label: "Technology", icon: Monitor },
  { value: "Factory", label: "Production", icon: Factory },
  { value: "Headphones", label: "Support", icon: Headphones },
  { value: "Award", label: "Students", icon: Award },
  { value: "Scale", label: "Legal", icon: Scale },
  { value: "Package", label: "Procurement", icon: Package },
  { value: "ClipboardCheck", label: "Exams", icon: ClipboardCheck },
  { value: "Briefcase", label: "Management", icon: Briefcase },
  { value: "Handshake", label: "Corporate", icon: Handshake },
];

const COLOR_PRESETS = [
  "#1a1a2e", "#4285f4", "#34a853", "#ea4335", "#fbbc04",
  "#e8710a", "#a855f7", "#1a73e8", "#5f6368", "#0d652d",
  "#e8710a", "#06b6d4", "#34a853", "#4f46e5", "#0d9488",
  "#ea4335", "#1a1a2e", "#a855f7", "#9aa0a6", "#f3e8ff",
];

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || Building2;
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Departments",
  subtitle: "Configure the functional departments used across EEOS.",
  entityName: "Department",
  entityNamePlural: "Departments",
  backRoute: "/studios/master-data/organization",
  backLabel: "Back to Organization Masters",

  apiModule: {
    list: api.organizationDepartments.listDepartments,
    get: api.organizationDepartments.getDepartment,
    create: api.organizationDepartments.createDepartment,
    update: api.organizationDepartments.updateDepartment,
    delete: api.organizationDepartments.deleteDepartment,
    duplicate: api.organizationDepartments.duplicateDepartment,
    reorder: api.organizationDepartments.reorderDepartments,
    seedDefault: api.organizationDepartments.seedDefaultDepartments,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.active);
    const inactive = items.filter((s: any) => !s.active);
    const sortedByCreated = [...items].sort((a: any, b: any) => a.createdAt - b.createdAt);
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Inactive", value: inactive.length, valueColor: "#9aa0a6" },
      { label: "Most Recent", value: sortedByCreated[sortedByCreated.length - 1]?.name || "—" },
      { label: "Oldest", value: sortedByCreated[0]?.name || "—" },
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
  ],

  getDefaultFormExtra: () => ({ code: "", description: "" }),
  getFormExtraFromItem: (item: any) => ({ code: item.code || "", description: item.description || "" }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Department code is required.";
    return null;
  },

  renderFormFields: ({
    formExtra, setFormExtra, formColor, setFormColor, formIcon, setFormIcon,
    showColorPicker, setShowColorPicker,
  }) => (
    <>
      {/* Department Code */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Code className="h-3 w-3 inline mr-1" /> Department Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. HR"
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
          placeholder="Brief description of this department..."
          className="w-full min-h-[50px] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]"
          rows={2}
        />
      </div>

      {/* Color */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Palette className="h-3 w-3 inline mr-1" /> Department Color
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
        <div className="grid grid-cols-6 gap-1.5">
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

export default function MasterDataDepartments() {
  return <MasterDataTable config={config} />;
}
