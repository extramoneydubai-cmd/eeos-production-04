import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  ChevronDown,
  LogOut,
  Users,
  UserCircle,
  Shield,
  Building2,
  BarChart3,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_ICONS: Record<string, React.ElementType> = {
  Shield, Building2, Users, UserCircle, BarChart3, GraduationCap, Sparkles,
  CEO: Shield, COO: BarChart3, CTO: Building2, CFO: Building2, CMO: BarChart3, CHRO: Users,
  BranchDirector: Building2, AcademicHead: GraduationCap, SalesManager: BarChart3,
  Counselor: UserCircle, Faculty: GraduationCap, Accountant: Building2,
  Parent: Users, Student: GraduationCap,
};

const ROLE_COLORS: Record<string, string> = {
  CEO: "from-violet-600 to-indigo-600",
  COO: "from-blue-600 to-cyan-600",
  CTO: "from-emerald-600 to-teal-600",
  CFO: "from-amber-600 to-orange-600",
  CMO: "from-rose-600 to-pink-600",
  CHRO: "from-purple-600 to-fuchsia-600",
  BranchDirector: "from-sky-600 to-blue-600",
  AcademicHead: "from-teal-600 to-emerald-600",
  SalesManager: "from-orange-600 to-red-600",
  Counselor: "from-cyan-600 to-blue-600",
  Faculty: "from-green-600 to-emerald-600",
  Accountant: "from-yellow-600 to-amber-600",
  Parent: "from-indigo-600 to-purple-600",
  Student: "from-pink-600 to-rose-600",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n: any) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function UserSwitcher() {
  const navigate = useNavigate();
  const { signOut } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const currentProfile = useQuery(api.demo.queries.getCurrentDemoProfile);
  const allProfiles = useQuery(api.demo.queries.getAllProfiles);
  const [open, setOpen] = useState(false);

  if (!isAuthenticated) return null;
  if (!currentProfile) return null;

  const currentInitials = getInitials(currentProfile.fullName);
  const Icon = ROLE_ICONS[currentProfile.demoRole] || UserCircle;
  const colorClass = ROLE_COLORS[currentProfile.demoRole] || "from-slate-500 to-slate-600";

  const handleSwitchUser = async (role: string) => {
    setOpen(false);
    // Navigate to auth to switch user (demo re-login flow)
    navigate("/auth");
  };

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
    navigate("/auth");
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 px-2 gap-2 hover:bg-slate-100/80 data-[state=open]:bg-slate-100"
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className={cn(
              "text-[10px] text-white bg-gradient-to-br",
              colorClass,
            )}>
              {currentInitials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-xs font-medium text-slate-900">{currentProfile.fullName}</span>
            <span className="text-[10px] text-slate-500">{currentProfile.demoRole}</span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className={cn(
              "text-[8px] text-white bg-gradient-to-br",
              colorClass,
            )}>
              {currentInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{currentProfile.fullName}</span>
            <span className="text-[10px] text-muted-foreground">{currentProfile.designation}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="px-2 py-1.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1">
            Switch User
          </p>
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {allProfiles?.filter((p) => p._id !== currentProfile._id).map((profile) => {
              const pColor = ROLE_COLORS[profile.demoRole] || "from-slate-500 to-slate-600";
              const pInitials = getInitials(profile.fullName);
              return (
                <DropdownMenuItem
                  key={profile._id}
                  onClick={() => handleSwitchUser(profile.demoRole)}
                  className="flex items-center gap-2 py-1.5 px-2 cursor-pointer"
                >
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className={cn(
                      "text-[7px] text-white bg-gradient-to-br",
                      pColor,
                    )}>
                      {pInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-xs">{profile.fullName}</span>
                    <span className="text-[10px] text-muted-foreground">{profile.demoRole}</span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
