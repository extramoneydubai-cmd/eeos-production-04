import React from "react";
import { CrashScreen } from "./CrashScreen";
import { errorLog, classifySeverity } from "@/lib/error-logger";
import { isStaleChunkError, recoverFromStaleBundle } from "@/lib/stale-bundle";

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId?: string;
  recoverable: boolean;
}

/**
 * GlobalErrorBoundary — wraps the ENTIRE React root (providers, router, everything).
 * If ANY uncaught error bubbles up (Convex provider crash, Router crash, etc.),
 * this renders the CrashScreen instead of a blank white page.
 *
 * This is the LAST line of defense. Every route also has its own RouteErrorBoundary
 * for granular recovery, but this catches what falls through.
 */
export class GlobalErrorBoundary extends React.Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  private recoveryAttempts = 0;
  private static lastError: { message: string; timestamp: number } | null = null;

  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, recoverable: true };
  }

  static getDerivedStateFromError(error: Error) {
    // Classify the error severity
    const severity = classifySeverity(
      error.message || String(error),
      "react",
      error.stack
    );
    return {
      hasError: true,
      error,
      recoverable: severity !== "fatal",
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const msg = error.message || String(error);

    // A lazy chunk that no longer exists after a redeploy — reload once to
    // pick up the fresh bundle instead of showing the crash screen.
    if (isStaleChunkError(error)) {
      recoverFromStaleBundle();
      return;
    }

    const severity = classifySeverity(msg, "react", error.stack);

    // Log to error logger
    try {
      const entry = errorLog.push({
        message: msg,
        stack: error.stack || msg,
        source: "react",
        severity,
        componentStack: info.componentStack ?? undefined,
        metadata: {
          module: "GlobalErrorBoundary",
          // Capture current route before crash
          page:
            typeof window !== "undefined"
              ? window.location.pathname
              : "unknown",
        },
      });
      this.setState({ errorId: entry.id });

      // Track last error for deduplication
      GlobalErrorBoundary.lastError = {
        message: msg,
        timestamp: Date.now(),
      };
    } catch {
      // Error while logging error — last resort
    }

    // Attempt auto-recovery for non-fatal errors after 3 seconds
    if (severity !== "fatal") {
      setTimeout(() => {
        this.recoveryAttempts++;
        if (this.recoveryAttempts <= 2) {
          this.setState({ hasError: false, error: null, errorId: undefined });
        }
      }, 3000);
    }
  }

  handleRetry = () => {
    this.recoveryAttempts++;
    if (this.recoveryAttempts > 3) {
      // After 3 retries, recommend a full reload
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, error: null, errorId: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <CrashScreen
          error={this.state.error}
          errorId={this.state.errorId}
          recoverable={this.state.recoverable}
        />
      );
    }

    return this.props.children;
  }
}
