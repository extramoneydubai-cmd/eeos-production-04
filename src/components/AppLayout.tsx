import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,  ClipboardList, CheckSquare, Bell, MessageSquare, BarChart3,
  Settings,
  UserCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  Search,
  Loader2,
  Sparkles,
  Target,
  Layers,
  BookOpenText,
  ClipboardCheck,
  Banknote,
  Database,
  FileText,
  Inbox,
  Workflow,
} from "lucide-react";
import { useState } from "react";
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

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "CRM Lite", href: "/crm", icon: Target },
  { name: "Sales Center", href: "/crm/sales", icon: BarChart3 },
  { name: "Course Studio", href: "/courses", icon: BookOpenText },
  ...(ENABLE_COLLECTIONS_PAGE ? [{ name: "Collections", href: "/collections", icon: Banknote as React.ElementType }] : []),
  { name: "Organization Studio", href: "/org", icon: Building2 },
  { name: "User Management", href: "/users", icon: Users },
  { name: "Access Control", href: "/access", icon: ShieldCheck },
  { name: "Task Management", href: "/tasks", icon: ClipboardList },
  { name: "Approval Center", href: "/approvals", icon: CheckSquare, badgeQuery: "pendingApprovalCount" },
];

const studiosNav = [
  { name: "Master Data Studio", href: "/studios/master-data", icon: Database },
  { name: "Form Studio", href: "/studios/forms", icon: FileText },
  { name: "Intake Dashboard", href: "/studios/intake", icon: Inbox },
  { name: "Workflow Studio", href: "/studios/workflows", icon: Workflow },
  { name: "Platform Studio", href: "/platform-studio", icon: BookOpenText },
];

const crmSettingsItems = [
  { name: "Lead Stages", href: "/crm/settings/stages", icon: Layers },
];

const secondaryNav = [
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Messenger", href: "/messenger", icon: MessageSquare },
];

const bottomNav = [
  { name: "Control Center", href: "/control", icon: Settings },
  { name: "Profile", href: "/profile", icon: UserCircle },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [crmSettingsOpen, setCrmSettingsOpen] = useState(true);
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

  const approvalTooltipContent = approvalCounts
    ? `Requests: ${approvalCounts.requests}\nCRM: ${approvalCounts.crm}\nVerification: ${approvalCounts.verification}\nTotal: ${approvalCounts.total}`
    : "Loading...";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + "/");

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

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-3">
          <nav className="space-y-0.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const showApprovalBadge = item.name === "Approval Center" && (pendingApprovalCount ?? 0) > 0;
              return (
                <TooltipProvider key={item.name} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150",
                          active
                            ? "bg-[#f1f3f4] text-[#1a1a2e]"
                            : "text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#1a1a2e]",
                          sidebarCollapsed && "justify-center px-2"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="relative">
                          <Icon className={cn("h-4 w-4 shrink-0", active && "text-[#1a1a2e]")} />
                          {showApprovalBadge && (
                            <span className={`absolute -top-1 -right-1 w-2 h-2 ${badgeDotColor} rounded-full`} />
                          )}
                        </div>
                        {!sidebarCollapsed && (
                          <div className="flex items-center justify-between flex-1">
                            <span>{item.name}</span>
                            {showApprovalBadge && (
                              <Badge className={`h-4 min-w-[18px] px-1 text-[10px] ${badgeColor} ${badgeTextColor} rounded-full flex items-center justify-center`}>
                                {pendingApprovalCount}
                              </Badge>
                            )}
                          </div>
                        )}
                      </Link>
                    </TooltipTrigger>
                    {sidebarCollapsed && item.name === "Approval Center" ? (
                      <TooltipContent side="right" className="text-xs">
                        <div className="font-medium text-[12px]">Approval Center</div>
                        <div className="text-[10px] text-[#9aa0a6] mt-0.5 space-y-0.5">
                          <div>Requests: {approvalCounts?.requests ?? 0}</div>
                          <div>CRM: {approvalCounts?.crm ?? 0}</div>
                          <div>Verification: {approvalCounts?.verification ?? 0}</div>
                          <div className="font-medium text-[#1a1a2e]">Total: {approvalCounts?.total ?? 0}</div>
                        </div>
                      </TooltipContent>
                    ) : sidebarCollapsed ? (
                      <TooltipContent side="right" className="text-xs">{item.name}</TooltipContent>
                    ) : null}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </nav>

          {/* CRM Settings (Super Admin only) */}
          {user?.role === "super_admin" && !sidebarCollapsed && (
            <>
              <div className="border-t border-[#e8eaed] my-2" />
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
                    {crmSettingsItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <TooltipProvider key={item.name} delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                to={item.href}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150",
                                  active
                                    ? "bg-[#f1f3f4] text-[#1a1a2e]"
                                    : "text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#1a1a2e]",
                                  sidebarCollapsed && "justify-center px-2"
                                )}
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                <Icon className={cn("h-4 w-4 shrink-0", active && "text-[#1a1a2e]")} />
                                {!sidebarCollapsed && <span>{item.name}</span>}
                              </Link>
                            </TooltipTrigger>
                            {sidebarCollapsed && (
                              <TooltipContent side="right" className="text-xs">{item.name}</TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </nav>
                )}
              </div>
            </>
          )}

          {/* CRM Settings icon-only in collapsed mode */}
          {user?.role === "super_admin" && sidebarCollapsed && (
            <div className="border-t border-[#e8eaed] my-2" />
          )}

          {!sidebarCollapsed && (
            <div className="text-[11px] font-medium text-[#9aa0a6] uppercase tracking-wider px-3 pt-6 pb-2">
              Tools
            </div>
          )}

          {/* Studios section */}
          {!sidebarCollapsed && (
            <div className="text-[11px] font-medium text-[#9aa0a6] uppercase tracking-wider px-3 pt-6 pb-2">
              Studios
            </div>
          )}

          <nav className="space-y-0.5">
            {studiosNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <TooltipProvider key={item.name} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150",
                          active
                            ? "bg-[#f1f3f4] text-[#1a1a2e]"
                            : "text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#1a1a2e]",
                          sidebarCollapsed && "justify-center px-2"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", active && "text-[#1a1a2e]")} />
                        {!sidebarCollapsed && <span>{item.name}</span>}
                      </Link>
                    </TooltipTrigger>
                    {sidebarCollapsed && (
                      <TooltipContent side="right" className="text-xs">{item.name}</TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </nav>

          {!sidebarCollapsed && (
            <div className="text-[11px] font-medium text-[#9aa0a6] uppercase tracking-wider px-3 pt-6 pb-2">
              Tools
            </div>
          )}

          <nav className="space-y-0.5">
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const showBadge = item.name === "Notifications" && (unreadNotifCount ?? 0) > 0;
              const showDmBadge = item.name === "Messenger" && (unreadDmCount ?? 0) > 0;
              return (
                <TooltipProvider key={item.name} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150",
                          active
                            ? "bg-[#f1f3f4] text-[#1a1a2e]"
                            : "text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#1a1a2e]",
                          sidebarCollapsed && "justify-center px-2"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="relative">
                          <Icon className={cn("h-4 w-4 shrink-0", active && "text-[#1a1a2e]")} />
                          {showBadge && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#ea4335] rounded-full" />
                          )}
                          {showDmBadge && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#1a73e8] rounded-full" />
                          )}
                        </div>
                        {!sidebarCollapsed && (
                          <div className="flex items-center justify-between flex-1">
                            <span>{item.name}</span>
                            {showBadge && (
                              <Badge className="h-4 min-w-[18px] px-1 text-[10px] bg-[#ea4335] rounded-full flex items-center justify-center">
                                {unreadNotifCount}
                              </Badge>
                            )}
                          </div>
                        )}
                      </Link>
                    </TooltipTrigger>
                    {sidebarCollapsed && (
                      <TooltipContent side="right" className="text-xs">{item.name}</TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </nav>

          {/* CRM Settings subitems in collapsed mode */}
          {user?.role === "super_admin" && sidebarCollapsed && (
            <nav className="space-y-0.5 mt-1">
              {crmSettingsItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <TooltipProvider key={item.name} delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          to={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150",
                            active
                              ? "bg-[#f1f3f4] text-[#1a1a2e]"
                              : "text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#1a1a2e]",
                            "justify-center px-2"
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Icon className={cn("h-4 w-4 shrink-0", active && "text-[#1a1a2e]")} />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">{item.name}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </nav>
          )}
        </ScrollArea>

        {/* Bottom section */}
        <div className="border-t border-[#e8eaed] p-2">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const isCEO = user?.role === "super_admin";
            if (item.name === "Control Center" && !isCEO) return null;
            return (
              <TooltipProvider key={item.name} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 mb-0.5",
                        active
                          ? "bg-[#f1f3f4] text-[#1a1a2e]"
                          : "text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#1a1a2e]",
                        sidebarCollapsed && "justify-center px-2"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active && "text-[#1a1a2e]")} />
                      {!sidebarCollapsed && <span>{item.name}</span>}
                    </Link>
                  </TooltipTrigger>
                  {sidebarCollapsed && (
                    <TooltipContent side="right" className="text-xs">{item.name}</TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}

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
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[#5f6368] md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="hidden md:flex items-center gap-2 text-sm text-[#5f6368]">
              <span className="text-[#1a1a2e] font-medium">EEOS Lite</span>
              <span className="text-[#9aa0a6]">/</span>
              <span className="capitalize">{location.pathname.replace("/", "").replace("-", " ") || "Dashboard"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
    </div>
  );
}
