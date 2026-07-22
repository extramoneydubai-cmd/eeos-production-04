const fs = require('fs');
const lines = fs.readFileSync('src/convex/schema.ts', 'utf8').split('\n');

// Track brace balance and show from where it becomes wrong
let bal = 0;
let inDefineSchema = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  if (trimmed.startsWith('//')) {
    if (i >= 1760 && i <= 1790) {
      console.log((i+1) + ' [comment] ' + trimmed.substring(0, 80));
    }
    continue;
  }
  
  if (trimmed.includes('export default defineSchema')) {
    inDefineSchema = true;
    bal += (line.match(/\{/g) || []).length;
    if (i >= 1760 && i <= 1790) {
      console.log((i+1) + ' [DS open] bal=' + bal + ' ' + trimmed.substring(0, 80));
    }
    continue;
  }
  
  const open = (line.match(/\{/g) || []).length;
  const close = (line.match(/\}/g) || []).length;
  bal += open - close;
  
  if (i >= 1760 && i <= 1790) {
    console.log((i+1) + ' open=' + open + ' close=' + close + ' bal=' + bal + ' ' + trimmed.substring(0, 80));
  }
}

console.log('\nFinal balance:', bal);

// Now show lines 1750-1775 in full
console.log('\n=== Full lines 1750-1775 ===');
for (let i = 1750; i < Math.min(lines.length, 1775); i++) {
  console.log((i+1) + '|' + lines[i]);
}
