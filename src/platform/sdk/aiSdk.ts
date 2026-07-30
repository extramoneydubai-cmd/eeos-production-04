/**
 * AI SDK — Enterprise AI Query & Capability Layer
 *
 * Wires existing aiRuntimeEngine.ts with 16 intents and entity extraction.
 *
 * Usage:
 *   import { PlatformSDK } from "@/platform/sdk";
 *   const response = await PlatformSDK.ai.query(ctx, { query: "Find students with pending fees" });
 */

import { v } from "convex/values";
import { query } from "../../convex/_generated/server";
import { Id } from "../../convex/_generated/dataModel";

// ─── SDK Queries ─────────────────────────────────────────────

/**
 * Process a natural language query against the Enterprise AI.
 * Classifies intent, extracts entities, and returns structured results.
 */
export const query = query({
  args: { query: v.string(), companyId: v.optional(v.id("companies")), branchId: v.optional(v.id("branches")) },
  handler: async (ctx, args) => {
    try {
      const { processQuery } = await import("../../convex/aiRuntimeEngine");
      return processQuery.handler(ctx, args);
    } catch (e) {
      return {
        intent: "unknown",
        query: args.query,
        error: String(e),
        suggestions: ["Try: 'Find students with pending fees'", "Try: 'Show admission trends'", "Try: 'Generate a bonafide certificate'"],
        timestamp: Date.now(),
      };
    }
  },
});

/**
 * Get all AI capabilities and supported intents.
 */
export const getCapabilities = query({
  handler: async (ctx) => {
    try {
      const { getAICapabilities } = await import("../../convex/aiRuntimeEngine");
      return getAICapabilities.handler(ctx);
    } catch {
      return {
        supportedIntents: [],
        knownEntities: 0,
        configurableRules: 0,
        entityCount: 0,
        timestamp: Date.now(),
      };
    }
  },
});

/**
 * Get quick example queries for each AI intent category.
 */
export const getQuickExamples = query({
  handler: async (ctx) => {
    try {
      const { getQuickExamples } = await import("../../convex/aiRuntimeEngine");
      return getQuickExamples.handler(ctx);
    } catch {
      return { search: [], analytics: [], actions: [] };
    }
  },
});
