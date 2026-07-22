import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Upload, FileText, FileImage, FileArchive, File,
  Download, Trash2, RotateCcw, Archive, History,
  Filter, Search, X, FileSpreadsheet, FileVideo,
  FileAudio, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** File category type matching the backend */
type FileCategory =
  | "identity" | "academic" | "finance" | "hr" | "medical" | "legal"
  | "communication" | "marketing" | "general" | "custom";

/** Attachment field shape used by the UI */
interface AttachmentField {
  _id: string;
  _creationTime: number;
  fileName: string;
  originalName: string;
  size: number;
  extension: string;
  mimeType: string;
  category: string;
  entityType: string;
  entityId: string;
  description?: string;
  tags?: string[];
  currentVersion: number;
  status: string;
  uploadedBy: string;
  createdAt: number;
}

interface AttachmentPanelProps {
  entityType: string;
  entityId: string;
  attachments?: AttachmentField[];
  isLoading?: boolean;
  /** Called when files are dropped/selected for upload */
  onUpload?: (files: File[]) => void;
  /** Called when an attachment should be deleted */
  onDelete?: (attachmentId: string) => void;
  /** Called to restore a deleted attachment */
  onRestore?: (attachmentId: string) => void;
  /** Called to download an attachment */
  onDownload?: (attachmentId: string) => void;
  /** If true, shows upload area and delete buttons */
  canEdit?: boolean;
}

const categoryLabels: Record<string, string> = {
  identity: "Identity", academic: "Academic", finance: "Finance",
  hr: "HR", medical: "Medical", legal: "Legal",
  communication: "Communication", marketing: "Marketing",
  general: "General", custom: "Custom",
};

const categoryColors: Record<string, string> = {
  identity: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  academic: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  finance: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  hr: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  medical: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  legal: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  communication: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  marketing: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  general: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20",
  custom: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
};

function getFileIcon(extension: string) {
  const ext = extension.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "svg", "webp", "ico"].includes(ext)) return FileImage;
  if (["pdf"].includes(ext)) return FileText;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return FileArchive;
  if (["xls", "xlsx", "csv"].includes(ext)) return FileSpreadsheet;
  if (["mp4", "avi", "mov", "mkv", "webm"].includes(ext)) return FileVideo;
  if (["mp3", "wav", "ogg", "flac"].includes(ext)) return FileAudio;
  if (["doc", "docx"].includes(ext)) return FileText;
  if (["ppt", "pptx"].includes(ext)) return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(1)} GB`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function AttachmentPanel({
  entityType,
  entityId,
  attachments,
  isLoading,
  onUpload,
  onDelete,
  onRestore,
  onDownload,
  canEdit = false,
}: AttachmentPanelProps) {
  const [dragOver, setDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = (attachments ?? []).filter((a) => {
    if (categoryFilter && a.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.fileName.toLowerCase().includes(q) ||
        a.originalName.toLowerCase().includes(q) ||
        (a.description || "").toLowerCase().includes(q)
      );
    }
    return a.status === "active" || a.status === "archived";
  });

  const categories = [...new Set((attachments ?? []).map((a) => a.category))];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (!canEdit) return;
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0 && onUpload) {
        onUpload(files);
      }
    },
    [canEdit, onUpload],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length > 0 && onUpload) {
        onUpload(files);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [onUpload],
  );

  const selected = selectedId
    ? (attachments ?? []).find((a) => a._id === selectedId)
    : null;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full h-8 pl-7 pr-2 text-xs rounded-sm border border-border/50 bg-transparent focus:outline-none focus:border-border text-muted-foreground placeholder:text-muted-foreground/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="flex gap-1 flex-wrap">
          {categories.slice(0, 5).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
              className={cn(
                "px-2 py-1 text-[10px] uppercase tracking-wider rounded-sm border transition-colors",
                categoryFilter === cat
                  ? categoryColors[cat] || categoryColors.general
                  : "border-border/30 text-muted-foreground/50 hover:text-foreground hover:border-border/60",
              )}
            >
              {categoryLabels[cat] || cat}
            </button>
          ))}
        </div>
        {canEdit && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3 w-3" />
              Upload
            </Button>
          </>
        )}
      </div>

      {/* ── Drop Zone ── */}
      {canEdit && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-2 py-6 rounded-sm border-2 border-dashed transition-colors cursor-pointer",
            dragOver
              ? "border-foreground/40 bg-accent/20"
              : "border-border/30 hover:border-border/50",
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-5 w-5 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">
            {dragOver ? "Drop files here" : "Drag & drop files or click to browse"}
          </p>
          <p className="text-[10px] text-muted-foreground/40">
            Max 100 MB per file
          </p>
        </div>
      )}

      {/* ── Loading State ── */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/60" />
        </div>
      )}

      {/* ── Empty State ── */}
      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <File className="h-6 w-6 text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">No files attached</p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            {canEdit ? "Drop files here or click Upload to add files." : "No attachments for this entity."}
          </p>
        </div>
      )}

      {/* ── File List ── */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-1">
          {filtered.map((attachment) => {
            const Icon = getFileIcon(attachment.extension);
            const isDeleted = attachment.status === "deleted";
            return (
              <div
                key={attachment._id}
                className={cn(
                  "flex items-start gap-3 px-3 py-2.5 rounded-sm transition-colors cursor-pointer group",
                  selectedId === attachment._id
                    ? "bg-accent"
                    : "hover:bg-accent/50",
                  isDeleted && "opacity-40",
                )}
                onClick={() => setSelectedId(selectedId === attachment._id ? null : attachment._id)}
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-accent/50">
                  <Icon className="h-3.5 w-3.5 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium truncate">
                      {attachment.originalName}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[8px] px-1 py-0 h-3.5 font-normal uppercase tracking-wider shrink-0",
                        categoryColors[attachment.category] || categoryColors.general,
                      )}
                    >
                      {categoryLabels[attachment.category] || attachment.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-muted-foreground/50">
                      {formatFileSize(attachment.size)}
                    </p>
                    <span className="text-[10px] text-muted-foreground/30">·</span>
                    <p className="text-[10px] text-muted-foreground/50">
                      {attachment.extension.toUpperCase()}
                    </p>
                    <span className="text-[10px] text-muted-foreground/30">·</span>
                    <p className="text-[10px] text-muted-foreground/50">
                      {formatDate(attachment.createdAt)}
                    </p>
                    {attachment.currentVersion > 1 && (
                      <>
                        <span className="text-[10px] text-muted-foreground/30">·</span>
                        <p className="text-[10px] text-muted-foreground/50">
                          v{attachment.currentVersion}
                        </p>
                      </>
                    )}
                  </div>
                  {attachment.description && (
                    <p className="text-[10px] text-muted-foreground/40 mt-0.5 truncate">
                      {attachment.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onDownload && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDownload(attachment._id); }}
                      className="p-1 text-muted-foreground/40 hover:text-foreground transition-colors"
                      aria-label="Download"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                  )}
                  {canEdit && !isDeleted && onDelete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(attachment._id); }}
                      className="p-1 text-muted-foreground/40 hover:text-destructive transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                  {canEdit && isDeleted && onRestore && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRestore(attachment._id); }}
                      className="p-1 text-muted-foreground/40 hover:text-emerald-500 transition-colors"
                      aria-label="Restore"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Selected File Detail ── */}
      {selected && (
        <>
          <Separator />
          <div className="px-1 py-1">
            <div className="flex items-center gap-2 mb-2">
              <History className="h-3 w-3 text-muted-foreground" />
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                File Details
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
              <div>
                <span className="text-muted-foreground/50">Name</span>
                <p className="text-foreground truncate">{selected.originalName}</p>
              </div>
              <div>
                <span className="text-muted-foreground/50">Size</span>
                <p className="text-foreground">{formatFileSize(selected.size)}</p>
              </div>
              <div>
                <span className="text-muted-foreground/50">Type</span>
                <p className="text-foreground">{selected.mimeType}</p>
              </div>
              <div>
                <span className="text-muted-foreground/50">Version</span>
                <p className="text-foreground">{selected.currentVersion}</p>
              </div>
              <div>
                <span className="text-muted-foreground/50">Category</span>
                <p className="text-foreground">{categoryLabels[selected.category] || selected.category}</p>
              </div>
              <div>
                <span className="text-muted-foreground/50">Status</span>
                <p className="text-foreground capitalize">{selected.status}</p>
              </div>
              {selected.tags && selected.tags.length > 0 && (
                <div className="col-span-2">
                  <span className="text-muted-foreground/50">Tags</span>
                  <div className="flex gap-1 mt-0.5 flex-wrap">
                    {selected.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-normal">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {selected.description && (
                <div className="col-span-2">
                  <span className="text-muted-foreground/50">Description</span>
                  <p className="text-foreground">{selected.description}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
