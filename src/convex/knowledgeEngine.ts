/**
 * Knowledge Engine — Enterprise Wiki, SOPs, Articles, FAQ & Policies
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createCategory = mutation({
  args: { name: v.string(), slug: v.string(), description: v.optional(v.string()), parentId: v.optional(v.id("knowledgeCategories")), icon: v.optional(v.string()) },
  handler: async (ctx, args) => ctx.db.insert("knowledgeCategories", { name: args.name, description: args.description, parentId: args.parentId, icon: args.icon, articleCount: 0, createdAt: Date.now(), updatedAt: Date.now() }),
});

export const listCategories = query({ handler: async (ctx) => ctx.db.query("knowledgeCategories").collect() });

export const createArticle = mutation({
  args: {
    title: v.string(), slug: v.string(), content: v.string(), categoryId: v.id("knowledgeCategories"),
    articleType: v.union(v.literal("wiki"), v.literal("sop"), v.literal("article"), v.literal("faq"), v.literal("policy"), v.literal("playbook")),
    tags: v.optional(v.array(v.string())), isPublished: v.optional(v.boolean()),
    relatedArticleIds: v.optional(v.array(v.id("knowledgeArticles"))), module: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const articleId = await ctx.db.insert("knowledgeArticles", {
      title: args.title, slug: args.slug, body: args.content || "", content: args.content, categoryId: args.categoryId,
      tags: args.tags || [], isPublished: args.isPublished || false,
      version: 1, views: 0, helpfulCount: 0, notHelpfulCount: 0, authorId: args.createdBy || userId,
      createdAt: Date.now(), updatedAt: Date.now(),
    });
    const cat = await ctx.db.get(args.categoryId);
    if (cat) await ctx.db.patch(args.categoryId, { articleCount: ((cat as any).articleCount || 0) + 1 });
    return articleId;
  },
});

export const updateArticle = mutation({
  args: { id: v.id("knowledgeArticles"), title: v.optional(v.string()), content: v.optional(v.string()), tags: v.optional(v.array(v.string())), isPublished: v.optional(v.boolean()), relatedArticleIds: v.optional(v.array(v.id("knowledgeArticles"))) },
  handler: async (ctx, args) => {
    const article = await ctx.db.get(args.id);
    if (!article) throw new Error("Article not found");
    await ctx.db.insert("knowledgeArticleVersions", {
      articleId: args.id, title: article.title, content: article.content, version: (article as any).version || 1,
      updatedBy: await getAuthUserId(ctx), updatedAt: Date.now(),
    });
    const { id } = args;
    const updates: Record<string, any> = { title: args.title, content: args.content, tags: args.tags, isPublished: args.isPublished };
    await ctx.db.patch(id, { ...updates, version: ((article as any).version || 1) + 1, updatedAt: Date.now() });
    return id;
  },
});

export const listArticles = query({
  args: { categoryId: v.optional(v.id("knowledgeCategories")), articleType: v.optional(v.string()), tag: v.optional(v.string()), module: v.optional(v.string()), isPublished: v.optional(v.boolean()), searchQuery: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    let articles = await ctx.db.query("knowledgeArticles").collect();
    if (args.categoryId) articles = articles.filter((a: any) => a.categoryId === args.categoryId);
    if (args.articleType) articles = articles.filter((a: any) => a.articleType === args.articleType);
    if (args.tag) articles = articles.filter((a: any) => (a as any).tags?.includes(args.tag));
    if (args.module) articles = articles.filter((a: any) => a.module === args.module);
    if (args.isPublished !== undefined) articles = articles.filter((a: any) => a.isPublished === args.isPublished);
    if (args.searchQuery) { const q = args.searchQuery.toLowerCase(); articles = articles.filter((a: any) => a.title.toLowerCase().includes(q) || (a as any).content?.toLowerCase().includes(q)); }
    articles.sort((a, b) => b.createdAt - a.createdAt);
    return args.limit ? articles.slice(0, args.limit) : articles;
  },
});

export const getArticle = query({
  args: { id: v.id("knowledgeArticles") },
  handler: async (ctx, args) => {
    const article = await ctx.db.get(args.id);
    if (!article) return null;
    await (ctx as any).db.patch(args.id, { viewCount: ((article as any).viewCount || 0) + 1 });
    const relatedIds = (article as any).relatedArticleIds || [];
    const related = await Promise.all(relatedIds.map((rid: string) => ctx.db.get(rid as any)));
    const versions = await ctx.db.query("knowledgeArticleVersions").withIndex("articleId", (q: any) => q.eq("articleId", args.id)).order("desc").collect();
    return { ...article, related: related.filter(Boolean), versions: versions.slice(0, 10) };
  },
});

export const markHelpful = mutation({
  args: { id: v.id("knowledgeArticles"), helpful: v.boolean() },
  handler: async (ctx, args) => {
    const article = await ctx.db.get(args.id);
    if (!article) throw new Error("Article not found");
    await ctx.db.patch(args.id, args.helpful ? { helpfulCount: ((article as any).helpfulCount || 0) + 1 } : { notHelpfulCount: ((article as any).notHelpfulCount || 0) + 1 });
    return args.id;
  },
});

export const getKnowledgeDashboard = query({
  handler: async (ctx) => {
    const articles = await ctx.db.query("knowledgeArticles").collect();
    return {
      totalArticles: articles.length, published: articles.filter((a: any) => a.isPublished).length,
      drafts: articles.filter((a: any) => !a.isPublished).length,
      totalViews: articles.reduce((s: number, a: any) => s + (a.viewCount || 0), 0),
      byType: { wiki: articles.filter((a: any) => a.articleType === "wiki").length, sop: articles.filter((a: any) => a.articleType === "sop").length, article: articles.filter((a: any) => a.articleType === "article").length, faq: articles.filter((a: any) => a.articleType === "faq").length, policy: articles.filter((a: any) => a.articleType === "policy").length, playbook: articles.filter((a: any) => a.articleType === "playbook").length },
    };
  },
});
