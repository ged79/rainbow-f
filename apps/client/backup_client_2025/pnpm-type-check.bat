@echo off
echo === TypeScript Check with pnpm ===
echo.
cd C:\work_station\flower\apps\client
echo Running type check...
call pnpm run type-check
echo.
echo === Complete ===
pause