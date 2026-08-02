// ============================
// Demo Auth Mutations
// ============================
// Sign-in is handled by authHelpers (username/password + sessions table),
// so the @convex-dev/auth provider layer is not used by EEOS.

import { v } from "convex/values";
import { mutation } from "../_generated/server";

// ============================
// Demo Sign-In Status Mutation
// ============================
// Updates the demo profile's userId reference after sign-in
export const linkDemoUser = mutation({
  args: {
    profileId: v.id("demoProfiles"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.profileId, {
      userId: args.userId,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

// ============================
// Get Demo Stats
// ============================
export const getStats = mutation({
  args: {},
  handler: async (ctx) => {
    const [orgs, profiles, leads, students, admissions, tasks, notifications, activities] =
      await Promise.all([
        ctx.db.query("demoOrganizations").collect(),
        ctx.db.query("demoProfiles").collect(),
        ctx.db.query("demoLeads").collect(),
        ctx.db.query("demoStudents").collect(),
        ctx.db.query("demoAdmissions").collect(),
        ctx.db.query("demoTasks").collect(),
        ctx.db.query("demoNotifications").collect(),
        ctx.db.query("demoActivities").collect(),
      ]);

    return {
      organizations: orgs.length,
      profiles: profiles.length,
      leads: leads.length,
      students: students.length,
      admissions: admissions.length,
      tasks: tasks.length,
      notifications: notifications.length,
      activities: activities.length,
      isSeeded: orgs.length > 0,
    };
  },
});
