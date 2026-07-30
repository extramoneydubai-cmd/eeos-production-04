import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Shield, ShieldCheck, ShieldOff, Users, Key, FolderTree, UserCog,
  UserCheck, Flag, Monitor, Menu, Earth, Plus, Search, Check, X,
  Loader2, Sliders, Settings2, ChevronRight, Lock, Unlock,
  Eye, EyeOff, ChevronDown, LayoutDashboard, Building2,
  Database, Workflow, ListChecks, LineChart, GraduationCap,
  UserPlus, BookOpen, PiggyBank, UsersRound, Megaphone,
  MessageSquare, BarChart3, Crown, DollarSign, FileText,
  Activity, AlertTriangle, GitBranch, Globe, Layers,
} from "lucide-react";

// ─── Module Definitions ─────────────────────────────────────────

const MODULE_DEFINITIONS = [
  { id: "crm", label: "CRM", icon: Users, color: "text-blue-500" },
  { id: "students", label: "Students", icon: GraduationCap, color: "text-emerald-500" },
  { id: "faculty", label: "Faculty", icon: UsersRound, color: "text-violet-500" },
  { id: "finance", label: "Finance", icon: PiggyBank, color: "text-amber-500" },
  { id: "hr", label: "HR", icon: UserCheck, color: "text-rose-500" },
  { id: "academic", label: "Academic", icon: BookOpen, color: "text-indigo-500" },
  { id: "exams", label: "Examinations", icon: FileText, color: "text-orange-500" },
  { id: "admissions", label: "Admissions", icon: UserPlus, color: "text-cyan-500" },
  { id: "marketing", label: "Marketing", icon: Megaphone, color: "text-pink-500" },
  { id: "support", label: "Support", icon: MessageSquare, color: "text-teal-500" },
  { id: "procurement", label: "Procurement", icon: ShoppingCart, color: "text-sky-500" },
  { id: "inventory", label: "Inventory", icon: Database, color: "text-slate-500" },
  { id: "lms", label: "LMS", icon: BookOpen, color: "text-lime-500" },
  { id: "scheduling", label: "Scheduling", icon: Calendar, color: "text-purple-500" },
  { id: "analytics", label: "Analytics", icon: BarChart3, color: "text-red-500" },
  { id: "reports", label: "Reports", icon: FileText, color: "text-amber-600" },
  { id: "documents", label: "Documents", icon: FileText, color: "text-gray-500" },
  { id: "settings", label: "Settings", icon: Settings2, color: "text-slate-600" },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-emerald-600" },
];

const ACCESS_ACTIONS = [
  { id: "create", label: "Create", icon: Plus },
  { id: "read", label: "Read", icon: Eye },
  { id: "update", label: "Update", icon: Settings2 },
  { id: "delete", label: "Delete", icon: X },
  { id: "approve", label: "Approve", icon: Check },
  { id: "export", label: "Export", icon: FileText },
  { id: "assign", label: "Assign", icon: UserCheck },
  { id: "manage", label: "Manage", icon: Sliders },
];

const SCOPE_LEVELS = [
  { id: "own", label: "Own", icon: UserCog, color: "bg-slate-100 text-slate-600" },
  { id: "team", label: "Team", icon: Users, color: "bg-blue-100 text-blue-600" },
  { id: "department", label: "Department", icon: Building2, color: "bg-indigo-100 text-indigo-600" },
  { id: "branch", label: "Branch", icon: GitBranch, color: "bg-violet-100 text-violet-600" },
  { id: "company", label: "Company", icon: Globe, color: "bg-purple-100 text-purple-600" },
  { id: "organization", label: "Organization", icon: Layers, color: "bg-amber-100 text-amber-600" },
  { id: "global", label: "Global", icon: Crown, color: "bg-emerald-100 text-emerald-600" },
];

// ─── Available modules (simulated available list) ───────────────

const AVAILABLE_MODULES = [
  "CRM", "Students", "Faculty", "Finance", "HR", "Academic",
  "Examinations", "Admissions", "Marketing", "Support",
  "Procurement", "Inventory", "LMS", "Scheduling", "Analytics",
  "Reports", "Documents", "Settings", "Dashboard",
];

// ─── Loading + Empty States ─────────────────────────────────────

function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="h-10 w-10 text-muted-foreground/30 mb-3" />
      <p className="text-sm font-medium text-muted-foreground/60">{title}</p>
      <p className="text-xs text-muted-foreground/40 mt-1">{description}</p>
    </div>
  );
}

// ─── LEFT PANEL NAV ITEM ───────────────────────────────────────

function NavItem({ icon: Icon, label, active, onClick, badge }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-sm transition-all text-left ${
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate flex-1">{label}</span>
      {badge && <Badge className="text-[8px] px-1 py-0 h-3.5 rounded-sm" variant="secondary">{badge}</Badge>}
    </button>
  );
}

// ─── PERMISSION EDITOR (Right Panel) ───────────────────────────

function PermissionEditor({ selectedRoleId, onClose }: { selectedRoleId: string | null; onClose: () => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [scope, setScope] = useState("own");

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredModules = MODULE_DEFINITIONS.filter(
    (m) => !searchTerm || m.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!selectedRoleId) {
    return (
      <div className="p-6">
        <EmptyState icon={Shield} title="No Role Selected" description="Select a role from the center panel to edit its permissions" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border/40">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold">Permission Editor</h3>
          <div className="flex items-center gap-1">
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger className="h-6 text-[10px] rounded-sm px-2 w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCOPE_LEVELS.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/60" />
          <Input
            placeholder="Search modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-7 h-7 text-[10px] rounded-sm"
          />
        </div>
      </div>

      {/* Permission Tree */}
      <ScrollArea className="flex-1">
        <div className="p-1 space-y-0.5">
          {filteredModules.map((mod) => {
            const Icon = mod.icon;
            const isExpanded = expandedModules[mod.id];
            return (
              <div key={mod.id}>
                <button
                  onClick={() => toggleModule(mod.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-sm hover:bg-accent/30 transition-colors ${
                    isExpanded ? "bg-accent/20" : ""
                  }`}
                >
                  <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  <Icon className={`h-3.5 w-3.5 ${mod.color}`} />
                  <span className="flex-1 text-left font-medium">{mod.label}</span>
                  <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-transparent">Inherited</Badge>
                </button>
                {isExpanded && (
                  <div className="ml-6 pl-2 border-l border-border/30 space-y-0.5 py-0.5">
                    {ACCESS_ACTIONS.map((action) => {
                      const ActionIcon = action.icon;
                      return (
                        <label
                          key={action.id}
                          className="flex items-center gap-2 px-2 py-1 rounded-sm hover:bg-accent/20 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            className="h-3 w-3 rounded border-muted-foreground/40 accent-primary"
                            defaultChecked={["read", "create"].includes(action.id)}
                          />
                          <ActionIcon className="h-3 w-3 text-muted-foreground/60" />
                          <span className="text-[10px] text-muted-foreground/80">{action.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border/40">
        <Button size="sm" className="w-full h-7 text-[10px] rounded-sm">
          <Check className="h-3 w-3 mr-1" /> Save Permissions
        </Button>
      </div>
    </div>
  );
}

// ─── SUBSCRIPTION PLANS TAB ────────────────────────────────────

function SubscriptionPlansTab() {
  const PLANS = [
    { name: "Starter", code: "STARTER", price: 0, users: 25, branches: 1, modules: 8, features: ["Core CRM", "Student Management", "Basic Reports"], popular: false },
    { name: "Professional", code: "PRO", price: 299, users: 100, branches: 5, modules: 14, features: ["All Starter Features", "Finance Suite", "HR Module", "Marketing", "Advanced Reports"], popular: true },
    { name: "Enterprise", code: "ENTERPRISE", price: 999, users: 500, branches: 50, modules: 20, features: ["All Pro Features", "Unlimited Branches", "Custom Modules", "API Access", "Dedicated Support"], popular: false },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Subscription Plans</h3>
        <Button size="sm" className="h-8 text-xs rounded-sm">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Plan
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card key={plan.code} className={`rounded-sm border ${plan.popular ? 'border-primary/30 ring-1 ring-primary/20' : 'border-border/50'} shadow-none`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">{plan.name}</h4>
                {plan.popular && <Badge className="text-[8px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20">Popular</Badge>}
              </div>
              <div className="text-2xl font-bold mb-3">${plan.price}<span className="text-xs font-normal text-muted-foreground">/{plan.price === 0 ? 'free' : 'mo'}</span></div>
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Users</span>
                  <span className="font-medium">{plan.users}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Branches</span>
                  <span className="font-medium">{plan.branches}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Modules</span>
                  <span className="font-medium">{plan.modules}</span>
                </div>
              </div>
              <Separator className="my-2" />
              <div className="space-y-1 mb-3">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
              <Button size="sm" variant={plan.popular ? "default" : "outline"} className="w-full h-7 text-[10px] rounded-sm">
                {plan.price === 0 ? "Current Plan" : "Select Plan"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── ANALYTICS TAB ────────────────────────────────────────────

function AccessAnalyticsTab() {
  const stats = [
    { label: "Total Roles", value: "8", icon: Key, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Total Permissions", value: "156", icon: Shield, color: "text-violet-500", bg: "bg-violet-50" },
    { label: "Active Users", value: "1,247", icon: Users, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Feature Flags", value: "23", icon: Flag, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Inactive Users", value: "89", icon: UserX, color: "text-red-500", bg: "bg-red-50" },
    { label: "Permission Conflicts", value: "3", icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Access Analytics</h3>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label} className="rounded-sm border-border/50 shadow-none">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-1.5 rounded-sm ${s.bg}`}>
                  <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                </div>
              </div>
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="rounded-sm border-border/50 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold">Recent Permission Changes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/30">
            <div className="grid grid-cols-4 gap-2 px-4 py-2 text-[10px] uppercase text-muted-foreground/40 font-medium">
              <span>Action</span>
              <span>User</span>
              <span>Module</span>
              <span>Time</span>
            </div>
            {[
              { action: "Granted", user: "Admin", module: "Finance", time: "2m ago" },
              { action: "Revoked", user: "System", module: "CRM", time: "15m ago" },
              { action: "Updated", user: "Super Admin", module: "HR", time: "1h ago" },
              { action: "Created", user: "Admin", module: "Roles", time: "3h ago" },
            ].map((log, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 px-4 py-2 text-xs items-center hover:bg-accent/10 transition-colors">
                <Badge variant="outline" className="w-fit text-[8px] px-1 py-0 h-4">{log.action}</Badge>
                <span className="text-muted-foreground">{log.user}</span>
                <span>{log.module}</span>
                <span className="text-muted-foreground/60">{log.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── MAIN ACCESS CONTROL COMPONENT ─────────────────────────────

export default function AccessControlList() {
  const [selectedNav, setSelectedNav] = useState("roles");
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(true);

  const roles = useQuery(api.engines.accessControlEngine.listRoles, {});
  const perms = useQuery(api.engines.accessControlEngine.listPermissions, {});
  const stats = useQuery(api.engines.accessControlEngine.getStats, {});

  // ─── Nav items ───────────────────────────────────────────────
  const NAV_ITEMS = [
    { id: "organization", label: "Organization", icon: Building2 },
    { id: "companies", label: "Companies", icon: Globe },
    { id: "branches", label: "Branches", icon: GitBranch },
    { id: "departments", label: "Departments", icon: Layers },
    { id: "teams", label: "Teams", icon: Users },
    { id: "designations", label: "Designations", icon: UserCog },
    { id: "users", label: "Users", icon: Users },
    { id: "roles", label: "Roles", icon: Key },
    { id: "permissions", label: "Permissions", icon: Shield },
    { id: "templates", label: "Permission Templates", icon: FileText },
    { id: "subscriptions", label: "Subscription Plans", icon: DollarSign },
    { id: "analytics", label: "Access Analytics", icon: Activity },
    { id: "flags", label: "Feature Flags", icon: Flag },
    { id: "audit", label: "Audit Logs", icon: ShieldCheck },
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 overflow-hidden">
      {/* ── LEFT PANEL ────────────────────────────────────────── */}
      <div className="w-56 border-r border-border/40 bg-accent/10 flex flex-col shrink-0">
        <div className="p-3 border-b border-border/30">
          <h2 className="text-xs font-semibold flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-primary" />
            Access Control
          </h2>
          <p className="text-[9px] text-muted-foreground/60 mt-0.5">Enterprise Permissions Manager</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <NavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={selectedNav === item.id}
                onClick={() => {
                  setSelectedNav(item.id);
                  if (item.id !== "roles") setSelectedRoleId(null);
                }}
                badge={item.id === "roles" ? stats?.totalRoles : item.id === "permissions" ? stats?.totalPermissions : undefined}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* ── CENTER PANEL ─────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col overflow-hidden ${showEditor ? "" : ""}`}>
        <div className="p-3 border-b border-border/30 bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold capitalize">{selectedNav.replace(/_/g, " ")}</h3>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-normal">
                {selectedNav === "roles" ? `${stats?.totalRoles || 0} entries` : ""}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              {(selectedNav === "roles" || selectedNav === "permissions") && (
                <Button size="sm" className="h-7 text-[10px] rounded-sm">
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setShowEditor(!showEditor)}
                title="Toggle permission editor"
              >
                <Shield className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3">
            {/* ── Roles View ──────────────────────────────── */}
            {selectedNav === "roles" && (
              <div className="space-y-2">
                {!roles ? (
                  <Loading />
                ) : roles.length === 0 ? (
                  <EmptyState icon={Key} title="No Roles Created" description="Create your first role to define access levels" />
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {roles.map((role: any) => (
                      <button
                        key={role._id}
                        onClick={() => setSelectedRoleId(role._id)}
                        className={`text-left p-3 rounded-sm border transition-all ${
                          selectedRoleId === role._id
                            ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                            : "border-border/50 hover:border-border hover:bg-accent/10"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`p-1 rounded-sm ${role.isSystem ? "bg-amber-50" : "bg-accent/50"}`}>
                            <Key className={`h-3 w-3 ${role.isSystem ? "text-amber-500" : "text-muted-foreground"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{role.name}</p>
                            <p className="text-[9px] text-muted-foreground/60">{role.code}</p>
                          </div>
                          <Badge variant="outline" className={`text-[8px] px-1 py-0 h-3.5 ${
                            role.isActive ? "border-emerald-300/50 text-emerald-600" : "border-red-300/50 text-red-500"
                          }`}>
                            {role.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {role.description && (
                          <p className="text-[10px] text-muted-foreground/60 truncate mt-1">{role.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 text-[8px] text-muted-foreground/40">
                          <span>Priority: {role.priority ?? 0}</span>
                          {role.isSystem && <Badge className="text-[7px] px-1 py-0 h-3 bg-amber-50 text-amber-600 border-0">System</Badge>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Subscriptions ──────────────────────────── */}
            {selectedNav === "subscriptions" && <SubscriptionPlansTab />}

            {/* ── Analytics ─────────────────────────────────── */}
            {selectedNav === "analytics" && <AccessAnalyticsTab />}

            {/* ── Other panels ─────────────────────────────── */}
            {!["roles", "subscriptions", "analytics"].includes(selectedNav) && (
              <EmptyState
                icon={selectedNav === "flags" ? Flag : selectedNav === "audit" ? ShieldCheck : Building2}
                title={`${selectedNav.charAt(0).toUpperCase() + selectedNav.slice(1)} Management`}
                description="Select an item from the left panel to manage its settings"
              />
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ── RIGHT PANEL (Permission Editor) ──────────────────── */}
      {showEditor && (
        <div className="w-80 border-l border-border/40 bg-background flex flex-col shrink-0">
          <PermissionEditor selectedRoleId={selectedRoleId} onClose={() => setShowEditor(false)} />
        </div>
      )}
    </div>
  );
}

// ─── Missing icon imports ──────────────────────────────────────
function ShoppingCart(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg> }
function Calendar(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> }
function UserX(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="8" x2="22" y2="13"/><line x1="22" y1="8" x2="17" y2="13"/></svg> }
function PersonStanding(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><path d="m9 20 3-6 3 6"/><path d="m6 8 6 2 6-2"/><path d="M12 10v4"/></svg> }
