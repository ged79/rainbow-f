@echo off
echo ================================================
echo    ACTIVATE VALIDATION (WITH BACKUP)
echo ================================================
echo.

cd C:\work_station\flower\apps\client

echo Step 1: Creating backup of original route...
copy src\app\api\orders\route.ts src\app\api\orders\route-original-backup.ts

echo.
echo Step 2: Activating validated route...
copy src\app\api\orders\route-validated.ts src\app\api\orders\route.ts

echo.
echo ================================================
echo VALIDATION ACTIVATED
echo ================================================
echo.
echo The order API now has input validation!
echo.
echo To rollback if needed:
echo   copy src\app\api\orders\route-original-backup.ts src\app\api\orders\route.ts
echo.
pause