#!/bin/bash
echo "🔧 Rebuilding shared package..."
cd C:/work_station/flower/packages/shared
echo "Current directory: $(pwd)"
echo ""

echo "1. Cleaning old build..."
rm -rf dist
echo "   ✓ Cleaned"
echo ""

echo "2. Building package..."
pnpm build
echo ""

echo "3. Checking exports..."
if [ -f "dist/index.js" ]; then
    echo "   ✓ Main export found"
fi
if [ -f "dist/index.d.ts" ]; then
    echo "   ✓ Type definitions found"
fi
echo ""

echo "✅ Shared package rebuild complete!"