import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
  Phone, MessageCircle, Mail, MessageSquare, Video, Building, Home,
  Monitor, HeartHandshake, FileText, DollarSign, Users, Calendar,
  Presentation, Ellipsis, Palette, AlignLeft, Code, Bell, Clock,
} from "lucide-react";

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "Phone", label: "Call", icon: Phone },
  { value: "MessageCircle", label: "WhatsApp", icon: MessageCircle },
  { value: "Mail", label: "Email", icon: Mail },
  { value: "MessageSquare", label: "SMS", icon: MessageSquare },
  { value: "Video", label: "Video", icon: Video },
  { value: "Building", label: "Office", icon: Building },
  { value: "Home", label: "Home", icon: Home },
  { value: "Monitor", label: "Demo", icon: Monitor },
  { value: "HeartHandshake", label: "Counsel", icon: HeartHandshake },
  { value: "FileText", label: "Docs", icon: FileText },
  { value: "DollarSign", label: "Fee", icon: DollarSign },
  { value: "Users", label: "Meeting", icon: Users },
  { value: "Calendar", label: "Follow-up", icon: Calendar },
  { value: "Presentation", label: "Present", icon: Presentation },
  { value: "Ellipsis", label: "Other", icon: Ellipsis },
];

const COLOR_PRESETS = [
  "#4285f4", "#25D366", "#ea4335", "#34a853", "#a855f7",
  "#0d9488", "#e8710a", "#fbbc04", "#4f46e5", "#5f6368",
  "#d4a017", "#1a73e8", "#0d652d", "#e91e63", "#9aa0a6",
];

const FOLLOW_UP_CATEGORIES = [
  { value: "Call", label: "Call" },
  { value: "Messaging", label: "Messaging" },
  { value: "Visit", label: "Visit" },
  { value: "Session", label: "Session" },
  { value: "Meeting", label: "Meeting" },
  { value: "Admin", label: "Admin" },
  { value: "Finance", label: "Finance" },
  { value: "General", label: "General" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Call": "#4285f4",
  "Messaging": "#25D366",
  "Visit": "#e8710a",
  "Session": "#fbbc04",
  "Meeting": "#4f46e5",
  "Admin": "#5f6368",
  "Finance": "#d4a017",
  "General": "#9aa0a6",
};

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || Phone;
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Follow-up Types",
  subtitle: "Configure follow-up types used across the CRM for lead engagement.",
  entityName: "FollowUpType",
  entityNamePlural: "Follow-up Types",
  backRoute: "/studios/master-data/crm",
  backLabel: "Back to CRM Masters",

  apiModule: {
    list: api.crmFollowUpTypes.listFollowUpTypes,
    get: api.crmFollowUpTypes.getFollowUpType,
    create: api.crmFollowUpTypes.createFollowUpType,
    update: api.crmFollowUpTypes.updateFollowUpType,
    delete: api.crmFollowUpTypes.deleteFollowUpType,
    duplicate: api.crmFollowUpTypes.duplicateFollowUpType,
    reorder: api.crmFollowUpTypes.reorderFollowUpTypes,
    seedDefault: api.crmFollowUpTypes.seedDefaultFollowUpTypes,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.active);
    const reminderEnabled = items.filter((s: any) => s.requiresReminder);
    const categories = new Set(items.map((s: any) => s.followUpCategory));
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total Types", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Reminder Enabled", value: reminderEnabled.length, valueColor: "#4285f4" },
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
        const catColor = CATEGORY_COLORS[item.followUpCategory] || "#9aa0a6";
        return (
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: catColor + "18", color: catColor }}
          >
            {item.followUpCategory}
          </span>
        );
      },
    },
    {
      header: "Reminder",
      width: "w-24",
      cell: (item: any) => (
        item.requiresReminder
          ? <span className="text-[11px] text-[#4285f4] font-medium">
              <Bell className="h-3 w-3 inline mr-0.5" />
              {item.defaultReminderDays ? `${item.defaultReminderDays}d` : "On"}
            </span>
          : <span className="text-[11px] text-[#9aa0a6]">—</span>
      ),
    },
  ],

  getDefaultFormExtra: () => ({ code: "", followUpCategory: "Call", requiresReminder: true, defaultReminderDays: 1, description: "" }),
  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    followUpCategory: item.followUpCategory || "Call",
    requiresReminder: item.requiresReminder ?? true,
    defaultReminderDays: item.defaultReminderDays ?? 1,
    description: item.description || "",
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Follow-up type code is required.";
    if (!extra.followUpCategory) return "Category is required.";
    if (extra.requiresReminder && (!extra.defaultReminderDays || extra.defaultReminderDays < 1)) {
      return "Reminder days must be at least 1 when reminders are enabled.";
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
          <Code className="h-3 w-3 inline mr-1" /> Type Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. PHONE"
        />
      </div>

      {/* Follow-up Category */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Phone className="h-3 w-3 inline mr-1" /> Follow-up Category
        </label>
        <select
          value={formExtra.followUpCategory || "Call"}
          onChange={(e) => setFormExtra("followUpCategory", e.target.value)}
          className="w-full h-8 text-[12px] px-2.5 rounded-lg border border-[#e8eaed] bg-white focus:outline-none focus:border-[#1a1a2e]"
        >
          {FOLLOW_UP_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Requires Reminder Toggle + Days */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
            <Bell className="h-3 w-3 inline mr-1" /> Requires Reminder
          </label>
          <div className="flex items-center gap-2 h-8">
            <button
              onClick={() => setFormExtra("requiresReminder", !formExtra.requiresReminder)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                formExtra.requiresReminder ? "bg-[#4285f4]" : "bg-[#dadce0]"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  formExtra.requiresReminder ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="text-[11px] text-[#5f6368]">
              {formExtra.requiresReminder ? "Yes" : "No"}
            </span>
          </div>
        </div>
        <div>
          <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
            <Clock className="h-3 w-3 inline mr-1" /> Reminder Days
          </label>
          <Input
            type="number"
            min={1}
            value={formExtra.requiresReminder ? (formExtra.defaultReminderDays ?? 1) : ""}
            onChange={(e) => setFormExtra("defaultReminderDays", e.target.value ? parseInt(e.target.value) : undefined)}
            disabled={!formExtra.requiresReminder}
            className="h-8 text-[12px]"
            placeholder="e.g. 1"
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
          placeholder="Brief description of this follow-up type..."
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

export default function MasterDataFollowUpTypes() {
  return <MasterDataTable config={config} />;
}
