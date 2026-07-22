import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
  GraduationCap, Megaphone, Award, Wrench, Presentation, Monitor, DoorOpen,
  UserPlus, Sparkles, Bird, Building, Calendar, Target, HeartHandshake, RefreshCw,
  Palette, AlignLeft, Code, Lightbulb, TrendingUp, Users,
} from "lucide-react";

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "GraduationCap", label: "Admission", icon: GraduationCap },
  { value: "Megaphone", label: "Awareness", icon: Megaphone },
  { value: "Award", label: "Scholarship", icon: Award },
  { value: "Wrench", label: "Workshop", icon: Wrench },
  { value: "Presentation", label: "Seminar", icon: Presentation },
  { value: "Monitor", label: "Webinar", icon: Monitor },
  { value: "DoorOpen", label: "Open House", icon: DoorOpen },
  { value: "UserPlus", label: "Referral", icon: UserPlus },
  { value: "Sparkles", label: "Offer", icon: Sparkles },
  { value: "Bird", label: "Early Bird", icon: Bird },
  { value: "Building", label: "Corporate", icon: Building },
  { value: "Calendar", label: "Seasonal", icon: Calendar },
  { value: "Target", label: "Lead Gen", icon: Target },
  { value: "HeartHandshake", label: "Retention", icon: HeartHandshake },
  { value: "RefreshCw", label: "Retarget", icon: RefreshCw },
  { value: "Lightbulb", label: "Idea", icon: Lightbulb },
  { value: "TrendingUp", label: "Growth", icon: TrendingUp },
  { value: "Users", label: "Community", icon: Users },
];

const COLOR_PRESETS = [
  "#4285f4", "#34a853", "#ea4335", "#fbbc04", "#a855f7",
  "#e8710a", "#0d9488", "#4f46e5", "#d4a017", "#5f6368",
  "#e91e63", "#00bcd4", "#ff5722", "#1a73e8", "#9aa0a6",
  "#0d652d", "#8430ce", "#b31412",
];

const CAMPAIGN_CATEGORIES = [
  { value: "Enrollment", label: "Enrollment" },
  { value: "Awareness", label: "Awareness" },
  { value: "Educational", label: "Educational" },
  { value: "Event", label: "Event" },
  { value: "Referral", label: "Referral" },
  { value: "Promotional", label: "Promotional" },
  { value: "Corporate", label: "Corporate" },
  { value: "Retention", label: "Retention" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Enrollment": "#4285f4",
  "Awareness": "#a855f7",
  "Educational": "#e8710a",
  "Event": "#0d9488",
  "Referral": "#d4a017",
  "Promotional": "#ea4335",
  "Corporate": "#5f6368",
  "Retention": "#34a853",
};

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || Megaphone;
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Campaign Types",
  subtitle: "Configure the marketing campaign types used across the organization.",
  entityName: "CampaignType",
  entityNamePlural: "Campaign Types",
  backRoute: "/studios/master-data/crm",
  backLabel: "Back to CRM Masters",

  apiModule: {
    list: api.crmCampaignTypes.listCampaignTypes,
    get: api.crmCampaignTypes.getCampaignType,
    create: api.crmCampaignTypes.createCampaignType,
    update: api.crmCampaignTypes.updateCampaignType,
    delete: api.crmCampaignTypes.deleteCampaignType,
    duplicate: api.crmCampaignTypes.duplicateCampaignType,
    reorder: api.crmCampaignTypes.reorderCampaignTypes,
    seedDefault: api.crmCampaignTypes.seedDefaultTypes,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.active);
    const inactive = items.filter((s: any) => !s.active);
    const categories = new Set(items.map((s: any) => s.campaignCategory));
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total Types", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Inactive", value: inactive.length, valueColor: "#9aa0a6" },
      { label: "Categories", value: categories.size },
      { label: "Most Used", value: items.length > 0 ? items[0].name : "—" },
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
      width: "w-28",
      cell: (item: any) => {
        const catColor = CATEGORY_COLORS[item.campaignCategory] || "#9aa0a6";
        return (
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: catColor + "18", color: catColor }}
          >
            {item.campaignCategory}
          </span>
        );
      },
    },
  ],

  getDefaultFormExtra: () => ({ code: "", campaignCategory: "Awareness", description: "" }),
  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    campaignCategory: item.campaignCategory || "Awareness",
    description: item.description || "",
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Campaign type code is required.";
    return null;
  },

  renderFormFields: ({
    formExtra, setFormExtra, formColor, setFormColor, formIcon, setFormIcon,
    showColorPicker, setShowColorPicker,
  }) => (
    <>
      {/* Campaign Type Code */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Code className="h-3 w-3 inline mr-1" /> Campaign Type Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. ADM"
        />
      </div>

      {/* Campaign Category */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Target className="h-3 w-3 inline mr-1" /> Campaign Category
        </label>
        <select
          value={formExtra.campaignCategory || "Awareness"}
          onChange={(e) => setFormExtra("campaignCategory", e.target.value)}
          className="w-full h-8 text-[12px] px-2.5 rounded-lg border border-[#e8eaed] bg-white focus:outline-none focus:border-[#1a1a2e]"
        >
          {CAMPAIGN_CATEGORIES.map((cat) => (
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
          placeholder="Brief description of this campaign type..."
          className="w-full min-h-[50px] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]"
          rows={2}
        />
      </div>

      {/* Color */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Palette className="h-3 w-3 inline mr-1" /> Campaign Color
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

export default function MasterDataCampaignTypes() {
  return <MasterDataTable config={config} />;
}
