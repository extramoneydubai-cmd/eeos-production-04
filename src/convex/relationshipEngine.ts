import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ─── Relationship CRUD ───────────────────────────────────

export const linkPersons = mutation({
  args: {
    personA: v.id("personMaster"),
    personB: v.id("personMaster"),
    relationshipType: v.string(),
    startDate: v.optional(v.number()),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.personA === args.personB) {
      throw new Error("Cannot link a person to themselves");
    }

    // Check if relationship already exists
    const existing = await ctx.db
      .query("relationships")
      .withIndex("personA_relationshipType", (q) =>
        q.eq("personA", args.personA).eq("relationshipType", args.relationshipType)
      )
      .filter((q) => q.eq(q.field("personB"), args.personB))
      .first();

    if (existing && existing.active) {
      throw new Error("Active relationship already exists between these persons with this type");
    }

    const now = Date.now();
    return await ctx.db.insert("relationships", {
      personA: args.personA,
      personB: args.personB,
      relationshipType: args.relationshipType,
      startDate: args.startDate || now,
      active: true,
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const unlinkPersons = mutation({
  args: {
    relationshipId: v.id("relationships"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.relationshipId);
    if (!existing) throw new Error("Relationship not found");
    const now = Date.now();
    await ctx.db.patch(args.relationshipId, {
      active: false,
      endDate: now,
      updatedAt: now,
    });
    return args.relationshipId;
  },
});

export const changeRelationship = mutation({
  args: {
    relationshipId: v.id("relationships"),
    relationshipType: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    active: v.optional(v.boolean()),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { relationshipId, ...fields } = args;
    const existing = await ctx.db.get(relationshipId);
    if (!existing) throw new Error("Relationship not found");

    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(relationshipId, updates);
    return relationshipId;
  },
});

// ─── Queries ────────────────────────────────────────────

export const getPersonRelationships = query({
  args: {
    personId: v.id("personMaster"),
    relationshipType: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const results: Array<Doc<"relationships"> & { relatedPerson: Doc<"personMaster"> | null }> = [];

    // Get relationships where person is personA
    const asPersonA = await ctx.db
      .query("relationships")
      .withIndex("personA", (q) => q.eq("personA", args.personId))
      .collect();

    for (const rel of asPersonA) {
      if (args.active !== undefined && rel.active !== args.active) continue;
      if (args.relationshipType && rel.relationshipType !== args.relationshipType) continue;
      const relatedPerson = await ctx.db.get(rel.personB);
      if (relatedPerson && relatedPerson.status !== "archived") {
        results.push({ ...rel, relatedPerson });
      }
    }

    // Get relationships where person is personB
    const asPersonB = await ctx.db
      .query("relationships")
      .withIndex("personB", (q) => q.eq("personB", args.personId))
      .collect();

    for (const rel of asPersonB) {
      if (args.active !== undefined && rel.active !== args.active) continue;
      if (args.relationshipType && rel.relationshipType !== args.relationshipType) continue;
      // Avoid duplicates
      if (results.find((r) => r._id === rel._id)) continue;
      const relatedPerson = await ctx.db.get(rel.personA);
      if (relatedPerson && relatedPerson.status !== "archived") {
        results.push({ ...rel, relatedPerson });
      }
    }

    return results;
  },
});

export const getFamilyTree = query({
  args: {
    personId: v.id("personMaster"),
    maxDepth: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxDepth = args.maxDepth || 3;
    const visited = new Set<string>();

    async function explore(
      pid: Id<"personMaster">,
      depth: number
    ): Promise<{
      person: Doc<"personMaster"> | null;
      relationships: any[];
      children: any[];
    } | null> {
      if (depth > maxDepth || visited.has(pid)) return null;
      visited.add(pid);

      const person = await ctx.db.get(pid);
      if (!person || person.status === "archived") return null;

      const relationships = await ctx.db
        .query("relationships")
        .withIndex("personA", (q) => q.eq("personA", pid))
        .filter((q) => q.eq(q.field("active"), true))
        .collect();

      const children: any[] = [];
      for (const rel of relationships) {
        if (rel.personB === pid) continue;
        const child = await explore(rel.personB, depth + 1);
        if (child) {
          children.push({
            relationship: rel,
            ...child,
          });
        }
      }

      return {
        person,
        relationships: relationships.map((r) => ({
          ...r,
          relatedPerson: r.personB,
        })),
        children,
      };
    }

    return await explore(args.personId, 0);
  },
});

export const getReportingHierarchy = query({
  args: {
    personId: v.id("personMaster"),
    includeProfiles: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Find "reports_to" relationships for this person
    const reportsTo = await ctx.db
      .query("relationships")
      .withIndex("personA_relationshipType", (q) =>
        q.eq("personA", args.personId).eq("relationshipType", "reports_to")
      )
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    // Find direct reports (people who report to this person)
    const directReports = await ctx.db
      .query("relationships")
      .withIndex("personB", (q) => q.eq("personB", args.personId))
      .filter((q) =>
        q.and(
          q.eq(q.field("active"), true),
          q.eq(q.field("relationshipType"), "reports_to")
        )
      )
      .collect();

    const person = await ctx.db.get(args.personId);
    if (!person) return null;

    // Get managers
    const managers: Array<{ relationship: Doc<"relationships">; person: Doc<"personMaster"> | null }> = [];
    for (const rel of reportsTo) {
      const manager = await ctx.db.get(rel.personB);
      if (manager && manager.status !== "archived") {
        managers.push({ relationship: rel, person: manager });
      }
    }

    // Get direct reports
    const reports: Array<{ relationship: Doc<"relationships">; person: Doc<"personMaster"> | null }> = [];
    for (const rel of directReports) {
      const report = await ctx.db.get(rel.personA);
      if (report && report.status !== "archived") {
        reports.push({ relationship: rel, person: report });
      }
    }

    let profiles = null;
    if (args.includeProfiles) {
      profiles = await ctx.db
        .query("personProfiles")
        .withIndex("personId", (q) => q.eq("personId", args.personId))
        .filter((q) => q.eq(q.field("active"), true))
        .collect();
    }

    return {
      person,
      profiles,
      managers,
      directReports: reports,
    };
  },
});
