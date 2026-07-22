#!/usr/bin/env node
/**
 * Fix: Remove source.xxx lines from CREATE mutations.
 * These were mistakenly added by fix2.mjs which targeted
 * the wrong insert block (the create mutation instead of duplicate).
 */

import fs from "fs";

const FILES = [
  "src/convex/commSmsTemplates.ts",
  "src/convex/commWhatsAppTemplates.ts",
  "src/convex/crmIndustries.ts",
  "src/convex/financeBankAccounts.ts",
  "src/convex/financeCurrencies.ts",
  "src/convex/financeDiscountCategories.ts",
  "src/convex/financeExpenseCategories.ts",
  "src/convex/financeFeeCategories.ts",
  "src/convex/financeFinancialYears.ts",
  "src/convex/financeGstRates.ts",
  "src/convex/financeIncomeCategories.ts",
  "src/convex/financePaymentModes.ts",
  "src/convex/financeTaxTypes.ts",
  "src/convex/hrDocumentTypes.ts",
  "src/convex/hrExperienceLevels.ts",
  "src/convex/hrSkills.ts",
  "src/convex/hrWorkLocations.ts",
  "src/convex/salesTaxSlabs.ts",
];

let fixedCount = 0;

for (const file of FILES) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;

  // Find the CREATE mutation handler - pattern: "handler: async (ctx, args) => {"
  // then find the return ctx.db.insert inside it (but NOT inside the duplicate mutation)
  
  // Split on "export const create = mutation({" to isolate the create mutation block
  const parts = content.split("export const create = mutation({");
  if (parts.length < 2) {
    console.log(`  SKIP ${file}: create mutation not found`);
    continue;
  }
  
  // Get the create mutation section (between "create" and the next "export const")
  let createSection = parts[1];
  const nextExportIdx = createSection.search(/export const /);
  if (nextExportIdx > 0) {
    createSection = createSection.substring(0, nextExportIdx);
  }
  
  const fixedSection = createSection.replace(/^\s+\w+: source\.\w+,$/gm, "");
  
  if (fixedSection === createSection) {
    console.log(`  OK ${file}: no source.xxx in create mutation`);
    continue;
  }
  
  // Replace the create section with the fixed one
  content = content.replace(createSection, fixedSection);
  
  fs.writeFileSync(file, content, "utf8");
  console.log(`✓ Fixed ${file}: removed source.xxx from create mutation`);
  fixedCount++;
}

console.log(`\nFixed ${fixedCount}/${FILES.length} files`);
