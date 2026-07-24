import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── HELPERS ───────────────────────────────────────────────

async function createTimelineEvent(
  ctx: any,
  args: { studentId: string; eventType: string; title: string; description?: string; metadata?: string; performedBy?: string }
) {
  const performedBy = args.performedBy || (await getAuthUserId(ctx));
  await ctx.db.insert("studentEnrollmentHistory", {
    studentId: args.studentId,
    eventType: args.eventType,
    title: args.title,
    description: args.description,
    metadata: args.metadata,
    performedBy: performedBy,
    createdAt: Date.now(),
  });
}

function generateInvoiceNumber(prefix: string, count: number): string {
  const padded = String(count + 1).padStart(5, "0");
  return `${prefix}-${padded}`;
}

// ─── FEE STRUCTURES CRUD ────────────────────────────────────

export const createFeeStructure = mutation({
  args: {
    name: v.string(),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    feeCategoryId: v.optional(v.id("financeFeeCategories")),
    amount: v.number(),
    isRecurring: v.boolean(),
    frequency: v.union(v.literal("one_time"), v.literal("monthly"), v.literal("quarterly"), v.literal("half_yearly"), v.literal("yearly")),
    isOptional: v.boolean(),
    isRefundable: v.boolean(),
    applicableToVerticals: v.optional(v.array(v.string())),
    applicableToCourses: v.optional(v.array(v.id("courses"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const id = await ctx.db.insert("feeStructures", {
      ...args,
      isActive: true,
      createdBy: userId,
    });
    return id;
  },
});

export const updateFeeStructure = mutation({
  args: {
    id: v.id("feeStructures"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    isRecurring: v.optional(v.boolean()),
    frequency: v.optional(v.union(v.literal("one_time"), v.literal("monthly"), v.literal("quarterly"), v.literal("half_yearly"), v.literal("yearly"))),
    isOptional: v.optional(v.boolean()),
    isRefundable: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
    return id;
  },
});

export const listFeeStructures = query({
  args: {
    isActive: v.optional(v.boolean()),
    feeCategoryId: v.optional(v.id("financeFeeCategories")),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("feeStructures");
    if (args.isActive !== undefined) {
      query = query.filter((q: any) => q.eq(q.field("isActive"), args.isActive));
    }
    if (args.feeCategoryId) {
      query = query.filter((q: any) => q.eq(q.field("feeCategoryId"), args.feeCategoryId));
    }
    return query.collect();
  },
});

export const getFeeStructure = query({
  args: { id: v.id("feeStructures") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

// ─── STUDENT FEE ACCOUNTS ──────────────────────────────────

export const createFeeAccount = mutation({
  args: {
    studentId: v.id("studentMaster"),
    totalFee: v.number(),
    installmentCount: v.number(),
    installmentFrequency: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if account already exists
    const existing = await ctx.db.query("studentFeeAccounts")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .first();
    if (existing) throw new Error("Fee account already exists for this student");

    const id = await ctx.db.insert("studentFeeAccounts", {
      studentId: args.studentId,
      totalFee: args.totalFee,
      totalPaid: 0,
      outstandingBalance: args.totalFee,
      totalDiscount: 0,
      totalScholarship: 0,
      totalWaiver: 0,
      installmentsCount: args.installmentCount,
      installmentFrequency: args.installmentFrequency,
      status: "active",
      createdBy: userId,
    });

    await createTimelineEvent(ctx, {
      studentId: args.studentId,
      eventType: "FeeAccountCreated",
      title: "Fee Account Created",
      description: `Total fee: ${args.totalFee}, ${args.installmentCount} installments`,
      performedBy: userId,
    });

    return id;
  },
});

export const getStudentFeeAccount = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    return ctx.db.query("studentFeeAccounts")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .first();
  },
});

export const calculateOutstanding = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    const account = await ctx.db.query("studentFeeAccounts")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .first();
    if (!account) return null;

    const installments = await ctx.db.query("feeInstallments")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .collect();

    const totalDue = installments.reduce((sum, i: any) => sum + i.amount + i.lateFee, 0);
    const totalPaid = installments.reduce((sum, i: any) => sum + i.paidAmount, 0);

    return {
      totalDue,
      totalPaid,
      outstanding: totalDue - totalPaid,
      lateFees: installments.reduce((sum, i: any) => sum + i.lateFee, 0),
      installmentCount: installments.length,
      paidInstallments: installments.filter((i: any) => i.status === "paid").length,
      overdueCount: installments.filter((i: any) => i.status === "overdue").length,
    };
  },
});

export const recalculateBalances = mutation({
  args: { feeAccountId: v.id("studentFeeAccounts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const account = await ctx.db.get(args.feeAccountId);
    if (!account) throw new Error("Fee account not found");

    const installments = await ctx.db.query("feeInstallments")
      .withIndex("studentId", (q: any) => q.eq("studentId", account.studentId))
      .collect();

    const totalPaid = installments.reduce((sum: number, i: any) => sum + i.paidAmount, 0);
    const totalDue = installments.reduce((sum: number, i: any) => sum + i.amount, 0);

    await ctx.db.patch(args.feeAccountId, {
      totalPaid,
      outstandingBalance: Math.max(0, totalDue - totalPaid),
    });

    return args.feeAccountId;
  },
});

// ─── INSTALLMENTS ──────────────────────────────────────────

export const generateInstallments = mutation({
  args: {
    feeAccountId: v.id("studentFeeAccounts"),
    startDate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const account = await ctx.db.get(args.feeAccountId);
    if (!account) throw new Error("Fee account not found");

    // Delete existing installments if regenerating
    const existing = await ctx.db.query("feeInstallments")
      .withIndex("studentId", (q: any) => q.eq("studentId", account.studentId))
      .collect();
    for (const inst of existing) {
      await ctx.db.delete(inst._id);
    }

    const installments: any[] = [];
    const perInstallment = account.totalFee / account.installmentsCount;
    const frequencyMap: Record<string, number> = {
      monthly: 30 * 24 * 60 * 60 * 1000,
      quarterly: 91 * 24 * 60 * 60 * 1000,
      half_yearly: 182 * 24 * 60 * 60 * 1000,
      yearly: 365 * 24 * 60 * 60 * 1000,
    };

    const interval = frequencyMap[account.installmentFrequency] || 30 * 24 * 60 * 60 * 1000;

    for (let i = 0; i < account.installmentsCount; i++) {
      const dueDate = startDate + i * interval;
      const id = await ctx.db.insert("feeInstallments", {
        studentId: account.studentId,
        feeAccountId: args.feeAccountId,
        installmentNumber: i + 1,
        totalInstallments: account.installmentsCount,
        amount: Math.round(perInstallment * 100) / 100,
        paidAmount: 0,
        dueDate,
        status: "pending",
        lateFee: 0,
      });
      installments.push(id);
    }

    // Update next due date
    if (installments.length > 0) {
      await ctx.db.patch(args.feeAccountId, {
        nextDueDate: (feeStructure as any).startDate + (installments.length * interval),
      });
    }

    await createTimelineEvent(ctx, {
      studentId: account.studentId,
      eventType: "InstallmentsGenerated",
      title: "Installments Generated",
      description: `${account.installmentsCount} installments of ${Math.round(perInstallment * 100) / 100} each`,
      performedBy: userId,
    });

    return installments;
  },
});

export const listInstallments = query({
  args: {
    studentId: v.id("studentMaster"),
    status: v.optional(v.union(v.literal("pending"), v.literal("paid"), v.literal("partial"), v.literal("overdue"), v.literal("cancelled"))),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("feeInstallments")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId));
    if (args.status) {
      query = query.filter((q: any) => q.eq(q.field("status"), args.status));
    }
    return query.collect();
  },
});

// ─── DISCOUNTS ─────────────────────────────────────────────

export const createDiscount = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    discountType: v.union(v.literal("percentage"), v.literal("fixed")),
    value: v.number(),
    maxAmount: v.optional(v.number()),
    applicableToVerticals: v.optional(v.array(v.string())),
    applicableToCourses: v.optional(v.array(v.id("courses"))),
    validFrom: v.optional(v.number()),
    validUntil: v.optional(v.number()),
    maxApplications: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db.insert("feeDiscounts", {
      ...args,
      isActive: true,
      currentApplications: 0,
      createdBy: userId,
    });
  },
});

export const applyDiscount = mutation({
  args: {
    studentId: v.id("studentMaster"),
    feeAccountId: v.id("studentFeeAccounts"),
    discountId: v.id("feeDiscounts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const discount = await ctx.db.get(args.discountId);
    if (!discount || !discount.isActive) throw new Error("Discount not available");
    if (discount.maxApplications && discount.currentApplications >= discount.maxApplications) {
      throw new Error("Discount usage limit reached");
    }

    const account = await ctx.db.get(args.feeAccountId);
    if (!account) throw new Error("Fee account not found");

    let discountAmount = 0;
    if (discount.discountType === "percentage") {
      discountAmount = (account.totalFee * discount.value) / 100;
      if (discount.maxAmount) discountAmount = Math.min(discountAmount, discount.maxAmount);
    } else {
      discountAmount = discount.value;
    }

    const newOutstanding = account.outstandingBalance - discountAmount;

    await ctx.db.patch(args.feeAccountId, {
      totalDiscount: (account.totalDiscount || 0) + discountAmount,
      outstandingBalance: Math.max(0, newOutstanding),
      totalFee: account.totalFee - discountAmount,
    });

    // Increment usage count
    await ctx.db.patch(args.discountId, {
      currentApplications: (discount.currentApplications || 0) + 1,
    });

    await createTimelineEvent(ctx, {
      studentId: args.studentId,
      eventType: "DiscountApplied",
      title: "Discount Applied",
      description: `${discount.name}: ${discountAmount} (${discount.discountType === "percentage" ? discount.value + "%" : "fixed"})`,
      metadata: JSON.stringify({ discountId: args.discountId, amount: discountAmount }),
      performedBy: userId,
    });

    return { discountAmount, newOutstanding };
  },
});

export const listDiscounts = query({
  args: { isActive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("feeDiscounts");
    if (args.isActive !== undefined) {
      query = query.filter((q: any) => q.eq(q.field("isActive"), args.isActive));
    }
    return query.collect();
  },
});

// ─── SCHOLARSHIPS ──────────────────────────────────────────

export const createScholarship = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    scholarshipType: v.union(v.literal("percentage"), v.literal("fixed")),
    value: v.number(),
    maxAmount: v.optional(v.number()),
    criteria: v.string(),
    applicableToVerticals: v.optional(v.array(v.string())),
    minGrade: v.optional(v.string()),
    minIncome: v.optional(v.number()),
    validFrom: v.optional(v.number()),
    validUntil: v.optional(v.number()),
    maxApplications: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db.insert("feeScholarships", {
      ...args,
      isActive: true,
      currentApplications: 0,
      createdBy: userId,
    });
  },
});

export const applyScholarship = mutation({
  args: {
    studentId: v.id("studentMaster"),
    feeAccountId: v.id("studentFeeAccounts"),
    scholarshipId: v.id("feeScholarships"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const scholarship = await ctx.db.get(args.scholarshipId);
    if (!scholarship || !scholarship.isActive) throw new Error("Scholarship not available");
    if (scholarship.maxApplications && scholarship.currentApplications >= scholarship.maxApplications) {
      throw new Error("Scholarship usage limit reached");
    }

    const account = await ctx.db.get(args.feeAccountId);
    if (!account) throw new Error("Fee account not found");

    let scholarshipAmount = 0;
    if (scholarship.scholarshipType === "percentage") {
      scholarshipAmount = (account.totalFee * scholarship.value) / 100;
      if (scholarship.maxAmount) scholarshipAmount = Math.min(scholarshipAmount, scholarship.maxAmount);
    } else {
      scholarshipAmount = scholarship.value;
    }

    const newOutstanding = account.outstandingBalance - scholarshipAmount;

    await ctx.db.patch(args.feeAccountId, {
      totalScholarship: (account.totalScholarship || 0) + scholarshipAmount,
      outstandingBalance: Math.max(0, newOutstanding),
    });

    await ctx.db.patch(args.scholarshipId, {
      currentApplications: (scholarship.currentApplications || 0) + 1,
    });

    await createTimelineEvent(ctx, {
      studentId: args.studentId,
      eventType: "ScholarshipApplied",
      title: "Scholarship Applied",
      description: `${scholarship.name}: ${scholarshipAmount}`,
      metadata: JSON.stringify({ scholarshipId: args.scholarshipId, amount: scholarshipAmount }),
      performedBy: userId,
    });

    return { scholarshipAmount, newOutstanding };
  },
});

export const listScholarships = query({
  args: { isActive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("feeScholarships");
    if (args.isActive !== undefined) {
      query = query.filter((q: any) => q.eq(q.field("isActive"), args.isActive));
    }
    return query.collect();
  },
});

// ─── WAIVERS ───────────────────────────────────────────────

export const createWaiver = mutation({
  args: {
    studentId: v.id("studentMaster"),
    feeAccountId: v.id("studentFeeAccounts"),
    waiverType: v.union(v.literal("full"), v.literal("partial")),
    amount: v.number(),
    reason: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db.insert("feeWaivers", {
      ...args,
      status: "pending",
      createdBy: userId,
    });
  },
});

export const approveWaiver = mutation({
  args: {
    waiverId: v.id("feeWaivers"),
    approve: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const waiver = await ctx.db.get(args.waiverId);
    if (!waiver) throw new Error("Waiver not found");

    const status = args.approve ? "approved" : "rejected";

    await ctx.db.patch(args.waiverId, {
      status,
      approvedBy: userId,
      approvedAt: Date.now(),
      notes: args.notes || waiver.notes,
    });

    if (args.approve) {
      const account = await ctx.db.get(waiver.feeAccountId);
      if (account) {
        const waiverAmount = waiver.waiverType === "full" ? account.outstandingBalance : waiver.amount;
        await ctx.db.patch(waiver.feeAccountId, {
          totalWaiver: (account.totalWaiver || 0) + waiverAmount,
          outstandingBalance: Math.max(0, account.outstandingBalance - waiverAmount),
        });
      }
    }

    await createTimelineEvent(ctx, {
      studentId: waiver.studentId,
      eventType: "WaiverApproved",
      title: args.approve ? "Waiver Approved" : "Waiver Rejected",
      description: `${args.approve ? "Approved" : "Rejected"} waiver of ${waiver.amount} for ${waiver.reason}`,
      performedBy: userId,
    });

    return args.waiverId;
  },
});

export const listWaivers = query({
  args: {
    studentId: v.optional(v.id("studentMaster")),
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
  },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("feeWaivers");
    if (args.studentId) {
      query = query.withIndex("studentId", (q: any) => q.eq("studentId", args.studentId));
    }
    if (args.status) {
      query = query.filter((q: any) => q.eq(q.field("status"), args.status));
    }
    return query.collect();
  },
});

// ─── LATE FEES ─────────────────────────────────────────────

export const createLateFeeRule = mutation({
  args: {
    name: v.string(),
    feeStructureId: v.optional(v.id("feeStructures")),
    gracePeriod: v.number(),
    gracePeriodUnit: v.union(v.literal("days"), v.literal("weeks")),
    lateFeeType: v.union(v.literal("percentage"), v.literal("fixed"), v.literal("per_day")),
    value: v.number(),
    maxLateFee: v.optional(v.number()),
    waiveFirstLateFee: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db.insert("lateFeeRules", {
      ...args,
      isActive: true,
    });
  },
});

export const calculateLateFees = mutation({
  args: { feeAccountId: v.id("studentFeeAccounts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const account = await ctx.db.get(args.feeAccountId);
    if (!account) throw new Error("Fee account not found");

    const rules = await ctx.db.query("lateFeeRules")
      .filter((q: any) => q.eq(q.field("isActive"), true))
      .collect();

    const installments = await ctx.db.query("feeInstallments")
      .withIndex("studentId", (q: any) => q.eq("studentId", account.studentId))
      .filter((q: any) => q.neq(q.field("status"), "paid"))
      .collect();

    const now = Date.now();
    const results: any[] = [];

    for (const inst of installments) {
      if (inst.dueDate >= now) continue;

      const daysLate = Math.floor((now - inst.dueDate) / (24 * 60 * 60 * 1000));
      let totalLateFee = 0;

      for (const rule of rules) {
        const graceMs = rule.gracePeriod * (rule.gracePeriodUnit === "days" ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000);
        if (now - inst.dueDate <= graceMs) continue;

        if (inst.installmentNumber === 1 && rule.waiveFirstLateFee) continue;

        let fee = 0;
        if (rule.lateFeeType === "percentage") {
          fee = (inst.amount * rule.value) / 100;
        } else if (rule.lateFeeType === "fixed") {
          fee = rule.value;
        } else if (rule.lateFeeType === "per_day") {
          fee = rule.value * daysLate;
        }

        if (rule.maxLateFee) fee = Math.min(fee, rule.maxLateFee);
        totalLateFee += fee;
      }

      if (totalLateFee > 0) {
        await ctx.db.patch(inst._id, {
          lateFee: totalLateFee,
          status: "overdue",
        });
        results.push({ installmentId: inst._id, lateFee: totalLateFee, daysLate });
      }
    }

    return results;
  },
});

export const listLateFeeRules = query({
  args: { isActive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let query: any = ctx.db.query("lateFeeRules");
    if (args.isActive !== undefined) {
      query = query.filter((q: any) => q.eq(q.field("isActive"), args.isActive));
    }
    return query.collect();
  },
});

// ─── FEE ACCOUNT SUMMARY ───────────────────────────────────

export const getFeeSummary = query({
  args: { studentId: v.id("studentMaster") },
  handler: async (ctx, args) => {
    const account = await ctx.db.query("studentFeeAccounts")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .first();
    if (!account) return null;

    const installments = await ctx.db.query("feeInstallments")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .order("asc")
      .collect();

    const invoices = await ctx.db.query("feeInvoices")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .collect();

    const payments = await ctx.db.query("paymentTransactions")
      .withIndex("studentId", (q: any) => q.eq("studentId", args.studentId))
      .collect();

    return {
      account,
      installments,
      invoices,
      payments,
      summary: {
        totalFee: account.totalFee,
        totalPaid: account.totalPaid,
        outstanding: account.outstandingBalance,
        totalDiscount: account.totalDiscount,
        totalScholarship: account.totalScholarship,
        totalWaiver: account.totalWaiver,
        lateFees: installments.reduce((s: number, i: any) => s + i.lateFee, 0),
        paidCount: installments.filter((i: any) => i.status === "paid").length,
        overdueCount: installments.filter((i: any) => i.status === "overdue").length,
        paymentCount: payments.length,
        invoiceCount: invoices.length,
      },
    };
  },
});
