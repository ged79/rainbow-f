@echo off
echo ================================================
echo    FINAL CONSOLE CLEANUP (SAFE VERSION)
echo ================================================
echo.

cd /d C:\work_station\flower\apps\client

echo Step 1: Testing current compilation status...
echo ---------------------------------------------
call npx tsc --noEmit --skipLibCheck

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Code doesn't compile! 
    echo Fix compilation errors first.
    pause
    exit /b 1
)

echo ✅ Compilation successful!
echo.

echo Step 2: Running safe console comment script...
echo ----------------------------------------------
node scripts\safe-console-comment.js

echo.
echo Step 3: Testing compilation after cleanup...
echo --------------------------------------------
call npx tsc --noEmit --skipLibCheck

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo ✅ SUCCESS! Console cleanup complete!
    echo ================================================
    echo.
    echo Your code:
    echo - Still compiles correctly
    echo - Has console statements commented out
    echo - Is ready for production
) else (
    echo.
    echo ================================================
    echo ❌ FAILED! Something went wrong.
    echo ================================================
    echo The cleanup broke compilation.
)

echo.
pause