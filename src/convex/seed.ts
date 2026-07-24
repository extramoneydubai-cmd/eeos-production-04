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

export const seedRecruitment = mutation({
  args: {},
  handler: async (ctx) => {
    const existingRequisitions = await ctx.db.query("jobRequisitions").take(1);
    if (existingRequisitions.length > 0) return { seeded: false, message: "Recruitment already seeded" };

    const users = await ctx.db.query("users").collect();
    const ceo = users.find((u) => u.username === "ceo")!;
    const cto = users.find((u) => u.username === "cto")!;
    const cfo = users.find((u) => u.username === "cfo")!;
    const hrHead = users.find((u) => u.username === "hrhead")!;
    const sneha = users.find((u) => u.username === "sneha")!;

    const departments = await ctx.db.query("departments").collect();
    const techDept = departments.find((d) => d.code === "TECH")!;
    const financeDept = departments.find((d) => d.code === "FIN")!;
    const marketingDept = departments.find((d) => d.code === "MKT")!;
    const hrDept = departments.find((d) => d.code === "HR")!;

    const branches = await ctx.db.query("branches").collect();
    const npBranch = branches.find((b) => b.code === "NP")!;
    const opBranch = branches.find((b) => b.code === "OP")!;
    const klBranch = branches.find((b) => b.code === "KL")!;

    const designations = await ctx.db.query("designations").collect();
    const staffDesig = designations.find((d) => d.code === "STF")!;
    const mgrDesig = designations.find((d) => d.code === "MGR")!;

    const now = Date.now();
    const day = 86400000;

    // ─── JOB REQUISITIONS ───

    const req1 = await ctx.db.insert("jobRequisitions", {
      departmentId: techDept._id,
      designationId: staffDesig._id,
      companyId: undefined,
      branchId: npBranch._id,
      requestedBy: cto._id,
      vacancies: 3,
      employmentType: "permanent",
      salaryRange: "₹8L - ₹15L",
      description: "Hiring senior software engineers for the Engineering team to build and maintain our EdTech platform.",
      status: "approved",
      createdAt: now - 30 * day,
      updatedAt: now - 25 * day,
    });

    const req2 = await ctx.db.insert("jobRequisitions", {
      departmentId: financeDept._id,
      designationId: staffDesig._id,
      companyId: undefined,
      branchId: npBranch._id,
      requestedBy: cfo._id,
      vacancies: 2,
      employmentType: "permanent",
      salaryRange: "₹5L - ₹9L",
      description: "Hiring an Accountant and a Financial Analyst for the Finance Operations team.",
      status: "approved",
      createdAt: now - 20 * day,
      updatedAt: now - 18 * day,
    });

    const req3 = await ctx.db.insert("jobRequisitions", {
      departmentId: marketingDept._id,
      designationId: mgrDesig._id,
      companyId: undefined,
      branchId: opBranch._id,
      requestedBy: hrHead._id,
      vacancies: 1,
      employmentType: "permanent",
      salaryRange: "₹10L - ₹16L",
      description: "Hiring a Marketing Manager to lead brand strategy and digital marketing initiatives.",
      status: "pending_approval",
      createdAt: now - 5 * day,
      updatedAt: now - 5 * day,
    });

    const req4 = await ctx.db.insert("jobRequisitions", {
      departmentId: techDept._id,
      designationId: staffDesig._id,
      companyId: undefined,
      branchId: npBranch._id,
      requestedBy: cto._id,
      vacancies: 2,
      employmentType: "contract",
      salaryRange: "₹4L - ₹7L",
      description: "Hiring QA Engineers for a 6-month contract to test the upcoming product release.",
      status: "draft",
      createdAt: now - 2 * day,
      updatedAt: now - 2 * day,
    });

    // ─── JOB POSTINGS ───

    const posting1 = await ctx.db.insert("jobPostings", {
      requisitionId: req1,
      title: "Senior Software Engineer",
      description: "We are looking for a Senior Software Engineer to join our Engineering team. You will work on building scalable EdTech solutions using React, TypeScript, and Node.js.",
      skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS"],
      locations: ["NP - North Province", "OP - Online"],
      applicationDeadline: now + 15 * day,
      status: "published",
      createdAt: now - 25 * day,
      updatedAt: now - 25 * day,
    });

    const posting2 = await ctx.db.insert("jobPostings", {
      requisitionId: req1,
      title: "Software Engineer (Frontend)",
      description: "Join our frontend team to build beautiful, responsive user interfaces for our learning management system.",
      skills: ["React", "TypeScript", "Tailwind CSS", "Next.js"],
      locations: ["NP - North Province"],
      applicationDeadline: now + 20 * day,
      status: "published",
      createdAt: now - 25 * day,
      updatedAt: now - 25 * day,
    });

    const posting3 = await ctx.db.insert("jobPostings", {
      requisitionId: req2,
      title: "Accountant",
      description: "Manage day-to-day accounting operations, GST returns, and financial reporting for the organization.",
      skills: ["Tally", "GST", "MS Excel", "Financial Reporting"],
      locations: ["NP - North Province"],
      applicationDeadline: now + 25 * day,
      status: "published",
      createdAt: now - 18 * day,
      updatedAt: now - 18 * day,
    });

    // ─── CANDIDATES ───

    const candidateData = [
      { f: "Ananya", l: "Verma", src: "LinkedIn", pos: "Senior Software Engineer", expSal: 1200000, curSal: 950000, notice: 45, exp: 5, status: "shortlisted" },
      { f: "Rahul", l: "Sharma", src: "Naukri", pos: "Senior Software Engineer", expSal: 1400000, curSal: 1100000, notice: 60, exp: 6, status: "interview_scheduled" },
      { f: "Priya", l: "Mehta", src: "Referral", pos: "Software Engineer (Frontend)", expSal: 900000, curSal: 700000, notice: 30, exp: 3, status: "applied" },
      { f: "Vikram", l: "Singh", src: "LinkedIn", pos: "Software Engineer (Frontend)", expSal: 850000, curSal: 650000, notice: 30, exp: 2.5, status: "screening" },
      { f: "Neha", l: "Gupta", src: "Company Website", pos: "Accountant", expSal: 600000, curSal: 480000, notice: 30, exp: 4, status: "offer_pending" },
      { f: "Amit", l: "Joshi", src: "Referral", pos: "Accountant", expSal: 550000, curSal: 420000, notice: 15, exp: 3, status: "interview_completed" },
      { f: "Deepika", l: "Nair", src: "LinkedIn", pos: "Senior Software Engineer", expSal: 1300000, curSal: 1000000, notice: 90, exp: 7, status: "assessment" },
      { f: "Karan", l: "Patel", src: "Naukri", pos: "Software Engineer (Frontend)", expSal: 750000, curSal: 550000, notice: 30, exp: 1.5, status: "rejected" },
    ];

    const candidateIds: any[] = [];

    for (const d of candidateData) {
      const cId = await ctx.db.insert("candidates", {
        personId: undefined,
        jobPostingId: d.pos.includes("Senior") ? posting1 : d.pos.includes("Frontend") ? posting2 : posting3,
        source: d.src,
        appliedPosition: d.pos,
        expectedSalary: d.expSal,
        currentSalary: d.curSal,
        noticePeriod: d.notice,
        experience: d.exp,
        resumeUrl: undefined,
        status: d.status as any,
        rejectionReason: d.status === "rejected" ? "Skills mismatch for current requirements" : undefined,
        createdAt: now - (15 + Math.floor(Math.random() * 10)) * day,
        updatedAt: now - 5 * day,
      });
      candidateIds.push(cId);

      // Create timeline events
      await ctx.db.insert("recruitmentTimeline", {
        candidateId: cId,
        eventType: "status_change",
        previousStatus: "applied",
        newStatus: d.status,
        changedBy: hrHead._id,
        note: `Candidate ${d.status === "rejected" ? "rejected after initial review" : "progressed to " + d.status.replace("_", " ")}`,
        createdAt: now - 5 * day,
      });
    }

    // ─── INTERVIEWS ───

    // Interview for Rahul (Senior SE - shortlisted)
    const int1 = await ctx.db.insert("interviewRounds", {
      candidateId: candidateIds[1],
      roundName: "Technical Round 1",
      interviewerIds: [cto._id],
      schedule: now + 3 * day,
      mode: "video",
      duration: 60,
      result: "scheduled",
      score: undefined,
      remarks: undefined,
      createdAt: now - 2 * day,
      updatedAt: now - 2 * day,
    });

    // Completed interview for Amit (Accountant)
    const int2 = await ctx.db.insert("interviewRounds", {
      candidateId: candidateIds[5],
      roundName: "Technical Assessment",
      interviewerIds: [cfo._id],
      schedule: now - 3 * day,
      mode: "in_person",
      duration: 45,
      result: "completed",
      score: 82,
      remarks: "Good understanding of accounting principles. Recommended for next round.",
      createdAt: now - 10 * day,
      updatedAt: now - 3 * day,
    });

    const int3 = await ctx.db.insert("interviewRounds", {
      candidateId: candidateIds[5],
      roundName: "HR Round",
      interviewerIds: [hrHead._id],
      schedule: now - 1 * day,
      mode: "video",
      duration: 30,
      result: "completed",
      score: 90,
      remarks: "Excellent communication. Salary expectations aligned.",
      createdAt: now - 5 * day,
      updatedAt: now - 1 * day,
    });

    // Interview for Ananya (Senior SE - shortlisted)
    const int4 = await ctx.db.insert("interviewRounds", {
      candidateId: candidateIds[0],
      roundName: "Technical Round",
      interviewerIds: [cto._id, sneha._id],
      schedule: now - 7 * day,
      mode: "video",
      duration: 60,
      result: "completed",
      score: 88,
      remarks: "Strong technical skills. Good system design knowledge.",
      createdAt: now - 15 * day,
      updatedAt: now - 7 * day,
    });

    const int5 = await ctx.db.insert("interviewRounds", {
      candidateId: candidateIds[0],
      roundName: "Manager Round",
      interviewerIds: [cto._id],
      schedule: now - 3 * day,
      mode: "in_person",
      duration: 45,
      result: "completed",
      score: 85,
      remarks: "Cultural fit excellent. Ready for offer.",
      createdAt: now - 8 * day,
      updatedAt: now - 3 * day,
    });

    // ─── ASSESSMENTS ───

    // Assessment for Deepika (Senior SE - assessment stage)
    await ctx.db.insert("assessments", {
      candidateId: candidateIds[6],
      assessmentType: "coding_challenge",
      score: 75,
      maxScore: 100,
      evaluator: cto._id,
      result: "pending",
      remarks: "Submitted on time. Code quality under review.",
      createdAt: now - 3 * day,
    });

    // Assessment for Ananya
    await ctx.db.insert("assessments", {
      candidateId: candidateIds[0],
      assessmentType: "technical_test",
      score: 92,
      maxScore: 100,
      evaluator: cto._id,
      result: "pass",
      remarks: "Excellent problem-solving skills.",
      createdAt: now - 12 * day,
    });

    // Assessment for Neha (Accountant - offer pending)
    await ctx.db.insert("assessments", {
      candidateId: candidateIds[4],
      assessmentType: "practical_test",
      score: 85,
      maxScore: 100,
      evaluator: cfo._id,
      result: "pass",
      remarks: "Good practical knowledge of Tally and GST filing.",
      createdAt: now - 10 * day,
    });

    // ─── OFFERS ───

    // Offer for Ananya
    await ctx.db.insert("offers", {
      candidateId: candidateIds[0],
      offeredSalary: 1250000,
      joiningDate: now + 30 * day,
      offerLetter: undefined,
      status: "accepted",
      approvedBy: ceo._id,
      notes: "Accepted verbally. Offer letter sent.",
      createdAt: now - 2 * day,
      updatedAt: now - 1 * day,
    });

    // Offer for Neha
    await ctx.db.insert("offers", {
      candidateId: candidateIds[4],
      offeredSalary: 650000,
      joiningDate: now + 20 * day,
      offerLetter: undefined,
      status: "pending_approval",
      approvedBy: undefined,
      notes: "Awaiting CFO approval on budget.",
      createdAt: now - 1 * day,
      updatedAt: now - 1 * day,
    });

    // ─── ONBOARDING TASKS ───

    // Create a dummy employee ID reference for the hired candidate
    const hiredCandId = candidateIds[0]; // Ananya - offer accepted

    const onboardingItems = [
      "Complete HR documentation and forms",
      "Set up email and system access",
      "IT equipment allocation (laptop, monitor)",
      "Introduction to team members",
      "Review onboarding handbook",
      "Complete mandatory compliance training",
      "Set up development environment",
      "Schedule 30-60-90 day check-ins",
    ];

    for (let i = 0; i < onboardingItems.length; i++) {
      await ctx.db.insert("onboardingTasks", {
        employeeId: undefined,
        candidateId: hiredCandId,
        checklistItem: onboardingItems[i],
        assignedTo: i < 3 ? hrHead._id : cto._id,
        dueDate: now + (i < 3 ? 5 : 10) * day,
        completed: i < 2,
        completedAt: i < 2 ? now + (i + 1) * day : undefined,
        notes: i === 0 ? "Documents submitted" : undefined,
        createdAt: now,
      });
    }

    return {
      seeded: true,
      message: "Recruitment data seeded successfully",
      stats: {
        requisitions: 4,
        postings: 3,
        candidates: candidateData.length,
        interviews: 5,
        assessments: 3,
        offers: 2,
        onboardingTasks: onboardingItems.length,
      },
    };
  },
});

// ══════════════════════════════════════════════════════════
// SEED: FINANCE & ACCOUNTING
// ══════════════════════════════════════════════════════════

export const seedFinance = mutation({
  handler: async (ctx) => {
    const existingFees = await ctx.db.query("feeStructures").collect();
    if (existingFees.length > 0) return { seeded: false, message: "Finance data already exists" };

    const users = await ctx.db.query("users").collect();
    const admin = users.find((u: any) => u.role === "super_admin") || users[0];
    if (!admin) return { seeded: false, message: "No admin user found" };

    const courses = await ctx.db.query("courses").collect();
    const students = await ctx.db.query("studentMaster").collect();
    const now = Date.now();

    // Fee Structures
    const tuitionFee = await ctx.db.insert("feeStructures", {
      name: "Tuition Fee - Standard", description: "Standard tuition for all courses", amount: 75000,
      isRecurring: true, frequency: "yearly", isOptional: false, isRefundable: false,
      isActive: true, createdBy: admin._id,
    });

    const labFee = await ctx.db.insert("feeStructures", {
      name: "Lab Fee", amount: 15000, isRecurring: true, frequency: "half_yearly",
      isOptional: false, isRefundable: false, isActive: true, createdBy: admin._id,
    });

    const libraryFee = await ctx.db.insert("feeStructures", {
      name: "Library Fee", amount: 5000, isRecurring: true, frequency: "yearly",
      isOptional: false, isRefundable: false, isActive: true, createdBy: admin._id,
    });

    // Discounts
    await ctx.db.insert("feeDiscounts", {
      name: "Early Bird Discount", code: "EARLY10", discountType: "percentage", value: 10,
      maxAmount: 10000, isActive: true, currentApplications: 0, createdBy: admin._id,
    });
    await ctx.db.insert("feeDiscounts", {
      name: "Sibling Discount", code: "SIBLING15", discountType: "percentage", value: 15,
      maxAmount: 15000, isActive: true, currentApplications: 0, createdBy: admin._id,
    });

    // Student Fee Accounts & Invoices
    for (let i = 0; i < Math.min(students.length, 5); i++) {
      const student = students[i];
      const totalFee = 95000 + (i * 5000);
      const accountId = await ctx.db.insert("studentFeeAccounts", {
        studentId: student._id, totalFee, totalPaid: i === 0 ? totalFee : 25000,
        outstandingBalance: i === 0 ? 0 : totalFee - 25000,
        totalDiscount: 0, totalScholarship: 0, totalWaiver: 0,
        installmentsCount: 4, installmentFrequency: "quarterly",
        status: i === 0 ? "active" : "active", createdBy: admin._id,
      });

      if (i === 0) {
        await ctx.db.insert("feeInstallments", {
          studentId: student._id, feeAccountId: accountId, installmentNumber: 1, totalInstallments: 4,
          amount: totalFee / 4, paidAmount: totalFee / 4, lateFee: 0,
          dueDate: now - 60 * day, paidDate: now - 55 * day, status: "paid",
        });
      }
      await ctx.db.insert("feeInstallments", {
        studentId: student._id, feeAccountId: accountId, installmentNumber: i === 0 ? 2 : 1,
        totalInstallments: 4, amount: totalFee / 4, paidAmount: i === 0 ? totalFee / 4 : 0,
        lateFee: i === 2 ? 500 : 0, dueDate: now + 15 * day, status: i === 0 ? "paid" : (i === 2 ? "overdue" : "pending"),
      });

      // Invoice
      const invoice = await ctx.db.insert("feeInvoices", {
        invoiceNumber: `INV-${String(1000 + i).padStart(6, "0")}`,
        studentId: student._id, feeAccountId: accountId, invoiceDate: now - 30 * day, dueDate: now + 15 * day,
        lineItems: JSON.stringify([{ index: 1, description: "Tuition Fee", amount: totalFee, total: totalFee }]),
        subtotal: totalFee, discountAmount: 0, taxAmount: 0, totalAmount: totalFee,
        paidAmount: i === 0 ? totalFee : 25000, balanceDue: i === 0 ? 0 : totalFee - 25000,
        status: i === 0 ? "paid" : "partial", createdBy: admin._id,
      });

      // Payment transactions
      if (i <= 1) {
        await ctx.db.insert("paymentTransactions", {
          transactionNumber: `TXN-${String(Date.now()).slice(-6)}${i}`,
          studentId: student._id, feeAccountId: accountId, invoiceId: invoice,
          paymentMethod: i === 0 ? "bank_transfer" : "cash",
          paymentDate: i === 0 ? now - 55 * day : now - 10 * day,
          amount: i === 0 ? totalFee : 25000, status: "verified", createdBy: admin._id,
        });
      }
    }

    return { seeded: true, message: "Finance data seeded successfully", stats: { feeStructures: 3, discounts: 2, accounts: Math.min(students.length, 5) } };
  },
});

// ══════════════════════════════════════════════════════════
// SEED: EXAMINATIONS
// ══════════════════════════════════════════════════════════

export const seedExams = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("examTemplates").collect();
    if (existing.length > 0) return { seeded: false, message: "Exam data already exists" };

    const users = await ctx.db.query("users").collect();
    const admin = users.find((u: any) => u.role === "super_admin") || users[0];
    const faculty = users.find((u: any) => u.role === "staff") || admin;
    if (!admin) return { seeded: false, message: "No admin user found" };

    const sessions = await ctx.db.query("academicSessions").collect();
    const subjects = await ctx.db.query("academicSubjects").collect();
    const branches = await ctx.db.query("branches").collect();
    const now = Date.now();

    const sessionId = sessions[0]?._id;
    const branchId = branches[0]?._id;
    const subj1 = subjects[0]?._id;
    const subj2 = subjects[1]?._id;

    // Exam Templates
    const midTerm = await ctx.db.insert("examTemplates", {
      name: "Mid Term Examination", code: "MID-2026", examType: "mid_term",
      description: "Standard mid-term examination", maxMarks: 100, passPercentage: 35,
      isActive: true, createdAt: now, updatedAt: now,
    });
    const finalExam = await ctx.db.insert("examTemplates", {
      name: "Final Examination", code: "FINAL-2026", examType: "final_exam",
      description: "End of year final examination", duration: 180, maxMarks: 100, passPercentage: 35,
      isActive: true, createdAt: now, updatedAt: now,
    });
    const practical = await ctx.db.insert("examTemplates", {
      name: "Practical Examination", code: "PRAC-2026", examType: "practical",
      maxMarks: 50, passPercentage: 40, isActive: true, createdAt: now, updatedAt: now,
    });

    // Exam Sessions
    if (sessionId && branchId) {
      const examSessionId = await ctx.db.insert("examSessions", {
        templateId: midTerm, academicSessionId: sessionId, branchId,
        name: "Mid Term 2026 - Batch A", startDate: now - 45 * day, endDate: now - 40 * day,
        coordinatorId: faculty?._id, totalStudents: 30, status: "published", createdAt: now, updatedAt: now,
      });

      const examSessionId2 = await ctx.db.insert("examSessions", {
        templateId: finalExam, academicSessionId: sessionId, branchId,
        name: "Final Exam 2026 - Batch A", startDate: now + 30 * day, endDate: now + 35 * day,
        coordinatorId: faculty?._id, totalStudents: 30, status: "scheduled", createdAt: now, updatedAt: now,
      });

      // Exam timetable
      if (subj1) {
        await ctx.db.insert("examTimetable", {
          examSessionId: examSessionId, subjectId: subj1, facultyId: faculty?._id,
          examDate: now - 43 * day, startTime: now - 43 * day + 9 * hour, endTime: now - 43 * day + 12 * hour,
          duration: 180, maxMarks: 100, createdAt: now, updatedAt: now,
        });
      }
      if (subj2) {
        await ctx.db.insert("examTimetable", {
          examSessionId: examSessionId, subjectId: subj2, facultyId: faculty?._id,
          examDate: now - 42 * day, startTime: now - 42 * day + 9 * hour, endTime: now - 42 * day + 12 * hour,
          duration: 180, maxMarks: 100, createdAt: now, updatedAt: now,
        });
      }
    }

    return { seeded: true, message: "Exam data seeded successfully", stats: { templates: 3, sessions: 2 } };
  },
});

// ══════════════════════════════════════════════════════════
// SEED: LEARNING MANAGEMENT SYSTEM
// ══════════════════════════════════════════════════════════

export const seedLms = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("lmsCourses").collect();
    if (existing.length > 0) return { seeded: false, message: "LMS data already exists" };

    const users = await ctx.db.query("users").collect();
    const faculty = users.find((u: any) => u.role === "staff") || users[0] || users.find((u: any) => true);
    const admin = users.find((u: any) => u.role === "super_admin") || users[0];
    if (!faculty) return { seeded: false, message: "No faculty user found" };

    const now = Date.now();

    // Courses
    const reactCourse = await ctx.db.insert("lmsCourses", {
      title: "Introduction to React", code: "REACT-101",
      description: "Learn React fundamentals including components, hooks, state management, and routing",
      instructorId: faculty._id, difficulty: "beginner", status: "published",
      totalLessons: 0, enrolledCount: 15, tags: ["frontend", "react", "javascript"],
      createdAt: now - 60 * day, updatedAt: now - 10 * day,
    });

    const nodeCourse = await ctx.db.insert("lmsCourses", {
      title: "Node.js Backend Development", code: "NODE-201",
      description: "Build scalable backend applications with Node.js, Express, and databases",
      instructorId: faculty._id, difficulty: "intermediate", status: "published",
      totalLessons: 0, enrolledCount: 12, tags: ["backend", "nodejs", "api"],
      createdAt: now - 50 * day, updatedAt: now - 5 * day,
    });

    const dataScienceCourse = await ctx.db.insert("lmsCourses", {
      title: "Data Science Fundamentals", code: "DS-301",
      description: "Introduction to data science with Python, statistics, and machine learning",
      instructorId: faculty._id, difficulty: "advanced", status: "draft",
      totalLessons: 0, enrolledCount: 0, tags: ["data-science", "python", "ml"],
      createdAt: now - 10 * day, updatedAt: now,
    });

    // Lessons for React course
    for (let i = 1; i <= 5; i++) {
      const lessonId = await ctx.db.insert("lmsLessons", {
        courseId: reactCourse, title: `Lesson ${i}: ${["JSX & Components", "Props & State", "Hooks Deep Dive", "Event Handling", "Forms & Validation"][i-1]}`,
        orderIndex: i, contentType: i % 2 === 0 ? "video" : "text",
        contentData: `# Lesson ${i}\n\nThis is the content for lesson ${i} of Introduction to React.`,
        duration: 30 + i * 5, isPublished: true, publishedAt: now - (6 - i) * 7 * day,
        createdBy: faculty._id, createdAt: now - 60 * day, updatedAt: now - (6 - i) * 7 * day,
      });

      if (i <= 3) {
        await ctx.db.insert("lmsTopics", {
          lessonId, title: `Topic ${i}.1: Key Concepts`, orderIndex: 1,
          contentType: "text", contentData: `Detailed content for topic ${i}.1`,
          duration: 10, createdAt: now, updatedAt: now,
        });
      }
    }

    // Lessons for Node course
    for (let i = 1; i <= 3; i++) {
      await ctx.db.insert("lmsLessons", {
        courseId: nodeCourse, title: `Module ${i}: ${["Express.js", "Database Integration", "REST API Design"][i-1]}`,
        orderIndex: i, contentType: "video",
        contentData: `# Module ${i} content`,
        duration: 45, isPublished: i <= 2,
        createdBy: faculty._id, createdAt: now - 50 * day, updatedAt: now,
      });
    }

    // Update lesson counts
    const reactLessons = await ctx.db.query("lmsLessons").withIndex("courseId", (q:any) => q.eq("courseId", reactCourse)).collect();
    await ctx.db.patch(reactCourse, { totalLessons: reactLessons.length, updatedAt: now });
    const nodeLessons = await ctx.db.query("lmsLessons").withIndex("courseId", (q:any) => q.eq("courseId", nodeCourse)).collect();
    await ctx.db.patch(nodeCourse, { totalLessons: nodeLessons.length, updatedAt: now });

    // Announcements
    await ctx.db.insert("lmsAnnouncements", {
      courseId: reactCourse, title: "Welcome to React Course",
      content: "Welcome everyone! Please go through the first lesson before our live session.",
      createdBy: faculty._id, priority: "important", createdAt: now - 55 * day, updatedAt: now - 55 * day,
    });

    return { seeded: true, message: "LMS data seeded successfully", stats: { courses: 3, lessons: 8 } };
  },
});

// ══════════════════════════════════════════════════════════
// SEED: INVENTORY
// ══════════════════════════════════════════════════════════

export const seedInventory = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("inventoryItems").collect();
    if (existing.length > 0) return { seeded: false, message: "Inventory data already exists" };

    const users = await ctx.db.query("users").collect();
    const admin = users.find((u: any) => u.role === "super_admin") || users[0];
    const branches = await ctx.db.query("branches").collect();
    const branchId = branches[0]?._id;

    if (!admin || !branchId) return { seeded: false, message: "Missing admin or branch" };

    const now = Date.now();

    // Categories
    const electronics = await ctx.db.insert("inventoryCategories", {
      name: "Electronics", code: "ELEC", description: "Electronic items and gadgets", isActive: true, createdAt: now, updatedAt: now,
    });
    const furniture = await ctx.db.insert("inventoryCategories", {
      name: "Furniture", code: "FURN", description: "Office and classroom furniture", isActive: true, createdAt: now, updatedAt: now,
    });
    const stationery = await ctx.db.insert("inventoryCategories", {
      name: "Stationery", code: "STAT", description: "Office supplies and stationery", isActive: true, createdAt: now, updatedAt: now,
    });

    // Warehouse
    const mainWarehouse = await ctx.db.insert("warehouses", {
      name: "Main Warehouse", code: "WH-MAIN", branchId, location: "Ground Floor", type: "warehouse", isActive: true, createdAt: now, updatedAt: now,
    });

    // Items
    const items = [
      { sku: "LAP-001", name: "Laptop - Dell Latitude 5420", categoryId: electronics, unit: "pcs", unitPrice: 65000, minStock: 5, maxStock: 50, reorderLevel: 10, currentStock: 25 },
      { sku: "MNT-001", name: "Monitor - 24 inch Dell", categoryId: electronics, unit: "pcs", unitPrice: 15000, minStock: 5, maxStock: 30, reorderLevel: 8, currentStock: 3 },
      { sku: "PRJ-001", name: "Projector - Epson EB-2055", categoryId: electronics, unit: "pcs", unitPrice: 45000, minStock: 2, maxStock: 10, reorderLevel: 3, currentStock: 2 },
      { sku: "CHR-001", name: "Office Chair - Ergonomic", categoryId: furniture, unit: "pcs", unitPrice: 12000, minStock: 10, maxStock: 100, reorderLevel: 20, currentStock: 45 },
      { sku: "TBL-001", name: "Classroom Table - 6 seater", categoryId: furniture, unit: "pcs", unitPrice: 18000, minStock: 5, maxStock: 40, reorderLevel: 10, currentStock: 0 },
      { sku: "PEN-001", name: "Whiteboard Markers (box)", categoryId: stationery, unit: "box", unitPrice: 350, minStock: 20, maxStock: 200, reorderLevel: 50, currentStock: 12 },
      { sku: "PAP-001", name: "A4 Paper (ream)", categoryId: stationery, unit: "ream", unitPrice: 500, minStock: 50, maxStock: 500, reorderLevel: 100, currentStock: 75 },
    ];

    for (const item of items) {
      const itemId = await ctx.db.insert("inventoryItems", {
        ...item, warehouseId: mainWarehouse, isActive: true, createdBy: admin._id, createdAt: now, updatedAt: now,
      });
      await ctx.db.insert("stockMovements", {
        itemId, warehouseId: mainWarehouse, movementType: "purchase_receipt",
        quantity: item.currentStock, balanceBefore: 0, balanceAfter: item.currentStock,
        referenceType: "initial_stock", performedBy: admin._id, createdAt: now - 30 * day,
      });
    }

    return { seeded: true, message: "Inventory data seeded successfully", stats: { categories: 3, warehouses: 1, items: items.length } };
  },
});

// ══════════════════════════════════════════════════════════
// SEED: PROCUREMENT
// ══════════════════════════════════════════════════════════

export const seedProcurement = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("vendorMaster").collect();
    if (existing.length > 0) return { seeded: false, message: "Procurement data already exists" };

    const users = await ctx.db.query("users").collect();
    const admin = users.find((u: any) => u.role === "super_admin") || users[0];
    const departments = await ctx.db.query("departments").collect();
    const dept = departments[0];
    if (!admin) return { seeded: false, message: "No admin user found" };

    const now = Date.now();

    // Vendors
    const vendor1 = await ctx.db.insert("vendorMaster", {
      vendorName: "TechMart Solutions", vendorCode: "V-TM-001",
      contactPerson: "Rajesh Kumar", email: "rajesh@techmart.com", phone: "+91-9876543210",
      gstNumber: "GSTIN-27AABCU1234", paymentTerms: "Net 30", leadTime: 7, rating: 4,
      status: "active", createdBy: admin._id, createdAt: now - 60 * day, updatedAt: now,
    });
    const vendor2 = await ctx.db.insert("vendorMaster", {
      vendorName: "OfficePro Supplies", vendorCode: "V-OP-001",
      contactPerson: "Priya Sharma", email: "priya@officepro.com", phone: "+91-9876543211",
      gstNumber: "GSTIN-27AABCU5678", paymentTerms: "Net 15", leadTime: 3, rating: 5,
      status: "active", createdBy: admin._id, createdAt: now - 45 * day, updatedAt: now,
    });

    // Purchase Requisition
    const prItems = [
      { itemName: "Office Chairs", quantity: 20, estimatedUnitPrice: 12000, totalEstimated: 240000 },
      { itemName: "Whiteboard Markers", quantity: 50, estimatedUnitPrice: 350, totalEstimated: 17500 },
    ];
    const totalEst = prItems.reduce((s, i) => s + i.totalEstimated, 0);

    const reqId = await ctx.db.insert("purchaseRequisitions", {
      requisitionNumber: "PR-000001", departmentId: dept?._id, requestedBy: admin._id,
      priority: "high", status: "approved", totalEstimated: totalEst,
      createdAt: now - 30 * day, updatedAt: now - 25 * day,
    });
    for (const item of prItems) {
      await ctx.db.insert("requisitionItems", {
        requisitionId: reqId, itemName: item.itemName, quantity: item.quantity,
        estimatedUnitPrice: item.estimatedUnitPrice, totalEstimated: item.totalEstimated,
        createdAt: now - 30 * day,
      });
    }

    // Purchase Order
    const poId = await ctx.db.insert("purchaseOrders", {
      poNumber: "PO-000001", requisitionId: reqId, vendorId: vendor1,
      orderDate: now - 25 * day, expectedDelivery: now + 5 * day,
      subtotal: 257500, taxAmount: 46350, totalAmount: 303850,
      status: "approved", createdBy: admin._id, createdAt: now - 25 * day, updatedAt: now - 20 * day,
    });
    for (const item of prItems) {
      await ctx.db.insert("purchaseOrderItems", {
        poId, itemName: item.itemName, quantity: item.quantity,
        unitPrice: item.estimatedUnitPrice, totalPrice: item.totalEstimated,
        receivedQuantity: 0, createdAt: now - 25 * day,
      });
    }

    return { seeded: true, message: "Procurement data seeded successfully", stats: { vendors: 2, requisitions: 1, purchaseOrders: 1 } };
  },
});

// ══════════════════════════════════════════════════════════
// SEED: ALL MODULES
// ══════════════════════════════════════════════════════════

import { internalMutation } from "./_generated/server";

export const seedAll = internalMutation({
  handler: async (ctx) => {
    const results: Record<string, any> = {};

    const modules = [
      { name: "finance", fn: seedFinance },
      { name: "exams", fn: seedExams },
      { name: "lms", fn: seedLms },
      { name: "inventory", fn: seedInventory },
      { name: "procurement", fn: seedProcurement },
    ];

    for (const mod of modules) {
      try {
        const result = await mod.fn.handler(ctx, {} as any);
        results[mod.name] = result;
      } catch (err: any) {
        results[mod.name] = { seeded: false, message: err.message };
      }
    }

    return {
      seeded: true,
      message: "All modules seeded",
      results,
    };
  },
});
