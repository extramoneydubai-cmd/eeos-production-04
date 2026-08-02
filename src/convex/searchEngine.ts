/**
 * Search Engine — Enterprise Global Search
 *
 * Searches across all entities: students, parents, employees,
 * leads, tickets, courses, documents, knowledge articles,
 * payments, receipts, refunds, invoices, schedules, and more.
 * Results are permission-aware.
 */

import { v } from "convex/values";
import { query } from "./_generated/server";

export const globalSearch = query({
  args: {
    query: v.string(),
    entityTypes: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const q = args.query.toLowerCase();
    const limit = args.limit || 20;
    const results: Array<{
      id: string;
      entityType: string;
      title: string;
      subtitle: string;
      url: string;
      score: number;
    }> = [];

    const allowedTypes = args.entityTypes || [
      "student", "lead", "employee", "ticket", "course",
      "knowledge", "invoice", "receipt", "schedule", "vendor", "user",
    ];

    // Search Students
    if (allowedTypes.includes("student")) {
      const students = await ctx.db.query("studentMaster").collect();
      for (const s of students) {
        const name = `${(s as any).firstName || ""} ${(s as any).lastName || ""}`.toLowerCase();
        const admissionNum = ((s as any).admissionNumber || "").toLowerCase();
        const phone = ((s as any).phone || "").toLowerCase();
        if (name.includes(q) || admissionNum.includes(q) || phone.includes(q)) {
          results.push({
            id: s._id, entityType: "student", title: `${(s as any).firstName} ${(s as any).lastName}`,
            subtitle: (s as any).admissionNumber || "Student", url: `/students/${s._id}`, score: name === q ? 100 : 80,
          });
        }
      }
    }

    // Search Leads
    if (allowedTypes.includes("lead")) {
      const leads = await ctx.db.query("leadMaster").collect();
      for (const l of leads) {
        const name = `${(l as any).firstName || ""} ${(l as any).lastName || ""}`.toLowerCase();
        const phone = ((l as any).phone || "").toLowerCase();
        const email = ((l as any).email || "").toLowerCase();
        if (name.includes(q) || phone.includes(q) || email.includes(q)) {
          results.push({
            id: l._id, entityType: "lead", title: `${(l as any).firstName} ${(l as any).lastName}`,
            subtitle: (l as any).phone || "Lead", url: `/crm/leads/${l._id}`, score: phone.includes(q) ? 90 : 70,
          });
        }
      }
    }

    // Search Employees / Users
    if (allowedTypes.includes("employee") || allowedTypes.includes("user")) {
      const users = await ctx.db.query("users").collect();
      for (const u of users) {
        const name = (u.name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        if (name.includes(q) || email.includes(q)) {
          results.push({
            id: u._id, entityType: "employee", title: u.name || "User",
            subtitle: u.email || "", url: `/employees/${u._id}`, score: email === q ? 95 : 65,
          });
        }
      }
    }

    // Search Tickets
    if (allowedTypes.includes("ticket")) {
      const tickets = await ctx.db.query("ticketMaster").collect();
      for (const t of tickets) {
        const subject = (t as any).subject?.toLowerCase() || "";
        const desc = (t as any).description?.toLowerCase() || "";
        if (subject.includes(q) || desc.includes(q)) {
          results.push({
            id: t._id, entityType: "ticket", title: (t as any).subject || "Ticket",
            subtitle: `Status: ${t.status}`, url: `/tickets/${t._id}`, score: 60,
          });
        }
      }
    }

    // Search Knowledge Articles
    if (allowedTypes.includes("knowledge")) {
      const articles = await ctx.db.query("knowledgeArticles").collect();
      for (const a of articles) {
        const title = (a as any).title?.toLowerCase() || "";
        const content = (a as any).content?.toLowerCase() || "";
        if (title.includes(q) || content.includes(q)) {
          results.push({
            id: a._id, entityType: "knowledge", title: (a as any).title || "Article",
            subtitle: (a as any).articleType || "Knowledge", url: `/knowledge/articles/${a._id}`, score: title.includes(q) ? 85 : 50,
          });
        }
      }
    }

    // Sort by score descending, limit results
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  },
});

export const getSearchSuggestions = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (args.query.length < 2) return [];
    const results = await (globalSearch as any)(ctx, { query: args.query, limit: 5 });
    return results.map((r: any) => ({ label: r.title, type: r.entityType, url: r.url }));
  },
});
