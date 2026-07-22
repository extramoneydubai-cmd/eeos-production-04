import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "convex/react";
import {
  GraduationCap, Award, Wrench, Bird, Sparkles, Building,
  Briefcase, UserPlus, Target, Megaphone, Calendar, Flag,
  Palette, AlignLeft, Code, CalendarIcon, Layers,
  Globe, TrendingUp, Zap, HeartHandshake, Star,
} from "lucide-react";

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "GraduationCap", label: "Admission", icon: GraduationCap },
  { value: "Award", label: "Scholarship", icon: Award },
  { value: "Wrench", label: "Workshop", icon: Wrench },
  { value: "Bird", label: "Early Bird", icon: Bird },
  { value: "Sparkles", label: "Festive", icon: Sparkles },
  { value: "Building", label: "Launch", icon: Building },
  { value: "Briefcase", label: "Corporate", icon: Briefcase },
  { value: "UserPlus", label: "Referral", icon: UserPlus },
  { value: "Target", label: "Target", icon: Target },
  { value: "Megaphone", label: "Promo", icon: Megaphone },
  { value: "Calendar", label: "Seasonal", icon: Calendar },
  { value: "Flag", label: "Campaign", icon: Flag },
  { value: "Globe", label: "Global", icon: Globe },
  { value: "TrendingUp", label: "Growth", icon: TrendingUp },
  { value: "Zap", label: "Flash", icon: Zap },
  { value: "HeartHandshake", label: "Retention", icon: HeartHandshake },
  { value: "Star", label: "Featured", icon: Star },
  { value: "Layers", label: "General", icon: Layers },
];

const COLOR_PRESETS = [
  "#4285f4", "#34a853", "#ea4335", "#fbbc04", "#a855f7",
  "#e8710a", "#06b6d4", "#0d9488", "#1a1a2e", "#f43f5e",
  "#4f46e5", "#5f6368", "#0d652d", "#10b981", "#f59e0b",
  "#9aa0a6", "#d4a017", "#e8f0fe", "#fce8e6", "#f3e8ff",
];

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || Target;
}

/* ─── Sub-Components ─── */

function CampaignTypeCell({ campaignTypeId }: { campaignTypeId: string }) {
  const types = useQuery(api.crmCampaignTypes.listCampaignTypes);
  const ct = types?.find((t: any) => t._id === campaignTypeId);
  if (!ct) return <span className="text-[11px] text-[#9aa0a6]">Unknown</span>;
  const IconComp = getIconComponent(ct.icon);
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3.5 h-3.5 rounded flex items-center justify-center" style={{ backgroundColor: ct.color }}>
        <IconComp className="h-2 w-2 text-white" />
      </div>
      <span className="text-[11px] font-medium text-[#5f6368]">{ct.name}</span>
    </div>
  );
}

function CampaignTypeDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const types = useQuery(api.crmCampaignTypes.listCampaignTypes);
  return (
    <div>
      <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
        <Flag className="h-3 w-3 inline mr-1" /> Campaign Type *
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-[12px]">
          <SelectValue placeholder="Select campaign type" />
        </SelectTrigger>
        <SelectContent>
          {types?.map((t: any) => {
            const IconComp = getIconComponent(t.icon);
            return (
              <SelectItem key={t._id} value={t._id} className="text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: t.color }}>
                    <IconComp className="h-2.5 w-2.5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span>{t.name}</span>
                    <span className="text-[10px] text-[#9aa0a6]">{t.campaignCategory}</span>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

function formatTimestamp(ts: number | undefined): string {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "UTM Campaigns",
  subtitle: "Manage reusable campaign names for marketing attribution and analytics.",
  entityName: "UtmCampaign",
  entityNamePlural: "UTM Campaigns",
  backRoute: "/studios/master-data/crm",
  backLabel: "Back to CRM Masters",

  apiModule: {
    list: api.crmUtmCampaigns.listUtmCampaigns,
    get: api.crmUtmCampaigns.getUtmCampaign,
    create: api.crmUtmCampaigns.createUtmCampaign,
    update: api.crmUtmCampaigns.updateUtmCampaign,
    delete: api.crmUtmCampaigns.deleteUtmCampaign,
    duplicate: api.crmUtmCampaigns.duplicateUtmCampaign,
    reorder: api.crmUtmCampaigns.reorderUtmCampaigns,
    seedDefault: api.crmUtmCampaigns.seedDefaultUtmCampaigns,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.active);
    const typesCovered = new Set(items.map((s: any) => s.campaignTypeId));
    const running = items.filter((s: any) => {
      if (!s.startDate && !s.endDate) return false;
      const now = Date.now();
      if (s.startDate && s.endDate) return now >= s.startDate && now <= s.endDate;
      if (s.startDate) return now >= s.startDate;
      return now <= s.endDate;
    });
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total Campaigns", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Campaign Types", value: typesCovered.size, valueColor: "#4285f4" },
      { label: "Running", value: running.length, valueColor: "#a855f7" },
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
    {
      header: "Campaign Type",
      width: "w-36",
      cell: (item: any) => <CampaignTypeCell campaignTypeId={item.campaignTypeId} />,
    },
    {
      header: "Dates",
      width: "w-36",
      cell: (item: any) => {
        if (!item.startDate && !item.endDate) return <span className="text-[11px] text-[#9aa0a6]">—</span>;
        const start = item.startDate ? formatTimestamp(item.startDate) : "—";
        const end = item.endDate ? formatTimestamp(item.endDate) : "—";
        return (
          <span className="text-[11px] text-[#5f6368] whitespace-nowrap">
            {start} → {end}
          </span>
        );
      },
    },
  ],

  getDefaultFormExtra: () => ({
    code: "",
    campaignTypeId: "",
    startDate: undefined,
    endDate: undefined,
    description: "",
  }),

  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    campaignTypeId: item.campaignTypeId || "",
    startDate: item.startDate,
    endDate: item.endDate,
    description: item.description || "",
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Campaign code is required.";
    if (!extra.campaignTypeId) return "Campaign type is required.";
    if (extra.startDate && extra.endDate && extra.endDate <= extra.startDate) {
      return "End date must be after start date.";
    }
    return null;
  },

  renderFormFields: ({
    formExtra, setFormExtra, formColor, setFormColor, formIcon, setFormIcon,
    showColorPicker, setShowColorPicker,
  }) => {
    function dateToInput(ts: number | undefined): string {
      if (!ts) return "";
      return new Date(ts).toISOString().split("T")[0];
    }
    function inputToDate(val: string): number | undefined {
      if (!val) return undefined;
      return new Date(val + "T00:00:00Z").getTime();
    }

    return (
      <>
        {/* Campaign Code */}
        <div>
          <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
            <Code className="h-3 w-3 inline mr-1" /> Campaign Code *
          </label>
          <Input
            value={formExtra.code || ""}
            onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
            className="h-8 text-[12px] font-mono"
            placeholder="e.g. ADM2026"
          />
        </div>

        {/* Campaign Type */}
        <CampaignTypeDropdown
          value={formExtra.campaignTypeId || ""}
          onChange={(val) => setFormExtra("campaignTypeId", val)}
        />

        {/* Start Date + End Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
              <CalendarIcon className="h-3 w-3 inline mr-1" /> Start Date
            </label>
            <Input
              type="date"
              value={dateToInput(formExtra.startDate)}
              onChange={(e) => setFormExtra("startDate", inputToDate(e.target.value))}
              className="h-8 text-[12px]"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
              <CalendarIcon className="h-3 w-3 inline mr-1" /> End Date
            </label>
            <Input
              type="date"
              value={dateToInput(formExtra.endDate)}
              onChange={(e) => setFormExtra("endDate", inputToDate(e.target.value))}
              className="h-8 text-[12px]"
            />
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
            placeholder="Brief description of this campaign..."
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
    );
  },
};

/* ─── Page ─── */

export default function MasterDataUtmCampaigns() {
  return <MasterDataTable config={config} />;
}
