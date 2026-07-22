const fs = require('fs');
const path = require('path');

const repoRoot = '/tmp/repo-extracted/contents/eeos-lite-9july-01-main';
const projectRoot = '/home/project';

// Read the file list
const files = JSON.parse(fs.readFileSync('/tmp/repo-files-to-copy.json', 'utf-8'));

console.log('Copying', files.length, 'files...');

let copied = 0;
let errors = 0;

for (const relPath of files) {
  const src = path.join(repoRoot, relPath);
  const dest = path.join(projectRoot, relPath);
  
  // Create destination directory
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  try {
    // Skip if dest is a directory (shouldn't happen since we only list files)
    const content = fs.readFileSync(src);
    fs.writeFileSync(dest, content);
    copied++;
  } catch (e) {
    errors++;
    if (errors <= 5) {
      console.error('Error copying', relPath, ':', e.message);
    }
  }
}

console.log('\nCopied:', copied, 'files');
console.log('Errors:', errors);

// Also copy .env files and other dotfiles at root
console.log('\nChecking for root-level dotfiles...');
const rootEntries = fs.readdirSync(repoRoot, { withFileTypes: true });
for (const entry of rootEntries) {
  if (entry.name.startsWith('.') && !entry.isDirectory()) {
    const src = path.join(repoRoot, entry.name);
    const dest = path.join(projectRoot, entry.name);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
      console.log('  Copied:', entry.name);
    }
  }
}

console.log('\nDone!');
