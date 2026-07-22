import { readFileSync, writeFileSync } from 'fs';

const path = 'src/convex/schema.ts';
let s = readFileSync(path, 'utf8');

// Check if sales tables already exist
const hasTerritories = s.includes('salesTerritories');
const hasQuotationStatuses = s.includes('salesQuotationStatuses');
const hasOpportunityTypes = s.includes('salesOpportunityTypes');

console.log('Before fix:');
console.log('  salesTerritories:', hasTerritories);
console.log('  salesQuotationStatuses:', hasQuotationStatuses);
console.log('  salesOpportunityTypes:', hasOpportunityTypes);

if (hasTerritories && hasQuotationStatuses && hasOpportunityTypes) {
  console.log('  All 3 sales tables already present - no changes needed');
  process.exit(0);
}

// Find the end of salesOpportunityStages definition
const stagesIdx = s.indexOf('salesOpportunityStages');
if (stagesIdx < 0) {
  console.error('ERROR: salesOpportunityStages not found in schema');
  process.exit(1);
}

// Find the end of the salesOpportunityStages table definition
// It'll look like: ...index("sequence", ["sequence"]),
const afterStages = s.indexOf('salesLeadQualification', stagesIdx);
let insertPoint;
if (afterStages > 0) {
  // Find the closing of the salesLeadQualification table
  const afterLeadQual = s.indexOf('\n  //', afterStages);
  insertPoint = afterLeadQual;
} else {
  console.error('ERROR: Could not find insertion point after salesOpportunityStages');
  process.exit(1);
}

// The 3 sales tables to insert
const salesTables = `
  // ─── Sales: Opportunity Types ───
  salesOpportunityTypes: defineTable({
    name: v.string(),
    code: v.string(),
    opportunityCategory: v.optional(v.string()),
    displayOrder: v.number(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ─── Sales: Quotation Statuses ───
  salesQuotationStatuses: defineTable({
    name: v.string(),
    code: v.string(),
    statusCategory: v.optional(v.string()),
    displayOrder: v.number(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

  // ─── Sales: Territories ───
  salesTerritories: defineTable({
    name: v.string(),
    code: v.string(),
    territoryType: v.optional(v.string()),
    displayOrder: v.number(),
    color: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("sequence", ["sequence"]),

`;

s = s.slice(0, insertPoint) + salesTables + s.slice(insertPoint);
writeFileSync(path, s, 'utf8');

console.log('  Added salesOpportunityTypes, salesQuotationStatuses, salesTerritories to schema');
console.log('  Inserted at position:', insertPoint);

// Verify
s = readFileSync(path, 'utf8');
console.log('\nAfter fix:');
console.log('  salesTerritories:', s.includes('salesTerritories'));
console.log('  salesQuotationStatuses:', s.includes('salesQuotationStatuses'));
console.log('  salesOpportunityTypes:', s.includes('salesOpportunityTypes'));
console.log('  Total length:', s.length);
