import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface PageLoadingFallbackProps {
  /** Optional module name for the loading indicator */
  moduleName?: string;
  /** Timeout in ms before showing a recovery prompt (default 15s) */
  timeout?: number;
  /** Whether to show a progress-like indicator */
  showProgress?: boolean;
}

/**
 * PageLoadingFallback — shown inside Suspense while a lazy-loaded route is loading.
 * Includes skeleton placeholder, timeout detection, and retry prompt.
 * Never renders blank — always shows something meaningful.
 */
export function PageLoadingFallback({
  moduleName,
  timeout = 15000,
  showProgress = true,
}: PageLoadingFallbackProps) {
  const [elapsed, setElapsed] = useState(0);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const diff = Date.now() - start;
      setElapsed(diff);
      if (diff >= timeout) {
        setIsTimedOut(true);
        clearInterval(interval);
      }
      if (diff >= 3000) {
        setShowHelp(true);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [timeout]);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      {/* Animated spinner */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        className="mb-6"
      >
        <div className="relative">
          <Loader2 className="h-10 w-10 text-[#1a73e8]" />
          {showProgress && (
            <svg className="absolute inset-0 h-10 w-10" viewBox="0 0 40 40">
              <motion.circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="#e8eaed"
                strokeWidth="3"
                strokeDasharray={`${Math.min(elapsed / 150, 100)} 100`}
                initial={{ strokeDasharray: "0 100" }}
              />
            </svg>
          )}
        </div>
      </motion.div>

      {/* Module name */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-sm font-medium text-[#1a1a2e] mb-2"
      >
        {moduleName ? `Loading ${moduleName}...` : "Loading page..."}
      </motion.p>

      {/* Estimated time */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-[12px] text-[#9aa0a6] mb-6"
      >
        {elapsed < 1000
          ? "Just a moment..."
          : `Taking longer than expected (${(elapsed / 1000).toFixed(0)}s)`}
      </motion.p>

      {/* Help text */}
      {showHelp && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#f8f9fa] border border-[#e8eaed] rounded-lg p-4 max-w-sm text-center"
        >
          <p className="text-[11px] text-[#5f6368] leading-relaxed">
            If this page doesn't load, try refreshing or check your connection.
          </p>
        </motion.div>
      )}

      {/* Timeout / retry */}
      {isTimedOut && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6"
        >
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-[#1a73e8] text-white text-[12px] font-medium rounded-lg hover:bg-[#1557b0] transition-colors"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* Skeleton placeholders */}
      <div className="w-full max-w-md mt-8 space-y-3">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
            className="h-4 bg-[#f1f3f4] rounded"
            style={{ width: `${70 + i * 10}%` }}
          />
        ))}
      </div>
    </div>
  );
}
