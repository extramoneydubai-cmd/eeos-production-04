#!/usr/bin/env node
/**
 * Fix: add color, icon, description to duplicate mutation insert blocks.
 * These standard fields are required by schema but missing from many
 * duplicate mutations.
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

  // Find the duplicate mutation's insert block
  // Look for the pattern inside duplicate: ... insert("table", { ... sequence: maxSeq + 1,
  const dupPattern = /return ctx\.db\.insert\("[^"]+", \{\n([\s\S]*?)\n\s+}\);(\n  },\n\}\);)/;
  const match = content.match(dupPattern);
  
  if (!match) {
    console.log(`  SKIP ${file}: duplicate insert block not found`);
    continue;
  }

  const insertBlock = match[1];
  
  // Check which fields are missing
  const lines = insertBlock.split("\n");
  
  // Build new lines with missing fields inserted before sequence:
  const newLines = [];
  let added = false;
  const fieldsToAdd = [];
  
  if (!insertBlock.includes("color:")) fieldsToAdd.push("color: source.color,");
  if (!insertBlock.includes("icon:")) fieldsToAdd.push("icon: source.icon,");
  if (!insertBlock.includes("description:")) fieldsToAdd.push("description: source.description,");
  
  if (fieldsToAdd.length === 0) {
    console.log(`  OK ${file}: all standard fields present`);
    continue;
  }

  for (const line of lines) {
    // Insert missing fields right before the sequence line
    if (line.trim().startsWith("sequence:")) {
      for (const field of fieldsToAdd) {
        newLines.push(`      ${field}`);
      }
      added = true;
    }
    newLines.push(line);
  }
  
  if (!added) {
    console.log(`  WARN ${file}: no sequence: line found`);
    continue;
  }

  const newInsertBlock = newLines.join("\n");
  content = content.replace(insertBlock, newInsertBlock);
  
  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    console.log(`✓ Fixed ${file}: added [${fieldsToAdd.map(f => f.split(":")[0]).join(", ")}]`);
    fixedCount++;
  } else {
    console.log(`  NOCHANGE ${file}`);
  }
}

console.log(`\nFixed ${fixedCount}/${FILES.length} files`);
