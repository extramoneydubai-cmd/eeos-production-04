#!/usr/bin/env node
/**
 * Fix all ICON_OPTIONS entries that use string literals for 'icon'
 * (e.g., icon: 'BadgeCheck') to use component references (e.g., icon: BadgeCheck)
 * 
 * This fixes React crashes: "Objects are not valid as a React child"
 * when trying to render a string as a component.
 */

import fs from 'fs';

const files = [
  'MasterDataBankAccounts.tsx',
  'MasterDataClassrooms.tsx',
  'MasterDataCurrencies.tsx',
  'MasterDataDiscountCategories.tsx',
  'MasterDataDocumentTypes.tsx',
  'MasterDataEmailTemplates.tsx',
  'MasterDataEmployeeCategories.tsx',
  'MasterDataExpenseCategories.tsx',
  'MasterDataExperienceLevels.tsx',
  'MasterDataFeeCategories.tsx',
  'MasterDataFinancialYears.tsx',
  'MasterDataGstRates.tsx',
  'MasterDataIncomeCategories.tsx',
  'MasterDataIndustries.tsx',
  'MasterDataInvoiceTypes.tsx',
  'MasterDataNotificationTypes.tsx',
  'MasterDataPaymentModes.tsx',
  'MasterDataPaymentStatuses.tsx',
  'MasterDataSalesOpportunityTypes.tsx',
  'MasterDataSalesQuotationStatuses.tsx',
  'MasterDataSkills.tsx',
  'MasterDataSmsTemplates.tsx',
  'MasterDataTaxSlabs.tsx',
  'MasterDataTaxTypes.tsx',
  'MasterDataWhatsAppTemplates.tsx',
];

let fixedCount = 0;

for (const file of files) {
  const fp = `src/pages/studios/${file}`;
  if (!fs.existsSync(fp)) {
    console.log(`  - ${file} not found, skipping`);
    continue;
  }

  let content = fs.readFileSync(fp, 'utf8');
  
  // Replace icon: 'SomeName' with icon: SomeName (only within ICON_OPTIONS)
  const before = content;
  content = content.replace(/icon:\s*'(\w+)'/g, "icon: $1");
  
  if (content !== before) {
    fs.writeFileSync(fp, content, 'utf8');
    console.log(`  ✓ Fixed ${file}`);
    fixedCount++;
  } else {
    console.log(`  ? ${file}: no changes needed`);
  }
}

console.log(`\n✅ Fixed ${fixedCount} files`);
