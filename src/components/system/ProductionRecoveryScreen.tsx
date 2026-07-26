/**
 * ProductionRecoveryScreen — Shown when production readiness validation fails during startup.
 *
 * Displays:
 *  - Failure reason
 *  - Error code
 *  - Build version
 *  - Schema version
 *  - Environment
 *  - Convex state
 *  - Recovery actions
 *
 * Buttons:
 *  - Retry
 *  - Reload
 *  - Clear Cache
 *  - Diagnostics
 *  - Download Report
 *  - Restart Session
 */

import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Trash2, Bug, Download, LogOut, Server, Database, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { productionReadinessManager, type ReadinessReport } from "@/platform/release/ProductionReadinessManager";
import { buildVersionManager } from "@/platform/release/BuildVersionManager";
import { cacheManager } from "@/platform/release/CacheManager";

interface ProductionRecoveryScreenProps {
  /** The readiness report with failure details */
  report?: ReadinessReport;
  /** Force retry handler */
  onRetry?: () => void;
}

export function ProductionRecoveryScreen({ report, onRetry }: ProductionRecoveryScreenProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [currentReport, setCurrentReport] = useState<ReadinessReport | null>(report || null);

  useEffect(() => {
    if (report) setCurrentReport(report);
  }, [report]);

  const buildInfo = buildVersionManager.getBuildInfo();

  const handleRetry = async () => {
    setIsRetrying(true);
    if (onRetry) {
      await onRetry();
    } else {
      const newReport = await productionReadinessManager.retry();
      setCurrentReport(newReport);
    }
    setIsRetrying(false);
  };

  const handleReload = () => window.location.reload();

  const handleClearCache = () => {
    cacheManager.clearAll();
    window.location.reload();
  };

  const handleDownloadReport = () => {
    if (!currentReport) return;
    const blob = new Blob([JSON.stringify(currentReport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eeos-readiness-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestartSession = () => {
    sessionStorage.clear();
    window.location.href = "/";
  };

  const failedChecks = currentReport?.checks.filter((c) => c.status === "fail") || [];
  const warnChecks = currentReport?.checks.filter((c) => c.status === "warn") || [];

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-lg w-full"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-red-50 border border-red-100">
            <Server className="h-10 w-10 text-red-500" />
          </div>
        </div>

        <h1 className="text-xl font-semibold text-[#1a1a2e] text-center mb-2">
          Production Readiness Check Failed
        </h1>
        <p className="text-[13px] text-[#5f6368] text-center mb-6 leading-relaxed">
          The platform could not pass all production readiness checks.
          {currentReport && ` Score: ${currentReport.score}/100 — ${currentReport.scoreLabel}`}
        </p>

        {/* Build Info */}
        <div className="bg-white rounded-lg border border-[#e8eaed] p-4 mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#9aa0a6] font-medium">Build Version</span>
            <span className="text-[11px] font-mono text-[#5f6368]">{buildInfo.version}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#9aa0a6] font-medium">Build Number</span>
            <span className="text-[11px] font-mono text-[#5f6368]">{buildInfo.buildNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#9aa0a6] font-medium">Environment</span>
            <span className="text-[11px] font-mono text-[#5f6368]">{buildInfo.environment}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#9aa0a6] font-medium">Git Commit</span>
            <span className="text-[11px] font-mono text-[#5f6368]">{buildInfo.gitCommit.slice(0, 12)}</span>
          </div>
        </div>

        {/* Failed Checks */}
        {failedChecks.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-[12px] font-semibold text-red-700 mb-2">
              {failedChecks.length} Critical Failure{failedChecks.length > 1 ? "s" : ""}
            </p>
            <ul className="space-y-1">
              {failedChecks.map((check, i) => (
                <li key={i} className="text-[11px] text-red-600 flex items-start gap-1.5">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span><strong>{check.name}:</strong> {check.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {warnChecks.length > 0 && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-yellow-700">
                {warnChecks.length} Warning{warnChecks.length > 1 ? "s" : ""}
              </span>
              <span className="text-[10px] text-yellow-500">{showDetails ? "Hide" : "Show"}</span>
            </div>
            {showDetails && (
              <ul className="mt-2 space-y-1">
                {warnChecks.map((check, i) => (
                  <li key={i} className="text-[10px] text-yellow-600 flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>{check.name}: {check.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </button>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a73e8] text-white text-[12px] font-medium rounded-lg hover:bg-[#1557b0] transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} />
            {isRetrying ? "Retrying..." : "Retry"}
          </button>
          <button
            onClick={handleReload}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f1f3f4] text-[#5f6368] text-[12px] font-medium rounded-lg hover:bg-[#e8eaed] transition-colors"
          >
            <Globe className="h-3.5 w-3.5" />
            Reload
          </button>
          <button
            onClick={handleClearCache}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#fce8e6] text-[#ea4335] text-[12px] font-medium rounded-lg hover:bg-[#f5c6c2] transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Cache
          </button>
          <button
            onClick={handleRestartSession}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f1f3f4] text-[#5f6368] text-[12px] font-medium rounded-lg hover:bg-[#e8eaed] transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Restart Session
          </button>
        </div>

        {/* Secondary actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 text-[11px] text-[#5f6368] hover:text-[#1a1a2e] transition-colors"
          >
            <Download className="h-3 w-3" />
            Download Report
          </button>
          <span className="text-[#dadce0]">|</span>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("eeos:open-debug-panel"))}
            className="flex items-center gap-1.5 text-[11px] text-[#5f6368] hover:text-[#1a1a2e] transition-colors"
          >
            <Bug className="h-3 w-3" />
            Diagnostics
          </button>
        </div>

        <p className="text-[10px] text-[#dadce0] text-center mt-8">
          EEOS Production Readiness Manager v1.0
        </p>
      </motion.div>
    </div>
  );
}
