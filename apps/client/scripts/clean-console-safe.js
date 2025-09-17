/**
 * Remove all console.log statements from production code
 * SAFE VERSION - Creates backups before modifying
 */

const fs = require('fs');
const path = require('path');

// Files to exclude from console cleaning
const EXCLUDE_FILES = [
  'logger.ts',
  'logger.js',
  'clean-console.js',
  'find-console.js',
  '.next',
  'node_modules',
  '.git',
  'test-',
  '.test.',
  '.spec.'
];

// Patterns to remove
const CONSOLE_PATTERNS = [
  /console\.(log|error|warn|info|debug|trace|table|dir|group|groupEnd|time|timeEnd|assert)\([^)]*\);?/g,
  /console\.(log|error|warn|info|debug|trace|table|dir|group|groupEnd|time|timeEnd|assert)\([^}]*\{[^}]*\}[^)]*\);?/g,
  /console\.(log|error|warn|info|debug|trace|table|dir|group|groupEnd|time|timeEnd|assert)\([^)]*\)[^;]*;/g
];

let totalRemoved = 0;
let filesModified = 0;
const modifiedFiles = [];

function shouldExclude(filePath) {
  return EXCLUDE_FILES.some(exclude => filePath.includes(exclude));
}

function cleanConsoleFromFile(filePath) {
  if (shouldExclude(filePath)) {
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  let removedCount = 0;

  // Create backup
  const backupPath = filePath + '.backup-console';
  
  CONSOLE_PATTERNS.forEach(pattern => {
    const matches = newContent.match(pattern);
    if (matches) {
      removedCount += matches.length;
      newContent = newContent.replace(pattern, '');
    }
  });

  // Clean up empty lines left behind
  newContent = newContent.replace(/^\s*[\r\n]/gm, '');
  
  if (removedCount > 0) {
    // Save backup first
    fs.writeFileSync(backupPath, content);
    // Write cleaned content
    fs.writeFileSync(filePath, newContent);
    
    console.log(`✓ Cleaned ${removedCount} console statements from ${filePath}`);
    console.log(`  Backup saved to: ${backupPath}`);
    
    totalRemoved += removedCount;
    filesModified++;
    modifiedFiles.push({
      file: filePath,
      removed: removedCount,
      backup: backupPath
    });
    return true;
  }
  
  return false;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !shouldExclude(filePath)) {
      processDirectory(filePath);
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx'))) {
      cleanConsoleFromFile(filePath);
    }
  });
}

console.log('========================================');
console.log('CONSOLE STATEMENT CLEANER - SAFE VERSION');
console.log('========================================');
console.log('');
console.log('Starting cleanup process...');
console.log('This will create backups of all modified files');
console.log('');

// Process src directory
const srcPath = path.join(__dirname, '..', 'src');
processDirectory(srcPath);

console.log('');
console.log('========================================');
console.log('CLEANUP COMPLETE');
console.log('========================================');
console.log(`Total console statements removed: ${totalRemoved}`);
console.log(`Files modified: ${filesModified}`);
console.log('');

if (modifiedFiles.length > 0) {
  // Save cleanup report
  const reportPath = path.join(__dirname, '..', 'console-cleanup-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalRemoved,
    filesModified,
    files: modifiedFiles
  }, null, 2));
  
  console.log(`Cleanup report saved to: ${reportPath}`);
  console.log('');
  console.log('TO RESTORE FILES:');
  console.log('Run: node scripts/restore-console-backups.js');
}
