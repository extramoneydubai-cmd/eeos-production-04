import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
  ThumbsUp, Zap, Clock, CalendarClock, PhoneOff, Calendar, Monitor,
  FileText, DollarSign, Award, XCircle, Copy, UserX, Palette, AlignLeft, Code,
  TrendingUp, CheckCircle, Ban, UserCheck,
} from "lucide-react";

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "ThumbsUp", label: "Interested", icon: ThumbsUp },
  { value: "Zap", label: "Hot", icon: Zap },
  { value: "Clock", label: "Wait", icon: Clock },
  { value: "CalendarClock", label: "Callback", icon: CalendarClock },
  { value: "PhoneOff", label: "Unreachable", icon: PhoneOff },
  { value: "Calendar", label: "Meeting", icon: Calendar },
  { value: "Monitor", label: "Demo", icon: Monitor },
  { value: "FileText", label: "Docs", icon: FileText },
  { value: "DollarSign", label: "Fee", icon: DollarSign },
  { value: "Award", label: "Converted", icon: Award },
  { value: "XCircle", label: "Lost", icon: XCircle },
  { value: "Copy", label: "Duplicate", icon: Copy },
  { value: "UserX", label: "Wrong", icon: UserX },
  { value: "TrendingUp", label: "Progress", icon: TrendingUp },
  { value: "CheckCircle", label: "Positive", icon: CheckCircle },
  { value: "Ban", label: "Negative", icon: Ban },
  { value: "UserCheck", label: "Valid", icon: UserCheck },
];

const COLOR_PRESETS = [
  "#34a853", "#1a73e8", "#fbbc04", "#e8710a", "#9aa0a6",
  "#5f6368", "#4285f4", "#a855f7", "#d4a017", "#ea4335",
  "#0d652d", "#0d9488", "#4f46e5", "#10b981", "#e91e63",
];

const OUTCOME_CATEGORIES = [
  { value: "Positive", label: "Positive" },
  { value: "Neutral", label: "Neutral" },
  { value: "Negative", label: "Negative" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Positive": "#34a853",
  "Neutral": "#fbbc04",
  "Negative": "#ea4335",
};

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || CheckCircle;
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Follow-up Outcomes",
  subtitle: "Configure follow-up outcome codes used across the CRM to record call and visit results.",
  entityName: "FollowUpOutcome",
  entityNamePlural: "Follow-up Outcomes",
  backRoute: "/studios/master-data/crm",
  backLabel: "Back to CRM Masters",

  apiModule: {
    list: api.crmFollowUpOutcomes.listFollowUpOutcomes,
    get: api.crmFollowUpOutcomes.getFollowUpOutcome,
    create: api.crmFollowUpOutcomes.createFollowUpOutcome,
    update: api.crmFollowUpOutcomes.updateFollowUpOutcome,
    delete: api.crmFollowUpOutcomes.deleteFollowUpOutcome,
    duplicate: api.crmFollowUpOutcomes.duplicateFollowUpOutcome,
    reorder: api.crmFollowUpOutcomes.reorderFollowUpOutcomes,
    seedDefault: api.crmFollowUpOutcomes.seedDefaultFollowUpOutcomes,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.active);
    const positive = items.filter((s: any) => s.isPositive);
    const pipeline = items.filter((s: any) => s.movesPipeline);
    const categories = new Set(items.map((s: any) => s.outcomeCategory));
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total Outcomes", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Positive", value: positive.length, valueColor: "#1a73e8" },
      { label: "Pipeline Movers", value: pipeline.length, valueColor: "#a855f7" },
      { label: "Categories", value: categories.size, valueColor: "#e8710a" },
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
      header: "Category",
      width: "w-24",
      cell: (item: any) => {
        const catColor = CATEGORY_COLORS[item.outcomeCategory] || "#9aa0a6";
        return (
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: catColor + "18", color: catColor }}
          >
            {item.outcomeCategory}
          </span>
        );
      },
    },
    {
      header: "Pipeline",
      width: "w-20",
      cell: (item: any) => (
        item.movesPipeline
          ? <span className="text-[11px] text-[#a855f7] font-medium flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Moves</span>
          : <span className="text-[11px] text-[#9aa0a6]">—</span>
      ),
    },
    {
      header: "Positive",
      width: "w-16",
      cell: (item: any) => (
        item.isPositive
          ? <span className="text-[11px] text-[#34a853] font-medium">✓</span>
          : <span className="text-[11px] text-[#ea4335] font-medium">✗</span>
      ),
    },
  ],

  getDefaultFormExtra: () => ({ code: "", outcomeCategory: "Neutral", movesPipeline: false, isPositive: false, description: "" }),
  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    outcomeCategory: item.outcomeCategory || "Neutral",
    movesPipeline: item.movesPipeline ?? false,
    isPositive: item.isPositive ?? false,
    description: item.description || "",
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Follow-up outcome code is required.";
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
          <Code className="h-3 w-3 inline mr-1" /> Outcome Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. INT"
        />
      </div>

      {/* Outcome Category */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <CheckCircle className="h-3 w-3 inline mr-1" /> Outcome Category
        </label>
        <select
          value={formExtra.outcomeCategory || "Neutral"}
          onChange={(e) => setFormExtra("outcomeCategory", e.target.value)}
          className="w-full h-8 text-[12px] px-2.5 rounded-lg border border-[#e8eaed] bg-white focus:outline-none focus:border-[#1a1a2e]"
        >
          {OUTCOME_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Moves Pipeline + Is Positive Toggles */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
            <TrendingUp className="h-3 w-3 inline mr-1" /> Moves Pipeline
          </label>
          <div className="flex items-center gap-2 h-8">
            <button
              onClick={() => setFormExtra("movesPipeline", !formExtra.movesPipeline)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                formExtra.movesPipeline ? "bg-[#a855f7]" : "bg-[#dadce0]"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  formExtra.movesPipeline ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="text-[11px] text-[#5f6368]">
              {formExtra.movesPipeline ? "Yes" : "No"}
            </span>
          </div>
        </div>
        <div>
          <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
            <ThumbsUp className="h-3 w-3 inline mr-1" /> Positive Outcome
          </label>
          <div className="flex items-center gap-2 h-8">
            <button
              onClick={() => setFormExtra("isPositive", !formExtra.isPositive)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                formExtra.isPositive ? "bg-[#34a853]" : "bg-[#dadce0]"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  formExtra.isPositive ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="text-[11px] text-[#5f6368]">
              {formExtra.isPositive ? "Yes" : "No"}
            </span>
          </div>
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
          placeholder="Brief description of this outcome..."
          className="w-full min-h-[50px] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]"
          rows={2}
        />
      </div>

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

export default function MasterDataFollowUpOutcomes() {
  return <MasterDataTable config={config} />;
}
