/**
 * ReleaseManager — Manages release channels, history, rollback,
 * version comparison, and hotfix tracking.
 *
 * Supports:
 *  - Release Channels (Development, Preview, Staging, Production)
 *  - Release history
 *  - Rollback
 *  - Release notes
 *  - Version comparison
 *  - Hotfix tracking
 */

import { RuntimeSupervisor } from "@/platform/runtime/RuntimeSupervisor";
import { errorLog } from "@/lib/error-logger";
import { buildVersionManager } from "./BuildVersionManager";

export type ReleaseChannel = "development" | "preview" | "staging" | "production";

export interface ReleaseEntry {
  id: string;
  version: string;
  buildNumber: string;
  channel: ReleaseChannel;
  timestamp: number;
  gitCommit: string;
  author: string;
  notes: string;
  type: "release" | "hotfix" | "rollback";
  status: "deploying" | "active" | "rolled_back" | "failed";
  duration: number;
}

const STORAGE_KEY = "eeos_release_history";
const MAX_HISTORY = 50;

class ReleaseManagerImpl {
  private history: ReleaseEntry[] = [];
  private _currentChannel: ReleaseChannel = "development";

  /** Get current release channel */
  get currentChannel(): ReleaseChannel {
    return this._currentChannel;
  }

  /** Get release history */
  getHistory(): ReleaseEntry[] {
    return [...this.history].sort((a, b) => b.timestamp - a.timestamp);
  }

  /** Get latest active release */
  getLatestRelease(): ReleaseEntry | null {
    return this.history
      .filter((r) => r.status === "active")
      .sort((a, b) => b.timestamp - a.timestamp)[0] || null;
  }

  /** Register a new release */
  registerRelease(params: {
    channel?: ReleaseChannel;
    type?: ReleaseEntry["type"];
    notes?: string;
    author?: string;
  }): ReleaseEntry {
    const info = buildVersionManager.getBuildInfo();
    const releaseType = params.type || "release";

    // Mark previous active releases on this channel as rolled_back
    for (const entry of this.history) {
      if (
        entry.channel === (params.channel || this._currentChannel) &&
        entry.status === "active"
      ) {
        entry.status = "rolled_back";
      }
    }

    const entry: ReleaseEntry = {
      id: `release_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      version: info.version,
      buildNumber: info.buildNumber,
      channel: params.channel || this._currentChannel,
      timestamp: Date.now(),
      gitCommit: info.gitCommit,
      author: params.author || "CI/CD",
      notes: params.notes || "",
      type: releaseType,
      status: "active",
      duration: 0,
    };

    this.history.push(entry);
    this.pruneHistory();
    this.saveHistory();

    RuntimeSupervisor.emit(
      "info",
      "ReleaseManager",
      `${releaseType === "hotfix" ? "🔥 Hotfix" : releaseType === "rollback" ? "⏪ Rollback" : "🚀 Release"} v${info.version} → ${entry.channel}`,
    );

    return entry;
  }

  /** Rollback to a specific release */
  async rollback(releaseId: string): Promise<ReleaseEntry | null> {
    const target = this.history.find((r) => r.id === releaseId);
    if (!target) return null;

    // Mark current active as rolled_back
    for (const entry of this.history) {
      if (entry.status === "active" && entry.channel === target.channel) {
        entry.status = "rolled_back";
      }
    }

    // Create a rollback entry
    const rollbackEntry = this.registerRelease({
      channel: target.channel,
      type: "rollback",
      notes: `Rolled back to v${target.version} (build ${target.buildNumber})`,
      author: "Manual",
    });

    // Restore target to active
    target.status = "active";

    this.saveHistory();

    RuntimeSupervisor.emit("recovery", "ReleaseManager",
      `Rolled back to v${target.version} on ${target.channel}`);

    return rollbackEntry;
  }

  /** Compare two releases */
  compareReleases(id1: string, id2: string): {
    versionDiff: "newer" | "older" | "same" | "incompatible";
    buildDiff: number;
    channelMatch: boolean;
  } | null {
    const r1 = this.history.find((r) => r.id === id1);
    const r2 = this.history.find((r) => r.id === id2);
    if (!r1 || !r2) return null;

    return {
      versionDiff: buildVersionManager.compareVersions(r2.version),
      buildDiff: parseInt(r2.buildNumber) - parseInt(r1.buildNumber),
      channelMatch: r1.channel === r2.channel,
    };
  }

  /** Load release history from storage */
  loadHistory(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.history = JSON.parse(raw);
      }
    } catch { /* noop */ }
  }

  private pruneHistory(): void {
    if (this.history.length > MAX_HISTORY) {
      this.history.sort((a, b) => b.timestamp - a.timestamp);
      this.history = this.history.slice(0, MAX_HISTORY);
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
    } catch { /* noop */ }
  }
}

export const releaseManager = new ReleaseManagerImpl();
