@echo off
echo Testing PWA Build...
echo.

echo Building...
call pnpm build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo Starting production server...
    echo Open: http://localhost:3000
    echo.
    echo PWA Features:
    echo - Install prompt will appear in Chrome
    echo - Service worker active
    echo - Offline caching enabled
    echo.
    call pnpm start
) else (
    echo.
    echo Build failed. Check errors above.
)
pause