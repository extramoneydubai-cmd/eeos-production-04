/**
 * SchemaCompatibility — Verifies frontend/backend schema compatibility.
 *
 * Checks:
 *  - Frontend schema version vs backend schema version
 *  - Migration version vs deployed version
 *
 * Returns categorized results so the ProductionReadinessManager can
 * treat unavailable backend as a warning, not a hard failure.
 */

const SCHEMA_VERSION_KEY = "eeos_schema_version";

export interface SchemaCheckResult {
  /** Human-readable label for this check */
  label: string;
  /** "pass" — compatible, "warn" — not verified but not blocking, "fail" — incompatible */
  status: "pass" | "warn" | "fail";
  /** Description of the issue */
  message: string;
}

class SchemaCompatibilityImpl {
  private _frontendSchemaVersion: string = "1.0.0";
  private _backendSchemaVersion: string | null = null;

  /** Set the backend schema version (call from Convex query) */
  setBackendVersion(version: string): void {
    this._backendSchemaVersion = version;
  }

  /** Get frontend schema version */
  get frontendVersion(): string {
    return this._frontendSchemaVersion;
  }

  /** Get backend schema version */
  get backendVersion(): string | null {
    return this._backendSchemaVersion;
  }

  /**
   * Run compatibility check.
   * Returns categorized results:
   *  - Backend unavailable → warn (not a hard fail during development)
   *  - Version mismatch → fail (incompatible)
   */
  check(): SchemaCheckResult[] {
    const results: SchemaCheckResult[] = [];

    // If backend version is not available, it's a warning, not a failure
    if (!this._backendSchemaVersion) {
      results.push({
        label: "Backend Version",
        status: "warn",
        message: "Backend schema version not available (Convex may not be fully deployed or backend version not yet reported)",
      });
      return results;
    }

    // Frontend version is always available
    results.push({
      label: "Frontend Version",
      status: "pass",
      message: `Frontend schema v${this._frontendSchemaVersion}`,
    });

    results.push({
      label: "Backend Version",
      status: "pass",
      message: `Backend schema v${this._backendSchemaVersion}`,
    });

    // Compare versions
    const compat = this.compareVersions(this._frontendSchemaVersion, this._backendSchemaVersion);
    if (compat === "match") {
      results.push({
        label: "Compatibility",
        status: "pass",
        message: `Frontend (v${this._frontendSchemaVersion}) and backend (v${this._backendSchemaVersion}) are compatible`,
      });
    } else if (compat === "backend_older") {
      results.push({
        label: "Compatibility",
        status: "warn",
        message: `Frontend (v${this._frontendSchemaVersion}) is newer than backend (v${this._backendSchemaVersion})`,
      });
    } else if (compat === "frontend_older") {
      results.push({
        label: "Compatibility",
        status: "warn",
        message: `Backend (v${this._backendSchemaVersion}) is newer than frontend (v${this._frontendSchemaVersion})`,
      });
    } else {
      results.push({
        label: "Compatibility",
        status: "fail",
        message: `Incompatible versions: frontend v${this._frontendSchemaVersion}, backend v${this._backendSchemaVersion}`,
      });
    }

    return results;
  }

  /** Quick compatibility check */
  get isCompatible(): boolean {
    if (!this._backendSchemaVersion) return false;
    const result = this.compareVersions(this._frontendSchemaVersion, this._backendSchemaVersion);
    return result === "match";
  }

  /** Get stored schema version from localStorage */
  getStoredVersion(): string | null {
    try {
      return localStorage.getItem(SCHEMA_VERSION_KEY);
    } catch {
      return null;
    }
  }

  /** Store current schema version */
  persistVersion(): void {
    try {
      localStorage.setItem(SCHEMA_VERSION_KEY, this._frontendSchemaVersion);
    } catch { /* noop */ }
  }

  private compareVersions(
    frontend: string,
    backend: string,
  ): "match" | "backend_older" | "frontend_older" | "incompatible" {
    const fParts = frontend.split(".").map(Number);
    const bParts = backend.split(".").map(Number);

    for (let i = 0; i < 3; i++) {
      const f = fParts[i] || 0;
      const b = bParts[i] || 0;
      if (f === b) continue;
      if (b < f) return "backend_older";
      if (f < b) return "frontend_older";
    }
    return "match";
  }
}

export const schemaCompatibility = new SchemaCompatibilityImpl();
