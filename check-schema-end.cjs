const fs = require('fs');
const lines = fs.readFileSync('src/convex/schema.ts', 'utf8').split('\n');
for (let i = Math.max(0, lines.length - 40); i < lines.length; i++) {
  console.log((i+1) + '|' + lines[i]);
}
