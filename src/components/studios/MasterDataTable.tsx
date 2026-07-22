import { useAppNavigate } from "@/hooks/use-app-navigate";
import { useQuery, useMutation } from "convex/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollableDialogContent, ScrollableDialogBody } from "@/components/ui/scrollable-dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  ArrowLeft, Plus, GripVertical, Search, Upload, Download, ArrowUpDown,
  X, Loader2, AlertCircle, RefreshCw, Layers, Pencil, Eye, EyeOff,
  Copy, Trash2,
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAuth } from "@/hooks/use-auth";

/* ─── Shared Helpers ─── */

export function formatDate(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ─── Types ─── */

export interface MasterDataConfig {
  title: string;
  subtitle: string;
  entityName: string;
  entityNamePlural: string;
  backRoute: string;
  backLabel: string;

  apiModule: {
    list: any;
    get: any;
    create: any;
    update: any;
    delete: any;
    duplicate: any;
    reorder: any;
    seedDefault: any;
  };

  getStats: (items: any[]) => Array<{ label: string; value: string | number; valueColor?: string }>;

  extraColumns?: Array<{
    header: string;
    width?: string;
    cell: (item: any) => React.ReactNode;
  }>;

  renderFormFields: (props: {
    isEditing: boolean;
    formName: string;
    setFormName: (v: string) => void;
    formColor: string;
    setFormColor: (v: string) => void;
    formIcon: string;
    setFormIcon: (v: string) => void;
    formActive: boolean;
    setFormActive: (v: boolean) => void;
    showColorPicker: boolean;
    setShowColorPicker: (v: boolean) => void;
    formExtra: Record<string, any>;
    setFormExtra: (key: string, value: any) => void;
    editingItem: any;
  }) => React.ReactNode;

  getDefaultFormExtra: () => Record<string, any>;
  getFormExtraFromItem: (item: any) => Record<string, any>;
  validateExtra: (extra: Record<string, any>) => string | null;

  getIconComponent: (iconName: string) => React.ElementType;
  iconOptions: Array<{ value: string; label: string; icon: React.ElementType }>;
  colorPresets: string[];
  hasSeed: boolean;
  requiredRole?: string;
  renderCustomSection?: (items: any[], context: any) => React.ReactNode;
}

/* ─── Sortable Row ─── */

function SortableDataRow({
  item, columns, onEdit, onToggleActive, onDelete, onDuplicate, getIconComponent,
}: {
  item: any;
  columns: MasterDataConfig["extraColumns"];
  onEdit: (item: any) => void;
  onToggleActive: (item: any) => void;
  onDelete: (item: any) => void;
  onDuplicate: (item: any) => void;
  getIconComponent: (name: string) => React.ElementType;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComp = getIconComponent(item.icon);

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-[#f1f3f4] hover:bg-[#f8f9fa] transition-colors ${isDragging ? "bg-[#e8f0fe] shadow-md z-10" : ""}`}
    >
      <td className="px-2 py-3 w-10" {...attributes} {...listeners}>
        <button className="text-[#9aa0a6] hover:text-[#1a1a2e] cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="px-2 py-3 text-[11px] text-[#5f6368] w-10 text-center">{item.sequence}</td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: item.color }}>
            <IconComp className="h-3 w-3 text-white" />
          </div>
          <span className="text-[12px] font-medium text-[#1a1a2e]">{item.name}</span>
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border border-[#e8eaed]" style={{ backgroundColor: item.color }} />
          <span className="text-[10px] text-[#9aa0a6] font-mono">{item.color}</span>
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <IconComp className="h-3.5 w-3.5 text-[#5f6368]" />
          <span className="text-[11px] text-[#5f6368]">{item.icon}</span>
        </div>
      </td>
      {columns?.map((col, ci) => (
        <td key={ci} className="px-3 py-3">{col.cell(item)}</td>
      ))}
      <td className="px-3 py-3">
        <Badge className={`text-[9px] px-1.5 py-0 h-4 ${item.active ? "bg-[#34a853] text-white" : "bg-[#f1f3f4] text-[#9aa0a6]"}`}>
          {item.active ? "Active" : "Inactive"}
        </Badge>
      </td>
      <td className="px-3 py-3 text-[11px] text-[#5f6368] whitespace-nowrap">
        {formatDate(item.updatedAt)}
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(item)} className="p-1 rounded text-[#9aa0a6] hover:text-[#1a73e8] hover:bg-[#e8f0fe] transition-colors" title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onToggleActive(item)} className="p-1 rounded text-[#9aa0a6] hover:text-[#e8710a] hover:bg-[#fef7e0] transition-colors" title={item.active ? "Deactivate" : "Activate"}>
            {item.active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => onDuplicate(item)} className="p-1 rounded text-[#9aa0a6] hover:text-[#34a853] hover:bg-[#e6f4ea] transition-colors" title="Duplicate">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onDelete(item)} className="p-1 rounded text-[#9aa0a6] hover:text-[#ea4335] hover:bg-[#fce8e6] transition-colors" title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ─── Main Component ─── */

export default function MasterDataTable({ config }: { config: MasterDataConfig }) {
  const { navigate } = useAppNavigate();
  const { user } = useAuth();

  const items = useQuery(config.apiModule.list);
  const seedAction = useMutation(config.apiModule.seedDefault);
  const createAction = useMutation(config.apiModule.create);
  const updateAction = useMutation(config.apiModule.update);
  const deleteAction = useMutation(config.apiModule.delete);
  const duplicateAction = useMutation(config.apiModule.duplicate);
  const reorderAction = useMutation(config.apiModule.reorder);

  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("#4285f4");
  const [formIcon, setFormIcon] = useState("CircleDot");
  const [formActive, setFormActive] = useState(true);
  const [formExtra, setFormExtraState] = useState<Record<string, any>>({});
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [convexError, setConvexError] = useState<string | null>(null);
  const [itemsTimedOut, setItemsTimedOut] = useState(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("sequence");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  useEffect(() => {
    if (items === undefined) {
      loadingTimerRef.current = setTimeout(() => setItemsTimedOut(true), 15000);
    } else {
      if (loadingTimerRef.current) { clearTimeout(loadingTimerRef.current); loadingTimerRef.current = null; }
    }
    return () => { if (loadingTimerRef.current) { clearTimeout(loadingTimerRef.current); loadingTimerRef.current = null; } };
  }, [items]);

  const setFormExtra = (key: string, value: any) => setFormExtraState((prev) => ({ ...prev, [key]: value }));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const filteredItems = useMemo(() => {
    if (!items) return [];
    let result = [...items];
    if (statusFilter === "active") result = result.filter((s: any) => s.active);
    else if (statusFilter === "inactive") result = result.filter((s: any) => !s.active);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s: any) => s.name.toLowerCase().includes(q) || (s.description || "").toLowerCase().includes(q));
    }
    switch (sortBy) {
      case "name": result.sort((a: any, b: any) => a.name.localeCompare(b.name)); break;
      case "created": result.sort((a: any, b: any) => b.createdAt - a.createdAt); break;
      case "sequence": default: result.sort((a: any, b: any) => a.sequence - b.sequence); break;
    }
    return result;
  }, [items, searchQuery, statusFilter, sortBy]);

  const stats = useMemo(() => items ? config.getStats(items) : null, [items, config]);

  const handleSeedDefaults = async () => {
    setSeeding(true); setConvexError(null);
    try { await seedAction(); }
    catch (err) { console.error(`[MasterDataTable] seed error:`, err); setConvexError(`Failed to seed default ${config.entityNamePlural}.`); }
    finally { setSeeding(false); }
  };

  const openAddDialog = () => {
    setEditingItem(null); setFormName(""); setFormColor("#4285f4"); setFormIcon("CircleDot"); setFormActive(true);
    setFormExtraState(config.getDefaultFormExtra()); setShowColorPicker(false); setShowDialog(true);
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item); setFormName(item.name); setFormColor(item.color); setFormIcon(item.icon); setFormActive(item.active);
    setFormExtraState(config.getFormExtraFromItem(item)); setShowColorPicker(false); setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formName) return;
    const extraError = config.validateExtra(formExtra);
    if (extraError) { setConvexError(extraError); return; }
    setSaving(true); setConvexError(null);
    try {
      const payload: Record<string, any> = { name: formName, color: formColor, icon: formIcon, active: formActive, ...formExtra };
      if (editingItem) { await updateAction({ [`${config.entityName}Id`]: editingItem._id, ...payload }); }
      else { await createAction(payload); }
      setShowDialog(false);
    } catch (err) { console.error(`[MasterDataTable] save error:`, err); setConvexError(`Failed to save ${config.entityName}.`); }
    finally { setSaving(false); }
  };

  const handleToggleActive = async (item: any) => {
    setConvexError(null);
    try { await updateAction({ [`${config.entityName}Id`]: item._id, active: !item.active }); }
    catch (err) { console.error(`[MasterDataTable] toggle error:`, err); setConvexError(`Failed to update ${config.entityName}.`); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return; setConvexError(null);
    try { await deleteAction({ [`${config.entityName}Id`]: deleteTarget._id }); setDeleteTarget(null); }
    catch (err) { console.error(`[MasterDataTable] delete error:`, err); setConvexError(`Failed to delete ${config.entityName}.`); }
  };

  const handleDuplicate = async (item: any) => {
    setConvexError(null);
    try { await duplicateAction({ [`${config.entityName}Id`]: item._id }); }
    catch (err) { console.error(`[MasterDataTable] duplicate error:`, err); setConvexError(`Failed to duplicate ${config.entityName}.`); }
  };

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    if (!items) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((s: any) => s._id === active.id);
    const newIndex = items.findIndex((s: any) => s._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = [...items]; const [moved] = reordered.splice(oldIndex, 1); reordered.splice(newIndex, 0, moved);
    setConvexError(null);
    try { await reorderAction({ [`${config.entityName}Ids`]: reordered.map((s: any) => s._id) }); }
    catch (err) { console.error(`[MasterDataTable] reorder error:`, err); setConvexError(`Failed to reorder ${config.entityNamePlural}.`); }
  }, [items, reorderAction, config]);

  const handleRefresh = () => { setConvexError(null); setItemsTimedOut(false); };
  const handleResetFilters = () => { setSearchQuery(""); setStatusFilter("all"); setSortBy("sequence"); };

  const hasAccess = config.requiredRole ? user?.role === config.requiredRole : true;

  if (convexError || itemsTimedOut) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="p-4 rounded-full bg-red-50 mb-4"><AlertCircle className="h-10 w-10 text-red-500" /></div>
        <h2 className="text-lg font-semibold text-[#1a1a2e] mb-1">{config.title}</h2>
        <p className="text-[13px] text-[#9aa0a6] mb-2">Temporarily unavailable</p>
        <div className="bg-[#f8f9fa] border border-[#e8eaed] rounded-lg p-4 max-w-md text-left mb-5">
          <p className="text-[11px] text-[#5f6368] font-medium mb-1">Possible reasons:</p>
          <ul className="text-[11px] text-[#9aa0a6] space-y-0.5 list-disc list-inside">
            <li>Backend not deployed</li><li>Missing configuration</li><li>Connection issue</li>
          </ul>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={handleRefresh}><RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry</Button>
          <Button variant="ghost" size="sm" className="h-8 text-[11px] text-[#5f6368]" onClick={() => navigate(config.backRoute)}><ArrowLeft className="h-3.5 w-3.5 mr-1" /> {config.backLabel}</Button>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-10 w-10 text-[#ea4335] mb-3" />
        <p className="text-[13px] font-medium text-[#1a1a2e]">Access Restricted</p>
        <p className="text-[11px] text-[#9aa0a6] mt-1">Only Super Admins can manage {config.entityNamePlural}.</p>
        <Button variant="outline" size="sm" className="mt-4 h-8 text-[11px]" onClick={() => navigate(config.backRoute)}><ArrowLeft className="h-3.5 w-3.5 mr-1" /> {config.backLabel}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#1a1a2e] flex items-center justify-center"><Layers className="w-4 h-4 text-white" /></div>
            <h1 className="text-xl font-semibold text-[#1a1a2e]">{config.title}</h1>
          </div>
          <p className="text-[13px] text-[#5f6368] mt-1.5">{config.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9aa0a6] pointer-events-none" />
            <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-8 w-36 text-[12px] pl-8 border-[#e8eaed] rounded-md" />
          </div>
          {config.hasSeed && (!items || items.length === 0) && (
            <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]" onClick={handleSeedDefaults} disabled={seeding}>
              {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null} Seed Defaults
            </Button>
          )}
          <Button size="sm" className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={openAddDialog}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add {config.entityName}
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]" onClick={handleRefresh} title="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" disabled className="h-8 text-[11px] border-[#e8eaed] text-[#9aa0a6]"><Upload className="h-3.5 w-3.5 mr-1" /> Import</Button>
          <Button variant="outline" size="sm" disabled className="h-8 text-[11px] border-[#e8eaed] text-[#9aa0a6]"><Download className="h-3.5 w-3.5 mr-1" /> Export</Button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.map((stat, i) => (
            <Card key={i} className="border-[#e8eaed] shadow-sm bg-white">
              <CardContent className="p-3 text-center">
                <p className="text-[10px] font-medium text-[#5f6368]">{stat.label}</p>
                <p className="text-xl font-semibold mt-0.5" style={{ color: stat.valueColor || "#1a1a2e" }}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Toolbar */}
      {filteredItems.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 max-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9aa0a6] pointer-events-none" />
            <Input placeholder={`Search ${config.entityNamePlural}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-8 text-[12px] pl-8 border-[#e8eaed] rounded-md" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-[11px] w-[120px] border-[#e8eaed]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-8 text-[11px] w-[130px] border-[#e8eaed]"><ArrowUpDown className="h-3 w-3 mr-1" /><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sequence">Sequence</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="created">Created</SelectItem>
            </SelectContent>
          </Select>
          {(searchQuery || statusFilter !== "all" || sortBy !== "sequence") && (
            <Button variant="ghost" size="sm" className="h-8 text-[11px] text-[#5f6368] hover:text-[#1a1a2e]" onClick={handleResetFilters}>
              <X className="h-3 w-3 mr-1" /> Reset
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <Card className="border-[#e8eaed] shadow-sm bg-white">
        <CardContent className="p-0">
          {!items ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-5 w-5 animate-spin text-[#9aa0a6]" /></div>
          ) : filteredItems.length === 0 && items.length > 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 rounded-full bg-[#f1f3f4] mb-3"><Search className="h-8 w-8 text-[#9aa0a6]" /></div>
              <p className="text-[13px] font-medium text-[#1a1a2e]">No {config.entityNamePlural} match your filters</p>
              <p className="text-[11px] text-[#9aa0a6] mt-1">Try adjusting your search query or filters.</p>
              <Button variant="outline" size="sm" className="mt-4 h-8 text-[11px] border-[#e8eaed]" onClick={handleResetFilters}>
                <X className="h-3.5 w-3.5 mr-1" /> Reset Filters
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 rounded-full bg-[#f1f3f4] mb-3"><Layers className="h-8 w-8 text-[#9aa0a6]" /></div>
              <p className="text-[13px] font-medium text-[#1a1a2e]">No {config.entityNamePlural} configured</p>
              <p className="text-[11px] text-[#9aa0a6] mt-1 max-w-[320px]">Create your first {config.entityName} or seed the defaults.</p>
              <div className="flex items-center gap-2 mt-4">
                <Button size="sm" className="h-8 text-[11px] bg-[#1a1a2e]" onClick={openAddDialog}><Plus className="h-3.5 w-3.5 mr-1" /> Create {config.entityName}</Button>
                {config.hasSeed && (
                  <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]" onClick={handleSeedDefaults} disabled={seeding}>
                    {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null} Seed Defaults
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((s: any) => s._id)} strategy={verticalListSortingStrategy}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 880 }}>
                    <thead>
                      <tr className="border-b border-[#e8eaed] bg-[#f8f9fa]">
                        <th className="w-10 px-2 py-2.5" />
                        <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-2 py-2.5 w-10 text-center">Seq</th>
                        <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">{config.entityName} Name</th>
                        <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Color</th>
                        <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Icon</th>
                        {config.extraColumns?.map((col, ci) => (
                          <th key={ci} className={`text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5 ${col.width || ""}`}>{col.header}</th>
                        ))}
                        <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Status</th>
                        <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Modified</th>
                        <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item: any) => (
                        <SortableDataRow key={item._id} item={item} columns={config.extraColumns}
                          onEdit={openEditDialog} onToggleActive={handleToggleActive} onDelete={setDeleteTarget}
                          onDuplicate={handleDuplicate} getIconComponent={config.getIconComponent} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Custom Section */}
      {config.renderCustomSection && items && items.length > 0 && config.renderCustomSection(items, { getIconComponent: config.getIconComponent })}

      {/* Add / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <ScrollableDialogContent className="sm:max-w-xl">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-sm font-semibold">{editingItem ? `Edit ${config.entityName}` : `Add ${config.entityName}`}</DialogTitle>
            <DialogDescription className="text-[11px]">{editingItem ? `Update "${editingItem.name}"` : `Create a new ${config.entityName.toLowerCase()}`}</DialogDescription>
          </DialogHeader>
          <ScrollableDialogBody className="space-y-4 py-1">
            <div>
              <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">Name *</label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} className="h-8 text-[12px]" placeholder={`e.g. ${config.entityName} name`} />
            </div>
            {config.renderFormFields({
              isEditing: !!editingItem, formName, setFormName, formColor, setFormColor, formIcon, setFormIcon,
              formActive, setFormActive, showColorPicker, setShowColorPicker, formExtra, setFormExtra, editingItem,
            })}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} className="w-4 h-4 rounded border-[#e8eaed] accent-[#1a1a2e]" />
                <span className="text-[11px] text-[#5f6368] font-medium">Active</span>
              </label>
            </div>
          </ScrollableDialogBody>
          <DialogFooter className="gap-1.5 shrink-0">
            <Button variant="outline" size="sm" className="h-8 text-[10px] border-[#e8eaed]" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button size="sm" className="h-8 text-[10px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" disabled={!formName || saving} onClick={handleSave}>
              {saving ? "Saving..." : editingItem ? `Update ${config.entityName}` : `Create ${config.entityName}`}
            </Button>
          </DialogFooter>
        </ScrollableDialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold">Delete {config.entityName}</AlertDialogTitle>
            <AlertDialogDescription className="text-[11px]">
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-[11px]">Cancel</AlertDialogCancel>
            <AlertDialogAction className="h-8 text-[11px] bg-[#ea4335] hover:bg-[#d33426] text-white" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
