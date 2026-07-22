#!/usr/bin/env node
/**
 * Fix missing icon imports and duplicate identifiers in MasterData files.
 * After converting icon: 'Name' to icon: Name, TypeScript now catches
 * icons that are referenced but never imported, and duplicates in imports.
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
  'MasterDataWorkLocations.tsx',
];

for (const file of files) {
  const fp = `src/pages/studios/${file}`;
  if (!fs.existsSync(fp)) {
    console.log(`  - ${file} not found`);
    continue;
  }

  let content = fs.readFileSync(fp, 'utf8');

  // Find the full lucide-react import block (multi-line)
  const importRegex = /(import\s*\{[\s\S]*?\}\s*from\s*["']lucide-react["'])/;
  const importMatch = content.match(importRegex);
  
  if (!importMatch) {
    console.log(`  ? ${file}: no lucide-react import found`);
    continue;
  }

  const fullImport = importMatch[1];

  // Extract all icon names from the import block
  const iconNamesMatch = fullImport.match(/\{([\s\S]*?)\}/);
  if (!iconNamesMatch) {
    console.log(`  ? ${file}: could not parse import block`);
    continue;
  }

  // Parse unique icon names (split by comma, trim)
  const rawIcons = iconNamesMatch[1].split(',').map(s => s.trim()).filter(Boolean);
  
  // Find duplicate imports
  const seen = new Set();
  const duplicates = [];
  const uniqueIcons = rawIcons.filter(icon => {
    const lower = icon.toLowerCase();
    if (seen.has(lower)) {
      duplicates.push(icon);
      return false;
    }
    seen.add(lower);
    return true;
  });

  // Extract all icon names used in ICON_OPTIONS
  const iconOptionMatches = content.matchAll(/icon:\s*(\w+)/g);
  const usedIcons = new Set([...iconOptionMatches].map(m => m[1]));

  // Find missing icons
  const importNames = new Set(uniqueIcons.map(i => i.trim()));
  const missingIcons = [...usedIcons].filter(icon => !importNames.has(icon));

  let changes = [];
  if (duplicates.length > 0) {
    changes.push(`removed duplicates: ${duplicates.join(', ')}`);
  }
  if (missingIcons.length > 0) {
    changes.push(`added: ${missingIcons.join(', ')}`);
  }

  if (changes.length === 0) {
    console.log(`  - ${file}: imports already correct`);
    continue;
  }

  // Build new import - add missing icons
  const allIcons = [...uniqueIcons, ...missingIcons];
  
  // Format: keep same indentation as original
  const indent = fullImport.match(/^(\s*)/)[1];
  const newImport = `${indent}import {\n  ${allIcons.join(',\n  ')},\n} from "lucide-react";`;
  
  content = content.replace(fullImport, newImport);
  fs.writeFileSync(fp, content, 'utf8');
  console.log(`  ✓ ${file}: ${changes.join('; ')}`);
}

console.log('\n✅ All import fixes applied');
