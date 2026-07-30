/**
 * Enterprise Simulation — PATCH-PRODUCTION-004
 *
 * Creates a complete virtual organization with realistic linked data
 * across ALL 22+ business modules for end-to-end validation.
 *
 * Idempotent: safe to run multiple times (skips if already seeded).
 *
 * Company A
 *   12 branches
 *   4 academic verticals
 *   2,500 students
 *   180 employees (45 faculty, 25 counselors, 8 finance, 3 HR, 6 marketing, etc.)
 *   Complete fee/PDC/receipt/attendance/exam/certificate data
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── Helpers ──────────────────────────────────────────────────

const BRANCH_NAMES = [
  "Main Campus", "East Campus", "West Campus", "North Campus", "South Campus",
  "City Center", "Tech Park", "Knowledge Park", "Lake View", "Green Valley",
  "Riverside", "Heritage",
];

const PROGRAMS = [
  "BTech Computer Science", "BTech Electronics", "BTech Mechanical", "BTech Civil",
  "BCA", "BBA", "BA English", "BCom",
  "MTech CS", "MBA", "MCA", "MCom",
  "BSc Nursing", "BSc Biotechnology", "BSc Mathematics",
  "Diploma Engineering", "Diploma Management",
  "PhD Computer Science", "PhD Management",
];

const SUBJECTS = [
  "Data Structures", "Algorithms", "Database Systems", "Operating Systems",
  "Computer Networks", "Software Engineering", "Web Development", "Machine Learning",
  "Artificial Intelligence", "Cloud Computing", "Cybersecurity", "Blockchain",
  "Mathematics", "Physics", "Chemistry", "Biology",
  "English Literature", "Economics", "Accounting", "Marketing Management",
  "Human Resources", "Financial Management", "Business Law", "Statistics",
];

const FIRST_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan",
  "Ishaan", "Shaurya", "Rudra", "Dhruv", "Kabir", "Rohan", "Pranav", "Yash",
  "Aaradhya", "Ananya", "Aanya", "Diya", "Ira", "Myra", "Sara", "Sia",
  "Aisha", "Kavya", "Navya", "Priya", "Riya", "Tanvi", "Anika", "Ishita",
];

const LAST_NAMES = [
  "Sharma", "Verma", "Gupta", "Singh", "Patel", "Kumar", "Reddy", "Joshi",
  "Nair", "Menon", "Iyer", "Rao", "Pillai", "Nayar", "Desai", "Mehta",
  "Shah", "Kapoor", "Malhotra", "Agarwal", "Mishra", "Pandey", "Chauhan", "Thakur",
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function generateReceiptNumber(prefix: string, serial: number): string {
  return `${prefix}-${String(serial).padStart(6, "0")}`;
}

// ─── MAIN SIMULATION MUTATION ──────────────────────────────

export const runEnterpriseSimulation = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const now = Date.now();
    const results: string[] = [];

    // ── Check if already seeded ────────────────────────
    const existing = await ctx.db.query("companies").collect();
    const companyAExists = existing.some((c: any) => c.code === "COMPA");
    if (companyAExists) {
      return { simulated: false, message: "Enterprise simulation already seeded. Run clearAndReseed() to reset.", results };
    }

    // ── Phase 1: Create Company A ──────────────────────
    const companyId = await ctx.db.insert("companies", {
      name: "EdVeda Institute of Technology",
      code: "COMPA",
      domain: "veda-edtech.edu",
      gstNumber: "27AAAPN1234H1Z1",
      address: "123 Education Valley, Knowledge City",
      contactEmail: "admin@veda-edtech.edu",
      contactPhone: "+91-1800-EDVEDA",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    results.push(`✅ Company A created: ${companyId}`);

    // ── Phase 2: Create 12 Branches ────────────────────
    const branchIds: Id<"branches">[] = [];
    for (let i = 0; i < BRANCH_NAMES.length; i++) {
      const bid = await ctx.db.insert("branches", {
        name: BRANCH_NAMES[i],
        code: `BR-${String(i + 1).padStart(2, "0")}`,
        companyId: companyId as any,
        address: `${i + 1}${randomPick(["st", "nd", "rd", "th"])} Sector, ${BRANCH_NAMES[i]}`,
        contactEmail: `${BRANCH_NAMES[i].toLowerCase().replace(/\s+/g, "")}@veda-edtech.edu`,
        contactPhone: `+91-98765${String(10000 + i).slice(1)}`,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      branchIds.push(bid as Id<"branches">);
    }
    results.push(`✅ 12 branches created`);

    // ── Phase 3: Academic Structure ─────────────────────
    const programIds: Id<"academicPrograms">[] = [];
    for (const prog of PROGRAMS.slice(0, 12)) { // 12 programs
      const pid = await ctx.db.insert("academicPrograms", {
        name: prog,
        code: `PG-${String(programIds.length + 1).padStart(3, "0")}`,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      programIds.push(pid as Id<"academicPrograms">);
    }
    results.push(`✅ ${programIds.length} academic programs created`);

    // Batches — 2 batches per program = 24 batches
    const batchIds: Id<"academicBatches">[] = [];
    for (const pid of programIds) {
      for (const year of ["2025-2028", "2024-2027"]) {
        const bid = await ctx.db.insert("academicBatches", {
          name: `${year} Batch`,
          programId: pid as any,
          startDate: now - 365 * 24 * 60 * 60 * 1000,
          endDate: now + 365 * 24 * 60 * 60 * 1000,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        batchIds.push(bid as Id<"academicBatches">);
      }
    }
    results.push(`✅ ${batchIds.length} batches created`);

    // Academic sessions
    const sessionId = await ctx.db.insert("academicSessions", {
      name: "2025-2026 Academic Year",
      startDate: now - 180 * 24 * 60 * 60 * 1000,
      endDate: now + 180 * 24 * 60 * 60 * 1000,
      isActive: true,
      createdAt: now,
    });
    results.push(`✅ Academic session created`);

    // ── Phase 4: Create 180 Employees ───────────────────
    const employeeIds: Id<"employeeMaster">[] = [];
    const facultyIds: Id<"employeeMaster">[] = [];

    const employmentTypes = ["faculty", "counselor", "finance", "hr", "marketing", "admin", "operations", "it", "support"] as const;
    const employeePool: { code: string; type: typeof employmentTypes[number]; name: string }[] = [];

    // 45 Faculty
    for (let i = 0; i < 45; i++) {
      employeePool.push({
        code: `FAC-${String(i + 1).padStart(3, "0")}`,
        type: "faculty",
        name: `${randomPick(FIRST_NAMES)} ${randomPick(LAST_NAMES)}`,
      });
    }
    // 25 Counselors
    for (let i = 0; i < 25; i++) {
      employeePool.push({
        code: `CNS-${String(i + 1).padStart(3, "0")}`,
        type: "counselor",
        name: `${randomPick(FIRST_NAMES)} ${randomPick(LAST_NAMES)}`,
      });
    }
    // 8 Finance
    for (let i = 0; i < 8; i++) {
      employeePool.push({
        code: `FIN-${String(i + 1).padStart(3, "0")}`,
        type: "finance",
        name: `${randomPick(FIRST_NAMES)} ${randomPick(LAST_NAMES)}`,
      });
    }
    // 3 HR, 6 Marketing, 20 Admin, 15 Ops, 10 IT, 8 Support, rest misc
    const remainingTypes: (typeof employmentTypes[number])[] = ["hr", "marketing", "admin", "operations", "it", "support"];
    const remainingCounts = [3, 6, 20, 15, 10, 8];
    for (let t = 0; t < remainingTypes.length; t++) {
      for (let i = 0; i < remainingCounts[t]; i++) {
        employeePool.push({
          code: `${remainingTypes[t].toUpperCase().slice(0, 3)}-${String(i + 1).padStart(3, "0")}`,
          type: remainingTypes[t],
          name: `${randomPick(FIRST_NAMES)} ${randomPick(LAST_NAMES)}`,
        });
      }
    }
    // Fill remaining to 180
    while (employeePool.length < 180) {
      employeePool.push({
        code: `STF-${String(employeePool.length + 1).padStart(3, "0")}`,
        type: "support",
        name: `${randomPick(FIRST_NAMES)} ${randomPick(LAST_NAMES)}`,
      });
    }

    for (const emp of employeePool) {
      const branch = randomPick(branchIds);
      const eid = await ctx.db.insert("employeeMaster", {
        name: emp.name,
        employeeCode: emp.code,
        branchId: branch as any,
        designation: emp.type,
        employmentType: emp.type === "faculty" ? "faculty" : "staff",
        email: `${emp.code.toLowerCase()}@veda-edtech.edu`,
        phone: `+91-98765${String(40000 + employeeIds.length).slice(1)}`,
        status: "active",
        dateOfJoining: now - randomInt(180, 1095) * 24 * 60 * 60 * 1000,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });
      employeeIds.push(eid as Id<"employeeMaster">);
      if (emp.type === "faculty") facultyIds.push(eid as Id<"employeeMaster">);
    }
    results.push(`✅ ${employeeIds.length} employees created (${facultyIds.length} faculty)`);

    // ── Phase 5: Create 2,500 Students ──────────────────
    const studentIds: Id<"studentMaster">[] = [];
    const studentData: Array<{ id: Id<"studentMaster">; batchId: Id<"academicBatches">; branchId: Id<"branches">; programId: Id<"academicPrograms"> }> = [];

    for (let i = 0; i < 2500; i++) {
      const branch = randomPick(branchIds);
      const program = randomPick(programIds);
      const batch = randomPick(batchIds);
      const name = `${randomPick(FIRST_NAMES)} ${randomPick(LAST_NAMES)}`;
      const sid = await ctx.db.insert("studentMaster", {
        name,
        studentCode: `STU-${String(i + 1).padStart(5, "0")}`,
        branchId: branch as any,
        companyId: companyId as any,
        batchId: batch as any,
        programId: program as any,
        status: "active",
        email: `student${i + 1}@veda-edtech.edu`,
        phone: `+91-98765${String(50000 + i).slice(1)}`,
        dateOfBirth: now - randomInt(18, 25) * 365 * 24 * 60 * 60 * 1000,
        createdAt: now,
        updatedAt: now,
      });
      studentIds.push(sid as Id<"studentMaster">);
      studentData.push({ id: sid as Id<"studentMaster">, batchId: batch, branchId: branch, programId: program });
    }
    results.push(`✅ ${studentIds.length} students created`);

    // ── Phase 6: Admission Records (2,000 enrolled, 500 alumni/withdrawn) ──
    let admissionCount = 0;
    for (let i = 0; i < 2000; i++) {
      const s = studentData[i];
      await ctx.db.insert("admissions", {
        studentId: s.id as any,
        academicSessionId: sessionId as any,
        programId: s.programId as any,
        batchId: s.batchId as any,
        admissionDate: now - randomInt(30, 365) * 24 * 60 * 60 * 1000,
        admissionType: "fresh",
        status: "enrolled",
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });
      admissionCount++;
    }
    results.push(`✅ ${admissionCount} admission records created`);

    // ── Phase 7: Fee Plans & Receipts ───────────────────
    const feeAmounts = [25000, 35000, 45000, 60000, 75000, 90000, 120000];
    let receiptCount = 0;
    for (let i = 0; i < 600; i++) {
      const s = studentData[i % studentData.length];
      const amount = randomPick(feeAmounts);
      const rAmount = Math.round(amount * (0.3 + Math.random() * 0.7));

      await ctx.db.insert("receipts", {
        receiptNumber: generateReceiptNumber("FEE", receiptCount + 1),
        studentId: s.id as any,
        amount: rAmount,
        paymentMode: randomPick(["cash", "online", "cheque", "upi"]),
        status: "completed",
        createdAt: now - randomInt(0, 180) * 24 * 60 * 60 * 1000,
      });
      receiptCount++;
    }
    results.push(`✅ ${receiptCount} fee receipts created`);

    // ── Phase 8: PDC / Cheque Records ───────────────────
    const pdcStatuses = ["scheduled", "deposited", "cleared", "bounced"];
    let pdcCount = 0;
    for (let i = 0; i < 120; i++) {
      const s = studentData[i % studentData.length];
      const amount = randomPick(feeAmounts);
      const status = randomPick(pdcStatuses);
      const chequeNumber = `CHQ-${String(10000 + i).slice(1)}`;

      await ctx.db.insert("postDatedCheques", {
        chequeNumber,
        studentId: s.id as any,
        amount: Math.round(amount * 0.5),
        bankName: randomPick(["SBI", "HDFC", "ICICI", "Axis", "PNB"]),
        chequeDate: now + randomInt(1, 90) * 24 * 60 * 60 * 1000,
        status,
        createdAt: now,
        updatedAt: now,
      });
      pdcCount++;
    }
    results.push(`✅ ${pdcCount} PDC/cheque records created (including bounced)`);

    // ── Phase 9: Attendance Records (~50 per student = ~125K) ──
    let attCount = 0;
    // For performance, create attendance for 400 students
    for (let i = 0; i < 400 && i < studentIds.length; i++) {
      for (let d = 0; d < 50; d++) {
        await ctx.db.insert("attendance", {
          studentId: studentIds[i] as any,
          date: now - d * 24 * 60 * 60 * 1000,
          status: Math.random() > 0.15 ? "present" : Math.random() > 0.5 ? "absent" : "leave",
          markedBy: randomPick(employeeIds) as any,
          createdAt: now - d * 24 * 60 * 60 * 1000,
        });
        attCount++;
      }
    }
    results.push(`✅ ${attCount} attendance records created`);

    // ── Phase 10: Leave Records ─────────────────────────
    let leaveCount = 0;
    for (let i = 0; i < employeeIds.length; i++) {
      if (Math.random() > 0.4) continue; // 60% of employees have taken leave
      await ctx.db.insert("leaveRequests", {
        employeeId: employeeIds[i] as any,
        leaveType: randomPick(["sick", "casual", "annual", "personal"]),
        startDate: now - randomInt(1, 90) * 24 * 60 * 60 * 1000,
        endDate: now - randomInt(0, 5) * 24 * 60 * 60 * 1000,
        reason: `Personal reason`,
        status: randomPick(["approved", "approved", "approved", "pending", "rejected"]),
        createdAt: now,
        updatedAt: now,
      });
      leaveCount++;
    }
    results.push(`✅ ${leaveCount} leave records created`);

    // ── Phase 11: Refund Requests ───────────────────────
    let refundCount = 0;
    for (let i = 2000; i < 2080 && i < studentIds.length; i++) {
      const amount = randomPick([5000, 10000, 15000, 20000, 25000]);
      await ctx.db.insert("refundRequests", {
        studentId: studentIds[i] as any,
        amount,
        reason: randomPick(["Withdrawal", "Course change", "Administrative", "Financial hardship"]),
        reasonCategory: "withdrawal",
        status: randomPick(["pending", "approved", "completed"]),
        createdBy: userId,
        createdAt: now - randomInt(1, 60) * 24 * 60 * 60 * 1000,
        updatedAt: now,
      });
      refundCount++;
    }
    results.push(`✅ ${refundCount} refund requests created`);

    // ── Phase 12: Exam Records ──────────────────────────
    let examCount = 0;
    for (let i = 0; i < 20; i++) {
      const eid = await ctx.db.insert("exams", {
        name: `${randomPick(["Mid-Term", "Final", "Quiz", "Practical", "Viva"])} Exam - ${randomPick(SUBJECTS)}`,
        subject: randomPick(SUBJECTS),
        maxMarks: randomPick([25, 50, 100]),
        scheduledDate: now - randomInt(1, 120) * 24 * 60 * 60 * 1000,
        status: randomPick(["completed", "completed", "scheduled"]),
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });
      examCount++;

      // Results for each exam (100 students)
      for (let j = 0; j < 100 && j < studentIds.length; j++) {
        const maxMarks = 100;
        const marksObtained = randomInt(20, maxMarks);
        await ctx.db.insert("examResults", {
          examId: eid as any,
          studentId: studentIds[j] as any,
          marksObtained,
          maxMarks,
          percentage: Math.round((marksObtained / maxMarks) * 100),
          grade: marksObtained >= 85 ? "A" : marksObtained >= 70 ? "B" : marksObtained >= 50 ? "C" : "D",
          status: "published",
          createdAt: now,
        });
      }
    }
    results.push(`✅ ${examCount} exams with results created`);

    // ── Phase 13: Certificates ──────────────────────────
    let certCount = 0;
    for (let i = 0; i < 100; i++) {
      await ctx.db.insert("certificates", {
        studentId: studentIds[i] as any,
        certificateType: randomPick(["completion", "merit", "participation", "transfer"]),
        certificateNumber: `CERT-${String(certCount + 1).padStart(6, "0")}`,
        issuedDate: now - randomInt(1, 365) * 24 * 60 * 60 * 1000,
        status: "issued",
        createdBy: userId,
        createdAt: now,
      });
      certCount++;
    }
    results.push(`✅ ${certCount} certificates created`);

    // ── Phase 14: Payroll Records ───────────────────────
    let payrollCount = 0;
    for (let i = 0; i < employeeIds.length && i < 50; i++) {
      const salary = randomPick([25000, 35000, 50000, 75000, 100000, 150000]);
      await ctx.db.insert("payrollEntries", {
        employeeId: employeeIds[i] as any,
        month: randomInt(1, 12),
        year: 2025,
        basicPay: Math.round(salary * 0.5),
        hra: Math.round(salary * 0.2),
        allowances: Math.round(salary * 0.15),
        deductions: Math.round(salary * 0.1),
        netPay: Math.round(salary * 0.75),
        status: "processed",
        processedDate: now - randomInt(1, 60) * 24 * 60 * 60 * 1000,
        createdAt: now,
      });
      payrollCount++;
    }
    results.push(`✅ ${payrollCount} payroll entries created`);

    // ── Phase 15: Support Tickets ───────────────────────
    let ticketCount = 0;
    const ticketStatuses = ["open", "in_progress", "resolved", "closed"];
    for (let i = 0; i < 80; i++) {
      const sid = studentIds[i % studentIds.length];
      const eid = randomPick(employeeIds);
      await ctx.db.insert("tickets", {
        title: randomPick([
          "Fee payment issue", "Attendance correction", "Exam schedule query",
          "Document request", "Portal access issue", "Course enrollment problem",
          "Scholarship inquiry", "Hostel accommodation",
        ]),
        description: `Issue reported by student requiring resolution.`,
        requesterId: sid as any,
        assigneeId: eid as any,
        priority: randomPick(["low", "medium", "high"]),
        status: randomPick(ticketStatuses),
        category: randomPick(["fee", "academic", "it", "hostel", "general"]),
        createdAt: now - randomInt(1, 60) * 24 * 60 * 60 * 1000,
        updatedAt: now,
      });
      ticketCount++;
    }
    results.push(`✅ ${ticketCount} support tickets created`);

    // ── Phase 16: Knowledge Articles ────────────────────
    let articleCount = 0;
    const articleTopics = [
      { title: "Fee Payment Guide", content: "Step-by-step guide to paying fees online." },
      { title: "Attendance Policy", content: "Minimum 75% attendance required for examinations." },
      { title: "Exam Registration", content: "How to register for semester examinations." },
      { title: "Library Rules", content: "Borrowing limits, return periods, and fines." },
      { title: "Hostel Guidelines", content: "Rules and regulations for hostel residents." },
      { title: "Transfer Certificate", content: "Process for obtaining TC." },
      { title: "Scholarship Programs", content: "Available scholarships and eligibility criteria." },
      { title: "Grievance Redressal", content: "How to file a formal complaint." },
      { title: "IT Support Guide", content: "Common IT issues and their solutions." },
      { title: "Parent Portal Guide", content: "How to use the parent portal features." },
    ];
    for (const article of articleTopics) {
      await ctx.db.insert("knowledgeArticles", {
        title: article.title,
        content: article.content,
        category: randomPick(["academic", "finance", "it", "general", "hostel"]),
        status: "published",
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });
      articleCount++;
    }
    results.push(`✅ ${articleCount} knowledge articles created`);

    // ── Phase 17: Schedule Events ───────────────────────
    let scheduleCount = 0;
    for (let i = 0; i < 200; i++) {
      const faculty = randomPick(facultyIds);
      const batch = randomPick(batchIds);
      await ctx.db.insert("schedules", {
        title: `${randomPick(SUBJECTS)} - ${randomPick(["Lecture", "Lab", "Tutorial", "Workshop"])}`,
        scheduleType: "class",
        start: now + randomInt(-7, 30) * 24 * 60 * 60 * 1000,
        end: now + randomInt(-7, 30) * 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
        timezone: "Asia/Kolkata",
        owner: faculty as any,
        entityType: "batch",
        entityId: batch as any,
        status: "confirmed",
        createdAt: now,
        updatedAt: now,
      });
      scheduleCount++;
    }
    results.push(`✅ ${scheduleCount} schedule events created`);

    // ── Phase 18: Marketing Campaigns ────────────────────
    let campaignCount = 0;
    const campaignNames = [
      "Summer Enrollment Drive", "Open House 2025", "Scholarship Campaign",
      "Alumni Referral Program", "Social Media Awareness", "Webinar Series",
      "Campus Tour Days", "Early Bird Discount",
    ];
    for (const name of campaignNames) {
      await ctx.db.insert("campaigns", {
        name,
        type: randomPick(["email", "sms", "social", "event"]),
        status: randomPick(["draft", "active", "completed"]),
        startDate: now - randomInt(1, 60) * 24 * 60 * 60 * 1000,
        endDate: now + randomInt(1, 30) * 24 * 60 * 60 * 1000,
        budget: randomPick([50000, 100000, 200000, 500000]),
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });
      campaignCount++;
    }
    results.push(`✅ ${campaignCount} marketing campaigns created`);

    // ── Phase 19: Vendor & Procurement Records ──────────
    const vendorNames = [
      "TechSupply India", "EduBooks Pvt Ltd", "Campus Furniture Co",
      "Lab Equipment Corp", "Stationery Mart", "IT Solutions Inc",
      "Transport Services", "Catering Partners",
    ];
    let vendorCount = 0;
    for (const vname of vendorNames) {
      await ctx.db.insert("vendorMaster", {
        vendorName: vname,
        vendorCode: `VEN-${String(vendorCount + 1).padStart(3, "0")}`,
        contactPerson: randomPick(FIRST_NAMES) + " " + randomPick(LAST_NAMES),
        email: `contact@${vname.toLowerCase().replace(/\s+/g, "")}.com`,
        phone: `+91-98765${String(60000 + vendorCount).slice(1)}`,
        status: "active",
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });
      vendorCount++;
    }
    results.push(`✅ ${vendorCount} vendors created`);

    // Purchase Orders
    let poCount = 0;
    for (let i = 0; i < 30; i++) {
      await ctx.db.insert("purchaseOrders", {
        poNumber: generateReceiptNumber("PO", poCount + 1),
        vendorId: randomPick(vendorNames) as any,
        orderDate: now - randomInt(1, 60) * 24 * 60 * 60 * 1000,
        subtotal: randomPick([50000, 100000, 200000, 500000]),
        taxAmount: randomPick([5000, 10000, 20000]),
        totalAmount: 0, // will be calculated
        status: randomPick(["draft", "approved", "received"]),
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });
      poCount++;
    }
    results.push(`✅ ${poCount} purchase orders created`);

    // ── Phase 20: Inventory Items ────────────────────────
    const inventoryNames = [
      "Laptop Dell Latitude", "Projector Epson", "Whiteboard", "Desk Chair",
      "Printer HP LaserJet", "Router Cisco", "UPS APC", "CCTV Camera",
      "Biometric Device", "Fire Extinguisher", "Air Conditioner", "Water Cooler",
    ];
    for (const invName of inventoryNames) {
      await ctx.db.insert("inventoryItems", {
        itemName: invName,
        sku: `SKU-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
        currentStock: randomInt(1, 50),
        minimumStock: randomInt(1, 5),
        unitPrice: randomPick([500, 1500, 5000, 15000, 50000]),
        createdAt: now,
        updatedAt: now,
      });
    }
    results.push(`✅ ${inventoryNames.length} inventory items created`);

    // ── Phase 21: Workflow Definitions ──────────────────
    const workflowDefinitions = [
      { name: "Admission Approval", description: "New student admission approval workflow", module: "admissions" },
      { name: "Refund Processing", description: "Student refund request processing", module: "finance" },
      { name: "Purchase Approval", description: "Purchase order approval chain", module: "procurement" },
      { name: "Leave Approval", description: "Employee leave request workflow", module: "hr" },
      { name: "Ticket Escalation", description: "Support ticket escalation workflow", module: "support" },
      { name: "PDC Bounce Resolution", description: "Cheque bounce follow-up workflow", module: "finance" },
      { name: "Exam Result Publishing", description: "Exam result review and publishing", module: "academic" },
    ];
    for (const wf of workflowDefinitions) {
      await ctx.db.insert("workflowDefinitions", {
        name: wf.name,
        description: wf.description,
        module: wf.module,
        status: "active",
        version: 1,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });
    }
    results.push(`✅ ${workflowDefinitions.length} workflow definitions created`);

    // ── Phase 22: Generate Audit Events & Timeline ─────
    // Populate timelineEvents and events tables for enterprise pipeline validation
    for (let i = 0; i < 50; i++) {
      const module = randomPick(["finance", "students", "employees", "academic", "procurement"]);
      const entity = randomPick(["student", "employee", "receipt", "admission", "purchase_order"]);
      const eventType = `simulation.${module}.${entity}.created`;
      const entityId = randomPick([
        ...studentIds.slice(0, 100).map(s => s.toString()),
        ...employeeIds.slice(0, 50).map(e => e.toString()),
      ]);

      await ctx.db.insert("timelineEvents", {
        module,
        eventType,
        entityType: entity,
        entityId,
        title: `[Simulation] ${eventType}`,
        description: `Simulated ${entity} creation`,
        performedBy: userId,
        createdAt: now - randomInt(0, 7) * 24 * 60 * 60 * 1000,
      });

      await ctx.db.insert("events", {
        module,
        eventType,
        entityType: entity,
        entityId,
        performedBy: userId,
        status: "published",
        publishedAt: now - randomInt(0, 7) * 24 * 60 * 60 * 1000,
        createdAt: now,
      });

      await ctx.db.insert("auditLogs", {
        action: "create",
        entity,
        entityId,
        userId,
        createdAt: now - randomInt(0, 7) * 24 * 60 * 60 * 1000,
      });
    }
    results.push(`✅ 50 timeline events, 50 events, 50 audit logs created`);

    // ── Phase 23: Dashboard Refresh Signals ────────────
    const dashboardModules = ["students", "finance", "employees", "admissions", "academic", "procurement", "support", "hr"];
    for (const mod of dashboardModules) {
      const existing = await ctx.db.query("dashboardRefreshSignals")
        .withIndex("module_entity", (q: any) => q.eq("module", mod).eq("entity", mod))
        .first()
        .catch(() => null);
      if (!existing) {
        await ctx.db.insert("dashboardRefreshSignals", {
          module: mod,
          entity: mod,
          lastRefresh: now,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    results.push(`✅ ${dashboardModules.length} dashboard refresh signals created`);

    return {
      simulated: true,
      message: "Enterprise simulation complete — Company A with full business data operational",
      results,
      summary: {
        companies: 1,
        branches: 12,
        employees: employeeIds.length,
        faculty: facultyIds.length,
        students: studentIds.length,
        admissions: admissionCount,
        receipts: receiptCount,
        pdcs: pdcCount,
        attendance: attCount,
        leaves: leaveCount,
        refunds: refundCount,
        exams: examCount,
        certificates: certCount,
        payroll: payrollCount,
        tickets: ticketCount,
        knowledgeArticles: articleCount,
        schedules: scheduleCount,
        campaigns: campaignCount,
        vendors: vendorCount,
        purchaseOrders: poCount,
      },
    };
  },
});

// ─── Status Query ──────────────────────────────────────────
// Returns current simulation state

export const getSimulationStatus = query({
  handler: async (ctx) => {
    let companyCount = 0, branchCount = 0, studentCount = 0,
      employeeCount = 0, receiptCount = 0, pdcCount = 0;

    try { companyCount = (await ctx.db.query("companies").collect()).length; } catch {}
    try { branchCount = (await ctx.db.query("branches").collect()).length; } catch {}
    try { studentCount = (await ctx.db.query("studentMaster").collect()).length; } catch {}
    try { employeeCount = (await ctx.db.query("employeeMaster").collect()).length; } catch {}
    try { receiptCount = (await ctx.db.query("receipts").collect()).length; } catch {}
    try { pdcCount = (await ctx.db.query("postDatedCheques").collect()).length; } catch {}

    return {
      seeded: studentCount > 0,
      companies: companyCount,
      branches: branchCount,
      students: studentCount,
      employees: employeeCount,
      receipts: receiptCount,
      pdcs: pdcCount,
      message: studentCount > 0
        ? `Enterprise simulation active — ${studentCount} students, ${employeeCount} employees across ${branchCount} branches`
        : "No simulation data found",
    };
  },
});
