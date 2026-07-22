import { readFileSync, writeFileSync } from 'fs';

const path = 'src/convex/schema.ts';
let s = readFileSync(path, 'utf8');

console.log('Has salesTerritories:', s.includes('salesTerritories'));
console.log('Has salesQuotationStatuses:', s.includes('salesQuotationStatuses'));
console.log('Has salesOpportunityTypes:', s.includes('salesOpportunityTypes'));

if (s.includes('salesTerritories') && s.includes('salesQuotationStatuses') && s.includes('salesOpportunityTypes')) {
  console.log('All 3 sales tables already in schema');
  process.exit(0);
}

// Find the marker right after salesOpportunityStages closes
// "}),\n\n  // ============================\n  // CRM - Lead Categories"
const marker = '}).index("sequence", ["sequence"]),\n\n  // ============================\n  // CRM - Lead Categories';
const idx = s.indexOf(marker);
if (idx < 0) {
  console.error('ERROR: CRM Lead Categories marker not found');
  process.exit(1);
}

// The insertion point is at the start of the marker
// We insert before the CRM section
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

  // ============================
  // CRM - Lead Categories (Master Data Studio)
  // ============================
`;

s = s.slice(0, idx) + salesTables + s.slice(idx + marker.length);

writeFileSync(path, s, 'utf8');
console.log('Added 3 sales tables to schema.ts');

// Verify
s = readFileSync(path, 'utf8');
console.log('Verified:');
console.log('  salesOpportunityTypes:', s.includes('salesOpportunityTypes'));
console.log('  salesQuotationStatuses:', s.includes('salesQuotationStatuses'));
console.log('  salesTerritories:', s.includes('salesTerritories'));

// Check CRM section still intact
console.log('  CRM section intact:', s.includes('crmMarketingChannels'));
