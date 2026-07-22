import { readFileSync, writeFileSync } from 'fs';

// Fix MasterDataBatches - use ternary instead of && to avoid unknown type inference
let c = readFileSync('src/pages/studios/MasterDataBatches.tsx', 'utf8');
c = c.replace(
  '{sv && <span className="text-[10px] text-[#9aa0a6]">{(sv as any).name}</span>}',
  '{sv ? <span className="text-[10px] text-[#9aa0a6]">{(sv as any).name}</span> : null}'
);
writeFileSync('src/pages/studios/MasterDataBatches.tsx', c);
console.log('Fixed MasterDataBatches.tsx');

// Fix MasterDataPrograms - use ternary instead of &&
c = readFileSync('src/pages/studios/MasterDataPrograms.tsx', 'utf8');
c = c.replace(
  '{vert && <span className="text-[10px] text-[#9aa0a6]">{(vert as any).name}</span>}',
  '{vert ? <span className="text-[10px] text-[#9aa0a6]">{(vert as any).name}</span> : null}'
);
writeFileSync('src/pages/studios/MasterDataPrograms.tsx', c);
console.log('Fixed MasterDataPrograms.tsx');
