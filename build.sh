#!/bin/bash
# Build script for deployment

echo "🚀 Starting deployment build..."

# 1. Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf apps/*/dist apps/*/.next packages/*/dist

# 2. Build shared package
echo "📦 Building shared package..."
cd packages/shared
pnpm build
cd ../..

# 3. Build all apps
echo "🏗️ Building all apps..."
pnpm build

# 4. Type check
echo "✅ Running type checks..."
pnpm type-check

echo "✨ Build complete!"
echo "📝 Next steps:"
echo "1. Set production environment variables"
echo "2. Deploy to your hosting platform"
echo "3. Run database migrations"
