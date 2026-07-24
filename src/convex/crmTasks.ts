import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { logActivity } from "./crmHelpers";

// ============================
// SALES PENDING TASKS (Task Workspace)
// ============================

export const getSalesPendingTasks = query({
  args: {
    userId: v.id("users"),
    assignedToMe: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const allTasks = await ctx.db.query("leadTasks").collect();
    const now = Date.now();
    const day = 86400000;
    let pendingTasks = allTasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
    if (args.assignedToMe) {
      pendingTasks = pendingTasks.filter((t) => t.assignedTo === args.userId || t.ownerId === args.userId);
    }
    const leadIds = [...new Set(pendingTasks.map((t) => t.leadId))];
    const [leads, allCoursesLinks, allUsers] = await Promise.all([
      Promise.all(leadIds.map((id) => ctx.db.get(id))),
      ctx.db.query("leadCourses").collect(),
      ctx.db.query("users").collect(),
    ]);
    const validLeads = leads.filter((l): l is NonNullable<typeof l> => l != null);
    const courseIds = [...new Set(allCoursesLinks.map((lc) => lc.courseId))];
    const courseDocs = (await Promise.all(courseIds.map((id: any) => ctx.db.get(id as any)))).filter((c): c is NonNullable<typeof c> => c != null);
    const courseMap = new Map(courseDocs.map((c) => [c._id, c]));
    const userMap = new Map(allUsers.map((u) => [u._id, u]));
    const leadCourseLinks = allCoursesLinks.filter((lc) => leadIds.includes(lc.leadId));
    const leadCourseMap = new Map<string, string[]>();
    for (const link of leadCourseLinks) {
      const existing = leadCourseMap.get(link.leadId) || [];
      const course = courseMap.get(link.courseId);
      if (course) existing.push((course as any).courseName);
      leadCourseMap.set(link.leadId, existing);
    }
    const leadsWithTasks: any[] = [];
    for (const lead of validLeads) {
      if (!lead) continue;
      const leadTasks = pendingTasks.filter((t) => t.leadId === lead._id);
      if (leadTasks.length === 0) continue;
      const courseNames = leadCourseMap.get(lead._id) || [];
      const sorted = [...leadTasks].sort((a, b) => {
        const aOverdue = a.dueDate != null && a.dueDate < now;
        const bOverdue = b.dueDate != null && b.dueDate < now;
        const aToday = a.dueDate != null && a.dueDate >= now && a.dueDate <= now + day;
        const bToday = b.dueDate != null && b.dueDate >= now && b.dueDate <= now + day;
        const aWeek = a.dueDate != null && a.dueDate > now + day && a.dueDate <= now + 7 * day;
        const bWeek = b.dueDate != null && b.dueDate > now + day && b.dueDate <= now + 7 * day;
        const aBucket = aOverdue ? 0 : aToday ? 1 : aWeek ? 2 : 3;
        const bBucket = bOverdue ? 0 : bToday ? 1 : bWeek ? 2 : 3;
        if (aBucket !== bBucket) return aBucket - bBucket;
        const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        return (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4);
      });
      const overdueCount = sorted.filter((t) => t.dueDate != null && t.dueDate < now).length;
      const dueTodayCount = sorted.filter((t) => t.dueDate != null && t.dueDate >= now && t.dueDate <= now + day).length;
      leadsWithTasks.push({
        lead: { _id: lead._id, firstName: lead.firstName, lastName: lead.lastName, stage: lead.stage, priority: lead.priority, phone: lead.phone, ownerId: lead.ownerId, standardAmount: lead.standardAmount },
        courses: courseNames,
        tasks: sorted.map((t) => ({ _id: t._id, title: t.title, status: t.status, priority: t.priority, dueDate: t.dueDate, ownerId: t.ownerId, assignedTo: t.assignedTo, createdAt: t.createdAt })),
        taskCount: sorted.length, overdueCount, dueTodayCount,
      });
    }
    leadsWithTasks.sort((a, b) => {
      if (a.overdueCount !== b.overdueCount) return b.overdueCount - a.overdueCount;
      if (a.dueTodayCount !== b.dueTodayCount) return b.dueTodayCount - a.dueTodayCount;
      return b.taskCount - a.taskCount;
    });
    const allDueDates = pendingTasks.map((t) => t.dueDate).filter((d): d is number => d != null);
    const overdueTasks = allDueDates.filter((d) => d < now).length;
    const todayTasks = allDueDates.filter((d) => d >= now && d <= now + day).length;
    const completedToday = allTasks.filter((t) => t.status === "completed" && t.updatedAt != null && t.updatedAt >= now - day).length;
    const inProgressCount = pendingTasks.filter((t) => t.status === "in_progress").length;
    return {
      leads: leadsWithTasks,
      summary: { totalPending: pendingTasks.length, inProgress: inProgressCount, overdue: overdueTasks, completedToday },
      users: allUsers.map((u) => ({ _id: u._id, name: u.name, email: u.email })),
    };
  },
});

// ============================
// LEAD TASKS
// ============================

export const getLeadTasks = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => await ctx.db.query("leadTasks").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect(),
});

export const createLeadTask = mutation({
  args: { leadId: v.id("leadMaster"), title: v.string(), description: v.optional(v.string()), ownerId: v.id("users"), assignedTo: v.optional(v.id("users")), dueDate: v.optional(v.number()), priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))), isApproved: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const taskId = await ctx.db.insert("leadTasks", { leadId: args.leadId, title: args.title, description: args.description, ownerId: args.ownerId, assignedTo: args.assignedTo, dueDate: args.dueDate, status: "pending", priority: args.priority || "medium", isApproved: args.isApproved, createdAt: now, updatedAt: now });
    await logActivity(ctx, args.leadId, "task_created", `task created: ${args.title}`, args.ownerId);
    return taskId;
  },
});

export const updateLeadTaskStatus = mutation({
  args: { taskId: v.id("leadTasks"), status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"), v.literal("cancelled")), userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, { status: args.status, updatedAt: Date.now() });
    if (args.status === "completed" && args.userId) { const task = await ctx.db.get(args.taskId); if (task) await logActivity(ctx, task.leadId, "task_completed", `task completed`, args.userId); }
  },
});

export const updateLeadTask = mutation({
  args: { taskId: v.id("leadTasks"), title: v.optional(v.string()), description: v.optional(v.string()), assignedTo: v.optional(v.id("users")), dueDate: v.optional(v.number()), status: v.optional(v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"), v.literal("cancelled"))), priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))), isApproved: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const { taskId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) { if (value !== undefined) updates[key] = value; }
    await ctx.db.patch(taskId, updates);
  },
});

export const deleteLeadTask = mutation({
  args: { taskId: v.id("leadTasks") },
  handler: async (ctx, args) => { await ctx.db.delete(args.taskId); },
});
