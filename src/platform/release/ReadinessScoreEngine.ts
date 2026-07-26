/**
 * ReadinessScoreEngine — Calculates production readiness score 0–100.
 *
 * Weights:
 *  - Build Integrity: 20%
 *  - Runtime: 20%
 *  - SDK: 15%
 *  - Schema: 10%
 *  - Assets: 10%
 *  - Authentication: 10%
 *  - Storage: 5%
 *  - Cache: 5%
 *  - Routes: 5%
 *  - Workspace: 5%
 *
 * Thresholds:
 *  95–100: Production Ready
 *  85–94: Release Candidate
 *  70–84: Needs Attention
 *  Below 70: Blocked
 */

import type { ReadinessCheck } from "./ProductionReadinessManager";

class ReadinessScoreEngineImpl {
  /** Calculate score from checklist results */
  calculate(checks: ReadinessCheck[]): number {
    if (checks.length === 0) return 0;

    let totalWeight = 0;
    let weightedScore = 0;

    const weights = this.getWeights();

    for (const check of checks) {
      const weight = weights[check.category] || 0.15;

      let score: number;
      switch (check.status) {
        case "pass": score = 1.0; break;
        case "warn": score = 0.6; break;
        case "skip": score = 0.8; break;
        case "fail": score = 0.0; break;
        default: score = 0.5;
      }

      weightedScore += score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
  }

  /** Get label for a score */
  getLabel(score: number): string {
    if (score >= 95) return "Production Ready";
    if (score >= 85) return "Release Candidate";
    if (score >= 70) return "Needs Attention";
    return "Blocked";
  }

  /** Get color class for a score */
  getColorClass(score: number): string {
    if (score >= 95) return "text-green-600";
    if (score >= 85) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  }

  /** Get background class for a score */
  getBgColorClass(score: number): string {
    if (score >= 95) return "bg-green-50 border-green-200";
    if (score >= 85) return "bg-blue-50 border-blue-200";
    if (score >= 70) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  }

  private getWeights(): Record<string, number> {
    return {
      critical: 0.25,
      important: 0.15,
      info: 0.05,
    };
  }
}

export const readinessScoreEngine = new ReadinessScoreEngineImpl();
