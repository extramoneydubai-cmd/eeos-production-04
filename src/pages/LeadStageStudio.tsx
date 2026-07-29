import { useAppNavigate } from "@/hooks/use-app-navigate";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ArrowLeft, Plus, GripVertical, Palette, Type, Percent, AlignLeft, ToggleLeft,
  Copy, Trash2, Pencil, Eye, EyeOff, Loader2, CheckCircle2, XCircle, CircleDot,
  Phone, ThumbsUp, Calendar, Monitor, Handshake, DollarSign, AlertCircle, RefreshCw,
  Search, Upload, Download, ArrowUpDown, X, Layers,
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { errorLog } from "@/lib/error-logger";
import { useAuth } from "@/hooks/use-auth";

const ICON_OPTIONS = [
  { value: "CircleDot", label: "New", icon: CircleDot },
  { value: "Phone", label: "Phone", icon: Phone },
  { value: "ThumbsUp", label: "Thumbs Up", icon: ThumbsUp },
  { value: "Calendar", label: "Calendar", icon: Calendar },
  { value: "Monitor", label: "Monitor", icon: Monitor },
  { value: "Handshake", label: "Handshake", icon: Handshake },
  { value: "DollarSign", label: "Dollar", icon: DollarSign },
  { value: "CheckCircle2", label: "Check", icon: CheckCircle2 },
  { value: "XCircle", label: "X Circle", icon: XCircle },
  { value: "AlertCircle", label: "Alert", icon: AlertCircle },
];

const COLOR_PRESETS = [
  "#9aa0a6", "#4285f4", "#34a853", "#fbbc04", "#a855f7",
  "#e8710a", "#1a73e8", "#ea4335", "#0d652d", "#5f6368",
  "#e8f0fe", "#fce8e6", "#e6f4ea", "#fef7e0", "#f3e8ff",
];

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o) => o.value === iconName);
  return found?.icon || CircleDot;
}

function formatDate(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function SortableStageRow({
  stage, onEdit, onToggleActive, onDelete, onDuplicate,
}: {
  stage: any;
  onEdit: (s: any) => void;
  onToggleActive: (s: any) => void;
  onDelete: (s: any) => void;
  onDuplicate: (s: any) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComp = getIconComponent(stage.icon);

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-[#f1f3f4] hover:bg-[#f8f9fa] transition-colors ${isDragging ? "bg-[#e8f0fe] shadow-md z-10" : ""}`}
    >
      {/* Drag Handle */}
      <td className="px-2 py-3 w-10" {...attributes} {...listeners}>
        <button className="text-[#9aa0a6] hover:text-[#1a1a2e] cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      {/* Sequence */}
      <td className="px-2 py-3 text-[11px] text-[#5f6368] w-10 text-center">{stage.sequence}</td>
      {/* Stage Name */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: stage.color }}>
            <IconComp className="h-3 w-3 text-white" />
          </div>
          <span className="text-[12px] font-medium text-[#1a1a2e]">{stage.name}</span>
        </div>
      </td>
      {/* Color */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border border-[#e8eaed]" style={{ backgroundColor: stage.color }} />
          <span className="text-[10px] text-[#9aa0a6] font-mono">{stage.color}</span>
        </div>
      </td>
      {/* Icon */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          <IconComp className="h-3.5 w-3.5 text-[#5f6368]" />
          <span className="text-[11px] text-[#5f6368]">{stage.icon}</span>
        </div>
      </td>
      {/* Probability */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1">
          <div className="w-16 bg-[#f1f3f4] rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-[#34a853]"
              style={{ width: `${stage.probability}%` }}
            />
          </div>
          <span className="text-[11px] font-medium text-[#1a1a2e] w-8 text-right">{stage.probability}%</span>
        </div>
      </td>
      {/* Status */}
      <td className="px-3 py-3">
        <Badge className={`text-[9px] px-1.5 py-0 h-4 ${stage.active ? "bg-[#34a853] text-white" : "bg-[#f1f3f4] text-[#9aa0a6]"}`}>
          {stage.active ? "Active" : "Inactive"}
        </Badge>
      </td>
      {/* Modified */}
      <td className="px-3 py-3 text-[11px] text-[#5f6368] whitespace-nowrap">
        {formatDate(stage.updatedAt)}
      </td>
      {/* Actions */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(stage)}
            className="p-1 rounded text-[#9aa0a6] hover:text-[#1a73e8] hover:bg-[#e8f0fe] transition-colors"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onToggleActive(stage)}
            className="p-1 rounded text-[#9aa0a6] hover:text-[#e8710a] hover:bg-[#fef7e0] transition-colors"
            title={stage.active ? "Deactivate" : "Activate"}
          >
            {stage.active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => onDuplicate(stage)}
            className="p-1 rounded text-[#9aa0a6] hover:text-[#34a853] hover:bg-[#e6f4ea] transition-colors"
            title="Duplicate"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(stage)}
            className="p-1 rounded text-[#9aa0a6] hover:text-[#ea4335] hover:bg-[#fce8e6] transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function LeadStageStudio() {
  const { navigate } = useAppNavigate();
  const { user } = useAuth();
  const stages = useQuery(api.crmStages.listStages);
  const seedStages = useMutation(api.crmStages.seedDefaultStages);
  const createStage = useMutation(api.crmStages.createStage);
  const updateStage = useMutation(api.crmStages.updateStage);
  const deleteStage = useMutation(api.crmStages.deleteStage);
  const duplicateStage = useMutation(api.crmStages.duplicateStage);
  const reorderStages = useMutation(api.crmStages.reorderStages);

  const [showDialog, setShowDialog] = useState(false);
  const [editingStage, setEditingStage] = useState<any>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("#4285f4");
  const [formIcon, setFormIcon] = useState("CircleDot");
  const [formProbability, setFormProbability] = useState("50");
  const [formDescription, setFormDescription] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [convexError, setConvexError] = useState<string | null>(null);
  const [stagesTimedOut, setStagesTimedOut] = useState(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Toolbar state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("sequence");

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  // Loading timeout
  useEffect(() => {
    if (stages === undefined) {
      loadingTimerRef.current = setTimeout(() => {
        setStagesTimedOut(true);
        errorLog.push({ message: "[LeadStageStudio] Query timed out after 15s — backend may be unavailable.", source: "react", stack: "", severity: "warning" });
      }, 15000);
    } else {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    }
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, [stages]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Filtered and sorted stages
  const filteredStages = useMemo(() => {
    if (!stages) return [];
    let result = [...stages];

    // Status filter
    if (statusFilter === "active") result = result.filter((s) => s.active);
    else if (statusFilter === "inactive") result = result.filter((s) => !s.active);

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "probability":
        result.sort((a, b) => b.probability - a.probability);
        break;
      case "created":
        result.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case "sequence":
      default:
        result.sort((a, b) => a.sequence - b.sequence);
        break;
    }

    return result;
  }, [stages, searchQuery, statusFilter, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    if (!stages) return null;
    const active = stages.filter((s) => s.active);
    const inactive = stages.filter((s) => !s.active);
    const probabilities = stages.map((s) => s.probability);
    const avg = probabilities.length > 0
      ? Math.round(probabilities.reduce((a, b) => a + b, 0) / probabilities.length)
      : 0;
    return {
      total: stages.length,
      active: active.length,
      inactive: inactive.length,
      avgProbability: avg,
      highestProbability: probabilities.length > 0 ? Math.max(...probabilities) : 0,
      lowestProbability: probabilities.length > 0 ? Math.min(...probabilities) : 0,
    };
  }, [stages]);

  const handleSeedDefaults = async () => {
    setSeeding(true);
    setConvexError(null);
    try {
      await seedStages();
    } catch (err) {
      errorLog.push({ message: "[LeadStageStudio] seed error: " + String(err), source: "convex", stack: String(err) });
      setConvexError("Failed to seed default stages. Backend may be unavailable.");
    } finally {
      setSeeding(false);
    }
  };

  const openAddDialog = () => {
    setEditingStage(null);
    setFormName("");
    setFormColor("#4285f4");
    setFormIcon("CircleDot");
    setFormProbability("50");
    setFormDescription("");
    setFormActive(true);
    setShowColorPicker(false);
    setShowDialog(true);
  };

  const openEditDialog = (stage: any) => {
    setEditingStage(stage);
    setFormName(stage.name);
    setFormColor(stage.color);
    setFormIcon(stage.icon);
    setFormProbability(String(stage.probability));
    setFormDescription(stage.description || "");
    setFormActive(stage.active);
    setShowColorPicker(false);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formName) return;
    setSaving(true);
    setConvexError(null);
    try {
      if (editingStage) {
        await updateStage({
          stageId: editingStage._id,
          name: formName,
          color: formColor,
          icon: formIcon,
          probability: parseInt(formProbability) || 0,
          description: formDescription || undefined,
          active: formActive,
        });
      } else {
        await createStage({
          name: formName,
          color: formColor,
          icon: formIcon,
          probability: parseInt(formProbability) || 0,
          description: formDescription || undefined,
          active: formActive,
        });
      }
      setShowDialog(false);
    } catch (err) {
      errorLog.push({ message: "[LeadStageStudio] save error: " + String(err), source: "convex", stack: String(err) });
      setConvexError("Failed to save stage. Backend may be unavailable.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (stage: any) => {
    setConvexError(null);
    try {
      await updateStage({
        stageId: stage._id,
        active: !stage.active,
      });
    } catch (err) {
      errorLog.push({ message: "[LeadStageStudio] toggle error: " + String(err), source: "convex", stack: String(err) });
      setConvexError("Failed to update stage. Backend may be unavailable.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setConvexError(null);
    try {
      await deleteStage({ stageId: deleteTarget._id });
      setDeleteTarget(null);
    } catch (err) {
      errorLog.push({ message: "[LeadStageStudio] delete error: " + String(err), source: "convex", stack: String(err) });
      setConvexError("Failed to delete stage. Backend may be unavailable.");
    }
  };

  const handleDuplicate = async (stage: any) => {
    setConvexError(null);
    try {
      await duplicateStage({ stageId: stage._id });
    } catch (err) {
      errorLog.push({ message: "[LeadStageStudio] duplicate error: " + String(err), source: "convex", stack: String(err) });
      setConvexError("Failed to duplicate stage. Backend may be unavailable.");
    }
  };

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    if (!stages) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stages.findIndex((s) => s._id === active.id);
    const newIndex = stages.findIndex((s) => s._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...stages];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    setConvexError(null);
    try {
      await reorderStages({ stageIds: reordered.map((s) => s._id) });
    } catch (err) {
      errorLog.push({ message: "[LeadStageStudio] reorder error: " + String(err), source: "convex", stack: String(err) });
      setConvexError("Failed to reorder stages. Backend may be unavailable.");
    }
  }, [stages, reorderStages]);

  const handleRefresh = () => {
    setConvexError(null);
    setStagesTimedOut(false);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSortBy("sequence");
  };

  const isCEO = user?.role === "super_admin";

  // Safe mode
  if (convexError || stagesTimedOut) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="p-4 rounded-full bg-red-50 mb-4">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-[#1a1a2e] mb-1">
          Lead Stages
        </h2>
        <p className="text-[13px] text-[#9aa0a6] mb-2">
          Temporarily unavailable
        </p>
        <div className="bg-[#f8f9fa] border border-[#e8eaed] rounded-lg p-4 max-w-md text-left mb-5">
          <p className="text-[11px] text-[#5f6368] font-medium mb-1">Possible reasons:</p>
          <ul className="text-[11px] text-[#9aa0a6] space-y-0.5 list-disc list-inside">
            <li>Backend not deployed</li>
            <li>Missing configuration</li>
            <li>Connection issue</li>
          </ul>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[11px]"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-[11px] text-[#5f6368]"
            onClick={() => navigate("/crm")}
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to CRM
          </Button>
        </div>
      </div>
    );
  }

  if (!isCEO) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-10 w-10 text-[#ea4335] mb-3" />
        <p className="text-[13px] font-medium text-[#1a1a2e]">Access Restricted</p>
        <p className="text-[11px] text-[#9aa0a6] mt-1">Only Super Admins can manage lead stages.</p>
        <Button variant="outline" size="sm" className="mt-4 h-8 text-[11px]" onClick={() => navigate("/crm")}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to CRM
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#1a1a2e] flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-[#1a1a2e]">Lead Stages</h1>
          </div>
          <p className="text-[13px] text-[#5f6368] mt-1.5">
            Configure the CRM pipeline stages used across the organization.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9aa0a6] pointer-events-none" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-36 text-[12px] pl-8 border-[#e8eaed] rounded-md"
            />
          </div>
          {(!stages || stages.length === 0) && (
            <Button
              variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]"
              onClick={handleSeedDefaults} disabled={seeding}
            >
              {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
              Seed Defaults
            </Button>
          )}
          <Button
            size="sm" className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
            onClick={openAddDialog}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Stage
          </Button>
          <Button
            variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]"
            onClick={handleRefresh}
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline" size="sm" disabled
            className="h-8 text-[11px] border-[#e8eaed] text-[#9aa0a6]"
          >
            <Upload className="h-3.5 w-3.5 mr-1" />
            Import
          </Button>
          <Button
            variant="outline" size="sm" disabled
            className="h-8 text-[11px] border-[#e8eaed] text-[#9aa0a6]"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* ── Statistics Row ── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] font-medium text-[#5f6368]">Total Stages</p>
              <p className="text-xl font-semibold text-[#1a1a2e] mt-0.5">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] font-medium text-[#5f6368]">Active</p>
              <p className="text-xl font-semibold text-[#34a853] mt-0.5">{stats.active}</p>
            </CardContent>
          </Card>
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] font-medium text-[#5f6368]">Inactive</p>
              <p className="text-xl font-semibold text-[#9aa0a6] mt-0.5">{stats.inactive}</p>
            </CardContent>
          </Card>
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] font-medium text-[#5f6368]">Avg Probability</p>
              <p className="text-xl font-semibold text-[#1a73e8] mt-0.5">{stats.avgProbability}%</p>
            </CardContent>
          </Card>
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] font-medium text-[#5f6368]">Highest</p>
              <p className="text-xl font-semibold text-[#34a853] mt-0.5">{stats.highestProbability}%</p>
            </CardContent>
          </Card>
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] font-medium text-[#5f6368]">Lowest</p>
              <p className="text-xl font-semibold text-[#ea4335] mt-0.5">{stats.lowestProbability}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Toolbar ── */}
      {filteredStages.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 max-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9aa0a6] pointer-events-none" />
            <Input
              placeholder="Search stages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-[12px] pl-8 border-[#e8eaed] rounded-md"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-[11px] w-[120px] border-[#e8eaed]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-8 text-[11px] w-[130px] border-[#e8eaed]">
              <ArrowUpDown className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sequence">Sequence</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="probability">Probability</SelectItem>
              <SelectItem value="created">Created</SelectItem>
            </SelectContent>
          </Select>
          {(searchQuery || statusFilter !== "all" || sortBy !== "sequence") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-[11px] text-[#5f6368] hover:text-[#1a1a2e]"
              onClick={handleResetFilters}
            >
              <X className="h-3 w-3 mr-1" /> Reset
            </Button>
          )}
        </div>
      )}

      {/* ── Table ── */}
      <Card className="border-[#e8eaed] shadow-sm bg-white">
        <CardContent className="p-0">
          {!stages ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-5 w-5 animate-spin text-[#9aa0a6]" />
            </div>
          ) : filteredStages.length === 0 && stages.length > 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 rounded-full bg-[#f1f3f4] mb-3">
                <Search className="h-8 w-8 text-[#9aa0a6]" />
              </div>
              <p className="text-[13px] font-medium text-[#1a1a2e]">No stages match your filters</p>
              <p className="text-[11px] text-[#9aa0a6] mt-1">
                Try adjusting your search query or filters.
              </p>
              <Button
                variant="outline" size="sm" className="mt-4 h-8 text-[11px] border-[#e8eaed]"
                onClick={handleResetFilters}
              >
                <X className="h-3.5 w-3.5 mr-1" /> Reset Filters
              </Button>
            </div>
          ) : stages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 rounded-full bg-[#f1f3f4] mb-3">
                <Layers className="h-8 w-8 text-[#9aa0a6]" />
              </div>
              <p className="text-[13px] font-medium text-[#1a1a2e]">No stages configured</p>
              <p className="text-[11px] text-[#9aa0a6] mt-1 max-w-[320px]">
                Create your first stage or seed the default stages (New, Contacted, Interested, etc.)
              </p>
              <div className="flex items-center gap-2 mt-4">
                <Button size="sm" className="h-8 text-[11px] bg-[#1a1a2e]" onClick={openAddDialog}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Create Stage
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]"
                  onClick={handleSeedDefaults} disabled={seeding}>
                  {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Seed Defaults
                </Button>
              </div>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={stages.map((s) => s._id)} strategy={verticalListSortingStrategy}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: 880 }}>
                    <thead>
                      <tr className="border-b border-[#e8eaed] bg-[#f8f9fa]">
                        <th className="w-10 px-2 py-2.5" />
                        <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-2 py-2.5 w-10 text-center">Seq</th>
                        <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Stage Name</th>
                        <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Color</th>
                        <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Icon</th>
                        <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Probability</th>
                        <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Status</th>
                        <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Modified</th>
                        <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStages.map((stage) => (
                        <SortableStageRow
                          key={stage._id}
                          stage={stage}
                          onEdit={openEditDialog}
                          onToggleActive={handleToggleActive}
                          onDelete={setDeleteTarget}
                          onDuplicate={handleDuplicate}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Pipeline Overview */}
      {stages && stages.length > 0 && (
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#1a1a2e]">
              Pipeline Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {stages.map((stage) => {
                const IconComp = getIconComponent(stage.icon);
                return (
                  <div
                    key={stage._id}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-[#e8eaed] bg-[#f8f9fa]"
                  >
                    <div className="w-7 h-7 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: stage.color }}>
                      <IconComp className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[#1a1a2e] truncate">{stage.name}</p>
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 bg-[#e8eaed] rounded-full h-1">
                          <div className="h-1 rounded-full" style={{ width: `${stage.probability}%`, backgroundColor: stage.active ? stage.color : "#9aa0a6" }} />
                        </div>
                        <span className="text-[9px] text-[#9aa0a6]">{stage.probability}%</span>
                      </div>
                    </div>
                    <Badge className={`text-[8px] px-1 py-0 h-3 ${stage.active ? "bg-[#34a853] text-white" : "bg-[#f1f3f4] text-[#9aa0a6]"}`}>
                      {stage.active ? "Active" : "Off"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <ScrollableDialogContent className="sm:max-w-md">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-sm font-semibold">
              {editingStage ? "Edit Stage" : "Add Stage"}
            </DialogTitle>
            <DialogDescription className="text-[11px]">
              {editingStage ? `Update "${editingStage.name}"` : "Create a new pipeline stage"}
            </DialogDescription>
          </DialogHeader>
          <ScrollableDialogBody className="space-y-4 py-1">
            {/* Stage Name */}
            <div>
              <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
                <Type className="h-3 w-3 inline mr-1" /> Stage Name
              </label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-8 text-[12px]"
                placeholder="e.g. Follow Up"
              />
            </div>

            {/* Color */}
            <div>
              <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
                <Palette className="h-3 w-3 inline mr-1" /> Stage Color
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-8 h-8 rounded-md border border-[#e8eaed] flex items-center justify-center hover:border-[#1a1a2e] transition-colors"
                  style={{ backgroundColor: formColor }}
                >
                  <span className="text-[8px] text-white font-bold" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                    {formColor.replace("#", "")}
                  </span>
                </button>
                <Input
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="h-8 text-[11px] font-mono w-28"
                  placeholder="#000000"
                />
              </div>
              {showColorPicker && (
                <div className="flex flex-wrap gap-1.5 mt-2 p-2 rounded-lg bg-[#f8f9fa] border border-[#e8eaed]">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setFormColor(c); setShowColorPicker(false); }}
                      className={`w-7 h-7 rounded-md border-2 transition-all ${formColor === c ? "border-[#1a1a2e] scale-110" : "border-transparent hover:border-[#9aa0a6]"}`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-7 h-7 rounded-md border-2 border-dashed border-[#e8eaed] cursor-pointer"
                    title="Custom color"
                  />
                </div>
              )}
            </div>

            {/* Icon */}
            <div>
              <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">Icon</label>
              <div className="grid grid-cols-5 gap-1.5">
                {ICON_OPTIONS.map((opt) => {
                  const IconComp = opt.icon;
                  const isSelected = formIcon === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setFormIcon(opt.value)}
                      className={`flex flex-col items-center gap-0.5 p-1.5 rounded-md border transition-all ${
                        isSelected
                          ? "border-[#1a1a2e] bg-[#f1f3f4]"
                          : "border-[#e8eaed] hover:bg-[#f8f9fa] hover:border-[#9aa0a6]"
                      }`}
                    >
                      <IconComp className="h-4 w-4 text-[#5f6368]" />
                      <span className="text-[7px] text-[#9aa0a6] leading-tight text-center">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Probability */}
            <div>
              <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
                <Percent className="h-3 w-3 inline mr-1" /> Probability %
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="number" min={0} max={100}
                  value={formProbability}
                  onChange={(e) => setFormProbability(e.target.value)}
                  className="h-8 text-[12px] w-24"
                />
                <div className="flex-1 bg-[#f1f3f4] rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-[#34a853] transition-all"
                    style={{ width: `${Math.min(parseInt(formProbability) || 0, 100)}%` }}
                  />
                </div>
                <span className="text-[11px] font-medium text-[#1a1a2e] w-8 text-right">
                  {Math.min(parseInt(formProbability) || 0, 100)}%
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
                <AlignLeft className="h-3 w-3 inline mr-1" /> Description
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description of this stage..."
                className="w-full min-h-[50px] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]"
                rows={2}
              />
            </div>

            {/* Active */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 rounded border-[#e8eaed] accent-[#1a1a2e]"
                />
                <span className="text-[11px] text-[#5f6368] font-medium">
                  <ToggleLeft className="h-3 w-3 inline mr-1" /> Active
                </span>
              </label>
            </div>
          </ScrollableDialogBody>
          <DialogFooter className="gap-1.5 shrink-0">
            <Button
              variant="outline" size="sm" className="h-8 text-[10px] border-[#e8eaed]"
              onClick={() => setShowDialog(false)}
            >Cancel</Button>
            <Button
              size="sm" className="h-8 text-[10px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
              disabled={!formName || saving}
              onClick={handleSave}
            >
              {saving ? "Saving..." : editingStage ? "Update Stage" : "Create Stage"}
            </Button>
          </DialogFooter>
        </ScrollableDialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold">Delete Stage</AlertDialogTitle>
            <AlertDialogDescription className="text-[11px]">
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-[11px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="h-8 text-[11px] bg-[#ea4335] hover:bg-[#d33426] text-white"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
