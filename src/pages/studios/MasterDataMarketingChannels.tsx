import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
  Search, DollarSign, Users, Megaphone, Mail, Handshake, UserPlus, Star,
  FileText, MessageSquare, MessageCircle, Newspaper, CalendarCheck, Phone,
  Briefcase, Palette, AlignLeft, Code, Wifi, WifiOff,
} from "lucide-react";

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "Search", label: "Search", icon: Search },
  { value: "DollarSign", label: "Paid", icon: DollarSign },
  { value: "Users", label: "Social", icon: Users },
  { value: "Megaphone", label: "Promo", icon: Megaphone },
  { value: "Mail", label: "Email", icon: Mail },
  { value: "Handshake", label: "Affiliate", icon: Handshake },
  { value: "UserPlus", label: "Referral", icon: UserPlus },
  { value: "Star", label: "Influencer", icon: Star },
  { value: "FileText", label: "Content", icon: FileText },
  { value: "MessageSquare", label: "SMS", icon: MessageSquare },
  { value: "MessageCircle", label: "WhatsApp", icon: MessageCircle },
  { value: "Newspaper", label: "Offline", icon: Newspaper },
  { value: "CalendarCheck", label: "Event", icon: CalendarCheck },
  { value: "Phone", label: "Telecall", icon: Phone },
  { value: "Briefcase", label: "Sales", icon: Briefcase },
];

const COLOR_PRESETS = [
  "#4285f4", "#fbbc04", "#1877F2", "#E4405F", "#ea4335",
  "#a855f7", "#34a853", "#e91e63", "#e8710a", "#25D366",
  "#5f6368", "#4f46e5", "#0d9488", "#d4a017", "#1a73e8",
  "#9aa0a6", "#0d652d", "#8430ce",
];

const MARKETING_TYPES = [
  { value: "SEO", label: "SEO" },
  { value: "SEM", label: "SEM" },
  { value: "Social Media", label: "Social Media" },
  { value: "Email", label: "Email" },
  { value: "Partnership", label: "Partnership" },
  { value: "Content", label: "Content" },
  { value: "Messaging", label: "Messaging" },
  { value: "Offline", label: "Offline" },
  { value: "Direct", label: "Direct" },
];

const TYPE_COLORS: Record<string, string> = {
  "SEO": "#4285f4",
  "SEM": "#fbbc04",
  "Social Media": "#1877F2",
  "Email": "#ea4335",
  "Partnership": "#a855f7",
  "Content": "#e8710a",
  "Messaging": "#25D366",
  "Offline": "#5f6368",
  "Direct": "#0d9488",
};

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || Megaphone;
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Marketing Channels",
  subtitle: "Configure marketing channel classifications used across the organization.",
  entityName: "MarketingChannel",
  entityNamePlural: "Marketing Channels",
  backRoute: "/studios/master-data/crm",
  backLabel: "Back to CRM Masters",

  apiModule: {
    list: api.crmMarketingChannels.listMarketingChannels,
    get: api.crmMarketingChannels.getMarketingChannel,
    create: api.crmMarketingChannels.createMarketingChannel,
    update: api.crmMarketingChannels.updateMarketingChannel,
    delete: api.crmMarketingChannels.deleteMarketingChannel,
    duplicate: api.crmMarketingChannels.duplicateMarketingChannel,
    reorder: api.crmMarketingChannels.reorderMarketingChannels,
    seedDefault: api.crmMarketingChannels.seedDefaultMarketingChannels,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.active);
    const online = items.filter((s: any) => s.isOnline);
    const offline = items.filter((s: any) => !s.isOnline);
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    const types = new Set(items.map((s: any) => s.marketingType));
    return [
      { label: "Total Channels", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Online", value: online.length, valueColor: "#4285f4" },
      { label: "Offline", value: offline.length, valueColor: "#e8710a" },
      { label: "Types", value: types.size },
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
      header: "Type",
      width: "w-28",
      cell: (item: any) => {
        const catColor = TYPE_COLORS[item.marketingType] || "#9aa0a6";
        return (
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: catColor + "18", color: catColor }}
          >
            {item.marketingType}
          </span>
        );
      },
    },
    {
      header: "Online",
      width: "w-16",
      cell: (item: any) => (
        item.isOnline
          ? <Wifi className="h-3.5 w-3.5 text-[#4285f4]" />
          : <WifiOff className="h-3.5 w-3.5 text-[#9aa0a6]" />
      ),
    },
  ],

  getDefaultFormExtra: () => ({ code: "", marketingType: "SEO", isOnline: true, description: "" }),
  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    marketingType: item.marketingType || "SEO",
    isOnline: item.isOnline ?? true,
    description: item.description || "",
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Marketing channel code is required.";
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
          placeholder="e.g. PAID_SEARCH"
        />
      </div>

      {/* Marketing Type */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Search className="h-3 w-3 inline mr-1" /> Marketing Type
        </label>
        <select
          value={formExtra.marketingType || "SEO"}
          onChange={(e) => setFormExtra("marketingType", e.target.value)}
          className="w-full h-8 text-[12px] px-2.5 rounded-lg border border-[#e8eaed] bg-white focus:outline-none focus:border-[#1a1a2e]"
        >
          {MARKETING_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Online Toggle */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Wifi className="h-3 w-3 inline mr-1" /> Online Channel
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFormExtra("isOnline", !formExtra.isOnline)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              formExtra.isOnline ? "bg-[#4285f4]" : "bg-[#dadce0]"
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                formExtra.isOnline ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className="text-[11px] text-[#5f6368]">
            {formExtra.isOnline ? "Yes — Digital/Online channel" : "No — Offline channel"}
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
          placeholder="Brief description of this marketing channel..."
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

export default function MasterDataMarketingChannels() {
  return <MasterDataTable config={config} />;
}
