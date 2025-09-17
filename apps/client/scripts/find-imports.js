#!/usr/bin/env node
/**
 * Find and fix imports manually
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src');

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

console.log('Searching for @flower/shared imports...\n');

const files = findFiles(srcDir);
const filesWithImports = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  if (content.includes('@flower/shared')) {
    filesWithImports.push(file);
    
    // Extract import lines
    const lines = content.split('\n');
    const importLines = lines.filter(line => 
      line.includes('@flower/shared') && line.includes('import')
    );
    
    console.log(`📁 ${path.relative(process.cwd(), file)}`);
    importLines.forEach(line => {
      console.log(`   ${line.trim()}`);
    });
  }
});

console.log(`\n📊 Found ${filesWithImports.length} files with @flower/shared imports`);

// Generate fix suggestions
console.log('\n🔧 Fix suggestions:');
console.log('1. Type imports should use: @flower/shared/types');
console.log('2. formatCurrency should use: @flower/shared/utils');
console.log('3. Constants should use: @flower/shared/constants');
