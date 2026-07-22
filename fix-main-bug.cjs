const fs = require('fs');
const path = 'src/convex/schema.ts';
let s = fs.readFileSync(path, 'utf8');

// Fix 1: Add the missing closing }).index("sequence", ["sequence"]),
// after salesOpportunityStages fields
const pattern = '    updatedAt: v.number(),\n  \n  // ─── Sales: Opportunity Types ───';
if (s.includes(pattern)) {
  s = s.replace(pattern, 
    '    updatedAt: v.number(),\n  }).index("sequence", ["sequence"]),\n\n  // ─── Sales: Opportunity Types ───');
  console.log('Fix 1: Added missing closing to salesOpportunityStages');
} else {
  console.log('Fix 1: Pattern not found, checking alternatives...');
  // The whitespace might be different
  const altPattern = '    updatedAt: v.number(),\n\n  // ─── Sales';
  if (s.includes(altPattern)) {
    s = s.replace(altPattern,
      '    updatedAt: v.number(),\n  }).index("sequence", ["sequence"]),\n\n  // ─── Sales');
    console.log('Fix 1: Added missing closing (alt)');
  } else {
    console.log('Fix 1: Pattern still not found');
  }
}

// Fix 2: Remove duplicate CRM header lines
const dupHeader = '  // ============================\n  // CRM - Lead Categories (Master Data Studio)\n  // ============================\n  // ============================';
if (s.includes(dupHeader)) {
  s = s.replace(dupHeader,
    '  // ============================\n  // CRM - Lead Categories (Master Data Studio)\n  // ============================');
  console.log('Fix 2: Removed duplicate CRM header');
} else {
  console.log('Fix 2: Pattern not found, checking alt...');
  const altDup = '// ============================\n  // ============================';
  if (s.includes(altDup)) {
    s = s.replace(altDup, '// ============================');
    console.log('Fix 2: Fixed using alt pattern');
  } else {
    console.log('Fix 2: No duplicate header');
  }
}

fs.writeFileSync(path, s, 'utf8');
console.log('\nSchema saved. Verifying...');

s = fs.readFileSync(path, 'utf8');
// Check if fix 1 worked
const stagesEnd = s.indexOf('salesOpportunityStages');
const afterStages = s.substring(stagesEnd, stagesEnd + 350);
console.log('\nAfter salesOpportunityStages:');
console.log(afterStages.substring(200, 350));
console.log('\nHas proper closing:', afterStages.includes('}).index("sequence", ["sequence"]),'));

// Check fix 2
const dupCount = (s.match(/\/\/ ============================\n  \/\/ CRM - Lead Categories/g) || []).length;
console.log('CRM Lead Categories headers:', dupCount);
