@echo off
echo Final Build Test...
cd C:\work_station\flower\apps\client
call pnpm build
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo BUILD SUCCESSFUL! PWA is ready!
    echo ========================================
    echo.
    echo Service Worker: public\sw.js
    echo.
    echo Next steps:
    echo 1. Generate icons at http://localhost:3000/generate-icons.html
    echo 2. Run: pnpm start
    echo 3. Test PWA installation
) else (
    echo.
    echo Build failed. Checking for more type issues...
)
pause