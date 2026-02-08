@echo off
echo Cleaning TypeScript cache and testing...

cd /d C:\work_station\flower\apps\client

echo Step 1: Deleting TypeScript cache...
if exist tsconfig.tsbuildinfo del tsconfig.tsbuildinfo
if exist .next rmdir /s /q .next

echo Step 2: Testing compilation...
call npx tsc --noEmit --skipLibCheck

pause