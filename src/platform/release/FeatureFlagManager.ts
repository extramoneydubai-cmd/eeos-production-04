/**
 * FeatureFlagManager — Centralized feature flag management.
 *
 * Supports feature scopes:
 *  - Global
 *  - Organization
 *  - Company
 *  - Branch
 *  - Department
 *  - Role
 *  - User
 *
 * Feature types: beta, experimental, production, hidden, internal
 *
 * Exposes:
 *  - isEnabled()
 *  - enable()
 *  - disable()
 *  - listFlags()
 */

import { appConfig } from "@/config/app";

export type FeatureType = "beta" | "experimental" | "production" | "hidden" | "internal";

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  type: FeatureType;
  enabled: boolean;
  scope: "global" | "organization" | "company" | "branch" | "department" | "role" | "user";
}

const BUILT_IN_FLAGS: FeatureFlag[] = [
  { id: "commandPalette", name: "Command Palette", description: "Ctrl+K command palette", type: "production", enabled: true, scope: "global" },
  { id: "globalSearch", name: "Global Search", description: "Cross-module global search", type: "production", enabled: true, scope: "global" },
  { id: "notificationCenter", name: "Notification Center", description: "In-app notification center", type: "production", enabled: true, scope: "global" },
  { id: "darkMode", name: "Dark Mode", description: "Dark mode theme support", type: "experimental", enabled: false, scope: "global" },
  { id: "aiAssistant", name: "AI Assistant", description: "AI-powered platform assistant", type: "beta", enabled: false, scope: "global" },
  { id: "analytics", name: "Advanced Analytics", description: "Cross-module analytics dashboards", type: "beta", enabled: false, scope: "global" },
  { id: "releaseHealth", name: "Release Health Dashboard", description: "Production readiness dashboard", type: "production", enabled: true, scope: "global" },
  { id: "runtimeOverlay", name: "Runtime Overlay", description: "Developer runtime overlay (Ctrl+Shift+R)", type: "production", enabled: true, scope: "global" },
  { id: "debugPanel", name: "Debug Panel", description: "Runtime error debug panel (Ctrl+Shift+E)", type: "production", enabled: true, scope: "global" },
  { id: "batchOperations", name: "Batch Operations", description: "Bulk selection and batch actions", type: "beta", enabled: true, scope: "global" },
  { id: "bulkExport", name: "Bulk Export", description: "Export data in CSV/Excel/PDF", type: "beta", enabled: true, scope: "global" },
  { id: "importWizard", name: "Import Wizard", description: "Guided data import flow", type: "beta", enabled: true, scope: "global" },
];

const STORAGE_KEY = "eeos_feature_overrides";

class FeatureFlagManagerImpl {
  private flags: Map<string, FeatureFlag> = new Map();
  private overrides: Map<string, boolean> = new Map();
  private initialized = false;

  /** Initialize with built-in flags */
  init(): void {
    if (this.initialized) return;
    for (const flag of BUILT_IN_FLAGS) {
      this.flags.set(flag.id, { ...flag });
    }
    this.loadOverrides();
    this.initialized = true;
  }

  /** Check if a feature is enabled */
  isEnabled(featureId: string): boolean {
    if (!this.initialized) this.init();

    // Check runtime overrides first
    const override = this.overrides.get(featureId);
    if (override !== undefined) return override;

    // Check built-in flag
    const flag = this.flags.get(featureId);
    if (!flag) return false;

    // Check app config
    const configFlag = (appConfig.features as Record<string, boolean | undefined>)[featureId];
    if (configFlag !== undefined) return configFlag;

    return flag.enabled;
  }

  /** Enable a feature at runtime */
  enable(featureId: string): void {
    this.overrides.set(featureId, true);
    this.saveOverrides();
  }

  /** Disable a feature at runtime */
  disable(featureId: string): void {
    this.overrides.set(featureId, false);
    this.saveOverrides();
  }

  /** Toggle a feature */
  toggle(featureId: string): boolean {
    const current = this.isEnabled(featureId);
    if (current) {
      this.disable(featureId);
    } else {
      this.enable(featureId);
    }
    return !current;
  }

  /** List all registered features */
  listFlags(): FeatureFlag[] {
    if (!this.initialized) this.init();
    return Array.from(this.flags.values()).map((f) => ({
      ...f,
      enabled: this.isEnabled(f.id),
    }));
  }

  /** Get flags by type */
  getByType(type: FeatureType): FeatureFlag[] {
    return this.listFlags().filter((f) => f.type === type);
  }

  /** Get flags by scope */
  getByScope(scope: FeatureFlag["scope"]): FeatureFlag[] {
    return this.listFlags().filter((f) => f.scope === scope);
  }

  /** Register a new feature flag at runtime */
  register(flag: FeatureFlag): void {
    this.flags.set(flag.id, flag);
  }

  /** Reset all overrides */
  resetAll(): void {
    this.overrides.clear();
    this.saveOverrides();
  }

  /** Number of registered flags */
  get count(): number {
    return this.flags.size;
  }

  private loadOverrides(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        for (const [key, val] of Object.entries(parsed)) {
          this.overrides.set(key, val as boolean);
        }
      }
    } catch {}
  }

  private saveOverrides(): void {
    try {
      const obj: Record<string, boolean> = {};
      for (const [key, val] of this.overrides) {
        obj[key] = val;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch {}
  }
}

export const featureFlagManager = new FeatureFlagManagerImpl();
