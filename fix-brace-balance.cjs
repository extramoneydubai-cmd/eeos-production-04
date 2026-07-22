const fs = require('fs');
const path = 'src/convex/schema.ts';
const s = fs.readFileSync(path, 'utf8');

// Strategy: Find the defineSchema call and validate brace balance
// Look for export default defineSchema({
const defineStart = s.indexOf('export default defineSchema({');
if (defineStart < 0) throw new Error('defineSchema not found');

// Extract everything from defineSchema onwards
const schemaContent = s.substring(defineStart);
console.log('From defineSchema to end:', schemaContent.length, 'chars');

// Count braces in the schema content
let bal = 0;
let lastLine = '';
let problematicIdx = -1;

const lines = schemaContent.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const open = (line.match(/\{/g) || []).length;
  const close = (line.match(/\}/g) || []).length;
  bal += open - close;
  
  if (bal === 0 && i > 0) {
    // We found where the defineSchema call closes
    console.log('Brace balance returns to 0 at line', i + 1, 'from defineSchema start');
    console.log('Line:', line.substring(0, 100));
    lastLine = line;
    problematicIdx = i;
    break;
  }
}

// If balance never hits 0, find where it drops to 1
if (problematicIdx < 0) {
  console.log('Brace balance never returns to 0. Final balance:', bal);
  
  // Find the highest level of nesting
  let maxBal = 0;
  bal = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const open = (line.match(/\{/g) || []).length;
    const close = (line.match(/\}/g) || []).length;
    bal += open - close;
    if (bal > maxBal) maxBal = bal;
    
    // Show lines where balance changes
    if (open !== close) {
      console.log((i+1) + ' balance=' + bal + ' ' + line.substring(0, 100));
    }
  }
  console.log('Max nesting:', maxBal);
}

// Alternative: check just the end of file
console.log('\n=== Last 40 lines of full file ===');
const allLines = s.split('\n');
const totalLines = allLines.length;
for (let i = Math.max(0, totalLines - 40); i < totalLines; i++) {
  console.log((i+1) + '|' + allLines[i]);
}
