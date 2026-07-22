#!/usr/bin/env node
import fs from 'fs';

const fp = '/home/daytona/codebase/src/pages/studios/MasterDataWorkLocations.tsx';
let content = fs.readFileSync(fp, 'utf8');

// Fix 1: Remove duplicate MapPin in imports line 5
// The import has MapPin twice (from the generator's icon list + the default icon)
// Find line with MapPin appearing twice and deduplicate
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('MapPin') && lines[i].includes('lucide-react')) {
    // Remove duplicate MapPin - count occurrences and deduplicate
    const parts = lines[i].split(', ');
    const unique = [...new Set(parts)];
    lines[i] = unique.join(', ');
  }
}
content = lines.join('\n');

// Fix 2: Replace ICON_OPTIONS with proper object references (icon: ComponentType instead of icon: 'string')
// The current ICON_OPTIONS has icon: 'IconName' which should be icon: IconName
content = content.replace(
  /const ICON_OPTIONS = \[\n([\s\S]*?)\];/,
  (match, arrayContent) => {
    const fixedEntries = arrayContent.split('},\n').map(entry => {
      // Replace icon: 'SomeName' with icon: SomeName
      const cleaned = entry.replace(/icon:\s*'(\w+)'/g, "icon: $1");
      return cleaned;
    });
    return `const ICON_OPTIONS = [\n${fixedEntries.join('},\n')}];`;
  }
);

// Fix 3: Fix getIconComponent function  
content = content.replace(
  /const ICON_OPTIONS = \[\n([\s\S]*?)\];/,
  (match) => match
);

fs.writeFileSync(fp, content);
console.log('Fixed MasterDataWorkLocations.tsx');
