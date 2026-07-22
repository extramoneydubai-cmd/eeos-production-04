const fs = require('fs');
const path = 'src/convex/schema.ts';
let s = fs.readFileSync(path, 'utf8');

// Step 1: Remove orphaned lines - lines with just "(Master Data Studio)" without //
s = s.replace(/\n {2}\(Master Data Studio\)\n/g, '\n');
s = s.replace(/\n\(Master Data Studio\)\n/g, '\n');

// Step 2: Remove any duplicate comment headers
s = s.replace(/\n  \/\/ ============================\n  \/\/ CRM - Lead Categories \(Master Data Studio\)\n  \/\/ ============================\n\n  \/\/ ============================\n  \/\/ CRM - Lead Categories \(Master Data Studio\)\n  \/\/ ============================\n/g, 
  '\n  // ============================\n  // CRM - Lead Categories (Master Data Studio)\n  // ============================\n');

// Step 3: Verify the 3 sales tables exist with proper definitions
const hasSalesOptyTypes = s.includes('salesOpportunityTypes:');
const hasSalesQuotStatus = s.includes('salesQuotationStatuses:');
const hasSalesTerritories = s.includes('salesTerritories:');

console.log('Sales tables present:');
console.log('  salesOpportunityTypes:', hasSalesOptyTypes);
console.log('  salesQuotationStatuses:', hasSalesQuotStatus);
console.log('  salesTerritories:', hasSalesTerritories);

// Step 4: Check for the correct defineSchema closing
const closingIdx = s.lastIndexOf('export default schema;');
const defineSchemaEnd = s.lastIndexOf('});', closingIdx);
console.log('defineSchema closing at:', defineSchemaEnd);

// The last 3 non-empty lines before export default should be:
// }, {
//   schemaValidation: false,
// });
// export default schema;

// Write back
fs.writeFileSync(path, s, 'utf8');
console.log('Schema cleaned and saved.');

// Step 5: Final validation check - try parsing as JS
try {
  // Just check the syntax near the end
  const lines = s.split('\n');
  for (let i = Math.max(0, lines.length - 30); i < lines.length; i++) {
    console.log((i+1) + '|' + lines[i]);
  }
} catch(e) {
  console.error('Validation error:', e.message);
}
