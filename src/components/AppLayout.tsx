import { cn } from "@/lib/utils";
import {
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  Search,
  Loader2,
  Sparkles,
  Star,
  Bell,
  ClipboardCheck,
  Plus,
} from "lucide-react";
import { useState, useCallback } from "react";
import { Link, useLocation } from "react-router";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { ScrollArea } from "./ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Separator } from "./ui/separator";
import { ENABLE_COLLECTIONS_PAGE } from "@/featureFlags";
import { GlobalSearchButton } from "@/components/search/GlobalSearchDialog";
import {
  getSidebarSections,
  getBreadcrumbTrail,
  getFavorites,
  toggleFavorite,
  getFavoriteModules,
  getQuickActionsForRole,
  type ModuleDefinition,
} from "@/lib/module-registry";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [crmSettingsOpen, setCrmSettingsOpen] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => getFavorites());
  const location = useLocation();
  const { navigate } = useAppNavigate();
  const { user, logout, isDemoMode } = useAuth();

  const skipDb = !user || isDemoMode;

  const unreadNotifCount = useQuery(
    api.notifications.getUnreadCount,
    skipDb ? "skip" : { userId: user._id }
  );

  const unreadDmCount = useQuery(
    api.messenger.getUnreadDirectMessageCount,
    skipDb ? "skip" : { userId: user._id }
  );

  const approvalCounts = useQuery(
    api.approvals.getGlobalApprovalCounts,
    skipDb ? "skip" : { userId: user._id }
  );

  const pendingApprovalCount = approvalCounts?.total ?? 0;

  // Badge color: 0=no badge, 1-9=yellow, 10-49=orange, 50+=red
  const badgeColor =
    pendingApprovalCount === 0 ? ""
    : pendingApprovalCount <= 9 ? "bg-[#fbbc04]"
    : pendingApprovalCount <= 49 ? "bg-[#e8710a]"
    : "bg-[#ea4335]";
  const badgeDotColor = badgeColor;
  const badgeTextColor =
    pendingApprovalCount <= 9 ? "text-[#1a1a2e]" : "text-white";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + "/");

  const handleToggleFavorite = useCallback((id: string) => {
    const next = toggleFavorite(id);
    setFavoriteIds(next);
  }, []);

  // ── Registry-driven sections (single source of truth) ──────────
  const sections = getSidebarSections(user?.role)
    .map((s) => ({
      ...s,
      items: s.items.filter((i) => i.id !== "collections" || ENABLE_COLLECTIONS_PAGE),
    }))
    .filter((s) => s.items.length > 0);

  // Bottom anchors (Control Center for CEO + Profile) come from the registry
  const controlItem = user?.role === "super_admin"
    ? sections.flatMap((s) => s.items).find((i) => i.id === "control")
    : undefined;
  const profileItem = sections.flatMap((s) => s.items).find((i) => i.id === "profile");

  // Remove bottom anchors from grouped sections to avoid duplication
  const groupedSections = sections
    .map((s) => ({ ...s, items: s.items.filter((i) => i.id !== "control" && i.id !== "profile") }))
    .filter((s) => s.items.length > 0);

  const favoriteModules = getFavoriteModules().filter((m) => favoriteIds.includes(m.id));
  const breadcrumbs = getBreadcrumbTrail(location.pathname);
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-[#e8eaed] transition-all duration-200",
          sidebarCollapsed ? "w-[60px]" : "w-[240px]",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center border-b border-[#e8eaed] h-14 px-4",
          sidebarCollapsed ? "justify-center" : "justify-between"
        )}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#1a1a2e] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[13px] font-semibold text-[#1a1a2e] tracking-tight">EEOS Lite</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7 text-[#5f6368] hover:text-[#1a1a2e] hover:bg-[#f1f3f4]",
              sidebarCollapsed && "hidden"
            )}
            onClick={() => setSidebarCollapsed(true)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          {sidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-[#5f6368] hover:text-[#1a1a2e] hover:bg-[#f1f3f4]"
              onClick={() => setSidebarCollapsed(false)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Mobile close */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-7 w-7 text-[#5f6368] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        {/* Navigation — generated from MODULE_REGISTRY */}
        <ScrollArea className="flex-1 px-2 py-3">
          {/* Favorites (Phase 6) */}
          {favoriteModules.length > 0 && (
            <>
              {!sidebarCollapsed && (
                <div className="text-[11px] font-medium text-[#9aa0a6] uppercase tracking-wider px-3 pt-1 pb-2 flex items-center gap-1.5">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Favorites
                </div>
              )}
              <nav className="space-y-0.5 mb-1">
                {favoriteModules.map((item) => (
                  <SidebarLink
                    key={item.id}
                    item={item}
                    collapsed={sidebarCollapsed}
                    active={isActive(item.href)}
                    isFavorite
                    onToggleFavorite={handleToggleFavorite}
                    onNavigate={() => setMobileMenuOpen(false)}
                  />
                ))}
              </nav>
            </>
          )}

          {/* Registry groups */}
          {groupedSections.map((section) => (
            <div key={section.group}>
              {!sidebarCollapsed && (
                <div className="text-[11px] font-medium text-[#9aa0a6] uppercase tracking-wider px-3 pt-5 pb-2">
                  {section.group}
                </div>
              )}
              <nav className="space-y-0.5">
                {section.items.map((item) => (
                  <SidebarLink
                    key={item.id}
                    item={item}
                    collapsed={sidebarCollapsed}
                    active={isActive(item.href)}
                    isFavorite={favoriteIds.includes(item.id)}
                    badge={getBadgeFor(item.id, pendingApprovalCount, badgeColor, badgeTextColor, unreadNotifCount, unreadDmCount)}
                    onToggleFavorite={handleToggleFavorite}
                    onNavigate={() => setMobileMenuOpen(false)}
                    approvalCounts={item.id === "approvals" ? approvalCounts : undefined}
                  />
                ))}
              </nav>
            </div>
          ))}

          {/* CRM Settings (Super Admin only) */}
          {user?.role === "super_admin" && !sidebarCollapsed && (
            <>
              <div className="border-t border-[#e8eaed] my-3" />
              <div>
                <button
                  onClick={() => setCrmSettingsOpen(!crmSettingsOpen)}
                  className="flex items-center justify-between w-full px-3 py-2 text-[11px] font-medium text-[#9aa0a6] uppercase tracking-wider"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="h-3.5 w-3.5" />
                    <span>CRM Settings</span>
                  </div>
                  {crmSettingsOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
                {crmSettingsOpen && (
                  <nav className="space-y-0.5 mt-0.5">
                    <SidebarLink
                      item={{ id: "lead-stages", label: "Lead Stages", href: "/crm/settings/stages", icon: Settings as any, group: "System" as any, keywords: [], description: "" }}
                      collapsed={false}
                      active={isActive("/crm/settings/stages")}
                      onToggleFavorite={handleToggleFavorite}
                      onNavigate={() => setMobileMenuOpen(false)}
                    />
                  </nav>
                )}
              </div>
            </>
          )}

          {/* CRM Settings icon-only in collapsed mode */}
          {user?.role === "super_admin" && sidebarCollapsed && (
            <div className="border-t border-[#e8eaed] my-2" />
          )}
        </ScrollArea>

        {/* Bottom section */}
        <div className="border-t border-[#e8eaed] p-2">
          {controlItem && (
            <SidebarLink
              item={controlItem}
              collapsed={sidebarCollapsed}
              active={isActive(controlItem.href)}
              isFavorite={favoriteIds.includes(controlItem.id)}
              onToggleFavorite={handleToggleFavorite}
              onNavigate={() => setMobileMenuOpen(false)}
              className="mb-0.5"
            />
          )}
          {profileItem && (
            <SidebarLink
              item={profileItem}
              collapsed={sidebarCollapsed}
              active={isActive(profileItem.href)}
              isFavorite={favoriteIds.includes(profileItem.id)}
              onToggleFavorite={handleToggleFavorite}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          )}

          <Separator className="my-1.5" />

          {/* User info */}
          {!sidebarCollapsed && user ? (
            <div className="flex items-center gap-2 px-3 py-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] bg-[#f1f3f4] text-[#5f6368]">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-[#1a1a2e] truncate">{user.name}</p>
                <p className="text-[10px] text-[#9aa0a6] truncate capitalize">{user.role?.replace("_", " ")}</p>
              </div>
            </div>
          ) : (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn("flex justify-center", sidebarCollapsed && "py-2")}>
                    <Avatar className="h-7 w-7 cursor-pointer">
                      <AvatarFallback className="text-[10px] bg-[#f1f3f4] text-[#5f6368]">{initials}</AvatarFallback>
                    </Avatar>
                  </div>
                </TooltipTrigger>
                {sidebarCollapsed && (
                  <TooltipContent side="right" className="text-xs">
                    {user?.name}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={cn(
              "w-full text-[#5f6368] hover:text-[#ea4335] hover:bg-[#fce8e6] text-[13px] font-medium",
              sidebarCollapsed && "px-2"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-200",
        sidebarCollapsed ? "md:ml-[60px]" : "md:ml-[240px]"
      )}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-[#e8eaed] h-14 px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#5f6368] md:hidden shrink-0"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            {/* Breadcrumb runtime (Phase 7) — generated, no manual breadcrumbs */}
            <div className="hidden md:flex items-center gap-1.5 text-[12px] text-[#5f6368] min-w-0">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5 min-w-0">
                  {i > 0 && <ChevronRight className="h-3 w-3 text-[#9aa0a6] shrink-0" />}
                  {crumb.href && i < breadcrumbs.length - 1 ? (
                    <Link to={crumb.href} className="hover:text-[#1a73e8] transition-colors whitespace-nowrap">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={cn(
                      "whitespace-nowrap truncate",
                      i === breadcrumbs.length - 1 ? "text-[#1a1a2e] font-medium" : ""
                    )}>
                      {crumb.label}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <GlobalSearchButton />
            {user?.role === "super_admin" && (
              <Badge variant="outline" className="text-[10px] font-medium text-[#5f6368] border-[#e8eaed]">
                CEO
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#5f6368] hover:text-[#1a1a2e] hover:bg-[#f1f3f4]"
              onClick={() => navigate("/approvals")}
            >
              <div className="relative">
                <ClipboardCheck className="h-4 w-4" />
                {pendingApprovalCount > 0 && (
                  <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 ${badgeColor} ${badgeTextColor} text-[9px] font-bold rounded-full flex items-center justify-center`}>
                    {Math.min(pendingApprovalCount, 99)}
                  </span>
                )}
              </div>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#5f6368] hover:text-[#1a1a2e] hover:bg-[#f1f3f4]"
              onClick={() => navigate("/notifications")}
            >
              <div className="relative">
                <Bell className="h-4 w-4" />
                {(unreadNotifCount ?? 0) > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#ea4335] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {Math.min(unreadNotifCount ?? 0, 99)}
                  </span>
                )}
              </div>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 max-w-[1400px] mx-auto">
          {children}
        </main>
      </div>

      {/* Quick Actions FAB (Phase 4) */}
      <QuickActionsFab role={user?.role} />
    </div>
  );
}

// ─── Sidebar link (registry-driven) ────────────────────────────────────

interface SidebarLinkProps {
  item: ModuleDefinition;
  collapsed: boolean;
  active: boolean;
  isFavorite?: boolean;
  badge?: { count: number; color: string; text: string } | null;
  approvalCounts?: any;
  onToggleFavorite: (id: string) => void;
  onNavigate: () => void;
  className?: string;
}

function SidebarLink({ item, collapsed, active, isFavorite, badge, approvalCounts, onToggleFavorite, onNavigate, className }: SidebarLinkProps) {
  const Icon = item.icon;
  return (
    <TooltipProvider key={item.id} delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "group flex items-center gap-1 rounded-md transition-all duration-150",
              active ? "bg-[#f1f3f4]" : "hover:bg-[#f1f3f4]",
              collapsed ? "justify-center px-2" : "px-0",
              className
            )}
          >
            <Link
              to={item.href}
              className={cn(
                "flex items-center gap-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 flex-1 min-w-0",
                active ? "text-[#1a1a2e]" : "text-[#5f6368] hover:text-[#1a1a2e]",
                collapsed ? "justify-center px-2" : "px-3"
              )}
              onClick={onNavigate}
            >
              <div className="relative shrink-0">
                <Icon className={cn("h-4 w-4", active && "text-[#1a1a2e]")} />
                {badge && badge.count > 0 && (
                  <span className={`absolute -top-1 -right-1 w-2 h-2 ${badge.color} rounded-full`} />
                )}
              </div>
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">{item.label}</span>
                  {badge && badge.count > 0 && (
                    <Badge className={`h-4 min-w-[18px] px-1 text-[10px] ${badge.color} ${badge.text} rounded-full flex items-center justify-center`}>
                      {badge.count}
                    </Badge>
                  )}
                </div>
              )}
            </Link>
            {!collapsed && (
              <button
                onClick={() => onToggleFavorite(item.id)}
                className={cn(
                  "p-1.5 rounded-md transition-all duration-150",
                  isFavorite ? "text-amber-400" : "text-[#d0d3d6] opacity-0 group-hover:opacity-100 hover:text-amber-400"
                )}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Star className={cn("h-3 w-3", isFavorite && "fill-amber-400")} />
              </button>
            )}
          </div>
        </TooltipTrigger>
        {collapsed ? (
          item.id === "approvals" && approvalCounts ? (
            <TooltipContent side="right" className="text-xs">
              <div className="font-medium text-[12px]">Approval Center</div>
              <div className="text-[10px] text-[#9aa0a6] mt-0.5 space-y-0.5">
                <div>Requests: {approvalCounts?.requests ?? 0}</div>
                <div>CRM: {approvalCounts?.crm ?? 0}</div>
                <div>Verification: {approvalCounts?.verification ?? 0}</div>
                <div className="font-medium text-[#1a1a2e]">Total: {approvalCounts?.total ?? 0}</div>
              </div>
            </TooltipContent>
          ) : (
            <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
          )
        ) : null}
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Badge lookup (approvals / notifications / messenger) ──────────────

function getBadgeFor(
  id: string,
  pendingApprovalCount: number,
  badgeColor: string,
  badgeTextColor: string,
  unreadNotifCount?: number,
  unreadDmCount?: number,
): { count: number; color: string; text: string } | null {
  if (id === "approvals" && pendingApprovalCount > 0) {
    return { count: pendingApprovalCount, color: badgeColor, text: badgeTextColor };
  }
  if (id === "notifications" && (unreadNotifCount ?? 0) > 0) {
    return { count: unreadNotifCount ?? 0, color: "bg-[#ea4335]", text: "text-white" };
  }
  if (id === "messenger" && (unreadDmCount ?? 0) > 0) {
    return { count: unreadDmCount ?? 0, color: "bg-[#1a73e8]", text: "text-white" };
  }
  return null;
}

// ─── Quick Actions FAB (Phase 4) ───────────────────────────────────────

function QuickActionsFab({ role }: { role?: string }) {
  const [open, setOpen] = useState(false);
  const { navigate } = useAppNavigate();
  const actions = getQuickActionsForRole(role);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
      )}
      <div className="fixed bottom-5 right-5 z-[95]">
        {open && (
          <div className="absolute bottom-14 right-0 w-64 bg-white rounded-xl border border-[#e8eaed] shadow-2xl overflow-hidden">
            <div className="px-3 py-2.5 bg-[#fafafa] border-b border-[#e8eaed] flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#1a1a2e]">Quick Actions</span>
              <button onClick={() => setOpen(false)} className="text-[#9aa0a6] hover:text-[#1a1a2e] text-[14px] leading-none">×</button>
            </div>
            <div className="max-h-80 overflow-y-auto p-1.5">
              {actions.map((a) => (
                <button
                  key={a.id}
                  onClick={() => { setOpen(false); navigate(a.href); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium text-[#1a1a2e] hover:bg-[#f1f3f4] transition-colors text-left"
                >
                  <span className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", a.accent)}>
                    <a.icon className="h-3.5 w-3.5" />
                  </span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <Button
          onClick={() => setOpen(!open)}
          className="h-12 w-12 rounded-full shadow-lg bg-[#1a1a2e] hover:bg-[#1a73e8] text-white transition-all duration-200 hover:scale-105"
          size="icon"
        >
          <Plus className={cn("h-5 w-5 transition-transform duration-200", open && "rotate-45")} />
        </Button>
      </div>
    </>
  );
}
