@echo off
echo Installing PWA dependencies...
echo.

echo Step 1: Installing next-pwa
call pnpm add next-pwa

echo.
echo Step 2: Installing workbox dependencies
call pnpm add workbox-webpack-plugin workbox-window

echo.
echo Step 3: Creating icons directory
if not exist "public\icons" mkdir public\icons

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo IMPORTANT: Create icon files!
echo.
echo Go to: https://www.pwabuilder.com/imageGenerator
echo 1. Upload your logo (512x512 recommended)
echo 2. Download all icon sizes
echo 3. Place them in: public\icons\
echo.
echo Required icon files:
echo   icon-72x72.png
echo   icon-96x96.png
echo   icon-128x128.png
echo   icon-144x144.png
echo   icon-152x152.png
echo   icon-192x192.png
echo   icon-384x384.png
echo   icon-512x512.png
echo.
echo After adding icons, run: pnpm build
echo.
pause