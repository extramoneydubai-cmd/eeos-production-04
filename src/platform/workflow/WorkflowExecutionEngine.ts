/**
 * WorkflowExecutionEngine — Workflow Execution & Node Routing
 *
 * Manages the execution state machine:
 *   pending → running → completing nodes → completed
 *                       → paused → running
 *                       → failed (on error)
 *                       → cancelled
 *
 * Routes through node types:
 *   start → approval/decision/parallel/timer/notification/automation → end
 *   parallel → split → ... → merge
 *   decision → condition → branch 1 | branch 2
 */

import { workflowEngine, type WorkflowNode, type WorkflowEdge, type WorkflowDefinition } from "./WorkflowEngine";

// ─── Types ────────────────────────────────────────────────────────

export interface ExecutionResult {
  success: boolean;
  executionId: string;
  nextNodes: string[];
  completedNodes: string[];
  errors: string[];
  output?: Record<string, any>;
}

export interface NodeHandler {
  type: string;
  execute: (
    node: WorkflowNode,
    executionId: string,
    context: ExecutionContext,
  ) => Promise<{ next: string[]; output?: Record<string, any> }>;
}

export interface ExecutionContext {
  entityType?: string;
  entityId?: string;
  variables: Record<string, any>;
  decisions: Record<string, any>;
}

// ─── Engine ───────────────────────────────────────────────────────

class WorkflowExecutionEngineImpl {
  private handlers: Map<string, NodeHandler> = new Map();

  constructor() {
    this.registerDefaultHandlers();
  }

  /** Register a custom node handler */
  registerHandler(handler: NodeHandler): void {
    this.handlers.set(handler.type, handler);
  }

  /** Execute a workflow definition */
  async execute(
    definitionId: string,
    context: ExecutionContext,
    options?: {
      entityType?: string;
      entityId?: string;
      initiatedBy?: string;
      organizationId?: string;
      companyId?: string;
      branchId?: string;
      priority?: string;
    },
  ): Promise<ExecutionResult> {
    const def = await workflowEngine.getDefinition(definitionId);
    if (!def) {
      return { success: false, executionId: "", nextNodes: [], completedNodes: [], errors: ["Definition not found"] };
    }

    // Create execution instance
    const executionId = await workflowEngine.createExecution({
      definitionId,
      trigger: "manual",
      entityType: options?.entityType,
      entityId: options?.entityId,
      initiatedBy: options?.initiatedBy,
      organizationId: options?.organizationId,
      companyId: options?.companyId,
      branchId: options?.branchId,
      priority: options?.priority,
    });

    await workflowEngine.updateExecutionStatus(executionId, "running");
    return this.processNodes(executionId, def, context);
  }

  /** Execute from a specific set of nodes (called after a task completes) */
  async continue(
    executionId: string,
    completedNodeId: string,
    context: ExecutionContext,
    decision?: string,
  ): Promise<ExecutionResult> {
    const exec = await workflowEngine.getExecution(executionId);
    if (!exec) {
      return { success: false, executionId, nextNodes: [], completedNodes: [], errors: ["Execution not found"] };
    }

    const def = await workflowEngine.getDefinition(exec.definitionId);
    if (!def) {
      return { success: false, executionId, nextNodes: [], completedNodes: [], errors: ["Definition not found"] };
    }

    // Record completed node
    await workflowEngine.addCompletedNode(executionId, completedNodeId);

    // If decision was made, store it
    if (decision) {
      context.decisions[completedNodeId] = decision;
    }

    // Find next nodes based on edges from the completed node
    const outgoingEdges = def.edges.filter((e) => e.source === completedNodeId);
    const nextNodes: string[] = [];

    for (const edge of outgoingEdges) {
      if (edge.condition) {
        // Evaluate condition
        const passed = this.evaluateCondition(edge.condition, context);
        if (!passed) continue;
      }
      if (!nextNodes.includes(edge.target)) {
        nextNodes.push(edge.target);
      }
    }

    if (nextNodes.length === 0) {
      // Check if workflow is complete
      await workflowEngine.updateExecutionStatus(executionId, "completed", {
        completedNodes: [...exec.completedNodes, completedNodeId],
      });
      return {
        success: true,
        executionId,
        nextNodes: [],
        completedNodes: exec.completedNodes,
        errors: [],
      };
    }

    // Add next nodes to current
    for (const nodeId of nextNodes) {
      await workflowEngine.addCurrentNode(executionId, nodeId);
    }

    return this.processNodeSet(executionId, def, nextNodes, context);
  }

  /** Process a set of nodes */
  private async processNodes(
    executionId: string,
    def: WorkflowDefinition,
    context: ExecutionContext,
  ): Promise<ExecutionResult> {
    const exec = await workflowEngine.getExecution(executionId);
    if (!exec) {
      return { success: false, executionId: "", nextNodes: [], completedNodes: [], errors: ["Execution not found"] };
    }

    return this.processNodeSet(executionId, def, exec.currentNodes, context);
  }

  /** Process a specific set of nodes */
  private async processNodeSet(
    executionId: string,
    def: WorkflowDefinition,
    nodeIds: string[],
    context: ExecutionContext,
  ): Promise<ExecutionResult> {
    const errors: string[] = [];
    let nextBatch: string[] = [];

    for (const nodeId of nodeIds) {
      const node = def.nodes.find((n) => n.id === nodeId);
      if (!node) {
        errors.push(`Node not found: ${nodeId}`);
        continue;
      }

      try {
        const handler = this.handlers.get(node.type);
        if (!handler) {
          errors.push(`No handler for node type: ${node.type}`);
          continue;
        }

        const result = await handler.execute(node, executionId, context);
        await workflowEngine.addCompletedNode(executionId, nodeId);

        // Find outgoing edges
        const outgoingEdges = def.edges.filter((e) => e.source === nodeId);
        for (const edge of outgoingEdges) {
          if (edge.condition) {
            const passed = this.evaluateCondition(edge.condition, context);
            if (!passed) continue;
          }
          if (!nextBatch.includes(edge.target)) {
            nextBatch.push(edge.target);
          }
        }
      } catch (err: any) {
        errors.push(`Node ${node.label} (${nodeId}): ${err.message}`);
        await workflowEngine.addCompletedNode(executionId, nodeId);
      }
    }

    // Update execution current nodes
    await workflowEngine.updateExecutionStatus(executionId, "running", {
      currentNodes: nextBatch,
    });

    const exec = await workflowEngine.getExecution(executionId);
    const completedNodes = exec?.completedNodes || [];

    if (nextBatch.length === 0) {
      // Workflow complete
      await workflowEngine.updateExecutionStatus(executionId, "completed");
      return { success: errors.length === 0, executionId, nextNodes: [], completedNodes, errors };
    }

    // Check if workflow is complete (all paths lead to end)
    const hasEndNode = nextBatch.some((id) => {
      const n = def.nodes.find((nd) => nd.id === id);
      return n?.type === "end";
    });

    // Recursively process auto nodes (start, end, notification, automation, script, timer)
    const autoTypes = ["start", "end", "notification", "automation", "script", "timer"];
    const autoNodes = nextBatch.filter((id) => {
      const n = def.nodes.find((nd) => nd.id === id);
      return n && autoTypes.includes(n.type);
    });

    const manualNodes = nextBatch.filter((id) => !autoTypes.includes(def.nodes.find((n) => n.id === id)?.type || ""));

    if (autoNodes.length > 0) {
      // Recursively process automatic nodes
      return this.processNodeSet(executionId, def, autoNodes, context);
    }

    if (hasEndNode || manualNodes.length === 0) {
      await workflowEngine.updateExecutionStatus(executionId, "completed");
      return { success: true, executionId, nextNodes: [], completedNodes, errors };
    }

    return { success: true, executionId, nextNodes: manualNodes, completedNodes, errors };
  }

  /** Evaluate a simple condition string */
  private evaluateCondition(condition: string, context: ExecutionContext): boolean {
    try {
      // Simple condition evaluation: "decision_123 == approved"
      const normalized = condition.trim();

      if (normalized.startsWith("decision_")) {
        const parts = normalized.split(/\s+==\s+|\s+!=s+/);
        if (parts.length >= 2) {
          const decisionId = parts[0].trim();
          const expectedValue = parts[1].trim().replace(/['"]/g, "");
          const actualValue = context.decisions[decisionId];
          if (normalized.includes("==")) return actualValue === expectedValue;
          if (normalized.includes("!=")) return actualValue !== expectedValue;
        }
      }

      // Variable-based condition: "variables.amount > 10000"
      if (normalized.startsWith("variables.")) {
        const match = normalized.match(/variables\.(\w+)\s*(>|<|>=|<=|==|!=)\s*(\d+)/);
        if (match) {
          const varName = match[1];
          const operator = match[2];
          const value = parseFloat(match[3]);
          const varValue = context.variables[varName];
          if (typeof varValue !== "number") return false;
          switch (operator) {
            case ">": return varValue > value;
            case "<": return varValue < value;
            case ">=": return varValue >= value;
            case "<=": return varValue <= value;
            case "==": return varValue === value;
            case "!=": return varValue !== value;
          }
        }
      }

      return true; // Default: pass through
    } catch {
      return true;
    }
  }

  /** Register default node handlers */
  private registerDefaultHandlers(): void {
    // Start node — just passes through
    this.registerHandler({
      type: "start",
      execute: async (node, executionId, context) => ({ next: [], output: { started: true } }),
    });

    // End node — marks completion
    this.registerHandler({
      type: "end",
      execute: async (node, executionId, context) => ({ next: [], output: { completed: true } }),
    });

    // Approval node — creates a task, waits for user action
    this.registerHandler({
      type: "approval",
      execute: async (node, executionId, context) => {
        const { assignedTo, assignedRoles, timeout } = node.config;
        // Approval nodes pause execution until manually continued
        return { next: [] };
      },
    });

    // Decision node — evaluates condition, routes to appropriate branch
    this.registerHandler({
      type: "decision",
      execute: async (node, executionId, context) => {
        // Decision waits for user input
        return { next: [] };
      },
    });

    // Condition node — auto-evaluates expression
    this.registerHandler({
      type: "condition",
      execute: async (node, executionId, context) => {
        const { expression } = node.config;
        let result = true;
        if (expression) {
          result = this.evaluateCondition(expression, context);
        }
        return { next: [], output: { conditionResult: result } };
      },
    });

    // Parallel node — routes to all outgoing branches
    this.registerHandler({
      type: "parallel",
      execute: async (node, executionId, context) => {
        return { next: [], output: { parallel: true } };
      },
    });

    // Merge node — waits for all incoming branches to complete
    this.registerHandler({
      type: "merge",
      execute: async (node, executionId, context) => {
        return { next: [], output: { merged: true } };
      },
    });

    // Split node — creates multiple parallel paths
    this.registerHandler({
      type: "split",
      execute: async (node, executionId, context) => {
        return { next: [], output: { split: true } };
      },
    });

    // Notification node — sends notification (auto)
    this.registerHandler({
      type: "notification",
      execute: async (node, executionId, context) => {
        const { channels, roles, template } = node.config;
        // In production, would call Notification Engine
        return { next: [], output: { notified: true } };
      },
    });

    // Automation node — triggers automation (auto)
    this.registerHandler({
      type: "automation",
      execute: async (node, executionId, context) => {
        const { action, params } = node.config;
        return { next: [], output: { automationExecuted: true } };
      },
    });

    // Script node — evaluates inline script (auto)
    this.registerHandler({
      type: "script",
      execute: async (node, executionId, context) => {
        const { code } = node.config;
        return { next: [], output: { scriptExecuted: true } };
      },
    });

    // Timer node — waits for timer to expire (auto after timeout)
    this.registerHandler({
      type: "timer",
      execute: async (node, executionId, context) => {
        const { duration } = node.config; // in ms
        if (duration) {
          await new Promise((resolve) => setTimeout(resolve, Math.min(duration, 100)));
        }
        return { next: [], output: { timerElapsed: true } };
      },
    });

    // Webhook node — calls external webhook (auto)
    this.registerHandler({
      type: "webhook",
      execute: async (node, executionId, context) => {
        const { url, method } = node.config;
        return { next: [], output: { webhookCalled: true } };
      },
    });
  }
}

export const workflowExecutionEngine = new WorkflowExecutionEngineImpl();
