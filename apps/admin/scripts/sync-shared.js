/**
 * Smart Sync Script for @flower/shared
 * Falls back to skipping if packages/shared not found (for deployment)
 */

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.resolve(__dirname, '../../../packages/shared/src');
const TARGET_DIR = path.resolve(__dirname, '../src/shared');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Check if source exists
if (!fs.existsSync(SOURCE_DIR)) {
  log('⚠️  packages/shared not found - skipping sync (deployment mode)', 'yellow');
  log('✅ Using existing src/shared/', 'green');
  process.exit(0);
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      if (entry.name.endsWith('.backup') || 
          entry.name.endsWith('_old.ts') || 
          entry.name.endsWith('.old.ts')) {
        continue;
      }
      fs.copyFileSync(srcPath, destPath);
      log(`  ✓ ${entry.name}`, 'green');
    }
  }
}

function cleanTargetDir() {
  if (fs.existsSync(TARGET_DIR)) {
    fs.rmSync(TARGET_DIR, { recursive: true, force: true });
    log('🗑️  Cleaned old shared directory', 'yellow');
  }
}

function main() {
  log('\n🔄 Starting Smart Sync...', 'blue');
  log(`📁 Source: ${SOURCE_DIR}`, 'blue');
  log(`📁 Target: ${TARGET_DIR}`, 'blue');

  try {
    cleanTargetDir();
    log('\n📦 Copying files...', 'blue');
    copyRecursive(SOURCE_DIR, TARGET_DIR);

    log('\n✅ Smart Sync completed successfully!', 'green');
    log(`📊 Admin now has an independent copy of shared code`, 'green');
    log(`💡 packages/shared remains the single source of truth\n`, 'yellow');
  } catch (error) {
    log('\n❌ Sync failed:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

main();
