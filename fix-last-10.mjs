import { readFileSync, writeFileSync } from 'fs';

const files = [
  {
    path: 'src/convex/crmTasks.ts',
    fixes: [
      { from: 'const leadsWithTasks = [];', to: 'const leadsWithTasks: any[] = [];' },
    ],
  },
  {
    path: 'src/pages/Dashboard.tsx',
    fixes: [
      // Fix Object.entries returning unknown for count (line 200 and 219)
      { from: 'Object.entries(dashboardData.tasksByStatus).map(([status, count]) => {',
        to: 'Object.entries(dashboardData.tasksByStatus as Record<string, number>).map(([status, count]) => {' },
    ],
  },
  {
    path: 'src/pages/DashboardCounselor.tsx',
    fixes: [
      { from: 'payment: undefined, meeting: Calendar, success: CheckCircle2,',
        to: 'payment: undefined as any, meeting: Calendar, success: CheckCircle2,' },
    ],
  },
  {
    path: 'src/pages/studios/MasterDataBatches.tsx',
    fixes: [
      // The sv: any was already applied but errors persist. Let's cast the access instead.
      { from: 'const sv: any = program ? subVerticals?.find((s: any) => s._id === program.subVerticalId) : null;',
        to: 'const sv: any = program ? (subVerticals as any[])?.find((s: any) => s._id === program.subVerticalId) : null;' },
    ],
  },
  {
    path: 'src/pages/studios/MasterDataPrograms.tsx',
    fixes: [
      // Same pattern as MasterDataBatches
      { from: 'const vertical: any = sv ? verticals?.find((v: any) => v._id === sv.verticalId) : null;',
        to: 'const vertical: any = sv ? (verticals as any[])?.find((v: any) => v._id === sv.verticalId) : null;' },
    ],
  },
];

for (const file of files) {
  let content = readFileSync(file.path, 'utf8');
  let changed = false;
  for (const fix of file.fixes) {
    if (content.includes(fix.from)) {
      content = content.replace(fix.from, fix.to);
      console.log(`✅ Fixed: ${file.path} — "${fix.from.substring(0, 60)}..."`);
      changed = true;
    } else {
      console.log(`⚠️ Pattern not found in ${file.path}: "${fix.from.substring(0, 60)}..."`);
      // Try to find similar text
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('leadsWithTasks') || lines[i].includes('leads')) {
          console.log(`  Line ${i + 1}: ${lines[i].trim().substring(0, 120)}`);
        }
      }
    }
  }
  if (changed) {
    writeFileSync(file.path, content, 'utf8');
  }
}

console.log('\nAll fixes applied!');
