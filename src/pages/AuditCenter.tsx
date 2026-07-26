/**
 * AuditCenter — Enterprise Audit Explorer & Log Viewer
 *
 * Route: /audit
 * Features: Global audit timeline, filters, search, entity explorer,
 * user activity, module breakdown, export.
 *
 * Integrates with:
 * - AuditAggregator
 * - SecurityEngine
 * - SecurityExporter
 */

import React, { useState, useEffect, useMemo } from "react";
import { auditAggregator, type AuditEntry, type AuditFilter } from "../platform/security/AuditAggregator";
import { securityEngine } from "../platform/security/SecurityEngine";
import { securityExporter } from "../platform/security/SecurityExporter";
import {
  FileText,
  Search,
  Download,
  DownloadCloud,
  Filter,
  X,
  Clock,
  User,
  FolderTree,
  Tag,
  Globe,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Info,
  Shield,
  Activity,
  Eye,
  FileCheck,
  Copy,
  RefreshCw,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    info: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colors[severity] || colors.info}`}>
      {severity}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    security: "bg-purple-500/20 text-purple-400",
    pipeline: "bg-blue-500/20 text-blue-400",
    user_action: "bg-emerald-500/20 text-emerald-400",
    system: "bg-cyan-500/20 text-cyan-400",
    sdk: "bg-amber-500/20 text-amber-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${colors[source] || "bg-slate-500/20 text-slate-400"}`}>
      {source}
    </span>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 mx-auto mb-3 text-slate-600" />
      <h3 className="text-sm font-medium text-slate-400 mb-1">{title}</h3>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  );
}

// ─── Filter Bar ─────────────────────────────────────────────────

function FilterBar({
  filters,
  onChange,
  modules,
  types,
}: {
  filters: AuditFilter;
  onChange: (filters: AuditFilter) => void;
  modules: string[];
  types: string[];
}) {
  const [expanded, setExpanded] = useState(false);

  const clearFilters = () => {
    onChange({});
  };

  const hasActiveFilters = filters.severities?.length || filters.modules?.length || filters.types?.length || filters.query;

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 flex-1">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search audit entries..."
            value={filters.query || ""}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-200 placeholder-slate-500"
          />
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              expanded ? "bg-blue-600/20 text-blue-400" : "text-slate-400 hover:text-white"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-800 pt-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Severity</label>
              <select
                multiple
                value={filters.severities || []}
                onChange={(e) => onChange({
                  ...filters,
                  severities: Array.from(e.target.selectedOptions, (o) => o.value),
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 h-20"
              >
                {["critical", "high", "medium", "low", "info"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Module</label>
              <select
                multiple
                value={filters.modules || []}
                onChange={(e) => onChange({
                  ...filters,
                  modules: Array.from(e.target.selectedOptions, (o) => o.value),
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 h-20"
              >
                {modules.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Event Type</label>
              <select
                multiple
                value={filters.types || []}
                onChange={(e) => onChange({
                  ...filters,
                  types: Array.from(e.target.selectedOptions, (o) => o.value),
                })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 h-20"
              >
                {types.slice(0, 20).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Date Range</label>
              <div className="space-y-1">
                <input
                  type="date"
                  onChange={(e) => onChange({
                    ...filters,
                    startDate: e.target.value ? new Date(e.target.value).getTime() : undefined,
                  })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200"
                  placeholder="Start"
                />
                <input
                  type="date"
                  onChange={(e) => onChange({
                    ...filters,
                    endDate: e.target.value ? new Date(e.target.value + "T23:59:59").getTime() : undefined,
                  })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200"
                  placeholder="End"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Audit Entry Detail ─────────────────────────────────────────

function AuditEntryDetail({ entry, onClose }: { entry: AuditEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto mx-4">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Audit Entry Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={entry.severity} />
            <SourceBadge source={entry.source} />
            <span className="text-xs text-slate-400">{new Date(entry.timestamp).toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DetailField label="Event ID" value={entry.id} />
            <DetailField label="Type" value={entry.type} />
            <DetailField label="Module" value={entry.module} />
            <DetailField label="Action" value={entry.action} />
            <DetailField label="Entity" value={entry.entity || "-"} />
            <DetailField label="Entity ID" value={entry.entityId || "-"} />
            <DetailField label="Actor" value={entry.actorName || entry.actorId || "-"} />
            <DetailField label="Session" value={entry.sessionId ? `${entry.sessionId.slice(0, 12)}...` : "-"} />
            {entry.ip && <DetailField label="IP Address" value={entry.ip} />}
            {entry.browser && <DetailField label="Browser" value={entry.browser} />}
            {entry.organizationId && <DetailField label="Organization" value={entry.organizationId} />}
            {entry.companyId && <DetailField label="Company" value={entry.companyId} />}
          </div>

          {entry.details && Object.keys(entry.details).length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-slate-400 uppercase mb-2">Details</h3>
              <pre className="bg-slate-950 rounded-lg p-3 text-xs text-slate-300 overflow-x-auto">
                {JSON.stringify(entry.details, null, 2)}
              </pre>
            </div>
          )}

          {entry.before && Object.keys(entry.before).length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-slate-400 uppercase mb-2">Before</h3>
              <pre className="bg-slate-950 rounded-lg p-3 text-xs text-slate-300 overflow-x-auto">
                {JSON.stringify(entry.before, null, 2)}
              </pre>
            </div>
          )}

          {entry.after && Object.keys(entry.after).length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-slate-400 uppercase mb-2">After</h3>
              <pre className="bg-slate-950 rounded-lg p-3 text-xs text-slate-300 overflow-x-auto">
                {JSON.stringify(entry.after, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-slate-500 block mb-0.5">{label}</span>
      <span className="text-sm text-slate-200">{value}</span>
    </div>
  );
}

// ─── Main AuditCenter Component ─────────────────────────────────

export default function AuditCenter() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [filters, setFilters] = useState<AuditFilter>({});
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [page, setPage] = useState(0);
  const [modules, setModules] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const pageSize = 25;

  useEffect(() => {
    // Initialize
    securityEngine.init();
    auditAggregator.init();

    // Load data
    refreshData();

    // Refresh every 10 seconds
    const interval = setInterval(refreshData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    refreshData();
  }, [filters]);

  const refreshData = () => {
    setLoading(true);
    try {
      const filtered = auditAggregator.getEntries({ ...filters, limit: 500 });
      setEntries(filtered);
      setModules(auditAggregator.getModules());
      setTypes(auditAggregator.getEventTypes());
    } catch (e) {
      console.error("Failed to load audit entries:", e);
    }
    setLoading(false);
  };

  const paginatedEntries = useMemo(() => {
    return entries.slice(page * pageSize, (page + 1) * pageSize);
  }, [entries, page]);

  const totalPages = Math.ceil(entries.length / pageSize);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600/10 border border-purple-600/20 rounded-lg">
                <FileText className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Audit Center</h1>
                <p className="text-xs text-slate-400">
                  {entries.length} entries · {modules.length} modules · {types.length} event types
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => securityExporter.download("audit_log", "json")}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg px-3 py-2 transition-colors"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                JSON
              </button>
              <button
                onClick={() => securityExporter.download("audit_log", "csv")}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg px-3 py-2 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </button>
              <button
                onClick={() => securityExporter.download("audit_log", "markdown")}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg px-3 py-2 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                MD
              </button>
              <button
                onClick={refreshData}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg px-3 py-2 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          <FilterBar
            filters={filters}
            onChange={(f) => { setFilters(f); setPage(0); }}
            modules={modules}
            types={types}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-6">
          {[
            { label: "Total", value: entries.length, icon: FileText, color: "blue" },
            { label: "Critical", value: entries.filter((e) => e.severity === "critical").length, icon: AlertTriangle, color: "red" },
            { label: "High", value: entries.filter((e) => e.severity === "high").length, icon: Shield, color: "orange" },
            { label: "Security", value: entries.filter((e) => e.source === "security").length, icon: Shield, color: "purple" },
            { label: "System", value: entries.filter((e) => e.source === "system").length, icon: Activity, color: "cyan" },
            { label: "User", value: entries.filter((e) => e.source === "user_action").length, icon: User, color: "green" },
            { label: "Pipeline", value: entries.filter((e) => e.source === "pipeline").length, icon: Globe, color: "blue" },
            { label: "SDK", value: entries.filter((e) => e.source === "sdk").length, icon: Activity, color: "amber" },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 text-center">
              <stat.icon className={`w-4 h-4 mx-auto mb-1 text-${stat.color}-400`} />
              <div className="text-lg font-bold text-white">{stat.value}</div>
              <div className="text-[10px] text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Audit Table */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider font-medium">
            <div className="col-span-1">Severity</div>
            <div className="col-span-2">Timestamp</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-1">Source</div>
            <div className="col-span-2">Module</div>
            <div className="col-span-2">Entity</div>
            <div className="col-span-2">Actor</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-800">
            {loading ? (
              <div className="px-4 py-12 text-center text-slate-500">
                <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                Loading audit entries...
              </div>
            ) : paginatedEntries.length === 0 ? (
              <EmptyState icon={Search} title="No audit entries found" description="Try adjusting your filters or wait for new events." />
            ) : (
              paginatedEntries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <div className="md:col-span-1"><SeverityBadge severity={entry.severity} /></div>
                  <div className="md:col-span-2 text-xs text-slate-400">
                    <span className="md:hidden text-[10px] text-slate-500 mr-1">Time:</span>
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                  <div className="md:col-span-2 text-xs text-slate-300">
                    <span className="md:hidden text-[10px] text-slate-500 mr-1">Type:</span>
                    {entry.type.replace(/_/g, " ")}
                  </div>
                  <div className="md:col-span-1"><SourceBadge source={entry.source} /></div>
                  <div className="md:col-span-2 text-xs text-slate-300">
                    <span className="md:hidden text-[10px] text-slate-500 mr-1">Module:</span>
                    {entry.module}
                  </div>
                  <div className="md:col-span-2 text-xs text-slate-400 truncate">
                    <span className="md:hidden text-[10px] text-slate-500 mr-1">Entity:</span>
                    {entry.entity || "-"}
                    {entry.entityId && <span className="text-slate-500"> ({entry.entityId.slice(0, 10)}...)</span>}
                  </div>
                  <div className="md:col-span-2 text-xs text-slate-400 flex items-center gap-1">
                    <User className="w-3 h-3 shrink-0" />
                    <span>{entry.actorName || entry.actorId || "-"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-1">
            <span className="text-xs text-slate-500">
              Showing {(page * pageSize) + 1}–{Math.min((page + 1) * pageSize, entries.length)} of {entries.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400">{page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedEntry && (
        <AuditEntryDetail entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  );
}
