/**
 * Boost Enterprise Simulation — Supplemental data for 9 Internal Testing Only modules
 *
 * Adds: journalEntries, cashBookEntries, creditNotes, vendorBills,
 *       payment_pdcs (PDC/cheques), payrollEntries, documents, fixedAssets,
 *       crmUtmCampaigns (marketing)
 */

import { v } from "convex/values";
import { mutation } from "./_generated/server";

const FIRST_NAMES = ["Aarav","Vivaan","Aditya","Vihaan","Arjun","Sai","Reyansh","Ayaan","Ishaan","Shaurya","Rudra","Dhruv","Kabir","Rohan","Pranav","Yash","Aaradhya","Ananya","Aanya","Diya","Ira","Myra","Sara","Sia","Aisha","Kavya","Navya","Priya","Riya","Tanvi","Anika","Ishita"];
const LAST_NAMES = ["Sharma","Verma","Gupta","Singh","Patel","Kumar","Reddy","Joshi","Nair","Menon","Iyer","Rao","Pillai","Nayar","Desai","Mehta","Shah","Kapoor","Malhotra","Agarwal","Mishra","Pandey","Chauhan","Thakur"];
const COLORS = ["#1a73e8","#34a853","#ea4335","#fbbc04","#a855f7","#06b6d4","#f43f5e","#10b981","#6366f1","#e11d48","#0ea5e9","#84cc16"];

function randomInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomPick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export const boostEnterpriseSimulation = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const results: string[] = [];

    // Verify Company A exists
    const orgCompanies = await ctx.db.query("orgCompanies").collect();
    if (!orgCompanies.some((c: any) => c.code === "COMPA")) {
      return { message: "Company A not found. Run enterpriseSimulation:runEnterpriseSimulation first.", results };
    }

    // Check if already boosted
    const existingJE = (await ctx.db.query("journalEntries").collect()).length;
    if (existingJE > 0) {
      return { message: "Supplemental data already exists.", results, note: "already_boosted" };
    }

    const users = await ctx.db.query("users").collect();
    const uid = (users.length > 0 ? users[0]._id : "") as any;
    const students = await ctx.db.query("studentMaster").collect();
    const employees = await ctx.db.query("employeeMaster").collect();
    const branches = await ctx.db.query("orgBranches").collect();

    // 1. Journal Entries (30)
    let jc = 0;
    for (let i = 0; i < 30; i++) {
      try {
        await ctx.db.insert("journalEntries", {
          entryNumber: `JE-${String(jc + 1).padStart(5, "0")}`,
          entryDate: now - randomInt(1, 180) * 86400000,
          description: randomPick(["Fee collection", "Refund processing", "Expense payment", "Salary disbursement", "Vendor payment"]),
          debitAccount: randomPick(["1100-Cash", "1200-Bank", "1300-Receivables"]),
          creditAccount: randomPick(["4100-Fee Income", "5100-Salary Expense", "5200-Operating Expense"]),
          amount: randomPick([25000, 50000, 100000, 250000, 500000]),
          status: "posted", createdBy: uid, createdAt: now, updatedAt: now,
        });
        jc++;
      } catch { /* skip */ }
    }
    results.push(`✅ ${jc} journal entries`);

    // 2. Cash Book (30)
    let cc = 0;
    for (let i = 0; i < 30; i++) {
      try {
        await ctx.db.insert("cashBookEntries", {
          entryNumber: `CB-${String(cc + 1).padStart(5, "0")}`,
          entryDate: now - randomInt(1, 60) * 86400000,
          entryType: randomPick(["debit", "credit"]) as "debit" | "credit",
          amount: randomPick([5000, 10000, 25000, 50000, 100000]),
          description: randomPick(["Fee payment", "Expense", "Refund", "Transfer"]),
          category: randomPick(["fee_collection", "expense", "refund", "transfer"]) as any,
          paymentMode: randomPick(["cash", "bank_transfer", "cheque"]),
          balanceAfter: randomPick([50000, 100000, 250000, 500000]),
          createdBy: uid, createdAt: now,
        });
        cc++;
      } catch { /* skip */ }
    }
    results.push(`✅ ${cc} cash book entries`);

    // 3. Credit Notes (20)
    let cn = 0;
    for (let i = 0; i < 20 && students.length > 0; i++) {
      try {
        await ctx.db.insert("creditNotes", {
          creditNoteNumber: `CN-${String(cn + 1).padStart(5, "0")}`,
          studentId: students[i % students.length]._id as any,
          amount: randomPick([5000, 10000, 15000, 25000]),
          reason: randomPick(["Fee adjustment", "Discount applied", "Scholarship adjustment", "Payment correction"]),
          status: "issued", createdBy: uid, createdAt: now, updatedAt: now,
        });
        cn++;
      } catch { /* skip */ }
    }
    results.push(`✅ ${cn} credit notes`);

    // 4. Vendor Bills (20)
    let vb = 0;
    for (let i = 0; i < 20; i++) {
      try {
        await ctx.db.insert("vendorBills", {
          vendorName: randomPick(["TechSupply India", "EduBooks Pvt Ltd", "Campus Furniture Co", "Lab Equipment Corp"]),
          billNumber: `BILL-${String(vb + 1).padStart(5, "0")}`,
          billDate: now - randomInt(1, 90) * 86400000,
          dueDate: now + randomInt(1, 30) * 86400000,
          amount: randomPick([15000, 25000, 50000, 100000, 200000]),
          paidAmount: 0, balanceDue: randomPick([15000, 25000, 50000, 100000]),
          description: randomPick(["Office supplies", "Equipment purchase", "Maintenance service"]),
          status: "pending", createdBy: uid, createdAt: now, updatedAt: now,
        });
        vb++;
      } catch { /* skip */ }
    }
    results.push(`✅ ${vb} vendor bills`);

    // 5. PDCs (50)
    const bankNames = ["SBI", "HDFC", "ICICI", "Axis", "PNB", "Yes Bank"];
    let pdc = 0;
    for (let i = 0; i < 50 && i < students.length; i++) {
      try {
        await ctx.db.insert("payment_pdcs", {
          leadId: students[i]._id as any,
          chequeNumber: `CHQ-${String(10000 + i).slice(1)}`,
          bank: randomPick(bankNames),
          chequeDate: now + randomInt(1, 90) * 86400000,
          amount: randomPick([10000, 25000, 50000, 75000, 100000]),
          status: randomPick(["scheduled", "deposited", "cleared", "bounced"]),
          depositDate: now - randomInt(1, 30) * 86400000,
          bounceReason: "",
          createdBy: uid as any, createdAt: now, updatedAt: now,
        });
        pdc++;
      } catch { /* skip */ }
    }
    results.push(`✅ ${pdc} PDC/cheque records`);

    // 6. Payroll (50)
    let pay = 0;
    for (let i = 0; i < 50 && i < employees.length; i++) {
      try {
        await ctx.db.insert("payrollEntries", {
          employeeId: employees[i]._id as any,
          baseSalary: randomPick([25000, 35000, 50000, 75000, 100000]),
          allowances: randomPick([5000, 10000, 15000]),
          deductions: randomPick([2000, 5000, 8000]),
          netPay: randomPick([28000, 40000, 57000, 82000, 107000]),
          payPeriod: "2026-07", status: "paid",
          createdAt: now - randomInt(1, 60) * 86400000, updatedAt: now,
        });
        pay++;
      } catch { /* skip */ }
    }
    results.push(`✅ ${pay} payroll entries`);

    // 7. Documents — folders + documents
    const folderIds: string[] = [];
    for (const name of ["Academic Records", "Finance Documents", "HR Documents", "Student Reports"]) {
      try {
        const fid = await ctx.db.insert("documentFolders", {
          name, isActive: true, createdBy: uid, createdAt: now, updatedAt: now,
        });
        folderIds.push(fid);
      } catch { /* skip */ }
    }
    let doc = 0;
    for (let i = 0; i < 20 && folderIds.length > 0; i++) {
      try {
        await ctx.db.insert("documents", {
          name: `${randomPick(["Report", "Invoice", "Certificate", "Agreement"])} ${i + 1}`,
          description: `Sample document ${i + 1}`,
          fileUrl: `https://storage.example.com/docs/doc-${i + 1}.pdf`,
          fileType: "pdf", fileSize: randomInt(10000, 500000),
          mimeType: "application/pdf", version: 1,
          folderId: randomPick(folderIds) as any, isArchived: false,
          uploadedBy: uid, downloadCount: randomInt(0, 50),
          createdAt: now, updatedAt: now,
        });
        doc++;
      } catch { /* skip */ }
    }
    results.push(`✅ ${folderIds.length} folders, ${doc} documents`);

    // 8. Fixed Assets (15)
    const assetCats: string[] = [];
    for (const name of ["IT Equipment", "Furniture", "Vehicles", "Lab Equipment"]) {
      try {
        const acid = await ctx.db.insert("assetCategories", {
          name, code: name.slice(0, 3).toUpperCase(),
          depreciationMethod: "straight_line",
          usefulLifeYears: name === "IT Equipment" ? 3 : name === "Vehicles" ? 5 : 10,
          isActive: true, createdAt: now, updatedAt: now,
        });
        assetCats.push(acid);
      } catch { /* skip */ }
    }
    let fa = 0;
    for (let i = 0; i < 15 && assetCats.length > 0; i++) {
      const branch = branches.length > 0 ? randomPick(branches)._id : "";
      try {
        await ctx.db.insert("fixedAssets", {
          name: `${randomPick(["Laptop", "Desktop", "Projector", "Printer", "Server"])} - ${i + 1}`,
          assetCode: `AST-${String(i + 1).padStart(4, "0")}`,
          categoryId: randomPick(assetCats) as any,
          purchaseDate: now - randomInt(180, 730) * 86400000,
          purchaseCost: randomPick([50000, 100000, 250000, 500000]),
          currentValue: randomPick([25000, 50000, 150000, 300000]),
          salvageValue: randomPick([5000, 10000, 25000]),
          accumulatedDepreciation: randomPick([5000, 10000, 25000, 50000]),
          usefulLifeYears: randomInt(3, 10),
          branchId: branch as any, status: "active",
          createdAt: now, updatedAt: now,
        });
        fa++;
      } catch { /* skip */ }
    }
    results.push(`✅ ${fa} fixed assets`);

    // 9. Marketing Campaigns (8)
    const campNames = ["Summer Drive 2026", "Open House", "Scholarship Blast", "Early Bird Offer",
      "Referral Program", "Social Media Push", "Webinar Series", "Campus Tour"];
    let camp = 0;
    for (const name of campNames) {
      try {
        await ctx.db.insert("crmUtmCampaigns", {
          name, code: name.slice(0, 4).toUpperCase(),
          campaignTypeId: "" as any,
          description: `${name} marketing campaign`,
          color: randomPick(COLORS), icon: "Megaphone",
          sequence: camp + 1, active: true, createdAt: now, updatedAt: now,
        });
        camp++;
      } catch { /* skip */ }
    }
    results.push(`✅ ${camp} marketing campaigns`);

    return {
      message: "9 Internal Testing Only modules boosted with supplemental data",
      summary: {
        journalEntries: jc, cashBookEntries: cc, creditNotes: cn,
        vendorBills: vb, pdcs: pdc, payrollEntries: pay,
        documentFolders: folderIds.length, documents: doc,
        fixedAssets: fa, marketingCampaigns: camp,
      },
      results,
    };
  },
});
