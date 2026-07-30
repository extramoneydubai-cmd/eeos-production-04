import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Settings, Save, RefreshCw, Plus, Search, ChevronRight,
  ChevronDown, Shield, Globe, Building2, GitBranch, Layers,
  Users, Loader2, Check, X, Clock, AlertTriangle, FileText,
  Database, ArrowUpDown, Copy, Trash2, Eye, Edit3,
  PiggyBank, BookOpen, DollarSign, Activity, MessageSquare,
  Megaphone, Calendar,
} from "lucide-react";
import { useState } from "react";

function Loading() {
  return <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
}

// SVG Icons for missing ones
function CalendarSvg(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}

const CONFIG_DOMAINS = [
  { id: "general", label: "General", icon: Settings, color: "bg-slate-100 text-slate-600", count: 12 },
  { id: "finance", label: "Finance", icon: PiggyBank, color: "bg-emerald-100 text-emerald-600", count: 8 },
  { id: "academic", label: "Academic", icon: BookOpen, color: "bg-blue-100 text-blue-600", count: 6 },
  { id: "hr", label: "HR", icon: Users, color: "bg-cyan-100 text-cyan-600", count: 10 },
  { id: "attendance", label: "Attendance", icon: Activity, color: "bg-violet-100 text-violet-600", count: 5 },
  { id: "pdc", label: "PDC & Cheques", icon: DollarSign, color: "bg-amber-100 text-amber-600", count: 7 },
  { id: "scheduling", label: "Scheduling", icon: CalendarSvg, color: "bg-indigo-100 text-indigo-600", count: 6 },
  { id: "support", label: "Support", icon: MessageSquare, color: "bg-rose-100 text-rose-600", count: 4 },
  { id: "marketing", label: "Marketing", icon: Megaphone, color: "bg-pink-100 text-pink-600", count: 9 },
  { id: "inventory", label: "Inventory", icon: Database, color: "bg-orange-100 text-orange-600", count: 6 },
];

const SCOPE_TYPES = [
  { id: "platform", label: "Platform", icon: Globe, desc: "Global defaults for all companies" },
  { id: "company", label: "Company", icon: Building2, desc: "Override for specific company" },
  { id: "branch", label: "Branch", icon: GitBranch, desc: "Override for specific branch" },
  { id: "department", label: "Department", icon: Layers, desc: "Override for specific department" },
  { id: "team", label: "Team", icon: Users, desc: "Override for specific team" },
  { id: "user", label: "User", icon: Users, desc: "Override for specific user" },
];

const INHERITANCE_CHAIN_DEMO = [
  { level: "Platform Default", key: "taxRate", value: "18%", icon: Globe, active: true },
  { level: "Company A", key: "taxRate", value: "18%", icon: Building2, active: true },
  { level: "Dubai Branch", key: "taxRate", value: "5%", icon: GitBranch, active: true },
  { level: "Abu Dhabi Branch", key: "taxRate", value: "5%", icon: GitBranch, active: false },
];

export default function ConfigurationStudio() {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedScope, setSelectedScope] = useState("platform");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const filteredDomains = CONFIG_DOMAINS.filter(d =>
    !searchQuery || d.label.toLowerCase().includes(searchQuery.toLowerCase()) || d.id.includes(searchQuery.toLowerCase())
  );

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
                  <p className="text-[9px] text-muted-foreground/60">{domain.count} settings</p>
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
                      {INHERITANCE_CHAIN_DEMO.map((item, i) => {
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

                {/* Configuration Editor */}
                <Card className="rounded-sm border-border/50 shadow-none">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xs font-semibold">Configuration Settings</CardTitle>
                    <p className="text-[9px] text-muted-foreground/60">
                      {SCOPE_TYPES.find(s => s.id === selectedScope)?.desc || "Manage configuration values"}
                    </p>
                  </CardHeader>
                  <div className="divide-y divide-border/20">
                    {[
                      { key: "currency", value: "INR", type: "string", desc: "Default currency for financial transactions" },
                      { key: "taxRate", value: 18, type: "number", desc: "Default GST/HST tax rate percentage" },
                      { key: "enableGst", value: true, type: "boolean", desc: "Enable GST compliance module" },
                      { key: "receiptPrefix", value: "RCP", type: "string", desc: "Prefix for auto-generated receipt numbers" },
                      { key: "invoicePrefix", value: "INV", type: "string", desc: "Prefix for auto-generated invoice numbers" },
                      { key: "maxDiscountPercent", value: 20, type: "number", desc: "Maximum allowed discount percentage" },
                      { key: "enablePartialPayment", value: true, type: "boolean", desc: "Allow partial payment collection" },
                      { key: "paymentGraceDays", value: 3, type: "number", desc: "Grace period days for late payments" },
                    ].map((setting, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2 hover:bg-accent/10 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-medium">{setting.key}</p>
                            <Badge className="text-[7px] px-1 py-0 h-3 bg-accent/40 text-muted-foreground uppercase">{setting.type}</Badge>
                          </div>
                          <p className="text-[9px] text-muted-foreground/60">{setting.desc}</p>
                        </div>
                        {isEditing ? (
                          <Input
                            defaultValue={String(setting.value)}
                            className="h-7 text-[10px] rounded-sm w-28 text-right font-mono"
                          />
                        ) : (
                          <span className="text-xs font-mono font-medium text-primary">{String(setting.value)}</span>
                        )}
                        {isEditing && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Check className="h-3 w-3 text-emerald-500" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
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
