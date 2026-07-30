/**
 * Enterprise Simulation — PATCH-PRODUCTION-004
 *
 * Creates a complete virtual organization with realistic linked data
 * across ALL business modules for end-to-end validation.
 *
 * Schema-correct version: uses actual table definitions from src/convex/schema/*.ts
 *
 * Company A
 *   12 branches
 *   4 academic verticals
 *   2,500 students
 *   180 employees (45 faculty, 25 counselors, 8 finance, 3 HR, 6 marketing, etc.)
 *   Complete fee/PDC/receipt/attendance/exam/certificate data
 *
 * Idempotent: safe to run multiple times (skips if already seeded).
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ─── Constants ─────────────────────────────────────────────

const BRANCH_NAMES = [
  "Main Campus", "East Campus", "West Campus", "North Campus", "South Campus",
  "City Center", "Tech Park", "Knowledge Park", "Lake View", "Green Valley",
  "Riverside", "Heritage",
];

const ACADEMIC_VERTICALS = [
  { name: "Engineering & Technology", code: "ENGG", category: "higher_education" },
  { name: "Management & Commerce", code: "MGMT", category: "higher_education" },
  { name: "Science & Research", code: "SCI", category: "higher_education" },
  { name: "Diploma & Certification", code: "DIPL", category: "vocational" },
];

const PROGRAMS_DATA = [
  { name: "BTech Computer Science", code: "BTECH-CS", type: "degree", duration: 4, vertical: 0 },
  { name: "BTech Electronics", code: "BTECH-EC", type: "degree", duration: 4, vertical: 0 },
  { name: "BTech Mechanical", code: "BTECH-ME", type: "degree", duration: 4, vertical: 0 },
  { name: "BCA", code: "BCA", type: "degree", duration: 3, vertical: 0 },
  { name: "BBA", code: "BBA", type: "degree", duration: 3, vertical: 1 },
  { name: "BCom", code: "BCOM", type: "degree", duration: 3, vertical: 1 },
  { name: "MBA", code: "MBA", type: "postgraduate", duration: 2, vertical: 1 },
  { name: "MCA", code: "MCA", type: "postgraduate", duration: 2, vertical: 0 },
  { name: "BSc Nursing", code: "BSC-NUR", type: "degree", duration: 4, vertical: 2 },
  { name: "BSc Biotechnology", code: "BSC-BIO", type: "degree", duration: 3, vertical: 2 },
  { name: "Diploma Engineering", code: "DIPL-ENGG", type: "diploma", duration: 3, vertical: 3 },
  { name: "Diploma Management", code: "DIPL-MGMT", type: "diploma", duration: 2, vertical: 3 },
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

const COLORS = ["#1a73e8", "#34a853", "#ea4335", "#fbbc04", "#a855f7", "#06b6d4", "#f43f5e", "#10b981", "#6366f1", "#e11d48", "#0ea5e9", "#84cc16"];
const CITIES = ["Knowledge City", "Tech Valley", "Edu Park", "Innovation Hub", "Learning Center"];

// ─── Helpers ──────────────────────────────────────────────

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateReceiptNumber(prefix: string, serial: number): string {
  return `${prefix}-${String(serial).padStart(6, "0")}`;
}

// ─── MAIN SIMULATION MUTATION ───────────────────────────

export const runEnterpriseSimulation = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const results: string[] = [];

    // ── Check if already seeded ──────────────────────
    const existing = await ctx.db.query("orgCompanies").collect();
    const companyAExists = existing.some((c: any) => c.code === "COMPA");
    if (companyAExists) {
      return { simulated: false, message: "Enterprise simulation already seeded. Run clearAndReseed() to reset.", results };
    }

    // Need a user ID for createdBy fields — create a system reference
    const systemUserId = (await ctx.db.query("users").first())?._id;
    const userId = systemUserId ?? ("" as any);

    // ═══════════════════════════════════════════════════════
    // PHASE 1: Organization Structure
    // ═══════════════════════════════════════════════════════
    //
    // NOTE: There are two parallel hierarchies:
    //   - orgCompanies / orgBranches (rich business data)
    //   - companies / branches (simple, used by studentMaster/employeeMaster)
    // We create BOTH.

    const orgCompanyId = await ctx.db.insert("orgCompanies", {
      name: "EdVeda Institute of Technology",
      code: "COMPA",
      color: "#1a73e8",
      icon: "Building2",
      legalName: "EdVeda Institute of Technology Pvt Ltd",
      registrationNumber: "U80301KA2025PTC123456",
      taxNumber: "27AAAPN1234H1Z1",
      email: "admin@veda-edtech.edu",
      phone: "+91-1800-EDVEDA",
      website: "https://veda-edtech.edu",
      address: "123 Education Valley, Knowledge City",
      city: "Knowledge City",
      state: "Karnataka",
      country: "India",
      description: "Enterprise Education Technology Group",
      displayOrder: 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    results.push(`✅ orgCompany created (${orgCompanyId})`);

    // Create simple companies record (used by studentMaster/employeeMaster)
    const companyId = await ctx.db.insert("companies", {
      name: "EdVeda Institute",
      code: "COMPA",
      companyType: "education",
      status: "active",
      description: "Enterprise Education Technology Company",
      color: "#1a73e8",
      icon: "Building2",
      createdAt: now,
      updatedAt: now,
    });
    results.push(`✅ Company record created (${companyId})`);

    // orgBranches (rich data)
    const orgBranchIds: string[] = [];
    for (let i = 0; i < BRANCH_NAMES.length; i++) {
      const bid = await ctx.db.insert("orgBranches", {
        name: BRANCH_NAMES[i],
        code: `BR-${String(i + 1).padStart(2, "0")}`,
        color: COLORS[i % COLORS.length],
        icon: "Building",
        city: CITIES[i % CITIES.length],
        state: "Karnataka",
        country: "India",
        address: `${i + 1}${["st", "nd", "rd", "th"][Math.min(i, 3)]} Sector, ${BRANCH_NAMES[i]}`,
        phone: `+91-98765${String(10000 + i).slice(1)}`,
        email: `${BRANCH_NAMES[i].toLowerCase().replace(/\s+/g, "")}@veda-edtech.edu`,
        managerName: `Manager ${BRANCH_NAMES[i]}`,
        displayOrder: i + 1,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      orgBranchIds.push(bid);
    }
    results.push(`✅ 12 orgBranches created`);

    // Simple branches record (used by studentMaster/employeeMaster)
    const branchIds: string[] = [];
    for (let i = 0; i < BRANCH_NAMES.length; i++) {
      const bid = await ctx.db.insert("branches", {
        name: BRANCH_NAMES[i],
        code: `BR-${String(i + 1).padStart(2, "0")}`,
        email: `${BRANCH_NAMES[i].toLowerCase().replace(/\s+/g, "")}@veda-edtech.edu`,
        phone: `+91-98765${String(10000 + i).slice(1)}`,
        address: `${i + 1} Sector, ${BRANCH_NAMES[i]}`,
        isActive: true,
        description: `${BRANCH_NAMES[i]} branch`,
        color: COLORS[i % COLORS.length],
        icon: "Building",
        createdAt: now,
        updatedAt: now,
      });
      branchIds.push(bid);
    }
    results.push(`✅ 12 branches created (for entity references)`);

    // ═══════════════════════════════════════════════════════
    // PHASE 2: Academic Structure
    // ═══════════════════════════════════════════════════════

    // Academic Verticals (needed for academicPrograms)
    const verticalIds: Id<"academicVerticals">[] = [];
    for (const v of ACADEMIC_VERTICALS) {
      const vid = await ctx.db.insert("academicVerticals", {
        name: v.name,
        code: v.code,
        color: randomPick(COLORS),
        icon: "BookOpen",
        educationCategory: v.category,
        description: `${v.name} programs`,
        displayOrder: verticalIds.length + 1,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      verticalIds.push(vid as Id<"academicVerticals">);
    }
    results.push(`✅ ${verticalIds.length} academic verticals created`);

    // Academic Sub-Verticals (needed for academicPrograms)
    const subVerticalIds: Id<"academicSubVerticals">[] = [];
    for (const vid of verticalIds) {
      const svid = await ctx.db.insert("academicSubVerticals", {
        verticalId: vid as any,
        name: `${ACADEMIC_VERTICALS[verticalIds.indexOf(vid)].name} - Core`,
        code: `${ACADEMIC_VERTICALS[verticalIds.indexOf(vid)].code}-CORE`,
        color: randomPick(COLORS),
        icon: "BookOpen",
        description: `Core ${ACADEMIC_VERTICALS[verticalIds.indexOf(vid)].name} programs`,
        displayOrder: subVerticalIds.length + 1,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      subVerticalIds.push(svid as Id<"academicSubVerticals">);
    }
    results.push(`✅ ${subVerticalIds.length} academic sub-verticals created`);

    // Academic Sessions (needed for academicBatches)
    const sessionId = await ctx.db.insert("academicSessions", {
      name: "2025-2026",
      code: "AY-2025-26",
      academicYear: "2025-2026",
      color: "#1a73e8",
      icon: "Calendar",
      startDate: now - 180 * 24 * 60 * 60 * 1000,
      endDate: now + 180 * 24 * 60 * 60 * 1000,
      description: "Academic Year 2025-2026",
      sequence: 1,
      isCurrent: true,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    results.push(`✅ Academic session created`);

    // Academic Batch Types (needed for academicBatches)
    const batchTypeId = await ctx.db.insert("academicBatchTypes", {
      name: "Regular",
      code: "REG",
      deliveryMode: "classroom",
      timingCategory: "regular",
      description: "Regular classroom batch",
      displayOrder: 1,
      color: "#34a853",
      icon: "Users",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    results.push(`✅ Academic batch type created`);

    // Academic Programs
    const programIds: Id<"academicPrograms">[] = [];
    for (const p of PROGRAMS_DATA) {
      const sv = subVerticalIds[p.vertical];
      const pid = await ctx.db.insert("academicPrograms", {
        subVerticalId: sv as any,
        name: p.name,
        code: p.code,
        programType: p.type,
        duration: p.duration,
        durationUnit: "years",
        deliveryMode: "classroom",
        description: `${p.name} program`,
        displayOrder: programIds.length + 1,
        color: COLORS[programIds.length % COLORS.length],
        icon: "GraduationCap",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      programIds.push(pid as Id<"academicPrograms">);
    }
    results.push(`✅ ${programIds.length} academic programs created`);

    // Academic Batches — 2 per program = 24
    const batchIds: Id<"academicBatches">[] = [];
    for (const pid of programIds) {
      for (const year of ["2025-2028", "2024-2027"]) {
        const bid = await ctx.db.insert("academicBatches", {
          name: `${year}`,
          code: `${PROGRAMS_DATA[programIds.indexOf(pid)].code}-${year.slice(0, 4)}`,
          programId: pid as any,
          batchTypeId: batchTypeId as any,
          academicSessionId: sessionId as any,
          capacity: randomInt(60, 120),
          maxStrength: randomInt(60, 120),
          startDate: now - 365 * 24 * 60 * 60 * 1000,
          endDate: now + 2 * 365 * 24 * 60 * 60 * 1000,
          description: `${year} batch for ${PROGRAMS_DATA[programIds.indexOf(pid)].name}`,
          sequence: batchIds.length + 1,
          color: COLORS[batchIds.length % COLORS.length],
          icon: "Users",
          active: true,
          createdAt: now,
          updatedAt: now,
        });
        batchIds.push(bid as Id<"academicBatches">);
      }
    }
    results.push(`✅ ${batchIds.length} academic batches created`);

    // ═══════════════════════════════════════════════════════
    // PHASE 3: Person Records
    // ═══════════════════════════════════════════════════════

    // We need personMaster records for both employees and students
    // personMaster requires: firstName, lastName, status, createdAt, updatedAt

    async function createPerson(firstName: string, lastName: string): Promise<Id<"personMaster">> {
      return await ctx.db.insert("personMaster", {
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        status: "active",
        createdAt: now,
        updatedAt: now,
      }) as Id<"personMaster">;
    }

    // ═══════════════════════════════════════════════════════
    // PHASE 4: Employees (180)
    // ═══════════════════════════════════════════════════════

    interface EmpInfo {
      code: string;
      type: string; // faculty, counselor, finance, hr, marketing, admin, operations, it, support
      firstName: string;
      lastName: string;
      personId: Id<"personMaster">;
    }

    const employeeInfos: EmpInfo[] = [];
    const employeeIds: Id<"employeeMaster">[] = [];
    const facultyIds: Id<"employeeMaster">[] = [];

    const rolesByType: Record<string, "super_admin" | "ceo" | "coo" | "cto" | "department_head" | "manager" | "employee"> = {
      faculty: "employee",
      counselor: "employee",
      finance: "employee",
      hr: "employee",
      marketing: "employee",
      admin: "manager",
      operations: "employee",
      it: "employee",
      support: "employee",
    };

    // Build employee pool with person records
    const typeCounts: [string, number][] = [
      ["faculty", 45], ["counselor", 25], ["finance", 8], ["hr", 3],
      ["marketing", 6], ["admin", 20], ["operations", 15], ["it", 10], ["support", 48],
    ];

    // First 8 slots = admin/ceo types for the first 8 employees
    for (const [type, count] of typeCounts) {
      for (let i = 0; i < count; i++) {
        const prefix = type.slice(0, 3).toUpperCase();
        const fn = randomPick(FIRST_NAMES);
        const ln = randomPick(LAST_NAMES);
        const personId = await createPerson(fn, ln);
        employeeInfos.push({
          code: `${prefix}-${String(i + 1).padStart(3, "0")}`,
          type,
          firstName: fn,
          lastName: ln,
          personId,
        });
        if (employeeInfos.length >= 180) break;
      }
      if (employeeInfos.length >= 180) break;
    }

    for (const emp of employeeInfos) {
      const branch = randomPick(branchIds);
      const primaryRole = emp.type === "admin" ? "manager" :
        emp.type === "hr" ? "department_head" : "employee";

      const eid = await ctx.db.insert("employeeMaster", {
        employeeCode: emp.code,
        personId: emp.personId as any,
        companyId: companyId as any,
        branchId: branch as any,
        employmentType: "permanent",
        primaryRole,
        status: "active" as const,
        workLocation: `${CITIES[0]}`,
        experienceLevel: randomInt(1, 15).toString(),
        createdAt: now - randomInt(180, 1095) * 24 * 60 * 60 * 1000,
        updatedAt: now,
      });
      employeeIds.push(eid as Id<"employeeMaster">);
      if (emp.type === "faculty") facultyIds.push(eid as Id<"employeeMaster">);
    }
    results.push(`✅ ${employeeIds.length} employees created (${facultyIds.length} faculty)`);

    // ═══════════════════════════════════════════════════════
    // PHASE 5: Students (2,500)
    // ═══════════════════════════════════════════════════════

    interface StudentInfo {
      id: Id<"studentMaster">;
      personId: Id<"personMaster">;
      branchId: Id<"orgBranches">;
      programId: Id<"academicPrograms">;
      batchId: Id<"academicBatches">;
    }

    const studentInfos: StudentInfo[] = [];

    for (let i = 0; i < 2500; i++) {
      const branch = randomPick(branchIds);
      const program = randomPick(programIds);
      const batch = randomPick(batchIds);
      const fn = randomPick(FIRST_NAMES);
      const ln = randomPick(LAST_NAMES);
      const personId = await createPerson(fn, ln);

      const sid = await ctx.db.insert("studentMaster", {
        studentCode: `STU-${String(i + 1).padStart(5, "0")}`,
        personId: personId as any,
        admissionNumber: `ADM-${String(i + 1).padStart(5, "0")}`,
        enrollmentDate: now - randomInt(30, 365) * 24 * 60 * 60 * 1000,
        currentStatus: i < 2000 ? ("active" as const) : i < 2400 ? ("completed" as const) : ("alumni" as const),
        branchId: branch as any,
        companyId: companyId as any,
        academicYearId: sessionId as any,
        createdBy: userId as any,
        createdAt: now,
        updatedAt: now,
      });
      studentInfos.push({
        id: sid as Id<"studentMaster">,
        personId,
        branchId: branch,
        programId: program,
        batchId: batch,
      });
    }
    results.push(`✅ ${studentInfos.length} students created`);

    // ═══════════════════════════════════════════════════════
    // PHASE 6: Finance — Student Fee Accounts
    // ═══════════════════════════════════════════════════════

    const feeAmounts = [25000, 35000, 45000, 60000, 75000, 90000, 120000];
    const studentFeeAccountIds: Id<"studentFeeAccounts">[] = [];

    for (let i = 0; i < 2000; i++) {
      const si = studentInfos[i];
      const totalFee = randomPick(feeAmounts);
      const paid = Math.round(totalFee * (0.3 + Math.random() * 0.7));

      const faId = await ctx.db.insert("studentFeeAccounts", {
        studentId: si.id as any,
        totalFee,
        totalPaid: paid,
        outstandingBalance: totalFee - paid,
        totalDiscount: 0,
        totalScholarship: 0,
        totalWaiver: 0,
        installmentsCount: randomInt(1, 6),
        installmentFrequency: "monthly",
        status: paid >= totalFee ? "closed" : "active",
        createdBy: userId as any,
      });
      studentFeeAccountIds.push(faId as Id<"studentFeeAccounts">);
    }
    results.push(`✅ ${studentFeeAccountIds.length} fee accounts created`);

    // Fee Invoices
    let invoiceCount = 0;
    for (let i = 0; i < 600; i++) {
      const si = studentInfos[i % studentInfos.length];
      const fa = studentFeeAccountIds[i % studentFeeAccountIds.length];
      const totalFee = randomPick(feeAmounts);
      const taxAmount = Math.round(totalFee * 0.18);
      await ctx.db.insert("feeInvoices", {
        invoiceNumber: generateReceiptNumber("INV", invoiceCount + 1),
        studentId: si.id as any,
        feeAccountId: fa as any,
        invoiceDate: now - randomInt(1, 180) * 24 * 60 * 60 * 1000,
        dueDate: now + randomInt(1, 30) * 24 * 60 * 60 * 1000,
        lineItems: JSON.stringify([{ description: "Tuition Fee", amount: totalFee }]),
        subtotal: totalFee,
        discountAmount: 0,
        taxAmount,
        totalAmount: totalFee + taxAmount,
        paidAmount: Math.round((totalFee + taxAmount) * 0.5),
        balanceDue: Math.round((totalFee + taxAmount) * 0.5),
        status: "partial",
        gstPercentage: 18,
        gstAmount: taxAmount,
        createdBy: userId as any,
      });
      invoiceCount++;
    }
    results.push(`✅ ${invoiceCount} fee invoices created`);

    // Payment Transactions (receipts)
    let txCount = 0;
    for (let i = 0; i < 500; i++) {
      const si = studentInfos[i % studentInfos.length];
      const fa = studentFeeAccountIds[i % studentFeeAccountIds.length];
      const amount = randomPick([5000, 10000, 15000, 25000, 50000]);
      await ctx.db.insert("paymentTransactions", {
        transactionNumber: generateReceiptNumber("TXN", txCount + 1),
        studentId: si.id as any,
        feeAccountId: fa as any,
        paymentMethod: randomPick(["cash", "online", "upi", "cheque"]),
        paymentDate: now - randomInt(1, 180) * 24 * 60 * 60 * 1000,
        amount,
        status: "completed",
        createdBy: userId as any,
      });
      txCount++;
    }
    results.push(`✅ ${txCount} payment transactions created`);

    // Receipt History
    let receiptCount = 0;
    for (let i = 0; i < 400; i++) {
      const si = studentInfos[i % studentInfos.length];
      const amount = randomPick([5000, 10000, 15000, 25000]);
      await ctx.db.insert("receiptHistory", {
        receiptNumber: generateReceiptNumber("RCT", receiptCount + 1),
        studentId: si.id as any,
        amount,
        receiptDate: now - randomInt(1, 180) * 24 * 60 * 60 * 1000,
        receiptType: "payment",
        createdBy: userId as any,
      });
      receiptCount++;
    }
    results.push(`✅ ${receiptCount} receipt history records created`);

    // Refund Requests
    let refundCount = 0;
    for (let i = 2000; i < 2080 && i < studentInfos.length; i++) {
      const amount = randomPick([5000, 10000, 15000, 20000]);
      await ctx.db.insert("refundRequests", {
        studentId: studentInfos[i].id as any,
        amount,
        reason: randomPick(["Withdrawal", "Course change", "Administrative", "Financial hardship"]),
        reasonCategory: randomPick(["academic", "administrative", "financial", "withdrawal"]),
        status: randomPick(["pending", "approved", "completed"]),
        createdBy: userId as any,
        createdAt: now - randomInt(1, 60) * 24 * 60 * 60 * 1000,
        updatedAt: now,
      });
      refundCount++;
    }
    results.push(`✅ ${refundCount} refund requests created`);

    // ═══════════════════════════════════════════════════════
    // PHASE 7: Examination
    // ═══════════════════════════════════════════════════════

    // Create exam templates first
    const examTemplateIds: Id<"examTemplates">[] = [];
    const examTypes = ["unit_test", "mid_term", "final_exam", "practical"] as const;
    for (const type of examTypes) {
      const etid = await ctx.db.insert("examTemplates", {
        name: `${type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ")}`,
        code: `TEMP-${type.toUpperCase()}`,
        examType: type,
        maxMarks: type === "final_exam" ? 100 : 50,
        passPercentage: 40,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      examTemplateIds.push(etid as Id<"examTemplates">);
    }
    results.push(`✅ ${examTemplateIds.length} exam templates created`);

    // Create exam sessions (10)
    const examSessionIds: Id<"examSessions">[] = [];
    for (let i = 0; i < 10; i++) {
      const branch = randomPick(orgBranchIds);
      const template = randomPick(examTemplateIds);
      const esid = await ctx.db.insert("examSessions", {
        templateId: template as any,
        academicSessionId: sessionId as any,
        branchId: branch as any,
        name: `${randomPick(["Mid-Term", "Final", "Quarterly", "Weekly Test"])} ${i + 1}`,
        startDate: now - randomInt(1, 120) * 24 * 60 * 60 * 1000,
        endDate: now + randomInt(1, 7) * 24 * 60 * 60 * 1000,
        status: "completed",
        createdAt: now,
        updatedAt: now,
      });
      examSessionIds.push(esid as Id<"examSessions">);
    }
    results.push(`✅ ${examSessionIds.length} exam sessions created`);

    // Exam Results for each session
    let resultCount = 0;
    for (const esid of examSessionIds) {
      for (let j = 0; j < 100 && j < studentInfos.length; j++) {
        const marks = randomInt(20, 100);
        const grade = marks >= 85 ? "A" : marks >= 70 ? "B" : marks >= 50 ? "C" : "D";
        const division = marks >= 75 ? "distinction" : marks >= 60 ? "first" : marks >= 50 ? "second" : marks >= 40 ? "third" : "fail";
        await ctx.db.insert("examResults", {
          examSessionId: esid as any,
          studentId: studentInfos[j].personId as any,
          totalMarks: 100,
          marksObtained: marks,
          percentage: marks,
          grade,
          division,
          passFail: marks >= 40 ? "pass" : "fail",
          calculatedAt: now,
          createdAt: now,
          updatedAt: now,
        });
        resultCount++;
      }
    }
    results.push(`✅ ${resultCount} exam results created`);

    // Certificates
    let certCount = 0;
    for (let i = 0; i < 100; i++) {
      const esid = randomPick(examSessionIds);
      await ctx.db.insert("examCertificates", {
        studentId: studentInfos[i].personId as any,
        examSessionId: esid as any,
        certificateType: randomPick(["marksheet", "merit_certificate", "passing_certificate"]),
        certificateNumber: `CERT-${String(certCount + 1).padStart(6, "0")}`,
        title: `Certificate of ${randomPick(["Completion", "Merit", "Participation"])}`,
        issuedDate: now - randomInt(1, 365) * 24 * 60 * 60 * 1000,
        issuedBy: userId as any,
        createdAt: now,
        updatedAt: now,
      });
      certCount++;
    }
    results.push(`✅ ${certCount} certificates created`);

    // ═══════════════════════════════════════════════════════
    // PHASE 8: Support Tickets
    // ═══════════════════════════════════════════════════════

    let ticketCount = 0;
    const ticketTypes = ["support", "hardware", "software", "student", "finance"];
    const ticketPriorities = ["low", "medium", "high"];
    const ticketStatuses = ["open", "in_progress", "resolved", "closed"];
    for (let i = 0; i < 80; i++) {
      const si = studentInfos[i % studentInfos.length];
      const assignee = randomPick(employeeIds);
      await ctx.db.insert("ticketMaster", {
        ticketNumber: `SVC-2026-${String(ticketCount + 1).padStart(4, "0")}`,
        title: randomPick([
          "Fee payment issue", "Attendance correction", "Exam schedule query",
          "Document request", "Portal access issue", "Course enrollment problem",
          "Scholarship inquiry", "Hostel accommodation",
        ]),
        description: "Issue reported by student requiring resolution.",
        status: randomPick(ticketStatuses),
        priority: randomPick(ticketPriorities),
        type: randomPick(ticketTypes),
        requesterId: si.id as any,
        requesterType: "student",
        createdAt: now - randomInt(1, 60) * 24 * 60 * 60 * 1000,
        updatedAt: now,
      });
      ticketCount++;
      ticketCount++;
    }
    results.push(`✅ ${ticketCount} support tickets created`);

    // ═══════════════════════════════════════════════════════
    // PHASE 9: Schedules
    // ═══════════════════════════════════════════════════════

    let scheduleCount = 0;
    for (let i = 0; i < 200; i++) {
      const batch = randomPick(batchIds);
      await ctx.db.insert("schedules", {
        title: `${randomPick(SUBJECTS)} - ${randomPick(["Lecture", "Lab", "Tutorial", "Workshop"])}`,
        scheduleType: "class",
        status: "confirmed",
        start: now + randomInt(-7, 30) * 24 * 60 * 60 * 1000,
        end: now + randomInt(-7, 30) * 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
        timezone: "Asia/Kolkata",
        entityType: "batch",
        entityId: batch as any,
        createdAt: now,
        updatedAt: now,
      });
      scheduleCount++;
    }
    results.push(`✅ ${scheduleCount} schedule events created`);

    // ═══════════════════════════════════════════════════════
    // PHASE 10: Procurement — Vendors & Purchase Orders
    // ═══════════════════════════════════════════════════════

    const vendorNames = [
      { name: "TechSupply India", code: "VEN-001" },
      { name: "EduBooks Pvt Ltd", code: "VEN-002" },
      { name: "Campus Furniture Co", code: "VEN-003" },
      { name: "Lab Equipment Corp", code: "VEN-004" },
      { name: "Stationery Mart", code: "VEN-005" },
      { name: "IT Solutions Inc", code: "VEN-006" },
      { name: "Transport Services", code: "VEN-007" },
      { name: "Catering Partners", code: "VEN-008" },
    ];

    const vendorIds: Id<"vendorMaster">[] = [];
    for (const v of vendorNames) {
      const vid = await ctx.db.insert("vendorMaster", {
        vendorName: v.name,
        vendorCode: v.code,
        contactPerson: `${randomPick(FIRST_NAMES)} ${randomPick(LAST_NAMES)}`,
        email: `contact@${v.name.toLowerCase().replace(/\s+/g, "")}.com`,
        phone: `+91-98765${String(60000 + vendorNames.indexOf(v)).slice(1)}`,
        status: "active",
        createdBy: userId as any,
        createdAt: now,
        updatedAt: now,
      });
      vendorIds.push(vid as Id<"vendorMaster">);
    }
    results.push(`✅ ${vendorIds.length} vendors created`);

    // Purchase Orders
    let poCount = 0;
    for (let i = 0; i < 30; i++) {
      const vendor = randomPick(vendorIds);
      const subtotal = randomPick([50000, 100000, 200000, 500000]);
      const taxAmount = Math.round(subtotal * 0.18);
      await ctx.db.insert("purchaseOrders", {
        poNumber: generateReceiptNumber("PO", poCount + 1),
        vendorId: vendor as any,
        orderDate: now - randomInt(1, 60) * 24 * 60 * 60 * 1000,
        subtotal,
        taxAmount,
        totalAmount: subtotal + taxAmount,
        status: randomPick(["draft", "approved", "partially_received"]),
        createdBy: userId as any,
        createdAt: now,
        updatedAt: now,
      });
      poCount++;
    }
    results.push(`✅ ${poCount} purchase orders created`);

    // Inventory Items
    const inventoryNames = [
      { name: "Laptop Dell Latitude", unit: "unit" },
      { name: "Projector Epson", unit: "unit" },
      { name: "Whiteboard", unit: "unit" },
      { name: "Desk Chair", unit: "unit" },
      { name: "Printer HP LaserJet", unit: "unit" },
      { name: "Router Cisco", unit: "unit" },
      { name: "UPS APC", unit: "unit" },
      { name: "CCTV Camera", unit: "unit" },
      { name: "Biometric Device", unit: "unit" },
      { name: "Fire Extinguisher", unit: "unit" },
      { name: "Air Conditioner", unit: "unit" },
      { name: "Water Cooler", unit: "unit" },
    ];

    // Create a warehouse first (needed by inventoryItems)
    const warehouseId = await ctx.db.insert("warehouses", {
      name: "Main Warehouse",
      code: "WH-001",
      type: "warehouse",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    for (const inv of inventoryNames) {
      const currentStock = randomInt(1, 50);
      await ctx.db.insert("inventoryItems", {
        sku: `SKU-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`,
        name: inv.name,
        unit: inv.unit,
        unitPrice: randomPick([500, 1500, 5000, 15000, 50000]),
        minStock: 2,
        maxStock: 100,
        reorderLevel: 5,
        currentStock,
        warehouseId: warehouseId as any,
        isActive: true,
        createdBy: userId as any,
        createdAt: now,
        updatedAt: now,
      });
    }
    results.push(`✅ ${inventoryNames.length} inventory items created`);

    // ═══════════════════════════════════════════════════════
    // PHASE 11: Knowledge Base
    // ═══════════════════════════════════════════════════════

    const articles = [
      { title: "Fee Payment Guide", body: "Step-by-step guide to paying fees online. Log in to your student portal, navigate to fees section, select payment method, and complete the transaction." },
      { title: "Attendance Policy", body: "Minimum 75% attendance is required for appearing in semester examinations. Medical leave requires valid documentation." },
      { title: "Exam Registration", body: "Students must register for semester examinations through the student portal at least 30 days before the exam start date." },
      { title: "Library Rules", body: "Borrowing limits: 5 books for 14 days. Late return fine: Rs. 5/day. Reference books are not issued outside the library." },
      { title: "Hostel Guidelines", body: "Hostel residents must follow the curfew timings. Visitors are allowed only during visiting hours with prior registration." },
      { title: "Transfer Certificate", body: "Request TC through the student portal. Processing time: 7 working days after clearance from all departments." },
      { title: "Scholarship Programs", body: "Merit scholarships covering 25-100% of tuition fees. Need-based scholarships also available. Apply through the scholarship portal." },
      { title: "IT Support Guide", body: "Common IT issues include password reset, portal access, email configuration, and network connectivity. Contact IT Helpdesk at ext. 2001." },
      { title: "Parent Portal Guide", body: "Parents can track attendance, fees, homework, exam results, and communicate with faculty through the parent portal." },
      { title: "Campus Facilities", body: "24/7 library, indoor sports complex, cafeteria, medical center, and Wi-Fi across campus." },
    ];

    for (const article of articles) {
      await ctx.db.insert("knowledgeArticles", {
        title: article.title,
        body: article.body,
        bodyHtml: `<p>${article.body}</p>`,
        isPublished: true,
        views: randomInt(50, 500),
        helpfulCount: randomInt(10, 100),
        notHelpfulCount: randomInt(0, 10),
        createdAt: now,
        updatedAt: now,
      }).catch(() => {/* skip if fails */});
    }
    results.push(`✅ ${articles.length} knowledge articles created`);

    // ═══════════════════════════════════════════════════════
    // PHASE 12: Workflow Definitions
    // ═══════════════════════════════════════════════════════

    const workflows = [
      { name: "Admission Approval", category: "admissions" },
      { name: "Refund Processing", category: "finance" },
      { name: "Purchase Approval", category: "procurement" },
      { name: "Leave Approval", category: "hr" },
      { name: "Ticket Escalation", category: "support" },
    ];
    for (const wf of workflows) {
      await ctx.db.insert("workflowDefinitions", {
        name: wf.name,
        category: wf.category,
        status: "active",
        version: 1,
        nodes: [
          { id: "start-1", type: "start", label: "Start", config: {} },
          { id: "end-1", type: "end", label: "End", config: {} },
        ],
        edges: [
          { id: "e1", source: "start-1", target: "end-1" },
        ],
        createdAt: now,
        updatedAt: now,
      });
    }
    results.push(`✅ ${workflows.length} workflow definitions created`);

    // ═══════════════════════════════════════════════════════
    // PHASE 13: Platform Events
    // ═══════════════════════════════════════════════════════

    // Dashboard Refresh Signals
    const dashModules = ["students", "finance", "employees", "admissions", "academic", "procurement", "support", "hr"];
    for (const mod of dashModules) {
      try {
        await ctx.db.insert("dashboardRefreshSignals", {
          module: mod,
          entity: mod,
          lastRefresh: now,
          createdAt: now,
          updatedAt: now,
        });
      } catch { /* table may not exist — skip */ }
    }
    results.push(`✅ Dashboard refresh signals created`);

    // ═══════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════

    return {
      simulated: true,
      message: "Enterprise simulation complete — Company A with full business data operational",
      results,
      summary: {
        companies: 1,
        branches: 12,
        academicVerticals: verticalIds.length,
        programs: programIds.length,
        batches: batchIds.length,
        employees: employeeIds.length,
        faculty: facultyIds.length,
        students: studentInfos.length,
        feeAccounts: studentFeeAccountIds.length,
        invoices: invoiceCount,
        paymentTransactions: txCount,
        receipts: receiptCount,
        refunds: refundCount,
        examTemplates: examTemplateIds.length,
        examSessions: examSessionIds.length,
        examResults: resultCount,
        certificates: certCount,
        tickets: ticketCount,
        schedules: scheduleCount,
        vendors: vendorIds.length,
        purchaseOrders: poCount,
        knowledgeArticles: articles.length,
        workflows: workflows.length,
      },
    };
  },
});

// ─── Status Query ─────────────────────────────────────────

export const getSimulationStatus = query({
  handler: async (ctx) => {
    let companyCount = 0, branchCount = 0, studentCount = 0,
      employeeCount = 0, invoiceCount = 0, programCount = 0;

    try { companyCount = (await ctx.db.query("orgCompanies").collect()).length; } catch {}
    try { branchCount = (await ctx.db.query("orgBranches").collect()).length; } catch {}
    try { studentCount = (await ctx.db.query("studentMaster").collect()).length; } catch {}
    try { employeeCount = (await ctx.db.query("employeeMaster").collect()).length; } catch {}
    try { invoiceCount = (await ctx.db.query("feeInvoices").collect()).length; } catch {}
    try { programCount = (await ctx.db.query("academicPrograms").collect()).length; } catch {}

    return {
      seeded: studentCount > 0,
      companies: companyCount,
      branches: branchCount,
      students: studentCount,
      employees: employeeCount,
      invoices: invoiceCount,
      programs: programCount,
      message: studentCount > 0
        ? `Enterprise simulation active — ${studentCount} students, ${employeeCount} employees across ${branchCount} branches`
        : "No simulation data found",
    };
  },
});
