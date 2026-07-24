import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── FOLDERS ─────────────────────────────────────────

export const createFolder = mutation({
  args: {
    name: v.string(),
    parentId: v.optional(v.id("documentFolders")),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db.insert("documentFolders", {
      ...args,
      isActive: true,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const listFolders = query({
  args: { parentId: v.optional(v.id("documentFolders")) },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("documentFolders").filter((q: any) => q.eq(q.field("isActive"), true));
    if (args.parentId) {
      query = query.filter((q: any) => q.eq(q.field("parentId"), args.parentId));
    } else {
      query = query.filter((q: any) => q.eq(q.field("parentId"), undefined));
    }
    return query.collect();
  },
});

// ─── TAGS ────────────────────────────────────────────

export const createTag = mutation({
  args: { name: v.string(), color: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return ctx.db.insert("documentTags", { ...args, isActive: true, createdAt: Date.now() });
  },
});

export const listTags = query({
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const docId = await ctx.db.insert("documents", {
      ...args,
      version: 1,
      isArchived: false,
      uploadedBy: userId,
      downloadCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create timeline event
    await ctx.db.insert("documentTimeline", {
      documentId: docId,
      eventType: "uploaded",
      description: `Document uploaded: ${args.name}`,
      performedBy: userId,
      metadata: JSON.stringify({ fileType: args.fileType, fileSize: args.fileSize }),
      createdAt: Date.now(),
    });

    return docId;
  },
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
    referenceType: v.optional(v.union(
      v.literal("person"), v.literal("student"), v.literal("employee"),
      v.literal("lead"), v.literal("invoice"), v.literal("task"),
      v.literal("exam"), v.literal("course"), v.literal("vendor"),
      v.literal("asset"), v.literal("workflow"), v.literal("project"),
      v.literal("procurement"), v.literal("general"),
    )),
    referenceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });

    await ctx.db.insert("documentTimeline", {
      documentId: id,
      eventType: "updated",
      description: `Document metadata updated`,
      performedBy: userId,
      createdAt: Date.now(),
    });

    return id;
  },
});

export const createNewVersion = mutation({
  args: {
    documentId: v.id("documents"),
    fileUrl: v.string(),
    fileSize: v.number(),
    fileHash: v.optional(v.string()),
    changeNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const doc = await ctx.db.get(args.documentId);
    if (!doc) throw new Error("Document not found");

    const newVersion = ((doc as any).version || 1) + 1;

    // Record version
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

    // Update document
    await ctx.db.patch(args.documentId, {
      fileUrl: args.fileUrl,
      fileSize: args.fileSize,
      fileHash: args.fileHash,
      version: newVersion,
      updatedAt: Date.now(),
    });

    // Timeline event
    await ctx.db.insert("documentTimeline", {
      documentId: args.documentId,
      eventType: "version_created",
      description: `Version ${newVersion} created${args.changeNotes ? `: ${args.changeNotes}` : ""}`,
      performedBy: userId,
      metadata: JSON.stringify({ versionNumber: newVersion, fileSize: args.fileSize }),
      createdAt: Date.now(),
    });

    return { versionNumber: newVersion };
  },
});

// ─── DOWNLOAD TRACKING ─────────────────────────────

export const recordDownload = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc) throw new Error("Document not found");

    const newCount = ((doc as any).downloadCount || 0) + 1;
    await ctx.db.patch(args.documentId, {
      downloadCount: newCount,
      lastDownloadedAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("documentTimeline", {
      documentId: args.documentId,
      eventType: "downloaded",
      description: `Document downloaded (${newCount})`,
      performedBy: (doc as any).uploadedBy,
      metadata: JSON.stringify({ downloadCount: newCount }),
      createdAt: Date.now(),
    });

    return { downloadCount: newCount };
  },
});

// ─── DELETE / ARCHIVE ──────────────────────────────

export const archiveDocument = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Document not found");

    await ctx.db.patch(args.id, { isArchived: true, updatedAt: Date.now() });

    await ctx.db.insert("documentTimeline", {
      documentId: args.id,
      eventType: "deleted",
      description: `Document archived: ${(doc as any).name}`,
      performedBy: userId || (doc as any).uploadedBy,
      createdAt: Date.now(),
    });

    return args.id;
  },
});

export const restoreDocument = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    await ctx.db.patch(args.id, { isArchived: false, updatedAt: Date.now() });

    await ctx.db.insert("documentTimeline", {
      documentId: args.id,
      eventType: "restored",
      description: "Document restored from archive",
      performedBy: userId || "",
      createdAt: Date.now(),
    });

    return args.id;
  },
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check for existing permission
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
  },
});

// ─── QUERIES ──────────────────────────────────────

export const listDocuments = query({
  args: {
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
    let query: any = ctx.db.query("documents");

    if (args.folderId) {
      query = query.filter((q: any) => q.eq(q.field("folderId"), args.folderId));
    }
    if (!args.includeArchived) {
      query = query.filter((q: any) => q.eq(q.field("isArchived"), false));
    }
    if (args.fileType) {
      query = query.filter((q: any) => q.eq(q.field("fileType"), args.fileType));
    }

    let results = await query.order("desc").collect();

    // Filter by polymorphic reference
    if (args.referenceType && args.referenceId) {
      results = results.filter((d: any) =>
        d.referenceType === args.referenceType && d.referenceId === args.referenceId
      );
    }

    // Filter by tag
    if (args.tagId) {
      results = results.filter((d: any) => d.tags && d.tags.includes(args.tagId));
    }

    // Text search
    if (args.search) {
      const s = args.search.toLowerCase();
      results = results.filter((d: any) =>
        d.name.toLowerCase().includes(s) ||
        (d.description && d.description.toLowerCase().includes(s))
      );
    }

    // Enrich with uploader name
    const enriched = await Promise.all(results.map(async (doc: any) => {
      const uploader = await ctx.db.get(doc.uploadedBy);
      let versionCount = 0;
      const versions = await ctx.db.query("documentVersions")
        .withIndex("documentId", (q: any) => q.eq("documentId", doc._id))
        .collect();
      versionCount = versions.length;

      return {
        ...doc,
        uploaderName: uploader ? (uploader as any).name || "Unknown" : "Unknown",
        versionCount,
      };
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
    const versions = await ctx.db.query("documentVersions")
      .withIndex("documentId", (q: any) => q.eq("documentId", args.id))
      .order("desc")
      .collect();
    const permissions = await ctx.db.query("documentPermissions")
      .withIndex("documentId", (q: any) => q.eq("documentId", args.id))
      .collect();
    const timeline = await ctx.db.query("documentTimeline")
      .withIndex("documentId", (q: any) => q.eq("documentId", args.id))
      .order("desc")
      .collect();

    return {
      ...doc,
      uploaderName: uploader ? (uploader as any).name || "Unknown" : "Unknown",
      versions,
      permissions,
      timeline,
    };
  },
});

export const getDocumentTimeline = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    return ctx.db.query("documentTimeline")
      .withIndex("documentId", (q: any) => q.eq("documentId", args.documentId))
      .order("desc")
      .collect();
  },
});

// ─── DOCUMENT DASHBOARD ─────────────────────────────

export const getDocumentDashboard = query({
  handler: async (ctx) => {
    const docs = await ctx.db.query("documents").collect();
    const activeDocs = docs.filter((d: any) => !d.isArchived);
    const folders = await ctx.db.query("documentFolders").filter((q: any) => q.eq(q.field("isActive"), true)).collect();

    // Group by file type
    const byType: Record<string, number> = {};
    for (const d of activeDocs) {
      const ft = (d as any).fileType || "other";
      byType[ft] = (byType[ft] || 0) + 1;
    }

    // Group by reference type
    const byReference: Record<string, number> = {};
    for (const d of activeDocs) {
      const rt = (d as any).referenceType || "unlinked";
      byReference[rt] = (byReference[rt] || 0) + 1;
    }

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
      totalVersions: await ctx.db.query("documentVersions").collect().then((v: any[]) => v.length),
      recentActivity: await ctx.db.query("documentTimeline")
        .order("desc")
        .collect()
        .then((t: any[]) => t.slice(0, 10)),
    };
  },
});
