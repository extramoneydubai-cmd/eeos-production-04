import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
  GraduationCap, ThumbsUp, CalendarClock, Heart, Award, Monitor, FileText,
  DollarSign, ThumbsDown, XCircle, CheckCircle, Clock, Zap, UserCheck,
  TrendingUp, ListChecks, ClipboardList, MessageSquare, Headphones, Sparkles,
} from "lucide-react";

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "GraduationCap", label: "Admission", icon: GraduationCap },
  { value: "ThumbsUp", label: "Interested", icon: ThumbsUp },
  { value: "CalendarClock", label: "Callback", icon: CalendarClock },
  { value: "Heart", label: "Parent", icon: Heart },
  { value: "Award", label: "Scholarship", icon: Award },
  { value: "Monitor", label: "Demo", icon: Monitor },
  { value: "FileText", label: "Documents", icon: FileText },
  { value: "DollarSign", label: "Fee", icon: DollarSign },
  { value: "ThumbsDown", label: "Not Int.", icon: ThumbsDown },
  { value: "XCircle", label: "Lost", icon: XCircle },
  { value: "CheckCircle", label: "Ready", icon: CheckCircle },
  { value: "Clock", label: "Pending", icon: Clock },
  { value: "Zap", label: "Hot", icon: Zap },
  { value: "UserCheck", label: "Prospect", icon: UserCheck },
  { value: "TrendingUp", label: "Pipeline", icon: TrendingUp },
  { value: "ListChecks", label: "Checklist", icon: ListChecks },
  { value: "ClipboardList", label: "Outcome", icon: ClipboardList },
  { value: "MessageSquare", label: "Follow-up", icon: MessageSquare },
  { value: "Headphones", label: "Support", icon: Headphones },
  { value: "Sparkles", label: "Premium", icon: Sparkles },
];

const COLOR_PRESETS = [
  "#1a73e8", "#34a853", "#ea4335", "#fbbc04", "#a855f7",
  "#e91e63", "#4f46e5", "#0d9488", "#e8710a", "#06b6d4",
  "#5f6368", "#4285f4", "#1877F2", "#25D366", "#d4a017",
  "#f43f5e", "#14b8a6", "#f97316", "#8b5cf6", "#22c55e",
];

const OUTCOME_CATEGORIES = [
  { value: "Positive", label: "Positive" },
  { value: "Neutral", label: "Neutral" },
  { value: "Negative", label: "Negative" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Positive: "#34a853",
  Neutral: "#fbbc04",
  Negative: "#ea4335",
};

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || ClipboardList;
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Counselling Outcomes",
  subtitle: "Manage counselling session outcomes and recommended actions across the CRM.",
  entityName: "CounsellingOutcome",
  entityNamePlural: "Counselling Outcomes",
  backRoute: "/studios/master-data/crm",
  backLabel: "Back to CRM Masters",

  apiModule: {
    list: api.crmCounsellingOutcomes.listCounsellingOutcomes,
    get: api.crmCounsellingOutcomes.getCounsellingOutcome,
    create: api.crmCounsellingOutcomes.createCounsellingOutcome,
    update: api.crmCounsellingOutcomes.updateCounsellingOutcome,
    delete: api.crmCounsellingOutcomes.deleteCounsellingOutcome,
    duplicate: api.crmCounsellingOutcomes.duplicateCounsellingOutcome,
    reorder: api.crmCounsellingOutcomes.reorderCounsellingOutcomes,
    seedDefault: api.crmCounsellingOutcomes.seedDefault,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.active);
    const positive = items.filter((s: any) => s.outcomeCategory === "Positive");
    const negative = items.filter((s: any) => s.outcomeCategory === "Negative");
    const categories = new Set(items.map((s: any) => s.outcomeCategory));
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total Outcomes", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Positive", value: positive.length, valueColor: "#1a73e8" },
      { label: "Negative", value: negative.length, valueColor: "#ea4335" },
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
      header: "Action",
      width: "w-36",
      cell: (item: any) => (
        item.recommendedAction
          ? <span className="text-[11px] text-[#5f6368]">{item.recommendedAction}</span>
          : <span className="text-[11px] text-[#9aa0a6]">—</span>
      ),
    },
  ],

  getDefaultFormExtra: () => ({ code: "", outcomeCategory: "Neutral", recommendedAction: "", description: "" }),
  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    outcomeCategory: item.outcomeCategory || "Neutral",
    recommendedAction: item.recommendedAction || "",
    description: item.description || "",
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Counselling outcome code is required.";
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
          <code className="h-3 w-3 inline mr-1 text-[10px]">&lt;/&gt;</code> Outcome Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. ADM_READY"
        />
      </div>

      {/* Outcome Category */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <TrendingUp className="h-3 w-3 inline mr-1" /> Outcome Category
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

      {/* Recommended Action */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Zap className="h-3 w-3 inline mr-1" /> Recommended Action
        </label>
        <select
          value={formExtra.recommendedAction || ""}
          onChange={(e) => setFormExtra("recommendedAction", e.target.value)}
          className="w-full h-8 text-[12px] px-2.5 rounded-lg border border-[#e8eaed] bg-white focus:outline-none focus:border-[#1a1a2e]"
        >
          <option value="">None</option>
          <option value="Proceed to Admission">Proceed to Admission</option>
          <option value="Schedule Follow-up">Schedule Follow-up</option>
          <option value="Schedule Follow-up Call">Schedule Follow-up Call</option>
          <option value="Schedule Parent Counselling">Schedule Parent Counselling</option>
          <option value="Explain Scholarship Options">Explain Scholarship Options</option>
          <option value="Schedule Demo Session">Schedule Demo Session</option>
          <option value="Share Document Checklist">Share Document Checklist</option>
          <option value="Share Fee Structure & Payment Plans">Share Fee Structure & Payment Plans</option>
          <option value="Mark as Lost">Mark as Lost</option>
          <option value="Move to Lost Pipeline">Move to Lost Pipeline</option>
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
          placeholder="Brief description of this counselling outcome..."
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

export default function MasterDataCounsellingOutcomes() {
  return <MasterDataTable config={config} />;
}
