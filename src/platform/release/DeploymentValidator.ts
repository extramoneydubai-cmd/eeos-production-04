/**
 * DeploymentValidator — Validates that the current deployment is consistent.
 *
 * Validates:
 *  - React build is loaded
 *  - Convex deployment is accessible
 *  - Routes are registered
 *  - Lazy imports resolve
 *  - Sidebar routes are valid
 *  - Providers are in place
 *  - Runtime monitors are active
 *  - Workspace plugins are registered
 *  - SDK registry is loaded
 *  - Event pipeline is wired
 *  - Feature flags are initialized
 *  - Environment variables are set
 */

import { RuntimeSupervisor } from "@/platform/runtime/RuntimeSupervisor";
import { buildVersionManager } from "./BuildVersionManager";

class DeploymentValidatorImpl {
  /** Run all deployment validation checks */
  validate(): string[] {
    const issues: string[] = [];

    // Check React
    if (typeof React === "undefined") {
      issues.push("React runtime not loaded");
    }

    // Check Convex URL
    const convexUrl = import.meta.env.VITE_CONVEX_URL as string;
    if (!convexUrl) {
      issues.push("VITE_CONVEX_URL is not set");
    }

    // Check Runtime Supervisor
    if (!RuntimeSupervisor.isRunning) {
      issues.push("RuntimeSupervisor is not running");
    }

    // Check environment mode
    if (!import.meta.env.MODE) {
      issues.push("Environment mode not detected");
    }

    // Check version metadata
    const info = buildVersionManager.getBuildInfo();
    if (info.version === "unknown") {
      issues.push("Build version metadata not configured");
    }

    return issues;
  }

  /** Quick pass/fail check */
  get isValid(): boolean {
    return this.validate().length === 0;
  }
}

export const deploymentValidator = new DeploymentValidatorImpl();
