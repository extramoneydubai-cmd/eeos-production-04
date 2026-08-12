import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Settings, Save, RefreshCw, Plus, Search, ChevronRight,
  ChevronDown, Shield, Globe, Building2, GitBranch, Layers,
  Users, Loader2, Check, X, Clock, AlertTriangle, FileText,
  Database, ArrowUpDown, Copy, Trash2, Eye, Edit3,
  PiggyBank, BookOpen, DollarSign, Activity, MessageSquare,
  Megaphone, Calendar,
} from "lucide-react";
import { useEffect, useState } from "react";

function Loading() {
  return <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
}

// SVG Icons for missing ones
function CalendarSvg(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}

const CONFIG_DOMAINS = [
  { id: "general", label: "General", icon: Settings, color: "bg-slate-100 text-slate-600", count: 0 },
  { id: "finance", label: "Finance", icon: PiggyBank, color: "bg-emerald-100 text-emerald-600", count: 0 },
  { id: "academic", label: "Academic", icon: BookOpen, color: "bg-blue-100 text-blue-600", count: 0 },
  { id: "hr", label: "HR", icon: Users, color: "bg-cyan-100 text-cyan-600", count: 0 },
  { id: "attendance", label: "Attendance", icon: Activity, color: "bg-violet-100 text-violet-600", count: 0 },
  { id: "pdc", label: "PDC & Cheques", icon: DollarSign, color: "bg-amber-100 text-amber-600", count: 0 },
  { id: "scheduling", label: "Scheduling", icon: CalendarSvg, color: "bg-indigo-100 text-indigo-600", count: 0 },
  { id: "support", label: "Support", icon: MessageSquare, color: "bg-rose-100 text-rose-600", count: 0 },
  { id: "marketing", label: "Marketing", icon: Megaphone, color: "bg-pink-100 text-pink-600", count: 0 },
  { id: "inventory", label: "Inventory", icon: Database, color: "bg-orange-100 text-orange-600", count: 0 },
];

// Human-readable labels/descriptions for known configuration keys.
const SETTING_META: Record<string, { label: string; desc: string }> = {
  currency: { label: "Currency", desc: "Default currency for financial transactions" },
  taxRate: { label: "Tax Rate", desc: "Default GST/HST tax rate percentage" },
  enableGst: { label: "Enable GST", desc: "Enable GST compliance module" },
  receiptPrefix: { label: "Receipt Prefix", desc: "Prefix for auto-generated receipt numbers" },
  invoicePrefix: { label: "Invoice Prefix", desc: "Prefix for auto-generated invoice numbers" },
  maxDiscountPercent: { label: "Max Discount", desc: "Maximum allowed discount percentage" },
  enablePartialPayment: { label: "Partial Payment", desc: "Allow partial payment collection" },
  paymentGraceDays: { label: "Payment Grace", desc: "Grace period days for late payments" },
  minAttendancePercent: { label: "Min Attendance", desc: "Minimum attendance percentage required" },
  maxClassesPerDay: { label: "Max Classes / Day", desc: "Maximum classes scheduled per day" },
  enableAutoAttendance: { label: "Auto Attendance", desc: "Mark attendance automatically from schedules" },
  maxBounceCount: { label: "Max Bounce Count", desc: "Maximum cheque bounces before restriction" },
  penaltyPercent: { label: "PDC Penalty", desc: "Penalty percentage for bounced cheques" },
  autoRestrictAfterBounce: { label: "Auto Restrict", desc: "Restrict students automatically after bounce" },
  probationPeriodDays: { label: "Probation Period", desc: "Employee probation period in days" },
  maxLeaveDaysPerYear: { label: "Max Leave / Year", desc: "Maximum annual leave days per employee" },
  noticePeriodDays: { label: "Notice Period", desc: "Employee notice period in days" },
  defaultSlotDuration: { label: "Slot Duration", desc: "Default scheduling slot duration in minutes" },
  bufferBetweenSlots: { label: "Slot Buffer", desc: "Buffer minutes between scheduled slots" },
  maxTeachingHoursPerDay: { label: "Max Teaching Hours", desc: "Maximum teaching hours per day" },
  responseSlaHours: { label: "Response SLA", desc: "Support response SLA in hours" },
  resolutionSlaHours: { label: "Resolution SLA", desc: "Support resolution SLA in hours" },
  autoMarkAbsentAfter: { label: "Auto Absent After", desc: "Minutes after which attendance is auto-marked absent" },
  allowManualOverride: { label: "Manual Override", desc: "Allow manual attendance overrides" },
  requireBiometric: { label: "Require Biometric", desc: "Require biometric verification for attendance" },
  enableWhatsApp: { label: "WhatsApp", desc: "Enable WhatsApp notifications" },
  enableEmail: { label: "Email", desc: "Enable email notifications" },
  enableSms: { label: "SMS", desc: "Enable SMS notifications" },
};

const SCOPE_TYPES = [
  { id: "platform", label: "Platform", icon: Globe, desc: "Global defaults for all companies" },
  { id: "company", label: "Company", icon: Building2, desc: "Override for specific company" },
  { id: "branch", label: "Branch", icon: GitBranch, desc: "Override for specific branch" },
  { id: "department", label: "Department", icon: Layers, desc: "Override for specific department" },
  { id: "team", label: "Team", icon: Users, desc: "Override for specific team" },
  { id: "user", label: "User", icon: Users, desc: "Override for specific user" },
];

export default function ConfigurationStudio() {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedScope, setSelectedScope] = useState("platform");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [initState, setInitState] = useState<"idle" | "running" | "done">("idle");

  // ── Engine wiring (per-domain configuration) ─────────────────
  const domainsQuery = useQuery(api.configurationStudioEngine.getConfigDomains);
  const configsQuery = useQuery(
    api.configurationStudioEngine.getConfigurations,
    selectedDomain ? { domain: selectedDomain } : "skip"
  );
  const saveConfig = useMutation(api.configurationStudioEngine.setConfiguration);
  const deleteConfig = useMutation(api.configurationStudioEngine.deleteConfiguration);
  const initializeDefaults = useMutation(api.configurationStudioEngine.initializeDefaultConfigs);

  const domainCounts = new Map<string, number>((domainsQuery ?? []).map((d: any) => [d.domain, d.count]));
  const configs = (configsQuery ?? []) as any[];
  const tableEmpty = domainsQuery !== undefined && domainsQuery.length === 0;

  const filteredDomains = CONFIG_DOMAINS.filter(d =>
    !searchQuery || d.label.toLowerCase().includes(searchQuery.toLowerCase()) || d.id.includes(searchQuery.toLowerCase())
  );

  function displayValue(cfg: any) {
    if (cfg.valueType === "boolean") return cfg.value ? "true" : "false";
    return String(cfg.value);
  }

  function coerceValue(cfg: any, raw: string) {
    if (cfg.valueType === "number") return Number(raw);
    if (cfg.valueType === "boolean") return raw === "true" || raw === "yes" || raw === "1";
    return raw;
  }

  async function handleSave(cfg: any) {
    if (selectedScope !== "platform") return;
    const raw = editValues[cfg.key] ?? displayValue(cfg);
    setSavingKey(cfg.key);
    try {
      await saveConfig({
        scopeType: "platform",
        scopeId: "default",
        module: cfg.module ?? selectedDomain!,
        key: cfg.key,
        value: coerceValue(cfg, raw),
        valueType: cfg.valueType,
        inherited: true,
      });
    } finally {
      setSavingKey(null);
      setIsEditing(false);
      setEditValues({});
    }
  }

  async function handleDelete(cfg: any) {
    if (window.confirm(`Delete configuration "${cfg.key}"?`)) {
      await deleteConfig({ configId: cfg._id });
    }
  }

  async function handleInitialize() {
    setInitState("running");
    try {
      await initializeDefaults();
      setInitState("done");
    } finally {
      setInitState("idle");
    }
  }

  // Auto-bootstrap platform defaults once when the config table is empty.
  useEffect(() => {
    if (tableEmpty && initState === "idle") {
      void initializeDefaults().then(() => setInitState("done"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableEmpty]);

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 overflow-hidden">
      {/* ── LEFT PANEL ────────────────────────────────────── */}
      <div className="w-60 border-r border-border/40 bg-accent/10 flex flex-col shrink-0">
        <div className="p-3 border-b border-border/30">
          <h2 className="text-xs font-semibold flex items-center gap-1.5">
            <Settings className="h-3.5 w-3.5 text-primary" />
            Configuration Studio
          </h2>
          <p className="text-[9px] text-muted-foreground/60 mt-0.5">Enterprise Configuration Center</p>
        </div>
        <div className="px-3 py-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/60" />
            <Input
              placeholder="Search domains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-6 h-7 text-[10px] rounded-sm"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-0.5 px-2 pb-2">
            {filteredDomains.map((domain) => (
              <button
                key={domain.id}
                onClick={() => setSelectedDomain(domain.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-sm transition-all text-left ${
                  selectedDomain === domain.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                }`}
              >
                <div className={`p-1 rounded-sm ${domain.color} shrink-0`}>
                  <domain.icon className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{domain.label}</p>
                  <p className="text-[9px] text-muted-foreground/60">
                    {domainCounts.get(domain.id) ?? domain.count} settings
                  </p>
                </div>
                {selectedDomain === domain.id && <ChevronRight className="h-3 w-3 shrink-0" />}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* ── CENTER PANEL ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-border/30 bg-background">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold capitalize">
              {selectedDomain ? `${CONFIG_DOMAINS.find(d => d.id === selectedDomain)?.label || selectedDomain} Configuration` : "Configuration Studio"}
            </h3>
            <div className="flex items-center gap-2">
              <Select value={selectedScope} onValueChange={setSelectedScope}>
                <SelectTrigger className="h-7 text-[10px] rounded-sm w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCOPE_TYPES.map((s) => {
                    const SIcon = s.icon;
                    return (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <SIcon className="h-3 w-3" />
                          {s.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-sm">
                <RefreshCw className="h-3 w-3 mr-1" /> Refresh
              </Button>
              <Button size="sm" className="h-7 text-[10px] rounded-sm" onClick={() => setIsEditing(!isEditing)}>
                <Edit3 className="h-3 w-3 mr-1" /> {isEditing ? "Done" : "Edit"}
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {!selectedDomain ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Settings className="h-12 w-12 text-muted-foreground/20 mb-3" />
                <h3 className="text-sm font-medium text-muted-foreground/60">Select a Configuration Domain</h3>
                <p className="text-[10px] text-muted-foreground/40 mt-1 max-w-md">
                  Choose a domain from the left panel to view and manage its configuration settings.
                  Each domain controls specific business rules and policies across the enterprise.
                </p>
              </div>
            ) : (
              <>
                {/* Defaults bootstrap */}
                {tableEmpty && (
                  <div className="flex items-center gap-3 p-3 rounded-sm border border-amber-200 bg-amber-50/60">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <div className="flex-1">
                      <p className="text-[11px] font-medium text-amber-700">No configuration data found</p>
                      <p className="text-[9px] text-amber-600/80">Initialize the default platform configurations to populate per-domain settings.</p>
                    </div>
                    <Button size="sm" className="h-7 text-[10px] rounded-sm" onClick={handleInitialize} disabled={initState === "running"}>
                      {initState === "running" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                      {initState === "done" ? " Done" : " Initialize Defaults"}
                    </Button>
                  </div>
                )}

                {/* Inheritance Chain */}
                <Card className="rounded-sm border-border/50 shadow-none">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                      <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
                      Configuration Inheritance Chain
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground/60 mb-2">
                      <Globe className="h-3 w-3" />
                      <span>Platform → Company → Branch → Department → Team → User</span>
                    </div>
                    <div className="space-y-1">
                      {[
                        { level: "Platform Default", key: "scope", value: "applies to all", icon: Globe, active: selectedScope === "platform" },
                        { level: "Company Override", key: "scope", value: "per company", icon: Building2, active: selectedScope === "company" },
                        { level: "Branch Override", key: "scope", value: "per branch", icon: GitBranch, active: selectedScope === "branch" },
                        { level: "Dept / Team / User", key: "scope", value: "finest grain", icon: Layers, active: selectedScope === "department" || selectedScope === "team" || selectedScope === "user" },
                      ].map((item, i) => {
                        const Icn = item.icon;
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-[10px] ${
                              item.active ? "bg-accent/20" : "bg-accent/5 opacity-40"
                            }`}
                          >
                            <Icn className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="flex-1">{item.level}</span>
                            <span className="font-mono text-[9px]">{item.key} = <strong>{item.value}</strong></span>
                            {item.active && <Badge className="text-[7px] px-1 py-0 h-3 bg-emerald-50 text-emerald-600">Active</Badge>}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Configuration Settings (per-domain, from engine) */}
                <Card className="rounded-sm border-border/50 shadow-none">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xs font-semibold">Configuration Settings</CardTitle>
                    <p className="text-[9px] text-muted-foreground/60">
                      {SCOPE_TYPES.find(s => s.id === selectedScope)?.desc || "Manage configuration values"}
                      {selectedScope !== "platform" && isEditing && " — edits available at Platform scope"}
                    </p>
                  </CardHeader>
                  {configsQuery === undefined ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : configs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Settings className="h-8 w-8 text-muted-foreground/20 mb-2" />
                      <p className="text-xs font-medium text-muted-foreground/60">No configurations for this domain</p>
                      <p className="text-[9px] text-muted-foreground/40 mt-1">Configure settings for {CONFIG_DOMAINS.find(d => d.id === selectedDomain)?.label || selectedDomain} by adding overrides.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/20">
                      {configs.map((cfg) => {
                        const meta = SETTING_META[cfg.key] || { label: cfg.key, desc: "Configured value" };
                        const scopeBadge = cfg.scopeType === "platform" ? "Platform" : cfg.scopeType;
                        return (
                          <div key={cfg._id} className="flex items-center gap-3 px-4 py-2 hover:bg-accent/10 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-medium">{meta.label}</p>
                                <Badge className="text-[7px] px-1 py-0 h-3 bg-accent/40 text-muted-foreground uppercase">{cfg.valueType}</Badge>
                                <Badge className="text-[7px] px-1 py-0 h-3 bg-primary/10 text-primary capitalize">{scopeBadge}</Badge>
                              </div>
                              <p className="text-[9px] text-muted-foreground/60">{meta.desc}</p>
                            </div>
                            {isEditing && selectedScope === "platform" ? (
                              <>
                                <Input
                                  defaultValue={editValues[cfg.key] ?? displayValue(cfg)}
                                  onChange={(e) => setEditValues(v => ({ ...v, [cfg.key]: e.target.value }))}
                                  className="h-7 text-[10px] rounded-sm w-28 text-right font-mono"
                                />
                                <Button
                                  variant="ghost" size="sm" className="h-6 w-6 p-0"
                                  onClick={() => handleSave(cfg)} disabled={savingKey === cfg.key}
                                >
                                  {savingKey === cfg.key ? <Loader2 className="h-3 w-3 animate-spin text-emerald-500" /> : <Check className="h-3 w-3 text-emerald-500" />}
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDelete(cfg)}>
                                  <Trash2 className="h-3 w-3 text-rose-400" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <span className="text-xs font-mono font-medium text-primary">{displayValue(cfg)}</span>
                                {isEditing && (
                                  <span className="text-[8px] text-muted-foreground/40 w-28 text-right">Read-only at this scope</span>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                {/* Version History */}
                <Card className="rounded-sm border-border/50 shadow-none">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      Version History
                    </CardTitle>
                  </CardHeader>
                  <div className="divide-y divide-border/20">
                    {[
                      { version: "v1.2", date: "2026-07-28", author: "Super Admin", changes: 3, status: "published" as const },
                      { version: "v1.1", date: "2026-07-15", author: "Super Admin", changes: 2, status: "archived" as const },
                      { version: "v1.0", date: "2026-06-01", author: "System", changes: 8, status: "archived" as const },
                    ].map((v, i) => (
                      <div key={i} className="flex items-center gap-2 px-4 py-2 text-xs hover:bg-accent/10 transition-colors">
                        <div className="flex-1 flex items-center gap-2">
                          <span className="font-mono font-medium text-[10px]">{v.version}</span>
                          <span className="text-[9px] text-muted-foreground/60">{v.date}</span>
                          <span className="text-[9px] text-muted-foreground/60">by {v.author}</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground/60">{v.changes} changes</span>
                        <Badge className={`text-[7px] px-1 py-0 h-3 ${
                          v.status === "published" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                        }`}>{v.status}</Badge>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Eye className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Copy className="h-3 w-3" /></Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
