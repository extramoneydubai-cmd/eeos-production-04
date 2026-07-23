import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/* ────────────
   CONSTANTS
   ──────────── */

const WORKFLOW_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;

const INSTANCE_STATUS = {
  PENDING: "pending",
  STARTED: "started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  FAILED: "failed",
  PAUSED: "paused",
} as const;

const NODE_TYPES = [
  "start",
  "end",
  "condition",
  "approval",
  "task",
  "notification",
  "delay",
  "decision",
  "assignment",
  "webhook_placeholder",
  "function_placeholder",
  "subworkflow",
] as const;

const ASSIGNMENT_TYPES = [
  "user",
  "team",
  "department",
  "manager",
  "round_robin",
  "least_loaded",
  "manual",
] as const;

const CONDITION_OPERATORS = [
  "equals",
  "not_equals",
  "greater_than",
  "less_than",
  "contains",
  "starts_with",
  "ends_with",
  "boolean_true",
  "boolean_false",
  "date_before",
  "date_after",
] as const;

/* ────────────
   WORKFLOW CRUD
   ──────────── */

export const list = query({
  args: {
    module: v.optional(v.string()),
    status: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("workflows").collect();
    const filtered = all.filter((w) => {
      if (args.module && w.module !== args.module) return false;
      if (args.status && w.status !== args.status) return false;
      if (args.isActive !== undefined && w.isActive !== args.isActive) return false;
      return true;
    });
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getById = query({
  args: { workflowId: v.id("workflows") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.workflowId);
  },
});

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("workflows")
      .withIndex("code", (qb) => qb.eq("code", args.code))
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    module: v.string(),
    tag: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const workflowId = await ctx.db.insert("workflows", {
      name: args.name,
      code: args.code,
      description: args.description,
      module: args.module,
      status: WORKFLOW_STATUS.DRAFT,
      version: 1,
      isActive: false,
      tag: args.tag,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    // Create default Start and End nodes
    const startId = await ctx.db.insert("workflowNodes", {
      workflowId,
      nodeType: "start",
      label: "Start",
      positionX: 50,
      positionY: 250,
      createdAt: now,
      updatedAt: now,
    });

    const endId = await ctx.db.insert("workflowNodes", {
      workflowId,
      nodeType: "end",
      label: "End",
      positionX: 700,
      positionY: 250,
      createdAt: now,
      updatedAt: now,
    });

    return { workflowId, startNodeId: startId, endNodeId: endId };
  },
});

export const update = mutation({
  args: {
    workflowId: v.id("workflows"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    module: v.optional(v.string()),
    tag: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { workflowId, ...fields } = args;
    const existing = await ctx.db.get(workflowId);
    if (!existing) throw new Error("Workflow not found");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (fields.name !== undefined) updates.name = fields.name;
    if (fields.description !== undefined) updates.description = fields.description;
    if (fields.module !== undefined) updates.module = fields.module;
    if (fields.tag !== undefined) updates.tag = fields.tag;
    if (fields.isActive !== undefined) updates.isActive = fields.isActive;

    await ctx.db.patch(workflowId, updates);
    return { success: true };
  },
});

export const publish = mutation({
  args: { workflowId: v.id("workflows") },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) throw new Error("Workflow not found");
    if (workflow.status === WORKFLOW_STATUS.ARCHIVED) {
      throw new Error("Cannot publish an archived workflow");
    }

    // Validate nodes exist (must have Start and End)
    const nodes = await ctx.db
      .query("workflowNodes")
      .withIndex("workflowId", (qb) => qb.eq("workflowId", args.workflowId))
      .collect();

    const hasStart = nodes.some((n) => n.nodeType === "start");
    const hasEnd = nodes.some((n) => n.nodeType === "end");
    if (!hasStart || !hasEnd) {
      throw new Error("Workflow must have Start and End nodes");
    }

    await ctx.db.patch(args.workflowId, {
      status: WORKFLOW_STATUS.PUBLISHED,
      version: workflow.version + 1,
      isActive: true,
      updatedAt: Date.now(),
    });

    return { success: true, version: workflow.version + 1 };
  },
});

export const archive = mutation({
  args: { workflowId: v.id("workflows") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.workflowId, {
      status: WORKFLOW_STATUS.ARCHIVED,
      isActive: false,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const remove = mutation({
  args: { workflowId: v.id("workflows") },
  handler: async (ctx, args) => {
    // Remove all related data
    const nodes = await ctx.db
      .query("workflowNodes")
      .withIndex("workflowId", (qb) => qb.eq("workflowId", args.workflowId))
      .collect();
    for (const node of nodes) {
      await ctx.db.delete(node._id);
    }

    const edges = await ctx.db
      .query("workflowEdges")
      .withIndex("workflowId", (qb) => qb.eq("workflowId", args.workflowId))
      .collect();
    for (const edge of edges) {
      await ctx.db.delete(edge._id);
    }

    await ctx.db.delete(args.workflowId);
    return { success: true };
  },
});

export const clone = mutation({
  args: {
    workflowId: v.id("workflows"),
    newName: v.string(),
    newCode: v.string(),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.workflowId);
    if (!original) throw new Error("Workflow not found");

    const now = Date.now();
    const newWorkflowId = await ctx.db.insert("workflows", {
      name: args.newName,
      code: args.newCode,
      description: original.description,
      module: original.module,
      status: WORKFLOW_STATUS.DRAFT,
      version: 1,
      isActive: false,
      tag: original.tag,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    // Clone nodes
    const nodes = await ctx.db
      .query("workflowNodes")
      .withIndex("workflowId", (qb) => qb.eq("workflowId", args.workflowId))
      .collect();

    const nodeIdMap = new Map<Id<"workflowNodes">, Id<"workflowNodes">>();
    for (const node of nodes) {
      const newNodeId = await ctx.db.insert("workflowNodes", {
        workflowId: newWorkflowId,
        nodeType: node.nodeType,
        label: node.label,
        positionX: node.positionX,
        positionY: node.positionY,
        config: node.config,
        configSchema: node.configSchema,
        description: node.description,
        createdAt: now,
        updatedAt: now,
      });
      nodeIdMap.set(node._id, newNodeId);
    }

    // Clone edges
    const edges = await ctx.db
      .query("workflowEdges")
      .withIndex("workflowId", (qb) => qb.eq("workflowId", args.workflowId))
      .collect();

    for (const edge of edges) {
      await ctx.db.insert("workflowEdges", {
        workflowId: newWorkflowId,
        sourceNodeId: nodeIdMap.get(edge.sourceNodeId) || edge.sourceNodeId,
        targetNodeId: nodeIdMap.get(edge.targetNodeId) || edge.targetNodeId,
        label: edge.label,
        condition: edge.condition,
        displayOrder: edge.displayOrder,
        createdAt: now,
      });
    }

    return { workflowId: newWorkflowId };
  },
});

/* ────────────
   NODES CRUD
   ──────────── */

export const listNodes = query({
  args: { workflowId: v.id("workflows") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("workflowNodes")
      .withIndex("workflowId", (qb) => qb.eq("workflowId", args.workflowId))
      .collect();
  },
});

export const getNode = query({
  args: { nodeId: v.id("workflowNodes") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.nodeId);
  },
});

export const addNode = mutation({
  args: {
    workflowId: v.id("workflows"),
    nodeType: v.union(...NODE_TYPES.map((t) => v.literal(t))),
    label: v.string(),
    positionX: v.number(),
    positionY: v.number(),
    config: v.optional(v.string()),
    configSchema: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const nodeId = await ctx.db.insert("workflowNodes", {
      workflowId: args.workflowId,
      nodeType: args.nodeType,
      label: args.label,
      positionX: args.positionX,
      positionY: args.positionY,
      config: args.config,
      configSchema: args.configSchema,
      description: args.description,
      createdAt: now,
      updatedAt: now,
    });
    return { nodeId };
  },
});

export const updateNode = mutation({
  args: {
    nodeId: v.id("workflowNodes"),
    label: v.optional(v.string()),
    positionX: v.optional(v.number()),
    positionY: v.optional(v.number()),
    config: v.optional(v.string()),
    configSchema: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { nodeId, ...fields } = args;
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (fields.label !== undefined) updates.label = fields.label;
    if (fields.positionX !== undefined) updates.positionX = fields.positionX;
    if (fields.positionY !== undefined) updates.positionY = fields.positionY;
    if (fields.config !== undefined) updates.config = fields.config;
    if (fields.configSchema !== undefined) updates.configSchema = fields.configSchema;
    if (fields.description !== undefined) updates.description = fields.description;

    await ctx.db.patch(nodeId, updates);
    return { success: true };
  },
});

export const removeNode = mutation({
  args: { nodeId: v.id("workflowNodes") },
  handler: async (ctx, args) => {
    // Remove edges connected to this node
    const edges = await ctx.db
      .query("workflowEdges")
      .filter((q) =>
        q.or(
          q.eq(q.field("sourceNodeId"), args.nodeId),
          q.eq(q.field("targetNodeId"), args.nodeId),
        )
      )
      .collect();
    for (const edge of edges) {
      await ctx.db.delete(edge._id);
    }

    await ctx.db.delete(args.nodeId);
    return { success: true };
  },
});

/* ────────────
   EDGES CRUD
   ──────────── */

export const listEdges = query({
  args: { workflowId: v.id("workflows") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("workflowEdges")
      .withIndex("workflowId", (qb) => qb.eq("workflowId", args.workflowId))
      .collect();
  },
});

export const addEdge = mutation({
  args: {
    workflowId: v.id("workflows"),
    sourceNodeId: v.id("workflowNodes"),
    targetNodeId: v.id("workflowNodes"),
    label: v.optional(v.string()),
    condition: v.optional(v.string()),
    displayOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const edgeId = await ctx.db.insert("workflowEdges", {
      workflowId: args.workflowId,
      sourceNodeId: args.sourceNodeId,
      targetNodeId: args.targetNodeId,
      label: args.label,
      condition: args.condition,
      displayOrder: args.displayOrder,
      createdAt: Date.now(),
    });
    return { edgeId };
  },
});

export const updateEdge = mutation({
  args: {
    edgeId: v.id("workflowEdges"),
    label: v.optional(v.string()),
    condition: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { edgeId, ...fields } = args;
    const updates: Record<string, unknown> = {};
    if (fields.label !== undefined) updates.label = fields.label;
    if (fields.condition !== undefined) updates.condition = fields.condition;
    if (fields.displayOrder !== undefined) updates.displayOrder = fields.displayOrder;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(edgeId, updates);
    }
    return { success: true };
  },
});

export const removeEdge = mutation({
  args: { edgeId: v.id("workflowEdges") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.edgeId);
    return { success: true };
  },
});

/* ────────────
   EXECUTION ENGINE
   ──────────── */

async function addLog(
  ctx: any,
  instanceId: Id<"workflowInstances">,
  workflowId: Id<"workflows">,
  action: string,
  status: string,
  details?: string,
  metadata?: string,
  performedBy?: Id<"users">,
  nodeId?: Id<"workflowNodes">,
) {
  return ctx.db.insert("workflowLogs", {
    instanceId,
    workflowId,
    nodeId,
    action,
    status,
    details,
    metadata,
    performedBy,
    createdAt: Date.now(),
  });
}

export const startWorkflow = mutation({
  args: {
    workflowId: v.id("workflows"),
    triggerSource: v.string(),
    triggerEntityId: v.optional(v.string()),
    triggerPayload: v.optional(v.string()),
    initiatedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) throw new Error("Workflow not found");
    if (workflow.status !== WORKFLOW_STATUS.PUBLISHED) {
      throw new Error("Workflow must be published to start");
    }

    // Find the Start node
    const startNode = await ctx.db
      .query("workflowNodes")
      .withIndex("workflowId", (qb) => qb.eq("workflowId", args.workflowId))
      .filter((qb) => qb.eq(qb.field("nodeType"), "start"))
      .first();

    if (!startNode) throw new Error("No Start node found");

    const now = Date.now();
    const instanceId = await ctx.db.insert("workflowInstances", {
      workflowId: args.workflowId,
      workflowVersion: workflow.version,
      status: INSTANCE_STATUS.STARTED,
      currentStepId: startNode._id,
      triggerSource: args.triggerSource,
      triggerEntityId: args.triggerEntityId,
      triggerPayload: args.triggerPayload,
      startedAt: now,
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    await addLog(
      ctx, instanceId, args.workflowId, "started", "success",
      `Workflow started via ${args.triggerSource}`,
      args.triggerPayload, args.initiatedBy, startNode._id,
    );

    // Auto-execute through start node to find next
    await executeNextStep(ctx, instanceId, startNode._id, args.triggerPayload);

    return { instanceId };
  },
});

async function executeNextStep(
  ctx: any,
  instanceId: Id<"workflowInstances">,
  currentNodeId: Id<"workflowNodes">,
  contextPayload?: string,
) {
  const instance = await ctx.db.get(instanceId);
  if (!instance || instance.status === INSTANCE_STATUS.CANCELLED) {
    return;
  }

  const currentNode = await ctx.db.get(currentNodeId);
  if (!currentNode) {
    await failInstance(ctx, instanceId, "Current node not found");
    return;
  }

  // Handle End node
  if (currentNode.nodeType === "end") {
    await ctx.db.patch(instanceId, {
      status: INSTANCE_STATUS.COMPLETED,
      completedAt: Date.now(),
      updatedAt: Date.now(),
    });
    await addLog(ctx, instanceId, instance.workflowId, "completed", "success", "Workflow completed");
    return;
  }

  // Resolve node config
  const config = currentNode.config ? JSON.parse(currentNode.config) : {};

  // Handle each node type
  switch (currentNode.nodeType) {
    case "start": {
      // Just pass through to next node
      const nextEdge = await findNextEdge(ctx, instance.workflowId, currentNodeId);
      if (nextEdge) {
        await ctx.db.patch(instanceId, {
          currentStepId: nextEdge.targetNodeId,
          status: INSTANCE_STATUS.IN_PROGRESS,
          updatedAt: Date.now(),
        });
        await executeNextStep(ctx, instanceId, nextEdge.targetNodeId, contextPayload);
      }
      break;
    }

    case "delay": {
      const delayMs = config.delayMs || (config.delayMinutes || 0) * 60 * 1000;
      const delayUntil = Date.now() + delayMs;

      await ctx.db.patch(instanceId, {
        currentStepId: currentNodeId,
        status: INSTANCE_STATUS.PAUSED,
        updatedAt: Date.now(),
      });

      await addLog(
        ctx, instanceId, instance.workflowId, "delay", "paused",
        `Delaying for ${delayMs}ms until ${new Date(delayUntil).toISOString()}`,
        JSON.stringify({ delayMs, delayUntil }), undefined, currentNodeId,
      );

      await ctx.db.patch(instanceId, {
        status: INSTANCE_STATUS.IN_PROGRESS,
        updatedAt: Date.now(),
      });

      const nextEdge = await findNextEdge(ctx, instance.workflowId, currentNodeId);
      if (nextEdge) {
        await ctx.db.patch(instanceId, {
          currentStepId: nextEdge.targetNodeId,
          updatedAt: Date.now(),
        });
        await executeNextStep(ctx, instanceId, nextEdge.targetNodeId, contextPayload);
      }
      break;
    }

    case "condition":
    case "decision": {
      const payload = contextPayload ? JSON.parse(contextPayload) : {};
      let matched = false;

      if (config.conditionField && config.conditionOperator && config.conditionValue) {
        const fieldValue = payload[config.conditionField];
        matched = evaluateCondition(fieldValue, config.conditionOperator, config.conditionValue, payload);
      }

      // Find edges — first matching condition wins
      const outgoingEdges = await ctx.db
        .query("workflowEdges")
        .withIndex("sourceNodeId", (qb: any) => qb.eq("sourceNodeId", currentNodeId))
        .collect()
        .then((edges: any[]) => edges.sort((a: any, b: any) => a.displayOrder - b.displayOrder));

      let targetEdge: any = null;

      if (config.branches && config.branches.length > 0) {
        // Check named branches
        for (const branch of config.branches) {
          const branchCondition = evaluateCondition(
            payload[branch.field],
            branch.operator || "equals",
            branch.value,
            payload,
          );
          if (branchCondition) {
            const branchEdge = outgoingEdges.find((e: any) => e.label === branch.label);
            if (branchEdge) {
              targetEdge = branchEdge;
              break;
            }
          }
        }
      }

      // Try condition edges first
      if (!targetEdge) {
        for (const edge of outgoingEdges) {
          if (edge.condition) {
            const edgeCondition = JSON.parse(edge.condition);
            const conditionResult = evaluateCondition(
              payload[edgeCondition.field],
              edgeCondition.operator,
              edgeCondition.value,
              payload,
            );
            if (conditionResult) {
              targetEdge = edge;
              matched = true;
              break;
            }
          }
        }
      }

      // Fallback to default edge (no condition)
      if (!targetEdge) {
        targetEdge = outgoingEdges.find((e: any) => !e.condition);
      }

      // If still no target, try any edge
      if (!targetEdge && outgoingEdges.length > 0) {
        targetEdge = outgoingEdges[0];
      }

      await addLog(
        ctx, instanceId, instance.workflowId, "decision", matched ? "matched" : "default",
        `Condition: ${config.conditionField || "branch"} → ${matched ? "matched" : "default path"}`,
        JSON.stringify({ field: config.conditionField, value: config.conditionValue }),
        undefined, currentNodeId,
      );

      if (targetEdge) {
        await ctx.db.patch(instanceId, {
          currentStepId: targetEdge.targetNodeId,
          updatedAt: Date.now(),
        });
        await executeNextStep(ctx, instanceId, targetEdge.targetNodeId, contextPayload);
      } else {
        await failInstance(ctx, instanceId, `No valid path from ${currentNode.label}`);
      }
      break;
    }

    case "approval": {
      await ctx.db.patch(instanceId, {
        currentStepId: currentNodeId,
        status: INSTANCE_STATUS.PAUSED,
        assignedTo: config.assignTo || undefined,
        updatedAt: Date.now(),
      });

      await addLog(
        ctx, instanceId, instance.workflowId, "approval_required", "paused",
        `Approval required: ${currentNode.label}`,
        JSON.stringify({ config }), undefined, currentNodeId,
      );

      // Approval is async — wait for resumeWorkflow to be called
      break;
    }

    case "task": {
      await addLog(
        ctx, instanceId, instance.workflowId, "task_created", "success",
        `Task created: ${currentNode.label}`,
        JSON.stringify({ config }), undefined, currentNodeId,
      );

      // Continue to next step
      const nextEdge = await findNextEdge(ctx, instance.workflowId, currentNodeId);
      if (nextEdge) {
        await ctx.db.patch(instanceId, {
          currentStepId: nextEdge.targetNodeId,
          updatedAt: Date.now(),
        });
        await executeNextStep(ctx, instanceId, nextEdge.targetNodeId, contextPayload);
      }
      break;
    }

    case "notification": {
      await addLog(
        ctx, instanceId, instance.workflowId, "notification_placeholder", "success",
        `Notification event: ${currentNode.label}`,
        JSON.stringify({ config }), undefined, currentNodeId,
      );

      // Notification engine placeholder — just log
      const nextEdge = await findNextEdge(ctx, instance.workflowId, currentNodeId);
      if (nextEdge) {
        await ctx.db.patch(instanceId, {
          currentStepId: nextEdge.targetNodeId,
          updatedAt: Date.now(),
        });
        await executeNextStep(ctx, instanceId, nextEdge.targetNodeId, contextPayload);
      }
      break;
    }

    case "assignment": {
      await addLog(
        ctx, instanceId, instance.workflowId, "assigned", "success",
        `Assigned via: ${config.assignmentType || "manual"}`,
        JSON.stringify({ config }), undefined, currentNodeId,
      );

      const nextEdge = await findNextEdge(ctx, instance.workflowId, currentNodeId);
      if (nextEdge) {
        await ctx.db.patch(instanceId, {
          currentStepId: nextEdge.targetNodeId,
          updatedAt: Date.now(),
        });
        await executeNextStep(ctx, instanceId, nextEdge.targetNodeId, contextPayload);
      }
      break;
    }

    case "webhook_placeholder":
    case "function_placeholder": {
      await addLog(
        ctx, instanceId, instance.workflowId, `${currentNode.nodeType}_placeholder`, "pending",
        `${currentNode.nodeType} — future integration point`,
        JSON.stringify({ config }), undefined, currentNodeId,
      );

      const nextEdge = await findNextEdge(ctx, instance.workflowId, currentNodeId);
      if (nextEdge) {
        await ctx.db.patch(instanceId, {
          currentStepId: nextEdge.targetNodeId,
          updatedAt: Date.now(),
        });
        await executeNextStep(ctx, instanceId, nextEdge.targetNodeId, contextPayload);
      }
      break;
    }

    default: {
      const nextEdge = await findNextEdge(ctx, instance.workflowId, currentNodeId);
      if (nextEdge) {
        await ctx.db.patch(instanceId, {
          currentStepId: nextEdge.targetNodeId,
          updatedAt: Date.now(),
        });
        await executeNextStep(ctx, instanceId, nextEdge.targetNodeId, contextPayload);
      }
    }
  }
}

function evaluateCondition(
  fieldValue: unknown,
  operator: string,
  expectedValue: string,
  payload: Record<string, unknown>,
): boolean {
  switch (operator) {
    case "equals":
      return String(fieldValue).toLowerCase() === String(expectedValue).toLowerCase();
    case "not_equals":
      return String(fieldValue).toLowerCase() !== String(expectedValue).toLowerCase();
    case "greater_than":
      return Number(fieldValue) > Number(expectedValue);
    case "less_than":
      return Number(fieldValue) < Number(expectedValue);
    case "contains":
      return String(fieldValue).toLowerCase().includes(String(expectedValue).toLowerCase());
    case "starts_with":
      return String(fieldValue).toLowerCase().startsWith(String(expectedValue).toLowerCase());
    case "ends_with":
      return String(fieldValue).toLowerCase().endsWith(String(expectedValue).toLowerCase());
    case "boolean_true":
      return fieldValue === true || fieldValue === "true" || fieldValue === "yes";
    case "boolean_false":
      return fieldValue === false || fieldValue === "false" || fieldValue === "no";
    case "date_before":
      return new Date(String(fieldValue)).getTime() < new Date(expectedValue).getTime();
    case "date_after":
      return new Date(String(fieldValue)).getTime() > new Date(expectedValue).getTime();
    default:
      return false;
  }
}

async function findNextEdge(ctx: any, workflowId: Id<"workflows">, sourceNodeId: Id<"workflowNodes">) {
  const edges: any[] = await ctx.db
    .query("workflowEdges")
    .withIndex("sourceNodeId", (qb: any) => qb.eq("sourceNodeId", sourceNodeId))
    .collect();

  // Return first non-condition edge (conditions are handled by condition/decision nodes)
  const result = edges.find((e: any) => !e.condition) || edges.sort((a: any, b: any) => a.displayOrder - b.displayOrder)[0] || null;
  return result as any;
}

async function failInstance(ctx: any, instanceId: Id<"workflowInstances">, error: string) {
  const inst = await ctx.db.get(instanceId);
  await ctx.db.patch(instanceId, {
    status: INSTANCE_STATUS.FAILED,
    error,
    updatedAt: Date.now(),
  });
  if (inst) {
    await addLog(ctx, instanceId, inst.workflowId, "failed", "error", error);
  }
}

/* ────────────
   WORKFLOW EXECUTION CONTROL
   ──────────── */

export const resumeWorkflow = mutation({
  args: {
    instanceId: v.id("workflowInstances"),
    approved: v.boolean(),
    performedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) throw new Error("Instance not found");

    if (args.approved) {
      await ctx.db.patch(args.instanceId, {
        status: INSTANCE_STATUS.IN_PROGRESS,
        updatedAt: Date.now(),
      });

      await addLog(ctx, args.instanceId, instance.workflowId, "approved", "success",
        `Approved by ${args.performedBy}`, args.notes || "", args.performedBy, instance.currentStepId!);

      // Continue execution
      if (instance.currentStepId) {
        await executeNextStep(ctx, args.instanceId, instance.currentStepId, instance.triggerPayload || undefined);
      }
    } else {
      await ctx.db.patch(args.instanceId, {
        status: INSTANCE_STATUS.CANCELLED,
        updatedAt: Date.now(),
      });

      await addLog(ctx, args.instanceId, instance.workflowId, "rejected", "cancelled",
        `Rejected by ${args.performedBy}: ${args.notes}`, undefined, args.performedBy, instance.currentStepId!);
    }

    return { success: true };
  },
});

export const cancelInstance = mutation({
  args: {
    instanceId: v.id("workflowInstances"),
    reason: v.optional(v.string()),
    cancelledBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.instanceId, {
      status: INSTANCE_STATUS.CANCELLED,
      updatedAt: Date.now(),
    });

    const cancelledInst = await ctx.db.get(args.instanceId);
    if (cancelledInst) {
      await addLog(ctx, args.instanceId, cancelledInst.workflowId,
        "cancelled", "cancelled", args.reason, undefined, args.cancelledBy);
    }

    return { success: true };
  },
});

export const retryInstance = mutation({
  args: {
    instanceId: v.id("workflowInstances"),
    performedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db.get(args.instanceId);
    if (!instance) throw new Error("Instance not found");

    const retryCount = (instance.retryCount || 0) + 1;
    await ctx.db.patch(args.instanceId, {
      status: INSTANCE_STATUS.IN_PROGRESS,
      error: undefined,
      retryCount,
      updatedAt: Date.now(),
    });

    await addLog(ctx, args.instanceId, instance.workflowId, "retry", "in_progress",
      `Retry #${retryCount}`, undefined, args.performedBy, instance.currentStepId!);

    // Restart from current step
    if (instance.currentStepId) {
      await executeNextStep(ctx, args.instanceId, instance.currentStepId, instance.triggerPayload || undefined);
    }

    return { success: true };
  },
});

/* ────────────
   DASHBOARD QUERIES
   ──────────── */

export const getDashboardStats = query({
  handler: async (ctx) => {
    const instances = await ctx.db.query("workflowInstances").collect();

    const total = instances.length;
    const active = instances.filter((i) =>
      i.status === INSTANCE_STATUS.STARTED || i.status === INSTANCE_STATUS.IN_PROGRESS
    ).length;
    const completed = instances.filter((i) => i.status === INSTANCE_STATUS.COMPLETED).length;
    const failed = instances.filter((i) => i.status === INSTANCE_STATUS.FAILED).length;
    const paused = instances.filter((i) => i.status === INSTANCE_STATUS.PAUSED).length;
    const cancelled = instances.filter((i) => i.status === INSTANCE_STATUS.CANCELLED).length;

    // Average processing time
    const completedInstances = instances.filter(
      (i) => i.status === INSTANCE_STATUS.COMPLETED && i.completedAt,
    );
    const avgTime = completedInstances.length > 0
      ? completedInstances.reduce((sum, i) => sum + (i.completedAt! - i.startedAt), 0) / completedInstances.length
      : 0;

    // Longest running
    const runningInstances = instances.filter(
      (i) => i.status === INSTANCE_STATUS.STARTED || i.status === INSTANCE_STATUS.IN_PROGRESS,
    );
    const longestRunning = runningInstances.length > 0
      ? Math.max(...runningInstances.map((i) => Date.now() - i.startedAt))
      : 0;

    return { total, active, completed, failed, paused, cancelled, avgTime, longestRunning };
  },
});

export const listInstances = query({
  args: {
    workflowId: v.optional(v.id("workflows")),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("workflowInstances").collect();
    const filtered = all.filter((i) => {
      if (args.workflowId && i.workflowId !== args.workflowId) return false;
      if (args.status && i.status !== args.status) return false;
      return true;
    });
    return filtered
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, args.limit || 20);
  },
});

export const getInstanceLogs = query({
  args: { instanceId: v.id("workflowInstances") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("workflowLogs")
      .withIndex("instanceId", (qb) => qb.eq("instanceId", args.instanceId))
      .collect()
      .then((logs) => logs.sort((a, b) => a.createdAt - b.createdAt));
  },
});

export const getInstanceById = query({
  args: { instanceId: v.id("workflowInstances") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.instanceId);
  },
});

/* ────────────
   UTILITY: GET ALL NODE TYPES
   ──────────── */

export const getNodeTypes = query({
  handler: async () => {
    return [
      { type: "start", label: "Start", color: "#34a853", icon: "play", description: "Workflow starting point" },
      { type: "end", label: "End", color: "#ea4335", icon: "stop", description: "Workflow ending point" },
      { type: "condition", label: "Condition", color: "#fbbc04", icon: "git-branch", description: "Branch based on field conditions" },
      { type: "approval", label: "Approval", color: "#1a73e8", icon: "check-square", description: "Requires manual approval" },
      { type: "task", label: "Task", color: "#9c27b0", icon: "clipboard-list", description: "Create a task" },
      { type: "notification", label: "Notification", color: "#0097a7", icon: "bell", description: "Send notification (placeholder)" },
      { type: "delay", label: "Delay / Wait", color: "#795548", icon: "clock", description: "Wait for specified duration" },
      { type: "decision", label: "Decision", color: "#e8710a", icon: "git-merge", description: "Multi-branch decision" },
      { type: "assignment", label: "Assignment", color: "#607d8b", icon: "user-plus", description: "Assign to user/team/manager" },
      { type: "webhook_placeholder", label: "Webhook", color: "#7b1fa2", icon: "webhook", description: "Webhook integration (future)" },
      { type: "function_placeholder", label: "Function", color: "#1565c0", icon: "code", description: "Custom function (future)" },
      { type: "subworkflow", label: "Sub-Workflow", color: "#2e7d32", icon: "layers", description: "Nested workflow execution" },
    ];
  },
});
