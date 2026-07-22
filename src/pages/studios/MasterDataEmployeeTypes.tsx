import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  BadgeCheck, Clock, FileText, GraduationCap, Briefcase,
  Laptop, UserRound, Speech, HeartHandshake, Users,
  UserCog, ShieldCheck, BadgePercent, Building2, Star,
  Palette as PaletteIcon, AlignLeft, Code,
} from "lucide-react";

/* ─── Constants ─── */

const EMPLOYMENT_CATEGORIES = [
  "Full-Time",
  "Part-Time",
  "Contract",
  "Temporary",
  "Internship",
  "Freelance",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Full-Time": "bg-[#e8f0fe] text-[#1a73e8]",
  "Part-Time": "bg-[#e6f4ea] text-[#34a853]",
  Contract: "bg-[#fce8e6] text-[#ea4335]",
  Temporary: "bg-[#fef7e0] text-[#e8710a]",
  Internship: "bg-[#f3e8ff] text-[#a855f7]",
  Freelance: "bg-[#e8eaf6] text-[#4f46e5]",
};

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "BadgeCheck", label: "Badge", icon: BadgeCheck },
  { value: "Clock", label: "Clock", icon: Clock },
  { value: "FileText", label: "Contract", icon: FileText },
  { value: "GraduationCap", label: "Graduate", icon: GraduationCap },
  { value: "Briefcase", label: "Briefcase", icon: Briefcase },
  { value: "Laptop", label: "Laptop", icon: Laptop },
  { value: "UserRound", label: "User", icon: UserRound },
  { value: "Speech", label: "Speech", icon: Speech },
  { value: "HeartHandshake", label: "Handshake", icon: HeartHandshake },
  { value: "Users", label: "Team", icon: Users },
  { value: "UserCog", label: "Admin", icon: UserCog },
  { value: "ShieldCheck", label: "Shield", icon: ShieldCheck },
  { value: "BadgePercent", label: "Percent", icon: BadgePercent },
  { value: "Building2", label: "Building", icon: Building2 },
  { value: "Star", label: "Star", icon: Star },
];

const COLOR_PRESETS = [
  "#4285f4", "#34a853", "#ea4335", "#fbbc04", "#a855f7",
  "#e8710a", "#06b6d4", "#0d9488", "#1a1a2e", "#f43f5e",
  "#4f46e5", "#5f6368", "#0d652d", "#10b981", "#f59e0b",
  "#9aa0a6", "#d4a017", "#e8f0fe", "#fce8e6", "#f3e8ff",
];

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || BadgeCheck;
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Employee Types",
  subtitle: "Define employee types — classify employment nature, category, and payroll eligibility.",
  entityName: "Employee Type",
  entityNamePlural: "Employee Types",
  backRoute: "/studios/master-data/hr",
  backLabel: "Back to HR Masters",

  apiModule: {
    list: api.hrEmployeeTypes.listEmployeeTypes,
    get: api.hrEmployeeTypes.getEmployeeType,
    create: api.hrEmployeeTypes.createEmployeeType,
    update: api.hrEmployeeTypes.updateEmployeeType,
    delete: api.hrEmployeeTypes.deleteEmployeeType,
    duplicate: api.hrEmployeeTypes.duplicateEmployeeType,
    reorder: api.hrEmployeeTypes.reorderEmployeeTypes,
    seedDefault: api.hrEmployeeTypes.seedDefaultEmployeeTypes,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((t: any) => t.active);
    const payrollEligible = items.filter((t: any) => t.isPayrollEligible);
    const categories = new Set(items.map((t: any) => t.employmentCategory));
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Payroll Eligible", value: payrollEligible.length, valueColor: "#4285f4" },
      { label: "Categories", value: categories.size, valueColor: "#a855f7" },
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
      header: "Category",
      width: "w-28",
      cell: (item: any) => (
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${CATEGORY_COLORS[item.employmentCategory] || "bg-[#f1f3f4] text-[#5f6368]"}`}>
          {item.employmentCategory}
        </span>
      ),
    },
    {
      header: "Payroll",
      width: "w-20",
      cell: (item: any) => (
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
          item.isPayrollEligible
            ? "bg-[#e6f4ea] text-[#34a853]"
            : "bg-[#f1f3f4] text-[#9aa0a6]"
        }`}>
          {item.isPayrollEligible ? "Yes" : "No"}
        </span>
      ),
    },
  ],

  getDefaultFormExtra: () => ({
    code: "",
    employmentCategory: "Full-Time",
    isPayrollEligible: true,
    description: "",
  }),

  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    employmentCategory: item.employmentCategory || "Full-Time",
    isPayrollEligible: item.isPayrollEligible ?? true,
    description: item.description || "",
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Employee type code is required.";
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
          <Code className="h-3 w-3 inline mr-1" /> Employee Type Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. PERMANENT, CONTRACT, INTERN"
        />
      </div>

      {/* Employment Category */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <UserCog className="h-3 w-3 inline mr-1" /> Employment Category
        </label>
        <Select
          value={formExtra.employmentCategory || "Full-Time"}
          onValueChange={(val) => setFormExtra("employmentCategory", val)}
        >
          <SelectTrigger className="h-8 text-[12px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {EMPLOYMENT_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat} className="text-[12px]">{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Payroll Eligible */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <BadgePercent className="h-3 w-3 inline mr-1" /> Payroll Eligible
        </label>
        <div className="flex items-center gap-2">
          <Switch
            checked={formExtra.isPayrollEligible ?? true}
            onCheckedChange={(val) => setFormExtra("isPayrollEligible", val)}
            className="data-[state=checked]:bg-[#34a853]"
          />
          <span className="text-[11px] text-[#5f6368]">
            {formExtra.isPayrollEligible ? "Eligible for payroll processing" : "Not eligible for payroll"}
          </span>
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
          placeholder="Brief description of this employee type..."
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

export default function MasterDataEmployeeTypes() {
  return <MasterDataTable config={config} />;
}
