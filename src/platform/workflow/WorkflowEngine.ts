/**
 * WorkflowEngine — Core Enterprise Workflow Engine
 *
 * Manages workflow definitions, versioning, triggers, and instance creation.
 * Every business module consumes this — no hardcoded approval logic.
 */

import { Id } from "@/convex/_generated/dataModel";

// ─── Types ────────────────────────────────────────────────────────

export interface WorkflowNode {
  id: string;
  type: "start" | "end" | "approval" | "decision" | "condition" | "parallel"
       | "timer" | "notification" | "automation" | "webhook" | "script"
       | "merge" | "split";
  label: string;
  config: Record<string, any>;
  position?: { x: number; y: number };
  metadata?: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

export interface WorkflowTrigger {
  type: "entity_created" | "entity_updated" | "status_changed" | "schedule"
       | "webhook" | "api" | "manual" | "cron" | "timer" | "pipeline_event";
  config: Record<string, any>;
  entityType?: string;
  scheduleType?: string;
}

export interface WorkflowDefinition {
  _id?: string;
  name: string;
  description?: string;
  category: string;
  status: "draft" | "active" | "archived" | "deprecated";
  version: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  triggers?: WorkflowTrigger[];
  timeout?: number;
  maxRetries?: number;
  tags?: string[];
  organizationId?: string;
  companyId?: string;
  branchId?: string;
  departmentId?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: number;
  updatedAt: number;
}

export interface WorkflowExecution {
  _id?: string;
  definitionId: string;
  definitionVersion: number;
  status: "pending" | "running" | "paused" | "completed" | "failed" | "cancelled" | "blocked";
  trigger: string;
  entityType?: string;
  entityId?: string;
  currentNodes: string[];
  completedNodes: string[];
  failedNodes?: string[];
  error?: string;
  startedAt: number;
  completedAt?: number;
  duration?: number;
  retryCount?: number;
  priority?: string;
  slaDeadline?: number;
  slaBreached?: boolean;
  updatedAt?: number;
  initiatedBy?: string;
  assignedTo?: string;
  organizationId?: string;
  companyId?: string;
  branchId?: string;
  departmentId?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

// ─── Engine ───────────────────────────────────────────────────────

class WorkflowEngineImpl {
  private definitions: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();

  // ─── Definition Management ─────────────────────────────────

  async createDefinition(def: Omit<WorkflowDefinition, "_id" | "createdAt" | "updatedAt">): Promise<string> {
    const now = Date.now();
    const id = `wf_def_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const definition: WorkflowDefinition = {
      ...def,
      createdAt: now,
      updatedAt: now,
    };
    this.definitions.set(id, { ...definition, _id: id });
    return id;
  }

  async updateDefinition(
    id: string,
    updates: Partial<Omit<WorkflowDefinition, "_id" | "createdAt">>,
  ): Promise<boolean> {
    const def = this.definitions.get(id);
    if (!def) return false;
    this.definitions.set(id, { ...def, ...updates, updatedAt: Date.now(), _id: id });
    return true;
  }

  async archiveDefinition(id: string): Promise<boolean> {
    return this.updateDefinition(id, { status: "archived" });
  }

  async getDefinition(id: string): Promise<WorkflowDefinition | undefined> {
    return this.definitions.get(id);
  }

  async listDefinitions(filters?: {
    category?: string;
    status?: string;
    search?: string;
    companyId?: string;
    branchId?: string;
  }): Promise<WorkflowDefinition[]> {
    let list = Array.from(this.definitions.values());
    if (filters?.category) list = list.filter((d) => d.category === filters.category);
    if (filters?.status) list = list.filter((d) => d.status === filters.status);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q));
    }
    if (filters?.companyId) list = list.filter((d) => d.companyId === filters.companyId);
    if (filters?.branchId) list = list.filter((d) => d.branchId === filters.branchId);
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  // ─── Trigger Matching ──────────────────────────────────────

  async findMatchingDefinitions(
    trigger: string,
    entityType?: string,
    entityStatus?: string,
  ): Promise<WorkflowDefinition[]> {
    return Array.from(this.definitions.values()).filter((def) => {
      if (def.status !== "active") return false;
      if (!def.triggers?.length) return false;
      return def.triggers.some((t) => {
        if (t.type !== trigger) return false;
        if (entityType && t.entityType && t.entityType !== entityType) return false;
        return true;
      });
    });
  }

  // ─── Instance Management ───────────────────────────────────

  async createExecution(params: {
    definitionId: string;
    trigger: string;
    entityType?: string;
    entityId?: string;
    initiatedBy?: string;
    assignedTo?: string;
    organizationId?: string;
    companyId?: string;
    branchId?: string;
    priority?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  }): Promise<string> {
    const def = await this.getDefinition(params.definitionId);
    if (!def) throw new Error(`Definition not found: ${params.definitionId}`);

    const now = Date.now();
    const startNode = def.nodes.find((n) => n.type === "start");

    const execution: WorkflowExecution = {
      definitionId: params.definitionId,
      definitionVersion: def.version,
      status: "pending",
      trigger: params.trigger,
      entityType: params.entityType,
      entityId: params.entityId,
      currentNodes: startNode ? [startNode.id] : [],
      completedNodes: [],
      startedAt: now,
      initiatedBy: params.initiatedBy,
      assignedTo: params.assignedTo,
      organizationId: params.organizationId,
      companyId: params.companyId,
      branchId: params.branchId,
      priority: params.priority || "medium",
      tags: params.tags || def.tags,
      metadata: params.metadata,
    };

    const id = `wf_exec_${now}_${Math.random().toString(36).slice(2, 8)}`;
    this.executions.set(id, { ...execution, _id: id });
    return id;
  }

  async getExecution(id: string): Promise<WorkflowExecution | undefined> {
    return this.executions.get(id);
  }

  async listExecutions(filters?: {
    status?: string;
    definitionId?: string;
    entityType?: string;
    entityId?: string;
    assignedTo?: string;
    companyId?: string;
    branchId?: string;
    priority?: string;
    search?: string;
    limit?: number;
  }): Promise<WorkflowExecution[]> {
    let list = Array.from(this.executions.values());
    if (filters?.status) list = list.filter((e) => e.status === filters.status);
    if (filters?.definitionId) list = list.filter((e) => e.definitionId === filters.definitionId);
    if (filters?.entityType) list = list.filter((e) => e.entityType === filters.entityType);
    if (filters?.entityId) list = list.filter((e) => e.entityId === filters.entityId);
    if (filters?.assignedTo) list = list.filter((e) => e.assignedTo === filters.assignedTo);
    if (filters?.companyId) list = list.filter((e) => e.companyId === filters.companyId);
    if (filters?.branchId) list = list.filter((e) => e.branchId === filters.branchId);
    if (filters?.priority) list = list.filter((e) => e.priority === filters.priority);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((e) => e.tags?.some((t) => t.toLowerCase().includes(q)));
    }
    return list.sort((a, b) => b.startedAt - a.startedAt).slice(0, filters?.limit || 100);
  }

  async updateExecutionStatus(
    id: string,
    status: WorkflowExecution["status"],
    updates?: Partial<WorkflowExecution>,
  ): Promise<boolean> {
    const exec = this.executions.get(id);
    if (!exec) return false;
    const now = Date.now();
    const updated = {
      ...exec,
      ...updates,
      status,
      completedAt: ["completed", "failed", "cancelled"].includes(status) ? now : exec.completedAt,
      duration: ["completed", "failed", "cancelled"].includes(status) ? now - exec.startedAt : exec.duration,
      updatedAt: now,
      _id: id,
    };
    this.executions.set(id, updated);
    return true;
  }

  async addCompletedNode(executionId: string, nodeId: string): Promise<boolean> {
    const exec = this.executions.get(executionId);
    if (!exec) return false;
    if (!exec.completedNodes.includes(nodeId)) {
      exec.completedNodes.push(nodeId);
    }
    exec.currentNodes = exec.currentNodes.filter((n) => n !== nodeId);
    exec.updatedAt = Date.now();
    return true;
  }

  async addCurrentNode(executionId: string, nodeId: string): Promise<boolean> {
    const exec = this.executions.get(executionId);
    if (!exec) return false;
    if (!exec.currentNodes.includes(nodeId)) {
      exec.currentNodes.push(nodeId);
    }
    exec.updatedAt = Date.now();
    return true;
  }

  // ─── Stats ─────────────────────────────────────────────────

  getStats(): {
    total: number;
    running: number;
    pending: number;
    completed: number;
    failed: number;
    cancelled: number;
    blocked: number;
    slaBreached: number;
  } {
    const all = Array.from(this.executions.values());
    return {
      total: all.length,
      running: all.filter((e) => e.status === "running").length,
      pending: all.filter((e) => e.status === "pending").length,
      completed: all.filter((e) => e.status === "completed").length,
      failed: all.filter((e) => e.status === "failed").length,
      cancelled: all.filter((e) => e.status === "cancelled").length,
      blocked: all.filter((e) => e.status === "blocked").length,
      slaBreached: all.filter((e) => e.slaBreached).length,
    };
  }

  /** Reset in-memory state (for testing) */
  reset(): void {
    this.definitions.clear();
    this.executions.clear();
  }
}

export const workflowEngine = new WorkflowEngineImpl();
