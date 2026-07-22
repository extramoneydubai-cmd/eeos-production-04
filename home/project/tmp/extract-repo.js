import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zipPath = '/tmp/repo.zip';
const extractPath = '/tmp/repo-extracted';
const projectRoot = '/home/project';

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

// List all files in the repo (excluding node_modules, .git)
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
console.log('\n=== Package.json ===');
const pkgPath = path.join(sourcePath, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  console.log('Name:', pkg.name);
  console.log('Scripts:', Object.keys(pkg.scripts || {}));
  console.log('Deps:', Object.keys(pkg.dependencies || {}).length);
}

console.log('\n=== Directory Structure (first 80 entries) ===');
repoFiles.slice(0, 80).forEach(f => console.log('  ' + f));
