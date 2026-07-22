const fs = require('fs');

// Fix salesOpportunityTypes.ts
let s = fs.readFileSync('src/convex/salesOpportunityTypes.ts', 'utf8');
let changed = false;

// Replace displayOrder with sequence
if (s.includes('displayOrder')) {
  s = s.replace(/displayOrder/g, 'sequence');
  changed = true;
}
// Replace isActive with active  
if (s.includes('isActive')) {
  s = s.replace(/isActive/g, 'active');
  changed = true;
}
if (changed) {
  fs.writeFileSync('src/convex/salesOpportunityTypes.ts', s, 'utf8');
  console.log('Fixed salesOpportunityTypes.ts');
}

// Fix salesQuotationStatuses.ts
s = fs.readFileSync('src/convex/salesQuotationStatuses.ts', 'utf8');
changed = false;
if (s.includes('displayOrder')) {
  s = s.replace(/displayOrder/g, 'sequence');
  changed = true;
}
if (s.includes('isActive')) {
  s = s.replace(/isActive/g, 'active');
  changed = true;
}
if (changed) {
  fs.writeFileSync('src/convex/salesQuotationStatuses.ts', s, 'utf8');
  console.log('Fixed salesQuotationStatuses.ts');
}

// Fix salesTerritories.ts
s = fs.readFileSync('src/convex/salesTerritories.ts', 'utf8');
changed = false;
if (s.includes('displayOrder')) {
  s = s.replace(/displayOrder/g, 'sequence');
  changed = true;
}
if (s.includes('isActive')) {
  s = s.replace(/isActive/g, 'active');
  changed = true;
}
if (changed) {
  fs.writeFileSync('src/convex/salesTerritories.ts', s, 'utf8');
  console.log('Fixed salesTerritories.ts');
}

// Also fix the frontend files to use matching field names
const frontendFiles = [
  'src/pages/studios/MasterDataSalesTerritories.tsx',
  'src/pages/studios/MasterDataSalesQuotationStatuses.tsx',
  'src/pages/studios/MasterDataSalesOpportunityTypes.tsx'
];

for (const f of frontendFiles) {
  try {
    s = fs.readFileSync(f, 'utf8');
    changed = false;
    if (s.includes('displayOrder')) {
      s = s.replace(/displayOrder/g, 'sequence');
      changed = true;
    }
    if (s.includes('isActive')) {
      s = s.replace(/isActive/g, 'active');
      changed = true;
    }
    if (changed) {
      fs.writeFileSync(f, s, 'utf8');
      console.log('Fixed frontend:', f);
    }
  } catch (e) {
    console.log('Skipped (file not found):', f);
  }
}

console.log('\nDone. All sales backend files updated to use sequence/active field names.');
