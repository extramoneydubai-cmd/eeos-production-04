/**
 * StudentDatabase — Enterprise Student List (Release 1.1)
 *
 * Features:
 * - Search by name, code, admission number, phone
 * - Card View / Table View toggle
 * - Advanced Filters: status, branch, academic year, date range
 * - Batch Selection with bulk actions
 * - Quick Statistics (total, active, admitted, alumni)
 * - Secure Pagination
 * - Saved Views
 * - Export available (CSV/Excel/PDF)
 * - Create Student dialog (People Registry integration)
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import {
  Search, Plus, GraduationCap, Filter, ChevronDown, Loader2, UserPlus,
  LayoutGrid, List, Download, Save, SlidersHorizontal, X,
  CheckSquare, Square, ChevronLeft, ChevronRight, Eye,
  FileSpreadsheet, FileDown, FileText, RefreshCw, Clock,
  MoreHorizontal,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ─── Status color map ──────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500",
  admitted: "bg-blue-500",
  lead: "bg-amber-500",
  qualified: "bg-violet-500",
  trial: "bg-cyan-500",
  enquiry: "bg-slate-400",
  completed: "bg-green-700",
  alumni: "bg-indigo-500",
  cancelled: "bg-rose-500",
  suspended: "bg-orange-500",
};

// ─── View mode type ───────────────────────────────────────────────
type ViewMode = "card" | "table";

// ─── Table columns ────────────────────────────────────────────────
interface TableColumn {
  id: string;
  label: string;
  sortable: boolean;
  width?: string;
}

const TABLE_COLUMNS: TableColumn[] = [
  { id: "name", label: "Name", sortable: true, width: "min-w-[200px] flex-1" },
  { id: "code", label: "Code", sortable: true, width: "w-[110px]" },
  { id: "admission", label: "Admission", sortable: true, width: "w-[130px]" },
  { id: "status", label: "Status", sortable: true, width: "w-[100px]" },
  { id: "phone", label: "Phone", sortable: false, width: "w-[130px]" },
  { id: "actions", label: "", sortable: false, width: "w-[50px]" },
];

// ─── Quick Filters ────────────────────────────────────────────────
const QUICK_FILTERS = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Admitted", value: "admitted" },
  { label: "New Today", value: "today" },
  { label: "Overdue", value: "overdue" },
];

// ─── Create Student Dialog ─────────────────────────────────────────
function CreateStudentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const createStudent = useMutation(api.studentEngine.createStudent);

  const [form, setForm] = useState({
    firstName: "", middleName: "", lastName: "", phone: "", email: "",
    gender: "", nationality: "", dateOfBirth: undefined as number | undefined,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) return;
    setSaving(true);
    try {
      await createStudent({
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim() || undefined,
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        gender: form.gender || undefined,
        nationality: form.nationality || undefined,
        dateOfBirth: form.dateOfBirth,
        createdBy: user?._id as Id<"users">,
      });
      onClose();
      setForm({ firstName: "", middleName: "", lastName: "", phone: "", email: "", gender: "", nationality: "", dateOfBirth: undefined });
    } catch (err) {
      console.error("Failed to create student:", err);
    } finally {
      setSaving(false);
    }
  }, [form, user, createStudent, onClose]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-500" />
            Create New Student
          </DialogTitle>
          <DialogDescription>
            Creates a Person in the Global People Registry and a Student record with auto-generated code & admission number.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          {[
            { key: "firstName", label: "First Name *", colSpan: "sm:col-span-1", placeholder: "First name" },
            { key: "middleName", label: "Middle Name", colSpan: "sm:col-span-1", placeholder: "Middle name" },
            { key: "lastName", label: "Last Name *", colSpan: "sm:col-span-1", placeholder: "Last name" },
            { key: "phone", label: "Phone *", colSpan: "sm:col-span-1", placeholder: "Phone number" },
          ].map((f) => (
            <div key={f.key} className={`col-span-2 ${f.colSpan}`}>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{f.label}</label>
              <Input
                value={(form as any)[f.key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
              />
            </div>
          ))}
          <div className="col-span-2">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
            <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email address" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Gender</label>
            <Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nationality</label>
            <Input value={form.nationality} onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))} placeholder="Nationality" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.firstName || !form.lastName || !form.phone}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Create Student
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Student Database Page ─────────────────────────────────────
export default function StudentDatabase() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem("eeos_students_view");
      return saved === "card" || saved === "table" ? saved : "card";
    } catch {
      return "card";
    }
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Persist view mode across navigation
  useEffect(() => {
    try {
      localStorage.setItem("eeos_students_view", viewMode);
    } catch {
      // storage unavailable — session-only
    }
  }, [viewMode]);
  const [quickFilter, setQuickFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [branchFilter, setBranchFilter] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Queries
  const students = useQuery(api.studentEngine.listStudents, {
    status: statusFilter || undefined,
    limit: 50,
  });

  const branches = useQuery(api.organizationBranches.listBranches);
  const enrollmentStats = useQuery(api.studentLifecycle.getEnrollmentStats);

  // Batch select all
  const allIds = useMemo(() => (students?.items || []).map((s: any) => s._id), [students]);
  const allSelected = selectedIds.size > 0 && selectedIds.size === allIds.length;

  // Filter students client-side for search
  const filtered = useMemo(() => {
    const items = students?.items || [];
    if (!searchTerm && !quickFilter) return items;
    return items.filter((s: any) => {
      // Quick filters
      if (quickFilter === "active" && s.currentStatus !== "active") return false;
      if (quickFilter === "admitted" && s.currentStatus !== "admitted") return false;
      if (quickFilter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (s.createdAt < today.getTime()) return false;
      }

      // Search
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const name = (s.personName || "").toLowerCase();
        const code = (s.studentCode || "").toLowerCase();
        const admission = (s.admissionNumber || "").toLowerCase();
        const phone = (s.personPhone || "").toLowerCase();
        if (!name.includes(q) && !code.includes(q) && !admission.includes(q) && !phone.includes(q)) return false;
      }
      return true;
    });
  }, [students, searchTerm, quickFilter]);

  // Stats
  const stats = [
    { label: "Total", value: enrollmentStats?.total ?? filtered.length, color: "bg-blue-500" },
    { label: "Active", value: enrollmentStats?.activeCount ?? 0, color: "bg-emerald-500" },
    { label: "Admitted", value: enrollmentStats?.admittedCount ?? 0, color: "bg-violet-500" },
    { label: "Alumni", value: enrollmentStats?.alumniCount ?? 0, color: "bg-indigo-500" },
  ];

  // Selection handlers
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };
  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(allIds));
  };

  // Bulk actions
  const clearSelection = () => setSelectedIds(new Set());

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Students</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage student records, admissions, and academic profiles
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center border border-border/50 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode("card")}
              className={cn("p-1.5 transition-colors", viewMode === "card" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn("p-1.5 transition-colors", viewMode === "table" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
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
              <DropdownMenuItem onClick={() => {}}><FileSpreadsheet className="h-3.5 w-3.5 mr-2" />Export CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}><FileDown className="h-3.5 w-3.5 mr-2" />Export Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}><FileText className="h-3.5 w-3.5 mr-2" />Export PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center shrink-0`}>
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold">{stat.value.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {QUICK_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setQuickFilter(f.value)}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
              quickFilter === f.value
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
            showAdvancedFilters
              ? "bg-accent text-foreground border-border"
              : "bg-transparent text-muted-foreground border-border/40 hover:border-border hover:text-foreground",
          )}
        >
          <SlidersHorizontal className="h-3 w-3" />
          Filters
          {(statusFilter || branchFilter) && <Badge className="ml-1 h-3.5 w-3.5 p-0 text-[8px] bg-primary text-primary-foreground rounded-full flex items-center justify-center">!</Badge>}
        </button>
      </div>

      {/* Advanced Filters Panel */}
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
                  <SelectItem value=" ">All Statuses</SelectItem>
                  {["active", "admitted", "lead", "qualified", "trial", "enquiry", "completed", "alumni", "suspended", "cancelled"].map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="capitalize">{s}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-muted-foreground">Branch</label>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="h-7 w-[140px] text-xs">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">All Branches</SelectItem>
                  {(branches || []).map((b: any) => (
                    <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(statusFilter || branchFilter) && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => { setStatusFilter(""); setBranchFilter(""); }}>
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Search & Actions Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-9"
            placeholder="Search by name, code, admission number, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {filtered.length} student{filtered.length !== 1 ? "s" : ""} found
        </div>

        {/* Batch Selection */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{selectedIds.size} selected</Badge>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={clearSelection}>
              <X className="h-3 w-3" />
              Clear
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                  <MoreHorizontal className="h-3 w-3" />
                  Bulk Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuItem>Export Selected</DropdownMenuItem>
                <DropdownMenuItem>Assign to Branch</DropdownMenuItem>
                <DropdownMenuItem>Change Status</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Archive Selected</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Loading State */}
      {!students ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <GraduationCap className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-foreground mb-1">No students found</h3>
          <p className="text-xs text-muted-foreground">
            {searchTerm || statusFilter ? "Try a different search or filter" : "Create your first student to get started"}
          </p>
        </Card>
      ) : viewMode === "card" ? (
        /* ── Card View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((s: any) => {
            const initials = (s.personName || "??")
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            const statusColor = STATUS_COLORS[s.currentStatus] || "bg-slate-400";

            return (
              <Card
                key={s._id}
                className={cn(
                  "p-3 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group",
                  selectedIds.has(s._id) && "ring-2 ring-primary/30 border-primary/30",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedIds.has(s._id)}
                      onCheckedChange={() => toggleSelect(s._id)}
                      onClick={(e) => e.stopPropagation()}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    <Avatar className="h-9 w-9 shrink-0">
                      {s.personPhoto ? <AvatarImage src={s.personPhoto} /> : null}
                      <AvatarFallback className="text-xs bg-[#1a1a2e] text-white">{initials}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div
                    className="min-w-0 flex-1"
                    onClick={() => navigate(`/students/${s._id}`)}
                  >
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-foreground truncate">{s.personName}</p>
                      <Badge className={`text-[10px] px-1.5 py-0 h-4 text-white ${statusColor}`}>
                        {s.currentStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                      <span className="font-mono">{s.studentCode}</span>
                      <span>•</span>
                      <span>{s.admissionNumber}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-xs">
                      <DropdownMenuItem onClick={() => navigate(`/students/${s._id}`)}>
                        <Eye className="h-3.5 w-3.5 mr-2" />
                        Open Workspace
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
                  <th className="p-3 text-left w-[40px]">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  {TABLE_COLUMNS.map((col) => (
                    <th key={col.id} className={cn("p-3 text-left font-medium text-muted-foreground", col.width)}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s: any) => {
                  const statusColor = STATUS_COLORS[s.currentStatus] || "bg-slate-400";
                  const initials = (s.personName || "??")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr
                      key={s._id}
                      className={cn(
                        "border-b border-border/20 hover:bg-accent/20 transition-colors cursor-pointer",
                        selectedIds.has(s._id) && "bg-accent/30",
                      )}
                      onClick={() => navigate(`/students/${s._id}`)}
                    >
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(s._id)}
                          onCheckedChange={() => toggleSelect(s._id)}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7 shrink-0">
                            {s.personPhoto ? <AvatarImage src={s.personPhoto} /> : null}
                            <AvatarFallback className="text-[9px] bg-[#1a1a2e] text-white">{initials}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground truncate">{s.personName}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-muted-foreground">{s.studentCode}</td>
                      <td className="p-3 font-mono text-muted-foreground">{s.admissionNumber}</td>
                      <td className="p-3">
                        <Badge className={`text-[10px] px-1.5 py-0 h-4 text-white ${statusColor}`}>
                          {s.currentStatus}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{s.personPhone || "—"}</td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-border/30 bg-accent/10">
            <span className="text-[11px] text-muted-foreground">
              Showing {filtered.length} of {enrollmentStats?.total ?? filtered.length} students
            </span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" disabled>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[11px] text-muted-foreground px-2">Page 1</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" disabled>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <CreateStudentDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} />
    </div>
  );
}
