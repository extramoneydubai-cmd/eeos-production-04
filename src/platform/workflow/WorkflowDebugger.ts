/**
 * WorkflowDebugger — Visual Workflow Execution Debugger
 *
 * Features:
 * - Step-by-step execution
 * - Variable watch
 * - Condition evaluation log
 * - Execution replay
 * - Pause / Resume / Terminate
 * - Execution log with timestamps
 */

import { workflowEngine } from "./WorkflowEngine";
import { type ExecutionContext } from "./WorkflowExecutionEngine";

export interface DebugSession {
  executionId: string;
  definitionId: string;
  stepIndex: number;
  totalSteps: number;
  paused: boolean;
  variables: Record<string, any>;
  decisions: Record<string, any>;
  log: DebugLogEntry[];
  currentNodes: string[];
  completedNodes: string[];
}

export interface DebugLogEntry {
  timestamp: number;
  type: "step" | "decision" | "condition" | "variable" | "error" | "info";
  nodeId?: string;
  nodeLabel?: string;
  message: string;
  data?: Record<string, any>;
}

class WorkflowDebuggerImpl {
  private sessions: Map<string, DebugSession> = new Map();

  /** Start a debug session */
  startSession(executionId: string): DebugSession {
    const session: DebugSession = {
      executionId,
      definitionId: "",
      stepIndex: 0,
      totalSteps: 0,
      paused: false,
      variables: {},
      decisions: {},
      log: [{ timestamp: Date.now(), type: "info", message: "Debug session started" }],
      currentNodes: [],
      completedNodes: [],
    };
    this.sessions.set(executionId, session);
    return session;
  }

  /** Get a debug session */
  getSession(executionId: string): DebugSession | undefined {
    return this.sessions.get(executionId);
  }

  /** Step forward in execution */
  stepForward(executionId: string): DebugSession | undefined {
    const session = this.sessions.get(executionId);
    if (!session || session.paused) return session;
    session.stepIndex++;
    session.log.push({
      timestamp: Date.now(),
      type: "step",
      message: `Step ${session.stepIndex}/${session.totalSteps}`,
    });
    return session;
  }

  /** Pause execution */
  pause(executionId: string): DebugSession | undefined {
    const session = this.sessions.get(executionId);
    if (!session) return undefined;
    session.paused = true;
    session.log.push({ timestamp: Date.now(), type: "info", message: "Execution paused" });
    return session;
  }

  /** Resume execution */
  resume(executionId: string): DebugSession | undefined {
    const session = this.sessions.get(executionId);
    if (!session) return undefined;
    session.paused = false;
    session.log.push({ timestamp: Date.now(), type: "info", message: "Execution resumed" });
    return session;
  }

  /** Terminate execution */
  terminate(executionId: string): DebugSession | undefined {
    const session = this.sessions.get(executionId);
    if (!session) return undefined;
    session.log.push({ timestamp: Date.now(), type: "info", message: "Execution terminated by debugger" });
    return session;
  }

  /** Log a condition evaluation */
  logCondition(executionId: string, nodeLabel: string, condition: string, result: boolean): void {
    const session = this.sessions.get(executionId);
    if (!session) return;
    session.log.push({
      timestamp: Date.now(),
      type: "condition",
      nodeLabel,
      message: `Condition "${condition}" evaluated to ${result}`,
      data: { condition, result },
    });
  }

  /** Log a variable change */
  logVariable(executionId: string, name: string, value: any): void {
    const session = this.sessions.get(executionId);
    if (!session) return;
    session.variables[name] = value;
    session.log.push({
      timestamp: Date.now(),
      type: "variable",
      message: `Variable "${name}" set to ${JSON.stringify(value)}`,
      data: { name, value },
    });
  }

  /** Log a decision */
  logDecision(executionId: string, nodeLabel: string, decision: string): void {
    const session = this.sessions.get(executionId);
    if (!session) return;
    session.decisions[nodeLabel] = decision;
    session.log.push({
      timestamp: Date.now(),
      type: "decision",
      nodeLabel,
      message: `Decision at "${nodeLabel}": ${decision}`,
    });
  }

  /** Log an error */
  logError(executionId: string, nodeLabel: string, error: string): void {
    const session = this.sessions.get(executionId);
    if (!session) return;
    session.log.push({
      timestamp: Date.now(),
      type: "error",
      nodeLabel,
      message: `Error at "${nodeLabel}": ${error}`,
      data: { error },
    });
  }

  /** Get execution log as text */
  getLogAsText(executionId: string): string {
    const session = this.sessions.get(executionId);
    if (!session) return "";
    return session.log
      .map((entry) => {
        const time = new Date(entry.timestamp).toISOString();
        return `[${time}] [${entry.type.toUpperCase()}] ${entry.message}`;
      })
      .join("\n");
  }

  /** End a debug session */
  endSession(executionId: string): void {
    const session = this.sessions.get(executionId);
    if (session) {
      session.log.push({ timestamp: Date.now(), type: "info", message: "Debug session ended" });
    }
  }

  /** Remove a session */
  removeSession(executionId: string): void {
    this.sessions.delete(executionId);
  }
}

export const workflowDebugger = new WorkflowDebuggerImpl();
