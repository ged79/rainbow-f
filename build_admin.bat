@echo off
echo Building Admin with shared package...
cd apps\admin
call pnpm build
if %ERRORLEVEL% NEQ 0 (
    echo Admin build failed
    cd ..\..
    exit /b 1
)
echo Admin build successful!
cd ..\..
