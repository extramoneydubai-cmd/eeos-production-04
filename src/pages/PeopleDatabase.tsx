/**
 * PeopleDatabase — Global People Registry List View
 *
 * PATCH-UI-002: Full CRUD People Registry UI.
 * Lists all persons with search, filter, create, and workspace navigation.
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  UserPlus,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Globe,
  Loader2,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Users,
  Shield,
  UserCheck,
  Archive,
  RefreshCw,
  Camera,
  BadgeCheck,
  QrCode,
  Eye,
  Edit3,
  Activity,
  User,
  VenetianMask,
  Heart,
  Hash,
  MessageSquare,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Helpers ───────────────────────────────────────────────────────────

function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.charAt(0) || "";
  const l = lastName?.charAt(0) || "";
  return `${f}${l}`.toUpperCase() || "?";
}

function formatDate(ts?: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateShort(ts?: number): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function getAge(dob?: number): string {
  if (!dob) return "";
  const age = Math.floor((Date.now() - dob) / (365.25 * 86400000));
  return `${age}y`;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  inactive: "bg-gray-100 text-gray-500 border-gray-200",
  archived: "bg-red-50 text-red-500 border-red-200",
};

// ─── Create Person Dialog ─────────────────────────────────────────────

function CreatePersonDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const createPerson = useMutation(api.personEngine.createPerson as any);

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    nationality: "",
    bloodGroup: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.firstName || !form.lastName) {
      toast.error("First name and last name are required");
      return;
    }
    setSaving(true);
    try {
      const args: Record<string, any> = {
        firstName: form.firstName,
        lastName: form.lastName,
      };
      if (form.middleName) args.middleName = form.middleName;
      if (form.gender) args.gender = form.gender;
      if (form.dateOfBirth) args.dateOfBirth = new Date(form.dateOfBirth).getTime();
      if (form.nationality) args.nationality = form.nationality;
      if (form.bloodGroup) args.bloodGroup = form.bloodGroup;
      if (form.notes) args.notes = form.notes;

      await createPerson(args);
      toast.success("Person created successfully");
      onClose();
      setForm({ firstName: "", middleName: "", lastName: "", gender: "", dateOfBirth: "", nationality: "", bloodGroup: "", notes: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create person");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Create Person Record
          </DialogTitle>
          <DialogDescription>
            Add a new person to the Global People Registry. A QR code will be auto-generated.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 py-2">
          <div className="col-span-1">
            <label className="text-[10px] font-medium text-[#5f6368] mb-1 block">
              First Name *
            </label>
            <Input
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              className="h-8 text-[12px]"
              placeholder="First"
            />
          </div>
          <div className="col-span-1">
            <label className="text-[10px] font-medium text-[#5f6368] mb-1 block">
              Middle
            </label>
            <Input
              value={form.middleName}
              onChange={(e) => setForm((f) => ({ ...f, middleName: e.target.value }))}
              className="h-8 text-[12px]"
              placeholder="Middle"
            />
          </div>
          <div className="col-span-1">
            <label className="text-[10px] font-medium text-[#5f6368] mb-1 block">
              Last Name *
            </label>
            <Input
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              className="h-8 text-[12px]"
              placeholder="Last"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-[#5f6368] mb-1 block">
              Gender
            </label>
            <Select
              value={form.gender}
              onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}
            >
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male" className="text-[12px]">Male</SelectItem>
                <SelectItem value="female" className="text-[12px]">Female</SelectItem>
                <SelectItem value="other" className="text-[12px]">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] font-medium text-[#5f6368] mb-1 block">
              Date of Birth
            </label>
            <Input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
              className="h-8 text-[12px]"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-[#5f6368] mb-1 block">
              Nationality
            </label>
            <Input
              value={form.nationality}
              onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))}
              className="h-8 text-[12px]"
              placeholder="e.g. Indian"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-[#5f6368] mb-1 block">
              Blood Group
            </label>
            <Select
              value={form.bloodGroup}
              onValueChange={(v) => setForm((f) => ({ ...f, bloodGroup: v }))}
            >
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                  <SelectItem key={bg} value={bg} className="text-[12px]">{bg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-3">
            <label className="text-[10px] font-medium text-[#5f6368] mb-1 block">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full min-h-[60px] text-[12px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]"
              rows={2}
              placeholder="Optional notes..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} className="text-[12px] h-8">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="text-[12px] h-8">
            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <UserPlus className="h-3 w-3 mr-1" />}
            {saving ? "Creating..." : "Create Person"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Person Card ────────────────────────────────────────────────────────

function PersonCard({
  person,
  onClick,
}: {
  person: Record<string, any>;
  onClick: () => void;
}) {
  const initials = getInitials(person.firstName, person.lastName);
  const displayName = person.displayName || `${person.firstName} ${person.lastName}`;
  const statusColor = STATUS_STYLES[person.status] || STATUS_STYLES.active;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <Card className="p-3 hover:shadow-sm hover:border-[#1a1a2e]/20 transition-all duration-200 border border-[#e8eaed]/80">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative shrink-0">
            <Avatar className="h-10 w-10 border border-[#e8eaed]">
              <AvatarImage src={person.profilePhoto || ""} alt={displayName} />
              <AvatarFallback className="text-[11px] bg-[#1a1a2e] text-white font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            {person.bloodGroup && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#e8eaed]">
                <span className="text-[7px] font-bold text-[#ea4335]">{person.bloodGroup}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-[#1a1a2e] truncate">
                {displayName}
              </span>
              {person.status === "active" && (
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {person.gender && (
                <span className="text-[10px] text-[#5f6368] capitalize flex items-center gap-0.5">
                  <VenetianMask className="h-3 w-3" /> {person.gender}
                </span>
              )}
              {person.dateOfBirth && (
                <span className="text-[10px] text-[#5f6368] flex items-center gap-0.5">
                  <CalendarDays className="h-3 w-3" /> {getAge(person.dateOfBirth)}
                </span>
              )}
              {person.nationality && (
                <span className="text-[10px] text-[#5f6368] flex items-center gap-0.5">
                  <Globe className="h-3 w-3" /> {person.nationality}
                </span>
              )}
            </div>
          </div>

          {/* Status & Action */}
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant="outline"
              className={cn("text-[9px] px-1.5 py-0 h-4 font-medium border", statusColor)}
            >
              {person.status}
            </Badge>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem className="text-[12px]" onClick={onClick}>
                    <Eye className="h-3.5 w-3.5 mr-2" /> View Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-[12px] text-red-500">
                    <Archive className="h-3.5 w-3.5 mr-2" /> Archive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── People Database Page ─────────────────────────────────────────────

export default function PeopleDatabase() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [showCreate, setShowCreate] = useState(false);

  // Fetch persons — we use listPersons from the engine
  const personsResult = useQuery(api.personEngine.listPersons as any, {
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 100,
  });

  const persons = ((personsResult as any)?.items || []) as Record<string, any>[];

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return persons;
    const q = search.toLowerCase();
    return persons.filter((p) => {
      const name = (p.displayName || `${p.firstName || ""} ${p.lastName || ""}`).toLowerCase();
      return name.includes(q);
    });
  }, [persons, search]);

  const stats = useMemo(() => {
    return {
      total: persons.length,
      active: persons.filter((p) => p.status === "active").length,
      archived: persons.filter((p) => p.status === "archived").length,
    };
  }, [persons]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#1a1a2e] flex items-center gap-2">
            <Users className="h-5 w-5" />
            People Registry
          </h1>
          <p className="text-[12px] text-[#5f6368] mt-0.5">
            Global People Database — manage all persons in the organization
          </p>
        </div>
        <Button
          size="sm"
          className="h-8 text-[12px]"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Person
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f8f9fa] rounded-lg">
          <Users className="h-3.5 w-3.5 text-[#5f6368]" />
          <span className="text-[11px] text-[#5f6368]">
            <strong className="text-[#1a1a2e]">{stats.total}</strong> Total
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg">
          <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-[11px] text-emerald-700">
            <strong className="text-emerald-800">{stats.active}</strong> Active
          </span>
        </div>
        {stats.archived > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-lg">
            <Archive className="h-3.5 w-3.5 text-red-500" />
            <span className="text-[11px] text-red-600">
              <strong className="text-red-700">{stats.archived}</strong> Archived
            </span>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9aa0a6]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="h-8 pl-8 text-[12px] bg-[#f8f9fa] border-[#e8eaed] focus:bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="h-3 w-3 text-[#9aa0a6]" />
            </button>
          )}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-[130px] text-[12px]">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active" className="text-[12px]">Active</SelectItem>
            <SelectItem value="all" className="text-[12px]">All Records</SelectItem>
            <SelectItem value="archived" className="text-[12px]">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Person Grid */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Users className="h-8 w-8 text-[#9aa0a6] mx-auto mb-3" />
          <h3 className="text-sm font-medium text-[#5f6368] mb-1">
            {search ? "No matching persons found" : "No persons yet"}
          </h3>
          <p className="text-[11px] text-[#9aa0a6] mb-4">
            {search
              ? "Try a different search term or clear filters"
              : "Create your first person record to get started"}
          </p>
          {!search && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[12px]"
              onClick={() => setShowCreate(true)}
            >
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              Create Person
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((person) => (
              <PersonCard
                key={person._id}
                person={person}
                onClick={() => navigate(`/people/${person._id}`)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Dialog */}
      <CreatePersonDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
