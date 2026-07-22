const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

const zipPath = '/tmp/repo-extracted/repo.zip';
const extractPath = '/tmp/repo-extracted/contents';

console.log('Extracting zip...');
const zip = new AdmZip(zipPath);
zip.extractAllTo(extractPath, true);

const entries = fs.readdirSync(extractPath);
console.log('Extracted:', entries);

const repoFolder = entries.find(e => e.startsWith('eeos-lite-9july-01'));
if (!repoFolder) {
  console.error('Could not find repo folder in extracted zip');
  process.exit(1);
}

const sourcePath = path.join(extractPath, repoFolder);
console.log('Source folder:', sourcePath);

function listAllFiles(dir, relativePath) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = relativePath ? path.join(relativePath, entry.name) : entry.name;
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      if (entry.isDirectory()) {
        results.push(...listAllFiles(fullPath, relPath));
      } else {
        results.push(relPath);
      }
    }
  } catch (e) {
    console.error('Error reading dir:', dir, e.message);
  }
  return results;
}

const repoFiles = listAllFiles(sourcePath);
console.log('\nRepo files count:', repoFiles.length);

console.log('\n=== package.json ===');
const pkgPath = path.join(sourcePath, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  console.log('name:', pkg.name);
  console.log('type:', pkg.type);
  console.log('scripts:', JSON.stringify(pkg.scripts, null, 2));
  console.log('deps count:', Object.keys(pkg.dependencies || {}).length);
  console.log('devDeps count:', Object.keys(pkg.devDependencies || {}).length);
}

console.log('\n=== SRC Structure ===');
const srcPath = path.join(sourcePath, 'src');
if (fs.existsSync(srcPath)) {
  const srcFiles = listAllFiles(srcPath);
  srcFiles.sort().forEach(f => console.log('  src/' + f));
}

console.log('\n=== Has Master Data Framework? ===');
const hasMasterDataTable = repoFiles.some(f => f.includes('MasterDataTable'));
const hasPagesStudios = repoFiles.some(f => f.startsWith('src/pages/studios/'));
const hasConvexMasterData = repoFiles.some(f => f.startsWith('src/convex/') && f.includes('MasterData'));
console.log('MasterDataTable:', hasMasterDataTable);
console.log('pages/studios:', hasPagesStudios);
console.log('convex master data:', hasConvexMasterData);

// Save the source path for later use
fs.writeFileSync('/tmp/repo-source-path.txt', sourcePath);
fs.writeFileSync('/tmp/repo-files.txt', repoFiles.join('\n'));
console.log('\nRepo source path saved to /tmp/repo-source-path.txt');
console.log('File list saved to /tmp/repo-files.txt');
