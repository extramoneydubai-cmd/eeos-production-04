/**
 * safeSdk — wraps every SDK call with automatic logging, timing, error capture,
 * and retry logic. No SDK call should ever crash the React tree.
 *
 * Usage:
 *   const student = await safeSdk(
 *     () => studentSdk.getStudent({ studentId: "abc" }),
 *     { sdk: "studentSdk", function: "getStudent" }
 *   );
 */
import { errorLog, classifySeverity, extractMessage } from "@/lib/error-logger";

interface SafeSdkOptions {
  /** SDK/module name (e.g., "studentSdk", "crmSdk") */
  sdk: string;
  /** Function name (e.g., "getStudent", "listLeads") */
  function: string;
  /** Module name for error metadata */
  module?: string;
  /** Maximum retries (default 2) */
  maxRetries?: number;
  /** Whether to log successful calls (default false) */
  logSuccess?: boolean;
}

export interface SafeSdkResult<T> {
  data: T | null;
  error: string | null;
  duration: number;
  retryCount: number;
  success: boolean;
}

/**
 * Wrap any SDK call with automatic error handling, logging, and retry.
 *
 * Returns { data, error, duration, retryCount, success } — never throws.
 */
export async function safeSdk<T>(
  fn: () => Promise<T>,
  options: SafeSdkOptions
): Promise<SafeSdkResult<T>> {
  const { sdk, function: fnName, module, maxRetries = 2, logSuccess = false } = options;
  const startTime = performance.now();
  let lastError: Error | null = null;
  let retryCount = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const data = await fn();
      const duration = performance.now() - startTime;

      if (logSuccess) {
        errorLog.push({
          message: `[${sdk}.${fnName}] completed in ${duration.toFixed(0)}ms`,
          stack: "",
          source: "sdk",
          severity: "info",
          metadata: { sdk, module },
        });
      }

      return { data, error: null, duration, retryCount, success: true };
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      retryCount = attempt;

      if (attempt < maxRetries) {
        // Wait with exponential backoff before retry
        const delay = Math.min(500 * Math.pow(2, attempt), 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All attempts failed — log the final error
  const duration = performance.now() - startTime;
  const msg = lastError ? extractMessage(lastError) : "Unknown SDK error";
  const severity = classifySeverity(msg, "sdk", lastError?.stack);

  errorLog.push({
    message: `[${sdk}.${fnName}] ${msg} (${retryCount + 1} attempts)`,
    stack: lastError?.stack || "",
    source: "sdk",
    severity,
    metadata: { sdk, module },
  });

  return {
    data: null,
    error: msg,
    duration,
    retryCount,
    success: false,
  };
}

/**
 * Sync version of safeSdk for immediate (non-async) SDK calls.
 * Primarily used for synchronous data transformations.
 */
export function safeSdkSync<T>(
  fn: () => T,
  options: SafeSdkOptions
): { data: T | null; error: string | null; success: boolean } {
  try {
    const data = fn();
    return { data, error: null, success: true };
  } catch (e) {
    const msg = extractMessage(e);
    errorLog.push({
      message: `[${options.sdk}.${options.function}] ${msg}`,
      stack: e instanceof Error ? e.stack || "" : "",
      source: "sdk",
      severity: classifySeverity(msg, "sdk"),
      metadata: { sdk: options.sdk, module: options.module },
    });
    return { data: null, error: msg, success: false };
  }
}
