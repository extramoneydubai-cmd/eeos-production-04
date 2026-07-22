import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { errorLog, notifyDevError } from "@/lib/error-logger";

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onRetry?: () => void;
  /** When this key changes, the error boundary remounts along with its children. */
}

interface RouteErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
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

    // Send to the global error log
    try {
      const entry = errorLog.push({
        message: msg,
        stack: error.stack || msg || "",
        source: "boundary",
        componentStack: info.componentStack,
      });
      notifyDevError(entry);
    } catch {
      // Logger infrastructure is best-effort
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <div className="p-4 rounded-full bg-red-50 mb-4">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <p className="text-[13px] text-[#9aa0a6] mb-2">
            This page is temporarily unavailable
          </p>
          <div className="bg-[#f8f9fa] border border-[#e8eaed] rounded-lg p-4 max-w-md text-left mb-5">
            <p className="text-[11px] text-[#5f6368] font-medium mb-1">Possible reasons:</p>
            <ul className="text-[11px] text-[#9aa0a6] space-y-0.5 list-disc list-inside">
              <li>Backend not deployed</li>
              <li>Missing configuration</li>
              <li>Connection issue</li>
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
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
