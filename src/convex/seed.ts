import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingUsers = await ctx.db.query("users").take(1);
    if (existingUsers.length > 0) return { seeded: false, message: "Already seeded" };

    const now = Date.now();

    // Create Group (Organization)
    await ctx.db.insert("organizations", {
      name: "Veda EdTech",
      code: "VEDA",
      description: "Enterprise Education Technology Group",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Create Designations
    const ceoDesigId = await ctx.db.insert("designations", {
      name: "CEO",
      code: "CEO",
      status: "active",
      description: "Chief Executive Officer",
      createdAt: now,
      updatedAt: now,
    });

    const cooDesigId = await ctx.db.insert("designations", {
      name: "COO",
      code: "COO",
      reportsTo: ceoDesigId,
      status: "active",
      description: "Chief Operating Officer",
      createdAt: now,
      updatedAt: now,
    });

    const cfoDesigId = await ctx.db.insert("designations", {
      name: "CFO",
      code: "CFO",
      reportsTo: ceoDesigId,
      status: "active",
      description: "Chief Financial Officer",
      createdAt: now,
      updatedAt: now,
    });

    const ckoDesigId = await ctx.db.insert("designations", {
      name: "CKO",
      code: "CKO",
      reportsTo: ceoDesigId,
      status: "active",
      description: "Chief Knowledge Officer",
      createdAt: now,
      updatedAt: now,
    });

    const ctoDesigId = await ctx.db.insert("designations", {
      name: "CTO",
      code: "CTO",
      reportsTo: ceoDesigId,
      status: "active",
      description: "Chief Technology Officer",
      createdAt: now,
      updatedAt: now,
    });

    const caoDesigId = await ctx.db.insert("designations", {
      name: "CAO",
      code: "CAO",
      reportsTo: ceoDesigId,
      status: "active",
      description: "Chief Administrative Officer",
      createdAt: now,
      updatedAt: now,
    });

    const managerDesigId = await ctx.db.insert("designations", {
      name: "Manager",
      code: "MGR",
      reportsTo: cooDesigId,
      status: "active",
      description: "Department Manager",
      createdAt: now,
      updatedAt: now,
    });

    const staffDesigId = await ctx.db.insert("designations", {
      name: "Staff",
      code: "STF",
      reportsTo: managerDesigId,
      status: "active",
      description: "Staff Member",
      createdAt: now,
      updatedAt: now,
    });

    // Create Branches
    const npBranchId = await ctx.db.insert("branches", {
      name: "NP",
      code: "NP",
      description: "North Province Branch",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const opBranchId = await ctx.db.insert("branches", {
      name: "OP",
      code: "OP",
      description: "Online Platform Branch",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const klBranchId = await ctx.db.insert("branches", {
      name: "KL",
      code: "KL",
      description: "Kerala Branch",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const plBranchId = await ctx.db.insert("branches", {
      name: "PL",
      code: "PL",
      description: "Punjab Branch",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });



    // Create Departments
    const financeDeptId = await ctx.db.insert("departments", {
      name: "Finance",
      code: "FIN",
      branchId: npBranchId,
      description: "Financial Management",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const knowledgeDeptId = await ctx.db.insert("departments", {
      name: "Knowledge",
      code: "KNW",
      branchId: npBranchId,
      description: "Knowledge Management",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const technologyDeptId = await ctx.db.insert("departments", {
      name: "Technology",
      code: "TECH",
      branchId: npBranchId,
      description: "Technology & IT",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const marketingDeptId = await ctx.db.insert("departments", {
      name: "Marketing",
      code: "MKT",
      branchId: npBranchId,
      description: "Marketing & Communications",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const productionDeptId = await ctx.db.insert("departments", {
      name: "Production",
      code: "PROD",
      branchId: npBranchId,
      description: "Content Production",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const adminDeptId = await ctx.db.insert("departments", {
      name: "Administration",
      code: "ADM",
      branchId: npBranchId,
      description: "Administration",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const hrDeptId = await ctx.db.insert("departments", {
      name: "HR & Culture",
      code: "HR",
      branchId: npBranchId,
      description: "Human Resources & Culture",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Create Verticals
    const schoolVerticalId = await ctx.db.insert("verticals", {
      name: "School",
      code: "SCH",
      description: "School Education Vertical",
      createdAt: now,
      updatedAt: now,
    });

    const collegeVerticalId = await ctx.db.insert("verticals", {
      name: "College",
      code: "COL",
      description: "College Education Vertical",
      createdAt: now,
      updatedAt: now,
    });

    const competitiveVerticalId = await ctx.db.insert("verticals", {
      name: "Competitive",
      code: "CMP",
      description: "Competitive Exam Preparation Vertical",
      createdAt: now,
      updatedAt: now,
    });

    const professionalVerticalId = await ctx.db.insert("verticals", {
      name: "Professional",
      code: "PRO",
      description: "Professional Development Vertical",
      createdAt: now,
      updatedAt: now,
    });

    // Create Teams under departments
    const financeTeamId = await ctx.db.insert("teams", {
      name: "Finance Operations",
      code: "FIN-OPS",
      departmentId: financeDeptId,
      description: "Finance Operations Team",
      createdAt: now,
      updatedAt: now,
    });

    const techTeamId = await ctx.db.insert("teams", {
      name: "Engineering",
      code: "TECH-ENG",
      departmentId: technologyDeptId,
      description: "Software Engineering Team",
      createdAt: now,
      updatedAt: now,
    });

    const techInfraId = await ctx.db.insert("teams", {
      name: "Infrastructure",
      code: "TECH-INFRA",
      departmentId: technologyDeptId,
      description: "Infrastructure & DevOps Team",
      createdAt: now,
      updatedAt: now,
    });

    const marketingTeamId = await ctx.db.insert("teams", {
      name: "Brand & Communications",
      code: "MKT-BRAND",
      departmentId: marketingDeptId,
      description: "Brand & Communications Team",
      createdAt: now,
      updatedAt: now,
    });

    const hrTeamId = await ctx.db.insert("teams", {
      name: "Talent Acquisition",
      code: "HR-TA",
      departmentId: hrDeptId,
      description: "Talent Acquisition Team",
      createdAt: now,
      updatedAt: now,
    });

    const knowledgeTeamId = await ctx.db.insert("teams", {
      name: "Content Development",
      code: "KNW-CONTENT",
      departmentId: knowledgeDeptId,
      description: "Content Development Team",
      createdAt: now,
      updatedAt: now,
    });

    // Create Users
    const ceoUser = await ctx.db.insert("users", {
      name: "CEO Veda",
      email: "ceo@vedaedtech.com",
      username: "ceo",
      role: "super_admin",
      isDisabled: false,
      designationId: ceoDesigId,
      departmentId: technologyDeptId,
      branchId: npBranchId,
      employeeCode: "EMP-001",
      employeeId: "EMP-00001",
      employmentType: "Permanent",
      employmentStatus: "active",
      profileCompletion: 65,
      joiningDate: now - 365 * 86400000,
    });

    const ctoUser = await ctx.db.insert("users", {
      name: "CTO Veda",
      email: "cto@vedaedtech.com",
      username: "cto",
      role: "admin",
      isDisabled: false,
      designationId: ctoDesigId,
      departmentId: technologyDeptId,
      branchId: npBranchId,
      employeeCode: "EMP-002",
      employeeId: "EMP-00002",
      employmentType: "Permanent",
      employmentStatus: "active",
      profileCompletion: 55,
      joiningDate: now - 270 * 86400000,
      reportingManagerId: ceoUser,
      teamIds: [techTeamId, techInfraId],
    });

    const cfoUser = await ctx.db.insert("users", {
      name: "CFO Veda",
      email: "cfo@vedaedtech.com",
      username: "cfo",
      role: "admin",
      isDisabled: false,
      designationId: cfoDesigId,
      departmentId: financeDeptId,
      branchId: npBranchId,
      employeeCode: "EMP-003",
      employeeId: "EMP-00003",
      employmentType: "Permanent",
      employmentStatus: "active",
      profileCompletion: 50,
      joiningDate: now - 200 * 86400000,
      reportingManagerId: ceoUser,
      teamIds: [financeTeamId],
    });

    const hrHead = await ctx.db.insert("users", {
      name: "HR Head Veda",
      email: "hr@vedaedtech.com",
      username: "hrhead",
      role: "admin",
      isDisabled: false,
      designationId: caoDesigId,
      departmentId: hrDeptId,
      branchId: npBranchId,
      employeeCode: "EMP-004",
      employeeId: "EMP-00004",
      employmentType: "Permanent",
      employmentStatus: "active",
      profileCompletion: 45,
      joiningDate: now - 180 * 86400000,
      reportingManagerId: ceoUser,
      teamIds: [hrTeamId],
    });

    const staff1 = await ctx.db.insert("users", {
      name: "Arun Kumar",
      email: "arun@vedaedtech.com",
      username: "arun",
      role: "staff",
      isDisabled: false,
      designationId: staffDesigId,
      departmentId: technologyDeptId,
      branchId: npBranchId,
      employeeCode: "EMP-005",
      employeeId: "EMP-00005",
      employmentType: "Permanent",
      employmentStatus: "active",
      profileCompletion: 40,
      joiningDate: now - 120 * 86400000,
      reportingManagerId: ctoUser,
      teamIds: [techTeamId],
    });

    const staff2 = await ctx.db.insert("users", {
      name: "Priya Sharma",
      email: "priya@vedaedtech.com",
      username: "priya",
      role: "staff",
      isDisabled: false,
      designationId: staffDesigId,
      departmentId: marketingDeptId,
      branchId: opBranchId,
      employeeCode: "EMP-006",
      employeeId: "EMP-00006",
      employmentType: "Permanent",
      employmentStatus: "active",
      profileCompletion: 35,
      joiningDate: now - 90 * 86400000,
      reportingManagerId: hrHead,
      teamIds: [marketingTeamId],
    });

    const staff3 = await ctx.db.insert("users", {
      name: "Rajesh Patel",
      email: "rajesh@vedaedtech.com",
      username: "rajesh",
      role: "staff",
      isDisabled: false,
      designationId: staffDesigId,
      departmentId: financeDeptId,
      branchId: npBranchId,
      employeeCode: "EMP-007",
      employeeId: "EMP-00007",
      employmentType: "Contract",
      employmentStatus: "active",
      profileCompletion: 30,
      joiningDate: now - 60 * 86400000,
      reportingManagerId: cfoUser,
      teamIds: [financeTeamId],
    });

    const staff4 = await ctx.db.insert("users", {
      name: "Sneha Gupta",
      email: "sneha@vedaedtech.com",
      username: "sneha",
      role: "manager",
      isDisabled: false,
      designationId: managerDesigId,
      departmentId: knowledgeDeptId,
      branchId: klBranchId,
      employeeCode: "EMP-008",
      employeeId: "EMP-00008",
      employmentType: "Permanent",
      employmentStatus: "active",
      profileCompletion: 50,
      joiningDate: now - 150 * 86400000,
      reportingManagerId: ctoUser,
      teamIds: [knowledgeTeamId],
    });

    // Set team leads
    await ctx.db.patch(techTeamId, { leadId: ctoUser });
    await ctx.db.patch(financeTeamId, { leadId: cfoUser });
    await ctx.db.patch(hrTeamId, { leadId: hrHead });
    await ctx.db.patch(knowledgeTeamId, { leadId: staff4 });

    // Create scopes
    const allUserIds = [ceoUser, ctoUser, cfoUser, hrHead, staff1, staff2, staff3, staff4];
    for (const uid of allUserIds) {
      await ctx.db.insert("userScopes", {
        userId: uid,
        canAccessDashboard: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Create channels
    const generalChannelId = await ctx.db.insert("channels", {
      name: "General",
      description: "General discussion",
      type: "channel",
      createdBy: ceoUser,
      createdAt: now,
      updatedAt: now,
    });

    const announcementsChannelId = await ctx.db.insert("channels", {
      name: "Announcements",
      description: "Company announcements",
      type: "announcement",
      createdBy: ceoUser,
      createdAt: now,
      updatedAt: now,
    });

    const techChannelId = await ctx.db.insert("channels", {
      name: "Technology",
      description: "Tech team discussions",
      type: "channel",
      createdBy: ctoUser,
      createdAt: now,
      updatedAt: now,
    });

    // Add members to channels
    for (const uid of allUserIds) {
      await ctx.db.insert("channelMembers", {
        channelId: generalChannelId,
        userId: uid,
        joinedAt: now,
        lastReadAt: now,
      });
      await ctx.db.insert("channelMembers", {
        channelId: announcementsChannelId,
        userId: uid,
        joinedAt: now,
        lastReadAt: now,
      });
    }

    for (const uid of [ctoUser, staff1]) {
      await ctx.db.insert("channelMembers", {
        channelId: techChannelId,
        userId: uid,
        joinedAt: now,
        lastReadAt: now,
      });
    }

    // Create welcome announcement
    await ctx.db.insert("messages", {
      channelId: announcementsChannelId,
      senderId: ceoUser,
      content: "Welcome to EEOS Lite! This is the official announcement channel for Veda EdTech.",
      isPinned: true,
      createdAt: now,
    });

    await ctx.db.insert("messages", {
      channelId: generalChannelId,
      senderId: ceoUser,
      content: "Hello team! Welcome to EEOS Lite - our Executive Enterprise Operating System.",
      createdAt: now + 1000,
    });

    await ctx.db.insert("messages", {
      channelId: generalChannelId,
      senderId: ctoUser,
      content: "Great to be here! Looking forward to building amazing things.",
      createdAt: now + 2000,
    });

    // Create sample task
    const sampleTaskId = await ctx.db.insert("tasks", {
      title: "Set up development environment",
      description: "Initialize the development environment for all team members",
      status: "in_progress",
      priority: "high",
      ownerId: ctoUser,
      assignedTo: staff1,
      departmentId: technologyDeptId,
      teamId: techTeamId,
      dueDate: now + 7 * 24 * 60 * 60 * 1000,
      order: 0,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("taskParticipants", {
      taskId: sampleTaskId,
      userId: ctoUser,
      role: "owner",
      createdAt: now,
    });

    await ctx.db.insert("taskParticipants", {
      taskId: sampleTaskId,
      userId: staff1,
      role: "assignee",
      createdAt: now,
    });

    await ctx.db.insert("taskChecklistItems", {
      taskId: sampleTaskId,
      text: "Install Node.js and package manager",
      completed: true,
      completedBy: staff1,
      completedAt: now + 3600000,
      order: 0,
      createdAt: now,
    });

    await ctx.db.insert("taskChecklistItems", {
      taskId: sampleTaskId,
      text: "Clone the repository",
      completed: true,
      completedBy: staff1,
      completedAt: now + 7200000,
      order: 1,
      createdAt: now,
    });

    await ctx.db.insert("taskChecklistItems", {
      taskId: sampleTaskId,
      text: "Run the application locally",
      completed: false,
      order: 2,
      createdAt: now,
    });

    await ctx.db.insert("taskComments", {
      taskId: sampleTaskId,
      userId: staff1,
      content: "I've completed the installation. Moving to clone the repo.",
      createdAt: now + 3600000,
    });

    await ctx.db.insert("taskComments", {
      taskId: sampleTaskId,
      userId: ctoUser,
      content: "Great progress! Let me know if you face any issues.",
      createdAt: now + 7200000,
    });

    // Create sample notifications
    await ctx.db.insert("notifications", {
      userId: staff1,
      type: "task",
      title: "Task Assigned",
      message: "You have been assigned: 'Set up development environment'",
      referenceId: sampleTaskId,
      referenceType: "task",
      isRead: false,
      createdAt: now,
    });

    await ctx.db.insert("notifications", {
      userId: ctoUser,
      type: "message",
      title: "New Message",
      message: "New message in General from CEO",
      referenceId: generalChannelId,
      referenceType: "channel",
      isRead: false,
      createdAt: now + 1000,
    });

    // Create approval templates
    await ctx.db.insert("approvalTemplates", {
      name: "Standard Approval",
      description: "Two-phase sequential approval process",
      mode: "sequential",
      phases: [
        { name: "Manager Review", order: 0, requiredApprovers: 1 },
        { name: "Director Approval", order: 1, requiredApprovers: 1 },
      ],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("approvalTemplates", {
      name: "Quick Approval",
      description: "Single-phase parallel approval",
      mode: "parallel",
      phases: [
        { name: "Approver Decision", order: 0, requiredApprovers: 2 },
      ],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return {
      seeded: true,
      message: "EEOS Lite seeded successfully",
      users: allUserIds.length,
    };
  },
});

export const seedPasswords = mutation({
  args: {},
  handler: async (ctx) => {
    const ceo = await ctx.db.query("users").withIndex("username", (q) => q.eq("username", "ceo")).first();
    if (ceo?.passwordHash) return { seeded: false };

    const users = await ctx.db.query("users").collect();
    const passwordMap: Record<string, string> = {
      ceo: "admin123",
      cto: "cto123",
      cfo: "cfo123",
      hrhead: "hr123",
      arun: "staff123",
      priya: "staff123",
      rajesh: "staff123",
      sneha: "sneha123",
    };

    for (const user of users) {
      const pw = passwordMap[user.username || ""];
      if (pw) {
        const encoder = new TextEncoder();
        const data = encoder.encode(pw);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        await ctx.db.patch(user._id, { passwordHash: hash });
      }
    }

    return { seeded: true };
  },
});

export const seedCrm = mutation({
  args: {},
  handler: async (ctx) => {
    const existingLeads = await ctx.db.query("leadMaster").take(1);
    if (existingLeads.length > 0) return { seeded: false, message: "CRM already seeded" };

    const users = await ctx.db.query("users").collect();
    const ceo = users.find((u) => u.username === "ceo")!;
    const arun = users.find((u) => u.username === "arun")!;
    const priya = users.find((u) => u.username === "priya")!;
    const sneha = users.find((u) => u.username === "sneha")!;

    const branches = await ctx.db.query("branches").collect();
    const verticals = await ctx.db.query("verticals").collect();
    const npBranch = branches.find((b) => b.code === "NP")!;
    const klBranch = branches.find((b) => b.code === "KL")!;
    const plBranch = branches.find((b) => b.code === "PL")!;
    const opBranch = branches.find((b) => b.code === "OP")!;
    const schoolV = verticals.find((v) => v.code === "SCH")!;
    const collegeV = verticals.find((v) => v.code === "COL")!;
    const compV = verticals.find((v) => v.code === "CMP")!;

    const now = Date.now();
    const day = 86400000;
    const owners = [arun._id, priya._id, sneha._id];
    const stages = ["new", "attempted", "connected", "qualified", "counselling", "interested", "follow_up", "negotiation", "converted", "lost"];

    const leadData = [
      { f: "Aarav", l: "Sharma", ph: "9876543210", em: "aarav.s@email.com", loc: "Delhi", src: "Website", b: npBranch._id, v: schoolV._id, st: "interested", p: "high", rev: 50000, act: "Send brochure", actD: now + 2*day, o: owners[0] },
      { f: "Bhavya", l: "Patel", ph: "9876543211", em: "bhavya.p@email.com", loc: "Mumbai", src: "Referral", b: npBranch._id, v: collegeV._id, st: "qualified", p: "medium", rev: 75000, act: "Schedule counseling", actD: now + 1*day, o: owners[0] },
      { f: "Chirag", l: "Verma", ph: "9876543212", em: "chirag.v@email.com", loc: "Bangalore", src: "Social Media", b: opBranch._id, v: compV._id, st: "new", p: "low", rev: 30000, o: owners[1] },
      { f: "Divya", l: "Reddy", ph: "9876543213", em: "divya.r@email.com", loc: "Hyderabad", src: "Phone Inquiry", b: klBranch._id, v: collegeV._id, st: "counselling", p: "high", rev: 85000, act: "Follow up on course details", actD: now + 3*day, o: owners[1] },
      { f: "Ekta", l: "Singh", ph: "9876543214", em: "ekta.s@email.com", loc: "Chandigarh", src: "Website", b: plBranch._id, v: schoolV._id, st: "attempted", p: "medium", rev: 40000, o: owners[2] },
      { f: "Farhan", l: "Khan", ph: "9876543215", em: "farhan.k@email.com", loc: "Lucknow", src: "Event", b: npBranch._id, v: compV._id, st: "negotiation", p: "critical", rev: 120000, act: "Send offer letter", actD: now + 1*day, o: owners[0] },
      { f: "Gauri", l: "Joshi", ph: "9876543216", em: "gauri.j@email.com", loc: "Pune", src: "Referral", b: opBranch._id, v: collegeV._id, st: "follow_up", p: "medium", rev: 65000, act: "Send reminders", actD: now + 4*day, o: owners[1] },
      { f: "Harsh", l: "Mehta", ph: "9876543217", em: "harsh.m@email.com", loc: "Ahmedabad", src: "Social Media", b: klBranch._id, v: schoolV._id, st: "connected", p: "low", rev: 35000, o: owners[2] },
      { f: "Isha", l: "Agarwal", ph: "9876543218", em: "isha.a@email.com", loc: "Jaipur", src: "Email Campaign", b: plBranch._id, v: collegeV._id, st: "qualified", p: "high", rev: 90000, act: "Share testimonials", actD: now + 2*day, o: owners[0] },
      { f: "Jay", l: "Desai", ph: "9876543219", em: "jay.d@email.com", loc: "Surat", src: "Walk-in", b: npBranch._id, v: compV._id, st: "counselling", p: "medium", rev: 55000, act: "Demo class", actD: now + 5*day, o: owners[1] },
      { f: "Kavya", l: "Nair", ph: "9876543220", em: "kavya.n@email.com", loc: "Kochi", src: "Website", b: klBranch._id, v: schoolV._id, st: "interested", p: "high", rev: 45000, act: "Call to confirm", actD: now + 1*day, o: owners[2] },
      { f: "Laksh", l: "Rao", ph: "9876543221", em: "laksh.r@email.com", loc: "Chennai", src: "Partner", b: opBranch._id, v: collegeV._id, st: "follow_up", p: "medium", rev: 70000, act: "Payment plan discussion", actD: now + 3*day, o: owners[0] },
      { f: "Maya", l: "Kaur", ph: "9876543222", em: "maya.k@email.com", loc: "Amritsar", src: "Phone Inquiry", b: plBranch._id, v: compV._id, st: "new", p: "low", rev: 25000, o: owners[1] },
      { f: "Nikhil", l: "Bose", ph: "9876543223", em: "nikhil.b@email.com", loc: "Kolkata", src: "Social Media", b: npBranch._id, v: schoolV._id, st: "attempted", p: "medium", rev: 38000, o: owners[2] },
      { f: "Ojas", l: "Chopra", ph: "9876543224", em: "ojas.c@email.com", loc: "Nagpur", src: "Referral", b: klBranch._id, v: collegeV._id, st: "connected", p: "high", rev: 80000, act: "Schedule visit", actD: now + 6*day, o: owners[0] },
      { f: "Priyanka", l: "Gupta", ph: "9876543225", em: "priyanka.g@email.com", loc: "Indore", src: "Email Campaign", b: opBranch._id, v: compV._id, st: "interested", p: "critical", rev: 110000, act: "Close deal", actD: now + 2*day, o: owners[1], tag: "hot" },
      { f: "Rohan", l: "Saxena", ph: "9876543226", em: "rohan.s@email.com", loc: "Bhopal", src: "Website", b: npBranch._id, v: collegeV._id, st: "negotiation", p: "high", rev: 95000, act: "Finalize fee", actD: now + 1*day, o: owners[2] },
      { f: "Sanya", l: "Malik", ph: "9876543227", em: "sanya.m@email.com", loc: "Dehradun", src: "Walk-in", b: plBranch._id, v: schoolV._id, st: "qualified", p: "medium", rev: 42000, act: "Send prospectus", actD: now + 4*day, o: owners[0] },
      { f: "Tanvi", l: "Shah", ph: "9876543228", em: "tanvi.s@email.com", loc: "Vadodara", src: "Event", b: opBranch._id, v: compV._id, st: "counselling", p: "high", rev: 60000, act: "Mock test followup", actD: now + 3*day, o: owners[1] },
      { f: "Utkarsh", l: "Pandey", ph: "9876543229", em: "utkarsh.p@email.com", loc: "Patna", src: "Referral", b: npBranch._id, v: collegeV._id, st: "lost", p: "low", rev: 0, o: owners[2], stat: "lost" },
      { f: "Vandana", l: "Tiwari", ph: "9876543230", em: "vandana.t@email.com", loc: "Ranchi", src: "Phone Inquiry", b: klBranch._id, v: schoolV._id, st: "converted", p: "medium", rev: 50000, o: owners[0], stat: "converted" },
      { f: "Yash", l: "Arora", ph: "9876543231", em: "yash.a@email.com", loc: "Jalandhar", src: "Social Media", b: plBranch._id, v: compV._id, st: "new", p: "low", rev: 28000, o: owners[1] },
      { f: "Zara", l: "Qureshi", ph: "9876543232", em: "zara.q@email.com", loc: "Srinagar", src: "Website", b: npBranch._id, v: collegeV._id, st: "follow_up", p: "high", rev: 72000, act: "Reminder call", actD: now + 2*day, o: owners[2] },
      { f: "Amit", l: "Kohli", ph: "9876543233", em: "amit.k@email.com", loc: "Chandigarh", src: "Partner", b: opBranch._id, v: schoolV._id, st: "negotiation", p: "critical", rev: 130000, act: "Contract signing", actD: now + 1*day, o: owners[0], tag: "vip" },
      { f: "Neha", l: "Bajaj", ph: "9876543234", em: "neha.b@email.com", loc: "Mumbai", src: "Email Campaign", b: klBranch._id, v: collegeV._id, st: "lost", p: "medium", rev: 0, o: owners[1], stat: "lost" },
    ];

    for (const d of leadData) {
      const leadId = await ctx.db.insert("leadMaster", {
        firstName: d.f,
        lastName: d.l,
        phone: d.ph,
        email: d.em || undefined,
        location: d.loc || undefined,
        source: d.src || undefined,
        branchInterestId: d.b || undefined,
        verticalId: d.v || undefined,
        stage: d.st,
        priority: d.p as any,
        ownerId: d.o || undefined,
        expectedRevenue: d.rev || undefined,
        nextAction: d.act || undefined,
        nextActionDate: d.actD || undefined,
        tags: d.tag ? [d.tag] : undefined,
        status: (d.stat || "active") as "active" | "converted" | "lost" | "archived",
        createdBy: ceo._id,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("leadStageHistory", {
        leadId,
        fromStage: undefined,
        toStage: d.st,
        changedBy: ceo._id,
        note: "Initial lead creation",
        createdAt: now,
      });

      await ctx.db.insert("leadActivity", {
        leadId,
        action: "lead_created",
        description: `Lead ${d.f} ${d.l} created from ${d.src || "unknown source"}`,
        userId: ceo._id,
        createdAt: now,
      });

      // Add a note for some leads
      if (d.act) {
        await ctx.db.insert("leadNotes", {
          leadId,
          content: `Next action: ${d.act}${d.actD ? ` (by ${new Date(d.actD).toLocaleDateString()})` : ""}`,
          createdBy: d.o || ceo._id,
          type: "action",
          createdAt: now,
        });
      }

      // Add tasks for upcoming followups
      if (d.actD && d.act) {
        await ctx.db.insert("leadTasks", {
          leadId,
          title: d.act,
          description: `Follow up action for lead ${d.f} ${d.l}`,
          ownerId: d.o || ceo._id,
          assignedTo: d.o || undefined,
          dueDate: d.actD,
          status: "pending",
          priority: d.p as any,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return { seeded: true, message: "25 CRM leads seeded" };
  },
});

export const seedCourses = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("courses").take(1);
    if (existing.length > 0) return { seeded: false, message: "Courses already seeded" };

    const users = await ctx.db.query("users").collect();
    const ceo = users.find((u) => u.username === "ceo")!;
    const verticals = await ctx.db.query("verticals").collect();
    const schoolV = verticals.find((v) => v.code === "SCH")!;
    const collegeV = verticals.find((v) => v.code === "COL")!;
    const compV = verticals.find((v) => v.code === "CMP")!;
    const profV = verticals.find((v) => v.code === "PRO")!;

    const now = Date.now();

    // School courses
    await ctx.db.insert("courses", { courseCode: "CBSE-10", courseName: "CBSE Class 10", verticalId: schoolV._id, baseFee: 35000, status: "active", createdBy: ceo._id, createdAt: now, updatedAt: now });
    await ctx.db.insert("courses", { courseCode: "CBSE-12", courseName: "CBSE Class 12", verticalId: schoolV._id, baseFee: 45000, status: "active", createdBy: ceo._id, createdAt: now, updatedAt: now });
    await ctx.db.insert("courses", { courseCode: "ICSE-10", courseName: "ICSE Class 10", verticalId: schoolV._id, baseFee: 40000, status: "active", createdBy: ceo._id, createdAt: now, updatedAt: now });
    await ctx.db.insert("courses", { courseCode: "ICSE-12", courseName: "ICSE Class 12", verticalId: schoolV._id, baseFee: 50000, status: "active", createdBy: ceo._id, createdAt: now, updatedAt: now });

    // College courses
    await ctx.db.insert("courses", { courseCode: "BSC-MATH", courseName: "B.Sc. Mathematics", verticalId: collegeV._id, baseFee: 60000, status: "active", createdBy: ceo._id, createdAt: now, updatedAt: now });
    await ctx.db.insert("courses", { courseCode: "BCOM", courseName: "B.Com", verticalId: collegeV._id, baseFee: 55000, status: "active", createdBy: ceo._id, createdAt: now, updatedAt: now });
    await ctx.db.insert("courses", { courseCode: "BA-ENG", courseName: "B.A. English", verticalId: collegeV._id, baseFee: 50000, status: "active", createdBy: ceo._id, createdAt: now, updatedAt: now });

    // Competitive exam courses
    await ctx.db.insert("courses", { courseCode: "NEET-26", courseName: "NEET 2026", verticalId: compV._id, baseFee: 70000, status: "active", createdBy: ceo._id, createdAt: now, updatedAt: now });
    await ctx.db.insert("courses", { courseCode: "JEE-ADV", courseName: "JEE Advanced", verticalId: compV._id, baseFee: 80000, status: "active", createdBy: ceo._id, createdAt: now, updatedAt: now });
    await ctx.db.insert("courses", { courseCode: "JEE-MAIN", courseName: "JEE Main", verticalId: compV._id, baseFee: 65000, status: "active", createdBy: ceo._id, createdAt: now, updatedAt: now });
    await ctx.db.insert("courses", { courseCode: "UPSC-CSE", courseName: "UPSC Civil Services", verticalId: compV._id, baseFee: 120000, status: "active", createdBy: ceo._id, createdAt: now, updatedAt: now });
    await ctx.db.insert("courses", { courseCode: "CA-FOUND", courseName: "CA Foundation", verticalId: compV._id, baseFee: 55000, status: "active", createdBy: ceo._id, createdAt: now, updatedAt: now });

    // Professional courses
    await ctx.db.insert("courses", { courseCode: "DIGI-MKT", courseName: "Digital Marketing", verticalId: profV._id, baseFee: 40000, status: "active", createdBy: ceo._id, createdAt: now, updatedAt: now });
    await ctx.db.insert("courses", { courseCode: "DATA-SCI", courseName: "Data Science", verticalId: profV._id, baseFee: 75000, status: "active", createdBy: ceo._id, createdAt: now, updatedAt: now });
    await ctx.db.insert("courses", { courseCode: "FULL-STACK", courseName: "Full Stack Development", verticalId: profV._id, baseFee: 65000, status: "active", createdBy: ceo._id, createdAt: now, updatedAt: now });

    return { seeded: true, message: "17 sample courses seeded" };
  },
});
