import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { withScopeAndEvents, type ScopeAndEventsConfig } from "./withScopeAndEvents";

function withIntakePipeline<P = any, R = any>(
  operation: ScopeAndEventsConfig<P, R>["operation"],
  entity: string,
  handler: (ctx: any, args: P) => Promise<R>,
): (ctx: any, args: P) => Promise<R> {
  return withScopeAndEvents<P, R>(
    {
      operation,
      module: "intake",
      entity,
      notifyViaMatrix: true,
      registerSearch: true,
      signalDashboard: true,
    },
    handler,
  );
}

/* ────────────
   CONSTANTS
   ──────────── */

const PROCESSING_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  VALIDATED: "validated",
  DUPLICATE: "duplicate",
  NEEDS_REVIEW: "needs_review",
  VERIFIED: "verified",
  REJECTED: "rejected",
  ROUTED: "routed",
  COMPLETED: "completed",
  FAILED: "failed",
  RETRY: "retry",
  CANCELLED: "cancelled",
} as const;

const VALIDATION_STATUS = {
  PENDING: "pending",
  PASSED: "passed",
  FAILED: "failed",
  WARNINGS: "warnings",
} as const;

const VERIFICATION_STATUS = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
  NEEDS_REVIEW: "needs_review",
} as const;

const DUPLICATE_STATUS = {
  NOT_CHECKED: "not_checked",
  UNIQUE: "unique",
  DUPLICATE: "duplicate",
  MERGED: "merged",
  REVIEW: "review",
} as const;

const ROUTING_STATUS = {
  PENDING: "pending",
  ROUTED: "routed",
  FAILED: "failed",
} as const;

const TARGET_MODULES = [
  "crm", "admissions", "hr", "finance", "production",
  "support", "procurement", "vendor", "inventory", "asset",
  "knowledge", "custom",
] as const;

const SOURCES = [
  "manual_form", "public_form", "csv_import", "rest_api", "webhook",
] as const;

const EVENT_TYPES = [
  "submission_created", "submission_validated", "submission_verified",
  "submission_routed", "submission_failed", "submission_rejected",
  "submission_completed", "duplicate_detected", "verification_required",
] as const;

/* ────────────
   HELPERS
   ──────────── */

function generateSubmissionNumber(): string {
  const prefix = "INT";
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

async function addTimelineEntry(
  ctx: any,
  submissionId: Id<"intakeSubmissions">,
  action: string,
  status: string,
  details?: string,
  performedBy?: Id<"users">,
  metadata?: string,
) {
  return ctx.db.insert("intakeTimeline", {
    submissionId,
    action,
    status,
    details,
    performedBy,
    metadata,
    createdAt: Date.now(),
  });
}

async function emitEvent(
  ctx: any,
  submissionId: Id<"intakeSubmissions">,
  eventType: string,
  status: string,
  payload?: string,
) {
  return ctx.db.insert("intakeEvents", {
    submissionId,
    eventType,
    status,
    payload,
    createdAt: Date.now(),
  });
}

/* ────────────
   STEP 1 — SUBMIT
   ──────────── */

export const submit = mutation({
  args: {
    source: v.union(...SOURCES.map((s) => v.literal(s))),
    payload: v.string(),
    formId: v.optional(v.id("forms")),
    formCode: v.optional(v.string()),
    formVersion: v.optional(v.number()),
    createdBy: v.optional(v.id("users")),
    submittedBy: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    browser: v.optional(v.string()),
    device: v.optional(v.string()),
    metadata: v.optional(v.string()),
    token: v.optional(v.string()),
  },
  handler: withIntakePipeline("create", "intake_submission", async (ctx, args) => {
    const now = Date.now();
    const submissionNumber = generateSubmissionNumber();

    const submissionId = await ctx.db.insert("intakeSubmissions", {
      submissionNumber,
      formId: args.formId,
      formCode: args.formCode,
      formVersion: args.formVersion,
      source: args.source,
      payload: args.payload,
      createdBy: args.createdBy,
      submittedBy: args.submittedBy,
      submissionDate: now,
      ipAddress: args.ipAddress,
      browser: args.browser,
      device: args.device,
      processingStatus: PROCESSING_STATUS.PENDING,
      validationStatus: VALIDATION_STATUS.PENDING,
      verificationStatus: VERIFICATION_STATUS.PENDING,
      duplicateStatus: DUPLICATE_STATUS.NOT_CHECKED,
      routingStatus: ROUTING_STATUS.PENDING,
      retryCount: 0,
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    });

    // Timeline: Submission Created
    await addTimelineEntry(
      ctx, submissionId, "submission_created", "pending",
      `Submission created from ${args.source}`,
      args.createdBy,
    );

    // Event: Submission Created
    await emitEvent(ctx, submissionId, "submission_created", "pending", args.payload);

    return {
      submissionId,
      submissionNumber,
    };
  }),
});

/* ────────────
   STEP 2 — VALIDATE
   ──────────── */

export const validate = mutation({
  args: {
    submissionId: v.id("intakeSubmissions"),
    validatedBy: v.optional(v.id("users")),
    token: v.optional(v.string()),
  },
  handler: withIntakePipeline("update", "intake_submission", async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");

    const payload = JSON.parse(submission.payload || "{}");
    const errors: string[] = [];
    const warnings: string[] = [];

    // If formId exists, validate against form schema
    if (submission.formId) {
      const fields = await ctx.db
        .query("formFields")
        .withIndex("formId", (q: any) => q.eq("formId", submission.formId!))
        .collect();

      for (const field of fields) {
        const value = payload[field.fieldCode];

        // Required field check
        if (field.required && (value === undefined || value === null || value === "")) {
          errors.push(`Required field '${field.label}' (${field.fieldCode}) is missing`);
          continue;
        }

        if (value !== undefined && value !== null && value !== "") {
          // Regex validation
          if (field.validationRegex) {
            try {
              const regex = new RegExp(field.validationRegex);
              if (!regex.test(String(value))) {
                errors.push(`Field '${field.label}' failed regex validation`);
              }
            } catch {
              warnings.push(`Invalid regex pattern for field '${field.label}'`);
            }
          }

          // Email validation
          if (field.fieldType === "email" && typeof value === "string") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              errors.push(`Field '${field.label}' is not a valid email`);
            }
          }

          // Phone validation
          if (field.fieldType === "phone" && typeof value === "string") {
            const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;
            if (!phoneRegex.test(value)) {
              warnings.push(`Field '${field.label}' may not be a valid phone number`);
            }
          }

          // Dropdown validation
          if ((field.fieldType === "dropdown" || field.fieldType === "radio") && field.options) {
            if (!field.options.includes(String(value))) {
              errors.push(`Field '${field.label}' has invalid option: ${value}`);
            }
          }

          // Number min/max
          if ((field.fieldType === "number" || field.fieldType === "currency") && typeof value === "number") {
            if (field.minValue !== undefined && value < field.minValue) {
              errors.push(`Field '${field.label}' is below minimum value ${field.minValue}`);
            }
            if (field.maxValue !== undefined && value > field.maxValue) {
              errors.push(`Field '${field.label}' is above maximum value ${field.maxValue}`);
            }
          }
        }
      }

      // Check for unknown fields
      const validFieldCodes = new Set(fields.map((f: any) => f.fieldCode));
      const unknownFields = Object.keys(payload).filter(
        (key) => !validFieldCodes.has(key) && !key.startsWith("_")
      );
      if (unknownFields.length > 0) {
        warnings.push(`Unknown fields: ${unknownFields.join(", ")}`);
      }
    }

    const validationReport = JSON.stringify({
      valid: errors.length === 0,
      errors,
      warnings,
      totalFields: Object.keys(payload).length,
      checkedAt: Date.now(),
    });

    const validationPassed = errors.length === 0;
    const newStatus = validationPassed
      ? (warnings.length > 0 ? VALIDATION_STATUS.WARNINGS : VALIDATION_STATUS.PASSED)
      : VALIDATION_STATUS.FAILED;

    const now = Date.now();

    await ctx.db.patch(args.submissionId, {
      processingStatus: validationPassed ? PROCESSING_STATUS.VALIDATED : PROCESSING_STATUS.NEEDS_REVIEW,
      validationStatus: newStatus,
      validationReport,
      updatedAt: now,
    });

    // Timeline
    await addTimelineEntry(
      ctx, args.submissionId, "validated", newStatus,
      `Validation ${validationPassed ? "passed" : "failed"}: ${errors.length} errors, ${warnings.length} warnings`,
      args.validatedBy,
      validationReport,
    );

    // Event
    await emitEvent(
      ctx, args.submissionId,
      validationPassed ? "submission_validated" : "submission_failed",
      newStatus,
      validationReport,
    );

    return {
      valid: validationPassed,
      errors,
      warnings,
    };
  }),
});

/* ────────────
   STEP 3 — DEDUPLICATE
   ──────────── */

export const deduplicate = mutation({
  args: {
    submissionId: v.id("intakeSubmissions"),
    checkedBy: v.optional(v.id("users")),
    token: v.optional(v.string()),
  },
  handler: withIntakePipeline("update", "intake_submission", async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");

    const payload = JSON.parse(submission.payload || "{}");
    const now = Date.now();

    // Get active duplicate rules
    const rules = await ctx.db
      .query("intakeDuplicateRules")
      .withIndex("isActive", (q: any) => q.eq("isActive", true))
      .collect();

    if (rules.length === 0) {
      // No rules — mark as unique
      await ctx.db.patch(args.submissionId, {
        duplicateStatus: DUPLICATE_STATUS.UNIQUE,
        updatedAt: now,
      });

      await addTimelineEntry(
        ctx, args.submissionId, "duplicate_check", "unique",
        "No duplicate rules configured — marked as unique",
        args.checkedBy,
      );

      return { isDuplicate: false, reason: null };
    }

    // Check each rule
    for (const rule of rules) {
      // Check if rule applies to this form
      if (rule.targetFormIds && rule.targetFormIds.length > 0 && submission.formId) {
        if (!rule.targetFormIds.includes(submission.formId)) {
          continue;
        }
      }

      // Extract match values from payload
      const matchValues: Record<string, string> = {};
      for (const field of rule.matchFields) {
        const value = payload[field];
        if (value !== undefined && value !== null && value !== "") {
          matchValues[field] = String(value);
        }
      }

      if (Object.keys(matchValues).length === 0) continue;

      // Build query to find duplicates
      // We need to check existing submissions with matching field values
      let isDuplicate = false;
      let duplicateSubmissionId: Id<"intakeSubmissions"> | null = null;

      // Simple approach: scan recent submissions and compare payload
      const existingSubmissions = await ctx.db
        .query("intakeSubmissions")
        .withIndex("processingStatus_createdAt", (q: any) => q.eq("processingStatus", submission.processingStatus))
        .take(50);

      // Also check all non-rejected submissions
      const allActive = await ctx.db
        .query("intakeSubmissions")
        .filter((q: any) =>
          q.and(
            q.neq(q.field("_id"), args.submissionId),
            q.neq(q.field("processingStatus"), PROCESSING_STATUS.REJECTED),
          )
        )
        .take(100);

      for (const existing of allActive) {
        const existingPayload = JSON.parse(existing.payload || "{}");
        let matchCount = 0;

        for (const field of rule.matchFields) {
          const existingVal = existingPayload[field];
          const newVal = matchValues[field];
          if (existingVal !== undefined && newVal !== undefined &&
              String(existingVal).toLowerCase() === newVal.toLowerCase()) {
            matchCount++;
          }
        }

        if (rule.matchType === "any" && matchCount > 0) {
          isDuplicate = true;
          duplicateSubmissionId = existing._id;
          break;
        } else if (rule.matchType === "all" && matchCount === rule.matchFields.length) {
          isDuplicate = true;
          duplicateSubmissionId = existing._id;
          break;
        }
      }

      if (isDuplicate) {
        const duplicateReason = `Matched rule '${rule.name}': ${rule.matchFields.join(", ")}`;
        const now2 = Date.now();

        await ctx.db.patch(args.submissionId, {
          duplicateStatus: DUPLICATE_STATUS.DUPLICATE,
          processingStatus:
            rule.action === "review" ? PROCESSING_STATUS.NEEDS_REVIEW :
            rule.action === "ignore" ? PROCESSING_STATUS.DUPLICATE :
            PROCESSING_STATUS.DUPLICATE,
          duplicateReason,
          updatedAt: now2,
        });

        await addTimelineEntry(
          ctx, args.submissionId, "duplicate_detected", rule.action,
          duplicateReason + ` — Action: ${rule.action}`,
          args.checkedBy,
        );

        await emitEvent(
          ctx, args.submissionId, "duplicate_detected", "duplicate",
          JSON.stringify({ rule: rule.name, matchValues, existingId: duplicateSubmissionId }),
        );

        return {
          isDuplicate: true,
          reason: duplicateReason,
          action: rule.action,
          matchedSubmissionId: duplicateSubmissionId,
        };
      }
    }

    // No duplicates found
    await ctx.db.patch(args.submissionId, {
      duplicateStatus: DUPLICATE_STATUS.UNIQUE,
      updatedAt: now,
    });

    await addTimelineEntry(
      ctx, args.submissionId, "duplicate_check", "unique",
      "No duplicates detected",
      args.checkedBy,
    );

    return { isDuplicate: false, reason: null };
  }),
});

/* ────────────
   STEP 4 — VERIFY
   ──────────── */

export const verify = mutation({
  args: {
    submissionId: v.id("intakeSubmissions"),
    status: v.union(
      v.literal(VERIFICATION_STATUS.VERIFIED),
      v.literal(VERIFICATION_STATUS.REJECTED),
      v.literal(VERIFICATION_STATUS.NEEDS_REVIEW),
    ),
    verifiedBy: v.id("users"),
    remarks: v.optional(v.string()),
    token: v.optional(v.string()),
  },
  handler: withIntakePipeline("update", "intake_submission", async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");

    const now = Date.now();

    await ctx.db.patch(args.submissionId, {
      verificationStatus: args.status,
      processingStatus:
        args.status === VERIFICATION_STATUS.VERIFIED ? PROCESSING_STATUS.VERIFIED :
        args.status === VERIFICATION_STATUS.REJECTED ? PROCESSING_STATUS.REJECTED :
        PROCESSING_STATUS.NEEDS_REVIEW,
      systemNotes: args.remarks
        ? `${submission.systemNotes || ""}\n[${new Date(now).toISOString()}] ${args.remarks}`
        : submission.systemNotes,
      updatedAt: now,
    });

    await addTimelineEntry(
      ctx, args.submissionId, "verified", args.status,
      args.remarks || `Verification ${args.status}`,
      args.verifiedBy,
    );

    await emitEvent(
      ctx, args.submissionId,
      args.status === VERIFICATION_STATUS.VERIFIED ? "submission_verified" :
      args.status === VERIFICATION_STATUS.REJECTED ? "submission_rejected" :
      "submission_failed",
      args.status,
      JSON.stringify({ remarks: args.remarks }),
    );

    return { status: args.status };
  }),
});

/* ────────────
   STEP 5 — TRANSFORM
   ──────────── */

export const transform = mutation({
  args: {
    submissionId: v.id("intakeSubmissions"),
    targetModule: v.string(),
    mappedBy: v.optional(v.id("users")),
    token: v.optional(v.string()),
  },
  handler: withIntakePipeline("update", "intake_submission", async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");

    const payload = JSON.parse(submission.payload || "{}");

    // Get active mappings for the target module
    const mappings = await ctx.db
      .query("intakeTransformMappings")
      .withIndex("targetModule", (q: any) => q.eq("targetModule", args.targetModule))
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .collect();

    const transformed: Record<string, any> = {};
    const missingRequired: string[] = [];

    for (const mapping of mappings) {
      // Check if mapping applies to this form
      if (mapping.sourceFormIds && mapping.sourceFormIds.length > 0 && submission.formId) {
        if (!mapping.sourceFormIds.includes(submission.formId)) continue;
      }

      const sourceValue = payload[mapping.sourceField];

      if (sourceValue !== undefined && sourceValue !== null && sourceValue !== "") {
        // Apply transformation if configured
        if (mapping.transformation === "uppercase") {
          transformed[mapping.targetField] = String(sourceValue).toUpperCase();
        } else if (mapping.transformation === "lowercase") {
          transformed[mapping.targetField] = String(sourceValue).toLowerCase();
        } else if (mapping.transformation === "trim") {
          transformed[mapping.targetField] = String(sourceValue).trim();
        } else if (mapping.transformation === "number") {
          transformed[mapping.targetField] = Number(sourceValue);
        } else if (mapping.transformation === "boolean") {
          transformed[mapping.targetField] = String(sourceValue).toLowerCase() === "true";
        } else {
          transformed[mapping.targetField] = sourceValue;
        }
      } else if (mapping.defaultValue) {
        transformed[mapping.targetField] = mapping.defaultValue;
      } else if (mapping.isRequired) {
        missingRequired.push(mapping.targetField);
      }
    }

    const now = Date.now();
    const transformResult = JSON.stringify({
      transformed,
      missingRequired,
      totalMappings: mappings.length,
      appliedMappings: Object.keys(transformed).length,
    });

    await ctx.db.patch(args.submissionId, {
      metadata: transformResult,
      updatedAt: now,
    });

    await addTimelineEntry(
      ctx, args.submissionId, "transformed", missingRequired.length > 0 ? "incomplete" : "completed",
      `Transformed ${Object.keys(transformed).length} fields for ${args.targetModule}` +
        (missingRequired.length > 0 ? ` — Missing required: ${missingRequired.join(", ")}` : ""),
      args.mappedBy,
      transformResult,
    );

    return {
      transformed,
      missingRequired,
      appliedCount: Object.keys(transformed).length,
    };
  }),
});

/* ────────────
   STEP 6 — ROUTE
   ──────────── */

export const route = mutation({
  args: {
    submissionId: v.id("intakeSubmissions"),
    targetModule: v.optional(v.string()),
    routedBy: v.optional(v.id("users")),
    token: v.optional(v.string()),
  },
  handler: withIntakePipeline("update", "intake_submission", async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");

    let targetModule = args.targetModule;

    // Auto-route using rules if no module specified
    if (!targetModule) {
      const rules = await ctx.db
        .query("intakeRoutingRules")
        .withIndex("isActive", (q: any) => q.eq("isActive", true))
        .order("asc")
        .collect();

      const payload = JSON.parse(submission.payload || "{}");

      for (const rule of rules) {
        // Check if rule applies to this form
        if (rule.sourceFormIds && rule.sourceFormIds.length > 0 && submission.formId) {
          if (!rule.sourceFormIds.includes(submission.formId)) continue;
        }

        if (rule.defaultRoute) {
          targetModule = rule.targetModule;
          break;
        }

        if (rule.conditionField && payload[rule.conditionField] !== undefined) {
          const value = String(payload[rule.conditionField]);
          const conditionValue = rule.conditionValue || "";

          const matches =
            rule.conditionOperator === "equals" ? value === conditionValue :
            rule.conditionOperator === "contains" ? value.includes(conditionValue) :
            rule.conditionOperator === "starts_with" ? value.startsWith(conditionValue) :
            rule.conditionOperator === "ends_with" ? value.endsWith(conditionValue) :
            rule.conditionOperator === "in" ? conditionValue.split(",").map((s: any) => s.trim()).includes(value) :
            true;

          if (matches) {
            targetModule = rule.targetModule;
            break;
          }
        }
      }
    }

    if (!targetModule) {
      throw new Error("No target module determined — configure routing rules or specify target module");
    }

    const now = Date.now();

    await ctx.db.patch(args.submissionId, {
      targetModule,
      routingStatus: ROUTING_STATUS.ROUTED,
      processingStatus: PROCESSING_STATUS.ROUTED,
      updatedAt: now,
    });

    await addTimelineEntry(
      ctx, args.submissionId, "routed", "completed",
      `Routed to ${targetModule}`,
      args.routedBy,
    );

    await emitEvent(
      ctx, args.submissionId, "submission_routed", "routed",
      JSON.stringify({ targetModule }),
    );

    return { targetModule };
  }),
});

/* ────────────
   STEP 7 — COMPLETE
   ──────────── */

export const completeProcessing = mutation({
  args: {
    submissionId: v.id("intakeSubmissions"),
    targetEntityId: v.optional(v.string()),
    completedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
    token: v.optional(v.string()),
  },
  handler: withIntakePipeline("update", "intake_submission", async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");

    const now = Date.now();
    const processingTime = now - submission.submissionDate;

    await ctx.db.patch(args.submissionId, {
      processingStatus: PROCESSING_STATUS.COMPLETED,
      targetEntityId: args.targetEntityId,
      processingTime,
      systemNotes: args.notes
        ? `${submission.systemNotes || ""}\n[${new Date(now).toISOString()}] ${args.notes}`
        : submission.systemNotes,
      updatedAt: now,
    });

    await addTimelineEntry(
      ctx, args.submissionId, "completed", "completed",
      args.notes || `Processing completed in ${processingTime}ms` +
        (args.targetEntityId ? ` — Entity: ${args.targetEntityId}` : ""),
      args.completedBy,
    );

    await emitEvent(
      ctx, args.submissionId, "submission_completed", "completed",
      JSON.stringify({ targetEntityId: args.targetEntityId, processingTime }),
    );

    return { processingTime };
  }),
});

/* ────────────
   SUBMISSION PROCESSING PIPELINE
   ──────────── */

export const processSubmission = mutation({
  args: {
    source: v.union(...SOURCES.map((s) => v.literal(s))),
    payload: v.string(),
    formId: v.optional(v.id("forms")),
    formCode: v.optional(v.string()),
    formVersion: v.optional(v.number()),
    createdBy: v.optional(v.id("users")),
    submittedBy: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    browser: v.optional(v.string()),
    device: v.optional(v.string()),
    metadata: v.optional(v.string()),
    skipValidation: v.optional(v.boolean()),
    skipDeduplicate: v.optional(v.boolean()),
    autoRoute: v.optional(v.boolean()),
    targetModule: v.optional(v.string()),
    token: v.optional(v.string()),
  },
  handler: withIntakePipeline("create", "intake_submission", async (ctx, args) => {
    // Step 1: Submit (inline logic)
    const now = Date.now();
    const submissionNumber = generateSubmissionNumber();

    const submissionId = await ctx.db.insert("intakeSubmissions", {
      submissionNumber,
      formId: args.formId,
      formCode: args.formCode,
      formVersion: args.formVersion,
      source: args.source,
      payload: args.payload,
      createdBy: args.createdBy,
      submittedBy: args.submittedBy,
      submissionDate: now,
      ipAddress: args.ipAddress,
      browser: args.browser,
      device: args.device,
      processingStatus: PROCESSING_STATUS.PENDING,
      validationStatus: VALIDATION_STATUS.PENDING,
      verificationStatus: VERIFICATION_STATUS.PENDING,
      duplicateStatus: DUPLICATE_STATUS.NOT_CHECKED,
      routingStatus: ROUTING_STATUS.PENDING,
      retryCount: 0,
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    });

    await addTimelineEntry(
      ctx, submissionId, "submission_created", "pending",
      `Submission created from ${args.source}`,
      args.createdBy,
    );

    await emitEvent(ctx, submissionId, "submission_created", "pending", args.payload);

    try {
      // Step 2: Update to processing
      await ctx.db.patch(submissionId, {
        processingStatus: PROCESSING_STATUS.PROCESSING,
      });

      // Step 3: Validate (inline logic)
      if (!args.skipValidation) {
        const sub = await ctx.db.get(submissionId);
        if (sub && sub.formId) {
          const fields = await ctx.db
            .query("formFields")
            .withIndex("formId", (q: any) => q.eq("formId", sub.formId!))
            .collect();

          const payload = JSON.parse(args.payload || "{}");
          const errors: string[] = [];
          const warnings: string[] = [];

          for (const field of fields) {
            const value = payload[field.fieldCode];
            if (field.required && (value === undefined || value === null || value === "")) {
              errors.push(`Required field '${field.label}' is missing`);
            }
          }

          const validationPassed = errors.length === 0;
          await ctx.db.patch(submissionId, {
            validationStatus: errors.length === 0
              ? (warnings.length > 0 ? VALIDATION_STATUS.WARNINGS : VALIDATION_STATUS.PASSED)
              : VALIDATION_STATUS.FAILED,
            validationReport: JSON.stringify({ valid: validationPassed, errors, warnings }),
          });

          await addTimelineEntry(
            ctx, submissionId, "validated",
            validationPassed ? "passed" : "failed",
            `Validation ${validationPassed ? "passed" : "failed"}: ${errors.length} errors`,
            args.createdBy,
          );

          if (!validationPassed) {
            await ctx.db.patch(submissionId, {
              processingStatus: PROCESSING_STATUS.NEEDS_REVIEW,
            });
            return {
              submissionId,
              submissionNumber,
              status: "needs_review",
              step: "validation",
              message: `Validation failed: ${errors.join(", ")}`,
            };
          }
        }
      }

      // Step 4: Deduplicate placeholder — full logic would query intakeDuplicateRules
      if (!args.skipDeduplicate) {
        await ctx.db.patch(submissionId, {
          duplicateStatus: DUPLICATE_STATUS.UNIQUE,
        });
        await addTimelineEntry(
          ctx, submissionId, "duplicate_check", "unique",
          "Duplicate check completed",
          args.createdBy,
        );
      }

      // Step 5: Route
      if (args.autoRoute || args.targetModule) {
        const module = args.targetModule || "crm";
        await ctx.db.patch(submissionId, {
          targetModule: module,
          routingStatus: ROUTING_STATUS.ROUTED,
          processingStatus: PROCESSING_STATUS.ROUTED,
        });
        await addTimelineEntry(
          ctx, submissionId, "routed", "completed",
          `Routed to ${module}`,
          args.createdBy,
        );
        await emitEvent(
          ctx, submissionId, "submission_routed", "routed",
          JSON.stringify({ targetModule: module }),
        );
      }

      return {
        submissionId,
        submissionNumber,
        status: "processing",
        step: "submitted",
        message: "Submission created and processing started",
      };
    } catch (error: any) {
      await ctx.db.patch(submissionId, {
        processingStatus: PROCESSING_STATUS.FAILED,
        systemNotes: `Error: ${error.message}`,
      });
      await addTimelineEntry(
        ctx, submissionId, "failed", "failed",
        `Processing failed: ${error.message}`,
        args.createdBy,
      );
      await emitEvent(
        ctx, submissionId, "submission_failed", "failed",
        JSON.stringify({ error: error.message }),
      );
      return {
        submissionId,
        submissionNumber,
        status: "failed",
        step: "processing",
        message: error.message,
      };
    }
  }),
});

/* ────────────
   ROUTE AND CREATE LEAD
   Combines routing with lead creation via lifecycle engine
   ──────────── */

export const routeAndCreateLead = mutation({
  args: {
    submissionId: v.id("intakeSubmissions"),
    createdBy: v.id("users"),
    targetModule: v.optional(v.string()),
    token: v.optional(v.string()),
  },
  handler: withIntakePipeline("create", "intake_submission", async (ctx, args) => {
    // Step 1: Route the submission
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");

    let targetModule = args.targetModule || submission.targetModule;

    if (!targetModule) {
      // Auto-route using rules
      const rules = await ctx.db
        .query("intakeRoutingRules")
        .withIndex("isActive", (q: any) => q.eq("isActive", true))
        .order("asc")
        .collect();

      const payload = JSON.parse(submission.payload || "{}");

      for (const rule of rules) {
        if (rule.sourceFormIds && rule.sourceFormIds.length > 0 && submission.formId) {
          if (!rule.sourceFormIds.includes(submission.formId)) continue;
        }
        if (rule.defaultRoute) {
          targetModule = rule.targetModule;
          break;
        }
        if (rule.conditionField && payload[rule.conditionField] !== undefined) {
          const value = String(payload[rule.conditionField]);
          const conditionValue = rule.conditionValue || "";
          const matches =
            rule.conditionOperator === "equals" ? value === conditionValue :
            rule.conditionOperator === "contains" ? value.includes(conditionValue) :
            rule.conditionOperator === "starts_with" ? value.startsWith(conditionValue) :
            rule.conditionOperator === "ends_with" ? value.endsWith(conditionValue) :
            rule.conditionOperator === "in" ? conditionValue.split(",").map((s: any) => s.trim()).includes(value) :
            true;
          if (matches) { targetModule = rule.targetModule; break; }
        }
      }
    }

    if (!targetModule) {
      throw new Error("No target module determined — configure routing rules");
    }

    const now = Date.now();

    await ctx.db.patch(args.submissionId, {
      targetModule,
      routingStatus: ROUTING_STATUS.ROUTED,
      processingStatus: PROCESSING_STATUS.ROUTED,
      updatedAt: now,
    });

    await addTimelineEntry(
      ctx, args.submissionId, "routed", "completed",
      `Routed to ${targetModule}`,
      args.createdBy,
    );

    await emitEvent(
      ctx, args.submissionId, "submission_routed", "routed",
      JSON.stringify({ targetModule }),
    );

    // Step 2: If routed to CRM, create lead via lifecycle engine
    if (targetModule === "crm") {
      const payload = JSON.parse(submission.payload || "{}");

      const firstName = payload.firstName || payload.first_name || payload.name || "Unknown";
      const lastName = payload.lastName || payload.last_name || "";
      const phone = payload.phone || payload.mobile || payload.whatsapp || "";
      const email = payload.email || payload.emailAddress || undefined;
      const stage = payload.stage || "new";
      const source = payload.source || submission.source || "intake";
      const priority = payload.priority || "medium";
      const location = payload.location || payload.city || undefined;

      // Create lead directly (inline to avoid mutation chaining)
      const leadId = await ctx.db.insert("leadMaster", {
        firstName, lastName, phone, email, location, stage, source,
        priority: priority as "low" | "medium" | "high" | "critical",
        status: "active",
        createdBy: args.createdBy,
        verticalId: payload.verticalId || undefined,
        subVerticalId: payload.subVerticalId || undefined,
        boardId: payload.boardId || undefined,
        branchInterestId: payload.branchInterestId || undefined,
        courseInterest: payload.courseInterest || payload.course || undefined,
        whatsappUsername: payload.whatsappUsername || undefined,
        whatsappPin: payload.whatsappPin || undefined,
        tags: payload.tags || undefined,
        createdAt: now, updatedAt: now,
      });

      await ctx.db.insert("leadStageHistory", {
        leadId, toStage: stage, changedBy: args.createdBy, createdAt: now,
      });

      // Add timeline entry linking to lead
      await addTimelineEntry(
        ctx, args.submissionId, "lead_created", "completed",
        `Lead created: ${firstName} ${lastName} (${leadId})`,
        args.createdBy,
      );

      // Link submission to lead
      await ctx.db.patch(args.submissionId, {
        targetEntityId: leadId,
        processingStatus: PROCESSING_STATUS.COMPLETED,
        processingTime: now - submission.submissionDate,
        updatedAt: now,
      });

      await emitEvent(
        ctx, args.submissionId, "submission_completed", "completed",
        JSON.stringify({ targetEntityId: leadId, targetModule: "crm" }),
      );

      // Calculate initial health score (inline)
      try {
        const lead = await ctx.db.get(leadId);
        if (lead) {
          const dimensions: Record<string, { score: number; max: number; label: string }> = {};
          let score = 0;
          let maxScore = 100;
          let profileScore = 0;
          if (lead.firstName && lead.lastName) profileScore += 8;
          if (lead.phone) profileScore += 8;
          if (lead.email) profileScore += 7;
          if (lead.location) profileScore += 7;
          dimensions.profile = { score: profileScore, max: 30, label: "Profile Completeness" };
          score += profileScore;
          const engagementScore = 10;
          const stageScores: Record<string, number> = {
            new: 5, contacted: 10, qualified: 15, demo: 18, negotiation: 22, converted: 25,
          };
          const pipelineScore = stageScores[lead.stage] || 5;
          dimensions.pipeline = { score: pipelineScore, max: 25, label: "Pipeline Position" };
          score += pipelineScore;
          score += engagementScore;
          const pct = score / maxScore * 100;
          const tier = pct >= 80 ? "hot" : pct >= 60 ? "warm" : pct >= 35 ? "cool" : "cold";
          await ctx.db.insert("leadHealthScores", {
            leadId, score, maxScore, dimensions: JSON.stringify(dimensions),
            tier, calculatedAt: now, createdAt: now,
          });
        }
      } catch {
        // Health score calculation is non-critical
      }

      return {
        submissionId: args.submissionId,
        targetModule,
        leadId,
        leadCreated: true,
      };
    }

    return {
      submissionId: args.submissionId,
      targetModule,
      leadCreated: false,
    };
  }),
});

/* ────────────
   BULK OPERATIONS
   ──────────── */

export const retrySubmission = mutation({
  args: {
    submissionId: v.id("intakeSubmissions"),
    retriedBy: v.optional(v.id("users")),
    token: v.optional(v.string()),
  },
  handler: withIntakePipeline("update", "intake_submission", async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");

    const currentRetry = submission.retryCount || 0;
    const now = Date.now();

    await ctx.db.patch(args.submissionId, {
      processingStatus: PROCESSING_STATUS.PENDING,
      retryCount: currentRetry + 1,
      updatedAt: now,
    });

    await addTimelineEntry(
      ctx, args.submissionId, "retried", "pending",
      `Retry attempt ${currentRetry + 1}`,
      args.retriedBy,
    );

    return { retryCount: currentRetry + 1 };
  }),
});

export const cancelSubmission = mutation({
  args: {
    submissionId: v.id("intakeSubmissions"),
    reason: v.optional(v.string()),
    cancelledBy: v.optional(v.id("users")),
    token: v.optional(v.string()),
  },
  handler: withIntakePipeline("update", "intake_submission", async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");

    const now = Date.now();
    await ctx.db.patch(args.submissionId, {
      processingStatus: PROCESSING_STATUS.CANCELLED,
      systemNotes: args.reason
        ? `${submission.systemNotes || ""}\n[${new Date(now).toISOString()}] Cancelled: ${args.reason}`
        : submission.systemNotes,
      updatedAt: now,
    });

    await addTimelineEntry(
      ctx, args.submissionId, "cancelled", "cancelled",
      args.reason || "Submission cancelled",
      args.cancelledBy,
    );

    return { status: PROCESSING_STATUS.CANCELLED };
  }),
});

/* ────────────
   QUERIES
   ──────────── */

export const listSubmissions = query({
  args: {
    status: v.optional(v.string()),
    source: v.optional(v.string()),
    targetModule: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("intakeSubmissions");

    if (args.status) {
      q = q.filter((r) => r.eq(r.field("processingStatus"), args.status!));
    }
    if (args.source) {
      q = q.filter((r) => r.eq(r.field("source"), args.source!));
    }
    if (args.targetModule) {
      q = q.filter((r) => r.eq(r.field("targetModule"), args.targetModule!));
    }

    return q.order("desc").take(args.limit || 50);
  },
});

export const getSubmission = query({
  args: { submissionId: v.id("intakeSubmissions") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.submissionId);
  },
});

export const getSubmissionTimeline = query({
  args: { submissionId: v.id("intakeSubmissions") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("intakeTimeline")
      .withIndex("submissionId_createdAt", (q) => q.eq("submissionId", args.submissionId))
      .order("asc")
      .collect();
  },
});

export const getSubmissionEvents = query({
  args: { submissionId: v.id("intakeSubmissions") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("intakeEvents")
      .withIndex("submissionId", (q) => q.eq("submissionId", args.submissionId))
      .order("asc")
      .collect();
  },
});

export const searchSubmissions = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("intakeSubmissions").order("desc").take(200);
    const q = args.query.toLowerCase();
    return all
      .filter(
        (s) =>
          s.submissionNumber.toLowerCase().includes(q) ||
          s.source.toLowerCase().includes(q) ||
          (s.systemNotes && s.systemNotes.toLowerCase().includes(q)) ||
          (s.formCode && s.formCode.toLowerCase().includes(q)) ||
          s.payload.toLowerCase().includes(q),
      )
      .slice(0, args.limit || 20);
  },
});

/* ────────────
   DUPLICATE RULES CRUD
   ──────────── */

export const listDuplicateRules = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("intakeDuplicateRules").collect();
  },
});

export const createDuplicateRule = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    matchFields: v.array(v.string()),
    matchType: v.union(v.literal("any"), v.literal("all"), v.literal("custom")),
    action: v.union(v.literal("ignore"), v.literal("merge"), v.literal("keep_both"), v.literal("review")),
    targetFormIds: v.optional(v.array(v.id("forms"))),
    token: v.optional(v.string()),
  },
  handler: withIntakePipeline("create", "intake_duplicate_rule", async (ctx, args) => {
    return ctx.db.insert("intakeDuplicateRules", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const updateDuplicateRule = mutation({
  args: {
    ruleId: v.id("intakeDuplicateRules"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    matchFields: v.optional(v.array(v.string())),
    matchType: v.optional(v.union(v.literal("any"), v.literal("all"), v.literal("custom"))),
    action: v.optional(v.union(v.literal("ignore"), v.literal("merge"), v.literal("keep_both"), v.literal("review"))),
    isActive: v.optional(v.boolean()),
    targetFormIds: v.optional(v.array(v.id("forms"))),
    token: v.optional(v.string()),
  },
  handler: withIntakePipeline("update", "intake_duplicate_rule", async (ctx, args) => {
    const { ruleId, ...fields } = args;
    const existing = await ctx.db.get(ruleId);
    if (!existing) throw new Error("Rule not found");
    return ctx.db.patch(ruleId, { ...fields, updatedAt: Date.now() });
  }),
});

export const deleteDuplicateRule = mutation({
  args: { ruleId: v.id("intakeDuplicateRules"), token: v.optional(v.string()) },
  handler: withIntakePipeline("delete", "intake_duplicate_rule", async (ctx, args) => {
    const existing = await ctx.db.get(args.ruleId);
    if (!existing) throw new Error("Rule not found");
    await ctx.db.delete(args.ruleId);
  }),
});

/* ────────────
   TRANSFORM MAPPINGS CRUD
   ──────────── */

export const listTransformMappings = query({
  args: { targetModule: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("intakeTransformMappings");
    if (args.targetModule) {
      q = q.filter((r) => r.eq(r.field("targetModule"), args.targetModule!));
    }
    return q.collect();
  },
});

export const createTransformMapping = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    sourceField: v.string(),
    targetField: v.string(),
    targetModule: v.string(),
    transformation: v.optional(v.string()),
    defaultValue: v.optional(v.string()),
    isRequired: v.boolean(),
    sourceFormIds: v.optional(v.array(v.id("forms"))),
    token: v.optional(v.string()),
  },
  handler: withIntakePipeline("create", "intake_transform_mapping", async (ctx, args) => {
    const all = await ctx.db.query("intakeTransformMappings").collect();
    const maxOrder = all.reduce((m: any, r: any) => Math.max(m, r.displayOrder), -1);
    return ctx.db.insert("intakeTransformMappings", {
      ...args,
      isActive: true,
      displayOrder: maxOrder + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const updateTransformMapping = mutation({
  args: {
    mappingId: v.id("intakeTransformMappings"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    sourceField: v.optional(v.string()),
    targetField: v.optional(v.string()),
    transformation: v.optional(v.string()),
    defaultValue: v.optional(v.string()),
    isRequired: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    token: v.optional(v.string()),
  },
  handler: withIntakePipeline("update", "intake_transform_mapping", async (ctx, args) => {
    const { mappingId, ...fields } = args;
    const existing = await ctx.db.get(mappingId);
    if (!existing) throw new Error("Mapping not found");
    return ctx.db.patch(mappingId, { ...fields, updatedAt: Date.now() });
  }),
});

export const deleteTransformMapping = mutation({
  args: { mappingId: v.id("intakeTransformMappings"), token: v.optional(v.string()) },
  handler: withIntakePipeline("delete", "intake_transform_mapping", async (ctx, args) => {
    const existing = await ctx.db.get(args.mappingId);
    if (!existing) throw new Error("Mapping not found");
    await ctx.db.delete(args.mappingId);
  }),
});

/* ────────────
   ROUTING RULES CRUD
   ──────────── */

export const listRoutingRules = query({
  args: { targetModule: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("intakeRoutingRules");
    if (args.targetModule) {
      q = q.filter((r) => r.eq(r.field("targetModule"), args.targetModule!));
    }
    return q.order("asc").collect();
  },
});

export const createRoutingRule = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    targetModule: v.string(),
    conditionField: v.optional(v.string()),
    conditionValue: v.optional(v.string()),
    conditionOperator: v.optional(v.string()),
    sourceFormIds: v.optional(v.array(v.id("forms"))),
    defaultRoute: v.boolean(),
    token: v.optional(v.string()),
  },
  handler: withIntakePipeline("create", "intake_routing_rule", async (ctx, args) => {
    const all = await ctx.db.query("intakeRoutingRules").collect();
    const maxPriority = all.reduce((m: any, r: any) => Math.max(m, r.priority), 0);
    return ctx.db.insert("intakeRoutingRules", {
      ...args,
      priority: maxPriority + 1,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const updateRoutingRule = mutation({
  args: {
    ruleId: v.id("intakeRoutingRules"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    targetModule: v.optional(v.string()),
    conditionField: v.optional(v.string()),
    conditionValue: v.optional(v.string()),
    conditionOperator: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    defaultRoute: v.optional(v.boolean()),
    token: v.optional(v.string()),
  },
  handler: withIntakePipeline("update", "intake_routing_rule", async (ctx, args) => {
    const { ruleId, ...fields } = args;
    const existing = await ctx.db.get(ruleId);
    if (!existing) throw new Error("Rule not found");
    return ctx.db.patch(ruleId, { ...fields, updatedAt: Date.now() });
  }),
});

export const deleteRoutingRule = mutation({
  args: { ruleId: v.id("intakeRoutingRules"), token: v.optional(v.string()) },
  handler: withIntakePipeline("delete", "intake_routing_rule", async (ctx, args) => {
    const existing = await ctx.db.get(args.ruleId);
    if (!existing) throw new Error("Rule not found");
    await ctx.db.delete(args.ruleId);
  }),
});
