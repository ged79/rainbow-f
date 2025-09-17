@echo off
echo Building shared package...
cd packages\shared
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Build failed
    exit /b 1
)
echo.
echo Checking exports...
findstr /C:"BUSINESS_RULES" dist\index.d.ts
findstr /C:"calculateCommission" dist\utils\index.d.ts
findstr /C:"validatePhone" dist\utils\index.d.ts
echo.
echo Build complete. Check output above.
cd ..\..