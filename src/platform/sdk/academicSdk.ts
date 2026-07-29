/**
 * Academic SDK — Enterprise Academic Data Layer
 *
 * Every business module MUST use this SDK to access academic data.
 * No module may directly query academicPrograms, academicBatches, etc.
 *
 * Usage:
 *   import { academicSdk } from "@/platform/sdk/academicSdk";
 *   const programs = await academicSdk.listPrograms(ctx, { ...filters });
 */

import { v } from "convex/values";
import { mutation, query } from "../../convex/_generated/server";
import { Id } from "../../convex/_generated/dataModel";

// ─── SDK Queries — Programs ──────────────────────────────────────────────

/**
 * List academic programs.
 */
export const listPrograms = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { listAcademicPrograms } = await import("../../convex/academicPrograms");
    return listAcademicPrograms.handler(ctx, args);
  },
});

/**
 * Get a single academic program.
 */
export const getProgram = query({
  args: { programId: v.id("academicPrograms") },
  handler: async (ctx, args) => {
    const { getAcademicProgram } = await import("../../convex/academicPrograms");
    return getAcademicProgram.handler(ctx, args);
  },
});

// ─── SDK Queries — Batches ───────────────────────────────────────────────

/**
 * List academic batches.
 */
export const listBatches = query({
  args: {
    programId: v.optional(v.id("academicPrograms")),
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    isActive: v.optional(v.boolean()),
    sessionId: v.optional(v.id("academicSessions")),
  },
  handler: async (ctx, args) => {
    const { listAcademicBatches } = await import("../../convex/academicBatches");
    return listAcademicBatches.handler(ctx, args);
  },
});

/**
 * Get a single academic batch.
 */
export const getBatch = query({
  args: { batchId: v.id("academicBatches") },
  handler: async (ctx, args) => {
    const { getAcademicBatch } = await import("../../convex/academicBatches");
    return getAcademicBatch.handler(ctx, args);
  },
});

// ─── SDK Queries — Sections ──────────────────────────────────────────────

/**
 * List academic sections.
 */
export const listSections = query({
  args: {
    batchId: v.optional(v.id("academicBatches")),
    branchId: v.optional(v.id("branches")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { listAcademicSections } = await import("../../convex/academicSections");
    return listAcademicSections.handler(ctx, args);
  },
});

/**
 * Get a single academic section.
 */
export const getSection = query({
  args: { sectionId: v.id("academicSections") },
  handler: async (ctx, args) => {
    const { getAcademicSection } = await import("../../convex/academicSections");
    return getAcademicSection.handler(ctx, args);
  },
});

// ─── SDK Queries — Subjects ──────────────────────────────────────────────

/**
 * List academic subjects.
 */
export const listSubjects = query({
  args: {
    programId: v.optional(v.id("academicPrograms")),
    batchId: v.optional(v.id("academicBatches")),
    branchId: v.optional(v.id("branches")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { listAcademicSubjects } = await import("../../convex/academicSubjects");
    return listAcademicSubjects.handler(ctx, args);
  },
});

// ─── SDK Queries — Classrooms ────────────────────────────────────────────

/**
 * List academic classrooms.
 */
export const listClassrooms = query({
  args: {
    branchId: v.optional(v.id("branches")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { list } = await import("../../convex/academicClassrooms");
    return list.handler(ctx, args);
  },
});

/**
 * Get a single classroom.
 */
export const getClassroom = query({
  args: { classroomId: v.id("academicClassrooms") },
  handler: async (ctx, args) => {
    const { get } = await import("../../convex/academicClassrooms");
    return get.handler(ctx, args);
  },
});

// ─── SDK Queries — Sessions ──────────────────────────────────────────────

/**
 * List academic sessions.
 */
export const listSessions = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { listAcademicSessions } = await import("../../convex/academicSessions");
    return listAcademicSessions.handler(ctx, args);
  },
});

// ─── SDK Queries — Courses (CRM/LMS) ─────────────────────────────────────

/**
 * List courses (from crmCourses).
 */
export const listCourses = query({
  args: {
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { listCourses } = await import("../../convex/crmCourses");
    return listCourses.handler(ctx, args);
  },
});

// ─── SDK Mutations — Programs ────────────────────────────────────────────

/**
 * Create an academic program.
 */
export const createProgram = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    duration: v.optional(v.number()),
    durationUnit: v.optional(v.string()),
    programType: v.optional(v.string()),
    deliveryMode: v.optional(v.string()),
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    isActive: v.optional(v.boolean()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { createAcademicProgram } = await import("../../convex/academicPrograms");
    return createAcademicProgram.handler(ctx, args as any);
  },
});

/**
 * Update an academic program.
 */
export const updateProgram = mutation({
  args: {
    programId: v.id("academicPrograms"),
    updates: v.object({
      name: v.optional(v.string()),
      code: v.optional(v.string()),
      description: v.optional(v.string()),
      duration: v.optional(v.number()),
      durationUnit: v.optional(v.string()),
      programType: v.optional(v.string()),
      deliveryMode: v.optional(v.string()),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const { updateAcademicProgram } = await import("../../convex/academicPrograms");
    return updateAcademicProgram.handler(ctx, args as any);
  },
});

/**
 * Delete an academic program.
 */
export const deleteProgram = mutation({
  args: { programId: v.id("academicPrograms") },
  handler: async (ctx, args) => {
    const { deleteAcademicProgram } = await import("../../convex/academicPrograms");
    return deleteAcademicProgram.handler(ctx, args);
  },
});

// ─── SDK Mutations — Batches ─────────────────────────────────────────────

/**
 * Create an academic batch.
 */
export const createBatch = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    programId: v.id("academicPrograms"),
    sessionId: v.optional(v.id("academicSessions")),
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    capacity: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { createAcademicBatch } = await import("../../convex/academicBatches");
    return createAcademicBatch.handler(ctx, args as any);
  },
});

/**
 * Update an academic batch.
 */
export const updateBatch = mutation({
  args: {
    batchId: v.id("academicBatches"),
    updates: v.object({
      name: v.optional(v.string()),
      code: v.optional(v.string()),
      startDate: v.optional(v.number()),
      endDate: v.optional(v.number()),
      capacity: v.optional(v.number()),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const { updateAcademicBatch } = await import("../../convex/academicBatches");
    return updateAcademicBatch.handler(ctx, args as any);
  },
});

/**
 * Delete an academic batch.
 */
export const deleteBatch = mutation({
  args: { batchId: v.id("academicBatches") },
  handler: async (ctx, args) => {
    const { deleteAcademicBatch } = await import("../../convex/academicBatches");
    return deleteAcademicBatch.handler(ctx, args);
  },
});
