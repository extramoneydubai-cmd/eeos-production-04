#!/usr/bin/env node
/**
 * Run all seedDefault mutations sequentially
 */
// Seed hrEmployeeCategories
try {
  const result = await convexMutation("hrEmployeeCategories", "seedDefault", {});
  console.log("  ✓ hrEmployeeCategories seeded:", result?.seeded || 0);
} catch(e) { console.log("  ✗ hrEmployeeCategories error:", e.message); }

// Seed hrWorkLocations
try {
  const result = await convexMutation("hrWorkLocations", "seedDefault", {});
  console.log("  ✓ hrWorkLocations seeded:", result?.seeded || 0);
} catch(e) { console.log("  ✗ hrWorkLocations error:", e.message); }

// Seed hrSkills
try {
  const result = await convexMutation("hrSkills", "seedDefault", {});
  console.log("  ✓ hrSkills seeded:", result?.seeded || 0);
} catch(e) { console.log("  ✗ hrSkills error:", e.message); }

// Seed hrExperienceLevels
try {
  const result = await convexMutation("hrExperienceLevels", "seedDefault", {});
  console.log("  ✓ hrExperienceLevels seeded:", result?.seeded || 0);
} catch(e) { console.log("  ✗ hrExperienceLevels error:", e.message); }

// Seed hrDocumentTypes
try {
  const result = await convexMutation("hrDocumentTypes", "seedDefault", {});
  console.log("  ✓ hrDocumentTypes seeded:", result?.seeded || 0);
} catch(e) { console.log("  ✗ hrDocumentTypes error:", e.message); }

// Seed financePaymentModes
try {
  const result = await convexMutation("financePaymentModes", "seedDefault", {});
  console.log("  ✓ financePaymentModes seeded:", result?.seeded || 0);
} catch(e) { console.log("  ✗ financePaymentModes error:", e.message); }

// Seed financeBankAccounts
try {
  const result = await convexMutation("financeBankAccounts", "seedDefault", {});
  console.log("  ✓ financeBankAccounts seeded:", result?.seeded || 0);
} catch(e) { console.log("  ✗ financeBankAccounts error:", e.message); }

// Seed financeTaxTypes
try {
  const result = await convexMutation("financeTaxTypes", "seedDefault", {});
  console.log("  ✓ financeTaxTypes seeded:", result?.seeded || 0);
} catch(e) { console.log("  ✗ financeTaxTypes error:", e.message); }

// Seed financeGstRates
try {
  const result = await convexMutation("financeGstRates", "seedDefault", {});
  console.log("  ✓ financeGstRates seeded:", result?.seeded || 0);
} catch(e) { console.log("  ✗ financeGstRates error:", e.message); }

// Seed financeExpenseCategories
try {
  const result = await convexMutation("financeExpenseCategories", "seedDefault", {});
  console.log("  ✓ financeExpenseCategories seeded:", result?.seeded || 0);
} catch(e) { console.log("  ✗ financeExpenseCategories error:", e.message); }

// Seed financeIncomeCategories
try {
  const result = await convexMutation("financeIncomeCategories", "seedDefault", {});
  console.log("  ✓ financeIncomeCategories seeded:", result?.seeded || 0);
} catch(e) { console.log("  ✗ financeIncomeCategories error:", e.message); }

// Seed financeFeeCategories
try {
  const result = await convexMutation("financeFeeCategories", "seedDefault", {});
  console.log("  ✓ financeFeeCategories seeded:", result?.seeded || 0);
} catch(e) { console.log("  ✗ financeFeeCategories error:", e.message); }

// Seed financeDiscountCategories
try {
  const result = await convexMutation("financeDiscountCategories", "seedDefault", {});
  console.log("  ✓ financeDiscountCategories seeded:", result?.seeded || 0);
} catch(e) { console.log("  ✗ financeDiscountCategories error:", e.message); }

// Seed financeCurrencies
try {
  const result = await convexMutation("financeCurrencies", "seedDefault", {});
  console.log("  ✓ financeCurrencies seeded:", result?.seeded || 0);
} catch(e) { console.log("  ✗ financeCurrencies error:", e.message); }

// Seed financeFinancialYears
try {
  const result = await convexMutation("financeFinancialYears", "seedDefault", {});
  console.log("  ✓ financeFinancialYears seeded:", result?.seeded || 0);
} catch(e) { console.log("  ✗ financeFinancialYears error:", e.message); }

// Seed academicClassrooms
try {
  const result = await convexMutation("academicClassrooms", "seedDefault", {});
  console.log("  ✓ academicClassrooms seeded:", result?.seeded || 0);
} catch(e) { console.log("  ✗ academicClassrooms error:", e.message); }

// Seed crmIndustries
try {
  const result = await convexMutation("crmIndustries", "seedDefault", {});
  console.log("  ✓ crmIndustries seeded:", result?.seeded || 0);
} catch(e) { console.log("  ✗ crmIndustries error:", e.message); }

// Seed salesPaymentStatuses
try {
  const result = await convexMutation("salesPaymentStatuses", "seedDefault", {});
  console.log("  ✓ salesPaymentStatuses seeded:", result?.seeded || 0);
} catch(e) { console.log("  ✗ salesPaymentStatuses error:", e.message); }

// Seed salesInvoiceTypes
try {
  const result = await convexMutation("salesInvoiceTypes", "seedDefault", {});
  console.log("  ✓ salesInvoiceTypes seeded:", result?.seeded || 0);
} catch(e) { console.log("  ✗ salesInvoiceTypes error:", e.message); }

// Seed salesTaxSlabs
try {
  const result = await convexMutation("salesTaxSlabs", "seedDefault", {});
  console.log("  ✓ salesTaxSlabs seeded:", result?.seeded || 0);
} catch(e) { console.log("  ✗ salesTaxSlabs error:", e.message); }

// Seed commNotificationTypes
try {
  const result = await convexMutation("commNotificationTypes", "seedDefault", {});
  console.log("  ✓ commNotificationTypes seeded:", result?.seeded || 0);
} catch(e) { console.log("  ✗ commNotificationTypes error:", e.message); }

// Seed commEmailTemplates
try {
  const result = await convexMutation("commEmailTemplates", "seedDefault", {});
  console.log("  ✓ commEmailTemplates seeded:", result?.seeded || 0);
} catch(e) { console.log("  ✗ commEmailTemplates error:", e.message); }

// Seed commSmsTemplates
try {
  const result = await convexMutation("commSmsTemplates", "seedDefault", {});
  console.log("  ✓ commSmsTemplates seeded:", result?.seeded || 0);
} catch(e) { console.log("  ✗ commSmsTemplates error:", e.message); }

// Seed commWhatsAppTemplates
try {
  const result = await convexMutation("commWhatsAppTemplates", "seedDefault", {});
  console.log("  ✓ commWhatsAppTemplates seeded:", result?.seeded || 0);
} catch(e) { console.log("  ✗ commWhatsAppTemplates error:", e.message); }

