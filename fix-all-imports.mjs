#!/usr/bin/env node
/**
 * Fix corrupted imports in all MasterData files.
 * 
 * Current state (corrupted):
 *   import MasterDataTable, { formatDate } from "...";
 *   import {
 *     api,
 *     BadgeCheck,
 *     ...
 *   } from "lucide-react";;
 * 
 * Desired state:
 *   import MasterDataTable, { formatDate } from "...";
 *   import { api } from "@/convex/_generated/api";
 *   import { Input } from "@/components/ui/input";
 *   import {
 *     BadgeCheck,
 *     ...
 *   } from "lucide-react";
 */
import fs from 'fs';

const files = [
  'MasterDataBankAccounts.tsx', 'MasterDataClassrooms.tsx',
  'MasterDataCurrencies.tsx', 'MasterDataDiscountCategories.tsx',
  'MasterDataDocumentTypes.tsx', 'MasterDataEmailTemplates.tsx',
  'MasterDataEmployeeCategories.tsx', 'MasterDataExpenseCategories.tsx',
  'MasterDataExperienceLevels.tsx', 'MasterDataFeeCategories.tsx',
  'MasterDataFinancialYears.tsx', 'MasterDataGstRates.tsx',
  'MasterDataIncomeCategories.tsx', 'MasterDataIndustries.tsx',
  'MasterDataInvoiceTypes.tsx', 'MasterDataNotificationTypes.tsx',
  'MasterDataPaymentModes.tsx', 'MasterDataPaymentStatuses.tsx',
  'MasterDataSalesOpportunityTypes.tsx', 'MasterDataSalesQuotationStatuses.tsx',
  'MasterDataSkills.tsx', 'MasterDataSmsTemplates.tsx',
  'MasterDataTaxSlabs.tsx', 'MasterDataTaxTypes.tsx',
  'MasterDataWhatsAppTemplates.tsx', 'MasterDataWorkLocations.tsx',
];

for (const file of files) {
  const fp = `src/pages/studios/${file}`;
  if (!fs.existsSync(fp)) {
    console.log(`  - ${file} not found`);
    continue;
  }

  let content = fs.readFileSync(fp, 'utf8');

  // Step 1: Fix the corrupted lucide-react import
  // Find the block: import {\n  api,\n  ...icons\n} from "lucide-react"
  const lucideRegex = /import\s*\{([\s\S]*?)\}\s*from\s*["']lucide-react["']\s*;/;
  const match = content.match(lucideRegex);

  if (!match) {
    console.log(`  ? ${file}: could not find lucide-react import`);
    continue;
  }

  const iconBlock = match[1];
  const icons = iconBlock.split(',').map(s => s.trim()).filter(Boolean);
  
  // Separate 'api' from actual lucide icons
  const otherIcons = icons.filter(n => n !== 'api');
  const hasApi = icons.includes('api');
  
  // Remove duplicates
  const seen = new Set();
  const uniqueIcons = otherIcons.filter(icon => {
    const lower = icon.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });

  // Build the corrected import block
  let newImportBlock = `import { api } from "@/convex/_generated/api";\nimport { Input } from "@/components/ui/input";\nimport {\n  ${uniqueIcons.join(',\n  ')},\n} from "lucide-react";`;

  // Replace the old import
  content = content.replace(match[0], newImportBlock);

  // Step 2: Fix double semicolons left from the previous corruption
  content = content.replace(/;;/g, ';');

  // Step 3: Remove any duplicate api/Input imports that were left behind
  // Remove extra 'import { api }' lines that might remain
  const lines = content.split('\n');
  const filteredLines = [];
  let apiSeen = false;
  let inputSeen = false;

  for (const line of lines) {
    if (line.includes('import { api } from "@/convex/_generated/api"')) {
      if (apiSeen) continue; // Skip duplicate
      apiSeen = true;
    }
    if (line.includes('import { Input } from "@/components/ui/input"')) {
      if (inputSeen) continue; // Skip duplicate
      inputSeen = true;
    }
    filteredLines.push(line);
  }

  content = filteredLines.join('\n');

  fs.writeFileSync(fp, content, 'utf8');
  console.log(`  ✓ ${file}: fixed (${uniqueIcons.length} lucide icons)`);
}

console.log('\n✅ All imports fixed');
