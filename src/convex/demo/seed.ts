// ============================
// Demo Environment - Master Seed Engine
// ============================
// Reusable seed functions. Future modules: seedFinance(), seedHR(), etc.

import { v } from "convex/values";
import { mutation, MutationCtx } from "../_generated/server";
import {
  DEMO_ORG,
  DEMO_DEPARTMENTS,
  DEMO_TEAMS,
  DEMO_USERS,
  DEMO_LEADS,
  DEMO_STUDENTS,
  DEMO_ADMISSIONS,
  DEMO_TASKS,
  DEMO_NOTIFICATIONS,
  DEMO_ACTIVITIES,
  DEMO_TIMELINE_EVENTS,
  DEMO_COMMENTS,
  DEMO_ATTACHMENTS,
  DEMO_AUDIT_RECORDS,
} from "./data";

const NOW = Date.now();
const DAY = 86400000;

function hoursAgo(n: number) {
  return NOW - n * 3600000;
}

// ============================
// Helper: Create Organization Hierarchy
// ============================
async function seedOrganization(ctx: MutationCtx) {
  // Create Group
  const groupId = await ctx.db.insert("demoOrganizations", {
    name: DEMO_ORG.group.name,
    code: DEMO_ORG.group.code,
    type: "group",
    displayOrder: 0,
    isActive: true,
    createdAt: NOW - 90 * DAY,
    updatedAt: NOW - 7 * DAY,
  });

  // Create Companies
  const companyIds: string[] = [];
  for (let i = 0; i < DEMO_ORG.companies.length; i++) {
    const companyId = await ctx.db.insert("demoOrganizations", {
      name: DEMO_ORG.companies[i].name,
      code: DEMO_ORG.companies[i].code,
      type: "company",
      parentId: groupId as any,
      displayOrder: i + 1,
      isActive: true,
      createdAt: NOW - 90 * DAY,
      updatedAt: NOW - 7 * DAY,
    });
    companyIds.push(companyId);
  }

  // Create Branches
  const branchIds: string[] = [];
  for (let i = 0; i < DEMO_ORG.branches.length; i++) {
    const branchId = await ctx.db.insert("demoOrganizations", {
      name: DEMO_ORG.branches[i].name,
      code: DEMO_ORG.branches[i].code,
      type: "branch",
      parentId: companyIds[0] as any,
      address: DEMO_ORG.branches[i].address,
      displayOrder: i + 1,
      isActive: true,
      createdAt: NOW - 85 * DAY,
      updatedAt: NOW - 7 * DAY,
    });
    branchIds.push(branchId);
  }

  return { groupId, companyIds, branchIds };
}

// ============================
// Helper: Seed Departments
// ============================
async function seedDepartments(ctx: MutationCtx, branchId: string) {
  const departmentIds: Record<string, string> = {};
  for (let i = 0; i < DEMO_DEPARTMENTS.length; i++) {
    const dept = DEMO_DEPARTMENTS[i];
    const deptId = await ctx.db.insert("demoDepartments", {
      name: dept.name,
      code: dept.code,
      organizationId: branchId as any,
      displayOrder: i + 1,
      isActive: true,
      createdAt: NOW - 85 * DAY,
      updatedAt: NOW - 7 * DAY,
    });
    departmentIds[dept.code] = deptId;
  }
  return departmentIds;
}

// ============================
// Helper: Seed Teams
// ============================
async function seedTeams(ctx: MutationCtx, departmentIds: Record<string, string>) {
  const teamIds: Record<string, string> = {};
  for (let i = 0; i < DEMO_TEAMS.length; i++) {
    const team = DEMO_TEAMS[i];
    const deptId = departmentIds[team.departmentCode];
    if (!deptId) continue;
    const teamId = await ctx.db.insert("demoTeams", {
      name: team.name,
      code: team.code,
      departmentId: deptId as any,
      displayOrder: i + 1,
      isActive: true,
      createdAt: NOW - 80 * DAY,
      updatedAt: NOW - 7 * DAY,
    });
    teamIds[team.code] = teamId;
  }
  return teamIds;
}

// ============================
// Helper: Seed Demo Users
// ============================
async function seedProfiles(
  ctx: MutationCtx,
  departmentIds: Record<string, string>,
  teamIds: Record<string, string>,
  branchId: string,
) {
  const userIds: Record<string, string> = {};

  for (const user of DEMO_USERS) {
    const deptId = departmentIds[user.departmentCode];
    const userTeamIds = user.teamCodes
      .map((code) => teamIds[code])
      .filter(Boolean) as any[];

    const profileId = await ctx.db.insert("demoProfiles", {
      fullName: user.name,
      email: user.email,
      phone: user.phone,
      employeeId: user.employeeId,
      designation: user.designation,
      demoRole: user.role,
      departmentId: deptId as any,
      teamIds: userTeamIds.length > 0 ? userTeamIds : undefined,
      branchId: branchId as any,
      status: user.status,
      permissions: [],
      displayOrder: user.displayOrder,
      isActive: user.status === "Active",
      createdAt: NOW - 80 * DAY,
      updatedAt: NOW - 1 * DAY,
    });
    userIds[user.role] = profileId;
  }

  return userIds;
}

// ============================
// Helper: Seed Leads
// ============================
async function seedLeads(ctx: MutationCtx, userIds: Record<string, string>) {
  const leadIds: string[] = [];
  for (let i = 0; i < DEMO_LEADS.length; i++) {
    const lead = DEMO_LEADS[i];
    const assignedUserId = userIds[lead.assignedToRole];
    const createdAt = hoursAgo(Math.floor(Math.random() * 720) + 1);

    const status =
      lead.priority === "Hot"
        ? "Contacted"
        : lead.priority === "Warm"
          ? "New"
          : "New";

    const id = await ctx.db.insert("demoLeads", {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      status,
      priority: lead.priority,
      assignedTo: assignedUserId as any,
      assignedToRole: lead.assignedToRole,
      score: lead.score,
      createdAt,
      updatedAt: createdAt + Math.floor(Math.random() * 168) * 3600000,
    });
    leadIds.push(id);
  }
  return leadIds;
}

// ============================
// Helper: Seed Students
// ============================
async function seedStudents(ctx: MutationCtx, userIds: Record<string, string>) {
  const studentIds: string[] = [];
  // Find the parent userId for the demo student
  const parentUserId = userIds["Student"];

  for (let i = 0; i < DEMO_STUDENTS.length; i++) {
    const s = DEMO_STUDENTS[i];
    const enrollmentDate = NOW - Math.floor(Math.random() * 180 + 30) * DAY;
    const status = s.attendance >= 80 ? "Active" : "At Risk";

    const id = await ctx.db.insert("demoStudents", {
      name: s.name,
      email: s.email,
      phone: s.parentPhone,
      grade: s.grade,
      section: s.section,
      parentId: i === 0 ? (parentUserId as any) : undefined,
      parentName: s.parentName,
      parentEmail: s.parentEmail,
      parentPhone: s.parentPhone,
      enrollmentDate,
      status,
      attendance: s.attendance,
      performance: s.performance,
      createdAt: enrollmentDate,
      updatedAt: NOW - Math.floor(Math.random() * 14) * DAY,
    });
    studentIds.push(id);
  }
  return studentIds;
}

// ============================
// Helper: Seed Admissions
// ============================
async function seedAdmissions(ctx: MutationCtx, userIds: Record<string, string>) {
  const admissionIds: string[] = [];
  for (let i = 0; i < DEMO_ADMISSIONS.length; i++) {
    const a = DEMO_ADMISSIONS[i];
    const assignedUserId = userIds[a.assignedToRole];
    const createdAt = hoursAgo(Math.floor(Math.random() * 360) + 1);

    const followUpDays = a.status === "New" ? 2 : a.status === "In Progress" ? 5 : undefined;

    const id = await ctx.db.insert("demoAdmissions", {
      studentName: a.studentName,
      studentEmail: a.studentEmail,
      program: a.program,
      grade: a.grade,
      status: a.status,
      assignedTo: assignedUserId as any,
      assignedToRole: a.assignedToRole,
      feeQuoted: a.feeQuoted,
      feePaid: a.feePaid,
      source: a.source,
      followUpDate: followUpDays ? NOW + followUpDays * DAY : undefined,
      createdAt,
      updatedAt: NOW - Math.floor(Math.random() * 7) * DAY,
    });
    admissionIds.push(id);
  }
  return admissionIds;
}

// ============================
// Helper: Seed Tasks
// ============================
async function seedTasks(ctx: MutationCtx, userIds: Record<string, string>) {
  const taskIds: string[] = [];
  for (let i = 0; i < DEMO_TASKS.length; i++) {
    const t = DEMO_TASKS[i];
    const assignedUserId = userIds[t.assignedToRole];
    const createdAt = hoursAgo(Math.floor(Math.random() * 336) + 1);
    const dueDate = t.status !== "Completed"
      ? NOW + Math.floor(Math.random() * 14 + 1) * DAY
      : undefined;

    const id = await ctx.db.insert("demoTasks", {
      title: t.title,
      description: t.description,
      taskType: t.taskType,
      priority: t.priority,
      status: t.status,
      assignedTo: assignedUserId as any,
      assignedToRole: t.assignedToRole,
      dueDate,
      createdAt,
      updatedAt: t.status === "Completed"
        ? createdAt + Math.floor(Math.random() * 48) * 3600000
        : createdAt + Math.floor(Math.random() * 24) * 3600000,
    });
    taskIds.push(id);
  }
  return taskIds;
}

// ============================
// Helper: Seed Notifications
// ============================
async function seedNotifications(ctx: MutationCtx, userIds: Record<string, string>) {
  const notifIds: string[] = [];
  for (let i = 0; i < DEMO_NOTIFICATIONS.length; i++) {
    const n = DEMO_NOTIFICATIONS[i];
    const targetUserId = userIds[n.role];
    const createdAt = hoursAgo(Math.floor(Math.random() * 168) + 1);

    const id = await ctx.db.insert("demoNotifications", {
      title: n.title,
      message: n.message,
      type: n.type,
      userId: targetUserId as any,
      role: n.role,
      isRead: Math.random() > 0.6,
      createdAt,
    });
    notifIds.push(id);
  }
  return notifIds;
}

// ============================
// Helper: Seed Activities
// ============================
async function seedActivities(ctx: MutationCtx) {
  const activityIds: string[] = [];
  for (let i = 0; i < DEMO_ACTIVITIES.length; i++) {
    const a = DEMO_ACTIVITIES[i];
    const createdAt = hoursAgo(Math.floor(Math.random() * 336) + 1);

    const id = await ctx.db.insert("demoActivities", {
      action: a.action,
      entity: a.entity,
      userName: a.userName,
      userRole: a.userRole,
      createdAt,
    });
    activityIds.push(id);
  }
  return activityIds;
}

// ============================
// Helper: Seed Timeline
// ============================
async function seedTimeline(ctx: MutationCtx, leadIds: string[], admissionIds: string[]) {
  const timelineIds: string[] = [];
  for (let i = 0; i < DEMO_TIMELINE_EVENTS.length; i++) {
    const t = DEMO_TIMELINE_EVENTS[i];
    const entityId =
      t.entityType === "Lead" && leadIds.length > 0
        ? leadIds[i % leadIds.length]
        : t.entityType === "Admission" && admissionIds.length > 0
          ? admissionIds[i % admissionIds.length]
          : "seed-entity";

    const createdAt = hoursAgo(Math.floor(Math.random() * 720) + 1);

    const id = await ctx.db.insert("demoTimelineEvents", {
      title: t.title,
      description: t.description,
      eventType: t.eventType,
      entityType: t.entityType,
      entityId,
      userName: "System",
      createdAt,
    });
    timelineIds.push(id);
  }
  return timelineIds;
}

// ============================
// Helper: Seed Comments
// ============================
async function seedComments(ctx: MutationCtx, leadIds: string[], admissionIds: string[], studentIds: string[]) {
  const commentIds: string[] = [];
  for (let i = 0; i < DEMO_COMMENTS.length; i++) {
    const c = DEMO_COMMENTS[i];
    const entityId =
      c.entityType === "Lead" && leadIds.length > 0
        ? leadIds[i % leadIds.length]
        : c.entityType === "Admission" && admissionIds.length > 0
          ? admissionIds[i % admissionIds.length]
          : c.entityType === "Student" && studentIds.length > 0
            ? studentIds[i % studentIds.length]
            : "seed-entity";

    const createdAt = hoursAgo(Math.floor(Math.random() * 720) + 1);

    const id = await ctx.db.insert("demoComments", {
      content: c.content,
      entityType: c.entityType,
      entityId,
      userName: c.userName,
      userRole: c.userRole,
      createdAt,
    });
    commentIds.push(id);
  }
  return commentIds;
}

// ============================
// Helper: Seed Attachments
// ============================
async function seedAttachments(ctx: MutationCtx, studentIds: string[]) {
  const attachmentIds: string[] = [];
  for (let i = 0; i < DEMO_ATTACHMENTS.length; i++) {
    const a = DEMO_ATTACHMENTS[i];
    const entityId =
      a.entityType === "Student" && studentIds.length > 0
        ? studentIds[i % studentIds.length]
        : "seed-entity";

    const id = await ctx.db.insert("demoAttachments", {
      name: a.name,
      type: a.type,
      size: a.size,
      url: `/demo/files/${a.name.toLowerCase().replace(/\s+/g, "_")}`,
      entityType: a.entityType,
      entityId,
      createdAt: hoursAgo(Math.floor(Math.random() * 720) + 1),
    });
    attachmentIds.push(id);
  }
  return attachmentIds;
}

// ============================
// Helper: Seed Audit Records
// ============================
async function seedAuditRecords(ctx: MutationCtx, userIds: Record<string, string>) {
  const auditIds: string[] = [];
  const roleUserNames = Object.fromEntries(
    DEMO_USERS.map((u) => [u.role, { name: u.name, email: u.email }]),
  );

  for (let i = 0; i < DEMO_AUDIT_RECORDS.length; i++) {
    const a = DEMO_AUDIT_RECORDS[i];
    const roles = Object.keys(roleUserNames);
    const randomRole = roles[Math.floor(Math.random() * roles.length)];
    const userInfo = roleUserNames[randomRole];
    const userId = userIds[randomRole];

    const id = await ctx.db.insert("demoAuditRecords", {
      action: a.action,
      entity: a.entity,
      userId: userId as any,
      userName: userInfo.name,
      userRole: randomRole,
      createdAt: hoursAgo(Math.floor(Math.random() * 720) + 1),
    });
    auditIds.push(id);
  }
  return auditIds;
}

// ============================
// Master Seed Mutation
// ============================
export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingOrgs = await ctx.db.query("demoOrganizations").collect();
    if (existingOrgs.length > 0) {
      return { success: false, message: "Demo data already seeded. Use resetAll first." };
    }

    // 1. Organization Hierarchy
    const { branchIds } = await seedOrganization(ctx);
    const mainBranchId = branchIds[0];

    // 2. Departments & Teams
    const deptIds = await seedDepartments(ctx, mainBranchId);
    const teamIds = await seedTeams(ctx, deptIds);

    // 3. Demo Users (Profiles)
    const profileIds = await seedProfiles(ctx, deptIds, teamIds, mainBranchId);

    // 4. Demo Data
    const leadIds = await seedLeads(ctx, profileIds);
    const studentIds = await seedStudents(ctx, profileIds);
    const admissionIds = await seedAdmissions(ctx, profileIds);
    const taskIds = await seedTasks(ctx, profileIds);
    const notifIds = await seedNotifications(ctx, profileIds);
    const activityIds = await seedActivities(ctx);
    const timelineIds = await seedTimeline(ctx, leadIds, admissionIds);
    const commentIds = await seedComments(ctx, leadIds, admissionIds, studentIds);
    const attachmentIds = await seedAttachments(ctx, studentIds);
    const auditIds = await seedAuditRecords(ctx, profileIds);

    return {
      success: true,
      message: "Demo data seeded successfully",
      counts: {
        organizations: 1 + DEMO_ORG.companies.length + DEMO_ORG.branches.length,
        departments: DEMO_DEPARTMENTS.length,
        teams: DEMO_TEAMS.length,
        profiles: DEMO_USERS.length,
        leads: leadIds.length,
        students: studentIds.length,
        admissions: admissionIds.length,
        tasks: taskIds.length,
        notifications: notifIds.length,
        activities: activityIds.length,
        timelineEvents: timelineIds.length,
        comments: commentIds.length,
        attachments: attachmentIds.length,
        auditRecords: auditIds.length,
      },
    };
  },
});

// ============================
// Reset All Demo Data
// ============================
export const resetAll = mutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "demoOrganizations",
      "demoDepartments",
      "demoTeams",
      "demoProfiles",
      "demoLeads",
      "demoStudents",
      "demoAdmissions",
      "demoTasks",
      "demoNotifications",
      "demoActivities",
      "demoAttachments",
      "demoComments",
      "demoTimelineEvents",
      "demoAuditRecords",
    ] as const;

    for (const table of tables) {
      const docs = await ctx.db.query(table).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
    }

    return { success: true, message: "All demo data reset successfully" };
  },
});
