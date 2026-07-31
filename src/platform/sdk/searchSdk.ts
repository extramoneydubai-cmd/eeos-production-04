/**
 * Search SDK — Enterprise Global Search Runtime
 *
 * Wires the existing searchEngineV2. Provides typo-tolerant, natural-language,
 * permission-aware search across 20+ entity types, plus recent/saved searches.
 *
 * Usage:
 *   import { PlatformSDK } from "@/platform/sdk";
 *   const results = await PlatformSDK.search.global(ctx, { query: "bounced cheques", userId });
 */

import { v } from "convex/values";
import { mutation, query } from "../../convex/_generated/server";

/**
 * Global search across all entities (typo-tolerant, NLP-aware, permission-filtered).
 */
export const global = query({
  args: {
    query: v.string(),
    entityTypes: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    userId: v.optional(v.id("users")),
    filters: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { globalSearchV2 } = await import("../../convex/searchEngineV2");
    return globalSearchV2.handler(ctx, args);
  },
});

/**
 * Lightweight autocomplete suggestions for a query prefix.
 */
export const getSuggestions = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const { getSearchSuggestionsV2 } = await import("../../convex/searchEngineV2");
    return getSearchSuggestionsV2.handler(ctx, args);
  },
});

/**
 * Record a recent search for a user (kept in user preferences).
 */
export const recordRecent = mutation({
  args: {
    userId: v.id("users"),
    query: v.string(),
    entityType: v.optional(v.string()),
    resultCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { recordRecentSearch } = await import("../../convex/searchEngineV2");
    return recordRecentSearch.handler(ctx, args);
  },
});

/**
 * Get a user's recent searches.
 */
export const getRecent = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const { getRecentSearches } = await import("../../convex/searchEngineV2");
    return getRecentSearches.handler(ctx, args);
  },
});

/**
 * Save a search as a favorite for a user.
 */
export const save = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    query: v.string(),
    entityTypes: v.optional(v.array(v.string())),
    filters: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { saveSearch } = await import("../../convex/searchEngineV2");
    return saveSearch.handler(ctx, args);
  },
});

/**
 * Get a user's saved searches.
 */
export const getSaved = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const { getSavedSearches } = await import("../../convex/searchEngineV2");
    return getSavedSearches.handler(ctx, args);
  },
});

/**
 * Delete a user's saved search by name.
 */
export const deleteSaved = mutation({
  args: {
    userId: v.id("users"),
    searchName: v.string(),
  },
  handler: async (ctx, args) => {
    const { deleteSavedSearch } = await import("../../convex/searchEngineV2");
    return deleteSavedSearch.handler(ctx, args);
  },
});
