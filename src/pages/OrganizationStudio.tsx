import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  Archive,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { Doc } from "@/convex/_generated/dataModel";

function TreeItem({
  label,
  type,
  count,
  defaultOpen = false,
  children,
}: {
  label: string;
  type: string;
  count?: number;
  defaultOpen?: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-[#f1f3f4] rounded-md text-[13px] text-[#1a1a2e] group"
      >
        {children ? (
          open ? (
            <ChevronDown className="h-3 w-3 text-[#9aa0a6] shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-[#9aa0a6] shrink-0" />
          )
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <span className="text-[11px] font-medium text-[#5f6368] uppercase tracking-wider shrink-0">{type}</span>
        <span className="text-[13px] font-medium truncate">{label}</span>
        {count !== undefined && (
          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-[#f1f3f4] text-[#5f6368]">
            {count}
          </Badge>
        )}
      </button>
      {open && children && <div className="ml-4 border-l border-[#e8eaed]">{children}</div>}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <p className="text-[13px] text-[#9aa0a6]">{message}</p>
    </div>
  );
}

export default function OrganizationStudio() {
  const { user } = useAuth();
  const isCEO = user?.role === "super_admin";

  const departments = useQuery(api.organization.listDepartments);
  const teams = useQuery(api.organization.listTeams);
  const branches = useQuery(api.organization.listBranches);
  const verticals = useQuery(api.organization.listVerticals);
  const subVerticals = useQuery(api.organization.listSubVerticals, {});
  const boardsData = useQuery(api.organization.listBoards, {});
  const designations = useQuery(api.organization.listDesignations);
  const companies = useQuery(api.organization.listCompanies);
  const users = useQuery(api.users.listUsers);

  const createDept = useMutation(api.organization.createDepartment);
  const createTeam = useMutation(api.organization.createTeam);
  const createBranch = useMutation(api.organization.createBranch);
  const createVertical = useMutation(api.organization.createVertical);
  const updateVertical = useMutation(api.organization.updateVertical);
  const deleteVertical = useMutation(api.organization.deleteVertical);
  const createSubVertical = useMutation(api.organization.createSubVertical);
  const updateSubVertical = useMutation(api.organization.updateSubVertical);
  const deleteSubVertical = useMutation(api.organization.deleteSubVertical);
  const createBoard = useMutation(api.organization.createBoard);
  const updateBoardMut = useMutation(api.organization.updateBoard);
  const deleteBoard = useMutation(api.organization.deleteBoard);
  const createDesig = useMutation(api.organization.createDesignation);

  const [showDeptDialog, setShowDeptDialog] = useState(false);
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [showBranchDialog, setShowBranchDialog] = useState(false);
  const [showVertDialog, setShowVertDialog] = useState(false);
  const [showDesigDialog, setShowDesigDialog] = useState(false);

  // Vertical CRUD state
  const [vertName, setVertName] = useState("");
  const [vertCode, setVertCode] = useState("");
  const [vertDesc, setVertDesc] = useState("");
  const [editVertical, setEditVertical] = useState<any>(null);

  // Sub Vertical CRUD state
  const [showSubVertDialog, setShowSubVertDialog] = useState(false);
  const [editSubVert, setEditSubVert] = useState<any>(null);
  const [subVertName, setSubVertName] = useState("");
  const [subVertCode, setSubVertCode] = useState("");
  const [subVertVerticalId, setSubVertVerticalId] = useState("");
  const [subVertDesc, setSubVertDesc] = useState("");

  // Board CRUD state
  const [showBoardDialog, setShowBoardDialog] = useState(false);
  const [editBoard, setEditBoard] = useState<any>(null);
  const [boardName, setBoardName] = useState("");
  const [boardCode, setBoardCode] = useState("");
  const [boardSubVerticalId, setBoardSubVerticalId] = useState("");
  const [boardVerticalId, setBoardVerticalId] = useState("");
  const [boardDesc, setBoardDesc] = useState("");

  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [teamDept, setTeamDept] = useState("");
  const [branchName, setBranchName] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [desigName, setDesigName] = useState("");
  const [desigCode, setDesigCode] = useState("");

  const handleCreateDept = async () => {
    if (!deptName || !deptCode) return;
    await createDept({ name: deptName, code: deptCode.toUpperCase() });
    setDeptName("");
    setDeptCode("");
    setShowDeptDialog(false);
  };

  const handleCreateTeam = async () => {
    if (!teamName || !teamCode || !teamDept) return;
    await createTeam({ name: teamName, code: teamCode.toUpperCase(), departmentId: teamDept as any });
    setTeamName("");
    setTeamCode("");
    setShowTeamDialog(false);
  };

  const handleCreateBranch = async () => {
    if (!branchName || !branchCode) return;
    await createBranch({ name: branchName, code: branchCode.toUpperCase() });
    setBranchName("");
    setBranchCode("");
    setShowBranchDialog(false);
  };

  const handleCreateVertical = async () => {
    if (!vertName || !vertCode) return;
    if (editVertical) {
      await updateVertical({ id: editVertical._id, name: vertName, code: vertCode.toUpperCase(), description: vertDesc || undefined });
    } else {
      await createVertical({ name: vertName, code: vertCode.toUpperCase(), description: vertDesc || undefined });
    }
    setVertName("");
    setVertCode("");
    setVertDesc("");
    setEditVertical(null);
    setShowVertDialog(false);
  };

  const handleDeleteVertical = async (id: string) => {
    await deleteVertical({ id: id as any });
  };

  const handleCreateSubVert = async () => {
    if (!subVertName || !subVertCode || !subVertVerticalId) return;
    if (editSubVert) {
      await updateSubVertical({ id: editSubVert._id, name: subVertName, code: subVertCode.toUpperCase(), description: subVertDesc || undefined });
    } else {
      await createSubVertical({ name: subVertName, code: subVertCode.toUpperCase(), verticalId: subVertVerticalId as any, description: subVertDesc || undefined });
    }
    setSubVertName("");
    setSubVertCode("");
    setSubVertVerticalId("");
    setSubVertDesc("");
    setEditSubVert(null);
    setShowSubVertDialog(false);
  };

  const handleDeleteSubVert = async (id: string) => {
    await deleteSubVertical({ id: id as any });
  };

  const handleCreateBoardItem = async () => {
    if (!boardName || !boardCode) return;
    if (editBoard) {
      await updateBoardMut({ id: editBoard._id, name: boardName, code: boardCode.toUpperCase(), description: boardDesc || undefined });
    } else {
      await createBoard({ name: boardName, code: boardCode.toUpperCase(), subVerticalId: boardSubVerticalId as any || undefined, verticalId: boardVerticalId as any || undefined, description: boardDesc || undefined });
    }
    setBoardName("");
    setBoardCode("");
    setBoardSubVerticalId("");
    setBoardVerticalId("");
    setBoardDesc("");
    setEditBoard(null);
    setShowBoardDialog(false);
  };

  const handleDeleteBoardItem = async (id: string) => {
    await deleteBoard({ id: id as any });
  };

  const handleCreateDesig = async () => {
    if (!desigName || !desigCode) return;
    await createDesig({ name: desigName, code: desigCode.toUpperCase(), status: "active" });
    setDesigName("");
    setDesigCode("");
    setShowDesigDialog(false);
  };

  const getTeamCount = (deptId: string) => teams?.filter((t) => t.departmentId === deptId).length || 0;
  const getUserCount = (deptId?: string) => users?.filter((u) => u.departmentId === deptId && !u.isDisabled).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e]">Organization Studio</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">Manage your organizational structure</p>
        </div>
      </div>

      <Tabs defaultValue="structure" className="space-y-4">
        <TabsList className="bg-[#f1f3f4] p-0.5">
          <TabsTrigger value="structure" className="text-[12px] data-[state=active]:bg-white">Structure</TabsTrigger>
          <TabsTrigger value="departments" className="text-[12px] data-[state=active]:bg-white">Departments</TabsTrigger>
          <TabsTrigger value="teams" className="text-[12px] data-[state=active]:bg-white">Teams</TabsTrigger>
          <TabsTrigger value="branches" className="text-[12px] data-[state=active]:bg-white">Branches</TabsTrigger>
          <TabsTrigger value="verticals" className="text-[12px] data-[state=active]:bg-white">Verticals</TabsTrigger>
          <TabsTrigger value="sub-verticals" className="text-[12px] data-[state=active]:bg-white">Sub Verticals</TabsTrigger>
          <TabsTrigger value="boards" className="text-[12px] data-[state=active]:bg-white">Boards</TabsTrigger>
          <TabsTrigger value="designations" className="text-[12px] data-[state=active]:bg-white">Designations</TabsTrigger>
        </TabsList>

        {/* Structure Tree View */}
        <TabsContent value="structure">
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Organization Tree</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <TreeItem label="Veda EdTech" type="GROUP" defaultOpen>
                  <TreeItem label="Governance" type="HIERARCHY">
                    <TreeItem label="Departments" type="">
                      {(departments || []).map((dept) => (
                        <TreeItem
                          key={dept._id}
                          label={dept.name}
                          type="DEPT"
                          count={getTeamCount(dept._id)}
                        >
                          {(teams || [])
                            .filter((t) => t.departmentId === dept._id)
                            .map((team) => (
                              <TreeItem
                                key={team._id}
                                label={team.name}
                                type="TEAM"
                                count={getUserCount(dept._id)}
                              />
                            ))}
                        </TreeItem>
                      ))}
                    </TreeItem>
                  </TreeItem>

                  <TreeItem label="Academic" type="HIERARCHY">
                    <TreeItem label="Verticals" type="">
                      {(verticals || []).map((v: any) => (
                        <TreeItem key={v._id} label={v.name} type="VERTICAL" defaultOpen>
                          {(subVerticals || [])
                            .filter((sv) => sv.verticalId === v._id)
                            .map((sv) => (
                              <TreeItem key={sv._id} label={sv.name} type="SUB V" defaultOpen>
                                {(boardsData || [])
                                  .filter((b) => b.subVerticalId === sv._id)
                                  .map((b: any) => (
                                    <TreeItem key={b._id} label={b.name} type="BOARD" />
                                  ))}
                              </TreeItem>
                            ))}
                        </TreeItem>
                      ))}
                    </TreeItem>
                  </TreeItem>

                  <TreeItem label="Branches" type="ENTITY">
                    {(branches || []).map((b: any) => (
                      <TreeItem key={b._id} label={b.name} type="BRANCH" />
                    ))}
                  </TreeItem>

                  <TreeItem label="Designations" type="ENTITY">
                    {(designations || []).map((d: any) => (
                      <TreeItem key={d._id} label={`${d.name} (${d.code})`} type="ROLE" />
                    ))}
                  </TreeItem>
                </TreeItem>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments">
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Departments</CardTitle>
              {isCEO && (
                <Dialog open={showDeptDialog} onOpenChange={setShowDeptDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Department
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-base">Create Department</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-[12px]">Name</Label>
                        <Input value={deptName} onChange={(e) => setDeptName(e.target.value)} className="h-9 text-[13px]" placeholder="e.g. Finance" />
                      </div>
                      <div>
                        <Label className="text-[12px]">Code</Label>
                        <Input value={deptCode} onChange={(e) => setDeptCode(e.target.value)} className="h-9 text-[13px]" placeholder="e.g. FIN" />
                      </div>
                      <Button onClick={handleCreateDept} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">Create</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {!departments?.length ? (
                <EmptyState message="No departments yet" />
              ) : (
                <div className="space-y-1">
                  {departments.map((dept) => (
                    <div key={dept._id} className="flex items-center justify-between p-2.5 rounded-md hover:bg-[#f8f9fa] border border-transparent hover:border-[#e8eaed] transition-all">
                      <div className="flex items-center gap-2.5">
                        <Building2 className="h-4 w-4 text-[#5f6368]" />
                        <div>
                          <p className="text-[13px] font-medium text-[#1a1a2e]">{dept.name}</p>
                          <p className="text-[11px] text-[#9aa0a6]">Code: {dept.code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] bg-[#f1f3f4] text-[#5f6368]">
                          {getTeamCount(dept._id)} teams
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams">
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Teams</CardTitle>
              {isCEO && (
                <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Team
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-base">Create Team</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-[12px]">Name</Label>
                        <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} className="h-9 text-[13px]" placeholder="e.g. Engineering" />
                      </div>
                      <div>
                        <Label className="text-[12px]">Code</Label>
                        <Input value={teamCode} onChange={(e) => setTeamCode(e.target.value)} className="h-9 text-[13px]" placeholder="e.g. ENG" />
                      </div>
                      <div>
                        <Label className="text-[12px]">Department</Label>
                        <Select value={teamDept} onValueChange={setTeamDept}>
                          <SelectTrigger className="h-9 text-[13px]">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments?.map((d: any) => (
                              <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleCreateTeam} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">Create</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {!teams?.length ? (
                <EmptyState message="No teams yet" />
              ) : (
                <div className="space-y-1">
                  {teams.map((team) => {
                    const dept = departments?.find((d: any) => d._id === team.departmentId);
                    return (
                      <div key={team._id} className="flex items-center justify-between p-2.5 rounded-md hover:bg-[#f8f9fa] border border-transparent hover:border-[#e8eaed] transition-all">
                        <div className="flex items-center gap-2.5">
                          <Layers className="h-4 w-4 text-[#5f6368]" />
                          <div>
                            <p className="text-[13px] font-medium text-[#1a1a2e]">{team.name}</p>
                            <p className="text-[11px] text-[#9aa0a6]">{dept?.name} · {team.code}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branches Tab */}
        <TabsContent value="branches">
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Branches</CardTitle>
              {isCEO && (
                <Dialog open={showBranchDialog} onOpenChange={setShowBranchDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Branch
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-base">Create Branch</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-[12px]">Name</Label>
                        <Input value={branchName} onChange={(e) => setBranchName(e.target.value)} className="h-9 text-[13px]" placeholder="e.g. North Province" />
                      </div>
                      <div>
                        <Label className="text-[12px]">Code</Label>
                        <Input value={branchCode} onChange={(e) => setBranchCode(e.target.value)} className="h-9 text-[13px]" placeholder="e.g. NP" />
                      </div>
                      <Button onClick={handleCreateBranch} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">Create</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {!branches?.length ? (
                <EmptyState message="No branches yet" />
              ) : (
                <div className="space-y-1">
                  {branches.map((branch) => (
                    <div key={branch._id} className="flex items-center justify-between p-2.5 rounded-md hover:bg-[#f8f9fa] border border-transparent hover:border-[#e8eaed] transition-all">
                      <div className="flex items-center gap-2.5">
                        <GitBranch className="h-4 w-4 text-[#5f6368]" />
                        <div>
                          <p className="text-[13px] font-medium text-[#1a1a2e]">{branch.name}</p>
                          <p className="text-[11px] text-[#9aa0a6]">Code: {branch.code}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verticals Tab */}
        <TabsContent value="verticals">
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Verticals</CardTitle>
              {isCEO && (
                <Button size="sm" className="h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={() => {
                  setEditVertical(null); setVertName(""); setVertCode(""); setVertDesc(""); setShowVertDialog(true);
                }}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Vertical
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!verticals?.length ? (
                <EmptyState message="No verticals yet" />
              ) : (
                <div className="space-y-1">
                  {verticals.map((v: any) => (
                    <div key={v._id} className="flex items-center justify-between p-2.5 rounded-md hover:bg-[#f8f9fa] border border-transparent hover:border-[#e8eaed] transition-all">
                      <div className="flex items-center gap-2.5">
                        <GraduationCap className="h-4 w-4 text-[#5f6368]" />
                        <div>
                          <p className="text-[13px] font-medium text-[#1a1a2e]">{v.name}</p>
                          <p className="text-[11px] text-[#9aa0a6]">{v.code}{v.description ? ` · ${v.description}` : ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[#5f6368] hover:text-[#1a73e8]"
                          onClick={() => { setEditVertical(v); setVertName(v.name); setVertCode(v.code); setVertDesc(v.description || ""); setShowVertDialog(true); }}>
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[#5f6368] hover:text-[#e8710a]"
                          onClick={() => handleDeleteVertical(v._id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {/* Vertical Dialog */}
          <Dialog open={showVertDialog} onOpenChange={setShowVertDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-base">{editVertical ? "Edit Vertical" : "Create Vertical"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-[12px]">Name</Label>
                  <Input value={vertName} onChange={(e) => setVertName(e.target.value)} className="h-9 text-[13px]" placeholder="e.g. School" />
                </div>
                <div>
                  <Label className="text-[12px]">Code</Label>
                  <Input value={vertCode} onChange={(e) => setVertCode(e.target.value)} className="h-9 text-[13px]" placeholder="e.g. SCH" />
                </div>
                <div>
                  <Label className="text-[12px]">Description</Label>
                  <Input value={vertDesc} onChange={(e) => setVertDesc(e.target.value)} className="h-9 text-[13px]" placeholder="Optional description" />
                </div>
                <Button onClick={handleCreateVertical} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">{editVertical ? "Update" : "Create"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Sub Verticals Tab */}
        <TabsContent value="sub-verticals">
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Sub Verticals</CardTitle>
              {isCEO && (
                <Button size="sm" className="h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={() => {
                  setEditSubVert(null); setSubVertName(""); setSubVertCode(""); setSubVertVerticalId(""); setSubVertDesc(""); setShowSubVertDialog(true);
                }}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Sub Vertical
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!subVerticals?.length ? (
                <EmptyState message="No sub-verticals yet" />
              ) : (
                <div className="space-y-1">
                  {subVerticals.map((sv) => {
                    const vert = verticals?.find((v: any) => v._id === sv.verticalId);
                    return (
                      <div key={sv._id} className="flex items-center justify-between p-2.5 rounded-md hover:bg-[#f8f9fa] border border-transparent hover:border-[#e8eaed] transition-all">
                        <div className="flex items-center gap-2.5">
                          <Layers className="h-4 w-4 text-[#5f6368]" />
                          <div>
                            <p className="text-[13px] font-medium text-[#1a1a2e]">{sv.name}</p>
                            <p className="text-[11px] text-[#9aa0a6]">{vert?.name || "—"} · {sv.code}{sv.description ? ` · ${sv.description}` : ""}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[#5f6368] hover:text-[#1a73e8]"
                            onClick={() => { setEditSubVert(sv); setSubVertName(sv.name); setSubVertCode(sv.code); setSubVertVerticalId(sv.verticalId); setSubVertDesc(sv.description || ""); setShowSubVertDialog(true); }}>
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[#5f6368] hover:text-[#e8710a]"
                            onClick={() => handleDeleteSubVert(sv._id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          <Dialog open={showSubVertDialog} onOpenChange={setShowSubVertDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-base">{editSubVert ? "Edit Sub Vertical" : "Create Sub Vertical"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-[12px]">Name</Label>
                  <Input value={subVertName} onChange={(e) => setSubVertName(e.target.value)} className="h-9 text-[13px]" placeholder="e.g. CBSE" />
                </div>
                <div>
                  <Label className="text-[12px]">Code</Label>
                  <Input value={subVertCode} onChange={(e) => setSubVertCode(e.target.value)} className="h-9 text-[13px]" placeholder="e.g. CBSE" />
                </div>
                <div>
                  <Label className="text-[12px]">Vertical</Label>
                  <Select value={subVertVerticalId} onValueChange={setSubVertVerticalId}>
                    <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Select vertical" /></SelectTrigger>
                    <SelectContent>
                      {(verticals || []).map((v: any) => <SelectItem key={v._id} value={v._id}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[12px]">Description</Label>
                  <Input value={subVertDesc} onChange={(e) => setSubVertDesc(e.target.value)} className="h-9 text-[13px]" placeholder="Optional description" />
                </div>
                <Button onClick={handleCreateSubVert} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
                  disabled={!subVertName || !subVertCode || !subVertVerticalId}>
                  {editSubVert ? "Update" : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Boards Tab */}
        <TabsContent value="boards">
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Boards</CardTitle>
              {isCEO && (
                <Button size="sm" className="h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={() => {
                  setEditBoard(null); setBoardName(""); setBoardCode(""); setBoardSubVerticalId(""); setBoardVerticalId(""); setBoardDesc(""); setShowBoardDialog(true);
                }}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Board
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!boardsData?.length ? (
                <EmptyState message="No boards yet" />
              ) : (
                <div className="space-y-1">
                  {boardsData.map((b: any) => {
                    const sv = subVerticals?.find((s: any) => s._id === b.subVerticalId);
                    const vert = verticals?.find((v: any) => v._id === (b.verticalId || sv?.verticalId));
                    return (
                      <div key={b._id} className="flex items-center justify-between p-2.5 rounded-md hover:bg-[#f8f9fa] border border-transparent hover:border-[#e8eaed] transition-all">
                        <div className="flex items-center gap-2.5">
                          <Hash className="h-4 w-4 text-[#5f6368]" />
                          <div>
                            <p className="text-[13px] font-medium text-[#1a1a2e]">{b.name}</p>
                            <p className="text-[11px] text-[#9aa0a6]">{sv?.name || "—"} · {vert?.name || "—"} · {b.code}{b.description ? ` · ${b.description}` : ""}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[#5f6368] hover:text-[#1a73e8]"
                            onClick={() => { setEditBoard(b); setBoardName(b.name); setBoardCode(b.code); setBoardSubVerticalId(b.subVerticalId || ""); setBoardVerticalId(b.verticalId || ""); setBoardDesc(b.description || ""); setShowBoardDialog(true); }}>
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[#5f6368] hover:text-[#e8710a]"
                            onClick={() => handleDeleteBoardItem(b._id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          <Dialog open={showBoardDialog} onOpenChange={setShowBoardDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-base">{editBoard ? "Edit Board" : "Create Board"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-[12px]">Name</Label>
                  <Input value={boardName} onChange={(e) => setBoardName(e.target.value)} className="h-9 text-[13px]" placeholder="e.g. CBSE" />
                </div>
                <div>
                  <Label className="text-[12px]">Code</Label>
                  <Input value={boardCode} onChange={(e) => setBoardCode(e.target.value)} className="h-9 text-[13px]" placeholder="e.g. CBSE" />
                </div>
                <div>
                  <Label className="text-[12px]">Sub Vertical</Label>
                  <Select value={boardSubVerticalId} onValueChange={setBoardSubVerticalId}>
                    <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Select sub-vertical" /></SelectTrigger>
                    <SelectContent>
                      {(subVerticals || []).map((sv) => <SelectItem key={sv._id} value={sv._id}>{sv.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[12px]">Description</Label>
                  <Input value={boardDesc} onChange={(e) => setBoardDesc(e.target.value)} className="h-9 text-[13px]" placeholder="Optional description" />
                </div>
                <Button onClick={handleCreateBoardItem} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
                  disabled={!boardName || !boardCode}>
                  {editBoard ? "Update" : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Designations Tab */}
        <TabsContent value="designations">
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Designations</CardTitle>
              {isCEO && (
                <Dialog open={showDesigDialog} onOpenChange={setShowDesigDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Designation
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-base">Create Designation</DialogTitle>
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
                      <Button onClick={handleCreateDesig} className="w-full h-9 text-[13px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">Create</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {!designations?.length ? (
                <EmptyState message="No designations yet" />
              ) : (
                <div className="space-y-1">
                  {designations.map((d: any) => (
                    <div key={d._id} className="flex items-center justify-between p-2.5 rounded-md hover:bg-[#f8f9fa] border border-transparent hover:border-[#e8eaed] transition-all">
                      <div className="flex items-center gap-2.5">
                        <Hash className="h-4 w-4 text-[#5f6368]" />
                        <div>
                          <p className="text-[13px] font-medium text-[#1a1a2e]">{d.name}</p>
                          <p className="text-[11px] text-[#9aa0a6]">{d.code} · {d.status}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
