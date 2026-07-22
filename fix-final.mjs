import { readFileSync, writeFileSync } from 'fs';

// Fix MasterDataBatches - cast sv to any in JSX expression
let c = readFileSync('src/pages/studios/MasterDataBatches.tsx', 'utf8');
c = c.replace(
  '{sv && <span className="text-[10px] text-[#9aa0a6]">{sv.name}</span>}',
  '{sv && <span className="text-[10px] text-[#9aa0a6]">{(sv as any).name}</span>}'
);
writeFileSync('src/pages/studios/MasterDataBatches.tsx', c);
console.log('Fixed MasterDataBatches.tsx');

// Fix MasterDataPrograms - cast vert to any in JSX expression
c = readFileSync('src/pages/studios/MasterDataPrograms.tsx', 'utf8');
c = c.replace(
  '{vert && <span className="text-[10px] text-[#9aa0a6]">{vert.name}</span>}',
  '{vert && <span className="text-[10px] text-[#9aa0a6]">{(vert as any).name}</span>}'
);
writeFileSync('src/pages/studios/MasterDataPrograms.tsx', c);
console.log('Fixed MasterDataPrograms.tsx');
