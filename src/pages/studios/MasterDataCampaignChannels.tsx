import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Globe, MessageCircle, MessageSquare, Mail, Search, MonitorPlay, Monitor,
  Facebook, Instagram, Linkedin, Youtube, Newspaper, Radio, Trees,
  CalendarCheck, Handshake, Palette, AlignLeft, Code, Wifi, WifiOff,
  Megaphone, Smartphone, Tv,
} from "lucide-react";

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "Globe", label: "Web", icon: Globe },
  { value: "MessageCircle", label: "WhatsApp", icon: MessageCircle },
  { value: "MessageSquare", label: "SMS", icon: MessageSquare },
  { value: "Mail", label: "Email", icon: Mail },
  { value: "Search", label: "Search", icon: Search },
  { value: "MonitorPlay", label: "Display", icon: MonitorPlay },
  { value: "Facebook", label: "Facebook", icon: Facebook },
  { value: "Instagram", label: "Instagram", icon: Instagram },
  { value: "Linkedin", label: "LinkedIn", icon: Linkedin },
  { value: "Youtube", label: "YouTube", icon: Youtube },
  { value: "Newspaper", label: "Print", icon: Newspaper },
  { value: "Radio", label: "Radio", icon: Radio },
  { value: "Tv", label: "TV", icon: Tv },
  { value: "Trees", label: "Outdoor", icon: Trees },
  { value: "CalendarCheck", label: "Event", icon: CalendarCheck },
  { value: "Handshake", label: "Partner", icon: Handshake },
  { value: "Smartphone", label: "Mobile", icon: Smartphone },
  { value: "Megaphone", label: "Campaign", icon: Megaphone },
];

const COLOR_PRESETS = [
  "#1877F2", "#E4405F", "#0A66C2", "#FF0000", "#25D366",
  "#4285f4", "#fbbc04", "#34a853", "#ea4335", "#a855f7",
  "#5f6368", "#e8710a", "#d93025", "#0d9488", "#4f46e5",
  "#d4a017", "#9aa0a6", "#1a73e8",
];

const CHANNEL_CATEGORIES = [
  { value: "Social Media", label: "Social Media" },
  { value: "Search", label: "Search" },
  { value: "Display", label: "Display" },
  { value: "Video", label: "Video" },
  { value: "Messaging", label: "Messaging" },
  { value: "Email", label: "Email" },
  { value: "Website", label: "Website" },
  { value: "Print", label: "Print" },
  { value: "Broadcast", label: "Broadcast" },
  { value: "Outdoor", label: "Outdoor" },
  { value: "Event", label: "Event" },
  { value: "Referral", label: "Referral" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Social Media": "#1877F2",
  "Search": "#4285f4",
  "Display": "#fbbc04",
  "Video": "#FF0000",
  "Messaging": "#25D366",
  "Email": "#ea4335",
  "Website": "#a855f7",
  "Print": "#5f6368",
  "Broadcast": "#e8710a",
  "Outdoor": "#0d9488",
  "Event": "#4f46e5",
  "Referral": "#d4a017",
};

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || Megaphone;
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Campaign Channels",
  subtitle: "Configure the marketing campaign channels used across the organization.",
  entityName: "CampaignChannel",
  entityNamePlural: "Campaign Channels",
  backRoute: "/studios/master-data/crm",
  backLabel: "Back to CRM Masters",

  apiModule: {
    list: api.crmCampaignChannels.listCampaignChannels,
    get: api.crmCampaignChannels.getCampaignChannel,
    create: api.crmCampaignChannels.createCampaignChannel,
    update: api.crmCampaignChannels.updateCampaignChannel,
    delete: api.crmCampaignChannels.deleteCampaignChannel,
    duplicate: api.crmCampaignChannels.duplicateCampaignChannel,
    reorder: api.crmCampaignChannels.reorderCampaignChannels,
    seedDefault: api.crmCampaignChannels.seedDefaultChannels,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.active);
    const digital = items.filter((s: any) => s.isDigital);
    const offline = items.filter((s: any) => !s.isDigital);
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    const categories = new Set(items.map((s: any) => s.channelCategory));
    return [
      { label: "Total Channels", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Digital", value: digital.length, valueColor: "#4285f4" },
      { label: "Offline", value: offline.length, valueColor: "#e8710a" },
      { label: "Categories", value: categories.size },
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
        const catColor = CATEGORY_COLORS[item.channelCategory] || "#9aa0a6";
        return (
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: catColor + "18", color: catColor }}
          >
            {item.channelCategory}
          </span>
        );
      },
    },
    {
      header: "Digital",
      width: "w-16",
      cell: (item: any) => (
        item.isDigital
          ? <Wifi className="h-3.5 w-3.5 text-[#34a853]" />
          : <WifiOff className="h-3.5 w-3.5 text-[#9aa0a6]" />
      ),
    },
  ],

  getDefaultFormExtra: () => ({ code: "", channelCategory: "Social Media", isDigital: true, description: "" }),
  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    channelCategory: item.channelCategory || "Social Media",
    isDigital: item.isDigital ?? true,
    description: item.description || "",
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Campaign channel code is required.";
    return null;
  },

  renderFormFields: ({
    formExtra, setFormExtra, formColor, setFormColor, formIcon, setFormIcon,
    showColorPicker, setShowColorPicker,
  }) => (
    <>
      {/* Channel Code */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Code className="h-3 w-3 inline mr-1" /> Channel Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. FB"
        />
      </div>

      {/* Channel Category */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Megaphone className="h-3 w-3 inline mr-1" /> Channel Category
        </label>
        <select
          value={formExtra.channelCategory || "Social Media"}
          onChange={(e) => setFormExtra("channelCategory", e.target.value)}
          className="w-full h-8 text-[12px] px-2.5 rounded-lg border border-[#e8eaed] bg-white focus:outline-none focus:border-[#1a1a2e]"
        >
          {CHANNEL_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Digital Toggle */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Smartphone className="h-3 w-3 inline mr-1" /> Digital Channel
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFormExtra("isDigital", !formExtra.isDigital)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              formExtra.isDigital ? "bg-[#34a853]" : "bg-[#dadce0]"
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                formExtra.isDigital ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className="text-[11px] text-[#5f6368]">
            {formExtra.isDigital ? "Yes — Online channel" : "No — Offline channel"}
          </span>
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
          placeholder="Brief description of this channel..."
          className="w-full min-h-[50px] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]"
          rows={2}
        />
      </div>

      {/* Color */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Palette className="h-3 w-3 inline mr-1" /> Channel Color
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

export default function MasterDataCampaignChannels() {
  return <MasterDataTable config={config} />;
}
