import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, ArrowLeft, Bug } from "lucide-react";
import { errorLog, notifyDevError, classifySeverity } from "@/lib/error-logger";
import { CrashScreen } from "@/components/system/CrashScreen";
import { isStaleChunkError, recoverFromStaleBundle } from "@/lib/stale-bundle";

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onRetry?: () => void;
  /** Module name for error metadata */
  moduleName?: string;
  /** Whether to show the full CrashScreen or minimal fallback */
  showFullCrash?: boolean;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId?: string;
}

export class RouteErrorBoundary extends React.Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const msg = error.message || String(error);
    console.error("[RouteErrorBoundary] Caught error:", msg, info.componentStack);

    // A lazy route chunk that no longer exists after a redeploy — reload once
    // to pick up the fresh bundle instead of showing an error screen.
    if (isStaleChunkError(error)) {
      recoverFromStaleBundle();
      return;
    }

    try {
      const severity = classifySeverity(msg, "boundary", error.stack);
      const entry = errorLog.push({
        message: msg,
        stack: error.stack || msg || "",
        source: "boundary",
        severity,
        componentStack: info.componentStack ?? undefined,
        metadata: {
          module: this.props.moduleName,
        },
      });
      this.setState({ errorId: entry.id });
      notifyDevError(entry);
    } catch {
      // Logger infrastructure is best-effort
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorId: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback overrides all
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Full CrashScreen for higher-level boundaries
      if (this.props.showFullCrash) {
        return (
          <CrashScreen
            error={this.state.error}
            errorId={this.state.errorId}
            recoverable={true}
          />
        );
      }

      // Minimal route-level fallback
      const severity = this.state.error
        ? classifySeverity(this.state.error.message, "boundary", this.state.error.stack)
        : "error";

      const isFatal = severity === "fatal";

      return (
        <div className={`flex flex-col items-center justify-center min-h-[60vh] text-center px-6 ${
          isFatal ? "bg-red-50/50" : ""
        }`}>
          <div className={`p-4 rounded-full mb-4 ${
            isFatal ? "bg-red-100" : "bg-red-50"
          }`}>
            <AlertCircle className={`h-10 w-10 ${
              isFatal ? "text-red-600" : "text-red-500"
            }`} />
          </div>

          <p className="text-sm font-medium text-[#1a1a2e] mb-1">
            {isFatal ? "A critical error occurred" : "This page is temporarily unavailable"}
          </p>

          <p className="text-[13px] text-[#9aa0a6] mb-4">
            {isFatal
              ? "The application could not recover automatically."
              : "We've logged the issue and you can try again."}
          </p>

          {/* Error ID for diagnostics */}
          {this.state.errorId && (
            <p className="text-[10px] font-mono text-[#dadce0] mb-4">
              Error: {this.state.errorId}
            </p>
          )}

          <div className="bg-[#f8f9fa] border border-[#e8eaed] rounded-lg p-4 max-w-md text-left mb-5">
            <p className="text-[11px] text-[#5f6368] font-medium mb-1">Possible reasons:</p>
            <ul className="text-[11px] text-[#9aa0a6] space-y-0.5 list-disc list-inside">
              <li>Backend not deployed or unreachable</li>
              <li>Missing or invalid configuration</li>
              <li>Network connection issue</li>
              <li>Temporary server error</li>
            </ul>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[11px]"
              onClick={this.handleRetry}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-[11px] text-[#5f6368]"
              onClick={() => {
                window.history.back();
              }}
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-[11px] text-[#5f6368]"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("eeos:open-debug-panel"));
              }}
            >
              <Bug className="h-3.5 w-3.5 mr-1" /> Debug
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
