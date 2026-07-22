import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Search, Plus, Phone, Mail, MapPin, Target, DollarSign, Calendar, User,
  ChevronRight, X, Loader2, Users, Clock, ArrowRight, TrendingUp,
  CheckCircle2, UserPlus, Download, Upload,
  ChevronUp, ChevronDown, ArrowUpDown, Eye, Database, Trash2,
  Tag, ListChecks, SlidersHorizontal,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { Doc } from "@/convex/_generated/dataModel";
import LeadWorkspaceDrawer from "./LeadWorkspaceDrawer";

const PIPELINE_STAGES = [
  { id: "new", label: "New", color: "bg-[#9aa0a6]" },
  { id: "attempted", label: "Attempted", color: "bg-[#4285f4]" },
  { id: "connected", label: "Connected", color: "bg-[#34a853]" },
  { id: "qualified", label: "Qualified", color: "bg-[#fbbc04]" },
  { id: "counselling", label: "Counselling", color: "bg-[#a855f7]" },
  { id: "interested", label: "Interested", color: "bg-[#1a73e8]" },
  { id: "follow_up", label: "Follow Up", color: "bg-[#ea4335]" },
  { id: "negotiation", label: "Negotiation", color: "bg-[#e8710a]" },
  { id: "converted", label: "Converted", color: "bg-[#0d652d]" },
  { id: "lost", label: "Lost", color: "bg-[#5f6368]" },
];

const stageColors: Record<string, string> = {
  new: "bg-[#9aa0a6]", attempted: "bg-[#4285f4]", connected: "bg-[#34a853]",
  qualified: "bg-[#fbbc04]", counselling: "bg-[#a855f7]", interested: "bg-[#1a73e8]",
  follow_up: "bg-[#ea4335]", negotiation: "bg-[#e8710a]", converted: "bg-[#0d652d]", lost: "bg-[#5f6368]",
};

const priorityColors: Record<string, string> = {
  low: "text-[#9aa0a6] bg-[#f1f3f4]", medium: "text-[#4285f4] bg-[#e8f0fe]",
  high: "text-[#ea4335] bg-[#fce8e6]", critical: "text-white bg-[#ea4335]",
};

const PIPELINE_KEYS = ["new", "attempted", "connected", "qualified", "counselling", "interested", "follow_up", "negotiation", "converted", "lost"];

const PAGE_SIZE = 25;

type SortField = "firstName" | "lastName" | "phone" | "whatsappUsername" | "whatsappPin" | "stage" | "priority" | "standardAmount" | "nextActionDate" | "createdAt" | "source";
type SortDir = "asc" | "desc";

export default function LeadDatabase() {
  const { user } = useAuth();
  const { navigate } = useAppNavigate();

  // Data
  const leads = useQuery(api.crm.listLeads, user ? {} : "skip");
  const users = useQuery(api.users.listUsers);
  const branches = useQuery(api.organization.listBranches);
  const verticals = useQuery(api.organization.listVerticals);
  const sources = useQuery(api.crm.listLeadSources);
  const createLead = useMutation(api.crm.createLead);
  const importLeads = useMutation(api.crm.importLeads);

  // Bulk operations
  const bulkAssign = useMutation(api.crm.bulkAssign);
  const bulkMoveStage = useMutation(api.crm.bulkMoveStage);
  const bulkTag = useMutation(api.crm.bulkTag);
  const bulkDelete = useMutation(api.crm.bulkDelete);
  const bulkCreateTasks = useMutation(api.crm.bulkCreateTasks);

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [filterOwner, setFilterOwner] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerLeadId, setDrawerLeadId] = useState<string | null>(null);

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Create form
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
const [newSource, setNewSource] = useState("Website");
const [newWhatsappUsername, setNewWhatsappUsername] = useState("");
const [newWhatsappPin, setNewWhatsappPin] = useState("");
const [newStage, setNewStage] = useState("new");
  const [newOwner, setNewOwner] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newBranchId, setNewBranchId] = useState("");
  const [newVerticalId, setNewVerticalId] = useState("");
  // Import state
  const [importData, setImportData] = useState<any[] | null>(null);
  const [importColumns, setImportColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [duplicateAction, setDuplicateAction] = useState<"skip" | "overwrite" | "create_new">("skip");
  const [importStep, setImportStep] = useState<"upload" | "map" | "preview">("upload");

  // Bulk action state
  const [bulkValue, setBulkValue] = useState("");

  const filteredLeads = useMemo((): Doc<"leadMaster">[] => {
    const all = (leads || []) as Doc<"leadMaster">[];
    let list = all.filter((l) => l.status !== "archived");
    if (filterStage !== "all") list = list.filter((l) => l.stage === filterStage);
    if (filterOwner !== "all") list = list.filter((l) => l.ownerId === filterOwner);
    if (filterPriority !== "all") list = list.filter((l) => l.priority === filterPriority);
    if (filterBranch !== "all") list = list.filter((l) => l.branchInterestId === filterBranch);
    if (filterSource !== "all") list = list.filter((l) => l.source === filterSource);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((l) => l.firstName.toLowerCase().includes(q) || l.lastName.toLowerCase().includes(q) || l.phone.includes(q) || (l.email && l.email.toLowerCase().includes(q)) || (l.whatsappUsername && l.whatsappUsername.toLowerCase().includes(q)));
    }
    list.sort((a, b) => {
      const aVal = a[sortField] ?? "";
      const bVal = b[sortField] ?? "";
      const cmp = typeof aVal === "string" ? aVal.localeCompare(String(bVal)) : Number(aVal) - Number(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [leads, filterStage, filterOwner, filterPriority, filterBranch, filterSource, searchQuery, sortField, sortDir]);

  const totalPages = Math.ceil(filteredLeads.length / PAGE_SIZE) || 1;
  const pageLeads = filteredLeads.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const allSelected = pageLeads.length > 0 && pageLeads.every((l) => selectedIds.has(l._id));

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(pageLeads.map((l) => l._id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleCreateLead = async () => {
    if (!newFirstName || !newLastName || !newPhone || !user) return;
    setCreating(true);
    try {
      await createLead({
        firstName: newFirstName, lastName: newLastName, phone: newPhone,
        email: newEmail || undefined, source: newSource || undefined, stage: newStage,
        ownerId: (newOwner || user._id) as any, priority: newPriority as any,
        branchInterestId: newBranchId as any || undefined, verticalId: newVerticalId as any || undefined,
        whatsappUsername: newWhatsappUsername || undefined, whatsappPin: newWhatsappPin || undefined,
        createdBy: user._id,
      });
      setShowCreateDialog(false);
      setNewFirstName(""); setNewLastName(""); setNewPhone(""); setNewEmail("");
      setNewSource("Website"); setNewStage("new"); setNewOwner("");
      setNewPriority("medium"); setNewBranchId(""); setNewVerticalId("");
      setNewWhatsappUsername(""); setNewWhatsappPin("");
    } catch (e) { console.error(e); } finally { setCreating(false); }
  };

  const handleBulkAction = async () => {
    if (!user || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds) as any[];
    try {
      if (showBulkDialog === "assign" && bulkValue) {
        await bulkAssign({ leadIds: ids, toUserId: bulkValue as any, userId: user._id });
      } else if (showBulkDialog === "stage" && bulkValue) {
        await bulkMoveStage({ leadIds: ids, stage: bulkValue, userId: user._id });
      } else if (showBulkDialog === "tag" && bulkValue) {
        await bulkTag({ leadIds: ids, tags: [bulkValue], userId: user._id });
      } else if (showBulkDialog === "task" && bulkValue) {
        await bulkCreateTasks({ leadIds: ids, title: bulkValue, userId: user._id });
      } else if (showBulkDialog === "delete") {
        await bulkDelete({ leadIds: ids, userId: user._id });
      }
      setSelectedIds(new Set());
      setShowBulkDialog(null);
      setBulkValue("");
    } catch (e) { console.error(e); }
  };

  // CSV Import handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split("\n").filter(Boolean);
      if (lines.length < 2) return;
      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
      const data = lines.slice(1).map((line) => {
        const vals = line.split(",").map((v) => v.trim().replace(/"/g, ""));
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = vals[i] || ""; });
        return row;
      });
      setImportColumns(headers);
      setImportData(data);
      // Auto-map
      const map: Record<string, string> = {};
      const fieldMap: Record<string, string> = {
        "first name": "firstName", "firstname": "firstName", "first_name": "firstName",
        "last name": "lastName", "lastname": "lastName", "last_name": "lastName",
        "name": "firstName", "full name": "firstName",
        "phone": "phone", "mobile": "phone", "contact": "phone", "telephone": "phone",
        "email": "email", "e-mail": "email", "mail": "email",
        "source": "source", "lead source": "source", "lead_source": "source",
        "stage": "stage", "status": "stage",
        "priority": "priority",
        "revenue": "expectedRevenue", "expected revenue": "expectedRevenue", "amount": "expectedRevenue",
        "location": "location", "city": "location", "address": "location",
        "whatsapp": "whatsappUsername", "whatsapp username": "whatsappUsername", "whatsapp_username": "whatsappUsername",
        "whatsapp pin": "whatsappPin", "whatsapp_pin": "whatsappPin",
      };
      headers.forEach((h) => {
        const key = h.toLowerCase().trim();
        if (fieldMap[key]) map[h] = fieldMap[key];
        else map[h] = "";
      });
      setColumnMapping(map);
      setImportStep("map");
      setShowImportDialog(true);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importData || !user) return;
    const getCol = (field: string) => Object.keys(columnMapping).find((k) => columnMapping[k] === field) || "";
    const mapped = importData.map((row) => ({
      firstName: row[getCol("firstName")] || "",
      lastName: row[getCol("lastName")] || "",
      phone: row[getCol("phone")] || "",
      email: row[getCol("email")] || undefined,
      location: row[getCol("location")] || undefined,
      source: row[getCol("source")] || undefined,
      stage: row[getCol("stage")] || "new",
      priority: row[getCol("priority")] || "medium",
      expectedRevenue: row[getCol("expectedRevenue")] ? parseInt(row[getCol("expectedRevenue")]) || undefined : undefined,
    }));
    const valid = mapped.filter((r: any) => r.firstName && r.phone);
    if (valid.length === 0) return;
    try {
      await importLeads({ leads: valid as any, createdBy: user._id, duplicateAction });
      setShowImportDialog(false);
      setImportData(null);
      setImportStep("upload");
    } catch (e) { console.error(e); }
  };

  const getInitials = (name?: string) => name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const SortHeader = ({ field, label, className }: { field: SortField; label: string; className?: string }) => (
    <th
      className={`text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider px-3 py-2.5 cursor-pointer hover:text-[#1a1a2e] select-none whitespace-nowrap ${className || ""}`}
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortField === field ? (
          sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </div>
    </th>
  );

  return (
    <div className="space-y-3">
      {/* Header toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e]">Lead Database</h1>
          <p className="text-[13px] text-[#5f6368]">{filteredLeads.length} leads</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="file" accept=".csv,.xlsx" className="hidden" id="csvInput" onChange={handleFileUpload} />
          <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]" onClick={() => document.getElementById("csvInput")?.click()}>
            <Upload className="h-3.5 w-3.5 mr-1" /> Import
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]" onClick={() => navigate("/crm")}>
            <TrendingUp className="h-3.5 w-3.5 mr-1" /> Dashboard
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]" onClick={() => navigate("/crm/sales")}>
            <Users className="h-3.5 w-3.5 mr-1" /> Sales
          </Button>
          <Button size="sm" className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Lead
          </Button>
        </div>
      </div>

      {/* Pipeline filters — All tab + stage tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
        <button onClick={() => setFilterStage("all")}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-all ${
            filterStage === "all" ? "bg-[#1a1a2e] text-white" : "bg-[#f1f3f4] text-[#5f6368] hover:bg-[#e8eaed]"
          }`}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#5f6368]" />
          All
          <span className={`text-[9px] ${filterStage === "all" ? "text-white/70" : "text-[#9aa0a6]"}`}>{filteredLeads.length}</span>
        </button>
        {PIPELINE_KEYS.map((key) => {
          const stage = PIPELINE_STAGES.find((s) => s.id === key)!;
          const count = filteredLeads.filter((l) => l.stage === key).length;
          return (
            <button key={key} onClick={() => setFilterStage(filterStage === key ? "all" : key)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-all ${
                filterStage === key ? "bg-[#1a1a2e] text-white" : "bg-[#f1f3f4] text-[#5f6368] hover:bg-[#e8eaed]"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${stage.color}`} />
              {stage.label}
              <span className={`text-[9px] ${filterStage === key ? "text-white/70" : "text-[#9aa0a6]"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search + Filters row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9aa0a6]" />
          <Input placeholder="Search by name or phone..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }}
            className="h-8 pl-9 text-[12px] bg-white border-[#e8eaed]" />
        </div>
        <Select value={filterOwner} onValueChange={setFilterOwner}>
          <SelectTrigger className="h-8 text-[11px] w-[120px] border-[#e8eaed]"><SelectValue placeholder="Owner" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            {users?.filter((u) => !u.isDisabled).map((u) => <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="h-8 text-[11px] w-[100px] border-[#e8eaed]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterBranch} onValueChange={setFilterBranch}>
          <SelectTrigger className="h-8 text-[11px] w-[100px] border-[#e8eaed]"><SelectValue placeholder="Branch" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches?.map((b) => <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="h-8 text-[11px] w-[100px] border-[#e8eaed]"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {(sources || []).map((s) => <SelectItem key={s._id} value={s.name}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-[#5f6368]" onClick={() => { setFilterStage("all"); setFilterOwner("all"); setFilterPriority("all"); setFilterBranch("all"); setFilterSource("all"); setSearchQuery(""); }}>
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#f8f9fa] rounded-lg border border-[#e8eaed]">
          <span className="text-[12px] font-medium text-[#1a1a2e]">{selectedIds.size} selected</span>
          <div className="w-px h-4 bg-[#e8eaed]" />
          <Button variant="ghost" size="sm" className="h-7 text-[11px] text-[#5f6368]" onClick={() => setShowBulkDialog("assign")}><UserPlus className="h-3 w-3 mr-1" /> Assign</Button>
          <Button variant="ghost" size="sm" className="h-7 text-[11px] text-[#5f6368]" onClick={() => setShowBulkDialog("stage")}><ArrowRight className="h-3 w-3 mr-1" /> Move Stage</Button>
          <Button variant="ghost" size="sm" className="h-7 text-[11px] text-[#5f6368]" onClick={() => setShowBulkDialog("tag")}><Tag className="h-3 w-3 mr-1" /> Tag</Button>
          <Button variant="ghost" size="sm" className="h-7 text-[11px] text-[#5f6368]" onClick={() => setShowBulkDialog("task")}><ListChecks className="h-3 w-3 mr-1" /> Create Task</Button>
          <Button variant="ghost" size="sm" className="h-7 text-[11px] text-[#5f6368]" onClick={() => setShowBulkDialog("export")}><Download className="h-3 w-3 mr-1" /> Export</Button>
          <Button variant="ghost" size="sm" className="h-7 text-[11px] text-[#ea4335] hover:bg-[#fce8e6]" onClick={() => setShowBulkDialog("delete")}><Trash2 className="h-3 w-3 mr-1" /> Delete</Button>
          <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[#5f6368] ml-auto" onClick={() => setSelectedIds(new Set())}><X className="h-3 w-3" /></Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-[#e8eaed] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 1200 }}>
            <thead className="bg-[#f8f9fa] sticky top-0 z-10">
              <tr className="border-b border-[#e8eaed]">
                <th className="w-10 px-3 py-2.5 sticky left-0 bg-[#f8f9fa] z-20">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-3.5 w-3.5 accent-[#1a1a2e]" />
                </th>
                <SortHeader field="firstName" label="Name" className="sticky left-10 bg-[#f8f9fa] z-20" />
                <SortHeader field="phone" label="Phone" />
                <SortHeader field="whatsappUsername" label="WhatsApp" />
                <th className="text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider px-3 py-2.5 whitespace-nowrap">WA PIN</th>
                <SortHeader field="stage" label="Stage" />
                <th className="text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider px-3 py-2.5 whitespace-nowrap">Owner</th>
                <th className="text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider px-3 py-2.5 whitespace-nowrap">Branch</th>
                <th className="text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider px-3 py-2.5 whitespace-nowrap">Vertical</th>
                <SortHeader field="source" label="Source" />
                <SortHeader field="priority" label="Priority" />
                <SortHeader field="standardAmount" label="Revenue" />
                <SortHeader field="nextActionDate" label="Next Action" />
                <SortHeader field="createdAt" label="Created" />
                <th className="px-3 py-2.5 w-20 text-right"><span className="text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {!leads ? (
                <tr><td colSpan={15} className="text-center py-12"><Loader2 className="h-5 w-5 animate-spin text-[#9aa0a6] mx-auto" /></td></tr>
              ) : pageLeads.length === 0 ? (
                <tr><td colSpan={15} className="text-center py-12">
                  <Database className="h-8 w-8 text-[#9aa0a6] mx-auto mb-2" />
                  <p className="text-[13px] text-[#5f6368]">No leads found</p>
                  <p className="text-[11px] text-[#9aa0a6] mt-1">Add a new lead or adjust filters</p>
                </td></tr>
              ) : (
                pageLeads.map((lead) => {
                  const owner = users?.find((u) => u._id === lead.ownerId);
                  const branch = branches?.find((b) => b._id === lead.branchInterestId);
                  const vertical = verticals?.find((v) => v._id === lead.verticalId);
                  const isOverdue = lead.nextActionDate && lead.nextActionDate < Date.now() && lead.status === "active";
                  return (
                    <tr key={lead._id}
                      className={`border-b border-[#f1f3f4] hover:bg-[#f8f9fa] transition-colors cursor-pointer ${
                        drawerLeadId === lead._id ? "bg-[#f0f4ff]" : ""
                      }`}
                      onClick={() => navigate(`/crm/leads/${lead._id}`)}
                    >
                      <td className="sticky left-0 bg-white z-10 px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedIds.has(lead._id)} onChange={() => toggleOne(lead._id)} className="h-3.5 w-3.5 accent-[#1a1a2e]" />
                      </td>
                      <td className="sticky left-10 bg-white z-10 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="text-[9px] bg-[#f1f3f4] text-[#5f6368]">{lead.firstName[0]}{lead.lastName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-[12px] font-medium text-[#1a1a2e] truncate max-w-[160px]">{lead.firstName} {lead.lastName}</p>
                            {lead.email && <p className="text-[10px] text-[#9aa0a6] truncate max-w-[160px]">{lead.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-[12px] text-[#5f6368] whitespace-nowrap">{lead.phone}</td>
                      <td className="px-3 py-2 text-[12px] text-[#5f6368] whitespace-nowrap">{lead.whatsappUsername || "—"}</td>
                      <td className="px-3 py-2 text-[12px] text-[#5f6368] whitespace-nowrap">{lead.whatsappPin ? "••••" : "—"}</td>
                      <td className="px-3 py-2">
                        <Badge className={`text-[9px] px-1.5 py-0 h-4 ${stageColors[lead.stage] || "bg-[#9aa0a6]"} text-white`}>
                          {PIPELINE_STAGES.find((s) => s.id === lead.stage)?.label || lead.stage}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          {owner && <Avatar className="h-5 w-5"><AvatarFallback className="text-[7px] bg-[#f1f3f4] text-[#5f6368]">{getInitials(owner.name)}</AvatarFallback></Avatar>}
                          <span className="text-[11px] text-[#5f6368]">{owner?.name?.split(" ")[0] || "—"}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-[#5f6368]">{branch?.code || "—"}</td>
                      <td className="px-3 py-2 text-[11px] text-[#5f6368]">{vertical?.code || "—"}</td>
                      <td className="px-3 py-2 text-[11px] text-[#5f6368]">{lead.source || "—"}</td>
                      <td className="px-3 py-2">
                        <Badge className={`text-[8px] px-1 py-0 h-3.5 ${priorityColors[lead.priority] || priorityColors.medium}`}>{lead.priority}</Badge>
                      </td>
                      <td className="px-3 py-2 text-[12px] font-medium text-[#1a1a2e]">
                        {lead.standardAmount != null ? `₹${lead.standardAmount.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {lead.nextAction ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-[#5f6368] truncate max-w-[100px]">{lead.nextAction}</span>
                            {lead.nextActionDate && (
                              <span className={`text-[10px] ${isOverdue ? "text-[#ea4335]" : "text-[#9aa0a6]"} shrink-0`}>
                                {new Date(lead.nextActionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            )}
                          </div>
                        ) : <span className="text-[11px] text-[#9aa0a6]">—</span>}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-[#9aa0a6] whitespace-nowrap">
                        {new Date(lead.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[#5f6368]"
                          onClick={(e) => { e.stopPropagation(); navigate(`/crm/leads/${lead._id}`); }}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredLeads.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-[#e8eaed] bg-[#f8f9fa]">
            <span className="text-[11px] text-[#9aa0a6]">
              Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filteredLeads.length)} of {filteredLeads.length}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[#5f6368]" disabled={currentPage === 0}
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}>
                <ChevronRight className="h-3.5 w-3.5 rotate-180" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const page = Math.max(0, Math.min(currentPage - 2, totalPages - 5)) + i;
                if (page >= totalPages) return null;
                return (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={`h-7 w-7 rounded-md text-[11px] font-medium ${
                      page === currentPage ? "bg-[#1a1a2e] text-white" : "text-[#5f6368] hover:bg-[#f1f3f4]"
                    }`}
                  >{page + 1}</button>
                );
              })}
              <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[#5f6368]" disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Lead Drawer (opens on row click archive list) — now single click opens full page */}
      {drawerLeadId && (
        <LeadWorkspaceDrawer
          leadId={drawerLeadId}
          onClose={() => setDrawerLeadId(null)}
          onOpenFull={() => { setDrawerLeadId(null); navigate(`/crm/leads/${drawerLeadId}`); }}
        />
      )}

      {/* Create Lead Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => setShowCreateDialog(false)}>
          <div className="bg-white rounded-lg border border-[#e8eaed] shadow-lg p-5 w-[480px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#1a1a2e]">Add New Lead</h2>
              <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[#5f6368]" onClick={() => setShowCreateDialog(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[11px] text-[#5f6368] font-medium">First Name *</label><Input value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} className="h-8 text-[12px]" placeholder="First" /></div>
              <div><label className="text-[11px] text-[#5f6368] font-medium">Last Name *</label><Input value={newLastName} onChange={(e) => setNewLastName(e.target.value)} className="h-8 text-[12px]" placeholder="Last" /></div>
              <div><label className="text-[11px] text-[#5f6368] font-medium">Phone *</label><Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="h-8 text-[12px]" placeholder="Phone" /></div>
              <div><label className="text-[11px] text-[#5f6368] font-medium">Email</label><Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="h-8 text-[12px]" placeholder="Email" /></div>
              <div><label className="text-[11px] text-[#5f6368] font-medium">WhatsApp Username</label><Input value={newWhatsappUsername} onChange={(e) => setNewWhatsappUsername(e.target.value)} className="h-8 text-[12px]" placeholder="WhatsApp username" /></div>
              <div><label className="text-[11px] text-[#5f6368] font-medium">WhatsApp PIN</label><Input value={newWhatsappPin} onChange={(e) => setNewWhatsappPin(e.target.value)} className="h-8 text-[12px]" placeholder="WhatsApp PIN" type="password" /></div>
              <div><label className="text-[11px] text-[#5f6368] font-medium">Source</label>
                <Select value={newSource} onValueChange={setNewSource}>
                  <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{(sources || []).map((s) => <SelectItem key={s._id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-[11px] text-[#5f6368] font-medium">Stage</label>
                <Select value={newStage} onValueChange={setNewStage}>
                  <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{PIPELINE_STAGES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-[11px] text-[#5f6368] font-medium">Owner</label>
                <Select value={newOwner} onValueChange={setNewOwner}>
                  <SelectTrigger className="h-8 text-[12px]"><SelectValue placeholder="Assign" /></SelectTrigger>
                  <SelectContent>{users?.filter((u) => !u.isDisabled).map((u) => <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-[11px] text-[#5f6368] font-medium">Priority</label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><label className="text-[11px] text-[#5f6368] font-medium">Branch</label>
                <Select value={newBranchId} onValueChange={setNewBranchId}>
                  <SelectTrigger className="h-8 text-[12px]"><SelectValue placeholder="Branch" /></SelectTrigger>
                  <SelectContent>{branches?.map((b) => <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-[11px] text-[#5f6368] font-medium">Vertical</label>
                <Select value={newVerticalId} onValueChange={setNewVerticalId}>
                  <SelectTrigger className="h-8 text-[12px]"><SelectValue placeholder="Vertical" /></SelectTrigger>
                  <SelectContent>{verticals?.map((v) => <SelectItem key={v._id} value={v._id}>{v.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>

            </div>
            <Button onClick={handleCreateLead} disabled={creating || !newFirstName || !newLastName || !newPhone} className="w-full h-9 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a] mt-4">
              {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null} Create Lead
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Action Dialog */}
      {showBulkDialog && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => setShowBulkDialog(null)}>
          <div className="bg-white rounded-lg border border-[#e8eaed] shadow-lg p-4 w-[340px]" onClick={(e) => e.stopPropagation()}>
            <p className="text-[13px] font-semibold text-[#1a1a2e] mb-3 capitalize">{showBulkDialog} {selectedIds.size} leads</p>
            {showBulkDialog === "assign" && (
              <Select value={bulkValue} onValueChange={setBulkValue}>
                <SelectTrigger className="h-9 text-[13px] w-full"><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>{users?.filter((u) => !u.isDisabled).map((u) => <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {showBulkDialog === "stage" && (
              <Select value={bulkValue} onValueChange={setBulkValue}>
                <SelectTrigger className="h-9 text-[13px] w-full"><SelectValue placeholder="Select stage" /></SelectTrigger>
                <SelectContent>{PIPELINE_STAGES.filter((s) => s.id !== "converted" && s.id !== "lost").map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {showBulkDialog === "tag" && <Input value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} placeholder="Tag name" className="h-9 text-[13px]" />}
            {showBulkDialog === "task" && <Input value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} placeholder="Task title" className="h-9 text-[13px]" />}
            {showBulkDialog === "delete" && <p className="text-[12px] text-[#ea4335]">Are you sure? This cannot be undone.</p>}
            {showBulkDialog === "export" && <p className="text-[12px] text-[#5f6368]">Download selected leads as CSV?</p>}
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="flex-1 h-8 text-[12px]" onClick={() => setShowBulkDialog(null)}>Cancel</Button>
              <Button size="sm" className="flex-1 h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={handleBulkAction} disabled={showBulkDialog !== "delete" && showBulkDialog !== "export" && !bulkValue}>
                {showBulkDialog === "delete" ? "Delete" : showBulkDialog === "export" ? "Export" : "Apply"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && importData && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => setShowImportDialog(false)}>
          <div className="bg-white rounded-lg border border-[#e8eaed] shadow-lg p-5 w-[600px] max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#1a1a2e]">Import Leads</h2>
              <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[#5f6368]" onClick={() => setShowImportDialog(false)}><X className="h-4 w-4" /></Button>
            </div>
            {importStep === "map" && (
              <div className="space-y-3">
                <p className="text-[12px] text-[#5f6368]">Map your CSV columns to lead fields</p>
                {importColumns.map((col) => (
                  <div key={col} className="flex items-center gap-2">
                    <span className="text-[12px] text-[#1a1a2e] w-[150px] font-medium">{col}</span>
                    <Select value={columnMapping[col] || ""} onValueChange={(v) => setColumnMapping({ ...columnMapping, [col]: v })}>
                      <SelectTrigger className="h-8 text-[12px] flex-1"><SelectValue placeholder="— Skip —" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">— Skip —</SelectItem>
                        <SelectItem value="firstName">First Name</SelectItem>
                        <SelectItem value="lastName">Last Name</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="location">Location</SelectItem>
                        <SelectItem value="source">Source</SelectItem>
                        <SelectItem value="stage">Stage</SelectItem>
                        <SelectItem value="priority">Priority</SelectItem>
                        <SelectItem value="expectedRevenue">Expected Revenue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                <Separator />
                <div>
                  <label className="text-[11px] text-[#5f6368] font-medium">Duplicate Handling</label>
                  <Select value={duplicateAction} onValueChange={(v: any) => setDuplicateAction(v)}>
                    <SelectTrigger className="h-8 text-[12px] w-full mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">Skip duplicates</SelectItem>
                      <SelectItem value="overwrite">Overwrite existing</SelectItem>
                      <SelectItem value="create_new">Create as new</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => setImportStep("upload")}>Back</Button>
                  <Button size="sm" className="h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a] ml-auto" onClick={handleImport}>
                    Import {importData.length} leads
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
