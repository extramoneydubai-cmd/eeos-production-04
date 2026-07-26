import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface FullPageLoadingProps {
  /** Context where this loading state appears */
  context?: "app" | "auth" | "org" | "dashboard" | "data";
  /** Optional message */
  message?: string;
}

const CONTEXT_MESSAGES: Record<string, string> = {
  app: "Initializing EEOS...",
  auth: "Authenticating...",
  org: "Loading organization...",
  dashboard: "Preparing your dashboard...",
  data: "Loading data...",
};

/**
 * FullPageLoading — shown on initial app boot, during authentication,
 * organization loading, and dashboard initialization.
 * Maintains EEOS branding and provides a consistent loading experience.
 */
export function FullPageLoading({ context = "app", message }: FullPageLoadingProps) {
  const displayMessage = message || CONTEXT_MESSAGES[context] || "Loading...";

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-6"
      >
        {/* Logo */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-12 h-12 rounded-xl bg-[#1a1a2e] flex items-center justify-center"
        >
          <span className="text-white text-lg font-bold">E</span>
        </motion.div>

        {/* Message */}
        <div className="text-center">
          <p className="text-sm font-medium text-[#1a1a2e]">{displayMessage}</p>
          <p className="text-[11px] text-[#9aa0a6] mt-1">
            Please wait while we set things up
          </p>
        </div>

        {/* Spinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        >
          <Loader2 className="h-6 w-6 text-[#1a73e8]" />
        </motion.div>

        {/* Brand */}
        <p className="text-[10px] text-[#dadce0] mt-8">EEOS Enterprise</p>
      </motion.div>
    </div>
  );
}
