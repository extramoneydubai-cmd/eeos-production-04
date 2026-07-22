import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import {
  User,
  Mail,
  Building2,
  Users,
  GitBranch,
  Hash,
  Shield,
  Calendar,
  LogOut,
  KeyRound,
  ChevronRight,
} from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { navigate } = useAppNavigate();

  const designation = useQuery(
    api.organization.listDesignations
  )?.find((d: any) => d._id === user?.designationId);

  const department = useQuery(
    api.organization.listDepartments
  )?.find((d: any) => d._id === user?.departmentId);

  const branch = useQuery(
    api.organization.listBranches
  )?.find((b: any) => b._id === user?.branchId);

  const userTeams = useQuery(api.organization.listTeams)?.filter(
    (t) => user?.teamIds?.includes(t._id)
  );

  const scope = useQuery(
    api.userManagement.getUserScope,
    user ? { userId: user._id } : "skip"
  );

  if (!user) return null;

  const initials = user.name
    ? user.name.split(" ").map((n: any) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const roleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin": return "bg-[#1a1a2e] text-white";
      case "admin": return "bg-[#1a73e8] text-white";
      case "manager": return "bg-[#fbbc04] text-[#1a1a2e]";
      default: return "bg-[#f1f3f4] text-[#5f6368]";
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-[#1a1a2e]">Profile</h1>
        <p className="text-[13px] text-[#5f6368] mt-0.5">Your account information</p>
      </div>

      {/* Profile Card */}
      <Card className="border-[#e8eaed] shadow-sm bg-white">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-sm bg-[#f1f3f4] text-[#5f6368]">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#1a1a2e]">{user.name}</h2>
                <Badge className={`text-[10px] px-1.5 py-0 h-4 font-medium ${roleBadgeColor(user.role || "")}`}>
                  {user.role?.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-[13px] text-[#5f6368] mt-0.5">@{user.username}</p>
              <div className="flex items-center gap-3 mt-2">
                {designation && (
                  <div className="flex items-center gap-1 text-[11px] text-[#9aa0a6]">
                    <Hash className="h-3 w-3" />
                    {designation.name}
                  </div>
                )}
                {department && (
                  <div className="flex items-center gap-1 text-[11px] text-[#9aa0a6]">
                    <Building2 className="h-3 w-3" />
                    {department.name}
                  </div>
                )}
                {branch && (
                  <div className="flex items-center gap-1 text-[11px] text-[#9aa0a6]">
                    <GitBranch className="h-3 w-3" />
                    {branch.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card className="border-[#e8eaed] shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <div className="flex items-center justify-between py-2.5 border-b border-[#f1f3f4]">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#5f6368]" />
              <span className="text-[13px] text-[#5f6368]">Email</span>
            </div>
            <span className="text-[13px] font-medium text-[#1a1a2e]">{user.email || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-[#f1f3f4]">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[#5f6368]" />
              <span className="text-[13px] text-[#5f6368]">Username</span>
            </div>
            <span className="text-[13px] font-medium text-[#1a1a2e]">{user.username}</span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-[#f1f3f4]">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#5f6368]" />
              <span className="text-[13px] text-[#5f6368]">Platform Role</span>
            </div>
            <Badge className={`text-[10px] px-1.5 py-0 h-4 font-medium capitalize ${roleBadgeColor(user.role || "")}`}>
              {user.role?.replace("_", " ")}
            </Badge>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-[#f1f3f4]">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-[#5f6368]" />
              <span className="text-[13px] text-[#5f6368]">Designation</span>
            </div>
            <span className="text-[13px] font-medium text-[#1a1a2e]">{designation?.name || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-[#f1f3f4]">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#5f6368]" />
              <span className="text-[13px] text-[#5f6368]">Department</span>
            </div>
            <span className="text-[13px] font-medium text-[#1a1a2e]">{department?.name || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-[#5f6368]" />
              <span className="text-[13px] text-[#5f6368]">Branch</span>
            </div>
            <span className="text-[13px] font-medium text-[#1a1a2e]">{branch?.name || "—"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Teams */}
      <Card className="border-[#e8eaed] shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Teams</CardTitle>
        </CardHeader>
        <CardContent>
          {!userTeams?.length ? (
            <p className="text-[12px] text-[#9aa0a6]">No team memberships</p>
          ) : (
            <div className="space-y-1">
              {userTeams.map((team) => (
                <div key={team._id} className="flex items-center gap-2 p-2 rounded-md hover:bg-[#f8f9fa]">
                  <Users className="h-4 w-4 text-[#5f6368]" />
                  <span className="text-[13px] text-[#1a1a2e]">{team.name}</span>
                  <span className="text-[11px] text-[#9aa0a6] ml-auto">{team.code}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Access Scope */}
      {scope && (
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Access Scope</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scope.canAccessDashboard && (
                <div className="flex items-center gap-2 text-[13px] text-[#5f6368]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#34a853]" />
                  Dashboard Access
                </div>
              )}
              {scope.departmentIds?.length ? (
                <div className="flex items-center gap-2 text-[13px] text-[#5f6368]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1a73e8]" />
                  {scope.departmentIds.length} Department(s)
                </div>
              ) : null}
              {scope.teamIds?.length ? (
                <div className="flex items-center gap-2 text-[13px] text-[#5f6368]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#a855f7]" />
                  {scope.teamIds.length} Team(s)
                </div>
              ) : null}
              {scope.branchIds?.length ? (
                <div className="flex items-center gap-2 text-[13px] text-[#5f6368]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#fbbc04]" />
                  {scope.branchIds.length} Branch(es)
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logout */}
      <Button
        variant="outline"
        onClick={handleLogout}
        className="w-full h-9 text-[13px] text-[#ea4335] border-[#ea4335] hover:bg-[#fce8e6]"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
}
