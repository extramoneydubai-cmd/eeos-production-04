const fs = require('fs');
const lines = fs.readFileSync('src/convex/schema.ts', 'utf8').split('\n');

// Find where defineSchema opens
let bal = 0;
let inSchema = false;
let foundIssue = false;
let lastBal = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  if (trimmed.startsWith('//')) continue;
  
  const open = (line.match(/\{/g) || []).length;
  const close = (line.match(/\}/g) || []).length;
  const prevBal = bal;
  bal += open - close;
  
  // Detect start of defineSchema
  if (trimmed.includes('export default defineSchema') && !inSchema) {
    inSchema = true;
  }
  
  if (!inSchema) continue;
  
  // Show all table definitions (lines that start with tablename: defineTable)
  if (trimmed.match(/^\w+: defineTable\(/)) {
    console.log(`L${i+1} bal=${bal} ${trimmed.substring(0,100)}`);
  }
  
  // Show lines where balance unexpectedly stays above 1 after a table should close
  if (inSchema && (trimmed.startsWith('}).index(') || trimmed === '})')) {
    if (bal > 1) {
      console.log(`WARNING L${i+1} bal=${bal} after table close: ${trimmed.substring(0,80)}`);
    }
  }
  
  // Show schema closing lines
  if (trimmed.startsWith('}, {') || trimmed.startsWith('});') || trimmed === '});') {
    console.log(`L${i+1} bal=${bal} ${trimmed.substring(0,80)}`);
  }
  
  lastBal = bal;
}

console.log(`\nFinal balance: ${bal}`);
