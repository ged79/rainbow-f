@echo off
echo Testing TypeScript compilation with Zod...

cd C:\work_station\flower\apps\client

call npx tsc --noEmit --skipLibCheck

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS - TypeScript compiles with Zod!
) else (
    echo.
    echo FAILED - Compilation errors found
)

pause