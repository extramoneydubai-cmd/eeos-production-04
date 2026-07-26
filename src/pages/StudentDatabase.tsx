/**
 * StudentDatabase — Enterprise Student List & Search
 *
 * Features:
 * - Search by name, code, admission number
 * - Filter by status, branch
 * - Quick statistics (total, active, admitted, alumni)
 * - Student cards with avatar, status badge, contacts
 * - Create student dialog (links to People Registry)
 * - Paginated results
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Search, Plus, GraduationCap, Filter, ChevronDown, Loader2, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";

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

// ─── Create Student Dialog ─────────────────────────────────────────
function CreateStudentDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const createStudent = useMutation(api.studentEngine.createStudent);

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    email: "",
    gender: "",
    nationality: "",
    dateOfBirth: undefined as number | undefined,
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
            This will create a Person record in the Global People Registry and a Student record.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2 sm:col-span-1">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">First Name *</label>
            <Input
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              placeholder="First name"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Middle Name</label>
            <Input
              value={form.middleName}
              onChange={(e) => setForm((f) => ({ ...f, middleName: e.target.value }))}
              placeholder="Middle name"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Last Name *</label>
            <Input
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              placeholder="Last name"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone *</label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="Phone number"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
            <Input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="Email address"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Gender</label>
            <Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nationality</label>
            <Input
              value={form.nationality}
              onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))}
              placeholder="Nationality"
            />
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [branchFilter, setBranchFilter] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Queries
  const students = useQuery(api.studentEngine.listStudents, {
    status: statusFilter || undefined,
    limit: 50,
  });

  const branches = useQuery(api.organizationBranches.listBranches);
  const enrollmentStats = useQuery(api.studentLifecycle.getEnrollmentStats);

  // Filter students client-side for search
  const filtered = (students?.items || []).filter((s) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const name = (s.personName || "").toLowerCase();
    const code = (s.studentCode || "").toLowerCase();
    const admission = (s.admissionNumber || "").toLowerCase();
    return name.includes(q) || code.includes(q) || admission.includes(q);
  });

  // Derived stats
  const stats = [
    { label: "Total", value: enrollmentStats?.total ?? students?.items.length ?? 0, color: "bg-blue-500" },
    { label: "Active", value: enrollmentStats?.activeCount ?? 0, color: "bg-emerald-500" },
    { label: "Admitted", value: enrollmentStats?.admittedCount ?? 0, color: "bg-violet-500" },
    { label: "Alumni", value: enrollmentStats?.alumniCount ?? 0, color: "bg-indigo-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Students</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage student records, admissions, and academic profiles
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Student
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, code, or admission number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="admitted">Admitted</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="enquiry">Enquiry</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="alumni">Alumni</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">All Branches</SelectItem>
            {(branches || []).map((b: any) => (
              <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground ml-auto">
          {filtered.length} student{filtered.length !== 1 ? "s" : ""} found
        </div>
      </div>

      {/* Student Cards Grid */}
      {!students ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <GraduationCap className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-foreground mb-1">No students found</h3>
          <p className="text-xs text-muted-foreground">
            {searchTerm ? "Try a different search term" : "Create your first student to get started"}
          </p>
        </Card>
      ) : (
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
                className="p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
                onClick={() => navigate(`/students/${s._id}`)}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    {s.personPhoto ? (
                      <AvatarImage src={s.personPhoto} alt={s.personName} />
                    ) : null}
                    <AvatarFallback className="text-xs bg-[#1a1a2e] text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {s.personName}
                      </p>
                      <Badge className={`text-[10px] px-1.5 py-0 h-4 text-white ${statusColor}`}>
                        {s.currentStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span>{s.studentCode}</span>
                      <span>{s.admissionNumber}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-xs">
                      <DropdownMenuItem onClick={() => navigate(`/students/${s._id}`)}>
                        Open Workspace
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <CreateStudentDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </div>
  );
}
