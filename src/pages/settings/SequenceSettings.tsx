/**
 * EEOS Sequence Management Page
 *
 * Admin interface for the Sequence Engine (P0).
 * Allows full CRUD, preview, reset, and history viewing.
 *
 * Follows DOC-23 page standards:
 * Header → Stats → Toolbar → Filters → Table → Dialogs → Activity
 */

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { StudioLayout } from "@/components/layout/StudioLayout";
import { StatisticsCard } from "@/components/shared/StatisticsCard";
import { GlobalToolbar } from "@/components/shared/GlobalToolbar";
import { DataTable, type Column } from "@/components/data/DataTable";
import { CrudDialog, type CrudField } from "@/components/shared/CrudDialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Hash,
  Plus,
  RotateCcw,
  Eye,
  History,
  Play,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

// ─── Types ─────────────────────────────────────────────────────

interface SequenceConfig {
  _id: string;
  _creationTime: number;
  code: string;
  name: string;
  prefix: string;
  suffix?: string;
  padding: number;
  currentNumber: number;
  startNumber: number;
  increment: number;
  resetStrategy: "none" | "yearly" | "monthly" | "manual";
  lastResetAt?: number;
  scope: "global" | "organization" | "branch";
  organizationId?: string;
  branchId?: Id<"branches">;
  isActive: boolean;
  description?: string;
  createdBy: Id<"users">;
  createdAt: number;
}

interface HistoryEntry {
  _id: string;
  number: string;
  entityType?: string;
  entityId?: string;
  generatedAt: number;
  metadata?: Record<string, unknown>;
}

// ─── Constants ────────────────────────────────────────────────

const resetStrategies = [
  { value: "none" as const, label: "None" },
  { value: "yearly" as const, label: "Yearly" },
  { value: "monthly" as const, label: "Monthly" },
  { value: "manual" as const, label: "Manual" },
];

const scopes = [
  { value: "global" as const, label: "Global" },
  { value: "organization" as const, label: "Organization" },
  { value: "branch" as const, label: "Branch" },
];

// ─── Component ────────────────────────────────────────────────

export default function SequenceSettings() {
  // ── State ──
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [resetDialogId, setResetDialogId] = useState<string | null>(null);
  const [generateDialogId, setGenerateDialogId] = useState<string | null>(null);

  // ── Data ──
  const configs: SequenceConfig[] | undefined = useQuery(api.engines.sequenceEngine.list, {
    search: search || undefined,
  });
  const status: { total: number; active: number; disabled: number; yearlyReset: number; monthlyReset: number } | undefined = useQuery(api.engines.sequenceEngine.getStatus);
  const preview: { nextNumber: string; effectiveNumber: number; wouldReset: boolean } | undefined = useQuery(
    api.engines.sequenceEngine.preview,
    previewId ? { configId: previewId } : "skip",
  );
  const history: HistoryEntry[] | undefined = useQuery(
    api.engines.sequenceEngine.getHistory,
    historyId ? { configId: historyId, limit: 20 } : "skip",
  );

  // ── Mutations ──
  const createConfig = useMutation(api.engines.sequenceEngine.create);
  const updateConfig = useMutation(api.engines.sequenceEngine.update);
  const removeConfig = useMutation(api.engines.sequenceEngine.remove);
  const generateNext = useMutation(api.engines.sequenceEngine.generateNext);
  const resetSequence = useMutation(api.engines.sequenceEngine.reset);

  // ── Handlers ──
  const handleCreate = useCallback(() => {
    setEditingId(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((config: SequenceConfig) => {
    setEditingId(config._id);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (config: SequenceConfig) => {
      try {
        await removeConfig({ configId: config._id });
        toast.success(`Sequence "${config.code}" deleted`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete");
      }
    },
    [removeConfig],
  );

  const handleSubmit = useCallback(
    async (values: Record<string, string>) => {
      try {
        if (editingId) {
          await updateConfig({
            configId: editingId,
            name: values.name,
            prefix: values.prefix,
            suffix: values.suffix || undefined,
            padding: parseInt(values.padding, 10),
            startNumber: parseInt(values.startNumber, 10),
            increment: parseInt(values.increment || "1", 10),
            resetStrategy: values.resetStrategy as "none" | "yearly" | "monthly" | "manual",
            description: values.description || undefined,
          });
          toast.success("Sequence updated");
        } else {
          await createConfig({
            code: values.code,
            name: values.name,
            prefix: values.prefix,
            suffix: values.suffix || undefined,
            padding: parseInt(values.padding, 10),
            startNumber: parseInt(values.startNumber, 10),
            increment: parseInt(values.increment || "1", 10),
            resetStrategy: values.resetStrategy as "none" | "yearly" | "monthly" | "manual",
            scope: values.scope as "global" | "organization" | "branch",
            description: values.description || undefined,
          });
          toast.success("Sequence created");
        }
        setDialogOpen(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Operation failed");
      }
    },
    [editingId, createConfig, updateConfig],
  );

  const handleGenerate = useCallback(
    async (configId: string) => {
      try {
        const result = await generateNext({ configId });
        toast.success(
          `Generated: ${result.number}` +
            (result.wasReset ? " (sequence was reset first)" : ""),
        );
        setGenerateDialogId(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Generation failed");
      }
    },
    [generateNext],
  );

  const handleReset = useCallback(
    async (configId: string) => {
      try {
        await resetSequence({ configId, reason: "Manual reset from admin panel" });
        toast.success("Sequence reset to start number");
        setResetDialogId(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Reset failed");
      }
    },
    [resetSequence],
  );

  // ── Derived ──
  const editingConfig: SequenceConfig | null = useMemo(
    () => (editingId ? (configs ?? []).find((c: SequenceConfig) => c._id === editingId) ?? null : null),
    [editingId, configs],
  );

  const dialogDefaultValues = editingConfig
    ? {
        name: editingConfig.name,
        prefix: editingConfig.prefix,
        suffix: editingConfig.suffix || "",
        padding: String(editingConfig.padding),
        startNumber: String(editingConfig.startNumber),
        increment: String(editingConfig.increment),
        resetStrategy: editingConfig.resetStrategy,
        scope: editingConfig.scope,
        description: editingConfig.description || "",
      }
    : {
        code: "",
        name: "",
        prefix: "",
        suffix: "",
        padding: "6",
        startNumber: "1",
        increment: "1",
        resetStrategy: "none",
        scope: "global",
        description: "",
      };

  // Dynamic fields — show code on create, omit on edit
  const dialogFields: CrudField[] = editingId
    ? [
        { name: "name", label: "Name", required: true, placeholder: "e.g., Lead" },
        { name: "prefix", label: "Prefix", required: true, placeholder: "e.g., LD-" },
        { name: "suffix", label: "Suffix", placeholder: "e.g., -DXB" },
        { name: "padding", label: "Padding", type: "number", required: true, placeholder: "6" },
        { name: "startNumber", label: "Start Number", type: "number", required: true, placeholder: "1" },
        { name: "increment", label: "Increment", type: "number", required: true, placeholder: "1" },
        { name: "description", label: "Description", type: "textarea", placeholder: "Optional description" },
      ]
    : [
        { name: "code", label: "Code", required: true, placeholder: "e.g., lead" },
        { name: "name", label: "Name", required: true, placeholder: "e.g., Lead" },
        { name: "prefix", label: "Prefix", required: true, placeholder: "e.g., LD-" },
        { name: "suffix", label: "Suffix", placeholder: "e.g., -DXB" },
        { name: "padding", label: "Padding", type: "number", required: true, placeholder: "6" },
        { name: "startNumber", label: "Start Number", type: "number", required: true, placeholder: "1" },
        { name: "increment", label: "Increment", type: "number", required: true, placeholder: "1" },
        { name: "description", label: "Description", type: "textarea", placeholder: "Optional description" },
      ];

  // ── Columns ──
  const columns: Column<SequenceConfig>[] = useMemo(
    () => [
      {
        key: "code",
        label: "Code",
        sortable: true,
        render: (c: SequenceConfig) => (
          <span className="font-mono text-xs text-foreground">{c.code}</span>
        ),
      },
      {
        key: "name",
        label: "Name",
        sortable: true,
        render: (c: SequenceConfig) => (
          <div className="flex items-center gap-2">
            <span className="text-sm">{c.name}</span>
            {!c.isActive && (
              <Badge
                variant="outline"
                className="text-[8px] px-1 py-0 h-3.5 border-border/40 text-muted-foreground/50 font-normal uppercase tracking-wider"
              >
                Disabled
              </Badge>
            )}
          </div>
        ),
      },
      {
        key: "prefix",
        label: "Format",
        render: (c: SequenceConfig) => (
          <code className="text-xs text-muted-foreground bg-accent/50 px-1.5 py-0.5 rounded-sm font-mono">
            {c.prefix}
            {String(c.currentNumber).padStart(c.padding, "0")}
            {c.suffix || ""}
          </code>
        ),
      },
      {
        key: "currentNumber",
        label: "Next",
        sortable: true,
        render: (c: SequenceConfig) => (
          <span className="font-mono text-xs">{c.currentNumber}</span>
        ),
      },
      {
        key: "resetStrategy",
        label: "Reset",
        render: (c: SequenceConfig) => (
          <span className="text-xs text-muted-foreground capitalize">
            {c.resetStrategy}
          </span>
        ),
      },
      {
        key: "scope",
        label: "Scope",
        render: (c: SequenceConfig) => (
          <span className="text-xs text-muted-foreground capitalize">{c.scope}</span>
        ),
      },
      {
        key: "createdAt",
        label: "Actions",
        className: "w-[180px] text-right",
        render: (c: SequenceConfig) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewId(c._id);
              }}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Preview next number"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                setGenerateDialogId(c._id);
              }}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Generate next number"
            >
              <Play className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                setHistoryId(c._id);
              }}
              className="text-muted-foreground hover:text-foreground"
              aria-label="View history"
            >
              <History className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(c);
              }}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Edit"
            >
              <span className="text-xs">Edit</span>
            </Button>
          </div>
        ),
      },
    ],
    [handleEdit],
  );

  return (
    <StudioLayout
      title="Sequence Engine"
      description="Configure automatic number generation for all modules — leads, students, invoices, employees, tasks, and more."
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Settings", href: "/settings" },
        { label: "Sequence Engine" },
      ]}
    >
      {/* ── Statistics Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatisticsCard
          label="Total Sequences"
          value={status?.total ?? "—"}
          icon={<Hash className="h-4 w-4 text-muted-foreground" />}
        />
        <StatisticsCard
          label="Active"
          value={status?.active ?? "—"}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600/70" />}
        />
        <StatisticsCard
          label="Disabled"
          value={status?.disabled ?? "—"}
          icon={<XCircle className="h-4 w-4 text-muted-foreground/60" />}
        />
        <StatisticsCard
          label="Yearly Reset"
          value={status?.yearlyReset ?? "—"}
          icon={<RotateCcw className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* ── Toolbar ── */}
      <div className="mb-4">
        <GlobalToolbar
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search sequences..."
          onRefresh={() => window.location.reload()}
          actions={
            <Button
              size="sm"
              onClick={handleCreate}
              className="bg-foreground text-background hover:bg-foreground/90 rounded-sm text-xs px-3"
            >
              <Plus className="h-3 w-3 mr-1" />
              New Sequence
            </Button>
          }
        />
      </div>

      {/* ── Data Table ── */}
      <DataTable<SequenceConfig>
        columns={columns}
        data={configs ?? []}
        keyExtractor={(c: SequenceConfig) => c._id}
        isLoading={configs === undefined}
        emptyTitle="No sequence configurations"
        emptyDescription="Create your first sequence to start generating automatic numbers."
        emptyIcon={<Hash className="h-5 w-5" />}
      />

      {/* ── Create/Edit Dialog ── */}
      <CrudDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingId ? "Edit Sequence" : "Create Sequence"}
        description={
          editingId
            ? `Editing "${editingConfig?.code || ""}"`
            : "Configure a new number sequence for any module."
        }
        fields={dialogFields}
        defaultValues={dialogDefaultValues as Record<string, string>}
        onSubmit={handleSubmit}
        submitLabel={editingId ? "Update" : "Create"}
      />

      {/* ── Preview Dialog ── */}
      <Dialog open={!!previewId} onOpenChange={(o: boolean) => !o && setPreviewId(null)}>
        <DialogContent className="sm:max-w-sm rounded-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-normal tracking-tight">
              Preview Next Number
            </DialogTitle>
          </DialogHeader>
          {preview ? (
            <div className="py-4 text-center">
              <p className="text-2xl font-mono tracking-tight text-foreground">
                {preview.nextNumber}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Effective number: {preview.effectiveNumber}
                {preview.wouldReset && (
                  <span className="block mt-1 text-amber-600/70">
                    ⚠ Sequence will reset before generating
                  </span>
                )}
              </p>
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-muted-foreground animate-pulse">
              Loading...
            </div>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewId(null)}
              className="text-xs text-muted-foreground"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Generate Confirm Dialog ── */}
      <Dialog
        open={!!generateDialogId}
        onOpenChange={(o: boolean) => !o && setGenerateDialogId(null)}
      >
        <DialogContent className="sm:max-w-sm rounded-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-normal tracking-tight">
              Generate Next Number
            </DialogTitle>
            <DialogDescription className="text-xs">
              This will consume and record the next number in the sequence.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGenerateDialogId(null)}
              className="text-xs text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() =>
                generateDialogId && handleGenerate(generateDialogId)
              }
              className="bg-foreground text-background hover:bg-foreground/90 rounded-sm text-xs"
            >
              <Play className="h-3 w-3 mr-1" />
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reset Confirm Dialog ── */}
      <Dialog
        open={!!resetDialogId}
        onOpenChange={(o: boolean) => !o && setResetDialogId(null)}
      >
        <DialogContent className="sm:max-w-sm rounded-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-normal tracking-tight">
              Reset Sequence
            </DialogTitle>
            <DialogDescription className="text-xs">
              This will reset the counter back to its start number. This action
              is audited.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setResetDialogId(null)}
              className="text-xs text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => resetDialogId && handleReset(resetDialogId)}
              className="rounded-sm text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── History Dialog ── */}
      <Dialog
        open={!!historyId}
        onOpenChange={(o: boolean) => !o && setHistoryId(null)}
      >
        <DialogContent className="sm:max-w-lg rounded-sm max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-normal tracking-tight">
              Generation History
            </DialogTitle>
            <DialogDescription className="text-xs">
              Last 20 generated numbers
            </DialogDescription>
          </DialogHeader>
          <Separator />
          {history === undefined ? (
            <div className="py-6 text-center text-xs text-muted-foreground animate-pulse">
              Loading...
            </div>
          ) : history.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-xs text-muted-foreground">No history yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {history.map((entry: HistoryEntry, idx: number) => (
                <div
                  key={entry._id}
                  className="flex items-center justify-between py-1.5 px-2 rounded-sm hover:bg-accent/30 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-foreground">{entry.number}</span>
                    {entry.entityType && (
                      <span className="text-muted-foreground/60">{entry.entityType}</span>
                    )}
                  </div>
                  <span className="text-muted-foreground/50">
                    {format(entry.generatedAt, "MMM d, HH:mm")}
                  </span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHistoryId(null)}
              className="text-xs text-muted-foreground"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudioLayout>
  );
}
