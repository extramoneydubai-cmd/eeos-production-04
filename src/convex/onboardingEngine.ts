import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { withScopeAndEvents } from "./withScopeAndEvents";
import { resolvePerformer } from "./performerResolver";

// ─── DEFAULT ONBOARDING CHECKLIST ITEMS ────────────────────

export const DEFAULT_ONBOARDING_ITEMS = [
  "Submit employment documents",
  "Complete bank account setup",
  "IT equipment allocation",
  "Email and system access setup",
  "Employee badge creation",
  "Orientation session scheduling",
  "Benefits enrollment",
  "Policy acknowledgment",
  "Team introduction meeting",
  "Training plan setup",
];

// ─── ONBOARDING TASK MANAGEMENT ────────────────────────────

export const createOnboardingTask = mutation({
  args: { token: v.optional(v.string()),
    candidateId: v.id("candidates"),
    checklistItem: v.string(),
    assignedTo: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "create", module: "hr", entity: "onboardingEngine" }, async (ctx, args) => {
    const identity = (await resolvePerformer(ctx)) as any;

    const id = await ctx.db.insert("onboardingTasks", {
      candidateId: args.candidateId,
      checklistItem: args.checklistItem,
      assignedTo: args.assignedTo,
      dueDate: args.dueDate,
      notes: args.notes,
      completed: false,
      createdAt: Date.now(),
    });

    return id;
  }),
});

export const generateDefaultOnboarding = mutation({
  args: { token: v.optional(v.string()),
    candidateId: v.id("candidates"),
    employeeId: v.optional(v.id("employeeMaster")),
  },
  handler: withScopeAndEvents({ operation: "create", module: "hr", entity: "onboardingEngine" }, async (ctx, args) => {
    const identity = (await resolvePerformer(ctx)) as any;

    const now = Date.now();
    const taskIds: Id<"onboardingTasks">[] = [];

    for (const item of DEFAULT_ONBOARDING_ITEMS) {
      const id = await ctx.db.insert("onboardingTasks", {
        candidateId: args.candidateId,
        employeeId: args.employeeId,
        checklistItem: item,
        completed: false,
        createdAt: now,
      });
      taskIds.push(id);
    }

    // Create timeline event
    await ctx.db.insert("candidateTimeline", {
      candidateId: args.candidateId,
      eventType: "onboarding_started",
      title: "Onboarding Started",
      description: `${DEFAULT_ONBOARDING_ITEMS.length} onboarding tasks created`,
      performedBy: ctx.__performerUserId as any,
      createdAt: now,
    });

    return taskIds;
  }),
});

export const updateOnboardingTask = mutation({
  args: { token: v.optional(v.string()),
    taskId: v.id("onboardingTasks"),
    assignedTo: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: withScopeAndEvents({ operation: "update", module: "hr", entity: "onboardingEngine" }, async (ctx, args) => {
    const { token: _token, taskId, ...fields } = args;
    await ctx.db.patch(taskId, { ...fields });
    return taskId;
  }),
});

export const completeOnboardingTask = mutation({
  args: { token: v.optional(v.string()),
    taskId: v.id("onboardingTasks"),
  },
  handler: withScopeAndEvents({ operation: "update", module: "hr", entity: "onboardingEngine" }, async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    await ctx.db.patch(args.taskId, {
      completed: true,
      completedAt: Date.now(),
    });

    return args.taskId;
  }),
});

export const uncompleteOnboardingTask = mutation({
  args: { token: v.optional(v.string()),
    taskId: v.id("onboardingTasks"),
  },
  handler: withScopeAndEvents({ operation: "update", module: "hr", entity: "onboardingEngine" }, async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      completed: false,
      completedAt: undefined,
    });
    return args.taskId;
  }),
});

export const deleteOnboardingTask = mutation({
  args: { token: v.optional(v.string()), taskId: v.id("onboardingTasks") },
  handler: withScopeAndEvents({ operation: "delete", module: "hr", entity: "onboardingEngine" }, async (ctx, args) => {
    await ctx.db.delete(args.taskId);
  }),
});

export const linkEmployeeToOnboarding = mutation({
  args: { token: v.optional(v.string()),
    candidateId: v.id("candidates"),
    employeeId: v.id("employeeMaster"),
  },
  handler: withScopeAndEvents({ operation: "update", module: "hr", entity: "onboardingEngine" }, async (ctx, args) => {
    const tasks = await ctx.db
      .query("onboardingTasks")
      .withIndex("candidateId", (q: any) => q.eq("candidateId", args.candidateId))
      .collect();

    for (const task of tasks) {
      await ctx.db.patch(task._id, { employeeId: args.employeeId });
    }

    return tasks.length;
  }),
});

// ─── QUERIES ───────────────────────────────────────────────

export const listOnboardingTasks = query({
  args: {
    candidateId: v.optional(v.id("candidates")),
    employeeId: v.optional(v.id("employeeMaster")),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let tasks = await ctx.db.query("onboardingTasks").collect();

    if (args.candidateId) {
      tasks = tasks.filter((t) => t.candidateId === args.candidateId);
    }
    if (args.employeeId) {
      tasks = tasks.filter((t) => t.employeeId === args.employeeId);
    }
    if (args.completed !== undefined) {
      tasks = tasks.filter((t) => t.completed === args.completed);
    }

    return tasks.sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const getOnboardingProgress = query({
  args: { candidateId: v.id("candidates") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("onboardingTasks")
      .withIndex("candidateId", (q: any) => q.eq("candidateId", args.candidateId))
      .collect();

    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;

    return {
      total,
      completed,
      pending: total - completed,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
      tasks,
    };
  },
});

export const getAssignedTasks = query({
  args: {
    userId: v.id("users"),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let tasks = await ctx.db
      .query("onboardingTasks")
      .withIndex("assignedTo", (q: any) => q.eq("assignedTo", args.userId))
      .collect();

    if (args.completed !== undefined) {
      tasks = tasks.filter((t) => t.completed === args.completed);
    }

    return tasks.sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
  },
});
