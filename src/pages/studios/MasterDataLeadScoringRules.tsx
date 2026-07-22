import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
  Phone, MessageCircle, Mail, Monitor, Building, Heart, Download, RefreshCw,
  UserPlus, Award, PhoneOff, Ban, BadgeCheck, ThumbsUp, ThumbsDown,
  UserCheck, Clock, AlertTriangle, CheckCircle, XCircle,
} from "lucide-react";

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "Phone", label: "Phone", icon: Phone },
  { value: "MessageCircle", label: "WhatsApp", icon: MessageCircle },
  { value: "Mail", label: "Email", icon: Mail },
  { value: "Monitor", label: "Demo", icon: Monitor },
  { value: "Building", label: "Visit", icon: Building },
  { value: "Heart", label: "Parent", icon: Heart },
  { value: "Download", label: "Brochure", icon: Download },
  { value: "RefreshCw", label: "Repeat", icon: RefreshCw },
  { value: "UserPlus", label: "Referral", icon: UserPlus },
  { value: "Award", label: "Scholarship", icon: Award },
  { value: "PhoneOff", label: "No Resp", icon: PhoneOff },
  { value: "Ban", label: "Invalid", icon: Ban },
  { value: "BadgeCheck", label: "Verified", icon: BadgeCheck },
  { value: "ThumbsUp", label: "Positive", icon: ThumbsUp },
  { value: "ThumbsDown", label: "Negative", icon: ThumbsDown },
  { value: "UserCheck", label: "Contacted", icon: UserCheck },
  { value: "Clock", label: "Pending", icon: Clock },
  { value: "AlertTriangle", label: "Warning", icon: AlertTriangle },
  { value: "CheckCircle", label: "Success", icon: CheckCircle },
  { value: "XCircle", label: "Fail", icon: XCircle },
];

const COLOR_PRESETS = [
  "#34a853", "#25D366", "#ea4335", "#a855f7", "#0d9488",
  "#4f46e5", "#f59e0b", "#1a73e8", "#d4a017", "#e91e63",
  "#5f6368", "#d93025", "#4285f4", "#06b6d4", "#f97316",
  "#f43f5e", "#14b8a6", "#8b5cf6", "#22c55e", "#9aa0a6",
];

const RULE_CATEGORIES = [
  { value: "Verification", label: "Verification" },
  { value: "Engagement", label: "Engagement" },
  { value: "Interest", label: "Interest" },
  { value: "Source", label: "Source" },
  { value: "Negative", label: "Negative" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Verification: "#34a853",
  Engagement: "#a855f7",
  Interest: "#f59e0b",
  Source: "#d4a017",
  Negative: "#ea4335",
};

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || BadgeCheck;
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Lead Scoring Rules",
  subtitle: "Define scoring rules and point values for automated lead scoring in the CRM.",
  entityName: "LeadScoringRule",
  entityNamePlural: "Lead Scoring Rules",
  backRoute: "/studios/master-data/crm",
  backLabel: "Back to CRM Masters",

  apiModule: {
    list: api.crmLeadScoringRules.listLeadScoringRules,
    get: api.crmLeadScoringRules.getLeadScoringRule,
    create: api.crmLeadScoringRules.createLeadScoringRule,
    update: api.crmLeadScoringRules.updateLeadScoringRule,
    delete: api.crmLeadScoringRules.deleteLeadScoringRule,
    duplicate: api.crmLeadScoringRules.duplicateLeadScoringRule,
    reorder: api.crmLeadScoringRules.reorderLeadScoringRules,
    seedDefault: api.crmLeadScoringRules.seedDefault,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.active);
    const positive = items.filter((s: any) => s.scoreValue > 0);
    const negative = items.filter((s: any) => s.scoreValue < 0);
    const categories = new Set(items.map((s: any) => s.ruleCategory));
    const totalScore = items.reduce((sum: number, s: any) => sum + (s.scoreValue || 0), 0);
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total Rules", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Positive", value: positive.length, valueColor: "#1a73e8" },
      { label: "Negative", value: negative.length, valueColor: "#ea4335" },
      { label: "Categories", value: categories.size, valueColor: "#a855f7" },
      { label: "Total Score", value: totalScore, valueColor: "#5f6368" },
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
        const catColor = CATEGORY_COLORS[item.ruleCategory] || "#9aa0a6";
        return (
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: catColor + "18", color: catColor }}
          >
            {item.ruleCategory}
          </span>
        );
      },
    },
    {
      header: "Score",
      width: "w-16",
      cell: (item: any) => {
        const isPositive = item.scoreValue > 0;
        const isNegative = item.scoreValue < 0;
        const prefix = isPositive ? "+" : "";
        const color = isNegative ? "#ea4335" : isPositive ? "#34a853" : "#5f6368";
        return (
          <span className="text-[12px] font-mono font-bold" style={{ color }}>
            {prefix}{item.scoreValue}
          </span>
        );
      },
    },
  ],

  getDefaultFormExtra: () => ({ code: "", scoreValue: 10, ruleCategory: "Verification", description: "" }),
  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    scoreValue: item.scoreValue ?? 0,
    ruleCategory: item.ruleCategory || "Verification",
    description: item.description || "",
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Rule code is required.";
    if (extra.scoreValue == null) return "Score value is required.";
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
          <code className="h-3 w-3 inline mr-1 text-[10px]">&lt;/&gt;</code> Rule Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. PHONE_VERIFIED"
        />
      </div>

      {/* Score Value */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <span className="h-3 w-3 inline mr-1 text-[10px]">&#x2726;</span> Score Value *
        </label>
        <Input
          type="number"
          value={formExtra.scoreValue ?? ""}
          onChange={(e) => setFormExtra("scoreValue", e.target.value ? parseInt(e.target.value) : 0)}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. 20 or -10"
        />
        <p className="text-[9px] text-[#9aa0a6] mt-0.5">Use positive values for rewarding actions, negative for penalizing.</p>
      </div>

      {/* Rule Category */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <span className="h-3 w-3 inline mr-1 text-[10px]">&#x2B50;</span> Rule Category
        </label>
        <select
          value={formExtra.ruleCategory || "Verification"}
          onChange={(e) => setFormExtra("ruleCategory", e.target.value)}
          className="w-full h-8 text-[12px] px-2.5 rounded-lg border border-[#e8eaed] bg-white focus:outline-none focus:border-[#1a1a2e]"
        >
          {RULE_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <span className="h-3 w-3 inline mr-1 text-[10px]">&#x2709;</span> Description
        </label>
        <textarea
          value={formExtra.description || ""}
          onChange={(e) => setFormExtra("description", e.target.value)}
          placeholder="Describe when this scoring rule applies..."
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

export default function MasterDataLeadScoringRules() {
  return <MasterDataTable config={config} />;
}
