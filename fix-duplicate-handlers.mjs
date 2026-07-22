#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = '/home/daytona/codebase';

const files = [
  'hrEmployeeCategories', 'hrWorkLocations', 'hrSkills', 'hrExperienceLevels', 'hrDocumentTypes',
  'financePaymentModes', 'financeBankAccounts', 'financeTaxTypes', 'financeGstRates',
  'financeExpenseCategories', 'financeIncomeCategories', 'financeFeeCategories', 'financeDiscountCategories',
  'financeCurrencies', 'financeFinancialYears',
  'academicClassrooms', 'crmIndustries',
  'salesPaymentStatuses', 'salesInvoiceTypes', 'salesTaxSlabs',
  'commNotificationTypes', 'commEmailTemplates', 'commSmsTemplates', 'commWhatsAppTemplates',
];

// Pattern: the duplicate handler has "return ctx.db.insert(\"tableName\", {" followed by individual field assignments
// We need to replace the entire body with a spread-based approach

let fixed = 0;
for (const file of files) {
  const fp = path.join(ROOT, 'src/convex', `${file}.ts`);
  if (!fs.existsSync(fp)) { console.log(`  - ${file} not found`); continue; }
  
  let content = fs.readFileSync(fp, 'utf8');
  
  // Find the duplicate handler - it has: name: `${source.name} (Copy)`,
  const dupMarker = 'name: `${source.name} (Copy)`,';
  if (!content.includes(dupMarker)) {
    console.log(`  ? ${file}: duplicate pattern not found`);
    continue;
  }
  
  // Replace the entire duplicate handler body from "return ctx.db.insert" to the closing "});"
  // We need to find the exact duplicate handler and replace it
  
  // Strategy: Find "return ctx.db.insert(\"$TABLE\", {" and replace with spread pattern
  // The table name is the file name (in camelCase)
  
  // Find all occurrences of the insert in duplicate handler
  const tableName = file.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  
  // Find the duplicate handler: it starts after "duplicate = mutation({" and contains "return ctx.db.insert"
  // Let's find the line starting with "return ctx.db.insert"
  const insertPattern = new RegExp(`return ctx\\.db\\.insert\\("([^"]+)"\\s*,\\s*\\{`);
  let match;
  let lastIndex = 0;
  let dupInsertStart = -1;
  let dupInsertEnd = -1;
  
  while ((match = insertPattern.exec(content)) !== null) {
    const idx = match.index;
    // Check if this is in the duplicate handler (after "source = await ctx.db.get")
    const beforeText = content.substring(Math.max(0, idx - 200), idx);
    if (beforeText.includes('source = await ctx.db.get') && beforeText.includes('duplicate')) {
      dupInsertStart = idx;
      // Find the end - the closing "});"
      const afterInsert = content.substring(idx);
      let depth = 0;
      let found = false;
      for (let i = 0; i < afterInsert.length; i++) {
        if (afterInsert[i] === '{') depth++;
        else if (afterInsert[i] === '}') depth--;
        if (depth === 0 && afterInsert[i] === ')' && afterInsert[i+1] === ';') {
          dupInsertEnd = idx + i + 2;
          found = true;
          break;
        }
      }
      if (found) break;
    }
    lastIndex = match.index + 1;
  }
  
  if (dupInsertStart < 0 || dupInsertEnd < 0) {
    console.log(`  ? ${file}: could not find duplicate insert range`);
    continue;
  }
  
  // Get the table name from the insert
  const tableMatch = content.substring(dupInsertStart).match(/insert\("([^"]+)"/);
  const tbl = tableMatch ? tableMatch[1] : file;
  
  // Replace with spread-based handler
  const newInsert = `return ctx.db.insert("${tbl}", {
      ...source,
      name: \`\${source.name} (Copy)\`,
      code: \`\${source.code}_COPY\`,
      sequence: maxSeq + 1,
      active: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });`;
  
  content = content.substring(0, dupInsertStart) + newInsert + content.substring(dupInsertEnd);
  fs.writeFileSync(fp, content);
  fixed++;
  console.log(`  ✓ Fixed ${file}.ts duplicate handler`);
}

console.log(`\n✅ Fixed ${fixed}/${files.length} files`);
