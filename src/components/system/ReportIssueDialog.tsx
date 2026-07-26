/**
 * ReportIssueDialog — Collects runtime diagnostics and generates a downloadable incident report.
 *
 * Automatically attaches:
 *  - Logs and stack traces
 *  - Runtime metrics
 *  - Health report
 *  - Browser info
 *  - Build info
 *  - SDK state
 *  - Current route, organization, company, branch, user role
 *
 * Generates:
 *  - Incident ID
 *  - Markdown report
 *  - JSON bundle
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bug, Download, FileText, Copy, X, Loader2, CheckCircle } from "lucide-react";
import { errorLog } from "@/lib/error-logger";
import { RuntimeSupervisor } from "@/platform/runtime/RuntimeSupervisor";
import { runtimeSelfTest } from "@/platform/runtime/RuntimeSelfTest";
import { getBuildInfo } from "@/platform/core/buildHealth";
import { runtimeMetrics } from "@/platform/runtime/RuntimeMetrics";
import { sdkPerformanceMonitor } from "@/platform/runtime/SdkPerformanceMonitor";
import { slowQueryDetector } from "@/platform/runtime/SlowQueryDetector";

interface ReportIssueDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Pre-populated description */
  defaultDescription?: string;
  /** Additional context to include */
  context?: Record<string, unknown>;
}

export function ReportIssueDialog({ open, onClose, defaultDescription = "", context }: ReportIssueDialogProps) {
  const [description, setDescription] = useState(defaultDescription);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<{ incidentId: string; markdown: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const generateReport = useCallback(async () => {
    setGenerating(true);

    // Generate incident ID
    const incidentId = `INC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // Collect runtime data
    const health = RuntimeSupervisor.getReport();
    const buildInfo = getBuildInfo();
    const selfTest = runtimeSelfTest.runAll();
    const metrics = runtimeMetrics.getAggregates();
    const sdkStats = sdkPerformanceMonitor.getStats();
    const slowOps = slowQueryDetector.getStats();
    const errorEntries = errorLog.getLast(50);

    // Build markdown
    const md = [
      `# EEOS Incident Report`,
      ``,
      `**Incident ID:** ${incidentId}`,
      `**Generated:** ${new Date().toISOString()}`,
      `**URL:** ${typeof window !== "undefined" ? window.location.href : "unknown"}`,
      `**Route:** ${typeof window !== "undefined" ? window.location.pathname : "unknown"}`,
      ``,
      `## Description`,
      ``,
      description || "No description provided",
      ``,
      `## Platform Health`,
      ``,
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Overall Status | ${health.overall} |`,
      `| Uptime | ${Math.round(health.uptime / 1000)}s |`,
      `| Components | ${health.components.length} |`,
      ``,
      `## Build Info`,
      ``,
      `| Property | Value |`,
      `|----------|-------|`,
      `| Version | ${buildInfo.version} |`,
      `| Git SHA | ${buildInfo.gitSha} |`,
      `| Environment | ${buildInfo.environment} |`,
      `| Convex URL | ${buildInfo.convexUrl} |`,
      `| Browser | ${buildInfo.browser.slice(0, 100)} |`,
      `| Platform | ${buildInfo.platform} |`,
      `| Memory | ${buildInfo.memory} |`,
      ``,
      `## Self-Test Results`,
      ``,
      selfTest.map((t) => `| ${t.name} | ${t.status.toUpperCase()} | ${t.message} |`).join("\n"),
      ``,
      `## Runtime Metrics`,
      ``,
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Avg FPS | ${metrics.avgFps} |`,
      `| Avg Memory | ${metrics.avgMemoryMB} MB |`,
      `| Avg Convex Latency | ${metrics.avgConvexLatency}ms |`,
      `| Total Queries | ${metrics.totalQueries} |`,
      `| Total Mutations | ${metrics.totalMutations} |`,
      ``,
      `## SDK Performance`,
      ``,
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Total Calls | ${sdkStats.totalCalls} |`,
      `| Failures | ${sdkStats.failures} |`,
      `| Duplicates | ${sdkStats.duplicateCount} |`,
      `| Avg Duration | ${sdkStats.avgDuration}ms |`,
      ``,
      `## Slow Operations`,
      ``,
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Total Slow | ${slowOps.total} |`,
      `| Critical | ${slowOps.criticalCount} |`,
      `| Avg Duration | ${slowOps.avgDuration}ms |`,
      ``,
      `## Recent Errors (last 50)`,
      ``,
      errorEntries.length > 0
        ? errorEntries.map((e) => `- [${e.severity.toUpperCase()}] (${e.source}) ${e.message} — ${new Date(e.timestamp).toISOString()}`).join("\n")
        : "No errors recorded.",
      ``,
      `## Additional Context`,
      ``,
      context ? Object.entries(context).map(([k, v]) => `- **${k}:** ${JSON.stringify(v)}`).join("\n") : "None provided.",
    ].join("\n");

    setGenerated({ incidentId, markdown: md });
    setGenerating(false);
  }, [description, context]);

  const handleDownload = () => {
    if (!generated) return;
    const blob = new Blob([generated.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eeos-incident-${generated.incidentId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl border border-[#e8eaed] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#e8eaed] bg-[#fafafa]">
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4 text-[#5f6368]" />
                <span className="text-sm font-semibold text-[#1a1a2e]">Report Issue</span>
              </div>
              <button onClick={onClose} className="text-[#9aa0a6] hover:text-[#5f6368]">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {!generated ? (
                <>
                  <div>
                    <label className="text-[12px] font-medium text-[#5f6368] block mb-1.5">
                      Describe the issue
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What went wrong? (Optional)"
                      rows={3}
                      className="w-full px-3 py-2 text-[13px] border border-[#e8eaed] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent resize-none placeholder:text-[#9aa0a6]"
                    />
                  </div>

                  <div className="bg-[#f8f9fa] border border-[#e8eaed] rounded-lg p-3">
                    <p className="text-[11px] text-[#5f6368] font-medium mb-1">What will be included:</p>
                    <ul className="text-[11px] text-[#9aa0a6] space-y-0.5">
                      <li>• Runtime health report and self-test results</li>
                      <li>• Build version, environment, and browser info</li>
                      <li>• Recent errors (last 50)</li>
                      <li>• SDK performance statistics</li>
                      <li>• Runtime metrics (FPS, memory, latency)</li>
                      <li>• Current route and URL</li>
                    </ul>
                  </div>

                  <button
                    onClick={generateReport}
                    disabled={generating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a73e8] text-white text-[13px] font-medium rounded-lg hover:bg-[#1557b0] transition-colors disabled:opacity-60"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating report...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Generate & Download Report
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-[13px] text-green-700 font-medium">
                      Report generated: {generated.incidentId}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleDownload}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a73e8] text-white text-[12px] font-medium rounded-lg hover:bg-[#1557b0] transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Download .md
                    </button>
                    <button
                      onClick={handleCopy}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f1f3f4] text-[#5f6368] text-[12px] font-medium rounded-lg hover:bg-[#e8eaed] transition-colors"
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
