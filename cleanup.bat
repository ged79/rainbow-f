@echo off
REM Safe cleanup script for flower homepage
REM Run as Administrator

echo Starting safe cleanup...

REM Create backup first
set BACKUP_DIR=..\flower_backup_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%
echo Creating backup at %BACKUP_DIR%
xcopy /E /I /Y . "%BACKUP_DIR%"

REM Remove backup files
echo Removing backup files...
del /Q "apps\homepage\src\app\api\orders\route.backup.ts" 2>nul
del /Q "apps\homepage\src\app\order\page_mobile_fixed.tsx" 2>nul
del /Q "apps\homepage\src\app\order\page_original.tsx" 2>nul
del /Q "apps\homepage\.env.backup" 2>nul
del /Q "packages\shared\src\types\index.ts.backup" 2>nul
del /Q "packages\shared\src\types\index_old.ts" 2>nul

REM Remove directories
echo Removing archive directories...
rmdir /S /Q "apps\homepage\src\components\_archive" 2>nul
rmdir /S /Q "packages\shared_backup_20250117" 2>nul

REM Clean .next cache
echo Cleaning .next cache...
rmdir /S /Q "apps\homepage\.next" 2>nul

echo.
echo Cleanup complete!
echo Backup saved at: %BACKUP_DIR%
pause
