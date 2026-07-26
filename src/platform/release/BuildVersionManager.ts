/**
 * BuildVersionManager — Tracks application version, build number, git SHA,
 * build timestamp, environment, and release channel.
 *
 * Exposes:
 *  - getCurrentBuild()
 *  - getVersion()
 *  - getBuildInfo()
 *  - compareVersions()
 *
 * The version info is displayed in: Login, Settings, Diagnostics, Footer, ReportIssue
 */

import { appConfig } from "@/config/app";

export interface BuildInfo {
  version: string;
  buildNumber: string;
  gitCommit: string;
  buildTimestamp: string;
  environment: string;
  releaseChannel: string;
  buildId: string;
  nodeVersion: string;
  reactVersion: string;
  convexUrl: string;
}

function getMetaContent(name: string): string {
  try {
    return document.querySelector(`meta[name="${name}"]`)?.getAttribute("content") || "";
  } catch {
    return "";
  }
}

class BuildVersionManagerImpl {
  private _info: BuildInfo | null = null;

  /** Lazily compute build info */
  getBuildInfo(): BuildInfo {
    if (this._info) return this._info;

    const env = import.meta.env as Record<string, unknown>;
    const mode = (env.MODE as string) || "development";

    this._info = {
      version: getMetaContent("build-version") || (appConfig.version as string) || "0.0.0",
      buildNumber: getMetaContent("build-number") || (env.VITE_BUILD_NUMBER as string) || String(Date.now()),
      gitCommit: getMetaContent("git-commit") || (env.VITE_GIT_COMMIT as string) || "unknown",
      buildTimestamp: getMetaContent("build-timestamp") || (env.VITE_BUILD_TIMESTAMP as string) || new Date().toISOString(),
      environment: mode,
      releaseChannel: mode === "production" ? "stable" : mode === "staging" ? "beta" : "development",
      buildId: `${getMetaContent("build-version") || "0.0.0"}-${getMetaContent("build-number") || Date.now()}`,
      nodeVersion: (env.VITE_NODE_VERSION as string) || "unknown",
      reactVersion: "19",
      convexUrl: (env.VITE_CONVEX_URL as string) || "unknown",
    };

    return this._info;
  }

  /** Get the short version string (e.g. "1.0.0-beta") */
  getVersionString(): string {
    const info = this.getBuildInfo();
    return `${info.version} (${info.releaseChannel})`;
  }

  /** Get the full version label for display */
  getDisplayLabel(): string {
    const info = this.getBuildInfo();
    return `EEOS v${info.version} build ${info.buildNumber} — ${info.releaseChannel}`;
  }

  /** Get build number */
  get buildNumber(): string {
    return this.getBuildInfo().buildNumber;
  }

  /** Get version */
  get version(): string {
    return this.getBuildInfo().version;
  }

  /** Get environment */
  get environment(): string {
    return this.getBuildInfo().environment;
  }

  /** Compare current version with another version string */
  compareVersions(otherVersion: string): "newer" | "older" | "same" | "incompatible" {
    const current = this.version;
    const parts1 = current.split(".").map(Number);
    const parts2 = otherVersion.split(".").map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const a = parts1[i] || 0;
      const b = parts2[i] || 0;
      if (a > b) return "newer";
      if (a < b) return "older";
    }
    return "same";
  }

  /** Check if version is compatible with a minimum version */
  isCompatible(minVersion: string): boolean {
    const result = this.compareVersions(minVersion);
    return result === "newer" || result === "same";
  }
}

export const buildVersionManager = new BuildVersionManagerImpl();
