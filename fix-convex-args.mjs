#!/usr/bin/env node
/**
 * Fix all generated Convex backend files to include extra schema fields
 */
import fs from 'fs';
import path from 'path';

const ROOT = '/home/daytona/codebase';

const FIXES = [
  // { file, createArgs, updateArgs, seedExtras }
  {
    file: 'hrWorkLocations',
    createArgs: `locationType: v.string(),\n    city: v.string(),\n    country: v.string(),`,
    updateArgs: `locationType: v.optional(v.string()),\n    city: v.optional(v.string()),\n    country: v.optional(v.string()),`,
  },
  {
    file: 'hrSkills',
    createArgs: `skillCategory: v.string(),`,
    updateArgs: `skillCategory: v.optional(v.string()),`,
  },
  {
    file: 'hrExperienceLevels',
    createArgs: `minYears: v.number(),\n    maxYears: v.optional(v.number()),`,
    updateArgs: `minYears: v.optional(v.number()),\n    maxYears: v.optional(v.number()),`,
  },
  {
    file: 'hrDocumentTypes',
    createArgs: `documentCategory: v.string(),\n    isMandatory: v.boolean(),`,
    updateArgs: `documentCategory: v.optional(v.string()),\n    isMandatory: v.optional(v.boolean()),`,
  },
  {
    file: 'financePaymentModes',
    createArgs: `modeCategory: v.string(),\n    isDigital: v.boolean(),`,
    updateArgs: `modeCategory: v.optional(v.string()),\n    isDigital: v.optional(v.boolean()),`,
  },
  {
    file: 'financeBankAccounts',
    createArgs: `bankName: v.string(),\n    accountNumber: v.string(),\n    branchName: v.optional(v.string()),\n    ifscCode: v.optional(v.string()),\n    swiftCode: v.optional(v.string()),\n    accountType: v.string(),\n    isDefault: v.boolean(),`,
    updateArgs: `bankName: v.optional(v.string()),\n    accountNumber: v.optional(v.string()),\n    branchName: v.optional(v.string()),\n    ifscCode: v.optional(v.string()),\n    swiftCode: v.optional(v.string()),\n    accountType: v.optional(v.string()),\n    isDefault: v.optional(v.boolean()),`,
  },
  {
    file: 'financeTaxTypes',
    createArgs: `taxCategory: v.string(),\n    taxRate: v.number(),\n    isCompound: v.boolean(),`,
    updateArgs: `taxCategory: v.optional(v.string()),\n    taxRate: v.optional(v.number()),\n    isCompound: v.optional(v.boolean()),`,
  },
  {
    file: 'financeGstRates',
    createArgs: `gstType: v.string(),\n    cgstRate: v.number(),\n    sgstRate: v.number(),\n    igstRate: v.optional(v.number()),\n    totalRate: v.number(),`,
    updateArgs: `gstType: v.optional(v.string()),\n    cgstRate: v.optional(v.number()),\n    sgstRate: v.optional(v.number()),\n    igstRate: v.optional(v.number()),\n    totalRate: v.optional(v.number()),`,
  },
  {
    file: 'financeExpenseCategories',
    createArgs: `expenseType: v.string(),\n    budgetable: v.boolean(),`,
    updateArgs: `expenseType: v.optional(v.string()),\n    budgetable: v.optional(v.boolean()),`,
  },
  {
    file: 'financeIncomeCategories',
    createArgs: `incomeType: v.string(),\n    isTaxable: v.boolean(),`,
    updateArgs: `incomeType: v.optional(v.string()),\n    isTaxable: v.optional(v.boolean()),`,
  },
  {
    file: 'financeFeeCategories',
    createArgs: `feeType: v.string(),\n    isRecurring: v.boolean(),\n    isOptional: v.boolean(),\n    isRefundable: v.boolean(),`,
    updateArgs: `feeType: v.optional(v.string()),\n    isRecurring: v.optional(v.boolean()),\n    isOptional: v.optional(v.boolean()),\n    isRefundable: v.optional(v.boolean()),`,
  },
  {
    file: 'financeDiscountCategories',
    createArgs: `discountType: v.string(),\n    isPercentage: v.boolean(),\n    maxValue: v.optional(v.number()),`,
    updateArgs: `discountType: v.optional(v.string()),\n    isPercentage: v.optional(v.boolean()),\n    maxValue: v.optional(v.number()),`,
  },
  {
    file: 'financeCurrencies',
    createArgs: `symbol: v.string(),\n    isoCode: v.string(),\n    isBase: v.boolean(),\n    exchangeRate: v.optional(v.number()),\n    decimalPlaces: v.number(),`,
    updateArgs: `symbol: v.optional(v.string()),\n    isoCode: v.optional(v.string()),\n    isBase: v.optional(v.boolean()),\n    exchangeRate: v.optional(v.number()),\n    decimalPlaces: v.optional(v.number()),`,
  },
  {
    file: 'financeFinancialYears',
    createArgs: `startDate: v.number(),\n    endDate: v.number(),\n    isCurrent: v.boolean(),\n    isClosed: v.boolean(),`,
    updateArgs: `startDate: v.optional(v.number()),\n    endDate: v.optional(v.number()),\n    isCurrent: v.optional(v.boolean()),\n    isClosed: v.optional(v.boolean()),`,
  },
  {
    file: 'academicClassrooms',
    createArgs: `building: v.optional(v.string()),\n    floor: v.optional(v.number()),\n    roomNumber: v.optional(v.string()),\n    capacity: v.optional(v.number()),\n    hasMultimedia: v.boolean(),\n    hasAirConditioning: v.boolean(),`,
    updateArgs: `building: v.optional(v.string()),\n    floor: v.optional(v.number()),\n    roomNumber: v.optional(v.string()),\n    capacity: v.optional(v.number()),\n    hasMultimedia: v.optional(v.boolean()),\n    hasAirConditioning: v.optional(v.boolean()),`,
  },
  {
    file: 'crmIndustries',
    createArgs: `sector: v.string(),`,
    updateArgs: `sector: v.optional(v.string()),`,
  },
  {
    file: 'salesPaymentStatuses',
    createArgs: `statusCategory: v.optional(v.string()),`,
    updateArgs: `statusCategory: v.optional(v.string()),`,
  },
  {
    file: 'salesInvoiceTypes',
    createArgs: `invoiceCategory: v.optional(v.string()),`,
    updateArgs: `invoiceCategory: v.optional(v.string()),`,
  },
  {
    file: 'salesTaxSlabs',
    createArgs: `slabType: v.optional(v.string()),\n    fromAmount: v.optional(v.number()),\n    toAmount: v.optional(v.number()),\n    taxRate: v.number(),`,
    updateArgs: `slabType: v.optional(v.string()),\n    fromAmount: v.optional(v.number()),\n    toAmount: v.optional(v.number()),\n    taxRate: v.optional(v.number()),`,
  },
  {
    file: 'commNotificationTypes',
    createArgs: `channelType: v.string(),`,
    updateArgs: `channelType: v.optional(v.string()),`,
  },
  {
    file: 'commEmailTemplates',
    createArgs: `templateCategory: v.string(),\n    subject: v.string(),\n    bodyPreview: v.optional(v.string()),`,
    updateArgs: `templateCategory: v.optional(v.string()),\n    subject: v.optional(v.string()),\n    bodyPreview: v.optional(v.string()),`,
  },
  {
    file: 'commSmsTemplates',
    createArgs: `templateCategory: v.string(),\n    bodyPreview: v.optional(v.string()),`,
    updateArgs: `templateCategory: v.optional(v.string()),\n    bodyPreview: v.optional(v.string()),`,
  },
  {
    file: 'commWhatsAppTemplates',
    createArgs: `templateCategory: v.string(),\n    bodyPreview: v.optional(v.string()),`,
    updateArgs: `templateCategory: v.optional(v.string()),\n    bodyPreview: v.optional(v.string()),`,
  },
];

let fixed = 0;
for (const f of FIXES) {
  const fp = path.join(ROOT, 'src/convex', `${f.file}.ts`);
  if (!fs.existsSync(fp)) { console.log(`  ⚠ ${f.file}.ts not found`); continue; }
  
  let content = fs.readFileSync(fp, 'utf8');
  
  // Fix 'create' function: add extra fields after 'description: v.optional(v.string()),'
  const createMarker = 'description: v.optional(v.string()),';
  if (content.includes(createMarker) && !content.includes(f.createArgs.substring(0, 20))) {
    content = content.replace(createMarker, createMarker + '\n    ' + f.createArgs);
  }
  
  // Fix 'update' function: add extra optional fields
  const updateMarker = 'description: v.optional(v.string()),';
  if (content.includes(updateMarker) && content.includes('handler: async (ctx, args) => {')) {
    // Count occurrences - there are 2 (create + update). We want to replace the second one (update)
    const idx1 = content.indexOf(updateMarker);
    const idx2 = content.indexOf(updateMarker, idx1 + 1);
    if (idx2 > 0 && !content.includes(f.updateArgs.substring(0, 20))) {
      content = content.substring(0, idx2) + updateMarker + '\n    ' + f.updateArgs + content.substring(idx2 + updateMarker.length);
    }
  }
  
  // Fix 'salesTaxSlabs' special case - already has statusCategory, needs slabType/fromAmount/toAmount/taxRate
  // Already handled by the generic approach above
  
  fs.writeFileSync(fp, content);
  fixed++;
  console.log(`  ✓ Fixed ${f.file}.ts`);
}

console.log(`\n✅ Fixed ${fixed}/${FIXES.length} Convex backend files`);
