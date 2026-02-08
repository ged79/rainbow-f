#!/bin/bash
# PWA Setup Script for Production Deployment

echo "🚀 Setting up PWA for Flower Delivery Platform"
echo "============================================="

# 1. Install PWA dependencies
echo "📦 Installing next-pwa..."
pnpm add next-pwa workbox-webpack-plugin

# 2. Install additional PWA dependencies
echo "📦 Installing PWA manifest types..."
pnpm add -D @types/web-app-manifest

# 3. Create icons directory if not exists
echo "🎨 Setting up icons directory..."
mkdir -p public/icons

# 4. Generate icons message
echo ""
echo "⚠️  IMPORTANT: You need to create icon files!"
echo "Please add the following icon files to public/icons/:"
echo "- icon-72x72.png"
echo "- icon-96x96.png"
echo "- icon-128x128.png"
echo "- icon-144x144.png"
echo "- icon-152x152.png"
echo "- icon-192x192.png"
echo "- icon-384x384.png"
echo "- icon-512x512.png"
echo ""
echo "You can use a tool like https://www.pwabuilder.com/imageGenerator"
echo "or https://realfavicongenerator.net/ to generate these icons."

# 5. Build for production
echo ""
echo "🔨 Building for production..."
pnpm build

echo ""
echo "✅ PWA Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Create icon files in public/icons/"
echo "2. Update manifest.json with your app details"
echo "3. Test PWA locally: pnpm dev"
echo "4. Deploy to production"
echo ""
echo "🌐 For deployment, consider:"
echo "- Vercel (easiest for Next.js)"
echo "- Netlify"
echo "- Your own server with PM2"