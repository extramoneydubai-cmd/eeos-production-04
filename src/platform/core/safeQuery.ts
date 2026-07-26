/**
 * useSafeQuery — wraps useQuery so that NO Convex query ever crashes the React tree.
 *
 * Instead of throwing, it returns { loading, error, data, retry }.
 *
 * Usage:
 *   const { data, loading, error, retry } = useSafeQuery(api.users.listUsers, {});
 *   if (loading) return <Spinner />;
 *   if (error) return <ErrorPanel message={error} onRetry={retry} />;
 *   return <List data={data} />;
 */
import { useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { errorLog, classifySeverity, extractMessage } from "@/lib/error-logger";
import type { FunctionReference, FunctionReturnType, FunctionArgs } from "convex/server";

type QueryStatus = "loading" | "success" | "error" | "skip";

interface SafeQueryResult<T> {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  status: QueryStatus;
  retry: () => void;
  /** How many times this query has been retried */
  retryCount: number;
}

/**
 * Maximum retries before giving up permanently.
 */
const MAX_RETRIES = 3;

/**
 * Safe wrapper around Convex useQuery.
 *
 * Features:
 * - Never throws — catches validation, network, and permission errors
 * - Returns `{ data, loading, error, retry }` always
 * - Logs all errors to the global error log
 * - Supports retry
 * - Classifies error severity automatically
 */
export function useSafeQuery<F extends FunctionReference<"query", "public">>(
  query: F,
  args: FunctionArgs<F> | "skip",
  options?: {
    /** Maximum retry attempts (default 3) */
    maxRetries?: number;
    /** Module name for error metadata */
    moduleName?: string;
    /** Whether to auto-retry on failure (default true) */
    autoRetry?: boolean;
  }
): SafeQueryResult<FunctionReturnType<F>> {
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [caughtError, setCaughtError] = useState<string | null>(null);
  const lastArgsRef = useRef<typeof args>(args);

  // Track args changes to reset retry state
  useEffect(() => {
    if (JSON.stringify(args) !== JSON.stringify(lastArgsRef.current)) {
      setCaughtError(null);
      setRetryCount(0);
      lastArgsRef.current = args;
    }
  }, [args]);

  // If args are "skip", we don't run the query
  const shouldSkip = args === "skip";
  const queryArgs = shouldSkip ? "skip" : (args as FunctionArgs<F>);

  // Use try/catch around useQuery via error boundary safety
  let rawData: FunctionReturnType<F> | undefined;
  let rawError: Error | undefined;

  try {
    rawData = useQuery(query, queryArgs) as FunctionReturnType<F> | undefined;
    rawError = undefined;
  } catch (e) {
    rawError = e instanceof Error ? e : new Error(String(e));
    rawData = undefined;
  }

  // Auto-classify and log the error
  useEffect(() => {
    if (rawError) {
      const msg = extractMessage(rawError);
      const severity = classifySeverity(msg, "convex", rawError.stack);

      errorLog.push({
        message: msg,
        stack: rawError.stack || "",
        source: "convex",
        severity,
        metadata: {
          queryName: query.__type,
          module: options?.moduleName,
        },
      });

      setCaughtError(msg);
    }
  }, [rawError, query, options?.moduleName]);

  // Auto-retry logic
  useEffect(() => {
    if (rawError && (options?.autoRetry ?? true) && retryCount < (options?.maxRetries ?? MAX_RETRIES)) {
      const timeout = Math.min(1000 * Math.pow(2, retryCount), 10000); // exponential backoff
      const timer = setTimeout(() => {
        setRetryCount((c) => c + 1);
        setRetryTrigger((t) => t + 1);
      }, timeout);
      return () => clearTimeout(timer);
    }
  }, [rawError, retryCount, options?.maxRetries, options?.autoRetry]);

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1);
    setRetryTrigger((t) => t + 1);
    setCaughtError(null);
  }, []);

  const loading = !shouldSkip && rawData === undefined && !rawError;
  const error = caughtError || (rawError ? extractMessage(rawError) : null);
  const status: QueryStatus = shouldSkip ? "skip" : loading ? "loading" : error ? "error" : "success";

  return {
    data: rawData,
    loading,
    error,
    status,
    retry,
    retryCount,
  };
}
