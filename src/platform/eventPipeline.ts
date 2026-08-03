/**
 * Event Pipeline — Enterprise Event Wiring Middleware
 *
 * The Event Pipeline is a higher-order function that wraps mutation handlers
 * to automatically fire audit logs, timeline events, activity records,
 * workflow events, and notifications — WITHOUT modifying business logic.
 *
 * Every business module MUST use `withEventPipeline()` for ALL mutations.
 * No module may manually write audit, timeline, or notification entries.
 *
 * Usage:
 *
 *   export const createLead = mutation({
 *     args: { ... },
 *     handler: withEventPipeline(
 *       {
 *         module: "crm",
 *         entity: "lead",
 *         action: "create",
 *         getEntityId: (args, result) => result as string,
 *         getUserId: (args) => args.createdBy,
 *         getCompanyId: (args) => args.companyId,
 *         getBranchId: (args) => args.branchId,
 *         getDepartmentId: (args) => args.departmentId,
 *       },
 *       async (ctx, args) => {
 *         // Business logic only — no audit/timeline/notification code
 *         return await ctx.db.insert("leads", { ...args, createdAt: Date.now() });
 *       }
 *     ),
 *   });
 */

import { Id } from "../convex/_generated/dataModel";

// ─── Types ───────────────────────────────────────────────────────────────

export type MutationContext = {
  db: {
    get: (id: Id<any>) => Promise<any>;
    insert: (table: string, doc: any) => Promise<Id<any>>;
    patch: (id: Id<any>, doc: any) => Promise<void>;
    delete: (id: Id<any>) => Promise<void>;
    query: (table: string) => any;
  };
  auth?: any;
};

export type MutationResult = string | Record<string, unknown> | void | null | undefined;

export type EntityIdExtractor<P, R> = (args: P, result: R) => string | undefined;
export type UserIdExtractor<P> = (args: P) => Id<"users"> | undefined;
export type CompanyIdExtractor<P> = (args: P) => Id<"companies"> | undefined;
export type BranchIdExtractor<P> = (args: P) => Id<"branches"> | undefined;
export type DepartmentIdExtractor<P> = (args: P) => Id<"departments"> | undefined;
export type DescriptionExtractor<P, R> = (args: P, result: R) => string | undefined;
export type ShouldNotifyExtractor<P, R> = (args: P, result: R) => boolean;

export interface EventPipelineConfig<P = any, R = any> {
  /** Business module name (e.g., "crm", "finance", "student") */
  module: string;
  /** Entity type (e.g., "lead", "invoice", "student") */
  entity: string;
  /** Action performed (e.g., "create", "update", "delete", "archive") */
  action: string;
  /** Event type for the event bus (e.g., "lead.created", "finance.invoice.created") */
  eventType?: string;
  /** Human-readable title template for timeline events */
  title?: string;

  /** Extract entity ID from args and/or result */
  getEntityId: EntityIdExtractor<P, R>;
  /** Extract performer user ID from args */
  getUserId?: UserIdExtractor<P>;
  /** Extract company ID from args */
  getCompanyId?: CompanyIdExtractor<P>;
  /** Extract branch ID from args */
  getBranchId?: BranchIdExtractor<P>;
  /** Extract department ID from args */
  getDepartmentId?: DepartmentIdExtractor<P>;
  /** Generate a description for the event */
  getDescription?: DescriptionExtractor<P, R>;
  /** Whether to send a notification (default: false) */
  shouldNotify?: ShouldNotifyExtractor<P, R>;
  /** Notification title if shouldNotify is true */
  notificationTitle?: string;
  /** Notification message template if shouldNotify is true */
  notificationMessage?: string;
  /** Changes payload for audit (JSON string of before/after diff) */
  getChanges?: (args: P) => string | undefined;
  /** Whether to suppress all events (for internal/bulk operations) */
  suppressEvents?: boolean;
}

// ─── Event Pipeline Middleware ───────────────────────────────────────────

/**
 * Wrap a mutation handler with the event pipeline.
 *
 * After the business handler succeeds, the pipeline automatically:
 * 1. Records an audit log entry
 * 2. Records a timeline event
 * 3. Records an activity entry
 * 4. Publishes an event to the event bus
 * 5. Sends a notification (if configured)
 *
 * The original handler's return value is preserved unchanged.
 */
export function withEventPipeline<P extends Record<string, unknown>, R extends MutationResult>(
  config: EventPipelineConfig<P, R>,
  handler: (ctx: any, args: P) => Promise<R>,
): (ctx: any, args: P) => Promise<R> {
  return async (ctx: any, args: P) => {
    // Execute the original business logic
    const result = await handler(ctx, args);

    // Skip event wiring if suppressed
    if (config.suppressEvents) {
      return result;
    }

    const entityId = config.getEntityId(args, result);
    const performedBy = config.getUserId?.(args);
    const companyId = config.getCompanyId?.(args);
    const branchId = config.getBranchId?.(args);
    const departmentId = config.getDepartmentId?.(args);
    const description = config.getDescription?.(args, result);
    const eventType = config.eventType || `${config.module}.${config.entity}.${config.action}`;
    const now = Date.now();
    const title = config.title || `${config.module}.${config.entity}.${config.action}`;
    const changes = config.getChanges?.(args);

    try {
      // ── 1. Audit Log ────────────────────────────────────────
      await ctx.db.insert("auditLogs", {
        action: config.action,
        entity: config.entity,
        entityId: entityId || "",
        userId: performedBy,
        companyId: companyId,
        branchId: branchId,
        departmentId: departmentId,
        changes: changes ? { raw: changes } : undefined,
        createdAt: now,
      });

      // ── 2. Timeline Event ────────────────────────────────────
      if (entityId) {
        await ctx.db.insert("timelineEvents", {
          module: config.module,
          eventType: eventType,
          entityType: config.entity,
          entityId: entityId,
          title: title,
          description: description,
          performedBy: performedBy,
          companyId: companyId,
          branchId: branchId,
          departmentId: departmentId,
          createdAt: now,
        });
      }

      // ── 3. Activity Record ──────────────────────────────────
      if (entityId) {
        await ctx.db.insert("activities", {
          module: config.module,
          action: config.action,
          entityType: config.entity,
          entityId: entityId,
          description: description || title,
          userId: performedBy,
          companyId: companyId,
          branchId: branchId,
          departmentId: departmentId,
          createdAt: now,
        });
      }

      // ── 4. Event Bus Event ──────────────────────────────────
      if (entityId) {
        await ctx.db.insert("events", {
          module: config.module,
          eventType: eventType,
          entityType: config.entity,
          entityId: entityId,
          performedBy: performedBy,
          companyId: companyId,
          branchId: branchId,
          departmentId: departmentId,
          status: "published",
          publishedAt: now,
          createdAt: now,
        });
      }

      // ── 5. Notification ─────────────────────────────────────
      if (config.shouldNotify?.(args, result) && performedBy && config.notificationTitle) {
        try {
          await ctx.db.insert("notifications", {
            userId: performedBy,
            type: config.action,
            title: config.notificationTitle || title,
            message: config.notificationMessage || description || title,
            referenceId: entityId || "",
            referenceType: config.entity,
            isRead: false,
            companyId: companyId,
            branchId: branchId,
            createdAt: now,
          });
        } catch {
          // Notification failure should never break the main operation
        }
      }
    } catch (error) {
      // Event pipeline failure must never break the business operation.
      // Log to console for debugging — audit trail is a secondary concern.
      console.error(`[EventPipeline] Failed to record events for ${eventType}:`, error);
    }

    return result;
  };
}

/**
 * Batch pipeline for mutations that create/update/delete multiple entities.
 * Same as withEventPipeline but fires events for each entity in the result array.
 */
export function withBatchEventPipeline<P extends Record<string, unknown>, R extends Array<{ entityId: string; action?: string }>>(
  module: string,
  entity: string,
  userIdExtractor: UserIdExtractor<P>,
  handler: (ctx: MutationContext, args: P) => Promise<R>,
): (ctx: MutationContext, args: P) => Promise<R> {
  return async (ctx: MutationContext, args: P) => {
    const results = await handler(ctx, args);
    const performedBy = userIdExtractor(args);
    const now = Date.now();

    for (const item of results) {
      const action = item.action || "updated";
      try {
        await ctx.db.insert("auditLogs", {
          action,
          entity,
          entityId: item.entityId,
          userId: performedBy,
          createdAt: now,
        });

        await ctx.db.insert("timelineEvents", {
          module,
          eventType: `${module}.${entity}.${action}`,
          entityType: entity,
          entityId: item.entityId,
          title: `${module}.${entity}.${action}`,
          performedBy: performedBy,
          createdAt: now,
        });
      } catch {
        // Silently continue on event failure
      }
    }

    return results;
  };
}

/**
 * Create an event pipeline config builder for cleaner usage.
 */
export function createPipelineConfig<A, B = MutationResult>() {
  return {
    forModule: (module: string) => ({
      forEntity: (entity: string) => ({
        onAction: (action: string) => ({
          withId: (fn: EntityIdExtractor<A, B>) => ({
            build: (overrides?: Partial<EventPipelineConfig<A, B>>): EventPipelineConfig<A, B> => ({
              module,
              entity,
              action,
              getEntityId: fn,
              ...overrides,
            }),
          }),
        }),
      }),
    }),
  };
}

/**
 * Get the entity ID from a Convex mutation result.
 * Handles common return patterns: { _id }, { id }, { success, id }, string, or { leadId, studentId, etc. }
 */
export function extractIdFromResult(result: MutationResult): string | undefined {
  if (!result) return undefined;
  if (typeof result === "string") return result;
  if (typeof result === "object") {
    const obj = result as Record<string, unknown>;
    return (obj._id || obj.id || obj.leadId || obj.studentId || obj.invoiceId ||
            obj.taskId || obj.userId || obj.employeeId || obj.documentId ||
            obj.instanceId || obj.eventId || obj.workflowId || obj.campaignId) as string | undefined;
  }
  return undefined;
}

/**
 * Convenience: extract entity ID from result (standard pattern).
 * Most Convex mutations return the new document ID as a string.
 */
export const entityIdFromResult = <P>() => (_: P, result: MutationResult) => extractIdFromResult(result);

/**
 * Convenience: extract entity ID from args (for updates/deletes where ID is in args).
 */
export const entityIdFromArg = <P extends Record<string, any>>(key: string) =>
  (args: P, _result: any) => args[key] as string | undefined;

/**
 * Convenience: extract user ID from args.
 */
export const userIdFromArg = <P extends Record<string, any>>(key: string = "createdBy") =>
  (args: P) => args[key] as Id<"users"> | undefined;

/**
 * Convenience: extract company/branch/department from args.
 */
export const orgScopeFromArg = <P extends Record<string, any>>() => ({
  getCompanyId: (args: P) => args.companyId as Id<"companies"> | undefined,
  getBranchId: (args: P) => args.branchId as Id<"branches"> | undefined,
  getDepartmentId: (args: P) => args.departmentId as Id<"departments"> | undefined,
});
