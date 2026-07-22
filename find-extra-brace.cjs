const fs = require('fs');
const path = 'src/convex/schema.ts';
const s = fs.readFileSync(path, 'utf8');
const lines = s.split('\n');

// Track brace balance
let bal = 0;
const tables = []; // track open table definitions
let currentTable = null;
let inDefineSchema = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  // Track defineSchema
  if (trimmed.includes('export default defineSchema')) {
    inDefineSchema = true;
    // Count braces in this line
    const open = (line.match(/\{/g) || []).length;
    bal += open;
    continue;
  }
  
  // Track table definition starts
  if (inDefineSchema && trimmed.match(/^\w+: defineTable\(/)) {
    currentTable = { name: trimmed.split(':')[0], line: i+1 };
    // defineTable({ opens a { inside the function call argument
    tables.push(currentTable);
  }
  
  // Count braces
  const open = (line.match(/\{/g) || []).length;
  const close = (line.match(/\}/g) || []).length;
  bal += open - close;
  
  // Track when tables close
  if (currentTable && trimmed.startsWith('})') || (currentTable && trimmed.startsWith('})'))) {
    // This may be the table closing
  }
  
  // Check for negative balance (extra closing brace)
  if (bal < 0) {
    console.log(`ERROR: Negative balance ${bal} at line ${i+1}: ${trimmed.substring(0,100)}`);
    bal = 0; // reset
  }
}

console.log(`\nTotal brace balance: ${bal}`);
console.log(`Total tables tracked: ${tables.length}`);

// Now let's trace from the beginning to find where balance first goes imbalanced
bal = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  if (trimmed.startsWith('//')) continue;
  
  const open = (line.match(/\{/g) || []).length;
  const close = (line.match(/\}/g) || []).length;
  const prevBal = bal;
  bal += open - close;
  
  // Only show lines where balance changes
  if (open !== close && (i < 10 || i > lines.length - 60)) {
    console.log(`L${i+1}: open=${open} close=${close} bal=${bal} ${line.substring(0,100)}`);
  }
}

// Fast approach: just find the difference between opening and closing braces
// Total opens vs closes
let totalOpen = 0, totalClose = 0;
for (const line of lines) {
  totalOpen += (line.match(/\{/g) || []).length;
  totalClose += (line.match(/\}/g) || []).length;
}
console.log(`\nTotal { : ${totalOpen}`);
console.log(`Total } : ${totalClose}`);
console.log(`Difference: ${totalOpen - totalClose}`);
