@echo off
echo Testing TypeScript compilation after fix...

cd C:\work_station\flower\apps\client

call npx tsc --noEmit --skipLibCheck

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================
    echo SUCCESS - TypeScript compiles!
    echo ====================================
    echo.
    echo Validation schemas are ready to use.
) else (
    echo.
    echo ====================================
    echo FAILED - Still has compilation errors
    echo ====================================
)

pause