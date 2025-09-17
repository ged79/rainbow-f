@echo off
echo ========================================
echo Complete PWA Setup Script
echo ========================================
echo.

cd C:\work_station\flower\apps\client

echo Step 1: Installing next-pwa...
call pnpm add next-pwa@5.6.0

echo.
echo Step 2: Installing workbox...
call pnpm add workbox-webpack-plugin workbox-window

echo.
echo Step 3: Creating icons directory...
if not exist "public\icons" mkdir public\icons

echo.
echo ========================================
echo IMPORTANT: Generate Icons Now!
echo ========================================
echo.
echo 1. Open this file in your browser:
echo    http://localhost:3000/generate-icons.html
echo.
echo 2. Click "Generate All Icons"
echo.
echo 3. Right-click each icon link and save to:
echo    C:\work_station\flower\apps\client\public\icons\
echo.
echo 4. After saving all icons, restart your dev server
echo.
echo Your app is PWA-ready!
echo - Can be installed on mobile
echo - Works offline (cached pages)
echo - Fast loading
echo.
pause