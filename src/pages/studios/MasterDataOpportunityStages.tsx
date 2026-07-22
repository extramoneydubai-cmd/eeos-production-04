import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
  BadgeCheck, Search, FileText, Handshake, DollarSign, Clock, Award,
  XCircle, PauseCircle, Ban, TrendingUp, Target, Flag, ShieldCheck,
  BarChart3, Percent, CheckCircle, AlertTriangle, Zap, Layers,
} from "lucide-react";

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "BadgeCheck", label: "Qualified", icon: BadgeCheck },
  { value: "Search", label: "Analysis", icon: Search },
  { value: "FileText", label: "Proposal", icon: FileText },
  { value: "Handshake", label: "Negotiation", icon: Handshake },
  { value: "DollarSign", label: "Fee", icon: DollarSign },
  { value: "Clock", label: "Pending", icon: Clock },
  { value: "Award", label: "Won", icon: Award },
  { value: "XCircle", label: "Lost", icon: XCircle },
  { value: "PauseCircle", label: "Hold", icon: PauseCircle },
  { value: "Ban", label: "Cancelled", icon: Ban },
  { value: "TrendingUp", label: "Growth", icon: TrendingUp },
  { value: "Target", label: "Target", icon: Target },
  { value: "Flag", label: "Flag", icon: Flag },
  { value: "ShieldCheck", label: "Guaranteed", icon: ShieldCheck },
  { value: "BarChart3", label: "Chart", icon: BarChart3 },
  { value: "Percent", label: "Percent", icon: Percent },
  { value: "CheckCircle", label: "Success", icon: CheckCircle },
  { value: "AlertTriangle", label: "Warning", icon: AlertTriangle },
  { value: "Zap", label: "Hot", icon: Zap },
  { value: "Layers", label: "Pipeline", icon: Layers },
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
  title: "Opportunity Stages",
  subtitle: "Define the sales pipeline stages from qualification to closed won/lost. Each stage includes probability and stage order.",
  entityName: "OpportunityStage",
  entityNamePlural: "Opportunity Stages",
  backRoute: "/studios/master-data/sales",
  backLabel: "Back to Sales Masters",

  apiModule: {
    list: api.salesOpportunityStages.listOpportunityStages,
    get: api.salesOpportunityStages.getOpportunityStage,
    create: api.salesOpportunityStages.createOpportunityStage,
    update: api.salesOpportunityStages.updateOpportunityStage,
    delete: api.salesOpportunityStages.deleteOpportunityStage,
    duplicate: api.salesOpportunityStages.duplicateOpportunityStage,
    reorder: api.salesOpportunityStages.reorderOpportunityStages,
    seedDefault: api.salesOpportunityStages.seedDefault,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.active);
    const open = items.filter((s: any) => !s.isClosed);
    const closed = items.filter((s: any) => s.isClosed);
    const won = items.find((s: any) => s.code === "STG_WON");
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total Stages", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Open Stages", value: open.length, valueColor: "#4285f4" },
      { label: "Closed Stages", value: closed.length, valueColor: "#5f6368" },
      { label: "Avg Probability", value: items.length ? `${Math.round(items.reduce((s: number, i: any) => s + i.probability, 0) / items.length)}%` : "0%", valueColor: "#a855f7" },
      { label: "Updated (Recent)", value: sortedByUpdated.length ? formatDate(sortedByUpdated[0].updatedAt) : "—", valueColor: "#1a73e8" },
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
      header: "Stage Order",
      width: "w-20",
      cell: (item: any) => (
        <span className="text-[12px] font-mono font-bold text-[#1a1a2e]">
          #{item.stageOrder}
        </span>
      ),
    },
    {
      header: "Probability",
      width: "w-20",
      cell: (item: any) => (
        <div className="flex items-center gap-1.5">
          <div className="w-12 h-1.5 rounded-full bg-[#f1f3f4] overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${item.probability}%`,
                backgroundColor: item.probability >= 80 ? "#34a853" : item.probability >= 50 ? "#f59e0b" : "#ea4335",
              }}
            />
          </div>
          <span className="text-[11px] font-mono font-semibold text-[#5f6368]">
            {item.probability}%
          </span>
        </div>
      ),
    },
    {
      header: "Type",
      width: "w-20",
      cell: (item: any) => {
        const isClosed = item.isClosed;
        return (
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
              isClosed
                ? "bg-[#fce8e6] text-[#ea4335]"
                : "bg-[#e6f4ea] text-[#34a853]"
            }`}
          >
            {isClosed ? "Closed" : "Open"}
          </span>
        );
      },
    },
  ],

  getDefaultFormExtra: () => ({ code: "", stageOrder: 1, probability: 50, isClosed: false, description: "" }),
  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    stageOrder: item.stageOrder ?? 1,
    probability: item.probability ?? 0,
    isClosed: item.isClosed ?? false,
    description: item.description || "",
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Stage code is required.";
    if (extra.stageOrder == null || extra.stageOrder < 1) return "Stage order must be 1 or greater.";
    if (extra.probability == null || extra.probability < 0 || extra.probability > 100) return "Probability must be between 0 and 100.";
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
          <code className="h-3 w-3 inline mr-1 text-[10px]">&lt;/&gt;</code> Stage Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. STG_PROPOSAL"
        />
      </div>

      {/* Stage Order */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <span className="h-3 w-3 inline mr-1 text-[10px]">#</span> Stage Order *
        </label>
        <Input
          type="number"
          min={1}
          max={100}
          value={formExtra.stageOrder ?? ""}
          onChange={(e) => setFormExtra("stageOrder", e.target.value ? parseInt(e.target.value) : 1)}
          className="h-8 text-[12px] font-mono"
          placeholder="1"
        />
        <p className="text-[9px] text-[#9aa0a6] mt-0.5">Order in the sales pipeline (1 = first stage).</p>
      </div>

      {/* Probability */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Percent className="h-3 w-3 inline mr-1" /> Probability (%) *
        </label>
        <Input
          type="number"
          min={0}
          max={100}
          value={formExtra.probability ?? ""}
          onChange={(e) => setFormExtra("probability", e.target.value ? parseInt(e.target.value) : 0)}
          className="h-8 text-[12px] font-mono"
          placeholder="50"
        />
        <p className="text-[9px] text-[#9aa0a6] mt-0.5">Estimated close probability (0–100%).</p>
      </div>

      {/* Is Closed */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <CheckCircle className="h-3 w-3 inline mr-1" /> Stage Type
        </label>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={formExtra.isClosed ?? false}
              onChange={(e) => setFormExtra("isClosed", e.target.checked)}
              className="h-4 w-4 rounded border-[#e8eaed] text-[#1a1a2e] focus:ring-[#1a1a2e]"
            />
            <span className="text-[12px] text-[#5f6368]">This is a closed stage (won/lost)</span>
          </label>
        </div>
        <p className="text-[9px] text-[#9aa0a6] mt-0.5">Closed stages mark the end of the sales pipeline.</p>
      </div>

      {/* Description */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <span className="h-3 w-3 inline mr-1 text-[10px]">&#x2709;</span> Description
        </label>
        <textarea
          value={formExtra.description || ""}
          onChange={(e) => setFormExtra("description", e.target.value)}
          placeholder="Describe what happens at this stage..."
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

export default function MasterDataOpportunityStages() {
  return <MasterDataTable config={config} />;
}
