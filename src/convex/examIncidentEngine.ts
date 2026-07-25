import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ═══════════════════════════════════════════════════════════════════
// INCIDENT QUERIES (Part 8)
// ═══════════════════════════════════════════════════════════════════

export const listIncidents = query({
  args: {
    examSessionId: v.optional(v.id("examSessions")),
    status: v.optional(v.string()),
    severity: v.optional(v.string()),
    incidentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("examIncidents");
    if (args.examSessionId) q = q.filter((eq) => eq.eq(eq.field("examSessionId"), args.examSessionId));
    if (args.status) q = q.filter((eq) => eq.eq(eq.field("status"), args.status));
    if (args.severity) q = q.filter((eq) => eq.eq(eq.field("severity"), args.severity));
    const all = await q.order("desc").collect();
    if (args.incidentType) return all.filter((i) => i.incidentType === args.incidentType);
    return all;
  },
});

export const getIncident = query({
  args: { id: v.id("examIncidents") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const getIncidentStats = query({
  args: { examSessionId: v.id("examSessions") },
  handler: async (ctx, args) => {
    const incidents = await ctx.db
      .query("examIncidents")
      .filter((q) => q.eq(q.field("examSessionId"), args.examSessionId))
      .collect();

    return {
      total: incidents.length,
      open: incidents.filter((i) => i.status === "reported" || i.status === "under_review" || i.status === "committee_review").length,
      resolved: incidents.filter((i) => i.status === "resolved" || i.status === "closed").length,
      bySeverity: {
        low: incidents.filter((i) => i.severity === "low").length,
        medium: incidents.filter((i) => i.severity === "medium").length,
        high: incidents.filter((i) => i.severity === "high").length,
        critical: incidents.filter((i) => i.severity === "critical").length,
      },
      byType: incidents.reduce((acc: Record<string, number>, i) => {
        acc[i.incidentType] = (acc[i.incidentType] ?? 0) + 1;
        return acc;
      }, {}),
    };
  },
});

// ═══════════════════════════════════════════════════════════════════
// INCIDENT MUTATIONS
// ═══════════════════════════════════════════════════════════════════

export const reportIncident = mutation({
  args: {
    examSessionId: v.id("examSessions"),
    timetableId: v.optional(v.id("examTimetable")),
    incidentType: v.union(
      v.literal("cheating"), v.literal("malpractice"),
      v.literal("mobile_usage"), v.literal("misconduct"),
      v.literal("late_arrival"), v.literal("medical_emergency"),
      v.literal("paper_leak"), v.literal("technical_issue"),
      v.literal("room_issue"), v.literal("other"),
    ),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    description: v.string(),
    studentIds: v.optional(v.array(v.id("personMaster"))),
    invigilatorId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const id = await ctx.db.insert("examIncidents", {
      ...args,
      reportedBy: identity.subject as any,
      reportedAt: now,
      status: "reported",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("examTimeline", {
      examSessionId: args.examSessionId,
      eventType: "incident_reported",
      description: `${args.incidentType} incident reported (${args.severity})`,
      userId: identity.subject as any,
      createdAt: now,
    });

    return id;
  },
});

export const updateIncidentStatus = mutation({
  args: {
    id: v.id("examIncidents"),
    status: v.union(
      v.literal("reported"), v.literal("under_review"),
      v.literal("committee_review"), v.literal("resolved"),
      v.literal("appealed"), v.literal("closed"),
    ),
    actionTaken: v.optional(v.string()),
    penalty: v.optional(v.string()),
    resolution: v.optional(v.string()),
    committeeMembers: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const { id, ...updates } = args;
    const patchFields: any = { ...updates, updatedAt: now };

    if (args.status === "resolved" || args.status === "closed") {
      patchFields.resolvedBy = identity.subject as any;
      patchFields.resolvedAt = now;
    }

    await ctx.db.patch(id, patchFields);

    const incident = await ctx.db.get(id);
    if (incident) {
      await ctx.db.insert("examTimeline", {
        examSessionId: incident.examSessionId,
        eventType: `incident_${args.status}`,
        description: `Incident status changed to ${args.status}`,
        userId: identity.subject as any,
        createdAt: now,
      });
    }

    return id;
  },
});

export const appealIncident = mutation({
  args: {
    id: v.id("examIncidents"),
    appealDetails: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, appealDetails } = args;
    await ctx.db.patch(id, {
      status: "appealed",
      appealDetails,
      appealStatus: "pending",
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const resolveAppeal = mutation({
  args: {
    id: v.id("examIncidents"),
    appealStatus: v.union(v.literal("accepted"), v.literal("rejected")),
    resolution: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, appealStatus, resolution } = args;
    await ctx.db.patch(id, {
      appealStatus,
      resolution: resolution,
      status: "closed",
      updatedAt: Date.now(),
    });
    return id;
  },
});
