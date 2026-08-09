/**
 * Enterprise Simulation Seed — PATCH-PRODUCTION-004
 *
 * Creates a complete virtual organization (Company A) with:
 *   - 12 branches, 4 academic verticals
 *   - 2,500 students, 180 employees (45 faculty)
 *   - Full business data across 22+ modules
 *
 * Run after schema is deployed:
 *   npx convex run enterpriseSimulation:runEnterpriseSimulation
 *
 * To add supplementary data for Internal Testing modules:
 *   npx convex run enterpriseSimulation:runEnterpriseSimulation '{"mode":"supplement"}'
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Helpers ──────────────────────────────────────────────────

const COLORS = [
  "#1a73e8", "#34a853", "#ea4335", "#fbbc04", "#a855f7",
  "#06b6d4", "#f43f5e", "#10b981", "#6366f1",
];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── MAIN MUTATION ────────────────────────────────────────────

export const runEnterpriseSimulation = mutation({
  args: {
    mode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const r: string[] = [];
    const mode = args.mode ?? "full";

    // ── Check if Company A already exists ─────────────────
    const existingCompanies = await ctx.db.query("orgCompanies").collect();
    const companyA = existingCompanies.find((c: any) => c.code === "COMPA");

    if (mode === "supplement") {
      // ── Supplement mode: add data for Internal Testing modules ──
      if (!companyA) {
        return { simulated: false, message: "Company A not found. Run full mode first." };
      }
      const sup = await runSupplementPhase(ctx, now);
      return { simulated: true, mode: "supplement", summary: sup };
    }

    if (companyA) {
      return {
        simulated: true,
        message: "Company A already exists. Use { mode: \"supplement\" } for extra data.",
      };
    }

    // ────────────────────────────────────────────────────────────
    // Phase 1 — Organization: Company A + 12 Branches
    // ────────────────────────────────────────────────────────────
    const companyId = await ctx.db.insert("orgCompanies", {
      name: "Company A",
      code: "COMPA",
      color: "#1a73e8",
      icon: "Building2",
      legalName: "Company A Private Limited",
      registrationNumber: "CIN-U12345HR2026PTC100001",
      taxNumber: "06AABCU9603R1Z1",
      email: "info@companya.com",
      phone: "+91-124-4567890",
      website: "https://companya.com",
      address: "123 Business Park, Sector 14",
      city: "Gurugram",
      state: "Haryana",
      country: "India",
      displayOrder: 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Simple companies/branches (for employeeMaster, studentMaster references)
    const simpleCompanyId = await ctx.db.insert("companies", {
      name: "Company A",
      code: "COMPA",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    const branchNames = [
      "Gurugram HQ", "Delhi NCR", "Mumbai Andheri", "Bangalore Indiranagar",
      "Pune FC Road", "Hyderabad Hitech", "Chennai Adyar", "Kolkata Salt Lake",
      "Ahmedabad SG Road", "Jaipur MI Road", "Lucknow Gomti Nagar", "Chandigarh Sector 17",
    ];
    const branchIds: string[] = [];
    const orgBranchIds: string[] = [];

    for (const name of branchNames) {
      // Simple branch (for employee/student refs)
      const bid = await ctx.db.insert("branches", {
        name,
        code: name.slice(0, 4).toUpperCase(),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      branchIds.push(bid);
      r.push(`Phase 1: Created branch ${name}`);

      // Org branch (for org-level references)
      const obid = await ctx.db.insert("orgBranches", {
        name,
        code: name.slice(0, 4).toUpperCase(),
        color: randomPick(COLORS),
        icon: "Building2",
        city: name.split(" ")[0],
        state: "Various",
        country: "India",
        displayOrder: branchIds.length,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      orgBranchIds.push(obid);
    }

    // ────────────────────────────────────────────────────────────
    // Phase 2 — Academic Structure: Verticals → Programs → Batches
    // ────────────────────────────────────────────────────────────
    const verticals = ["Engineering", "Management", "Medical", "Commerce"];
    const verticalIds: string[] = [];
    const subVerticalIds: string[] = [];
    for (const name of verticals) {
      const vid = await ctx.db.insert("academicVerticals", {
        name,
        code: name.slice(0, 4).toUpperCase(),
        color: randomPick(COLORS),
        icon: "GraduationCap",
        educationCategory: "degree",
        description: `${name} vertical`,
        displayOrder: verticalIds.length + 1,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      verticalIds.push(vid);
      const svid = await ctx.db.insert("academicSubVerticals", {
        verticalId: vid as any,
        name: `${name} UG`,
        code: `${name.slice(0, 4).toUpperCase()}UG`,
        color: randomPick(COLORS),
        icon: "BookOpen",
        description: `${name} undergraduate programs`,
        displayOrder: 1,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      subVerticalIds.push(svid);
    }

    const programNames = [
      { v: 0, n: "B.Tech Computer Science" },
      { v: 0, n: "B.Tech Mechanical" },
      { v: 0, n: "B.Tech Electronics" },
      { v: 1, n: "MBA Finance" },
      { v: 1, n: "MBA Marketing" },
      { v: 1, n: "BBA" },
      { v: 2, n: "MBBS" },
      { v: 2, n: "BDS" },
      { v: 2, n: "Pharmacy" },
      { v: 3, n: "B.Com" },
      { v: 3, n: "M.Com" },
      { v: 3, n: "B.Sc Economics" },
    ];
    const programIds: string[] = [];
    for (const p of programNames) {
      const pid = await ctx.db.insert("academicPrograms", {
        name: p.n,
        code: p.n.slice(0, 4).toUpperCase().replace(/\s/g, ""),
        subVerticalId: subVerticalIds[p.v] as any,
        programType: "degree",
        duration: randomPick([3, 4, 5]),
        durationUnit: "years",
        deliveryMode: "full_time",
        displayOrder: programIds.length + 1,
        color: randomPick(COLORS),
        icon: "BookOpen",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      programIds.push(pid);
    }

    const batchTypeId = await ctx.db.insert("academicBatchTypes", {
      name: "Regular",
      code: "REG",
      deliveryMode: "full_time",
      timingCategory: "day",
      displayOrder: 1,
      color: randomPick(COLORS),
      icon: "Users",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    const academicSessionId = await ctx.db.insert("academicSessions", {
      name: "Academic Year 2026",
      code: "AY2026",
      academicYear: "2026",
      color: randomPick(COLORS),
      icon: "Calendar",
      startDate: now,
      endDate: now + 365 * 86400000,
      sequence: 1,
      isCurrent: true,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    const batchIds: string[] = [];
    let bSeq = 0;
    for (const pid of programIds) {
      for (const yr of [2024, 2025, 2026]) {
        const bid = await ctx.db.insert("academicBatches", {
          name: `Batch ${yr}`,
          code: `B${yr}`,
          programId: pid as any,
          batchTypeId: batchTypeId as any,
          academicSessionId: academicSessionId as any,
          startDate: now - (2026 - yr) * 365 * 86400000,
          endDate: now + (yr === 2024 ? 4 : 3) * 365 * 86400000,
          sequence: ++bSeq,
          color: randomPick(COLORS),
          icon: "Users",
          active: true,
          createdAt: now,
          updatedAt: now,
        });
        batchIds.push(bid);
      }
    }
    r.push(`Phase 2: ${verticalIds.length} verticals, ${programIds.length} programs, ${batchIds.length} batches`);

    // ────────────────────────────────────────────────────────────
    // Phase 3 — Users & Employees (180 total, 45 faculty)
    // ────────────────────────────────────────────────────────────
    const firstNames = [
      "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Rohit", "Kunal",
      "Rahul", "Amit", "Priya", "Neha", "Ananya", "Shreya", "Divya", "Pooja",
      "Vikram", "Rajesh", "Suresh", "Deepak", "Manish", "Anita", "Sunita", "Kavita",
    ];
    const lastNames = [
      "Sharma", "Verma", "Patel", "Kumar", "Singh", "Gupta", "Reddy", "Joshi",
      "Nair", "Menon", "Das", "Banerjee", "Iyer", "Rao", "Desai", "Malhotra",
    ];

    // Create a system user first
    const systemUserId = await ctx.db.insert("users", {
      name: "System Admin",
      email: "admin@companya.com",
      isActive: true,
      createdAt: now,
    });

    const employeeIds: string[] = [];
    const facultyIds: string[] = [];
    const employeeUserIds: string[] = [];

    for (let i = 0; i < 180; i++) {
      const fn = randomPick(firstNames);
      const ln = randomPick(lastNames);
      const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@companya.com`;
      const branchId = randomPick(branchIds);
      const isFaculty = i < 45;

      // Create user
      const uid = await ctx.db.insert("users", {
        name: `${fn} ${ln}`,
        email,
        role: isFaculty ? "faculty" : i < 70 ? "employee" : i < 80 ? "manager" : i < 90 ? "hr" : "staff",
        isActive: true,
        createdAt: now,
      });
      employeeUserIds.push(uid);

      const personId = await ctx.db.insert("personMaster", {
        firstName: fn,
        lastName: ln,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      const eid = await ctx.db.insert("employeeMaster", {
        employeeCode: `EMP-${String(i + 1).padStart(4, "0")}`,
        personId,
        branchId: branchId as any,
        joiningDate: now - randomInt(30, 730) * 86400000,
        employmentType: "permanent",
        primaryRole: isFaculty ? "employee" : i < 80 ? "employee" : "manager",
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      employeeIds.push(eid);
      if (isFaculty) facultyIds.push(eid);
    }
    r.push(`Phase 3: ${employeeIds.length} employees (${facultyIds.length} faculty)`);

    // ────────────────────────────────────────────────────────────
    // Phase 4 — Students (2,500) + Admissions
    // ────────────────────────────────────────────────────────────
    const studentIds: string[] = [];
    const personIds: string[] = [];
    const admissionIds: string[] = [];
    const studentFirstNames = [
      "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Rohit", "Kunal",
      "Rahul", "Amit", "Neha", "Ananya", "Shreya", "Divya", "Priya", "Pooja",
      "Laksh", "Aryan", "Ishaan", "Reyansh", "Dhruv", "Tanvi", "Isha", "Anika",
      "Avni", "Myra", "Siya", "Kavya", "Navya", "Prisha", "Sara", "Gauri",
    ];
    const studentLastNames = [
      "Verma", "Sharma", "Patel", "Kumar", "Singh", "Gupta", "Reddy", "Joshi",
      "Nair", "Das", "Banerjee", "Iyer", "Rao", "Desai", "Menon", "Pillai",
    ];

    for (let i = 0; i < 2500; i++) {
      const fn = randomPick(studentFirstNames);
      const ln = randomPick(studentLastNames);
      const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@student.com`;
      const branchId = randomPick(branchIds);
      const batchId = randomPick(batchIds);

      const personId = await ctx.db.insert("personMaster", {
        firstName: fn,
        lastName: ln,
        gender: randomPick(["male", "female"]),
        dateOfBirth: now - randomInt(18, 25) * 365 * 86400000,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      personIds.push(personId);

      const sid = await ctx.db.insert("studentMaster", {
        studentCode: `STU-${String(i + 1).padStart(5, "0")}`,
        personId,
        admissionNumber: `ADM-${String(i + 1).padStart(5, "0")}`,
        firstName: fn,
        lastName: ln,
        phone: `+91-98765${String(50000 + i).slice(1)}`,
        branchId: branchId as any,
        batchId: batchId as any,
        enrollmentDate: now,
        currentStatus: "active",
        createdBy: systemUserId,
        createdAt: now,
        updatedAt: now,
      });
      studentIds.push(sid);

      // Create admission
      const aid = await ctx.db.insert("admissions", {
        studentId: sid as any,
        batchId: batchId as any,
        admissionDate: now - randomInt(30, 365) * 86400000,
        admissionType: randomPick(["regular", "management", "scholarship"]),
        status: "admitted",
        createdAt: now,
        updatedAt: now,
      });
      admissionIds.push(aid);
    }
    r.push(`Phase 4: ${studentIds.length} students with admissions`);

    // ────────────────────────────────────────────────────────────
    // Phase 5 — Finance: Fee Invoices, Payments, Receipts, Refunds
    // ────────────────────────────────────────────────────────────
    const usersId = systemUserId as any;
    let inv = 0, tx = 0, rc = 0, ref = 0;

    for (let i = 0; i < 2500 && i < studentIds.length; i++) {
      let feeAccountId: any = null;
      if (i < 600) {
        try {
          const invAmount = randomPick([50000, 75000, 100000, 150000, 200000]);
          const invStatus = randomPick(["paid", "pending", "overdue", "partial"]);
          const paidAmount = invStatus === "paid" ? invAmount : invStatus === "partial" ? Math.round(invAmount / 2) : 0;
          feeAccountId = await ctx.db.insert("studentFeeAccounts", {
            studentId: studentIds[i] as any,
            totalFee: invAmount,
            totalPaid: paidAmount,
            outstandingBalance: invAmount - paidAmount,
            totalDiscount: 0,
            totalScholarship: 0,
            totalWaiver: 0,
            installmentsCount: 2,
            installmentFrequency: "half_yearly",
            status: "active",
            createdBy: usersId,
          });
          await ctx.db.insert("feeInvoices", {
            studentId: studentIds[i] as any,
            feeAccountId,
            invoiceNumber: `INV-${String(inv + 1).padStart(6, "0")}`,
            invoiceDate: now - randomInt(1, 180) * 86400000,
            dueDate: now + randomInt(15, 90) * 86400000,
            lineItems: JSON.stringify([{ description: "Tuition Fee", amount: invAmount }]),
            subtotal: invAmount,
            discountAmount: 0,
            taxAmount: 0,
            totalAmount: invAmount,
            paidAmount,
            balanceDue: invAmount - paidAmount,
            status: invStatus as any,
            createdBy: usersId,
          });
          inv++;
        } catch { /* skip */ }
      }

      if (i < 500) {
        try {
          const txId = await ctx.db.insert("paymentTransactions", {
            studentId: studentIds[i] as any,
            feeAccountId: feeAccountId as any,
            transactionNumber: `TXN-${String(tx + 1).padStart(6, "0")}`,
            amount: randomPick([25000, 50000, 75000, 100000]),
            paymentMethod: randomPick(["cash", "online", "cheque", "bank_transfer"]),
            paymentDate: now - randomInt(1, 90) * 86400000,
            status: "completed",
            createdBy: usersId,
          });
          tx++;

          if (i < 400) {
            try {
              await ctx.db.insert("receipts", {
                studentId: studentIds[i] as any,
                paymentTransactionId: txId as any,
                receiptNumber: `RCP-${String(rc + 1).padStart(6, "0")}`,
                amount: randomPick([25000, 50000, 75000, 100000]),
                receiptDate: now - randomInt(1, 60) * 86400000,
                status: "issued",
                createdBy: usersId,
                createdAt: now,
              });
              rc++;
            } catch { /* skip */ }
          }
        } catch { /* skip */ }
      }

      if (i >= 200 && i < 280) {
        try {
          await ctx.db.insert("refundRequests", {
            studentId: studentIds[i] as any,
            amount: randomPick([10000, 25000, 50000, 75000]),
            reason: randomPick(["Course withdrawal", "Duplicate payment", "Scholarship adjustment", "Fee reduction"]),
            reasonCategory: "withdrawal",
            status: randomPick(["approved", "pending", "processing", "completed"]),
            createdBy: usersId,
            approvedBy: ref % 3 === 0 ? usersId : undefined,
            createdAt: now - randomInt(1, 60) * 86400000,
            updatedAt: now,
          });
          ref++;
        } catch { /* skip */ }
      }
    }
    r.push(`Phase 5: ${inv} invoices, ${tx} payments, ${rc} receipts, ${ref} refunds`);

    // ────────────────────────────────────────────────────────────
    // Phase 6 — Academic Operations: Exams, Results, Certificates
    // ────────────────────────────────────────────────────────────
    const examTemplateId = await ctx.db.insert("examTemplates", {
      name: "Semester Final",
      code: "SF",
      examType: "final_exam",
      maxMarks: 100,
      passPercentage: 40,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    const esids: string[] = [];
    for (let i = 0; i < 10; i++) {
      try {
        const eid = await ctx.db.insert("examSessions", {
          templateId: examTemplateId as any,
          academicSessionId: academicSessionId as any,
          branchId: orgBranchIds[i % orgBranchIds.length] as any,
          name: `Semester ${(i % 6) + 1} Final Exam`,
          startDate: now - randomInt(30, 180) * 86400000,
          status: "completed",
          createdAt: now,
          updatedAt: now,
        });
        esids.push(eid);
      } catch { /* skip */ }
    }

    let rs = 0;
    for (const eid of esids) {
      for (let j = 0; j < 100 && j < studentIds.length; j++) {
        try {
          await ctx.db.insert("examResults", {
            examSessionId: eid as any,
            studentId: personIds[j] as any,
            marksObtained: randomInt(30, 100),
            totalMarks: 100,
            percentage: randomInt(30, 100),
            grade: randomPick(["A+", "A", "B+", "B", "C+", "C", "D", "F"]),
            division: randomPick(["distinction", "first", "second", "third", "fail"]),
            passFail: "pass",
            calculatedAt: now,
            publishedAt: now,
            publishedBy: usersId,
            createdAt: now,
            updatedAt: now,
          });
          rs++;
        } catch { /* skip */ }
      }
    }
    r.push(`Phase 6: ${esids.length} exams, ${rs} results`);

    let cert = 0;
    for (let i = 0; i < 100 && i < studentIds.length; i++) {
      try {
        await ctx.db.insert("examCertificates", {
          studentId: personIds[i] as any,
          examSessionId: esids.length > 0 ? (esids[0] as any) : undefined,
          certificateNumber: `CERT-${String(cert + 1).padStart(6, "0")}`,
          certificateType: randomPick(["merit_certificate", "participation", "rank_certificate", "passing_certificate"]),
          title: "Certificate of Participation",
          issuedDate: now - randomInt(1, 90) * 86400000,
          issuedBy: usersId,
          createdAt: now,
          updatedAt: now,
        });
        cert++;
      } catch { /* skip */ }
    }
    r.push(`Phase 6: ${cert} certificates`);

    // ────────────────────────────────────────────────────────────
    // Phase 7 — Support Tickets (160)
    // ────────────────────────────────────────────────────────────
    let tix = 0;
    for (let i = 0; i < 160 && i < studentIds.length; i++) {
      try {
        await ctx.db.insert("ticketMaster", {
          ticketNumber: `SVC-${String(tix + 1).padStart(4, "0")}`,
          title: randomPick(["Laptop issue", "Fee query", "Attendance correction", "Password reset", "Library fine", "Exam schedule", "Hostel complaint", "Transport issue"]),
          description: `Support ticket ${i + 1}`,
          type: "support",
          category: randomPick(["hardware", "software", "finance", "academic", "facility"]),
          priority: randomPick(["low", "medium", "high", "critical"]),
          status: randomPick(["new", "open", "in_progress", "resolved", "closed"]),
          requesterId: employeeUserIds[i % employeeUserIds.length] as any,
          assignedTo: employeeUserIds[(i + 1) % employeeUserIds.length] as any,
          branchId: branchIds[i % branchIds.length] as any,
          createdAt: now - randomInt(1, 180) * 86400000,
          updatedAt: now,
        });
        tix++;
      } catch { /* skip */ }
    }
    r.push(`Phase 7: ${tix} support tickets`);

    // ────────────────────────────────────────────────────────────
    // Phase 8 — Scheduling (200 events)
    // ────────────────────────────────────────────────────────────
    let sc = 0;

    // Guarantee every calendar module has at least one seeded schedule.
    // Module ids align with the lib/schedule-modules taxonomy.
    const moduleCoverageSchedules: { title: string; scheduleType: string }[] = [
      { title: "Faculty Lecture", scheduleType: "class" },               // Academic
      { title: "Faculty Office Hours", scheduleType: "office_hours" },   // HR
      { title: "Fee Payment Run", scheduleType: "payment_run" },         // Finance
      { title: "Admissions Campaign Kickoff", scheduleType: "campaign" }, // Marketing
      { title: "Counsellor Demo Session", scheduleType: "counseling" },  // Sales
      { title: "Campus Maintenance", scheduleType: "maintenance" },      // Facility
      { title: "Midterm Exam", scheduleType: "exam" },                   // Exams
      { title: "Staff Training Workshop", scheduleType: "workshop" },    // Training
      { title: "Operations Standup", scheduleType: "meeting" },          // Operations
    ];
    for (let c = 0; c < moduleCoverageSchedules.length; c++) {
      try {
        await ctx.db.insert("schedules", {
          title: moduleCoverageSchedules[c].title,
          description: `Module coverage schedule (${moduleCoverageSchedules[c].scheduleType})`,
          scheduleType: moduleCoverageSchedules[c].scheduleType,
          status: "scheduled",
          start: now + (c + 1) * 86400000,
          end: now + (c + 1) * 86400000 + 3600000,
          timezone: "Asia/Kolkata",
          owner: employeeUserIds[c % employeeUserIds.length] as any,
          branchId: branchIds[c % branchIds.length] as any,
          createdAt: now,
          updatedAt: now,
        });
        sc++;
      } catch { /* skip */ }
    }
    r.push(`Module coverage: ${moduleCoverageSchedules.length} schedules across all modules`);

    for (let i = 0; i < 200; i++) {
      try {
        await ctx.db.insert("schedules", {
          title: randomPick(["Lecture", "Lab Session", "Meeting", "Workshop", "Seminar", "Exam", "Counseling", "Event"]),
          description: `Schedule event ${i + 1}`,
          scheduleType: randomPick([
            "class", "lecture", "lab", "meeting", "exam", "workshop",
            "interview", "office_hours", "holiday",
            "payment_run", "budget_review", "campaign", "event",
            "counseling", "maintenance",
          ]),
          status: randomPick(["scheduled", "in_progress", "completed", "cancelled"]),
          start: now + randomInt(1, 90) * 86400000,
          end: now + randomInt(1, 90) * 86400000 + 3600000,
          timezone: "Asia/Kolkata",
          owner: employeeUserIds[i % employeeUserIds.length] as any,
          branchId: branchIds[i % branchIds.length] as any,
          createdAt: now,
          updatedAt: now,
        });
        sc++;
      } catch { /* skip */ }
    }
    r.push(`Phase 8: ${sc} schedule events`);

    // ────────────────────────────────────────────────────────────
    // Phase 9 — Procurement: Vendors + Purchase Orders
    // ────────────────────────────────────────────────────────────
    const vendorNames = [
      "TechSupply India", "EduBooks Pvt Ltd", "Campus Furniture Co",
      "Lab Equipment Solutions", "Office Essentials", "IT Hardware Pro",
      "Stationery World", "Cleaning Services Inc",
    ];
    const vids: string[] = [];
    for (const vname of vendorNames) {
      try {
        const vid = await ctx.db.insert("vendorMaster", {
          vendorName: vname,
          vendorCode: vname.slice(0, 4).toUpperCase(),
          email: `contact@${vname.toLowerCase().replace(/\s/g, "")}.com`,
          phone: `+91-98100${String(vids.length + 1).padStart(5, "0")}`,
          contactPerson: randomPick(firstNames) + " " + randomPick(lastNames),
          status: "active",
          createdBy: usersId,
          createdAt: now,
          updatedAt: now,
        });
        vids.push(vid);
      } catch { /* skip */ }
    }

    let po = 0;
    for (let i = 0; i < 30 && vids.length > 0; i++) {
      try {
        await ctx.db.insert("purchaseOrders", {
          vendorId: vids[i % vids.length] as any,
          poNumber: `PO-${String(po + 1).padStart(5, "0")}`,
          orderDate: now - randomInt(1, 90) * 86400000,
          expectedDelivery: now + randomInt(1, 30) * 86400000,
          subtotal: randomPick([25000, 50000, 100000, 250000]),
          taxAmount: 0,
          totalAmount: randomPick([25000, 50000, 100000, 250000]),
          status: randomPick(["draft", "approved", "received", "cancelled"]),
          branchId: branchIds[i % branchIds.length] as any,
          createdBy: usersId,
          createdAt: now,
          updatedAt: now,
        });
        po++;
      } catch { /* skip */ }
    }

    const warehouseId = await ctx.db.insert("warehouses", {
      name: "Central Warehouse",
      code: "WH1",
      branchId: branchIds[0] as any,
      location: "Gurugram",
      type: "warehouse",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    let it = 0;
    for (const item of ["Projector", "Whiteboard", "Desk", "Chair", "Computer", "Printer", "Scanner", "Server", "Router", "AC Unit", "Fan", "Water Cooler"]) {
      try {
        await ctx.db.insert("inventoryItems", {
          name: item,
          sku: `SKU-${item.slice(0, 4).toUpperCase()}`,
          unit: "pcs",
          unitPrice: randomPick([500, 1000, 5000, 10000, 50000]),
          minStock: 10,
          maxStock: 100,
          reorderLevel: 10,
          currentStock: randomInt(10, 100),
          quantity: randomInt(10, 100),
          branchId: branchIds[0] as any,
          warehouseId,
          isActive: true,
          createdBy: usersId,
          createdAt: now,
          updatedAt: now,
        });
        it++;
      } catch { /* skip */ }
    }
    r.push(`Phase 9: ${vids.length} vendors, ${po} POs, ${it} inventory items`);

    // ────────────────────────────────────────────────────────────
    // Phase 10 — Knowledge Articles (10)
    // ────────────────────────────────────────────────────────────
    const articles = [
      { t: "Fee Payment Guide", b: "Step-by-step guide to paying fees online." },
      { t: "Attendance Policy", b: "Minimum 75% attendance required for semester exams." },
      { t: "Exam Registration", b: "Register through the student portal 30 days before exams." },
      { t: "Library Rules", b: "Borrowing limits: 5 books for 14 days." },
      { t: "Hostel Guidelines", b: "Residents must follow curfew timings." },
      { t: "Transfer Certificate", b: "Request TC through the student portal." },
      { t: "Scholarship Programs", b: "Merit scholarships covering 25-100% of tuition." },
      { t: "IT Support Guide", b: "Contact IT Helpdesk at ext. 2001 for common issues." },
      { t: "Parent Portal Guide", b: "Track attendance, fees, homework through portal." },
      { t: "Campus Facilities", b: "24/7 library, sports complex, cafeteria, Wi-Fi." },
    ];
    let kc = 0;
    for (const a of articles) {
      try {
        await ctx.db.insert("knowledgeArticles", {
          title: a.t,
          body: a.b,
          bodyHtml: `<p>${a.b}</p>`,
          isPublished: true,
          views: randomInt(50, 500),
          helpfulCount: randomInt(10, 100),
          notHelpfulCount: randomInt(0, 10),
          createdAt: now,
          updatedAt: now,
        });
        kc++;
      } catch { /* skip */ }
    }

    // ────────────────────────────────────────────────────────────
    // Phase 11 — Workflow Definitions (5)
    // ────────────────────────────────────────────────────────────
    const workflowDefs = [
      { n: "Admission Approval", c: "admissions" },
      { n: "Refund Processing", c: "finance" },
      { n: "Purchase Approval", c: "procurement" },
      { n: "Leave Approval", c: "hr" },
      { n: "Ticket Escalation", c: "support" },
    ];
    let wfc = 0;
    for (const w of workflowDefs) {
      try {
        await ctx.db.insert("workflowDefinitions", {
          name: w.n,
          category: w.c,
          status: "active",
          version: 1,
          nodes: [
            { id: "s1", type: "start", label: "Start", config: {} },
            { id: "e1", type: "end", label: "End", config: {} },
          ],
          edges: [{ id: "eg1", source: "s1", target: "e1" }],
          createdAt: now,
          updatedAt: now,
        });
        wfc++;
      } catch { /* skip */ }
    }
    r.push(`Phase 10-11: ${kc} articles, ${wfc} workflows`);

    // ────────────────────────────────────────────────────────────
    // Phases 12-18: Supplementary data for Internal Testing modules
    // ────────────────────────────────────────────────────────────
    const sup = await runSupplementPhase(ctx, now);
    r.push(`Phase 12-18: ${sup.fixedAssets} assets, ${sup.documents} docs, ${sup.pdcs} PDCs, ${sup.payroll} payroll, ${sup.campaigns} campaigns`);
    r.push(`             ${sup.journalEntries} journal entries, ${sup.cashBookEntries} cash book, ${sup.creditNotes} credit notes, ${sup.vendorBills} vendor bills`);

    // ── Return summary ──────────────────────────────────────────
    return {
      simulated: true,
      message: "Company A seeded with full business data",
      results: r,
      summary: {
        companies: 1,
        branches: branchIds.length,
        verticals: verticalIds.length,
        programs: programIds.length,
        batches: batchIds.length,
        employees: employeeIds.length,
        faculty: facultyIds.length,
        students: studentIds.length,
        invoices: inv,
        payments: tx,
        receipts: rc,
        refunds: ref,
        examSessions: esids.length,
        results: rs,
        certificates: cert,
        tickets: tix,
        schedules: sc,
        vendors: vids.length,
        purchaseOrders: po,
        articles: kc,
        workflows: wfc,
        ...sup,
      },
    };
  },
});

// ─── Supplementary Phase: Data for 9 Internal Testing modules ──

async function runSupplementPhase(ctx: any, now: number) {
  const users = await ctx.db.query("users").collect();
  const usersId = users.length > 0 ? users[0]._id : "";
  const userIds = users.map((u: any) => u._id);
  const students = await ctx.db.query("studentMaster").collect();
  const employees = await ctx.db.query("employeeMaster").collect();
  const branches = await ctx.db.query("branches").collect();
  const branchIds = branches.map((b: any) => b._id);
  const studentIds = students.map((s: any) => s._id);
  const employeeIds = employees.map((e: any) => e._id);

  function rp<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function ri(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  let je = 0, cbe = 0, cne = 0, vbe = 0, pdce = 0, dos = 0, fae = 0, cpe = 0, pye = 0;

  // Journal Entries (30)
  for (let i = 0; i < 30; i++) {
    try {
      await ctx.db.insert("journalEntries", {
        entryNumber: `JE-${String(je + 1).padStart(5, "0")}`,
        entryDate: now - ri(1, 180) * 86400000,
        description: rp(["Fee collection", "Refund", "Expense", "Salary", "Vendor payment"]),
        debitAccount: rp(["1100-Cash", "1200-Bank", "1300-Receivables"]),
        creditAccount: rp(["4100-Fee Income", "5100-Salary", "5200-Expense"]),
        amount: rp([25000, 50000, 100000, 250000, 500000]),
        status: "posted",
        createdBy: usersId,
        createdAt: now,
        updatedAt: now,
      });
      je++;
    } catch { /* skip */ }
  }

  // Cash Book Entries (30)
  for (let i = 0; i < 30; i++) {
    try {
      await ctx.db.insert("cashBookEntries", {
        entryNumber: `CB-${String(cbe + 1).padStart(5, "0")}`,
        entryDate: now - ri(1, 60) * 86400000,
        entryType: rp(["debit", "credit"]) as any,
        amount: rp([5000, 10000, 25000, 50000]),
        description: rp(["Fee", "Expense", "Refund", "Transfer"]),
        category: rp(["fee_collection", "expense", "refund", "transfer"]) as any,
        paymentMode: rp(["cash", "bank_transfer", "cheque"]),
        balanceAfter: rp([50000, 100000, 250000]),
        createdBy: usersId,
        createdAt: now,
      });
      cbe++;
    } catch { /* skip */ }
  }

  // Credit Notes (20)
  for (let i = 0; i < 20 && i < studentIds.length; i++) {
    try {
      await ctx.db.insert("creditNotes", {
        creditNoteNumber: `CN-${String(cne + 1).padStart(5, "0")}`,
        studentId: studentIds[i],
        amount: rp([5000, 10000, 15000, 25000]),
        reason: rp(["Fee adjustment", "Discount", "Scholarship", "Correction"]),
        status: "issued",
        createdBy: usersId,
        createdAt: now,
        updatedAt: now,
      });
      cne++;
    } catch { /* skip */ }
  }

  // Vendor Bills (20)
  for (let i = 0; i < 20; i++) {
    try {
      await ctx.db.insert("vendorBills", {
        vendorName: rp(["TechSupply", "EduBooks", "Campus Furniture", "Lab Equipment"]),
        billNumber: `BILL-${String(vbe + 1).padStart(5, "0")}`,
        billDate: now - ri(1, 90) * 86400000,
        dueDate: now + ri(1, 30) * 86400000,
        amount: rp([15000, 25000, 50000, 100000]),
        paidAmount: 0,
        balanceDue: rp([15000, 25000, 50000]),
        description: rp(["Supplies", "Equipment", "Maintenance"]),
        status: "pending",
        createdBy: usersId,
        createdAt: now,
        updatedAt: now,
      });
      vbe++;
    } catch { /* skip */ }
  }

  // PDC/Cheques (50)
  const banks = ["SBI", "HDFC", "ICICI", "Axis", "PNB", "Yes Bank"];
  for (let i = 0; i < 50 && i < studentIds.length; i++) {
    try {
      await ctx.db.insert("payment_pdcs", {
        leadId: studentIds[i],
        chequeNumber: `CHQ-${String(10000 + i).slice(1)}`,
        bank: rp(banks),
        chequeDate: now + ri(1, 90) * 86400000,
        amount: rp([10000, 25000, 50000, 75000, 100000]),
        status: rp(["scheduled", "deposited", "cleared", "bounced"]),
        depositDate: now - ri(1, 30) * 86400000,
        bounceReason: "",
        createdBy: usersId,
        createdAt: now,
        updatedAt: now,
      });
      pdce++;
    } catch { /* skip */ }
  }

  // Document Folders
  const folders = ["Academic Records", "Finance Documents", "HR Documents", "Student Reports", "Administration"];
  const fids: string[] = [];
  for (const n of folders) {
    try {
      const fid = await ctx.db.insert("documentFolders", {
        name: n,
        isActive: true,
        createdBy: usersId,
        createdAt: now,
        updatedAt: now,
      });
      fids.push(fid);
    } catch { /* skip */ }
  }

  // Documents (20)
  for (let i = 0; i < 20 && fids.length > 0; i++) {
    try {
      await ctx.db.insert("documents", {
        name: `${rp(["Report", "Invoice", "Certificate", "Agreement"])} ${i + 1}`,
        description: `Sample document ${i + 1}`,
        fileUrl: `https://storage.example.com/docs/doc-${i + 1}.pdf`,
        fileType: "pdf",
        fileSize: ri(10000, 500000),
        mimeType: "application/pdf",
        version: 1,
        folderId: rp(fids),
        isArchived: false,
        uploadedBy: usersId,
        downloadCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      dos++;
    } catch { /* skip */ }
  }

  // Fixed Assets (15)
  const acNames = ["IT Equipment", "Furniture", "Vehicles", "Lab Equipment", "Building"];
  const acs: string[] = [];
  for (const n of acNames) {
    try {
      const ac = await ctx.db.insert("assetCategories", {
        name: n,
        code: n.slice(0, 3).toUpperCase(),
        depreciationMethod: "straight_line",
        usefulLifeYears: n === "IT Equipment" ? 3 : n === "Vehicles" ? 5 : 10,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      acs.push(ac);
    } catch { /* skip */ }
  }

  for (let i = 0; i < 15 && acs.length > 0; i++) {
    try {
      await ctx.db.insert("fixedAssets", {
        name: `${rp(["Laptop", "Desktop", "Projector", "Printer", "Server"])} ${i + 1}`,
        assetCode: `AST-${String(i + 1).padStart(4, "0")}`,
        categoryId: rp(acs),
        purchaseDate: now - ri(180, 730) * 86400000,
        purchaseCost: rp([50000, 100000, 250000, 500000]),
        currentValue: rp([25000, 50000, 150000, 300000]),
        salvageValue: rp([5000, 10000, 25000]),
        accumulatedDepreciation: rp([5000, 10000, 25000, 50000]),
        usefulLifeYears: ri(3, 10),
        branchId: rp(branchIds),
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      fae++;
    } catch { /* skip */ }
  }

  // Marketing Campaigns (8)
  const campaignNames = [
    "Summer Drive 2026", "Open House", "Scholarship Blast", "Early Bird Offer",
    "Referral Program", "Social Media Push", "Webinar Series", "Campus Tour",
  ];
  for (const name of campaignNames) {
    try {
      await ctx.db.insert("crmUtmCampaigns", {
        name,
        code: name.slice(0, 4).toUpperCase(),
        campaignTypeId: "",
        description: `${name} campaign`,
        color: rp(COLORS),
        icon: "Megaphone",
        sequence: cpe + 1,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
      cpe++;
    } catch { /* skip */ }
  }

  // Payroll (50)
  for (let i = 0; i < 50 && i < employeeIds.length; i++) {
    try {
      await ctx.db.insert("payrollEntries", {
        employeeId: employeeIds[i],
        baseSalary: rp([25000, 35000, 50000, 75000]),
        allowances: rp([5000, 10000, 15000]),
        deductions: rp([2000, 5000, 8000]),
        netPay: rp([28000, 40000, 57000, 82000]),
        payPeriod: "2026-07",
        status: "paid",
        createdAt: now - ri(1, 60) * 86400000,
        updatedAt: now,
      });
      pye++;
    } catch { /* skip */ }
  }

  // Module-coverage schedules — one per calendar module (lib/schedule-modules).
  // Guarded so re-running supplement mode does not duplicate them.
  const coverageExists = await ctx.db.query("schedules")
    .filter((q: any) => q.eq(q.field("description"), "Module coverage schedule (class)"))
    .first();
  let msc = 0;
  if (!coverageExists) {
    const moduleCoverageSchedules: { title: string; scheduleType: string }[] = [
      { title: "Faculty Lecture", scheduleType: "class" },               // Academic
      { title: "Faculty Office Hours", scheduleType: "office_hours" },   // HR
      { title: "Fee Payment Run", scheduleType: "payment_run" },         // Finance
      { title: "Admissions Campaign Kickoff", scheduleType: "campaign" }, // Marketing
      { title: "Counsellor Demo Session", scheduleType: "counseling" },  // Sales
      { title: "Campus Maintenance", scheduleType: "maintenance" },      // Facility
      { title: "Midterm Exam", scheduleType: "exam" },                   // Exams
      { title: "Staff Training Workshop", scheduleType: "workshop" },    // Training
      { title: "Operations Standup", scheduleType: "meeting" },          // Operations
    ];
    for (let c = 0; c < moduleCoverageSchedules.length; c++) {
      try {
        await ctx.db.insert("schedules", {
          title: moduleCoverageSchedules[c].title,
          description: `Module coverage schedule (${moduleCoverageSchedules[c].scheduleType})`,
          scheduleType: moduleCoverageSchedules[c].scheduleType,
          status: "scheduled",
          start: now + (c + 1) * 86400000,
          end: now + (c + 1) * 86400000 + 3600000,
          timezone: "Asia/Kolkata",
          owner: userIds[c % userIds.length] as any,
          branchId: branchIds[c % branchIds.length] as any,
          createdAt: now,
          updatedAt: now,
        });
        msc++;
      } catch { /* skip */ }
    }
  }

  return {
    journalEntries: je,
    cashBookEntries: cbe,
    creditNotes: cne,
    vendorBills: vbe,
    pdcs: pdce,
    folders: fids.length,
    documents: dos,
    fixedAssets: fae,
    campaigns: cpe,
    payroll: pye,
    moduleSchedules: msc,
  };
}

// ─── Simulation Status Query ──────────────────────────────────

export const getSimulationStatus = query({
  handler: async (ctx) => {
    let co = 0, br = 0, st = 0, em = 0, iv = 0;
    try { co = (await ctx.db.query("orgCompanies").collect()).length; } catch { /* skip */ }
    try { br = (await ctx.db.query("orgBranches").collect()).length; } catch { /* skip */ }
    try { st = (await ctx.db.query("studentMaster").collect()).length; } catch { /* skip */ }
    try { em = (await ctx.db.query("employeeMaster").collect()).length; } catch { /* skip */ }
    try { iv = (await ctx.db.query("feeInvoices").collect()).length; } catch { /* skip */ }
    return {
      seeded: st > 0,
      companies: co,
      branches: br,
      students: st,
      employees: em,
      invoices: iv,
      message: st > 0
        ? `Simulation active — ${st} students, ${em} employees, ${br} branches`
        : "No simulation data",
    };
  },
});
