/**
 * EmployeeDatabase — Enterprise Employee List (Release 1.1)
 *
 * Features:
 * - Search by name, code, phone
 * - Quick Filters: All, Active, Onboarding, Probation
 * - Advanced Filters: Status, Department, Branch, Designation, Employment Type
 * - Card View / Table View toggle
 * - Batch Selection with bulk actions
 * - Quick Statistics (total, active, onboarding, probation, etc.)
 * - Create Employee dialog (People Registry integration)
 * - Export placeholder
 * - Pagination via employeeEngine.listEmployees
 */

import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import {
  Search, Plus, UsersRound, Filter, ChevronDown, Loader2, UserPlus,
  LayoutGrid, List, Download, SlidersHorizontal, X,
  CheckSquare, Square, ChevronLeft, ChevronRight, Eye,
  FileSpreadsheet, FileDown, FileText, MoreHorizontal,
  Building2, Briefcase, MapPin, BadgeCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ─── Status colors ────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500",
  onboarding: "bg-blue-500",
  probation: "bg-amber-500",
  suspended: "bg-orange-500",
  resigned: "bg-rose-500",
  terminated: "bg-red-600",
  retired: "bg-indigo-500",
  archived: "bg-slate-400",
};

const EMPLOYMENT_TYPE_COLORS: Record<string, string> = {
  permanent: "bg-emerald-100 text-emerald-700",
  contract: "bg-blue-100 text-blue-700",
  part_time: "bg-amber-100 text-amber-700",
  intern: "bg-violet-100 text-violet-700",
  freelancer: "bg-cyan-100 text-cyan-700",
  consultant: "bg-purple-100 text-purple-700",
};

type ViewMode = "card" | "table";

const TABLE_COLUMNS = [
  { id: "name", label: "Employee", sortable: true, width: "min-w-[200px] flex-1" },
  { id: "code", label: "Code", sortable: true, width: "w-[110px]" },
  { id: "department", label: "Department", sortable: true, width: "w-[140px]" },
  { id: "designation", label: "Designation", sortable: true, width: "w-[140px]" },
  { id: "type", label: "Type", sortable: true, width: "w-[100px]" },
  { id: "status", label: "Status", sortable: true, width: "w-[100px]" },
  { id: "actions", label: "", sortable: false, width: "w-[50px]" },
];

const QUICK_FILTERS = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Onboarding", value: "onboarding" },
  { label: "Probation", value: "probation" },
];

// ─── Create Employee Dialog ─────────────────────────────────────────
function CreateEmployeeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const createEmployee = useMutation(api.employeeEngine.createEmployee);

  const [form, setForm] = useState({
    firstName: "", lastName: "", mobile: "", email: "",
    employmentType: "permanent" as string, primaryRole: "employee" as string,
    departmentId: "", designationId: "", branchId: "", companyId: "",
  });
  const [saving, setSaving] = useState(false);

  const departments = useQuery(api.organizationDepartments.listDepartments);
  const designations = useQuery(api.organizationDesignations.listDesignations);
  const branches = useQuery(api.organizationBranches.listBranches);

  const handleSubmit = useCallback(async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.mobile.trim()) return;
    setSaving(true);
    try {
      await createEmployee({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim() || undefined,
        employmentType: form.employmentType as any,
        primaryRole: form.primaryRole as any,
        departmentId: form.departmentId ? form.departmentId as Id<"departments"> : undefined,
        designationId: form.designationId ? form.designationId as Id<"designations"> : undefined,
        branchId: form.branchId ? form.branchId as Id<"branches"> : undefined,
        companyId: form.companyId ? form.companyId as Id<"companies"> : undefined,
        createdByUserId: user?._id as Id<"users"> | undefined,
      });
      onClose();
      setForm({ firstName: "", lastName: "", mobile: "", email: "", employmentType: "permanent", primaryRole: "employee", departmentId: "", designationId: "", branchId: "", companyId: "" });
    } catch (err) {
      console.error("Failed to create employee:", err);
    } finally {
      setSaving(false);
    }
  }, [form, user, createEmployee, onClose]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-500" />
            Create New Employee
          </DialogTitle>
          <DialogDescription>
            Creates a Person in the Global People Registry and an Employee record with employment details.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2 sm:col-span-1">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">First Name *</label>
            <Input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="First name" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Last Name *</label>
            <Input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} placeholder="Last name" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Mobile *</label>
            <Input value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))} placeholder="Phone number" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
            <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email address" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Employment Type</label>
            <Select value={form.employmentType} onValueChange={(v) => setForm((f) => ({ ...f, employmentType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="part_time">Part Time</SelectItem>
                <SelectItem value="intern">Intern</SelectItem>
                <SelectItem value="freelancer">Freelancer</SelectItem>
                <SelectItem value="consultant">Consultant</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Department</label>
            <Select value={form.departmentId} onValueChange={(v) => setForm((f) => ({ ...f, departmentId: v }))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {(departments || []).map((d: any) => (
                  <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Designation</label>
            <Select value={form.designationId} onValueChange={(v) => setForm((f) => ({ ...f, designationId: v }))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {(designations || []).map((d: any) => (
                  <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Branch</label>
            <Select value={form.branchId} onValueChange={(v) => setForm((f) => ({ ...f, branchId: v }))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {(branches || []).map((b: any) => (
                  <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Primary Role</label>
            <Select value={form.primaryRole} onValueChange={(v) => setForm((f) => ({ ...f, primaryRole: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="department_head">Dept Head</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.firstName || !form.lastName || !form.mobile}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Create Employee
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Employee Database Page ─────────────────────────────────────
export default function EmployeeDatabase() {
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [searchTerm, setSearchTerm] = useState("");
  const [quickFilter, setQuickFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [branchFilter, setBranchFilter] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Pagination
  const [cursor, setCursor] = useState<string | null>(null);
  const [prevCursors, setPrevCursors] = useState<string[]>([]);

  const employeesResult = useQuery(api.employeeEngine.listEmployees, {
    paginationOpts: { cursor: cursor, numItems: 30 },
    status: (statusFilter || quickFilter) as any || undefined,
    search: searchTerm || undefined,
    departmentId: departmentFilter ? departmentFilter as Id<"departments"> : undefined,
    branchId: branchFilter ? branchFilter as Id<"branches"> : undefined,
  });

  const departments = useQuery(api.organizationDepartments.listDepartments);
  const branches = useQuery(api.organizationBranches.listBranches);
  const stats = useQuery(api.employeeEngine.getEmployeeStats);

  const employees = (employeesResult?.items || []) as any[];
  const allIds = useMemo(() => employees.map((s: any) => s._id), [employees]);
  const allSelected = selectedIds.size > 0 && selectedIds.size === allIds.length;

  const statCards = [
    { label: "Total", value: stats?.total ?? employees.length, color: "bg-blue-500" },
    { label: "Active", value: stats?.active ?? 0, color: "bg-emerald-500" },
    { label: "Onboarding", value: stats?.onboarding ?? 0, color: "bg-violet-500" },
    { label: "Probation", value: stats?.probation ?? 0, color: "bg-amber-500" },
    { label: "Permanent", value: stats?.permanent ?? 0, color: "bg-indigo-500" },
    { label: "Contract", value: stats?.contract ?? 0, color: "bg-cyan-500" },
  ];

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };
  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(allIds));
  };
  const clearSelection = () => setSelectedIds(new Set());

  const handlePrevPage = () => {
    const prev = prevCursors.pop();
    setPrevCursors([...prevCursors]);
    setCursor(prev || null);
  };
  const handleNextPage = () => {
    if (employeesResult?.hasMore && employeesResult?.nextCursor) {
      setPrevCursors([...prevCursors, cursor]);
      setCursor(employeesResult.nextCursor);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employees</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage employee records, employment, and organizational structure
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border/50 rounded-md overflow-hidden">
            <button onClick={() => setViewMode("card")} className={cn("p-1.5 transition-colors", viewMode === "card" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setViewMode("table")} className={cn("p-1.5 transition-colors", viewMode === "table" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs">
              <DropdownMenuItem><FileSpreadsheet className="h-3.5 w-3.5 mr-2" />Export CSV</DropdownMenuItem>
              <DropdownMenuItem><FileDown className="h-3.5 w-3.5 mr-2" />Export Excel</DropdownMenuItem>
              <DropdownMenuItem><FileText className="h-3.5 w-3.5 mr-2" />Export PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {statCards.map((s) => (
          <Card key={s.label} className="p-2.5 flex items-center gap-2">
            <div className={`w-7 h-7 rounded-md ${s.color} flex items-center justify-center shrink-0`}>
              <UsersRound className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold">{s.value.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground truncate">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {QUICK_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setQuickFilter(f.value); setStatusFilter(""); }}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
              (quickFilter === f.value && !statusFilter)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-accent/30 text-muted-foreground border-border/40 hover:border-border hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
        <div className="w-px h-4 bg-border mx-1" />
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={cn(
            "px-2 py-1 rounded-full text-xs font-medium transition-colors border flex items-center gap-1",
            showAdvancedFilters ? "bg-accent text-foreground border-border" : "bg-transparent text-muted-foreground border-border/40 hover:border-border hover:text-foreground",
          )}
        >
          <SlidersHorizontal className="h-3 w-3" />
          Filters
          {(statusFilter || departmentFilter || branchFilter) && <Badge className="ml-1 h-3.5 w-3.5 p-0 text-[8px] bg-primary text-primary-foreground rounded-full flex items-center justify-center">!</Badge>}
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Card className="p-3 border-border/40 bg-accent/20">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-7 w-[130px] text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">All</SelectItem>
                  {["active", "onboarding", "probation", "suspended", "resigned", "terminated", "retired", "archived"].map((s) => (
                    <SelectItem key={s} value={s}><span className="capitalize">{s}</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-muted-foreground">Department</label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="h-7 w-[150px] text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">All</SelectItem>
                  {(departments || []).map((d: any) => (
                    <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-muted-foreground">Branch</label>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="h-7 w-[130px] text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">All</SelectItem>
                  {(branches || []).map((b: any) => (
                    <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(statusFilter || departmentFilter || branchFilter) && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => { setStatusFilter(""); setDepartmentFilter(""); setBranchFilter(""); }}>
                <X className="h-3 w-3" />Clear
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Search & Batch Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9 h-9" placeholder="Search by name, code, or phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="text-xs text-muted-foreground">{employees.length} employee{employees.length !== 1 ? "s" : ""}</div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{selectedIds.size} selected</Badge>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={clearSelection}><X className="h-3 w-3" />Clear</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><MoreHorizontal className="h-3 w-3" />Bulk</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuItem>Export Selected</DropdownMenuItem>
                <DropdownMenuItem>Change Department</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Archive Selected</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Loading */}
      {!employeesResult ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : employees.length === 0 ? (
        <Card className="p-8 text-center">
          <UsersRound className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-foreground mb-1">No employees found</h3>
          <p className="text-xs text-muted-foreground">{searchTerm ? "Try a different search term" : "Create your first employee to get started"}</p>
        </Card>
      ) : viewMode === "card" ? (
        /* ── Card View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {employees.map((emp: any) => {
            const initials = (emp.personName || "??").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
            const statusColor = STATUS_COLORS[emp.status] || "bg-slate-400";
            const typeColor = EMPLOYMENT_TYPE_COLORS[emp.employmentType] || "bg-slate-100";

            return (
              <Card key={emp._id} className={cn("p-3 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group", selectedIds.has(emp._id) && "ring-2 ring-primary/30")}>
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={selectedIds.has(emp._id)} onCheckedChange={() => toggleSelect(emp._id)} onClick={(e) => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="text-xs bg-[#1a1a2e] text-white">{initials}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="min-w-0 flex-1" onClick={() => navigate(`/employees/${emp._id}`)}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">{emp.personName}</p>
                      <Badge className={`text-[10px] px-1.5 py-0 h-4 text-white ${statusColor}`}>{emp.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                      <span className="font-mono">{emp.employeeCode}</span>
                      <Badge variant="outline" className={`text-[9px] px-1 py-0 h-3.5 ${typeColor}`}>{emp.employmentType?.replace(/_/g, " ")}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                      {emp.departmentName && <span>{emp.departmentName}</span>}
                      {emp.designationName && <><span>•</span><span>{emp.designationName}</span></>}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-xs">
                      <DropdownMenuItem onClick={() => navigate(`/employees/${emp._id}`)}>
                        <Eye className="h-3.5 w-3.5 mr-2" />Open Workspace
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* ── Table View ── */
        <div className="border border-border/40 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-accent/30 border-b border-border/40">
                <tr>
                  <th className="p-3 text-left w-[40px]"><Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} /></th>
                  {TABLE_COLUMNS.map((col) => (<th key={col.id} className={cn("p-3 text-left font-medium text-muted-foreground", col.width)}>{col.label}</th>))}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp: any) => {
                  const statusColor = STATUS_COLORS[emp.status] || "bg-slate-400";
                  const typeColor = EMPLOYMENT_TYPE_COLORS[emp.employmentType] || "bg-slate-100";
                  const initials = (emp.personName || "??").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

                  return (
                    <tr key={emp._id} className={cn("border-b border-border/20 hover:bg-accent/20 transition-colors cursor-pointer", selectedIds.has(emp._id) && "bg-accent/30")} onClick={() => navigate(`/employees/${emp._id}`)}>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selectedIds.has(emp._id)} onCheckedChange={() => toggleSelect(emp._id)} />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="text-[9px] bg-[#1a1a2e] text-white">{initials}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground truncate">{emp.personName}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-muted-foreground">{emp.employeeCode}</td>
                      <td className="p-3 text-muted-foreground">{emp.departmentName || "—"}</td>
                      <td className="p-3 text-muted-foreground">{emp.designationName || "—"}</td>
                      <td className="p-3">
                        <Badge variant="outline" className={cn("text-[9px] px-1 py-0 h-3.5 font-normal", typeColor)}>{emp.employmentType?.replace(/_/g, " ")}</Badge>
                      </td>
                      <td className="p-3"><Badge className={`text-[10px] px-1.5 py-0 h-4 text-white ${statusColor}`}>{emp.status}</Badge></td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="icon" className="h-6 w-6"><ChevronRight className="h-3.5 w-3.5" /></Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-border/30 bg-accent/10">
            <span className="text-[11px] text-muted-foreground">{employees.length} employees loaded</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" disabled={prevCursors.length === 0} onClick={handlePrevPage}><ChevronLeft className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" disabled={!employeesResult?.hasMore} onClick={handleNextPage}><ChevronRight className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        </div>
      )}

      <CreateEmployeeDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} />
    </div>
  );
}
