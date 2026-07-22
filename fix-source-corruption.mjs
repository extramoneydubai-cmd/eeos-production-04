#!/usr/bin/env node
/**
 * Fix source.xxx corruption in MasterData files.
 *
 * The previous fix script incorrectly replaced args fields in create mutation
 * handlers with source.xxx references, where 'source' is not in scope.
 * 
 * The fix: remove the source.xxx lines from the create mutation's insert block,
 * since ...args already spreads all those fields.
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

let fixedCount = 0;

for (const file of FILES) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;

  // Pattern: look for lines like "xxx: source.xxx," inside the create mutation insert block
  // These are between "return ctx.db.insert(\"tableName\", {" and the line "sequence: maxSeq + 1,"
  // Remove any line that references source.xxx (for field mappings that are already covered by ...args)
  
  // Remove lines like "xxx: source.xxx," where source is not in scope in create handler
  // These appear after "...args," and before "sequence: maxSeq + 1,"
  content = content.replace(
    /(return ctx\.db\.insert\("[^"]+", \{\n\s+\.\.\.args,\n\s+description: args\.description \?\? "",)\n(\s+\w+: source\.\w+,)*\n(\s+\w+: source\.\w+,)?/g,
    "$1"
  );

  // Also catch cases where there's no description line
  content = content.replace(
    /(\s+description: args\.description \?\? "",)\n(\s+\w+: source\.\w+,)/g,
    "$1"
  );

  // Also handle patterns where there might be multiple source lines in a row
  content = content.replace(
    /(\s+\w+: source\.\w+,)\n(\s+\w+: source\.\w+,)/g,
    "" // remove them entirely
  );
  content = content.replace(
    /(\s+\w+: source\.\w+,)\n/g,
    "" // remove standalone source lines
  );

  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    console.log(`✓ Fixed: ${file}`);
    fixedCount++;
  } else {
    console.log(`  Skipped (no change): ${file}`);
  }
}

console.log(`\nFixed ${fixedCount}/${FILES.length} files`);
