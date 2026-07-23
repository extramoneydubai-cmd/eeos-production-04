import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Building2,
  Layers,
  GitBranch,
  Plus,
  ChevronDown,
  ChevronRight,
  Hash,
  GraduationCap,
  Edit3,
  Trash2,
  Building,
  Users,
  Globe,
  Search,
  X,
  AlertTriangle,
  CheckCircle2,
  FolderTree,
} from "lucide-react";
import React, { useState, useMemo } from "react";
import type { Doc, Id } from "@/convex/_generated/dataModel";

// ─── Helpers ───

function countTeams(depts: any[], teams: any[]) {
  return teams?.filter((t) => depts.some((d: any) => d._id === t.departmentId)).length || 0;
}

function countUsersInDept(deptId: string, users: any[]) {
  return users?.filter((u) => u.departmentId === deptId && !u.isDisabled).length || 0;
}

// ─── Tree Node ───

function TreeNode({
  icon,
  label,
  type,
  count,
  color,
  defaultOpen = false,
  onAdd,
  onEdit,
  onDelete,
  deleteWarning,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  type: string;
  count?: number;
  color?: string;
  defaultOpen?: boolean;
  onAdd?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  deleteWarning?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasChildren = children && React.Children.count(children) > 0;
  return (
    <div>
      <div className="group flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[#f1f3f4] text-[13px]">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 flex-1 min-w-0"
        >
          {hasChildren ? (
            open ? (
              <ChevronDown className="h-3 w-3 text-[#9aa0a6] shrink-0" />
            ) : (
              <ChevronRight className="h-3 w-3 text-[#9aa0a6] shrink-0" />
            )
          ) : (
            <span className="w-3 shrink-0" />
          )}
          {icon || (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: color || "#9aa0a6" }}
            />
          )}
          <span className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-wider shrink-0">
            {type}
          </span>
          <span className="text-[13px] font-medium text-[#1a1a2e] truncate">
            {label}
          </span>
          {count !== undefined && count > 0 && (
            <Badge
              variant="secondary"
              className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-[#f1f3f4] text-[#5f6368] shrink-0"
            >
              {count}
            </Badge>
          )}
        </button>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {onAdd && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(true);
                onAdd();
              }}
              className="p-0.5 text-[#9aa0a6] hover:text-[#1a73e8] rounded"
              title="Add child"
            >
              <Plus className="h-3 w-3" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-0.5 text-[#9aa0a6] hover:text-[#1a73e8] rounded"
              title="Edit"
            >
              <Edit3 className="h-3 w-3" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-0.5 text-[#9aa0a6] hover:text-[#e8710a] rounded"
              title={deleteWarning || "Delete"}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      {open && hasChildren && (
        <div className="ml-4 border-l border-[#e8eaed] space-y-0.5 py-0.5">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Empty State ───

function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-6">
      <p className="text-[13px] text-[#9aa0a6]">{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ─── Main Component ───

export default function OrganizationStudio() {
  const { user } = useAuth();
  const isCEO = user?.role === "super_admin";

  // Data
  const group = useQuery(api.organization.getGroup);
  const departments = useQuery(api.organization.listDepartments);
  const teams = useQuery(api.organization.listTeams);
  const branches = useQuery(api.organization.listBranches);
  const verticals = useQuery(api.organization.listVerticals);
  const subVerticals = useQuery(api.organization.listSubVerticals, {});
  const boardsData = useQuery(api.organization.listBoards, {});
  const designations = useQuery(api.organization.listDesignations);
  const companies = useQuery(api.organization.listCompanies);
  const users = useQuery(api.users.listUsers);

  // Mutations
  const updateGroup = useMutation(api.organization.updateGroup);
  const createDept = useMutation(api.organization.createDepartment);
  const updateDept = useMutation(api.organization.updateDepartment);
  const deleteDept = useMutation(api.organization.deleteDepartment);
  const createTeamMut = useMutation(api.organization.createTeam);
  const updateTeamMut = useMutation(api.organization.updateTeam);
  const deleteTeamMut = useMutation(api.organization.deleteTeam);
  const createBranchMut = useMutation(api.organization.createBranch);
  const updateBranchMut = useMutation(api.organization.updateBranch);
  const deleteBranchMut = useMutation(api.organization.deleteBranch);
  const createCompanyMut = useMutation(api.organization.createCompany);
  const updateCompanyMut = useMutation(api.organization.updateCompany);
  const deleteCompanyMut = useMutation(api.organization.deleteCompany);
  const createVerticalMut = useMutation(api.organization.createVertical);
  const updateVerticalMut = useMutation(api.organization.updateVertical);
  const deleteVerticalMut = useMutation(api.organization.deleteVertical);
  const createSubVertMut = useMutation(api.organization.createSubVertical);
  const updateSubVertMut = useMutation(api.organization.updateSubVertical);
  const deleteSubVertMut = useMutation(api.organization.deleteSubVertical);
  const createBoardMut = useMutation(api.organization.createBoard);
  const updateBoardMut = useMutation(api.organization.updateBoard);
  const deleteBoardMut = useMutation(api.organization.deleteBoard);
  const createDesigMut = useMutation(api.organization.createDesignation);
  const updateDesigMut = useMutation(api.organization.updateDesignation);
  const deleteDesigMut = useMutation(api.organization.deleteDesignation);

  // ─── Dialog States ───
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [groupDesc, setGroupDesc] = useState("");

  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [editCompany, setEditCompany] = useState<any>(null);
  const [companyName, setCompanyName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [companyStatus, setCompanyStatus] = useState("active");

  const [showBranchDialog, setShowBranchDialog] = useState(false);
  const [editBranch, setEditBranch] = useState<any>(null);
  const [branchName, setBranchName] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [branchParentType, setBranchParentType] = useState<"group" | "company">("group");
  const [branchParentId, setBranchParentId] = useState("");

  const [showDeptDialog, setShowDeptDialog] = useState(false);
  const [editDept, setEditDept] = useState<any>(null);
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [deptParentType, setDeptParentType] = useState<"group" | "company">("group");
  const [deptParentId, setDeptParentId] = useState("");

  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [editTeam, setEditTeam] = useState<any>(null);
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [teamDeptId, setTeamDeptId] = useState("");

  const [showVertDialog, setShowVertDialog] = useState(false);
  const [editVert, setEditVert] = useState<any>(null);
  const [vertName, setVertName] = useState("");
  const [vertCode, setVertCode] = useState("");
  const [vertDesc, setVertDesc] = useState("");

  const [showSubVertDialog, setShowSubVertDialog] = useState(false);
  const [editSubVert, setEditSubVert] = useState<any>(null);
  const [subVertName, setSubVertName] = useState("");
  const [subVertCode, setSubVertCode] = useState("");
  const [subVertVerticalId, setSubVertVerticalId] = useState("");
  const [subVertDesc, setSubVertDesc] = useState("");

  const [showBoardDialog, setShowBoardDialog] = useState(false);
  const [editBoard, setEditBoard] = useState<any>(null);
  const [boardName, setBoardName] = useState("");
  const [boardCode, setBoardCode] = useState("");
  const [boardSubVerticalId, setBoardSubVerticalId] = useState("");
  const [boardDesc, setBoardDesc] = useState("");

  const [showDesigDialog, setShowDesigDialog] = useState(false);
  const [editDesig, setEditDesig] = useState<any>(null);
  const [desigName, setDesigName] = useState("");
  const [desigCode, setDesigCode] = useState("");
  const [desigStatus, setDesigStatus] = useState("active");

  const [searchQuery, setSearchQuery] = useState("");

  // ─── Delete Confirmations ───
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: string;
    id: string;
    name: string;
    warning?: string;
  } | null>(null);

  // Handle delete with dependency check
  const handleDelete = async (type: string, id: string) => {
    try {
      switch (type) {
        case "company":
          await deleteCompanyMut({ id: id as any });
          break;
        case "branch":
          await deleteBranchMut({ id: id as any });
          break;
        case "department":
          await deleteDept({ id: id as any });
          break;
        case "team":
          await deleteTeamMut({ id: id as any });
          break;
        case "vertical":
          await deleteVerticalMut({ id: id as any });
          break;
        case "subVertical":
          await deleteSubVertMut({ id: id as any });
          break;
        case "board":
          await deleteBoardMut({ id: id as any });
          break;
        case "designation":
          await deleteDesigMut({ id: id as any });
          break;
      }
      toast.success(`${type} deleted successfully`);
      setDeleteConfirm(null);
    } catch (err: any) {
      toast.error(err.message || `Failed to delete ${type}`);
      setDeleteConfirm(null);
    }
  };

  // ─── Handlers ───

  const openGroupDialog = () => {
    setGroupName(group?.name || "Veda EdTech");
    setGroupCode(group?.code || "VEDA");
    setGroupDesc(group?.description || "");
    setShowGroupDialog(true);
  };

  const handleUpdateGroup = async () => {
    if (!groupName || !groupCode) return;
    await updateGroup({
      name: groupName,
      code: groupCode.toUpperCase(),
      description: groupDesc || undefined,
    });
    setShowGroupDialog(false);
    toast.success("Group updated");
  };

  const openAddBranch = (parentType: "group" | "company", parentId: string) => {
    setEditBranch(null);
    setBranchName("");
    setBranchCode("");
    setBranchParentType(parentType);
    setBranchParentId(parentId);
    setShowBranchDialog(true);
  };

  const handleCreateBranch = async () => {
    if (!branchName || !branchCode) return;
    await createBranchMut({
      name: branchName,
      code: branchCode.toUpperCase(),
      parentType: branchParentType,
      parentId: branchParentId,
    });
    setBranchName("");
    setBranchCode("");
    setShowBranchDialog(false);
    toast.success("Branch created");
  };

  const openAddDept = (parentType: "group" | "company", parentId: string) => {
    setEditDept(null);
    setDeptName("");
    setDeptCode("");
    setDeptParentType(parentType);
    setDeptParentId(parentId);
    setShowDeptDialog(true);
  };

  const handleCreateDept = async () => {
    if (!deptName || !deptCode) return;
    await createDept({
      name: deptName,
      code: deptCode.toUpperCase(),
      parentType: deptParentType,
      parentId: deptParentId,
    });
    setDeptName("");
    setDeptCode("");
    setShowDeptDialog(false);
    toast.success("Department created");
  };

  const openAddTeam = (deptId: string) => {
    setEditTeam(null);
    setTeamName("");
    setTeamCode("");
    setTeamDeptId(deptId);
    setShowTeamDialog(true);
  };

  const handleCreateTeam = async () => {
    if (!teamName || !teamCode || !teamDeptId) return;
    await createTeamMut({
      name: teamName,
      code: teamCode.toUpperCase(),
      departmentId: teamDeptId as any,
    });
    setTeamName("");
    setTeamCode("");
    setShowTeamDialog(false);
    toast.success("Team created");
  };

  const openAddCompany = () => {
    setEditCompany(null);
    setCompanyName("");
    setCompanyCode("");
    setCompanyType("");
    setCompanyStatus("active");
    setShowCompanyDialog(true);
  };

  const handleCreateCompany = async () => {
    if (!companyName || !companyCode) return;
    await createCompanyMut({
      name: companyName,
      code: companyCode.toUpperCase(),
      companyType: companyType || undefined,
      status: companyStatus,
    });
    setCompanyName("");
    setCompanyCode("");
    setShowCompanyDialog(false);
    toast.success("Company created");
  };

  const openAddVertical = () => {
    setEditVert(null);
    setVertName("");
    setVertCode("");
    setVertDesc("");
    setShowVertDialog(true);
  };

  const handleCreateVertical = async () => {
    if (!vertName || !vertCode) return;
    await createVerticalMut({
      name: vertName,
      code: vertCode.toUpperCase(),
      description: vertDesc || undefined,
    });
    setVertName("");
    setVertCode("");
    setVertDesc("");
    setShowVertDialog(false);
    toast.success("Vertical created");
  };

  const openAddSubVert = () => {
    setEditSubVert(null);
    setSubVertName("");
    setSubVertCode("");
    setSubVertVerticalId("");
    setSubVertDesc("");
    setShowSubVertDialog(true);
  };

  const handleCreateSubVert = async () => {
    if (!subVertName || !subVertCode || !subVertVerticalId) return;
    await createSubVertMut({
      name: subVertName,
      code: subVertCode.toUpperCase(),
      verticalId: subVertVerticalId as any,
      description: subVertDesc || undefined,
    });
    setSubVertName("");
    setSubVertCode("");
    setSubVertVerticalId("");
    setSubVertDesc("");
    setShowSubVertDialog(false);
    toast.success("Sub-vertical created");
  };

  const openAddBoard = () => {
    setEditBoard(null);
    setBoardName("");
    setBoardCode("");
    setBoardSubVerticalId("");
    setBoardDesc("");
    setShowBoardDialog(true);
  };

  const handleCreateBoard = async () => {
    if (!boardName || !boardCode) return;
    await createBoardMut({
      name: boardName,
      code: boardCode.toUpperCase(),
      subVerticalId: boardSubVerticalId as any || undefined,
      description: boardDesc || undefined,
    });
    setBoardName("");
    setBoardCode("");
    setBoardSubVerticalId("");
    setBoardDesc("");
    setShowBoardDialog(false);
    toast.success("Board created");
  };

  const openAddDesig = () => {
    setEditDesig(null);
    setDesigName("");
    setDesigCode("");
    setDesigStatus("active");
    setShowDesigDialog(true);
  };

  const handleCreateDesig = async () => {
    if (!desigName || !desigCode) return;
    await createDesigMut({
      name: desigName,
      code: desigCode.toUpperCase(),
      status: desigStatus,
    });
    setDesigName("");
    setDesigCode("");
    setShowDesigDialog(false);
    toast.success("Designation created");
  };

  // ─── Computed Data ───

  const groupId = group?._id || "";

  const companiesUnderGroup = companies || [];
  const branchesUnderGroup = branches?.filter(
    (b) => b.parentType === "group" && b.parentId === groupId,
  ) || [];
  const branchesUnderCompany = (companyId: string) =>
    branches?.filter((b) => b.parentType === "company" && b.parentId === companyId) || [];
  const deptsUnderGroup = departments?.filter(
    (d) => d.parentType === "group" && d.parentId === groupId,
  ) || [];
  const deptsUnderCompany = (companyId: string) =>
    departments?.filter((d) => d.parentType === "company" && d.parentId === companyId) || [];
  const teamsUnderDept = (deptId: string) =>
    teams?.filter((t) => t.departmentId === deptId) || [];

  const filteredSearch = (items: any[], fields: string[]) => {
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((item) =>
      fields.some((f) => String(item[f] || "").toLowerCase().includes(q)),
    );
  };

  // ─── Stats ───
  const stats = [
    { label: "Companies", count: companies?.length || 0, color: "#1a73e8" },
    { label: "Departments", count: departments?.length || 0, color: "#34a853" },
    { label: "Teams", count: teams?.length || 0, color: "#ea4335" },
    { label: "Branches", count: branches?.length || 0, color: "#fbbc04" },
    { label: "Verticals", count: verticals?.length || 0, color: "#a855f7" },
    { label: "Designations", count: designations?.length || 0, color: "#e8710a" },
  ];

  // ─── Render ───

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e]">Organization Studio</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">
            Build and manage your organizational hierarchy
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9aa0a6]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hierarchy..."
              className="h-8 w-48 pl-8 text-[12px] bg-[#f1f3f4] border-0 rounded-md"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9aa0a6] hover:text-[#5f6368]"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="border-[#e8eaed] shadow-sm bg-white">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold" style={{ color: s.color }}>
                {s.count}
              </p>
              <p className="text-[10px] text-[#5f6368] font-medium uppercase tracking-wider">
                {s.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Tree View ─── */}
        <div className="lg:col-span-2">
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#1a1a2e] flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-[#5f6368]" />
                Organization Tree
              </CardTitle>
              {isCEO && (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] border-[#e8eaed]"
                    onClick={openAddCompany}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Company
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] border-[#e8eaed]"
                    onClick={() => openAddBranch("group", groupId)}
                    disabled={!groupId}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Branch
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] border-[#e8eaed]"
                    onClick={() => openAddDept("group", groupId)}
                    disabled={!groupId}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Department
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[600px]">
                {/* ─── GROUP ─── */}
                <TreeNode
                  icon={<Globe className="h-3.5 w-3.5 text-[#1a1a2e]" />}
                  label={group?.name || "Loading..."}
                  type="GROUP"
                  color="#1a1a2e"
                  defaultOpen
                  onEdit={isCEO ? openGroupDialog : undefined}
                >
                  {/* ─── Companies ─── */}
                  <TreeNode
                    icon={<Building2 className="h-3.5 w-3.5 text-[#1a73e8]" />}
                    label="Companies"
                    type=""
                    count={filteredSearch(companiesUnderGroup, ["name", "code"]).length}
                    defaultOpen
                    onAdd={isCEO ? openAddCompany : undefined}
                  >
                    {filteredSearch(companiesUnderGroup, ["name", "code"]).length === 0 && (
                      <EmptyState message="No companies yet" />
                    )}
                    {filteredSearch(companiesUnderGroup, ["name", "code"]).map((c) => (
                      <TreeNode
                        key={c._id}
                        icon={<Building className="h-3 w-3 text-[#1a73e8]" />}
                        label={`${c.name} (${c.code})`}
                        type="COMPANY"
                        color={c.color || "#1a73e8"}
                        defaultOpen
                        onEdit={
                          isCEO
                            ? () => {
                                setEditCompany(c);
                                setCompanyName(c.name);
                                setCompanyCode(c.code);
                                setCompanyType(c.companyType || "");
                                setCompanyStatus(c.status || "active");
                                setShowCompanyDialog(true);
                              }
                            : undefined
                        }
                        onDelete={
                          isCEO
                            ? () => {
                                const childBranches = branchesUnderCompany(c._id);
                                const childDepts = deptsUnderCompany(c._id);
                                const warn =
                                  childBranches.length > 0 || childDepts.length > 0
                                    ? `${childBranches.length} branch(es), ${childDepts.length} dept(s) depend on this`
                                    : undefined;
                                setDeleteConfirm({
                                  type: "company",
                                  id: c._id,
                                  name: c.name,
                                  warning: warn,
                                });
                              }
                            : undefined
                        }
                        deleteWarning={
                          branchesUnderCompany(c._id).length > 0 ||
                          deptsUnderCompany(c._id).length > 0
                            ? `${branchesUnderCompany(c._id).length} branch(es), ${deptsUnderCompany(c._id).length} dept(s)`
                            : undefined
                        }
                      >
                        {/* Branches under Company */}
                        {branchesUnderCompany(c._id).length > 0 && (
                          <TreeNode
                            label="Branches"
                            type=""
                            count={branchesUnderCompany(c._id).length}
                          >
                            {branchesUnderCompany(c._id).map((b) => (
                              <TreeNode
                                key={b._id}
                                icon={<GitBranch className="h-3 w-3 text-[#fbbc04]" />}
                                label={`${b.name} (${b.code})`}
                                type="BRANCH"
                                color={b.color || "#fbbc04"}
                                onEdit={() => {
                                  setEditBranch(b);
                                  setBranchName(b.name);
                                  setBranchCode(b.code);
                                  setBranchParentType(b.parentType as any);
                                  setBranchParentId(b.parentId || "");
                                  setShowBranchDialog(true);
                                }}
                                onDelete={() =>
                                  setDeleteConfirm({
                                    type: "branch",
                                    id: b._id,
                                    name: b.name,
                                  })
                                }
                              />
                            ))}
                          </TreeNode>
                        )}

                        {/* Departments under Company */}
                        {deptsUnderCompany(c._id).length > 0 && (
                          <TreeNode
                            label="Departments"
                            type=""
                            count={deptsUnderCompany(c._id).length}
                          >
                            {deptsUnderCompany(c._id).map((d) => (
                              <TreeNode
                                key={d._id}
                                icon={<Layers className="h-3 w-3 text-[#34a853]" />}
                                label={`${d.name} (${d.code})`}
                                type="DEPT"
                                count={teamsUnderDept(d._id).length}
                                color={d.color || "#34a853"}
                                onAdd={isCEO ? () => openAddTeam(d._id) : undefined}
                                onEdit={() => {
                                  setEditDept(d);
                                  setDeptName(d.name);
                                  setDeptCode(d.code);
                                  setShowDeptDialog(true);
                                }}
                                onDelete={() => {
                                  const childTeams = teamsUnderDept(d._id);
                                  const warn =
                                    childTeams.length > 0
                                      ? `${childTeams.length} team(s) depend on this`
                                      : undefined;
                                  setDeleteConfirm({
                                    type: "department",
                                    id: d._id,
                                    name: d.name,
                                    warning: warn,
                                  });
                                }}
                              >
                                {/* Teams under Department */}
                                {teamsUnderDept(d._id).length === 0 && (
                                  <EmptyState
                                    message="No teams yet"
                                    action={
                                      isCEO ? (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 text-[11px]"
                                          onClick={() => openAddTeam(d._id)}
                                        >
                                          <Plus className="h-3 w-3 mr-1" /> Add Team
                                        </Button>
                                      ) : undefined
                                    }
                                  />
                                )}
                                {teamsUnderDept(d._id).map((t) => (
                                  <TreeNode
                                    key={t._id}
                                    icon={<Users className="h-3 w-3 text-[#a855f7]" />}
                                    label={`${t.name} (${t.code})`}
                                    type="TEAM"
                                    color={t.color || "#a855f7"}
                                    onEdit={() => {
                                      setEditTeam(t);
                                      setTeamName(t.name);
                                      setTeamCode(t.code);
                                      setTeamDeptId(t.departmentId);
                                      setShowTeamDialog(true);
                                    }}
                                    onDelete={() =>
                                      setDeleteConfirm({
                                        type: "team",
                                        id: t._id,
                                        name: t.name,
                                      })
                                    }
                                  />
                                ))}
                              </TreeNode>
                            ))}
                            <TreeNode
                              label=""
                              type=""
                              defaultOpen={false}
                            >
                              {isCEO && (
                                <div className="px-2 py-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-[11px] text-[#1a73e8]"
                                    onClick={() => openAddDept("company", c._id)}
                                  >
                                    <Plus className="h-3 w-3 mr-1" /> Add Department
                                  </Button>
                                </div>
                              )}
                            </TreeNode>
                          </TreeNode>
                        )}

                        {/* If no branches or depts under company, show add buttons */}
                        {branchesUnderCompany(c._id).length === 0 &&
                          deptsUnderCompany(c._id).length === 0 && (
                            <div className="px-4 py-1 flex gap-1">
                              {isCEO && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-[11px] text-[#fbbc04]"
                                    onClick={() => openAddBranch("company", c._id)}
                                  >
                                    <Plus className="h-3 w-3 mr-1" /> Add Branch
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-[11px] text-[#34a853]"
                                    onClick={() => openAddDept("company", c._id)}
                                  >
                                    <Plus className="h-3 w-3 mr-1" /> Add Department
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                      </TreeNode>
                    ))}
                  </TreeNode>

                  {/* ─── Branches (direct under Group) ─── */}
                  <TreeNode
                    icon={<GitBranch className="h-3.5 w-3.5 text-[#fbbc04]" />}
                    label="Branches"
                    type=""
                    count={filteredSearch(branchesUnderGroup, ["name", "code"]).length}
                    defaultOpen
                    onAdd={isCEO && groupId ? () => openAddBranch("group", groupId) : undefined}
                  >
                    {filteredSearch(branchesUnderGroup, ["name", "code"]).length === 0 && (
                      <EmptyState message="No branches under group" />
                    )}
                    {filteredSearch(branchesUnderGroup, ["name", "code"]).map((b) => (
                      <TreeNode
                        key={b._id}
                        icon={<GitBranch className="h-3 w-3 text-[#fbbc04]" />}
                        label={`${b.name} (${b.code})`}
                        type="BRANCH"
                        color={b.color || "#fbbc04"}
                        onEdit={() => {
                          setEditBranch(b);
                          setBranchName(b.name);
                          setBranchCode(b.code);
                          setBranchParentType(b.parentType as any);
                          setBranchParentId(b.parentId || "");
                          setShowBranchDialog(true);
                        }}
                        onDelete={() =>
                          setDeleteConfirm({
                            type: "branch",
                            id: b._id,
                            name: b.name,
                          })
                        }
                      />
                    ))}
                  </TreeNode>

                  {/* ─── Departments (direct under Group) ─── */}
                  <TreeNode
                    icon={<Layers className="h-3.5 w-3.5 text-[#34a853]" />}
                    label="Departments"
                    type=""
                    count={filteredSearch(deptsUnderGroup, ["name", "code"]).length}
                    defaultOpen
                    onAdd={isCEO && groupId ? () => openAddDept("group", groupId) : undefined}
                  >
                    {filteredSearch(deptsUnderGroup, ["name", "code"]).length === 0 && (
                      <EmptyState message="No departments under group" />
                    )}
                    {filteredSearch(deptsUnderGroup, ["name", "code"]).map((d) => (
                      <TreeNode
                        key={d._id}
                        icon={<Layers className="h-3 w-3 text-[#34a853]" />}
                        label={`${d.name} (${d.code})`}
                        type="DEPT"
                        count={teamsUnderDept(d._id).length}
                        color={d.color || "#34a853"}
                        onAdd={isCEO ? () => openAddTeam(d._id) : undefined}
                        onEdit={() => {
                          setEditDept(d);
                          setDeptName(d.name);
                          setDeptCode(d.code);
                          setShowDeptDialog(true);
                        }}
                        onDelete={() => {
                          const childTeams = teamsUnderDept(d._id);
                          const warn =
                            childTeams.length > 0
                              ? `${childTeams.length} team(s) depend on this`
                              : undefined;
                          setDeleteConfirm({
                            type: "department",
                            id: d._id,
                            name: d.name,
                            warning: warn,
                          });
                        }}
                      >
                        {teamsUnderDept(d._id).length === 0 && (
                          <EmptyState
                            message="No teams yet"
                            action={
                              isCEO ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-[11px]"
                                  onClick={() => openAddTeam(d._id)}
                                >
                                  <Plus className="h-3 w-3 mr-1" /> Add Team
                                </Button>
                              ) : undefined
                            }
                          />
                        )}
                        {teamsUnderDept(d._id).map((t) => (
                          <TreeNode
                            key={t._id}
                            icon={<Users className="h-3 w-3 text-[#a855f7]" />}
                            label={`${t.name} (${t.code})`}
                            type="TEAM"
                            color={t.color || "#a855f7"}
                            onEdit={() => {
                              setEditTeam(t);
                              setTeamName(t.name);
                              setTeamCode(t.code);
                              setTeamDeptId(t.departmentId);
                              setShowTeamDialog(true);
                            }}
                            onDelete={() =>
                              setDeleteConfirm({
                                type: "team",
                                id: t._id,
                                name: t.name,
                              })
                            }
                          />
                        ))}
                      </TreeNode>
                    ))}
                  </TreeNode>

                  {/* ─── Academic ─── */}
                  <TreeNode
                    icon={<GraduationCap className="h-3.5 w-3.5 text-[#a855f7]" />}
                    label="Academic"
                    type="HIERARCHY"
                    defaultOpen
                  >
                    {/* Verticals */}
                    <TreeNode
                      label="Verticals"
                      type=""
                      count={filteredSearch(verticals || [], ["name", "code"]).length}
                      defaultOpen
                      onAdd={isCEO ? openAddVertical : undefined}
                    >
                      {(filteredSearch(verticals || [], ["name", "code"])).length === 0 && (
                        <EmptyState message="No verticals yet" />
                      )}
                      {filteredSearch(verticals || [], ["name", "code"]).map((v: any) => (
                        <TreeNode
                          key={v._id}
                          label={`${v.name} (${v.code})`}
                          type="VERTICAL"
                          defaultOpen
                          onEdit={() => {
                            setEditVert(v);
                            setVertName(v.name);
                            setVertCode(v.code);
                            setVertDesc(v.description || "");
                            setShowVertDialog(true);
                          }}
                          onDelete={() =>
                            setDeleteConfirm({
                              type: "vertical",
                              id: v._id,
                              name: v.name,
                            })
                          }
                        >
                          {(subVerticals || [])
                            .filter((sv) => sv.verticalId === v._id)
                            .map((sv) => (
                              <TreeNode
                                key={sv._id}
                                label={`${sv.name} (${sv.code})`}
                                type="SUB V"
                                defaultOpen
                                onEdit={() => {
                                  setEditSubVert(sv);
                                  setSubVertName(sv.name);
                                  setSubVertCode(sv.code);
                                  setSubVertVerticalId(sv.verticalId);
                                  setSubVertDesc(sv.description || "");
                                  setShowSubVertDialog(true);
                                }}
                                onDelete={() =>
                                  setDeleteConfirm({
                                    type: "subVertical",
                                    id: sv._id,
                                    name: sv.name,
                                  })
                                }
                              >
                                {(boardsData || [])
                                  .filter((b: any) => b.subVerticalId === sv._id)
                                  .map((b: any) => (
                                    <TreeNode
                                      key={b._id}
                                      label={`${b.name} (${b.code})`}
                                      type="BOARD"
                                      onEdit={() => {
                                        setEditBoard(b);
                                        setBoardName(b.name);
                                        setBoardCode(b.code);
                                        setBoardSubVerticalId(b.subVerticalId || "");
                                        setBoardDesc(b.description || "");
                                        setShowBoardDialog(true);
                                      }}
                                      onDelete={() =>
                                        setDeleteConfirm({
                                          type: "board",
                                          id: b._id,
                                          name: b.name,
                                        })
                                      }
                                    />
                                  ))}
                              </TreeNode>
                            ))}
                          {/* Add Sub-Vertical button */}
                          {isCEO && (
                            <div className="px-3 py-0.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-[11px] text-[#a855f7]"
                                onClick={() => {
                                  setSubVertVerticalId(v._id);
                                  setShowSubVertDialog(true);
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" /> Add Sub-Vertical
                              </Button>
                            </div>
                          )}
                        </TreeNode>
                      ))}
                    </TreeNode>

                    {/* Sub-Verticals quick list */}
                    <TreeNode
                      label="Sub-Verticals"
                      type=""
                      count={subVerticals?.length || 0}
                      onAdd={isCEO ? openAddSubVert : undefined}
                    />

                    {/* Boards quick list */}
                    <TreeNode
                      label="Boards"
                      type=""
                      count={boardsData?.length || 0}
                      onAdd={isCEO ? openAddBoard : undefined}
                    />
                  </TreeNode>

                  {/* ─── Designations ─── */}
                  <TreeNode
                    icon={<Hash className="h-3.5 w-3.5 text-[#e8710a]" />}
                    label="Designations"
                    type="ROLES"
                    count={filteredSearch(designations || [], ["name", "code"]).length}
                    defaultOpen
                    onAdd={isCEO ? openAddDesig : undefined}
                  >
                    {filteredSearch(designations || [], ["name", "code"]).length === 0 && (
                      <EmptyState message="No designations yet" />
                    )}
                    {filteredSearch(designations || [], ["name", "code"]).map((d: any) => (
                      <TreeNode
                        key={d._id}
                        label={`${d.name} (${d.code})`}
                        type="ROLE"
                        onEdit={() => {
                          setEditDesig(d);
                          setDesigName(d.name);
                          setDesigCode(d.code);
                          setDesigStatus(d.status || "active");
                          setShowDesigDialog(true);
                        }}
                        onDelete={() =>
                          setDeleteConfirm({
                            type: "designation",
                            id: d._id,
                            name: d.name,
                          })
                        }
                      />
                    ))}
                  </TreeNode>
                </TreeNode>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* ─── Quick Actions / Info Panel ─── */}
        <div className="space-y-4">
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">
                Group Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#1a1a2e]" />
                <span className="text-[13px] font-medium text-[#1a1a2e]">
                  {group?.name || "Not set"}
                </span>
              </div>
              <div className="text-[12px] text-[#5f6368]">
                Code: {group?.code || "—"}
              </div>
              {group?.description && (
                <p className="text-[12px] text-[#5f6368]">{group.description}</p>
              )}
              {isCEO && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-8 text-[12px] border-[#e8eaed]"
                  onClick={openGroupDialog}
                >
                  <Edit3 className="h-3 w-3 mr-1" /> Edit Group
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">
                Hierarchy Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-[12px] text-[#5f6368]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-[#34a853]" />
                <span>Branch → Group or Company</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-[#34a853]" />
                <span>Department → Group or Company</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-[#34a853]" />
                <span>Team → Department only</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-[#34a853]" />
                <span>Company → Group only</span>
              </div>
              <Separator className="my-1" />
              <div className="flex items-center gap-2 text-[#e8710a]">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span>Cannot delete if children exist</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ───── DIALOGS ───── */}

      {/* Group Dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">Edit Group Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[12px]">Group Name</Label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="h-9 text-[13px]"
                placeholder="Veda EdTech"
              />
            </div>
            <div>
              <Label className="text-[12px]">Group Code</Label>
              <Input
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value)}
                className="h-9 text-[13px]"
                placeholder="VEDA"
              />
            </div>
            <div>
              <Label className="text-[12px]">Description</Label>
              <Textarea
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                className="text-[13px]"
                placeholder="Optional description"
                rows={2}
              />
            </div>
            <Button
              onClick={handleUpdateGroup}
              className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
            >
              Save Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Company Dialog */}
      <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">
              {editCompany ? "Edit Company" : "Create Company"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[12px]">Company Name</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-9 text-[13px]"
                placeholder="Veda EdTech Pvt Ltd"
              />
            </div>
            <div>
              <Label className="text-[12px]">Company Code</Label>
              <Input
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value)}
                className="h-9 text-[13px]"
                placeholder="VEDA_MAIN"
              />
            </div>
            <div>
              <Label className="text-[12px]">Company Type</Label>
              <Input
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value)}
                className="h-9 text-[13px]"
                placeholder="e.g. Private Limited, LLC, Foundation"
              />
            </div>
            <Button
              onClick={editCompany ? async () => {
                await updateCompanyMut({
                  id: editCompany._id,
                  name: companyName,
                  code: companyCode.toUpperCase(),
                  companyType: companyType || undefined,
                });
                setShowCompanyDialog(false);
                toast.success("Company updated");
              } : handleCreateCompany}
              className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
              disabled={!companyName || !companyCode}
            >
              {editCompany ? "Update Company" : "Create Company"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Branch Dialog */}
      <Dialog open={showBranchDialog} onOpenChange={setShowBranchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">
              {editBranch ? "Edit Branch" : "Create Branch"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[12px]">Branch Name</Label>
              <Input
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="h-9 text-[13px]"
                placeholder="Dubai Main Campus"
              />
            </div>
            <div>
              <Label className="text-[12px]">Branch Code</Label>
              <Input
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                className="h-9 text-[13px]"
                placeholder="DXB_MAIN"
              />
            </div>
            {!editBranch && (
              <>
                <div>
                  <Label className="text-[12px]">Parent Type</Label>
                  <Select
                    value={branchParentType}
                    onValueChange={(v: "group" | "company") => {
                      setBranchParentType(v);
                      setBranchParentId(v === "group" ? groupId : "");
                    }}
                  >
                    <SelectTrigger className="h-9 text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="group">Group</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {branchParentType === "company" && (
                  <div>
                    <Label className="text-[12px]">Company</Label>
                    <Select value={branchParentId} onValueChange={setBranchParentId}>
                      <SelectTrigger className="h-9 text-[13px]">
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {(companies || []).map((c) => (
                          <SelectItem key={c._id} value={c._id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
            <Button
              onClick={editBranch ? async () => {
                await updateBranchMut({
                  id: editBranch._id,
                  name: branchName,
                  code: branchCode.toUpperCase(),
                });
                setShowBranchDialog(false);
                toast.success("Branch updated");
              } : handleCreateBranch}
              className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
              disabled={!branchName || !branchCode || (!editBranch && (!branchParentId && branchParentType === 'company'))}
            >
              {editBranch ? "Update Branch" : "Create Branch"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Department Dialog */}
      <Dialog open={showDeptDialog} onOpenChange={setShowDeptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">
              {editDept ? "Edit Department" : "Create Department"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[12px]">Department Name</Label>
              <Input
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                className="h-9 text-[13px]"
                placeholder="Finance"
              />
            </div>
            <div>
              <Label className="text-[12px]">Department Code</Label>
              <Input
                value={deptCode}
                onChange={(e) => setDeptCode(e.target.value)}
                className="h-9 text-[13px]"
                placeholder="FIN"
              />
            </div>
            {!editDept && (
              <>
                <div>
                  <Label className="text-[12px]">Parent Type</Label>
                  <Select
                    value={deptParentType}
                    onValueChange={(v: "group" | "company") => {
                      setDeptParentType(v);
                      setDeptParentId(v === "group" ? groupId : "");
                    }}
                  >
                    <SelectTrigger className="h-9 text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="group">Group</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {deptParentType === "company" && (
                  <div>
                    <Label className="text-[12px]">Company</Label>
                    <Select value={deptParentId} onValueChange={setDeptParentId}>
                      <SelectTrigger className="h-9 text-[13px]">
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {(companies || []).map((c) => (
                          <SelectItem key={c._id} value={c._id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
            <Button
              onClick={editDept ? async () => {
                await updateDept({
                  id: editDept._id,
                  name: deptName,
                  code: deptCode.toUpperCase(),
                });
                setShowDeptDialog(false);
                toast.success("Department updated");
              } : handleCreateDept}
              className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
              disabled={!deptName || !deptCode}
            >
              {editDept ? "Update Department" : "Create Department"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Team Dialog */}
      <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">
              {editTeam ? "Edit Team" : "Create Team"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[12px]">Team Name</Label>
              <Input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="h-9 text-[13px]"
                placeholder="Engineering"
              />
            </div>
            <div>
              <Label className="text-[12px]">Team Code</Label>
              <Input
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value)}
                className="h-9 text-[13px]"
                placeholder="ENG"
              />
            </div>
            {!editTeam && (
              <div>
                <Label className="text-[12px]">Department</Label>
                <Select value={teamDeptId} onValueChange={setTeamDeptId}>
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {(departments || []).map((d) => (
                      <SelectItem key={d._id} value={d._id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              onClick={editTeam ? async () => {
                await updateTeamMut({
                  id: editTeam._id,
                  name: teamName,
                  code: teamCode.toUpperCase(),
                });
                setShowTeamDialog(false);
                toast.success("Team updated");
              } : handleCreateTeam}
              className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
              disabled={!teamName || !teamCode || (!editTeam && !teamDeptId)}
            >
              {editTeam ? "Update Team" : "Create Team"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vertical Dialog */}
      <Dialog open={showVertDialog} onOpenChange={setShowVertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">
              {editVert ? "Edit Vertical" : "Create Vertical"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[12px]">Name</Label>
              <Input value={vertName} onChange={(e) => setVertName(e.target.value)} className="h-9 text-[13px]" />
            </div>
            <div>
              <Label className="text-[12px]">Code</Label>
              <Input value={vertCode} onChange={(e) => setVertCode(e.target.value)} className="h-9 text-[13px]" />
            </div>
            <div>
              <Label className="text-[12px]">Description</Label>
              <Input value={vertDesc} onChange={(e) => setVertDesc(e.target.value)} className="h-9 text-[13px]" />
            </div>
            <Button onClick={editVert ? async () => {
              await updateVerticalMut({ id: editVert._id, name: vertName, code: vertCode.toUpperCase() });
              setShowVertDialog(false); toast.success("Vertical updated");
            } : handleCreateVertical} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
              {editVert ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-Vertical Dialog */}
      <Dialog open={showSubVertDialog} onOpenChange={setShowSubVertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">
              {editSubVert ? "Edit Sub-Vertical" : "Create Sub-Vertical"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[12px]">Name</Label>
              <Input value={subVertName} onChange={(e) => setSubVertName(e.target.value)} className="h-9 text-[13px]" />
            </div>
            <div>
              <Label className="text-[12px]">Code</Label>
              <Input value={subVertCode} onChange={(e) => setSubVertCode(e.target.value)} className="h-9 text-[13px]" />
            </div>
            <div>
              <Label className="text-[12px]">Vertical</Label>
              <Select value={subVertVerticalId || editSubVert?.verticalId} onValueChange={(v) => setSubVertVerticalId(v)}>
                <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {(verticals || []).map((v: any) => <SelectItem key={v._id} value={v._id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={editSubVert ? async () => {
              await updateSubVertMut({ id: editSubVert._id, name: subVertName, code: subVertCode.toUpperCase() });
              setShowSubVertDialog(false); toast.success("Sub-vertical updated");
            } : handleCreateSubVert} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
              {editSubVert ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Board Dialog */}
      <Dialog open={showBoardDialog} onOpenChange={setShowBoardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">
              {editBoard ? "Edit Board" : "Create Board"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[12px]">Name</Label>
              <Input value={boardName} onChange={(e) => setBoardName(e.target.value)} className="h-9 text-[13px]" />
            </div>
            <div>
              <Label className="text-[12px]">Code</Label>
              <Input value={boardCode} onChange={(e) => setBoardCode(e.target.value)} className="h-9 text-[13px]" />
            </div>
            <div>
              <Label className="text-[12px]">Sub-Vertical</Label>
              <Select value={boardSubVerticalId || editBoard?.subVerticalId} onValueChange={(v) => setBoardSubVerticalId(v)}>
                <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {(subVerticals || []).map((sv: any) => <SelectItem key={sv._id} value={sv._id}>{sv.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={editBoard ? async () => {
              await updateBoardMut({ id: editBoard._id, name: boardName, code: boardCode.toUpperCase() });
              setShowBoardDialog(false); toast.success("Board updated");
            } : handleCreateBoard} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
              {editBoard ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Designation Dialog */}
      <Dialog open={showDesigDialog} onOpenChange={setShowDesigDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">
              {editDesig ? "Edit Designation" : "Create Designation"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[12px]">Name</Label>
              <Input value={desigName} onChange={(e) => setDesigName(e.target.value)} className="h-9 text-[13px]" placeholder="e.g. Senior Manager" />
            </div>
            <div>
              <Label className="text-[12px]">Code</Label>
              <Input value={desigCode} onChange={(e) => setDesigCode(e.target.value)} className="h-9 text-[13px]" placeholder="e.g. SM" />
            </div>
            <Button onClick={editDesig ? async () => {
              await updateDesigMut({ id: editDesig._id, name: desigName, code: desigCode.toUpperCase() });
              setShowDesigDialog(false); toast.success("Designation updated");
            } : handleCreateDesig} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
              {editDesig ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ─── */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#e8710a]" />
              Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-[13px] text-[#5f6368]">
              Are you sure you want to delete{" "}
              <strong className="text-[#1a1a2e]">{deleteConfirm?.name}</strong>?
            </p>
            {deleteConfirm?.warning && (
              <div className="flex items-start gap-2 p-2 bg-[#fef3e2] rounded-md text-[12px] text-[#e8710a]">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{deleteConfirm.warning}</span>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-9 text-[13px] border-[#e8eaed]"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 h-9 text-[13px]"
                onClick={() =>
                  deleteConfirm &&
                  handleDelete(deleteConfirm.type, deleteConfirm.id)
                }
                disabled={!!deleteConfirm?.warning}
              >
                {deleteConfirm?.warning ? "Remove Dependencies First" : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
