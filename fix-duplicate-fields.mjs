#!/usr/bin/env node
/**
 * Fix duplicate mutations missing required schema fields.
 * The duplicate mutation should copy all data fields from source,
 * not just name/code.
 */

import fs from "fs";

const FILES = [
  "src/convex/financeBankAccounts.ts",
  "src/convex/financeCurrencies.ts",
  "src/convex/financeGstRates.ts",
  "src/convex/financeFeeCategories.ts",
  "src/convex/financeFinancialYears.ts",
  "src/convex/salesTaxSlabs.ts",
  "src/convex/financeDiscountCategories.ts",
  "src/convex/hrEmployeeCategories.ts",
  "src/convex/hrWorkLocations.ts",
  "src/convex/financeTaxTypes.ts",
  "src/convex/commSmsTemplates.ts",
  "src/convex/commWhatsAppTemplates.ts",
  "src/convex/financeExpenseCategories.ts",
  "src/convex/financeIncomeCategories.ts",
  "src/convex/financePaymentModes.ts",
  "src/convex/hrDocumentTypes.ts",
  "src/convex/hrExperienceLevels.ts",
  "src/convex/crmIndustries.ts",
  "src/convex/hrSkills.ts",
];

/**
 * Extract field names from the create mutation's args block.
 * Returns the set of custom field names (excluding standard system fields).
 */
function getCreateArgsFields(content) {
  // Find the create mutation args block
  const match = content.match(/export const create = mutation\(\{\n\s+args: \{\n([\s\S]*?)\n\s+},\n\s+handler:/);
  if (!match) return { allFields: [], customFields: [] };
  
  const argsBlock = match[1];
  const fieldRegex = /(\w+): v\.(string|number|boolean|optional)/g;
  const allFields = [];
  let m;
  while ((m = fieldRegex.exec(argsBlock)) !== null) {
    allFields.push(m[1]);
  }
  
  const standardFields = new Set(["name", "code", "color", "icon", "description", "sequence", "active", "createdAt", "updatedAt"]);
  const customFields = allFields.filter(f => !standardFields.has(f));
  
  return { allFields, customFields };
}

/**
 * Get fields currently set in the duplicate mutation's insert block.
 */
function getDuplicateFields(content) {
  // Find the insert block inside duplicate mutation
  const match = content.match(/export const duplicate = mutation\(\{[\s\S]*?return ctx\.db\.insert\("[^"]+", \{\n([\s\S]*?)\n\s+\}\);\n\s+},\n\}\);/);
  if (!match) return [];
  
  const block = match[1];
  const fieldRegex = /(\w+):/g;
  const fields = [];
  let m;
  while ((m = fieldRegex.exec(block)) !== null) {
    fields.push(m[1]);
  }
  return fields;
}

let fixedCount = 0;

for (const file of FILES) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;
  
  const { customFields } = getCreateArgsFields(content);
  
  if (customFields.length === 0) {
    console.log(`  Skipped (no custom fields): ${file}`);
    continue;
  }
  
  const dupFields = getDuplicateFields(content);
  
  // Find missing custom fields in duplicate mutation
  const missingFields = customFields.filter(f => !dupFields.includes(f));
  
  if (missingFields.length === 0) {
    console.log(`  ${file}: No missing fields`);
    continue;
  }
  
  // Build the fix: add missing fields after "code: `${source.code}_COPY`,"
  const fixLines = missingFields.map(f => `      ${f}: source.${f},`).join("\n");
  
  // Insert missing fields after the code line in the duplicate mutation
  content = content.replace(
    /(code: `\$\{source\.code}_COPY`,)/,
    `$1\n${fixLines}`
  );
  
  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    console.log(`✓ Fixed ${file}: added [${missingFields.join(", ")}]`);
    fixedCount++;
  }
}

console.log(`\nFixed ${fixedCount}/${FILES.length} files`);
