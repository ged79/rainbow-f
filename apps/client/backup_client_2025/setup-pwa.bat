@echo off
echo 🚀 Setting up PWA for Flower Delivery Platform
echo =============================================

REM 1. Install PWA dependencies
echo.
echo 📦 Installing next-pwa...
call pnpm add next-pwa workbox-webpack-plugin

REM 2. Install additional PWA dependencies  
echo.
echo 📦 Installing PWA manifest types...
call pnpm add -D @types/web-app-manifest

REM 3. Create icons directory if not exists
echo.
echo 🎨 Setting up icons directory...
if not exist "public\icons" mkdir public\icons

REM 4. Generate icons message
echo.
echo ⚠️  IMPORTANT: You need to create icon files!
echo Please add the following icon files to public\icons\:
echo - icon-72x72.png
echo - icon-96x96.png
echo - icon-128x128.png
echo - icon-144x144.png
echo - icon-152x152.png
echo - icon-192x192.png
echo - icon-384x384.png
echo - icon-512x512.png
echo.
echo You can use: https://www.pwabuilder.com/imageGenerator

REM 5. Build for production
echo.
echo 🔨 Building for production...
call pnpm build

echo.
echo ✅ PWA Setup Complete!
echo.
echo 📝 Next Steps:
echo 1. Create icon files in public\icons\
echo 2. Test PWA locally: pnpm dev
echo 3. Deploy to production
echo.
pause