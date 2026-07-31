import { defineTable } from "convex/server";
import { v } from "convex/values";

export const financeTables = {
  cashBookEntries: defineTable({
    entryNumber: v.string(),
    entryDate: v.number(),
    entryType: v.union(v.literal("debit"), v.literal("credit")),
    amount: v.number(),
    description: v.string(),
    category: v.union(v.literal("fee_collection"), v.literal("expense"), v.literal("refund"), v.literal("transfer"), v.literal("miscellaneous")),
    paymentMode: v.string(),
    branchId: v.optional(v.id("branches")),
    referenceType: v.optional(v.string()),
    referenceId: v.optional(v.string()),
    balanceAfter: v.number(),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("entryNumber", ["entryNumber"])
    .index("entryDate", ["entryDate"])
    .index("entryType", ["entryType"])
    .index("category", ["category"])
    .index("branchId", ["branchId"])
    .index("by_created", ["createdAt"]),
  creditNotes: defineTable({
    creditNoteNumber: v.string(),
    invoiceId: v.optional(v.id("feeInvoices")),
    studentId: v.id("studentMaster"),
    amount: v.number(),
    reason: v.string(),
    status: v.union(v.literal("draft"), v.literal("issued"), v.literal("applied"), v.literal("cancelled")),
    appliedToInvoice: v.optional(v.boolean()),
    createdBy: v.id("users"),
    approvedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("creditNoteNumber", ["creditNoteNumber"])
    .index("invoiceId", ["invoiceId"])
    .index("studentId", ["studentId"])
    .index("status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  expenseRecords: defineTable({
    branchId: v.optional(v.id("branches")),
    departmentId: v.optional(v.id("departments")),
    expenseCategoryId: v.optional(v.id("financeExpenseCategories")),
    amount: v.number(),
    description: v.string(),
    expenseDate: v.number(),
    isRecurring: v.boolean(),
    recurringFrequency: v.optional(v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("yearly"))),
    vendorName: v.optional(v.string()),
    billReference: v.optional(v.string()),
    attachmentUrl: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("pending_approval"), v.literal("approved"), v.literal("rejected"), v.literal("paid")),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("branchId", ["branchId"])
    .index("departmentId", ["departmentId"])
    .index("expenseCategoryId", ["expenseCategoryId"])
    .index("status", ["status"])
    .index("expenseDate", ["expenseDate"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  feeDiscounts: defineTable({
    name: v.string(),
    code: v.string(),
    discountType: v.union(v.literal("percentage"), v.literal("fixed")),
    value: v.number(),
    maxAmount: v.optional(v.number()),
    applicableToVerticals: v.optional(v.array(v.string())),
    applicableToCourses: v.optional(v.array(v.id("courses"))),
    validFrom: v.optional(v.number()),
    validUntil: v.optional(v.number()),
    maxApplications: v.optional(v.number()),
    currentApplications: v.number(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
  })
    .index("code", ["code"])
    .index("isActive", ["isActive"]),
  feeInstallments: defineTable({
    studentId: v.id("studentMaster"),
    feeAccountId: v.id("studentFeeAccounts"),
    invoiceId: v.optional(v.id("feeInvoices")),
    installmentNumber: v.number(),
    totalInstallments: v.number(),
    amount: v.number(),
    paidAmount: v.number(),
    lateFee: v.number(),
    dueDate: v.number(),
    paidDate: v.optional(v.number()),
    status: v.union(v.literal("pending"), v.literal("paid"), v.literal("partial"), v.literal("overdue"), v.literal("cancelled")),
  })
    .index("studentId", ["studentId"])
    .index("feeAccountId", ["feeAccountId"])
    .index("status", ["status"])
    .index("dueDate", ["dueDate"]),
  feeInvoices: defineTable({
    invoiceNumber: v.string(),
    studentId: v.id("studentMaster"),
    feeAccountId: v.id("studentFeeAccounts"),
    invoiceDate: v.number(),
    dueDate: v.number(),
    lineItems: v.string(),
    subtotal: v.number(),
    discountAmount: v.number(),
    taxAmount: v.number(),
    totalAmount: v.number(),
    paidAmount: v.number(),
    balanceDue: v.number(),
    status: v.union(v.literal("draft"), v.literal("pending"), v.literal("paid"), v.literal("partial"), v.literal("overdue"), v.literal("cancelled"), v.literal("refunded")),
    billingPeriod: v.optional(v.string()),
    gstPercentage: v.optional(v.number()),
    gstAmount: v.optional(v.number()),
    createdBy: v.id("users"),
  })
    .index("invoiceNumber", ["invoiceNumber"])
    .index("studentId", ["studentId"])
    .index("status", ["status"])
    .index("dueDate", ["dueDate"]),
  feeScholarships: defineTable({
    name: v.string(),
    code: v.string(),
    scholarshipType: v.union(v.literal("percentage"), v.literal("fixed")),
    value: v.number(),
    maxAmount: v.optional(v.number()),
    criteria: v.string(),
    applicableToVerticals: v.optional(v.array(v.string())),
    minGrade: v.optional(v.string()),
    minIncome: v.optional(v.number()),
    validFrom: v.optional(v.number()),
    validUntil: v.optional(v.number()),
    maxApplications: v.optional(v.number()),
    currentApplications: v.number(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
  })
    .index("code", ["code"])
    .index("isActive", ["isActive"]),
  feeStructures: defineTable({
    name: v.string(),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    feeCategoryId: v.optional(v.id("financeFeeCategories")),
    amount: v.number(),
    isRecurring: v.boolean(),
    frequency: v.union(v.literal("one_time"), v.literal("monthly"), v.literal("quarterly"), v.literal("half_yearly"), v.literal("yearly")),
    isOptional: v.boolean(),
    isRefundable: v.boolean(),
    applicableToVerticals: v.optional(v.array(v.string())),
    applicableToCourses: v.optional(v.array(v.id("courses"))),
    isActive: v.boolean(),
    createdBy: v.id("users"),
  }).index("feeCategoryId", ["feeCategoryId"])
    .index("by_active", ["isActive"]),
  feeWaivers: defineTable({
    studentId: v.id("studentMaster"),
    feeAccountId: v.id("studentFeeAccounts"),
    waiverType: v.union(v.literal("full"), v.literal("partial")),
    amount: v.number(),
    reason: v.string(),
    notes: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    createdBy: v.id("users"),
  })
    .index("studentId", ["studentId"])
    .index("status", ["status"]),
  financeBankAccounts: defineTable({
    name: v.string(),
    code: v.string(),
    accountNumber: v.string(),
    bankName: v.string(),
    branchName: v.optional(v.string()),
    ifscCode: v.optional(v.string()),
    swiftCode: v.optional(v.string()),
    accountType: v.string(),
    isDefault: v.boolean(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  financeCurrencies: defineTable({
    name: v.string(),
    code: v.string(),
    symbol: v.string(),
    isoCode: v.string(),
    isBase: v.boolean(),
    exchangeRate: v.optional(v.number()),
    decimalPlaces: v.number(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  financeDiscountCategories: defineTable({
    name: v.string(),
    code: v.string(),
    discountType: v.string(),
    isPercentage: v.boolean(),
    maxValue: v.optional(v.number()),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  financeExpenseCategories: defineTable({
    name: v.string(),
    code: v.string(),
    expenseType: v.string(),
    budgetable: v.boolean(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  financeFeeCategories: defineTable({
    name: v.string(),
    code: v.string(),
    feeType: v.string(),
    isRecurring: v.boolean(),
    isOptional: v.boolean(),
    isRefundable: v.boolean(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  financeFinancialYears: defineTable({
    name: v.string(),
    code: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    isCurrent: v.boolean(),
    isClosed: v.boolean(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  financeGstRates: defineTable({
    name: v.string(),
    code: v.string(),
    gstType: v.string(),
    cgstRate: v.number(),
    sgstRate: v.number(),
    igstRate: v.optional(v.number()),
    totalRate: v.number(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  financeIncomeCategories: defineTable({
    name: v.string(),
    code: v.string(),
    incomeType: v.string(),
    isTaxable: v.boolean(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  financePaymentModes: defineTable({
    name: v.string(),
    code: v.string(),
    modeCategory: v.string(),
    isDigital: v.boolean(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  financeTaxTypes: defineTable({
    name: v.string(),
    code: v.string(),
    taxCategory: v.string(),
    taxRate: v.number(),
    isCompound: v.boolean(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.string(),
    sequence: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  journalEntries: defineTable({
    entryNumber: v.string(),
    entryDate: v.number(),
    description: v.string(),
    debitAccount: v.string(),
    creditAccount: v.string(),
    amount: v.number(),
    referenceType: v.optional(v.union(v.literal("invoice"), v.literal("payment"), v.literal("expense"), v.literal("receipt"), v.literal("adjustment"), v.literal("refund"))),
    referenceId: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("posted"), v.literal("reversed")),
    approvedBy: v.optional(v.id("users")),
    postedAt: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("entryNumber", ["entryNumber"])
    .index("entryDate", ["entryDate"])
    .index("status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  lateFeeRules: defineTable({
    name: v.string(),
    feeStructureId: v.optional(v.id("feeStructures")),
    gracePeriod: v.number(),
    gracePeriodUnit: v.union(v.literal("days"), v.literal("weeks")),
    lateFeeType: v.union(v.literal("percentage"), v.literal("fixed"), v.literal("per_day")),
    value: v.number(),
    maxLateFee: v.optional(v.number()),
    waiveFirstLateFee: v.boolean(),
    notes: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("feeStructureId", ["feeStructureId"])
    .index("isActive", ["isActive"]),
  paymentMethods: defineTable({
    name: v.string(),
    code: v.string(),
    type: v.union(v.literal("cash"), v.literal("bank_transfer"), v.literal("credit_card"), v.literal("debit_card"), v.literal("upi"), v.literal("online_gateway"), v.literal("wallet"), v.literal("cheque"), v.literal("pdc")),
    requiresReference: v.boolean(),
    processingFee: v.optional(v.number()),
    description: v.optional(v.string()),
    isActive: v.boolean(),
  }).index("code", ["code"])
    .index("by_active", ["isActive"]),
  paymentTransactions: defineTable({
    transactionNumber: v.string(),
    studentId: v.id("studentMaster"),
    feeAccountId: v.id("studentFeeAccounts"),
    invoiceId: v.optional(v.id("feeInvoices")),
    installmentId: v.optional(v.id("feeInstallments")),
    paymentMethod: v.string(),
    paymentDate: v.number(),
    amount: v.number(),
    referenceNumber: v.optional(v.string()),
    gatewayTransactionId: v.optional(v.string()),
    bankName: v.optional(v.string()),
    chequeNumber: v.optional(v.string()),
    chequeDate: v.optional(v.number()),
    status: v.union(v.literal("pending"), v.literal("verified"), v.literal("completed"), v.literal("failed"), v.literal("reversed"), v.literal("refunded")),
    verifiedBy: v.optional(v.id("users")),
    verifiedAt: v.optional(v.number()),
    reconciledAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  })
    .index("transactionNumber", ["transactionNumber"])
    .index("studentId", ["studentId"])
    .index("invoiceId", ["invoiceId"])
    .index("status", ["status"])
    .index("paymentDate", ["paymentDate"]),
  receiptHistory: defineTable({
    receiptNumber: v.string(),
    invoiceId: v.optional(v.id("feeInvoices")),
    studentId: v.id("studentMaster"),
    transactionId: v.optional(v.id("paymentTransactions")),
    amount: v.number(),
    receiptDate: v.number(),
    receiptType: v.union(v.literal("payment"), v.literal("refund"), v.literal("adjustment")),
    receiptData: v.optional(v.string()),
    pdfUrl: v.optional(v.string()),
    emailedAt: v.optional(v.number()),
    whatsappSentAt: v.optional(v.number()),
    createdBy: v.id("users"),
  })
    .index("receiptNumber", ["receiptNumber"])
    .index("invoiceId", ["invoiceId"])
    .index("studentId", ["studentId"])
    .index("receiptDate", ["receiptDate"]),
  refundRequests: defineTable({
    studentId: v.optional(v.id("studentMaster")),
    transactionId: v.optional(v.id("paymentTransactions")),
    invoiceId: v.optional(v.id("feeInvoices")),
    amount: v.number(),
    reason: v.string(),
    reasonCategory: v.union(v.literal("academic"), v.literal("administrative"), v.literal("financial"), v.literal("withdrawal"), v.literal("other")),
    status: v.union(v.literal("draft"), v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("processing"), v.literal("completed")),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    processedAt: v.optional(v.number()),
    refundMethod: v.optional(v.string()),
    refundReference: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("studentId", ["studentId"])
    .index("transactionId", ["transactionId"])
    .index("status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),
  studentFeeAccounts: defineTable({
    studentId: v.id("studentMaster"),
    totalFee: v.number(),
    totalPaid: v.number(),
    outstandingBalance: v.number(),
    totalDiscount: v.number(),
    totalScholarship: v.number(),
    totalWaiver: v.number(),
    installmentsCount: v.number(),
    installmentFrequency: v.string(),
    nextDueDate: v.optional(v.number()),
    lastPaymentDate: v.optional(v.number()),
    status: v.union(v.literal("active"), v.literal("closed"), v.literal("defaulted")),
    createdBy: v.id("users"),
  })
    .index("studentId", ["studentId"])
    .index("status", ["status"]),
  taxRules: defineTable({
    name: v.string(),
    code: v.string(),
    taxType: v.union(v.literal("gst"), v.literal("vat"), v.literal("service_tax"), v.literal("custom")),
    rate: v.number(),
    applicableToVerticals: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("code", ["code"])
    .index("isActive", ["isActive"]),
  vendorBills: defineTable({
    vendorName: v.string(),
    vendorContact: v.optional(v.string()),
    billNumber: v.string(),
    billDate: v.number(),
    dueDate: v.number(),
    amount: v.number(),
    paidAmount: v.number(),
    balanceDue: v.number(),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("financeExpenseCategories")),
    attachmentUrls: v.optional(v.array(v.string())),
    status: v.union(v.literal("pending"), v.literal("partial"), v.literal("paid"), v.literal("cancelled"), v.literal("overdue")),
    approvedBy: v.optional(v.id("users")),
    paidAt: v.optional(v.number()),
    paymentReference: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("billNumber", ["billNumber"])
    .index("vendorName", ["vendorName"])
    .index("status", ["status"])
    .index("dueDate", ["dueDate"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),

  // ═══════════════════════════════════════════════════════════════════
  // ENTERPRISE TABLES (PATCH-EEOS-014A)
  // ═══════════════════════════════════════════════════════════════════

  // ─── Chart of Accounts (Part 1) ──────────────────────────────────
  accountGroups: defineTable({
    name: v.string(),
    code: v.string(),
    category: v.union(v.literal("assets"), v.literal("liabilities"), v.literal("income"), v.literal("expenses"), v.literal("equity")),
    parentId: v.optional(v.id("accountGroups")),
    description: v.optional(v.string()),
    normalBalance: v.union(v.literal("debit"), v.literal("credit")),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("code", ["code"])
    .index("category", ["category"])
    .index("by_active", ["isActive"]),

  chartOfAccounts: defineTable({
    name: v.string(),
    code: v.string(),
    groupId: v.id("accountGroups"),
    description: v.optional(v.string()),
    openingBalance: v.optional(v.number()),
    currentBalance: v.number(),
    currency: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("code", ["code"])
    .index("groupId", ["groupId"])
    .index("by_active", ["isActive"]),

  // ─── Financial Transactions (Part 2) ──────────────────────────────
  financialTransactions: defineTable({
    voucherNumber: v.string(),
    transactionDate: v.number(),
    description: v.string(),
    voucherType: v.union(
      v.literal("journal"), v.literal("payment"), v.literal("receipt"),
      v.literal("invoice"), v.literal("expense"), v.literal("refund"),
      v.literal("transfer"), v.literal("adjustment"), v.literal("closing"),
      v.literal("opening"), v.literal("custom"),
    ),
    referenceModule: v.optional(v.string()),
    referenceEntity: v.optional(v.string()),
    referenceId: v.optional(v.string()),
    lines: v.string(),
    totalDebit: v.number(),
    totalCredit: v.number(),
    companyId: v.optional(v.id("orgCompanies")),
    branchId: v.optional(v.id("orgBranches")),
    departmentId: v.optional(v.id("departments")),
    costCenterId: v.optional(v.id("costCenters")),
    currency: v.string(),
    status: v.union(v.literal("draft"), v.literal("posted"), v.literal("reversed")),
    createdBy: v.id("users"),
    postedAt: v.optional(v.number()),
    reversedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("voucherNumber", ["voucherNumber"])
    .index("voucherType", ["voucherType"])
    .index("referenceModule", ["referenceModule", "referenceEntity", "referenceId"])
    .index("status", ["status"])
    .index("transactionDate", ["transactionDate"])
    .index("by_created", ["createdAt"]),

  // ─── Cost Centers (Part 4) ───────────────────────────────────────
  costCenters: defineTable({
    name: v.string(),
    code: v.string(),
    scopeType: v.union(
      v.literal("company"), v.literal("branch"), v.literal("department"),
      v.literal("vertical"), v.literal("course"), v.literal("batch"),
      v.literal("campaign"), v.literal("project"), v.literal("center"),
      v.literal("custom"),
    ),
    scopeId: v.optional(v.string()),
    parentId: v.optional(v.id("costCenters")),
    description: v.optional(v.string()),
    budgetAmount: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("code", ["code"])
    .index("scopeType", ["scopeType"])
    .index("by_active", ["isActive"]),

  // ─── Budgets (Part 9) ────────────────────────────────────────────
  budgets: defineTable({
    name: v.string(),
    code: v.string(),
    fiscalYear: v.string(),
    scopeType: v.union(
      v.literal("department"), v.literal("branch"),
      v.literal("project"), v.literal("campaign"),
      v.literal("company"), v.literal("custom"),
    ),
    scopeId: v.optional(v.string()),
    totalAmount: v.number(),
    consumedAmount: v.number(),
    remainingAmount: v.number(),
    startDate: v.number(),
    endDate: v.number(),
    description: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("pending_approval"), v.literal("approved"), v.literal("rejected"), v.literal("revised")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("code", ["code"])
    .index("fiscalYear", ["fiscalYear"])
    .index("scopeType", ["scopeType"])
    .index("status", ["status"])
    .index("by_created", ["createdAt"]),

  budgetRevisions: defineTable({
    budgetId: v.id("budgets"),
    previousAmount: v.number(),
    newAmount: v.number(),
    reason: v.string(),
    revisedAt: v.number(),
  })
    .index("budgetId", ["budgetId"]),

  budgetConsumptions: defineTable({
    budgetId: v.id("budgets"),
    amount: v.number(),
    description: v.string(),
    referenceType: v.string(),
    referenceId: v.optional(v.string()),
    consumedAt: v.number(),
  })
    .index("budgetId", ["budgetId"])
    .index("referenceType", ["referenceType"]),

  // ─── Tax Groups (Part 10) ────────────────────────────────────────
  taxGroups: defineTable({
    name: v.string(),
    code: v.string(),
    taxType: v.union(v.literal("gst"), v.literal("vat"), v.literal("service_tax"), v.literal("sales_tax"), v.literal("withholding"), v.literal("custom")),
    rate: v.number(),
    isCompound: v.boolean(),
    description: v.optional(v.string()),
    applicableToVerticals: v.optional(v.array(v.string())),
    applicableToCourses: v.optional(v.array(v.id("courses"))),
    effectiveFrom: v.optional(v.number()),
    effectiveTo: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("code", ["code"])
    .index("taxType", ["taxType"])
    .index("by_active", ["isActive"]),

  // ─── Financial Closings (Part 11) ────────────────────────────────
  financialClosings: defineTable({
    periodType: v.union(v.literal("month"), v.literal("quarter"), v.literal("year")),
    periodLabel: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    financialYearId: v.optional(v.id("financeFinancialYears")),
    status: v.union(v.literal("in_progress"), v.literal("closed"), v.literal("reopened")),
    checklistItems: v.optional(v.string()),
    closedBy: v.optional(v.id("users")),
    closedAt: v.optional(v.number()),
    remarks: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("periodType", ["periodType"])
    .index("status", ["status"])
    .index("by_created", ["createdAt"]),

  // ─── Fixed Asset Categories (Part 12) ────────────────────────────
  assetCategories: defineTable({
    name: v.string(),
    code: v.string(),
    depreciationMethod: v.union(v.literal("straight_line"), v.literal("declining"), v.literal("sum_of_years"), v.literal("units_of_production"), v.literal("none")),
    usefulLifeYears: v.number(),
    depreciationRate: v.optional(v.number()),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("code", ["code"])
    .index("by_active", ["isActive"]),

  fixedAssets: defineTable({
    name: v.string(),
    assetCode: v.string(),
    categoryId: v.id("assetCategories"),
    purchaseDate: v.number(),
    purchaseCost: v.number(),
    currentValue: v.number(),
    salvageValue: v.number(),
    accumulatedDepreciation: v.number(),
    usefulLifeYears: v.number(),
    branchId: v.optional(v.id("orgBranches")),
    departmentId: v.optional(v.id("departments")),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    serialNumber: v.optional(v.string()),
    vendorName: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    status: v.union(v.literal("active"), v.literal("transferred"), v.literal("written_off"), v.literal("disposed")),
    writeOffDate: v.optional(v.number()),
    writeOffReason: v.optional(v.string()),
    disposalDate: v.optional(v.number()),
    disposalType: v.optional(v.union(v.literal("sold"), v.literal("scrapped"), v.literal("donated"), v.literal("lost"))),
    saleAmount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("assetCode", ["assetCode"])
    .index("categoryId", ["categoryId"])
    .index("status", ["status"])
    .index("branchId", ["branchId"])
    .index("by_created", ["createdAt"]),

  assetDepreciationEntries: defineTable({
    assetId: v.id("fixedAssets"),
    depreciationDate: v.number(),
    amount: v.number(),
    bookValueBefore: v.number(),
    bookValueAfter: v.number(),
    method: v.string(),
    createdAt: v.number(),
  })
    .index("assetId", ["assetId"])
    .index("depreciationDate", ["depreciationDate"]),

  // ─── Bank Transactions (Part 5) ──────────────────────────────────
  bankTransactions: defineTable({
    bankAccountId: v.id("financeBankAccounts"),
    toBankAccountId: v.optional(v.id("financeBankAccounts")),
    transactionType: v.union(v.literal("deposit"), v.literal("withdrawal"), v.literal("transfer")),
    amount: v.number(),
    description: v.string(),
    referenceNumber: v.optional(v.string()),
    transactionDate: v.number(),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"), v.literal("reversed")),
    branchId: v.optional(v.id("orgBranches")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("bankAccountId", ["bankAccountId"])
    .index("transactionType", ["transactionType"])
    .index("status", ["status"])
    .index("transactionDate", ["transactionDate"])
    .index("by_created", ["createdAt"]),

  // ─── HR Finance (Part 8) ─────────────────────────────────────────
  hrSalaryComponents: defineTable({
    name: v.string(),
    code: v.string(),
    componentType: v.union(v.literal("earning"), v.literal("deduction"), v.literal("employer_contribution")),
    calculationType: v.union(v.literal("fixed"), v.literal("percentage"), v.literal("formula")),
    value: v.optional(v.number()),
    isTaxable: v.boolean(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("code", ["code"])
    .index("componentType", ["componentType"])
    .index("by_active", ["isActive"]),

  employeeAdvances: defineTable({
    employeeId: v.id("users"),
    amount: v.number(),
    repaidAmount: v.number(),
    balanceDue: v.number(),
    reason: v.string(),
    repaymentType: v.union(v.literal("one_time"), v.literal("installment")),
    installmentCount: v.optional(v.number()),
    installmentAmount: v.optional(v.number()),
    status: v.union(v.literal("approved"), v.literal("repaid"), v.literal("cancelled")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("employeeId", ["employeeId"])
    .index("status", ["status"])
    .index("by_created", ["createdAt"]),

  // ─── PDC / Cheque Lifecycle ────────────────────────────────────
  chequeEntries: defineTable({
    chequeRef: v.string(),
    studentId: v.optional(v.id("studentMaster")),
    invoiceId: v.optional(v.id("feeInvoices")),
    chequeNumber: v.string(),
    bankName: v.string(),
    bankBranch: v.optional(v.string()),
    chequeDate: v.number(),
    amount: v.number(),
    depositDate: v.optional(v.number()),
    status: v.union(v.literal("received"), v.literal("deposited"), v.literal("cleared"), v.literal("bounced")),
    bounceCount: v.optional(v.number()),
    bounceReason: v.optional(v.string()),
    bounceDate: v.optional(v.number()),
    bounceRecordedBy: v.optional(v.id("users")),
    clearanceDate: v.optional(v.number()),
    depositedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("studentId", ["studentId"])
    .index("status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_updated", ["updatedAt"]),

  penaltyEntries: defineTable({
    chequeId: v.id("chequeEntries"),
    studentId: v.optional(v.id("studentMaster")),
    invoiceId: v.optional(v.id("feeInvoices")),
    amount: v.number(),
    reason: v.string(),
    status: v.union(v.literal("pending"), v.literal("waived"), v.literal("collected")),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("chequeId", ["chequeId"])
    .index("studentId", ["studentId"])
    .index("status", ["status"])
    .index("by_created", ["createdAt"]),
};