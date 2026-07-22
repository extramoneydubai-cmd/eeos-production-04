#!/bin/bash
# Run all EEOS seed mutations in order
# Usage: bash run-all-seeds.sh

cd "$(dirname "$0")"

echo "========================================"
echo "  EEOS Master Data Seeder"
echo "========================================"
echo ""

# ─── Helper ──────────────────────────────────────────────
run_seed() {
  local label="$1"
  local module="$2"
  local fn="$3"
  printf "  %-40s ... " "$label"
  OUTPUT=$(npx convex run "${module}:${fn}" 2>&1)
  if echo "$OUTPUT" | grep -q "seeded\|Already seeded\|true"; then
    echo "✓ $(echo $OUTPUT | head -c 80)"
  else
    echo "✗ $(echo $OUTPUT | head -c 120)"
  fi
}

# ─── Step 1: Base seed ──────────────────────────────────────
echo "▶ Step 1/4: Base seed (org, users, tasks, channels)..."
run_seed "seed:seed" "seed" "seed"
run_seed "seed:seedPasswords" "seed" "seedPasswords"
echo ""

# ─── Step 2: CRM & Courses ──────────────────────────────────
echo "▶ Step 2/4: CRM leads & courses..."
run_seed "seed:seedCrm" "seed" "seedCrm"
run_seed "seed:seedCourses" "seed" "seedCourses"
echo ""

# ─── Step 3: HR Masters ────────────────────────────────────
echo "▶ Step 3/4: HR Masters..."
run_seed "hrEmployeeCategories" "hrEmployeeCategories" "seedDefault"
run_seed "hrEmployeeTypes" "hrEmployeeTypes" "seedDefaultEmployeeTypes"
run_seed "hrEmploymentStatuses" "hrEmploymentStatuses" "seedDefaultEmploymentStatuses"
run_seed "hrWorkLocations" "hrWorkLocations" "seedDefault"
run_seed "hrSkills" "hrSkills" "seedDefault"
run_seed "hrExperienceLevels" "hrExperienceLevels" "seedDefault"
run_seed "hrDocumentTypes" "hrDocumentTypes" "seedDefault"
echo ""

# ─── Step 4: Finance Masters ────────────────────────────────
echo "▶ Step 4/4: Finance Masters..."
run_seed "financePaymentModes" "financePaymentModes" "seedDefault"
run_seed "financeBankAccounts" "financeBankAccounts" "seedDefault"
run_seed "financeTaxTypes" "financeTaxTypes" "seedDefault"
run_seed "financeGstRates" "financeGstRates" "seedDefault"
run_seed "financeExpenseCategories" "financeExpenseCategories" "seedDefault"
run_seed "financeIncomeCategories" "financeIncomeCategories" "seedDefault"
run_seed "financeFeeCategories" "financeFeeCategories" "seedDefault"
run_seed "financeDiscountCategories" "financeDiscountCategories" "seedDefault"
run_seed "financeCurrencies" "financeCurrencies" "seedDefault"
run_seed "financeFinancialYears" "financeFinancialYears" "seedDefault"
echo ""

# ─── Step 5: Academic Masters ──────────────────────────────
echo "▶ Step 5/4: Academic Masters..."
run_seed "academicVerticals" "academicVerticals" "seedDefaultAcademicVerticals"
run_seed "academicSubVerticals" "academicSubVerticals" "seedDefaultAcademicSubVerticals"
run_seed "academicBoards" "academicBoards" "seedDefaultAcademicBoards"
run_seed "academicPrograms" "academicPrograms" "seedDefaultAcademicPrograms"
run_seed "academicSubjects" "academicSubjects" "seedDefaultAcademicSubjects"
run_seed "academicStreams" "academicStreams" "seedDefaultAcademicStreams"
run_seed "academicTerms" "academicTerms" "seedDefaultAcademicTerms"
run_seed "academicSemesters" "academicSemesters" "seedDefaultAcademicSemesters"
run_seed "academicSessions" "academicSessions" "seedDefaultAcademicSessions"
run_seed "academicSections" "academicSections" "seedDefaultAcademicSections"
run_seed "academicClassrooms" "academicClassrooms" "seedDefault"
run_seed "academicLanguages" "academicLanguages" "seedDefaultAcademicLanguages"
run_seed "academicMediums" "academicMediums" "seedDefaultAcademicMediums"
run_seed "academicBatchTypes" "academicBatchTypes" "seedDefaultAcademicBatchTypes"
run_seed "academicBatches" "academicBatches" "seedDefaultAcademicBatches"
echo ""

# ─── Step 6: CRM Masters ──────────────────────────────────
echo "▶ Step 6/4: CRM Masters..."
run_seed "crmStages" "crmStages" "seedDefaultStages"
run_seed "crmSources" "crmSources" "seedDefaultSources"
run_seed "crmLostReasons" "crmLostReasons" "seedDefaultLostReasons"
run_seed "crmTags" "crmTags" "seedDefaultTags"
run_seed "crmPriorities" "crmPriorities" "seedDefaultPriorities"
run_seed "crmCampaignChannels" "crmCampaignChannels" "seedDefaultChannels"
run_seed "crmCampaignTypes" "crmCampaignTypes" "seedDefaultTypes"
run_seed "crmCounsellingOutcomes" "crmCounsellingOutcomes" "seedDefault"
run_seed "crmCounsellingTypes" "crmCounsellingTypes" "seedDefault"
run_seed "crmEnquiryTypes" "crmEnquiryTypes" "seedDefaultEnquiryTypes"
run_seed "crmReferralSources" "crmReferralSources" "seedDefault"
run_seed "crmFollowUpOutcomes" "crmFollowUpOutcomes" "seedDefaultFollowUpOutcomes"
run_seed "crmFollowUpTypes" "crmFollowUpTypes" "seedDefaultFollowUpTypes"
run_seed "crmUtmCampaigns" "crmUtmCampaigns" "seedDefaultUtmCampaigns"
run_seed "crmUtmMediums" "crmUtmMediums" "seedDefaultUtmMediums"
run_seed "crmUtmSources" "crmUtmSources" "seedDefaultUtmSources"
run_seed "crmLeadQualification" "crmLeadQualification" "seedDefault"
run_seed "crmLeadScoringRules" "crmLeadScoringRules" "seedDefault"
run_seed "crmLeadCategories" "crmLeadCategories" "seedDefault"
run_seed "crmIndustries" "crmIndustries" "seedDefault"
run_seed "crmMarketingChannels" "crmMarketingChannels" "seedDefaultMarketingChannels"
echo ""

# ─── Step 7: Sales Masters ────────────────────────────────
echo "▶ Step 7/4: Sales Masters..."
run_seed "salesOpportunityStages" "salesOpportunityStages" "seedDefault"
run_seed "salesOpportunityTypes" "salesOpportunityTypes" "seedDefault"
run_seed "salesQuotationStatuses" "salesQuotationStatuses" "seedDefault"
run_seed "salesTerritories" "salesTerritories" "seedDefault"
run_seed "salesPaymentStatuses" "salesPaymentStatuses" "seedDefault"
run_seed "salesInvoiceTypes" "salesInvoiceTypes" "seedDefault"
run_seed "salesTaxSlabs" "salesTaxSlabs" "seedDefault"
echo ""

# ─── Step 8: Communication Masters ────────────────────────
echo "▶ Step 8/4: Communication Masters..."
run_seed "commNotificationTypes" "commNotificationTypes" "seedDefault"
run_seed "commEmailTemplates" "commEmailTemplates" "seedDefault"
run_seed "commSmsTemplates" "commSmsTemplates" "seedDefault"
run_seed "commWhatsAppTemplates" "commWhatsAppTemplates" "seedDefault"
echo ""

# ─── Step 9: Organization Masters ─────────────────────────
echo "▶ Step 9/4: Organization Masters..."
run_seed "organizationBranches" "organizationBranches" "seedDefaultBranches"
run_seed "organizationCompanies" "organizationCompanies" "seedDefaultCompanies"
run_seed "organizationDepartments" "organizationDepartments" "seedDefaultDepartments"
run_seed "organizationDesignations" "organizationDesignations" "seedDefaultDesignations"
run_seed "organizationTeams" "organizationTeams" "seedDefaultTeams"
echo ""

echo "========================================"
echo "  SEED COMPLETE"
echo "========================================"
