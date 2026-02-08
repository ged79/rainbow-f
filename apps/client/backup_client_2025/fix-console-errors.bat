@echo off
echo ================================================
echo     FIX CONSOLE CLEANUP ERRORS
echo ================================================
echo.

cd C:\work_station\flower\apps\client

echo Running proper console cleaner...
echo.

node scripts\clean-console-proper.js

echo.
echo ================================================
echo Testing compilation...
echo ================================================
echo.

echo Please check if the application compiles now.
echo Run: npm run dev
echo.
pause
