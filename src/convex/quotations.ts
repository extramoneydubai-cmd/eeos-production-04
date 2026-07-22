import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ─── Queries ───

export const list = query({
  args: {
    opportunityId: v.optional(v.id("opportunities")),
    leadId: v.optional(v.id("leadMaster")),
    status: v.optional(v.union(v.literal("draft"), v.literal("sent"), v.literal("accepted"), v.literal("rejected"), v.literal("expired"), v.literal("revised"))),
  },
  handler: async (ctx, args) => {
    let items = await ctx.db.query("quotations").collect();
    if (args.opportunityId) items = items.filter((i) => i.opportunityId === args.opportunityId);
    if (args.leadId) items = items.filter((i) => i.leadId === args.leadId);
    if (args.status) items = items.filter((i) => i.status === args.status);
    return items.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const get = query({
  args: { id: v.id("quotations") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const getLineItems = query({
  args: { quotationId: v.id("quotations") },
  handler: async (ctx, args) => {
    const items = await ctx.db.query("quotationLineItems").withIndex("quotationId", (q) => q.eq("quotationId", args.quotationId)).collect();
    return items.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const getVersions = query({
  args: { quotationId: v.id("quotations") },
  handler: async (ctx, args) => {
    return (await ctx.db.query("quotationVersions").withIndex("quotationId", (q) => q.eq("quotationId", args.quotationId)).collect())
      .sort((a, b) => b.version - a.version);
  },
});

// ─── Mutations ───

export const create = mutation({
  args: {
    opportunityId: v.id("opportunities"),
    leadId: v.id("leadMaster"),
    createdBy: v.id("users"),
    issuedDate: v.number(),
    expiryDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    terms: v.optional(v.string()),
    validUntil: v.optional(v.number()),
    currency: v.optional(v.string()),
    lineItems: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      discountPercent: v.optional(v.number()),
      taxPercent: v.optional(v.number()),
    })),
    discountPercent: v.optional(v.number()),
    gstPercent: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Calculate line items
    let subtotal = 0;
    const lineItemIds: Id<"quotationLineItems">[] = [];
    for (let i = 0; i < args.lineItems.length; i++) {
      const li = args.lineItems[i];
      const lineDiscount = li.discountPercent ? (li.unitPrice * li.quantity * li.discountPercent / 100) : 0;
      const lineTotalRaw = (li.unitPrice * li.quantity) - lineDiscount;
      const taxAmount = li.taxPercent ? (lineTotalRaw * li.taxPercent / 100) : 0;
      const lineTotal = lineTotalRaw + taxAmount;
      subtotal += lineTotalRaw;

      const id = await ctx.db.insert("quotationLineItems", {
        quotationId: "" as any,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        discountPercent: li.discountPercent,
        discountAmount: lineDiscount,
        taxPercent: li.taxPercent,
        taxAmount,
        total: lineTotal,
        sortOrder: i,
        createdAt: now,
      });
      lineItemIds.push(id);
    }

    const discountAmount = args.discountPercent ? (subtotal * args.discountPercent / 100) : 0;
    const afterDiscount = subtotal - discountAmount;
    const gstAmount = args.gstPercent ? (afterDiscount * args.gstPercent / 100) : 0;
    const total = afterDiscount + gstAmount;

    // Generate quote number
    const allQuotes = await ctx.db.query("quotations").collect();
    const quoteCount = allQuotes.length + 1;
    const quoteNumber = `Q-${String(quoteCount).padStart(5, "0")}`;

    const quoteId = await ctx.db.insert("quotations", {
      opportunityId: args.opportunityId,
      leadId: args.leadId,
      quoteNumber,
      status: "draft",
      issuedDate: args.issuedDate,
      expiryDate: args.expiryDate,
      subtotal,
      discountPercent: args.discountPercent,
      discountAmount,
      gstPercent: args.gstPercent,
      gstAmount,
      total,
      currency: args.currency,
      notes: args.notes,
      terms: args.terms,
      validUntil: args.validUntil,
      createdBy: args.createdBy,
      isActive: true,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Update line items with correct quotationId
    for (const liId of lineItemIds) {
      await ctx.db.patch(liId, { quotationId: quoteId });
    }

    // Save version 1
    const versionData = JSON.stringify({
      lineItems: args.lineItems,
      discountPercent: args.discountPercent,
      gstPercent: args.gstPercent,
      subtotal,
      total,
      notes: args.notes,
      terms: args.terms,
    });
    await ctx.db.insert("quotationVersions", {
      quotationId: quoteId,
      version: 1,
      data: versionData,
      changedBy: args.createdBy,
      changeNotes: "Initial version",
      createdAt: now,
    });

    return quoteId;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("quotations"),
    status: v.union(v.literal("draft"), v.literal("sent"), v.literal("accepted"), v.literal("rejected"), v.literal("expired"), v.literal("revised")),
    userId: v.id("users"),
    changeNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const quote = await ctx.db.get(args.id);
    if (!quote) throw new Error("Quotation not found");
    await ctx.db.patch(args.id, { status: args.status, updatedAt: now });
    if (args.status === "accepted") {
      await ctx.db.patch(args.id, { approvedBy: args.userId });
    }
  },
});

export const update = mutation({
  args: {
    id: v.id("quotations"),
    notes: v.optional(v.string()),
    terms: v.optional(v.string()),
    userId: v.id("users"),
    changeNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, userId, changeNotes, ...fields } = args;
    const quote = await ctx.db.get(id);
    if (!quote) throw new Error("Quotation not found");
    const now = Date.now();
    const updates: Record<string, any> = { updatedAt: now };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    const newVersion = quote.version + 1;
    updates.version = newVersion;
    await ctx.db.patch(id, updates);

    // Save version snapshot
    await ctx.db.insert("quotationVersions", {
      quotationId: id,
      version: newVersion,
      data: JSON.stringify(updates),
      changedBy: userId,
      changeNotes: changeNotes || `Updated to version ${newVersion}`,
      createdAt: now,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("quotations") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: false, updatedAt: Date.now() });
  },
});
