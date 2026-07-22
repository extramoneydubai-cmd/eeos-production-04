import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BadgeCheck, GraduationCap, TrendingUp, Building2, Handshake, HeartHandshake,
  Landmark, ShieldCheck, RefreshCw, GitPullRequest, Award, Target, Zap,
  Globe, Users, Star, DollarSign, BarChart3, Layers, Sparkles,
} from "lucide-react";

/* ─── Constants ─── */

const OPPORTUNITY_CATEGORIES = [
  "Admission",
  "Upsell",
  "Corporate",
  "Partnership",
  "Institutional",
  "Government",
  "Retention",
];

const CATEGORY_COLORS: Record<string, string> = {
  Admission: "#4285f4",
  Upsell: "#4f46e5",
  Corporate: "#a855f7",
  Partnership: "#0d9488",
  Institutional: "#06b6d4",
  Government: "#34a853",
  Retention: "#e8710a",
};

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "BadgeCheck", label: "Qualified", icon: BadgeCheck },
  { value: "GraduationCap", label: "Graduate", icon: GraduationCap },
  { value: "TrendingUp", label: "Growth", icon: TrendingUp },
  { value: "Building2", label: "Building", icon: Building2 },
  { value: "Handshake", label: "Handshake", icon: Handshake },
  { value: "HeartHandshake", label: "Partner", icon: HeartHandshake },
  { value: "Landmark", label: "Institution", icon: Landmark },
  { value: "ShieldCheck", label: "Guaranteed", icon: ShieldCheck },
  { value: "RefreshCw", label: "Renewal", icon: RefreshCw },
  { value: "GitPullRequest", label: "Cross-sell", icon: GitPullRequest },
  { value: "Award", label: "Premium", icon: Award },
  { value: "Target", label: "Target", icon: Target },
  { value: "Zap", label: "Hot", icon: Zap },
  { value: "Globe", label: "Global", icon: Globe },
  { value: "Users", label: "Team", icon: Users },
  { value: "Star", label: "Star", icon: Star },
  { value: "DollarSign", label: "Revenue", icon: DollarSign },
  { value: "BarChart3", label: "Chart", icon: BarChart3 },
  { value: "Layers", label: "Pipeline", icon: Layers },
  { value: "Sparkles", label: "New", icon: Sparkles },
];

const COLOR_PRESETS = [
  "#4285f4", "#4f46e5", "#a855f7", "#f59e0b", "#0d9488",
  "#06b6d4", "#34a853", "#ea4335", "#f97316", "#5f6368",
  "#1a73e8", "#d4a017", "#e91e63", "#14b8a6", "#8b5cf6",
  "#22c55e", "#f43f5e", "#9aa0a6", "#3b82f6", "#6366f1",
];

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || BadgeCheck;
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Opportunity Types",
  subtitle: "Define the types of sales opportunities — from new admissions and corporate training to renewals and premium upgrades.",
  entityName: "OpportunityType",
  entityNamePlural: "Opportunity Types",
  backRoute: "/studios/master-data/sales",
  backLabel: "Back to Sales Masters",

  apiModule: {
    list: api.salesOpportunityTypes.list,
    get: api.salesOpportunityTypes.get,
    create: api.salesOpportunityTypes.create,
    update: api.salesOpportunityTypes.update,
    delete: api.salesOpportunityTypes.remove,
    duplicate: api.salesOpportunityTypes.duplicate,
    reorder: api.salesOpportunityTypes.reorder,
    seedDefault: api.salesOpportunityTypes.seedDefault,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.active);
    const categories = new Set(items.map((s: any) => s.opportunityCategory));
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total Types", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Categories", value: categories.size, valueColor: "#4285f4" },
      { label: "Avg/Category", value: categories.size ? (items.length / categories.size).toFixed(1) : "0", valueColor: "#a855f7" },
      { label: "Recently Updated", value: sortedByUpdated[0] ? formatDate(sortedByUpdated[0].updatedAt) : "—", valueColor: "#1a73e8" },
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
      cell: (item: any) => {
        const catColor = CATEGORY_COLORS[item.opportunityCategory] || "#9aa0a6";
        return (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: catColor + "18", color: catColor }}
          >
            {item.opportunityCategory}
          </span>
        );
      },
    },
  ],

  getDefaultFormExtra: () => ({ code: "", opportunityCategory: "Admission", description: "" }),
  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    opportunityCategory: item.opportunityCategory || "Admission",
    description: item.description || "",
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Opportunity type code is required.";
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
          <code className="h-3 w-3 inline mr-1 text-[10px]">&lt;/&gt;</code> Type Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. OT_CORP_TRAINING"
        />
      </div>

      {/* Opportunity Category */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Layers className="h-3 w-3 inline mr-1" /> Opportunity Category
        </label>
        <Select
          value={formExtra.opportunityCategory || "Admission"}
          onValueChange={(val) => setFormExtra("opportunityCategory", val)}
        >
          <SelectTrigger className="h-8 text-[12px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {OPPORTUNITY_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat} className="text-[12px]">{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <span className="h-3 w-3 inline mr-1 text-[10px]">&#x2709;</span> Description
        </label>
        <textarea
          value={formExtra.description || ""}
          onChange={(e) => setFormExtra("description", e.target.value)}
          placeholder="Describe this opportunity type..."
          className="w-full min-h-[50px] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]"
          rows={2}
        />
      </div>

      {/* Color */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <span className="h-3 w-3 inline mr-1 rounded-full border border-[#e8eaed]" style={{ backgroundColor: formColor }} /> Color
        </label>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-8 h-8 rounded-md border border-[#e8eaed] flex items-center justify-center hover:border-[#1a1a2e] transition-colors"
            style={{ backgroundColor: formColor }}>
            <span className="text-[8px] text-white font-bold" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
              {formColor.replace("#", "")}
            </span>
          </button>
          <Input value={formColor} onChange={(e) => setFormColor(e.target.value)}
            className="h-8 text-[11px] font-mono w-28" placeholder="#000000" />
        </div>
        {showColorPicker && (
          <div className="flex flex-wrap gap-1.5 mt-2 p-2 rounded-lg bg-[#f8f9fa] border border-[#e8eaed]">
            {COLOR_PRESETS.map((c) => (
              <button key={c} onClick={() => { setFormColor(c); setShowColorPicker(false); }}
                className={`w-7 h-7 rounded-md border-2 transition-all ${
                  formColor === c ? "border-[#1a1a2e] scale-110" : "border-transparent hover:border-[#9aa0a6]"
                }`} style={{ backgroundColor: c }} title={c} />
            ))}
            <input type="color" value={formColor} onChange={(e) => setFormColor(e.target.value)}
              className="w-7 h-7 rounded-md border-2 border-dashed border-[#e8eaed] cursor-pointer" title="Custom color" />
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
              <button key={opt.value} onClick={() => setFormIcon(opt.value)}
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded-md border transition-all ${
                  isSelected ? "border-[#1a1a2e] bg-[#f1f3f4]" : "border-[#e8eaed] hover:bg-[#f8f9fa] hover:border-[#9aa0a6]"
                }`}>
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

export default function MasterDataOpportunityTypes() {
  return <MasterDataTable config={config} />;
}
