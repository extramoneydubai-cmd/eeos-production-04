import { useEffect, useState, useCallback } from "react";
import { Activity, Wifi, WifiOff, Cpu, HardDrive } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HealthState {
  react: "healthy" | "degraded" | "down";
  convex: "healthy" | "degraded" | "down";
  memory: "healthy" | "degraded" | "down";
  fps: "healthy" | "degraded" | "down";
  latency: "healthy" | "degraded" | "down";
  online: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  healthy: "bg-green-500",
  degraded: "bg-yellow-500",
  down: "bg-red-500",
};

const STATUS_BG: Record<string, string> = {
  healthy: "bg-green-50 border-green-200",
  degraded: "bg-yellow-50 border-yellow-200",
  down: "bg-red-50 border-red-200",
};

/**
 * Floating health monitor — shows system health at a glance.
 * Toggle visibility with a small floating pill in the bottom-left corner.
 * Accessible via double-click on the EEOS logo.
 */
export function HealthMonitor() {
  const [isOpen, setIsOpen] = useState(false);
  const [health, setHealth] = useState<HealthState>({
    react: "healthy",
    convex: "healthy",
    memory: "healthy",
    fps: "healthy",
    latency: "healthy",
    online: navigator.onLine,
  });
  const [fps, setFps] = useState(60);
  const [memoryMB, setMemoryMB] = useState(0);
  const [latencyMs, setLatencyMs] = useState(0);

  // Monitor FPS
  useEffect(() => {
    let frames = 0;
    let lastTime = performance.now();
    let rafId: number;

    const tick = (now: number) => {
      frames++;
      const delta = now - lastTime;
      if (delta >= 1000) {
        const currentFps = Math.round((frames * 1000) / delta);
        setFps(currentFps);
        setHealth((prev) => ({
          ...prev,
          fps: currentFps >= 30 ? "healthy" : currentFps >= 15 ? "degraded" : "down",
        }));
        frames = 0;
        lastTime = now;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Monitor online status
  useEffect(() => {
    const goOnline = () => setHealth((h) => ({ ...h, online: true }));
    const goOffline = () => setHealth((h) => ({ ...h, online: false }));
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Monitor memory
  useEffect(() => {
    const timer = setInterval(() => {
      const perf = (performance as unknown as Record<string, unknown>).memory as Record<string, number> | undefined;
      if (perf) {
        const used = Math.round(perf.usedJSHeapSize / 1024 / 1024);
        const total = Math.round(perf.totalJSHeapSize / 1024 / 1024);
        setMemoryMB(used);
        const pct = (used / total) * 100;
        setHealth((prev) => ({
          ...prev,
          memory: pct < 60 ? "healthy" : pct < 80 ? "degraded" : "down",
        }));
      }
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Simulate latency check (ping Convex)
  useEffect(() => {
    const check = async () => {
      const start = performance.now();
      try {
        await fetch(import.meta.env.VITE_CONVEX_URL || "/", { method: "HEAD", cache: "no-store" });
        const ms = performance.now() - start;
        setLatencyMs(Math.round(ms));
        setHealth((prev) => ({
          ...prev,
          latency: ms < 300 ? "healthy" : ms < 1000 ? "degraded" : "down",
          convex: ms < 500 ? "healthy" : ms < 2000 ? "degraded" : "down",
        }));
      } catch {
        setHealth((prev) => ({ ...prev, convex: "down", latency: "down" }));
      }
    };
    check();
    const timer = setInterval(check, 10000);
    return () => clearInterval(timer);
  }, []);

  const overallStatus = health.online
    ? [health.react, health.convex, health.memory, health.fps, health.latency].every((s) => s === "healthy")
      ? "healthy"
      : [health.react, health.convex, health.memory, health.fps, health.latency].some((s) => s === "down")
        ? "down"
        : "degraded"
    : "down";

  return (
    <>
      {/* Toggle pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-[9999] flex items-center gap-1.5 px-2 py-1 rounded-full shadow-sm border border-[#e8eaed] bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-200"
        title="Toggle Health Monitor"
      >
        <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[overallStatus]} ${
          overallStatus === "healthy" ? "" : "animate-pulse"
        }`} />
        <Activity className="h-3 w-3 text-[#5f6368]" />
      </button>

      {/* Health panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-12 left-4 z-[9999] w-[260px] bg-white rounded-lg border border-[#e8eaed] shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#fafafa] border-b border-[#e8eaed]">
              <span className="text-[11px] font-semibold text-[#1a1a2e]">System Health</span>
              <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[overallStatus]}`} />
            </div>

            {/* Metrics */}
            <div className="p-3 space-y-2">
              <HealthRow
                label="React"
                icon={<Activity className="h-3 w-3" />}
                status={health.react}
                value={`${fps} FPS`}
              />
              <HealthRow
                label="Convex"
                icon={<Wifi className="h-3 w-3" />}
                status={health.convex}
                value={`${latencyMs}ms`}
              />
              <HealthRow
                label="Memory"
                icon={<HardDrive className="h-3 w-3" />}
                status={health.memory}
                value={`${memoryMB} MB`}
              />
              <HealthRow
                label="Network"
                icon={health.online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                status={health.online ? "healthy" : "down"}
                value={health.online ? "Online" : "Offline"}
              />
              <HealthRow
                label="Latency"
                icon={<Cpu className="h-3 w-3" />}
                status={health.latency}
                value={`${latencyMs}ms`}
              />
            </div>

            {/* Footer */}
            <div className="px-3 py-1.5 bg-[#fafafa] border-t border-[#e8eaed]">
              <p className="text-[9px] text-[#9aa0a6]">
                Updates every 10s • Double-click logo to toggle
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function HealthRow({
  label,
  icon,
  status,
  value,
}: {
  label: string;
  icon: React.ReactNode;
  status: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-[#5f6368]">{icon}</span>
        <span className="text-[11px] text-[#1a1a2e] font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-[#5f6368]">{value}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[status]}`} />
      </div>
    </div>
  );
}
