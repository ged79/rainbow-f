@echo off
echo Rebuilding shared package...
cd C:\work_station\flower\packages\shared
echo Current directory: %cd%
echo.

echo 1. Cleaning old build...
rmdir /s /q dist 2>nul
echo    Cleaned
echo.

echo 2. Building package...
call pnpm build
echo.

echo 3. Checking exports...
if exist "dist\index.js" (
    echo    Main export found
)
if exist "dist\index.d.ts" (
    echo    Type definitions found
)
echo.

echo Shared package rebuild complete!
pause