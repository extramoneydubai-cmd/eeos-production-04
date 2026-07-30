/**
 * Metadata Registry — Central registry for every configurable object in the platform.
 *
 * Every module, form, field, dashboard, menu, workflow, notification, document,
 * API, report, policy, and automation is registered here with its metadata.
 *
 * Supports:
 * - Version history with rollback
 * - Dependency tracking
 * - Status lifecycle (draft → testing → published → archived)
 * - Audit logging
 * - Impact analysis
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Types ─────────────────────────────────────────────────────

export type MetadataEntityType =
  | "module" | "form" | "field" | "dashboard" | "menu" | "workflow"
  | "notification" | "document" | "api" | "report" | "policy" | "automation"
  | "integration" | "extension";

export type MetadataStatus =
  | "draft" | "testing" | "published" | "archived" | "deprecated";

export interface EntityMetadata {
  entityType: MetadataEntityType;
  entityId: string;
  name: string;
  description?: string;
  version: number;
  status: MetadataStatus;
  owner?: string;
  dependencies?: string[];
  usageCount: number;
  tags?: string[];
}

// ─── Register / Update Metadata ──────────────────────────────

export const registerEntity = mutation({
  args: {
    entityType: v.union(
      v.literal("module"), v.literal("form"), v.literal("field"),
      v.literal("dashboard"), v.literal("menu"), v.literal("workflow"),
      v.literal("notification"), v.literal("document"), v.literal("api"),
      v.literal("report"), v.literal("policy"), v.literal("automation"),
      v.literal("integration"), v.literal("extension"),
    ),
    entityId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    owner: v.optional(v.string()),
    dependencies: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    status: v.optional(v.union(
      v.literal("draft"), v.literal("testing"),
      v.literal("published"), v.literal("archived"),
      v.literal("deprecated"),
    )),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if already registered
    const existing = await ctx.db.query("metadataRegistry")
      .withIndex("by_entity", (q: any) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .first();

    const metadata = {
      entityType: args.entityType,
      entityId: args.entityId,
      name: args.name,
      description: args.description,
      version: existing ? (existing as any).version + 1 : 1,
      status: args.status || "draft",
      owner: args.owner,
      dependencies: args.dependencies || [],
      usageCount: existing ? (existing as any).usageCount : 0,
      tags: args.tags || [],
      updatedAt: now,
    };

    if (existing) {
      // Save old version to history
      await ctx.db.insert("metadataHistory", {
        entityType: existing.entityType,
        entityId: existing.entityId,
        metadata: { ...existing, _id: undefined, _creationTime: undefined },
        version: (existing as any).version,
        createdAt: now,
      });

      await ctx.db.patch(existing._id, metadata);
      return existing._id;
    }

    return ctx.db.insert("metadataRegistry", {
      ...metadata,
      createdAt: now,
    });
  },
});

// ─── Queries ───────────────────────────────────────────────────

export const getEntityMetadata = query({
  args: {
    entityType: v.union(
      v.literal("module"), v.literal("form"), v.literal("field"),
      v.literal("dashboard"), v.literal("menu"), v.literal("workflow"),
      v.literal("notification"), v.literal("document"), v.literal("api"),
      v.literal("report"), v.literal("policy"), v.literal("automation"),
      v.literal("integration"), v.literal("extension"),
    ),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.query("metadataRegistry")
      .withIndex("by_entity", (q: any) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .first();
  },
});

export const listEntitiesByType = query({
  args: {
    entityType: v.union(
      v.literal("module"), v.literal("form"), v.literal("field"),
      v.literal("dashboard"), v.literal("menu"), v.literal("workflow"),
      v.literal("notification"), v.literal("document"), v.literal("api"),
      v.literal("report"), v.literal("policy"), v.literal("automation"),
      v.literal("integration"), v.literal("extension"),
    ),
    status: v.optional(v.union(
      v.literal("draft"), v.literal("testing"),
      v.literal("published"), v.literal("archived"),
      v.literal("deprecated"),
    )),
  },
  handler: async (ctx, args) => {
    let items = await ctx.db.query("metadataRegistry")
      .withIndex("by_entity_type", (q: any) => q.eq("entityType", args.entityType))
      .collect();

    if (args.status) {
      items = items.filter((item: any) => item.status === args.status);
    }

    return items.sort((a: any, b: any) => (b as any).updatedAt - (a as any).updatedAt);
  },
});

export const getEntityHistory = query({
  args: {
    entityType: v.union(
      v.literal("module"), v.literal("form"), v.literal("field"),
      v.literal("dashboard"), v.literal("menu"), v.literal("workflow"),
      v.literal("notification"), v.literal("document"), v.literal("api"),
      v.literal("report"), v.literal("policy"), v.literal("automation"),
      v.literal("integration"), v.literal("extension"),
    ),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.query("metadataHistory")
      .withIndex("by_entity_history", (q: any) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .collect();
  },
});

// ─── Dependency Analysis ─────────────────────────────────────

export const getDependencyGraph = query({
  args: {
    entityType: v.optional(v.union(
      v.literal("module"), v.literal("form"), v.literal("field"),
      v.literal("dashboard"), v.literal("menu"), v.literal("workflow"),
      v.literal("notification"), v.literal("document"), v.literal("api"),
      v.literal("report"), v.literal("policy"), v.literal("automation"),
      v.literal("integration"), v.literal("extension"),
    )),
  },
  handler: async (ctx, args) => {
    let entities = await ctx.db.query("metadataRegistry").collect();

    if (args.entityType) {
      entities = entities.filter((e: any) => e.entityType === args.entityType);
    }

    const graph: Record<string, string[]> = {};
    const reverseDeps: Record<string, string[]> = {};

    for (const entity of entities) {
      const key = `${entity.entityType}:${entity.entityId}`;
      graph[key] = (entity as any).dependencies || [];

      for (const dep of (entity as any).dependencies || []) {
        if (!reverseDeps[dep]) reverseDeps[dep] = [];
        if (!reverseDeps[dep].includes(key)) {
          reverseDeps[dep].push(key);
        }
      }
    }

    // Detect circular dependencies
    const circular: string[] = [];
    const visited = new Set<string>();
    const inStack = new Set<string>();

    function dfs(node: string) {
      visited.add(node);
      inStack.add(node);
      for (const dep of graph[node] || []) {
        if (inStack.has(dep)) {
          circular.push(`Circular: ${node} → ${dep}`);
        } else if (!visited.has(dep)) {
          dfs(dep);
        }
      }
      inStack.delete(node);
    }

    for (const key of Object.keys(graph)) {
      if (!visited.has(key)) dfs(key);
    }

    return { graph, reverseDeps, circular };
  },
});

// ─── Usage Tracking ─────────────────────────────────────────

export const incrementUsage = mutation({
  args: {
    entityType: v.union(
      v.literal("module"), v.literal("form"), v.literal("field"),
      v.literal("dashboard"), v.literal("menu"), v.literal("workflow"),
      v.literal("notification"), v.literal("document"), v.literal("api"),
      v.literal("report"), v.literal("policy"), v.literal("automation"),
      v.literal("integration"), v.literal("extension"),
    ),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const entity = await ctx.db.query("metadataRegistry")
      .withIndex("by_entity", (q: any) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .first();

    if (entity) {
      await ctx.db.patch(entity._id, {
        usageCount: (entity as any).usageCount + 1,
        updatedAt: Date.now(),
      });
    }
  },
});
