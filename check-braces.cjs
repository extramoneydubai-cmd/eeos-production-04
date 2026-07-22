const fs = require('fs');
const lines = fs.readFileSync('src/convex/schema.ts', 'utf8').split('\n');

// Show first 10 lines
console.log('=== First 10 lines ===');
for (let i = 0; i < Math.min(10, lines.length); i++) {
  console.log((i+1) + '|' + lines[i]);
}

// Track brace balance line by line, and find where it goes wrong
let balance = 0;
let minLine = -1;
let firstTableCloseFailure = -1;
let tablesOpen = false;

for (let i = 0; i < lines.length; i++) {
  const trimmed = lines[i].trim();
  // Skip comments for balance
  if (trimmed.startsWith('//')) continue;
  
  const openCount = (lines[i].match(/\{/g) || []).length;
  const closeCount = (lines[i].match(/\}/g) || []).length;
  balance += openCount - closeCount;
  
  if (balance < 0) {
    console.log('NEGATIVE balance at line', (i+1) + ':', trimmed.substring(0, 80));
    console.log('  Balance would be:', balance);
    balance = 0; // reset for tracking
  }
}

console.log('\nFinal brace balance:', balance);

// Now let's find the issue by checking if defineSchema has proper structure
console.log('\n=== Table count ===');
const tableNames = lines.filter(l => l.trim().match(/^\w+: defineTable\(/));
console.log('Tables defined:', tableNames.length);

// Check if the schema opens properly
const schemaStart = lines.findIndex(l => l.includes('export default defineSchema'));
console.log('defineSchema at line:', schemaStart + 1);

// Check how many braces until we close the first argument
let bal = 0;
let inFirstArg = false;
let foundFirstArgEnd = false;
for (let i = schemaStart; i < lines.length; i++) {
  const open = (lines[i].match(/\{/g) || []).length;
  const close = (lines[i].match(/\}/g) || []).length;
  
  if (i === schemaStart) {
    // export default defineSchema({  -> this opens 1 brace
    inFirstArg = true;
    bal = 1;
  } else {
    const prevBal = bal;
    bal += open - close;
    
    // When we return to balance 0, the first argument is closed
    if (inFirstArg && bal === 0 && !foundFirstArgEnd) {
      console.log('First arg closes at line', i+1 + ':', lines[i].substring(0, 60));
      foundFirstArgEnd = true;
    }
    
    if (foundFirstArgEnd && bal <= 0) {
      // We closed everything
      console.log('All closed at line', i+1, 'balance:', bal);
      // Show next few lines
      for (let j = i; j < Math.min(lines.length, i+5); j++) {
        console.log((j+1) + '|' + lines[j]);
      }
      break;
    }
  }
}
