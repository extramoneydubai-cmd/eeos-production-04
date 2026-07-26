/**
 * ProductionReadinessManager — Core singleton that coordinates all production validation.
 *
 * States: Booting → Checking → Ready | Warning | Failed
 *
 * Responsibilities:
 *  - Runs during boot
 *  - Coordinates all production validation (build, env, schema, assets, etc.)
 *  - Emits readiness events
 *  - Blocks startup on critical failures
 *  - Produces readiness report
 */

import { RuntimeSupervisor } from "@/platform/runtime/RuntimeSupervisor";
import { errorLog } from "@/lib/error-logger";
import { buildVersionManager } from "./BuildVersionManager";
import { environmentValidator } from "./EnvironmentValidator";
import { schemaCompatibility } from "./SchemaCompatibility";
import { cacheManager } from "./CacheManager";
import { deploymentValidator } from "./DeploymentValidator";
import { rollbackDetector } from "./RollbackDetection";
import { productionChecklistEngine } from "./ProductionChecklistEngine";
import { readinessScoreEngine } from "./ReadinessScoreEngine";

export type ReadinessState = "booting" | "checking" | "ready" | "warning" | "failed";

export interface ReadinessReport {
  state: ReadinessState;
  version: string;
  buildNumber: string;
  environment: string;
  checks: ReadinessCheck[];
  score: number;
  scoreLabel: string;
  timestamp: number;
  duration: number;
}

export interface ReadinessCheck {
  name: string;
  category: "critical" | "important" | "info";
  status: "pass" | "warn" | "fail" | "skip";
  message: string;
  duration: number;
  details?: string;
}

export type ReadinessListener = (state: ReadinessState, report: ReadinessReport) => void;

class ProductionReadinessManagerImpl {
  private _state: ReadinessState = "booting";
  private _report: ReadinessReport | null = null;
  private listeners: Set<ReadinessListener> = new Set();
  private _startTime = 0;
  private maxRetries = 3;
  private retryCount = 0;

  /** Current readiness state */
  get state(): ReadinessState {
    return this._state;
  }

  /** Last readiness report */
  get report(): ReadinessReport | null {
    return this._report;
  }

  /** Subscribe to state changes */
  subscribe(listener: ReadinessListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Run full production readiness validation */
  async validate(): Promise<ReadinessReport> {
    this._state = "checking";
    this._startTime = Date.now();
    this.retryCount = 0;

    RuntimeSupervisor.emit("info", "ProductionReadiness", "Starting production readiness validation...");

    const checks: ReadinessCheck[] = [];

    // Order matters — fail fast on critical checks
    try {
      checks.push(this.checkBuildVersion());
      checks.push(this.checkEnvironment());
      checks.push(this.checkSchema());
      checks.push(this.checkDeployment());
      checks.push(this.checkAssets());
      checks.push(this.checkRollback());
      checks.push(this.checkChecklist());
    } catch (err) {
      errorLog.push({
        message: `[ProductionReadiness] Validation threw: ${err}`,
        stack: err instanceof Error ? err.stack || "" : "",
        source: "sdk",
        severity: "critical",
      });
    }

    // Determine state
    const criticalFails = checks.filter((c) => c.category === "critical" && c.status === "fail");
    const warnings = checks.filter((c) => c.status === "warn");

    let state: ReadinessState;
    if (criticalFails.length > 0) {
      state = "failed";
    } else if (warnings.length > 0) {
      state = "warning";
    } else {
      state = "ready";
    }

    // Calculate score
    const score = readinessScoreEngine.calculate(checks);
    const scoreLabel = readinessScoreEngine.getLabel(score);

    const duration = Date.now() - this._startTime;

    this._report = {
      state,
      version: buildVersionManager.getVersionString(),
      buildNumber: buildVersionManager.buildNumber,
      environment: buildVersionManager.environment,
      checks,
      score,
      scoreLabel,
      timestamp: Date.now(),
      duration,
    };

    this._state = state;

    // Emit event
    if (state === "failed") {
      RuntimeSupervisor.emit("failure", "ProductionReadiness", `Validation FAILED — ${criticalFails.length} critical checks`, this._report);
      errorLog.push({
        message: `[ProductionReadiness] FAILED: ${criticalFails.map((c) => c.name).join(", ")}`,
        stack: "",
        source: "build",
        severity: "fatal",
      });
    } else if (state === "warning") {
      RuntimeSupervisor.emit("warning", "ProductionReadiness", `Validation passed with ${warnings.length} warnings`, this._report);
    } else {
      RuntimeSupervisor.emit("recovery", "ProductionReadiness", `Validation PASSED (score: ${score}/100 — ${scoreLabel})`, this._report);
    }

    this.notify(state, this._report);
    return this._report;
  }

  /** Retry validation (up to maxRetries) */
  async retry(): Promise<ReadinessReport | null> {
    if (this.retryCount >= this.maxRetries) return this._report;
    this.retryCount++;
    return this.validate();
  }

  /** Get whether startup is allowed */
  get canStartup(): boolean {
    if (!this._report) return true;
    const criticalFails = this._report.checks.filter((c) => c.category === "critical" && c.status === "fail");
    return criticalFails.length === 0;
  }

  /** Get a summary string */
  getSummary(): string {
    if (!this._report) return "Not validated";
    return `${this._report.state.toUpperCase()} — ${this._report.score}/100 — ${this._report.checks.filter((c) => c.status === "pass").length} passed, ${this._report.checks.filter((c) => c.status === "fail").length} failed`;
  }

  private checkBuildVersion(): ReadinessCheck {
    const start = performance.now();
    const info = buildVersionManager.getBuildInfo();
    const pass = info.version !== "unknown" && info.buildNumber !== "unknown";
    return {
      name: "Build Version",
      category: "critical",
      status: pass ? "pass" : "fail",
      message: pass ? `v${info.version} (build ${info.buildNumber})` : "Build version not configured",
      duration: Math.round(performance.now() - start),
    };
  }

  private checkEnvironment(): ReadinessCheck {
    const start = performance.now();
    const results = environmentValidator.validate();
    const fails = results.filter((r) => r.status === "fail");
    return {
      name: "Environment",
      category: "critical",
      status: fails.length === 0 ? "pass" : "fail",
      message: fails.length === 0 ? `${results.filter((r) => r.status === "pass").length} checks passed` : `${fails.length} environment checks failed`,
      duration: Math.round(performance.now() - start),
      details: fails.map((f) => `${f.name}: ${f.message}`).join("; "),
    };
  }

  private checkSchema(): ReadinessCheck {
    const start = performance.now();
    const results = schemaCompatibility.check();
    const fails = results.filter((r) => r.status === "fail");
    const warns = results.filter((r) => r.status === "warn");

    let status: "pass" | "warn" | "fail";
    let message: string;

    if (fails.length > 0) {
      status = "fail";
      message = fails.map((r) => r.message).join("; ");
    } else if (warns.length > 0) {
      status = "warn";
      message = warns.map((r) => r.message).join("; ");
    } else {
      status = "pass";
      message = results.length > 0 ? results.map((r) => r.message).join("; ") : "Schema versions compatible";
    }

    return {
      name: "Schema Compatibility",
      category: "critical",
      status,
      message,
      duration: Math.round(performance.now() - start),
    };
  }

  private checkDeployment(): ReadinessCheck {
    const start = performance.now();
    const issues = deploymentValidator.validate();
    return {
      name: "Deployment",
      category: "critical",
      status: issues.length === 0 ? "pass" : issues.length <= 1 ? "warn" : "fail",
      message: issues.length === 0 ? "Deployment valid" : issues.join("; "),
      duration: Math.round(performance.now() - start),
    };
  }

  private checkAssets(): ReadinessCheck {
    const start = performance.now();
    // Basic assets check — DOM root and script tags exist
    const root = typeof document !== "undefined" ? document.getElementById("root") : null;
    return {
      name: "Assets",
      category: "important",
      status: root ? "pass" : "fail",
      message: root ? "Root element present" : "Root element not found",
      duration: Math.round(performance.now() - start),
    };
  }

  private checkRollback(): ReadinessCheck {
    const start = performance.now();
    const issues = rollbackDetector.detect();
    return {
      name: "Rollback Detection",
      category: "important",
      status: issues.length === 0 ? "pass" : "warn",
      message: issues.length === 0 ? "No rollback detected" : issues.join("; "),
      duration: Math.round(performance.now() - start),
    };
  }

  private checkChecklist(): ReadinessCheck {
    const start = performance.now();
    const results = productionChecklistEngine.run();
    const fails = results.filter((r) => r.status === "fail");
    return {
      name: "Production Checklist",
      category: "important",
      status: fails.length === 0 ? "pass" : fails.length <= 2 ? "warn" : "fail",
      message: `${results.filter((r) => r.status === "pass").length}/${results.length} checks passed`,
      duration: Math.round(performance.now() - start),
    };
  }

  private notify(state: ReadinessState, report: ReadinessReport): void {
    this.listeners.forEach((l) => l(state, report));
  }
}

export const productionReadinessManager = new ProductionReadinessManagerImpl();
