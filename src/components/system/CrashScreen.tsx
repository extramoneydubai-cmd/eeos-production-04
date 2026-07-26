import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home, Bug, Download, Trash2, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { errorLog } from "@/lib/error-logger";

interface CrashScreenProps {
  /** The error that caused the crash */
  error?: Error | null;
  /** Optional error ID for diagnostics */
  errorId?: string;
  /** Whether this is a recoverable error */
  recoverable?: boolean;
}

/**
 * Global CrashScreen — shown when the React root becomes corrupted.
 * Instead of a white screen, shows a user-friendly recovery page with
 * error details, retry options, and diagnostic export.
 */
export function CrashScreen({ error, errorId, recoverable = true }: CrashScreenProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [timestamp] = useState(() => new Date().toISOString());

  // Log the crash automatically
  useEffect(() => {
    if (error) {
      errorLog.push({
        message: error.message || "Unknown crash",
        stack: error.stack || "",
        source: "react",
        componentStack: undefined,
      });
    }
  }, [error]);

  const handleReload = () => {
    window.location.reload();
  };

  const handleClearCache = () => {
    // Clear session storage and service worker caches
    try {
      sessionStorage.clear();
      // Clear all caches
      if ("caches" in window) {
        caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
      }
      // Unregister service workers
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) =>
          regs.forEach((reg) => reg.unregister())
        );
      }
    } catch {}
    window.location.reload();
  };

  const handleDownloadLogs = () => {
    const json = errorLog.exportToJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eeos-crash-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestartSession = () => {
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch {}
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-lg w-full"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-red-50 border border-red-100">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-semibold text-[#1a1a2e] text-center mb-2">
          EEOS encountered a {recoverable ? "recoverable" : "critical"} problem
        </h1>
        <p className="text-[13px] text-[#5f6368] text-center mb-6 leading-relaxed">
          {recoverable
            ? "The application encountered an issue and can recover. Try reloading or restarting your session."
            : "The application cannot recover from this error. Please restart your session."}
        </p>

        {/* Diagnostics card */}
        <div className="bg-white rounded-lg border border-[#e8eaed] p-4 mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#9aa0a6] font-medium">Error ID</span>
            <span className="text-[11px] font-mono text-[#5f6368]">
              {errorId || errorLog.getAll()[0]?.id || "N/A"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#9aa0a6] font-medium">Timestamp</span>
            <span className="text-[11px] text-[#5f6368]">{timestamp}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#9aa0a6] font-medium">Route</span>
            <span className="text-[11px] text-[#5f6368]">
              {typeof window !== "undefined" ? window.location.pathname : "N/A"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#9aa0a6] font-medium">Recoverable</span>
            <span className={`text-[11px] font-medium ${recoverable ? "text-green-600" : "text-red-500"}`}>
              {recoverable ? "Yes" : "No"}
            </span>
          </div>

          {/* Error details toggle */}
          {error && (
            <div className="pt-1">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-[11px] text-[#1a73e8] hover:text-[#1557b0] font-medium"
              >
                {showDetails ? "Hide error details" : "Show error details"}
              </button>
              {showDetails && (
                <pre className="mt-2 p-3 bg-[#1a1a2e] text-green-300 text-[10px] leading-relaxed rounded-lg overflow-x-auto max-h-48">
                  {error.message}
                  {"\n"}
                  {error.stack}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={handleReload}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a73e8] text-white text-[12px] font-medium rounded-lg hover:bg-[#1557b0] transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reload
          </button>
          <button
            onClick={handleRestartSession}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f1f3f4] text-[#5f6368] text-[12px] font-medium rounded-lg hover:bg-[#e8eaed] transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Restart Session
          </button>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f1f3f4] text-[#5f6368] text-[12px] font-medium rounded-lg hover:bg-[#e8eaed] transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            Return Home
          </button>
          <button
            onClick={handleClearCache}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#fce8e6] text-[#ea4335] text-[12px] font-medium rounded-lg hover:bg-[#f5c6c2] transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Cache
          </button>
        </div>

        {/* Secondary actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleDownloadLogs}
            className="flex items-center gap-1.5 text-[11px] text-[#5f6368] hover:text-[#1a1a2e] transition-colors"
          >
            <Download className="h-3 w-3" />
            Download Logs
          </button>
          <span className="text-[#dadce0]">|</span>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("eeos:open-debug-panel"))}
            className="flex items-center gap-1.5 text-[11px] text-[#5f6368] hover:text-[#1a1a2e] transition-colors"
          >
            <Bug className="h-3 w-3" />
            Open Debug
          </button>
        </div>

        {/* Footer */}
        <p className="text-[10px] text-[#dadce0] text-center mt-8">
          EEOS Stability Layer v2 — Automatic recovery enabled
        </p>
      </motion.div>
    </div>
  );
}
