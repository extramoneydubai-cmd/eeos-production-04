import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getDashboardData = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // User counts
    const allUsers = await ctx.db.query("users").collect();
    const activeUsers = allUsers.filter((u) => !u.isDisabled);
    const disabledUsers = allUsers.filter((u) => u.isDisabled);

    // Task counts
    const allTasks = await ctx.db.query("tasks").collect();
    const activeTasks = allTasks.filter((t) => !t.isArchived);
    const tasksByStatus = {
      backlog: activeTasks.filter((t) => t.status === "backlog").length,
      todo: activeTasks.filter((t) => t.status === "todo").length,
      in_progress: activeTasks.filter((t) => t.status === "in_progress").length,
      review: activeTasks.filter((t) => t.status === "review").length,
      done: activeTasks.filter((t) => t.status === "done").length,
    };
    const overdueTasks = activeTasks.filter((t) => t.dueDate && t.dueDate < Date.now() && t.status !== "done");
    const myAssignedTasks = activeTasks.filter((t) => t.assignedTo === args.userId);
    const myOwnedTasks = activeTasks.filter((t) => t.ownerId === args.userId);

    // Approval counts
    const allApprovals = await ctx.db.query("approvalRequests").collect();
    const pendingApprovals = allApprovals.filter((a) => a.status === "pending");
    const myPendingApprovals = allApprovals.filter((a) => a.requesterId === args.userId && a.status === "pending");

    // Notification count
    const unreadNotifs = await ctx.db.query("notifications").withIndex("userId_isRead", (q) => q.eq("userId", args.userId!).eq("isRead", false)).collect();
    const notificationCount = unreadNotifs.length;

    // Department and team counts
    const departments = await ctx.db.query("departments").collect();
    const teams = await ctx.db.query("teams").collect();
    const branches = await ctx.db.query("branches").collect();
    const verticals = await ctx.db.query("verticals").collect();
    const designations = await ctx.db.query("designations").collect();

    // Recent activity
    const recentComments = await ctx.db.query("taskComments").collect();
    recentComments.sort((a, b) => b.createdAt - a.createdAt);
    const recentActivity = recentComments.slice(0, 10);

    return {
      totalUsers: allUsers.length,
      activeUsers: activeUsers.length,
      disabledUsers: disabledUsers.length,
      totalTasks: activeTasks.length,
      tasksByStatus,
      overdueTasks: overdueTasks.length,
      myAssignedTasks: myAssignedTasks.length,
      myOwnedTasks: myOwnedTasks.length,
      pendingApprovals: pendingApprovals.length,
      myPendingApprovals: myPendingApprovals.length,
      notificationCount,
      departmentsCount: departments.length,
      teamsCount: teams.length,
      branchesCount: branches.length,
      verticalsCount: verticals.length,
      designationsCount: designations.length,
      recentActivity,
    };
  },
});

export const getEffectiveAccess = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const scope = await ctx.db.query("userScopes").withIndex("userId", (q) => q.eq("userId", args.userId!)).first();

    const departments = user.departmentId ? [await ctx.db.get(user.departmentId)] : [];
    const teams = user.teamIds ? await Promise.all(user.teamIds.map((tid: any) => ctx.db.get(tid))) : [];
    const branch = user.branchId ? await ctx.db.get(user.branchId) : null;
    const designation = user.designationId ? await ctx.db.get(user.designationId) : null;

    return {
      user,
      scope,
      departments: departments.filter(Boolean),
      teams: teams.filter(Boolean),
      branch,
      designation,
    };
  },
});
