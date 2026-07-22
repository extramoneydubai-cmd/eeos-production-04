import { useEffect, useState, useCallback, useRef } from "react";
import { errorLog, type ErrorLogEntry } from "@/lib/error-logger";
import { X, Bug, Trash2, ChevronDown, ChevronUp, Copy } from "lucide-react";

const SOURCE_BADGES: Record<string, string> = {
  react: "bg-red-100 text-red-700",
  boundary: "bg-orange-100 text-orange-700",
  global: "bg-purple-100 text-purple-700",
  promise: "bg-blue-100 text-blue-700",
};

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [entries, setEntries] = useState<ErrorLogEntry[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevCountRef = useRef(0);

  // Listen for keyboard shortcut: Ctrl+Shift+E
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "E") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Listen for custom event to open panel (from error toast)
    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener("eeos:open-debug-panel", handleOpenEvent);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("eeos:open-debug-panel", handleOpenEvent);
    };
  }, []);

  // Refresh entries periodically and on open
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

  // Refresh when toggling open
  useEffect(() => {
    if (isOpen) refresh();
  }, [isOpen, refresh]);

  const handleClear = () => {
    errorLog.clear();
    setEntries([]);
    setExpandedId(null);
    prevCountRef.current = 0;
    setUnreadCount(0);
  };

  const handleCopy = (entry: ErrorLogEntry) => {
    const text = `[${entry.source}] ${entry.message}
Route: ${entry.route}
Time: ${new Date(entry.timestamp).toLocaleString()}
Stack:
${entry.stack}
${entry.componentStack ? `\nComponent Stack:\n${entry.componentStack}` : ""}`;
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <>
      {/* Floating badge — shows error count */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 z-[9999] flex items-center gap-1.5 px-3 py-2 rounded-full shadow-lg transition-all duration-200 hover:scale-105 ${
          unreadCount > 0
            ? "bg-red-500 text-white animate-pulse"
            : "bg-[#1a1a2e] text-white/70 hover:text-white"
        }`}
        title="Open Debug Panel (Ctrl+Shift+E)"
      >
        <Bug className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="text-[11px] font-semibold">{unreadCount}</span>
        )}
      </button>

      {/* Debug panel overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="relative w-full sm:max-w-2xl max-h-[80vh] bg-white rounded-t-xl sm:rounded-xl shadow-2xl border border-[#e8eaed] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8eaed] bg-[#fafafa] shrink-0">
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4 text-[#5f6368]" />
                <span className="text-[13px] font-semibold text-[#1a1a2e]">Error Log</span>
                <span className="text-[10px] text-[#9aa0a6] bg-[#f1f3f4] px-1.5 py-0.5 rounded">
                  {entries.length} errors
                </span>
                {entries.length > 0 && (
                  <span className="text-[10px] text-[#9aa0a6]">
                    — newest first
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClear}
                  disabled={entries.length === 0}
                  className="px-2 py-1 text-[10px] text-[#5f6368] hover:text-[#ea4335] hover:bg-[#fce8e6] rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  title="Clear all logged errors"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-[#9aa0a6] hover:text-[#5f6368] hover:bg-[#f1f3f4] rounded transition-colors"
                  title="Close (Ctrl+Shift+E)"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bug className="h-10 w-10 text-[#e8eaed] mb-2" />
                  <p className="text-[13px] text-[#9aa0a6]">No errors captured yet</p>
                  <p className="text-[10px] text-[#dadce0] mt-0.5">
                    Runtime errors will appear here automatically
                  </p>
                </div>
              ) : (
                entries.map((entry) => {
                  const isExpanded = expandedId === entry.id;
                  return (
                    <div
                      key={entry.id}
                      className="rounded-lg border border-[#e8eaed] overflow-hidden transition-shadow hover:shadow-sm"
                    >
                      {/* Collapsed row */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        className="w-full flex items-start gap-2 p-2.5 text-left hover:bg-[#fafafa] transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span
                              className={`text-[9px] font-medium px-1 py-0.5 rounded ${
                                SOURCE_BADGES[entry.source] || "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {entry.source}
                            </span>
                            <span className="text-[9px] text-[#9aa0a6]">
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </span>
                            <span className="text-[9px] text-[#dadce0] truncate ml-auto">
                              {entry.route}
                            </span>
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
                              handleCopy(entry);
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

                      {/* Expanded stack trace */}
                      {isExpanded && (
                        <div className="px-2.5 pb-2.5 border-t border-[#f1f3f4]">
                          <pre className="mt-2 p-2 rounded bg-[#1a1a2e] text-[10px] text-green-300 leading-relaxed overflow-x-auto max-h-48 overflow-y-auto [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-[#333]">
                            {entry.stack || "No stack trace"}
                          </pre>
                          {entry.componentStack && (
                            <>
                              <p className="text-[9px] text-[#9aa0a6] mt-1.5 mb-0.5 font-medium">
                                Component Stack:
                              </p>
                              <pre className="p-2 rounded bg-[#f8f9fa] border border-[#e8eaed] text-[10px] text-[#5f6368] leading-relaxed overflow-x-auto max-h-32 overflow-y-auto">
                                {entry.componentStack}
                              </pre>
                            </>
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
                Press <kbd className="px-1 py-0.5 bg-[#f1f3f4] border border-[#e8eaed] rounded text-[9px] font-mono mx-0.5">Ctrl+Shift+E</kbd> to toggle
              </span>
              <span className="text-[9px] text-[#dadce0]">
                Max {100} entries • sessionStorage persisted
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
