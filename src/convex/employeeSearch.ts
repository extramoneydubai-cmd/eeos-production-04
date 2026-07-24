import { v } from "convex/values";
import { query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ─── Global Employee Search ──────────────────────────────────────

export const searchEmployees = query({
  args: {
    query: v.string(),
    status: v.optional(v.string()),
    departmentId: v.optional(v.id("departments")),
    branchId: v.optional(v.id("branches")),
    companyId: v.optional(v.id("companies")),
    designationId: v.optional(v.id("designations")),
    employmentType: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { query: searchQuery, limit = 30, cursor } = args;
    const q = searchQuery.toLowerCase().trim();

    if (!q) return { results: [], nextCursor: null };

    // Get all employees with optional filters
    let employees = await ctx.db.query("employeeMaster").collect();

    if (args.status) employees = employees.filter((e) => e.status === args.status);
    if (args.departmentId) employees = employees.filter((e) => e.departmentId === args.departmentId);
    if (args.branchId) employees = employees.filter((e) => e.branchId === args.branchId);
    if (args.companyId) employees = employees.filter((e) => e.companyId === args.companyId);
    if (args.designationId) employees = employees.filter((e) => e.designationId === args.designationId);
    if (args.employmentType) employees = employees.filter((e) => e.employmentType === args.employmentType);

    // Build scored results
    const scored: { employee: Doc<"employeeMaster">; score: number; matchField: string; personName?: string }[] = [];

    // Pre-fetch person data for all employees
    const personCache = new Map<string, Doc<"personMaster"> | null>();
    for (const emp of employees) {
      if (!personCache.has(emp.personId)) {
        const person = await ctx.db.get(emp.personId);
        personCache.set(emp.personId, person);
      }
    }

    for (const emp of employees) {
      const person = personCache.get(emp.personId);
      const displayName = person?.displayName?.toLowerCase() || "";
      const firstName = person?.firstName?.toLowerCase() || "";
      const lastName = person?.lastName?.toLowerCase() || "";

      // Employee ID exact match
      if (emp.employeeCode.toLowerCase() === q) {
        scored.push({ employee: emp, score: 100, matchField: "employeeCode", personName: person?.displayName });
        continue;
      }
      // Employee ID starts with
      if (emp.employeeCode.toLowerCase().startsWith(q)) {
        scored.push({ employee: emp, score: 85, matchField: "employeeCode", personName: person?.displayName });
        continue;
      }

      // Full name exact match
      if (displayName === q) {
        scored.push({ employee: emp, score: 90, matchField: "name", personName: person?.displayName });
        continue;
      }

      // First name or last name exact match
      if (firstName === q || lastName === q) {
        scored.push({ employee: emp, score: 80, matchField: "name", personName: person?.displayName });
        continue;
      }

      // Name starts with
      if (displayName.startsWith(q)) {
        scored.push({ employee: emp, score: 70, matchField: "name", personName: person?.displayName });
        continue;
      }

      // First name or last name starts with
      if (firstName.startsWith(q) || lastName.startsWith(q)) {
        scored.push({ employee: emp, score: 60, matchField: "name", personName: person?.displayName });
        continue;
      }

      // Name contains
      if (displayName.includes(q)) {
        scored.push({ employee: emp, score: 40, matchField: "name", personName: person?.displayName });
        continue;
      }

      // Employee ID contains
      if (emp.employeeCode.toLowerCase().includes(q)) {
        scored.push({ employee: emp, score: 30, matchField: "employeeCode", personName: person?.displayName });
        continue;
      }
    }

    // Search contact methods for phone/email matches
    const contactResults = await ctx.db
      .query("contactMethods")
      .withIndex("value", (qIdx) => qIdx.eq("value", searchQuery))
      .collect();

    for (const contact of contactResults) {
      // Check if this person is already in results
      const alreadyScored = scored.some((s) => s.employee.personId === contact.personId);
      if (!alreadyScored) {
        // Find employee by personId
        const emp = employees.find((e) => e.personId === contact.personId);
        if (emp) {
          const person = personCache.get(emp.personId);
          scored.push({
            employee: emp,
            score: 92,
            matchField: contact.type === "Mobile" ? "phone" : "email",
            personName: person?.displayName,
          });
        }
      }
    }

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Apply cursor pagination
    let startIndex = 0;
    if (cursor) {
      try {
        startIndex = parseInt(cursor, 10);
        if (isNaN(startIndex)) startIndex = 0;
      } catch {
        startIndex = 0;
      }
    }

    const page = scored.slice(startIndex, startIndex + limit);
    const nextCursor = startIndex + limit < scored.length ? String(startIndex + limit) : null;

    // Enrich with org details
    const enriched = await Promise.all(
      page.map(async (item) => {
        const dept = item.employee.departmentId ? await ctx.db.get(item.employee.departmentId) : null;
        const desig = item.employee.designationId ? await ctx.db.get(item.employee.designationId) : null;
        const branch = item.employee.branchId ? await ctx.db.get(item.employee.branchId) : null;
        const company = item.employee.companyId ? await ctx.db.get(item.employee.companyId) : null;

        // Get contact info
        const contactMethods = await ctx.db
          .query("contactMethods")
          .withIndex("personId", (q) => q.eq("personId", item.employee.personId))
          .collect();

        const mobile = contactMethods.find((c) => c.type === "Mobile")?.value;
        const email = contactMethods.find((c) => c.type === "Email")?.value;

        return {
          employeeId: item.employee._id,
          employeeCode: item.employee.employeeCode,
          personName: item.personName || "Unknown",
          status: item.employee.status,
          employmentType: item.employee.employmentType,
          primaryRole: item.employee.primaryRole,
          departmentName: dept?.name || null,
          designationName: desig?.name || null,
          branchName: branch?.name || null,
          companyName: company?.name || null,
          mobile,
          email,
          score: item.score,
          matchField: item.matchField,
        };
      })
    );

    return {
      results: enriched,
      nextCursor,
    };
  },
});

// ─── Quick Search (Autocomplete) ─────────────────────────────────

export const quickEmployeeSearch = query({
  args: {
    q: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { q, limit = 10 } = args;
    if (!q.trim()) return [];

    const employees = await ctx.db.query("employeeMaster").collect();
    const query = q.toLowerCase().trim();

    const results: { id: Id<"employeeMaster">; label: string; subtitle: string; personId: Id<"personMaster"> }[] = [];

    for (const emp of employees) {
      const person = await ctx.db.get(emp.personId);
      const displayName = person?.displayName?.toLowerCase() || "";
      const name = person?.displayName || `${person?.firstName || ""} ${person?.lastName || ""}`.trim() || "Unknown";

      if (
        emp.employeeCode.toLowerCase().includes(query) ||
        displayName.includes(query) ||
        (person?.firstName?.toLowerCase() || "").startsWith(query) ||
        (person?.lastName?.toLowerCase() || "").startsWith(query)
      ) {
        results.push({
          id: emp._id,
          label: `${name} (${emp.employeeCode})`,
          subtitle: `Status: ${emp.status} | Role: ${emp.primaryRole}`,
          personId: emp.personId,
        });

        if (results.length >= limit) break;
      }
    }

    return results;
  },
});

// ─── Find by Employee Code ───────────────────────────────────────

export const findByEmployeeCode = query({
  args: { employeeCode: v.string() },
  handler: async (ctx, args) => {
    const employees = await ctx.db.query("employeeMaster").collect();
    const emp = employees.find((e) => e.employeeCode === args.employeeCode);
    if (!emp) return null;

    const person = await ctx.db.get(emp.personId);
    return {
      ...emp,
      personName: person?.displayName || `${person?.firstName || ""} ${person?.lastName || ""}`.trim(),
    };
  },
});

// ─── Get Employee Summary ────────────────────────────────────────

export const getEmployeeSummary = query({
  args: { employeeId: v.id("employeeMaster") },
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) return null;

    const person = await ctx.db.get(employee.personId);
    const contactMethods = await ctx.db
      .query("contactMethods")
      .withIndex("personId", (q) => q.eq("personId", employee.personId))
      .collect();
    const history = await ctx.db
      .query("employeeHistory")
      .withIndex("employeeId_changedAt", (q) => q.eq("employeeId", args.employeeId))
      .order("desc")
      .take(10);
    const documents = await ctx.db
      .query("employeeDocuments")
      .withIndex("employeeId", (q) => q.eq("employeeId", args.employeeId))
      .collect();
    const skills = await ctx.db
      .query("employeeSkills")
      .withIndex("employeeId", (q) => q.eq("employeeId", args.employeeId))
      .collect();
    const qualifications = await ctx.db
      .query("employeeQualifications")
      .withIndex("employeeId", (q) => q.eq("employeeId", args.employeeId))
      .collect();

    const department = employee.departmentId ? await ctx.db.get(employee.departmentId) : null;
    const designation = employee.designationId ? await ctx.db.get(employee.designationId) : null;

    return {
      employee: {
        id: employee._id,
        employeeCode: employee.employeeCode,
        status: employee.status,
        employmentType: employee.employmentType,
        primaryRole: employee.primaryRole,
        joiningDate: employee.joiningDate,
        confirmationDate: employee.confirmationDate,
      },
      person: {
        id: employee.personId,
        displayName: person?.displayName,
        firstName: person?.firstName,
        lastName: person?.lastName,
        photoUrl: person?.profilePhoto,
      },
      contact: {
        mobile: contactMethods.find((c) => c.type === "Mobile")?.value,
        email: contactMethods.find((c) => c.type === "Email")?.value,
        whatsapp: contactMethods.find((c) => c.type === "WhatsApp")?.value,
      },
      organization: {
        department: department?.name || null,
        designation: designation?.name || null,
      },
      stats: {
        documents: documents.length,
        skills: skills.length,
        qualifications: qualifications.length,
        recentEvents: history.length,
      },
      recentHistory: history,
    };
  },
});
