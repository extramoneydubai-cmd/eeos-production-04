// ============================
// Demo Environment - Frontend Queries
// ============================

import { v } from "convex/values";
import { query } from "../_generated/server";
import { getCurrentUser } from "../users";

// ============================
// Get current user's demo profile
// ============================
export const getCurrentDemoProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const profile = await ctx.db
      .query("demoProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return profile;
  },
});

// ============================
// Get profile by role (for user switching display)
// ============================
export const getProfileByRole = query({
  args: { role: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("demoProfiles")
      .withIndex("by_role", (q) => q.eq("demoRole", args.role))
      .first();
    return profile;
  },
});

// ============================
// Get all demo profiles (for user switcher)
// ============================
export const getAllProfiles = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db
      .query("demoProfiles")
      .withIndex("by_order")
      .collect();
    return profiles;
  },
});

// ============================
// Get leads for current user's role
// ============================
export const getLeadsForRole = query({
  args: { role: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("demoProfiles")
      .withIndex("by_role", (q) => q.eq("demoRole", args.role))
      .first();
    if (!profile) return [];

    const leads = await ctx.db
      .query("demoLeads")
      .withIndex("by_assigned", (q) => q.eq("assignedTo", profile._id as any))
      .collect();
    return leads;
  },
});

// ============================
// Get all leads (for CEO/Sales Manager views)
// ============================
export const getAllLeads = query({
  args: {},
  handler: async (ctx) => {
    const leads = await ctx.db.query("demoLeads").collect();
    return leads;
  },
});

// ============================
// Get students (for Faculty/Parent views)
// ============================
export const getAllStudents = query({
  args: {},
  handler: async (ctx) => {
    const students = await ctx.db.query("demoStudents").collect();
    return students;
  },
});

// ============================
// Get tasks for a role
// ============================
export const getTasksForRole = query({
  args: { role: v.string() },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("demoTasks")
      .withIndex("by_role", (q) => q.eq("assignedToRole", args.role))
      .collect();
    return tasks;
  },
});

// ============================
// Get all tasks
// ============================
export const getAllTasks = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("demoTasks").collect();
    return tasks;
  },
});

// ============================
// Get notifications for a role
// ============================
export const getNotificationsForRole = query({
  args: { role: v.string() },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("demoNotifications")
      .withIndex("by_role", (q) => q.eq("role", args.role))
      .collect();
    return notifications;
  },
});

// ============================
// Get all notifications
// ============================
export const getAllNotifications = query({
  args: {},
  handler: async (ctx) => {
    const notifications = await ctx.db.query("demoNotifications").collect();
    return notifications;
  },
});

// ============================
// Get admissions
// ============================
export const getAdmissions = query({
  args: {},
  handler: async (ctx) => {
    const admissions = await ctx.db.query("demoAdmissions").collect();
    return admissions;
  },
});

// ============================
// Get activities
// ============================
export const getActivities = query({
  args: {},
  handler: async (ctx) => {
    const activities = await ctx.db
      .query("demoActivities")
      .withIndex("by_created")
      .order("desc")
      .take(20);
    return activities;
  },
});

// ============================
// Get organization hierarchy
// ============================
export const getOrganization = query({
  args: {},
  handler: async (ctx) => {
    const orgs = await ctx.db.query("demoOrganizations").collect();
    return orgs;
  },
});

// ============================
// Get stats summary
// ============================
export const getDemoStats = query({
  args: {},
  handler: async (ctx) => {
    const [orgs, profiles, leads, students, admissions, tasks, notifs] =
      await Promise.all([
        ctx.db.query("demoOrganizations").collect(),
        ctx.db.query("demoProfiles").collect(),
        ctx.db.query("demoLeads").collect(),
        ctx.db.query("demoStudents").collect(),
        ctx.db.query("demoAdmissions").collect(),
        ctx.db.query("demoTasks").collect(),
        ctx.db.query("demoNotifications").collect(),
      ]);

    return {
      organizations: orgs.length,
      profiles: profiles.length,
      leads: leads.length,
      students: students.length,
      admissions: admissions.length,
      tasks: tasks.length,
      notifications: notifs.length,
      isSeeded: orgs.length > 0,
    };
  },
});
