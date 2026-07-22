import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
  Building2, Landmark, University, MapPin, Mountain,
  Globe, Home, Store, Warehouse, TreePine,
  Castle, Sailboat, TowerControl, Factory, Tent,
  Palette, AlignLeft, Code, MapPinned, Phone,
  Mail, User,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
  { value: "Building2", label: "Building", icon: Building2 },
  { value: "Landmark", label: "Landmark", icon: Landmark },
  { value: "University", label: "University", icon: University },
  { value: "MapPin", label: "Map Pin", icon: MapPin },
  { value: "Mountain", label: "Mountain", icon: Mountain },
  { value: "Globe", label: "Globe", icon: Globe },
  { value: "Home", label: "Home", icon: Home },
  { value: "Store", label: "Store", icon: Store },
  { value: "Warehouse", label: "Warehouse", icon: Warehouse },
  { value: "TreePine", label: "Tree", icon: TreePine },
  { value: "Castle", label: "Castle", icon: Castle },
  { value: "Sailboat", label: "Sailboat", icon: Sailboat },
  { value: "TowerControl", label: "Tower", icon: TowerControl },
  { value: "Factory", label: "Factory", icon: Factory },
  { value: "Tent", label: "Tent", icon: Tent },
];

const COLOR_PRESETS = [
  "#4285f4", "#34a853", "#ea4335", "#fbbc04", "#a855f7",
  "#e8710a", "#1a73e8", "#5f6368", "#0d652d", "#1a1a2e",
  "#06b6d4", "#4f46e5", "#0d9488", "#f43f5e", "#10b981",
  "#f59e0b", "#9aa0a6", "#e8f0fe", "#fce8e6", "#f3e8ff",
];

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || Building2;
}

/* ─── Config ─── */

const EMRATE_CITIES = [
  "Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Al Ain",
  "Ras Al Khaimah", "Fujairah", "Umm Al Quwain",
];

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Branches",
  subtitle: "Manage branch and center locations across the organization.",
  entityName: "Branch",
  entityNamePlural: "Branches",
  backRoute: "/studios/master-data/organization",
  backLabel: "Back to Organization Masters",

  apiModule: {
    list: api.organizationBranches.listBranches,
    get: api.organizationBranches.getBranch,
    create: api.organizationBranches.createBranch,
    update: api.organizationBranches.updateBranch,
    delete: api.organizationBranches.deleteBranch,
    duplicate: api.organizationBranches.duplicateBranch,
    reorder: api.organizationBranches.reorderBranches,
    seedDefault: api.organizationBranches.seedDefaultBranches,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.isActive);
    const inactive = items.filter((s: any) => !s.isActive);
    const countries = new Set(items.map((s: any) => s.country));
    const cities = new Set(items.map((s: any) => s.city));
    const sortedByCreated = [...items].sort((a: any, b: any) => a.createdAt - b.createdAt);
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Inactive", value: inactive.length, valueColor: "#9aa0a6" },
      { label: "Countries", value: countries.size },
      { label: "Cities", value: cities.size },
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

  getDefaultFormExtra: () => ({
    code: "",
    description: "",
    city: "",
    state: "",
    country: "UAE",
    address: "",
    phone: "",
    email: "",
    managerName: "",
  }),

  getFormExtraFromItem: (item: any) => ({
    code: item.code || "",
    description: item.description || "",
    city: item.city || "",
    state: item.state || "",
    country: item.country || "UAE",
    address: item.address || "",
    phone: item.phone || "",
    email: item.email || "",
    managerName: item.managerName || "",
  }),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Branch code is required.";
    if (!extra.city || !extra.city.trim()) return "City is required.";
    if (!extra.country || !extra.country.trim()) return "Country is required.";
    return null;
  },

  renderFormFields: ({
    formExtra, setFormExtra, formColor, setFormColor, formIcon, setFormIcon,
    showColorPicker, setShowColorPicker,
  }) => (
    <>
      {/* Branch Code */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Code className="h-3 w-3 inline mr-1" /> Branch Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. DXB_MAIN"
        />
      </div>

      {/* City */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <MapPinned className="h-3 w-3 inline mr-1" /> City *
        </label>
        <Select
          value={formExtra.city || ""}
          onValueChange={(val) => setFormExtra("city", val)}
        >
          <SelectTrigger className="h-8 text-[12px]">
            <SelectValue placeholder="Select city" />
          </SelectTrigger>
          <SelectContent>
            {EMRATE_CITIES.map((c) => (
              <SelectItem key={c} value={c} className="text-[12px]">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* State */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          State
        </label>
        <Input
          value={formExtra.state || ""}
          onChange={(e) => setFormExtra("state", e.target.value)}
          className="h-8 text-[12px]"
          placeholder="e.g. Dubai"
        />
      </div>

      {/* Country */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Globe className="h-3 w-3 inline mr-1" /> Country *
        </label>
        <Input
          value={formExtra.country || ""}
          onChange={(e) => setFormExtra("country", e.target.value)}
          className="h-8 text-[12px]"
          placeholder="e.g. UAE"
        />
      </div>

      {/* Address */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Home className="h-3 w-3 inline mr-1" /> Address
        </label>
        <textarea
          value={formExtra.address || ""}
          onChange={(e) => setFormExtra("address", e.target.value)}
          placeholder="Full address of the branch..."
          className="w-full min-h-[50px] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]"
          rows={2}
        />
      </div>

      {/* Phone */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Phone className="h-3 w-3 inline mr-1" /> Phone
        </label>
        <Input
          value={formExtra.phone || ""}
          onChange={(e) => setFormExtra("phone", e.target.value)}
          className="h-8 text-[12px]"
          placeholder="e.g. +971 4 123 4567"
        />
      </div>

      {/* Email */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Mail className="h-3 w-3 inline mr-1" /> Email
        </label>
        <Input
          value={formExtra.email || ""}
          onChange={(e) => setFormExtra("email", e.target.value)}
          className="h-8 text-[12px]"
          placeholder="e.g. branch@eeos.edu"
        />
      </div>

      {/* Manager Name */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <User className="h-3 w-3 inline mr-1" /> Branch Manager
        </label>
        <Input
          value={formExtra.managerName || ""}
          onChange={(e) => setFormExtra("managerName", e.target.value)}
          className="h-8 text-[12px]"
          placeholder="e.g. Ahmed Al Maktoum"
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
          placeholder="Brief description of this branch..."
          className="w-full min-h-[50px] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]"
          rows={2}
        />
      </div>

      {/* Color */}
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <Palette className="h-3 w-3 inline mr-1" /> Branch Color
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

export default function MasterDataBranches() {
  return <MasterDataTable config={config} />;
}
