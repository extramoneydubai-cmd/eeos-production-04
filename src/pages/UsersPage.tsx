import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Plus,
  Search,
  UserX,
  UserCheck,
  KeyRound,
  ArrowRight,
  Loader2,
  Mail,
  Phone,
  Building2,
  Users,
  Briefcase,
  CalendarDays,
  BadgeCheck,
  UserCog,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Filter,
  X,
  Shield,
  Copy,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserMinus,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const EMPLOYMENT_TYPES = ["Permanent", "Contract", "Part Time", "Intern", "Freelancer", "Consultant"] as const;
const EMPLOYMENT_STATUSES = ["active", "suspended", "terminated", "resigned", "on_leave"] as const;
const PRIMARY_ROLES = ["super_admin", "admin", "manager", "staff"] as const;

function getInitials(name?: string) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function ProfileCompletionMeter({ value }: { value?: number }) {
  const pct = value ?? 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-400"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-medium text-gray-500">{pct}%</span>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
        active
          ? "bg-[#1a1a2e] text-white"
          : "bg-[#f1f3f4] text-[#5f6368] hover:bg-[#e8eaed]"
      }`}
    >
      {label}
    </button>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "super_admin" || currentUser?.role === "admin";

  // Data queries
  const users = useQuery(api.users.listUsers);
  const departments = useQuery(api.organization.listDepartments);
  const teams = useQuery(api.organization.listTeams);
  const branches = useQuery(api.organization.listBranches);
  const designations = useQuery(api.organization.listDesignations);
  const companies = useQuery(api.organization.listCompanies);
  const group = useQuery(api.organization.getGroup);
  const hrEmployeeCategories = useQuery(api.hrEmployeeCategories?.list ?? (() => [] as any));
  const hrWorkLocations = useQuery(api.hrWorkLocations?.list ?? (() => [] as any));
  const hrSkills = useQuery(api.hrSkills?.list ?? (() => [] as any));
  const hrExperienceLevels = useQuery(api.hrExperienceLevels?.list ?? (() => [] as any));

  // Mutations
  const createUser = useMutation(api.userManagement.createUser);
  const updateUser = useMutation(api.userManagement.updateUser);
  const disableUser = useMutation(api.userManagement.disableUser);
  const enableUser = useMutation(api.userManagement.enableUser);
  const setPassword = useMutation(api.authHelpers.setPassword);
  const changeReportingManager = useMutation(api.userManagement.changeReportingManager);
  const transferEmployee = useMutation(api.userManagement.transferEmployee);
  const promoteEmployee = useMutation(api.userManagement.promoteEmployee);
  const updateEmploymentStatus = useMutation(api.userManagement.updateEmploymentStatus);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState<string | null>(null);
  const [showTransferDialog, setShowTransferDialog] = useState<string | null>(null);
  const [showPromoteDialog, setShowPromoteDialog] = useState<string | null>(null);
  const [showConfirmAction, setShowConfirmAction] = useState<string | null>(null);
  const [confirmActionType, setConfirmActionType] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [filterCompany, setFilterCompany] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [filterDesig, setFilterDesig] = useState("");
  const [filterEmploymentType, setFilterEmploymentType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Create form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState("staff");
  const [formCompany, setFormCompany] = useState("");
  const [formBranch, setFormBranch] = useState("");
  const [formDept, setFormDept] = useState("");
  const [formTeamIds, setFormTeamIds] = useState<string[]>([]);
  const [formDesig, setFormDesig] = useState("");
  const [formEmploymentType, setFormEmploymentType] = useState("");
  const [formJoiningDate, setFormJoiningDate] = useState("");
  const [formReportingManager, setFormReportingManager] = useState("");
  const [formPassword, setFormPassword] = useState("staff123");
  const [creating, setCreating] = useState(false);

  // Edit form state
  const [editFields, setEditFields] = useState<Record<string, any>>({});

  const resetCreateForm = () => {
    setFormName("");
    setFormEmail("");
    setFormUsername("");
    setFormPhone("");
    setFormRole("staff");
    setFormCompany("");
    setFormBranch("");
    setFormDept("");
    setFormTeamIds([]);
    setFormDesig("");
    setFormEmploymentType("");
    setFormJoiningDate("");
    setFormReportingManager("");
    setFormPassword("staff123");
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((u: any) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const matches =
        u.name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.employeeId?.toLowerCase().includes(q) ||
        u.phone?.includes(q);
      if (!matches) return false;
      if (filterCompany && u.companyId !== filterCompany) return false;
      if (filterBranch && u.branchId !== filterBranch) return false;
      if (filterDept && u.departmentId !== filterDept) return false;
      if (filterTeam && !u.teamIds?.includes(filterTeam)) return false;
      if (filterDesig && u.designationId !== filterDesig) return false;
      if (filterEmploymentType && u.employmentType !== filterEmploymentType) return false;
      if (filterStatus && u.employmentStatus !== filterStatus) return false;
      return true;
    });
  }, [users, searchQuery, filterCompany, filterBranch, filterDept, filterTeam, filterDesig, filterEmploymentType, filterStatus]);

  const activeFilters = [filterCompany, filterBranch, filterDept, filterTeam, filterDesig, filterEmploymentType, filterStatus].filter(Boolean).length;

  const clearFilters = () => {
    setFilterCompany("");
    setFilterBranch("");
    setFilterDept("");
    setFilterTeam("");
    setFilterDesig("");
    setFilterEmploymentType("");
    setFilterStatus("");
  };

  // Handlers
  const handleCreateUser = async () => {
    if (!formName || !formEmail || !formUsername) {
      toast.error("Name, email, and username are required");
      return;
    }
    setCreating(true);
    try {
      const joiningDateMs = formJoiningDate ? new Date(formJoiningDate).getTime() : undefined;
      const userId = await createUser({
        name: formName,
        email: formEmail,
        username: formUsername,
        phone: formPhone || undefined,
        role: formRole,
        companyId: formCompany as any || undefined,
        branchId: formBranch as any || undefined,
        departmentId: formDept as any || undefined,
        teamIds: formTeamIds as any || [],
        designationId: formDesig as any || undefined,
        employmentType: formEmploymentType || undefined,
        joiningDate: joiningDateMs,
        reportingManagerId: formReportingManager as any || undefined,
      });
      if (userId && formPassword) {
        await setPassword({ userId: userId as any, password: formPassword });
      }
      setShowCreateDialog(false);
      resetCreateForm();
      toast.success("User created successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const handleEditUser = async () => {
    if (!showEditDialog) return;
    try {
      const updates: Record<string, any> = {};
      for (const [key, value] of Object.entries(editFields)) {
        if (value !== undefined && value !== "") {
          updates[key] = value;
        }
      }
      if (Object.keys(updates).length > 0) {
        await updateUser({ userId: showEditDialog as any, ...updates });
        toast.success("User updated");
      }
      setShowEditDialog(null);
      setEditFields({});
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  };

  const handleDisable = async (userId: string, currentlyDisabled: boolean) => {
    try {
      if (currentlyDisabled) {
        await enableUser({ userId: userId as any });
        toast.success("User enabled");
      } else {
        await disableUser({ userId: userId as any });
        toast.success("User disabled");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      await setPassword({ userId: userId as any, password: "reset123" });
      toast.success("Password reset to 'reset123'");
    } catch (e: any) {
      toast.error(e.message || "Failed to reset password");
    }
  };

  const handleStatusChange = async (userId: string, status: string) => {
    try {
      await updateEmploymentStatus({ userId: userId as any, status });
      toast.success(`Status changed to ${status}`);
      setShowConfirmAction(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
    }
  };

  const handlePromote = async () => {
    if (!showPromoteDialog) return;
    const { newDesignationId, newRole } = editFields;
    if (!newDesignationId) {
      toast.error("Select a new designation");
      return;
    }
    try {
      await promoteEmployee({
        userId: showPromoteDialog as any,
        newDesignationId: newDesignationId as any,
        newRole: newRole || undefined,
      });
      toast.success("Employee promoted");
      setShowPromoteDialog(null);
      setEditFields({});
    } catch (e: any) {
      toast.error(e.message || "Failed to promote");
    }
  };

  const handleTransfer = async () => {
    if (!showTransferDialog) return;
    try {
      await transferEmployee({
        userId: showTransferDialog as any,
        newDepartmentId: editFields.newDepartmentId as any || undefined,
        newCompanyId: editFields.newCompanyId as any || undefined,
        newBranchId: editFields.newBranchId as any || undefined,
        newDesignationId: editFields.newDesignationId as any || undefined,
        newTeamIds: editFields.newTeamIds as any || undefined,
      });
      toast.success("Employee transferred");
      setShowTransferDialog(null);
      setEditFields({});
    } catch (e: any) {
      toast.error(e.message || "Failed to transfer");
    }
  };

  const statusColor = (role?: string) => {
    switch (role) {
      case "super_admin": return "bg-[#1a1a2e] text-white";
      case "admin": return "bg-[#1a73e8] text-white";
      case "manager": return "bg-[#fbbc04] text-[#1a1a2e]";
      default: return "bg-[#f1f3f4] text-[#5f6368]";
    }
  };

  const empStatusColor = (status?: string) => {
    switch (status) {
      case "active": return "bg-green-50 text-green-700 border-green-200";
      case "suspended": return "bg-red-50 text-red-700 border-red-200";
      case "terminated": return "bg-gray-100 text-gray-600 border-gray-200";
      case "resigned": return "bg-amber-50 text-amber-700 border-amber-200";
      case "on_leave": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-gray-50 text-gray-500 border-gray-200";
    }
  };

  // Cascading filtered dropdowns
  const filteredBranches = useMemo(() => {
    if (!branches || !companies) return branches;
    if (!formCompany && !editFields.companyId) return branches;
    const companyId = formCompany || editFields.companyId;
    return branches.filter((b: any) => b.parentId === companyId || !b.parentType);
  }, [branches, companies, formCompany, editFields.companyId]);

  const filteredDepts = useMemo(() => {
    if (!departments) return [];
    return departments;
  }, [departments]);

  const filteredTeamsForDept = useMemo(() => {
    if (!teams || !formDept) return [];
    return teams.filter((t: any) => t.departmentId === formDept);
  }, [teams, formDept]);

  // Get name helpers
  const getDeptName = (id?: string) => departments?.find((d: any) => d._id === id)?.name;
  const getBranchName = (id?: string) => branches?.find((b: any) => b._id === id)?.name;
  const getCompanyName = (id?: string) => companies?.find((c: any) => c._id === id)?.name;
  const getDesigName = (id?: string) => designations?.find((d: any) => d._id === id)?.name;
  const getUserName = (id?: string) => users?.find((u: any) => u._id === id)?.name;

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e]">Employee Management</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">
            {users?.length || 0} employees • {filteredUsers.length} filtered
          </p>
        </div>
        {isAdmin && (
          <Dialog open={showCreateDialog} onOpenChange={(o) => { setShowCreateDialog(o); if (!o) resetCreateForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh]">
              <DialogHeader>
                <DialogTitle className="text-base">Add Employee</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh] pr-4">
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-[12px] font-semibold text-[#5f6368] uppercase tracking-wider mb-2">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[12px]">Full Name *</Label>
                        <Input value={formName} onChange={(e) => setFormName(e.target.value)}
                          className="h-9 text-[13px]" placeholder="John Doe" />
                      </div>
                      <div>
                        <Label className="text-[12px]">Username *</Label>
                        <Input value={formUsername} onChange={(e) => setFormUsername(e.target.value)}
                          className="h-9 text-[13px]" placeholder="johndoe" />
                      </div>
                      <div>
                        <Label className="text-[12px]">Email *</Label>
                        <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)}
                          className="h-9 text-[13px]" placeholder="john@company.com" type="email" />
                      </div>
                      <div>
                        <Label className="text-[12px]">Phone</Label>
                        <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)}
                          className="h-9 text-[13px]" placeholder="+91 9876543210" />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Platform Role */}
                  <div>
                    <h3 className="text-[12px] font-semibold text-[#5f6368] uppercase tracking-wider mb-2">Platform Role</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[12px]">Primary Role</Label>
                        <Select value={formRole} onValueChange={setFormRole}>
                          <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[12px]">Designation</Label>
                        <Select value={formDesig} onValueChange={setFormDesig}>
                          <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {designations?.map((d: any) => (
                              <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Organization Assignment - Cascading */}
                  <div>
                    <h3 className="text-[12px] font-semibold text-[#5f6368] uppercase tracking-wider mb-2">Organization Assignment</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[12px]">Group</Label>
                          <div className="h-9 px-3 rounded-md border border-[#e8eaed] flex items-center text-[13px] text-[#5f6368] bg-gray-50">
                            {group?.name || "Veda EdTech"}
                          </div>
                        </div>
                        <div>
                          <Label className="text-[12px]">Company</Label>
                          <Select value={formCompany} onValueChange={setFormCompany}>
                            <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Select Company" /></SelectTrigger>
                            <SelectContent>
                              {companies?.map((c: any) => (
                                <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[12px]">Branch</Label>
                          <Select value={formBranch} onValueChange={setFormBranch}>
                            <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                            <SelectContent>
                              {(filteredBranches || branches)?.map((b: any) => (
                                <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-[12px]">Department</Label>
                          <Select value={formDept} onValueChange={setFormDept}>
                            <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Select Department" /></SelectTrigger>
                            <SelectContent>
                              {filteredDepts?.map((d: any) => (
                                <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[12px]">Team</Label>
                          <Select
                            value={formTeamIds[0] || ""}
                            onValueChange={(v) => setFormTeamIds(v ? [v] : [])}
                            disabled={!formDept}
                          >
                            <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder={formDept ? "Select Team" : "Select Dept first"} /></SelectTrigger>
                            <SelectContent>
                              {filteredTeamsForDept?.map((t: any) => (
                                <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Employment Info */}
                  <div>
                    <h3 className="text-[12px] font-semibold text-[#5f6368] uppercase tracking-wider mb-2">Employment Information</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[12px]">Employment Type</Label>
                        <Select value={formEmploymentType} onValueChange={setFormEmploymentType}>
                          <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {EMPLOYMENT_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[12px]">Joining Date</Label>
                        <Input value={formJoiningDate} onChange={(e) => setFormJoiningDate(e.target.value)}
                          className="h-9 text-[13px]" type="date" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Label className="text-[12px]">Reporting Manager</Label>
                      <Select value={formReportingManager} onValueChange={setFormReportingManager}>
                        <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Select Manager (optional)" /></SelectTrigger>
                        <SelectContent>
                          {users?.filter((u: any) => !u.isDisabled).map((u: any) => (
                            <SelectItem key={u._id} value={u._id}>{u.name} ({u.employeeId || u.username})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  {/* Password */}
                  <div>
                    <Label className="text-[12px]">Default Password</Label>
                    <Input value={formPassword} onChange={(e) => setFormPassword(e.target.value)}
                      className="h-9 text-[13px]" />
                  </div>

                  <Button onClick={handleCreateUser} disabled={creating}
                    className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
                    {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                    Create Employee
                  </Button>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9aa0a6]" />
            <Input
              placeholder="Search by name, email, ID, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-[13px] border-[#e8eaed]"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className={`h-9 text-[12px] ${activeFilters > 0 ? "bg-[#1a1a2e] text-white border-[#1a1a2e]" : ""}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-3.5 w-3.5 mr-1" />
            Filters
            {activeFilters > 0 && <Badge className="ml-1.5 h-4 px-1 text-[10px] bg-white text-[#1a1a2e]">{activeFilters}</Badge>}
          </Button>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" className="h-9 text-[12px] text-[#5f6368]" onClick={clearFilters}>
              <X className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <Card className="border-[#e8eaed] shadow-sm">
            <CardContent className="p-3">
              <div className="flex flex-wrap gap-2 items-center">
                <FilterChip label="All" active={!filterCompany && !filterBranch && !filterDept && !filterTeam && !filterDesig && !filterEmploymentType && !filterStatus} onClick={clearFilters} />

                <Select value={filterCompany} onValueChange={setFilterCompany}>
                  <SelectTrigger className="h-7 text-[11px] w-auto min-w-[100px] border-[#e8eaed]">
                    <SelectValue placeholder="Company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {companies?.map((c: any) => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterBranch} onValueChange={setFilterBranch}>
                  <SelectTrigger className="h-7 text-[11px] w-auto min-w-[100px] border-[#e8eaed]">
                    <SelectValue placeholder="Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches?.map((b: any) => (
                      <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterDept} onValueChange={setFilterDept}>
                  <SelectTrigger className="h-7 text-[11px] w-auto min-w-[100px] border-[#e8eaed]">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments?.map((d: any) => (
                      <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterTeam} onValueChange={setFilterTeam}>
                  <SelectTrigger className="h-7 text-[11px] w-auto min-w-[100px] border-[#e8eaed]">
                    <SelectValue placeholder="Team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teams?.map((t: any) => (
                      <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterDesig} onValueChange={setFilterDesig}>
                  <SelectTrigger className="h-7 text-[11px] w-auto min-w-[100px] border-[#e8eaed]">
                    <SelectValue placeholder="Designation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Designations</SelectItem>
                    {designations?.map((d: any) => (
                      <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterEmploymentType} onValueChange={setFilterEmploymentType}>
                  <SelectTrigger className="h-7 text-[11px] w-auto min-w-[100px] border-[#e8eaed]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {EMPLOYMENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-7 text-[11px] w-auto min-w-[100px] border-[#e8eaed]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {EMPLOYMENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Users Grid */}
      <div className="space-y-2">
        {!filteredUsers?.length ? (
          <Card className="border-[#e8eaed] shadow-sm">
            <CardContent className="py-12 text-center">
              <div className="text-[13px] text-[#9aa0a6]">
                {searchQuery || activeFilters > 0 ? "No employees match your search criteria" : "No employees yet"}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user: any) => {
            const dept = departments?.find((d: any) => d._id === user.departmentId);
            const branch = branches?.find((b: any) => b._id === user.branchId);
            const company = companies?.find((c: any) => c._id === user.companyId);
            const desig = designations?.find((d: any) => d._id === user.designationId);
            const manager = users?.find((u: any) => u._id === user.reportingManagerId);
            const userTeams = teams?.filter((t: any) => user.teamIds?.includes(t._id)) || [];

            return (
              <Card key={user._id} className="border-[#e8eaed] shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Avatar className="h-10 w-10 shrink-0 mt-0.5">
                      <AvatarFallback className="text-[12px] bg-[#f1f3f4] text-[#5f6368]">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-semibold text-[#1a1a2e]">{user.name}</p>
                        {user.employeeId && (
                          <Badge variant="outline" className="text-[10px] font-mono text-[#5f6368] border-[#e8eaed]">
                            {user.employeeId}
                          </Badge>
                        )}
                        <Badge className={`text-[10px] px-1.5 py-0 h-4 font-medium ${statusColor(user.role || "")}`}>
                          {user.role?.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${empStatusColor(user.employmentStatus)}`}>
                          {user.employmentStatus?.replace("_", " ") || "active"}
                        </Badge>
                        {user.isDisabled && (
                          <Badge variant="outline" className="text-[10px] text-[#ea4335] border-[#ea4335]">Disabled</Badge>
                        )}
                      </div>

                      {/* Details row */}
                      <div className="flex items-center gap-4 mt-1.5 text-[11px] text-[#9aa0a6] flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {user.email || user.username}
                        </span>
                        {user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {user.phone}
                          </span>
                        )}
                        {desig && (
                          <span className="flex items-center gap-1">
                            <BadgeCheck className="h-3 w-3" /> {desig.name}
                          </span>
                        )}
                        {company && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> {company.name}
                          </span>
                        )}
                        {branch && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {branch.name}
                          </span>
                        )}
                        {dept && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" /> {dept.name}
                          </span>
                        )}
                        {user.employmentType && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {user.employmentType}
                          </span>
                        )}
                        {manager && (
                          <span className="flex items-center gap-1 text-[#1a73e8]">
                            <ArrowUp className="h-3 w-3" /> Reports to {manager.name}
                          </span>
                        )}
                      </div>

                      {/* Teams */}
                      {userTeams.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {userTeams.map((t: any) => (
                            <Badge key={t._id} variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-[#f1f3f4] text-[#5f6368]">
                              {t.name}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Profile completion */}
                      <div className="mt-2">
                        <ProfileCompletionMeter value={user.profileCompletion} />
                      </div>
                    </div>

                    {/* Quick actions */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-[#9aa0a6] hover:text-[#1a73e8]"
                                onClick={() => { setEditFields({}); setShowEditDialog(user._id); }}>
                                <UserCog className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">Edit Employee</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-[#9aa0a6] hover:text-[#fbbc04]"
                                onClick={() => {
                                  setEditFields({ newDesignationId: "", newRole: "" });
                                  setShowPromoteDialog(user._id);
                                }}>
                                <ArrowUp className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">Promote</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-[#9aa0a6] hover:text-[#34a853]"
                                onClick={() => {
                                  setEditFields({});
                                  setShowTransferDialog(user._id);
                                }}>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">Transfer</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-[#9aa0a6] hover:text-[#ea4335]"
                                onClick={() => handleResetPassword(user._id)}>
                                <KeyRound className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">Reset Password</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon"
                                className={`h-7 w-7 ${user.isDisabled ? "text-[#34a853]" : "text-[#ea4335]"}`}
                                onClick={() => handleDisable(user._id, !!user.isDisabled)}>
                                {user.isDisabled ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">{user.isDisabled ? "Enable" : "Disable"}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon"
                                className="h-7 w-7 text-[#9aa0a6] hover:text-[#ea4335]"
                                onClick={() => {
                                  setConfirmActionType("status");
                                  setShowConfirmAction(user._id);
                                }}>
                                <UserMinus className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">Change Status</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Edit Employee Dialog */}
      <Dialog open={!!showEditDialog} onOpenChange={(o) => { if (!o) setShowEditDialog(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader><DialogTitle className="text-base">Edit Employee</DialogTitle></DialogHeader>
          {(() => {
            const editUser = users?.find((u: any) => u._id === showEditDialog);
            if (!editUser) return null;
            const e = editFields;
            return (
              <ScrollArea className="max-h-[65vh] pr-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[12px]">Name</Label>
                      <Input defaultValue={editUser.name || ""} onChange={(v) => setEditFields({ ...e, name: v.target.value })}
                        className="h-9 text-[13px]" />
                    </div>
                    <div>
                      <Label className="text-[12px]">Email</Label>
                      <Input defaultValue={editUser.email || ""} onChange={(v) => setEditFields({ ...e, email: v.target.value })}
                        className="h-9 text-[13px]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[12px]">Phone</Label>
                      <Input defaultValue={editUser.phone || ""} onChange={(v) => setEditFields({ ...e, phone: v.target.value })}
                        className="h-9 text-[13px]" />
                    </div>
                    <div>
                      <Label className="text-[12px]">Designation</Label>
                      <Select defaultValue={editUser.designationId || ""} onValueChange={(v) => setEditFields({ ...e, designationId: v })}>
                        <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {designations?.map((d: any) => (
                            <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[12px]">Employment Type</Label>
                      <Select defaultValue={editUser.employmentType || ""} onValueChange={(v) => setEditFields({ ...e, employmentType: v })}>
                        <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {EMPLOYMENT_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[12px]">Role</Label>
                      <Select defaultValue={editUser.role || ""} onValueChange={(v) => setEditFields({ ...e, role: v })}>
                        <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PRIMARY_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>{r.replace("_", " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-[12px]">Reporting Manager</Label>
                    <Select defaultValue={editUser.reportingManagerId || ""} onValueChange={(v) => setEditFields({ ...e, reportingManagerId: v })}>
                      <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Select Manager" /></SelectTrigger>
                      <SelectContent>
                        {users?.filter((u: any) => u._id !== showEditDialog && !u.isDisabled).map((u: any) => (
                          <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleEditUser} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
                    Save Changes
                  </Button>
                </div>
              </ScrollArea>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Promote Dialog */}
      <Dialog open={!!showPromoteDialog} onOpenChange={(o) => { if (!o) setShowPromoteDialog(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-base">Promote Employee</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[12px]">New Designation *</Label>
              <Select value={editFields.newDesignationId || ""} onValueChange={(v) => setEditFields({ ...editFields, newDesignationId: v })}>
                <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {designations?.map((d: any) => (
                    <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[12px]">New Role (Optional)</Label>
              <Select value={editFields.newRole || ""} onValueChange={(v) => setEditFields({ ...editFields, newRole: v })}>
                <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Keep current" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handlePromote} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
              Promote
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={!!showTransferDialog} onOpenChange={(o) => { if (!o) setShowTransferDialog(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-base">Transfer Employee</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[12px]">New Company</Label>
              <Select value={editFields.newCompanyId || ""} onValueChange={(v) => setEditFields({ ...editFields, newCompanyId: v })}>
                <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Keep current" /></SelectTrigger>
                <SelectContent>
                  {companies?.map((c: any) => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[12px]">New Department</Label>
              <Select value={editFields.newDepartmentId || ""} onValueChange={(v) => setEditFields({ ...editFields, newDepartmentId: v })}>
                <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Keep current" /></SelectTrigger>
                <SelectContent>
                  {departments?.map((d: any) => (
                    <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[12px]">New Branch</Label>
              <Select value={editFields.newBranchId || ""} onValueChange={(v) => setEditFields({ ...editFields, newBranchId: v })}>
                <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Keep current" /></SelectTrigger>
                <SelectContent>
                  {branches?.map((b: any) => (
                    <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleTransfer} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
              Transfer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <Dialog open={!!showConfirmAction} onOpenChange={(o) => { if (!o) setShowConfirmAction(null); }}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="text-base">Change Status</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {EMPLOYMENT_STATUSES.map((s) => (
              <Button key={s} variant="outline" className="w-full justify-start h-9 text-[13px]"
                onClick={() => showConfirmAction && handleStatusChange(showConfirmAction, s)}>
                {s.replace("_", " ")}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
