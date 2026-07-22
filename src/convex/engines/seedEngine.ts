// @ts-nocheck — This file is type-checked by `npx convex dev`, not by the frontend `tsc`.

/**
 * EEOS Seed Engine (P0)
 *
 * Demo environment seeding for EEOS Beta.
 * Creates a complete working organization with predefined users, data, and activities.
 *
 * Architecture:
 * - All seed data is generated through existing P0 engines (Activity, Notification, etc.)
 * - Modules call seed<Module>() functions — no data is hardcoded in components
 * - Production mode simply disables demo mode — no redesign needed
 * - Uses `demo_data` table to track seelded state for idempotent reset
 *
 * DOC-22 reference: Seed Engine
 * DOC-23 reference: Engine Standards, Naming Standards
 */

import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query, action } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";

// ─── Demo Seed Data ────────────────────────────────────────────

const DEMO_ORGANIZATION = {
  name: "Veda EdTech Group",
  code: "VEDA",
  isActive: true,
  email: "info@vedaedtech.com",
  phone: "+971-4-555-0100",
  address: "Dubai Knowledge Park, Dubai, UAE",
};

const DEMO_COMPANIES = [
  { name: "Veda EdTech UAE", code: "VEDA-UAE", isActive: true },
];

const DEMO_BRANCHES = [
  { name: "Dubai HQ", code: "DXB-HQ", isActive: true },
  { name: "Sharjah", code: "SHJ", isActive: true },
  { name: "Abu Dhabi", code: "AUH", isActive: true },
];

const DEMO_DEPARTMENTS = [
  { branchIdx: 0, name: "CEO Office", code: "CEO-OFF", isActive: true },
  { branchIdx: 0, name: "Technology", code: "TECH", isActive: true },
  { branchIdx: 0, name: "Finance", code: "FIN", isActive: true },
  { branchIdx: 0, name: "Marketing", code: "MKT", isActive: true },
  { branchIdx: 0, name: "HR", code: "HR", isActive: true },
  { branchIdx: 0, name: "Academics", code: "ACAD", isActive: true },
  { branchIdx: 0, name: "Sales", code: "SALES", isActive: true },
  { branchIdx: 0, name: "Administration", code: "ADMIN", isActive: true },
  { branchIdx: 0, name: "Operations", code: "OPS", isActive: true },
  { branchIdx: 0, name: "Content", code: "CONT", isActive: true },
  { branchIdx: 0, name: "Customer Success", code: "CS", isActive: true },
];

const DEMO_TEAMS = [
  { deptIdx: 1, name: "Backend", code: "BE", isActive: true },
  { deptIdx: 1, name: "Frontend", code: "FE", isActive: true },
  { deptIdx: 2, name: "Accounts", code: "ACCT", isActive: true },
  { deptIdx: 3, name: "Admissions", code: "ADM", isActive: true },
  { deptIdx: 5, name: "Support", code: "SUPP", isActive: true },
  { deptIdx: 5, name: "Academic Counselors", code: "COUNSEL", isActive: true },
  { deptIdx: 5, name: "Faculty", code: "FAC", isActive: true },
  { deptIdx: 4, name: "Marketing Team", code: "MKT-TEAM", isActive: true },
  { deptIdx: 8, name: "Operations", code: "OPS-TEAM", isActive: true },
  { deptIdx: 3, name: "HR Team", code: "HR-TEAM", isActive: true },
];

const DEMO_USERS = [
  // Executive Team
  {
    name: "Dr. Arjun Mehta", email: "demo.ceo@vedaedtech.com",
    designation: "Chief Executive Officer", demoRole: "ceo", deptIdx: 0, branchIdx: 0, phone: "+971-50-111-0001",
  },
  {
    name: "Priya Sharma", email: "demo.coo@vedaedtech.com",
    designation: "Chief Operating Officer", demoRole: "coo", deptIdx: 8, branchIdx: 0, phone: "+971-50-111-0002",
  },
  {
    name: "Vikram Patel", email: "demo.cto@vedaedtech.com",
    designation: "Chief Technology Officer", demoRole: "cto", deptIdx: 1, branchIdx: 0, phone: "+971-50-111-0003",
  },
  {
    name: "Fatima Al-Hashimi", email: "demo.cfo@vedaedtech.com",
    designation: "Chief Financial Officer", demoRole: "cfo", deptIdx: 2, branchIdx: 0, phone: "+971-50-111-0004",
  },
  {
    name: "Omar Khan", email: "demo.cmo@vedaedtech.com",
    designation: "Chief Marketing Officer", demoRole: "cmo", deptIdx: 3, branchIdx: 0, phone: "+971-50-111-0005",
  },
  {
    name: "Dr. Leela Nair", email: "demo.cko@vedaedtech.com",
    designation: "Chief Knowledge Officer", demoRole: "cko", deptIdx: 5, branchIdx: 0, phone: "+971-50-111-0006",
  },
  {
    name: "Sara Ahmed", email: "demo.chro@vedaedtech.com",
    designation: "Chief Human Resources Officer", demoRole: "chro", deptIdx: 4, branchIdx: 0, phone: "+971-50-111-0007",
  },

  // Management
  {
    name: "Rashid Al Maktoum", email: "demo.admin@vedaedtech.com",
    designation: "System Administrator", demoRole: "admin", deptIdx: 1, branchIdx: 0, phone: "+971-50-111-0008",
  },
  {
    name: "Aisha Rahman", email: "demo.branch-director@vedaedtech.com",
    designation: "Branch Director — Abu Dhabi", demoRole: "branch_director", deptIdx: 7, branchIdx: 2, phone: "+971-50-111-0009",
  },
  {
    name: "Dr. Ravi Menon", email: "demo.academic-head@vedaedtech.com",
    designation: "Academic Head", demoRole: "academic_head", deptIdx: 5, branchIdx: 0, phone: "+971-50-111-0010",
  },
  {
    name: "Nadia Khalil", email: "demo.sales-manager@vedaedtech.com",
    designation: "Sales Manager", demoRole: "sales_manager", deptIdx: 6, branchIdx: 0, phone: "+971-50-111-0011",
  },

  // Operations
  {
    name: "Zara Yusuf", email: "demo.counselor@vedaedtech.com",
    designation: "Senior Academic Counselor", demoRole: "counselor", deptIdx: 5, branchIdx: 0, phone: "+971-50-111-0012",
  },
  {
    name: "Prof. David Chen", email: "demo.faculty@vedaedtech.com",
    designation: "Associate Professor — Computer Science", demoRole: "faculty", deptIdx: 5, branchIdx: 0, phone: "+971-50-111-0013",
  },
  {
    name: "Maya Singh", email: "demo.accountant@vedaedtech.com",
    designation: "Senior Accountant", demoRole: "accountant", deptIdx: 2, branchIdx: 0, phone: "+971-50-111-0014",
  },

  // Users
  {
    name: "Liam Fernandez", email: "demo.parent@vedaedtech.com",
    designation: "Parent", demoRole: "parent", deptIdx: 7, branchIdx: 0, phone: "+971-50-111-0015",
  },
  {
    name: "Aanya Kapoor", email: "demo.student@vedaedtech.com",
    designation: "Student — B.Tech CSE Year 2", demoRole: "student", deptIdx: 5, branchIdx: 0, phone: "+971-50-111-0016",
  },
];

// ─── Helper: seeded flag ───────────────────────────────────────

async function getSeedFlag(ctx, key: string): Promise<boolean> {
  const entry = await ctx.db.query("demo_data").withIndex("by_key", (q) => q.eq("key", key)).first();
  return !!entry;
}

async function setSeedFlag(ctx, key: string, value: any = true): Promise<void> {
  const existing = await ctx.db.query("demo_data").withIndex("by_key", (q) => q.eq("key", key)).first();
  if (existing) {
    await ctx.db.patch(existing._id, { value, seededAt: Date.now() });
  } else {
    await ctx.db.insert("demo_data", { key, value, seededAt: Date.now() });
  }
}

// ─── Demo user helpers ─────────────────────────────────────────

// Track created users by email for cross-referencing
const userCache: Record<string, Id<"users">> = {};

function getDaysAgo(days: number): number {
  return Date.now() - days * 86400000;
}

function getHoursAgo(hours: number): number {
  return Date.now() - hours * 3600000;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Mutations ─────────────────────────────────────────────────

/** Seed the entire demo environment. Called once. */
export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    const seeded = await getSeedFlag(ctx, "demo_seeded");
    if (seeded) {
      return { status: "already_seeded", message: "Demo environment already seeded. Call resetDemo() to re-seed." };
    }

    // 1. Organization hierarchy
    const orgId = await seedOrganization(ctx);

    // 2. Companies
    const companyIds = await seedCompanies(ctx, orgId);

    // 3. Branches
    const branchIds = await seedBranches(ctx, orgId);

    // 4. Departments
    const deptIds = await seedDepartments(ctx, orgId, branchIds);

    // 5. Teams
    const teamIds = await seedTeams(ctx, orgId, deptIds);

    // 6. Users
    const userIds = await seedUsers(ctx, orgId, branchIds, deptIds);

    // 7. Sequence configs
    await seedSequences(ctx, userIds);

    // 8. Leads (25)
    await seedLeads(ctx, orgId, userIds);

    // 9. Students (15)
    await seedStudents(ctx, orgId, userIds);

    // 10. Admissions (10)
    await seedAdmissions(ctx, orgId, userIds);

    // 11. Tasks (20)
    await seedTasks(ctx, orgId, userIds);

    // 12. Seed demo login activity
    // 19. Seed Access Control (roles, permissions, assignments)
    await seedAccessControl(ctx, userIds);

    await seedDemoLogin(ctx, userIds, deptIds);

    await setSeedFlag(ctx, "demo_seeded", {
      organizationId: orgId,
      users: Object.keys(userCache),
      seededAt: Date.now(),
    });

    return {
      status: "seeded",
      organizationId: orgId,
      users: Object.keys(userCache),
    };
  },
});

/** Seed without auth check for demo login flow */
export const seedWithoutAuth = mutation({
  args: {},
  handler: async (ctx) => {
    const seeded = await getSeedFlag(ctx, "demo_seeded");
    if (seeded) {
      // Return existing data
      const userIds = DEMO_USERS.map((u) => userCache[u.email]).filter(Boolean);
      // Load from database
      const dataRecord = await ctx.db.query("demo_data").withIndex("by_key", (q) => q.eq("key", "demo_seeded")).first();
      const orgId = dataRecord?.value?.organizationId;
      return { status: "already_seeded", organizationId: orgId };
    }

    // 1. Organization hierarchy
    const orgId = await seedOrganization(ctx);

    // 2. Companies
    const companyIds = await seedCompanies(ctx, orgId);

    // 3. Branches
    const branchIds = await seedBranches(ctx, orgId);

    // 4. Departments
    const deptIds = await seedDepartments(ctx, orgId, branchIds);

    // 5. Teams
    const teamIds = await seedTeams(ctx, orgId, deptIds);

    // 6. Users
    const userIds = await seedUsers(ctx, orgId, branchIds, deptIds);

    // 7. Sequence configs
    await seedSequences(ctx, userIds);

    // 8. Leads (25)
    await seedLeads(ctx, orgId, userIds);

    // 9. Students (15)
    await seedStudents(ctx, orgId, userIds);

    // 10. Admissions (10)
    await seedAdmissions(ctx, orgId, userIds);

    // 11. Tasks (20)
    await seedTasks(ctx, orgId, userIds);

    // 12. Notifications (15)
    await seedNotifications(ctx, orgId, userIds);

    // 13. Activities (50)
    await seedActivities(ctx, orgId, userIds);

    // 14. Attachments (10)
    await seedAttachments(ctx, orgId, userIds);

    // 15. Comments (25)
    await seedComments(ctx, orgId, userIds);

    // 16. Timeline events (100)
    // Timeline is a consumer engine — it queries other engines
    // We'll create activities that the timeline picks up

    // 17. Audit records (50)
    await seedAuditRecords(ctx, orgId, userIds);

    // 18. Demo login activity
    await seedDemoLogin(ctx, userIds, deptIds);

    await setSeedFlag(ctx, "demo_seeded", {
      organizationId: orgId,
      seededAt: Date.now(),
    });

    return {
      status: "seeded",
      organizationId: orgId,
    };
  },
});

/** Reset demo data and re-seed */
export const resetDemo = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear all demo data
    // Delete all demo_data flags
    const allFlags = await ctx.db.query("demo_data").collect();
    for (const flag of allFlags) {
      await ctx.db.delete(flag._id);
    }

    // We don't delete users/data here — re-seeding will overwrite
    // For a clean reset we mark the flag as not seeded
    return { status: "reset" };
  },
});

/** Get demo organization info */
export const getDemoInfo = query({
  args: {},
  handler: async (ctx) => {
    const dataRecord = await ctx.db.query("demo_data").withIndex("by_key", (q) => q.eq("key", "demo_seeded")).first();
    if (!dataRecord) return { seeded: false };

    const orgId = dataRecord.value?.organizationId as Id<"organizations">;
    const org = orgId ? await ctx.db.get(orgId) : null;

    // Get demo users
    const users = await ctx.db.query("users").collect();
    const demoUsers = users.filter((u) => u.email && u.email.startsWith("demo."));

    return {
      seeded: true,
      organization: org ? { name: org.name, id: org._id } : null,
      demoUsers: demoUsers.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: (u as any).demoRole || "user",
      })),
    };
  },
});

// ─── Individual Seed Functions ─────────────────────────────────

async function seedOrganization(ctx): Promise<Id<"organizations">> {
  const orgId = await ctx.db.insert("organizations", DEMO_ORGANIZATION);
  userCache["_org"] = orgId;
  return orgId;
}

async function seedCompanies(ctx, orgId: Id<"organizations">): Promise<Id<"organizations">[]> {
  const ids: Id<"organizations">[] = [];
  for (const company of DEMO_COMPANIES) {
    const id = await ctx.db.insert("organizations", {
      ...company,
      email: "info@" + company.code.toLowerCase() + ".com",
      phone: "+971-4-555-0" + Math.floor(100 + Math.random() * 900),
      address: "UAE",
    });
    ids.push(id);
  }
  return ids;
}

async function seedBranches(ctx, orgId: Id<"organizations">): Promise<Id<"branches">[]> {
  const ids: Id<"branches">[] = [];
  for (const branch of DEMO_BRANCHES) {
    const id = await ctx.db.insert("branches", {
      organizationId: orgId,
      name: branch.name,
      code: branch.code,
      isActive: branch.isActive,
      email: "branch." + branch.code.toLowerCase() + "@vedaedtech.com",
      phone: "+971-50-555-" + Math.floor(1000 + Math.random() * 9000),
      address: branch.name + ", UAE",
    });
    ids.push(id);
  }
  return ids;
}

async function seedDepartments(ctx, orgId: Id<"organizations">, branchIds: Id<"branches">[]): Promise<Id<"departments">[]> {
  const ids: Id<"departments">[] = [];
  for (const dept of DEMO_DEPARTMENTS) {
    const id = await ctx.db.insert("departments", {
      branchId: branchIds[dept.branchIdx] || branchIds[0],
      name: dept.name,
      code: dept.code,
      isActive: dept.isActive,
      description: dept.name + " Department",
    });
    ids.push(id);
  }
  return ids;
}

async function seedTeams(ctx, orgId: Id<"organizations">, deptIds: Id<"departments">[]): Promise<Id<"teams">[]> {
  const ids: Id<"teams">[] = [];
  for (const team of DEMO_TEAMS) {
    const id = await ctx.db.insert("teams", {
      departmentId: deptIds[team.deptIdx] || deptIds[0],
      name: team.name,
      code: team.code,
      isActive: team.isActive,
      description: team.name + " Team",
    });
    ids.push(id);
  }
  return ids;
}

async function seedUsers(ctx, orgId: Id<"organizations">, branchIds: Id<"branches">[], deptIds: Id<"departments">[]): Promise<Record<string, Id<"users">>> {
  const userIds: Record<string, Id<"users">> = {};

  for (const user of DEMO_USERS) {
    const image = null; // Placeholder — use initials avatars
    const id = await ctx.db.insert("users", {
      name: user.name,
      email: user.email,
      image,
      role: "user",
      // Extra fields stored via metadata
    } as any);

    // Also store demo-specific fields in a parallel record
    // Use the user record itself with a metadata approach
    await ctx.db.patch(id, {
      // Store demo role + designation as user fields
      ...(user.designation ? { designation: user.designation } as any : {}),
      ...(user.demoRole ? { demoRole: user.demoRole } as any : {}),
    });

    userIds[user.email] = id;
    userCache[user.email] = id;
  }

  return userIds;
}

async function seedSequences(ctx, userIds: Record<string, Id<"users">>): Promise<void> {
  const orgId = userCache["_org"];
  const sequences = [
    { code: "LEAD", name: "Lead Numbers", prefix: "LD-", padding: 5, startNumber: 1001, scope: "organization" as const },
    { code: "STU", name: "Student IDs", prefix: "STU-", padding: 6, startNumber: 2024001, scope: "organization" as const },
    { code: "ADM", name: "Admission Numbers", prefix: "ADM-", padding: 5, startNumber: 5001, scope: "organization" as const },
    { code: "INV", name: "Invoice Numbers", prefix: "INV-", padding: 5, startNumber: 3001, scope: "organization" as const },
    { code: "TASK", name: "Task IDs", prefix: "TSK-", padding: 4, startNumber: 1, scope: "organization" as const },
    { code: "EMP", name: "Employee IDs", prefix: "EMP-", padding: 4, startNumber: 1, scope: "organization" as const },
  ];

  const adminId = userIds["demo.admin@vedaedtech.com"] || Object.values(userIds)[0];

  for (const seq of sequences) {
    await ctx.db.insert("sequence_configs", {
      code: seq.code,
      name: seq.name,
      prefix: seq.prefix,
      suffix: "",
      padding: seq.padding,
      startNumber: seq.startNumber,
      currentNumber: seq.startNumber,
      increment: 1,
      resetStrategy: "yearly",
      scope: seq.scope,
      organizationId: orgId,
      isActive: true,
      description: `Auto-generated ${seq.name} for demo`,
      createdBy: adminId,
      createdAt: getDaysAgo(30),
    });
  }
}

async function seedLeads(ctx, orgId: Id<"organizations">, userIds: Record<string, Id<"users">>): Promise<void> {
  const leadNames = [
    "Ahmed Hassan", "Maria Lopez", "Kenji Tanaka", "Sarah Connors", "Rajesh Kumar",
    "Emma Wilson", "Yuki Yamamoto", "Carlos Mendez", "Aisha Bello", "Chen Wei",
    "Sophie Laurent", "Diego Martinez", "Priya Kapoor", "Omar Farouk", "Lisa Chang",
    "Mohammed Ali", "Natasha Petrova", "Hans Mueller", "Grace Okafor", "Lucas Silva",
    "Fatima Zahra", "John Peterson", "Mei-Ling Wu", "Abdullah Khan", "Elena Popescu",
  ];

  const sources = ["Website", "Referral", "Social Media", "Email Campaign", "Walk-in", "Partner", "Event"];
  const statuses = ["new", "contacted", "qualified", "proposal", "negotiation", "converted", "lost"];
  const courses = ["B.Tech CSE", "B.Tech AI & ML", "MBA", "BBA", "M.Tech", "BCA", "MCA", "Digital Marketing"];
  const counselorId = userIds["demo.counselor@vedaedtech.com"] || Object.values(userIds)[0];
  const salesMgrId = userIds["demo.sales-manager@vedaedtech.com"] || Object.values(userIds)[0];

  for (let i = 0; i < leadNames.length; i++) {
    const name = leadNames[i];
    const email = "lead." + name.toLowerCase().replace(/\s+/g, ".") + "@example.com";
    const phone = "+971-55-" + Math.floor(1000000 + Math.random() * 9000000);
    const status = randomItem(statuses);
    const source = randomItem(sources);
    const course = randomItem(courses);
    const daysAgo = randomInt(0, 45);

    await ctx.db.insert("activity_logs", {
      entityType: "lead",
      entityId: `demo-lead-${i + 1}`,
      module: "crm",
      action: "created",
      title: `Lead created: ${name}`,
      description: `${name} expressed interest in ${course}. Source: ${source}. Status: ${status}.`,
      userId: counselorId,
      organizationId: orgId,
      severity: "info",
      visibility: "public",
      metadata: {
        leadName: name, email, phone, source, course, status,
        assignedTo: i % 3 === 0 ? counselorId : salesMgrId,
        expectedFee: Math.floor(50000 + Math.random() * 200000),
      },
      createdAt: getDaysAgo(daysAgo),
    });

    // Some leads have follow-up activities
    if (daysAgo < 30 && daysAgo > 5) {
      await ctx.db.insert("activity_logs", {
        entityType: "lead",
        entityId: `demo-lead-${i + 1}`,
        module: "crm",
        action: "updated",
        title: `Lead ${name} - Follow-up completed`,
        description: `Follow-up call completed. Interest level: ${randomInt(3, 10)}/10.`,
        userId: counselorId,
        organizationId: orgId,
        severity: "info",
        visibility: "internal",
        metadata: { followUpDate: getDaysAgo(daysAgo - 2), nextAction: "Send brochure" },
        createdAt: getDaysAgo(daysAgo - 2),
      });
    }

    // Some converted leads
    if (status === "converted" && i < 5) {
      await ctx.db.insert("activity_logs", {
        entityType: "lead",
        entityId: `demo-lead-${i + 1}`,
        module: "crm",
        action: "converted",
        title: `Lead ${name} converted to student`,
        description: `${name} enrolled in ${course}. Fee: AED ${Math.floor(50000 + Math.random() * 150000)}.`,
        userId: salesMgrId,
        organizationId: orgId,
        severity: "success",
        visibility: "public",
        metadata: { convertedAt: getDaysAgo(daysAgo - 3), course, fee: Math.floor(50000 + Math.random() * 150000) },
        createdAt: getDaysAgo(daysAgo - 3),
      });
    }
  }
}

async function seedStudents(ctx, orgId: Id<"organizations">, userIds: Record<string, Id<"users">>): Promise<void> {
  const studentNames = [
    "Aanya Kapoor", "Reyansh Gupta", "Ishita Verma", "Aditya Singh", "Sneha Reddy",
    "Arjun Nair", "Kavya Sharma", "Rohan Das", "Neha Patel", "Vivaan Joshi",
    "Ananya Iyer", "Dhruv Mehta", "Sara Khan", "Aarav Malhotra", "Mira Choudhury",
  ];

  const courses = ["B.Tech CSE", "B.Tech AI & ML", "MBA", "BBA", "BCA"];
  const years = ["Year 1", "Year 2", "Year 3", "Year 4"];
  const facultyId = userIds["demo.faculty@vedaedtech.com"] || Object.values(userIds)[0];

  for (let i = 0; i < studentNames.length; i++) {
    const name = studentNames[i];
    const email = "student." + name.toLowerCase().replace(/\s+/g, ".") + "@vedastudent.com";
    const course = randomItem(courses);
    const year = randomItem(years);
    const daysAgo = randomInt(1, 60);

    await ctx.db.insert("activity_logs", {
      entityType: "student",
      entityId: `demo-student-${i + 1}`,
      module: "student",
      action: "created",
      title: `Student enrolled: ${name}`,
      description: `${name} enrolled in ${course} (${year}). Student ID: STU-${2024001 + i}.`,
      userId: facultyId,
      organizationId: orgId,
      severity: "info",
      visibility: "public",
      metadata: {
        studentName: name, email, course, year,
        enrollmentDate: getDaysAgo(daysAgo),
        feeStatus: randomItem(["paid", "partial", "pending"]),
        attendance: randomInt(65, 98) + "%",
      },
      createdAt: getDaysAgo(daysAgo),
    });

    // Recent attendance records
    for (let d = 0; d < 5; d++) {
      await ctx.db.insert("activity_logs", {
        entityType: "student",
        entityId: `demo-student-${i + 1}`,
        module: "academic",
        action: "updated",
        title: name + " - Attendance " + (d + 1),
        description: `Class ${d + 1}: ${randomItem(["Present", "Present", "Present", "Absent", "Late"])}. Course: ${course}.`,
        userId: facultyId,
        organizationId: orgId,
        severity: "info",
        visibility: "internal",
        metadata: { date: getDaysAgo(d * 3), course },
        createdAt: getDaysAgo(d * 3),
      });
    }
  }
}

async function seedAdmissions(ctx, orgId: Id<"organizations">, userIds: Record<string, Id<"users">>): Promise<void> {
  const admissionNames = [
    "Zara Sheikh", "Ibrahim Ansari", "Diya Singh", "Kabir Das", "Anika Patel",
    "Rohit Sharma", "Myra Kapoor", "Aryan Verma", "Sia Gupta", "Neil O'Brien",
  ];

  const statuses = ["application", "document_verification", "interview_scheduled", "offer_made", "enrolled", "rejected"];
  const courses = ["B.Tech CSE", "B.Tech AI & ML", "MBA", "BBA", "M.Tech AI"];
  const intakes = ["Fall 2026", "Spring 2026", "Summer 2026"];
  const counselorId = userIds["demo.counselor@vedaedtech.com"] || Object.values(userIds)[0];

  for (let i = 0; i < admissionNames.length; i++) {
    const name = admissionNames[i];
    const status = randomItem(statuses);
    const course = randomItem(courses);
    const intake = randomItem(intakes);
    const daysAgo = randomInt(1, 30);

    await ctx.db.insert("activity_logs", {
      entityType: "admission",
      entityId: `demo-admission-${i + 1}`,
      module: "admissions",
      action: "created",
      title: `Application received: ${name}`,
      description: `${name} applied for ${course} (${intake}). Status: ${status}.`,
      userId: counselorId,
      organizationId: orgId,
      severity: "info",
      visibility: "public",
      metadata: {
        applicantName: name, course, intake, status,
        applicationFee: i < 7 ? 500 : "Waived",
        documents: randomItem(["Complete", "Pending", "In Review"]),
      },
      createdAt: getDaysAgo(daysAgo),
    });

    // Status changes
    if (daysAgo > 5) {
      await ctx.db.insert("activity_logs", {
        entityType: "admission",
        entityId: `demo-admission-${i + 1}`,
        module: "admissions",
        action: "updated",
        title: `Application ${name} - Documents reviewed`,
        description: `Document verification ${randomItem(["completed", "pending additional docs", "approved"])}.`,
        userId: counselorId,
        organizationId: orgId,
        severity: "info",
        visibility: "internal",
        createdAt: getDaysAgo(daysAgo - 5),
      });
    }
  }
}

async function seedTasks(ctx, orgId: Id<"organizations">, userIds: Record<string, Id<"users">>): Promise<void> {
  const taskTemplates = [
    { title: "Review Q2 Enrollment Reports", module: "administration", priority: "high" },
    { title: "Finalize Marketing Budget", module: "marketing", priority: "high" },
    { title: "Update Student Database Records", module: "administration", priority: "medium" },
    { title: "Prepare Faculty Onboarding Materials", module: "hr", priority: "medium" },
    { title: "Follow up with Lead: Ahmed Hassan", module: "crm", priority: "high" },
    { title: "Schedule Parent-Teacher Meeting", module: "academic", priority: "medium" },
    { title: "Audit Financial Statements Q1", module: "finance", priority: "critical" },
    { title: "Deploy New Student Portal Update", module: "technology", priority: "high" },
    { title: "Conduct Campus Tour for Prospective Students", module: "admissions", priority: "low" },
    { title: "Review Scholarship Applications", module: "finance", priority: "medium" },
    { title: "Update Course Curriculum — AI & ML", module: "academic", priority: "high" },
    { title: "Process Payroll for April", module: "hr", priority: "critical" },
    { title: "Prepare Social Media Content Calendar", module: "marketing", priority: "medium" },
    { title: "CRM Data Cleanup — Deduplicate Leads", module: "crm", priority: "low" },
    { title: "Renew Software Licenses", module: "technology", priority: "high" },
    { title: "Organize Annual Sports Day", module: "administration", priority: "low" },
    { title: "Student Feedback Analysis — Semester 2", module: "academic", priority: "medium" },
    { title: "Prepare Board Meeting Presentation", module: "administration", priority: "critical" },
    { title: "Update Employee Handbook 2026", module: "hr", priority: "medium" },
    { title: "Follow up with Partner Institutions", module: "sales", priority: "medium" },
  ];

  const assignees = [
    userIds["demo.ceo@vedaedtech.com"], userIds["demo.coo@vedaedtech.com"],
    userIds["demo.cto@vedaedtech.com"], userIds["demo.cmo@vedaedtech.com"],
    userIds["demo.counselor@vedaedtech.com"], userIds["demo.faculty@vedaedtech.com"],
    userIds["demo.sales-manager@vedaedtech.com"],
  ].filter(Boolean);

  const statuses = ["pending", "in_progress", "completed", "cancelled"];

  for (let i = 0; i < taskTemplates.length; i++) {
    const task = taskTemplates[i];
    const assignee = randomItem(assignees) || Object.values(userIds)[0];
    const status = i < 5 ? "completed" : i < 12 ? "in_progress" : "pending";
    const daysAgo = randomInt(0, 14);

    await ctx.db.insert("activity_logs", {
      entityType: "task",
      entityId: `demo-task-${i + 1}`,
      module: task.module,
      action: status === "completed" ? "completed" : "created",
      title: task.title,
      description: `Task ${status.replace("_", " ")}. Priority: ${task.priority}. Module: ${task.module}.`,
      userId: assignee,
      organizationId: orgId,
      severity: task.priority === "critical" ? "error" : task.priority === "high" ? "warning" : "info",
      visibility: "internal",
      metadata: {
        taskId: `TSK-${String(i + 1).padStart(4, "0")}`,
        priority: task.priority,
        dueDate: getDaysAgo(daysAgo - 7),
        status,
      },
      createdAt: getDaysAgo(daysAgo),
    });
  }
}

async function seedNotifications(ctx, orgId: Id<"organizations">, userIds: Record<string, Id<"users">>): Promise<void> {
  const notificationData = [
    { title: "Budget Review Required", message: "Q1 financial statements are ready for your review.", type: "approval", userId: "demo.ceo@vedaedtech.com", priority: 5 },
    { title: "New Lead Assigned", message: "Ahmed Hassan has been assigned to your pipeline.", type: "lead", userId: "demo.counselor@vedaedtech.com", priority: 3 },
    { title: "Admission Deadline Approaching", message: "Fall 2026 admission deadline is in 2 weeks.", type: "reminder", userId: "demo.counselor@vedaedtech.com", priority: 4 },
    { title: "System Update Complete", message: "Student portal v2.4.1 has been deployed.", type: "info", userId: "demo.cto@vedaedtech.com", priority: 2 },
    { title: "Payroll Processed", message: "April payroll has been processed successfully.", type: "success", userId: "demo.cfo@vedaedtech.com", priority: 3 },
    { title: "New Marketing Campaign Launched", message: "Summer Enrollment 2026 campaign is live.", type: "announcement", userId: "demo.cmo@vedaedtech.com", priority: 3 },
    { title: "Staff Meeting Tomorrow", message: "All-hands meeting scheduled for 10:00 AM.", type: "reminder", userId: "demo.ceo@vedaedtech.com", priority: 4 },
    { title: "Student Attendance Alert", message: "Aanya Kapoor has below 75% attendance.", type: "warning", userId: "demo.faculty@vedaedtech.com", priority: 4 },
    { title: "Task Overdue", message: "CRM Data Cleanup task is overdue.", type: "task", userId: "demo.admin@vedaedtech.com", priority: 2 },
    { title: "Fee Payment Received", message: "Payment of AED 85,000 received from Liam Fernandez.", type: "payment", userId: "demo.accountant@vedaedtech.com", priority: 3 },
    { title: "Welcome to EEOS Beta", message: "Welcome! Explore the platform using your role-based dashboard.", type: "info", userId: "demo.student@vedaedtech.com", priority: 1 },
    { title: "Parent-Teacher Meeting", message: "Parent-Teacher meeting scheduled for next Saturday.", type: "announcement", userId: "demo.parent@vedaedtech.com", priority: 3 },
    { title: "Employee of the Month", message: "Zara Yusuf has been selected as Employee of the Month.", type: "success", userId: "demo.chro@vedaedtech.com", priority: 2 },
    { title: "New Academic Year Planning", message: "Please submit department plans for 2026-27.", type: "task", userId: "demo.academic-head@vedaedtech.com", priority: 4 },
    { title: "Branch Performance Report", message: "Abu Dhabi branch Q1 report is available.", type: "info", userId: "demo.branch-director@vedaedtech.com", priority: 3 },
  ];

  for (const notif of notificationData) {
    const targetUserId = userIds[notif.userId];
    if (!targetUserId) continue;

    await ctx.db.insert("notifications", {
      title: notif.title,
      message: notif.message,
      type: notif.type as any,
      userId: targetUserId,
      organizationId: orgId,
      priority: notif.priority,
      read: Math.random() > 0.4,
      archived: false,
      module: notif.type,
      createdAt: getHoursAgo(randomInt(1, 72)),
    });
  }
}

async function seedActivities(ctx, orgId: Id<"organizations">, userIds: Record<string, Id<"users">>): Promise<void> {
  // Activities are already seeded via leads, students, tasks, etc.
  // This function adds additional general activities
  const actions = ["login", "logout", "updated", "created", "completed", "approved", "downloaded", "uploaded"];
  const modules = ["crm", "academic", "finance", "hr", "technology", "administration", "marketing", "sales"];
  const allUserIds = Object.values(userIds);

  for (let i = 0; i < 25; i++) {
    const user = randomItem(allUserIds);
    const action = randomItem(actions);
    const module = randomItem(modules);
    const hoursAgo = randomInt(1, 168);

    await ctx.db.insert("activity_logs", {
      entityType: "system",
      entityId: `demo-general-${i + 1}`,
      module,
      action: action as any,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} — ${module}`,
      description: `General activity in ${module} module.`,
      userId: user,
      organizationId: orgId,
      severity: "info",
      visibility: "public",
      createdAt: getHoursAgo(hoursAgo),
    });
  }
}

async function seedAttachments(ctx, orgId: Id<"organizations">, userIds: Record<string, Id<"users">>): Promise<void> {
  const files = [
    { name: "Q1_Financial_Report.pdf", ext: "pdf", mime: "application/pdf", size: 2450000, category: "finance", entityType: "organization" },
    { name: "Student_Handbook_2026.pdf", ext: "pdf", mime: "application/pdf", size: 1800000, category: "academic", entityType: "organization" },
    { name: "Marketing_Banner_Summer.png", ext: "png", mime: "image/png", size: 3200000, category: "marketing", entityType: "campaign" },
    { name: "Employee_ID_Photo.jpeg", ext: "jpeg", mime: "image/jpeg", size: 450000, category: "hr", entityType: "employee" },
    { name: "Admission_Form_Template.docx", ext: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 890000, category: "general", entityType: "admission" },
    { name: "Campus_Map.pdf", ext: "pdf", mime: "application/pdf", size: 1200000, category: "general", entityType: "branch" },
    { name: "Student_Transcript_Aanya.pdf", ext: "pdf", mime: "application/pdf", size: 560000, category: "academic", entityType: "student" },
    { name: "Invoice_2024-3001.pdf", ext: "pdf", mime: "application/pdf", size: 340000, category: "finance", entityType: "invoice" },
    { name: "Course_Curriculum_AI_ML.pdf", ext: "pdf", mime: "application/pdf", size: 2100000, category: "academic", entityType: "course" },
    { name: "Team_Photo_2026.jpg", ext: "jpg", mime: "image/jpeg", size: 5100000, category: "hr", entityType: "team" },
  ];

  const uploaderIds = Object.values(userIds);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const uploader = randomItem(uploaderIds);

    await ctx.db.insert("attachments", {
      fileName: file.name,
      originalName: file.name,
      size: file.size,
      extension: file.ext,
      mimeType: file.mime,
      storageId: "demo-storage-" + (i + 1),
      storageProvider: "local",
      category: file.category as any,
      entityType: file.entityType,
      entityId: `demo-${file.entityType}-1`,
      organizationId: orgId,
      tags: ["demo", file.category],
      description: `Demo ${file.category} file: ${file.name}`,
      hash: "demo-hash-" + (i + 1),
      currentVersion: 1,
      status: "active",
      uploadedBy: uploader,
      createdAt: getDaysAgo(randomInt(1, 30)),
      updatedAt: getDaysAgo(randomInt(1, 30)),
    });

    await ctx.db.insert("attachment_versions", {
      attachmentId: `demo-attachment-${i + 1}` as any,
      versionNumber: 1,
      fileName: file.name,
      originalName: file.name,
      size: file.size,
      extension: file.ext,
      mimeType: file.mime,
      storageId: "demo-storage-" + (i + 1),
      hash: "demo-hash-" + (i + 1),
      uploadedBy: uploader,
      changeNote: "Initial upload",
      createdAt: getDaysAgo(randomInt(1, 30)),
    });
  }
}

async function seedComments(ctx, orgId: Id<"organizations">, userIds: Record<string, Id<"users">>): Promise<void> {
  const commentTexts = [
    "I've reviewed the proposal. Looks good to proceed.",
    "Can we schedule a follow-up meeting this week?",
    "Please update the student records with the latest attendance data.",
    "The financial report needs additional breakdown by department.",
    "Great progress on the marketing campaign!",
    "We need to address the attendance issue for this student.",
    "The admission documents are complete and verified.",
    "Could you share the latest enrollment numbers?",
    "I recommend we extend the application deadline by 2 weeks.",
    "The curriculum update is on track for the new semester.",
    "Parent feedback has been positive about the new portal.",
    "Please reschedule the campus tour to next Tuesday.",
    "The budget allocation for Q3 needs revision.",
    "Excellent work on the social media campaign!",
    "Student performance in AI & ML has improved significantly.",
    "The new faculty orientation is scheduled for next month.",
    "Processing the scholarship applications now.",
    "The system upgrade has been completed successfully.",
    "Let's discuss the partnership opportunities.",
    "Attendance report for this month is ready for review.",
    "Thank you for the prompt response on this matter.",
    "The interview panel is confirmed for tomorrow.",
    "Please find the attached fee structure for review.",
    "The annual sports day preparations are underway.",
    "I've assigned the new leads to the counseling team.",
  ];

  const allUserIds = Object.values(userIds);

  for (let i = 0; i < commentTexts.length; i++) {
    const author = randomItem(allUserIds);
    const entityTypes = ["lead", "student", "task", "admission", "document"];
    const entityType = randomItem(entityTypes);

    await ctx.db.insert("comments", {
      entityType,
      entityId: `demo-${entityType}-${randomInt(1, 15)}`,
      body: commentTexts[i],
      authorId: author,
      parentId: undefined,
      rootId: undefined,
      isEdited: false,
      isDeleted: false,
      isResolved: Math.random() > 0.6,
      isPinned: i < 3,
      visibility: randomItem(["public", "internal", "public"]),
      mentions: [],
      attachments: [],
      reactions: {},
      createdAt: getHoursAgo(randomInt(1, 168)),
      updatedAt: undefined,
      resolvedAt: undefined,
      resolvedBy: undefined,
      editedAt: undefined,
      pinnedAt: i < 3 ? getHoursAgo(randomInt(1, 168)) : undefined,
      pinnedBy: i < 3 ? randomItem(allUserIds) : undefined,
    });
  }
}

async function seedAuditRecords(ctx, orgId: Id<"organizations">, userIds: Record<string, Id<"users">>): Promise<void> {
  const allUserIds = Object.values(userIds);
  const modules = ["crm", "student", "admissions", "finance", "hr", "academic", "marketing", "administration"];
  const actions = ["create", "update", "delete", "approve", "reject", "archive"];

  for (let i = 0; i < 50; i++) {
    const user = randomItem(allUserIds);
    const module = randomItem(modules);
    const action = randomItem(actions);
    const entityTypes = ["lead", "student", "admission", "task", "document", "invoice", "user"];

    await ctx.db.insert("activity_logs", {
      entityType: randomItem(entityTypes),
      entityId: `demo-audit-${i + 1}`,
      module,
      action: (action === "create" ? "created" : action === "approve" ? "approved" : action === "reject" ? "rejected" : action === "archive" ? "archived" : "updated") as any,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} — ${module}`,
      description: `Audit record ${i + 1}: ${action} operation in ${module}.`,
      userId: user,
      organizationId: orgId,
      severity: action === "reject" ? "warning" : "info",
      visibility: "internal",
      beforeSnapshot: { status: "previous" },
      afterSnapshot: { status: "current" },
      metadata: { auditId: `AUD-${String(i + 1).padStart(4, "0")}`, module, action },
      createdAt: getHoursAgo(randomInt(1, 720)),
    });
  }
}

async function seedDemoLogin(ctx, userIds: Record<string, Id<"users">>, deptIds: Id<"departments">[]): Promise<void> {
  for (const [email, userId] of Object.entries(userIds)) {
    const user = DEMO_USERS.find((u) => u.email === email);
    if (!user) continue;

    await ctx.db.insert("activity_logs", {
      entityType: "user",
      entityId: userId,
      module: "system",
      action: "login",
      title: `${user.name} logged in`,
      description: `Demo login as ${user.designation}.`,
      userId,
      organizationId: userCache["_org"],
      departmentId: deptIds[user.deptIdx],
      severity: "info",
      visibility: "public",
      createdAt: Date.now(),
    });

    // Also create a notification for the welcome
    await ctx.db.insert("notifications", {
      title: `Welcome to EEOS Beta, ${user.name.split(" ")[0]}!`,
      message: `You are logged in as ${user.designation}. Explore the platform and see your role-based dashboard.`,
      type: "info",
      userId,
      organizationId: userCache["_org"],
      priority: 1,
      read: false,
      archived: false,
      module: "system",
      createdAt: Date.now(),
    });
  }
}


// ─── Access Control Seeding ────────────────────────────────────

const DEMO_ROLE_DEFS = [
  { name: "Chief Executive Officer", code: "CEO", priority: 100, isSystem: true },
  { name: "Chief Operating Officer", code: "COO", priority: 90, isSystem: true },
  { name: "Chief Technology Officer", code: "CTO", priority: 85, isSystem: true },
  { name: "Chief Financial Officer", code: "CFO", priority: 80, isSystem: true },
  { name: "Chief Marketing Officer", code: "CMO", priority: 75, isSystem: true },
  { name: "Chief Human Resources Officer", code: "CHRO", priority: 70, isSystem: true },
  { name: "Branch Director", code: "BRANCH_DIRECTOR", priority: 65, isSystem: true },
  { name: "Academic Head", code: "ACADEMIC_HEAD", priority: 60, isSystem: true },
  { name: "Sales Manager", code: "SALES_MANAGER", priority: 55, isSystem: true },
  { name: "Senior Counselor", code: "COUNSELOR", priority: 50, isSystem: true },
  { name: "Faculty", code: "FACULTY", priority: 45, isSystem: true },
  { name: "Accountant", code: "ACCOUNTANT", priority: 40, isSystem: true },
  { name: "Admin", code: "ADMIN", priority: 95, isSystem: true },
  { name: "Parent", code: "PARENT", priority: 20, isSystem: true },
  { name: "Student", code: "STUDENT", priority: 10, isSystem: true },
];

const PERMISSION_GROUPS = [
  { name: "Platform", order: 1 },
  { name: "Organization", order: 2 },
  { name: "CRM", order: 3 },
  { name: "Sales", order: 4 },
  { name: "Admissions", order: 5 },
  { name: "Students", order: 6 },
  { name: "Academic", order: 7 },
  { name: "Finance", order: 8 },
  { name: "HR", order: 9 },
  { name: "Tasks", order: 10 },
  { name: "Workflow", order: 11 },
  { name: "Reports", order: 12 },
  { name: "Settings", order: 13 },
  { name: "Technology", order: 14 },
  { name: "Marketing", order: 15 },
  { name: "Administration", order: 16 },
];

const MODULES_ENTITIES = [
  { module: "platform", entities: ["user", "role", "permission", "audit", "notification"] },
  { module: "organization", entities: ["company", "branch", "department", "team"] },
  { module: "crm", entities: ["lead", "pipeline", "campaign"] },
  { module: "sales", entities: ["opportunity", "quote", "contract"] },
  { module: "admissions", entities: ["application", "document", "interview"] },
  { module: "student", entities: ["profile", "enrollment", "attendance", "fee"] },
  { module: "academic", entities: ["course", "batch", "exam", "grade", "timetable"] },
  { module: "finance", entities: ["invoice", "payment", "refund", "budget"] },
  { module: "hr", entities: ["employee", "leave", "payroll", "recruitment"] },
  { module: "tasks", entities: ["task", "subtask", "comment"] },
  { module: "workflow", entities: ["workflow", "approval", "step"] },
  { module: "reports", entities: ["report", "dashboard", "analytics"] },
  { module: "settings", entities: ["general", "sequence", "integration", "backup"] },
  { module: "technology", entities: ["asset", "license", "subscription", "incident"] },
  { module: "marketing", entities: ["campaign", "source", "content", "event"] },
  { module: "administration", entities: ["facility", "asset", "procurement", "compliance"] },
];

async function seedAccessControl(ctx, userIds) {
  const orgId = userCache["_org"];
  const userId = Object.values(userIds)[0];

  // 1. Create permission groups
  const groupIds = {};
  for (const g of PERMISSION_GROUPS) {
    const existing = await ctx.db.query("permission_groups").withIndex("by_name", (q) => q.eq("name", g.name)).first();
    if (existing) { groupIds[g.name] = existing._id; continue; }
    groupIds[g.name] = await ctx.db.insert("permission_groups", { name: g.name, description: g.name + " permissions", order: g.order, isActive: true, createdAt: now() });
  }

  // 2. Create permissions for each module:entity:action
  const actions = ["create", "read", "update", "delete", "approve", "assign", "export", "import"];
  const permIdsByModule = {};
  for (const me of MODULES_ENTITIES) {
    permIdsByModule[me.module] = [];
    const groupName = me.module === "platform" ? "Platform" :
      me.module.charAt(0).toUpperCase() + me.module.slice(1);
    const grpKey = PERMISSION_GROUPS.find((g) => g.name.toLowerCase() === me.module)?.name ||
      PERMISSION_GROUPS.find((g) => g.name.toLowerCase().includes(me.module))?.name || "Platform";
    const groupId = groupIds[grpKey] || groupIds["Platform"];

    for (const entity of me.entities) {
      for (const action of actions) {
        const existing = await ctx.db.query("permissions").withIndex("by_module_entity", (q) => q.eq("module", me.module).eq("entity", entity)).first();
        if (existing) {
          permIdsByModule[me.module].push(existing._id);
          continue;
        }
        const pid = await ctx.db.insert("permissions", {
          module: me.module,
          entity,
          action,
          name: me.module + ":" + entity + ":" + action,
          groupId,
          isSystem: true,
          createdAt: now(),
        });
        permIdsByModule[me.module].push(pid);
      }
    }
  }

  // 3. Create roles
  const roleIds = {};
  for (const rd of DEMO_ROLE_DEFS) {
    const existing = await ctx.db.query("roles").withIndex("by_code", (q) => q.eq("code", rd.code)).first();
    if (existing) { roleIds[rd.code] = existing._id; continue; }
    roleIds[rd.code] = await ctx.db.insert("roles", {
      name: rd.name, code: rd.code, isSystem: rd.isSystem,
      isActive: true, priority: rd.priority, createdBy: userId, createdAt: now(),
    });
  }

  // 4. Assign scope rules per role
  const scopes = [
    { role: "CEO", default: "organization", max: "organization" },
    { role: "COO", default: "organization", max: "organization" },
    { role: "CTO", default: "organization", max: "organization" },
    { role: "CFO", default: "organization", max: "organization" },
    { role: "CMO", default: "organization", max: "organization" },
    { role: "CHRO", default: "organization", max: "organization" },
    { role: "ADMIN", default: "organization", max: "global" },
    { role: "BRANCH_DIRECTOR", default: "branch", max: "branch" },
    { role: "ACADEMIC_HEAD", default: "department", max: "department" },
    { role: "SALES_MANAGER", default: "branch", max: "branch" },
    { role: "COUNSELOR", default: "department", max: "department" },
    { role: "FACULTY", default: "own", max: "own" },
    { role: "ACCOUNTANT", default: "organization", max: "organization" },
    { role: "PARENT", default: "own", max: "own" },
    { role: "STUDENT", default: "own", max: "own" },
  ];

  for (const s of scopes) {
    const roleId = roleIds[s.role];
    if (!roleId) continue;
    for (const me of MODULES_ENTITIES) {
      const existing = await ctx.db.query("scope_rules").withIndex("by_role_entity", (q) => q.eq("roleId", roleId).eq("entityType", me.module)).first();
      if (!existing) {
        await ctx.db.insert("scope_rules", { roleId, entityType: me.module, defaultScope: s.default, maxScope: s.max, createdBy: userId, createdAt: now() });
      }
    }
  }

  // 5. Assign permissions to roles
  const rolePermsConfig = [
    { role: "CEO", modules: ["platform","organization","crm","sales","admissions","student","academic","finance","hr","tasks","workflow","reports","settings","technology","marketing","administration"] },
    { role: "COO", modules: ["platform","organization","admissions","student","academic","tasks","reports","administration"] },
    { role: "CTO", modules: ["platform","technology","settings","tasks"] },
    { role: "CFO", modules: ["finance","reports","settings"] },
    { role: "CMO", modules: ["crm","marketing","reports"] },
    { role: "CHRO", modules: ["hr","reports","organization"] },
    { role: "ADMIN", modules: ["platform","organization","settings","technology"] },
    { role: "BRANCH_DIRECTOR", modules: ["organization","crm","admissions","student","academic","tasks","reports","administration"] },
    { role: "ACADEMIC_HEAD", modules: ["academic","student","reports","tasks"] },
    { role: "SALES_MANAGER", modules: ["crm","sales","reports"] },
    { role: "COUNSELOR", modules: ["crm","admissions","student","tasks"] },
    { role: "FACULTY", modules: ["academic","student"] },
    { role: "ACCOUNTANT", modules: ["finance","reports"] },
    { role: "PARENT", modules: ["student","academic","finance"] },
    { role: "STUDENT", modules: ["academic","student","tasks"] },
  ];

  for (const rp of rolePermsConfig) {
    const roleId = roleIds[rp.role];
    if (!roleId) continue;
    for (const mod of rp.modules) {
      const permIds = permIdsByModule[mod] || [];
      for (const pid of permIds) {
        const existing = await ctx.db.query("role_permissions").withIndex("by_role_permission", (q) => q.eq("roleId", roleId).eq("permissionId", pid)).first();
        if (!existing) {
          await ctx.db.insert("role_permissions", { roleId, permissionId: pid, scope: "own", granted: true, createdBy: userId, createdAt: now() });
        }
      }
    }
  }

  // 6. Assign demo users to roles
  const roleMap = {
    ceo: "CEO", coo: "COO", cto: "CTO", cfo: "CFO", cmo: "CMO", chro: "CHRO",
    admin: "ADMIN", branch_director: "BRANCH_DIRECTOR", academic_head: "ACADEMIC_HEAD",
    sales_manager: "SALES_MANAGER", counselor: "COUNSELOR", faculty: "FACULTY",
    accountant: "ACCOUNTANT", parent: "PARENT", student: "STUDENT",
  };

  for (const [demoRole, roleCode] of Object.entries(roleMap)) {
    const roleId = roleIds[roleCode];
    if (!roleId) continue;
    // Find matching demo user
    const userEntry = Object.entries(userIds).find(([email]) => {
      const u = DEMO_USERS.find((du) => du.email === email);
      return u && u.demoRole === demoRole;
    });
    if (!userEntry) continue;
    const demoUserId = userEntry[1];
    const existing = await ctx.db.query("user_roles").withIndex("by_user_role", (q) => q.eq("userId", demoUserId).eq("roleId", roleId)).first();
    if (!existing) {
      await ctx.db.insert("user_roles", { userId: demoUserId, roleId, organizationId: orgId, isActive: true, createdAt: now() });
    }
  }

  // 7. Designation mappings
  const desigMap = [
    { desig: "Chief Executive Officer", role: "CEO" },
    { desig: "Chief Operating Officer", role: "COO" },
    { desig: "Chief Technology Officer", role: "CTO" },
    { desig: "Chief Financial Officer", role: "CFO" },
    { desig: "Chief Marketing Officer", role: "CMO" },
    { desig: "Chief Human Resources Officer", role: "CHRO" },
    { desig: "System Administrator", role: "ADMIN" },
    { desig: "Branch Director", role: "BRANCH_DIRECTOR" },
    { desig: "Academic Head", role: "ACADEMIC_HEAD" },
    { desig: "Sales Manager", role: "SALES_MANAGER" },
    { desig: "Senior Academic Counselor", role: "COUNSELOR" },
    { desig: "Associate Professor", role: "FACULTY" },
    { desig: "Senior Accountant", role: "ACCOUNTANT" },
    { desig: "Parent", role: "PARENT" },
    { desig: "Student", role: "STUDENT" },
  ];

  for (const d of desigMap) {
    const roleId = roleIds[d.role];
    if (!roleId) continue;
    const existing = await ctx.db.query("designation_roles").withIndex("by_designation", (q) => q.eq("designation", d.desig)).first();
    if (!existing) {
      await ctx.db.insert("designation_roles", { designation: d.desig, roleId, isDefault: true, createdBy: userId, createdAt: now() });
    }
  }

  // 8. Enable studio access for appropriate roles
  const studioAccess = [
    { role: "CEO", studios: ["org","master-data","access-control","workflow","tasks","crm","sales","admissions","student","academic","finance","hr","marketing","administration","technology","communication","analytics","settings"] },
    { role: "ADMIN", studios: ["org","master-data","access-control","workflow","tasks","settings","technology"] },
    { role: "COUNSELOR", studios: ["crm","admissions","student","tasks"] },
    { role: "FACULTY", studios: ["academic","student","tasks"] },
    { role: "STUDENT", studios: ["student","academic"] },
    { role: "PARENT", studios: ["student","academic"] },
  ];

  for (const sa of studioAccess) {
    const roleId = roleIds[sa.role];
    if (!roleId) continue;
    for (const studioId of sa.studios) {
      const existing = await ctx.db.query("studio_permissions").withIndex("by_studio_role", (q) => q.eq("studioId", studioId).eq("roleId", roleId)).first();
      if (!existing) {
        await ctx.db.insert("studio_permissions", { studioId, roleId, canAccess: true, canConfigure: sa.role === "CEO" || sa.role === "ADMIN", createdBy: userId, createdAt: now() });
      }
    }
  }
}

function now() {
  return Date.now();
}

/** Get demo user by role for the login flow */
export const getDemoUserByRole = query({
  args: {
    demoRole: v.string(),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    const user = users.find((u: any) => u.demoRole === args.demoRole);
    if (!user) return null;
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      demoRole: (user as any).demoRole,
      designation: (user as any).designation,
    };
  },
});

/** Get all demo users for the login screen */
export const getDemoUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users
      .filter((u: any) => u.demoRole)
      .map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        image: u.image,
        demoRole: (u as any).demoRole,
        designation: (u as any).designation,
      }));
  },
});

/** Check if demo is seeded */
export const isSeeded = query({
  args: {},
  handler: async (ctx) => {
    const flag = await ctx.db.query("demo_data").withIndex("by_key", (q) => q.eq("key", "demo_seeded")).first();
    return !!flag;
  },
});
