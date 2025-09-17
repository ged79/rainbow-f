@echo off
echo ================================================
echo    VALIDATION ACTIVATION AND TEST
echo ================================================
echo.

cd C:\work_station\flower\apps\client

echo Step 1: Backing up original route...
copy src\app\api\orders\route.ts src\app\api\orders\route-original-backup.ts >nul 2>&1

echo Step 2: Activating validated route...
copy src\app\api\orders\route-validated.ts src\app\api\orders\route.ts >nul 2>&1

echo Step 3: Testing compilation with new route...
call npx tsc --noEmit --skipLibCheck

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================
    echo SUCCESS - Validation Activated!
    echo ====================================
    echo.
    echo The order API now has input validation:
    echo - Protects against negative prices
    echo - Validates phone numbers
    echo - Checks required fields
    echo - Enforces business rules
    echo.
    echo Next: Start dev server with 'npm run dev'
    echo Then test creating orders
    echo.
    echo To rollback if needed:
    echo   copy src\app\api\orders\route-original-backup.ts src\app\api\orders\route.ts
) else (
    echo.
    echo ====================================
    echo FAILED - Rolling back...
    echo ====================================
    copy src\app\api\orders\route-original-backup.ts src\app\api\orders\route.ts >nul 2>&1
    echo Rolled back to original route
)

pause