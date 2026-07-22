#!/usr/bin/env node
/**
 * Fix all duplicate mutations in MasterData convex files
 * that are missing required schema fields.
 */
import fs from "fs";

const files = [
  "commSmsTemplates", "commWhatsAppTemplates", "crmIndustries",
  "financeBankAccounts", "financeCurrencies", "financeDiscountCategories",
  "financeExpenseCategories", "financeFeeCategories", "financeFinancialYears",
  "financeGstRates", "financeIncomeCategories", "financePaymentModes",
  "financeTaxTypes", "hrDocumentTypes", "hrEmployeeCategories",
  "hrExperienceLevels", "hrSkills", "hrWorkLocations", "salesTaxSlabs",
];

// Required extra fields for each file (beyond the base: name, code, color, icon, description, sequence, active)
const EXTRA_FIELDS = {
  commSmsTemplates: ["templateCategory", "bodyPreview"],
  commWhatsAppTemplates: ["templateCategory", "bodyPreview"],
  crmIndustries: ["sector"],
  financeBankAccounts: ["bankName", "accountNumber", "branchName", "ifscCode", "swiftCode", "accountType", "isDefault"],
  financeCurrencies: ["symbol", "isoCode", "isBase", "exchangeRate", "decimalPlaces"],
  financeDiscountCategories: ["discountType", "isPercentage", "maxValue"],
  financeExpenseCategories: ["expenseType", "budgetable"],
  financeFeeCategories: ["feeType", "isRecurring", "isOptional", "isRefundable"],
  financeFinancialYears: ["startDate", "endDate", "isCurrent", "isClosed"],
  financeGstRates: ["gstType", "cgstRate", "sgstRate", "igstRate", "totalRate"],
  financeIncomeCategories: ["incomeType", "isTaxable"],
  financePaymentModes: ["modeCategory", "isDigital"],
  financeTaxTypes: ["taxCategory", "taxRate", "isCompound"],
  hrDocumentTypes: ["documentCategory", "isMandatory"],
  hrEmployeeCategories: ["employeeType", "employmentStatus"],
  hrExperienceLevels: ["minYears", "maxYears"],
  hrSkills: ["skillCategory"],
  hrWorkLocations: ["locationType", "city", "country"],
  salesTaxSlabs: ["slabType", "fromAmount", "toAmount", "taxRate"],
};

let fixed = 0;
for (const file of files) {
  const fp = `src/convex/${file}.ts`;
  if (!fs.existsSync(fp)) {
    console.log(`  - ${file}.ts not found`);
    continue;
  }
  
  let content = fs.readFileSync(fp, "utf8");
  const extraFields = EXTRA_FIELDS[file];
  if (!extraFields) {
    console.log(`  ? ${file}.ts: no extra fields defined`);
    continue;
  }
  
  // Find the duplicate mutation insert block
  // Pattern: return ctx.db.insert("tableName", {\n      name: ...
  const insertRegex = new RegExp(`return ctx\\.db\\.insert\\("${file}"\\s*,\\s*\\{([^}]+)\\}\\s*\\)\\s*;`, "m");
  const match = content.match(insertRegex);
  
  if (!match) {
    console.log(`  ? ${file}.ts: could not find duplicate insert block`);
    continue;
  }
  
  const insertBlock = match[0];
  const insertBody = match[1];
  
  // Check which extra fields are missing
  const missingFields = extraFields.filter(f => !insertBody.includes(f + ":"));
  
  if (missingFields.length === 0) {
    console.log(`  ✓ ${file}.ts: already has all fields`);
    continue;
  }
  
  // Add missing fields before the "sequence:" line
  const fieldLines = missingFields.map(f => `      ${f}: source.${f},`).join("\n");
  
  const newInsert = insertBlock.replace(
    /(\s+sequence:)/,
    `\n${fieldLines}\n$1`
  );
  
  content = content.replace(insertBlock, newInsert);
  fs.writeFileSync(fp, content, "utf8");
  console.log(`  ✓ ${file}.ts: added ${missingFields.join(", ")}`);
  fixed++;
}

console.log(`\n✅ Fixed ${fixed} files`);
