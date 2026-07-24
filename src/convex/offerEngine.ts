import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ─── HELPERS ───────────────────────────────────────────────

async function createTimelineEvent(
  ctx: any,
  args: {
    candidateId: Id<"candidates">;
    eventType: string;
    title: string;
    description?: string;
    performedBy: Id<"users">;
  }
) {
  await ctx.db.insert("candidateTimeline", {
    candidateId: args.candidateId,
    eventType: args.eventType,
    title: args.title,
    description: args.description,
    performedBy: args.performedBy,
    createdAt: Date.now(),
  });
}

// ─── OFFER CRUD ────────────────────────────────────────────

export const createOffer = mutation({
  args: {
    candidateId: v.id("candidates"),
    offeredSalary: v.number(),
    joiningDate: v.number(),
    offerLetter: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check candidate exists and is in offerable state
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) throw new Error("Candidate not found");
    if (candidate.status !== "assessment" && candidate.status !== "interview_completed") {
      throw new Error("Candidate must complete assessment/interview before offer");
    }

    const now = Date.now();
    const id = await ctx.db.insert("offers", {
      candidateId: args.candidateId,
      offeredSalary: args.offeredSalary,
      joiningDate: args.joiningDate,
      offerLetter: args.offerLetter,
      notes: args.notes,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    // Update candidate status
    await ctx.db.patch(args.candidateId, {
      status: "offer_pending",
      updatedAt: now,
    });

    await createTimelineEvent(ctx, {
      candidateId: args.candidateId,
      eventType: "offer_created",
      title: "Offer Created",
      description: `Offered salary: ${args.offeredSalary}, Joining: ${new Date(args.joiningDate).toLocaleDateString()}`,
      performedBy: identity.subject as any,
    });

    return id;
  },
});

export const updateOffer = mutation({
  args: {
    id: v.id("offers"),
    offeredSalary: v.optional(v.number()),
    joiningDate: v.optional(v.number()),
    offerLetter: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    return id;
  },
});

// ─── OFFER APPROVAL ────────────────────────────────────────

export const approveOffer = mutation({
  args: {
    offerId: v.id("offers"),
    approved: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const offer = await ctx.db.get(args.offerId);
    if (!offer) throw new Error("Offer not found");
    if (offer.status !== "pending") throw new Error("Offer is not in pending state");

    await ctx.db.patch(args.offerId, {
      status: args.approved ? "approved" : "rejected",
      approvedBy: identity.subject as any,
      notes: args.notes || offer.notes,
      updatedAt: Date.now(),
    });

    const candidate = await ctx.db.get(offer.candidateId);

    await createTimelineEvent(ctx, {
      candidateId: offer.candidateId,
      eventType: args.approved ? "offer_approved" : "offer_rejected",
      title: args.approved ? "Offer Approved" : "Offer Rejected",
      description: args.notes || (args.approved ? "Offer has been approved" : "Offer has been rejected"),
      performedBy: identity.subject as any,
    });

    return args.offerId;
  },
});

// ─── OFFER RESPONSE ────────────────────────────────────────

export const acceptOffer = mutation({
  args: {
    offerId: v.id("offers"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const offer = await ctx.db.get(args.offerId);
    if (!offer) throw new Error("Offer not found");
    if (offer.status !== "approved") throw new Error("Offer must be approved first");

    await ctx.db.patch(args.offerId, {
      status: "accepted",
      updatedAt: Date.now(),
    });

    // Update candidate status
    await ctx.db.patch(offer.candidateId, {
      status: "offer_accepted",
      updatedAt: Date.now(),
    });

    await createTimelineEvent(ctx, {
      candidateId: offer.candidateId,
      eventType: "offer_accepted",
      title: "Offer Accepted",
      description: `Candidate accepted the offer`,
      performedBy: identity.subject as any,
    });

    return args.offerId;
  },
});

export const declineOffer = mutation({
  args: {
    offerId: v.id("offers"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const offer = await ctx.db.get(args.offerId);
    if (!offer) throw new Error("Offer not found");

    await ctx.db.patch(args.offerId, {
      status: "declined",
      notes: args.reason || offer.notes,
      updatedAt: Date.now(),
    });

    // Update candidate status to rejected (declined offer)
    await ctx.db.patch(offer.candidateId, {
      status: "rejected",
      rejectionReason: args.reason || "Declined offer",
      updatedAt: Date.now(),
    });

    await createTimelineEvent(ctx, {
      candidateId: offer.candidateId,
      eventType: "offer_declined",
      title: "Offer Declined",
      description: args.reason || "Candidate declined the offer",
      performedBy: identity.subject as any,
    });

    return args.offerId;
  },
});

export const withdrawOffer = mutation({
  args: {
    offerId: v.id("offers"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const offer = await ctx.db.get(args.offerId);
    if (!offer) throw new Error("Offer not found");

    await ctx.db.patch(args.offerId, {
      status: "withdrawn",
      notes: args.reason || offer.notes,
      updatedAt: Date.now(),
    });

    await createTimelineEvent(ctx, {
      candidateId: offer.candidateId,
      eventType: "offer_withdrawn",
      title: "Offer Withdrawn",
      description: args.reason || "Offer was withdrawn",
      performedBy: identity.subject as any,
    });

    return args.offerId;
  },
});

// ─── QUERIES ───────────────────────────────────────────────

export const getOffer = query({
  args: { id: v.id("offers") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const getCandidateOffer = query({
  args: { candidateId: v.id("candidates") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("offers")
      .withIndex("candidateId", (q: any) => q.eq("candidateId", args.candidateId))
      .first();
  },
});

export const listOffers = query({
  args: {
    status: v.optional(v.string()),
    candidateId: v.optional(v.id("candidates")),
  },
  handler: async (ctx, args) => {
    let q: any = ctx.db.query("offers");
    if (args.status) {
      q = q.filter((q: any) => q.eq(q.field("status"), args.status));
    }
    if (args.candidateId) {
      q = q.filter((q: any) => q.eq(q.field("candidateId"), args.candidateId));
    }
    const results = await q.collect();
    return results.sort((a: any, b: any) => b.createdAt - a.createdAt);
  },
});

export const getOfferStats = query({
  handler: async (ctx) => {
    const offers = await ctx.db.query("offers").collect();
    return {
      total: offers.length,
      pending: offers.filter((o) => o.status === "pending").length,
      approved: offers.filter((o) => o.status === "approved").length,
      accepted: offers.filter((o) => o.status === "accepted").length,
      declined: offers.filter((o) => o.status === "declined").length,
      withdrawn: offers.filter((o) => o.status === "withdrawn").length,
      rejected: offers.filter((o) => o.status === "rejected").length,
    };
  },
});
