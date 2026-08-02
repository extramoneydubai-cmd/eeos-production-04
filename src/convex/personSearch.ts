import { v } from "convex/values";
import { query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ─── Global Person Search ────────────────────────────────

export const globalSearch = query({
  args: {
    searchTerm: v.string(),
    profileType: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 30;
    const term = args.searchTerm.toLowerCase().trim();
    if (!term) return { items: [], totalCount: 0 };

    // Search personMaster by name fields
    const allPersons = await ctx.db.query("personMaster").collect();
    const activePersons = allPersons.filter((p) => p.status !== "archived");

    // Score-based ranking
    const scored: Array<{ person: Doc<"personMaster">; score: number; matchedField: string; profiles: any[]; contacts: any[] }> = [];

    for (const person of activePersons) {
      let score = 0;
      let matchedField = "";

      const displayName = (person.displayName || "").toLowerCase();
      const firstName = (person.firstName || "").toLowerCase();
      const lastName = (person.lastName || "").toLowerCase();
      const preferredName = (person.preferredName || "").toLowerCase();

      // Exact match is highest priority
      if (displayName === term) { score += 100; matchedField = "displayName"; }
      else if (firstName === term && lastName === term) { score += 90; matchedField = "fullName"; }
      else if (firstName === term) { score += 80; matchedField = "firstName"; }
      else if (lastName === term) { score += 80; matchedField = "lastName"; }
      else if (preferredName === term) { score += 75; matchedField = "preferredName"; }
      // Contains match
      else if (displayName.includes(term)) { score += 50; matchedField = "displayName"; }
      else if (firstName.includes(term)) { score += 40; matchedField = "firstName"; }
      else if (lastName.includes(term)) { score += 40; matchedField = "lastName"; }
      else if (preferredName.includes(term)) { score += 35; matchedField = "preferredName"; }
      // Partial word match
      else {
        const words = displayName.split(/\s+/);
        if (words.some((w) => w.startsWith(term))) { score += 20; matchedField = "displayName"; }
      }

      if (score > 0) {
        // Fetch profiles and contacts for display
        const profiles = await ctx.db
          .query("personProfiles")
          .withIndex("personId", (q) => q.eq("personId", person._id))
          .filter((q) => q.eq(q.field("active"), true))
          .collect();

        const contacts = await ctx.db
          .query("contactMethods")
          .withIndex("personId", (q) => q.eq("personId", person._id))
          .filter((q) => q.and(q.eq(q.field("isActive"), true), q.neq(q.field("visibility"), "private")))
          .collect();

        scored.push({ person, score, matchedField, profiles, contacts });
      }
    }

    // Also search contact methods by value (phone/email)
    const contactsByValue = await ctx.db
      .query("contactMethods")
      .withIndex("value", (q) => q.eq("value", args.searchTerm))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    for (const contact of contactsByValue) {
      const person = activePersons.find((p) => p._id === contact.personId);
      if (person && !scored.find((s) => s.person._id === person._id)) {
        const profiles = await ctx.db
          .query("personProfiles")
          .withIndex("personId", (q) => q.eq("personId", person._id))
          .filter((q) => q.eq(q.field("active"), true))
          .collect();
        const contacts = await ctx.db
          .query("contactMethods")
          .withIndex("personId", (q) => q.eq("personId", person._id))
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect();

        scored.push({
          person,
          score: 95,
          matchedField: contact.type,
          profiles,
          contacts,
        });
      }
    }

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Apply profile type filter if specified
    const filtered = args.profileType
      ? scored.filter((s) => s.profiles.some((p) => p.profileType === args.profileType))
      : scored;

    // Pagination
    const startIndex = args.cursor ? parseInt(args.cursor) : 0;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      items: paginated.map((s) => ({
        person: s.person,
        score: s.score,
        matchedField: s.matchedField,
        profiles: s.profiles.map((p) => ({
          profileType: p.profileType,
          profileReferenceId: p.profileReferenceId,
          displayLabel: p.displayLabel,
          primaryProfile: p.primaryProfile,
        })),
        contacts: s.contacts.map((c) => ({
          type: c.type,
          value: c.value,
          label: c.label,
          preferred: c.preferred,
          visibility: c.visibility,
        })),
      })),
      totalCount: filtered.length,
      nextCursor: startIndex + limit < filtered.length ? String(startIndex + limit) : undefined,
    };
  },
});

// ─── Quick Search (lightweight, for autocomplete) ──────

export const quickSearch = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const term = args.searchTerm.toLowerCase().trim();
    if (term.length < 2) return [];

    const allPersons = await ctx.db.query("personMaster").collect();
    const activePersons = allPersons.filter((p) => p.status !== "archived");

    const results: Array<{
      personId: Id<"personMaster">;
      displayName: string;
      profilePhoto: string | undefined;
      primaryProfile: string | undefined;
      hasEmail: boolean;
      hasPhone: boolean;
    }> = [];

    for (const person of activePersons) {
      const displayName = (person.displayName || "").toLowerCase();
      const firstName = (person.firstName || "").toLowerCase();
      const lastName = (person.lastName || "").toLowerCase();

      if (
        displayName.includes(term) ||
        firstName.includes(term) ||
        lastName.includes(term)
      ) {
        // Get primary profile and contact indicators
        const primaryProfile = await ctx.db
          .query("personProfiles")
          .withIndex("personId_profileType", (q) =>
            q.eq("personId", person._id)
          )
          .filter((q) => q.eq(q.field("primaryProfile"), true))
          .first();

        const contacts = await ctx.db
          .query("contactMethods")
          .withIndex("personId", (q) => q.eq("personId", person._id))
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect();

        results.push({
          personId: person._id,
          displayName: person.displayName || `${person.firstName} ${person.lastName}`,
          profilePhoto: person.profilePhoto,
          primaryProfile: primaryProfile?.profileType,
          hasEmail: contacts.some((c) => c.type === "email"),
          hasPhone: contacts.some((c) => c.type === "mobile" || c.type === "phone"),
        });

        if (results.length >= limit) break;
      }
    }

    return results;
  },
});

// ─── Find by ID (any ID type) ──────────────────────────

export const findByPersonId = query({
  args: {
    personIdStr: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const term = args.personIdStr.toLowerCase();
    const allPersons = await ctx.db.query("personMaster").collect();
    const activePersons = allPersons.filter((p) => p.status !== "archived");

    const results: Array<{ person: Doc<"personMaster">; profiles: any[]; contacts: any[] }> = [];

    for (const person of activePersons) {
      const displayName = (person.displayName || "").toLowerCase();
      if (displayName.includes(term)) {
        const profiles = await ctx.db
          .query("personProfiles")
          .withIndex("personId", (q) => q.eq("personId", person._id))
          .filter((q) => q.eq(q.field("active"), true))
          .collect();

        const contacts = await ctx.db
          .query("contactMethods")
          .withIndex("personId", (q) => q.eq("personId", person._id))
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect();

        results.push({ person, profiles, contacts });
      }
    }

    return results.slice(0, args.limit || 20);
  },
});

// ─── Person Data Summary ───────────────────────────────

export const getPersonDataSummary = query({
  args: { personId: v.id("personMaster") },
  handler: async (ctx, args) => {
    const person = await ctx.db.get(args.personId);
    if (!person || person.status === "archived") return null;

    const [profiles, contacts, addresses, relationships, socialLinks, documents, qrCode] =
      await Promise.all([
        ctx.db
          .query("personProfiles")
          .withIndex("personId", (q) => q.eq("personId", args.personId))
          .filter((q) => q.eq(q.field("active"), true))
          .collect(),
        ctx.db
          .query("contactMethods")
          .withIndex("personId", (q) => q.eq("personId", args.personId))
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect(),
        ctx.db
          .query("addresses")
          .withIndex("personId", (q) => q.eq("personId", args.personId))
          .collect(),
        ctx.db
          .query("relationships")
          .withIndex("personA", (q) => q.eq("personA", args.personId))
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect(),
        ctx.db
          .query("socialLinks")
          .withIndex("personId", (q) => q.eq("personId", args.personId))
          .collect(),
        ctx.db
          .query("personDocuments")
          .withIndex("personId", (q) => q.eq("personId", args.personId))
          .collect(),
        ctx.db
          .query("personQRCode")
          .withIndex("personId", (q) => q.eq("personId", args.personId))
          .filter((q) => q.eq(q.field("active"), true))
          .first(),
      ]);

    return {
      person,
      summary: {
        profileCount: profiles.length,
        profileTypes: [...new Set(profiles.map((p) => p.profileType))],
        contactCount: contacts.length,
        preferredEmail: contacts.find((c) => c.type === "email" && c.preferred)?.value,
        preferredPhone: contacts.find((c) => (c.type === "mobile" || c.type === "phone") && c.preferred)?.value,
        addressCount: addresses.length,
        relationshipCount: relationships.length,
        socialLinkCount: socialLinks.length,
        documentCount: documents.length,
        hasQRCode: !!qrCode,
      },
      profiles,
      contacts,
      addresses,
      socialLinks,
      documents,
      qrCode,
    };
  },
});
