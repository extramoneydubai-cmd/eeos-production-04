#!/usr/bin/env node
/**
 * Fix remaining "Cannot find name" errors for icons used as defaults
 * in getIconComponent() or in moduleCards that aren't in the import.
 */
import fs from 'fs';

const fixes = {
  'MasterDataEmployeeCategories.tsx': ['UserCheck'],
  'MasterDataExperienceLevels.tsx': ['TrendingUp'],
  'MasterDataFinancialYears.tsx': ['Calendar'],
  'MasterDataGstRates.tsx': ['FileSpreadsheet'],
  'MasterDataHR.tsx': ['UserCheck', 'MapPin', 'Award', 'TrendingUp', 'FileText'],
  'MasterDataInvoiceTypes.tsx': ['FileSpreadsheet'],
  'MasterDataPaymentModes.tsx': ['Wallet'],
  'MasterDataSalesOpportunityTypes.tsx': ['Target'],
  'MasterDataSkills.tsx': ['Award'],
  'MasterDataTaxSlabs.tsx': ['Layers'],
};

let fixedCount = 0;
for (const [file, missingIcons] of Object.entries(fixes)) {
  const fp = `src/pages/studios/${file}`;
  if (!fs.existsSync(fp)) {
    console.log(`  - ${file} not found`);
    continue;
  }

  let content = fs.readFileSync(fp, 'utf8');

  // Find the lucide-react import and add missing icons
  const lucideRegex = /import\s*\{([\s\S]*?)\}\s*from\s*["']lucide-react["']/;
  const match = content.match(lucideRegex);

  if (!match) {
    console.log(`  ? ${file}: could not find lucide-react import`);
    continue;
  }

  const iconBlock = match[1];
  const currentIcons = iconBlock.split(',').map(s => s.trim()).filter(Boolean);
  
  // Check which of the missing icons are actually not imported yet
  const existingNames = new Set(currentIcons.map(i => i.trim()));
  const actuallyMissing = missingIcons.filter(icon => !existingNames.has(icon));

  if (actuallyMissing.length === 0) {
    console.log(`  - ${file}: already has all needed icons`);
    continue;
  }

  // Add missing icons to the set
  const newIcons = [...currentIcons, ...actuallyMissing];
  
  // Rebuild import
  const indent = match[0].match(/^(\s*)/)[1];
  const newImport = `${indent}import {\n  ${newIcons.join(',\n  ')},\n} from "lucide-react";`;
  
  content = content.replace(match[0], newImport);
  fs.writeFileSync(fp, content, 'utf8');
  console.log(`  ✓ ${file}: added ${actuallyMissing.join(', ')}`);
  fixedCount++;
}

console.log(`\n✅ Fixed ${fixedCount} files`);
