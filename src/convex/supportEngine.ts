/**
 * SupportEngine — Enterprise Service Desk & Ticketing (Convex SupportRuntime)
 *
 * Registered per PATCH-ERP-003 Phase 4 ("Register SupportRuntime only if
 * persistence is genuinely missing"). Persistence WAS genuinely missing:
 * every Support page consumed a client-side in-memory engine
 * (src/platform/support/SupportEngine) while the full support schema
 * (ticketMaster, ticketComments, ticketTimeline, ticketSLA, ticketAssignments,
 * ticketCategories, knowledgeArticles, knowledgeCategories) sat unwired.
 *
 * This module is the single Convex runtime for tickets. It reuses ONLY the
 * existing support tables — no new schema, no duplicate engines.
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ─── Constants ─────────────────────────────────────────────────

const OPEN_STATUSES = ["new", "open", "in_progress", "pending"];
const DEFAULT_RESPONSE_MINUTES = 240; // 4h
const DEFAULT_RESOLUTION_MINUTES = 1440; // 24h

function ticketNumberFor(count: number): string {
  const year = new Date().getFullYear();
  return `SVC-${year}-${String(count + 1).padStart(4, "0")}`;
}

async function pushTimeline(
  ctx: any,
  ticketId: string,
  eventType: string,
  description: string,
  actorName?: string,
) {
  await ctx.db.insert("ticketTimeline", {
    ticketId,
    eventType,
    description,
    actorName: actorName || "System",
    timestamp: Date.now(),
  });
}

// ─── Queries ───────────────────────────────────────────────────

/** List tickets with the same filters the old client engine exposed. */
export const listTickets = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    type: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("ticketMaster").collect();

    let filtered = all;
    if (args.search) {
      const q = args.search.toLowerCase();
      filtered = filtered.filter(
        (t: any) =>
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.ticketNumber && t.ticketNumber.toLowerCase().includes(q)) ||
          (t.requesterName && t.requesterName.toLowerCase().includes(q)) ||
          (t.requesterEmail && t.requesterEmail.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q)),
      );
    }
    if (args.status) filtered = filtered.filter((t: any) => t.status === args.status);
    if (args.priority) filtered = filtered.filter((t: any) => t.priority === args.priority);
    if (args.type) filtered = filtered.filter((t: any) => t.type === args.type);
    if (args.assignedTo) filtered = filtered.filter((t: any) => t.assignedTo === args.assignedTo);

    const tickets = filtered.sort((a: any, b: any) => b.createdAt - a.createdAt);

    // Global status counts (unfiltered) so headers stay meaningful under filters.
    const counts: Record<string, number> = { total: all.length, open: 0, resolved: 0, closed: 0 };
    for (const t of all as any[]) {
      if (OPEN_STATUSES.includes(t.status)) counts.open++;
      if (t.status === "resolved") counts.resolved++;
      if (t.status === "closed") counts.closed++;
    }

    return { tickets, counts };
  },
});

/** Full support dashboard aggregate (mirrors the old client calculateMetrics + SLA/KB stats). */
export const getSupportDashboard = query({
  handler: async (ctx) => {
    const [tickets, articles] = await Promise.all([
      ctx.db.query("ticketMaster").collect(),
      ctx.db.query("knowledgeArticles").collect(),
    ]);

    const sorted = tickets.sort((a: any, b: any) => b.createdAt - a.createdAt);

    // SLA stats (from ticket SLA fields)
    const withSla = (tickets as any[]).filter((t) => t.slaBreached !== undefined || t.responseDueAt || t.resolutionDueAt);
    const breached = withSla.filter((t) => t.slaBreached).length;
    const withinSLA = withSla.length - breached;

    // Escalation stats
    const escalated = (tickets as any[]).filter((t) => t.isEscalated).length;
    const escalationRate = tickets.length > 0 ? Math.round((escalated / tickets.length) * 100) : 0;

    // Metrics: FRT / resolution / CSAT / reopened rate / agent workload
    const withFrt = (tickets as any[]).filter((t) => t.firstResponseAt && t.createdAt);
    const withRes = (tickets as any[]).filter((t) => t.resolvedAt && t.createdAt);
    const rated = (tickets as any[]).filter((t) => typeof t.satisfactionRating === "number");
    const reopened = (tickets as any[]).filter((t) => (t.reopenedCount || 0) > 0);

    const agentMap: Record<string, any> = {};
    for (const t of tickets as any[]) {
      if (!t.assignedTo) continue;
      const w = agentMap[t.assignedTo] || {
        agentId: t.assignedTo,
        assignedCount: 0,
        openCount: 0,
        inProgressCount: 0,
        resolvedToday: 0,
      };
      w.assignedCount++;
      if (OPEN_STATUSES.includes(t.status)) w.openCount++;
      if (t.status === "in_progress") w.inProgressCount++;
      if (t.resolvedAt && t.resolvedAt >= new Date().setHours(0, 0, 0, 0)) w.resolvedToday++;
      agentMap[t.assignedTo] = w;
    }

    const counts: Record<string, number> = { total: tickets.length, open: 0, resolved: 0, closed: 0 };
    for (const t of tickets as any[]) {
      if (OPEN_STATUSES.includes(t.status)) counts.open++;
      if (t.status === "resolved") counts.resolved++;
      if (t.status === "closed") counts.closed++;
    }

    const published = (articles as any[]).filter((a) => a.isPublished);
    const totalViews = (published as any[]).reduce((s, a) => s + (a.views || 0), 0);

    return {
      tickets: sorted,
      counts,
      slaStats: {
        complianceRate: withSla.length > 0 ? Math.round((withinSLA / withSla.length) * 100) : 100,
        withinSLA,
        breached,
      },
      escalationStats: {
        escalated,
        escalationRate: `${escalationRate}%`,
      },
      metrics: {
        overview: {
          avgFirstReponseMinutes: withFrt.length > 0 ? Math.round(withFrt.reduce((s, t) => s + (t.firstResponseAt - t.createdAt), 0) / withFrt.length / 60000) : 0,
          avgResolutionHours: withRes.length > 0 ? Math.round(withRes.reduce((s, t) => s + (t.resolvedAt - t.createdAt), 0) / withRes.length / 3600000) : 0,
          avgCsat: rated.length > 0 ? Math.round((rated.reduce((s, t) => s + t.satisfactionRating, 0) / rated.length) * 10) / 10 : null,
          reopenedRate: tickets.length > 0 ? Math.round((reopened.length / tickets.length) * 100) : 0,
        },
        agentWorkloads: Object.values(agentMap),
      },
      kbStats: {
        totalArticles: articles.length,
        published: published.length,
        totalViews,
      },
    };
  },
});

/** Ticket detail with conversation, timeline, SLA and related KB articles. */
export const getTicket = query({
  args: { ticketId: v.id("ticketMaster") },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) return { ticket: null, comments: [], timeline: [], sla: null, relatedArticles: [] };

    const [comments, timeline, slaRows, articles] = await Promise.all([
      ctx.db.query("ticketComments").withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId)).collect(),
      ctx.db.query("ticketTimeline").withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId)).collect(),
      ctx.db.query("ticketSLA").withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId)).collect(),
      ctx.db.query("knowledgeArticles").collect(),
    ]);

    const published = (articles as any[])
      .filter((a) => a.isPublished)
      .sort((a: any, b: any) => (b.views || 0) - (a.views || 0));

    const relatedArticles = published
      .filter((a: any) => (a.relatedTicketTypes || []).includes((ticket as any).type))
      .concat(published.filter((a: any) => !(a.relatedTicketTypes || []).includes((ticket as any).type)))
      .slice(0, 5);

    return {
      ticket,
      comments: comments.sort((a: any, b: any) => a.createdAt - b.createdAt),
      timeline: timeline.sort((a: any, b: any) => a.timestamp - b.timestamp),
      sla: slaRows[0] || null,
      relatedArticles,
    };
  },
});

/** Active ticket categories (types / departments) for pickers. */
export const listTicketCategories = query({
  handler: async (ctx) => {
    const cats = await ctx.db.query("ticketCategories").collect();
    return cats.filter((c: any) => c.isActive !== false).sort((a: any, b: any) => a.name.localeCompare(b.name));
  },
});

/** Published knowledge base articles. */
export const listKnowledgeArticles = query({
  handler: async (ctx) => {
    const articles = await ctx.db.query("knowledgeArticles").collect();
    return articles.filter((a: any) => a.isPublished).sort((a: any, b: any) => (b.views || 0) - (a.views || 0));
  },
});

/** Active users available for ticket assignment. */
export const getAssignableAgents = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users
      .filter((u: any) => !u.isDisabled)
      .map((u: any) => ({ _id: u._id, name: u.name, email: u.email, role: u.role }));
  },
});

// ─── Mutations ─────────────────────────────────────────────────

/** Create a ticket + default SLA row + timeline event. */
export const createTicket = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    type: v.optional(v.string()),
    priority: v.optional(v.string()),
    status: v.optional(v.string()),
    category: v.optional(v.string()),
    source: v.optional(v.string()),
    requesterName: v.optional(v.string()),
    requesterEmail: v.optional(v.string()),
    requesterType: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    performerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("ticketMaster").collect();
    const now = Date.now();

    const ticketId = await ctx.db.insert("ticketMaster", {
      ticketNumber: ticketNumberFor(all.length),
      title: args.title,
      description: args.description,
      type: args.type || "support",
      priority: args.priority || "medium",
      status: args.status || "new",
      category: args.category,
      source: args.source || "portal",
      requesterName: args.requesterName,
      requesterEmail: args.requesterEmail,
      requesterType: args.requesterType,
      assignedTo: args.assignedTo,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("ticketSLA", {
      ticketId,
      policyName: "Default",
      responseMinutes: DEFAULT_RESPONSE_MINUTES,
      resolutionMinutes: DEFAULT_RESOLUTION_MINUTES,
      responseDeadline: now + DEFAULT_RESPONSE_MINUTES * 60000,
      resolutionDeadline: now + DEFAULT_RESOLUTION_MINUTES * 60000,
      createdAt: now,
      updatedAt: now,
    });

    await pushTimeline(ctx, ticketId, "created", "Ticket created", args.performerName);
    return ticketId;
  },
});

/** Update status / priority / assignee with transition bookkeeping + timeline. */
export const updateTicket = mutation({
  args: {
    ticketId: v.id("ticketMaster"),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    performerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    const now = Date.now();
    const patch: Record<string, any> = { updatedAt: now };

    if (args.status && args.status !== (ticket as any).status) {
      patch.status = args.status;
      const old = (ticket as any).status;
      if (["in_progress", "open"].includes(args.status) && !(ticket as any).firstResponseAt) {
        patch.firstResponseAt = now;
        patch.firstResponseBy = (ticket as any).assignedTo || undefined;
      }
      if (args.status === "resolved") patch.resolvedAt = (ticket as any).resolvedAt || now;
      if (args.status === "closed") patch.closedAt = now;
      if (args.status === "reopened") patch.reopenedCount = ((ticket as any).reopenedCount || 0) + 1;
      await pushTimeline(ctx, args.ticketId, "status_changed", `Status changed from ${old} to ${args.status}`, args.performerName);

      if (args.status === "resolved") {
        const slaRows = await ctx.db.query("ticketSLA").withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId)).collect();
        if (slaRows[0]) {
          const sla = slaRows[0] as any;
          await ctx.db.patch(sla._id, {
            resolvedAt: now,
            resolutionSlaMet: now <= sla.resolutionDeadline,
            updatedAt: now,
          });
        }
      }
    }

    if (args.priority && args.priority !== (ticket as any).priority) {
      patch.priority = args.priority;
      await pushTimeline(ctx, args.ticketId, "priority_changed", `Priority changed to ${args.priority}`, args.performerName);
    }
    if (args.assignedTo && args.assignedTo !== (ticket as any).assignedTo) {
      patch.assignedTo = args.assignedTo;
      await ctx.db.insert("ticketAssignments", {
        ticketId: args.ticketId,
        assignedTo: args.assignedTo,
        assignmentType: "manual",
        createdAt: now,
      });
      const user = await ctx.db.get(args.assignedTo);
      await pushTimeline(ctx, args.ticketId, "assigned", `Assigned to ${(user as any)?.name || args.assignedTo}`, args.performerName);
    }
    if (args.title) patch.title = args.title;
    if (args.description !== undefined) patch.description = args.description;

    await ctx.db.patch(args.ticketId, patch);
    return args.ticketId;
  },
});

/** Add a comment (or internal note) to a ticket. */
export const addComment = mutation({
  args: {
    ticketId: v.id("ticketMaster"),
    body: v.string(),
    isInternal: v.optional(v.boolean()),
    authorName: v.optional(v.string()),
    authorId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("ticketComments", {
      ticketId: args.ticketId,
      body: args.body,
      type: args.isInternal ? "note" : "comment",
      isInternal: args.isInternal,
      authorId: args.authorId,
      authorName: args.authorName || "Agent",
      authorType: args.isInternal ? "agent" : "agent",
      createdAt: now,
      updatedAt: now,
    });
    await pushTimeline(ctx, args.ticketId, "commented", args.isInternal ? "Internal note added" : "Comment added", args.authorName);
    return args.ticketId;
  },
});

/** Assign a ticket to an agent. */
export const assignTicket = mutation({
  args: {
    ticketId: v.id("ticketMaster"),
    assignedTo: v.id("users"),
    performerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.ticketId, { assignedTo: args.assignedTo, updatedAt: now });
    await ctx.db.insert("ticketAssignments", {
      ticketId: args.ticketId,
      assignedTo: args.assignedTo,
      assignmentType: "manual",
      createdAt: now,
    });
    const user = await ctx.db.get(args.assignedTo);
    await pushTimeline(ctx, args.ticketId, "assigned", `Assigned to ${(user as any)?.name || args.assignedTo}`, args.performerName);
    return args.ticketId;
  },
});

/** Escalate a ticket. */
export const escalateTicket = mutation({
  args: {
    ticketId: v.id("ticketMaster"),
    reason: v.optional(v.string()),
    performerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.ticketId, {
      isEscalated: true,
      escalatedAt: now,
      escalationReason: args.reason,
      updatedAt: now,
    });
    await pushTimeline(ctx, args.ticketId, "escalated", `Ticket escalated${args.reason ? ` — ${args.reason}` : ""}`, args.performerName);
    return args.ticketId;
  },
});

/** Mark a ticket resolved. */
export const resolveTicket = mutation({
  args: {
    ticketId: v.id("ticketMaster"),
    resolutionSummary: v.optional(v.string()),
    performerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.ticketId, {
      status: "resolved",
      resolvedAt: now,
      resolutionSummary: args.resolutionSummary,
      updatedAt: now,
    });
    await pushTimeline(ctx, args.ticketId, "resolved", "Ticket resolved", args.performerName);
    return args.ticketId;
  },
});

/** Reopen a resolved/closed ticket. */
export const reopenTicket = mutation({
  args: {
    ticketId: v.id("ticketMaster"),
    performerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");
    const now = Date.now();
    await ctx.db.patch(args.ticketId, {
      status: "reopened",
      reopenedCount: ((ticket as any).reopenedCount || 0) + 1,
      updatedAt: now,
    });
    await pushTimeline(ctx, args.ticketId, "reopened", "Ticket reopened", args.performerName);
    return args.ticketId;
  },
});

/** Record customer satisfaction. */
export const rateTicket = mutation({
  args: {
    ticketId: v.id("ticketMaster"),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.ticketId, {
      satisfactionRating: args.rating,
      satisfactionComment: args.comment,
      satisfactionRatedAt: now,
      updatedAt: now,
    });
    await pushTimeline(ctx, args.ticketId, "rated", `Satisfaction rated ${args.rating}/5`, "System");
    return args.ticketId;
  },
});
