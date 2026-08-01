/**
 * Calendar SDK — calendarEvents CRUD + range/entity queries.
 *
 * Resolves the phantom `api.calendarSdk.*` references used by CalendarPage
 * and the entity workspace calendar tabs. Backed by the existing
 * `calendarEvents` table (schema/calendar.ts).
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/** Events with start time within [startTime, endTime]. */
export const getEventsInRange = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db.query("calendarEvents").collect();
    return events
      .filter(
        (e: any) =>
          e.startTime >= args.startTime &&
          (e.endTime ?? e.startTime) <= args.endTime &&
          e.status !== "cancelled",
      )
      .sort((a: any, b: any) => a.startTime - b.startTime)
      .slice(0, args.limit ?? 500);
  },
});

/** Events bound to an entity (employee/student workspace calendars). */
export const getEntityEvents = query({
  args: { entityType: v.string(), entityId: v.string() },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("calendarEvents")
      .withIndex("entityType_entityId", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId),
      )
      .collect();
    return events
      .filter((e: any) => e.status !== "cancelled")
      .sort((a: any, b: any) => a.startTime - b.startTime);
  },
});

/** Create a calendar event. Returns the new event id. */
export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    eventType: v.string(),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    allDay: v.boolean(),
    location: v.optional(v.string()),
    color: v.optional(v.string()),
    status: v.optional(v.string()),
    reminderMinutes: v.optional(v.number()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const now = Date.now();
    return await ctx.db.insert("calendarEvents", {
      title: args.title,
      description: args.description,
      eventType: args.eventType,
      startTime: args.startTime,
      endTime: args.endTime,
      allDay: args.allDay,
      location: args.location,
      color: args.color,
      status: args.status ?? "scheduled",
      reminderMinutes: args.reminderMinutes,
      entityType: args.entityType,
      entityId: args.entityId,
      ownerId: args.ownerId ?? userId ?? undefined,
      companyId: args.companyId,
      branchId: args.branchId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Update an existing calendar event. */
export const updateEvent = mutation({
  args: {
    eventId: v.id("calendarEvents"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    eventType: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    allDay: v.optional(v.boolean()),
    location: v.optional(v.string()),
    color: v.optional(v.string()),
    status: v.optional(v.string()),
    reminderMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { eventId, ...fields } = args;
    const event = await ctx.db.get(eventId);
    if (!event) throw new Error("Event not found");
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) updates[k] = v;
    }
    await ctx.db.patch(eventId, updates);
    return eventId;
  },
});

/** Delete a calendar event. */
export const removeEvent = mutation({
  args: { eventId: v.id("calendarEvents") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");
    await ctx.db.delete(args.eventId);
    return args.eventId;
  },
});
