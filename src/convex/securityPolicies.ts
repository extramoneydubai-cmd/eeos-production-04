import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ─── Visibility Policy CRUD ───────────────────────────────

export const createPolicy = mutation({
  args: { token: v.optional(v.string()),
    policyName: v.string(),
    policyCode: v.string(),
    description: v.optional(v.string()),
    securityLevel: v.union(
      v.literal("public"),
      v.literal("internal"),
      v.literal("confidential"),
      v.literal("highly_confidential"),
      v.literal("executive"),
      v.literal("legal_hold"),
    ),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "create", module: "security", entity: "securityPolicies" }, async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("visibilityPolicies", {
      policyName: args.policyName,
      policyCode: args.policyCode,
      description: args.description,
      securityLevel: args.securityLevel,
      active: args.active !== undefined ? args.active : true,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

export const updatePolicy = mutation({
  args: { token: v.optional(v.string()),
    policyId: v.id("visibilityPolicies"),
    policyName: v.optional(v.string()),
    description: v.optional(v.string()),
    securityLevel: v.optional(
      v.union(
        v.literal("public"),
        v.literal("internal"),
        v.literal("confidential"),
        v.literal("highly_confidential"),
        v.literal("executive"),
        v.literal("legal_hold"),
      )
    ),
    active: v.optional(v.boolean()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "security", entity: "securityPolicies" }, async (ctx, args) => {
    const { token: _token, policyId, ...fields } = args;
    const existing = await ctx.db.get(policyId);
    if (!existing) throw new Error("Policy not found");

    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(policyId, updates);
    return policyId;
  }),
});

export const deletePolicy = mutation({
  args: { token: v.optional(v.string()), policyId: v.id("visibilityPolicies") },
  handler: withScopeAndEvents({ operation: "delete", module: "security", entity: "securityPolicies" }, async (ctx, args) => {
    await ctx.db.delete(args.policyId);
    return args.policyId;
  }),
});

export const listPolicies = query({
  args: {
    active: v.optional(v.boolean()),
    securityLevel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("visibilityPolicies");

    if (args.active !== undefined) {
      query = query.filter((q) => q.eq(q.field("active"), args.active));
    }
    if (args.securityLevel) {
      query = query.filter((q) => q.eq(q.field("securityLevel"), args.securityLevel));
    }

    return await query.collect();
  },
});

export const getPolicy = query({
  args: { policyId: v.id("visibilityPolicies") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.policyId);
  },
});

// ─── Default Policies ─────────────────────────────────────

export const seedDefaultPolicies = mutation({
  args: { token: v.optional(v.string()),},
  handler: withScopeAndEvents({ operation: "create", module: "security", entity: "securityPolicies" }, async (ctx) => {
    const now = Date.now();
    const defaults = [
      {
        policyName: "Public",
        policyCode: "VIS-PUB",
        description: "Visible to all authenticated users",
        securityLevel: "public" as const,
      },
      {
        policyName: "Internal",
        policyCode: "VIS-INT",
        description: "Visible to internal organization members only",
        securityLevel: "internal" as const,
      },
      {
        policyName: "Confidential",
        policyCode: "VIS-CONF",
        description: "Visible to designated teams and managers only",
        securityLevel: "confidential" as const,
      },
      {
        policyName: "Highly Confidential",
        policyCode: "VIS-HC",
        description: "Visible to HR, Finance, and Executive team only",
        securityLevel: "highly_confidential" as const,
      },
      {
        policyName: "Executive Only",
        policyCode: "VIS-EXEC",
        description: "Visible to CEO and COO only",
        securityLevel: "executive" as const,
      },
      {
        policyName: "Legal Hold",
        policyCode: "VIS-LEGAL",
        description: "Preserved for legal/compliance — restricted access",
        securityLevel: "legal_hold" as const,
      },
    ];

    const results: string[] = [];
    for (const d of defaults) {
      const existing = await ctx.db
        .query("visibilityPolicies")
        .withIndex("policyCode", (q: any) => q.eq("policyCode", d.policyCode))
        .first();

      if (!existing) {
        const id = await ctx.db.insert("visibilityPolicies", {
          ...d,
          active: true,
          createdAt: now,
          updatedAt: now,
        });
        results.push(id);
      }
    }

    return results;
  }),
});

// ─── Default Category Permissions ─────────────────────────

export const seedDefaultCategoryPermissions = mutation({
  args: { token: v.optional(v.string()),},
  handler: withScopeAndEvents({ operation: "create", module: "security", entity: "securityPolicies" }, async (ctx) => {
    const now = Date.now();
    const designations = await ctx.db.query("designations").collect();
    const results: string[] = [];

    // Default category rules per role designation
    const categoryDefaults: Record<string, Record<string, { discover: boolean; open: boolean; create: boolean; edit: boolean; delete: boolean; export: boolean; print: boolean }>> = {
      CEO: {
        lead: { discover: true, open: true, create: true, edit: true, delete: true, export: true, print: true },
        student: { discover: true, open: true, create: true, edit: true, delete: true, export: true, print: true },
        employee: { discover: true, open: true, create: true, edit: true, delete: true, export: true, print: true },
        finance: { discover: true, open: true, create: true, edit: true, delete: false, export: true, print: true },
        vendor: { discover: true, open: true, create: true, edit: true, delete: true, export: true, print: true },
        document: { discover: true, open: true, create: true, edit: true, delete: true, export: true, print: true },
      },
      COO: {
        lead: { discover: true, open: true, create: true, edit: true, delete: true, export: true, print: true },
        student: { discover: true, open: true, create: true, edit: true, delete: true, export: true, print: true },
        employee: { discover: true, open: true, create: true, edit: true, delete: false, export: true, print: true },
        finance: { discover: true, open: true, create: false, edit: true, delete: false, export: true, print: true },
        vendor: { discover: true, open: true, create: true, edit: true, delete: true, export: true, print: true },
        document: { discover: true, open: true, create: true, edit: true, delete: true, export: true, print: true },
      },
      Manager: {
        lead: { discover: true, open: true, create: true, edit: true, delete: false, export: false, print: true },
        student: { discover: true, open: true, create: false, edit: true, delete: false, export: false, print: true },
        employee: { discover: true, open: true, create: false, edit: true, delete: false, export: false, print: true },
        finance: { discover: false, open: false, create: false, edit: false, delete: false, export: false, print: false },
        vendor: { discover: true, open: true, create: true, edit: true, delete: false, export: false, print: true },
        document: { discover: true, open: true, create: true, edit: true, delete: false, export: false, print: true },
      },
      Staff: {
        lead: { discover: false, open: false, create: false, edit: false, delete: false, export: false, print: false },
        student: { discover: true, open: true, create: false, edit: false, delete: false, export: false, print: false },
        employee: { discover: false, open: false, create: false, edit: false, delete: false, export: false, print: false },
        finance: { discover: false, open: false, create: false, edit: false, delete: false, export: false, print: false },
        vendor: { discover: false, open: false, create: false, edit: false, delete: false, export: false, print: false },
        document: { discover: true, open: true, create: false, edit: false, delete: false, export: false, print: false },
      },
    };

    const roleToDesignation: Record<string, string[]> = {
      CEO: ["CEO"],
      COO: ["COO"],
      Manager: ["Manager", "Department Head"],
      Staff: ["Employee", "Faculty", "Staff"],
    };

    for (const [_, designation] of designations.entries()) {
      const name = designation.name;
      let defaults: Record<string, { discover: boolean; open: boolean; create: boolean; edit: boolean; delete: boolean; export: boolean; print: boolean }> | undefined;

      // Find matching role
      for (const [role, titles] of Object.entries(roleToDesignation)) {
        if (titles.some((t: any) => name.toLowerCase().includes(t.toLowerCase()))) {
          defaults = categoryDefaults[role];
          break;
        }
      }

      if (!defaults) {
        // Default deny all
        defaults = {
          lead: { discover: false, open: false, create: false, edit: false, delete: false, export: false, print: false },
          student: { discover: true, open: true, create: false, edit: false, delete: false, export: false, print: false },
          employee: { discover: false, open: false, create: false, edit: false, delete: false, export: false, print: false },
          finance: { discover: false, open: false, create: false, edit: false, delete: false, export: false, print: false },
          vendor: { discover: false, open: false, create: false, edit: false, delete: false, export: false, print: false },
          document: { discover: true, open: true, create: false, edit: false, delete: false, export: false, print: false },
        };
      }

      for (const [category, perms] of Object.entries(defaults)) {
        const existing = await ctx.db
          .query("categoryPermissions")
          .withIndex("designationId_category", (q: any) =>
            q.eq("designationId", designation._id).eq("category", category)
          )
          .first();

        if (!existing) {
          const id = await ctx.db.insert("categoryPermissions", {
            designationId: designation._id,
            category,
            canDiscover: perms.discover,
            canOpen: perms.open,
            canCreate: perms.create,
            canEdit: perms.edit,
            canDelete: perms.delete,
            canExport: perms.export,
            canPrint: perms.print,
            createdAt: now,
            updatedAt: now,
          });
          results.push(id);
        }
      }
    }

    return results;
  }),
});

// ─── Set Policy on Record ─────────────────────────────────

export const assignPolicyToRecord = mutation({
  args: { token: v.optional(v.string()),
    module: v.string(),
    recordId: v.string(),
    policyCode: v.string(),
  },
  handler: withScopeAndEvents({ operation: "create", module: "security", entity: "securityPolicies" }, async (ctx, args) => {
    const policy = await ctx.db
      .query("visibilityPolicies")
      .withIndex("policyCode", (q: any) => q.eq("policyCode", args.policyCode))
      .first();

    if (!policy) throw new Error(`Policy not found: ${args.policyCode}`);

    const existing = await ctx.db
      .query("recordPolicies")
      .withIndex("module_recordId", (q: any) =>
        q.eq("module", args.module).eq("recordId", args.recordId)
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { policyId: policy._id, updatedAt: now });
      return existing._id;
    }

    return await ctx.db.insert("recordPolicies", {
      module: args.module,
      recordId: args.recordId,
      policyId: policy._id,
      createdAt: now,
      updatedAt: now,
    });
  }),
});

// ─── Get Policy Stats ─────────────────────────────────────

export const getPolicyStats = query({
  args: {},
  handler: async (ctx) => {
    const policies = await ctx.db.query("visibilityPolicies").collect();
    const totalRecords = (await ctx.db.query("recordPolicies").collect()).length;

    return {
      totalPolicies: policies.length,
      activePolicies: policies.filter((p) => p.active).length,
      byLevel: policies.reduce((acc: Record<string, number>, p) => {
        acc[p.securityLevel] = (acc[p.securityLevel] || 0) + 1;
        return acc;
      }, {}),
      totalRecordPolicies: totalRecords,
    };
  },
});

// ─── Audit Dashboard ──────────────────────────────────────

export const getAccessAuditStats = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 7;
    const since = Date.now() - (days * 24 * 60 * 60 * 1000);

    const allLogs = await ctx.db.query("accessAuditLogs").collect();
    const recentLogs = allLogs.filter((l) => l.timestamp >= since);

    const granted = recentLogs.filter((l) => l.result === "granted").length;
    const denied = recentLogs.filter((l) => l.result === "denied").length;

    const byModule = recentLogs.reduce((acc: Record<string, number>, l) => {
      acc[l.module] = (acc[l.module] || 0) + 1;
      return acc;
    }, {});

    const byUser = recentLogs.reduce((acc: Record<string, number>, l) => {
      acc[l.userId] = (acc[l.userId] || 0) + 1;
      return acc;
    }, {});

    return {
      totalAccesses: recentLogs.length,
      granted,
      denied,
      denyRate: recentLogs.length > 0 ? Math.round((denied / recentLogs.length) * 100) : 0,
      byModule,
      byUser,
      topDeniedUsers: Object.entries(byUser)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
    };
  },
});
