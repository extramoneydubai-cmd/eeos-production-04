import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
  BadgeCheck,
  Briefcase,
  Building,
  Building2,
  CalendarCheck,
  Clock,
  Code,
  Coins,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Flag,
  Globe,
  GraduationCap,
  Handshake,
  Heart,
  Home,
  Landmark,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Monitor,
  Palette,
  Percent,
  Phone,
  RefreshCw,
  School,
} from "lucide-react";

const EXPENSE_TYPES = ["Operational","Capital","Administrative","Marketing","Travel","Utilities","Maintenance","Other"];

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = [
    {
      value: 'BadgeCheck',
      label: 'BadgeCheck',
      icon: BadgeCheck
    },
    {
      value: 'Briefcase',
      label: 'Briefcase',
      icon: Briefcase
    },
    {
      value: 'Building',
      label: 'Building',
      icon: Building
    },
    {
      value: 'Building2',
      label: 'Building2',
      icon: Building2
    },
    {
      value: 'CalendarCheck',
      label: 'CalendarCheck',
      icon: CalendarCheck
    },
    {
      value: 'Clock',
      label: 'Clock',
      icon: Clock
    },
    {
      value: 'Code',
      label: 'Code',
      icon: Code
    },
    {
      value: 'Coins',
      label: 'Coins',
      icon: Coins
    },
    {
      value: 'CreditCard',
      label: 'CreditCard',
      icon: CreditCard
    },
    {
      value: 'DollarSign',
      label: 'DollarSign',
      icon: DollarSign
    },
    {
      value: 'Download',
      label: 'Download',
      icon: Download
    },
    {
      value: 'FileText',
      label: 'FileText',
      icon: FileText
    },
    {
      value: 'Flag',
      label: 'Flag',
      icon: Flag
    },
    {
      value: 'Globe',
      label: 'Globe',
      icon: Globe
    },
    {
      value: 'GraduationCap',
      label: 'GraduationCap',
      icon: GraduationCap
    },
    {
      value: 'Handshake',
      label: 'Handshake',
      icon: Handshake
    },
    {
      value: 'Heart',
      label: 'Heart',
      icon: Heart
    },
    {
      value: 'Home',
      label: 'Home',
      icon: Home
    },
    {
      value: 'Landmark',
      label: 'Landmark',
      icon: Landmark
    },
    {
      value: 'Mail',
      label: 'Mail',
      icon: Mail
    },
    {
      value: 'MapPin',
      label: 'MapPin',
      icon: MapPin
    },
    {
      value: 'Megaphone',
      label: 'Megaphone',
      icon: Megaphone
    },
    {
      value: 'MessageCircle',
      label: 'MessageCircle',
      icon: MessageCircle
    },
    {
      value: 'MessageSquare',
      label: 'MessageSquare',
      icon: MessageSquare
    },
    {
      value: 'Monitor',
      label: 'Monitor',
      icon: Monitor
    },
    {
      value: 'Palette',
      label: 'Palette',
      icon: Palette
    },
    {
      value: 'Percent',
      label: 'Percent',
      icon: Percent
    },
    {
      value: 'Phone',
      label: 'Phone',
      icon: Phone
    },
    {
      value: 'RefreshCw',
      label: 'RefreshCw',
      icon: RefreshCw
    },
    {
      value: 'School',
      label: 'School',
      icon: School
    }
  ];

const COLOR_PRESETS = ["#1a73e8","#34a853","#0d9488","#e8710a","#4285f4","#4f46e5","#a855f7","#06b6d4","#5f6368","#22c55e","#f59e0b","#d4a017","#ea4335","#e91e63","#f97316","#f43f5e","#14b8a6","#8b5cf6","#9aa0a6","#1877F2"];

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o: any) => o.value === iconName);
  return found?.icon || DollarSign;
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "Expense Categories",
  subtitle: "Define expense categories — classify organizational expenditures for tracking and budgeting.",
  entityName: "ExpenseCategory",
  entityNamePlural: "Expense Categories",
  backRoute: "/studios/master-data/finance",
  backLabel: "Back to Finance Masters",

  apiModule: {
    list: api.financeExpenseCategories.list,
    get: api.financeExpenseCategories.get,
    create: api.financeExpenseCategories.create,
    update: api.financeExpenseCategories.update,
    delete: api.financeExpenseCategories.remove,
    duplicate: api.financeExpenseCategories.duplicate,
    reorder: api.financeExpenseCategories.reorder,
    seedDefault: api.financeExpenseCategories.seedDefault,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.active);
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
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
        <span className="text-[11px] font-mono font-medium text-[#5f6368] bg-[#f1f3f4] px-1.5 py-0.5 rounded">{item.code}</span>
      ),
    },
  ],

  getDefaultFormExtra: () => ({"code":"","expenseType":"Operational","budgetable":true,"description":""}),
  getFormExtraFromItem: (item: any) => ({"code":"item.code||\"\"","expenseType":"item.expenseType||\"\"","budgetable":"item.budgetable||\"\"","description":"item.description||\"\""}),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "Expense category code is required.";
    return null;
  },

  renderFormFields: ({
    formExtra, setFormExtra, formColor, setFormColor, formIcon, setFormIcon,
    showColorPicker, setShowColorPicker,
  }) => (
    <>
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <code className="h-3 w-3 inline mr-1 text-[10px]">&lt;/&gt;</code> Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. CODE"
        />
      </div>

      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <span className="h-3 w-3 inline mr-1 text-[10px]">&#x2709;</span> Description
        </label>
        <textarea
          value={formExtra.description || ""}
          onChange={(e) => setFormExtra("description", e.target.value)}
          placeholder="Brief description..."
          className="w-full min-h-[50px] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]"
          rows={2}
        />
      </div>

      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <span className="h-3 w-3 inline mr-1 rounded-full border border-[#e8eaed]" style={{ backgroundColor: formColor }} /> Color
        </label>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-8 h-8 rounded-md border border-[#e8eaed] flex items-center justify-center hover:border-[#1a1a2e] transition-colors"
            style={{ backgroundColor: formColor }}>
            <span className="text-[8px] text-white font-bold" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>{formColor.replace("#", "")}</span>
          </button>
          <Input value={formColor} onChange={(e) => setFormColor(e.target.value)}
            className="h-8 text-[11px] font-mono w-28" placeholder="#000000" />
        </div>
        {showColorPicker && (
          <div className="flex flex-wrap gap-1.5 mt-2 p-2 rounded-lg bg-[#f8f9fa] border border-[#e8eaed]">
            {COLOR_PRESETS.map((c) => (
              <button key={c} onClick={() => { setFormColor(c); setShowColorPicker(false); }}
                className={`w-7 h-7 rounded-md border-2 transition-all ${formColor === c ? "border-[#1a1a2e] scale-110" : "border-transparent hover:border-[#9aa0a6]"}`}
                style={{ backgroundColor: c }} title={c} />
            ))}
            <input type="color" value={formColor} onChange={(e) => setFormColor(e.target.value)}
              className="w-7 h-7 rounded-md border-2 border-dashed border-[#e8eaed] cursor-pointer" title="Custom color" />
          </div>
        )}
      </div>

      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">Icon</label>
        <div className="grid grid-cols-5 gap-1.5">
          {ICON_OPTIONS.map((opt: any) => {
            const IconComp = opt.icon;
            const isSelected = formIcon === opt.value;
            return (
              <button key={opt.value} onClick={() => setFormIcon(opt.value)}
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded-md border transition-all ${isSelected ? "border-[#1a1a2e] bg-[#f1f3f4]" : "border-[#e8eaed] hover:bg-[#f8f9fa] hover:border-[#9aa0a6]"}`}>
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

export default function MasterDataExpenseCategories() {
  return <MasterDataTable config={config} />;
}
