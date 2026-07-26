/**
 * HealthScoreEngine — Calculates overall platform health as a score 0–100.
 *
 * Component weights:
 *  - React: 20%
 *  - Convex: 20%
 *  - SDK: 15%
 *  - Memory: 10%
 *  - Network: 10%
 *  - Router: 10%
 *  - Workspace: 10%
 *  - Storage: 5%
 *
 * Score thresholds:
 *  95–100: Excellent
 *  80–94: Healthy
 *  60–79: Warning
 *  Below 60: Critical
 */

import { RuntimeSupervisor, type HealthComponent, type HealthStatus } from "./RuntimeSupervisor";

interface HealthScoreResult {
  score: number;
  label: "excellent" | "healthy" | "warning" | "critical";
  components: Record<string, { status: HealthStatus; weight: number; contribution: number }>;
}

const COMPONENT_WEIGHTS: Record<string, number> = {
  React: 0.20,
  Convex: 0.20,
  SDK: 0.15,
  Memory: 0.10,
  Network: 0.10,
  Router: 0.10,
  Workspace: 0.10,
  Storage: 0.05,
};

const STATUS_SCORES: Record<HealthStatus, number> = {
  healthy: 1.0,
  warning: 0.5,
  critical: 0.2,
  down: 0.0,
};

class HealthScoreEngineImpl {
  private lastScore: HealthScoreResult | null = null;
  private enabled = false;

  /** Start the engine */
  start(): void {
    if (this.enabled) return;
    this.enabled = true;

    RuntimeSupervisor.registerMonitor("HealthScore", () => this.healthCheck());

    RuntimeSupervisor.emit("info", "HealthScoreEngine", "Started");
  }

  /** Stop */
  stop(): void {
    this.enabled = false;
    this.lastScore = null;
    RuntimeSupervisor.unregisterMonitor("HealthScore");
  }

  /**
   * Calculate the current platform health score.
   */
  calculate(): HealthScoreResult {
    const health = RuntimeSupervisor.getHealth();
    const components: HealthScoreResult["components"] = {};
    let totalWeight = 0;
    let weightedScore = 0;

    for (const [name, component] of health) {
      const weight = COMPONENT_WEIGHTS[name] || 0.05;
      const status = component.status;
      const contribution = STATUS_SCORES[status] * weight;

      components[name] = { status, weight, contribution: Math.round(contribution * 100) / 100 };
      weightedScore += contribution;
      totalWeight += weight;
    }

    // Fill in missing components with 0.5 (assumed halfway)
    for (const [name, weight] of Object.entries(COMPONENT_WEIGHTS)) {
      if (!components[name]) {
        components[name] = { status: "warning", weight, contribution: 0.5 * weight };
        weightedScore += 0.5 * weight;
        totalWeight += weight;
      }
    }

    // Normalize to account for missing components
    const normalizedScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    const score = Math.round(normalizedScore * 100);

    const label =
      score >= 95 ? "excellent"
        : score >= 80 ? "healthy"
          : score >= 60 ? "warning"
            : "critical";

    this.lastScore = { score, label, components };
    return this.lastScore;
  }

  /** Get the last calculated score */
  getLastScore(): HealthScoreResult | null {
    return this.lastScore;
  }

  /** Get a color for the score */
  getScoreColor(score: number): string {
    if (score >= 95) return "text-green-500";
    if (score >= 80) return "text-blue-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  }

  /** Get a background color for the score */
  getScoreBgColor(score: number): string {
    if (score >= 95) return "bg-green-50 border-green-200";
    if (score >= 80) return "bg-blue-50 border-blue-200";
    if (score >= 60) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  }

  /**
   * Health check for RuntimeSupervisor.
   */
  private async healthCheck() {
    const result = this.calculate();
    return {
      name: "HealthScore",
      status: result.score >= 80 ? "healthy" : result.score >= 60 ? "warning" : "critical",
      lastCheck: Date.now(),
      message: `Score: ${result.score}/100 — ${result.label}`,
      details: { score: result.score, label: result.label },
    } as HealthComponent;
  }
}

export const healthScoreEngine = new HealthScoreEngineImpl();
