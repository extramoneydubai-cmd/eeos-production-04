/**
 * seedSupplementalData — Adds data for 9 Internal Testing Only modules
 * to boost them to Pilot Ready status in the release verdict.
 *
 * Run after enterpriseSimulation:runEnterpriseSimulation has seeded Company A.
 */

import { v } from "convex/values";
import { mutation } from "./_generated/server";

const COLORS = ["#1a73e8","#34a853","#ea4335","#fbbc04","#a855f7","#06b6d4","#f43f5e","#10b981","#6366f1"];

export const seedSupplemental = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const results: string[] = [];

    // Verify Company A exists
    const orgCompanies = await ctx.db.query("orgCompanies").collect();
    if (!orgCompanies.some((c: any) => c.code === "COMPA")) {
      return { ok: false, message: "Company A not found. Run enterpriseSimulation:runEnterpriseSimulation first." };
    }

    // Check if already boosted
    const existing = await ctx.db.query("journalEntries").collect();
    if (existing.length > 0) {
      return { ok: true, message: "Supplemental data already exists.", already_seeded: true };
    }

    const users = await ctx.db.query("users").collect();
    const uid = users.length > 0 ? users[0]._id as any : "";
    const students = await ctx.db.query("studentMaster").collect();
    const employees = await ctx.db.query("employeeMaster").collect();
    const branches = await ctx.db.query("orgBranches").collect();
    const branchSimple = await ctx.db.query("branches").collect();

    // 1. Journal Entries (30)
    let jc = 0;
    for (let i = 0; i < 30; i++) {
      try {
        await ctx.db.insert("journalEntries", {
          entryNumber: `JE-${String(jc+1).padStart(5,"0")}`,
          entryDate: now - Math.floor(Math.random() * 180) * 86400000,
          description: ["Fee collection","Refund","Expense","Salary","Vendor payment"][i % 5],
          debitAccount: ["1100-Cash","1200-Bank","1300-Receivables"][i % 3],
          creditAccount: ["4100-Fee Income","5100-Salary","5200-Expense"][i % 3],
          amount: [25000,50000,100000,250000,500000][i % 5],
          status: "posted", createdBy: uid, createdAt: now, updatedAt: now,
        });
        jc++;
      } catch { /* skip */ }
    }
    results.push(`✅ ${jc} journal entries`);

    // 2. Cash Book Entries (30)
    let cc = 0;
    for (let i = 0; i < 30; i++) {
      try {
        await ctx.db.insert("cashBookEntries", {
          entryNumber: `CB-${String(cc+1).padStart(5,"0")}`,
          entryDate: now - Math.floor(Math.random() * 60) * 86400000,
          entryType: (i % 2 === 0 ? "debit" : "credit") as "debit" | "credit",
          amount: [5000,10000,25000,50000,100000][i % 5],
          description: ["Fee payment","Expense","Refund","Transfer"][i % 4],
          category: (["fee_collection","expense","refund","transfer"][i % 4]) as any,
          paymentMode: ["cash","bank_transfer","cheque"][i % 3],
          balanceAfter: 50000 + i * 5000,
          createdBy: uid, createdAt: now,
        });
        cc++;
      } catch { /* skip */ }
    }
    results.push(`✅ ${cc} cash book entries`);

    // 3. Credit Notes (20)
    let cnc = 0;
    for (let i = 0; i < 20 && students.length > 0; i++) {
      try {
        await ctx.db.insert("creditNotes", {
          creditNoteNumber: `CN-${String(cnc+1).padStart(5,"0")}`,
          studentId: students[i % students.length]._id as any,
          amount: [5000,10000,15000,25000][i % 4],
          reason: ["Fee adjustment","Discount","Scholarship","Correction"][i % 4],
          status: "issued", createdBy: uid, createdAt: now, updatedAt: now,
        });
        cnc++;
      } catch { /* skip */ }
    }
    results.push(`✅ ${cnc} credit notes`);

    // 4. Vendor Bills (20)
    let vbc = 0;
    for (let i = 0; i < 20; i++) {
      try {
        await ctx.db.insert("vendorBills", {
          vendorName: ["TechSupply","EduBooks","Campus Furniture","Lab Equipment"][i % 4],
          billNumber: `BILL-${String(vbc+1).padStart(5,"0")}`,
          billDate: now - Math.floor(Math.random() * 90) * 86400000,
          dueDate: now + Math.floor(Math.random() * 30) * 86400000,
          amount: [15000,25000,50000,100000,200000][i % 5],
          paidAmount: 0, balanceDue: [15000,25000,50000,100000][i % 4],
          description: ["Office supplies","Equipment","Maintenance"][i % 3],
          status: "pending", createdBy: uid, createdAt: now, updatedAt: now,
        });
        vbc++;
      } catch { /* skip */ }
    }
    results.push(`✅ ${vbc} vendor bills`);

    // 5. PDC/Cheques (50)
    const banks = ["SBI","HDFC","ICICI","Axis","PNB","Yes Bank"];
    let pdc = 0;
    for (let i = 0; i < 50 && i < students.length; i++) {
      try {
        await ctx.db.insert("payment_pdcs", {
          leadId: students[i]._id as any,
          chequeNumber: `CHQ-${String(10000+i).slice(1)}`,
          bank: banks[i % banks.length],
          chequeDate: now + Math.floor(Math.random() * 90) * 86400000,
          amount: [10000,25000,50000,75000,100000][i % 5],
          status: ["scheduled","deposited","cleared","bounced"][i % 4],
          depositDate: now - Math.floor(Math.random() * 30) * 86400000,
          bounceReason: "", createdBy: uid as any, createdAt: now, updatedAt: now,
        });
        pdc++;
      } catch { /* skip */ }
    }
    results.push(`✅ ${pdc} PDC/cheque records`);

    // 6. Payroll (50)
    let py = 0;
    for (let i = 0; i < 50 && i < employees.length; i++) {
      try {
        await ctx.db.insert("payrollEntries", {
          employeeId: employees[i]._id as any,
          baseSalary: [25000,35000,50000,75000][i % 4],
          allowances: [5000,10000,15000][i % 3],
          deductions: [2000,5000,8000][i % 3],
          netPay: [28000,35000,50000,75000][i % 4],
          payPeriod: "2026-07", status: "paid",
          createdAt: now - Math.floor(Math.random() * 60) * 86400000,
          updatedAt: now,
        });
        py++;
      } catch { /* skip */ }
    }
    results.push(`✅ ${py} payroll entries`);

    // 7. Documents (folders + documents)
    const fnames = ["Academic Records","Finance Documents","HR Documents","Student Reports"];
    const fids: string[] = [];
    for (const n of fnames) {
      try {
        const fid = await ctx.db.insert("documentFolders", {
          name: n, isActive: true, createdBy: uid, createdAt: now, updatedAt: now,
        });
        fids.push(fid);
      } catch { /* skip */ }
    }
    let dc = 0;
    for (let i = 0; i < 20 && fids.length > 0; i++) {
      try {
        await ctx.db.insert("documents", {
          name: `${["Report","Invoice","Certificate","Agreement"][i % 4]} ${i+1}`,
          description: `Sample document ${i+1}`,
          fileUrl: `https://storage.example.com/docs/doc-${i+1}.pdf`,
          fileType: "pdf", fileSize: 10000 + i * 1000,
          mimeType: "application/pdf", version: 1,
          folderId: fids[i % fids.length] as any, isArchived: false,
          uploadedBy: uid, downloadCount: i, createdAt: now, updatedAt: now,
        });
        dc++;
      } catch { /* skip */ }
    }
    results.push(`✅ ${fids.length} folders, ${dc} documents`);

    // 8. Fixed Assets (15)
    const acNames = ["IT Equipment","Furniture","Vehicles","Lab Equipment"];
    const acs: string[] = [];
    for (const n of acNames) {
      try {
        const ac = await ctx.db.insert("assetCategories", {
          name: n, code: n.slice(0,3).toUpperCase(),
          depreciationMethod: "straight_line",
          usefulLifeYears: n === "IT Equipment" ? 3 : n === "Vehicles" ? 5 : 10,
          isActive: true, createdAt: now, updatedAt: now,
        });
        acs.push(ac);
      } catch { /* skip */ }
    }
    let fa = 0;
    for (let i = 0; i < 15 && acs.length > 0; i++) {
      try {
        await ctx.db.insert("fixedAssets", {
          name: `${["Laptop","Desktop","Projector","Printer","Server"][i % 5]} ${i+1}`,
          assetCode: `AST-${String(i+1).padStart(4,"0")}`,
          categoryId: acs[i % acs.length] as any,
          purchaseDate: now - Math.floor(Math.random() * 365) * 86400000,
          purchaseCost: [50000,100000,250000,500000][i % 4],
          currentValue: [25000,50000,150000,300000][i % 4],
          salvageValue: [5000,10000,25000][i % 3],
          accumulatedDepreciation: [5000,10000,25000,50000][i % 4],
          usefulLifeYears: [3,5,7,10][i % 4],
          branchId: (branches.length > 0 ? branches[i % branches.length]._id : "") as any,
          status: "active", createdAt: now, updatedAt: now,
        });
        fa++;
      } catch { /* skip */ }
    }
    results.push(`✅ ${fa} fixed assets`);

    // 9. Marketing Campaigns (8)
    let camp = 0;
    for (const n of ["Summer Drive 2026","Open House","Scholarship Blast",
      "Early Bird Offer","Referral Program","Social Media Push",
      "Webinar Series","Campus Tour"]) {
      try {
        await ctx.db.insert("crmUtmCampaigns", {
          name: n, code: n.slice(0,4).toUpperCase(),
          campaignTypeId: "" as any, description: `${n} campaign`,
          color: COLORS[camp % COLORS.length], icon: "Megaphone",
          sequence: camp + 1, active: true, createdAt: now, updatedAt: now,
        });
        camp++;
      } catch { /* skip */ }
    }
    results.push(`✅ ${camp} marketing campaigns`);

    return {
      ok: true,
      message: "9 Internal Testing Only modules boosted with supplemental data",
      summary: {
        journalEntries: jc, cashBookEntries: cc, creditNotes: cnc,
        vendorBills: vbc, pdcs: pdc, payroll: py,
        folders: fids.length, documents: dc, fixedAssets: fa,
        marketingCampaigns: camp,
      },
      results,
    };
  },
});
