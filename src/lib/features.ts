/**
 * EEOS Feature Flags
 *
 * Controls module availability at the application level.
 * Modules can be: enabled, disabled, beta, coming-soon, hidden.
 *
 * Usage:
 *   import { isFeatureEnabled } from "@/lib/features";
 *   if (isFeatureEnabled("commandPalette")) { ... }
 */

import { appConfig } from "@/config/app";
import { studios, type ModuleStatus } from "@/config/studios";

/** App-level feature flags (non-module features) */
export type AppFeature = keyof typeof appConfig.features;

/** Module feature flag */
export interface ModuleFeature {
  moduleId: string;
  status: ModuleStatus;
}

/**
 * Check if an app-level feature is enabled.
 */
export function isFeatureEnabled(feature: AppFeature): boolean {
  return appConfig.features[feature] === true;
}

/**
 * Check if a module is available for use.
 * Returns true for "enabled" and "beta" status.
 */
export function isModuleEnabled(moduleId: string): boolean {
  const studio = studios.find((s) => s.id === moduleId);
  if (!studio) return false;
  return studio.status === "enabled" || studio.status === "beta";
}

/**
 * Get the display status label for a module.
 * Returns null if the module should not show a badge.
 */
export function getModuleStatusLabel(moduleId: string): string | null {
  const studio = studios.find((s) => s.id === moduleId);
  if (!studio) return null;
  switch (studio.status) {
    case "beta": return "Beta";
    case "coming-soon": return "Coming Soon";
    case "disabled": return "Disabled";
    default: return null;
  }
}

/**
 * Get all enabled modules for navigation rendering.
 */
export function getEnabledModules() {
  return studios.filter(
    (s) => s.status === "enabled" || s.status === "beta",
  );
}

/**
 * Get all visible modules (not hidden).
 */
export function getVisibleModules() {
  return studios.filter((s) => s.status !== "hidden");
}
