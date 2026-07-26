import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { errorLog, type ErrorLogEntry, type ErrorSeverity, type ErrorSource, SEVERITY_COLORS } from "@/lib/error-logger";
import {
  X, Bug, Trash2, ChevronDown, ChevronUp, Copy, Search,
  Download, Filter, FileJson, FileText, Github,
  Minus, Plus, AlertTriangle, AlertCircle, Info,
} from "lucide-react";
import { getBuildInfo } from "@/platform/core/buildHealth";

const SOURCE_BADGES: Record<string, string> = {
  react: "bg-red-100 text-red-700",
  boundary: "bg-orange-100 text-orange-700",
  global: "bg-purple-100 text-purple-700",
  promise: "bg-blue-100 text-blue-700",
  chunk: "bg-pink-100 text-pink-700",
  convex: "bg-indigo-100 text-indigo-700",
  sdk: "bg-teal-100 text-teal-700",
  build: "bg-gray-100 text-gray-700",
};

const SEVERITY_ICONS: Record<string, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  critical: AlertCircle,
  fatal: AlertCircle,
};

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedAll, setExpandedAll] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [entries, setEntries] = useState<ErrorLogEntry[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<ErrorSeverity | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<ErrorSource | "all">("all");
  const prevCountRef = useRef(0);
  const searchRef = useRef<HTMLInputElement>(null);

  // Read build info
  const buildInfo = useMemo(() => {
    try { return getBuildInfo(); } catch { return null; }
  }, []);

  // Listen for keyboard shortcut: Ctrl+Shift+E
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "E") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      // Ctrl+F inside panel
      if (e.ctrlKey && e.key === "f" && isOpen) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener("eeos:open-debug-panel", handleOpenEvent);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("eeos:open-debug-panel", handleOpenEvent);
    };
  }, [isOpen]);

  // Refresh entries
  const refresh = useCallback(() => {
    const all = errorLog.getAll();
    setEntries(all);
    const count = all.length - prevCountRef.current;
    if (count > 0 && !isOpen) {
      setUnreadCount((prev) => prev + count);
    }
    if (isOpen) {
      setUnreadCount(0);
    }
    prevCountRef.current = all.length;
  }, [isOpen]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (isOpen) refresh();
  }, [isOpen, refresh]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    let result = entries;
    if (severityFilter !== "all") {
      result = result.filter((e) => e.severity === severityFilter);
    }
    if (sourceFilter !== "all") {
      result = result.filter((e) => e.source === sourceFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.message.toLowerCase().includes(q) ||
          e.stack.toLowerCase().includes(q) ||
          e.route.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          e.source.toLowerCase().includes(q)
      );
    }
    return result;
  }, [entries, severityFilter, sourceFilter, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(filteredEntries.map((e) => e.id)));
    setExpandedAll(true);
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
    setExpandedAll(false);
  };

  const handleClear = () => {
    errorLog.clear();
    setEntries([]);
    setExpandedIds(new Set());
    prevCountRef.current = 0;
    setUnreadCount(0);
  };

  const handleCopySingle = (entry: ErrorLogEntry) => {
    const text = `[${entry.severity.toUpperCase()}][${entry.source}] ${entry.message}
ID: ${entry.id}
Route: ${entry.route}
Time: ${new Date(entry.timestamp).toLocaleString()}
Stack:
${entry.stack}
${entry.componentStack ? `\nComponent Stack:\n${entry.componentStack}` : ""}`;
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const handleCopyAll = () => {
    const text = filteredEntries
      .map((e) => `[${e.severity.toUpperCase()}][${e.source}] ${e.message} (${e.id})`)
      .join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const handleDownloadJson = () => {
    const json = errorLog.exportToJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eeos-error-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    const md = errorLog.exportToMarkdown();
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eeos-error-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = { all: entries.length };
    for (const e of entries) {
      counts[e.severity] = (counts[e.severity] || 0) + 1;
    }
    return counts;
  }, [entries]);

  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = { all: entries.length };
    for (const e of entries) {
      counts[e.source] = (counts[e.source] || 0) + 1;
    }
    return counts;
  }, [entries]);

  const hasFatal = entries.some((e) => e.severity === "fatal");
  const hasCritical = entries.some((e) => e.severity === "critical");

  return (
    <>
      {/* Floating badge */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 z-[9999] flex items-center gap-1.5 px-3 py-2 rounded-full shadow-lg transition-all duration-200 hover:scale-105 ${
          hasFatal
            ? "bg-red-700 text-white animate-pulse"
            : hasCritical
            ? "bg-red-500 text-white"
            : unreadCount > 0
            ? "bg-orange-500 text-white"
            : "bg-[#1a1a2e] text-white/70 hover:text-white"
        }`}
        title="Open Debug Panel (Ctrl+Shift+E)"
      >
        <Bug className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="text-[11px] font-semibold">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full sm:max-w-3xl max-h-[85vh] bg-white rounded-t-xl sm:rounded-xl shadow-2xl border border-[#e8eaed] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e8eaed] bg-[#fafafa] shrink-0">
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4 text-[#5f6368]" />
                <span className="text-[13px] font-semibold text-[#1a1a2e]">Error Log</span>
                {/* Severity badges */}
                {entries.length > 0 && (
                  <div className="flex items-center gap-1">
                    {(["fatal", "critical", "error", "warning"] as const).map((sev) => {
                      const count = severityCounts[sev] || 0;
                      if (count === 0) return null;
                      const colors = SEVERITY_COLORS[sev].split(" ");
                      return (
                        <span
                          key={sev}
                          className={`text-[9px] font-medium px-1 py-0.5 rounded cursor-pointer ${
                            sev === severityFilter ? "ring-2 ring-offset-1" : ""
                          } ${colors[0]} ${colors[1]}`}
                          onClick={() => setSeverityFilter(sev === severityFilter ? "all" : sev)}
                        >
                          {sev}:{count}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={expandAll}
                  disabled={filteredEntries.length === 0}
                  className="px-2 py-1 text-[10px] text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#e8f0fe] rounded transition-colors disabled:opacity-40 flex items-center gap-1"
                  title="Expand all"
                >
                  <Plus className="h-3 w-3" /> All
                </button>
                <button
                  onClick={collapseAll}
                  disabled={filteredEntries.length === 0}
                  className="px-2 py-1 text-[10px] text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#e8f0fe] rounded transition-colors disabled:opacity-40 flex items-center gap-1"
                  title="Collapse all"
                >
                  <Minus className="h-3 w-3" /> All
                </button>
                <button
                  onClick={handleCopyAll}
                  disabled={filteredEntries.length === 0}
                  className="px-2 py-1 text-[10px] text-[#5f6368] hover:text-[#34a853] hover:bg-[#e6f4ea] rounded transition-colors disabled:opacity-40 flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" /> Copy
                </button>
                <button
                  onClick={handleDownloadJson}
                  disabled={entries.length === 0}
                  className="px-2 py-1 text-[10px] text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#e8f0fe] rounded transition-colors disabled:opacity-40 flex items-center gap-1"
                >
                  <FileJson className="h-3 w-3" /> JSON
                </button>
                <button
                  onClick={handleDownloadMarkdown}
                  disabled={entries.length === 0}
                  className="px-2 py-1 text-[10px] text-[#5f6368] hover:text-[#a855f7] hover:bg-[#f3e8ff] rounded transition-colors disabled:opacity-40 flex items-center gap-1"
                >
                  <FileText className="h-3 w-3" /> MD
                </button>
                <button
                  onClick={handleClear}
                  disabled={entries.length === 0}
                  className="px-2 py-1 text-[10px] text-[#5f6368] hover:text-[#ea4335] hover:bg-[#fce8e6] rounded transition-colors disabled:opacity-40 flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-[#9aa0a6] hover:text-[#5f6368] hover:bg-[#f1f3f4] rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Search + Filters */}
            <div className="px-4 py-2 border-b border-[#e8eaed] bg-white shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9aa0a6]" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search errors... (Ctrl+F)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 text-[12px] bg-[#f8f9fa] border border-[#e8eaed] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent placeholder:text-[#9aa0a6]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9aa0a6] hover:text-[#5f6368]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value as ErrorSeverity | "all")}
                  className="h-8 px-2 text-[11px] bg-[#f8f9fa] border border-[#e8eaed] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a73e8] text-[#5f6368]"
                >
                  <option value="all">All Severity ({entries.length})</option>
                  {(["fatal", "critical", "error", "warning", "info"] as const).map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)} ({severityCounts[s] || 0})
                    </option>
                  ))}
                </select>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as ErrorSource | "all")}
                  className="h-8 px-2 text-[11px] bg-[#f8f9fa] border border-[#e8eaed] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1a73e8] text-[#5f6368]"
                >
                  <option value="all">All Sources</option>
                  {(["react", "boundary", "global", "promise", "chunk", "convex", "sdk", "build"] as const).map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)} ({sourceCounts[s] || 0})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {filteredEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bug className="h-10 w-10 text-[#e8eaed] mb-2" />
                  <p className="text-[13px] text-[#9aa0a6]">
                    {searchQuery || severityFilter !== "all" || sourceFilter !== "all"
                      ? "No errors match your filters"
                      : "No errors captured yet"}
                  </p>
                  <p className="text-[10px] text-[#dadce0] mt-0.5">
                    {searchQuery || severityFilter !== "all" || sourceFilter !== "all"
                      ? "Try adjusting your search or filters"
                      : "Runtime errors will appear here automatically"}
                  </p>
                </div>
              ) : (
                filteredEntries.map((entry) => {
                  const isExpanded = expandedIds.has(entry.id);
                  const SeverityIcon = SEVERITY_ICONS[entry.severity] || Info;

                  return (
                    <div
                      key={entry.id}
                      className={`rounded-lg border overflow-hidden transition-shadow hover:shadow-sm ${
                        entry.severity === "fatal"
                          ? "border-red-300 bg-red-50/30"
                          : entry.severity === "critical"
                          ? "border-orange-200 bg-orange-50/20"
                          : "border-[#e8eaed]"
                      }`}
                    >
                      {/* Row */}
                      <button
                        onClick={() => toggleExpand(entry.id)}
                        className="w-full flex items-start gap-2 p-2.5 text-left hover:bg-[#fafafa] transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            {/* Severity badge */}
                            <span
                              className={`text-[9px] font-medium px-1 py-0.5 rounded flex items-center gap-0.5 ${
                                SEVERITY_COLORS[entry.severity] || "bg-gray-100 text-gray-700"
                              }`}
                            >
                              <SeverityIcon className="h-2.5 w-2.5" />
                              {entry.severity.toUpperCase()}
                            </span>
                            {/* Source badge */}
                            <span
                              className={`text-[9px] font-medium px-1 py-0.5 rounded ${
                                SOURCE_BADGES[entry.source] || "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {entry.source}
                            </span>
                            {/* Retry count */}
                            {(entry.retryCount ?? 0) > 0 && (
                              <span className="text-[9px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded">
                                ×{entry.retryCount}
                              </span>
                            )}
                            {/* Time */}
                            <span className="text-[9px] text-[#9aa0a6]">
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </span>
                            {/* Route */}
                            <span className="text-[9px] text-[#dadce0] truncate max-w-[120px]">
                              {entry.route}
                            </span>
                            {/* Module */}
                            {entry.metadata?.module && (
                              <span className="text-[9px] bg-[#f1f3f4] text-[#5f6368] px-1 py-0.5 rounded">
                                {entry.metadata.module}
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] font-medium text-[#1a1a2e] leading-tight truncate">
                            {entry.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0 mt-1">
                          <span
                            className="p-0.5 text-[#9aa0a6] hover:text-[#5f6368] hover:bg-[#f1f3f4] rounded"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopySingle(entry);
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5 text-[#9aa0a6]" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-[#9aa0a6]" />
                          )}
                        </div>
                      </button>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="px-2.5 pb-2.5 border-t border-[#f1f3f4]">
                          {/* Message */}
                          <p className="mt-2 text-[11px] text-[#5f6368] font-medium">{entry.message}</p>

                          {/* Stack trace */}
                          <pre className="mt-1 p-2 rounded bg-[#1a1a2e] text-[10px] text-green-300 leading-relaxed overflow-x-auto max-h-48 overflow-y-auto">
                            {entry.stack || "No stack trace"}
                          </pre>

                          {/* Component stack */}
                          {entry.componentStack && (
                            <>
                              <p className="text-[9px] text-[#9aa0a6] mt-1.5 mb-0.5 font-medium">Component Stack:</p>
                              <pre className="p-2 rounded bg-[#f8f9fa] border border-[#e8eaed] text-[10px] text-[#5f6368] leading-relaxed overflow-x-auto max-h-32 overflow-y-auto">
                                {entry.componentStack}
                              </pre>
                            </>
                          )}

                          {/* Metadata */}
                          {entry.metadata && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {entry.metadata.sdk && (
                                <span className="text-[9px] bg-teal-50 text-teal-700 px-1 py-0.5 rounded">SDK: {entry.metadata.sdk}</span>
                              )}
                              {entry.metadata.queryName && (
                                <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded">Query: {entry.metadata.queryName}</span>
                              )}
                              {entry.metadata.userRole && (
                                <span className="text-[9px] bg-purple-50 text-purple-700 px-1 py-0.5 rounded">Role: {entry.metadata.userRole}</span>
                              )}
                              {entry.metadata.browser && (
                                <span className="text-[9px] bg-gray-50 text-gray-500 px-1 py-0.5 rounded truncate max-w-[200px]">
                                  {entry.metadata.browser.slice(0, 80)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-4 py-2 border-t border-[#e8eaed] bg-[#fafafa] flex items-center justify-between">
              <span className="text-[9px] text-[#9aa0a6]">
                Press <kbd className="px-1 py-0.5 bg-[#f1f3f4] border border-[#e8eaed] rounded text-[9px] font-mono mx-0.5">Ctrl+Shift+E</kbd> to toggle •{" "}
                <kbd className="px-1 py-0.5 bg-[#f1f3f4] border border-[#e8eaed] rounded text-[9px] font-mono mx-0.5">Ctrl+F</kbd> to search
              </span>
              <span className="text-[9px] text-[#dadce0]">
                {filteredEntries.length}/{entries.length} • {entries.filter((e) => !e.acknowledged).length} unacknowledged
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
