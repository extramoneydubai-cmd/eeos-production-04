#!/usr/bin/env node
/**
 * EEOS Master Data Sprint 02 — Complete Batch Generator
 * Generates ALL Convex backend files + ALL frontend pages
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = '/home/daytona/codebase';

// ─── Master Configuration ───
const ICONS = `BadgeCheck, Briefcase, Building, Building2, CalendarCheck, Clock, Code, Coins, CreditCard, DollarSign, Download, FileText, Flag, Globe, GraduationCap, Handshake, Heart, Home, Landmark, Mail, MapPin, Megaphone, MessageCircle, MessageSquare, Monitor, Palette, Percent, Phone, RefreshCw, School, Shield, Star, Target, TrendingUp, UserCheck, Users, Wallet, Wifi, Award, BookOpen, BookMarked, FileSpreadsheet, Layers, Hash, Calendar, UserCog, Linkedin, Facebook, Youtube, Radio, Newspaper, Trees, Tv, Smartphone, Search, MonitorPlay, WifiOff, PhoneOff, Ban, Thermometer, Headphones, HelpCircle, UserPlus, ClipboardList, Zap, CheckCircle, HeartHandshake, XCircle, Tags, Link`.split(', ').map(s => s.trim());

const COLOR_PRESETS = `"#1a73e8","#34a853","#0d9488","#e8710a","#4285f4","#4f46e5","#a855f7","#06b6d4","#5f6368","#22c55e","#f59e0b","#d4a017","#ea4335","#e91e63","#f97316","#f43f5e","#14b8a6","#8b5cf6","#9aa0a6","#1877F2"`;

// Each master: { fileName, tableName, pageName, title, subtitle, entityName, entityNamePlural, route, backRoute, backLabel, extraCodeField, extraCols, formExtraDefaults, formExtraFromItem, validateMsg, statsExtra, categoryVar, categoryOptions, categoryField, icons }
const MASTER_CONFIGS = [
  {
    // 1. HR Employee Categories
    fileName: 'hrEmployeeCategories', tableName: 'hrEmployeeCategories', pageName: 'MasterDataEmployeeCategories',
    title: 'Employee Categories', subtitle: 'Define employee categories — classify employment nature and functional roles.',
    entityName: 'EmployeeCategory', entityNamePlural: 'Employee Categories',
    route: '/studios/master-data/hr/employee-categories', backRoute: '/studios/master-data/hr', backLabel: 'Back to HR Masters',
    extraCodeField: true, extraCols: ['Code', 'Category'],
    formExtraDefaults: { code: '', categoryType: 'Academic', description: '' },
    formExtraFromItem: { code: 'code', categoryType: 'categoryType', description: 'description' },
    validateMsg: 'Category code is required.',
    statsExtra: () => ('const types = new Set(items.map((s: any) => s.categoryType));\n    const academic = items.filter((s: any) => s.categoryType === "Academic");'),
    categoryVar: 'CATEGORY_OPTIONS',
    categoryOptions: ['Academic','Non-Academic','Leadership','Temporary','Trainee','Advisor'],
    categoryField: 'categoryType',
    icon: 'UserCheck',
  },
  {
    fileName: 'hrWorkLocations', tableName: 'hrWorkLocations', pageName: 'MasterDataWorkLocations',
    title: 'Work Locations', subtitle: 'Define work locations — offices, campuses, remote sites, and regional hubs.',
    entityName: 'WorkLocation', entityNamePlural: 'Work Locations',
    route: '/studios/master-data/hr/work-locations', backRoute: '/studios/master-data/hr', backLabel: 'Back to HR Masters',
    extraCodeField: true, extraCols: ['Code', 'Type', 'Location'],
    formExtraDefaults: { code: '', locationType: 'Office', city: '', country: '', description: '' },
    formExtraFromItem: { code: 'code', locationType: 'locationType', city: 'city', country: 'country', description: 'description' },
    validateMsg: 'Location code is required.',
    statsExtra: () => ('const types = new Set(items.map((s: any) => s.locationType));'),
    categoryVar: 'LOCATION_TYPES',
    categoryOptions: ['Office','Campus','Remote','Client Site','Regional Hub','Other'],
    categoryField: 'locationType',
    icon: 'MapPin',
  },
  {
    fileName: 'hrSkills', tableName: 'hrSkills', pageName: 'MasterDataSkills',
    title: 'Skills', subtitle: 'Define skills taxonomy — classify employee competencies and expertise areas.',
    entityName: 'Skill', entityNamePlural: 'Skills',
    route: '/studios/master-data/hr/skills', backRoute: '/studios/master-data/hr', backLabel: 'Back to HR Masters',
    extraCodeField: true, extraCols: ['Code', 'Category'],
    formExtraDefaults: { code: '', skillCategory: 'Technical', description: '' },
    formExtraFromItem: { code: 'code', skillCategory: 'skillCategory', description: 'description' },
    validateMsg: 'Skill code is required.',
    statsExtra: () => ('const types = new Set(items.map((s: any) => s.skillCategory));'),
    categoryVar: 'SKILL_CATEGORIES',
    categoryOptions: ['Technical','Soft Skill','Management','Language','Domain','Creative','Other'],
    categoryField: 'skillCategory',
    icon: 'Award',
  },
  {
    fileName: 'hrExperienceLevels', tableName: 'hrExperienceLevels', pageName: 'MasterDataExperienceLevels',
    title: 'Experience Levels', subtitle: 'Define experience level bands — classify employees by years of experience.',
    entityName: 'ExperienceLevel', entityNamePlural: 'Experience Levels',
    route: '/studios/master-data/hr/experience-levels', backRoute: '/studios/master-data/hr', backLabel: 'Back to HR Masters',
    extraCodeField: true, extraCols: ['Code', 'Experience Range'],
    formExtraDefaults: { code: '', minYears: 0, maxYears: 0, description: '' },
    formExtraFromItem: { code: 'code', minYears: 'minYears', maxYears: 'maxYears', description: 'description' },
    validateMsg: 'Experience level code is required.',
    statsExtra: () => ('const entry = items.filter((s: any) => s.minYears <= 2);\n    const mid = items.filter((s: any) => s.minYears > 2 && s.minYears <= 5);\n    const senior = items.filter((s: any) => s.minYears > 5);'),
    categoryVar: null,
    categoryOptions: null,
    categoryField: null,
    icon: 'TrendingUp',
  },
  {
    fileName: 'hrDocumentTypes', tableName: 'hrDocumentTypes', pageName: 'MasterDataDocumentTypes',
    title: 'Document Types', subtitle: 'Define document types — classify documents required for employee records and compliance.',
    entityName: 'DocumentType', entityNamePlural: 'Document Types',
    route: '/studios/master-data/hr/document-types', backRoute: '/studios/master-data/hr', backLabel: 'Back to HR Masters',
    extraCodeField: true, extraCols: ['Code', 'Category', 'Mandatory'],
    formExtraDefaults: { code: '', documentCategory: 'Identity', isMandatory: true, description: '' },
    formExtraFromItem: { code: 'code', documentCategory: 'documentCategory', isMandatory: 'isMandatory', description: 'description' },
    validateMsg: 'Document type code is required.',
    statsExtra: () => ('const mandatory = items.filter((s: any) => s.isMandatory);\n    const categories = new Set(items.map((s: any) => s.documentCategory));'),
    categoryVar: 'DOC_CATEGORIES',
    categoryOptions: ['Identity','Education','Employment','Bank','Tax','Medical','Certification','Other'],
    categoryField: 'documentCategory',
    icon: 'FileText',
  },
  // ── Finance Masters ──
  {
    fileName: 'financePaymentModes', tableName: 'financePaymentModes', pageName: 'MasterDataPaymentModes',
    title: 'Payment Modes', subtitle: 'Define payment modes — configure accepted payment methods across the organization.',
    entityName: 'PaymentMode', entityNamePlural: 'Payment Modes',
    route: '/studios/master-data/finance/payment-modes', backRoute: '/studios/master-data/finance', backLabel: 'Back to Finance Masters',
    extraCodeField: true, extraCols: ['Code', 'Category', 'Digital'],
    formExtraDefaults: { code: '', modeCategory: 'Digital', isDigital: true, description: '' },
    formExtraFromItem: { code: 'code', modeCategory: 'modeCategory', isDigital: 'isDigital', description: 'description' },
    validateMsg: 'Payment mode code is required.',
    statsExtra: () => ('const digital = items.filter((s: any) => s.isDigital);\n    const offline = items.filter((s: any) => !s.isDigital);'),
    categoryVar: 'MODE_CATEGORIES',
    categoryOptions: ['Digital','Bank Transfer','Cash','Card','Cheque','Other'],
    categoryField: 'modeCategory',
    icon: 'Wallet',
  },
  {
    fileName: 'financeBankAccounts', tableName: 'financeBankAccounts', pageName: 'MasterDataBankAccounts',
    title: 'Bank Accounts', subtitle: 'Manage organization bank accounts for financial transactions and reconciliations.',
    entityName: 'BankAccount', entityNamePlural: 'Bank Accounts',
    route: '/studios/master-data/finance/bank-accounts', backRoute: '/studios/master-data/finance', backLabel: 'Back to Finance Masters',
    extraCodeField: true, extraCols: ['Code', 'Bank', 'Account', 'Default'],
    formExtraDefaults: { code: '', bankName: '', accountNumber: '', branchName: '', ifscCode: '', swiftCode: '', accountType: 'Savings', isDefault: false, description: '' },
    formExtraFromItem: { code: 'code', bankName: 'bankName', accountNumber: 'accountNumber', branchName: 'branchName', ifscCode: 'ifscCode', swiftCode: 'swiftCode', accountType: 'accountType', isDefault: 'isDefault', description: 'description' },
    validateMsg: 'Bank account code is required.',
    statsExtra: () => ('const savings = items.filter((s: any) => s.accountType === "Savings");\n    const current = items.filter((s: any) => s.accountType === "Current");\n    const defaults = items.filter((s: any) => s.isDefault);'),
    categoryVar: 'ACCOUNT_TYPES',
    categoryOptions: ['Savings','Current','Fixed Deposit','Loan','Escrow','Other'],
    categoryField: 'accountType',
    icon: 'Building2',
  },
  {
    fileName: 'financeTaxTypes', tableName: 'financeTaxTypes', pageName: 'MasterDataTaxTypes',
    title: 'Tax Types', subtitle: 'Define tax types — configure applicable taxes for financial transactions.',
    entityName: 'TaxType', entityNamePlural: 'Tax Types',
    route: '/studios/master-data/finance/tax-types', backRoute: '/studios/master-data/finance', backLabel: 'Back to Finance Masters',
    extraCodeField: true, extraCols: ['Code', 'Category', 'Rate'],
    formExtraDefaults: { code: '', taxCategory: 'Direct', taxRate: 0, isCompound: false, description: '' },
    formExtraFromItem: { code: 'code', taxCategory: 'taxCategory', taxRate: 'taxRate', isCompound: 'isCompound', description: 'description' },
    validateMsg: 'Tax type code is required.',
    statsExtra: () => ('const direct = items.filter((s: any) => s.taxCategory === "Direct");\n    const indirect = items.filter((s: any) => s.taxCategory === "Indirect");'),
    categoryVar: 'TAX_CATEGORIES',
    categoryOptions: ['Direct','Indirect','Withholding','Other'],
    categoryField: 'taxCategory',
    icon: 'Percent',
  },
  {
    fileName: 'financeGstRates', tableName: 'financeGstRates', pageName: 'MasterDataGstRates',
    title: 'GST Rates', subtitle: 'Configure GST rate slabs — manage CGST, SGST, and IGST rate combinations.',
    entityName: 'GstRate', entityNamePlural: 'GST Rates',
    route: '/studios/master-data/finance/gst-rates', backRoute: '/studios/master-data/finance', backLabel: 'Back to Finance Masters',
    extraCodeField: true, extraCols: ['Code', 'Type', 'CGST', 'SGST', 'Total'],
    formExtraDefaults: { code: '', gstType: 'Intra-State', cgstRate: 0, sgstRate: 0, igstRate: 0, totalRate: 0, description: '' },
    formExtraFromItem: { code: 'code', gstType: 'gstType', cgstRate: 'cgstRate', sgstRate: 'sgstRate', igstRate: 'igstRate', totalRate: 'totalRate', description: 'description' },
    validateMsg: 'GST rate code is required.',
    statsExtra: () => ('const intra = items.filter((s: any) => s.gstType === "Intra-State");\n    const inter = items.filter((s: any) => s.gstType === "Inter-State");'),
    categoryVar: 'GST_TYPES',
    categoryOptions: ['Intra-State','Inter-State','SEZ','Deemed Export','Nil Rated','Exempt'],
    categoryField: 'gstType',
    icon: 'FileSpreadsheet',
  },
  {
    fileName: 'financeExpenseCategories', tableName: 'financeExpenseCategories', pageName: 'MasterDataExpenseCategories',
    title: 'Expense Categories', subtitle: 'Define expense categories — classify organizational expenditures for tracking and budgeting.',
    entityName: 'ExpenseCategory', entityNamePlural: 'Expense Categories',
    route: '/studios/master-data/finance/expense-categories', backRoute: '/studios/master-data/finance', backLabel: 'Back to Finance Masters',
    extraCodeField: true, extraCols: ['Code', 'Type', 'Budgetable'],
    formExtraDefaults: { code: '', expenseType: 'Operational', budgetable: true, description: '' },
    formExtraFromItem: { code: 'code', expenseType: 'expenseType', budgetable: 'budgetable', description: 'description' },
    validateMsg: 'Expense category code is required.',
    statsExtra: () => ('const operational = items.filter((s: any) => s.expenseType === "Operational");\n    const capital = items.filter((s: any) => s.expenseType === "Capital");\n    const budgetable = items.filter((s: any) => s.budgetable);'),
    categoryVar: 'EXPENSE_TYPES',
    categoryOptions: ['Operational','Capital','Administrative','Marketing','Travel','Utilities','Maintenance','Other'],
    categoryField: 'expenseType',
    icon: 'DollarSign',
  },
  {
    fileName: 'financeIncomeCategories', tableName: 'financeIncomeCategories', pageName: 'MasterDataIncomeCategories',
    title: 'Income Categories', subtitle: 'Define income categories — classify revenue streams and income sources.',
    entityName: 'IncomeCategory', entityNamePlural: 'Income Categories',
    route: '/studios/master-data/finance/income-categories', backRoute: '/studios/master-data/finance', backLabel: 'Back to Finance Masters',
    extraCodeField: true, extraCols: ['Code', 'Type', 'Taxable'],
    formExtraDefaults: { code: '', incomeType: 'Tuition Fee', isTaxable: true, description: '' },
    formExtraFromItem: { code: 'code', incomeType: 'incomeType', isTaxable: 'isTaxable', description: 'description' },
    validateMsg: 'Income category code is required.',
    statsExtra: () => ('const fee = items.filter((s: any) => s.incomeType.includes("Fee"));\n    const other = items.filter((s: any) => !s.incomeType.includes("Fee"));'),
    categoryVar: 'INCOME_TYPES',
    categoryOptions: ['Tuition Fee','Admission Fee','Hostel Fee','Transport Fee','Library Fee','Lab Fee','Other Fee','Grant','Donation','Miscellaneous'],
    categoryField: 'incomeType',
    icon: 'Coins',
  },
  {
    fileName: 'financeFeeCategories', tableName: 'financeFeeCategories', pageName: 'MasterDataFeeCategories',
    title: 'Fee Categories', subtitle: 'Define fee categories — configure fee structures, recurring charges, and optional fees.',
    entityName: 'FeeCategory', entityNamePlural: 'Fee Categories',
    route: '/studios/master-data/finance/fee-categories', backRoute: '/studios/master-data/finance', backLabel: 'Back to Finance Masters',
    extraCodeField: true, extraCols: ['Code', 'Type', 'Recurring', 'Refundable'],
    formExtraDefaults: { code: '', feeType: 'Tuition', isRecurring: false, isOptional: false, isRefundable: false, description: '' },
    formExtraFromItem: { code: 'code', feeType: 'feeType', isRecurring: 'isRecurring', isOptional: 'isOptional', isRefundable: 'isRefundable', description: 'description' },
    validateMsg: 'Fee category code is required.',
    statsExtra: () => ('const recurring = items.filter((s: any) => s.isRecurring);\n    const optional = items.filter((s: any) => s.isOptional);\n    const refundable = items.filter((s: any) => s.isRefundable);'),
    categoryVar: 'FEE_TYPES',
    categoryOptions: ['Tuition','Admission','Hostel','Transport','Library','Lab','Sports','Development','Examination','Other'],
    categoryField: 'feeType',
    icon: 'CreditCard',
  },
  {
    fileName: 'financeDiscountCategories', tableName: 'financeDiscountCategories', pageName: 'MasterDataDiscountCategories',
    title: 'Discount Categories', subtitle: 'Define discount categories — configure scholarship, waiver, and discount types.',
    entityName: 'DiscountCategory', entityNamePlural: 'Discount Categories',
    route: '/studios/master-data/finance/discount-categories', backRoute: '/studios/master-data/finance', backLabel: 'Back to Finance Masters',
    extraCodeField: true, extraCols: ['Code', 'Type', 'Pct?', 'Max Value'],
    formExtraDefaults: { code: '', discountType: 'Scholarship', isPercentage: true, maxValue: 0, description: '' },
    formExtraFromItem: { code: 'code', discountType: 'discountType', isPercentage: 'isPercentage', maxValue: 'maxValue', description: 'description' },
    validateMsg: 'Discount category code is required.',
    statsExtra: () => ('const pct = items.filter((s: any) => s.isPercentage);\n    const fixed = items.filter((s: any) => !s.isPercentage);'),
    categoryVar: 'DISCOUNT_TYPES',
    categoryOptions: ['Scholarship','Merit Discount','Need-based Waiver','Sibling Discount','Early Bird','Corporate Discount','Staff Discount','Other'],
    categoryField: 'discountType',
    icon: 'Percent',
  },
  {
    fileName: 'financeCurrencies', tableName: 'financeCurrencies', pageName: 'MasterDataCurrencies',
    title: 'Currencies', subtitle: 'Manage currency master — configure accepted currencies and exchange rates.',
    entityName: 'Currency', entityNamePlural: 'Currencies',
    route: '/studios/master-data/finance/currencies', backRoute: '/studios/master-data/finance', backLabel: 'Back to Finance Masters',
    extraCodeField: true, extraCols: ['Code', 'Symbol', 'ISO', 'Base'],
    formExtraDefaults: { code: '', symbol: '', isoCode: '', isBase: false, exchangeRate: 1, decimalPlaces: 2, description: '' },
    formExtraFromItem: { code: 'code', symbol: 'symbol', isoCode: 'isoCode', isBase: 'isBase', exchangeRate: 'exchangeRate', decimalPlaces: 'decimalPlaces', description: 'description' },
    validateMsg: 'Currency code is required.',
    statsExtra: () => ('const base = items.filter((s: any) => s.isBase);\n    const withRate = items.filter((s: any) => s.exchangeRate && s.exchangeRate !== 1);'),
    categoryVar: null,
    categoryOptions: null,
    categoryField: null,
    icon: 'DollarSign',
  },
  {
    fileName: 'financeFinancialYears', tableName: 'financeFinancialYears', pageName: 'MasterDataFinancialYears',
    title: 'Financial Years', subtitle: 'Define financial years — manage fiscal periods for accounting and reporting.',
    entityName: 'FinancialYear', entityNamePlural: 'Financial Years',
    route: '/studios/master-data/finance/financial-years', backRoute: '/studios/master-data/finance', backLabel: 'Back to Finance Masters',
    extraCodeField: true, extraCols: ['Code', 'Period', 'Current', 'Closed'],
    formExtraDefaults: { code: '', startDate: Date.now(), endDate: Date.now() + 31536000000, isCurrent: false, isClosed: false, description: '' },
    formExtraFromItem: { code: 'code', startDate: 'startDate', endDate: 'endDate', isCurrent: 'isCurrent', isClosed: 'isClosed', description: 'description' },
    validateMsg: 'Financial year code is required.',
    statsExtra: () => ('const current = items.filter((s: any) => s.isCurrent);\n    const closed = items.filter((s: any) => s.isClosed);\n    const open = items.filter((s: any) => !s.isClosed);'),
    categoryVar: null,
    categoryOptions: null,
    categoryField: null,
    icon: 'Calendar',
  },
  // ── Academic ──
  {
    fileName: 'academicClassrooms', tableName: 'academicClassrooms', pageName: 'MasterDataClassrooms',
    title: 'Classrooms', subtitle: 'Define classrooms — configure rooms, capacity, and facilities across campuses.',
    entityName: 'Classroom', entityNamePlural: 'Classrooms',
    route: '/studios/master-data/academic/classrooms', backRoute: '/studios/master-data/academic', backLabel: 'Back to Academic Masters',
    extraCodeField: true, extraCols: ['Code', 'Building', 'Room', 'Capacity'],
    formExtraDefaults: { code: '', building: '', floor: 1, roomNumber: '', capacity: 40, hasMultimedia: true, hasAirConditioning: true, description: '' },
    formExtraFromItem: { code: 'code', building: 'building', floor: 'floor', roomNumber: 'roomNumber', capacity: 'capacity', hasMultimedia: 'hasMultimedia', hasAirConditioning: 'hasAirConditioning', description: 'description' },
    validateMsg: 'Classroom code is required.',
    statsExtra: () => ('const withMedia = items.filter((s: any) => s.hasMultimedia);\n    const large = items.filter((s: any) => s.capacity >= 60);\n    const totalCapacity = items.reduce((sum: number, s: any) => sum + (s.capacity || 0), 0);'),
    categoryVar: null,
    categoryOptions: null,
    categoryField: null,
    icon: 'Home',
  },
  // ── CRM ──
  {
    fileName: 'crmIndustries', tableName: 'crmIndustries', pageName: 'MasterDataIndustries',
    title: 'Industries', subtitle: 'Define industries — classify leads and organizations by industry sector.',
    entityName: 'Industry', entityNamePlural: 'Industries',
    route: '/studios/master-data/crm/industries', backRoute: '/studios/master-data/crm', backLabel: 'Back to CRM Masters',
    extraCodeField: true, extraCols: ['Code', 'Sector'],
    formExtraDefaults: { code: '', sector: 'Education', description: '' },
    formExtraFromItem: { code: 'code', sector: 'sector', description: 'description' },
    validateMsg: 'Industry code is required.',
    statsExtra: () => ('const sectors = new Set(items.map((s: any) => s.sector));'),
    categoryVar: 'SECTOR_OPTIONS',
    categoryOptions: ['Education','Healthcare','Technology','Finance','Manufacturing','Retail','Real Estate','Hospitality','Consulting','Government','Non-Profit','Other'],
    categoryField: 'sector',
    icon: 'Building',
  },
  // ── Sales Extra Pages ──
  {
    fileName: 'salesOpportunityTypes', tableName: 'salesOpportunityTypes', pageName: 'MasterDataSalesOpportunityTypes',
    title: 'Opportunity Types', subtitle: 'Define opportunity types — classify sales opportunities by category and source.',
    entityName: 'OpportunityType', entityNamePlural: 'Opportunity Types',
    route: '/studios/master-data/sales/opportunity-types', backRoute: '/studios/master-data/sales', backLabel: 'Back to Sales Masters',
    extraCodeField: true, extraCols: ['Code', 'Category'],
    formExtraDefaults: { code: '', opportunityCategory: 'Admission', description: '' },
    formExtraFromItem: { code: 'code', opportunityCategory: 'opportunityCategory', description: 'description' },
    validateMsg: 'Opportunity type code is required.',
    statsExtra: () => ('const cats = new Set(items.map((s: any) => s.opportunityCategory));'),
    categoryVar: 'OPPORTUNITY_CATEGORIES',
    categoryOptions: ['Admission','Upsell','Corporate','Partnership','Institutional','Government','Retention','Other'],
    categoryField: 'opportunityCategory',
    icon: 'Target',
  },
  {
    fileName: 'salesQuotationStatuses', tableName: 'salesQuotationStatuses', pageName: 'MasterDataSalesQuotationStatuses',
    title: 'Quotation Statuses', subtitle: 'Define quotation statuses — track the lifecycle of sales quotations.',
    entityName: 'QuotationStatus', entityNamePlural: 'Quotation Statuses',
    route: '/studios/master-data/sales/quotation-statuses', backRoute: '/studios/master-data/sales', backLabel: 'Back to Sales Masters',
    extraCodeField: true, extraCols: ['Code', 'Category'],
    formExtraDefaults: { code: '', statusCategory: 'Pending', description: '' },
    formExtraFromItem: { code: 'code', statusCategory: 'statusCategory', description: 'description' },
    validateMsg: 'Quotation status code is required.',
    statsExtra: () => ('const pending = items.filter((s: any) => s.statusCategory === "Pending");\n    const finalized = items.filter((s: any) => s.statusCategory === "Finalized");'),
    categoryVar: 'QUOTATION_CATEGORIES',
    categoryOptions: ['Pending','Finalized','Cancelled','Draft'],
    categoryField: 'statusCategory',
    icon: 'FileText',
  },
  {
    fileName: 'salesPaymentStatuses', tableName: 'salesPaymentStatuses', pageName: 'MasterDataPaymentStatuses',
    title: 'Payment Statuses', subtitle: 'Define payment statuses — track payment lifecycle stages.',
    entityName: 'PaymentStatus', entityNamePlural: 'Payment Statuses',
    route: '/studios/master-data/sales/payment-statuses', backRoute: '/studios/master-data/sales', backLabel: 'Back to Sales Masters',
    extraCodeField: true, extraCols: ['Code', 'Category'],
    formExtraDefaults: { code: '', statusCategory: 'Pending', description: '' },
    formExtraFromItem: { code: 'code', statusCategory: 'statusCategory', description: 'description' },
    validateMsg: 'Payment status code is required.',
    statsExtra: () => ('const pending = items.filter((s: any) => s.statusCategory === "Pending");\n    const completed = items.filter((s: any) => s.statusCategory === "Completed");'),
    categoryVar: 'PAYMENT_STATUS_CATEGORIES',
    categoryOptions: ['Pending','Completed','Failed','Refunded','Cancelled','On Hold'],
    categoryField: 'statusCategory',
    icon: 'CreditCard',
  },
  {
    fileName: 'salesInvoiceTypes', tableName: 'salesInvoiceTypes', pageName: 'MasterDataInvoiceTypes',
    title: 'Invoice Types', subtitle: 'Define invoice types — classify invoices for billing and accounting.',
    entityName: 'InvoiceType', entityNamePlural: 'Invoice Types',
    route: '/studios/master-data/sales/invoice-types', backRoute: '/studios/master-data/sales', backLabel: 'Back to Sales Masters',
    extraCodeField: true, extraCols: ['Code', 'Category'],
    formExtraDefaults: { code: '', invoiceCategory: 'Standard', description: '' },
    formExtraFromItem: { code: 'code', invoiceCategory: 'invoiceCategory', description: 'description' },
    validateMsg: 'Invoice type code is required.',
    statsExtra: () => ('const cats = new Set(items.map((s: any) => s.invoiceCategory));'),
    categoryVar: 'INVOICE_CATEGORIES',
    categoryOptions: ['Standard','Proforma','Credit Note','Debit Note','Recurring','Advance','Final'],
    categoryField: 'invoiceCategory',
    icon: 'FileSpreadsheet',
  },
  {
    fileName: 'salesTaxSlabs', tableName: 'salesTaxSlabs', pageName: 'MasterDataTaxSlabs',
    title: 'Tax Slabs', subtitle: 'Define tax slabs — configure income and sales tax brackets for pricing.',
    entityName: 'TaxSlab', entityNamePlural: 'Tax Slabs',
    route: '/studios/master-data/sales/tax-slabs', backRoute: '/studios/master-data/sales', backLabel: 'Back to Sales Masters',
    extraCodeField: true, extraCols: ['Code', 'Type', 'Rate', 'Range'],
    formExtraDefaults: { code: '', slabType: 'Income Tax', fromAmount: 0, toAmount: 500000, taxRate: 5, description: '' },
    formExtraFromItem: { code: 'code', slabType: 'slabType', fromAmount: 'fromAmount', toAmount: 'toAmount', taxRate: 'taxRate', description: 'description' },
    validateMsg: 'Tax slab code is required.',
    statsExtra: () => ('const income = items.filter((s: any) => s.slabType === "Income Tax");\n    const sales = items.filter((s: any) => s.slabType === "Sales Tax");'),
    categoryVar: 'SLAB_TYPES',
    categoryOptions: ['Income Tax','Sales Tax','GST','Customs Duty','Other'],
    categoryField: 'slabType',
    icon: 'Layers',
  },
  // ── Communication Masters ──
  {
    fileName: 'commNotificationTypes', tableName: 'commNotificationTypes', pageName: 'MasterDataNotificationTypes',
    title: 'Notification Types', subtitle: 'Define notification types — configure system notification categories and channels.',
    entityName: 'NotificationType', entityNamePlural: 'Notification Types',
    route: '/studios/master-data/communication/notification-types', backRoute: '/studios/master-data/communication', backLabel: 'Back to Communication Masters',
    extraCodeField: true, extraCols: ['Code', 'Channel'],
    formExtraDefaults: { code: '', channelType: 'In-App', description: '' },
    formExtraFromItem: { code: 'code', channelType: 'channelType', description: 'description' },
    validateMsg: 'Notification type code is required.',
    statsExtra: () => ('const channels = new Set(items.map((s: any) => s.channelType));'),
    categoryVar: 'CHANNEL_TYPES',
    categoryOptions: ['In-App','Email','SMS','WhatsApp','Push','Webhook','All'],
    categoryField: 'channelType',
    icon: 'Megaphone',
  },
  {
    fileName: 'commEmailTemplates', tableName: 'commEmailTemplates', pageName: 'MasterDataEmailTemplates',
    title: 'Email Templates', subtitle: 'Define email templates — manage reusable email templates for communication.',
    entityName: 'EmailTemplate', entityNamePlural: 'Email Templates',
    route: '/studios/master-data/communication/email-templates', backRoute: '/studios/master-data/communication', backLabel: 'Back to Communication Masters',
    extraCodeField: true, extraCols: ['Code', 'Category', 'Subject'],
    formExtraDefaults: { code: '', templateCategory: 'Transactional', subject: '', bodyPreview: '', description: '' },
    formExtraFromItem: { code: 'code', templateCategory: 'templateCategory', subject: 'subject', bodyPreview: 'bodyPreview', description: 'description' },
    validateMsg: 'Email template code is required.',
    statsExtra: () => ('const cats = new Set(items.map((s: any) => s.templateCategory));'),
    categoryVar: 'EMAIL_CATEGORIES',
    categoryOptions: ['Transactional','Promotional','Notification','Onboarding','Follow-up','Reminder','Alert','Newsletter'],
    categoryField: 'templateCategory',
    icon: 'Mail',
  },
  {
    fileName: 'commSmsTemplates', tableName: 'commSmsTemplates', pageName: 'MasterDataSmsTemplates',
    title: 'SMS Templates', subtitle: 'Define SMS templates — manage reusable SMS message templates.',
    entityName: 'SmsTemplate', entityNamePlural: 'SMS Templates',
    route: '/studios/master-data/communication/sms-templates', backRoute: '/studios/master-data/communication', backLabel: 'Back to Communication Masters',
    extraCodeField: true, extraCols: ['Code', 'Category'],
    formExtraDefaults: { code: '', templateCategory: 'Transactional', bodyPreview: '', description: '' },
    formExtraFromItem: { code: 'code', templateCategory: 'templateCategory', bodyPreview: 'bodyPreview', description: 'description' },
    validateMsg: 'SMS template code is required.',
    statsExtra: () => ('const cats = new Set(items.map((s: any) => s.templateCategory));'),
    categoryVar: 'SMS_CATEGORIES',
    categoryOptions: ['Transactional','Promotional','Reminder','Alert','OTP','Follow-up','Other'],
    categoryField: 'templateCategory',
    icon: 'MessageSquare',
  },
  {
    fileName: 'commWhatsAppTemplates', tableName: 'commWhatsAppTemplates', pageName: 'MasterDataWhatsAppTemplates',
    title: 'WhatsApp Templates', subtitle: 'Define WhatsApp templates — manage reusable WhatsApp message templates.',
    entityName: 'WhatsAppTemplate', entityNamePlural: 'WhatsApp Templates',
    route: '/studios/master-data/communication/whatsapp-templates', backRoute: '/studios/master-data/communication', backLabel: 'Back to Communication Masters',
    extraCodeField: true, extraCols: ['Code', 'Category'],
    formExtraDefaults: { code: '', templateCategory: 'Transactional', bodyPreview: '', description: '' },
    formExtraFromItem: { code: 'code', templateCategory: 'templateCategory', bodyPreview: 'bodyPreview', description: 'description' },
    validateMsg: 'WhatsApp template code is required.',
    statsExtra: () => ('const cats = new Set(items.map((s: any) => s.templateCategory));'),
    categoryVar: 'WA_CATEGORIES',
    categoryOptions: ['Transactional','Promotional','Reminder','Alert','Follow-up','Greeting','Other'],
    categoryField: 'templateCategory',
    icon: 'MessageCircle',
  },
];

// ─── Helper: Generate Convex Backend File ───
function generateConvexBackend(m) {
  const { fileName, tableName, entityName } = m;
  return `import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const SEED_DATA = [];

function baseFields(data: any, sequence: number) {
  return {
    ...data,
    sequence,
    active: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export const seedDefault = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("${tableName}").withIndex("sequence").collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (const d of SEED_DATA) {
      await ctx.db.insert("${tableName}", baseFields(d, count));
      count++;
    }
    return { seeded: count };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    // EXTRA_FIELDS_PLACEHOLDER
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("${tableName}").withIndex("sequence").collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("${tableName}", {
      ...args,
      description: args.description ?? "",
      sequence: maxSeq + 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: { id: v.id("${tableName}"), name: v.optional(v.string()), code: v.optional(v.string()), color: v.optional(v.string()), icon: v.optional(v.string()), description: v.optional(v.string()), active: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("${entityName} not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("${tableName}") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("${entityName} not found");
    await ctx.db.delete(args.id);
  },
});

export const duplicate = mutation({
  args: { id: v.id("${tableName}") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("${entityName} not found");
    const all = await ctx.db.query("${tableName}").withIndex("sequence").collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("${tableName}", {
      name: source.name + " (Copy)",
      code: source.code + "_COPY",
      color: source.color,
      icon: source.icon,
      description: source.description,
      sequence: maxSeq + 1,
      active: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const reorder = mutation({
  args: { orderedIds: v.array(v.id("${tableName}")) },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { sequence: i, updatedAt: Date.now() });
    }
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("${tableName}").withIndex("sequence").collect();
  },
});

export const get = query({
  args: { id: v.id("${tableName}") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
`;
}

// Actually let me use the existing pattern from salesTerritories.ts which has proper function names
function generateConvexBackendProper(m) {
  const { fileName, tableName, entityName, entityNamePlural } = m;
  
  // Convert to proper naming: hr_employee_categories -> hrEmployeeCategories
  const pascalName = fileName.charAt(0).toUpperCase() + fileName.slice(1);
  
  return `import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* ────────────
   SEED DATA
   ──────────── */

const SEED_DATA: Array<{
  name: string;
  code: string;
  color: string;
  icon: string;
  description: string;
  [key: string]: any;
}> = [];

/* ────────────
   HELPERS
   ──────────── */

function baseFields(data: (typeof SEED_DATA)[number], sequence: number) {
  return {
    ...data,
    sequence,
    active: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/* ────────────
   MUTATIONS
   ──────────── */

export const seedDefault = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("${tableName}")
      .withIndex("sequence")
      .collect();
    if (existing.length > 0) return { seeded: 0, message: "Already seeded" };
    let count = 0;
    for (const data of SEED_DATA) {
      await ctx.db.insert("${tableName}", baseFields(data, count));
      count++;
    }
    return { seeded: count };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("${tableName}")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("${tableName}", {
      ...args,
      description: args.description ?? "",
      sequence: maxSeq + 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("${tableName}"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("${entityName} not found");
    return ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("${tableName}") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("${entityName} not found");
    await ctx.db.delete(args.id);
  },
});

export const duplicate = mutation({
  args: { id: v.id("${tableName}") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("${entityName} not found");
    const all = await ctx.db
      .query("${tableName}")
      .withIndex("sequence")
      .collect();
    const maxSeq = all.reduce((m, r) => Math.max(m, r.sequence), -1);
    return ctx.db.insert("${tableName}", {
      name: \`\${source.name} (Copy)\`,
      code: \`\${source.code}_COPY\`,
      color: source.color,
      icon: source.icon,
      description: source.description,
      sequence: maxSeq + 1,
      active: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const reorder = mutation({
  args: { orderedIds: v.array(v.id("${tableName}")) },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], { sequence: i, updatedAt: Date.now() });
    }
  },
});

/* ────────────
   QUERIES
   ──────────── */

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("${tableName}").withIndex("sequence").collect();
  },
});

export const get = query({
  args: { id: v.id("${tableName}") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});
`;
}

// ─── Generate ALL Convex Backend Files ───
console.log('📦 Generating Convex backend files...');
let convexCount = 0;
for (const m of MASTER_CONFIGS) {
  const content = generateConvexBackendProper(m);
  const filePath = path.join(ROOT, 'src/convex', `${m.fileName}.ts`);
  fs.writeFileSync(filePath, content);
  convexCount++;
  if (convexCount % 5 === 0) console.log(`  ✓ ${convexCount}/${MASTER_CONFIGS.length} backend files`);
}
console.log(`✅ Generated ${convexCount} Convex backend files`);

// ─── Generate ALL Frontend Pages ───
console.log('\n📦 Generating frontend pages...');

function generateFrontendPage(m) {
  const opts = m.categoryOptions ? `\nconst ${m.categoryVar} = ${JSON.stringify(m.categoryOptions)};` : '';
  const iconImports = `GraduationCap, Heart, Building, School, BookOpen, Building2, Handshake, Landmark, Shield, HeartHandshake, Globe, Star, User, UserCheck, Users, BadgeCheck, Briefcase, Award, Sparkles, Zap, Target, Flag, MapPin, Map, Wifi, FileText, DollarSign, CreditCard, Wallet, Percent, Clock, Home, Calendar, Mail, MessageSquare, MessageCircle, TrendingUp, Layers, FileSpreadsheet, Coins, Megaphone, Phone, Monitor`;

  return `import MasterDataTable, { formatDate } from "@/components/studios/MasterDataTable";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import {
  ${iconImports},
} from "lucide-react";
${opts || ''}

/* ─── Icon Configuration ─── */

const ICON_OPTIONS = ${JSON.stringify(ICONS.slice(0, 30).map(s => ({ value: s, label: s, icon: s })), null, 2).replace(/"/g, "'").replace(/\n/g, '\n  ').replace(/'value'/g, 'value:').replace(/'label'/g, 'label:').replace(/'icon'/g, 'icon:')};

const COLOR_PRESETS = [${COLOR_PRESETS}];

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((o: any) => o.value === iconName);
  return found?.icon || ${m.icon};
}

/* ─── Config ─── */

const config: import("@/components/studios/MasterDataTable").MasterDataConfig = {
  title: "${m.title}",
  subtitle: "${m.subtitle}",
  entityName: "${m.entityName}",
  entityNamePlural: "${m.entityNamePlural}",
  backRoute: "${m.backRoute}",
  backLabel: "${m.backLabel}",

  apiModule: {
    list: api.${m.fileName}.list,
    get: api.${m.fileName}.get,
    create: api.${m.fileName}.create,
    update: api.${m.fileName}.update,
    delete: api.${m.fileName}.remove,
    duplicate: api.${m.fileName}.duplicate,
    reorder: api.${m.fileName}.reorder,
    seedDefault: api.${m.fileName}.seedDefault,
  },

  getStats: (items) => {
    if (!items || items.length === 0) return [];
    const active = items.filter((s: any) => s.active);
    const sortedByUpdated = [...items].sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    return [
      { label: "Total", value: items.length },
      { label: "Active", value: active.length, valueColor: "#34a853" },
      { label: "Recently Updated", value: sortedByUpdated[0] ? formatDate(sortedByUpdated[0].updatedAt) : "—" },
    ];
  },

  getIconComponent,
  iconOptions: ICON_OPTIONS,
  colorPresets: COLOR_PRESETS,
  hasSeed: true,
  requiredRole: "super_admin",

  extraColumns: [
    {
      header: "Code",
      width: "w-20",
      cell: (item: any) => (
        <span className="text-[11px] font-mono font-medium text-[#5f6368] bg-[#f1f3f4] px-1.5 py-0.5 rounded">{item.code}</span>
      ),
    },
  ],

  getDefaultFormExtra: () => (${JSON.stringify(m.formExtraDefaults)}),
  getFormExtraFromItem: (item: any) => (${JSON.stringify(Object.keys(m.formExtraFromItem).reduce((acc, k) => ({...acc, [k]: `item.${m.formExtraFromItem[k]}||""`}), {}))}),

  validateExtra: (extra) => {
    if (!extra.code || !extra.code.trim()) return "${m.validateMsg}";
    return null;
  },

  renderFormFields: ({
    formExtra, setFormExtra, formColor, setFormColor, formIcon, setFormIcon,
    showColorPicker, setShowColorPicker,
  }) => (
    <>
      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <code className="h-3 w-3 inline mr-1 text-[10px]">&lt;/&gt;</code> Code *
        </label>
        <Input
          value={formExtra.code || ""}
          onChange={(e) => setFormExtra("code", e.target.value.toUpperCase())}
          className="h-8 text-[12px] font-mono"
          placeholder="e.g. CODE"
        />
      </div>

      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <span className="h-3 w-3 inline mr-1 text-[10px]">&#x2709;</span> Description
        </label>
        <textarea
          value={formExtra.description || ""}
          onChange={(e) => setFormExtra("description", e.target.value)}
          placeholder="Brief description..."
          className="w-full min-h-[50px] text-[11px] px-2.5 py-1.5 rounded-lg border border-[#e8eaed] resize-none focus:outline-none focus:border-[#1a1a2e]"
          rows={2}
        />
      </div>

      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">
          <span className="h-3 w-3 inline mr-1 rounded-full border border-[#e8eaed]" style={{ backgroundColor: formColor }} /> Color
        </label>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-8 h-8 rounded-md border border-[#e8eaed] flex items-center justify-center hover:border-[#1a1a2e] transition-colors"
            style={{ backgroundColor: formColor }}>
            <span className="text-[8px] text-white font-bold" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>{formColor.replace("#", "")}</span>
          </button>
          <Input value={formColor} onChange={(e) => setFormColor(e.target.value)}
            className="h-8 text-[11px] font-mono w-28" placeholder="#000000" />
        </div>
        {showColorPicker && (
          <div className="flex flex-wrap gap-1.5 mt-2 p-2 rounded-lg bg-[#f8f9fa] border border-[#e8eaed]">
            {COLOR_PRESETS.map((c) => (
              <button key={c} onClick={() => { setFormColor(c); setShowColorPicker(false); }}
                className={\`w-7 h-7 rounded-md border-2 transition-all \${formColor === c ? "border-[#1a1a2e] scale-110" : "border-transparent hover:border-[#9aa0a6]"}\`}
                style={{ backgroundColor: c }} title={c} />
            ))}
            <input type="color" value={formColor} onChange={(e) => setFormColor(e.target.value)}
              className="w-7 h-7 rounded-md border-2 border-dashed border-[#e8eaed] cursor-pointer" title="Custom color" />
          </div>
        )}
      </div>

      <div>
        <label className="text-[10px] text-[#5f6368] mb-1 block font-medium">Icon</label>
        <div className="grid grid-cols-5 gap-1.5">
          {ICON_OPTIONS.map((opt: any) => {
            const IconComp = opt.icon;
            const isSelected = formIcon === opt.value;
            return (
              <button key={opt.value} onClick={() => setFormIcon(opt.value)}
                className={\`flex flex-col items-center gap-0.5 p-1.5 rounded-md border transition-all \${isSelected ? "border-[#1a1a2e] bg-[#f1f3f4]" : "border-[#e8eaed] hover:bg-[#f8f9fa] hover:border-[#9aa0a6]"}\`}>
                <IconComp className="h-4 w-4 text-[#5f6368]" />
                <span className="text-[7px] text-[#9aa0a6] leading-tight text-center">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  ),
};

export default function ${m.pageName}() {
  return <MasterDataTable config={config} />;
}
`;
}

let pageCount = 0;
for (const m of MASTER_CONFIGS) {
  const content = generateFrontendPage(m);
  // Fix the icon import - generate proper imports
  const fixedContent = content.replace(
    `GraduationCap, Heart, Building, School, BookOpen, Building2, Handshake, Landmark, Shield, HeartHandshake, Globe, Star, User, UserCheck, Users, BadgeCheck, Briefcase, Award, Sparkles, Zap, Target, Flag, MapPin, Map, Wifi, FileText, DollarSign, CreditCard, Wallet, Percent, Clock, Home, Calendar, Mail, MessageSquare, MessageCircle, TrendingUp, Layers, FileSpreadsheet, Coins, Megaphone, Phone, Monitor`,
    `GraduationCap, Heart, Building, School, BookOpen, Building2, Handshake, Landmark, Shield, HeartHandshake, Globe, Star, User, UserCheck, Users, BadgeCheck, Briefcase, Award, Sparkles, Zap, Target, Flag, MapPin, Map, ${m.icon === 'GraduationCap' ? '' : m.icon + ','} Wifi, FileText, DollarSign, CreditCard, Wallet, Percent, Clock, Home, Calendar, Mail, MessageSquare, MessageCircle, TrendingUp, Layers, FileSpreadsheet, Coins, Megaphone, Phone, Monitor`
  );
  
  const filePath = path.join(ROOT, 'src/pages/studios', `${m.pageName}.tsx`);
  fs.writeFileSync(filePath, fixedContent);
  pageCount++;
  if (pageCount % 5 === 0) console.log(`  ✓ ${pageCount}/${MASTER_CONFIGS.length} frontend pages`);
}
console.log(`✅ Generated ${pageCount} frontend pages`);

// ─── Generate Schema Fragment ───
// This will be printed so we can manually apply it
console.log('\n📋 Schema additions needed (apply separately)');

console.log('\n✅ ALL DONE!');
console.log(`   Generated: ${convexCount} Convex backend files`);
console.log(`   Generated: ${pageCount} frontend pages`);
