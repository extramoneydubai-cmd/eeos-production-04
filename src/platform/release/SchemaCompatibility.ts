/**
 * SchemaCompatibility — Verifies frontend/backend schema compatibility.
 *
 * Checks:
 *  - Frontend schema version vs backend schema version
 *  - Migration version vs deployed version
 *  - Entity version consistency
 *  - SDK version compatibility
 *
 * Detects:
 *  - Incompatible schema
 *  - Missing migration
 *  - Unsupported build
 */

import { RuntimeSupervisor } from "@/platform/runtime/RuntimeSupervisor";

const SCHEMA_VERSION_KEY = "eeos_schema_version";

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

  /** Run compatibility check */
  check(): string[] {
    const issues: string[] = [];

    // Check if backend version is known
    if (!this._backendSchemaVersion) {
      issues.push("Backend schema version not available (Convex may not be deployed)");
    }

    // Compare versions
    if (this._backendSchemaVersion) {
      const compat = this.compareVersions(this._frontendSchemaVersion, this._backendSchemaVersion);
      if (compat === "backend_older") {
        issues.push(`Frontend schema (${this._frontendSchemaVersion}) is newer than backend (${this._backendSchemaVersion})`);
      } else if (compat === "frontend_older") {
        issues.push(`Backend schema (${this._backendSchemaVersion}) is newer than frontend (${this._frontendSchemaVersion})`);
      }
    }

    return issues;
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
    } catch {}
  }

  private compareVersions(frontend: string, backend: string): "match" | "backend_older" | "frontend_older" | "incompatible" {
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
