import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
  GraduationCap, Heart, Award,  Pen, UserRound, UserPlus, Users,
  Building, School, BookOpen, Briefcase, Building2, Globe, Share2, UserCheck,
  Handshake, Star, HeartHandshake, UserSearch, Megaphone,
} from "lucide-react";

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "GraduationCap", label: "Student", icon: GraduationCap },
  { value: "Heart", label: "Parent", icon: Heart },
  { value: "Award", label: "Alumni", icon: Award },
  { value: "Pen", label: "Teacher", icon: Pen },
  { value: "UserRound", label: "Employee", icon: UserRound },
  { value: "UserPlus", label: "Friend", icon: UserPlus },
  { value: "Users", label: "Relative", icon: Users },
  { value: "Building", label: "Corporate", icon: Building },
  { value: "School", label: "School", icon: School },
  { value: "BookOpen", label: "College", icon: BookOpen },
  { value: "Briefcase", label: "Consultant", icon: Briefcase },
  { value: "Building2", label: "Agency", icon: Building2 },
  { value: "Globe", label: "Website", icon: Globe },
  { value: "Share2", label: "Social", icon: Share2 },
  { value: "UserCheck", label: "Verified", icon: UserCheck },
  { value: "Handshake", label: "Partner", icon: Handshake },
  { value: "Star", label: "Top", icon: Star },
  { value: "HeartHandshake", label: "Referral", icon: HeartHandshake },
  { value: "UserSearch", label: "Search", icon: UserSearch },
  { value: "Megaphone", label: "Promo", icon: Megaphone },
];

const COLOR_PRESETS = [
  "#1a73e8", "#34a853", "#ea4335", "#fbbc04", "#a855f7",
  "#e91e63", "#4f46e5", "#0d9488", "#e8710a", "#06b6d4",
  "#5f6368", "#4285f4", "#1877F2", "#25D366", "#d4a017",
  "#f43f5e", "#14b8a6", "#f97316", "#8b5cf6", "#22c55e",
];

const REFERRAL_CATEGORIES = [
  { value: "Student", label: "Student" },
  { value: "Parent", label: "Parent" },
  { value: "Alumni", label: "Alumni" },
  { value: "Educator", label: "Educator" },
  { value: "Employee", label: "Employee" },
  { value: "Social", label: "Social" },
  { value: "Family", label: "Family" },
  { value: "Corporate", label: "Corporate" },
  { value: "Institution", label: "Institution" },
  { value: "Professional", label: "Professional" },
  { value: "Online", label: "Online" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Student: "#1a73e8",
  Parent: "#34a853",
  Alumni: "#a855f7",
  Educator: "#f59e0b",
  Employee: "#ea4335",
  Social: "#e91e63",
  Family: "#4f46e5",
  Corporate: "#0d9488",
  Institution: "#e8710a",
  Professional: "#06b6d4",
  Online: "#a855f7",
};

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || GraduationCap;
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Referral Sources",
  subtitle: "Manage referral source channels and reward eligibility across the CRM.",
  entityName: "ReferralSource",
  entityNamePlural: "Referral Sources",
  backRoute: "/studios/master-data/crm",
  backLabel: "Back to CRM Masters",

  apiModule: {
    list: api.crmReferralSources.listReferralSources,
    get: api.crmReferralSources.getReferralSource,
    create: api.crmReferralSources.createReferralSource,
    update: api.crmReferralSources.updateReferralSource,
    delete: api.crmReferralSources.deleteReferralSource,
    duplicate: api.crmReferralSources.duplicateReferralSource,
    reorder: api.crmReferralSources.reorderReferralSources,
    seedDefault: api.crmReferralSources.seedDefault,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.active);
    const rewardEligible = items.filter((s: any) => s.rewardEligible);
    const categories = new Set(items.map((s: any) => s.referralCategory));
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Reward Eligible", value: rewardEligible.length, valueColor: "#d4a017" },
      { label: "Categories", value: categories.size, valueColor: "#a855f7" },
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
        const catColor = CATEGORY_COLORS[item.referralCategory] || "#9aa0a6";
        return (
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: catColor + "18", color: catColor }}
          >
            {item.referralCategory}
          </span>
        );
      },
    },
    {
      header: "Reward",
      width: "w-20",
      cell: (item: any) => (
        item.rewardEligible
          ? <span className="text-[11px] text-[#d4a017] font-medium flex items-center gap-1"><Star className="h-3 w-3" /> Eligible</span>
          : <span className="text-[11px] text-[#9aa0a6]">—</span>
      ),
    },
  ],

  getDefaultFormExtra: () => ({ code: "", referralCategory: "Student", rewardEligible: false, description: "" }),
  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    referralCategory: item.referralCategory || "Student",
    rewardEligible: item.rewardEligible ?? false,
    description: item.description || "",
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Referral source code is required.";
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
          <code className="h-3 w-3 inline mr-1 text-[10px]">&lt;/&gt;</code> Source Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. EXISTING_STUDENT"
        />
      </div>

      {/* Referral Category */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Users className="h-3 w-3 inline mr-1" /> Referral Category
        </label>
        <select
          value={formExtra.referralCategory || "Student"}
          onChange={(e) => setFormExtra("referralCategory", e.target.value)}
          className="w-full h-8 text-[12px] px-2.5 rounded-lg border border-[#e8eaed] bg-white focus:outline-none focus:border-[#1a1a2e]"
        >
          {REFERRAL_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Reward Eligible Toggle */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Star className="h-3 w-3 inline mr-1" /> Reward Eligible
        </label>
        <div className="flex items-center gap-2 h-8">
          <button
            onClick={() => setFormExtra("rewardEligible", !formExtra.rewardEligible)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              formExtra.rewardEligible ? "bg-[#d4a017]" : "bg-[#dadce0]"
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                formExtra.rewardEligible ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className="text-[11px] text-[#5f6368]">
            {formExtra.rewardEligible ? "Yes" : "No"}
          </span>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <span className="h-3 w-3 inline mr-1 text-[10px]">&#x2709;</span> Description
        </label>
        <textarea
          value={formExtra.description || ""}
          onChange={(e) => setFormExtra("description", e.target.value)}
          placeholder="Brief description of this referral source..."
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

export default function MasterDataReferralSources() {
  return <MasterDataTable config={config} />;
}
