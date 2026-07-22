// ============================
// Demo Environment - Data Constants
// ============================
// All seed data is centralized here for maintainability.

// ============================
// Organization Hierarchy
// ============================
export const DEMO_ORG = {
  group: {
    name: "Veda EdTech Group",
    code: "VEDA_GROUP",
    type: "group" as const,
  },
  companies: [
    { name: "Veda EdTech UAE", code: "VEDA_UAE" },
  ],
  branches: [
    { name: "Dubai HQ", code: "DXB_HQ", address: "Dubai Knowledge Park, Dubai, UAE" },
    { name: "Sharjah", code: "SHJ", address: "University City, Sharjah, UAE" },
    { name: "Abu Dhabi", code: "AUH", address: "Zayed City, Abu Dhabi, UAE" },
  ],
};

// ============================
// Departments
// ============================
export const DEMO_DEPARTMENTS = [
  { name: "CEO Office", code: "CEO_OFF" },
  { name: "Technology", code: "TECH" },
  { name: "Finance", code: "FIN" },
  { name: "Marketing", code: "MKTG" },
  { name: "HR", code: "HR" },
  { name: "Academics", code: "ACAD" },
  { name: "Sales", code: "SALES" },
  { name: "Administration", code: "ADMIN" },
  { name: "Operations", code: "OPS" },
  { name: "Content", code: "CONTENT" },
  { name: "Customer Success", code: "CS" },
];

// ============================
// Teams
// ============================
export const DEMO_TEAMS = [
  { name: "Backend", code: "BE", departmentCode: "TECH" },
  { name: "Frontend", code: "FE", departmentCode: "TECH" },
  { name: "Admissions", code: "ADM", departmentCode: "ACAD" },
  { name: "Accounts", code: "ACCT", departmentCode: "FIN" },
  { name: "Support", code: "SUPP", departmentCode: "CS" },
  { name: "Academic Counselors", code: "AC_COUNSEL", departmentCode: "ACAD" },
  { name: "Faculty", code: "FAC", departmentCode: "ACAD" },
  { name: "Marketing Team", code: "MKTG_TEAM", departmentCode: "MKTG" },
  { name: "Operations", code: "OPS_TEAM", departmentCode: "OPS" },
  { name: "HR", code: "HR_TEAM", departmentCode: "HR" },
];

// ============================
// Demo User Profiles
// ============================
export interface DemoUserProfile {
  role: string;
  name: string;
  email: string;
  phone: string;
  employeeId: string;
  designation: string;
  departmentCode: string;
  teamCodes: string[];
  status: "Active" | "Inactive" | "On Leave";
  displayOrder: number;
}

export const DEMO_USERS: DemoUserProfile[] = [
  // Executive Team
  {
    role: "CEO", name: "Dr. Arjun Mehta", email: "ceo@vedaedtech.ae",
    phone: "+971-50-111-0001", employeeId: "EMP-001",
    designation: "Chief Executive Officer", departmentCode: "CEO_OFF",
    teamCodes: [], status: "Active", displayOrder: 1,
  },
  {
    role: "COO", name: "Priya Sharma", email: "coo@vedaedtech.ae",
    phone: "+971-50-111-0002", employeeId: "EMP-002",
    designation: "Chief Operating Officer", departmentCode: "OPS",
    teamCodes: ["OPS_TEAM"], status: "Active", displayOrder: 2,
  },
  {
    role: "CTO", name: "Rahul Verma", email: "cto@vedaedtech.ae",
    phone: "+971-50-111-0003", employeeId: "EMP-003",
    designation: "Chief Technology Officer", departmentCode: "TECH",
    teamCodes: ["BE", "FE"], status: "Active", displayOrder: 3,
  },
  {
    role: "CFO", name: "Ananya Patel", email: "cfo@vedaedtech.ae",
    phone: "+971-50-111-0004", employeeId: "EMP-004",
    designation: "Chief Financial Officer", departmentCode: "FIN",
    teamCodes: ["ACCT"], status: "Active", displayOrder: 4,
  },
  {
    role: "CMO", name: "Vikram Singh", email: "cmo@vedaedtech.ae",
    phone: "+971-50-111-0005", employeeId: "EMP-005",
    designation: "Chief Marketing Officer", departmentCode: "MKTG",
    teamCodes: ["MKTG_TEAM"], status: "Active", displayOrder: 5,
  },
  {
    role: "CHRO", name: "Neha Gupta", email: "chro@vedaedtech.ae",
    phone: "+971-50-111-0006", employeeId: "EMP-006",
    designation: "Chief Human Resources Officer", departmentCode: "HR",
    teamCodes: ["HR_TEAM"], status: "Active", displayOrder: 6,
  },
  // Management
  {
    role: "BranchDirector", name: "Suresh Nair", email: "director@vedaedtech.ae",
    phone: "+971-50-111-0007", employeeId: "EMP-007",
    designation: "Branch Director — Dubai HQ", departmentCode: "ADMIN",
    teamCodes: [], status: "Active", displayOrder: 7,
  },
  {
    role: "AcademicHead", name: "Dr. Deepa Krishnan", email: "academic@vedaedtech.ae",
    phone: "+971-50-111-0008", employeeId: "EMP-008",
    designation: "Academic Head", departmentCode: "ACAD",
    teamCodes: ["ADM", "AC_COUNSEL", "FAC"], status: "Active", displayOrder: 8,
  },
  {
    role: "SalesManager", name: "Karan Joshi", email: "sales@vedaedtech.ae",
    phone: "+971-50-111-0009", employeeId: "EMP-009",
    designation: "Sales Manager", departmentCode: "SALES",
    teamCodes: [], status: "Active", displayOrder: 9,
  },
  // Operations
  {
    role: "Counselor", name: "Fatima Al Zahra", email: "counselor@vedaedtech.ae",
    phone: "+971-50-111-0010", employeeId: "EMP-010",
    designation: "Academic Counselor", departmentCode: "ACAD",
    teamCodes: ["AC_COUNSEL"], status: "Active", displayOrder: 10,
  },
  {
    role: "Faculty", name: "Prof. Arun Kumar", email: "faculty@vedaedtech.ae",
    phone: "+971-50-111-0011", employeeId: "EMP-011",
    designation: "Senior Faculty — Data Science", departmentCode: "ACAD",
    teamCodes: ["FAC"], status: "Active", displayOrder: 11,
  },
  {
    role: "Accountant", name: "Meera Iyer", email: "accountant@vedaedtech.ae",
    phone: "+971-50-111-0012", employeeId: "EMP-012",
    designation: "Senior Accountant", departmentCode: "FIN",
    teamCodes: ["ACCT"], status: "Active", displayOrder: 12,
  },
  // Users
  {
    role: "Student", name: "Aisha Khan", email: "student@vedaedtech.ae",
    phone: "+971-50-111-0013", employeeId: "STU-001",
    designation: "Student — Grade 12", departmentCode: "ACAD",
    teamCodes: [], status: "Active", displayOrder: 13,
  },
  {
    role: "Parent", name: "Mrs. Fatima Khan", email: "parent@vedaedtech.ae",
    phone: "+971-50-111-0014", employeeId: "PAR-001",
    designation: "Parent — Aisha Khan (Grade 12)", departmentCode: "ADMIN",
    teamCodes: [], status: "Active", displayOrder: 14,
  },
];

// ============================
// Demo Leads (25)
// ============================
export const DEMO_LEADS = [
  { name: "Omar Hassan", email: "omar.h@email.com", phone: "+971-50-200-0001", source: "Website", priority: "Hot", score: 85, assignedToRole: "Counselor" },
  { name: "Layla Ahmed", email: "layla.a@email.com", phone: "+971-50-200-0002", source: "Facebook", priority: "Hot", score: 78, assignedToRole: "Counselor" },
  { name: "Zayed Ali", email: "zayed.a@email.com", phone: "+971-50-200-0003", source: "Referral", priority: "Warm", score: 65, assignedToRole: "Counselor" },
  { name: "Noora Salem", email: "noora.s@email.com", phone: "+971-50-200-0004", source: "Instagram", priority: "Warm", score: 60, assignedToRole: "Counselor" },
  { name: "Khalid Malik", email: "khalid.m@email.com", phone: "+971-50-200-0005", source: "Google Search", priority: "Cold", score: 35, assignedToRole: "Counselor" },
  { name: "Mariam Yusuf", email: "mariam.y@email.com", phone: "+971-50-200-0006", source: "LinkedIn", priority: "Hot", score: 82, assignedToRole: "Counselor" },
  { name: "Ahmed Ibrahim", email: "ahmed.i@email.com", phone: "+971-50-200-0007", source: "Referral", priority: "Warm", score: 70, assignedToRole: "SalesManager" },
  { name: "Sara Mansour", email: "sara.m@email.com", phone: "+971-50-200-0008", source: "YouTube", priority: "Cold", score: 25, assignedToRole: "SalesManager" },
  { name: "Hussein Rashed", email: "hussein.r@email.com", phone: "+971-50-200-0009", source: "Email Campaign", priority: "Hot", score: 90, assignedToRole: "Counselor" },
  { name: "Amira Sultan", email: "amira.s@email.com", phone: "+971-50-200-0010", source: "WhatsApp", priority: "Warm", score: 55, assignedToRole: "Counselor" },
  { name: "Sami Faisal", email: "sami.f@email.com", phone: "+971-50-200-0011", source: "Website", priority: "Cold", score: 15, assignedToRole: "Counselor" },
  { name: "Lina Qadir", email: "lina.q@email.com", phone: "+971-50-200-0012", source: "Instagram", priority: "Warm", score: 68, assignedToRole: "Counselor" },
  { name: "Tariq Nasir", email: "tariq.n@email.com", phone: "+971-50-200-0013", source: "Facebook", priority: "Hot", score: 75, assignedToRole: "SalesManager" },
  { name: "Yasmin Othman", email: "yasmin.o@email.com", phone: "+971-50-200-0014", source: "Radio", priority: "Cold", score: 10, assignedToRole: "Counselor" },
  { name: "Rashid Hamdan", email: "rashid.h@email.com", phone: "+971-50-200-0015", source: "Google Display", priority: "Warm", score: 45, assignedToRole: "Counselor" },
  { name: "Dana Khalaf", email: "dana.k@email.com", phone: "+971-50-200-0016", source: "Referral", priority: "Hot", score: 88, assignedToRole: "Counselor" },
  { name: "Fahad Nasser", email: "fahad.n@email.com", phone: "+971-50-200-0017", source: "LinkedIn", priority: "Cold", score: 20, assignedToRole: "SalesManager" },
  { name: "Nadia Fayez", email: "nadia.f@email.com", phone: "+971-50-200-0018", source: "Website", priority: "Warm", score: 58, assignedToRole: "Counselor" },
  { name: "Jamal Aziz", email: "jamal.a@email.com", phone: "+971-50-200-0019", source: "SMS Campaign", priority: "Hot", score: 80, assignedToRole: "Counselor" },
  { name: "Hana Barakat", email: "hana.b@email.com", phone: "+971-50-200-0020", source: "YouTube", priority: "Cold", score: 30, assignedToRole: "Counselor" },
  { name: "Mona Adel", email: "mona.a@email.com", phone: "+971-50-200-0021", source: "Event", priority: "Warm", score: 62, assignedToRole: "SalesManager" },
  { name: "Bassem Khoury", email: "bassem.k@email.com", phone: "+971-50-200-0022", source: "Facebook", priority: "Hot", score: 72, assignedToRole: "Counselor" },
  { name: "Rania Toufic", email: "rania.t@email.com", phone: "+971-50-200-0023", source: "Instagram", priority: "Cold", score: 28, assignedToRole: "Counselor" },
  { name: "Walid Shaker", email: "walid.s@email.com", phone: "+971-50-200-0024", source: "Referral", priority: "Warm", score: 50, assignedToRole: "Counselor" },
  { name: "Salma Hayek", email: "salma.h@email.com", phone: "+971-50-200-0025", source: "Google Search", priority: "Cold", score: 12, assignedToRole: "SalesManager" },
];

// ============================
// Demo Students (15)
// ============================
export const DEMO_STUDENTS = [
  { name: "Aisha Khan", email: "aisha.k@student.ae", grade: "12", section: "A", parentName: "Mrs. Fatima Khan", parentEmail: "parent@vedaedtech.ae", parentPhone: "+971-50-111-0014", attendance: 95, performance: 88, parentRole: "Parent" },
  { name: "Omar Rashid", email: "omar.r@student.ae", grade: "12", section: "A", parentName: "Rashid Ahmed", parentEmail: "rashid.a@email.com", parentPhone: "+971-50-200-0030", attendance: 92, performance: 85 },
  { name: "Layla Mahmoud", email: "layla.m@student.ae", grade: "11", section: "B", parentName: "Mahmoud Khalid", parentEmail: "mahmoud.k@email.com", parentPhone: "+971-50-200-0031", attendance: 88, performance: 78 },
  { name: "Zayed Ali", email: "zayed.s@student.ae", grade: "11", section: "A", parentName: "Ali Hassan", parentEmail: "ali.h@email.com", parentPhone: "+971-50-200-0032", attendance: 96, performance: 92 },
  { name: "Mariam Yusuf", email: "mariam.y@student.ae", grade: "10", section: "A", parentName: "Yusuf Ibrahim", parentEmail: "yusuf.i@email.com", parentPhone: "+971-50-200-0033", attendance: 85, performance: 72 },
  { name: "Amira Sultan", email: "amira.s@student.ae", grade: "10", section: "B", parentName: "Sultan Nasser", parentEmail: "sultan.n@email.com", parentPhone: "+971-50-200-0034", attendance: 90, performance: 80 },
  { name: "Khalid Malik", email: "khalid.m@student.ae", grade: "9", section: "A", parentName: "Malik Rahman", parentEmail: "malik.r@email.com", parentPhone: "+971-50-200-0035", attendance: 78, performance: 65 },
  { name: "Noora Salem", email: "noora.s@student.ae", grade: "9", section: "B", parentName: "Salem Ahmed", parentEmail: "salem.a@email.com", parentPhone: "+971-50-200-0036", attendance: 94, performance: 90 },
  { name: "Tariq Nasir", email: "tariq.n@student.ae", grade: "8", section: "A", parentName: "Nasir Ali", parentEmail: "nasir.a@email.com", parentPhone: "+971-50-200-0037", attendance: 82, performance: 70 },
  { name: "Hana Barakat", email: "hana.b@student.ae", grade: "8", section: "B", parentName: "Barakat Waleed", parentEmail: "barakat.w@email.com", parentPhone: "+971-50-200-0038", attendance: 91, performance: 85 },
  { name: "Sami Faisal", email: "sami.f@student.ae", grade: "7", section: "A", parentName: "Faisal Omar", parentEmail: "faisal.o@email.com", parentPhone: "+971-50-200-0039", attendance: 88, performance: 76 },
  { name: "Dana Khalaf", email: "dana.k@student.ae", grade: "7", section: "B", parentName: "Khalaf Mansour", parentEmail: "khalaf.m@email.com", parentPhone: "+971-50-200-0040", attendance: 95, performance: 94 },
  { name: "Rania Toufic", email: "rania.t@student.ae", grade: "6", section: "A", parentName: "Toufic Jamil", parentEmail: "toufic.j@email.com", parentPhone: "+971-50-200-0041", attendance: 80, performance: 68 },
  { name: "Jamal Aziz", email: "jamal.a@student.ae", grade: "6", section: "B", parentName: "Aziz Khalid", parentEmail: "aziz.k@email.com", parentPhone: "+971-50-200-0042", attendance: 93, performance: 88 },
  { name: "Bassem Khoury", email: "bassem.k@student.ae", grade: "5", section: "A", parentName: "Khoury Nabil", parentEmail: "khoury.n@email.com", parentPhone: "+971-50-200-0043", attendance: 87, performance: 75 },
];

// ============================
// Demo Admissions (10)
// ============================
export const DEMO_ADMISSIONS = [
  { studentName: "Ali Mansour", studentEmail: "ali.m@prospect.ae", program: "Grade 12 — Advanced Science", grade: "12", status: "In Progress", feeQuoted: 45000, feePaid: 15000, source: "Website", assignedToRole: "Counselor" },
  { studentName: "Nadia Sameer", studentEmail: "nadia.s@prospect.ae", program: "Grade 11 — Mathematics", grade: "11", status: "New", feeQuoted: 42000, feePaid: 0, source: "Facebook", assignedToRole: "Counselor" },
  { studentName: "Hassan Qadir", studentEmail: "hassan.q@prospect.ae", program: "Grade 10 — General", grade: "10", status: "Approved", feeQuoted: 38000, feePaid: 38000, source: "Referral", assignedToRole: "Counselor" },
  { studentName: "Mona Adel", studentEmail: "mona.a@prospect.ae", program: "Grade 9 — General", grade: "9", status: "Enrolled", feeQuoted: 35000, feePaid: 35000, source: "Instagram", assignedToRole: "Counselor" },
  { studentName: "Fahad Nasser", studentEmail: "fahad.n@prospect.ae", program: "Grade 8 — General", grade: "8", status: "In Progress", feeQuoted: 32000, feePaid: 10000, source: "Google Search", assignedToRole: "SalesManager" },
  { studentName: "Walid Shaker", studentEmail: "walid.s@prospect.ae", program: "Grade 7 — General", grade: "7", status: "New", feeQuoted: 30000, feePaid: 0, source: "WhatsApp", assignedToRole: "Counselor" },
  { studentName: "Salma Hayek", studentEmail: "salma.h@prospect.ae", program: "Grade 12 — Commerce", grade: "12", status: "Approved", feeQuoted: 44000, feePaid: 44000, source: "LinkedIn", assignedToRole: "SalesManager" },
  { studentName: "Yasmin Othman", studentEmail: "yasmin.o@prospect.ae", program: "Grade 11 — Humanities", grade: "11", status: "Enrolled", feeQuoted: 40000, feePaid: 40000, source: "Referral", assignedToRole: "Counselor" },
  { studentName: "Lina Qadir", studentEmail: "lina.q@prospect.ae", program: "Grade 6 — General", grade: "6", status: "In Progress", feeQuoted: 28000, feePaid: 8000, source: "Website", assignedToRole: "Counselor" },
  { studentName: "Rashid Hamdan", studentEmail: "rashid.h@prospect.ae", program: "Grade 10 — General", grade: "10", status: "New", feeQuoted: 38000, feePaid: 0, source: "Event", assignedToRole: "SalesManager" },
];

// ============================
// Demo Task Templates
// ============================
export interface TaskTemplate {
  title: string;
  description: string;
  taskType: string;
  priority: string;
  status: string;
  assignedToRole: string;
}

export const DEMO_TASKS: TaskTemplate[] = [
  { title: "Follow up with Omar Hassan", description: "Hot lead — called twice, no response. Try WhatsApp.", taskType: "Follow-up", priority: "High", status: "Pending", assignedToRole: "Counselor" },
  { title: "Review admission application — Ali Mansour", description: "Verify documents and schedule entrance test.", taskType: "Admission", priority: "High", status: "In Progress", assignedToRole: "Counselor" },
  { title: "Prepare monthly sales report", description: "Compile lead conversion, revenue, and pipeline data.", taskType: "Report", priority: "Medium", status: "Pending", assignedToRole: "SalesManager" },
  { title: "Grade class assignments — Grade 12 Math", description: "15 assignments to grade by Friday.", taskType: "Academic", priority: "High", status: "Pending", assignedToRole: "Faculty" },
  { title: "Schedule parent-teacher meeting", description: "Coordinate with parents of Grade 10 students.", taskType: "Meeting", priority: "Medium", status: "In Progress", assignedToRole: "AcademicHead" },
  { title: "Update website course catalog", description: "Add new Data Science program details.", taskType: "Content", priority: "Low", status: "Pending", assignedToRole: "CMO" },
  { title: "Review Q2 financial statements", description: "Review and approve quarterly financial reports.", taskType: "Finance", priority: "High", status: "In Progress", assignedToRole: "CFO" },
  { title: "Approve new hire — Frontend Developer", description: "Review application and approve offer letter.", taskType: "HR", priority: "Medium", status: "Pending", assignedToRole: "CHRO" },
  { title: "Prepare demo day presentation", description: "Showcase new product features to stakeholders.", taskType: "Presentation", priority: "High", status: "In Progress", assignedToRole: "CTO" },
  { title: "Run platform security audit", description: "Conduct penetration testing and review access logs.", taskType: "Security", priority: "Critical", status: "Pending", assignedToRole: "CTO" },
  { title: "Create social media campaign for summer batch", description: "Design and schedule posts for Instagram and Facebook.", taskType: "Marketing", priority: "Medium", status: "Pending", assignedToRole: "CMO" },
  { title: "Process June payroll", description: "Calculate salaries, deductions, and process payments.", taskType: "Finance", priority: "High", status: "In Progress", assignedToRole: "Accountant" },
  { title: "Conduct weekly team standup", description: "Daily standup with backend and frontend teams.", taskType: "Meeting", priority: "Low", status: "Completed", assignedToRole: "CTO" },
  { title: "Prepare student progress reports", description: "Generate and distribute progress reports for all classes.", taskType: "Academic", priority: "Medium", status: "Pending", assignedToRole: "Faculty" },
  { title: "Review scholarship applications", description: "Shortlist candidates for the Merit Scholarship program.", taskType: "Admission", priority: "High", status: "In Progress", assignedToRole: "AcademicHead" },
  { title: "Update CRM lead scoring rules", description: "Adjust scoring thresholds based on conversion data.", taskType: "Admin", priority: "Medium", status: "Pending", assignedToRole: "SalesManager" },
  { title: "Plan annual day event", description: "Coordinate with departments for the Annual Day celebration.", taskType: "Event", priority: "Low", status: "Pending", assignedToRole: "COO" },
  { title: "Audit branch operations — Sharjah", description: "Visit Sharjah branch and audit operational processes.", taskType: "Audit", priority: "High", status: "Pending", assignedToRole: "COO" },
  { title: "Review IT infrastructure upgrade proposal", description: "Evaluate cloud migration proposal from Tech team.", taskType: "Strategy", priority: "Medium", status: "In Progress", assignedToRole: "CEO" },
  { title: "Approved — Holiday calendar 2026", description: "Finalize and circulate the holiday calendar for next year.", taskType: "Admin", priority: "Low", status: "Completed", assignedToRole: "CEO" },
];

// ============================
// Demo Notification Templates
// ============================
export interface NotificationTemplate {
  title: string;
  message: string;
  type: string;
  role: string;
}

export const DEMO_NOTIFICATIONS: NotificationTemplate[] = [
  { title: "New Lead Assigned", message: "A new hot lead (Omar Hassan) has been assigned to you.", type: "lead", role: "Counselor" },
  { title: "Admission Approved", message: "Hassan Qadir's admission application has been approved.", type: "admission", role: "Counselor" },
  { title: "Task Reminder", message: "Follow up with Mariam Yusuf is pending since 2 days.", type: "task", role: "Counselor" },
  { title: "Payment Received", message: "Tuition fee payment of AED 38,000 received for Grade 10.", type: "payment", role: "Accountant" },
  { title: "Meeting Scheduled", message: "Parent-teacher meeting scheduled for Friday at 3 PM.", type: "meeting", role: "AcademicHead" },
  { title: "System Alert", message: "Platform uptime at 99.97% this week. No incidents reported.", type: "system", role: "CTO" },
  { title: "New Enrollment", message: "Mona Adel has been enrolled in Grade 9 — General.", type: "enrollment", role: "CEO" },
  { title: "Payroll Processed", message: "June payroll has been processed successfully.", type: "payroll", role: "CFO" },
  { title: "Social Media Report", message: "Weekly engagement report is ready for review.", type: "report", role: "CMO" },
  { title: "HR Update", message: "New hire onboarding completed for 3 team members.", type: "hr", role: "CHRO" },
  { title: "Lead Converted", message: "Mariam Yusuf has been converted to enrolled student.", type: "success", role: "Counselor" },
  { title: "Exam Schedule", message: "Final exam schedule for Grade 12 has been published.", type: "academic", role: "Faculty" },
  { title: "Attendance Alert", message: "Khalid Malik's attendance has dropped below 80%.", type: "warning", role: "Faculty" },
  { title: "Branch Performance", message: "Dubai HQ achieved 115% of monthly target.", type: "success", role: "BranchDirector" },
  { title: "Scholarship Deadline", message: "Merit scholarship applications close in 5 days.", type: "reminder", role: "AcademicHead" },
];

// ============================
// Demo Activity Descriptions
// ============================
export const DEMO_ACTIVITIES = [
  { action: "Signed in", entity: "Session", userName: "Dr. Arjun Mehta", userRole: "CEO" },
  { action: "Reviewed quarterly report", entity: "Report", userName: "Dr. Arjun Mehta", userRole: "CEO" },
  { action: "Approved budget allocation", entity: "Budget", userName: "Dr. Arjun Mehta", userRole: "CEO" },
  { action: "Assigned lead to Fatima", entity: "Lead", userName: "Karan Joshi", userRole: "SalesManager" },
  { action: "Updated lead status", entity: "Lead", userName: "Fatima Al Zahra", userRole: "Counselor" },
  { action: "Created admission record", entity: "Admission", userName: "Fatima Al Zahra", userRole: "Counselor" },
  { action: "Submitted grades", entity: "Grade", userName: "Prof. Arun Kumar", userRole: "Faculty" },
  { action: "Marked attendance", entity: "Attendance", userName: "Prof. Arun Kumar", userRole: "Faculty" },
  { action: "Processed fee payment", entity: "Fee", userName: "Meera Iyer", userRole: "Accountant" },
  { action: "Updated student profile", entity: "Student", userName: "Fatima Al Zahra", userRole: "Counselor" },
  { action: "Deployed platform update", entity: "Deployment", userName: "Rahul Verma", userRole: "CTO" },
  { action: "Published blog post", entity: "Content", userName: "Vikram Singh", userRole: "CMO" },
  { action: "Conducted team meeting", entity: "Meeting", userName: "Priya Sharma", userRole: "COO" },
  { action: "Reviewed financials", entity: "Finance", userName: "Ananya Patel", userRole: "CFO" },
  { action: "Approved leave request", entity: "Leave", userName: "Neha Gupta", userRole: "CHRO" },
  { action: "Sent follow-up email", entity: "Follow-up", userName: "Fatima Al Zahra", userRole: "Counselor" },
  { action: "Generated student report", entity: "Report", userName: "Dr. Deepa Krishnan", userRole: "AcademicHead" },
  { action: "Updated curriculum", entity: "Curriculum", userName: "Prof. Arun Kumar", userRole: "Faculty" },
  { action: "Created marketing campaign", entity: "Campaign", userName: "Vikram Singh", userRole: "CMO" },
  { action: "Onboarded new employee", entity: "Employee", userName: "Neha Gupta", userRole: "CHRO" },
  { action: "Opened new lead", entity: "Lead", userName: "Fatima Al Zahra", userRole: "Counselor" },
  { action: "Processed invoice", entity: "Invoice", userName: "Meera Iyer", userRole: "Accountant" },
  { action: "Scheduled parent meeting", entity: "Meeting", userName: "Dr. Deepa Krishnan", userRole: "AcademicHead" },
  { action: "Reviewed security logs", entity: "Security", userName: "Rahul Verma", userRole: "CTO" },
  { action: "Approved scholarship", entity: "Scholarship", userName: "Dr. Arjun Mehta", userRole: "CEO" },
  { action: "Visited Sharjah branch", entity: "Visit", userName: "Suresh Nair", userRole: "BranchDirector" },
  { action: "Conducted staff training", entity: "Training", userName: "Neha Gupta", userRole: "CHRO" },
  { action: "Updated lead scoring rules", entity: "Score", userName: "Karan Joshi", userRole: "SalesManager" },
  { action: "Closed won deal", entity: "Deal", userName: "Karan Joshi", userRole: "SalesManager" },
  { action: "Ran platform backup", entity: "Backup", userName: "Rahul Verma", userRole: "CTO" },
  { action: "Grade 12 — Advanced Science", entity: "Class", userName: "Prof. Arun Kumar", userRole: "Faculty" },
  { action: "Added course material", entity: "Course", userName: "Prof. Arun Kumar", userRole: "Faculty" },
  { action: "Updated fee structure", entity: "Fee", userName: "Ananya Patel", userRole: "CFO" },
  { action: "Reviewed campaign performance", entity: "Campaign", userName: "Vikram Singh", userRole: "CMO" },
  { action: "Approved leave for 2 employees", entity: "Leave", userName: "Neha Gupta", userRole: "CHRO" },
  { action: "Checked attendance report", entity: "Attendance", userName: "Aisha Khan", userRole: "Student" },
  { action: "Submitted homework", entity: "Homework", userName: "Aisha Khan", userRole: "Student" },
  { action: "Viewed fee details", entity: "Fee", userName: "Mrs. Fatima Khan", userRole: "Parent" },
  { action: "Accessed student portal", entity: "Portal", userName: "Mrs. Fatima Khan", userRole: "Parent" },
  { action: "Updated branch KPIs", entity: "KPI", userName: "Suresh Nair", userRole: "BranchDirector" },
  { action: "Conducted demo class", entity: "Demo", userName: "Prof. Arun Kumar", userRole: "Faculty" },
  { action: "Processed refund", entity: "Refund", userName: "Meera Iyer", userRole: "Accountant" },
  { action: "Updated contact details", entity: "Contact", userName: "Fatima Al Zahra", userRole: "Counselor" },
  { action: "Created task for team", entity: "Task", userName: "Dr. Arjun Mehta", userRole: "CEO" },
  { action: "Reviewed student feedback", entity: "Feedback", userName: "Dr. Deepa Krishnan", userRole: "AcademicHead" },
  { action: "Approved vendor payment", entity: "Payment", userName: "Ananya Patel", userRole: "CFO" },
  { action: "Uploaded assignment", entity: "Assignment", userName: "Prof. Arun Kumar", userRole: "Faculty" },
  { action: "Sent batch notification", entity: "Notification", userName: "Dr. Deepa Krishnan", userRole: "AcademicHead" },
  { action: "Updated timetable", entity: "Timetable", userName: "Prof. Arun Kumar", userRole: "Faculty" },
  { action: "Configured system settings", entity: "Settings", userName: "Rahul Verma", userRole: "CTO" },
];

// ============================
// Timeline Events
// ============================
export const DEMO_TIMELINE_EVENTS = [
  { title: "Lead Created", description: "Omar Hassan added as a new lead via Website", eventType: "created", entityType: "Lead" },
  { title: "Email Sent", description: "Follow-up email sent to Omar Hassan", eventType: "email", entityType: "Lead" },
  { title: "Phone Call", description: "15 min phone call — Omar showed interest in Data Science", eventType: "call", entityType: "Lead" },
  { title: "Demo Scheduled", description: "Demo class scheduled for Saturday 11 AM", eventType: "meeting", entityType: "Lead" },
  { title: "Application Submitted", description: "Admission application received for Ali Mansour", eventType: "submitted", entityType: "Admission" },
  { title: "Documents Verified", description: "All documents verified and approved", eventType: "completed", entityType: "Admission" },
  { title: "Entrance Test", description: "Student scored 85% in entrance assessment", eventType: "assessment", entityType: "Admission" },
  { title: "Fee Payment", description: "Initial payment of AED 15,000 received", eventType: "payment", entityType: "Admission" },
  { title: "Enrolled", description: "Student successfully enrolled in Grade 12 — Advanced Science", eventType: "success", entityType: "Admission" },
  { title: "Attendance Marked", description: "Present — All classes attended today", eventType: "attendance", entityType: "Student" },
  { title: "Assignment Submitted", description: "Mathematics assignment submitted on time", eventType: "submission", entityType: "Student" },
  { title: "Exam Result", description: "Scored 92/100 in Mathematics mid-term", eventType: "result", entityType: "Student" },
  { title: "Parent Meeting", description: "Meeting with Mrs. Fatima Khan regarding academic progress", eventType: "meeting", entityType: "Student" },
  { title: "Fee Reminder Sent", description: "Second installment reminder sent to parent", eventType: "notification", entityType: "Fee" },
  { title: "Task Created", description: "Review Q2 financial statements task created", eventType: "created", entityType: "Task" },
  { title: "Status Changed", description: "Lead moved from Warm to Hot after demo attendance", eventType: "updated", entityType: "Lead" },
  { title: "Comment Added", description: "Follow-up notes added by Fatima Al Zahra", eventType: "comment", entityType: "Lead" },
  { title: "Document Uploaded", description: "Report card uploaded to student profile", eventType: "upload", entityType: "Document" },
  { title: "Approval Granted", description: "Scholarship of 25% approved for meritorious student", eventType: "approved", entityType: "Scholarship" },
  { title: "Batch Assigned", description: "Student assigned to morning batch (7-9 AM)", eventType: "updated", entityType: "Student" },
];

// ============================
// Comments
// ============================
export const DEMO_COMMENTS = [
  { content: "Very interested in the Data Science program. Requested a demo class.", entityType: "Lead", userName: "Fatima Al Zahra", userRole: "Counselor" },
  { content: "Called twice — no response. Will try WhatsApp.", entityType: "Lead", userName: "Fatima Al Zahra", userRole: "Counselor" },
  { content: "Parent attended the open house. Very positive feedback.", entityType: "Lead", userName: "Karan Joshi", userRole: "SalesManager" },
  { content: "Documents verified — all in order. Ready for approval.", entityType: "Admission", userName: "Fatima Al Zahra", userRole: "Counselor" },
  { content: "Fee concession requested by parent. Needs approval from CFO.", entityType: "Admission", userName: "Dr. Deepa Krishnan", userRole: "AcademicHead" },
  { content: "Student is performing exceptionally well in Mathematics.", entityType: "Student", userName: "Prof. Arun Kumar", userRole: "Faculty" },
  { content: "Attendance concern — please schedule a parent meeting.", entityType: "Student", userName: "Prof. Arun Kumar", userRole: "Faculty" },
  { content: "Payment received. Receipt shared with parent.", entityType: "Fee", userName: "Meera Iyer", userRole: "Accountant" },
  { content: "Campaign performance is above target this quarter. Great work team!", entityType: "Campaign", userName: "Vikram Singh", userRole: "CMO" },
  { content: "Security audit scheduled for next week. Preparing access logs.", entityType: "Task", userName: "Rahul Verma", userRole: "CTO" },
  { content: "Please review the budget proposal before Friday.", entityType: "Budget", userName: "Ananya Patel", userRole: "CFO" },
  { content: "New hire orientation completed. Team is settling in well.", entityType: "HR", userName: "Neha Gupta", userRole: "CHRO" },
  { content: "Demo class was excellent. Student is now ready to enroll.", entityType: "Lead", userName: "Fatima Al Zahra", userRole: "Counselor" },
  { content: "Follow-up call scheduled for next Tuesday.", entityType: "Lead", userName: "Fatima Al Zahra", userRole: "Counselor" },
  { content: "Approved — proceed with the enrollment process.", entityType: "Admission", userName: "Dr. Arjun Mehta", userRole: "CEO" },
  { content: "Requested additional information about scholarship options.", entityType: "Lead", userName: "Fatima Al Zahra", userRole: "Counselor" },
  { content: "Parent portal access granted. Tracking fee payments.", entityType: "Student", userName: "Mrs. Fatima Khan", userRole: "Parent" },
  { content: "Homework submitted via portal. All correct.", entityType: "Student", userName: "Prof. Arun Kumar", userRole: "Faculty" },
  { content: "Reviewed Lina's progress. Suggest additional Math practice.", entityType: "Student", userName: "Prof. Arun Kumar", userRole: "Faculty" },
  { content: "Need to discuss branch expansion plan in next board meeting.", entityType: "Meeting", userName: "Dr. Arjun Mehta", userRole: "CEO" },
  { content: "System upgrade deployed to production. No downtime.", entityType: "System", userName: "Rahul Verma", userRole: "CTO" },
  { content: "Marketing budget for Q3 needs revision.", entityType: "Budget", userName: "Vikram Singh", userRole: "CMO" },
  { content: "On track to exceed this quarter's enrollment target by 20%.", entityType: "Report", userName: "Karan Joshi", userRole: "SalesManager" },
  { content: "Parent meeting was constructive. Agreed on improvement plan.", entityType: "Meeting", userName: "Dr. Deepa Krishnan", userRole: "AcademicHead" },
  { content: "Please update the student handbook for the new academic year.", entityType: "Admin", userName: "Suresh Nair", userRole: "BranchDirector" },
];

// ============================
// Attachment Descriptions
// ============================
export const DEMO_ATTACHMENTS = [
  { name: "Report_Card_Q2.pdf", type: "application/pdf", size: 245000, entityType: "Student" },
  { name: "Admission_Form_Ali_M.pdf", type: "application/pdf", size: 520000, entityType: "Admission" },
  { name: "ID_Proof_Omar.pdf", type: "application/pdf", size: 180000, entityType: "Lead" },
  { name: "Grade_Transcript.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 95000, entityType: "Student" },
  { name: "Fee_Receipt_June.pdf", type: "application/pdf", size: 120000, entityType: "Fee" },
  { name: "Course_Brochure.pdf", type: "application/pdf", size: 1500000, entityType: "Marketing" },
  { name: "Attendance_Report_June.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 78000, entityType: "Student" },
  { name: "Parent_Consent_Form.pdf", type: "application/pdf", size: 210000, entityType: "Admission" },
  { name: "Scholarship_Application.pdf", type: "application/pdf", size: 340000, entityType: "Student" },
  { name: "Event_Photos.zip", type: "application/zip", size: 5200000, entityType: "Event" },
];

// ============================
// Audit Record Templates
// ============================
export const DEMO_AUDIT_RECORDS = [
  { action: "User Login", entity: "Session" },
  { action: "Lead Created", entity: "Lead" },
  { action: "Lead Updated", entity: "Lead" },
  { action: "Admission Created", entity: "Admission" },
  { action: "Admission Status Changed", entity: "Admission" },
  { action: "Fee Payment Processed", entity: "Fee" },
  { action: "Student Record Updated", entity: "Student" },
  { action: "Attendance Marked", entity: "Attendance" },
  { action: "Grades Submitted", entity: "Grade" },
  { action: "Report Generated", entity: "Report" },
  { action: "Task Created", entity: "Task" },
  { action: "Task Completed", entity: "Task" },
  { action: "User Role Modified", entity: "User" },
  { action: "System Configuration Updated", entity: "System" },
  { action: "Notification Sent", entity: "Notification" },
  { action: "Profile Updated", entity: "Profile" },
  { action: "Document Uploaded", entity: "Document" },
  { action: "Comment Added", entity: "Comment" },
  { action: "Data Export", entity: "Export" },
  { action: "Data Import", entity: "Import" },
  { action: "Budget Approved", entity: "Budget" },
  { action: "Leave Request Processed", entity: "Leave" },
  { action: "Campaign Launched", entity: "Campaign" },
  { action: "Course Created", entity: "Course" },
  { action: "Parent Meeting Scheduled", entity: "Meeting" },
  { action: "Scholarship Approved", entity: "Scholarship" },
  { action: "Password Reset", entity: "Security" },
  { action: "Branch Visit Logged", entity: "Visit" },
  { action: "Training Completed", entity: "Training" },
  { action: "Invoice Generated", entity: "Invoice" },
  { action: "Curriculum Updated", entity: "Curriculum" },
  { action: "Marketing Campaign Ended", entity: "Campaign" },
  { action: "Employee Onboarded", entity: "Employee" },
  { action: "Platform Backup Completed", entity: "System" },
  { action: "Lead Assigned", entity: "Lead" },
  { action: "Follow-up Completed", entity: "Follow-up" },
  { action: "Demo Class Conducted", entity: "Demo" },
  { action: "Enrollment Confirmed", entity: "Enrollment" },
  { action: "Refund Processed", entity: "Refund" },
  { action: "Vendor Payment Approved", entity: "Payment" },
  { action: "Compliance Check Completed", entity: "Compliance" },
  { action: "Newsletter Sent", entity: "Communication" },
  { action: "System Health Check", entity: "System" },
  { action: "API Key Rotated", entity: "Security" },
  { action: "Announcement Published", entity: "Communication" },
  { action: "Student Transfer Requested", entity: "Student" },
  { action: "Fee Structure Updated", entity: "Fee" },
  { action: "Performance Review Completed", entity: "HR" },
  { action: "Inventory Check", entity: "Inventory" },
  { action: "Access Audit Review", entity: "Security" },
];
