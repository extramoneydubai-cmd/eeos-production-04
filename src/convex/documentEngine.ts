/**
 * Document Engine — Enterprise-Integrated
 *
 * All mutations use withScopeAndEvents for enterprise adoption.
 * ✓ ScopeEngine authorization  ✓ Event Pipeline
 * ✓ Timeline auto-recording    ✓ Notification routing
 * ✓ Search indexing            ✓ Dashboard refresh
 */

import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { withScopeAndEvents, type ScopeAndEventsConfig } from "./withScopeAndEvents";
import { Id } from "./_generated/dataModel";
import { paginatedQuery, applyStandardFilters, batchGet, type PaginatedResponse } from "./queryHelpers";

// ─── Enterprise Handler Factory ──────────────────────────────

function withDoc<P = any, R = any>(
  operation: ScopeAndEventsConfig<P, R>["operation"],
  entity: string,
  getScope: (args: P) => { companyId?: string; branchId?: string },
  handler: (ctx: any, args: P, userId: Id<"users">) => Promise<R>,
) {
  return async (ctx: any, args: P) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const scope = getScope(args);
    const wrapped = withScopeAndEvents<P, R>(
      {
        operation,
        module: "documents",
        entity,
        getEntityCompanyId: () => scope.companyId,
        getEntityBranchId: () => scope.branchId,
        getUserId: () => userId as Id<"users">,
        notifyViaMatrix: true,
        registerSearch: true,
        signalDashboard: true,
      },
      (ctx2, args2) => handler(ctx2, args2, userId as Id<"users">),
    );
    return wrapped(ctx, args);
  };
}

// ─── FOLDERS ─────────────────────────────────────────

export const createFolder = mutation({
  args: {
    name: v.string(),
    parentId: v.optional(v.id("documentFolders")),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: withDoc("create", "folder", (a) => ({
    companyId: a.companyId,
    branchId: a.branchId,
  }), async (ctx, args, userId) => {
    const { companyId, branchId, ...rest } = args;
    return ctx.db.insert("documentFolders", {
      ...rest,
      isActive: true,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }),
});

export const listFolders = query({
  args: {
    paginationOpts: v.optional(paginationOptsValidator),
    parentId: v.optional(v.id("documentFolders")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const all = await ctx.db.query("documentFolders").filter((q: any) => q.eq(q.field("isActive"), true)).collect();
    let filtered = all.filter((f: any) => f.isActive);
    if (args.parentId) filtered = filtered.filter((f: any) => f.parentId === args.parentId);
    else filtered = filtered.filter((f: any) => !f.parentId);
    if (userId) {
      const { ScopeEngine } = await import("./scopeEngine");
      const scope = await ScopeEngine.forUser(ctx, userId);
      return scope.filterByScope(filtered);
    }
    return filtered;
  },
});

// ─── TAGS ────────────────────────────────────────────

export const createTag = mutation({
  args: {
    name: v.string(),
    color: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: withDoc("create", "tag", (a) => ({
    companyId: a.companyId,
    branchId: a.branchId,
  }), async (ctx, args, userId) => {
    return ctx.db.insert("documentTags", { ...args, isActive: true, createdAt: Date.now() });
  }),
});

export const listTags = query({
  args: { paginationOpts: v.optional(paginationOptsValidator) },
  handler: async (ctx) => {
    return ctx.db.query("documentTags").filter((q: any) => q.eq(q.field("isActive"), true)).collect();
  },
});

// ─── DOCUMENT UPLOAD ───────────────────────────────

export const uploadDocument = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    fileUrl: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    fileHash: v.optional(v.string()),
    folderId: v.optional(v.id("documentFolders")),
    tags: v.optional(v.array(v.id("documentTags"))),
    referenceType: v.optional(v.union(
      v.literal("person"), v.literal("student"), v.literal("employee"),
      v.literal("lead"), v.literal("invoice"), v.literal("task"),
      v.literal("exam"), v.literal("course"), v.literal("vendor"),
      v.literal("asset"), v.literal("workflow"), v.literal("project"),
      v.literal("procurement"), v.literal("general"),
    )),
    referenceId: v.optional(v.string()),
    expiryDate: v.optional(v.number()),
    thumbnailUrl: v.optional(v.string()),
    checksum: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: withDoc("create", "document", (a) => ({
    companyId: a.companyId,
    branchId: a.branchId,
  }), async (ctx, args, userId) => {
    const { companyId, branchId, ...rest } = args;
    const docId = await ctx.db.insert("documents", {
      ...rest,
      version: 1,
      isArchived: false,
      uploadedBy: userId,
      downloadCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return docId;
  }),
});

// ─── DOCUMENT UPDATE / VERSION ─────────────────────

export const updateDocument = mutation({
  args: {
    id: v.id("documents"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.id("documentTags"))),
    folderId: v.optional(v.id("documentFolders")),
    expiryDate: v.optional(v.number()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: withDoc("update", "document", (a) => ({
    companyId: a.companyId,
    branchId: a.branchId,
  }), async (ctx, args, userId) => {
    const { id, companyId, branchId, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    return id;
  }),
});

export const createNewVersion = mutation({
  args: {
    documentId: v.id("documents"),
    fileUrl: v.string(),
    fileSize: v.number(),
    fileHash: v.optional(v.string()),
    changeNotes: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: withDoc("update", "document_version", (a) => ({
    companyId: a.companyId,
    branchId: a.branchId,
  }), async (ctx, args, userId) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc) throw new Error("Document not found");
    const newVersion = ((doc as any).version || 1) + 1;

    await ctx.db.insert("documentVersions", {
      documentId: args.documentId,
      versionNumber: newVersion,
      fileUrl: args.fileUrl,
      fileSize: args.fileSize,
      fileHash: args.fileHash,
      changeNotes: args.changeNotes,
      uploadedBy: userId,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.documentId, {
      fileUrl: args.fileUrl,
      fileSize: args.fileSize,
      fileHash: args.fileHash,
      version: newVersion,
      updatedAt: Date.now(),
    });

    return { versionNumber: newVersion };
  }),
});

// ─── DOWNLOAD TRACKING ─────────────────────────────

export const recordDownload = mutation({
  args: { documentId: v.id("documents") },
  handler: withDoc("update", "document_download", () => ({}), async (ctx, args, userId) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc) throw new Error("Document not found");
    const newCount = ((doc as any).downloadCount || 0) + 1;
    await ctx.db.patch(args.documentId, {
      downloadCount: newCount,
      lastDownloadedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { downloadCount: newCount };
  }),
});

// ─── DELETE / ARCHIVE ──────────────────────────────

export const archiveDocument = mutation({
  args: {
    id: v.id("documents"),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: withDoc("delete", "document", (a) => ({
    companyId: a.companyId,
    branchId: a.branchId,
  }), async (ctx, args, userId) => {
    await ctx.db.patch(args.id, { isArchived: true, updatedAt: Date.now() });
    return args.id;
  }),
});

export const restoreDocument = mutation({
  args: {
    id: v.id("documents"),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: withDoc("update", "document", (a) => ({
    companyId: a.companyId,
    branchId: a.branchId,
  }), async (ctx, args) => {
    await ctx.db.patch(args.id, { isArchived: false, updatedAt: Date.now() });
    return args.id;
  }),
});

// ─── PERMISSIONS ───────────────────────────────────

export const setDocumentPermission = mutation({
  args: {
    documentId: v.id("documents"),
    permissionType: v.union(v.literal("user"), v.literal("role"), v.literal("department"), v.literal("public")),
    targetId: v.string(),
    canView: v.boolean(),
    canDownload: v.optional(v.boolean()),
    canEdit: v.optional(v.boolean()),
    canDelete: v.optional(v.boolean()),
    canShare: v.optional(v.boolean()),
    expiresAt: v.optional(v.number()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
  },
  handler: withDoc("update", "document_permission", (a) => ({
    companyId: a.companyId,
    branchId: a.branchId,
  }), async (ctx, args, userId) => {
    const existing = await ctx.db.query("documentPermissions")
      .withIndex("documentId", (q: any) => q.eq("documentId", args.documentId))
      .collect()
      .then((perms: any[]) => perms.find((p: any) =>
        p.permissionType === args.permissionType && p.targetId === args.targetId
      ));

    if (existing) {
      await ctx.db.patch(existing._id, {
        canView: args.canView,
        canDownload: args.canDownload ?? existing.canDownload,
        canEdit: args.canEdit ?? existing.canEdit,
        canDelete: args.canDelete ?? existing.canDelete,
        canShare: args.canShare ?? existing.canShare,
        expiresAt: args.expiresAt ?? existing.expiresAt,
      });
    } else {
      await ctx.db.insert("documentPermissions", {
        documentId: args.documentId,
        permissionType: args.permissionType,
        targetId: args.targetId,
        canView: args.canView,
        canDownload: args.canDownload ?? args.canView,
        canEdit: args.canEdit ?? false,
        canDelete: args.canDelete ?? false,
        canShare: args.canShare ?? false,
        grantedBy: userId,
        grantedAt: Date.now(),
        expiresAt: args.expiresAt,
      });
    }
    return args.documentId;
  }),
});

// ─── QUERIES ──────────────────────────────────────

export const listDocuments = query({
  args: {
    paginationOpts: v.optional(paginationOptsValidator),
    folderId: v.optional(v.id("documentFolders")),
    referenceType: v.optional(v.union(
      v.literal("person"), v.literal("student"), v.literal("employee"),
      v.literal("lead"), v.literal("invoice"), v.literal("task"),
      v.literal("exam"), v.literal("course"), v.literal("vendor"),
      v.literal("asset"), v.literal("workflow"), v.literal("project"),
      v.literal("procurement"), v.literal("general"),
    )),
    referenceId: v.optional(v.string()),
    fileType: v.optional(v.string()),
    includeArchived: v.optional(v.boolean()),
    search: v.optional(v.string()),
    tagId: v.optional(v.id("documentTags")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const all = await ctx.db.query("documents").collect();
    let filtered = [...all];
    if (args.folderId) filtered = filtered.filter((d: any) => d.folderId === args.folderId);
    if (!args.includeArchived) filtered = filtered.filter((d: any) => !d.isArchived);
    if (args.fileType) filtered = filtered.filter((d: any) => d.fileType === args.fileType);
    if (args.referenceType && args.referenceId)
      filtered = filtered.filter((d: any) => d.referenceType === args.referenceType && d.referenceId === args.referenceId);
    if (args.tagId) filtered = filtered.filter((d: any) => d.tags && d.tags.includes(args.tagId));
    if (args.search) {
      const s = args.search.toLowerCase();
      filtered = filtered.filter((d: any) =>
        d.name.toLowerCase().includes(s) || (d.description && d.description.toLowerCase().includes(s))
      );
    }
    filtered.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));

    // Scope filtering
    if (userId) {
      const { ScopeEngine } = await import("./scopeEngine");
      const scope = await ScopeEngine.forUser(ctx, userId);
      filtered = scope.filterByScope(filtered);
    }

    const uploaderIds = [...new Set(filtered.map((d: any) => d.uploadedBy))];
    const uploaders = await batchGet<any>(ctx, uploaderIds);
    const uploaderMap = new Map(uploaders.filter(Boolean).map((u: any) => [u._id, u.name || "Unknown"]));

    const enriched = await Promise.all(filtered.map(async (doc: any) => {
      const versions = await ctx.db.query("documentVersions")
        .withIndex("documentId", (q: any) => q.eq("documentId", doc._id))
        .collect();
      return { ...doc, uploaderName: uploaderMap.get(doc.uploadedBy) || "Unknown", versionCount: versions.length };
    }));
    return enriched;
  },
});

export const getDocument = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) return null;
    const uploader = await ctx.db.get(doc.uploadedBy);
    const versions = await ctx.db.query("documentVersions").withIndex("documentId", (q: any) => q.eq("documentId", args.id)).order("desc").collect();
    const permissions = await ctx.db.query("documentPermissions").withIndex("documentId", (q: any) => q.eq("documentId", args.id)).collect();
    const timeline = await ctx.db.query("documentTimeline").withIndex("documentId", (q: any) => q.eq("documentId", args.id)).order("desc").collect();
    return { ...doc, uploaderName: uploader ? (uploader as any).name || "Unknown" : "Unknown", versions, permissions, timeline };
  },
});

export const getDocumentTimeline = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    return ctx.db.query("documentTimeline").withIndex("documentId", (q: any) => q.eq("documentId", args.documentId)).order("desc").collect();
  },
});

// ─── DOCUMENT DASHBOARD ─────────────────────────────

export const getDocumentDashboard = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const docs = await ctx.db.query("documents").collect();
    const folders = await ctx.db.query("documentFolders").filter((q: any) => q.eq(q.field("isActive"), true)).collect();

    let scoped = docs;
    if (userId) {
      const { ScopeEngine } = await import("./scopeEngine");
      const scope = await ScopeEngine.forUser(ctx, userId);
      scoped = scope.filterByScope(docs);
    }

    const activeDocs = scoped.filter((d: any) => !d.isArchived);
    const byType: Record<string, number> = {};
    for (const d of activeDocs) { const ft = (d as any).fileType || "other"; byType[ft] = (byType[ft] || 0) + 1; }
    const byReference: Record<string, number> = {};
    for (const d of activeDocs) { const rt = (d as any).referenceType || "unlinked"; byReference[rt] = (byReference[rt] || 0) + 1; }
    const totalSize = activeDocs.reduce((s: number, d: any) => s + (d.fileSize || 0), 0);
    const expired = activeDocs.filter((d: any) => d.expiryDate && d.expiryDate < Date.now());

    return {
      totalDocuments: activeDocs.length,
      totalArchived: docs.filter((d: any) => d.isArchived).length,
      totalFolders: folders.length,
      totalSize,
      expiredCount: expired.length,
      uniqueUploaders: new Set(activeDocs.map((d: any) => d.uploadedBy)).size,
      byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
      byReference: Object.entries(byReference).map(([referenceType, count]) => ({ referenceType, count })),
    };
  },
});
