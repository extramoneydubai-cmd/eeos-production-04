/**
 * BackupManager — Handles backup and restore for EEOS platform data.
 *
 * Supports:
 *  - Convex export (manual via dashboard)
 *  - Local backup (settings, preferences, feature flags)
 *  - Workspace preferences
 *  - User preferences
 *  - Release manifests
 *
 * Allows:
 *  - Manual Backup
 *  - Scheduled Backup
 *  - Restore
 *  - Backup validation
 */

import { errorLog } from "@/lib/error-logger";
import { RuntimeSupervisor } from "@/platform/runtime/RuntimeSupervisor";

export interface BackupEntry {
  id: string;
  timestamp: number;
  type: "settings" | "preferences" | "flags" | "workspace" | "manifest" | "full";
  label: string;
  size: number;
  data: Record<string, unknown>;
  validated: boolean;
}

export interface BackupSchedule {
  enabled: boolean;
  intervalMs: number;
  types: BackupEntry["type"][];
  lastBackup: number | null;
}

const STORAGE_KEY = "eeos_backup_index";
const MAX_BACKUPS = 20;

class BackupManagerImpl {
  private backups: BackupEntry[] = [];
  private scheduleTimer: ReturnType<typeof setInterval> | null = null;
  private _schedule: BackupSchedule = {
    enabled: false,
    intervalMs: 3600000, // 1 hour
    types: ["settings", "preferences", "flags"],
    lastBackup: null,
  };

  /** Get all stored backups */
  getBackups(): BackupEntry[] {
    return [...this.backups].sort((a, b) => b.timestamp - a.timestamp);
  }

  /** Get current schedule */
  get schedule(): BackupSchedule {
    return { ...this._schedule };
  }

  /** Update backup schedule */
  updateSchedule(schedule: Partial<BackupSchedule>): void {
    this._schedule = { ...this._schedule, ...schedule };
    if (this._schedule.enabled) {
      this.startScheduled();
    } else {
      this.stopScheduled();
    }
    this.saveIndex();
  }

  /** Start scheduled backups */
  startScheduled(): void {
    this.stopScheduled();
    this.scheduleTimer = setInterval(() => {
      this.runScheduledBackup();
    }, this._schedule.intervalMs);
    RuntimeSupervisor.emit("info", "BackupManager", "Scheduled backups started");
  }

  /** Stop scheduled backups */
  stopScheduled(): void {
    if (this.scheduleTimer) {
      clearInterval(this.scheduleTimer);
      this.scheduleTimer = null;
    }
  }

  /** Run a full backup of all supported types */
  async backupAll(): Promise<BackupEntry[]> {
    const results: BackupEntry[] = [];
    results.push(this.backupSettings());
    results.push(this.backupPreferences());
    results.push(this.backupFlags());
    results.push(this.backupWorkspace());
    results.push(this.backupManifest());
    this.backups.push(...results);
    this.pruneOld();
    this.saveIndex();
    RuntimeSupervisor.emit("info", "BackupManager", `Backup complete: ${results.length} entries`);
    return results;
  }

  /** Backup app settings */
  backupSettings(): BackupEntry {
    const data: Record<string, unknown> = {};
    try {
      data.theme = localStorage.getItem("next-themes") || "light";
      data.debugPanel = localStorage.getItem("eeos_debug_panel_open") || "false";
    } catch { /* noop */ }

    return this.createEntry("settings", "App Settings", data);
  }

  /** Backup user preferences */
  backupPreferences(): BackupEntry {
    const data: Record<string, unknown> = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("eeos_") || key.startsWith("convex_") || key.startsWith("next-"))) {
          data[key] = localStorage.getItem(key);
        }
      }
    } catch { /* noop */ }

    return this.createEntry("preferences", "User Preferences", data);
  }

  /** Backup feature flags */
  backupFlags(): BackupEntry {
    const data: Record<string, unknown> = {};
    try {
      const flagsRaw = localStorage.getItem("eeos_feature_flags");
      if (flagsRaw) {
        data.flags = JSON.parse(flagsRaw);
      }
    } catch { /* noop */ }

    return this.createEntry("flags", "Feature Flags", data);
  }

  /** Backup workspace preferences */
  backupWorkspace(): BackupEntry {
    const data: Record<string, unknown> = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("workspace_")) {
          data[key] = localStorage.getItem(key);
        }
      }
    } catch { /* noop */ }

    return this.createEntry("workspace", "Workspace Preferences", data);
  }

  /** Backup release manifest */
  backupManifest(): BackupEntry {
    const data: Record<string, unknown> = {};
    try {
      const manifest = localStorage.getItem("eeos_release_manifest");
      if (manifest) {
        data.manifest = JSON.parse(manifest);
      }
    } catch { /* noop */ }

    return this.createEntry("manifest", "Release Manifest", data);
  }

  /** Restore from a backup entry */
  async restore(backupId: string): Promise<boolean> {
    const entry = this.backups.find((b) => b.id === backupId);
    if (!entry) return false;

    try {
      if (entry.type === "settings" || entry.type === "full") {
        for (const [key, value] of Object.entries(entry.data)) {
          if (typeof value === "string") {
            localStorage.setItem(key, value);
          }
        }
      }
      RuntimeSupervisor.emit("info", "BackupManager", `Restored backup: ${entry.label}`);
      return true;
    } catch (err) {
      errorLog.push({
        message: `[BackupManager] Restore failed: ${err}`,
        stack: "",
        source: "sdk",
        severity: "error",
      });
      return false;
    }
  }

  /** Validate a backup entry */
  validate(backupId: string): boolean {
    const entry = this.backups.find((b) => b.id === backupId);
    if (!entry) return false;

    try {
      const valid = entry.data !== null && typeof entry.data === "object";
      entry.validated = valid;
      this.saveIndex();
      return valid;
    } catch {
      return false;
    }
  }

  /** Delete a backup entry */
  delete(backupId: string): boolean {
    const idx = this.backups.findIndex((b) => b.id === backupId);
    if (idx === -1) return false;
    this.backups.splice(idx, 1);
    this.saveIndex();
    return true;
  }

  /** Export all backups as JSON */
  exportAll(): string {
    return JSON.stringify(this.backups, null, 2);
  }

  /** Import backups from JSON */
  importAll(json: string): number {
    try {
      const data = JSON.parse(json) as BackupEntry[];
      this.backups.push(...data);
      this.pruneOld();
      this.saveIndex();
      return data.length;
    } catch {
      return 0;
    }
  }

  /** Clear all backups */
  clearAll(): void {
    this.backups = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* noop */ }
  }

  private createEntry(type: BackupEntry["type"], label: string, data: Record<string, unknown>): BackupEntry {
    return {
      id: `backup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      type,
      label,
      size: new Blob([JSON.stringify(data)]).size,
      data,
      validated: false,
    };
  }

  private pruneOld(): void {
    if (this.backups.length > MAX_BACKUPS) {
      this.backups.sort((a, b) => b.timestamp - a.timestamp);
      this.backups = this.backups.slice(0, MAX_BACKUPS);
    }
  }

  private runScheduledBackup(): void {
    const results: BackupEntry[] = [];
    for (const type of this._schedule.types) {
      switch (type) {
        case "settings": results.push(this.backupSettings()); break;
        case "preferences": results.push(this.backupPreferences()); break;
        case "flags": results.push(this.backupFlags()); break;
        case "workspace": results.push(this.backupWorkspace()); break;
        case "manifest": results.push(this.backupManifest()); break;
      }
    }
    this.backups.push(...results);
    this.pruneOld();
    this._schedule.lastBackup = Date.now();
    this.saveIndex();
  }

  private saveIndex(): void {
    try {
      const index = this.backups.map(({ id, timestamp, type, label, size, validated }) => ({
        id, timestamp, type, label, size, validated,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ backups: index, schedule: this._schedule }));
    } catch { /* noop */ }
  }

  /** Load backup index from storage */
  loadIndex(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.backups) {
          this.backups = parsed.backups.map((b: BackupEntry) => ({
            ...b,
            data: {},
          }));
        }
        if (parsed.schedule) {
          this._schedule = { ...this._schedule, ...parsed.schedule };
        }
      }
    } catch { /* noop */ }
  }
}

export const backupManager = new BackupManagerImpl();
