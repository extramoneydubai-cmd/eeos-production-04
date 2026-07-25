/**
 * Calendar SDK — Enterprise Calendar Service
 *
 * Every business module MUST use this SDK for calendar/event operations.
 *
 * Usage:
 *   import { calendarSdk } from "@/platform/sdk/calendarSdk";
 *   const eventId = await calendarSdk.createEvent(ctx, { title, startTime, ... });
 */

import { v } from "convex/values";
import { mutation, query } from "../convex/_generated/server";
import { Id } from "../convex/_generated/dataModel";

// ─── SDK Methods ─────────────────────────────────────────────────────────

/**
 * Create a calendar event.
 */
export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    eventType: v.string(),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    allDay: v.optional(v.boolean()),
    location: v.optional(v.string()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
    assignedTo: v.optional(v.id("users")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("calendarEvents", {
      title: args.title,
      description: args.description,
      eventType: args.eventType,
      startTime: args.startTime,
      endTime: args.endTime,
      allDay: args.allDay || false,
      location: args.location,
      entityType: args.entityType,
      entityId: args.entityId,
      ownerId: args.ownerId || args.createdBy,
      assignedTo: args.assignedTo,
      companyId: args.companyId,
      branchId: args.branchId,
      status: "scheduled",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Get events for a date range.
 */
export const getEventsInRange = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
    userId: v.optional(v.id("users")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("calendarEvents").collect();

    let filtered = all.filter((e) =>
      e.startTime >= args.startTime && e.startTime <= args.endTime
    );

    if (args.userId) {
      filtered = filtered.filter(
        (e) => e.ownerId === args.userId || e.assignedTo === args.userId
      );
    }
    if (args.companyId) filtered = filtered.filter((e) => e.companyId === args.companyId);
    if (args.branchId) filtered = filtered.filter((e) => e.branchId === args.branchId);

    return filtered.sort((a, b) => a.startTime - b.startTime).slice(0, args.limit || 100);
  },
});

/**
 * Get events for an entity.
 */
export const getEntityEvents = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("calendarEvents")
      .withIndex("entityType_entityId", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .collect();

    return events.sort((a, b) => a.startTime - b.startTime).slice(0, args.limit || 50);
  },
});

/**
 * Update a calendar event.
 */
export const updateEvent = mutation({
  args: {
    eventId: v.id("calendarEvents"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    allDay: v.optional(v.boolean()),
    location: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { eventId, ...fields } = args;
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(eventId, updates);
    return { success: true };
  },
});

/**
 * Delete a calendar event.
 */
export const removeEvent = mutation({
  args: { eventId: v.id("calendarEvents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.eventId);
    return { success: true };
  },
});

/**
 * Get upcoming events for a user (today + next 7 days).
 */
export const getUpcoming = query({
  args: {
    userId: v.id("users"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const end = now + (args.days || 7) * 24 * 60 * 60 * 1000;

    const all = await ctx.db.query("calendarEvents").collect();
    return all
      .filter(
        (e) =>
          e.startTime >= now &&
          e.startTime <= end &&
          (e.ownerId === args.userId || e.assignedTo === args.userId)
      )
      .sort((a, b) => a.startTime - b.startTime)
      .slice(0, 20);
  },
});

/**
 * Get today's events for a user.
 */
export const getTodayEvents = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = startOfDay.getTime() + 24 * 60 * 60 * 1000;

    const all = await ctx.db.query("calendarEvents").collect();
    return all
      .filter(
        (e) =>
          e.startTime >= startOfDay.getTime() &&
          e.startTime < endOfDay &&
          (e.ownerId === args.userId || e.assignedTo === args.userId)
      )
      .sort((a, b) => a.startTime - b.startTime);
  },
});
