#!/usr/bin/env node
/**
 * COMPREHENSIVE FIX: Restore all corrupted MasterData imports
 * 
 * Problem: fix-imports.mjs regex was too greedy and captured
 * `import { api } from "@/convex/_generated/api"` and
 * `import { Input } from "@/components/ui/input"` into the lucide-react import.
 * 
 * Fix: Rebuild the correct import structure for each file.
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
  const lines = content.split('\n');

  // Find the corrupted lucide-react import line (contains both "api" and "lucide-react")
  let importIdx = -1;
  let importEndIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('import {') && (lines[i].includes('lucide-react') || lines[i + 1]?.includes('lucide-react'))) {
      importIdx = i;
      // Find the end of the multi-line import
      for (let j = i; j < lines.length; j++) {
        if (lines[j].includes('} from "lucide-react"') || lines[j].includes("} from 'lucide-react'")) {
          importEndIdx = j;
          break;
        }
      }
      break;
    }
  }

  if (importIdx === -1 || importEndIdx === -1) {
    console.log(`  ? ${file}: could not find lucide-react import`);
    continue;
  }

  // Extract all icon names from the import block
  const importBlock = lines.slice(importIdx, importEndIdx + 1).join('\n');
  const iconMatch = importBlock.match(/\{([\s\S]*?)\}/);
  if (!iconMatch) {
    console.log(`  ? ${file}: could not parse import content`);
    continue;
  }

  const allNames = iconMatch[1].split(',').map(s => s.trim()).filter(Boolean);
  
  // Separate 'api' from actual lucide icons
  const apiName = allNames.filter(n => n === 'api');
  const lucideIcons = allNames.filter(n => n !== 'api');
  
  // Remove duplicates from lucide icons
  const seen = new Set();
  const uniqueIcons = lucideIcons.filter(icon => {
    const lower = icon.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });

  // Check if the file already has the api import separately
  const hasApiImport = content.includes('import { api } from "@/convex/_generated/api"');
  const hasInputImport = content.includes('import { Input } from "@/components/ui/input"');

  // Build new lines
  const newLines = lines.slice(0, importIdx);

  // Add imports in correct order
  newLines.push('import { api } from "@/convex/_generated/api";');
  newLines.push('import { Input } from "@/components/ui/input";');
  newLines.push('import {');
  newLines.push(`  ${uniqueIcons.join(',\n  ')},`);
  newLines.push('} from "lucide-react";');

  // Add the rest of the file after the import block
  newLines.push(...lines.slice(importEndIdx + 1));

  const newContent = newLines.join('\n');
  fs.writeFileSync(fp, newContent, 'utf8');
  
  const removedDupes = lucideIcons.length - uniqueIcons.length;
  console.log(`  ✓ ${file}: restored imports (${uniqueIcons.length} unique lucide icons${removedDupes > 0 ? `, removed ${removedDupes} dupes` : ''})`);
}

console.log('\n✅ All imports restored');
