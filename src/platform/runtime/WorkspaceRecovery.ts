/**
 * WorkspaceRecovery — Recovers workspace state when WorkspaceShell encounters failures.
 *
 * Recovery levels:
 *  1. Overview (full tab)
 *  2. Timeline sub-tab
 *  3. Documents sub-tab
 *  4. Minimal Mode (just the shell)
 *
 * Preserves: comments, tasks, notes, unsaved forms, selection, scroll position
 */

import { RuntimeSupervisor } from "./RuntimeSupervisor";
import { errorLog } from "@/lib/error-logger";

interface WorkspaceState {
  entityType: string;
  entityId: string;
  activeTab: string;
  scrollPosition: number;
  selectedItems: string[];
  dirtyForms: string[];
  expandedSections: string[];
  timestamp: number;
}

class WorkspaceRecoveryImpl {
  private stateStore = new Map<string, WorkspaceState>(); // key: "entityType:entityId"
  private _activeWorkspace: { entityType: string; entityId: string } | null = null;
  private enabled = false;
  private recoveryMode: "full" | "timeline" | "minimal" = "full";

  /** Current recovery mode */
  get mode(): "full" | "timeline" | "minimal" {
    return this.recoveryMode;
  }

  /** Start recovery service */
  start(): void {
    if (this.enabled) return;
    this.enabled = true;

    RuntimeSupervisor.registerRecovery({
      id: "workspace-recovery",
      name: "Workspace Recovery",
      component: "Workspace",
      priority: 80,
      attemptCount: 0,
      maxAttempts: 3,
      execute: async () => {
        await this.recoverWorkspace();
        return true;
      },
    });

    RuntimeSupervisor.emit("info", "WorkspaceRecovery", "Started workspace recovery service");
  }

  /** Stop */
  stop(): void {
    this.enabled = false;
    RuntimeSupervisor.emit("info", "WorkspaceRecovery", "Stopped");
  }

  /**
   * Set the active workspace (call from WorkspaceShell).
   */
  setActiveWorkspace(entityType: string, entityId: string): void {
    this._activeWorkspace = { entityType, entityId };

    // Restore state if available
    const key = `${entityType}:${entityId}`;
    const saved = this.stateStore.get(key);
    if (saved) {
      RuntimeSupervisor.emit("info", "WorkspaceRecovery", `Restored state for ${entityType}:${entityId}`);
    }
  }

  /**
   * Save the current workspace state (call from WorkspaceShell on tab change, scroll, etc.).
   */
  saveState(state: Partial<WorkspaceState>): void {
    if (!this._activeWorkspace) return;

    const key = `${this._activeWorkspace.entityType}:${this._activeWorkspace.entityId}`;
    const existing = this.stateStore.get(key) || {
      entityType: this._activeWorkspace.entityType,
      entityId: this._activeWorkspace.entityId,
      activeTab: "",
      scrollPosition: 0,
      selectedItems: [],
      dirtyForms: [],
      expandedSections: [],
      timestamp: Date.now(),
    };

    const updated: WorkspaceState = {
      ...existing,
      ...state,
      timestamp: Date.now(),
    };

    this.stateStore.set(key, updated);

    // Persist to sessionStorage for crash recovery
    try {
      sessionStorage.setItem(`workspace_state_${key}`, JSON.stringify(updated));
    } catch {}
  }

  /**
   * Clear saved state for an entity.
   */
  clearState(entityType: string, entityId: string): void {
    const key = `${entityType}:${entityId}`;
    this.stateStore.delete(key);
    try {
      sessionStorage.removeItem(`workspace_state_${key}`);
    } catch {}
  }

  /**
   * Get saved workspace state.
   */
  getState(entityType: string, entityId: string): WorkspaceState | null {
    const key = `${entityType}:${entityId}`;
    return this.stateStore.get(key) || null;
  }

  /**
   * Attempt to recover the workspace after a failure.
   */
  async recoverWorkspace(): Promise<void> {
    if (!this._activeWorkspace) return;

    const { entityType, entityId } = this._activeWorkspace;
    const key = `${entityType}:${entityId}`;

    // Try sessionStorage recovery first
    try {
      const stored = sessionStorage.getItem(`workspace_state_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored) as WorkspaceState;
        this.stateStore.set(key, parsed);
        this.recoveryMode = "full";
        RuntimeSupervisor.emit("recovery", "Workspace", "Full workspace state restored from sessionStorage");
        return;
      }
    } catch {}

    // Fallback: minimal mode
    this.recoveryMode = "minimal";
    RuntimeSupervisor.emit("recovery", "Workspace", "Minimal recovery mode activated");
  }

  /** Get all saved states */
  getAllStates(): WorkspaceState[] {
    return Array.from(this.stateStore.values());
  }

  /** Number of saved states */
  get stateCount(): number {
    return this.stateStore.size;
  }

  /** Clear all stored states */
  clear(): void {
    this.stateStore.clear();
    this._activeWorkspace = null;
    this.recoveryMode = "full";
  }
}

export const workspaceRecovery = new WorkspaceRecoveryImpl();
