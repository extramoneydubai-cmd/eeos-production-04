const fs = require('fs');
const lines = fs.readFileSync('src/convex/schema.ts', 'utf8').split('\n');

// Show the last 50 lines
console.log('=== Last 50 lines ===');
for (let i = Math.max(0, lines.length - 50); i < lines.length; i++) {
  const line = lines[i];
  const openCount = (line.match(/\{/g) || []).length;
  const closeCount = (line.match(/\}/g) || []).length;
  const net = openCount - closeCount;
  if (net !== 0 || line.includes('}') || line.includes('{')) {
    console.log((i+1) + '|' + line + '  [braces: +' + openCount + ' -' + closeCount + ' = ' + net + ']');
  } else {
    console.log((i+1) + '|' + line);
  }
}

// Count total brace balance
let balance = 0;
for (let i = 0; i < lines.length; i++) {
  const openCount = (lines[i].match(/\{/g) || []).length;
  const closeCount = (lines[i].match(/\}/g) || []).length;
  balance += openCount - closeCount;
  if (balance < 0) {
    console.log('\nNEGATIVE balance at line', (i+1) + ':', lines[i]);
  }
}
console.log('\nTotal brace balance:', balance);

// Show the last table definition fully
console.log('\n=== Last 800 chars ===');
const s = fs.readFileSync('src/convex/schema.ts', 'utf8');
console.log(s.substring(s.length - 800));
