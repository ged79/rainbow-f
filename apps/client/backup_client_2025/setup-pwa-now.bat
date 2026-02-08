@echo off
echo ========================================
echo PWA Setup for Flower Delivery Client
echo ========================================
echo.

cd C:\work_station\flower\apps\client

echo Step 1: Installing PWA dependencies...
call pnpm add next-pwa@5.6.0 workbox-webpack-plugin workbox-window

echo.
echo Step 2: Creating temporary icons...
if not exist "public\icons" mkdir public\icons

echo.
echo Step 3: Creating placeholder icon (to stop warnings)...
echo Creating placeholder SVG icon...

pause