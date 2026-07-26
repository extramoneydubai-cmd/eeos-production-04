/**
 * UnsavedWorkProtector — Detects dirty forms and protects against data loss.
 *
 * Features:
 *  - Track dirty state for any form/editor
 *  - Prompt before navigation when dirty
 *  - Autosave every 30 seconds where supported
 *  - Save/Discard/Cancel dialog
 */

import { RuntimeSupervisor } from "./RuntimeSupervisor";
import { errorLog } from "@/lib/error-logger";

interface DirtyForm {
  id: string;
  name: string;
  entityType: string;
  entityId?: string;
  dirtyAt: number;
  autosaveSupported: boolean;
}

class UnsavedWorkProtectorImpl {
  private forms: Map<string, DirtyForm> = new Map();
  private enabled = false;
  private autosaveTimer: ReturnType<typeof setInterval> | null = null;
  private onSaveCallbacks: Map<string, () => Promise<boolean>> = new Map();
  private onConfirmNavigation: ((formName: string) => "save" | "discard" | "cancel") | null = null;

  /** Start protecting unsaved work */
  start(): void {
    if (this.enabled) return;
    this.enabled = true;

    // Autosave every 30 seconds for dirty forms
    this.autosaveTimer = setInterval(() => this.autosaveAll(), 30000);

    // Attach beforeunload handler
    window.addEventListener("beforeunload", this.handleBeforeUnload);

    RuntimeSupervisor.emit("info", "UnsavedWorkProtector", "Started protecting unsaved work");
  }

  /** Stop */
  stop(): void {
    this.enabled = false;
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
      this.autosaveTimer = null;
    }
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
    this.forms.clear();
    this.onSaveCallbacks.clear();
  }

  /**
   * Mark a form as dirty.
   */
  markDirty(form: DirtyForm): void {
    this.forms.set(form.id, form);
  }

  /**
   * Mark a form as clean.
   */
  markClean(formId: string): void {
    this.forms.delete(formId);
    this.onSaveCallbacks.delete(formId);
  }

  /**
   * Register an autosave callback for a form.
   */
  onAutosave(formId: string, saveFn: () => Promise<boolean>): void {
    this.onSaveCallbacks.set(formId, saveFn);
  }

  /**
   * Set a function to handle navigation confirmation.
   * Should return "save", "discard", or "cancel".
   */
  setNavigationHandler(handler: (formName: string) => "save" | "discard" | "cancel"): void {
    this.onConfirmNavigation = handler;
  }

  /**
   * Check if there are dirty forms and handle accordingly.
   * Returns true if navigation is safe (no dirty forms or user confirmed discard).
   */
  async canNavigate(): Promise<boolean> {
    if (this.forms.size === 0) return true;

    const formNames = Array.from(this.forms.values()).map((f) => f.name).join(", ");

    if (this.onConfirmNavigation) {
      const action = this.onConfirmNavigation(formNames);
      if (action === "save") {
        const success = await this.saveAll();
        return success;
      }
      if (action === "cancel") {
        return false;
      }
      // discard
    }

    return true;
  }

  /** Get all dirty forms */
  getDirtyForms(): DirtyForm[] {
    return Array.from(this.forms.values());
  }

  /** Number of dirty forms */
  get dirtyCount(): number {
    return this.forms.size;
  }

  /** Whether there are any dirty forms */
  get isDirty(): boolean {
    return this.forms.size > 0;
  }

  /**
   * Save all dirty forms that support autosave.
   */
  async saveAll(): Promise<boolean> {
    let allSuccess = true;
    for (const [formId, form] of this.forms) {
      if (form.autosaveSupported) {
        const saveFn = this.onSaveCallbacks.get(formId);
        if (saveFn) {
          try {
            const success = await saveFn();
            if (success) {
              this.markClean(formId);
            } else {
              allSuccess = false;
            }
          } catch (err) {
            allSuccess = false;
            errorLog.push({
              message: `[UnsavedWork] Autosave failed for ${form.name}: ${err}`,
              stack: err instanceof Error ? err.stack || "" : "",
              source: "sdk",
              severity: "warning",
            });
          }
        }
      }
    }
    return allSuccess;
  }

  /**
   * Autosave all dirty forms that support it.
   */
  private async autosaveAll(): Promise<void> {
    if (this.forms.size === 0) return;
    await this.saveAll();
  }

  /**
   * Handle beforeunload event to prevent accidental data loss.
   */
  private handleBeforeUnload = (event: BeforeUnloadEvent): void => {
    if (this.forms.size > 0) {
      event.preventDefault();
      event.returnValue = "";
    }
  };
}

export const unsavedWorkProtector = new UnsavedWorkProtectorImpl();
