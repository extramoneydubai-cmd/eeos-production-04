#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const ROOT = '/home/daytona/codebase';

// Read each file, find the SEED_DATA block, replace with real data
const seeds = {
  'hrEmployeeCategories': `const SEED_DATA = [
  { name: "Faculty", code: "FAC", categoryType: "Academic", description: "Teaching and research faculty members", color: "#4285f4", icon: "GraduationCap" },
  { name: "Staff", code: "STAFF", categoryType: "Non-Academic", description: "Administrative and support staff", color: "#34a853", icon: "Users" },
  { name: "Management", code: "MGMT", categoryType: "Leadership", description: "Management and leadership roles", color: "#a855f7", icon: "UserCog" },
  { name: "Contractual", code: "CONT", categoryType: "Temporary", description: "Contractual and outsourced employees", color: "#f59e0b", icon: "FileText" },
  { name: "Intern", code: "INTERN", categoryType: "Trainee", description: "Interns and trainees", color: "#0d9488", icon: "BookOpen" },
  { name: "Consultant", code: "CONS", categoryType: "Advisor", description: "External consultants and advisors", color: "#4f46e5", icon: "Briefcase" },
];`,
  'hrWorkLocations': `const SEED_DATA = [
  { name: "Head Office", code: "HO", locationType: "Office", city: "Dubai", country: "UAE", description: "Main headquarters", color: "#4285f4", icon: "Building" },
  { name: "Campus A", code: "CAMP_A", locationType: "Campus", city: "Dubai", country: "UAE", description: "Primary academic campus", color: "#34a853", icon: "School" },
  { name: "Branch Office", code: "BO", locationType: "Office", city: "Abu Dhabi", country: "UAE", description: "Regional branch office", color: "#a855f7", icon: "Building2" },
  { name: "Remote", code: "REMOTE", locationType: "Remote", city: "", country: "", description: "Remote work location", color: "#f59e0b", icon: "Wifi" },
  { name: "Client Site", code: "CLIENT", locationType: "Client Site", city: "", country: "", description: "On-site at client location", color: "#e8710a", icon: "Briefcase" },
];`,
  'hrSkills': `const SEED_DATA = [
  { name: "JavaScript", code: "JS", skillCategory: "Technical", description: "JavaScript programming", color: "#f7df1e", icon: "Code" },
  { name: "Python", code: "PY", skillCategory: "Technical", description: "Python programming", color: "#3776AB", icon: "Code" },
  { name: "Leadership", code: "LEAD", skillCategory: "Management", description: "Team leadership and management", color: "#a855f7", icon: "UserCog" },
  { name: "Communication", code: "COMM", skillCategory: "Soft Skill", description: "Verbal and written communication", color: "#4285f4", icon: "MessageSquare" },
  { name: "Data Analysis", code: "DA", skillCategory: "Technical", description: "Data analysis and interpretation", color: "#34a853", icon: "FileSpreadsheet" },
  { name: "Public Speaking", code: "PUB_SPK", skillCategory: "Soft Skill", description: "Public speaking and presentations", color: "#ea4335", icon: "Megaphone" },
  { name: "UI/UX Design", code: "UIUX", skillCategory: "Creative", description: "User interface and experience design", color: "#06b6d4", icon: "Palette" },
];`,
  'hrExperienceLevels': `const SEED_DATA = [
  { name: "Entry Level", code: "ENTRY", minYears: 0, maxYears: 1, description: "Less than 1 year of experience", color: "#34a853", icon: "TrendingUp" },
  { name: "Junior", code: "JR", minYears: 1, maxYears: 3, description: "1-3 years of experience", color: "#4285f4", icon: "TrendingUp" },
  { name: "Mid Level", code: "MID", minYears: 3, maxYears: 5, description: "3-5 years of experience", color: "#f59e0b", icon: "TrendingUp" },
  { name: "Senior", code: "SR", minYears: 5, maxYears: 8, description: "5-8 years of experience", color: "#e8710a", icon: "Award" },
  { name: "Lead", code: "LEAD", minYears: 8, maxYears: 12, description: "8-12 years of experience", color: "#a855f7", icon: "Award" },
  { name: "Principal", code: "PRIN", minYears: 12, maxYears: 15, description: "12-15 years of experience", color: "#4f46e5", icon: "Award" },
  { name: "Executive", code: "EXEC", minYears: 15, maxYears: 0, description: "15+ years of experience", color: "#d4a017", icon: "Star" },
];`,
  'hrDocumentTypes': `const SEED_DATA = [
  { name: "Passport", code: "PASSPORT", documentCategory: "Identity", isMandatory: true, description: "Valid passport copy", color: "#4285f4", icon: "FileText" },
  { name: "National ID", code: "NAT_ID", documentCategory: "Identity", isMandatory: true, description: "National identity card", color: "#34a853", icon: "FileText" },
  { name: "Degree Certificate", code: "DEGREE", documentCategory: "Education", isMandatory: true, description: "Highest degree certificate", color: "#a855f7", icon: "GraduationCap" },
  { name: "Resume/CV", code: "RESUME", documentCategory: "Employment", isMandatory: true, description: "Updated resume or CV", color: "#f59e0b", icon: "FileText" },
  { name: "Bank Details", code: "BANK", documentCategory: "Bank", isMandatory: true, description: "Bank account details for payroll", color: "#0d9488", icon: "CreditCard" },
  { name: "Medical Certificate", code: "MEDICAL", documentCategory: "Medical", isMandatory: false, description: "Medical fitness certificate", color: "#06b6d4", icon: "Heart" },
  { name: "Experience Letter", code: "EXP_LTR", documentCategory: "Employment", isMandatory: false, description: "Previous employment experience letter", color: "#4f46e5", icon: "FileText" },
];`,
  'financePaymentModes': `const SEED_DATA = [
  { name: "Cash", code: "CASH", modeCategory: "Cash", isDigital: false, description: "Physical cash payment", color: "#34a853", icon: "Wallet" },
  { name: "Credit Card", code: "CC", modeCategory: "Card", isDigital: true, description: "Credit card payment", color: "#4285f4", icon: "CreditCard" },
  { name: "Debit Card", code: "DC", modeCategory: "Card", isDigital: true, description: "Debit card payment", color: "#1a73e8", icon: "CreditCard" },
  { name: "Bank Transfer", code: "BT", modeCategory: "Bank Transfer", isDigital: true, description: "Direct bank transfer", color: "#a855f7", icon: "Building2" },
  { name: "UPI", code: "UPI", modeCategory: "Digital", isDigital: true, description: "UPI payment", color: "#0d9488", icon: "Smartphone" },
  { name: "Cheque", code: "CHEQUE", modeCategory: "Cheque", isDigital: false, description: "Cheque payment", color: "#f59e0b", icon: "FileText" },
  { name: "Online Wallet", code: "WALLET", modeCategory: "Digital", isDigital: true, description: "Online wallet payment", color: "#ea4335", icon: "Wallet" },
];`,
  'financeBankAccounts': `const SEED_DATA = [
  { name: "Main Account", code: "MAIN", bankName: "Emirates NBD", accountNumber: "AE123456789", branchName: "Dubai Main", ifscCode: "EBILAEAD", swiftCode: "EBILAEAD", accountType: "Current", isDefault: true, description: "Primary operating account", color: "#4285f4", icon: "Building2" },
  { name: "Payroll Account", code: "PAYROLL", bankName: "Dubai Islamic Bank", accountNumber: "AE987654321", branchName: "DIFC", ifscCode: "DIBLAEAD", swiftCode: "DIBLAEAD", accountType: "Current", isDefault: false, description: "Employee salary account", color: "#34a853", icon: "Building2" },
  { name: "Savings Account", code: "SAVINGS", bankName: "ADCB", accountNumber: "AE555555555", branchName: "Abu Dhabi Main", ifscCode: "ADCBAEAA", swiftCode: "ADCBAEAA", accountType: "Savings", isDefault: false, description: "Corporate savings account", color: "#f59e0b", icon: "Building2" },
];`,
  'financeTaxTypes': `const SEED_DATA = [
  { name: "Income Tax", code: "IT", taxCategory: "Direct", taxRate: 0, isCompound: false, description: "Corporate income tax", color: "#ea4335", icon: "Percent" },
  { name: "VAT", code: "VAT", taxCategory: "Indirect", taxRate: 5, isCompound: false, description: "Value Added Tax at 5%", color: "#4285f4", icon: "Percent" },
  { name: "GST", code: "GST", taxCategory: "Indirect", taxRate: 18, isCompound: false, description: "Goods and Services Tax", color: "#34a853", icon: "Percent" },
  { name: "Withholding Tax", code: "WHT", taxCategory: "Withholding", taxRate: 10, isCompound: false, description: "Withholding tax on payments", color: "#a855f7", icon: "Percent" },
];`,
  'financeGstRates': `const SEED_DATA = [
  { name: "Nil Rated", code: "GST_NIL", gstType: "Nil Rated", cgstRate: 0, sgstRate: 0, igstRate: 0, totalRate: 0, description: "Goods with 0% GST", color: "#9aa0a6", icon: "Percent" },
  { name: "5% Slab", code: "GST_5", gstType: "Intra-State", cgstRate: 2.5, sgstRate: 2.5, igstRate: 5, totalRate: 5, description: "5% GST rate slab", color: "#4285f4", icon: "Percent" },
  { name: "12% Slab", code: "GST_12", gstType: "Intra-State", cgstRate: 6, sgstRate: 6, igstRate: 12, totalRate: 12, description: "12% GST rate slab", color: "#a855f7", icon: "Percent" },
  { name: "18% Slab", code: "GST_18", gstType: "Intra-State", cgstRate: 9, sgstRate: 9, igstRate: 18, totalRate: 18, description: "18% GST rate slab", color: "#f59e0b", icon: "Percent" },
  { name: "28% Slab", code: "GST_28", gstType: "Intra-State", cgstRate: 14, sgstRate: 14, igstRate: 28, totalRate: 28, description: "28% GST rate slab", color: "#ea4335", icon: "Percent" },
];`,
  'financeExpenseCategories': `const SEED_DATA = [
  { name: "Rent", code: "RENT", expenseType: "Operational", budgetable: true, description: "Office and facility rent", color: "#4285f4", icon: "Home" },
  { name: "Utilities", code: "UTIL", expenseType: "Operational", budgetable: true, description: "Electricity, water, internet bills", color: "#34a853", icon: "Wifi" },
  { name: "Salary", code: "SALARY", expenseType: "Operational", budgetable: true, description: "Employee salaries and wages", color: "#a855f7", icon: "Users" },
  { name: "Travel", code: "TRAVEL", expenseType: "Travel", budgetable: true, description: "Business travel and accommodation", color: "#f59e0b", icon: "MapPin" },
  { name: "Marketing", code: "MKTG", expenseType: "Marketing", budgetable: true, description: "Marketing and advertising expenses", color: "#ea4335", icon: "Megaphone" },
  { name: "Equipment", code: "EQUIP", expenseType: "Capital", budgetable: true, description: "Capital equipment purchases", color: "#4f46e5", icon: "Monitor" },
  { name: "Maintenance", code: "MAINT", expenseType: "Maintenance", budgetable: true, description: "Repairs and maintenance", color: "#06b6d4", icon: "Wrench" },
];`,
  'financeIncomeCategories': `const SEED_DATA = [
  { name: "Tuition Fee", code: "TUITION", incomeType: "Tuition Fee", isTaxable: true, description: "Student tuition fee income", color: "#4285f4", icon: "GraduationCap" },
  { name: "Admission Fee", code: "ADM_FEE", incomeType: "Admission Fee", isTaxable: true, description: "One-time admission fee income", color: "#34a853", icon: "FileText" },
  { name: "Hostel Fee", code: "HOSTEL", incomeType: "Hostel Fee", isTaxable: true, description: "Student hostel accommodation fee", color: "#a855f7", icon: "Home" },
  { name: "Transport Fee", code: "TRANSPORT", incomeType: "Transport Fee", isTaxable: true, description: "Student transport fee income", color: "#f59e0b", icon: "Bus" },
  { name: "Grant", code: "GRANT", incomeType: "Grant", isTaxable: false, description: "Government and research grants", color: "#06b6d4", icon: "Award" },
  { name: "Donation", code: "DONATION", incomeType: "Donation", isTaxable: false, description: "Charitable donations and endowments", color: "#ea4335", icon: "Heart" },
  { name: "Miscellaneous", code: "MISC", incomeType: "Miscellaneous", isTaxable: true, description: "Other income sources", color: "#9aa0a6", icon: "Coins" },
];`,
  'financeFeeCategories': `const SEED_DATA = [
  { name: "Tuition Fee", code: "TUITION", feeType: "Tuition", isRecurring: true, isOptional: false, isRefundable: false, description: "Standard tuition fee per term", color: "#4285f4", icon: "GraduationCap" },
  { name: "Admission Fee", code: "ADMISSION", feeType: "Admission", isRecurring: false, isOptional: false, isRefundable: false, description: "One-time admission processing fee", color: "#34a853", icon: "FileText" },
  { name: "Hostel Fee", code: "HOSTEL", feeType: "Hostel", isRecurring: true, isOptional: true, isRefundable: false, description: "Hostel accommodation fee", color: "#a855f7", icon: "Home" },
  { name: "Transport Fee", code: "TRANSPORT", feeType: "Transport", isRecurring: true, isOptional: true, isRefundable: false, description: "Transport service fee", color: "#f59e0b", icon: "Bus" },
  { name: "Library Fee", code: "LIBRARY", feeType: "Library", isRecurring: true, isOptional: false, isRefundable: false, description: "Library and learning resource fee", color: "#0d9488", icon: "BookOpen" },
  { name: "Sports Fee", code: "SPORTS", feeType: "Sports", isRecurring: true, isOptional: true, isRefundable: false, description: "Sports and recreation fee", color: "#06b6d4", icon: "Award" },
  { name: "Development Fee", code: "DEV", feeType: "Development", isRecurring: false, isOptional: false, isRefundable: false, description: "Infrastructure development fee", color: "#4f46e5", icon: "Building" },
];`,
  'financeDiscountCategories': `const SEED_DATA = [
  { name: "Merit Scholarship", code: "MERIT", discountType: "Merit Discount", isPercentage: true, maxValue: 50, description: "Academic merit-based scholarship", color: "#4285f4", icon: "Award" },
  { name: "Need-based Waiver", code: "NEED", discountType: "Need-based Waiver", isPercentage: true, maxValue: 100, description: "Financial need-based fee waiver", color: "#34a853", icon: "Heart" },
  { name: "Sibling Discount", code: "SIBLING", discountType: "Sibling Discount", isPercentage: true, maxValue: 25, description: "Discount for siblings enrolled", color: "#a855f7", icon: "Users" },
  { name: "Early Bird", code: "EARLY", discountType: "Early Bird", isPercentage: true, maxValue: 15, description: "Early enrollment discount", color: "#f59e0b", icon: "Clock" },
  { name: "Corporate Discount", code: "CORP", discountType: "Corporate Discount", isPercentage: true, maxValue: 20, description: "Corporate partner employee discount", color: "#0d9488", icon: "Building2" },
  { name: "Staff Discount", code: "STAFF", discountType: "Staff Discount", isPercentage: true, maxValue: 30, description: "Employee family discount", color: "#06b6d4", icon: "UserCheck" },
];`,
  'financeCurrencies': `const SEED_DATA = [
  { name: "UAE Dirham", code: "AED", symbol: "د.إ", isoCode: "AED", isBase: true, exchangeRate: 1, decimalPlaces: 2, description: "United Arab Emirates Dirham", color: "#34a853", icon: "DollarSign" },
  { name: "US Dollar", code: "USD", symbol: "$", isoCode: "USD", isBase: false, exchangeRate: 3.67, decimalPlaces: 2, description: "United States Dollar", color: "#4285f4", icon: "DollarSign" },
  { name: "Euro", code: "EUR", symbol: "€", isoCode: "EUR", isBase: false, exchangeRate: 4.02, decimalPlaces: 2, description: "Euro currency", color: "#a855f7", icon: "DollarSign" },
  { name: "British Pound", code: "GBP", symbol: "£", isoCode: "GBP", isBase: false, exchangeRate: 4.65, decimalPlaces: 2, description: "British Pound Sterling", color: "#ea4335", icon: "DollarSign" },
  { name: "Indian Rupee", code: "INR", symbol: "₹", isoCode: "INR", isBase: false, exchangeRate: 0.044, decimalPlaces: 2, description: "Indian Rupee", color: "#f59e0b", icon: "DollarSign" },
];`,
  'financeFinancialYears': `const SEED_DATA = [
  { name: "FY 2023-24", code: "FY2324", startDate: 1680307200000, endDate: 1711843199000, isCurrent: false, isClosed: true, description: "Financial year April 2023 - March 2024", color: "#9aa0a6", icon: "Calendar" },
  { name: "FY 2024-25", code: "FY2425", startDate: 1711843200000, endDate: 1743379199000, isCurrent: false, isClosed: true, description: "Financial year April 2024 - March 2025", color: "#4285f4", icon: "Calendar" },
  { name: "FY 2025-26", code: "FY2526", startDate: 1743379200000, endDate: 1774915199000, isCurrent: true, isClosed: false, description: "Current financial year", color: "#34a853", icon: "Calendar" },
  { name: "FY 2026-27", code: "FY2627", startDate: 1774915200000, endDate: 1806451199000, isCurrent: false, isClosed: false, description: "Next financial year", color: "#a855f7", icon: "Calendar" },
];`,
  'academicClassrooms': `const SEED_DATA = [
  { name: "Room 101", code: "R101", building: "Main Building", floor: 1, roomNumber: "101", capacity: 40, hasMultimedia: true, hasAirConditioning: true, description: "Standard classroom on ground floor", color: "#4285f4", icon: "Home" },
  { name: "Room 102", code: "R102", building: "Main Building", floor: 1, roomNumber: "102", capacity: 40, hasMultimedia: true, hasAirConditioning: true, description: "Standard classroom", color: "#34a853", icon: "Home" },
  { name: "Lecture Hall A", code: "LH_A", building: "Academic Block", floor: 2, roomNumber: "201", capacity: 120, hasMultimedia: true, hasAirConditioning: true, description: "Large lecture hall with AV equipment", color: "#a855f7", icon: "Monitor" },
  { name: "Lecture Hall B", code: "LH_B", building: "Academic Block", floor: 2, roomNumber: "202", capacity: 100, hasMultimedia: true, hasAirConditioning: true, description: "Medium lecture hall", color: "#f59e0b", icon: "Monitor" },
  { name: "Computer Lab 1", code: "CL1", building: "IT Block", floor: 1, roomNumber: "C01", capacity: 30, hasMultimedia: true, hasAirConditioning: true, description: "Computer laboratory with 30 workstations", color: "#ea4335", icon: "Monitor" },
  { name: "Science Lab", code: "SLAB", building: "Science Block", floor: 1, roomNumber: "S01", capacity: 25, hasMultimedia: false, hasAirConditioning: true, description: "Science laboratory", color: "#0d9488", icon: "Flask" },
  { name: "Seminar Room", code: "SEM", building: "Admin Block", floor: 3, roomNumber: "301", capacity: 20, hasMultimedia: true, hasAirConditioning: true, description: "Small seminar and meeting room", color: "#06b6d4", icon: "Home" },
];`,
  'crmIndustries': `const SEED_DATA = [
  { name: "Education", code: "EDU", sector: "Education", description: "Educational institutions and training", color: "#4285f4", icon: "GraduationCap" },
  { name: "Healthcare", code: "HEALTH", sector: "Healthcare", description: "Healthcare and medical services", color: "#34a853", icon: "Heart" },
  { name: "Technology", code: "TECH", sector: "Technology", description: "IT and technology companies", color: "#a855f7", icon: "Monitor" },
  { name: "Finance", code: "FIN", sector: "Finance", description: "Financial services and banking", color: "#f59e0b", icon: "Building2" },
  { name: "Manufacturing", code: "MFG", sector: "Manufacturing", description: "Industrial manufacturing", color: "#ea4335", icon: "Building" },
  { name: "Retail", code: "RETAIL", sector: "Retail", description: "Retail and e-commerce", color: "#0d9488", icon: "Globe" },
  { name: "Real Estate", code: "RE", sector: "Real Estate", description: "Real estate and property", color: "#06b6d4", icon: "Home" },
  { name: "Hospitality", code: "HOSP", sector: "Hospitality", description: "Hotels, restaurants, and tourism", color: "#4f46e5", icon: "Star" },
  { name: "Government", code: "GOV", sector: "Government", description: "Government agencies and public sector", color: "#5f6368", icon: "Shield" },
  { name: "Non-Profit", code: "NGO", sector: "Non-Profit", description: "Non-profit and charitable organizations", color: "#22c55e", icon: "HeartHandshake" },
];`,
  'salesPaymentStatuses': `const SEED_DATA = [
  { name: "Pending", code: "PENDING", statusCategory: "Pending", description: "Payment is pending", color: "#f59e0b", icon: "Clock" },
  { name: "Partially Paid", code: "PARTIAL", statusCategory: "Pending", description: "Partial payment received", color: "#4285f4", icon: "Clock" },
  { name: "Completed", code: "COMPLETED", statusCategory: "Completed", description: "Payment completed successfully", color: "#34a853", icon: "CheckCircle" },
  { name: "Failed", code: "FAILED", statusCategory: "Failed", description: "Payment processing failed", color: "#ea4335", icon: "XCircle" },
  { name: "Refunded", code: "REFUNDED", statusCategory: "Refunded", description: "Payment has been refunded", color: "#a855f7", icon: "RefreshCw" },
  { name: "Cancelled", code: "CANCELLED", statusCategory: "Cancelled", description: "Payment was cancelled", color: "#5f6368", icon: "Ban" },
];`,
  'salesInvoiceTypes': `const SEED_DATA = [
  { name: "Standard Invoice", code: "STD", invoiceCategory: "Standard", description: "Standard sales invoice", color: "#4285f4", icon: "FileText" },
  { name: "Proforma Invoice", code: "PRO", invoiceCategory: "Proforma", description: "Proforma invoice for quotation", color: "#a855f7", icon: "FileText" },
  { name: "Credit Note", code: "CN", invoiceCategory: "Credit Note", description: "Credit note for returns/adjustments", color: "#34a853", icon: "FileText" },
  { name: "Debit Note", code: "DN", invoiceCategory: "Debit Note", description: "Debit note for additional charges", color: "#ea4335", icon: "FileText" },
  { name: "Recurring Invoice", code: "RECUR", invoiceCategory: "Recurring", description: "Recurring subscription invoice", color: "#f59e0b", icon: "RefreshCw" },
  { name: "Final Invoice", code: "FINAL", invoiceCategory: "Final", description: "Final settlement invoice", color: "#06b6d4", icon: "CheckCircle" },
];`,
  'salesTaxSlabs': `const SEED_DATA = [
  { name: "Nil", code: "SLAB_NIL", slabType: "GST", fromAmount: 0, toAmount: 0, taxRate: 0, description: "Nil tax rate", color: "#9aa0a6", icon: "Percent" },
  { name: "5% GST", code: "SLAB_5", slabType: "GST", fromAmount: 0, toAmount: 999999, taxRate: 5, description: "5% GST on essential goods", color: "#4285f4", icon: "Percent" },
  { name: "12% GST", code: "SLAB_12", slabType: "GST", fromAmount: 0, toAmount: 999999, taxRate: 12, description: "12% GST on standard goods", color: "#a855f7", icon: "Percent" },
  { name: "18% GST", code: "SLAB_18", slabType: "GST", fromAmount: 0, toAmount: 999999, taxRate: 18, description: "18% GST on most services", color: "#f59e0b", icon: "Percent" },
  { name: "28% GST", code: "SLAB_28", slabType: "GST", fromAmount: 0, toAmount: 999999, taxRate: 28, description: "28% GST on luxury goods", color: "#ea4335", icon: "Percent" },
];`,
  'commNotificationTypes': `const SEED_DATA = [
  { name: "Task Assignment", code: "TASK_ASSIGN", channelType: "In-App", description: "When a task is assigned to a user", color: "#4285f4", icon: "ClipboardList" },
  { name: "Approval Request", code: "APPROVAL", channelType: "In-App", description: "When approval is requested", color: "#a855f7", icon: "CheckCircle" },
  { name: "Payment Reminder", code: "PAY_REMIND", channelType: "SMS", description: "Payment due date reminders", color: "#f59e0b", icon: "Bell" },
  { name: "Welcome Email", code: "WELCOME", channelType: "Email", description: "New user welcome notifications", color: "#34a853", icon: "Mail" },
  { name: "WhatsApp Alert", code: "WA_ALERT", channelType: "WhatsApp", description: "Urgent WhatsApp notifications", color: "#25D366", icon: "MessageCircle" },
  { name: "System Alert", code: "SYS_ALERT", channelType: "All", description: "Critical system alerts via all channels", color: "#ea4335", icon: "AlertTriangle" },
  { name: "Follow-up Reminder", code: "FOLLOWUP", channelType: "In-App", description: "Reminders for pending follow-ups", color: "#0d9488", icon: "Bell" },
  { name: "Announcement", code: "ANNOUNCE", channelType: "Email", description: "General announcements and updates", color: "#06b6d4", icon: "Megaphone" },
];`,
  'commEmailTemplates': `const SEED_DATA = [
  { name: "Welcome Email", code: "WELCOME", templateCategory: "Onboarding", subject: "Welcome to {{organization_name}}!", bodyPreview: "Dear {{name}}, welcome aboard...", description: "Welcome email for new users", color: "#4285f4", icon: "Mail" },
  { name: "Payment Receipt", code: "RECEIPT", templateCategory: "Transactional", subject: "Payment Receipt - {{invoice_number}}", bodyPreview: "Thank you for your payment of {{amount}}...", description: "Payment confirmation receipt", color: "#34a853", icon: "Mail" },
  { name: "Fee Reminder", code: "FEE_REM", templateCategory: "Reminder", subject: "Fee Payment Reminder - {{due_date}}", bodyPreview: "This is a reminder that your fee payment...", description: "Fee due date reminder", color: "#f59e0b", icon: "Mail" },
  { name: "Admission Offer", code: "ADM_OFFER", templateCategory: "Notification", subject: "Admission Offer - {{program_name}}", bodyPreview: "Congratulations! We are pleased to offer you admission...", description: "Admission offer letter", color: "#a855f7", icon: "Mail" },
  { name: "Newsletter", code: "NEWS", templateCategory: "Newsletter", subject: "{{org}} Newsletter - {{month}}", bodyPreview: "Here's what's happening...", description: "Monthly newsletter", color: "#0d9488", icon: "Mail" },
  { name: "Follow Up", code: "FOLLOWUP", templateCategory: "Follow-up", subject: "Following up on your enquiry", bodyPreview: "We noticed you recently enquired...", description: "Lead follow-up email", color: "#06b6d4", icon: "Mail" },
];`,
  'commSmsTemplates': `const SEED_DATA = [
  { name: "OTP Verification", code: "OTP", templateCategory: "OTP", bodyPreview: "Your OTP for login is {{otp}}. Valid for 5 minutes.", description: "One-time password for authentication", color: "#4285f4", icon: "MessageSquare" },
  { name: "Payment Reminder", code: "PAY_REM", templateCategory: "Reminder", bodyPreview: "Dear {{name}}, your fee payment of {{amount}} is due on {{date}}.", description: "Payment due date SMS reminder", color: "#f59e0b", icon: "MessageSquare" },
  { name: "Admission Alert", code: "ADM_ALERT", templateCategory: "Alert", bodyPreview: "Admission update: Your application {{id}} status has been updated.", description: "Admission status alert", color: "#34a853", icon: "MessageSquare" },
  { name: "Welcome SMS", code: "WELCOME", templateCategory: "Transactional", bodyPreview: "Welcome to {{org}}! Your account has been created.", description: "Welcome SMS for new registrations", color: "#a855f7", icon: "MessageSquare" },
  { name: "Follow Up", code: "FOLLOWUP", templateCategory: "Follow-up", bodyPreview: "Hi {{name}}, this is {{org}}. We'd love to connect with you.", description: "Lead follow-up SMS", color: "#0d9488", icon: "MessageSquare" },
];`,
  'commWhatsAppTemplates': `const SEED_DATA = [
  { name: "Greeting", code: "GREETING", templateCategory: "Greeting", bodyPreview: "Hello {{name}}! Welcome to {{org}}. How can we help?", description: "Initial WhatsApp greeting", color: "#25D366", icon: "MessageCircle" },
  { name: "Follow Up", code: "FOLLOWUP", templateCategory: "Follow-up", bodyPreview: "Hi {{name}}, just checking in on your enquiry.", description: "Follow-up message for leads", color: "#4285f4", icon: "MessageCircle" },
  { name: "Payment Reminder", code: "PAY_REM", templateCategory: "Reminder", bodyPreview: "Reminder: Payment of {{amount}} is due on {{date}}.", description: "WhatsApp payment reminder", color: "#f59e0b", icon: "MessageCircle" },
  { name: "Offer Alert", code: "OFFER", templateCategory: "Promotional", bodyPreview: "Special offer! Get {{discount}} off on {{program}}.", description: "Promotional offer broadcast", color: "#ea4335", icon: "MessageCircle" },
  { name: "Admission Update", code: "ADM_UPD", templateCategory: "Alert", bodyPreview: "Your application {{id}} status has changed to {{status}}.", description: "Admission status update", color: "#34a853", icon: "MessageCircle" },
];`,
};

// Pattern to match: const SEED_DATA: Array<{ ... }> = [];
const pattern1 = /const SEED_DATA: Array<\{[\s\S]*?\}>\s*=\s*\[\];/;
// Pattern to match: empty const SEED_DATA = [];
const pattern2 = /const SEED_DATA\s*=\s*\[\];/;

let count = 0;
for (const [file, replacement] of Object.entries(seeds)) {
  const fp = path.join(ROOT, 'src/convex', `${file}.ts`);
  if (!fs.existsSync(fp)) { console.log(`  - ${file} not found`); continue; }
  
  let content = fs.readFileSync(fp, 'utf8');
  
  if (pattern1.test(content)) {
    content = content.replace(pattern1, replacement);
  } else if (pattern2.test(content)) {
    content = content.replace(pattern2, replacement);
  } else {
    console.log(`  ? ${file}: pattern not matched`);
    continue;
  }
  
  fs.writeFileSync(fp, content);
  count++;
}

console.log(`\nUpdated ${count}/${Object.keys(seeds).length} files with seed data`);
