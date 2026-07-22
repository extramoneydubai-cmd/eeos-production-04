// ============================
// Demo Auth Provider & Mutations
// ============================
// One-click login for demo users. Uses ConvexCredentials provider.
// A separate provider for each role to allow clean sign-in flow.

import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { v } from "convex/values";
import { mutation, MutationCtx } from "../_generated/server";
import { DEMO_USERS } from "./data";

// ============================
// Demo Auth Provider
// ============================
// This custom provider allows sign-in with just a role name.
// It looks up the demo profile and creates/finds the associated user.

export const Demo = ConvexCredentials({
  id: "demo",
  authorize: async (credentials, ctx: any) => {
    const { role } = credentials as { role: string };

    // Validate role
    const validRoles = DEMO_USERS.map((u) => u.role);
    if (!validRoles.includes(role as any)) {
      throw new Error(`Invalid demo role: ${role}`);
    }

    // Find the demo profile
    const profile = DEMO_USERS.find((u) => u.role === role);
    if (!profile) {
      throw new Error(`Demo profile not found for role: ${role}`);
    }

    // Check if user already exists by email
    const existingUsers = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("email"), profile.email))
      .collect();

    let userId: string;

    if (existingUsers.length > 0) {
      // Use existing user
      userId = existingUsers[0]._id;
    } else {
      // Check if there's an existing account
      const existingAccounts = await ctx.db
        .query("authAccounts")
        .filter((q: any) =>
          q.and(
            q.eq(q.field("provider"), "demo"),
            q.eq(q.field("providerAccountId"), `demo-${role}`),
          ),
        )
        .collect();

      if (existingAccounts.length > 0) {
        userId = existingAccounts[0].userId;
      } else {
        // Create new user
        userId = await ctx.db.insert("users", {
          name: profile.name,
          email: profile.email,
          emailVerificationTime: Date.now(),
          isAnonymous: false,
          role: "admin",
        });
      }
    }

    return { userId: userId as any };
  },
});

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
