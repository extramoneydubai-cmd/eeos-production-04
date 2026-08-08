import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ─── Contact Method CRUD ─────────────────────────────────

export const addContactMethod = mutation({
  args: { token: v.optional(v.string()),
    personId: v.id("personMaster"),
    type: v.string(),
    label: v.optional(v.string()),
    value: v.string(),
    countryCode: v.optional(v.string()),
    preferred: v.optional(v.boolean()),
    visibility: v.optional(
      v.union(
        v.literal("public"),
        v.literal("organization"),
        v.literal("department"),
        v.literal("private"),
        v.literal("emergency_only"),
      )
    ),
  },
  handler: withScopeAndEvents({ operation: "create", module: "people", entity: "contactEngine" }, async (ctx, args) => {
    const now = Date.now();
    const contactId = await ctx.db.insert("contactMethods", {
      personId: args.personId,
      type: args.type,
      label: args.label,
      value: args.value,
      countryCode: args.countryCode,
      preferred: args.preferred || false,
      verified: false,
      visibility: args.visibility || "organization",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // If this is set as preferred, unset others of same type
    if (args.preferred) {
      const allContacts = await ctx.db
        .query("contactMethods")
        .withIndex("personId_type", (q: any) =>
          q.eq("personId", args.personId).eq("type", args.type)
        )
        .collect();
      for (const c of allContacts) {
        if (c._id !== contactId) {
          await ctx.db.patch(c._id, { preferred: false, updatedAt: now });
        }
      }
    }

    return contactId;
  }),
});

export const updateContactMethod = mutation({
  args: { token: v.optional(v.string()),
    contactId: v.id("contactMethods"),
    type: v.optional(v.string()),
    label: v.optional(v.string()),
    value: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    preferred: v.optional(v.boolean()),
    visibility: v.optional(
      v.union(
        v.literal("public"),
        v.literal("organization"),
        v.literal("department"),
        v.literal("private"),
        v.literal("emergency_only"),
      )
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "people", entity: "contactEngine" }, async (ctx, args) => {
    const { token: _token, contactId, ...fields } = args;
    const existing = await ctx.db.get(contactId);
    if (!existing) throw new Error("Contact method not found");

    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }

    await ctx.db.patch(contactId, updates);

    // If setting as preferred, unset others of same type
    if (args.preferred) {
      const personId = existing.personId;
      const contactType = args.type || existing.type;
      const now = Date.now();
      const allContacts = await ctx.db
        .query("contactMethods")
        .withIndex("personId_type", (q: any) =>
          q.eq("personId", personId).eq("type", contactType)
        )
        .collect();
      for (const c of allContacts) {
        if (c._id !== contactId) {
          await ctx.db.patch(c._id, { preferred: false, updatedAt: now });
        }
      }
    }

    return contactId;
  }),
});

export const removeContactMethod = mutation({
  args: { token: v.optional(v.string()), contactId: v.id("contactMethods") },
  handler: withScopeAndEvents({ operation: "delete", module: "people", entity: "contactEngine" }, async (ctx, args) => {
    const existing = await ctx.db.get(args.contactId);
    if (!existing) throw new Error("Contact method not found");
    await ctx.db.delete(args.contactId);
    return args.contactId;
  }),
});

export const verifyContactMethod = mutation({
  args: { token: v.optional(v.string()),
    contactId: v.id("contactMethods"),
    verified: v.boolean(),
  },
  handler: withScopeAndEvents({ operation: "update", module: "people", entity: "contactEngine" }, async (ctx, args) => {
    const existing = await ctx.db.get(args.contactId);
    if (!existing) throw new Error("Contact method not found");
    const now = Date.now();
    await ctx.db.patch(args.contactId, {
      verified: args.verified,
      verifiedAt: args.verified ? now : undefined,
      updatedAt: now,
    });
    return args.contactId;
  }),
});

export const setPreferredContact = mutation({
  args: { token: v.optional(v.string()),
    personId: v.id("personMaster"),
    type: v.string(),
    contactId: v.id("contactMethods"),
  },
  handler: withScopeAndEvents({ operation: "update", module: "people", entity: "contactEngine" }, async (ctx, args) => {
    const now = Date.now();
    const allContacts = await ctx.db
      .query("contactMethods")
      .withIndex("personId_type", (q: any) =>
        q.eq("personId", args.personId).eq("type", args.type)
      )
      .collect();

    for (const c of allContacts) {
      await ctx.db.patch(c._id, {
        preferred: c._id === args.contactId,
        updatedAt: now,
      });
    }
    return args.contactId;
  }),
});

// ─── Queries ────────────────────────────────────────────

export const listContactMethods = query({
  args: {
    personId: v.id("personMaster"),
    type: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("contactMethods")
      .withIndex("personId", (q) => q.eq("personId", args.personId));

    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }
    if (args.isActive !== undefined) {
      query = query.filter((q) => q.eq(q.field("isActive"), args.isActive));
    }

    return await query.collect();
  },
});

export const getPreferredContact = query({
  args: {
    personId: v.id("personMaster"),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contactMethods")
      .withIndex("personId_type", (q) =>
        q.eq("personId", args.personId).eq("type", args.type)
      )
      .filter((q) => q.eq(q.field("preferred"), true))
      .first();
  },
});

export const findPersonByContact = query({
  args: {
    type: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db
      .query("contactMethods")
      .withIndex("type_value", (q) =>
        q.eq("type", args.type).eq("value", args.value)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!contact) return null;
    const person = await ctx.db.get(contact.personId);
    if (!person || person.status === "archived") return null;
    return { person, contact };
  },
});
