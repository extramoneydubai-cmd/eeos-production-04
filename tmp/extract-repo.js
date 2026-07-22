const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

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
console.log('Sample files:', repoFiles.slice(0, 20));
console.log('\nFirst 50 files:');
repoFiles.slice(0, 50).forEach(f => console.log('  ' + f));
