const fs = require('fs');
const path = require('path');

// Find the most nested eeos-lite-9july-01-main folder
const extractBase = '/tmp/repo-extracted/contents';
function findRepoRoot(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory() && e.name.startsWith('eeos-lite-9july-01')) {
      const sub = path.join(dir, e.name);
      const subEntries = fs.readdirSync(sub, { withFileTypes: true });
      const nestedRepo = subEntries.find(s => s.isDirectory() && s.name.startsWith('eeos-lite-9july-01'));
      if (nestedRepo) {
        return findRepoRoot(sub);
      }
      return sub;
    }
  }
  return dir;
}

const repoRoot = findRepoRoot(extractBase);
console.log('Repo root:', repoRoot);

const projectRoot = '/home/project';

// List all files to copy, excluding node_modules and .git
function listAllFiles(dir, relativePath) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.env' || entry.name === '.env.local') continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = relativePath ? path.join(relativePath, entry.name) : entry.name;
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

const files = listAllFiles(repoRoot);
console.log('Files to copy:', files.length);

// Save the file list
fs.writeFileSync('/tmp/repo-files-to-copy.json', JSON.stringify(files, null, 2));
fs.writeFileSync('/tmp/repo-root-path.txt', repoRoot);
console.log('Repo root saved to /tmp/repo-root-path.txt');
console.log('Files list saved to /tmp/repo-files-to-copy.json');
console.log('\nFirst 30 files:');
files.slice(0, 30).forEach(f => console.log('  ' + f));
