const fs = require('fs');
const path = 'src/convex/schema.ts';
let s = fs.readFileSync(path, 'utf8');
const lines = s.split('\n');

// Count braces line by line and find the issue
let bal = 0;
let balances = [];
let allBraces = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const open = (line.match(/\{/g) || []).length;
  const close = (line.match(/\}/g) || []).length;
  const net = open - close;
  bal += net;
  balances.push({ line: i+1, net, bal, text: line.substring(0, 80).trim() });
  allBraces.push({ line: i+1, open, close, net, bal });
}

console.log('Final brace balance:', bal);

// Show all lines where balance changes (non-zero net braces)
console.log('\nLines with non-zero net braces:');
for (const b of allBraces) {
  if (b.net !== 0) {
    console.log(`  L${b.line}: +${b.open} -${b.close} = ${b.net} (bal: ${b.bal}) -> ${lines[b.line-1].substring(0,80).trim()}`);
  }
}

// Find tables that start but might not close properly
// Look for defineTable({ patterns
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('defineTable({') && !lines[i].includes('defineTable({\n')) {
    // This line has defineTable({ on it
    console.log(`\nL${i+1}: ${lines[i].substring(0,100)}`);
  }
}
