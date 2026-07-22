import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BadgeCheck, MapPin, Map, Globe, Wifi, Building2, Target, Flag,
  Home, Compass, Mountain, Trees, LocateFixed, Navigation, Ship,
  Plane, Train, Bus, Car, TowerControl,
} from "lucide-react";

/* ─── Constants ─── */

const TERRITORY_TYPES = [
  "City",
  "Emirate",
  "Region",
  "Country",
  "International",
  "Digital",
  "Corporate",
];

const TYPE_COLORS: Record<string, string> = {
  City: "#4285f4",
  Emirate: "#f59e0b",
  Region: "#0d9488",
  Country: "#1a73e8",
  International: "#4f46e5",
  Digital: "#06b6d4",
  Corporate: "#5f6368",
};

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "BadgeCheck", label: "Badge", icon: BadgeCheck },
  { value: "MapPin", label: "Pin", icon: MapPin },
  { value: "Map", label: "Map", icon: Map },
  { value: "Globe", label: "Globe", icon: Globe },
  { value: "Wifi", label: "Online", icon: Wifi },
  { value: "Building2", label: "Corporate", icon: Building2 },
  { value: "Target", label: "Target", icon: Target },
  { value: "Flag", label: "Flag", icon: Flag },
  { value: "Home", label: "Home", icon: Home },
  { value: "Compass", label: "Compass", icon: Compass },
  { value: "Mountain", label: "Mountain", icon: Mountain },
  { value: "Trees", label: "Nature", icon: Trees },
  { value: "LocateFixed", label: "Locate", icon: LocateFixed },
  { value: "Navigation", label: "Navigate", icon: Navigation },
  { value: "Ship", label: "Ship", icon: Ship },
  { value: "Plane", label: "Plane", icon: Plane },
  { value: "Train", label: "Train", icon: Train },
  { value: "Bus", label: "Bus", icon: Bus },
  { value: "Car", label: "Car", icon: Car },
  { value: "TowerControl", label: "Tower", icon: TowerControl },
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
  title: "Sales Territories",
  subtitle: "Define sales territories — cities, emirates, regions, countries, and digital territories for sales coverage and assignment.",
  entityName: "Territory",
  entityNamePlural: "Sales Territories",
  backRoute: "/studios/master-data/sales",
  backLabel: "Back to Sales Masters",

  apiModule: {
    list: api.salesTerritories.listTerritories,
    get: api.salesTerritories.getTerritory,
    create: api.salesTerritories.createTerritory,
    update: api.salesTerritories.updateTerritory,
    delete: api.salesTerritories.deleteTerritory,
    duplicate: api.salesTerritories.duplicateTerritory,
    reorder: api.salesTerritories.reorderTerritories,
    seedDefault: api.salesTerritories.seedDefault,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.active);
    const types = new Set(items.map((s: any) => s.territoryType));
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total Territories", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Territory Types", value: types.size, valueColor: "#4285f4" },
      { label: "Cities/Emirates", value: items.filter((s: any) => s.territoryType === "City" || s.territoryType === "Emirate").length, valueColor: "#f59e0b" },
      { label: "Recently Updated", value: sortedByUpdated[0] ? formatDate(sortedByUpdated[0].updatedAt) : "—", valueColor: "#1a73e8" },
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
        const typeColor = TYPE_COLORS[item.territoryType] || "#9aa0a6";
        return (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: typeColor + "18", color: typeColor }}
          >
            {item.territoryType}
          </span>
        );
      },
    },
  ],

  getDefaultFormExtra: () => ({ code: "", territoryType: "City", description: "" }),
  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    territoryType: item.territoryType || "City",
    description: item.description || "",
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Territory code is required.";
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
          <code className="h-3 w-3 inline mr-1 text-[10px]">&lt;/&gt;</code> Territory Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. TER_DXB"
        />
      </div>

      {/* Territory Type */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Map className="h-3 w-3 inline mr-1" /> Territory Type
        </label>
        <Select
          value={formExtra.territoryType || "City"}
          onValueChange={(val) => setFormExtra("territoryType", val)}
        >
          <SelectTrigger className="h-8 text-[12px]">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {TERRITORY_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-[12px]">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <span className="h-3 w-3 inline mr-1 text-[10px]">&#x2709;</span> Description
        </label>
        <textarea
          value={formExtra.description || ""}
          onChange={(e) => setFormExtra("description", e.target.value)}
          placeholder="Describe this territory..."
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

export default function MasterDataSalesTerritories() {
  return <MasterDataTable config={config} />;
}
