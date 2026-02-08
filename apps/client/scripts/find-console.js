#!/usr/bin/env node
/**
 * Find all console.log statements
 * Safe approach - just find, don't auto-remove
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src');
let totalCount = 0;
const filesList = [];

function findConsoleLog(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.')) {
      findConsoleLog(filePath);
    } else if ((file.endsWith('.ts') || file.endsWith('.tsx')) && !file.endsWith('.d.ts')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      let fileCount = 0;
      const locations = [];
      
      lines.forEach((line, index) => {
        if (line.includes('console.log') || 
            line.includes('console.error') || 
            line.includes('console.warn') ||
            line.includes('console.debug')) {
          fileCount++;
          locations.push({
            line: index + 1,
            content: line.trim().substring(0, 80)
          });
        }
      });
      
      if (fileCount > 0) {
        filesList.push({
          file: path.relative(process.cwd(), filePath),
          count: fileCount,
          locations
        });
        totalCount += fileCount;
      }
    }
  });
}

console.log('🔍 Scanning for console statements...\n');
findConsoleLog(srcDir);

if (filesList.length === 0) {
  console.log('✅ No console statements found!');
} else {
  console.log(`⚠️  Found ${totalCount} console statements in ${filesList.length} files:\n`);
  
  filesList.forEach(item => {
    console.log(`📁 ${item.file} (${item.count} occurrences)`);
    item.locations.forEach(loc => {
      console.log(`   Line ${loc.line}: ${loc.content}`);
    });
    console.log('');
  });
  
  // Save report
  fs.writeFileSync('console-statements.json', JSON.stringify(filesList, null, 2));
  console.log('📄 Report saved to console-statements.json');
  console.log('\n⚠️  Review each console statement before removing!');
  console.log('Some might be needed for error handling.');
}
