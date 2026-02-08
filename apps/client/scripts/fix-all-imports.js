#!/usr/bin/env node
/**
 * Comprehensive TypeScript Fix Script
 */

const fs = require('fs');
const path = require('path');

// Files to check and fix
const filesToFix = [
  'src/app/(dashboard)/dashboard/page.tsx',
  'src/app/(dashboard)/orders/page.tsx',
  'src/app/(dashboard)/orders/new/page.tsx',
  'src/app/(dashboard)/orders/[id]/page.tsx',
  'src/app/(dashboard)/points/page.tsx',
  'src/app/(dashboard)/settlements/page.tsx',
  'src/app/(dashboard)/settings/page.tsx',
  'src/services/api.ts',
  'src/services/storeService.ts'
];

// Import fixes
const importFixes = {
  "import type { Order } from '@flower/shared'": "import type { Order } from '@flower/shared/types'",
  "import { formatCurrency } from '@flower/shared'": "import { formatCurrency } from '@flower/shared/utils'",
  "import { ORDER_STATUS } from '@flower/shared'": "import { ORDER_STATUS } from '@flower/shared/constants'",
  "import { BUSINESS_RULES } from '@flower/shared'": "import { BUSINESS_RULES } from '@flower/shared/constants'",
  "from '@flower/shared'": "from '@flower/shared/types'"
};

let fixedCount = 0;

filesToFix.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  
  Object.entries(importFixes).forEach(([oldImport, newImport]) => {
    if (content.includes(oldImport)) {
      content = content.replace(new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newImport);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${file}`);
    fixedCount++;
  } else {
    console.log(`✓  OK: ${file}`);
  }
});

console.log(`\n📊 Fixed ${fixedCount} files`);
console.log('\n🔍 Next: Run "npx tsc --noEmit" to check for remaining errors');
