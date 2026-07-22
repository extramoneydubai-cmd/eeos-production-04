#!/usr/bin/env node
/**
 * Fix duplicate mutations missing standard fields: color, icon, description.
 * These are present in the schema but were not added by the previous fix.
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
  const dupMatch = content.match(/export const duplicate = mutation\(\{[\s\S]*?return ctx\.db\.insert\("[^"]+", \{\n([\s\S]*?)\n\s{4,6}\);\n\s+},\n\}\);/);
  if (!dupMatch) {
    console.log(`  Could not find duplicate mutation in ${file}`);
    continue;
  }

  const insertBlock = dupMatch[1];
  
  // Check which fields are missing
  const hasColor = /\bcolor:/.test(insertBlock);
  const hasIcon = /\bicon:/.test(insertBlock);
  const hasDescription = /\bdescription:/.test(insertBlock);
  
  let newBlock = insertBlock;
  
  // Add missing fields after "code:"
  const missingLines = [];
  if (!hasColor) missingLines.push("      color: source.color,");
  if (!hasIcon) missingLines.push("      icon: source.icon,");
  if (!hasDescription) missingLines.push("      description: source.description,");
  
  if (missingLines.length === 0) {
    console.log(`  ${file}: nothing missing`);
    continue;
  }
  
  // Insert after the last code line (code: `...` or code: source.code with _COPY)
  const codeLineMatch = newBlock.match(/^( *code:.*)$/m);
  if (codeLineMatch) {
    const insertPoint = codeLineMatch.index + codeLineMatch[0].length;
    const before = newBlock.substring(0, insertPoint);
    const after = newBlock.substring(insertPoint);
    newBlock = before + "\n" + missingLines.join("\n") + after;
  } else {
    // Insert after "name:" line if no code line found
    const nameLineMatch = newBlock.match(/^( *name:.*)$/m);
    if (nameLineMatch) {
      const insertPoint = nameLineMatch.index + nameLineMatch[0].length;
      const before = newBlock.substring(0, insertPoint);
      const after = newBlock.substring(insertPoint);
      newBlock = before + "\n" + missingLines.join("\n") + after;
    }
  }
  
  content = content.replace(insertBlock, newBlock);
  
  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    console.log(`✓ Fixed ${file}: added [${missingLines.map(l => l.trim().split(":")[0]).join(", ")}]`);
    fixedCount++;
  } else {
    console.log(`  ${file}: no change`);
  }
}

console.log(`\nFixed ${fixedCount}/${FILES.length} files`);
