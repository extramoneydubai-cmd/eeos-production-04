const fs = require('fs');
const path = 'src/convex/schema.ts';

let s = fs.readFileSync(path, 'utf8');
const lines = s.split('\n');
console.log('Total lines:', lines.length);

// Find all lines that are just "(Master Data Studio)" without leading //
const orphanLines = [];
for (let i = 0; i < lines.length; i++) {
  const trimmed = lines[i].trim();
  if (trimmed === '(Master Data Studio)' || trimmed.startsWith('(Master Data Studio)')) {
    orphanLines.push(i + 1);
  }
}
console.log('Orphaned (Master Data Studio) lines:', orphanLines.length, orphanLines.slice(0, 10));

// Also check for the exact pattern of duplicate "(Master Data Studio)" after CRM header
const duelPattern = s.match(/\(Master Data Studio\)\n  \/\/ =======/g);
console.log('Pattern: (Master Data Studio)\\n  // ======= matches:', duelPattern ? duelPattern.length : 0);

// Remove orphaned lines that are JUST "(Master Data Studio)" by themselves
// These are lines where after removing, the surrounding lines still form valid comments
let cleaned = s;
// Find " Master Data Studio)\n  // ============================" and remove the orphaned line
cleaned = cleaned.replace(/\n\(Master Data Studio\)\n  \/\/ ============================\n/g, '\n  // ============================\n');

// Check if any orphaned lines remain
const remainingOrphans = (cleaned.match(/\(Master Data Studio\)/g) || []).length;
console.log('Remaining (Master Data Studio) occurrences:', remainingOrphans);

fs.writeFileSync(path, cleaned, 'utf8');

// Final check
const final = fs.readFileSync(path, 'utf8');
console.log('Final line count:', final.split('\n').length);
console.log('salesOpportunityTypes:', final.includes('salesOpportunityTypes'));
console.log('salesQuotationStatuses:', final.includes('salesQuotationStatuses'));
console.log('salesTerritories:', final.includes('salesTerritories'));
console.log('demoOrganizations:', final.includes('demoOrganizations'));
console.log('crmMarketingChannels:', final.includes('crmMarketingChannels'));
