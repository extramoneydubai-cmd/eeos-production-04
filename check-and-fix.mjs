import { readFileSync, writeFileSync } from 'fs';

const path = 'src/convex/schema.ts';
let s = readFileSync(path, 'utf8');

// Find the orphaned "(Master Data Studio)" text
const orphanIdx = s.indexOf('(Master Data Studio)');
console.log('First orphan found at:', orphanIdx);

// If there are multiple occurrences, check
const allMatches = [...s.matchAll(/\(Master Data Studio\)/g)];
console.log('Total occurrences:', allMatches.length);
allMatches.forEach((m, i) => console.log('  Match', i, 'at index', m.index));

// Check what's before and after the first orphan
if (orphanIdx >= 0) {
  console.log('\nContext around orphan:');
  console.log(JSON.stringify(s.substring(Math.max(0, orphanIdx - 30), orphanIdx + 50)));
  
  // Try to find the pattern and remove via direct string replacement
  // The issue is there's: CRM - Lead Categories (Master Data Studio)\n// ============================\n(Master Data Studio)
  // Two CRM headers in a row
  const pattern1 = '// CRM - Lead Categories (Master Data Studio)\n  // ============================\n(Master Data Studio)\n  // ============================';
  const replacement1 = '// CRM - Lead Categories (Master Data Studio)\n  // ============================';
  
  if (s.includes(pattern1)) {
    s = s.replace(pattern1, replacement1);
    writeFileSync(path, s, 'utf8');
    console.log('\nFixed via pattern1');
  } else {
    console.log('\nPattern1 not found exactly');
    // Try different patterns
    const pat2 = '// CRM - Lead Categories (Master Data Studio)\n  // ============================\n(Master Data Studio)';
    const rep2 = '// CRM - Lead Categories (Master Data Studio)\n  // ============================';
    if (s.includes(pat2)) {
      s = s.replace(pat2, rep2);
      writeFileSync(path, s, 'utf8');
      console.log('Fixed via pattern2');
    } else {
      console.log('Pattern2 not found either');
      // Let's try to see what exactly is at that position
      const lines = s.split('\n');
      for (let i = 1404; i < Math.min(lines.length, 1413); i++) {
        console.log((i+1) + '|' + JSON.stringify(lines[i]));
      }
    }
  }
}

// Final check
s = readFileSync(path, 'utf8');
console.log('\nFinal check:');
console.log('  Orphaned line exists:', s.includes('(Master Data Studio)'));
console.log('  File length:', s.length);
