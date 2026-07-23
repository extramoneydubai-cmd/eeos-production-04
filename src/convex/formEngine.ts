import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  FORM_STATUS,
  SUBMISSION_STATUS,
  formStatusValidator,
  submissionStatusValidator,
  fieldTypeValidator,
} from "./schema";

/* ────────────
   HELPERS
   ──────────── */

function generateFormCode(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 20);
}

function generatePublicUrl(code: string): string {
  return `/f/${code.toLowerCase()}`;
}

/* ────────────
   FORMS CRUD
   ──────────── */

export const listForms = query({
  args: {
    category: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("forms");
    if (args.status) {
      q = q.filter((r) => r.eq(r.field("status"), args.status!));
    }
    if (args.category) {
      q = q.filter((r) => r.eq(r.field("category"), args.category!));
    }
    return q.order("desc").collect();
  },
});

export const getForm = query({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.formId);
  },
});

export const getFormByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const forms = await ctx.db
      .query("forms")
      .withIndex("code", (q) => q.eq("code", args.code))
      .collect();
    return forms[0] || null;
  },
});

export const createForm = mutation({
  args: {
    name: v.string(),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const code = args.code || generateFormCode(args.name);
    const now = Date.now();
    const formId = await ctx.db.insert("forms", {
      name: args.name,
      code,
      description: args.description,
      category: args.category,
      status: FORM_STATUS.DRAFT,
      version: 0,
      ownerId: args.ownerId,
      createdBy: args.ownerId,
      isPublic: false,
      requiresAuth: true,
      allowAnonymous: false,
      enableQr: false,
      publicUrl: generatePublicUrl(code),
      autoSaveDraft: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });

    // Create initial version (v0 draft)
    await ctx.db.insert("formVersions", {
      formId,
      version: 0,
      status: "draft",
      schemaData: "[]",
      createdAt: now,
    });

    return formId;
  },
});

export const updateForm = mutation({
  args: {
    formId: v.id("forms"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    requiresAuth: v.optional(v.boolean()),
    allowAnonymous: v.optional(v.boolean()),
    enableQr: v.optional(v.boolean()),
    expiryDate: v.optional(v.number()),
    submissionLimit: v.optional(v.number()),
    autoSaveDraft: v.optional(v.boolean()),
    theme: v.optional(v.string()),
    successMessage: v.optional(v.string()),
    redirectUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { formId, ...fields } = args;
    const existing = await ctx.db.get(formId);
    if (!existing) throw new Error("Form not found");
    return ctx.db.patch(formId, { ...fields, updatedAt: Date.now() });
  },
});

export const publishForm = mutation({
  args: { formId: v.id("forms"), publishedBy: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const form = await ctx.db.get(args.formId);
    if (!form) throw new Error("Form not found");

    const newVersion = form.version + 1;

    // Collect all current fields
    const fields = await ctx.db
      .query("formFields")
      .withIndex("formId", (q) => q.eq("formId", args.formId))
      .collect();

    const schemaData = JSON.stringify(
      fields.map((f) => ({
        fieldCode: f.fieldCode,
        fieldType: f.fieldType,
        label: f.label,
        placeholder: f.placeholder,
        description: f.description,
        required: f.required,
        unique: f.unique,
        readOnly: f.readOnly,
        hidden: f.hidden,
        defaultValue: f.defaultValue,
        validationRegex: f.validationRegex,
        minValue: f.minValue,
        maxValue: f.maxValue,
        options: f.options,
        displayOrder: f.displayOrder,
        sectionId: f.sectionId,
      }))
    );

    const now = Date.now();

    // Create new version
    await ctx.db.insert("formVersions", {
      formId: args.formId,
      version: newVersion,
      status: "published",
      schemaData,
      publishedAt: now,
      publishedBy: args.publishedBy,
      createdAt: now,
    });

    // Update form
    await ctx.db.patch(args.formId, {
      status: FORM_STATUS.PUBLISHED,
      version: newVersion,
      updatedAt: now,
    });

    return { version: newVersion };
  },
});

export const archiveForm = mutation({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.formId);
    if (!existing) throw new Error("Form not found");
    return ctx.db.patch(args.formId, {
      status: FORM_STATUS.ARCHIVED,
      isArchived: true,
      updatedAt: Date.now(),
    });
  },
});

export const deactivateForm = mutation({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.formId);
    if (!existing) throw new Error("Form not found");
    return ctx.db.patch(args.formId, {
      status: FORM_STATUS.DEACTIVATED,
      updatedAt: Date.now(),
    });
  },
});

export const deleteForm = mutation({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.formId);
    if (!existing) throw new Error("Form not found");

    // Delete all related data
    const fields = await ctx.db
      .query("formFields")
      .withIndex("formId", (q) => q.eq("formId", args.formId))
      .collect();
    for (const f of fields) {
      await ctx.db.delete(f._id);
    }

    const versions = await ctx.db
      .query("formVersions")
      .withIndex("formId", (q) => q.eq("formId", args.formId))
      .collect();
    for (const v of versions) {
      await ctx.db.delete(v._id);
    }

    const submissions = await ctx.db
      .query("formSubmissions")
      .withIndex("formId", (q) => q.eq("formId", args.formId))
      .collect();
    for (const s of submissions) {
      await ctx.db.delete(s._id);
    }

    await ctx.db.delete(args.formId);
  },
});

export const duplicateForm = mutation({
  args: { formId: v.id("forms"), ownerId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.formId);
    if (!source) throw new Error("Form not found");

    const now = Date.now();
    const newId = await ctx.db.insert("forms", {
      ...source,
      name: `${source.name} (Copy)`,
      code: `${source.code}_COPY`,
      status: FORM_STATUS.DRAFT,
      version: 0,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });

    // Duplicate fields
    const fields = await ctx.db
      .query("formFields")
      .withIndex("formId", (q) => q.eq("formId", args.formId))
      .collect();
    for (const f of fields) {
      await ctx.db.insert("formFields", {
        ...f,
        formId: newId,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Create initial draft version
    await ctx.db.insert("formVersions", {
      formId: newId,
      version: 0,
      status: "draft",
      schemaData: "[]",
      createdAt: now,
    });

    return newId;
  },
});

/* ────────────
   FORM FIELDS CRUD
   ──────────── */

export const listFormFields = query({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("formFields")
      .withIndex("formId", (q) => q.eq("formId", args.formId))
      .order("asc")
      .collect();
  },
});

export const createFormField = mutation({
  args: {
    formId: v.id("forms"),
    fieldCode: v.string(),
    fieldType: fieldTypeValidator,
    label: v.string(),
    placeholder: v.optional(v.string()),
    description: v.optional(v.string()),
    required: v.optional(v.boolean()),
    unique: v.optional(v.boolean()),
    readOnly: v.optional(v.boolean()),
    hidden: v.optional(v.boolean()),
    defaultValue: v.optional(v.string()),
    validationRegex: v.optional(v.string()),
    minValue: v.optional(v.number()),
    maxValue: v.optional(v.number()),
    options: v.optional(v.array(v.string())),
    conditionalVisibility: v.optional(v.string()),
    conditionalRequired: v.optional(v.string()),
    calculated: v.optional(v.string()),
    lookupSource: v.optional(v.string()),
    dependentField: v.optional(v.string()),
    width: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    sectionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { formId, ...fieldData } = args;

    // Get current form version
    const form = await ctx.db.get(formId);
    if (!form) throw new Error("Form not found");

    // Get max display order
    const existing = await ctx.db
      .query("formFields")
      .withIndex("formId", (q) => q.eq("formId", formId))
      .collect();
    const maxOrder = existing.reduce((m, f) => Math.max(m, f.displayOrder), -1);

    const now = Date.now();
    return ctx.db.insert("formFields", {
      formId,
      version: form.version,
      fieldCode: fieldData.fieldCode,
      fieldType: fieldData.fieldType,
      label: fieldData.label,
      placeholder: fieldData.placeholder,
      description: fieldData.description,
      required: fieldData.required ?? false,
      unique: fieldData.unique ?? false,
      readOnly: fieldData.readOnly ?? false,
      hidden: fieldData.hidden ?? false,
      defaultValue: fieldData.defaultValue,
      validationRegex: fieldData.validationRegex,
      minValue: fieldData.minValue,
      maxValue: fieldData.maxValue,
      options: fieldData.options,
      conditionalVisibility: fieldData.conditionalVisibility,
      conditionalRequired: fieldData.conditionalRequired,
      calculated: fieldData.calculated,
      lookupSource: fieldData.lookupSource,
      dependentField: fieldData.dependentField,
      width: fieldData.width,
      displayOrder: fieldData.displayOrder ?? maxOrder + 1,
      sectionId: fieldData.sectionId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateFormField = mutation({
  args: {
    fieldId: v.id("formFields"),
    fieldCode: v.optional(v.string()),
    fieldType: v.optional(fieldTypeValidator),
    label: v.optional(v.string()),
    placeholder: v.optional(v.string()),
    description: v.optional(v.string()),
    required: v.optional(v.boolean()),
    unique: v.optional(v.boolean()),
    readOnly: v.optional(v.boolean()),
    hidden: v.optional(v.boolean()),
    defaultValue: v.optional(v.string()),
    validationRegex: v.optional(v.string()),
    minValue: v.optional(v.number()),
    maxValue: v.optional(v.number()),
    options: v.optional(v.array(v.string())),
    conditionalVisibility: v.optional(v.string()),
    conditionalRequired: v.optional(v.string()),
    calculated: v.optional(v.string()),
    lookupSource: v.optional(v.string()),
    dependentField: v.optional(v.string()),
    width: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    sectionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { fieldId, ...fields } = args;
    const existing = await ctx.db.get(fieldId);
    if (!existing) throw new Error("Field not found");
    return ctx.db.patch(fieldId, { ...fields, updatedAt: Date.now() });
  },
});

export const deleteFormField = mutation({
  args: { fieldId: v.id("formFields") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.fieldId);
    if (!existing) throw new Error("Field not found");
    await ctx.db.delete(args.fieldId);
  },
});

export const reorderFormFields = mutation({
  args: { orderedFieldIds: v.array(v.id("formFields")) },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.orderedFieldIds.length; i++) {
      await ctx.db.patch(args.orderedFieldIds[i], {
        displayOrder: i,
        updatedAt: Date.now(),
      });
    }
  },
});

/* ────────────
   FORM VERSIONS
   ──────────── */

export const listFormVersions = query({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("formVersions")
      .withIndex("formId", (q) => q.eq("formId", args.formId))
      .order("desc")
      .collect();
  },
});

export const getFormVersion = query({
  args: { formId: v.id("forms"), version: v.number() },
  handler: async (ctx, args) => {
    const versions = await ctx.db
      .query("formVersions")
      .withIndex("formId_version", (q) =>
        q.eq("formId", args.formId).eq("version", args.version)
      )
      .collect();
    return versions[0] || null;
  },
});

/* ────────────
   FORM SUBMISSIONS
   ──────────── */

export const listSubmissions = query({
  args: {
    formId: v.id("forms"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("formSubmissions")
      .withIndex("formId", (q) => q.eq("formId", args.formId));
    if (args.status) {
      q = q.filter((r) => r.eq(r.field("status"), args.status!));
    }
    return q.order("desc").collect();
  },
});

export const getSubmission = query({
  args: { submissionId: v.id("formSubmissions") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.submissionId);
  },
});

export const createSubmission = mutation({
  args: {
    formId: v.id("forms"),
    payload: v.string(),
    submittedBy: v.optional(v.id("users")),
    source: v.optional(v.string()),
    device: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    browser: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const form = await ctx.db.get(args.formId);
    if (!form) throw new Error("Form not found");
    if (form.status !== FORM_STATUS.PUBLISHED && form.status !== FORM_STATUS.DRAFT) {
      throw new Error("Form is not accepting submissions");
    }

    const now = Date.now();
    return ctx.db.insert("formSubmissions", {
      formId: args.formId,
      formVersion: form.version,
      payload: args.payload,
      status: SUBMISSION_STATUS.SUBMITTED,
      submittedBy: args.submittedBy,
      source: args.source,
      device: args.device,
      ipAddress: args.ipAddress,
      browser: args.browser,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateSubmissionStatus = mutation({
  args: {
    submissionId: v.id("formSubmissions"),
    status: submissionStatusValidator,
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.submissionId);
    if (!existing) throw new Error("Submission not found");
    return ctx.db.patch(args.submissionId, {
      status: args.status,
      notes: args.notes,
      updatedAt: Date.now(),
    });
  },
});

export const deleteSubmission = mutation({
  args: { submissionId: v.id("formSubmissions") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.submissionId);
    if (!existing) throw new Error("Submission not found");
    await ctx.db.delete(args.submissionId);
  },
});

/* ────────────
   DASHBOARD STATS
   ──────────── */

export const getFormStats = query({
  args: {},
  handler: async (ctx) => {
    const allForms = await ctx.db.query("forms").collect();
    const total = allForms.length;
    const draft = allForms.filter((f) => f.status === FORM_STATUS.DRAFT).length;
    const published = allForms.filter((f) => f.status === FORM_STATUS.PUBLISHED).length;
    const archived = allForms.filter((f) => f.status === FORM_STATUS.ARCHIVED).length;
    const deactivated = allForms.filter((f) => f.status === FORM_STATUS.DEACTIVATED).length;

    // Submission counts
    const allSubmissions = await ctx.db.query("formSubmissions").collect();
    const totalSubmissions = allSubmissions.length;
    const recentSubmissions = allSubmissions
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);

    // Categories
    const categories = [...new Set(allForms.map((f) => f.category).filter(Boolean))];

    return {
      total,
      draft,
      published,
      archived,
      deactivated,
      totalSubmissions,
      recentSubmissions,
      categories,
    };
  },
});

export const getFormSubmissionCounts = query({
  args: { formId: v.id("forms") },
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("formSubmissions")
      .withIndex("formId", (q) => q.eq("formId", args.formId))
      .collect();

    return {
      total: submissions.length,
      draft: submissions.filter((s) => s.status === SUBMISSION_STATUS.DRAFT).length,
      submitted: submissions.filter((s) => s.status === SUBMISSION_STATUS.SUBMITTED).length,
      completed: submissions.filter((s) => s.status === SUBMISSION_STATUS.COMPLETED).length,
      rejected: submissions.filter((s) => s.status === SUBMISSION_STATUS.REJECTED).length,
    };
  },
});
