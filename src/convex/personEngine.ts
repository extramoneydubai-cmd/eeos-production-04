import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ─── Helpers ──────────────────────────────────────────────

async function generatePersonId(ctx: { db: { query: (name: string) => any } }): Promise<string> {
  const existing = await ctx.db.query("personMaster").collect();
  const count = existing.length + 1;
  return `PER-${String(count).padStart(6, "0")}`;
}

async function generateQRToken(personId: string): Promise<string> {
  const raw = `${personId}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").substring(0, 32);
}

// ─── Person CRUD ─────────────────────────────────────────

export const createPerson = mutation({
  args: {
    firstName: v.string(),
    middleName: v.optional(v.string()),
    lastName: v.string(),
    displayName: v.optional(v.string()),
    preferredName: v.optional(v.string()),
    profilePhoto: v.optional(v.string()),
    gender: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()),
    nationality: v.optional(v.string()),
    maritalStatus: v.optional(v.string()),
    bloodGroup: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),
    timezone: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const displayName = args.displayName || `${args.firstName} ${args.lastName}`;

    const personId = await ctx.db.insert("personMaster", {
      ...args,
      displayName,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    // Auto-generate QR code
    const qrToken = await generateQRToken(personId);
    const deepLink = `eeos://person/${personId}`;
    await ctx.db.insert("personQRCode", {
      personId,
      qrToken,
      deepLink,
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    return personId;
  },
});

export const updatePerson = mutation({
  args: {
    personId: v.id("personMaster"),
    firstName: v.optional(v.string()),
    middleName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    displayName: v.optional(v.string()),
    preferredName: v.optional(v.string()),
    profilePhoto: v.optional(v.string()),
    gender: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()),
    nationality: v.optional(v.string()),
    maritalStatus: v.optional(v.string()),
    bloodGroup: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),
    timezone: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { personId, ...fields } = args;
    const existing = await ctx.db.get(personId);
    if (!existing) throw new Error("Person not found");

    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    // Recompute displayName if firstName or lastName changed
    if (fields.firstName !== undefined || fields.lastName !== undefined) {
      const firstName = fields.firstName ?? existing.firstName;
      const lastName = fields.lastName ?? existing.lastName;
      updates.displayName = fields.displayName ?? `${firstName} ${lastName}`;
    }

    await ctx.db.patch(personId, updates);
    return personId;
  },
});

export const getPerson = query({
  args: { personId: v.id("personMaster") },
  handler: async (ctx, args) => {
    const person = await ctx.db.get(args.personId);
    if (!person || person.status === "archived") return null;

    // Fetch related data
    const profiles = await ctx.db
      .query("personProfiles")
      .withIndex("personId", (q) => q.eq("personId", args.personId))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    const contacts = await ctx.db
      .query("contactMethods")
      .withIndex("personId", (q) => q.eq("personId", args.personId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const addresses = await ctx.db
      .query("addresses")
      .withIndex("personId", (q) => q.eq("personId", args.personId))
      .collect();

    const socialLinks = await ctx.db
      .query("socialLinks")
      .withIndex("personId", (q) => q.eq("personId", args.personId))
      .collect();

    const qrCode = await ctx.db
      .query("personQRCode")
      .withIndex("personId", (q) => q.eq("personId", args.personId))
      .filter((q) => q.eq(q.field("active"), true))
      .first();

    return {
      ...person,
      profiles,
      contacts,
      addresses,
      socialLinks,
      qrCode,
    };
  },
});

export const getPersonBasic = query({
  args: { personId: v.id("personMaster") },
  handler: async (ctx, args) => {
    const person = await ctx.db.get(args.personId);
    if (!person || person.status === "archived") return null;
    return person;
  },
});

export const listPersons = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    let query = ctx.db.query("personMaster");

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    } else {
      query = query.filter((q) => q.neq(q.field("status"), "archived"));
    }

    const results = await query.order("desc").take(limit + 1);
    const hasMore = results.length > limit;
    const items = results.slice(0, limit);

    return {
      items,
      hasMore,
      cursor: hasMore ? items[items.length - 1]._id : null,
    };
  },
});

export const archivePerson = mutation({
  args: { personId: v.id("personMaster") },
  handler: async (ctx, args) => {
    const person = await ctx.db.get(args.personId);
    if (!person) throw new Error("Person not found");
    await ctx.db.patch(args.personId, { status: "archived", updatedAt: Date.now() });
    return args.personId;
  },
});

export const restorePerson = mutation({
  args: { personId: v.id("personMaster") },
  handler: async (ctx, args) => {
    const person = await ctx.db.get(args.personId);
    if (!person) throw new Error("Person not found");
    await ctx.db.patch(args.personId, { status: "active", updatedAt: Date.now() });
    return args.personId;
  },
});

// ─── Person Merge ──────────────────────────────────────

export const mergePersons = mutation({
  args: {
    sourcePersonId: v.id("personMaster"),
    targetPersonId: v.id("personMaster"),
  },
  handler: async (ctx, args) => {
    const { sourcePersonId, targetPersonId } = args;
    const source = await ctx.db.get(sourcePersonId);
    const target = await ctx.db.get(targetPersonId);
    if (!source || !target) throw new Error("One or both persons not found");

    // Move all profiles to target
    const sourceProfiles = await ctx.db
      .query("personProfiles")
      .withIndex("personId", (q) => q.eq("personId", sourcePersonId))
      .collect();
    for (const profile of sourceProfiles) {
      await ctx.db.patch(profile._id, { personId: targetPersonId });
    }

    // Move all contacts to target (skip duplicates)
    const targetContacts = await ctx.db
      .query("contactMethods")
      .withIndex("personId", (q) => q.eq("personId", targetPersonId))
      .collect();
    const targetValues = new Set(targetContacts.map((c) => `${c.type}:${c.value}`));
    const sourceContacts = await ctx.db
      .query("contactMethods")
      .withIndex("personId", (q) => q.eq("personId", sourcePersonId))
      .collect();
    for (const contact of sourceContacts) {
      const key = `${contact.type}:${contact.value}`;
      if (!targetValues.has(key)) {
        await ctx.db.patch(contact._id, { personId: targetPersonId });
      } else {
        await ctx.db.delete(contact._id);
      }
    }

    // Move all addresses to target
    const sourceAddresses = await ctx.db
      .query("addresses")
      .withIndex("personId", (q) => q.eq("personId", sourcePersonId))
      .collect();
    for (const addr of sourceAddresses) {
      await ctx.db.patch(addr._id, { personId: targetPersonId });
    }

    // Move emergency contacts
    const sourceEmergencies = await ctx.db
      .query("emergencyContacts")
      .withIndex("ownerPersonId", (q) => q.eq("ownerPersonId", sourcePersonId))
      .collect();
    for (const ec of sourceEmergencies) {
      await ctx.db.patch(ec._id, { ownerPersonId: targetPersonId });
    }

    // Move relationships
    const sourceRelationshipsA = await ctx.db
      .query("relationships")
      .withIndex("personA", (q) => q.eq("personA", sourcePersonId))
      .collect();
    for (const rel of sourceRelationshipsA) {
      await ctx.db.patch(rel._id, { personA: targetPersonId });
    }
    const sourceRelationshipsB = await ctx.db
      .query("relationships")
      .withIndex("personB", (q) => q.eq("personB", sourcePersonId))
      .collect();
    for (const rel of sourceRelationshipsB) {
      await ctx.db.patch(rel._id, { personB: targetPersonId });
    }

    // Move social links
    const sourceSocial = await ctx.db
      .query("socialLinks")
      .withIndex("personId", (q) => q.eq("personId", sourcePersonId))
      .collect();
    for (const sl of sourceSocial) {
      await ctx.db.patch(sl._id, { personId: targetPersonId });
    }

    // Move documents
    const sourceDocs = await ctx.db
      .query("personDocuments")
      .withIndex("personId", (q) => q.eq("personId", sourcePersonId))
      .collect();
    for (const doc of sourceDocs) {
      await ctx.db.patch(doc._id, { personId: targetPersonId });
    }

    // Move QR code
    const sourceQR = await ctx.db
      .query("personQRCode")
      .withIndex("personId", (q) => q.eq("personId", sourcePersonId))
      .first();
    if (sourceQR) {
      await ctx.db.patch(sourceQR._id, { personId: targetPersonId });
    }

    // Delete source person
    await ctx.db.delete(sourcePersonId);

    return targetPersonId;
  },
});

// ─── Person Search (basic) ──────────────────────────────

export const searchPersons = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const term = args.searchTerm.toLowerCase();

    const allPersons = await ctx.db.query("personMaster").collect();

    const results = allPersons.filter((p) => {
      if (p.status === "archived") return false;
      const display = (p.displayName || "").toLowerCase();
      const first = (p.firstName || "").toLowerCase();
      const last = (p.lastName || "").toLowerCase();
      return display.includes(term) || first.includes(term) || last.includes(term);
    });

    // Also search by contact method value if query looks like a phone/email
    let byContact: typeof allPersons = [];
    if (term.includes("@") || /^[\d\s\-+()]+$/.test(term)) {
      const contacts = await ctx.db
        .query("contactMethods")
        .withIndex("value", (q) => q.eq("value", args.searchTerm))
        .collect();
      for (const c of contacts) {
        const person = allPersons.find((p) => p._id === c.personId && p.status !== "archived");
        if (person && !results.find((r) => r._id === person._id)) {
          byContact.push(person);
        }
      }
    }

    const combined = [...results, ...byContact].slice(0, limit);
    return combined;
  },
});
