/**
 * RiskEngine — Enterprise Risk Scoring Engine
 *
 * Calculates real-time risk scores from multiple factors:
 * - Failed login attempts
 * - Permission violations
 * - Session anomalies
 * - Device trust
 * - API key health
 * - Error rates
 *
 * Integrates with SecurityEngine for event data.
 */

import { securityEngine } from "./SecurityEngine";

export interface RiskAssessment {
  score: number;
  label: "low" | "medium" | "high" | "critical";
  factors: RiskFactor[];
  timestamp: number;
}

export interface RiskFactor {
  name: string;
  weight: number;
  value: number;
  score: number;
  threshold: number;
  details: string;
}

export interface RiskProfile {
  userId: string;
  userName?: string;
  organizationId?: string;
  riskScore: number;
  riskLabel: string;
  lastAssessment: number;
  factors: RiskFactor[];
}

class RiskEngineClass {
  private assessments: Map<string, RiskAssessment> = new Map();
  private profiles: Map<string, RiskProfile> = new Map();
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private initialized = false;

  private readonly WEIGHTS = {
    FAILED_LOGIN: 25,
    PERMISSION_VIOLATION: 20,
    SESSION_ANOMALY: 15,
    DEVICE_TRUST: 15,
    API_KEY_HEALTH: 10,
    ERROR_RATE: 10,
    RECENT_ACTIVITY: 5,
  };

  private readonly THRESHOLDS = {
    FAILED_LOGIN: { warning: 3, critical: 10 },
    PERMISSION_VIOLATION: { warning: 2, critical: 5 },
    CONCURRENT_SESSIONS: { warning: 3, critical: 10 },
    API_KEY_EXPIRED: { warning: 1, critical: 5 },
    ERROR_RATE: { warning: 5, critical: 20 },
  };

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Run assessment every 30 seconds
    this.updateInterval = setInterval(() => {
      this.updateAllAssessments();
    }, 30000);

    // Initial assessment
    this.updateAllAssessments();
  }

  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.initialized = false;
  }

  private updateAllAssessments(): void {
    const assessment = this.calculateGlobalRisk();
    this.assessments.set("global", assessment);
  }

  calculateGlobalRisk(): RiskAssessment {
    const factors: RiskFactor[] = [];
    const events = securityEngine.getEvents({ limit: 500 });

    // Failed login factor
    const failedLogins = events.filter((e) => e.type === "failed_login");
    const failedLoginScore = this.calculateFactorScore(
      failedLogins.length,
      this.THRESHOLDS.FAILED_LOGIN.warning,
      this.THRESHOLDS.FAILED_LOGIN.critical
    );
    factors.push({
      name: "Failed Login Attempts",
      weight: this.WEIGHTS.FAILED_LOGIN,
      value: failedLogins.length,
      score: failedLoginScore,
      threshold: this.THRESHOLDS.FAILED_LOGIN.critical,
      details: `${failedLogins.length} failed login attempts in recent history`,
    });

    // Permission violation factor
    const violations = events.filter((e) => e.type === "permission_denied");
    const violationScore = this.calculateFactorScore(
      violations.length,
      this.THRESHOLDS.PERMISSION_VIOLATION.warning,
      this.THRESHOLDS.PERMISSION_VIOLATION.critical
    );
    factors.push({
      name: "Permission Violations",
      weight: this.WEIGHTS.PERMISSION_VIOLATION,
      value: violations.length,
      score: violationScore,
      threshold: this.THRESHOLDS.PERMISSION_VIOLATION.critical,
      details: `${violations.length} permission violations detected`,
    });

    // Session anomaly factor
    const activeSessions = securityEngine.getActiveSessions().length;
    const sessionScore = this.calculateFactorScore(
      activeSessions,
      this.THRESHOLDS.CONCURRENT_SESSIONS.warning,
      this.THRESHOLDS.CONCURRENT_SESSIONS.critical
    );
    factors.push({
      name: "Session Anomalies",
      weight: this.WEIGHTS.SESSION_ANOMALY,
      value: activeSessions,
      score: sessionScore,
      threshold: this.THRESHOLDS.CONCURRENT_SESSIONS.critical,
      details: `${activeSessions} active concurrent sessions`,
    });

    // API key health factor
    const apiKeys = securityEngine.getApiKeys();
    const expiredKeys = apiKeys.filter((k) => k.status === "expired").length;
    const keyScore = this.calculateFactorScore(
      expiredKeys,
      this.THRESHOLDS.API_KEY_EXPIRED.warning,
      this.THRESHOLDS.API_KEY_EXPIRED.critical
    );
    factors.push({
      name: "API Key Health",
      weight: this.WEIGHTS.API_KEY_HEALTH,
      value: expiredKeys,
      score: keyScore,
      threshold: this.THRESHOLDS.API_KEY_EXPIRED.critical,
      details: `${expiredKeys} expired API keys`,
    });

    // Error rate factor
    const criticalEvents = events.filter((e) => e.severity === "critical").length;
    const errorScore = this.calculateFactorScore(
      criticalEvents,
      this.THRESHOLDS.ERROR_RATE.warning,
      this.THRESHOLDS.ERROR_RATE.critical
    );
    factors.push({
      name: "Error Rate",
      weight: this.WEIGHTS.ERROR_RATE,
      value: criticalEvents,
      score: errorScore,
      threshold: this.THRESHOLDS.ERROR_RATE.critical,
      details: `${criticalEvents} critical events`,
    });

    // Calculate weighted overall score
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const overall = Math.round(
      factors.reduce((sum, f) => sum + (f.score * f.weight) / totalWeight, 0)
    );

    let label: RiskAssessment["label"] = "low";
    if (overall >= 70) label = "critical";
    else if (overall >= 45) label = "high";
    else if (overall >= 20) label = "medium";

    return {
      score: overall,
      label,
      factors,
      timestamp: Date.now(),
    };
  }

  private calculateFactorScore(value: number, warningThreshold: number, criticalThreshold: number): number {
    if (value >= criticalThreshold) return 100;
    if (value >= warningThreshold) {
      return 50 + ((value - warningThreshold) / (criticalThreshold - warningThreshold)) * 50;
    }
    if (value > 0) {
      return (value / warningThreshold) * 50;
    }
    return 0;
  }

  getUserRiskProfile(userId: string, userName?: string, organizationId?: string): RiskProfile {
    const events = securityEngine.getEvents({ actorId: userId, limit: 200 });
    const factors: RiskFactor[] = [];

    const failedLogins = events.filter((e) => e.type === "failed_login").length;
    factors.push({
      name: "Failed Login",
      weight: 30,
      value: failedLogins,
      score: this.calculateFactorScore(failedLogins, 2, 8),
      threshold: 8,
      details: `${failedLogins} failed attempts`,
    });

    const violations = events.filter((e) => e.type === "permission_denied").length;
    factors.push({
      name: "Violations",
      weight: 25,
      value: violations,
      score: this.calculateFactorScore(violations, 1, 4),
      threshold: 4,
      details: `${violations} violations`,
    });

    const userSessions = securityEngine.getActiveSessions().filter((s) => s.userId === userId);
    factors.push({
      name: "Active Sessions",
      weight: 15,
      value: userSessions.length,
      score: this.calculateFactorScore(userSessions.length, 2, 5),
      threshold: 5,
      details: `${userSessions.length} active sessions`,
    });

    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const score = Math.round(
      factors.reduce((sum, f) => sum + (f.score * f.weight) / totalWeight, 0)
    );

    let label = "low";
    if (score >= 70) label = "critical";
    else if (score >= 45) label = "high";
    else if (score >= 20) label = "medium";

    const profile: RiskProfile = {
      userId,
      userName,
      organizationId,
      riskScore: score,
      riskLabel: label,
      lastAssessment: Date.now(),
      factors,
    };

    this.profiles.set(userId, profile);
    return profile;
  }

  getGlobalAssessment(): RiskAssessment {
    return this.assessments.get("global") || this.calculateGlobalRisk();
  }

  getRecentHighRiskEvents(limit = 20): Array<{ type: string; timestamp: number; details?: Record<string, unknown> }> {
    return securityEngine
      .getEvents({ severity: "critical", limit: 100 })
      .slice(0, limit)
      .map((e) => ({
        type: e.type,
        timestamp: e.timestamp,
        details: e.details,
      }));
  }

  getHealth(): { status: string; lastAssessment: number; profiles: number } {
    const global = this.assessments.get("global");
    return {
      status: this.initialized ? "healthy" : "uninitialized",
      lastAssessment: global?.timestamp ?? 0,
      profiles: this.profiles.size,
    };
  }

  getFactorBreakdown(): Array<{ name: string; score: number; weight: number; status: string }> {
    const global = this.getGlobalAssessment();
    return global.factors.map((f) => ({
      name: f.name,
      score: f.score,
      weight: f.weight,
      status: f.score >= 70 ? "critical" : f.score >= 45 ? "high" : f.score >= 20 ? "medium" : "low",
    }));
  }
}

export const riskEngine = new RiskEngineClass();
