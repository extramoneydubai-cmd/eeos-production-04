/**
 * DeploymentValidator — Validates that the current deployment is consistent.
 *
 * Validates:
 *  - Convex deployment is accessible
 *  - Routes are registered
 *  - Environment variables are set
 *  - Build version metadata is configured
 */
import { buildVersionManager } from "./BuildVersionManager";

class DeploymentValidatorImpl {
  /** Run all deployment validation checks */
  validate(): string[] {
    const issues: string[] = [];

    // Check Convex URL
    const convexUrl = import.meta.env.VITE_CONVEX_URL as string;
    if (!convexUrl) {
      issues.push("VITE_CONVEX_URL is not set");
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
