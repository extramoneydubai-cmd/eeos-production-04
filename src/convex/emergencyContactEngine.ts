/**
 * Emergency Contact Engine — Enterprise Emergency Contact Management
 *
 * Manages emergency contacts linked to persons in the Global People Registry.
 * Each emergency contact links an owner person to a contact person with
 * relationship type, priority ordering, and notes.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── CRUD Operations ──────────────────────────────────────

export const addEmergencyContact = mutation({
  args: {
    ownerPersonId: v.id("personMaster"),
    contactPersonId: v.id("personMaster"),
    relationship: v.string(),
    priority: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (args.ownerPersonId === args.contactPersonId) {
      throw new Error("Cannot set self as emergency contact");
    }

    // Check for duplicate
    const existing = await ctx.db
      .query("emergencyContacts")
      .withIndex("ownerPersonId", (q: any) => q.eq("ownerPersonId", args.ownerPersonId))
      .filter((q: any) => q.eq(q.field("contactPersonId"), args.contactPersonId))
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .first();

    if (existing) {
      throw new Error("Emergency contact already exists for this person");
    }

    const now = Date.now();
    return await ctx.db.insert("emergencyContacts", {
      ownerPersonId: args.ownerPersonId,
      contactPersonId: args.contactPersonId,
      relationship: args.relationship,
      priority: args.priority,
      notes: args.notes,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateEmergencyContact = mutation({
  args: {
    emergencyContactId: v.id("emergencyContacts"),
    relationship: v.optional(v.string()),
    priority: v.optional(v.number()),
    notes: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { emergencyContactId, ...fields } = args;
    const existing = await ctx.db.get(emergencyContactId);
    if (!existing) throw new Error("Emergency contact not found");

    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }

    await ctx.db.patch(emergencyContactId, updates);
    return emergencyContactId;
  },
});

export const removeEmergencyContact = mutation({
  args: { emergencyContactId: v.id("emergencyContacts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.emergencyContactId);
    if (!existing) throw new Error("Emergency contact not found");

    // Soft delete by setting inactive
    await ctx.db.patch(args.emergencyContactId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return args.emergencyContactId;
  },
});

export const deleteEmergencyContact = mutation({
  args: { emergencyContactId: v.id("emergencyContacts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.delete(args.emergencyContactId);
    return args.emergencyContactId;
  },
});

// ─── Queries ────────────────────────────────────────────

export const listEmergencyContacts = query({
  args: {
    ownerPersonId: v.id("personMaster"),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("emergencyContacts")
      .withIndex("ownerPersonId", (q: any) => q.eq("ownerPersonId", args.ownerPersonId))
      .collect();

    let filtered = contacts;
    if (!args.includeInactive) {
      filtered = contacts.filter((c: any) => c.isActive);
    }

    // Enrich with contact person details
    const enriched = await Promise.all(
      filtered.map(async (ec: any) => {
        const contactPerson = await ctx.db.get(ec.contactPersonId);
        return {
          ...ec,
          contactPersonName: contactPerson
            ? (contactPerson as any).displayName || `${(contactPerson as any).firstName} ${(contactPerson as any).lastName}`
            : "Unknown",
          contactPersonPhoto: contactPerson ? (contactPerson as any).profilePhoto : undefined,
          contactPersonPhone: null as string | null,
          contactPersonEmail: null as string | null,
        };
      }),
    );

    // Fetch preferred contacts for enriched contact persons
    for (const item of enriched) {
      if (item.contactPersonId) {
        const preferredPhone = await ctx.db
          .query("contactMethods")
          .withIndex("personId_type", (q: any) =>
            q.eq("personId", item.contactPersonId).eq("type", "mobile")
          )
          .filter((q: any) => q.eq(q.field("preferred"), true))
          .first();
        if (preferredPhone) item.contactPersonPhone = preferredPhone.value;

        const preferredEmail = await ctx.db
          .query("contactMethods")
          .withIndex("personId_type", (q: any) =>
            q.eq("personId", item.contactPersonId).eq("type", "email")
          )
          .filter((q: any) => q.eq(q.field("preferred"), true))
          .first();
        if (preferredEmail) item.contactPersonEmail = preferredEmail.value;
      }
    }

    return enriched.sort((a: any, b: any) => a.priority - b.priority);
  },
});

export const getEmergencyContact = query({
  args: { emergencyContactId: v.id("emergencyContacts") },
  handler: async (ctx, args) => {
    const ec = await ctx.db.get(args.emergencyContactId);
    if (!ec) return null;

    const contactPerson = await ctx.db.get(ec.contactPersonId);
    const ownerPerson = await ctx.db.get(ec.ownerPersonId);

    return {
      ...ec,
      contactPersonName: contactPerson
        ? (contactPerson as any).displayName || `${(contactPerson as any).firstName} ${(contactPerson as any).lastName}`
        : "Unknown",
      ownerPersonName: ownerPerson
        ? (ownerPerson as any).displayName || `${(ownerPerson as any).firstName} ${(ownerPerson as any).lastName}`
        : "Unknown",
    };
  },
});

export const setEmergencyContactPriority = mutation({
  args: {
    emergencyContactId: v.id("emergencyContacts"),
    priority: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.emergencyContactId);
    if (!existing) throw new Error("Emergency contact not found");
    await ctx.db.patch(args.emergencyContactId, {
      priority: args.priority,
      updatedAt: Date.now(),
    });
    return args.emergencyContactId;
  },
});

export const getPersonEmergencyInfo = query({
  args: { personId: v.id("personMaster") },
  handler: async (ctx, args) => {
    const person = await ctx.db.get(args.personId);
    if (!person) return null;

    const contacts = await ctx.db
      .query("emergencyContacts")
      .withIndex("ownerPersonId", (q: any) => q.eq("ownerPersonId", args.personId))
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .collect();

    const enriched = await Promise.all(
      contacts.map(async (ec: any) => {
        const cp = await ctx.db.get(ec.contactPersonId);
        const phone = await ctx.db
          .query("contactMethods")
          .withIndex("personId_type", (q: any) =>
            q.eq("personId", ec.contactPersonId).eq("type", "mobile")
          )
          .filter((q: any) => q.eq(q.field("preferred"), true))
          .first();
        return {
          ...ec,
          name: cp ? (cp as any).displayName || `${(cp as any).firstName} ${(cp as any).lastName}` : "Unknown",
          phone: phone?.value || null,
        };
      }),
    );

    const bloodGroup = (person as any).bloodGroup || null;

    return {
      personId: args.personId,
      bloodGroup,
      emergencyContacts: enriched.sort((a: any, b: any) => a.priority - b.priority),
      contactCount: enriched.length,
    };
  },
});
