#!/usr/bin/env node
// Restore schema.ts from GitHub raw, then add the 3 missing sales tables
// CommonJS version

const https = require('https');
const fs = require('fs');
const path = 'src/convex/schema.ts';

// GitHub raw URL for the original schema.ts
const rawUrl = 'https://raw.githubusercontent.com/vly-agency/eeos-client/refs/heads/main/src/convex/schema.ts';

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  console.log('Downloading original schema from GitHub...');
  let schema = await httpGet(rawUrl);
  console.log('Downloaded:', schema.length, 'chars');

  // Check if sales tables already exist
  if (schema.includes('salesTerritories') && schema.includes('salesQuotationStatuses') && schema.includes('salesOpportunityTypes')) {
    console.log('All 3 sales tables are already present');
    fs.writeFileSync(path, schema, 'utf8');
    console.log('Schema restored and verified');
    return;
  }

  // Find insertion point after salesOpportunityStages
  const marker = 'salesOpportunityStages: defineTable({';
  const stagesStart = schema.indexOf(marker);
  if (stagesStart < 0) throw new Error('salesOpportunityStages not found');

  // Find the closing of salesOpportunityStages table definition
  const indexCloser = schema.indexOf('}).index("sequence", ["sequence"]),', stagesStart);
  if (indexCloser < 0) throw new Error('salesOpportunityStages index closer not found');

  // Insert point is after the closing line
  const closerEnd = schema.indexOf('\n', indexCloser) + 1;

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

  schema = schema.slice(0, closerEnd) + salesTables + schema.slice(closerEnd);
  fs.writeFileSync(path, schema, 'utf8');
  console.log('Added 3 sales tables to schema.ts');

  // Verify
  schema = fs.readFileSync(path, 'utf8');
  console.log('Verification:');
  console.log('  salesOpportunityTypes:', schema.includes('salesOpportunityTypes'));
  console.log('  salesQuotationStatuses:', schema.includes('salesQuotationStatuses'));
  console.log('  salesTerritories:', schema.includes('salesTerritories'));
  console.log('  CRM intact:', schema.includes('crmMarketingChannels'));
  console.log('  File length:', schema.length);
}

main().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
