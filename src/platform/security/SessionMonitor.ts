/**
 * SessionMonitor — Real-time Session Tracking & Monitoring
 *
 * Tracks active sessions, detects anomalies, and provides
 * session management capabilities.
 *
 * Integrates with SecurityEngine and RuntimeSupervisor.
 */

import { securityEngine, type SessionInfo } from "./SecurityEngine";

export interface SessionAnomaly {
  id: string;
  userId: string;
  userName?: string;
  type: "multiple_sessions" | "new_device" | "new_location" | "inactive_session" | "expired_token" | "suspicious_activity";
  severity: "low" | "medium" | "high" | "critical";
  timestamp: number;
  details: string;
  sessionId?: string;
  resolved: boolean;
}

class SessionMonitorClass {
  private anomalies: SessionAnomaly[] = [];
  private maxAnomalies = 500;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private initialized = false;

  // Session store with additional tracking data
  private sessionMetadata: Map<string, { lastRoute: string; pageViews: number; ipHistory: string[] }> = new Map();

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Check for anomalies every 15 seconds
    this.checkInterval = setInterval(() => {
      this.detectAnomalies();
    }, 15000);

    // Subscribe to session events from SecurityEngine
    securityEngine.onEvent((event) => {
      if (event.type === "login" || event.type === "logout" || event.type === "session_expired") {
        this.updateSessionTrackers(event);
      }
    });
  }

  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.initialized = false;
  }

  private updateSessionTrackers(event: import("./SecurityEngine").SecurityEvent): void {
    if (!event.sessionId) return;
    const metadata = this.sessionMetadata.get(event.sessionId) || {
      lastRoute: "",
      pageViews: 0,
      ipHistory: [],
    };

    if (event.ip && !metadata.ipHistory.includes(event.ip)) {
      metadata.ipHistory.push(event.ip);
    }

    this.sessionMetadata.set(event.sessionId, metadata);
  }

  trackPageView(sessionId: string, route: string): void {
    const metadata = this.sessionMetadata.get(sessionId) || {
      lastRoute: "",
      pageViews: 0,
      ipHistory: [],
    };
    metadata.lastRoute = route;
    metadata.pageViews++;
    this.sessionMetadata.set(sessionId, metadata);
  }

  private detectAnomalies(): void {
    const activeSessions = securityEngine.getActiveSessions();

    // Detect multiple sessions per user
    const sessionMap = new Map<string, SessionInfo[]>();
    activeSessions.forEach((session) => {
      const existing = sessionMap.get(session.userId) || [];
      existing.push(session);
      sessionMap.set(session.userId, existing);
    });

    sessionMap.forEach((sessions, userId) => {
      if (sessions.length > 3) {
        this.addAnomaly({
          userId,
          userName: sessions[0].userName,
          type: "multiple_sessions",
          severity: sessions.length > 5 ? "critical" : "high",
          details: `${sessions.length} concurrent sessions from ${this.getUniqueIpCount(userId)} different IPs`,
          sessionId: sessions[0].id,
        });
      }
    });

    // Detect expired sessions
    const now = Date.now();
    securityEngine.getAllSessions().forEach((session) => {
      if (session.isActive && session.expiresAt < now) {
        this.addAnomaly({
          userId: session.userId,
          userName: session.userName,
          type: "expired_token",
          severity: "medium",
          details: `Session expired at ${new Date(session.expiresAt).toLocaleString()}`,
          sessionId: session.id,
        });
        session.isActive = false;
      }
    });
  }

  private getUniqueIpCount(userId: string): number {
    const ips = new Set<string>();
    securityEngine
      .getAllSessions()
      .filter((s) => s.userId === userId)
      .forEach((s) => {
        const metadata = this.sessionMetadata.get(s.id);
        if (metadata) metadata.ipHistory.forEach((ip) => ips.add(ip));
      });
    return ips.size;
  }

  private addAnomaly(anomaly: Omit<SessionAnomaly, "id" | "timestamp" | "resolved">): void {
    // Don't add duplicate anomalies for the same user/type within 5 minutes
    const recent = this.anomalies.find(
      (a) =>
        a.userId === anomaly.userId &&
        a.type === anomaly.type &&
        !a.resolved &&
        Date.now() - a.timestamp < 300000
    );
    if (recent) return;

    const fullAnomaly: SessionAnomaly = {
      ...anomaly,
      id: `anom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      resolved: false,
    };
    this.anomalies.unshift(fullAnomaly);
    if (this.anomalies.length > this.maxAnomalies) this.anomalies.pop();

    securityEngine.recordEvent({
      type: "session_expired",
      severity: anomaly.severity === "critical" ? "critical" : "high",
      module: "SessionMonitor",
      actorId: anomaly.userId,
      actorName: anomaly.userName,
      details: { anomalyType: anomaly.type, details: anomaly.details },
    });
  }

  getActiveSessions() {
    return securityEngine.getActiveSessions();
  }

  getRecentAnomalies(limit = 20): SessionAnomaly[] {
    return this.anomalies.slice(0, limit);
  }

  getAnomalyCount(): { total: number; unresolved: number } {
    return {
      total: this.anomalies.length,
      unresolved: this.anomalies.filter((a) => !a.resolved).length,
    };
  }

  resolveAnomaly(anomalyId: string): boolean {
    const anomaly = this.anomalies.find((a) => a.id === anomalyId);
    if (!anomaly) return false;
    anomaly.resolved = true;
    return true;
  }

  terminateSession(sessionId: string): boolean {
    return securityEngine.terminateSession(sessionId);
  }

  getSessionStats(): {
    active: number;
    idle: number;
    expired: number;
    total: number;
  } {
    const sessions = securityEngine.getAllSessions();
    return {
      active: sessions.filter((s) => s.isActive).length,
      idle: sessions.filter((s) => s.isIdle).length,
      expired: sessions.filter((s) => !s.isActive).length,
      total: sessions.length,
    };
  }

  getHealth(): { status: string; activeSessions: number; anomalyCount: number } {
    return {
      status: this.initialized ? "healthy" : "uninitialized",
      activeSessions: this.getActiveSessions().length,
      anomalyCount: this.anomalies.length,
    };
  }
}

export const sessionMonitor = new SessionMonitorClass();
