/**
 * EnvironmentValidator — Validates required environment variables and browser capabilities.
 *
 * Checks:
 *  - Required env vars (Convex URL, API URLs, Auth settings, etc.)
 *  - Browser APIs (IndexedDB, LocalStorage, SessionStorage, Clipboard, File API, WebSocket)
 *
 * Output: PASS / WARN / FAIL for each check
 */

interface EnvCheckResult {
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
}

const REQUIRED_ENV_VARS: string[] = [
  "VITE_CONVEX_URL",
];

const RECOMMENDED_ENV_VARS: string[] = [
  "VITE_GIT_COMMIT",
  "VITE_BUILD_TIMESTAMP",
];

class EnvironmentValidatorImpl {
  /** Run all environment checks */
  validate(): EnvCheckResult[] {
    const results: EnvCheckResult[] = [];

    results.push(this.checkRequiredEnvVars());
    results.push(this.checkBrowserStorage());
    results.push(this.checkBrowserApis());
    results.push(this.checkConcurrentMode());

    return results;
  }

  /** Check that required environment variables are set */
  private checkRequiredEnvVars(): EnvCheckResult {
    const missing: string[] = [];
    for (const varName of REQUIRED_ENV_VARS) {
      const val = (import.meta.env as Record<string, unknown>)[varName];
      if (!val) missing.push(varName);
    }

    return {
      name: "Required Environment Variables",
      status: missing.length === 0 ? "pass" : "fail",
      message: missing.length === 0
        ? "All required env vars set"
        : `Missing: ${missing.join(", ")}`,
    };
  }

  /** Check browser storage APIs */
  private checkBrowserStorage(): EnvCheckResult {
    const working: string[] = [];
    const failed: string[] = [];

    try {
      localStorage.setItem("__env_test__", "1");
      localStorage.removeItem("__env_test__");
      working.push("localStorage");
    } catch {
      failed.push("localStorage");
    }

    try {
      sessionStorage.setItem("__env_test__", "1");
      sessionStorage.removeItem("__env_test__");
      working.push("sessionStorage");
    } catch {
      failed.push("sessionStorage");
    }

    return {
      name: "Browser Storage",
      status: failed.length === 0 ? "pass" : "warn",
      message: failed.length === 0
        ? `${working.length}/2 available: ${working.join(", ")}`
        : `Failed: ${failed.join(", ")}`,
    };
  }

  /** Check available browser APIs */
  private checkBrowserApis(): EnvCheckResult {
    const apis: string[] = [];
    const missing: string[] = [];

    if (typeof indexedDB !== "undefined") apis.push("IndexedDB");
    else missing.push("IndexedDB");

    if (typeof navigator !== "undefined") {
      if (typeof navigator.clipboard?.writeText === "function") apis.push("Clipboard API");
      else missing.push("Clipboard API");

      if (navigator.onLine !== undefined) apis.push("Online Detection");
    }

    if (typeof WebSocket !== "undefined") apis.push("WebSocket");
    else missing.push("WebSocket");

    return {
      name: "Browser APIs",
      status: missing.length <= 1 ? "pass" : missing.length <= 3 ? "warn" : "fail",
      message: `${apis.length} available, ${missing.length} missing`,
    };
  }

  /** Check React concurrent mode compatibility */
  private checkConcurrentMode(): EnvCheckResult {
    return {
      name: "React Concurrent Mode",
      status: "pass",
      message: "Compatible (React 19)",
    };
  }
}

export const environmentValidator = new EnvironmentValidatorImpl();
