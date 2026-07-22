import { readFileSync, writeFileSync } from 'fs';

let s = readFileSync('src/convex/schema.ts', 'utf8');
const lines = s.split('\n');

// Find the orphaned "(Master Data Studio)" line
const fixLineIdx = lines.findIndex(l => l.trim() === '(Master Data Studio)');
if (fixLineIdx >= 0) {
  console.log('Found orphaned line at index', fixLineIdx + 1, ':', lines[fixLineIdx]);
  
  // Check context
  for (let i = Math.max(0, fixLineIdx - 3); i < Math.min(lines.length, fixLineIdx + 4); i++) {
    console.log((i+1) + '|' + lines[i].substring(0, 100));
  }
  
  // Remove the orphaned line
  lines.splice(fixLineIdx, 1);
  s = lines.join('\n');
  writeFileSync('src/convex/schema.ts', s, 'utf8');
  
  // Verify
  s = readFileSync('src/convex/schema.ts', 'utf8');
  const stillOrphaned = s.includes('(Master Data Studio)');
  console.log('\nFix applied. Orphaned line removed:', !stillOrphaned);
  
  // Verify the 3 sales tables are present
  console.log('salesOpportunityTypes:', s.includes('salesOpportunityTypes'));
  console.log('salesQuotationStatuses:', s.includes('salesQuotationStatuses'));
  console.log('salesTerritories:', s.includes('salesTerritories'));
  console.log('Total lines:', s.split('\n').length);
} else {
  console.log('No orphaned line found. Checking for other issues...');
}
