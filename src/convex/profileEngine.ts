import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Profile CRUD ────────────────────────────────────────

export const addProfile = mutation({
  args: {
    personId: v.id("personMaster"),
    profileType: v.string(),
    profileReferenceId: v.optional(v.string()),
    active: v.optional(v.boolean()),
    primaryProfile: v.optional(v.boolean()),
    displayLabel: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const isActive = args.active !== undefined ? args.active : true;
    const isPrimary = args.primaryProfile !== undefined ? args.primaryProfile : false;

    // If setting as primary, unset other primaries of same type
    if (isPrimary) {
      const existingProfiles = await ctx.db
        .query("personProfiles")
        .withIndex("personId_profileType", (q) =>
          q.eq("personId", args.personId).eq("profileType", args.profileType)
        )
        .collect();
      for (const p of existingProfiles) {
        if (p.primaryProfile) {
          await ctx.db.patch(p._id, { primaryProfile: false, updatedAt: now });
        }
      }
    }

    return await ctx.db.insert("personProfiles", {
      personId: args.personId,
      profileType: args.profileType,
      profileReferenceId: args.profileReferenceId,
      active: isActive,
      primaryProfile: isPrimary,
      displayLabel: args.displayLabel,
      description: args.description,
      startDate: args.startDate,
      endDate: args.endDate,
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateProfile = mutation({
  args: {
    profileId: v.id("personProfiles"),
    profileType: v.optional(v.string()),
    profileReferenceId: v.optional(v.string()),
    active: v.optional(v.boolean()),
    primaryProfile: v.optional(v.boolean()),
    displayLabel: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { profileId, ...fields } = args;
    const existing = await ctx.db.get(profileId);
    if (!existing) throw new Error("Profile not found");

    const now = Date.now();
    const updates: Record<string, any> = { updatedAt: now };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }

    // If setting as primary, unset others of same type
    if (args.primaryProfile) {
      const profileType = args.profileType || existing.profileType;
      const allProfiles = await ctx.db
        .query("personProfiles")
        .withIndex("personId_profileType", (q) =>
          q.eq("personId", existing.personId).eq("profileType", profileType)
        )
        .collect();
      for (const p of allProfiles) {
        if (p._id !== profileId && p.primaryProfile) {
          await ctx.db.patch(p._id, { primaryProfile: false, updatedAt: now });
        }
      }
    }

    await ctx.db.patch(profileId, updates);
    return profileId;
  },
});

export const removeProfile = mutation({
  args: { profileId: v.id("personProfiles") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.profileId);
    if (!existing) throw new Error("Profile not found");
    await ctx.db.delete(args.profileId);
    return args.profileId;
  },
});

export const setPrimaryProfile = mutation({
  args: {
    personId: v.id("personMaster"),
    profileType: v.string(),
    profileId: v.id("personProfiles"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const allProfiles = await ctx.db
      .query("personProfiles")
      .withIndex("personId_profileType", (q) =>
        q.eq("personId", args.personId).eq("profileType", args.profileType)
      )
      .collect();

    for (const p of allProfiles) {
      await ctx.db.patch(p._id, {
        primaryProfile: p._id === args.profileId,
        updatedAt: now,
      });
    }
    return args.profileId;
  },
});

// ─── Queries ────────────────────────────────────────────

export const listProfiles = query({
  args: {
    personId: v.id("personMaster"),
    profileType: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("personProfiles")
      .withIndex("personId", (q) => q.eq("personId", args.personId));

    if (args.profileType) {
      query = query.filter((q) => q.eq(q.field("profileType"), args.profileType));
    }
    if (args.active !== undefined) {
      query = query.filter((q) => q.eq(q.field("active"), args.active));
    }

    return await query.collect();
  },
});

export const getPrimaryProfile = query({
  args: {
    personId: v.id("personMaster"),
    profileType: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("personProfiles")
      .withIndex("personId_profileType", (q) =>
        q.eq("personId", args.personId).eq("profileType", args.profileType)
      )
      .filter((q) => q.and(q.eq(q.field("primaryProfile"), true), q.eq(q.field("active"), true)))
      .first();
  },
});

export const findPersonsByProfile = query({
  args: {
    profileType: v.string(),
    profileReferenceId: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("personProfiles")
      .withIndex("profileType", (q) => q.eq("profileType", args.profileType));

    if (args.profileReferenceId) {
      query = query.filter((q) =>
        q.eq(q.field("profileReferenceId"), args.profileReferenceId)
      );
    }
    if (args.active !== undefined) {
      query = query.filter((q) => q.eq(q.field("active"), args.active));
    }

    const profiles = await query.collect();
    const results: Array<{ profile: (typeof profiles)[0]; person: any }> = [];

    for (const profile of profiles) {
      const person = await ctx.db.get(profile.personId);
      if (person && (person as any).status !== "archived") {
        results.push({ profile, person });
      }
    }

    return results;
  },
});
