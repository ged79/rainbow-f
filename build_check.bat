@echo off
echo Building all apps to check types...
echo.

echo [1/3] Building Admin...
cd apps\admin
call npm run build > build.log 2>&1
if %errorlevel% neq 0 (
    echo Admin build failed! Check apps\admin\build.log
    type build.log | findstr /i "error"
) else (
    echo Admin OK
)
cd ..\..

echo.
echo [2/3] Building Client...
cd apps\client
call npm run build > build.log 2>&1
if %errorlevel% neq 0 (
    echo Client build failed! Check apps\client\build.log
    type build.log | findstr /i "error"
) else (
    echo Client OK
)
cd ..\..

echo.
echo [3/3] Building Homepage...
cd apps\homepage
call npm run build > build.log 2>&1
if %errorlevel% neq 0 (
    echo Homepage build failed! Check apps\homepage\build.log
    type build.log | findstr /i "error"
) else (
    echo Homepage OK
)
cd ..\..

echo.
echo Build check complete!
pause