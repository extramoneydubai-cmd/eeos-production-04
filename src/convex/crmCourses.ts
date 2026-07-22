import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { logActivity, recalculatePayable } from "./crmHelpers";

// ============================
// COURSE STUDIO
// ============================

export const listCourses = query({
  args: { status: v.optional(v.union(v.literal("active"), v.literal("archived"), v.literal("draft"))) },
  handler: async (ctx, args) => {
    let courses = await ctx.db.query("courses").collect();
    if (args.status) courses = courses.filter((c) => c.status === args.status);
    return courses.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => await ctx.db.get(args.courseId),
});

export const createCourse = mutation({
  args: { courseCode: v.string(), courseName: v.string(), verticalId: v.optional(v.id("verticals")), subVerticalId: v.optional(v.id("subVerticals")), boardId: v.optional(v.id("boards")), baseFee: v.number(), description: v.optional(v.string()), status: v.union(v.literal("active"), v.literal("archived"), v.literal("draft")), createdBy: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const courseId = await ctx.db.insert("courses", { courseCode: args.courseCode, courseName: args.courseName, verticalId: args.verticalId, subVerticalId: args.subVerticalId, boardId: args.boardId, baseFee: args.baseFee, description: args.description, status: args.status, createdBy: args.createdBy, createdAt: now, updatedAt: now });
    return courseId;
  },
});

export const updateCourse = mutation({
  args: { courseId: v.id("courses"), courseCode: v.optional(v.string()), courseName: v.optional(v.string()), verticalId: v.optional(v.id("verticals")), subVerticalId: v.optional(v.id("subVerticals")), boardId: v.optional(v.id("boards")), baseFee: v.optional(v.number()), description: v.optional(v.string()), status: v.optional(v.union(v.literal("active"), v.literal("archived"), v.literal("draft"))), updatedBy: v.id("users") },
  handler: async (ctx, args) => {
    const { courseId, updatedBy, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) { if (value !== undefined) updates[key] = value; }
    await ctx.db.patch(courseId, updates);
  },
});

export const archiveCourse = mutation({
  args: { courseId: v.id("courses"), updatedBy: v.id("users") },
  handler: async (ctx, args) => { await ctx.db.patch(args.courseId, { status: "archived", updatedAt: Date.now() }); },
});

export const duplicateCourse = mutation({
  args: { courseId: v.id("courses"), createdBy: v.id("users") },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.courseId);
    if (!original) throw new Error("Course not found");
    const now = Date.now();
    const dupId = await ctx.db.insert("courses", { courseCode: original.courseCode + "-COPY", courseName: original.courseName + " (Copy)", verticalId: original.verticalId, subVerticalId: original.subVerticalId, boardId: original.boardId, baseFee: original.baseFee, description: original.description, status: "draft", createdBy: args.createdBy, createdAt: now, updatedAt: now });
    return dupId;
  },
});

// ============================
// LEAD COURSE LINKING
// ============================

async function recalcLeadFeeFromCourses(ctx: any, leadId: string) {
  const links = await ctx.db.query("leadCourses").withIndex("leadId", (q: any) => q.eq("leadId", leadId)).collect();
  const courseIds = links.map((l: any) => l.courseId);
  const courses = await Promise.all(courseIds.map((id: string) => ctx.db.get(id)));
  const totalBaseFee = courses.filter(Boolean).reduce((sum: number, c: any) => sum + (c.baseFee || 0), 0);
  const lead = await ctx.db.get(leadId);
  if (!lead) return;
  const allApproved = (await ctx.db.query("leadDiscounts").withIndex("leadId", (q: any) => q.eq("leadId", leadId)).collect()).filter((d: any) => d.status === "approved");
  const { discountAmount, waiverAmount, finalPayable } = recalculatePayable(totalBaseFee, allApproved);
  await ctx.db.patch(leadId, { standardAmount: totalBaseFee, discountAmount, waiverAmount, finalPayable, courseInterest: courses.filter(Boolean).map((c: any) => c.courseName).join(", "), updatedAt: Date.now() });
}

export const getLeadCourses = query({
  args: { leadId: v.id("leadMaster") },
  handler: async (ctx, args) => {
    const links = await ctx.db.query("leadCourses").withIndex("leadId", (q) => q.eq("leadId", args.leadId)).collect();
    const courseIds = links.map((l) => l.courseId);
    const courses = await Promise.all(courseIds.map((id) => ctx.db.get(id)));
    return courses.filter(Boolean);
  },
});

export const addCourseToLead = mutation({
  args: { leadId: v.id("leadMaster"), courseId: v.id("courses"), addedBy: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("leadCourses").withIndex("leadId_courseId", (q) => q.eq("leadId", args.leadId).eq("courseId", args.courseId)).first();
    if (existing) return { added: false, message: "Course already added" };
    await ctx.db.insert("leadCourses", { leadId: args.leadId, courseId: args.courseId, addedBy: args.addedBy, createdAt: Date.now() });
    await recalcLeadFeeFromCourses(ctx, args.leadId);
    await logActivity(ctx, args.leadId, "lead_updated", "Course added to lead", args.addedBy);
    return { added: true };
  },
});

export const removeCourseFromLead = mutation({
  args: { leadId: v.id("leadMaster"), courseId: v.id("courses"), removedBy: v.id("users") },
  handler: async (ctx, args) => {
    const link = await ctx.db.query("leadCourses").withIndex("leadId_courseId", (q) => q.eq("leadId", args.leadId).eq("courseId", args.courseId)).first();
    if (!link) return;
    await ctx.db.delete(link._id);
    const lead = await ctx.db.get(args.leadId);
    const hasApprovedWaiver = lead && (lead.waiverAmount || 0) > 0;
    await recalcLeadFeeFromCourses(ctx, args.leadId);
    await logActivity(ctx, args.leadId, "lead_updated", `Course removed from lead${hasApprovedWaiver ? " (has approved waiver)" : ""}`, args.removedBy);
  },
});
