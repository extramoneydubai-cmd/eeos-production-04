import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useDemoAuth } from "@/contexts/DemoAuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { NotificationCenter } from "@/components/shared/NotificationCenter";
import { CommandPalette, CommandPaletteTrigger } from "@/components/shared/CommandPalette";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { 
  LogOut, User, RotateCcw, RefreshCw, Users, ArrowLeftRight,
} from "lucide-react";
import { useNavigate } from "react-router";
import type { ReactNode } from "react";

interface HeaderProps {
  breadcrumb?: ReactNode;
  actions?: ReactNode;
}

export function Header({ breadcrumb, actions }: HeaderProps) {
  const { user, signOut, isLoading } = useAuth();
  const { demoUser, switchUser, resetDemo, isDemoLoading } = useDemoAuth();
  const navigate = useNavigate();
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";

  const isDemo = !!demoUser;

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await resetDemo();
      navigate("/auth");
    } catch (err) {
      console.error("Failed to reset demo:", err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      {/* ── Demo Mode Banner ── */}
      {isDemo && (
        <div className="flex h-8 items-center justify-between bg-gradient-to-r from-amber-500/90 via-orange-500/90 to-amber-500/90 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3 text-white" />
            <span className="text-[10px] font-medium text-white uppercase tracking-wider">
              EEOS Beta Demo Environment
            </span>
            <Badge
              variant="outline"
              className="text-[8px] px-1 py-0 h-3.5 border-white/30 text-white/80 font-normal"
            >
              {demoUser?.demoRole?.replace("_", " ").toUpperCase() || "DEMO"}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={switchUser}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeftRight className="h-2.5 w-2.5" />
              Switch User
            </button>
            <button
              onClick={handleResetDemo}
              disabled={isResetting}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-white/80 hover:text-white transition-colors"
            >
              <RotateCcw className={`h-2.5 w-2.5 ${isResetting ? "animate-spin" : ""}`} />
              {isResetting ? "Resetting..." : "Reset Demo Data"}
            </button>
          </div>
        </div>
      )}

      <header className="flex h-14 items-center justify-between border-b border-border/50 bg-background px-4 sm:px-6">
        {/* Breadcrumb area */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {breadcrumb && (
            <div className="text-sm text-muted-foreground truncate">
              {breadcrumb}
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          <CommandPaletteTrigger onOpen={() => setCommandOpen(true)} />
          {actions}
          <NotificationCenter />
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
          >
            <User className="h-4 w-4" />
          </Button>

          {!isLoading && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full"
                  aria-label="User menu"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[10px] bg-accent text-accent-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[220px] rounded-sm">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      {user?.name || "User"}
                    </span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {user?.email || ""}
                    </span>
                    {isDemo && demoUser && (
                      <span className="text-[10px] text-amber-500 font-medium mt-0.5">
                        Demo: {demoUser.designation || demoUser.demoRole}
                      </span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  <User className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>

                {/* Demo-specific menu items */}
                {isDemo && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={switchUser}>
                      <Users className="mr-2 h-4 w-4" />
                      Switch Demo User
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleResetDemo} disabled={isResetting}>
                      <RotateCcw className={`mr-2 h-4 w-4 ${isResetting ? "animate-spin" : ""}`} />
                      {isResetting ? "Resetting..." : "Reset Demo Data"}
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Global overlays */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
