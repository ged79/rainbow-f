#!/usr/bin/env node
/**
 * Pre-deployment safety check
 * Run this before deploying to production
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Production Deployment Check\n');

const checks = [];
let hasErrors = false;

// 1. Check for console statements
function checkConsoleStatements() {
  const srcDir = path.join(process.cwd(), 'src');
  let count = 0;
  
  function scanDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory() && !file.startsWith('.')) {
        scanDir(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const matches = (content.match(/console\.(log|debug)/g) || []).length;
        count += matches;
      }
    });
  }
  
  scanDir(srcDir);
  
  if (count > 0) {
    checks.push(`⚠️  Found ${count} console.log/debug statements`);
    hasErrors = true;
  } else {
    checks.push('✅ No console.log/debug statements');
  }
}

// 2. Check environment variables
function checkEnvVars() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const envFile = path.join(process.cwd(), '.env.production.local');
  if (!fs.existsSync(envFile)) {
    checks.push('❌ .env.production.local not found');
    hasErrors = true;
  } else {
    checks.push('✅ Production environment file exists');
  }
}

// 3. Check TypeScript errors
function checkTypeScript() {
  try {
    const { execSync } = require('child_process');
    execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'ignore' });
    checks.push('✅ No TypeScript errors');
  } catch (error) {
    checks.push('❌ TypeScript errors found');
    hasErrors = true;
  }
}

// 4. Check build size
function checkBuildSize() {
  const nextDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(nextDir)) {
    const stats = fs.statSync(nextDir);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    checks.push(`📦 Build size: ~${sizeMB} MB`);
  } else {
    checks.push('⚠️  No build found - run "pnpm build" first');
  }
}

// 5. Check for sensitive data
function checkSensitiveData() {
  const patterns = [
    /SUPABASE_SERVICE_ROLE_KEY/,
    /password\s*=\s*["'][^"']+["']/i,
    /api[_-]?key\s*=\s*["'][^"']+["']/i
  ];
  
  const srcDir = path.join(process.cwd(), 'src');
  let found = false;
  
  function scanDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory() && !file.startsWith('.')) {
        scanDir(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        patterns.forEach(pattern => {
          if (pattern.test(content)) {
            found = true;
          }
        });
      }
    });
  }
  
  scanDir(srcDir);
  
  if (found) {
    checks.push('❌ Possible sensitive data in code');
    hasErrors = true;
  } else {
    checks.push('✅ No hardcoded sensitive data');
  }
}

// Run all checks
console.log('Running checks...\n');
checkConsoleStatements();
checkEnvVars();
checkTypeScript();
checkBuildSize();
checkSensitiveData();

// Display results
console.log('\n📋 Deployment Checklist:\n');
checks.forEach(check => console.log('  ' + check));

if (hasErrors) {
  console.log('\n❌ Deployment blocked - fix issues above');
  process.exit(1);
} else {
  console.log('\n✅ Ready for deployment!');
  console.log('\n🎯 Next steps:');
  console.log('  1. Review changes: git diff');
  console.log('  2. Test production build: pnpm build:prod && pnpm start:prod');
  console.log('  3. Deploy to staging first');
  console.log('  4. Monitor for errors after deployment');
}
