/**
 * EEOS Search Platform — Reusable Entity Search
 *
 * Provides standardized search for every major entity type:
 *  - People (persons, students, employees)
 *  - Leads
 *  - Documents
 *  - Tasks
 *
 * Every search function supports:
 *  - Text search across configured fields
 *  - Tags, status, date range, owner filters
 *  - Company/branch/department scope
 *  - Pagination + sorting
 *  - Visibility integration
 *
 * Business modules call these functions instead of implementing their own search.
 */

import { v } from "convex/values";
import { query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import type { PaginatedResponse } from "./queryHelpers";
import { resolveSecurityContext, type SecurityContext } from "./queryPlatform";
import { paginatedQuery, applyStandardFilters, batchGet } from "./queryHelpers";

// ═══════════════════════════════════════════════════════════════════
//  SEARCH ENTITY (GENERIC)
// ═══════════════════════════════════════════════════════════════════

/**
 * Generic entity search.
 */
export const searchEntity = query({
  args: {
    token: v.string(),
    table: v.string(),
    searchFields: v.array(v.string()),
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    organizationId: v.optional(v.id("organizations")),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    ownerId: v.optional(v.id("users")),
    tags: v.optional(v.array(v.string())),
    paginationOpts: paginationOptsValidator,
    sortField: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args): Promise<PaginatedResponse<any>> => {
    const sec = await resolveSecurityContext(ctx, args.token);
    if (!sec.isAuthenticated) {
      return { items: [], nextCursor: null, hasMore: false, totalCount: 0 };
    }

    const result = await paginatedQuery<any>(ctx, args.table, args, (q) =>
      q.withIndex("by_createdAt").order("desc"),
    );

    let filtered = result.items;

    // Apply scope
    if (!sec.isAdmin) {
      if (sec.user) {
        filtered = filtered.filter(
          (item: any) =>
            item.ownerId === sec.user!._id ||
            item.createdBy === sec.user!._id,
        );
      }
    }

    // Apply explicit filters
    if (args.organizationId)
      filtered = filtered.filter((i: any) => i.organizationId === args.organizationId);
    if (args.companyId)
      filtered = filtered.filter((i: any) => i.companyId === args.companyId);
    if (args.branchId)
      filtered = filtered.filter((i: any) => i.branchId === args.branchId);
    if (args.departmentId)
      filtered = filtered.filter((i: any) => i.departmentId === args.departmentId);
    if (args.ownerId)
      filtered = filtered.filter((i: any) => i.ownerId === args.ownerId);

    // Apply standard filters
    filtered = applyStandardFilters(filtered, args, args.searchFields as any);

    // Tag filtering
    if (args.tags && args.tags.length > 0) {
      filtered = filtered.filter((item: any) => {
        if (!item.tags || item.tags.length === 0) return false;
        return args.tags!.some((t) => item.tags.includes(t));
      });
    }

    return {
      items: filtered,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════
//  PEOPLE SEARCH
// ═══════════════════════════════════════════════════════════════════

export const searchPeople = query({
  args: {
    token: v.string(),
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    profileType: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args): Promise<PaginatedResponse<any>> => {
    const sec = await resolveSecurityContext(ctx, args.token);
    if (!sec.isAuthenticated) {
      return { items: [], nextCursor: null, hasMore: false, totalCount: 0 };
    }

    // Search personMaster
    const result = await paginatedQuery<any>(
      ctx,
      "personMaster",
      args,
      (q) => q.withIndex("by_createdAt").order("desc"),
    );

    let filtered = applyStandardFilters(result.items, args, [
      "firstName",
      "lastName",
      "displayName",
    ]);

    if (args.profileType) {
      // Fetch profiles to filter by type
      const personIds = filtered.map((p: any) => p._id);
      const allProfiles = await ctx.db.query("personProfiles").collect();
      const matchingPersonIds = new Set(
        allProfiles
          .filter(
            (pf: any) =>
              pf.profileType === args.profileType && pf.active !== false,
          )
          .map((pf: any) => pf.personId),
      );
      filtered = filtered.filter((p: any) => matchingPersonIds.has(p._id));
    }

    // Enrich with profile info
    const enriched = await enrichPeople(ctx, filtered);

    return {
      items: enriched,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  },
});

async function enrichPeople(
  ctx: any,
  people: any[],
): Promise<any[]> {
  if (people.length === 0) return [];

  const personIds = people.map((p: any) => p._id);
  const profiles = await ctx.db.query("personProfiles").collect();
  const contacts = await ctx.db.query("contactMethods").collect();

  return people.map((person: any) => {
    const personProfiles = profiles.filter(
      (pf: any) => pf.personId === person._id,
    );
    const personContacts = contacts.filter(
      (c: any) => c.personId === person._id,
    );
    return {
      ...person,
      profiles: personProfiles,
      contacts: personContacts,
    };
  });
}

// ═══════════════════════════════════════════════════════════════════
//  STUDENT SEARCH
// ═══════════════════════════════════════════════════════════════════

export const searchStudents = query({
  args: {
    token: v.string(),
    search: v.optional(v.string()),
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    courseId: v.optional(v.id("courses")),
    batchId: v.optional(v.id("batches")),
    status: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    enrollmentDateFrom: v.optional(v.number()),
    enrollmentDateTo: v.optional(v.number()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args): Promise<PaginatedResponse<any>> => {
    const sec = await resolveSecurityContext(ctx, args.token);
    if (!sec.isAuthenticated) {
      return { items: [], nextCursor: null, hasMore: false, totalCount: 0 };
    }

    // Search studentMaster
    const result = await paginatedQuery<any>(
      ctx,
      "studentMaster",
      args,
      (q) => q.withIndex("by_createdAt").order("desc"),
    );

    let filtered = applyStandardFilters(result.items, args, [
      "firstName",
      "lastName",
      "studentCode",
      "phone",
      "email",
    ]);

    if (args.courseId) {
      const enrollments = await ctx.db.query("studentEnrollments").collect();
      const courseStudentIds = new Set(
        enrollments
          .filter((e: any) => e.courseId === args.courseId)
          .map((e: any) => e.studentId),
      );
      filtered = filtered.filter((s: any) => courseStudentIds.has(s._id));
    }
    if (args.branchId)
      filtered = filtered.filter((s: any) => s.branchId === args.branchId);
    if (args.companyId)
      filtered = filtered.filter((s: any) => s.companyId === args.companyId);
    if (args.batchId)
      filtered = filtered.filter((s: any) => s.batchId === args.batchId);
    if (args.academicYear)
      filtered = filtered.filter(
        (s: any) => s.academicYear === args.academicYear,
      );
    if (args.enrollmentDateFrom)
      filtered = filtered.filter(
        (s: any) => s.enrollmentDate >= args.enrollmentDateFrom,
      );
    if (args.enrollmentDateTo)
      filtered = filtered.filter(
        (s: any) => s.enrollmentDate <= args.enrollmentDateTo,
      );

    // Enrich with person data
    const personIds = [...new Set(filtered.map((s: any) => s.personId).filter(Boolean))];
    const persons = await batchGet<any>(ctx, personIds);
    const personMap = new Map(
      persons.filter(Boolean).map((p: any) => [p._id, p]),
    );

    const enriched = filtered.map((s: any) => ({
      ...s,
      person: s.personId ? personMap.get(s.personId) : null,
    }));

    return {
      items: enriched,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════
//  EMPLOYEE SEARCH
// ═══════════════════════════════════════════════════════════════════

export const searchEmployees = query({
  args: {
    token: v.string(),
    search: v.optional(v.string()),
    departmentId: v.optional(v.id("departments")),
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    designationId: v.optional(v.id("designations")),
    employmentType: v.optional(v.string()),
    status: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args): Promise<PaginatedResponse<any>> => {
    const sec = await resolveSecurityContext(ctx, args.token);
    if (!sec.isAuthenticated) {
      return { items: [], nextCursor: null, hasMore: false, totalCount: 0 };
    }

    const result = await paginatedQuery<any>(
      ctx,
      "employeeMaster",
      args,
      (q) => q.withIndex("by_createdAt").order("desc"),
    );

    let filtered = applyStandardFilters(result.items, args, [
      "employeeCode",
    ]);

    if (args.departmentId)
      filtered = filtered.filter(
        (e: any) => e.departmentId === args.departmentId,
      );
    if (args.branchId)
      filtered = filtered.filter((e: any) => e.branchId === args.branchId);
    if (args.companyId)
      filtered = filtered.filter((e: any) => e.companyId === args.companyId);
    if (args.designationId)
      filtered = filtered.filter(
        (e: any) => e.designationId === args.designationId,
      );
    if (args.employmentType)
      filtered = filtered.filter(
        (e: any) => e.employmentType === args.employmentType,
      );

    // Enrich with person data
    const personIds = [
      ...new Set(filtered.map((e: any) => e.personId).filter(Boolean)),
    ];
    const persons = await batchGet<any>(ctx, personIds);
    const personMap = new Map(
      persons.filter(Boolean).map((p: any) => [p._id, p]),
    );

    const enriched = filtered.map((e: any) => ({
      ...e,
      person: e.personId ? personMap.get(e.personId) : null,
    }));

    return {
      items: enriched,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════
//  LEAD SEARCH
// ═══════════════════════════════════════════════════════════════════

export const searchLeads = query({
  args: {
    token: v.string(),
    search: v.optional(v.string()),
    stage: v.optional(v.string()),
    priority: v.optional(v.string()),
    source: v.optional(v.string()),
    ownerId: v.optional(v.id("users")),
    branchId: v.optional(v.id("branches")),
    verticalId: v.optional(v.id("verticals")),
    status: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args): Promise<PaginatedResponse<any>> => {
    const sec = await resolveSecurityContext(ctx, args.token);
    if (!sec.isAuthenticated) {
      return { items: [], nextCursor: null, hasMore: false, totalCount: 0 };
    }

    const result = await paginatedQuery<any>(
      ctx,
      "leadMaster",
      args,
      (q) => q.withIndex("by_createdAt").order("desc"),
    );

    let filtered = applyStandardFilters(result.items, args, [
      "firstName",
      "lastName",
      "phone",
      "email",
      "location",
    ]);

    // Lead-specific filters
    if (args.stage)
      filtered = filtered.filter((l: any) => l.stage === args.stage);
    if (args.priority)
      filtered = filtered.filter((l: any) => l.priority === args.priority);
    if (args.source)
      filtered = filtered.filter((l: any) => l.source === args.source);
    if (args.ownerId)
      filtered = filtered.filter((l: any) => l.ownerId === args.ownerId);
    if (args.branchId)
      filtered = filtered.filter(
        (l: any) => l.branchInterestId === args.branchId,
      );
    if (args.verticalId)
      filtered = filtered.filter((l: any) => l.verticalId === args.verticalId);

    // Filter archived
    filtered = filtered.filter((l: any) => l.status !== "archived");

    // Enrich with owner names
    const ownerIds = [
      ...new Set(filtered.map((l: any) => l.ownerId).filter(Boolean)),
    ];
    const owners = await batchGet<any>(ctx, ownerIds);
    const ownerMap = new Map(
      owners.filter(Boolean).map((u: any) => [u._id, u.name || u.username]),
    );

    const enriched = filtered.map((l: any) => ({
      ...l,
      ownerName: l.ownerId ? ownerMap.get(l.ownerId) || "Unassigned" : "Unassigned",
    }));

    return {
      items: enriched,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════
//  DOCUMENT SEARCH
// ═══════════════════════════════════════════════════════════════════

export const searchDocuments = query({
  args: {
    token: v.string(),
    search: v.optional(v.string()),
    fileType: v.optional(v.string()),
    referenceType: v.optional(v.string()),
    referenceId: v.optional(v.string()),
    tagId: v.optional(v.id("documentTags")),
    folderId: v.optional(v.id("documentFolders")),
    includeArchived: v.optional(v.boolean()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args): Promise<PaginatedResponse<any>> => {
    const sec = await resolveSecurityContext(ctx, args.token);
    if (!sec.isAuthenticated) {
      return { items: [], nextCursor: null, hasMore: false, totalCount: 0 };
    }

    const result = await paginatedQuery<any>(
      ctx,
      "documents",
      args,
      (q) => q.withIndex("by_createdAt").order("desc"),
    );

    let filtered = applyStandardFilters(result.items, args, [
      "name",
      "description",
    ]);

    if (!args.includeArchived)
      filtered = filtered.filter((d: any) => !d.isArchived);
    if (args.fileType)
      filtered = filtered.filter((d: any) => d.fileType === args.fileType);
    if (args.referenceType)
      filtered = filtered.filter(
        (d: any) => d.referenceType === args.referenceType,
      );
    if (args.referenceId)
      filtered = filtered.filter(
        (d: any) => d.referenceId === args.referenceId,
      );
    if (args.folderId)
      filtered = filtered.filter((d: any) => d.folderId === args.folderId);
    if (args.tagId)
      filtered = filtered.filter(
        (d: any) => d.tags && d.tags.includes(args.tagId),
      );

    return {
      items: filtered,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════
//  AUTOCOMPLETE SEARCH (lightweight, for dropdowns/typeahead)
// ═══════════════════════════════════════════════════════════════════

export const autocompletePeople = query({
  args: {
    token: v.string(),
    search: v.string(),
    limit: v.optional(v.number()),
    profileType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sec = await resolveSecurityContext(ctx, args.token);
    if (!sec.isAuthenticated) return [];

    const all = await ctx.db.query("personMaster").collect();
    const q = args.search.toLowerCase();
    const limit = args.limit || 20;

    let filtered = all.filter(
      (p: any) =>
        (p.firstName && p.firstName.toLowerCase().includes(q)) ||
        (p.lastName && p.lastName.toLowerCase().includes(q)) ||
        (p.displayName && p.displayName.toLowerCase().includes(q)),
    );

    if (args.profileType) {
      const profiles = await ctx.db.query("personProfiles").collect();
      const matchingIds = new Set(
        profiles
          .filter((pf: any) => pf.profileType === args.profileType && pf.active !== false)
          .map((pf: any) => pf.personId),
      );
      filtered = filtered.filter((p: any) => matchingIds.has(p._id));
    }

    return filtered.slice(0, limit).map((p: any) => ({
      _id: p._id,
      displayName: p.displayName || `${p.firstName} ${p.lastName}`,
      type: "person",
    }));
  },
});

export const autocompleteLeads = query({
  args: {
    token: v.string(),
    search: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sec = await resolveSecurityContext(ctx, args.token);
    if (!sec.isAuthenticated) return [];

    const all = await ctx.db.query("leadMaster").collect();
    const q = args.search.toLowerCase();
    const limit = args.limit || 20;

    return all
      .filter(
        (l: any) =>
          l.status !== "archived" &&
          ((l.firstName && l.firstName.toLowerCase().includes(q)) ||
            (l.lastName && l.lastName.toLowerCase().includes(q)) ||
            (l.phone && l.phone.includes(q))),
      )
      .slice(0, limit)
      .map((l: any) => ({
        _id: l._id,
        displayName: `${l.firstName} ${l.lastName}`,
        phone: l.phone,
        type: "lead",
      }));
  },
});
