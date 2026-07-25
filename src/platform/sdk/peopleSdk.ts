/**
 * People SDK — Global People Registry Service
 *
 * Every business module MUST use this SDK to access person data.
 * No module may directly query the "people" table.
 *
 * Usage:
 *   import { peopleSdk } from "@/platform/sdk/peopleSdk";
 *   const person = await peopleSdk.get(ctx, { personId });
 */

import { v } from "convex/values";
import { mutation, query } from "../convex/_generated/server";
import { Id } from "../convex/_generated/dataModel";

// ─── SDK Methods ─────────────────────────────────────────────────────────

/**
 * Get a person by ID.
 */
export const get = query({
  args: { personId: v.id("people") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.personId);
  },
});

/**
 * Search people by name, email, or phone.
 */
export const search = query({
  args: {
    searchText: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const searchLower = args.searchText.toLowerCase();
    const all = await ctx.db.query("people").collect();

    return all
      .filter((p) => {
        const fullName = `${p.firstName || ""} ${p.lastName || ""}`.toLowerCase();
        return (
          fullName.includes(searchLower) ||
          (p.email && p.email.toLowerCase().includes(searchLower)) ||
          (p.phone && p.phone.includes(searchLower))
        );
      })
      .slice(0, args.limit || 20);
  },
});

/**
 * Create a person record.
 */
export const create = mutation({
  args: {
    firstName: v.string(),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()),
    gender: v.optional(v.string()),
    nationality: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    profilePhoto: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("people", {
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      phone: args.phone,
      dateOfBirth: args.dateOfBirth,
      gender: args.gender,
      nationality: args.nationality,
      address: args.address,
      city: args.city,
      state: args.state,
      country: args.country,
      postalCode: args.postalCode,
      profilePhoto: args.profilePhoto,
      companyId: args.companyId,
      branchId: args.branchId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update a person record.
 */
export const update = mutation({
  args: {
    personId: v.id("people"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()),
    gender: v.optional(v.string()),
    nationality: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    profilePhoto: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { personId, ...fields } = args;
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(personId, updates);
    return { success: true };
  },
});

/**
 * List people with optional filters.
 */
export const list = query({
  args: {
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    isActive: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let all = await ctx.db.query("people").collect();

    if (args.companyId) all = all.filter((p) => p.companyId === args.companyId);
    if (args.branchId) all = all.filter((p) => p.branchId === args.branchId);
    if (args.isActive !== undefined) all = all.filter((p) => p.isActive === args.isActive);

    return all.slice(0, args.limit || 100);
  },
});

/**
 * Get people by IDs (batch).
 */
export const getBatch = query({
  args: { personIds: v.array(v.id("people")) },
  handler: async (ctx, args) => {
    const result: Record<string, unknown> = {};
    for (const id of args.personIds) {
      const person = await ctx.db.get(id);
      if (person) result[id] = person;
    }
    return result;
  },
});

/**
 * Get the full display name for a person.
 */
export const getDisplayName = query({
  args: { personId: v.id("people") },
  handler: async (ctx, args) => {
    const person = await ctx.db.get(args.personId);
    if (!person) return "Unknown";
    return [person.firstName, person.lastName].filter(Boolean).join(" ");
  },
});

/**
 * Get person stats (counts by category).
 */
export const getStats = query({
  args: {
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    let all = await ctx.db.query("people").collect();
    if (args.companyId) all = all.filter((p) => p.companyId === args.companyId);
    if (args.branchId) all = all.filter((p) => p.branchId === args.branchId);

    return {
      total: all.length,
      active: all.filter((p) => p.isActive).length,
    };
  },
});
