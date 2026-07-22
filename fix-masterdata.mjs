import { readFileSync, writeFileSync, unlinkSync } from 'fs';

// Clear build cache
try { unlinkSync('./node_modules/.tmp/tsconfig.app.tsbuildinfo'); } catch {}

// Fix MasterDataBatches
let c = readFileSync('src/pages/studios/MasterDataBatches.tsx', 'utf8');
c = c.replace(
  'const sv: any = program ? (subVerticals as any[])?.find((s: any) => s._id === program.subVerticalId) : null;',
  'const sv = program ? (subVerticals as any[])?.find((s: any) => s._id === program.subVerticalId) : null as any;'
);
writeFileSync('src/pages/studios/MasterDataBatches.tsx', c);
console.log('Fixed MasterDataBatches.tsx');

// Fix MasterDataPrograms
c = readFileSync('src/pages/studios/MasterDataPrograms.tsx', 'utf8');
c = c.replace(
  'const vertical: any = sv ? (verticals as any[])?.find((v: any) => v._id === sv.verticalId) : null;',
  'const vertical = sv ? (verticals as any[])?.find((v: any) => v._id === sv.verticalId) : null as any;'
);
writeFileSync('src/pages/studios/MasterDataPrograms.tsx', c);
console.log('Fixed MasterDataPrograms.tsx');
