/**
 * Support Schema — Enterprise Service Desk & Ticketing
 *
 * 15 tables covering:
 * - Tickets (master, comments, timeline, attachments, SLA, assignments, watchers)
 * - Categories & templates
 * - Knowledge base (articles, categories)
 * - Automation & approvals
 * - Ratings & asset linking
 */

import { v } from "convex/values";
import { defineTable } from "convex/server";

export const supportTables = {
  // ─── Tickets ────────────────────────────────────────────────
  ticketMaster: defineTable({
    ticketNumber: v.string(),           // Auto-generated: SVC-2026-0001
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(),                 // new, open, in_progress, pending, resolved, closed, reopened, cancelled
    priority: v.string(),               // low, medium, high, critical
    severity: v.optional(v.string()),   // sev1, sev2, sev3, sev4
    type: v.string(),                   // support, hardware, software, network, student, finance, etc.
    category: v.optional(v.string()),
    subCategory: v.optional(v.string()),
    source: v.optional(v.string()),     // portal, email, phone, chat, api, walkin, social
    channel: v.optional(v.string()),

    // People
    requesterId: v.optional(v.string()),
    requesterType: v.optional(v.string()), // student, employee, faculty, parent, vendor
    requesterName: v.optional(v.string()),
    requesterEmail: v.optional(v.string()),
    requesterPhone: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    assignedTeam: v.optional(v.string()),
    assignedGroup: v.optional(v.string()),

    // Organization
    organizationId: v.optional(v.id("organizations")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),

    // Related entities
    relatedEntityType: v.optional(v.string()), // student, employee, asset, invoice, etc.
    relatedEntityId: v.optional(v.string()),
    relatedAssetId: v.optional(v.id("ticketAssets")),

    // Workflow
    workflowDefinitionId: v.optional(v.id("workflowDefinitions")),
    workflowExecutionId: v.optional(v.id("workflowExecutions")),
    approvalStatus: v.optional(v.string()),
    approvalId: v.optional(v.string()),

    // Agent metrics
    firstResponseAt: v.optional(v.number()),
    firstResponseBy: v.optional(v.id("users")),
    resolvedAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
    reopenedCount: v.optional(v.number()),

    // SLA
    slaPolicyId: v.optional(v.string()),
    responseDueAt: v.optional(v.number()),
    resolutionDueAt: v.optional(v.number()),
    slaBreached: v.optional(v.boolean()),
    breachReason: v.optional(v.string()),

    // Flags
    isEscalated: v.optional(v.boolean()),
    escalatedAt: v.optional(v.number()),
    escalatedBy: v.optional(v.id("users")),
    escalationReason: v.optional(v.string()),
    isMerged: v.optional(v.boolean()),
    mergedInto: v.optional(v.id("ticketMaster")),
    isDuplicate: v.optional(v.boolean()),
    duplicateOf: v.optional(v.id("ticketMaster")),
    isInternal: v.optional(v.boolean()),
    isOverdue: v.optional(v.boolean()),

    // Satisfaction
    satisfactionRating: v.optional(v.number()),
    satisfactionComment: v.optional(v.string()),
    satisfactionRatedAt: v.optional(v.number()),

    // Metadata
    tags: v.optional(v.array(v.string())),
    customFields: v.optional(v.any()),
    internalNotes: v.optional(v.string()),
    resolutionSummary: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    updatedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_priority", ["priority", "status"])
    .index("by_type", ["type", "status"])
    .index("by_assigned", ["assignedTo", "status"])
    .index("by_requester", ["requesterId", "requesterType"])
    .index("by_organization", ["organizationId", "status"])
    .index("by_company", ["companyId", "status"])
    .index("by_branch", ["branchId", "status"])
    .index("by_department", ["departmentId", "status"])
    .index("by_entity", ["relatedEntityType", "relatedEntityId"])
    .index("by_sla", ["slaBreached", "status"])
    .index("by_escalation", ["isEscalated", "status"])
    .index("by_created", ["createdAt"]),

  ticketComments: defineTable({
    ticketId: v.id("ticketMaster"),
    body: v.string(),
    bodyHtml: v.optional(v.string()),
    type: v.string(),                   // comment, note, reply, internal_note, resolution, system
    isInternal: v.optional(v.boolean()), // private agent note
    isResolution: v.optional(v.boolean()),
    authorId: v.optional(v.id("users")),
    authorName: v.optional(v.string()),
    authorType: v.optional(v.string()),  // agent, requester, system
    attachments: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_ticket", ["ticketId", "createdAt"])
    .index("by_author", ["authorId"])
    .index("by_type", ["type", "createdAt"]),

  ticketTimeline: defineTable({
    ticketId: v.id("ticketMaster"),
    eventType: v.string(),              // created, assigned, status_changed, priority_changed, etc.
    description: v.string(),
    oldValue: v.optional(v.string()),
    newValue: v.optional(v.string()),
    actorId: v.optional(v.id("users")),
    actorName: v.optional(v.string()),
    metadata: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_ticket", ["ticketId", "timestamp"])
    .index("by_actor", ["actorId", "timestamp"])
    .index("by_event", ["eventType", "timestamp"]),

  ticketAttachments: defineTable({
    ticketId: v.id("ticketMaster"),
    commentId: v.optional(v.id("ticketComments")),
    fileName: v.string(),
    fileSize: v.number(),
    fileType: v.string(),
    fileUrl: v.optional(v.string()),
    storageKey: v.optional(v.string()),
    uploadedBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_ticket", ["ticketId"])
    .index("by_comment", ["commentId"]),

  ticketSLA: defineTable({
    ticketId: v.id("ticketMaster"),
    policyName: v.string(),
    responseMinutes: v.number(),
    resolutionMinutes: v.number(),
    responseDeadline: v.number(),
    resolutionDeadline: v.number(),
    firstResponseAt: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
    responseSlaMet: v.optional(v.boolean()),
    resolutionSlaMet: v.optional(v.boolean()),
    breachCount: v.optional(v.number()),
    lastBreachAt: v.optional(v.number()),
    escalationLevel: v.optional(v.number()),
    workingHoursOnly: v.optional(v.boolean()),
    excludeWeekends: v.optional(v.boolean()),
    excludeHolidays: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_ticket", ["ticketId"])
    .index("by_breach", ["responseSlaMet", "resolutionSlaMet"]),

  ticketAssignments: defineTable({
    ticketId: v.id("ticketMaster"),
    assignedTo: v.id("users"),
    assignedBy: v.optional(v.id("users")),
    assignmentType: v.string(),          // manual, auto, round_robin, skill_based
    reason: v.optional(v.string()),
    acceptedAt: v.optional(v.number()),
    declinedAt: v.optional(v.number()),
    transferredAt: v.optional(v.number()),
    transferredFrom: v.optional(v.id("users")),
    transferredTo: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_ticket", ["ticketId"])
    .index("by_agent", ["assignedTo", "createdAt"]),

  ticketWatchers: defineTable({
    ticketId: v.id("ticketMaster"),
    userId: v.id("users"),
    userName: v.optional(v.string()),
    notifyVia: v.optional(v.array(v.string())), // email, sms, push, in_app
    addedAt: v.number(),
  })
    .index("by_ticket", ["ticketId"])
    .index("by_user", ["userId"]),

  ticketCategories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(),                   // category, sub_category, department
    parentId: v.optional(v.id("ticketCategories")),
    slaPolicyId: v.optional(v.string()),
    defaultPriority: v.optional(v.string()),
    defaultAssignee: v.optional(v.id("users")),
    defaultTeam: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    organizationId: v.optional(v.id("organizations")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_parent", ["parentId"])
    .index("by_organization", ["organizationId"]),

  ticketTemplates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(),
    category: v.optional(v.string()),
    priority: v.optional(v.string()),
    title: v.string(),                  // Default ticket title
    body: v.optional(v.string()), // Default description body
    customFields: v.optional(v.any()),
    tags: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
    organizationId: v.optional(v.id("organizations")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_organization", ["organizationId"]),

  // ─── Knowledge Base ─────────────────────────────────────────
  knowledgeArticles: defineTable({
    title: v.string(),
    slug: v.optional(v.string()),
    body: v.string(),
    content: v.optional(v.string()),
    bodyHtml: v.optional(v.string()),
    categoryId: v.optional(v.id("knowledgeCategories")),
    tags: v.optional(v.array(v.string())),
    isPublished: v.optional(v.boolean()),
    isInternal: v.optional(v.boolean()),
    views: v.optional(v.number()),
    helpfulCount: v.optional(v.number()),
    notHelpfulCount: v.optional(v.number()),
    relatedTicketTypes: v.optional(v.array(v.string())),
    version: v.optional(v.number()),
    authorId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("organizations")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["categoryId"])
    .index("by_published", ["isPublished", "views"])
    .index("by_tags", ["tags"])
    .index("by_organization", ["organizationId"]),

  knowledgeCategories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    parentId: v.optional(v.id("knowledgeCategories")),
    icon: v.optional(v.string()),
    order: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    organizationId: v.optional(v.id("organizations")),
    articleCount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_parent", ["parentId"])
    .index("by_organization", ["organizationId"]),

  // ─── Automation & Approvals ─────────────────────────────────
  ticketAutomation: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    triggerType: v.string(),            // ticket_created, status_changed, priority_set, etc.
    triggerConfig: v.any(),
    actions: v.array(v.object({
      type: v.string(),
      config: v.any(),
    })),
    conditions: v.optional(v.any()),
    isActive: v.optional(v.boolean()),
    priority: v.optional(v.number()),
    organizationId: v.optional(v.id("organizations")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_trigger", ["triggerType", "isActive"])
    .index("by_organization", ["organizationId"]),

  ticketApprovals: defineTable({
    ticketId: v.id("ticketMaster"),
    approvalId: v.string(),
    status: v.string(),
    requestedBy: v.optional(v.id("users")),
    approvedBy: v.optional(v.id("users")),
    comment: v.optional(v.string()),
    requestedAt: v.optional(v.number()),
    approvedAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
  })
    .index("by_ticket", ["ticketId"])
    .index("by_status", ["status"]),

  ticketRatings: defineTable({
    ticketId: v.id("ticketMaster"),
    rating: v.number(),                 // 1-5
    comment: v.optional(v.string()),
    ratedBy: v.optional(v.id("users")),
    ratedAt: v.optional(v.number()),
    categories: v.optional(v.object({
      responseTime: v.optional(v.number()),
      resolutionQuality: v.optional(v.number()),
      communication: v.optional(v.number()),
      professionalism: v.optional(v.number()),
    })),
  })
    .index("by_ticket", ["ticketId"])
    .index("by_rating", ["rating"]),

  ticketAssets: defineTable({
    name: v.string(),
    assetType: v.string(),              // laptop, desktop, printer, server, router, firewall, biometric, camera, projector, generator, lab_equipment, etc.
    serialNumber: v.optional(v.string()),
    assetTag: v.optional(v.string()),
    model: v.optional(v.string()),
    manufacturer: v.optional(v.string()),
    location: v.optional(v.string()),
    status: v.string(),                 // active, assigned, maintenance, retired, lost
    assignedTo: v.optional(v.string()), // user or entity
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    purchaseDate: v.optional(v.number()),
    warrantyExpiry: v.optional(v.number()),
    lastMaintenanceDate: v.optional(v.number()),
    nextMaintenanceDate: v.optional(v.number()),
    ticketCount: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),
    organizationId: v.optional(v.id("organizations")),
    companyId: v.optional(v.id("companies")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["assetType", "status"])
    .index("by_status", ["status"])
    .index("by_assigned", ["assignedTo"])
    .index("by_branch", ["branchId"])
    .index("by_organization", ["organizationId"]),
};
