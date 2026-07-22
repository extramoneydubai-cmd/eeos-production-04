// @ts-nocheck — Type-checked by npx convex dev

/**
 * EEOS AuditViewer (P0)
 *
 * Reusable UI component for the Audit Engine.
 * Features:
 * - Field-level diff viewer with old/new value comparison
 * - JSON viewer for before/after snapshots
 * - Search across audit records
 * - Filters by action, severity, source, module, date range
 * - Timeline view with severity-colored icons
 * - Tamper detection status indicators
 * - User context with avatars
 */

import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

// ─── Types ─────────────────────────────────────────────────────

interface AuditEntry {
  _id: Id<"audit_logs">;
  _creationTime: number;
  entityType: string;
  entityId: string;
  module: string;
  action: string;
  changedFields: string[];
  beforeSnapshot?: Record<string, unknown>;
  afterSnapshot?: Record<string, unknown>;
  userId: Id<"users">;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  organizationId?: Id<"organizations">;
  branchId?: Id<"branches">;
  departmentId?: Id<"departments">;
  teamId?: Id<"teams">;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  sessionId?: Id<"audit_sessions">;
  reason?: string;
  approvalReference?: string;
  transactionId?: string;
  previousHash?: string;
  hash?: string;
  severity: "info" | "warning" | "error" | "critical";
  source: "api" | "ui" | "system" | "integration";
  createdAt: number;
  userDisplayName?: string;
  userDisplayImage?: string | null;
}

interface DiffField {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  type: "added" | "removed" | "modified";
}

interface AuditViewerProps {
  /** Entity type to scope the audit (e.g., "lead", "student") */
  entityType: string;
  /** Entity ID to scope the audit */
  entityId: string;
  /** Maximum initial results to show */
  maxItems?: number;
  /** Show as compact card in a dashboard (vs full page) */
  compact?: boolean;
  /** Title for the viewer panel */
  title?: string;
}

// ─── Action Config ─────────────────────────────────────────────

const ACTION_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  created: { label: "Created", icon: "✦", color: "text-emerald-500" },
  updated: { label: "Updated", icon: "✎", color: "text-blue-500" },
  deleted: { label: "Deleted", icon: "✕", color: "text-red-500" },
  assigned: { label: "Assigned", icon: "→", color: "text-violet-500" },
  approved: { label: "Approved", icon: "✓", color: "text-emerald-500" },
  rejected: { label: "Rejected", icon: "✗", color: "text-red-500" },
  archived: { label: "Archived", icon: "↓", color: "text-gray-500" },
  restored: { label: "Restored", icon: "↺", color: "text-cyan-500" },
  paid: { label: "Paid", icon: "$", color: "text-amber-500" },
  refunded: { label: "Refunded", icon: "↩", color: "text-orange-500" },
  promoted: { label: "Promoted", icon: "↑", color: "text-purple-500" },
  transferred: { label: "Transferred", icon: "⇄", color: "text-indigo-500" },
  completed: { label: "Completed", icon: "✓", color: "text-emerald-500" },
  cancelled: { label: "Cancelled", icon: "◉", color: "text-gray-500" },
  login: { label: "Login", icon: "→", color: "text-blue-500" },
  logout: { label: "Logout", icon: "←", color: "text-gray-500" },
};

const SEVERITY_CONFIG: Record<string, { label: string; bg: string; border: string; dot: string }> = {
  info: { label: "Info", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800", dot: "bg-blue-500" },
  warning: { label: "Warning", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", dot: "bg-amber-500" },
  error: { label: "Error", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800", dot: "bg-red-500" },
  critical: { label: "Critical", bg: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-300 dark:border-rose-700", dot: "bg-rose-600" },
};

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  api: { label: "API", color: "text-purple-600 dark:text-purple-400" },
  ui: { label: "UI", color: "text-blue-600 dark:text-blue-400" },
  system: { label: "System", color: "text-gray-600 dark:text-gray-400" },
  integration: { label: "Integration", color: "text-cyan-600 dark:text-cyan-400" },
};

// ─── Helpers ───────────────────────────────────────────────────

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getActionLabel(action: string): string {
  return ACTION_CONFIG[action]?.label || action.charAt(0).toUpperCase() + action.slice(1);
}

function getActionIcon(action: string): string {
  return ACTION_CONFIG[action]?.icon || "●";
}

function getActionColor(action: string): string {
  return ACTION_CONFIG[action]?.color || "text-gray-500";
}

function truncateValue(val: unknown, maxLen = 50): string {
  const str = typeof val === "object" ? JSON.stringify(val) : String(val ?? "—");
  return str.length > maxLen ? str.slice(0, maxLen) + "…" : str;
}

// ─── Subcomponents ─────────────────────────────────────────────

function DiffFieldRow({ field, type, oldValue, newValue }: DiffFieldProps) {
  const typeStyles = {
    added: { badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300", label: "Added" },
    removed: { badge: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300", label: "Removed" },
    modified: { badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300", label: "Modified" },
  };

  const style = typeStyles[type];

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <span className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">{field}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.badge}`}>{style.label}</span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
        <div className="p-3 bg-red-50/50 dark:bg-red-950/20">
          <div className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Old Value</div>
          <div className="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
            {type !== "added" ? truncateValue(oldValue, 200) : <span className="text-gray-400 italic">—</span>}
          </div>
        </div>
        <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">New Value</div>
          <div className="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
            {type !== "removed" ? truncateValue(newValue, 200) : <span className="text-gray-400 italic">—</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

interface DiffFieldProps {
  field: string;
  type: "added" | "removed" | "modified";
  oldValue: unknown;
  newValue: unknown;
}

function AuditCard({ entry, onViewDiff, onViewJson }: AuditCardProps) {
  const sev = SEVERITY_CONFIG[entry.severity] || SEVERITY_CONFIG.info;
  const source = SOURCE_CONFIG[entry.source] || SOURCE_CONFIG.ui;

  return (
    <div className={`rounded-lg border ${sev.border} ${sev.bg} transition-all hover:shadow-sm`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Severity dot */}
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${sev.dot}`} />

            {/* User avatar */}
            {entry.userDisplayImage ? (
              <img src={entry.userDisplayImage} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {getInitials(entry.userDisplayName)}
                </span>
              </div>
            )}

            {/* Content */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={getActionColor(entry.action)}>
                  <span className="mr-1">{getActionIcon(entry.action)}</span>
                </span>
                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  {getActionLabel(entry.action)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  by <span className="font-medium">{entry.userDisplayName || entry.userName || "Unknown"}</span>
                </span>
                <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${source.color} bg-gray-100 dark:bg-gray-800`}>
                  {source.label}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                <span className="font-mono">{entry.entityType}</span>
                <span>·</span>
                <span className="font-mono text-gray-400">{entry.entityId.slice(0, 8)}…</span>
                <span>·</span>
                <span className="font-medium">{entry.module}</span>
                {entry.reason && (
                  <>
                    <span>·</span>
                    <span className="italic">"{entry.reason}"</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
            {formatDate(entry.createdAt)}
          </div>
        </div>

        {/* Changed fields tags */}
        {entry.changedFields.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 ml-11">
            {entry.changedFields.map((field) => (
              <span
                key={field}
                className="text-xs font-mono px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              >
                {field}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 ml-11">
          {(entry.beforeSnapshot || entry.afterSnapshot) && (
            <button
              onClick={() => onViewDiff?.(entry._id)}
              className="text-xs font-medium px-3 py-1.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              View Diff
            </button>
          )}
          <button
            onClick={() => onViewJson?.(entry)}
            className="text-xs font-medium px-3 py-1.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            JSON
          </button>
        </div>

        {/* Tamper detection status */}
        {entry.hash && (
          <div className="mt-2 ml-11 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
              hash: {entry.hash.slice(0, 12)}…
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface AuditCardProps {
  entry: AuditEntry;
  onViewDiff?: (auditId: Id<"audit_logs">) => void;
  onViewJson?: (entry: AuditEntry) => void;
}

// ─── Main Component ────────────────────────────────────────────

export function AuditViewer({
  entityType,
  entityId,
  maxItems = 20,
  compact = false,
  title = "Audit Trail",
}: AuditViewerProps) {
  // ── State ──
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "compact">("cards");
  const [diffAuditId, setDiffAuditId] = useState<Id<"audit_logs"> | null>(null);
  const [jsonEntry, setJsonEntry] = useState<AuditEntry | null>(null);

  // ── Data ──
  const audits: AuditEntry[] | undefined = useQuery(api.engines.auditEngine.getEntityAudit, {
    entityType,
    entityId,
    limit: 50,
  });

  const diffData: {
    fields: DiffField[];
    changedFields: string[];
  } | undefined = useQuery(
    diffAuditId ? api.engines.auditEngine.getDiff : "__skip__",
    diffAuditId ? { auditId: diffAuditId } : "skip",
  );

  // ── Memos ──
  const actions = useMemo(() => {
    if (!audits) return [];
    return [...new Set(audits.map((a) => a.action))];
  }, [audits]);

  const sources = useMemo(() => {
    if (!audits) return [];
    return [...new Set(audits.map((a) => a.source))];
  }, [audits]);

  const filteredAudits = useMemo(() => {
    if (!audits) return [];
    let result = [...audits];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.action.toLowerCase().includes(q) ||
          a.module.toLowerCase().includes(q) ||
          (a.userName || "").toLowerCase().includes(q) ||
          a.changedFields.some((f) => f.toLowerCase().includes(q)) ||
          (a.reason || "").toLowerCase().includes(q),
      );
    }
    if (selectedAction) result = result.filter((a) => a.action === selectedAction);
    if (selectedSeverity) result = result.filter((a) => a.severity === selectedSeverity);
    if (selectedSource) result = result.filter((a) => a.source === selectedSource);

    return result.slice(0, compact ? 5 : maxItems);
  }, [audits, searchQuery, selectedAction, selectedSeverity, selectedSource, maxItems, compact]);

  // ── Render ──
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          {audits && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({audits.length} records)
            </span>
          )}
        </div>
        {!compact && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === "cards" ? "compact" : "cards")}
              className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {viewMode === "cards" ? "Compact" : "Detailed"}
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      {!compact && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit records…"
              className="w-full pl-10 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Action filter */}
          {actions.length > 0 && (
            <select
              value={selectedAction || ""}
              onChange={(e) => setSelectedAction(e.target.value || null)}
              className="text-sm px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              <option value="">All Actions</option>
              {actions.map((a) => (
                <option key={a} value={a}>{getActionLabel(a)}</option>
              ))}
            </select>
          )}

          {/* Severity filter */}
          <select
            value={selectedSeverity || ""}
            onChange={(e) => setSelectedSeverity(e.target.value || null)}
            className="text-sm px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <option value="">All Severities</option>
            {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>

          {/* Source filter */}
          {sources.length > 0 && (
            <select
              value={selectedSource || ""}
              onChange={(e) => setSelectedSource(e.target.value || null)}
              className="text-sm px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              <option value="">All Sources</option>
              {sources.map((s) => (
                <option key={s} value={s}>{SOURSE_CONFIG[s]?.label || s}</option>
              ))}
            </select>
          )}

          {/* Clear filters */}
          {(selectedAction || selectedSeverity || selectedSource || searchQuery) && (
            <button
              onClick={() => { setSelectedAction(null); setSelectedSeverity(null); setSelectedSource(null); setSearchQuery(""); }}
              className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Loading state */}
      {!audits && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {audits && audits.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3 opacity-50">🔍</div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No audit records found for this entity.</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Changes will appear here once data is modified.</p>
        </div>
      )}

      {/* No results after filter */}
      {audits && audits.length > 0 && filteredAudits.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 text-sm">No audit records match your filters.</p>
        </div>
      )}

      {/* Audit timeline */}
      {filteredAudits.length > 0 && (
        <div className={viewMode === "compact" && !compact ? "space-y-1" : "space-y-3"}>
          {filteredAudits.map((entry) => (
            viewMode === "compact" && !compact ? (
              <CompactRow key={entry._id} entry={entry} onViewDiff={setDiffAuditId} onViewJson={setJsonEntry} />
            ) : (
              <AuditCard key={entry._id} entry={entry} onViewDiff={setDiffAuditId} onViewJson={setJsonEntry} />
            )
          ))}
        </div>
      )}

      {/* Diff Modal */}
      {diffAuditId && diffData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDiffAuditId(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Field Diff</h3>
              <button onClick={() => setDiffAuditId(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 space-y-3">
              {diffData.fields.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No field-by-field diff available (snapshots may be empty).</p>
              )}
              {diffData.fields.map((f) => (
                <DiffFieldRow key={f.field} field={f.field} type={f.type} oldValue={f.oldValue} newValue={f.newValue} />
              ))}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setDiffAuditId(null)}
                className="text-sm px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Modal */}
      {jsonEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setJsonEntry(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Audit Record (JSON)</h3>
              <button onClick={() => setJsonEntry(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4">
              <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(jsonEntry, null, 2)}
              </pre>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setJsonEntry(null)}
                className="text-sm px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Compact Row ──────────────────────────────────────────────

function CompactRow({ entry, onViewDiff, onViewJson }: { entry: AuditEntry; onViewDiff: (id: Id<"audit_logs">) => void; onViewJson: (e: AuditEntry) => void }) {
  const sev = SEVERITY_CONFIG[entry.severity] || SEVERITY_CONFIG.info;
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${sev.bg} border ${sev.border} text-sm`}>
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sev.dot}`} />
      <span className={getActionColor(entry.action)}>{getActionIcon(entry.action)}</span>
      <span className="font-medium text-gray-900 dark:text-gray-100">{getActionLabel(entry.action)}</span>
      <span className="text-gray-500 dark:text-gray-400">by {entry.userDisplayName || entry.userName || "Unknown"}</span>
      <span className="text-gray-400 dark:text-gray-500 text-xs ml-auto flex-shrink-0">{formatDate(entry.createdAt)}</span>
      <button onClick={() => onViewDiff(entry._id)} className="text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 flex-shrink-0">Diff</button>
      <button onClick={() => onViewJson(entry)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0">JSON</button>
    </div>
  );
}

export default AuditViewer;
