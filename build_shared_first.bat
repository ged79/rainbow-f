@echo off
cd packages\shared
echo Building shared package...
call npm run build
cd ..\..
echo Done!
pause