#!/usr/bin/env node
/**
 * Simple Type Check - No dependencies needed
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Running TypeScript diagnostics...\n');

try {
  // Run tsc with noEmit
  execSync('npx tsc --noEmit', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✅ No TypeScript errors found!');
} catch (error) {
  console.log('\n❌ TypeScript errors found. Please fix them.');
  process.exit(1);
}
