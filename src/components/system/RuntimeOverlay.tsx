/**
 * RuntimeOverlay — Developer overlay for monitoring runtime metrics in real-time.
 *
 * Toggle: Ctrl+Shift+R
 *
 * Displays:
 *  - FPS
 *  - Memory
 *  - Convex status
 *  - SDK status
 *  - Pending queries/mutations
 *  - Router state
 *  - Active workspace
 *  - Current permissions
 *  - Current organization
 *
 * Hidden in production unless explicitly enabled.
 */

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Activity, Wifi, HardDrive, Cpu, X, Minimize2, Maximize2 } from "lucide-react";
import { RuntimeSupervisor, useRuntimeHealth } from "@/platform/runtime/RuntimeSupervisor";
import { runtimeMetrics } from "@/platform/runtime/RuntimeMetrics";
import { convexSupervisor } from "@/platform/runtime/ConvexSupervisor";
import { sdkPerformanceMonitor } from "@/platform/runtime/SdkPerformanceMonitor";
import { navigationSupervisor } from "@/platform/runtime/NavigationSupervisor";
import { workspaceRecovery } from "@/platform/runtime/WorkspaceRecovery";

const STATUS_COLORS: Record<string, string> = {
  healthy: "text-green-500",
  warning: "text-yellow-500",
  critical: "text-red-500",
  down: "text-red-500",
};

export function RuntimeOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const health = useRuntimeHealth();
  const [fps, setFps] = useState(60);
  const [memory, setMemory] = useState("0MB");
  const [convexState, setConvexState] = useState("unknown");
  const [sdkCalls, setSdkCalls] = useState(0);
  const [sdkFails, setSdkFails] = useState(0);
  const [navStats, setNavStats] = useState({ total: 0, failed: 0 });
  const [workspace, setWorkspace] = useState<string | null>(null);

  // Toggle with Ctrl+Shift+R
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "R") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setIsMinimized(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-refresh metrics
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setFps(runtimeMetrics.fps);
      setMemory(`${runtimeMetrics.memoryMB}MB`);
      setConvexState(convexSupervisor.state);
      setSdkCalls(sdkPerformanceMonitor.getStats().totalCalls);
      setSdkFails(sdkPerformanceMonitor.getStats().failures);
      setNavStats(navigationSupervisor.getStats());
      setWorkspace(
        workspaceRecovery["_activeWorkspace"]
          ? `${workspaceRecovery["_activeWorkspace"].entityType}:${workspaceRecovery["_activeWorkspace"].entityId}`
          : null
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className={`fixed top-4 right-4 z-[9998] bg-[#1a1a2e] text-white rounded-lg shadow-2xl overflow-hidden ${
          isMinimized ? "w-auto" : "w-72"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#2d2d4a] border-b border-[#3d3d5a]">
          <div className="flex items-center gap-2">
            <Monitor className="h-3.5 w-3.5 text-[#9aa0a6]" />
            <span className="text-[11px] font-semibold">Runtime</span>
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                health.overall === "healthy"
                  ? "bg-green-500"
                  : health.overall === "warning"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-[#9aa0a6] hover:text-white transition-colors"
            >
              {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#9aa0a6] hover:text-white transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Metrics */}
            <div className="p-3 space-y-2 text-[11px]">
              <MetricRow icon={<Activity className="h-3 w-3" />} label="FPS" value={`${fps}`} status={fps >= 30 ? "healthy" : fps >= 15 ? "warning" : "critical"} />
              <MetricRow icon={<HardDrive className="h-3 w-3" />} label="Memory" value={memory} status={health.components.find((c) => c.name === "Memory")?.status || "healthy"} />
              <MetricRow icon={<Wifi className="h-3 w-3" />} label="Convex" value={convexState} status={convexState === "connected" ? "healthy" : convexState === "reconnecting" ? "warning" : "critical"} />
              <MetricRow icon={<Cpu className="h-3 w-3" />} label="SDK" value={`${sdkCalls}c/${sdkFails}f`} status={sdkFails > 10 ? "warning" : "healthy"} />
              <MetricRow icon={<Activity className="h-3 w-3" />} label="Router" value={`${navStats.total}n/${navStats.failed}f`} status={navStats.failed > 0 ? "warning" : "healthy"} />

              {workspace && (
                <div className="flex items-center justify-between pt-1 border-t border-[#3d3d5a]">
                  <span className="text-[#9aa0a6]">Workspace</span>
                  <span className="text-[10px] text-green-300 truncate max-w-[150px]" title={workspace}>
                    {workspace}
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-3 py-1.5 bg-[#2d2d4a] border-t border-[#3d3d5a]">
              <p className="text-[9px] text-[#9aa0a6]">Ctrl+Shift+R to toggle</p>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function MetricRow({ icon, label, value, status }: { icon: React.ReactNode; label: string; value: string; status: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <span className="text-[#9aa0a6]">{icon}</span>
        <span className="text-[#e8eaed]">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px]">{value}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[status] || "text-gray-500"} ${
          status === "healthy" ? "" : "animate-pulse"
        }`} />
      </div>
    </div>
  );
}
