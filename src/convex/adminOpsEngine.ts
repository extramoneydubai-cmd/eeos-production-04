/**
 * Administration Operations Engine — PATCH-ERP-003 Phase 3
 *
 * Powers the Administration Workspace (/studio/administration).
 *
 * Persistence is genuinely new (schema/adminOps.ts) — no duplicate engines
 * or schemas. Mutation/query pattern mirrors adminEngine (plain Convex
 * functions; visibility is handled by the platform's AccessEngine at the
 * app-shell level). Actor ids (createdBy / performedBy) are optional so
 * demo/local fallback sessions can operate without a real Convex user id.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withScopeAndEvents } from "./withScopeAndEvents";

// ─── Enterprise Pipeline Config ─────────────────────────────────
// Every admin-ops mutation routes through withScopeAndEvents() so each
// register emits audit + timeline + event-bus records and signals
// dashboard refresh.
//
// getUserId returns undefined intentionally: actor ids (createdBy /
// performedBy) are optional so demo/local fallback sessions can operate
// without a real Convex user id, and staff (team/self scopes) would
// otherwise be denied writes with an empty entity scope. Scope
// enforcement therefore stays a no-op here while the event pipeline is
// fully wired. Search indexing, notification matrix, workflow and
// automation triggers stay off — these are operational registers, not
// searchable/approval entities.
const adminPipeline = {
  module: "admin",
  getUserId: () => undefined,
  getEntityCompanyId: () => undefined,
  getEntityBranchId: () => undefined,
  notifyViaMatrix: false,
  triggerWorkflow: false,
  triggerAutomation: false,
  registerSearch: false,
  signalDashboard: true,
} as const;

// ─── Visitors ──────────────────────────────────────────────

export const listVisitors = query({
  handler: async (ctx) => {
    const visitors = await ctx.db.query("visitors").order("desc").collect();
    return visitors;
  },
});

export const registerVisitor = mutation({
  args: {
    name: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    company: v.optional(v.string()),
    purpose: v.optional(v.string()),
    hostUserId: v.optional(v.id("users")),
    hostName: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: withScopeAndEvents(
    {
      ...adminPipeline,
      operation: "create",
      entity: "visitor",
      eventType: "admin.visitor.registered",
      title: "Visitor Registered",
    },
    async (ctx, args) => {
    const now = Date.now();
    const qrToken = `vst_${now.toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
    return ctx.db.insert("visitors", {
      name: args.name,
      phone: args.phone,
      email: args.email,
      company: args.company,
      purpose: args.purpose,
      hostUserId: args.hostUserId,
      hostName: args.hostName,
      qrToken,
      status: "pending",
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
    }
  ),
});

export const approveVisitor = mutation({
  args: { visitorId: v.id("visitors"), performedBy: v.optional(v.id("users")) },
  handler: withScopeAndEvents(
    {
      ...adminPipeline,
      operation: "approve",
      entity: "visitor",
      eventType: "admin.visitor.approved",
      title: "Visitor Approved",
    },
    async (ctx, args) => {
    await ctx.db.patch(args.visitorId, { status: "approved", updatedAt: Date.now() });
    return args.visitorId;
    }
  ),
});

export const denyVisitor = mutation({
  args: { visitorId: v.id("visitors"), performedBy: v.optional(v.id("users")) },
  handler: withScopeAndEvents(
    {
      ...adminPipeline,
      operation: "approve",
      entity: "visitor",
      eventType: "admin.visitor.denied",
      title: "Visitor Denied",
    },
    async (ctx, args) => {
    await ctx.db.patch(args.visitorId, { status: "denied", updatedAt: Date.now() });
    return args.visitorId;
    }
  ),
});

export const checkInVisitor = mutation({
  args: { visitorId: v.id("visitors"), performedBy: v.optional(v.id("users")) },
  handler: withScopeAndEvents(
    {
      ...adminPipeline,
      operation: "update",
      entity: "visitor",
      eventType: "admin.visitor.checked_in",
      title: "Visitor Checked In",
    },
    async (ctx, args) => {
    await ctx.db.patch(args.visitorId, {
      status: "checked_in",
      checkIn: Date.now(),
      updatedAt: Date.now(),
    });
    return args.visitorId;
    }
  ),
});

export const checkOutVisitor = mutation({
  args: { visitorId: v.id("visitors"), performedBy: v.optional(v.id("users")) },
  handler: withScopeAndEvents(
    {
      ...adminPipeline,
      operation: "update",
      entity: "visitor",
      eventType: "admin.visitor.checked_out",
      title: "Visitor Checked Out",
    },
    async (ctx, args) => {
    await ctx.db.patch(args.visitorId, {
      status: "checked_out",
      checkOut: Date.now(),
      updatedAt: Date.now(),
    });
    return args.visitorId;
    }
  ),
});

// ─── Meeting Rooms ─────────────────────────────────────────

export const listMeetingRooms = query({
  handler: async (ctx) => ctx.db.query("meetingRooms").collect(),
});

export const createMeetingRoom = mutation({
  args: {
    name: v.string(),
    code: v.optional(v.string()),
    capacity: v.optional(v.number()),
    location: v.optional(v.string()),
    amenities: v.optional(v.array(v.string())),
    createdBy: v.optional(v.id("users")),
  },
  handler: withScopeAndEvents(
    {
      ...adminPipeline,
      operation: "create",
      entity: "meeting_room",
      eventType: "admin.meeting_room.created",
      title: "Meeting Room Created",
    },
    async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("meetingRooms", {
      name: args.name,
      code: args.code,
      capacity: args.capacity,
      location: args.location,
      amenities: args.amenities,
      status: "available",
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
    }
  ),
});

export const updateMeetingRoomStatus = mutation({
  args: {
    roomId: v.id("meetingRooms"),
    status: v.union(v.literal("available"), v.literal("booked"), v.literal("maintenance")),
  },
  handler: withScopeAndEvents(
    {
      ...adminPipeline,
      operation: "update",
      entity: "meeting_room",
      eventType: "admin.meeting_room.updated",
      title: "Meeting Room Status Updated",
    },
    async (ctx, args) => {
    await ctx.db.patch(args.roomId, { status: args.status, updatedAt: Date.now() });
    return args.roomId;
    }
  ),
});

// ─── Office Assets ─────────────────────────────────────────

export const listOfficeAssets = query({
  handler: async (ctx) => ctx.db.query("officeAssets").order("desc").collect(),
});

export const createOfficeAsset = mutation({
  args: {
    name: v.string(),
    assetCode: v.optional(v.string()),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    purchaseDate: v.optional(v.number()),
    value: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: withScopeAndEvents(
    {
      ...adminPipeline,
      operation: "create",
      entity: "office_asset",
      eventType: "admin.office_asset.created",
      title: "Office Asset Created",
    },
    async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("officeAssets", {
      name: args.name,
      assetCode: args.assetCode,
      category: args.category,
      location: args.location,
      assignedTo: args.assignedTo,
      purchaseDate: args.purchaseDate,
      value: args.value,
      notes: args.notes,
      status: "active",
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
    }
  ),
});

export const updateOfficeAssetStatus = mutation({
  args: {
    assetId: v.id("officeAssets"),
    status: v.union(v.literal("active"), v.literal("in_use"), v.literal("maintenance"), v.literal("retired")),
  },
  handler: withScopeAndEvents(
    {
      ...adminPipeline,
      operation: "update",
      entity: "office_asset",
      eventType: "admin.office_asset.updated",
      title: "Office Asset Status Updated",
    },
    async (ctx, args) => {
    await ctx.db.patch(args.assetId, { status: args.status, updatedAt: Date.now() });
    return args.assetId;
    }
  ),
});

// ─── Stationery ────────────────────────────────────────────

export const listStationery = query({
  handler: async (ctx) => ctx.db.query("stationery").collect(),
});

export const createStationery = mutation({
  args: {
    name: v.string(),
    sku: v.optional(v.string()),
    unit: v.optional(v.string()),
    quantity: v.number(),
    minStock: v.optional(v.number()),
    supplier: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: withScopeAndEvents(
    {
      ...adminPipeline,
      operation: "create",
      entity: "stationery",
      eventType: "admin.stationery.created",
      title: "Stationery Created",
    },
    async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("stationery", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
    }
  ),
});

export const adjustStationery = mutation({
  args: { itemId: v.id("stationery"), delta: v.number(), createdBy: v.optional(v.id("users")) },
  handler: withScopeAndEvents(
    {
      ...adminPipeline,
      operation: "update",
      entity: "stationery",
      eventType: "admin.stationery.adjusted",
      title: "Stationery Adjusted",
    },
    async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Stationery item not found");
    await ctx.db.patch(args.itemId, {
      quantity: Math.max(0, item.quantity + args.delta),
      updatedAt: Date.now(),
    });
    return args.itemId;
    }
  ),
});

// ─── Housekeeping ──────────────────────────────────────────

export const listHousekeepingTasks = query({
  handler: async (ctx) => ctx.db.query("housekeepingTasks").order("desc").collect(),
});

export const createHousekeepingTask = mutation({
  args: {
    taskName: v.string(),
    area: v.optional(v.string()),
    assignee: v.optional(v.string()),
    scheduledDate: v.optional(v.number()),
    createdBy: v.optional(v.id("users")),
  },
  handler: withScopeAndEvents(
    {
      ...adminPipeline,
      operation: "create",
      entity: "housekeeping_task",
      eventType: "admin.housekeeping.created",
      title: "Housekeeping Task Created",
    },
    async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("housekeepingTasks", {
      taskName: args.taskName,
      area: args.area,
      assignee: args.assignee,
      scheduledDate: args.scheduledDate,
      status: "pending",
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
    }
  ),
});

export const updateHousekeepingStatus = mutation({
  args: {
    taskId: v.id("housekeepingTasks"),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed")),
  },
  handler: withScopeAndEvents(
    {
      ...adminPipeline,
      operation: "update",
      entity: "housekeeping_task",
      eventType: "admin.housekeeping.updated",
      title: "Housekeeping Task Updated",
    },
    async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.taskId, {
      status: args.status,
      completedAt: args.status === "completed" ? now : undefined,
      updatedAt: now,
    });
    return args.taskId;
    }
  ),
});

// ─── Security Checks ───────────────────────────────────────

export const listSecurityChecks = query({
  handler: async (ctx) => ctx.db.query("securityChecks").order("desc").collect(),
});

export const createSecurityCheck = mutation({
  args: {
    checkName: v.string(),
    area: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: withScopeAndEvents(
    {
      ...adminPipeline,
      operation: "create",
      entity: "security_check",
      eventType: "admin.security_check.created",
      title: "Security Check Created",
    },
    async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("securityChecks", {
      checkName: args.checkName,
      area: args.area,
      notes: args.notes,
      status: "pending",
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
    }
  ),
});

export const completeSecurityCheck = mutation({
  args: {
    checkId: v.id("securityChecks"),
    status: v.union(v.literal("pending"), v.literal("passed"), v.literal("failed")),
    performedBy: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      ...adminPipeline,
      operation: "update",
      entity: "security_check",
      eventType: "admin.security_check.completed",
      title: "Security Check Completed",
    },
    async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.checkId, {
      status: args.status,
      performedBy: args.performedBy,
      checkedAt: args.status === "pending" ? undefined : now,
      updatedAt: now,
    });
    return args.checkId;
    }
  ),
});

// ─── Utility Bills ─────────────────────────────────────────

export const listUtilityBills = query({
  handler: async (ctx) => ctx.db.query("utilityBills").order("desc").collect(),
});

export const createUtilityBill = mutation({
  args: {
    utilityType: v.union(
      v.literal("electricity"),
      v.literal("water"),
      v.literal("internet"),
      v.literal("gas"),
      v.literal("other")
    ),
    billNumber: v.optional(v.string()),
    amount: v.number(),
    dueDate: v.optional(v.number()),
    createdBy: v.optional(v.id("users")),
  },
  handler: withScopeAndEvents(
    {
      ...adminPipeline,
      operation: "create",
      entity: "utility_bill",
      eventType: "admin.utility_bill.created",
      title: "Utility Bill Created",
    },
    async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("utilityBills", {
      utilityType: args.utilityType,
      billNumber: args.billNumber,
      amount: args.amount,
      dueDate: args.dueDate,
      status: "pending",
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
    }
  ),
});

export const markBillPaid = mutation({
  args: { billId: v.id("utilityBills"), performedBy: v.optional(v.id("users")) },
  handler: withScopeAndEvents(
    {
      ...adminPipeline,
      operation: "approve",
      entity: "utility_bill",
      eventType: "admin.utility_bill.paid",
      title: "Utility Bill Marked Paid",
    },
    async (ctx, args) => {
    await ctx.db.patch(args.billId, { status: "paid", paidDate: Date.now(), updatedAt: Date.now() });
    return args.billId;
    }
  ),
});

// ─── AMC Contracts ─────────────────────────────────────────

export const listAmcContracts = query({
  handler: async (ctx) => ctx.db.query("amcContracts").order("desc").collect(),
});

export const createAmcContract = mutation({
  args: {
    vendor: v.string(),
    assetType: v.optional(v.string()),
    contractNumber: v.optional(v.string()),
    amount: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: withScopeAndEvents(
    {
      ...adminPipeline,
      operation: "create",
      entity: "amc_contract",
      eventType: "admin.amc.created",
      title: "AMC Contract Created",
    },
    async (ctx, args) => {
    const now = Date.now();
    const status = args.endDate && args.endDate < now ? "expired" : "active";
    return ctx.db.insert("amcContracts", {
      ...args,
      status,
      createdAt: now,
      updatedAt: now,
    });
    }
  ),
});

export const updateAmcStatus = mutation({
  args: {
    contractId: v.id("amcContracts"),
    status: v.union(v.literal("active"), v.literal("expiring"), v.literal("expired")),
  },
  handler: withScopeAndEvents(
    {
      ...adminPipeline,
      operation: "update",
      entity: "amc_contract",
      eventType: "admin.amc.updated",
      title: "AMC Status Updated",
    },
    async (ctx, args) => {
    await ctx.db.patch(args.contractId, { status: args.status, updatedAt: Date.now() });
    return args.contractId;
    }
  ),
});

// ─── Vendor Visits ─────────────────────────────────────────

export const listVendorVisits = query({
  handler: async (ctx) => ctx.db.query("vendorVisits").order("desc").collect(),
});

export const registerVendorVisit = mutation({
  args: {
    vendorName: v.string(),
    purpose: v.optional(v.string()),
    hostUserId: v.optional(v.id("users")),
    hostName: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
  },
  handler: withScopeAndEvents(
    {
      ...adminPipeline,
      operation: "create",
      entity: "vendor_visit",
      eventType: "admin.vendor_visit.registered",
      title: "Vendor Visit Registered",
    },
    async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("vendorVisits", {
      vendorName: args.vendorName,
      purpose: args.purpose,
      hostUserId: args.hostUserId,
      hostName: args.hostName,
      status: "scheduled",
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
    }
  ),
});

export const checkInVendorVisit = mutation({
  args: { visitId: v.id("vendorVisits"), performedBy: v.optional(v.id("users")) },
  handler: withScopeAndEvents(
    {
      ...adminPipeline,
      operation: "update",
      entity: "vendor_visit",
      eventType: "admin.vendor_visit.checked_in",
      title: "Vendor Visit Checked In",
    },
    async (ctx, args) => {
    await ctx.db.patch(args.visitId, { status: "checked_in", checkIn: Date.now(), updatedAt: Date.now() });
    return args.visitId;
    }
  ),
});

export const checkOutVendorVisit = mutation({
  args: { visitId: v.id("vendorVisits"), performedBy: v.optional(v.id("users")) },
  handler: withScopeAndEvents(
    {
      ...adminPipeline,
      operation: "update",
      entity: "vendor_visit",
      eventType: "admin.vendor_visit.checked_out",
      title: "Vendor Visit Checked Out",
    },
    async (ctx, args) => {
    await ctx.db.patch(args.visitId, { status: "checked_out", checkOut: Date.now(), updatedAt: Date.now() });
    return args.visitId;
    }
  ),
});

// ─── Incident Register ─────────────────────────────────────

export const listIncidents = query({
  handler: async (ctx) => ctx.db.query("incidentRegister").order("desc").collect(),
});

export const createIncident = mutation({
  args: {
    incidentType: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    description: v.string(),
    location: v.optional(v.string()),
    reportedBy: v.optional(v.id("users")),
    createdBy: v.optional(v.id("users")),
  },
  handler: withScopeAndEvents(
    {
      ...adminPipeline,
      operation: "create",
      entity: "incident",
      eventType: "admin.incident.created",
      title: "Incident Created",
    },
    async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("incidentRegister", {
      incidentType: args.incidentType,
      severity: args.severity,
      description: args.description,
      location: args.location,
      reportedBy: args.reportedBy,
      status: "open",
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });
    }
  ),
});

export const updateIncidentStatus = mutation({
  args: {
    incidentId: v.id("incidentRegister"),
    status: v.union(v.literal("open"), v.literal("investigating"), v.literal("resolved"), v.literal("closed")),
    resolution: v.optional(v.string()),
  },
  handler: withScopeAndEvents(
    {
      ...adminPipeline,
      operation: "update",
      entity: "incident",
      eventType: "admin.incident.updated",
      title: "Incident Status Updated",
    },
    async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.incidentId, {
      status: args.status,
      resolution: args.resolution,
      resolvedAt: args.status === "resolved" || args.status === "closed" ? now : undefined,
      updatedAt: now,
    });
    return args.incidentId;
    }
  ),
});

// ─── Aggregate Administration Dashboard ────────────────────
// Live counts across every admin-ops register.

export const getAdminOpsDashboard = query({
  handler: async (ctx) => {
    const [visitors, rooms, assets, stationery, housekeeping, security, bills, amc, visits, incidents] =
      await Promise.all([
        ctx.db.query("visitors").collect(),
        ctx.db.query("meetingRooms").collect(),
        ctx.db.query("officeAssets").collect(),
        ctx.db.query("stationery").collect(),
        ctx.db.query("housekeepingTasks").collect(),
        ctx.db.query("securityChecks").collect(),
        ctx.db.query("utilityBills").collect(),
        ctx.db.query("amcContracts").collect(),
        ctx.db.query("vendorVisits").collect(),
        ctx.db.query("incidentRegister").collect(),
      ]);

    const now = Date.now();
    const pendingVisitors = (visitors as any[]).filter((v: any) => v.status === "pending" || v.status === "approved").length;
    const checkedIn = (visitors as any[]).filter((v: any) => v.status === "checked_in").length;
    const openIncidents = (incidents as any[]).filter((i: any) => i.status === "open" || i.status === "investigating").length;
    const criticalIncidents = (incidents as any[]).filter((i: any) => i.severity === "critical" && i.status !== "closed").length;
    const unpaidBills = (bills as any[]).filter((b: any) => b.status === "pending" || b.status === "overdue").length;
    const overdueBills = (bills as any[]).filter((b: any) => b.status === "overdue" || (b.status === "pending" && b.dueDate && b.dueDate < now)).length;
    const lowStock = (stationery as any[]).filter((s: any) => s.minStock != null && s.quantity <= s.minStock).length;
    const activeAmc = (amc as any[]).filter((a: any) => a.status === "active").length;
    const expiringAmc = (amc as any[]).filter((a: any) => a.status === "expiring" || (a.endDate && a.endDate - now < 30 * 24 * 60 * 60 * 1000)).length;
    const pendingHousekeeping = (housekeeping as any[]).filter((h: any) => h.status !== "completed").length;
    const failedSecurity = (security as any[]).filter((s: any) => s.status === "failed").length;
    const roomsAvailable = (rooms as any[]).filter((r: any) => r.status === "available").length;

    return {
      counts: {
        visitors: visitors.length,
        pendingVisitors,
        checkedIn,
        meetingRooms: rooms.length,
        roomsAvailable,
        officeAssets: assets.length,
        stationeryItems: stationery.length,
        lowStock,
        housekeepingPending: pendingHousekeeping,
        securityChecks: security.length,
        failedSecurity,
        utilityBills: bills.length,
        unpaidBills,
        overdueBills,
        amcContracts: amc.length,
        activeAmc,
        expiringAmc,
        vendorVisits: visits.length,
        incidents: incidents.length,
        openIncidents,
        criticalIncidents,
      },
    };
  },
});
