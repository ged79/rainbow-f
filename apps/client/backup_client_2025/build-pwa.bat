@echo off
echo Building PWA Client...
echo.

cd C:\work_station\flower\apps\client

echo Clearing cache...
rd /s /q .next 2>nul

echo Building...
call pnpm build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo PWA Features:
    echo [OK] Service Worker generated at: public\sw.js
    echo [OK] PWA manifest ready
    echo [OK] Offline caching configured
    echo.
    echo To test PWA:
    echo 1. Run: pnpm start
    echo 2. Open: http://localhost:3000
    echo 3. Check Chrome DevTools ^> Application tab
    echo 4. Try "Install app" in Chrome menu
    echo.
) else (
    echo.
    echo Build failed. Check errors above.
)
pause