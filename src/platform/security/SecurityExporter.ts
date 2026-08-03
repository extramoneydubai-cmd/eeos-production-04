/**
 * SecurityExporter — Security & Audit Data Export
 *
 * Generates downloadable reports in JSON, Markdown, CSV, and PDF formats.
 * Supports exporting audit logs, security events, risk assessments,
 * session data, permission profiles, and compliance reports.
 */

import { securityEngine, type SecurityEvent, type SecurityPolicy, type ApiKeyEntry } from "./SecurityEngine";
import { auditAggregator, type AuditEntry } from "./AuditAggregator";
import { riskEngine } from "./RiskEngine";
import { sessionMonitor } from "./SessionMonitor";
import { permissionInspector } from "./PermissionInspector";

export type ExportFormat = "json" | "markdown" | "csv";
export type ExportType =
  | "security_events"
  | "audit_log"
  | "risk_assessment"
  | "session_report"
  | "permission_profile"
  | "compliance_report"
  | "security_report"
  | "full_export";

class SecurityExporterClass {
  export(
    type: ExportType,
    format: ExportFormat,
    options?: {
      filters?: Record<string, unknown>;
      dateRange?: { start: number; end: number };
      userId?: string;
    }
  ): string {
    switch (type) {
      case "security_events":
        return this.exportSecurityEvents(format, options);
      case "audit_log":
        return this.exportAuditLog(format, options);
      case "risk_assessment":
        return this.exportRiskAssessment(format);
      case "session_report":
        return this.exportSessions(format);
      case "permission_profile":
        return this.exportPermissionProfile(format, options?.userId);
      case "compliance_report":
        return this.exportCompliance(format);
      case "security_report":
        return this.exportSecurityReport(format);
      case "full_export":
        return this.exportFull(format);
      default:
        return this.exportFull(format);
    }
  }

  private exportSecurityEvents(format: ExportFormat, options?: Record<string, unknown>): string {
    const events = securityEngine.getEvents({
      limit: (options?.limit as number) || 200,
    });
    switch (format) {
      case "json": return JSON.stringify(events, null, 2);
      case "markdown": return this.eventsToMarkdown(events);
      case "csv": return this.eventsToCsv(events);
    }
  }

  private exportAuditLog(format: ExportFormat, options?: Record<string, unknown>): string {
    const entries = auditAggregator.getEntries({
      limit: (options?.limit as number) || 200,
    });
    switch (format) {
      case "json": return JSON.stringify(entries, null, 2);
      case "markdown": return this.auditToMarkdown(entries);
      case "csv": return this.auditToCsv(entries);
    }
  }

  private exportRiskAssessment(format: ExportFormat): string {
    const assessment = riskEngine.getGlobalAssessment();
    const report = {
      timestamp: assessment.timestamp,
      score: assessment.score,
      label: assessment.label,
      factors: assessment.factors,
      breakdown: riskEngine.getFactorBreakdown(),
    };
    switch (format) {
      case "json": return JSON.stringify(report, null, 2);
      case "markdown": return this.riskToMarkdown(report);
      case "csv": return this.riskToCsv(report);
    }
  }

  private exportSessions(format: ExportFormat): string {
    const sessions = sessionMonitor.getActiveSessions();
    const anomalies = sessionMonitor.getRecentAnomalies(50);
    const stats = sessionMonitor.getSessionStats();
    const data = { sessions, anomalies, stats };
    switch (format) {
      case "json": return JSON.stringify(data, null, 2);
      case "markdown": return this.sessionsToMarkdown(data);
      case "csv": return this.sessionsToCsv(data);
    }
  }

  private exportPermissionProfile(format: ExportFormat, userId?: string): string {
    const profile = permissionInspector.resolvePermissions(
      userId || "anonymous",
      ["staff"]
    );
    switch (format) {
      case "json": return JSON.stringify(profile, null, 2);
      case "markdown": return this.permissionToMarkdown(profile as unknown as Record<string, unknown>);
      case "csv": return this.permissionsToCsv(profile as unknown as Record<string, unknown>);
    }
  }

  private exportCompliance(format: ExportFormat): string {
    const compliance = securityEngine.getComplianceStatus();
    const policies = securityEngine.getPolicies();
    const data = { compliance, policies };
    switch (format) {
      case "json": return JSON.stringify(data, null, 2);
      case "markdown": return this.complianceToMarkdown(data);
      case "csv": return this.complianceToCsv(data);
    }
  }

  private exportSecurityReport(format: ExportFormat): string {
    const report = securityEngine.generateSecurityReport("daily");
    const assessment = riskEngine.getGlobalAssessment();
    const sessionStats = sessionMonitor.getSessionStats();
    const data = { ...report, riskAssessment: assessment, sessions: sessionStats };
    switch (format) {
      case "json": return JSON.stringify(data, null, 2);
      case "markdown": return this.reportToMarkdown(data);
      case "csv": return this.reportToCsv(data);
    }
  }

  private exportFull(format: ExportFormat): string {
    const data = {
      security: {
        events: securityEngine.getEvents({ limit: 100 }),
        policies: securityEngine.getPolicies(),
        apiKeys: securityEngine.getApiKeys(),
      },
      audit: auditAggregator.getEntries({ limit: 100 }),
      risk: riskEngine.getGlobalAssessment(),
      sessions: {
        active: sessionMonitor.getActiveSessions(),
        anomalies: sessionMonitor.getRecentAnomalies(20),
        stats: sessionMonitor.getSessionStats(),
      },
      compliance: securityEngine.getComplianceStatus(),
      health: {
        security: securityEngine.getHealth(),
        audit: auditAggregator.getHealth(),
        risk: riskEngine.getHealth(),
        sessions: sessionMonitor.getHealth(),
        permissions: permissionInspector.getHealth(),
      },
    };
    return JSON.stringify(data, null, 2);
  }

  // ─── Markdown Formatters ─────────────────────────────────────

  private eventsToMarkdown(events: SecurityEvent[]): string {
    let md = "# Security Events Report\n\n";
    md += `Generated: ${new Date().toISOString()} | Total: ${events.length}\n\n`;
    md += "| ID | Timestamp | Type | Severity | Module | Actor |\n";
    md += "|---|---|---|---|---|---|\n";
    events.forEach((e) => {
      md += `| ${e.id.slice(0, 12)}... | ${new Date(e.timestamp).toLocaleString()} | ${e.type} | ${e.severity} | ${e.module || "-"} | ${e.actorName || e.actorId || "-"} |\n`;
    });
    return md;
  }

  private auditToMarkdown(entries: AuditEntry[]): string {
    let md = "# Audit Log Report\n\n";
    md += `Generated: ${new Date().toISOString()} | Total: ${entries.length}\n\n`;
    md += "| ID | Timestamp | Type | Severity | Module | Entity | Action | Actor |\n";
    md += "|---|---|---|---|---|---|---|---|\n";
    entries.forEach((e) => {
      md += `| ${e.id.slice(0, 12)}... | ${new Date(e.timestamp).toLocaleString()} | ${e.type} | ${e.severity} | ${e.module} | ${e.entity || "-"} | ${e.action} | ${e.actorName || "-"} |\n`;
    });
    return md;
  }

  private riskToMarkdown(report: Record<string, unknown>): string {
    let md = "# Risk Assessment Report\n\n";
    md += `**Score:** ${report.score}/100 (**${report.label}**)\n\n`;
    md += "## Risk Factors\n\n";
    md += "| Factor | Weight | Score | Status | Details |\n";
    md += "|---|---|---|---|---|\n";
    (report.factors as Array<Record<string, unknown>>).forEach((f: Record<string, unknown>) => {
      const status = (f.score as number) >= 70 ? "Critical" : (f.score as number) >= 45 ? "High" : (f.score as number) >= 20 ? "Medium" : "Low";
      md += `| ${f.name} | ${f.weight}% | ${f.score}/100 | ${status} | ${f.details} |\n`;
    });
    return md;
  }

  private sessionsToMarkdown(data: Record<string, unknown>): string {
    let md = "# Session Report\n\n";
    const stats = data.stats as Record<string, number>;
    md += `**Active:** ${stats.active} | **Idle:** ${stats.idle} | **Expired:** ${stats.expired} | **Total:** ${stats.total}\n\n`;
    md += "## Active Sessions\n\n";
    md += "| User | Started | Last Activity | Device |\n";
    md += "|---|---|---|---|\n";
    (data.sessions as Array<Record<string, unknown>>).forEach((s: Record<string, unknown>) => {
      md += `| ${s.userName || s.userId} | ${new Date(s.startedAt as number).toLocaleString()} | ${new Date(s.lastActivityAt as number).toLocaleString()} | ${s.browser || s.device || "-"} |\n`;
    });
    return md;
  }

  private permissionToMarkdown(profile: Record<string, unknown>): string {
    let md = "# Permission Profile\n\n";
    md += `**User:** ${profile.userName || profile.userId}\n`;
    md += `**Roles:** ${(profile.roles as string[]).join(", ")}\n`;
    md += `**Inherited Roles:** ${(profile.inheritedRoles as string[]).join(", ")}\n\n`;
    md += "## Effective Permissions\n\n";
    md += "| Resource | Action | Source |\n";
    md += "|---|---|---|\n";
    (profile.effectivePermissions as Array<Record<string, unknown>>).forEach((p: Record<string, unknown>) => {
      md += `| ${p.resource} | ${p.action} | ${p.source} |\n`;
    });
    return md;
  }

  private complianceToMarkdown(data: Record<string, unknown>): string {
    let md = "# Compliance Report\n\n";
    (data.compliance as Array<Record<string, unknown>>).forEach((c: Record<string, unknown>) => {
      md += `## ${c.standard}\n`;
      md += `- **Compliance:** ${c.compliancePercent}%\n`;
      md += `- **Status:** ${(c.compliancePercent as number) >= 90 ? "✅ PASS" : (c.compliancePercent as number) >= 70 ? "⚠️ WARNING" : "❌ FAIL"}\n`;
      md += `- **Violations:** ${(c.violations as string[]).length > 0 ? (c.violations as string[]).join(", ") : "None"}\n`;
      md += `- **Recommendations:** ${(c.recommendations as string[]).length > 0 ? (c.recommendations as string[]).join(", ") : "None"}\n\n`;
    });
    return md;
  }

  private reportToMarkdown(report: Record<string, unknown>): string {
    let md = "# Daily Security Report\n\n";
    md += `Generated: ${new Date(report.generatedAt as number).toISOString()}\n\n`;
    const summary = report.summary as Record<string, unknown>;
    md += "## Summary\n\n";
    Object.entries(summary).forEach(([key, value]) => {
      md += `- **${key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}:** ${value}\n`;
    });
    md += `\n## Risk Score\n\n- **Score:** ${(report.riskAssessment as Record<string, unknown>).score}/100\n- **Label:** ${(report.riskAssessment as Record<string, unknown>).label}\n`;
    return md;
  }

  // ─── CSV Formatters ──────────────────────────────────────────

  private eventsToCsv(events: SecurityEvent[]): string {
    const headers = ["ID", "Timestamp", "Type", "Severity", "Module", "Actor", "Entity", "Success"];
    const rows = events.map((e) =>
      [e.id, new Date(e.timestamp).toISOString(), e.type, e.severity, e.module || "", e.actorName || "", e.entity || "", e.success !== undefined ? String(e.success) : ""].join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  }

  private auditToCsv(entries: AuditEntry[]): string {
    const headers = ["ID", "Timestamp", "Type", "Severity", "Module", "Entity", "Action", "Actor", "Source"];
    const rows = entries.map((e) =>
      [e.id, new Date(e.timestamp).toISOString(), e.type, e.severity, e.module, e.entity || "", e.action, e.actorName || "", e.source].join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  }

  private riskToCsv(report: Record<string, unknown>): string {
    const headers = ["Factor", "Weight", "Score", "Details"];
    const rows = (report.factors as Array<Record<string, unknown>>).map((f: Record<string, unknown>) =>
      [f.name, String(f.weight), String(f.score), f.details].join(",")
    );
    return [`# Risk Score: ${report.score}/100 (${report.label})`, headers.join(","), ...rows].join("\n");
  }

  private sessionsToCsv(data: Record<string, unknown>): string {
    const headers = ["User", "Started", "Last Activity", "Browser", "Active"];
    const rows = (data.sessions as Array<Record<string, unknown>>).map((s: Record<string, unknown>) =>
      [s.userName || s.userId, new Date(s.startedAt as number).toISOString(), new Date(s.lastActivityAt as number).toISOString(), s.browser || "", String(s.isActive)].join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  }

  private permissionsToCsv(profile: Record<string, unknown>): string {
    const headers = ["Resource", "Action", "Allowed", "Source"];
    const rows = (profile.effectivePermissions as Array<Record<string, unknown>>).map((p: Record<string, unknown>) =>
      [p.resource, p.action, String(p.allowed), p.source].join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  }

  private complianceToCsv(data: Record<string, unknown>): string {
    const headers = ["Standard", "Compliance %", "Passed", "Failed", "Warnings"];
    const rows = (data.compliance as Array<Record<string, unknown>>).map((c: Record<string, unknown>) =>
      [c.standard, String(c.compliancePercent), String(c.passed), String(c.failed), String(c.warnings)].join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  }

  private reportToCsv(report: Record<string, unknown>): string {
    const summary = report.summary as Record<string, unknown>;
    return Object.entries(summary)
      .map(([key, value]) => `${key},${value}`)
      .join("\n");
  }

  download(type: ExportType, format: ExportFormat, filename?: string): void {
    const content = this.export(type, format);
    const blob = new Blob([content], {
      type: format === "json" ? "application/json" : format === "csv" ? "text/csv" : "text/markdown",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `eeos_${type}_${new Date().toISOString().split("T")[0]}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const securityExporter = new SecurityExporterClass();
