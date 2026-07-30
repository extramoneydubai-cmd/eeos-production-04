/**
 * Enterprise Simulation — PATCH-PRODUCTION-004
 *
 * Creates a complete virtual organization with realistic linked data
 * across ALL business modules for end-to-end validation.
 *
 * Company A: 12 branches, 4 academic verticals, 2,500 students,
 * 180 employees (45 faculty), complete business data.
 *
 * Idempotent: safe to run multiple times.
 * mode: "existing" (default) = full seed if not yet seeded
 * mode: "supplement" = add data for 9 Internal Testing Only modules
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const BRANCH_NAMES = [
  "Main Campus","East Campus","West Campus","North Campus","South Campus",
  "City Center","Tech Park","Knowledge Park","Lake View","Green Valley","Riverside","Heritage",
];
const ACADEMIC_VERTICALS = [
  {name:"Engineering & Technology",code:"ENGG",category:"higher_education"},
  {name:"Management & Commerce",code:"MGMT",category:"higher_education"},
  {name:"Science & Research",code:"SCI",category:"higher_education"},
  {name:"Diploma & Certification",code:"DIPL",category:"vocational"},
];
const PROGRAMS_DATA = [
  {name:"BTech Computer Science",code:"BTECH-CS",type:"degree",duration:4,vertical:0},
  {name:"BTech Electronics",code:"BTECH-EC",type:"degree",duration:4,vertical:0},
  {name:"BTech Mechanical",code:"BTECH-ME",type:"degree",duration:4,vertical:0},
  {name:"BCA",code:"BCA",type:"degree",duration:3,vertical:0},
  {name:"BBA",code:"BBA",type:"degree",duration:3,vertical:1},
  {name:"BCom",code:"BCOM",type:"degree",duration:3,vertical:1},
  {name:"MBA",code:"MBA",type:"postgraduate",duration:2,vertical:1},
  {name:"MCA",code:"MCA",type:"postgraduate",duration:2,vertical:0},
  {name:"BSc Nursing",code:"BSC-NUR",type:"degree",duration:4,vertical:2},
  {name:"BSc Biotechnology",code:"BSC-BIO",type:"degree",duration:3,vertical:2},
  {name:"Diploma Engineering",code:"DIPL-ENGG",type:"diploma",duration:3,vertical:3},
  {name:"Diploma Management",code:"DIPL-MGMT",type:"diploma",duration:2,vertical:3},
];
const SUBJECTS = ["Data Structures","Algorithms","Database Systems","Operating Systems","Computer Networks","Software Engineering","Web Development","Machine Learning","Artificial Intelligence","Cloud Computing","Cybersecurity","Blockchain","Mathematics","Physics","Chemistry","Biology","English Literature","Economics","Accounting","Marketing Management","Human Resources","Financial Management","Business Law","Statistics"];
const FIRST_NAMES = ["Aarav","Vivaan","Aditya","Vihaan","Arjun","Sai","Reyansh","Ayaan","Ishaan","Shaurya","Rudra","Dhruv","Kabir","Rohan","Pranav","Yash","Aaradhya","Ananya","Aanya","Diya","Ira","Myra","Sara","Sia","Aisha","Kavya","Navya","Priya","Riya","Tanvi","Anika","Ishita"];
const LAST_NAMES = ["Sharma","Verma","Gupta","Singh","Patel","Kumar","Reddy","Joshi","Nair","Menon","Iyer","Rao","Pillai","Nayar","Desai","Mehta","Shah","Kapoor","Malhotra","Agarwal","Mishra","Pandey","Chauhan","Thakur"];
const COLORS = ["#1a73e8","#34a853","#ea4335","#fbbc04","#a855f7","#06b6d4","#f43f5e","#10b981","#6366f1","#e11d48","#0ea5e9","#84cc16"];
const CITIES = ["Knowledge City","Tech Valley","Edu Park","Innovation Hub","Learning Center"];

function randomInt(mn:number,mx:number){return Math.floor(Math.random()*(mx-mn+1))+mn}
function randomPick<T>(a:T[]):T{return a[Math.floor(Math.random()*a.length)]}
function rcp(pfx:string,sn:number){return `${pfx}-${String(sn).padStart(6,"0")}`}

export const runEnterpriseSimulation = mutation({
  args: { mode: v.optional(v.union(v.literal("existing"), v.literal("supplement"))) },
  handler: async (ctx, args) => {
    const now = Date.now(); const r: string[] = []; const mode = args.mode ?? "existing";

    const existing = await ctx.db.query("orgCompanies").collect();
    const companyAExists = existing.some((c:any)=>c.code==="COMPA");

    if (companyAExists && mode === "supplement") {
      // ─── SUPPLEMENT MODE: Add data for 9 Internal Testing Only modules ───
      const users = await ctx.db.query("users").collect(); const uid=(users.length>0?users[0]._id:"") as any;
      const students=await ctx.db.query("studentMaster").collect();
      const employees=await ctx.db.query("employeeMaster").collect();
      const branches=await ctx.db.query("orgBranches").collect();
      const existingJE=(await ctx.db.query("journalEntries").collect()).length;
      if(existingJE>0)return{message:"Supplemental data already exists.",r,mode};
      const bankNames=["SBI","HDFC","ICICI","Axis","PNB","Yes Bank"];
      let jc=0,cc=0,cn=0,vb=0,pdc=0,pay=0,doc=0,fa=0,camp=0;
      const folderIds:string[]=[];

      for(let i=0;i<30;i++){try{await ctx.db.insert("journalEntries",{entryNumber:`JE-${String(jc+1).padStart(5,"0")}`,entryDate:now-randomInt(1,180)*86400000,description:randomPick(["Fee collection","Refund","Expense","Salary","Vendor payment"]),debitAccount:randomPick(["1100-Cash","1200-Bank","1300-Receivables"]),creditAccount:randomPick(["4100-Fee Income","5100-Salary","5200-Expense"]),amount:randomPick([25000,50000,100000,250000,500000]),status:"posted",createdBy:uid,createdAt:now,updatedAt:now});jc++}catch{}}
      for(let i=0;i<30;i++){try{await ctx.db.insert("cashBookEntries",{entryNumber:`CB-${String(cc+1).padStart(5,"0")}`,entryDate:now-randomInt(1,60)*86400000,entryType:randomPick(["debit","credit"])as any,amount:randomPick([5000,10000,25000,50000]),description:randomPick(["Fee","Expense","Refund","Transfer"]),category:randomPick(["fee_collection","expense","refund","transfer"])as any,paymentMode:randomPick(["cash","bank_transfer","cheque"]),balanceAfter:randomPick([50000,100000,250000]),createdBy:uid,createdAt:now});cc++}catch{}}
      for(let i=0;i<20&&students.length>0;i++){try{await ctx.db.insert("creditNotes",{creditNoteNumber:`CN-${String(cn+1).padStart(5,"0")}`,studentId:students[i%students.length]._id as any,amount:randomPick([5000,10000,15000,25000]),reason:randomPick(["Fee adjustment","Discount","Scholarship","Correction"]),status:"issued",createdBy:uid,createdAt:now,updatedAt:now});cn++}catch{}}
      for(let i=0;i<20;i++){try{await ctx.db.insert("vendorBills",{vendorName:randomPick(["TechSupply","EduBooks","Campus Furniture","Lab Equipment"]),billNumber:`BILL-${String(vb+1).padStart(5,"0")}`,billDate:now-randomInt(1,90)*86400000,dueDate:now+randomInt(1,30)*86400000,amount:randomPick([15000,25000,50000,100000]),paidAmount:0,balanceDue:randomPick([15000,25000,50000]),description:randomPick(["Supplies","Equipment","Maintenance"]),status:"pending",createdBy:uid,createdAt:now,updatedAt:now});vb++}catch{}}
      for(let i=0;i<50&&i<students.length;i++){try{await ctx.db.insert("payment_pdcs",{leadId:students[i]._id as any,chequeNumber:`CHQ-${String(10000+i).slice(1)}`,bank:randomPick(bankNames),chequeDate:now+randomInt(1,90)*86400000,amount:randomPick([10000,25000,50000,75000,100000]),status:randomPick(["scheduled","deposited","cleared","bounced"]),depositDate:now-randomInt(1,30)*86400000,bounceReason:"",createdBy:uid as any,createdAt:now,updatedAt:now});pdc++}catch{}}
      for(let i=0;i<50&&i<employees.length;i++){try{await ctx.db.insert("payrollEntries",{employeeId:employees[i]._id as any,baseSalary:randomPick([25000,35000,50000,75000]),allowances:randomPick([5000,10000,15000]),deductions:randomPick([2000,5000,8000]),netPay:randomPick([28000,40000,57000,82000]),payPeriod:"2026-07",status:"paid",createdAt:now-randomInt(1,60)*86400000,updatedAt:now});pay++}catch{}}
      for(const n of["Academic Records","Finance Documents","HR Documents","Student Reports"]){try{const fid=await ctx.db.insert("documentFolders",{name:n,isActive:true,createdBy:uid,createdAt:now,updatedAt:now});folderIds.push(fid)}catch{}}
      for(let i=0;i<20&&folderIds.length>0;i++){try{await ctx.db.insert("documents",{name:`${randomPick(["Report","Invoice","Certificate","Agreement"])} ${i+1}`,description:`Sample ${i+1}`,fileUrl:`https://storage.example.com/docs/doc-${i+1}.pdf`,fileType:"pdf",fileSize:randomInt(10000,500000),mimeType:"application/pdf",version:1,folderId:randomPick(folderIds)as any,isArchived:false,uploadedBy:uid,downloadCount:0,createdAt:now,updatedAt:now});doc++}catch{}}
      const acs:string[]=[];for(const n of["IT Equipment","Furniture","Vehicles","Lab Equipment"]){try{const ac=await ctx.db.insert("assetCategories",{name:n,code:n.slice(0,3).toUpperCase(),depreciationMethod:"straight_line",usefulLifeYears:n==="IT Equipment"?3:n==="Vehicles"?5:10,isActive:true,createdAt:now,updatedAt:now});acs.push(ac)}catch{}}
      for(let i=0;i<15&&acs.length>0;i++){const b=branches.length>0?randomPick(branches)._id:"";try{await ctx.db.insert("fixedAssets",{name:`${randomPick(["Laptop","Desktop","Projector","Printer","Server"])} - ${i+1}`,assetCode:`AST-${String(i+1).padStart(4,"0")}`,categoryId:randomPick(acs)as any,purchaseDate:now-randomInt(180,730)*86400000,purchaseCost:randomPick([50000,100000,250000,500000]),currentValue:randomPick([25000,50000,150000,300000]),salvageValue:randomPick([5000,10000,25000]),accumulatedDepreciation:randomPick([5000,10000,25000,50000]),usefulLifeYears:randomInt(3,10),branchId:b as any,status:"active",createdAt:now,updatedAt:now});fa++}catch{}}
      for(const n of["Summer Drive 2026","Open House","Scholarship Blast","Early Bird Offer","Referral Program","Social Media Push","Webinar Series","Campus Tour"]){try{await ctx.db.insert("crmUtmCampaigns",{name,code:n.slice(0,4).toUpperCase(),campaignTypeId:""as any,description:`${n} campaign`,color:randomPick(COLORS),icon:"Megaphone",sequence:camp+1,active:true,createdAt:now,updatedAt:now});camp++}catch{}}
      r.push(`✅ ${jc} journal entries, ${cc} cash book, ${cn} credit notes, ${vb} vendor bills`);
      r.push(`✅ ${pdc} PDCs, ${pay} payroll, ${folderIds.length} folders, ${doc} documents, ${fa} assets, ${camp} campaigns`);
      return{message:"9 Internal Testing Only modules boosted!",summary:{journalEntries:jc,cashBookEntries:cc,creditNotes:cn,vendorBills:vb,pdcs:pdc,payroll:pay,folders:folderIds.length,documents:doc,fixedAssets:fa,campaigns:camp},results:r,mode};
    }
    if(companyAExists)return{message:"Company A already seeded. Use mode:'supplement' to boost 9 modules.",results:r,mode};

    // ── Phase 0: System user ─────────────────
    let suid:string|null=null;try{const fu=await ctx.db.query("users").first();if(fu)suid=fu._id}catch{}
    const uid=suid??"placeholder";const usersId=uid as any;

    // Phase 1: Org
    const orgCompanyId=await ctx.db.insert("orgCompanies",{name:"EdVeda Institute of Technology",code:"COMPA",color:"#1a73e8",icon:"Building2",legalName:"EdVeda Institute of Technology Pvt Ltd",registrationNumber:"U80301KA2025PTC123456",taxNumber:"27AAAPN1234H1Z1",email:"admin@veda-edtech.edu",phone:"+91-1800-EDVEDA",website:"https://veda-edtech.edu",address:"123 Education Valley, Knowledge City",city:"Knowledge City",state:"Karnataka",country:"India",description:"Enterprise Education Technology Group",displayOrder:1,isActive:true,createdAt:now,updatedAt:now});
    const companyId=await ctx.db.insert("companies",{name:"EdVeda Institute",code:"COMPA",companyType:"education",status:"active",description:"Enterprise Education Technology Company",color:"#1a73e8",icon:"Building2",createdAt:now,updatedAt:now});
    const orgBranchIds:string[]=[];const branchIds:string[]=[];
    for(let i=0;i<BRANCH_NAMES.length;i++){const bn=BRANCH_NAMES[i],bc=`BR-${String(i+1).padStart(2,"0")}`,ph=`+91-98765${String(10000+i).slice(1)}`,em=`${bn.toLowerCase().replace(/\s+/g,"")}@veda-edtech.edu`;
      orgBranchIds.push(await ctx.db.insert("orgBranches",{name:bn,code:bc,color:COLORS[i%COLORS.length],icon:"Building",city:CITIES[i%CITIES.length],state:"Karnataka",country:"India",address:`${i+1} Sector, ${bn}`,phone:ph,email:em,managerName:"Manager "+bn,displayOrder:i+1,isActive:true,createdAt:now,updatedAt:now}));
      branchIds.push(await ctx.db.insert("branches",{name:bn,code:bc,email:em,phone:ph,address:`${i+1} Sector, ${bn}`,isActive:true,description:`${bn} branch`,color:COLORS[i%COLORS.length],icon:"Building",createdAt:now,updatedAt:now}));
    }
    r.push("Phase 1: Org — 12 branches");

    // Phase 2: Academic
    const verticalIds:string[]=[];for(const v of ACADEMIC_VERTICALS)verticalIds.push(await ctx.db.insert("academicVerticals",{name:v.name,code:v.code,color:randomPick(COLORS),icon:"BookOpen",educationCategory:v.category,description:`${v.name} programs`,displayOrder:verticalIds.length+1,isActive:true,createdAt:now,updatedAt:now}));
    const subVerticalIds:string[]=[];for(const vid of verticalIds){const idx=verticalIds.indexOf(vid);subVerticalIds.push(await ctx.db.insert("academicSubVerticals",{verticalId:vid as any,name:`${ACADEMIC_VERTICALS[idx].name} - Core`,code:`${ACADEMIC_VERTICALS[idx].code}-CORE`,color:randomPick(COLORS),icon:"BookOpen",description:`Core ${ACADEMIC_VERTICALS[idx].name} programs`,displayOrder:subVerticalIds.length+1,isActive:true,createdAt:now,updatedAt:now}));}
    const sessionId=await ctx.db.insert("academicSessions",{name:"2025-2026",code:"AY-2025-26",academicYear:"2025-2026",color:"#1a73e8",icon:"Calendar",startDate:now-180*86400000,endDate:now+180*86400000,description:"Academic Year 2025-2026",sequence:1,isCurrent:true,active:true,createdAt:now,updatedAt:now});
    const batchTypeId=await ctx.db.insert("academicBatchTypes",{name:"Regular",code:"REG",deliveryMode:"classroom",timingCategory:"regular",description:"Regular classroom batch",displayOrder:1,color:"#34a853",icon:"Users",isActive:true,createdAt:now,updatedAt:now});
    const programIds:string[]=[];for(const p of PROGRAMS_DATA)programIds.push(await ctx.db.insert("academicPrograms",{subVerticalId:subVerticalIds[p.vertical]as any,name:p.name,code:p.code,programType:p.type,duration:p.duration,durationUnit:"years",deliveryMode:"classroom",description:`${p.name} program`,displayOrder:programIds.length+1,color:COLORS[programIds.length%COLORS.length],icon:"GraduationCap",isActive:true,createdAt:now,updatedAt:now}));
    const batchIds:string[]=[];for(const pid of programIds){for(const yr of["2025-2028","2024-2027"])batchIds.push(await ctx.db.insert("academicBatches",{name:yr,code:`${PROGRAMS_DATA[programIds.indexOf(pid)].code}-${yr.slice(0,4)}`,programId:pid as any,batchTypeId:batchTypeId as any,academicSessionId:sessionId as any,capacity:randomInt(60,120),maxStrength:randomInt(60,120),startDate:now-365*86400000,endDate:now+2*365*86400000,description:`${yr} batch for ${PROGRAMS_DATA[programIds.indexOf(pid)].name}`,sequence:batchIds.length+1,color:COLORS[batchIds.length%COLORS.length],icon:"Users",active:true,createdAt:now,updatedAt:now}));}
    r.push("Phase 2: Academic — "+programIds.length+" programs, "+batchIds.length+" batches");

    // Phase 3: Employees
    const empTypes:[string,number,string][]=[["faculty",45,"employee"],["counselor",25,"employee"],["finance",8,"employee"],["hr",3,"department_head"],["marketing",6,"employee"],["admin",20,"manager"],["operations",15,"employee"],["it",10,"employee"],["support",48,"employee"]];
    const employeeIds:string[]=[];const facultyIds:string[]=[];let ec=0;
    for(const[type,count,role]of empTypes){for(let i=0;i<count;i++){const fn=randomPick(FIRST_NAMES),ln=randomPick(LAST_NAMES);
      const personId=await ctx.db.insert("personMaster",{firstName:fn,lastName:ln,displayName:`${fn} ${ln}`,status:"active",createdAt:now,updatedAt:now});
      try{const eid=await ctx.db.insert("employeeMaster",{employeeCode:`${type.slice(0,3).toUpperCase()}-${String(ec+1).padStart(3,"0")}`,personId:personId as any,companyId:companyId as any,branchId:randomPick(branchIds)as any,employmentType:"permanent",primaryRole:role,status:"active"as const,workLocation:CITIES[0],experienceLevel:String(randomInt(1,15)),createdAt:now-randomInt(180,1095)*86400000,updatedAt:now});employeeIds.push(eid);ec++;if(type==="faculty")facultyIds.push(eid)}catch{}}
    r.push("Phase 3: "+employeeIds.length+" employees ("+facultyIds.length+" faculty)");

    // Phase 4: Students
    const studentIds:string[]=[];const spp:string[]=[];
    for(let i=0;i<2500;i++){const fn=randomPick(FIRST_NAMES),ln=randomPick(LAST_NAMES);
      const personId=await ctx.db.insert("personMaster",{firstName:fn,lastName:ln,displayName:`${fn} ${ln}`,status:"active",createdAt:now,updatedAt:now});
      try{const sid=await ctx.db.insert("studentMaster",{studentCode:`STU-${String(i+1).padStart(5,"0")}`,personId:personId as any,admissionNumber:`ADM-${String(i+1).padStart(5,"0")}`,enrollmentDate:now-randomInt(30,365)*86400000,currentStatus:(i<2000?"active":i<2400?"completed":"alumni")as any,branchId:randomPick(branchIds)as any,companyId:companyId as any,academicYearId:sessionId as any,createdBy:"placeholder"as any,createdAt:now,updatedAt:now});studentIds.push(sid);spp.push(personId)}catch{}}
    r.push("Phase 4: "+studentIds.length+" students");

    // Phase 5: Finance
    const feeAmounts=[25000,35000,45000,60000,75000,90000,120000];const feeIds:string[]=[];
    for(let i=0;i<Math.min(2000,studentIds.length);i++){const tf=randomPick(feeAmounts),pd=Math.round(tf*(0.3+Math.random()*0.7));try{const fa=await ctx.db.insert("studentFeeAccounts",{studentId:studentIds[i]as any,totalFee:tf,totalPaid:pd,outstandingBalance:tf-pd,totalDiscount:0,totalScholarship:0,totalWaiver:0,installmentsCount:randomInt(1,6),installmentFrequency:"monthly",status:pd>=tf?"closed":"active",createdBy:"placeholder"as any});feeIds.push(fa)}catch{}}
    let inv=0,tx=0,rc=0,ref=0;
    for(let i=0;i<Math.min(600,studentIds.length);i++){const tf=randomPick(feeAmounts),ta=Math.round(tf*0.18);try{await ctx.db.insert("feeInvoices",{invoiceNumber:rcp("INV",i+1),studentId:studentIds[i%studentIds.length]as any,feeAccountId:(feeIds[i%feeIds.length]??feeIds[0])as any,invoiceDate:now-randomInt(1,180)*86400000,dueDate:now+randomInt(1,30)*86400000,lineItems:JSON.stringify([{description:"Tuition Fee",amount:tf}]),subtotal:tf,discountAmount:0,taxAmount:ta,totalAmount:tf+ta,paidAmount:Math.round((tf+ta)*0.5),balanceDue:Math.round((tf+ta)*0.5),status:"partial",gstPercentage:18,gstAmount:ta,createdBy:"placeholder"as any});inv++}catch{}}
    for(let i=0;i<Math.min(500,studentIds.length);i++){try{await ctx.db.insert("paymentTransactions",{transactionNumber:rcp("TXN",i+1),studentId:studentIds[i%studentIds.length]as any,feeAccountId:(feeIds[i%feeIds.length]??feeIds[0])as any,paymentMethod:randomPick(["cash","online","upi","cheque"]),paymentDate:now-randomInt(1,180)*86400000,amount:randomPick([5000,10000,15000,25000,50000]),status:"completed",createdBy:"placeholder"as any});tx++}catch{}}
    for(let i=0;i<Math.min(400,studentIds.length);i++){try{await ctx.db.insert("receiptHistory",{receiptNumber:rcp("RCT",i+1),studentId:studentIds[i%studentIds.length]as any,amount:randomPick([5000,10000,15000,25000]),receiptDate:now-randomInt(1,180)*86400000,receiptType:"payment",createdBy:"placeholder"as any});rc++}catch{}}
    for(let i=Math.min(2000,studentIds.length);i<Math.min(2080,studentIds.length);i++){try{await ctx.db.insert("refundRequests",{studentId:studentIds[i]as any,amount:randomPick([5000,10000,15000,20000]),reason:randomPick(["Withdrawal","Course change","Administrative","Financial hardship"]),reasonCategory:randomPick(["academic","administrative","financial","withdrawal"]),status:randomPick(["pending","approved","completed"]),createdBy:"placeholder"as any,createdAt:now-randomInt(1,60)*86400000,updatedAt:now});ref++}catch{}}
    r.push("Phase 5: Finance — "+feeIds.length+" accounts, "+inv+" invoices, "+tx+" payments, "+rc+" receipts, "+ref+" refunds");

    // Phase 6: Exams
    const etids:string[]=[];for(const et of["unit_test","mid_term","final_exam","practical"])etids.push(await ctx.db.insert("examTemplates",{name:et.charAt(0).toUpperCase()+et.slice(1).replace("_"," "),code:`TEMP-${et.toUpperCase()}`,examType:et as any,maxMarks:et==="final_exam"?100:50,passPercentage:40,isActive:true,createdAt:now,updatedAt:now}));
    const esids:string[]=[];for(let i=0;i<10;i++)esids.push(await ctx.db.insert("examSessions",{templateId:randomPick(etids)as any,academicSessionId:sessionId as any,branchId:randomPick(orgBranchIds)as any,name:`${randomPick(["Mid-Term","Final","Quarterly","Weekly Test"])} ${i+1}`,startDate:now-randomInt(1,120)*86400000,endDate:now+randomInt(1,7)*86400000,status:"completed",createdAt:now,updatedAt:now}));
    let rs=0;for(const es of esids){for(let j=0;j<100&&j<spp.length;j++){const mk=randomInt(20,100),gd=mk>=85?"A":mk>=70?"B":mk>=50?"C":"D",dv=mk>=75?"distinction":mk>=60?"first":mk>=50?"second":mk>=40?"third":"fail";try{await ctx.db.insert("examResults",{examSessionId:es as any,studentId:spp[j]as any,totalMarks:100,marksObtained:mk,percentage:mk,grade:gd,division:dv as any,passFail:mk>=40?"pass":"fail",calculatedAt:now,createdAt:now,updatedAt:now});rs++}catch{}}}
    let cert=0;for(let i=0;i<100&&i<spp.length;i++){try{await ctx.db.insert("examCertificates",{studentId:spp[i]as any,examSessionId:randomPick(esids)as any,certificateType:randomPick(["marksheet","merit_certificate","passing_certificate"]),certificateNumber:`CERT-${String(cert+1).padStart(6,"0")}`,title:`Certificate of ${randomPick(["Completion","Merit","Participation"])}`,issuedDate:now-randomInt(1,365)*86400000,issuedBy:usersId,createdAt:now,updatedAt:now});cert++}catch{}}
    r.push("Phase 6: Exams — "+esids.length+" sessions, "+rs+" results, "+cert+" certificates");

    // Phase 7: Support
    let tix=0;for(let i=0;i<80&&i<studentIds.length;i++){try{await ctx.db.insert("ticketMaster",{ticketNumber:`SVC-2026-${String(i+1).padStart(4,"0")}`,title:randomPick(["Fee issue","Attendance correction","Exam query","Document request","Portal access","Enrollment problem"]),description:"Issue reported by student.",status:randomPick(["open","in_progress","resolved","closed"])as any,priority:randomPick(["low","medium","high"])as any,type:randomPick(["support","hardware","software","student","finance"]),requesterId:studentIds[i]as any,requesterType:"student",createdAt:now-randomInt(1,60)*86400000,updatedAt:now});tix++}catch{}}
    r.push("Phase 7: "+tix+" support tickets");

    // Phase 8: Schedules
    let sc=0;for(let i=0;i<200;i++){try{await ctx.db.insert("schedules",{title:randomPick(SUBJECTS)+" - "+randomPick(["Lecture","Lab","Tutorial","Workshop"]),scheduleType:"class",status:"confirmed",start:now+randomInt(-7,30)*86400000,end:now+randomInt(-7,30)*86400000+3600000,timezone:"Asia/Kolkata",entityType:"batch",entityId:randomPick(batchIds)as any,createdAt:now,updatedAt:now});sc++}catch{}}
    r.push("Phase 8: "+sc+" schedules");

    // Phase 9: Procurement
    const vns=[{n:"TechSupply India",c:"VEN-001"},{n:"EduBooks Pvt Ltd",c:"VEN-002"},{n:"Campus Furniture Co",c:"VEN-003"},{n:"Lab Equipment Corp",c:"VEN-004"},{n:"Stationery Mart",c:"VEN-005"},{n:"IT Solutions Inc",c:"VEN-006"},{n:"Transport Services",c:"VEN-007"},{n:"Catering Partners",c:"VEN-008"}];const vids:string[]=[];
    for(const v of vns){try{vids.push(await ctx.db.insert("vendorMaster",{vendorName:v.n,vendorCode:v.c,contactPerson:randomPick(FIRST_NAMES)+" "+randomPick(LAST_NAMES),email:`contact@${v.n.toLowerCase().replace(/\s+/g,"")}.com`,phone:`+91-98765${String(60000+vns.indexOf(v)).slice(1)}`,status:"active",createdBy:"placeholder"as any,createdAt:now,updatedAt:now}))}catch{}}
    let po=0;for(let i=0;i<30&&vids.length>0;i++){const subtotal=randomPick([50000,100000,200000,500000]);try{await ctx.db.insert("purchaseOrders",{poNumber:rcp("PO",i+1),vendorId:randomPick(vids)as any,orderDate:now-randomInt(1,60)*86400000,subtotal,taxAmount:Math.round(subtotal*0.18),totalAmount:Math.round(subtotal*1.18),status:randomPick(["draft","approved","partially_received"])as any,createdBy:"placeholder"as any,createdAt:now,updatedAt:now});po++}catch{}}
    try{const wid=await ctx.db.insert("warehouses",{name:"Main Warehouse",code:"WH-001",type:"warehouse",isActive:true,createdAt:now,updatedAt:now});for(const n of["Laptop Dell","Projector Epson","Whiteboard","Desk Chair","Printer HP","Router Cisco","UPS APC","CCTV Camera"])await ctx.db.insert("inventoryItems",{sku:`SKU-${String(Math.floor(Math.random()*10000)).padStart(4,"0")}`,name:n,unit:"unit",unitPrice:randomPick([500,1500,5000,15000]),minStock:2,maxStock:100,reorderLevel:5,currentStock:randomInt(1,50),warehouseId:wid as any,isActive:true,createdBy:"placeholder"as any,createdAt:now,updatedAt:now})}catch{}
    r.push("Phase 9: Procurement — "+vids.length+" vendors, "+po+" POs");

    // Phase 10-18: inline
    let kc=0;for(const a of[{t:"Fee Payment Guide",b:"Step-by-step guide to paying fees online."},{t:"Attendance Policy",b:"Minimum 75% attendance required for semester exams."},{t:"Exam Registration",b:"Register through the student portal 30 days before exams."},{t:"Library Rules",b:"Borrowing limits: 5 books for 14 days."},{t:"Hostel Guidelines",b:"Residents must follow curfew timings."},{t:"Transfer Certificate",b:"Request TC through the student portal."},{t:"Scholarship Programs",b:"Merit scholarships covering 25-100% of tuition."},{t:"IT Support Guide",b:"Contact IT Helpdesk at ext. 2001 for common issues."},{t:"Parent Portal Guide",b:"Track attendance, fees, homework through portal."},{t:"Campus Facilities",b:"24/7 library, sports complex, cafeteria, Wi-Fi."}]){try{await ctx.db.insert("knowledgeArticles",{title:a.t,body:a.b,bodyHtml:`<p>${a.b}</p>`,isPublished:true,views:randomInt(50,500),helpfulCount:randomInt(10,100),notHelpfulCount:randomInt(0,10),createdAt:now,updatedAt:now});kc++}catch{}}
    let wfc=0;for(const w of[{n:"Admission Approval",c:"admissions"},{n:"Refund Processing",c:"finance"},{n:"Purchase Approval",c:"procurement"},{n:"Leave Approval",c:"hr"},{n:"Ticket Escalation",c:"support"}]){try{await ctx.db.insert("workflowDefinitions",{name:w.n,category:w.c,status:"active",version:1,nodes:[{id:"s1",type:"start",label:"Start",config:{}},{id:"e1",type:"end",label:"End",config:{}}],edges:[{id:"eg1",source:"s1",target:"e1"}],createdAt:now,updatedAt:now});wfc++}catch{}}
    r.push("Phase 10-11: "+kc+" articles, "+wfc+" workflows");

    // Phases 12-18: Finance supplement + PDC + Attendance + Documents + Assets + Marketing + Payroll
    let je=0,cbe=0,cne=0,vbe=0,pdce=0,att=0,fls=0,dos=0,fae=0,cpe=0,pye=0;
    for(let i=0;i<30;i++){try{await ctx.db.insert("journalEntries",{entryNumber:`JE-${String(je+1).padStart(5,"0")}`,entryDate:now-randomInt(1,180)*86400000,description:randomPick(["Fee collection","Refund","Expense","Salary","Vendor payment"]),debitAccount:randomPick(["1100-Cash","1200-Bank","1300-Receivables"]),creditAccount:randomPick(["4100-Fee Income","5100-Salary","5200-Expense"]),amount:randomPick([25000,50000,100000,250000,500000]),status:"posted",createdBy:usersId,createdAt:now,updatedAt:now});je++}catch{}}
    for(let i=0;i<30;i++){try{await ctx.db.insert("cashBookEntries",{entryNumber:`CB-${String(cbe+1).padStart(5,"0")}`,entryDate:now-randomInt(1,60)*86400000,entryType:randomPick(["debit","credit"])as any,amount:randomPick([5000,10000,25000,50000]),description:randomPick(["Fee","Expense","Refund","Transfer"]),category:randomPick(["fee_collection","expense","refund","transfer"])as any,paymentMode:randomPick(["cash","bank_transfer","cheque"]),balanceAfter:randomPick([50000,100000,250000]),createdBy:usersId,createdAt:now});cbe++}catch{}}
    for(let i=0;i<20&&i<studentIds.length;i++){try{await ctx.db.insert("creditNotes",{creditNoteNumber:`CN-${String(cne+1).padStart(5,"0")}`,studentId:studentIds[i]as any,amount:randomPick([5000,10000,15000,25000]),reason:randomPick(["Fee adjustment","Discount","Scholarship","Correction"]),status:"issued",createdBy:usersId,createdAt:now,updatedAt:now});cne++}catch{}}
    for(let i=0;i<20;i++){try{await ctx.db.insert("vendorBills",{vendorName:randomPick(["TechSupply","EduBooks","Campus Furniture","Lab Equipment"]),billNumber:`BILL-${String(vbe+1).padStart(5,"0")}`,billDate:now-randomInt(1,90)*86400000,dueDate:now+randomInt(1,30)*86400000,amount:randomPick([15000,25000,50000,100000]),paidAmount:0,balanceDue:randomPick([15000,25000,50000]),description:randomPick(["Supplies","Equipment","Maintenance"]),status:"pending",createdBy:usersId,createdAt:now,updatedAt:now});vbe++}catch{}}
    const bnks=["SBI","HDFC","ICICI","Axis","PNB","Yes Bank"];
    for(let i=0;i<50&&i<studentIds.length;i++){try{await ctx.db.insert("payment_pdcs",{leadId:studentIds[i]as any,chequeNumber:`CHQ-${String(10000+i).slice(1)}`,bank:randomPick(bnks),chequeDate:now+randomInt(1,90)*86400000,amount:randomPick([10000,25000,50000,75000,100000]),status:randomPick(["scheduled","deposited","cleared","bounced"]),depositDate:now-randomInt(1,30)*86400000,bounceReason:"",createdBy:usersId as any,createdAt:now,updatedAt:now});pdce++}catch{}}
    const fols=["Academic Records","Finance Documents","HR Documents","Student Reports","Administration"];const fids:string[]=[];
    for(const n of fols){try{const fid=await ctx.db.insert("documentFolders",{name:n,isActive:true,createdBy:usersId,createdAt:now,updatedAt:now});fids.push(fid)}catch{}}
    for(let i=0;i<20&&fids.length>0;i++){try{await ctx.db.insert("documents",{name:`${randomPick(["Report","Invoice","Certificate","Agreement"])} ${i+1}`,description:`Sample ${i+1}`,fileUrl:`https://storage.example.com/docs/doc-${i+1}.pdf`,fileType:"pdf",fileSize:randomInt(10000,500000),mimeType:"application/pdf",version:1,folderId:randomPick(fids)as any,isArchived:false,uploadedBy:usersId,downloadCount:0,createdAt:now,updatedAt:now});dos++}catch{}}
    const acs2:string[]=[];for(const n of["IT Equipment","Furniture","Vehicles","Lab Equipment","Building"]){try{acs2.push(await ctx.db.insert("assetCategories",{name:n,code:n.slice(0,3).toUpperCase(),depreciationMethod:"straight_line",usefulLifeYears:n==="IT Equipment"?3:n==="Vehicles"?5:10,isActive:true,createdAt:now,updatedAt:now}))}catch{}}
    for(let i=0;i<15&&acs2.length>0;i++){try{await ctx.db.insert("fixedAssets",{name:randomPick(["Laptop","Desktop","Projector","Printer","Server"])+" - "+(i+1),assetCode:`AST-${String(i+1).padStart(4,"0")}`,categoryId:randomPick(acs2)as any,purchaseDate:now-randomInt(180,730)*86400000,purchaseCost:randomPick([50000,100000,250000,500000]),currentValue:randomPick([25000,50000,150000,300000]),salvageValue:randomPick([5000,10000,25000]),accumulatedDepreciation:randomPick([5000,10000,25000,50000]),usefulLifeYears:randomInt(3,10),branchId:randomPick(orgBranchIds)as any,status:"active",createdAt:now,updatedAt:now});fae++}catch{}}
    for(const n of["Summer Drive 2026","Open House","Scholarship Blast","Early Bird Offer","Referral Program","Social Media Push","Webinar Series","Campus Tour"]){try{await ctx.db.insert("crmUtmCampaigns",{name,code:n.slice(0,4).toUpperCase(),campaignTypeId:""as any,description:`${n} campaign`,color:randomPick(COLORS),icon:"Megaphone",sequence:cpe+1,active:true,createdAt:now,updatedAt:now});cpe++}catch{}}
    for(const eid of employeeIds.slice(0,50)){try{await ctx.db.insert("payrollEntries",{employeeId:eid as any,baseSalary:randomPick([25000,35000,50000,75000]),allowances:randomPick([5000,10000,15000]),deductions:randomPick([2000,5000,8000]),netPay:randomPick([28000,40000,57000,82000]),payPeriod:"2026-07",status:"paid",createdAt:now-randomInt(1,60)*86400000,updatedAt:now});pye++}catch{}}
    r.push("Phase 12-18: Suppl Finance, PDC, Docs, Assets, Marketing, Payroll");

    return{simulated:true,message:"Company A seeded with full business data",results:r,summary:{companies:1,branches:12,verticals:verticalIds.length,programs:programIds.length,batches:batchIds.length,employees:employeeIds.length,faculty:facultyIds.length,students:studentIds.length,invoices:inv,payments:tx,receipts:rc,refunds:ref,examSessions:esids.length,results:rs,certificates:cert,tickets:tix,schedules:sc,vendors:vids.length,purchaseOrders:po,articles:kc,workflows:wfc,journalEntries:je,cashBookEntries:cbe,creditNotes:cne,vendorBills:vbe,pdcs:pdce,folders:fids.length,documents:dos,fixedAssets:fae,campaigns:cpe,payroll:pye}};
  },
});

export const getSimulationStatus = query({
  handler: async(ctx)=>{let co=0,br=0,st=0,em=0,iv=0;
    try{co=(await ctx.db.query("orgCompanies").collect()).length}catch{}try{br=(await ctx.db.query("orgBranches").collect()).length}catch{}try{st=(await ctx.db.query("studentMaster").collect()).length}catch{}try{em=(await ctx.db.query("employeeMaster").collect()).length}catch{}try{iv=(await ctx.db.query("feeInvoices").collect()).length}catch{}
    return{seeded:st>0,companies:co,branches:br,students:st,employees:em,invoices:iv,message:st>0?`Simulation active — ${st} students, ${em} employees, ${br} branches`:"No simulation data"};},
});
