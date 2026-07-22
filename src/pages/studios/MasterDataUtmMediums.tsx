import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
  DollarSign, Search, Users, Mail, MonitorPlay, Handshake, UserPlus, Youtube,
  Image, Bell, MessageSquare, MessageCircle, Palette, AlignLeft, Code, Radio,
} from "lucide-react";

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "DollarSign", label: "CPC", icon: DollarSign },
  { value: "Search", label: "Organic", icon: Search },
  { value: "Users", label: "Social", icon: Users },
  { value: "Mail", label: "Email", icon: Mail },
  { value: "MonitorPlay", label: "Display", icon: MonitorPlay },
  { value: "Handshake", label: "Affiliate", icon: Handshake },
  { value: "UserPlus", label: "Referral", icon: UserPlus },
  { value: "Youtube", label: "Video", icon: Youtube },
  { value: "Image", label: "Banner", icon: Image },
  { value: "Bell", label: "Push", icon: Bell },
  { value: "MessageSquare", label: "SMS", icon: MessageSquare },
  { value: "MessageCircle", label: "WhatsApp", icon: MessageCircle },
  { value: "Radio", label: "Broadcast", icon: Radio },
];

const COLOR_PRESETS = [
  "#4285f4", "#34a853", "#1877F2", "#ea4335", "#fbbc04",
  "#a855f7", "#d4a017", "#FF0000", "#e8710a", "#4f46e5",
  "#25D366", "#1a73e8", "#5f6368", "#9aa0a6", "#0d652d",
];

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || Radio;
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "UTM Mediums",
  subtitle: "Manage standard UTM medium values used for campaign attribution and analytics.",
  entityName: "UtmMedium",
  entityNamePlural: "UTM Mediums",
  backRoute: "/studios/master-data/crm",
  backLabel: "Back to CRM Masters",

  apiModule: {
    list: api.crmUtmMediums.listUtmMediums,
    get: api.crmUtmMediums.getUtmMedium,
    create: api.crmUtmMediums.createUtmMedium,
    update: api.crmUtmMediums.updateUtmMedium,
    delete: api.crmUtmMediums.deleteUtmMedium,
    duplicate: api.crmUtmMediums.duplicateUtmMedium,
    reorder: api.crmUtmMediums.reorderUtmMediums,
    seedDefault: api.crmUtmMediums.seedDefaultUtmMediums,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.active);
    const inactive = items.filter((s: any) => !s.active);
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total Mediums", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Inactive", value: inactive.length, valueColor: "#9aa0a6" },
      { label: "First Medium", value: items.length > 0 ? items[0].name : "—" },
      { label: "Last Medium", value: items.length > 0 ? items[items.length - 1].name : "—" },
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
  ],

  getDefaultFormExtra: () => ({ code: "", description: "" }),
  getFormExtraFromItem: (item: any) => ({ code: item.code || "", description: item.description || "" }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "UTM medium code is required.";
    return null;
  },

  renderFormFields: ({
    formExtra, setFormExtra, formColor, setFormColor, formIcon, setFormIcon,
    showColorPicker, setShowColorPicker,
  }) => (
    <>
      {/* UTM Medium Code */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Code className="h-3 w-3 inline mr-1" /> Medium Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toLowerCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. cpc"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <AlignLeft className="h-3 w-3 inline mr-1" /> Description
        </label>
        <textarea
          value={formExtra.description || ""}
          onChange={(e) => setFormExtra("description", e.target.value)}
          placeholder="Brief description of this UTM medium..."
          className="w-full min-h-[50px] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]"
          rows={2}
        />
      </div>

      {/* Color */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Palette className="h-3 w-3 inline mr-1" /> Medium Color
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
        <div className="grid grid-cols-4 gap-1.5">
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

export default function MasterDataUtmMediums() {
  return <MasterDataTable config={config} />;
}
