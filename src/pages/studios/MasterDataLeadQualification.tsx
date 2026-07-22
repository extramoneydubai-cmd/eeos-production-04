import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
  Flame, Sun, Snowflake, BadgeCheck, Megaphone, Briefcase, Target, Award,
  Thermometer, Zap, Star, TrendingUp, UserCheck, CheckCircle, Heart,
  Clock, AlertTriangle, HelpCircle, ThumbsUp, Shield,
} from "lucide-react";

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "Flame", label: "Hot", icon: Flame },
  { value: "Sun", label: "Warm", icon: Sun },
  { value: "Snowflake", label: "Cold", icon: Snowflake },
  { value: "BadgeCheck", label: "Qualified", icon: BadgeCheck },
  { value: "Megaphone", label: "MQL", icon: Megaphone },
  { value: "Briefcase", label: "SQL", icon: Briefcase },
  { value: "Target", label: "Opp", icon: Target },
  { value: "Award", label: "Converted", icon: Award },
  { value: "Thermometer", label: "Temp", icon: Thermometer },
  { value: "Zap", label: "Energy", icon: Zap },
  { value: "Star", label: "Star", icon: Star },
  { value: "TrendingUp", label: "Trend", icon: TrendingUp },
  { value: "UserCheck", label: "Vetted", icon: UserCheck },
  { value: "CheckCircle", label: "Done", icon: CheckCircle },
  { value: "Heart", label: "Love", icon: Heart },
  { value: "Clock", label: "Timely", icon: Clock },
  { value: "AlertTriangle", label: "Risk", icon: AlertTriangle },
  { value: "HelpCircle", label: "Unknown", icon: HelpCircle },
  { value: "ThumbsUp", label: "Like", icon: ThumbsUp },
  { value: "Shield", label: "Secure", icon: Shield },
];

const COLOR_PRESETS = [
  "#ea4335", "#fbbc04", "#4285f4", "#34a853", "#a855f7",
  "#4f46e5", "#0d9488", "#1a73e8", "#e91e63", "#e8710a",
  "#5f6368", "#d4a017", "#06b6d4", "#14b8a6", "#f97316",
  "#f43f5e", "#8b5cf6", "#22c55e", "#9aa0a6", "#1877F2",
];

const SCORE_COLORS: Record<string, string> = {
  "0-49": "#4285f4",
  "50-79": "#fbbc04",
  "80-100": "#ea4335",
};

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || BadgeCheck;
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Lead Qualification",
  subtitle: "Define lead qualification levels and scoring thresholds for the CRM.",
  entityName: "LeadQualification",
  entityNamePlural: "Lead Qualifications",
  backRoute: "/studios/master-data/crm",
  backLabel: "Back to CRM Masters",

  apiModule: {
    list: api.crmLeadQualification.listLeadQualifications,
    get: api.crmLeadQualification.getLeadQualification,
    create: api.crmLeadQualification.createLeadQualification,
    update: api.crmLeadQualification.updateLeadQualification,
    delete: api.crmLeadQualification.deleteLeadQualification,
    duplicate: api.crmLeadQualification.duplicateLeadQualification,
    reorder: api.crmLeadQualification.reorderLeadQualifications,
    seedDefault: api.crmLeadQualification.seedDefault,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.active);
    const withScores = items.filter((s: any) => s.minimumScore != null);
    const maxScoreItems = items.filter((s: any) => s.maximumScore === 100);
    const minScoreItems = items.filter((s: any) => s.minimumScore === 0);
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Scored", value: withScores.length, valueColor: "#4285f4" },
      { label: "Top Tier (100)", value: maxScoreItems.length, valueColor: "#ea4335" },
      { label: "Bottom Tier (0)", value: minScoreItems.length, valueColor: "#5f6368" },
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
      header: "Score Range",
      width: "w-28",
      cell: (item: any) => {
        const hasMin = item.minimumScore != null;
        const hasMax = item.maximumScore != null;
        const rangeText = hasMin && hasMax
          ? `${item.minimumScore} – ${item.maximumScore}`
          : hasMin
            ? `${item.minimumScore}+`
            : hasMax
              ? `≤ ${item.maximumScore}`
              : "—";
        const rangeColor = item.maximumScore === 100 && item.minimumScore === 100
          ? "#34a853"
          : item.maximumScore === 100
            ? "#ea4335"
            : item.minimumScore === 0
              ? "#4285f4"
              : "#5f6368";
        return (
          <span
            className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: rangeColor + "12", color: rangeColor }}
          >
            {rangeText}
          </span>
        );
      },
    },
  ],

  getDefaultFormExtra: () => ({ code: "", minimumScore: 0, maximumScore: 100, description: "" }),
  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    minimumScore: item.minimumScore ?? 0,
    maximumScore: item.maximumScore ?? 100,
    description: item.description || "",
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Qualification code is required.";
    if (extra.minimumScore != null && extra.maximumScore != null && extra.minimumScore > extra.maximumScore) {
      return "Minimum score cannot exceed maximum score.";
    }
    if ((extra.minimumScore != null && extra.minimumScore < 0) || (extra.maximumScore != null && extra.maximumScore > 100)) {
      return "Scores must be between 0 and 100.";
    }
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
          <code className="h-3 w-3 inline mr-1 text-[10px]">&lt;/&gt;</code> Qualification Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. HOT"
        />
      </div>

      {/* Score Range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
            <span className="h-3 w-3 inline mr-1 text-[10px]">&#x2B07;</span> Min Score
          </label>
          <Input
            type="number"
            min={0}
            max={100}
            value={formExtra.minimumScore ?? ""}
            onChange={(e) => setFormExtra("minimumScore", e.target.value ? parseInt(e.target.value) : undefined)}
            className="h-8 text-[12px]"
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
            <span className="h-3 w-3 inline mr-1 text-[10px]">&#x2B06;</span> Max Score
          </label>
          <Input
            type="number"
            min={0}
            max={100}
            value={formExtra.maximumScore ?? ""}
            onChange={(e) => setFormExtra("maximumScore", e.target.value ? parseInt(e.target.value) : undefined)}
            className="h-8 text-[12px]"
            placeholder="100"
          />
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
          placeholder="Describe this qualification level..."
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

export default function MasterDataLeadQualification() {
  return <MasterDataTable config={config} />;
}
