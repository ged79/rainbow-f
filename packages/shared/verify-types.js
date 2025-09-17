// Verify OrderWithStores is properly exported
const fs = require('fs');
const path = require('path');

console.log('Verifying shared package types...\n');

// Check source
const srcPath = path.join(__dirname, 'src', 'types', 'index.ts');
const srcContent = fs.readFileSync(srcPath, 'utf8');
const hasOrderWithStoresInSrc = srcContent.includes('export interface OrderWithStores');
console.log(`✓ Source has OrderWithStores: ${hasOrderWithStoresInSrc}`);

// Check built files
const distPath = path.join(__dirname, 'dist', 'types', 'index.d.ts');
if (fs.existsSync(distPath)) {
  const distContent = fs.readFileSync(distPath, 'utf8');
  const hasOrderWithStoresInDist = distContent.includes('interface OrderWithStores');
  console.log(`✓ Dist has OrderWithStores: ${hasOrderWithStoresInDist}`);
  
  if (!hasOrderWithStoresInDist && hasOrderWithStoresInSrc) {
    console.log('\n⚠️ ISSUE: OrderWithStores in source but NOT in dist!');
    console.log('Action needed: Run "pnpm build" in shared package');
  }
} else {
  console.log('✗ Dist not found - run build first');
}

// List all exported types
console.log('\nExported types from shared:');
const typeMatches = srcContent.match(/export interface (\w+)/g);
if (typeMatches) {
  typeMatches.forEach(m => console.log('  -', m.replace('export interface ', '')));
}
